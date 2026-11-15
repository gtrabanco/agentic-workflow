# Decisions — fix/441-triage-issue-rescope

Decision log for this unit. The unit's frozen decisions live in the unit doc's
`## Log`; this file carries the path-protection declaration and the escape
records the protected-path gate reads. Append-only — both grammars are owned by
[`skills/orchestration-envelope/references/TURN_CONTRACT.md`](../../../skills/orchestration-envelope/references/TURN_CONTRACT.md)
(`path-protection@1`) and `packages/agentic-workflow/src/path-policy.mjs`.

## Decision log

| ID | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D-441-1 | The new suite (`scripts/triage-rescope.test.mjs`) is the ONLY protected path this unit touches, and it is created, never modified. No existing test file is edited. | Extend `scripts/vocabulary-parity.test.mjs`'s published-set list with the two new vocabularies (rejected: it is a protected `**/*.test.*` path and a modify needs the owner's recorded `approval`, which an agent may never write for itself — and the parity list is not what any gate asserts; the two sets are pinned by this unit's own suite, which is the stronger claim) | The gate's purpose is that a test file changes only with a recorded reason; a new file created by the unit that owns it needs a declaration, not an approval, and this unit's own suite asserts the frozen sets, their order and their prose parity |
| D-441-2 | The declaration declares no `freeze-after` boundary (`none`), with the freeze stated in the row's justification instead | Declare `freeze-after: P1` (rejected as false: the ledgers and the acceptance criteria froze at the cut, `ef4c41e4`, which precedes P1 — the grammar has no way to say "before P1", and a boundary after P1 would claim later phases are post-freeze when they are not) | The honest state is that the unit is past its freeze for every phase; `none` plus the stated fact keeps the gate's own semantics truthful instead of bending the boundary to buy a cheaper requirement |
| D-441-3 | The owner's scope amendment (S9, selection A-441) puts the gate's five concurrency fixes in THIS unit and this PR — one PR carries two concerns | Open `fix/gate-concurrency-robustness` as its own unit/PR with its own ledgers (my recommendation; rejected by the owner's verbatim "Prefiero arreglarlo en esta misma unidad" and the A-441 selection) | The owner is this workflow's external verifier and may direct scope; the override is recorded here and in the unit doc's Log (D9) instead of being absorbed silently, and the amendment still pays its full price: new `S9`, tasks P10–P14, obligations O14–O19, red-first corpus, records |

## Path protection

The plan declaration has one home, the unit doc's `## Tasks` section
(`path-protection-plan@1`, `freeze-after: none`, one `created` row for
`scripts/triage-rescope.test.mjs`). This file carries the *records* that
override it. The only protected path this unit touches is the suite it creates,
so every row below is the same file at a later phase, each naming the reason it
changed after the previous phase's own run:

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/triage-rescope.test.mjs | P1 | 2026-11-15 | execute-phase | Two corrections inside the RED landing itself, before any implementation exists: the batch-flow regression control asserted the batch summary's grouping against the skill body when the grouping paragraph lives in ISSUE_PROCESS.md (the assertion now reads the file that owns it, and it is the one test that must be GREEN at the red commit — it proves the assertions target real base text), and the one-shot test's tier clause accepts the wording the reference actually uses. No assertion was relaxed, skipped or narrowed to make a future phase pass.
justification | scripts/local-gate.test.mjs, scripts/run-root-suite.test.mjs, scripts/tmp-gc.test.mjs | P10 | 2026-11-15 | execute-phase | The S9 amendment's RED corpus (owner scope amendment, decision log D-441-3): the three sibling suites gain the five frozen reproducers — the dist-graph edges, the hook's jobs flag and `--jobs auto`, the two declared budgets, the `KILLED (bail)` wire format and the concurrent-sweep skip — landed observed RED before any implementation, and no existing assertion is relaxed, skipped or narrowed.
justification | scripts/triage-rescope.test.mjs | P9 | 2026-11-15 | execute-phase | The correction batch over the 2026-11-15 EXTERNAL VERIFY receipt (external-verify.md, blockers B1-B7 plus the advisories this batch repairs): the suite gains eight ADDED assertions, one per frozen reproducer, landed observed RED against the pre-correction bytes before any prose is touched. No existing assertion is relaxed, skipped, narrowed or deleted — the batch only adds, and what it pins is the receipt's own reproducers.
```

The ledgers and the acceptance criteria froze at the cut (`ef4c41e4`), before
P1. A `modify` of a protected file is what the pre-freeze matrix asks a
justification for (`freeze-after: none` keeps every phase pre-freeze, which is
D-441-2's honest reading of a freeze that already happened). No post-freeze
`approval` is triggered because nothing here edits a *frozen* test file: the two
new vocabularies are pinned by the suite created here, not by
`scripts/vocabulary-parity.test.mjs` (D-441-1).
