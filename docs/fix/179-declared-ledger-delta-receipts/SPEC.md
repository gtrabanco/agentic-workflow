# fix/179-declared-ledger-delta-receipts

> Fix specification. Lighter than a feature spec — no separate planning
> artifacts: the SPEC and sibling `ACCEPTANCE.md` are the source of truth, and
> its `## Phases` section is the execution ledger.

## Goal

Make execution-ledger bookkeeping a **declared amendment class** that plan-stage
receipts survive. Today every post-receipt SPEC tick flip voids the receipt as
`stale-source-revision`, and the only sanctioned recovery is a full
`/review-plan` re-review — or the finding stays DISPUTED forever (fix-162's F12).
This fix: (1) defines the execution-ledger amendment class in policy and makes
the executor declare such amendments at amendment time; (2) makes the sensor
answer a distinct machine-readable `declared-delta` status for exactly that
class and nothing else, and `audit-pr` treat it as a non-blocking warning; (3)
gives `verify`-axis staleness findings a foldable `fix-now` route. No freshness
guarantee weakens: content deltas, undeclared deltas, and every other drift
dimension still fail closed.

## Issue

[#179](https://github.com/gtrabanco/agentic-workflow/issues/179) — tracked issue
in the project's forge. The PR must close it via `Closes #179` in the body.

## Branch

`fix/179-declared-ledger-delta-receipts`

## Depends on

Features 30 + 31 + 32 (#170, #171, #172) — the issue records them as
prerequisites because they touch the same contract files (`POLICY.md`,
`LEDGERS.md`, `review-implementation/CLASSIFY.md`, `audit-pr` gate scale). All
three are OPEN at drafting (issues open; roadmap rows 30–32 status `idea`), so
`execute-phase`'s dependency gate stops execution until they merge; planning
proceeds now because the defect is live at HEAD and every change here is
additive text the features can rebase against. No other fix depends.

## Root cause

Two rules meet without a bridge:

1. **Content-bound receipts bind whole-file digests deliberately.** Feature 25's
   mutate-and-revert protection means any later bound-byte change rotates the
   whole-file digests and voids the receipt: the comparator answers
   `stale-source-revision` at precedence 6
   (`packages/agentic-workflow-schema/src/pre-execution.ts:1144`), and the
   git-backed sensor reproduces it from the receipt's own recorded revision
   (`scripts/pre-execution-snapshot.mjs:430-434`), where `sourceRevision`
   derives from the newest commit touching *any* bound path
   (`scripts/pre-execution-snapshot.mjs:117-131`).
2. **fix-162 (PR #178) made gates receipt-arbitrated** ("gates read receipts;
   roadmap rows are labels" — `POLICY.md` §5 final bullet) and gave `audit-pr` a
   lineage gate that blocks on stale lineage
   (`skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:85-98`).

Neither rule distinguishes *mutation of reviewed planning content* from
*execution bookkeeping*: the Hardening & PR phase legitimately flips its task
checkboxes in the SPEC (`## Phases` ledger) and corrects progress gate claims,
every such amendment rotates `contentRevision`, and the receipt voids. The route
vocabulary (`review-implementation/CLASSIFY.md` owning-stage table) has no class
for an execution-ledger amendment, so the finding routes to "plan re-review"
(full re-pin) — or the unit accepts a permanently open DISPUTED row.

## Detected in

fix-162 (PR #178) review cycle 4, finding **F12**
(`docs/fix/162-verdict-receipt-roadmap-desync/review-findings.md:75`, VF-12
row): receipt `rp-fix162-20260906-003` pinned source revision `ed6f8179`; the
user-confirmed SPEC amendments landed at `1e225a81`…`8158e825`; `node
scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-162 --dir
docs/fix/162-verdict-receipt-roadmap-desync --unit-kind fix` → `"current":
false`, reasonCode `stale-source-revision`, changedPaths
`[docs/fix/162-.../SPEC.md]`, exit 4. Reproduced live at HEAD `a22130ba`
(2026-09-07): the entire SPEC diff since the pinned revision is **0
non-checkbox changed lines** — pure tick flips, so the delta is exactly the
class this fix must classify. F12's disposition: DISPUTED, option B (the user
accepted an open known issue rather than pay the re-review).

## Scope

### In scope

1. **Schema package** — `declared-delta` joins
   `PRE_EXECUTION_FRESHNESS_CODES` as a git-backed-only refinement of
   precedence 6 (the pure comparator never emits it); package 4.1.0 → 4.2.0;
   README EN+ES mirror in the same PR (AC5).
2. **Sensor** — `scripts/pre-execution-snapshot.mjs` parses the unit's
   `## Ledger-state amendments` declaration rows (format frozen in
   `LEDGERS.md`, P3) and classifies a `stale-source-revision` delta as
   `declared-delta` only when, for **every** changed bound path: (i) the total
   diff since the recorded revision is ledger-state-only (checkbox-token flips
   on task lines, or single-cell table transitions where both values are in the
   closed obligation `status` vocabulary `planned|in-progress|verified|n/a|deferred`),
   (ii) every intervening commit (`git log <recorded>..HEAD -- <path>`) is named
   by a declaration row for that path, and (iii) the path is not
   `ACCEPTANCE.md` (blob-bound, never amendable via this class). The verify
   report gains `structural.reasonCode: "declared-delta"` plus a
   `declaredDelta` amendment payload; `current` stays `false` and the exit code
   stays 4 (the receipt is still not current — consumers keying `current` keep
   failing closed). Any other dimension, any undeclared/out-of-class delta, any
   empty-diff revision movement (mutate-and-revert sentinel) is unchanged.
3. **Policy + ledgers** — `POLICY.md` §9 defines the class and its limits;
   `LEDGERS.md` freezes the declaration block format and adds the two writers
   to the `ledger-ownership@1` progress row (`execute-phase:amendment-rows`,
   `fold-findings:amendment-rows`).
4. **Executor mandate** — `execute-phase`'s tick rule declares ledger-state
   amendments in the same commit that ticks them.
5. **Fold route** — `fold-findings` records retro declaration rows (a record of
   fact: commits exist, diffs in class) when folding a verify-axis staleness
   finding.
6. **Classification rule** — `CLASSIFY.md`: a `verify`-axis finding whose
   defect is process-expected receipt staleness (declared ledger-state class) +
   docs/progress claim inaccuracy classifies `fix-now` with the
   `fold-findings` route; the plan re-review route is reserved for findings
   citing a content delta in reviewed planning material or an undeclared /
   out-of-class delta. Pinned by the discipline test — not reviewer taste.
7. **Audit gate** — `audit-pr`'s lineage gate answers `declared-delta` as a
   named non-blocking warning (MERGE-READY reachable); the BLOCKED enumeration
   ("Stale, missing, wrong-stage or impossible-timeline") is unchanged.
8. **Tests + release** — red-first sensor suite (six-case matrix + red-first at
   pre-fix bytes), parity-table divergence case, discipline/ownership pins,
   skill version bumps, pi bundle re-sync, budgets re-basis.

### Out of scope

- **fix-162's F12 row closure.** After this merges, a `/fold-findings` pass on
  fix-162's unit can record the retro declarations for commits
  `2080132`…`8158e825` (all tick-only, proven), correct the `progress.md:161`
  gate claim, and flip F12 `folded: yes` — that fold belongs to fix-162's unit
  loop, not this one.
- **`execute-phase`'s pre-execution gate and `workflow-status` 6a keep failing
  closed on `current: false`** (declared-delta included): a mid-unit resume
  after declared ticks still routes to `/review-plan`. Today's behavior is
  preserved, not regressed; changing their treatment is a separate bounded
  decision for the owner (a follow-up issue only the user files).
- **The pure schema comparator never answers `declared-delta`** — it has no git
  or ledger access; it gains only the documented refinement annotation.
- No new skill, no roadmap row (bug fix tracked in `docs/fix/README.md`), no
  `MIGRATION.md` note (no rename, no invocation change).

### Planning evidence

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: the verify command answers `current:false` / `stale-source-revision` / changedPaths `[SPEC.md]` / exit 4 at HEAD, for a delta that is 0 non-checkbox lines | repository | run at HEAD `a22130ba` on `docs/fix/162-verdict-receipt-roadmap-desync` + `git diff ed6f8179…worktree -- SPEC.md` | a22130ba | O1, O2 | current | proven | executed during drafting; command + JSON recorded in Detected in |
| PE-002 | Root cause (a): receipts bind whole-file digests by design (mutate-and-revert protection); precedence 6 fires on any bound-byte change | repository | `packages/agentic-workflow-schema/src/pre-execution.ts:1085-1144` (precedence list, `stale-source-revision` branch) + `scripts/pre-execution-snapshot.mjs:117-131` (`contentRevision` over newest touching commit), `:430-434` | a22130ba | O1, O2 | current | proven | — |
| PE-003 | Root cause (b): gates are receipt-arbitrated and `audit-pr`'s lineage gate blocks stale lineage | document | `skills/pre-execution-review/references/POLICY.md` §5 final bullet; `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:85-98` | a22130ba | O4 | current | proven | — |
| PE-004 | F12 is the live instance: route cell demanded plan re-review and excluded `/fold-findings`; user chose DISPUTED (option B), `folded: no` | ledger | `docs/fix/162-verdict-receipt-roadmap-desync/review-findings.md:75` (F12 + VF-12 rows); commit `079b1b72` | a22130ba | O5 | current | proven | — |
| PE-005 | The sensor may only speak the published vocabulary: it refuses invented codes | repository | `scripts/pre-execution-snapshot.mjs:247-253` (guard on `PRE_EXECUTION_FRESHNESS_CODES`) | a22130ba | O3 | current | proven | — |
| PE-006 | A new code requires the schema package to publish it and the README EN+ES to mirror it in the same PR (the docs test derives the table from the schema) | repository | `packages/agentic-workflow-schema/src/pre-execution.ts:159-171`; `test/pre-execution-docs.test.mjs:106-113`; `README.md:306,384-390`; `README.es.md` mirror | a22130ba | O3 | current | proven | — |
| PE-007 | Git-backed sensor refinements of pure-comparator answers have a documented precedent: `impossible-timeline` (fix-162) added the code at its slot with a parity-test divergence case | repository | `scripts/pre-execution-attribution.test.mjs` (timeline parity case); fix-162 SPEC P1/P2 tasks | a22130ba | O1, O6 | current | proven | — |
| PE-008 | Regression scope: consumers other than `audit-pr` key on `current`/`reasonCode` and fail closed — `execute-phase`'s gate (missing/stale/wrong-stage) and `workflow-status` 6a's label table | repository | `skills/execute-phase/references/PRE_EXECUTION_GATE.md`; `skills/workflow-status/references/PRE_EXECUTION.md` (6a labels) | a22130ba | O12 | current | proven | — |
| PE-009 | Rollback path: the class is additive — reverting the sensor classification + the audit-pr treatment restores today's fail-closed void; receipts/ledgers untouched | derived | additive design (new enum member + new code path guarded by declared evidence); issue §Rollback strategy | a22130ba | Rollback | current | proven | — |
| PE-010 | Affected invariant: the no-weakening pins (materiality, no-progress/caps, mutate-and-revert, verdict exclusivity) live in discipline tests that must stay green | repository | `scripts/review-loop-discipline.test.mjs:1-80`; `scripts/ledger-ownership.test.mjs` (ledger-ownership@1); `scripts/normative-drift.test.mjs` (gate vocabulary) | a22130ba | O6 | current | proven | — |
| PE-011 | The declaration home is the unit's own execution ledger (`progress.md`), already parsed by the sensor for receipts; its current writers are scaffold/execute-phase/reviewers | document | `skills/pre-execution-review/references/LEDGERS.md` § durable-ledger map (`progress` row); `scripts/pre-execution-snapshot.mjs` `receipts()` | a22130ba | O7, O8, O9 | current | proven | — |
| PE-012 | Dependencies open: #170/#171/#172 (features 30/31/32) touch the same contract files and are prerequisites per the issue | forge | issues #170, #171, #172 OPEN (fetched 2026-09-07); `docs/features/ROADMAP.md` rows 30–32; issue #179 §Depends on | a22130ba | Cross-issue | current | proven | dependency gate blocks execution until they merge |
| PE-013 | Skill-reference growth needs the budgets gate: the shared `pre-execution-review` references exceeded for fix/162 and were re-based with a declared growth pathway | document | `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`declared` 2026-08-31/2026-09-06 entries, ceiling rule); CLAUDE.md § Verification | a22130ba | O10 | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1 | A pinned plan receipt whose subsequent bound deltas are exactly declared ledger-state amendments verifies as `declared-delta` (reasonCode + payload), not `stale-source-revision` | P2 | sensor classification + tests | execute-phase | `node --test scripts/pre-execution-sensor.test.mjs` → declared cases green | test case output pasted in progress.md | planned |
| O2 | AC2 | A delta touching reviewed planning content, undeclared, uncommitted, or outside the class still answers `stale-source-revision`/`stale-artifact-content` and blocks — fail-closed preserved, proven red-first at pre-fix bytes | P2 | sensor classification + tests | execute-phase | same suite → fail-closed cases green; red-first run pasted in progress.md | red-first evidence in progress.md | planned |
| O3 | AC5 | The sensor's reason vocabulary change is published by the schema package and mirrored in README EN+ES in the same PR | P1 | schema code + docs | execute-phase | `cd packages/agentic-workflow-schema && bun run test` → fail 0 (docs test derives READMEs); grep both READMEs for `declared-delta` | suite output + grep counts | planned |
| O4 | AC6 | `audit-pr`'s lineage gate treats `declared-delta` as a declared, non-blocking warning; MERGE-READY reachable; the BLOCKED enumeration is unchanged | P4 | audit gate + skill box | execute-phase | grep `02_CLOSURE_AND_SCOPE_GATES.md` + `SKILL.md` (non-blocking, BLOCKED set intact); `node --test scripts/audit-pr-receipt.test.mjs` → fail 0 | grep counts + suite output | planned |
| O5 | AC3 | A verify-axis finding with defect = process-expected staleness + docs-claim inaccuracy classifies `fix-now`/`fold-findings`; only a cited content delta routes to plan re-review — pinned in the discipline test | P4 | CLASSIFY rule + pins | execute-phase | `node --test scripts/review-loop-discipline.test.mjs` → fail 0 with the new pins | suite output | planned |
| O6 | AC4 | No weakening: mutate-and-revert protection, verdict exclusivity, the two-cycle cap, and the third-cycle user escape are unchanged — pins updated, never weakened | P2+P3+P4 | all text + tests | execute-phase | `node --test scripts/review-loop-discipline.test.mjs scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/ledger-ownership.test.mjs scripts/bounded-delivery-loops.test.mjs` → fail 0 | suite output | planned |
| O7 | Policy §9 | The executor declares ledger-state amendments at amendment time — the same commit carries the tick flips and the declaration row | P3 | execute-phase mandate | execute-phase | grep `EXECUTION_CONTRACT.md` mandate; sensor test proves undeclared ticks fail closed | grep count + suite output | planned |
| O8 | Policy §9 | The fold route records retro declaration rows when folding a verify-axis staleness finding (record of fact, never reclassification) | P3 | fold-findings fold step | execute-phase | grep `FOLD_PROCESS.md`; suite green | grep count | planned |
| O9 | LEDGERS map | The ownership map carries the two amendment writers; projections and validators stay consistent | P3 | LEDGERS + map pins | execute-phase | `node --test scripts/ledger-ownership.test.mjs scripts/bounded-delivery-loops.test.mjs` → fail 0 | suite output | planned |
| O10 | CLAUDE.md § Verification | Context budgets stay green after the reference growth (trim first, then declared re-basis naming `fix/179`) | P5 | budgets | execute-phase | `node scripts/check-skill-context.mjs --routes` → exit 0 | command output | planned |
| O11 | CLAUDE.md § Verification | The pi mirror is byte-identical to `skills/`; touched skills bumped minor with EN+ES changelog rows; pi package re-bundled and green | P5 | bumps + bundle | execute-phase | `npm run bundle:skills` + `npm test` (pi package) → fail 0; grep both CHANGELOGs | suite output + grep counts | planned |
| O12 | AC7 | Fail-closed consumers are untouched: `execute-phase`'s gate and `workflow-status` 6a gain no declared-delta treatment | P4 | compat pin | execute-phase | grep `declared-delta` under `skills/execute-phase/references/` and `skills/workflow-status/` → 0 hits | grep count | planned |

## Impact

- **Layers:** workflow tooling only — the npm schema contract package (`domain`),
  the repository sensor CLI (`config/infra`), and five skills' contract prose
  (`docs`). No application code, no runtime service.
- **Modules and files:** `packages/agentic-workflow-schema/src/pre-execution.ts`
  (+ README EN/ES, version, changelogs); `scripts/pre-execution-snapshot.mjs`
  (+ `scripts/pre-execution-sensor.test.mjs`, `scripts/pre-execution-attribution.test.mjs`,
  quality/ownership/discipline/audit pins); `skills/pre-execution-review/references/POLICY.md`
  + `LEDGERS.md`; `skills/execute-phase/references/EXECUTION_CONTRACT.md`;
  `skills/fold-findings/references/FOLD_PROCESS.md`;
  `skills/review-implementation/references/CLASSIFY.md`;
  `skills/audit-pr/SKILL.md` + `references/02_CLOSURE_AND_SCOPE_GATES.md`;
  pi package mirror re-bundle.
- **Blast radius:** every pre-execution receipt consumer sees one new
  `reasonCode` value it treats as non-current (fail-closed default); only
  `audit-pr`'s lineage gate changes treatment. Fix/feature units planned before
  this fix behave exactly as today (undeclared ticks stay `stale-source-revision`).
- **Detection lead time:** immediate — the sensor suite's seven-case matrix and
  the parity test detect a wrong classification at CI time, before any unit
  relies on it.

## Rules that must never be violated

- **The freshness vocabulary is closed.** The sensor refuses any code outside
  `PRE_EXECUTION_FRESHNESS_CODES` (`scripts/pre-execution-snapshot.mjs:247-253`);
  `declared-delta` must be published by the schema package before the sensor
  emits it (P1 before P2).
- **Mutate-and-revert protection is never relaxed** (schema S6): an empty-diff
  revision movement (bytes reverted, a commit between) is never `declared-delta`
  — the class requires actual in-class byte deltas, so an older PASS still
  cannot resurrect.
- **Verdict exclusivity (POLICY §5)** — `declared-delta` is a delta
  classification, never a verdict and never a receipt refresh: the receipt
  stays bound to the bytes it reviewed, no block is edited or re-hashed, and no
  receipt is `declared-delta` at its own write (a reviewer's write is not an
  amendment).
- **Two-cycle cap and third-cycle user escape (POLICY §4)** are unchanged; the
  foldable route is a mechanical docs repair inside the existing cap, never a
  new loop.
- **Untrusted content (POLICY §7)** — declaration rows in `progress.md` are
  data: the sensor verifies each named commit actually touched the named path
  and that the path's total diff is in-class; a forged or stale declaration
  cannot promote a content delta, and a declaration naming a commit that did
  not touch the path fails closed.
- **`ACCEPTANCE.md` is blob-bound** (verification contract): never amendable via
  this class; any byte change there keeps failing closed.
- **Bilingual rule** — the schema README and CHANGELOG changes land EN+ES in the
  same commit (CLAUDE.md working rules).

## Operational risks

None at runtime: no jobs, queues, cache, scheduled work, or external adapters
are touched. The npm schema change is additive (one enum member); downstream
consumers that switch on `reasonCode` see a new value they treat as
non-current — the fail-closed default is preserved by construction, and only
`audit-pr` learns the warning treatment.

## Security risks

The new classification path must not become a weakening vector: declarations
are parsed from the unit's own in-repo `progress.md`, verified against git
(commit-touched-path, intervening-commit coverage), and the byte-level class
check runs on the actual diff — a forged declaration row cannot promote a
content delta, and out-of-class bytes fail closed regardless of what the
declaration claims. No auth, secrets, PII, webhook, or rate-limit surface.

## Compliance touchpoints

n/a — no domain or compliance rules apply to workflow tooling.

## Affected docs

- `packages/agentic-workflow-schema/README.md` + `README.es.md` — freshness
  vocabulary mirror (→ O3/AC5).
- `CHANGELOG.md` + `CHANGELOG.es.md` — schema 4.2.0, five skill bumps, pi 0.7.0
  rows (→ O11/AC9).
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — declared re-basis only if trim
  does not return the budgets green (→ O10/AC8).

## Observability

The sensor's JSON is the observable surface: `structural.reasonCode` gains
`declared-delta` and the report names the declared amendments; the suite proves
both answers end to end. Health commands: the sensor/parity/discipline suites,
`node scripts/check-skill-context.mjs --routes`, schema + pi suites. No logs,
metrics, or alerts exist (no runtime service).

## Cross-issue notes

| Issue | Overlap | Decision |
|---|---|---|
| #170 / #171 / #172 (features 30/31/32) | Same contract files (`POLICY.md`, `LEDGERS.md`, `CLASSIFY.md`, `audit-pr` gate scale); OPEN at drafting | **Prerequisite** (the issue's own dependency statement). Not absorbable: they redesign the review→fold loop, materiality, and consistency; this fix adds the receipt amendment class beneath them. The dependency gate stops execution until they merge. |
| #180 (feature 35) | Skill tooling (versioned releases) | Unrelated — no file overlap beyond changelog rows. |
| #176 (slim-vs-raise budgets policy) | This fix may need a declared budgets re-basis like fix/162's | Parallel — the growth pathway is named in P5; the slim-vs-raise decision stays #176's. |
| fix-162 F12 | The live instance of this defect | **Absorbable after this merges** via fix-162's own fold loop (retro declarations for commits `2080132`…`8158e825` + `progress.md:161` claim correction + `folded: yes`). Routed there, not absorbed here. |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` — never unlabelled prose.

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction, the root
      cause, the regression scope, and the rollback path — none blank, none
      `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Phases

Execution ledger — `execute-phase --fix <n>` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.
**Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.
Consume the canonical checklist from `skills/phase-contract/SKILL.md` and
record the result here as `Phase-lint: PASS (8/8) · fingerprint
<P<n>:<layer>:<n-tasks>:<title-deliverable>>` (or `BLOCKED — box <n>: …`).

### P1 — Schema publishes the declared-delta code

Layer: `domain`. Done-when: `cd packages/agentic-workflow-schema && bun run
test` → exit 0, fail 0 (the docs test derives the README table, so it is green
only with the EN+ES mirror in place).
Phase-lint: PASS (8/8) · fingerprint `P1:domain:5:schema-declared-delta-code`

- [ ] Red-first: update every suite pin that enumerates the freshness list —
      grep `PRE_EXECUTION_FRESHNESS_CODES` under
      `packages/agentic-workflow-schema/test/` and `scripts/`
      (`test/pre-execution-lineage.test.mjs`, `test/pre-execution-docs.test.mjs`,
      `scripts/pre-execution-quality.test.mjs`) to pin `declared-delta`
      membership and its position directly after `stale-source-revision`; run
      the schema suite → red
- [ ] `packages/agentic-workflow-schema/src/pre-execution.ts`: add
      `"declared-delta"` to `PRE_EXECUTION_FRESHNESS_CODES` directly after
      `"stale-source-revision"` with a comment naming it a git-backed-only
      refinement; `comparePreExecutionReceiptToSnapshot`'s precedence docstring
      item 6 gains the annotation ("refinable by a git-backed caller into
      `declared-delta` when the delta is a declared ledger-state amendment; the
      pure comparator never emits it — no git, no ledger access"); the
      comparator body is unchanged
- [ ] `packages/agentic-workflow-schema/README.md` + `README.es.md`: the
      `PRE_EXECUTION_FRESHNESS_CODES` export-table row and the Freshness
      section gain `declared-delta` with the same refinement note (AC5
      mirror, same-PR)
- [ ] `packages/agentic-workflow-schema/package.json` version 4.1.0 → 4.2.0;
      one row each in `CHANGELOG.md` + `CHANGELOG.es.md` "Companion npm
      packages" tables; `bun run build` regenerates `dist/`
- [ ] `cd packages/agentic-workflow-schema && bun run test` → exit 0, fail 0

### P2 — Sensor classifies declared ledger-state deltas

Layer: `config/infra`. Done-when: `node --test
scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs
scripts/pre-execution-quality.test.mjs` → exit 0, fail 0.
Phase-lint: PASS (8/8) · fingerprint `P2:config/infra:5:sensor-declared-delta-classification`

- [ ] Red-first `scripts/pre-execution-sensor.test.mjs` (throwaway git
      repository, black-box over the CLI like the existing cases) with the
      six-case matrix: (a) SPEC tick flips committed + declaration rows →
      `current:false`, `structural.reasonCode:"declared-delta"`,
      `declaredDelta.amendments[]` naming commit+path, exit 4; (b) same flips
      without declaration → `stale-source-revision`; (c) flips + one content
      hunk → `stale-source-revision`; (d) uncommitted flips →
      `stale-artifact-content`; (e) bound context moved + flips →
      `stale-context`; (f) declared obligation `status` cell transition →
      `declared-delta`; (g) a forged declaration row naming a commit that never
      touched the path → `stale-source-revision`; run the suite at pre-fix
      bytes → red (O2's red-first proof; paste the red output in the phase's
      progress entry)
- [ ] `scripts/pre-execution-snapshot.mjs`: parse the unit's
      `## Ledger-state amendments` rows from `progress.md`; add
      `classifyLedgerStateDelta(git, recordedSource, changedPaths)` — per
      changed bound path: the total diff hunks are all tick-flip
      (checkbox-token-only) or single-cell obligation-status transitions (both
      values in the closed vocabulary), `ACCEPTANCE.md` never in-class, and
      every commit in `git log <recorded>..HEAD -- <path>` is named by a
      declaration row for that path; `attributeFreshness` gains the optional
      `declaredDelta` parameter and answers `declared-delta` ONLY at the
      `stale-source-revision` slot (precedence 6) when the classification
      passes, naming commits+paths in the detail; `main()`'s verify path passes
      the classification and the report carries the `declaredDelta` payload;
      `current` stays `false`, exit code stays 4; the file header docstring
      names the refinement
- [ ] `scripts/pre-execution-attribution.test.mjs`: the parity table gains the
      documented divergence case — the sensor refines precedence 6 to
      `declared-delta` for the declared class (git-backed-only, cited to the
      schema comment), and answers the comparator's own code for every
      undeclared/content case (dimension-by-dimension parity preserved)
- [ ] Update any remaining suite pin enumerating the freshness list red-first
      (grep) so the whole vocabulary stays pinned
- [ ] `node --test scripts/pre-execution-sensor.test.mjs
      scripts/pre-execution-attribution.test.mjs
      scripts/pre-execution-quality.test.mjs` → exit 0, fail 0

### P3 — Policy owns the amendment class

Layer: `docs`. Done-when: `node --test scripts/ledger-ownership.test.mjs
scripts/bounded-delivery-loops.test.mjs` → exit 0, fail 0, and the POLICY/LEDGERS/mandate
greps below return ≥ 1 hit each.
Phase-lint: PASS (8/8) · fingerprint `P3:docs:5:amendment-class-policy-ledgers`

- [ ] `skills/pre-execution-review/references/POLICY.md`: new §9
      "Execution-ledger amendments" — the class (tick-state flips of bound
      task/checkbox ledgers; single-cell obligation `status` transitions in the
      closed `planned|in-progress|verified|n/a|deferred` set), declared at
      amendment time in the unit's own execution ledger with commit + paths +
      class; what it never covers (reviewed planning content — intent,
      obligation authority, phase topology, validators — and `ACCEPTANCE.md`,
      blob-bound); the answer semantics (a non-current, non-blocking audit
      answer; every other gate keeps failing closed on `current: false`; the
      receipt is never refreshed and never `declared-delta` at its own write);
      the no-weakening sentence citing §2/§4/§5
- [ ] `skills/pre-execution-review/references/LEDGERS.md`: the declaration
      block format frozen (append-only section in `progress.md`, row shape
      `- <ISO-8601 date> · commit <40-hex> · <bound path> · <tick-flip |
      obligation-status> · <changed-line-count> · by <execute-phase P<k> |
      fold-findings F<k>>`) and the `ledger-ownership@1` `progress` row gains
      `execute-phase:amendment-rows + fold-findings:amendment-rows`
- [ ] `scripts/ledger-ownership.test.mjs` + `scripts/bounded-delivery-loops.test.mjs`:
      red-first pins for the two new writers on the progress ledger; run →
      green with the map change
- [ ] `skills/execute-phase/references/EXECUTION_CONTRACT.md`: the tick rule
      gains the declaration mandate — a commit that only ticks bound-ledger
      state (SPEC/PLAN/TASKS checkboxes, obligation `status` cells) appends the
      matching declaration row to the unit's `progress.md` in the same commit
- [ ] `skills/fold-findings/references/FOLD_PROCESS.md`: the fold step for a
      verify-axis staleness finding records the amendment declaration rows for
      pre-existing tick commits it repairs, citing them; a declaration is a
      record of fact (the commits exist, their diffs are in-class), never a
      reclassification of a content delta

### P4 — Route and audit consume the class

Layer: `docs`. Done-when: `node --test scripts/review-loop-discipline.test.mjs
scripts/audit-pr-receipt.test.mjs` → exit 0, fail 0, and the compat grep (O12)
returns 0 hits.
Phase-lint: PASS (8/8) · fingerprint `P4:docs:5:verify-axis-route-audit-consumers`

- [ ] `skills/review-implementation/references/CLASSIFY.md`: new "Verify-axis
      receipt findings" rule after the decision table — a `verify`-axis finding
      whose defect is process-expected receipt staleness (declared ledger-state
      class) + docs/progress claim inaccuracy classifies `fix-now` with the
      `fold-findings` route (mechanical docs correction + amendment
      declarations + re-verify at head); the plan re-review route is reserved
      for findings citing a content delta in reviewed planning material or an
      undeclared/out-of-class delta; the rule is pinned by the discipline test,
      not reviewer taste
- [ ] `scripts/review-loop-discipline.test.mjs`: red-first pins for the new
      CLASSIFY rule; run → green
- [ ] `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md`: the lineage
      gate's step 1 gains the declared-delta answer — the verify JSON answers
      `structural.reasonCode: "declared-delta"` with a non-empty declared
      amendment list → **warning** (non-blocking; the audit reports the gate as
      warned with the amendment list; MERGE-READY stays reachable); the BLOCKED
      enumeration "Stale, missing, wrong-stage **or impossible-timeline**" is
      unchanged and does not include `declared-delta`
- [ ] `skills/audit-pr/SKILL.md`: the lineage turn-contract box and the
      Step-1/gate prose acknowledge `declared-delta` as the declared
      non-blocking warning; no other gate's treatment changes
- [ ] Compat pin: grep `declared-delta` under `skills/execute-phase/references/`
      and `skills/workflow-status/` → 0 hits (O12), and update
      `scripts/audit-pr-receipt.test.mjs` red-first if it pins the lineage
      blocker set; run both suites → fail 0

### P5 — Release hygiene

Layer: `docs`. Done-when: `node scripts/check-skill-context.mjs --routes` →
exit 0, and the full gate (schema `bun run test`, pi `npm test`,
`node --test scripts/*.test.mjs`) reports fail 0.
Phase-lint: PASS (8/8) · fingerprint `P5:docs:4:release-hygiene-bundle-budgets`

- [ ] Minor bumps for every touched skill — `pre-execution-review` 2.1.0 →
      2.2.0, `review-implementation` 1.7.0 → 1.8.0, `execute-phase` 4.4.0 →
      4.5.0, `fold-findings` 1.3.0 → 1.4.0, `audit-pr` 5.1.0 → 5.2.0 — each
      with a row in `CHANGELOG.md` + `CHANGELOG.es.md`
- [ ] `npm run bundle:skills` in `packages/pi-agentic-workflow` after the last
      `skills/**` edit of this unit (the committed mirror stays byte-identical
      to `skills/`) + pi package version 0.6.0 → 0.7.0 with its changelog rows
      + `npm test` in the pi package → fail 0
- [ ] Budgets: `node scripts/check-skill-context.mjs --routes` — for each
      exceeded route first trim redundant added text, then raise the remaining
      exceedance via the declared re-basis in
      `docs/workflow/SKILL_CONTEXT_BUDGETS.json` naming the growth pathway this
      unit actually grows (the shared `pre-execution-review` references) as
      `fix/179` — until the command exits 0
- [ ] Full gate: `cd packages/agentic-workflow-schema && bun run test` → fail
      0; `npm test` in `packages/pi-agentic-workflow` → fail 0;
      `node --test scripts/*.test.mjs` → fail 0

### P6 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #179`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

## Testing

- **Schema (unit/contract):** red-first pins for `declared-delta` membership and
  position; the docs test derives the README table (green only with the EN+ES
  mirror) — `packages/agentic-workflow-schema/test/pre-execution-lineage.test.mjs`,
  `test/pre-execution-docs.test.mjs`.
- **Sensor (integration, black-box CLI in throwaway git repos):**
  `scripts/pre-execution-sensor.test.mjs` — the six-case matrix (declared tick,
  declared status-cell, undeclared, content hunk, uncommitted, context move),
  red-first at pre-fix bytes (O2), exit-code and payload assertions.
- **Parity:** `scripts/pre-execution-attribution.test.mjs` — the documented
  divergence case (declared class) with dimension-by-dimension parity preserved
  elsewhere.
- **Discipline:** `scripts/review-loop-discipline.test.mjs` — the new
  classification rule + every existing no-weakening pin stays green.
- **Ownership:** `scripts/ledger-ownership.test.mjs` +
  `scripts/bounded-delivery-loops.test.mjs` — the two new progress-ledger
  writers.
- **Audit:** `scripts/audit-pr-receipt.test.mjs` — lineage blocker-set pin
  updated if it enumerates the set.
- **Repo gate:** schema + pi suites, all scripts suites, discovery CLI, budgets
  CLI (P5/P6).

## Rollback

`git revert` of the fix PR (or the two commits carrying the sensor
classification and the audit-pr treatment) restores today's fail-closed void:
the declared-delta answer is additive, receipts and ledgers are untouched, and
no data cleanup exists. The schema package drops one enum member (4.2.0 →
4.1.0); downstream consumers that never learned the code keep failing closed —
which is their pre-fix behavior. Nothing is lost: amendment declarations
already written remain honest records in `progress.md`.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)

## Effort

**M** — schema minor release + sensor classification + five skills + pi mirror
+ four red-first suites; multiple commits, ≤ 1 day. Larger than XS/S because it
spans the schema package and the repo sensor with contract tests on both.

## Decisions made during drafting

- **D1 — `declared-delta` is a reasonCode, not a top-level status or a new exit
  code.** Consumers already key on `structural.reasonCode`; the fail-closed
  default survives (an unknown treatment of the new code blocks, which is the
  safe direction); the payload (`declaredDelta.amendments[]`) carries the
  machine-readable detail. `current` stays `false` and exit stays 4 — the
  receipt is genuinely not current; only `audit-pr` learns the warning
  treatment (the issue's own scope).
- **D2 — the class check is total-diff-per-path + intervening-commit coverage,
  not per-commit byte matching.** `git log <recorded>..HEAD -- <path>` must be
  fully covered by declaration rows, and the path's total diff must be
  in-class; byte-matching per declared commit would be rebase-fragile. An
  undeclared commit between → fail closed.
- **D3 — uncommitted ledger-state ticks fail closed** (`stale-artifact-content`):
  the declaration requires a commit; declaring uncommitted state would make the
  class unfalsifiable and break the write-then-commit discipline.
- **D4 — `ACCEPTANCE.md` is excluded from the class.** The acceptance manifest
  is blob-bound (verification contract); its receipt gate independently fails
  closed on any byte change, so the classification never sees it as in-class.
- **D5 — retro declarations are records of fact, written by the fold route.**
  Historical units (fix-162) ticked before the class existed; a fold of a
  verify-axis staleness finding may declare the existing commits (they exist,
  their diffs are provably in-class), never reclassify content.
- **D6 — `execute-phase`'s gate and `workflow-status` 6a stay fail-closed.** The
  issue scopes the consumer change to `audit-pr`; changing the mid-unit-resume
  treatment is a separate bounded decision (out-of-scope bullet routes it to
  the owner).
- **D7 — the pure comparator never emits `declared-delta`** (no git, no ledger
  access): the code is published at precedence 6's slot as a
  git-backed-only refinement, mirroring the `impossible-timeline` precedent
  (PE-007), and the parity test owns the documented divergence case.
