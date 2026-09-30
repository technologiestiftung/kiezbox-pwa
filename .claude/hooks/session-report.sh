#!/bin/bash
# Writes a review report to .claude/reports/ when a session ends.
# Facts come from git and the transcript; the summary is generated in the
# background by a headless `claude -p` run. Never blocks the session.

# The headless run below is itself a session — don't report on it
[ -n "$CLAUDE_SESSION_REPORT" ] && exit 0

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
REPORT_DIR="$PROJECT_DIR/.claude/reports"
STATE_DIR="$REPORT_DIR/.state"
STATE_FILE="$STATE_DIR/$SESSION_ID.json"
ERROR_LOG="$STATE_DIR/errors.log"
MODEL="${CLAUDE_SESSION_REPORT_MODEL:-claude-haiku-4-5-20251001}"

if [ -z "$SESSION_ID" ] || ! git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi
mkdir -p "$STATE_DIR"
cd "$PROJECT_DIR" || exit 0

SID8="${SESSION_ID:0:8}"

# /session-report already wrote a report for this session
if ls "$REPORT_DIR"/*_"$SID8".md >/dev/null 2>&1; then
  rm -f "$STATE_FILE"
  exit 0
fi

# --- Baseline -----------------------------------------------------------
if [ -f "$STATE_FILE" ]; then
  BASELINE=$(jq -r '.baseline' "$STATE_FILE")
  HEAD_AT_START=$(jq -r '.head' "$STATE_FILE")
  UNTRACKED_AT_START=$(jq -r '.untracked[]' "$STATE_FILE")
else
  BASELINE=$(git rev-parse HEAD 2>/dev/null)
  HEAD_AT_START="$BASELINE"
  UNTRACKED_AT_START=""
fi

# --- Facts --------------------------------------------------------------
CHANGED=$(git diff --name-only "$BASELINE" 2>/dev/null)
NEW_FILES=$(comm -13 <(echo "$UNTRACKED_AT_START" | sort) \
  <(git ls-files --others --exclude-standard | sort) | grep -v '^\.claude/reports/')

if [ -f "$TRANSCRIPT" ]; then
  TOOL_USES=$(jq -c 'select(.type == "assistant") | .message.content
    | if type == "array" then .[] else empty end | select(.type == "tool_use")' "$TRANSCRIPT" 2>/dev/null)
  EDITED=$(echo "$TOOL_USES" | jq -r 'select(.name == "Write" or .name == "Edit" or .name == "NotebookEdit")
    | .input.file_path // .input.notebook_path // empty' 2>/dev/null | sed "s|^$(pwd)/||" | sort -u)
  COMMANDS=$(echo "$TOOL_USES" | jq -r 'select(.name == "Bash") | .input.command
    | gsub("\n"; " ") | .[0:200]' 2>/dev/null)
fi

if [ -z "$CHANGED$NEW_FILES$EDITED" ]; then
  rm -f "$STATE_FILE"
  exit 0
fi

BRANCH=$(git branch --show-current 2>/dev/null)
BRANCH_SLUG=$(echo "${BRANCH:-detached}" | tr '/ ' '--' | tr -cd '[:alnum:]-_.')
REPORT="$REPORT_DIR/$(date +%Y-%m-%d_%H%M)_${BRANCH_SLUG}_${SID8}.md"
FILE_COUNT=$(printf '%s\n%s\n' "$CHANGED" "$NEW_FILES" | grep -c .)

HEADER=$(cat <<EOF
---
session_id: $SESSION_ID
date: $(date +%Y-%m-%dT%H:%M)
branch: ${BRANCH:-detached}
base_commit: $(git rev-parse --short "$HEAD_AT_START" 2>/dev/null)
files_changed: $FILE_COUNT
generated_by: session-end-hook
model: $MODEL
ai_generated: true
---
EOF
)

bullets() { [ -n "$1" ] && echo "$1" | sed 's/^/- `/; s/$/`/' || echo "- (keine)"; }

FACTS=$(cat <<EOF
## Fakten (automatisch erfasst)

**Diff-Stat seit Session-Start**

\`\`\`
$(git diff --stat "$BASELINE" 2>/dev/null)
\`\`\`

**Neue Dateien**
$(bullets "$NEW_FILES")

**Von Claude bearbeitete Dateien**
$(bullets "$EDITED")

**Von Claude ausgeführte Befehle**
$(bullets "$(echo "$COMMANDS" | head -40)")
EOF
)

# Facts-only version right away, in case the summary run fails or is killed
printf '%s\n\n> Zusammenfassung wird erstellt …\n\n%s\n' "$HEADER" "$FACTS" >"$REPORT"

# --- Summary prompt -----------------------------------------------------
PROMPT_FILE="$STATE_DIR/$SESSION_ID.prompt"
{
  cat <<'EOF'
Du erstellst einen Review-Report für eine abgeschlossene Claude-Code-Session.
Leser: Entwickler*innen, die die Änderungen verstehen und reviewen wollen.

Regeln:
- Deutsch, sachlich, knapp. Nur Markdown ausgeben, keine Einleitung.
- Nichts erfinden. Was nicht belegt ist (z. B. Tests nicht gelaufen), ausdrücklich als
  "nicht verifiziert" kennzeichnen.
- Keine Secrets, Tokens, Passwörter oder personenbezogenen Daten übernehmen — ggf. "[entfernt]".
- Beginne mit "# <Titel in einem Satz>", dann genau diese Abschnitte:

## TL;DR
## Auftrag
## Änderungen
(pro Datei: was und warum)
## Entscheidungen
## Verifikation
## Review-Hinweise
(wo genau hinschauen: Risiken, Security-/Datenschutz-relevante Stellen, Annahmen)
## Offene Punkte
## Commit-Vorschlag
(conventional commit message im Codeblock)

EOF
  echo "=== FAKTEN ==="
  echo "$FACTS"
  echo
  echo "=== DIFF (ggf. gekürzt) ==="
  truncate() { # $1 = max bytes; marks cut-off input so the summary doesn't misread it
    local content; content=$(cat)
    [ ${#content} -gt "$1" ] && printf '%s\n[… gekürzt]\n' "${content:0:$1}" || printf '%s\n' "$content"
  }
  git diff "$BASELINE" 2>/dev/null | truncate 40000
  echo "$NEW_FILES" | while IFS= read -r f; do
    [ -f "$f" ] && printf '\n--- neue Datei: %s ---\n' "$f" && truncate 4000 <"$f"
  done
  echo
  echo "=== SESSION-VERLAUF (Nutzer-Prompts und Claude-Antworten, ggf. gekürzt) ==="
  if [ -f "$TRANSCRIPT" ]; then
    jq -r '
      if .type == "user" and (.message.content | type) == "string" then
        select(.message.content | startswith("<") | not) | "NUTZER: " + .message.content
      elif .type == "assistant" and (.message.content | type) == "array" then
        .message.content[] | select(.type == "text") | "CLAUDE: " + .text
      else empty end' "$TRANSCRIPT" 2>/dev/null | tail -c 40000
  fi
} >"$PROMPT_FILE"

# --- Background summary run ---------------------------------------------
export CLAUDE_SESSION_REPORT=1
nohup bash -c '
  REPORT="$1"; PROMPT_FILE="$2"; HEADER="$3"; FACTS="$4"; MODEL="$5"; ERROR_LOG="$6"; STATE_FILE="$7"
  SUMMARY=$(claude -p --model "$MODEL" --tools "" --no-session-persistence <"$PROMPT_FILE" 2>>"$ERROR_LOG")
  if [ -n "$SUMMARY" ]; then
    printf "%s\n\n%s\n\n%s\n" "$HEADER" "$SUMMARY" "$FACTS" >"$REPORT"
  else
    echo "$(date +%FT%T) summary failed for $REPORT" >>"$ERROR_LOG"
    printf "%s\n\n> Zusammenfassung fehlgeschlagen — siehe .claude/reports/.state/errors.log\n\n%s\n" \
      "$HEADER" "$FACTS" >"$REPORT"
  fi
  rm -f "$PROMPT_FILE" "$STATE_FILE"
' _ "$REPORT" "$PROMPT_FILE" "$HEADER" "$FACTS" "$MODEL" "$ERROR_LOG" "$STATE_FILE" >/dev/null 2>&1 &
disown

exit 0
