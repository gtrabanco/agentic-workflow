#!/usr/bin/env bash

set -u

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

if ! parsed=$("$hooks_dir/adapters/normalize-hook-payload.sh" 2>/dev/null); then
  printf '%s\n' '{"continue":false,"stopReason":"Blocked by agentic-workflow safety policy: invalid hook payload"}'
  exit 0
fi

command_text=$(printf '%s' "$parsed" | jq -er '.[0]')
file_path=$(printf '%s' "$parsed" | jq -er '.[1]')

set +e
reason=$("$hooks_dir/guard-command.sh" --command "$command_text" --path "$file_path" 2>&1)
status=$?
set -e

if [ "$status" -ne 0 ]; then
  jq -cn --arg reason "$reason" '{continue:false,stopReason:$reason}'
fi

exit 0
