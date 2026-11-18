---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(hooks): move the template hook scripts into the universal CLI

The scaffold's git hooks shipped one rule per shell file — the command guard's
regexes, the turn contract's boxes, the identity check's awk profile reader and
signing policy, the automated merge's preconditions, plus two sourced libraries.
Each now lives in the crate: `src/temp.mjs` (one temporary-directory resolution),
`src/forge.mjs` (one place a forge is named, with its fail-closed refusals),
`src/guard/command.mjs` and `src/guard/payload.mjs` (the guard's decision and the
hook-payload rule, behind `agentic-workflow guard-command`),
`src/guard/git-identity.mjs` (the `gitIdentity` profile rule and Layer 2's commit
half), `src/turn-contract.mjs` and `src/fullauto-merge.mjs`.

Every template hook is now a shim: resolve `AGENTIC_WORKFLOW_BIN` or
`command -v agentic-workflow`, exec the subcommand, forward the exit code, and
carry nothing else. Degradation is declared per capability — the guards, the turn
contract and the merge wrapper refuse and name the missing CLI, while
`index-sync`'s best-effort refresh stays a silent no-op by its own contract.
Three duplicates die with the move: the pi extension's `normalizeGitIdentity`,
the push-range checker's profile reader and JSONC parser, and `jq` as a
precondition of the payload adapters and the merge wrapper. The frozen parity
corpus (`identity-hook-parity`, `turn-contract.parity`) still proves two carriers
answer identically.
