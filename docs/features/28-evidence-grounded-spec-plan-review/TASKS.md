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

- [x] Write the ledger ownership map with one row per truth class: review findings, planning findings, progress, known-issues, decisions, roadmap, acceptance manifest. *(All seven, `ledger-ownership@1` block in `skills/pre-execution-review/references/LEDGERS.md` § "Durable ledger write ownership (the map)".)*
- [x] Add the declared-mechanical-annotator column and enter `scripts/ledger-provenance.mjs` as `review-findings.md`'s annotator, naming the fold token it may append and its validator. *(`annotator | annotator-token | validator`; the tokens `· fold <sha>`, `· ticked <sha>`, `· REOPENED P<n>` are pinned to the lines that emit them — `scripts/ledger-provenance.mjs:288,293` — by the `ledger-ownership` case "the fold provenance token is pinned to the annotator line that emits it", validator cell `node --test scripts/ledger-provenance.test.mjs`.)*
- [x] Declare owner and annotator in `docs/features/_TEMPLATE/` and `docs/fix/_TEMPLATE/` ledger templates. *(New `docs/features/_TEMPLATE/LEDGERS.md` + `docs/fix/_TEMPLATE/LEDGERS.md`: per-tree projections of the map, checked against it in both directions so a template row cannot be added, dropped, reworded or left owner-less.)*
- [x] Write `scripts/ledger-ownership.test.mjs` red first: the declared-owner scan must fail a template row with no owner. *(`scan 1 fails a template ledger row with no owner (AC16's named fixture)`; red-first proven mechanically — the suite run against the pre-P9 tree (`git archive 0feaaf64`, map and templates absent) reports 16 of 18 failing and exits 1, see `testing.md` § P9.)*
- [x] Add the script write-path scan so a script writing a durable ledger absent from the map fails the suite. *(`writePathScan` over `scripts/*.mjs` + `packages/*/scripts/*.mjs` excluding `*.test.mjs`, with the `# no-script-writer` directive for the durable records that no script may touch; five fixture cases prove the refusal, one proves a generated-artifact writer stays out of scope.)*
- [x] State the one-owner rule in `skills/pre-execution-review/references/LEDGERS.md` as the single cited source. *("a durable ledger has exactly one writer per column set, plus at most one declared mechanical annotator, which may append only the token its own row names" — cited by both templates, restated nowhere else.)*

Phase-lint: PASS (8/8) · fingerprint `P9:docs:6:declare-durable-ledger-write-ownership`

## P10 — Mark terminal verdicts durably

Layer: docs · Done-when: `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 and the write-then-report `grep` in `SPEC.md` P10 -> exit 0.

- [x] Add the write-then-report rule to `skills/pre-execution-review/references/POLICY.md` as its one owner. *(New §8 "Write-then-report" — `POLICY.md:135`: the act-binding sentence, the four gate-rejection types, the fixed `GATE REJECTION` trace, the `MARK REPLAY` refusal and the terminal marks' homes, all stated once. The `ledger-ownership` phrase "one owner per rule" is pinned for this surface by the `pre-execution-quality` case "write-then-report has one owner; reviewers cite it in one line", which fails any consumer that restates §8.)*
- [x] Cite that rule from `skills/review-spec/SKILL.md`'s turn contract without restating it. *(`skills/review-spec/SKILL.md:34-35` — the verdict box ends "write-then-report (`pre-execution-review`'s `POLICY.md` §8)": rule name plus owner, one line. The same case asserts `\bsame act\b`, "are one act" and `MARK REPLAY` appear in no consumer; `review-spec` 1.3.0.)*
- [x] Cite that rule from `skills/review-plan/SKILL.md`'s turn contract without restating it. *(`skills/review-plan/SKILL.md:39-40`, same one-line form, same pin; `review-plan` 1.3.0.)*
- [x] Fix the typed gate-rejection vocabulary (dependency, status, phase-lint, stale-or-missing-receipt), each trace naming reason and return route. *(The closed set lives in §8; each printed block carries its own type: `PREFLIGHT.md:35` `dependency`, `:87` and `:103` `status` (idea, defined), `:180` `phase-lint`, `PRE_EXECUTION_GATE.md:28` `stale-or-missing-receipt` — each with a `Reason:` and a `Return route:` line. Fixture case "gate rejections: the four typed blocks print reason and return route, never a fifth type" compares the printed set to the closed one, requires five traces, and refuses a fifth type or an untyped rejection (`writes: []`).)*
- [x] Add the replay rule: a stale, wrong, or duplicate mark refuses with a typed reason and performs no side effect. *(`POLICY.md` §8's third bullet; fixture case "replay: a stale, wrong or duplicate mark refuses with zero side effects" computes the refusal in `applyTerminalAct` (`scripts/pre-execution-quality.test.mjs:1077`) over fixture state and asserts `writes` is empty and the ledger comes back unchanged — the absence of writes, not the presence of a message.)*
- [x] Add the terminal-mark, rejection-trace, and replay-refusal fixtures to `scripts/pre-execution-quality.test.mjs`. *(Four cases — `:1104` terminal marks, `:1128` rejection traces, `:1156` replay refusals, `:1182` owner/citation pins — modelled the way the P4 route fixtures are: `applyTerminalAct`, `rejectionTrace` and `MARK_HOME` are pure decisions over fixture state, so each refusal is computed. The suite is 53/53 exit 0 and re-points at any tree through `PRE_EXECUTION_QUALITY_REPO`; against the pre-P10 tree it answers 50 pass / 3 fail / exit 1 (see `testing.md` § P10). The AC17 homes are checked against the ownership map in the first case, so §8 cannot place a mark the map does not declare.)*
- [x] State the identity-value rule once, in `skills/pre-execution-review/references/POLICY.md` §7 — a reviewer recomputes the parent digest and records the claimed value beside it as the reported defect — and make `skills/review-plan/SKILL.md:35` cite that owner instead of saying "copied from the receipt" (finding F37). *(`POLICY.md:126-128` now reads "records the claimed value **beside the recomputed one**, and that pairing — never a substitution — is the reported defect", and the turn-contract box at `skills/review-plan/SKILL.md:35-36` says "recomputed and never copied as identity (`pre-execution-review`'s `POLICY.md` §7 owns the identity-value rule)". Pinned by name: the case asserts `copied from the receipt` is gone and that the §7 pointer is there — the stable citation P14's drift gate compares the two sentences on.)*

Phase-lint: PASS (8/8) · fingerprint `P10:docs:7:mark-terminal-verdicts-durably`

## P11 — Prove clean reviews with a durable mark

Layer: docs · Done-when: `node --test scripts/workflow-status-pre-execution.test.mjs` -> exit 0 with the mark-present and ledger-only cases.

- [x] Define the zero-finding durable review mark row shape in `LEDGERS.md`. *(New § "The durable review mark" at the end of the ownership-map section: the `review-mark@1` block declares one row of `review-findings.md` in that ledger's existing seven columns — `REVIEW-RAN | HEAD <40-hex sha> | n/a | n/a | review-mark | n/a | n/a` — with the reviewed revision in `file:line`, so the ledger's own `file:line`+axis dedupe admits exactly one mark per reviewed state. The map's `review-findings` owner cell (line 138) gained `review-change:review-mark` **and** both projections moved in the same commit (`docs/features/_TEMPLATE/LEDGERS.md:14`, `docs/fix/_TEMPLATE/LEDGERS.md:14`), which `node --test scripts/ledger-ownership.test.mjs` 18/18 exit 0 proves in both directions; §8 is cited for *when* an act marks and restates nothing, so the new text keeps `same act` / `are one act` / `MARK REPLAY` out of this file. D40 records why a row of the existing ledger beat a new file, a `progress.md` line, a fenced marker or the PR receipt.)*
- [x] Replace `workflow-status`'s ledger-presence review-run proof in `references/SENSOR_CORE.md` with the durable mark. *(Step 8, `SENSOR_CORE.md:81-91`: the proof is now the `REVIEW-RAN` row of the unit's `review-findings.md` ledger, "whose shape and writer `pre-execution-review`'s `LEDGERS.md` owns", counted "only while the head sha it names is the unit's current head", and the replaced rule is named as false in both directions — "presence would call a reviewed unit unreviewed and an unreviewed one reviewed". The `its presence, with any rows at all, proves …` sentence is gone (the new suite asserts `rows at all` / `IS that artifact` / `presence, with` never return), the `audit-pr` marker half and the `review_pending` / `audit_pending` / `merge_ready` derivation are intact, and step 9's `folded: no` read is untouched.)*
- [x] State the same keying in `skills/workflow-status/references/PRE_EXECUTION.md` and delete the ledger-presence sentence. *(`PRE_EXECUTION.md:27-36`, "What proves a review ran (step 8)": the mark, its owner citation, the current-head equality "every receipt above already rests on", and that a ledger with rows and no mark leaves the unit review-pending — reported as a missing gate, "never a verdict that no review ever happened". Nothing was deleted: `grep -n` over the file shows its only ledger-presence wording is `no ledgers and no receipt` (the `legacy` label and the Legacy-units route), which states that a unit predates feature 28 and is a different claim from "the review ran"; deleting it would have erased AC4's legacy vocabulary. No second copy of the row shape was written here (`review-mark@1` stays in exactly one file — the suite scans `skills/` and `docs/` for it).)*
- [x] Add both sensor fixtures — mark present with zero findings proves review-ran, ledger without mark does not. *(New `scripts/workflow-status-pre-execution.test.mjs`, 6 cases, exit 0. Both required cases are computed decisions over fixture state, and the state is assembled from the shape parsed out of `LEDGERS.md`, so neither can pass on a tree that never declared the mark; case 3 is the negative control (a mark bound to an older head answers `stale-mark` and stays review-pending, while the same ledger read at the marked revision answers review-ran), and case 4 proves the mark is never projected as a fix-now finding. Red-first against the pre-P11 tree `git archive 35a5a0b0` → 0 pass / 6 fail / exit 1; with the P11 `LEDGERS.md`, SKILL.md and projections copied onto that tree but its old sensor docs → 4 pass / 2 fail / exit 1, so each surface is pinned separately. Re-pointable through `WORKFLOW_STATUS_PRE_EXECUTION_REPO`, the same shape as P9/P10's suites.)*
- [x] Bump every touched skill with `bump-skill` and regenerate the Pi bundle to byte parity. *(`workflow-status` 3.0.3 → 3.1.0 and `pre-execution-review` 1.4.0 → 1.5.0 — both `minor`: the envelope, its labels and its overrides are unchanged, and the added key is an opaque `detail` signal. Each bump's surfaces moved together: per-skill `CHANGELOG.md`/`CHANGELOG.es.md` rows (the internal-skill table for `pre-execution-review`), one release-log line in both languages, the `workflow-status` cell in `README.md`/`README.es.md`, both rows in `SKILLS.md`/`SKILLS.es.md` (including `pre-execution-review`'s "the durable review mark's row"), the `LEDGERS.md` coverage line in `skills/pre-execution-review/SKILL.md`, and the human-facing ledger paragraph in `FEATURE_WORKFLOW.md`/`.es.md`. `bun run bundle:skills` re-bundled 38 skills / 122 files and `bun run test` in `packages/pi-agentic-workflow` answers 134/134 exit 0, so the mirror is byte-identical; `npx skills add . --list` still lists `workflow-status`. No `model-routing.yml` tier changed, so routing metadata stayed put. D40 names the five route ceilings re-based to their measured floors.)*

Phase-lint: PASS (8/8) · fingerprint `P11:docs:5:prove-clean-reviews-with-a-durable-mark`

## P12 — Conserve delegated evidence as a versioned artifact

Layer: docs · Done-when: `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 with the delegated-evidence and NEEDS-EVIDENCE fixtures.

- [x] Write the delegate-only read-only role contract: never invoked in the authoring context, fresh read-only context where supported, manual fresh conversation as the portable fallback. *(New `skills/evidence-grounding/references/DELEGATION.md:9-29`: the contract table names the invoker, the context, the read-only permission and the one file it may write, and its Forbidden row carries both review PASS words; the Portability paragraph states the fallback inline — "run the pass in a **fresh conversation**", paste this section and the questions, nothing else. `skills/evidence-grounding/SKILL.md:77` routes step 2 to it, so the role is reachable from the pass that dispatches it and from nowhere else. Fixture case `delegated-evidence role: read-only, outside the authoring context, in a named toy-ledger sandbox`.)*
- [x] Fix the artifact shape: positive revision, `done / partial / blocked`, the questions, sources with id, class, title, publisher, URL, accessed_at, excerpt, claims mapped to source ids, contradictions, uncertainty, freshness, separately-held non-authoritative product choices, explicit unverified-claims section. *(`DELEGATION.md:50-95` — one `delegated-evidence@1` block, one file per unit (`docs/features/<NN>-<slug>/delegated-evidence.md` · the `docs/fix/` analogue), the closed `revision` / `outcome` lines, `questions`, `sources` with the seven fields AC18 names, `claims` naming `SRC-id`s, `contradictions`, `uncertainty` (added 2026-09-01 in the follow-up commit — the task names it, AC18 does not, so the shape is a superset: D42), `freshness`, `product-choices` held separately and marked non-authoritative, `unverified-claims`, and the author-owned `spot-check` row. `class` and `accessed_at` reuse `ROWS.md`'s closed vocabularies instead of minting new ones, and zone ownership says which rows nobody may edit afterwards. Fixture case `delegated-evidence artifact: a done run resolves its claims through the seven source fields`, which also scans `skills/` for a second copy of the grammar.)*
- [x] Add the readiness rule: a `partial` or `blocked` artifact yields zero validated claims and returns `NEEDS-EVIDENCE`. *(The definition sits with the shape (`DELEGATION.md:97-106`: validated ⇔ `done` + resolvable `SRC-id` + a `PASS` spot-check), the gate at its owner (`READINESS.md:14-22` shared box D1, both stages) with the routing row in §Result — no parallel gate in any consumer. The fixture computes the rule rather than quoting it: `validatedClaims` / `delegatedEvidenceGate` (`scripts/pre-execution-quality.test.mjs:1248`, `:1254`) answer `[]` and `NEEDS-EVIDENCE` for `partial` and `blocked`, and the same case asserts the phrase `zero validated claims` is defined in exactly one file.)*
- [x] Add persist-then-STOP: the pending state is written before any user prompt, then the turn ends. *(`DELEGATION.md:108-118` names what the pending write carries (`revision`, `outcome: blocked|partial`, the open `questions`, the blocker in `unverified-claims`), where it goes (that artifact) and that the turn ends there — and cites `pre-execution-review/references/POLICY.md` §8 for the discipline. §8 was extended at its owner rather than forked: `POLICY.md:164` "A pending write is a mark" is now the single sentence that binds a required-before-the-prompt write to the stop. Fixture case `delegated-evidence turn: the pending state is written before any prompt, then the turn ends` orders the events and refuses three defective sequences.)*
- [x] Add the advisory-until-validated rule with spot-checking citations named as the validation act. *(`DELEGATION.md:99-104`: "The **spot-check is what validates**" — the authoring skill re-opens the cited sources and records `PASS`/`FAIL` per claim; until then every claim is advisory, "it may shape a question, never a row of the SPEC or the plan". Fixture case `delegated-evidence authority: advisory until the authoring skill spot-checks the citations` proves the `done`-but-unchecked run and a `FAIL` row both validate nothing.)*
- [x] State that capability gating is self-attested and out of scope, with no grant vocabulary added. *(`DELEGATION.md:120-127`, once: the host's ability to open a fresh read-only context is **self-attested** by the turn claiming it, the contract records or withholds no permission, and `outcome` plus `spot-check` are the whole authority story. The fixture scans `DELEGATION.md` and `READINESS.md` for `grant`/`entitlement`/`capability flag`/`allow-list` and fails on any hit (`asserts … adds no grant vocabulary`).)*

Phase-lint: PASS (8/8) · fingerprint `P12:docs:6:conserve-delegated-evidence-as-a-versioned-artifact`

## P13 — Run normalizers before the artifact freeze

Layer: docs · Done-when: `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 and -> non-zero when a mutating step follows the freeze row.

- [x] Add the ordering rule to `skills/execute-phase/references/PRE_EXECUTION_GATE.md`: mutating steps precede the freeze, check-only steps follow it. *(`PRE_EXECUTION_GATE.md:56-66`, §"Normalizer order (mutating steps before the freeze, check-only after)", appended to the section that already owns the fixed pre-flight order: "**Every source-mutating normalizer runs strictly before the freeze row, and after it only check-only steps follow**", the freeze row named as the plan snapshot a receipt records plus the acceptance-manifest blob, and the dual-mode rule ("only the check-only mode may run after the freeze"). One home, scanned: `strictly before the freeze row` occurs in exactly one file under `skills/` (fixture case `normalizer order: a mutating step scheduled after the freeze row is refused by name`), and every other surface cites the section instead of copying it.)*
- [x] Add the invalidation sentence: a byte change to a frozen input after the freeze voids current receipts and forces fresh review. *(`PRE_EXECUTION_GATE.md:68-73`, same section: "**A byte change to a frozen input after the freeze voids every receipt that bound it and forces a fresh review.**", with `SNAPSHOT.md` and `POLICY.md` §7 cited as the owners of what a snapshot binds and of the digest recompute and neither restated (the fixture refuses the digest recipe, §7's pairing sentence and §8's marking sentences inside the section). The provenance is stated in the same breath: what the rule adds over the digests is a **step-order guarantee**, not a claim that bytes were never re-written before.)*
- [x] List this repository's normalizers in one place: `bump-skill`, `npm run bundle:skills`, generators, formatters, docs generators. *(`CLAUDE.md:250-279`, §"Normalizer inventory (this repository)" — one fenced `normalizer-inventory@1` block: `bump-skill` (version bumper and doc writer), `npm run bundle:skills` (the Pi mirror), `npm run build (packages/agentic-workflow-schema)`, both `generate-*.schema.mjs` generators, `generate-docs` (writes `docs/site/guides/`), each `side: before`; their `--check` modes, `pre-execution-snapshot.mjs verify` and `check-skill-context.mjs --routes`, each `side: after` and `kind: check-only`; and the honest formatter entry — **none declared**, no Prettier, Biome or EditorConfig config exists in this repository. The gate reference carries no copy (`assert.ok(!execGate.includes("normalizer-inventory@1"))`); the home scan accepts `CLAUDE.md` alone, and D43 records why the shipped skill text is the wrong home.)*
- [x] Add the normalizer-ordering fixture that fails when a mutating step is scheduled after the freeze row. *(`scripts/pre-execution-quality.test.mjs:1362-1498`, three cases. `scheduleVerdict` (`:1367`) is a pure decision over an ordered schedule and a freeze index: the legal schedule (edit → `bump-skill` → `bundle:skills` → generator → freeze → `--check` → `verify`) answers `{ok: true, offenders: []}`, the same schedule with the bundler moved behind the freeze answers `{ok: false, offenders: ["npm run bundle:skills"]}` — the refusal names the step — and two late steps are reported together in schedule order. `inventorySchedule` (`:1391`) then builds a schedule from the parsed inventory, where order comes from `side` and `mutates` from `kind`, so re-marking the bundler as a tail step is refused rather than re-labelled. Red first against `git archive 3f2ff3a0` → 58 pass / 3 fail / exit 1, and 60 pass / 1 fail with only the gate section added.*

Phase-lint: PASS (8/8) · fingerprint `P13:docs:4:run-normalizers-before-the-artifact-freeze`

## P14 — Bind normative prose to machine surfaces

Layer: hardening · Done-when: `node --test scripts/normative-drift.test.mjs` -> exit 0 and -> non-zero against each of the three injected disagreements.

- [x] Inventory the normative surfaces that order an agent action: skill process text, `SENSOR_CORE.md`, `TURN_CONTRACT.md`, `PREFLIGHT.md`, closing hand-off blocks. — `CLAUDE.md:293` declares `normative-surfaces@1` (18 rows of `surface | file | grammar | machine | must-name`) and `CLAUDE.md:328` declares `rendered-facts@1` (5 rows); the test reads both, resolves every `file` cell (including the `skills/*/SKILL.md` pattern into 39 files) and reports 0 faults over 54 files.
- [x] Give every inventoried surface that lacks one a fixed grammar: fenced command block, fixed-output contract block, or versioned reference table. — six grammars added where prose had none: `skills/pre-execution-review/references/POLICY.md:64` `gate-rejection-vocabulary@1`, `skills/orchestration-envelope/references/TURN_CONTRACT.md:31` `hand-off-transitions@1`, `:46` `hand-off-fields@1`, `skills/plan-feature/references/ROUTING.md:134` `plan-mode-routes@1`, `skills/plan-fix/references/PLANNING_PROCESS.md:127` `fix-mode-routes@1`, `skills/workflow-status/references/SENSOR_CORE.md:117` `sensor-fields@1`; the remaining twelve rows reuse a grammar that already existed (`frontmatter:argument-hint`, `fenced:→ Next:`, `fenced:GATE REJECTION —`, `fenced:Verdict:`, `fenced:--stage`, `table:One label per stage`, `block:ledger-ownership@1`, `block:review-mark@1`). `AC15 scope: every normative surface…` refuses a row whose `grammar` cell does not resolve, so an unformalised surface cannot be inventoried at all.
- [x] Write `scripts/normative-drift.test.mjs` red first against the schema package's published vocabularies. — 14 tests, `node --test scripts/normative-drift.test.mjs` exit 0 on this tree; red against `git archive 5a3d094eea7156d60a9b9b7895fda24d62f36f8f` plus this file: 7 pass / 7 fail / exit 1 (the scope, both directions, render-only, version-cell and fail-closed cases all refuse the pre-phase tree).
- [x] Cover the transition and argument references made by `review-spec` and `review-plan`. — rows `review-spec-verdicts`, `review-plan-verdicts`, `review-spec-handoff`, `review-plan-handoff`: their `Verdict: <spec|plan-pass|…>` cells resolve against `PRE_EXECUTION_VERDICTS` **and** `VERDICTS_BY_STAGE`, their receipt contract id against `PRE_EXECUTION_RECEIPT_CONTRACT_ID`, and their 29 `-> Next: /command` tokens against `WORKFLOW_INTENTS` plus the host commands the inventory declares.
- [x] Cover the gate transitions in `execute-phase`, `plan-feature`, and `plan-fix`. — `plan-mode-routes@1` and `fix-mode-routes@1` give the router tables a fixed grammar (6 flag rows, 7 route rows), so each `--mode` / flag / route triple is checked against the owning skill's `argument-hint:` and against the skill set; the four `GATE REJECTION — <type>` traces in `PREFLIGHT.md` and `PRE_EXECUTION_GATE.md` resolve against `gate-rejection-vocabulary@1`, and the reverse direction requires all four declared types to be printed.
- [x] Cover the `workflow-status` sensor labels and the envelope field references. — `sensor-labels` keeps the per-stage label table parseable, `sensor-envelope-fields` resolves its 9 projected fields (13 rows across both field grammars) against the `rejectUnexpectedKeys` lists the validators actually pass, and `hand-off-fields@1` binds `next.recommended|alternatives|tier|suggested` to the envelope's `next`, not the outcome's.
- [x] Add the render-only check: prose restating a version, SHA, count, or next command must equal the machine value or the test fails. — `render-only prose: a restatement that drifts…` recomputes the user-facing skill count from frontmatter and refuses a `SKILLS.md` / `SKILLS.es.md` header that disagrees; `version cells and package versions are recomputed, not trusted` compares every skill and package row in both changelogs against frontmatter and `package.json`, and `literal:` compares the receipt contract id. It found and fixed a real drift: `CHANGELOG.md` had no `plan-feature` 5.0.0 row while `CHANGELOG.es.md` did, and a stray 5.0.0 row sat under `design-feature`.
- [x] Pin the two sentences F37 split two models: the `review-plan` parent-digest line and `POLICY.md` §7 must agree through one cited owner, and the gate fails when either is reworded away from it. — `F37 has one cited owner…` requires `POLICY.md` §7 to keep stating the identity-value rule, requires both `review-plan/SKILL.md` and `review-spec/SKILL.md` to cite `§7`, refuses either citation reworded away (proven by an in-memory patch), and refuses a third file anywhere under `skills/` that restates the owner's sentence instead of citing it.

Phase-lint: PASS (8/8) · fingerprint `P14:hardening:8:bind-normative-prose-to-machine-surfaces`

## P15 — Qualify the amended skills on the weakest executor

Layer: hardening · Done-when: the `GOLDEN_FIXTURE.md` gate row in `SPEC.md` P15 -> exit 0 with matching `GOLDEN_FIXTURE.es.md` rows.

- [x] Run every skill P9–P14 changed through the fixture with the fleet's sanctioned weakest executor, following each `SKILL.md` literally. (*Four live runs on `nan/qwen3.6`, this fleet's sanctioned weakest reasoning executor, 2026-09-02, each in its own scratch git repo under `/tmp/gf-p15/` with the library declared read-only: review-spec 1.3.0 + pre-execution-review 1.5.0 at the Product stage (`/tmp/gf-p15/spec` @ `264e0ce`, commit `9cb5e74`), review-plan 1.3.0 at the Plan stage (`/tmp/gf-p15/plan`, commit `d2ef8d4`), workflow-status 3.1.0 over two units (`/tmp/gf-p15/status` @ `34d5b16`), evidence-grounding 1.3.0 (`/tmp/gf-p15/ev` @ `aecf279`). Each followed its own `SKILL.md` from the library checkout — no paraphrased input — and the four run-log rows name every block printed, file written and step invented.)*
- [x] Append a dated row per skill/version to the `GOLDEN_FIXTURE.md` run log naming model, versions, verdict, and observed blocks. (*`docs/workflow/GOLDEN_FIXTURE.md:313-316` — four `| 2026-09-02 | nan/qwen3.6 …` rows covering all five skills P9-P14 moved (pre-execution-review 1.5.0 is named in both reviewer rows, whose runs loaded its `POLICY.md` §7 and §8); three verdicts PASS, one objective PASS · procedure FAIL (box 3) recorded as such rather than rounded up.)*
- [x] Mirror each new row in `docs/workflow/GOLDEN_FIXTURE.es.md` in the same commit. (*`docs/workflow/GOLDEN_FIXTURE.es.md:327-330` — same four rows, same date/model/verdict cells, in this commit; plus the Spanish coverage addendum after the existing `Nota de cobertura`.)*
- [x] Record any wording regression a run surfaces as a separate targeted change, never as an edit inside the run. (*Regression surfaced and filed as F38-F41 with `folded: no` in `review-findings.md`; the box stays open until the targeted change for the two findings that block the evidence-grounding PASS row (F40 routing trigger, F41 heading list) lands as its own change and is re-run — the phase gate sentence is withheld until then, per the run-log coverage addendum.*) (*Shipped 2026-09-02 as its own change, never as an edit inside a run: `skills/evidence-grounding/SKILL.md` step 2 now tells a reader that it is the delegate when it did not write the artifact, `DELEGATION.md`'s `Invoked by` cell says the same, and `READINESS.md` box 1 cites `SPEC_PRODUCT_REQUIRED_HEADINGS` instead of restating the list — evidence-grounding 1.4.0, with the re-run's dated PASS row at `GOLDEN_FIXTURE.md:317` and the gate sentence present (`grep -qE …` exit 0). F41 is additionally machine-pinned by `scripts/normative-drift.test.mjs`, red-first against `5a2754c0` (13 pass / 1 fail / exit 1). F38 and F39 were deliberately **not** fixed here — see D45.*)

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
