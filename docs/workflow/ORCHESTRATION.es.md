# Orquestación programática

> 🇬🇧 [English version](ORCHESTRATION.md)

Las skills son instrucciones orientadas primero a texto. Un driver externo
puede ejecutarlas en modo headless sin convertir cada skill en un prompt JSON
grande: pide un resultado máquina pequeño en el límite de la invocación y lo
combina con hechos compilados desde los documentos del repositorio.

```
  documentos seleccionados + hechos del repositorio ──► WorkflowSnapshot v1
                                                         │
  turno de una skill ──► parseTurn ──► SkillOutcome v1 / Envelope v2
                                                         │
                                                         ▼
                                      política del driver y siguiente invocación
```

El driver es dueño de sesiones, lecturas de archivos, comandos Git/forja,
reintentos, persistencia y autorización. El paquete es dueño de los contratos
portables y el parseo puro:
[`@gtrabanco/agentic-workflow-schema`](../../packages/agentic-workflow-schema/).

## Contratos y propiedad

| Resultado | Productor | Qué contiene | Qué no debe sustituir |
| --- | --- | --- | --- |
| Envelope v2 | `workflow-status` | Estado completo del sensor de solo lectura; contrato legacy estable. | Estado o autorización del driver. |
| SkillOutcome v1 | Una skill de trabajo conducida | Resultado, intent/targets siguientes, bloqueantes, preguntas, descubrimientos y referencias de evidencia. | Hechos del repositorio inferidos desde prosa. |
| WorkflowSnapshot v1 | Driver + paquete | Hechos de documentos seleccionados, estado de fases, procedencia, desconocidos y contradicciones. | Acceso a sistema de archivos, Git o forja dentro del paquete. |

Envelope v2 sigue siendo el contrato de `workflow-status`. `detail` es
obligatorio y todas las extensiones específicas del sensor, incluida
`design_candidates`, viven dentro. El paquete valida de modo estricto los
nuevos resultados v2; `parseEnvelope()` sigue existiendo para consumidores
legacy.

## Conducir un turno

Usa el inventario de perfiles y la instrucción generada, en vez de mantener
otra copia del prompt en cada skill:

```ts
import {
  parseTurn,
  renderOutputInstruction,
  WORKFLOW_SKILL_PROFILES,
} from "@gtrabanco/agentic-workflow-schema";

async function runTurn(skill: string, prompt: string, session: Session) {
  const profile = WORKFLOW_SKILL_PROFILES.find((item) => item.skill === skill);
  if (profile === undefined) throw new Error(`Unsupported skill: ${skill}`);

  let text = await session.invoke(prompt, {
    systemAppend: renderOutputInstruction(skill),
  });
  let parsed = parseTurn({ skill, text, context: { unitId: session.unitId } });

  if (!parsed.ok) {
    text = await session.invoke("Emit only the machine result for the turn above.");
    parsed = parseTurn({ skill, text, context: { unitId: session.unitId } });
  }
  if (!parsed.ok) throw new DriverFailure(skill, parsed.errors);

  journal.append({ skill, source: parsed.source, diagnostics: parsed.diagnostics, outcome: parsed.outcome });
  return parsed;
}
```

El límite de reparación es exactamente una reinvocación de la misma sesión. El
segundo fallo es un `FAILED` del driver; no reintentes indefinidamente ni
parsees prosa arbitraria como ruta. Cuando un proveedor soporte salida
estructurada estricta, usa el JSON Schema seleccionado en el turno final de
resultado pequeño o de reparación, no en un turno de trabajo que aún necesita
prosa o herramientas.

`parseTurn` acepta, en orden: SkillOutcome v1, Envelope v2 estricto,
reparaciones nombradas de envelopes legacy y, después, el único formato de
veredicto nativo fijo que queda, `audit-pr`. No existe otro fallback de prosa.

## Compilar el snapshot antes de decidir

Compila los hechos del proyecto desde los documentos exactos y el estado del
repositorio que el driver ya leyó. El paquete no hace E/S, con lo que la salida
es reproducible y se puede cachear por revisión fuente.

```ts
import { compileWorkflowSnapshot } from "@gtrabanco/agentic-workflow-schema";

const result = compileWorkflowSnapshot({
  sourceRevision: repository.headSha,
  repository,
  documents: await readWorkflowDocuments(repository),
});
if (!result.ok) throw new DriverFailure("snapshot", result.errors);

const snapshot = result.snapshot;
if (snapshot.contradictions.length > 0) {
  await runTurn("resolve-repository-state", "Resolve the declared repository-state contradiction.", session);
}
```

`WorkflowSnapshot v1` expone la feature o fix activa, identificadores y
nombres de fases, procedencia documental, desconocidos explícitos y
contradicciones declaradas del estado del repositorio. No inventa una fase
actual si el progreso es ambiguo. Lee estado específico más rico sólo desde la
carga `detail` de Envelope v2 de `workflow-status`, con su propia forma
documentada.

## Enrutado y suelo de seguridad

El driver puede enrutar por `outcome.status` y `outcome.next`, pero debe
conservar las salvaguardas de las skills:

- `blocked`, `needs-input` y `failed` detienen el avance normal y muestran
  bloqueantes o preguntas canónicas.
- Un descubrimiento fuera de la unidad actual es una propuesta: no debe crear
  silenciosamente un issue ni expandir el límite de aceptación.
- Un bloqueante de alcance de ejecución o estado `HALT` de `workflow-status`
  detiene toda la ejecución.
- Nunca saltes una puerta de review o audit; fusiona sólo tras un resultado
  `MERGE_READY` fresco sobre el head actual y autorización explícita del driver.
- Trata `snapshot.unknowns` como evidencia ausente, no como permiso para
  adivinar.

El driver debe persistir cada resultado parseado, su fuente/diagnósticos, la
revisión fuente y el snapshot compilado de forma solo-anexar. Al reiniciar,
recalcula el snapshot y consulta `workflow-status`: el diario es una hipótesis,
no verdad de fondo.

## Compatibilidad: ayuda de migración, no motor de política

El paquete sólo puede reparar hechos que puede demostrar: `detail` ausente,
`design_candidates` legacy raíz, un id de unidad fiable coincidente, un conteo
de issues igual a cero y las filas de bloqueantes nativas `audit-pr` reportadas.
Rechaza un conteo no cero sin identidades y cualquier valor no coincidente o
inventado. Conserva los diagnósticos en el diario para que una actualización
pueda cuantificar y retirar emisiones legacy.

## Coste y rendimiento

- Mantén estables el prefijo de sistema y la skill seleccionada para conservar
  aciertos de caché de prompts del proveedor.
- Compila sólo los documentos necesarios para la decisión activa y cachea el
  snapshot por revisión; invalídalo tras un turno que cambie el repositorio.
- Pasa resultados estructurados y snapshots entre contextos, no transcripciones
  en bruto.
- Usa el modelo capaz más barato para trabajo mecánico, pero conserva la barra
  de calidad requerida por el proyecto para planificación, revisión y auditoría.

Este protocolo es portable entre agentes interactivos, CLIs, sesiones API y
jobs de CI. Los agentes sin reanudación de sesión pueden hacer la única
reparación en una invocación nueva que contenga el turno anterior, pero deben
mantener el límite de una reparación y registrar ese modo de recuperación más
débil.
