---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(init-workspace): charter layer 3 — the engineering interview and its deterministic landing

`init-workspace`'s charter interrogation gains a third layer: what the repository
is *for* (purpose, users, team shape, optimization target, automation appetite)
and how this team engineers (testing strategy, architectural boundaries,
dependency policy, production verification, decision records, API posture).

The interview is prose — a checklist, never a questionnaire — and the parts that
must not be prose are now code:

- `skills/init-workspace/references/ENGINEERING_INTERVIEW.md` carries sixteen
  questions in an eight-cell bank: id, layer, question, the condition that earns
  it, the bibliography idea it adapts, the two answers and the behaviour each one
  changes, the default and the charter slot the answer lands in.
- `agentic-workflow charter state|land|check` is the landing's deterministic
  half. `state` reports the guide's `## Project charter` slots, so the round asks
  only what the project has not declared; `land` writes an answer into a
  placeholder, reports a slot the project already filled as `kept` and never
  rewrites it, records a recommendation as `assumed <date> — <value>`, and
  refuses an unknown slot, an undated assumption, or a flag the operation does
  not take before moving any byte;
  `check` refuses a question that cites no source, toggles one behaviour, states
  no condition, or lands in a slot the guide lacks, and refuses a boundary entry
  outside `<boundary> → machine: <mechanism>` or `<boundary> → prose-only`.
- `template/AGENTS.md` ships the ten new charter slots, among them the
  `Architectural boundaries` row the verification-materialization step reads.

Why: an install stops shipping placeholders and starts shipping the team's own
engineering doctrine, recorded as the decisions later units read instead of
re-deriving them per unit — and a team convention always wins over the bank's
recommendation.
