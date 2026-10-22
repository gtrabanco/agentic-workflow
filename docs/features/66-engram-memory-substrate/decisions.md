# 66 — decisions

The unit's conversation, in order. Append-only: a superseded entry gets a new
row naming it. Grammar: `open-questions@1` as published in the template agent
guide's question protocol (read by `scripts/needs-input.mjs`).

## Questions

open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q1 | 2026-10-21 | open-question | What carries the bounded health probe, and how is its verdict recorded in Evidence? | AC2 has no carrier until this is chosen; a wrong choice puts a platform-bound hook or untestable prose under a required-substrate decision | research R3 (`engram doctor` exits 0 while `doctor --json` says `status: error`; `:7437/health` → 200), R4, INV-017; `AGENTS.md` Verification §; `docs/workflow/README.md` principles 6–7 | Deterministic probe (runner crate subcommand, bounded timeout, JSON verdict, DEGRADED when the binary/transport is absent) + skill prose pasting the verdict — testable, gate-consistent, portable to any agent that can run a command \| Skill prose only — zero code, max portability, but no testable gate and probe quality varies per model \| pi-session hook — automatic, but platform-bound and against the 70+ agent portability rule | design
Q2 | 2026-10-21 | open-question | What is the canonical split between `docs/LOGS.md` (log-session) and `mem_session_summary`? | AC6 must record one split before either writer's text changes; an unrecorded split is the accidental double-write the issue flags | issue #262 comment 2026-09-28 item 4; `grep -rn -i "mem_session_summary" docs/ skills/` → only this unit's folder; INV-011 | LOGS = git-traveling human/team journal (log-session), Engram = local decision/gotcha recall keyed by unit id — team memory travels with git, agent recall stays local (the issue's own e.g., recommended) \| Engram mirrors every LOGS entry — maximal recall, permanent drift risk, double-write obligation in two writers \| Leave both writers as-is and only document the difference — cheapest, but leaves the split undecided where the issue demanded a recorded decision | design
Q3 | 2026-10-21 | open-question | How does the pi path provision Engram's MCP registration? | AC3's pi half needs a carrier before any implement task exists; a silent always-on registration would break the package's consent rule | INV-002 (`~/.pi/agent/mcp.json` today), INV-013 (`pi.registerMcpServer`, pi docs `extensions.md:197`), INV-014 (`engram setup <agent>`), INV-015 (`init-workspace` ask-first + report exactly), issue #219 §Mechanics (parity shape) | Package extension registers `engram` via `pi.registerMcpServer` when the binary is present, behind the package's consent/opt-in, reporting exactly what was registered; docs point at upstream `engram setup pi` when the binary is missing — #219 parity (recommended) \| Docs-only: README + `init-workspace` instruct `engram setup pi` / manual `mcp.json` — least code, pi path stays manual and asymmetric vs #219 \| Package takes the binary itself — strongest default, heaviest consent and platform-binary footprint | design
D1 | 2026-10-21 | decision | Q1 | human-owner | owner answer in chat (ask 21eda815-41e3-47a8-8ff2-bf010c986f87, 2026-10-21) | Deterministic probe subcommand in the runner crate — bounded timeout, JSON verdict, explicit DEGRADED when the binary or transport is absent — with skill prose pasting that verdict into Evidence | Skill prose only discarded (no testable gate, probe quality varies per weak model); pi-session hook discarded (platform-bound, breaks 70+ agent portability)
D2 | 2026-10-21 | decision | Q2 | human-owner | owner answer in chat (ask 21eda815-41e3-47a8-8ff2-bf010c986f87, 2026-10-21) | `docs/LOGS.md` is the git-traveling human/team journal owned by `log-session`; `mem_session_summary` is local decision/gotcha recall keyed by unit id — the split the issue's comment proposed, now recorded | Engram mirroring every LOGS entry discarded (permanent drift risk + double-write obligation); document-only discarded (leaves the split an accident where the issue demanded a recorded decision)
D3 | 2026-10-21 | decision | Q3 | human-owner | owner answer in chat (custom, ask 21eda815-41e3-47a8-8ff2-bf010c986f87, 2026-10-21) | The pi package registers Engram (consent-gated `registerMcpServer`) and asks the user to install it; the documented install route is `pi install npm:gentle-engram@latest` — explicitly NOT `engram setup pi`, which keeps the old version until re-executed | `engram setup pi` as the documented route discarded (stale-version behavior on update); package-ships-the-binary and docs-only discarded. The owner's add-on idea (local update script + weekly version check when a command runs, e.g. unit-lane or audit-pr) is explicitly NOT part of this answer — deferred verbatim to `## Future` for discussion

## Assumptions

Cheap-to-change defaults, dated and correctable — never silent:

- **2026-10-21 · A1** — the mirror topic key is `unit/<NN-slug>/doc` and the
  resume order is `mem_context` → scoped search → `mem_get_observation` → read
  the task file → reconcile, adopted verbatim from the owner's 2026-10-21
  canon comment on #262 (upstream-given, no repo alternative existed).
- **2026-10-21 · A2** — the carrying surfaces are `skills/unit-lane/SKILL.md`,
  `skills/execute-phase/references/*`, `skills/log-session/SKILL.md` (protocol)
  and `skills/init-workspace/*` (provisioning); the plan step may adjust the
  exact files cheaply — only the protocol's presence is load-bearing.
- **2026-10-21 · A3** — target projects get the substrate through
  `init-workspace` (consented, reporting) plus the template scaffold's
  convention block — the #219 shape, no second install path invented.
- **2026-10-21 · A4** — scope stays `medium` (roadmap row 66 labels the issue
  M), which is what puts `release` in the triage; changing it means
  re-triage.
