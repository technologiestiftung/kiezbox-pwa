#!/bin/bash
# Records the git state at session start so session-report.sh can later show
# only the changes made during this session. Never blocks the session.

# Skip the headless summary run started by session-report.sh
[ -n "$CLAUDE_SESSION_REPORT" ] && exit 0

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_DIR="$PROJECT_DIR/.claude/reports/.state"
STATE_FILE="$STATE_DIR/$SESSION_ID.json"

if [ -z "$SESSION_ID" ] || ! git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  exit 0
fi

# Keep the original baseline on resume/compact (same session id)
[ -f "$STATE_FILE" ] && exit 0

mkdir -p "$STATE_DIR"
HEAD=$(git -C "$PROJECT_DIR" rev-parse HEAD 2>/dev/null)
# Snapshot of the working tree without touching it; empty when the tree is clean
SNAPSHOT=$(git -C "$PROJECT_DIR" stash create 2>/dev/null)
UNTRACKED=$(git -C "$PROJECT_DIR" ls-files --others --exclude-standard | jq -R . | jq -s .)

jq -n --arg head "$HEAD" --arg base "${SNAPSHOT:-$HEAD}" --argjson untracked "$UNTRACKED" \
  --arg started "$(date +%Y-%m-%dT%H:%M)" \
  '{head: $head, baseline: $base, untracked: $untracked, started: $started}' >"$STATE_FILE"

exit 0
