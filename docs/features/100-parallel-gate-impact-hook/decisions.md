# Decisions — unit 100 (parallel-gate-impact-hook)

Decisions taken while delivering the unit, and the path-protection records the
Tier 1 guard reads. Append-only.

## Justifications

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/run-root-suite.test.mjs | P1 | 2026-11-05 | execute-phase | the pool contract is a new sibling suite for an existing script (the script predates the red-first cutoff, so the pair is grandfathered there); it is authored test-first as P1's red evidence and no existing suite covers scheduling
justification | scripts/local-gate.test.mjs | P1 | 2026-11-05 | execute-phase | the `tests:` marker, the verdict parser, the `--push-base` dry-run matrix and the regenerated hook body extend the gate suite that already owns every one of those surfaces; the existing assertions stay byte-identical
```

## Assumptions

- **A1 — 2026-11-05** — the hook's push base is the remote tip from the
  pre-push stdin line (single non-delete ref only); a new branch falls back to
  the merge-base with the remote default branch; anything unprovable runs the
  full gate. Fail-safe by construction.
- **A2 — 2026-11-05** — `schema-build` is marked `tests: true` (it exists only
  so the suites can resolve `dist/`), so a prose-only push skips it too.
