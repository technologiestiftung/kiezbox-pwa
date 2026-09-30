#!/bin/bash
# Blocks Claude from reading/writing/editing .env files —
# either directly, via search tools, or via Bash (cat, echo, cp, sed, etc.).
# .env.example is allowed: it is committed and holds no secrets.

# Fail closed: without jq we cannot inspect the call, so block it.
if ! command -v jq >/dev/null 2>&1; then
  echo "Blocked: jq is required by .claude/hooks/block-env-access.sh. Install jq (e.g. brew install jq)." >&2
  exit 2
fi

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# A path whose file name is .env, .env.<suffix> or <name>.env — except .env.example
is_env_path() {
  local name="${1##*/}"
  [ "$name" = ".env.example" ] && return 1
  echo "$name" | grep -qE '^\.env(\..+)?$|\.env$|^\.env\*|\.env\*$'
}

# .env as a standalone path token in a command; process.env.FOO does not match
ENV_IN_COMMAND='(^|[[:space:]/"'\''=<>|;&(])\.env(\.[A-Za-z0-9_-]+)?($|[[:space:]"'\''/;|&)<>*])'

case "$TOOL_NAME" in
  Read|Write|Edit|NotebookEdit)
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.notebook_path // empty')
    if [ -n "$FILE_PATH" ] && is_env_path "$FILE_PATH"; then
      echo "Blocked: .env files are managed by developers only, not accessible to Claude." >&2
      exit 2
    fi
    ;;
  Grep|Glob)
    # Grep's pattern is the search regex, not a path; Glob's pattern is a path glob
    FIELDS="path glob"
    [ "$TOOL_NAME" = "Glob" ] && FIELDS="path pattern"
    for FIELD in $FIELDS; do
      VALUE=$(echo "$INPUT" | jq -r ".tool_input.$FIELD // empty")
      if [ -n "$VALUE" ] && is_env_path "$VALUE"; then
        echo "Blocked: searching .env files is not allowed. Ask the developer for the values you need." >&2
        exit 2
      fi
    done
    ;;
  Bash)
    COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
    if echo "$COMMAND" | sed 's/\.env\.example//g' | grep -qE "$ENV_IN_COMMAND"; then
      echo "Blocked: this command touches a .env file. Ask the developer to handle env vars directly." >&2
      exit 2
    fi
    ;;
esac

exit 0
