#!/usr/bin/env bash
# SessionStart hook — writes a per-session marker so the SessionEnd hook can
# compute exactly what changed during the session. No model, no tokens: it only
# records the current HEAD sha + start time.
#
# Wire it up in .claude/settings.json (see settings.json.example). Reads the
# hook payload as JSON on stdin; needs only `git` and a POSIX shell.
set -euo pipefail

payload="$(cat)"
session_id="$(printf '%s' "$payload" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[ -n "$session_id" ] || session_id="default"

# Only meaningful inside a git repo; degrade gracefully otherwise.
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  exit 0
fi

start_sha="$(git rev-parse --short HEAD 2>/dev/null || echo "none")"
start_epoch="$(date -u +%s)"
start_iso="$(date -u +%Y-%m-%dT%H:%MZ)"

marker_dir=".claude"
mkdir -p "$marker_dir"
printf '%s %s %s\n' "$start_sha" "$start_epoch" "$start_iso" \
  > "$marker_dir/.session-${session_id}.start"

exit 0
