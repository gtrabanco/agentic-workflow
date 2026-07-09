# 06 — design-feature · known issues

Deferred items. Each is destined for an issue or a follow-up unit — **not** to be
implemented inline in this feature.

## Deferred

- **Full issue-path unification through `design-feature`.** In U3, only the
  raw-idea *interview* moves into `design-feature`. `plan-feature-from-issue`
  still authors the product half for issue-born features (gated by capability
  closure). Fully routing `triage-issue` promote and the issue path through
  `design-feature` — so *every* origin (idea, issue, promotion) passes one
  product-definition door — is deferred. **Evaluate alongside U4**
  ([#14](https://github.com/gtrabanco/agentic-workflow/issues/14)); open a
  follow-up issue if U4 does not absorb it.

- **Gate migration to roadmap `defined` status.** This unit's `plan-feature`
  redirect keys on the SPEC `## Design status` marker. **U4**
  ([#14](https://github.com/gtrabanco/agentic-workflow/issues/14)) migrates the
  check to the roadmap `defined` status (`idea → defined → planned → in-progress →
  done`) and wires `workflow-status` / `ship-roadmap` to read it. The SPEC marker
  stays as the SPEC-local record. Owned by U4 — do **not** add roadmap status
  columns here.

- **Phase-economics for design-feature output.** Split thresholds
  (>~5 phases / multi-layer phase → chained features) and acceptance-criteria as
  runnable commands are **U5** ([#15](https://github.com/gtrabanco/agentic-workflow/issues/15)).
  `design-feature` should produce checkable criteria but the *criteria-as-commands*
  rule and the split heuristics land in U5, not here.

- **Global installed-skill/MCP discovery sweep.** `design-feature` records only
  tooling relevant to the feature at hand. The product-wide skill/MCP discovery
  sweep is **U6** ([#16](https://github.com/gtrabanco/agentic-workflow/issues/16)).
