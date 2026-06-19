#!/usr/bin/env bash
# SessionStart hook (OPT-IN) — re-injects the last session-log entry as context
# when a session begins, so you resume cold without re-reading docs/LOGS.md.
#
# No model, no tokens spent generating anything: it just reads the last entry
# and prints it. The ONLY cost is the input-context tokens of that entry at
# every session start — which is why this hook is opt-in. Keep entries short to
# keep that cost negligible.
#
# Wire it up in .claude/settings.json (see settings.json.example). Anything this
# script prints to stdout is added to the session as additionalContext.
set -euo pipefail

cat >/dev/null 2>&1 || true   # drain the JSON payload on stdin; we don't need it

log_file="docs/LOGS.md"
[ -f "$log_file" ] || exit 0

# Extract the last "## " entry block (from the last header to EOF).
last_entry="$(awk '
  /^## / { buf=""; cap=1 }
  cap   { buf = buf $0 "\n" }
  END   { printf "%s", buf }
' "$log_file")"

[ -n "$last_entry" ] || exit 0

printf 'Resuming context — last session log entry:\n\n%s\n' "$last_entry"
exit 0
