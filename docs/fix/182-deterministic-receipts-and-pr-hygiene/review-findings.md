# Review findings — fix/182-deterministic-receipts-and-pr-hygiene

Fold ledger (`review-change:finding-rows` + `review-change:finding-mark` +
`review-change:review-mark`). Reviewer appends; only `fold-findings` flips
`folded` to `yes`. Ledger severity uses the finder scale
(`critical`→`high`, `major`→`med`, `minor`→`low`); `low` findings are
report-only and never enter this ledger.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/audit-pr/SKILL.md:46-48 | code | med | fix-now | fold into the unit's close-out | no |
| F2 | scripts/audit-pr-gate.mjs:197-200 | code | med | fix-now | fold into the unit's close-out | no |
| F3 | docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md:36 | workflow | med | replan-in-unit | /review-plan fix-182 at the merged head, then continue | no |
| F4 | packages/pi-agentic-workflow/src/extension/index.ts:137 | perf | med | fix-now | fold into the unit's close-out | no |
| VF-1 | skills/audit-pr/SKILL.md:46-48 · reviewer review-change · HEAD 819047ac093124bf9608d0245cb7dd473de1ddae · recheck direct read of the box text (still `gh pr comment --body-file`) against `references/03_AUDIT_PROCESS.md:49` (`audit-pr-gate.mjs comment`), plus `grep -c "audit-pr-gate.mjs hygiene" skills/audit-pr/SKILL.md` → 1 (blind to the comment box) | code | confirmed | finding-mark | n/a | n/a |
| VF-2 | scripts/audit-pr-gate.mjs:197-200 · reviewer review-change · HEAD 819047ac093124bf9608d0245cb7dd473de1ddae · recheck reproducible command: on a branch with no `@{upstream}` and one commit not on the remote, `node scripts/audit-pr-gate.mjs hygiene` prints `"branch-pushed": "pass"` and exits 0 while `git rev-list --count @{upstream}..HEAD` exits 128 | code | confirmed | finding-mark | n/a | n/a |
| VF-3 | docs/fix/182-deterministic-receipts-and-pr-hygiene/progress.md:36 · reviewer review-change · HEAD 819047ac093124bf9608d0245cb7dd473de1ddae · recheck reproducible command: `node scripts/pre-execution-snapshot.mjs verify --stage plan --unit fix-182 --dir docs/fix/182-deterministic-receipts-and-pr-hygiene --unit-kind fix` → exit 4, `current:false`, `digestMatches:false`, `structural.reasonCode:"stale-context"` (`CLAUDE.md` blob `9172532c` → `4eed9a3a`, moved by the `e2a42683` main-sync merge) | workflow | confirmed | finding-mark | n/a | n/a |
| VF-4 | packages/pi-agentic-workflow/src/extension/index.ts:137 · reviewer review-change · HEAD 819047ac093124bf9608d0245cb7dd473de1ddae · recheck direct read: `spawnSync("git", ["status","--porcelain"], {cwd, encoding})` runs inside the `agent_settled` handler with no `timeout`, and the adjacent comment "This never blocks" is false | perf | confirmed | finding-mark | n/a | n/a |
| REVIEW-RAN | HEAD 819047ac093124bf9608d0245cb7dd473de1ddae | n/a | n/a | review-mark | n/a | n/a |
