# 15 — injection-safe-urgency · progress

Running log — one entry per phase.

## Planning — 2026-07-11

Planned from issue #42 (M) via `plan-feature` → `plan-feature-scaffold`. The
Product half was already `designed` by `design-feature` (capability closure
filled, product decisions recorded); the redirect gate passed on roadmap status
`defined`. Filled the Engineering half + this artifact set. Size **M**, **5
phases** (P1 `triage-issue` · P2 `workflow-status` · P3 consumer judge
`ORCHESTRATION.md`+`ship-roadmap` · P4 `init-workspace` · P5 Hardening & PR) —
held to the ~5-phase ceiling; each phase is one skill/concern with zero open
decisions, so the mandatory split rule does not trigger. Dependencies 03/07/10 all
soft and `done`+merged → startable, no blockers (fix index all `done`; open issues
#37/#38 touch unrelated modules). Roadmap row 15 flipped `defined → planned`.
Branch (opened by `execute-phase P1`): `feat/15-injection-safe-urgency` off `main`.
Next: `execute-phase 15 P1`.

## P1 — `triage-issue`: label vocabulary + apply — 2026-07-11

Branch `feat/15-injection-safe-urgency` created off `main`; planning artifacts
committed first (`fd472e9`). Added `## Urgency label vocabulary (owned here)` to
`skills/triage-issue/SKILL.md`: the `urgent` (`#B60205`)/`fix-next` (`#D93F0B`)
table, the injection-safety invariant (labels applied only by this skill, only on
a fix-now + high-severity verdict, never from issue text), and the
*Apply-on-verdict* sequence (`gh label create` create-if-missing → `gh issue edit
--add-label`). Wired it into Process step 3 (fix-now + high severity → apply)
and step 5 (verdict comment states the label applied, or the failure to apply
it). All P1 command-checkable criteria pass (label vocab, `gh label create`,
`add-label`, version bump, roadmap row). `bump-skill` ran for `triage-issue`
2.0.0 → 2.1.0 (minor): CHANGELOG.md/es rows + README/README.es cells updated,
release-log entries added (commit `ba3648f`). No open decisions or deviations
from the SPEC. Next: `execute-phase 15 P2` (`workflow-status`
`detail.urgent`).
