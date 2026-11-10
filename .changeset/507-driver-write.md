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
is a residual, never a failed scaffold); upgrade mode proposes the same two
lines and the arming under the never-clobber contract. `template/.gitattributes`
ships the lines so every new repository inherits the protection, and the unit
doc templates gain the optional `roadmap_summary:` frontmatter key the synced
roadmap table reads.
