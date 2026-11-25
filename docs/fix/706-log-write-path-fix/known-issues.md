# 706 — log-write-path-fix · known issues

## K1 — the issue's step 3 does not reproduce as written

The issue says the pair `t <t@example.test>` exists in the tree only in
`template/.agentic-workflow/hooks/tests/test-git-identity-check.sh`. At
`2780f79a7`, `rg -l 't@example\.test' --hidden -g '!.git' .` finds 23 files,
including ten package suites (`doc.sync.test.mjs`, `doc.hybrid.test.mjs`,
`doc.embeddings.test.mjs`, `doc.query.test.mjs`, `feedback.test.mjs`, …). Those
suites pass the identity with `-c` per invocation, which is the sanctioned
convention (`git-config-writes.mjs`). The extra occurrences are not a leak; the
claim's word "only" is stale. Recorded, not dropped.

## K2 — the published-history claim has moved

At `2780f79a7`, `git log origin/main --format='%ae|%ce'` carries **0** commits
with `t@example.test`; the owner's earlier force-push repair removed them from
`origin/main`. The commits are still reachable from release tags
(`v5.0.0-canary.20261112.1`, …, 99 commits across all refs) and from
`git log --all`, which is what the issue's step 2 sees. This unit records the
state; it rewrites nothing (`S10`).

## K3 — P3 cannot coexist with a PASS `log-immutability` verdict

The gate's shape contract is a byte-prefix extension; the header reorder is a
rewrite. Measured: `logShapeViolations` returns
`log-rewritten — first difference at byte 19`. Once the header commit exists,
the range half also reports `log-hand-appended` for `39cecced4` because the
commit is not the aggregator identity. Both violations are the same authorized
header commit (D1). The issue's AC says the byte-prefix check must stay
unaffected, so the edit lands under the owner's one-time exception. Both reds
are reported in the `## Log` and the handoff; neither is a hidden failure.

## K4 — the owner's §7 lives outside this repository

The SPEC quotes the replacement sentence (D3) and records the owner-side action.
No repository commit can apply it, and this unit does not claim it did.

## K5 — `journal aggregate` has no filter by design

The aggregator consumes every pending fragment in the carrier; that is how the
merge-to-main job guarantees no fragment is lost. The defect was the local door,
not the filter. The product guard refuses the local door (D2); the no-filter
behaviour stays pinned by the suite.

## K6 — a concurrent session's worktree was stale (transient)

An intermediate gate run reported `.worktrees/feat-719-nan-embedding-default-index-tool`
(another session's branch) as `STALE`. That worktree was removed externally
between runs; the final gate at `546b9f5e0` no longer sees it. This unit touched
no worktree and pruned nothing.
