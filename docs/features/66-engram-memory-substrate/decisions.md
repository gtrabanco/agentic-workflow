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

## Plan sweep (2026-10-21)

none — no questions: every claim was settled by provenance or research

The candidate-source sweep (`docs/features/*/decisions.md`,
`docs/fix/*/decisions.md`, `AGENTS.md`, architectural invariants, NRS — no NRS
unit exists) produced one `contradicts` candidate: feature 61's non-goal vs the
required-substrate decision, resolved at tier 0 from the owner decision
(`docs/LOGS.md:2451`, `docs/features/61-adaptive-unit-lane/SPEC.md:153`) and
reconciled by the docs step (CLAIM-011) — never re-asked.

## Plan surfaces (2026-10-21)

- **A5 (dated assumption, refines A2)** — the canonical protocol text lives in
  ONE file, `skills/unit-lane/references/MEMORY.md` (the lane is the boundary
  owner), with `execute-phase` and `log-session` carrying the thin instruction +
  pointer, exactly as `execute-phase` consumes
  `skills/pre-execution-review/references/LEDGERS.md` today. Provisioning keeps
  its own surface: `skills/init-workspace/references/ENGRAM.md`. Chosen over a
  new internal contract skill to avoid a new skill's manifest/budget/table
  surfaces at zero contract loss.

## Plan re-cut (2026-10-22)

Owner instruction this session: `66-engram-memory-substrate --retriage` —
re-cut P1 with the probe transport, the timeout, the injection seam and the
fixtures named. Triage re-run identical (Evidence R12); every fact below was
re-proven by measurement on this machine the same day (Evidence R13), never
defaulted:

- **Transport coverage: both transports plus the CLI** — HTTP
  `GET http://127.0.0.1:7437/health` (the SPEC Why failure mode: TCP accepted,
  HTTP unanswered), one MCP `initialize` round-trip against pi's own argv
  `engram mcp --tools=agent` (R2), and the CLI sources `engram --version`,
  `engram sync --status`, the two check-scoped `engram doctor --json --check`
  calls. This closes the research uncertainty "cover both transports or say
  which one it covers" — both are covered, and the probe issues no MCP tool
  call, so it can never mutate the memory layer. The full `engram doctor
  --json` sweep is excluded by name (12.2 s repo root, 23.2 s from /tmp).
- **Timeout**: 4 s per HTTP/runner/version call, 10 s per staleness/session
  CLI call, 30 s whole-probe ceiling — bounds chosen over healthy measurements
  of 0.019–0.450 s, with a bound hit failing that check instead of hanging.
- **Injection seam**: `runProbe({ fetchImpl, runImpl, timeoutMs })`, the crate's
  existing injectable-dependency shape (`packages/agentic-workflow/src/doc/embeddings.mjs:70`),
  so the fixtures inject fakes and millisecond bounds without network, PATH or
  a real engram process.
- **Fixtures**: the O1/O2 set named verbatim in P1 — `fixture-timeout`,
  `fixture-missing-binary`, `fixture-missing-runner`, `fixture-stale`,
  `fixture-healthy` (the last keeps `ok` reachable, no always-degraded suite).

Out-of-scope finding, recorded and routed — never folded into this unit:
`execute-phase`'s pre-write-mapper gate still links
`skills/implementation-discovery/SKILL.md`, a skill deleted by feature 61 P8
(2026-09-22) — dead links at `skills/execute-phase/SKILL.md:113` and
`skills/execute-phase/references/PREFLIGHT.md:117-119` (budgets/routes/root
gate do not catch it; verified green 2026-10-22). Re-pointing it needs an owner
choice of the surviving contract — feature 61's SPEC P8 says the seven evidence
questions "fold into triage/research" while `docs/workflow/FEATURE_WORKFLOW.md:145`
says the evidence step — plus the `skills/**` version/CHANGELOG/budgets/pi-
package-version ceremony. That is its own fix unit, never a rider on this PR.
It blocks no AC of this unit; the owner decides in this session's reply whether
it opens as a separate fix issue.

## Review-fold escape records (2026-10-23)

Rows the path-protection policy requires for the files the cycle-1 fold edits.
Append-only; each names the finding whose `finding-mark@1` reproducer it lets
the fold materialize as a regression check.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/memory-probe.test.mjs | P1 | 2026-10-23 | execute-phase | F3 fold (VF-3): adds the dual-non-ok doctor case that first demonstrates the short-circuit — the probe issued only `--check ambiguous_active_runtime_sessions` on this machine, so `sync_target_closed_space`'s error and its 20-finding detail never reached the verdict, permanently silenced by AC2's known-issue state. Pure addition: no existing expectation, fixture or assertion is touched, and the case is strictly stronger than the two single-finding tests beside it.
justification | packages/agentic-workflow/test/memory-probe.test.mjs | P6 | 2026-10-23 | execute-phase | F8 fold (VF-8): replaces the ceiling fixture's setup so every transport is black-holed instead of HTTP alone, and adds the wall-time case that pins the concurrent bounds. The two assertions (`ceilingHit true`, `every check failed`) are untouched and now hold for the honest worst case: under serial bounds the healthy fakes answered while HTTP stalled, so the old setup pinned an implementation detail of the serial loop rather than the ceiling contract.
justification | packages/pi-agentic-workflow/test/engram-provision.test.mjs | P4 | 2026-10-23 | execute-phase | F5+F6 fold (VF-5, VF-6): adds the invalid-config and project-scope-declaration cases at the seam the adapter uses (`declaredMcpServerPaths` + `provisionEngram`), plus the shipped-entry `session_start` case in shipped-adapter.test.mjs. Both reproduce real silences: an opted-in operator with a broken config file got the `not-consented` message and no problem list, and a `<cwd>/.pi/mcp.json` declaration of `engram` was invisible to the guard that claims never to shadow it. No existing expectation is edited.
justification | packages/pi-agentic-workflow/test/shipped-adapter.test.mjs | P4 | 2026-10-23 | execute-phase | F5+F6 fold (VF-5, VF-6): drives the `session_start` listener of the shipped entry — the surface only the adapter reaches — with a temp agentDir/cwd pair, a project `mcp.json` that declares `engram`, and a present-but-invalid config. The double gains `registerMcpServer`/`getMcpServers` so the registration the invariant forbids becomes an observable failure instead of an untested branch. Existing assertions unchanged.
justification | packages/pi-agentic-workflow/test/settings-console.test.mjs | P4 | 2026-10-23 | execute-phase | F4 fold (VF-4): adds the save round-trip that opens a file carrying `memory`, `pathProtection` and `advance`, saves, and asserts all three survive — the eight-key allowlist in `clean()` dropped them silently, so an opt-in written by hand disappeared on the next save. Pure addition; the existing "keep the rest of the file" cases stay as they were.
```
