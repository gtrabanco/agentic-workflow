#!/usr/bin/env bash
# The Copilot adapter's shim (unit 554).
#
# Platform seam: Copilot answers with a decision document
# (`{continue, stopReason}`) on stdout and always exits 0, because the host reads
# the document rather than the status. The decision itself — the payload rule and
# the command rule — is the CLI's, so this adapter names its format and nothing
# else. `jq` is no longer required.
#
# stdin: Copilot's hook payload (JSON). stdout: the decision document.

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf '%s\n' '{"continue":false,"stopReason":"Blocked by agentic-workflow safety policy: the agentic-workflow CLI is not installed, so this guard cannot decide; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN"}'
  exit 0
fi

hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

exec "$bin" guard-command --payload --format copilot --allowlist "$hook_dir/guard-allow.txt"
