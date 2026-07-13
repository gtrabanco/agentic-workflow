# Flujo de trabajo de features (de extremo a extremo)

> 🇬🇧 [English version](FEATURE_WORKFLOW.md)

Desde una idea o un issue de solicitud de feature hasta un PR fusionado —
cada paso y la skill que lo impulsa. El ciclo de vida, según `CLAUDE.md`, es
el **pipeline de cinco etapas**:

```
design (design-feature) → plan (plan-feature) → execute (execute-phase)
  → review (review-change) → audit (audit-pr / product-audit)
```

Cada feature se transporta en **un único `SPEC.md`, escrito en dos mitades**:
`design-feature` escribe la **mitad de producto** (objetivo, contexto,
alcance, cierre de capacidades → criterios de aceptación, herramientas,
decisiones de producto) y sella `## Design status`; `plan-feature` se niega a
planificar una feature cuya mitad de producto no esté marcada como
`designed`, y luego escribe la **mitad de ingeniería** (impacto en la
arquitectura, diseño, fases, testing, escenarios de desarrollo, despliegue y
rollback, entregables). Ver `docs/features/_TEMPLATE/SPEC.md` para el
esquema exacto de secciones.

## Etapa 0 — Diseño (`design-feature`)

**Definición de producto y cierre de capacidades** — la etapa que convierte
una idea o una solicitud de feature en un conjunto exhaustivo y verificable
de criterios de aceptación, para que los modelos ejecutores no punteros no
omitan silenciosamente el trabajo implícito (p. ej. "auth con gestión de
dashboard y ACLs" no debe colapsar en una tabla de usuarios + una vista de
listado).

`design-feature <slug>`:

- Incorpora la entrevista de idea-en-bruto (problema y objetivo, alcance
  dentro/fuera, pistas de arquitectura, preocupaciones transversales) cuando
  se parte de cero.
- Ejecuta **investigación proporcional**: primero la checklist de cierre de
  capacidades (barata), investigación externa/de dominio solo cuando el
  dominio es nuevo para el proyecto — sin investigación de mercado
  sistemática por feature.
- Recorre la **checklist de cierre de capacidades**: para cada entidad
  introducida o tocada, CRUD + transiciones de estado, cada una con un punto
  de entrada de UI + superficie de API + test, o un `n/a: <razón>` explícito;
  para cada capacidad, su punto de entrada y quién puede ejecutarla; para
  cada rol/permiso, dónde se asigna, se revoca y se visualiza. Una fila en
  blanco hace fallar la puerta; las filas rellenadas se convierten en los
  criterios de Aceptación.
- Registra notas de herramientas por feature (skills/MCPs instaladas
  relevantes para *esta* feature — un barrido global es tarea de
  `product-audit`, no de esto).
- **Upserts**: volver a ejecutar sobre un slug existente relee el SPEC +
  `decisions.md` y nunca destruye decisiones registradas — las revisiones se
  añaden a `decisions.md`.
- **Regla de interacción**: `design-feature <slug>` a secas imprime un
  resumen y pregunta qué añadir/quitar/cambiar (modo revisión);
  `design-feature <slug> <instrucción>` aplica el cambio directamente, sin
  preguntas.
- Se reduce para features XS: la entrevista puede ser una única pregunta y la
  mayoría de las filas de cierre se resuelven como `n/a` — la puerta se
  mantiene uniforme, pero pasarla es barato.

Una vez que cada fila de cierre está rellenada o explícitamente marcada
`n/a`, `design-feature` fija `## Design status` en `designed` y entrega el
control a `/plan-feature <slug>`.

### La puerta de redirección

`plan-feature` basa su puerta en el marcador `## Design status` del SPEC: sin
`SPEC.md`, o el marcador ausente/distinto de `designed`, o la sección de
cierre de capacidades vacía → **STOP**, sin flag de bypass:

```
→ Next: /design-feature <slug> — this feature has no completed product design yet
  (capability closure not done). Design it first; then re-run /plan-feature <slug>.
```

Marcador `designed` y cierre presente → `plan-feature` procede a construir el
andamiaje de la mitad de ingeniería.

## Etapa 1 — Planificar: qué camino, luego SPEC + artefactos

**Un único punto de entrada** — `plan-feature` — detecta de dónde viene el
trabajo y enruta al paso interno correcto:

| Tienes… | Invoca | El router ejecuta | Resultado |
|---|---|---|---|
| Una feature sin diseñar (sin `SPEC.md`, o `## Design status` distinto de `designed`) | `plan-feature <slug>` | — | **STOP**, redirige a `/design-feature <slug>` (ver arriba) |
| Un issue de GitHub que solicita una feature | `plan-feature <N>` (o `--from-issue N`) | `plan-feature-from-issue` | Issue → mitad de producto del SPEC rellenada (satisface el cierre), con `Closes #N` |
| Una feature/SPEC ya diseñada (`## Design status: designed`) | `plan-feature <slug>` (o `--scaffold`) | `plan-feature-scaffold` | Mitad de ingeniería rellenada + andamiaje de artefactos |
| Nada — tomar el siguiente ítem del roadmap | `plan-feature --next` | toma la siguiente entrada `planned` | La construye (redirige primero a `design-feature` si no está diseñada) |

Todos los caminos **leen primero el proyecto** (guía del agente, mapa de
documentación, arquitectura, roadmap, docs de dominio/estilo) para que la
feature respete las restricciones reales del código base. Solo llamas a
`plan-feature`; los pasos internos de abajo se invocan por ti (nunca
aparecen en el menú). La entrevista de idea-en-bruto que antes ejecutaba
`plan-feature` ahora vive en `design-feature` (Etapa 0) — `plan-feature` es
solo planificación de ingeniería.

### El camino del issue — `plan-feature-from-issue`

Lee el issue, **confirma que realmente es una feature** (un bug/deuda
técnica se enruta a `triage-issue`), traduce al idioma de los docs si hace
falta, lo mapea al roadmap (número, slug, dependencias, conflictos), cierra
contigo los huecos de alcance, escribe la mitad de producto del SPEC
(satisfaciendo el cierre de capacidades — entregando issues escuetos a
`design-feature` cuando hace falta), y conecta `Closes #N` para el PR
eventual.

## Etapa 1b — Planificar: SPEC + artefactos (`plan-feature-scaffold`)

Una vez que la feature está diseñada (`## Design status: designed`), el
router ejecuta `plan-feature-scaffold`, que rellena la **mitad de
ingeniería** y escribe **solo docs** en `docs/features/<NN>-<slug>/`. **El
conjunto de artefactos escala según el `Size` del SPEC:**

- **XS/S** (≤ un commit / ≤ medio día) — `SPEC.md` es el **único** artefacto
  de planificación; sin ceremonia PLAN/TASKS, pero su sección `### Phases`
  lista **≥ 2 fases** (`P1` implementación, `P2 — Hardening & PR` = el
  cierre). Siguiente paso: `execute-phase <NN>` (ejecuta `P1`; una fase por
  invocación).
- **M/L** (trabajo por fases) — el conjunto completo:
  - `SPEC.md` — cada sección rellenada (objetivos, impacto en arquitectura,
    aceptación, rama, tamaño, dependencias, testing, escenarios de
    desarrollo).
  - `PLAN.md` — plan por fases cuya **última fase de implementación es
    siempre una fase de hardening** (casos límite + los modos de fallo de los
    escenarios de desarrollo del SPEC, implementados y probados — no solo
    documentados).
  - `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`,
    `decisions.md`, `architecture-notes.md` — reflejando el conjunto que usan
    las features recientes.
  - **L** también sugiere: considerar dividir en features independientemente
    entregables.

Luego **registra la feature en el roadmap** (numeración, orden,
dependencias). No crea la rama ni escribe código.

**`review-findings.md` — el ledger de fold fix-now (escrito durante la Etapa
4, no scaffoldeado por adelantado).** `review-change`/`audit-pr` crean
`docs/features/<NN>-<slug>/review-findings.md` la primera vez que un hallazgo
fix-now necesita foldearse — esquema fijo
`| id | file:line | axis | severity | class | route | folded |`, `folded`
empieza en `no`, deduplicado por `file:line`+axis, ambos escritores comparten
el mismo ledger. El ciclo de fold de `execute-phase` marca cada fila foldeada
`folded: yes`; `workflow-status` expone las filas sin foldear en
`findings.fix_now[]` del envelope máquina. Los fixes usan la ruta
equivalente, `docs/fix/<n>-<topic>/review-findings.md`.

> Las incógnitas se convierten en preguntas abiertas en `decisions.md` —
> nunca en placeholders en blanco.

## Etapa 2 — Ejecutar, una fase a la vez (`execute-phase`)

`execute-phase` (modo por defecto) implementa **una fase** por ejecución:

1. Verifica la rama — crea `feat/<NN>-<slug>` si estás en `main` (nunca
   trabaja sobre `main`). **En P1 primero confirma los artefactos de
   planificación por separado** (`docs(NN-slug): planning artifacts`), de
   modo que el historial de planificación quede aparte de la implementación.
2. Lee `progress.md` (qué hicieron las fases anteriores), luego `SPEC.md` +
   `TASKS.md` de la fase solicitada.
3. Implementa **solo esa fase** — **tests primero** en el trabajo de
   core/dominio y orquestación: los tests de aceptación/integración de la
   fase se escriben en rojo, y luego se implementa hasta verde (los
   escenarios de desarrollo del SPEC son la lista de tests). Sin agrupar
   fases, sin abstracción prematura, sin refactors no relacionados.
4. Ejecuta la puerta de verificación del proyecto (chequeo de tipos, tests,
   build). **Nunca confirma en rojo** — un fallo que no se puede arreglar
   dentro del alcance va a `known-issues.md` y la ejecución se detiene con un
   informe.
5. Actualiza `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` (y
   `decisions.md` si la arquitectura se movió). Cuando la realidad
   contradice el plan, se actualizan `TASKS.md`/`PLAN.md` y el porqué se
   registra en `decisions.md` — nunca una divergencia silenciosa.
6. Confirma (commit) en formato convencional — un commit por fase.
7. Se detiene para revisión (fases intermedias). **La fase final** (para
   XS/S, su `P2 — Hardening & PR`) en cambio **cambia la fila del roadmap a
   `done` y abre el PR** (nunca solo-rama) — ver Etapa 5 — luego el
   obligatorio `/review-change` → `/audit-pr`.

**Una fase = una sesión.** Nunca ejecutar dos fases en una sola conversación
con un modelo no puntero — los modelos se degradan en horizontes largos, y
una sesión nueva por fase es lo que preserva la garantía de ejecución barata
(la economía "el SPEC caro y cerrado compra ejecución barata ilimitada"). La
forma de lote de `/loop` ya limpia y reinvoca por fase; en un agente sin
`/loop`, reinvoca `execute-phase` a mano para cada fase en una conversación
nueva.

Repetir para cada fase (P1, P2, …). Las features pequeñas (`Size: XS/S`) se
manejan con `execute-phase <NN>` en un solo pase — sin skill separada; el
pase único termina cambiando la fila del roadmap a `done` y abriendo el PR,
luego el obligatorio `/review-change` → `/audit-pr`. Para ejecutar todas las
fases sin supervisión (los checkpoints cada 2 fases se saltan, pero la
revisión final **obligatoria** no — sigue corriendo una vez antes del PR),
ver el patrón de **ejecución por lotes con `/loop`** en la skill
`execute-phase`.

> ¿Quieres construir **todo el roadmap** así — cada feature a través de cada
> etapa, con tu única intervención en los merges? Ese es el autopiloto
> `ship-roadmap`: una entrevista inicial, y luego una ejecución impulsada por
> `/loop` de este mismo flujo, feature por feature, terminando en un informe
> final. Ver su entrada en [SKILLS.es.md](SKILLS.es.md).

Durante la ejecución, las skills de conocimiento de dominio se cargan
automáticamente como guardarraíles: las skills de guardarraíl de
stack/dominio del proyecto (patrón de arquitectura, reglas de dominio,
framework, ORM, runtime/plataforma).

## Higiene de contexto y coste

La forma barata de correr este flujo es también la forma documentada. Reglas
fijas:

- **Fin de una unidad o fase → `/log-session`, luego una conversación
  NUEVA.** Nunca compactar para cruzar esa frontera. Los docs
  SPEC/TASKS/progress más el log de sesión YA SON la memoria persistente —
  una conversación nueva recarga solo esos, no toda la transcripción previa.
- **Las entregas a review/audit → siempre una conversación nueva.** Ya es el
  contrato (el modelo/effort de una skill solo compone dentro de su propio
  turno); esta es la misma regla enunciada para su economía, no una nueva.
- **Compactar solo a mitad de fase**, y solo cuando tienes estado sin
  persistir que no puedes permitirte perder. Aun así, prefiere confirmar el
  trabajo en curso más una nota en `progress.md` y cortar a una conversación
  nueva antes que compactar.
- **Por qué es caro:** la compactación relee **toda** la conversación con el
  modelo de sesión **actualmente seleccionado** (coste de entrada) y escribe
  el resumen (coste de salida). El auto-compact se dispara cerca del límite
  de contexto — justo cuando releer es más caro. Una conversación nueva
  cuesta casi cero en comparación, porque los docs propios del flujo son la
  memoria, no la transcripción.

## Etapa 3 — Hardening

**Siempre la última fase de implementación en `PLAN.md`** (el andamiaje la
coloca ahí para cada feature M/L — no es opcional). Se ejecuta como una fase
vía `execute-phase`: casos límite, modos de fallo de los escenarios de
desarrollo del SPEC, estados vacíos/degradados, condiciones de carrera,
idempotencia, mapeo de errores, y reglas de divulgación (p. ej. no ocultar
limitaciones visibles para el usuario). Sigue con docs actualizados y
verificada por la puerta como cualquier fase.

## Etapa 4 — Review & audit (rama completa)

`execute-phase` **recomienda** un checkpoint de `review-change` cada 2 fases
(una sugerencia que se puede saltar — continuar a la siguiente fase es una
alternativa listada) **y entrega el control una vez al final (obligatorio —
cada unidad recibe una revisión final antes de su puerta de merge)**. Una
unidad terminada **siempre abre su PR y pasa a `done`** (construida, no
fusionada — el estado de merge vive en la forja); la revisión final y la
puerta de merge se ejecutan entonces sobre el PR:

- **`review-change`** — el orquestador. Ejecuta solo las revisiones que
  **aplican a esta plataforma**, comprueba **desviación del SPEC** (¿el diff
  realmente hace lo que promete el SPEC — nada contradicho, superado
  silenciosamente, o dejado sin tocar?), y sintetiza una **tabla de decisión
  clasificada** más una checklist explícita de verificación manual. Compone:
  - `review-implementation` — revisión de dos fases sobre bugs, violaciones
    de arquitectura, código eliminable/muerto (menos el código de feature
    planificada), seguridad, incompatibilidades de plataforma/runtime,
    sobre-ingeniería, riesgos de bundle, y tests (fallando **y** faltantes),
    cada uno clasificado como fix-now / postpone / ignore /
    intentional-tradeoff con el PORQUÉ, riesgo de implementación, impacto a
    largo plazo, y una marca de optimización prematura.
  - `/code-review`, `/security-review`, `/verify`, y — para UI —
    `design-review`, `accessibility-review`, `brand-review` (solo las
    aplicables; nunca una pasada irrelevante).

  Solo hallazgos, sin refactorizar; `fix-now` se enruta a `plan-fix` (o se
  incorpora a la fase actual si es trabajo aún sin fusionar); **cada hallazgo
  que no es fix-now pasa por `triage-issue`** (issue / decisión documentada /
  descarte justificado), nunca se pierde en silencio.
- **`audit-pr`** — la puerta de merge. Criterios de aceptación cumplidos,
  todas las fases completas, docs/tests/CI en verde (**nunca fusionar con
  docs pendientes**), `Closes #N` presente, la entrada de issue/índice de
  fixes aún rastreada (se elimina solo después del merge), rama
  independientemente fusionable, y los ejes de revisión limpios →
  **merge-ready o una lista de bloqueadores**.

Vuelve a ejecutar la puerta (chequeo de tipos, tests, build) en verde.

## Etapa 5 — PR

- **El PR siempre se abre — cada unidad, incluida una feature `XS/S` o un
  fix, nunca termina solo-en-rama.** Abrir el PR es el último paso de la
  unidad y cambia su estado de roadmap/índice de fixes a `done` (construida,
  no fusionada).
- Base **siempre** `main`; la rama debe ser **independientemente
  fusionable**.
- **Nunca apilar PRs.** Si una feature es demasiado grande, dividirla en
  porciones independientemente entregables — nunca por fases internas.
- Título convencional; el cuerpo incluye `Closes #N` si vino de un issue.
- La checklist de pre-commit (de `CLAUDE.md`): la puerta (chequeo de tipos,
  tests, build) en verde, sin violaciones de arquitectura, sin secretos
  hardcodeados, sin limitaciones ocultas para el usuario, y cualquier otra
  regla mandatada por el proyecto satisfecha.

## Ejemplo trabajado

```
/design-feature  "<your feature>"   → interview + capability closure
   → product half of SPEC filled, `## Design status: designed` (offers to open a tracking issue)
/plan-feature  NN                   → gate reads `designed` → proceeds (no redirect)
   → engineering half filled → scaffolds docs/features/NN-<slug>/{SPEC,PLAN,TASKS,…}.md + roadmap entry
/execute-phase  NN  P1              → data/domain layer, gate green, commit
/execute-phase  NN  P2              → orchestration + adapter, gate green, commit
   → recommended review checkpoint (every 2 phases, skippable): /review-change → classified table + manual checks
/execute-phase  NN  hardening       → edge cases, gate green, commit
   → final phase: flip roadmap to `done`, open the PR ("Closes #<issue>")
/review-change                      → mandatory final review; non-fix-now → triage-issue
/audit-pr                           → merge gate: merge-ready or blockers (never merge with pending docs)
   → human merges
```

(Para una feature `XS/S` o un `--fix`, `execute-phase` ejecuta la sección
`## Phases` del SPEC una por invocación — la fase final `Hardening & PR`
hace el cierre de marcar-como-done → abrir-PR. Un SPEC heredado sin
`## Phases` ejecuta implementar → marcar-como-done → abrir-PR en un solo
pase. De cualquier forma, sigue el mismo obligatorio `/review-change` →
`/audit-pr`.)
