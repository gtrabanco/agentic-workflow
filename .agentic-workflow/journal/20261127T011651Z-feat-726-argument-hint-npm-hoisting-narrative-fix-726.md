## 2026-11-27T01:16:51Z — feat/726-argument-hint-npm-hoisting — narrative
- **Commits:** 0
- **Files:** —
- **Summary:** Applied issue #726 inline: quoted the three unsafe skill argument hints and made the pi package's subagents entry a resolver shim. Both defects reproduced red first; package suite 1142/1142 green, root suite green, crate node suite red only on the load-sensitive doc.structure timeout.
- **Decisions:** A bundler transform, not only source quoting: a future unsafe hint cannot ship. The subagents entry becomes a package-owned shim resolved through Node's algorithm (nested and hoisted), with one session_start diagnostic naming the entry on failure; the README states the hoisting cure and the new disable target. The README budget is re-pinned 1,392 -> 1,402 with its sources note.
- **Next:** External verifier review of the diff; the crate node suite's doc.structure timeout is pre-existing load sensitivity (standalone green), not this change.
