## 2026-11-21T11:41:34Z — fix/gate-deps-advisories — narrative
- **Commits:** 6 (`48baffb8…f94f2147`)
- **Files:** 6 files
- **Summary:** Resolví la cadena de CI que fallaba tras merge de PR #672: root-suite.yml moría con ERR_MODULE_NOT_FOUND (pasos del gate sin dependencias), luego con 'Author identity unknown' (runner sin identidad git) y finalmente con SUITE TIMEOUT sobre doc.structure (marginal bajo carga). Tres fixes red-first; gate remoto success.
- **Decisions:** 1) dependency-advisories y docs-generated-projection necesitan workspace-install+schema-build (ya lo tenían sus gemelos); 2) suiteChildEnv inyecta identidad de fixture estable porque CI no tiene git identity; 3) allowlist aprende per-suite suiteTimeoutMs, doc.structure declara 240s con razón y medición. Push con AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1.
- **Next:** Merge PR #673 (abierto, CI success). Opcional: revertir la tolerancia timeout→WARNING del PR #672 en un PR aparte.
