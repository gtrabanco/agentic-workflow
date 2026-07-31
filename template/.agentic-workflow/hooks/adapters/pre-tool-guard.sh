#!/usr/bin/env bash

set -u

input=$(cat)
hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

if ! command -v jq >/dev/null 2>&1; then
  echo "Blocked by agentic-workflow safety policy: jq is required by this hook adapter" >&2
  exit 2
fi

if ! parsed=$(printf '%s' "$input" | jq -er '
  if type != "object" then error("hook payload must be an object")
  else
    [
      (.tool_input.command // .input.command // .toolArgs.command // .args.command // .command // ""),
      (.tool_input.file_path // .tool_input.path // .input.file_path // .input.path // .toolArgs.file_path // .toolArgs.path // .args.file_path // .args.path // .file_path // .path // "")
    ]
    | if all(.[]; type == "string") and any(.[]; length > 0)
      then @json
      else error("hook payload must contain a recognized command or path")
      end
  end
' 2>/dev/null); then
  echo "Blocked by agentic-workflow safety policy: invalid hook payload" >&2
  exit 2
fi

command_text=$(printf '%s' "$parsed" | jq -er '.[0]')
file_path=$(printf '%s' "$parsed" | jq -er '.[1]')

exec "$hooks_dir/guard-command.sh" --command "$command_text" --path "$file_path"
