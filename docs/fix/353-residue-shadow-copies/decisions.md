# Decisions — fix 353 (residue-shadow-copies)

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/residue-dimensions.test.mjs | P1 | 2026-11-01 | execute-phase | S1-S4 deliverables: the discipline suite that pins the `#340` contracts is extended with five new pins for the `#353` wording — tests are written before the prose they pin, and no existing assertion is weakened
justification | .worktrees/353-residue-shadow-copies/scripts/residue-dimensions.test.mjs | P1 | 2026-11-01 | execute-phase | same file reached through the unit's worktree path, which is how the guard resolves it while the unit runs in `.worktrees/`
```
