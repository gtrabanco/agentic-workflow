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

Evidence: `test/verification-timeouts.test.mjs` (12 cases, written red first) + `src/verification-contract.ts` (timeout fields in `VERIFICATION_LIMITS`, `maximum-when` + `stage-aggregate-budget` rule kinds) + regenerated `verification-plan.schema.json`.

- [x] Add red-first boundary pairs for fast and full command timeout ceilings — `fast command timeout: exactly 10 min accepted, 1 ms over refused`, `full command timeout: exactly 60 min accepted, 1 ms over refused`, plus `the fast ceiling is stage-scoped: 11 min is fine for a full command` and `each command answers for its own ceiling, the stage budget for its sum`
- [x] Add red-first boundary pairs for fast and full aggregate stage budgets — `fast aggregate budget: exactly 15 min accepted, 1 ms over refused`, `full aggregate budget: exactly 2 h accepted, 1 ms over refused`, plus `the budget row names the command that crossed, not the whole list`, `stage budgets are per-stage: a full plan of 15-min fast work is legal` and `the plan budget propagates through the receipt authority`
- [x] Enforce both per-command timeout ceilings from the canonical definition — `timeoutMs.maximum` = `fullCommandTimeoutMs` on the field spec (so the projection and the validator share the number) and the new `fast-command-timeout` `maximum-when` rule tightens it for `stage: "fast"`; both report `limit-exceeded` at `/commands/i/timeoutMs`
- [x] Enforce both aggregate stage budgets from the canonical definition — `fast-stage-aggregate-budget` / `full-stage-aggregate-budget` root rules declare `collection`/`when`/`fields`/`maximum` once; `applyCrossRule` sums the stage in declared order and reports one `budget-exceeded` row at the command that crossed
- [x] Export frozen timeout-limit metadata for consumers and tooling — `VERIFICATION_LIMITS.fastCommandTimeoutMs` (600000), `fastStageTimeoutMs` (900000), `fullCommandTimeoutMs` (3600000), `fullStageTimeoutMs` (7200000), published in milliseconds by `the D14 timeout ceilings are published once, in milliseconds`, which also pins the 2 × ceiling = full-budget relation the SPEC's 60/120 pair implies
- [x] Project command ceilings and mark aggregate sums authoritative-runtime-only — `the projection carries both command ceilings, including the stage condition` (field `maximum` + an `if stage=fast / then timeoutMs ≤ 600000` allOf fragment) and `projection and authoritative validator agree on every timeout boundary` (Ajv parity on 8 boundary payloads); the sums cannot be expressed, so `$comment` now discloses `fast-stage-aggregate-budget, full-stage-aggregate-budget` as runtime-only automatically

## P13 — Build package qualification tooling

Layer: config/infra · Done-when: `cd packages/agentic-workflow-schema && npm ci && bun install --frozen-lockfile && npm run check:verification-schemas && npm run bench:verification -- --commands 128 && npm run check:verification-package` → exit 0 with synchronized locks and p95 ≤100 ms.

Evidence: `scripts/bench-verification.mjs`, `scripts/check-verification-package.mjs`, `test/verification-gates.test.mjs` (10 cases), `test/verification-docs.test.mjs` (3 cases), `package.json` (7 scripts, `@types/node` dropped), `package-lock.json` (regenerated), `tsconfig.json` (`types` override dropped). Observed: 432/432 tests, schemas drift-free, p95 20–25 ms against the declared 100 ms ceiling, 15 packed files with both projections.

- [x] Remove unused Node typing configuration and regenerate the npm lock (F70) — `"types": ["node"]` deleted from `tsconfig.json` and `@types/node` dropped from `devDependencies`; `tsc` still compiles src and the type-checked fixture with **zero** errors (target `ES2022` supplies `TextEncoder`/`Crypto`), and `package-lock.json` was regenerated (−18 lines, `node_modules/@types` no longer exists). `the package declares no unused Node typings (F70)` pins all four views
- [x] Regenerate the Bun lock from the same package manifest — `bun install` reports "no changes" and `bun install --frozen-lockfile` exits 0: the F70 asymmetry was npm-only (Bun never carried `@types/node`), so the locks are now identical in dependency sets, proven by `npm and Bun locks agree with the manifest dependency ranges` rather than by a no-op rewrite
- [x] Implement a warm-sample 128-command benchmark with a failing p95 ceiling — `scripts/bench-verification.mjs`: 15 discarded warm-up cycles, 60 measured nearest-rank samples, one sample being the full gate cycle (validate plan → canonicalize → digest → validate receipt → canonicalize → digest), exit 1 over the declared 100 ms, exit 2 for a payload that would not be a valid plan, and **no** ceiling flag. `the benchmark ceiling is the declared 100 ms and takes no override` refuses a silent lift
- [x] Implement a package-content checker that proves both generated projections ship — `scripts/check-verification-package.mjs` runs `npm pack --dry-run --json` (writes nothing), then requires both projections in the tarball, in `files`, and in `exports`; every `exports` target packed; `dist/index.js`, `dist/index.d.ts`, both READMEs and `LICENSE` present; and no `src/`, `test/` or `scripts/` path leaked
- [x] Register the deterministic `check:verification-schemas` command — `tsc && node scripts/generate-verification-schemas.mjs --check`, which encodes P10's gotcha (the generator renders from `dist/`, so an un-rebuilt definition would make `--check` green against a stale render); asserted by `the schema check rebuilds before comparing`
- [x] Register the `test:verification-docs` command for P14's executable assertions — `node --test test/verification-docs.test.mjs`, seeded with the registration-level facts that must hold for any doc work (both references exist and are non-trivial, both name the two public entries, the command drives that file). The file's own header lists what P14 must add red-first — projections, every limit/budget, EN/ES semantic parity, the AWL boundary — and P14's `VERIFICATION_LIMITS` topic assertion was deliberately **not** written here because neither README mentions it yet
- [x] Register the benchmark, package-content and aggregate qualification commands — `bench:verification`, `check:verification-package` and `gate:verification` (`npm test` → schemas → package → docs → `bench:verification -- --commands 128`), with `every command ACCEPTANCE v2 names is registered in the package` and `the aggregate gate runs every other verification command` keeping the registration answerable to the frozen manifest

## P14 — Document the verification contract

Layer: docs · Done-when: `cd packages/agentic-workflow-schema && npm run test:verification-docs` → exit 0 with extractable examples and synchronized EN/ES semantic assertions green.

Evidence: `test/verification-docs.test.mjs` (13 cases, 12 of them red before the docs changed) + `packages/agentic-workflow-schema/README.md` / `README.es.md`. Observed: `npm run test:verification-docs` exit 0, and the extracted example **typechecks and runs** to `Delivery verified`.

- [x] Add red-first executable example and EN/ES semantic-parity assertions — AC6's six topics per language, the exact `VERIFICATION_LIMITS` number per table row, the time/byte/p95 bounds, the projection + generator + drift-command claims, the D16 diagnostic shape and full 16-code vocabulary, the six freshness codes, no call to an unexported symbol, and byte-for-byte EN/ES example-code equality: 12 of 13 cases failed on the pre-P14 references
- [x] Document the two-entry runtime authority and projection boundary in README.md — **Validation authority** (exactly two public authoritative entries, no standalone receipt validator, normalized own-property DTOs) and **JSON Schema status** (generated, non-authoritative structural projections; a Draft-07 match is not contract validity; `$comment` disclosure; one writer)
- [x] Publish the faithful Spanish authority/projection section in README.es.md — **Autoridad de validación** and **Estado de JSON Schema** mirror the English claims one-for-one, in the terminology the existing Spanish reference already uses
- [x] Correct the English example's content bindings and result timestamps (F68) — the receipt now binds to declared 64-hex `candidateDigest`/`acceptanceDigest` literals (no `"a".repeat(64)` placeholders), timestamps are 12 s and 108 s against 30 000/120 000 ms timeouts with the coherence check inline, and the run is proven by the docs suite rather than asserted in prose
- [x] Apply the equivalent Spanish example correction (F68) — `README.es.md` carries the identical block; `the English and Spanish examples are the same code` compares the two after comment stripping, so the two languages cannot drift silently
- [x] Document every v1 limit and aggregate budget in the English reference — **Usability limits** table lists all 15 `VERIFICATION_LIMITS` keys with their exact numbers (128/128/64/128/1024/4096/1024/1024/262144/524288/600000/900000/3600000/7200000/50), the stage-budget asymmetry, and the 100 ms p95 gate with its command
- [x] Publish the equivalent limits and budgets in the Spanish reference — **Límites de usabilidad** with the same rows and numbers, prose in minutes/hours for both stages
- [x] Record the deferred AWL consumer boundary in both references without creating an issue — **Consumer boundary** / **Límite del consumidor** state that an AWL dialect, runner or adapter is not part of the package and that no issue tracks it; D15's routing note in `decisions.md` already keeps it user-routed, and no issue was created
- [x] Repoint both README examples at the two public entries (the retired standalone receipt validator must not appear in any example) — `validateVerificationReceiptV1` is gone from both references, both `pv.errors.join(…)`-style reads became `diagnostics`, and the validator lists in the "Validate or use another language" sections now name the two verification entries

## P15 — Requalify the delivery candidate

Layer: close-out · Done-when: all declared commands exit 0, `git status -sb` is remote-current, PR #145 describes the exact pushed HEAD, and the replacement-manifest receipt is current.

- [x] Run `cd packages/agentic-workflow-schema && npm ci` — exit 0
- [x] Run `cd packages/agentic-workflow-schema && bun install --frozen-lockfile` — exit 0 · "Checked 6 installs across 7 packages (no changes)"
- [x] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0 · 442/442 · schemas drift-free (2 files) · package content PASS · docs 13/13 · p95 18.33 ms
- [x] Run `node scripts/check-skill-context.mjs` — exit 0 · `PASS context budgets: 35 skills`
- [x] Run `npx skills add . --list` — exit 0 · all 35 skills listed
- [x] Record the exact AC1–AC10 replacement-manifest execution receipt — blob `2e80588…` recomputed and matched; AC-by-AC table in `progress.md`
- [x] Finalize the fix-now ledger, including F62b relocation and F63–F77 folding — F63–F77 → `folded: yes` naming phase + commit; F62b row deleted, preserved as a review proposal with its trigger in `decisions.md`
- [x] Synchronize feature progress and roadmap delivery state — P8–P15 receipts complete, roadmap row 26 `done · #145` verified against the replanned unit
- [x] Refresh PR #145 through `gh pr edit --body-file` — title and body rebuilt from the exact pushed HEAD + observed evidence
- [x] Publish the exact candidate commit and verify branch/PR head equality — `gh pr view --json headRefOid` equals the pushed HEAD

After P15, hand the exact pushed HEAD and replacement acceptance blob to a fresh
`/review-change`; execution does not claim that independent review receipt.

## 2026-08-27 corrective replan (P16–P21, user-ordered) — tasks unchecked until executed

## P16 — Correct published docs hygiene
Layer: docs · Done-when: `cd packages/agentic-workflow-schema && npm run test:verification-docs` exits 0 with the new qualifier assertion, no unqualified `bench:verification` consumer sentence remains in either README, and ledger rows F107/F109/F110 read `folded: yes` naming the P16 commit.
- [x] Annotate ledger rows F98/F101–F105 with their fold commits (e7a7f49 / a76ad88 / fdd2a98) and flip F107 `folded: yes` in the same commit
- [x] Annotate ledger row F109 `folded: yes` citing the replan commit's roadmap flip plus the P21 close-out re-flip obligation
- [x] Add the source-checkout qualifier to the `bench:verification` proof sentence in both READMEs (F110), pin it with a red-first docs assertion, and synchronize the case-count line in both CHANGELOGs
- [x] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0, docs suite 23/23
- [x] Commit P16 atomically (fix plus ledger ticks) and push

## P17 — Snapshot verification input at validation entry
Layer: domain · Done-when: the hostile-getter suite proves both public entries decide and build DTOs from one captured document for every accessor, `npm run gate:verification` exits 0 with p95 ≤ 100 ms, and ledger F97 reads `folded: yes` naming the P17 commit.
- [x] Write the hostile-getter regression suite red-first: a getter whose value flips at each successive read — for every plan accessor (contract, commands, and per command id, stage, executable, args, workingDirectoryPolicy, workingDirectory, timeoutMs, costClass, stopOnFailure) and every receipt accessor (contract, planDigest, candidateSnapshotDigest, acceptanceFingerprint, results, stageRequested, verdict, and per row commandId, status, exitCode, signal, startedAt, endedAt, stdout + stdout.ref/bytes/sha256, stderr + stderr.ref/bytes/sha256, skipReason) — must yield a refusal or a blessed DTO identical to the validated document, on both public entries
- [x] Capture the submitted value once at entry into a frozen own-property snapshot (the capture reads every submitted accessor exactly once); validate and build DTOs from the snapshot only
- [x] Route both public entries through the capture; a throwing getter surfaces as the existing redacted `invalid-type` refusal (F92 parity)
- [x] Keep diagnostic parity: every refusal after capture still carries only a frozen code plus RFC-6901 path
- [x] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0, benchmark p95 ≤ 100 ms
- [x] Flip F97 `folded: yes` naming the P17 commit; commit atomically and push

## P18 — Bound verification preflight refusal work
Layer: domain · Done-when: a 200,000-command plan is refused `limit-exceeded` in ≤ 50 ms wall-clock, `npm run gate:verification` exits 0, and ledger F99 reads `folded: yes` naming the P18 commit.
- [x] Write the red-first preflight budget probe: a cardinality-illegal payload must be refused without canonical serialization (the observed 2189 ms at 200k commands must drop under the 50 ms bound)
- [x] Bound refusal work at entry against the declared limits — F99's **byte-accounting** alternative was taken (`limit + 1` abort inside the capture) instead of a raw root-cardinality refusal, because answering a >128-command plan at the root would move the pinned `/commands` row (`verification-payload.test.mjs`, `verification-plan.test.mjs`) to the root path and break the D16 precedence the same row requires keeping
- [x] Measure the canonical byte budget with an early-exit serializer that aborts as soon as the running size passes the budget
- [x] Sequence both public entries: bounded capture → exact UTF-8 measure (fallback when the running size is not the byte size) → full validation walk
- [x] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0; re-run the 10k and 200k probes and record the new timings in the commit body
- [x] Flip F99 `folded: yes` naming the P18 commit; commit atomically and push

## P19 — Restore legacy canonicalizer compatibility
Layer: domain · Done-when: the golden-vector suite proves every legacy `canonicalize*`/`digest*` export returns byte-identical 3.3.0 output on the captured unsupported-leaf corpus, the verification surface's refusals stay green, `npm run gate:verification` exits 0, and ledger F100 reads `folded: yes` naming the P19 commit.
- [x] Capture golden vectors from the merge-base code (`git show e84db167:...` executed under Node): legacy `canonicalize*`/`digest*` outputs for documents containing undefined, function, symbol, bigint and non-finite leaves — committed as `scripts/capture-legacy-vectors.mjs` plus `test/fixtures/canonical-legacy-{corpus,vectors}.mjs`: 56 cases over 8 injection points, a digest for every one, the canonical string wherever 3.3.0 emitted unparseable JSON
- [x] Write the red-first compatibility suite from the golden vectors for every legacy export — `test/canonical-legacy-compat.test.mjs`; 50 of its 60 cases failed at the P18 fold
- [x] Scope the named-TypeError total-leaf guard to the feature-26 verification canonicalizers; restore the captured 3.3.0 fallback serialization for the legacy exports only — `canonicalJSONValue(v, domain)` over `CanonicalLeafDomain = "legacy" | "verification"`, defaulting to `verification` so no new call site can silently pick the lax domain
- [x] Re-point the branch-local tests that pinned the interim throw on legacy exports to the golden vectors; never touch verification-surface refusal tests (F92 parity) — the two `canonical-core.test.mjs` F80 cases now assert the 3.3.0 bytes and the engine's own bigint error; the four `verification-core.test.mjs` refusal cases are untouched and still green
- [x] Precise the 3.4.0 ship record in both CHANGELOGs (byte-identical schemas AND unchanged legacy export behavior) and scope the F80 guard note in decisions.md to the verification canonicalizers — pinned by a 24th docs case asserting both languages
- [x] Run `cd packages/agentic-workflow-schema && npm run gate:verification` — exit 0; flip F100 `folded: yes` naming the P19 commit; commit atomically and push

## P20 — Recover ledger fold provenance
Layer: docs · Done-when: a mechanical recount proves zero `folded: yes` rows lack a commit token, and ledger F106 reads `folded: yes` naming the P20 commit.
- [x] Run the scripted per-row `git log -S` recovery over the 62 token-less rows — `scripts/ledger-provenance.mjs`; the real count is **72**, because a bare 7-hex scan also matches review-round markers (`@3112e34`) and persistence commits that name findings without folding them, so the recount ties a citation to the flip commit or to the commit whose own message claims the id
- [x] Annotate every row whose fold commit is proven — 72 rows now carry `· fold <sha>` (plus `(ticked <sha>)` where the repair and the bookkeeping are different commits); none was re-opened
- [x] Re-open every row whose fold cannot be proven (`folded: no` plus a BLOCKED note naming the missing evidence) — zero rows landed there; the rule and its fixture stay in `scripts/ledger-provenance.test.mjs`
- [x] Flip F106 `folded: yes` naming the P20 commit; commit atomically and push — the row reads `· P20 = ca2e972`, and the recount that proves it is part of `node --test scripts/*.test.mjs` so a future `folded: yes` flip without a tieable commit fails the gate instead of the close-out review

## P21 — Requalify the corrected candidate
Layer: close-out · Done-when: AC1–AC10 are re-verified against the frozen blob, an `--adversarial 3` review at the terminal head returns PASS with zero open findings, the PR #145 body describes the terminal head, and the roadmap row reads `done`.
- [ ] Run `cd packages/agentic-workflow-schema && npm run gate:verification` and `node scripts/check-skill-context.mjs` — both exit 0
- [ ] Verify AC1–AC10 against the frozen ACCEPTANCE.md blob `2e8058860b2c805cc30507053f15f91e2f273249` and record the execution receipt in progress.md
- [ ] Run review-change `--adversarial 3` over the whole corrected candidate at the terminal head (isolated finder passes)
- [ ] Fold every fix-now row the review produces within this phase (bounded correction pass); escalate only architectural or acceptance-level findings to the user
- [ ] Refresh the PR #145 body to the terminal head and flip F108 `folded: yes` — the refresh runs now (provisional: the body measures the head this fold round ends on and says so) and the row stays `folded: no`, because every remaining P21 task lands commits and would re-stale it — which is F108's own defect
- [ ] Run loop-review-fold 26-staged-verification-contracts to PASS
- [ ] Flip roadmap row 26 back to `done · [#145]` after PASS
