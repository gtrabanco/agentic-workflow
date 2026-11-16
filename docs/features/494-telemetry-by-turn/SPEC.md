---
type: feature
scope: large
roadmap_summary: Per-turn telemetry: the sample carries the phase and package version that produced it, the model, and the input/output/cache/reasoning breakdown, written to a per-session JSONL beside the `tier-cost@2` ledger, readable through a report CLI and enforced by a coverage test. Implementation issue: [#504](https://github.com/gtrabanco/agentic-workflow/issues/504). Unit doc: [features/494-telemetry-by-turn](features/494-telemetry-by-turn/SPEC.md)
---

# features/494-telemetry-by-turn

> The session sample collapses every provider token field into one number, so a
> cost regression cannot be attributed to a work type, a model or a package
> version. This unit widens the sample, adds a per-session JSONL sink and a
> `tier-cost@2` ledger grammar, ships the report CLI, and pins the phase
> vocabulary to the repository's real command surface with a coverage test.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`docs/features/494-telemetry-by-turn` is the promoted feature; issue
[#504](https://github.com/gtrabanco/agentic-workflow/issues/504) is its
implementation issue and the request this unit applies. The PR closes it via
`Closes #504` in the body.

The unit doc was cut in Spanish when the feature was promoted (2026-11-14) and
described a scope the request has since widened (the `phase`/`version` fields,
the JSONL sink, the ledger grammar version, the report CLI and the coverage
test are all newer than the first draft). It is rewritten here, in English per
the repository's language rule, against the request as it stands.

## Specs

**S1 — the sample carries phase, version and the field-level breakdown.**
> ```ts
> export interface TelemetrySample {
>   // Existing
>   readonly unit: string;
>   readonly changed_paths: number;
>   readonly tokens: number;
>   readonly turns: number;
>   readonly model_ms: number;
>   readonly tool_ms: number;
>   readonly observed: string;
>   readonly source: string;
>
>   // #504 new
>   readonly phase: string | null;       // command name: "execute-phase", "review-change", "unit-lane", "triage", "plan-feature", "plan-fix", "review-spec", "review-plan", "external-verify", "fold-findings", "audit-pr", "discover-repository-state", "resolve-repository-state", "product-audit", "batch-scheduler", "workflow-status", "unit-route", "close-out"
>   readonly version: string | null;     // package version: "4.10.0"
>   readonly input_tokens: number;       // from usage.input
>   readonly output_tokens: number;      // from usage.output
>   readonly cache_read_tokens: number;  // from usage.cacheRead
>   readonly cache_write_tokens: number; // from usage.cacheWrite
>   readonly reasoning_tokens: number;   // from usage.reasoning
> }
> ```
>
> "- `phase`: resolved from the command name. Injected via env var `AG_WF_PHASE`
> when spawning runner subprocesses.
> - `version`: read from `package.json` of the `@gtrabanco/pi-agentic-workflow`
> package when building the sample."

**S2 — `PHASE_LABELS` is the source of truth, and it is re-verified before use.**
> "Every new command must be added here. The coverage test (S7) validates this.
>
> > **⚠️ Re-verify the list before implementing.** This list reflects the
> > commands at the time #504 was written (2026-11-14). By the time it is
> > applied, some may have been retired, renamed, or absorbed by other commands
> > (e.g., `fold-findings` likely will not exist anymore). At start, the
> > implementer must verify which commands actually exist in the repo and update
> > the list. The coverage test will detect mismatches automatically."

**S3 — per-session JSONL sink, path configurable in `agentic-workflow.json`.**
> "New sink that writes each TelemetrySample as a JSON line.
>
> Configurable via `agentic-workflow.json`:
>
> ```json
> {
>   "telemetry": {
>     "jsonFile": ".pi/.telemetry/sessions.jsonl"
>   }
> }
> ```"

**S4 — `tier-cost@2` ledger, programmatic, with `@1` still read.**
> "New ledger columns: `phase`, `version`, `input_tokens`, `output_tokens`,
> `cache_read_tokens`, `cache_write_tokens`, `reasoning_tokens`.
>
> `tier-cost@1` coexists as backward compat.
>
> The ledger is data table only. No explanatory prose. No footer. No notes.
> Only the table with header and rows."

**S5 — the report CLI: JSON by default, filters, aggregation, `--human`.**
> "```bash
> # Default: JSON to stdout
> pi telemetry report
>
> # Filters
> pi telemetry report --model qwen3.6
> pi telemetry report --unit 352-new-feature-distributable
> pi telemetry report --from 2026-11-01 --to 2026-11-14
>
> # Aggregation
> pi telemetry report --by phase
> pi telemetry report --by unit
>
> # Human readable (markdown table)
> pi telemetry report --human
> ```
>
> Default JSON. `--human` is an optional flag for readable format. Bun-first."

**S6 — a programmatic JSON Schema for the sample.**
> "JSON Schema for TelemetrySample. Programmatic validation. No prose."

**S7 — the coverage test.**
> "Test that crosses `PHASE_LABELS` against runner commands. If a command is
> missing, the test fails.
>
> ```bash
> bun test scripts/telemetry-coverage.test.mjs
> ```"

**S8 — the design invariant: a command and its telemetry move together.**
> "**New command → register telemetry.**
> **Delete command → remove telemetry.**
> **Rename command → update telemetry.**
>
> Captured by the coverage test (S7), documented in the #504 spec and in the
> package README."

**S9 — programmatic, no prose (invariant I1).**
> "The tier-cost@2 ledger is data table only. The per-session JSONL is pure
> JSON. The `pi telemetry report` CLI defaults to JSON. Any explanation goes in
> separate docs, not in the telemetry output."

**S10 — telemetry lives in the pi package, and instruments nothing else (I2).**
> "Telemetry lives only inside the `packages/pi-agentic-workflow/` package. We do
> not instrument repo scripts or agentic-workflow standalone commands
> (`scripts/*.mjs`). We do not instrument every tool call (bash, read, edit) —
> that is already in Pi JSONL (`.pi-web/archived-sessions/*.jsonl`) for ad-hoc
> exploration."

**S11 — no consent prompt, never networked (I3).**
> "There are no consent prompts, no configuration flags. Telemetry is always
> saved locally. The user may or may not use it. It is never sent to any
> server."

**S12 — two levels, and this unit only widens level 1 (I4).**
> "Level 1: agentic-workflow phases (execute-phase, review-change, triage, plan,
> fold-findings, close-out). Level 2: Pi JSONL (raw tool calls, ad-hoc
> exploration). Level 1 is what is captured in TelemetrySample."

**S13 — bun-first (I5).**
> "All telemetry scripts run with bun, not node. `bun scripts/telemetry-report.mjs`."

**S14 — what this unit does not build.**
> "Automatic remote telemetry (webhook sink: future extension); End-user opt-out;
> Web dashboard or backend infrastructure; Instrument repo scripts
> (`scripts/*.mjs`); Instrument every tool call (bash, read, edit, write)"

**S15 — the change is breaking, and the two suites move with it.**
> "- **Breaking**: `TelemetrySample` changes — new required fields
> - **Non-breaking**: `tier-cost@1` coexists with `tier-cost@2`
> - **Tests**: update `session-telemetry.test.mjs`, `telemetry-ledger-sink.test.mjs`,
> new `scripts/telemetry-coverage.test.mjs`"

## Impact

- `packages/agentic-workflow-schema/src/telemetry.ts` (new) — the published
  vocabulary: `PHASE_LABELS`, `TELEMETRY_SAMPLE_FIELDS`,
  `TELEMETRY_TOKEN_FIELDS`, `TELEMETRY_SAMPLE_SCHEMA` and
  `telemetrySampleJsonSchema()`. Re-exported from `src/index.ts`, so the report
  CLI, the coverage test and the doc projection read one declaration.
- `packages/pi-agentic-workflow/src/session-telemetry.ts` — `TelemetrySample`
  gains `phase`, `version`, `model` and the five token fields; `tokensOf()`
  stops being the only reader of `MessageUsage`. `PHASE_LABELS` and
  `phaseFromCommand()` join it beside `unitFromCommand()`.
- `packages/pi-agentic-workflow/src/telemetry-sinks.ts` — a second sink
  (`createJsonlSink`) and a ledger sink that follows whichever grammar the
  ledger declares (`tier-cost@1` or `@2`).
- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` — the sample
  learns its phase, its package version and its model; `AG_WF_PHASE` is set on
  the process environment so a spawned runner inherits it.
- `packages/pi-agentic-workflow/src/config/{types,defaults}.ts` and the schema
  package's `telemetry` config section — the `jsonFile` key.
- `docs/workflow/TIER_COST.md` — the ledger moves to the `tier-cost@2`
  grammar. **The samples table is empty at the cut** (E1), so the migration is
  the grammar block and the header; no row is rewritten.
- `scripts/tier-cost.mjs` — the reader accepts both grammars; `read` reports
  the grammar each row was written under.
- `scripts/telemetry-report.mjs` (new) — the report CLI of S5.
- `scripts/telemetry-coverage.test.mjs` (new) — the coverage test of S7.
- `docs/telemetry/schema.json` (new) — the S6 projection, equal to
  `telemetrySampleJsonSchema()` by construction and pinned by the coverage
  suite.
- `packages/pi-agentic-workflow/README.md` — the invariant of S8 and the two
  sinks, documented where the package's own consumers read it.
- Consumers of the changed shapes: `test/session-telemetry.test.mjs`,
  `test/telemetry-sinks`-bearing `test/telemetry-ledger-sink.test.mjs`,
  `test/telemetry-wiring.test.mjs`, `test/telemetry-extension.test.mjs` (the
  shipped-entry proof), `scripts/tier-cost.test.mjs`, and any project ledger
  pinned to `@1` (still read).

## Retirements

Strictly additive at the surface an operator reaches: no command, flag, flag
value, contract id or skill is removed. Two internal supersessions, each with
its consumer moved in the same commit:

- `TelemetrySample`'s eight-field shape — replaced by the twelve-field shape of
  S1. Its consumers are the four package suites and the ledger sink, all
  updated here; `rg -c 'changed_paths' packages/pi-agentic-workflow/src` stays
  non-zero, so the field is not retired, only joined.
- `scripts/tier-cost.mjs`'s `COLUMNS`-only grammar — replaced by a
  grammar-keyed reader (`tier-cost@1` + `tier-cost@2`). Its consumer is
  `scripts/tier-cost.test.mjs` plus the package's round-trip suite, both
  updated here.

Nothing else is retired: `tier-cost@1` survives as a readable and writable
grammar (S4, S15), and no prose that names the old sample shape is left behind
(`rg -n 'tokens: number' docs packages skills` → the sample's own declaration
only).

## Non-goals

- A webhook or any remote sink, a dashboard, or an end-user opt-out — S14's
  list, verbatim.
- Instrumenting `scripts/*.mjs`, the crate's commands, or single tool calls —
  S10 and S14. The report CLI **reads** project files; it emits nothing and
  instruments nothing.
- Removing the `telemetry.enabled` switch. S11 says "no configuration flags",
  but that switch is the shipped behaviour of #383 and S3 itself declares a
  config key; removing an opt-in that a project already relies on is a
  behaviour change no requirement asks for (D2). The unit adds no *new*
  consent gate.
- Splitting a session's sample per phase. The sample is the session's cost, and
  the first unit-scoped command names it (the rule #383's `unit` already
  follows); per-phase attribution of a multi-phase session would need a second
  accumulator and is not asked for (D3, and the `phase` column declaration in
  the ledger says so).
- Any change to the crate (`packages/agentic-workflow`): S10 keeps telemetry in
  the pi package.

## Risk tier

Computed by the crate's own classifier over this unit's declared paths at the
cut, copied verbatim, never written from memory.

- **Cut verdict** — `standard` (`reason_kind: executable-content` — the schema
  package's new vocabulary module) · **Task Size** — `understood: true`,
  `contained_risk: contained`, `resumable_from_diff: true`,
  `ceremony: unit-doc`, `verification: gates` · **signals** — `[]`
- **Named high-risk item** — none — not a high-tier unit

## Acceptance criteria

- **AC1 (S1)** — the sample carries `phase`, `version`, `model` and the five
  token fields, accumulated from the provider's own usage:
  `bun test packages/pi-agentic-workflow/test/session-telemetry.test.mjs`
  exits 0 with the breakdown case and the phase/version cases green.
- **AC2 (S2)** — `PHASE_LABELS` is published and equals the repository's real
  command surface (14 user-invocable skills + the 4 native command names):
  `rg -c 'export const PHASE_LABELS' packages/agentic-workflow-schema/src/telemetry.ts`
  matches 1 and `bun test scripts/telemetry-coverage.test.mjs` exits 0.
- **AC3 (S3)** — a session writes one JSON object per line to the configured
  path: `bun test packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs`
  exits 0, and the `telemetry.jsonFile` key is accepted by the section's
  validator (`bun test packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs`
  exits 0).
- **AC4 (S4)** — the `tier-cost@2` grammar is written and both grammars are
  read: `bun test scripts/tier-cost.test.mjs` and
  `bun test packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs`
  exit 0, and `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md`
  names `tier-cost@2` as the contract.
- **AC5 (S5)** — the report CLI answers JSON by default and honours every
  documented flag: `bun test scripts/telemetry-report.test.mjs` exits 0;
  `bun scripts/telemetry-report.mjs --ledger docs/workflow/TIER_COST.md` exits
  0 printing JSON, and `--human` prints a markdown table.
- **AC6 (S6)** — the committed schema equals the programmatic one:
  `bun test scripts/telemetry-coverage.test.mjs` exits 0 with its
  `docs/telemetry/schema.json` case, which deep-compares the file against
  `telemetrySampleJsonSchema()`.
- **AC7 (S7)** — the coverage test fails when a command has no label: the
  suite's own negative case removes a label from a copy of the published list
  and asserts the crossing reports it (asserted in
  `scripts/telemetry-coverage.test.mjs`, exit 0).
- **AC8 (S8)** — the invariant is documented where the package's consumers read
  it: `rg -c 'New command → register telemetry' packages/pi-agentic-workflow/README.md`
  matches 1.
- **AC9 (S9)** — no telemetry output carries prose: the ledger's `@2` region is
  the block plus the table (asserted by the tier-cost suite's shape case), the
  JSONL is one JSON object per line (asserted by the JSONL suite) and the
  report's default is JSON (asserted by the report suite).
- **AC10 (S10)** — nothing outside the pi package is instrumented:
  `rg -n 'createSessionTelemetry|createJsonlSink|createLedgerSink' scripts/`
  matches only the reader/report suites' imports of the ledger parser, never a
  producer.
- **AC11 (S11)** — no new consent gate and no network: `rg -n 'fetch\(|https?://' packages/pi-agentic-workflow/src/session-telemetry.ts packages/pi-agentic-workflow/src/telemetry-sinks.ts`
  matches 0 and the config section gains no key besides `jsonFile`.
- **AC12 (S12)** — level 2 stays untouched: `rg -n 'archived-sessions' packages/ scripts/`
  matches only the existing documentation of what Pi already stores.
- **AC13 (S13)** — bun-first: `bun scripts/telemetry-report.mjs --help` exits 0
  and every command this unit documents is spelled `bun …`.
- **AC14 (S14)** — the out-of-scope list is honoured:
  `git diff --stat origin/main...HEAD` names no webhook, dashboard, opt-out flag
  or `scripts/*.mjs` producer.
- **AC15 (S15)** — the breaking shape ships with its intent and its suites:
  `.changeset/504-extended-telemetry.md` declares
  `@gtrabanco/pi-agentic-workflow` at the level a required-field change needs,
  and `bun scripts/lint-changeset.mjs .changeset/504-extended-telemetry.md`
  exits 0; the four named suites are green.

## Future

- A remote/webhook sink — S14 defers it explicitly; a future extension, never
  this unit.
- Per-phase attribution inside one session (one row per phase) — see D3. It is
  the natural next widening of `phase`, and it needs its own accumulator.

## Future cost

| Standing obligation | Who it binds |
|---|---|
| A new command registers its telemetry label in the same change; deleting a command deletes its label (S8) | every future command added to `skills/` or registered natively |
| `docs/telemetry/schema.json` is regenerated from `telemetrySampleJsonSchema()`, never edited by hand | every change to `TELEMETRY_SAMPLE_FIELDS` |
| A ledger column is a versioned grammar change: `tier-cost@3`, never an extra cell in `@1`/`@2` | every future ledger column |
| The ledger's samples table stays the file's last section, because the writer appends | every future edit of `docs/workflow/TIER_COST.md` |

## Applicable tests

The unit's own tests, all run in the foreground:

- `packages/agentic-workflow-schema/test/telemetry.test.mjs` (new) — the
  vocabulary and the JSON Schema builder.
- `packages/pi-agentic-workflow/test/session-telemetry.test.mjs` — the widened
  sample, the phase resolution, the breakdown accumulation.
- `packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs` (new) — the
  per-session JSONL sink.
- `packages/pi-agentic-workflow/test/telemetry-ledger-sink.test.mjs` — the
  grammar-negotiating ledger sink, round-tripped through the crate reader.
- `packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` and
  `test/telemetry-extension.test.mjs` — the wiring and the shipped entry.
- `scripts/tier-cost.test.mjs` — the `@1`/`@2` reader.
- `scripts/telemetry-report.test.mjs` (new) — the CLI.
- `scripts/telemetry-coverage.test.mjs` (new) — S7's crossing plus the S6
  projection pin.

## Known pre-existing issues

- **A spawned runner subprocess cannot report its own phase state back.** S1
  asks for `AG_WF_PHASE` to be *injected* into subprocesses; this unit sets it
  on the environment the child inherits, which is all a parent can do without a
  contract change in the crate. **does-not-affect** this unit's deliverable
  (the sample is written by the extension, which knows the phase); it **affects**
  any future design that wants a subprocess to amend the sample.
- **`pi-extensible-workflows` pin drift (6.3.0 → 6.4.0)** — the registry-reachable
  half of the gate (`dependency-pin-gate`) is red at the cut and at this unit's
  head for a pin this change never touched: `git diff origin/main...HEAD --
  packages/*/package.json bun.lock` is empty and both refs pin `6.3.0`.
  **does-not-affect** this unit — a dependency bump is a deliberate `fix(deps)`
  unit of its own (`docs/workflow/PACKAGES.md`), never a side effect of unrelated
  work. Recorded for the owner with its evidence (E18).
- **`docs/workflow/TIER_COST.md` is repo-local** (`find template -name
  'TIER_COST*'` → nothing), so a target project that installs the package has
  no ledger until it creates one. **does-not-affect** this unit — the sink
  refuses a missing ledger instead of inventing one (#383's rule, unchanged).

## Tasks

- P1 — Cut this unit doc and the two planning ledgers; re-derive every label
  and column against the tree (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/494-telemetry-by-turn/SPEC.md` prints `verdict PASS`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)
- P2 — Publish the vocabulary in the schema package (RED suite first), then
  re-export it and pin the S6 projection (validator: `bun test packages/agentic-workflow-schema/test/telemetry.test.mjs` exits 0)
  (Implements: S1, S2, S6)
  - Relevant files: packages/agentic-workflow-schema/src/telemetry.ts, packages/agentic-workflow-schema/src/index.ts
- P3 — Widen the sample and its accumulator, resolve the phase from the
  dispatched command, read the package version, and inject `AG_WF_PHASE`
  (validator: `bun test packages/pi-agentic-workflow/test/session-telemetry.test.mjs` exits 0)
  (Implements: S1, S2)
  - Relevant files: packages/pi-agentic-workflow/src/session-telemetry.ts, packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts
- P4 — The per-session JSONL sink and its `telemetry.jsonFile` key
  (validator: `bun test packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs` exits 0)
  (Implements: S3, S11)
  - Relevant files: packages/pi-agentic-workflow/src/telemetry-sinks.ts, packages/agentic-workflow-schema/src/config.ts
- P5 — The `tier-cost@2` grammar: the sink negotiates the ledger's declared
  version, `scripts/tier-cost.mjs` reads both, and the repo ledger migrates
  (validator: `bun test scripts/tier-cost.test.mjs` exits 0 and `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` names `tier-cost@2`)
  (Implements: S4, S9, S15)
  - Relevant files: packages/pi-agentic-workflow/src/telemetry-sinks.ts, scripts/tier-cost.mjs, docs/workflow/TIER_COST.md
- P6 — The report CLI (filters, aggregation, `--human`, JSON default)
  (validator: `bun test scripts/telemetry-report.test.mjs` exits 0)
  (Implements: S5, S9, S10, S13)
  - Relevant files: scripts/telemetry-report.mjs
- P7 — The coverage test and the S8 invariant in the package README
  (validator: `bun test scripts/telemetry-coverage.test.mjs` exits 0 and `rg -c 'New command → register telemetry' packages/pi-agentic-workflow/README.md` matches 1)
  (Implements: S2, S6, S7, S8)
  - Relevant files: scripts/telemetry-coverage.test.mjs, docs/telemetry/schema.json, packages/pi-agentic-workflow/README.md
- P8 — Release intent, projections, session fragment and the full verification
  (validator: `bun scripts/local-gate.mjs --jobs auto` exits 0)
  (Implements: S1, S3, S4, S5, S6, S7, S10, S12, S14, S15)

### Planning evidence

The M/L ledger lives beside this document, in
[`planning-evidence.md`](planning-evidence.md) — the closed column order owned by
`skills/pre-execution-review/references/LEDGERS.md`.

### Obligations

The M/L ledger lives beside this document, in
[`planning-obligations.md`](planning-obligations.md) — the 9-column shape owned
by `skills/pre-execution-review/references/LEDGERS.md`. Every row is `verified`
before the unit ships, or carries an evidenced `n/a`.

## Triaged steps

Verbatim from `bun packages/agentic-workflow/bin/agentic-workflow.mjs unit-route
--triage 494-telemetry-by-turn`, once the doc was cut (D4: the step list is the
machine's, the owner's apply workflow decides which steps run inline).

```
TRIAGE — 494-telemetry-by-turn (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs, release
Tiers: research: cheap, design: strong, plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap, release: strong
Skipped: none
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/494-telemetry-by-turn
relay-next: create .pi-web/relays/494-telemetry-by-turn/ (charter → docs/features/494-telemetry-by-turn/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/494-telemetry-by-turn", leg: "1") · legs: 9 = 8 phases + 1 coherence review
```

The lane runs inline (owner's apply workflow, §4): no Relay packet is cut for
this unit and the `relay-next` addendum is not acted on; the review step is the
owner's external verification. The deterministic readers still run over the doc
— `phase-lint` (P1's validator), `docs-generate --check` and the root suite
(P8's) — so it satisfies the same grammars a lane-cut doc does.

## Findings

No OPEN row: this unit carries no `review-change` or `triage-issue` run (the
owner's apply workflow runs the surgery inline), so nothing here was persisted
by either writer of the `review-findings` truth class. Anything the verification
surfaces is recorded under `## Known pre-existing issues`, in the `## Log`, and
in the handoff to the owner.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-17, the request, verbatim:
  ```
  Apply to this repository: issue #504
  ```
  The issue body is quoted requirement by requirement under `## Specs`
  (S1–S15); the workflow that applies it is the owner's local apply protocol,
  whose step 0 resolved this state to **proceed** (branch
  `feat/504-extended-telemetry` at `888aaceb`, clean worktree, the unit folder
  present as a promoted feature with no ledgers and no code).
- **D1** — 2026-11-17, decision (the sample's `model` field): S1's interface
  block does not list `model`, but S5's `--model qwen3.6` filter, the request's
  own use-case table ("Most expensive model by work type | `phase` + `model` +
  `tokens`") and this unit's promoted feature ("pass `model` into
  `TelemetrySample`") all require it. The field ships; a filter that cannot
  read its key would be a documented flag that answers nothing (PE-004).
- **D2** — 2026-11-17, decision (S11 vs S3): S11 says "no configuration flags"
  while S3 declares `telemetry.jsonFile` and the shipped `telemetry.enabled`
  switch is #383's behaviour. Read as "no new consent gate, never networked":
  the unit adds exactly the one key S3 names and removes nothing (Known
  pre-existing issues, PE-005).
- **D3** — 2026-11-17, decision (`phase` on a multi-phase session): one sample
  per session, and the first unit-scoped command names both `unit` and `phase`
  — the rule #383's `unit` already follows ("re-pointing it mid-session would
  attribute the tokens to the last thing typed"). Per-phase rows would need a
  second accumulator; the `phase` column declaration in the ledger states the
  limitation instead of hiding it (Future).
- **D4** — 2026-11-17, decision (the report CLI's surface): S5 spells the
  command `pi telemetry report`, and I5 spells it
  `bun scripts/telemetry-report.mjs`. Pi's extension API registers slash
  commands, tools, flags and events — it has no CLI-subcommand seam
  (`@earendil-works/pi-coding-agent`'s own `extensions.md`, read at the
  pinned host 1.5.2), so a package cannot create a `pi <subcommand>` verb. The script
  I5 names is the invoked form, and the report engine lives in the schema
  package's vocabulary so one declaration feeds it (PE-003).
- **D5** — 2026-11-17, decision (the ledger's grammar coexistence): one
  grammar per ledger file, chosen by the `tier-cost@N` block the file declares;
  the reader accepts `@1` and `@2`, and the writer follows the file. A project
  still on `@1` keeps reading and writing `@1` (S4's "coexists"); this
  repository's ledger migrates to `@2` in the same change, and its samples
  table is empty at the cut, so no row is rewritten (E1).
- **D6** — 2026-11-17, decision (the JSONL path): S3 shows
  `.pi/.telemetry/sessions.jsonl` as the configured value and S11 asks for no
  extra switch, so that path ships as the default and `telemetry.jsonFile`
  overrides it. One switch (`enabled`), one path.
- **E1** — 2026-11-17, `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` at `888aaceb` · exit 0 · `contract: tier-cost@1`, `rows: []` — the samples table is empty, so the grammar migration rewrites no row (D5).
- **E2** — 2026-11-17, `bun test --timeout=20000 test/` in `packages/pi-agentic-workflow` at `888aaceb` · 928 pass / 0 fail — the baseline the widening must not break (PE-010).
- **E3** — 2026-11-17, `pi --version` · 1.5.2 — the host whose `turn_end` payload and extension surface PE-002/PE-003 were read against.
- **E4** — 2026-11-17, the command surface re-derived for S2: `for f in skills/*/SKILL.md` (frontmatter `user-invocable:` → 14 skills) plus the four native `*_COMMAND` exports in `routing/types.ts` — `fold-findings` still ships, while `plan-feature`, `plan-fix`, `review-spec`, `review-plan`, `external-verify`, `unit-route`, `close-out` and `triage` (the command is `triage-issue`) do not exist. The vocabulary ships the 18 real names (PE-001).
- **E5** — 2026-11-17, the red-first runs, each observed before its module existed: `bun test test/telemetry.test.mjs` in the schema package → `SyntaxError: Export named 'PHASE_LABELS' not found`; `bun test test/session-telemetry.test.mjs` → `Export named 'phaseFromCommand' not found`; `bun test test/telemetry-jsonl-sink.test.mjs` → `Export named 'createJsonlSink' not found`; `node --test scripts/tier-cost.test.mjs` → 6 failing cases on the single grammar; `node --test scripts/telemetry-report.test.mjs` → `exit 1` for every case (the script did not exist).
- **E6** — 2026-11-17, `bun test test/telemetry.test.mjs` (schema package) · 8 pass / 0 fail; `bun test test/session-telemetry.test.mjs` · 18 pass / 0 fail; `bun test test/telemetry-wiring.test.mjs` · 14 pass / 0 fail (O1–O5).
- **E7** — 2026-11-17, `bun test test/telemetry-jsonl-sink.test.mjs` · 6 pass / 0 fail, including the shipped-wiring case that writes the ledger row and the JSONL line from one sample (O8, O19).
- **E8** — 2026-11-17, `bun test test/telemetry-ledger-sink.test.mjs` · 15 pass / 0 fail (both grammars, the unknown-column refusal, the untouched #383 cases) and `bun test scripts/tier-cost.test.mjs` · 13 pass / 0 fail (O10–O12).
- **E9** — 2026-11-17, `bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md` after the migration · exit 0 · `contract: tier-cost@2`, 16 columns, `rows: []` (O10).
- **E10** — 2026-11-17, `bun test scripts/telemetry-report.test.mjs` · 10 pass / 0 fail; `bun scripts/telemetry-report.mjs --ledger docs/workflow/TIER_COST.md` · exit 0 · `contract: telemetry-report@1`, `samples: 0`; `bun scripts/telemetry-report.mjs --help` · exit 0 and names every flag (O13, O14).
- **E11** — 2026-11-17, `bun scripts/telemetry-report.mjs --schema > docs/telemetry/schema.json`, printed identically under `bun` and `node` (`diff` → no output) and deep-equal to `telemetrySampleJsonSchema()` in the coverage suite (O15).
- **E12** — 2026-11-17, `bun test scripts/telemetry-coverage.test.mjs` · 5 pass / 0 fail — the crossing (18 labels × 18 commands), its two mutations, the committed schema, the ledger grammar and the README invariant (O6, O7, O21).
- **E13** — 2026-11-17, the O3/O16/O17/AC12 greps: `rg -c '4\.10\.0' packages/pi-agentic-workflow/src` → 0 matches; `rg -n 'createSessionTelemetry|createJsonlSink|createLedgerSink' scripts/ packages/agentic-workflow/src` → 0 matches; `rg -n 'fetch\(|https?://|net\.|http\.'` over the three producer modules → 0 matches; `rg -n 'archived-sessions' packages/ scripts/` → 0 matches; `git diff --stat origin/main...HEAD -- packages/agentic-workflow` → empty (O16, O17, AC12).
- **E14** — 2026-11-17, the package suites at the branch head: `bun test` in `packages/pi-agentic-workflow` → **947 pass / 0 fail** (was 928 at `888aaceb`); in `packages/agentic-workflow-schema` → **893 pass / 0 fail**; in `packages/agentic-workflow` → **935 pass / 0 fail** (O19, regression scope).
- **E15** — 2026-11-17, `bun scripts/lint-changeset.mjs .changeset/504-extended-telemetry.md` · exit 0 · `ok 504-extended-telemetry.md` (O20).
- **E16** — 2026-11-17, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/features/494-telemetry-by-turn/SPEC.md` · `verdict PASS` (8/8 phases, fingerprint `bcac4289`), and the same crate's `verify` on the doc after the obligations closed (O20 is why the doc could be cut at all).
- **P1** — 2026-11-17, the unit doc, both planning ledgers and the decisions ledger cut with my `S1`–`S15` quoted verbatim and every obligation row `planned` · `a0e850ef`.
- **P2** — 2026-11-17, the schema package's published vocabulary (RED suite first, E5) · `600585ea`.
- **P3** — 2026-11-17, the sample widened: phase, version, model and the five token fields, with `AG_WF_PHASE` reaching a spawned runner · `6ac1ac8b`.
- **P4** — 2026-11-17, the JSONL sink and the `telemetry.jsonFile` key · `51ae4db7`.
- **P5** — 2026-11-17, `tier-cost@2` in the reader, the sink and this repository's ledger · `c665ea84`.
- **P6** — 2026-11-17, the report CLI's corpus red first (`2aefe10f`), then the CLI, the coverage gate, the schema projection and the package README · `1fcb5359`.
- **D7** — 2026-11-17, decision (the red-first split): the first cut of the report CLI landed its suite and its module in one commit, which the repository's own `scripts/red-first.test.mjs` refused (`the pair lands in one commit (db367f9): no red commit exists`). The commit was split before any push — the suite alone (`2aefe10f`), then the implementation (`1fcb5359`) — because that gate exists to prove the corpus was seen failing, exactly as E5 records it.
- **D8** — 2026-11-17, decision (the diff size): the change is 2,685 authored lines across 35 files in six commits, above the ~400-line slice guidance. The slices are coherent (one vocabulary, one accumulator, one sink, one grammar, one CLI, one gate) and cannot be shrunk further without deleting tests or comments — the request's own S15 names four suites that must move with it, and two more were derived (`config-contract`, `default-inherit`).
- **E17** — 2026-11-17, the gate budget the branch needed: `node --test scripts/red-first.test.mjs` at `HEAD 1fcb5359` · the shipped-history walk took **29.2s** standalone (34.4s suite) and crossed the declared 30s budget inside a `--jobs auto` gate run, so `scripts/test-timeout-allowlist.json` carries 60s for it with the new measurement. The walk's cost is the repository's own history (54 pairs · 29 after the cutoff); no assertion moved.
- **E18** — 2026-11-17, `bun scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow` at the head · exit 1 · `GATE REJECTION — dependency-pin-drift: pins pi-extensible-workflows at 6.3.0 but the registry published 6.4.0`; the same pin is on `origin/main` (`git show origin/main:packages/pi-agentic-workflow/package.json`) and `git diff origin/main...HEAD -- packages/*/package.json bun.lock` is empty — the drift is pre-existing and outside this unit (Known pre-existing issues).
- **G2** — 2026-11-17, `bun scripts/local-gate.mjs --jobs 2` at `HEAD 450e6cce` · root-suite **exit 0 — 116 suites PASS in 266s**; the gate stops at `dependency-pin-gate` for the pre-existing `pi-extensible-workflows` drift of E18, which this unit must not bump.
- **G1** — 2026-11-17, `node scripts/run-root-suite.mjs` over the whole branch at `HEAD 1fcb5359` · 112 suites PASS (the four reds re-run alone and green, D7 and the load artifacts named there); the four reds were machine-load artifacts, each re-run alone and green: `red-first` (a real finding, D7, fixed), `unit-route` (a 580 ms timing assertion against a 500 ms bound), `phase-lint` and `workflow-status-sensor` (suite wall-clock caps under a saturated box — 62 s and 91 s alone, against the 120 s cap).

## Next

The unit is built and hands back for the owner's external verdict over
`888aaceb..HEAD`: seven commits, every obligation verified (E6–E16), the three
package suites green (E14). Open, deliberately out of this unit: per-phase
attribution inside one session (`## Future`) and the fact that a target project
carries no ledger until it creates one (`## Known pre-existing issues`).

## References

Issue [#504](https://github.com/gtrabanco/agentic-workflow/issues/504) · the
promoted feature row 494 in [`docs/ROADMAP.md`](../../ROADMAP.md) · #383
(`docs/fix/383-measured-acceptance/`), whose accumulator, sinks and ledger this
unit widens · [`docs/workflow/TIER_COST.md`](../../workflow/TIER_COST.md) — the
ledger and its row contract · #560, which ran the measured acceptance over the
historical corpus and is the consumer that motivated the breakdown.

## Branch

`feat/504-extended-telemetry` — the worktree the owner created at
`.worktrees/feat-504-extended-telemetry`.

## Depends on

none — independent. Soft order only: #560 read the `@1` ledger, and this unit
keeps that grammar readable so its evidence never stops being reproducible.

## Regression scope

| Scenario | Verified by |
|---|---|
| A project still on the `tier-cost@1` ledger keeps appending and reading rows | `scripts/tier-cost.test.mjs`'s `@1` cases and the sink's grammar-negotiation case |
| A session that ran no unit-scoped command still emits nothing | `telemetry-wiring.test.mjs`'s no-unit case (unchanged assertion) |
| `off` still registers no listener and measures nothing | `telemetry-wiring.test.mjs` and `telemetry-extension.test.mjs` (unchanged assertions) |
| The ledger's append-only, atomic single-write shape survives the `@2` column set | `telemetry-ledger-sink.test.mjs`'s concurrency and prefix cases |
| The crate reader still resolves tier and ceremony from the unit's carrier | `scripts/tier-cost.test.mjs` (unchanged assertions) |
| The four package suites and the root suites stay green | `bun scripts/local-gate.mjs --jobs auto` |
