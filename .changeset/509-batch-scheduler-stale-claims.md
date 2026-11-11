---
"@gtrabanco/agentic-workflow-schema": minor
"batch-scheduler": minor
---

feat(batch-scheduler): per-lane claims, evidence-based launch, file overlap, label block

The batch planner's four lifecycle defects (issue #509) plus the five gaps an
operator hit planning by hand:

- claims are keyed `(issue, lane)` in a version-3 state file, so a claim made in
  one lane never colors the sibling lanes, and a claim that no longer stands is
  reported once as `stale-claim` and pruned — on terminal PR/branch evidence, a
  deleted worktree, a closed issue, a pre-v3 key, or the 48-hour TTL against the
  run instant the CLI supplies (the envelope still carries no clock);
- `launched[]` is decided by evidence, not by a unit doc: one `gh pr list` (the
  forge is authoritative) plus the local branches and worktrees, with every
  unreadable source degrading declared;
- two issues the plan presents as parallel whose branches rewrite the same file
  are a `file-overlap` finding, never a silent recommendation;
- soft-dependency resolution reads the forge: closed is resolved, open and
  undelivered is caveated, and an unreadable open set is `unknown` rather than
  assumed satisfied;
- the dependency parser keeps its fail-closed contract and gains a recovery pass
  that only takes rows naming their kind, reporting parsed-of-total;
- issues labelled `postponed`, `backlog` or `human-revision-needed` are a
  `label_blocked` category of their own — the new field moves the document to
  `batch-plan@3` with its summary count;
- an explicit triage verdict in the body (`fix-now`, `postponed`, `promoted`,
  `wontfix`) outranks a stale roadmap row for triage readiness.
