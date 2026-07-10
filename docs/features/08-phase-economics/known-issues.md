# 08 — phase-economics · known-issues

Deferred items, each linked to (or destined for) an issue. Deferred work is
**not** implemented inline.

## Deferred

- **Golden-fixture enforcement of the rules.** This feature *states* the hard
  split rule, the cheap-executability checklist, and one-phase-one-session, but
  ships no runnable harness that tests skill edits against the weakest fleet model.
  That is **U9 — golden-fixture procedure**
  ([#19](https://github.com/gtrabanco/agentic-workflow/issues/19)).
- **Automated enforcement of one-phase-one-session.** The rule is a documented
  convention the executor/driver honors; there is no runtime gate that blocks a
  second phase in the same conversation. Enforcement would ride on the same
  golden-fixture / driver work (U9 / the driver economics), not here.

## Watch (not deferred work, just flagged for reviewers)

- **Over-fragmentation risk.** The hard "~5 phases" threshold + one-concern-per-
  phase rule could over-split a genuinely cohesive M feature. The `n/a`-explicit
  checklist and the XS/S single-pass exemption (phase-splitting only fires at M/L
  phase planning) bound this — the P3 read-through confirms XS/S features never
  reach the split gate.
- **Repo ↔ `template/` drift.** If only one SPEC-template or `FEATURE_WORKFLOW`
  copy is edited, a scaffolded project drifts. Paired acceptance criteria (AC6/AC7)
  and `/audit-docs`' mirror check guard against it; a future template file added
  without its repo twin would reintroduce the risk.
- **U9 dependency direction.** U9 (golden fixtures) will *test* the rules this
  feature introduces; if U9's fixtures reveal a rule a weak model still misreads,
  the fix is a wording tightening of this feature's skills — noted for the U9
  executor.
