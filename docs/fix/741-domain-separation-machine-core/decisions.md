# fix/741 — domain-separation machine core

> Local record carrier for the substrate-upgrade session's detector work
> (`scripts/domain-separation.test.mjs`). The descriptor SPEC for a full lane
> run is pending owner routing; this ledger records the path-protection
> decisions the session's writes already needed (owner consent: the scaffold
> route decision 2026-11-28 — "Build the machine check now").

## Decisions

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/domain-separation.test.mjs | P2 | 2026-11-28 | execute-phase | the suite this session created to materialize IR7's boundary machine core needed one correction before any freeze: its first draft flagged SKILL_CONTEXT_BUDGETS.json in template/.gitattributes, which re-read proved to be the writer-driver contract's product vocabulary (the merge-driver registry arms shared-merge classes for the target's own files), not source-repo identity — the rewrite removes the wrong rule, keeps the three held rules, and adds the scan-blind sanity test that made rg's hidden-file blindness visible; a test the tree never judged cannot be narrowed, so the fix repairs the detector's ruleset, not a failing assertion
```
