# Decisions — fix/600-config-default-materialization

Dated decisions and the forward promises the residual classifier reads. The
decision rows are `unit-only` unless a row says otherwise; the promise block is
the declared shape (`residual-promise@1`, owner: `skills/unit-lane/references/DESIGN.md`).

## Decisions

| id | decision | why |
|---|---|---|
| D1 | the materialized value is semantics-preserving: a key takes its default only where it is `undefined`, recursing over the schema's declared properties | the issue's first non-goal; `resolveConfigDocuments` never sees a different config after a materialization |
| D2 | the comment is generated from the schema (`description ?? section description` + type + shipped default), never hand-written; a key with no shipped default is documented but not written | one source, no drift; `config list` and the file describe a node the same way |
| D3 | `--scope` defaults to `both` for `config default` (every other config operation defaults to `project`) | the operation reconciles every file the install owns, which is the affordance the issue asks for |
| D4 | the doctor reports the **project** scope only; the global file belongs to the operator's own `config default --scope global` | the doctor is a read-only project observer (`--root`), and `.pi/` is read only while the project is trusted |
| D5 | two shipped defaults the schema refused are repaired in the same change: `logSession.publisher` accepts `null`, and `gitIdentity.agentGuard.mode` leaves the section default | a materialized file must validate; both keys were invalid per their own section schema (the first since #427, the second a #626 leftover), so the operation could not ship without the repair |
| D6 | the settings console imports the crate's engine in-process and takes it as an optional seam | one implementation for CLI and console; the seam keeps the console test free of real file writes |
| D7 | the Fixes intake row is hand-added, and three count pins move (doctor 15→16, template charter slots 22→23, bank rows 17→18) | `docs-generate` never appends fix rows by design, and every one of those counts is documented as following the shipped surface it counts |

## residual-promise@1

```text
residual-promise@1
surface | consumer | date | owner
packages/agentic-workflow/src/config/materialize.d.mts | unit:docs/fix/600-config-default-materialization | 2026-11-21 | issue #600
packages/agentic-workflow/test/config-materialize.test.mjs | unit:docs/fix/600-config-default-materialization | 2026-11-21 | issue #600
```
