# Referencia del sistema de skills

> 🇬🇧 [English version](SKILLS.md)

Las skills que componen el flujo de trabajo agéntico, agrupadas por rol.

**15 skills orientadas al usuario** (una entrada de menú cada una) + **14 pasos
internos** compuestos por ti (los dos pasos de planificación del router
`plan-feature`, el motor de hallazgos `review-implementation` de
`review-change`, el contrato `orchestration-envelope`, el paquete de revisión
interno de 9 skills del propio flujo de trabajo: `review-code`,
`review-security`, `review-verify`, `review-debt`, `review-design`,
`review-a11y`, `review-brand`, `review-perf`, `review-seo`, y el ayudante de
mantenimiento `bump-skill` propio del repositorio). De las 15: 12 skills del
flujo de trabajo principal, `fold-findings` (ciclo de reparación de hallazgos
fix-now), un ayudante de diario `log-session`, y un sensor de solo lectura
`workflow-status`.

## Configuración

| Skill | Rol | Entrega a |
|---|---|---|
| `init-workspace` | Obtiene el andamiaje de `template/` y lo adapta al proyecto mediante entrevista; sugiere las skills de revisión complementarias de la plataforma; ofrece instalar las skills | `design-feature` |

## Diseño

| Skill | Rol | Entrega a |
|---|---|---|
| `design-feature` | **Definición de producto.** Incorpora la entrevista de idea-en-bruto (una pregunta por turno, rúbrica de vaguedad fija de seis huecos, ≥ 3 huecos vacíos → `NEEDS_INPUT`), ejecuta investigación proporcional, y recorre las checklists de **cierre de capacidades** — **cierre de entidades** (por entidad → CRUD + transiciones de estado + UI + API + test o `n/a` explícito), **cierre de integración** (una fila resuelta por subsistema del inventario de capacidades del proyecto, `docs/CAPABILITIES.md` — auth, ACL, navegación, notificaciones, …) y la **matriz de roles** (cada rol del inventario explícitamente permitido/denegado por capacidad) — hasta convertirlas en criterios de aceptación exhaustivos, más el **barrido de expectativas** (≥ 10 expectativas implícitas del dominio, cada una forzada a in-scope/out-of-scope/deferred). Escribe la **mitad de producto** del SPEC y sella `## Design status: designed` solo cuando todas las **casillas de producto del Spec-lint** de la plantilla (comprobaciones mecánicas de presencia) marcan. Hace upsert al reejecutarse; nunca destruye decisiones registradas | `plan-feature <slug>` |

## Planificación

| Skill | Rol | Entrega a |
|---|---|---|
| `plan-feature` | **Router, solo planificación de ingeniería.** Dada una feature sin diseñar (sin `## Design status: designed`), **SE DETIENE y redirige** a `/design-feature <slug>` (sin flag de bypass). Dada una feature/issue diseñada `#N` (issue → mitad de producto acotada → `design-feature` para issues escuetos), enruta a rellenar la **mitad de ingeniería**, **dimensiona la feature** (`XS/S/M/L`), y luego registra la entrada del roadmap | `execute-phase <NN> P1` (M/L y XS/S por igual — las fases XS/S viven en el SPEC) |
| `plan-fix` | Redacta como arquitecto un SPEC de fix estrechamente acotado a partir de un issue; confirma en una rama de fix; se detiene para revisión | `execute-phase --fix` |

### Pasos internos (ocultos del menú; compuestos por ti)

| Skill | Rol |
|---|---|
| `plan-feature-from-issue` | Issue de solicitud de feature → mitad de producto del SPEC acotada (satisface el cierre de capacidades), con `Closes #N` (invocado por `plan-feature`) |
| `plan-feature-scaffold` | Rellena la **mitad de ingeniería** del SPEC + artefactos de planificación **escalados al tamaño de la feature** (XS/S → solo SPEC; M/L → conjunto completo terminando en una fase de hardening obligatoria); registra en el roadmap (solo docs) (invocado por `plan-feature`) |
| `review-implementation` | Encontrar → clasificar → tabla de decisión en dos fases (fix-now / postpone / ignore / intentional-tradeoff); solo hallazgos, sin refactorizar. `user-invocable: false` — el motor que compone `review-change` (y que reutilizan `audit-pr` / `product-audit`) |
| `orchestration-envelope` | El contrato del sobre-máquina: fragmento canónico de system-prompt inyectado por el driver, bucle de reparación, y esquema JSON. `user-invocable: false` — la pieza que inyecta un driver externo, no una entrada de menú |
| `review-code` | Checklist de corrección + reutilización/simplificación/eficiencia sobre el diff. `user-invocable: false` — un eje del paquete de revisión interno de `review-change` |
| `review-security` | Checklist de seguridad con forma OWASP sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-verify` | Checklist de verificación de comportamiento en tiempo de ejecución (¿el cambio realmente hace lo que promete?). `user-invocable: false` — paquete de revisión interno |
| `review-debt` | Checklist de deuda técnica / TODO / código muerto sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-design` | Checklist de consistencia arquitectónica/de capas sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-a11y` | Checklist de accesibilidad sobre cambios de UI. `user-invocable: false` — paquete de revisión interno |
| `review-brand` | Checklist de consistencia de marca/voz sobre el texto de cara al usuario. `user-invocable: false` — paquete de revisión interno |
| `review-perf` | Checklist de regresión de rendimiento sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-seo` | Checklist de SEO sobre páginas/rutas públicas. `user-invocable: false` — paquete de revisión interno |

## Ejecución

| Skill | Rol |
|---|---|
| `execute-phase` | Ejecuta una fase de feature (por defecto), una feature `XS/S` pequeña en un solo pase, o un fix (`--fix`); **tests primero** en trabajo de dominio/orquestación, nunca confirma en rojo, en P1 confirma los artefactos de planificación por separado; **conversación nueva por fase bajo un presupuesto de contexto explícito** (≤ 10 lecturas de fichero completo), con handoff mediante el esquema fijo de entradas `Done / Remains / Gotchas / Files / Next` de `progress.md`; seguridad de rama + disciplina de docs por fase + puerta; **guardia de descope** (todo issue creado se clasifica trabajo-descubierto vs. descope — un descope PARA hasta que exista una entrada `## Amendments` fechada y aprobada por el usuario); **recomienda un checkpoint de `review-change` según disparadores — límite de capa, acumulación o sensibilidad (se puede saltar) — y entrega el control una vez al final (obligatorio)**; una unidad terminada **siempre abre su PR y pasa a `done`** (construida, no fusionada) |

## Review & audit — *cambio → PR → producto*

| Skill | Alcance | Rol | Entrega a |
|---|---|---|---|
| `review-change` | el **cambio** | Ejecuta solo las revisiones que aplican a esta plataforma — **cada pasada aislada por defecto** (contexto limpio, devuelve solo su tabla de hallazgos; el orquestador retiene tablas, nunca fuentes) — + una **comprobación estructural de desviación del SPEC** (tabla de cobertura por criterio + mapeo de hunks del diff) + clasifica → una tabla de decisión + checklist de verificación manual; **obligatorio antes de cada merge** | `plan-fix` (fix-now) / `triage-issue` (cada hallazgo no-fix-now: postpone / ignore / intentional-tradeoff) |
| `fold-findings` | el **ledger de hallazgos** | Repara de verdad, uno por uno, cada hallazgo fix-now de `review-change`/`audit-pr` — clasificación congelada (nunca reclasifica), una lista de prohibiciones fija cierra las válvulas de escape (volcado a known-issues, downgrade, aflojar tests, supresión); veredicto por hallazgo `FOLDED \| DISPUTED \| BLOCKED` | re-ejecutar `review-change` (todo foldeado) / `triage-issue` (disputado) |
| `audit-pr` | el **PR** | Puerta de merge: aceptación, fases, docs, tests, CI, `Closes #N`, ejes de revisión, integridad de cierre (solo SPECs de feature; legacy → warning datado, nunca bloqueante), integridad de alcance (descope: un issue nacido durante la unidad que solapa un criterio/tarea incumplido necesita una entrada `## Amendments` correspondiente, si no BLOQUEANTE; aplica a PRs de feature y de fix) → merge-ready o bloqueadores | `execute-phase` / `plan-fix` / `triage-issue` |
| `product-audit` | el **producto** | Chequeo de salud periódico de espectro completo; extrae de los docs de feature → propone issues + cambios de roadmap (nunca arregla automáticamente); recurrencia de exportación de alcance (≥ 2 unidades consecutivas exportando alcance → hallazgo de calidad de planificación enrutado a #64) | `triage-issue` / `plan-feature` / `plan-fix` |
| `audit-docs` | los **docs** | Audita docs ↔ roadmap ↔ código ↔ índice de fixes en busca de desviaciones | informe (+ arreglos opcionales de bajo riesgo) |

> El motor de hallazgos de `review-change` es el `review-implementation`
> interno (`user-invocable: false`) — el pase de dos fases encontrar →
> clasificar que compone, y que reutilizan `audit-pr` / `product-audit`. No es
> una entrada de menú; ver
> [Pasos internos](#pasos-internos-ocultos-del-menú-compuestos-por-ti).

## Decidir

| Skill | Rol | Entrega a |
|---|---|---|
| `triage-issue` | Clasifica fix-now / fix-in-unit / promote / postpone / wontfix; un chequeo de pertenencia de alcance (antes de clasificar) enruta un issue que ya pertenece a una unidad abierta a la propia rama de esa unidad; verifica disparadores contra el código real; acepta varios issues en un solo lote | `plan-fix`, `execute-phase`/`fold-findings` (fix-in-unit), `plan-feature`, o un comentario fechado |

## Documentar

| Skill | Rol | Entrega a |
|---|---|---|
| `generate-docs` | Convierte el diff de una unidad en docs de desarrollador en el propio sitio de docs del proyecto: guías how-to incrementales vía un adaptador descubierto (referencia Starlight MDX, fallback en markdown plano), un mapa de conocimiento/llamadas renderizado desde un comando determinista declarado por el proyecto (nunca inferido por el modelo), exportación opcional `--review` de informes de revisión. El frontmatter de procedencia (`generated-by`/`source-unit`) permite que `audit-docs` detecte páginas huérfanas/obsoletas | el commit de cierre de la unidad (las páginas viajan en el PR de la unidad); `audit-docs` para desviaciones |

## Autopiloto — el flujo completo, de extremo a extremo

| Skill | Rol | Entrega a |
|---|---|---|
| `ship-roadmap` | **Conductor.** Una entrevista inicial (producto, features, stack, arquitectura, calidad, operaciones, autonomía, presupuesto) → funda el proyecto si hace falta → crea o adopta el roadmap completo → un bucle impulsado por `/loop` lo despliega feature por feature: compone `plan-feature`, `review-change`, `audit-pr` en el mismo turno (mismo nivel), delega cada fase de `execute-phase` a un subagente Sonnet. Por defecto: abre PRs, el humano fusiona; `--fullauto` fusiona bajo pisos de seguridad no negociables. Termina en un informe final | el humano fusiona / lote de `triage-issue` / `product-audit` (siempre una entrega — su effort máximo supera el high del conductor) |

## Sesión

| Skill | Rol | Entrega a |
|---|---|---|
| `log-session` | Añade una entrada estructurada a `docs/LOGS.md` — resumen, archivos, decisiones + *por qué*, siguiente paso — para que un lector nuevo (o la siguiente sesión) retome sin releer el git. Manual y rica; `model: sonnet` (barato). Se complementa con hooks gratuitos y opt-in de `template/.claude/` que añaden automáticamente una entrada mecánica al hacer `/clear`/salir y pueden reinyectar la última entrada al iniciar | `/clear` (sesión capturada) o el comando de reanudación en la línea **Next** de la entrada |
| `workflow-status` | **Sensor de solo lectura para orquestación programática.** Calcula el estado completo del proyecto — cada feature/fix con su cierre transitivo de dependencias (cumplido/no cumplido), la máquina de cinco estados del roadmap, qué se puede iniciar ahora mismo y en qué orden de construcción, PRs abiertos + estado de auditoría, fixes pendientes y hallazgos a la espera de triage — y lo emite como un único sobre-máquina JSON fijo. La pieza que un driver externo llama entre pasos. Nunca edita nada | la siguiente invocación del driver (nunca entrega el control a otra skill por sí mismo) |

## Mantenimiento del repositorio (específico del repositorio agentic-workflow)

| Skill | Rol |
|---|---|
| `bump-skill` | Tras editar un SKILL.md: sube `version:`, añade filas a CHANGELOG.md + CHANGELOG.es.md, actualiza las tablas de skills/modelos del README. Solo para este repositorio — su descripción evita que se dispare en otros proyectos |

## Referencia de invocación y argumentos

Las formas de invocación de cada skill orientada al usuario y qué hace cada
argumento/flag — el espejo legible para humanos del frontmatter
`argument-hint` de cada skill. Corchetes `[…]` = opcional; `|` separa formas
alternativas. Una skill invocada sin argumentos usa el valor por defecto
indicado aquí.

| Skill | Invocación | Argumentos y flags |
|---|---|---|
| `audit-docs` | `/audit-docs [--fix]` | Sin args: solo informe, hallazgos ordenados por severidad. `--fix`: además aplica los arreglos de **bajo riesgo** — los docs nunca se reescriben sin ello (o una confirmación explícita del usuario). |
| `audit-pr` | `/audit-pr [pr-number]` | Por defecto, el PR de la rama actual. Un número apunta a otro PR. |
| `design-feature` | `/design-feature <idea \| NN-slug> [instruction]` | Una idea en bruto → entrevista desde cero. Un `NN-slug` existente a secas → **modo revisión**: imprime un resumen de lo que hará la feature y pregunta qué añadir/quitar/cambiar. `NN-slug + instrucción` → aplica el cambio directamente, sin preguntas, acotado a la instrucción. Siempre upsert — el único reinicio desde cero es una instrucción explícita de "borrar y rediseñar". |
| `execute-phase` | `/execute-phase <NN> [P<k>] \| --fix <n> [P<k>] \| [--force]` | `NN` solo → pase único (features `XS/S` solo-SPEC). `NN P<k>` → exactamente una fase de una feature M/L. `--fix <n>` → implementa la unidad de fix `docs/fix/<n>-*`. `--force` → invalida la puerta de dependencias/estado (válvula de escape solo para el usuario; la invalidación se registra en `decisions.md`; el autopiloto nunca la pasa). |
| `fold-findings` | `/fold-findings [finding-id …]` | Sin argumentos: repara, uno por uno, cada fila fix-now (`folded: no`) del ledger `review-findings.md` de la unidad. Uno o más IDs de hallazgo → acota la cola a exactamente esas filas. |
| `generate-docs` | `/generate-docs [NN-slug \| fix-n \| path/glob] [--review]` | El alcance por defecto es el diff de la rama actual frente a la rama por defecto; un slug/fix/ruta lo acota o redirige. `--review` → además exporta el informe más reciente de `review-change` como una página de docs (opt-in, nunca automático). |
| `init-workspace` | `/init-workspace [target-dir]` | Por defecto el directorio actual. En un repositorio que ya tiene el andamiaje, cambia automáticamente al **modo actualización** (propone solo los bloques de plantilla nuevos/faltantes; solo aditivo). |
| `log-session` | `/log-session [note]` | La nota opcional se antepone al Resumen de la entrada. |
| `plan-feature` | `/plan-feature <NN-slug \| #N> \| --from-issue N \| --scaffold <slug> \| --next` | Un slug o referencia de issue se detecta automáticamente; los flags fuerzan una ruta: `--from-issue N` (issue → mitad de producto acotada), `--scaffold <slug>` (directo al andamiaje de la mitad de ingeniería), `--next` (siguiente entrada del roadmap). Una feature sin diseñar (fila del roadmap por debajo de `defined`) → se detiene y redirige a `/design-feature` — sin flag de bypass. |
| `plan-fix` | `/plan-fix <issue-number> [<issue-number> …]` | Obligatorio, uno o más. Un número → redacta `docs/fix/<n>-<topic>/SPEC.md` en una rama de fix y se detiene para revisión. Varios números → una checklist fija de causa-raíz-compartida decide: si todas se cumplen, los fusiona en UNA unidad con clave el número más bajo; si alguna falla, se niega e imprime la división (`/plan-fix <a>`, `/plan-fix <b>` …). |
| `product-audit` | `/product-audit [path-or-area]` | Por defecto, el producto entero; una ruta/área acota el barrido. Solo propone — nunca arregla. |
| `review-change` | `/review-change [path-or-glob] [--adversarial N]` | Por defecto, el cambio actual (diff de la rama frente a la rama por defecto); una ruta amplía/acota. `--adversarial N` → N revisores adversariales independientes, de contexto limpio, solo-diff, en paralelo, hallazgos fusionados y deduplicados (opt-in; auto-recomendado para cambios `L`/sensibles). |
| `ship-roadmap` | `/ship-roadmap [--fullauto]` · `/ship-roadmap --continue [--fullauto]` | Por defecto: abre PRs, el humano fusiona. `--fullauto` → fusiona PRs MERGE-READY bajo los pisos de seguridad no negociables. `--continue` → reanuda una ejecución existente por una etapa (el bucle del driver externo reinvoca esto). |
| `triage-issue` | `/triage-issue <n> [n…]` | Uno o varios números de issue — las ejecuciones en lote producen veredictos independientes más una tabla resumen, agrupada por unidad de origen para los veredictos `fix-in-unit`. |
| `workflow-status` | `/workflow-status [--json-only] [--last-envelope <json\|path>]` | Por defecto: resumen humano + el sobre-máquina. `--json-only` → solo el sobre (modo driver). `--last-envelope` → el sobre persistido del driver como **pista** de recuperación ante caídas (comparado contra el estado recalculado; nunca autoritativo). ¿Tu agente no pasa argumentos? Pega el JSON en el mensaje — se lee el último bloque json entre comillas de la *solicitud* como la pista. |

## Compañeras integradas (Claude Code)

`/code-review` (corrección + simplificación), `/security-review` (pase de
seguridad), `/verify` (ejecutar la app, confirmar comportamiento) —
compuestas por `review-change` cuando aplican al cambio.

## Guardarraíles de dominio (por proyecto — no incluidas)

Las skills de guardarraíl de stack/dominio se cargan automáticamente durante
la ejecución pero son **específicas del proyecto**, así que viven en cada
repositorio destino en lugar de aquí — p. ej. una skill de patrón de
arquitectura, una skill de reglas de dominio, y skills de stack (framework,
ORM, runtime, plataforma). Ver `RECOMMENDED_SKILLS.md`.

## Cómo se combinan

```
IDEA / undesigned SPEC ─▶ design-feature (product half + capability closure)
                          → `## Design status: designed` ─┐
                   ┌──────────────── plan-feature (router, engineering-planning only) ─┐
DESIGNED slug/SPEC ┤  --scaffold → plan-feature-scaffold (engineering half)            │
ISSUE(feature) ────┤  #N / --from-issue → plan-feature-from-issue                      ├─▶ execute-phase ─▶ open PR (`done`) ─▶ review-change ─▶ audit-pr ─▶ merge
ROADMAP --next ────┘  registers the roadmap entry, prints the next step                │
                       (undesigned input → STOP, redirect to /design-feature, no bypass)

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ plan-fix ─▶ execute-phase --fix ─▶ open PR (`done`) ─▶ review-change ─▶ audit-pr ─▶ merge
                            ├─ fix-in-unit ─▶ execute-phase <NN> P<k> / fold-findings (ledger row) / replan on the open unit
                            ├─ promote ─▶ plan-feature (router → from-issue) ─▶ (feature chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

review-change ── runs the applicable reviews + classifies a change (Stage 4, mandatory);
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ plan-fix · every non-fix-now (postpone/ignore/tradeoff) ─▶ triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime

ship-roadmap ─── AUTOPILOT around the whole feature chain: interview → founding →
                 roadmap → /loop { plan-feature → execute-phase (sonnet subagents)
                 → review-change → PR → audit-pr → merge } → final report;
                 human at the merges (default) and at product-audit (always)
```

## Reglas de diseño que sigue cada skill

1. **Descubrir primero.** Leer la guía del agente, el mapa de documentación,
   la arquitectura, el roadmap, y los docs de dominio/estilo relevantes antes
   de actuar. Adaptarse al proyecto.
2. **Respetar arquitectura y estilo.** Reglas de capas, reglas de
   dominio/i18n/SEO/a11y, límites de runtime/plataforma, convenciones de
   nombres — todo respetado, nunca eludido.
3. **Planificar antes de programar; una fase a la vez; un PR por unidad
   contra la rama por defecto; nunca `main`, nunca apilado.**
4. **Evidencia sobre reflejo.** Verificar disparadores, citar rutas/recuentos.
5. **Rastrear, no implementar sobre la marcha, el trabajo diferido.**
   Mantener los issues y los docs coherentes e informados.
6. **Puerta antes del commit.** Chequeo de tipos + tests + build en verde.
7. **Disciplina de idioma en los docs.** Artefactos en el idioma de docs del
   proyecto (este repositorio: inglés), sin importar el idioma de la
   solicitud.

## Anatomía de una skill

Cada skill es una carpeta bajo `.claude/skills/<name>/` con un `SKILL.md`:

```
---
name: <kebab-case-name>
description: >
  One paragraph with concrete trigger phrases so the model knows when to load it.
---

# Title
## When to use
## Step 0 — Discover the project (always first)
## Process
## Guardrails
## Relationship to other skills
## Done when
```
