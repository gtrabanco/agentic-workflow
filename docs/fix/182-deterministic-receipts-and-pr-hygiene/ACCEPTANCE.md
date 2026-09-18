# Acceptance manifest v1 — fix-182-deterministic-receipts-and-pr-hygiene

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The receipt runtime is a pure grammar beside one forge adapter: `render` prints the fixed SHA-bound body without a forge call; `verify` answers current / absent / stale with exit `0` / `3` / `4`; `emit` refuses a PR head that differs from the reviewed head and refuses a malformed argument set. | `node --test scripts/review-receipt.test.mjs` → exit 0 |
| AC2 | The receipt marker grammar has one owner: `scripts/audit-pr-receipt.test.mjs` imports `scripts/review-receipt.mjs` rather than redefining `REVIEW_MARKER_RE`, and its assertions pass against that runtime. | `grep -c "review-receipt.mjs" scripts/audit-pr-receipt.test.mjs` → ≥ 1 and `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 |
| AC3 | The merge gate is a closed set and receipt currency precedes it: the gate names are exactly the ten historical gates plus `tree-clean`, `branch-pushed`, `pr-ready`; an absent or stale receipt returns `BLOCKED` with `gatesEvaluated: false`; `MERGE-READY` requires every gate `pass`; a BLOCKED verdict posts no comment. | `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 |
| AC4 | Terminal hygiene is derived from state: a clean tree, a level branch and a non-draft PR pass; a dirty path is named in the blocker; an unpushed branch names its commit count; `--apply` runs only the PR-ready mechanical repair. | `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 (hygiene derivation + the `hygiene --apply` CLI repair against a fake `gh`); `node scripts/audit-pr-gate.mjs hygiene` → exit 0 on a clean tree, naming blockers otherwise |
| AC5 | Session close is append-only and single-file: `render` writes nothing; `close` refuses a log that was not appended to, commits `docs/LOGS.md` alone with a `docs(log):` subject, and reports every remaining path with exit `2` (exit `0` when none remain). | `node --test scripts/session-close.test.mjs` → exit 0 |
| AC6 | The pi extension guard blocks the unverifiable inline receipt path and warns once per settled turn on a dirty worktree, and the package suite (including the bundled mirror parity check) is green. | `cd packages/pi-agentic-workflow && bun run test` → exit 0 |
| AC7 | The three skills name their runtime: `review-change` the receipt emitter, `audit-pr` the hygiene gate runtime, `log-session` the session-close command — no prose receipt/comment path remains as the box. | `grep -c "review-receipt.mjs emit" skills/review-change/SKILL.md` → ≥ 1; `grep -c "audit-pr-gate.mjs hygiene" skills/audit-pr/SKILL.md` → ≥ 1; `grep -c "session-close.mjs close" skills/log-session/SKILL.md` → ≥ 1 |
| AC8 | Every skill route stays inside its enforced context budget, and the committed pi mirror stays byte-identical to `skills/`. | `bun scripts/check-skill-context.mjs` → exit 0; `cd packages/pi-agentic-workflow && bun run test` → exit 0 |
| AC9 | The fix-index row for #182 is registered and, after the PR opens, reads `done` with the PR link in the index's backticked done-row convention; the SPEC names the row-35 boundary decision for the reviewer. | ``grep -cE "\[#182\]\(https://github.com/gtrabanco/agentic-workflow/issues/182\) \| deterministic-receipts-and-pr-hygiene \| " docs/fix/README.md`` → 1 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node --test scripts/review-receipt.test.mjs scripts/session-close.test.mjs scripts/audit-pr-receipt.test.mjs`
- `node --test scripts/*.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `cd packages/pi-agentic-workflow && bun run test`
