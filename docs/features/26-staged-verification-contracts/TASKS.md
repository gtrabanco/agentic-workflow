# TASKS — 26-staged-verification-contracts

Per-phase checklists. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`. P1–P6 are
historical completed phases; P7–P15 are the user-approved 2026-08-26 replan.

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
- [x] Historical `VERIFICATION_CANONICAL_VECTORS` agreement tests landed; P7/F72 replaces the dual-path claim with authoritative-entry + generated-projection evidence
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

- [x] Re-run the project's full verification gate — `cd packages/agentic-workflow-schema && npm test` → exit 0 (310/310 pass); `node scripts/check-skill-context.mjs` → PASS; `npx skills add . --list` → exit 0
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty (all docs committed)
- [x] Set the roadmap row status to `done` and commit the flip (commit 74dac36: `docs(26): set roadmap row to done · [#145](PR), close P5`)
- [x] `git push` — branch pushed, PR branch remote-current (verified: `git status -sb` shows branch up to date with origin/feat/26-staged-verification-contracts)
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat; the body includes `Closes #139` (PR #145 open, base main, head 950a445, body includes `Closes #139`)
- [x] Update the roadmap row to `done · [#145](https://github.com/gtrabanco/agentic-workflow/pull/145)` (ROADMAP.md line 36)
- [x] Commit `docs: link PR #145` and push (commit 74dac36: `docs(26): set roadmap row to done · [#145](PR), close P5`)

## P6 — Staged-verification contract correction

Layer: schema · Done-when: `npm test` → exit 0 with all tests passing (≥ 310 tests).

- [x] Fix `compareVerificationReceiptToCurrent` to distinguish missing-results from full-coverage-gap (F31): a requested-full receipt missing declared commands must return `incomplete-stage-coverage` instead of `incomplete-missing-results` for the full commands.
- [x] Replace self-derived canonical vectors with independently fixed expected digests (F32): compute digests from fixed fixtures, hard-code them, and add tests verifying both the TypeScript path and the AJV path agree on every vector digest.
- [x] Freeze all exported vocabulary arrays (F36): add `Object.freeze()` to every closed-vocabulary array and add runtime immutability tests that attempt mutation.
- [x] Pre-validate before hashing/dereferencing in `compareVerificationReceiptToCurrent` (F33): validate the plan and receipt before any digest computation so invalid inputs return a stable freshness result rather than throwing.
- [x] Correct EN/ES README examples so they compile against TypeScript (F35): use `pv.plan` and `rv.receipt` after validation or annotate/satisfy the exported contract types.
- [x] Add immutability tests for the frozen exports.
- [x] Fix ledger structure: add the missing `class`/`route` columns to F4 and remove `ignore`-class rows (F27, F29) from the fix-now ledger (F39).
- [x] Refresh progress.md/P5 receipt after correction (F38).
- [x] Run `npm test` and confirm ≥ 310 tests.
- [x] Run `node scripts/check-skill-context.mjs` and confirm PASS.
- [x] Run `npx skills add . --list` and confirm exit 0.

## P7 — Unify validation authority

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test && node scripts/generate-verification-schemas.mjs --check` → exit 0 with authority-surface, ownership and projection suites green.

- [ ] Add red-first public export-surface assertions for exactly two runtime validation entries
- [ ] Add red-first own-property normalization fixtures for plan and receipt inputs
- [ ] Introduce one internal canonical verification-contract definition consumed by runtime validation and deterministic projection (F76)
- [ ] Make `validateVerificationPlanV1(value: unknown)` the sole plan entry and return a normalized plan DTO (F64)
- [ ] Make `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` the sole receipt entry and return a normalized receipt DTO
- [ ] Retire the standalone public receipt validator without a compatibility alias
- [ ] Remove or register the duplicate verification constants so one public surface remains (F69)
- [ ] Implement the deterministic two-file projection generator/check with explicit non-authoritative metadata

## P8 — Repair freshness classification

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with seven disjoint freshness outcomes reachable and stable.

- [ ] Add red-first fixtures for stale plan, candidate snapshot and acceptance fingerprint
- [ ] Add red-first fixtures for missing results, unjustified skip and stage-coverage gap
- [ ] Implement the three stale-condition branches in fixed precedence
- [ ] Implement the three incomplete-condition branches in fixed precedence
- [ ] Make stale and incomplete predicates mutually disjoint (F63)
- [ ] Prove the remaining fresh outcome is reachable and deterministic

## P9 — Repair verification semantics

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with fail-fast, stage-rejection, readonly-vector and determinism suites green.

- [ ] Add red-first fixtures for fail-fast sequencing and attribution
- [ ] Enforce `stopOnFailure` result sequencing (F65)
- [ ] Enforce `stopOnFailure` skip attribution (F65)
- [ ] Make the fast-stage rejection fixture exercise a full-command result (F66)
- [ ] Make frozen canonical-vector entries readonly in the public type (F67)
- [ ] Validate both published vectors through their authoritative entries (F72)
- [ ] Prove repeated canonicalize, digest and verdict calls deeply equal (F72)
- [ ] Prove repeated freshness comparisons deeply equal (F72)

## P10 — Bound verification shapes

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with every P10 exact-boundary/one-over pair green.

- [ ] Add red-first boundary pairs for command, result and argument cardinalities
- [ ] Add red-first boundary pairs for plan id and receipt command id lengths
- [ ] Add red-first boundary pairs for executable and working-directory lengths
- [ ] Add red-first boundary pairs for argument length and NUL rejection
- [ ] Enforce the three cardinality ceilings from the canonical definition
- [ ] Enforce both id ceilings from the canonical definition
- [ ] Enforce executable, working-directory and argument string bounds
- [ ] Export frozen shape-limit metadata and project every Draft-07-expressible shape bound

## P11 — Bound verification payloads

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with byte, existing-string and diagnostic boundary suites green.

- [ ] Add red-first boundary pairs for canonical plan and receipt byte sizes
- [ ] Add red-first boundary pairs for skip-reason and evidence-reference lengths
- [ ] Add red-first fixtures for diagnostic cap, truncation flag and value redaction
- [ ] Enforce both canonical byte budgets before unbounded diagnostic allocation
- [ ] Enforce the existing skip-reason and evidence-reference bounds
- [ ] Publish the frozen diagnostic-code vocabulary and RFC 6901 path representation
- [ ] Replace `errors: string[]` with the bounded diagnostic failure branch (F71)
- [ ] Project expressible payload bounds and mark canonical byte budgets runtime-only

## P12 — Bound verification time

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with all command and aggregate timeout boundary pairs green.

- [ ] Add red-first boundary pairs for fast and full command timeout ceilings
- [ ] Add red-first boundary pairs for fast and full aggregate stage budgets
- [ ] Enforce both per-command timeout ceilings from the canonical definition
- [ ] Enforce both aggregate stage budgets from the canonical definition
- [ ] Export frozen timeout-limit metadata for consumers and tooling
- [ ] Project command ceilings and mark aggregate sums authoritative-runtime-only

## P13 — Build package qualification tooling

Layer: config/infra · Done-when: `cd packages/agentic-workflow-schema && npm ci && bun install --frozen-lockfile && npm run check:verification-schemas && npm run bench:verification -- --commands 128 && npm run check:verification-package` → exit 0 with synchronized locks and p95 ≤100 ms.

- [ ] Remove unused Node typing configuration and regenerate the npm lock (F70)
- [ ] Regenerate the Bun lock from the same package manifest
- [ ] Implement a warm-sample 128-command benchmark with a failing p95 ceiling
- [ ] Implement a package-content checker that proves both generated projections ship
- [ ] Register the deterministic `check:verification-schemas` command
- [ ] Register the `test:verification-docs` command for P14's executable assertions
- [ ] Register the benchmark, package-content and aggregate qualification commands

## P14 — Document the verification contract

Layer: docs · Done-when: `cd packages/agentic-workflow-schema && npm run test:verification-docs` → exit 0 with extractable examples and synchronized EN/ES semantic assertions green.

- [ ] Add red-first executable example and EN/ES semantic-parity assertions
- [ ] Document the two-entry runtime authority and projection boundary in README.md
- [ ] Publish the faithful Spanish authority/projection section in README.es.md
- [ ] Correct the English example's content bindings and result timestamps (F68)
- [ ] Apply the equivalent Spanish example correction (F68)
- [ ] Document every v1 limit and aggregate budget in the English reference
- [ ] Publish the equivalent limits and budgets in the Spanish reference
- [ ] Record the deferred AWL consumer boundary in both references without creating an issue

## P15 — Requalify the delivery candidate

Layer: close-out · Done-when: all declared commands exit 0, `git status -sb` is remote-current, PR #145 describes the exact pushed HEAD, and the replacement-manifest receipt is current.

- [ ] Run `cd packages/agentic-workflow-schema && npm ci`
- [ ] Run `cd packages/agentic-workflow-schema && bun install --frozen-lockfile`
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification`
- [ ] Run `node scripts/check-skill-context.mjs`
- [ ] Run `npx skills add . --list`
- [ ] Record the exact AC1–AC10 replacement-manifest execution receipt
- [ ] Finalize the fix-now ledger, including F62b relocation and F63–F77 folding
- [ ] Synchronize feature progress and roadmap delivery state
- [ ] Refresh PR #145 through `gh pr edit --body-file`
- [ ] Publish the exact candidate commit and verify branch/PR head equality

After P15, hand the exact pushed HEAD and replacement acceptance blob to a fresh
`/review-change`; execution does not claim that independent review receipt.
