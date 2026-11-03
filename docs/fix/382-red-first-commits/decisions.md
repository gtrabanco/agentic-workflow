# Decisions — fix/382-red-first-commits

Open questions, their resolutions, and the path-protection records this unit's
planned test tasks need. Append-only.

## Path-protection records (P6)

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/red-first.test.mjs | P6 | 2026-11-05 | execute-phase | The external verification of this unit's gate found that `introduced()` read the OLDEST add of a path, so a pair deleted and re-added together after the cutoff reported `verdict: PASS` — the exact one-commit regression #382 exists to close. The fixture corpus gains the case that exercises it; the correction is red-first (the case fails against the previous index and passes against the fixed one), and no existing case is relaxed, deleted or narrowed.
approval | scripts/red-first.test.mjs | P6 | 2026-11-05 | human-owner | owner instruction 2026-11-05 (external-verify correction round): "hazlo" — an explicit, recorded owner order to authorize the protected-suite edit that closes the blocker the external verification reported
```

## Questions

`none — no questions` — the correction round was scoped by the owner's
instruction above: the `introduced()` index and its missing fixture case only.
