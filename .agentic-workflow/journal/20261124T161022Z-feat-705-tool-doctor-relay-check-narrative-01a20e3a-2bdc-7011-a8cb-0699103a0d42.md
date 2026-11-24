## 2026-11-24T16:10:22Z — feat/705-tool-doctor-relay-check — narrative
- **Commits:** 19 (`6144d9d3…f46e10ba`)
- **Files:** 27 files
- **Summary:** Diagnostic del doctor no-pi para la issue #705 / PR #714
- **Decisions:** El doctor ya tiene un split genérico/pi-específico bien delimitado (IR11) — la issue #705 re-scopeó el bridge fuera del check; el doctor host dimension sigue sin abrirse; la decisión #703 ya dejó la puerta preparada: battery.mjs lee el envelope del doctor tal cual, así que cada check nuevo aparece gratis en el reporte de #703 sin tocar nada; cobertura de hosts elegida: lista cerrada corta (Opción A — pi, claude-code, opencode, codex, cursor, vscode/copilot), no registro extensible; los candidatos producto/proyecto (dogfooding-vehicle, config-files) se plegarán al censo #717
- **Next:** Cuando se abra el unit del doctor host dimension, abrirlo en esta worktree; las filas pi/específicas se quedan en pi-agentic-workflow, la capa genérica diagnóstica va en el crate
