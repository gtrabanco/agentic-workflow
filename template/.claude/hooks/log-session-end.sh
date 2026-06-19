#!/usr/bin/env bash
# SessionEnd hook — appends a *mechanical* session entry to docs/LOGS.md on
# /clear and exit. No model, no tokens: pure git facts (branch, commits since
# the session-start marker, files touched). The rich, narrative entries come
# from the `/log-session` skill instead.
#
# Wire it up in .claude/settings.json (see settings.json.example). Reads the
# hook payload as JSON on stdin; needs only `git` and a POSIX shell.
set -euo pipefail

payload="$(cat)"
session_id="$(printf '%s' "$payload" | sed -n 's/.*"session_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
reason="$(printf '%s' "$payload" | sed -n 's/.*"reason"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
[ -n "$session_id" ] || session_id="default"
[ -n "$reason" ] || reason="exit"

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

log_file="docs/LOGS.md"
[ -f "$log_file" ] || exit 0   # only log if the project opted in with a log file

branch="$(git branch --show-current 2>/dev/null || echo "detached")"
now_iso="$(date -u +%Y-%m-%dT%H:%MZ)"

marker=".claude/.session-${session_id}.start"
if [ -f "$marker" ]; then
  read -r start_sha _start_epoch _start_iso < "$marker" || start_sha="none"
else
  start_sha="none"
fi

if [ "$start_sha" != "none" ] && git cat-file -e "${start_sha}^{commit}" 2>/dev/null; then
  range="${start_sha}..HEAD"
  commits="$(git log --oneline "$range" 2>/dev/null || true)"
  n_commits="$(printf '%s' "$commits" | grep -c . || true)"
  files="$(git diff --name-only "$range" 2>/dev/null | tr '\n' ' ' | sed 's/ *$//')"
  end_sha="$(git rev-parse --short HEAD 2>/dev/null || echo "none")"
  range_label="\`${start_sha}…${end_sha}\`"
else
  n_commits="0"
  files="$(git diff --name-only 2>/dev/null | tr '\n' ' ' | sed 's/ *$//')"
  range_label="(no marker)"
fi

[ -n "$files" ] || files="—"

{
  printf '\n## %s — %s — auto (%s)\n' "$now_iso" "$branch" "$reason"
  printf -- '- **Commits:** %s %s\n' "$n_commits" "$range_label"
  printf -- '- **Files:** %s\n' "$files"
} >> "$log_file"

rm -f "$marker" 2>/dev/null || true
exit 0
