#!/usr/bin/env bash
# Consent-installed git fast path for the doc retrieval index (unit 65).
# init-workspace installs this ONE script as the three freshness hooks —
# .git/hooks/post-merge, post-checkout, post-rewrite — and only after an
# explicit yes. Best-effort by contract: it never fails a git operation,
# never writes to stdout, and is a silent no-op when no entry point resolves
# (the grep fallback holds — AC21).
#
# Resolution (issue #718), in order:
#   1. AGENTIC_WORKFLOW_BIN — the caller's explicit override;
#   2. the machine-local pin in .agentic-workflow/hooks/runner.local, which
#      init-workspace writes from the crate's own answer
#      (`runner resolve --json doc --sync --quiet`), one argv token per line.
#      This is what makes the hook run where the crate is not on PATH (a
#      `bunx` host), without the template carrying a second runner version
#      literal;
#   3. `command -v agentic-workflow`;
#   4. no entry point — silent exit 0.
#
# usage (as any of the three hooks): index-sync.sh <hook-name...>
# always exits 0.

set -u

# Run the pinned argv verbatim (it already carries `doc --sync --quiet`).
# Returns 1 when there is no pin, so the caller falls through to the old order.
run_pinned_argv() {
  root=$(git rev-parse --show-toplevel 2>/dev/null || pwd -P)
  pin="${root}/.agentic-workflow/hooks/runner.local"
  [ -f "${pin}" ] || return 1
  argv=()
  while IFS= read -r token || [ -n "${token}" ]; do
    [ -n "${token}" ] && argv[("${#argv[@]}")]="${token}"
  done < "${pin}"
  [ "${#argv[@]}" -gt 0 ] || return 1
  "${argv[@]}" >/dev/null 2>&1 || true
  return 0
}

if [ -z "${AGENTIC_WORKFLOW_BIN:-}" ] && run_pinned_argv; then
  exit 0
fi

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  # No entry point shipped/installed — nothing to refresh; grep remains the
  # universal fallback, so this hook is a no-op, not an error.
  exit 0
fi

"$bin" doc --sync --quiet >/dev/null 2>&1 || true
exit 0
