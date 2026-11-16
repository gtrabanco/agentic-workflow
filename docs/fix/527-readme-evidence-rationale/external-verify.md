# External verify receipt — fix/527-readme-evidence-rationale

2026-11-17 — full verdict (no prior `EXTERNAL VERIFY` block or review verdict
existed for this unit: PR #585 carried 0 reviews and 0 comments at run time).

```
EXTERNAL VERIFY — base: 7b18226b · head: e4a61ed1
Verdict: PASS (no blockers)
```

Full verdict text from 2026-11-17 run:

```
EXTERNAL VERIFY — base: 7b18226b · head: 7dff1c21
Advisories: 3 (A1–A4 originally, A3 dropped by fix 560's merged main — advisory class, no action needed)
  A1 issue #527 forge labels — `gh issue view 527 --json labels,state` → `OPEN` with `backlog` + `postponed` at head while the roadmap row and D1 record the owner's un-postpone. Why advisory: no S#/O#/AC claims forge-label state; the PR's `Closes #527` resolves the issue at merge.
  A2 docs/research/2026-11-12-input-quality-and-editing/README.md:94 — dated research record still narrating the postponed triage. Why advisory: pre-existing at base, immutable-history class (same as `docs/LOGS.md` dated sections); current status owned by the roadmap.
  A4 docs/fix/527-readme-evidence-rationale/SPEC.md Log E11 — recorded `changed: 4`; observed `changed: 5` at final head (journal fragment and index commits landed after E11's run). Why advisory: receipt timed mid-branch; the verdict `verdict: empty`, `executable: 0` reproduces unchanged at head.
Completeness: S1–S7, S5a all resolved — P1–P4 all green. O1–O12 all `verified` with every validator re-run. No open ids.
Spot check: 142 pass · 0 fail — match (G4's recorded output).
Verdict: PASS (no blockers)
```

The `MERGEABLE / CLEAN` state at `e4a61ed1` confirms the external-verify resolution (B1 removed, scope to exclude own carriers) is sound.

## Post-merge notes (if merged)

The `postponed` label on #527 can be removed at merge time (it was a dated trigger, now un-postponed and applied). A2 is a dated research record — history, not status, so nothing to fix.
