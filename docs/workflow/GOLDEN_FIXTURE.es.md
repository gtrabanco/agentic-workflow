# Procedimiento del fixture dorado

> 🇬🇧 [English version](GOLDEN_FIXTURE.md)

Una prueba de humo repetible para el redactado de las skills: ejecutar una
feature de juguete pequeña y fija a través de una skill modificada **con
el modelo más débil de tu flota**, y comprobar que su salida contractual
se mantiene. Esto es la U9 del backlog de 2026-07-09
([#19](https://github.com/gtrabanco/agentic-workflow/issues/19)); cierra
el hueco de aplicación que la feature 08 (`phase-economics`) le dejó
diferido (`docs/features/08-phase-economics/known-issues.md`).

## Propósito

La sección "Checklists over heuristics" de CLAUDE.md promete que cada
skill "must run correctly on any agent and any model". Esa promesa no
está probada: los cuerpos de las skills se reescriben libremente, y un
cambio de redacción que un modelo puntero absorbe sin problema puede
romper silenciosamente a un modelo local débil (Qwen3.6 35B / Gemma4 26B)
que ejecuta una fase — una casilla del contrato de turno omitida, un
bloque de salida fijo renderizado de forma laxa, un paso inventado. Este
procedimiento detecta esa regresión antes de que se publique, manualmente,
sin infraestructura.

## Cuándo ejecutarlo

Tras editar cualquier skill del **camino ejecutor**: `execute-phase`,
`plan-feature`, `plan-feature-scaffold`, `plan-feature-from-issue`,
`design-feature`, o cualquier skill del paquete `review-*`. Opcional pero
recomendado antes de abrir el PR de esa edición.

## El fixture

Una feature de juguete fija — **"añadir un comando de exportación CSV"**
— con un SPEC de juguete preescrito y el texto de issue de una línea que
representa.

Para skills que toman una idea en bruto o un issue como entrada
(`design-feature`, `plan-feature-from-issue`), usa esta línea única en
lugar del SPEC de abajo:

> Add an `export-csv` command to the toy CLI that writes the current
> in-memory record list to a CSV file at a given path.

Para cualquier otra skill del camino ejecutor (`execute-phase`,
`plan-feature`, `plan-feature-scaffold`, el paquete `review-*`), usa el
SPEC de juguete preescrito de abajo — ya está `designed`, así que esas
skills pueden ejecutarse directamente contra él. Copia el bloque que
necesites a una ubicación de borrador (p. ej. tu scratchpad); **no** lo
confirmes como una carpeta de feature bajo `docs/features/`.

```markdown
# 99 — csv-export-command

## Goal

Add a `export-csv` command to the toy CLI that writes the current in-memory
record list to a CSV file at a given path.

## Branch

`feat/99-csv-export-command`

## Size

`XS` — single command, no new dependencies, 2 phases.

## Dependencies

None.

## Product half

### Context

Users currently can only view records on screen; they want a file they can
open in a spreadsheet.

### Scope

#### In scope
- `export-csv <path>` command: writes all records to `<path>` as CSV
  (header row + one row per record).

#### Out of scope
- Filtering, sorting, or partial export — always exports the full record set.

### Acceptance criteria
- Running `export-csv out.csv` creates `out.csv` with a header row and one
  data row per record.
- Running it with no records writes a header-only file (exit 0).

## Design status

`designed`

## Engineering half

### Design

One new command handler that serializes the in-memory record list to CSV and
writes it to the given path; reuse the project's existing file-write helper
if one exists.

### Phases

#### P1 — implement `export-csv`

- [ ] Command handler writes a header row + one row per record to `<path>`
- [ ] Empty record set → header-only file, exit 0

#### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the roadmap row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat
- [ ] Update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push
```

## El procedimiento

1. **Elige la skill modificada** — la cuyo `SKILL.md` acabas de editar.
2. **Configura el agente al modelo más débil de tu flota** — nombra el
   suelo actual (Qwen3.6 35B / Gemma4 26B) si no tienes uno más débil
   disponible; en caso contrario usa el que sea más débil en tu flota hoy.
3. **Ejecuta la skill modificada contra el fixture**, siguiendo su
   `SKILL.md` literalmente — sin ayuda extra, sin rellenar huecos que el
   modelo debería rellenar por sí mismo.
4. **Observa la salida** contra los criterios de aprobación fijos de
   abajo.

## Smoke test de tool calling (precondición del modelo)

Las skills del camino ejecutor solo funcionan si el modelo sabe manejar tools
(leer/editar ficheros, ejecutar comandos). Antes de confiar en **cualquier
modelo aún no validado para function calling estilo OpenAI** en el camino
ejecutor — los providers suelen validar el tool calling en unos modelos y no
en otros (p. ej. el tool calling de Gemma4 está documentado en un formato
XML, no en el esquema `tools` de OpenAI) — ejecuta esto una vez por modelo,
antes del paso 3 de arriba:

1. Envía una petición de chat con una sola tool trivial definida (p. ej.
   `get_time`, sin parámetros) y un prompt que la exija ("¿Qué hora es? Usa
   la tool.").
2. Aprueba solo si: ✓ `finish_reason` es `tool_calls`; ✓
   `choices[0].message.tool_calls[0].function.name` nombra la tool; ✓
   `arguments` es JSON parseable (aquí: `{}`).
3. Cualquier otra forma (la llamada narrada en prosa, XML en `content`,
   `tool_calls` vacío) = **FAIL** — no uses ese modelo para ejecuciones del
   camino ejecutor; aún puede servir en roles no agénticos (prosa de revisión
   de un solo turno, visión).

Registra el resultado como una fila del log de ejecuciones (columna
`Skill(s)`: `tool-calling smoke`).

## Criterios de aprobación fijos

Aprueba solo si **todas** las casillas se cumplen:

- ✓ Cada bloque de salida fijo se imprime **exactamente** como se
  contrató (bloques `Return exactly`, checklists, veredictos
  `PASS | FAIL`, casillas del contrato de turno) — no parafraseado, no
  renderizado parcialmente.
- ✓ Se mantuvo la disciplina de rama y commit — ramificado desde `main`,
  mensaje de commit convencional, nunca se trabajó directamente sobre
  `main`.
- ✓ **Sin pasos inventados** más allá de lo que declara el `SKILL.md` de
  la skill.
- ✓ Se imprimió el bloque de cierre `→ Next:`.

Cualquier casilla sin marcar = **FAIL**. El arreglo es un ajuste de
redacción de la skill (un cambio separado y dirigido) — según la nota de
dirección de dependencia de la feature 08, este procedimiento solo saca a
la luz la regresión, nunca edita la skill él mismo.

## Registro de ejecuciones

Una fila por ejecución. Añade una fila después de cada ejecución para que
la cobertura se mantenga auditable a lo largo del tiempo.

| Fecha | Modelo | Skill(s) + versión | Resultado | Nota |
|------|-------|--------------------|--------|------|
| 2026-07-10 | Qwen3.6 35B | `execute-phase` 1.x | PASS | fila de ejemplo — reemplazar en la primera ejecución real |
| 2026-07-12 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `plan-feature` 3.1.0, `plan-feature-scaffold` 1.9.0 (fix #51) | PASS | Dos ejecuciones reales contra el fixture (`docs/features/99-csv-export-command`, copias en scratch): (A) fila del roadmap preestablecida en `planned` → `plan-feature 99-csv-export-command` se detuvo correctamente en el cortocircuito de ya-planificada, imprimió el bloque exacto `→ Next: /execute-phase 99 P1 …` verbatim, nunca invocó `plan-feature-scaffold`, no tocó ningún archivo. (B) fila preestablecida en `defined` → enrutó a través de `plan-feature-scaffold`, que escribió `defined → planned` y luego realizó un **paso de relectura distinto** (llamada `Read` separada tras el `Edit`) confirmando que la fila leía literalmente `planned` antes de terminar el turno; el informe de finalización coincidió con el contrato fijo `SCAFFOLD …`; sin pasos inventados en ninguna ejecución. |
| 2026-07-13 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `review-change` 2.2.0, `execute-phase` 2.2.0, `workflow-status` 1.6.0 (feature 17, `finding-severity-routing`) | PASS | Tres ejecuciones reales de subagente contra el fixture (`docs/features/99-csv-export-command`, copia en scratch en `/private/tmp/…/golden-fixture-99/`), alimentadas con el texto exacto del paso de proceso (sin parafrasear): (A) el paso de persistencia de `review-change` (su paso de proceso 9), dado un hallazgo fix-now sintético (`src/csv/export.ts:42`, axis `tests`, `Sev: med`) en una unidad no mergeada → escribió `review-findings.md` con el esquema fijo verbatim, `id: F1`, `folded: no`, sin pasos inventados. (B) el paso de emisión de `workflow-status` (su paso de proceso 9), leyendo ese mismo archivo → produjo exactamente el item JSON `{id: "F1", file: "src/csv/export.ts:42", axis: "tests", severity: "med", class: "fix-now", route: "fold into phase", suggested_tier: "cheap"}` — derivó correctamente `cheap` (severidad no `high`, axis no en el conjunto sutil) puramente desde la tabla mecánica, se mantuvo de solo lectura. (C) la casilla de la checklist del ciclo de fold de `execute-phase`, dado "F1 recién arreglado y commiteado" → volteó solo la columna `folded` a `yes`, sin ninguna otra edición. Las tres: cero ambigüedad reportada, cero pasos inventados — el round-trip ledger + item de envelope coincidente funciona de extremo a extremo a través de un modelo débil exactamente como se especifica. |
| 2026-07-17 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `fold-findings` 1.0.0, `review-change` 2.3.0, `execute-phase` 2.3.0 (fix #65, `fold-findings-skill`) | PASS | Tres ejecuciones reales, alimentadas con el texto exacto de la sección citada (sin parafrasear): (A) `fold-findings` — un repo git de juguete real (`/private/tmp/…/golden-fixture-65/repo`, rama `fix/99-csv-export-command`, sin PR) con un ledger de una fila (`F1`, axis `tests`, `folded: no`) por un test faltante para el caso de conjunto de registros vacío en un exportador CSV; dada la checklist de definición-de-arreglado, la lista de prohibiciones y el proceso verbatim, el modelo diagnosticó la causa raíz real (test faltante, no un bug de código — correctamente dejó `export.ts` sin tocar), añadió el test, volteó `folded: no → yes`, hizo commit (`fix(csv-export): fold F1 — add test for empty record set`, sha `b3c4b42`) con la línea de reporte fija `| F1 | verdict: FOLDED b3c4b42 |` + `Folded: 1/1 · Disputed: 0 · Blocked: 0`, y correctamente no hizo push por la excepción de "sin PR" del fixture de juguete — cero fuga de alcance, cero pasos inventados. (B) el bloque `Decision: FAIL` del paso 11 de `review-change`, dado un hallazgo fix-now abierto y sin deriva recurrente — reprodujo el bloque `→ Next: /fold-findings — …` verbatim como líneas literales separadas (sin prosa unida con `·`), omitió correctamente la línea de product-audit. (C) la sección del ciclo de fold de `execute-phase`, dada una rama con PR abierto — nombró correctamente `/fold-findings` como el hand-off preferido, reprodujo verbatim la checklist de fallback inline cuando se le pidió, y afirmó correctamente que `git push` corre inmediatamente después del commit. Las tres: cero pasos inventados. |
| 2026-07-17 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `plan-feature-scaffold` 1.10.0, `plan-fix` 2.2.0, `execute-phase` 2.4.0 (fix #64, `phase-atomicity-lint`) | PASS | Tres ejecuciones reales de razonamiento de texto, alimentadas con el texto exacto de la sección citada (sin parafrasear), contra una fase de juguete `P1 — implement export and import commands` deliberadamente no atómica (9 tareas, título unido con `and`, 4 layers mezclados, una tarea de decisión con `Decide`/`OR`, un flag `--skip-dupes` condicional en tiempo de ejecución, una tarea de verificación manual en hoja de cálculo dentro de la fase de implementación, y un done-when no verificable mecánicamente): (A) el guardia de pre-vuelo Phase-lint de `execute-phase` — falló correctamente las 8 casillas con una razón de una línea cada una, se DETUVO antes de cualquier edición, y reprodujo el bloque fijo `PHASE-LINT GATE … BLOCKED` verbatim incluyendo los sub-bullets `→ Next:`. (B) el ítem de checklist Phase-lint en tiempo de emisión de `plan-feature-scaffold` — se negó correctamente a emitir la fase tal cual y produjo un recorte que la divide por líneas de layer/deliverable (fases separadas api/hardening/ui/docs/schema/close-out), según la regla de división obligatoria. (C) los pasos 12–13 del algoritmo de `plan-fix` — confirmaron que ambos exigen el mismo lint canónico de 8 casillas sin ningún lint alternativo inventado. Las tres: cero pasos inventados, bloques fijos renderizados exactamente. |
| 2026-07-17 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `audit-pr` 3.2.0 (fix #78, `audit-pr-closure-integrity`) | PASS | Dos ejecuciones reales, alimentadas con el texto exacto citado de la fila de la tabla del gate "Closure integrity" + el bloque de salida fija (sin parafrasear), cada una contra un SPEC de feature de prueba (`/private/tmp/…/golden-fixture-78/`): (A) `spec-hollow.md` — un bloque `## Capability closure` con una fila `Read/list` en blanco (sin marcar, sin UI/API/test, sin `n/a:`) → evaluó correctamente la Casilla 2 como fallida, devolvió **BLOCKER**, citó la fila en blanco exacta, emitió una línea de bloqueo de closure-integrity nombrando la fila. (B) `spec-legacy.md` — sin ningún encabezado `## Capability closure` → devolvió correctamente **WARNING** (nunca un bloqueo), emitió la línea fechada `design-debt: closure absent, SPEC predates the rule (dated 2026-07-17)` verbatim, y nombró el mecanismo de retrofit (`/design-feature <slug>` antes de más trabajo). Ambas ejecuciones: cero pasos inventados, texto de salida fija renderizado exactamente. |
| 2026-07-17 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `execute-phase` 2.5.0 (fix #66, `scope-bleed-guardrail`) | PASS | Dos ejecuciones reales, alimentadas con el texto exacto citado de la sección "Descope guard" verbatim, cada una contra el SPEC del fixture (`/private/tmp/…/golden-fixture-66/SPEC.md`, P1 con una tarea sin marcar "Empty record set → header-only file, exit 0"): (A) issue candidato "Support empty record set as a follow-up … ship export-csv without it for now" → clasificó correctamente **descope** (solapa la tarea P1 sin marcar), afirmó que se DETENDRÍA antes de crear el issue, pediría aprobación del usuario y registraría la fila canónica de `## Amendments` antes de crear el issue en ningún momento — nunca inventó un workaround, nunca creó el issue primero. (B) issue candidato "Add a gzip-compression option … not something the current SPEC asks for" → clasificó correctamente **trabajo descubierto** (fuera de todo criterio/tarea de aceptación, coincide con el propio encuadre "Out of scope" del SPEC), afirmó que archivaría el issue de inmediato sin enmienda ni aprobación necesarias. Ambas ejecuciones: cero pasos inventados, clasificación correcta en ambos lados de la frontera descubierto-vs-descope. |
| 2026-07-18 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `review-change` 2.4.0 (fix #76, `adversarial-weak-fleet-usability`) | PASS | Una ejecución real, alimentada con el texto exacto citado de las secciones "Reviewer contract" y "Merge contract" verbatim, contra un diff de juguete de exportación CSV que introduce un bug de inyección de comandos + path traversal: (A) rellenó la plantilla del contrato de revisor como revisor R2 (adversario de seguridad/inputs) y devolvió exactamente la tabla contratada `Return exactly:` — dos filas, sin secciones extra, sin comentario inventado. (B) aplicó el contrato de merge a las tablas de R1 + R2: deduplicó correctamente por `file:line`+axis (mantuvo los dos hallazgos como filas separadas porque su `file:line` difiere), añadió la columna `Reviewers n/N` (`2/2` para la fila que ambos marcaron, `1/2` para la que solo R2 levantó), respetó el umbral de inclusión ≥1 (mantuvo la fila `1/2`, sin puerta de mayoría), y no violó ninguna de la lista de prohibiciones (sin drop/downgrade/reclasificación). La única ambigüedad autoreportada fue inferir números de línea exactos de un diff que no los incluía (un artefacto del fixture, no un vacío de redacción) — cero pasos inventados contra el propio contrato. |
| 2026-07-18 | Claude Haiku 4.5 (modelo más débil disponible en la flota de esta sesión) | `execute-phase` 2.6.0 (fix #77, `review-checkpoint-cadence-triggers`) | PASS | Dos ejecuciones reales, alimentadas con el texto exacto citado de la sección "Review checkpoint triggers" y el bloque fijo "Checkpoint hand-off" verbatim, sin código de escenario disponible (solo texto): (A) fase que declara `domain` seguida de una siguiente fase que declara `api`, diff pequeño de 180 líneas/3 ficheros, sin tocar superficie sensible → disparó correctamente solo el disparador de **límite de capa**, reprodujo el bloque de hand-off fijo exactamente con `<trigger name>` = "layer boundary" y la frase de evidencia citada, rellenó correctamente `<next phase>` = P4. (B) dos fases seguidas de la misma capa `ui`, diff de 40 líneas/2 ficheros, sin tocar superficie sensible → disparó correctamente **ningún** disparador y, según la regla "No trigger fired? Omit the checkpoint line", produjo el cierre abreviado nombrando solo la siguiente fase — sin línea de checkpoint inventada, sin pasos extra inventados. Ambas ejecuciones: cero pasos inventados, bloques fijos renderizados exactamente. |

| 2026-07-30 | Qwen3 8B (`qwen3:8b`, modelo local más débil con tool-calling) | `tool-calling smoke`, `execute-phase` 2.9.0 (issue #111, política de hallazgos oportunistas) | PASS | El smoke de tool-calling devolvió `tool_calls` con `get_time` y argumentos `{}` parseables. Una ejecución real de razonamiento de texto, alimentada con la política verbatim y el contexto del fixture de exportación CSV: (A) variable local sin usar de 1 línea en un archivo ya modificado → `Autofix`; (B) corrección de consistencia del serializador de 18 líneas / 2 archivos en el archivo tocado y su test de cobertura directa → `Opportunistic Fix`; (C) dependencia de serializador conectable de 90 líneas / 6 archivos que necesita juicio de producto → `Create Issue`. Seleccionó `workflow`, emitió el encabezado exacto de tabla de `decisions.md` y las tres filas con la fecha suministrada, sin inventar pasos de política. |
| 2026-07-30 | Qwen3 8B (`qwen3:8b`, modelo local más débil con tool-calling) | `execute-phase` 2.10.0 (issue #111, política de fuente única) | PASS | Una ejecución real de razonamiento de texto, alimentada con la política verbatim y una guía local contradictoria que afirmaba que `Autofix` permite 100 líneas. Un hallazgo de bajo riesgo de 20 líneas / 1 archivo con cambio de comportamiento visible correctamente ignoró esa heurística local, seleccionó `source: workflow`, falló la casilla Autofix de ≤15 líneas, aprobó las casillas de Opportunistic Fix y emitió `Opportunistic Fix` con la forma exacta de tabla de `decisions.md`. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, modelo local más débil con tool-calling) | `tool-calling smoke`, `design-feature` 2.4.0, `plan-feature` 3.2.0, `execute-phase` 2.11.0, `review-change` 2.7.0, `audit-pr` 3.5.0 (feature #110, estado normalizado del repositorio) | PASS | El smoke de tool-calling devolvió `tool_calls` con `get_time` y argumentos `{}` parseables. Una ejecución real de razonamiento de texto, alimentada con las secciones exactas citadas de Normalized Repository State y el conflicto del fixture de exportación CSV (`RF1` dice que no hay `export-csv`; `E1` muestra que existe): el modelo devolvió exactamente la tabla pedida, reportó/propuso una contradicción para diseño, planificación, review y auditoría, enrutó ejecución a `resolve-repository-state`, prohibió rewrite/update/redefinición inline y no inventó ningún paso de workflow. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, modelo local más débil con tool-calling) | `tool-calling smoke`, `design-feature` 2.4.0, `plan-feature` 3.2.1, `execute-phase` 2.11.1, `review-change` 2.7.0, `audit-pr` 3.5.0 (feature #110, estado normalizado del repositorio) | PASS | Se repitió el smoke de tool-calling compatible con OpenAI: `finish_reason: tool_calls`, `get_time` y argumentos `{}` parseables. Las comprobaciones de razonamiento de texto contra las reglas exactas de NRS y el conflicto RF1/E1 produjeron la tabla pedida de contradicción, detuvieron planificación e implementación mientras el ledger estaba `contradicted`, enrutaron ejecución a `resolve-repository-state`, mantuvieron review y auditoría en modo de solo lectura, imprimieron el hand-off final `→ Next:` y no inventaron ningún paso de workflow. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, modelo local más débil con tool-calling) | `tool-calling smoke`, `design-feature` 2.4.1, `plan-feature` 3.2.2, `execute-phase` 2.11.2, `review-change` 2.7.1, `audit-pr` 3.5.1, `orchestration-envelope` 1.4.1 (feature #110, colocación de encabezados del estado normalizado del repositorio) | PASS | Ollama chat devolvió `tool_calls` con `get_time` y argumentos `{}` parseables. Las comprobaciones reales de razonamiento de texto contra las secciones NRS exactas ya movidas y el conflicto RF1/E1 devolvieron exactamente la tabla Markdown pedida, reportaron/propusieron contradicciones para diseño, review y auditoría, detuvieron planificación e implementación mientras el ledger estaba `contradicted`, enrutaron driver y ejecución a `resolve-repository-state`, mantuvieron review y auditoría en modo de solo lectura y no inventaron ningún paso de workflow. |

| 2026-07-31 | Qwen3 8B (`qwen3:8b`) | `execute-phase` 2.12.0, `review-change` 2.8.0, `audit-pr` 3.6.0 (feature #109, invariantes arquitectónicas) | FAIL | La primera ejecución en vivo usó thinking por defecto y antepuso análisis al veredicto solicitado de tres líneas, por lo que no cumplió el criterio de salida exacta. Clasificó correctamente la escritura directa como `violates`, la revisión como hallazgo y la auditoría como bloqueante; la repetición inferior es el resultado que pasa. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`) | `execute-phase` 2.12.0, `review-change` 2.8.0, `audit-pr` 3.6.0 (feature #109, invariantes arquitectónicas) | PASS | Análogo en vivo del fixture CSV: AI-001 exigía un adaptador de escritura de ficheros para CLI; `src/cli/export.ts` llamaba directamente a `fs.writeFile`; NRS congelado confirmó la ruta. El modelo devolvió exactamente las tres líneas solicitadas: ejecución `violates` y se detiene para una decisión arquitectónica explícita; revisión `finding` enrutada a esa decisión; auditoría `blocker` con evidencia de fuente citada. No inventó ningún paso del workflow. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`) | `design-feature` 2.5.0, `plan-feature` 3.3.0, `plan-feature-from-issue` 1.6.0, `plan-feature-scaffold` 1.12.0 (feature #109, fold F1) | PASS | Cuatro ejecuciones en vivo del fixture CSV-export con entradas de prueba: diseño produjo el SPEC de producto y su bloque de cierre exacto; planificación, conversión de issue a SPEC y scaffolding devolvieron cada contrato fijo con el hand-off `→ Next:` requerido. No se editaron archivos del repositorio ni se inventaron pasos del workflow. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`) | `execute-phase` 2.13.0, `design-feature` 2.6.0, `review-change` 2.9.0, `audit-pr` 4.1.0, `ship-roadmap` 3.1.0, `workflow-status` 1.9.0, `triage-issue` 2.5.0, `init-workspace` 2.8.0 (feature 20, rutas progresivas iniciales) | FAIL | Las primeras pruebas reales de selección de ruta detectaron una ambigüedad auténtica para modelos débiles: solo `execute-phase` eligió limpiamente su ruta; otras ejecuciones cargaron ficheros condicionales de portabilidad/escritura/informe, omitieron el proceso de auditoría o un guardarraíl obligatorio, o inventaron un nombre plausible. La inspección mecánica también encontró referencias cortadas en mitad de listas/bloques fijos. El resultado forzó allowlists explícitas, filas completas condición→LOAD, cortes semánticamente cohesivos, orden numerado de auditoría y lint de encabezado inicial; queda sustituido por la fila aprobada inferior. |
| 2026-07-31 | Qwen3 8B (`qwen3:8b`, `--think=false`, temperatura 0, seed 20; modelo local más débil con tool-calling) | `tool-calling smoke`, `execute-phase` 2.13.0, `design-feature` 2.6.0, `review-change` 2.9.0, `audit-pr` 4.1.0, `ship-roadmap` 3.1.0, `workflow-status` 1.9.0, `triage-issue` 2.5.0, `init-workspace` 2.8.0 (feature 20, rutas progresivas endurecidas) | PASS | El smoke compatible con OpenAI devolvió `finish_reason: tool_calls`, `get_time` y argumentos `{}` parseables. Ocho pruebas reales con invocaciones naturales seleccionaron solo los recursos exactos de cada ruta: ejecución por defecto, primer turno de diseño en crudo, review por defecto, auditoría completa ordenada, AUDIT fullauto activo no terminal hasta closeout, sensor de proyecto vacío, postpone de issue del forge y upgrade OpenCode existente. Una segunda ejecución de `execute-phase` cargó `PREFLIGHT.md` y renderizó el bloque completo `OWN-STATUS GATE — 99-csv-export-command BLOCKED (defined)` con `/plan-feature 99-csv-export-command` y las líneas `→ Next:` exactas. Sin referencias ni pasos inventados; se respetó la disciplina de rama/commit. |

| 2026-08-02 | Qwen3 8B (`qwen3:8b`, `--think=false`; modelo local con tool-calling más débil, ya validado arriba) | `bump-skill` 2.3.2, `execute-phase` 2.13.1, `fold-findings` 1.1.1, `generate-docs` 2.0.1, `plan-feature` 3.3.1, `plan-feature-scaffold` 1.12.1, `plan-fix` 2.4.1, `product-audit` 3.0.1, `review-implementation` 1.3.1 (segunda pasada de carga progresiva) | PASS | Nueve probes vivos de selección de ruta, cada uno alimentado literalmente con el entrypoint actual, eligieron exactamente los recursos de un salto y su orden: handoff de execute tras los recursos previos; stop `planned` de plan-feature frente a gates de scaffold en `defined`; proceso de scaffold; find→classify del review; planning→SPEC del fix; discovery→sync del bump; policy→process del fold; parada temprana NOT-CONFIGURED de generate-docs; y dimensions→process de product-audit. No inventó ningún nombre de referencia ni paso extra del workflow. |

## Límite de alcance

Manual primero, sin CI, sin script ejecutable. Esto es deliberadamente lo
más barato que detecta regresiones de modelo débil hoy. Gradúa a
automatización solo si el procedimiento manual detecta regresiones
repetidamente y el coste de mantenimiento se justifica — eso es una unidad
separada y futura, no programada aquí.
