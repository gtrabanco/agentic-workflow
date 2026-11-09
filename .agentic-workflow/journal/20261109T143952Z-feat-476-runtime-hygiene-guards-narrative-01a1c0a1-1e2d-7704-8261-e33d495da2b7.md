## 2026-11-09T14:39:52Z — feat/476-runtime-hygiene-guards — narrative
- **Commits:** 17 (`acab332e…002cad1f`)
- **Files:** 36 files
- **Summary:** Resolví los conflictos de la PR #478 con origin/main por merge commit (never rebase), unioned ambos sets de gate steps (log-immutability #468 + temp-hygiene/tmp-gc/worktree-guard #476), re-pinnee machineLines a 62 medido, regeneré docs/generated, verifiqué union completa con script mecánico, push aprobado con el escape hatch del hook (log-immutability rojo heredado de main).
- **Decisions:** Merge commit, nunca rebase (9a635063 ya publicado). Unión de ambos sets de pasos del gate en el mismo hueco (log-immutability entre journal-carrier-check y temp-hygiene). Re-pinned SKILL_CONTEXT_BUDGETS.json: machineLines 59→62, estimate 5217 inside 5542 ceiling. Escape hatch AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1 documentado en PR por log-immutability rojo heredado (todos los commits marcados ya son ancestros de origin/main).
- **Next:** Owner revisa PR #478 y merga (row 476: done · [PR]). Log-immutability rojo es propio de #468, no de #476; abrir unidad si se quiere arreglar.
