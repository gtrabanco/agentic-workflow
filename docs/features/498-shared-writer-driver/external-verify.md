# External verification — feat/498-shared-writer-driver

Date: 2026-11-11 (first external verification — no prior `EXTERNAL VERIFY` block existed for this unit; full verdict, once)

```text
EXTERNAL VERIFY — base: 27275c94 · head: f49149c1
Blockers: 3 —
  (B1) packages/agentic-workflow/bin/agentic-workflow.mjs:10-12 (usage claim), with
  SPEC.md P3 ("`--expect` on `rowUpsert`/`annotate`/`fixrow`") and SPEC.md D5 ("new
  calls use `roadmap read` → `--expect <hash>`") — `--expect` is read only in the
  annotate branch (bin:1163-1168); on `rowUpsert` and `fixrow` the flag is silently
  ignored and the write succeeds with exit 0, so the documented CAS path no-ops —
  the exact last-write-wins class the unit exists to close. Reproducer (mktemp
  scratch, copy of docs/ROADMAP.md): `node packages/agentic-workflow/bin/
  agentic-workflow.mjs roadmap <scratch>/ROADMAP.md rowUpsert '{"nn":"9900",…}'
  --expect 000…0` (64 zeros) → exit 0, receipt ok:true, file written (before
  bba5f1bc → after 3e7d69b4); same with the `--expected` spelling Log E5 cites;
  fixrow likewise writes under a stale `--expect`. Positive controls: annotate with
  stale `--expect` → `EDIT REFUSAL — stale-read` exit 2; rowUpsert/fixrow with the
  stale `expected` JSON field (README/changeset's contract) → stale-read exit 2.
  Base-vs-head: at base no roadmap `--expect` claim exists (`git show
  27275c94:…bin/agentic-workflow.mjs` matches only the pre-existing `resources
  admit --expect`), and base has no CAS at all — the claim is this change's while
  the ignored-flag behavior on rowUpsert is unchanged from base, i.e. the change
  documented a CAS option it never wired on the primary write op. Stability: plain
  invocations without the flag are byte-identical base-vs-head (E2 re-run, 6/6);
  only the newly claimed flag path fires. Note the change's own surfaces disagree:
  README.md:37 and .changeset/498-shared-writer-driver.md say `--expect` is
  annotate-only with `expected` as the rowUpsert/fixrow JSON field, while the bin
  header, P3 and D5 say otherwise. Smallest action: parse `--expect` in the
  rowUpsert and fixrow dispatch branches (thread into `expected`) plus one CLI test
  each — making bin:10-12, P3, D5 and E5 true without falsifying README/changeset.
  (B2) docs/features/498-shared-writer-driver/planning-obligations.md:13 (O6),
  :17 (O11) and SPEC.md Task P7 — the declared validator `node
  scripts/run-root-suite.mjs` exits 0 never reproduces: observed exit 1 · 100 PASS /
  2 FAIL here (G3 reported 101/1). `scripts/roadmap-settle.test.mjs` fails with the
  same `494-telemetry-by-turn/SPEC.md:1 row-missing` assertion at head AND in a
  mktemp `git archive` copy of base 27275c94 (base exit 1) — base-caused and
  disclosed (G3, Known pre-existing issues) — and `scripts/unit-route.test.mjs`
  `#291 F7` failed only in the pool (green standalone: 64/64, exit 0, file untouched
  by the diff). Red-first passed in this run; every other suite green. The 494 red
  is disclosed in the Log, but O6/O11's `verified` statuses and P7's validator text
  carry no amendment or disposition for the gate half, so those texts claim a green
  that never happened at cut or now. Smallest action: restate the three texts to
  the gate as it reproduces (exit 1 · base-attributed 494; red-first green) or
  attach a dated disposition — the fold pattern fix/505 used for the same condition.
  (B3) skills/execute-phase/SKILL.md:248-250 (sibling sweep) — the close-out tells
  the executor to settle via `agentic-workflow roadmap <index> rowUpsert` and
  states the fix unit's `## Fixes` row has "no `NN` column, no `rowUpsert`", naming
  no writer, while the change's repaired sibling skills/unit-lane/references/
  RELEASE.md:34-40 (and the changeset) declare `roadmap fixrow` and "a Fixes row is
  never a hand edit". Following execute-phase alone lands a fix unit on the retired
  hand-edit path; the two lane surfaces disagree on how a fix row is settled.
  Base-vs-head: at base this sentence was true (no Fixes writer existed); the change
  created fixrow and repaired exactly one skills file (E4: RELEASE.md), leaving this
  mention asserting the pre-change world — the F51/F53 class. Stability: fires only
  on the fix-unit settle path; the feature-row rowUpsert flow is unchanged base-vs-
  head (E2). Smallest action: name `agentic-workflow roadmap <index> fixrow
  '<json>'` in that sentence (one-line sibling repair, same class as RELEASE.md's).
Advisories: 8 —
  (A1) scripts/roadmap-settle.test.mjs / docs/features/494-telemetry-by-turn —
  base-present: identical red at 27275c94 (scratch archive) and f49149c1; disclosed
  under Known pre-existing issues; routes to the owner, never change-attributed.
  (A2) scripts/unit-route.test.mjs:183 (`#291 F7` linear-vs-quadratic timing) —
  failed only inside the 4-worker pool concurrent with this verifier's scratch
  runs; standalone `node --test` → 64 pass / 0 fail exit 0; file untouched by the
  diff; environmental (the pool-instability class fix/505 recorded).
  (A3) packages/agentic-workflow/test/writer.driver.test.mjs:6-7 — FF-1 header says
  "`src/edit/Roadmap.mjs` rewrites the whole file with no concurrency guard" in the
  present tense; false at head (Roadmap splices through `writeShared`). Reads as
  frozen-corpus history; comment only, no validator consumes it.
  (A4) docs/features/498-shared-writer-driver/SPEC.md:87 — Retirements evidence
  "`rg -n 'rowUpsert does not apply' skills/ docs/` → 0 matches after the change"
  does not reproduce as written (2 matches, both inside this unit's own files);
  O4 already discloses the scoped form, re-run here → 0 live matches (exit 1); no
  live surface asserts the retired phrase.
  (A5) docs/features/498-shared-writer-driver/planning-obligations.md:12, 15, 17, 20
  (O2/O5/O7/O14) — rows carry 11 cells against the 9-column header (duplicated
  required-evidence cell + trailing empty), so a positional status read lands on the
  evidence cell; all four validators re-run green here (13/10/10/… pass), so
  closure is unaffected — ledger shape only.
  (A6) skills/unit-lane/references/RELEASE.md:39 — the new fixrow example omits the
  closing paren in its status value: `"status":"done · [#<pr>](<pr-url>"` (the
  rowUpsert example two lines up has `)`); a copy-paste yields an unclosed link that
  `roadmap-settle` would then judge. Docs-only.
  (A7) packages/agentic-workflow/bin/agentic-workflow.mjs:1096 — `roadmap
  <table-path> read` (path-first, the order every other roadmap op accepts) answers
  `EDIT REFUSAL — Unknown roadmap operation` exit 2; usage/README document
  read-first only, so the input is refused loudly, not silently — ordering
  inconsistency only.
  (A8) docs/fix/452-journal-fragment-validation/planning-obligations.md:39 — O26
  still asserts "that table has no emitter"; frozen ledger of a shipped unit
  recording its own cut-time state, self-disclosed as "the defect it is" —
  historical record, flagged not rewritten.
Sibling sweep: 1 blocker (B3 — execute-phase SKILL.md:248-250) · advisory mentions:
  writer.driver.test.mjs:6 (A3), SPEC.md:87 (A4), 452 ledger:39 (A8),
  skills/unit-lane/references/PLAN.md:110 (the release-settle template still names
  only `rowUpsert` — unchanged from base, feature-row wording) · clean elsewhere:
  RELEASE.md's retired phrase gone from every live surface (scoped rg → 0),
  README/changeset/bin-annotate mutually consistent on the CAS flag split,
  .gitattributes class lines + AGENTS.md arming paragraph + GATE_INVENTORY row +
  4 normative-surfaces rows coherent (normative-drift 21/21, prose-gate-inventory
  21/21), no doc outside the unit still claims Roadmap.mjs does whole-file rewrites.
Completeness: S1, S2, S3, S4, S5, S7 resolved — P1-P6 validators re-run green here
  (writer.driver 13/0, writer.merge 10/0, edit 26/0, cli.surface 2/0,
  shared-doc-merge 10/0, normative-drift 21/0, prose-gate-inventory 21/0), S4 via
  O12's evidenced n/a + D2, S7 via D2/D3/D4 + the AGENTS.md arming line; open: S6 —
  its only carrying task P7's `run-root-suite` exits 0 never reproduces (B2).
  Obligations: O1-O5, O7-O10, O12-O15 verified with validators re-run green (O12
  evidenced n/a; O2/O5/O7/O14 shape advisory A5); open: O6, O11 (B2).
Spot check: `bun scripts/check-skill-context.mjs` (+ `--documents`) → match (G1
  reported PASS 29 skills · PASS 4 budgeted documents · AGENTS.md machine 128 ·
  GATE_INVENTORY machine 63; re-run observed identical). Also re-run end-to-end and
  matched: E3 network rg → 0 matches, G2 `bun run test` → 634 pass / 0 fail / 32
  files, E5's `docs-generate.mjs --check` → PASS 3/0 stale, E2 differential → 6/6
  byte-identical (same fixture path both ends). G3 compared, not spot-checked:
  roadmap-settle red reproduced exactly; unit-route extra red is A2 (green
  standalone), so 100/2 here vs 101/1 reported.
Verdict: NEEDS-DECISION (B1 · B2 · B3)
```

Mutation hygiene, disclosed: every CLI/mutating-path probe ran in `mktemp` scratch
(`git archive` copies of both ends plus fixture `ROADMAP.md` files, all removed);
the test suites ran against their own temp fixtures; `scripts/shared-doc-merge.mjs
--install` was never executed against this checkout (its arming paths are covered
only by the suite's fixture git repositories); no commit, branch, push, forge call
or live-tree edit was made — `git status --porcelain` was empty before and after
every run (the receipt file is the one sanctioned write).
