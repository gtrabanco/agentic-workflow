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

### plan — 2026-09-17

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-55-20260917-1 · Snapshot: 01ede4dfadf0da465c21741a5a22440104be4d59d389c435718108c2bfe74eff · Verdict: plan-review-fail
- Unit: 55-executable-golden-fixture · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: c1f040405f0d5178d44bbcfa4441f4ed3b4cccbf25bb12142317a4b4c41d20d2 · Parent Product receipt: spec-review-55-20260917-3
- Source revision: 438c778295348b9174101ef9fdf23b5c1ff775c8 · Artifact revision: 438c778295348b9174101ef9fdf23b5c1ff775c8
- Reviewer: review-plan · Session: 01a0af60-6bf4-7302-a9d2-ced0e2a81494 · Role: reviewer · Author: plan-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T12:39:00Z/2026-09-17T12:45:00Z · Findings: 4 (material open: 3)
- Ledgers read: planning-evidence 16 rows · obligations 14 rows (verified-capable: 0)
- Prior plan receipt (re-review only): none — first cycle
```

Snapshot built by `node scripts/pre-execution-snapshot.mjs build --stage plan
--unit 55-executable-golden-fixture --parent
c1f040405f0d5178d44bbcfa4441f4ed3b4cccbf25bb12142317a4b4c41d20d2
--source-revision 438c778295348b9174101ef9fdf23b5c1ff775c8` at `438c7782`
(`artifactRevisionId` left to the builder's RS3(b) identity default, which is the
same `438c7782…`). The planner's handoff label `55-plan-1` (`SPEC.md` Engineering
half, "Plan artifact revision") is recorded here; the receipt field binds the
builder's canonical digest-derived value, per the feature 37 precedent
(`docs/features/37-phase-lint-script/progress.md:72`: a handoff label in the
field is refused `stale-artifact-revision` with no bound byte moved), so a
consumer's plain `verify --stage plan` matches. It bound three artifacts — `spec` → `SPEC.md`
(56959 B), `acceptance` → `ACCEPTANCE.md` (5452 B), `decisions` →
`decisions.md` (12151 B) — and the three contexts (`project-guide` present,
`normalized-repository-state` present, `architectural-invariants` absent —
NRS F010). The XS/S planning ledgers are embedded in `SPEC.md`, so the
`planning-evidence` / `obligations` rows are `absent` and their bytes are bound
by the whole-file `spec` row (D20); the builder's "no planning ledgers — legacy
adoption state" note is the generic S-unit message for that shape, not a
defect. Parent lineage: `verify --stage spec` reports `stale-source-revision`
because the plan write (438c7782) rotated the derived spec source revision via
the shared `SPEC.md`; rebuilding the `spec-product-v1` projection with the
receipt's exact revisions reproduced `c1f0404…` byte-for-byte and the context
digests are unchanged, so the Product half did not move and L1 holds.

Falsification pass (recorded, not a finding unless evidenced):

```text
FALSIFICATION — 55-executable-golden-fixture plan @ 438c7782
- Engineering claims a hostile reader could call invented rather than evidenced:
  none — every claim resolves to a repository row (PE-001…PE-016); the two toy
  plans' probe outputs reproduce exactly from /tmp/p55-probe at 438c7782.
- A SPEC obligation this plan cannot deliver: none unowned; O2's validator is
  mis-phased (PF-55-03) and the AC5 gate is malformed (PF-55-01).
- A phase whose deliverable could be accepted while its validator passes for the
  wrong reason: P2 — the ACCEPTANCE AC5 slug-grep returns no output on the
  current pre-slim doc (PF-55-01).
- If every phase shipped exactly as written: the doc would likely still exceed
  150 lines (178 remain after the stated removals), failing P2's own done-when
  (PF-55-02).
- Failure state with no scenario or a scenario no validator runs: none — the dev
  scenarios table maps each to a P3 check.
- Verdict stance before checking: CONFIRMED-GAPS
```

### plan — 2026-09-17 (review 2)

```text
## Pre-execution review receipt v1 — plan
- Review: plan-review-55-20260917-2 · Snapshot: 544d8079109c92de159f77d33d050ba35681737a88f3759eee5752c50813938a · Verdict: plan-review-pass
- Unit: 55-executable-golden-fixture · Stage: plan · Unit kind: feature
- Parent SPEC snapshot: c1f040405f0d5178d44bbcfa4441f4ed3b4cccbf25bb12142317a4b4c41d20d2 · Parent Product receipt: spec-review-55-20260917-3
- Source revision: 2ecc4915012206a55344cb862b2c117766bf6348 · Artifact revision: 2ecc4915012206a55344cb862b2c117766bf6348
- Reviewer: review-plan · Session: 01a0afa9-e412-7302-a9d2-cede903cbfcc · Role: reviewer · Author: plan-feature
- Author exclusion: not-enforceable · Context clean: true
- Model diversity: not-applicable · Policy: v1
- Started/finished: 2026-09-17T13:59:01Z/2026-09-17T14:05:00Z · Findings: 0 (material open: 0)
- Ledgers read: planning-evidence 17 rows · obligations 14 rows (verified-capable: 0)
- Prior plan receipt (re-review only): plan-review-55-20260917-1 @ 01ede4dfadf0da465c21741a5a22440104be4d59d389c435718108c2bfe74eff
```

Snapshot rebuilt by `bun scripts/pre-execution-snapshot.mjs build --stage plan
--unit 55-executable-golden-fixture --parent
c1f040405f0d5178d44bbcfa4441f4ed3b4cccbf25bb12142317a4b4c41d20d2` (the
builder's RS3(b) identity default, which is also the newest commit touching a
bound path, `2ecc4915`). The planner's handoff label `55-plan-2` (`SPEC.md`
Engineering half, "Plan artifact revision") is recorded here; the receipt field
binds the builder's canonical digest-derived value, per the review-1 and feature
37 precedents. It bound three artifacts — `spec` → `SPEC.md` (59208 B, sha256
`7f668c7f…`), `acceptance` → `ACCEPTANCE.md` (5999 B, sha256 `a252a827…`),
`decisions` → `decisions.md` (12151 B, sha256 `ac6d394e…`) — and the three
contexts (`project-guide` present, `normalized-repository-state` present,
`architectural-invariants` absent — NRS F010). The XS/S planning ledgers are
embedded in `SPEC.md`, so the `planning-evidence` / `obligations` rows are
`absent` and their bytes are bound by the whole-file `spec` row (D20). L1 parent:
rebuilding the `spec-product-v1` projection with the receipt's exact revisions
(`c5032f6e`/`c5032f6e`) reproduced `c1f040405f0d…` byte-for-byte and the three
context digests are unchanged, so the Product half did not move; `verify --stage
spec` reports only `stale-source-revision` because the plan write rotated the
shared `SPEC.md`, which does not invalidate the Product projection.

Falsification pass (recorded, not a finding unless evidenced):

```text
FALSIFICATION — 55-executable-golden-fixture plan @ 2ecc4915
- Engineering claims a hostile reader could call invented rather than evidenced:
  PE-001/PE-002's toy-plan probe outputs (the fixture files are P1 deliverables,
  not committed at review time), PE-017's 148-line doc budget (a probe number,
  not a recorded command block), and the plan's own phase fingerprints in its
  emitted Phase-lint block. None is material: P1's done-when re-runs the linter
  over the committed fixture, PE-017's arithmetic re-derives from the committed
  doc's section counts (383 − 205 − 11 = 167 → 148), and the plan's own
  Phase-lint output re-runs green at this snapshot.
- A SPEC obligation this plan cannot deliver: none — every AC maps to an
  obligation row; O2's P1 file-fact plus O7's P3 trap assertion together close
  AC6, and O10 carries the full AC5 grep set.
- A phase whose deliverable could be accepted while its validator passes for the
  wrong reason: none — P2's ≤150 cap is paired with O10's AC5 exemption pipeline,
  which is non-vacuous on the pre-slim doc (3 embedded-block lines) and fails on
  a live slug.
- If every phase shipped exactly as written, what would still be broken, and is
  that in scope: nothing in scope — rollback is a PR revert, no persisted state,
  and EN–ES restoration stays feature 57's.
- Failure state with no scenario or a scenario no validator runs: none — the dev
  scenarios table maps every failure state to a P3 check.
- Verdict stance before checking: NO-CONFIRMED-GAPS
```

Ledger sweep L1–L6 and Engineering checks P1–P12 all pass. The review-1 findings
`PF-55-01`…`PF-55-04` are `resolved` at `2ecc4915` with re-verified evidence: the
AC5 pipeline is non-vacuous pre-slim (lines 45, 54, 122) and yields the identical
line set as SPEC AC5's form; the 205-line move + 11 blank re-join (167) + condense
to 148 re-derives exactly and satisfies `wc -l ≤ 150`; O2 is re-phased to P1 with
a P1-runnable file-fact validator and O7 owns the P3 trap assertions; O12 states
the full roadmap status machine. No new finding rows appended to
`planning-findings.md`.

## Acceptance receipt v1

- Manifest: docs/features/55-executable-golden-fixture/ACCEPTANCE.md · Blob: 2b832ac98ae7749a0e286051b4b0bc29f4db735b · Status: frozen · Verified: 2026-09-17 (recorded at plan freeze by `plan-feature-scaffold`; re-frozen at the `PF-55-01` repair, which replaced the malformed AC5 validator with SPEC AC5's markdown-table-safe pipeline; recomputed before every phase and final review per `verification-contract`)

## Dependency receipt v1
- Fingerprint: 93bcc603f4886fdd0a70ae7e42c2991b66339a90 · Closure: 55-executable-golden-fixture (no dependencies — SPEC `## Dependencies` text only)
- Merged PRs: none in closure · Fully merged: yes · Verified: 2026-09-17

## Unit-loop receipt — P1
- Commit: pending · Gate: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` (exit 0, `verdict PASS`) + `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` (exit 1, `verdict BLOCKED`) · Acceptance blob: 2b832ac98ae7749a0e286051b4b0bc29f4db735b
- Next: P2 · Attempts: 1 · Checkpoint triggers since baseline: none (P1 is `config/infra`, next phase is `docs` — layer boundary fires but whole-unit mode records it and continues)

## P1 — 2026-09-17
- Done: committed the golden-fixture corpus — `toy-plan.md` (PASS), `toy-plan-nonatomic.md` (BLOCKED), `toy-spec.md`, `toy-acceptance.md`, `expected/phase-lint-toy-plan.txt` (byte-exact), the envelope valid/invalid pair, the five audit-target files, and `RUN_LOG_NOTES.md` (historical prose moved verbatim); roadmap row 55 flipped to `in-progress`
- Remains: P2 doc slim, P3 assertion suite, P4 Hardening & PR
- Gotchas: the envelope pair differs in exactly one field (`state`) per ED-55-5; `RUN_LOG_NOTES.md` carries a one-paragraph provenance header above the three verbatim blocks; the doc still holds its embedded copies until P2 removes them
- Files: `scripts/fixtures/golden-fixture/**`, `docs/features/ROADMAP.md`, `docs/features/55-executable-golden-fixture/SPEC.md`, `docs/features/55-executable-golden-fixture/progress.md`
- Next: P2 — Slim the golden-fixture procedure doc

## Unit-loop receipt — P2
- Commit: pending · Gate: `wc -l docs/workflow/GOLDEN_FIXTURE.md` → 149 (≤ 150) + the AC5 exemption pipeline → no output · Acceptance blob: 2b832ac98ae7749a0e286051b4b0bc29f4db735b
- Next: P3 · Attempts: 1 · Checkpoint triggers since baseline: layer boundary (P1 `config/infra` → P2 `docs`; recorded, whole-unit mode continues)

## P2 — 2026-09-17
- Done: slimmed `docs/workflow/GOLDEN_FIXTURE.md` from 383 to 149 lines (protocol + smoke precondition + fixed pass criteria + form-turn shape + audit pointer + the 43-row run log); removed both embedded ```markdown blocks and the audit-target build/prose (they live in the fixture tree now); updated the `docs/workflow/README.md` index line and the `CLAUDE.md` verification list to name the executable suite
- Remains: P3 assertion suite, P4 Hardening & PR
- Gotchas: the frozen assembly measure was 148; the committed doc is 149 (one line of slack under the ≤150 cap) because the fixture file list is denser than the per-section probe assumed — the cap, not the exact 148, is the criterion (PE-017/AC5). The 43 run-log rows are byte-identical to the pre-slim bytes and no live `csv-export-command` slug survives outside them
- Files: `docs/workflow/GOLDEN_FIXTURE.md`, `docs/workflow/README.md`, `CLAUDE.md`, `docs/features/55-executable-golden-fixture/SPEC.md`, `docs/features/55-executable-golden-fixture/progress.md`
- Next: P3 — Author the golden-fixture assertion suite
