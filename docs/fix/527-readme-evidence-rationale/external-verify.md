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

---

**2026-11-16 — correction batch addendum (factual record, not a verdict).** One
batch folded B1 and triaged A1–A4 under in-doc specs S8/S9 (the session's two
verbatim asks, L3):

- **B1 folded** — the `## Retirements` receipt restated (SPEC.md:107-112): the
  claim now reads "no consumer outside this unit's own record" and the shipped
  command is the scoped form
  `rg -c 'Why it works this way' --glob '!README.md' --glob '!docs/ROADMAP.md' --glob '!docs/fix/527-readme-evidence-rationale/**' --glob '!.agentic-workflow/**'`
  → no match, exit 1, with every excluded mention disclosed as this unit's own
  (receipt, roadmap row, journal fragment). Ledger O13 verified (E19).
  The as-recorded unscoped command keeps printing this unit's own carriers by
  design — the fix narrowed the claim and shipped the scoped form; a delta
  recheck runs the scoped form (exit 1) and reads the restated sentence.
- **A1 executed** — `gh issue edit 527 --remove-label postponed` under D1's
  recorded authority: labels `["backlog","postponed"]` → `["backlog"]`
  (machine consumers: `scripts/batch-scheduler.mjs:71`,
  `workflow-status.mjs:1226-1228` — PE-015). Ledger O14 verified (E19).
  `backlog` kept: not a LABELS.md verdict label; D1 supersedes only `postponed`.
- **A2, A3 disposed** — no tree change: the 2026-11-12 decision record and the
  LOGS entries are dated history; the load flake is environmental (record: L4).
- **A4 recorded** — head re-observation `test-impact --base origin/main` →
  `empty`, `changed: 6`, `executable: 0` (E20).
- **Cut-time repairs under D7** — the owner's concurrent rebase (base
  `7b18226b` → `9e6c431a`, branch commits re-picked, `b055ba82` projection
  fix, force-with-leave push observed live 16:05 UTC) made O7's validator cell
  and AC9's frozen `--base 7b18226b` judge main's own commits
  (`targeted`); both moved to `--base origin/main`, assertions unchanged, and
  `ac-hash` recomputed after the AC repair (`7145a4e3…`).
- **Disclosures** — this receipt file vanished from the untracked worktree
  during the owner's integration and was restored verbatim with its date
  corrected to the true run date 2026-11-16 (the unit's frozen log lines carry
  a pre-existing off-by-one against their 2026-11-16 commit dates; append-only
  history, left untouched). The first `local-gate` attempt red on load-timing
  (`red-first` O4's 30 s budget at load 15.7; the gate itself
  `verdict: PASS` standalone), retry green — both in G8.
- **Re-run green on the batch head** — O13 exit 1 · O14 `["backlog"]` · O15
  `local-gate: PASS — 15 step(s) in 678s` · O7 `verdict: empty` ·
  `verify` VERIFY PASS (obligations-closure ok, 0 violations) · `phase-lint`
  verdict PASS (P1–P5 6/6) · `docs-generate --check` PASS · `roadmap-settle`
  PASS (218/0) · `promise-coherence` PASS (8 checked · 12 skipped) ·
  `check-skill-context --documents` PASS.
- Owner delta-verify: re-run the scoped reproducer + the O13–O15 and repaired
  O7 validators, then the merge.
