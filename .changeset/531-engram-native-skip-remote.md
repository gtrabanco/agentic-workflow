---
"@gtrabanco/pi-agentic-workflow": minor
---

fix(pi-agentic-workflow): skip the Engram MCP path for the native package and external servers

Two skip statuses join the Engram provisioning contract (issue #531):

- `native-active` — when the native `gentle-engram` Pi package is installed, its
  `mem_*` tools already exist and nothing is registered beside them; agent
  writes stay native-only, as Engram's own setup requires.
- `external-server` — a set `ENGRAM_URL` names an externally managed (local or
  remote) server; stdio MCP cannot target a URL, so the choice is reported as
  deliberate instead of surfacing as a missing binary.

The `binary-missing` refusal now names all three resolution surfaces — the core
binary (`PATH` / `ENGRAM_BIN`), a running server (`ENGRAM_URL`) and the Pi
companion route — because installing the companion cannot fix a missing core
binary. The package README documents the surfaces and the remote-memory
configuration.
