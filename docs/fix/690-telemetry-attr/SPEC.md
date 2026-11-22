---
type: fix
scope: small
roadmap_summary: Issue [#690](https://github.com/gtrabanco/agentic-workflow/issues/690) (S): automatic session samples never landed because unit attribution had exactly one door — the slash-command registrar — while the work itself flows through the deferred `agentic_workflow_run` tool. The runner door now notes its subcommand before spawning, so a unit-scoped runner command attributes the session exactly as the same command dispatched as a slash command does, and the secondary defect is repaired too: a sink that refuses its sample is reported once through the operator's own `notify` channel instead of being swallowed by a bare `catch {}`. PR [#692](https://github.com/gtrabanco/agentic-workflow/pull/692).
---

# fix/690-telemetry-attr

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
external-verify.md | trimmable
review-findings.md | trimmable
planning-findings.md | trimmable
planning-evidence.md | kept
planning-obligations.md | kept
decisions.md | kept
SPEC.md | kept
```

## Issue

`#690` — tracked issue in the project's forge. The PR closes it via
`Closes #690`.

## Specs

**S1 — the automatic sample reaches both destinations.**
> Automatic telemetry (`pi:session=…` rows) never reaches `docs/workflow/TIER_COST.md` or `.pi/.telemetry/sessions.jsonl`, despite:
>
> - `config.telemetry.enabled: true` (project: `.pi/agentic-workflow.json`)
> - The extension installed and active (`@gtrabanco/pi-agentic-workflow@canary`)
> - The installed `dist/` canary containing the full telemetry code path
>
> Observed: both destinations carry only reconstructed rows (`pi:reconstruct=…`, manual `telemetry reconstruct write`). Zero automatic rows ever landed.

**S2 — the runner door becomes the attribution site.**
> Wire `agentic_workflow_run.execute()` (and any other workflow tool that runs a unit-scoped subcommand) to call `noteCommand(subcommand, args)` before spawning — that is the only site through which the subcommands `UNIT_COMMANDS` recognizes actually flow today. The slash-command route alone can never attribute a unit.

**S3 — a broken sink is reported, never silent.**
> `writeCurrent()` (`src/session-telemetry.ts`, ~line 258) swallows sink errors with `catch {}` — even with the chain repaired, a broken sink stays silent forever. Worth an explicit degraded-report (stderr/notify), consistent with the feedback-channel contract.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

The defect is an *unwired seam*, so this fix touches both ends of it and
nothing else:

- `packages/pi-agentic-workflow/src/extension/workflow-tools.ts` — the Pi-free
  tool specs. `runnerRunSpec`'s `execute` is the only site through which a
  unit-scoped subcommand reaches a spawn in a session whose work runs through the
  deferred tools (`PE-001`, `PE-003`). It gains one optional dependency seam and
  calls it before `launchRequest`.
- `packages/pi-agentic-workflow/src/extension/index.ts` — the adapter. The
  session already builds `noteCommand` (the closure over the live telemetry
  wiring) before `createExtension` runs; the tool deps only have to carry it
  (`PE-004`). The secondary repair adds the operator's `notify` as the degraded
  report channel at the same resolution site, and the third defect this unit
  found lives three lines below it: the configured JSONL path was resolved as
  `resolve(relative, root)`, which answers with the root directory itself, so the
  sink was pointed at a directory and every write failed with `EISDIR`
  (`PE-011`, `O10`).
- `packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts` — the
  accumulator's attachment. It grows one option (`onDegraded`), a per-sink latch
  so a broken destination is reported once per session instead of once per
  settled run, and passes the accumulator's sink-failure seam through.
- `packages/pi-agentic-workflow/src/session-telemetry.ts` — the accumulator.
  `writeCurrent` keeps the "one broken sink costs the others nothing" behaviour
  and stops dropping the failure: it reports `{ sink, error }` through an
  injected seam (`PE-005`).
- Tests: `test/telemetry-attribution.test.mjs` (new — this unit's reproducer
  corpus), plus added cases in `test/telemetry-wiring.test.mjs`,
  `test/session-telemetry.test.mjs` and `test/shipped-adapter.test.mjs`.
- Prose that stops being true if it is not moved: the package README's
  `## Session telemetry — the measured sample` section claims *every session that
  runs a unit-scoped command emits a sample* while naming no attribution site
  beyond the command vocabulary; it must name the two doors and the degraded
  report.
- Consumers that must keep working: the six deferred tools' names, schemas,
  arity and `deferred` exposure (`test/workflow-tools.test.mjs`,
  `test/workflow-tools-wiring.test.mjs`, `test/shipped-adapter.test.mjs`); the
  wiring's unit/phase/emission rules (`test/telemetry-wiring.test.mjs`); the
  JSONL sink contract (`test/telemetry-jsonl-sink.test.mjs`); the
  `tier-cost@2` ledger grammar (`docs/workflow/TIER_COST.md`, untouched).

## Surfaces

- `packages/pi-agentic-workflow`
- `docs`

## Retirements

Strictly additive: one optional tool dependency seam, one optional accumulator
seam, one wiring option and one prose paragraph. No published command, grammar,
contract or sink is removed, so no `orphan` retirement exists to classify.

| Superseded | Replaced by |
|---|---|
| the bare `catch {}` in `writeCurrent` — a sink failure with no report at any tier | the accumulator reporting `{ sink, error }` through `onSinkError`, which the wiring turns into one `notify` (or stderr line) per sink per session |

## Non-goals

- **Attributing sessions that ran no unit-scoped command.** A sample without a
  unit stays unproducible: the wiring's rule ("a sample without a unit would be a
  row the ledger cannot attribute: worse than no row") is unchanged.
- **Attributing the typed gate tools.** `agentic_workflow_status`,
  `_diff_guard`, `_phase_lint`, `_audit_pr_gate` and `_snapshot_verify` run
  subcommands outside `UNIT_COMMANDS`; the issue asks for the unit-scoped ones
  (`PE-003`).
- **A second progress convention.** The report rides the extension's existing
  `notify` channel; the CLI feedback tiers (`docs/workflow/FEEDBACK.md`) are a
  different surface and are untouched.
- **Changing `UNIT_COMMANDS` or `unitFromCommand`.** Which commands name a unit,
  and how an argument resolves against `docs/fix`/`docs/features`, is not this
  unit's question (`PE-002`).
- **Backfilling the rows a broken install never wrote.** The fix makes the next
  session's samples land; the reconstruction path that produced the observed
  `pi:reconstruct=…` rows is unchanged.

## Risk tier

- **Tier** — `standard` · **Task Size** — understood + contained risk + resumable from diff
- **Named high-risk item** — none — not a high-tier unit

The verdict, `runner ceremony tier classify` at the head this unit's last commit
was taken from, verbatim:

```json
{
  "contract": "risk-tier-verdict@1",
  "tier": "standard",
  "reason": "8 path(s) carry executable content: packages/pi-agentic-workflow/src/extension/index.ts, packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts, packages/pi-agentic-workflow/src/extension/workflow-tools.ts, …",
  "reason_kind": "executable-content",
  "task_size": {
    "understood": true,
    "contained_risk": "contained",
    "resumable_from_diff": true,
    "ceremony": "unit-doc",
    "verification": "gates"
  },
  "signals": []
}
```

## Future

none

## Future cost

- A workflow tool that learns to run a unit-scoped subcommand must now thread
  the attribution seam, or it is a second attribution door that silently does
  nothing. Binds: the next author of a `WorkflowToolSpec`.
- A sink added to the wiring is reported through the same latch keyed by its
  `name`, so two sinks sharing a name would share one report. Binds: the sink
  author (`name` is the report's identity).

## Applicable tests

- `packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` (new) — the
  frozen-failure corpus: a unit-scoped `agentic_workflow_run` call attributes the
  session, the seam runs before the spawn and forwards `(subcommand, args)`
  verbatim, a subcommand outside `UNIT_COMMANDS` invents no row, a throwing seam
  never costs the run, and the same outcome holds end to end through the shipped
  entry with a fake runner.
- `packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` — a refusing sink
  is reported once per sink per session while the healthy sink still receives
  every sample; the default channel is stderr; `enabled: false` reports nothing.
- `packages/pi-agentic-workflow/test/session-telemetry.test.mjs` — the
  accumulator reports `{ sink, error }` per failed sink, keeps writing the
  others, and a reporter that throws itself still costs no other sink its sample.
- `packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` — the same
  outcome end to end through the shipped entry, with `AGENTIC_WORKFLOW_RUNNER`
  pointing the door at a fake runner under `/tmp` (`PE-007`).
- `packages/pi-agentic-workflow/test/workflow-tools.test.mjs` and
  `.../workflow-tools-wiring.test.mjs` — the untouched-behaviour half: six
  deferred tools, their arity and their results.

## Known pre-existing issues

- `bun packages/agentic-workflow/bin/agentic-workflow.mjs test-obligation-tags
  --root . --estate` reports `verdict: FAIL` with four `missing adjudication`
  rows (`scripts/local-gate.test.mjs`, `scripts/pre-execution-wording-only-manifest.test.mjs`,
  `scripts/unit-route.test.mjs`, `scripts/workflow-status-compact.test.mjs`) at
  the cut head — **does-not-affect** this unit: the gate step the local gate runs
  (`bun scripts/test-obligation-tags.mjs --root .`) answers `verdict: PASS`,
  0 findings, and the estate mode is an advisory sweep this unit does not touch.
- A fresh worktree has no `node_modules` and no built `dist/`, so a run needs
  `bun install` plus the schema build first — **does-not-affect** the change, and
  it is why the receipts name the build they ran on.
- The worktree this unit was opened in was deleted from under the session by a
  concurrent process in this repository (evidence in `## Log` `L3`), which
  discarded the unit's first, uncommitted draft of these ledgers — **affects**
  the session, not the change: the ledgers were re-cut and committed before any
  source edit, so the branch is the durable record.
- `bun test scripts/roadmap-settle.test.mjs` is red at this branch's head with
  one violation, inherited from `main`'s `7951c17c1` (a concurrent triage
  session): `docs/features/98-deterministic-tool-doctor/SPEC.md:1 slug-mismatch
  — doc folder says 'deterministic-tool-doctor', row says
  'finding-severity-ladder'`, because that commit added a second feature row
  numbered `98` while `98` was already `finding-severity-ladder` — **does-not-affect**
  this unit (it touches no `docs/features/` row and no roadmap feature row), and
  it is not repaired here: renumbering another unit's triage rows and folders is
  that unit's change, so it is reported to the owner in the handoff instead.

## Tasks

- [x] P1 — Freeze these ledgers and land the RED corpus: the new suite and the added cases, observed failing on the unwired seam and the swallowed sink error (validator: `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits non-zero)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/690-telemetry-attr/SPEC.md, packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs, packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs, packages/pi-agentic-workflow/test/session-telemetry.test.mjs, packages/pi-agentic-workflow/test/shipped-adapter.test.mjs
- [x] P2 — The attribution seam: `WorkflowToolsDeps.onRunnerCommand` called by `runnerRunSpec.execute` before the spawn, threaded from the adapter's `noteCommand` (validator: `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0)
  (Implements: S1, S2)
  - Relevant files: packages/pi-agentic-workflow/src/extension/workflow-tools.ts, packages/pi-agentic-workflow/src/extension/index.ts
- [x] P3 — The degraded report: `SessionTelemetryOptions.onSinkError` reports every failed sink write, and the wiring turns it into one report per sink per session through `onDegraded`, wired to the operator's `notify` (validator: `bun test packages/pi-agentic-workflow/test/session-telemetry.test.mjs packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` exits 0)
  (Implements: S3)
  - Relevant files: packages/pi-agentic-workflow/src/session-telemetry.ts, packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts, packages/pi-agentic-workflow/src/extension/index.ts
- [x] P4 — Documentation and state: the README's telemetry section names both attribution doors and the degraded report, the changeset, the roadmap row through its writer, the generated projection and the journal entry (validator: `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: packages/pi-agentic-workflow/README.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, .changeset/690-telemetry-attribution.md, docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md
- [x] P5 — Verification: the package suite, the root suite and the declared gates in the foreground (validator: `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: S1, S2, S3)
  - Relevant files: docs/fix/690-telemetry-attr/SPEC.md

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Every source below was read in this session at the cut head `da644ad65`; a
claim carried from training is never `confirmed`, and an unsampled assumption is
`unknown` with an owner.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | committed-source | `noteCommand` has one production caller — the slash-command registrar — and the deferred tools never reach it, so a session whose work runs through `agentic_workflow_run` attributes nothing | `packages/pi-agentic-workflow/src/extension/index.ts:182-195` (the registrar's `noteCommand(name, args)`), `:397` (the closure), `:410` (`registrar: toRegistrar(pi, noteCommand)`); `rg -n "noteCommand" packages/pi-agentic-workflow/src` → no hit in `workflow-tools.ts` | read 2026-11-22 (this session) | O1, O2, O3; AC-S1, AC-S2 |
| PE-002 | committed-source | `unitFromCommand` accepts exactly four command names (`execute-phase`, `unit-lane`, `fold-findings`, `workflow-status`) and resolves the first argument that looks like a name against `docs/fix` and `docs/features`; a flag or an unresolvable number answers `null` | `packages/pi-agentic-workflow/src/session-telemetry.ts:331` (`UNIT_COMMANDS`), `:342-364` (`unitFromCommand`) | read 2026-11-22 (this session) | O3; AC-S2 |
| PE-003 | committed-source | Of the six deferred tools only `agentic_workflow_run` can run a unit-scoped subcommand: the other five spawn `workflow-status` (via the sensor), `diff-guard`, `phase-lint`, `audit-pr-gate` and `pre-execution-snapshot` | `packages/pi-agentic-workflow/src/extension/workflow-tools.ts:250-295` (the sensor path), `:489-696` (the four gate specs' `launchRequest` argv) | read 2026-11-22 (this session) | O1; D3 |
| PE-004 | committed-source | The tool deps are threaded from the adapter through the factory into `createWorkflowTools`, and `noteCommand` is already in scope at that call site | `packages/pi-agentic-workflow/src/extension/factory.ts:61` (`workflowTools?: WorkflowToolsDeps`), `:235` (`createWorkflowTools(deps.workflowTools ?? {})`); `packages/pi-agentic-workflow/src/extension/index.ts:397` then `:410` | read 2026-11-22 (this session) | O1, O2; AC-S1, AC-S2 |
| PE-005 | committed-source | The silent failure is `writeCurrent`'s `catch {}`, and both shipped sinks throw rather than write something plausible, so the failure is reachable and worth reporting | `packages/pi-agentic-workflow/src/session-telemetry.ts:255-266`; `packages/pi-agentic-workflow/src/telemetry-sinks.ts:40-66` (the ledger sink's refusal contract), `:69-84` (the JSONL sink's) | read 2026-11-22 (this session) | O5, O6, O7; AC-S3 |
| PE-006 | measured-run | The four touched suites are green at the cut head, so the new cases are a real red-first baseline rather than a repair of another failure | `bun test --timeout=20000 test/telemetry-wiring.test.mjs test/session-telemetry.test.mjs test/workflow-tools.test.mjs test/workflow-tools-wiring.test.mjs` → 59 pass, 0 fail (recorded `E1`) | measured 2026-11-22 (this session) | O8; AC-S1, AC-S2, AC-S3 |
| PE-007 | committed-source | `runnerLaunch` honours `AGENTIC_WORKFLOW_RUNNER` before every other candidate and tokenises it, so the shipped-entry case can point the door at a fake runner script under `/tmp` and never spawn the real crate | `packages/pi-agentic-workflow/src/runner-bin.ts:159-165` (the override is read first) | read 2026-11-22 (this session) | O2; AC-S1 |
| PE-008 | measured-run | A `spawn()` without an `env` option inherits `process.env`, so the phase the wiring exports reaches the spawned runner | `/tmp/pe690/probe.mjs`: `AG_WF_PHASE=execute-phase` in the parent, child printed `{"phase":"execute-phase"}` · exit 0 | measured 2026-11-22 (this session) | O4; AC-S2 |
| PE-009 | committed-source | The adapter already captures one session-scoped value from the live `session_start` context and holds the closure for the instance's life, so a captured `notify` is the same shape rather than a new risk | `packages/pi-agentic-workflow/src/extension/index.ts:481-508` (`sessionId` read once, `createTelemetryWiring` built with it) | read 2026-11-22 (this session) | O5, O6; AC-S3 |
| PE-010 | unknown | An operator whose Pi host replaces the session context before the degraded report fires is not sampled: the assumption is that one extension instance serves one session, which the adapter states in its own comment but no gate proves. Owner: the next Pi-host compatibility verification | `packages/pi-agentic-workflow/src/extension/index.ts:494-497` (the stated assumption) | unsampled 2026-11-22 | O6 |
| PE-011 | measured-run | The configured JSONL path never resolved to a file: `resolve(relative, root)` answers with the ROOT itself, so the adapter pointed the JSONL sink at the project directory and every write failed with `EISDIR` — silently, because of the bare `catch` | `bun -e 'console.log(require("node:path").resolve(".pi/.telemetry/sessions.jsonl", "/tmp/repo"))'` → `/tmp/repo`; the same expression in `packages/pi-agentic-workflow/src/extension/index.ts:508` before this unit's fix; a shipped-entry run wrote the ledger row while `.pi/.telemetry/sessions.jsonl` was never created (scratch `/tmp/pe690dbg`) | measured 2026-11-22 (this session) | O10; AC-S1 |

## Obligations

One row per normative behaviour, compatibility invariant, affected use case and
required failure state (shape owned by
`skills/pre-execution-review/references/LEDGERS.md` §2).

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S2 | A unit-scoped runner subcommand dispatched through `agentic_workflow_run` attributes the session: the sample lands in the sink the accumulator was built with, with the unit and the phase the command names | P2 | P2 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0 | the attributed-door case's sample assertion; `## Log` `E3` | verified |
| O2 | S1 | End to end through the shipped entry, a runner-door unit command produces the automatic `pi:session=…` row both destinations receive: the `tier-cost@2` ledger row and the JSONL line | P2 | P2 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0 | the shipped-entry case's ledger-row and JSONL-line assertions; `## Log` `E4` | verified |
| O3 | S2 | Invariant: a subcommand outside `UNIT_COMMANDS`, or one whose arguments name no unit directory, attributes nothing and writes no row — the no-invented-row rule survives the new door | P2 | P2 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0 | the unattributed-subcommand cases' empty-write assertions; `## Log` `E3` | verified |
| O4 | S2 | The phase in flight follows the door: the seam runs before the spawn, so the child inherits `AG_WF_PHASE` set to the subcommand's label, and the subcommand plus its arguments arrive verbatim | P2 | P2 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs` exits 0 | the before-spawn case's ordering, argv and environment assertions; `## Log` `E3` | verified |
| O5 | S3 | A sink that refuses its sample is reported, once per sink per session, while every other sink still receives the sample | P3 | P3 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` exits 0 | the refusing-sink case's one-report and healthy-sink assertions; `## Log` `E4` | verified |
| O6 | S3 | Required failure state: with no injected channel the report is one stderr line naming the sink and the reason, and `enabled: false` still reports nothing at all | P3 | P3 | execute-phase | `bun test packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` exits 0 | the stderr-default case's captured line and the off case's silence; `## Log` `E4` | verified |
| O7 | S3 | Required failure state: a reporter that throws itself costs no other sink its sample, and a failed write is never re-attempted as a duplicate row | P3 | P3 | execute-phase | `bun test packages/pi-agentic-workflow/test/session-telemetry.test.mjs` exits 0 | the throwing-reporter case's per-sink assertions; `## Log` `E4` | verified |
| O8 | S1, S2, S3 | Affected use case that must not regress: the six deferred tools keep their names, schemas, `deferred` exposure and host arity, and the wiring keeps its unit/phase/emission rules | P5 | P5 | execute-phase | `bun run test` in `packages/pi-agentic-workflow` exits 0 | the whole package suite green, the sibling suites included; `## Log` `E6` | verified |
| O9 | S1, S2, S3 | Documentation currency: the package README's telemetry section names both attribution doors and the degraded report, its context budget is re-pinned with its reason, and the generated projection is the emitter's own | P4 | P4 | execute-phase | `bun scripts/docs-generate.mjs --check` exits 0 | the check's PASS verdict plus the README paragraph it reads; `## Log` `E7` | verified |
| O10 | S1 | The JSONL destination is the project's own configured path: a relative `telemetry.jsonFile` resolves under the project root, so the sample reaches the file the configuration names instead of being aimed at the root directory | P2 | P3 | execute-phase | `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs` exits 0 | the shipped-entry case's JSONL-line assertion at `<project>/.pi/.telemetry/sessions.jsonl`; `## Log` `E4` | verified |

## Acceptance criteria

- **AC-S1** — A session whose work runs through the deferred `agentic_workflow_run`
  tool emits an automatic sample for its unit: the `tier-cost@2` ledger gains the
  `pi:session=…` row and the JSONL file gains its line, with no manual
  reconstruction. Proved by:
  `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs`
  exits 0.
- **AC-S2** — The attribution happens at the door, before the spawn, with the
  subcommand and its arguments forwarded verbatim; a subcommand that names no
  unit still invents no row, and a throwing seam never costs the subcommand its
  run. Proved by:
  `bun test packages/pi-agentic-workflow/test/telemetry-attribution.test.mjs`
  exits 0.
- **AC-S3** — A sink that refuses its sample is reported once per sink per
  session through the operator's channel (stderr when the caller named none)
  instead of vanishing into a bare `catch {}`, and the other sinks still receive
  the sample. Proved by:
  `bun test packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` and
  `bun test packages/pi-agentic-workflow/test/session-telemetry.test.mjs`
  exit 0.

## Triaged steps

```
TRIAGE — 690-telemetry-attr (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
relay: bootstrap-needed — no packet at .pi-web/relays/690-telemetry-attr
relay-next: create .pi-web/relays/690-telemetry-attr/ (charter → docs/fix/690-telemetry-attr/SPEC.md) then dispatch_relay(packet: ".pi-web/relays/690-telemetry-attr", leg: "1") · legs: 6 = 5 phases + 1 coherence review
```

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-22, the request, verbatim:
  > Apply to this repository: issue #690

  Resolved as `continue` — no unit doc of this unit's own existed, so the
  sequence starts at `P1`. Delivered through the owner's local inline workflow
  (no `review-change`, no `audit-pr`, no fold cycle): the ledgers below are the
  plan.
- **L2** — 2026-11-22, issue [#690](https://github.com/gtrabanco/agentic-workflow/issues/690),
  verbatim (`S1`–`S3` above quote its three asks; its root-cause chain is folded
  into `PE-001`–`PE-005`):
  ~~~
  ## Problem

  Automatic telemetry (`pi:session=…` rows) never reaches `docs/workflow/TIER_COST.md` or `.pi/.telemetry/sessions.jsonl`, despite:

  - `config.telemetry.enabled: true` (project: `.pi/agentic-workflow.json`)
  - The extension installed and active (`@gtrabanco/pi-agentic-workflow@canary`)
  - The installed `dist/` canary containing the full telemetry code path

  Observed: both destinations carry only reconstructed rows (`pi:reconstruct=…`, manual `telemetry reconstruct write`). Zero automatic rows ever landed.

  ## Root cause (verified chain)

  1. **Attribution gate**: `createTelemetryWiring` only builds the accumulator when `noteCommand()` resolves a **unit** — `unitFromCommand()` (`packages/pi-agentic-workflow/src/session-telemetry.ts:342`, `UNIT_COMMANDS` at :331) accepts only `execute-phase`, `unit-lane`, `fold-findings`, `workflow-status`. Any other first command yields `unit: null` and the wiring emits nothing by design ("a sample without a unit would be a row the ledger cannot attribute: worse than no row").
  2. **`noteCommand()` has exactly one caller**: `extension/index.ts:190`, inside the **slash-command registrar**. The registered commands are `aw-index`, `settings`, `log-session`, `advance` — **none of them is in `UNIT_COMMANDS`**, so `unitFromCommand()` returns `null` on every real invocation.
  3. **The actual work path bypasses attribution entirely**: unit-scoped work runs through the deferred workflow tools, primarily `agentic_workflow_run` (`packages/pi-agentic-workflow/src/extension/workflow-tools.ts:699`, `runnerRunSpec`) — the generic door every skill's `runner <subcommand> [args…]` citation goes through. That file never calls `noteCommand` (verified in both `src/` and the installed `dist/`: `noteCommand` is absent from `workflow-tools.js`).
  4. **Runtime consequence**: `unit` stays `null` → `build()` returns `null` → the accumulator is never created → `turn_start` / `turn_end` / `tool_execution_end` / `agent_settled` / `session_shutdown` all no-op via `accumulator?.…` → no sink ever receives a sample. Also, since `agent_settled` and `session_start` only call the (null) accumulator, nothing is flushed at any boundary.

  ## Corroboration

  The reconstructed rows prove sinks, the `tier-cost@2` grammar, the atomic append and the dedup guard all work. The defect sits strictly upstream: unit attribution never happens.

  ## Secondary defect

  `writeCurrent()` (`src/session-telemetry.ts`, ~line 258) swallows sink errors with `catch {}` — even with the chain repaired, a broken sink stays silent forever. Worth an explicit degraded-report (stderr/notify), consistent with the feedback-channel contract.

  ## Proposed fix

  Wire `agentic_workflow_run.execute()` (and any other workflow tool that runs a unit-scoped subcommand) to call `noteCommand(subcommand, args)` before spawning — that is the only site through which the subcommands `UNIT_COMMANDS` recognizes actually flow today. The slash-command route alone can never attribute a unit.

  ## Environment

  - `@gtrabanco/pi-agentic-workflow@5.0.0-canary.20261121.1` (dist verified)
  - Project config: `.pi/agentic-workflow.json` with `telemetry.enabled: true`
  ~~~
- **L3** — 2026-11-22, session incident, recorded rather than hidden. While this
  unit was being cut, a concurrent session working in the repository's main
  checkout (commit `7951c17c1`, "triage issues not in roadmap — add #690 fix
  unit…", and `3e0ec51d8`) removed this unit's worktree from under the session:
  `.worktrees/fix-690-telemetry-attr` was emptied, its `.git` file deleted and
  its registration pruned (`git worktree list` no longer named it), which
  discarded the unit's first draft of these ledgers. No commit was lost — none
  existed — and the worktree was recreated at the same path per
  `docs/workflow/WORKTREES.md` §Common failure modes, the branch fast-forwarded
  onto `main` (`da644ad65` → `3e0ec51d8`), and the ledgers re-cut here and
  committed before the first source edit. The same session's triage stub for
  this issue (`scope: high`, which is a risk tier, not a scope value from
  `trivial|xs|small|standard|medium|large|xlarge`) is superseded by this
  document in place, so one issue keeps one unit doc.
- **D1** — 2026-11-22, the attribution seam is `WorkflowToolsDeps.onRunnerCommand`, an injected callback rather than an import of the telemetry wiring: `workflow-tools.ts` stays Pi-free and the wiring stays the only place that knows Pi (see `decisions.md`).
- **D2** — 2026-11-22, the seam is called **before** `launchRequest`, so `AG_WF_PHASE` is in `process.env` when the child is spawned (`PE-008`) and a failed spawn still leaves the session attributed to the unit it was working on.
- **D3** — 2026-11-22, the five typed gate tools gain no seam (`PE-003`): none of them runs a `UNIT_COMMANDS` subcommand, and the issue asks for the unit-scoped ones only.
- **D4** — 2026-11-22, the degraded report is latched per sink `name` for the session's life, and its channel is the wiring's `onDegraded` — the adapter passes the operator's `notify`, and a caller that names none gets one stderr line. A report per settled run would be noise; silence is the defect being repaired.
- **D5** — 2026-11-22, the accumulator's "one broken sink costs the others nothing" rule is preserved unchanged; only the silence is removed.
- **D6** — 2026-11-22, the triage block's `review` step and its relay addendum are copied verbatim as the machine printed them; this owner-directed local workflow runs no `review-change`/`audit-pr` pass and bootstraps no relay packet on this branch.
- **D7** — 2026-11-22, the inverted JSONL path (`resolve(relative, root)`, `PE-011`) is repaired inside this unit rather than reported for a follow-up: S1 names the JSONL file as one of the two destinations that never received a row, so a unit that fixed attribution and left the sink aimed at a directory would satisfy its own reproduction and still fail its requirement. `O10` carries it.
- **D8** — 2026-11-22, the package README's context budget is re-pinned to its exact measurement with its reason recorded in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (README at 1,311/17,726 lines/estimate, the change measures 1,324/17,944) — the fix #571 precedent, and that section has no emitter, so the row is a recorded hand edit.
- **P1** — 2026-11-22, the ledgers frozen and the RED corpus landed · ef96e9b26.
- **E1** — 2026-11-22, the cut-head baseline: `bun test --timeout=20000 test/telemetry-wiring.test.mjs test/session-telemetry.test.mjs test/workflow-tools.test.mjs test/workflow-tools-wiring.test.mjs` · exit 0 · 59 pass, 0 fail.
- **E2** — 2026-11-22, the corpus before the implementation at `ef96e9b26`: `bun test test/telemetry-attribution.test.mjs` · 3 pass, 3 fail (the attributed-door case wrote no sample, the seam was never called, the door noted nothing); `test/session-telemetry.test.mjs` 22 pass, 2 fail (no report of a refusing sink); `test/telemetry-wiring.test.mjs` 19 pass, 2 fail (no `onDegraded` report); `test/shipped-adapter.test.mjs` 28 pass, 1 fail (no JSONL line and no ledger row through the shipped entry).
- **P2** — 2026-11-22, the runner door notes its subcommand before the spawn · 795023247.
- **E3** — 2026-11-22, `bun test test/telemetry-attribution.test.mjs` · exit 0 · 6 pass, 0 fail (the attributed-door, before-spawn/verbatim/`AG_WF_PHASE`, no-invented-row and throwing-seam cases).
- **E4** — 2026-11-22, `bun test test/shipped-adapter.test.mjs` · exit 0 · 29 pass, 0 fail (the end-to-end case writes the ledger row and the JSONL line at the project's own `.pi/.telemetry/sessions.jsonl`).
- **P3** — 2026-11-22, the degraded report and the JSONL path · 51c241f5e.
- **E5** — 2026-11-22, `bun test test/session-telemetry.test.mjs test/telemetry-wiring.test.mjs` · exit 0 · 47 pass, 0 fail (the per-sink report, the stderr default, the throwing-channel fallback, the one-report latch and the off switch's silence).
- **E6** — 2026-11-22, `bun run test` in `packages/pi-agentic-workflow` · exit 0 · 1055 pass, 0 fail across 91 files.
- **E7** — 2026-11-22, `bun scripts/docs-generate.mjs --check` · exit 0 · verdict PASS, 3 files, 0 stale; `bun scripts/check-skill-context.mjs --documents` · exit 0 · PASS, 7 budgeted documents; `bun scripts/check-skill-context.mjs` · exit 0 · PASS, 30 skills.
- **P4** — 2026-11-22, the README paragraph, the budget re-pin, the changeset, the roadmap row through its writer, the emitter's projection and the ledgers' closure · 3b644e90a.
- **G1** — 2026-11-22, HEAD `3b644e90a`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/690-telemetry-attr/SPEC.md` · exit 0 · PASS (6/6) for each of P1–P5.
- **G2** — 2026-11-22, HEAD `3b644e90a`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/690-telemetry-attr/SPEC.md` · exit 0 · VERIFY PASS, seven checks, no violations.
- **G3** — 2026-11-22, HEAD `3b644e90a`, `bun scripts/test-impact.mjs --base origin/main` · exit 0 · verdict `targeted`, 9 executable path(s), 1 symbol (`TelemetrySinkFailure`), 9 suites; those nine ran in the foreground · exit 0 · 145 pass, 0 fail.
- **G4** — 2026-11-22, HEAD `3b644e90a`, the four touched suites `bun test test/telemetry-attribution.test.mjs test/telemetry-wiring.test.mjs test/session-telemetry.test.mjs test/shipped-adapter.test.mjs` · exit 0 · 81 pass, 0 fail; `bun run test` in the package · exit 0 · 1055 pass, 0 fail across 91 files.
- **G5** — 2026-11-22, HEAD `3b644e90a`, `bun scripts/run-root-suite.mjs` · 140 suites · 139 PASS, 1 FAIL — `scripts/roadmap-settle.test.mjs`, the duplicate feature-`98` row inherited from `main`'s `7951c17c1` (see `## Known pre-existing issues`), touching no path this unit changed.
- **G6** — 2026-11-22, HEAD `3b644e90a`, `bun scripts/docs-generate.mjs --check` · exit 0 · verdict PASS; `bun scripts/check-skill-context.mjs --documents` · exit 0 · PASS; `bun scripts/check-skill-context.mjs` · exit 0 · PASS; `bun scripts/test-obligation-tags.mjs --root .` · exit 0 · 140 suites, 0 findings, verdict PASS.
- **G7** — 2026-11-22, HEAD `3b644e90a`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs diff-guard --base origin/main` · exit 1 · `DIFF-GUARD BREACH — Lines: 1210 > 400 · Files: 15 > 8`. Reported, not trimmed: the only honest split does not exist here, because the ranges are not interchangeable. What this unit authored is 15 files, +1165 −45 — source +112 −4 across four files (the seam, the thread, the report, the resolution), tests +513 −0 across four suites, and the rest the frozen ledgers, the README paragraph and the writer's own roadmap/projection output. Deleting prose or tests to fit would be the anti-gaming breach the guard itself names.
- **P6** — 2026-11-22, the branch was pushed and PR [#692](https://github.com/gtrabanco/agentic-workflow/pull/692) opened against `main`; no merge, no approval · eef874a06, 0e29e89bf. The push used the gate's documented `AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1` escape hatch, whose contract is "record why in the PR": the offline subset is 17/18 with `root-suite` red on the duplicate feature-`98` row inherited from `main`'s `7951c17c1`, and the PR body carries that record.

## Next

The owner's external verification of the branch diff and the closed obligations
ledger; then the PR against `main` (no merge, no approval by this unit).

## References

- Issue [#690](https://github.com/gtrabanco/agentic-workflow/issues/690)
- Feature [#383](https://github.com/gtrabanco/agentic-workflow/issues/383) / [#504](https://github.com/gtrabanco/agentic-workflow/issues/504) — the accumulator, the sinks and the phase label this unit repairs the upstream half of
- [#623](https://github.com/gtrabanco/agentic-workflow/issues/623) — the `agent_settled` emission boundary the samples depend on
- [#555](https://github.com/gtrabanco/agentic-workflow/issues/555) — the generic runner door this unit wires
- Ledger grammar owner: `docs/workflow/TIER_COST.md`

## Branch

`fix/690-telemetry-attr`

## Depends on

none

## Regression scope

- The six deferred tools keep their names, schemas, `deferred` exposure and host
  arity: `bun test packages/pi-agentic-workflow/test/workflow-tools.test.mjs`
  exits 0 and
  `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs`
  exits 0.
- The shipped adapter still registers all six and answers the host's five-argument
  call: `bun test packages/pi-agentic-workflow/test/shipped-adapter.test.mjs`
  exits 0.
- The wiring's unit, phase and emission rules are unchanged:
  `bun test packages/pi-agentic-workflow/test/telemetry-wiring.test.mjs` exits 0.
- The JSONL sink's line contract is unchanged:
  `bun test packages/pi-agentic-workflow/test/telemetry-jsonl-sink.test.mjs`
  exits 0.
- The crate's manual reconstruction path is untouched:
  `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs`
  exits 0 (the suite the `telemetry` service owns).
