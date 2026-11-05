# Decisions — fix/420-docs-generated-merge-driver

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/docs-generated-merge.test.mjs | P3 | 2026-11-05 | execute-phase | The scratch-repository merge this suite drives exposed the integration detail no unit-level case could: git hands the driver `%P` shell-quoted (`'docs/generated/index.md'`), so a driver that reads the quotes as part of the path refuses its own file. The case is added, never relaxed — every earlier assertion stands unchanged.
justification | scripts/local-gate.test.mjs | P4 | 2026-11-05 | execute-phase | The same list gains the new id; no existing id, ordering or assertion changes, and the list's meaning — one entry per check the gate runs — is exactly what the addition honors.
justification | scripts/local-gate.test.mjs | P4 | 2026-11-05 | execute-phase | The empty-impact case pins the offline non-test steps that survive a prose-only push; the set is now two, because this unit's projection check is deliberately not test-gated — a prose-only push is exactly the push that stales the projection. The expectation grows by the new id; the assertion's meaning (nothing test-bearing survives, nothing else is dropped) is unchanged.
justification | scripts/release-workflows.test.mjs | P4 | 2026-11-05 | execute-phase | The same closed id set is pinned a second time for the workflow-delegation contract; the array gains the same single id in the same position so the two pins cannot drift apart.
```

## Decisions

- **D1** — 2026-11-05, the resolution rule: the driver answers the **incoming**
  side (`%B`) byte for byte. Both sides of a projection conflict are *some*
  tree's rendering, so neither is more true than the other; what makes the merges
  safe is that the bytes are re-derived, never that this choice is smart. "Ours"
  would be the equally defensible answer, and the reason it is not taken is that
  "the incoming projection wins" is the sentence a contributor already expects
  from `git checkout --theirs`.
- **D2** — 2026-11-05, the driver never rewrites a file it was not asked about:
  a `%P` outside the declared projection directory exits 1 and leaves the
  conflict. `.gitattributes` scoping is a claim about the tree, and a driver that
  trusts it blindly turns a pattern typo into a rewritten hand-written document.
- **D3** — 2026-11-05, correctness moves out of the merge: `scripts/local-gate.mjs`
  gains the `docs-generated-projection` step (`docs-generate --check`), offline
  and **not** test-gated, so it runs on a prose-only push — the exact push that
  stales the projection. Without it the driver would trade a visible conflict for
  an invisible staleness.
- **D4** — 2026-11-05, the projection directory has one home: the driver reads it
  from the guide's `Docs site` block through `scripts/docs-generate.mjs`
  (`projectionDir`), and the suite pins `.gitattributes` against that answer. A
  second copy of `docs/generated` in the driver would let a `content-dir` change
  silently disarm the merge.
- **D5** — 2026-11-05, the installation is a command, not a committed hook:
  `.gitattributes` names the driver, but git reads `merge.docs-generated.driver`
  from the checkout's own config, which no clone inherits. `--install` is the
  idempotent arming step the guide names beside `--install-hook`, and an unarmed
  checkout keeps its conflict rather than resolving it by accident (pinned by
  the suite's unarmed case).
- **D6** — 2026-11-05, the driver runs bun-first with a node fallback inside the
  installed line, so an armed checkout works under either runtime without the
  install having to guess which one the contributor uses.
