---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"self-documenting-cli": patch
---

feat(cli): the CLI serves its own grammar, and every failure names a repair

The grammar of 73 subcommands lived in exactly one human-facing place — the
crate README's Commands table — so a mistyped command answered a bare refusal
naming no legal candidate, and every session re-read the README to learn flag
sequences it then half-remembered.

`help`, `help <subcommand>`, `--help`/`-h` and `help --json` now answer from one
registry (`src/runner/help.mjs`) that the dispatch, the failure path and the
parity suite all read. A usage-class failure keeps its published exit 2 and
prefix and gains the nearest legal candidates plus one `agentic-workflow help
<sub>` pointer; the ceremony JSON gains one additive `help` key and no existing
key changes value. Three subcommands that already shipped a richer hand-written
help keep it — the registry records the ownership so the bin defers.

A new `self-documenting-cli` skill ships the *when and in what order* half (the
families, the read→compare→write recipe, the sensor exit-code exceptions, the
five forge frictions), pointing at `help` for grammar and never restating it.
The pi runner tool's deferred description carries the family index, so a session
that loads no skill still reaches the right family at zero standing cost.
