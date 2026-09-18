# Decisions — 32-review-consistency-pack

Product-half decisions recorded by `design-feature` (append-only; newest last).

## 2026-09-17 — D32-1: only the *missing* NRS ledger degrades to a substrate notice

- **What**: `workflow-status` stops blocking on an absent
  `docs/workflow/REPOSITORY_STATE.md` and emits a machine-readable, non-blocking
  substrate notice instead. `draft`, `contradicted`, and `resolved` statuses keep
  blocking exactly as today.
- **Why**: the issue's contradiction fix targets the missing-ledger blocker
  specifically ("degrades its missing-ledger *blocker* to a machine-readable
  substrate notice"); NRS is optional by contract
  (`EXECUTION_CONTRACT.md:108-116`). A present-but-unfrozen or contradicted
  ledger is a real integrity problem, not an absent substrate — degrading those
  would silently weaken the NRS contract beyond the issue's scope.
- **Authority**: issue #172 wording + repository evidence E-07/E-08; recorded by
  `design-feature` 2026-09-17.

## 2026-09-17 — D32-2: the severity conversion table is closed over existing scales

- **What**: the canonical conversion table in
  `review-implementation/references/CLASSIFY.md` maps the scales that actually
  exist at implementation time: the ledger scale `high|med|low`, `audit-docs`'
  `high|low`, and (once feature 31 lands) the planning scale
  `info|low|medium|high|critical`. Unknown scales fail closed — a consuming
  skill never converts ad hoc; adding a scale means one table row in the owning
  section.
- **Why**: the issue asserts "finder scale `critical|major|minor` → ledger
  `high|med|low` is already mapped", but no such scale exists anywhere in
  `skills/` or `packages/agentic-workflow-schema/src/` at authoring HEAD
  `4b3a56b` (evidence row E-09). Encoding a phantom row would write unevidenced
  contract text — the exact defect this feature exists to remove. The deviation
  is a strict narrowing: the issue's intent (one conversion authority) is fully
  preserved.
- **Authority**: repository evidence E-03/E-04/E-09; issue #172 as the
  requested outcome. Recorded by `design-feature` 2026-09-17.

## 2026-09-17 — D32-3: GATE-RAN is a durable ledger mark, not a schema contract

- **What**: the gate-run receipt is a fixed-format, append-only text mark
  (`GATE-RAN | HEAD <sha> | <cmds> | exit <code>[ | <additive slots>]`) recorded
  by whoever ran the gate, in a ledger whose home file and single writer are
  fixed by a new `ledger-ownership@1` map row added in the same change. No
  `@gtrabanco/agentic-workflow-schema` type, envelope field, or JSON Schema is
  added.
- **Why**: same ruling as feature 30's REPAIR-RECEIPT (D30-3): durable state
  stays in the existing ledgers; a schema contract would couple a wording-level
  consistency sweep to a package release. The SHA-binding pattern matches
  `review-mark@1`, so freshness discipline is identical.
- **Authority**: issue #172 + its 2026-09-07 amendment; feature 30 precedent.
  Recorded by `design-feature` 2026-09-17.

## 2026-09-17 — D32-4: extensible digest slots from day one

- **What**: GATE-RAN's format treats every field after `HEAD` as additive:
  consumers ignore unknown trailing fields, and a trailing `manifest <sha>` slot
  is reserved from day one. The owning spec carries the one-line rule and the
  discipline test pins it.
- **Why**: the 2026-09-07 amendment on issue #182 (scoped affecting-path
  manifests, feature 35) requires the same mark to gain the scope manifest
  without a format migration; hard-coding `exit` as the final field would force
  exactly that migration.
- **Authority**: issue #172 amendment section; recorded by `design-feature`
  2026-09-17.

## 2026-09-17 — D32-5: execute-phase's NRS clause is regression-only

- **What**: `skills/execute-phase/references/EXECUTION_CONTRACT.md` is not
  re-edited by this feature; it already records NRS as optional ("record
  `n/a: no normalized repository state`; NRS is optional") at authoring HEAD.
  The surface gets a regression check only.
- **Why**: the issue's affected-surfaces list was authored before that clause
  landed; re-editing already-correct text would churn a merged surface with no
  semantic change and re-open review scope for nothing.
- **Authority**: repository evidence E-08; recorded by `design-feature`
  2026-09-17.

## 2026-09-17 — Roadmap row 32 promoted `idea → defined`

- **What**: the roadmap row for feature 32 keeps its number, slug, and
  dependencies; status moves `idea → defined` in the same turn that stamps the
  Product half `designed`.
- **Why**: this skill owns the `idea → defined` transition
  (`design-feature:idea-or-defined-row` in `ledger-ownership@1`); statuses past
  `defined` belong to `plan-feature-scaffold` / `execute-phase`.
- **Authority**: `ledger-ownership@1` roadmap row; recorded by `design-feature`
  2026-09-17.

## 2026-09-18 — D32-6: repair batch F1–F8 (SPEC-REVIEW-32-1) — every emitted scale in the table; GATE-RAN's home ledger and recorder set named

- **What**: one evidence-bounded repair batch closing all eight findings of
  receipt SPEC-REVIEW-32-1 (`planning-findings.md` F1–F8, all `class:
  product`), applied to the Product half in place:
  (F1) the canonical conversion table now covers the finder scale
  `critical|major|minor` emitted by the nine internal review passes and
  replaces the ad-hoc mapping at `PERSIST_AND_DECIDE.md:20-21`; E-09 is
  rewritten accordingly (the original absence claim was falsified).
  (F3) the planning-scale row (`info|low|medium|high|critical`) lands in this
  unit — DD-1's premise ("does not exist until feature 31 merges") was false:
  the scale is the findings-ledger severity vocabulary at `LEDGERS.md:92`,
  live in shipped planning ledgers; DD-1 is resolved, `Deferred decisions`
  reads `none`, sweep row 15 is in-scope. (F2) the Integration closure states
  `docs/CAPABILITIES.md` is the unfilled template (tracked since `1bab6e60`,
  no live inventory) and reconciles the derived inventory against its roles
  table + subsystem floor; the original "seed from template" offer becomes a
  **fill** offer (below). (F4) GATE-RAN's home ledger is named: the unit's
  `review-findings.md` (feature and fix variants) — the same home as the
  `review-mark@1` precedent — fixed by the `ledger-ownership@1` map row added
  in the same change. (F5) the role matrix allows `agent-reviewer` to record
  GATE-RAN: reviewers run the project's gate (`review-verify`'s checklist,
  `review-change`'s fold review), so the recorder set spans executor and
  reviewer gate runs; the executor cell's "sole recorder" claim is removed.
  (F6) AC-02 pins the fixed-output header `| # | Check (1-14) |` alongside
  `<n>/14`. (F7) IS-1's tutorial scan gains its criterion in AC-01 (grep pin
  over `docs/workflow/`, `GOLDEN_FIXTURE.md` history excluded).
  (F8) attribution correction, recorded here because this ledger is
  append-only: D32-4 above cites "the amendment on issue #182" — the
  2026-09-07 amendment is **carried by issue #172's amendment section**;
  #182's amendment is its provenance, not its carrier (the SPEC's Goal and
  E-13 already cited it correctly).
  Intent is unchanged throughout: every repair re-aligns the half with issue
  #172's recorded scope — item 2 names the finder scale "already mapped" and
  asks the planning-scale row into the same table; item 4's "whoever runs the
  project gate" includes reviewers.
- **Why**: falsification by `review-spec` (receipt SPEC-REVIEW-32-1) proved
  three absence claims false (E-09, the CAPABILITIES absence, the planning
  scale's non-existence) and two rows under-specified (GATE-RAN's home ledger,
  recorder roles); repairing restores the evidence contract this feature
  itself enforces.
- **Supersedes**: D32-2's scale list (now four scales, finder included) and
  its "closed over existing scales" framing; DD-1. D32-2/D32-4 above keep
  their original text per append-only ledger rules; the SPEC's Product
  decisions summary carries the revised state.
- **Open offer (corrected, upsert-safe, user confirms)**: fill
  `docs/CAPABILITIES.md` from the derived Integration-closure inventory — the
  file already exists as the unfilled template, so the original "seed from
  template" offer is replaced by this one.
- **Authority**: issue #172 (items 2 and 4, amendment section); receipt
  SPEC-REVIEW-32-1 findings F1–F8; evidence rows E-09 (revised), E-22, E-23.
  Recorded by `design-feature` (repair batch, 2026-09-18).

## 2026-09-18 — D32-7: repair batch F9–F10 (SPEC-REVIEW-32-2) — GATE-RAN's ownership encoded the way the `ledger-ownership@1` grammar admits; Spec-lint self-counts corrected

- **What**: one evidence-bounded repair batch closing both findings of receipt
  SPEC-REVIEW-32-2 (`planning-findings.md` F9 `high`/product, F10 `low`/product),
  applied to the Product half in place:
  (F9) IS-4, AC-04, the GATE-RAN entity-closure Create row, and the
  Integration-closure `ledger-ownership@1` row no longer demand a **new**
  `gate-ran` map row — the machine-read grammar (`scripts/ledger-ownership.test.mjs`)
  freezes exactly the seven AC16 truth classes, forbids a second row declaring
  the `review-findings.md` ledger pattern, and allows one writer per column
  set, so the demanded row could not exist while AC-01 keeps the suite green.
  GATE-RAN's ownership is instead encoded on the **existing** `review-findings`
  truth-class row: its owner cell gains the two gate-running recorders as new
  column-sets, `execute-phase:gate-ran-marks` (executor phase gates) +
  `review-change:review-gate-ran-marks` (reviewer gate runs) — distinct
  column-set names per the one-writer-per-column-set rule — and both template
  projections (`docs/features/_TEMPLATE/LEDGERS.md`,
  `docs/fix/_TEMPLATE/LEDGERS.md`) gain the identical owner cell in the same
  change. (F10) the Spec-lint self-description states the true counts: five
  entities × five rows (= 25 closure rows) and eighteen Integration-closure
  inventory rows.
- **Why**: the reviewer proved empirically that the demanded map row fails the
  suite (`map truth class "gate-ran" is not one of the seven AC16 classes`;
  ledger already declared by `review-findings`); the repair instruction chose
  the grammar-admitting owner-column extension over declaring a grammar
  change (a `@2` grammar bump is a contract change this wording-level sweep
  does not need). Product intent is unchanged: GATE-RAN keeps exactly one
  home ledger (the unit's `review-findings.md`, feature and fix variants) and
  named recorders — now declared where the grammar can actually enforce them,
  via the map/template agreement the suite pins. F10 is mechanical and
  intent-preserving (count corrections only).
- **Supersedes**: the "new `ledger-ownership@1` map row" encoding in D32-3's
  summary (the append-only D32-3 entry above keeps its original text; the
  SPEC's Product-decisions D32-3 bullet now points here).
- **Authority**: receipt SPEC-REVIEW-32-2 findings F9–F10 (snapshot
  `4efd6ffa…`); `scripts/ledger-ownership.test.mjs` grammar (`TRUTH_CLASSES`,
  unique-ledger check, `ownerCellFailures` one-writer-per-column-set check,
  map/template equality); the user's repair instruction. Recorded by
  `design-feature` (repair batch, 2026-09-18).

## 2026-09-18 — D32-8: repair batch F11–F12 (SPEC-REVIEW-32-3) — template projections vs the `template/` export mirror disambiguated; IS-5(c) evidence row added

- **What**: one evidence-bounded repair batch closing both findings of receipt
  SPEC-REVIEW-32-3 (`planning-findings.md` F11 `medium`/product, F12
  `low`/product), applied to the Product half in place:
  (F11) the out-of-scope bullet "No `template/` change" is reworded. "Template"
  carried two meanings and the non-goal's stated reason was false for the
  surfaces the D32-7 repair makes change: the two LEDGERS.md **template
  projections** the scaffold reads (`docs/features/_TEMPLATE/LEDGERS.md`,
  `docs/fix/_TEMPLATE/LEDGERS.md`) DO change — they gain the identical
  `review-findings` owner cell per IS-4/D32-7 (`scripts/ledger-ownership.test.mjs`
  reads only those two files and demands map/projection owner-cell equality).
  The bullet now scopes the unchanged surfaces precisely: the GATE-RAN mark
  itself stays recorded output, not a convention the SPEC/ACCEPTANCE template
  bodies mirror (feature 30's receipt ruling, now scoped to those bodies), and
  the exportable mirror (`template/docs/features/_TEMPLATE/LEDGERS.md`,
  `template/docs/fix/_TEMPLATE/LEDGERS.md`) is untouched — already drifted;
  re-syncing it is a template-mirror change outside this sweep (feature 28's
  `c6daf5ec` is that surface's owner).
  (F12) evidence row **E-24** added: the `ledger-ownership@1` roadmap row's
  writer column-sets (`LEDGERS.md:146`) name `plan-feature-scaffold:planned-row`
  as the `defined → planned` writer and omit `plan-feature`, while
  `plan-feature/SKILL.md:92-94`'s "Confirm roadmap" step verifies/repairs
  registration only — grounding IS-5(c)'s verify-vs-write claim (→ AC-07).
  IS-5(c) was the only in-scope item whose supporting claim had no evidence
  row.
- **Why**: F11's ambiguity would let a weak model read the non-goal as
  forbidding the very projection edit IS-4/AC-04 mandate (one word, two
  meanings, opposite instructions); F12 left the only unevidenced in-scope
  claim un-falsifiable from the frozen set — both defects are exactly what
  this feature's own evidence contract forbids.
- **Supersedes**: the previous wording of the out-of-scope "No `template/`
  change" bullet (feature 30's receipt ruling now applies to the
  SPEC/ACCEPTANCE template bodies, not to the LEDGERS.md projections). No
  scope change: the same surfaces change, the same surfaces stay untouched.
- **Authority**: receipt SPEC-REVIEW-32-3 findings F11–F12 (snapshot
  `eb2e7a29d80eaf9c66de29efc11f0a81eb69e8bf83ba7ddb5c34b4494ce4d9e7`);
  `scripts/ledger-ownership.test.mjs:42-43,186-196`; evidence rows E-22 (the
  drift fact), E-24 (new). Recorded by `design-feature` (repair batch,
  2026-09-18).

## 2026-09-18 — Engineering decisions ED-32-1…ED-32-6

Recorded by `plan-feature-scaffold` (plan set `32-plan-1`). Product decisions
D32-1…D32-8 above are untouched.

### ED-32-1 — the conversion table targets the ledger scale, and `info` maps to `low`

The canonical table maps every producer scale onto the ledger scale
`high | med | low` (the scale `CLASSIFY.md` already owns). The planning scale's
`info` — the findings-ledger vocabulary's only immaterial value — maps to `low`,
which is the report-note floor; it never maps to `med`, because an immaterial
note must not reach the current-unit gate. The finder scale reuses the mapping
D32-6 already fixed (`critical→high`, `major→med`, `minor→low`).

- **Authority**: D32-2 / D32-6 (the four scales that exist);
  `skills/review-implementation/references/CLASSIFY.md:18-24,86-88`.
- **Derivation**: PE-003, PE-004, PE-005.

### ED-32-2 — `audit-docs`' phantom `MEDIUM` becomes `low`

The orphan-provenance case (a `generated-by:` page whose `source-unit` is
absent) proposes deletion or re-attribution. That is a proposal, not a
misleading-or-broken finding, so it carries the legend's `low` — the same
severity the adjacent `LOW: propose /generate-docs` case in the same check
already uses. The legend stays `high | low`; no third severity is invented.

- **Authority**: IS-2 / AC-02; `skills/audit-docs/SKILL.md:98,121,125`.
- **Derivation**: PE-006.

### ED-32-3 — GATE-RAN is an appended text mark, not a ledger row

The mark's format has variable arity (additive slots), which a fixed
seven-column ledger row cannot express, and a mark that parsed as a finding row
would corrupt the router's open-row sweep. The mark is therefore an appended
`gate-ran@1` text block, and no row parser is extended: the router reads only
`|`-led rows with ≥ 7 cells and marks only `VF-`/`REVIEW-RAN` ids, and the
provenance annotator matches `^\|\s*(F\d+)\s*\|`. The SPEC's own out-of-scope
bullet already rules out a schema change and calls the mark an appended text
mark.

- **Authority**: IS-4 / AC-04; `scripts/unit-route.mjs:114,128`;
  `scripts/ledger-provenance.mjs:33`; SPEC §Out of scope (no schema change).
- **Derivation**: PE-021.

### ED-32-4 — `product-audit`'s `postpone` example becomes `proposal`

The closed class set is `fix-now | replan-in-unit | decision-required |
proposal | ignore`. The example finding (units routinely exporting scope) is
independent future discipline work with its own route, so it is a `proposal`.
The audit stays proposes-only: it never folds, never opens an issue, and never
emits `fix-now` on its own authority.

- **Authority**: IS-2 / AC-02; `skills/product-audit/SKILL.md:100,105`;
  `skills/product-audit/references/AUDIT_PROCESS.md:7`.
- **Derivation**: PE-007.

### ED-32-5 — `audit-pr`'s `warning` leaves the scale, not the note

IS-5(d) aligns the closure-integrity **result scale** to `pass | blocker | n-a`.
`skills/audit-pr/references/04_VERDICT.md` separately prints a *closure-warning
note* beside a verdict; that is an added non-blocking line, not a scale value,
and it stays. AC-08's pin is therefore scoped to the three scale lines in
`skills/audit-pr/SKILL.md`, not to the whole audit-pr tree — a whole-tree grep
would false-fail on the note.

- **Authority**: IS-5(d) / AC-08 / E-06; `skills/audit-pr/SKILL.md:52,55,58`;
  `skills/audit-pr/references/04_VERDICT.md:26-27,36`.
- **Derivation**: PE-008.

### ED-32-6 — the phase cut is by layer, keeping the plan at five phases

The product sketch's per-owner cut would straddle layers
(`scripts/` vs `skills/`+`docs/`), which box 2 forbids. The four one-line
contradiction fixes therefore land in the phase nearest their owning surface -
`triage-issue`'s modes and the roadmap verify-vs-write with the ownership prose
(P2), the `audit-pr` scale with the other scales (P3) — and the sensor keeps its
own `config/infra` phase (P1). Each phase is one layer; a paired test-file edit
appears only inside a task whose first path target is in the phase's layer. The
plan stays at five phases, inside the ≤ 5-phase bound the Product half records.

- **Authority**: `scripts/phase-lint.mjs:232-237,468-487` (layer table + box 2);
  SPEC §Size (M, per-owner phase sketch).
- **Derivation**: PE-020.

## Open items for `resolve-repository-state` (not resolved here)

- REPOSITORY_STATE.md F006/F007 are stale versus the current forge and roadmap
  (rows 30–38 done; 31 still `idea`). Evidence row E-19 records the drifted
  rows and the consequence (this design consumes roadmap + forge evidence
  directly). Owner: `resolve-repository-state`.
