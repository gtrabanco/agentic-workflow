#!/usr/bin/env bash
# The generic pre-tool adapter's shim (unit 554).
#
# Platform seam: this adapter answers in plain text on stderr. Everything else —
# which payload key carries the command, which carries the path, and whether the
# command is allowed — is the CLI's `guard-command` decision, so no adapter keeps
# a rule of its own and `jq` is no longer required anywhere.
#
# stdin: the platform's hook payload (JSON). exit: 0 allow · 2 block.

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf 'Blocked by agentic-workflow safety policy: the agentic-workflow CLI is not installed, so this guard cannot decide; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN\n' >&2
  exit 2
fi

hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)

exec "$bin" guard-command --payload --format plain --allowlist "$hook_dir/guard-allow.txt"
