# Fix 142 — SKILLS.md/ES skill counts stale

## Problem

`docs/workflow/SKILLS.md` and `docs/workflow/SKILLS.es.md` claim **17 user-facing + 14 internal** skills (total 31). The frontmatter truth is **18 user-facing + 17 internal = 35**. The counts were last corrected at `ab93f02` (feature 18 fold F8) when there were 31 skills. Features 19–23 added 4 more skills without updating the count.

## Scope

1. Update `docs/workflow/SKILLS.md` line 7: "17 user-facing" → "18 user-facing", "14 internal" → "17 internal"
2. Update `docs/workflow/SKILLS.es.md` line 7: "17 skills orientadas al usuario" → "18 skills orientadas al usuario", "14 pasos internos" → "17 pasos internos"
3. Add `phase-contract` to the internal-skill enumeration paragraph (it is the 15th internal skill, not currently named)
4. Verify the prose enumeration covers all 17 internal skills

## Acceptance

- `grep -rn "17 user-facing\|14 internal" docs/workflow/SKILLS.md` → 0 matches
- `grep -rn "17 user-facing\|14 internal" docs/workflow/SKILLS.es.md` → 0 matches
- `grep -c "18 user-facing" docs/workflow/SKILLS.md` → 1
- `grep -c "17 internal" docs/workflow/SKILLS.md` → 1
- `grep "phase-contract" docs/workflow/SKILLS.md` → present
- `node scripts/check-skill-context.mjs` → PASS (no SKILL.md changed)
- EN/ES siblings updated in the same change (AD-002 bilingual rule)
