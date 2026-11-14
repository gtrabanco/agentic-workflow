# 424 — cli-feedback-tiers · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

The new suite is a protected path (`**/*.test.*`, `freeze: true`). The single row
below is an *expansion*: the file is created, so no pre-existing assertion can be
deleted, relaxed or narrowed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/feedback.test.mjs | P2 | 2026-11-14 | direct application (owner apply order §2) | the feedback channel's own corpus is created as the red commit, before the module exists; it writes only throwaway `mktemp -d` fixtures and never touches a pre-existing suite
```

## Decisions

- **D1** (2026-11-14) — **The `## Triaged steps` block is this unit's own
  declared list.** `unit-route --triage` answers for a registered lane unit;
  this unit was never opened through the lane, and the owner's apply order §5
  substitutes this ledger freeze for the lane's plan step. The step list is
  frozen in the SPEC at the cut.

- **D2** (2026-11-14) — **The mechanism's home is the runner crate (S8), not the
  repo's `scripts/`.** `packages/agentic-workflow/src/feedback/` is what
  `AGENTS.md` points at. Rationale: #352 (closed) migrated the runtime commands
  and sensors into the crate and left `scripts/` as repo-own dev/CI checks, so a
  `scripts/feedback.mjs` would be an orphan the day a repo script retires — the
  exact collision the issue's own triage note names. The relative-import path
  stays open for repo scripts (`scripts/session-close.mjs` and
  `scripts/shared-doc-merge.mjs` already import crate source that way), so no
  second implementation is ever needed.

- **D3** (2026-11-14) — **The regular tier is quiet until it matters.** The
  universal attachment in the bin defers its `start` line to a threshold
  (250 ms) instead of printing it unconditionally, so a fast command adds nothing
  to a hook log, a CI log or a scripted pipe, while a command that would feel
  frozen announces itself inside a quarter second and always reports its
  duration when it ends. The issue scopes the failure to commands that take
  ">1s", so this is the intent read faithfully, not a relaxation of it. A
  deep-adopted command (`doc`) announces itself immediately because it knows it
  is long-running.

- **D4** (2026-11-14) — **`--profile` outranks `--debug`, and a tier flag is not
  a new failure state.** Both flags are consumed in one pass before dispatch; a
  run carrying both is profiled (the superset) instead of refused, because the
  issue asks for three tiers, not for a fourth refusal vocabulary, and a refusal
  vocabulary published without a consumer is the class of surface this
  repository's drift gate calls an orphan.

- **D5** (2026-11-14) — **No config key, no schema change, no TTY detection.**
  The tiers are flags (the config policy's first question decides that a flag is
  not config), the envelope gains nothing (S7), and the channel never asks
  whether stderr is a terminal — an output that depends on the environment is the
  class of defect the deterministic gates in this repository refuse.

- **D6** (2026-11-14) — **`must-name: no` on the new normative row.** The row
  publishes `FEEDBACK_TIERS` through `schema-export:`, which is what satisfies
  the gate's `unpublished-vocabulary` direction; marking it `must-name: yes`
  would additionally force `feedback-tier` into the enumerated closed set that
  `scripts/normative-drift.test.mjs` asserts as an exact sorted list — editing a
  pre-existing assertion for no gain. The vocabulary is published and bound; the
  second direction stays exactly as it was.
