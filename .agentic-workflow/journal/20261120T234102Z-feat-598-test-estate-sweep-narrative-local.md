## 2026-11-20T23:41:02Z — feat/598-test-estate-sweep — narrative
- **Commits:** 16 (`fd604649…dddd3cd6`)
- **Files:** 21 files
- **Summary:** Applied the external-verify correction batch on PR #666: the six declared estate checks now name the adjudicated invocation, a missing or empty --dir is a usage error (exit 2, never a zero-suite green) and the default gate header stays byte-stable while a non-default --dir names its tree; four red corpus cases landed first, then 56/56 green on bun and node; the stale E10/G1/E2 receipts corrected by append; O17/O18 added and O1/O7 reopened then verified; offline gate PASS, 16 steps in 367s.
- **Decisions:** Fixed only the verdict's blockers plus the same-class doc defects A2/A3/A4/A6; left A1/A5/A7/A8 with reasons in D7; Log corrections append and never edit an earlier line (log-kind@1); the base differential against fc17d9661 is byte-identical on the default run.
- **Next:** Delta external re-verify of the corrected head, then the owner's verdict on PR #666.
