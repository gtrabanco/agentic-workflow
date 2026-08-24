# TASKS — 26-staged-verification-contracts

Per-phase checklists. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — Deliver the VerificationPlan v1 contract

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new verification-plan suites.

- [x] `test/verification-plan.test.mjs` written FIRST through the public entry (red before validator)
- [x] Export `VERIFICATION_PLAN_CONTRACT_ID`, `VERIFICATION_STAGES`, `VERIFICATION_COST_CLASSES`, `WorkingDirectoryPolicy`, `VerificationCommandV1`, `VerificationPlanV1`
- [x] `validateVerificationPlanV1` structural rules: undeclared fields, contract id, non-empty command list, unique non-empty ids, stage/cost-class vocabularies, boolean `stopOnFailure`
- [x] Executable/args rules: non-empty executable, NUL rejection inside executable and args
- [x] Working-directory rules: policy ↔ nullness, relative-path validation (non-empty, no NUL, no leading `/`, no `..` segment)
- [x] Timeout rule: `timeoutMs` positive integer
- [x] `verification-plan.schema.json` + schema↔validator parity test
- [x] Surface exported from `src/index.ts`

## P2 — Deliver the VerificationReceipt v1 contract

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` →
exit 0 including the new verification-receipt suites.

- [x] `test/verification-receipt.test.mjs` written FIRST through the public entry (red before validator)
- [x] Export `VERIFICATION_RECEIPT_CONTRACT_ID`, `VERIFICATION_COMMAND_STATUSES` (5), `VERIFICATION_VERDICTS` (3), `EvidenceReferenceV1`, `VerificationResultV1`, `VerificationReceiptV1`
- [x] `validateVerificationReceiptV1` shape rules: undeclared fields, contract id, digest formats ×3, `stageRequested` vocabulary, duplicate result command-id rejection
- [x] Per-result rules: status vocabulary, exit/signal matrix (D4), ISO-8601 UTC timestamps with `endedAt ≥ startedAt`
- [x] Evidence + skip rules: ref ≤ 1024 / bytes ≥ 0 / sha256 64-hex (D5), `skipReason` null on non-skipped rows and ≤ 1024 chars when present
- [x] `verification-receipt.schema.json` + parity test on shared fixtures
- [x] Surface exported from `src/index.ts`; P1+P2 suites green together — no export collisions

## P3 — Implement the staged verification semantic core

Layer: schema · Done-when: `npm test` → exit 0 (vector/determinism/verdict/
freshness); `grep '"version"' package.json` → `"3.4.0"`.

- [x] `validateVerificationReceiptAgainstPlan`: plan-validated + receipt-validated + result ids exist + declared order + fast-stage subset + D3 fail-fast attribution + `planDigest` match + verdict consistency + unit tests
- [x] `deriveVerificationVerdict` per D2 precedence (incomplete > fail > pass) + unit tests
- [x] Canonical digest surface: `canonicalizeVerificationPlan` / `canonicalizeVerificationReceipt` / `digestVerificationPlan` / `digestVerificationReceipt` (D6) + unit tests
- [x] `compareVerificationReceiptToCurrent` with D1 codes in fixed order + unit tests
- [x] Published frozen `VERIFICATION_CANONICAL_VECTORS` + agreement tests: TS path == JSON-Schema path == published digests; determinism deep-equal
- [x] Synchronized README.md + README.es.md staged-verification section (AD-002 same-change pair)
- [x] Version `3.3.0 → 3.4.0`; `npm pack --dry-run` lists both new schema files

## P4 — Cover the mandated verification scenario matrix

Layer: hardening · Done-when: `npm test` → exit 0 with verification-scenario
suites.

- [x] Fast success + fast fail-fast scenarios end-to-end (verdicts `pass` / `fail`)
- [x] Full success + full fail-fast scenarios end-to-end, including D3 skip attribution to the failed command id
- [x] Timeout + infrastructure-error scenarios: distinct statuses, D4 matrix, verdict `fail`, never `pass`
- [x] Skipped-with-reason vs skipped-without-reason scenarios (verdict `fail` vs `incomplete`, code `incomplete-unjustified-skip`)
- [x] Missing-results + requested-full coverage-gap scenarios (codes `incomplete-missing-results` / `incomplete-stage-coverage`) + D9 vacuous-fast pin
- [x] Stale candidate + stale acceptance + stale plan scenarios (codes `stale-candidate-snapshot` / `stale-acceptance-fingerprint` / `stale-plan`)
- [x] Path-traversal + duplicate-id rejection scenarios through validate → canonicalize → digest → compare

## P5 — Hardening & PR

Layer: close-out · Done-when: gates green, PR open with `Closes #139`,
roadmap row `done · [#<pr>](<pr-url>)`.

- [ ] Re-run the project's full verification gate — `cd packages/agentic-workflow-schema && npm test` → exit 0; `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push` — branch pushed, PR branch remote-current
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes `Closes #139`
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<pr>` and push
