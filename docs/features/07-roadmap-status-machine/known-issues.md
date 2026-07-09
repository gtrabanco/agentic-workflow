# 07 — roadmap-status-machine · known-issues

Deferred items, each linked to (or destined for) an issue. Deferred work is
**not** implemented inline.

## Deferred

- **Automated legacy-roadmap migrator.** This feature ships the legacy
  `planned`↔`defined`+`planned` equivalence as a *documentation* rule
  (`MIGRATION.md`), not an automated upgrade. Automated substrate migration for an
  existing project is **U10 — init-workspace upgrade mode**
  ([#20](https://github.com/gtrabanco/agentic-workflow/issues/20)).

## Watch (not deferred work, just flagged for reviewers)

- **Double-writer risk on a status transition.** Each status edge has exactly one
  owning skill (see SPEC → Architecture impact). If a future edit adds a second
  writer, status drift returns — the P5 weak-model read-through checks for this.
- **U7 envelope removal interaction.** This feature adds `design_candidates` to
  `workflow-status`'s envelope. U7 ([#17](https://github.com/gtrabanco/agentic-workflow/issues/17))
  removes the envelope from skills *except* `workflow-status`, so the added field
  survives U7 — no conflict expected, noted for the U7 executor.
