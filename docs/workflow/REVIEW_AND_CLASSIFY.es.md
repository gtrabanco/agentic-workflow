# Revisar & clasificar — `review-change` + `review-implementation`

> 🇬🇧 [English version](REVIEW_AND_CLASSIFY.md)

Cómo revisar un cambio. **`review-change`** es el **orquestador**
adaptable a la plataforma: ejecuta solo las revisiones que aplican a este
proyecto + cambio y sintetiza un informe. **`review-implementation`** es su
**motor de hallazgos** — la revisión de dos fases, **sin refactorizar**, que
termina en una **tabla de decisión clasificada**. Recurre a `review-change`
para la revisión completa y del tamaño correcto; llama a
`review-implementation` directamente para un pase clasificado rápido. Las
especificaciones completas viven en las skills
(`.claude/skills/review-change/SKILL.md`,
`.claude/skills/review-implementation/SKILL.md`); esto es el cuándo/cómo
práctico.

## Cuándo usarla

- **Etapa 4 del flujo de trabajo de features** — sobre la rama completa,
  justo antes de abrir el PR.
- **A mitad de la feature**, cuando quieres una lectura clasificada de qué
  está mal y qué hacer realmente al respecto (no solo una lista plana de
  bugs).
- Siempre que de otro modo ejecutarías tus dos prompts manuales — *"revisa
  por X, Y, Z — solo hallazgos"* y luego *"clasifica esos hallazgos en una
  tabla de decisión"*. Esta skill colapsa ambos en un solo pase.
- Antes de un corte de release o tras un refactor grande.

**No es para:** arreglar código realmente (nunca refactoriza), ni para la
puerta rutinaria de tipos/tests/build — eso es la puerta de verificación del
proyecto (chequeo de tipos, tests, build).

## Cómo invocarla

- `/review-change` — el orquestador: ejecuta los ejes aplicables a esta
  plataforma — cada pasada **aislada por defecto** (contexto limpio, devuelve
  solo su tabla de hallazgos; la composición en el mismo turno es el fallback
  para agentes que no pueden abrir contextos nuevos) — y sintetiza una tabla
  + una checklist de verificación manual. Úsala antes de un PR.
- `/review-implementation` — solo el motor; por defecto usa el **diff de la
  rama actual frente a `main`**.
- Pasa una ruta/glob para ampliar o acotar el alcance, p. ej.
  *"review-implementation sobre src/payments/"*.
- Ambas imprimen el **alcance** al principio, para que sepas qué se cubrió y
  qué no.

## Qué produce (dos fases, sin refactorizar)

**Fase 1 — Encontrar.** Hallazgos (id + `file:line` + evidencia) a lo largo
de: bugs, violaciones de arquitectura, código eliminable/muerto,
seguridad/ciberseguridad, incompatibilidades de plataforma/runtime,
sobre-ingeniería y optimización prematura, riesgo de tamaño de bundle, y
tests (fallando **y** faltantes) — más cualquier violación de las reglas del
proyecto (lo que mandaten sus docs).

> **Excepción de código muerto:** el código deliberadamente preparado para
> una feature en curso o planificada **no** está muerto. La skill
> contrasta el roadmap, el SPEC/`TASKS.md` de la feature, y
> `known-issues.md`; si no puede saberlo, marca el hallazgo como *verify* y
> pregunta — nunca afirma "muerto" por conjetura.

**Fase 2 — Clasificar.** Cada hallazgo aterriza en una tabla de decisión:

| Hallazgo | Eje | Sev | Clase | PORQUÉ | Riesgo de impl. | Impacto a largo plazo | ¿Opt. prematura? | Ruta |
|---|---|---|---|---|---|---|---|---|
| Token de API confirmado en un archivo de config | seguridad | high | fix-now | Exposición de credenciales | Bajo (mover a gestor de secretos) | Riesgo de incidente | no | incorporar a la fase |
| Arreglar este bug de backend arrastra un rediseño de auth | corrección | high | decision-required | Decisión de producto/arquitectura inevitable | — | Bloqueante | no | presentar decisión, bloquear |
| Rate limiter reutilizable en toda la flota | arquitectura | low | proposal | Independiente de esta unidad (D3) | — | — | sí | lote de propuesta + disparador |
| Wrapper de un solo llamador alrededor de una llamada stdlib | sobreingeniería | low | ignore | Indirección sin beneficio | — | Insignificante | no | anotar razonamiento |

Clases: **fix-now / replan-in-unit / decision-required / proposal / ignore** — donde
`ignore` afirma "esto no es un defecto real" (se decide primero, sobre la afirmación
misma). Para el trabajo de la unidad actual solo existen **fix-now** (se incorpora a la
fase abierta), **replan-in-unit** (nuevas fases confirmadas por el usuario) y
**decision-required** (bloquea hasta que el usuario decida); `postpone` / `tradeoff` /
`wontfix` / `disputed` y los issues creados por el revisor están **prohibidos** para el
trabajo de la unidad actual (AC 10). Solo una capacidad futura realmente independiente
se convierte en **proposal**.

## Qué haces con el resultado

`review-change` es **obligatoria antes de cada merge** (cada unidad la
recibe). Cada hallazgo tiene un destino real — nunca se pierde en silencio,
y la revisión no crea backlog (D3):

- **fix-now** → se incorpora directamente a la fase abierta de la unidad
  actual. Nunca un issue rastreado, nunca `plan-fix` (AC 12).
- **fix-now / replan-in-unit** → nuevas fase(s) confirmadas por el usuario
  añadidas al ledger `## Phases` del SPEC de la unidad (antes del cierre de
  hardening, o después de él más una fase final de hardening fresca si ya
  corrió), luego `execute-phase` en la misma rama — nunca una degradación
  (AC 12).
- **fix-now / decision-required** → parar y presentar la decisión; la unidad
  bloquea hasta que el usuario decida.
- **proposal** (capacidad futura independiente) → lote en el reporte con un
  disparador; el **usuario** decide si enrutarla a `triage-issue` (D3).
- **ignore** → anotar el razonamiento en el reporte; sin más acción.

Luego imprime el siguiente paso (limpio → `/audit-pr`).

## Multi-revisor adversarial (opt-in)

`review-change --adversarial N` ejecuta **N revisores independientes, de
contexto limpio, solo-diff** — cada uno con la postura adversarial estándar
de "asumir que el diff está mal" — en paralelo, y luego fusiona y
deduplica sus hallazgos por `file:line` (+eje) en la misma tabla de decisión
clasificada de arriba. Un hallazgo levantado por **≥1** revisor se incluye;
no hay puerta de mayoría/quórum, porque todo el punto es detectar lo que a
un revisor se le escaparía.

- **Tres niveles de despliegue**, adaptables a la plataforma: Claude Code →
  N **subagentes** en paralelo; un agente con invocación headless → N
  **invocaciones headless** en paralelo; ninguno de los dos → N
  **conversaciones nuevas secuenciales** (más lento, el fallback documentado
  de último recurso).
- **Desactivado por defecto.** Sin flag → el comportamiento actual de un
  solo revisor, sin cambios. `review-change` **auto-recomienda** el modo
  (nunca lo fuerza) para cambios `L` o marcados como sensibles (auth, pagos,
  migraciones destructivas, secretos, config de CI) — el usuario decide si
  la seguridad extra vale el coste.
- **Nota de coste: 2–3× la etapa de revisión más cara**, porque N revisores
  ejecutan cada uno el motor de hallazgos completo. Ese coste es exactamente
  por qué el modo permanece opt-in para uso interactivo.
- **`ship-roadmap` lo activa como piso obligatorio** — `--adversarial 2`
  para features `L`/marcadas como sensibles en su etapa REVIEW no
  supervisada, porque no hay ningún humano presente para ejercer el juicio
  de saltarla en el que se apoya el aviso interactivo. Este piso
  deliberadamente **no está alineado** con el aviso interactivo (que sigue
  siendo opt-in) — los dos sirven contextos distintos a propósito.

## Dónde encaja

Etapa 4 (verificación & revisión), junto a `/code-review`,
`/security-review`, `/verify`. Añade la **clasificación + los ejes
conscientes del proyecto** que aquellas no tienen, en un solo pase. Enruta
**fix-now** a la fase abierta de la unidad actual, **replan-in-unit** a
nuevas fases del SPEC confirmadas por el usuario, presenta **decision-required**
al usuario y agrupa las **proposals** independientes para que el usuario las
enrute a `triage-issue`.
