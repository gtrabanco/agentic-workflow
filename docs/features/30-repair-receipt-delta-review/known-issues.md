# known-issues — 30-repair-receipt-delta-review

No unresolved product or engineering decision blocks implementation.

## Known boundaries to preserve

1. **AC-10's `packages/` clause vs the integration row (E-D5).** The SPEC's
   AC-10 says "the PR diff contains no file under `packages/`" while the
   integration-closure row requires re-syncing the Pi mirror's bundled copies
   (`packages/pi-agentic-workflow`). The Engineering interpretation (recorded
   in `decisions.md` E-D5, frozen into ACCEPTANCE.md AC-10's validator):
   AC-10 guards `audit-pr` + `packages/agentic-workflow-schema`; the Pi mirror
   re-bundle through `bundle:skills` is expected. `review-plan` must confirm
   this reading or amend.
2. **Escalation numbers are a first calibration (D30-5).** ±50 lines / 200
   lines / 15 files are user-accepted first values; a review may revise them
   with evidence. They are pinned as literals — changing them is a SPEC
   amendment, not a tweak.
3. **The receipt is printed output, not durable state (D30-3).** An outer
   driver that wants a durable copy must persist the printed text itself; no
   ledger row, schema field, or file is written for it.
4. **Docs-only is judged on the fold diff's file set (E-D3).** A docs batch
   whose fold diff touches a non-doc file is behavioral by definition and
   requires delta re-review — no severity reclassification happens to reach
   the skip branch.
5. **SKIPPED is a recorded consumer decision (E-D2).** `fold-findings` emits
   `RE-REVIEW-OPTIONAL`; only a turn carrying an explicit prior skip decision
   prints `RE-REVIEW-SKIPPED`. The unattended default is always re-review.
6. **Empty-batch class `none` (E-D1)** is a third value beside the SPEC's two
   class states (`all-repair-in-place` / `frozen (replan present)`) —
   necessary because IS-1 requires the receipt on an empty batch, where
   neither state holds.
7. **Budget headroom.** The three bumped skills must stay inside their
   declared budgets; if growth is required, it is declared in
   `SKILL_CONTEXT_BUDGETS.json` with a source (feature 30) — never silent
   overshoot (#176 tracks the broader slim-down separately).
8. **fix-179 lands after this feature.** Its plan (branch
   `fix/179-declared-ledger-delta-receipts`) declares dependencies on 30/31/32;
   executing it before 30 merges would be blocked by the dependency gate.
