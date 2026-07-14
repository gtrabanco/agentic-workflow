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

## P2 — `audit-pr` persist to the same ledger — 2026-07-13

Same branch, continuing from P1. Added process step 5 to
`skills/audit-pr/SKILL.md` ("Persist blockers to the fold ledger (BLOCKED
verdict only)") between the existing step 4 (Decide) and the MERGE-READY
comment step (renumbered 5 → 6, 6 → 7, 7 → 8). Every blocker on a BLOCKED
verdict writes to the **same** `review-findings.md` ledger `review-change`
writes (D4 — one list for the fold cycle, not two), same fixed schema, same
merged-unit-skip gate (`gh pr view --json state` → `MERGED` → no write), same
dedupe-by-`file:line`+axis rule (explicitly cross-referenced to
`review-change`'s rule rather than restated independently, to keep the two
skills' dedupe behavior from drifting). Assigned `severity: high` uniformly
(a blocker is fix-now and gates the merge by definition — `audit-pr`'s
contract table has no finer severity gradient than blocker/non-blocker) and
`class: fix-now`; `axis` = the gate name from the merge-readiness contract
table (`Tests`, `Docs`, `Traceability`, …); `route` = this skill's own
Routing section's mapping for that blocker kind.

`bump-skill` ran: `audit-pr` 3.0.0 → 3.1.0 (minor), CHANGELOG.md/.es.md
per-skill row + release-log entry (merged into the same-day feature-17
bullet from P1), README.md/.es.md skills-table cell — commit `13ab857`.

Gate: P2 task greps run and passing (see `TASKS.md` P2). No application
build in this repo; project-wide skills-discovery/doc-coherence and schema
tests deferred to P5 hardening per the phasing.

No known-issues opened; no new decisions beyond D1–D4 (already resolved at
planning). SPEC unchanged.

Next: `execute-phase 17 P3` — `execute-phase`'s own fold cycle gains the
`folded: no → yes` tick.

## P3 — `execute-phase` fold-cycle tick — 2026-07-13

Same branch, continuing from P2. Added one box to the existing "Folding
review / audit findings" checklist in `skills/execute-phase/SKILL.md`
(`:411-420`): each folded finding's `review-findings.md` row flips
`folded: no → yes` — stated explicitly as the ledger's one and only state
transition, owned solely by this fold cycle (matches D1's capability-closure
row from the SPEC). No new section added; the box sits inside the existing
checklist between the per-phase-docs box and the commit box, since ticking
the ledger is itself a doc update that must ride the same fold commit. Noted
that the ledger is **optional** — a unit with no fix-now findings has none,
so the box doesn't apply when there's nothing to tick.

`bump-skill` ran: `execute-phase` 2.1.0 → 2.2.0 (minor), CHANGELOG.md/.es.md
per-skill row + release-log entry (merged into the same-day feature-17
bullet). README.md/.es.md skills-table cell left unchanged — it's already a
generic phase-execution description and doesn't itemize fold-cycle
mechanics, so no factual inaccuracy to fix. Commit `606dee6`.

Gate: P3 task grep passes (see `TASKS.md` P3). No application build in this
repo; project-wide skills-discovery/doc-coherence and schema tests deferred
to P5 hardening per the phasing.

No known-issues opened; no new decisions beyond D1–D4. SPEC unchanged.

Next: `execute-phase 17 P4` — `workflow-status` reads the ledger and emits
`findings.fix_now[]` with `suggested_tier`; schema package mirrors the item
shape in the same phase.

## P4 — `workflow-status` + schema package: emit + mirror — 2026-07-13

Same branch, continuing from P3. This was the largest phase (SPEC-flagged as
one concern grouping the `workflow-status` emit with its schema-package
mirror, since the repo's Verification rule binds them to the same PR).

`skills/workflow-status/SKILL.md`: inserted new process step 9 ("Fix-now fold
ledger → `findings.fix_now[]`") between the existing step 8 (pending quality
gates) and step 9 (findings awaiting a destination), which renumbered
old 9→14 to 10→14 — fixed every downstream cross-reference to a renumbered
step (`step 9`→`step 10` in the untriaged-backlog prose, `step 10`→`step 11`
in the `detail.untriaged_issues` guardrail note). Step 9 reads each in-flight
unit's `review-findings.md`, projects only `folded: no` rows into
`{id, file, axis, severity, class, route, suggested_tier}`, and documents
`suggested_tier`'s derivation as a fixed 3-row table (matches D3 from
`decisions.md` verbatim). Also extended step 8's language: the ledger's mere
presence now satisfies its "review report present" check — resolving the
latent inconsistency the SPEC flagged (`known-issues.md`, "Latent
inconsistency resolved incidentally"). Updated the envelope JSON example to
show one populated `fix_now` item. `next.tier`'s own derivation section
(`:305-319`) was left untouched, per acceptance criterion 6.

`packages/agentic-workflow-schema/`: replaced `EnvelopeFixNowFinding`
(`{ref, title, file?}` → `{id, file, axis, severity, class, route,
suggested_tier}`) in `src/index.ts`, added the `FixNowSeverity` type +
`FIX_NOW_SEVERITIES` validation list, updated `validateEnvelope`'s per-item
checks, mirrored the shape in `envelope.schema.json`. Added two tests
(populated item accepted; malformed item — bad severity, bad tier, missing
field — rejected). `npm test` (`tsc && node --test`): **15/15 green**, exit 0.
Bumped the package version **1.0.2 → 2.0.0 (major)** — the package's own
`README.md` "Versioning" section states a removed/renamed key is a breaking
change, and this replaces the entire item shape. Updated both READMEs'
field-by-field table row for `findings.fix_now[]` (EN/ES). `dist/` is
gitignored (built on publish, rebuilt locally by `npm test`'s `tsc` step) —
nothing to commit there.

`bump-skill` ran: `workflow-status` 1.5.1 → 1.6.0 (minor), CHANGELOG.md/.es.md
per-skill row + release-log entry (merged into the same-day feature-17
bullet, now noting the schema package's major bump too), README.md/.es.md
skills-table cell updated to mention `findings.fix_now[]`. No model/effort
tier changed → `model-routing.yml` untouched. Commit `f35f9ba`.

Gate: P4 task greps + `npm test` all pass (see `TASKS.md` P4). No application
build outside the schema package; project-wide skills-discovery/doc-coherence
deferred to P5 hardening per the phasing.

No known-issues opened; no new decisions beyond D1–D4. SPEC unchanged
(acceptance criteria 1–8 now satisfied; 9–10 are P5's).

Next: `execute-phase 17 P5` — Hardening & PR: dev-scenario failure modes,
`template/` mirror, documentation map entry, `GOLDEN_FIXTURE.md` run, full
gate + `audit-docs`, close out (PR, roadmap link).

## P5 — Hardening & PR — 2026-07-13

Same branch, continuing from P4 (the final phase — its pre-written tasks ARE
the close-out chain).

**Dev-scenario failure edges** — verified each was already stated in its
owning skill from P1–P4 (no new edits needed): re-run dedupe
(`review-change`/`audit-pr`, both cite the same `file:line`+axis rule),
merged-unit no-write (both, `gh pr view --json state` → `MERGED` gate),
missing-ledger → `fix_now: []` no error (`workflow-status`), fold+tick drop
(`workflow-status` reads only `folded: no`; `execute-phase` owns the flip),
audit-pr writes the same ledger (D4 cross-reference), schema-drift guard
(covered by the 2 new schema-package tests added in P4).

**`template/` mirror + documentation map**: added a "Fix-now fold ledger"
paragraph to `template/CLAUDE.md`'s Feature workflow section (the ledger
path, schema, and who writes/ticks it) and a matching paragraph to
`docs/workflow/FEATURE_WORKFLOW.md` (+ ES sibling) explaining when the ledger
is created (Stage 4, not scaffolded up front) and by whom. Commit `4074531`.

**`GOLDEN_FIXTURE.md` run** (mandatory — this phase touched `review-change`,
`execute-phase`, `workflow-status`, all executor-path/review-pack skills):
no local weaker model available in this session's fleet, so used the
documented fallback — Claude Haiku 4.5, the weakest model in this session's
own fleet, per 3 live subagent runs fed the exact process-step text against
the toy fixture (`docs/features/99-csv-export-command`, scratch copy under
the session scratchpad, deleted after). (A) `review-change` process step 9,
given a synthetic fix-now finding → wrote a real `review-findings.md` row
with the fixed schema verbatim. (B) `workflow-status` process step 9, reading
that file → produced the exact matching `findings.fix_now[]` JSON item,
correctly deriving `suggested_tier: cheap` from the mechanical table
(severity `med`, axis `tests` — neither condition fires). (C)
`execute-phase`'s fold-cycle checklist box, given "finding just fixed and
committed" → flipped only `folded: no → yes`. All three: zero invented
steps, zero reported ambiguity — confirms the wording survives a weak model.
Run-log row appended to `docs/workflow/GOLDEN_FIXTURE.md` (+ ES sibling),
same commit `4074531`.

**Full gate**: `npx skills add . --list` — all skills discovered, no errors.
`cd packages/agentic-workflow-schema && npm test` — 15/15 green.

**`audit-docs`**: ran scoped to this feature's own docs (roadmap row ↔
folder ↔ doc-map ↔ template) — Decision: PASS, no findings. Phase-naming
check's one grep hit (`progress.md:141` "Step 9") is a reference to
`workflow-status`'s own numbered process step, not this feature's `P1`–`P5`
phase labels — not a violation.

**Close-out**: roadmap row 17 flipped `planned → done` (this commit); the PR
open step and the `docs: link PR` follow-up commit are the remaining close-out
actions, executed immediately after this phase-docs commit per the mode
steps.

Pending-docs check: `git status --porcelain -- docs/` → empty before this
commit lands.
