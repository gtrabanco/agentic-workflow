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
- **P2 (2026-07-10)** — Applied the three-deletion removal shape to all 14
  skills (`audit-docs, audit-pr, bump-skill, design-feature, execute-phase,
  generate-docs, init-workspace, log-session, plan-feature, plan-fix,
  product-audit, review-change, ship-roadmap, triage-issue`): removed the
  `## Machine envelope` section, the turn-contract envelope line, and the
  "then the machine envelope" clause from each closing block. Also cleared
  residual prose mentions AC2's grep caught beyond the section/box:
  bump-skill's obsolete lint bullet (`## Machine envelope` was a per-skill
  requirement that no longer holds for these 14), design-feature's dangling
  `(see *Machine envelope*)` self-reference, and execute-phase's/
  ship-roadmap's driver-loop descriptions (rephrased to reference the
  driver-injected envelope generically, per `orchestration-envelope`, instead
  of the literal removed phrase). `workflow-status` and
  `orchestration-envelope` untouched. AC1/AC2/AC3 greps green; `npx skills add
  . --list` confirms discovery (56 skills, no malformed frontmatter).
- **P3 —** _pending_
- **P4 —** _pending_
