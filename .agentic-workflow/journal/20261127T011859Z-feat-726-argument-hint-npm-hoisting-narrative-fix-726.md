## 2026-11-27T01:18:59Z — feat/726-argument-hint-npm-hoisting — narrative
- **Commits:** 3 (`5e4228fb…0b1a7313`)
- **Files:** 20 files
- **Summary:** Applied issue #726 inline in three commits (5e4228fb7 tests/corpus, e353a0ac3 quoting + subagents shim, 0b1a73133 unit doc/ledgers/state): the three unsafe skill argument hints are quoted and a staging transform makes an unsafe hint unshippable; the pi package's subagents entry is a resolver shim that loads the dependency on nested and hoisted layouts and reports once when it cannot. Package suite 1142/1142 green; root suite green; crate node suite red only on the load-sensitive doc.structure timeout (standalone green).
- **Decisions:** A bundler transform, not only source quoting: a future unsafe hint cannot ship. The subagents entry becomes a package-owned shim resolved through Node's algorithm (nested and hoisted), with one session_start diagnostic naming the entry on failure; the README states the hoisting cure and the new disable target. The README budget is re-pinned 1,392 -> 1,402 with its sources note.
- **Next:** External verifier review of the diff; the crate node suite's doc.structure timeout is pre-existing load sensitivity (standalone green), not this change.
- **Supersedes:** 20261127T011651Z-feat-726-argument-hint-npm-hoisting-narrative-fix-726.md
