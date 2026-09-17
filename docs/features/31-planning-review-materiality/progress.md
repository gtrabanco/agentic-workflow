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
