# 31 — planning-review-materiality

> Feature specification. One SPEC, two halves: `design-feature` wrote the
> **Product half** below and stamps `## Design status`; `plan-feature` writes
> the **Engineering half** only after an independent `review-spec` PASS.

## Goal

Align the **planning-side** review loop (`review-spec` / `review-plan` over
SPECs and plans) with the materiality floor fix #159 already proved and
test-pinned on the code side: a `low` planning finding becomes a **report-note**
(persisted, visible, non-blocking; material = `medium`+; the anti-deflating rule
carries over verbatim), the spec/plan repair loop gets a **hard two-cycle cap**
whose unconverged end is `NEEDS-DESIGN` (a third cycle never starts without
explicit user instruction, mirroring `review-change`), and a POLICY §3
**wording-only** determination routes a cosmetic repair batch without a full
snapshot re-review (determination recorded; `artifactRevisionId` still
rotates). Basis: issue [#171](https://github.com/gtrabanco/agentic-workflow/issues/171).

## Branch

`feat/31-planning-review-materiality`

## Size

`M` — one concern (planning-side loop rules) spread across several skill
reference files plus their test pins; full artifact set in planning. No split
trigger fires: well under 5 phases, one layer (docs + test pins), and every
product decision is resolved by the issue (D-31-1…D-31-5).

## Dependencies

Hard:

- **29 `bounded-implementation-discovery`** (#149, PR #175): MERGED — its
  plan-review cycle must not change rules mid-flight; satisfied
  (`docs/features/ROADMAP.md` row 29 reads `done · #175`).

Soft (no sequencing constraint):

- **30 `repair-receipt-delta-review`** (#170, PR #188): MERGED — its
  REPAIR-RECEIPT/delta vocabulary lives on the fold (code) side; the planning
  side never touches `fold-findings` (that boundary is preserved here).

---

## Product half

Written by `design-feature` (2026-09-17). Complete: `## Design status` below
reads `designed`.

### Context

Fix #159 closed the review→fold loop on the **code** side and test-pinned it
(`scripts/review-loop-discipline.test.mjs`): `low` findings are report-only and
never block (`review-implementation` classification), only `high`/`med` rows
persist, the workspace state is a precondition, folded rows are re-verified not
re-reported, and the loop is bounded at two review→fold cycles with
`LOOP CAP REACHED` ending it. The **planning** side never got the same floor:

- `skills/pre-execution-review/references/LEDGERS.md` still says "`info` is the
  only immaterial one" — so a single pedantic `low` finding from `review-spec`
  or `review-plan` is material: it forces a root-caused repair batch **and** a
  full snapshot re-review, while dismissal requires falsifying counter-evidence
  that taste-level claims cannot produce (POLICY §2). The cheaper honest path —
  record it visibly and move on — does not exist.
- The wording-only repair class already exists (POLICY §3: "Skip a full replan
  when intent, obligation identity, phase topology, validators, and authority
  are all unchanged") but §3's opening paragraph still mandates "a single
  re-review of the resulting snapshot" for every repair batch — the cheap
  cosmetic route stops one step short.
- POLICY §4 prints `CONVERGENCE-ANOMALY` on a second cycle but then says more
  cycles "stay allowed when correctness needs them" and "no cap converts a
  verdict into a dead end"; `design-feature/references/REPAIR.md` §4 repeats
  "More cycles stay allowed when correctness needs them". The planning loop is
  unbounded on paper — the exact structural defect #159 fixed on the code side.

Planning review is prose judged against prose with no executable arbiter —
the setting where reviewer noise is most expensive. The study this issue is
built on (arXiv:2603.00539, fetched 2026-09-17) shows LLM reviewers
systematically overcorrect: they frequently misclassify correct artifacts as
non-compliant, and richer review prompts (explanations plus proposed
corrections) raise the misjudgment rate. Industry convention agrees on the
floor: Google's code-review guidelines make minor points explicitly optional
("Nit:" — visible, non-blocking). The domain has converged on what this feature
encodes: **minor findings are recorded and visible; only substantive findings
gate**; and a loop that cannot converge stops and asks a human instead of
cycling.

### Business goals

Internal/technical feature; the outcome it serves is workflow economics and
review honesty, not a market:

- Cut the cost of a planning review cycle: a taste-level finding no longer
  buys a repair batch + full re-review of an unchanged-in-substance snapshot.
- Make loop termination structural: an unconverged planning loop asks the
  human (`NEEDS-DESIGN`) instead of cycling by default.
- Keep every honesty property the workflow already pins: findings stay visible,
  mislabeled defects still block, dismissal still needs counter-evidence, and
  every repair write still rotates the artifact revision.

### Scope

#### In scope

Affected surfaces (the issue's list, verified on this branch): the
`planning-findings` severity semantics in
`skills/pre-execution-review/references/LEDGERS.md`; the pass conditions in
`skills/review-spec/references/CHECKS.md` + `skills/review-plan/references/CHECKS.md`
(both currently say "Material = anything above `info`"); the verdict/loop text in
`skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md`;
`skills/pre-execution-review/references/POLICY.md` §3 (wording-only consequence)
and §4 (hard cap); `skills/design-feature/references/REPAIR.md` §4; the
discipline-test pins in `scripts/review-loop-discipline.test.mjs` (updated,
never weakened); per-skill version bumps + CHANGELOG rows; the README
`## References` append at shipping time.

1. **Materiality line moves on the planning side**: in the `planning-findings`
   ledger semantics, material = `medium`+; a `low` finding becomes a
   **report-note** — persisted and visible in the ledger, non-blocking, and
   never a re-review trigger by itself; `info` stays immaterial → AC1 + AC2.
2. **Anti-deflation carries over verbatim**: a real defect mislabeled `low`
   classifies at `medium` minimum, and deflating a severity to dodge a review
   is itself a review defect — stated in the planning-side surfaces → AC3.
3. **Hard two-cycle cap** on the spec/plan repair loop: the second cycle prints
   the existing `CONVERGENCE-ANOMALY` block (shape unchanged) before any
   further edit; a third cycle never starts without explicit user instruction;
   an unconverged loop ends in `NEEDS-DESIGN` routed to the human (existing
   verdict vocabulary, no new terminal label) → AC4 + AC5 + AC7.
4. **Wording-only route**: a POLICY §3 wording-only determination (intent,
   obligation identity, phase topology, validators, and authority all
   unchanged) routes a cosmetic repair batch **without** a full snapshot
   re-review; the determination is recorded in the unit's evidence and
   `artifactRevisionId` still rotates → AC6.
5. **Discipline-test pins updated, never weakened**: the planning-side pins
   (report-note semantics, cap, anti-deflation, wording-only route) are added
   to `scripts/review-loop-discipline.test.mjs`; every existing assertion keeps
   its strength → AC9 + AC11.
6. **Bibliography obligation** (issue #171): when this ships, the Jin & Chen
   entry appends to `README.md` under a bottom `## References` section (created
   if absent, deduped against other features' entries) — in the implementation
   PR, never before → AC13.

#### Out of scope / non-goals

- The **union rule** (one material finding from one reviewer keeps the set
  open), **counter-evidence dismissal** (POLICY §2), **reviewer independence**
  (§1), and **snapshot binding** are preserved — the POLICY diff touches only
  §3/§4 hunks → AC8.
- **No new severity vocabulary**: the receipt severity set
  (`info|low|medium|high|critical`) and the schema package stay untouched; only
  the materiality line moves (`info` **and** `low` become immaterial; material
  = `medium`+) → AC10.
- **Code-side review/fold behavior** (`review-change`, `review-implementation`,
  `fold-findings`, the review→fold loop) — unchanged; fix #159 owns it, and
  `fold-findings` still never repairs a planning artifact (the boundary sentence
  stays pinned).
- **Repair-batch discipline unchanged**: one root-caused batch per findings
  set; only the re-review consequence (item 4) and the loop bound (item 3)
  change.
- **No retroactive reclassification**: `low` rows already persisted in existing
  units' `planning-findings.md` keep their recorded semantics; units adopt the
  new line at their next review cycle (legacy adoption stays
  construct-never-coerce, POLICY §6).
- **No aspirational citation**: nothing is appended to `README.md` before the
  implementation PR ships (evidence-grounding forward-looking-claim rule).
- **Sensor/verify mechanics unchanged**: `pre-execution-snapshot.mjs` exit
  codes, receipt schema, gate-rejection vocabulary, and the `verify --stage`
  self-check keep their contracts; the wording-only route rides the existing
  `artifactRevisionId` rotation rather than any new machinery.

### Capability closure

This repository ships workflow skills and their substrate — there is no UI and
no API. A "surface" below is the skill reference text, ledger, or script that
owns the behavior; the "test" is the deterministic pin or suite that guards it.
Entities, capabilities, roles, and the integration inventory are the workflow's
own; the derived inventory is recorded under Integration closure.

**1. Entity closure** — three entities, all ledger/state records of the
planning review loop:

**E1 — Planning finding row (`planning-findings.md`)**

- Create (append) — reviewer turn appends rows, including `low` rows, which
  become persisted, visible report-notes. Surface: `LEDGERS.md` §3 severity
  semantics (column set unchanged; the materiality sentence moves; writer map
  unchanged). Test: `bun test scripts/pre-execution-quality.test.mjs` +
  the planning-side pins in `scripts/review-loop-discipline.test.mjs`.
- Read/list — re-reviewing reviewer, the stage's author skill, and `audit-pr`
  read the ledger. Surface: `LEDGERS.md` ownership-map row `planning-findings`
  (unchanged readers). Test: `bun test scripts/ledger-ownership.test.mjs
  scripts/ledger-provenance.test.mjs`.
- Update (resolve) — only the stage's author resolves rows (unchanged); a
  `low` report-note is resolvable by the author without any re-review. Surface:
  `LEDGERS.md` §3 status semantics + the repair text of
  `review-spec`/`review-plan`. Test: `review-loop-discipline` planning-side pin
  (added by AC9).
- Delete — n/a: reviewed rows are never deleted or edited to disappear
  (`LEDGERS.md` §3); the append-only contract is what makes cycle counting
  computable.
- State transitions — status set stays `open | resolved | dismissed`; dismissal
  still requires recorded counter-evidence (POLICY §2 unchanged). New semantic
  transition only: severity `low` ⇒ report-note (non-material) — same row
  shape, no new state, no new severity value. Test: AC1 + AC3 pins.

**E2 — Wording-only determination record**

- Create — the repair turn records the determination in the unit's frozen
  evidence (a planning-evidence row) when it routes a cosmetic batch without a
  re-review. Surface: `POLICY.md` §3 wording-only row (consequence updated) +
  `LEDGERS.md` §1 planning-evidence home (existing). Test: AC6 anchor +
  `review-loop-discipline` pin (added).
- Read/list — reviewers, `audit-pr`, and later cycles read the recorded
  determination from the frozen evidence rows. Surface: the unit's
  `planning-evidence.md` (M/L) or the SPEC's planning-evidence section (XS/S).
  Test: `bun test scripts/pre-execution-quality.test.mjs` (ledger home rules).
- Update — n/a: evidence rows freeze at the write that minted them; a new
  determination is a new row at a new revision.
- Delete — n/a: append-only evidence; nothing prunes a determination.
- State transitions — n/a: a determination is a record, not a stateful entity;
  the only transition is record-once-at-repair-time.

**E3 — Repair/re-review cycle counter (spec and plan stages)**

- Create — cycle count derives from persisted marks/receipts (review verdict
  receipts and repair records across `progress.md` / `planning-findings.md`);
  no new store, no new ledger. Surface: `POLICY.md` §4 cap text names its
  counting basis. Test: `review-loop-discipline` cap pin (added).
- Read/list — reviewer turns and drivers read the cycle number from the
  persisted receipts before starting a cycle (mirrors `review-change`'s
  "state the cycle" discipline). Surface: `review-plan/references/OUTPUT.md`
  re-review field (`none — first cycle` exists today; `review-spec` equivalent).
  Test: AC7 cap-mirror grep + AC9 pins.
- Update — n/a: derived value, recomputed from persisted marks each cycle;
  nothing writes a counter.
- Delete — n/a: derived value.
- State transitions — cycle 1 → cycle 2 prints the existing
  `CONVERGENCE-ANOMALY` block before any further edit; cycle 3 never starts
  without explicit user instruction; an unconverged loop terminates in
  `NEEDS-DESIGN` routed to the human (existing `pre-execution-verdict`
  vocabulary — no new terminal label). Test: AC4 + AC5 + AC7.

**2. Integration closure** — no live `docs/CAPABILITIES.md` exists (the file
is the unseeded template), so the inventory below is **derived** from
`CLAUDE.md` (repository layout, verification, packages, normalizer inventory)
plus the `LEDGERS.md` ownership map, and walked one row per subsystem. Seeding
`docs/CAPABILITIES.md` from the template is offered in this turn's closing
block (user confirms; upsert-safe). Roles are derived in the role matrix below
from the same sources.

| Subsystem (derived) | Exists | How this feature integrates | Test |
|---|---|---|---|
| Skill reference docs (`skills/*/SKILL.md` + `references/`) | yes | `LEDGERS.md` severity semantics; `POLICY.md` §3 consequence + §4 cap; `review-spec`/`review-plan` CHECKS materiality line + pass conditions; `review-spec`/`review-plan` OUTPUT loop text; `design-feature` `REPAIR.md` §4 cap mirror | `bun scripts/check-skill-context.mjs` + `scripts/normative-drift.test.mjs` + AC1–AC7 greps |
| Planning findings ledger (`LEDGERS.md` §3 + ownership map) | yes | severity semantics move (low ⇒ report-note); row columns, writers, resolvers unchanged | `scripts/ledger-ownership.test.mjs` + `scripts/pre-execution-quality.test.mjs` + `scripts/ledger-provenance.test.mjs` |
| Receipt/snapshot machinery (`pre-execution-snapshot.mjs`, schema package, sensor) | yes (read-only integration) | untouched: verdict blocks keep digest + `artifactRevisionId`; the wording-only route rotates the revision so mutate-and-revert stays detectable — no new machinery | schema suite + `scripts/pre-execution-sensor.test.mjs` green; AC10 |
| Discipline & quality test pack (`scripts/*.test.mjs`) | yes | `review-loop-discipline.test.mjs` gains planning-side pins (report-note, cap, anti-deflation, wording-only); existing pins keep strength | AC9 + AC11 |
| Normative surfaces (`CLAUDE.md` grammar tables) | yes (verify-only) | no new grammar: the `NEEDS-DESIGN` verdict and the `CONVERGENCE-ANOMALY` block are already machine-pinned; the cap introduces no new fenced block (verified at engineering — a new block would re-enter scope as a plan-time finding) | `scripts/normative-drift.test.mjs` green |
| Pi package mirror (`packages/pi-agentic-workflow/skills/`) | yes | `bun run bundle:skills` re-run after the last `skills/` edit, same PR | mirror parity: `cd packages/pi-agentic-workflow && bun run test` (AC12) |
| Schema package (`packages/agentic-workflow-schema/`) | yes (negative integration) | severity vocabularies untouched; no schema change of any kind | AC10 (diff empty + suite green) |
| Versioning/release surfaces (per-skill `version:`, `CHANGELOG.md`, README tables) | yes | `bump-skill` run for each edited skill (minor bumps per the #176 freeze: breaking changes ship as minor with a BREAKING CHANGE footer; none expected here), CHANGELOG rows, README skill-table cells | AC13 + rendered-facts consistency (bump-skill output) |
| README references (bibliography) | yes | the issue's citation obligation lands as a bottom `## References` append in the implementation PR — never before | AC13 grep at PR head |
| Workflow tutorial + site guides (`docs/workflow/*`, `docs/site/guides/`) | partial | no severity statement exists in `docs/workflow/REVIEW_AND_CLASSIFY.md` (grep empty, 2026-09-17); generated guides change only if `docs/workflow/` prose changes | n/a here; `audit-docs` owns inventory↔docs drift |
| GitHub templates / forge surfaces (`.github/`, issue/PR forms) | no | untouched by this feature | n/a — no surface exists to integrate with |

**3. Role matrix** — every capability's matrix lists every derived role
explicitly. Roles (derived inventory — no `docs/CAPABILITIES.md` roles table
exists): `human owner` (project lead), `author turn`
(`design-feature`/`plan-feature`/`plan-fix`), `reviewer turn`
(`review-spec`/`review-plan`), `executor turn` (`execute-phase`), `drivers &
sensors` (deterministic scripts, CI, `workflow-status`).

- **C1 — File a `low` planning finding (report-note).** Entry point: the
  findings step of `review-spec`/`review-plan` (the findings-ledger check).
  Roles: reviewer turn allowed · author turn denied (authors never file
  findings against their own artifact) · human owner denied (owner input routes
  through design, not review findings) · executor turn denied · drivers &
  sensors denied (they read ledgers, never write findings).
- **C2 — Resolve a `low` report-note without a re-review.** Entry point: the
  stage author's repair pass (`REPAIR.md` / planner repair step). Roles: author
  turn allowed · reviewer turn denied (a reviewer re-verifies, never resolves)
  · human owner denied (not their act; they instruct when asked) · executor
  turn denied · drivers & sensors denied.
- **C3 — Run a wording-only repair batch with no full snapshot re-review.**
  Entry point: `POLICY.md` §3 wording-only row as applied by the author's
  repair pass. Roles: author turn allowed (determination recorded, revision
  rotated) · reviewer turn denied (nothing to re-review on that route; the
  next material change re-opens review) · human owner denied · executor turn
  denied · drivers & sensors denied.
- **C4 — Start a third repair/re-review cycle.** Entry point: explicit user
  instruction to the author/reviewer turn after the cap block. Roles: human
  owner allowed (the only key) · author turn denied without it · reviewer turn
  denied without it · executor turn denied · drivers & sensors denied.
- **C5 — End an unconverged loop in `NEEDS-DESIGN`.** Entry point: the
  reviewer's verdict set (existing `NEEDS-DESIGN` verdict block). Roles:
  reviewer turn allowed · author turn denied as issuer (receives it and routes
  the human through `design-feature`/`plan-feature`) · human owner denied as
  issuer, allowed as decision-maker (decides through the routed skill) ·
  executor turn denied · drivers & sensors denied.

### Expectation sweep

What a competent workflow maintainer would assume ships with a
"planning-side materiality alignment" without being told. 16 candidate
expectations, each resolved to exactly one resolution:

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Immaterial findings stay visible in the ledger, never silently dropped | in-scope | In scope 1 (persisted report-note) |
| 2 | A real defect mislabeled `low` still blocks — the mislabel re-classifies at `medium` minimum | in-scope | In scope 2 |
| 3 | Deflating a severity to dodge a review is itself a review defect | in-scope | In scope 2 |
| 4 | A `low` report-note alone never forces a repair batch or a re-review | in-scope | In scope 1 + In scope 4 (author resolves without re-review) |
| 5 | One material finding from one reviewer still keeps the findings set open (union, never majority) | in-scope | Out of scope bullet 1 (preserved) |
| 6 | Dismissing any finding — including a report-note — still requires recorded counter-evidence | in-scope | Out of scope bullet 1 (POLICY §2 unchanged) |
| 7 | The second cycle still prints `CONVERGENCE-ANOMALY` before any further edit | in-scope | In scope 3 |
| 8 | The loop never ends silently — the cap terminates in a printed `NEEDS-DESIGN` routed to the human | in-scope | In scope 3 |
| 9 | A third cycle remains possible behind an explicit user instruction (the cap is user-gated, not absolute) | in-scope | In scope 3 |
| 10 | The wording-only determination is recorded in the unit's evidence even when the re-review is skipped | in-scope | In scope 4 |
| 11 | Every repair write rotates `artifactRevisionId` — mutate-and-revert cannot resurrect a stale PASS, including on the wording-only route | in-scope | In scope 4 + Out of scope (sensor mechanics unchanged) |
| 12 | Review verdicts keep binding to exact snapshots with digest + artifact revision (receipt shape unchanged) | in-scope | Out of scope bullet 7 |
| 13 | Code-side review/fold behavior is untouched by this feature | out-of-scope | Out of scope bullet 3 |
| 14 | Severity vocabulary and the schema package stay unchanged | out-of-scope | Out of scope bullet 2 |
| 15 | Existing `low` rows in already-persisted planning ledgers are not retroactively reclassified | out-of-scope | Out of scope bullet 5 |
| 16 | A reviewer can still escalate a taste-level claim to material when a rule is actually violated (the floor works in both directions) | in-scope | In scope 2 (anti-deflation) |

### Acceptance criteria

Command-checkable at the PR head unless labelled `read-verified`.

- **AC1** (command): `grep -n "only immaterial"
  skills/pre-execution-review/references/LEDGERS.md` exits non-zero, and
  `grep -niE "report-note" skills/pre-execution-review/references/LEDGERS.md`
  exits zero with the rule that a `low` finding is persisted, visible,
  non-blocking, and never a re-review trigger by itself.
- **AC2** (command): `grep -n "anything above \`info\`"
  skills/review-spec/references/CHECKS.md
  skills/review-plan/references/CHECKS.md` exits non-zero, and both files
  state material = `medium`+ (`grep -n "medium"` hits the new materiality
  sentence in each).
- **AC3** (command): the anti-deflation rule appears in the planning-side
  surfaces — `grep -rn "medium\` minimum" skills/pre-execution-review/references/
  skills/review-spec/ skills/review-plan/` exits zero, and the matched text
  includes that deflating a real defect to dodge a review is itself a review
  defect.
- **AC4** (command + `read-verified`): `grep -n "third cycle never"
  skills/pre-execution-review/references/POLICY.md` exits zero; the §4 text
  ends an unconverged loop in `NEEDS-DESIGN` absent explicit user instruction
  (`read-verified`); the `CONVERGENCE-ANOMALY` block text is unchanged
  (`read-verified` against the §4 diff hunk).
- **AC5** (command): `grep -n "More cycles stay allowed"
  skills/design-feature/references/REPAIR.md` exits non-zero, and
  `grep -n "third cycle never" skills/design-feature/references/REPAIR.md`
  exits zero.
- **AC6** (`read-verified`, command-anchored): POLICY §3 states the
  wording-only route skips the full snapshot re-review, records the
  determination in the unit's evidence, and rotates `artifactRevisionId` —
  anchored by `grep -n "Wording-only"
  skills/pre-execution-review/references/POLICY.md`.
- **AC7** (command): `grep -n "third cycle never"
  skills/review-spec/references/OUTPUT.md
  skills/review-plan/references/OUTPUT.md` exits zero (the verdict-side loop
  text mirrors the cap).
- **AC8** (command + `read-verified`): at the PR head, `git diff main --stat`
  lists only the affected surfaces enumerated in In scope; `git diff main --
  skills/pre-execution-review/references/POLICY.md` produces hunks scoped to
  §3 and §4 (`read-verified`: §1, §2, §5–§8 byte-identical to `main`).
- **AC9** (command): `bun test scripts/review-loop-discipline.test.mjs` passes
  at the PR head, and `git diff main -- scripts/review-loop-discipline.test.mjs`
  removes no existing assertion (additions or equal-strength rewrites only).
- **AC10** (command): `git diff main --stat -- packages/agentic-workflow-schema`
  is empty, and `cd packages/agentic-workflow-schema && bun run test` passes.
- **AC11** (command): `bun test scripts/ledger-ownership.test.mjs
  scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
  scripts/normative-drift.test.mjs && bun scripts/check-skill-context.mjs`
  is green at the PR head (the machine-pinned LEDGERS blocks survive the edit).
- **AC12** (command): `bun run bundle:skills` ran after the last `skills/`
  edit, and `cd packages/pi-agentic-workflow && bun run test` passes (mirror
  parity).
- **AC13** (command + `read-verified`): `grep -n "2603.00539" README.md` exits
  zero at the PR head (References append), and each edited skill's `version:`
  is bumped with a CHANGELOG row (`read-verified` against the bump-skill diff).

### Tooling

- No external skill or MCP dependency — this feature is authored and executed
  with the repository's own workflow skills.
- `bump-skill` (repository-internal, `user-invocable: false`) runs at execution
  for the version bumps; `bun run bundle:skills` per the normalizer inventory.

### Product decisions

Recorded in full (with authority and rationale) in
`docs/features/31-planning-review-materiality/decisions.md`; one-line summary:

- **D-31-1** planning-side `low` rows **persist** as report-notes (the code
  side's `low` is never persisted) — the planning ledger is the prose-review
  audit trail; hiding rows there would break the no-silent-dismissal contract.
- **D-31-2** the cap terminates in the **existing** `NEEDS-DESIGN` verdict —
  no new terminal label, no new grammar; mirrors `review-change`'s user-gated
  third-cycle rule.
- **D-31-3** the wording-only route skips only the re-review act — the
  determination record and the `artifactRevisionId` rotation are not skippable.
- **D-31-4** one materiality line for both stages (spec + plan): material =
  `medium`+; no stage-specific thresholds.
- **D-31-5** REPOSITORY_STATE AD-008 ("never cycle-count-bound") is reconciled,
  not contradicted: the cap routes to a human decision instead of qualifying by
  cycle count; if `review-spec` reads a contradiction, `resolve-repository-state`
  owns the wording amendment at execution time.

### Deferred decisions

none

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half —
      `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
      over the Product half returns nothing (closure rows instantiated;
      severities, verdicts, and file paths are literals, not placeholders).
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 7 bullets.
- [x] Every Capability closure row is filled or an explicit `n/a` with reason —
      zero blank rows (E1–E3 × CRUD/transitions; 11 derived subsystems; 5
      capabilities × 5 roles).
- [x] Integration closure has one row per subsystem of the derived inventory
      (recorded above; `docs/CAPABILITIES.md` absent as a live file) — zero
      subsystems skipped.
- [x] Every capability's role matrix lists EVERY derived role with an explicit
      `allowed`/`denied` — 5 roles × 5 capabilities, none unlisted.
- [x] `### Expectation sweep` has 16 resolved rows (≥ 10 for M); every row
      resolves to exactly one of `in-scope`, `out-of-scope`, or `deferred`
      with a pointer — zero unresolved rows.
- [x] Every `#### In scope` bullet maps to ≥ 1 acceptance criterion — explicit
      AC pointers on each bullet.
- [x] Every acceptance criterion is a runnable command OR labelled
      `read-verified` — AC1–AC3, AC5, AC7–AC13 commands; AC4 and AC6 labelled
      where judgement-only.
- [x] `### Deferred decisions` exists and reads `none`.

## Design status

`designed` — capability closure complete (zero blank rows), Spec-lint product
boxes all PASS, readiness preflight `READY-FOR-REVIEW` at artifact revision
`31-spec-1` (see closing block). Awaiting independent review by `review-spec`;
`plan-feature` may fill the Engineering half only on a current
`SPEC-REVIEW-PASS` receipt.

---

## Engineering half

Written by `plan-feature`, only once the Product half above is marked
`designed` and independently reviewed.

### Technical goals

The architectural outcomes — not implementation detail.

### Architecture impact

How the feature interacts with the project's architecture and layering
(as defined in its architecture doc). State the invariants the
implementation must hold (e.g. "outer-layer-only — no changes to the
core/domain layer"). If the feature touches the core/domain, justify it
here.

### Design

The substantive technical content: entities, ports, adapters, schema,
data shapes, algorithms, state machines. Pre-resolve every decision the
implementer would otherwise have to guess. Close inherited open
questions explicitly. This is the section that most reduces
implementation risk — if it is vague, the implementation improvises.

### Planning evidence

One compact row per Engineering claim that a phase relies on — never an
exploration transcript. M/L units freeze this table in
`planning-evidence.md` and leave the heading here reading
`see planning-evidence.md`; XS/S units fill it in place.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|

### Obligations

One row per normative behaviour, applicable compatibility invariant, affected use
case, and required failure state — the completeness map `execute-phase` and
`audit-pr` read. M/L units freeze it in `planning-obligations.md`; XS/S units fill
it in place. Status is `planned | in-progress | verified | n/a | deferred`;
`n/a` requires evidence, and no current-unit obligation may be `deferred` to a
follow-up issue.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|

### Decisions to confirm

Engineering decisions the project lead must make (or has made) before
implementation starts. Record the chosen option and the rationale, so
later reviewers understand the trade-off.

### Testing requirements

What must be tested and how. State the test layer (unit / integration
/ architecture) and any tooling or runtime constraints. The project
prefers integration and architecture tests over heavy mocking.

### Dev scenarios

The situations this feature introduces that must be reproducible in local
dev — happy path **and** failure modes (empty/degraded state, races,
outages, mass changes, data loss). Seed the failure modes from this **fixed
category list** — walk every category and write a scenario or
`n/a: <reason>` (unaided recall under-enumerates; the list makes coverage a
presence check): empty/zero state · invalid or oversized input · permission
denied / wrong role · dependency outage or timeout · concurrent/duplicate
action · limit or threshold hit. For each, name it and state how it is
reached through an **existing** mechanism (queued message, guard threshold,
manual override, stubbed source) — scenarios are orchestration, never new
domain. If the project has a runnable dev-scenario harness, register each
scenario there (dev-gated, never reaching production) and link it here;
otherwise list them as prose.

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|

### Phases

High-level phase breakdown; detailed tasks are expanded in `TASKS.md`.
**Phases are labelled `P1, P2, …` and called *phases* — never `S1`/`S2` or
"Steps".** `execute-phase <NN>` runs all remaining phases by default; an
explicit `P<n>` runs one atomic phase. Planning (producing the planning artifacts) is done by `plan-feature`
before execution, so it is **not** a numbered phase here. `P1` is the first
implementation phase (it also commits the planning artifacts); the **last phase
is always hardening** (edge cases + the dev-scenario failure modes). For **M/L**,
opening the PR is the final *step* of the hardening phase (its `TASKS.md`
checklist ends with the literal close-out tasks), not a phase of its own. For
**XS/S** (SPEC-only, no `TASKS.md`), list the phases **here, with checkbox
tasks** — **always ≥ 2**: `P1` implementation, final phase `P2 — Hardening & PR`
carrying the literal close-out tasks (fixed wording — see
`docs/fix/_TEMPLATE/SPEC.md` `## Phases`); `execute-phase` ticks this section as
its ledger. Each implementation phase
header is followed by `Layer: <schema/db|domain|api|ui|config/infra|docs|
hardening>. Done-when: <command> → <expected outcome>.` before its task list
(same scaffold as `docs/fix/_TEMPLATE/SPEC.md` `### P1`) — the phase-lint's
"one declared layer" and "machine-checkable done-when" boxes need somewhere to
be filled in, not invented.

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

### Deploy & rollback

Only when shipping needs more than merging: schema migrations and their order,
feature flag (if gradual rollout), config/env changes, and the rollback path
(revert PR? data cleanup?). State **n/a** explicitly when merging is enough.

### Open questions / risks

Known unknowns and risks. Promote to `TASKS.md` if they become
blockers. Mark inherited questions as RESOLVED or DEFERRED with a
pointer to where they are now handled.

### Deliverables

The concrete artifacts the PR contains.

### Post-merge next feature

The expected next feature in the sequence — see `docs/features/ROADMAP.md`.
