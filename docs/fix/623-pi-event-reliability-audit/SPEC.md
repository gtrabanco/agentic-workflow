---
type: fix
scope: standard
---

# fix/623-pi-event-reliability-audit

> Fix specification — event reliability for Pi's `pi.on()` listeners across
> hosts, with remediation of the shutdown-only flush/write effects.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#623` — tracked issue in the project's forge. The PR closes it via
`Closes #623` in the body.

## Specs

The five requirements below are the issue's own `## Specs` block, verbatim.
The plan-time decision that shapes their implementation (the S4 route) is
recorded under **S6**.

**S1 — Inventariar todos los `pi.on()` registrations y su evento objetivo.**
> Listar cada llamada a `pi.on()` en `packages/pi-agentic-workflow/src/extension/`, `packages/agentic-workflow-schema/`, `scripts/`, y `skills/` — con el nombre del evento, el archivo, la línea, y qué hace el handler.

**S2 — Documentar la confiabilidad de cada evento de Pi por entorno.**
> Para cada evento de Pi escuchado (`session_start`, `session_shutdown`, `turn_start`, `turn_end`, `tool_execution_end`, `session_before_compact`, `compaction`, `resources_discover`, `agent_before_settle`, etc.):
> - `pi-web` (web): ¿se dispara? ¿en qué circunstancias?
> - `pi-tui` (terminal): ¿se dispara?
> - `CI / headless`: ¿se dispara?
> - Indicar qué eventos son **confiables** (siempre se disparan) y cuáles **no son confiables** (pueden no dispararse)

**S3 — Identificar cada listener que produce un efecto observable (flush, write, publish) basado en eventos no fiables.**
> Un "efecto observable" es cualquier cosa que el usuario espera que ocurra:
> - Telemetry flush a ledger/JSONL
> - Auto-log-session write a LOGS.md
> - Qualquer persistencia de estado que dependa de un evento de Pi
> - Cleanup de recursos que no se ejecute por evento no disparado
>
> Para cada uno, documentar el problema, el impacto, y la recomendación.

**S4 — Remediación de los listeners identificadas como problemáticos.**
> Para cada listener que produzca un efecto observable basado en un evento no fiable:
> - Opción A: Mover el flush/write a un evento más fiable (ej: `turn_end` con debounce)
> - Opción B: Añadir un mecanismo de fallback (flush periódico por intervalo de tiempo)
> - Opción C: Si no es remediado, documentar la limitación como known-issue y añadir un warning visible
>
> Priorizar por impacto: telemetry > auto-log-session > otros.

**S5 — No cambiar el contrato de eventos de Pi.**
> `session_shutdown` sigue existiendo tal cual. No se cambia la API de Pi, solo se adapta el código para no depender exclusivamente de eventos no fiables.

**S6 — Pi event reliability matrix and the emission-boundary decision (plan-time design).**
> Owner-decided during this unit's planning: the 37-event catalogue was
> verified identical between `pi.dev/docs/latest/extensions` and the installed
> `@earendil-works/pi-coding-agent@1.5.2` doc. The reliable *emission
> boundary* for per-run observable effects is `agent_settled` — documented as
> "final and notification-only", it fires after every settled run in every
> host, including the long-lived interactive sessions where
> `session_shutdown` never fires between prompts. The emission design: the
> JSONL gains one append per run; the ledger keeps one row per
> session/unit/day via upsert-by-`source` (the `session_shutdown` flush stays
> as the final fallback with its idempotency guarantee). The issue's S4
> example route — "move flush to `turn_end` with debounce" — is discarded:
> `session-telemetry.ts` latching `flush()` would freeze partial totals, and
> the append-only ledger sink would append growing duplicate rows.

## Impact

- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` — **ya confirmado**: flush solo en `session_shutdown`, pierde muestras en pi-web
- `packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts` — **ya confirmado**: write solo en `session_shutdown`, no escribe en pi-web
- Otros wiring en `packages/pi-agentic-workflow/src/extension/` — **por auditar**
- Skills que registren listeners — **por auditar**
- Scripts que simulen eventos para testing — **por auditar**

Beyond the issue's Impact: the decided route leaves `TELEMETRY_SAMPLE_FIELDS`
and the ledger's `tier-cost@N` column contract **unchanged** (no schema bump
in this unit) — the upsert semantics live in the sink, not the sample.
Consumers of the JSONL stream see one additional line per run instead of one
per session; the report names this to the stream's readers.

## Surfaces

- `packages/pi-agentic-workflow/src/extension/` — todos los wiring
- `packages/pi-agentic-workflow/src/` — cualquier otro código que use eventos de Pi
- `skills/` — skills que registren listeners (ej: `unit-lane`, `execute-phase`, etc.)
- `scripts/` — scripts de testing/CI que simulen eventos
- `packages/agentic-workflow-schema/src/` — por auditar
- `docs/workflow/CONFIG.md` — documentación de telemetry y logSession
- `docs/features/394-auto-log-session/` — spec de log-session
- `docs/features/494-telemetry-by-turn/` — spec de telemetry

## Retirements

None — the issue's own answer stands: an audit-and-remediate unit retires no
surface. The `session_shutdown` listeners are kept (S5), so nothing is
orphaned.

## Non-goals

- No se cambia el contrato de eventos de Pi (los eventos de Pi existen tal cual, no los creamos ni modificamos)
- No se reescribe el spec de ninguna feature (solo se documenta el problema y se corrige el código)
- No se cambia el comportamiento de las features, solo se hace que funcionen correctamente en más entornos

## Risk tier

Computed at triage by `runner ceremony tier classify`; the issue's own
assessment is **`standard`**. The computed verdict is recorded beside the
triaged steps block before execution — a tier written from memory is not a
tier.

## Future

- Considerar añadir un "event reliability matrix" a la documentación de Pi extensions
- Evaluar si Pi debería exponer un evento "idle" o "between_turns" que sea confiable en pi-web para flusos periódicos
- Feature futura: auto-flush por tiempo (cada N segundos) además de por evento

## Future cost

`none` beyond the issue's own statement (the solution preserves the current
events as fallbacks wherever possible).

## Applicable tests

- `test/telemetry-wiring.test.mjs`
- `test/auto-log-session-wiring.test.mjs`
- `test/session-telemetry.test.mjs`
- `test/telemetry-ledger-sink.test.mjs`
- `test/telemetry-jsonl-sink.test.mjs`
- `test/default-inherit.test.mjs`
- `test/config-merge-stateflow.test.mjs`
- `test/shipped-adapter.test.mjs`
- `test/path-protection.test.mjs`
- `test/auto-log-session-wiring.test.mjs`
- `scripts/run-root-suite.mjs` (todo el root suite)

## Known pre-existing issues

`n/a` — the problem is this fix's focus (the issue's own answer).

## Tasks

Refined at planning from the issue's P1–P9; the emission-boundary decision
(S6) re-words P5/P6 and adds the marker purge and the env reset under P7.

- P1 — Record the full `pi.on()` listener inventory of `packages/pi-agentic-workflow/src/extension/` in the planning evidence: event, file:line, purpose (validator: `rg -n 'pi\.on\(' packages/pi-agentic-workflow/src/extension/` lists 14 live registrations matching the inventory)
  (Implements: S1)
  - Relevant files: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts, packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts
- P2 — Record the `skills/`, `scripts/` and schema-package inventory — zero live registrations there, only `scripts/mutation-check.mjs` string matches (validator: `rg -n 'pi\.on\(' skills/ scripts/ packages/agentic-workflow-schema/src/ --glob '!*.test.mjs'` returns only mutation-check matches)
  (Implements: S1)
  - Relevant files: skills/, scripts/, packages/agentic-workflow-schema/src/
- P3 — Write the event reliability matrix (the 37-event catalogue × host) into `docs/workflow/CONFIG.md`, distinguishing the run-boundary events that fire every host (`turn_*`, `tool_*`, `agent_start/end/before_settle/settled`) from the session-lifecycle events whose `session_shutdown` never fires between prompts in pi-web (validator: the matrix section exists, names every event the extension registers, and cites the pi.dev source)
  (Implements: S2)
  - Relevant files: docs/workflow/CONFIG.md
- P4 — Record the observable-effect inventory (S3) in the planning evidence: telemetry flush, auto-log publish, the hooks `session:end` seam, the `AG_WF_PHASE` env cleanup — each with its environment gap (validator: evidence rows present in this unit doc)
  (Implements: S3)
- P5 — Remediate telemetry emission, tests first: emit at `agent_settled` (JSONL append per run; ledger upsert-by-`source`), keep `session_shutdown` as the final flush, and reset `AG_WF_PHASE` at `session_start` (validator: `bun test packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` exits 0)
  (Implements: S4, S6)
  - Relevant files: packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts, packages/pi-agentic-workflow/src/session-telemetry.ts, packages/pi-agentic-workflow/src/telemetry-sinks.ts
- P6 — Remediate auto-log publication, tests first: publish at `agent_settled` (last-write-wins per session id), keep the `session_shutdown` publish as the final one, remove the marker at both boundaries (validator: `bun test packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs` exits 0)
  (Implements: S4)
  - Relevant files: packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts, packages/pi-agentic-workflow/src/auto-log-session.ts
- P7 — Purge stale (>7 days) autosession markers at `session_start` and route the hooks `session:end` seam gap as the documented warning in the matrix (validator: `bun test packages/pi-agentic-workflow/test/auto-log-session.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: packages/pi-agentic-workflow/src/auto-log-session.ts
- P8 — Update the documentation with the matrix and the decided emission boundary (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S2, S3)
  - Relevant files: docs/workflow/CONFIG.md, docs/features/394-auto-log-session/, docs/features/494-telemetry-by-turn/
- P9 — Run the verification gate (validator: `bun run test` exits 0 · `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5)

### Planning evidence

Ledger: `planning-evidence.md` in this folder (M-sized unit). The rows recorded
during this planning session cover the listener inventory, the pi.dev event
catalogue, the `agent_settled` documentation quotes, and the two sink facts
(latch + append-only idempotency) that shaped S6.

### Obligations

```text
obligations@1
obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
flush-on-shutdown | AGENTS.md (tests first for a non-empty test impact set) | every change runs its affected tests | triage → plan | P9 | implementer | gate passes | affected tests green | pending
telemetry-invariant | docs/features/494-telemetry-by-turn/SPEC.md | telemetry accumulates correctly across environments | triage → plan | P5 | implementer | gate passes | telemetry works in pi-web, tui and print mode | pending
auto-log-invariant | docs/features/394-auto-log-session/SPEC.md | auto-log-session writes to LOGS.md in all environments | triage → plan | P6 | implementer | gate passes | auto-log works in pi-web, tui and print mode | pending
event-reliability-inventory | AGENTS.md (comprehensive audit) | all Pi events documented for cross-environment reliability | triage → plan | P1–P4 | implementer | audit complete | event reliability matrix documented | pending
one-sample-per-session | S6 (this doc) | the ledger keeps one row per session/unit/day under upsert-by-source | triage → plan | P5 | implementer | `bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` exits 0 | the upsert dedupes by `source` and never appends a second row for the same | pending
```

## Triaged steps

> Paste the `## Triaged steps` block from `runner unit-route --triage
> 623-pi-event-reliability-audit` here verbatim at triage time.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — the issue, verbatim:
  ```
  - **L1** — 2026-06-30, the issue, verbatim:
  ```
  No hay datos de telemetría en absoluto. Ni el ledger ni el JSONL tienen muestra alguna...

  Las JSONL de sesión de Pi no contienen muestras de telemetría del workflow — contienen los transcripts completos, que son otra cosa.

  El sistema de telemetría del workflow no guarda en esos transcripts — escribe sus muestras compactas en:
  .pi/.telemetry/sessions.jsonl (dentro del proyecto)
  Y esa ruta nunca se creó (ni siquiera el directorio existe).

  ¿Por qué no hay muestras?
  Las sesiones que ves (~/.pi/agent/sessions/...jsonl) son de Pi, del sistema que las ejecuta. El agentic-workflow telementry es un sink independiente que:
  1. Se activa cuando telemetry.enabled es true
  2. Escribe al sink JSONL (.pi/.telemetry/sessions.jsonl) al cerrar la sesión (flush)
  3. Escribe al sink ledger (TIER_COST.md) como fila de tabla

  Si ni el JSONL ni el ledger tienen filas, significa que nunca se disparó el flush

  session_shutdown se dispara solo cuando la sesión de Pi se termina definitivamente (no vuelve a responder)

  En pi-web, las sesiones permanecen vivas entre prompts. Se mandan mensajes, se responde, se vuelve a idle, se espera el siguiente prompt... pero la sesión no se cierra. Por tanto:
  - Envías un prompt / el modelo responde → No escribe telemetría — se acumula en memoria
  - La sesión se pone idle / timeout → No — sigue viva en memoria
  - La sesión se cierra (shutdown/archivo) → Sí — flush a JSONL + ledger

  La inmensa mayoría de interacciones con Pi-web pierden la telemetría acumulada porque flush() nunca se llama.

  El wiring de auto-log-session tiene el mismo problema: la escritura al LOGS.md solo ocurre en session_shutdown. Si la sesión de Pi-web nunca se cierra, el marker se crea y queda flotando en memoria, pero publishAll() nunca se ejecuta.
  ```
- **E1** — 2026-06-30, `find ~/.pi/agent/sessions/ --name "*.jsonl" | wc -l` · 150+ session transcripts, 0 samples · Las JSONL de transcript existen pero no contienen muestras de telemetría del workflow
- **E2** — 2026-06-30, `bun scripts/telemetry-report.mjs --ledger docs/workflow/TIER_COST.md` · exit 0 · 0 samples
- **E3** — 2026-06-30, `grep -n "session_shutdown" packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` · line 142 · `pi.on("session_shutdown", () => { accumulator?.flush();`
- **E4** — 2026-06-30, `grep -n "session_shutdown" packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts` · line 97 · `pi.on("session_shutdown", (event) => {`
- **E5** — 2026-06-30, `grep -rn "pi.on(" packages/pi-agentic-workflow/src/extension/` · multiple matches · El problema puede estar en otros listeners además de session_shutdown
  ```
- **E1** — `rg -n 'pi\.on\(' packages/pi-agentic-workflow/src/extension/` · exit 0 · 14 live registrations: `index.ts` (7), `telemetry-wiring.ts` (5), `auto-log-session-wiring.ts` (2).
- **E2** — `rg -n 'pi\.on\(' skills/ scripts/ packages/agentic-workflow-schema/src/` · exit 0 · only `scripts/mutation-check.mjs` string matches; no live registration outside the extension directory.
- **E3** — web fetch `https://pi.dev/docs/latest/extensions` with the installed `@earendil-works/pi-coding-agent@1.5.2 docs/extensions.md` · identical 37-event catalogue; the docs describe `session_shutdown` for exit and session-replacement only, and cite `on("agent_settled")` as the run-finished boundary.
- **E4** — read `packages/pi-agentic-workflow/src/session-telemetry.ts` and `src/telemetry-sinks.ts` · `flush()` latches (`emitted = true`) and the ledger sink compares whole rows — the two facts that discard the issue's naive `turn_end`-debounce route (see S6).
- **E5** — read `packages/pi-agentic-workflow/src/auto-log-session.ts` · the marker is write-only state (created at `session_start`, removed only at `session_shutdown`) — a session that never closes leaves it forever, so P7 purges stale ones.

## Next

Run `runner unit-route --triage 623-pi-event-reliability-audit`, paste the
triaged steps block, and begin the P3/P4 documentation work before the P5/P6
test-first code changes.

## References

- `docs/features/394-auto-log-session/SPEC.md` — auto-log-session feature spec
- `docs/features/494-telemetry-by-turn/SPEC.md` — telemetry by turn feature spec
- `@earendil-works/pi-coding-agent/docs/extensions.md` — Pi extension lifecycle docs
- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` — telemetry wiring
- `packages/pi-agentic-workflow/src/extension/auto-log-session-wiring.ts` — auto-log-session wiring
- `packages/pi-agentic-workflow/src/extension/` — todos los wiring de extensiones

## Branch

`fix/<issue-number>-pi-event-reliability-audit`

## Depends on

None.

## Regression scope

- `n/a` — se añade auditoría y documentación, se corrige comportamiento que no funciona en pi-web. No se modifica comportamiento existente en pi-tui/CLI que funcione correctamente. El `session_shutdown` se mantiene como fallback, por lo que las sesiones CLI bien cerradas siguen funcionando igual.
