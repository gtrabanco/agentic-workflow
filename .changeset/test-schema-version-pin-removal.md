---
"@gtrabanco/agentic-workflow-schema": patch
---

The schema package's own version is no longer asserted as a literal in test/release-contract.test.mjs and test/verification-gates.test.mjs: a typed number pins today's value, disagrees with the tree after the next release, and blocks every unified-train cut (release.mjs apply rewrites versions and CHANGELOG rows, never tests). The invariant those tests gestured at is now read on both sides — scripts/version-parity-gate.mjs --pins evaluates every package under packages/ against the local sibling census, the root suite asserts the same over the shipped tree, and scripts/pin-watch.mjs applies the local rule between PRs.
