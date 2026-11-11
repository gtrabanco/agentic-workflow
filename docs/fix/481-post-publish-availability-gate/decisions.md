# Decisions — fix/481-post-publish-availability-gate

## Path-protection records

`**/*.test.*` is a protected path, so the red-first suite and the publish.yml
contract extension carry the justification the checkpoint gate reads. Both are
new test surfaces for this unit: no existing assertion is relaxed, deleted or
skipped.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/npm-availability-wait.test.mjs | P2 | 2026-11-12 | execute-phase | New red-first sibling suite for scripts/npm-availability-wait.mjs (issue #481): the frozen-failure corpus for the 2026-11-09 tarball-404 window plus the script contract; created before its implementation, never edited to pass
justification | scripts/release-workflows.test.mjs | P2 | 2026-11-12 | execute-phase | Extends the existing publish.yml contract with the new wait-step placement assertions (cut-prerelease and each *-publish job); the existing assertions stay verbatim
```
