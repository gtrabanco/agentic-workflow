# Planning Evidence — fix/318-class-escalation-forward-closure

> One row per Engineering claim the change rests on. `authority-kind`: `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` | `not-applicable`.

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | fold-findings already groups findings by root cause; class escalation extends this by checking mechanism+axis overlap across folds | fold-findings/SKILL.md Step 0: "Queue the carrier's open rows — Group by root cause, verifier and rollback boundary" | current | O1, O20 |
| PE-002 | known | execute-phase already writes Evidence rows with command → exit/digest → output → verified-by per the turn contract | execute-phase/SKILL.md Turn contract: "Evidence rows updated (command → exit/digest → output → verified-by)" | current | O5, O21 |
| PE-003 | known | audit-pr already verifies receipt currency; extending to evidence-link check is additive | audit-pr/SKILL.md: "Consumes the current review-change REVIEW-PASS receipt instead of re-running review axes; posts a SHA-bound ready comment" | current | O9, O22 |
| PE-004 | known | #303 (investigate/orient/ask) already mandates source-cited design/plan claims at design time | Issue #303 (merged) | current | O3, O15 |
| PE-005 | known | feature 30 already ships `RE-REVIEW-OPTIONAL/SKIPPED` branch for docs-only changes | Issue #318 comment 2: "The `RE-REVIEW-OPTIONAL/SKIPPED` branch shipped in feature 30 was never taken once" | current | O18, O24 |
| PE-006 | known | unit-route.mjs already reads triage, routes, and computes open/phase/done states; printing review cycles count is additive | scripts/unit-route.mjs: `open-rows: 0 · route: close-out` pattern in existing output | current | O11, O25 |
| PE-007 | known | LOGS.md is append-only per the session log skill; adding an "append-only" rule to the SPEC is prose-only, no code change needed | skills/log-session/SKILL.md: model writes conversational summary to memory, not the tree | current | O27 |
| PE-008 | known | verification-contract already defines what acceptance criteria are; requiring a demonstrating command per AC is additive | verification-contract/SKILL.md: "the unit doc's `## Acceptance criteria` section as the canonical acceptance source" | current | O6, O23 |
| PE-009 | assumption | design-feature skill exists and can gain a "retirements" checklist item | skills/design-feature/SKILL.md referenced in issue; exists in repo | current | O4, O16 |
| PE-010 | assumption | review-code skill can gain an "is deleting the surface the complete fix?" checklist item | review-code/SKILL.md is part of the review pack | current | O17, O28 |
| PE-011 | assumption | review-debt skill can route scheduled deletions via TRIGGER field | review-debt/SKILL.md is part of the review pack | current | O29 |
| PE-012 | unknown | The PR template (.github/PULL_REQUEST_TEMPLATE.md) can be extended with a generated-render section using the unit doc's acceptance criteria and Evidence rows | No existing PR template in repo; may be project-level | unknown: needs template inventory check | O7, O10, O22 |
| PE-013 | known | review-verify already runs verification commands; shifting to "auditor of recorded evidence" (re-run sample) is a scope reduction, not addition | review-verify/SKILL.md: "Runs the project's gate and the changed behavior for real" | current | O8, O23 |
| PE-014 | known | The golden fixture test validates both grammar shapes; adding new fixture data for the claim-evidence loop table is additive | scripts/golden-fixture.test.mjs: "asserts the golden fixture's deterministic half" | current | O2, O20 |
| PE-015 | assumption | A test-route map (path-glob → minimal sufficient suite) can be committed as a JSON or YAML file in scripts/ | No existing map in repo; new normative surface | unknown: needs file inventory | O12, O26 |
| PE-016 | assumption | Per-file review state can be stored as review-state.json per unit, single writer = script | No existing review-state.json; new artifact | unknown: needs new file | O30 |
| PE-017 | known | The issue's frozen failure evidence (unit 79 F49→F50→F51, 11 cycles) is reproducible via git log — the hand-tallied figure class is a known reproducer | Git history: a1bb6dd5, 6f471c54, dff48f88 etc. show the 11-cycle sequence with hand-mistyped delta figures | current | O2, O20 |
| PE-018 | known | The two-cycle cap exists and is a backstop; class escalation makes cycle 1 wide instead of cycle N late | Issue #318 non-goals: "Not a replacement for the two-cycle cap — the cap stays" | current | O20, O31 |

## Verification

- All `known` rows verified by reading the cited source at the time of cut.
- `assumption` rows flagged with owner TBD at plan time.
- `unknown` rows require inventory check before P1 implementation.