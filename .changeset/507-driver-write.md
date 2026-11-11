---
"init-workspace": patch
---

fix(skills): install the generated-surfaces merge driver in bootstrap and upgrade (issue #507)

**The driver stops being a manual step.** `scripts/docs-generated-merge.mjs`
existed since fix #420 but no install path armed it, and it covered only the
declared projection directory — so the roadmap index, the other deterministic
surface two parallel PRs collide on (#269 × #505), stayed outside both the
`.gitattributes` contract and the driver's reach. Bootstrap gains step 5 (keep
`template/.gitattributes` as the project's `.gitattributes`, additive on an
existing file, then arm the driver with
`bun scripts/docs-generated-merge.mjs --install` and verify
`merge.docs-generated.driver` is non-empty; an install without the scripts tree
is a residual, never a failed scaffold); upgrade mode proposes the same
registry lines and both arming commands under the never-clobber contract.
`template/.gitattributes` ships the integrated registry — the projection entry
plus #498's three `agentic-shared-*` file-class lines (the rebase integration,
2026-11-11: the shared-document classes own `docs/ROADMAP.md` and are armed by
`bun scripts/shared-doc-merge.mjs --install` in the same step; each path is
claimed once) — so every new repository inherits the protection, and the unit
doc templates gain the optional `roadmap_summary:` frontmatter key the synced
roadmap table reads.
