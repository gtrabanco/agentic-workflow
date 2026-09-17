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
