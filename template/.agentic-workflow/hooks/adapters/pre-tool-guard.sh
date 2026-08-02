#!/usr/bin/env bash

set -u

hooks_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

if ! parsed=$("$hooks_dir/adapters/normalize-hook-payload.sh" 2>/dev/null); then
  echo "Blocked by agentic-workflow safety policy: invalid hook payload" >&2
  exit 2
fi

command_text=$(printf '%s' "$parsed" | jq -er '.[0]')
file_path=$(printf '%s' "$parsed" | jq -er '.[1]')

exec "$hooks_dir/guard-command.sh" --command "$command_text" --path "$file_path"
