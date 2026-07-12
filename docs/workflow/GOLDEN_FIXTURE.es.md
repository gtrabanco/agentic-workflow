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

## Límite de alcance

Manual primero, sin CI, sin script ejecutable. Esto es deliberadamente lo
más barato que detecta regresiones de modelo débil hoy. Gradúa a
automatización solo si el procedimiento manual detecta regresiones
repetidamente y el coste de mantenimiento se justifica — eso es una unidad
separada y futura, no programada aquí.
