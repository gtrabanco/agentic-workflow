# 70 — pi-tool-surface

> One-line: the pi package registers the envelope-emitting deterministic scripts as deferred pi tools with published-contract output schemas and `isError`-carrying red gates.

## Specs

**S1 — Apply issue #274 to this repository.**
> Apply to this repository: issue #274

The request names the forge issue as the requirement source. Its binding lines,
quoted from `gh issue view 274` at the cut head, are the requirement corpus:

> This feature registers the **envelope-emitting deterministic scripts** — the ones agents already run via `bash` in the middle of the loop — as deferred pi tools whose declared output schema *is* the machine contract the repo already publishes.

> - **Skills never change**: portability across 70+ agents keeps the bash wording; tools are the pi-native path, thin wrappers over the same scripts (no second source of truth for any receipt).
> - **Not in this issue**: MCP (owned elsewhere), enabling codemode (operator config, done 2026-09-29), model/routing changes (#201).

Scope cut taken from the issue's own phase plan: **P1** (`workflow-status` tool +
the package's first-tool contract) and **P2** (red gates: `diff-guard`,
`phase-lint`, `audit-pr-gate`, `pre-execution-snapshot verify`) are delivered;
**P3** is evaluated against the issue's real-gain bar with the verdict recorded
below (no adoption without a named programmatic consumer); **P4**
(`ctx.executeTool` in the conductor) stays conditional on P1 usage evidence and
is out of this unit by the issue's own wording.

## Acceptance criteria

One observable, testable criterion per deliverable, each citing S1 (the forge
issue is the authority) and naming the check that proves it. Frozen at cut.

- **AC1** — The `workflow-status` tool returns the envelope as `structuredContent`
  without parsing; a degraded run arrives as `isError: true` with the envelope
  attached. (Issue AC: "a codemode script calling the tool receives the envelope
  as `structuredContent` without parsing; the degraded case arrives as
  `isError: true` with the envelope attached.") Check:
  `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` exits 0
  with the status-tool cases green.
- **AC2** — The tools are not declared to the model: `exposure: "deferred"` on
  every registered tool, so `tool_search` finds them and standing session token
  cost is ≈ 0 when unused. (Issue AC: "tool is not declared to the model
  (deferred) — `tool_search` finds it".) Check: the registration test asserts
  `exposure === "deferred"` on all five tool definitions.
- **AC3** — The `workflow-status` tool spawns the same script path the conductor
  sensor spawns (`<bin> scripts/workflow-status.mjs --json-only` in the project
  under work — the project's own checkout copy, never an in-process import); the
  sensor's existing suite stays unchanged and green. (Issue AC: "sensor output
  byte-identical … same spawn, same receipts; existing sensor tests unchanged
  and green.") Check: `bun test packages/pi-agentic-workflow/test/conductor-sensor.test.mjs`
  exits 0 with no edit to that suite.
- **AC4** — Every adopted script's `outputSchema` is derived from (or tested
  against) the contract its skill already publishes — no second schema source.
  The status tool's output schema reuses `@gtrabanco/agentic-workflow-schema`'s
  published `envelope.schema.json` verbatim; the gate tools' schemas are tested
  against live script output. Check: the schema-source test asserts the
  published envelope schema is embedded verbatim, and the gate-tool tests
  validate real script output against the declared schemas.
- **AC5** — The red-gate tools return `isError: true` + structured findings on a
  breach (diff-guard breach, phase-lint BLOCKED, snapshot verify stale/missing,
  audit-pr gate BLOCKED), so Evidence rows can quote the structured result.
  (Issue AC: "red gate returns `isError` + structured findings".) Check: the
  gate-tool tests in `test/workflow-tools.test.mjs`.
- **AC6** — `bun run test` green in `packages/pi-agentic-workflow`; the package
  ships the change per repo rules (`.changeset/` intent file; peer
  `@earendil-works/pi-coding-agent` already `>=1.1.0`, satisfying the issue's
  `>=0.99.0` floor). Check: `bun run test` in `packages/pi-agentic-workflow`
  exits 0.

## Impact

- Consumers: codemode scripts and `tool_search` in any pi session with the
  package installed — they gain typed `structuredContent` for five scripts.
  The model's view does not change (deferred exposure).
- The conductor sensor (`runSensor`) gains an additive optional `envelope` field
  on its degraded result so the tool can attach the envelope on degradation; the
  degraded-refusal contract (`ok/refusal/detail`) is unchanged and its suite is
  untouched.
- The extension entry (`src/extension/index.ts`) calls `pi.registerTool` at
  load; the shipped-adapter double needs an additive `registerTool` stub. No
  existing assertion changes.
- Skills never change (issue bound): no SKILL.md is touched, so no
  `skill-lint`/golden-fixture pass is owed.
- Considered and left alone: `AGENTS.md` `normative-surfaces@1` gains no row —
  the tool parameters are declared by the JSON schemas inside
  `workflow-tools.ts` itself (the machine surface is the code, the same status
  `envelope.schema.json` holds); no skill prose orders tool tokens.

## Retirements

Nothing is retired: the tools are additive thin wrappers; the bash path, the
skills' wording and the conductor's sensor chain all stay. `rg -c 'registerTool'`
at the cut head over `packages/pi-agentic-workflow/src/` → 0 matches (no prior
tool surface to replace).

## Non-goals

- P3 adoption of `unit-route` (evaluated only — verdict below), record-writer
  tools, P4 conductor `ctx.executeTool`, MCP surfaces, codemode enabling,
  model/routing changes, any skill edit, any change to the scripts themselves.

## P3 evaluation (recorded, no adoption)

`unit-route.mjs --triage` (×20 in-loop) passes the issue's frequency test but
not the real-gain bar: no programmatic consumer exists today (the skills call it
through bash, and the lane's consumer is the model reading text), so a typed
wrapper would add a second invocation surface without a named reader. The
record writers (`review-receipt`, `session-close`, `ledger-provenance`) are
mutations; the issue gates them on a named consumer — none is named. Verdict:
**do not adopt in this unit**; revisit when a P1 consumer evidence base exists
(the same trigger that opens P4).

## Risk tier

Computed at cut: `bun scripts/ceremony.mjs tier classify` over the change's
paths → `standard` (executable content in `workflow-tools.ts`), task_size
`understood / contained / resumable-from-diff`.

- **Tier** — `standard` · **Task Size** — `Understood + Contained risk + Resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

## Future

- 2026-11-08 — P4 `ctx.executeTool()` in the conductor, conditional on P1 usage
  evidence — status `open` (the issue's own condition, deliberately unmet here).
- 2026-11-08 — P3 `unit-route` adoption if a programmatic consumer appears —
  status `open`.

## Future cost

- The five tool definitions must keep their `outputSchema` aligned with the
  scripts' output contracts; the schema-source and live-output tests are the
  standing check (binds future edits to `workflow-tools.ts`).
- New envelope-emitting scripts become tool candidates under the same real-gain
  bar (binds future script authors).

## Applicable tests

- `packages/pi-agentic-workflow/test/workflow-tools.test.mjs` (new — RED first)
- `packages/pi-agentic-workflow/test/conductor-sensor.test.mjs` (existing, must stay green untouched)
- `packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` (existing; one additive `registerTool` stub in its Pi double)
- `packages/pi-agentic-workflow` full suite (`bun run test`)

## Known pre-existing issues

- The conductor sensor drops the parsed envelope on a degraded run (returns
  refusal + detail only) — affects this unit: yes, the degraded-with-envelope
  AC needs the envelope; fixed additively inside this unit (optional field, the
  failure contract unchanged).

## Tasks

- P1 — RED: `test/workflow-tools.test.mjs` with one failing test per requested
  rule — registration shape (five deferred tools, namespace, annotations),
  status happy/degraded/spawn-failure/schema-source, each gate tool's
  pass/breach mapping, and the live-script-output validation for diff-guard and
  phase-lint (validator: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` exits 1 — red on the missing module)
  (Implements: S1)
- P2 — `src/extension/workflow-tools.ts`: the Pi-free tool module — namespace
  const, spec type, shared spawn helper, the five tool specs with their
  parameter/output schemas, and the additive sensor envelope attachment
  (validator: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/extension/workflow-tools.ts, packages/pi-agentic-workflow/src/conductor/sensor.ts
- P3 — Wire registration: `toolRegistrar` seam in the factory, `pi.registerTool`
  adapter call in `index.ts`, additive `registerTool` stub in the shipped-adapter
  double (validator: `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs packages/pi-agentic-workflow/test/settings-console.test.mjs packages/pi-agentic-workflow/test/serena-readiness.test.mjs` exits 0)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/src/extension/factory.ts, packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- P4 — Docs and release surface: package README section, `.changeset/` minor
  intent, roadmap row 70 → `in-progress` via the crate CLI
  (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0; `rg -n "workflow tools" packages/pi-agentic-workflow/README.md` matches ≥ 1)
  (Implements: S1)
  Relevant files: packages/pi-agentic-workflow/README.md
- P5 — Verification: full package suite plus the root gate's package-relevant
  checks; ledgers closed (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S1)

### Planning evidence

For M units the ledger lives beside this doc — see
[`planning-evidence.md`](planning-evidence.md). This section names it and carries
nothing else.

### Obligations

For M units the ledger lives beside this doc — see
[`planning-obligations.md`](planning-obligations.md). This section names it and
carries nothing else.

## Triaged steps

> Not run: this unit is applied inline under the repository owner's local
> unpublished workflow (the §5 ledger freeze substitutes for the lane's plan
> step). The lane's `/unit-lane` triage is deliberately not executed on the
> repo's own surgery (local workflow §4). No `## Triaged steps` block is forged
> to fill the slot.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-08, the request, verbatim:
  ```
  Apply to this repository: issue #274
  ```
- **E1** — 2026-11-08, `gh issue view 274` · exit 0 · issue OPEN, labels
  `enhancement`, `backlog`, `postponed`; requirement text sampled for S1.
- **E2** — 2026-11-08, `bun scripts/ceremony.mjs tier classify --paths …` ·
  exit 0 · tier `standard`, task_size `understood/contained/resumable-from-diff`.

## Next

Implement P1 (RED suite) against the frozen ledgers, then hand the diff to the
owner for external verification.

## References

- Issue [#274](https://github.com/gtrabanco/agentic-workflow/issues/274) (closes via the PR)
- Roadmap row 70 (`pi-tool-surface`)
- Related (soft) — #409: the gate receipt envelope is one of the schemas these
  deferred tools expose as `outputSchema` (issue's own triage note)
