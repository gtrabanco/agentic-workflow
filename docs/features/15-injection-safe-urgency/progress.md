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

## P2 — `workflow-status`: `detail.urgent` + interruptibility facts — 2026-07-11

Added Process step 3 (renumbered subsequent steps 4→13): scans the open-issue
list already fetched in step 2 (`gh issue list … --json …,labels`) for the
`urgent`/`fix-next` labels — labels object only, never title/body/comment —
and pairs it with the in-flight unit's interruptibility facts (phase,
dirty/clean, tasks left to the next commit boundary), reusing the existing
phase-progress (step 8) and crash-recovery dirty-tree reconcile rather than
adding new git calls. `urgent` wins when an issue carries both labels. Added
the `detail.urgent` field to the Machine envelope section (description +
worked example) and a Guardrails bullet restating presence-only/read-only.
All P2 command-checkable criteria pass (`urgent`, `json labels` greps).
`bump-skill` ran for `workflow-status` 1.2.0 → 1.3.0 (minor): CHANGELOG.md/es
rows + README/README.es cells updated, release-log entries added (commit
`f9cec3b`). No open decisions or deviations from the SPEC. Two phases
complete (P1, P2) — review checkpoint recommended, not mandatory. Next:
`execute-phase 15 P3` (`ORCHESTRATION.md` judge rubric + `ship-roadmap`
SELECT).

## P3 — Consumer judge: `ORCHESTRATION.md` rubric + `ship-roadmap` SELECT — 2026-07-11

Review checkpoint offered after P2, skipped by the user (mandatory end review
still applies). Added `## Urgency: the pause-vs-finish micro-judge` to
`docs/workflow/ORCHESTRATION.md`: a short-circuit table (empty urgent list,
`fix-next` bypass, clean-tree-at-boundary → `INTERRUPT_NOW`, ≤1 task from
close → `FINISH_FIRST`) before the judge spec — tool-less, cheap-tier/
clean-context, closed-binary `{"verdict", "reason"}` output with a one-shot
schema repair, rubric-as-system-prompt (the checklist is quoted verbatim as
the judge's system prompt), fail-safe default `FINISH_FIRST`. Also documents
the acting step (park as a voluntary WIP-commit "crash", reuse `RESUMABLE` +
idempotent phase re-entry to resume — no new machinery). Wired `ship-roadmap`
SELECT: new priority-1 urgency check ahead of blocking fixes, reading
`workflow-status`'s `detail.urgent` — `fix-next` → head of queue, no
interrupt; `urgent` → runs the `ORCHESTRATION.md` rubric by reference (not
forked) against `detail.urgent.interruptibility`; renumbered the remaining
priority list (2–6). All P3 command-checkable criteria pass (`FINISH_FIRST`,
`INTERRUPT_NOW` in ORCHESTRATION.md; `urgent`/`fix-next`, `ORCHESTRATION` in
ship-roadmap). `bump-skill` ran for `ship-roadmap` 2.1.0 → 2.2.0 (minor):
CHANGELOG.md/es rows + README/README.es cells updated, release-log entries
added (commit `5d18630`); `ORCHESTRATION.md` is a doc, no `bump-skill`. No
open decisions or deviations from the SPEC. Next: `execute-phase 15 P4`
(`init-workspace` label seeding).

## P4 — `init-workspace`: seed both labels — 2026-07-11

Added bootstrap Process step 7 (renumbered "Report" to step 8): seeds
`urgent`/`fix-next` via `gh label create` (create-if-missing — an
"already exists" error counts as success), never redefining the vocabulary
(`triage-issue` stays sole owner); forge unavailable → skip, list as a
residual, never fail the scaffold. Added Upgrade mode step 6 (renumbered
"Report + hand off" to step 7): checks `gh label list` and creates whichever
label is missing, additive-only — never touches a label the project already
customized (name/color/description), same never-clobber rule as the doc-block
diff. Updated the "Six ordered steps" lead-in to "Seven", the Guardrails
section (two new bullets: additive-only labels, never-redefine-vocabulary),
and Done when. All P4 command-checkable criteria pass (label vocab, `gh label
create`). `bump-skill` ran for `init-workspace` 2.1.1 → 2.2.0 (minor):
CHANGELOG.md/es rows + README/README.es cells updated, release-log entries
added (commit `ff34505`). No open decisions or deviations from the SPEC. Four
phases complete (P1–P4); only P5 (Hardening & PR) remains. Next:
`execute-phase 15 P5`.

## P5 — Hardening & PR — 2026-07-11

Cross-checked all seven SPEC Dev-scenario failure edges against the touched
skills — six were already stated (P1–P4); `status:issue-closed` needed one
clarifying addition to `workflow-status`'s `detail.urgent` description: the
open-issue list is scoped `--state open`, so a shipped fix's issue drops out
automatically on the next poll, no manual label strip. Ran the full gate:
`npx skills add . --list` exit 0, all skills discovered including the four at
their new versions. Ran `audit-docs` in-turn (11/14 checks; 3 skipped as
genuinely n/a — no fix touched, no Docs site block, PR not yet open) — PASS,
no findings. `git status --porcelain -- docs/` empty. Flipped roadmap row 15
to `done`, committed, pushed, opened PR `Closes #42` with a Markdown body
(written to a file, real backticks, verified via `gh pr view --json body`),
printed the URL, updated the roadmap row to
`done · [#<pr>](<pr-url>)`, and pushed the link commit. Feature 15 complete —
all 5 phases shipped, no open decisions, no deferred work. Next:
`/review-change` (mandatory final review) → `/audit-pr` (merge gate).

## Review-change fold — 2026-07-11

`/review-change` flagged one fix-now finding: the P2 renumbering (step 3
inserted, "renumbered subsequent steps 4→13" per that entry above) actually
left a **gap** — headers ran `1, 2, 3, 5, 6, … 13`, no step 4 — a weak-model
executor following the numbered list step-by-step could stall on the jump.
Folded: renumbered `skills/workflow-status/SKILL.md` steps 5→4 through
13→12 (contiguous 1–12, no gap), and fixed the in-text cross-reference in
step 3 ("reusing the same reconcile step 8 (phase progress)" → "step 7",
phase progress's new number). Updated the matching `TASKS.md` P2 evidence
citation (`step 8` → `step 7`) to keep it read-verifiable; left this file's
P2 narrative above as written (accurate to what P2 actually produced at the
time). No other file referenced the stale numbers. Re-run `/review-change`
to confirm green, then `/audit-pr`.
