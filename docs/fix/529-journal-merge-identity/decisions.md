# 529 — decisions

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | **/packages/agentic-workflow/test/journal.test.mjs | P2 | 2026-11-13 | execute-phase | the race fixture's merge spawn is the defect site — it is the only git invocation in the crate's suite that passes no identity, so it reads the operator's/runner's git config; the edit adds the fixture `-c` identity to that spawn and changes no assertion
```

## D1 — the fix is the spawn, not the runner

**Decision:** the merge carries the fixture identity (`GIT_CONFIG`, exported from
`test/fixtures.mjs`), exactly as every other fixture invocation does.

**Why:** two alternatives were rejected on evidence.

- **`git config --global` in `publish.yml`.** It makes the suite pass by giving
  the runner an identity, which hides the next ambient-identity dependency
  instead of removing this one. Issue #514 S7 already committed this repository
  to the opposite rule (no suite reads the operator's identity), and a workflow
  step that manufactures one on the runner is the same leak with a shorter
  half-life.
- **`git config --local` inside the throwaway repo.** It puts the value in a
  config file, which is what #514's `git-config-writes.mjs` gate exists to keep
  out of test carriers; a fixture resolution failure is exactly how `t
  <t@example.test>` reached 139 commits on `origin/main`.

`-c` per invocation has no second target: the value exists for that one process.
Exporting the list keeps one definition for the suite's direct spawns instead of
restating three flags at each call site.

**Cost:** none at runtime — the flags are the ones the throwing `git()` helper
already passed to every other fixture invocation.
