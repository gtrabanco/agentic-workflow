# Roadmap Execution Order

**Generated:** 2026-09-13  
**Last audit:** 2026-09-13 (regenerado — consolidación owner-approved: 4 absorciones, 3 nuevas issues)  
**Rule:** #176 is always last (skill-context budget slimming after all features settle)  
**Priority:** Speed/token efficiency > foundation > dependencies > quality gates

---

## Estado actual (2026-09-13 — post-consolidación)

| Feature | Issue | Estado PR | Estado Roadmap | Notas |
|---------|-------|-----------|----------------|-------|
| #37 | #184 | OPEN (#212) | in-progress | close-out completo (gate 298/298 verde); pendiente review/merge — **primera acción** |
| #38 | #185 | MERGED (#213) | done | — |
| #31 | #171 | sin PR | idea | + mecanismo **asymmetric filter** (OCR study — ver comentario en la issue) |
| #32 | #172 | sin PR | idea | + amendment: findings-table strict validation + Ground A/B en derived blocking gate |
| #35 | #182 | sin PR | idea | su manifest CLI es el substrate del review-state (#218) |
| #41 | #174 | sin PR | idea | **absorbe #39** (auto log-session como hook independiente del mismo seam) |
| #42 | #194 | sin PR | idea | depende de 37+38 (37 en PR #212); scope contract que #218 persiste |
| #45 | #201 | sin PR (branch existe) | idea | necesita redesign post #43 declined |
| #46 | #206 | sin PR | idea | **absorbe #47** (fases: research gate → convergence pass → reuse ladder) |
| #48 | #215 | sin PR | idea | **absorbe #49** como stage experimental (journeys canary) |
| — | #218 | sin PR | idea — fila pendiente de plan-feature (próximo nº libre: 50) | **NUEVA** — review evidence substrate (producer family; crea el JS crate) |
| — | #219 | sin PR | idea — fila pendiente de plan-feature | **NUEVA** — Serena MCP provisioning (pi + init-workspace, ask-first) |
| — | #220 | sin PR | idea — fila pendiente de plan-feature | **NUEVA** — path-protection guards (defaults deterministas + config del owner) |
| — | #192 | sin PR | issue sin fila (experimental) | doc toolchain; + guardrails del índice derivado (comentario en la issue) |
| #214 | #214 | branch activa | fix in-progress | usuario lo está trabajando |

---

## Consolidación 2026-09-13 (owner-approved)

### Absorciones (issues cerradas — nada se pierde)

| Issue cerrada | Destino | Razón |
|---------------|---------|-------|
| #177 (planning-review scope) | → #171 / feat 31 | Mismo dominio y superficies; el triage previo ya lo asignaba a #31 ("no necesita roadmap row propio") |
| #186 (pi-auto-log-session) | → #174 / feat 41 | Mismo seam del paquete pi (session events, settings, CHANGELOG); un plan/PR, flags independientes |
| #207 (reuse-first-design) | → #206 / feat 46 | La cadena 46→47 ya era secuencial (superficies compartidas en `design-feature`); una feature con fases |
| #216 (self-convergent envelopes) | → #215 / feat 48 | Dependencia dura 48→49 + fixture infrastructure compartida; el criterio generalize-or-close es stage exit de #48 |

Las filas de roadmap 39, 47 y 49 quedan **folded → 41 / 46 / 48** respectivamente (fila y número se conservan, nunca se reutilizan — precedente: declined #43).

### Nuevas issues (estudio open-code-review + guards)

| Issue | Título | Tipo | Triage | Acción |
|-------|--------|------|--------|--------|
| **#218** | Review evidence substrate — per-file review state, evidence-bound findings, optional LSP verification | enhancement (M, producer family) | plan-feature → próxima fila (50) | Depende de #35 (#182 manifest CLI); consumido por #42; mecanismo de #205. **Crea el JS crate** (vehicle rule de #43 declined) |
| **#219** | Serena MCP provisioning — pi package dependency + init-workspace opt-in install | enhancement (S) | plan-feature → fila propia | Paralelo a todo; provisioning por defecto (ask-first), runtime con degradación elegante |
| **#220** | Path-protection guards — shipped deterministic defaults, owner-configurable, tests freeze (TDD) | enhancement (S/M) | plan-feature → fila propia | Tier 1 portable (gate en checkpoint de fase, fingerprint de #37) + Tier 2 extensión pi (bloqueo en `tool_call`); escape = justificación + aprobación owner, jamás auto |

---

## Árbol de Dependencias

```
ROADMAP EXECUTION ORDER — ÁRBOL COMPLETO (2026-09-13, post-consolidación)

Fase 0: Bugs Críticos (inmediatos)
└── [214] Settings crash >24 options (fix)
    └── Estado: in-progress (branch del usuario) — paralelizable con todo, cierra primero

Fase 1: Foundation Scripts (token savings máximos)
├── [37] phase-lint-script (#184)
│   └── Estado: in-progress (PR #212 OPEN) — MERGE PRIMERO
├── [38] workflow-status-sensor-script (#185)
│   └── Estado: done (PR #213 MERGED)
├── [36] verification-contract-hygiene (#183)
│   └── Anti-flakiness validator rule · property/fuzz recognition · golden-fixture metric row
│   └── Paralelizable con: [34]
└── [34] bilingual-sibling-drift-check (#152)
    └── Script de drift EN/ES — quick win paralelo a todo

Fase 2: Review Convergence (fix loop antes de slimming)
├── [31] planning-review-materiality (#171)
│   ├── low → report-note · hard two-cycle cap → NEEDS-DESIGN · wording-only route
│   ├── + NUEVO mecanismo: asymmetric filter (default-approve, Ground A/B, protected subjects)
│   └── Depende de: [29] (merged ✓) · NO paralelizable con [32] (superficies compartidas)
├── [32] review-consistency-pack (#172)
│   ├── one-owner folded flag · severity conversion table · derived blocking gate · GATE-RAN receipt
│   ├── + Amendments: findings-table strict validation + Ground A/B literal evidence
│   └── Depende de: [31]
├── [35] scoped-receipt-verifier (#182)
│   ├── CLI determinista de affecting-path manifests + scoped receipt binding
│   └── Depende de: [32] (GATE-RAN extensible digest slots)
└── [42] deterministic-review-change (#194)
    ├── Explicit changed-file scope · footprint-driven axes · inline-first passes
    └── Depende de: [37] + [38] (scripts existentes)

Fase 2.5: Evidence Substrate (NUEVO — mecaniza el lado output del review)
└── 218 review evidence substrate (#218) ★ NUEVA
    ├── review-state.json (reviewed@sha / skipped@sha+motivo / pending, invalidación automática)
    ├── Evidence binding (snippet citado verbatim en el árbol candidato)
    ├── LSP opcional (Serena) con fallback verbatim · cost estimate pre-run
    ├── Depende de: [35] (manifest CLI) · coordina con [42] (scope contract)
    └── Crea el JS crate (vehicle rule #43) — ancla del futuro runner @gtrabanco/agentic-workflow

Fase 3: Turn Contract & Release Hygiene
├── [33] turn-contract-single-owner (#173)
│   └── Depende de: [30] + [31] + [32] (texto final)
└── [40] versioned-skills-releases (#180)
    └── Depende de: [30..32] + [37] + [38]

Fase 4: Design-side (root-cause de #205)
└── [46] design-implementation-research (#206)
    ├── Fases: research gate widening → convergence pass → reuse ladder (absorbido de [47])
    └── Depende de: [31] (superficies planning-review compartidas)

Fase 5: Envelope v2 Continuations
└── [48] binary-validated-continuations (#215)
    ├── Continuation object Envelope v2 · emit-time validation fail-closed · discipline tests
    ├── Stage experimental (absorbido de [49]): journeys canary → generalize-or-close
    └── Sin dependencias de otras features — paralelizable casi con todo

Fase 6: Pi Package Features (paralelizables entre sí; coordinar CHANGELOG)
├── [41] pi-state-flow-lifecycle (#174)
│   ├── state-flow on long-running commands
│   └── + absorbe [39]: auto log-session (autoLogSession flag propio)
├── [44] per-skill-package-layout (#198)
│   └── Scripts ship inside skill folder + shared runtime resolver
└── [45] operator-approved-model-routing (#201)
    └── Requiere redesign post #43 declined — no empezar antes

Fase 6b: Infra transversal (NUEVO)
├── 219 Serena provisioning (#219) ★ NUEVA — paralelo a todo
└── 220 path-protection guards (#220) ★ NUEVA
    ├── Tier 1 portable (cualquier host) · Tier 2 extensión pi
    └── Soft-dep: [37] (fingerprint de fase)

Fase 7: Experimental / Low Priority
└── 192 doc toolchain (#192)
    ├── MD como fuente + derived JSON index + AST edit CLI
    ├── + Guardrails del índice: cache, nunca fuente; FTS5 (node:sqlite built-in); vectores opt-in futuro
    └── Paralelizable con todo

Fase 8: Final Slimming (SIEMPRE ÚLTIMO)
└── [176] slim SKILL context routes (tech-debt)
    └── Depende de: TODAS LAS FASES
```

---

## Tabla de Paralelización

### Grupo A: Fase 1 (Foundation)

| Task | Paralelizable con | Por qué | Conflictos |
|------|-------------------|---------|------------|
| #36 + #34 | sí | Superficies disjoint (verification-contract vs docs EN/ES) | Ninguno |
| #36 + #37 | sí | #37 en vuelo, superficies disjoint | Ninguno |
| #34 + #37/#38 | sí | docs EN/ES vs scripts | Ninguno |

### Grupo B: Fase 2 (Review Convergence) + transversales

| Task | Paralelizable con | Por qué | Conflictos |
|------|-------------------|---------|------------|
| #31 + #34/#36 | sí | Superficies disjoint | Ninguno |
| #31 + #41/#44/#45/#192/#48 | sí | Superficies disjoint | Ninguno |
| #31 + #219/#220 | sí | Planning-side vs pi/execution | Ninguno |
| #42 + #34/#36/#48 | sí | Superficies disjoint | Ninguno |
| #48 + #34/#36 | sí | Schema Envelope vs docs/scripts | Ninguno |

### Grupo C: Fase 6 (Pi package + infra)

| Task | Paralelizable con | Por qué | Conflictos |
|------|-------------------|---------|------------|
| #41 + #44 | sí | Superficies distintas del paquete | CHANGELOG (coordinar) |
| #41 + #219 | coordinar | Ambos tocan pi package | package.json/CHANGELOG |
| #44 + #219 | coordinar | Ambos tocan pi package | package.json/CHANGELOG |
| #219 + #220 | coordinar | Ambos añaden al paquete pi | package.json/CHANGELOG |
| #220 + #48 | sí | Guards (execution) vs schema (envelope) | Ninguno |

### Grupo D: Secuencias obligatorias

| # | Secuencia | Razón |
|---|-----------|-------|
| A | #31 → #32 | Superficies compartidas (pre-execution-review/LEDGERS/POLICY) |
| B | #32 → #35 | #35 depende de los digest slots extensibles de GATE-RAN |
| C | #32 → #33 | #33 migra 13+ skills contra texto final |
| D | #31 → #46 | Superficies planning-review compartidas |
| E | #35 → 218 | 218 consume el manifest CLI de #182 |
| F | #37 + #38 → #42 | #42 consume los scripts deterministas |
| G | #42 → 218 | 218 persiste el scope contract que #42 define (coordinar) |
| H | #37 → 220 | Fingerprint de fase (soft-dep; puede empezar el diseño antes) |
| I | #30+#31+#32 → #33 | Texto consolidado final |
| J | #30+#31+#32+#37+#38 → #40 | Scripts + consistencia para versionar |

---

## Matriz de Conflictividad

**Leyenda:** `✓` = conflicto de archivos (NO paralelizable) · ` ` = sin conflicto. Triangular inferior por convención. Filas 39/47/49 eliminadas (folded).

| Feature \ Con | 31 | 32 | 33 | 34 | 35 | 36 | 37 | 38 | 40 | 41 | 42 | 44 | 45 | 46 | 48 | 218 | 219 | 220 | 192 | 176 |
|---------------|----|----|----|----|----|----|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|
| **31** | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **32** | ✓ | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **33** | ✓ | ✓ | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **34** |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **35** |  | ✓ |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **36** |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **37** |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |  |
| **38** |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |  |  |
| **40** | ✓ | ✓ |  |  |  |  | ✓ | ✓ | — |  |  |  |  |  |  |  |  |  |  |  |
| **41** |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |  |  |
| **42** |  |  |  |  |  |  | ✓ | ✓ |  |  | — |  |  |  |  |  |  |  |  |  |
| **44** |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |  |
| **45** |  |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |  |  |
| **46** | ✓ |  |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |  |
| **48** |  |  |  |  |  |  |  |  |  |  |  |  |  |  | — |  |  |  |  |  |
| **218** |  | ✓ |  |  | ✓ |  |  |  |  |  | ✓ |  |  |  |  | — |  |  |  |  |
| **219** |  |  |  |  |  |  |  |  |  | ✓ |  | ✓ | ✓ |  |  |  | — |  |  |  |
| **220** |  |  | ✓ |  |  |  |  |  |  | ✓ |  | ✓ | ✓ |  |  | ✓ | ✓ | — |  |  |
| **192** |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | — |  |
| **176** | ✓ | ✓ | ✓ |  |  |  |  |  | ✓ |  |  |  |  |  | ✓ | ✓ | ✓ | ✓ | ✓ | — |

---

## Priorización por Aceleración y Reducción de Tokens

### P0: Bugs críticos

| Feature | Impacto |
|---------|---------|
| #214 (Settings crash) | Bloquea settings con >24 modelos — in-progress por el usuario |

### P1: Foundation Scripts (ahorro compounding)

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| **#37 → MERGE PR #212** | Linter determinista de fases — desbloquea #42 y #220 | — |
| #36 (verification hygiene) | Anti-flakiness → menos re-runs | #34 |
| #34 (bilingual drift check) | Automatiza regla EN/ES | #36 |

### P2: Review Convergence

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #31 (materiality + asymmetric filter) | Elimina loops de re-review | #34/#36, pi features, #48, #192, #219/#220 |
| #32 (consistency + amendments) | Un dueño por regla + validación mecánica de findings | — (tras #31) |
| #35 (scoped receipt verifier) | Receipts bound a affecting paths | — (tras #32) |
| #42 (deterministic review-change) | Mayor token consumer del workflow | #31 (post #37+#38 merged) |

### P2.5: Evidence Substrate (NUEVO — alto valor)

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| 218 (evidence substrate) | Mechaniza anti-manufacture de findings + cobertura cerrada; **crea el JS crate** | Tras #35; coordina con #42 |

### P3: Envelope Infrastructure

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #48 (continuations + journeys stage) | Mejora TODOS los `→ Next:` | #31/#34/#36/pi/#192/#219/#220 |

### P4: Pi Package + Infra

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #41 (state-flow + auto log-session) | Memoria mecánica + lifecycle en comandos largos | #44, #45, #192, #48 |
| #44 (per-skill layout) | Fix distribution gap | #41, #45, #192, #48 |
| #45 (model routing) | Operator-approved pinning (tras redesign) | pi features |
| #219 (Serena provisioning) | LSP presente por defecto | Todo (coordinar pi package) |
| #220 (path guards) | "Never change a test to pass it" como restricción | #42/#48; coordinar pi |

### P5: Design-side

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #46 (research gate + convergence + reuse ladder) | Root-cause de #205; absorbe #47 | — (tras #31) |

### P6: Hygiene

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #33 (turn contract) | Un dueño por fase → menos drift | — (tras #30+#31+#32) |
| #40 (versioned releases) | Pipeline de releases | — (tras #30..#32+#37+#38) |

### P7: Experimental

| Feature | Impacto | Paralelizable con |
|---------|---------|-------------------|
| #192 (doc toolchain + índice) | Cache de lectura; no bloquea nada | Todo |

### P∞: Slimming (SIEMPRE ÚLTIMO)

| Feature | Impacto |
|---------|---------|
| #176 (slim context) | Todos los modelos más rápidos — solo cuando todo lo demás haya asentado |

---

## Orden de Ejecución Óptimo (recomendado)

```
Session 1: MERGE #212 (feature 37 — close-out completo, gate verde)  ← PRIMERA ACCIÓN
         + #214 continúa (usuario)
         + #36 + #34 + #48 en paralelo (Foundation + Envelope, superficies disjoint)

Session 2: #31 (materiality + asymmetric filter) — bloquea #32
         + #41 (state-flow + auto log-session absorbido) + #44 + #219 en paralelo
         + #192 si hay hueco (experimental)

Session 3: #32 (consistency + findings validation + Ground A/B) — desbloquea #35/#33/#40
         + #220 (guards; fingerprint de #37 ya merged)

Session 4: #35 (scoped receipt verifier) — desbloquea #218
         + #33 empieza P0 contra texto final de #32

Session 5: #33 continúa (migración de skills, una por fase)
         + #40 (versioned releases)

Session 6: #42 (deterministic review-change — necesita #37+#38)
         + #45 (model routing, tras redesign)

Session 7: #218 (evidence substrate — necesita #35 + coordinación con #42; crea el crate)
         + #46 (design research + reuse ladder — necesita #31)

Session 8: Buffer / #192 si quedó pendiente / journeys stage de #48 si el canary arranca

Session N: #176 (slim SKILL context) — SIEMPRE ÚLTIMO
```

**Total estimado:** ~8 sesiones + #176.

---

## Notas de Triage

1. **#205 (Review loops)** es la meta-issue: su fix se distribuye en #31 (materiality bar + **asymmetric filter**: default-approve, Ground A/B literal-contradiction-only removal, protected subjects como vetos) + #32 (derived blocking gate + findings-table validation) + #46 (research gate + convergence, absorbe #47) + **#218** (evidence binding — mata mecánicamente la clase grep-vs-property: F15/F16/F20-F23).
2. **#209 (Release policy)** está CLOSED — referencia ya eliminada de este documento.
3. **#177** CLOSED 2026-09-13 — absorbida en #171 (triage previo ya lo indicaba).
4. **#45** tiene branch `feat/45` pero requiere redesign post #43-declined. No empezar antes.
5. **#192** es experimental + guardrails del índice (2026-09-13): cache, nunca fuente de verdad; FTS5 vía `node:sqlite` (built-in, verificado Node 24); vectores = tier opt-in futuro (proveedor enchufable, model+version por fila, reindex determinista). Engram = capa de memoria de sesión, no fuente de compuerta.
6. **#215 → feat 48** es infraestructura nueva de alto valor (mejora todos los `→ Next:`); **absorbe #216/feat 49** como stage experimental (journeys canary, generalize-or-close).
7. **#218** es producer family: su implementación **crea el JS crate** (vehicle rule de #43-declined) — punto de anclaje para la futura incorporación del runner `@gtrabanco/agentic-workflow` / `-loop`. Fila de roadmap pendiente de `plan-feature-scaffold` (próximo número libre: 50; #219/#220 siguen).
8. **Consolidación 2026-09-13**: cerradas por absorción #177→#171, #186→#174, #207→#206, #216→#215; creadas #218/#219/#220; filas 39/47/49 marcadas `folded → 41/46/48` (números conservados, nunca reutilizados). Issues abiertas: 22 → 21 (4 cierres + 3 altas).
9. **Feature 37 (PR #212)**: close-out completo, gate verde (298/298 + 185/185 + bundle) — merge es la primera acción del plan.

---

*Documento regenerado el 2026-09-13 tras la consolidación owner-approved (estudio open-code-review → mecanismos; absorciones para minimizar issues abiertas sin perder alcance).*
