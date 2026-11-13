---
type: fix
scope: trivial
roadmap_summary: Issue [#529](https://github.com/gtrabanco/agentic-workflow/issues/529): the journal race fixture merged without the fixture identity, so the publish gate died with `empty ident name` on a CI runner that has no global `user.*` — the identity is now one exported `-c` list that every direct `git` spawn carries (issue #514 S7).
---

# fix/529-journal-merge-identity

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#529` — the publish gate is red on every run, so nothing reaches npm. The
quoted failure below is the whole report; the job log names the cause
(`Committer identity unknown`, `fatal: empty ident name (for <runner@…>)`), which
is a runner with no global git identity, not a journal or aggregator defect.

## Specs

**S1 — The journal race fixture merges under the fixture identity, not the runner's.**
> El CI de publicación (.github/workflows/publish.yml) de paquetes falla:
> https://github.com/gtrabanco/agentic-workflow/actions/runs/43335777199/job/131591455673
>
> 1 tests failed:
> (fail) two branches carrying fragments merge with zero conflicts and zero lost or duplicated entries [46.83ms]
> 658 pass / 1 fail

`packages/agentic-workflow/test/journal.test.mjs:227` spawned
`git -c commit.gpgsign=false -C <repo> merge …`. Every other fixture invocation
passes `-c user.name` / `-c user.email` / `-c commit.gpgsign=false`, which is the
`-c`-only convention issue #514 S7 made mandatory: no suite writes git config and
no suite reads the operator's. A developer box has a global `user.*`, so the
merge succeeded there; a CI runner has none, so it failed. A green that depends
on whose machine ran the suite is the defect, not the runner.

## Impact

- `packages/agentic-workflow/test/fixtures.mjs` — the identity list becomes
  `GIT_CONFIG`, exported beside the throwing `git()` helper that already used
  it, so a suite that spawns `git` directly reuses the same three flags instead
  of restating them.
- `packages/agentic-workflow/test/journal.test.mjs` — the race fixture's merge
  spawn uses it.
- Nothing else: the test's assertions are untouched, and the crate's runtime
  code does not read an identity anywhere (`src/journal/` runs read-only git).

## Retirements

- The one identity-less `git` spawn in the crate's suite: after this change
  `rg -n 'spawnSync\("git"' packages/agentic-workflow/test` reports no invocation
  without either `GIT_CONFIG` or its own `-c` identity flags.

## Non-goals

- **No assertion change.** The test still requires both merges to exit 0 and the
  aggregator to lose and duplicate nothing; only the environment the merge runs
  in changes.
- **No workflow-level `git config --global`.** Setting an identity on the runner
  would hide the next ambient-identity leak instead of removing this one, and it
  contradicts #514 S7's committed rule.
- **No config write in the fixture either** (no `git config --local` on the
  throwaway repo): the convention is `-c` per invocation, pinned repo-wide by
  `scripts/git-config-writes.mjs`.
- **No new gate.** The `-c` convention already has its carrier; a gate that
  demanded identity flags on every spawn is a different unit.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`.
  `bun scripts/ceremony.mjs tier classify` answers `standard` with
  `reason_kind: executable-content` over the changed path set (the two test
  carriers and this unit folder) — the earlier draft of this section guessed
  `passive`, and the measured verdict is what stands.
- **Named high-risk item** — none — not a high-tier unit.

## Future

- A suite-level assertion that every `spawnSync("git", …)` in a fixture carrier
  passes the identity would make this class impossible to reintroduce. It is a
  gate of its own (`git-config-writes.mjs` scans config writes, not missing
  identity), so it belongs to a future unit, not here.

## Future cost

- none — the change removes a dependency on ambient state; it adds no surface.

## Applicable tests

`cd packages/agentic-workflow && bun test test/journal.test.mjs` and the whole
crate gate `bun test test/` (the publish job's command), each run twice: with the
ambient git identity and with it removed
(`GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null HOME=$(mktemp -d)`).

## Known pre-existing issues

- `node --test scripts/roadmap-settle.test.mjs` fails on `main` before this
  branch with two `pr-url-unsettled` violations for
  `docs/fix/521-fix-config/SPEC.md` (its row still says `in-progress` while the
  doc carries PR #523). Unrelated to this fix — the same two violations answer
  from the unmodified checkout — and left alone rather than smuggled into a
  test-only unit.

## Tasks

- P1 — Record the ask and the decision (this document, `decisions.md` with the
  path-protection record for the test edit).
- P2 — Export `GIT_CONFIG` from `test/fixtures.mjs`; make the race fixture's
  merge spawn use it; regenerate the docs projection; run the crate gate in both
  identity conditions plus `bun scripts/git-config-writes.mjs`.

## Triaged steps

n/a — applied inline at the owner's request (the reported failure is the ask).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-13, the request, verbatim: the `publish.yml` gate fails with
  `two branches carrying fragments merge with zero conflicts and zero lost or
  duplicated entries [46.83ms]`, `658 pass / 1 fail`, on run
  `43335777199` job `131591455673`.
- **L2** — 2026-11-13, the job log read back: the failing assertion's message is
  `Committer identity unknown` / `fatal: empty ident name (for <runner@…>) not
  allowed` — a runner with no global git identity, not a journal or aggregator
  defect.
- **L3** — 2026-11-13, reproduced locally before touching anything: the same
  suite under `GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null
  HOME=$(mktemp -d)` answers `25 pass / 1 fail` with the identical `empty ident
  name` message, and `26 pass / 0 fail` with the ambient identity — the exact
  split CI hit.
- **P1** — `c079af93` (this unit's documents, the roadmap row, the regenerated
  projection), `039dbebf` (the exported `GIT_CONFIG` and the race merge's spawn).
- **E1** — 2026-11-13, `cd packages/agentic-workflow && bun test test/journal.test.mjs`
  with the ambient identity present · exit 0 · 26 pass / 0 fail.
- **E2** — 2026-11-13, the same command with the ambient identity removed
  (`GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null HOME=$(mktemp -d)`) ·
  exit 0 · 26 pass / 0 fail after the fix (it was 1 fail before it).
- **E3** — 2026-11-13, `cd packages/agentic-workflow && bun test test/` under the
  identity-less environment (the publish job's command) · exit 0 · full crate
  suite green, including `writer.merge`, the doc suites and the turn-contract
  parity matrix.
- **E4** — 2026-11-13, `bun scripts/git-config-writes.mjs` · exit 0 ·
  `verdict: PASS` (the convention this fix follows is still the pinned one).

## Next

[PR #530](https://github.com/gtrabanco/agentic-workflow/pull/530) awaits review and
merge; the publish gate re-runs afterwards.

## References

- Issue [#529](https://github.com/gtrabanco/agentic-workflow/issues/529) — the reported failure.
- Issue [#514](https://github.com/gtrabanco/agentic-workflow/issues/514) — the `-c`-only convention (S7) this fix applies.
- `docs/fix/405-journal-fragments/` — the unit that owns the race fixture.
- `scripts/git-config-writes.mjs` — the gate that pins the convention.

## Branch

`fix/529-journal-merge-identity`

## Depends on

none — `main` carries the fragment carrier (fix #405) and the identity convention (#514).

## Regression scope

- The race fixture itself (two fragments, two branches, back-to-back merges, the
  aggregator's newest-first append) — unchanged assertions, verified green.
- The rest of the crate's suite, whose fixtures share `test/fixtures.mjs`: the
  exported list is the same three flags the throwing helper already passed.
- The `-c`-only convention: `bun scripts/git-config-writes.mjs` stays `PASS`.
