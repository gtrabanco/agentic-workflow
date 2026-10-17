# Tests step

## Purpose

Run and verify the tests the triage determined are applicable. Test execution
rides the executor's phases (each phase's `validator:` runs the project's
gate); when the tests step is the turn's own boundary, it hands off like
implement does — one `/execute-phase <NN-slug> P<k> (tier: <tier>)` turn,
never inline.

## Inputs

- The unit's Applicable tests section (filled by triage)
- The project's test runner command from Workflow conventions

## Fixed output contract

Each test run is recorded in the Evidence section:

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| T1 | <test command> | exit_code | summary ≤2 lines | <model> |

## Checklist (pass only if)

- [ ] All applicable tests ran (the project's gate command executed)
- [ ] Every test passed — no test was weakened to pass
- [ ] Results recorded in the Evidence section with command, exit, output
- [ ] If no tests step for this unit: `n/a — no tests step for this unit`

## Forbidden

- Never weaken a test to pass
- Never silence test failures
- Never skip a test that the triage catalog demands
- Do not add tests the triage did not request (scope creep)