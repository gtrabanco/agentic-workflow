---
type: fix
scope: high
roadmap_summary: Issue [#690](https://github.com/gtrabanco/agentic-workflow/issues/690) (M): telemetry automatic sampling never writes because `noteCommand()` is only wired to the slash-command registrar while unit-scoped work flows through deferred tools — wire `agentic_workflow_run.execute()` to `noteCommand()` so the telemetry accumulator builds and sinks receive samples.
---

# fix/690-telemetry-attr

> One-line: telemetry's attribution chain never built for real work because
> `noteCommand()` was wired only to slash commands — wire the deferred tool path
> so the accumulator sees units and sinks receive samples.

## Issue

[#690](https://github.com/gtrabanco/agentic-workflow/issues/690) —
Telemetry: automatic sampling never writes — noteCommand() is not wired to
agentic_workflow_run

## Specs

**S1 — Wire agentic_workflow_run to noteCommand().**
> The actual work path runs through the deferred workflow tools, primarily
> `agentic_workflow_run` (`packages/pi-agentic-workflow/src/extension/workflow-tools.ts`),
> the generic door every skill's `runner <subcommand> [args…]` citation goes through.
> Wire it to call `noteCommand(subcommand, args)` before spawning — that is the
> only site through which the subcommands `UNIT_COMMANDS` recognizes actually flow.

**S2 — Wire all unit-scoped deferred tools.**
> Any workflow tool that runs a unit-scoped subcommand must call `noteCommand()`,
> not just `agentic_workflow_run`.

**S3 — Fix secondary defect: writeCurrent() swallows sink errors.**
> `writeCurrent()` (`src/session-telemetry.ts`, ~line 258) swallows sink errors
> with `catch {}` — an explicit degraded-report (stderr/notify) so a broken sink
> is visible, consistent with the feedback-channel contract.

## Acceptance criteria

1. With telemetry enabled, unit-scoped runs (execute-phase, unit-lane, fold-findings, workflow-status) produce samples in `.pi/.telemetry/sessions.jsonl` and `TIER_COST.md` — no reconstructed rows only.
2. `agentic_workflow_run.execute()` calls `noteCommand()` before spawning.
3. `writeCurrent()` reports degraded status on sink errors instead of swallowing them silently.
4. Affected package suites pass; version-parity gate green.

## Relevant files

- `packages/pi-agentic-workflow/src/session-telemetry.ts` — telemetry accumulator and wiring
- `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` — deferred tool execution
- `packages/pi-agentic-workflow/src/extension/index.ts` — slash-command registrar
- `packages/pi-agentic-workflow/test/` — telemetry tests

## Dependencies

None.

## Rollback strategy

Additive: only a new call site in `workflow-tools.ts`. Revert the single-line change.

## Severity

high — telemetry is a core observability surface; all automatic samples are lost, only manual reconstruction works.

## Branch

`fix/690-telemetry-attr`