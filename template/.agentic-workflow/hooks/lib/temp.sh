#!/usr/bin/env bash
#
# temp.sh — the one temporary-directory resolution the hooks share (issue #546
# S8). Sourced, never executed:
#
#   hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
#   . "$hook_dir/lib/temp.sh" || exit 1
#   scratch=$(aw_mktemp_file agentic-workflow-automerge) || exit 1
#
# A Windows host sets `TEMP` (and `TMP`), a POSIX host sets `TMPDIR`, and a
# minimal container sets none of them. `${TMPDIR:-/tmp}` covers the last case on
# Unix and nothing else, and git-bash does not translate a bare `/tmp` for a
# native `mktemp`. So the candidates are tried in order and a candidate is used
# only when it is a writable directory: a path that does not resolve is skipped
# instead of producing a later, more confusing failure.
#
# Read-only apart from the file the caller asks for. It writes no configuration,
# creates nothing outside the directory it names, and never deletes anything.

# The writable temporary directory, or a non-zero exit naming what was tried.
aw_tmpdir() {
  for candidate in "${TMPDIR:-}" "${TEMP:-}" "${TMP:-}" /tmp; do
    [ -n "$candidate" ] || continue
    [ -d "$candidate" ] || continue
    [ -w "$candidate" ] || continue
    printf '%s\n' "$candidate"
    return 0
  done
  printf 'agentic-workflow: no writable temporary directory (tried TMPDIR, TEMP, TMP, /tmp)\n' >&2
  return 1
}

# aw_mktemp_file <prefix> — a fresh file in that directory, or a non-zero exit.
aw_mktemp_file() {
  directory=$(aw_tmpdir) || return 1
  mktemp "$directory/${1:-agentic-workflow}.XXXXXX"
}
