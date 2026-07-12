# Decisions — 16-nan-model-guidance

- **P2 checkbox reconciliation (2026-07-13).** SPEC.md's `## Phases` list had
  both P1 and P2 marked `[x]`, but only P1's work was actually committed
  (`0cc4deb`) — no PR existed for the branch and the roadmap row was still
  `in-progress`, not `done`. Un-ticked P2 before running it for real, per the
  "resuming an interrupted phase" reconciliation rule in `execute-phase`
  (verify evidence before trusting a tick).
