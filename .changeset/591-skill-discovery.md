---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"init-workspace": minor
"product-audit": minor
---

feat(skills): consented skill discovery — screen before consent, register after install

`init-workspace` can now offer a skill-discovery route after its charter round:
search the registries the owner names, screen every candidate **before** any
consent is asked, ask per candidate, and install nothing without a yes. The
mechanical half ships as one runner command, offline by contract:

- `agentic-workflow skills discover --candidates <manifest> [--consent <answers>]`
  screens each candidate's tree with the seven `skill-lint` checks plus
  provenance (source, author, version, license) and prints the
  `skill-discovery@1` envelope — one row per candidate, its lint receipt, its
  provenance state and its consent record. A consented candidate that failed the
  screen is `blocked` and names no install command; the command itself is text
  (`npx skills add <source>`) the workflow never runs.
- `agentic-workflow skills register --guide AGENTS.md …` appends the one
  `review-extras@1` row the owner consented to into the guide's "Optional review
  extras" note, creating the note when the guide carries none and refusing a
  duplicate name or an incomplete row before any byte moves.
- `agentic-workflow skills inventory --guide AGENTS.md` reads the note back with
  a decay state per row — `ok`, `unpinned`, `stale`, `incomplete` — which is what
  `product-audit`'s Installed tooling dimension now reports instead of the
  agent's memory.

The seven checks move into the crate (`src/skills/screen.mjs`) with
`scripts/skill-lint.mjs` as their thin CLI, byte-identically: a target project
installs the crate and the prose, so the screen needed a carrier both can reach.
`template/AGENTS.md` seeds the registration note, `skills/init-workspace`
carries the route and its write step, and `skills/runner-contract` gains the
subcommand row.
