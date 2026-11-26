# External verify — fix/716-batch-scheduler-surface-vocab

2026-11-26 — full verdict (no prior `EXTERNAL VERIFY` block or review verdict existed
for this unit).

```text
EXTERNAL VERIFY — base: 022769f8be96b441ec11ffede7ed85e2490e3997 · head: a935a8336
Blockers: 2 —
  (B1) docs/fix/716-batch-scheduler-surface-vocab/SPEC.md:358 (`## Log` P9 line) —
       "the obligations ledger closed (`19 verified`)" while the ledger itself
       (planning-obligations.md:33) carries O19 `in-progress` and D11
       (SPEC.md:360) records the honest open hand-over. The P9 task wording
       (SPEC.md:284) has the same tension: its validator begins "local-gate exits
       0", an outcome no run produced (D11). Reproducer: `bun
       packages/agentic-workflow/bin/agentic-workflow.mjs verify
       docs/fix/716-batch-scheduler-surface-vocab/SPEC.md --no-git` →
       `VERIFY REFUSAL — 1 violation(s) · obligations-open: obligations row O19 is
       not closed (status: in-progress)` (re-run here, exit 1); the same bytes
       then read a closed ledger two sections earlier. Base: the unit dir does
       not exist at 022769f8b — change-caused. Smallest action: amend the
       `## Log` P9 line (and :284's task wording) to the D11 hand-over so the
       receipt text and its ledger agree — corrections via /aw-local-apply.
  (B2) docs/fix/716-batch-scheduler-surface-vocab/SPEC.md:348 (E12), :358 (P9),
       :359 (D12), :360 (D11) — four citations name "K6/K8", but
       `## Known pre-existing issues` (known-issues.md) carries only K1–K7; the
       workflow-doctor red (the would-be K8) was never written as a row.
       Reproducer: `rg -n 'K8'
       docs/fix/716-batch-scheduler-surface-vocab/known-issues.md` → 0 matches
       while `rg -c 'K8' docs/fix/716-batch-scheduler-surface-vocab/SPEC.md` ≥ 4.
       Base: the citations landed at a77928c17..3ef898995 — change-caused.
       Smallest action: add the K8 row (or renumber the citations onto the
       existing K-ids) in the same correction batch as B1.
Advisories: 4 —
  (1) scripts/findings-corpus.test.mjs — frozen count stale (1178 !== 1173): 1
      fail identical at the base clone and at head (K6, verified in a detached
      base-commit clone in mktemp scratch, `bun test` → 16 pass/1 fail both
      sides).
  (2) scripts/workflow-doctor.test.mjs — 3 fails identical at the base clone and
      at head (the battery E12 names pin/available-doctor cases) —
      pre-existing on this box, not a regression (K8's subject material, once
      B2's missing row exists).
  (3) packages/agentic-workflow-schema/test/verification-preflight.test.mjs —
      F99's wall-clock bound (≤50 ms assertion) flaked once under the full
      package run (953 pass/1 fail) and passes standalone; the file is
      untouched by this branch's diff (stability check → load, not the change;
      K7 class).
  (4) K7's contended-box suite wall (`doc.structure` owner-parity 96–202 s
      under load 13–17 on 6 cores) — disclosed by the unit, standalone green
      (E10/E12); not re-run here.
Sibling sweep: the closed-list retirement is clean everywhere except the unit's
own receipt (B1/B2) — `skills/<name>`/`packages/<name>`/`scripts`/`docs`/
`template`/`.github` appears only at the owner page (PLAN.md:133, § The surface
vocabulary), the new resolver's header narration, and negative test
assertions; stale `surfaceKeyFor` / `scripts/batch-scheduler.mjs:574-591`
citations live only in dated historical records (docs/research/2026-11-17-*,
unit 621's planning ledger). CONFIG.md, the two unit-doc templates, the two
issue forms and the scaffold references restate the new truth and point at the
owner. No lost qualifier and no conditional↔absolute flip found in the removed
prose (PLAN.md rule 3's rewrite keeps the conditional form; the templates' "no
reader requires this section" survives; ISSUE_PROCESS.md's "Never hand-write"
survives).
Completeness: S1–S10 all resolved (P1: S1 · P2: S2,S3,S4,S6,S7 · P3: S5,S8 ·
P4: S2,S4,S9 · P5: S2,S4,S7,S9 · P6: S6 · P7: S3,S8,S9 · P8: S1,S3 · P9: all)
— every S# maps to a task with a validator that re-ran green here (planner
suite 106/0, schema package 953 pass/1 load flake, config CLI set/verify,
byte-identical differential), except O19: open, disposition owed — B1 names
the receipt's own contradiction. Independent wording-derived probes, not the
change's own tests: foreign-tree lanes `src/pages`/`src/shared`/`migrations` +
`src/config` via discovery (S2/S9); declared vocabulary authoritative, an
omitted tree degrades honestly `surface-unknown-issue-<n>` (S8/D2); discovery
bounds — hidden dirs, `node_modules` and missing trees resolve nothing, deepest
match wins, two-segment bound, bare root keeps its spelling (D3); empty
surfaces array = undeclared, shipped roots answered (D4); transitive tree-root
join `src` → `src/pages` lane (D6/O10); malformed config →
`unavailable-surface-vocabulary-the-config-file-is-not-valid`, plan still prints,
shipped roots only (D7/O11); the emitter: stdout is the paste block alone, one
stderr advisory naming the `config set` line exactly when discovery answered,
`- surface-unknown` for a body naming nothing, exit 0, no state writes (S6/D5/
O13); the branch-diff side through the same resolver — `src/pages/a.ts` covers,
`src/config/b.ts` leaves `claimed_surface: ["src/pages"]` (S4); consumer-shaped
set → 3 parallel lanes, no `general` lane, no findings, no degradation (S7);
base-vs-head differential over identical root bytes → 4815 bytes byte-identical
(S10/O18). Declared commands re-run: planner suite exit 0 (E3 match) · schema
package `bun run test` 953 pass/1 flake (E4's 954/0 no longer reproduces under
load — flake, advisory 3) · `rg` pins exit 1/1/1/1 and count 1 (E7 match) ·
`config set` exit 0 + read-back + refusal path (O7/E8 match) · `runner config
set` engineegrading · docs-generate --check exit 0 PASS (O17/E9 match) ·
lint-changeset exit 0 ok (O17 match) · skill-lint 0 findings ·
check-skill-context PASS 33 skills · O1's two checks reproduce (unit-only
conventional commits; the L2-quote-only rg matches) · O15's three-file citation
check reproduces.
Spot check: `bun test scripts/batch-scheduler.test.mjs` → exit 0, 106 pass /
0 fail — matches E3's reported 106/0.
Verdict: NEEDS-DECISION (2 — B1, B2)
```

Incident disclosure (benign, no tracked bytes): the differential's evidence step
ran `bun run build` inside this worktree to pin the head side's `dist/` against
the committed `config.ts` — the schema package's gitignored build output only;
`git status` clean before and after, `dist` gitignored, projections still
verified in-sync by the package's own committed-projection tests, no stash, no
commit, no branch in the live repo (the base-commit checkout happened in a
detached `mktemp` clone).

Probes ran only in `mktemp` scratch; every mutation-capable invocation was
pinned (`--no-state`, `--issues-file`, scratch roots, `--project <scratch>`).

---

Addendum — 2026-11-26, correction batch (request verbatim: "triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff"):

- **B1 folded** — the `## Log` P9 line no longer claims a closed ledger:
  `SPEC.md:358` now reads "the obligations ledger handed over open (D11): 18
  rows `verified` + `O19 in-progress` with its recorded cause", and the P9 task
  wording (`SPEC.md:284`) carries the same hand-over parenthetical. The ledger
  itself is untouched — flipping O19 would be self-approval of an outcome no
  run produced (D11 stands). Reproducer green: `rg -n '19 verified' SPEC.md` →
  0 matches (was 1 at :358).
- **B2 folded** — the missing row written: `known-issues.md` now carries K8,
  the `scripts/workflow-doctor.test.mjs` red, with its base-commit
  reproduction (detached `mktemp` clone at `022769f8b` → 20 pass / 3 fail,
  identical at this head; the suite and its implementation untouched by this
  branch's diff). Reproducer green: `rg -n 'K8' known-issues.md` → 1 match
  (was 0); every K-id the SPEC cites (K6, K7, K8) now resolves to exactly one
  row. The PR body's two pre-existing red paragraphs already cite `K6`/`K8`
  and read honestly — they now land.
- **Advisories triaged, none fixed** (each to its owning surface, per the
  correction bounds — the verdict's smallest actions name them):
  (1) K6's frozen count (1173 vs 1178) belongs to the unit that landed the
  five rows; (2) the workflow-doctor battery fixture belongs to the surface
  that owns the doctor pin read — this batch records it (K8), repairs it
  nowhere; (3) the F99 wall-clock flake is load on an untouched file — no edit
  can own it; (4) K7's suite wall is disclosed (E12), standalone green.
- **Recheck (blockers only, all green)**: B1 greps 0; B2 grep 1 + full K-id
  resolution sweep; the honest state preserved — O19 stays `in-progress` and
  `runner verify SPEC.md --no-git` still refuses exactly once, on O19 alone
  (`obligations-open`) — the machine reading of the same hand-over the receipt
  text now states; O1's rg over the unit dir reports only the rule's own
  statement sites (its validator row, AC1 and the `## Log` L2 quote) and
  nothing beyond them, `docs-generate --check` PASS (the projections are untouched by a
  docs-only batch), ledger sweep `O1–O18 verified · O19 in-progress`.
- **Nothing else broke**: `git diff` scope for the batch is the two unit-dir
  files and this addendum — no code, no test, no projection, no state file.
  The planner suite and the schema package were not re-run: no executable path
  changed (`test-impact` verdict `empty` class).
