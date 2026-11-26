# 729 — workflow-doctor-hermetic-battery · decisions

Each row is an owner decision this unit's plan rests on (`decision-scope@1`).
Every row here is `unit-only`.

| id | decision | scope | ground |
|---|---|---|---|
| D1 | The fix is **option A only**: hermetic scenario `env` in the three ambient test cases. The battery runtime's declared-over-discovered precedence and the pi package's env publication stay untouched, and the installed tree's missing literal launcher pin stays in #703's domain — none of them is reopened to make a test pass. | unit-only | owner order 2026-11-25 verbatim (`SPEC.md` `## Log` L2); `## Non-goals`; `IR3` (the assertions never move) |
| D2 | The unit follows the standard lane flow: the computed tier is `high`, so the full `review-change` pass runs on this branch — no inline-workflow override exists for this unit (unlike #698's owner order). | unit-only | `## Risk tier` (computed `high`, ceremony `unit-doc+review-change`) |

| D3 | The owner confirmed the **minimal plan re-cut of AC2** (F1's repair): AC2 embeds its demonstrating command — the O3 validator's own `git diff … | rg '^-[^-]' | rg 'assert'` — and the claim text stays otherwise intact; F1 then closes through its fold and the review re-judges at cycle 2. The full `/unit-lane --fix 729` replan machinery was the documented alternative and was not chosen. | unit-only | ask_user answer 2026-11-26 (`selected minimal-recut`) over the review's `route: replan`; `SPEC.md` F1 + its V/R/G lines |

| D4 | F1 closes as **REPLANNED IN UNIT**: the delivered row leaves `## Findings` and becomes a `## Log` `F` line citing the re-cut and its confirmation — never folded (its `replan-in-unit` class freezes the fold batch, FOLD_PROCESS §7). Grounds: the fold's own `FOLD_POLICY` routes an already-fixed finding to a user decision (the decision predates the fold: D3), the review's own route description prescribes exactly this closure (\"planning author re-cuts AC2 with user confirmation, review re-judges\"), and the migrated-unit precedent is fix-319's F4/F5 (\"recorded as replanned-in-unit … never folded\", row left the table). The freeze's consumer chain (user confirms → plan → review gate) is satisfied up to its last link — cycle 2 is that gate. | unit-only | D3 + ask_user answer 2026-11-26; `skills/fold-findings/references/FOLD_POLICY.md` (already-fixed → dispute); `docs/fix/319-location-index-consolidation/SPEC.md` F4/F5 + V7 |

## Open questions

None. The one open product question — the installed pi tree's missing literal
launcher pin — is #703's declared domain (`SPEC.md` `## Non-goals`), not an open
question of this unit.
