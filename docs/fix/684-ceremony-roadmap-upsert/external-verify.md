# External verify — fix/684-ceremony-roadmap-upsert

Dated: 2026-11-22 · full verdict (no prior `EXTERNAL VERIFY` receipt existed for this unit)

```text
EXTERNAL VERIFY — base: 55525abad · head: 59b61fe33
Blockers: 0 — none
Advisories: 3 — A1 docs/fix/596-test-relevance-sweep/planning-evidence.md:24 (+ planning-obligations.md:26, docs/fix/668-rendered-facts-skill-counts/SPEC.md:315, docs/features/595-test-surplus-audit/SPEC.md:393, docs/features/597-test-justification/SPEC.md:465-467, docs/features/470-content-guard-layer/SPEC.md:436, docs/LOGS.md): the old truth "both arms die ENAMETOOLONG" survives — why advisory: every instance is a sha/date-stamped observation record or the immutable journal, and the repo's own precedent (596's external-verify A1: "a dated record in a closed unit: frozen history, not edited") classifies them as history; all live guidance surfaces (skills/, ROADMAP row 684, changeset, this unit doc, code comments) tell the new truth · A2 packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:75-81 via src/edit/Roadmap.mjs:122: the now-reachable feature arm canonicalizes the target row's slug cell (drops backticks) — why advisory: writer's pre-existing contract (the writer is read, never changed), row-local only (the one-line-diff claim holds), no AC promises other cells preserved, and the same trait is already recorded with its remedy at 595 P6 / 597 D6 · A3 packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:20: a decorated status (`done · [#PR]`) is refused `bad-status` — why advisory: byte-identical refusal at base and head, pre-existing vocabulary design, already dispositioned by the unit (D6, E11)
Sibling sweep: list — clean on every live surface (skills/, docs/workflow, scripts, README, package READMEs, code comments, validators: 0 survivors; the tautology `code === 0 || code === 1` and the blind `upserted: true` survive nowhere); survivors are the dated/frozen records named in A1, none asserting current state without its observation date or sha
Completeness: S1–S4 resolved — P1–P5 all carry (Implements: S#) and their validators re-ran green here; obligations O1–O8 all `verified` with green validators (O6's four-operation base-vs-head diff reproduced empty; O3 `rg -c 'typeof next === "string"'` → 1; O8 `rg -c 'issues/684' docs/ROADMAP.md` → 1)
Spot check: cd packages/agentic-workflow && bun test test/ → match (1388 pass · 0 fail · 78 files — identical to the reported E8)
Verdict: VERIFIED
```

## Evidence (commands observed, 2026-11-22)

- `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs` → `12 pass / 0 fail` (matches E5 green). In `mktemp -d` scratch: base tree (`git archive 55525abad`) + the head test file → `11 pass / 1 fail`, exit 1, the failure at the fix arm (matches E5 red; O4 reproduces).
- Claim probes derived from the `S#` wording, in scratch (base vs head, identical fixture):
  - S1 reproducer: fix arm `row-upsert --slug 77-toy --status done` → base exit 1, `WriterError … open '# Roadmap…'`, stdout empty, fixture tree clean; head exit 0, `{"upserted": true, …}`, exactly one line moved, status cell `done` (matches E2/E7).
  - S2: feature arm `--slug 91-toy --status planned --summary probe` → base exit 1 (same `WriterError` at `rowUpsert`), head exit 0 `upserted: true`, one line moved (matches E3).
  - S3: `fixRowUpsert(roadmapPath(), {` at `roadmap.mjs:68`, `rowUpsert(roadmapPath(), {` at `:75`; no `const text`/`next`/`written` in the arm — `rg -c 'typeof next === "string"'` → 1 (the untouched `settle` arm, `roadmap.mjs:99`).
  - S4: the regression case fails at base and passes at head (red-first pair reproduced above).
- O6 differential (P3): base and head, one fixture each, `ceremony roadmap read|list|settle|check --slug 77-toy` → `diff -r` of captured stdout/stderr/exit **empty**; exits `0/0/0/2` at both heads; both fixture trees clean (matches E6).
- Declared commands re-run: `bun scripts/run-root-suite.mjs` → exit 0, `137 PASS` (matches G1/G4); `cd packages/agentic-workflow && bun test test/` → `1388 pass / 0 fail / 78 files` (matches E8); `bun scripts/docs-generate.mjs --check` → `PASS · 3 checked · 0 stale` (matches E10); `promise-coherence <SPEC>` → `PASS · 3 checked · 10 skipped`; `phase-lint <SPEC>` → `PASS · 6/6` every phase (matches E10); `verify <SPEC>` → `ok: true, violations: []` and `roadmap check <SPEC>` → `PASS · violations: 0` (matches E11).
- Contract-text qualifier check: the diff removes only code lines of the `row-upsert` arm, the old tautological assertion and the fixture's lookalike headers. No binding prose sentence was removed or rewritten; the removed claim ("receipt or a refusal, never a stack trace") was vacuous at base (a stack trace exits 1 and passed it) and its true content is re-asserted more strongly (JSON parsed on success, refusal non-zero with no byte). No lost qualifier, no conditional↔absolute flip.
- Mutation hygiene: every write ran in `mktemp -d` scratch; the live worktree was read-only throughout (`git status --porcelain` empty after all runs).

## Correction triage — 2026-11-22 (outcome: `empty`)

Owner order: "triage and fix those that deserve to fix … check you haven't broke
another different thing". The §9 correction batch targets blockers: this receipt
has `Blockers: 0`, so the batch has zero matching rows. The three advisories were
triaged on context; none deserves a fix:

- **A1 — wontfix (frozen history).** Re-run search receipt: `rg` for the old
  truth across `skills/ docs/workflow scripts README.md packages/*/README.md
  packages/agentic-workflow/{src,test} template .changeset` → 0 survivors (the
  one `.changeset/684-…:12` hit is this change's own past-tense account of the
  fixed defect). The 8 surviving files are sha/date-stamped records of closed or
  frozen units plus the immutable journal, classed by the repo's own precedent
  (`docs/fix/596-test-relevance-sweep/external-verify.md:25`: "a dated record in
  a closed unit: frozen history, not edited").
- **A2 — out of domain.** `git diff origin/main…HEAD --
  packages/agentic-workflow/src/edit/Roadmap.mjs` → empty; this unit's Impact
  freezes the writer as read-never-changed, so the normalization belongs to a
  writer unit of its own. The bare slug is already the writer's shipped form
  (rows 494/227) and the trait is recorded at 595 P6 / 597 D6.
- **A3 — wontfix (pre-existing, dispositioned).** Byte-identical `bad-status` at
  base and head; dispositioned at `SPEC.md:412` (D6) and `SPEC.md:428` (E11),
  settle form routed to `roadmap fixrow`.

No code changed in this batch — head stays `59b61fe33`, tree carries only the
receipt files — so S2 (`check you haven't broke another different thing`) answers
from the verify run above (root suite 137 PASS, package suite 1388/0, four-op
differential empty) and S3's loop does not start: there was nothing to fix.
