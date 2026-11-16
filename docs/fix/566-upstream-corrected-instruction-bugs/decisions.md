# Decisions — fix/566-upstream-corrected-instruction-bugs

Owner decisions and process rulings this unit rests on. Appended-only: a later
correction is a new dated row, never an edit of the row it corrects.

- **D1 — 2026-11-16** — **Route: this unit rides the fix-560 branch and PR #577.**
  The owner, after I had cut a separate `fix/566-…` worktree, ruled verbatim
  "Wait don't work on 566 worktree, do it in this branch & pr or just open the
  closed issues with annotation of pending work to redo them", then selected
  `fix-here` ("Fix both here, on this branch & PR #577") when asked which route.
  This knowingly overrides the repo's one-PR-per-unit rule (instruction
  precedence: prompt > guide); the separate worktree and branch were removed
  with zero changes. The forge stays closed per his parallel ruling
  ("Refs #566", he handles the forge state). Evidence: PE-009, L2.
- **D2 — 2026-11-16** — **B1 lands as a replacement bullet, not an append.**
  The issue's AC1 orders the superseded clause *deleted in the same PR (no
  compatibility shim)*, so §7's "Read both sides back" bullet is rewritten to the
  corrected contract while its five-obligation neighbours stay untouched;
  feature 66's stale assertion is *annotated* (dated note), following the
  append-only precedent set for closed units (fix #560's 383 rows), because its
  AC8 receipt describes what was verified then. §3 step 5 stays as-is: it
  already says "the file wins on every conflict" and the issue's own triage
  checked it as correct. Evidence: PE-001, PE-002, PE-007.
- **D3 — 2026-11-16** — **B2 ships as a sixth, additive `instance-id` check with
  the issue's exact probe form.** Design points, each from the issue's AC2:
  (a) check id `instance-id`, appended after `session-ambiguity` in `CHECK_IDS`
  and in the parallel `CHECKS` list — the five existing ids keep their order and
  bounds, so the suite's fixed-order contract grows by one line, not a rewrite;
  (b) probe form `engram instance-id` with `ENGRAM_NO_UPDATE_CHECK=1` and a
  freshly made temp `ENGRAM_DATA_DIR` (removed afterwards — the probe's
  read-only contract is about the memory layer, which a fresh temp dir never
  touches); (c) `ENGRAM_URL` set → the check passes with a detail naming the
  remote authority and judges nothing local; (d) ENOENT → `binary-missing`
  (degraded, the same reason family the version check uses — never a hard
  incompatibility); (e) non-zero exit / empty answer → a failure whose reason
  and detail name the unmet `instance-id` capability; (f) the environment is
  passed through `runImpl`'s options (`env`), extending the injected-side-effects
  shape the probe already uses — no global state, no `process.env` mutation.
  The uniform version gate the issue rejects is never introduced. Evidence:
  PE-005, PE-006.
- **D4 — 2026-11-16** — **The route override does not touch the sibling units.**
  Nothing in this unit edits #560's or #567's docs, ledgers or Log; each unit
  keeps its own carrier on the shared branch, and this unit's `## Log` never
  records receipts for the other two.
