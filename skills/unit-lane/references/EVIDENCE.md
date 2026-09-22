# Evidence step

## Purpose

One row per acceptance criterion: what was run, exit status/digest, observed
output (≤2 lines), verified-by. A reviewer re-runs it.

## Inputs

- The unit's Acceptance criteria
- The Evidence section (where evidence rows are appended)

## Fixed output contract

Append to the unit doc's **Evidence** table. One row per AC:

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| ACn | <command or sha> | <exit / sha> | <≤2 lines> | <model or reviewer> |

## Checklist (pass only if)

- [ ] Every AC has exactly one evidence row
- [ ] Each row contains: command/run, exit status/digest, output ≤2 lines
- [ ] Verified-by names the model that ran it or a human reviewer
- [ ] No invented evidence — every row corresponds to an actual run
- [ ] The evidence reproduces — a reviewer can run the same command

## Forbidden

- Invented evidence is the cardinal sin — never record a row without running it
- Never alter acceptance criteria to match evidence
- Never claim a command passed when it did not
- Never omit the exit status or digest