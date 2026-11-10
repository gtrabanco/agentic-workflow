# Decisions — fix/434-tier-fused-design-plan

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/activity-fusion.test.mjs | P2 | 2026-11-10 | execute-phase | The red suite's own expectation is repaired before the rule it pins could pass for the wrong reason: the standard-tier fixture feature is scope `medium`, so the catalog's closed rule (release applies to feature medium/large/xlarge) includes `release` in the unfolded step list — the pinned rule (the additive `Fused:` line and the unchanged formatting of the other lines) is untouched, and no assertion is relaxed or deleted.
```
