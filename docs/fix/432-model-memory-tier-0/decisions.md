# Decisions — fix/432-model-memory-tier-0

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/knowledge-honesty-contract.test.mjs | P1 | 2026-11-07 | execute-phase | The delta receipt's F1 says the fold needs a pin, not only a repair: one case is added to the test home the issue declared, reading the seven migrated claim journals and refusing `provenance: repository` on any row whose first cited source names something outside the repository (`~/`, `$HOME`, `curl `, `gh issue view`, `gh api`, `npm view`, `registry.`, `pi.dev`, `http`). It lands red, before the cells it judges are corrected; no existing assertion is relaxed, narrowed or deleted.
approval | scripts/knowledge-honesty-contract.test.mjs | P1 | 2026-11-07 | human-owner | The owner ordered this exact case in the correction batch ("F1 necesita un pin no-vacuo, no solo la corrección: añade un caso a scripts/knowledge-honesty-contract.test.mjs"), and named this suite as its home rather than a new one.
```

## Sources journal (design step output)

| id | claim | source | provenance | certainty |
|---|---|---|---|---|
| INV-001 | The unit must add a provenance column to the design/plan `sources.md` journal and forbid `confirmed` on `model-memory` rows | issue #432, Expected behaviour 1 | owner answer (S1) | confirmed |
| INV-002 | External implementation-detail claims verify against the project's pinned version before guiding a task, as a one-fetch receipt | issue #432, Expected behaviour 2 | owner answer (S2) | confirmed |
| INV-003 | Deterministic verification prefers a script, extending #359's migration | issue #432, Expected behaviour 3 | owner answer (S3) | confirmed |
| INV-004 | The research step gains the repo-answered exit with a receipt (claim + where) | issue #432, Expected behaviour 4 | owner answer (S4) | confirmed |
| INV-005 | Adopted knowledge lands in `docs/research/ATTRIBUTION.md` in the same PR | issue #432, cite-sources clause | owner answer (S5) | confirmed |
| INV-006 | arXiv 2406.10279 = "We Have a Package for You!…" (USENIX Security 2025), 2310.03214 = "FreshLLMs…", 2608.22652 = "Evaluating Inference-Time Defenses against Package Hallucination…", 2607.02052 = "Mitigating Package Hallucinations… via Model Editing" | `web_fetch` of the four arXiv pages, 2026-11-07 (receipts in `## Log` E1) | version-pinned doc (the pages fetched today) | confirmed |
| INV-007 | No machine parser reads the `sources.md` journal columns, so the added column breaks no consumer | `rg -l "sources\.md" scripts/*.mjs` → no non-test match | repository | confirmed |
| INV-008 | The certainty vocabulary is not versioned in the schema package (no `certainty` token exists in `packages/agentic-workflow-schema/src/`), so the issue's conditional "schema package vocabulary **if** the certainty field is versioned" does not trigger a package change | `rg -n "certainty" packages/` → 0 matches | repository | confirmed |
| INV-009 | The scriptable checks (actionlint/schema/type-check as lane steps) are the issue's declared second slice and need measured acceptance per #260 before they are built | issue #432, §Path | owner answer (issue text) | confirmed |
| INV-010 | The golden-fixture smoke run for executor-path wording can only be run by the owner with a fleet weak model | `docs/workflow/GOLDEN_FIXTURE.md` §When to run / §The procedure | repository | confirmed |

## Open questions

none — no questions: every claim was settled by provenance or research

| Asked | Resolution |
|---|---|

## Decisions

```text
D1 | 2026-11-07 | decision | — | proponent (lane, no question needed) | this unit's `decisions.md` | The #432 test cases live in `scripts/knowledge-honesty-contract.test.mjs`, not a new suite — the suite is the single carrier of the design/plan knowledge-honesty contract (#303) and the one-owner rule forbids a second copy of the same contract's pins. Discarded: a new `model-memory-*.test.mjs` suite (a second home for the same contract; rejected, no new suite and no second gate-suite file).
D2 | 2026-11-07 | decision | — | proponent (lane) | this unit's `decisions.md` | No schema-package change and no new `normative-surfaces@1` row: the journal grammar is prose (INV-008 — certainty is not versioned), so the issue's schema condition does not trigger; the provenance kinds stay a closed prose set pinned by the suite instead of a versioned block. Discarded: publishing `SOURCE_PROVENANCE_KINDS` from the schema package (out of the issue's own Where for this slice; would also force the normative-drift machinery's must-name path with no consumer).
D3 | 2026-11-07 | decision | — | proponent (lane) | this unit's `decisions.md` | The gate note lands as a `prose` row in `prose-gate-inventory@1` with stay-reason `judgment-needed` (whether a claim was verified against the pinned version is a per-run judgment no fixed offline assertion can decide); `checkability: 2` keeps the row out of the auto-`migrate` tier honestly. Discarded: a script row (no script exists for this gate in this slice — that is the deferred second slice).
D4 | 2026-11-07 | decision | — | proponent (lane) | this unit's `decisions.md` | The branch is the owner-provided `feat/432-model-memory-tier-0`, not the template's `fix/432-...` spelling — recorded in the SPEC's Branch section rather than renaming the owner's branch.
```

## Assumptions

| Date | Assumption | Correctable by |
|---|---|---|
| 2026-11-07 | The issue's four cited papers are the complete evidence set the attribution rows owe — a later owner review may add readings (`evidence only` rows are append-only) | the owner, via a `D` row here |
