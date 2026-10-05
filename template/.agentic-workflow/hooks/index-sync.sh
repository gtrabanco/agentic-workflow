#!/usr/bin/env bash
# Consent-installed git fast path for the doc retrieval index (unit 65).
# init-workspace installs this ONE script as the three freshness hooks —
# .git/hooks/post-merge, post-checkout, post-rewrite — and only after an
# explicit yes. Best-effort by contract: it never fails a git operation,
# never writes to stdout, and is a silent no-op when the entry point is not
# installed (the grep fallback holds — AC21).
#
# usage (as any of the three hooks): index-sync.sh <hook-name...>
# always exits 0.

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  # No entry point shipped/installed — nothing to refresh; grep remains the
  # universal fallback, so this hook is a no-op, not an error.
  exit 0
fi

"$bin" doc --sync --quiet >/dev/null 2>&1 || true
exit 0
