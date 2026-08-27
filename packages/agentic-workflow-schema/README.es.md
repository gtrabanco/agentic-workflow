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

## Recibos de revisión con vínculo de contenido (v1)

Dos nuevos contratos versionados prueban exactamente qué diff evaluó una revisión:

- **CandidateSnapshot v1** — `baseCommit`, `candidateCommit`, `baseTree`,
  `candidateTree`, manifiesto ordenado `changedPaths` y
  `acceptanceFingerprint`. Los validadores estrictos rechazan claves no
  declaradas, algoritmos de hash mezclados, inyección de rutas y estados
  no soportados.
- **ReviewReceipt v1** — `id` opaco, `candidateSnapshotDigest`, vocabulario
  cerrado de `kind` (10 valores), `verdict`, `findings` estructurados y
  `policyVersion`.

### Hash y fingerprint

```ts
import {
  digestCandidateSnapshot,
  digestReviewReceipt,
  computeAcceptanceFingerprint,
  canonicalizeCandidateSnapshot,
  canonicalizeReviewReceipt,
} from "@gtrabanco/agentic-workflow-schema";

const digest = await digestCandidateSnapshot(snapshot);
const fingerprint = await computeAcceptanceFingerprint([{ id: "AC-001", blobSha256: "..." }]);
```

### Predicado de frescura

```ts
import { compareReceiptToCurrentSnapshot } from "@gtrabanco/agentic-workflow-schema";

const result = await compareReceiptToCurrentSnapshot(
  receipt, currentSnapshot, currentAcceptanceInputs, policyVersion
);
// { fresh: true } | { fresh: false, reasonCode: "stale-base-tree" | "stale-candidate-tree" | "stale-manifest" | "stale-acceptance-fingerprint" | "stale-review-policy" }
```

> ⚠️ **La validez del esquema ≠ corrección de la revisión.** Un esquema válido
> prueba que la estructura se preservó, no que la revisión fue precisa. El
 vínculo de contenido es obligatorio: nunca confíes un recibo que no está
 vinculado de contenido al snapshot candidato actual y a la frontera de
 aceptación.

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

Los validadores públicos de contratos son `validateEnvelopeV2Strict`,
`validateSkillOutcomeV1` y `validateWorkflowSnapshotV1`; los contratos de
verificación por etapas añaden exactamente las dos entradas autoritativas nombradas
arriba, `validateVerificationPlanV1` y `validateVerificationReceiptAgainstPlan`.
Importa un JSON Schema cuando un consumidor no TypeScript necesite el mismo límite
estructural:

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

## Decisor de transición del workflow

Exporta `decideWorkflowAction(input)` — una función pura y determinista que
combina un `WorkflowSnapshot v1`, el último `SkillOutcome v1` validado y una
`WorkflowDecisionPolicy` provista por el driver para decidir si puede invocar
la siguiente habilidad, debe refrescar con `workflow-status` o debe detenerse.

```ts
function decideWorkflowAction(input: WorkflowDecisionInput): WorkflowActionDecision
```

- **Elisión segura:** cuando el snapshot está congelado y la habilidad →
  siguiente intento está probada por la tabla congelada
  `WORKFLOW_TRANSITION_TABLE`, el driver invoca directamente sin llamar a
  `workflow-status`.
- **Respaldo obligatorio:** en evidencia ausente, revisión obsoleta, estado
  bloqueado, contradicciones, efectos no autorizados o cualquier transición
  no reconocida, la función retorna `sense` (llamar `workflow-status`) o
  `stop` (terminar).

**Puntos obligatorios de sensor:** ejecución inicial (sin outcome), ejecución
recuperada (revisión obsoleta), snapshot desconocido o contradicho, siguiente
intento no reconocido, y cualquier transición no en la tabla cerrada.

Consulta el [SPEC](../features/24-workflow-transition-decider/SPEC.md) para el
diseño completo, tablas de transición y vocabulario de códigos de razón.

## Contratos de Verificación por Etapas (feature 26)

Dos contratos wire versionados para verificación por etapas:

- `VerificationPlan v1` (`agentic-workflow/verification-plan@1`) — una lista
  de comandos ordenada y no vacía donde cada comando lleva un `id` estable,
  `stage: fast | full`, un `executable` y `args` ordenados (nunca una cadena
  de shell), una política de directorio de trabajo (`candidate-root` o
  `relative-path` con ruta relativa validada), un `timeoutMs` positivo,
  `stopOnFailure` y una clase de coste.

- `VerificationReceipt v1` (`agentic-workflow/verification-receipt@1`) — un
  recibo vinculado al digest del plan, al digest del snapshot candidato y a la
  huella de aceptación, con resultados por comando cuyo `status` (`passed |
  failed | timed-out | skipped | infrastructure-error`), código de salida y
  señal siguen la matriz D4, referencias de evidencia acotadas y un motivo de
  omisión explícito. El veredicto global (`pass | fail | incomplete`) se deriva
  del contenido del recibo.

**Autoridad de validación.** Sólo dos entradas públicas autoritativas deciden la
validez en tiempo de ejecución: `validateVerificationPlanV1(value)` para el plan y
`await validateVerificationReceiptAgainstPlan(receipt, plan)` para el recibo, que
aplica la comprobación estructural y todas las reglas vinculadas al plan en una
sola llamada. No se exporta ningún validador independiente de recibos: un recibo
solo tiene sentido frente al plan al que se vincula. Ambas aceptan entrada
desconocida y devuelven un DTO **normalizado** de propiedades propias, nunca el
objeto recibido; así ningún digest ni ninguna semántica posterior depende de
propiedades heredadas, duplicadas o no declaradas.

**Diagnósticos de fallo.** Un rechazo es `{ ok: false, diagnostics, truncated }`.
`diagnostics` contiene como máximo 50 filas congeladas `{ code, path }` en orden del
documento y `truncated` indica si ese tope descartó alguna. Una fila nunca es un
mensaje: no se devuelve ni prosa ni valores recibidos. `code` pertenece al vocabulario
cerrado `VERIFICATION_DIAGNOSTIC_CODES` y `path` es un puntero RFC 6901 construido
solo con nombres de propiedad declarados e índices de array — `/commands/3/id`,
`/results/1/commandId` o `""` para el documento completo. Una clave no declarada se
informa como `unknown-field` en su **contenedor**, porque el nombre de la clave es
dato enviado por el cliente.

| Código de diagnóstico | Qué responde |
| --- | --- |
| `invalid-type` | un campo tiene un valor del tipo JSON equivocado |
| `missing-field` | falta un campo declarado |
| `unknown-field` | el objeto lleva una propiedad no declarada |
| `invalid-value` | un valor rompe su propia regla (vocabulario, patrón, NUL) |
| `limit-exceeded` | se supera un tope de cardinalidad o de longitud |
| `duplicate-id` | el mismo id de comando aparece dos veces |
| `unknown-command` | un resultado o un motivo de omisión no nombra un comando declarado |
| `invalid-order` | los resultados no siguen el orden declarado del plan |
| `invalid-stage` | el recibo lleva una fila fuera de la etapa solicitada |
| `invalid-exit-state` | código de salida y señal rompen la matriz D4 |
| `invalid-evidence` | una referencia de evidencia está mal formada (reglas D5) |
| `invalid-skip` | el motivo de omisión no se justifica en un fallo previo |
| `invalid-fail-fast` | la secuencia de `stopOnFailure` está rota |
| `digest-mismatch` | el `planDigest` del recibo no es el del plan vinculado |
| `verdict-mismatch` | el veredicto guardado difiere del derivado |
| `budget-exceeded` | los timeouts declarados de una etapa exceden su presupuesto agregado |

**Estado de JSON Schema.** `verification-plan.schema.json` y
`verification-receipt.schema.json` son **proyecciones estructurales generadas y no
autoritativas** de la definición canónica del paquete. Existen para editores y
comprobaciones de transporte; que coincidan con Draft-07 no es validez de contrato,
y las reglas semánticas (`unique-command-ids`, los dos presupuestos agregados de
etapa, los dos presupuestos de bytes canónicos) solo las aplican las dos entradas de
tiempo de ejecución anteriores — cada proyección las declara en su `$comment`. No las
edites a mano: cambia la definición y ejecuta `npm run check:verification-schemas`,
que reconstruye y falla ante cualquier deriva de bytes.
`node scripts/generate-verification-schemas.mjs` es el único que las escribe.

**Modelo de dos etapas:** solicitar `fast` ejecuta solo comandos fast; solicitar
`full` ejecuta todos los comandos fast y full. El predicado de frescura devuelve
códigos estables (`stale-plan | stale-candidate-snapshot |
stale-acceptance-fingerprint | incomplete-missing-results |
incomplete-unjustified-skip | incomplete-stage-coverage`) o `{ fresh: true }`.

**Regla del gate de entrega:** un gate de verificación de entrega se satisface SOLO
con un recibo fresco, que solicite `full` y tenga veredicto `pass`.

**Límite de no-ejecución:** el paquete valida, canonicaliza, digiere, deriva y
compara — no ejecuta comandos. La ejecución es responsabilidad del llamador.

### Límites de usabilidad

Todos los topes de v1 se publican una sola vez, en el objeto congelado
`VERIFICATION_LIMITS`, y los aplican las dos entradas autoritativas: un plan o un
recibo que los excede se rechaza, nunca se trunca en silencio.

| Límite | Valor | Se aplica a |
| --- | --- | --- |
| `commands` | 128 | comandos declarados en un plan |
| `results` | 128 | filas de resultado en un recibo |
| `argsPerCommand` | 64 | argumentos de un comando |
| `idChars` | 128 | un `id` de comando o `commandId` de resultado |
| `pathChars` | 1024 | `executable` y `workingDirectory` |
| `argChars` | 4096 | una cadena de argumento |
| `skipReasonChars` | 1024 | un `skipReason` |
| `evidenceRefChars` | 1024 | una `ref` de evidencia |
| `planBytes` | 262144 | tamaño canónico del plan (256 KiB) |
| `receiptBytes` | 524288 | tamaño canónico del recibo (512 KiB) |
| `fastCommandTimeoutMs` | 600000 | timeout de un comando fast (10 minutos) |
| `fastStageTimeoutMs` | 900000 | suma de los timeouts de todos los comandos fast (15 minutos) |
| `fullCommandTimeoutMs` | 3600000 | timeout de un comando full (60 minutos) |
| `fullStageTimeoutMs` | 7200000 | suma de los timeouts de todos los comandos full (2 horas, 120 min) |
| `diagnostics` | 50 | filas de un resultado de rechazo |

El presupuesto de bytes canónicos se mide antes de examinar el documento, así que un
payload desmedido se rechaza solo por el presupuesto. Los topes de tiempo son
deliberadamente asimétricos: un comando fast de duración máxima deja 5 minutos para
el resto de la etapa fast. `npm run bench:verification -- --commands 128` prueba el
límite de rendimiento declarado — un ciclo en caliente de validar → canonicalizar →
digerir plan+recibo de 128 comandos con p95 ≤ 100 ms — y sale con código distinto de
cero cuando no se cumple.

### Ejemplo de consumo

```ts
import {
  compareVerificationReceiptToCurrent,
  deriveVerificationVerdict,
  digestVerificationPlan,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
} from "@gtrabanco/agentic-workflow-schema";

const candidateDigest = "3f2a9c1e5b7d4f8a0c2e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a";
const acceptanceDigest = "9c4e7b1d3f5a8c2e4b6d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0c24";

// 1. Declare the plan: a fast lint that stops the stage, then a full test run.
const plan = {
  contract: VERIFICATION_PLAN_CONTRACT_ID,
  commands: [
    { id: "lint", stage: "fast" as const, executable: "npm", args: ["run", "lint"],
      workingDirectoryPolicy: "candidate-root" as const, workingDirectory: null,
      timeoutMs: 30_000, stopOnFailure: true, costClass: "cheap" as const },
    { id: "test", stage: "full" as const, executable: "npm", args: ["test"],
      workingDirectoryPolicy: "candidate-root" as const, workingDirectory: null,
      timeoutMs: 120_000, stopOnFailure: false, costClass: "moderate" as const },
  ],
} as const;

const pv = validateVerificationPlanV1(plan);
if (!pv.ok) throw new Error(`plan rejected: ${JSON.stringify(pv.diagnostics)}`);

// 2. Bind the receipt to one candidate and one acceptance manifest. In a real
//    gate `candidateDigest` comes from `digestCandidateSnapshot(snapshot)` and
//    `acceptanceDigest` is the digest of the `ACCEPTANCE.md` blob under review.
const planDigest = await digestVerificationPlan(pv.plan);
const receipt = {
  contract: VERIFICATION_RECEIPT_CONTRACT_ID,
  planDigest,
  candidateSnapshotDigest: candidateDigest,
  acceptanceFingerprint: acceptanceDigest,
  stageRequested: "full" as const,
  results: [
    { commandId: "lint", status: "passed" as const, exitCode: 0, signal: null,
      startedAt: "2026-08-27T09:00:00Z", endedAt: "2026-08-27T09:00:12Z",
      stdout: null, stderr: null, skipReason: null },
    { commandId: "test", status: "passed" as const, exitCode: 0, signal: null,
      startedAt: "2026-08-27T09:00:12Z", endedAt: "2026-08-27T09:02:00Z",
      stdout: { ref: "evidence/test/stdout.log", bytes: 18213,
        sha256: "6b1f4d8a2c5e7b0d3f6a9c2e5b8d1f4a7c0e3b6d9f2a5c8e1b4d7f0a3c6e9b2d" },
      stderr: null, skipReason: null },
  ],
  verdict: "pass" as const,
} as const;

// 3. One call proves receipt structure and plan binding.
const rv = await validateVerificationReceiptAgainstPlan(receipt, plan);
if (!rv.ok) throw new Error(`receipt rejected: ${JSON.stringify(rv.diagnostics)}`);

// 4. A row that ran longer than its command's declared timeout is incoherent.
for (const result of rv.receipt.results) {
  const declared = pv.plan.commands.find((command) => command.id === result.commandId);
  if (declared === undefined || Date.parse(result.endedAt) - Date.parse(result.startedAt) > declared.timeoutMs) {
    throw new Error(`${result.commandId} outran the timeout its command declared`);
  }
}

// 5. The verdict is derived from content; the payload's copy is never trusted.
const derived = deriveVerificationVerdict(rv.receipt, pv.plan); // => "pass"

// 6. Freshness compares the digests the receipt was bound to with the current ones.
const freshness = await compareVerificationReceiptToCurrent(
  rv.receipt, pv.plan, candidateDigest, acceptanceDigest,
);

// 7. The delivery gate needs all three conditions at once.
if (freshness.fresh === true && rv.receipt.stageRequested === "full" && derived === "pass") {
  console.log("Delivery verified");
}
```

### Límite del consumidor

Un dialecto, runner o adaptador de AWL que emita planes y los ejecute **no forma
parte de este paquete**, y ningún issue lo sigue: este schema posee solo los
contratos, las formas canónicas y los digests. Pasa a ser trabajo futuro
independiente cuando AWL consuma el paquete publicado.
