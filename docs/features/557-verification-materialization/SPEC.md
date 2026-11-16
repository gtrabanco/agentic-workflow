---
type: feature
scope: medium
roadmap_summary: Issue [#564](https://github.com/gtrabanco/agentic-workflow/issues/564) (M): init-workspace verification materialization — declared boundaries become project-local enforcement, feature map, evidence-capture driver
---

# 557 — verification-materialization

> One-line: give `init-workspace` a materialization step that converts charter/interview answers about verification into project-local artifacts — scaffolded config/code or filed issues on the target forge.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Specs

**S1 — Boundary-enforcement scaffolding.**
> "for each declared architectural boundary whose enforcement answer is \"prose only\", propose the machine rule for the detected stack (dependency-cruiser/lint-import/tsconfig-paths–shaped, agnostic by detection) — written to the target repo on consent, or filed as an issue/feature on the target forge on preference."

**S2 — Feature-map scaffold.**
> "`docs/workflow/FEATURE_MAP.md` in `template/` — per user-facing flow: what exists, how a user reaches it, what evidence demonstrates it — seeded from `discover-repository-state` evidence, maintained by the lane's docs step."

**S3 — Evidence-capture convention.**
> "unit-doc acceptance criteria may name artifact evidence (screenshot/video/state-snapshot digest) captured via a driver the project declares (one charter answer names the driver command; the workflow records and invokes it, never ships one)."

**S4 — Declaration-enforcement check.**
> "a boundary declared in `ARCHITECTURAL_INVARIANTS.md`/charter with no named enforcement mechanism becomes a finding (routed via the existing review-design / audit-docs finding vocabulary) — a declared-but-unenforced boundary is exactly the \"lives in reviewer memory\" defect the mapped talk warns about."

**S5 — Outcome-as-issues option.**
> "every materialization item can instead land as a well-formed issue on the target forge (when the team wants to build it themselves), using the target's own conventions."

**S6 — Bootstrap consent gate.**
> "A bootstrap whose interview records a prose-only boundary ends with either that boundary's machine rule present in the target repo (consented) or a filed target-forge issue proposing it — never silently prose-only."

**S7 — Feature-map template.**
> "The feature-map template ships in `template/`, is seeded on bootstrap, and the lane's docs step documents its update duty."

**S8 — Evidence driver contract.**
> "An acceptance criterion naming artifact evidence records the artifact digest in the Evidence row and names the project-declared driver command; with no driver declared, the criterion fails closed with an explicit `manual:` label instead."

**S9 — Unenforced boundary finding.**
> "A declared boundary with no enforcement named produces a typed finding (not prose), route resolvable per the finding-route vocabulary."

**S10 — Consent gates.**
> "Every consent gate holds: no file written and no forge issue filed without explicit yes; both refusals record residuals."

## Impact

- `init-workspace` skill: gains materialization step (new behavior)
- `template/`: new FEATURE_MAP.md template, updated AGENTS.md
- `review-change` / `audit-docs`: new finding type for unenforced boundaries
- Consumes answers from `engineering-interview` (556)
- Target projects: gain boundary enforcement rules or filed issues

## Retirements

none — strictly additive (the interview's prose-only boundaries gain machine enforcement)

## Non-goals

- Shipping any verification implementation in this repo's product (always target-local)
- The interview itself (556 owns it)
- Forge-agnostic issue filing on target projects that have no forge (degrades to scaffold-only)

## Risk tier

`standard` (affects `init-workspace` + `template/` + target projects; consent-gated writes)

**Tier** — `standard` · **Task Size** — `standard`
**Named high-risk item** — `none — not a high-tier unit`

## Future

forge-agnostic issue filing for GitLab/SVN/etc. when the target has no GitHub-like forge.

## Future cost

Finding vocabulary reuse must not stretch `finding-route@1` semantics.

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — Define the materialization rules per boundary answer (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S1, S4, S9)
  - Relevant files: skills/init-workspace/SKILL.md
- P2 — Create the feature-map template (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S2, S7)
  - Relevant files: template/docs/workflow/FEATURE_MAP.md
- P3 — Implement evidence-capture convention (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S3, S8)
  - Relevant files: skills/init-workspace/SKILL.md
- P4 — Integrate materialization into `init-workspace` flow (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S5, S6, S10)
  - Relevant files: skills/init-workspace/SKILL.md, template/AGENTS.md
- P5 — Verify bootstrap on test repo with consent flows (validator: `bun scripts/skill-lint.mjs` exits 0)
  (Implements: S6, S7, S8, S10)

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

- L1 — 2026-11-15, the request (GitHub issue #564):
  ```
  NEW FEATURE: init-workspace verification materialization — declared boundaries become project-local enforcement, feature map, evidence-capture driver
  ```
- D1 — 2026-11-15, triaged as `promote` — valid feature proposal. Hard dependency on 556 (engineering interview) is correct: materialization consumes the interview's enforcement answers. Well-structured with clear consent gates and stack-agnostic design.

## Next

Run `/unit-lane 557-verification-materialization` to begin the design phase (after 556).

## References

- Depends on: #563 (engineering interview, hard)
- Extends: #435 (charter layers 1-2), mapped talk points 2, 3, 4