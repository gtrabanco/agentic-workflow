---
type: feature
scope: large
---

# 437 — review-findings-corpus

> One-line: the repo's years of classified review findings become a measured
> corpus — harvested deterministically from both ledger carriers, admitted only
> when a targeted repair resolved them and the class recurs, attributed to the
> phase that should have caught them, with the correction budget, the
> differential baseline, the `nimio` disposition and the loop-health metric
> computed from that measurement instead of from prose.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — apply issue 437.**
> Apply to this repository: issue #437

**S2 — harvest.**
> **Harvest**: a script joins every `review-findings.md` ledger into one corpus (class / axis / severity / route / unit / cycle / verdict; provenance-bound to the ledgers, never re-derived).

**S3 — admission filter.**
> **Admission filter (CIVER half)**: a finding enters the learning corpus only after it passes the stability-under-unrelated-changes + targeted-repair-resolution half of [arXiv 2610.36010](https://arxiv.org/abs/2610.36010); unverified repeats stay annotated data, never learning input.

**S4 — attribution.**
> **Attribution**: for each recurring class above a measured threshold, determine the phase that should have caught it (triage / design / plan / gate) and propose the migration of that check into a script or checklist row — feeding #359's prose-gate inventory; **context, not procedure** (TDAD ablation caveat, arXiv 2603.17973).

**S5 — `nimio` route.**
> **`nimio` route**: a finding whose materiality is below the floor records a dated note without opening a correction round; it does not count against the budget (#362's vocabulary stays authoritative for rounds).

**S6 — metric.**
> **Metric**: findings-per-cycle trend per unit/repo — the number that decides when the review loop leaves convergence duty (the current default) for verification-only duty.

**S7 — phase 1 of the merged scope.**
> | 1 | this issue | findings corpus harvest + phase-of-origin attribution; measured bands of fix-now volume |

**S8 — phase 2 of the merged scope.**
> | 2 | #362 | script-computed correction budget (formula measured from phase-1's corpus before pinning) + one bounded correction per round + typed needs-your-decision stop |

**S9 — phase 3 of the merged scope.**
> | 3 | #363 | differential baseline run (base vs head) — the mechanical run behind the baseline-advisory rule; `CLASSIFY.md` keeps owning the rule, never a second copy |

**S10 — the ARW code-net metric.**
> - Binding note 2026-11-06: add the **ARW code-net metric** to the measurement design (#307 design note 11): eliminations/(touched surfaces) computed over *code surfaces only* (excluding `docs/`, lockfiles), recorded per unit in Evidence rows. Measured baseline for this repo: **0.28 historical, 0.18 over the last 30 days** (declining with growth — Lehman's continuing-growth symptom); target bands stay `insufficient-corpus` until ≥3 measured units. Also consumes typed verdict receipts, not ledger files (per #307 design note 5).

**S11 — local, unpublished.**
> This is a **local, unpublished** workflow for changing agentic-workflow itself.

**S12 — no self-machinery.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change.

**S13 — ledgers before code.**
> Freeze the planning ledgers before the first line of code

**S14 — test-first, differential, in slices.**
> Implement test-first, differential, in slices

**S15 — docs in the same change.**
> Documentation and state are part of the change, written via surfaces

**S16 — no open obligation rows.**
> A `planned`, `in-progress`, blank, or `deferred` row blocks the handoff

**S17 — correction bounds.**
> A new finding never earns another cycle

## Impact

Consumers of this unit's deliverables:

- `skills/fold-findings` reads the computed budget and the `nimio` route, so a
  correction round is bounded by a measurement instead of by prose.
- `skills/review-change` / `skills/review-implementation/references/CLASSIFY.md`
  keep the severity ladder and the baseline-advisory rule as their own homes;
  `scripts/differential-baseline.mjs` becomes the run that rule cites.
- `docs/workflow/GATE_INVENTORY.md` is the destination of every attribution
  proposal (S4) — proposals are printed, never applied to a skill body.
- The unit's `## Log` carries the ARW code-net reading as an `E` line (S10).

Consumed by this unit:

- `scripts/ledger-provenance.mjs`'s `· fold <sha>` annotation, the only
  machine-readable link between a folded finding and the commit that repaired
  it — the corpus reads it and never re-derives it.
- `scripts/scope-manifest.mjs` (`isNonAffecting`, `changedPathsBetween`,
  `scopeDigestOf`) as the staleness **mechanism**; this unit adds the declared
  **policy** on top (D1) and never modifies that file.
- `scripts/unit-doc-phases.mjs`'s `parseLog` for the migrated carrier.
- `scripts/prose-gate-inventory.mjs`'s vocabulary (`gate-id`, `tier`,
  `stay-reason`) as the proposal shape, read-only.

What stops being true: nothing is removed. This unit adds three readers and one
reference; no existing surface loses a consumer.

## Retirements

None. Every deliverable is additive: the corpus reader, the budget calculator,
the baseline runner and the `nimio` reference are new files, and no existing
token, script or section is deleted or superseded. Evidence:
`rg -c 'findings-corpus|correction-budget|differential-baseline|nimio' scripts/ skills/` → 0 before this unit's first commit.

## Non-goals

- No new ceremony in the unit lane: the corpus is read-only over ledgers that
  already exist (S7's own words: "no new ceremony").
- No second copy of the severity ladder or the baseline-advisory rule; the
  scripts classify over `CLASSIFY.md`'s vocabulary and cite it.
- No preventive-gate migration applied directly: attribution only proposes
  (S4), and a proposal becomes work through triage.
- No publisher, no API, no network: every script is offline and deterministic.
- The two schema packages are untouched, so no envelope/version surface moves.

## Risk tier

- **Tier** — `standard` (computed: `bun scripts/ceremony.mjs tier classify --paths <the branch's changed paths>` → `{"tier":"standard","reason_kind":"executable-content"}` at HEAD e2494fefe25da0c3fffe80c3fc592299ea2bc3e6) · **Task Size** — `understood · contained · resumable` (3 new read-only scripts with sibling suites, one reference, doc surfaces)
- **Named high-risk item** — `none — not a high-tier unit`

## Future

none

## Future cost

- Every future findings ledger must keep the `· fold <sha>` annotation if it
  wants its rows admitted to the learning corpus; a ledger without it stays
  annotated data by design (S3). Binds `fold-findings` and `ledger-provenance`.
- A new review axis must be added to the attribution map in
  `scripts/findings-corpus.mjs`, or the corpus reports it as `unmapped` instead
  of guessing a phase. Binds every future finder.
- A new trivial-path class must be added to
  `scripts/differential-baseline.mjs`'s declared policy list with its own test;
  the list is the one home of the policy (D1). Binds `review-change`, `audit-pr`.

## Applicable tests

- `bun test scripts/findings-corpus.test.mjs`
- `bun test scripts/correction-budget.test.mjs`
- `bun test scripts/differential-baseline.test.mjs`
- `bun scripts/run-root-suite.mjs` (the full gate)

## Known pre-existing issues

- The migrated carrier (`## Findings` + `## Log` marks) has **no exercised rows**
  in the tree (61 sections, 0 rows, 0 `R`/`V` lines). `does-not-affect`: the
  corpus reader is tested against fixtures for that carrier and against the 56
  real legacy ledgers for the other; no real row is fabricated.
- `docs/ROADMAP.md` row 437 carries no `planned` marker yet. `does-not-affect`:
  the row is updated in this unit's docs slice.

## Tasks

- P1 — Freeze the ledgers and record the pre-change corpus measurement (the
  frozen-failure reproducer: the three readers do not exist and the corpus is
  unmeasurable at base) (validator: `bun scripts/findings-corpus.mjs` exits 1
  with `findings-corpus: unknown command` at base)
  (Implements: S1, S13)
  Relevant files: docs/features/437-review-findings-corpus/SPEC.md
- P2 — Land the corpus suite alone (red) (validator:
  `bun test scripts/findings-corpus.test.mjs` exits 1 on the missing module)
  (Implements: S2, S3, S4, S6, S7, S14)
  Relevant files: scripts/findings-corpus.test.mjs
- P3 — Implement the harvester, admission filter, attribution, health metric and
  ARW code-net reader (validator: `bun test scripts/findings-corpus.test.mjs`
  exits 0)
  (Implements: S2, S3, S4, S6, S7, S10)
  Relevant files: scripts/findings-corpus.mjs
- P4 — Land the budget suite alone (red) then implement the computed budget
  (validator: `bun test scripts/correction-budget.test.mjs` exits 0, after the
  same suite exits 1 on the missing module)
  (Implements: S5, S8, S14)
  Relevant files: scripts/correction-budget.test.mjs, scripts/correction-budget.mjs
- P5 — Land the baseline suite alone (red) then implement the differential
  baseline and the two-layer staleness judge (validator:
  `bun test scripts/differential-baseline.test.mjs` exits 0, after the same
  suite exits 1 on the missing module)
  (Implements: S9, S14)
  Relevant files: scripts/differential-baseline.test.mjs, scripts/differential-baseline.mjs
- P6 — Ship the `nimio` disposition reference and wire it into `fold-findings`
  (validator: `bun scripts/check-skill-context.mjs` exits 0 and
  `bun test scripts/catalog.test.mjs` exits 0)
  (Implements: S5)
  Relevant files: skills/fold-findings/references/NIMIO.md, skills/fold-findings/SKILL.md
- P7 — Doc and state surfaces: roadmap row, attribution rows, gate inventory
  claims, changeset, session log, evidence rows (validator:
  `bun scripts/prose-gate-inventory.mjs` exits 0 with `verdict: PASS` and
  `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S4, S15, S16, S17)
  Relevant files: docs/ROADMAP.md, docs/research/ATTRIBUTION.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/LOGS.md, .changeset/
- P8 — Run the full gate and close every obligation row (validator:
  `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S11, S12, S14, S16, S17)
  Relevant files: scripts/

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Apply to this repository: issue #437
  ```
- **E1** — 2026-11-09, `bun scripts/findings-corpus.mjs` · exit 0 ·
  `findings | 1149 · legacy-ledgers | 56 · fold-annotated | 229 · review-marks | 173`.
- **D2** — 2026-11-09, measurement correction, authority: this unit's P1. The
  cut-time `rg` estimate frozen in O1/PE-001 (1147 rows, 373 fold-annotated, 162
  marks) counted the first column of a prose table (a fold receipt in
  `27-pi-agentic-workflow`) as findings and read only the legacy carrier. The
  reader's shape-scoped count is the frozen value and the ledger cells are
  corrected to it before green; the `rg` invocations that produced the wrong
  estimate are kept in PE-001's source cell rather than deleted.
- **P1** — 2026-11-09 19:40, the unit doc and both planning ledgers frozen before
  the first line of code · `856577d3`.
- **D3** — 2026-11-09, ledger correction, authority: this unit's P2–P5. Nine
  obligation validators named fixture labels that the suites never used (the
  suites name their cases in prose) and O11's measured sample was 118 before the
  resolver learned to skip the one unprovable short sha; the cells now name the
  cases that actually run and the value the run produced (`sample | 70`). No
  obligation, phase or scope changed — only how its validator is identified.
- **E2** — 2026-11-09, `bun test scripts/findings-corpus.test.mjs` · exit 0 · 14
  pass, 0 fail (red at `39e8c376`, green at `3bcf6387`).
- **E3** — 2026-11-09, `bun scripts/findings-corpus.mjs` · exit 0 ·
  `findings | 1149 · review-marks | 173 · fold-annotated | 229 · admitted | 125 ·
  repeat-classes | 9 · findings-per-cycle | 6.02 · arw | 0.88 · arw-band measured`.
- **E4** — 2026-11-09, `bun scripts/correction-budget.mjs --measure` · exit 0 ·
  `batch-size | 1 · sample | 70 · source | findings-corpus` (red at `b9c99499`,
  green at `7a0149cc`).
- **E5** — 2026-11-09, `bun test scripts/differential-baseline.test.mjs` · exit 0
  · 9 pass, 0 fail (red at `1b26195b`, green at `baf34cf3`).
- **E6** — 2026-11-09, `bun scripts/differential-baseline.mjs --base main --head
  HEAD --validators <tmp> --reviewed main` · exit 0 · both validators
  `base exit 0 · head exit 0 · pass`, `verdict | PASS`, `staleness | stale` with
  the six new scripts affecting and the four unit docs trivial.
- **E7** — 2026-11-09, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 29 skills`, the `fold-findings` row at 5920 est / 403 lines / 3 references inside its 5944 / 411 ceilings.
- **G1** — 2026-11-09, HEAD 4ed4d50f4a808a111d256c1629b7c93e353d79ad, `bun scripts/run-root-suite.mjs` (Node 26.13.0 on PATH) · exit 0 · every suite PASS, zero failures.

- **G2** — 2026-11-09, HEAD 4ed4d50f4a808a111d256c1629b7c93e353d79ad, `bun scripts/red-first.mjs` · exit 0 · 51 pairs, 0 findings; `bun scripts/prose-gate-inventory.mjs` · exit 0 · `verdict: PASS`; `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`.

- **D1** — 2026-11-09, owner selected `composed` for the review-staleness
  decision the issue relocated from #363: the **mechanism** is the scope digest
  (`scripts/scope-manifest.mjs`, fix/286) and the **policy** is a declared
  trivial-path list owned by `scripts/differential-baseline.mjs`. Commit-message
  prefixes are not trusted. See `decisions.md` §D1.
- **P9** — 2026-11-11, correction batch at the owner's direction, PR
  [#492](https://github.com/gtrabanco/agentic-workflow/pull/492) (merge
  `17d061fe`): the unit is merged and its obligations are closed, but two
  declared cells were still unshipped — `## Impact`'s "`scripts/differential-baseline.mjs`
  becomes the run that rule cites" and the merged row's settle. Both are closed
  in this batch; the citation is pinned by
  `bun test scripts/differential-baseline.test.mjs` (the new case
  `the rule this run implements cites the run, never a pending check`, red at
  `f8ddfb7b` where `CLASSIFY.md` still read "until it exists"). Environment
  disclosure: mid-batch this worktree was destroyed by an external prune (the
  registration vanished and the branch stayed at `f8ddfb7b`); the two
  uncommitted edits were re-applied on the restored checkout and the runs below
  were repeated there.
- **E8** — 2026-11-11,
  `bun test scripts/differential-baseline.test.mjs` · exit 1 at the base bytes
  (`9 pass, 1 fail` — the new citation case on `CLASSIFY.md`'s pre-437 wording),
  then exit 0 · `10 pass, 0 fail` after the citation (re-observed after the
  restore).
- **E9** — 2026-11-11, `bun scripts/roadmap-settle.mjs` · exit 1 ·
  `verdict: FAIL`, `2 violations` (`pr-url-unsettled` on the PR URL the unit doc
  now carries), then exit 0 · `186 unit docs checked · 0 fix docs skipped ·
  verdict: PASS · violations: 0` after the writer.
- **E10** — 2026-11-11, `agentic-workflow roadmap docs/ROADMAP.md rowUpsert
  <json> --expect ea687fc4…` · exit 0 · `Schema: roadmap-table@1 · Receipt: pass
  · Before: ea687fc4 · After: 9b2fb28d` (the row's status cell and its stale
  closing sentence, one splice).
- **E11** — 2026-11-11, `bun scripts/docs-generate.mjs` · exit 0 ·
  `1 written · 0 deleted · 2 unchanged`, then `bun scripts/docs-generate.mjs
  --check` · exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned · verdict:
  PASS`.
- **E12** — 2026-11-11, `bun scripts/check-skill-context.mjs` · exit 0 ·
  `PASS context budgets: 29 skills`; `bun test scripts/vocabulary-parity.test.mjs`
  · exit 0 · 21 pass, 0 fail; `bun scripts/lint-changeset.mjs
  .changeset/437-review-findings-corpus.md` · exit 0 · `ok`.
- **E13** — 2026-11-11, the citation's budget consequence: naming the run in
  `CLASSIFY.md` pushed the four `review-change:*` routes over their ceilings by
  47–52 est and 2 lines (those routes carried zero headroom), so the four route
  ceilings are re-based to the checker's `ceil(measured × 1.10)` with the growth
  source declared in each route's `sources` map ·
  `bun scripts/check-skill-context.mjs --routes` · exit 0 ·
  `PASS route budgets: 14 routes`, and
  `bun test scripts/check-skill-context.test.mjs` · exit 0 · 1 pass. The crate's
  `budgets ceilingRebase` was tried on a scratch copy first and rejected: it
  overwrites the route's existing `ceilingRebase` growth-source key with the new
  one, so the rebase is written in the file's own curated `sources` shape.
- **G3** — 2026-11-11, HEAD `40b7f54d`, `bun scripts/local-gate.mjs` · exit 0 ·
  `local-gate: PASS — 17 step(s) in 205s` (the crate suite at `659 pass, 0 fail`).
  The batch's first gate run, at `be4f6193`, failed at `root-suite` on the four
  `review-change:*` route ceilings that `E13` re-bases.
- **D4** — 2026-11-12, triage of the 2026-11-11 delta EXTERNAL VERIFY's three
  advisories, at the owner's direction. Advisory 1 (phase-lint BLOCKED on this
  doc's Tasks ledger: P3's `(Implements:)` clause glued after the validator's
  closing paren so S10 reads unlinked; S11/S12/S15 cited by no task) is fixed in
  this batch — the clause moves onto its own line, S15 links to P7 (where
  obligation O22 already binds it) and S11/S12 link to P8, the close-out gate
  phase where both process constraints are observable (the precedent shape:
  fix 355 links its non-goals to the enforcement phase, fix 407 links its
  gates-green claim to the verification phase). Advisories 2–3
  (`docs/fix/361-finding-severity-ladder/SPEC.md:402` + `decisions.md:34`, and
  `docs/features/96-prose-gate-inventory/planning-evidence.md:31`) are
  wontfix: dated 2026-11-04 records in closed unit docs are frozen history,
  not live narration — the rule's one owner (`CLASSIFY.md`) is fixed and pinned
  by `scripts/differential-baseline.test.mjs`.
- **P10** — 2026-11-12, the phase-lint linkage batch: the Tasks-ledger repair
  above, validated on a scratch copy first, then applied.
- **E14** — 2026-11-12, `bun scripts/phase-lint.mjs
  docs/features/437-review-findings-corpus/SPEC.md` · exit 1 · `verdict
  BLOCKED` at the pre-batch bytes (`task-link-missing: P3 links no requirement`
  + `spec-unlinked: S10/S11/S12/S15`), then exit 0 · `verdict PASS`, P1–P8 all
  `PASS (6/6)` after the repair (fixture run first on a scratch copy,
  same result).

## Next

Hand the diff to the owner as the external verifier: the suites, the real-tree
readings, the closed obligations ledger and the verification block in
`## Log`. Any finding the owner reports is repaired in one bounded correction
batch limited to the blockers named, then those obligation rows' validators are
re-run before their statuses move again.

- **2026-11-11 — merged and corrected.** PR
  [#492](https://github.com/gtrabanco/agentic-workflow/pull/492) merged the unit
  into `main` (merge `17d061fe`, 2026-11-10). The batch recorded as `P9` below
  closes the two residuals the merge left: the rule now cites the run, and the
  roadmap row is settled. Left to the owner: closing issue #437 and deleting the
  `fix/437-review-loop-mechanics` branch.

## References

- Issue [#437](https://github.com/gtrabanco/agentic-workflow/issues/437) — absorbs #362 and #363.
- `skills/pre-execution-review/references/LEDGERS.md` — the row contracts.
- `skills/review-implementation/references/CLASSIFY.md` — the severity ladder and the baseline-advisory rule.
- `docs/research/papers-sweep-2026-11-02.md` — the CIVER verdict this filter implements.
- `docs/workflow/GATE_INVENTORY.md` — the attribution proposals' destination.
