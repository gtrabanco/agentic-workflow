# 08 — phase-economics · decisions

Architecture/scope decisions + open questions. Product decisions live in the
SPEC's Product half; this file records engineering decisions and their rationale.

## Decided

- **Hard split rule replaces the soft heuristic, and lives in the planner not just
  the template.** The soft "**L** → consider splitting" was only in the SPEC
  template; a weak planner never acted on it. The mandatory rule (>~5 phases OR
  multi-layer/concern phase OR unresolved design decision) goes into
  `plan-feature-scaffold` as a gate *and* upgrades the template wording. Rationale:
  the dependency infrastructure to split already exists — only the requirement to
  use it was missing.

- **Cheap-executability checklist is a fixed four-box gate, not prose advice.**
  Every phase the scaffold emits passes only if all four boxes hold (independently
  checkable · zero open decisions · one concern · gate runs locally); `n/a`
  explicit. Rationale: "checklists over heuristics" — a weak model cannot misread a
  box; it can misread "make sure phases are small."

- **Acceptance criteria emitted as commands where checkable; feature 07's
  `testing.md` is the reference shape.** Command-checkable → the command in
  `TASKS.md`/`testing.md`; judgement-only → prose labelled read-verified.
  Rationale: a weak model runs a command reliably but judges prose poorly. Not a
  new invention — feature 07 already shipped its criteria this way.

- **One-phase-one-session is stated as a rule in `execute-phase` +
  `FEATURE_WORKFLOW`, not enforced by new tooling here.** The `/loop` batch shape
  already clears and re-invokes per phase; this feature makes the *why* explicit
  and binding. Automated enforcement against the weakest fleet model is **U9**
  (golden fixtures, [#19](https://github.com/gtrabanco/agentic-workflow/issues/19)),
  deliberately out of scope.

- **Repo ↔ `template/` mirror is a same-PR invariant.** The SPEC template and (if
  present) `FEATURE_WORKFLOW` exist in both `docs/` and `template/`; both copies
  change together, verified by paired acceptance criteria (AC6/AC7) — the same
  coupling feature 07 held for the roadmap legend.

- **Dynamic model self-selection rejected.** The model is the worst judge of its
  own difficulty; routing stays fixed by the human/driver per step type. This
  feature moves difficulty *out* of execution (via smaller, closed phases) rather
  than letting the executor escalate its own model.

- **Roadmap `Depends on` = `—`.** The soft dependency on U3 (06) and U4 (07) is
  satisfied — both merged — so nothing gates start; the soft relationship is
  documented in the SPEC prose rather than the roadmap column (which reads as a
  hard gate).

## Open questions

- None blocking. A precondition of this feature's own cheap-executability
  checklist: a phase with an open decision must be split, so the SPEC carries no
  unresolved engineering decision.

- **`FEATURE_WORKFLOW` template mirror.** If `template/docs/workflow/FEATURE_WORKFLOW.md`
  does not exist, the executor records that here at P2 and adds the rule only to
  the repo copy (no mirror to update). Not a blocker — a P2 verification note.
