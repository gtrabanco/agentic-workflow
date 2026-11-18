# 621 — external verification receipt

2026-11-17 · first (and full) receipt for this unit — no prior `EXTERNAL VERIFY`
block anywhere in the unit dir, no review verdict on record → full verdict, once.
Free-text intent carrier: PR #622 (selects the target, waives no check).
Read-only run: no commit, no push, no branch, no forge mutation; every
unproven-mutating probe ran in `mktemp -d` scratch; live CLI only with
`--no-state`; working tree clean after the run except this file.

```text
EXTERNAL VERIFY — base: 5334f5af (origin/main; merge-base 7c1fce0b) · head: 78dc2292 (2026-11-17)
Blockers: 4 —
  B1 scripts/batch-scheduler.mjs:1118,1194-1199 — an issue that declares no surface gets the lane-guess fallback `general` (line 1118) and, when its live branch's diff was computed, emits `claimed_surface: ["general"]` — a surface the issue never declared, beside the `surface-unknown-issue-<n>` degradation that says the declaration is unknown; contradicts S3/O5 ("exactly the declared surfaces that diff leaves uncovered") and PLAN.md's "the declared surfaces …". Reproducer: buildBatchPlan with a prose-only body + slot `{branches:[{name:"feat/10-x",merged:false}], pr:{number:900,state:"CLOSED"}, files:["scripts/tool.mjs"], filesKnown:true}` → `#10 lane=general claimed_surface=["general"]`; also reproduced end-to-end through collectLaunchEvidence in a mktemp git fixture (root-file diff, CLOSED-PR leftover branch). Base-vs-head: at merge-base 7c1fce0b the identical input emits no field at all (three-way differential: base issue#10 `claimed_surface=null`, head `["general"]`; base code has no field). Stability: every declared-surface input (parent covered/uncovered, exact key, partial coverage, no-branch, merged, diff-failed) stays quiet. Smallest action: suppress emission for rows whose surfaces came from the `general` fallback (guard on the in-scope `surfaceUnknown` set).
  B2 docs/fix/621-batch-scheduler-surface-verification/planning-obligations.md:23 (O11) + SPEC.md:226 (P3) — stated outcome "one line per issue that carries the field" does not reproduce: two flagged issues produce ONE joined summary line (scripts/batch-scheduler.mjs:1910 `claimedSurfaces.join(", ")`). Reproducer: two issues each carrying the field → printHumanSummary yields 1 claimed line (`#20: docs, #21: docs`), not 2. Base-vs-head: the summary section and the O11/P3 wording exist only in this change; base carries neither. Stability: the single-flagged-issue input (the SUM fixture) stays green — the mismatch appears only at ≥2 flagged issues, the exact input the wording governs. Smallest action: align P3/O11 wording to the single-section-line behavior (or split the write) — implementer's call.
  B3 docs/features/107-mechanization-inventory/INVENTORY.md:204 — surviving sibling asserts the old truth in present tense: "the field set is published (`batch-plan@3`)". Reproducer: `rg -n 'batch-plan@3' docs/features/107-mechanization-inventory/INVENTORY.md` → line 204. Base-vs-head: true at base (@3 was the live token), false at head (@4). Precedent: the previous bump's commit 371b5a0b (docs(509)) updated this exact row `@2`→`@3`, so the token bump's sibling scope includes it. Smallest action: token → `batch-plan@4` on that line.
  B4 docs/fix/621-batch-scheduler-surface-verification/SPEC.md:170 (AC-S1's Check) and :310 (E12) — the declared closure commands do not produce their recorded results: `rg -n '^AC-S[1-6]' docs/fix/621-batch-scheduler-surface-verification/SPEC.md` exits 1 with 0 matches (the AC ids are `- **AC-S1**` list items) while E12 records "→ 6 matches"; `rg -c 'Closes #621' docs/fix/621-batch-scheduler-surface-verification/SPEC.md` prints 6 — at head and at the freeze commit fb2d3d6e alike — while E12 records "→ 2". Reproducer: run both commands verbatim. Base-vs-head: the doc and its commands are introduced by this change; base carries neither. Substance intact (6 AC ids exist via unanchored search; `Closes #621` ≥ 1) — the receipt/verifier is what fails. Smallest action: fix the anchor and re-record E12's two counts from the commands' actual output.
Advisories: 5 —
  A1 PR #622 body — describes the superseded state (`batch-plan@3`, "string o array", "87 tests pass") versus what ships (`batch-plan@4`, `string[]`, 93/909 green); forge text is owner-owned and this run is read-only — refresh before merge.
  A2 docs/fix/621-batch-scheduler-surface-verification/SPEC.md:355 (Regression scope) — cites "the `V` cases" as the verifier for the `[worktree]` evidence tag, but no test in scripts/batch-scheduler.test.mjs asserts `[worktree]`. Behavior itself verified true by this run (probe: `PR #906 open + branch feat/18-x [worktree]`) — advisory: mis-cited verifier; also "still tags" is pre-existing only relative to this branch's own first commit (the tag is new versus origin/main).
  A3 docs/features/470-content-guard-layer/SPEC.md:92,114,134,448 (in-progress sibling unit) — narrates the live envelope as `batch-plan@3`; not this change's document — 470's own verification must re-point the token when it lands after this bump.
  A4 AC-S4's §6.3 probe (research note §6.3) passes vacuously at head — the hand-built slot carries no `filesKnown`, so the field is suppressed by the filesKnown gate regardless of the parent rule; the real proof is the `PS` suite case (green) plus this run's own parent probes (covered → undefined, uncovered → `["skills"]`). E5's "after" observation reproduces.
  A5 contract-text qualifier check — no lost qualifier (only/every/never/unless) and no conditional↔absolute flip on any binding rule across the PLAN.md/SKILL.md/README/SKILLS.md/schema-comment rewrites; two illustration losses only: PLAN.md's `degraded[]` row dropped "(launch reads: `unavailable-launch-evidence-*`, `unavailable-forge-pr-list-*`)" and "so its lane is a guess" (semantics survive in the `lanes[].surface` row and the constraint list) — prose advisory.
Sibling sweep: 1 blocker + 1 advisory — B3 (INVENTORY.md:204, present-tense `batch-plan@3` survivor of the exact row the @2→@3 bump updated) and A3 (470's in-progress SPEC). Owned surfaces clean: README.md, docs/workflow/SKILLS.md, skills/batch-scheduler/SKILL.md + references/PLAN.md, scripts/batch-scheduler.mjs, schema source/corpus/projection (suite pin `envelope: no owned surface keeps a superseded batch-plan token` green; `rg` confirms). `batch-plan@3` survives elsewhere only in dated receipts (fix/460, 509, 574 unit docs, LOGS.md, the research note, ROADMAP's #509 row, 509's external-verify) — correctly untouched. No live `string|array` claim for `claimed_surface` outside the PR body (A1) and receipts.
Completeness: S1–S6 resolved — each S# has its `(Implements: S#)` task (P1: S2,S3; P2: S3,S4; P3: S3; P4: S2; P5: S5,S6; S1 binds) whose validators re-run green here; obligations O1–O18 all `verified` with validators re-run green EXCEPT O11 (stated outcome fails at ≥2 flagged issues — B2) and O18's evidence line E12 (B4). open ids: O11, O18 (evidence chain).
Spot check: node scripts/run-root-suite.mjs → match (exit 0, 121 PASS / 0 FAIL — equals the reported G1/E10 "exit 0 · 121 suites PASS").
Verdict: NEEDS-DECISION (B1 B2 B3 B4)
```

## Declared verification commands — observed (2026-11-17)

| command | observed |
|---|---|
| `bun test scripts/batch-scheduler.test.mjs` | exit 0 · 93 pass / 0 fail (= E4) |
| `cd packages/agentic-workflow-schema && bun run test` | exit 0 · 909 pass / 0 fail (= E3/G1) |
| `bun scripts/check-skill-context.mjs --routes` | exit 0 · `PASS route budgets: 14 routes` (= E8) |
| `bun scripts/check-skill-context.mjs` | exit 0 · `PASS context budgets: 30 skills` |
| `bun scripts/docs-generate.mjs --check` | exit 0 · `3 checked · 0 stale` (= E9) |
| `bun scripts/skill-lint.mjs` | exit 0 · `0 finding(s)`, PASS (= E11) |
| `bun scripts/lint-changeset.mjs .changeset/fix-621-batch-scheduler-surface-verification.md` | exit 0 · ok |
| `node scripts/run-root-suite.mjs` (spot check, run twice) | exit 0 · 121 PASS, none red (= E10/G1) |
| `bun scripts/batch-scheduler.mjs --no-state --json-only` (live) | exit 0 · `batch-plan@4`, `claimed: 0`, `degraded: []`, no claimed-surfaces summary line; state dir unchanged (= E7's point; `launched: 1` vs E7's `[]` is work-graph drift since 2026-11-17, not a regression) |
| `rg -n '^AC-S[1-6]' …/SPEC.md` | **exit 1, 0 matches** — recorded as "6 matches" by E12 (B4) |
| `rg -c 'Closes #621' …/SPEC.md` | **6** (head and freeze commit fb2d3d6e) — recorded as "2" by E12 (B4) |

## Own probes (in `mktemp -d` scratch, removed after)

- §6.3 probe verbatim (research note §6.3): `#10 lane=skills claimed_surface=undefined` — matches E5's "after".
- buildBatchPlan matrix: parent covered/uncovered, exact key, partial coverage (only uncovered reported), no-branch, merged, diff-failed, `[worktree]` tag, summary line count — all match the contract except B1 (`["general"]`) and B2 (1 line for 2 flagged issues).
- collectLaunchEvidence through a real mktemp git fixture: diff computed (`filesKnown: true`, exactly the uncovered surface), diff failed via git shim (`unavailable-launch-evidence-diff-issue-77-fatal-bad-rev`, `filesKnown: false`, no field), merged branch (no diff read, no field, no invented degradation), no-declaration case (B1 end-to-end).
- Validator + compiled projection (dist + strict Ajv, node and bun): token/version 4 on both surfaces, `string[]` accepted, bare string/empty/non-string/empty-entry refused on both, `@3` stamp refused (`version must be 4`), unknown issue key refused.
- Three-way differential (merge-base 7c1fce0b · on-branch a5e91cce · head) over one fixed corpus: 8 and 6 differing leaf paths, every one in the intended families (`version`, `schema`, `claimed_surface`, `[worktree]` evidence) — O17/O16 substance reproduced; no other field changed.

## 2026-11-17 — correction addendum (owner-directed repair, post-receipt)

Owner instruction (verbatim): "Apply to this repository: triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff" → one correction batch on blockers B1–B4, plus
advisory A2's cited-verifier gap; A1/A3/A4/A5 triaged as remaining advisories
(owner forge text, cross-unit doc, receipt probe, prose illustrations).

- Red pins first: `9e2c7fcb` (`bun test scripts/batch-scheduler.test.mjs` · exit 1 ·
  93 pass / 3 fail — CS5, SUM2, the extended stale-token sweep).
- Fixes: `ba3668f9` (suite exit 0 · 96 pass / 0 fail). B1 guard = the in-scope
  `surfaceUnknown` set; B2 = one labeled summary line per flagged issue (single
  flagged issue byte-identical); B3 = the 107 INVENTORY row → `batch-plan@4`,
  now owned by the sweep.
- Differential vs `78dc2292`: exactly 1 differing leaf path (the phantom
  `general` row removed), nothing else; two-flagged claimed lines 1 → 2.
- B4: AC-S1's Check re-anchored to `'^- \*\*AC-S[1-6]\*\*'` (exit 0 · 6 matches);
  E12's two recorded counts are superseded by the unit doc's E17 (the Log is
  append-only, so E12 itself stands as history).
- A2 closed: the `V6` pin asserts the `[worktree]` tag the regression-scope row
  cites.
- Next: external re-verify of this batch (delta verdict over the receipt above).
- Receipt-sha repair (found by `agentic-workflow verify` while re-checking, not
  in the receipt): every `G<n>` line must carry a resolvable 40-hex `HEAD` sha
  (`verify@1` non-negotiable). **G1 pre-existed malformed** (no HEAD sha — cut
  before this batch; its own self-note already contemplated the attribution) and
  G2 was being written the same way; both now cite their gated tree
  (`HEAD fb2d3d6ee0afd674d5cd427044e092185e258d17` and
  `HEAD 5f58818185505cebaae80c2d673844bdea0b4dc3`). The G1 line's own bytes were
  amended to add the sha — disclosed here because the Log's append-only rule
  governs entries, and the verifier's receipt grammar is the non-negotiable one.
- Advisory A6 (pre-existing, disclosed): `phase-lint <SPEC>` answers
  `spec-unlinked: S1 is implemented by no phase` → `verdict BLOCKED:
  lint-blocked` — byte-identical fingerprint at the original cut `fb2d3d6e`
  (same verdict, same sha), so this batch did not cause it; fix units 460 and
  509 carry the same verdict for the same binding-request-shaped S1 ("Apply to
  this repository: …") and shipped with it. Not repaired here: binding a phase
  to an `(Implements: S1)` claim it does not truthfully carry would game the
  lint with the frozen Tasks — an owner-level semantic call. Not part of the
  declared verification (the root suite's phase-lint leg is fixture-based and
  green).
- `unit-route docs/fix/621-…` answers "all phases recorded but status is
  'in-progress' — settle the index or roadmap status before routing to
  close-out": the expected answer for a unit awaiting the owner's verdict, not
  a defect.
