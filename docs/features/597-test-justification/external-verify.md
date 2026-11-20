# External verify — features/597-test-justification

Receipt carrier for the external verification of this unit (append-only: a
correction round appends a dated block; the block below never rewrites).

## 2026-11-19 — full verdict (no prior receipt on file)

Bound state: unit dir `docs/features/597-test-justification/` (SPEC + both
planning ledgers), base `origin/main` = merge-base `bf19d5831`, head
`8b844c68b`; no prior `EXTERNAL VERIFY` block, `external-verify.md` or review
verdict existed for this unit at bind time, so this is the full verdict, once.
Read-only run: no commit, push, branch or forge mutation; the change ships no
script (AC-7), so no new mutation path existed to confine to scratch.

```text
EXTERNAL VERIFY — base: bf19d5831f5117487a6111c3985ca14ece99eef7 · head: 8b844c68bc75529471db89b5647994c0257e2c15
Blockers: 1 —
  1. docs/workflow/SKILL_CONTEXT_BUDGETS.json:484 (the same note repeated at :536, :588, :640, :690, :740, :790, :841 — the eight `execute-phase:*` route source notes) — reproducer: `rg -n 'ceil\(1217 x' docs/workflow/SKILL_CONTEXT_BUDGETS.json` → each new #597 note states final-pr's re-set lines ceiling as `ceil(1217 x 1.10) = 1339`, while `routes["execute-phase:final-pr"].routeLinesMax` is `1217` and `bun scripts/check-skill-context.mjs --routes` reports final-pr measured `15155 est / 1106 lines` (`ceil(1106 x 1.10) = 1217` is the checker arithmetic the manifest carries, and PASS confirms it); no route in the manifest has a 1339 ceiling, and the note itself names final-pr's measurement as 1106 two clauses earlier — it computes the ceiling from the ceiling. Base-vs-head: `git show bf19d5831:docs/workflow/SKILL_CONTEXT_BUDGETS.json | rg 'issue #597|ceil\(1217 x'` → no match (exit 1), so the false restatement is new; stability holds — the reproducer reads only this new note against the manifest value (the file's single other `1339` is fix 318's unrelated pre-existing note). Smallest action: in the eight notes replace `ceil(1217 x 1.10) = 1339` with `ceil(1106 x 1.10) = 1217`. Route: /aw-local-apply.
Advisories: 3 —
  1. docs/features/597-test-justification/planning-obligations.md:25 (O14's status cell) — `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/features/597-test-justification/SPEC.md` exits 2: `VERIFY REFUSAL — obligations-open: obligations row O14 is not closed (status: n/a)`. Why advisory: bare `n/a` is a contract-legal status (`skills/pre-execution-review/references/LEDGERS.md` § 2 status vocabulary) with the reason in the row as that file requires, and the refusal reproduces at base on untouched units carrying the same shape (`verify` on `docs/fix/318-class-escalation-forward-closure/SPEC.md` → same `obligations-open` on O36/O39; `docs/fix/331-authoring-setup/SPEC.md` → O5/O11/O20), so the `CLOSED_STATUS` strictness (`packages/agentic-workflow/src/verify/Verify.mjs:80` accepts `n/a:` only) is pre-existing and this unit touched no package (AC-7); no declared gate invokes `verify`. Smallest action: spell the status `n/a: <reason>` as unit 596's row does, or repair `CLOSED_STATUS` in its own unit.
  2. skills/unit-lane/references/TESTS.md:106 (deletion block, `scheduled` row) and docs/features/597-test-justification/SPEC.md:107-108 (Impact) — both cite `skills/unit-lane/references/PLAN.md` § Retirements, but PLAN.md has no such heading (`rg -n '^#{1,3} .*[Rr]etirement' skills/unit-lane/references/PLAN.md` → empty); the content lives in the retirements pane at PLAN.md:156-182 (`<!-- retirements:start -->`). Why advisory: the pointed-at content exists and does describe the retirement shape a deletion task follows — only the heading marker is wrong, so no reader is led to a wrong rule. Smallest action: cite "PLAN.md retirements pane" (unit 340's spelling) instead of `§ Retirements`.
  3. docs/features/597-test-justification/SPEC.md `## Tasks` — no task carries `(Implements: S7)` or `(Implements: S8)`. Why advisory: neither need is dropped — AC-7 (`git diff --name-only bf19d5831...HEAD -- packages scripts skills/product-audit skills/review-change` → empty) and AC-8 (`rg -c '^- \*\*R' docs/features/597-test-justification/SPEC.md` → 0 matches) re-ran green here, O13 is verified on the same diff, and S8's discharge is recorded in the SPEC's Triaged-steps note; the closure rule's letter asks for a task marker, so the marker gap is reported rather than waved through. Smallest action: add `(Implements: S7)` to P7 and `(Implements: S8)` to the step note.
Sibling sweep: clean — every mention checked asserts the new truth: AGENTS.md's two pointer clauses plus the two `normative-surfaces@1` rows (the guide carries no `delete ≠ weaken` restatement: `rg -c 'delete ≠ weaken' AGENTS.md` → no match); `skills/fold-findings/SKILL.md:11` keeps S3's required "never reclassify or substitute" wording, and FOLD_POLICY.md:33 keeps its `to make it pass` qualifier (the evidenced deletion is outside it); product-audit (`AUDIT_DIMENSIONS.md:238`, `AUDIT_PROCESS.md:102` "never deletes") and review-change ("Findings only; never edit or refactor") match the `nobody-else` row; TEST_IMPACT's never-list and `scripts/test-impact.mjs` (untouched) match "targeting never deletes"; README.md:129 / SKILLS.md:132,176 describe fold as repair without asserting deletion-impossible; ROADMAP row 597 and `docs/generated/units.md:197` agree (`docs-generate --check` PASS); no surviving "no surface authorizes test deletion" claim anywhere outside this unit's own verbatim issue quotes and D2's recorded spelling decision.
Contract-text qualifier check: the diff removes only four lines, all appended-to rather than rewritten — AGENTS.md:210-216 keeps `§ Obligation tags; gate: …` verbatim before its new sentence; GATE_INVENTORY's `normative-surface-grammar` row keeps its entire surfaces list and only gains two ids; TESTS.md's `deletion` tag row keeps its full three-ground list and gains one pointer sentence. The single rewritten line (TESTS.md:25, the `T1` evidence example) adds `— justifies: …` unconditionally while every binding sentence keeps its scope (`this unit authored` at TESTS.md:27, :45; `introduces a test` at TEST_IMPACT.md:75) — no lost qualifier and no conditional↔absolute flip on any binding rule; the example's unconditional rendering is noted, not a finding.
Completeness: S1(P1), S2(P3,P4), S3(P3,P4,P5), S4(P3,P5), S5(P2,P3,P6,P7), S6(P7), S9(P1,P7) each resolve to a task whose validator re-ran green here (context documents/routes/default PASS with AGENTS 614/187/427/12876 and GATE_INVENTORY 182/87/95/8238, prose-gate PASS with `test-deletion-authority` at TESTS.md:109 and `test-justification` at :84, normative-drift 22/0, the wording receipts 1/1/1/2/1/1/1, red-first 60 pairs · 0 findings, lint-changeset ok, docs-generate PASS, root suite 129/0); S7 and S8 resolve through AC-7/AC-8 + O13, all green here, with their task markers absent (advisory 3). Obligations O1–O16: O1–O13 and O15–O16 `verified`, every stated validator re-run green here (O16: `bun scripts/run-root-suite.mjs` exit 0 · 129 PASS / 0 FAIL, and no test or script byte changed; O15: docs-generate PASS + `roadmap check` violations 0 + journal fragment on disk + `journal aggregate --check` → `{"ok":true,"checked":124}`); O14 evidenced `n/a` with its S8 ground (tool caveat = advisory 1) | open ids: none.
Spot check: bun scripts/run-root-suite.mjs → match (exit 0 · 129 PASS / 0 FAIL at head `8b844c68b`, against reported G1 "129 suites, no failure"; the other reported figures were also re-derived exactly: E2's two prose rows, E7's four document measurements, E4's red-first receipt, E8's lint/journal receipts, E10's sibling tallies 15/21/13/30/21/13)
Verdict: NEEDS-DECISION (1 open blocker)
```

## 2026-11-19 — correction batch on the full verdict (owner instruction) · recheck closed

Owner instruction verbatim (recorded at SPEC `## Log` D7): "triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff". One blocker, three advisories, all triaged:

- **Blocker 1 — fixed.** The eight `execute-phase:*` route notes now state
  final-pr's lines ceiling as `ceil(1106 x 1.10) = 1217` — the manifest's own
  value and the checker's arithmetic. Full-symbol sweep:
  `rg 'ceil\(1217 x 1\.10\) = 1339' .` matches only this receipt's verbatim
  quotation of the defect above (frozen record, never rewritten — disclosed, not
  hidden); no live surface carries the string.
- **Advisory 1 — fixed (doc-side).** O14's status cell spells `n/a: <reason>`,
  the closed shape unit 596's ledger ships and `verify` accepts, with the
  evidence still in its `required-evidence` cell (LEDGERS § 2). Triaged out with
  reason: repairing `CLOSED_STATUS`
  (`packages/agentic-workflow/src/verify/Verify.mjs:80`) reproduces at base on
  untouched units 318/331 — a pre-existing tool/contract mismatch for its own
  unit; this batch touches no package (O13 re-run empty).
- **Advisory 2 — fixed.** Both `PLAN.md` §-Retirements citations (TESTS.md:106
  and the SPEC's Impact :107-108) now say "retirements pane" — the heading
  PLAN.md does not have.
- **Advisory 3 — fixed where honest.** P7 carries `(Implements: S7)` and AC-7's
  diff check joins its validator; S8 is a prohibition no task honestly
  implements, so its carrier is the dated disposition at SPEC D7, proved by
  AC-8's validator re-run green (E15).

Frozen-failure corpus: RED recorded at SPEC E13, GREEN at E14 — the records use
bracketed spellings so this unit's own receipts never self-match their quotations
(the #596 receipt's technique; the first draft of E13/E14 self-matched and was
repaired before this block was written).

Recheck (correction bounds — the findings' rows only, plus the no-breakage
sweep), all foreground, all recorded at SPEC E15: `verify` exit 0 ·
`violations: []`; normative-drift 22/0; prose-gate PASS with both rows unmoved
(TESTS.md:109 / :84); guide-split 17/0; inviolable-rules 14 rows PASS; the eight
wording receipts 1/1/1/1/2/1/1/1; context ×3 exit 0 with both document
measurements unchanged (614/187/427/12876 · 182/87/95/8238) and `PASS route
budgets: 14 routes`; red-first 60 pairs · 0 findings; lint-changeset ok;
docs-generate PASS (roadmap unchanged); roadmap check violations 0; AC-8 no
match; skill-lint PASS; sibling suites pre-execution-quality 1/0 ·
ledger-ownership 15/0 · unit-doc-contract 21/0 · promise-coherence 37/0; whole
gate `bun scripts/run-root-suite.mjs` exit 0 · **129 PASS / 0 FAIL**. No other
surface turned red — the loop did not fire a second pass.

Next: owner delta re-verify over the batch diff — this block is now the latest
receipt for that run.
