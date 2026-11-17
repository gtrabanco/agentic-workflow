#!/usr/bin/env bash
# The command guard's shim (unit 554).
#
# The decision lives in the agentic-workflow CLI — `src/guard/command.mjs`, one
# implementation behind the `guard-command` subcommand. This file resolves that
# entry point, execs it, and forwards its exit code; a template hook carries no
# rule of its own.
#
# The guard is fail-closed: a host where the CLI is not installed cannot decide,
# so it blocks and names the missing entry point rather than passing silently.
#
# usage: guard-command.sh [--command <text>] [--path <text>] [--help]
# exit:  0 allowed · 2 blocked or unusable — see the CLI's own usage.

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf 'Blocked by agentic-workflow safety policy: the agentic-workflow CLI is not installed, so this guard cannot decide; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN\n' >&2
  exit 2
fi

hook_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)

exec "$bin" guard-command --allowlist "$hook_dir/guard-allow.txt" "$@"
