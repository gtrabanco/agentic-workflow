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

## Límite de alcance

Manual primero, sin CI, sin script ejecutable. Esto es deliberadamente lo
más barato que detecta regresiones de modelo débil hoy. Gradúa a
automatización solo si el procedimiento manual detecta regresiones
repetidamente y el coste de mantenimiento se justifica — eso es una unidad
separada y futura, no programada aquí.
