# 06 — design-feature · testing

No application build exists; "green" is the repo's doc-verification gate
(`CLAUDE.md` → Verification). There is no unit/integration/architecture test
layer — the skills and docs are the product.

## Layers

| Layer | Applies | What |
|---|---|---|
| Unit / integration / architecture | **no** | no code changed |
| Structural (skills CLI) | **yes** | `npx skills add . --list` discovers every skill, including `design-feature`; no error on the removed `plan-feature-interview` |
| Textual (acceptance-as-commands) | **yes** | the `grep`/`test` checks in SPEC Acceptance criteria 1, 3, 4, 5, 6, 7, 8, 9 |
| Cross-doc | **yes** | `bump-skill` consistency (skill `version:` ↔ CHANGELOG EN/ES ↔ README skills+model tables EN/ES); doc-map + skill-reference links resolve — run `/audit-docs` |
| Weak-model read-through | **yes** | `design-feature` read as if executed by the fleet's weakest model: every closure row independently checkable, no "if needed", fixed output formats |
| Manual dry-run | **yes** | the two interaction modes (bare vs `<instruction>`), upsert (destroys nothing), and the redirect on an undesigned slug print the fixed formats |

## Commands (run in P4 hardening)

```sh
npx skills add . --list

# AC1 / AC3 / AC4 — new skill
grep -q "^name: design-feature$" skills/design-feature/SKILL.md
grep -q "^user-invocable: true$" skills/design-feature/SKILL.md
grep -iq "add feature" skills/design-feature/SKILL.md
grep -iq "capability closure" skills/design-feature/SKILL.md

# AC5 — template marker
grep -q "## Design status" docs/features/_TEMPLATE/SPEC.md

# AC6 — redirect, no bypass flag
grep -q "/design-feature" skills/plan-feature/SKILL.md
! grep -Eq "\-\-force-plan|--skip-design|--no-design" skills/plan-feature/SKILL.md

# AC7 — interview retired
test ! -e skills/plan-feature-interview
! grep -rq "plan-feature-interview" skills docs README.md README.es.md

# AC8 / AC9 — pipeline + migration docs
grep -iq "design-feature" docs/workflow/FEATURE_WORKFLOW.md
grep -q "design-feature" docs/workflow/MIGRATION.md
```

Cross-doc consistency (AC10) and no-stack-leakage (AC11) are verified by
`/audit-docs` plus a manual read.
