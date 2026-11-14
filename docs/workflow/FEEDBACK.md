# CLI feedback

Every command this workflow ships reports through one channel: the runner
crate's [`src/feedback/index.mjs`](../../packages/agentic-workflow/src/feedback/index.mjs).
This page is that contract's single owner — [`AGENTS.md`](../../AGENTS.md) states
the rule and links here, and no other document restates it.

The carencia it closes: a CLI that works silently cannot be told apart from a
frozen machine. The worst case was `doc --sync`, which scans, embeds and indexes
with not one byte on any stream until it ends.

## The three tiers

The tiers are cumulative and selected by a flag the **bin** consumes, once,
before any command's own grammar runs (every grammar in the tree is closed, so a
flag a grammar never saw is a usage error by design).

| Tier | Flag | What it answers | What it prints |
|---|---|---|---|
| regular | none | is it working, and how long did it take | `start`, `stage`, `progress` with an estimate, `done` with the duration |
| debug | `--debug` | what exactly is it doing | every unit of work one line each, each stage's own cost, and the command's provider/diagnostic detail |
| profile | `--profile` | where did the time go | the debug lines plus a per-stage table: milliseconds, share of the total, the total, and the named bottleneck |

`--profile` outranks `--debug`: a run carrying both is profiled, because the
profile tier is the strict superset. No fourth tier and no refusal vocabulary
exists — a tier value outside the three is not reachable, since the flag is the
whole surface.

```text
feedback@1
tier | line | what it orders
regular | feedback: start <subject> | the command is still working — printed by the first event, or once the run passes the threshold
regular | feedback: stage <name> | which stage of the work is running
regular | feedback: progress <done>/<total> <unit> (<pct>%) · ~<estimate> left | how far the work is, with an estimate once the observed rate is worth reading
regular | feedback: done <subject> · <summary> · <duration> | what the run did and how long it took
debug | feedback: stage <name> · <duration> | each stage's own cost
debug | feedback: progress <done>/<total> <unit> (<pct>%) · <unit-detail> | one line per unit of work, unthrottled
debug | feedback: detail <message> | the command's own provider, path or state detail
profile | FEEDBACK PROFILE — <subject> · total <duration> | the run's total
profile | <stage> <ms> <share>% | one row per stage (a single `run` row when the command declares no stages)
profile | bottleneck: <stage> (<ms>, <share>% of total) | the stage worth looking at first
```

## The invariants (never trade one away)

1. **stderr only.** Feedback is diagnostics. stdout carries the result and the
   machine receipt, and the envelope is the receipt — feedback never adds a field
   to it, never prefixes it and never interleaves with it. A `--json-only` run
   emits exactly one JSON document on stdout whether or not a tier flag is
   present.
2. **Quiet until it matters.** A universally-attached command announces itself
   only once it is still working at the threshold (`FEEDBACK_START_AFTER_MS`,
   250 ms), so a fast command adds nothing to a hook log, a CI log or a scripted
   pipe — and it always reports its duration when it *did* announce. A command
   that knows it is long-running calls `stage()`, which flushes the same start
   line immediately.
3. **`--quiet` still writes nothing.** The hook spelling `doc --sync --quiet`
   stays silent on success: quiet mutes the regular tier. An explicitly requested
   `--debug` / `--profile` is a deliberate diagnostic request and still speaks.
4. **No environment sniffing.** The channel never asks whether stderr is a
   terminal. Environment-dependent output is untestable and is the defect class
   the deterministic gates in this repository refuse.
5. **No new dependency.** `node:fs` and `node:process` only.

## What a command must do

A command that finishes quickly needs **nothing**: the bin's universal attachment
already reports its start (past the threshold) and its exit with the duration.

A command that spends real time in named stages adopts the channel:

```js
import { createFeedback } from "../src/feedback/index.mjs";

const feedback = createFeedback({ tier, subject: "agentic-workflow <command>" });

// The process-wide attachment, once, before dispatch.
feedback.attach();

// A named stage: the channel times it for the profile table.
const rows = await feedback.stage("scan", () => scanEverything());

// One unit down, a known total: the regular tier throttles, `--debug` does not.
await feedback.stage("embed", () =>
  embedAll(rows, {
    onProgress: (done, total, path) => feedback.progress({ done, total, unit: "files", detail: path }),
  }),
);

feedback.detail(`provider=${provider ? "configured" : "none"}`);
feedback.done(`${rows.length} files · ${embedded} embedded`); // the closing line
```

Rules that bind the author of the next command:

- **One channel**: `createFeedback` is defined once, in the crate module. A
  second progress convention — a hand-rolled `process.stderr.write` for progress,
  a private timer, a `console.log` on stdout — is the drift this page exists to
  prevent.
- **One attachment**: the bin attaches the process-wide channel exactly once. A
  subcommand never registers its own exit hook.
- **Stages are the channel's**: a hand-measured `performance.now()` pair belongs
  in `feedback.stage(name, fn)`, which is what makes the profile table real.
- **stdout is not a diagnostics stream**: not one byte of progress goes to fd 1.
- **A repo-own `scripts/` CLI** imports the same module by relative path
  (`../packages/agentic-workflow/src/feedback/index.mjs`), the way
  `scripts/session-close.mjs` and `scripts/shared-doc-merge.mjs` already import
  crate source. The mechanism is not duplicated there: #352 moved the runtime
  commands into the crate, so a copy under `scripts/` would be an orphan the day
  its neighbours retire.

## Why the home is the crate, not `scripts/`

Issue [#424](https://github.com/gtrabanco/agentic-workflow/issues/424) asked for
`scripts/feedback.mjs`; its own triage note (2026-11-08) recorded the collision
with [#352](https://github.com/gtrabanco/agentic-workflow/issues/352), which
deleted the repo's runtime scripts into the crate. The mechanism therefore lives
in the crate, which is what makes it travel with the `agentic-workflow` bin to
every project that installs it — a target project gets the flags and the lines
without a clone of this repository.

The tier vocabulary is a normative surface: `AGENTS.md`'s
`normative-surfaces@1` binds `FEEDBACK_TIERS` through its `schema-export:` row, so
the flags the prose offers and the values the module accepts cannot drift apart.
