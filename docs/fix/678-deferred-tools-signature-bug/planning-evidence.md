# Planning evidence — fix/678-deferred-tools-signature-bug

One row per Engineering claim the change rests on (`id | authority-kind | claim |
source | freshness | affected-decision-or-obligation`). An unsampled assumption
is `unknown` with an owner, never a silent citation.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | version-pinned doc | pi's custom-tool contract is `execute(toolCallId, params, signal, onUpdate, ctx)` — the documented example spells exactly that parameter list | `docs/extensions.md` § Custom tools / § Tool Definition, `@earendil-works/pi-coding-agent` 1.6.0 (the version the host here runs; the package's peer floor is `>=1.1.0`) | current | O1, O3, O4 |
| PE-002 | version-pinned code | the host invokes a tool as `prepared.tool.execute(prepared.toolCall.id, prepared.args, signal, <partialResult callback>, …)` — five leading arguments, the fifth being the context | `@earendil-works/pi-coding-agent` 1.6.0 bundle, `prepared.tool.execute(` call site | current | O1, O2 |
| PE-003 | version-pinned doc | the context handed to a tool's `execute` carries `cwd` ("Current working directory") and adds `ctx.tools` / `ctx.executeTool()` to the base context | `docs/extensions.md` § ctx.cwd, § ExtensionToolContext | current | O2, O3 |
| PE-004 | code | the Pi-free specs declare `execute(params: Record<string, unknown>, cwd: string)` and the factory hands them straight to `toolRegistrar.registerTool(tool)` — nothing translates | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:81` (the interface) and `src/extension/factory.ts:213-218` (the registration loop) | current | O1, O4 |
| PE-005 | code | five of the six tools read `params` on their first line (`requireString` on `subcommand`/`base`/`path`/`stage`/`unit`), so a string `toolCallId` reaching the spec as `params` throws `<name> is required and must be a non-empty string` before any spawn | `workflow-tools.ts` `runnerRunSpec`, `diffGuardSpec`, `phaseLintSpec`, `snapshotVerifySpec`; `requireString` at `:184` | current | O5 |
| PE-006 | code | `agentic_workflow_status` reads no `params`, but forwards its second argument into `runSensor(cwd, …)`, and `resolveCwd` swallows an unreadable path and returns `process.cwd()` | `workflow-tools.ts` `statusSpec` and `src/conductor/sensor.ts:43-48` | current | O5, O6 |
| PE-007 | code | `registerTool` is read structurally by the adapter (`toolRegistrar(pi)`), so a host double with a `registerTool` recorder observes the exact object a real host receives | `src/extension/index.ts:311-320`, `src/extension/factory.ts:56` | current | O1, O4, O7 |
| PE-008 | code | `runSensor`'s refusal contract is `{ ok: false, refusal: "sensor-degraded", detail }`, and the tool surface already maps it to `isError: true` with the record as `structuredContent` — a cwd refusal needs no new vocabulary | `src/conductor/sensor.ts` (every failure path), `workflow-tools.ts` `statusSpec` degraded branch | current | O6 |
| PE-009 | code | the existing spec-level suite drives `status.execute({}, "/fixture/project")`, i.e. the Pi-free seam, which is not the seam that broke — a wiring suite at the registration boundary is the missing coverage | `test/workflow-tools.test.mjs:166,182,194` and the gate-tool cases | current | O7 |
| PE-010 | code | the shipped entry's tool assertion checks `typeof tool.execute === "function"` only — it cannot fail on an arity mismatch, which is why the bug shipped green | `test/shipped-adapter.test.mjs:780-790` | current | O7, O8 |
| PE-011 | code | the `runner` subcommands the wiring suite drives (`setup-env --check`) are spawned through the crate resolver, so the assertion that matters at this boundary is the shape of the result, not the subcommand's own behaviour | `src/extension/workflow-tools.ts` `runnerRunSpec`, `src/runner-bin.ts` `runnerLaunch` | current | O5, O9 |

## Notes

- PE-001…PE-003 were sampled from the installed 1.6.0 package, not from model
  memory: the docs and the host's own call site agree on the five leading
  arguments, which is the fact the whole fix rests on.
- No row is `unknown`. The one deliberate non-claim is the harness's internal
  scheduling (whether a result is rendered before `execute` resolves) — the fix
  does not depend on it.
