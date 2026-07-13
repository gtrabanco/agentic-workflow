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

## P1 — `review-change` ledger schema + persist — 2026-07-13

Branch `feat/17-finding-severity-routing` created off `main`. Commit `f405f08`
landed the planning artifact set first (SPEC, PLAN, TASKS, progress, testing,
known-issues, decisions, architecture-notes, the roadmap row, and the
`docs/LOGS.md` design-session entry), per P1's "commit planning artifacts
first" step.

Implementation: added process step 9 to `skills/review-change/SKILL.md`
("Persist fix-now findings to the fold ledger") between the existing step 8
(triage everything not fixed now) and the report step (renumbered 9 → 10, old
10 → 11). Defines the ledger location
(`docs/features/<NN>-<slug>/review-findings.md` /
`docs/fix/<n>-<topic>/review-findings.md`), the fixed schema
`| id | file:line | axis | severity | class | route | folded |`, the
merged-unit-skip gate (`gh pr view --json state` → `MERGED` → no write), the
fix-now-only write rule, `folded` starting `no`, and dedupe by `file:line`+
axis reusing the adversarial-mode merge rule already documented in the same
file. Also updated the `→ Next:` block and the Routing section's fix-now
bullet to mention the ledger, for internal consistency (same file, no scope
beyond the phase). `bump-skill` ran: `review-change` 2.1.1 → 2.2.0 (minor),
CHANGELOG.md/.es.md per-skill row + release-log entry, README.md/.es.md
skills-table cell — commit `dcdd6b2`.

Gate: this repo has no application build; "green" here is the P1 task greps,
all run and passing (see `TASKS.md` P1, each ticked with evidence). The
project-wide skills-discovery/doc-coherence gate and schema-package tests are
deferred to P5 hardening, per this SPEC's phasing (each phase's own greps
suffice mid-unit).

No known-issues opened this phase; no new decisions beyond what `decisions.md`
already recorded at planning (D1–D4). SPEC unchanged (scope/acceptance
untouched).

Next: `execute-phase 17 P2` — `audit-pr` persists fix-now blockers to the same
ledger.
