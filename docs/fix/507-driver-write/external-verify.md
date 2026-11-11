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
