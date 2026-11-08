---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat: the journal carrier is aggregator-only at push level (issue #468)

The new offline `log-immutability` gate judges the push range: `docs/LOGS.md`
must be a byte-prefix extension of its base (append at EOF only), every
appended block must satisfy the crate's one entry-block predicate
(`contentFault`, now exported from `src/journal/fragment.mjs` — never a second
copy of the grammar), and every commit touching the journal or deleting/editing
a tracked fragment must carry the closed aggregator identity (committer
`journal-bot@users.noreply.github.com`, the forge bot identity, or
`GITHUB_ACTOR=github-actions[bot]` in CI). Additions to the carrier stay legal
for anyone — that door is the flow — and a working-tree half mirrors
`session-close close` before any commit can carry a violation. The fragment
writer refuses an explicit `--session` whose conversation already landed an
entry: `JOURNAL REFUSAL — … already registered …`, no byte written; writes
without `--session` are unchanged (the fallback slug is not a conversation
identity).
