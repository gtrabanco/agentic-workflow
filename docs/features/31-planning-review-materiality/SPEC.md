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
whose unconverged end is the stage's human stop — `NEEDS-DESIGN` where the
verdict vocabulary sanctions it (spec stage), the orchestrator's refusal +
`design-feature` routing at the plan stage (D-31-8) — a third cycle never
starts without explicit user instruction (mirroring `review-change`), and a
POLICY §3
**wording-only** determination routes a cosmetic repair batch without a full
snapshot re-review (determination recorded; `artifactRevisionId` still
rotates). Basis: issue [#171](https://github.com/gtrabanco/agentic-workflow/issues/171).

## Branch

`feat/31-planning-review-materiality`

## Size

`M` — one concern (planning-side loop rules) whose carrier is now **code**
(D-31-6): the schema package's finding record + materiality predicate, the
snapshot verify exit code and closed freshness codes, the orchestrator's cap
refusal, phase-lint, plus the prose shrink to the non-computable remainder and
their pins. Full artifact set in planning. No split trigger fires: well under 5
phases, one concern across code + docs layers, and every product decision is
resolved by the issue and ruling (D-31-1…D-31-5 + D-31-6…D-31-8).

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
- POLICY §4 prints `CONVERGENCE-ANOMALY` on a second cycle but then says
  "Entering a **second** cycle is allowed when correctness needs it" and "no cap
  converts a verdict into a dead end"; `design-feature/references/REPAIR.md` §4
  repeats "More cycles stay allowed when correctness needs them". The planning
  loop is unbounded on paper — the exact structural defect #159 fixed on the
  code side.

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

**Carrier ruling (D-31-6, 2026-09-17).** After the 2026-09-17 review-cost audit,
the owner ruled that the materiality predicate, the two-cycle cap and the
wording-only route move **into code**: the finding record's
`class`/`severity`/`reproducer` plus `pre-execution-snapshot.mjs verify`'s exit
code and closed reason codes carry the predicate; the orchestrator's transition
decider refuses to advance past the cap; phase-lint keeps the plan layer honest;
prose shrinks to what is not computable (the anti-deflation judgment, the
human-keyed third cycle, the intent half of a wording-only determination). The
four frozen semantics are unchanged and restated verbatim in Scope. The domain
already runs review this way at the machine layer: required status checks must
pass before a pull request can be merged (GitHub Docs, fetched 2026-09-17), and
static-analysis findings are machine-computed and surfaced inside human review
at platform scale (Tricorder, https://research.google/pubs/pub43322/, fetched
2026-09-17).

### Business goals

Internal/technical feature; the outcome it serves is workflow economics and
review honesty, not a market:

- Cut the cost of a planning review cycle: a taste-level finding no longer
  buys a repair batch + full re-review of an unchanged-in-substance snapshot.
- Make loop termination structural: an unconverged planning loop asks the
  human instead of cycling by default — `NEEDS-DESIGN` at the spec stage, the
  orchestrator's refusal + `design-feature` routing at the plan stage
  (D-31-8).
- Keep every honesty property the workflow already pins: findings stay visible,
  mislabeled defects still block, dismissal still needs counter-evidence, and
  every repair write still rotates the artifact revision.

### Scope

#### In scope

Primary carrier — the machine surfaces D-31-6 names (all verified at branch head
`a400b978`):

1. **The schema finding record carries the materiality predicate**: the finding
   record in `packages/agentic-workflow-schema/src/pre-execution-contract.ts`
   (`PreExecutionReviewFindingV1`: `severity` `info|low|medium|high|critical`,
   `class` `product|plan|source|environment|runtime`, `claim`, `evidenceRefs`,
   `verification`, `resolution`) gains a bounded **`reproducer`** field (the
   machine-checkable way to re-demonstrate the finding), and the runtime rule
   that computes materiality (`pre-execution.ts` `const material =
   finding.severity !== "info"`) becomes **material = `medium`+** — a PASS may
   coexist with open/unverified `low` rows (report-notes) but never with an
   open/unverified `medium`+ row → AC1 + AC2 + AC3.
2. **The wording-only route rides the closed freshness/reason codes**: the
   snapshot verify distinguishes, through `PRE_EXECUTION_FRESHNESS_CODES` (10
   closed codes) and its exit codes (0 current · 3 no receipt · 4 receipt not
   current · 1 usage), a **wording-only movement** (revision rotated,
   determination recorded, acceptance fingerprint and bound material bytes
   unmoved → still current, no re-review owed) from **material movement**
   (for moved bound bytes the comparator answers `stale-source-revision` →
   re-review owed); the determination record and
   the `artifactRevisionId` rotation are enforced by the same predicate —
   neither is skippable → AC4.
3. **The orchestrator refuses to advance past the cap**: the transition decider
   (`decideWorkflowAction` over `WORKFLOW_TRANSITION_TABLE`, rows
   `review-spec`/`review-plan`) refuses a third consecutive unconverged
   review→repair→re-review cycle (stop + the human route named); a PASS resets
   the count; an unconverged loop ends in the existing `needs-design` verdict
   where the verdict vocabulary sanctions it (spec stage) and in the refusal +
   `design-feature` routing at the plan stage (the machine map does not
   sanction a plan-stage `needs-design` receipt — fix/162) → AC5 + AC7.
4. **Phase-lint keeps the plan layer honest**: the re-cut plan set expresses
   the loop rules through machine-checkable done-whens (run-and-paste
   `pre-execution-snapshot.mjs verify` exit codes), and the plan set passes
   `bun scripts/phase-lint.mjs` at the PR head — plans mirror machine
   surfaces, never prose recitations → AC6.
5. **Prose shrinks to the non-computable remainder**: `POLICY.md` §3/§4, both
   `CHECKS.md`, both `OUTPUT.md`, `LEDGERS.md` §3 and
   `design-feature/references/REPAIR.md` §4 lose the sentences the machine now
   owns ("`info` is the only immaterial one", "Material = anything above
   `info`", the unbounded-cycle sentences, the mandate of a re-review for every
   batch). The remainder this shrink leaves in those surfaces is **authored,
   not preserved**: the anti-deflation judgment ("`medium` minimum";
   deflation is itself a review defect), the human-keyed third-cycle rule
   ("third cycle never starts without explicit user instruction"), and the
   report-note persistence contract in the ledger (with the planning
   materiality line — material = `medium`+; `low` is a report-note — that
   replaces the removed sentences) do not exist in the named planning surfaces
   today and are written fresh by this feature; only the `CONVERGENCE-ANOMALY`
   block and the receipt-literal lines are preserved byte-unchanged
   → AC7.
6. **Discipline pins re-aimed at the code, never weakened**: the planning-side
   pins in `scripts/review-loop-discipline.test.mjs` keep the machine rule
   honest (they pin the schema predicate, the verify outcomes, the decider
   refusal — not prose sentences); every existing assertion keeps its strength
   → AC8 + AC9.
7. **Version bumps + release surfaces**: the schema package (additive minor)
   and the touched skills (`pre-execution-review`, `review-spec`,
   `review-plan`, `design-feature` — minor per the #176 freeze) bump in the
   same PR with CHANGELOG rows and README skill-table cells; the Pi mirror is
   re-bundled from the package that owns the bundler
   (`cd packages/pi-agentic-workflow && bun run bundle:skills`) → AC10 + AC11
   + AC14.
8. **Bibliography obligation** (issue #171): when this ships, the Jin & Chen
   entry appends to `README.md` under a bottom `## References` section (created
   if absent, deduped against other features' entries) — in the implementation
   PR, never before → AC12.

Plus the **declared allowed-set groups** the PR diff may carry, declared so the
scope guard walks them instead of reporting them as violations → AC13:

- **Code carriers**: `packages/agentic-workflow-schema/**` (sources, tests, and
  the generated Draft-07 projections the package's generators rewrite),
  `scripts/pre-execution-snapshot.mjs`, `scripts/pre-execution-contract.mjs`,
  `scripts/pre-execution-attribution.test.mjs`,
  `scripts/pre-execution-sensor.test.mjs`,
  `scripts/review-loop-discipline.test.mjs`, `scripts/workflow-status.mjs`,
  `scripts/workflow-status-pre-execution.test.mjs`, `scripts/phase-lint.mjs`.
- **Prose-shrink surfaces + derived surfaces**: the named skill reference files
  under `skills/**`; the touched skills' `version:` lines; the README
  skill-table cells; `CHANGELOG.md`; the Pi mirror under
  `packages/pi-agentic-workflow/skills/**` (written only by the bundler).
- **Workflow-mutated record surfaces** (per `verification-contract`
  §Validator stability): the unit's own records under
  `docs/features/31-planning-review-materiality/**`, the unit's
  `docs/features/ROADMAP.md` row, and `docs/LOGS.md` session-log appends.

Every path in the PR diff must belong to one of the three declared groups; any
path outside them remains a scope violation.

#### Out of scope / non-goals

- **No new vocabulary values anywhere**: the severity set
  (`info|low|medium|high|critical`), the five verdicts, the freshness codes, and
  the decider's stop/sense codes keep their values (additions only where this
  SPEC names them: the finding record's `reproducer` field and the cap-refusal
  outcome); no contract-id rotation (`pre-execution-review-receipt@1` stays)
  → AC9.
- **Code-side review/fold behavior** (`review-change`, `review-implementation`,
  `fold-findings`, the review→fold loop) — unchanged; fix #159 owns it, and
  `fold-findings` still never repairs a planning artifact (the boundary
  sentence stays pinned).
- **Receipt binding and honesty machinery unchanged**: snapshots still bind
  exact bytes with digest + artifact revision; author exclusion, context-clean
  evidence, counter-evidence-bound dismissal, and reviewer independence are the
  validator's existing rules — this amendment moves the materiality line and
  the cap, nothing else in the receipt contract.
- **No retroactive reclassification**: `low` rows already persisted in existing
  units' `planning-findings.md` keep their recorded semantics; units adopt the
  new machine line at their next review cycle.
- **The superseded plan set is not repaired**: `31-plan-1`/`31-plan-2`
  (`PLAN.md`, `TASKS.md`, `ACCEPTANCE.md`, `planning-evidence.md`,
  `planning-obligations.md`, `testing.md`) and its findings (`F01–F03`,
  `R31-01…R31-03`) die with the carrier they describe; `plan-feature` re-cuts
  the set from scratch (D-31-6).
- **No aspirational citation**: nothing is appended to `README.md` before the
  implementation PR ships (evidence-grounding forward-looking-claim rule).
- **No tutorial edit**: `docs/workflow/` carries no severity statement today;
  `audit-docs` owns inventory↔docs drift.

### Capability closure

This repository ships workflow skills plus the deterministic package and
scripts that govern them — there is no UI and no API. A "surface" below is the
schema type, script, ledger, or skill reference text that owns the behavior;
the "test" is the deterministic suite or pin that guards it. Entities,
capabilities, roles, and the integration inventory are the workflow's own; the
derived inventory is recorded under Integration closure.

**1. Entity closure** — three entities, all records of the planning review loop:

**E1 — Planning finding record (schema `PreExecutionReviewFindingV1` + the
`planning-findings.md` ledger row)**

- Create (file) — the reviewer turn files findings into the receipt (≤ 64,
  unchanged) and appends ledger rows; `low` rows are persisted report-notes in
  both, each carrying the bounded `reproducer` (the machine-checkable
  re-demonstration of the claim). Surface: the finding record's fields in
  `pre-execution-contract.ts` (`FINDING_SPEC`) + `LEDGERS.md` §3 writer map
  (unchanged). Test: schema suite vectors (receipt validation; a finding
  without evidence or a malformed reproducer is refused) +
  `review-loop-discipline` pins.
- Read/list — reviewers, the stage's author, and `audit-pr` read the ledger;
  the machine reads the receipt record (snapshot builder, `verify`, sensor,
  transition decider). Surface: `LEDGERS.md` ownership-map row
  `planning-findings` (unchanged readers) + the snapshot/verify report. Test:
  `ledger-ownership`/`ledger-provenance`/`pre-execution-sensor` suites.
- Update (resolve) — only the stage's author resolves (unchanged); a `low`
  report-note resolves without any re-review, and the machine enforces the
  coexistence: a PASS with open/unverified `low` rows is valid, the same PASS
  with an open/unverified `medium`+ row is refused (`verdict-mismatch`).
  Surface: the runtime materiality rule in `pre-execution.ts` +
  `pass-requires-resolved-material-findings`. Test: schema vectors (AC1) +
  planning pins (AC8).
- Delete — n/a: the ledger is append-only (`LEDGERS.md` §3) and receipts are
  content-bound (immutable); nothing deletes a finding.
- State transitions — status set stays `open | resolved | dismissed`; dismissal
  still requires recorded counter-evidence (validator rule
  `dismissal-needs-counter-evidence`, unchanged). The only semantic change:
  severity `low` ⇒ report-note (non-material) — same row shape, no new state,
  no new severity value. Test: AC1 + AC2 + AC8.

**E2 — Wording-only determination (machine half + judgment half)**

- Create — the repair turn produces both halves: the **machine half** is
  computed (revision rotated, determination recorded, acceptance fingerprint
  and bound material bytes unmoved → verify stays current without a re-review)
  and the **judgment half** (intent and authority unchanged) is recorded as a
  frozen evidence row in the unit's evidence home (plan stage:
  `planning-evidence.md` M/L or the SPEC section XS/S; spec stage:
  `decisions.md` evidence rows, writer `design-feature:product-decisions`).
  Surface: `pre-execution-snapshot.mjs` verify + `PRE_EXECUTION_FRESHNESS_CODES`
  + `LEDGERS.md` §1 evidence homes. Test: `pre-execution-sensor`/
  `pre-execution-attribution` vectors (AC4).
- Read/list — `verify`, the sensor, the orchestrator, and `audit-pr` read the
  determination from the verify report and the frozen evidence. Surface: the
  verify report (exit code + structural reason) + the evidence rows. Test:
  AC4 + sensor suite.
- Update — n/a: evidence rows freeze at the write that minted them; the
  machine half is derived, recomputed at each verify run.
- Delete — n/a: append-only evidence; derived values are never deleted.
- State transitions — record-once-at-repair-time; the only observable
  transition is the verify outcome flipping when a later material change moves
  bound bytes (`stale-source-revision` → re-review owed).

**E3 — Repair/re-review cycle state (spec and plan stages)**

- Create — the cycle count derives from persisted stage receipts (consecutive
  FAIL-verdict receipts since the last PASS verdict for the stage); no new
  store, no counter write. Surface: the receipts index `verify` already reads
  + the decider's input. Test: cap vectors (AC5).
- Read/list — reviewer turns and drivers read the count from the persisted
  receipts; the orchestrator refuses on it; the sensor renders it. Surface:
  `decideWorkflowAction` over the `review-spec`/`review-plan` table rows.
  Test: AC5 + the schema transition suite.
- Update — n/a: derived value, recomputed from persisted receipts.
- Delete — n/a: derived value.
- State transitions — cycle N → N+1 while unconverged; the second unconverged
  cycle prints the existing `CONVERGENCE-ANOMALY` block before any further
  edit; a third never starts: the orchestrator refuses and names the human
  route (explicit user instruction); an unconverged loop ends in the existing
  **`needs-design`** verdict routed to the human where the verdict vocabulary
  sanctions it (spec stage — `VERDICTS_BY_STAGE.spec`), and in the refusal +
  `design-feature` routing at the plan stage (the machine map narrowed
  plan-stage `needs-design` — fix/162); a PASS resets the count (D-31-7).
  Test: AC5 + AC7.

**2. Integration closure** — no live `docs/CAPABILITIES.md` exists (the file
is the unseeded template), so the inventory below is **derived** from
`CLAUDE.md` (repository layout, verification, packages, normalizer inventory)
plus the `LEDGERS.md` ownership map, and walked one row per subsystem. Seeding
`docs/CAPABILITIES.md` from the template is offered in this turn's closing
block (user confirms; upsert-safe).

| Subsystem (derived) | Exists | How this feature integrates | Test |
|---|---|---|---|
| Schema package (`packages/agentic-workflow-schema/`) | yes | **Primary carrier**: finding record gains `reproducer`; materiality rule becomes `medium`+; decider refuses past the cap; additive minor release; projections regenerated by the package's own generators | schema suite + projection drift checks (`check:pre-execution-schemas`) |
| Snapshot/verify machinery (`scripts/pre-execution-snapshot.mjs` + `PRE_EXECUTION_FRESHNESS_CODES`) | yes | **Primary carrier**: verify distinguishes wording-only movement from material movement; determination recorded; rotation enforced | `pre-execution-sensor` + `pre-execution-attribution` suites (AC4) |
| Orchestrator decider + sensor (`decideWorkflowAction`, `WORKFLOW_TRANSITION_TABLE`, `scripts/workflow-status.mjs`) | yes | **Primary carrier**: cap refusal past two consecutive unconverged cycles; human route named; table rows `review-spec`/`review-plan` otherwise unchanged | schema transition vectors (AC5) + `workflow-status-pre-execution` suite |
| Phase-lint (`scripts/phase-lint.mjs`, rule owner `skills/phase-contract/SKILL.md`) | yes | **Plan-layer carrier**: the re-cut plan set expresses loop rules as machine-checkable done-whens and passes the linter at the PR head | `bun scripts/phase-lint.mjs` on the unit's plan (AC6) |
| Skill reference docs (`skills/*/references/`) | yes | Shrink-only: the computable sentences leave `POLICY.md` §3/§4, both `CHECKS.md`, both `OUTPUT.md`, `LEDGERS.md` §3, `REPAIR.md` §4; the judgment remainder stays | AC7 greps (removals across `POLICY.md`/both `CHECKS.md`/both `OUTPUT.md`/`LEDGERS.md`/`REPAIR.md` + the kept remainder) + context budgets (`bun scripts/check-skill-context.mjs`, AC10); `normative-drift` guards the versioned blocks the shrink must not disturb, not the materiality prose |
| Planning findings ledger (`LEDGERS.md` §3 + ownership map) | yes | Persists `low` report-notes (append-only contract unchanged); row shape, writers, resolvers unchanged | `ledger-ownership` + `ledger-provenance` + `pre-execution-quality` suites |
| Discipline & quality test pack (`scripts/*.test.mjs`) | yes | `review-loop-discipline.test.mjs` planning pins re-aim at the code carriers; existing assertions keep strength | AC8 + AC9 (no-weakening walk) |
| Pi package mirror (`packages/pi-agentic-workflow/skills/`) | yes | Re-bundled after the last `skills/` edit, from the package that owns the script | mirror parity: `cd packages/pi-agentic-workflow && bun run test` (AC11) |
| Versioning/release surfaces (package + skill `version:`s, `CHANGELOG.md`, README tables) | yes | Schema package minor bump; four skill minor bumps; CHANGELOG rows + README cells via `bump-skill` | AC10 + AC14 + rendered-facts consistency |
| README references (bibliography) | yes | The issue's citation obligation lands as a bottom `## References` append in the implementation PR — never before | AC12 grep at PR head |
| Workflow tutorial + site guides (`docs/workflow/*`, `docs/site/guides/`) | partial | No severity statement exists today; no edit; generated guides change only if `docs/workflow/` prose changes (it does not) | n/a here; `audit-docs` owns drift |
| GitHub templates / forge surfaces (`.github/`, issue/PR forms) | no | Untouched by this feature | n/a — no surface exists to integrate with |

**3. Role matrix** — every capability's matrix lists every derived role
explicitly. Roles (derived inventory): `human owner` (project lead), `author
turn` (`design-feature`/`plan-feature`/`plan-fix`), `reviewer turn`
(`review-spec`/`review-plan`), `executor turn` (`execute-phase`), `drivers &
sensors` (deterministic scripts, CI, `workflow-status` — they validate and
refuse; they never author findings).

- **C1 — File a planning finding (any severity, incl. `low` report-notes).**
  Entry point: the findings step of `review-spec`/`review-plan`. Roles:
  reviewer turn allowed · author turn denied (authors never file findings
  against their own artifact) · human owner denied (owner input routes through
  design, not review findings) · executor turn denied · drivers & sensors
  denied (they validate receipts and refuse invalid ones; they never write
  findings).
- **C2 — Resolve a `low` report-note without a re-review.** Entry point: the
  stage author's repair pass; the machine enforces validity (a PASS with open
  `low` rows stands). Roles: author turn allowed · reviewer turn denied (a
  reviewer re-verifies, never resolves) · human owner denied · executor turn
  denied · drivers & sensors allowed as validators only (the validator accepts
  what the machine rule accepts — it never authors resolutions).
- **C3 — Run a wording-only repair batch without the full snapshot re-review.**
  Entry point: the repair turn records the judgment half and rotates the
  revision; `verify` computes the machine half. Roles: author turn allowed ·
  drivers & sensors allowed as validators (they compute and record the machine
  half; the route is refused when the determination record or rotation is
  missing) · reviewer turn denied (nothing to re-review on that route; the
  next material change re-opens review) · human owner denied · executor turn
  denied.
- **C4 — Start a third consecutive unconverged repair/re-review cycle.** Entry
  point: explicit user instruction after the orchestrator's refusal. Roles:
  human owner allowed (the only key) · drivers & sensors denied (they refuse,
  never authorize) · author turn denied without the instruction · reviewer
  turn denied without it · executor turn denied.
- **C5 — End an unconverged loop in `needs-design` / refusal + route.** Entry
  point: the reviewer's verdict set (spec stage) and the decider's stop +
  route (plan stage). Roles: reviewer turn allowed as issuer (spec-stage
  verdict) · drivers & sensors allowed as refusers (plan-stage stop naming the
  human route) · author turn denied as issuer (receives it and routes the
  human through `design-feature`/`plan-feature`) · human owner denied as
  issuer, allowed as decision-maker (decides through the routed skill) ·
  executor turn denied.

### Expectation sweep

What a competent workflow maintainer would assume ships with a
"planning-side materiality alignment carried in code" without being told.
19 candidate expectations, each resolved to exactly one resolution:

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | Immaterial findings stay visible in the ledger and the receipt, never silently dropped | in-scope | In scope 1 + 5 (persisted report-note; the findings array keeps `low` rows) |
| 2 | A real defect mislabeled `low` still blocks — the mislabel re-classifies at `medium` minimum | in-scope | In scope 5 (anti-deflation judgment stays prose) + In scope 1 |
| 3 | Deflating a severity to dodge a review is itself a review defect | in-scope | In scope 5 (anti-deflation sentence stays) |
| 4 | A `low` report-note alone never forces a repair batch or a re-review — the machine accepts a PASS that coexists with open `low` rows | in-scope | In scope 1 + AC1 |
| 5 | One material finding from one reviewer still keeps the findings set open (union, never majority) | in-scope | In scope 1 (PASS refused while any open/unverified `medium`+ row exists) |
| 6 | Dismissing any finding — including a report-note — still requires recorded counter-evidence | in-scope | Out of scope bullet 3 (validator rule unchanged) |
| 7 | The second cycle still prints `CONVERGENCE-ANOMALY` before any further edit | in-scope | In scope 5 (block byte-unchanged) + AC7 |
| 8 | The loop never ends silently — the cap ends it in a printed `needs-design` routed to the human (spec stage) or the orchestrator's refusal naming the human route (plan stage) | in-scope | In scope 3 + AC5 + AC7 |
| 9 | A third cycle remains possible behind an explicit user instruction (the cap is user-gated, not absolute) | in-scope | In scope 3 + In scope 5 (human-keyed sentence stays) |
| 10 | The wording-only determination is recorded even when the re-review is skipped — machine half and judgment half | in-scope | In scope 2 + AC4 |
| 11 | Every repair write rotates `artifactRevisionId` — the freshness predicate itself refuses an unrecorded rotation (without the recorded determination the wording-only branch never holds, so moved bound bytes fall through to `stale-source-revision`), including on the wording-only route | in-scope | In scope 2 + AC4 |
| 12 | Review verdicts keep binding to exact snapshots with digest + artifact revision (receipt shape otherwise unchanged) | in-scope | Out of scope bullet 3 + AC9 |
| 13 | Code-side review/fold behavior is untouched by this feature | out-of-scope | Out of scope bullet 2 |
| 14 | Severity/verdict/code values stay unchanged — additions only where this SPEC names them (`reproducer` field, cap-refusal outcome) | out-of-scope | Out of scope bullet 1 + AC9 |
| 15 | Existing `low` rows in already-persisted planning ledgers are not retroactively reclassified | out-of-scope | Out of scope bullet 4 |
| 16 | A reviewer can still escalate a taste-level claim to material when a rule is actually violated (the floor works in both directions) | in-scope | In scope 1 (the machine line is a floor, not a ceiling) |
| 17 | The unit's PR diff necessarily carries the unit's own planning records, the roadmap row update, and session-log appends — the scope guard accepts those workflow-mutated records | in-scope | In scope (workflow-mutated group) + AC13 |
| 18 | If the implementation changes what a PASS means (policy version bump), earlier receipts answer `stale-policy` and re-review at their next cycle — named, bounded, deliberate | in-scope | Compatibility boundary (Engineering half, re-cut) + AC9 |
| 19 | Plans carry the loop rules through machine-checkable done-whens (run-and-paste verify exit codes), never prose recitation — phase-lint governs the plan layer | in-scope | In scope 4 + AC6 |

### Acceptance criteria

Command-checkable at the PR head unless labelled `read-verified`.

- **AC1** (command + `read-verified`): the machine materiality predicate is
  `medium`+ — `grep -n 'severity !== "info"'
  packages/agentic-workflow-schema/src/pre-execution.ts` exits non-zero, and
  `cd packages/agentic-workflow-schema && bun run test` passes with vectors
  proving: a PASS receipt carrying an open/unverified `low` row validates, and
  the same receipt with an open/unverified `medium` row is refused
  (`verdict-mismatch`) (vector walk `read-verified`). Restates: `low` =
  report-note (persisted, visible, non-blocking, never a re-review trigger by
  itself); material = `medium`+.
- **AC2** (command): the schema's own prose matches the predicate —
  `grep -rn "the only immaterial" packages/agentic-workflow-schema/src/` exits
  non-zero, and the finding-record severity description states the new line
  (material = `medium`+; `low` is a report-note) via two fragments that exist
  only in that rewritten description: `grep -nE 'material = .medium'
  packages/agentic-workflow-schema/src/pre-execution-contract.ts` exits zero
  and `grep -n "report-note"
  packages/agentic-workflow-schema/src/pre-execution-contract.ts` exits zero
  (the bare word `medium` matches the severity enum literal at `:103` and
  proves nothing; neither new fragment can match it — both exit non-zero at
  branch head `bccc95fd`, so the criterion discriminates the rewrite).
- **AC3** (command): the finding record carries the bounded `reproducer` —
  `grep -n "reproducer"
  packages/agentic-workflow-schema/src/pre-execution-contract.ts` exits zero,
  the bound is declared on the field entry — `grep -A8 'key: "reproducer"'
  packages/agentic-workflow-schema/src/pre-execution-contract.ts | grep -c
  "maxLength"` returns ≥ 1 (`VerificationFieldSpec.maxLength` is optional at
  `verification-contract.ts:51`, so a bound-less `reproducer` declaration
  fails this anchor; every anchor here exits non-zero / 0 at branch head
  `6f1d024e`, so the criterion discriminates the implementation), and a suite
  vector exercises the field — `grep -rln "reproducer"
  packages/agentic-workflow-schema/test/` exits zero (no such hit exists
  today); the suite proves back-compatibility (a receipt whose findings carry
  no `reproducer` still validates) and the bound (a `reproducer` longer than
  the field's declared `maxLength` is refused); the receipt contract id is
  unchanged (`grep -c "agentic-workflow/pre-execution-review-receipt@1"
  packages/agentic-workflow-schema/src/pre-execution-contract.ts` ≥ 1).
- **AC4** (command + `read-verified`): the wording-only route is
  machine-recorded — `bun test scripts/pre-execution-sensor.test.mjs
  scripts/pre-execution-attribution.test.mjs` passes with `wording-only`
  vectors for both outcomes (`grep -rn "wording-only"
  scripts/pre-execution-sensor.test.mjs
  scripts/pre-execution-attribution.test.mjs` exits zero): revision rotated +
  determination recorded + no material movement → verify stays current without
  a new review receipt; material byte movement yields a non-fresh answer (never
  `fresh` — for moved bound bytes the fall-through answers
  `stale-source-revision`, exit 4, the code the frozen `ACCEPTANCE.md` AC4 and
  Design E6 record); a rotation without the recorded determination is refused (the
  record and the rotation are not skippable). Vector semantics walked at the
  PR head (`read-verified`).
- **AC5** (command): the orchestrator refuses to advance past the cap —
  `cd packages/agentic-workflow-schema && bun run test` passes with a
  transition-decider refusal vector named for this rule (`grep -rln
  "review-loop-cap" packages/agentic-workflow-schema/test/` exits zero)
  proving: after two consecutive unconverged review→repair→re-review cycles, a
  decision to invoke `review-spec`/`review-plan` again is refused (stop, human
  route named); a PASS resets the count; `needs-design` routes to
  `design-feature` (table rows otherwise unchanged).
- **AC6** (command + `read-verified`): the plan layer is lint-governed —
  `bun scripts/phase-lint.mjs
  docs/features/31-planning-review-materiality/PLAN.md` exits 0 with PASS
  verdicts at the PR head, and the re-cut plan's loop phases verify through
  run-and-paste `pre-execution-snapshot.mjs verify` exit codes (machine
  done-whens, not prose recitation) (`read-verified` against the re-cut plan).
- **AC7** (command + `read-verified`): prose shrinks to the non-computable
  remainder — the machine-owned sentences leave **every** declared surface:
  `grep -rn "More cycles stay allowed" skills/` exits non-zero;
  `grep -n "no cycle cap converts"
  skills/design-feature/references/REPAIR.md` exits non-zero (§4's second
  unbounded-cycle sentence sits wholly on `:71` and is unique in the file, so
  the pattern matches while the sentence stands and disappears with it);
  `grep -n "no cap converts a verdict into a"
  skills/pre-execution-review/references/POLICY.md` exits non-zero (the §4
  sentence is line-wrapped across `:83-84`, so the pattern is its
  single-line fragment — it matches while the sentence stands and disappears
  with it);
  `grep -n "no cycle cap or anomaly rule"
  skills/pre-execution-review/references/POLICY.md` exits non-zero (§4's
  third unbounded-cycle sentence — "… produces a new snapshot by design, so
  no cycle cap or anomaly rule may block or end it." — wraps across
  `:81-82`; the pattern is its single second line, unique in the file, so it
  matches while the sentence stands and disappears with it — the same
  line-wrap discrimination the other §4 greps use);
  `grep -n "cycle is allowed when correctness needs it"
  skills/pre-execution-review/references/POLICY.md` exits non-zero (the
  "Entering a **second** cycle is allowed" sentence wraps across `:60-61`;
  the fragment is its second line, so it discriminates the same way);
  `grep -n "re-review of the resulting snapshot"
  skills/pre-execution-review/references/POLICY.md` exits non-zero (§3's
  re-review-for-every-batch mandate — "… before a single re-review of the
  resulting snapshot." — wraps across `:41-42`; the fragment is its single
  second line, unique in the file, so it matches while the sentence stands
  and disappears with it — the same line-wrap discrimination the §4 greps
  use, and a full-phrase grep over the wrap would false-pass exactly as the
  finding warns);
  `grep -rn "Material = anything above"
  skills/review-spec/references/CHECKS.md
  skills/review-plan/references/CHECKS.md` exits non-zero (the materiality
  definition leaves both CHECKS files);
  `grep -rnE "re-review of the new snapshot|re-reviews the new"
  skills/review-spec/references/OUTPUT.md
  skills/review-plan/references/OUTPUT.md` exits non-zero (the
  re-review-for-every-batch mandate leaves both verdict-route tables and both
  closing hand-off blocks);
  `grep -n "only immaterial"
  skills/pre-execution-review/references/LEDGERS.md` exits non-zero ("`info`
  is the only immaterial one" leaves §3); the
  remainder stays: `grep -n "third cycle never"
  skills/pre-execution-review/references/POLICY.md` exits zero,
  `grep -niE "report-note"
  skills/pre-execution-review/references/LEDGERS.md` exits zero,
  `grep -rn "medium\` minimum" skills/pre-execution-review/references/
  skills/review-spec/ skills/review-plan/` exits zero (anti-deflation), and
  the `CONVERGENCE-ANOMALY` block plus the receipt-literal lines are
  byte-unchanged (`read-verified` against the diff hunks).
- **AC8** (command + `read-verified`): the discipline pins keep the machine
  rule honest — `bun test scripts/review-loop-discipline.test.mjs` passes at
  the PR head, the suite reads the code carriers (`grep -n
  "packages/agentic-workflow-schema" scripts/review-loop-discipline.test.mjs`
  exits zero), and `git diff main -- scripts/review-loop-discipline.test.mjs`
  removes no existing assertion (additions or equal-strength rewrites only)
  (`read-verified`).
- **AC9** (command + `read-verified`): additive schema release —
  `cd packages/agentic-workflow-schema && bun run gate:pre-execution` passes
  at the PR head (suite + projection drift checks + package check + docs
  test); the package `version:` is bumped (minor per the #176 freeze) with a
  CHANGELOG row; the schema diffs remove no enum value and no contract id
  (`read-verified` walk of the vocabulary diffs).
- **AC10** (command): the repo gate pack is green — `bun test
  scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs
  scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs
  scripts/workflow-status-pre-execution.test.mjs && bun
  scripts/check-skill-context.mjs` exits 0 at the PR head (budgets updated for
  the shrink if it moves sizes).
- **AC11** (command): mirror parity — `cd packages/pi-agentic-workflow && bun
  run bundle:skills && bun run test` passes (the bundler script lives in the
  package; this repository has no root `package.json`).
- **AC12** (command): `grep -n "2603.00539" README.md` exits zero at the PR
  head (References append, in the implementation PR — never before).
- **AC13** (command + `read-verified`): at the PR head, every path in
  `git diff main --name-only` belongs to one of the three declared groups
  (code carriers; prose-shrink + derived surfaces; workflow-mutated records)
  and no path outside them — mechanical anchor: `git diff main --name-only -- .
  ':(exclude)docs/features/31-planning-review-materiality'
  ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md'` lists only
  paths of the first two groups; the schema vocabulary diffs remove no value
  (`read-verified`).
- **AC14** (command + `read-verified`): the four touched skills are bumped and
  their release surfaces move in the same PR — `git diff main --
  skills/pre-execution-review/SKILL.md skills/review-spec/SKILL.md
  skills/review-plan/SKILL.md skills/design-feature/SKILL.md | grep -cE
  '^[+-]version: '` returns ≥ 8 (one removed + one added `version:` line per
  touched skill; a skill whose `version:` did not move contributes no such
  hunk — each SKILL.md carries nothing but the `version:` change, per
  `bump-skill`'s guardrail), and the walk verifies: each old→new pair is a
  semver-minor increment (minor per the #176 freeze — no major);
  `CHANGELOG.md` gains one per-skill row per bumped skill (newest first — the
  `normative-drift` version-tables check in AC10's pack recomputes those
  tables against the frontmatter `version:` lines, so a moved version without
  its row fails AC10); and the README `## The skills` cells for the four
  touched skills are accurate post-shrink (`bump-skill`'s
  update-not-rewrite surface — `pre-execution-review` is narrative-only in
  README) (`read-verified`).

### Tooling

- No external skill or MCP dependency — this feature is authored and executed
  with the repository's own workflow skills.
- The code carrier is exercised locally: the schema package gate
  (`cd packages/agentic-workflow-schema && bun run gate:pre-execution`), the
  snapshot CLI (`bun scripts/pre-execution-snapshot.mjs build|verify …`), the
  discipline pins (`bun test scripts/review-loop-discipline.test.mjs`), and the
  linter (`bun scripts/phase-lint.mjs <plan-path>`) — bun first, node fallback
  per the runtime convention.
- `bump-skill` (repository-internal, `user-invocable: false`) runs at execution
  for the skill version bumps; the bundler runs from the package that owns it —
  `cd packages/pi-agentic-workflow && bun run bundle:skills`.

### Product decisions

Recorded in full (with authority and rationale) in
`docs/features/31-planning-review-materiality/decisions.md`; one-line summary:

- **D-31-1** planning-side `low` rows **persist** as report-notes (the code
  side's `low` is never persisted) — the planning ledger is the prose-review
  audit trail; hiding rows there would break the no-silent-dismissal contract.
- **D-31-2** the cap terminates in the **existing** `needs-design` verdict —
  no new terminal label, no new grammar; mirrors `review-change`'s user-gated
  third-cycle rule (stage-scoped by D-31-8).
- **D-31-3** the wording-only route skips only the re-review act — the
  determination record and the `artifactRevisionId` rotation are not skippable.
- **D-31-4** one materiality line for both stages (spec + plan): material =
  `medium`+; no stage-specific thresholds.
- **D-31-5** REPOSITORY_STATE AD-008 ("never cycle-count-bound") is reconciled,
  not contradicted: the cap routes to a human decision instead of qualifying by
  cycle count; if `review-spec` reads a contradiction,
  `resolve-repository-state` owns the wording amendment at execution time.
- **D-31-6** (owner ruling 2026-09-17) the predicate, the cap and the
  wording-only route are implemented **in code** — the finding record's
  `class`/`severity`/`reproducer`, verify's exit code + closed reason codes,
  the orchestrator's cap refusal, phase-lint; prose shrinks to what is not
  computable; the `31-plan-1/2` plan set is superseded, never repaired.
- **D-31-7** the cap counts **consecutive unconverged** review→repair→re-review
  cycles (FAIL-verdict receipts since the last PASS verdict for the stage) and
  a PASS resets it — mirroring `review-change`'s loop; the ruling-authorized
  re-review after this carrier amendment is cycle 1, never a third cycle.
- **D-31-8** the cap's unconverged exit is stage-scoped to the machine map:
  `needs-design` where the verdict vocabulary sanctions it (spec stage), the
  refusal + `design-feature` routing at the plan stage (fix/162 narrowed
  plan-stage `needs-design`; the flat verdict vocabulary keeps the token).

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
- [x] The Out-of-scope section has ≥ 1 concrete bullet — 7 bullets.
- [x] Every Capability closure row is filled or an explicit `n/a` with reason —
      zero blank rows (E1–E3 × CRUD/transitions; 12 derived subsystems; 5
      capabilities × 5 roles).
- [x] Integration closure has one row per subsystem of the derived inventory
      (recorded above; `docs/CAPABILITIES.md` absent as a live file) — zero
      subsystems skipped.
- [x] Every capability's role matrix lists EVERY derived role with an explicit
      `allowed`/`denied` — 5 roles × 5 capabilities, none unlisted.
- [x] The Expectation sweep has 19 resolved rows (≥ 10 for M); every row
      resolves to exactly one of `in-scope`, `out-of-scope`, or `deferred`
      with a pointer — zero unresolved rows.
- [x] Every In-scope bullet maps to ≥ 1 acceptance criterion — explicit
      AC pointers on each item and group.
- [x] Every acceptance criterion is a runnable command OR labelled
      `read-verified` — AC2–AC3, AC5, AC10–AC12 pure commands; AC1, AC4,
      AC6–AC9, AC13–AC14 command + `read-verified` where judgement-only.
- [x] `### Deferred decisions` exists and reads `none`.

## Design status

`designed` — user-commissioned Product-half patch **`31-spec-13`** (2026-09-18)
applied: the repair batch for `spec-review-31-12`'s open rows **N31-016**
(`medium`, `product`) + **N31-017** (`low`, report-note) — In scope item 2 and
Capability closure E2's state transitions now name `stale-source-revision` (the
code the machine answers for moved bound bytes, matching AC4, the frozen
`ACCEPTANCE.md` AC4 and Design E6) instead of the impossible
`stale-artifact-content`, and Expectation sweep row 11 drops the wrong
`stale-artifact-revision` name for the same no-determination fall-through;
`progress.md` records the readiness block for this revision (the record N31-017
found missing for `31-spec-12`). Nothing else in the Product half moved.
Capability closure group: complete (zero blank rows), Spec-lint product boxes
all PASS, readiness preflight `READY-FOR-REVIEW` at artifact revision
**`31-spec-13`** (see `## Amendments`). Earlier state: `31-spec-12`
(2026-09-18) — user-commissioned Product-half patch applied: review-change
finding **F3** routed through the product route — AC4's
fall-through parenthetical now names `stale-source-revision` (the code the
machine answers for moved bound bytes, matching the frozen `ACCEPTANCE.md` AC4
and Design E6) instead of the impossible `stale-artifact-content`; nothing else
in the Product half moved. Capability closure group: complete (zero blank rows),
Spec-lint product boxes all PASS (readiness block for that revision was found
missing by `spec-review-31-12` N31-017 and is supplied by this batch's
`31-spec-13` record). Earlier state:
`31-spec-10` — user-commissioned Product-half patch for `spec-review-31-10`'s
open row **N31-015** applied (one owner-instructed edit: AC13's declared
**code-carrier** group additionally enumerates
`scripts/pre-execution-attribution.test.mjs` and
`scripts/pre-execution-sensor.test.mjs` — the two suites AC4 requires to carry
the `wording-only` vectors and `PLAN.md` P3 extends, so the frozen scope walk
stops reporting the plan's own designed edits as violations; nothing else in the
Product half moved). Capability closure group: complete (zero blank rows),
Spec-lint product boxes all PASS, readiness preflight `READY-FOR-REVIEW` at
artifact revision **`31-spec-10`** (2026-09-17 — see `## Amendments`). Each of
these writes moves the Product half's bound bytes, so the prior receipt goes
stale by design: the next `review-spec` run delta-reviews the patched half in a
fresh context, and `plan-feature` re-cuts the plan set only on a current
`SPEC-REVIEW-PASS` receipt.
---

## Engineering half

Written by `plan-feature-scaffold` at artifact revision **`31-plan-3`** (the
re-cut the Product carrier amendment `31-spec-3`/D-31-6 and the Product half's own
`## Design status` require), re-written by `plan-feature` at **`31-plan-4`** — the
repair batch for `plan-review-31-3`'s five rows (P31-01…P31-05) — re-derived
at **`31-plan-5`** after the owner-commissioned Product patches `31-spec-9` and
`31-spec-10` widened AC13's declared code-carrier group, and repaired at
**`31-plan-6`** for `plan-review-31-4`'s five rows (P31-07…P31-11). The plan
descends from the current Product receipt `spec-review-31-11` @ snapshot
`dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e`: the
`spec-product-v1` projection digest (`e9ce9abf…`, 46362 bytes) and the three
context digests recompute byte-identical from the bytes on disk, while `SPEC.md`'s
whole-file revision has since moved with this half — the known
`stale-source-revision` false signal PE-003 records, which L1 resolves on the
projection, never on the whole-file revision. Repair record: `progress.md`;
engineering decisions: `decisions.md` (E-D31-8…E-D31-14 for the carrier move,
E-D31-15…E-D31-19 for the `31-plan-4` batch, E-D31-20…E-D31-21 for the
re-derivation, E-D31-22…E-D31-25 for the `31-plan-6` repair batch); plan-stage
finding rows R31-01/R31-02/R31-03, P31-01…P31-06 and P31-07…P31-11 resolved in
`planning-findings.md`; full phase detail: `PLAN.md` and `TASKS.md`.

### Technical goals

- **One machine materiality floor.** The finding record carries the predicate:
  material = `medium`+; `low` is a report-note (persisted, visible,
  non-blocking, resolvable by the stage author without a re-review), and a PASS
  may coexist with open/unverified `low` rows while an open/unverified `medium`+
  row still refuses it.
- **A machine-checkable reproducer per finding.** The finding record gains a
  bounded `reproducer`, so a row states how to re-demonstrate its claim instead
  of relying on prose.
- **Structural loop termination in the orchestrator.** After two consecutive
  unconverged review→repair→re-review cycles the pure transition decider refuses
  a third invocation of `review-spec`/`review-plan` with a named reason code and
  the human route; a PASS resets the count (D-31-7).
- **A recorded wording-only route.** `verify` distinguishes a wording-only
  movement — revision rotated, determination recorded in the unit's `progress.md`
  (an unbound record home, so the recorded revision survives its own write),
  acceptance fingerprint and bound authorities unmoved — from material movement
  (`stale-artifact-content`); neither the determination nor the rotation is
  skippable (D-31-3).
- **Prose shrinks to the non-computable remainder** and the discipline pins
  re-aim at the code carriers, never weakened.

### Architecture impact

Layer assignment (the phase-lint target table): the schema package and the
deterministic scripts are `config/infra`; the skill references are `docs`; the
close-out is `hardening`. No new layer, no new port, no new dependency — the
schema package stays dependency-free and the scripts stay dependency-free beyond
the built schema package.

Affected surfaces (verified at branch head `4b7cad56`; evidence rows
PE-001…PE-037 in `planning-evidence.md`):

- `packages/agentic-workflow-schema/src/pre-execution-contract.ts:101` (the
  severity vocabulary comment), `:455-500` (`FINDING_SPEC`), `:459` (the
  `severity` field description), `:145-170` (`PRE_EXECUTION_LIMITS`),
  `:127-136` (`VERDICTS_BY_STAGE`).
- `packages/agentic-workflow-schema/src/pre-execution.ts:159-171`
  (`PRE_EXECUTION_FRESHNESS_CODES`, ten closed codes), `:998` (the receipt
  doc comment), `:1059` (the materiality predicate), `:1011` (the binding
  entry point).
- `packages/agentic-workflow-schema/src/index.ts:719-727`
  (`WORKFLOW_DECISION_STOP_CODES`), `:746-756` (`WorkflowDecisionInput`),
  `:885-925` (the `review-spec`/`review-plan` transition rows), `:1069`
  (`decideWorkflowAction`).
- `scripts/pre-execution-contract.mjs:33-75` (the stage artifact tables and the
  three bound context authorities), `:120-160` (`parseReceipts`), plus this
  unit's additions: `parseWordingOnlyDeterminations` and the pure
  `deriveReviewLoopCycles` helper.
- `scripts/pre-execution-snapshot.mjs:331-420` (`attributeFreshness`),
  `:424-490` (the `verify` action and its exit codes 0/1/3/4).
- `scripts/workflow-status.mjs` (the sensor that derives the count through
  `pre-execution-contract.mjs` and projects `detail.review_loop_cycles` into the
  envelope's free-form `detail` bag — never referencing `decideWorkflowAction`,
  feature 38 A:12 — the projection and the absence are both pinned by the re-aimed
  `scripts/review-loop-discipline.test.mjs` block, which rides the AC10 pack).
- `docs/features/31-planning-review-materiality/progress.md` (the unbound record
  home for the wording-only determination block — the unit's own record, never a
  bound artifact of either stage's snapshot).
- `scripts/review-loop-discipline.test.mjs:20-28,134` (the existing reads the
  re-aimed planning pins extend).
- Prose surfaces: `skills/pre-execution-review/references/LEDGERS.md:93`;
  `skills/review-spec/references/CHECKS.md:104` and
  `skills/review-plan/references/CHECKS.md:105`;
  `skills/pre-execution-review/references/POLICY.md:36-52,53-85`;
  `skills/review-spec/references/OUTPUT.md:109,153` and
  `skills/review-plan/references/OUTPUT.md:118,160`;
  `skills/design-feature/references/REPAIR.md:64-65,71`.

Invariants the implementation must hold:

- **AD-008 preserved** (`REPOSITORY_STATE.md`): correctness stays evidence- and
  obligation-bound, never cycle-count-bound. The cap stops the loop and routes a
  human decision; it never uses a cycle count to establish correctness, never
  auto-continues, and never waives findings (D-31-5; obligation O15). Recorded
  classification: `preserves` — no `resolve-repository-state` amendment is
  triggered unless a reviewer reads an actual contradiction (D-31-5's
  conditional trigger).
- **Byte-stability constraints**: the `CONVERGENCE-ANOMALY` block, the
  receipt-literal lines in both `OUTPUT.md` files (the
  `agentic-workflow/pre-execution-review-receipt@1` rendered fact), the LEDGERS
  row shape/writer map/ownership block, both CHECKS severity vocabulary lists,
  every schema enum value, the receipt contract id and the ten freshness codes
  stay byte-identical.
- **No new declared machine surface.** The determination record reuses the
  repository's existing record-block family (`## <Name> v1` plus `- Field: value`
  lines — the shape the pre-execution receipts already use) inside the unit's own
  evidence home; it introduces no `block:`/`fenced:`/`schema-export:` grammar, so
  `CLAUDE.md`'s `normative-surfaces@1` and `rendered-facts@1` blocks are not
  edited and the `normative-drift` gate keeps its current scope. Precedent
  evidence: PE-011 (the receipt block itself is not a `normative-surfaces@1` row).
- **No new freshness code and no new CLI flag**: `verify` keeps the ten closed
  codes and the 0/1/3/4 exit codes; the wording-only answer is `fresh` with the
  determination named.
- **Formal invariant classification**: `n/a: no project invariants declared`
  (NRS F010 — no `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists).

```text
Preflight: NRS consumed · invariant classification: n/a: no project invariants declared (F010) — AD-008 preserved (D-31-5)
```

### Design

**E1 — The finding record carries the predicate (contract shape).**
`FINDING_SPEC` in `pre-execution-contract.ts` gains one optional field:
`{ key: "reproducer", type: "string", minLength: 1, maxLength:
PRE_EXECUTION_LIMITS.reproducerChars, nulFree: true }`, mirrored as
`readonly reproducer?: string` on `PreExecutionReviewFindingV1`. A new published
limit `reproducerChars: 1024` sits in `PRE_EXECUTION_LIMITS` so the bound is
published rather than spelled in the field. Absent stays valid: a receipt whose
findings carry no `reproducer` validates exactly as before (AC3's
back-compatibility vector), and a value beyond the bound is refused by the same
structural walk as every other over-length string.

**E2 — The materiality predicate is `medium`+ (runtime rule).** In
`pre-execution.ts` the expression `const material = finding.severity !== "info"`
becomes a closed membership test over the material severities (`medium`, `high`,
`critical`), and the doc comment at `:998` and the `severity` vocabulary comment
and field description at `pre-execution-contract.ts:101,:459` state the new line.
Consequences, all pinned by vectors: a PASS carrying an open/unverified `low` row
validates; the same PASS with an open/unverified `medium` row is refused
`verdict-mismatch`. The rule id `pass-requires-resolved-material-findings` and
its claim text are unchanged — only the predicate moves. `info` stays immaterial,
and no severity value is added, renamed or removed.

**E3 — The decider refuses past the cap.** `WorkflowDecisionInput` gains an
optional `reviewLoopCycles?: { spec?: number; plan?: number }`: the
consecutive-unconverged count per stage, derived from the persisted receipts and
recomputed on every run (D-31-7 — no store, no counter write). The counting rule
is frozen: `n` is the number of consecutive FAIL-verdict receipts for that stage
since its last PASS-verdict receipt, so a PASS resets `n` to 0 by construction.
`WORKFLOW_DECISION_STOP_CODES` gains exactly one value, `stop-review-loop-cap`,
and `decideWorkflowAction` answers, before the transition-table match, with
`{ kind: "stop", intent: "ask-human", targets: [<unit>], reasonCode:
"stop-review-loop-cap", detail: "third consecutive unconverged <spec|plan>
review→repair→re-review cycle refused — the human route is design-feature" }`
when the proposal is `review-spec`/`review-plan` and that stage's count reaches
two. The transition rows themselves are unchanged: the `review-spec` row already
allows `design-feature`, and the `needs-design` verdict keeps its spec-stage
`VERDICTS_BY_STAGE` membership (fix/162 narrowed plan-stage `needs-design`, and
this design does not re-widen it).

**E4 — The sensor derives the count and projects it; the decider stays
consumer-side.** `scripts/pre-execution-contract.mjs` gains one pure helper,
`deriveReviewLoopCycles(receipts)`, implementing the E3 rule over the receipt
rows the module already parses (consecutive FAIL verdicts per stage since that
stage's last PASS; a stage with no receipt reads `0`), so the CLI and the sensor
share one implementation. `scripts/workflow-status.mjs` imports that helper,
recomputes the count on every run, and projects it into the envelope's **existing
free-form `detail` bag** as `detail.review_loop_cycles = { spec, plan }` — no new
envelope field, no closed-set change, and **no reference to
`decideWorkflowAction`**, which stays consumer-side (feature 38 A:12:
`grep -c decideWorkflowAction scripts/workflow-status.mjs` → 0). The
consumer-side orchestrator builds `WorkflowDecisionInput` from that value and
gets the E3 refusal; a repository with no receipt for a stage reads `0`, so the
refusal is reachable only for a unit that really carries two consecutive
unconverged cycles. The wiring is proven two ways: the schema vectors (AC5) and
the re-aimed `scripts/review-loop-discipline.test.mjs` block — a code carrier
already inside AC10's pack — pinning the `detail.review_loop_cycles` projection
and `scripts/workflow-status.mjs`'s continuing absence of `decideWorkflowAction`,
so a future change that puts the decider back into the sensor fails a frozen
validator instead of passing silently.

**E5 — The wording-only determination record (shape and home).** The repair turn
records, in the unit's evidence home, a block of the existing record family:

```text
## Wording-only determination v1 — <spec|plan>

- Determination: <id> · Unit: <unitId> · Artifact revision: <artifactRevisionId>
- Acceptance fingerprint: <64-hex blob of the unit's ACCEPTANCE.md> · Recorded: <YYYY-MM-DD>
- Intent and authority unchanged: <one line>
```

Home: the unit's `progress.md` — a record block in the unit's own progress
ledger, beside the review receipts and the `## Dependency receipt v1` block the
repository already writes there. The home is load-bearing, not stylistic:
`progress.md` is **not** a bound artifact of either stage's snapshot
(`STAGE_ARTIFACTS.spec` binds only the `spec-product-v1` projection;
`STAGE_ARTIFACTS.plan` binds `SPEC.md`, `ACCEPTANCE.md`, `planning-evidence.md`,
`planning-obligations.md`, `PLAN.md`, `TASKS.md`, `testing.md`, `decisions.md`
and `architecture-notes.md`), so appending the record does **not** rotate the
`artifactRevisionId` it records — the same property that lets a receipt survive
its own write. Recording it in `planning-evidence.md`, the SPEC's
`### Planning evidence` section or `decisions.md` would rotate that revision on
write and make E6's identity check unsatisfiable at the plan stage. Precedent for
an author-written record block in this home: `## Dependency receipt v1`
(PE-026). Writer: the stage's author (`plan-feature`, `plan-fix`,
`design-feature`); no ownership row changes, because this is a block in an
existing unit record, not a new ledger column set. The judgment half ("intent and
authority unchanged") stays authored prose; the machine half is computed by
`verify`.

**E6 — `verify` distinguishes wording-only from material movement.**
`scripts/pre-execution-contract.mjs` gains one parser,
`parseWordingOnlyDeterminations(text)`, shared by the CLI and the sensor.
`attributeFreshness` gains exactly one branch, placed **after the `stale-context`
check and before the `stale-source-revision` check** — the only position from
which the answer it promises is reachable, because a wording-only movement moves
a bound artifact and therefore always rotates `sourceRevision`, and
`stale-source-revision` precedes `stale-artifact-content` in the comparator's
documented order. The branch leaves that documented order intact for every other
dimension and is consulted only when all four hold: git evidence names a moved
bound artifact; `changedContexts` is empty; a determination block records an
artifact revision equal to the snapshot's current `artifactRevisionId`; and that
block's recorded acceptance fingerprint equals `git hash-object
<unit>/ACCEPTANCE.md` on disk. All four → `fresh: true` with the determination id
named in `detail`. Any of them fails → **fall through unchanged** to the existing
precedence, which for moved bound bytes answers `stale-source-revision`; the
branch never rewrites a reason code on the no-determination path (the earlier P3
wording that named `stale-artifact-revision` here was wrong and is corrected). An
absent acceptance manifest fails closed: the fingerprint cannot match, so the
route is unavailable. `attributeFreshness` stays pure — the pre-parsed
determination and the observed acceptance fingerprint arrive as inputs
(`wordingOnly`), and the CLI does the file read — which is what keeps
`scripts/pre-execution-attribution.test.mjs`'s dimension-by-dimension agreement
with the schema comparator intact (it passes no `wordingOnly` and therefore sees
every existing answer unchanged). No new freshness code, no new flag, no new exit
code.

**E7 — Discipline pins re-aimed at the code.** `scripts/review-loop-discipline.test.mjs`
keeps every existing assertion and adds a planning-side pin block that reads the
code carriers instead of prose sentences: the `medium`+ predicate in
`packages/agentic-workflow-schema/src/pre-execution.ts`, the CLI's verify report
over a seeded fixture (the wording-only answer and the material-movement
refusal), and the decider's `stop-review-loop-cap` refusal. The suite therefore
still fails if the rules regress, while the prose shrink it used to police is now
validated by AC7's removal greps. Nothing is removed, and no assertion is
loosened (AC8's no-weakening walk). The same phase binds the sensor side: the
pin block also reads `scripts/workflow-status.mjs` and pins the
`detail.review_loop_cycles` projection plus that script's continuing absence of
`decideWorkflowAction` (feature 38 A:12), so the invariant cannot regress behind
a gate the workflow never runs.

**E8 — Prose shrink and authored remainder.** The computable sentences leave
eight prose surfaces: `LEDGERS.md` §3 ("`info` is the only immaterial one"),
both `CHECKS.md` files ("Material = anything above `info`"), `POLICY.md` §3 (the
every-batch re-review mandate) and §4 (the three unbounded-cycle sentences), both
`OUTPUT.md` files (the re-review-for-every-batch sentences in the verdict tables
and the closing blocks), and `REPAIR.md` §4 (both unbounded-cycle sentences). The
remainder is authored, not preserved: the anti-deflation judgment (`medium`
minimum; deflating a severity to dodge a review is itself a review defect), the
report-note persistence contract with the planning materiality line, the
human-keyed third-cycle rule, and the wording-only determination shape. Only the
`CONVERGENCE-ANOMALY` block and the receipt-literal lines are preserved
byte-unchanged.

**E9 — Release records.** The schema package bumps 4.2.0 → 4.3.0 (additive
minor) in the `config/infra` P1, and its `CHANGELOG.md` companion-table row lands
in the `docs` P4 with the four skill release records — never in P1, whose
`config/infra` layer cannot carry a `docs` target (phase-lint box 2) — so
`rendered-facts@1`, which recomputes that table against
`package.json`, stays red across the declared P1→P4 window (`known-issues.md` §12,
E-D31-18/E-D31-21), P1's own done-when stays package-local, and P4's done-when
closes the window; the two version pins the bump reddens
(`test/release-contract.test.mjs`, `test/verification-gates.test.mjs`) move in the
same commit as the bump, and the new `reproducerChars` limit is published in the
package README's `### Published limits` block in P1, because both are the bump's
own `config/infra` surfaces; the four touched skills take minor bumps through
`bump-skill` (one bump per skill per PR — E-D31-1) with their `CHANGELOG.md` rows
and README cells; the Pi mirror is re-bundled from the
package that owns the bundler after the last `skills/` edit; and the issue's
bibliography obligation appends the Jin & Chen entry under a bottom `## References`
section of `README.md` (AC12) — in the implementation PR, never before this
scaffold.

### Planning evidence

see planning-evidence.md (M/L unit — the frozen table lives in
`planning-evidence.md`; rows PE-001…PE-037, all `current`, `proven` or
`decision`).

### Obligations

see planning-obligations.md (M/L unit — O1…O14 mirror AC1…AC14 and O15 carries
the AD-008 invariant; every row starts `planned`; no row is `deferred`).

### Decisions to confirm

Engineering decisions are recorded with rationale in `decisions.md`. `E-D31-1`
(one version bump per skill per PR), `E-D31-2` (no `docs/workflow/` tutorial
edit), `E-D31-3` (AD-008 classified `preserves`), `E-D31-4` (the pins live in the
existing discipline suite as additive rows) and `E-D31-6` (the bundler is always
spelled from the package that owns it) stay in force. `E-D31-5` (a
`PLANNING_PIN_TABLE` with a prose row floor and a discrimination leg) is
**superseded** with the `31-plan-2` set: the pins now read code carriers, so a
discrimination leg over superseded prose sentences has nothing to discriminate.
`E-D31-7` (the diff-scope walk names the declared derived surfaces) stays and is
re-aimed at AC13's three declared groups. This repair batch adds `E-D31-15`
(the determination lives in the unbound `progress.md`), `E-D31-16` (the branch is
pure and sits before `stale-source-revision`), `E-D31-17` (the count is derived by
one shared helper and projected into the envelope's `detail` bag, keeping feature
38's A:12) and `E-D31-18` (the schema package's CHANGELOG row lands in P4, with
the `normative-drift` window declared) — see `decisions.md`. This repair batch adds
`E-D31-22` (the bump's own `config/infra` surfaces — the two version pins and the
package README's published-limit block — live in P1, the phase whose done-when runs
them), `E-D31-23` (`E9` states the P4 CHANGELOG allocation, the single reading the
P31-04 resolution already chose), `E-D31-24` (the two P4 task wordings name the pin
they must keep and stop reciting the literal AC7 deletes) and `E-D31-25` (P1's task
budget is at the canonical ceiling, so a further P1 requirement splits the phase).
New in this re-cut:

- **E-D31-8** — the materiality predicate is a closed membership test over the
  material severities rather than a negated `info` comparison, so the material
  set is spelled once and a future severity cannot silently become material.
- **E-D31-9** — `reproducer` is optional and bounded (1024 characters,
  published in `PRE_EXECUTION_LIMITS`); a receipt without it stays valid.
- **E-D31-10** — the cap-refusal outcome is the single new stop code
  `stop-review-loop-cap`, with `intent: "ask-human"` and the human route named
  in `detail`; the count enters through the decider's input, derived per run.
- **E-D31-11** — the determination record reuses the existing record-block family
  in the unit's evidence home; no new declared machine grammar and no `CLAUDE.md`
  edit.
- **E-D31-12** — the wording-only route adds no freshness code, no CLI flag and
  no exit code: the answer is `fresh` with the determination named, and every
  other movement keeps `stale-artifact-content`.
- **E-D31-13** — the acceptance manifest is re-frozen at this revision (the
  carrier moved every code-anchored validator); the superseded manifest blob is
  recorded in `PLAN.md` for traceability.
- **E-D31-14** — the four skill bumps and the schema package bump land once each
  in this PR, and the Pi mirror is re-bundled in the hardening phase after the
  last skill edit.

### Testing requirements

The test layer is the schema package's own suite plus the repository's
deterministic script suites — no new test framework, no runtime dependency
beyond the built schema package:

- **Schema package (primary)**: `cd packages/agentic-workflow-schema && bun run test`
  gains the materiality vectors (AC1), the `reproducer` bound and
  back-compatibility vectors (AC3) and the cap-refusal vectors (AC5), and holds
  the bumped version's two pins and the published-limits walk with the same exit
  (P31-07/P31-08); the gate `bun run gate:pre-execution` adds the projection drift
  checks, the package check and the docs test (AC9).
- **Snapshot machinery**: `bun test scripts/pre-execution-sensor.test.mjs
  scripts/pre-execution-attribution.test.mjs` gains the `wording-only` vectors
  for both outcomes plus the missing-record refusal (AC4), with the attribution
  suite proving the sensor answers what the contract comparator answers.
- **Discipline pins (re-aimed)**: `bun test scripts/review-loop-discipline.test.mjs`
  reads the code carriers and keeps every existing assertion (AC8).
- **Repo gate pack**: `bun test scripts/ledger-ownership.test.mjs
  scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs
  scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs
  && bun scripts/check-skill-context.mjs` (AC10) — the ledger truth classes, the
  normative surfaces (with the projection and A:12 pins riding the discipline
  suite), and the context budgets stay green.
- **Distribution parity**: `cd packages/pi-agentic-workflow && bun run
  bundle:skills && bun run test` (AC11) — the bundler lives in the package; this
  repository has no root `package.json`.
- **Read-verified walks** (judgement-only, recorded in the P5 phase entry):
  the additive-release vocabulary diff (AC9), the PR-diff scope walk against the
  three declared groups (AC13), the no-weakening discipline-suite diff (AC8), the
  POLICY/REPAIR hunk scope and the byte-unchanged `CONVERGENCE-ANOMALY` block
  (AC7), and the AC14 bump/CHANGELOG/README walk.

Full ladder and scenario inventory: `testing.md`.

### Dev scenarios

Failure modes seeded from the fixed category list; each reaches through an
**existing** mechanism (no new domain):

| Scenario | Reproduces | Mechanism it drives (phase · validator) |
|---|---|---|
| `loop:report-note-pass` (empty/zero state) | a PASS coexists with open `low` report-note rows — no repair batch, no re-review | the receipt validator's materiality predicate (P1 · `bun run test` in the schema package, AC1) |
| `loop:reproducer-bound` (invalid or oversized input) | a `reproducer` past its declared bound is refused while an absent one still validates | the structural walk over `FINDING_SPEC` (P1 · the package suite's bound and back-compatibility vectors, AC3) |
| `loop:deflation-guard` (invalid input) | a real defect mislabeled `low` re-classifies at `medium` minimum and blocks | the anti-deflation sentence in `LEDGERS.md`/both `CHECKS.md` (P4 · the AC7 kept-side `medium\` minimum` grep) |
| `loop:role-violation` (permission denied / wrong role) | an author turn filing findings against its own artifact, or a script writing a ledger row, stays denied | the role matrix C1–C5 plus the unchanged ledger-ownership block (P5 · `ledger-ownership` in the ladder, AC10) |
| `loop:cap-hit` (limit or threshold hit) | two consecutive unconverged cycles make the decider refuse a third invocation with `stop-review-loop-cap` and the human route; a PASS reset re-allows the next cycle | `decideWorkflowAction` over the derived receipt count (P2 · the package suite's `review-loop-cap` vectors, the sensor's `detail.review_loop_cycles` emission + A:12 pin, AC5 + AC10) |
| `loop:wording-only-skip` (concurrent/duplicate action) | a recorded wording-only determination keeps `verify` current while a missing determination refuses the same movement | the determination parser plus the `attributeFreshness` wording-only branch over the unbound `progress.md` record (P3 · the `wording-only` vectors, AC4) |
| `loop:dup-finding` (concurrent/duplicate action) | the same finding re-reported in a later cycle keeps its stable id and gains a second resolution row | `finding-id` stability in `LEDGERS.md` §3 (outside every edited hunk, P4 · the AC7 hunk walk) |
| `loop:pin-vacuous` (invalid input) | a pin that reads a superseded prose sentence instead of the code carrier leaves the suite green | the re-aimed pin block reading the schema predicate, the CLI report and the decider refusal (P3 · the discipline suite in the ladder, AC8) |
| outage/dependency failure — n/a | no runtime dependency exists; every validator is a local command over repository bytes | n/a: all checks run locally (bun first, node fallback) |
| data loss / mass change — n/a | the unit edits no stored data and no user record; the only durable writes are ledger appends and release records | n/a: no data store is touched |

### Phases

Full task detail: `TASKS.md`; the canonical phase list the linter reads is
`PLAN.md`. Phase order is the carrier's dependency order and matches the SPEC's
`Depends on:` closure (the hard dependency 29 is merged); the final phase is the
hardening close-out.

#### P1 — Schema finding-record materiality

Layer: config/infra. Done-when: `cd packages/agentic-workflow-schema && bun run
test && bun run check:pre-execution-schemas` → exit 0 with the materiality,
`reproducer`-bound and back-compatibility vectors green and zero projection
drift — the same suite holds the bumped version's two pins and the
published-limits walk. The schema package's `CHANGELOG.md` row cannot land here (a
`docs` target in a `config/infra` phase is forbidden by the phase contract), so
`normative-drift` stays red until the `docs` P4 closes the window declared in
`known-issues.md` §12. (AC1, AC2, AC3)

#### P2 — Transition-decider cap refusal

Layer: config/infra. Done-when: `cd packages/agentic-workflow-schema && bun run
test` → exit 0 with the cap vectors green, and `bun test
scripts/workflow-status-pre-execution.test.mjs` → exit 0 with the cap-refusal
emission case green (the projection and A:12 pins land in P3's discipline-suite
block). (AC5, O15)

#### P3 — Snapshot wording-only route

Layer: config/infra. Done-when: `bun test scripts/pre-execution-sensor.test.mjs
scripts/pre-execution-attribution.test.mjs
scripts/review-loop-discipline.test.mjs` → exit 0 with the wording-only vectors
and the re-aimed code-carrier pins green. (AC4, AC8)

#### P4 — Skill-reference prose shrink

Layer: docs. Done-when: `bun scripts/check-skill-context.mjs && grep -n "third
cycle never" skills/pre-execution-review/references/POLICY.md` → exit 0 with the
four skill minor bumps landed and the AC7 removal greps clean. (AC7, AC12, AC14)

#### P5 — Hardening & PR

Layer: hardening. Done-when: `bun test scripts/review-loop-discipline.test.mjs`
→ exit 0 at the terminal HEAD with the whole ladder green, parity green and the
PR URL printed. (AC6, AC9, AC10, AC11, AC13)

#### Phase-lint (owned by `skills/phase-contract/SKILL.md` — keep in sync with `docs/fix/_TEMPLATE/SPEC.md`)

Every implementation phase above passed the canonical eight-box phase-lint
before emission. The `### Phases` list above is the M/L breakdown the template
prescribes (its tasks live in `TASKS.md`), so the linter's input is the canonical
phase list in `PLAN.md`
(`bun scripts/phase-lint.mjs
docs/features/31-planning-review-materiality/PLAN.md`, node fallback — stdout
pasted verbatim at scaffold time and again in P5):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:8:schema-finding-record-materiality
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:8:transition-decider-cap-refusal
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:snapshot-wording-only-route
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skill-reference-prose-shrink
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: d71938984b6e87a81def926b394ffeed643eb71001df98a846ea7035391bf95c
```

The `31-plan-1`/`31-plan-2` fingerprints (`db27c41e…`, `5465f0aa…`) and the
`31-plan-3` aggregate (`7ae7a090…`) are dead with their superseded sets: the
carrier move, then this repair batch, re-cut every affected phase, and the
aggregate above is this set's fingerprint.

### Deploy & rollback

n/a — merging is enough. The schema package publishes as an additive minor
through its own workflow; the skills re-bundle with the PR (`bundle:skills` run
from the package root in P5) and the rules take effect at the next planning
review that runs the bumped skills. Rollback is reverting the PR: no persisted
data, no migration, and every vocabulary value the shipped contracts accept
stays accepted.

### Open questions / risks

- **Inherited, RESOLVED by this plan**: the Product half deferred the exact pin
  diff to the Engineering half — resolved as E7 (`decisions.md` E-D31-4/E-D31-12:
  pins read the code carriers, no prose row floor).
- **Inherited, RESOLVED by this plan**: R31-01 (the plan descending from a stale
  Product receipt) — the lineage was repaired by the `31-plan-3` re-cut
  (`spec-review-31-9` @ `e15374a3…`) and re-bound by the `31-plan-5`
  re-derivation to `spec-review-31-11` @ `dd09372a…`; R31-02 (a multi-phase
  obligation row) and R31-03 (the scope walk missing the unit's own records) —
  resolved by `planning-obligations.md`'s one-phase rows and AC13's declared
  workflow-mutated group.
- **Resolved by the `31-plan-4` repair batch (P31-01…P31-05) and the `31-plan-5`
  re-derivation (P31-06)**: the wording-only determination moved to the unbound
  `progress.md` home and its branch was placed before `stale-source-revision`
  (P31-01/P31-02); the cap count is derived by a pure helper and projected into
  the envelope's free-form `detail` bag with feature 38's A:12 pinned in the
  discipline suite (P31-03); the schema package's `CHANGELOG.md` row stays in the
  `docs` P4 — it cannot live in the `config/infra` P1 (`known-issues.md` §12,
  E-D31-18/E-D31-21); the evidence-row range in this half was corrected
  (P31-05); and P31-06 closed once the Product half enumerated the code carriers
  (`31-spec-9`/`31-spec-10`, `spec-review-31-11`).
- **Resolved by the `31-plan-6` repair batch (P31-07…P31-11)**: P1's own done-when
  is reachable again — the bump carries its two reddened version pins in the same
  commit (`test/release-contract.test.mjs`, `test/verification-gates.test.mjs`;
  P31-07) and the package README's `### Published limits` block publishes
  `reproducerChars 1024` in the same phase (P31-08); `E9` now states the `docs` P4
  CHANGELOG allocation P31-04's resolution chose, so the plan no longer reads its
  own release-record phase two ways (P31-09); and the two P4 wordings no longer
  collide with the frozen gates — the review-spec `CHECKS.md` rewrite names the
  sentence `scripts/pre-execution-quality.test.mjs` pins verbatim (P31-11), and the
  `POLICY.md` §3 rewrite no longer recites the literal AC7 deletes (P31-10).
  No criterion, validator or required outcome moved; the failure class P31-07/P31-08
  exposed is now a declared boundary (`known-issues.md` §13).
- **Risk — the wording-only branch could be read as an author-declared bypass.**
  Mitigated by construction: the branch requires the acceptance fingerprint and
  the bound authorities to be unmoved, the revision to have rotated, and the
  determination to be visible in the unit's frozen evidence, so an undeclared
  movement still answers `stale-artifact-content` (P3's vectors pin both
  outcomes).
- **Risk — a new stop code in the closed decider vocabulary.** Mitigated by
  addition only: `stop-review-loop-cap` is appended, every existing value and the
  transition rows are unchanged, and the vector suite asserts the untouched rows.
- **Risk — the four skill bumps could disturb the context budgets.** Mitigated
  by the shrink (the edits remove sentences) plus the P5 budget gate, which fails
  the PR if a ceiling is crossed.
- No open engineering question remains.

### Deliverables

- Filled Engineering half (this document) + the M/L artifact set: `PLAN.md`,
  `TASKS.md`, `ACCEPTANCE.md` (re-frozen, blob recorded in `PLAN.md`),
  `planning-evidence.md`, `planning-obligations.md`, `testing.md`,
  `known-issues.md`, `architecture-notes.md`, engineering decisions in
  `decisions.md`, resolved plan-stage findings in `planning-findings.md`.
- The implementation PR (opened by P5) containing: the schema package's finding
  record and materiality predicate, the decider's cap refusal and its sensor
  input, the CLI's wording-only route, the re-aimed discipline pins, the eight
  shrunk prose surfaces, the schema package's 4.3.0 bump and the four skill minor
  bumps with their CHANGELOG rows and README cells, the re-bundled Pi mirror, the
  bottom `## References` append in `README.md`, and `Closes #171`.

### Post-merge next feature

`32-review-consistency-pack` (#172) — next of the 2026-09 Phase-1 loop-policy
chain; it depends on 30 + 31 and reworks the same POLICY/CLASSIFY surfaces one
owner at a time. Rows 35/42 (and 46's coordination) chain after it per
`docs/features/ROADMAP.md`.

---

## Amendments

### `31-spec-13` (2026-09-18) — repair batch for `spec-review-31-12` (N31-016 + N31-017)

User-commissioned repair batch (2026-09-18), commissioned as "fix the surviving
wrong freshness codes: In scope 2 and E2 state transitions must say
`stale-source-revision` for moved bound bytes, Expectation row 11 must drop
`stale-artifact-revision`; record the `31-spec-12`-successor readiness block".
Trigger: `spec-review-31-12` returned `SPEC-REVIEW-FAIL` (cycle 1 of the window
`spec-review-31-11`'s PASS opened) with one material `product` row (N31-016)
and one `low` report-note (N31-017), repair owner `design-feature` (product
class). The F3 patch corrected AC4 but left the same wrong code names in two
more Product-half locations, making the half contradict itself; the
`31-spec-12` readiness block was never recorded in the unbound `progress.md`.
Per D-31-4 these `low` rows are recorded and visible; N31-017 is folded by the
same batch because the route names the record it owes.

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-016 | product · medium | In scope item 2 and E2's state transitions now name `stale-source-revision` (the code `attributeFreshness` answers for committed moved bound bytes, before the `stale-artifact-content` slot — `scripts/pre-execution-snapshot.mjs:400`), matching AC4, the frozen `ACCEPTANCE.md` AC4 and Design E6; sweep row 11 drops the wrong `stale-artifact-revision` name — the no-determination fall-through answers `stale-source-revision` for moved bound bytes, and `stale-artifact-revision` stays reserved for its comparator slot (a rotation with no bound byte moved). No criterion outcome moves; the half now states one code per event. Repair class: mechanical, intent-preserving. | In scope item 2; Capability closure E2 state transitions; Expectation sweep row 11 |
| N31-017 | product · low | The readiness block for the `31-spec-12` successor is recorded in `progress.md` at authoring time (the `READINESS — … spec READY-FOR-REVIEW` block for **`31-spec-13`**), restoring the per-revision record convention every earlier reviewed revision follows. | `progress.md` (unbound record home) |

Artifact revision rotates `31-spec-12` → **`31-spec-13`** for the touched
Product set (`SPEC.md`; `decisions.md` gains E-D31-29 with its evidence rows).
The frozen `ACCEPTANCE.md` stays untouched (blob `849af5ae…` recomputed intact —
no criterion, validator or required outcome moves). The current Product receipt
`spec-review-31-12` is superseded by design (bound Product bytes moved with no
wording-only determination — the movement is material): only a fresh
`/review-spec 31-planning-review-materiality` delta-reviews the patch and
restores currency.

### `31-spec-12` (2026-09-18) — user-commissioned Product-half patch routing review-change finding F3 through the product route

Trigger: the unit's `review-change` pass (head `ec04261d`, PR #243) returned
`REVIEW-FAIL` with five fix-now rows (`review-findings.md` F1–F5); F1/F2/F4 and
F5 folded in place, while **F3** (`medium`, `spec-drift`) names a Product-half
defect its frozen route reserves to this skill: AC4's fall-through parenthetical
named `stale-artifact-content` for material byte movement while the machine
answers `stale-source-revision` for moved bound bytes — the exact code the
frozen `ACCEPTANCE.md` AC4 records and Design E6 declares ("for moved bound
bytes answers `stale-source-revision`"; the earlier `stale-artifact-revision`
wording was already corrected there as wrong). `scripts/pre-execution-snapshot.mjs`
returns `stale-source-revision` before the `stale-artifact-content` slot, so a
criterion requiring `stale-artifact-content` (exit 4) from the wording-only
scenario is unsatisfiable as written. Owner instruction: "route F3 through" the
product route (design-feature → review-spec); the planning author did not
touch the Product half.

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| F3 | spec-drift · med | AC4's fall-through parenthetical now reads: material byte movement yields a non-fresh answer (never `fresh` — for moved bound bytes the fall-through answers `stale-source-revision`, exit 4), matching the frozen `ACCEPTANCE.md` AC4 wording byte-for-byte in substance. No criterion outcome moves — the required outcome (non-fresh, exit 4) is unchanged; only the impossible code name is corrected. Repair class: mechanical, intent-preserving. | AC4 (SPEC `### Acceptance criteria`) |

Artifact revision rotates `31-spec-10` → **`31-spec-12`** for the touched
Product set (`SPEC.md`, `decisions.md`). The frozen `ACCEPTANCE.md` stays
untouched (blob `849af5ae…` recomputed intact — no criterion, validator or
required outcome moves). The current Product receipt `spec-review-31-11` is
superseded by design (bound Product bytes moved with no wording-only
determination — the movement is material, not cosmetic): only a fresh
`/review-spec 31-planning-review-materiality` delta-reviews the patch and
restores currency. The fold ledger row F3 stays `folded: no` until that
re-review passes; the router's `route: fold` line for F3 is answered by this
frozen route (the product route is the authority-preserving repair).

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

### `31-spec-2` — repair batch for `spec-review-31-2` (N31-003 + N31-001 + N31-002)

User-commissioned repair batch (2026-09-17), commissioned as "widen the AC8
scope guard". Trigger: `spec-review-31-2` returned `SPEC-REVIEW-FAIL` (failed
check C8) with one material `product` row (N31-003) plus the two open `info`
product rows N31-001/N31-002 — one batch over the whole set, repair owner
`design-feature` (product class; the plan-facet rows R31-02/R31-03 stay with
`plan-feature`, per the repair sequence `plan-review-31-2` named). Entering the
spec stage's second repair/re-review cycle, the `CONVERGENCE-ANOMALY` block was
printed before any edit (POLICY §4; recorded in `decisions.md`).

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-003 | product · medium | AC8's allowed set is completed by its third declared group: the **workflow-mutated record surfaces** (`docs/features/31-planning-review-materiality/**`, the unit's `docs/features/ROADMAP.md` row, `docs/LOGS.md` session-log appends), per `verification-contract` §Validator stability, with feature 27's AC16 as the repository precedent and a mechanical pathspec-exclusion anchor; the `ROADMAP.md` hunk walk (row 31 only) added. The guard stays closed — any path outside the three groups is still a violation. Repair class: closure completion (reviewed product intent unchanged). | AC8 + In-scope workflow-mutated paragraph + Expectation sweep row 17 |
| N31-001 | product · info | Citation precision: §Context now quotes POLICY §4's actual wording ("Entering a **second** cycle is allowed when correctness needs it"); the `decisions.md` code-side-cap evidence row cites `REVIEW_PROCESS.md:169` for the `LOOP CAP REACHED` literal. Repair class: mechanical, intent-preserving. | SPEC §Context bullet 3; decisions.md evidence row |
| N31-002 | product · info | E2's `Read/list` surface now names both stages' frozen-evidence homes: plan stage (`planning-evidence.md` M/L / SPEC section XS/S) and spec stage (`decisions.md` evidence rows — writer `design-feature:product-decisions` per the ownership map). Repair class: mechanical, intent-preserving. | Capability closure E2 `Read/list` |

Artifact revision rotates `31-spec-1` → **`31-spec-2`** for the whole touched
set (`SPEC.md`, `decisions.md`, `planning-findings.md`). The frozen
`ACCEPTANCE.md` is deliberately untouched in this batch (blob `d85e217a…`
recomputed intact): it is `plan-feature`'s owning artifact, re-derived with
obligation O8 and P4 task 5 once a fresh `SPEC-REVIEW-PASS` receipt exists.

### `31-spec-3` — carrier amendment for D-31-6 (redesign, owner-authorized)

User-commissioned amendment (2026-09-17), commissioned as "carrier amendment
for D-31-6". Repair class per `REPAIR.md` §2: **redesign (carrier move)** —
the Product half is re-scoped to the code carrier the ruling names and its
frozen semantics are restated verbatim (low = report-note; material =
`medium`+; two-cycle cap → `needs-design`; wording-only skips only the
re-review). Product intent (D-31-1…D-31-5) unchanged; two new product
decisions record the machine-facing resolutions the carrier forces (D-31-7
consecutive-cycle counting with PASS reset; D-31-8 stage-scoped cap exit
against the fix/162 machine map).

| Change | Class | Where |
|---|---|---|
| Scope re-cut to the code carrier: schema finding record (`reproducer` + materiality `medium`+), snapshot verify wording-only route over the closed freshness codes, orchestrator cap refusal, phase-lint plan-layer gate; prose shrink declared; pins re-aimed | product · carrier redesign | `## Scope` (In/Out + allowed-set groups), `### Capability closure` (E1–E3 + integration + roles), `### Expectation sweep` (19 rows), `### Acceptance criteria` (AC1–AC13) |
| New decisions D-31-7/D-31-8 + 18 amendment evidence rows (two fresh external fetches) | product · decision | `decisions.md` (append-only) |
| Roadmap row 31 summary updated (status stays `defined`); progress record | product · record | `docs/features/ROADMAP.md`, `progress.md` |

Artifact revision rotates `31-spec-2` → **`31-spec-3`** for the whole Product
set (`SPEC.md`, `decisions.md`, `progress.md`, the roadmap row). The
`spec-review-31-3` receipt is superseded **by design** (bound Product bytes
moved — `stale-artifact-content`, verified post-write): the spec stage reopens
and the next `/review-spec` run is cycle 1 (D-31-7). The Engineering half
keeps its superseded bytes untouched (`31-plan-2`) — `plan-feature` re-cuts it
after a fresh PASS receipt.

### `31-spec-4` — repair batch for `spec-review-31-4` (N31-004 + N31-005)

User-commissioned repair batch (2026-09-17), commissioned as "repair N31-004
+ N31-005: extend AC7 to grep both CHECKS.md and both OUTPUT.md for the
removed materiality/loop sentences and LEDGERS.md for the removal of '`info`
is the only immaterial one', correct the Integration-closure row's Test
claim, and stage-scope the NEEDS-DESIGN wording in Goal + Business goals".
Trigger: `spec-review-31-4` returned `SPEC-REVIEW-FAIL` (failed check C8) with
one material `product` row (N31-004) plus one open `info` row (N31-005) — one
batch over the whole set, repair owner `design-feature`. Entering the spec
stage's second repair/re-review cycle of the window D-31-7 opened, the
`CONVERGENCE-ANOMALY` block was printed before any edit (POLICY §4 — printed
and routed, never a stop; a repair responding to a persisted verdict is never
a loop defect). Repair classes (REPAIR §2):

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-004 | product · medium | AC7's removal grep set now covers every surface In-scope item 5 declares shrunk: both `CHECKS.md` ("Material = anything above"), both `OUTPUT.md` (the re-review-for-every-batch mandate — the FAIL verdict-route rows and the closing hand-off blocks), and `LEDGERS.md` §3 ("`info` is the only immaterial one"); the kept-side greps are unchanged. The Integration-closure row "Skill reference docs" now states its Test truthfully: AC7's greps verify the shrink; `check-skill-context.mjs` checks budgets (AC10); `normative-drift` guards the versioned blocks the shrink must not disturb — it never pinned the materiality prose. Repair class: **closure completion** (reviewed product intent unchanged — In-scope item 5 already declared these surfaces shrunk). | AC7 + Capability closure Integration-closure row "Skill reference docs" |
| N31-005 | product · info | The two summary instances of the unconverged-loop end are stage-scoped to the machine map, in substance D-31-8's wording: the Goal names `NEEDS-DESIGN` where the verdict vocabulary sanctions it (spec stage) and the orchestrator's refusal + `design-feature` routing at the plan stage; Business-goals bullet 2 carries the same scoping. D-31-2's "(stage-scoped by D-31-8)" pointer is unchanged. Repair class: **mechanical, intent-preserving**. | `## Goal`; `### Business goals` bullet 2 |

Artifact revision rotates `31-spec-3` → **`31-spec-4`** for the whole touched
Product set (`SPEC.md`, `decisions.md`, `planning-findings.md`,
`progress.md`). The frozen `ACCEPTANCE.md` stays untouched (it is
`plan-feature`'s owning artifact, re-derived with the superseded
`31-plan-1/2` re-cut only after a fresh `SPEC-REVIEW-PASS` receipt). The
`spec-review-31-4` receipt is superseded by design (bound Product bytes moved
— `stale-artifact-content`): the next `/review-spec` run is cycle 2 (D-31-7).

### `31-spec-5` — repair batch for `spec-review-31-5` (N31-006 + N31-007 + N31-008)

User-commissioned repair batch (2026-09-17), commissioned as "repair N31-006
+ N31-007 + N31-008: make AC7's two POLICY §4 removal greps discriminate
(targets are line-wrapped — match a single-line fragment), add a criterion
for the four skill version: bumps + README cells, and correct In-scope 5's
\"keep only\" framing to name the authored remainder". Trigger:
`spec-review-31-5` returned `SPEC-REVIEW-FAIL` (failed checks C1, C8, C10;
11/14 pass) with one `medium`, one `low` and one `info` `product` row — one
batch over the whole set, repair owner `design-feature`. This is the **third
consecutive cycle** of the window D-31-7 opened at the carrier amendment
(`spec-review-31-4` FAIL #1, `spec-review-31-5` FAIL #2): per D-31-7 it
starts only under explicit user instruction, which this commission is — the
instruction is quoted verbatim in `decisions.md` and `progress.md` (REPAIR §4:
a repair responding to a persisted verdict is never a loop defect). Repair
classes (REPAIR §2):

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-006 | product · medium | AC7's two POLICY §4 removal greps now match single-line fragments verified present today (`POLICY.md:83` for "no cap converts a verdict into a …"; `POLICY.md:61` — the second line of the wrapped "Entering a **second** cycle is allowed …" sentence — for "cycle is allowed when correctness needs it"; both unique in `skills/`, both exit 0 at branch head `4cf755ab` with the sentences standing), so each grep exits 0 before the shrink and non-zero after it — the criteria now discriminate. Repair class: **closure completion** (the criteria verified nothing before; reviewed product intent — the two sentences leave §4 — unchanged). | AC7 |
| N31-007 | product · low | New **AC14** observes In-scope item 7's bump obligation: the pathspec-limited diff of the four touched `SKILL.md` files carries one removed + one added `version:` line each (≥ 8 hunk lines), each pair a semver-minor increment per the #176 freeze, with `CHANGELOG.md` per-skill rows (the AC10 `normative-drift` version-tables check recomputes them against frontmatter) and the README `## The skills` cells accurate post-shrink. In-scope item 7's pointer gains `AC14`; the Integration-closure row "Versioning/release surfaces" names it in its Test cell. Repair class: **closure completion** (the obligation was declared In-scope; only its criterion was missing). | AC14 (new) + In-scope 7 pointer + Integration-closure row "Versioning/release surfaces" + Spec-lint AC list |
| N31-008 | product · info | In-scope item 5's "keep only" framing is corrected to name the **authored remainder**: the anti-deflation judgment, the human-keyed third-cycle rule and the report-note persistence contract (with the planning materiality line replacing the removed sentences) do not exist in the named planning surfaces today and are written fresh by this feature; only the `CONVERGENCE-ANOMALY` block and the receipt-literal lines are preserved byte-unchanged. AC7's kept-side greps were already correct and are unchanged. Repair class: **mechanical, intent-preserving** (framing words only — the post-shrink state the half requires is unchanged). | In-scope 5 |

Artifact revision rotates `31-spec-4` → **`31-spec-5`** for the whole touched
Product set (`SPEC.md`, `decisions.md`, `planning-findings.md`,
`progress.md`). The frozen `ACCEPTANCE.md` stays untouched (it is
`plan-feature`'s owning artifact, re-derived with the superseded
`31-plan-1/2` re-cut only after a fresh `SPEC-REVIEW-PASS` receipt). The
`spec-review-31-5` receipt is superseded by design (bound Product bytes moved
— `stale-artifact-content`): the next `/review-spec` run is the user-keyed
third cycle (D-31-7).

### `31-spec-6` — repair batch for `spec-review-31-6` (N31-009 + N31-010 + N31-011)

User-commissioned repair batch (2026-09-17), commissioned as "repair N31-009
+ N31-010 + N31-011: make AC2's contract-prose check discriminate (grep the
description for a new-line fragment such as material = \`medium\`/report-note,
not the bare word medium, or move the clause to read-verified), cover
REPAIR.md §4's second sentence in AC7 (grep -n \"no cycle cap converts\"
skills/design-feature/references/REPAIR.md` exits non-zero), and fix the
Spec-lint AC1 classification". Trigger: `spec-review-31-6` returned
`SPEC-REVIEW-FAIL` (failed checks C8, C9; 12/14 pass) with two medium
`product` rows (N31-009, N31-010) and one open `info` row (N31-011) — one
batch over the whole set, repair owner `design-feature`. This is the **fourth
consecutive cycle** of the window D-31-7 opened at the carrier amendment
(`spec-review-31-4` FAIL #1, `spec-review-31-5` FAIL #2, `spec-review-31-6`
FAIL #3); per D-31-7 it starts only under explicit user instruction, which
this commission is — the instruction is quoted verbatim in `decisions.md` and
`progress.md` (REPAIR §4: a repair responding to a persisted verdict is never
a loop defect). Repair classes (REPAIR §2):

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-009 | product · medium | AC2's second anchor is replaced by two discriminating greps over the same file — `grep -nE 'material = .medium'` and `grep -n "report-note"` on `packages/agentic-workflow-schema/src/pre-execution-contract.ts`, both exit zero — whose fragments exist only in the rewritten finding-record severity description stating the new line (material = `medium`+; `low` is a report-note). The bare-word `medium` anchor it replaces matched the severity enum literal at `:103` (exit 0 today, rewrite or not — verified at branch head `bccc95fd`); neither new fragment can match it, and both exit non-zero at `bccc95fd`, so the criterion discriminates the rewrite. The commission's alternative (move the clause to `read-verified`) was not taken: a discriminating command anchor keeps AC2 `(command)` and objective. Repair class: **closure completion** (the criterion verified nothing about the replacement before; reviewed product intent — the schema prose states the predicate — unchanged). | AC2 |
| N31-010 | product · medium | AC7 gains the removal grep for REPAIR.md §4's second unbounded-cycle sentence: `grep -n "no cycle cap converts" skills/design-feature/references/REPAIR.md` exits non-zero. The fragment sits wholly on `:71`, is unique in the file, and exits 0 with the sentence standing at `bccc95fd` — it matches while the sentence stands and disappears with it, the same discrimination N31-006 gave the other removal greps. Repair class: **closure completion** (In-scope 5 already declared REPAIR.md §4 among the shrunk surfaces; only this sentence's criterion was missing). | AC7 |
| N31-011 | product · info | The Spec-lint product box re-files AC1 into the group its own label declares: the box now reads "AC2–AC3, AC5, AC10–AC12 pure commands; AC1, AC4, AC6–AC9, AC13–AC14 command + `read-verified` where judgement-only". No criterion text changes. Repair class: **mechanical, intent-preserving**. | `### Spec-lint` product box |

Artifact revision rotates `31-spec-5` → **`31-spec-6`** for the whole touched
Product set (`SPEC.md`, `decisions.md`, `planning-findings.md`,
`progress.md`). The frozen `ACCEPTANCE.md` stays untouched (it is
`plan-feature`'s owning artifact, re-derived with the superseded
`31-plan-1/2` re-cut only after a fresh `SPEC-REVIEW-PASS` receipt). The
`spec-review-31-6` receipt is superseded by design (bound Product bytes moved
— `stale-artifact-content`): the next `/review-spec` run is the user-keyed
fourth cycle of the window (D-31-7).

### `31-spec-7` — repair batch for `spec-review-31-7` (N31-012 + N31-013)

User-commissioned repair batch (2026-09-17), commissioned as "repair N31-012
+ N31-013: add a POLICY.md §3 criterion to AC7 (single-line fragment such as
grep -n \"re-review of the resulting snapshot\" exits non-zero, or the
intended qualified-sentence fragment) so the declared §3 shrink is
observable, and add a bound check for the reproducer field to AC3 (or move
'bounded' to read-verified)" — one repair batch for N31-012 + N31-013.
Trigger: `spec-review-31-7` returned `SPEC-REVIEW-FAIL` (failed check C8;
12/14 pass) with N31-012 (`medium`, product) and N31-013 (`low`, product) —
one batch over the whole set, repair owner `design-feature`. This is the
**fifth consecutive cycle** of the window D-31-7 opened at the carrier
amendment (`spec-review-31-4` FAIL #1, `spec-review-31-5` FAIL #2,
`spec-review-31-6` FAIL #3, `spec-review-31-7` FAIL #4); per D-31-7 it starts
only under explicit user instruction, which this commission is — the
instruction is quoted verbatim in `decisions.md` and `progress.md` (REPAIR
§4: a repair responding to a persisted verdict is never a loop defect).
Repair classes (REPAIR §2):

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-012 | product · medium | AC7 gains the removal grep for POLICY.md §3's re-review mandate: `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md` exits non-zero. The §3 sentence wraps across `:41-42`; the fragment is its single second line (`:42`), unique in the file, and exits 0 with the sentence standing at branch head `6f1d024e` — it matches while the sentence stands and disappears with it, the same line-wrap discrimination N31-006 gave the §4 greps (a full-phrase grep over the wrap would false-pass exactly as the finding warns). The commission's alternative (the intended qualified-sentence fragment) was not taken: the removal fragment is observable without fixing the replacement's wording, which stays an implementation choice inside In-scope 5's declared intent. Repair class: **closure completion** (In-scope 5 already declares POLICY §3 among the shrunk surfaces; only this sentence's criterion was missing). | AC7 |
| N31-013 | product · low | AC3's `bounded` claim becomes command-observable: `grep -A8 'key: "reproducer"' packages/agentic-workflow-schema/src/pre-execution-contract.ts \| grep -c "maxLength"` returns ≥ 1 (the field entry declares its size bound — `VerificationFieldSpec.maxLength` is optional at `verification-contract.ts:51`, so a bound-less `reproducer` declaration fails the anchor), and `grep -rln "reproducer" packages/agentic-workflow-schema/test/` exits zero (a suite vector exercises the field — none exists today); the suite clause now names the bound vector (a `reproducer` longer than the field's declared `maxLength` is refused) beside the existing back-compatibility clause. All three anchors exit non-zero / 0 at `6f1d024e`. The commission's alternative (move `bounded` to `read-verified`) was not taken: command anchors keep AC3 `(command)` and objective. Repair class: **closure completion** (In-scope 1 already declares the field bounded; only the bound's criterion was missing). | AC3 |

Artifact revision rotates `31-spec-6` → **`31-spec-7`** for the whole touched
Product set (`SPEC.md`, `decisions.md`, `planning-findings.md`,
`progress.md`). The frozen `ACCEPTANCE.md` stays untouched (it is
`plan-feature`'s owning artifact, re-derived with the superseded
`31-plan-1/2` re-cut only after a fresh `SPEC-REVIEW-PASS` receipt). The
`spec-review-31-7` receipt is superseded by design (bound Product bytes moved
— `stale-artifact-content`): the next `/review-spec` run is the user-keyed
fifth cycle of the window (D-31-7).

### `31-spec-8` (2026-09-17) — repair batch for `spec-review-31-8`

Trigger: `spec-review-31-8` returned `SPEC-REVIEW-FAIL` (failed check C8;
13/14 pass) with one finding, N31-014 (`medium`, product) — one batch over
the whole open spec-stage set (N31-012/N31-013 are verified repaired at
`31-spec-7`; no other open product row), repair owner `design-feature`.
Commission (explicit user instruction, verbatim): "repair N31-014: give
POLICY.md §4's third unbounded-cycle sentence ('… so no cycle cap or anomaly
rule may block or end it.', :82) a criterion in AC7 so the declared §4
shrink is observable". This is the **sixth consecutive cycle** of the window
D-31-7 opened at the carrier amendment (`spec-review-31-4` FAIL #1,
`spec-review-31-5` FAIL #2, `spec-review-31-6` FAIL #3, `spec-review-31-7`
FAIL #4, `spec-review-31-8` FAIL #5); per D-31-7 it starts only under
explicit user instruction, which this commission is — the instruction is
quoted verbatim in `decisions.md` and `progress.md` (REPAIR §4: a repair
responding to a persisted verdict is never a loop defect). Repair class
(REPAIR §2):

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-014 | product · medium | AC7 gains the removal grep for POLICY.md §4's third unbounded-cycle sentence: `grep -n "no cycle cap or anomaly rule" skills/pre-execution-review/references/POLICY.md` exits non-zero. The sentence — "a repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new snapshot by design, so no cycle cap or anomaly rule may block or end it." — wraps across `:81-82`; the fragment is its single second line (`:82`), unique in the file (`grep -c` → 1) and in `skills/` (1 hit), and exits 0 with the sentence standing at branch head `12ddc215` — it matches while the sentence stands and disappears with it, the same line-wrap discrimination N31-006 gave the first two §4 greps and N31-012 the §3 grep. Repair class: **closure completion** (In-scope 5 already declares POLICY §4's unbounded-cycle sentences among the shrunk surfaces; only this sentence's criterion was missing — reviewed product intent unchanged). | AC7 |

Artifact revision rotates `31-spec-7` → **`31-spec-8`** for the whole touched
Product set (`SPEC.md`, `decisions.md`, `planning-findings.md`,
`progress.md`). The frozen `ACCEPTANCE.md` stays untouched (it is
`plan-feature`'s owning artifact, re-derived with the superseded
`31-plan-1/2` re-cut only after a fresh `SPEC-REVIEW-PASS` receipt). The
`spec-review-31-8` receipt is superseded by design (bound Product bytes moved
— `stale-artifact-content`): the next `/review-spec` run is the user-keyed
sixth cycle of the window (D-31-7).

### `31-spec-9` (2026-09-17) — Product-half amendment for `plan-review-31-3`'s open row P31-06

Trigger: `plan-review-31-3` returned `PLAN-REVIEW-FAIL`; the `31-plan-4`
repair batch (P31-01…P31-05) surfaced one row it could not repair —
**P31-06** (`medium`, `class: product`, left open in `planning-findings.md`):
AC13's declared **code-carrier** group omits three paths the plan edits by
design, so the frozen scope walk reports them as violations and AC13 can
never pass. Repair owner: `design-feature` (a Product-half declaration — no
plan write may amend it without inventing product intent). Commission
(explicit user instruction, verbatim): "amendar el grupo code carriers de
AC13 para incluir scripts/pre-execution-contract.mjs,
scripts/workflow-status.mjs y
scripts/workflow-status-pre-execution.test.mjs (P31-06) — una línea, sin
tocar el resto del Product half".

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| P31-06 | product · medium | The `## Scope` **Code carriers** allowed-set group gains the three paths — `scripts/pre-execution-contract.mjs` (the `parseWordingOnlyDeterminations` parser plus `deriveReviewLoopCycles`, E-D31-15/E6 + E-D31-17/E4), `scripts/workflow-status.mjs` (the `detail.review_loop_cycles` projection, E-D31-17) and `scripts/workflow-status-pre-execution.test.mjs` (already in AC10's gate command; the suite the plan extends) — so AC13's `read-verified` scope walk stops reporting the plan's own designed edits as violations. One-line declaration widening; no criterion text, closure row, sweep row, or non-goal moved. Repair class: **closure completion** (AC13 already declares the walk over the group; only the group's enumeration lagged the plan). | `## Scope` allowed-set group 1 (walked by AC13) |

Artifact revision rotates `31-spec-8` → **`31-spec-9`** for the touched
Product set (`SPEC.md`, `decisions.md`, `progress.md`). The frozen
`ACCEPTANCE.md` stays untouched (it is `plan-feature`'s owning artifact,
re-derived with the `31-plan-3/4` set only after a fresh `SPEC-REVIEW-PASS`
receipt). The `spec-review-31-9` receipt is superseded by design (bound
Product bytes moved — `stale-artifact-content`): the next `/review-spec` run
re-reviews the amended half, and `plan-feature` then re-cuts the plan set.
The open P31-06 row is resolved by the plan's re-derivation, not by this
authoring turn.

### `31-plan-4` — repair batch for `plan-review-31-3` (P31-01 + P31-02 + P31-03 + P31-04 + P31-05)

`plan-feature` repair batch (2026-09-17), commissioned by the owner after
`plan-review-31-3` returned `PLAN-REVIEW-FAIL` (failed checks L5, P3, P8, P10,
P12) with five findings: P31-03 (high), P31-01/P31-02 (medium), P31-04/P31-05
(low). One batch over the whole set; no Product byte moved and no acceptance
criterion's required outcome was weakened.

What changed, per finding:

- **P31-01** — the wording-only determination's home moves from the bound
  `planning-evidence.md`/SPEC-section/`decisions.md` surfaces to the unit's
  unbound `progress.md` (§Design E5), because recording it in a bound artifact
  rotates the `artifactRevisionId` it must name and made the identity check
  unsatisfiable (E-D31-15, PE-026).
- **P31-02** — the branch's position is now explicit and reachable: after the
  `stale-context` check and before the `stale-source-revision` check, fed by a
  pure `wordingOnly` input, with the no-determination path falling through
  unchanged (E-D31-16, PE-027).
- **P31-03** — the cap count is derived by one shared pure helper
  (`deriveReviewLoopCycles` in `scripts/pre-execution-contract.mjs`) and projected
  into the envelope's free-form `detail` bag as `detail.review_loop_cycles`;
  feature 38's A:12 (`decideWorkflowAction` stays consumer-side) is preserved and
  pinned by the re-aimed `scripts/review-loop-discipline.test.mjs` block, which
  already rides the AC10 pack, while the feature-38 suite's own red state is
  recorded as an open boundary (E-D31-17, PE-024, PE-025).
- **P31-04** — the schema package's `CHANGELOG.md` row stays in P4 (the canonical
  phase contract forbids a `docs` target in a `config/infra` phase): the
  `normative-drift` window between P1 and P4 is declared in `known-issues.md`, and
  P4's done-when now closes it by running `bun test scripts/normative-drift.test.mjs`
  (E-D31-18, PE-028).
- **P31-05** — the Engineering half's evidence-row range is corrected to the
  ledger's actual rows, now `PE-001…PE-029` (E-D31-19, PE-029).

The `31-plan-3` receipt (`plan-review-31-3`, FAIL) is superseded by design (bound
plan bytes moved); the next `/review-plan` run is the plan stage's third cycle of
the window `plan-review-31-1` opened, whose `CONVERGENCE-ANOMALY` block the
`plan-review-31-3` receipt carries.

### `31-spec-10` (2026-09-17) — user-commissioned Product-half patch for `spec-review-31-10`'s open row N31-015

Trigger: `spec-review-31-10` returned `SPEC-REVIEW-FAIL` (12/14; C9 + C10) with
one open row — **N31-015** (`medium`, `class: product`): AC13's declared
**code-carrier** group still omitted
`scripts/pre-execution-attribution.test.mjs` and
`scripts/pre-execution-sensor.test.mjs`, both of which AC4 requires to carry
`wording-only` vectors and `PLAN.md` P3 extends, so AC4 and AC13 were mutually
unsatisfiable. Owner ruling (explicit user instruction, verbatim, refusing a
further `design-feature` cycle): "No voy a rediseñar más arreglalo tú como un
parche, estamos tirando billones de tokens a la basura." The human owner amends
the governing SPEC directly (POLICY §5) and the reviewing turn applies the
mechanical enumeration patch.

| Finding | Class · severity | Repair | Where |
|---|---|---|---|
| N31-015 | product · medium | The `## Scope` **Code carriers** allowed-set group additionally enumerates `scripts/pre-execution-attribution.test.mjs` (the wording-only dimension vectors, `PLAN.md:107`) and `scripts/pre-execution-sensor.test.mjs` (the wording-only vectors + the `wording-only` anchor AC4 greps, `PLAN.md:108`) — the two remaining paths the plan edits by design, so AC13's scope walk no longer reports them as violations and AC4/AC13 stop contradicting. Enumeration only; no criterion text, closure row, sweep row, or non-goal moved. Repair class: **closure completion**. | `## Scope` allowed-set group 1 (walked by AC13) |

Artifact revision rotates `31-spec-9` → **`31-spec-10`** for the touched Product
set (`SPEC.md`). The frozen `ACCEPTANCE.md` stays untouched (it is
`plan-feature`'s owning artifact, re-derived only on a fresh `SPEC-REVIEW-PASS`
receipt). The `spec-review-31-10` receipt is superseded by design (bound Product
bytes moved — `stale-artifact-content`).

### `31-plan-5` (2026-09-17) — engineering re-derivation for the reviewed Product patch

Trigger: the plan's parent was `spec-review-31-9` @ `e15374a3…`, and the Product
half's bound bytes moved twice after it — the owner-commissioned patches
`31-spec-9` (the `## Scope` code-carrier group gains
`scripts/pre-execution-contract.mjs`, `scripts/workflow-status.mjs` and
`scripts/workflow-status-pre-execution.test.mjs`, resolving `plan-review-31-3`'s
open row P31-06) and `31-spec-10` (gains
`scripts/pre-execution-attribution.test.mjs` and
`scripts/pre-execution-sensor.test.mjs`, resolving `spec-review-31-10`'s N31-015).
`spec-review-31-11` (`spec-review-pass`, 14/14 checks, zero findings,
`spec-product-v1` digest `e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02`,
46362 bytes) is the current Product receipt, so the plan descended from a stale
parent — the exact lineage class R31-01 named.

What the re-derivation changed: the plan snapshot's parent now binds
`spec-review-31-11` @ `dd09372a…`; `planning-findings.md` **P31-06** flips to
`resolved` (the Product declaration it was owed now enumerates every path the plan
edits by design, so AC13's scope walk is satisfiable); `E-D31-18`'s CHANGELOG-row
allocation is corrected to the phase-lint-valid one (the schema package's 4.3.0
companion row stays in P4, where the `docs` layer lives, and the `normative-drift`
window P1→P4 is declared in `known-issues.md`); `known-issues.md` §10 (AC13's
code-carrier gap) is closed and the duplicate item numbering repaired. No phase, task, validator, or acceptance
criterion's required outcome changed: both Product patches were enumeration-only,
so `ACCEPTANCE.md`'s validators are re-frozen byte-identical to their criterion
text.

Artifact revision rotates `31-plan-4` → **`31-plan-5`** for the plan set
(`SPEC.md` Engineering half, `PLAN.md`, `TASKS.md`, `ACCEPTANCE.md`,
`planning-evidence.md`, `planning-obligations.md`, `decisions.md`,
`known-issues.md`). The `plan-review-31-3` receipt is superseded by design (bound
plan bytes moved); a repaired plan is not an approved plan, so the next step is
`/review-plan`.

### `31-plan-6` (2026-09-17) — repair batch for `plan-review-31-4` (P31-07 + P31-08 + P31-09 + P31-10 + P31-11)

Trigger: `plan-review-31-4` returned `PLAN-REVIEW-FAIL` on snapshot `b17009ea…`
(artifact revision `31-plan-5`) with five plan-class rows and no product row. Its
`CONVERGENCE-ANOMALY` block named the route: `plan-feature
31-planning-review-materiality` — one batch for P31-07…P31-11, then `/review-plan`
re-reviews the new artifact revision. All five rows are `class: plan`, so the batch
repairs this Engineering half only; the Product parent stays `spec-review-31-11` @
`dd09372a…`.

What the batch changed:

- **P31-07 (high)** — P1's done-when could not commit: two existing tests hard-pin
  the package version to `4.2.0` (`test/release-contract.test.mjs`,
  `test/verification-gates.test.mjs`) while the task list bumped
  `package.json` to `4.3.0`. The bump task now moves both pins in the same commit
  (E-D31-22, PE-033).
- **P31-08 (high)** — the same suite's `test/pre-execution-docs.test.mjs` walks
  `PRE_EXECUTION_LIMITS` against the package README's `### Published limits` block,
  and `reproducerChars` was published nowhere; a P1 task now adds
  `reproducerChars 1024` to that block (both it and the pins are `packages/**`,
  i.e. `config/infra`, so the `docs` P4 cannot carry them) (E-D31-22, PE-034).
- **P31-09 (medium)** — `E9` still said the CHANGELOG row lands with the bump in
  P1 while `PLAN.md`/`TASKS.md`/`E-D31-18`/`known-issues.md` §12 and the SPEC's
  own `### Phases` P1 done-when said P4; every statement now reads the P4
  allocation the P31-04 resolution chose (E-D31-23).
- **P31-10 (low)** — P4's §3 task kept the exact literal AC7's removal grep
  deletes; the task now names the removal grep and states the default batch
  consequence without reciting it (E-D31-24, PE-036).
- **P31-11 (info)** — P4's CHECKS rewrite promised only the severity vocabulary
  lists byte-identical while `scripts/pre-execution-quality.test.mjs` pins the
  `a \`PASS\` may not carry an open` / `unverified material row` pairing with its
  line break; the task now names that pin (AC10's pack) (E-D31-24, PE-035).

Also repaired in the same batch, same root cause as P31-09: the `### Phases` P1
done-when appended `bun test scripts/normative-drift.test.mjs` → exit 0 as if the
bump and its CHANGELOG row shared P1, contradicting the P4 allocation and the
phase contract's box 2; it now stays package-local and restates the declared
window.

No phase, task count outside P1, validator or acceptance criterion's required
outcome changed, and `ACCEPTANCE.md` is **not** re-frozen: every row here is
Engineering-half, so its blob `849af5ae…` and every validator stay as the
`31-plan-5` re-derivation froze them. P1 goes from seven to eight tasks (the bump
task absorbs the two pins, one new published-limit task), which is the canonical
phase contract's ceiling for a non-close-out phase (E-D31-25, PE-037); the
superseded fingerprint `P1:config/infra:7:…` and the aggregate
`4b681ff5de2757fce619dd3acded678c78352d2c0703706a67f2de720d4e56e9` are dead
with the `31-plan-5` set.

Artifact revision rotates `31-plan-5` → **`31-plan-6`** for the plan set
(`SPEC.md` Engineering half, `PLAN.md`, `TASKS.md`, `planning-evidence.md`,
`planning-obligations.md`, `decisions.md`, `known-issues.md`, `testing.md`). The
`plan-review-31-4` receipt is superseded by design (bound plan bytes moved); a
repaired plan is not an approved plan, so the next step is `/review-plan`.
