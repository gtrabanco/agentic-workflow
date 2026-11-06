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
# The session-log fragment carrier (issue #405): when it exists, the entry goes
# to a fragment file and the merge-to-main aggregator is the only writer of
# docs/LOGS.md. Its presence is the opt-in — without it, this hook appends
# exactly as before.
fragment_dir=".agentic-workflow/journal"
[ -f "$log_file" ] || [ -d "$fragment_dir" ] || exit 0   # only log if the project opted in

branch="$(git branch --show-current 2>/dev/null || echo "detached")"
now_iso="$(date -u +%Y-%m-%dT%H:%MZ)"
now_second="$(date -u +%Y%m%dT%H%M%SZ)"

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

entry="$(printf '\n## %s — %s — auto (%s)\n- **Commits:** %s %s\n- **Files:** %s' "$now_iso" "$branch" "$reason" "$n_commits" "$range_label" "$files")"

# The slug twin of the crate's grammar (journal-fragment-grammar@1, owned by
# @gtrabanco/agentic-workflow's src/journal/fragment.mjs): runs of characters
# outside [A-Za-z0-9._-] become one '-', trimmed, capped at 64, empty -> x.
slug_it() {
  printf '%s' "$1" | sed -e 's/[^A-Za-z0-9._-][^A-Za-z0-9._-]*/-/g' -e 's/^-*//' -e 's/-*$//' | cut -c1-64 | sed -e 's/-*$//' -e 's/^-*//'
}
branch_slug="$(slug_it "$branch")"; [ -n "$branch_slug" ] || branch_slug="x"
session_slug="$(slug_it "$session_id")"; [ -n "$session_slug" ] || session_slug="x"

if [ -d "$fragment_dir" ]; then
  # Fragment mode: one file per entry, the name parsed back by the aggregator.
  # The file IS the entry block (no leading separator newline; the aggregator
  # adds one when it appends), newline-terminated like the direct append's bytes.
  mkdir -p "$fragment_dir"
  printf '%s\n' "${entry#?}" > "$fragment_dir/${now_second}-${branch_slug}-mechanical-${session_slug}.md" || exit 0
else
  printf '%s\n' "$entry" >> "$log_file"
fi

rm -f "$marker" 2>/dev/null || true
exit 0
