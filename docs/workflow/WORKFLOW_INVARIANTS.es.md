# Invariantes arquitectónicas del flujo de trabajo

> 🇬🇧 [English version](WORKFLOW_INVARIANTS.md)

Las invariantes arquitectónicas son restricciones duraderas del repositorio.
Protegen los límites que deben mantenerse mientras evolucionan las features,
los fixes, las especificaciones y los detalles de implementación. Son
restricciones, no recomendaciones.

## Alcance y límites

Este documento del flujo define el contrato de evaluación; no prescribe una
tecnología, patrón arquitectónico, modelo de dominio ni reglas concretas de un
proyecto. Los proyectos pueden definir sus propias reglas en
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` (o declarar una ruta equivalente
en su mapa de documentación).

Mantén separadas estas responsabilidades:

| Responsabilidad | Propietario | Quién puede cambiarla |
|---|---|---|
| Especificación de feature | Mitades de producto e ingeniería de la feature | Proceso de diseño/planificación de la feature |
| Arquitectura del repositorio | Docs de arquitectura e invariantes del proyecto | Decisión arquitectónica explícita |
| Arquitectura del flujo | Contrato de flujo de este repositorio | Decisión explícita del flujo y revisión |

Una especificación puede restringir una feature, pero no puede relajar en
silencio una invariante del repositorio. La evolución arquitectónica no es
evolución de implementación.

## Documento de invariantes del proyecto

El documento opcional del proyecto enumera reglas estables con evidencia
suficiente para que un agente las pueda comprobar. Usa una entrada por regla:

```markdown
## AI-001 — <short rule>

- Rule: <property that must remain true>
- Rationale: <why it protects the repository>
- Applies to: <modules, public contracts, or change types>
- Evidence: <paths, tests, commands, or diagrams that establish the rule>
- Change authority: <decision record or named approval path>
```

Las buenas reglas describen propiedad, dirección de dependencias, aislamiento de
capas, compatibilidad de contratos públicos, límites de extensión u
organización del repositorio. No uses este documento para preferencias de estilo,
backlog de features, una decisión tecnológica sin límite estable o una lista de
implementación.

## Protocolo de evaluación

Antes de proponer, planificar, implementar, revisar o auditar un cambio
arquitectónico:

1. Descubre el documento de invariantes declarado en el mapa de documentación
   del proyecto. Si no existe, registra `n/a: no project invariants declared` y
   continúa; los repositorios existentes siguen siendo compatibles.
2. Cuando exista un `docs/workflow/REPOSITORY_STATE.md` congelado, consume antes
   sus hechos respaldados por evidencia y decisiones aceptadas. Inspecciona el
   repositorio directamente solo para un hecho ausente. El repositorio sigue
   siendo la fuente de verdad; la evidencia contradictoria se enruta a
   `resolve-repository-state`.
3. Para cada invariante aplicable, clasifica el cambio propuesto exactamente
   como: `preserves`, `violates`, `introduces` o `changes`.
4. Cita el ID de la invariante y evidencia del repositorio. Nunca infieras una
   regla a partir de una preferencia de implementación o una SPEC de feature.
5. Un resultado `violates`, `introduces` o `changes` detiene el camino normal
   de feature/fix. Exige una decisión arquitectónica explícita que registre la
   regla, justificación, límites afectados, impacto de compatibilidad y plan de
   verificación. Una skill puede informar de la decisión necesaria; no puede
   crearla ni aceptarla en silencio.
6. Cuando exista la decisión, actualiza el documento de invariantes mediante la
   autoridad declarada y retoma el camino apropiado de diseño, planificación o
   ejecución.

## Responsabilidades del flujo

| Rol del flujo | Comportamiento obligatorio |
|---|---|
| `design-feature` y `plan-feature-from-issue` | Clasificar si la capacidad propuesta preserva las invariantes o necesita una decisión arquitectónica antes de marcar el diseño de producto como completo. |
| `plan-feature` y `plan-feature-scaffold` | Registrar las invariantes aplicables y la evidencia/decisión en la mitad de ingeniería; no convertir una violación en una tarea de fase. |
| `execute-phase` | Verificar antes de editar que la fase preserva las invariantes registradas; detenerse ante una violación o una decisión arquitectónica necesaria. |
| `review-change` | Autoritativo para calidad final del diff, completitud del SPEC, clasificación de trabajo de la unidad actual (fix-now / replan-in-unit / decision-required / proposal) y preservación de invariantes. Informa hallazgos; publica recibo REVIEW-PASS ligado al SHA exacto en tabla limpia. Nunca emite MERGE-READY. |
| `audit-pr` | Consume el recibo REVIEW-PASS vigente de review-change (ausente/obsoleto → BLOCKED, nunca re-revisa el diff). Solo posee las puertas de entrega (fases/docs/CI/fusionabilidad/traceabilidad/cierre + resultado de invariantes del recibo). Emite MERGE-READY o BLOCKED con evidencia; nunca edita ni fusiona. |

## Evidencia y compatibilidad

La evaluación de invariantes se basa en evidencia. Tests, comprobaciones de
arquitectura, contratos de API pública, análisis de dependencias y rutas citadas
del repositorio son evidencia válida; la documentación por sí sola no prueba la
implementación. El estado normalizado del repositorio es una fuente opcional de
evidencia compartida, no un requisito ni un sustituto de inspeccionar el
repositorio.

Un documento de invariantes solo puede introducirse o cambiarse mediante el
proceso explícito de decisión arquitectónica del proyecto. Así se impide que una
implementación, sus tests o su SPEC se conviertan en justificación retroactiva
de una deriva.
