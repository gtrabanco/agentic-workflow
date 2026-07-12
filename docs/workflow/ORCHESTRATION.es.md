# Orquestación programática — impulsar el flujo de trabajo sin Claude Code

> 🇬🇧 [English version](ORCHESTRATION.md)

Las skills del flujo de trabajo son instrucciones simples que cualquier
agente puede seguir — pero dos comodidades de Claude Code hicieron que el
*autopiloto* se sintiera nativo ahí: **`/loop`** (reinvocación automática) y
**subagentes** (un contexto de modelo barato nuevo por fase). Ninguna forma
parte del contrato. Este documento especifica el reemplazo neutral respecto
al proveedor: un **driver externo** — un bucle de shell, un job de CI, tu
propio programa — inyecta el requisito del sobre en cada invocación (ver
abajo), analiza el **sobre-máquina** resultante (un bloque JSON fijo) de
cada turno, y decide el siguiente comando y el modelo en el que ejecutarlo.

```
            ┌──────────────────────────────────────────────┐
            │              YOUR ORCHESTRATOR                │
            │  parse envelope → route on state → pick tier  │
            └────────┬─────────────────────────▲────────────┘
                     │ invoke (headless)       │ last fenced ```json block
                     ▼                         │
      agent session running ONE skill: workflow-status /
      plan-feature / execute-phase / review-change / audit-pr / …
```

Esto es exactamente el bucle de `ship-roadmap` con el conductor movido
fuera del agente — ganas la elección de nivel de modelo por paso (ejecuta
`execute-phase` en un modelo barato, `audit-pr` en tu más fuerte) y no
pierdes nada: las propias puertas de las skills (seguridad de rama, puerta
de verificación, revisión obligatoria, puerta de merge) siguen aplicando
dentro de cada paso.

## El sobre

Esquema completo en
[`skills/orchestration-envelope/SKILL.md`](../../skills/orchestration-envelope/SKILL.md).
Contrato en una línea: **el último bloque ```json entre comillas del
mensaje final es el sobre; exactamente uno por turno; todas las claves de
nivel superior siempre presentes.**

### Analizándolo con el paquete oficial

**`@gtrabanco/agentic-workflow-schema`** (npm) implementa el contrato:
`parseEnvelope(text)` extrae el último bloque ```json entre comillas, lo
valida, y devuelve un sobre completamente tipado; los ayudantes
`isTerminal(state)` e `isRunHalt(envelope)` cubren las dos reglas de
parada; el JSON Schema en bruto se exporta para drivers que no son JS. El
código fuente vive en
[`packages/agentic-workflow-schema/`](../../packages/agentic-workflow-schema/)
y está bloqueado por versión a este contrato (ver su README).

```ts
import { parseEnvelope, isRunHalt, isTerminal } from "@gtrabanco/agentic-workflow-schema";
const r = parseEnvelope(agentOutput);
if (!r.ok) throw new Error(r.errors.join("; "));
if (isRunHalt(r.envelope)) stopRun(r.envelope.blockers);
else if (!isTerminal(r.envelope.state)) invoke(r.envelope.next.recommended, r.envelope.next.tier);
```

## Inyectar el requisito del sobre (fragmento de system-prompt + bucle de reparación)

Desde la feature 10, el sobre ya no es una obligación del contrato de turno
por-skill — cada skill orientada al usuario excepto `workflow-status`
eliminó su sección `## Machine envelope` en línea, ya que el único
consumidor es un driver como este, y una instrucción estática de `SKILL.md`
no puede detectar ni recuperarse de una omisión de la forma en que puede
hacerlo un driver. El contrato ahora vive aquí y en
[`skills/orchestration-envelope/SKILL.md`](../../skills/orchestration-envelope/SKILL.md);
un driver que quiera el sobre debe suministrarlo él mismo:

1. **Inyecta el fragmento canónico de system-prompt** en cada invocación
   headless (textual, de `orchestration-envelope/SKILL.md`):
   ```text
   Every turn you produce MUST end with exactly one fenced ```json block matching
   the orchestration envelope schema (all top-level keys present; values only
   from verified command output). Emit nothing after it.
   ```
2. **Bucle de reparación ante fallo de parseo.** Llama a
   `parseEnvelope(lastTurn)` (`@gtrabanco/agentic-workflow-schema`) después
   de cada invocación. Si falla — sin bloque json entre comillas, o no
   valida — no trates el paso como fallido todavía: reinvoca la **misma
   sesión** con el prompt de una línea
   `Emit only the machine envelope for the turn above.` y analiza esa
   respuesta. Razón: un modelo débil que omite el JSON al final de un
   documento largo casi siempre lo produce cuando se le pide únicamente
   eso — reparar por turno en la capa del driver es estrictamente más
   fiable que una instrucción estática que el modelo siempre iba a saltarse.
3. **Límite de reintentos.** Un intento de reparación por turno. Si la
   respuesta de reparación tampoco se puede analizar, trata el paso como un
   `FAILED` a nivel de driver y sácalo a la luz para un humano — no repitas
   el prompt de reparación indefinidamente.
4. **`workflow-status` no necesita bucle de reparación.** Es la única skill
   que sigue emitiendo el sobre en línea (emitirlo es su función), así que
   consultarla es una llamada normal sin fragmento inyectado ni paso de
   reparación requerido.

## La máquina de estados (enrutar por `state`)

| `state` | Significado | Acción del orquestador | Nivel sugerido |
|---|---|---|---|
| `OK` | La skill terminó su trabajo | Invocar `next.recommended` | según `next.tier` |
| `CONTINUE` | Misma unidad, más trabajo (siguiente fase / iteración) | Reinvocar `next.recommended` | `cheap` |
| `READY_FOR_REVIEW` | Checkpoint o fin de unidad | `/review-change` | `strong` |
| `READY_FOR_AUDIT` | Revisión limpia | `/audit-pr` | `strong` |
| `MERGE_READY` | Auditoría aprobada; comentario publicado en el PR | El humano fusiona, o tu política fusiona (respeta la checklist pre-merge de la skill) | — |
| `MERGED` | Auto-merge autorizado ejecutado | Siguiente unidad: `workflow-status` → enrutar | `cheap` (sensor) |
| `NEEDS_FIXES` | Hallazgos fix-now / bloqueadores dentro de alcance | Ciclo de incorporación de `/execute-phase`, luego reejecutar la puerta que los emitió | `cheap` para incorporar, `strong` para repuerta |
| `BLOCKED` | Dependencia no cumplida / causa externa | Seguir `dependencies.build_order` (planificar+ejecutar primero la unidad no cumplida más profunda) o resolver `blockers[]` | según el paso bloqueado |
| `NEEDS_INPUT` | Se requiere una decisión humana | Mostrar `needs_input.question` + `options`; reanudar con la respuesta | — |
| `FAILED` | Reintentos agotados (puerta en rojo, sustrato) | Detener esta unidad; un humano la revisa | — |
| `HALT` | Descubrimiento de parar-el-mundo (`blockers[].scope: "run"`) | **Detener toda la ejecución**; sacarlo a la luz; nada más avanza | — |

Piso de seguridad para cualquier driver, no negociable: **nunca saltarse
una puerta `review_pending` o `audit_pending`, nunca fusionar salvo con un
`MERGE_READY` fresco, y tratar `HALT` como terminal hasta que un humano lo
despeje.** Las skills aplican esto dentro de cada paso; el driver no debe
sortearlas.

## El sensor: `workflow-status`

Entre pasos (o para arrancar), ejecuta `workflow-status --json-only` —
emite el estado completo del proyecto: cada feature/fix con su **cierre
transitivo de dependencias** (cumplido/no cumplido), `startable_now`,
`blocked_units` con órdenes de construcción, PRs abiertos con estado de
auditoría, y hallazgos pendientes de triage. Enruta según
`detail.startable_now` y `next.recommended`. Es de solo lectura y de nivel
barato.

## Urgencia: el micro-juicio pausar-vs-terminar (rúbrica canónica)

El campo `detail.urgent` de `workflow-status` (feature 15) reporta issues
abiertos que llevan las etiquetas `urgent`/`fix-next` protegidas por
capacidad (leído **solo** del objeto de etiquetas, nunca del
título/cuerpo/comentarios del issue — ver `skills/triage-issue/SKILL.md`,
la única propietaria y escritora de ese vocabulario) — junto a los hechos
de interrumpibilidad de la unidad en curso. Es un **sensor**: nunca decide
si interrumpir. Esa decisión es esta rúbrica, ejecutada por el
**consumidor** (un driver, la etapa SELECT de `ship-roadmap`, o un humano)
— la única copia canónica que cada consumidor referencia, nunca bifurca.

**Por qué es seguro alimentar al juez con el cuerpo del issue aunque esté
controlado por un atacante:** la etiqueta ya condicionó *si* esta rúbrica
se ejecuta siquiera — un issue sin etiqueta nunca llega a esta sección, sin
importar lo que diga su texto. El juez solo elige entre dos caminos que la
etiqueta ya autorizó (`INTERRUPT_NOW` ahora, o `FINISH_FIRST` e
interrumpir después de esta fase); no puede escalar más allá de eso, y su
peor fallo es un retraso acotado, nunca un fix perdido.

**1 — Cortocircuito determinista (sin llamada al modelo, se ejecuta
primero, siempre).** Evaluar de arriba a abajo; **la primera fila que
coincide gana** — un issue `fix-next` nunca cae a las filas
`INTERRUPT_NOW`/`FINISH_FIRST` de abajo, aunque el árbol de la unidad en
curso resulte estar limpio.

| Condición | Veredicto | Por qué no llamar al juez |
|---|---|---|
| `detail.urgent.issues` está vacío | — (no hay urgencia en juego) | Nada que decidir |
| Un issue urgente lleva `fix-next` (no `urgent`) | Cabeza de la cola, **sin interrupción** | `fix-next` evita el juez por completo por diseño — nunca evalúa para interrumpir ahora |
| `interruptibility.dirty == false` (árbol limpio, fase cerrada) | `INTERRUPT_NOW` | Interrumpir es gratis en un límite de commit — empieza el fix de inmediato |
| `interruptibility.tasks_from_boundary <= 1` (a una casilla del cierre de fase) | `FINISH_FIRST` | Terminar casi no cuesta nada; interrumpir a mitad de una casilla cuesta más de lo que ahorra |

Solo la **banda intermedia ambigua** — árbol sucio, más de una tarea del
siguiente límite de commit, etiqueta `urgent` (no `fix-next`) — continúa al
paso 2.

**2 — El juez.** Una única invocación, cuatro guardarraíles, ninguno
opcional:

- **Sin herramientas.** El juez clasifica; no posee ningún efector de
  ningún tipo. Darle herramientas reintroduciría exactamente la superficie
  de inyección que las etiquetas existen para cerrar.
- **Nivel barato, contexto limpio.** Genera una invocación nueva, de
  contexto mínimo, en el nivel más barato capaz de tu flota — no un id de
  nivel fijado aquí (el flujo de trabajo es agnóstico de modelo entre
  70+ agentes); nunca el nivel que ejecuta la unidad en curso.
- **Salida binaria cerrada + bucle de reparación de esquema.** La salida
  completa del juez es:
  ```json
  {"verdict": "FINISH_FIRST | INTERRUPT_NOW", "reason": "<one line>"}
  ```
  Valida contra esa forma. No se puede analizar en el primer intento → una
  invocación de reparación (`Emit only the verdict JSON for the case
  above.`), la misma regla que el bucle de reparación del sobre visto
  antes en este documento. Sigue sin poder analizarse tras la reparación →
  **valor por defecto a prueba de fallos `FINISH_FIRST`** (ver abajo) —
  nunca reintentar indefinidamente, nunca adivinar.
- **Rúbrica como system-prompt.** La tabla de reglas de abajo **es** el
  system prompt entregado al juez, textualmente — no una paráfrasis que el
  juez asocia libremente. El juez la aplica como una checklist contra los
  hechos específicos del issue + la interrumpibilidad que se le entregan, y
  no devuelve nada más.

  ```text
  You are a bounded classifier. You have no tools and take no action — you
  only classify. Given an urgent issue's content and the in-flight unit's
  interruptibility facts, decide: interrupt the in-flight unit now, or finish
  the current phase first?

  Checklist (apply in order; first matching row wins):
  1. Is the issue's real-world impact severe AND actively ongoing (data loss,
     security exposure, broken production path) — not merely annoying or
     already contained? If NO → FINISH_FIRST.
  2. Is the in-flight unit more than one task from its next commit boundary
     AND would interrupting lose uncommitted, hard-to-reconstruct work? If
     YES → FINISH_FIRST.
  3. Both the impact is severe/ongoing AND interrupting loses little (close to
     a boundary, or the work is trivially resumable)? → INTERRUPT_NOW.
  4. Uncertain, tied, or the evidence conflicts? → FINISH_FIRST (fail-safe
     default — never guess toward interruption).

  Output ONLY: {"verdict": "FINISH_FIRST | INTERRUPT_NOW", "reason": "<one
  line>"}. Nothing before or after.
  ```
- **Valor por defecto a prueba de fallos `FINISH_FIRST`.** Ante cualquier
  incertidumbre, empate, o salida no analizable que sobreviva al bucle de
  reparación, el veredicto es `FINISH_FIRST` — nunca `INTERRUPT_NOW` por
  defecto. La etiqueta ya garantiza que el fix se ejecuta a continuación de
  cualquier forma; lo único en juego es *ahora* vs. *después de esta fase*,
  así que errar hacia terminar nunca pierde un fix, solo acota un retraso.

**3 — Actuar sobre el veredicto.** `INTERRUPT_NOW` → aparca la unidad en
curso como un "crash" voluntario y limpio (commit de trabajo en curso +
una nota en `progress.md` explicando por qué), luego ejecuta
`plan-fix`/`execute-phase --fix` sobre el issue urgente; reanudar la
unidad aparcada más tarde reutiliza el veredicto `RESUMABLE` de
`workflow-status` + la re-entrada idempotente por fase de `execute-phase`
— sin maquinaria nueva de aparcar/reanudar. `FINISH_FIRST` → termina el
commit de la fase actual, luego el fix urgente es el siguiente en la cola
(igual que el tratamiento de cabeza-de-cola de `fix-next`) antes de que
empiece cualquier otra unidad.

## Protocolo de reinicio del driver (recuperación ante caídas)

Un proceso driver eventualmente morirá a mitad de turno. La regla de
recuperación: **el estado persistido del driver es una pista; la verdad
fundamental (git, forja, docs) es la fuente** — nunca "reparar" tu diario,
recalcular desde la realidad.

1. **Diario (forma recomendada).** Persiste cada sobre en modo
   **solo-anexar**, una entrada por turno con una marca de tiempo y el SHA
   de cabeza actual — nunca sobrescribir un único archivo de estado. La
   última entrada es tu *hipótesis* al reiniciar; el log completo es tu
   rastro de auditoría.
2. **Al reiniciar**, llama al sensor con la hipótesis:
   `workflow-status --json-only --last-envelope <last-entry.json>`
   (agentes sin paso de argumentos: pega el JSON en el mensaje de
   invocación — la skill lee el último bloque json entre comillas de la
   solicitud como la pista).
3. **Enruta según el sobre recalculado** — tres casos:
   - `state: OK` (veredicto `CLEAN`) — sin interrupción; sigue
     `next.recommended` como en cualquier tick normal.
   - `state: CONTINUE` (veredicto `RESUMABLE`) — un turno murió a mitad de
     fase pero el ledger apunta a una única tarea siguiente;
     `next.recommended` es el comando de reanudación (`execute-phase <NN>
     <phase>` re-entra idempotentemente — reconcilia las marcas de
     `TASKS.md` contra la evidencia y continúa desde la primera tarea sin
     marcar).
   - `state: NEEDS_INPUT` (veredicto `AMBIGUOUS`) — el ledger contradice
     los commits (marcas sin evidencia, rama desconocida); muestra
     `needs_input.question` + `options` a un humano. No elijas
     automáticamente.
4. **Línea de divergencia.** El informe `Hint envelope: matched | diverged: …`
   te dice si se completó trabajo después de tu última entrada de diario
   (la realidad adelantada al diario es normal — una skill terminó y
   empujó antes de la caída); adopta el estado recalculado y añádelo al
   diario.

Nada de lo anterior requiere acceso al sistema de archivos o a git en el
propio driver — el sensor hace la lectura; el driver solo analiza sobres,
que es el punto clave para drivers que solo hablan REST-API (p. ej. un
servidor Node que habla con la API HTTP de un agente).

## Reemplazando `/loop` (el bucle del driver)

Invoca al agente en modo headless, una skill por invocación, y repite en
bucle. La invocación es por-agente (`claude -p "…"` en el CLI de Claude
Code; `opencode run "…"`; el modo no interactivo de cualquier agente;
incluso un chat nuevo vía API) — el patrón es idéntico:

```bash
#!/usr/bin/env bash
# Generic driver skeleton. AGENT_STRONG / AGENT_CHEAP are whatever commands
# start a headless session on that tier for your agent(s) — they may even be
# different agents/vendors per step.
set -euo pipefail

run() { # run <tier> <prompt> -> prints the envelope (last fenced json block)
  local out; out="$("$@" 2>/dev/null)"
  printf '%s\n' "$out" | awk '/^```json$/{f=1;j="";next} /^```$/{if(f){last=j};f=0} f{j=j $0 "\n"} END{printf "%s", last}'
}

while true; do
  env_json="$(run $AGENT_CHEAP "Follow .agents/skills/workflow-status/SKILL.md with --json-only")"
  state=$(jq -r .state <<<"$env_json"); next=$(jq -r .next.recommended <<<"$env_json")
  tier=$(jq -r .next.tier <<<"$env_json")
  case "$state" in
    HALT|FAILED|NEEDS_INPUT) echo "$env_json" | jq .; exit 1 ;;
    MERGE_READY)             echo "merge pending: $(jq -r .pr.url <<<"$env_json")"; exit 0 ;;
    *) driver=$([ "$tier" = cheap ] && echo "$AGENT_CHEAP" || echo "$AGENT_STRONG")
       env_json="$(run $driver "Follow the installed SKILL.md for: $next")" ;;
  esac
done
```

El esqueleto es deliberadamente mínimo — un driver real añade manejo por
estado (ciclos de incorporación, recursión de orden de construcción en
`BLOCKED`, política de merge en `MERGE_READY`) usando la tabla de arriba.
El punto clave: **nada aquí es específico de Claude Code.**

## Economía de la caché de prompts

Cada llamada a `run()` de arriba es una invocación headless nueva — barata
por diseño, pero solo si el driver no pelea contra la caché de prompts del
proveedor del modelo:

- **Mantén el system prompt / preámbulo estable byte a byte entre
  invocaciones.** Misma skill → mismo prefijo, siempre (sin timestamp, id
  de ejecución, u otro ruido por-llamada inyectado en la porción
  cacheada). Un prefijo estable es lo que hace posible un acierto de
  caché; un solo byte de deriva la invalida.
- **Agrupa las invocaciones de una unidad dentro de una ventana corta.**
  El TTL de la caché suele rondar los ~5 minutos — ejecutar los pasos de
  una unidad seguidos mantiene la caché caliente; dejar huecos largos
  entre pasos deja que expire y hay que pagar el precio completo de nuevo.
- **Nunca cambies de modelo a mitad de unidad.** Más allá de invalidar la
  caché (la caché de cada proveedor es específica del modelo), también
  rompe la continuidad estilística entre los pasos de la unidad — elige el
  nivel por paso (según la tabla de estados de arriba) pero manténlo fijo
  durante todo el ciclo de vida de ese paso, sin cambiarlo a mitad de
  camino.
- **Un driver de una invocación por paso nunca necesita compactación en
  absoluto** — ver `docs/workflow/FEATURE_WORKFLOW.md` →
  *Higiene de contexto y coste* para saber por qué un contexto nuevo por
  paso es el camino barato, no solo uno seguro.

## Reemplazando subagentes (contextos baratos por fase)

`ship-roadmap` genera un subagente de Claude Code por cada fase de
`execute-phase` para ejecutar la implementación por debajo del nivel del
conductor. El equivalente externo está integrado en el bucle de arriba:
cada invocación `execute-phase NN Pk` ES una sesión headless nueva, y el
driver elige el nivel barato para ella. Contexto nuevo por fase, modelo
barato, la propia disciplina de `execute-phase` por dentro — las mismas
propiedades, sin necesitar la primitiva de subagente.

## Qué sigue siendo exclusivo de Claude Code (y su estado)

| Característica | Estado |
|---|---|
| `/loop` | Comodidad. Completamente reemplazada por el bucle del driver de arriba. |
| Subagentes | Comodidad. Reemplazados por una invocación headless por fase. |
| Frontmatter `model:`/`effort:` por skill | Solo en la rama `#claude`; la rama por defecto hereda la sesión — el driver elige los niveles en su lugar. |
| Ajuste de sesión `ultracode` | Acelerador opcional de Claude Code para el fan-out de ship-roadmap; sin equivalente necesario — un driver paraleliza ejecutando unidades independientes él mismo simultáneamente (respeta el flujo de git declarado del proyecto antes de paralelizar). |
| Hooks de sesión de `.claude/` (captura de log-session) | Extra opcional; `log-session` invocado por el driver al final de la ejecución lo cubre. |

`ship-roadmap` sigue siendo la forma *dentro del agente* de ejecutar este
mismo bucle cuando prefieras no alojar un driver — los dos son
equivalentes por diseño, y ambos consumen las mismas skills por debajo.
