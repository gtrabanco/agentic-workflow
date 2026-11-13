---
"@gtrabanco/pi-agentic-workflow": minor
---

fix(pi-agentic-workflow): skip the Engram MCP path for the native package and external servers

Two skip statuses join the Engram provisioning contract (issue #531):

- `native-active` — when the native `gentle-engram` Pi package is installed, its
  `mem_*` tools already exist and nothing is registered beside them; agent
  writes stay native-only, as Engram's own setup requires, and a leftover
  `mcpServers.engram` entry is called out so it can be removed.
- `external-server` — a set `ENGRAM_URL` names an externally managed (local or
  remote) server; stdio MCP cannot target a URL, so the choice is reported as
  deliberate instead of surfacing as a missing binary.

The install detection reads the same two `settings.json` files Pi reads — the
user file always, `<cwd>/.pi/settings.json` only for a trusted project — and the
binary lookup honours `ENGRAM_BIN`, so every route the refusal names actually
resolves. The `binary-missing` refusal names all three resolution surfaces — the
core binary (`PATH` / `ENGRAM_BIN`), a running server (`ENGRAM_URL`) and the Pi
companion route — because installing the companion cannot fix a missing core
binary. The deliberate outcomes report as information rather than as warnings,
and the package README documents the surfaces and the remote-memory
configuration. The `not-consented` instruction now names `agentic-workflow.json`,
the file the switch is read from — the extension file refuses `memory` as an
unknown key, so the old text sent operators to a file that could not carry it.
