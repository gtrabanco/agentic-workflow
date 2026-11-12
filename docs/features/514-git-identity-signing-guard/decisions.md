# Decisions — 514 git-identity-signing-guard

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/git-config-writes.test.mjs | P11 | 2026-11-12 | execute-phase | The external-verify correction batch's frozen-failure corpus (blockers 1 and 2) lands as one regression test in the gate's own suite — the three quote-in-regex poison shapes the tokenizer used to swallow plus the write that must still be found on the following line; it is added red, observed failing before the fix, and no existing assertion is relaxed, narrowed or deleted.
justification | scripts/review-receipt.test.mjs,scripts/audit-pr-receipt.test.mjs,packages/agentic-workflow/test/doc.envelope.test.mjs | P11 | 2026-11-12 | execute-phase | External-verify blocker 2: these are the last three carriers that write git configuration (12 writes, all inside the S7/S9 scope); the correction migrates them to per-invocation `-c` identity in this unit's established shape — the `git config` lines are removed and each commit (or the fixture helper) carries the `-c` triple with the same fixture identity values, deleting no assertion and changing no observed behaviour.
```

`P11` is the external-verify correction batch phase defined by the `D8` line in
[`SPEC.md`](SPEC.md)'s `## Log`. The unit declares no `path-protection-plan@1`
block, so `freezeStateFor` evaluates every phase `pre-freeze` (justification,
never approval) — `packages/agentic-workflow/src/path-policy.mjs:476`.
