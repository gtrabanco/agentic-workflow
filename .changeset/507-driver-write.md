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

**The journal joins the class registry.** Issue #498's scope reinforcement
(owner comment 2026-11-10T00:22) adds a union merge driver for `docs/LOGS.md`:
the `logs` file class unions entries by their exact `## …` heading line —
the real journal carries heterogeneous stamps (second-precision, minute,
date-only), so no grammar is imposed. The journal is append-only and each side
must remain an append-only extension of the base (an entry edited, reordered
or dropped refuses closed); distinct new entries are all kept, ordered by
their normalized stamp; the same heading appended with different bodies
surfaces as a real conflict. `docs/LOGS.md merge=agentic-shared-logs` rides the
same `.gitattributes` registry and is armed by the same
`bun scripts/shared-doc-merge.mjs --install` — a fifth attribute, never a
duplicate claim — and the journal-aggregate workflow itself is unchanged.
