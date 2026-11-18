#!/usr/bin/env bash
# The turn contract's shim (feature 52; unit 554).
#
# The verifier lives in the agentic-workflow CLI — `src/turn-contract.mjs`, one
# implementation behind the `turn-contract` subcommand, also shipped as
# `bin/turn-contract.mjs`. This file resolves that entry point, execs it with its
# own argv and forwards the exit code; the boxes, the forge's answer and the
# receipt are the CLI's.
#
# The verifier is invoked by a lane, not by git, so a host without the CLI cannot
# run it at all: it refuses and names the missing entry point instead of printing
# a receipt it did not compute.
#
# usage: turn-contract.sh [--finished|--remote <name>|--forge <name>|--help]
# prints exactly one line: TURN-CONTRACT ok
#                      or: TURN-CONTRACT fail box<N>: <code>

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf 'turn-contract: the agentic-workflow CLI is not installed, so the turn contract cannot be verified; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN\n' >&2
  exit 2
fi

exec "$bin" turn-contract "$@"
