# 643 — single-source-vocabulary · external verification receipt

2026-11-19 — first full external verify of PR
[#648](https://github.com/gtrabanco/agentic-workflow/pull/648); no prior
`EXTERNAL VERIFY` block or review verdict existed for this unit, so this is the
full verdict (not a delta). Read-only run: no commit, no push, no branch, no
forge mutation, no code edit. Every base-side probe ran in `mktemp -d` scratch
copies (`git archive` of each side); the live tree was only read and executed
through the unit's declared verification commands. `origin/main` resolves to
`fdd39cccc`, which differs from the merge-base by one transcript file only, so
the base side is the merge-base `176ab984bf`.

```text
EXTERNAL VERIFY — base: 176ab984bf7b5d29367b6d7b11b86744201d086f · head: 4171c318c0c887565a2c732ecedce2971dbe67a4
Blockers: 6 — each: file:line, reproducer, base-vs-head evidence
Advisories: 3 — each: file:line, why advisory
Sibling sweep: packages/agentic-workflow-schema/README.md:933, :1059; packages/agentic-workflow-schema/src/vocabularies.ts:200; packages/agentic-workflow-schema/src/file-schemas.ts:8 (live old-truth assertions — B3–B6); docs/workflow/MIGRATION.md:78 (wording — A1); docs/fix/201/*, docs/features/462/planning-evidence.md:12, docs/features/60/*, docs/features/557/SPEC.md:257 (closed-unit frozen history — A3)
Completeness: S1–S9 resolved with re-green validators · open ids: S10 (P7 validator red → B2), S11 (P9 gate red → B1; Object.freeze count record missing → A2)
Spot check: bun scripts/local-gate.mjs → mismatch (E13 reports "18 steps passed in 614s · exit 0"; observed exit 1 — 19 steps, FAILED at root-suite/roadmap-settle) — per contract the unit's reported receipts are untrusted as recorded; every declared command was re-run directly and this verdict rests on the observed outputs below
Verdict: NEEDS-DECISION (B1, B2, B3, B4, B5, B6)
```

## Blockers

**B1 — the whole-gate validator is red (obligations O15, AC-10, task P9/S11).**
`docs/features/643-single-source-vocabulary/SPEC.md:359` (Log P10) and `:380`
(Next) carry the PR URL while `docs/ROADMAP.md:195` keeps row 643 at
`in-progress`, so the settle gate refuses.
Reproducer: `bun scripts/roadmap-settle.mjs` → `verdict: FAIL · violations: 2`,
both `pr-url-unsettled` ("row status is 'in-progress' — expected 'done ·
[#648](https://github.com/gtrabanco/agentic-workflow/pull/648)'");
`bun scripts/local-gate.mjs` → **exit 1** (failed at `root-suite`;
`--no-bail`: 19 steps, root-suite red, 5 dependents skipped); full
`bun scripts/run-root-suite.mjs` → exactly one red suite
(`scripts/roadmap-settle.test.mjs:79`), the other 125 suites PASS.
Base-vs-head: the same settle on a `git archive 176ab984b` scratch → PASS,
0 violations (243 docs); on a `git archive HEAD` scratch → FAIL ×2 (244 docs).
Change-caused by commit `4171c318c` (PR URL recorded in Log/Next) with the row
left `in-progress`. E13's recorded "exit 0, 18 steps" does not reproduce.
Smallest action: settle row 643's status cell to `done · [#648](<the same url>)`
through the crate's roadmap writer, then re-run the gate — `/aw-local-apply`.

**B2 — the declared stale-rationale sweep never reproduces its recorded
outcome (obligations O3 + O13, task P7/S10, evidence line E6).**
`docs/features/643-single-source-vocabulary/SPEC.md:256` (P7 validator), `:331`
(E6), `planning-obligations.md:15` (O3), `:23` (O13).
Reproducer: `rg -c 'does not depend on the schema package'
packages/agentic-workflow/src packages/agentic-workflow/test scripts` →
`scripts/vocabulary-parity.test.mjs:1` (1 file / 1 match — P7's "matches 0" is
red); E6's own three-phrase command over the same paths →
`scripts/vocabulary-parity.test.mjs:3` (3 matches — E6's "0 matches" is false);
O13's `\|` pattern matches nothing at all because `\|` is a literal pipe (a
vacuous zero no rationale could ever trip). The narrower AC-9 check
(src + test only) → exit 1 (0 matches), which shows the intended scope.
Base-vs-head: at base the phrase matched the crate sources and no 0-match claim
existed; this change wrote E6's claim after `0fea21ad0` added the phrase list to
the carrier, so the claim was false when recorded and is false at head.
Smallest action: amend P7's validator cell and O3/O13's `verified`/E6 evidence
to exclude the pin carrier's own pattern list (as AC-9 and the suite's `self`
skip already do) and record the observed counts — `/aw-local-apply`.

**B3 — surviving old truth: `packages/agentic-workflow-schema/README.md:933-935`
("the runner crate mirrors it with a provenance comment until issue #427
unifies the reading" — PASS_NAMES).**
Reproducer: head `packages/agentic-workflow/src/passes/names.mjs:1-8` is
`export { PASS_NAMES } from "@gtrabanco/agentic-workflow-schema"` — no mirror,
no provenance comment, no second edit on growth.
Base-vs-head: `git show 176ab984b:…/passes/names.mjs` carried the mirror with
that exact comment — true at base, false at head; the README itself was not
touched by the change. Smallest action: rewrite the sentence to the import
reality — `/aw-local-apply`.

**B4 — surviving old truth: `packages/agentic-workflow-schema/README.md:1059-1061`
("The runner crate ships without a dependency on this package … so it mirrors
these sets with a provenance comment and `scripts/unit-doc-contract.test.mjs`
pins the two").**
Reproducer: head `src/edit/Provenance.mjs` imports the doc-provenance sets
(the unit's own Retirements row) — no mirror, no provenance comment; the
"ships without a dependency" clause has been false since #427 (pre-existing
component, disclosed). Note: the `unit-doc-contract.test.mjs:425` pin sub-claim
survives (it deep-equals the crate export against the schema list).
Base-vs-head: `git show 176ab984b:…/src/edit/Provenance.mjs` header mirrored
the sets with a provenance comment — true at base, false at head.
Smallest action: update the paragraph to the import/residency reality —
`/aw-local-apply`.

**B5 — surviving old truth: `packages/agentic-workflow-schema/src/vocabularies.ts:200-202`
(the PASS_NAMES const's own doc comment repeats B3's claim verbatim:
"mirrors it with a provenance comment until issue #427 unifies the reading —
extending this list updates the mirror in the same PR").**
Reproducer/base-vs-head: same as B3; the comment sits inside a file this change
edited (other regions), and the stale lines survived.
Smallest action: rewrite the comment — `/aw-local-apply`.

**B6 — surviving old truth: `packages/agentic-workflow-schema/src/file-schemas.ts:8-14`
("The SDK module at `packages/agentic-workflow/src/edit/schema.mjs` duplicates
with a pointing comment … (or from the SDK's schema.mjs which mirrors these
values)").**
Reproducer: head `packages/agentic-workflow/src/edit/schema.mjs:1-9` — "Every
set here is the schema package's published const … it owns no vocabulary", then
imports; nothing is duplicated or mirrored.
Base-vs-head: `git show 176ab984b:…/src/edit/schema.mjs` duplicated the section
lists with a pointing comment — the duplication claim was true at base; its
"when the crate does not depend on the schema package" condition was already
stale at base (pre-existing component, disclosed).
Smallest action: rewrite the header note — `/aw-local-apply`.

## Advisories

- **A1 — `docs/workflow/MIGRATION.md:78-79`:** "the runner crate's mirror
  follows the same sets (a parity test pins the two)". The parity pin genuinely
  survives (`scripts/unit-doc-contract.test.mjs:425` compares the crate's
  re-export against the schema list), so the assertion still holds; only the
  word "mirror" lags the import architecture. Prose wording, not a false claim.
- **A2 — `docs/features/643-single-source-vocabulary/SPEC.md:59` (S11):**
  "`count recorded before/after`" for `rg -n "Object.freeze\("` is recorded
  nowhere in the unit (SPEC, Log, ledgers, changeset). Observed in this run:
  base 240 hits / 68 files → head 203 hits / 61 files under
  `packages/agentic-workflow/src/`; the residency receipt classifies every
  remaining declaration Class 3 (162), 0 pre-build mirrors (D1). Advisory: the
  acceptance sub-item is unrecorded, not a violation.
- **A3 — closed-unit frozen history** still narrating the pre-change world:
  `docs/fix/201-operator-approved-pass-routing/SPEC.md:67,142,219`,
  `…/planning-evidence.md:12`, `…/planning-obligations.md:18`;
  `docs/features/462-doc-provenance-stamp/planning-evidence.md:12`;
  `docs/features/60-path-protection-guards/decisions.md:59`, `PLAN.md:89`,
  `TASKS.md:43`, `planning-findings.md:18` (old `schema-export` file cell);
  `docs/features/557-verification-materialization/SPEC.md:257`. Dated records
  of closed units — wontfix class by repo precedent; no live surface re-asserts
  them.

## Evidence of the re-run commands (§1)

| claim / obligation | command | observed |
|---|---|---|
| S2/S5/S8, O1/O2/O4/O8/O12 | `bun test scripts/vocabulary-parity.test.mjs` | exit 0 · 35 pass / 0 fail · receipt: 67 imported, 162 Class 3 |
| S3/S9, O5/O6/O11, AC-5/6/8 | `bun test scripts/normative-drift.test.mjs` | exit 0 · 22 pass / 0 fail |
| own probes (AC-6) | `NORMATIVE_DRIFT_REPO=<scratch>` after dropping / inventing a block token and deleting the `rendered-facts` row | each refuses: exit 1 with "the prose dropped a machine token" / "does not publish" / recomputation failure |
| own probe (AC-5) | import `GATE_REJECTION_TYPES` from `dist` | exactly 6 tokens, set-equal to `POLICY.md`'s block rows |
| own probe (S5 sample) | `rg "const <name> = \|export const <name>"` for 6 published names in crate src | 0 local declarations |
| O3/O13/P7, AC-9 | the three `rg` sweeps | 1 / 3 / 0 matches respectively — see B2 |
| O9, AC-4 | `bun test scripts/residue-dimensions.test.mjs`; `rg -c 'vocabulary-residency@1' docs/architecture/ARCHITECTURAL_INVARIANTS.md` | exit 0 · 30 pass; count = 1 |
| O10 | `bun run test` (schema) · `bun run test` (crate) | 914 pass / 0 fail · 1320 pass / 0 fail |
| O10 (node fallback) | `bun run test:node` in schema, crate, pi | exit 0 ×3 (0 fail) |
| P8, O11, budgets | `bun scripts/check-skill-context.mjs --documents` (+ plain) | exit 0 · PASS (AGENTS.md 738/178/560/13,418) · PASS 30 skills |
| P1, O7-lite | `phase-lint …/SPEC.md` | PASS 6/6 ×9 phases |
| O14 | `bun scripts/docs-generate.mjs --check`; `bun scripts/log-immutability.mjs` | exit 0 · "3 checked · 0 stale"; exit 0 · 0 violations |
| O14/AC-12 | `bun scripts/prose-gate-inventory.mjs` | exit 0 · PASS |
| E14 | `bun scripts/dimension-regression.mjs --base origin/main` | exit 0 · verdict clean, 18 dimensions both ends |
| O7 (own differential) | 10 command pairs (`resolve-passes` ×2, `journal name`, `ceremony tier classify`, `guard-command`, `log render` refusal ×3 + pass, `verify` pass + refusal) run on `git archive` base and head trees in scratch, path-normalized | byte-identical stdout/stderr/exit on every pair |
| P2 (red-first) | `bun test scripts/vocabulary-parity.test.mjs` at `073bcf53d` in scratch | 30 pass / **5 fail** (class 1, class 2, invariant home, GATE_REJECTION_TYPES, stale rationale) — red before green holds; commit order `00d5b60df → 073bcf53d → 23afa6dac` |
| O15, AC-10, E13 | `bun scripts/local-gate.mjs` (+ `--no-bail`, full root suite) | **exit 1** — see B1 |
| S11 (pi leg) | `bun scripts/local-gate.mjs --only pi-compat-guard` | exit 0 · PASS 1 step (network step run at verifier's discretion) |

Contract-text qualifier check: every removed/rewritten line in contract and
instruction text (AGENTS.md rows + pointer sentence, GATE_INVENTORY row,
MIGRATION ownership paragraph, TURN_CONTRACT file cell, budgets manifest) was
compared against base — no lost "only/every/never/unless" qualifier, no
conditional↔absolute modality flip; the MIGRATION ownership rewrite matches the
code (`schema/src/paths.ts` owns, crate `index-document.mjs` re-exports).

Corrections for B1–B6 belong to `/aw-local-apply` under its correction bounds;
this receipt is the record that makes the next run a delta verdict.

---

**2026-11-19 — correction batch applied (§9), one batch, blockers B1–B6.**

- **B1 folded** — row 643 settled through the CAS writer (`roadmap read --nn 643`
  → `rowUpsert --expect 6bfc6060`), live diff exactly one line; commit
  `96db8ee9a` + projection `58f393082`; `bun scripts/roadmap-settle.mjs` → PASS,
  0 violations (evidence `E17`).
- **B2 folded** — P7's and O3's validator cells now exclude the pin carrier by
  `--glob`, O13's broken `\|` pattern is a real alternation over `packages scripts`,
  `E6`'s false "0 matches" is corrected in place with the raw-path observation,
  and O3/O13 re-verified on the amended commands (`E18`; base control red at
  `176ab984b`, negative control without the glob finds the carrier).
- **B3–B6 folded** — red-first corpus `b9e55837b` (6 offenders on the four
  surfaces) → prose restated at `e5c9de1e7` (parity 35/35, schema build +
  914/914); the sweep now covers `packages/agentic-workflow-schema/src` and its
  README for good (`E15`).
- **A1 folded** (`MIGRATION.md:78` "mirror" → "re-exports"), **A2 folded**
  (`E16`: 240 hits/68 files at base → 203 hits/61 at head), **A3 wontfix** →
  Findings F9, with `CHANGELOG.md:96` (dated 4.5.0 release record) joining the
  frozen-history list.
- **Loop finding closed** — the batch's own Findings rows moved the
  findings-corpus pin 1153 → 1162 (the pin follows the ledger by design), and a
  stale header count (1147/373) was brought to the asserted truth (1162/229).
- **Recheck evidence** — root-suite 126/126; `bun scripts/local-gate.mjs` →
  **PASS, 19 steps in 486s** (`E19`, replaces E13); the three captured CLI
  commands byte-identical to their pre-batch captures; budgets (documents + 30
  skills), prose-gate, log-immutability, docs-generate `--check`, phase-lint all
  green. **Blockers open: 0.** Awaiting the owner's blockers-only recheck.

