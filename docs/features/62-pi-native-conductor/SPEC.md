---
type: feature
scope: large
---

# 62 — pi-native-conductor

> Deterministic pi-native orchestrator replacing the retired ship-roadmap role: sensor → decideWorkflowAction() → verbatim continuation invocation, as pi package commands over the lane's runner.

## Objective

Ship a deterministic conductor as `@gtrabanco/pi-agentic-workflow` commands that reads the workflow-status Envelope v2, decides the next action with `decideWorkflowAction()` (schema package), and invokes the printed continuation verbatim — replacing the retired `ship-roadmap` skill's orchestration role with code instead of model-held procedure. Exists now because feature 61 retired ship-roadmap and deferred its conductor half to this row.

## Why

`ship-roadmap` (retired in feature 61 P9) carried the stage-orchestration loop — sensor → decision → next command — plus the urgency micro-judge, the unattended `--adversarial 2` floor, batch-design, and closeout, all as prose a model had to re-derive every invocation. Feature 61 landed the lane, the sensor's priority queue (`next.recommended` computed in code), and the continuation contract (`next.continuation` with argv + preconditions + refusals), but no machine consumer drives units end-to-end from it yet: the operator still reads the envelope and types the next command by hand.

## User outcome

An operator invokes one pi command (e.g. `/advance` or the conductor entry) and the system runs the deterministic decide-then-invoke loop over the lane's runner: it prints the sensor envelope's recommendation, executes the continuation verbatim when preconditions hold, and stops with a typed refusal otherwise. Unattended runs keep feature 20's merge-authority rules (default: human merge).

## Acceptance criteria

Numbered list. Each AC is induced from a concrete user scenario ("I do X and observe Y").
Make each AC command-verified where possible. If the request is too vague to state an AC,
STOP and ask the user with concrete options — never invent one.

## Non-goals

- Not the AWL runner (the future public `agwo.party` runner) — this is the pi package command layer only; `npm name agwo` stays reserved.
- Not a re-implementation of the lane, the triage catalog, or the sensor — the conductor consumes Envelope v2 and `decideWorkflowAction()` verbatim; it never re-derives a decision the schema package already computes.
- No merge to `main` performed by the conductor — feature 20's merge-authority rules keep the human merge as the default; `--fullauto` only changes what the conductor may *invoke*, never what it may *merge*.
- No new envelope fields, refusal codes, or reason codes — this unit is a consumer; any schema change is a separate unit.
- No revival of ship-roadmap prose — behaviors migrate as deterministic code paths, not as re-created skill text.

## Future cost

- Any new `next.reason` code, refusal code, or envelope field binds the conductor's decision table — add the mapping in the same PR that changes the schema package.
- The conductor must keep working when the sensor degrades (`degradations[]` present) — fail closed to a typed refusal, never guess.
- Retired-skill aliases must not reappear: the conductor's command names live in the pi package, not in `skills/`.

## Future cost

Standing obligations this unit imposes on future work. Each row: the rule + who it binds.

## Applicable tests

- `packages/pi-agentic-workflow/test/` — new conductor suites copied from the existing harness (fake pi context, registered-command dispatch): decision-table mapping (each `next.reason` → the exact continuation), refusal paths (all `CONTINUATION_REFUSALS` codes), precondition gate (unsatisfied precondition → typed refusal, no invocation), urgency micro-judge and unattended adversarial floor, batch-design and closeout steps.
- `scripts/continuation-discipline.test.mjs` + `scripts/workflow-status-sensor.test.mjs` (root suite) — must stay green: the conductor consumes, never mutates, the envelope contract.
- `packages/agentic-workflow-schema` suite — stays green (no schema change; consumer-only).

## Known pre-existing issues

- Issue [#246](https://github.com/gtrabanco/agentic-workflow/issues/246) — product-owned review findings have no machine route (`unit-route` falls through to `fold`). **does-not-affect** this unit: the conductor consumes `next.*` from the sensor, not review-finding routing.
- `@gtrabanco/pi-agentic-workflow` still depends on `file:../agentic-workflow` on `main` (publish follow-up in PR #253). **affects** this unit's release step only: the conductor's commands must work with the pinned `0.1.1` runner, so the release step merges/lands after the dep flip.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification when the unit has behavior.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes absorbed issues via `Closes #N`. `none` if empty.
