# Progress — 31-planning-review-materiality

Product-half independent review (`review-spec`), 2026-09-17. Fresh context;
this conversation never authored or edited the reviewed Product half.

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality @ cf238040
- 3 product decisions a hostile reader could call invented:
    1. D-31-1 planning-side `low` persists as a report-note (the code side's
       `low` is never persisted) — recorded decisions.md D-31-1, authority
       issue #171 item 1 ("persisted and visible, but non-blocking")
    2. D-31-2 the cap terminates in the existing `NEEDS-DESIGN` verdict, no new
       terminal label — recorded decisions.md D-31-2, authority issue #171
       item 2 ("the loop ends in NEEDS-DESIGN")
    3. D-31-4 one materiality line for both stages (material = `medium`+) —
       recorded decisions.md D-31-4, authority issue #171 item 1
       ("Material = `medium`+")
  → all three point to dated decisions.md rows with stated authority; none
    invented. D-31-3 (wording-only skips only the re-review act) and D-31-5
    (AD-008 reconciliation) are likewise recorded with rationale and owner.
- User outcome with no observable check: business goal 1 ("cut the cost of a
  planning review cycle") is economic, not itself observable; its observable
  proxies are AC1/AC2 (a `low` row no longer gates) and AC6 (wording-only routes
  past the re-review). No finding: for an economics goal the rule-level pins are
  the observable contract, and they exist.
- Role the matrix leaves unspecified for a capability it lists: none — 5 derived
  roles × 5 capabilities (C1–C5), every cell explicit `allowed`/`denied`.
- What would have to be true in the repository for this half to be wrong, and is
  it true?:
    a) the planning materiality line already moved → false: `LEDGERS.md:93`
       still reads "`info` is the only immaterial one"
    b) POLICY §3 already routes a cosmetic batch past re-review → false: the
       §3 opening paragraph still mandates "a single re-review of the resulting
       snapshot" (line 47 is the wording-only row itself)
    c) the code-side floor is not test-pinned → false:
       `scripts/review-loop-discipline.test.mjs` §1/§4 assert report-only `low`,
       `classify it at \`med\` minimum`, `LOOP CAP REACHED`, `third cycle never
       starts` (lines 33–43, 67, 317)
    d) dependency 29 is unmerged → false: ROADMAP row 29 reads `done · #175`
       and commit `1cd06f4f` (#175) is an ancestor of HEAD
    e) `docs/CAPABILITIES.md` carries live roles/subsystems → false: it is the
       unseeded template (`<role>`, `<yes|no|partial>` placeholders)
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

## Product checks — fixed list, one result each

Snapshot `735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a` @
source revision `cf2380405cb08fa4a4ff578a9e0779eeb02542d9` (`spec-product-v1`
projection digest `14d23401222e9d8ab9090ac917cee3268bfb90fdcc7551f3ada9616328a094d9`).

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Business goals state the outcomes (cost, structural termination, preserved honesty), and each of the 6 In-scope items maps to ≥1 objective AC: 1→AC1/AC2, 2→AC3, 3→AC4/AC5/AC7, 4→AC6, 5→AC9/AC11, 6→AC13; every AC is a grep/test/read-verified observation |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5), every cell explicit `allowed`/`denied`, no unlisted role; trigger owners named (reviewer files, author repairs, human keys cycle 3, reviewer issues `NEEDS-DESIGN`) |
| C3 | Entity closure | pass | E1 (planning finding row), E2 (wording-only determination), E3 (cycle counter) each resolve create/read/update/delete/transitions to a named surface + test; zero blank rows; every `n/a` carries a reason (append-only / derived value) |
| C4 | Limits and failure states | pass | Limit: the hard two-cycle cap; failure states resolved — unconverged loop → `NEEDS-DESIGN`, mislabeled defect → reclassify at `medium` minimum (anti-deflation), concurrent reviewers → union rule preserved (Out of scope bullet 1), report-note-only ledger → no repair batch or re-review (In scope 1 + 4); size `M` stated |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract (§1/§2/§8, snapshot binding), the owning feature (#159, code side), or an explicit exclusion (schema package, retroactive rows, sensor mechanics); nothing excluded by silence |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (no live inventory), so the 11-row derived inventory is recorded in the section and walked one row per subsystem; each row resolves to a test, `n/a` with reason, or a named owner (`audit-docs`) |
| C7 | Expectation sweep | pass | 16 resolved rows (≥10 for `M`), each forced to `in-scope`/`out-of-scope` with a pointer; zero unresolved rows |
| C8 | Acceptance objectivity | pass | AC1–AC13 are objective and labelled command-verified or `read-verified` (AC4/AC6/AC8/AC13 carry the read-verified half); every In-scope bullet maps to ≥1 AC |
| C9 | Internal contradiction | pass | The materiality line is consistent across Goal, In scope 1/2, D-31-1/D-31-4, Out of scope 2, and the capability/role matrix; the terminal verdict stays the existing `NEEDS-DESIGN` (no new label); the four preserved contracts appear as preserved-only in both In scope and Out of scope |
| C10 | Repository contradiction | pass | Claims re-read at `cf238040`: `LEDGERS.md:93` "`info` is the only immaterial one"; POLICY §3 wording-only row (:47) + §3 opening "a single re-review of the resulting snapshot"; POLICY §4 second-cycle `CONVERGENCE-ANOMALY` (:62) and "no cap converts a verdict into a dead end" (:83); `REPAIR.md:64-65,71`; both `CHECKS.md` "Material = anything above `info`" lines; both `OUTPUT.md` "Material findings open: 0"; ROADMAP row 29 `done · #175`. Two grounding citations are imprecise → finding N31-001 (`info`), no material defect |
| C11 | Evidence integrity | pass | Every decisions.md evidence row is `proven`/`decision` + `current` with a location and revision; no `unknown`, `drifted`, or `stale` row survives; issue #171 (OPEN) and both fetched documents resolve to dated rows. The one location/literal imprecision is N31-001 (`info`) |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none`; D-31-5 is an invariant-reconciliation question with a named owner (`resolve-repository-state`) and a conditional trigger, not an open product choice of this unit |
| C13 | Engineering leakage | pass | The Engineering half is the empty template; the Product half cuts no phases, tasks, architecture, or validators — the exact `review-loop-discipline.test.mjs` pin diff is explicitly deferred to the Engineering half (decisions.md §Open questions) |
| C14 | Obligation containment | pass | No current-unit obligation is exported: the README citation is in-unit (implementation PR, AC13), version bumps/pins in-unit (AC9/AC11/AC13), and the AD-008 amendment is conditional and owner-routed, not deferred work |

Findings: 2 (both `info`, class `product`, material open: 0) — see
`planning-findings.md` rows N31-001/N31-002.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-1 · Snapshot: 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a · Verdict: spec-review-pass
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: cf2380405cb08fa4a4ff578a9e0779eeb02542d9 · Artifact revision: cf2380405cb08fa4a4ff578a9e0779eeb02542d9
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T00:00:00Z/2026-09-17T00:04:00Z · Findings: 2 (material open: 0)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 28807 · digest 14d23401222e9d8ab9090ac917cee3268bfb90fdcc7551f3ada9616328a094d9 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 14/14 pass — C1–C14; falsification NO-CONFIRMED-GAPS; N31-001/N31-002 are `info` and route to design-feature without blocking
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-1` (SPEC `## Design
  status`; decisions.md header). No runtime rotates `artifactRevisionId` in this
  environment, and the recipe owner's `verify` re-derives it, so the receipt's
  `Artifact revision:` field binds the builder's digest-derived value
  `cf238040…`; the handoff label `31-spec-1` stays recorded here (same
  reconciliation feature 37 recorded for its `37-plan-N` labels).
- The reviewed unit directory and the ROADMAP row were committed as the
  authoring state (`cf238040`, "docs(31): design planning-review-materiality
  product half (#171)") before the snapshot was built — the builder's own
  refusal text requires the bound artifacts to be committed (or an explicit
  `--source-revision`/`--artifact-revision`), because a snapshot over untracked
  bound bytes is reported as drift by construction. No reviewed byte changed.
- Governance issue #171 (OPEN) was read from the forge as routing data; the
  snapshot's context rows are the builder's canonical set
  (`architectural-invariants: absent`, `normalized-repository-state: present`,
  `project-guide: present`). The roadmap row is deliberately unbound.

## Verdict

```text
SPEC-REVIEW-PASS — 31-planning-review-materiality
- Snapshot: 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a · Artifact revision: cf2380405cb08fa4a4ff578a9e0779eeb02542d9 · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": true,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-1",
    "verdict": "spec-review-pass",
    "snapshot": "735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — fresh and current; no fix-and-re-run round was needed.)

Out-of-scope observation (not a finding against this half; no row written): the
reviewer's own `skills/review-spec/references/CHECKS.md` §1 prose lists five
context kinds (`governing-issue`, `normalized-repository-state`,
`architectural-invariants`, `dependency-unit`, `project-guide`) while the
machine contract binds three (`CONTEXT_SOURCES` in
`scripts/pre-execution-contract.mjs`). The drift predates this unit, belongs to
the snapshot-owning surface (feature 28), and is outside #171's scope; recorded
here so it is not lost.

---

# Plan review (`review-plan`), 2026-09-17

Fresh context; this conversation never authored or replanned the reviewed
Engineering half.

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality plan @ 31dd3681
- 3 Engineering claims a hostile reader could call invented rather than evidenced:
    1. E7 / AC12 / PE-012 say the Pi mirror is re-bundled with `bun run
       bundle:skills` (root form). Repository evidence contradicts it: no root
       `package.json` exists and `bun run bundle:skills` exits 1 (`Script not
       found`); the script is declared in
       `packages/pi-agentic-workflow/package.json` (`bundle:skills`).
       → CONFIRMED GAP (F01).
    2. In-scope 5 / E6 / AC1–AC2 validators: the planning-side pins are the
       feature's enforcement. Evidence: `bun test
       scripts/review-loop-discipline.test.mjs` exits 0 with those pin sections
       absent, so no frozen AC distinguishes "pins green" from "pins absent".
       → CONFIRMED GAP (F02).
    3. E-D31-1 (one bump per skill per PR): an engineering reading of
       CLAUDE.md §"Version every change", recorded with authority and rationale
       (decisions.md E-D31-1). Not invented — no finding.
- A SPEC obligation this plan cannot deliver, and where it silently died:
    none — AC1…AC13 map one-to-one onto O1…O13; O14 carries the AD-008 invariant.
- One phase whose deliverable could be accepted while its validator passes for
  the wrong reason: P1 (and P2/P3) — the done-when is `bun test
  scripts/review-loop-discipline.test.mjs` → exit 0, which holds with or without
  the phase's own red-first pin work. → F02.
- If every phase shipped exactly as written, what would still be broken, and is
  that in scope? P4's mirror task: `bun run bundle:skills` exits 1 before the
  mirror is written, so AC12's "bundle ran" outcome cannot be produced as
  written. In scope (In-scope 5 + AC12). → F01.
- Which failure state has no scenario, or a scenario no validator runs?
    `loop:dup-finding` is covered only by a read-verified walk of unchanged text,
    and every scenario whose validator is a "discipline suite … pin" is vacuous
    when the pin section is absent. → F02.
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b` @
source revision `31dd36817d781bdda1c8645a3e1262123c2decc0`.

| # | Check | Result | Evidence |
|---|---|---|---|
| L1 | Parent current | pass | `spec-review-31-1` exists, snapshot `735e758…170a` equals `parentSpecSnapshotDigest`; `verify --stage spec` re-derives the identical Product projection digest (`digestMatches: true`) and names no moved context — the only moved bound path is `SPEC.md` whole-file, i.e. the Engineering half this plan added after the Product snapshot (`spec-product-v1` selects only the Product half). The receipt records the digest-derived `Artifact revision: cf238040…` while the handoff label is `31-spec-1`; that reconciliation was recorded and accepted by `review-spec` itself (progress.md artifact-revision notes, same environment). No `resolve-repository-state` trigger |
| L2 | Evidence integrity | pass | PE-001…PE-017 all `current` + `proven`/`decision`; no `unknown`, `drifted`, or `stale` row; every cited `path:line` re-read on disk (PE-001 `LEDGERS.md:93`, PE-002 `CHECKS.md:104`/`:105`, PE-003 `POLICY.md:41-47`, PE-004 `POLICY.md:53-84`, PE-005 `REPAIR.md:57-71`, PE-006 `OUTPUT.md` ×2, PE-007 suite lines, PE-014 ROADMAP row, PE-015 grep empty, PE-016 schema) |
| L3 | Obligation completeness | pass | O1…O13 are one row per AC1…AC13, O14 is the AD-008 invariant; no duplicate, no missing normative behaviour, no `deferred` row |
| L4 | Obligation mapping | pass | every row names one phase, one task, `execute-phase`, a validator copied from `ACCEPTANCE.md`, and required-evidence; every status `planned`, none blank |
| L5 | Scenario ↔ validator ↔ phase closure | finding | every scenario names a phase, and the SPEC's six failure categories are all covered — but the scenarios whose validator is a "discipline suite … pin" (F02) can be "exercised" by a suite that does not contain them: `bun test scripts/review-loop-discipline.test.mjs` exits 0 over the unmodified file. A validator that passes on a no-op is a finding |
| L6 | Findings ledger honest | pass | N31-001/N31-002 are `open`, `info`, class `product`; no open material row is carried into execution; no `dismissed` row; resolution-evidence column present and empty |
| P1 | Architecture | pass | affected surfaces carry `path:line` rows (planning-evidence PE-001…PE-007; Architecture impact restates them) and the invariant classification line is present: `Preflight: NRS consumed · invariant classification: n/a: no project invariants declared (F010) — AD-008 preserved (D-31-5)` |
| P2 | Dependency closure | pass | hard dependency 29 is `done · #175` (merged); no phase depends on unwritten work; no other dependency |
| P3 | Compatibility | pass | preserved contracts stated with the row that proves each was considered: union/counter-evidence/independence (`POLICY` §1/§2 untouched, Out-of-scope 1), severity vocabulary + schema (`AC10`, PE-016), receipt literal + verdict grammar (PE-010, `normative-drift`), code-side loop (`Out-of-scope` 3) |
| P4 | Security | n/a | docs-layer plan: no secret, credential, user input, authn/authz, PII, or new dependency surface is created; the only code executed is the repository's own suites and the bundle script |
| P5 | Migration | pass | forward path: the bumped skills take effect at each unit's next planning review; legacy adoption rule stated (no retroactive reclassification — Out-of-scope 5, `known-issues.md` 5, `POLICY` §6 unchanged); who runs it: `execute-phase` (P4). EN/ES sync n/a (English-only interim, no `.es.md` sibling exists) |
| P6 | Recovery | pass | each phase is one atomic commit whose done-when (the discipline suite) is re-runnable; a mid-write interruption leaves the red-first pins failing or the suite green, either way telling what landed; `progress.md` is the per-phase receipt surface |
| P7 | Rollback | pass | `Deploy & rollback` states the executable revert set (revert the PR, mirror included, since it re-bundles in the same PR); no stored data, so no migration reversal; out-of-band limit stated (rules bind at the next review, never retroactively) |
| P8 | Operability | pass | after delivery the behaviour is visible through the deterministic pins and the AC1–AC13 greps; `workflow-status`/sensor reporting is unchanged and covered by AC11 + the sensor suite |
| P9 | Phase atomicity and order | pass | `node scripts/phase-lint.mjs PLAN.md` re-run here: P1–P4 PASS (8/8) with the SPEC's pasted fingerprints and aggregate `db27c41e…f406` byte-identical; order matches the single dependency closure; P4 is hardening/close-out |
| P10 | Validators | finding | F01: AC12's validator (and the P4/TASKS/testing mirror step) `bun run bundle:skills` cannot execute at the repository root — `error: Script not found "bundle:skills"`, exit 1. F02: the pin validators pass on a no-op. All other gates verified real: `bun test` (112 pass), `bun scripts/check-skill-context.mjs` (exit 0), schema suite (707 pass), phase-lint (PASS). The Pi package suite could not run here (its `node_modules` is not installed → `tsc: command not found`); environment, not a plan defect |
| P11 | Scenario coverage | pass | the six fixed categories are all covered (empty/zero; invalid input ×2; permission denied; limit hit; concurrent/duplicate ×2; outage/dependency n/a with reason) and each maps to a phase + validator in `testing.md` |
| P12 | Source evidence | pass | the plan's file/version/status claims match the repository at `31dd3681`: `LEDGERS.md:93`, `CHECKS.md` ×2, `POLICY.md` §3/§4, `REPAIR.md:64-65,71`, `OUTPUT.md` ×2, the four versions (2.2.1/1.7.1/1.6.1/3.4.0), the ROADMAP row 29, and `git hash-object ACCEPTANCE.md` = `f220c1dd…` all re-verified. The command-path claim is F01 (P10), not a file/symbol claim |

Findings: 3 (material open: 2) — see `planning-findings.md` F01 (medium), F02
(medium), F03 (info).

## Prerequisite commit (disclosed)

The plan authoring state was **uncommitted** at hand-off (SPEC.md/decisions.md/
ROADMAP.md modified; the eight M/L artifacts untracked), so a snapshot built over
those bytes has no commit covering them and `verify` reads them as drift by
construction. This reviewer committed those exact bytes, unchanged, as
`31dd3681` ("docs(31): engineering plan — fill the half, freeze ledgers, cut 4
phases") — the same prerequisite `review-spec` recorded for its own snapshot and
feature 59's authoring commit. No reviewed byte changed; writing evidence and
committing it is this turn's only other write.

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-31-1 · Snapshot: 459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b · Verdict: plan-review-fail
- Unit: 31-planning-review-materiality · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a · Parent Product receipt: spec-review-31-1
- Source revision: 31dd36817d781bdda1c8645a3e1262123c2decc0 · Artifact revision: 31dd36817d781bdda1c8645a3e1262123c2decc0
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (2026-09-17 authoring turn)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T09:41:00Z/2026-09-17T09:48:30Z · Findings: 3 (material open: 2)
- Ledgers read: planning-evidence 17 rows · obligations 14 rows (verified-capable: 0)
- Prior plan receipt (re-review only): none — first cycle
```

Artifact-revision notes:

- The planner's handoff label is `31-plan-1` (PLAN.md header, SPEC Engineering
  half, decisions.md). No runtime rotates `artifactRevisionId` in this
  environment, so this receipt binds the builder's digest-derived value
  `31dd3681…` — the same reconciliation `review-spec` recorded for `31-spec-1`
  and feature 52's plan receipts recorded for `52-plan-N`. The label stays
  recorded here.
- `verify --stage spec` currently answers `fresh: false / stale-artifact-content`
  naming `SPEC.md` whole-file. That is the verifier's whole-file granularity for
  the `stage: spec` artifact row: the Engineering-half fill moved `SPEC.md`
  bytes while the `spec-product-v1` projection digest stayed identical
  (`digestMatches: true`) and no context moved. Not a defect of this plan.

Self-check (`verify --stage plan`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "plan",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "plan-review-31-1",
    "verdict": "plan-review-fail",
    "snapshot": "459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — the write landed, `structural.fresh: true`; `current` is false because
the verdict is a FAIL, which is the expected emit result and routes per the
verdict.)

## Verdict

```text
PLAN-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: 459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b · Artifact revision: 31dd36817d781bdda1c8645a3e1262123c2decc0
- Failed checks: L5, P10
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | F01 | medium | plan | P10 | AC12's validator / P4's mirror step `bun run bundle:skills` exits 1 at the repo root (no root package.json); the script lives in `packages/pi-agentic-workflow` | ACCEPTANCE.md AC12 + Commands; SPEC Testing requirements; testing.md Pi-distribution row; PLAN.md/TASKS.md P4 task 2; PE-012; `packages/pi-agentic-workflow/package.json`; observed exit 1 | verified |
  | F02 | medium | plan | L5 | No frozen validator verifies the new discipline pins exist; the suite exits 0 over the unmodified file, so P1–P3 done-whens and AC1/AC2/AC9 pass with the enforcement absent | ACCEPTANCE.md AC1/AC2/AC4/AC6/AC9/AC11; testing.md scenario rows; PLAN.md P1–P3 done-whens; `bun test scripts/review-loop-discipline.test.mjs` → exit 0 (unmodified) | verified |
  | F03 | info | plan | P10 | AC8's file-list guard names "the surfaces enumerated in In scope", but the required P4 writes also touch the Pi mirror, four `SKILL.md` version lines, README Skills cells, and CHANGELOG.md | ACCEPTANCE.md AC8; SPEC `#### In scope` + Integration-closure mirror row; PLAN.md P4 tasks 1/2/5; PE-012 | verified |
- Repair owner: `plan-feature 31-planning-review-materiality` — one batch over this whole set
- Parent state: current
```

---

# Plan repair batch (`31-plan-2`), 2026-09-17

Route: `plan-feature 31-planning-review-materiality` — the repair owner
`plan-review-31-1` named, commissioned by the user as one batch over F01 + F02
(+F03). Loaded contract: `replan-findings` + its `references/PHASE_APPEND.md`
(the finding already pins the scope; no planning preflight was consumed).

Router disclosure (recorded, never silently worked around):
`node scripts/unit-route.mjs 31-planning-review-materiality` answers
`route: execute` (`open-rows: 0`) because it reads the unit's
`review-findings.md` — the code-side fix-now fold ledger, which this unit does
not have — and is blind to the stage-aware `planning-findings.md` where
plan-class rows live. The unit's plan review is nevertheless a FAIL with two
open material rows and `execute-phase`'s own pre-execution gate would refuse
these bytes, so the commissioned repair followed the verdict's named repair
owner instead of the router's line. This is a routing-surface gap in the
`unit-route` family (its `replan` route is unreachable for plan-class rows),
reported for triage rather than fixed in this unit's scope.

No phase had executed (roadmap row `planned`, no `in-progress` transition, no
phase commit), so each repair landed in the phase that owns the surface — an
in-place re-cut, no ledger-order change, no new number:

- **F01 (medium, P10)** — the bundler command is spelled from the package that
  owns the script everywhere: AC12 + `## Commands`, `### Testing requirements`,
  the Pi-mirror Integration-closure row, PE-012 (re-observed) + new PE-018,
  `PLAN.md`/`TASKS.md` P4 task 2, `testing.md`, obligation O12. `CLAUDE.md`'s
  parsed `normalizer-inventory@1` row stays untouched (E-D31-6).
- **F02 (medium, L5)** — new AC14 and a declared `PLANNING_PIN_TABLE` with a
  row floor (`PLANNING_PIN_FLOOR` 4 after P1, 8 after P2, 9 at the PR head) and
  a discrimination leg (`assertDiscriminating(`), so an absent, empty,
  truncated, or trivially-true pin set reddens the suite. P1 gained two tasks
  (6 → 8), P2/P3 raise the floor, every done-when runs the presence check, P4
  runs AC14. Carried by AC1–AC4, AC6, AC7, AC9, AC11, In-scope 5, Design E6,
  `### Testing requirements`, the new `loop:pin-vacuous` scenario row, PE-019,
  obligation O15 and E-D31-5.
- **F03 (info, P10)** — the SPEC now declares the derived-surface set (Pi
  mirror, four `version:` lines, README skill-table cells, `CHANGELOG.md`) and
  AC8 + O8 + P4 task 5 walk it per path (E-D31-7).
- **Evidence integrity, same act** — PE-016's obligation cell cited a
  non-existent `O15`; corrected to `O10`. `decisions.md` gains E-D31-5…E-D31-7
  and its header records the two revisions.

Artifact revision: `31-plan-1` → **`31-plan-2`** (one write, one new id for the
whole touched set; `PLAN.md` header, SPEC Engineering-half header, decisions.md).
`planning-findings.md` rows F01/F02/F03 are `resolved` with
`resolving-artifact-revision: 31-plan-2`; N31-001/N31-002 stay `open` (product
class, `design-feature`'s owner).

`ACCEPTANCE.md` re-freeze (user-authorized by the repair commission; SPEC
`## Amendments`): AC1–AC4/AC6/AC7/AC9/AC11 anchored to the pin table, AC8
widened to the derived-surface set, AC12 re-pointed to the package-root
bundler, AC14 added. Blob: `git hash-object` →
`d85e217acad1322d3caf4968715ef5d00e9189c0` (scaffold-time value
`f220c1dd432125a9524dd37d7286202d58d8a731`), recorded in `PLAN.md`.

Re-lint (`node scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md`):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:docs:8:move-planning-materiality-line-to-report-note-semantics
P2 Phase-lint: PASS (8/8) · fingerprint P2:docs:7:end-planning-repair-loop-at-hard-two-cycle-cap
P3 Phase-lint: PASS (8/8) · fingerprint P3:docs:3:route-wording-only-repairs-past-full-snapshot-re-review
P4 Phase-lint: PASS (8/8) · fingerprint P4:hardening:10:qualify-planning-review-materiality-unit
verdict PASS
fingerprint: 5465f0aa8251f530682fb74a0843c36d82561624c76ced06c2122cfa85e40798
```

`plan-review-31-1` is invalidated by design (its snapshot no longer describes
these bytes): only a fresh `/review-plan 31-planning-review-materiality`
restores currency. No source edit, no fold, no branch change, no `review-findings.md`
write, and no `skills/` edit — so no Pi mirror re-bundle and no version bump
belong to this batch.

---

# Plan re-review (`review-plan`), 2026-09-17

Re-review of the `31-plan-2` repair batch — cycle 1's repair/re-review, no cycle
cap consumed, so no `CONVERGENCE-ANOMALY` is due. Fresh context; this
conversation never authored or replanned the reviewed Engineering half.

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality plan @ a3012f86
- 3 Engineering claims a hostile reader could call invented rather than evidenced:
    1. The SPEC Engineering half states the plan descends from `spec-review-31-1`
       @ `735e758…` and that this was "verified fresh against the bytes on disk by
       `pre-execution-snapshot.mjs verify --stage spec`". Re-deriving now
       contradicts it: the `spec-product-v1` projection digest moved from
       `14d2340…` to `c09b28aa…` because the `31-plan-2` repair edited the Product
       half. → CONFIRMED GAP (R31-01).
    2. `planning-obligations.md` `O15` claims one obligation over P1/P2/P3; the
       frozen LEDGERS §2 row contract requires exactly one phase and one task.
       → CONFIRMED GAP (R31-02).
    3. AC14/E-D31-5 claim "a no-op suite can no longer satisfy AC1–AC3, AC9 or
       AC11". The floor (≥9 rows) and liveness legs are real and the suite runs
       them; the discrimination leg compares a `must` regex to an author-supplied
       `superseded` sample, so a dishonest sample could stay vacuous — but the P4
       read-verified suite-diff walk covers that residue. Not a confirmed gap: a
       residual author-honesty limit, not a missing mechanism.
- A SPEC obligation this plan cannot deliver, and where it silently died: AC8
  (O8) — the scope walk is a whole-diff `git diff main --stat` but the branch diff
  also carries the unit's own records and the ROADMAP row, which neither In-scope
  nor the derived-surface set enumerates. → R31-03.
- One phase whose deliverable could be accepted while its validator passes for
  the wrong reason: P4's AC8 walk — the criterion is unsatisfiable as literally
  worded, so a walk that silently excludes the unit's own files "passes" it.
  → R31-03.
- If every phase shipped exactly as written, what would still be broken, and is
  that in scope? The plan would be executed against a Product parent that no
  longer exists (L1) — in scope, and blocking.
- Which failure state has no scenario, or a scenario no validator runs? The
  feature's own failure states each have a scenario; the stale-parent lineage
  failure is caught by L1, not by a scenario row — that is the gate working.
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a` @
source revision `a3012f8617549fe5fd73f2e86cf80ab520370e43`.

| # | Check | Result | Evidence |
|---|---|---|---|
| L1 | Parent current | finding | `spec-review-31-1` binds `735e758…` and equals `parentSpecSnapshotDigest`, but the Product bytes moved after the receipt: `selectSpecProduct` digest is `c09b28aa82002cb075b62aa07b0b821fb6a1be8c1a8ce999cd358daa5d0960f2` now vs `14d23401222e9d8ab9090ac917cee3268bfb90fdcc7551f3ada9616328a094d9` at review time, because the `31-plan-2` repair edited the Product half. `verify --stage spec` answers `fresh: false / stale-source-revision` with `changedPaths: [SPEC.md]`. → R31-01 |
| L2 | Evidence integrity | pass | PE-001…PE-019 all `current` + `proven`/`decision` (PE-013 `decision`); PE-016's obligation cell corrected to O10; PE-018/PE-019 added by the repair and re-read; every cited `path:line` re-read on disk (`LEDGERS.md:93`, `CHECKS.md:104`/`:105`, POLICY §3/§4, `REPAIR.md:64-65,71`, OUTPUT ×2, suite lines, ROADMAP row 29, no root `package.json`); no `unknown`/`drifted`/`stale` row |
| L3 | Obligation completeness | pass | O1…O15: AC1…AC14 map one-to-one (AC14→O15) plus O14 for the AD-008 invariant; no missing or duplicated behaviour; no `deferred` row |
| L4 | Obligation mapping | finding | O15 names three phases and three tasks (`P1 (table shell + floor 4), P2 (floor 8), P3 (floor 9)`); LEDGERS §2 requires exactly one phase and one task. → R31-02 |
| L5 | Scenario ↔ validator ↔ phase closure | pass | the six failure categories are covered; every scenario names a phase + validator in `testing.md`; the pin validators can now fail (liveness + discrimination + floor legs, AC14 runs them) |
| L6 | Findings ledger honest | pass | F01/F02/F03 `resolved` with `resolving-artifact-revision 31-plan-2`; N31-001/N31-002 `open`/`info`/product; no `dismissed`; no open material row from the prior cycle |
| P1 | Architecture | pass | affected surfaces carry `path:line` rows (PE-001…PE-007); invariant classification line present: `Preflight: NRS consumed · invariant classification: n/a: no project invariants declared (F010) — AD-008 preserved (D-31-5)` |
| P2 | Dependency closure | pass | hard dependency 29 is `done · #175` (merged, ancestor of HEAD); no other dependency; no phase depends on unwritten work |
| P3 | Compatibility | pass | preserved contracts stated with proving rows: union/counter-evidence/independence (POLICY §1/§2 untouched), severity vocabulary + schema (AC10, PE-016), receipt literal + verdict grammar (PE-010, `normative-drift`), code-side loop (Out-of-scope 3) |
| P4 | Security | n/a | docs-layer plan: no secret, input, authn/authz, PII or new dependency surface |
| P5 | Migration | pass | forward path (bumped skills bind at the next planning review); legacy rule stated (no retroactive reclassification — Out-of-scope 5, `POLICY` §6); who runs it: `execute-phase` (P4); EN/ES sync n/a (English-only interim) |
| P6 | Recovery | pass | one atomic commit per phase; red-first pins fail before the edit and the phase done-when gates the commit; `progress.md` is the per-phase receipt surface |
| P7 | Rollback | pass | `Deploy & rollback` states the executable revert set (revert the PR, mirror included); no stored data; out-of-band limit stated |
| P8 | Operability | pass | the deterministic pins and the AC1–AC14 greps surface the behaviour; sensor/`workflow-status` reporting unchanged |
| P9 | Phase atomicity and order | pass | re-ran `node scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md`: P1–P4 PASS (8/8), aggregate `5465f0aa8251f530682fb74a0843c36d82561624c76ced06c2122cfa85e40798` byte-identical to the SPEC's pasted block; order matches the dependency closure; P4 is hardening |
| P10 | Validators | finding | F01 fixed (every mirror now spells `cd packages/pi-agentic-workflow && bun run bundle:skills`) and F02 materially addressed (declared pin table + row floor + discrimination leg + AC14). Remaining defect: AC8's validator (whole-diff scope walk) cannot hold literally because the branch diff also carries the unit's own records and the `ROADMAP.md` row. → R31-03. All other gates verified real: discipline suite exit 0; `bun test scripts/{ledger-ownership,pre-execution-quality,ledger-provenance,normative-drift}.test.mjs` → 112 pass / 0 fail; `bun scripts/check-skill-context.mjs` → exit 0 (40 skills); phase-lint PASS |
| P11 | Scenario coverage | pass | the six fixed categories are covered (empty/zero; invalid input ×2; permission denied; limit hit; concurrent/duplicate ×2) plus the derived surfaces; each maps to a phase + validator in `testing.md`; `outage/dependency failure` n/a with reason |
| P12 | Source evidence | pass | file/version/status claims match `a3012f86`: `LEDGERS.md:93`, `CHECKS.md:104`/`:105`, POLICY §3/§4, `REPAIR.md:64-65,71`, OUTPUT ×2, versions 2.2.1/1.7.1/1.6.1/3.4.0, ROADMAP row 29 `done · #175`, no root `package.json`, the feature 29/59 bundler precedent. The parent-freshness identity claim is owned by L1 |

Findings: 3 (material open: 2) — see `planning-findings.md` R31-01 (high),
R31-02 (medium), R31-03 (info).

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-31-2 · Snapshot: e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a · Verdict: plan-review-fail
- Unit: 31-planning-review-materiality · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a · Parent Product receipt: spec-review-31-1
- Source revision: a3012f8617549fe5fd73f2e86cf80ab520370e43 · Artifact revision: a3012f8617549fe5fd73f2e86cf80ab520370e43
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature (31-plan-2 repair batch, 2026-09-17)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T10:20:00Z/2026-09-17T10:31:48Z · Findings: 3 (material open: 2)
- Ledgers read: planning-evidence 19 rows · obligations 15 rows (verified-capable: 0)
- Prior plan receipt (re-review only): plan-review-31-1 @ 459264b4a79b078f4731c6082a0e2e8c10d23cc1d6570dc74ece5d2822025a0b
```

Artifact-revision notes:

- The planner's handoff label is `31-plan-2` (PLAN.md header, SPEC Engineering
  half, decisions.md). No runtime rotates `artifactRevisionId` in this
  environment, so this receipt binds the builder's digest-derived value
  `a3012f86…` — the same reconciliation `review-spec` recorded for `31-spec-1`
  and the prior plan receipt for `31-plan-1`. The label stays recorded here.
- `Parent SPEC snapshot` records the receipt the plan was cut against; the
  Product half has since moved, which is exactly finding R31-01.

Self-check (`verify --stage plan`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "plan",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "plan-review-31-2",
    "verdict": "plan-review-fail",
    "snapshot": "e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — the write landed, `structural.fresh: true`; `current` is false because
the verdict is a FAIL, which is the expected emit result and routes per the
verdict.)

## Verdict

```text
PLAN-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a · Artifact revision: a3012f8617549fe5fd73f2e86cf80ab520370e43
- Failed checks: L1, L4, P10
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | R31-01 | high | product | L1 | The `31-plan-2` repair edited the Product half, so the plan descends from a stale `spec-review-31-1`: the `spec-product-v1` projection digest is `c09b28aa…` now vs the receipt's `14d2340…` | `git diff cf238040 a3012f86 -- SPEC.md` (Product-half hunks); `selectSpecProduct` before/after digests; `verify --stage spec` → `fresh:false / stale-source-revision` (`SPEC.md`) | verified |
  | R31-02 | medium | plan | L4 | `O15` names three phases and three tasks in one row (`P1/P2/P3`), violating LEDGERS §2's "exactly one phase and one task" | `planning-obligations.md` O15 row + `## Closure`; `LEDGERS.md` §2 `phase`/`task` cell contract | verified |
  | R31-03 | info | plan | P10 | AC8's whole-diff scope walk cannot hold literally: the branch diff also carries the unit's own planning records and the `ROADMAP.md` row, neither enumerated in In-scope nor in the declared derived-surface set | `ACCEPTANCE.md` AC8; SPEC `#### In scope` + E-D31-7; `PLAN.md`/`TASKS.md` P4 task 5; `git diff --stat main...HEAD` (13 files incl. the unit dir and `ROADMAP.md`) | verified |
- Repair owner: `review-spec 31-planning-review-materiality` first (R31-01, class product → Product-half re-review), then `plan-feature 31-planning-review-materiality` — one batch for R31-02 + R31-03 over the re-derived plan
- Parent state: stale-parent → review-spec first
```

---

# Spec re-review (`review-spec`), 2026-09-17

Re-review of the Product half the `31-plan-2` repair batch edited — the route
`plan-review-31-2` named for R31-01 (`class: product` → Product-half re-review)
so the plan can bind a current Product parent. This is the spec stage's cycle-1
repair/re-review (one review, one re-review), so no cycle cap is consumed and no
`CONVERGENCE-ANOMALY` is due — the same reading `plan-review-31-2` recorded for
its own re-review. Fresh context; this conversation never authored or edited the
Product half, its ledgers, or its acceptance manifest.

Pre-state observed before this reviewer wrote anything (`verify --stage spec`):
`fresh: false / stale-source-revision`, `changedPaths: [SPEC.md]` —
`spec-review-31-1` binds `735e758…` while the Product bytes now sit at
`a3012f86…`. R31-01 confirmed from the sensor, not from prose.

Snapshot built by the recipe owner before any check
(`bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 31-planning-review-materiality`;
stdout first line pasted):

```text
d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e
```

- `stage: spec` · `unitKind: feature` · `unitId: 31-planning-review-materiality`
- `sourceRevision` = `artifactRevisionId` = `a3012f8617549fe5fd73f2e86cf80ab520370e43`
- `artifacts`: `docs/features/31-planning-review-materiality/SPEC.md` · selector
  `spec-product-v1` · bytes 31401 · digest
  `c09b28aa82002cb075b62aa07b0b821fb6a1be8c1a8ce999cd358daa5d0960f2`
- `parentSpecSnapshotDigest`: null · contexts:
  `architectural-invariants: absent` ·
  `normalized-repository-state: present (e1b81e29…)` ·
  `project-guide: present (ff24d7e4…)`

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality spec @ a3012f86
- 3 specific product decisions a hostile reader could call invented rather than
  recorded:
    1. AC14's mechanism — `PLANNING_PIN_TABLE`, the row floor
       `PLANNING_PIN_FLOOR = 9`, and the `assertDiscriminating(` leg — was
       authored by the plan repair batch (E-D31-5), not recorded from issue
       #171; it is now Product-half text.
    2. The declared derived-surface set in `#### In scope` (Pi mirror under
       `packages/pi-agentic-workflow/skills/**`, the four `version:` lines, the
       README skill-table cells, `CHANGELOG.md`) is a plan-stage declaration
       (E-D31-7), not a design-recorded fact.
    3. AC12's parenthetical (no root `package.json`; the bare root form exits
       non-zero) is a plan-stage correction (E-D31-6).
    All three are corrections of recorded repository facts, not invented intent
    — but they are plan-stage writes inside the Product half, which is what
    R31-01 flags. Adjudicated under C13/C10 below.
- The user outcome the SPEC promises that has no observable check: none — every
  In-scope bullet carries ≥1 AC (AC1–AC14).
- One role the matrix leaves unspecified for a capability it does list: none
  found — 5 derived roles × 5 capabilities are all explicit; `audit-pr` appears
  as a ledger reader in E1, inside the declared reader classes, not as a
  capability trigger.
- What would have to be true in the repository for this half to be wrong, and is
  it true? AC8's whole-branch-diff file-list guard would have to be satisfiable
  at the PR head by the correct implementation; it is not. `git diff main --stat`
  at `afd0edab` already lists 13 paths — the unit's own planning records and the
  `ROADMAP.md` row — none of them an In-scope surface, and
  `skills/verification-contract/SKILL.md` §Validator stability forbids a
  validator gating on the branch diff as a whole without enumerating the unit's
  paths or excluding the workflow-mutated surfaces explicitly.
  → CONFIRMED GAP (N31-003).
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e` @
source revision `a3012f8617549fe5fd73f2e86cf80ab520370e43`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Each of the six In-scope bullets states an observable outcome with an AC pointer: report-note semantics → AC1/AC2; anti-deflation → AC3; cap → AC4/AC5/AC7; wording-only route → AC6; pins present + discriminating → AC9/AC11/AC14; bibliography → AC13 |
| C2 | Actors and roles | pass | Derived role inventory (human owner · author turn · reviewer turn · executor turn · drivers & sensors) × C1–C5 capabilities, each cell explicit `allowed`/`denied` (`### Capability closure` §3); no capability lists an unlisted role; E1's `audit-pr` reader sits inside the declared reader classes |
| C3 | Entity closure | pass | E1–E3 resolve CRUD + state transitions to a named test or an explicit `n/a: reason`; zero blank rows; E2's `Read/list` pointer gap stays recorded as `info`/`open` N31-002 |
| C4 | Limits and failure states | pass | Size `M`; failure states each carry a resolution: unconverged loop → `NEEDS-DESIGN` (In-scope 3, AC4/AC5), wording-only misroute → recorded determination + rotation (In-scope 4, AC6), severity deflation → re-classified at `medium` minimum (In-scope 2, AC3), vacuous pin set → floor + discrimination leg (In-scope 5, AC14) |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract (POLICY §1/§2, snapshot binding), the owning feature (#159 = code side), or an explicit exclusion (schema package, retroactive rows, sensor mechanics) → AC8/AC10; nothing excluded by silence |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholder rows only: `<yes\|no\|partial>`), so the 11-row derived inventory is recorded in the half and walked one row per subsystem; each row resolves to a test, an `n/a` reason, or a named owner (`audit-docs`) |
| C7 | Expectation sweep | pass | 16 rows (≥10 for `M`), each forced to exactly one of `in-scope`/`out-of-scope` with a pointer; zero unresolved |
| C8 | Acceptance objectivity | finding | AC1–AC14 are all objective and labelled (`read-verified` on AC4/AC6/AC8/AC13; command otherwise) and every In-scope bullet maps to ≥1 criterion, but AC8's allowed set is incomplete relative to the branch diff it diffs: its pass condition cannot hold for the correct implementation. → N31-003 |
| C9 | Internal contradiction | pass | The materiality line is consistent (Context · In-scope 1/2 · D-31-1 · D-31-4 · Out-of-scope 2 · AC14's 9-row floor vs the pin scope); the terminal verdict stays the existing `NEEDS-DESIGN`; the four preserved contracts appear as preserved-only in both In-scope and Out-of-scope; the derived-surface set is declared once and referenced by AC8 |
| C10 | Repository contradiction | pass | Claims re-read at `a3012f86`: `LEDGERS.md:93` "`info` is the only immaterial one"; `CHECKS.md` material lines (`review-spec:104`, `review-plan:105`); POLICY §3 wording-only row `:47` + §4 `:83`; `REPAIR.md:64`; `review-spec/review-plan OUTPUT.md:68/:83`; no root `package.json` and `bundle:skills` only in `packages/pi-agentic-workflow/package.json:46` (root form exits 1); ROADMAP row 29 `done · #175`; `docs/workflow/REVIEW_AND_CLASSIFY.md` severity grep empty; `docs/CAPABILITIES.md` template; no `docs/architecture/ARCHITECTURAL_INVARIANTS.md`; versions 2.2.1/1.7.1/1.6.1/3.4.0; `README.md` has no `## References` yet |
| C11 | Evidence integrity | pass | Every `decisions.md` evidence row is `proven`/`decision` + `current` with a location; no `unknown`/`drifted`/`stale`. The two repository claims the repair added to the Product half (no root `package.json`; package-root bundler) resolve to the plan-stage evidence home PE-012/PE-018 — the ledger owned by the stage that wrote them — and were re-observed here. N31-001's citation imprecision stays recorded as `info` |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` and its table is empty; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, or architecture. AC14 names acceptance anchors (`PLANNING_PIN_TABLE`, `PLANNING_PIN_FLOOR = 9`, `assertDiscriminating(`) but the pin rows' content, their phase assignment and the suite implementation stay in `PLAN.md`/`TASKS.md`; this is the same criterion-carries-its-command style as AC1–AC13, with the feature 24 precedent of naming a frozen table in a Product half. No Product authority over the plan's cut is exercised |
| C14 | Obligation containment | pass | No current-unit obligation is exported: the README citation is in-unit (AC13, implementation PR), the bumps/pins are in-unit (AC9/AC11/AC13), and the AD-008 amendment is conditional and owner-routed — not deferred work, not a future issue |

Findings: 1 (material open: 1) — N31-003 (`medium`, class `product`) in
`planning-findings.md`; N31-001/N31-002 remain `open`/`info` and do not block.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-2 · Snapshot: d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: a3012f8617549fe5fd73f2e86cf80ab520370e43 · Artifact revision: a3012f8617549fe5fd73f2e86cf80ab520370e43
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature (Product half) + plan-feature (31-plan-2 repair edits)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T10:37:00Z/2026-09-17T10:52:00Z · Findings: 1 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 31401 · digest c09b28aa82002cb075b62aa07b0b821fb6a1be8c1a8ce999cd358daa5d0960f2 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Prior spec receipt (re-review only): spec-review-31-1 @ 735e75876583d0deed58f22f2e05cfde516b4750cfa87ff6d0c088aece72170a
- Checks: 13/14 pass — C1–C7, C9–C14; C8 finding (N31-003); falsification CONFIRMED-GAPS
```

Artifact-revision notes:

- The author label `31-plan-2` (SPEC `## Amendments`, `decisions.md` header) is
  the repair revision; no runtime rotates `artifactRevisionId` in this
  environment, so the receipt binds the builder's digest-derived value
  `a3012f86…` — the same reconciliation `review-spec`, `review-plan` and feature
  37/52 recorded. The label stays recorded here.
- `Parent: null` — a SPEC snapshot roots its own lineage; this re-review replaces
  `spec-review-31-1`, which the sensor now reads as
  `fresh: false / stale-source-revision` (SPEC.md moved).
- Read-only on the reviewed artifact: `SPEC.md`, `decisions.md`, `ACCEPTANCE.md`
  and the roadmap row are byte-identical after this turn. The only writes are
  this receipt and the N31-003 row in `planning-findings.md` (the ledger contract
  requires the reviewer to append findings there).
- No `CONVERGENCE-ANOMALY` is due: this is the spec stage's **cycle-1**
  repair/re-review — one review (`spec-review-31-1`, PASS) and one re-review over
  a changed snapshot — the same count `plan-review-31-2` recorded for the plan
  stage. POLICY §4's anomaly attaches to entering a *second* repair/re-review
  cycle.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-2",
    "verdict": "spec-review-fail",
    "snapshot": "d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — the write landed, `structural.fresh: true` and `digestMatches: true`;
`current` is false because the verdict is a FAIL, which is the expected emit
result and routes per the verdict.)

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e · Artifact revision: a3012f8617549fe5fd73f2e86cf80ab520370e43
- Failed checks: C8
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | N31-003 | medium | product | C8 | AC8 gates on the branch diff as a whole and its declared allowed set omits the unit's own workflow-mutated paths, so the criterion cannot be satisfied by the correct implementation | SPEC `#### In scope` + AC8; `ACCEPTANCE.md` AC8; `skills/verification-contract/SKILL.md:27-33`; `docs/features/27-pi-agentic-workflow/ACCEPTANCE.md` AC16; `git diff main --stat` → 13 unit-record paths at `afd0edab`; R31-03 (plan facet) | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
```

Out-of-scope observation (not a finding against this half; no row written): the
closing route this verdict names (`/design-feature`) is declared for
`review-spec` by the schema's transition row
(`packages/agentic-workflow-schema/src/index.ts:886-900`, `FAIL/needs-design → design-feature`),
while `skills/orchestration-envelope/references/TURN_CONTRACT.md`'s
`hand-off-transitions@1` snippet lists only a subset of pairs (it declares
`review-plan | design-feature` but not `review-spec | design-feature`). The
snippet is not the table's full projection, so this is recorded, not filed.

→ Next: /design-feature 31-planning-review-materiality "widen the AC8 scope guard — enumerate the unit's own records (`docs/features/31-planning-review-materiality/**`) and the `docs/features/ROADMAP.md` row in the declared allowed set, or exclude those workflow-mutated surfaces explicitly, so the whole-branch-diff guard is satisfiable per `verification-contract` §Validator stability" — one repair batch for N31-003,
    then /review-spec 31-planning-review-materiality re-reviews the new artifact revision
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC

---

# Spec re-review — cycle 2 (`review-spec`), 2026-09-17

Re-review of the Product half the `31-spec-2` repair batch rewrote — the route
`spec-review-31-2` named for N31-003 (`class: product` → Product-half repair,
then re-review). Fresh context; this conversation never authored or edited the
Product half, its ledgers, or its acceptance manifest. No reviewed artifact was
modified by this turn.

## Cycle-2 entry (POLICY §4)

Entering the spec stage's second repair/re-review cycle was reported by the
`31-spec-2` repair batch before its edit (POLICY §4 — "printed and routed, never
a stop"; a repair responding to a persisted verdict is never a loop defect). The
block is reproduced here so the durable record carries it; the repair turn's own
note is in `decisions.md` (Product repair batch section).

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-001 + N31-002 (repeated) / N31-003 (new)
- Snapshots: d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e → b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7 (artifactRevisionId a3012f86… → 3e4c7c2d…)
- Missed: AC8's allowed set omitted the workflow-mutated record surfaces (`verification-contract` §Validator stability) — a criterion-stability gap, not a missing obligation
- Owning stage: product
- Why the prior repair failed: the `31-plan-2` batch widened AC8's In-scope + derived-surface groups without completing the criterion's allowed groups, leaving the whole-diff guard unsatisfiable
- Route to owner: design-feature (`31-spec-2` repair batch) → /review-spec re-reviews the new revision
```

Pre-state observed before this reviewer wrote anything (`verify --stage spec`):
`fresh: false / stale-source-revision`, `changedPaths: [SPEC.md]` —
`spec-review-31-2` binds `d93328fe…` while the Product bytes now sit at
`3e4c7c2d…` (`observedDigest: b1cafdbf…`, `digestMatches: false`). N31-003
confirmed from the sensor, not from prose.

Snapshot built by the recipe owner before any check
(`bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 31-planning-review-materiality`;
stdout first line pasted):

```text
b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7
```

- `stage: spec` · `unitKind: feature` · `unitId: 31-planning-review-materiality`
- `sourceRevision` = `artifactRevisionId` = `3e4c7c2d5cbdde6e241db77d37f14906afd88b5e`
- `artifacts`: `docs/features/31-planning-review-materiality/SPEC.md` · selector
  `spec-product-v1` · bytes 33332 · digest
  `5cdbd2f3f2039b1089c14cdce9a3367df9a92720eb0122de822e1693a07f502e`
- `parentSpecSnapshotDigest`: null · contexts:
  `architectural-invariants: absent` ·
  `normalized-repository-state: present (e1b81e29…)` ·
  `project-guide: present (ff24d7e4…)`

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality spec @ 3e4c7c2d
- 3 specific product decisions a hostile reader could call invented rather than recorded:
    1. AC8's third declared group (the workflow-mutated record surfaces) — written
       by the 31-spec-2 repair batch, not the original design; grounded in
       `verification-contract` §Validator stability + feature 27 AC16 precedent
       (decisions.md rows; SPEC `## Amendments` 31-spec-2).
    2. Expectation sweep row 17 — added by the same repair; it restates AC8's
       permitted set, not new intent (In-scope workflow-mutated paragraph).
    3. AC14's mechanism constants (`PLANNING_PIN_TABLE`, `PLANNING_PIN_FLOOR = 9`,
       `assertDiscriminating(`) — plan-stage text (E-D31-5) inside a Product-half
       criterion; adjudicated under C13 (criterion-carries-its-command, feature 24
       precedent), as the 31-plan-2 review recorded.
    All three resolve to dated evidence rows; none is invented intent.
- The user outcome the SPEC promises that has no observable check: none — every
  In-scope bullet carries ≥1 AC (AC1–AC14), and sweep row 17 maps to AC8.
- One role the matrix leaves unspecified for a capability it does list: none —
  5 derived roles × 5 capabilities are all explicit.
- What would have to be true in the repository for this half to be wrong, and is
  it true?
    a) AC8's mechanical anchor would have to fail to reduce the branch diff to
       the governed + derived set → false: `git diff main --name-only -- .
       ':(exclude)docs/features/31-planning-review-materiality'
       ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md'` exits 0
       with no path listed at 3e4c7c2d (the 13-path diff is fully accounted for
       by the excluded group).
    b) the ROADMAP hunk would have to touch more than row 31 → false:
       `git diff main -- docs/features/ROADMAP.md` is the single `idea`→`planned`
       cell of row 31.
    c) `verification-contract` §Validator stability would have to permit
       whole-diff gating → false: `skills/verification-contract/SKILL.md:27-33`
       (v1.2.1) forbids it and names exactly the exclusions AC8 encodes.
    d) `LEDGERS.md:93` would have to have already moved → false: "`info` is the
       only immaterial one" is still on disk.
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7` @
source revision `3e4c7c2d5cbdde6e241db77d37f14906afd88b5e`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Each of the six In-scope bullets states an observable outcome with an AC pointer (report-note → AC1/AC2; anti-deflation → AC3; cap → AC4/AC5/AC7; wording-only → AC6; pins present + discriminating → AC9/AC11/AC14; bibliography → AC13), and sweep row 17 → AC8 |
| C2 | Actors and roles | pass | 5 derived roles (human owner · author turn · reviewer turn · executor turn · drivers & sensors) × 5 capabilities (C1–C5), every cell explicit `allowed`/`denied` (`### Capability closure` §3); no capability lists an unlisted role |
| C3 | Entity closure | pass | E1–E3 resolve CRUD + state transitions to a named surface + test or an explicit `n/a: reason`; zero blank rows; E2's `Read/list` now names both stages' frozen-evidence homes (N31-002 resolved) |
| C4 | Limits and failure states | pass | Size `M`; each failure state carries a resolution: unconverged loop → `NEEDS-DESIGN` (In-scope 3, AC4/AC5), wording-only misroute → recorded determination + rotation (In-scope 4, AC6), severity deflation → `medium` minimum (In-scope 2, AC3), vacuous pin set → floor + discrimination leg (In-scope 5, AC14) |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract (POLICY §1/§2, snapshot binding), the owning feature (#159, code side), or an explicit exclusion (schema package, retroactive rows, sensor mechanics) → AC8/AC10; nothing excluded by silence |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholder rows only), so the 11-row derived inventory is recorded and walked one row per subsystem; each resolves to a test, an `n/a` reason, or a named owner (`audit-docs`) |
| C7 | Expectation sweep | pass | 17 rows (≥10 for `M`), each forced to exactly one of `in-scope`/`out-of-scope` with a pointer; zero unresolved; row 17 carries the workflow-mutated records |
| C8 | Acceptance objectivity | pass | AC1–AC14 are objective and labelled (`read-verified` on AC4/AC6/AC8/AC13; command otherwise); every In-scope bullet maps to ≥1 criterion; AC8's allowed set is now complete — the In-scope, derived, and workflow-mutated record groups — and its mechanical anchor verifiably reduces the branch diff to the governed + derived set (N31-003 resolved) |
| C9 | Internal contradiction | pass | The materiality line is consistent (Context · In-scope 1/2 · D-31-1 · D-31-4 · Out-of-scope 2 · AC14's 9-row floor vs the pin scope); the terminal verdict stays `NEEDS-DESIGN`; the four preserved contracts appear as preserved-only in both In-scope and Out-of-scope; the three allowed groups are declared once and referenced by AC8 + sweep row 17 |
| C10 | Repository contradiction | pass | Claims re-read at `3e4c7c2d`: `LEDGERS.md:93` "`info` is the only immaterial one"; `CHECKS.md` material lines (`review-spec:104`, `review-plan:105`); POLICY §3 wording-only row `:47` + §4 "Entering a **second** cycle…" (`:60-61`) and "no cap converts a verdict into a dead end" (`:83`); `REPAIR.md:64-65`; `review-spec/review-plan OUTPUT.md:68/:83`; no root `package.json` and `bundle:skills` only in `packages/pi-agentic-workflow/package.json:46`; `REVIEW_PROCESS.md:169` `LOOP CAP REACHED`; ROADMAP row 29 `done · #175`; `docs/CAPABILITIES.md` template; no `docs/architecture/ARCHITECTURAL_INVARIANTS.md`; versions 2.2.1/1.7.1/1.6.1/3.4.0; `README.md` has no `## References` yet; `skills/verification-contract/SKILL.md` v1.2.1 §Validator stability; feature 27 AC16 enumerates its own unit dir + `ROADMAP.md`; the `31-spec-2` ROADMAP hunk is row 31 only; git 2.47.3 pathspec exclusion reduces the 13-path diff to empty |
| C11 | Evidence integrity | pass | Every `decisions.md` evidence row is `proven`/`decision` + `current` with a location and observed revision; the `31-spec-2` batch's added rows (validator stability, feature 27 AC16, the 13-path diff observation, `LOGS.md`, git pathspec semantics, the exact-string row) all re-observed on disk; no `unknown`/`drifted`/`stale` row survives; the recorded roadmap status (`idea` @ d63e9b12) is a point-in-time observation of the deliberately unbound, status-machine-mutated `ROADMAP.md` and is not a defect (see out-of-scope observation below) |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` and its table is empty; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, architecture, or validator. AC14 names acceptance anchors (`PLANNING_PIN_TABLE`, `PLANNING_PIN_FLOOR = 9`, `assertDiscriminating(`) but the pin rows' content, phase assignment and suite implementation stay in `PLAN.md`/`TASKS.md`; no Product authority over the plan's cut |
| C14 | Obligation containment | pass | No current-unit obligation is exported: the README citation is in-unit (AC13, implementation PR), bumps/pins in-unit (AC9/AC11/AC13), the AD-008 amendment conditional and owner-routed, and the plan-side mirrors of AC8 are named as re-derived by `plan-feature`, not deferred to a future unit |

Findings: 0 (material open: 0). N31-001/N31-002/N31-003 stay `resolved` at
`resolving-artifact-revision: 31-spec-2`; the plan-stage rows R31-01/R31-02/R31-03
remain `open` for `plan-feature`'s re-derivation batch (out of this stage's
scope). No new row was appended to `planning-findings.md` for this re-review.

Out-of-scope observation (not a finding against this half; no row written):
the `decisions.md` evidence row for roadmap row 31 records `status \`idea\``
observed at `branch head d63e9b12`, while the row now reads `planned` (it read
`defined` by the design commit `cf238040`). The observation was accurate at the
revision it pins, and `docs/features/ROADMAP.md` is deliberately unbound from
the snapshot (`scripts/pre-execution-contract.mjs` `CONTEXT_SOURCES`) precisely
because the status machine mutates it (`idea → defined → planned`) — so this is
ledger convention working, not a stale claim, and no C11 correction is due.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-3 · Snapshot: b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7 · Verdict: spec-review-pass
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 3e4c7c2d5cbdde6e241db77d37f14906afd88b5e · Artifact revision: 3e4c7c2d5cbdde6e241db77d37f14906afd88b5e
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature (31-spec-2 repair batch)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T11:14:00Z/2026-09-17T11:24:00Z · Findings: 0 (material open: 0)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 33332 · digest 5cdbd2f3f2039b1089c14cdce9a3367df9a92720eb0122de822e1693a07f502e · validated: builder (scripts/pre-execution-snapshot.mjs)
- Prior spec receipt (re-review only): spec-review-31-2 @ d93328fe9bede0ecadb64081d5663b91259e2cd9681374657b7f59bda6277a2e
- Checks: 14/14 pass — C1–C14; falsification NO-CONFIRMED-GAPS
```

Artifact-revision notes:

- The author label `31-spec-2` (`SPEC ## Design status`, `## Amendments`,
  `decisions.md` header) is the repair revision; no runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `3e4c7c2d…` — the same reconciliation `review-spec`,
  `review-plan` and features 37/52 recorded. The label stays recorded here.
- `Parent: null` — a SPEC snapshot roots its own lineage; this PASS replaces
  `spec-review-31-2`, which the sensor now reads as
  `fresh: false / stale-source-revision` (SPEC.md moved).
- Read-only on the reviewed artifact: `SPEC.md`, `decisions.md`, `ACCEPTANCE.md`
  and the roadmap row are byte-identical after this turn. The only writes are
  this receipt and the re-review note in `planning-findings.md` (the reviewer's
  ledger home).
- Entering this cycle was a `CONVERGENCE-ANOMALY` reported by the repair turn
  (POLICY §4); it grants no PASS and is routed to `design-feature`, which is
  exactly the turn that produced this revision.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": true,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-3",
    "verdict": "spec-review-pass",
    "snapshot": "b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — fresh and current; no fix-and-re-run round was needed.)

## Verdict

```text
SPEC-REVIEW-PASS — 31-planning-review-materiality
- Snapshot: b1cafdbfa468f95c7dceb849b0568b2fef57041ac94dfc712220ba65e79144c7 · Artifact revision: 3e4c7c2d5cbdde6e241db77d37f14906afd88b5e · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

## Redesign & replan — owner ruling 2026-09-17

The plan stage is stopped **by decision, not by repair**. State at the ruling
(`2ca960fd`): five review receipts on the unit — `spec-review-31-1` PASS,
`plan-review-31-1` FAIL (F01–F03), `plan-review-31-2` FAIL (R31-01…R31-03),
`spec-review-31-2` FAIL (N31-003), `spec-review-31-3` PASS — with the plan set
`31-plan-2` still carrying open findings and **no implementation phase started**.

Why the plan is not repaired: its subject is skill-reference prose
(`LEDGERS.md`, `CHECKS.md`, `OUTPUT.md`, `POLICY.md`, `REPAIR.md` plus their test
pins), and D-31-6 moves that carrier into code. A repair batch would spend the
plan stage's third cycle (user-only under the cap) perfecting an artifact whose
target is superseded — the second cycle already produced new findings
(`R31-01…R31-03`) about the wrong surface.

Superseded by this ruling (kept on disk as evidence, never deleted; the replan
rewrites them):

| Artifact | State | Disposition |
|---|---|---|
| `PLAN.md`, `TASKS.md`, `planning-obligations.md`, `planning-evidence.md`, `testing.md` | `31-plan-2` | re-cut by `plan-feature` |
| `ACCEPTANCE.md` | frozen manifest | re-frozen by the replan — a manifest change is the planner's act, never a repair |
| `planning-findings.md` rows `F01–F03`, `R31-01…R31-03` | `open` | die with the plan set; re-raised only if they survive against the new cut. The ledger's closed vocabulary (`open \| resolved \| dismissed`) has no `superseded` value, so they stay `open` and this note is their disposition |
| `plan-review-31-1`, `plan-review-31-2` receipts | FAIL against `31-plan-2` | void with the set; the replan's `/review-plan` opens a fresh lineage |

Not superseded — verified, not assumed:

- `spec-review-31-3` is still `current: true`
  (`bun scripts/pre-execution-snapshot.mjs verify --stage spec --unit
  31-planning-review-materiality`, exit 0). The Product half is untouched by
  this ruling.
- Digest-invariance proof: appending bytes to the `## Engineering half` and
  re-running `build --stage spec` left the bound artifact digest at
  `5cdbd2f3f2039b1089c14cdce9a3367df9a92720eb0122de822e1693a07f502e` (bytes
  33332 unchanged) — `spec-product-v1` excludes the Engineering half, so the
  PASS survives the engineering rewrite. The experiment was reverted; `SPEC.md`
  is byte-identical to `2ca960fd`.

Next: `/plan-feature 31` → `/review-plan 31` → `/execute-phase 31`. Roadmap row
31 is back to `defined` (routing data, deliberately unbound) until the new set
is cut.

## Carrier amendment — `31-spec-3` (design-feature, 2026-09-17)

Commissioned: "carrier amendment for D-31-6". The Product half is re-scoped to
the code carrier (schema finding record `class`/`severity`/`reproducer`; the
closed freshness/reason codes; the orchestrator's cap refusal; phase-lint)
with the frozen semantics verbatim — low = report-note, material = `medium`+,
two-cycle cap → `needs-design`, wording-only skips only the re-review.
D-31-7 (the cap counts consecutive unconverged cycles; a PASS resets it) and
D-31-8 (stage-scoped cap exit per the fix/162 machine map) are recorded in
`decisions.md` with 18 fresh evidence rows; research gate re-run for the
carrier's domain (two external fetches: Tricorder pub43322; GitHub Docs
status checks). SPEC edits: Scope re-cut to the machine surfaces, capability
closure E1–E3 re-walked, expectation sweep re-cut to 19 rows, AC1–AC13
re-derived as command-checkable code-carrier criteria.

Receipt state: pre-edit `verify --stage spec` → `current: true` (exit 0,
`spec-review-pass`, receipt `spec-review-31-3`); post-edit →
`stale-artifact-content` (exit 4) — the authorized carrier-change
consequence; the spec stage reopens.

Next: `/review-spec 31` (cycle 1, D-31-7) → `/plan-feature 31` (re-cut;
`31-plan-1/2` superseded, never repaired) → `/review-plan 31` →
`/execute-phase 31`.

---

# Review `spec-review-31-4` — carrier-amended Product half (2026-09-17)

Product-half independent review (`review-spec`), 2026-09-17. Fresh context; this
conversation never authored or edited the reviewed Product half, its ledgers, or
its acceptance manifest. Cycle 1 of the fresh window D-31-7 declares: the last
spec verdict was a PASS (`spec-review-31-3`), and the carrier move is an
owner-authorized re-open, not a repair of that receipt.

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality @ 9a39c3fc
- 3 product decisions a hostile reader could call invented rather than recorded:
    1. D-31-7 the cap counts consecutive unconverged cycles and a PASS resets it
       — recorded decisions.md D-31-7, authority D-31-6's authorization sentence
       + the user instruction; mirrors review-change's loop semantics
    2. D-31-8 the cap's unconverged exit is stage-scoped (spec: needs-design;
       plan: refusal + design-feature routing) — recorded decisions.md D-31-8,
       authority fix/162 Decision 11 + VERDICTS_BY_STAGE
    3. the finding record's `reproducer` field — named by the owner ruling
       D-31-6 and the user instruction; absent from D-31-1…D-31-5
  → all three point to dated decisions.md rows with stated authority; none
    invented. D-31-1…D-31-5 keep their original authority (issue #171).
- User outcome with no observable check: business goal 1 ("cut the cost of a
  planning review cycle") is economic; its proxies are AC1 (a `low` row no
  longer gates) and AC4 (wording-only routes past the re-review). No finding
  for the goal itself — but In-scope item 5's declared shrink of both CHECKS.md
  and both OUTPUT.md (and the removal of the old line in LEDGERS.md §3) is
  declared in scope with NO criterion verifying it → confirmed gap N31-004.
- Role the matrix leaves unspecified for a capability it lists: none — 5
  derived roles × 5 capabilities (C1–C5), every cell explicit allowed/denied.
- What would have to be true in the repository for this half to be wrong, and is
  it true?:
    a) the machine materiality rule already reads medium+ → false:
       pre-execution.ts:1059 is `const material = finding.severity !== "info"`
    b) the finding record already carries `reproducer` → false: grep over
       packages/agentic-workflow-schema/src/ returns nothing
    c) the plan stage already sanctions `needs-design` → false:
       VERDICTS_BY_STAGE.plan is [plan-review-pass, plan-review-fail] only
    d) dependency 29 is unmerged → false: ROADMAP row 29 reads done · #175
    e) AC7 already verifies CHECKS.md/OUTPUT.md → false: no grep in AC7 (nor in
       the normative-drift/quality suites) targets either file's materiality line
    f) a root `package.json` exists (making the bare bundler spelling valid) →
       false: no root package.json, so the package-root spelling is correct
- Verdict stance before checking: CONFIRMED-GAPS (the AC7 coverage gap)
```

## Product checks — fixed list, one result each

Snapshot `d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa` @
source revision `9a39c3fc88379cea123dd4b85123caefb439363b` (`spec-product-v1`
projection digest `c0dfc2598158ca0b9198b65af57279c8a19372864f67932bbe93810b9fbee4a8`,
40400 bytes).

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Business goals state the outcomes (cost, structural termination, preserved honesty); each of the 8 In-scope items and the allowed-set group maps to an objective AC: 1→AC1/AC2/AC3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8/AC9, 7→AC10/AC11, 8→AC12, groups→AC13 |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5), every cell explicit allowed/denied; trigger owners named (reviewer files, author repairs, human keys cycle 3, decider refuses and routes) |
| C3 | Entity closure | pass | E1 (finding record + ledger row), E2 (wording-only determination — machine half + judgment half), E3 (cycle state) each resolve create/read/update/delete/transitions to a named surface + test; zero blank rows; every n/a carries a reason (append-only / derived value) |
| C4 | Limits and failure states | pass | Limits: the hard two-cycle cap, ≤64 findings, 10 closed freshness codes; failure states resolved — unconverged loop → needs-design (spec) or refusal+route (plan), mislabeled defect → reclassify at medium minimum, undetermined rotation → stale-artifact-revision refused, open medium+ row → verdict-mismatch, dismissal → counter-evidence required; size M stated |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract (vocabulary values, receipt binding, code-side loop) or an explicit exclusion (retroactive rows, superseded plan set, aspirational citation, tutorial); nothing excluded by silence |
| C6 | Integration closure | pass | docs/CAPABILITIES.md is the unseeded template, so the 12-row derived inventory is recorded in the section and walked one row per subsystem; each row resolves to a test, an n/a with reason, or a named owner (audit-docs) |
| C7 | Expectation sweep | pass | 19 resolved rows (≥10 for M), each forced to in-scope/out-of-scope with a pointer; zero unresolved rows |
| C8 | Acceptance objectivity | finding | AC1–AC13 are objective and labelled, and every In-scope bullet maps to ≥1 criterion — but AC7 does not verify the CHECKS.md/OUTPUT.md/LEDGERS.md shrink In-scope item 5 declares, and the Integration-closure row claims AC7 covers it → N31-004 (medium, product) |
| C9 | Internal contradiction | pass | The materiality line, cap, wording-only route and stage-scoped exit are consistent across In-scope, D-31-2, D-31-7, D-31-8 and E1–E3; D-31-8 explicitly reconciles the summary shorthand, which is filed as N31-005 (info) not a contradiction |
| C10 | Repository contradiction | pass | Claims re-read at 9a39c3fc: pre-execution.ts:1059 material rule; no `reproducer` in src/; freshness codes :159–170 (10); verify exit codes; `stale-artifact-revision` at :1147; VERDICTS_BY_STAGE plan lacks needs-design (pre-execution-contract.ts:126–138); transition rows review-spec/review-plan allow design-feature; LEDGERS.md:93 old line; POLICY §3 re-review mandate (:46-47) and §4 sentences (:60-61, 83); REPAIR.md:64; both CHECKS.md old line (:104/:105); schema 4.2.0; ROADMAP 29 done·#175 and 30 done·#188; docs/CAPABILITIES.md template; no ARCHITECTURAL_INVARIANTS.md; no root package.json |
| C11 | Evidence integrity | pass | Every decisions.md row is proven/decision + current with a location and revision (a400b978 / b84d57e1 / d63e9b12 / the 2026-09-17 fetches); no unknown, drifted or stale row survives; the carrier amendment's evidence table adds the machine facts this half asserts. One coverage claim is imprecise → folded into N31-004 |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none`; D-31-5 is a conditional invariant-reconciliation with a named owner (resolve-repository-state), not an open product choice |
| C13 | Engineering leakage | pass | The Product half cuts no phases, tasks or plan topology; the code carriers it names are the owner-ruled carrier (D-31-6), and the phase cut/done-whens live in the (superseded) Engineering half only |
| C14 | Obligation containment | pass | No current-unit obligation is exported: the README citation is in-unit (AC12), version bumps/pins in-unit (AC8/AC9/AC10/AC11), the superseded plan set is a disposition not a deferral, and the AD-008 amendment is conditional and owner-routed |

Findings: 2 — N31-004 (medium, product, material open: 1) and N31-005
(info, product, immaterial). Recorded in `planning-findings.md`.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-4 · Snapshot: d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 9a39c3fc88379cea123dd4b85123caefb439363b · Artifact revision: 9a39c3fc88379cea123dd4b85123caefb439363b
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T13:02:00Z/2026-09-17T13:06:00Z · Findings: 2 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 40400 · digest c0dfc2598158ca0b9198b65af57279c8a19372864f67932bbe93810b9fbee4a8 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 13/14 pass — C1–C7 and C9–C14 pass; C8 carries the material row N31-004; N31-005 is `info`
- Contexts: architectural-invariants absent · normalized-repository-state present e1b81e29138706dde46416cf93cfb0cb3a0605af384401f7d48a5e4ebb10d492 · project-guide present ff24d7e437646fa37cc3abe11d51715b4a1e4fb79e2c974fe2b952b0e1f80eb3
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-3` (SPEC `## Design
  status`; roadmap row 31). As feature 37 precedent and the three earlier
  spec receipts recorded, the receipt's `Artifact revision:` field binds the
  builder's digest-derived value `9a39c3fc…` (the newest commit touching the
  bound path), because the recipe owner's `verify` re-derives the same value;
  the handoff label `31-spec-3` stays recorded here.
- Governance issue #171 (OPEN) was read from the forge as routing data. The
  builder's canonical context set binds `architectural-invariants` (absent),
  `normalized-repository-state` and `project-guide`; the roadmap row is
  deliberately unbound. No reviewed byte changed before the snapshot was built
  (`git status --porcelain` clean at `9a39c3fc`).
- Read-only: no reviewed artifact (`SPEC.md`, `decisions.md`, the roadmap row,
  `ACCEPTANCE.md`) was modified by this turn; the only writes are this receipt
  and the `planning-findings.md` rows the ledger contract assigns to this
  stage.

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa · Artifact revision: 9a39c3fc88379cea123dd4b85123caefb439363b
- Failed checks: C8
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | N31-004 | medium | product | C8 | AC7 omits three prose surfaces In-scope item 5 declares shrunk (both CHECKS.md, both OUTPUT.md, the old LEDGERS.md §3 line) while the Integration-closure row claims AC7 covers them — the declared scope can ship unverified with every AC green | SPEC.md `#### In scope` item 5; `### Acceptance criteria` AC7; Integration-closure row "Skill reference docs"; CHECKS.md:104 / CHECKS.md:105 / LEDGERS.md:93; normative-drift and pre-execution-quality reads | verified |
  | N31-005 | info | product | C9 | Goal and Business goals state the loop's unconverged end is NEEDS-DESIGN stage-unqualified, while In-scope item 3 and D-31-8 scope it (plan stage = refusal + design-feature routing) | SPEC.md `## Goal`, `### Business goals`, `#### In scope` item 3, D-31-2/D-31-8; VERDICTS_BY_STAGE pre-execution-contract.ts:126-138 | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
```

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-4",
    "verdict": "spec-review-fail",
    "snapshot": "d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

`structural.fresh: true` — the mark landed (digest matches). `current: false`
with `verdictIsPass: false` is the sanctioned emit result for a FAIL (exit 4):
the verdict is the emit result, and the route is the repair owner below.

## Repair batch `31-spec-4` — design-feature authoring turn (2026-09-17)

Commissioned: "repair N31-004 + N31-005: extend AC7 to grep both CHECKS.md and
both OUTPUT.md for the removed materiality/loop sentences and LEDGERS.md for
the removal of 'info is the only immaterial one', correct the
Integration-closure row's Test claim, and stage-scope the NEEDS-DESIGN wording
in Goal + Business goals." One batch over the whole open findings set of
`spec-review-31-4` (C8: N31-004 medium product; N31-005 info product), repair
owner `design-feature`. Cycle state: the carrier-amendment re-review
(`spec-review-31-4`) was cycle 1 of the window D-31-7 opened and did not
converge, so this repair enters cycle 2 — the `CONVERGENCE-ANOMALY` block was
printed before any edit (POLICY §4; recorded in `decisions.md`).

Edits (evidence rows in `decisions.md` §"Product repair batch (design-feature,
artifact revision `31-spec-4`)"):

- SPEC.md `### Acceptance criteria` AC7 — the removal grep set now covers
  every surface In-scope item 5 declares shrunk: both `CHECKS.md`
  (`grep -rn "Material = anything above"`), both `OUTPUT.md`
  (`grep -rnE "re-review of the new snapshot|re-reviews the new"` — the FAIL
  verdict-route rows and the closing hand-off blocks), and `LEDGERS.md` §3
  (`grep -n "only immaterial"`); the kept-side greps are unchanged. Every new
  grep target was verified to exist verbatim at branch head `c5a6e173`
  (sole-hit evidence rows).
- SPEC.md Capability closure Integration-closure row "Skill reference docs" —
  the Test cell now names the true verifiers: AC7's greps +
  `check-skill-context.mjs` budgets (AC10); `normative-drift` is re-described
  truthfully (guards the versioned blocks the shrink must not disturb — it
  reads neither CHECKS.md nor OUTPUT.md and never pinned the materiality
  prose).
- SPEC.md `## Goal` + `### Business goals` bullet 2 — the unconverged-loop end
  is stage-scoped per D-31-8: `NEEDS-DESIGN` where the verdict vocabulary
  sanctions it (spec stage); the orchestrator's refusal + `design-feature`
  routing at the plan stage (fix/162).
- SPEC.md `## Design status` rotates to `31-spec-4`; `## Amendments` gains the
  `31-spec-4` row (repair classes: N31-004 closure completion, N31-005
  mechanical intent-preserving).
- decisions.md — repair section + 5 evidence rows (`current`/`proven` at
  `c5a6e173`); no new product decision (D-31-1…D-31-8 unchanged).
- planning-findings.md — N31-004 + N31-005 → `resolved` at
  `resolving-artifact-revision: 31-spec-4` with resolution evidence.

Repair classification: both findings are `product` rows and were repaired
here; the set carries no plan/source/environment/runtime row, so nothing is
left open for another owner.

### Gates (run in this act, before this report)

Spec-lint product boxes — 9/9 PASS:

1. Placeholder grep over the Product half: no matches (exit 1) — clean.
2. Out-of-scope: 7 concrete bullets.
3. Capability closure rows: all filled / explicit `n/a` (E1–E3, unchanged from
   the reviewed bytes; zero blank rows).
4. Integration closure: 12 derived-subsystem rows, unchanged count vs HEAD
   (13 `| [A-Z]` lines = header + 12 rows).
5. Role matrix: 5 capabilities × 5 roles, all explicit allowed/denied.
6. Expectation sweep: 19 resolved rows (M ≥ 10), each with a pointer.
7. In-scope → AC mapping: unchanged explicit AC pointers on every item/group.
8. AC labels: 13/13 — AC2/AC3/AC5/AC10/AC11/AC12 pure commands; AC1/AC4/AC6/
   AC7/AC8/AC9/AC13 command + `read-verified`.
9. `### Deferred decisions` reads `none`.

Readiness preflight (stage: spec) — all boxes pass:

1. Required headings present in machine order
   (`SPEC_PRODUCT_REQUIRED_HEADINGS`: Goal, Branch, Size, Dependencies,
   Product half, Design status); no template placeholder text remains.
2. `## Design status` reads `designed` — earned by the 9/9 spec-lint above.
3. Entity closure: zero blank rows (C3 verified at `spec-review-31-4`;
   unchanged bytes).
4. Integration closure: one resolved row per derived subsystem; inventory
   recorded (unchanged).
5. Role matrix: every derived role explicit for every capability (unchanged).
6. Expectation sweep: 19 resolved rows, zero unresolved (unchanged).
7. Every in-scope bullet maps to ≥ 1 criterion; every criterion labelled.
8. `Deferred decisions` reads `none`.
9. Evidence: 50 grounding rows in `decisions.md`, all `proven`/`decision` at
   `current` freshness (5 new rows read at `c5a6e173`; prior tables' cited
   sources unchanged since `a400b978`), zero unknown/drifted/stale.
10. No criterion rests on memory or chat history — every new grep target is a
    verified `path:line` evidence row.
    D1: no delegated-evidence run exists for this unit — n/a.

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-4 · Rows checked: 50 · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-17
```

Artifact-revision rotation: `31-spec-3` → **`31-spec-4`** (this write; a
revert would rotate again). Post-write self-check:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-4",
    "verdict": "spec-review-fail",
    "snapshot": "d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "c041ba44e2fcc6823e2097c4abda5e7ffd5e863aad3d1cae29b867fed0f48e9e",
  "digestMatches": false,
  "verdictIsPass": false,
  "structural": {
    "fresh": false,
    "reasonCode": "stale-artifact-content",
    "detail": "bound artifact bytes moved since the receipt: docs/features/31-planning-review-materiality/SPEC.md",
    "changedPaths": ["docs/features/31-planning-review-materiality/SPEC.md"]
  }
}
```

`stale-artifact-content` is the sanctioned post-authoring state: the bound
Product bytes moved by this repair, so the `spec-review-31-4` receipt is
superseded by design (exit 4). The next `/review-spec` run is cycle 2 of the
window D-31-7 opened (a third cycle would need explicit user instruction
behind the orchestrator's cap). `ACCEPTANCE.md` stays frozen untouched (it is
`plan-feature`'s owning artifact, re-derived with the superseded `31-plan-1/2`
re-cut only after a fresh `SPEC-REVIEW-PASS` receipt).
