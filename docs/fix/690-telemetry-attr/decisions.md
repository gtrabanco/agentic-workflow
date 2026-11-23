# Decisions — fix/690-telemetry-attr

One row per decision this unit took while implementing issue
[#690](https://github.com/gtrabanco/agentic-workflow/issues/690). **Every row
below is `unit-only`**: none of them binds work beyond this unit, so nothing is
promoted to the guide, `ARCHITECTURE.md` or `ARCHITECTURAL_INVARIANTS.md`
(`AGENTS.md` § Working rules, “A cross-unit decision is promoted, not buried”).

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs | P1 | 2026-11-22 | execute-phase | The issue's reproducer is a session-level fact no existing suite can state: `noteCommand` had one caller and the runner door none, so the accumulator was never built and no sink ever saw a sample. This suite is that reproducer corpus plus the seam's contract; it is observed failing on the unwired seam and stays as the guard against a future attribution door that silently does nothing.
justification | packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs | P1 | 2026-11-22 | execute-phase | The refusing-sink report is the wiring's own behaviour, so its cases belong in the suite that already owns the wiring. Every existing case keeps its exact assertions; this unit appends the report/stderr/off cases the secondary defect has no test for today — an added contract, never a relaxed assertion.
justification | packages/pi-agentic-workflow/test/session-telemetry.test.mjs | P1 | 2026-11-22 | execute-phase | The accumulator is the module whose `catch {}` swallowed the failure, so the `onSinkError` cases belong beside the sink loop it already tests. Existing cases keep their assertions; the unit appends the per-sink report and the throwing-reporter boundary.
justification | packages/pi-agentic-workflow/test/shipped-adapter.test.mjs | P1 | 2026-11-22 | execute-phase | The end-to-end half of the same fact can only be stated through the shipped entry, which is what this suite builds (`shippedEntry`). The unit appends one case there — the runner door reached through the real adapter, with `AGENTIC_WORKFLOW_RUNNER` pointing at a fake runner — and every existing case keeps its assertions.
```

## D1 — the attribution seam is an injected callback

`workflow-tools.ts` is Pi-free by contract: its own head states that a spec's
`execute(params, cwd)` returns a `WorkflowToolRun` and that the adapter owns every
Pi convention. Importing the telemetry wiring there would make a Pi-free module
know Pi. The seam is therefore `WorkflowToolsDeps.onRunnerCommand`, threaded from
the adapter the way `spawnScript`, `runSensor` and `bin` already are (`PE-004`),
and it is what lets the suite prove the ordering without a live session.

## D2 — the seam runs before the spawn

The spawned runner inherits `process.env` (`PE-008`), so `AG_WF_PHASE` has to be
in the environment when the child starts, not after it exits. Attributing after
the spawn would also lose the unit whenever the spawn itself fails or times out —
the session was still working on that unit.

## D3 — the five typed gate tools get no seam

None of them runs a unit-scoped invocation (`PE-003`): the status tool takes no
parameters, so its `workflow-status --json-only` sensor spawn can never carry a
unit argument — the subcommand name is in `UNIT_COMMANDS`, which is exactly why
the claim is about the invocation, not the name — and the four gate tools run
`diff-guard`, `phase-lint`, `audit-pr-gate` and `pre-execution-snapshot`, none
of them a `UNIT_COMMANDS` name. A seam with nothing to resolve
would be a second door that silently does nothing, which is the defect this unit
repairs rather than duplicates.

## D4 — the degraded report is latched per sink, and its channel is `notify`

A broken sink fails on **every** emission, so an unlatched report would be one
line per settled run. The latch is keyed by sink `name`, which is the identity a
sink already declares. The channel is the wiring's `onDegraded`; the adapter
passes the operator's `notify` (the extension's existing diagnostic channel,
`PE-009`), and a caller that names none gets exactly one stderr line — the one
channel every host has, and the reason the accumulator itself never writes
anywhere.

## D5 — one broken sink still costs the others nothing

`writeCurrent` keeps writing every remaining sink after one refuses. That rule is
not this unit's to trade; only the silence goes away.

## D6 — a reported failure is never re-attempted as a duplicate

The dedup identity is recorded before the sinks run, so repairing a broken sink
cannot append a second copy of a sample the healthy sinks already hold.

## D7 — no existing assertion is deleted or narrowed

Every case in the four touched suites stays green as written; this unit only
appends cases (`PE-006` is the baseline they were appended to). `IR3` holds.

## D8 — the triage block's `review` step and relay addendum are copied, not run

`runner unit-route --triage` printed the machine's step list, which includes
`review`, plus a relay bootstrap hint because this session runs under pi-web. The
block is pasted verbatim as the machine's own output; this owner-directed local
workflow runs no `review-change`/`audit-pr` pass on the branch and bootstraps no
relay packet — the owner is the external verifier.

## D9 — one unit doc for one issue, and it is this one

A concurrent session's triage committed a stub `docs/fix/690-telemetry-attr/SPEC.md`
to `main` before this unit's ledgers were cut. The folder name is kept (one issue,
one unit doc, and the branch's flat name already matches it) and the stub is
superseded in place by these ledgers; its `scope: high` reading is corrected
because `high` is a risk tier, not a value of the scope vocabulary, and the
computed risk tier for this change is `standard`.
