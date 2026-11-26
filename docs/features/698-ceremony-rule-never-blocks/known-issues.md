# 698 — ceremony-rule-never-blocks · known pre-existing issues

- **The risk-tier classifier escalates every edit to
  `packages/agentic-workflow/bin/agentic-workflow.mjs`** (`signal: destructive`,
  reason `../src/doc/retrieval.mjs · (module-level)`). `does-not-affect`: the
  escalation is recorded as the unit's named high-risk item, and this unit's hunk
  is the usage list entry and the dispatch row — the retrieval module is
  untouched.
- **The roadmap table carried the #698 row twice** (`docs/ROADMAP.md:215` and
  `:219`, the second added by `2780f79a7`). `does-not-affect`, and repaired
  through the writer: `roadmap rowUpsert` updated the row readers keep and
  spliced the earlier duplicate (`D13`), so the table ends with one row and no
  hand edit touched a cell.
- **`unit-route --triage` and every runner command need the schema package's
  built `dist/`**, which is gitignored and absent in a fresh worktree.
  `affects` this unit's procedure only: the build runs once
  (`bun run --cwd packages/agentic-workflow-schema build`) before the triage
  block is captured, and the local gate rebuilds it when stale.
- **`bun test` can report `0 pass 0 fail` on a few suites that pass under
  `node --test`.** `does-not-affect`: every touched suite runs under both
  invocations in the verification block, and a zero-case report is named there
  rather than counted as green.
- **`scripts/test-obligation-tags.test.mjs` refuses an untagged root suite.**
  `affects` this unit: the new `scripts/repair-receipt.test.mjs` carries its
  `// test-obligation:` head, and every edited root suite keeps its own.
- **`REPAIR-RECEIPT`'s prose already promises a route vocabulary no runtime
  consumed** (#170/#301). `does-not-affect` the plan: this unit makes the
  existing promise machine-readable instead of inventing a second one, and the
  prose's own branch table is the derivation's authority (`PE-008`, `D5`).
