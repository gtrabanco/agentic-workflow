# Decisions — fix/434-tier-fused-design-plan

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/activity-fusion.test.mjs | P2 | 2026-11-10 | execute-phase | The red suite's own expectation is repaired before the rule it pins could pass for the wrong reason: the standard-tier fixture feature is scope `medium`, so the catalog's closed rule (release applies to feature medium/large/xlarge) includes `release` in the unfolded step list — the pinned rule (the additive `Fused:` line and the unchanged formatting of the other lines) is untouched, and no assertion is relaxed or deleted.
justification | skills/unit-lane/references/PLAN.md | P3 | 2026-11-10 | execute-phase | Issue #434's named surface: the `activity-fusion@1` block (the normative owner of the fused pass) and the delta-provenance amendment of Stages 1–3, with the superseded full re-run sentence deleted per replace-implies-delete; the #303/#432/#433 stage headings and provenance columns are untouched.
justification | skills/unit-lane/references/DESIGN.md | P3 | 2026-11-10 | execute-phase | One-line owner pointer to the `activity-fusion@1` block (the fused pass continues this stage's session into the plan's tasks); no rule restated here — the single-owner rule keeps the block in PLAN.md.
justification | skills/unit-lane/SKILL.md | P3 | 2026-11-10 | execute-phase | The conductor's step-contract paragraph: when the triage block carries the `Fused:` line the design and plan steps run as one pass in one conductor session (owner pointer to PLAN.md's block); turn-contract boxes and the closing block are untouched.
justification | AGENTS.md | P3 | 2026-11-10 | execute-phase | The `normative-surfaces@1` table gains the row the versioned `activity-fusion@1` block requires — the drift gate refuses an unregistered grammar block, so the row ships in the same commit as the block.
justification | docs/workflow/LANE_FLOW.md | P4 | 2026-11-10 | execute-phase | Documentation currency for the changed surface: the catalog-steps lifecycle notes the standard-tier fused pass and the triage block's additive `Fused:` line; the deterministic contract tables are untouched.
justification | docs/workflow/SKILLS.md | P4 | 2026-11-10 | execute-phase | Documentation currency: the `unit-lane` row notes the standard-tier fused pass; no narrative-surface reordering.
justification | docs/research/ATTRIBUTION.md | P4 | 2026-11-10 | execute-phase | The cite-sources clause (S9): one adoption row for the fused-activity/separated-accountability knowledge adopted by this change.
justification | docs/ROADMAP.md | P4 | 2026-11-10 | execute-phase | Row 434's status cell moves `idea` → `in-progress` (disclosed hand edit — the `\u00a7 Fixes` active row has no deterministic writer, the #429 E8 finding, PE-005-repeated-as-known-issue); every other cell preserved.
justification | docs/workflow/GOLDEN_FIXTURE.md | P5 | 2026-11-10 | execute-phase | The run-log gains the row the golden-fixture ritual demands for this executor-path wording change, with model availability disclosed per the file's own precedent rows.
justification | docs/fix/434-tier-fused-design-plan/SPEC.md | P5 | 2026-11-10 | execute-phase | Evidence and log rows appended in the declared shapes; the frozen sections (Specs, Acceptance criteria) are byte-stable.
```
