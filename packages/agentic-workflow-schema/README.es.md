# @gtrabanco/agentic-workflow-schema

> 🇬🇧 [English version](README.md)

Contratos máquina sin dependencias de ejecución para
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow). La versión 3
mantiene el envelope establecido de `workflow-status`, pero ofrece a los
drivers headless un resultado menor para las skills de trabajo y estado
determinista compilado desde documentos.

## Instalación

```sh
npm install @gtrabanco/agentic-workflow-schema
```

## Tres contratos, propietarios distintos

| Contrato | Propietario | Uso |
| --- | --- | --- |
| Envelope v2 | `workflow-status` | Resultado completo del sensor de solo lectura y consumidores existentes. |
| SkillOutcome v1 | Un turno de skill conducido | Resultado pequeño controlado por el modelo: ruta, bloqueantes, preguntas, descubrimientos y referencias de evidencia. |
| WorkflowSnapshot v1 | El driver | Hechos deterministas de repositorio y documentos, con procedencia, desconocidos y contradicciones. |

Todos los JSON Schema son estrictos: se rechazan claves no declaradas. `detail`
es obligatorio en Envelope v2 (usa `null` cuando está vacío); las extensiones
de cada skill van dentro. Los esquemas se exportan en
`./envelope.schema.json`, `./skill-outcome.schema.json` y
`./workflow-snapshot.schema.json`.

## Parsear un turno conducido

Usa los perfiles para seleccionar el resultado requerido, añade la instrucción
generada sólo a una invocación headless y parsea la respuesta final.

```ts
import {
  parseTurn,
  renderOutputInstruction,
  WORKFLOW_SKILL_PROFILES,
} from "@gtrabanco/agentic-workflow-schema";

const skill = "audit-pr";
const profile = WORKFLOW_SKILL_PROFILES.find((entry) => entry.skill === skill);
if (profile === undefined) throw new Error(`Unknown workflow skill: ${skill}`);

const output = await invokeAgent({
  prompt: "Follow the installed skill for /audit-pr.",
  systemAppend: renderOutputInstruction(skill),
});

const result = parseTurn({ skill, text: output, context: { unitId: "12-machine-contract" } });
if (!result.ok) throw new Error(result.errors.join("; "));

// result.outcome es SkillOutcome v1; result.envelope solo existe para v2.
route(result.outcome.next.intent, result.outcome.next.targets);
```

Ante un resultado ausente o inválido, reinvoca la *misma sesión una vez* con
`Emit only the machine result for the turn above.` y vuelve a parsear. El
segundo fallo es un fallo del driver. No conviertas prosa arbitraria en hechos
estructurados.

`workflow-status` conserva su Envelope v2 nativo. Los consumidores existentes
pueden continuar con `parseEnvelope(text)`; los nuevos usan
`parseEnvelopeV2Strict(text)` o el uniforme `parseTurn({skill, text})`.

## Perfiles de capacidades

Cada perfil integrado de `WORKFLOW_SKILL_PROFILES` lleva un objeto `capabilities`
opcional e inmutable: rol, clase de razonamiento, **efectos máximos**, fuentes
de contexto y evidencia requerida, todos dentro de los vocabularios cerrados
exportados (`SKILL_ROLES`, `SKILL_EFFECTS`, `SKILL_REASONING`,
`SKILL_CONTEXT_SOURCES`, `SKILL_REQUIRED_EVIDENCE`).

Semántica de las capacidades:

- **La evidencia del repositorio es autoritativa.** `effects`, `contextSources`
  y `requiredEvidence` documentan las capacidades máximas revisadas de los
  documentos del propio workflow (`docs/`); nunca prometen nada sobre un modelo
  o un runtime de proveedor.
- **El contexto es orientativo.** `semantic-context` y `episodic-memory`
  describen contexto que *puede* ayudar; nunca cambian lo que una skill puede
  hacer.
- **Las exportaciones son inmutables.** Los arrays de vocabulario y cada perfil
  quedan congelados en runtime (`Object.isFrozen`); no se soporta ensanchar un
  perfil en runtime. Cualquier cambio de vocabulario o perfil es una release
  revisada del paquete.

`capabilities` es opcional por compatibilidad de fuente. Un consumidor que
entiende capacidades debe **fallar cerrado** cuando está ausente: nunca inferir
el rol o los efectos de una skill por su nombre.

## Compilar estado determinista

El paquete nunca lee el sistema de archivos, Git ni una forja. El llamador
aporta los documentos exactos y los hechos del repositorio que ya leyó, por lo
que los snapshots son reproducibles y se pueden cachear por `sourceRevision`.

```ts
import { compileWorkflowSnapshot } from "@gtrabanco/agentic-workflow-schema";

const result = compileWorkflowSnapshot({
  sourceRevision: headSha,
  repository: { branch, headSha, dirty },
  documents: [
    { path: "docs/workflow/REPOSITORY_STATE.md", content: repositoryState },
    { path: "docs/features/ROADMAP.md", content: roadmap },
    { path: "docs/features/12-machine-contract/SPEC.md", content: spec },
    { path: "docs/features/12-machine-contract/progress.md", content: progress },
  ],
});
if (!result.ok) throw new Error(result.errors.join("; "));

const { snapshot } = result;
// snapshot.unit, snapshot.phase, snapshot.provenance,
// snapshot.unknowns y snapshot.contradictions son deterministas.
```

El compilador informa de fase actual desconocida en vez de adivinar a partir de
prosa ambigua de progreso. Un `Status: contradicted` declarado se conserva en
`snapshot.contradictions`: enrútalo a resolución del estado del repositorio en
vez de sobrescribirlo.

## Validar o usar otro lenguaje

Los validadores públicos son `validateEnvelopeV2Strict`,
`validateSkillOutcomeV1` y `validateWorkflowSnapshotV1`. Importa un JSON Schema
cuando un consumidor no TypeScript necesite el mismo límite:

```ts
import schema from "@gtrabanco/agentic-workflow-schema/skill-outcome.schema.json" with { type: "json" };
```

En versiones de Node sin atributos de importación JSON, carga el esquema con
`createRequire`. El paquete soporta Node 18 y posteriores.

## Compatibilidad y versionado

`parseTurn` acepta primero v2 estricto y después sólo estas reparaciones legacy
nombradas:

- un `detail` ausente pasa a `null`;
- el `design_candidates` raíz legacy se mueve a `detail.design_candidates`;
- la forma conocida de `audit-pr` puede tomar un id numérico de unidad de un
  contexto fiable coincidente, un recuento de cero issues como `[]` y una fila
  de gate nativa como bloqueante canónico.

Rechaza un recuento de issues no cero sin identidades, un id de unidad no
coincidente y prosa sin estructura. Los diagnósticos de compatibilidad hacen
visible cada reparación al driver.

Los majors del paquete señalan un cambio incompatible en cualquier contrato
publicado. Los campos aditivos son minor; arreglos de parser, documentación o
implementación son patch. Consulta la
[orquestación programática](../../docs/workflow/ORCHESTRATION.es.md) para el
protocolo de driver.
