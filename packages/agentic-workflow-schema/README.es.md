# @gtrabanco/agentic-workflow-schema

> 🇬🇧 [English version](README.md)

Contratos máquina sin dependencias de ejecución para
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow). La versión 3
mantiene el envelope establecido de `workflow-status`, pero ofrece a los
drivers headless un resultado menor para las skills de trabajo y estado
determinista compilado desde documentos.

Esa afirmación tiene una forma exacta, y es la forma empaquetada:
`package.json` no declara `dependencies` y ningún módulo de `src/` lleva un
especificador estático de builtin (`from "node:…"`), de modo que el mismo código
se carga en Node, Bun y un navegador. El paquete igualmente usa el SHA-256 del
host cuando el host lo ofrece, de forma oportunista y en cada llamada: ver
«Forma canónica y vectores».

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
`validateSkillOutcomeV1`, `validateWorkflowSnapshotV1`,
`validateCandidateSnapshotV1` y `validateReviewReceiptV1`; los contratos de
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

## Revisión pre-ejecución con base en evidencia (feature 28)

Dos contratos versionados que permiten que un revisor demuestre *qué bytes* juzgó,
antes de que exista código:

- `PreExecutionArtifactSnapshot v1`
  (`agentic-workflow/pre-execution-artifact-snapshot@1`) — el conjunto exacto de
  artefactos y los contextos autoritativos en los que la revisión pudo apoyarse,
  en una revisión de fuente y una revisión causal de artefactos.
- `PreExecutionReviewReceipt v1` (`agentic-workflow/pre-execution-review-receipt@1`)
  — el veredicto de un revisor sobre un snapshot, con hallazgos estructurados,
  identidad de autor opaca y una topología de padres opcional.

Son contratos **pre-ejecución**. Son distintos de
`CandidateSnapshotV1`/`ReviewReceiptV1` (que atan un candidato construido) y de
`VerificationPlanV1`/`VerificationReceiptV1` (que atan la ejecución de comandos).
Ningún contrato de esta familia sustituye a otro: un recibo de candidato o de
verificación nunca valida como recibo pre-ejecución, y ninguna aprobación sobrevive
a un cambio en lo que fue aprobado.

### Entradas públicas

| Entrada | Contrato |
| --- | --- |
| `validatePreExecutionArtifactSnapshotV1(value)` | `{ ok, snapshot?, diagnostics, truncated }` |
| `validatePreExecutionReviewReceiptV1(value)` | `{ ok, receipt?, diagnostics, truncated }` |
| `validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, policyVersion)` | la única autoridad de PASS |
| `buildPreExecutionArtifactSnapshot(input)` | constructor del conjunto por etapa sobre bytes del llamante |
| `selectSpecProduct(text)` | proyección determinista `spec-product-v1` |
| `canonicalizePreExecutionArtifactSnapshot(snapshot)` | JSON canónico |
| `digestPreExecutionArtifactSnapshot(snapshot)` | SHA-256 hexadecimal en minúsculas |
| `canonicalizePreExecutionReviewReceipt(receipt)` / `digestPreExecutionReviewReceipt(receipt)` | el mismo par para recibos |
| `comparePreExecutionReceiptToSnapshot(receipt, reviewed, current, policyVersion)` | decisión de frescura |

Toda entrada acepta `unknown`, nunca lanza con entrada hostil y responde con el
vocabulario cerrado y redactado `PRE_EXECUTION_DIAGNOSTIC_CODES`: solo códigos y
punteros de campo, jamás un valor enviado.

### Identificadores de contrato

Los dos discriminantes `contract` se exportan como
`PRE_EXECUTION_SNAPSHOT_CONTRACT_ID` y
`PRE_EXECUTION_RECEIPT_CONTRACT_ID`; el nombre de la proyección de Producto en la
etapa SPEC es `PRE_EXECUTION_SNAPSHOT_SELECTOR` (`spec-product-v1`). Compáralos por
igualdad de cadenas — un snapshot o recibo cuyo `contract` sea cualquier otro valor
se rechaza con `invalid-value`, y así un documento de candidato, de verificación o
de una versión futura no se confunde con esta familia.

### Vocabularios cerrados

Cada valor siguiente se exporta como array congelado; nada fuera de ellos valida.
`PRE_EXECUTION_RUNTIME_RULES` publica la misma división que describe la prosa —
`{ snapshot: [...], receipt: [...] }`, cada fila `{ id, claim }` — para que un
conductor pueda mostrar las garantías que el schema no puede expresar.

| Export | Values and meaning |
| --- | --- |
| `PRE_EXECUTION_STAGES` | `spec` · `plan` — Las dos etapas de revisión. Define el conjunto de artefactos requerido y la matriz de veredictos. |
| `PRE_EXECUTION_UNIT_KINDS` | `feature` · `fix` — Una unidad `fix` no tiene mitad de Producto, así que no tiene snapshot de etapa SPEC. |
| `PRE_EXECUTION_POLICY_VERSION` | `v1` — La versión de política de revisión a la que se ata un receipt. Un cambio de política rota el eje `stale-policy`, así que un receipt revisado bajo otra versión ya no bendice un veredicto. La única autoridad que el CLI de snapshot lee en lugar de un literal hardcodeado. |
| `PRE_EXECUTION_ARTIFACT_KINDS` | `spec` · `acceptance` · `plan` · `tasks` · `testing` · `decisions` · `architecture-notes` · `planning-evidence` · `obligations` — Los roles que un documento atado puede desempeñar. |
| `PRE_EXECUTION_SELECTORS` | `whole-file` · `spec-product-v1` — Cómo se eligieron los bytes atados dentro del archivo. |
| `PRE_EXECUTION_CONTEXT_KINDS` | `roadmap-row` · `governing-issue` · `normalized-repository-state` · `architectural-invariants` · `dependency-unit` · `project-guide` — Autoridades en las que el revisor pudo apoyarse. |
| `PRE_EXECUTION_CONTEXT_PRESENCE` | `present` · `absent` — `absent` es un hecho registrado, no un campo omitido. |
| `PRE_EXECUTION_VERDICTS` | `spec-review-pass` · `spec-review-fail` · `plan-review-pass` · `plan-review-fail` · `needs-design` — Cada veredicto nombra la etapa donde es legal. |
| `PRE_EXECUTION_FINDING_SEVERITIES` | `info` · `low` · `medium` · `high` · `critical` — `info` nunca bloquea un PASS por sí solo. |
| `PRE_EXECUTION_FINDING_CLASSES` | `product` · `plan` · `source` · `environment` · `runtime` — A qué capa del contrato pertenece el hallazgo. |
| `PRE_EXECUTION_FINDING_VERIFICATION` | `verified` · `unverified` — Solo los hallazgos materiales `verified` pueden sostener un PASS. |
| `PRE_EXECUTION_FINDING_RESOLUTIONS` | `open` · `resolved` · `dismissed` — `dismissed` exige contrarevidencia registrada. |
| `PRE_EXECUTION_REVIEW_ROLES` | `reviewer` · `critic` · `synthesizer` · `arbiter` — Qué es este recibo dentro de la topología. |
| `PRE_EXECUTION_PARENT_ROLES` | `critic` · `synthesis` · `arbitration` — Qué fue el recibo padre — no hay quórum sobre ellos. |
| `PRE_EXECUTION_AUTHOR_EXCLUSIONS` | `enforced` · `not-enforceable` — Si el runtime puede probar que el revisor no creó el conjunto de artefactos. |
| `PRE_EXECUTION_MODEL_DIVERSITY` | `same-model` · `cross-model` · `not-applicable` — Una etiqueta veraz, nunca un umbral. |
| `PRE_EXECUTION_FRESHNESS_CODES` | `invalid-stage` · `invalid-unit` · `stale-policy` · `stale-context` · `stale-source-revision` · `stale-parent` · `stale-artifact-revision` · `stale-artifact-content` · `missing-receipt-snapshot` — Precedencia ordenada: ver Frescura. |
| `PRE_EXECUTION_DIAGNOSTIC_CODES` | `invalid-type` · `missing-field` · `unknown-field` · `invalid-value` · `limit-exceeded` · `duplicate-id` · `unknown-command` · `invalid-order` · `invalid-stage` · `invalid-exit-state` · `invalid-evidence` · `invalid-skip` · `invalid-fail-fast` · `digest-mismatch` · `verdict-mismatch` · `budget-exceeded` · `missing-artifact-kind` · `invalid-artifact-set` · `invalid-selector` · `invalid-author` · `invalid-context` · `invalid-topology` · `stale-snapshot` · `stale-policy` — Redactado: solo códigos y punteros, jamás un valor enviado. |

### Qué ata el snapshot

`contract`, `stage` (`spec | plan`), `unitKind` (`feature | fix`), `unitId`,
`sourceRevision` (object id git de 40 o 64 hex), `artifactRevisionId` (la revisión
causal — una rotación deliberada aunque el contenido revierta), `artifacts[]`,
`contexts[]` y `parentSpecSnapshotDigest` (null si y solo si `stage === "spec"`).

Cada fila de artefacto es `{ kind, path, selector, byteLength, digest }`:

- `kind` ∈ `PRE_EXECUTION_ARTIFACT_KINDS` (`spec`, `acceptance`, `plan`, `tasks`,
  `testing`, `decisions`, `architecture-notes`, `planning-evidence`,
  `obligations`).
- `path` es relativo al repositorio y normalizado — se rechazan las rutas
  absolutas, las de letra de unidad, las barras invertidas, los segmentos `.`/`..`,
  los separadores finales y los segmentos vacíos.
- `selector` ∈ `whole-file | spec-product-v1`. La etapa SPEC ata su fila `spec`
  con `spec-product-v1` y con nada más; la etapa Plan ata archivos completos.
- `byteLength`/`digest` describen la **selección**, no el archivo.

Los conjuntos requeridos dependen de la etapa: SPEC = exactamente la fila `spec`
proyectada; Plan = `spec` + `acceptance`, más lo que exista para el tamaño de la
unidad (`plan`, `tasks`, `testing`, `decisions`, `architecture-notes`,
`planning-evidence`, `obligations`). Una unidad `fix` no tiene mitad de Producto, así
que no tiene snapshot de etapa SPEC — la revisión de Plan es su gate pre-ejecución.

Cada fila de contexto es `{ kind, identifier, presence, digest }` con `kind` ∈
`roadmap-row | governing-issue | normalized-repository-state |
architectural-invariants | dependency-unit | project-guide`. `presence` es
`present | absent`; una autoridad presente lleva su digest de 64 hex y una ausente
ata exactamente `null`. La ausencia es un hecho registrado, no un campo omitido.

Las filas tienen un orden canónico — artefactos por bytes UTF-8 de la ruta,
contextos por `kind` y luego `identifier` — y las identidades son únicas en cada lista.

### Las reglas de colección viven en el runtime, no en el schema

Las proyecciones publicadas
([`pre-execution-artifact-snapshot.schema.json`](./pre-execution-artifact-snapshot.schema.json),
[`pre-execution-review-receipt.schema.json`](./pre-execution-review-receipt.schema.json))
se generan de la misma definición interna que aplica el runtime, así que nunca
pueden contradecirla. Draft 07 no tiene forma de expresar propiedades **de una
colección** (orden por bytes de ruta, unicidad por ruta/`kind`, la matriz
etapa↔selector, unicidad de identidades de contexto), por lo que esas reglas —
`artifact-rows-ordered`, `artifact-kinds-unique`, `artifact-paths-unique`,
`context-rows-ordered`, `context-identities-unique`,
`spec-artifact-uses-product-selector`, `stage-selector-matrix` — las aplica solo este
paquete. Valídalas aquí; no confíes en un validador draft-07 de terceros para
rechazar un snapshot desordenado.

### Veredictos, hallazgos y la autoridad del PASS

`verdict` ∈ `spec-review-pass | spec-review-fail | plan-review-pass |
plan-review-fail | needs-design`, y el veredicto debe coincidir con la etapa del
snapshot. Un hallazgo es `{ id, severity, class, claim, evidenceRefs, verification,
resolution, resolutionEvidence }` con `severity` ∈ `info | low | medium | high |
critical`, `class` ∈ `product | plan | source | environment | runtime`,
`verification` ∈ `verified | unverified` y `resolution` ∈ `open | resolved |
dismissed`. Todo hallazgo lleva al menos una referencia de evidencia, y un
descarte exige contrarevidencia registrada.

`validatePreExecutionReceiptAgainstSnapshot` es la única entrada que puede bendecir
un PASS. Lo rechaza mientras algún hallazgo material esté abierto o sin verificar
(los de severidad `info` nunca bloquean por sí solos), mientras el recibo ate otro
snapshot, mientras la versión de política difiera, cuando la exclusión de autor
declarada se viole bajo `enforced`, o cuando la identidad del revisor haya creado
el conjunto de artefactos (`invalid-author`). Los recibos padres modelan una topología
critic/synthesis/arbitration acotada (`role` ∈ `critic | synthesis | arbitration`,
`receiptDigest` único) — **no hay quórum**: los votos nunca borran un hallazgo
material sin resolver, y `modelDiversity` es una etiqueta veraz
(`same-model | cross-model | not-applicable`), nunca un umbral.

### Frescura

`comparePreExecutionReceiptToSnapshot` responde `{ fresh: true }` o
`{ fresh: false, reasonCode }` desde el vocabulario cerrado
`PRE_EXECUTION_FRESHNESS_CODES`, con esta precedencia fija: `stale-policy` →
`stale-context` → `stale-source-revision` → `stale-parent` →
`stale-artifact-content` → `stale-artifact-revision` → `missing-receipt-snapshot`,
y `invalid-stage` / `invalid-unit` se rechazan antes de comparar. Como una reversión
que rota `artifactRevisionId` sigue cambiando el digest del snapshot, un PASS antigo
no puede resucitar editando un documento de vuelta a sus bytes anteriores.

### Límites publicados

`PRE_EXECUTION_LIMITS` (todos los topes exactos; un único sumidero de diagnósticos
compartido con las otras familias):

```
artifacts 32 · contexts 16 · findings 64 · evidencePerFinding 8
parentReceipts 8 · receiptDiagnostics 8 · diagnostics 50
unitIdChars 128 · revisionIdChars 128 · idChars 128 · identifierChars 160
pathChars 1024 · claimChars 2048 · evidenceChars 1024
resolutionEvidenceChars 2048 · policyChars 64 · diagnosticChars 512
artifactBytes 4194304 · snapshotBytes 32768 · receiptBytes 65536
```

### Forma canónica y vectores

La canonicalización ordena las claves de los objetos, preserva el orden declarado de
los arrays, emite UTF-8 sin espacios y rechaza hojas fuera del modelo de datos JSON.
Los digests son SHA-256 en minúsculas sobre esos bytes canónicos. Cuatro payloads se
publican en `PRE_EXECUTION_CANONICAL_VECTORS` (ambas etapas × ambos contratos); la
suite reproduce cada digest desde su fixture de forma independiente con `node:crypto`,
así que un cambio en el serializador rompe un test en lugar de mover en silencio la
linaje de un consumidor.

El digest síncrono (`sha256HexSync`, que usa el constructor de artefactos) responde
desde el SHA-256 nativo del host siempre que el host exponga uno mediante
`globalThis.process?.getBuiltinModule?.("crypto")` —Node v22.3.0 y v20.16.0 o
posteriores, y Bun; los navegadores no exponen ese binding— y desde el núcleo puro
de JavaScript FIPS 180-4 del paquete en todo lo demás. El binding se busca en cada
llamada y nunca se cachea, así que un bundle que cambia de host no puede quedar
anclado a un veredicto viejo, y un digest nunca lanza un error porque un builtin del
host haya fallado. Ambos caminos devuelven un único digest idéntico, SHA-256 en
minúsculas de 64 caracteres, para bytes idénticos; el caso de tres caminos en
`test/pre-execution-canonical.test.mjs` enfrenta nativo, JS puro y WebCrypto
asíncrono, y `npm run probe:sha256-paths` imprime los digests y el coste por camino
en tu host (solo verificación: no escribe nada).

```bash
npm run gate:pre-execution   # tests + drift de schemas + checks de paquete + pack
```

### Ejemplo de uso

```ts
import {
  buildPreExecutionArtifactSnapshot,
  comparePreExecutionReceiptToSnapshot,
  digestPreExecutionArtifactSnapshot,
  selectSpecProduct,
  validatePreExecutionReceiptAgainstSnapshot,
} from "@gtrabanco/agentic-workflow-schema";

const POLICY_VERSION = "2026-08-30";

// The caller reads the documents: this package never touches Git or the filesystem.
const spec = [
  "# Toy feature", "", "## Goal", "", "Ship one usable slice.", "",
  "## Branch", "", "`feat/toy`", "", "## Size", "", "`S`", "",
  "## Dependencies", "", "- none", "", "## Product half", "", "### Scope", "",
  "- **S1:** the slice.", "", "## Design status", "", "`designed`", "",
].join("\n");

/** 1. Freeze the exact bytes a reviewer may rely on, at one causal revision. */
async function freeze(artifactRevisionId: string) {
  const built = buildPreExecutionArtifactSnapshot({
    stage: "spec",
    unitKind: "feature",
    unitId: "toy",
    sourceRevision: "8ab22ea6c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    artifactRevisionId,
    files: [{ kind: "spec", path: "docs/features/toy/SPEC.md", content: spec }],
    contexts: [{ kind: "governing-issue", identifier: "#146", content: "the issue body" }],
  });
  const snapshot = built.ok ? built.snapshot : undefined;
  if (!snapshot) throw new Error(JSON.stringify(built.diagnostics));
  return snapshot;
}

const snapshot = await freeze("rev-0001");

// 2. A reviewer records a verdict bound to that digest, never to the mutable file.
const receipt = {
  contract: "agentic-workflow/pre-execution-review-receipt@1",
  id: "review-0001",
  stage: snapshot.stage,
  snapshotDigest: digestPreExecutionArtifactSnapshot(snapshot),
  verdict: "spec-review-pass",
  findings: [],
  reviewer: "reviewer-7",
  sessionId: "session-7",
  reviewerRole: "reviewer",
  authorId: "author-3",
  authorExclusion: "enforced",
  contextClean: true,
  modelDiversity: "cross-model",
  policyVersion: POLICY_VERSION,
  startedAt: "2026-08-30T00:00:00Z",
  finishedAt: "2026-08-30T00:04:00Z",
  parentReceipts: [],
  diagnostics: [],
};

// 3. Only this entry can bless a PASS; it answers with codes, never submitted values.
const blessed = validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, POLICY_VERSION);
if (!blessed.ok) throw new Error(JSON.stringify(blessed.diagnostics));

// 4. Before executing, freeze again: unchanged authority stays fresh.
const fresh = comparePreExecutionReceiptToSnapshot(
  receipt, snapshot, await freeze("rev-0001"), POLICY_VERSION,
);
if (fresh.fresh !== true) throw new Error(JSON.stringify(fresh));

// 5. Edit, revert, and rotate the revision anyway and the PASS is void: a stale
//    approval can never be resurrected by restoring the previous bytes.
const stale = comparePreExecutionReceiptToSnapshot(
  receipt, snapshot, await freeze("rev-0002"), POLICY_VERSION,
);
if (stale.fresh === true || stale.reasonCode !== "stale-artifact-revision") {
  throw new Error(JSON.stringify(stale));
}

// 6. The projection is why a plan-side write cannot erase Product lineage: the
//    selector never saw anything outside the named Product headings.
const projection = selectSpecProduct(`${spec}\n## Engineering half\n\n### Phases\n\n- P1\n`);
if (projection.ok !== true) throw new Error(JSON.stringify(projection.errors));
if (projection.content.includes("Engineering half")) throw new Error("the projection leaked");

console.log("review bound", projection.byteLength, receipt.snapshotDigest.slice(0, 12), fresh, stale);
```

## Contratos de Verificación por Etapas (feature 26)

Dos contratos wire versionados para verificación por etapas:

- `VerificationPlan v1` (`agentic-workflow/verification-plan@1`) — una lista
  de comandos ordenada y no vacía donde cada comando lleva un `id` estable,
  `stage: fast | full` (vocabulario cerrado `VERIFICATION_STAGES`), un
  `executable` y `args` ordenados (nunca una cadena
  de shell), una política de directorio de trabajo (`candidate-root` o
  `relative-path` con ruta relativa validada), un `timeoutMs` positivo,
  `stopOnFailure` y una clase de coste (`VERIFICATION_COST_CLASSES`). La ruta relativa validada es una cadena
  **opaca**: resuélvela bajo la raíz candidata exactamente como se envió y nunca
  la decodifique por porcentaje (percent-decode) antes de resolverla — la
  decodificación puede convertir una ruta que el validador rechazó en una que
  escapa de la raíz.

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
dato enviado por el cliente. Recupérate de los diagnósticos usando solo cada `code`
y `path` estables, sin copiar los valores enviados a logs, errores ni telemetría.

| Código de diagnóstico | Qué responde | Recuperación del llamador |
| --- | --- | --- |
| `invalid-type` | un campo tiene un valor del tipo JSON equivocado | Proporciona el tipo JSON declarado en `path`. |
| `missing-field` | falta un campo declarado | Añade el campo requerido en `path`. |
| `unknown-field` | el objeto lleva una propiedad no declarada | Elimina claves no declaradas del contenedor en `path`. |
| `invalid-value` | un valor rompe su propia regla (vocabulario, patrón, NUL) | Sustitúyelo por un miembro permitido o un valor con formato válido y sin NUL. |
| `limit-exceeded` | se supera un tope de cardinalidad o de longitud | Reduce la colección o cadena indicada hasta `VERIFICATION_LIMITS`. |
| `duplicate-id` | el mismo id de comando aparece dos veces | Asigna ids de comando únicos y actualiza sus referencias de resultado. |
| `unknown-command` | un resultado o un motivo de omisión no nombra un comando declarado | Referencia un id declarado por el plan vinculado. |
| `invalid-order` | los resultados no siguen el orden declarado del plan | Reordena las filas de resultado según el orden del plan. |
| `invalid-stage` | el recibo lleva una fila fuera de la etapa solicitada | Elimina filas fuera de etapa o solicita la etapa que las incluye. |
| `invalid-exit-state` | código de salida y señal rompen la matriz D4 | Alinea `exitCode` y `signal` con la matriz del status de la fila. |
| `invalid-evidence` | una referencia de evidencia está mal formada (reglas D5) | Proporciona `ref` acotada, bytes no negativos y SHA-256 en minúsculas. |
| `invalid-skip` | el motivo de omisión no se justifica en un fallo previo | Usa `null` sin atribución o nombra un trigger non-pass anterior real. |
| `invalid-fail-fast` | la secuencia de `stopOnFailure` está rota | Marca como omitidas las filas posteriores y atribúyelas al trigger. |
| `digest-mismatch` | el `planDigest` del recibo no es el del plan vinculado | Recalcúlalo desde el plan vinculado validado y normalizado. |
| `verdict-mismatch` | el veredicto guardado difiere del derivado | Guarda el resultado de `deriveVerificationVerdict`. |
| `budget-exceeded` | los timeouts declarados de una etapa exceden su presupuesto agregado | Reduce timeouts hasta que la suma quede dentro de `VERIFICATION_LIMITS`. |

**Estado de JSON Schema.** `verification-plan.schema.json` y
`verification-receipt.schema.json` son **proyecciones estructurales generadas y no
autoritativas** de la definición canónica del paquete. Existen para editores y
comprobaciones de transporte; que coincidan con Draft-07 no es validez de contrato,
y las reglas semánticas (`unique-command-ids`, los dos presupuestos agregados de
etapa, los dos presupuestos de bytes canónicos) solo las aplican las dos entradas de
tiempo de ejecución anteriores — cada proyección las declara en su `$comment`. Las
proyecciones se generan en vez de editarse a mano. En un checkout del código fuente,
los mantenedores cambian la definición canónica; el único escritor es
`node scripts/generate-verification-schemas.mjs` y la comprobación de deriva exclusiva
del código fuente reconstruye antes de comparar bytes.

**Solo en un checkout del código fuente.** El tarball publicado omite
intencionadamente `scripts/`, `test/`, el código fuente y la configuración de
TypeScript del repositorio. Estos comandos del manifiesto son comprobaciones para
mantenedores en un checkout fuente, no comandos ejecutables por consumidores del
paquete instalado:

| Comando solo para checkout fuente | Propósito |
| --- | --- |
| `npm run check:verification-schemas` | reconstruir y comparar por bytes las proyecciones generadas |
| `npm run check:verification-package` | inspeccionar el contrato del tarball del paquete |
| `npm run bench:verification -- --commands 128` | ejecutar el benchmark AC10 en proceso caliente |
| `npm run test:verification-docs` | ejecutar la suite bilingüe de documentación |
| `npm run gate:verification` | componer todas las comprobaciones de release de verificación |

**Modelo de dos etapas:** solicitar `fast` ejecuta solo comandos fast; solicitar
`full` ejecuta todos los comandos fast y full. El predicado de frescura devuelve
uno de los códigos estables de `VERIFICATION_FRESHNESS_CODES` (`stale-plan | stale-candidate-snapshot |
stale-acceptance-fingerprint | incomplete-missing-results |
incomplete-unjustified-skip | incomplete-stage-coverage`) o `{ fresh: true }`.

**Regla del gate de entrega:** un gate de verificación de entrega se satisface SOLO
con un recibo fresco, que solicite `full` y tenga veredicto `pass`.

**Límite de no-ejecución:** el paquete valida, canonicaliza, digiere, deriva y
compara — no ejecuta comandos. La ejecución es responsabilidad del llamador.

### Inventario de la API pública de verificación

La superficie completa en runtime de estos contratos es:

| Grupo de runtime | Exports |
| --- | --- |
| Contratos y vocabularios | `VERIFICATION_PLAN_CONTRACT_ID`, `VERIFICATION_RECEIPT_CONTRACT_ID`, `VERIFICATION_STAGES`, `VERIFICATION_COST_CLASSES`, `VERIFICATION_COMMAND_STATUSES`, `VERIFICATION_VERDICTS`, `VERIFICATION_DIAGNOSTIC_CODES`, `VERIFICATION_FRESHNESS_CODES`, `VERIFICATION_LIMITS`, `VERIFICATION_CANONICAL_VECTORS` |
| Validación y semántica | `validateVerificationPlanV1`, `validateVerificationReceiptAgainstPlan`, `deriveVerificationVerdict`, `compareVerificationReceiptToCurrent` |
| Canonicalización y digests | `canonicalizeVerificationPlan`, `canonicalizeVerificationReceipt`, `digestVerificationPlan`, `digestVerificationReceipt` |

TypeScript también publica estos nombres de solo tipo:

| Grupo de tipos | Exports |
| --- | --- |
| Plan | `VerificationStage`, `VerificationCostClass`, `WorkingDirectoryPolicy`, `VerificationCommandV1`, `VerificationPlanV1`, `VerificationPlanValidationResult` |
| Recibo | `VerificationCommandStatus`, `VerificationVerdict`, `VerificationStageRequest`, `EvidenceReferenceV1`, `VerificationResultV1`, `VerificationReceiptV1`, `VerificationReceiptValidationResult` |
| Diagnósticos y frescura | `VerificationDiagnosticCode`, `VerificationDiagnosticV1`, `VerificationFreshnessReasonCode`, `VerificationFreshnessResult` |

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
el resto de la etapa fast. `npm run bench:verification -- --commands 128` es un
comando de mantenedor solo para checkout fuente: ejecútalo desde un checkout del
código fuente, nunca desde el tarball instalado, y prueba el límite de rendimiento
declarado — un ciclo en caliente de validar → canonicalizar → digerir plan+recibo
de 128 comandos con p95 ≤ 100 ms — y sale con código distinto de cero cuando no se
cumple. La interoperabilidad entre implementaciones la fija
`VERIFICATION_CANONICAL_VECTORS`: los fixtures congelados
`{ contract, digest, description }` cuyos digests debe reproducir cualquier
canonicalizador correcto — los tests de digests del propio paquete consumen
exactamente estos payloads.

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
//    `acceptanceDigest` comes from `computeAcceptanceFingerprint(rows)`, which
//    hashes the ordered `{ id, blobSha256 }` acceptance rows — not the raw
//    `ACCEPTANCE.md` blob itself.
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
