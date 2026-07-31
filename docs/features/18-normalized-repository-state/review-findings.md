| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | template/docs/workflow/REPOSITORY_STATE.md:22 | spec-drift | high | fix-now | fold into P5 — make AC5 pass exactly | yes |
| F2 | skills/discover-repository-state/SKILL.md:44-46 | implementation | high | fix-now | fold into P2/P5 — preserve contradicted state until resolution | yes |
| F3 | skills/resolve-repository-state/SKILL.md:36-40 | implementation | high | fix-now | fold into P2/P5 — stop without freezing on needs-input | yes |
| F4 | skills/init-workspace/SKILL.md:246-247 | implementation | high | fix-now | fold into P3/P5 — add NRS seeding to the process | yes |
| F5 | docs/features/18-normalized-repository-state/TASKS.md:42-43 | verify | med | fix-now | fold into P5 — run and record the golden fixtures | yes |
| F6 | docs/features/18-normalized-repository-state/progress.md:3 | workflow | med | fix-now | fold into P5 — append the required phase handoff entries | yes |
| F7 | CHANGELOG.md:99-367 | workflow | med | fix-now | fold into P5 — add changelog rows for all bumped skills in both languages | yes |
| F8 | README.md:56 | workflow | med | fix-now | fold into P5 — reconcile skill counts across README, SKILLS, and verification output | yes |
| F9 | b9f6fce:docs: link PR #114 | workflow | low | fix-now | fold into P5 — restore the scoped conventional-commit format | yes |
| F10 | skills/discover-repository-state/SKILL.md:52 | implementation | med | fix-now | fold-findings — reconcile the facts-only guardrail with the required non-fact ledger sections | yes |
| F11 | skills/discover-repository-state/SKILL.md:5 | implementation | med | fix-now | fold-findings — define or remove the public --refresh flag | yes |
| F12 | skills/discover-repository-state/SKILL.md:70 | implementation | high | fix-now | fold-findings — make contradicted snapshots route to resolver before planning | yes |
| F13 | skills/resolve-repository-state/SKILL.md:67 | implementation | high | fix-now | fold-findings — make needs-input route stop for evidence instead of recommending planning | yes |
| F14 | skills/init-workspace/SKILL.md:136-141 | implementation | high | fix-now | fold-findings — require discovery/frozen state before the bootstrap handoff to planning or execution | yes |
| F15 | skills/plan-feature/SKILL.md:156-158 | implementation | high | fix-now | fold-findings — gate planning and execution on a frozen, non-contradicted snapshot | yes |
| F16 | PR #114:body | workflow | med | fix-now | fold-findings — synchronize the stale golden-fixture verification note with the committed evidence | yes |
