# Decisions — agents-md-single-agent-guide

> **Provenance / convention deviation.** This folder has no issue-numbered slug
> and no row in `docs/fix/README.md`, because every fix in this repository is
> expected to carry a tracked forge issue and none exists for this change: it
> was requested directly by the repository owner in-session. The folder exists
> to hold the `path-protection-records@1` justification the policy requires
> before a frozen test may be modified. File the issue, rename the folder to
> `<issue>-agents-md-single-agent-guide`, and add the index row to close the gap.

## D1 — `AGENTS.md` is the single agent guide; `CLAUDE.md` is removed

**Decision.** The agent guide lives in exactly one file per repository, named
`AGENTS.md`. `CLAUDE.md` is deleted from this repository and from the template
scaffold, and `init-workspace` stops writing it.

**Why.** Two files carrying the same guidance is a duplicated source of truth.
The copy nobody reads is the copy that gets edited, and edits there are silently
lost. Current Claude Code releases read `AGENTS.md`, so the second name buys
nothing.

**Consequence for older agents.** Claude Code releases that only read
`CLAUDE.md` will not see the guide. `init-workspace` therefore removes a legacy
`CLAUDE.md` in a target project **only with explicit user consent**, and only
after folding any content unique to it into `AGENTS.md` — a user on an older
release may legitimately choose to keep it.

## D2 — Frozen tests are updated rather than left pointing at a deleted file

The guide's filename is not decoration inside the test suite: the drift gate
resolves the guide to read the normalizer inventory and the normative-surfaces
table from it, the golden-fixture and pre-execution suites build temporary
projects whose `project-guide` context row names it, and two comment-only
references in the packages name it as the source of the "bun is the sole
lockfile" rule. Leaving them pointing at a deleted path would fail the root
suite, so they are updated in the same change and recorded here.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/normative-drift.test.mjs, scripts/pre-execution-quality.test.mjs, scripts/review-loop-discipline.test.mjs, scripts/golden-fixture.test.mjs, scripts/turn-contract-grammar.test.mjs, scripts/continuation-discipline.test.mjs, scripts/pre-execution-timeline.test.mjs, scripts/pre-execution-sensor.test.mjs, packages/pi-agentic-workflow/test/alias-coverage.test.mjs, packages/pi-agentic-workflow/test/lockfile-policy.test.mjs, packages/agentic-workflow-schema/test/verification-gates.test.mjs, packages/agentic-workflow-schema/test/lockfile-policy.test.mjs | P1 | 2026-09-21 | execute-phase | The agent guide is renamed to AGENTS.md and CLAUDE.md is deleted (D1); these tests resolve the guide by filename, so the expectation moves with the file. No assertion is relaxed, removed, or re-pointed at a weaker surface: only the guide's path changes, plus comment-only references.
```

## D3 — The change is not complete until the guide is referenced by one name

Every live reference to `CLAUDE.md` — the root suite, the two package suites'
comments, the workflow docs, the issue template, the skill prose, the READMEs —
is updated in the same change. Historical records (`CHANGELOG.md`, `docs/LOGS.md`,
merged feature/fix SPECs and ledgers) are intentionally left as written: they
describe what was true when they were authored, and rewriting them would falsify
the record rather than fix anything.
