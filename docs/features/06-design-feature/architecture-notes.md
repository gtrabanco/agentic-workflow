# 06 — design-feature · architecture notes

Layer/impact notes. This repo ships **skills** and a **doc scaffold**, not an
application — "architecture" here is the skill pipeline and the authoring
contract, not runtime layering.

## Impact surface

| Artifact | Change | Version impact |
|---|---|---|
| `skills/design-feature/SKILL.md` | **new** user-facing skill | new @ 1.0.0 |
| `skills/plan-feature/SKILL.md` | slim: drop interview, add redirect gate | **major** |
| `skills/plan-feature-interview/` | **deleted**, logic → design-feature | removal (major surface) |
| `skills/plan-feature-from-issue/SKILL.md` | emit two-halves SPEC + closure | minor |
| `skills/plan-feature-scaffold/SKILL.md` | fill engineering half only | minor (if body changes) |
| `docs/features/_TEMPLATE/SPEC.md` | two halves + `## Design status` marker | template convention |
| `docs/workflow/FEATURE_WORKFLOW.md` | five-stage pipeline + two-halves SPEC | doc |
| `docs/workflow/SKILLS.md` | add design-feature; plan-feature role change | doc |
| `docs/workflow/MIGRATION.md` | major-change notes | doc |
| `CHANGELOG.md` / `CHANGELOG.es.md` / README EN·ES | via `bump-skill` | bookkeeping |

## Pipeline shape

```
design (design-feature) → plan (plan-feature) → execute (execute-phase)
                                                     → review (review-change) → audit (audit-pr / product-audit)
```

`design-feature` and `plan-feature` write the **same `SPEC.md`**, each its own
half. `plan-feature` refuses to plan a SPEC whose product half is not marked
`designed`.

## Invariants to hold (authoring contract — `CLAUDE.md`)

- `design-feature`: `user-invocable: true`; opens with `## Turn contract`; has
  `Step 0`, `Guardrails`, `## Portability`, `Relationship to other skills`,
  `Done when`; checklist-driven with fixed output formats; `P1, P2, …` labels
  only; closes with a visible `→ Next:` block, then the machine envelope as the
  absolute last output.
- **Stack/architecture agnostic** — generic phrasing only in the skill and shared
  docs ("the project's entities", "the project's ACL model"); no product/stack/
  framework/ORM/runtime/architecture-pattern references.
- **Hand off, don't compose across a lower tier** (D10): `plan-feature` →
  `design-feature` is a hand-off (print `run /design-feature <slug>`).
  `plan-feature-from-issue` composes `design-feature` only when running at ≥ its
  tier; otherwise it hands off. `design-feature` is planning-class (strongest
  model / high effort intent).
- **Machine envelope** (`orchestration-envelope`): `design-feature` emits it last;
  `state` ∈ `OK` (designed) / `NEEDS_INPUT` (interview question) / `BLOCKED`
  (unresolvable closure gap); `next.recommended = /plan-feature <slug>`.

## Gate detection (interim → U4)

`plan-feature` greps the SPEC `## Design status` marker (`designed`) + a non-empty
`## Capability closure` section. U4 migrates this to the roadmap `defined` status;
the SPEC marker remains as the SPEC-local record. Keep the check as a single
readable predicate ("product half complete?") so the U4 migration is a one-line
swap, not a reshape.
