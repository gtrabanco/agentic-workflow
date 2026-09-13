# Roadmap Execution Order

**Generated:** 2026-09-13  
**Last audit:** 2026-09-13  
**Rule:** #176 is always last (skill-context budget slimming after all features settle)  
**Priority:** Speed/token efficiency > foundation > dependencies > quality gates

---

## Estado actual (2026-09-13)

| Feature | Issue | Estado PR | Estado Roadmap |
|---------|-------|-----------|----------------|
| #37 | #184 | OPEN (#212) | in-progress |
| #38 | #185 | MERGED (#213) | done |
| #45 | #201 | sin PR (branch existe) | idea (necesita redesign) |
| #214 | #214 | branch active | fix in-progress (usuario) |

---

## Triage aplicado hoy

### Issues sin triaje formal → ahora triageadas

| Issue | Título | Tipo | Triage Veredicto | Acción |
|-------|--------|------|------------------|--------|
| **#214** | Settings crash >24 options | **bug** (fix-next, ui, pi-agentic-workflow) | **fix-now** | Fix de prioridad alta. Ya en progreso (branch `fix/214`). Bloquea uso de settings. |
| **#205** | Review loops do not converge | **enhancement** (backlog, promoted) | **meta-issue → plan-feature** | Meta-issue raíz de los loops de review. Su solución se distribuye en #31 (materiality) + #46 (research gate). No es una feature separada. |
| **#209** | Release policy: no major versions | **bug** (CLOSED) | **CLOSED** | Issue #209 está CLOSED. La política fue adoptada. Eliminar referencia de ROADMAP_EXECUTION_ORDER.md. |
| **#177** | Planning-review scope: verify ledger | **enhancement** | **subsumed by #31** | Issue #177 tiene el mismo dominio que #31/#171. Sin roadmap row propio. Se resuelve como parte de #31. |

### Issues ya triageadas (roadmap rows existentes)

| Issue | Roadmap NN | Slug | Estado |
|-------|-----------|------|--------|
| #152 | #34 | bilingual-sibling-drift-check | idea |
| #171 | #31 | planning-review-materiality | idea |
| #172 | #32 | review-consistency-pack | idea |
| #173 | #33 | turn-contract-single-owner | idea |
| #174 | #41 | pi-state-flow-lifecycle | idea |
| #180 | #40 | versioned-skills-releases | idea |
| #182 | #35 | scoped-receipt-verifier | idea |
| #183 | #36 | verification-contract-hygiene | idea |
| #186 | #39 | pi-auto-log-session | idea |
| #192 | — | (experimental) | No en roadmap → baja prioridad |
| #194 | #42 | deterministic-review-change | idea |
| #198 | #44 | per-skill-package-layout | idea |
| #201 | #45 | operator-approved-model-routing | idea (necesita redesign) |
| #206 | #46 | design-implementation-research | idea |
| #207 | #47 | reuse-first-design | idea |
| #176 | — | (tech-debt) | No en roadmap → siempre último |

---

## Árbol de Dependencias

```
ROADMAP EXECUTION ORDER — ÁRBOL COMPLETO DE DEPENDENCIAS

Fase 0: Bugs Críticos (immediatos, sin dependencias)
├── [214] Settings crash >24 options (fix)
│   └── Estado: in-progress (branch fix/214)
│   └── Paralelizable con: TODO (debe cerrarse primero)

Fase 1: Foundation Scripts (token savings máximos)
├── [37] phase-lint-script (issue #184)
│   └── Estado: in-progress (PR #212 OPEN)
│   └── Linter determinista de las 8 reglas de fase
│   └── Paralelizable con: [38] (ya merged), [36], [34]
│
├── [38] workflow-status-sensor-script (issue #185)
│   └── Estado: done (PR #213 MERGED)
│   └── Sensor determinista de workflow-status
│   └── Paralelizable con: [37] (ya merged), [36], [34]
│
├── [36] verification-contract-hygiene (issue #183)
│   └── Estado: idea (sin folder)
│   ├── Anti-flakiness validator rule
│   ├── Property/fuzz validator recognition
│   └── Golden-fixture metric row
│   └── Paralelizable con: [34] (superficies disjoint)
│
└── [34] bilingual-sibling-drift-check (issue #152)
    └── Estado: idea (sin folder)
    ├── Script de detección de drift EN/ES
    ├── check-roadmap-sync.mjs (módulo secundario)
    └── Paralelizable con: [36] (superficies disjoint)

Fase 2: Review Convergence (fix loop antes de slimming)
├── [31] planning-review-materiality (issue #171)
│   └── Estado: idea (sin folder)
│   ├── low → report-note (no blocking)
│   ├── hard two-cycle cap → NEEDS-DESIGN
│   └── wording-only → cosmetic batch (sin re-review completo)
│   └── Depende de: [29] (merged ✓)
│   └── Paralelizable con: [39], [41], [44] (superficies disjoint)
│
├── [32] review-consistency-pack (issue #172)
│   └── Estado: idea (sin folder)
│   ├── one-owner folded: no→yes = fold-findings
│   ├── canonical severity conversion table
│   ├── derived blocking gate
│   ├── gate-run receipt (GATE-RAN)
│   └── Depende de: [30] (merged ✓) + [31] (en ejecución)
│   └── NO paralelizable con [31] (shared surfaces)
│
├── [35] scoped-receipt-verifier (issue #182)
│   └── Estado: idea (sin folder)
│   ├── CLI determinista de sign/verify
│   ├── Affecting-path binding para review-change
│   └── Depende de: [32] (GATE-RAN extensible digest slots)
│   └── NO paralelizable con [32] (chain)
│
└── [42] deterministic-review-change (issue #194)
    └── Estado: idea (sin folder)
    ├── Explicit changed-file scope
    ├── Footprint-driven axis applicability
    ├── Inline-first passes
    └── Depende de: [37] + [38] (scripts must exist)
    └── Paralelizable con: [31] (después de #37+38 merged)

Fase 3: Turn Contract & Release Hygiene
├── [33] turn-contract-single-owner (issue #173)
│   └── Estado: idea (sin folder)
│   ├── P0: TURN_CONTRACT.md read-only profile
│   ├── P1-Pn: migration de 13+ skills (uno por fase)
│   ├── check-skill-context budgets re-based
│   └── Depende de: [30] + [31] + [32] (texto final)
│   └── NO paralelizable con [32] (chain)
│
└── [40] versioned-skills-releases (issue #180)
    └── Estado: idea (sin folder)
    ├── bump-skill.mjs (script determinista)
    ├── Stable git tag por release
    └── Depende de: [30] + [31] + [32] + [37] + [38]
    └── NO paralelizable con [33] (shared surfaces)

Fase 4: Process Improvements (root-cause de loops)
├── [46] design-implementation-research (issue #206)
│   └── Estado: idea (sin folder)
│   ├── widen research gate
│   ├── convergence pass (requester × typical × complete)
│   └── Root-cause fix para #205 (review loops)
│   └── Depende de: [31] (shared planning-review surfaces)
│   └── NO paralelizable con [31] (chain)
│
├── [47] reuse-first-design (issue #207)
│   └── Estado: idea (sin folder)
│   ├── init-workspace reuse-profile preference
│   ├── build-or-reuse in design-feature
│   └── library quality bar
│   └── Depende de: [46] (convergence pass)
│   └── NO paralelizable con [46] (chain)
│
└── [45] operator-approved-model-routing (issue #201)
    └── Estado: idea (branch existe, necesita redesign)
    ├── passes config + resolve-passes
    ├── Operator-approved model pinning
    └── Depende de: redesign post #43 declined
    └── Paralelizable con: [39], [41], [44] (después de redesign)

Fase 5: Pi Package Features (paralelizables entre sí)
├── [39] pi-auto-log-session (issue #186)
│   └── Estado: idea (sin folder)
│   ├── auto log-session opt-in
│   ├── session hooks
│   └── Sin dependencias ★ PARALELIZABLE CON TODO
│
├── [41] pi-state-flow-lifecycle (issue #174)
│   └── Estado: idea (sin folder)
│   ├── state-flow on long-running commands
│   └── Sin dependencias ★ PARALELIZABLE CON TODO
│
└── [44] per-skill-package-layout (issue #198)
    └── Estado: idea (sin folder)
    ├── scripts ship inside skill folder
    ├── shared runtime resolver
    └── Depende de: #197 (bun-first, merged ✓)
    └── Sin dependencias de features ★ PARALELIZABLE CON TODO

Fase 6: Experimental / Low Priority
└── [192] doc toolchain (experimental)
    └── Estado: idea (sin folder)
    ├── Markdown as source + derived JSON index
    ├── AST-based edit CLI
    └── Sin dependencias ★ PARALELIZABLE CON TODO
    └── Experimental — no bloquea nada

Fase 7: Final Slimming (SIEMPRE ÚLTIMO)
└── [176] slim SKILL context routes (tech-debt)
    └── Estado: idea (sin folder)
    ├── Medir growth source por route
    ├── trim/restructure vs re-basis
    └── Depende de: TODAS LAS FASES
    └── SIEMPRE DESPUÉS de todas las features
```

---

## Tabla de Paralelización

### Grupo A: Paralelizables en Fase 1 (Foundation Scripts)

| Task | Paralelizable con | Por qué | Conflictos de archivos |
|------|-------------------|---------|------------------------|
| #36 + #34 | sí | Superficies disjoint: #36 = verification-contract + golden-fixture; #34 = docs EN/ES + scripts de drift | Ninguno |
| #36 + #37 | sí | #37 ya merged, #36 toca surfaces disjoint | Ninguno |
| #36 + #38 | sí | #38 ya merged, #36 toca surfaces disjoint | Ninguno |
| #34 + #37 | sí | #37 ya merged, #34 toca docs EN/ES | Ninguno |
| #34 + #38 | sí | #38 ya merged, #34 toca docs EN/ES | Ninguno |

### Grupo B: Paralelizables en Fase 2 (Review Convergence)

| Task | Paralelizable con | Por qué | Conflictos de archivos |
|------|-------------------|---------|------------------------|
| #31 + #39 | sí | Superficies disjoint: #31 = pre-execution-review; #39 = pi extension events | Ninguno |
| #31 + #41 | sí | Superficies disjoint: #31 = pre-execution-review; #41 = pi state-flow | Ninguno |
| #31 + #44 | sí | Superficies disjoint: #31 = pre-execution-review; #44 = skill package layout | Ninguno |
| #31 + #45 | sí (tras redesign) | Superficies disjoint: #31 = pre-execution-review; #45 = pi model routing | Ninguno |
| #31 + #192 | sí | Superficies disjoint: #31 = pre-execution-review; #192 = doc toolchain | Ninguno |

### Grupo C: Paralelizables en Fase 5 (Pi Features)

| Task | Paralelizable con | Por qué | Conflictos de archivos |
|------|-------------------|---------|------------------------|
| #39 + #41 | sí | Ambas del paquete pi, superficies distintas: #39 = extension events, #41 = state-flow | CHANGELOG (coordinar: un PR por feature) |
| #39 + #44 | sí | #39 = extension events, #44 = layout scripts | CHANGELOG (coordinar) |
| #41 + #44 | sí | #41 = state-flow, #44 = layout scripts | CHANGELOG (coordinar) |
| #39 + #41 + #44 | sí | Las tres del paquete pi, superficies distintas | CHANGELOG (coordinar: un PR por feature, mismo commit) |
| #39 + #41 + #44 + #45 | sí (tras redesign) | Todas del paquete pi, superficies distintas | CHANGELOG (coordinar) |

### Grupo D: Items que NO pueden paralelizarse (dependencias secuenciales)

| Secuencia | Tasks | Razón |
|-----------|-------|-------|
| A | #31 → #32 | #32 comparte surfaces con #31 (pre-execution-review/LEDGERS/POLICY) |
| B | #32 → #35 | #35 depende de #32 (GATE-RAN extensible digest slots) |
| C | #32 → #33 | #33 migra 13+ skills contra texto final de #32 |
| D | #31 → #46 | #46 comparte planning-review surfaces con #31 |
| E | #46 → #47 | #47 depende de #46 (convergence pass) |
| F | #37 + #38 → #42 | #42 necesita los scripts deterministas de #37/#38 |
| G | #30 + #31 + #32 → #33 | #33 necesita texto final consolidado |
| H | #30 + #31 + #32 + #37 + #38 → #40 | #40 necesita scripts + consistency |

---

## Matriz de Conflictividad

**Leyenda:** `✓` = conflicto de archivos (NO paralelizable) · ` ` = sin conflicto (paralelizable)

| Feature \ Con | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 39 | 40 | 41 | 42 | 44 | 45 | 46 | 47 | 192 | 176 |
|---------------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|-----|-----|
| **31** | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **32** | ✓ | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **33** | ✓ | ✓ | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **34** |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **35** |  | ✓ |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **36** |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |
| **37** |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |
| **38** |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |
| **39** |  |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |
| **40** | ✓ | ✓ |  |  |  |  | ✓ | ✓ |  | — |  |  |  |  |  |  |  |  |
| **41** |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |
| **42** |  |  |  |  |  |  | ✓ | ✓ |  |  |  | — |  |  |  |  |  |  |
| **44** |  |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |
| **45** |  |  |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |
| **46** | ✓ |  |  |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |
| **47** |  |  |  |  |  |  |  |  |  |  |  |  |  |  | ✓ | — |  |  |
| **192** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | — |  |
| **176** | ✓ | ✓ | ✓ |  |  |  |  |  |  | ✓ |  |  |  |  |  |  | ✓ | — |

---

## Priorización por Aceleración y Reducción de Tokens

### Prioridad P0: Bugs Críticos (hacer primero)

| Feature | Impacto | Ahorro de tokens | Paralelizable con |
|---------|---------|------------------|-------------------|
| #214 (Settings crash) | Bloquea uso de settings con >24 modelos | — | — (debe cerrarse primero) |

### Prioridad P1: Foundation Scripts (mayor ahorro de tokens, sin dependencias)

Estas reemplazan model reasoning por scripts deterministas → ahorro compounding infinito.

| Feature | Impacto | Ahorro estimado | Estado |
|---------|---------|-----------------|--------|
| #37 (phase-lint) | Linter determinista de fases → reemplaza model reasoning en cada plan | ~4000-8000 tokens/run | in-progress (PR #212) |
| #38 (workflow-status sensor) | Sensor determinista → reemplaza model reasoning en cada workflow-status | ~3000-6000 tokens/run | done (PR #213 merged) |
| #36 (verification-hygiene) | Anti-flakiness → menos re-runs de golden-fixture | ~1000-3000 tokens/run | idea (paralelizable con #34) |
| #34 (bilingual drift check) | Automates bilingual sync rule → menos rework manual | ~500-2000 tokens/run | idea (paralelizable con #36) |

### Prioridad P2: Review Convergence (fix before slimming)

Sin convergencia, slimming es desperdicio.

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #31 (planning materiality) | Elimina loops de re-review → reduce ciclos de spec/plan | #39, #41, #44, #45, #192 |
| #32 (review consistency) | Un solo dueño de fold + canonical severity → menos disputas | — (depende de #31) |
| #35 (scoped receipt verifier) | Receipts binding a affecting paths → menos falsos positivos | — (depende de #32) |
| #42 (deterministic review-change) | review-change es el mayor consumidor de tokens del workflow | #31 (después de #37+#38 merged) |

### Prioridad P3: Pi Package Features (paralelizables entre sí)

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #39 (pi-auto-log-session) | Full mechanical memory → resume seguro | #41, #44, #45, #192 |
| #41 (pi-state-flow) | State lifecycle en comandos largos | #39, #44, #45, #192 |
| #44 (per-skill layout) | Fix distribution gap | #39, #41, #45, #192 |
| #45 (model routing) | Operator-approved model pinning | #39, #41, #44, #192 (tras redesign) |

### Prioridad P4: Process Improvements (después de convergencia)

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #46 (design research) | Root-cause fix de loops de review (#205) | — (depende de #31) |
| #47 (reuse-first design) | Reduce duplicación en diseño | — (depende de #46) |

### Prioridad P5: Hygiene (después de P1-P4)

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #33 (turn contract) | Único dueño → menos drift futuro | — (depende de #30+#31+#32) |
| #40 (versioned releases) | Pipeline de releases automatizado | — (depende de #30+#31+#32+#37+#38) |

### Prioridad P6: Experimental

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #192 (doc toolchain) | Experimental, no bloquea nada | TODO (paralelizable con todo) |

### Prioridad P∞: Slimming (SIEMPRE ÚLTIMO)

| Feature | Impacto |
|---------|---------|
| #176 (slim context) | Reduce budgets de context → todos los modelos más rápidos |

---

## Orden de Ejecución Óptimo (recomendado)

```
Session 1: #214 (Settings crash) — fix rápido, baja riesgo
         + #36 + #34 en paralelo (Foundation scripts, disjoint surfaces)

Session 2: #31 (planning-review-materiality) — bloquea #32
         + #39 + #41 + #44 en paralelo (Pi features, disjoint surfaces)

Session 3: #32 (review-consistency-pack) — bloquea #35, #33, #40
         + #192 (doc toolchain) — experimental, paralelo a todo

Session 4: #35 (scoped-receipt-verifier)
         + #33 (turn-contract) empieza P0 contra final text de #32

Session 5: #33 continua (migración de 13+ skills, una skill por fase)
         + #40 (versioned releases)

Session 6: #42 (deterministic review-change) — necesita #37+#38 scripts
         + #45 (operator-approved-model-routing, tras redesign)

Session 7: #46 (design-implementation-research) — necesita #31

Session 8: #47 (reuse-first-design) — necesita #46

Session N: #176 (slim SKILL context) — SIEMPRE último
```

**Total de sesiones estimadas:** ~8 + #176 (siempre último)

---

## Notas de Triage

1. **#205 (Review loops)** no es una feature separada — es la meta-issue que describe el problema. Su solución se distribuye en:
   - #31 (materiality bar, two-cycle cap)
   - #46 (research gate widening, convergence pass)
   - #32 (canonical severity, derived blocking gate)

2. **#209 (Release policy)** está CLOSED — la política fue adoptada. Eliminar referencia de ROADMAP_EXECUTION_ORDER.md.

3. **#177 (Planning-review scope)** tiene el mismo dominio que #31/#171. Se resuelve como parte de #31. No necesita roadmap row propio.

4. **#45 (Operator-approved model routing)** tiene un plan en branch `feat/45` pero necesita redesign post #43 declined. No empezar hasta que el redesign esté hecho.

5. **#192 (Doc toolchain)** es experimental. Puede hacerse en cualquier momento, paralelo a todo, pero baja prioridad.

---

*Documento generado el 2026-09-13. Revisar tras cada merge para actualizar dependencias.*