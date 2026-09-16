# Review findings — 52-machine-checked-turn-contract

Fix-now fold ledger for the unit's review cycles. Rows are appended by
`review-change` only; only `fold-findings` flips `folded` to `yes`.

```text
review-findings@1
id | file:line | axis | severity | class | route | folded
F1 | packages/agentic-workflow/bin/turn-contract.mjs:128 + template/.agentic-workflow/hooks/turn-contract.sh:89 | code | high | fix-now | fold | no
F2 | scripts/turn-contract-grammar.test.mjs:4-6 | code | med | fix-now | fold | no
F4 | packages/agentic-workflow/bin/turn-contract.mjs:4 | security | med | fix-now | fold | no
VF-1 | packages/agentic-workflow/bin/turn-contract.mjs:128 · reviewer review-change · HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 · recheck failing reproducer: /tmp fixture repo (feat/x, 1 commit, unit-shaped docs/features/x, dirty untracked file), corrupt `.git/index` → `git status --porcelain` exit 128 while `rev-parse --show-toplevel`/`rev-list --count` exit 0 → engine prints `TURN-CONTRACT ok` exit 0; control with working index → `TURN-CONTRACT fail box5: dirty-tree` exit 1; secondary trigger by code read: execFileSync default maxBuffer 1 MiB → oversize porcelain lands in the same {ok:false} path | code | confirmed | finding-mark | n/a | n/a
VF-2 | scripts/turn-contract-grammar.test.mjs:4 · reviewer review-change · HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 · recheck direct read: header comment "runs the shared fixture matrix through BOTH engines" vs the single test loop (:105-109) whose only call site is `assertConforms("engine", ctx.runEngine(…))` — the shim is never invoked in this file | code | confirmed | finding-mark | n/a | n/a
VF-3 | packages/agentic-workflow/bin/turn-contract.mjs:4 · reviewer review-change · HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 · recheck direct read: header comment "read-only" vs box2 engine-only clause spawnSync of the working tree's `scripts/phase-lint.mjs` (:89-96, cwd=root, runs before box5's clean-tree check); suite no-mutation case (turn-contract.engine.test.mjs:55) runs without phase-lint present | security | confirmed | finding-mark | n/a | n/a
REVIEW-RAN | HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 | n/a | n/a | review-mark | n/a | n/a
```

Cycle 1 (first review; no prior marks or forge receipts). Refuted candidates
are reported in the review's chat report only — they never become rows.
