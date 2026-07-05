# 03 — orchestrator-crash-recovery — Completion checklist (single-pass)

- [x] No schema/migrations — n/a (docs-only repo)
- [x] Core layer imports — n/a (markdown skills, no code layers)
- [x] `workflow-status` 1.1.0: Crash recovery section (checklist + decision
      table `CLEAN | RESUMABLE | AMBIGUOUS` + fixed `CRASH RECOVERY`
      sub-block), `--last-envelope` hint contract (never authoritative;
      paste-in-message Portability fallback), envelope mapping onto EXISTING
      states (OK / CONTINUE / NEEDS_INPUT), read-only guardrail restated,
      Done when extended
- [x] `execute-phase` 1.13.1: "Resuming an interrupted phase" stated contract
      (reconcile ticks vs evidence, continue from first unticked task; no
      unique next task → stop and report)
- [x] `docs/workflow/ORCHESTRATION.md`: Driver restart protocol (append-only
      envelope journal with timestamp+SHA → sensor with hint → route on
      OK/CONTINUE/NEEDS_INPUT; divergence line semantics; REST-only drivers
      need no git/fs access)
- [x] No change under `packages/agentic-workflow-schema/` and no change to
      `orchestration-envelope`'s schema block — verified by `git status`
      (untouched) and `npm test` in the package (see PR evidence)
- [x] Gate green: `npx skills add . --list` exit 0
- [x] CHANGELOG.md + CHANGELOG.es.md rows (workflow-status 1.1.0,
      execute-phase 1.13.1) + release-log entries
- [x] No new dependencies

Decisions not in the SPEC: none — D1 (inside workflow-status, no new
micro-skill) and D2 (no schema change) implemented as specified.

Version note: `execute-phase` jumps 1.12.0 → 1.13.1 on this branch because
1.13.0 belongs to feature 01's PR #8. Merge order: #8 → #9 → this PR; expect
a trivial CHANGELOG rebase if merged out of order.

## Review fold (2026-07-05, review-change on PR #10)

- F1 (fix-now): multi-branch envelope-state precedence was unspecified —
  fixed: `AMBIGUOUS` > `RESUMABLE` > `CLEAN`, worst verdict wins the single
  envelope `state`; the per-branch report table is unaffected.
- F2 (fix-now): the unpushed-commits check used `git log @{u}..`, which
  errors when the branch has no upstream — exactly the mid-crash
  never-pushed case. Fixed: guard on upstream existence first; no upstream ⇒
  every commit is unpushed by definition.
- F3 (fix-now): the example envelope's `detail` didn't show the
  `crash_recovery` key the prose required. Fixed: example now includes
  `crash_recovery: {verdict, branches: [...]}`.
- `workflow-status` bumped 1.1.0 → 1.1.1 (patch — contract tightening, no new
  capability); CHANGELOG.md/.es.md rows added.
- Gate re-run after the fold: `npx skills add . --list` exit 0.

## User-requested scope addition (2026-07-05, folded into this PR)

Explicitly requested by the project owner during the merge of this PR (not in
the 03 SPEC — documented here so the merge gate sees deliberate scope, not
creep): the **every-2-phases review checkpoint becomes a recommendation, not a
blocking stop** — `execute-phase` 1.14.0 recommends `/review-change` at the
checkpoint with "continue to the next phase" as a listed alternative, envelope
stays `CONTINUE` (advisory); the **end-of-unit review remains mandatory** and
the **dependency gate is unchanged** (still blocks; `--force` to override).
`review-change` 1.10.1 cross-references updated; README EN/ES + SKILLS.md rows
and diagrams updated; CHANGELOG EN/ES rows added.

Review fold 2 (2026-07-05, re-review of this PR):

- F1 (fix-now): `docs/workflow/FEATURE_WORKFLOW.md` Stage 4 prose and ASCII
  flow still described the 2-phase checkpoint as a forced hand-off — reworded
  to "recommended, skippable checkpoint; mandatory end review" (lines 123,
  174).
- F2 (intentional-tradeoff — documented decision, no issue): `ship-roadmap`
  DELIBERATELY keeps a hard checkpoint every 2 phases for L/sensitive
  features. Rationale: the autopilot runs unattended, so there is no human
  present to accept or skip a recommendation — a risk-proportional review
  floor replaces that judgment. The interactive advisory checkpoint
  (execute-phase 1.14.0) and the autopilot's fixed cadence are two different
  policies on purpose; do not "align" them.
