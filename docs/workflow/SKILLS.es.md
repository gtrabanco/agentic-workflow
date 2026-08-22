# Referencia del sistema de skills

> 🇬🇧 [English version](SKILLS.md)

Las skills que componen el flujo de trabajo agéntico, agrupadas por rol.

**18 skills orientadas al usuario** (una entrada de menú cada una) + **15 pasos
internos** compuestos por ti (los dos pasos de planificación del router
`plan-feature`, el motor de hallazgos `review-implementation` de
`review-change`, la puerta de planificación `planning-preflight`, el contrato
de lint `phase-contract`, el guardián de aceptación `verification-contract`, el
paquete de revisión interno de 9 skills del propio flujo de trabajo: `review-code`,
`review-security`, `review-verify`, `review-debt`, `review-design`,
`review-a11y`, `review-brand`, `review-perf`, `review-seo`), más **1
metadata-internal** no descubrible por la CLI `skills` (`orchestration-envelope`;
leva `metadata.internal: true` en el frontmatter, lo que la CLI respeta para
excluirlo del descubrimiento `npx skills add`). La skill `bump-skill` es una
herramienta de mantenimiento del repo (no es skill del workflow) y no aparece
en este índice. Las 18 skills orientadas al usuario cubren configuración,
descubrimiento/resolución de estado del repositorio, diseño, planificación,
ejecución, review, auditoría, fold de hallazgos, generación de docs, triage de
issues, envío del roadmap, diario de sesión y estado del workflow.

## Presupuesto de contexto y carga progresiva

Los metadatos de las skills siempre se anuncian al agente, pero el cuerpo de
`SKILL.md` solo entra en contexto tras la activación. El checker de contexto
descubre cada entrypoint `skills/*/SKILL.md` y aplica un único presupuesto por
defecto; los overrides se limitan a los metadatos de descripción. Las entrypoints segmentadas
conservan en `SKILL.md` los gates universales y una ruta explícita, y cargan el
detalle de `references/` solo cuando esa ruta lo necesita. Las referencias están
a un salto y no pueden enlazar más referencias, para que los modelos pequeños
no tengan que descubrir una cadena oculta de instrucciones.

El presupuesto versionado usa `ceil(bytes UTF-8 / 4)` como estimación
determinista, no como tokens facturados por el proveedor. Todos los entrypoints
principales tienen un límite de 2.800 tokens estimados y 240 líneas, sin
excepciones de tamaño. Los nueve entrypoints refactorizados en la segunda pasada
de carga progresiva bajaron de 30.868 a 16.046 tokens estimados combinados,
conservando sus contratos tras rutas explícitas. Valida el catálogo con:

```sh
node scripts/check-skill-context.mjs
```

La caché de prompts puede reducir latencia repetida o input facturado en un
proveedor compatible, pero no reduce el contexto activo. La corrección y la
capacidad de contexto dependen por tanto de la segmentación, no de la caché. Ver
[`SKILL_CONTEXT_BUDGETS.json`](SKILL_CONTEXT_BUDGETS.json) para los límites
aplicados.

## Configuración

| Skill | Rol | Entrega a |
|---|---|---|
| `init-workspace` | Obtiene y adapta el andamiaje; siembra contratos del repositorio; ofrece explícitamente el adaptador de seguridad detectado para Claude/Cursor/Copilot/OpenCode sin sobrescribir hooks | `discover-repository-state` |
| `discover-repository-state` | Crea un ledger congelado y respaldado por evidencia; separa hechos, decisiones, trabajo planificado, documentación e inferencia | `plan-feature` / `resolve-repository-state` |
| `resolve-repository-state` | Único escritor que resuelve una contradicción explícita y publica el siguiente snapshot congelado | el paso de flujo interrumpido |

## Diseño

| Skill | Rol | Entrega a |
|---|---|---|
| `design-feature` | **Definición de producto.** Incorpora la entrevista de idea-en-bruto (una pregunta por turno, rúbrica de vaguedad fija de seis huecos, ≥ 3 huecos vacíos → `NEEDS_INPUT`), ejecuta investigación proporcional, y recorre las checklists de **cierre de capacidades** — **cierre de entidades** (por entidad → CRUD + transiciones de estado + UI + API + test o `n/a` explícito), **cierre de integración** (una fila resuelta por subsistema del inventario de capacidades del proyecto, `docs/CAPABILITIES.md` — auth, ACL, navegación, notificaciones, …) y la **matriz de roles** (cada rol del inventario explícitamente permitido/denegado por capacidad) — hasta convertirlas en criterios de aceptación exhaustivos, más el **barrido de expectativas** (≥ 10 expectativas implícitas del dominio, cada una forzada a in-scope/out-of-scope/deferred). Escribe la **mitad de producto** del SPEC y sella `## Design status: designed` solo cuando todas las **casillas de producto del Spec-lint** de la plantilla (comprobaciones mecánicas de presencia) marcan. Hace upsert al reejecutarse; nunca destruye decisiones registradas | `plan-feature <slug>` |

## Planificación

| Skill | Rol | Entrega a |
|---|---|---|
| `plan-feature` | **Router, solo planificación de ingeniería.** Dada una feature sin diseñar (sin `## Design status: designed`), **SE DETIENE y redirige** a `/design-feature <slug>` (sin flag de bypass). Dada una feature/issue diseñada `#N` (issue → mitad de producto acotada → `design-feature` para issues escuetos), enruta a rellenar la **mitad de ingeniería**, **dimensiona la feature** (`XS/S/M/L`), y luego registra la entrada del roadmap | `execute-phase <NN>` (todas las fases restantes) o `execute-phase <NN> P1` (una fase explícita) |
| `plan-fix` | Redacta una unidad de fix desde un issue o un conjunto compatible. La agrupación acepta un bloque de capacidad o un lote mecánico homogéneo cuando el conjunto tiene un resultado, plan de verificación y rollback atómico; no exige compartir ficheros, causa raíz ni severidad | `execute-phase --fix <n>` (todas las fases restantes) |

### Pasos internos (ocultos del menú; compuestos por ti)

| Skill | Rol |
|---|---|
| `plan-feature-from-issue` | Issue de solicitud de feature → mitad de producto del SPEC acotada (satisface el cierre de capacidades), con `Closes #N` (invocado por `plan-feature`) |
| `plan-feature-scaffold` | Rellena la **mitad de ingeniería** del SPEC + artefactos de planificación **escalados al tamaño de la feature** (XS/S → solo SPEC; M/L → conjunto completo terminando en una fase de hardening obligatoria); registra en el roadmap (solo docs) (invocado por `plan-feature`) |
| `review-implementation` | Motor de clasificación sobre tabla sintetizada (fix-now / replan-in-unit / decision-required / proposal); solo hallazgos, sin refactorizar. `user-invocable: false` — el motor que compone `review-change` (y que reutilizan `audit-pr` / `product-audit`) |
| `orchestration-envelope` | Contratos de resultado máquina propiedad del paquete (Envelope v2 estricto, SkillOutcome v1 compacto, parseo de compatibilidad y snapshots deterministas) para skills worker/sensor invocadas por drivers. `user-invocable: false` — `ship-roadmap` sigue siendo un conductor con banner nativo |
| `verification-contract` | Congela la aceptación antes de implementar, define niveles de validación y liga la evidencia al blob de aceptación y al recibo de código actuales. `user-invocable: false` — lo componen planificadores, ejecutores y revisores |
| `review-code` | Checklist de corrección + reutilización/simplificación/eficiencia sobre el diff. `user-invocable: false` — un eje del paquete de revisión interno de `review-change` |
| `review-security` | Checklist de seguridad con forma OWASP sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-verify` | Checklist de verificación de comportamiento en tiempo de ejecución (¿el cambio realmente hace lo que promete?). `user-invocable: false` — paquete de revisión interno |
| `review-debt` | Transformación de deuda técnica sobre tabla clasificada (no reescanea el diff). `user-invocable: false` — paquete de revisión interno |
| `review-design` | Checklist de consistencia arquitectónica/de capas sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-a11y` | Checklist de accesibilidad sobre cambios de UI. `user-invocable: false` — paquete de revisión interno |
| `review-brand` | Checklist de consistencia de marca/voz sobre el texto de cara al usuario. `user-invocable: false` — paquete de revisión interno |
| `review-perf` | Checklist de regresión de rendimiento sobre el diff. `user-invocable: false` — paquete de revisión interno |
| `review-seo` | Checklist de SEO sobre páginas/rutas públicas. `user-invocable: false` — paquete de revisión interno |

## Ejecución

| Skill | Rol |
|---|---|
| `execute-phase` | Con solo una feature o fix, ejecuta **todas las fases restantes** mediante un loop acotado de unidad; un `P<k>` explícito sigue siendo atómico. Cada fase recibe un contexto de worker limpio y un recibo compacto, implementación tests-first, tres intentos de reparación por defecto, detección de falta de progreso y ninguna ceremonia de review intermedia. La aceptación se congela antes del código. Los hallazgos dentro de la unidad se arreglan ahí; los ajenos quedan como propuestas y nunca crean issues automáticamente. Una unidad terminada abre su PR y pasa a `done` |

## Review & audit — *cambio → PR → producto*

| Skill | Alcance | Rol | Entrega a |
|---|---|---|---|
| `review-change` | el **cambio** | Ejecuta las revisiones aisladas aplicables, verifica el blob de aceptación congelado contra el recibo de código actual, mapea criterios a evidencia del diff, clasifica una vez y persiste un veredicto ligado al SHA. **Obligatorio antes del merge** | `loop-review-fold` (recomendado si falla) / `fold-findings` manual |
| `fold-findings` | el **ledger de hallazgos** | Repara la cola seleccionada en lotes atómicos compatibles. Cada hallazgo conserva un veredicto y evidencia individuales; solo se agrupan miembros con una regla de corrección, validador y límite de rollback comunes | re-ejecutar `review-change` / presentar una disputa real al usuario |
| `loop-review-fold` | el **router review/fold** | Comprueba la evidencia persistida, ejecuta primero `fold-findings` cuando una `review-change` anterior dejó una cola abierta; si no, ejecuta `review-change` y vuelve a revisar tras un HEAD cambiado. Los hallazgos no resueltos pasan a `triage-issue --prioritize-now`, y el trabajo grande se replantea en nuevas fases manuales | `audit-pr` al aprobar / triaje del usuario y ejecución manual ante hallazgos no resueltos |
| `audit-pr` | el **PR** | Puerta de merge de solo lectura que **consume el recibo `REVIEW-PASS` vigente de `review-change`** (ausente/obsoleto → bloqueante enrutado a `/review-change`, nunca se re-revisa) → comentario MERGE-READY ligado al SHA o bloqueantes con evidencia; nunca edita ni fusiona. Solo un `ship-roadmap --fullauto` activo puede ejecutar un merge automatizado | `execute-phase` / `plan-fix` / `triage-issue` |
| `product-audit` | el **producto** | Chequeo de salud periódico de espectro completo; extrae de los docs de feature → propone issues + cambios de roadmap (nunca arregla automáticamente); recurrencia de exportación de alcance (≥ 2 unidades consecutivas exportando alcance → hallazgo de calidad de planificación enrutado a #64) | `triage-issue` / `plan-feature` / `plan-fix` |
| `audit-docs` | los **docs** | Audita docs ↔ roadmap ↔ código ↔ índice de fixes en busca de desviaciones | informe (+ arreglos opcionales de bajo riesgo) |

> El motor de hallazgos de `review-change` es el `review-implementation`
> interno (`user-invocable: false`) — el clasificador de la tabla sintetizada que
> compone, y que reutilizan `audit-pr` / `product-audit`. No es
> una entrada de menú; ver
> [Pasos internos](#pasos-internos-ocultos-del-menú-compuestos-por-ti).

## Decidir

| Skill | Rol | Entrega a |
|---|---|---|
| `triage-issue` | Clasifica fix-now / fix-in-unit / promote / postpone / wontfix; un chequeo de pertenencia de alcance (antes de clasificar) enruta un issue que ya pertenece a una unidad abierta a la propia rama de esa unidad; verifica disparadores contra el código real; acepta varios issues en un solo lote; `--prioritize-now` tría hallazgos de review no resueltos y lleva el trabajo grande a un plan con nuevas fases | `plan-fix`, `execute-phase`/`fold-findings` (fix-in-unit), `plan-feature`, o un comentario fechado |

## Documentar

| Skill | Rol | Entrega a |
|---|---|---|
| `generate-docs` | Convierte el diff de una unidad en docs de desarrollador en el propio sitio de docs del proyecto: guías how-to incrementales vía un adaptador descubierto (referencia Starlight MDX, fallback en markdown plano), un mapa de conocimiento/llamadas renderizado desde un comando determinista declarado por el proyecto (nunca inferido por el modelo), exportación opcional `--review` de informes de revisión. El frontmatter de procedencia (`generated-by`/`source-unit`) permite que `audit-docs` detecte páginas huérfanas/obsoletas | el commit de cierre de la unidad (las páginas viajan en el PR de la unidad); `audit-docs` para desviaciones |

## Autopiloto — el flujo completo, de extremo a extremo

| Skill | Rol | Entrega a |
|---|---|---|
| `ship-roadmap` | **Conductor.** Una entrevista inicial y un bucle de driver entregan el roadmap y el barrido de issues. Por defecto abre PRs y el humano fusiona. `--fullauto` es la única autoridad de merge automatizado y usa el wrapper transitorio fail-closed más un comentario idempotente de PR; los merges directos siguen bloqueados | el humano fusiona / lote de `triage-issue` / `product-audit` |

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
| `discover-repository-state` | `/discover-repository-state` | Lee la evidencia del repositorio y escribe un Estado Normalizado del Repositorio congelado; las contradicciones se enrutan a `/resolve-repository-state`. |
| `execute-phase` | `/execute-phase <NN> [P<k>] \| --fix <n> [P<k>] [--max-attempts N] \| [--force]` | Solo objetivo → ejecuta todas las fases restantes y cierra la unidad. `P<k>` explícito → ejecuta exactamente esa fase. `--max-attempts N` acota los intentos de reparación por fase (3 por defecto). `--force` es la excepción de dependencia/estado, solo del usuario y registrada. |
| `fold-findings` | `/fold-findings [finding-id …]` | Sin argumentos: repara toda la cola fix-now pendiente, agrupando solo correcciones compatibles. Los IDs restringen la cola. Cada miembro conserva su propio resultado `FOLDED \| DISPUTED \| BLOCKED`. |
| `generate-docs` | `/generate-docs [NN-slug \| fix-n \| path/glob] [--review]` | El alcance por defecto es el diff de la rama actual frente a la rama por defecto; un slug/fix/ruta lo acota o redirige. `--review` → además exporta el informe más reciente de `review-change` como una página de docs (opt-in, nunca automático). |
| `init-workspace` | `/init-workspace [target-dir]` | Por defecto el directorio actual. En un repositorio que ya tiene el andamiaje, cambia automáticamente al **modo actualización** (propone solo los bloques de plantilla nuevos/faltantes; solo aditivo). |
| `log-session` | `/log-session [note]` | La nota opcional se antepone al Resumen de la entrada. |
| `plan-feature` | `/plan-feature <NN-slug \| #N> \| --from-issue N \| --scaffold <slug> \| --next` | Un slug o referencia de issue se detecta automáticamente; los flags fuerzan una ruta: `--from-issue N` (issue → mitad de producto acotada), `--scaffold <slug>` (directo al andamiaje de la mitad de ingeniería), `--next` (siguiente entrada del roadmap). Una feature sin diseñar (fila del roadmap por debajo de `defined`) → se detiene y redirige a `/design-feature` — sin flag de bypass. |
| `loop-review-fold` | `/loop-review-fold <NN> \| --fix <n>` | Ejecuta el router simple review/fold. Elige review o fold según la evidencia persistida y lleva los hallazgos no resueltos a `/triage-issue --prioritize-now`; el trabajo grande se convierte en fases `P<n>` que el usuario ejecuta manualmente. |
| `plan-fix` | `/plan-fix <issue-number> [<issue-number> …]` | Un issue → una unidad de fix. Varios issues → un bloque de capacidad compatible o un lote mecánico homogéneo cuando todo el conjunto comparte resultado, plan de verificación y release/rollback atómico. Si el conjunto falla, devuelve el mínimo número de grupos compatibles máximos en vez de separar por reflejo un PR por issue. |
| `product-audit` | `/product-audit [path-or-area]` | Solo por invocación explícita. Por defecto, el producto entero; una ruta/área acota el barrido. Solo propone — nunca arregla. |
| `resolve-repository-state` | `/resolve-repository-state <contradiction-id>` | Verifica ambas fuentes de evidencia y publica el siguiente snapshot congelado, o se detiene con el input faltante explícito. |
| `review-change` | `/review-change [path-or-glob] [--adversarial N]` | Por defecto, el cambio actual (diff de la rama frente a la rama por defecto); una ruta amplía/acota. `--adversarial N` → N revisores adversariales independientes, de contexto limpio, solo-diff, en paralelo, hallazgos fusionados y deduplicados (opt-in; auto-recomendado para cambios `L`/sensibles). |
| `ship-roadmap` | `/ship-roadmap [--fullauto]` · `/ship-roadmap --continue [--fullauto]` | Por defecto abre PRs y el humano fusiona. `--fullauto` debe estar presente en cada iteración y usa el wrapper del repositorio tras un veredicto MERGE-READY fresco. `--continue` reanuda una etapa. |
| `triage-issue` | `/triage-issue <n> [n…] \| --prioritize-now <unit> F<k> [F<j>…]` | Los lotes de issues producen veredictos independientes más una tabla resumen; el modo de hallazgos intenta arreglar ahora cada hallazgo no resuelto y lleva el trabajo grande a `plan-feature`/`plan-fix` más nuevas fases manuales. |
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
ISSUE(feature) ────┤  #N / --from-issue → plan-feature-from-issue                      ├─▶ execute-phase (todas las fases) ─▶ open PR (`done`) ─▶ loop-review-fold ─▶ audit-pr ─▶ merge
ROADMAP --next ────┘  registers the roadmap entry, prints the next step                │
                       (undesigned input → STOP, redirect to /design-feature, no bypass)

ISSUE(any) ─▶ triage-issue ─┬─ fix-now ─▶ plan-fix (lote compatible) ─▶ execute-phase --fix ─▶ open PR (`done`) ─▶ loop-review-fold ─▶ audit-pr ─▶ merge
                            ├─ fix-in-unit ─▶ execute-phase <NN> P<k> / fold-findings (ledger row) / replan on the open unit
                            ├─ promote ─▶ plan-feature (router → from-issue) ─▶ (feature chain above)
                            ├─ postpone ─▶ dated comment, leave open
                            └─ wontfix ─▶ propose close

loop-review-fold ── selección por estado persistido → review-change ↔ fold-findings;
                    hallazgos no resueltos → triage-issue → replan + fases manuales;
review-change ── runs the applicable read-only reviews + classifies a change;
                 composes review-implementation + the platform's companion skills;
                 fix-now ─▶ se incorpora a la fase abierta · replan-in-unit ─▶ nuevas fases confirmadas por el usuario
                 decision-required ─▶ presentar, bloquear · proposals ─▶ el usuario las enruta a triage-issue
audit-pr ─────── PR-level merge gate (merge-ready or blockers)
product-audit ── periodic product-wide sweep → proposes issues + roadmap changes
audit-docs ───── audits docs ↔ roadmap ↔ code ↔ fix index, anytime

ship-roadmap ─── AUTOPILOT around the whole feature chain: interview → founding →
                 roadmap → /loop { plan-feature → execute-phase (fresh cheap workers)
                 → PR → loop-review-fold → audit-pr → merge } → final report;
                 human at the merges (default) and at product-audit (always)
```

## Reglas de diseño que sigue cada skill

1. **Descubrir primero.** Leer la guía del agente, el mapa de documentación,
   la arquitectura, el roadmap, y los docs de dominio/estilo relevantes antes
   de actuar. Adaptarse al proyecto.
2. **Respetar arquitectura y estilo.** Reglas de capas, reglas de
   dominio/i18n/SEO/a11y, límites de runtime/plataforma, convenciones de
   nombres — todo respetado, nunca eludido.
3. **Planificar antes de programar; aislar los contextos de fase; un PR por
   unidad contra la rama por defecto; nunca `main`, nunca apilado.**
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
