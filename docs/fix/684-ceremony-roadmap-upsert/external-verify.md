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

## External verify — run 2 (full verdict)

Dated: 2026-11-22 · **full verdict** — binding: the previous receipt's
`Correction triage` outcome was `empty`, so no corrections landed since
`59b61fe33` (no delta applies), and the owner-ordered extension `S5–S12` with
its tasks `P6–P10`, obligations `O9–O18` and criteria `AC-S5–AC-S12` landed
after that receipt — they are verified here with the frozen `S1–S4`. PR #686's
free-text selects the target and waives no check. Head `141b0e491`, in sync
with origin (a journal-fragment commit `ccfb6f873 → 141b0e491` appeared during
state binding — no code, claim or ledger moved). Every mutating command the
change ships (`ceremony roadmap row-upsert`, `roadmap fixrow`) ran only against
scratch archives in `mktemp -d` (`/tmp/pe684v-*`, removed after the run); the
live worktree was read-only throughout (`git status --porcelain` empty before
this append).

```text
EXTERNAL VERIFY — base: 55525abad · head: 141b0e491
Blockers: 4 — B1 packages/agentic-workflow/src/edit/Roadmap.mjs:386 (rowCells splits every `|`, including an escaped `\|`) → :477 (keying) and :508-515 (post-write verdict): repro 1 (in-domain, this repo's own row): `roadmap fixrow <copy of docs/ROADMAP.md> '<{issue:684, url, topic, status, notes: row 684's own notes}>'` → base `Receipt: pass`/`"ok": true`, head `Receipt: fail`/`"ok": false`, exit 0 on both, both written documents byte-identical (`before 8cd09626 · after 205eb483` both sides) — row 684's Notes carries `Folder \| Topic \| …`, written by this change (cbfff034a), so the documented close-out route (skills/execute-phase/SKILL.md:284-287) now reports failure for a successful settle, E11's `ok: true` and P9/E14's "receipts identical at both heads" no longer reproduce on the current file; repro 2 (consumer table `Folder | Topic | Status | Depends on | Issue`, Topic cell `toy \| quoted`): head `roadmap fixrow … {issue:101,…}` → exit 0 `Receipt: pass` AND two `[#101]` rows in the file, base → exit 2 `table not found`, file byte-clean, one row — contradicts O10's "updated in place — never duplicated". Base-vs-head: identical input bytes on both sides; rows without escaped pipes never fire (stability: every other probe clean); B2 packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:56-79: repro — head `ceremony roadmap row-upsert --slug 77-toy --status done --depends-on '#99'` on the extension's own showcase table → exit 0 `"upserted": true` and the Depends-on cell stays `—` (the fix arm at :68-74 never forwards it; FIX_COLUMN_VALUES at Roadmap.mjs:371-379 maps no `depends on`); feature arm `--issue 55` → exit 0 `"upserted": true`, flag ignored; base: same commands exit 1 `WriterError` opening the document as a filename (ENOENT/ENAMETOOLONG), tree clean — swallow-with-success did not reproduce at base; violates the repo's own rule in src/runner/lib.mjs `onlyFlags` ("an option is either honoured or an error, never silently swallowed"); B3 docs/fix/684-ceremony-roadmap-upsert/SPEC.md:648 (the G6 receipt line): repro — `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/684-ceremony-roadmap-upsert/SPEC.md` → exit 2 `VERIFY REFUSAL — receipt-malformed-head: receipt line without a HEAD sha: - **G6** …`, contradicting E11, G5 and PR #686's checklist (all record `verify` PASS); base-side evidence — `git log -S'**G6**'` → only `ccfb6f873` (in-delta) added the line, and the same verify over the SPEC at `59b61fe33`, `cbfff034a` and `0a946e721` (resolved in the live repo) carries no `receipt-malformed-head` violation — the rule (src/verify/Verify.mjs:216-222) needs `HEAD` on the `- **G<n>** —` line itself, while G6 wraps its short sha onto the next line; B4 packages/agentic-workflow/bin/agentic-workflow.mjs:1629-1632 (sibling sweep): the CLI's own comment still asserts a Fixes row is keyed "in its leading `[#N](url)` cell" — the exact rule S7 rewrote (any column worded Issue/Issues/#, link or bare); the rewrite landed only in Roadmap.mjs's docblocks (F51/F53 class). Smallest actions: B1 make the cell parse `\|`-aware (split on unescaped pipes) in rowCells/separator+keying/post-check, re-run edit.test + p1p2 + the row-684 fixrow probe; B2 reject the arm-inapplicable flag after resolveUnit (or wire dependsOn through the header map); B3 put `HEAD <40-hex>` on G6's receipt line (the G1–G5 shape), re-run verify; B4 reword the comment to the derived-shape truth.
Advisories: 4 — A1 packages/agentic-workflow/src/writer/merges.mjs:52-56: the shared-merge driver still keys `## Fixes` rows by the leading `[#N](url)` link, so a consumer-shaped table the writer now accepts (key last / bare key) can be unioned under a null key by an armed shared-merge — why advisory: the driver is untouched and outside S5–S12's claimed surface, its comment honestly states its own unchanged logic, and reachability needs an armed consumer project; A2 packages/agentic-workflow/src/runner/ceremony/roadmap.mjs:73,79: a ceremony settle without `--summary` clears the row's Notes/Description cell (`flags.summary ?? ""`) — why advisory: pre-existing arm semantics, explicitly unit-blessed (O1/AC-S1's fix-arm assertion expects `""`), and unreachable at base only because the arm crashed — flagged so the owner can decide the default; changing it would move an assertion this unit pinned; A3 carried from the prior receipt and re-checked at this head: the feature arm still canonicalizes the target slug cell (`` `toy` `` → `toy`, re-observed), a decorated status (`done · [#1](url)`) is still refused `bad-status` exit 1 (re-observed; dispositioned D6/E11), and the old-truth sweep for `ENAMETOOLONG` returns 0 survivors on live surfaces (only `.changeset/684-…`, the change's own past-tense account); A4 docs/fix/684-ceremony-roadmap-upsert/SPEC.md PE-002: its measured generalization "bun reports ENOENT for the same over-long name" is contradicted by one probe here (the consumer fixture answered `ENAMETOOLONG` on the same runtime) — why advisory: dated planning record, and AC-S1 asserts the row, never the errno (PE-002's own note).
Sibling sweep: list — B4 (bin comment, blocker, above); merges.mjs:52 describes its own unchanged function (clean; reachability → A1); every other old-truth survivor is a dated/sha-anchored record (SPEC base-observations PE-006/PE-012/PE-013 and the Impact prose, docs/features/498-…/planning-evidence.md:12, docs/fix/560-…:20, docs/fix/668-…:315, docs/LOGS.md, .agentic-workflow/journal fragments, the prior receipt); live prose states the still-true form with no position claim (skills/execute-phase/SKILL.md:284-287 "keyed by the issue number in its `[#N](url)` cell", packages/agentic-workflow/README.md:37, docs/workflow/*); `expected an | Issue | table` survives only inside the SPEC's verbatim quotes (S6, L3, E12, AC-S6 — anchored to 80724abbb/the owner's words); the tautology `code === 0 || code === 1` only in the SPEC's base description and the prior receipt; the blind `upserted: true` literal survives nowhere (the tests assert the parsed receipt).
Completeness: S1–S12 resolved — S1–S4 → P1–P5, S5–S12 → P6–P10, every task carries `(Implements: S#)` and its validator re-ran green here (p1p2 13/0, edit.test 38/0, root-suite exit 0 over 137 suites, phase-lint PASS 6/6, `rg` validators 1/1/1, docs-generate --check PASS 3 checked/0 stale, promise-coherence PASS, `roadmap check <SPEC>` PASS 0 violations, `journal aggregate --check` ok:true, local-gate PASS 16 steps/378s); reds reproduced where claimed: 80724abbb + head tests → edit.test 31 pass/7 fail and p1p2 12/1 (O14/AC-S10), base + head tests → p1p2 11/2 with the fix-arm failure (AC-S4/O4). Open ids: none for S#; O10 named under B1 (its validator is green, its stated invariant "never duplicated" fails on escaped-pipe input); the `verify <SPEC>` claim of E11/G5/PR #686 is red at head → B3.
Spot check: cd packages/agentic-workflow && bun test test/ → 1396 pass · 0 fail · 78 files, exit 0 → match (E15)
Verdict: NEEDS-DECISION (B1, B2, B3, B4)
```

## Evidence (commands observed, 2026-11-22, head `141b0e491`)

- Declared doc commands (live, read-only): `phase-lint <SPEC>` → `PASS (6/6)`
  every phase incl. P10; `promise-coherence <SPEC>` → `PASS, 4 checked · 24
  skipped`; `roadmap check <SPEC>` → `PASS, violations: 0`;
  `docs-generate --check` → `PASS, 3 checked · 0 stale`;
  `journal aggregate --check` → `{"ok":true,"checked":16}`;
  `verify <SPEC>` → **exit 2, `receipt-malformed-head` on G6** (B3 — the only
  violation; the same command over the SPEC at `59b61fe33`/`cbfff034a`/
  `0a946e721` shows none of that class).
- Declared suites (live): `bun test packages/agentic-workflow/test/runner.ceremony-p1p2.test.mjs`
  → `13 pass / 0 fail`; `bun test packages/agentic-workflow/test/edit.test.mjs`
  → `38 pass / 0 fail`; `bun scripts/run-root-suite.mjs` → exit 0 (137 suite
  files, every line PASS, 2m32s); `bun scripts/local-gate.mjs --skip-network
  --jobs 2` → `PASS — 16 step(s) in 378s` (matches G5's form).
- Claim probes derived from the `S#` wording, scratch only (`mktemp -d`, base
  tree `git archive 55525abad` vs head archive, identical fixtures):
  S1 fix arm → base exit 1 (`WriterError … open '# Roadmap…'`, stack at
  `fixRowUpsert`, tree clean) / head exit 0 `{"upserted": true, …}`, exactly
  `1/1` line moved, status cell `done`; S2 feature arm → base exit 1 / head
  exit 0, one line moved; S5/S6 consumer five-column header → base exit 1
  (refusal), head exit 0 with the 5-cell row
  `| 77-toy | toy | done | — | [#77](…) |`; S7 bare key in a reordered
  `| Status | # | Topic |` table → head `Receipt: pass`, row
  `| done | 102 | renamed-toy |`, base exit 2 + byte-clean; S8's four
  unresolvable shapes → head exit 2 naming each constraint (`no issue-keyed
  column`, `separator has 3 cells, its header has 5`, `no table header`,
  `2 issue-keyed columns`), byte-clean each, and base's no-key counter-repro
  answers the old `table not found (expected an | Issue | table)`; S9 →
  `git diff 80724abbb..HEAD -- …/runner/ceremony/roadmap.mjs` → empty (and
  empty vs `59b61fe33`); S10/AC-S10 → `790561530` (RED corpus) is an ancestor
  of `1b709afa8` (fix), and 80724abbb + the head test files → edit.test
  `31 pass / 7 fail`, p1p2 `12 pass / 1 fail`, both exit non-zero; S11/S12 →
  the SHAPE cases plus the row-684 base-vs-head fixrow differential (written
  documents IDENTICAL; the receipt verdict flips → B1) and
  `rg -c '^\| Issue \| Topic \| Status \| Notes \|$' docs/ROADMAP.md` → 1.
- O6 differential re-run: fixture `read|list|settle|check --slug 77-toy`, base
  vs head, stdout+stderr+exit captured → `diff -r` EMPTY, exits `0/0/0/2` at
  both heads, both fixture trees clean. O3/O15
  `rg -c 'typeof next === "string"' …/roadmap.mjs` → 1; O8
  `rg -c 'issues/684' docs/ROADMAP.md` → 1; O14/AC-S4 reds as above.
- B2's flag probes: fix arm `--depends-on '#99'` → head exit 0 with the cell
  unchanged, base exit 1 clean; feature arm `--issue 55` → head exit 0 flag
  ignored, base exit 1; an undeclared flag still errors (`unknown-flag`,
  allowed list printed) — the guard works, the arm-uneaten declared flag does
  not.
- Contract-text qualifier check: the diff removes only the `row-upsert` arm's
  code lines, the old Fixes-shape guards and post-check, the tautology
  assertion, the fixture lookalike headers and two `Roadmap.mjs` docblock
  lines. No SKILL.md, AGENTS.md, template or normative block is touched. The
  dropped qualifiers are the ones S5/S7/S8 order (`4 columns`, `leading
  cell`, `absent or malformed` → constraint-named); every preserved qualifier
  survives (`never invents issue links`, `updated in place … inserts after the
  separator`, `expected`/CAS, fail-closed refusal) and no binding rule flips
  conditional↔absolute. The removed test claim ("receipt or a refusal, never
  a stack trace") was vacuous at base (its subject is an explicit Non-goal,
  PE-008/D3) and the replacement is strictly stronger on the success arm.
- Mutation hygiene: every `row-upsert`/`fixrow` run executed against archives
  in `/tmp/pe684v-Uu2MoB` with fixtures under the same scratch; the live
  `docs/ROADMAP.md` was only copied OUT of the tree; `git status --porcelain`
  stayed empty until this receipt append.

Corrections for B1–B4 belong to `/aw-local-apply` under its correction bounds;
the next external verify of this unit is a delta verdict against these four
blockers.

## Correction batch — 2026-11-22 (external-verify run 2, B1–B4)

Owner order (verbatim, `L4`): "Apply to this repository: triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff".

**Blockers — all four fixed in one batch** (§9 bounds: one batch → one recheck
of these four only):

- **B1 — fixed** (`418dedb9b`): `rowCells` now counts markdown cells (an odd
  number of backslashes escapes the pipe), covering its four call sites — the
  header read, the separator width check, the keying loop and the post-write
  verdict (`PE-019`). RED corpus `3da0df56a` red at `141b0e491` (`edit.test`
  38/2, `p1p2` 13/1) → green (40/0, 14/0). The row-684 probe answers
  `Receipt: pass` again with base and current documents byte-identical, and
  the consumer probe updates in place (exactly one `[#101]` row) — O10's
  "never duplicated" holds again. Written bytes for every non-pipe input are
  unchanged (`E18`).
- **B2 — fixed** (`3569083f5`): the arm-scoped `onlyFlags` after
  `resolveUnit` refuses `--depends-on` on a fix unit and `--issue` on a
  feature unit (`unknown-flag`, exit 1, no byte) — the pattern `findings.mjs`
  already uses per case; the honoured sides stay byte-identical to
  `141b0e491`. Decision `D9`: reject, not wire — D7's column→argument mapping
  stays closed, and no schema vocabulary moved (`PE-020`).
- **B3 — fixed** (`e8814ca67`): G6's receipt line carries
  `HEAD 0a946e7211a05b0caa2d2b726debab69fa272f57` (the same attested head,
  `D10`); `verify <SPEC>` → exit 0, `violations: []`.
- **B4 — fixed** (`a6694b569`): the `fixrow` comment states the derived key
  column (any `Issue`/`Issues`/`#` position, link or bare); the multiline-aware
  sweep over the writer's live surfaces returns no hit and O22's validator
  `rg -c 'issue-keyed column'` → 1.

**Advisories — triaged, none deserves a fix in this unit:**

- **A1 — wontfix here (own unit).** The merge driver's leading-cell keying is
  its own unchanged contract — its comment is true of its own function — and
  widening it is a merge-driver unit's scope, not this correction's; reachability
  still needs an armed consumer project.
- **A2 — wontfix (unit-blessed; owner decision if ever changed).** The
  no-`--summary` default clearing Notes/Description is pinned by O1/AC-S1's
  `""` assertion; changing it would move an assertion this unit made, so it
  needs a SPEC amendment, not a fold.
- **A3 — carried from run 1, unchanged** (slug-cell canonicalization, the
  `bad-status` decorated-status refusal, the frozen-history `ENAMETOOLONG`
  sweep) — re-observed at this head, dispositioned as in run 1.
- **A4 — wontfix (dated record).** PE-002's errno generalization stays a
  dated measurement; AC-S1 asserts the row, never the errno.

**The "haven't broke another thing" pass** (`E18`, `E19`): impact set
`targeted` at 22 suites (the six template hook suites run directly, all PASS),
root suite 137 PASS, package suite 1399/0, local gate `PASS — 16 step(s)`,
the four-operation differential EMPTY, and every doc gate green (`verify`,
`phase-lint`, `promise-coherence`, `roadmap check`, `docs-generate --check`,
`journal aggregate --check`). The related-symbol sweep closed B2's class:
`row-upsert` was the only ceremony op whose union flag list lacked the
per-case narrowing, and `rowCells` was the shape layer's only cell parser — no
second iteration was needed. No new finding entered this batch (§9: a new
finding goes to the owner, and the turn ends).
