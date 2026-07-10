# 13 — init-workspace-upgrade-mode · architecture-notes

## What this touches

This repo is **not an application** — it ships `skills/` (agent behavior) and
`template/` (an exportable docs scaffold). "Architecture" here is which of those
surfaces a change touches, and the invariants between them.

| Surface | Touched? | Note |
|---|---|---|
| `skills/init-workspace/SKILL.md` | **yes** | The whole behavioral change: Step 0 mode selection + new Upgrade mode section + never-clobber guardrail. |
| `README.md` / `README.es.md` | **yes** (P2) | The documented "updating an existing install" recommendation, bilingual. |
| `docs/workflow/MIGRATION.md` | **yes** (P2) | Dated note + the same recommendation path. |
| `CHANGELOG.md` / `CHANGELOG.es.md` | **yes** (P2) | Via `bump-skill`. |
| README skill/version tables | **yes** (P2) | Via `bump-skill`. |
| `docs/features/ROADMAP.md` | **yes** (P1) | Row 13 registration. |
| `template/` | **no** | See invariant below — the upgrade logic lives in the skill; the recommendation targets repo-level docs, not the exported scaffold. |
| any app/source code | **no** | None exists; docs/wording-only. |

## Invariants the implementation must hold

1. **Docs/wording-only.** No code, no dependencies, no CI. The deliverable is
   precise, weak-model-proof `SKILL.md` instructions + the recommendation.
2. **Stack/architecture-agnostic.** No product, stack, framework, ORM, runtime,
   or architecture-pattern reference leaks into the skill or shared docs — the
   named tools (Starlight, Biome, Vitest…) stay as **adapter examples** of the
   generic block, exactly as bootstrap mode already frames them.
3. **Additive-only.** Upgrade mode adds/fills; never rewrites a tailored block,
   never deletes (D2). This is the safety property the hardening phase tests.
4. **One mode, one door.** Upgrade is a branch of the same skill, selected by
   Step 0 detection — not a fork, not a separate skill (D1).
5. **Version discipline.** The `SKILL.md` edit ⇒ `bump-skill` (minor, D4) in the
   same PR — the repo's mechanical "version every change" rule.
6. **`Closes #20`.** Issue-born feature — the PR body closes the issue.

## Relationship to sibling skills (unchanged contracts)

- `product-audit` — still proposes-only; upgrade mode **points at it** for
  code-level "which new capabilities apply", does not do its job.
- `PORTABLE_PROMPT.md` / `npx skills add` — migrate **behavior**; upgrade mode
  migrates **substrate**. Complementary, non-overlapping.
