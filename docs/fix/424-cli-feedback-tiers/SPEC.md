---
type: fix
scope: medium
roadmap_summary: Every CLI reports through one feedback channel with three tiers — regular (start / progress with an estimate / done with timing), `--debug` (per-file, per-step, provider detail) and `--profile` (per-stage ms, share, total, bottleneck) — on stderr, with stdout and the envelope untouched. Applied through the owner's local workflow (ledgers frozen at cut); the status stays `in-progress` until the owner's review. PR: [#550](https://github.com/gtrabanco/agentic-workflow/pull/550).
---

# fix/424-cli-feedback-tiers

> Every CLI the workflow ships is silent while it works. `doc --sync` is the case
> the issue was detected on: it scans, embeds and indexes with no output at all, so
> a user cannot tell a working machine from a frozen one. Each command prints its
> own ad-hoc lines (if any), and no contract says what a command must report. This
> unit establishes one feedback channel with three tiers, adopts it in the runner
> bin so every subcommand reports, deep-adopts it in the `doc` path (the frozen
> reproducer), and writes the rule that binds future CLIs. Applied through the
> owner's local unpublished workflow (the §5 ledger freeze substitutes for the
> lane's plan step); no repo review/fold machinery runs on this change.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#424` — "ISSUE: universal CLI feedback system — regular, debug, and profiling
tiers" (`bug`, `promoted`). The PR closes it via `Closes #424` in the body.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. `S1` is
the owner's apply instruction; `S2`–`S7` are the issue's own statements, in the
order the issue states them; `S8` is the triage note the issue carries verbatim,
which orders where the mechanism lives.

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #424

**S2 — The user always knows a command started, what it is doing, and how long it took.**
> Users should always know:
> - The command started
> - What it is doing (with estimated remaining work if it may take time)
> - How long it took when it finishes

**S3 — Three feedback tiers: regular, debug, profiling.**
> - A feedback infrastructure is created under `scripts/` with three tiers:
>   1. **Regular** — minimal progress info (start, progress for long-running, done with timing).
>   2. **Debug** (`--debug`) — every detail for diagnostics (per-file, per-step, provider details).
>   3. **Profiling** (`--profile`) — timing per stage, total time, bottleneck identification.

**S4 — One consistent core API.**
> - The core API is consistent: a single […] (or equivalent) exports standardized functions.

The bracket marks one elision, in the template's marked-elision form: the
requirement names a path under the repository's `scripts/`, and S8 records where
the mechanism actually lands (the runner crate). Leaving the literal in place
would make this document claim a file that must not exist — exactly what the
tree-checking verifier refuses — so the path is elided here and quoted in full in
the `S8` note below, where it is described rather than claimed.

**S5 — The `doc` CLI uses the new system.**
> - The `doc` CLI (`bin/agentic-workflow.mjs`) uses the new system.

**S6 — A rule in `AGENTS.md` binds future CLIs and scripts.**
> - A rule is added to `AGENTS.md` requiring all future CLIs/scripts to follow this feedback pattern.

**S7 — The envelope schema is not changed; feedback is stderr-only.**
> - The envelope schema is NOT changed — feedback goes to stderr, envelope is for the machine receipt.

**S8 — The mechanism's home is the runner crate, not the repo's `scripts/`.**
> The mechanism's home should be the runner crate (or be decided at this fix's triage) so #352's migration carries it instead of orphaning it. Ordering with #352 stays soft (see above): the `doc` CLI feedback half is startable now — `doc` already lives in the crate.

The grammar the machine reads (`spec-requirement@1`): one `**S# — title.**` line
per requirement, followed by a `>` blockquote carrying the requester's words. A
correction is its own line with its own id (`S1a`) — never a rewrite of the line
it corrects.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Impact

What the fix touches beyond its own lines:

- **The bin's argument surface** — `packages/agentic-workflow/bin/agentic-workflow.mjs`
  is the one dispatch point for every subcommand (the editor services in its
  `switch`, the runner family through `RUNNER_COMMANDS`). The tier flags are
  consumed there, so no subcommand's own grammar needs to know about them; every
  command in the skills' prose (`phase-lint`, `diff-guard`, `workflow-status`,
  `pre-execution-snapshot`, `needs-input`, `ledger-provenance`, `ceremony`,
  `verify`, `journal …`, `config …`) is covered by one attachment.
- **`doc`'s engine seam** — `runDocOp(grammar, ctx)` gains an optional
  `ctx.feedback`; `syncIndex` gains `opts.onProgress`. Both default to a no-op,
  so every existing caller (the bin, the suites, the pi package's native
  `/aw-index` command) keeps its current behaviour byte for byte.
- **stderr is the only stream that changes.** stdout, exit codes and the
  envelope are untouched (S7), which is what keeps every machine consumer — the
  `--json-only` readers, the hooks, the `/aw-index` renderer — working without a
  change. The differential run over the base commit is the proof, not the claim.
- **The guide** — `AGENTS.md` gains a working rule, a documentation-map row, a
  deep-reference row and one `normative-surfaces@1` row (the tier vocabulary is
  a flag an agent may pass, so feature 28's AC15 binds it to the published
  const). The machine region grows by exactly that one line, so
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-pins `machineLines` 136 → 137 and
  declares the re-pin in its own `sources`.
- **A new guide-layer page** — `docs/workflow/FEEDBACK.md` is the rule's single
  owner, and `docs/workflow/README.md`'s pages index gains its row (the index
  suite refuses an unlisted file in that directory).
- **The crate README** — `packages/agentic-workflow/README.md` documents the bin,
  so the flag surface and the module's contract are added there in the same
  change.
- **The freeze** — `packages/agentic-workflow/test/feedback.test.mjs` is a new
  protected path (`**/*.test.*`), so this doc carries a
  `path-protection-plan@1` block and every post-freeze modification of a
  protected path is recorded in [`decisions.md`](decisions.md).

Nothing else consumes these bytes: the knowledge is not a skill, so no context
budget moves, and no `skills/` prose cites a feedback flag.

## Retirements

Strictly additive: nothing is renamed, deleted or superseded. The computed
surface inventory at the cut (`bun scripts/residual-classify.mjs --inventory
--base f7e5dbba`, 9 rows):

```text
used   | symbol | FEEDBACK_PROGRESS_EVERY_MS      | live-consumer
used   | symbol | FEEDBACK_START_AFTER_MS         | live-consumer
used   | symbol | FEEDBACK_TIERS                  | live-consumer
used   | symbol | NO_FEEDBACK                     | live-consumer
used   | symbol | createFeedback                  | live-consumer
used   | symbol | formatDuration                  | live-consumer
used   | symbol | parseFeedbackArgs               | live-consumer
orphan | file   | packages/agentic-workflow/src/feedback/index.mjs | no-plan-claim
orphan | file   | packages/agentic-workflow/test/feedback.test.mjs | no-plan-claim
```

The seven symbol rows are `used` on live-consumer evidence. The two `file` rows
are the classifier's own probe gap, recorded here rather than papered over with a
`residual-promise@1` row that would misdescribe a consumed surface: the file
probe greps the **root-relative literal**, while every consumer imports the
sibling path —

- `packages/agentic-workflow/bin/agentic-workflow.mjs:136` —
  `import { createFeedback, parseFeedbackArgs } from "../src/feedback/index.mjs"`,
- `packages/agentic-workflow/src/doc/retrieval.mjs:40` —
  `import { NO_FEEDBACK } from "../feedback/index.mjs"`,
- `packages/agentic-workflow/test/feedback.test.mjs:33` — the corpus imports the
  same module, and `bun run test` is what runs it.

So the two files are consumed, and the `orphan` verdict is the probe's known
limitation (see `## Known pre-existing issues`). No `residual-promise@1` row is
recorded: a promise declares "no consumer yet", which is not the truth here.

The additions and their consumers in this same change, one line each:

| Added surface | Its consumer in this change |
|---|---|
| `packages/agentic-workflow/src/feedback/index.mjs` | the bin's dispatcher, `runDocOp` and the crate suite |
| `packages/agentic-workflow/test/feedback.test.mjs` | `bun run test` in the crate |
| `docs/workflow/FEEDBACK.md` | `AGENTS.md`'s working rule and deep-reference row, and the pages index |
| `docs/fix/424-cli-feedback-tiers/` (4 files) | the phase gate, `phase-lint` and `verify` |
| `.changeset/424-cli-feedback-tiers.md` | `scripts/release.mjs` at cut time |

The one *replacement* is internal to the change: the bin gains no second
diagnostics convention. Every line the new channel prints comes from
`feedback: …`, and the pre-existing `doc:` / `EDIT REFUSAL` / `LOG REFUSAL`
lines keep their own vocabulary because consumers match on them — they are the
receipt, not progress.

## Non-goals

- **No adoption sweep across the 171 repo `scripts/`.** S6 binds *future*
  CLIs/scripts; retrofitting every existing repo-own dev script is a different
  unit and an unreviewable diff. The repo's scripts reach the same module by the
  relative import the crate already exposes (`scripts/session-close.mjs` and
  `scripts/shared-doc-merge.mjs` are the precedent), so no second implementation
  is needed when a script is touched next.
- **No new config key.** The tiers are flags, and the config policy's first
  question decides a flag is not config. Nothing is added to
  `agentic-workflow.json` or to either extension section.
- **No schema change.** No vocabulary, field or contract id in
  `packages/agentic-workflow-schema/` moves; the envelope gains no field (S7).
  The version-parity gate therefore keeps one train version and no mirror edit is
  owed.
- **No progress in the sensors.** `phase-lint`, `diff-guard`,
  `workflow-status`, `pre-execution-snapshot`, `needs-input`,
  `ledger-provenance` and `ceremony` get the universal start/done timing from
  the bin and nothing else: their output is a fixed machine block a gate parses,
  so a per-step line inside them would be a contract change, not feedback.
- **No new runtime dependency.** `node:fs` and `node:process` only.
- **No TTY detection.** The channel never asks whether stderr is a terminal: an
  environment-dependent output is exactly the class of defect this repository's
  gates refuse.

## Risk tier

```text
$ node packages/agentic-workflow/bin/agentic-workflow.mjs ceremony tier classify
```

- **Tier** — `standard` · **Task Size** — `understood`
- **Named high-risk item** — none — not a high-tier unit.

The verdict is copied from the classifier run recorded in the `## Log` (`E`
line), never written from memory.

## Future

none

## Future cost

- **A new subcommand inherits the universal channel for free** — it must not
  open its own progress convention; the owner is `docs/workflow/FEEDBACK.md`,
  and it binds whoever adds the subcommand.
- **A new deep-adopted command keeps its stages as `feedback.stage(name, fn)`
  wrappers** — a hand-timed `performance.now()` pair is the drift this unit
  retires, and it binds whoever writes the next long-running engine.
- **`machineLines` is an exact pin** — the next `normative-surfaces@1` row
  re-pins it in the same change with its `sources` declaration, which binds
  every later unit that touches the guide's machine region.

## Applicable tests

- `bun test packages/agentic-workflow/test/feedback.test.mjs` — the module's own
  corpus (tiers, stripping, threshold, progress, profile, no-op, stdout purity).
- `bun run test` in `packages/agentic-workflow` — the whole crate suite, so every
  pre-existing `doc`, `runner` and `cli` case proves no regression.
- `bun scripts/run-root-suite.mjs` — the repository gate; the guide-budget,
  normative-drift, prose-gate-inventory and workflow-docs-index suites are the
  ones this unit's prose moves.
- The differential harness over a `mktemp -d` copy of `f7e5dbba` and of this
  branch: `doc --sync`, `doc --status`, `doc --query`, `phase-lint`, `verify`,
  `journal aggregate --check`, `config list` compared on stdout/stderr/exit.

## Known pre-existing issues

- `AGENTS.md` measured 690 lines / 136 machine / 554 prose / 11,830 est at the
  cut against the declared 136 machine lines — **matches**, no drift at the cut
  (`bun scripts/check-skill-context.mjs --documents`). Does affect this unit: the
  new row moves it to 137, which this unit re-pins.
- `scripts/normative-drift.test.mjs` enumerates its `must-name` closed set as an
  exact sorted list; adding a vocabulary there would edit that assertion.
  **Does not affect** this unit — the new row declares `must-name: no`, so the
  enumerated set is unchanged.
- The repo has no formatter, so no normalizer can rewrite these bytes.
  **Does not affect** this unit.
- `residual-classify --inventory`'s file probe greps the root-relative literal,
  so a new file whose consumers import it by a sibling path answers
  `orphan | no-plan-claim` even though it is consumed. **Affects this unit**: the
  two added files trip it; the evidence that they are consumed is recorded in
  `## Retirements` (three import sites) instead of being papered over with a
  `residual-promise@1` row, because a promise declares "no consumer yet".

## Tasks

- P1 — the module's red suite lands first and is observed failing on the missing
  module (validator: `bun test packages/agentic-workflow/test/feedback.test.mjs`
  exits non-zero naming the unresolved import)
  (Implements: S3, S4, S7)
  - Relevant files: packages/agentic-workflow/test/feedback.test.mjs
- P2 — `src/feedback/index.mjs` publishes the tier vocabulary, the flag parser,
  the channel (start / stage / progress / detail / done / profile) and the no-op
  (validator: `bun test packages/agentic-workflow/test/feedback.test.mjs` exits 0)
  (Implements: S3, S4)
  - Relevant files: packages/agentic-workflow/src/feedback/index.mjs
- P3 — the bin consumes the tier flags before dispatch and attaches the universal
  channel, so every subcommand reports start and duration (validator:
  `node packages/agentic-workflow/bin/agentic-workflow.mjs doc --status --debug`
  exits 0 with a `feedback:` line on stderr and the same stdout as without the
  flag)
  (Implements: S2, S3, S5, S7)
  - Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs
- P4 — `doc`'s engine adopts the stages and the per-file progress (`syncIndex`
  `onProgress` + `runDocOp` stage wrappers) (validator:
  `node packages/agentic-workflow/bin/agentic-workflow.mjs doc --sync --profile`
  exits 0 with a stage table on stderr in a `mktemp -d` corpus)
  (Implements: S2, S5)
  - Relevant files: packages/agentic-workflow/src/doc/retrieval.mjs,
    packages/agentic-workflow/src/doc/sync.mjs
- P5 — the rule and its owner page land: `docs/workflow/FEEDBACK.md`, the
  `AGENTS.md` rule + documentation-map row + deep-reference row + normative-surface
  row, the pages index row and the crate README section (validator:
  `bun scripts/check-skill-context.mjs --documents` exits 0 with `machineLines`
  re-pinned, and `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S6, S8)
  - Relevant files: AGENTS.md, docs/workflow/FEEDBACK.md,
    docs/workflow/README.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json,
    packages/agentic-workflow/README.md
- P6 — verification and state: the differential, the full root suite, the changeset,
  the roadmap row, the journal entry and every obligation flipped on its own
  foreground validator run (validator: `bun scripts/run-root-suite.mjs` exits 0 and
  `git status --porcelain` shows only the intended files)
  (Implements: S1, S7)
  - Relevant files: .changeset/424-cli-feedback-tiers.md, docs/ROADMAP.md,
    docs/LOGS.md

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

M/L unit: the ledger lives in
[`planning-evidence.md`](planning-evidence.md) (10 rows, `PE-001`–`PE-010`).

### Obligations

M/L unit: the ledger lives in
[`planning-obligations.md`](planning-obligations.md) (13 rows, `O1`–`O13`).

## Acceptance criteria

The anchor every review reads. One observable criterion per `S#`, each naming
the check that proves it.

1. **S1** — the unit ships as one branch off `main` with this doc, its two
   ledgers and its decisions ledger frozen before the first line of code; proven
   by `node packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint
   docs/fix/424-cli-feedback-tiers/SPEC.md` → `verdict: PASS` and the `## Log`'s
   first `P` line predating the first code commit.
2. **S2** — a run that passes the threshold announces itself on stderr and every
   announced run ends with its duration: the universal attachment prints
   `feedback: start …` once the run is still working at the threshold and
   `feedback: done … · <duration>` at exit, a deep-adopted command announces
   immediately, and `progress` reports `n/total` with a percentage and an
   estimate when one is measurable; proven by the threshold, done and progress
   cases in `bun test packages/agentic-workflow/test/feedback.test.mjs` plus the
   spawned `doc --sync` case that asserts both lines on stderr.
3. **S3** — the three tiers are distinct and cumulative: regular prints
   start / stage / progress / done, `--debug` adds per-file and per-stage detail
   (every scanned path is named), `--profile` adds a per-stage table with each
   stage's milliseconds, its share of the total, the total, and the named
   bottleneck; `--debug` and `--profile` are accepted by every subcommand
   (consumed before each command's closed grammar) with `--profile` outranking
   `--debug`; proven by the tier cases in the same suite plus the spawned
   invocations over `phase-lint` and `doc --sync`.
4. **S4** — one module is the only home of the API: `createFeedback` is defined
   exactly once in the tree and the module exports the published vocabulary
   (`FEEDBACK_TIERS`) the guide's normative row binds; proven by
   `rg -c 'export function createFeedback' packages/agentic-workflow/src`
   matching 1 and by the module-contract case in the suite.
5. **S5** — the `doc` CLI reports through the channel: `--sync` and `--rebuild`
   print their scan/embed stages, the per-file progress and the closing duration,
   and stderr carries no feedback line when the run is quiet; proven by the
   spawned `doc --sync` and `doc --sync --quiet` cases.
6. **S6** — the guide carries the rule, its single owner and its machine
   binding: `AGENTS.md` has the working rule with the `docs/workflow/FEEDBACK.md`
   pointer, the documentation-map row, the deep-reference row, and the
   `normative-surfaces@1` row publishing `FEEDBACK_TIERS`, with `machineLines`
   re-pinned in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` and declared in its
   `sources`; proven by `bun scripts/check-skill-context.mjs --documents` exiting
   0 and `bun test scripts/normative-drift.test.mjs` exiting 0.
7. **S7** — feedback never reaches the machine surface: with no tier flag every
   touched command's stdout, stderr and exit code are identical at the base
   commit and at this branch, `--json-only` still emits exactly one JSON document
   on stdout, and the envelope carries no feedback field
   (`rg -c feedback packages/agentic-workflow-schema/src` → 0); proven by the
   differential harness and by the envelope case in the suite.
8. **S8** — the crate is the mechanism's only home: the repository's `scripts/`
   tree carries no feedback module, and the module the `AGENTS.md` rule points at
   is the crate file; proven by `rg --files scripts | rg -c 'feedback'` → 0 and
   the guide's row.

## Path protection

The new suite is a protected path (`**/*.test.*`, `freeze: true`), so the freeze
lands after P2 and each modification carries its record in this folder's
[`decisions.md`](decisions.md). Every record is an *expansion*: no pre-existing
assertion is deleted, relaxed or narrowed.

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
created | packages/agentic-workflow/test/feedback.test.mjs | the feedback channel's own corpus: the tiers, the flag stripping, the threshold, the progress estimate, the profile table and the stdout-purity invariants (S2, S3, S4, S7); no pre-existing case is touched because the file is new
```

## Triaged steps

```text
triaged-steps@1
step | reason | basis
tests-first | every requirement has a frozen reproducer in the crate suite, and the issue's own reproducer (`doc --sync` silent) is the first one | ACCEPTANCE items 2–8
implementation | one slice per surface, dependency order P2 (module) → P3 (bin) → P4 (doc engine) | ## Tasks
docs-and-state | the guide rule, its owner page, the budget re-pin, the changeset, the roadmap row and the journal entry | S6, §7
differential | every touched command is run against the base commit over one corpus | ACCEPTANCE item 7
```

The machine's `unit-route --triage` cannot answer for this unit — the lane never
opened it, so the step list above is this unit's authoritative steps, recorded at
freeze (D1).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the issue verbatim:

  ```
  ## Problem

  Every CLI in the project (scripts + runner crate) has no consistent feedback mechanism. When a command takes time, the user cannot tell if it is working, stalled, or finished. The `doc --sync` operation is the visible case — it silently scans, embeds, and indexes without any progress indication, which feels like the machine has frozen. This is not just a `doc` issue; it affects every CLI and every script.

  ## Detected in

  Direct user execution of `bunx @gtrabanco/agentic-workflow@canary doc --sync` — no output, no progress, no timing information.

  ## Acceptance criteria

  - A feedback infrastructure is created under `scripts/` with three tiers:
    1. **Regular** — minimal progress info (start, progress for long-running, done with timing).
    2. **Debug** (`--debug`) — every detail for diagnostics (per-file, per-step, provider details).
    3. **Profiling** (`--profile`) — timing per stage, total time, bottleneck identification.
  - The core API is consistent: a single `scripts/feedback.mjs` (or equivalent) exports standardized functions.
  - The `doc` CLI (`bin/agentic-workflow.mjs`) uses the new system.
  - A rule is added to `AGENTS.md` requiring all future CLIs/scripts to follow this feedback pattern.
  - The envelope schema is NOT changed — feedback goes to stderr, envelope is for the machine receipt.

  ## Severity

  medium

  ## Triage note 2026-11-08
  - The acceptance criterion saying the feedback infrastructure lives "under `scripts/`" collides with #352, which deletes/migrates the repo `scripts/` into the crate: a mechanism homed there would be deleted with the scripts it feeds back on. The mechanism's home should be the runner crate (or be decided at this fix's triage) so #352's migration carries it instead of orphaning it. Ordering with #352 stays soft (see above): the `doc` CLI feedback half is startable now — `doc` already lives in the crate.
  ```

- **D1** — 2026-11-14, owner apply order (§4 of the local workflow) substitutes
  for the lane's plan step: the `## Tasks` list and the two ledgers are the plan,
  no `review-change` / `audit-pr` / fold cycle runs on this change, the repo's
  deterministic gates run always.
- **D2** — 2026-11-14, S8 decides the home: the mechanism is
  `packages/agentic-workflow/src/feedback/`, because #352 migrated the runtime
  commands into the crate and a feedback module under the repository's `scripts/`
  would be an orphan the day a repo script is retired. The relative-import path
  stays open for repo scripts (`scripts/session-close.mjs` is the precedent).
- **P1** — 2026-11-14 15:15, the ledgers froze before the first line of code
  (`phase-lint` PASS on this doc), then the channel's corpus landed red against
  the missing module · `c6f88cb0`, `5a13d5ec`.
- **E1** — 2026-11-14, `bun test packages/agentic-workflow/test/feedback.test.mjs`
  · exit 1 at `5a13d5ec` · `Cannot find module '../src/feedback/index.mjs'` — the
  red commit, observed failing on the missing module.
- **P2** — 2026-11-14 15:31, `src/feedback/index.mjs` published: the vocabulary,
  the flag parser, the channel with its seams and the no-op · `3b47b6bd`.
- **P3** — 2026-11-14 15:39, the bin consumes the tier flags before dispatch and
  attaches the process-wide channel; `doc` threads it into `runDocOp` and
  `syncIndex` gained `onProgress` · `8ccb3516`.
- **E2** — 2026-11-14, `bun test packages/agentic-workflow/test/feedback.test.mjs`
  · exit 0 · `29 pass 0 fail` (the module, the tiers, the threshold, the
  progress estimate, the profile table, the spawned `doc` cases).
- **E3** — 2026-11-14, `bun run test` in `packages/agentic-workflow` · exit 0 ·
  `755 pass 0 fail` across 42 files (baseline at `f7e5dbba`: 752).
- **P5** — 2026-11-14 15:47, the rule and its owner page landed: `AGENTS.md`'s
  working rule, the deep-reference row, the `feedback-tiers` normative row, the
  pages-index row, the crate README section, and the budget re-pin
  (`machineLines` 136 → 137, estimate re-based 11,964 → 13,291) · `7cdde931`.
- **E5** — 2026-11-14, `bun scripts/check-skill-context.mjs --documents` · exit 0
  · `AGENTS.md 701 lines / 137 machine / 564 prose / 12,082 est` and
  `PASS context documents: 4 budgeted documents`.
- **E6** — 2026-11-14, `bun test scripts/normative-drift.test.mjs` · exit 0 · `21
  pass 0 fail`; `bun test scripts/prose-gate-inventory.test.mjs` · `22 pass`;
  `bun test scripts/workflow-docs-index.test.mjs` · `5 pass`;
  `bun test scripts/docs-generate.test.mjs` · `31 pass`; `bun test
  scripts/guide-split.test.mjs` · `15 pass`.
- **E7** — 2026-11-14, `rg -l 'export function createFeedback'
  packages/agentic-workflow/src` · 1 match (`feedback/index.mjs`); `rg --files
  scripts | rg -c feedback` · 0; `rg -c feedback packages/agentic-workflow-schema/src`
  · 0; `rg -c 'packages/agentic-workflow/src/feedback/index.mjs' AGENTS.md` · 1.
- **E8** — 2026-11-14, `doc --sync` on a fresh four-file corpus in
  `mktemp -d` · exit 0 · `feedback: start`, `stage scan`, `progress 1/5 files
  (20%)`, `progress 5/5 files (100%)`, `stage embed`, `stage stats`,
  `feedback: done … · 5 files scanned, 5 changed, 0 deleted · 7 chunks · 54ms`.
- **E4** — 2026-11-14, the differential harness over `mktemp -d` copies of
  `f7e5dbba` and of this branch, one shared corpus, ten cases · exit 0 ·
  `UNDECLARED 0`; declared deltas only: `doc --status` +2, `doc --sync` +7,
  `doc --sync --json-only` +7, `doc --query` +2 feedback lines on stderr, and
  `doc --sync --quiet` +0; stdout, exit code and feedback-free stderr identical
  on all ten.
- **G1** — 2026-11-14, HEAD 7cdde931460b0154980f2c59b7915dcf8e931911,
  `bun scripts/run-root-suite.mjs` · exit 0 · `112` suite(s) PASS, none failing.
- **P6** — 2026-11-14 15:52, the release intent and the session log recorded
  through the fragment writer and the aggregator · `31f9ec77` (superseded — see
  `D7`).
- **D7** — 2026-11-14 16:31, the branch was re-cut before its first push. The
  pre-push `log-immutability` gate refused `31f9ec77`: `docs/LOGS.md` has exactly
  one legal writer (the merge-to-main aggregator, carrying the bot identity), so a
  local aggregation is an illegal touch even when it ran through the journal CLI.
  The entry now ships as a pending fragment
  (`.agentic-workflow/journal/20261114T163134Z-fix-424-universal-cli-feedback-narrative-local.md`),
  which is legal for anyone, and the aggregator writes `docs/LOGS.md` at merge.
  The four slices after the changeset were re-applied unchanged; their shas are
  the ones this branch carries (`819574fd`, `3cc41e1c`, `be86e278`, `046e8b8e`,
  `dba5465f`). Nothing had been published — `git ls-remote --heads origin` had no
  such branch — so no published history moved.
- **D3** — 2026-11-14, the regular tier is quiet-until-it-matters rather than
  always-on: the universal attachment emits `start` only once the run has
  crossed the threshold (250 ms), so a fast command adds no noise to a hook, a
  CI log or a script pipe, while a command that feels frozen announces itself
  inside a quarter second. The issue's own words scope the failure to runs of
  ">1s", so this is the intent, not a relaxation.

## Next

P1: land the module's red suite.

## References

- Issue [#424](https://github.com/gtrabanco/agentic-workflow/issues/424) —
  `Closes #424`.
- Roadmap row 207 (`cli-feedback-tiers`).
- Issue [#352](https://github.com/gtrabanco/agentic-workflow/issues/352) — the
  crate migration S8 defers to.
- The diff-size and red-first rules the unit obeys: `AGENTS.md` §Working rules.

## Branch

`fix/424-universal-cli-feedback`

## Depends on

none — #352 (closed) delivered the crate and its bin; S8 records the ordering
that made this unit startable.

## Regression scope

| Scenario | Verified by |
|---|---|
| `doc --sync` / `--rebuild` / `--query` / `--status` produce the same stdout and exit code with no tier flag | the differential harness over `f7e5dbba` and this branch (stdout+exit identical; stderr identical when the run is under the threshold) |
| `doc --sync --quiet` writes nothing on success (unit 65's AC23) | the spawned `--quiet` case in `test/feedback.test.mjs` and the pre-existing case in `test/doc.sync.test.mjs` |
| `doc --json-only` emits exactly one JSON document on stdout | the pre-existing `doc.envelope` / `doc.query` cases, unchanged |
| every runner subcommand keeps its exit contract (`0` success / `1` usage / `2` refusal) | `bun test packages/agentic-workflow/test/runner.*.test.mjs` at or above the frozen baseline |
| the `journal aggregate` hook path is unaffected by extra stderr | the pre-existing journal cases plus the executed-hook case in `scripts/local-gate.test.mjs` |
| the envelope and its schema are untouched | `rg -c feedback packages/agentic-workflow-schema/src` → 0 and `bun run test` in the schema package |
