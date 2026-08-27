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

- [x] Add red-first public export-surface assertions for exactly two runtime validation entries
- [x] Add red-first own-property normalization fixtures for plan and receipt inputs
- [x] Introduce one internal canonical verification-contract definition consumed by runtime validation and deterministic projection (F76)
- [x] Make `validateVerificationPlanV1(value: unknown)` the sole plan entry and return a normalized plan DTO (F64)
- [x] Make `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` the sole receipt entry and return a normalized receipt DTO
- [x] Retire the standalone public receipt validator without a compatibility alias
- [x] Remove or register the duplicate verification constants so one public surface remains (F69)
- [x] Implement the deterministic two-file projection generator/check with explicit non-authoritative metadata

## P8 — Repair freshness classification

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with seven disjoint freshness outcomes reachable and stable.

Evidence for every task: the new `test/verification-freshness.test.mjs` matrix (15 cases) plus `src/index.ts` `compareVerificationReceiptToCurrent`.

- [x] Add red-first fixtures for stale plan, candidate snapshot and acceptance fingerprint — `stale-plan: …`, `stale-candidate-snapshot: …`, `stale-acceptance-fingerprint: …`, `stale precedence: plan before candidate before acceptance`
- [x] Add red-first fixtures for missing results, unjustified skip and stage-coverage gap — `incomplete-missing-results: fast receipt …`, `… a full receipt missing a FAST-stage row (F62)`, `incomplete-unjustified-skip: …`, `incomplete-stage-coverage: … (F63)`, `incomplete precedence: …`
- [x] Implement the three stale-condition branches in fixed precedence — plan digest → candidate digest → acceptance fingerprint, each returning one code
- [x] Implement the three incomplete-condition branches in fixed precedence — missing fast-stage row → unjustified skip → missing full-stage row on a `full` receipt
- [x] Make stale and incomplete predicates mutually disjoint (F63) — the incomplete block runs only after all three bindings verify; `stale and incomplete are disjoint: stale bindings mask every incomplete condition` + `matrix: every D1 code is reachable and no code answers two dimensions`
- [x] Prove the remaining fresh outcome is reachable and deterministic — `fresh: complete current full receipt is fresh`, `fresh: determination — repeated comparisons … deeply equal`, `fresh: vacuous fast receipt (D9) is fresh`

## P9 — Repair verification semantics

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with fail-fast, stage-rejection, readonly-vector and determinism suites green.

Evidence: `test/verification-semantics.test.mjs` (14 cases, 4 red before the fix), `test/fixtures/verification-vector-readonly.ts` (3 × TS2578 before the fix), `test/fixtures/verification-vectors.mjs`, `src/index.ts` checks 4-5 of `validateVerificationReceiptAgainstPlan`.

- [x] Add red-first fixtures for fail-fast sequencing and attribution — `rejects a passed row that ran after the stopOnFailure trigger`, `… second non-passed row …`, `… timed-out and infrastructure-error rows …`, `… attributed to another command`, plus three acceptance guards against over-tightening
- [x] Enforce `stopOnFailure` result sequencing (F65) — trigger = earliest non-passed row of a `stopOnFailure` command; every later row must be `skipped` (`NON_PASSED`/`trigger` block, check 4)
- [x] Enforce `stopOnFailure` skip attribution (F65) — a reason present after the trigger must name the trigger; D3's per-row earlier/non-passed/`stopOnFailure` check retained as check 5
- [x] Make the fast-stage rejection fixture exercise a full-command result (F66) — `rejects a full-stage result carried by a fast-stage receipt (F66)` now submits the `build` row; the previously misnamed case keeps its positive coverage as `accepts a fast-stage receipt that carries only fast-stage rows`
- [x] Make frozen canonical-vector entries readonly in the public type (F67) — `ReadonlyArray<Readonly<CanonicalVectorV1>>` + `test/fixtures/verification-vector-readonly.ts` (pre-existing `CanonicalVectorV1` untouched, AC8)
- [x] Validate both published vectors through their authoritative entries (F72) — `both published vectors pass their authoritative public entries`, `vector payloads are the ones the published digests lock`
- [x] Prove repeated canonicalize, digest and verdict calls deeply equal (F72) — `repeated canonicalize, digest and verdict calls are deeply equal`, `canonical calls do not mutate the submitted vectors`
- [x] Prove repeated freshness comparisons deeply equal (F72) — `repeated freshness comparisons are deeply equal`

## P10 — Bound verification shapes

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with every P10 exact-boundary/one-over pair green.

Evidence: `test/verification-bounds.test.mjs` (13 cases) + `src/verification-contract.ts` (`VERIFICATION_LIMITS`, field specs, `stringArray` cardinality) + regenerated projections.

- [x] Add red-first boundary pairs for command, result and argument cardinalities — `commands: exactly …(128) is accepted` / `… one beyond … (129)`, `results: exactly the ceiling …` / `… (129)`, `args: exactly argsPerCommand (64) … / one beyond (65)`
- [x] Add red-first boundary pairs for plan id and receipt command id lengths — `id: 128 chars accepted, 129 rejected (D14 idChars)`, `commandId: bounded by the same idChars ceiling as plan ids`
- [x] Add red-first boundary pairs for executable and working-directory lengths — `executable: 1024/1025`, `workingDirectory: 1024/1025`
- [x] Add red-first boundary pairs for argument length and NUL rejection — `arg: 4096 chars accepted, 4097 rejected, NUL still rejected (D14 argChars)`
- [x] Enforce the three cardinality ceilings from the canonical definition — `commands.maxItems`, `results.maxItems`, `args.maxItems` all read `VERIFICATION_LIMITS`; the `stringArray` branch of `validateStructure` gained the missing `maxItems` check so validator and projection agree (AC10)
- [x] Enforce both id ceilings from the canonical definition — `id.maxLength`/`commandId.maxLength` = `idChars` (128), replacing the F50 1024 char class
- [x] Enforce executable, working-directory and argument string bounds — `pathChars` on both path fields, `argChars` per item
- [x] Export frozen shape-limit metadata and project every Draft-07-expressible shape bound — public `VERIFICATION_LIMITS` (re-export of the canonical object), projections regenerated, `every Draft-07-expressible shape bound is projected into the schemas`

## P11 — Bound verification payloads

Layer: schema · Done-when: `cd packages/agentic-workflow-schema && npm test` → exit 0 with byte, existing-string and diagnostic boundary suites green.

Evidence: `test/verification-payload.test.mjs` (14 cases) + `test/fixtures/verification-diagnostics.mjs` (shared diagnostic assertions) + `src/verification-contract.ts` (`VERIFICATION_LIMITS` payload fields, `VERIFICATION_DIAGNOSTIC_CODES`, capped sink) + `src/index.ts` (budget pre-check, `{ ok: false, diagnostics, truncated }` results) + regenerated projections.

- [x] Add red-first boundary pairs for canonical plan and receipt byte sizes — `plan: a canonical form of exactly planBytes is accepted` / `plan: one byte beyond planBytes is rejected by the budget alone`; receipt pair: `the byte budget outranks every shape ceiling — one row, root path` (200-row/600 KiB rejected by the budget alone) + `receipt: a shape-legal maximum-capacity receipt stays inside receiptBytes` (440,331 B vs 524,288 B)
- [x] Add red-first boundary pairs for skip-reason and evidence-reference lengths — `receipt: an evidence reference is accepted at the ceiling and rejected one over` and `receipt: the skip-reason ceiling is the rule that answers one char past it` (1024 → D3 `unknown-command`, 1025 → `limit-exceeded`)
- [x] Add red-first fixtures for diagnostic cap, truncation flag and value redaction — `diagnostics stop at the published ceiling and say so` (49/50/51 violations, document order preserved), `diagnostics are redacted rows: code + path, never a message or a value` (sentinel never echoed), `assertRedacted` pins frozen code+path rows and pointer grammar on every failure
- [x] Enforce both canonical byte budgets before unbounded diagnostic allocation — `canonicalBudgetRefusal` measures the submitted document with the canonical serializer **first**, so an oversized payload produces exactly one root-path row and no structural or semantic work
- [x] Enforce the existing skip-reason and evidence-reference bounds — both bound to `VERIFICATION_LIMITS.skipReasonChars` / `evidenceRefChars` in the canonical field specs and projected (`oneOf[].maxLength`, `ref.maxLength`)
- [x] Publish the frozen diagnostic-code vocabulary and RFC 6901 path representation — `VERIFICATION_DIAGNOSTIC_CODES` (16 codes, frozen, exported), `every published diagnostic code has an emitter (budget-exceeded lands in P12)` and `semantic rejections report their own codes and pointers` pin the path forms (`/commands/0/id`, `/results/1/commandId`, `""` for the whole payload)
- [x] Replace `errors: string[]` with the bounded diagnostic failure branch (F71) — both public entries and the freshness/budget/verdict helpers now return `{ ok: false, diagnostics, truncated }`; 68 assertion sites across the seven pre-existing feature-26 suites moved to `assertDiagnosticOn`/`assertDiagnosticAt`/`assertOnlyDiagnostic` against one shared fixture; no feature-26 site reads a message string any more
- [x] Project expressible payload bounds and mark canonical byte budgets runtime-only — projections regenerated with three new disclosed clauses (`payload budget: runtime-only … <= 256 KiB / <= 512 KiB`, `diagnostics: runtime-only (at most 50 …)`, `values: never returned …`), derived from `VERIFICATION_LIMITS` so they cannot go stale; `payload bounds are projected where Draft-07 can express them`

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
- [ ] Repoint both README examples at the two public entries (the retired standalone receipt validator must not appear in any example)

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
