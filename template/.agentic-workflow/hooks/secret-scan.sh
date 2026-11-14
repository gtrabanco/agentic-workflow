#!/usr/bin/env bash
#
# secret-scan.sh — the runner a target project arms as a `pre-push` hook
# (issue #552).
#
# The scan itself is `secret-scan.mjs` beside this file: one implementation,
# shared with the repository that ships it. This script only resolves a runtime
# and execs it, forwarding argv and the exit code — a rule or a pattern written
# here would be a second implementation, which is the defect the issue names.
#
# Install (by consent, never by default): `init-workspace` asks, and the hooks
# README owns the snippet — this script never writes `.git/hooks/`, because a
# self-installing hook would bypass the question. A project that chains it from
# an existing pre-push hook calls it with the hook's argv and forwards the exit.
#
# Exit: 0 the push range carries no credential shape (or every hit is
# allowlisted) · 1 a finding, the push is refused · 2 usage, including a host
# with neither runtime — a scanner that cannot look never reports nothing to see.
#
# Requirements: `bun` or `node` on PATH, and `git`. A missing requirement is
# named together with its alternative; the hook never skips itself.

set -u

case "$0" in
  */*) hook_dir=$(CDPATH='' cd -- "${0%/*}" && pwd) ;;
  *) hook_dir=$(pwd) ;;
esac

scanner="$hook_dir/secret-scan.mjs"
if [ ! -f "$scanner" ]; then
  printf 'agentic-workflow secret scan: %s is missing — the runner and the scan ship together\n' "$scanner" >&2
  exit 2
fi

if command -v bun >/dev/null 2>&1; then
  runtime=bun
elif command -v node >/dev/null 2>&1; then
  runtime=node
else
  printf '%s\n' \
    'agentic-workflow secret scan: neither bun nor node is on PATH — the scan cannot run, so the push is refused' \
    'repair (never automatic): install bun (https://bun.sh) or node (https://nodejs.org), then retry the push' >&2
  exit 2
fi

exec "$runtime" "$scanner" "$@"
