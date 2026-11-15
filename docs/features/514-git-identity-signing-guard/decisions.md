# Decisions — 514 git-identity-signing-guard

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/git-config-writes.test.mjs | P11 | 2026-11-12 | execute-phase | The external-verify correction batch's frozen-failure corpus (blockers 1 and 2) lands as one regression test in the gate's own suite — the three quote-in-regex poison shapes the tokenizer used to swallow plus the write that must still be found on the following line; it is added red, observed failing before the fix, and no existing assertion is relaxed, narrowed or deleted.
justification | scripts/review-receipt.test.mjs,scripts/audit-pr-receipt.test.mjs,packages/agentic-workflow/test/doc.envelope.test.mjs | P11 | 2026-11-12 | execute-phase | External-verify blocker 2: these are the last three carriers that write git configuration (12 writes, all inside the S7/S9 scope); the correction migrates them to per-invocation `-c` identity in this unit's established shape — the `git config` lines are removed and each commit (or the fixture helper) carries the `-c` triple with the same fixture identity values, deleting no assertion and changing no observed behaviour.
justification | packages/agentic-workflow/test/edit.test.mjs | P12 | 2026-11-15 | execute-phase | The 2026-11-15 external-verify correction batch (blockers 1–3, L5) lands its duplicate-NN corpus in the roadmap writer's own suite — the collapse, reader-row `findRow` and annotate-target cases observed failing before the fix (red: 28 pass / 3 fail), plus the linkless-fixes-row case that pins the pre-existing foreign-header behaviour the scoped scan must keep — no existing assertion is relaxed, narrowed or deleted.
```

`P11` is the external-verify correction batch phase defined by the `D8` line in
[`SPEC.md`](SPEC.md)'s `## Log`; `P12` is the 2026-11-15 correction batch phase
defined by the `D10` line in the same Log. The unit declares no
`path-protection-plan@1` block, so `freezeStateFor` evaluates every phase
`pre-freeze` (justification, never approval) —
`packages/agentic-workflow/src/path-policy.mjs:476`.
