---
type: feature
scope: medium
roadmap_summary: extend init-workspace's charter interrogation with a repo-objectives interview and a bibliography-backed technical question bank (charter layer 3)
---

# 556 — engineering-interview

> One-line: extend `init-workspace`'s charter interrogation (charter layer 3) with a repo-objectives interview and a bibliography-backed technical question bank, so the substrate records *why-grade* engineering decisions.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Repo objectives interview.**
> "repo purpose, users, team shape (solo/small/large), optimization target (speed vs stability vs compliance), automation appetite — each answer recorded with the workflow consequence it toggles."

**S2 — Technical question bank (testing).**
> "Testing strategy — Cohn's test pyramid; Feathers characterization tests for legacy code; property/fuzz appetite (feeds verification-contract's existing validator slots)."

**S3 — Technical question bank (architectural boundaries).**
> "Architectural boundaries — Evans (bounded contexts → module boundaries), Parnas (information hiding); per boundary: is it enforced in machine (lint/dependency-analysis/CI) or prose only? — the answer feeds the verification-materialization issue."

**S4 — Technical question bank (dependency policy, production verification, decision records, API posture).**
> "Dependency policy — pinning posture, vendoring appetite, deprecation handling (Fowler's smells as the vocabulary). Production verification — Humble & Farley (Continuous Delivery) pipeline-as-verification; SRE book SLIs/error budgets; observability appetite. Decision records — Nygard ADRs as the home for answer provenance. API posture — design-for-misuse / safer-API-over-exception (Meyer's DbC as vocabulary)."

**S5 — Checklist-first qualification.**
> "a question earns its place only when two plausible answers change a workflow behavior downstream (CONTRA-style). No universal questionnaire; simple installs never earn the full bank."

**S6 — Team-adaptation knob.**
> "team conventions override every default; the bank records the default as a dated assumption, never as an override of an existing team rule."

**S7 — Bootstrap output.**
> "Bootstrap on a bare repo runs objectives + technical layers and writes every concrete answer into the agent guide's `## Project charter` / registered criteria catalogue, with unanswered items as dated assumptions — `init-workspace` output diff shows them; no placeholder survives where an answer was given."

**S8 — Question catalog citation.**
> "Every question in the bank cites its bibliography source and states the workflow behavior its answer toggles; a question failing that rule fails the route's own check."

**S9 — Convention precedence.**
> "An install over a team that already declares a convention records the team's rule and never the bank's default (fixture: pre-seeded convention survives bootstrap)."

**S10 — Enforcement answer capture.**
> "The enforcement-prose-or-machine answer for each declared boundary is written where the materialization step reads it."

**S11 — Context budget compliance.**
> "the bank is a reference loaded only when the route reaches the interview (entrypoint stays within the committed ceiling)."

## Impact

- `init-workspace` skill: gains two new interview layers (objectives + technical)
- `template/`: updated agent guide to include the new charter sections
- `docs/research/2026-11-15-all-code-is-slop-mapping.md`: evidence reference
- Consumed by `verification-materialization` (557) for boundary enforcement answers
- Depends on charter layer 1-2 (#435)

## Retirements

none — strictly additive

## Non-goals

- Lane-level pre-spec elicitation (#526 owns it)
- Materializing verification code/config in the target project (557 owns it)
- Any stack/framework-specific question

## Risk tier

`standard` (affects `init-workspace` + `template/`; no behavioral change to the delivery pipeline)

**Tier** — `standard` · **Task Size** — `standard`
**Named high-risk item** — `none — not a high-tier unit`

## Future

none

## Future cost

The bibliography citations must stay idea-adapted, never vendored text.

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — Define the repo-objectives interview questions with workflow consequences (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S1, S6, S11)
  - Relevant files: skills/init-workspace/SKILL.md
- P2 — Build the technical question bank referencing bibliography sources (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S2, S3, S4, S8)
  - Relevant files: skills/init-workspace/SKILL.md, skills/init-workspace/references/technical-bank.md
- P3 — Integrate both layers into `init-workspace`'s interview flow (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S5, S7, S9)
  - Relevant files: skills/init-workspace/SKILL.md, template/AGENTS.md
- P4 — Verify the bootstrapped output on a test repo (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S7, S8, S9, S10, S11)

### Planning evidence

none

### Obligations

none

## Triaged steps

> Awaiting `unit-route` execution after lane triage.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- L1 — 2026-11-15, the request (GitHub issue #563):
  ```
  NEW FEATURE: init-workspace engineering interview — repo objectives + bibliography-backed technical question bank (charter layer 3)
  ```
- D1 — 2026-11-15, triaged as `promote` — valid feature proposal with clear scope, dependencies, and acceptance criteria. The issue is well-structured (goal, business value, in scope, out of scope, acceptance criteria, dependencies) and aligns with the workflow's charter-driven design principles.

## Next

Run `/unit-lane 556-engineering-interview` to begin the design phase.

## References

- Depends on: #435 (charter layers 1-2), #526 (checklist-first evidence)
- Consumed by: #564 (verification materialization)