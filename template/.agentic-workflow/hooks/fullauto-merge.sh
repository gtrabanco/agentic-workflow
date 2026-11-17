#!/usr/bin/env bash
# The automated merge wrapper's shim (issue #546; unit 554).
#
# The preconditions and the merge live in the agentic-workflow CLI —
# `src/fullauto-merge.mjs`, one implementation behind the `fullauto-merge`
# subcommand. This file resolves that entry point, execs it with its own argv and
# forwards the exit code; it holds no rule and no precondition of its own.
#
# The wrapper is the only path that merges without a human, so the shim is
# fail-closed: a host without the CLI cannot evaluate the preconditions, and
# nothing merges. The wrapper writes one transient marker under the git common
# directory and removes it on every exit; it never creates a persistent
# `.automerge` permission.
#
# usage: fullauto-merge.sh --pr <number> --run-id <id>
#                          [--method merge|squash|rebase] [--remote <name>] [--forge <name>]

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf 'fullauto-merge: the agentic-workflow CLI is not installed, so no automated merge can be authorized; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN\n' >&2
  exit 1
fi

exec "$bin" fullauto-merge "$@"
