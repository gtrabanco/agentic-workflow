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

---

# Spec re-review (`review-spec`), 2026-09-17

Cycle-2 re-review of the Product half the `31-spec-4` repair batch rewrote —
the route `spec-review-31-4` named for N31-004 (`class: product` →
Product-half repair, then re-review). This concludes the D-31-7 window's
second repair/re-review cycle; the `CONVERGENCE-ANOMALY` block was reported by
the `31-spec-4` repair batch on entry (decisions.md §"Product repair batch
(design-feature, artifact revision `31-spec-4`)"). Fresh context; this
conversation never authored or edited the Product half, its ledgers, or its
acceptance manifest.

Pre-state observed before this reviewer wrote anything (`verify --stage spec`):
`fresh: false / stale-artifact-content`, `changedPaths: [SPEC.md]` —
`spec-review-31-4` binds `d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa`
while the Product bytes now sit at `fef66d09…`.

Snapshot built by the recipe owner before any check
(`bun scripts/pre-execution-snapshot.mjs build --stage spec --unit 31-planning-review-materiality`;
stdout first line pasted):

```text
b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a
```

- `stage: spec` · `unitKind: feature` · `unitId: 31-planning-review-materiality`
- `sourceRevision` = `artifactRevisionId` = `fef66d093f850888454ea095e8dc6de8509be681`
- `artifacts`: `docs/features/31-planning-review-materiality/SPEC.md` · selector
  `spec-product-v1` · bytes 41678 · digest
  `bd05875641c632ca88533e2de8a85fa1c68942d03531bae8e922af8c65a871ab`
- `parentSpecSnapshotDigest`: null · contexts:
  `architectural-invariants: absent` ·
  `normalized-repository-state: present (e1b81e29…)` ·
  `project-guide: present (ff24d7e4…)`

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality spec @ fef66d09
- 3 specific product decisions a hostile reader could call invented rather than
  recorded:
    1. In-scope 2's wording-only machine half — "acceptance fingerprint and
       bound material bytes unmoved → still current". `acceptanceFingerprint` is
       a #138 concept in the verification-receipt/candidate-snapshot schemas; the
       pre-execution spec snapshot binds only SPEC.md, so presenting the
       acceptance fingerprint as the wording-only discriminator is forward design
       (the code the unit is chartered to write), evidence-set `decision` under
       D-31-6 — not a claim about an existing pre-execution surface. No finding.
    2. In-scope 5's "keep only" remainder: the anti-deflation judgment
       ("`medium` minimum"), the third-cycle sentence ("third cycle never"), and
       the ledger "report-note" wording are presented as preserved text, but none
       exists in the named planning surfaces today — they are new prose. → N31-008.
    3. In-scope 7's four skill minor bumps + README skill-table cells, mapped to
       AC10 + AC11: no criterion observes the version bump (AC9 names the schema
       package; AC10/AC11 verify the gate pack and mirror parity). → N31-007.
- The user outcome the SPEC promises that has no observable check: AC7's removal
  of the two POLICY §4 sentences ("no cap converts a verdict into a dead end",
  "Entering a **second** cycle is allowed") — both greps cannot match the
  sentences actually on disk (line-wrapped), so the criterion is false-green
  (N31-006); and the version-bump outcome (N31-007).
- One role the matrix leaves unspecified for a capability it does list: none
  found — 5 derived roles × 5 capabilities (C1–C5) are all explicit; `audit-pr`
  sits inside E1's declared reader classes.
- What would have to be true in the repository for this half to be wrong, and is
  it true? AC7's two POLICY removal greps would have to be able to match the
  sentences they claim removed — they cannot: `POLICY.md:60-61` wraps
  "Entering a **second**\ncycle is allowed …" and `:83-84` wraps "… no cap
  converts a verdict into a\ndead end.", so both greps exit 1 today and would
  still exit 1 with the sentences left in place. → CONFIRMED-GAPS.
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a` @
source revision `fef66d093f850888454ea095e8dc6de8509be681`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | finding | In-scope 7 declares the four skill minor bumps + README cells, but its AC pointer (AC10 + AC11) observes neither: AC10 runs the gate pack + context budgets, AC11 runs the mirror/package suite, AC9 names only the schema package `version:`. No criterion makes the skill-bump outcome observable. → N31-007 |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5), every cell explicit `allowed`/`denied`; no unlisted role; `audit-pr` appears only inside E1's declared reader classes |
| C3 | Entity closure | pass | E1 (finding record/ledger row), E2 (wording-only determination), E3 (cycle state) each resolve create/read/update/delete/transitions to a named surface + test; every `n/a` carries a reason (append-only / derived value); zero blank rows |
| C4 | Limits and failure states | pass | Size `M`; limit = the two-cycle cap; failure states resolved — unconverged loop → stage-scoped human stop (spec `NEEDS-DESIGN`, plan refusal + `design-feature` route), mislabeled defect → `medium` minimum (anti-deflation), wording-only misroute → recorded determination + rotation, vacuous pin set → floor + discrimination leg |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract, the owning feature (#159, code side), or an explicit exclusion (schema-package values, retroactive rows, sensor mechanics); nothing excluded by silence |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholder rows only), so the 12-row derived inventory is recorded and walked one row per subsystem; the "Skill reference docs" Test now matches the repo — re-verified here that `normative-drift.test.mjs` reads neither CHECKS.md nor OUTPUT.md for materiality and `check-skill-context.mjs` checks budgets only (N31-004's second half) |
| C7 | Expectation sweep | pass | 19 resolved rows (≥10 for `M`), each forced to exactly one of `in-scope`/`out-of-scope` with a pointer; zero unresolved |
| C8 | Acceptance objectivity | finding | AC7's removal clause for the two POLICY §4 sentences cannot verify the removal: `grep -n "no cap converts a verdict into a dead end" …` and `grep -n "Entering a \*\*second\*\* cycle is allowed" …` both exit 1 today because the sentences are line-wrapped (`POLICY.md:60-61`, `:83-84`), so the criterion is green whether or not the sentence survives — a false-green validator that lets the shipped POLICY.md keep prose contradicting the machine cap. → N31-006 |
| C9 | Internal contradiction | pass | The materiality line (material = `medium`+) is consistent across Goal, Business goals, In-scope 1/2/5, D-31-1/D-31-4, Out-of-scope 2 and the capability/role matrix; the terminal verdict stays the existing stage-scoped `needs-design`/refusal (D-31-8, matching `VERDICTS_BY_STAGE` — re-read: plan carries no `needs-design`); the four preserved contracts appear as preserved-only in both In-scope and Out-of-scope |
| C10 | Repository contradiction | finding | In-scope 5 presents the anti-deflation judgment ("`medium` minimum"), the third-cycle sentence ("third cycle never"), and the ledger "report-note" wording as remainder the shrink `keep[s] only`, but none exists in the named planning surfaces today (`grep -rn 'medium` minimum' skills/pre-execution-review/references/ skills/review-spec/ skills/review-plan/` → exit 1; the judgment lives only code-side at `review-implementation/references/CLASSIFY.md:22` as "`med` minimum"; `grep -n 'third cycle never' …/POLICY.md` → exit 1; `grep -niE 'report-note' …/LEDGERS.md` → exit 1). They are authored additions, not preserved text. → N31-008 |
| C11 | Evidence integrity | pass | Every `decisions.md` evidence row is `proven`/`decision` + `current` with a location; no `unknown`/`drifted`/`stale`; the carrier rows still hold — `git diff a400b978..HEAD --name-only` touches only this unit's docs + ROADMAP, so no cited code carrier moved; the 10 `PRE_EXECUTION_FRESHNESS_CODES`, `VERDICTS_BY_STAGE`, and the four skill versions (2.2.1/1.7.1/1.6.1/3.4.0) re-read on disk match |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, architecture, or validator: AC anchors name carriers and frozen identifiers (`PLANNING_PIN_TABLE`, `PLANNING_PIN_FLOOR`, `review-loop-cap`) without assigning them to a phase or task; the phase cut stays `plan-feature`'s (the superseded plan set is declared re-cut, never repaired) |
| C14 | Obligation containment | pass | No current-unit obligation is exported: the README citation is in-unit (implementation PR, AC12), the bumps/pins in-unit (AC9/AC10/AC11/AC13), and the AD-008 amendment is conditional and owner-routed — not deferred work, not a future issue |

Findings: 3 (material open: 1) — N31-006 (`medium`, product), N31-007
(`low`, product), N31-008 (`info`, product) in `planning-findings.md`.
N31-004/N31-005 verified repaired at `31-spec-4`; N31-001/N31-002/N31-003 stay
`resolved`.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-5 · Snapshot: b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: fef66d093f850888454ea095e8dc6de8509be681 · Artifact revision: fef66d093f850888454ea095e8dc6de8509be681
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T13:58:00Z/2026-09-17T14:03:00Z · Findings: 3 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 41678 · digest bd05875641c632ca88533e2de8a85fa1c68942d03531bae8e922af8c65a871ab · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 11/14 pass (C1, C8, C10 findings); falsification CONFIRMED-GAPS; N31-006 is `medium` and blocks, N31-007/N31-008 route to design-feature without blocking
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-4` (SPEC `## Design
  status`; decisions.md repair-batch header). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `fef66d09…` — the same reconciliation prior receipts
  recorded; the label stays recorded here.
- Reviewed bytes were committed at `fef66d09` (clean tree at review start), so
  the builder's "commit the bound artifacts" precondition held; no reviewed
  byte changed by this turn.
- `spec-review-31-4` is superseded by design (its bound Product bytes moved at
  `31-spec-4`); no other receipt's lineage is affected.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-5",
    "verdict": "spec-review-fail",
    "snapshot": "b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a",
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
verdict. An earlier draft of the receipt carried the `31-spec-4` label inside
the `Artifact revision:` field and the sensor answered `fresh: false /
stale-artifact-revision`; the field now carries only the builder-derived value,
as prior receipts do.)

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a · Artifact revision: fef66d093f850888454ea095e8dc6de8509be681
- Failed checks: C1, C8, C10
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | N31-006 | medium | product | C8 | AC7's two POLICY §4 removal greps target line-wrapped sentences, so they exit non-zero whether or not the sentence is removed — a false-green criterion that can ship POLICY.md still stating the unbounded loop | AC7; `POLICY.md:60-61,83-84`; both greps run → exit 1 at `fef66d09` with the sentences present | verified |
  | N31-007 | low | product | C1 | In-scope 7's four skill minor bumps + README cells map to AC10 + AC11, neither of which observes the version bump; no test reads README skill cells or asserts those `version:` lines | In-scope 7; AC9/AC10/AC11; Integration row "Versioning/release surfaces"; four `SKILL.md` versions; `scripts/normative-drift.test.mjs:701-713` | verified |
  | N31-008 | info | product | C10 | In-scope 5 presents the anti-deflation judgment, the third-cycle sentence and the ledger "report-note" wording as preserved remainder, but none exists in the named planning surfaces today — they are authored additions | In-scope 5; AC7 kept-side greps; three observed exit-1 greps at `fef66d09`; `review-implementation/references/CLASSIFY.md:22-23`; `review-change/SKILL.md:161` | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
- Parent state: n/a (spec stage roots its own lineage)
```

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — reported on entry to this cycle by the
`31-spec-4` repair batch and reproduced here for the record; it grants no PASS
and is not a stop:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-004/N31-005 (repaired) / N31-006, N31-007, N31-008 (new)
- Snapshots: d2444b4c179b3aa0ec7ab21345733355efc066c3588eba68edd25539ab6754fa → b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a (artifactRevisionId 9a39c3fc → fef66d09)
- Missed: the two POLICY §4 removal greps in AC7 are non-discriminating (line-wrapped targets); the four-skill bump has no criterion; the "keep only" remainder is authored, not preserved
- Owning stage: product
- Why the prior review failed: `spec-review-31-4` returned C8/medium on AC7's surface coverage; the `31-spec-4` repair added the missing CHECKS/OUTPUT/LEDGERS greps but left the two POLICY greps unable to match their targets
- Route to owner: `design-feature` repair batch (fix the two greps / add a bump criterion / correct the remainder framing), then `review-spec`
```

Cap note (D-31-7): this is the second consecutive FAIL verdict for the spec
stage in the window the carrier amendment opened (`spec-review-31-4` FAIL #1,
this FAIL #2). A further repair/re-review is a **third cycle** and per
D-31-6/D-31-7 never starts without explicit user instruction — the human route
is the exit. The three rows above route to `design-feature`, but the next
cycle requires the user's instruction.

→ Next: /design-feature 31-planning-review-materiality "repair N31-006 + N31-007 + N31-008: make AC7's two POLICY §4 removal greps discriminate (the sentences are line-wrapped — use a pattern that matches the present text, e.g. `grep -n 'no cap converts a verdict into a'`), add a criterion for the four skill `version:` bumps + README cells, and correct In-scope 5's \"keep only\" framing to name the authored remainder" — then /review-spec 31-planning-review-materiality re-reviews the new artifact revision (third cycle: explicit user instruction required, D-31-7)
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC



## Repair batch (`31-spec-5`, 2026-09-17)

Owner: `design-feature` (instruction mode). Commission (explicit user
instruction, verbatim): "repair N31-006 + N31-007 + N31-008: make AC7's two
POLICY §4 removal greps discriminate (targets are line-wrapped — match a
single-line fragment), add a criterion for the four skill version: bumps +
README cells, and correct In-scope 5's \"keep only\" framing to name the
authored remainder". Trigger: the `spec-review-31-5` receipt (FAIL, checks
C1/C8/C10; N31-006 medium + N31-007 low + N31-008 info, all product). One
batch over the whole open spec-stage set; the plan-stage rows R31-01/02/03
stay with `plan-feature`.

**Cycle accounting (D-31-7):** this is the third consecutive unconverged cycle
of the window the carrier amendment opened (FAIL `spec-review-31-4` → repair
`31-spec-4` → FAIL `spec-review-31-5` → this batch). The commission above is
the explicit user instruction D-31-7 requires for a third cycle, issued in
answer to the `spec-review-31-5` hand-off that named exactly this command and
gate. The window's `CONVERGENCE-ANOMALY` block was printed on entry to cycle
2 (reproduced in the `spec-review-31-5` receipt); POLICY §4's anomaly rule
scopes to second-cycle entry, so no new block is due for the user-keyed third
cycle (REPAIR §4: a repair responding to a persisted verdict is never a loop
defect).

Repairs (classes in SPEC `## Amendments` `31-spec-5` + `decisions.md`):

- **N31-006** — AC7's two POLICY §4 removal greps re-pointed at single-line
  fragments verified present at `4cf755ab` (`POLICY.md:83`, `POLICY.md:61`;
  both unique in `skills/`, both exit 0 with the sentences standing) — the
  greps now discriminate removal.
- **N31-007** — new **AC14** (four skill `version:` bumps via pathspec-limited
  diff ≥ 8 hunk lines, semver-minor per #176, CHANGELOG rows, README
  `## The skills` cells); In-scope 7 pointer + Integration row
  "Versioning/release surfaces" + Spec-lint AC list updated.
- **N31-008** — In-scope 5 reframed to the **authored remainder** (authored
  fresh: materiality line, report-note persistence, anti-deflation,
  third-cycle rule; preserved byte-unchanged: `CONVERGENCE-ANOMALY` block +
  receipt-literal lines); AC7 kept-side greps untouched.

Gates at authoring start (branch `feat/31-planning-review-materiality`, head
`4cf755ab`): `node scripts/pre-execution-snapshot.mjs verify --stage spec
--unit 31-planning-review-materiality` → exit 4 (receipt not current — the
open FAIL receipt is this batch's input), `digestMatches: true` (the FAIL
receipt binds the bytes on disk). Architectural invariants: `n/a: no project
invariants declared` (NRS F010); AD-008 preserved by D-31-5 (unchanged). The
frozen `ACCEPTANCE.md` is not touched (plan-feature's owning artifact,
superseded set, re-cut on a fresh PASS).

Spec-lint product boxes re-run after the edits: all PASS (placeholders none;
out-of-scope 7 bullets; closure rows complete; integration 14/14 derived
subsystems; role matrix 5×5; sweep 19/19 resolved; every in-scope item → ≥ 1
AC — item 7 now AC10 + AC11 + AC14; every AC runnable or `read-verified`;
deferred decisions `none`).

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-5 · Rows checked: 8 evidence rows (batch) · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-17
```

Artifact revision rotates `31-spec-4` → **`31-spec-5`** (the write's bound
id is the commit that carries these bytes — this unit's receipt convention).

Post-edit selector check (readiness box 1): `node
scripts/pre-execution-snapshot.mjs verify --stage spec --unit
31-planning-review-materiality` re-derived the `spec-product-v1` projection
from the new bytes (observedDigest `b9d4d6f6…`), reporting exactly the
declared by-design state — `fresh: false`, "bound artifact bytes moved since
the receipt", `changedPaths: [SPEC.md]`.

# Review `spec-review-31-6` — cycle-3 re-review of the `31-spec-5` Product half (2026-09-17)

Cycle-3 independent re-review of the Product half the user-keyed `31-spec-5`
repair batch rewrote (`spec-review-31-5` → N31-006 + N31-007 + N31-008). Fresh
context; this conversation never authored or edited the Product half, its
ledgers, or its acceptance manifest. Cycle authorization: D-31-7's user-keyed
third cycle, whose commission is quoted in `decisions.md` §"Product repair
batch (`31-spec-5`)" and in the `31-spec-5` section of `planning-findings.md`.

Snapshot `95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa` @
source revision `bccc95fd2debbce4748668f80f1b490c56178990` (`spec-product-v1`
digest `98fa0ae18bd44f27f344854e5e5a5a6b6df9b350f6c2b22aa7e8c599710c1272`,
43682 bytes); handoff label `31-spec-5`. Verdict: `spec-review-fail` — 12/14
checks pass; C8 carries two material `product` rows (N31-009, N31-010); C9 one
open `info` row (N31-011). N31-006/N31-007/N31-008 verified repaired at
`31-spec-5`.

## Checks — one result each

Snapshot `95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa` @
source revision `bccc95fd2debbce4748668f80f1b490c56178990`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Every in-scope item names an observable outcome and its AC anchor: 1→AC1/AC2/AC3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8/AC9, 7→AC10/AC11/**AC14**, 8→AC12; the allowed-set groups→AC13. N31-007's gap (In-scope 7's four skill bumps + README cells observed by no criterion) is closed: AC14 makes the bump observable via the pathspec-limited `version:` diff + CHANGELOG/README walk |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5); every cell explicit `allowed`/`denied`; no unlisted role; the role blurb ("drivers & sensors validate and refuse; they never author findings") matches every cell |
| C3 | Entity closure | pass | E1–E3 each resolve create/read/update/delete/state-transitions to a named surface + test; every `n/a` carries a reason (append-only ledger; derived machine/cycle value); zero blank rows |
| C4 | Limits and failure states | pass | Limit = the two-cycle cap; failure states resolved — unconverged loop → stage-scoped human stop (spec `NEEDS-DESIGN` per `VERDICTS_BY_STAGE.spec`; plan refusal + `design-feature` route), mislabeled defect → `medium` minimum, wording-only misroute → recorded determination + rotation, vacuous pin → floor + discrimination leg; size `M` |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract, the owning feature (#159, code side), or an explicit exclusion (new vocabulary, retroactive rows, unrecorded receipt binding, superseded plan set, aspirational citation, tutorial edit); nothing excluded by silence |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholders only), so the 12-row derived inventory is recorded and walked one row per subsystem; the "Skill reference docs" Test matches the repo (AC7's greps verify the shrink; `check-skill-context.mjs` checks budgets; `normative-drift` guards versioned blocks, not the materiality prose) |
| C7 | Expectation sweep | pass | 19 rows (≥ 10 for `M`), forced to exactly one resolution each with a pointer: 16 `in-scope`, 3 `out-of-scope`, zero unresolved |
| C8 | Acceptance objectivity | finding | AC2's added second grep cannot verify its own assertion: `grep -n "medium" …/pre-execution-contract.ts` already matches the severity enum literal (`:103`) so it exits 0 whether or not the finding-record severity description is rewritten — the "states the new line" clause is unverifiable by a command labelled `(command)` → N31-009. AC7 verifies only one of the two unbounded-cycle sentences In-scope 5 declares leaving `REPAIR.md` §4 (`More cycles stay allowed` at `:64`; "no cycle cap converts its verdict into a dead end" at `:71` is matched by no criterion) → N31-010. N31-006's POLICY-fragment repair is verified discriminating (both fragments exit 0 at HEAD) |
| C9 | Internal contradiction | finding | The Spec-lint product box lists AC1 among the "pure commands" (`AC1–AC3, AC5, AC10–AC12 pure commands`) while AC1's own label is `(command + read-verified)`; every other criterion matches its group, so AC1 is the single misfiled entry → N31-011. Materiality, cap, stage-scoped exit, wording-only and the four preserved contracts are otherwise consistent across Goal/Business goals/Scope/D-31-x/E1–E3 |
| C10 | Repository contradiction | finding | The half's claims match the repository: `LEDGERS.md:93` "`info` is the only immaterial one" (sole hit); both `CHECKS.md` "Material = anything above `info`"; `POLICY.md:60-61,83` and `REPAIR.md:64-65,71` unbounded-cycle sentences; `pre-execution.ts:1059` `severity !== "info"`; `FINDING_SPEC` fields lack `reproducer`; `PRE_EXECUTION_FRESHNESS_CODES` = 10; `VERDICTS_BY_STAGE.spec` has `needs-design`, plan does not; four skill versions 2.2.1/1.7.1/1.6.1/3.4.0; `git diff a400b978..HEAD` touches only this unit's docs + `ROADMAP.md`, so every carrier observed at `a400b978` still holds. The one inconsistency (In-scope 5's shrink declaration vs AC7's coverage) is filed under C8 as N31-010, not here |
| C11 | Evidence integrity | pass | Every `decisions.md` evidence row resolves to a `proven`/`decision` row at `current` freshness with a location; no `unknown`/`drifted`/`stale`; the 31-spec-5 batch's new rows (POLICY fragments, four skill versions, CHANGELOG/README, receipt-state-at-authoring) are `current`. N31-008's three absence greps were re-run and remain exit 1 today, confirming the authored-remainder framing |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, architecture, or validator: AC anchors name carriers and frozen identifiers as acceptance surfaces without assigning phases/tasks (the re-cut plan set is declared superseded and re-cut) |
| C14 | Obligation containment | pass | No current-unit obligation is exported: README citation (AC12), bumps/pins (AC9/AC10/AC11/AC13/AC14) and the bibliography are in-unit; the AD-008 amendment is conditional and owner-routed |

Findings: 3 (material open: 2) — N31-009 (`medium`, product), N31-010
(`medium`, product), N31-011 (`info`, product) in `planning-findings.md`.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-6 · Snapshot: 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: bccc95fd2debbce4748668f80f1b490c56178990 · Artifact revision: bccc95fd2debbce4748668f80f1b490c56178990
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T14:52:00Z/2026-09-17T15:01:00Z · Findings: 3 (material open: 2)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 43682 · digest 98fa0ae18bd44f27f344854e5e5a5a6b6df9b350f6c2b22aa7e8c599710c1272 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 12/14 pass (C8 two material rows, C9 one info row); falsification CONFIRMED-GAPS; N31-009/N31-010 are `medium` and block, N31-011 routes to design-feature without blocking
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-5` (SPEC `## Design
  status`; decisions.md repair-batch header). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `bccc95fd…` — the same reconciliation prior receipts
  recorded; the label stays recorded here.
- Reviewed bytes were committed at `bccc95fd` (clean tree at review start), so
  the builder's "commit the bound artifacts" precondition held; no reviewed
  byte changed by this turn.
- `spec-review-31-5` is superseded by design (its bound Product bytes moved at
  `31-spec-5`); no other receipt's lineage is affected.

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — this review is the spec stage's third
consecutive unconverged cycle of the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` → `spec-review-31-5` FAIL #2 →
`31-spec-5` → this FAIL #3). The window's block was printed on cycle-2 entry and
is reproduced in the `spec-review-31-5` receipt; this re-review is the
user-keyed third cycle D-31-7/§4 sanctions, so no new block is owed on entry.
Reported here for the cycle record; it grants no PASS and is not a stop:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-006/N31-007/N31-008 (repaired) / N31-009, N31-010, N31-011 (new)
- Snapshots: b9cf60a8e4e64bc197b7d1ced093b8875d43055392f8c59d5dc7555d14d3b10a → 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa (artifactRevisionId fef66d09 → bccc95fd)
- Missed: AC2's `grep -n "medium"` anchor is non-discriminating (already satisfied by the enum literal); AC7 leaves REPAIR.md §4's second unbounded-cycle sentence uncriterioned; the Spec-lint box misfiles AC1
```

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-6",
    "verdict": "spec-review-fail",
    "snapshot": "95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa",
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

---

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa · Artifact revision: bccc95fd2debbce4748668f80f1b490c56178990
- Failed checks: C8, C9
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | N31-009 | medium | product | C8 | AC2's second command `grep -n "medium" …/pre-execution-contract.ts` already matches the severity enum literal (`:103`), so it exits 0 whether or not the finding-record severity description is rewritten — the "states the new line (material = `medium`+; `low` is a report-note)" assertion is unverifiable, and the schema prose can ship not stating the predicate while AC2 is green | SPEC AC2; `pre-execution-contract.ts:103` (enum literal already contains `medium`), `:459` (description today "`info` is the only immaterial row."); observed `grep -n "medium"` → 1 hit (line 103) at `bccc95fd` | verified |
  | N31-010 | medium | product | C8 | AC7 declares REPAIR.md §4 among the surfaces losing "the unbounded-cycle sentences" (In-scope 5) but verifies only "More cycles stay allowed" (`:64`); the second unbounded-cycle sentence "no cycle cap converts its verdict into a dead end" (`:71`) is matched by no criterion (AC7's `no cap converts…` grep is scoped to POLICY.md), so a PR can leave §4 asserting an uncapped loop with every AC green | In-scope 5; AC7; `skills/design-feature/references/REPAIR.md:64-65,71`; SPEC `## Amendments` E5 names both sentences for replacement; observed `grep -n "no cycle cap converts" …/REPAIR.md` → exit 0 at `bccc95fd` | verified |
  | N31-011 | info | product | C9 | The Spec-lint product box classifies AC1 among the "pure commands" while AC1's own label is `(command + read-verified)` — incompatible classifications for one criterion (non-blocking; AC1's label already carries the read-verified requirement) | SPEC `## Spec-lint` product box; SPEC AC1 label (line 430) | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
- Parent state: n/a (spec stage roots its own lineage)
```

# Repair batch `31-spec-6` — design-feature authoring turn (2026-09-17)

Owner: `design-feature` (instruction mode). Commission (explicit user
instruction, verbatim): "repair N31-009 + N31-010 + N31-011: make AC2's
contract-prose check discriminate (grep the description for a new-line
fragment such as material = \`medium\`/report-note, not the bare word medium,
or move the clause to read-verified), cover REPAIR.md §4's second sentence in
AC7 (grep -n \"no cycle cap converts\"
skills/design-feature/references/REPAIR.md` exits non-zero), and fix the
Spec-lint AC1 classification" — one repair batch for N31-009 + N31-010 +
N31-011. Trigger: the `spec-review-31-6` receipt (FAIL, checks C8/C9; 12/14
pass; N31-009 medium + N31-010 medium + N31-011 info, all product). One batch
over the whole open spec-stage set; the plan-stage rows R31-01/02/03 stay with
`plan-feature`.

**Cycle accounting (D-31-7):** this is the fourth consecutive unconverged
cycle of the window the carrier amendment opened (FAIL `spec-review-31-4` →
repair `31-spec-4` → FAIL `spec-review-31-5` → repair `31-spec-5` → FAIL
`spec-review-31-6` → this batch). The commission above is the explicit user
instruction that keys a further cycle (the third was user-keyed the same way
at `31-spec-5`), issued in answer to the `spec-review-31-6` hand-off that
named exactly this command and batch. Under the live POLICY §4 the loop is
uncapped — that is the defect this unit fixes — so the cycle is lawful on
both readings. The window's `CONVERGENCE-ANOMALY` block was printed on entry
to cycle 2 (reproduced in the `spec-review-31-5` and `spec-review-31-6`
receipts); POLICY §4's anomaly rule scopes to second-cycle entry, so no new
block is due for a user-keyed further cycle (REPAIR §4: a repair responding
to a persisted verdict is never a loop defect). Reproduced for the cycle
record:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-006/N31-007/N31-008 (repaired, 31-spec-5) / N31-009, N31-010, N31-011 (repaired, this batch)
- Snapshots: b9cf60a8e4e6… → 95d1551379b7… → fb69ad0b83e9… (artifactRevisionId fef66d09 → bccc95fd → 31-spec-6 label)
- Missed: AC2's `grep -n "medium"` anchor is non-discriminating (already satisfied by the enum literal); AC7 leaves REPAIR.md §4's second unbounded-cycle sentence uncriterioned; the Spec-lint box misfiles AC1
```

Repairs (classes in SPEC `## Amendments` `31-spec-6` + `decisions.md`):

- **N31-009** — AC2's second anchor re-pointed at two discriminating greps
  over `pre-execution-contract.ts` (`grep -nE 'material = .medium'`,
  `grep -n "report-note"`; both exit 1 at `bccc95fd`, both turn 0 only when
  the finding-record severity description states material = `medium`+;
  `low` is a report-note) — the severity enum literal at `:103` can no longer
  fake the pass; the read-verified alternative was not taken (a
  discriminating command anchor keeps AC2 `(command)` and objective).
- **N31-010** — AC7 gains the removal grep for REPAIR.md §4's second
  unbounded-cycle sentence (`grep -n "no cycle cap converts"
  skills/design-feature/references/REPAIR.md` → non-zero; fragment wholly on
  `:71`, unique in the file, exit 0 with the sentence standing at
  `bccc95fd`).
- **N31-011** — the Spec-lint product box re-files AC1 into the
  `command + read-verified` group its own label declares (AC2–AC3, AC5,
  AC10–AC12 pure commands; AC1, AC4, AC6–AC9, AC13–AC14 command +
  `read-verified`); no criterion text changes.

Gates at authoring start (branch `feat/31-planning-review-materiality`, head
`bccc95fd`): `node scripts/pre-execution-snapshot.mjs verify --stage spec
--unit 31-planning-review-materiality` → exit 4 (receipt not current — the
open FAIL receipt is this batch's input), `digestMatches: true` (the FAIL
receipt binds the bytes on disk). Architectural invariants: `n/a: no project
invariants declared` (NRS F010); AD-008 preserved by D-31-5 (unchanged). The
frozen `ACCEPTANCE.md` is not touched (plan-feature's owning artifact,
superseded set, re-cut on a fresh PASS).

Spec-lint product boxes re-run after the edits: all PASS (placeholders none —
`grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
over the Product half exits 1; out-of-scope 7 bullets; closure rows complete;
integration 14/14 derived subsystems; role matrix 5×5; sweep 19/19 resolved;
every in-scope item → ≥ 1 AC; every AC runnable or `read-verified` — AC2/3,
AC5, AC10–AC12 pure commands, AC1/AC4/AC6–AC9/AC13–AC14 command +
`read-verified`, matching every criterion's own label; deferred decisions
`none`).

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-6 · Rows checked: 5 evidence rows (batch) · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-17
```

Artifact revision rotates `31-spec-5` → **`31-spec-6`** (the write's bound
id is the commit that carries these bytes — this unit's receipt convention).

Post-edit selector check (readiness box 1): `node
scripts/pre-execution-snapshot.mjs verify --stage spec --unit
31-planning-review-materiality` re-derived the projection from the new bytes
(observedDigest `fb69ad0b83e9b8452834dadf047a57ce76e4221cd1f4d3aebee09a0da44b5dc9`,
exit 4), reporting exactly the declared by-design state — `fresh: false`,
reason `stale-artifact-content` ("bound artifact bytes moved since the
receipt"), `changedPaths: [docs/features/31-planning-review-materiality/SPEC.md]`.

# Review `spec-review-31-7` — cycle-4 re-review of the `31-spec-6` Product half (2026-09-17)

Cycle-4 independent re-review of the Product half the user-keyed `31-spec-6`
repair batch rewrote (`spec-review-31-6` → N31-009 + N31-010 + N31-011). Fresh
context; this conversation never authored or edited the Product half, its
ledgers, or its acceptance manifest. Cycle authorization: D-31-7's
user-instruction key, whose commission is quoted in `decisions.md` §"Product
repair batch (`31-spec-6`)" and in the `31-spec-6` section of
`planning-findings.md`.

Snapshot `c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3` @
source revision `bfdd3b54475007c4d53e87fecbf71ae3893f6809` (`spec-product-v1`
digest `542c5a44830af2fc7e23e1747d76206aca394d4de320b0c9f7ff29fdeb79dd8b`,
44354 bytes); handoff label `31-spec-6`. Verdict: `spec-review-fail` — 12/14
checks pass; C8 carries two `product` rows (N31-012 `medium`, N31-013 `low`).
N31-009/N31-010/N31-011 verified repaired at `31-spec-6`.

## Clean-context falsification (before the checks)

```text
FALSIFICATION — 31-planning-review-materiality @ bfdd3b54
- Name 3 specific product decisions a hostile reader could call invented rather
  than recorded: (1) the `reproducer` field on the schema finding record
  (In-scope 1 / AC3) — not in the issue text; authority is the D-31-6 carrier
  ruling + the carrier-amendment decision row (`decisions.md`, authority-kind
  `user`), so recorded, not invented. (2) the four skill `version:` bumps +
  CHANGELOG/README surfaces (In-scope 7 / AC14) — derived from In-scope 7 and
  the #176 freeze; recorded as E-D31-1 + evidence row. (3) the stage-scoped cap
  exit — plan stage gets refusal + `design-feature` routing instead of
  `needs-design` (In-scope 3 / D-31-8) — grounded in the fix/162 narrowing,
  re-read at `pre-execution-contract.ts:127-138` (`VERDICTS_BY_STAGE.plan` has
  no `needs-design`). None found invented without an authority row.
- The user outcome the SPEC promises that has no observable check: the
  wording-only route's POLICY §3 consequence. In-scope 5 declares POLICY §3
  loses "the mandate of a re-review for every batch", but no criterion observes
  any change to POLICY §3 — AC7's re-review greps are scoped to the two
  OUTPUT.md files (N31-012).
- One role the matrix leaves unspecified for a capability it does list: none —
  5 derived roles × 5 capabilities, every cell explicit `allowed`/`denied`.
- What would have to be true in the repository for this half to be wrong, and is
  it true? For In-scope 5's POLICY §3 claim to be verifiable, some AC command
  must fail while POLICY §3 still carries the unconditional re-review sentence.
  True: `grep -n "re-review of the resulting snapshot"
  skills/pre-execution-review/references/POLICY.md` → `42:`, exit 0 at
  `bfdd3b54`, and no AC pattern matches POLICY §3 (AC7's re-review regex names
  only the two OUTPUT.md files). Confirmed gap.
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3` @
source revision `bfdd3b54475007c4d53e87fecbf71ae3893f6809`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Every in-scope item names an observable outcome and its AC anchor: 1→AC1/AC2/AC3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8/AC9, 7→AC10/AC11/AC14, 8→AC12; the allowed-set groups→AC13. Business goals name the observable machine behaviours (report-note PASS coexistence, cap refusal, `NEEDS-DESIGN` route), not "improve X" |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5); every cell explicit `allowed`/`denied`; no unlisted role; the role blurb ("drivers & sensors validate and refuse; they never author findings") matches every cell |
| C3 | Entity closure | pass | E1–E3 resolve create/read/update/delete/state-transitions to a named surface + test; every `n/a` carries a reason (append-only ledger; derived machine/cycle value); zero blank rows |
| C4 | Limits and failure states | pass | Limit = findings ≤ 64 (unchanged) + the two-cycle cap; failure states resolved — unconverged loop → stage-scoped human stop (spec `NEEDS-DESIGN` per `VERDICTS_BY_STAGE.spec`; plan refusal + `design-feature` route), unrecorded rotation → `stale-artifact-revision`, material byte move → `stale-artifact-content` (exit 4), mislabeled defect → `medium` minimum; size `M` |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract, the owning feature (#159, code side), or an explicit exclusion (new vocabulary, retroactive rows, receipt binding, superseded plan set, aspirational citation, tutorial edit); nothing excluded by silence |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholders only), so the 12-row derived inventory is recorded and walked one row per subsystem; no `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists and the snapshot records the context `absent` |
| C7 | Expectation sweep | pass | 19 rows (≥ 10 for `M`), each forced to exactly one resolution with a pointer: 16 `in-scope`, 3 `out-of-scope`, zero unresolved |
| C8 | Acceptance objectivity | finding | AC2's two replacement anchors are verified discriminating (`grep -nE 'material = .medium'` and `grep -n "report-note"` over `pre-execution-contract.ts` both exit 1 at `bfdd3b54` and turn 0 only on the rewrite), and AC7's new REPAIR.md §4 grep discriminates (`:71` exit 0 with the sentence standing) — N31-009/N31-010/N31-011 repaired. But AC7 declares **every** In-scope-5 shrink surface covered while `POLICY.md` §3's re-review mandate is matched by no criterion → N31-012; and AC3's "bounded `reproducer`" is verified only as token presence + back-compat → N31-013 |
| C9 | Internal contradiction | pass | Materiality (`medium`+), the stage-scoped unconverged exit, the wording-only route and the four preserved contracts are consistent across Goal/Business goals/Scope/D-31-1…D-31-8/E3. The In-scope-5 phrasing for POLICY §3 ("loses the mandate of a re-review for every batch") vs. the default-plus-exemption the wording-only route implies is an ambiguity of the *unverifiable* §3 clause, filed under C8 as N31-012, not a second internal contradiction |
| C10 | Repository contradiction | pass | Claims re-read at `bfdd3b54`: `pre-execution.ts:1059` `severity !== "info"`; `FINDING_SPEC` fields at `pre-execution-contract.ts:457-500` carry no `reproducer`; severity enum `:102-105`; `PRE_EXECUTION_FRESHNESS_CODES` = 10 (`pre-execution.ts:159-170`); `VERDICTS_BY_STAGE` `:127-138` (spec has `needs-design`, plan does not); transition rows `review-spec`/`review-plan` (index.ts `:890,:923`); `LEDGERS.md:93` old line; POLICY §3 `:39-42` + §4 `:60-61,83`; `REPAIR.md:64-65,71`; both `CHECKS.md` old line (`:104`/`:105`); four skill versions 2.2.1/1.7.1/1.6.1/3.4.0; ROADMAP row 29 `done · #175`; `docs/CAPABILITIES.md` template; no `ARCHITECTURAL_INVARIANTS.md`. The one mismatch (In-scope 5's §3 shrink vs AC7's coverage) is filed under C8, not here |
| C11 | Evidence integrity | pass | Every `decisions.md` evidence row resolves to a `proven`/`decision` row at `current` freshness with a location; no `unknown`/`drifted`/`stale`; the `31-spec-6` batch's new rows (enum line, discriminating AC2 fragments, REPAIR §4 `:71`, receipt-state-at-authoring) are `current`; N31-008's three absence greps re-run and remain exit 1 today (`medium` minimum, `third cycle never` in POLICY.md, `report-note` in LEDGERS.md), so the authored-remainder framing holds |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, architecture, or validator: AC anchors name carriers and frozen identifiers as acceptance surfaces without assigning phases/tasks (the superseded plan set is declared re-cut) |
| C14 | Obligation containment | pass | No current-unit obligation is exported: README citation (AC12), bumps/pins (AC9/AC10/AC11/AC13/AC14) and the bibliography stay in-unit; the AD-008 amendment is conditional and owner-routed; the plan-stage rows R31-01/02/03 stay with `plan-feature`, not a future issue |

Findings: 2 (material open: 2) — N31-012 (`medium`, product), N31-013
(`low`, product) in `planning-findings.md`.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-7 · Snapshot: c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: bfdd3b54475007c4d53e87fecbf71ae3893f6809 · Artifact revision: bfdd3b54475007c4d53e87fecbf71ae3893f6809
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T17:24:00Z/2026-09-17T17:31:00Z · Findings: 2 (material open: 2)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 44354 · digest 542c5a44830af2fc7e23e1747d76206aca394d4de320b0c9f7ff29fdeb79dd8b · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 12/14 pass (C8 two rows); falsification CONFIRMED-GAPS; N31-012 `medium` blocks, N31-013 `low` is material under the live line and routes to design-feature
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-6` (SPEC `## Design
  status`; decisions.md repair-batch header). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `bfdd3b54…` — the same reconciliation prior receipts
  recorded; the label stays recorded here. `--artifact-revision 31-spec-6`
  yields the alternate digest
  `b7e8dcd9daa69b908d59d1f3349ca1424e1ff98deb7e7d9b29e09ffc03651f4f`; the
  standard consumer `verify` re-derives the bound one, so the receipt binds it.
- Reviewed bytes are committed at `bfdd3b54` (clean tree at review start), so
  the builder's "commit the bound artifacts" precondition held; no reviewed
  byte changed by this turn.
- `spec-review-31-6` is superseded by design (its bound Product bytes moved at
  `31-spec-6`); no other receipt's lineage is affected.

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — this review is the spec stage's fourth
consecutive unconverged cycle of the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` → `spec-review-31-5` FAIL #2 →
`31-spec-5` → `spec-review-31-6` FAIL #3 → `31-spec-6` → this FAIL #4). The
window's block was printed on cycle-2 entry and is reproduced in the
`spec-review-31-5`/`31-spec-6` receipts; this re-review is the user-keyed further
cycle D-31-7 sanctions, and under the live POLICY §4 the planning loop is still
uncapped (the defect this unit fixes). Reported here for the cycle record; it
grants no PASS and is not a stop:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-009/N31-010/N31-011 (repaired) / N31-012, N31-013 (new)
- Snapshots: 95d1551379b7573c2577a63e2be978a11b782d131de5a783b65b81223b681cfa → c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 (artifactRevisionId bccc95fd → bfdd3b54; handoff label 31-spec-5 → 31-spec-6)
- Missed: AC7 leaves POLICY §3's "before a single re-review of the resulting snapshot" uncriterioned (In-scope 5 declares the surface shrunk); AC3 verifies `reproducer` presence but not its declared bound
```

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-7",
    "verdict": "spec-review-fail",
    "snapshot": "c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3",
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

---

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 · Artifact revision: bfdd3b54475007c4d53e87fecbf71ae3893f6809
- Failed checks: C8
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | N31-012 | medium | product | C8 | AC7 verifies the re-review-for-every-batch mandate in both `OUTPUT.md` files but not in `POLICY.md` §3, which In-scope 5 declares shrunk and §Context names as the defect the wording-only route fixes; POLICY §3 still reads "before a single re-review of the resulting snapshot" (`:41-42`) and no criterion matches its removal or qualification, so a PR can leave §3 mandating the re-review the machine no longer requires with every AC green | In-scope 5; §Context 3rd bullet; AC7; `skills/pre-execution-review/references/POLICY.md:41-42`; observed `grep -n "re-review of the resulting snapshot" …/POLICY.md` → `42:` exit 0; AC7's re-review regex is scoped to the two `OUTPUT.md` files | verified |
  | N31-013 | low | product | C8 | AC3 claims "the bounded `reproducer`" but only proves token presence (`grep -n "reproducer"` exit 0) plus back-compat; the bound is unverified (`maxLength` optional at `verification-contract.ts:51`; no test asserts a `reproducer` bound), so an unbounded field can ship with AC3 green | SPEC AC3; `packages/agentic-workflow-schema/src/verification-contract.ts:51`; observed `grep -rn "reproducer" …/test/*.mjs` → no hits; `pre-execution-receipt.test.mjs:116` walks vocabularies, not per-field bounds | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
- Parent state: n/a (spec stage roots its own lineage)
```

# Repair batch `31-spec-7` — design-feature authoring turn (2026-09-17)

Owner: `design-feature` (instruction mode). Commission (explicit user
instruction, verbatim): "repair N31-012 + N31-013: add a POLICY.md §3
criterion to AC7 (single-line fragment such as grep -n \"re-review of the
resulting snapshot\" exits non-zero, or the intended qualified-sentence
fragment) so the declared §3 shrink is observable, and add a bound check for
the reproducer field to AC3 (or move 'bounded' to read-verified)" — one
repair batch for N31-012 + N31-013. Trigger: the `spec-review-31-7` receipt
(FAIL, check C8; 12/14 pass; N31-012 medium + N31-013 low, both product). One
batch over the whole open spec-stage set; the plan-stage rows
R31-01/02/03 stay with `plan-feature`.

**Cycle accounting (D-31-7):** this is the fifth consecutive unconverged
cycle of the window the carrier amendment opened (FAIL `spec-review-31-4` →
repair `31-spec-4` → FAIL `spec-review-31-5` → repair `31-spec-5` → FAIL
`spec-review-31-6` → repair `31-spec-6` → FAIL `spec-review-31-7` → this
batch). The commission above is the explicit user instruction that keys a
further cycle, issued in answer to the `spec-review-31-7` hand-off that named
exactly this command and batch. Under the live POLICY §4 the loop is
uncapped — that is the defect this unit fixes — so the cycle is lawful on
both readings. The window's `CONVERGENCE-ANOMALY` block was printed on entry
to cycle 2 (reproduced in the `spec-review-31-7` receipt); POLICY §4's
anomaly rule scopes to second-cycle entry, so no new block is due for a
user-keyed further cycle (REPAIR §4: a repair responding to a persisted
verdict is never a loop defect). Reproduced for the cycle record:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-009/N31-010/N31-011 (repaired, 31-spec-6) / N31-012, N31-013 (repaired, this batch)
- Snapshots: 95d1551379b7… → c9acd7885ea6… → (this batch's bytes) (artifactRevisionId bccc95fd → bfdd3b54 → 31-spec-7 label)
- Missed: AC7 leaves POLICY §3's "before a single re-review of the resulting snapshot" uncriterioned (In-scope 5 declares the surface shrunk); AC3 verifies `reproducer` presence but not its declared bound
```

Repairs (classes in SPEC `## Amendments` `31-spec-7` + `decisions.md`):

- **N31-012** — AC7 gains the removal grep for POLICY.md §3's re-review
  mandate (`grep -n "re-review of the resulting snapshot"
  skills/pre-execution-review/references/POLICY.md` → non-zero; the §3
  sentence wraps across `:41-42`, the fragment is its single second line
  `:42`, unique in the file, exit 0 with the sentence standing at branch head
  `6f1d024e` — the same line-wrap discrimination N31-006 gave the §4 greps;
  the qualified-sentence alternative was not taken, the removal fragment
  stays observable without fixing the replacement's wording).
- **N31-013** — AC3's `bounded` claim becomes command-observable: the field
  entry must declare its bound (`grep -A8 'key: "reproducer"'
  packages/agentic-workflow-schema/src/pre-execution-contract.ts | grep -c
  "maxLength"` ≥ 1 — `VerificationFieldSpec.maxLength` is optional at
  `verification-contract.ts:51`, count 0 today), a suite vector must
  exercise the field (`grep -rln "reproducer"
  packages/agentic-workflow-schema/test/` exits zero — exit 1 today), and
  the suite clause names the bound vector (over-long `reproducer` refused)
  beside the existing back-compatibility clause; AC3 stays `(command)` —
  the read-verified alternative was not taken.

Gates at authoring start (branch `feat/31-planning-review-materiality`, head
`6f1d024e`): `node scripts/pre-execution-snapshot.mjs verify --stage spec
--unit 31-planning-review-materiality` → exit 4 (receipt not current — the
open FAIL receipt is this batch's input), `digestMatches: true` (the FAIL
receipt binds the bytes on disk). Architectural invariants: `n/a: no project
invariants declared` (NRS F010); AD-008 preserved by D-31-5 (unchanged). The
frozen `ACCEPTANCE.md` is not touched (plan-feature's owning artifact,
superseded set, re-cut on a fresh PASS).

Spec-lint product boxes re-run after the edits: all PASS (placeholders none;
out-of-scope 7 bullets; closure rows complete; integration 14/14 derived
subsystems; role matrix 5×5; sweep 19/19 resolved; every in-scope item → ≥ 1
AC; every AC runnable or `read-verified` — AC2–AC3, AC5, AC10–AC12 pure
commands, AC1, AC4, AC6–AC9, AC13–AC14 command + `read-verified`, matching
every criterion's own label — AC3's new anchors are commands, its label is
unchanged; deferred decisions `none`).

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-7 · Rows checked: 4 evidence rows (batch) · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-17
```

Artifact revision rotates `31-spec-6` → **`31-spec-7`** (the write's bound
id is the commit that carries these bytes — this unit's receipt convention).

Post-edit selector check (readiness box 1): `node
scripts/pre-execution-snapshot.mjs verify --stage spec --unit
31-planning-review-materiality` re-derived the `spec-product-v1` projection
from the new bytes, reporting exactly the declared by-design state —
`fresh: false` ("bound artifact bytes moved since the receipt"),
`changedPaths: [docs/features/31-planning-review-materiality/SPEC.md]`.

→ Next: /review-spec 31-planning-review-materiality — product half designed and readiness-clean; it needs an
    independent review before any engineering planning (fifth user-keyed cycle of the window, D-31-7)
  · more to design → re-run /design-feature 31-planning-review-materiality "<instruction>" (upsert, destroys nothing,
      rotates the artifact revision)

---

## Re-review (`spec-review-31-8`, 2026-09-17)

Cycle-5 independent re-review of the Product half the `31-spec-7` repair batch
rewrote — the route `spec-review-31-7` named for N31-012/N31-013. Fresh
context; this conversation never authored or edited the Product half, its
ledgers, or its acceptance manifest → `contextClean: true`,
`authorExclusion: not-enforceable`, `modelDiversity: not-applicable`.

Snapshot `07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794` @
source revision `12ddc2154f6f9a5c88361dee95e38b4726e8e190` (`spec-product-v1`
digest `d4912d0cac1378f01f835a1629df4203ce7ceb3b6cd27fcf4cea2aba4e539153`,
45546 bytes); handoff label `31-spec-7`. Verdict: `spec-review-fail` — 13/14
checks pass; C8 carries one `product` row (N31-014 `medium`). N31-012 and
N31-013 are verified repaired at `31-spec-7`; N31-009/N31-010/N31-011 stay
`resolved` at `31-spec-6`; N31-006/N31-007/N31-008 at `31-spec-5`;
N31-004/N31-005 at `31-spec-4`; N31-001/N31-002/N31-003 at `31-spec-2`.

### Clean-context falsification (before the checks)

```text
FALSIFICATION — 31-planning-review-materiality @ 12ddc215
- Name 3 specific product decisions a hostile reader could call invented rather
  than recorded: (1) the `reproducer` field on the schema finding record
  (In-scope 1 / AC3) — not in the issue text; authority is the D-31-6 carrier
  ruling + the decisions.md carrier-amendment row (`authority-kind user`), so
  recorded. (2) the stage-scoped cap exit: `needs-design` at the spec stage,
  refusal + `design-feature` routing at the plan stage (D-31-8) — grounded in
  `VERDICTS_BY_STAGE` read at `pre-execution-contract.ts:127-138` (plan carries
  no `needs-design`) and fix/162; recorded. (3) the four skill `version:` bumps
  + CHANGELOG/README release surfaces (In-scope 7 / AC14) — derived from
  In-scope 7 and the #176 freeze (E-D31-1 + evidence row). None invented
  without an authority row.
- The user outcome the SPEC promises that has no observable check: the declared
  shrink of POLICY §4's unbounded-cycle sentences. §4's third claim — "... a
  repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new
  snapshot by design, so no cycle cap or anomaly rule may block or end it."
  (`POLICY.md:81-82`) — is matched by no criterion (AC7's only POLICY §4
  fragments are `:61` and `:83`), so the shipped POLICY.md can still assert no
  cap may end the loop with every AC green (N31-014).
- One role the matrix leaves unspecified for a capability it does list: none —
  5 derived roles × 5 capabilities, every cell explicit `allowed`/`denied`.
- What would have to be true in the repository for this half to be wrong, and is
  it true? For In-scope 5's POLICY §4 shrink to be fully criterioned, every
  unbounded-cycle sentence in §4 would need a matching AC fragment. True that it
  does not: `grep -n "no cycle cap or anomaly rule"
  skills/pre-execution-review/references/POLICY.md` → `82:` exit 0 at
  `12ddc215` (fragment unique in `skills/`), and the shipped rule (E3: "a third
  never starts: the orchestrator refuses") contradicts it. Confirmed gap.
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

Snapshot `07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794` @
source revision `12ddc2154f6f9a5c88361dee95e38b4726e8e190`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Every in-scope item names an observable outcome and its AC anchor: 1→AC1/AC2/AC3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8/AC9, 7→AC10/AC11/AC14, 8→AC12; the allowed-set groups→AC13. Business goals name machine behaviours (report-note coexistence, cap refusal, stage-scoped human route), not "improve X" |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5); every cell explicit `allowed`/`denied`; no unlisted role; the role blurb ("drivers & sensors validate and refuse; they never author findings") matches every cell |
| C3 | Entity closure | pass | E1–E3 resolve create/read/update/delete/state-transitions to a named surface + test; every `n/a` carries a reason (append-only ledger; derived machine/cycle value); zero blank rows |
| C4 | Limits and failure states | pass | Limit = findings ≤ 64 (unchanged) + the two-cycle cap; failure states resolved — unconverged loop → stage-scoped human stop (spec `NEEDS-DESIGN` per `VERDICTS_BY_STAGE.spec`; plan refusal + `design-feature` route), unrecorded rotation → `stale-artifact-revision`, material byte move → `stale-artifact-content` (exit 4), mislabeled defect → `medium` minimum; size `M` |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract, the owning feature (#159, code side), or an explicit exclusion (new vocabulary, retroactive rows, receipt binding, superseded plan set, aspirational citation, tutorial edit) |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholder rows only), so the 12-row derived inventory is recorded and walked one row per subsystem (recounted: 12 data rows at `:343-356`); no `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists and the snapshot records that context `absent` |
| C7 | Expectation sweep | pass | 19 rows (≥ 10 for `M`), each forced to exactly one resolution with a pointer: 16 `in-scope`, 3 `out-of-scope`, zero unresolved |
| C8 | Acceptance objectivity | finding | AC3's two new bound anchors and AC7's POLICY §3 anchor discriminate at `12ddc215` (AC3: `grep -A8 'key: "reproducer"' … \| grep -c "maxLength"` → 0 and `grep -rln "reproducer" …/test/` → exit 1; AC7: `grep -n "re-review of the resulting snapshot" …/POLICY.md` → `42:` exit 0) — N31-012/N31-013 repaired. But In-scope 5 declares POLICY §4 loses "the unbounded-cycle sentences" and AC7 claims coverage of "every declared surface", while §4's third unbounded-cycle claim (`POLICY.md:82`, "no cycle cap or anomaly rule may block or end it") is matched by no criterion → N31-014 |
| C9 | Internal contradiction | pass | Materiality (`medium`+), the stage-scoped unconverged exit, the wording-only route and the four preserved contracts are consistent across Goal/Business goals/Scope/D-31-1…D-31-8/E3; the uncriterioned §4 sentence is an acceptance-coverage gap (C8), not a second assertion inside the half |
| C10 | Repository contradiction | pass | Claims re-read at `12ddc215`: `pre-execution.ts:1059` `severity !== "info"`; `FINDING_SPEC` fields at `pre-execution-contract.ts:455-500` carry no `reproducer`; severity enum `:102-105` (the bare `medium` literal at `:103`); `PRE_EXECUTION_FRESHNESS_CODES` = 10 (`pre-execution.ts:159-170`); `VERDICTS_BY_STAGE` `:127-138` (spec has `needs-design`, plan does not); `maxLength?` optional at `verification-contract.ts:51`; `POLICY.md:42,61,83`; `REPAIR.md:71`; both `CHECKS.md` old line (`:104`/`:105`); LEDGERS §3 old line (`:93`); four skill versions 2.2.1/1.7.1/1.6.1/3.4.0; `README.md` has no `## References`; no root `package.json`; `bundle:skills` + `test` in `packages/pi-agentic-workflow/package.json`; `gate:pre-execution` in the schema package; `docs/CAPABILITIES.md` template; ROADMAP row 29 `done · #175` |
| C11 | Evidence integrity | pass | `decisions.md` carries 66 evidence rows (64 `proven` + 2 `decision`), every one at `current` freshness with a location; zero `unknown`/`drifted`/`stale` rows. The `31-spec-7` batch's rows (POLICY §3 wrap/uniqueness, the AC3 bound anchors and `maxLength` optionality, receipt state at authoring) re-verified `current` on disk here |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, architecture, or validator: AC anchors name carriers and frozen identifiers as acceptance surfaces without assigning phases/tasks (the superseded plan set is declared re-cut) |
| C14 | Obligation containment | pass | No current-unit obligation is exported: README citation (AC12), bumps/pins (AC9/AC10/AC11/AC13/AC14) and the bibliography stay in-unit; the AD-008 amendment is conditional and owner-routed; the plan-stage rows R31-01/02/03 stay with `plan-feature`, not a future issue |

Findings: 1 (material open: 1) — N31-014 (`medium`, product) in
`planning-findings.md`.

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-8 · Snapshot: 07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794 · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 12ddc2154f6f9a5c88361dee95e38b4726e8e190 · Artifact revision: 12ddc2154f6f9a5c88361dee95e38b4726e8e190
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T18:20:00Z/2026-09-17T18:34:00Z · Findings: 1 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 45546 · digest d4912d0cac1378f01f835a1629df4203ce7ceb3b6cd27fcf4cea2aba4e539153 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 13/14 pass (C8 one row); falsification CONFIRMED-GAPS; N31-014 `medium` blocks and routes to design-feature
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-7` (SPEC `## Design
  status`; decisions.md repair-batch header). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `12ddc215…` — the same reconciliation every prior receipt
  in this unit recorded; the label stays recorded here.
- Reviewed bytes are committed at `12ddc215` (clean tree at review start), so the
  builder's "commit the bound artifacts" precondition held; no reviewed byte
  changed by this turn.

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — this review is the spec stage's fifth
consecutive unconverged cycle of the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` → `spec-review-31-5` FAIL #2 →
`31-spec-5` → `spec-review-31-6` FAIL #3 → `31-spec-6` → `spec-review-31-7`
FAIL #4 → `31-spec-7` → this FAIL #5). The window's block was printed on
cycle-2 entry and is reproduced in the `spec-review-31-7` receipt and the
`31-spec-7` batch. POLICY §4's anomaly rule scopes to second-cycle entry; this
is the user-keyed further cycle the `31-spec-7` hand-off commissioned, and under
the live POLICY §4 the planning loop is still uncapped (the defect this unit
fixes). Reported here for the cycle record; it grants no PASS and is not a stop:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-012/N31-013 (repaired at 31-spec-7) / N31-014 (new)
- Snapshots: c9acd7885ea653c644f7df59484f0af68441ee7ba7c96323b723538f190e7fe3 → 07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794 (artifactRevisionId bfdd3b54 → 12ddc215; handoff label 31-spec-6 → 31-spec-7)
- Missed: POLICY §4's third unbounded-cycle sentence ("no cycle cap or anomaly rule may block or end it", :82) left without a criterion while In-scope 5 declares §4's unbounded-cycle sentences removed
```

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-8",
    "verdict": "spec-review-fail",
    "snapshot": "07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794",
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

---

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: 07bdbf673ff2299a76c90df0cb90092f6021f54a9f6861eae535916b43e56794 · Artifact revision: 12ddc2154f6f9a5c88361dee95e38b4726e8e190
- Failed checks: C8
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  |---|---|---|---|---|---|---|
  | N31-014 | medium | product | C8 | In-scope 5 declares POLICY.md §4 among the surfaces losing "the unbounded-cycle sentences" and AC7 claims coverage of "every declared surface", but AC7's removal set covers only two of §4's three: `grep -n "cycle is allowed when correctness needs it"` (`:61`) and `grep -n "no cap converts a verdict into a"` (`:83`). §4's third — "a repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new snapshot by design, so no cycle cap or anomaly rule may block or end it." (`:81-82`) — is matched by no criterion, so a PR can ship POLICY.md still asserting no cap may end the loop with every AC green, while the shipped rule refuses a third unconverged cycle (E3/AC5) | In-scope 5; AC7; E3 state transitions; AC5; `skills/pre-execution-review/references/POLICY.md:80-84`; observed `grep -n "no cycle cap or anomaly rule" …/POLICY.md` → `82:` exit 0 at `12ddc215` (fragment unique in `skills/`) | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
- Parent state: n/a (spec stage roots its own lineage)
```

→ Next: /design-feature 31-planning-review-materiality "repair N31-014: give POLICY.md §4's third unbounded-cycle sentence ('… so no cycle cap or anomaly rule may block or end it.', :82) a criterion in AC7 so the declared §4 shrink is observable" — one repair batch for N31-014, then /review-spec 31-planning-review-materiality re-reviews the new artifact revision
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC

# Repair batch `31-spec-8` — design-feature authoring turn (2026-09-17)

Owner: `design-feature` (instruction mode). Commission (explicit user
instruction, verbatim): "repair N31-014: give POLICY.md §4's third
unbounded-cycle sentence ('… so no cycle cap or anomaly rule may block or end
it.', :82) a criterion in AC7 so the declared §4 shrink is observable" — one
repair batch for N31-014. Trigger: the `spec-review-31-8` receipt (FAIL,
check C8; 13/14 pass; N31-014 `medium`, product). One batch over the whole
open spec-stage set (N31-012/N31-013 verified repaired at `31-spec-7`; no
other open product row; the plan-stage rows R31-01/02/03 stay with
`plan-feature`).

**Cycle accounting (D-31-7):** this is the sixth consecutive unconverged
cycle of the window the carrier amendment opened (FAIL `spec-review-31-4` →
repair `31-spec-4` → FAIL `spec-review-31-5` → repair `31-spec-5` → FAIL
`spec-review-31-6` → repair `31-spec-6` → FAIL `spec-review-31-7` → repair
`31-spec-7` → FAIL `spec-review-31-8` → this batch). The commission above is
the explicit user instruction that keys a further cycle, issued in answer to
the `spec-review-31-8` hand-off that named exactly this command and batch.
Under the live POLICY §4 the loop is uncapped — that is the defect this unit
fixes — so the cycle is lawful on both readings. The window's
`CONVERGENCE-ANOMALY` block was printed on entry to cycle 2 (reproduced in
the `spec-review-31-8` receipt); POLICY §4's anomaly rule scopes to
second-cycle entry, so no new block is due for a user-keyed further cycle
(REPAIR §4: a repair responding to a persisted verdict is never a loop
defect). Reproduced for the cycle record:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-012/N31-013 (repaired, 31-spec-7) / N31-014 (repaired, this batch)
- Snapshots: 07bdbf673ff2… → (this batch's bytes) (artifactRevisionId 12ddc215 → 31-spec-8 label)
- Missed: POLICY §4's third unbounded-cycle sentence ("no cycle cap or anomaly rule may block or end it", :82) left without a criterion while In-scope 5 declares §4's unbounded-cycle sentences removed
```

Repairs (classes in SPEC `## Amendments` `31-spec-8` + `decisions.md`):

- **N31-014** — AC7 gains the removal grep for POLICY.md §4's third
  unbounded-cycle sentence (`grep -n "no cycle cap or anomaly rule"
  skills/pre-execution-review/references/POLICY.md` → non-zero; the sentence
  wraps across `:81-82`, the fragment is its single second line `:82`,
  unique in the file (`grep -c` → 1) and in `skills/` (1 hit), exit 0 with
  the sentence standing at branch head `12ddc215` — the same line-wrap
  discrimination N31-006 gave the first two §4 greps and N31-012 the §3
  grep). Repair class: **closure completion** — reviewed product intent
  unchanged (In-scope 5 already declares §4's unbounded-cycle sentences
  among the shrunk surfaces; only this sentence's criterion was missing).

Gates at authoring start (branch `feat/31-planning-review-materiality`,
reviewer prerequisite commit `15c3b3c3` — the `spec-review-31-8` receipt +
N31-014 finding row committed verbatim, no reviewed byte changed; repair
batch written on top): `node scripts/pre-execution-snapshot.mjs verify
--stage spec --unit 31-planning-review-materiality` → exit 4 (receipt not
current — the open FAIL receipt is this batch's input), `digestMatches:
true`. Architectural invariants: `n/a: no project invariants declared` (NRS
F010); AD-008 preserved by D-31-5 (unchanged). The frozen `ACCEPTANCE.md` is
not touched (plan-feature's owning artifact, superseded set, re-cut on a
fresh PASS). ROADMAP row 31 stays `defined` (this write changes no scope or
status).

Spec-lint product boxes re-run after the edits: all PASS (placeholders none
over the Product half; out-of-scope 7 bullets; closure rows complete —
E1–E3 × CRUD/transitions, 12/12 derived integration subsystems, role matrix
5×5; sweep 19/19 resolved; every in-scope item → ≥ 1 AC; every AC runnable
or `read-verified` — AC7's label and kept-side anchors unchanged, one
addition; deferred decisions `none`).

Anchor discrimination re-verified at the post-edit head: all six AC7 removal
fragments hit their standing sentences (`REPAIR.md:64`, `REPAIR.md:71`,
`POLICY.md:83`, `POLICY.md:82` — the new fragment, `POLICY.md:61`,
`POLICY.md:42`); the kept-side anchors are red today by design (the authored
remainder does not exist pre-execution; they turn green at the shrink).

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-8 · Rows checked: 3 evidence rows (batch) · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-17
```

Artifact revision rotates `31-spec-7` → **`31-spec-8`** (the write's bound
id is the commit that carries these bytes — this unit's receipt convention).

Post-edit selector check (readiness box 1): `node
scripts/pre-execution-snapshot.mjs verify --stage spec --unit
31-planning-review-materiality` re-derived the `spec-product-v1` projection
from the new bytes, reporting exactly the declared by-design state —
`fresh: false` / `stale-artifact-content` ("bound artifact bytes moved since
the receipt"), `changedPaths: [docs/features/31-planning-review-materiality/SPEC.md]`.

→ Next: /review-spec 31-planning-review-materiality — product half designed and readiness-clean; it needs an
    independent review before any engineering planning (sixth user-keyed cycle of the window, D-31-7)
  · more to design → re-run /design-feature 31-planning-review-materiality "<instruction>" (upsert, destroys nothing,
      rotates the artifact revision)

---

# Review `spec-review-31-9` — cycle-6 re-review of the `31-spec-8` Product half (2026-09-17)

Cycle-6 independent re-review of the Product half the `31-spec-8` repair batch
rewrote — the route `spec-review-31-8` named for N31-014. Fresh context; this
conversation never authored or edited the Product half, its ledgers, or its
acceptance manifest → `contextClean: true`, `authorExclusion: not-enforceable`,
`modelDiversity: not-applicable`.

Snapshot `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507` @
source revision `6084983b99dceccaaab316c89c1f99e7438a28f2` (`spec-product-v1`
digest `9f22563ea1148fac99806ef9847b4e9b48e72e6c5a7e1d1619a5f67540f79474`,
46004 bytes); handoff label `31-spec-8`. Verdict: **`spec-review-pass`** —
14/14 checks pass, zero findings. N31-014 is verified repaired at `31-spec-8`
(the new AC7 POLICY §4 grep hits `POLICY.md:82` today and discriminates);
N31-012/N31-013 stay `resolved` at `31-spec-7`, N31-009/N31-010/N31-011 at
`31-spec-6`, N31-006/N31-007/N31-008 at `31-spec-5`,
N31-004/N31-005 at `31-spec-4`, N31-001/N31-002/N31-003 at `31-spec-2`.

### Clean-context falsification (before the checks)

```text
FALSIFICATION — 31-planning-review-materiality @ 6084983b
- Name 3 specific product decisions in this half that a hostile reader could
  call invented rather than recorded: (1) the schema finding record's
  `reproducer` field (In-scope 1 / AC3) — not in the issue text; authority is
  the D-31-6 carrier ruling (`decisions.md`, authority-kind `user`), so
  recorded. (2) the stage-scoped cap exit — `needs-design` at the spec stage,
  refusal + `design-feature` routing at the plan stage (D-31-8) — grounded in
  `VERDICTS_BY_STAGE` at `pre-execution-contract.ts:127-138` (the plan stage
  carries no `needs-design`) + fix/162; recorded. (3) the four skill `version:`
  bumps + CHANGELOG/README release cells (In-scope 7 / AC14) — derived from
  In-scope 7 and the #176 freeze. None invented without an authority row.
- The user outcome the SPEC promises that has no observable check: none found.
  Every in-scope item resolves to ≥ 1 criterion (1→AC1/AC2/AC3, 2→AC4,
  3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8/AC9, 7→AC10/AC11/AC14, 8→AC12, the
  allowed-set groups→AC13), and In-scope 5's declared shrink now has a
  discriminating AC7 removal grep for every fragment: POLICY §3 `:42`, POLICY
  §4 `:61`/`:82`/`:83`, both CHECKS.md (2 hits), both OUTPUT.md (4 hits),
  LEDGERS §3 `:93`, REPAIR §4 `:64`/`:71` — each observed exit 0 with its
  sentence standing at `6084983b`, so each turns non-zero only when the shrink
  lands.
- One role the matrix leaves unspecified for a capability it does list: none —
  5 derived roles × 5 capabilities, every cell an explicit `allowed`/`denied`,
  and the role blurb ("drivers & sensors validate and refuse; they never author
  findings") matches every cell.
- What would have to be true in the repository for this half to be wrong, and is
  it true? It would be wrong if a declared shrink surface still carried a
  machine-owned sentence with no criterion, or if a cited repository fact were
  stale. Re-checked at `6084983b`: the nine removal greps all exit 0 with the
  sentences standing, the four kept-side greps are red today by design (the
  authored remainder turns them green at the shrink), and every cited fact holds
  — the material predicate `finding.severity !== "info"` at
  `pre-execution.ts:1059`; `PRE_EXECUTION_FRESHNESS_CODES` = 10; `VERDICTS_BY_STAGE`
  at `pre-execution-contract.ts:127-138`; `maxLength?` optional at
  `verification-contract.ts:51`; `FINDING_SPEC` fields with no `reproducer` and
  the bare `medium` enum literal at `:103`; no root `package.json`;
  `bundle:skills` + `test` in `packages/pi-agentic-workflow/package.json`;
  `gate:pre-execution` in the schema package; `docs/CAPABILITIES.md` unseeded
  template; ROADMAP rows 29/30 `done`. Not true.
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

### Checks — one result each

Snapshot `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507` @
source revision `6084983b99dceccaaab316c89c1f99e7438a28f2`.

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Every in-scope item names an observable outcome and its AC anchor: 1→AC1/AC2/AC3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8/AC9, 7→AC10/AC11/AC14, 8→AC12; the allowed-set groups→AC13. Business goals name machine behaviours (report-note coexistence, cap refusal, stage-scoped human route), not "improve X" |
| C2 | Actors and roles | pass | 5 derived roles (human owner / author turn / reviewer turn / executor turn / drivers & sensors) × 5 capabilities (C1–C5); every cell explicit `allowed`/`denied`; no unlisted role; the role blurb matches every cell |
| C3 | Entity closure | pass | E1–E3 resolve create/read/update/delete/state-transitions to a named surface + test; every `n/a` carries a reason (append-only ledger; derived machine/cycle value); zero blank rows |
| C4 | Limits and failure states | pass | Limit = findings ≤ 64 (unchanged) + the two-cycle cap; failure states resolved — unconverged loop → stage-scoped human stop (spec `NEEDS-DESIGN` per `VERDICTS_BY_STAGE.spec`; plan refusal + `design-feature` route), unrecorded rotation → `stale-artifact-revision`, material byte move → `stale-artifact-content` (exit 4), mislabeled defect → `medium` minimum; size `M` |
| C5 | Scope and non-goals | pass | 7 non-goals, each naming the preserved contract, the owning feature (#159, code side), or an explicit exclusion (new vocabulary, retroactive rows, receipt binding, superseded plan set, aspirational citation, tutorial edit) |
| C6 | Integration closure | pass | `docs/CAPABILITIES.md` is the unseeded template (placeholder rows only), so the 12-row derived inventory is recorded and walked one row per subsystem; no `docs/architecture/ARCHITECTURAL_INVARIANTS.md` exists and the snapshot records that context `absent` |
| C7 | Expectation sweep | pass | 19 rows (≥ 10 for `M`), each forced to exactly one resolution with a pointer: 16 `in-scope`, 3 `out-of-scope`, zero unresolved |
| C8 | Acceptance objectivity | pass | Every criterion is objective and labelled (AC2/AC3/AC5/AC10–AC12 pure command; AC1/AC4/AC6–AC9/AC13/AC14 command + `read-verified`), and every in-scope bullet maps to ≥ 1 criterion. N31-014 repaired: AC7's removal set now covers all three POLICY §4 unbounded-cycle claims — the new `grep -n "no cycle cap or anomaly rule"` hits `POLICY.md:82` (exit 0, unique in `skills/`) alongside `:61` and `:83`; the §3 grep hits `:42`; both CHECKS.md (2), both OUTPUT.md (4), LEDGERS §3 (1) and REPAIR §4 (`:64`, `:71`) all hit their standing sentences. Nine discriminating removal greps, zero uncovered declared fragments |
| C9 | Internal contradiction | pass | Materiality (`medium`+), the stage-scoped unconverged exit, the wording-only route and the four preserved contracts are consistent across Goal/Business goals/Scope/D-31-1…D-31-8/E1–E3/AC1–AC14; the Spec-lint AC groups match each AC's own label (AC1 fixed), and the two 19-row/sweep and 5×5/12-row counts agree section to section |
| C10 | Repository contradiction | pass | Claims re-read at `6084983b`: `pre-execution.ts:1059` `severity !== "info"`; `FINDING_SPEC` fields (`pre-execution-contract.ts:455-500`) carry no `reproducer`; severity enum `:102-105` (bare `medium` at `:103`); `PRE_EXECUTION_FRESHNESS_CODES` = 10 (`pre-execution.ts:159-170`); `VERDICTS_BY_STAGE` `:127-138` (spec has `needs-design`, plan does not); `maxLength?` optional at `verification-contract.ts:51`; `POLICY.md:42,61,82,83`; `REPAIR.md:64,71`; both `CHECKS.md` old line (`:104`/`:105`); LEDGERS §3 old line (`:93`); four skill versions 2.2.1/1.7.1/1.6.1/3.4.0; `README.md` has no `2603.00539`; no root `package.json`; `bundle:skills` + `test` in `packages/pi-agentic-workflow/package.json`; `gate:pre-execution` in the schema package; `docs/CAPABILITIES.md` template; ROADMAP rows 29 `done · #175`, 30 `done · #188` |
| C11 | Evidence integrity | pass | `decisions.md` carries 69 evidence rows (67 `proven`/`current` + 2 `decision`/`not-applicable`, the sanctioned freshness for decision rows per `evidence-grounding/ROWS.md`), every one with a location; zero `unknown`/`drifted`/`stale` rows. The `31-spec-8` batch's row (the POLICY §4 `:82` wrap/uniqueness) re-verified `current` on disk here |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; D-31-5's AD-008 reconciliation is owner-routed (`resolve-repository-state`) behind a conditional trigger, not an open product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, or architecture: AC anchors name carriers and frozen identifiers as acceptance surfaces without assigning phases/tasks (the superseded plan set is declared re-cut by `plan-feature`) |
| C14 | Obligation containment | pass | No current-unit obligation is exported: README citation (AC12), bumps/pins (AC9/AC10/AC11/AC13/AC14) and the bibliography stay in-unit; the AD-008 amendment is conditional and owner-routed; the plan-stage rows R31-01/02/03 stay with `plan-feature`, not a future issue |

Findings: 0 (material open: 0).

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-9 · Snapshot: e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507 · Verdict: spec-review-pass
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 6084983b99dceccaaab316c89c1f99e7438a28f2 · Artifact revision: 6084983b99dceccaaab316c89c1f99e7438a28f2
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T18:40:00Z/2026-09-17T18:47:00Z · Findings: 0 (material open: 0)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 46004 · digest 9f22563ea1148fac99806ef9847b4e9b48e72e6c5a7e1d1619a5f67540f79474 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 14/14 pass; falsification NO-CONFIRMED-GAPS; N31-014 verified repaired, zero material findings
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-8` (SPEC `## Design
  status`; decisions.md repair-batch header). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `6084983b…` — the same reconciliation every prior receipt
  in this unit recorded; the label stays recorded here.
- Reviewed bytes are committed at `6084983b` (clean tree at review start), so the
  builder's "commit the bound artifacts" precondition held; no reviewed byte
  changed by this turn.

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — this review is the spec stage's sixth
consecutive unconverged cycle of the window the carrier amendment opened
(`spec-review-31-4` FAIL #1 → `31-spec-4` → `spec-review-31-5` FAIL #2 →
`31-spec-5` → `spec-review-31-6` FAIL #3 → `31-spec-6` → `spec-review-31-7`
FAIL #4 → `31-spec-7` → `spec-review-31-8` FAIL #5 → `31-spec-8` → this
converged re-review). The window's block was printed on cycle-2 entry and is
reproduced in the `spec-review-31-8` receipt and the `31-spec-8` batch. POLICY
§4's anomaly rule scopes to second-cycle entry; this is the user-keyed further
cycle the `31-spec-8` hand-off commissioned, and under the live POLICY §4 the
planning loop is still uncapped (the defect this unit fixes). The cycle
converged: reported here for the cycle record; it grants no PASS and is not a
stop, and the verdict stands on the checks alone.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": true,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-9",
    "verdict": "spec-review-pass",
    "snapshot": "e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — the write landed, `structural.fresh: true`, `current: true`, the
verdict is that stage's PASS; the consumer may act.)

---

## Verdict

```text
SPEC-REVIEW-PASS — 31-planning-review-materiality
- Snapshot: e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507 · Artifact revision: 6084983b99dceccaaab316c89c1f99e7438a28f2 · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

→ Next: /plan-feature 31-planning-review-materiality — Product half reviewed; the plan binds this receipt
  · design changed underneath → re-run /review-spec 31-planning-review-materiality first
  · recurring closure gaps across units → /product-audit (a systemic pattern, not one SPEC)

---

## Plan scaffold (`31-plan-3`, 2026-09-17)

`plan-feature` ran its engineering-planning route over the designed, reviewed
Product half and re-cut the plan set. The Product carrier ruling D-31-6
("redesign + replan — the plan set cut as `31-plan-1/2` is superseded, never
repaired") is the trigger; the Product half's own `## Design status` records the
condition it had to wait for ("`plan-feature` re-cuts the plan set … only on a
current `SPEC-REVIEW-PASS` receipt"), and `spec-review-31-9` is that receipt.

Routing, in order:

- Replan exemption probe: `node scripts/unit-route.mjs 31` → `route: execute`,
  `open-rows: 0` — the router is the finding-ledger router, so it names no plan
  work; the redirect gate's primary signal is the roadmap row, which read
  `defined` before this turn's write.
- Redirect gate: roadmap `defined` → Routing → designed scoped slug →
  `plan-feature-scaffold`.
- Product-review gate (`ROUTING.md`): the newest `## Pre-execution review receipt
  v1 — spec` block is `spec-review-31-9`, contract
  `agentic-workflow/pre-execution-review-receipt@1`, `stage: spec`, verdict
  `spec-review-pass`, zero open/unverified material rows, `contextClean: true`;
  the recomputed SPEC-stage snapshot from the bytes on disk is
  `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`, equal to
  the receipt's bound digest (`node scripts/pre-execution-snapshot.mjs verify
  --stage spec --unit 31-planning-review-materiality` → `current: true`,
  `digestMatches: true`, `structural.fresh: true`, exit 0). Gate passes.

Scaffold write (docs only — no code, no branch):

- Re-cut the Engineering half of `SPEC.md` and `PLAN.md`, `TASKS.md`,
  `testing.md`, `known-issues.md`, `architecture-notes.md` against the code
  carrier: five phases, P1 schema finding-record materiality → P2
  transition-decider cap refusal → P3 snapshot wording-only route → P4
  skill-reference prose shrink → P5 Hardening & PR.
- Re-froze `ACCEPTANCE.md` from AC1…AC14 with code-anchored validators:
  `git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md` →
  `3d7e7c9ee92314261e5529815c76b373e8ca2745` (the superseded `31-plan-2` blob
  was `d85e217acad1322d3caf4968715ef5d00e9189c0`).
- Re-cut `planning-evidence.md` (PE-001…PE-023, all `current`
  `proven`/`decision`) and `planning-obligations.md` (O1…O14 mirror AC1…AC14,
  O15 carries the AD-008 invariant; one phase and one task per row; no row
  `deferred`).
- Rotated the artifact revision label to **`31-plan-3`**; the Product half's
  bound bytes did not move (the `spec-product-v1` selector ends at the first
  level-2 heading after `## Design status`, so the Engineering half is outside
  it): post-write `build --stage spec` still answers
  `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`.
- Resolved the plan-stage finding rows R31-01/R31-02/R31-03 in place
  (`planning-findings.md`, resolving revision `31-plan-3`) and recorded
  engineering decisions E-D31-8…E-D31-14 in `decisions.md` (E-D31-5 superseded
  with its carrier). No finding row is left `open`.
- Roadmap: row 31 `defined → planned`, re-read after the write → the row
  literally reads `planned` (row 41).

Phase-lint (stdout, pasted verbatim — `node scripts/phase-lint.mjs
docs/features/31-planning-review-materiality/PLAN.md`, exit 0):

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:7:schema-finding-record-materiality
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:6:transition-decider-cap-refusal
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:snapshot-wording-only-route
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skill-reference-prose-shrink
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: 7ae7a09036d9fafc8cffbbc735ec06f9dc8a03d632ca2d1141785ac555e8bce7
```

Spec-lint: PASS — product boxes re-run as the regression check the template
requires (they still pass over the untouched Product half: 19 expectation rows,
zero blank closure rows, five capabilities × five roles, `Deferred decisions`
reads `none`, every criterion command-or-`read-verified` labelled); engineering
boxes PASS (dev scenarios present with every fixed category walked, all five
phases phase-lint clean with recorded fingerprints, `planning-evidence.md` and
`planning-obligations.md` present with no blank cells, one obligation row per
criterion with a phase and a validator, and no template placeholder anywhere in
the file).

Planning preflight (`planning-preflight`, two-stage contract):

```text
Preflight: Stage 1 — NRS consumed · arch: deferred
Preflight: NRS consumed · invariant classification: n/a: no project invariants declared (F010) — AD-008 preserved (D-31-5)
```

Readiness preflight (`evidence-grounding/references/READINESS.md`, `stage: plan`):

```text
READINESS — 31-planning-review-materiality plan READY-FOR-REVIEW
- Artifact revision: 31-plan-3 · Rows checked: 23 · Unknowns open: 0
- Evidence: planning-evidence.md · Frozen: 2026-09-17
```

Box walk (all eleven tick): governing Product half `designed` with a current
`spec-review-31-9` receipt for the exact parented snapshot; frozen
`ACCEPTANCE.md` present with one stable ID per criterion, a named validator per
row and the blob recorded; architecture impact names the affected surfaces with
`path:line` evidence rows and carries the `n/a` classification beside AD-008's
`preserves`; every obligation has exactly one row with phase, task, owner,
validator, required evidence and a non-blank status; the planning-evidence table
exists in its M/L home with every Engineering claim resolved; the scenario matrix
covers each named failure category with its phase and validator; every phase
passes the eight-box lint with its fingerprint recorded; the phase order matches
the `Depends on:` closure with the hardening phase last; the compatibility
boundary and rollback path are stated; no unresolved decision word remains and
each risk carries an owner; every evidence row is `current` and no unknown is
open.

Hand-off: the plan set is written and frozen, and a planned unit is not an
executable unit — the next step is the independent plan review
(`/review-plan 31-planning-review-materiality`), never execution. Artifact
revision `31-plan-3` is the id the reviewer binds.

Replan provenance and post-commit observations (same turn, appended after the
scaffold commit `13ba789d`):

- Plan snapshot at this revision, built with the Product parent the receipt
  binds: `node scripts/pre-execution-snapshot.mjs build --stage plan --unit
  31-planning-review-materiality --parent
  e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507` →
  `e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f`. The
  reviewer binds **that** digest (and `--parent e15374a3…`, the digest the
  `spec-review-31-9` receipt records), never a re-derived value.
- The Product **bytes** are provably unmoved by this write: `selectSpecProduct`
  over the committed `SPEC.md` answers digest
  `9f22563ea1148fac99806ef9847b4e9b48e72e6c5a7e1d1619a5f67540f79474`, 46004
  bytes — byte-identical to the artifact line `spec-review-31-9` records. The
  Engineering half and `## Amendments` sit outside the selector's boundary
  (PE-003/E-D31-11 evidence), so no Product criterion moved.
- The CLI's spec-stage answer **after** the commit is `stale-source-revision`
  (exit 4): the bound-path revision moved because the Engineering half lives in
  `SPEC.md`, which is the revision dimension, not the Product bytes. Plan review
  check L1 keys on "the Product bytes/contexts have not moved since", and both
  are unmoved (the digest above; the three context authorities untouched) — so
  the lineage holds and no `class: product` row is owed. Recorded here so the
  reviewer reads the code and its meaning rather than the code alone.
- Dependency and blocker check (run this turn, before the recommended next
  step): hard dependency 29 reads `done · [#175](…/pull/175)` (merged), soft
  dependency 30 reads `done · [#188](…/pull/188)` (merged) — the closure is met.
  The fix index carries exactly one row (#179, `pending`), which depends on
  features 30/31/32 rather than blocking 31, and no open fix-now row in this
  repository touches a module this SPEC changes (`docs/fix/162`'s F12 is a
  progress-ledger re-review item and `docs/fix/214`'s F12 an audit-pr closure
  item; both live in other units). No dependency, no blocker.

---

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-31-3 · Snapshot: e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f · Verdict: plan-review-fail
- Unit: 31-planning-review-materiality · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507 · Parent Product receipt: spec-review-31-9
- Source revision: 13ba789d5b8063c90501701fc525bd67087b1156 · Artifact revision: 13ba789d5b8063c90501701fc525bd67087b1156
- Reviewer: review-plan (fresh context, manual route) · Session: n/a (manual route) · Role: reviewer · Author: plan-feature-scaffold (31-plan-3 re-cut, 2026-09-17)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T22:05:00Z/2026-09-17T22:17:00Z · Findings: 5 (material open: 5)
- Ledgers read: planning-evidence 23 rows · obligations 15 rows (verified-capable: 0)
- Prior plan receipt (re-review only): plan-review-31-2 @ e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a
```

Artifact-revision notes:

- The planner's handoff label is `31-plan-3`. No runtime rotates `artifactRevisionId`
  in this environment, so this receipt binds the builder's digest-derived value
  `13ba789d…` (the newest commit touching the bound paths), which is the same
  reconciliation every prior receipt in this unit recorded. The label stays
  recorded here.
- **Cycle accounting.** This is the plan stage's third review of the window
  `plan-review-31-1` opened (FAIL #1 → `31-plan-2` → `plan-review-31-2` FAIL #2
  → `31-plan-3`). The `31-plan-3` set is not a repair of `31-plan-2`: the owner
  ruling D-31-6 (`SPEC.md` §Context, `decisions.md`) superseded that carrier and
  commissioned the re-cut as an explicit user instruction, and the re-cut binds
  the current Product receipt `spec-review-31-9`. Under the live POLICY §4 the
  guards gate blind re-reviews and never a repair performed in response to a
  persisted verdict; the anomaly is printed and routed, never a stop. Reported
  here for the cycle record: it grants no PASS and is not a stop, and the verdict
  stands on the checks alone.

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality plan
- Finding ids: P31-01 + P31-02 + P31-03 (new, this cycle) / F01, F02, F03, R31-01, R31-02, R31-03 (all resolved at 31-plan-2 / 31-plan-3)
- Snapshots: e1e6ddd80770cfd01cce16179a514c3323a57128986374e362f762a915fb1e9a → e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f (artifactRevisionId 31-plan-2/a3012f86 → 31-plan-3/13ba789d)
- Missed: the wording-only route's identity contract (planning-evidence PE-013/PE-014 evidence) and feature 38's A:12 sensor invariant (no evidence row reads `scripts/workflow-status-sensor.test.mjs`)
- Owning stage: plan
- Why the prior review failed: `plan-review-31-2` returned FAIL on R31-01 (stale Product parent, class product) and R31-02; the carrier ruling then moved the plan set into code rather than repairing it
- Route to owner: `plan-feature 31-planning-review-materiality` — one batch for P31-01 + P31-02 + P31-03 + P31-04 + P31-05, then `/review-plan` re-reviews the new artifact revision
```

- **L1 race check (POLICY §7).** Claimed parent digest
  `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`; recomputed
  from the bytes on disk with the receipt's own recorded revision
  (`build --stage spec --source-revision 6084983b… --artifact-revision 6084983b…`)
  → the same `e15374a3…`, and the `spec-product-v1` projection digest
  `9f22563ea1148fac99806ef9847b4e9b48e72e6c5a7e1d1619a5f67540f79474` (46004 bytes)
  plus the three context digests are byte-identical to the `spec-review-31-9`
  artifact line. The CLI's default `verify --stage spec` answers
  `stale-source-revision` because `SPEC.md`'s whole-file revision moved with the
  Engineering half (`contentRevision` covers all bound paths, the projection does
  not) — the Product *bytes/contexts* L1 keys on are unmoved, so the lineage
  holds. Recorded as the claimed-beside-recomputed pairing §7 requires.
- Reviewed bytes are committed at `13ba789d` (clean worktree at review start: `git status --porcelain` empty), so the builder's "commit the bound artifacts" precondition held; no reviewed byte changed by this turn.

Self-check (`verify --stage plan`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "plan",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "plan-review-31-3",
    "verdict": "plan-review-fail",
    "snapshot": "e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```


---

## Plan repair batch (`31-plan-4`, 2026-09-17)

`plan-feature` ran the repair batch `plan-review-31-3` commissioned (failed checks
L5, P3, P8, P10, P12; findings P31-03 high, P31-01/P31-02 medium, P31-04/P31-05
low). One batch over the whole set; no Product byte moved, no acceptance
criterion's required outcome weakened, and no test was changed.

What the batch did, per finding (engineering decisions E-D31-15…E-D31-19 in
`decisions.md`, evidence rows PE-024…PE-029 in `planning-evidence.md`):

- **P31-01** — the wording-only determination's home moves to the unit's unbound
  `progress.md` (precedent `## Dependency receipt v1`), so the revision the block
  must record survives the block's own write. E5, P3, `known-issues.md` §6.
- **P31-02** — the branch is specified after `stale-context` and before
  `stale-source-revision`, fed by a pure `wordingOnly` input, with the
  no-determination path falling through unchanged (the earlier
  `stale-artifact-revision` wording was wrong). E6, P3.
- **P31-03** — one shared pure helper `deriveReviewLoopCycles` in
  `scripts/pre-execution-contract.mjs` plus a `detail.review_loop_cycles`
  projection in `scripts/workflow-status.mjs`; feature 38's A:12 is preserved and
  pinned by the **already-packed** `scripts/review-loop-discipline.test.mjs` block
  (projection string + decider absence). The feature-38 suite is deliberately not
  added to AC10: it is outside every gate and red at this head (§10), so packing a
  red suite would make the gate unsatisfiable. E4, E7, P2, O5, O10, AC5, AC10.
- **P31-04** — the schema package's `CHANGELOG.md` row stays in P4 (the canonical
  phase contract forbids a `docs` target in a `config/infra` phase — verified:
  `scripts/phase-lint.mjs` blocks that shape), so the `normative-drift` window
  P1→P4 is declared in `known-issues.md` §12 and P4's done-when now closes it.
- **P31-05** — the Engineering half's evidence range corrected to
  `PE-001…PE-029`.

Newly surfaced during the batch and **left open** (the ledger's honesty rule: a
row stays in the unit's ledger, open, until the owner amends the governing SPEC):
`planning-findings.md` **P31-06** (`class: product`, medium) — AC13's declared
code-carrier group omits `scripts/pre-execution-contract.mjs`,
`scripts/workflow-status.mjs` and `scripts/workflow-status-pre-execution.test.mjs`,
paths the plan edits by design and the `31-plan-3` cut already edited, so the
frozen scope walk reports them as violations. It also records the live proof of
the validator-blind class: the repo's own `scripts/workflow-status-sensor.test.mjs`
is outside every gate and carries 3 pre-existing failures at this head (59 pass /
3 fail). Route:
`design-feature` amends the Product half's declaration, then `/review-spec`, then
the plan re-derives.

Gates run this turn, at the repaired revision:

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:7:schema-finding-record-materiality
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:8:transition-decider-cap-refusal
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:snapshot-wording-only-route
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skill-reference-prose-shrink
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: 4b681ff5de2757fce619dd3acded678c78352d2c0703706a67f2de720d4e56e9
```

- `bun test scripts/normative-drift.test.mjs scripts/pre-execution-quality.test.mjs
  scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs
  scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs
  scripts/review-loop-discipline.test.mjs scripts/workflow-status-pre-execution.test.mjs`
  → green. `scripts/workflow-status-sensor.test.mjs` (outside the ladder and the
  AC10 pack) → 59 pass / 3 fail; recorded in `known-issues.md` §11 and left to its
  owner (P31-06).
- `bun scripts/check-skill-context.mjs` → exit 0 (no skill byte moved in this
  batch).
- Plan snapshot at this revision:
  `node scripts/pre-execution-snapshot.mjs build --stage plan --unit
  31-planning-review-materiality --parent e15374a3…` →
  `52fdee14fddef1037114da2dec34998a44b95b31b254be25ad3ddaaefd92f674` (the
  `31-plan-3` digest `e1a22768…` and the intermediate `cebf6528…`/`c75c1c6e…` are
  superseded; this is the digest after every bound-artifact edit of the batch).
- Re-frozen acceptance manifest: `git hash-object
  docs/features/31-planning-review-materiality/ACCEPTANCE.md` →
  `650c7c8b21fdd6b7e2ec7b6c2c91672732201166` (the `31-plan-3` blob
  `3d7e7c9e…` is superseded).
- Artifact revision label rotated to **`31-plan-4`**; the Product half's bound
  bytes did not move (the `spec-product-v1` selector ends at the first level-2
  heading after `## Design status`), so `spec-review-31-9` stays the current
  Product receipt.

Hand-off: a repaired plan is not an approved plan. The next step is
`/review-plan 31-planning-review-materiality` (plan stage cycle 3 of the window
`plan-review-31-1` opened) — and the open P31-06 row means the Product half owes
a one-line amendment first if the reviewer judges it blocking.

# Product-half amendment batch `31-spec-9` — design-feature authoring turn (2026-09-17)

Owner: `design-feature` (instruction mode). Commission (explicit user
instruction, verbatim): "amendar el grupo code carriers de AC13 para incluir
scripts/pre-execution-contract.mjs, scripts/workflow-status.mjs y
scripts/workflow-status-pre-execution.test.mjs (P31-06) — una línea, sin
tocar el resto del Product half". Trigger: the open P31-06 row
(`medium`, `class: product`) that the `31-plan-4` repair batch left in
`planning-findings.md` — AC13's declared code-carrier group omits three
paths the plan edits by design, so the frozen scope walk reports them as
violations and AC13 can never pass. One batch over the whole open
spec-stage set set: P31-06 is the only open product row (N31-001…N31-014 all
resolved at `31-spec-2`…`31-spec-8`; the plan-stage rows P31-01…P31-05 are
resolved at `31-plan-4` and R31-01…R31-03 at `31-plan-3`).

The write (one declaration line + bookkeeping, per the instruction):

- `## Scope` **Code carriers** allowed-set group (walked by AC13) gains the
  three paths beside the four it already enumerated. Repair class:
  **closure completion** — AC13 already declares the walk over the group;
  only the group's enumeration lagged the plan (D-31-9,
  `decisions.md` evidence rows).
- Nothing else in the Product half moved: no criterion text, closure row,
  sweep row, non-goal, or In-scope item touched (`git diff` over
  `SPEC.md` shows the one group bullet + the `## Design status` rotation
  paragraph + the `## Amendments` entry — the latter two sit inside/outside
  the `spec-product-v1` selector per its boundary and are the mandated
  rotation/record).
- The frozen `ACCEPTANCE.md` is not touched (plan-feature's owning
  artifact, re-derived only on a fresh `SPEC-REVIEW-PASS` receipt). The
  open P31-06 row is resolved by the plan's re-derivation, not by this
  authoring turn.

Gates at authoring start (branch `feat/31-planning-review-materiality`,
clean tree at `7e6c5413`): architectural invariants `n/a: no project
invariants declared` (NRS F010); AD-008 preserved by D-31-5 (unchanged).
Roadmap row 31 stays `planned` (no scope or status change). Spec-lint
product boxes re-run after the edit: all PASS (19 expectation rows, zero
blank closure rows, 5×5 role matrix, `Deferred decisions` reads `none`,
every in-scope item → ≥ 1 AC, every AC command-or-`read-verified`).

Readiness preflight (`evidence-grounding`, `stage: spec`):

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-9 · Rows checked: 4 evidence rows (batch) · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-17
```

Artifact revision rotates `31-spec-8` → **`31-spec-9`** (the write's bound
id is the commit that carries these bytes — this unit's receipt convention).

→ Next: /review-spec 31-planning-review-materiality — product half designed and readiness-clean; it needs an
    independent review before any engineering planning (the amended half re-reviews; `plan-feature` then
    re-cuts the plan set and resolves P31-06 against the widened group)
  · more to design → re-run /design-feature 31-planning-review-materiality "<instruction>" (upsert, destroys
      nothing, rotates the artifact revision)

Post-commit observations (same turn, appended after the amendment commit
`f0042c62`):

- Spec-stage gate at the committed revision: `node
  scripts/pre-execution-snapshot.mjs verify --stage spec --unit
  31-planning-review-materiality` → `current: false`,
  `reasonCode: stale-source-revision` ("the artifacts were reviewed at
  `6084983b…`, the bound bytes now sit at `f0042c62…`"),
  `changedPaths: [docs/features/31-planning-review-materiality/SPEC.md]` —
  exactly the declared by-design state: the amendment moved the Product
  half's bound bytes, so `spec-review-31-9` is superseded and the next
  `/review-spec` run re-derives and binds the new snapshot
  (`observedDigest b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9`
  at this revision). The open P31-06 row stays with `plan-feature`'s
  re-derivation.

---

# Re-review `spec-review-31-10` — review-spec reviewer turn (2026-09-17)

Independent re-review of the Product half the `31-spec-9` amendment rewrote (the
`## Scope` **Code carriers** allowed-set group, triggered by the open P31-06
row). Fresh context — this conversation never authored or edited the Product half
→ `contextClean: true`; `authorExclusion: not-enforceable` (manual route);
`modelDiversity: not-applicable` (single reviewer). Cycle accounting per D-31-7:
`spec-review-31-9` returned PASS, so the consecutive-unconverged count reset to
0 and this is **cycle 1** of a new window — no `CONVERGENCE-ANOMALY` is owed.

Snapshot (built at the exact bytes read, one revision):

```text
digest   b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9
source   f0042c6210702ba2c884c960137e14135057266f
artifact f0042c6210702ba2c884c960137e14135057266f   (author handoff label `31-spec-9`)
spec row docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · 46282 bytes · 3dba9a8fdd7c16244ed22bbaf4adf9f229a48c85824c1f9df5576377210e118b
contexts project-guide CLAUDE.md ff24d7e4… present · normalized-repository-state docs/workflow/REPOSITORY_STATE.md e1b81e29… present · architectural-invariants docs/architecture/ARCHITECTURAL_INVARIANTS.md absent
```

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality @ f0042c62
- Name 3 specific product decisions in this half that a hostile reader could
  call invented rather than recorded:
  1. D-31-9's "the code-carrier group enumerates every path the plan edits by
     design" (decisions.md amendment batch) — its evidence rows cite only the
     three paths P31-06 named, never the full edited set (and the claim is
     false: see the finding below).
  2. Scope item 7's "the Pi mirror is re-bundled from the package that owns the
     bundler" — a design statement; no bound evidence row enumerates the mirror
     files.
  3. `## Design status`'s "readiness preflight READY-FOR-REVIEW at artifact
     revision `31-spec-9`" — the readiness block lives in the unbound
     `progress.md`; the reviewed bytes carry the assertion only.
- Name the user outcome the SPEC promises that has no observable check: none
  found — each Business goal maps to AC1–AC14.
- Name one role the matrix leaves unspecified for a capability it does list:
  none — the 5 roles × 5 capabilities matrix (C1–C5) lists every role.
- What would have to be true in the repository for this half to be wrong, and is
  it true? That the plan edits paths outside the declared allowed-set groups.
  TRUE: `PLAN.md:107-108` extends `scripts/pre-execution-attribution.test.mjs`
  and `scripts/pre-execution-sensor.test.mjs`, and neither is in any declared
  group (observed at `f0042c62`).
- Verdict stance before checking: CONFIRMED-GAPS
```

## Checks — one result each

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Business goals name observable outcomes (cycle-cost cut, structural loop termination, preserved honesty props); each In-scope item maps to ACs (1→AC1–3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8–9, 7→AC10/11/14, 8→AC12) |
| C2 | Actors and roles | pass | Derived role inventory (human owner, author turn, reviewer turn, executor turn, drivers & sensors) appears for all five capabilities C1–C5, each role `allowed`/`denied`; no unlisted role |
| C3 | Entity closure | pass | E1–E3 resolve Create/Read/Update/Delete/state-transitions; Delete is explicit `n/a: append-only ledger / derived value`; zero blank rows |
| C4 | Limits and failure states | pass | Limits stated (cap = two consecutive unconverged cycles; ≤64 findings; `reproducer` maxLength); named failures (`verdict-mismatch`, `stale-artifact-content`, `needs-design`) each carry a resolution |
| C5 | Scope and non-goals | pass | 7 out-of-scope bullets, each names a non-goal or an owner |
| C6 | Integration closure | pass | 12 derived subsystems, one row each; `docs/CAPABILITIES.md` recorded absent (unseeded template) with the derivation stated |
| C7 | Expectation sweep | pass | 19 rows (≥10 for M), each resolved in-scope/out-of-scope with a pointer |
| C8 | Acceptance objectivity | pass | AC1–AC14 objective and labelled command / command+`read-verified`; every In-scope bullet maps to ≥1 AC; Spec-lint box re-files AC1 consistently |
| C9 | Internal contradiction | **finding** | N31-015: AC4 (`SPEC.md:467-473`) requires `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → exit 0, i.e. both files must be edited, while AC13 (`SPEC.md:567`) + the `## Scope` code-carrier group (`SPEC.md:201-204`) forbid any diff path outside the declared groups and neither file is declared — the two criteria are mutually unsatisfiable |
| C10 | Repository contradiction | **finding** | N31-015: `PLAN.md:107-108` (P3) extends the same two suites; the half's declared group claims to cover the plan's designed edits but omits them (both files carry zero `wording-only` hits at `f0042c62`). The three paths the `31-spec-9` amendment added do exist on disk; all other source claims re-verified at `f0042c62` hold |
| C11 | Evidence integrity | pass | `decisions.md` carries 88 `current` evidence rows (87 `proven` + 1 `decision`), zero `unknown`/`drifted`/`stale`; every row names a location |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; the remaining open row (P31-06) is a plan-stage finding, not a deferred product choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task, or architecture; the allowed-set groups are a scope declaration, not a plan |
| C14 | Obligation containment | pass | No current-unit obligation is exported to a future issue; P31-06 routes to `plan-feature`'s re-derivation (its owner), and this review's N31-015 routes to `design-feature` |

Findings: 1 (material open: 1).

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-10 · Snapshot: b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9 · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: f0042c6210702ba2c884c960137e14135057266f · Artifact revision: f0042c6210702ba2c884c960137e14135057266f
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T23:00:00Z/2026-09-17T23:12:00Z · Findings: 1 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 46282 · digest 3dba9a8fdd7c16244ed22bbaf4adf9f229a48c85824c1f9df5576377210e118b · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 12/14 pass; C9 + C10 finding (N31-015); falsification CONFIRMED-GAPS
```

Artifact-revision notes:

- The design handoff names the authoring label `31-spec-9` (SPEC `## Design
  status`; `decisions.md` amendment header). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `f0042c62…` — the same reconciliation every prior receipt
  in this unit recorded; the label stays recorded here.
- Reviewed bytes are committed at `f0042c62` (clean tree at review start), so the
  builder's "commit the bound artifacts" precondition held; the only writes this
  turn makes are to the unbound `progress.md` and `planning-findings.md`, so the
  bound digest is unchanged by them.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-10",
    "verdict": "spec-review-fail",
    "snapshot": "b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — a verdict persisted but not a PASS: the mark landed (`structural.fresh:
true`, `digestMatches: true`) and the verdict itself is the emit result; route
per the FAIL below.)

---

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9 · Artifact revision: f0042c6210702ba2c884c960137e14135057266f
- Failed checks: C9, C10
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  | N31-015 | medium | product | C9, C10 | AC13's declared code-carrier group omits `scripts/pre-execution-attribution.test.mjs` and `scripts/pre-execution-sensor.test.mjs`, which AC4 requires to carry `wording-only` vectors and `PLAN.md` P3 edits — so AC4 and AC13 are mutually unsatisfiable; the same root cause P31-06 named, incompletely repaired by `31-spec-9` | SPEC.md `## Scope` code-carrier group (`:201-204`) vs AC4 (`:467-473`); `PLAN.md:107-108`; observed `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → no match at `f0042c62` | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
```

All other checks (C1–C8, C11–C14) pass; the failure is the single `product` row
above, and no reviewed artifact was modified by this turn.

→ Next: /design-feature 31-planning-review-materiality "add scripts/pre-execution-attribution.test.mjs and scripts/pre-execution-sensor.test.mjs to AC13's code-carrier group" — one repair batch for N31-015,
    then /review-spec 31-planning-review-materiality re-reviews the new artifact revision
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC

---

# User-commissioned Product-half patch `31-spec-10` — owner instruction (2026-09-17)

Owner ruling (explicit user instruction, verbatim, refusing a further
`design-feature` cycle): "No voy a rediseñar más arreglalo tú como un parche,
estamos tirando billones de tokens a la basura." The human owner amends the
governing SPEC directly (POLICY §5); this turn applies the mechanical enumeration
patch for `spec-review-31-10`'s only open row, **N31-015** (`medium`,
`class: product`).

The write (one enumeration line + bookkeeping):

- `## Scope` **Code carriers** allowed-set group (walked by AC13) gains
  `scripts/pre-execution-attribution.test.mjs` and
  `scripts/pre-execution-sensor.test.mjs` — the two remaining paths AC4 requires
  to carry `wording-only` vectors and `PLAN.md:107-108` (P3) extends. AC4 and
  AC13 no longer contradict; no criterion text, closure row, sweep row or
  non-goal moved.
- `## Design status` records the patch and the new artifact revision
  `31-spec-10`; a `### 31-spec-10` entry lands in `## Amendments`; `decisions.md`
  gains D-31-10 plus four evidence rows; `planning-findings.md` marks N31-015
  `resolved` at `31-spec-10`.
- The frozen `ACCEPTANCE.md` is untouched (plan-feature's owning artifact).
  `spec-review-31-10` is superseded by design (`stale-artifact-content`).

Owner-scoped re-review instruction: the mandatory fresh-context re-review
verifies **only** the patched part — C9/C10 and N31-015's resolution — and carries
the checks whose subjects this write did not move. It is not a full 14-check
re-sweep.

Artifact revision rotates `31-spec-9` → **`31-spec-10`**.



---

# Delta re-review `spec-review-31-11` — review-spec reviewer turn (2026-09-17)

Owner-scoped **delta re-review** of the Product-half patch `31-spec-10`
(commit `e4887dac`). Owner instruction, verbatim: "en la re-revisión solo
verifica que está parcheado y que está correcto, no verifiques todo, solo la
parte que fallaba." Independent reviewer, fresh context — this conversation
never authored nor edited the Product half → `contextClean: true`;
`authorExclusion: not-enforceable` (manual route, no session identity to
compare); `modelDiversity: not-applicable` (single reviewer).

Cycle accounting (D-31-7): `spec-review-31-9` returned PASS (count reset to 0),
`spec-review-31-10` returned FAIL → count 1, so this is **cycle 2** of the
window. The owner-commissioned patch `31-spec-10` is a repair responding to a
persisted FAIL receipt, so §4's carve-out keeps it unblocked; the anomaly is
printed and routed, never a stop (below).

Snapshot (built at the exact bytes read, one revision):

```text
digest   dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e
source   e4887dac35e5d4925f9bac239ddd7b5ad888064c
artifact e4887dac35e5d4925f9bac239ddd7b5ad888064c   (author handoff label `31-spec-10`)
spec row docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · 46362 bytes · e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02
contexts project-guide CLAUDE.md ff24d7e4… present · normalized-repository-state docs/workflow/REPOSITORY_STATE.md e1b81e29… present · architectural-invariants docs/architecture/ARCHITECTURAL_INVARIANTS.md absent
```

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — entry to the spec stage's cycle 2 of
the window `spec-review-31-9`'s PASS reset (`spec-review-31-10` FAIL #1 →
`31-spec-10` → this re-review). Reported on entry; grants no PASS and is not a
stop:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality spec
- Finding ids: N31-015 (repaired) / none new
- Snapshots: b3f1c415036ba9679f280dc4222e0cd9df0129bfbcbc35952316f7b108761df9 → dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e (artifactRevisionId f0042c62 → e4887dac)
- Missed: AC13's declared code-carrier group omitted the two suites AC4 requires (`scripts/pre-execution-attribution.test.mjs`, `scripts/pre-execution-sensor.test.mjs`); the earlier `31-spec-9` amendment repaired P31-06's three paths but not these two
- Owning stage: product
- Why the prior review failed: the `31-spec-9` carrier widening was an incomplete closure completion — the plan's own P3 edits were not walked against the declared groups
- Route to owner: `design-feature 31-planning-review-materiality` (here executed directly by the human owner, POLICY §5) — one enumeration patch, then this re-review
```

## Delta scope — what was re-checked, what was carried

`spec-review-31-10` failed exactly C9 and C10 (the single row N31-015). This
turn re-runs **only** C9 and C10 against the patched bytes; C1–C8 and C11–C14
are **carried** from `spec-review-31-10` — their subjects did not move (the
delta below shows the only Product-projection change is the code-carrier
enumeration plus the `## Design status` paragraph).

Byte evidence — `git diff f0042c62..HEAD -- docs/features/31-planning-review-materiality/SPEC.md`:

1. `## Scope` **Code carriers** (`SPEC.md:204-205`) gains
   `scripts/pre-execution-attribution.test.mjs` and
   `scripts/pre-execution-sensor.test.mjs`, inserted after
   `scripts/pre-execution-contract.mjs` (`:203`).
2. `## Design status` re-states the patch (the `31-spec-10` revision + the two
   added paths).
3. The `### 31-spec-10` entry under `## Amendments` is new — that section sits
   after the Engineering half and is **outside** the `spec-product-v1` selector,
   so it does not move the bound Product bytes.

Nothing else in the selector moved.

## Falsification (clean-context, delta-scoped)

```text
FALSIFICATION — 31-planning-review-materiality @ e4887dac
- Name 3 specific product decisions in this half that a hostile reader could
  call invented rather than recorded: none new in the delta — the patch records
  an enumeration, cites its authority (AC4 + PLAN.md P3), and adds no product
  decision.
- Name the user outcome the SPEC promises that has no observable check: none
  found in the delta (unchanged; carried from spec-review-31-10).
- Name one role the matrix leaves unspecified for a capability it does list:
  none (unchanged; carried).
- What would have to be true in the repository for this half to be wrong, and is
  it true? That the two added paths are NOT edited by the plan or NOT required
  by AC4 — FALSE: PLAN.md P3 task bullets (`PLAN.md:107-108`) extend both
  suites, AC4 (`SPEC.md:469-478`) grep-requires both to carry `wording-only`,
  and both files carry zero `wording-only` hits at e4887dac (observed
  `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs
  scripts/pre-execution-attribution.test.mjs` → exit 1), so the PR must edit
  them and the declaration is necessary.
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

## Checks — delta re-run (C9, C10) + carried set

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C2 | Actors and roles | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C3 | Entity closure | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C4 | Limits and failure states | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C5 | Scope and non-goals | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C6 | Integration closure | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C7 | Expectation sweep | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C8 | Acceptance objectivity | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C9 | Internal contradiction | **pass** | delta re-run: `## Scope` **Code carriers** (`SPEC.md:204-205`) now enumerates both `scripts/pre-execution-attribution.test.mjs` and `scripts/pre-execution-sensor.test.mjs`, and AC4 (`SPEC.md:469-478`) still requires `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` → exit 0. AC4's required edits and AC13's declared allowed set no longer conflict — N31-015's contradiction is closed |
| C10 | Repository contradiction | **pass** | delta re-run: every path the PLAN P1–P5 task bullets edit resolves to one of the three declared groups. P1 (`packages/agentic-workflow-schema/src/pre-execution-contract.ts`, `…/src/pre-execution.ts`, `…/test/pre-execution-receipt.test.mjs`, `package.json`, the two regenerated Draft-07 projections), P2 (`…/src/index.ts`, new `…/test/workflow-decision-review-loop-cap.test.mjs`, `scripts/pre-execution-contract.mjs`, `scripts/workflow-status.mjs`, `scripts/workflow-status-pre-execution.test.mjs`), P3 (`scripts/pre-execution-contract.mjs`, `scripts/pre-execution-snapshot.mjs`, `scripts/pre-execution-attribution.test.mjs`, `scripts/pre-execution-sensor.test.mjs`, `scripts/review-loop-discipline.test.mjs`) → **code carriers** (`packages/agentic-workflow-schema/**` glob + the enumerated `scripts/*`), and the D-31-10 additions close the two formerly-undeclared paths; P3's `ACCEPTANCE.md` read + P5's `progress.md`/`PLAN.md`/`ACCEPTANCE.md`/`docs/features/ROADMAP.md` writes → **workflow-mutated records** (`docs/features/31-planning-review-materiality/**`, the unit's ROADMAP row); P4's skill references/`SKILL.md` `version:`s, `CHANGELOG.md`, `README.md` (skill cells + the AC12 `## References` append), and the Pi mirror → **prose-shrink + derived surfaces**. Every edited path is covered; the two added paths exist on disk and carry zero `wording-only` hits at `e4887dac` |
| C11 | Evidence integrity | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C12 | Open product choices | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C13 | Engineering leakage | pass | carried from spec-review-31-10 (subject bytes unchanged) |
| C14 | Obligation containment | pass | carried from spec-review-31-10 (subject bytes unchanged) |

Findings: 0 (material open: 0).

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-11 · Snapshot: dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e · Verdict: spec-review-pass
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: e4887dac35e5d4925f9bac239ddd7b5ad888064c · Artifact revision: e4887dac35e5d4925f9bac239ddd7b5ad888064c
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature (owner amendment `31-spec-10`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T23:30:00Z/2026-09-17T23:44:00Z · Findings: 0 (material open: 0)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 46362 · digest e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 14/14 pass; C9 + C10 delta re-run (pass); C1–C8, C11–C14 carried from spec-review-31-10 (subject bytes unchanged); falsification NO-CONFIRMED-GAPS
```

Artifact-revision notes:

- The handoff names the authoring label `31-spec-10` (`SPEC.md` `## Design
  status`; `## Amendments` `### 31-spec-10`). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `e4887dac…` — the label stays recorded here.
- Delta re-review by owner instruction: only C9 (AC4 ↔ AC13 contradiction) and
  C10 (plan paths vs declared groups) were re-executed against the patched
  bytes; the remaining twelve checks are carried from `spec-review-31-10`
  because the delta changed only the code-carrier enumeration and the
  `## Design status` paragraph inside the `spec-product-v1` projection.
- Reviewed bytes are committed at `e4887dac` (clean tree at review start), so
  the builder's "commit the bound artifacts" precondition held; the only writes
  this turn makes are to the unbound `progress.md` and `planning-findings.md`,
  so the bound digest is unchanged by them.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": true,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-11",
    "verdict": "spec-review-pass",
    "snapshot": "dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — a PASS: `structural.fresh: true`, `current: true`, `digestMatches:
true`.)

---

## Verdict

```text
SPEC-REVIEW-PASS — 31-planning-review-materiality
- Snapshot: dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e · Artifact revision: e4887dac35e5d4925f9bac239ddd7b5ad888064c · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

All 14 checks resolve to `pass`; the delta re-run clears C9 and C10, and the
carried set is unchanged. N31-015 stays `resolved` at `31-spec-10` in
`planning-findings.md` (verified; no new row). No reviewed artifact was modified
by this turn.

→ Next: /plan-feature 31-planning-review-materiality — Product half reviewed; the plan binds this receipt
  · design changed underneath → re-run /review-spec 31-planning-review-materiality first
  · recurring closure gaps across units → /product-audit (a systemic pattern, not one SPEC)

---

## Plan re-derivation (`31-plan-5`, 2026-09-17)

`plan-feature` ran its engineering route over the designed Product half after the
owner-commissioned Product patches `31-spec-9`/`31-spec-10`. The plan's parent was
`spec-review-31-9` @ `e15374a3…`; those two patches moved the Product half's bound
bytes (AC13's code-carrier group) and `spec-review-31-11` returned
`spec-review-pass` on them, so the plan descended from a stale parent — the exact
lineage class R31-01 named — and still carried the open plan-stage row P31-06.
Repair owner: `plan-feature`, on the Product reviewer's own hand-off ("Product half
reviewed; the plan binds this receipt").

Routing, in order:

- Replan exemption probe: `node scripts/unit-route.mjs 31` → `route: execute`,
  `open-rows: 0` — the router is the code-review finding-ledger router: it reads
  `review-findings.md`, which this unit does not have, and is blind to the
  stage-aware `planning-findings.md` where P31-06's open row lives. Its `execute`
  line cannot be followed here (no current Plan receipt exists and `execute-phase`'s
  own pre-execution gate would refuse these bytes), so the recorded disclosure
  stands and the re-derivation follows the state the ledgers carry, as in the
  `31-plan-2`/`31-plan-4` turns. This is the same routing-surface gap already
  reported for triage (`unit-route`'s `replan` route is unreachable for plan-class
  rows); it is not fixed in this unit's scope.
- Redirect gate: roadmap row 31 reads `planned`; the plan is re-derived, never
  re-scaffolded.
- Product-review gate (`ROUTING.md`): the newest `## Pre-execution review receipt
  v1 — spec` block is `spec-review-31-11`, contract
  `agentic-workflow/pre-execution-review-receipt@1`, `stage: spec`, verdict
  `spec-review-pass`, 14/14 checks, zero open/unverified material findings,
  `contextClean: true`; the recomputed SPEC-stage snapshot from the bytes on disk
  is `dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e`, equal to
  the receipt's bound digest (`pre-execution-snapshot.mjs verify --stage spec` at
  the clean turn-start revision → `current: true`, `structural.fresh: true`).

What the re-derivation changed (no phase, task, validator, or acceptance
criterion's required outcome: both Product patches were enumeration-only):

- The plan snapshot's parent binds `spec-review-31-11` @ `dd09372a…` (E-D31-20).
- `planning-findings.md` **P31-06** flips to `resolved`: AC13's declared
  code-carrier group now enumerates every path the plan edits by design, so the
  frozen scope walk (O13) is satisfiable.
- `E-D31-18`'s CHANGELOG-row allocation and the `PLAN.md`/`TASKS.md` P4 task 8
  parenthetical are corrected to the linter-valid one — the schema package's 4.3.0
  companion row stays in the `docs` P4, because the canonical phase contract's box
  2 refuses a `docs` target in the `config/infra` P1 — and `known-issues.md` gains
  the `normative-drift` window P1→P4 declaration its own text already claimed
  (E-D31-21, `known-issues.md` §12). The duplicate item numbering in
  `known-issues.md` was repaired (`§11` is now the feature-38 red suite).
- `ACCEPTANCE.md` is re-frozen against the new Product base; every validator is
  byte-identical to the `31-plan-4` manifest's (the blob rotates only for the
  recorded lineage).
- Artifact revision rotates `31-plan-4` → **`31-plan-5`**; engineering decisions
  E-D31-20/E-D31-21 and evidence rows PE-030…PE-032 record it.

Preflight (`planning-preflight`, two-stage):

```text
Preflight: Stage 1 — NRS consumed · arch: deferred
Preflight: NRS consumed · invariant classification: n/a: no project invariants declared (F010) — AD-008 preserved (D-31-5)
```

Gates run this turn, at the repaired revision:

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:7:schema-finding-record-materiality
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:8:transition-decider-cap-refusal
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:snapshot-wording-only-route
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skill-reference-prose-shrink
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: 4b681ff5de2757fce619dd3acded678c78352d2c0703706a67f2de720d4e56e9
```

- `bun test scripts/normative-drift.test.mjs scripts/pre-execution-quality.test.mjs
  scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs
  scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs
  scripts/review-loop-discipline.test.mjs scripts/workflow-status-pre-execution.test.mjs`
  → **144 pass / 0 fail** (exit 0).
- `bun scripts/check-skill-context.mjs` → exit 0 (`PASS context budgets: 40 skills`);
  no skill byte moved in this re-derivation.
- Plan snapshot at the repaired revision, parented to the current Product receipt:
  `node scripts/pre-execution-snapshot.mjs build --stage plan --unit
  31-planning-review-materiality --parent dd09372a…` →
  `b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be` (the
  `31-plan-4` bytes' parent-bound digest `e3e86e2a…` and the `31-plan-3` digest
  `e1a22768…` are superseded at this revision).
- Re-frozen acceptance manifest: `git hash-object
  docs/features/31-planning-review-materiality/ACCEPTANCE.md` →
  `849af5ae7bccc7bc815d60d8ca2a9e0400161df9` (the `31-plan-4` blob
  `650c7c8b…` is superseded).
- **Lineage L1 (claimed beside recomputed).** The current Product receipt is
  `spec-review-31-11` @ snapshot `dd09372a…`, whose `spec-product-v1` artifact
  line records digest
  `e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02` at 46362
  bytes. Recomputed from the bytes on disk with the receipt's own recorded
  revision (`build --stage spec --source-revision e4887dac… --artifact-revision
  e4887dac…`) → the same `dd09372a…` and the same `e9ce9abf…` projection: the
  Product bytes and the three context authorities are unmoved. The CLI's
  whole-file answer after the commit is `stale-source-revision` (exit 4,
  `changedPaths: [SPEC.md]`) because the Engineering half lives in the same file
  and `contentRevision` covers every bound path — the known false signal
  `plan-review-31-3` already recorded; no `class: product` row is owed, and the
  L1 keys (Product bytes/contexts) hold.
- Artifact revision label rotated to **`31-plan-5`**.

Readiness preflight (`evidence-grounding/references/READINESS.md`, `stage: plan`):

```text
READINESS — 31-planning-review-materiality plan READY-FOR-REVIEW
- Artifact revision: 31-plan-5 · Rows checked: 32 · Unknowns open: 0
- Evidence: planning-evidence.md · Frozen: 2026-09-17
```

Box walk (all eleven tick): (1) the governing Product half is `designed` and
`spec-review-31-11` is a current `SPEC-REVIEW-PASS` receipt for the exact snapshot
being parented (`dd09372a…`), with the projection recomputed above; (2)
`ACCEPTANCE.md` is frozen with one stable ID per criterion, a named validator per
row and blob `849af5ae…` recorded; (3) the SPEC's Architecture impact names the
affected surfaces with `path:line` evidence rows and carries AD-008 `preserves`
(D-31-5); (4) `planning-obligations.md` carries O1…O15, one phase and one task
each, with implementation owner, validator, required evidence and a non-blank
status; (5) `planning-evidence.md` exists (M/L), is compact, and every Engineering
claim resolves to a row (PE-001…PE-032); (6) the scenario matrix covers each
failure category with its phase and validator; (7) all five phases pass
phase-lint, fingerprints recorded; (8) phase order matches the `Depends on`
closure and P5 is the hardening/close-out phase; (9) the compatibility boundary
and rollback path are stated and no unnamed public contract change exists; (10)
`Open questions / risks` is resolved (the `31-plan-4` and `31-plan-5` bullets
name their fixes) and no decision word remains; (11) every evidence row is
`current` with zero unknowns.

Cycle accounting (D-31-7): the plan-stage window `plan-review-31-1` opened has
three reviews — `plan-review-31-1` FAIL (#1), `plan-review-31-2` FAIL (#2) and
`plan-review-31-3` FAIL (#3, owner-commissioned under D-31-6), whose
`CONVERGENCE-ANOMALY` block stands byte-unchanged. This re-derivation is not a
blind re-review of unchanged bytes: the reviewed Product parent moved twice under
it, so `31-plan-5` is a new artifact revision the Product review the owner
commissioned owes, and the `/review-plan` it hands off to is the window's next
cycle, started from the explicit user instruction that invoked `plan-feature`
here rather than from an automatic loop.

Dependency and blocker check (run this turn, before the recommended next step):
hard dependency 29 reads `done · [#175](…/pull/175)` (merged) and soft dependency
30 reads `done · [#188](…/pull/188)` (merged) — the closure is met. The fix index
carries exactly one row (#179, `pending`), which depends on features 30/31/32
rather than blocking 31, and no open issue or fix-now row in this repository
touches a module this SPEC changes (#205 — the review-loop convergence feature —
depends on 31, and #171 is this unit's own tracking issue). No dependency, no
blocker.

Hand-off: a repaired plan is not an approved plan. The next step is
`/review-plan 31-planning-review-materiality` — the new artifact revision is
`31-plan-5` (`ecde13dc`), bound to parent snapshot `dd09372a…`, and the reviewer
re-derives plan snapshot `b17009ea…`.

---

## Pre-execution review receipt v1 — plan

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-31-4 · Snapshot: b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be · Verdict: plan-review-fail
- Unit: 31-planning-review-materiality · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e · Parent Product receipt: spec-review-31-11
- Source revision: ecde13dc2153ce96b28d36803c7cb110c2b19c8d · Artifact revision: ecde13dc2153ce96b28d36803c7cb110c2b19c8d
- Reviewer: review-plan@pi · Session: pi-web-manual · Role: reviewer · Author: plan-feature (31-plan-5 re-derivation)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T23:30:00Z/2026-09-17T23:46:00Z · Findings: 5 (material open: 4)
- Ledgers read: planning-evidence 32 rows · obligations 15 rows (verified-capable: 0)
- Prior plan receipt (re-review only): plan-review-31-3 @ e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f
```

Artifact-revision notes:

- The planner's handoff label is `31-plan-5`. No runtime rotates
  `artifactRevisionId` in this environment, so this receipt binds the builder's
  digest-derived value `ecde13dc…` (the newest commit touching the bound paths),
  the same reconciliation every prior receipt in this unit recorded. `HEAD` at
  review start is `2300b0d7`, a `progress.md`-only commit (unbound), which is why
  it does not move the content revision.
- **Snapshot.** `node scripts/pre-execution-snapshot.mjs build --stage plan --unit
  31-planning-review-materiality --parent dd09372a…` printed
  `b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be` — the digest
  the handoff names. One revision, whole-file rows for `spec`, `acceptance`,
  `plan`, `tasks`, `testing`, `decisions`, `architecture-notes`,
  `planning-evidence`, `obligations`; `parentSpecSnapshotDigest` = `dd09372a…`.
- **Lineage L1 (claimed beside recomputed).** The current Product receipt is
  `spec-review-31-11` @ `dd09372a…`. Recomputed from the bytes on disk with the
  receipt's own recorded revision (`build --stage spec --source-revision
  e4887dac… --artifact-revision e4887dac…`) → the same `dd09372a…` and the same
  `spec-product-v1` projection digest
  `e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02` at 46362
  bytes, with the three `CONTEXT_SOURCES` digests
  (NRS `e1b81e29…`, `CLAUDE.md` `ff24d7e4…`, architectural-invariants absent)
  unmoved. The Product bytes and contexts hold; the whole-file
  `stale-source-revision` answer the CLI returns is the known false signal
  `PE-003`/`plan-review-31-3` already recorded (the Engineering half lives in the
  same `SPEC.md`), and no `class: product` row is owed for it.
- **Cycle accounting (D-31-7).** This is the plan stage's **fourth** review of the
  window `plan-review-31-1` opened (FAIL #1 → `31-plan-2` → FAIL #2 → `31-plan-3`
  → FAIL #3 → `31-plan-4`/`31-plan-5`). It is not a blind re-review: the snapshot
  moved (`e1a22768…` → `b17009ea…`) and the bound Product parent moved twice
  (`spec-review-31-9` → `spec-review-31-11`), and it names findings no prior cycle
  named (P31-07/P31-08). Under the live POLICY §4 the anomaly is printed and
  routed, never a stop, so the verdict stands on the checks alone; the block below
  records the (now fourth) cycle.
- Reviewed bytes are committed at `2300b0d7` (clean worktree at review start:
  `git status --porcelain` empty), so the builder's "commit the bound artifacts"
  precondition held; the only writes this turn makes are to the unbound
  `progress.md` and `planning-findings.md`, so none of the nine bound rows moves.

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality plan
- Finding ids: P31-07 + P31-08 + P31-09 + P31-10 + P31-11 (new, this cycle) / R31-01…R31-03, F01…F03, P31-01…P31-05 (resolved at 31-plan-3/31-plan-4), P31-06 (resolved at 31-plan-5)
- Snapshots: e1a227682e2c4bd8f00a8b5d9a373f6b5348825c0978d3b4a0acb5d60725753f → b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be (artifactRevisionId 31-plan-3/13ba789d → 31-plan-5/ecde13dc)
- Missed: the two existing package gates P1's own done-when runs — the `4.2.0` version pins in `packages/agentic-workflow-schema/test/release-contract.test.mjs` and `verification-gates.test.mjs`, and `pre-execution-docs.test.mjs`'s "every published limit is documented" walk over `PRE_EXECUTION_LIMITS` (no planning-evidence row reads any of the three)
- Owning stage: plan
- Why the prior review failed: `plan-review-31-3` returned FAIL on P31-01…P31-05; the `31-plan-4` batch repaired them and the `31-plan-5` re-derivation re-parented the plan and closed P31-06 without re-deriving P1's edit set against the package suite it runs as its done-when
- Route to owner: `plan-feature 31-planning-review-materiality` — one batch for P31-07 + P31-08 + P31-09 + P31-10 + P31-11, then `/review-plan` re-reviews the new artifact revision
```

---

# Plan repair batch (`31-plan-6`), 2026-09-17

Route: `plan-feature 31-planning-review-materiality` — the repair owner
`plan-review-31-4`'s `CONVERGENCE-ANOMALY` block named, commissioned by the user
as one batch over P31-07 + P31-08 + P31-09 + P31-10 + P31-11. Loaded contract:
`replan-findings` + its `references/PHASE_APPEND.md` on the repair-entry reading
the `31-plan-2` batch recorded (the finding already pins the scope; no planning
preflight was consumed).

Router disclosure (recorded, never silently worked around):
`node scripts/unit-route.mjs 31-planning-review-materiality` answers
`route: execute` (`open-rows: 0`) because it reads the unit's
`review-findings.md` — the code-side fix-now fold ledger, which this unit does not
have — and is blind to the stage-aware `planning-findings.md` where plan-class
rows live. The unit's plan review is nevertheless a FAIL with four open material
rows and `execute-phase`'s own pre-execution gate would refuse these bytes, so the
commissioned repair followed the verdict's named repair owner instead of the
router's line. This is the same routing-surface gap in the `unit-route` family
(its `replan` route is unreachable for plan-class rows) the `31-plan-2` batch
reported for triage rather than fixing inside this unit's scope.

Product-review gate (before any write): `spec-review-31-11` is the newest
`stage: spec` receipt and its verdict is `spec-review-pass`. The snapshot
recomputed from the bytes on disk with the receipt's own recorded revision
(`build --stage spec --source-revision e4887dac… --artifact-revision e4887dac…`)
is `dd09372a…` — the receipt's `snapshotDigest` — and the `spec-product-v1`
projection digest (`e9ce9abf…`, 46362 bytes) plus the three context digests are
byte-identical to it. The default `verify --stage spec` answers
`stale-source-revision` over `SPEC.md` because the Engineering half lives in the
same file and its revision moved (`ecde13dc…`), the known whole-file false signal
PE-003 records; the Product bytes and contexts are unmoved, so the plan's parent
stays `spec-review-31-11` @ `dd09372a…` and no Product re-review is owed. This is
the same reading `plan-review-31-4` recorded for its own L1.

No phase had executed (roadmap row `planned`, no `in-progress` transition, no
phase commit), so each repair landed in the phase that owns the surface — an
in-place re-cut, no ledger-order change, no new phase number:

- **P31-07 (high)** — P1's bump task now moves both version pins the bump reddens
  in the same commit: `test/release-contract.test.mjs`
  (`assert.equal(pkg.version, "4.2.0")`) and `test/verification-gates.test.mjs`
  (`assert.equal(manifest.version, "4.2.0")`). Baseline re-observed green at
  `6e2a804f` (`bun test test/release-contract.test.mjs
  test/verification-gates.test.mjs test/pre-execution-docs.test.mjs` → 32 pass /
  0 fail), so the bump is what reddens them.
- **P31-08 (high)** — a new P1 task adds `reproducerChars 1024` to the
  `### Published limits` block of `packages/agentic-workflow-schema/README.md`,
  the section `test/pre-execution-docs.test.mjs` walks over
  `PRE_EXECUTION_LIMITS`. Both surfaces are `packages/**` (`config/infra`), so
  neither can ride the `docs` P4.
- **P31-09 (medium)** — `E9` now states the `docs` P4 CHANGELOG-row allocation the
  P31-04 resolution chose (naming the two pins and the published limit as the
  bump's own P1 surfaces), and the SPEC `### Phases` P1 done-when — same root
  cause — stops claiming `bun test scripts/normative-drift.test.mjs` green in P1
  and restates the declared window.
- **P31-10 (low)** — P4's `POLICY.md` §3 task no longer recites the literal AC7
  deletes; it names the removal grep and states the default batch consequence.
- **P31-11 (info)** — P4's `CHECKS.md` task now names the sentence
  `scripts/pre-execution-quality.test.mjs` pins verbatim (the words and the break
  point after `open`), inside AC10's pack.

Engineering decisions E-D31-22…E-D31-25 in `decisions.md`; evidence rows
PE-033…PE-037 in `planning-evidence.md`; the five rows above flip to `resolved`
in `planning-findings.md` with `31-plan-6` as their resolving artifact revision;
the P1 phase budget boundary (8 tasks, the canonical ceiling) is recorded in
`known-issues.md` §13; `testing.md`'s ladder names the pins and the published-limit
walk. `ACCEPTANCE.md` is deliberately **not** re-frozen: every repaired row is
Engineering-half, so blob `849af5ae7bccc7bc815d60d8ca2a9e0400161df9` and every
validator stay as `31-plan-5` froze them, and no required outcome weakened.

Gates run this turn, at the repaired revision:

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:8:schema-finding-record-materiality
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:8:transition-decider-cap-refusal
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:snapshot-wording-only-route
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skill-reference-prose-shrink
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: d71938984b6e87a81def926b394ffeed643eb71001df98a846ea7035391bf95c
```

Repo pack (informational, not this turn's finish line):
`bun test scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs
scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs
scripts/workflow-status-pre-execution.test.mjs` → 117 pass / 2 fail. Both
failures are 5 s harness timeouts in `scripts/ledger-provenance.test.mjs`
("a message-only claim and a range in a subject are both recovered", "a tick with
no commit behind it is UNPROVEN, never annotated") under five-file parallel load;
isolated, the same suite is 14 pass / 0 fail. No file this batch edited is read by
that suite. `bun scripts/check-skill-context.mjs` → exit 0.

Readiness preflight (`stage: plan`, `evidence-grounding/references/READINESS.md`),
boxes 1–11 plus shared D1:

```text
READINESS — 31-planning-review-materiality plan READY-FOR-REVIEW
- Artifact revision: ef0fe3251b58b1cb093cd4d683073a112595a4d9 (`31-plan-6`) · Rows checked: 11 + D1 · Unknowns open: 0
- Evidence: planning-evidence.md (PE-001…PE-037) · Frozen: 2026-09-17
```

Plan snapshot (built at the repaired revision, parented to the current Product
receipt): `node scripts/pre-execution-snapshot.mjs build --stage plan --unit
31-planning-review-materiality --parent dd09372a…` →
`255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1` at
`artifactRevisionId` `ef0fe3251b58b1cb093cd4d683073a112595a4d9`. A repaired plan is
not an approved plan, so the reviewer re-derives it; no plan receipt exists yet.

Dependency and blocker check (run this turn, before the recommended next step):
hard dependency 29 reads `done · [#175](…/pull/175)` (merged) and soft dependency
30 reads `done · [#188](…/pull/188)` (merged) — the closure is met. The fix index
carries exactly one row (#179, `pending`, declared-ledger-delta-receipts), which
depends on features 30/31/32 rather than blocking 31, and no open issue or fix-now
row in this repository touches a module this SPEC changes (#205 — review-loop
convergence — depends on 31, and #171 is this unit's own tracking issue). No
dependency, no blocker.

Hand-off: the new artifact revision is `31-plan-6` (`ef0fe325`), and the reviewer
re-derives plan snapshot `255d099b…`. Next step:
`/review-plan 31-planning-review-materiality`.

---

# Plan review `plan-review-31-5` — review-plan reviewer turn (2026-09-18)

Independent reviewer turn over plan snapshot
`255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1` (artifact
revision `31-plan-6` @ `ef0fe3251b58b1cb093cd4d683073a112595a4d9`), the repair
batch `plan-review-31-4`'s `CONVERGENCE-ANOMALY` named. Fresh context; this
conversation neither authored nor edited any reviewed plan artifact (every
`git status` check in this turn saw an otherwise clean tree) → `contextClean:
true`; `authorExclusion: not-enforceable` (manual route, no session identity to
compare); `modelDiversity: not-applicable` (single reviewer).

Cycle accounting (D-31-7 / POLICY §4): the window `plan-review-31-1` opened is at
its **fifth** review. This is not a blind re-review — the snapshot moved
(`b17009ea…` → `255d099b…`) and the five rows `plan-review-31-4` opened
(`P31-07…P31-11`) are `resolved` at `31-plan-6` — so the anomaly below is printed
and routed, never a stop. The verdict stands on the checks alone.

Snapshot (built at the exact bytes read, one revision):

```text
digest   255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1
source   ef0fe3251b58b1cb093cd4d683073a112595a4d9
artifact ef0fe3251b58b1cb093cd4d683073a112595a4d9   (author handoff label `31-plan-6`)
plan rows whole-file: spec · acceptance (849af5ae…) · planning-evidence · obligations · plan · tasks · testing · decisions · architecture-notes
parent   dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e
contexts project-guide CLAUDE.md ff24d7e4… present · normalized-repository-state docs/workflow/REPOSITORY_STATE.md e1b81e29… present · architectural-invariants docs/architecture/ARCHITECTURAL_INVARIANTS.md absent
```

Lineage L1 (claimed beside recomputed). The current Product receipt is
`spec-review-31-11` @ `dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e`.
Recomputed from the bytes on disk with the receipt's own recorded revisions
(`node scripts/pre-execution-snapshot.mjs build --stage spec --unit
31-planning-review-materiality --source-revision e4887dac35e5d4925f9bac239ddd7b5ad888064c
--artifact-revision e4887dac35e5d4925f9bac239ddd7b5ad888064c`) → the **same**
`dd09372a…`, the `spec-product-v1` projection digest
`e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02` at 46362
bytes, and the three context digests (`e1b81e29…`, `ff24d7e4…`, invariants
absent) byte-identical to the receipt. The default `verify --stage spec`
whole-file answer is the known `stale-source-revision` false signal `PE-003`
records (the Engineering half lives in the same `SPEC.md`); L1 is decided on the
projection, never on the whole-file revision.

Review record (read-only — no reviewed plan artifact was modified by this turn):

| # | Check | Result | Evidence |
|---|---|---|---|
| L1 | Parent current | pass | `spec-review-31-11` @ `dd09372a…` recomputed; projection `e9ce9abf…` (46362 bytes) + 3 context digests unmoved |
| L2 | Evidence integrity | pass | `planning-evidence.md` 37 rows (PE-001…PE-037), every one `current` + `proven`/`decision`; no `drifted`/`stale`, no ownerless `unknown` |
| L3 | Obligation completeness | pass | `planning-obligations.md` 15 rows (O1…O14 mirror AC1…AC14; O15 = AD-008); no duplicate, ids stable |
| L4 | Obligation mapping | pass | each row names exactly one phase, one task that exists in `PLAN.md`, an owner, a validator copied from `ACCEPTANCE.md`, and `required-evidence`; no blank, no `deferred` |
| L5 | Scenario ↔ validator ↔ phase | pass | every `### Dev scenarios` failure category maps to a phase + validator; the AC7/AC1/AC2/AC3/AC5 discriminator greps were observed live (they exit `0` today and the kept-side fragments are absent today, so each discriminates the rewrite) |
| L6 | Findings ledger honest | pass | R31-01…R31-03 resolved at `31-plan-3`, P31-01…P31-05 at `31-plan-4`, P31-06 at `31-plan-5`, P31-07…P31-11 at `31-plan-6`; no dismissed row lacks counter-evidence; no open material row |
| P1 | Architecture | pass | affected surfaces carry `path:line` rows (PE-004…PE-016, PE-024…PE-037); AD-008 classification `preserves` recorded |
| P2 | Dependency closure | pass | hard dep 29 `done · #175` merged, soft dep 30 `done · #188` merged; no phase builds outside the unit |
| P3 | Compatibility | pass | additive only: no enum/verdict/freshness code/contract id removed; `reproducer` optional (back-compat vector); receipt contract id unchanged |
| P4 | Security | pass | no secrets/authn/PII/new dependency; the added input is a bounded (`maxLength`, `nulFree`) string |
| P5 | Migration | pass | no data/schema migration; the P1→P4 `normative-drift` window is declared (`known-issues.md` §12) and closed at P4's done-when; EN/ES sync not applicable (feature 57) |
| P6 | Recovery | pass | per-phase commit + phase-entry receipts; `progress.md` records re-entry; fully-formed repair batches R31/P31 prove idempotent re-entry |
| P7 | Rollback | pass | revert the PR: no persisted data, no migration, every accepted vocabulary value stays accepted |
| P8 | Operability | pass | the sensor projects `detail.review_loop_cycles`; gates are the repo's own suites; README/CHANGELOG surfaces move with the change |
| P9 | Phase atomicity and order | pass | `bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md` → PASS (8/8) every phase, aggregate `d71938984b6e87a81def926b394ffeed643eb71001df98a846ea7035391bf95c` (re-run this turn, matches the recorded block); order matches `Depends on`; last phase is hardening |
| P10 | Validators | pass | every done-when is a command with an expected outcome; the declared gates were re-observed at this revision: sensor/attribution/discipline 25 pass/0 fail, `workflow-status-pre-execution` 7/0, `normative-drift` 17/0, `ledger-provenance` 14/0; no validator weakened or re-scoped |
| P11 | Scenario coverage | pass | `testing.md`'s mandatory inventory covers every SPEC scenario incl. empty/oversize/concurrent/duplicate; each maps to a phase + validator |
| P12 | Source evidence | pass | the plan's file/symbol claims match the repository at `ef0fe325`: predicate `pre-execution.ts:1059`, prose `pre-execution-contract.ts:101,:459`, `PRE_EXECUTION_LIMITS:150-170`, both `4.2.0` pins, README `### Published limits`, `grep -c decideWorkflowAction scripts/workflow-status.mjs` → 0, and the nine AC7 fragments present today |

Falsification — `NO-CONFIRMED-GAPS`: the three claims a hostile reader might call
invented are each evidenced (PE-033/PE-034 pins and published limit, PE-035 the
`pre-execution-quality` pin, PE-020 every AC7 fragment live today); no obligation
is undeliverable; no phase's validator passes on a no-op (each AC7 fragment
discriminates today); the two out-of-scope surfaces are declared
(`known-issues.md` §1 context drift, §11 the red feature-38 suite).

Findings (two, both `info`, immaterial, non-blocking; appended to
`planning-findings.md`):

- **P31-12** (`info`, plan) — `SPEC.md`'s `### Phases` **P4** summary done-when
  omits `bun test scripts/normative-drift.test.mjs`, which `PLAN.md`/`TASKS.md`
  P4 done-whens carry and the same SPEC's P1 summary (`:1108`) and the
  `31-plan-4` amendment (`:1542`) say closes the declared window. The SPEC
  explicitly designates `PLAN.md` the canonical phase list, so no phase's actual
  gate is lost — `PLAN.md`/`TASKS.md` are correct and phase-lint passes.
- **P31-13** (`info`, plan) — `TASKS.md` P1 carries nine checklist items while
  `PLAN.md` P1 carries the canonical eight (the phase-contract ceiling that
  `known-issues.md` §13 and `E-D31-25` record); the ninth is the finer-grained
  split of the `reproducerChars` requirement, not a ninth requirement.

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-31-5 · Snapshot: 255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1 · Verdict: plan-review-pass
- Unit: 31-planning-review-materiality · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e · Parent Product receipt: spec-review-31-11
- Source revision: ef0fe3251b58b1cb093cd4d683073a112595a4d9 · Artifact revision: ef0fe3251b58b1cb093cd4d683073a112595a4d9
- Reviewer: review-plan@pi · Session: pi-web-manual · Role: reviewer · Author: plan-feature (31-plan-6)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T00:50:00Z/2026-09-18T01:06:00Z · Findings: 2 (material open: 0)
- Ledgers read: planning-evidence 37 rows · obligations 15 rows (verified-capable: 0 — every row `planned`)
- Prior plan receipt (re-review only): plan-review-31-4 @ b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be
```

Artifact-revision notes:

- The handoff label is `31-plan-6`; no runtime rotates `artifactRevisionId` in
  this environment, so this receipt binds the builder's digest-derived value
  `ef0fe325…` (the newest commit touching the bound paths; `HEAD` at review start
  is `cd9667ab`, a `progress.md`-only commit, which is unbound and therefore does
  not move the content revision).
- Reviewed bytes are committed at `ef0fe325` (clean worktree at review start:
  `git status --porcelain` empty before this turn's two evidence appends), so the
  builder's commit precondition held; the only writes this turn makes are to the
  unbound `progress.md` and `planning-findings.md`, so none of the nine bound rows
  moves and `verify` stays fresh.
- Environment note (not a plan finding): the AC10 repo gate pack runs the ledger
  suites under `bun test`'s parallel file execution, where two 5 s harness
  timeouts in `scripts/ledger-provenance.test.mjs` were observed under load; run
  in isolation every suite is green (14/0, 17/0, 25/0, 7/0 at this revision). The
  executor should re-run a loaded pack serially before recording it red/dismissed;
  no file this unit edits is read by `ledger-provenance`.

Self-check (`verify --stage plan`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": true,
  "stage": "plan",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "plan-review-31-5",
    "verdict": "plan-review-pass",
    "snapshot": "255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — a PASS: `structural.fresh: true`, `current: true`; `digestMatches` is
`true` because this receipt binds the snapshot the bytes re-derive.)

CONVERGENCE-ANOMALY (POLICY §4, D-31-7) — entry to the plan stage's fifth review
of the window `plan-review-31-1` opened. Reported on entry; grants no PASS and is
not a stop:

```text
CONVERGENCE-ANOMALY — 31-planning-review-materiality plan
- Finding ids: P31-12 + P31-13 (new, this cycle, both info) / P31-07…P31-11 (resolved at 31-plan-6), P31-01…P31-06 (resolved at 31-plan-4/31-plan-5), R31-01…R31-03, F01…F03 (resolved at 31-plan-2/31-plan-3)
- Snapshots: b17009ea2719f3d81764d04c1c7831c1ada78b77af8c1d2b07f674e3c131d4be → 255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1 (artifactRevisionId 31-plan-5/ecde13dc → 31-plan-6/ef0fe325)
- Missed: the SPEC `### Phases` P4 summary done-when and the TASKS P1 checklist granularity — both duplicate-summary drift, neither a phase gate or a requirement change
- Owning stage: plan
- Why the prior review failed: plan-review-31-4 returned FAIL on P31-07…P31-11; the 31-plan-6 batch repaired all five and aligned the SPEC `### Phases` P1 summary, leaving the P4 summary and the TASKS P1 checklist count unaligned
- Route to owner: none required for the verdict — the two rows are immaterial (`info`); a future cosmetic batch may align them, and `execute-phase` may bind this receipt for `255d099b…`
```

---

## Verdict

```text
PLAN-REVIEW-PASS — 31-planning-review-materiality
- Snapshot: 255d099b7b1fc546b3677a5a796aebc0ee45c3d0d73ff31d5db3aab3616472c1 · Artifact revision: ef0fe3251b58b1cb093cd4d683073a112595a4d9 · Checks: L1–L6 + 12/12 Pn
- Obligations: 15 rows, none blank/deferred/unvalidated · Material findings open: 0
- Read-only: no plan artifact modified
- Authority: execution may bind this receipt for this exact snapshot
```

Hand-off: `/execute-phase 31-planning-review-materiality` — execution binds this
receipt and snapshot `255d099b…`.

---

## Dependency receipt v1
- Fingerprint: 34c191282defc3809b0e4fd5555543712a41dd8e · Closure: 31-planning-review-materiality ← 29-bounded-implementation-discovery ← 28-evidence-grounded-spec-plan-review · soft 30-repair-receipt-delta-review ← 29
- Merged PRs: 29 #175 @ 1cd06f4f2152895468c2a8c9c9a81629e1322337 · 30 #188 @ 54ff9126ceff732a0828591c5ddd86ff5ae873a1 · Fully merged: yes · Verified: 2026-09-18

## Acceptance receipt v1
- Manifest: docs/features/31-planning-review-materiality/ACCEPTANCE.md · Blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9 · Frozen: 2026-09-17 · Recorded: 2026-09-18

## P1 — 2026-09-18
- Done: schema finding-record materiality carrier — optional bounded `reproducer` (field spec with the additive `optional` flag, `reproducerChars: 1024`), `medium`+ materiality predicate and severity prose, receipt vectors (low-coexistence + reproducer back-compat/bound), regenerated receipt projection, package 4.3.0 bump with its two pins and the `CHANGELOG.md` row, README published-limit entry; P1 gate green (`bun run test` 709 pass / 0 fail; `check:pre-execution-schemas` drift-free)
- Remains: P2 transition-decider cap refusal, P3 snapshot wording-only route, P4 prose shrink + release records, P5 hardening & PR
- Gotchas: (1) the `31-plan-6` cut was unsatisfiable at P1 — the package suite's `verification-docs.test.mjs` binds the `CHANGELOG.md` row to the shipped version, so the 4.3.0 row moved from P4 to P1 with the bump (E-D31-26; plan/tasks/known-issues updated, all fingerprints unchanged). (2) `VerificationFieldSpec` had no optional-key representation, so P1 adds the additive default-off `optional` flag to `verification-contract.ts` and filters it in both projection generators; the finding `required` list stays byte-identical. (3) Editing bound plan rows stales the consumed `plan-review-31-5` receipt — expected post-entry; the entry gate was satisfied before the first write.
- Files: packages/agentic-workflow-schema/src/pre-execution-contract.ts, packages/agentic-workflow-schema/src/pre-execution.ts, packages/agentic-workflow-schema/src/verification-contract.ts, packages/agentic-workflow-schema/scripts/generate-pre-execution-schemas.mjs, packages/agentic-workflow-schema/scripts/generate-verification-schemas.mjs, packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs, packages/agentic-workflow-schema/test/pre-execution-canonical.test.mjs, packages/agentic-workflow-schema/test/release-contract.test.mjs, packages/agentic-workflow-schema/test/verification-gates.test.mjs, packages/agentic-workflow-schema/pre-execution-review-receipt.schema.json, packages/agentic-workflow-schema/package.json, packages/agentic-workflow-schema/README.md, CHANGELOG.md, docs/features/31-planning-review-materiality/{PLAN.md,TASKS.md,known-issues.md,decisions.md,progress.md}
- Next: P2 — Transition-decider cap refusal

## Unit-loop receipt — P1
- Commit: 085ce93f · Gate: `(cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas)` (exit 0) · Acceptance blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9
- Next: P2 · Attempts: 1

## P2 — 2026-09-18
- Done: transition-decider cap refusal — `stop-review-loop-cap` added to `WORKFLOW_DECISION_STOP_CODES`, optional `reviewLoopCycles: { spec?, plan? }` input on `WorkflowDecisionInput`, refusal in `decideWorkflowAction` before the transition-table match (stop · ask-human · human route `design-feature` named), shared pure `deriveReviewLoopCycles(receipts)` in `scripts/pre-execution-contract.mjs`, `detail.review_loop_cycles = { spec, plan }` projected by `scripts/workflow-status.mjs` without referencing the decider; new vector suite `workflow-decision-review-loop-cap.test.mjs`; P2 gate green (package suite 717 pass / 0 fail; `workflow-status-pre-execution.test.mjs` 10 pass / 0 fail)
- Remains: P3 snapshot wording-only route, P4 prose shrink + release records, P5 hardening & PR
- Gotchas: (1) the A:12 source pin requires zero `decideWorkflowAction` occurrences in `scripts/workflow-status.mjs` — the initial explanatory comment named it and reddened the pin; the comment now says "consumer-side" without the token. (2) the F24/F25 pin matches the sensor's contract import line byte-for-byte, so the helper is imported on a second line rather than widening the pinned import. (3) `scripts/workflow-status-sensor.test.mjs` carries three environment-only failures under this bun build (A:11 case b renders the source context containing the literal `ERR_MODULE_NOT_FOUND`, and A:21/F19 are 5 s hang-shim harness timeouts), but it is NOT a declared code carrier, so the extra projection test first drafted there was dropped in P5 to keep AC13's scope walk clean; the projection is source-pinned by the re-aimed discipline suite and the derived count is tested in `workflow-status-pre-execution.test.mjs`.
- Files: packages/agentic-workflow-schema/src/index.ts, packages/agentic-workflow-schema/test/workflow-decision-review-loop-cap.test.mjs, scripts/pre-execution-contract.mjs, scripts/workflow-status.mjs, scripts/workflow-status-pre-execution.test.mjs, scripts/workflow-status-sensor.test.mjs, docs/features/31-planning-review-materiality/{TASKS.md,progress.md}
- Next: P3 — Snapshot wording-only route

## Unit-loop receipt — P2
- Commit: 52bf548f · Gate: `(cd packages/agentic-workflow-schema && bun run test) && bun test scripts/workflow-status-pre-execution.test.mjs` (exit 0) · Acceptance blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9
- Next: P3 · Attempts: 1

## P3 — 2026-09-18
- Done: snapshot wording-only route — `parseWordingOnlyDeterminations` in `scripts/pre-execution-contract.mjs` (its own block grammar, not the receipt grammar), pure `wordingOnly` branch in `attributeFreshness` after `stale-context` and before `stale-source-revision`, fail-closed acceptance-manifest fingerprint read via `git hash-object`, wording-only vectors in both the attribution and sensor suites, and the re-aimed code-carrier pins in `review-loop-discipline.test.mjs` (medium+ predicate, CLI verify route, `stop-review-loop-cap`, `detail.review_loop_cycles`, A:12 absence); P3 gate green (30 pass / 0 fail across the three suites)
- Remains: P4 prose shrink + release records, P5 hardening & PR
- Gotchas: (1) `scripts/pre-execution-quality.test.mjs` F70 scans the contract module for every `fieldFrom(chunk, "...")` label and requires each in both receipt templates; the determination block is a distinct grammar, so it uses its own `determinationLine` extractor instead of `fieldFrom` — the receipt-label invariant is unchanged, no frozen test edited. (2) the wording-only branch receives its determination and acceptance fingerprint as the pure `wordingOnly` input; the parity vectors pass none, so the dimension-by-dimension comparator agreement is untouched. (3) the determination must name the snapshot's `contentRevision` (the newest commit touching a bound path); the block lives in the unbound `progress.md`, so recording it does not rotate that revision.
- Files: scripts/pre-execution-contract.mjs, scripts/pre-execution-snapshot.mjs, scripts/pre-execution-attribution.test.mjs, scripts/pre-execution-sensor.test.mjs, scripts/review-loop-discipline.test.mjs, docs/features/31-planning-review-materiality/{TASKS.md,progress.md}
- Next: P4 — Skill-reference prose shrink

## Unit-loop receipt — P3
- Commit: e0767164 · Gate: `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/review-loop-discipline.test.mjs` (exit 0) · Acceptance blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9
- Next: P4 · Attempts: 1

## P4 — 2026-09-18
- Done: skill-reference prose shrink + release records — LEDGERS §3 material = `medium`+ / report-note + anti-deflation, both CHECKS.md findings paragraphs, POLICY §3 wording-only determination block + non-skippable rotation, POLICY §4 hard two-cycle cap + `stop-review-loop-cap` (CONVERGENCE-ANOMALY block byte-unchanged), both OUTPUT.md verdict/loop text, REPAIR §4 cap mirror; four skills bumped minor (pre-execution-review 2.3.0, review-spec 1.8.0, review-plan 1.7.0, design-feature 3.5.0) with CHANGELOG rows; README `## References` gains the Jin & Chen entry (`2603.00539`); P4 gate green (context budgets PASS, `normative-drift` 17/0, `third cycle never` present), AC7 nine removal greps non-zero and three kept greps zero, AC14 bump-hunk count 8, AC10 pack 122/0
- Remains: P5 hardening & PR
- Gotchas: (1) `scripts/pre-execution-quality.test.mjs` pins the shared-owner phrases `it is a\n\`CONVERGENCE-ANOMALY\``, `they never earn a PASS`, `an exhausted cycle budget`, and `a \`PASS\` may not carry an open or\nunverified material row`; the shrink keeps those phrases and removes only the unbounded-cycle claims (no frozen test edited). (2) `review-plan/OUTPUT.md` neared its 2350 route ceiling after the cap mirror; the loop paragraph was compressed to stay inside it (no budget raised). (3) the Pi mirror is deliberately not re-bundled here — P5 task 3 owns `bundle:skills` after the last skill edit.
- Files: skills/pre-execution-review/references/{LEDGERS.md,POLICY.md}, skills/review-spec/references/{CHECKS.md,OUTPUT.md}, skills/review-plan/references/{CHECKS.md,OUTPUT.md}, skills/design-feature/references/REPAIR.md, skills/{pre-execution-review,review-spec,review-plan,design-feature}/SKILL.md, CHANGELOG.md, README.md, docs/features/31-planning-review-materiality/{TASKS.md,progress.md}
- Next: P5 — Hardening & PR

## Unit-loop receipt — P4
- Commit: pending · Gate: `bun scripts/check-skill-context.mjs && bun test scripts/normative-drift.test.mjs && grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` (exit 0) · Acceptance blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9
- Next: P5 · Attempts: 1

## P5 — 2026-09-18
- Done: hardening close-out — full acceptance ladder green at the terminal HEAD, plan lint pasted, Pi mirror re-bundled + package suite green, the three read-verified walks recorded (AC8/AC9/AC13), the frozen manifest re-verified, the PR opened and the roadmap row flipped to `done`
- Remains: none — the unit is `done` with its PR open; `/review-change` is the mandatory end review, `/audit-pr` the merge gate
- Gotchas: (1) `main` advanced during the unit (feature 55 executable golden fixture, #240); the branch was synced with a merge commit so the literal `git diff main` scope walk is exact. (2) the extra sensor-suite projection test was dropped from `scripts/workflow-status-sensor.test.mjs` because AC13's declared code carriers do not include it.
- Files: packages/pi-agentic-workflow/skills/** (mirror re-bundle), docs/features/31-planning-review-materiality/{progress.md,PLAN.md,TASKS.md}, docs/features/ROADMAP.md
- Next: unit finished

### Acceptance ladder at terminal HEAD (recorded verbatim)

```text
bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs
→ 152 pass / 0 fail (8 files) · exit 0
(cd packages/agentic-workflow-schema && bun run gate:pre-execution)
→ exit 0 (suite + projection drift checks + package check + docs test)
bun scripts/check-skill-context.mjs
→ PASS context budgets: 40 skills · exit 0
(cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test)
→ bundled 39 skills (125 files) · 214 pass / 0 fail · exit 0
```

### Plan-layer linter (pasted verbatim, AC6)

```text
P1 Phase-lint: PASS (8/8) · fingerprint P1:config/infra:8:schema-finding-record-materiality
P2 Phase-lint: PASS (8/8) · fingerprint P2:config/infra:8:transition-decider-cap-refusal
P3 Phase-lint: PASS (8/8) · fingerprint P3:config/infra:7:snapshot-wording-only-route
P4 Phase-lint: PASS (8/8) · fingerprint P4:docs:8:skill-reference-prose-shrink
P5 Phase-lint: PASS (8/8) · fingerprint P5:hardening:9:hardening-pr
verdict PASS
fingerprint: d71938984b6e87a81def926b394ffeed643eb71001df98a846ea7035391bf95c
```

### Read-verified walks

- **AC9 additive release:** `git diff main -- packages/agentic-workflow-schema/src/` removes no enum value and no contract id; the only removed predicate line is the materiality rewrite `const material = finding.severity !== "info";`. The receipt contract id count is unchanged (`grep -c "agentic-workflow/pre-execution-review-receipt@1"` ≥ 1). The package version is 4.3.0 with its CHANGELOG row.
- **AC8 no weakening:** `git diff main -- scripts/review-loop-discipline.test.mjs | grep -E '^-'` removes no assertion; the planning block is purely additive and reads the schema package (`grep -n "packages/agentic-workflow-schema"` exits 0).
- **AC13 scope:** `git diff main --name-only -- . ':(exclude)docs/features/31-planning-review-materiality' ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md'` lists only code-carrier, prose-shrink/derived, or workflow-mutated paths.
- **AC14 release records:** the four touched skills' bump-hunk count is 8 (one removed + one added `version:` each), each a semver-minor, with one CHANGELOG row per skill and accurate README cells.

## Acceptance receipt v1 (terminal)
- Manifest: docs/features/31-planning-review-materiality/ACCEPTANCE.md · Blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9 · Verified at terminal HEAD: 2026-09-18 · Matches the P1 receipt: yes

## Unit-loop receipt — P5
- Commit: 4d060b9c · Gate: `bun test scripts/review-loop-discipline.test.mjs` (exit 0) + the full ladder above · Acceptance blob: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9
- Next: none — unit finished

## UNIT LOOP — 31-planning-review-materiality COMPLETE
Phases: 5 · Commits: 085ce93f, 52bf548f, e0767164, e2c288ce, 0003a4a3, 955a7b87 (main sync), d7ad5f68, 4d060b9c · Acceptance: 849af5ae7bccc7bc815d60d8ca2a9e0400161df9 · Gate: PASS
PR: https://github.com/gtrabanco/agentic-workflow/pull/243

---

# Re-review `spec-review-31-12` — review-spec reviewer turn (2026-09-18)

Owner-commissioned **product-route re-review** of the Product-half patch
`31-spec-12` (commit `324d9de3`), which routes review-change finding **F3**
(`review-findings.md`) through the product route (`design-feature` →
`review-spec`). Independent reviewer, fresh context — this conversation never
authored nor edited the Product half → `contextClean: true`;
`authorExclusion: not-enforceable` (manual route, no session identity to
compare); `modelDiversity: not-applicable` (single reviewer).

Cycle accounting (D-31-7): `spec-review-31-11` returned PASS, which reset the
consecutive-unconverged count to 0, so this is **cycle 1** of a new window — no
`CONVERGENCE-ANOMALY` is owed. The owner-commissioned patch is a repair
responding to a persisted review-change FAIL, which §4's carve-out keeps
unblocked.

Snapshot (built at the exact bytes read, one revision):

```text
digest   2ca0f9c45d4665a9d97dd90cf26cc2df94362d62fd00b18d870c28b47a378ed7
source   324d9de36b1b5bf242dafcd20dd4fdc509e0b622
artifact 324d9de36b1b5bf242dafcd20dd4fdc509e0b622   (author handoff label `31-spec-12`)
spec row docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · 47039 bytes · 8d29996d91939f588190e0cb7895be54270dabd7f0a3ab75cccf93ff69048466
contexts project-guide CLAUDE.md f5c8e142… present · normalized-repository-state docs/workflow/REPOSITORY_STATE.md e1b81e29… present · architectural-invariants docs/architecture/ARCHITECTURAL_INVARIANTS.md absent
```

## Falsification (clean-context, delta-scoped)

```text
FALSIFICATION — 31-planning-review-materiality @ 324d9de3
- Name 3 specific product decisions in this half that a hostile reader could
  call invented rather than recorded:
  1. `## Design status`'s "readiness preflight READY-FOR-REVIEW at artifact
     revision 31-spec-12" — no readiness block for that revision exists in the
     unbound `progress.md` (last write `12c8a079` predates the patch; `grep -c
     '31-spec-12' progress.md` → 0), while every earlier revision carries one.
  2. In scope 2's material-movement code name and E2's state-transition code
     name (`stale-artifact-content`) — the F3 patch corrected AC4 but left the
     same wrong code in the scope definition and the entity table.
  3. Expectation sweep row 11's `stale-artifact-revision` for an unrecorded
     rotation — E6 explicitly records that naming as wrong.
- Name the user outcome the SPEC promises that has no observable check: none
  found — each Business goal maps to AC1–AC14 (unchanged in the delta).
- Name one role the matrix leaves unspecified for a capability it does list:
  none — the 5 roles × 5 capabilities matrix (C1–C5) lists every role.
- What would have to be true in the repository for this half to be wrong, and is
  it true? That the verify fall-through for moved bound bytes answers
  `stale-artifact-content` rather than `stale-source-revision`. FALSE:
  `attributeFreshness` returns `stale-source-revision`
  (`scripts/pre-execution-snapshot.mjs:400`) before the `stale-artifact-content`
  slot (`:412`); reproducer below.
- Verdict stance before checking: CONFIRMED-GAPS
```

Reproducer (fresh, this turn):

```text
bun /tmp/s31-repro.mjs
material/committed   -> stale-source-revision | paths: ["SPEC.md"]
material/uncommitted -> stale-artifact-content | paths: ["SPEC.md"]
```

## Checks — one result each

Delta scope: the `spec-product-v1` projection changed only in AC4
(`git diff e4887dac..HEAD -- SPEC.md` hunk `@@ -473`) and the `## Design status`
paragraph (hunk `@@ -674`); every other Product-half subject is byte-identical to
the `spec-review-31-11` subject (projection `e9ce9abf…`, 46362 bytes → now
`8d29996d…`, 47039 bytes; the three context digests unmoved except `CLAUDE.md`,
which no reviewed claim depends on).

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | Business goals name observable outcomes (cycle-cost cut, structural loop termination, preserved honesty properties) and each In-scope item maps to ACs (1→AC1–3, 2→AC4, 3→AC5/AC7, 4→AC6, 5→AC7, 6→AC8–9, 7→AC10/11/14, 8→AC12); bytes unchanged in the delta |
| C2 | Actors and roles | pass | Derived role inventory (human owner, author turn, reviewer turn, executor turn, drivers and sensors) lists every role `allowed`/`denied` for the five capabilities C1–C5; bytes unchanged |
| C3 | Entity closure | pass | E1–E3 resolve Create/Read/Update/Delete/state-transitions; Delete/Update are explicit `n/a: append-only ledger or derived value`; zero blank rows; unchanged |
| C4 | Limits and failure states | pass | Limits stated (cap = two consecutive unconverged cycles; ≤64 findings; `reproducer` maxLength); each named failure carries a resolution (re-review owed, `verdict-mismatch`, `needs-design`); unchanged. The code-name accuracy of the named failures is filed under C9/C10 |
| C5 | Scope and non-goals | pass | 7 out-of-scope bullets, each naming a non-goal or an owner; unchanged |
| C6 | Integration closure | pass | 12 derived subsystems, one row each; `docs/CAPABILITIES.md` exists only as the unseeded template, and the derivation from `CLAUDE.md` plus the `LEDGERS.md` ownership map is stated; unchanged |
| C7 | Expectation sweep | pass | 19 rows (≥10 for M), each resolved in-scope/out-of-scope with a pointer; row 11's wrong code name is filed under C9/C10 |
| C8 | Acceptance objectivity | pass | AC1–AC14 objective and labelled command or command+`read-verified`; every In-scope bullet maps to ≥1 AC; the patched AC4 stays command-checkable and `read-verified` |
| C9 | Internal contradiction | **finding** | N31-016: the half asserts, for the same moved-bound-bytes event, two incompatible codes — AC4 (`SPEC.md:476-478`, patched) says `stale-source-revision`, while In scope item 2 (`SPEC.md:150`) and E2 state transitions (`SPEC.md:313`) say `stale-artifact-content`; sweep row 11 (`SPEC.md:419`) says `stale-artifact-revision`, which E6 (`SPEC.md:934-936`) records as the corrected-wrong name |
| C10 | Repository contradiction | **finding** | N31-016: the repository's `attributeFreshness` answers `stale-source-revision` for committed moved bound bytes (`scripts/pre-execution-snapshot.mjs:400`, before the `stale-artifact-content` slot at `:412`); reproducer `bun /tmp/s31-repro.mjs` → `material/committed -> stale-source-revision`. The patched AC4 matches the repository and the frozen `ACCEPTANCE.md:23`; the two unpatched scope/entity statements do not |
| C11 | Evidence integrity | **finding** | N31-017 (`low`, non-blocking): the `decisions.md` evidence rows added for the F3 patch (E-D31-28 batch) are all `current` and `proven` and no `drifted`/`stale`/`unknown` cell survives, but `## Design status` (`SPEC.md:685`) asserts a readiness preflight `READY-FOR-REVIEW` at `31-spec-12` that resolves to no record anywhere in the unit |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` with an empty table; the only open row (F3/N31-016) is a product-class finding, not a deferred choice |
| C13 | Engineering leakage | pass | The half cuts no phase, task or architecture; the delta adds none |
| C14 | Obligation containment | pass | No current-unit obligation is exported to a future issue; N31-016 routes to its product-class owner (`design-feature`) |

Findings: 2 (material open: 1).

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-12 · Snapshot: 2ca0f9c45d4665a9d97dd90cf26cc2df94362d62fd00b18d870c28b47a378ed7 · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 324d9de36b1b5bf242dafcd20dd4fdc509e0b622 · Artifact revision: 324d9de36b1b5bf242dafcd20dd4fdc509e0b622
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T14:20:00Z/2026-09-18T14:29:22Z · Findings: 2 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 47039 · digest 8d29996d91939f588190e0cb7895be54270dabd7f0a3ab75cccf93ff69048466 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 11/14 pass; C9 + C10 finding (N31-016); C11 finding (N31-017); falsification CONFIRMED-GAPS
```

Artifact-revision notes:

- The handoff names the authoring label `31-spec-12` (`SPEC.md` `## Design
  status`; `## Amendments` `### 31-spec-12`). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `324d9de3…` — the label stays recorded here, the same
  reconciliation every prior receipt made.
- Delta re-review, commissioned by the owner ("route F3 through" the product
  route): the projection changed only in AC4 and the `## Design status`
  paragraph, so C1–C8, C12–C14 are carried from `spec-review-31-11` after the
  delta diff was read; C9, C10 and C11 were re-executed against the patched
  bytes.
- Reviewed bytes are committed at `324d9de3` (clean tree at review start), so
  the builder's "commit the bound artifacts" precondition held; the only writes
  this turn makes are to the unbound `progress.md` and the stage-aware
  `planning-findings.md`, neither bound by `STAGE_ARTIFACTS.spec`, so the bound
  digest is unchanged by them.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-12",
    "verdict": "spec-review-fail",
    "snapshot": "2ca0f9c45d4665a9d97dd90cf26cc2df94362d62fd00b18d870c28b47a378ed7",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "2ca0f9c45d4665a9d97dd90cf26cc2df94362d62fd00b18d870c28b47a378ed7",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — a digest-bound verdict that is not a PASS: `structural.fresh: true`,
`digestMatches: true`, `current: false`. The verdict itself is the emit result;
route per verdict.)

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: 2ca0f9c45d4665a9d97dd90cf26cc2df94362d62fd00b18d870c28b47a378ed7 · Artifact revision: 324d9de36b1b5bf242dafcd20dd4fdc509e0b622
- Failed checks: C9, C10, C11
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  | N31-016 | medium | product | C9, C10 | The F3 patch corrected AC4 but the same impossible code (`stale-artifact-content`) still describes material movement in In scope item 2 (`SPEC.md:150`) and E2 state transitions (`SPEC.md:313`), and sweep row 11 (`SPEC.md:419`) still names `stale-artifact-revision` — the naming E6 records as corrected-wrong | SPEC.md:150, :313, :419 vs AC4 `:476-478` and E6 `:919-936`; ACCEPTANCE.md:23; `scripts/pre-execution-snapshot.mjs:400` before `:412`; reproducer `bun /tmp/s31-repro.mjs` -> material/committed = stale-source-revision | verified |
  | N31-017 | low | product | C11 | `## Design status` (`SPEC.md:685`) asserts a readiness preflight at `31-spec-12` that no record in the unit supports (progress.md last written `12c8a079`, before the patch; `grep -c '31-spec-12' progress.md` = 0) | SPEC.md:685; git log of progress.md (12c8a079 @ 2026-09-18 08:05) vs HEAD (324d9de3 @ 13:13); grep of the readiness blocks | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
```

Both rows are `class: product`, so the repair is the author's and needs no plan
re-cut; the intended behaviour is already frozen in AC4, `ACCEPTANCE.md` AC4 and
E6, so the batch corrects code names and records the readiness block, never
invents product intent. No reviewed artifact was modified by this turn.

→ Next: /design-feature 31-planning-review-materiality "fix the surviving wrong freshness codes: In scope 2 (SPEC.md:150) and E2 state transitions (SPEC.md:313) must say stale-source-revision for moved bound bytes, and Expectation row 11 (SPEC.md:419) must drop stale-artifact-revision; record the 31-spec-12-successor readiness block" — one repair batch for N31-016 + N31-017,
    then /review-spec 31-planning-review-materiality re-reviews the new artifact revision
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC

---

# Product-half repair batch `31-spec-13` — design-feature authoring turn (2026-09-18)

Owner: `design-feature` (instruction mode). Commission (explicit user
instruction, verbatim): "fix the surviving wrong freshness codes: In scope 2
(SPEC.md:150) and E2 state transitions (SPEC.md:313) must say
stale-source-revision for moved bound bytes, and Expectation row 11
(SPEC.md:419) must drop stale-artifact-revision; record the 31-spec-12-successor
readiness block". Trigger: `spec-review-31-12` returned `spec-review-fail`
(cycle 1 of the window `spec-review-31-11`'s PASS opened) with one material
`product` row (N31-016, `medium`) and one `low` report-note (N31-017); the
verdict's route names this skill as repair owner for exactly this batch. The
F3 patch (E-D31-28) corrected AC4 but left the same wrong code name in two more
Product-half locations, so the half contradicted itself; the `31-spec-12`
readiness block was never recorded. One batch over the whole open spec-stage
set: N31-016 + N31-017 are the only open product rows.

The write (three code names + record duty, per the instruction):

- **In scope item 2** — the material-movement parenthetical now reads "for
  moved bound bytes the comparator answers `stale-source-revision` → re-review
  owed" (was the impossible `stale-artifact-content`).
- **Capability closure E2, state transitions** — the verify-outcome flip for
  moved bound bytes now names `stale-source-revision` (was
  `stale-artifact-content`).
- **Expectation sweep row 11** — the wrong `stale-artifact-revision` name is
  dropped: without the recorded determination the wording-only branch never
  holds, so moved bound bytes fall through to `stale-source-revision`
  (`stale-artifact-revision` keeps only its comparator slot: a rotation with no
  bound byte moved). Repair class: mechanical, intent-preserving (E-D31-29,
  `decisions.md` evidence rows).
- **Readiness record (N31-017)** — the `READINESS` block below is written in
  the same authoring act, restoring the per-revision record convention; the
  duty is restated as a rule in E-D31-29 so the gap cannot recur silently.

Nothing else in the Product half moved: no criterion text, other closure row,
other sweep row, non-goal, or In-scope item touched. The remaining
`stale-artifact-content` occurrences in the Product half are the correction
prose itself (Design status + Amendments) and Design E6's documented comparator
order; the Engineering half (from `## Engineering half`, line 718) is
plan-feature's surface and re-derives on a current receipt. The frozen
`ACCEPTANCE.md` is not touched (blob `849af5ae…` recomputed intact — no
criterion, validator or required outcome moves).

Gates at authoring start (branch `feat/31-planning-review-materiality`):
architectural invariants `n/a: no project invariants declared` (NRS F010);
AD-008 preserved by D-31-5 (unchanged). Roadmap row 31 stays as-is (no scope or
status change). Spec-lint product boxes re-run after the edit: all PASS (19
expectation rows each resolved, zero blank closure rows, 5×5 role matrix,
zero placeholders, `Deferred decisions` reads `none`, every in-scope item →
≥ 1 AC, every AC command-or-`read-verified`). No new vocabulary value was
introduced: the three names are existing `PRE_EXECUTION_FRESHNESS_CODES`
members (10 closed codes unchanged).

Readiness preflight (`evidence-grounding`, `stage: spec`):

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-13 · Rows checked: 6 evidence rows (E-D31-29) + 6 carried (E-D31-28) · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md/planning-findings.md · Frozen: 2026-09-18
```

Findings resolution: N31-016 and N31-017 marked `resolved` in
`planning-findings.md` at `31-spec-13` (both rows carry resolution-evidence).

Artifact revision rotates `31-spec-12` → **`31-spec-13`** (the write's bound
id is the commit that carries these bytes — this unit's receipt convention).
Each of these writes moves the Product half's bound bytes, so the
`spec-review-31-12` receipt goes stale by design: the next `review-spec` run
delta-reviews the patched half in a fresh context, and `plan-feature` re-cuts
the plan set only on a current `SPEC-REVIEW-PASS` receipt.

→ Next: /review-spec 31-planning-review-materiality — product half designed and readiness-clean; it needs an
    independent review before any engineering planning
  · more to design → re-run /design-feature 31-planning-review-materiality "<instruction>" (upsert, destroys nothing,
      rotates the artifact revision)
  · recurring gap in this project's capability closure → /product-audit (a systemic pattern,
      not a one-off design fix)

---

# Spec re-review `spec-review-31-13` — fresh-context reviewer turn (2026-09-18)

Cycle 2 of the window `spec-review-31-11`'s PASS opened (D-31-7): `spec-review-31-12`
was cycle 1 (FAIL, N31-016 + N31-017), batch `31-spec-13` repaired it, and this turn
re-judges the rotated bytes. Fresh context; this conversation never authored or
edited the reviewed Product half.

## Falsification (clean-context, answered before checking)

```text
FALSIFICATION — 31-planning-review-materiality @ 2e61d0b7
- 3 specific product decisions a hostile reader could call invented rather than
  recorded:
    1. In scope 1's bounded optional `reproducer` field — authority is the owner
       ruling D-31-6 (`decisions.md`) carried into the Engineering cut as
       E-D31-9; the Product half's E1 CRUD row cites it. Not invented.
    2. The user-gated third cycle ("third cycle never starts without explicit
       user instruction") — mirrored from `review-change` and recorded D-31-2 +
       D-31-7. Not invented.
    3. The stage-scoped cap exit (spec `needs-design`; plan refusal) — recorded
       D-31-8 and verified against `VERDICTS_BY_STAGE` (spec sanctions
       `needs-design`, plan does not). Not invented.
- Name the user outcome the SPEC promises that has no observable check: none
  found — cost/loop termination/honesty map to AC1+AC4, AC5, and AC1+AC8+AC9.
- Name one role the matrix leaves unspecified for a capability it does list:
  none — 5 derived roles × 5 capabilities (C1–C5), every cell allowed/denied.
- What would have to be true in the repository for this half to be wrong, and is
  it true? The half would be wrong if the machine answered anything other than
  `stale-source-revision` for committed moved bound bytes, or if the bundler were
  not owned by the pi package, or if `VERDICTS_BY_STAGE.spec` did not sanction
  `needs-design`. All three are as the half says: `pre-execution.ts:1154` precedes
  `:1156` and `scripts/pre-execution-snapshot.mjs:400` precedes `:412`;
  `packages/pi-agentic-workflow/package.json:46` owns `bundle:skills`;
  `pre-execution-contract.ts:136` lists `needs-design` for spec only.
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

## Product checks

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | In scope 1–8 each name an observable machine outcome with its AC anchor (1→AC1/2/3, 2→AC4, 3→AC5/7, 4→AC6, 5→AC7, 6→AC8/9, 7→AC10/11/14, 8→AC12; allowed-set groups→AC13) |
| C2 | Actors and roles | pass | 5 derived roles × 5 capabilities (C1–C5), every cell explicit `allowed`/`denied`; entry points named per capability |
| C3 | Entity closure | pass | E1–E3 resolve CRUD + state transitions to surfaces/tests or explicit `n/a: <reason>`; zero blank rows |
| C4 | Limits and failure states | pass | Limit = findings ≤ 64 (`PRE_EXECUTION_LIMITS.findings:64`, unchanged) + the two-cycle cap; failure states resolved — unconverged loop → stage-scoped human stop (spec `needs-design`, plan refusal), unrecorded rotation → `stale-source-revision`, mislabeled defect → `medium` minimum, wording-only misroute → recorded determination + rotation; size `M` |
| C5 | Scope and non-goals | pass | 7 out-of-scope bullets, each naming an owner or a non-goal; nothing excluded by silence |
| C6 | Integration closure | pass | 12 derived subsystems, one row each, none skipped; inventory recorded because `docs/CAPABILITIES.md` is the unseeded template |
| C7 | Expectation sweep | pass | 19 rows (≥ 10 for M), each resolved in-scope/out-of-scope with a pointer; counted mechanically |
| C8 | Acceptance objectivity | pass | AC1–AC14 objective, each labelled command or command+`read-verified`; every In-scope bullet maps to ≥ 1 AC; anchors re-verified on disk (`reproducer` @ `pre-execution-contract.ts:497-500`, `material = medium`+ fragments, `wording-only` greps, `review-loop-cap` suite, four skill `version:` hunks) |
| C9 | Internal contradiction | pass | One freshness code per event now: In scope 2 (`:150`), E2 state transitions (`:314`), sweep row 11 (`:420`) and AC4 (`:479`) all name `stale-source-revision` for moved bound bytes; the only surviving `stale-artifact-content`/`stale-artifact-revision` mentions are the correction prose in `## Design status` (`:686-697`), which labels them as the wrong names |
| C10 | Repository contradiction | pass | Machine claims match the repo: `stale-source-revision` precedes `stale-artifact-content` (`pre-execution.ts:1154` < `:1156`; `scripts/pre-execution-snapshot.mjs:400` < `:412`); material = `medium`+ (`MATERIAL_FINDING_SEVERITIES` `pre-execution.ts:989`, used `:1069`); bounded `reproducer` (`pre-execution-contract.ts:497-500`, `reproducerChars:1024`); `stop-review-loop-cap` refusal (`index.ts:726,1172`, cap 2); `VERDICTS_BY_STAGE` spec-only `needs-design` (`pre-execution-contract.ts:136`); bundler in the package (`packages/pi-agentic-workflow/package.json:46`); AC13's mechanical anchor lists only declared group paths |
| C11 | Evidence integrity | pass | Every `decisions.md` evidence row is `current`/`proven` (117 rows), zero `unknown`/`drifted`/`stale`; N31-016 + N31-017 carry resolution evidence at `31-spec-13`; the per-revision `READINESS — … spec READY-FOR-REVIEW` block exists in `progress.md` |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none` (empty table); no open product-class choice — both N31 rows resolved; the two remaining open rows are plan-stage `info` report-notes bound to a plan snapshot |
| C13 | Engineering leakage | pass | The half cuts no phase, task or architecture; naming the machine carriers is the owner's D-31-6 carrier ruling, not a phase cut |
| C14 | Obligation containment | pass | No current-unit obligation is exported to a future issue; the superseded plan set is a declared non-goal, not an export |

Findings: 0 (material open: 0).

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-13 · Snapshot: 443eede8fb23015941f458fa841424e601fb1ce7c7a107537d0f061c8abba73f · Verdict: spec-review-pass
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 2e61d0b787a17eb99bc50c278e9861fa8a080a2e · Artifact revision: 2e61d0b787a17eb99bc50c278e9861fa8a080a2e
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature (repair batch `31-spec-13`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T15:38:00Z/2026-09-18T15:46:16Z · Findings: 0 (material open: 0)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 48167 · digest 857b12e76825fe0e2e6ab28704e3105858f7ca7594af34a2c6cd1aadb555fbe2 · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 14/14 pass; full re-run against the repaired bytes (no rows carried); falsification NO-CONFIRMED-GAPS
```

Artifact-revision notes:

- The handoff names the authoring label `31-spec-13` (`SPEC.md` `## Design
  status`; `## Amendments` `### 31-spec-13`). No runtime rotates
  `artifactRevisionId` in this environment, so the receipt binds the builder's
  digest-derived value `2e61d0b7…` — the label stays recorded here, the same
  reconciliation every prior receipt made.
- Cycle counting (D-31-7): after `spec-review-31-11`'s PASS (reset), cycle 1 was
  `spec-review-31-12` (FAIL); this is cycle 2. It converged, so the
  `CONVERGENCE-ANOMALY` block is not owed and a PASS resets the count — the
  `stop-review-loop-cap` refusal never armed.
- The reviewed bytes are committed at `2e61d0b7` (clean tree at review start), so
  the builder's "commit the bound artifacts" precondition held; the only writes
  this turn makes are to the unbound `progress.md`, which `STAGE_ARTIFACTS.spec`
  does not bind, so the bound digest is unchanged by them.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the
receipt write, before this report:

```json
{
  "current": true,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-13",
    "verdict": "spec-review-pass",
    "snapshot": "443eede8fb23015941f458fa841424e601fb1ce7c7a107537d0f061c8abba73f",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "443eede8fb23015941f458fa841424e601fb1ce7c7a107537d0f061c8abba73f",
  "digestMatches": true,
  "verdictIsPass": true,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 0 — a PASS: `structural.fresh: true`, `current: true`, `digestMatches:
true`.)

---

## Verdict

```text
SPEC-REVIEW-PASS — 31-planning-review-materiality
- Snapshot: 443eede8fb23015941f458fa841424e601fb1ce7c7a107537d0f061c8abba73f · Artifact revision: 2e61d0b787a17eb99bc50c278e9861fa8a080a2e · Checks: 14/14
- Material findings open: 0 · Read-only: no reviewed artifact modified
- Authority: planning may bind this receipt as its Product parent
```

No reviewed artifact was modified by this turn; the only writes are to the
unbound `progress.md`. The two open rows in `planning-findings.md` are
plan-stage `info` report-notes (P31-12, P31-13) bound to a plan snapshot, so they
do not touch this PASS.

→ Next: /plan-feature 31-planning-review-materiality — Product half reviewed; the plan binds this receipt
  · design changed underneath → re-run /review-spec 31-planning-review-materiality first
  · recurring closure gaps across units → /product-audit (a systemic pattern, not one SPEC)

---

## Authoring — review-findings closure batch (design-feature, `31-spec-14`) (2026-09-18)

Owner-commissioned one-batch repair of the product-owner fix-now findings in
`review-findings.md`: **F8** (`medium`, spec-drift) and **F10** (`medium`,
brand). Decisions recorded in `decisions.md` as **D-31-11** (the wording-only
route never certifies a movement of the unit's own frozen `ACCEPTANCE.md`;
the recorded fingerprint is corroboration, never a sufficient condition) and
**D-31-12** (the re-review skip is declared by every surface that executes a
repair batch — AC13's declared set, In-scope 5, AC7's removal set and the
touched-skills/AC14 enumeration widen to `plan-feature/SKILL.md`,
`plan-fix/SKILL.md`, `ship-roadmap/references/ADVANCE.md`,
`replan-findings/references/PHASE_APPEND.md` and `REPAIR.md` §1/§3; eight
touched skills, `grep -cE '^[+-]version: '` ≥ 16). F9 stays open by owner
choice (its route names main-sync as the alternative). Research gate: two new
fetched rows (RFC 9334 RATS attestation; XACML PEP/PDP separation) in
`decisions.md`'s evidence table.

Touched Product set: In-scope 2/5/7, declared group 2, AC4, AC7 (+7 removal
greps), AC14 (eight skills, ≥ 16), E2 Create + transitions, C3, sweep row 10,
Design E6 (commissioned — five branch conditions, fingerprint demoted),
Design E8/E9 enumerations, `## Design status`, `## Amendments` (`31-spec-14`).
Artifact revision rotates `31-spec-13` → **`31-spec-14`**. The frozen
`ACCEPTANCE.md` is untouched this turn (AC4 validator text, AC7 removal
enumeration and AC14 skill set moved, so `plan-feature` re-freezes it on a
fresh PASS — the `31-plan-5` precedent). `review-findings.md` untouched
(`folded` is `fold-findings`' surface).

Receipt state after the write: `verify --stage spec` → `current: false`,
`stale-artifact-content` ("bound artifact bytes moved:
docs/features/31-planning-review-materiality/SPEC.md") — material movement by
design (a Product predicate change is never wording-only, D-31-11's own
rule); the next `/review-spec 31-planning-review-materiality` delta-reviews
the patch as cycle 1 of a fresh window (D-31-7).

Gates at authoring close (branch head `553982d3` base): architectural
invariants `n/a: no project invariants declared` (NRS F010); AD-008 preserved
by D-31-5 (unchanged). Roadmap row 31 stays `done · #243` (no scope or status
change). Spec-lint product boxes re-run after the edit: all PASS (19
expectation rows each resolved, zero blank closure rows, 5×5 role matrix,
zero placeholders over the Product half, `Deferred decisions` reads `none`,
every in-scope item → ≥ 1 AC, every AC command-or-`read-verified`). No new
vocabulary value was introduced: no severity, verdict, freshness code or
stop-code value moved; the seven new AC7 fragments are file-scoped removal
greps over already-declared prose surfaces.

Readiness preflight (`evidence-grounding`, `stage: spec`):

```text
READINESS — 31-planning-review-materiality spec READY-FOR-REVIEW
- Artifact revision: 31-spec-14 · Rows checked: 8 evidence rows (closure batch) + carried rows current · Unknowns open: 0
- Evidence: SPEC Product half/decisions.md · Frozen: 2026-09-18
```

→ Next: /review-spec 31-planning-review-materiality — product half re-cut at
  `31-spec-14`; an independent context must delta-review F8/F10's closure
  before any plan re-derivation or source fold
  · the fold of F8's source half waits for the fresh PASS (the branch's
    manifest exclusion folds at source after the product route re-passes)

---

## Re-review (`spec-review-31-14`, 2026-09-18)

Context-clean `review-spec` delta-review of the F8/F10 Product-half closure batch
(`31-spec-14`) over spec snapshot
`00e30f51f537ab87f76670185a70d2c9a3d06d1893a04e4569c5ee7c5ac1733c`. Verdict:
**`spec-review-fail`** — 12/14 Product checks pass; two `product`-class rows, one
material (`medium`); repair owner `design-feature 31-planning-review-materiality`.
No reviewed artifact was modified by this turn. Process note: the authoring
`design-feature` turn left the `31-spec-14` revision uncommitted in the worktree,
and the snapshot contract's freshness comparison reads a committed revision
(`changedBoundPaths(revision)` against the worktree), so this turn first persisted
the author's bytes **byte-identically** as commit `c410a594` before building the
snapshot — no reviewed byte changed; see the receipt notes below.

### Falsification — `31-planning-review-materiality` @ `c410a594`

- Name 3 product decisions a hostile reader could call invented: none —
  D-31-11/D-31-12 carry the owner commission verbatim (`## Amendments
  31-spec-14`) plus the `decisions.md` authority column and evidence rows.
- The user outcome the SPEC promises with no observable check: In scope 5's
  positive declaration on the four newly named surfaces (they "declare that a
  recorded wording-only batch skips the re-review", `SPEC.md:177-186`) — AC7
  observes only the removals. Recorded as context, not filed: the bullet maps to
  AC7 (C8's letter holds).
- One role the matrix leaves unspecified: none — C1–C5 each enumerate all five
  derived roles with an explicit `allowed`/`denied`.
- What would have to be true for this half to be wrong, and is it true: the PR
  diff carries a path outside AC13's three declared groups → **TRUE**
  (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`, F6's fold `9f4e05c2`).
- Verdict stance before checking: `CONFIRMED-GAPS`.

### Product checks

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | In scope 1–8 each name an observable machine outcome with AC anchors (1→AC1/2/3, 2→AC4, 3→AC5/7, 4→AC6, 5→AC7, 6→AC8/9, 7→AC10/11/14, 8→AC12; groups→AC13) |
| C2 | Actors and roles | pass | 5 derived roles × 5 capabilities (C1–C5), every cell explicit `allowed`/`denied`; entry point named per capability |
| C3 | Entity closure | pass | E1–E3 resolve CRUD + state transitions to surfaces/tests or explicit `n/a`; zero blank rows |
| C4 | Limits and failure states | pass | Limit = findings ≤ 64 (`PRE_EXECUTION_LIMITS.findings`) + the two-cycle cap; failure states resolved (unconverged loop → stage-scoped human stop; unrecorded rotation → `stale-source-revision`; mislabeled defect → `medium` minimum; wording-only misroute → recorded determination + rotation) |
| C5 | Scope and non-goals | pass | 7 out-of-scope bullets, each naming an owner or a non-goal |
| C6 | Integration closure | pass | 12 derived subsystems, one row each; inventory derived because `docs/CAPABILITIES.md` is the unseeded template (all `<role>`/`<yes\|no\|partial>` placeholders) |
| C7 | Expectation sweep | pass | 19 rows (≥ 10 for M), each resolved in-scope/out-of-scope with a pointer |
| C8 | Acceptance objectivity | pass | AC1–AC14 objective, each labelled command or command+`read-verified`; every In-scope bullet maps to ≥ 1 AC |
| C9 | Internal contradiction | **finding** | F31-14-01: AC10 requires the budget gate green ("budgets updated for the shrink if it moves sizes", `SPEC.md:605`) while AC13's declared groups (`SPEC.md:216-237`) forbid the budget path AC10 needs. F31-14-02: AC14's "each SKILL.md carries nothing but the `version:` change" (`SPEC.md:628`) contradicts In scope 5 (`SPEC.md:177-186`) + AC7 (`SPEC.md:565-568`) |
| C10 | Repository contradiction | **finding** | F31-14-01: `git diff main --name-only -- . ':(exclude)docs/features/31-planning-review-materiality' ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md'` lists `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, outside all three declared groups |
| C11 | Evidence integrity | pass | Every `decisions.md` row is `current`/`proven`; the 31-spec-14 batch's 8 rows are `current`/`proven`; no `unknown`/`drifted`/`stale` row survives; the `31-spec-14` `READINESS — … spec READY-FOR-REVIEW` block exists in this file |
| C12 | Open product choices | pass | `### Deferred decisions` reads `none`; the one open product-owned item (review-change F9) is flagged for the human in `## Design status`, and its two-dot-anchor defect is in fact resolved by the branch's main-sync (`git rev-list --left-right --count main...HEAD` → `0 67`; the AC13 anchor now lists only in-group paths bar the F31-14-01 gap) |
| C13 | Engineering leakage | pass | The half cuts no phase, task, or architecture; naming the machine carriers is the owner's D-31-6 carrier ruling |
| C14 | Obligation containment | pass | No current-unit obligation exported to a future issue; the superseded plan set is a declared non-goal |

Findings: 2 (material open: 1).

## Pre-execution review receipt v1 — spec

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-31-14 · Snapshot: 00e30f51f537ab87f76670185a70d2c9a3d06d1893a04e4569c5ee7c5ac1733c · Verdict: spec-review-fail
- Unit: 31-planning-review-materiality · Stage: spec · Unit kind: feature · Parent: null
- Source revision: c410a594114ceec4c9607f833a3d3a0d1bfacdca · Artifact revision: c410a594114ceec4c9607f833a3d3a0d1bfacdca
- Reviewer: review-spec@pi · Session: pi-web-manual · Role: reviewer · Author: design-feature (repair batch `31-spec-14`)
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-18T21:12:00Z/2026-09-18T21:21:44Z · Findings: 2 (material open: 1)
- Artifact: docs/features/31-planning-review-materiality/SPEC.md · selector spec-product-v1 · bytes 52291 · digest 90d47e5d5ff0723546dcee1bf71f13aa54138927d1e91af7233eee2633852aed · validated: builder (scripts/pre-execution-snapshot.mjs)
- Checks: 12/14 pass, C9 + C10 findings; full re-run against the patched bytes; falsification CONFIRMED-GAPS
```

Artifact-revision and process notes:

- The handoff names the authoring label `31-spec-14` (`SPEC.md` `## Design status`;
  the readiness block above). No runtime rotates `artifactRevisionId` in this
  environment, so the receipt binds the builder's digest-derived value
  `c410a594…`; the label stays recorded here — the reconciliation every prior
  receipt made.
- The reviewed revision was uncommitted when this review began. The builder's own
  remedy ("commit the bound artifacts, or pass
  `--source-revision`/`--artifact-revision`") and the freshness comparison
  (`changedBoundPaths(revision)` diffs the recorded revision against the worktree)
  mean uncommitted bound bytes always answer `stale-artifact-content` — the
  reviewer's own write could not be fresh. This turn therefore persisted the
  author's `31-spec-14` set byte-identically as commit `c410a594` before building
  the snapshot; no reviewed artifact byte changed, and no content was authored or
  edited by this turn (context clean: true).
- Cycle counting (D-31-7): `spec-review-31-13`'s PASS reset the count; the
  31-spec-14 patch is cycle 1 of the fresh window and this FAIL is its outcome, so
  no `CONVERGENCE-ANOMALY` block is owed and the `stop-review-loop-cap` refusal
  is not armed.

Self-check (`verify --stage spec`, POLICY §8) — run in the same act as the receipt
write, before this report:

```json
{
  "current": false,
  "stage": "spec",
  "unit": "31-planning-review-materiality",
  "receipt": {
    "id": "spec-review-31-14",
    "verdict": "spec-review-fail",
    "snapshot": "00e30f51f537ab87f76670185a70d2c9a3d06d1893a04e4569c5ee7c5ac1733c",
    "authorExclusion": "not-enforceable",
    "contextClean": "true",
    "policy": "v1"
  },
  "observedDigest": "00e30f51f537ab87f76670185a70d2c9a3d06d1893a04e4569c5ee7c5ac1733c",
  "digestMatches": true,
  "verdictIsPass": false,
  "structural": {
    "fresh": true,
    "detail": "the digest the receipt bound equals the digest re-derived from the bytes on disk",
    "changedPaths": []
  }
}
```

(exit 4 — a persisted non-PASS verdict: `structural.fresh: true`, `digestMatches:
true`, `current: false`; the verdict itself is the emit result, routed per the
FAIL block below.)

---

## Verdict

```text
SPEC-REVIEW-FAIL — 31-planning-review-materiality BLOCKED
- Snapshot: 00e30f51f537ab87f76670185a70d2c9a3d06d1893a04e4569c5ee7c5ac1733c · Artifact revision: c410a594114ceec4c9607f833a3d3a0d1bfacdca
- Failed checks: C9, C10
- Findings (unioned, one row each):
  | id | severity | class | check | claim | evidence | verification |
  | F31-14-01 | medium | product | C10 (also C9) | AC13's declared allowed-set groups omit `docs/workflow/SKILL_CONTEXT_BUDGETS.json`, which the PR diff carries (F6's fold `9f4e05c2`), so the criterion's anchor lists an out-of-group path and AC13/AC10 assert incompatible sets | SPEC.md:216-237, :605, :612-616; `git diff main --name-only -- . ':(exclude)docs/features/31-planning-review-materiality' ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md'`; `git diff main -- docs/workflow/SKILL_CONTEXT_BUDGETS.json`; `git merge-base --is-ancestor 9f4e05c2 46968309` → false | verified |
  | F31-14-02 | low | product | C9 | AC14's "each SKILL.md carries nothing but the `version:` change" contradicts In scope 5 + AC7, which require `plan-feature/SKILL.md` and `plan-fix/SKILL.md` to lose prose | SPEC.md:620-628, :177-186, :565-568; skills/bump-skill/SKILL.md:81 | verified |
- Repair owner: `design-feature 31-planning-review-materiality` — one batch over this whole set
```

No reviewed artifact was modified by this turn (the only writes are the unbound
`progress.md` receipt block and the `planning-findings.md` rows; the reviewer
persisted the author's already-existing `31-spec-14` bytes as commit `c410a594`,
which changed no byte). `ACCEPTANCE.md`, `SPEC.md`, `decisions.md`, and the
roadmap row are byte-identical to the reviewed revision.

→ Next: /design-feature 31-planning-review-materiality "add `docs/workflow/SKILL_CONTEXT_BUDGETS.json` to AC13's declared derived-surface group (and correct `known-issues.md` §3), and drop/correct AC14's 'nothing but the `version:` change' clause" — one repair batch for F31-14-01 + F31-14-02, then /review-spec 31-planning-review-materiality re-reviews the new artifact revision
  · a product choice is missing → answer it in the instruction; nothing here chooses for you
  · finding class is plan/source/environment/runtime → route to its owner, do not edit the SPEC

