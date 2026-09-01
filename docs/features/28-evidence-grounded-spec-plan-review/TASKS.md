# TASKS — 28-evidence-grounded-spec-plan-review

Per-phase implementation checklist. Each phase is atomic, has one layer, and
must satisfy its Done-when command before the phase commit.

## P1 — Publish pre-execution evidence contracts

Layer: schema/db · Done-when: `cd packages/agentic-workflow-schema && npm test`
-> exit 0 with all new and existing suites green.

- [x] Write red-first public-entry tests for strict snapshot/receipt shapes, closed vocabularies, undeclared fields, stage matrices, bounds, normalized paths, identities, timestamps, and bounded redacted diagnostics.
- [x] Add one internal canonical definition for both contracts and normalized DTO constructors; expose only the SPEC-approved validation entries and types.
- [x] Implement `spec-product-v1` exact Markdown selection with missing, duplicate, and out-of-order heading rejection plus stage-aware artifact-set construction from caller-supplied bytes.
- [x] Implement canonical UTF-8 serialization, lowercase SHA-256 digests, readonly independently checked vectors, and deterministic repeatability tests.
- [x] Implement Product-parent lineage, policy/context/source freshness precedence, `artifactRevisionId` causal invalidation, author-exclusion semantics, and mutate/revert non-resurrection tests.
- [x] Generate the two Draft-07 structural projections from the canonical definition, mark them non-authoritative, and add projection drift/parity checks.
- [x] Extend package-root intents, evidence vocabulary, capability profiles, and deterministic transition fixtures for `review-spec` and `review-plan` without changing existing intent meaning.
- [x] Export/package/document the additive surface, bump `3.4.0 -> 3.5.0`, and prove existing candidate-review and staged-verification contracts remain compatible.

## P2 — Establish Product review readiness

Layer: docs · Done-when: `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0 for grounding and SPEC-review
fixtures.

- [x] Add the internal `evidence-grounding` skill/reference with the fixed claim-authority-evidence-freshness-unknown map, progressive inventory/evidence/draft/readiness order, bounded questions, contracted readiness outcomes, and no-progress rule. Mark it `user-invocable: false` WITHOUT `metadata.internal: true` and register it in `.claude-plugin/plugin.json` and `skills.sh.json` so the skills CLI discovers and installs it — `metadata.internal: true` is the exclusion flag (#96), and a distributed skill wrongly carrying it is silently omitted from installs (the #141 `orchestration-envelope` regression); lint rule 7 and the `bounded-delivery-loops` guard then keep the marking valid.
- [x] Integrate grounding, Product evidence compaction, deterministic readiness, and per-write `artifactRevisionId` handoff into `design-feature` without granting it review/approval authority or engineering scope.
- [x] Add public `review-spec` with the exact Product checks, clean-context falsification prompt, read-only artifact boundary, three verdicts, and stage-specific receipt/finding output.
- [x] Define SPEC repair/upsert semantics: one unioned findings set is root-caused and repaired as one batch; mechanical intent-preserving changes remain with `design-feature`; scope/authority/outcome gaps require the human and a new revision/review.
- [x] Narrow `plan-feature-from-issue` so issue-derived feature work stops after Product design and current `review-spec`; remove same-turn Engineering planning bypass while retaining the internal name for compatibility.
- [x] Gate `plan-feature` on a valid current Product receipt and exact parent snapshot; fail closed on missing/stale/wrong-stage/candidate receipts.
- [x] Add SPEC-review fixtures for readiness rejection, complete review, unsupported/self-approved/stale authority, causal revert, same-model clean context, batched repair, second-cycle diagnosis, and issue export.
- [x] Bump/changelog every P2 skill through repository tooling and keep each entrypoint within progressive-context limits.

## P3 — Establish Plan review readiness

Layer: docs · Done-when: `node --test
scripts/pre-execution-quality.test.mjs` -> exit 0 for Plan/fix, ledger,
independence, and no-progress fixtures.

- [x] Add public `review-plan` with feature/fix input contracts, engineering checks, three verdicts, read-only boundary, and exact parent Product/Plan receipt output.
- [x] Integrate progressive grounding, deterministic Plan readiness, and revision rotation into `plan-feature`, `plan-feature-scaffold`, and `plan-fix`; fixes retain reproduction/root-cause/regression/rollback authority without a fake Product half.
- [x] Add the frozen planning-ledger set: compact `planning-evidence.md` for M/L (embedded for XS/S) plus obligation closure, bound into Plan snapshots with current authority/unknown ownership and complete behavior-to-phase/task/validator/evidence/status mapping.
- [x] Add stage-aware `planning-findings.md` ownership and resolution evidence; reviewers append findings, author skills repair/replan, and no reviewer mutates its approved artifact.
- [x] Implement unioned findings, counter-evidence-only dismissal, truthful model-diversity labels, author exclusion where enforceable, bounded critique/synthesis/arbitration, and no quorum.
- [x] Implement first-findings batch repair plus no-progress/convergence rules: a repeat needs a new snapshot or falsifiable evidence route, and entering a second repair/re-review cycle emits an owner-specific `CONVERGENCE-ANOMALY`.
- [x] Add Plan fixtures for feature/fix readiness, unsupported assumptions, evidence/obligation gaps, bad phase cuts/scenarios, wrong parent/Product conflict, wording-only batch repair, causal revert, second-cycle diagnosis, and issue-export attempts.
- [x] Bump/changelog every P3 skill and keep evidence/readiness/convergence policy in one progressive reference/internal owner rather than duplicating it.

## P4 — Enforce pre-execution authority routing

Layer: docs · Done-when: `node --test
scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs
scripts/audit-pr-receipt.test.mjs` -> exit 0.

- [x] Extend `workflow-status` sensing and the existing transition/profile authority to recommend review, author repair, replan, design, or execute only from current exact evidence.
- [x] Make `execute-phase` fail closed before implementation on missing/stale/wrong-stage Plan PASS while reserving the post-PASS pre-write slot for feature 29 discovery.
- [x] Update `ship-roadmap` stage sequencing to design -> review-spec -> plan -> review-plan -> execute, preserving human product authority and its existing merge policy.
- [x] Update `review-change` classification and `loop-review-fold` routing so source-local findings fold locally, Plan-rooted findings replan/re-review, Product-rooted findings return to design/review-spec, and a second local cycle diagnoses convergence before another edit.
- [x] Update `audit-pr` to require current upstream lineage and fully verified obligation rows while retaining exclusive `MERGE-READY` authority and current candidate receipts.
- [x] Define legacy planned/in-progress adoption: construct/review current artifacts, never coerce old evidence, never mutate frozen acceptance, and resume only from current PASS.
- [x] Prohibit automatic forge issue creation and follow-up deferral across all affected routes unless the user first amends the governing SPEC.
- [x] Add end-to-end route fixtures covering current/stale/missing receipts, fix/feature paths, later review root causes, crash/re-entry, no-progress, and no partial-success envelopes.

## P5 — Qualify the pre-execution workflow

Layer: hardening · Done-when: every frozen validator passes and the exact
candidate has current independent review evidence with no unresolved fix-now
finding.

- [x] Synchronize package README EN/ES, workflow/orchestration/feature/fix/migration/skill-catalog docs EN/ES, portable manual prompts, templates, and distribution metadata without duplicating machine semantics; rebuild feature 27's Pi skill bundle only through its canonical bundle script.
- [x] Run all package gates, generated-projection drift/parity, package-content checks, full existing root tests, and regression/read verification of unchanged candidate/verification contracts.
- [x] Run Pi bundle/parity/package tests, `node scripts/check-skill-context.mjs`, and `npx skills add . --list`; repair only the canonical owner/progressive references/metadata and re-run to PASS.
- [ ] Execute and log the golden fixture with the weakest supported executor path across the new review gates and every changed executor-path skill/version.
- [ ] Run and record a comparable feature, fix, and cross-boundary canary corpus; use observed values or `not yet measured`, fail qualification on any second repair/re-review cycle, and never infer a savings claim.
- [ ] Run independent context-clean `review-change` on the exact candidate, fold every fix-now finding through its root-cause route, and repeat only on a changed snapshot/new falsifiable question until PASS.
- [ ] Mark progress/testing/known-issues/obligation ledgers truthfully, flip roadmap row 28 to `done`, and verify the complete frozen acceptance manifest at terminal HEAD.
- [ ] Ship the release-ready terminal candidate: as the final pre-merge step, bump `@gtrabanco/pi-agentic-workflow` `0.1.0 -> 0.2.0` after the last skill edit and bundle rebuild (`npm run bundle:skills && npm test` green), add the `0.2.0` companion-package rows to both CHANGELOGs, commit/push, and open one PR against `main` with `Closes #146`, exact verification evidence, package release notes, compatibility boundary, and no self-authorship line. `publish-pi-package.yml` then releases the Pi package on merge because its version is newer than the registry.

> **Re-plan 2026-08-31** (user-approved amendment, findings F2+F3+F6, all
> `replan-in-unit`): rows 1–3 above are complete with evidence in
> `testing.md`'s P5 record. Rows 4–8 are superseded: the golden-fixture and
> canary-corpus work moves to **P6**, ledger/status reconciliation to **P7**,
> and the re-review + PR close-out to **P8**. Row 8 is listed as superseded for
> the same reason although its substance already executed — the 0.2.0 bump commit
> `a42c244b` and PR #155 exist — so P8 *verifies* the bump, the release notes and
> the PR on the terminal candidate instead of re-doing them, and it inherits the
> publish precondition recorded in `SPEC.md` → Deploy (known-issue 12). (Row 8 was
> missing from this list until finding RS9.)

## P6 — Run the pre-execution qualification corpus

Layer: hardening · Done-when: `testing.md`'s completed canary corpus carries
one row-set per sample (28 feature / 78 fix / 17 cross-boundary) with every
canary field observed or explicitly `not yet measured` and no second-cycle
sample; `GOLDEN_FIXTURE.md` (+ ES sibling) carries a dated row for every
changed executor-path skill/version in this unit's 3.5.0 changelog rows; root
`node --test scripts/*.test.mjs` -> exit 0.

- [x] Record unit 28's feature-sample canary fields (elapsed time, model calls, pre-edit replans, post-review repairs, review/fold cycles, reverted lines/files, tokens or explicit `not yet measured`, exported obligations) in `testing.md`'s corpus table.
- [x] Replay fix unit 78 (`docs/fix/78-audit-pr-closure-integrity`) through `plan-fix` -> `review-plan` in a clean context as the fix sample; record its baseline (original run) vs post-change (probe) fields and correction-cycle count; a sample entering a second repair/re-review cycle is root-caused and rerun per the protocol.
- [x] Replay feature 17 (`17-finding-severity-routing`, skills + schema package + template) through `review-plan` in a clean context as the cross-boundary sample; record the same fields and cycle count.
- [x] Append dated golden-fixture rows (EN + ES sibling) for every changed executor-path skill/version in this unit's 3.5.0 changelog rows not yet covered, following `docs/workflow/GOLDEN_FIXTURE.md`'s procedure with the weakest supported executor path.

## P7 — Reconcile the unit ledgers with qualification evidence

Layer: docs · Done-when: `grep -qE '\| 28 \| .?evidence-grounded-spec-plan-review.? \| in-progress' docs/features/ROADMAP.md` -> exit 0; every O9–O14 row in `planning-obligations.md` carries a status matching its cited evidence; `progress.md`'s phase table lists P6–P8 with receipts.

- [x] Set each O9–O14 row in `planning-obligations.md` to the status its cited evidence supports (`verified` only where the evidence row exists; rows without evidence stay `planned` and are named in `progress.md`'s residuals).
- [x] Tick the completed P6/P7 boxes in this file and keep the P5 supersede note accurate.
- [x] Reconcile `progress.md`: phase-table rows for P6–P8 with receipts, the P5-section correction note, and the P7 receipt.
- [x] Verify roadmap row 28 reads `in-progress` and matches `progress.md` before P8 flips it at the PR step.

## P8 — Re-review and close the corrected candidate

Layer: close-out · Done-when: terminal HEAD holds a current context-clean
`review-change` PASS receipt with zero open findings; every package gate
passes at terminal HEAD; the frozen ACCEPTANCE manifest is verified; roadmap
row 28 reads `done · [#155]`.

- [x] Record **all** current review evidence at terminal HEAD: a context-clean
      `review-change` PASS receipt for the exact HEAD **and** re-derived
      `SPEC-REVIEW-PASS` + `PLAN-REVIEW-PASS` receipts for the same HEAD (finding
      RS3(c) — the repair commits rotate both pre-execution digests, so closing
      without re-running them would close on stale evidence).
      *(Dispositioned 2026-09-01 by owner decision D32 / SPEC amendment: the
      `review-plan`/`review-spec` receipts are not producible for this unit — the
      skills are its own undelivered artifacts, installed nowhere — so this row is
      satisfied by the installed `review-change` receipt at terminal HEAD plus the
      recorded decision; the gate's first real exercise is feature 29's dogfood.
      Known-issue 14 carries the closure condition.)*
- [x] Fold every new fix-now finding via `fold-findings`; route unresolved rows to `triage-issue --prioritize-now` per `loop-review-fold` step 5.
- [x] Re-run the package gates at terminal HEAD: schema `npm test`, root `node --test scripts/*.test.mjs`, `check-skill-context` (skills + routes), Pi `bundle:skills && npm test`, `npx skills add . --list`.
- [x] Verify the complete frozen ACCEPTANCE manifest at terminal HEAD and record the verification receipt in `progress.md`.
- [x] Update PR #155 with the amendment summary (P6–P8) and verification evidence.
- [x] Flip roadmap row 28 to `done · [#155]` after the PR update (the PR-open step's write).

---

# Phases appended by the 2026-09-01 user-approved amendment (#146 flow-integrity F1–F6, finding F3)

P8 stays as it ran; it is no longer the terminal phase. **P16** owns close-out at
the amended head. Each phase below carries the phase-lint fingerprint recorded in
`SPEC.md ### Phases`; task counts must match, or the fingerprint is stale and the
phase is re-cut — never re-tallied after the fact.

## P9 — Declare durable ledger write ownership

Layer: docs · Done-when: `node --test scripts/ledger-ownership.test.mjs` -> exit 0 and -> non-zero on the undeclared-writer fixture.

- [ ] Write the ledger ownership map with one row per truth class: review findings, planning findings, progress, known-issues, decisions, roadmap, acceptance manifest.
- [ ] Add the declared-mechanical-annotator column and enter `scripts/ledger-provenance.mjs` as `review-findings.md`'s annotator, naming the fold token it may append and its validator.
- [ ] Declare owner and annotator in `docs/features/_TEMPLATE/` and `docs/fix/_TEMPLATE/` ledger templates.
- [ ] Write `scripts/ledger-ownership.test.mjs` red first: the declared-owner scan must fail a template row with no owner.
- [ ] Add the script write-path scan so a script writing a durable ledger absent from the map fails the suite.
- [ ] State the one-owner rule in `skills/pre-execution-review/references/LEDGERS.md` as the single cited source.

Phase-lint: PASS (8/8) · fingerprint `P9:docs:6:declare-durable-ledger-write-ownership`

## P10 — Mark terminal verdicts durably

Layer: docs · Done-when: `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 and the write-then-report `grep` in `SPEC.md` P10 -> exit 0.

- [ ] Add the write-then-report rule to `skills/pre-execution-review/references/POLICY.md` as its one owner.
- [ ] Cite that rule from `skills/review-spec/SKILL.md`'s turn contract without restating it.
- [ ] Cite that rule from `skills/review-plan/SKILL.md`'s turn contract without restating it.
- [ ] Fix the typed gate-rejection vocabulary (dependency, status, phase-lint, stale-or-missing-receipt), each trace naming reason and return route.
- [ ] Add the replay rule: a stale, wrong, or duplicate mark refuses with a typed reason and performs no side effect.
- [ ] Add the terminal-mark, rejection-trace, and replay-refusal fixtures to `scripts/pre-execution-quality.test.mjs`.

Phase-lint: PASS (8/8) · fingerprint `P10:docs:6:mark-terminal-verdicts-durably`

## P11 — Prove clean reviews with a durable mark

Layer: docs · Done-when: `node --test scripts/workflow-status-pre-execution.test.mjs` -> exit 0 with the mark-present and ledger-only cases.

- [ ] Define the zero-finding durable review mark row shape in `LEDGERS.md`.
- [ ] Replace `workflow-status`'s ledger-presence review-run proof in `references/SENSOR_CORE.md` with the durable mark.
- [ ] State the same keying in `skills/workflow-status/references/PRE_EXECUTION.md` and delete the ledger-presence sentence.
- [ ] Add both sensor fixtures — mark present with zero findings proves review-ran, ledger without mark does not.
- [ ] Bump every touched skill with `bump-skill` and regenerate the Pi bundle to byte parity.

Phase-lint: PASS (8/8) · fingerprint `P11:docs:5:prove-clean-reviews-with-a-durable-mark`

## P12 — Conserve delegated evidence as a versioned artifact

Layer: docs · Done-when: `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 with the delegated-evidence and NEEDS-EVIDENCE fixtures.

- [ ] Write the delegate-only read-only role contract: never invoked in the authoring context, fresh read-only context where supported, manual fresh conversation as the portable fallback.
- [ ] Fix the artifact shape: positive revision, `done / partial / blocked`, the questions, sources with id, class, title, publisher, URL, accessed_at, excerpt, claims mapped to source ids, contradictions, uncertainty, freshness, separately-held non-authoritative product choices, explicit unverified-claims section.
- [ ] Add the readiness rule: a `partial` or `blocked` artifact yields zero validated claims and returns `NEEDS-EVIDENCE`.
- [ ] Add persist-then-STOP: the pending state is written before any user prompt, then the turn ends.
- [ ] Add the advisory-until-validated rule with spot-checking citations named as the validation act.
- [ ] State that capability gating is self-attested and out of scope, with no grant vocabulary added.

Phase-lint: PASS (8/8) · fingerprint `P12:docs:6:conserve-delegated-evidence-as-a-versioned-artifact`

## P13 — Run normalizers before the artifact freeze

Layer: docs · Done-when: `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 and -> non-zero when a mutating step follows the freeze row.

- [ ] Add the ordering rule to `skills/execute-phase/references/PRE_EXECUTION_GATE.md`: mutating steps precede the freeze, check-only steps follow it.
- [ ] Add the invalidation sentence: a byte change to a frozen input after the freeze voids current receipts and forces fresh review.
- [ ] List this repository's normalizers in one place: `bump-skill`, `npm run bundle:skills`, generators, formatters, docs generators.
- [ ] Add the normalizer-ordering fixture that fails when a mutating step is scheduled after the freeze row.

Phase-lint: PASS (8/8) · fingerprint `P13:docs:4:run-normalizers-before-the-artifact-freeze`

## P14 — Bind normative prose to machine surfaces

Layer: hardening · Done-when: `node --test scripts/normative-drift.test.mjs` -> exit 0 and -> non-zero against each of the three injected disagreements.

- [ ] Inventory the normative surfaces that order an agent action: skill process text, `SENSOR_CORE.md`, `TURN_CONTRACT.md`, `PREFLIGHT.md`, closing hand-off blocks.
- [ ] Give every inventoried surface that lacks one a fixed grammar: fenced command block, fixed-output contract block, or versioned reference table.
- [ ] Write `scripts/normative-drift.test.mjs` red first against the schema package's published vocabularies.
- [ ] Cover the transition and argument references made by `review-spec` and `review-plan`.
- [ ] Cover the gate transitions in `execute-phase`, `plan-feature`, and `plan-fix`.
- [ ] Cover the `workflow-status` sensor labels and the envelope field references.
- [ ] Add the render-only check: prose restating a version, SHA, count, or next command must equal the machine value or the test fails.

Phase-lint: PASS (8/8) · fingerprint `P14:hardening:7:bind-normative-prose-to-machine-surfaces`

## P15 — Qualify the amended skills on the weakest executor

Layer: hardening · Done-when: the `GOLDEN_FIXTURE.md` gate row in `SPEC.md` P15 -> exit 0 with matching `GOLDEN_FIXTURE.es.md` rows.

- [ ] Run every skill P9–P14 changed through the fixture with the fleet's sanctioned weakest executor, following each `SKILL.md` literally.
- [ ] Append a dated row per skill/version to the `GOLDEN_FIXTURE.md` run log naming model, versions, verdict, and observed blocks.
- [ ] Mirror each new row in `docs/workflow/GOLDEN_FIXTURE.es.md` in the same commit.
- [ ] Record any wording regression a run surfaces as a separate targeted change, never as an edit inside the run.

Phase-lint: PASS (8/8) · fingerprint `P15:hardening:4:qualify-the-amended-skills-on-the-weakest-executor`

## P16 — Close the amended candidate

Layer: close-out · Done-when: the terminal-HEAD receipt set, gate set, `merge-tree` conflict check, and roadmap row stated in `SPEC.md` P16.

- [ ] Fold every fix-now row still open at this head with `fold-findings`, including the F32 owner verdict and F35.
- [ ] Sync the branch with `origin/main` and resolve roadmap row 28's status cell alone; rows 29 and 30 are already byte-identical to `main`.
- [ ] Run the full gate set at terminal HEAD: schema `npm test`, schema drift check, root `node --test scripts/*.test.mjs`, `pre-execution-quality`, `ledger-ownership`, `normative-drift`, `check-skill-context`, `--routes`, Pi bundle and tests, `npx skills add . --list`.
- [ ] Recompute the replacement `ACCEPTANCE.md` blob at terminal HEAD and record a fresh acceptance receipt in `progress.md`.
- [ ] Obtain the context-clean `review-change` PASS receipt at terminal HEAD and post the SHA-bound receipt (this closes F23 and F25 — a fold cannot mint review evidence).
- [ ] Confirm O15–O20 statuses match their cited evidence, then flip the F2/F3/F22/F24/F25/F32 rows in the same commit.
- [ ] Update PR #155 through `gh api` with the amendment summary covering P9–P16 and the measured gate figures, then re-read the body live to confirm it landed.
- [ ] Update the roadmap row to `done · [#155](https://github.com/gtrabanco/agentic-workflow/pull/155)`.
- [ ] Commit `docs(28): link PR #155` and push, and PRINT THE PR URL in the chat.

Phase-lint: PASS (8/8) · fingerprint `P16:close-out:9:close-the-amended-candidate`

## P17 — Prefer the host native SHA-256 digest

Layer: schema/db · Runs **before P16** · Done-when: `cd packages/agentic-workflow-schema && npm test` -> exit 0 with the three-path agreement case; `grep -rn "from \"node:" src/` -> no matches; the probe script prints identical digests and names which path answered.

No version bump is added here: schema `3.5.0` is still unpublished (registry `3.4.0`), so this change ships inside the same release AC10 already names.

- [ ] Route `sha256HexSync` to `globalThis.process?.getBuiltinModule?.("crypto")` when that object exposes `createHash`, and to the existing pure-JS implementation when it does not.
- [ ] Keep the public sync signature and the lowercase 64-hex result identical on both paths.
- [ ] Add the three-path agreement case — native binding, pure JS, WebCrypto async — over the ASCII, multibyte, and oversized corpus to `test/pre-execution-canonical.test.mjs`.
- [ ] Correct the header comment in `src/sha256.ts:13` to name `test/pre-execution-canonical.test.mjs`, the file that actually pins the digests (finding F36).
- [ ] Record the measured cost of the three rejected alternatives — static `node:crypto`, an `@noble/hashes` dependency, and vendoring its 1,419-line `sha256` closure — in `architecture-notes.md`.
- [ ] Add the standing vendoring rule to `CLAUDE.md`: any code copied from a third party carries source URL, author, version, and license name in a header comment.
- [ ] Rewrite the package README's zero-runtime-dependency line to state the contract precisely: no dependencies and no static builtins, with the host's native hash used opportunistically when exposed.

Phase-lint: PASS (8/8) · fingerprint `P17:schema/db:7:prefer-the-host-native-sha-256-digest`
