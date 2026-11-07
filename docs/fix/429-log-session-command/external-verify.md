# External verify — fix/429-log-session-command

2026-11-07 — first external verdict for this unit (no prior receipt existed).
Read-only run; the only write is this receipt. Every validator below was run by
the verifier in this worktree; the handler/writer paths ran only inside the
declared suites' `mktemp -d` fixtures — `session-close.mjs close` and
`journal aggregate` never executed against the live tree, and
`git status --porcelain` after the run named nothing.

```
EXTERNAL VERIFY — base: e1d94057a9204b02f2d7597e015f3855279f9a1c · head: 95f96ab3
Blockers: 0
Advisories: 4 —
  1. docs/fix/429-log-session-command/SPEC.md (Retirements evidence row): the
     cited command `rg -c 'registerCommand' factory.ts → 3` reproduces 4 at
     BOTH main and HEAD (catalogue loop, toRegistrar wrapper, settings pair =
     2 lines). The invariant it evidences — unchanged between sides, no new
     registration site — is real; the cited count is not. Smallest action:
     correct the count in the receipt row (route: /aw-local-apply).
  2. Pre-existing `pi-compat-guard` TS2307 class (blocks CI green on PR #448):
     proven at base — the failing specifiers exist verbatim at main in
     packages/pi-agentic-workflow/src/auto-log-session.ts:32 and
     src/extension/auto-log-session-wiring.ts:24–26; this unit adds one more
     occurrence of the same class at src/log-session-invocation.ts:36.
     Disclosed in E12/D1; repairs belong to its own unit.
  3. `bun scripts/lint-changeset.mjs` (whole directory) exits 1 identically at
     main on .changeset/374-pluggable-session-journal.md (cites the gitignored
     runtime path .agentic-workflow/journal-store/entries.db) — reproduced
     against main's copy here; not this unit's failure.
  4. The branch carries two paths outside the unit's declared set — the carrier
     fragment rename (R100, bytes untouched, aligned to the siblings' name) and
     this unit's own session entry. Owner-authorized via D1/E14 and disclosed
     in the log; recorded here so the merge review sees it deliberately.
Sibling sweep: clean (no surviving old-truth mention; the only defect found is
  advisory 1's inaccurate evidence figure)
Completeness: S1–S21 all resolved (P1–P8 with (Implements: S#)); S21 is
  prospective (correction-bounds rule), no code owes a validator
Obligations: O1–O17 all `verified`; every validator cell re-ran green here
  (incl. package suite 555 pass · session-close 28 · journal 24+11 ·
  ledger-ownership 14 · phase-lint PASS fingerprint 1e84ef99…34fe7f)
Spot check: node scripts/run-root-suite.mjs --jobs 3 → exit 0, all PASS —
  match (also matched verbatim: G1's fingerprint, G3's 555/0, E5's per-file
  counts)
Verdict: VERIFIED
```

Merge-decision note for the owner (outside this verdict's scope): PR #448
still cannot read green in CI until the pre-existing `pi-compat-guard`
crate-resolution defect (advisory 2) is repaired in its own unit.

---

## Correction batch 1 — 2026-11-07

Owner request verbatim: "arregla tanto los blockers como los advisories, verifica
con evidencia la reparación y planifica y evalua antes de arreglar cual será la
ruta adecuada para arreglar el problema". Scope: advisories A1–A4 above
(0 blockers to repair — that half is `empty`). Plan and route per advisory are
in the unit doc's `## Log` (`F1`–`F3`, `P5`); this section is the recheck.

```
EXTERNAL VERIFY — recheck (advisory set) — base: e1d94057a9204b02f2d7597e015f3855279f9a1c · head: 95f96ab3 + correction batch 1 (uncommitted at run time)
Blockers: 0
Advisories: 0 — A1 corrected (figure 3 → 4, verified by re-running the
  cited command: 4 at both main and head); A2 repaired (guard links the
  workspace dependencies; RED observed on the absent export, then
  scripts/local-gate.test.mjs 40 pass); A3 repaired (ignored runtime
  citations answer to git check-ignore; RED observed on the 374 citation,
  then scripts/lint-changeset.test.mjs 16 pass); A4 reconciled in `## Log`
  P5 (24 paths, tier recomputed to `high`/`publish` and recorded verbatim)
New finding (reported, not cycled): the A2/A3 repairs change the unit's tier
  verdict — `bun scripts/ceremony.mjs tier classify --base main` now answers
  `high` with the `publish` signal, which owes /review-change + /audit-pr
  before merge while the owner's inline protocol (S16) forbids running them.
  Recorded in `## Risk tier`; the owner decides ceremony vs the reworded-374
  route that holds `standard`.
Sibling sweep: clean (the guard's new `DEPS` edge is narrated in the graph's
  own comment and pinned by the suite that reads it; no surface still claims
  `pi-compat-guard` has no prerequisites)
Completeness: S1–S21 unchanged; O1–O17 unchanged (no row reopened — the batch
  repairs pre-existing advisories, it does not reopen a claimed behaviour)
Spot check: bun scripts/local-gate.mjs → exit 0, PASS — 12 step(s) in 210s —
  match (before the batch: FAILED at pi-compat-guard, step 1 of 12)
Verdict: VERIFIED (advisory set closed; one decision routed to the owner)
```

Evidence, observed in this worktree:

| check | before | after |
|---|---|---|
| `bun scripts/local-gate.mjs --only pi-compat-guard` | exit 1, 5 × TS2307 | exit 0, both legs `tsc --noEmit clean` |
| `bun scripts/local-gate.mjs` (full) | FAILED at step 1 of 12 | exit 0, `PASS — 12 step(s) in 210s` |
| `bun scripts/lint-changeset.mjs` (whole dir) | exit 1, `error: 374-…` | exit 0, 35 files ok |
| `node --test scripts/local-gate.test.mjs` | 37 pass + 1 suite-level failure (absent export) | 40 pass 0 fail |
| `node --test scripts/lint-changeset.test.mjs` | 15 pass 1 fail | 16 pass 0 fail |
| `rg -c 'registerCommand' …/factory.ts` | evidence row said 3 | 4 at `main` and at head |

