---
name: aw-doctor
user-invocable: true
version: 5.0.0-canary.20261128.1
argument-hint: "[--unit <slug>] [--search \"<words>\"] [--candidate <n>]"
description: >
  Short name for /agentic-workflow-doctor: one user-initiated pass over this
  project's own ceremony-failure record, a fixed discard/report rubric, one
  anonymized bundle, routed upstream with consent. Triggers: "aw-doctor",
  "/aw-doctor", "short doctor", "run the doctor".
---

# aw-doctor — the short name

> This skill carries **no rule of its own**. It is the short invocation name for
> `/agentic-workflow-doctor`; the owner of every instruction is that skill's
> `SKILL.md`, and the two are one capability, not two.

## Turn contract

Load and verify the **canonical** [Turn contract](../orchestration-envelope/references/TURN_CONTRACT.md) before ending every turn: this skill is a **redirect**, so the read-only profile substitutes every box, and the turn ends after one action. Skill-specific addition:

```
✓ The owner skill was read and its steps followed; nothing was executed from this
  page, because this page orders nothing
```

Missing reference → STOP.

## When to use

When the user types `/aw-doctor` or says "run the doctor". Both names reach the
same owner skill; this page exists so the short form resolves on every host.

## Process

1. Read [`../agentic-workflow-doctor/SKILL.md`](../agentic-workflow-doctor/SKILL.md).
2. Follow it literally, from `## Step 0` to its closing `→ Next:` block, with the
   arguments the user passed.

Nothing else: no step is summarized here, so a change to the capability is one
edit in one file.

## Guardrails

- Never restate, shorten or "improve" an instruction from the owner skill: a
  second copy is the defect this page avoids.
- Never run a command this page names — it names none on purpose.
- If the owner skill is missing, stop and say so: a redirect with no target is an
  error, not a fallback.

## Relationship to other skills

- `agentic-workflow-doctor` is the owner; this page only resolves the short name.
- The alias exists because a skill's command name is its frontmatter `name:` —
  there is no alias field in the skill contract (the unit's `D2`).

## Done when

- The owner skill was read and its `Done when` list is the one that decides.
- The closing block is the owner's, not a second one of this page's invention.

## Portability (agents other than Claude Code)

Preamble + no-slash-menu fallback: owned by
[`PORTABILITY.md`](../orchestration-envelope/references/PORTABILITY.md) — this
section keeps only this page's own fallback:

- **No per-skill `model:`/`effort:`** — irrelevant here: this page runs nothing.
- **No `bun`/`node` assumption** — no command is cited here.

→ Next: `/agentic-workflow-doctor` — the owner skill, which this page only resolves the short name for.
  · no alternative → the owner's own closing block covers the real choices
