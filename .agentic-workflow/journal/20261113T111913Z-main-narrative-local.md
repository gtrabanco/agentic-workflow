## 2026-11-13T11:19:13Z — main — narrative
- **Commits:** 0
- **Files:** —
- **Summary:** Diagnosed y arreglé el publish.yml gate que fallaba por la fusión del race fixture sin identidad git — exporté GIT_CONFIG y el merge lo usa, 659/659 tests verdes con y sin identidad. Creé y fusioné PR #530 (fix/529), PR #531 y #532 (Engram MCP path skip, merged). Issue #529 cerrado.
- **Decisions:** El merge del race fixture era el único spawn de git sin identidad en el suite del crate. La solución es exportar GIT_CONFIG desde fixtures.mjs y usarla en el merge — no añadir git config --global al workflow, que ocultaría la siguiente fuga de identidad (convención -c por invocación de #514 S7).
- **Next:** Verificar que publish gate corra verde en CI tras fusionar PR #530. Limpiar worktree fix-529-journal-merge-identity.
