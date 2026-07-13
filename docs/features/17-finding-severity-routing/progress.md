# 17 — finding-severity-routing · progress

Running log — one entry per phase.

## Planning — 2026-07-13

Planned from issue #49 (M) via `plan-feature 17` → `plan-feature-scaffold`. The
Product half was already `designed` by `design-feature` (capability closure
filled, D1/D2 resolved); the redirect gate passed on roadmap status `defined`.
Filled the Engineering half + this artifact set. Size **M**, **5 phases** (P1
`review-change` ledger+persist · P2 `audit-pr` same ledger · P3 `execute-phase`
fold tick · P4 `workflow-status`+schema-package emit+mirror · P5 Hardening & PR) —
held to the ~5-phase ceiling; each phase is one skill/concern with zero open
decisions, so the mandatory split rule does not trigger. P4 groups the
`workflow-status` emit with its schema-package mirror because they are one
contract (the `findings.fix_now[]` item shape) that the repo's Verification rule
binds to the same PR.

Dependencies: none hard. Soft/related #37 (`docs/fix/37-bilingual-human-docs`,
merged) documents the manual fold ladder in prose — not a blocker either way, and
this feature does not edit its docs. Dependency & blocker check ran: no `Depends
on:` closure to walk; the fix index is all `done`/awaiting-merge and touches no
module this SPEC names; open issues are #49 (this feature) and #54
(`workflow-status` untriaged-issue detection — a different surface, not a fix-now
blocker on the modules here). No blockers → startable.

D3/D4 (drafting assumptions, flagged re-questionable) both **confirmed at
planning, unchanged** — recorded resolved in `decisions.md`, none left open.
Roadmap row 17 flipped `defined → planned`. Branch (opened by `execute-phase P1`):
`feat/17-finding-severity-routing` off `main`. Next: `execute-phase 17 P1`.
