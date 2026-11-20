# 2026-11-20-issue-663-skill-surface-diagnosis

```text
passive-record@1
id | `2026-11-20-issue-663-skill-surface-diagnosis` | the passive unit's stable id
tier | passive | the verdict as the classifier emitted it
paths | `docs/research/2026-11-20-issue-663-skill-surface-diagnosis.md`, `docs/fix/646-docs-skills-reconciliation/second-read.md` | the readback's own scope
readback | both files read in full as written; prose only, nothing a runtime executes. Gate disclosure: the node-runtime gate is red on main independent of this change — scripts/session-close.test.mjs 'a leftover file is named' fails under node only (scripts/session-close.mjs dispatches process.exit(main(...)) while close() sets process.exitCode and returns undefined; node exits 0, bun honors the set exitCode). Introduced by #553 at tip fc17d9661; recorded for the owner, not repaired in this prose unit. phase-lint's parallel-worker timeout is the known load flake #291; this receipt is the serialized gate under the documented alternative runtime. | the structural readback: every changed file read and classified
gate | `bun scripts/run-root-suite.mjs --jobs 1` · exit 0 | the deterministic gate that ran beside it
```
