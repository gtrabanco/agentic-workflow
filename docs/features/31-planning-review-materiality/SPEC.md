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
   (`stale-artifact-content` → re-review owed); the determination record and
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
  `scripts/pre-execution-snapshot.mjs`,
  `scripts/review-loop-discipline.test.mjs`, `scripts/phase-lint.mjs`.
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
  bound bytes (`stale-artifact-content` → re-review owed).

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
| 11 | Every repair write rotates `artifactRevisionId` — the freshness predicate itself refuses an unrecorded rotation (`stale-artifact-revision`), including on the wording-only route | in-scope | In scope 2 + AC4 |
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
  a new review receipt; material byte movement → `stale-artifact-content`
  (exit 4); a rotation without the recorded determination is refused (the
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

`designed` — repair batch for `spec-review-31-8` applied (N31-014, one
batch): capability closure complete (zero blank rows), Spec-lint product
boxes all PASS, readiness preflight `READY-FOR-REVIEW` at artifact revision
**`31-spec-8`** (2026-09-17 — see `## Amendments`). This write moves the
Product half's bound bytes, so the `spec-review-31-8` receipt goes
`stale-artifact-content` by design: the next `review-spec` run is the
**sixth consecutive cycle** of the window D-31-7 opened at the carrier
amendment, and it starts under the explicit user instruction that
commissioned this batch (D-31-7's user-keyed cycle — the instruction is
quoted in `decisions.md` and `progress.md`; the window's
`CONVERGENCE-ANOMALY` block preceded the cycle-2 edits and is reproduced in
the `spec-review-31-8` receipt).
`plan-feature` re-cuts the plan set (`31-plan-1/2` superseded, never repaired)
only on a current `SPEC-REVIEW-PASS` receipt.
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
