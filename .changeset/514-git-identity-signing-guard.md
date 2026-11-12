---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"init-workspace": minor
---

feat(514): guard git identity and signing before a commit or a push lands

The unified config gains the base section `gitIdentity` — one approved-identity
profile (`enforce`, `approved.name/email/fullName/format/signingKey`,
`agentGuard.mode/allow`) read by three carriers, with `enforce` shipped `off` so
an install that never configures identity is never blocked.

Layer 1 (pi package): the extension reads every bash `git config` write — legacy
flags and modern subcommands alike — and asks (headless: blocks) for identity,
signing, scope-escalation and destructive writes, while read-only and `-c`
invocations pass. Approvals are persisted per project and per scope+key; a
project can allow named local writes without disabling the guard.

Layer 2 (scaffold + repo): `template/.agentic-workflow/hooks/git-identity-check.sh`
refuses a commit whose resolved author/committer is not the approved identity (or
whose signing key is absent while `commit.gpgsign` is true), prints the correct
repair forms and repairs nothing; the local gate gains the `push-identity` step
over the push range.

Repository hygiene: no test carrier writes git configuration any more — the `-c`
convention is pinned by `scripts/git-config-writes.mjs` — and every `bunfig.toml`
preloads the repository-locator scrub so a single-file test run is protected
like a gate run. The hardening annex ships as documentation; `init-workspace`
offers the hook and an empty profile block once, and applies neither without an
explicit yes.
