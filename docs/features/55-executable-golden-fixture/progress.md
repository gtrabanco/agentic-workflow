# Progress — 55-executable-golden-fixture

Ledger of stage receipts and gate traces for this unit. One receipt per review.

## Pre-execution review receipts

### spec — 2026-09-16

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-55-20260916-1 · Snapshot: 48f3977ae8ff4fb85ec489ed1b6b54b5b6fef9dadb78ef3793c5af1ecccb4cb7 · Verdict: spec-review-fail
- Unit: 55-executable-golden-fixture · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 83726ab37e437030f0ea6b02699acb9cdbeab8e2 · Artifact revision: 83726ab37e437030f0ea6b02699acb9cdbeab8e2
- Reviewer: review-spec · Session: 01a0aca3-201c-7302-a9d2-ceaae2a3b8f6 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-16T23:52:46Z/2026-09-16T23:59:30Z · Findings: 5 (material open: 3)
```

Snapshot built by `scripts/pre-execution-snapshot.mjs build --stage spec --unit
55-executable-golden-fixture` (in-repo canonical serializer over the
`@gtrabanco/agentic-workflow-schema` package resolved from the in-repo
`packages/agentic-workflow-schema/dist`). The builder derived both
`sourceRevision` and `artifactRevisionId` from the newest commit that touched a
bound path (`83726ab3`, the commit that last wrote `SPEC.md`); the design
handoff named no explicit artifact revision, so the derived sha is the record.
The snapshot bound one artifact (`spec` → `SPEC.md`, selector
`spec-product-v1`, 23005 bytes, sha256 `90fa6256…`) and three contexts:
`project-guide` present (`CLAUDE.md`), `normalized-repository-state` present
(`docs/workflow/REPOSITORY_STATE.md`), `architectural-invariants` absent
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
The roadmap row is routing data and is deliberately unbound. Findings rows for
this snapshot: `planning-findings.md` (`SPEC55-F1`…`SPEC55-F5`).

### spec — 2026-09-17

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-55-20260917-2 · Snapshot: 20b088bc4b28997a2ade6fb700c78e08284b610c43b392121f53f4e41a11aa0e · Verdict: spec-review-fail
- Unit: 55-executable-golden-fixture · Stage: spec · Unit kind: feature · Parent: null
- Source revision: 98d8e6a4b66b27a43c14ffe2675f22528fad3434 · Artifact revision: 98d8e6a4b66b27a43c14ffe2675f22528fad3434
- Reviewer: review-spec · Session: 01a0ae4a-b667-7302-a9d2-ceb238cb36a4 · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T07:35:27Z/2026-09-17T07:45:00Z · Findings: 5 (material open: 4)
```

Snapshot rebuilt by `scripts/pre-execution-snapshot.mjs build --stage spec --unit
55-executable-golden-fixture` (in-repo canonical serializer over
`@gtrabanco/agentic-workflow-schema`). The builder derived both revisions from
the newest commit that touched a bound path (`98d8e6a4`, the repair batch that
last wrote `SPEC.md`); the ledger commit `42d094ab` touched only unbound files.
The snapshot bound one artifact (`spec` → `SPEC.md`, selector `spec-product-v1`,
24147 bytes, sha256 `1807294d…`) and three contexts: `project-guide` present
(`CLAUDE.md`), `normalized-repository-state` present
(`docs/workflow/REPOSITORY_STATE.md`), `architectural-invariants` absent
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
Roadmap row 55 is routing data and is deliberately unbound. Second cycle:
`CONVERGENCE-ANOMALY` printed in the review report (repair 1 closed SPEC55-F1…F5
but left the AC5/run-log contradiction and two producer-lineage slips). New
findings rows: `SPEC55-F6`…`SPEC55-F10`.

### spec — 2026-09-17 (review 3)

```text
## Pre-execution review receipt v1 — spec
- Review: spec-review-55-20260917-3 · Snapshot: c1f040405f0d5178d44bbcfa4441f4ed3b4cccbf25bb12142317a4b4c41d20d2 · Verdict: spec-review-pass
- Unit: 55-executable-golden-fixture · Stage: spec · Unit kind: feature · Parent: null
- Source revision: c5032f6ebb316ad912601692c414c51b943d03fd · Artifact revision: c5032f6ebb316ad912601692c414c51b943d03fd
- Reviewer: review-spec · Session: 01a0aead-1544-7302-a9d2-ceb7e804f31f · Role: reviewer · Author: design-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T09:22:53Z/2026-09-17T09:31:30Z · Findings: 0 (material open: 0)
```

Snapshot built by `scripts/pre-execution-snapshot.mjs build --stage spec --unit
55-executable-golden-fixture` (in-repo canonical serializer). The builder derived
both revisions from the newest commit that touched a bound path (`c5032f6e`, the
repair batch that last wrote `SPEC.md`; `3133c5ca` touched only unbound ledger
files). It bound one artifact (`spec` → `SPEC.md`, selector `spec-product-v1`,
24981 bytes, sha256 `d8f9c47f…`) and three contexts: `project-guide` present
(`CLAUDE.md`), `normalized-repository-state` present
(`docs/workflow/REPOSITORY_STATE.md`), `architectural-invariants` absent
(`docs/architecture/ARCHITECTURAL_INVARIANTS.md` does not exist — NRS F010).
Roadmap row 55 is routing data and is deliberately unbound. All prior findings
`SPEC55-F1`…`SPEC55-F10` are `resolved` at `98d8e6a4`/`c5032f6e`; none is
re-opened. No new finding rows were appended to `planning-findings.md`.

```
FALSIFICATION — 55-executable-golden-fixture @ c5032f6e
- 3 product decisions a hostile reader could call invented rather than recorded:
  (a) D-55-6's closed grammar `exact <n>/<n> · invented none|<k> · shape
  ok|<fail-code>` and the 2026-09-18 cutoff — a refinement of #183's looser
  example, recorded as a user-selected decision (D-55-4/D-55-6); (b) D-55-3
  committing both toy trees — recorded as user-selected 2026-09-17; (c) D-55-7's
  determinism constraints — recorded decisions backed by PE-5/PE-6/PE-7. Every
  one is presented as a decision with rationale, never as a source-derived fact.
- User outcome with no observable check: none found — the Goal's mechanical
  checking maps to AC1–AC4/AC6/AC8; the manual-judgment bookkeeping maps to
  AC3(c) + D-55-6.
- Role left unspecified for a listed capability: none — the one capability ("run
  the fixture smoke test") carries an explicit value for every derived role in
  the matrix, including the CI and target-consumer `n/a` rows with reasons.
- What would have to be true for the half to be wrong, and is it true? The cited
  existing surfaces would have to differ. Checked at HEAD: GOLDEN_FIXTURE.md is
  383 lines and carries the token at 45/54/122 plus run-log rows 278/279/280/298
  /383 (C10, PE-13); CAPABILITIES.md is placeholder-only (C10/PE derived
  inventory); scripts/fixtures/unit-route/ came from fix #224 `8cdf9548`;
  check-skill-context.mjs from feature 20 `635168ce`; schema-runtime.mjs from
  feature 28 `1951b717`; phase-lint emits `P<n> box-<n>: <reason>` and
  `verdict PASS` (PE-11, AC1/AC2). Every checked claim holds.
- Suspicion not evidenced as a defect: the In-scope item 6 phrasing "the
  CLAUDE.md verification bullet listing the new suite beside the existing root
  regressions" is loose — CLAUDE.md's `## Verification` list (lines 238–258) does
  not name `node --test scripts/*.test.mjs`. The Verification list itself exists
  and AC9 checks the new suite is named in it, so the criterion is locatable and
  satisfiable; the phrase denotes the existing root-level verification list.
  Recorded here, not promoted to a finding.
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

Product checks (14/14):

| # | Check | Result | Evidence |
|---|---|---|---|
| C1 | Outcome ownership | pass | `## Goal`; each in-scope item carries `→ ACn`; AC1–AC9 are observable |
| C2 | Actors and roles | pass | Role matrix (Repo owner · Agent · CI/root runner `n/a` · target consumer `n/a`) covers every derived role per capability |
| C3 | Entity closure | pass | E1–E5 each fill Create/Read/Update/Delete/state, `n/a` rows carry reasons; no blank row |
| C4 | Limits and failure states | pass | doc ≤150 lines + ~100-word protocol (limits); BLOCKED (AC2), invalid-envelope reject (AC3b), tamper (AC4), offline/no-clock (AC8) each carry a resolution |
| C5 | Scope and non-goals | pass | 8 out-of-scope bullets, each a non-goal or a named owner (57, 44/#198, feature 08) |
| C6 | Integration closure | pass | One resolved row per derived subsystem; inventory recorded because CAPABILITIES.md is unseeded |
| C7 | Expectation sweep | pass | 10 rows (≥5 for XS/S), each resolved with a pointer |
| C8 | Acceptance objectivity | pass | AC1–AC9 runnable; AC8 clause 2 `read-verified`; every in-scope item maps to ≥1 AC |
| C9 | Internal contradiction | pass | Cutoff/grammar/append-only/preservation consistent across In-scope, E4, AC3(c), AC5, D-55-6 |
| C10 | Repository contradiction | pass | 383-line doc, token lines, CAPABILITIES placeholder, producer lineage, `verdict PASS` form all verified at HEAD |
| C11 | Evidence integrity | pass | PE-1…PE-15 all `proven`/`current`; PE-5/6/7 `authority-kind: document`; no `drifted`/`stale`/`unknown` |
| C12 | Open product choices | pass | 2 Deferred decisions, each with a decide-by trigger; no unflagged open choice |
| C13 | Engineering leakage | pass | Engineering half empty; no architecture/phase/validator pre-fill (Size topology matches the 52/59 convention) |
| C14 | Obligation containment | pass | No unit obligation exported; deferred rows are owner/cross-feature with triggers, not later-issued work |


## Acceptance receipt v1

- Manifest: docs/features/55-executable-golden-fixture/ACCEPTANCE.md · Blob: d87cff9a668bfd1f1f46286cea0edb215b1f685a · Status: frozen · Verified: 2026-09-17 (recorded at plan freeze by `plan-feature-scaffold`; recomputed before every phase and final review per `verification-contract`)
