# 646 — docs-skills-reconciliation · decisions

Owner-scope decisions live in the unit doc's `## Log` (`D1…Dn`), so a reviewer
reads them beside the requirement they answer. This file carries only the
writes the repository's own path-protection floor requires the unit to declare
(owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md` §
`path-protection-records@1`, block `path-protection@1`).

## Path-protection records

`**/*.test.*` is a frozen class under the shipped floor
(`packages/pi-agentic-workflow/src/config/path-policy.ts`,
`SHIPPED_PATH_POLICY`): a pre-freeze `create` needs nothing, a pre-freeze
`modify` needs a `justification` row. One file is modified — an additive change
to the drift gate's claim model (a new publisher kind plus its own case); no
existing assertion moves, and the new kind is what makes the A2 count-class
restatement machine-checkable instead of hand-typed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/normative-drift.test.mjs | P5 | 2026-11-20 | execute-phase | additive: one new `count:packages` publisher kind, its case, and one `rendered-facts@1` row — no existing assertion, kind or fixture changes
```

## Residual promises

`bun scripts/residual-classify.mjs --inventory --base origin/main` classifies
every surface this unit adds. A new script whose consumer is the root suite, a
reference no route declares, or a page the emitter does not own can come back
`orphan` / `no-plan-claim`, because the classifier resolves a claim from the
ledgers and reads neither a test's `spawn` nor a markdown link as one. Every row
below names the live consumer so the classifier resolves instead of guessing
(owner: `skills/unit-lane/references/DESIGN.md` § `residual-promise@1`).

```text
residual-promise@1
surface | consumer | date | owner
scripts/repository-state.mjs | suite:scripts/repository-state.test.mjs · route:resolve-repository-state/SKILL.md | 2026-11-20 | issue #646
scripts/restatement-sweep.mjs | suite:scripts/restatement-sweep.test.mjs · check:skills/audit-docs/SKILL.md | 2026-11-20 | issue #646
scripts/reading-coverage.mjs | suite:scripts/reading-coverage.test.mjs · unit:docs/fix/646-docs-skills-reconciliation/second-read.md | 2026-11-20 | issue #646
skills/resolve-repository-state/references/STATE_CONTRACT.md | link:skills/resolve-repository-state/SKILL.md · link:skills/discover-repository-state/SKILL.md | 2026-11-20 | issue #646
skills/audit-docs/references/RESTATEMENT.md | link:skills/audit-docs/SKILL.md · corpus:scripts/restatement-sweep.mjs | 2026-11-20 | issue #646
docs/workflow/LOADING.md | index:docs/workflow/README.md · map:AGENTS.md | 2026-11-20 | issue #646
```

## Owner decisions this unit takes

Both are recorded as `D` lines in `## Log` where the requirement they answer is
read, so this file does not restate them: **D3** (the AI-001 template's one home,
`docs/architecture/ARCHITECTURAL_INVARIANTS.md`) and **D4** (the
weaker-than-author rule's one home,
`skills/unit-lane/references/ORCHESTRATE.md` § The delegate brief). The two
decisions the *copies* raised — the UI/adapter-glue red-first exception and the
Notion mirror — are `D5` and `D2`, both taken against a recorded authority
(S6's bullet states the decision is the design step's; the issue's A2 records
the mirror as retired on 2026-11-19).
