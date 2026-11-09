# External verify — 227-deterministic-artifact-emitters

Receipt carrier for this unit's external verification (the next run reads the
latest block here and verifies only the delta). Written 2026-11-09 by the
read-only external-verify command; no other byte of the branch was touched.

## 2026-11-09

EXTERNAL VERIFY — base: f24b726f · head: e59b7717
Blockers: 2 —
  1. packages/agentic-workflow/bin/agentic-workflow.mjs:225 — the
     `publishedGates` inventory source (source 1, comment at :213) extracts
     zero gate ids: the `prose-gate-inventory@1` gate-id rows live in a
     ```text block as `id | statement | …` lines with no leading pipe, and
     GATE_INVENTORY.md's only markdown tables backtick their first cell —
     `rg -c "^\| [a-z0-9-]+ \|" docs/workflow/GATE_INVENTORY.md` → 0 matches.
     Reproducer (mktemp -d scratch, `git archive` copies of HEAD and
     f24b726f, removed after): the unit SPEC minus its three G receipt lines
     plus the References line "The `model-memory-provenance` gate is
     inventoried (prose row)." → head: `VERIFY REFUSAL — cited-gate-unknown:
     … model-memory-provenance` exit 2; base: `VERIFY PASS` exit 0.
     Stability: same doc citing `unit-lane` (skill-backed) → head exit 0;
     control doc without the line → head exit 0. `model-memory-provenance`
     IS published (inventory prose row; no same-named skill or script; not
     in GATE_NAMES), so O2's stated outcome "inventory ids … resolve" (and
     O4's "published gates from the three published sources", PE-003) does
     not reproduce, and S1's "every previously passing doc keeps its
     verdict" fails: published doc
     docs/fix/432-model-memory-tier-0/SPEC.md:283 carries exactly this
     citation shape. The suite masks it: `treeContext.gateKnown` in
     packages/agentic-workflow/test/verify.test.mjs is a stub declaring
     `phase-lint-rules` published while the real resolver refuses that id
     too (scripts/phase-lint.mjs → stem `phase-lint`; no such skill; not in
     GATE_NAMES). Smallest action: parse the `prose-gate-inventory@1`
     text-block rows (first cell before ` | `) inside `publishedGates`, and
     add one CLI-level test resolving an inventory-only id through the real
     resolver instead of a stub.
  2. docs/ROADMAP.md:74 — row 53's settle annotation is a second physical
     line starting `— Settled by …` (no leading pipe) inside the Features
     table; the row is split across two lines. Reproducer: GitHub GFM render
     (`gh api markdown`) of the table header plus lines 73–75 → an extra
     malformed row `[— Settled by the issue-keyed row 227 … | | | |]`
     between rows 53 and 54 with only its first cell filled; the same
     fragment from base f24b726f renders no such row, and
     `git show f24b726f:docs/ROADMAP.md | rg -c '^— '` → 0 (base clean).
     Base-vs-head: line 74 is added by this diff; no gate catches it
     (docs-generate --check passes), so it is a shipped-rendering change
     nobody asked for. Smallest action: join the two physical lines so the
     annotation sits inside row 53's Summary cell (single-line row) — and
     check whether the roadmap writer emitted the wrap — then re-run
     `bun scripts/docs-generate.mjs --check`.
Advisories: 3 —
  1. scripts/log-immutability.test.mjs:1 — the root-suite red
     (`ERR_MODULE_NOT_FOUND … scripts/log-immutability.mjs`) is pre-existing
     at base: f24b726f holds the test without its implementation (the
     red-first pair of #468/#469, disclosed in the unit doc's ## Next) and
     this diff touches no scripts/ path; it cleared on origin/main when
     #469 merged mid-run (origin/main advanced f24b726f → fc62c03f during
     this verification; the PR's merge-base diff is unchanged at 10 files).
  2. docs/features/227-deterministic-artifact-emitters/SPEC.md:167,177 — the
     `## Log` carries two identical `**D2**` bullets (duplicate log id) —
     doc hygiene, not change-blocking behaviour.
  3. worktree root (the shared checkout under
     .git/worktrees/feat-227-deterministic-artifact-emitters) — git-dir
     files (HEAD, index, logs/, refs, COMMIT_EDITMSG …) sit untracked in
     the checkout so `git status` lists them; systemic to this repo's
     worktree layout (the same files appear in feat-410… and fix-460…),
     present before this change, none of it in the diff — environmental.
Sibling sweep: clean — no surviving mention asserts the old truth: the
  README verify row and the Verify.mjs header were rewritten in place;
  docs/fix/260-subagent-first-execution/planning-obligations.md:15 still
  reads true non-exclusively; no other surface enumerates the receipt's
  `checks` or the verifier's check list; no doc repeats the abbreviated
  `46bca783` receipt sha; the Retirements claim reproduces
  (`git grep -c 'cited-path-missing|cited-gate-unknown' 7886ecc5 --
  packages/agentic-workflow/src` → 0 matches at the cut head); row 53's
  broken rewrite is blocker 2, not a surviving old-truth mention.
Completeness: S1–S2 resolved — every S# carries tasks with
  `(Implements: S#)` whose validators re-run green here (P1
  `bun scripts/docs-generate.mjs --check` → PASS; P2's red recorded as E3 at
  4b5b4ff5; P3 `bun test packages/agentic-workflow/test/verify.test.mjs` →
  20/20 green on the bun and node legs; P4 `rg -c "cited-path-missing"
  packages/agentic-workflow/README.md` → 1; P5 crate suite 542/542 green;
  P6 `gh pr list --head feat/227-deterministic-artifact-emitters --state
  open --json url` → 1, PR #472 open against main, conventional commits);
  obligations O1, O3–O8 verified green on re-run, O2 and O4's published-gates
  clause named in blocker 1; full gate `bun scripts/local-gate.mjs
  --no-bail` → every step green except root-suite (advisory 1) and its
  dependent schema-node-compat, which re-run manually → exit 0; impact set
  from `bun scripts/test-impact.mjs --base origin/main` (targeted) → both
  suites green. No open S# ids, no unrecorded dispositions.
Spot check: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/fix/201-operator-approved-pass-routing/SPEC.md` → match (reported G2
  "exit 0 · VERIFY PASS, checks include cited-paths and cited-gates";
  observed exit 0, VERIFY PASS, checks `[sections, obligations-closure,
  receipt-marks, log-kinds, cited-paths, cited-gates]`).
Verdict: NEEDS-DECISION (2 open blockers)

## 2026-11-09 — correction batch (`## Log` D3, P5–P6)

Both blockers of the verdict above are repaired; the verdict itself stays with
the owner. What the next run should re-verify instead of re-deriving:

- **Blocker 1** — `inventoryGateIds` now reads the `gate-id` rows out of the
  inventory's `prose-gate-inventory@1` fence (header cell excluded, a
  markdown-table spelling accepted), and the resolver is pinned by a CLI-level
  case instead of a stub. Reproducer from the verdict now inverts: a doc citing
  `model-memory-provenance` exits 0, the same doc citing the header cell
  `gate-id` exits 2. Commits `a84b1635` (red) → `d60619aa` (green); evidence
  `E9`–`E11` in the unit doc.
- **Blocker 2** — the producer, not the row: `annotate()` joined the note with a
  newline inside the description cell, so the writer emitted the two-line row.
  The writer now appends on the same physical line and the damaged row 53 was
  rejoined in the shape the fixed writer emits; `rg -c "^— " docs/ROADMAP.md` →
  0 matches and the GFM render is header + 4 rows again. Evidence `E10`–`E12`.
- **Advisory 2** (duplicate `**D2**` bullet) — repaired in the same batch.
- **Advisories 1 and 3** — unchanged and still out of this unit: the
  `scripts/log-immutability.test.mjs` red is the #468 red-first suite this
  branch inherits from `f24b726f` (cleared on `main` by #469), and the worktree
  git-dir files are the repo's worktree layout.
- One red the batch itself caused and fixed: `scripts/index-document.test.mjs`
  O8 refused the literal index path in the new comment (`E13`).

## 2026-11-09 — delta verdict (correction batch re-verified)

EXTERNAL VERIFY — base: e59b7717 (last receipt's head; delta base) · head: 2344d87d
Blockers: 0 — both blockers of the 2026-11-09 NEEDS-DECISION receipt re-verified repaired:
  1. (was blocker 1) `packages/agentic-workflow/bin/agentic-workflow.mjs` `inventoryGateIds`
     — reproducer inverted in `mktemp -d` scratch (`git archive` + `git init` copies of
     e59b7717 and 2344d87d, SPEC minus its G lines, removed after): base → `cited-gate-unknown:
     … model-memory-provenance` exit 2; head → `VERIFY PASS` exit 0. The header cell
     `` `gate-id` `` stays refused at head (exit 2, as the fix specifies) and was equally
     unpublished at base — no regression. The published doc
     `docs/fix/432-model-memory-tier-0/SPEC.md` no longer names `cited-gate-unknown` (its
     remaining refusals — obligations-open O6, two pruned-journal path citations — are the
     historical drift E11 records, present at base). Stability: control doc without the
     citation exits 0 at base and head; the fix only widens the published set, so no
     previously passing doc can regress.
  2. (was blocker 2) `docs/ROADMAP.md` row 53 — `rg -c "^— " docs/ROADMAP.md` → 0 matches;
     GFM render (`gh api markdown`, header + rows 53/54) → 3 `<tr>`, no stray em-dash row,
     the settle note inline in row 53's cell; producer fixed (`annotate` appends on the same
     physical line, single-line case green in `test/edit.test.mjs` 19/0).
Advisories: 2 —
  1. `scripts/log-immutability.test.mjs` — still red in this worktree (the #468 red-first
     pair this branch inherits from `f24b726f`; #469 cleared it on `main`) — pre-existing,
     environmental, not in the delta diff.
  2. this checkout — `node_modules` was absent (worktrees share none), so the declared
     validators failed with `ERR_MODULE_NOT_FOUND` until `bun install --frozen-lockfile`
     ran (wrote only gitignored `node_modules`; no tracked byte changed); the prior
     receipt's green runs predate this checkout state — environmental.
Sibling sweep: clean — no surface still asserts the old truths: `Roadmap.mjs`'s newline
  join is gone (comment rewritten, `rg "\\n— " src/edit/Roadmap.mjs` → 0), the README row
  documents the same-line semantics, the changeset carries the fix note, the old
  markdown-pipe regex is gone from the bin, and the delta touches no other surface that
  narrates the resolver or the writer.
Completeness: S1–S2 resolved — obligations O1–O10 all verified, the two opened by the
  correction batch re-run green here (O9: `bun test packages/agentic-workflow/test/verify.test.mjs`
  → 21/0 and the 432 doc names no `cited-gate-unknown`; O10: `bun test
  packages/agentic-workflow/test/edit.test.mjs` → 19/0 and both ROADMAP counts hold);
  O3/O8 re-confirmed (`verify docs/fix/201-operator-approved-pass-routing/SPEC.md` exit 0;
  `node scripts/version-parity-gate.mjs --content` → PASS); O6 re-confirmed
  (`bun scripts/docs-generate.mjs --check` → PASS, 0 missing/stale/orphaned); O7
  re-confirmed (PR #472 open). No open ids.
Spot check: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify
  docs/features/227-deterministic-artifact-emitters/SPEC.md` → match (reported E14 "exit 0 ·
  VERIFY PASS, checks include cited-paths and cited-gates"; observed exit 0, `ok: true`,
  checks `[sections, obligations-closure, receipt-marks, log-kinds, cited-paths,
  cited-gates]`). Crate suite also re-run: 544 pass / 0 fail (28 files) — matches G5.
Verdict: VERIFIED
