---
"@gtrabanco/agentic-workflow": minor
---

feat(feedback): every CLI reports through one channel with three tiers (issue #424)

The bin's subcommands worked silently, so a run that took a while could not be
told apart from a frozen machine — `doc --sync` was the worst case: it scans,
embeds and indexes with not one byte on any stream until it ends.

One channel now reports for every subcommand (`src/feedback/index.mjs`), with
three cumulative tiers and one attachment in the bin, so a command that adds
nothing still reports that it started and how long it took:

- **regular** (no flag) — `start` once the run is still working at the threshold
  (250 ms), `stage`, `progress` with a remaining estimate, and `done` with the
  duration. A command that finishes under the threshold stays silent, so a hook,
  a CI log or a scripted pipe gains nothing.
- **`--debug`** — one line per unit of work, each stage's own cost, and the
  command's provider/detail lines.
- **`--profile`** — the debug lines plus a per-stage table (milliseconds, share,
  total, named bottleneck).

Every line goes to **stderr**. stdout and the envelope stay the machine receipt:
no schema value moves, `--json-only` still emits exactly one JSON document, and
`--quiet` still writes nothing on a successful `doc --sync`. `--profile` outranks
`--debug`; neither is a refusal state.

`doc`'s engines adopt the channel (`syncIndex` gains `onProgress`, `runDocOp`
wraps its three stages), and the rule that binds future commands is stated in
`AGENTS.md` with its contract owned by `docs/workflow/FEEDBACK.md`.
