# 539 — push-identity-range · decisions

Owner-scoped decisions and the path-protection escape records for this unit. The
records are append-only (`path-protection-records@1`, grammar owned by
`skills/orchestration-envelope/references/TURN_CONTRACT.md`); the declaration
they answer lives in [`SPEC.md`](SPEC.md) `## Path protection`.

## Path-protection escape records

The two frozen suites this unit appends to are protected paths (`**/*.test.*`,
`freeze: true`). Every row below is an *expansion* — no pre-existing assertion is
deleted, relaxed or narrowed.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/push-identity-check.test.mjs | P2 | 2026-11-14 | execute-phase | the identity guard's frozen corpus gains the issue's four cases (published-non-approved + new-approved → ok; new-non-approved → failed; published-approved + new-approved → ok; the merged-main shape) — every pre-existing case keeps its exact assertions and the fixture helper only gains a publish() ref writer
justification | scripts/log-immutability.test.mjs | P2 | 2026-11-14 | execute-phase | the journal gate's frozen corpus gains the issue's four cases (published hand-append skipped; a journal extending the published tip passes; a new hand-append still fails; a published fragment deletion is not blamed on a merge) — every pre-existing case keeps its exact assertions
justification | scripts/published-refs.test.mjs | P2 | 2026-11-14 | execute-phase | the new module's sibling suite is created by P2 as the red commit, before the module exists (red-first); it writes only throwaway `mktemp -d` repositories
```

## Decisions

- **D1** (2026-11-14) — one module owns the range policy
  (`scripts/published-refs.mjs`) instead of two copies of an ancestry filter:
  both gates need the same two answers, and the repository's "one owner per
  contract" rule refuses a second copy. The module ships its own sibling suite,
  red-first, because it is a new `scripts/<x>.mjs`.
- **D2** (2026-11-14) — the published set is the checkout's own refs, never a
  network call: the pre-push step is offline by the gate's contract, so a stale
  `origin/main` leaves a published commit judged (the conservative direction)
  and the repair is `git fetch`.
- **D3** (2026-11-14) — `log-immutability` keeps walking every commit in the
  range and skips only the identity *judgement* of published ones. Dropping
  published commits from the walk would lose the fragment-consumption
  attribution and make the merge-resolution half blame a merge for a deletion
  the aggregator already published.
- **D4** (2026-11-14) — no `roadmap_summary:` frontmatter: a fix row is
  hand-managed by contract, and the emitter's override would replace the row's
  Notes cell (with its SPEC link) with the summary alone. The row is written
  through `agentic-workflow roadmap fixrow` instead.
- **D5** (2026-11-14) — no `.changeset/` intent file: the change touches
  `scripts/` and `docs/` only — no package or skill source, which is what the
  changeset format declares (same call as `docs/fix/534-prose-gate-worktree-scan/decisions.md` D2).
