# 10 — envelope-orchestrator-only · progress

One entry per phase.

- **Planning (2026-07-10)** — SPEC (both halves) + full artifact set written from
  issue #17 via `plan-feature` → `plan-feature-from-issue` → `plan-feature-scaffold`.
  Verified surface: 14 user-facing skills carry `## Machine envelope`
  (`workflow-status` keeps it, `orchestration-envelope` becomes the contract home).
  Roadmap registered as feature 10, status `planned`. **Execution is
  driver-gated** — blocked on the external opencode/Node driver shipping the
  repair loop first.
- **P1 (2026-07-10)** — Added the canonical driver system-prompt snippet to
  `skills/orchestration-envelope/SKILL.md` (new `## Driver system-prompt
  snippet + repair loop` section) and documented the repair loop protocol in
  `docs/workflow/ORCHESTRATION.md` (new `## Injecting the envelope
  requirement` section) and `docs/workflow/PORTABLE_PROMPT.md` (new `## 2b.`
  section). `workflow-status`'s inline-emitter status noted in all three.
  AC4/AC5 verify greps green; `npx skills add . --list` confirms discovery
  intact. Driver gate: no external driver exists yet (user-confirmed), so
  started under `--force` — see `decisions.md` D9.
- **P2 —** _pending_
- **P3 —** _pending_
- **P4 —** _pending_
