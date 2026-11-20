---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
"unit-lane": patch
"execute-phase": patch
"audit-docs": patch
"product-audit": patch
---

fix(docs): reconcile the duplicated rules, judge the snapshot's freshness, detect restatements

A rule restated where its owner already says it is the defect class this release
goes after: the copy drifts silently and no gate could see it, because prose
copies carry no id.

- **The repository snapshot is judged before it is consumed.** `repository-state@1`
  adds `covers-through` and a `decided` date per accepted decision, and
  `bun scripts/repository-state.mjs` answers `fresh` or `stale` — a decision dated
  after the snapshot's coverage is a contradiction, never current truth. The
  snapshot is re-frozen against the tree, and the invariant protocol checks
  freshness before it trusts the artifact.
- **The copies became pointers.** The one-PR rule, the red-first mechanism, the
  design rules, the core principles, the AI-001 template, the no-slash fallback,
  the review-authority rule, the branch rule and the force-push scope now each
  name their one owner, and the inline-batch exception and the default-branch
  wording travel with the rule again. The stack-agnostic rule gains the
  host-naming carve-out it was missing.
- **The class has a detector.** `restatement-corpus@1` declares each seeded rule
  with its owner, phrase, scopes, declared exceptions and claimant;
  `scripts/restatement-sweep.mjs` refuses an unowned restatement, a claim the
  tree disproves and a claim naming nobody — `audit-docs` runs it as check 18 and
  `product-audit`'s duplication dimension quotes its receipt.
- **The tree is tiered.** `docs/workflow/LOADING.md` owns the loading ladder, the
  balance rule and the stable-first/volatile-last ordering, and the guide obeys
  its own rule: the machine regions a unit re-pins sit last.
