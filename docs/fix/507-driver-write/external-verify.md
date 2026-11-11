# External verify — fix/507-driver-write

Date: 2026-11-11 (run 01:33Z) · base `27275c94` (`origin/main`) · head `76ac4b0e` ·
first receipt for this unit (no prior `EXTERNAL VERIFY` block → full verdict, once).
All mutating paths (full `docs-generate`, `--install`, two-branch merges, `local-gate`)
ran only in `mktemp -d` clones of head; the live tree was used read-only and was
byte-clean (`git status --porcelain` empty) after the run. No commit, push, branch,
or forge mutation was made — this file is the receipt, written uncommitted.

```
EXTERNAL VERIFY — base: 27275c94 · head: 76ac4b0e
Blockers: 2 —
  1. scripts/docs-generate.mjs:463 — the fix-row `roadmap_summary:` override never applies.
     Reproducer (mktemp clone of head): frontmatter `roadmap_summary: FIX-OVERRIDE-PROBE` in
     `docs/fix/443-doc-index-auto-hybrid/SPEC.md` → `bun scripts/docs-generate.mjs` →
     `Roadmap: docs/ROADMAP.md — unchanged`, grep 0 in `docs/ROADMAP.md`; the identical probe on a
     feature unit applies (grep 1). Single-cause proof: in the same scratch, sed line 463 to
     `const slugColumn = 1;` → rerun → row 443's Notes cell becomes `FIX-OVERRIDE-PROBE` (grep 1).
     Cause: the Fixes table is `| Issue | Topic | Status | Notes |`, so `slugColumn = 2` reads the
     Status column (verified `tableCells`: `["[#443]…","doc-index-auto-hybrid","done · [#486]…",…]`),
     which never equals a unit slug; Topic is index 1. Row shape verified (4 cells = header columns),
     and the field parses (`collectSources` → `roadmapSummary: "FIX-OVERRIDE-PROBE"`).
     Base-vs-head: `git show 27275c94:scripts/docs-generate.mjs | rg -c "roadmapSummary|syncRoadmapDocument|slugColumn|Roadmap: docs"` → 0 — no sync existed at base, so this claimed behavior is change-caused.
     Claim sites: SPEC.md Non-goals ("preservación verbatim + override `roadmap_summary:`" for fix
     rows), AGENTS.md:461-465 ("the two roadmap tables … overrides its row's summary cell"),
     docs/ROADMAP.md:16-22 (same claim), syncTable's own doc comment. No test pins fix-row override
     (`scripts/docs-generate.test.mjs:491` is feature-only; `:507` covers only "never appended").
     Stability: the same pipeline applies on feature rows, so the reproducer stays off untouched code.
     Smallest action: `scripts/docs-generate.mjs:463` → the Topic column for both kinds
     (`const slugColumn = 1;`) + a red-first test pinning a fix-row override — route to `/aw-local-apply`.
  2. scripts/docs-generate.mjs:846 — `--check` prints `Roadmap: docs/ROADMAP.md — updated` for a
     write it never performs (the write is guarded by `mode === "generate"`, line ~837; the test file
     itself states "The one live-tree case is a read-only --check").
     Reproducer (mktemp clone of head): delete one feature row from `docs/ROADMAP.md` →
     `bun scripts/docs-generate.mjs --check` → block reads `Roadmap: docs/ROADMAP.md — updated`
     immediately above `docs/ROADMAP.md: stale` / `verdict: DRIFT`, exit 1, while `git status` shows
     the row still missing — nothing was updated; only a generate run restores it.
     Base-vs-head: base emits no `Roadmap:` line at all (0 matches for `Roadmap: docs` at
     27275c94), so the false claim is change-caused; dry-run (line 845) already distinguishes
     "would update", check mode falls into the generate arm.
     Smallest action: give check mode its own arm (`roadmapChanged ? "stale" : "unchanged"`),
     matching the `stale` issue line in the same block — route to `/aw-local-apply`.
     Severity note: wording only — verdict/exit/staleness naming are all correct and no machine
     consumer parses the line.
Advisories: 5 —
  1. scripts/docs-generate.mjs:503,520 (syncRoadmapDocument) — the Fixes-scan line offsets are built
     once from the pre-sync text while the Features sync inserts rows earlier in the file; the scan
     [from,to) therefore slides with the append count. Why advisory: on shipped bytes it never bites
     (all fix overrides are dead under blocker 1; generate stayed idempotent and `--check` PASS after
     runs appending 1…9 rows). Re-trigger: with only blocker 1 repaired in scratch, a run appending
     6 feature folders shifted the scan start into the Features table, misdetected the header
     (5 cells), and silently skipped every fix-row override (fresh probe on row 410 → grep 0, while
     k≤3 probes applied). Fixing blocker 1 without recomputing the offsets per kind ships that hole.
  2. template/AGENTS.md:117 — the guide every scaffolded project inherits documents
     `bun scripts/docs-generate.mjs` and the roadmap tables but never states the machine-sync /
     `roadmap_summary:` behavior that now runs in those projects (the repo's own AGENTS.md:461-465
     got the paragraph). Omission on a sibling surface, not an assertion of the old truth.
  3. docs/fix/507-driver-write/SPEC.md:155-156 — task P5 still carries `(Implements: S7)` and
     "actualiza el gate", but no S7 exists (the SPEC's own D3 records the citation as a cut defect)
     and no gate code change was needed or landed (triaged steps make P5 verification-only).
     The validator re-ran green here (gate `docs-generated-projection` → exit 0, ROADMAP covered by
     `docs-generate --check`). Recorded disposition exists (D3); the dangling task line remains.
  4. docs/features/67-serena-provisioning/SPEC.md:617 — "BOOTSTRAP_WRITE.md step 8, UPGRADE.md
     step 8" now names different content after this change inserted bootstrap step 5; already stale
     at base (earlier renumberings), so base-present — a dated unit-doc record.
  5. docs/LOGS.md:4055 — "Post-write gate is BOOTSTRAP_WRITE.md step 5" — dated session-journal
     entry in the append-only carrier; historical record, not current-behavior narration.
Sibling sweep: clean — every mention of the rewritten surfaces was re-checked: `.gitattributes`
  coverage (root + `template/` both carry `docs/generated/**` and `docs/ROADMAP.md`,
  pinned by `scripts/docs-generated-merge.test.mjs:360`), driver "covers only docs/generated"
  phrasing (only the verbatim request quote at SPEC.md:44 and fix/420's still-true residual-case
  sentence survive), BOOTSTRAP_WRITE step numbers (UPGRADE.md 5→6 updated; SKILL.md points at
  unaffected step 4; the two stale step mentions are dated carriers → advisories 4–5),
  "three pages" comments (still true — the roadmap is a synced file, not a fourth page),
  findings count 1150→1152 (no other surface asserts 1150), `roadmap_summary` mentions
  (both template pairs + repo templates + AGENTS + ROADMAP + code + tests).
Completeness: S1–S6 resolved — P1/S1 (`docs-generate --check` PASS, roadmap written, 28 tests),
  P2/S2 (armed merge suite 16 pass + my own two-branch append collision: driver resolved both files,
  regenerate restored both rows, `--check` PASS), P3/S3,S4,S6 (clean clone: `--install` exit 0,
  driver/name config written, second run "unchanged"; `template/.gitattributes` both lines;
  BOOTSTRAP_WRITE step 5 / UPGRADE prose present and its exact commands executed green),
  P4/S5 (both template pairs carry the key; generate falls back to One-line and never fails).
  AC-S7 (authority S3 item 3 per D3) verified: full gate run green incl. docs-generated-projection.
  Obligations O1–O4 all `verified` with their validators re-run green here; no planned/deferred rows.
  Open ids: none — P5's dangling `S7` citation is advisory 3, not a dropped need.
Spot check: bun scripts/local-gate.mjs --skip-network → match (G2 reported PASS — 13 steps,
  604-test root suite; scratch clone of head re-run: PASS — 13 step(s) in 156s, 604 pass / 0 fail,
  docs-generated-projection exit 0 with `Roadmap: docs/ROADMAP.md — unchanged`). Disclosed: two
  intermediate scratch runs flanked it with reds on steps this change does not touch —
  journal-carrier-check (transient, passed isolated and in both later runs) and
  setup-env.test.mjs (10s per-test budget, subprocess `status null` under the 4-worker pool;
  isolated: 76 pass). Neither reproduces on the unit's own surfaces.
Verdict: NEEDS-DECISION (open blockers: scripts/docs-generate.mjs:463, scripts/docs-generate.mjs:846)
```

---

Date: 2026-11-11 (run 16:10Z) · delta verdict — corrections have landed since receipt 1
(base `27275c94` / head `76ac4b0e`): correction batch 1 (S8–S13), correction batch 2 (rebase on
the #498 base, S14–S16) and S17 (the logs class). Re-verified receipt blockers 1–2 with fresh
reproducers, the delta diff (batch 1 + batch 2 + S17 + the rebase restores), the sibling sweep,
completeness/obligations closure, then the spot check. All mutating paths (probe generates, the
deleted-row `--check`, both `--install` rounds, every `local-gate` run) ran only in
`mktemp -d` clones of head; the live tree was used read-only and was byte-clean
(`git status --porcelain` empty) at bind and at close. No commit, push, branch, or forge
mutation was made — this file is the receipt, written uncommitted. Head note: two journal-fragment
commits (`5a601bba`, `468d9bf9`, both `.agentic-workflow/journal/*.md` additions only) landed
from a concurrent session during the run; head was re-bound at `468d9bf9` for the spot check and
at close, and every suite was re-run green at that final head via the gate.
Verification incident (disclosed and named per §0): one accidental live-tree execution of
`scripts/docs-generate.mjs` in generate mode — the probe was intended for scratch, but the
script anchors `REPO` to its own file path (`scripts/docs-generate.mjs:57-58`), so the live
copy ran against the live tree. Observed output: `Files: 0 written · 0 deleted · 3 unchanged`,
`Roadmap: docs/ROADMAP.md — unchanged`, `verdict: PASS`; `git status --porcelain` showed no
modification before and after. Zero bytes written — nothing to clean; the probe was re-run in
scratch with the scratch's own script.

```
EXTERNAL VERIFY — base: b2864d03 · head: 468d9bf9
Blockers: 0 — both receipt blockers re-verified closed at head with fresh mktemp reproducers:
  1. (receipt 1 blocker 1, scripts/docs-generate.mjs:463) fix-row `roadmap_summary:` override:
     scratch clone of head + `roadmap_summary: FIX-OVERRIDE-PROBE` in
     `docs/fix/443-doc-index-auto-hybrid/SPEC.md` + scratch's own `bun scripts/docs-generate.mjs`
     → `Roadmap: docs/ROADMAP.md — updated`, `grep -c FIX-OVERRIDE-PROBE docs/ROADMAP.md` → 1,
     row 443's Notes cell = `FIX-OVERRIDE-PROBE`. Base side re-proved at the current base:
     `git show b2864d03:scripts/docs-generate.mjs | rg -c "roadmapSummary|syncRoadmap|Roadmap: docs"`
     → 0 (no sync at base). Code: `slugColumn = 1` (scripts/docs-generate.mjs:463); the fix-override
     case is pinned (`scripts/docs-generate.test.mjs:563`) and the suite re-ran 31/0.
  2. (receipt 1 blocker 2, scripts/docs-generate.mjs:846→852) `--check` wording: scratch clone of
     head + feature row 494 deleted from `docs/ROADMAP.md` + `bun scripts/docs-generate.mjs --check`
     → `Roadmap: docs/ROADMAP.md — stale`, `verdict: DRIFT`, exit 1, and `git status` still shows
     only the probe deletion (check wrote nothing). Check arm is `roadmapChanged ? "stale" :
     "unchanged"` (:852); dry-run keeps `would update` (:850), generate keeps `updated` (:853).
     Pinned by `scripts/docs-generate.test.mjs:598`; suite 31/0.
  Receipt advisory 1 (S10 scan offsets) also closed: `scripts/docs-generate.test.mjs:619`
  "fix overrides survive a run that appends six feature rows" → green in the 31/0 run.
Advisories: 5 —
  1. docs/fix/507-driver-write/SPEC.md:195 — "(E-line below)" names a tier re-run E-line that does
     not exist anywhere in the unit's Log. Why advisory: the claim's substance reproduces here —
     `bun scripts/ceremony.mjs tier classify --base origin/main` → exit 0, `"tier": "standard"` —
     so only the receipt pointer is dangling. Smallest action: add the E-line or reword the pointer.
  2. docs/fix/507-driver-write/SPEC.md:69,87,258 vs :386 — the S7 disposition cites `D3`, whose
     record lives only in the dated journal (`docs/LOGS.md:5668`, D1–D5), while the unit doc's own
     Log carries `D1 — (none yet)`. Why advisory: the pointer resolves and both carriers agree no
     owner verdict has landed; it is a carrier split, not an assertion of old truth.
  3. docs/LOGS.md:4055 — receipt 1 advisory 5's dated "Post-write gate is BOOTSTRAP_WRITE.md step 5"
     mention persists. Why advisory: disposition `wontfix` recorded (SPEC.md:99-101) — the
     append-only journal carrier refuses a hand edit (`scripts/log-immutability.mjs`).
  4. Reported test-count narration — E10 and the queued fragment in `5a601bba` report "644 tests";
     observed `645 pass / 0 fail` for the crate suite at both `95a83020` (E10's head) and
     `468d9bf9`, with byte-identical test trees across `95a83020..HEAD`. Why advisory: off-by-one
     narration only — every other reported number matched exactly (docs-generate 31/0,
     docs-generated-merge 18/0, shared-doc-merge 12/0, writer.merge 15/0, findings-corpus 14/0,
     `rg` counts 3/1/1, changeset `ok 507-driver-write.md`), and the gate verdict matches.
  5. Scratch spot-check environment (not change-caused; `scripts/local-gate.mjs` is untouched by
     this branch): the first `local-gate --skip-network` in a bare clone failed at `schema-build`
     (`tsc: command not found` — `--skip-network` skips `workspace-install`), and that same run's
     root-suite showed one transient red under the 4-job pool (receipt 1's disclosed flake class)
     that passed isolated (exit 0) and green on the full re-run after `bun install --frozen-lockfile`.
     Why advisory: environment + an unstable pool flake that fails the stability check — it never
     reproduced on the unit's own surfaces.
Sibling sweep: clean — every mention of the removed/rewritten truths re-checked: `slugColumn = 2`
  survives only inside receipt/unit-doc quotes of the fixed defect (SPEC.md:72,284;
  external-verify.md:19); `docs/ROADMAP.md merge=docs-generated` survives only as the prohibition/
  history (SPEC.md:113-133,228,287,415 and the closed-set pin's own comment + `doesNotMatch`
  assertion, scripts/docs-generated-merge.test.mjs:394,427) — root and template `.gitattributes`
  each claim every path exactly once, pinned by the template-registry test and `git check-attr`
  (ROADMAP→agentic-shared-roadmap, LOGS→agentic-shared-logs, generated→docs-generated);
  `merge=docs-generated` count in AGENTS.md → 1 (:292, the `docs/generated/**` attribute) and the
  S16 residual sentence names the class registry as ROADMAP's home while keeping the table-sync
  wording (AGENTS.md:290-301); "covers only docs/generated" survives only in the verbatim request
  quote (SPEC.md:44) and fix/420's still-true residual sentence; BOOTSTRAP_WRITE/UPGRADE step
  pointers all current at head (arming = BOOTSTRAP step 5, Serena = BOOTSTRAP step 10 /
  UPGRADE step 9 — features/67:617 corrected, UPGRADE's step 6 capability-gate pointers updated
  5→6 by this change, matching the inserted step); "three pages" comment (scripts/docs-generate.mjs:549)
  still true — the roadmap is synced separately, not a fourth generated page; findings count 1153
  (no surface asserts 1150/1152 for the corpus); `roadmap_summary` present in all four template
  pairs + template/AGENTS.md:124 (S12); arming prose in template/.gitattributes, BOOTSTRAP_WRITE:32-57,
  UPGRADE:106-110 carries both `--install` commands and the four class lines; queued fragments
  (5a601bba, 468d9bf9) assert only current facts.
Completeness: S1–S17 resolved — S1 (docs-generate --check PASS live, exit 0,
  `Roadmap: docs/ROADMAP.md — unchanged`), S2 (docs-generated-merge suite 18/0 incl. the armed
  #269×#505 reproducer and the closed-set pin), S3/S6 (scratch clean checkout: both `--install`
  → exit 0, `written` then `unchanged` on round 2, all six config keys non-empty), S4
  (template registry exactly as pinned; check-attr single-claim), S5 (all four template pairs
  carry the field; generate green without it), S7 (recorded disposition — SPEC.md:69 "S7 stays
  unused on purpose" + AC-S7 authority note + D3 in docs/LOGS.md:5668), S8–S10 (P6, the three
  correction cases in scripts/docs-generate.test.mjs:563/:598/:619, suite 31/0, reproducers
  above), S11 (rg → 3, exit 0), S12 (rg template/AGENTS.md → line 124), S13 (rg → line 617,
  `step 10` correct at head), S14/S15 (template-registry + both-driver-arming tests green;
  scratch install arms four shared keys + docs-generated), S16 (rg AGENTS.md → 1), S17
  (writer.merge 15/0 incl. append-only/refusal/heterogeneous-stamp cases, shared-doc-merge 12/0
  incl. the real armed FF-5 merges, `git check-attr merge docs/LOGS.md` → agentic-shared-logs).
  Obligations O1–O14: every row `verified`, every validator re-run green here (the head gate's
  103-suite root suite re-ran them all at 468d9bf9; targeted re-runs recorded above). No
  planned/in-progress/deferred/blank row. Open ids: none — F2/F3/F4 are dated decision-required
  rows awaiting the owner, not dropped needs.
Spot check: bun scripts/local-gate.mjs --skip-network → match (reported E10 "PASS — 13 steps";
  observed in an installed mktemp clone of head 468d9bf9: `local-gate: PASS — 13 step(s) in 163s`,
  `root-suite: exit 0` (103 suites), `docs-generated-projection: exit 0`,
  `journal-carrier-check: exit 0`, crate 645/0, version-parity PASS; caveats disclosed as
  advisories 4–5, and the first bare-clone attempt's schema-build red is the environment note).
  The reported output otherwise matched every re-run exactly — nothing reported is untrusted.
Verdict: VERIFIED
```
