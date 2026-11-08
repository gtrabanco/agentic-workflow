---
kind: manual
---
# feat/413: delta verify VERIFIED then P11 batch closed DA1/DA2

## Summary
External delta verify of the merged head (base 4f48ae7 → head 60ff9659) returned VERIFIED with 0 blockers. Owner then ordered both advisories fixed: DA1 (announce latch now clears at each session_start, per-project-session contract) and DA2 (--exec-path removed from GIT_VALUE_OPTIONS, proven by git probe in scratch that value-less form exits before any subcommand).

## Decisions
DA1: behavior fix over prose reword — latch reset at onSessionStart keeps the README contract honest; index.ts already notes fresh extension instance per session so the reset is a no-op there.
DA2: value-less --exec-path confirmed to print and exit without running a subcommand (scratch repo proof: git --exec-path commit -m probe → exit 0, zero commits).

## Next
Owner re-verify of head f65ca1bc, then merge PR #456 (Closes #413).
