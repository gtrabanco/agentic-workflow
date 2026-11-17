#!/usr/bin/env bash
# The identity guard's pre-commit shim (issue #514; unit 554).
#
# Layer 2's decision lives in the agentic-workflow CLI —
# `src/guard/git-identity.mjs`, one implementation behind the
# `git-identity-check` subcommand, sharing its profile rule with the pi guard and
# with `scripts/push-identity-check.mjs`. This file resolves that entry point,
# execs it and forwards the exit code; it reads and prints, and it never repairs,
# rewrites or retries.
#
# The guard is fail-closed: a host where the CLI is not installed cannot verify
# the identity, so the commit is refused and the message names the missing entry
# point. A missing tool is never reported as an invalid profile.
#
# Install (by consent, never by default):
#   ln -s ../../.agentic-workflow/hooks/git-identity-check.sh .git/hooks/pre-commit
#   # or chain it from an existing pre-commit hook:
#   .agentic-workflow/hooks/git-identity-check.sh || exit 1
#
# Exit: 0 the commit may proceed (or the project enforces nothing on commit);
#       1 the identity, the signing key or the profile is not what the project
#         approved — the commit is refused; a host with no CLI is refused the
#         same way, because an unverified identity is never an approved one;
#         2 the argv is unusable (the CLI's own usage error).
#
# Requirements: bash, git, and the agentic-workflow CLI.

set -u

bin="${AGENTIC_WORKFLOW_BIN:-$(command -v agentic-workflow 2>/dev/null || true)}"

if [ -z "${bin}" ]; then
  printf 'agentic-workflow git identity: the agentic-workflow CLI is not installed, so the identity cannot be verified and the commit is refused; install @gtrabanco/agentic-workflow or set AGENTIC_WORKFLOW_BIN\n' >&2
  exit 1
fi

exec "$bin" git-identity-check "$@"
