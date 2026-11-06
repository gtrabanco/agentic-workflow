---
"execute-phase": minor
"unit-lane": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(risk-tiers): capability-based risk detection, and the passive carrier's writer

The `destructive` signal stops matching a list of operation names. A new
analyser reads what a file **can do** — the imports it declares and the effects
they enable — per language family (`js`, `py`, `sh`), resolves them through a
catalogue keyed by provider (`node:fs/promises` *can* remove entries), follows a
relative import into the declaring module, and reports the removal a file reaches.
An unlisted spelling, an alias, a namespace member, a destructured `require`, a
language the table never carried and a helper one module away are all caught by
their capability; a guarded scratch cleanup stays hygiene, and an unresolved
import is reported, never guessed. Fail closed upward throughout: the analysis
can only raise a tier, never lower one, and it blocks no command.

`docs/passive/<id>.md` gets its only writer: `ceremony passive add|read|list`
writes the `passive-record@1` five-field record, refuses a taken id so two
passive units cannot collide, and refuses a scope the classifier does not call
`passive` — routing it to the standard ceremony instead of recording a false
claim. The tier is computed from the scope, never passed as a flag.

The published tier vocabularies and `detail.risk_tier`'s shape are unchanged.
