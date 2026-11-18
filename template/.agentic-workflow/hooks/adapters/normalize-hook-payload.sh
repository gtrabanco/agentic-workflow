#!/usr/bin/env bash
# The payload normalizer's shim (unit 554).
#
# Platform seam: an adapter that formats its own document asks this one for the
# facts. The rule — which key carries the command, which carries the path, what
# counts as an unusable payload — is the CLI's `guard-command --format json`, one
# implementation for every platform, so this file normalizes nothing and `jq` is
# no longer required.
#
# stdin: the platform's hook payload (JSON). stdout: `["<command>","<path>"]`.
# exit: 0 normalized · 2 the payload is unusable.

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf 'normalize-hook-payload: the agentic-workflow CLI is not installed, so this payload cannot be normalized; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN\n' >&2
  exit 2
fi

exec "$bin" guard-command --payload --format json
