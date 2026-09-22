# Plan step

## Purpose

Cut tasks from acceptance criteria. Each task names its validator. Smallest
first. No future-phase work.

## Inputs

- The unit's Acceptance criteria (filled by the design step)
- The unit's non-goals

## Fixed output contract

Fill the unit doc's **Tasks** section:

```
P1 — <task description> (validator: <what proves it works>)
P2 — <task description> (validator: <what proves it works>)
…
Pn — last task is verification when the unit has behavior
```

## Checklist (pass only if)

- [ ] Every AC maps to at least one task
- [ ] Tasks are ordered smallest first
- [ ] Each task names its validator (command, output, or observation)
- [ ] Final task is verification (proves the whole unit works)
- [ ] No task reaches into a future-phase concern (docs, release, migrations)
- [ ] Phases labeled P1, P2, … (never S1, Step 1)

## Forbidden

- Do not bundle across phase boundaries — one phase = one commit
- Do not plan work beyond the unit's acceptance criteria
- Do not include docs/release tasks here — those are separate catalog steps
- Do not invent tasks that the ACs do not demand