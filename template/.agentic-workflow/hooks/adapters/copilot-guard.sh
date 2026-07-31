#!/usr/bin/env bash

set -u

input=$(cat)
hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' '{"continue":false,"stopReason":"Blocked by agentic-workflow safety policy: jq is required by this hook adapter"}'
  exit 0
fi

if ! parsed=$(printf '%s' "$input" | jq -er '
  if type != "object" then error("hook payload must be an object")
  else
    [
      (.tool_input.command // .input.command // .toolArgs.command // .args.command // .command // ""),
      (.tool_input.file_path // .tool_input.path // .input.file_path // .input.path // .toolArgs.file_path // .toolArgs.path // .args.file_path // .args.path // .file_path // .path // "")
    ]
    | if all(.[]; type == "string") then @tsv else error("hook command and path must be strings") end
  end
' 2>/dev/null); then
  printf '%s\n' '{"continue":false,"stopReason":"Blocked by agentic-workflow safety policy: invalid hook payload"}'
  exit 0
fi

command_text=${parsed%%$'\t'*}
file_path=${parsed#*$'\t'}

set +e
reason=$("$hooks_dir/guard-command.sh" --command "$command_text" --path "$file_path" 2>&1)
status=$?
set -e

if [ "$status" -ne 0 ]; then
  jq -cn --arg reason "$reason" '{continue:false,stopReason:$reason}'
fi

exit 0
