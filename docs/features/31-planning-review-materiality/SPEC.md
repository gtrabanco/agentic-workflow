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

Plus the **derived surfaces** every one of those edits drags in, declared here
so AC8's scope guard walks them instead of reporting them as violations: the Pi
package mirror (`packages/pi-agentic-workflow/skills/**`, written only by the
bundler), the four edited skills' `version:` lines, the README skill-table cells
the `bump-skill` step rewrites, and the `CHANGELOG.md` rows.

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
5. **Discipline-test pins updated, never weakened, and provably present**: the
   planning-side pins (report-note semantics, cap, anti-deflation, wording-only
   route) are added to `scripts/review-loop-discipline.test.mjs` as rows of one
   declared pin table carrying a row floor and a discrimination leg — every pin
   must **reject the sentence it supersedes**, so a pin that is absent, empty,
   or trivially true cannot leave the suite green — and a frozen validator
   checks the table's presence at the PR head; every existing assertion keeps
   its strength → AC9 + AC11 + AC14.
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
| Discipline & quality test pack (`scripts/*.test.mjs`) | yes | `review-loop-discipline.test.mjs` gains the planning-side pin table (report-note, cap, anti-deflation, wording-only) with its row floor and discrimination leg; existing pins keep strength | AC9 + AC11 + AC14 |
| Normative surfaces (`CLAUDE.md` grammar tables) | yes (verify-only) | no new grammar: the `NEEDS-DESIGN` verdict and the `CONVERGENCE-ANOMALY` block are already machine-pinned; the cap introduces no new fenced block (verified at engineering — a new block would re-enter scope as a plan-time finding) | `scripts/normative-drift.test.mjs` green |
| Pi package mirror (`packages/pi-agentic-workflow/skills/`) | yes | `cd packages/pi-agentic-workflow && bun run bundle:skills` re-run after the last `skills/` edit, same PR (the bundler script lives in the package; no root `package.json`) | mirror parity: `cd packages/pi-agentic-workflow && bun run test` (AC12) |
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
  non-blocking, and never a re-review trigger by itself. The report-note rule
  is a row of the planning pin table (AC14).
- **AC2** (command): `grep -n "anything above \`info\`"
  skills/review-spec/references/CHECKS.md
  skills/review-plan/references/CHECKS.md` exits non-zero, and both files
  state material = `medium`+ (`grep -n "medium"` hits the new materiality
  sentence in each). Both restatements are rows of the planning pin table
  (AC14).
- **AC3** (command): the anti-deflation rule appears in the planning-side
  surfaces — `grep -rn "medium\` minimum" skills/pre-execution-review/references/
  skills/review-spec/ skills/review-plan/` exits zero, and the matched text
  includes that deflating a real defect to dodge a review is itself a review
  defect. Pinned as a table row (AC14).
- **AC4** (command + `read-verified`): `grep -n "third cycle never"
  skills/pre-execution-review/references/POLICY.md` exits zero; the §4 text
  ends an unconverged loop in `NEEDS-DESIGN` absent explicit user instruction
  (`read-verified`); the `CONVERGENCE-ANOMALY` block text is unchanged
  (`read-verified` against the §4 diff hunk). The cap is a row of the planning
  pin table (AC14).
- **AC5** (command): `grep -n "More cycles stay allowed"
  skills/design-feature/references/REPAIR.md` exits non-zero, and
  `grep -n "third cycle never" skills/design-feature/references/REPAIR.md`
  exits zero.
- **AC6** (`read-verified`, command-anchored): POLICY §3 states the
  wording-only route skips the full snapshot re-review, records the
  determination in the unit's evidence, and rotates `artifactRevisionId` —
  anchored by `grep -n "Wording-only"
  skills/pre-execution-review/references/POLICY.md`. Pinned as a table row
  (AC14).
- **AC7** (command): `grep -n "third cycle never"
  skills/review-spec/references/OUTPUT.md
  skills/review-plan/references/OUTPUT.md` exits zero (the verdict-side loop
  text mirrors the cap). Both mirrors are rows of the planning pin table
  (AC14).
- **AC8** (command + `read-verified`): at the PR head, `git diff main --stat`
  lists only the In-scope surfaces — the governed files named above **plus the
  declared derived-surface set** (the Pi mirror under
  `packages/pi-agentic-workflow/skills/**`, the four edited skills' `version:`
  lines, the README skill-table cells, and `CHANGELOG.md`) — and nothing else;
  `git diff main --
  skills/pre-execution-review/references/POLICY.md` produces hunks scoped to
  §3 and §4 (`read-verified`: §1, §2, §5–§8 byte-identical to `main`).
- **AC9** (command): `bun test scripts/review-loop-discipline.test.mjs` passes
  at the PR head, and `git diff main -- scripts/review-loop-discipline.test.mjs`
  removes no existing assertion (additions or equal-strength rewrites only).
  The planning pin table's floor and discrimination legs are green in the same
  run (AC14).
- **AC10** (command): `git diff main --stat -- packages/agentic-workflow-schema`
  is empty, and `cd packages/agentic-workflow-schema && bun run test` passes.
- **AC11** (command): `bun test scripts/ledger-ownership.test.mjs
  scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
  scripts/normative-drift.test.mjs && bun scripts/check-skill-context.mjs`
  is green at the PR head (the machine-pinned LEDGERS blocks survive the edit).
  The pin table's presence and discrimination legs (AC14) are part of this
  head-level green.
- **AC12** (command): the mirror was re-bundled after the last `skills/` edit
  **from the package that owns the script** — `cd packages/pi-agentic-workflow
  && bun run bundle:skills` (this repository has no root `package.json`, so the
  bare `bun run bundle:skills` at the repository root exits non-zero) — and
  `bun run test` passes from the same package root (mirror parity).
- **AC13** (command + `read-verified`): `grep -n "2603.00539" README.md` exits
  zero at the PR head (References append), and each edited skill's `version:`
  is bumped with a CHANGELOG row (`read-verified` against the bump-skill diff).
- **AC14** (command): the planning-side pins are mechanically present and
  discriminating at the PR head — the discipline suite declares the planning pin
  table (`grep -q "PLANNING_PIN_TABLE"
  scripts/review-loop-discipline.test.mjs` exits zero), executes the
  discrimination leg (`grep -q "assertDiscriminating("
  scripts/review-loop-discipline.test.mjs` exits zero), states the frozen row
  floor (`grep -q "PLANNING_PIN_FLOOR = 9"
  scripts/review-loop-discipline.test.mjs` exits zero), and
  `bun test scripts/review-loop-discipline.test.mjs` passes — so an absent,
  empty, or trivially-true pin set can no longer satisfy any criterion that
  depends on it.

### Tooling

- No external skill or MCP dependency — this feature is authored and executed
  with the repository's own workflow skills.
- `bump-skill` (repository-internal, `user-invocable: false`) runs at execution
  for the version bumps; the bundler runs from the package that owns it — `cd
  packages/pi-agentic-workflow && bun run bundle:skills` per the normalizer
  inventory's bundler step.

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
      `read-verified` — AC1–AC3, AC5, AC7–AC14 commands; AC4 and AC6 labelled
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

Written by `plan-feature` (2026-09-17, artifact revision `31-plan-1`), only
once the Product half above was marked `designed` and independently reviewed
(receipt `spec-review-31-1` @ snapshot
`735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a` — verified
fresh against the bytes on disk by `pre-execution-snapshot.mjs verify --stage
spec` at this scaffold's Product-review gate). Re-cut as artifact revision
`31-plan-2` by the repair batch of 2026-09-17 after `review-plan` returned
`PLAN-REVIEW-FAIL` (checks L5/P10, findings F01/F02/F03) — see `## Amendments`.

### Technical goals

- **One materiality floor across both pre-execution stages.** In
  `planning-findings` semantics, material = `medium`+; a `low` finding is a
  **report-note** — persisted, visible, non-blocking, never by itself a
  re-review trigger, resolvable by the stage author without any re-review;
  `info` stays immaterial. The anti-deflation rule carries over verbatim: a
  real defect mislabeled `low` classifies at `medium` minimum, and deflating
  a severity to dodge a review is itself a review defect.
- **Structural loop termination.** The spec/plan repair loop is capped at
  **two** review→repair→re-review cycles: the second cycle prints the
  existing `CONVERGENCE-ANOMALY` block (byte-unchanged) before any further
  edit; a third cycle never starts without explicit user instruction; an
  unconverged loop ends in the existing `NEEDS-DESIGN` verdict routed to the
  human — no new terminal label, no new grammar.
- **A cheap honest route for cosmetic repairs.** A POLICY §3 wording-only
  determination (intent, obligation identity, phase topology, validators, and
  authority all unchanged) routes the repair batch **without** the full
  snapshot re-review; the determination is recorded in the unit's frozen
  evidence and `artifactRevisionId` still rotates.
- **Preserved honesty properties.** No severity vocabulary change, no schema
  change, no code-side behavior change, snapshot binding and receipt shape
  intact, union/counter-evidence/independence rules untouched.

### Architecture impact

This feature is **docs-layer only**: skill reference prose plus the
deterministic pins that guard it. No schema package change, no runtime script
behavior change (`pre-execution-snapshot.mjs` untouched), no new machine
grammar (the `NEEDS-DESIGN` verdict and the `CONVERGENCE-ANOMALY` block are
already machine-pinned; the cap introduces no new fenced block, so the
normative-surfaces table in `CLAUDE.md` needs no new row).

Affected surfaces (verified at HEAD `180c7127`; evidence rows PE-001…PE-007
in `planning-evidence.md`):

- `skills/pre-execution-review/references/LEDGERS.md:93` — §3 severity
  semantics (the moved line).
- `skills/review-spec/references/CHECKS.md:104` and
  `skills/review-plan/references/CHECKS.md:105` — "Material = anything above
  `info`" restatements.
- `skills/pre-execution-review/references/POLICY.md:36-52` (§3) and
  `:53-85` (§4) — wording-only consequence + hard cap.
- `skills/review-spec/references/OUTPUT.md:109-123` and
  `skills/review-plan/references/OUTPUT.md:28,118-126` — verdict-side loop
  text mirrors.
- `skills/design-feature/references/REPAIR.md:57-71` — §4 cap mirror.
- `scripts/review-loop-discipline.test.mjs` — additive planning-side pin
  sections (PE-007: the suite already reads `LEDGERS.md` + both `OUTPUT.md`
  files; `POLICY.md`/`CHECKS.md`/`REPAIR.md` reads are new consts).

Invariants the implementation must hold:

- **AD-008 preserved** (`REPOSITORY_STATE.md`): correctness stays evidence-
  and obligation-bound, never cycle-count-bound. The cap stops the loop and
  routes an explicit human decision (`NEEDS-DESIGN`, user-gated third cycle);
  it never uses a cycle count to establish correctness, never auto-continues,
  and never waives findings (D-31-5; obligation O14). Recorded
  classification: `preserves` — no `resolve-repository-state` amendment is
  triggered unless a reviewer reads an actual contradiction (D-31-5's
  conditional trigger).
- **Byte-stability constraints**: the `CONVERGENCE-ANOMALY` block, the
  receipt-literal lines in both `OUTPUT.md` files (the
  `agentic-workflow/pre-execution-review-receipt@1` rendered fact), the
  LEDGERS row shape / writer map / ownership block, and both CHECKS severity
  vocabulary lists stay byte-identical (AC8, AC9, AC11; PE-010).
- **Formal invariant classification**: `n/a: no project invariants declared`
  (NRS F010 — no `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists).

```text
Preflight: NRS consumed · invariant classification: n/a: no project invariants declared (F010) — AD-008 preserved (D-31-5)
```

### Design

**E1 — Ledger severity semantics (`LEDGERS.md` §3).** The sentence
"`info` is the only immaterial one" (line 93) is replaced by the planning
materiality line: **material = `medium`+; `info` is immaterial; `low` is a
report-note** — the row is appended to the ledger like any finding (same
columns, same writers, same append-only contract), stays visible, never
blocks a PASS, and never triggers a re-review by itself; the stage's author
resolves it through the normal repair route without any re-review. The
PASS-coexistence sentence at the section tail ("A `PASS` may not coexist with
an open material/unverified row") is restated against the new line: only
open `medium`+ or unverified rows block a PASS. The anti-deflation carry-over
is stated verbatim in the same section: a real defect mislabeled `low`
classifies at `medium` minimum, and deflating a severity to dodge a review is
itself a review defect. Row shape, writer map, ownership block, and the
append-only/no-delete contract are untouched.

**E2 — Stage CHECKS restatements (both `CHECKS.md` files).** Each file's
findings-assembly paragraph (spec :104, plan :105) replaces "Material =
anything above `info`" with "Material = `medium`+" plus the report-note
sentence plus the anti-deflation sentence, so a reviewer filing rows reads
the same floor the ledger states. The closed severity vocabulary list in each
file stays byte-identical.

**E3 — POLICY §4 hard cap.** After the existing second-cycle
`CONVERGENCE-ANOMALY` text (block byte-unchanged), §4 states: the planning
review loop runs **at most two** review→repair→re-review cycles per stage per
unit; the count derives from the persisted receipts and repair records in the
unit's `progress.md` and `planning-findings.md` (no new store, no counter
write — mirrors `review-plan`'s existing `none — first cycle` field); **a
third cycle never starts without explicit user instruction**; an unconverged
loop ends in the existing **`NEEDS-DESIGN`** verdict routed to the human
through the stage's design/plan authority. The closing sentence "The anomaly
is printed and routed, never a stop, and no cap converts a verdict into a
dead end" is replaced with the user-gated-stop semantics: the cap's exit is a
recorded human decision, not a silent stop and not an automatic continuation
— the no-dead-end property is preserved *by* the human route (D-31-2,
D-31-5). The repair-turn exemption paragraph is kept and scoped: it protects
a repair turn responding to a persisted verdict **within an authorized
cycle** from being blocked mid-repair; after the cap there is no further
re-review to input a repair — the loop ends in `NEEDS-DESIGN`.

**E4 — POLICY §3 wording-only route.** The opening paragraph keeps the
single re-review of the resulting snapshot as the **default** batch
consequence and adds the exemption: when the repair turn records a
**wording-only determination** (intent, obligation identity, phase topology,
validators, and authority all unchanged) in the unit's frozen evidence — a
planning-evidence row at the new `artifactRevisionId` — the cosmetic batch
routes without the full snapshot re-review; the next material change re-opens
review. The Wording-only row's forbidden cell keeps the recording requirement
and adds the rotation requirement (the determination record and the revision
rotation are not skippable — D-31-3). The Common-root-cause and
Scope-changing rows stay untouched.

**E5 — Verdict-surface mirrors (both `OUTPUT.md` files + `REPAIR.md` §4).**
Each OUTPUT file's loop text extends its second-cycle paragraph with the cap
(`third cycle never starts without explicit user instruction`; unconverged →
`NEEDS-DESIGN`), keeping the receipt-literal lines and verdict blocks
byte-identical. `REPAIR.md` §4 replaces "More cycles stay allowed when
correctness needs them" (:64-65) and "no cycle cap converts its verdict into
a dead end" (:71) with the same cap mirror, preserving the §4 heading and the
anomaly-first ordering.

**E6 — Discipline pins (`scripts/review-loop-discipline.test.mjs`).** A new
planning-side pin section: new `read()` consts for `POLICY.md`, both
`CHECKS.md`, and `REPAIR.md` (the suite already reads `LEDGERS.md` and both
`OUTPUT.md` files), asserting the report-note
semantics, the `medium`+ materiality line in both CHECKS files, the
anti-deflation rule, the cap (`third cycle never` + `NEEDS-DESIGN` end +
unchanged `CONVERGENCE-ANOMALY` block), the verdict mirrors, and the
wording-only route. Every existing assertion keeps its phrase or gains a
strictly stronger assertion (AC9's no-weakening walk).

The planning pins are declared as rows of one table, `PLANNING_PIN_TABLE`
(`{ id, doc, must, superseded }`), never as loose `assert.match` calls: the
suite executes three legs over it — **liveness** (every row's `must` matches
the bytes on disk), **discrimination** (every row's `must` does **not** match
the `superseded` sentence the pin replaces, so a pin that is trivially true or
absent reddens the suite instead of passing vacuously), and **floor**
(`assert.ok(PLANNING_PINS.length >= PLANNING_PIN_FLOOR)` — 4 after P1, 8 after
P2, 9 at the PR head, so a truncated table cannot pass). The discrimination
leg is a named call (`assertDiscriminating(<row>)`), which keeps it greppable
by the frozen AC14 validator.

**E7 — Version bumps (bump-skill).** `pre-execution-review` 2.2.1 → 2.3.0,
`review-spec` 1.7.1 → 1.8.0, `review-plan` 1.6.1 → 1.7.0 (P1, the phases'
first edits), `design-feature` 3.4.0 → 3.5.0 (P2) — minor bumps per the #176
freeze, one bump per skill per PR (E-D31-1); CHANGELOG rows + README table
cells ride the `bump-skill` contract.

### Planning evidence

see planning-evidence.md (M/L unit — the frozen table lives in
`planning-evidence.md`; rows PE-001…PE-019, all `current`, `proven` or
`decision`).

### Obligations

see planning-obligations.md (M/L unit — O1…O15, one row per acceptance
criterion AC1…AC14 plus O14 for the AD-008 invariant; every row starts
`planned`; no row is `deferred`).

### Decisions to confirm

Engineering decisions recorded with rationale in `decisions.md`
(E-D31-1…E-D31-4, 2026-09-17, plus E-D31-5…E-D31-7 added by the `31-plan-2`
repair batch); the project lead may override any of them before execution:

- **E-D31-1 — one version bump per skill per PR**, taken in the phase that
  first edits the skill; later phases re-editing the same PR's surfaces do
  not re-bump.
- **E-D31-2 — no `docs/workflow/` tutorial edit** (no severity statement
  exists there today; AC8 pins the diff scope; `audit-docs` owns drift).
- **E-D31-3 — AD-008 classified `preserves`** (the cap routes to a human
  decision; D-31-5), recorded as obligation O14.
- **E-D31-4 — planning-side pins live in the existing
  `scripts/review-loop-discipline.test.mjs`** as additive rows, keeping
  AC9's no-weakening walk a single diff.
- **E-D31-5 — F02's repair: one declared pin table with a row floor and a
  discrimination leg** (`PLANNING_PIN_TABLE`, `PLANNING_PIN_FLOOR = 4/8/9` per
  phase, `assertDiscriminating(`), plus the frozen AC14 validator; keeps
  E-D31-4 and adds no second test file.
- **E-D31-6 — F01's repair: the bundler command is always spelled from the
  package root** (`cd packages/pi-agentic-workflow && bun run bundle:skills`);
  `CLAUDE.md`'s parsed `normalizer-inventory@1` row is not an editable surface.
- **E-D31-7 — F03's repair: AC8 walks the declared derived-surface set** (Pi
  mirror, four `version:` lines, README skill-table cells, `CHANGELOG.md`)
  recorded per path instead of reported as a violation.

### Testing requirements

Docs-layer feature; the test layer is the deterministic pin suite plus the
repository's machine gates — no new test file, no runtime code:

- **Discipline pins (primary)**: `bun test scripts/review-loop-discipline.test.mjs`
  gains the planning-side pin table (red-first in P1–P3, green by each phase's
  edit); every existing assertion keeps its strength (AC9). Each pin is a table
  row carrying the sentence it supersedes, so the suite executes a
  discrimination leg (a row that accepts its superseded sample fails) beside the
  liveness leg (a row that does not match the live bytes fails) and a row floor
  (`PLANNING_PIN_FLOOR`, 4 after P1, 8 after P2, 9 at the PR head) — the frozen
  validator that checks the table exists is AC14. The suite must pass under bun
  and node (runtime convention).
- **Ledger truth classes**: `bun test scripts/ledger-ownership.test.mjs
  scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
  scripts/pre-execution-sensor.test.mjs` — the LEDGERS edit must not disturb
  the machine-pinned blocks (AC11).
- **Normative surfaces**: `bun test scripts/normative-drift.test.mjs` — no
  new grammar, no stale version restatement (AC11).
- **Context budgets**: `bun scripts/check-skill-context.mjs` after the four
  bumps, manifest updated for declared growth (AC11).
- **Distribution parity**: `cd packages/pi-agentic-workflow && bun run
  bundle:skills && bun run test` (the bundler script lives in the package; there
  is no root `package.json`) (AC12).
- **Negative integration**: schema package diff empty + suite green (AC10).
- **Read-verified walks** (judgement-only, recorded in the P4 phase entry):
  POLICY §3/§4 hunk scope, whole-diff surface list, no-weakening test diff,
  bump-skill output diff (AC4, AC6, AC8, AC9, AC13).

Full ladder and scenario inventory: `testing.md`.

### Dev scenarios

Failure modes seeded from the fixed category list; each reaches through an
**existing** mechanism (no new domain):

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `loop:report-note-pass` (empty/zero state) | a review PASS coexists with open `low` report-note rows — no repair batch, no re-review | the findings-ledger append mechanism (`LEDGERS.md` §3) — live precedent: this unit's own two open `info` rows |
| `loop:deflation-guard` (invalid input) | a real defect mislabeled `low` re-classifies at `medium` minimum and blocks | the anti-deflation sentence in `LEDGERS.md`/`CHECKS.md` (reviewer classification act) |
| `loop:closed-vocabulary` (invalid input) | a severity outside `info\|low\|medium\|high\|critical` is never introduced | the closed receipt vocabulary in both CHECKS files + the untouched schema package |
| `loop:role-violation` (permission denied) | an author turn filing findings against its own artifact, or a script writing a ledger row, stays denied | the role matrix C1–C5 + the ledger-ownership test (unchanged ownership block) |
| `loop:cap-hit` (limit/threshold hit) | the second cycle prints `CONVERGENCE-ANOMALY` before any further edit; a third cycle is refused without explicit user instruction; an unconverged loop ends in `NEEDS-DESIGN` | POLICY §4 cap over persisted receipts + repair records (the `none — first cycle` receipt field) |
| `loop:wording-only-skip` (concurrent/duplicate action) | a recorded cosmetic repair batch skips the re-review while the determination row + rotated revision remain | POLICY §3 route over the planning-evidence home + `artifactRevisionId` rotation |
| `loop:dup-finding` (concurrent/duplicate action) | the same finding re-reported in a later cycle keeps its stable id and gains a second resolution row | `finding-id` stability in `LEDGERS.md` §3 (§3 outside the edited hunks — AC8 walk) |
| `loop:pin-vacuous` (invalid input) | a planning pin that is absent, empty, or trivially true leaves the discipline suite green — the validator would pass on a no-op | the pin table's row floor + the discrimination leg (every row must reject its superseded sentence), checked by the AC14 validator in P1–P3 and again at the PR head |
| outage/dependency failure — n/a | no runtime dependency exists; every validator is a local command over repository bytes | n/a: all checks run locally (bun/node) |

### Phases

Detailed tasks: `TASKS.md`. Phase order matches the dependency-free cut (the
unit's hard dependency 29 is merged); the final phase is hardening.

#### P1 — Move the planning materiality line to report-note semantics

Layer: docs. Done-when: `bun test scripts/review-loop-discipline.test.mjs &&
grep -q "PLANNING_PIN_TABLE" scripts/review-loop-discipline.test.mjs` → exit 0
with the report-note, CHECKS-materiality, and anti-deflation pins green as the
first four rows of the planning pin table (`PLANNING_PIN_FLOOR = 4`, liveness
and discrimination legs green) and every existing assertion still passing.

#### P2 — End the planning repair loop at a hard two-cycle cap

Layer: docs. Done-when: `bun test scripts/review-loop-discipline.test.mjs &&
grep -q "PLANNING_PIN_FLOOR = 8" scripts/review-loop-discipline.test.mjs` →
exit 0 with the cap, verdict-mirror, and REPAIR-mirror pins green as table rows
(floor raised to 8, discrimination leg green) and every existing assertion
still passing.

#### P3 — Route wording-only repairs past the full snapshot re-review

Layer: docs. Done-when: `bun test scripts/review-loop-discipline.test.mjs &&
grep -q "PLANNING_PIN_FLOOR = 9" scripts/review-loop-discipline.test.mjs` →
exit 0 with the wording-only pin green as the ninth table row (the frozen
floor) and every existing assertion still passing.

#### P4 — Qualify the planning-review-materiality unit

Layer: hardening. Done-when: `bun scripts/check-skill-context.mjs && bun test
scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs
scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
scripts/normative-drift.test.mjs` → exit 0 with every frozen `ACCEPTANCE.md`
validator green at the terminal HEAD (AC14's three `PLANNING_PIN_TABLE` /
`assertDiscriminating(` / `PLANNING_PIN_FLOOR = 9` greps included) and the PR
open with `Closes #171`.

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Every implementation phase above passed the canonical eight-box phase-lint
before emission (`bun scripts/phase-lint.mjs
docs/features/31-planning-review-materiality/PLAN.md`, node fallback — stdout
pasted verbatim):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:docs:8:move-planning-materiality-line-to-report-note-semantics
P2 Phase-lint: PASS (8/8) · fingerprint P2:docs:7:end-planning-repair-loop-at-hard-two-cycle-cap
P3 Phase-lint: PASS (8/8) · fingerprint P3:docs:3:route-wording-only-repairs-past-full-snapshot-re-review
P4 Phase-lint: PASS (8/8) · fingerprint P4:hardening:10:qualify-planning-review-materiality-unit
verdict PASS
fingerprint: 5465f0aa8251f530682fb74a0843c36d82561624c76ced06c2122cfa85e40798
```

Re-linted by the `31-plan-2` repair batch (2026-09-17): P1's task budget grew
6 → 8 (the pin table + its discrimination leg), so its fingerprint changed;
P2/P3/P4 keep their fingerprints and the aggregate moves from `db27c41e…` to
`5465f0aa…`.

### Deploy & rollback

n/a — merging is enough. Docs-layer skills re-bundle with the PR
(`bundle:skills` in P4); the rules take effect at the next planning review
that runs the bumped skills. Rollback is reverting the PR.

### Open questions / risks

- **Inherited, RESOLVED by this plan**: the Product half deferred "the exact
  `review-loop-discipline.test.mjs` pin diff" to the Engineering half —
  resolved as E6 + the P1–P3 pin tasks (`decisions.md` E-D31-4).
- **D-31-5 conditional trigger**: if a `review-spec`/`review-plan` reviewer
  reads an actual contradiction between the cap text and AD-008,
  `resolve-repository-state` owns the wording amendment at execution time —
  not a phase task here (E-D31-3 records the `preserves` classification).
- **Risk — normative-grammar collisions**: the OUTPUT edits touch
  machine-pinned surfaces; mitigated by byte-identical receipt-literal lines
  (PE-010) and the `normative-drift` gate in P4. A new fenced block would
  re-enter scope as a plan-time finding (Integration closure row 5).
- No open engineering question remains; N31-001/N31-002 (`info`) route to
  `design-feature`, not to execution (`known-issues.md` boundary 2).

### Deliverables

- Filled Engineering half (this document) + the M/L artifact set:
  `PLAN.md`, `TASKS.md`, `ACCEPTANCE.md` (frozen), `planning-evidence.md`,
  `planning-obligations.md`, `testing.md`, `known-issues.md`,
  `architecture-notes.md`, engineering decisions in `decisions.md`.
- The implementation PR (opened by P4) containing: the `LEDGERS.md` §3,
  POLICY §3/§4, both CHECKS, both OUTPUT, and `REPAIR.md` §4 edits; the
  planning-side pin table in `scripts/review-loop-discipline.test.mjs` (row
  floor + discrimination leg + the frozen AC14 validator);
  four minor version bumps + CHANGELOG rows + README cells; the Pi mirror
  re-bundle (from the package root); the bottom `## References` append in
  `README.md` (AC13);
  `Closes #171`.

### Post-merge next feature

`32-review-consistency-pack` (#172) — next of the 2026-09 Phase-1 loop-policy
chain; it depends on 30 + 31 and reworks the same POLICY/CLASSIFY surfaces
one owner at a time. Rows 35/42 (and 46's coordination) chain after it per
`docs/features/ROADMAP.md`.

---

## Amendments

### `31-plan-2` — repair batch for `plan-review-31-1` (F01 + F02 + F03)

User-authorized repair batch (2026-09-17), commissioned as "repair F01 + F02
(+F03) — package-root `bundle:skills`, mechanical pin-existence validators, AC8
derived-surface walk". Trigger: `plan-review-31-1` returned
`PLAN-REVIEW-FAIL` (failed checks L5 + P10) with three findings on
`planning-findings.md`, repair owner `plan-feature`, first cycle. No phase had
been executed (the roadmap row reads `planned`, no `in-progress` transition, no
phase commit), so every repair lands in the phase that owns the surface:
`P1`–`P3` are re-cut in place (their done-whens and pin tasks), `P4` takes the
command-form and scope-walk corrections, and no ledger-order change or new
number is introduced.

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| F01 | plan · medium | The bundler invocation is spelled from the package that owns the script: `cd packages/pi-agentic-workflow && bun run bundle:skills` (no root `package.json` exists; root `bun run bundle:skills` exits non-zero). Evidence: `packages/pi-agentic-workflow/package.json` `scripts.bundle:skills`; feature 59 AC-12 + feature 29 `testing.md` precedent (PE-018). `CLAUDE.md`'s parsed `normalizer-inventory@1` row is **not** edited — `scripts/pre-execution-quality.test.mjs` reads that row, so the short step name stays and the invocation form is owned by these manifests (E-D31-6). | AC12 + `## Commands`, `### Testing requirements`, the Pi-mirror Integration-closure row, PE-012, PLAN.md P4 task 2, TASKS.md P4 task 2, testing.md, obligations O12 |
| F02 | plan · medium | The planning pins are mechanically **present and discriminating**: one declared `PLANNING_PIN_TABLE` with a row floor (`PLANNING_PIN_FLOOR`, 4/8/9 per phase) and a discrimination leg (`assertDiscriminating(<row>)`) proving every pin rejects the sentence it supersedes, plus the frozen AC14 validator (`grep` for the table, the discrimination call, and the floor + suite green). A no-op suite can no longer satisfy AC1–AC3, AC9 or AC11 (E-D31-5). | AC14 (new) + AC1–AC4, AC6, AC7, AC9, AC11; In-scope 5; Design E6; `### Testing requirements`; the `loop:pin-vacuous` scenario row; P1–P3 done-whens and pin tasks; obligations O1–O4, O6, O7, O9, O11, O15 |
| F03 | plan · info | AC8's scope guard walks the **declared derived-surface set** — the Pi mirror under `packages/pi-agentic-workflow/skills/**`, the four edited `version:` lines, the README skill-table cells, `CHANGELOG.md` — so P4's read-verified walk records them as in-scope instead of reporting them as violations (E-D31-7). | AC8 + In-scope derived surfaces; PLAN.md/TASKS.md P4 task 5; obligations O8 |

Artifact revision: the whole touched set rotates to **`31-plan-2`**
(`artifactRevisionId` duty, `replan-findings/references/PHASE_APPEND.md`); the
Product-half receipt `spec-review-31-1` still binds unchanged Product bytes and
remains the plan snapshot's Product parent. `ACCEPTANCE.md` was re-frozen as
part of this batch (blob recorded in `PLAN.md`), because AC8's wording, AC12's
validator and the new AC14 are acceptance surfaces. The plan receipt
`plan-review-31-1` is invalidated by design: only a fresh `/review-plan`
restores currency.

Also touched by this batch (evidence integrity, same repair act): PE-016's
obligation cell cited a non-existent `O15`, now corrected to `O10`; the
obligation ledger gains O15 for AC14.
