# @gtrabanco/agentic-workflow-schema

> 🇬🇧 [English version](README.md)

Tipos, JSON Schema, y parser/validador para el **sobre-máquina** de
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow) — el
bloque JSON fijo con el que termina un turno de agente conducido (emitido
siempre por `workflow-status`, y por cualquier otra skill cuando el driver
inyecta el fragmento canónico de system-prompt — ver el protocolo de driver
abajo), para que orquestadores externos puedan enrutar el flujo de trabajo
programáticamente (qué comando sigue, en qué nivel de modelo).

Cero dependencias en tiempo de ejecución. Fuente de verdad del contrato:
[`skills/orchestration-envelope/SKILL.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/skills/orchestration-envelope/SKILL.md);
protocolo de driver:
[`docs/workflow/ORCHESTRATION.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/docs/workflow/ORCHESTRATION.md).

## Instalación

```sh
npm install @gtrabanco/agentic-workflow-schema
```

## Uso

```ts
import {
  parseEnvelope,
  isTerminal,
  isRunHalt,
} from "@gtrabanco/agentic-workflow-schema";

const output = await runAgentHeadless("Follow the installed SKILL.md for: /workflow-status --json-only");

const result = parseEnvelope(output); // extracts the LAST fenced ```json block
if (!result.ok) throw new Error(result.errors.join("; "));

const env = result.envelope; // fully typed
if (isRunHalt(env)) stopEverythingAndPage(env.blockers);
else if (isTerminal(env.state)) askHuman(env);
else invokeNext(env.next.recommended, env.next.tier); // "strong" | "cheap"
```

El contrato de parseo es exactamente lo que prometen las skills: **el
último bloque
```` ```json ````…```` ``` ```` entre comillas del mensaje final es el
sobre**, uno por turno, todas las claves de nivel superior siempre
presentes.

También exportados: `extractLastJsonBlock(text)`, `validateEnvelope(value)`,
`ENVELOPE_STATES` (el enum de 11 estados), `TERMINAL_STATES`, y cada tipo
de campo. También se distribuye un **JSON Schema** agnóstico de lenguaje —
funciona con el mínimo de `engines.node` (>=18):

```ts
import { createRequire } from "node:module";
const schema = createRequire(import.meta.url)("@gtrabanco/agentic-workflow-schema/envelope.schema.json");
```

En Node 20.10+/22, la forma más nueva de import-attributes también
funciona:

```ts
import schema from "@gtrabanco/agentic-workflow-schema/envelope.schema.json" with { type: "json" };
```

## El sobre, campo por campo

Cada clave de nivel superior está **siempre presente** (`required` en el
JSON Schema) — una skill que no tiene nada que reportar para una clave usa
`null` / `[]` / `0`, nunca la omite. **Cerrado** = el enum exacto de abajo
es exhaustivo (el validador rechaza cualquier otra cosa); **abierto** =
forma libre, cualquier valor del tipo indicado.

| Campo | Tipo | Valores | Significado |
|---|---|---|---|
| `skill` | string | abierto (no vacío) | Qué skill produjo este sobre. |
| `state` | enum | **cerrado** — los 11 estados de abajo | La clave de enrutamiento. Todo lo que decide un orquestador empieza aquí. |
| `summary` | string | abierto | Una frase en texto plano: qué pasó este turno. |
| `unit.type` | enum | **cerrado** — `feature` · `fix` · `docs` · `none` | Qué tipo de unidad trabajó el turno. |
| `unit.id` | string\|null | abierto | El identificador de la unidad (`NN-slug` para features, `n-topic` para fixes). |
| `unit.issue` | integer\|null | abierto | El número del issue de rastreo, cuando la unidad nace de un issue. |
| `unit.branch` | string\|null | abierto | La rama de trabajo. |
| `phase.current` | string\|null | abierto (por convención `P1`, `P2`, …) | Fase recién trabajada, para features en fases (M/L). |
| `phase.total` / `phase.completed` | integer\|null | abierto | Recuentos de fase; `null` para unidades de pase único. |
| `pr.number` / `pr.url` / `pr.head_sha` | int/str\|null | abierto | El PR de la unidad, una vez que existe. |
| `pr.state` | enum | **cerrado** — `open` · `merged` · `none` | El estado de merge vive en la forja, no en el roadmap. |
| `pr.merge_ready` | boolean\|null | abierto | `true` solo después de un veredicto MERGE-READY de `audit-pr` sobre la cabeza actual. |
| `pr.ci` | enum | **cerrado** — `green` · `red` · `pending` · `none` · `null` | `none` = el proyecto no tiene CI; `null` = no comprobado este turno. |
| `gates.verification` | enum | **cerrado** — `green` · `red` · `not-run` · `null` | La propia puerta del proyecto (chequeo de tipos + tests + build) tal como se ejecutó por última vez. |
| `gates.review_pending` / `gates.audit_pending` | boolean\|null | abierto | Si la revisión obligatoria / auditoría de merge todavía tiene que suceder. |
| `findings.fix_now[]` | array de objetos | items: `id`/`file`/`axis`/`class`/`route` (abierto), `severity` (**cerrado** — `high`·`med`·`low`), `suggested_tier` (**cerrado** — `strong`·`cheap`) | Hallazgos que deben incorporarse a la rama ACTUAL antes de que avance — un item por cada fila sin foldear del ledger de fold fix-now (`review-findings.md`) de la unidad. |
| `findings.issues_filed[]` | array de enteros | abierto | Números de issue creados/actualizados este turno. |
| `findings.untriaged` | integer ≥ 0 | abierto | Hallazgos todavía sin destino — las skills cuyo contrato enruta todo deben reportar `0`. |
| `findings.decisions_recorded` | integer ≥ 0 | abierto | Decisiones escritas en registros clase `decisions.md` este turno. |
| `blockers[].kind` | enum | **cerrado** — `dependency` · `issue` · `gate` · `merge-conflict` · `substrate` · `input` | Por qué la unidad (o la ejecución) no puede avanzar. |
| `blockers[].scope` | enum | **cerrado** — `unit` · `run` | `run` significa parar-el-mundo: nada más avanza tampoco. |
| `blockers[].id` / `blockers[].detail` | string | abierto | Qué exactamente (un slug, `#N`, un nombre de check) + una línea de contexto. |
| `dependencies.unmet[]` / `dependencies.build_order[]` | arrays de string | abierto | Referencias de roadmap/issue no cumplidas, y el orden más-profundo-primero para construirlas. |
| `recommendations.product_audit` | boolean | abierto | `true` cuando una desviación recurrente sugiere que las suposiciones fundacionales están obsoletas. |
| `recommendations.reason` | string\|null | abierto | Por qué (requerido en la práctica cuando el flag es `true`). |
| `needs_input` | object\|null | `question` (abierto) + `options[]` (abierto) | No-nulo solo en `state: NEEDS_INPUT` — la decisión humana a mostrar, con opciones concretas. Nada se adivinó. |
| `next.recommended` | string | abierto (una invocación de skill) | El único mejor comando siguiente. |
| `next.alternatives[]` | array de string | abierto | Las otras elecciones defendibles. |
| `next.tier` | enum | **cerrado** — `strong` · `cheap` | Qué clase de modelo merece el siguiente paso — juicio vs. mecánico. |
| `detail` | any | abierto (específico de la skill) | Carga útil por skill — p. ej. `workflow-status` lleva aquí el árbol completo del proyecto (`features`, `fixes`, `startable_now`, `blocked_units`, `crash_recovery`, …). |

### La tabla de enrutamiento de `state` (cerrada — exactamente estos 11)

| `state` | Significado | Acción del orquestador |
|---|---|---|
| `OK` | La skill terminó su trabajo | Invocar `next.recommended` en `next.tier` |
| `CONTINUE` | Misma unidad, más del mismo trabajo | Reinvocar `next.recommended` (los checkpoints consultivos también aterrizan aquí — la alternativa está listada) |
| `READY_FOR_REVIEW` | Unidad terminada; revisión obligatoria a continuación | `/review-change` en un modelo fuerte, contexto nuevo |
| `READY_FOR_AUDIT` | Revisión limpia | `/audit-pr` (fuerte) |
| `MERGE_READY` | Auditoría aprobada sobre el SHA de cabeza actual | El humano fusiona — o lo hace tu política de auto-merge escrita |
| `MERGED` | Un auto-merge autorizado se ejecutó este turno | Siguiente unidad: consultar `workflow-status` |
| `NEEDS_FIXES` | `findings.fix_now` no está vacío | Incorporar en la rama (commit Y push), luego reejecutar la puerta que los emitió |
| `BLOCKED` | Dependencia no cumplida / causa externa | Seguir `dependencies.build_order`, o resolver `blockers[]` |
| `NEEDS_INPUT` | Un humano debe decidir | Mostrar `needs_input.question` + `options`; reanudar con la respuesta |
| `FAILED` | Reintentos agotados | Detener esta unidad; un humano la revisa |
| `HALT` | Descubrimiento de parar-el-mundo (`blockers[].scope: "run"`) | Detener toda la ejecución; nada avanza hasta que un humano lo despeje |

`isTerminal(state)` cubre `NEEDS_INPUT` / `FAILED` / `HALT` (+
`MERGE_READY` con puerta humana); `isRunHalt(envelope)` es la comprobación
de `HALT` / bloqueador con alcance de ejecución.

## Orquestar con este esquema

Dos patrones, ambos consumiendo el mismo sobre. En ambos, **inyecta el
fragmento canónico de system-prompt** en cada invocación headless (las
skills no emiten el sobre por sí solas — `workflow-status` es la única
excepción):

```text
Every turn you produce MUST end with exactly one fenced ```json block matching
the orchestration envelope schema (all top-level keys present; values only
from verified command output). Emit nothing after it.
```

…y ejecuta el **bucle de reparación** ante un fallo de parseo — un
reintento, luego falla el paso:

```ts
async function turn(prompt: string) {
  let out = await invokeAgent(prompt, { system: SNIPPET });
  let r = parseEnvelope(out);
  if (!r.ok) {
    out = await invokeAgent("Emit only the machine envelope for the turn above.", { resume: true });
    r = parseEnvelope(out);
    if (!r.ok) throw new Error(`step failed: no valid envelope (${r.errors.join("; ")})`);
  }
  return r.envelope;
}
```

**Patrón 1 — bucle de driver fijo** (empieza aquí): consulta el sensor,
enruta por `state`, repite. Esqueleto completo en
[`docs/workflow/ORCHESTRATION.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/docs/workflow/ORCHESTRATION.md),
incluido el protocolo de reinicio de recuperación ante caídas (pista
`--last-envelope` + diario de sobres solo-anexar).

**Patrón 2 — flujos de trabajo dinámicos** (el patrón conductor): un
contexto conductor de larga duración *escribe y monitoriza* el plan de
trabajo; cada trabajador se ejecuta en un **contexto limpio** y solo su
sobre fluye de vuelta hacia arriba — el conductor nunca ingiere
transcripciones en bruto, que es lo que le permite mantenerse de larga
duración sin degradarse. El sobre es precisamente el "resultado
estructurado" que necesita este patrón:

```ts
// Conductor: fan out independent units (workflow-status said they're startable
// in parallel and the project declares `worktrees`), read back only envelopes.
const status = await turn("Follow the installed SKILL.md for: /workflow-status --json-only");
const units = status.detail.startable_now as string[];

const results = await Promise.all(
  units.map((u) => turn(`Follow the installed SKILL.md for: /execute-phase ${u}`))
);

for (const env of results) {
  if (isRunHalt(env)) throw new Error(`HALT: ${JSON.stringify(env.blockers)}`);
  if (env.state === "NEEDS_FIXES")
    await turn(`Fold the fix-now findings on ${env.unit.branch}: ${JSON.stringify(env.findings.fix_now)}`);
}
// The conductor's own context grew by a few KB of envelopes — not by N transcripts.
```

Piso de seguridad para cualquier driver, bucle fijo o dinámico: nunca
saltarse una puerta `review_pending`/`audit_pending`, nunca fusionar salvo
con un `MERGE_READY` fresco ligado al SHA de cabeza actual, y tratar
`HALT` como terminal hasta que un humano lo despeje.

## Versionado

El semver de este paquete sigue al **contrato del sobre**, no al
repositorio: cambio disruptivo del esquema (clave eliminada/renombrada,
estado eliminado) → major; aditivo (clave opcional nueva, estado nuevo) →
minor; arreglos/docs → patch. Cuando cambia la skill
`orchestration-envelope`, este paquete cambia en el mismo PR.
