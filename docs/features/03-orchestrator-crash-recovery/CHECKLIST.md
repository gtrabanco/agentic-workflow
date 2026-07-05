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
