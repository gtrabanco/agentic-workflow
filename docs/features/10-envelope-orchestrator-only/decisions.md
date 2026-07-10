# 10 — envelope-orchestrator-only · decisions

Architecture/scope decisions + open questions. All engineering decisions are
resolved (no blanks left in the SPEC).

## Decided

- **D1 — MAJOR bump for each stripped skill.** Removing the `## Machine envelope`
  section is a contract change (an external consumer relied on it), so each of the
  14 skills gets a MAJOR `version:` bump, per the repo's "Version every change"
  rule. Enforced via `bump-skill` in P3, not hand-edited.
- **D2 — Remove the turn-contract box alongside the section.** Issue #17 is
  explicit ("the `## Machine envelope` section **and** its turn-contract box"). A
  skill that no longer emits the envelope must not still list emitting it as a
  turn-contract obligation.
- **D3 — `→ Next:` becomes the true last output.** Any closing-block wording that
  says "then the machine envelope as the ABSOLUTE last output" is removed so the
  recommendation block is genuinely last.
- **D4 — `orchestration-envelope` is the canonical home.** The schema + the
  driver-injected system-prompt snippet live there; `ORCHESTRATION.md` /
  `PORTABLE_PROMPT.md` are the driver-facing docs. No new mechanism is invented —
  this extends the existing driver-guidance layer (features 04/05).
- **D5 — `workflow-status` keeps the envelope.** Emitting it IS the sensor's
  function (`--json-only` is meaningless without it) — the one skill exception.
- **D6 — Schema + npm package frozen.** `packages/agentic-workflow-schema/` is not
  touched (AC8); parsers keep working unchanged.
- **D7 — Driver gate is external, blocks execution not planning.** Recorded in
  `known-issues.md`; not a roadmap feature dependency. The `plan-feature` closing
  block flags it so no one runs `execute-phase` prematurely.
- **D8 — Surface is 14 skills, not "~13".** The issue's "~13" is approximate; the
  grep-verified set of user-facing `## Machine envelope`-bearing skills minus
  `workflow-status` is exactly 14. The SPEC's explicit list is authoritative.

- **D9 — Driver gate force-overridden, 2026-07-10.** Asked the user directly
  whether an external opencode/Node driver consuming the machine envelope
  exists; answer: no such driver exists, so no automated consumer depends on
  the envelope today. Started `execute-phase 10 P1` with the gate unmet
  (`--force`), per the skill's user-only escape hatch. Effect: none in
  practice — there is no external routing to break.

## Open questions

- None blocking. (The only unknown — driver readiness — is an external gate, not a
  design question; see `known-issues.md`.)
