# Decisions — fix/358-adversarial-kill-mandate

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/adversarial-verdict.test.mjs | P3 | 2026-11-04 | execute-phase | External-verify advisory fold: the grounding walk accepted a hunk whose content line starts with `++ ` as a file header, so a real added line stopped being grounded (false `ungrounded-keep`). The suite gains the failing case first; no existing assertion is relaxed, the refusal vocabulary and the fixtures' expectations stay byte-identical.
justification | scripts/adversarial-verdict.mjs | P3 | 2026-11-04 | execute-phase | External-verify advisory fold: `changedLines` is bounded by the hunk's declared extents (`@@ -a,b +c,d @@`) instead of scanning for `+++ `/`--- ` prefixes, so content that looks like a header cannot end a hunk; the fixed output block, the exit codes and every fixture result are unchanged.
```
