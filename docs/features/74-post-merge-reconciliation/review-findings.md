# Review-findings — 74-post-merge-reconciliation

Review pass over the **union** of PR #280 (issue #270, review-conformance) and PR #276 (issue #272, phase-lint unit-doc grammar), both merged onto `main`. Branch-level verdicts did not cover the combination; this is the combination's receipt (issue #275, scope item 1 / AC-1).

Scope: 22 files (PR #280 diff `01f2bd72..f470c85b` + PR #276 diff `63001fd6..c89ee83f`; shared: CHANGELOG.md, SKILL_CONTEXT_BUDGETS.json, skills/unit-lane/SKILL.md, skills/unit-lane/references/PLAN.md). Run context-clean: five isolated axis reviewers (code, verify, security, perf, brand) received only the scope + their axis checklist; the orchestrator fused and classified.

## Applicability

| Axis | Verdict | Notes |
|---|---|---|
| review-code | FAIL | RC-1 |
| review-verify | FAIL | V1 (fixed during this review, see F-74-2) |
| review-security | PASS | no findings (no secrets, no injection surface, linear regexes, version-bump-only package.json) |
| review-perf | PASS | no findings (no catastrophic backtracking; 40 MB adversarial doc linted in 1.84 s) |
| review-brand | PASS | B1 proposal, B2 ignore; English-only holds, no AI stamps |

## Classified findings

| id | file:line | axis | severity | class | route | folded |
| --- | --- | --- | --- | --- | --- | --- |
| F-74-1 | scripts/unit-doc-phases.mjs:37,40 (called from scripts/phase-lint.mjs:799; introduced by PR #276) | code | med | fix-now | route-to-owner — the defect rides PR #276's parser alone (reproduced 2026-10-17: fixture with a fenced `## Tasks` + fake `- P9 —` example in `## Objective`, real `## Tasks` with `P1` after → `P9 Phase-lint: PASS (6/6)` / `verdict PASS`, exit 0; the real P1 never linted). Same fail-open class R-272-1 fixed for bullets, left open for the `## Tasks` heading locator, which runs outside the fence state machine. Out of THIS unit's scope (issue #275 non-goals forbid re-opening #272's own scope; the combination does not break here) — owner: the fix/272-phase-lint-unit-doc-grammar surface; re-enter via `/triage-issue` on a new fix unit. Fix shape: run the fence scanner from document start and locate `## Tasks`/the body bound only outside fences | no |
| F-74-2 | docs/features/74-post-merge-reconciliation/SPEC.md:59-60 (Tasks P2/P3 validator spans) | verify | major | fix-now | fold — this unit's own doc failed the grammar it verifies (`P2 box-8: (validator: …) carries no expected outcome`, `P3 box-8: … no backticked command`, `verdict BLOCKED: lint-blocked`); rewritten into the enforced shape (backticked command + `exits with code 0` / `verdict PASS` anchors; no standalone `or` for box-5), `node scripts/phase-lint.mjs docs/features/74-post-merge-reconciliation/SPEC.md` → `verdict PASS` (P1/P2/P3 all 6/6) · fold 7d075a8a | yes |
| F-74-3 | docs/workflow/SKILL_CONTEXT_BUDGETS.json (route `execute-phase:unit-loop`) | verify | low | debt | ceiling carries 24% slack above the floor (measured 10162 est / 811 lines, stored 13655/984, floor ceil(m×1.10)=11179/893). Policy-compliant (all raises name growth sources; rule "re-based down when trim work lands" owns the normalization). **Re-trigger:** the next `execute-phase:*` wording change that grows the route past 13655 est / 984 lines forces a re-basis with a new named source | n/a (debt) |
| F-74-4 | docs/workflow/SKILL_CONTEXT_BUDGETS.json (`skills/unit-lane` absent) | verify | low | observation | unit-lane rides the 2800 default with measured 2742 — 58 units (2.1%) headroom after PR #280's PLAN.md growth. **Re-trigger:** the next unit-lane SKILL.md wording touch forces its first per-skill re-basis entry | n/a (observation) |
| F-74-5 | docs/features/69-review-conformance/SPEC.md (References; shipped in PR #280) | brand | low | proposal | same PR flips ROADMAP row 69 to `done · [#280]` while its References bullet still says row 69 `in-progress` (adjacent staleness already filed as that unit's F33/F38) — one-word docs commit if the owner folds | n/a (proposal) |
| F-74-6 | CHANGELOG.md (0.18.5 row, PR #276) | brand | low | ignore | "No package code change — the skill tree is pack-time output" sits beside a description of a bundled-behavior change; verified accurate, reads self-contradictory only to a first-time reader | no |
| F-74-7 | Review receipt — PR #298 carries zero comments/reviews at head `9dfc73237a63cbb277817e1e5c49d61c844c25bb` (audit-pr Step 1, `bun scripts/review-receipt.mjs verify --pr 298` → status `absent`, exit 3) | Review receipt | high | fix-now | route `/review-change` — re-review at the head to post the `REVIEW-PASS` marker; also unblocks the receipt-carried gates **Acceptance coverage** and **Architectural invariants** (no coverage field / no explicit invariant result while the receipt is absent), then re-run `/audit-pr` | no |
| F-74-8 | docs/features/74-post-merge-reconciliation/SPEC.md:77 (`## Obligations`; the enforced embedded shape is `### Obligations`, and rows O-74-1, O-74-2, O-74-3 all carry status `open`) | Pre-execution lineage | high | fix-now | route `/unit-lane 74-post-merge-reconciliation` — reshape the embedded ledger and close every row `verified`/`n/a: <reason>` until `bun scripts/unit-lineage.mjs --unit 74-post-merge-reconciliation` prints `LINEAGE OK`; then re-run `/audit-pr` | yes |
| F-74-9 | docs/features/74-post-merge-reconciliation/review-findings.md:21 (F-74-1, `folded: no`) | Deferral | high | fix-now | route `/triage-issue` on F-74-1 — no tracked issue exists (zero issues born since branch divergence `2026-10-17`; no issue matches `unit-doc-phases`/fenced-`## Tasks`; #272 closed and #275 non-goals forbid reopening); file + classify the fix issue, then `/unit-lane --fix <n>` on the owner surface; re-run `/audit-pr` | no |
| F-74-10 | docs/features/74-post-merge-reconciliation/SPEC.md:124 (`## Next` instructs "Merge PR #298 … the combination itself is green") | brand | med | fix-now | fold — rewrite `## Next` to the ledger's actual state: the PR carries no `review-change` receipt (F-74-7, `bun scripts/review-receipt.mjs verify --pr 298` → absent, exit 3), F-74-1's deferral is untracked (F-74-9), and F-74-10 + F-74-12 are open docs repairs; hand off the fold, then `/triage-issue` on F-74-1, and instruct no merge before a REVIEW-PASS receipt at the PR head | no |
| F-74-11 | docs/features/ROADMAP.md:84 (blank line between roadmap row 73 and the new row 74) | workflow | med | fix-now | fold — delete the blank line so row 74 continues the roadmap table (GFM ends the table at a blank line, so row 74 renders outside it and the heading below loses its separating blank line); verify rows 73 and 74 are adjacent with one blank line before the `## Bureaucracy-reduction execution order` heading | no |
| F-74-12 | docs/features/74-post-merge-reconciliation/SPEC.md:89,92 (AC-2 and AC-5 Evidence rows) | verify | med | fix-now | fold — make each Evidence command byte-reproducible: AC-2's second grep elides its target with `…` (real target `skills/unit-lane/references/PLAN.md`, and `grep -c` exits 1 at zero matches), and AC-5 records `grep -ci mcp` as exit 0 where the command exits 1 on a zero count; record the real exit code or a `; true`-wrapped form so the recorded exit is reproducible (AC-4's aggregate-suite citation is the same class at low, report-note) | no |
| VF-74-1 | docs/features/74-post-merge-reconciliation/SPEC.md:124 · reviewer review-change · HEAD 7eebaa10b0c7cb583e63d877b7b9150bd3752f81 · recheck direct read of the cited text against the ledger's open rows (F-74-7, F-74-9) | brand | confirmed | finding-mark | n/a | n/a |
| VF-74-2 | docs/features/ROADMAP.md:84 · reviewer review-change · HEAD 7eebaa10b0c7cb583e63d877b7b9150bd3752f81 · recheck direct read: line 84 is empty between row 73 (line 83) and row 74 (line 85) | workflow | confirmed | finding-mark | n/a | n/a |
| VF-74-3 | docs/features/74-post-merge-reconciliation/SPEC.md:89,92 · reviewer review-change · HEAD 7eebaa10b0c7cb583e63d877b7b9150bd3752f81 · recheck command re-run: `gh pr diff 280 --name-only` piped to `grep -ci mcp` prints 0 and exits 1; AC-2's second command carries `…` in place of its path | verify | confirmed | finding-mark | n/a | n/a |

## Combination checks (clean)

- `PLAN.md` carries both PR #276's grammar paragraph/validator item and PR #280's sweep section coherently; no conflict markers; `phase-contract` 1.1.0 stays the format owner.
- `SKILL_CONTEXT_BUDGETS.json` merges validly (JSON parses; no duplicate/orphan keys from the two branches' independent edits); ceiling math spot-verified exact (`ceil(2901×1.10)=3192`, `ceil(16812×1.10)=18494`, `ceil(1218×1.10)=1340`); no ceiling below its floor; no raise without a named growth source.
- CHANGELOG rows for unit-lane 1.1.1/1.2.0, review-change 3.9.0, product-audit 3.4.0, pi-package 0.18.5 each appear exactly once with consistent version chains; ROADMAP rows 69 → 70 in order; no `.pi/mcp*` path in either PR's diff.

## Marks

| MARK | HEAD | commands | result | review-mark | finding-mark | gate-ran |
|---|---|---|---|---|---|---|
| REVIEW-RAN | HEAD 7d075a8a3c96de87e3481353b4f8d539c75f53e6 | n/a | n/a | review-mark | n/a | n/a |
| REVIEW-RAN | HEAD 7eebaa10b0c7cb583e63d877b7b9150bd3752f81 | n/a | n/a | review-mark | n/a | n/a |
| GATE-RAN | HEAD 7eebaa10b0c7cb583e63d877b7b9150bd3752f81 | node --test scripts/*.test.mjs \| bun scripts/check-skill-context.mjs \| bun scripts/check-skill-context.mjs --routes \| node scripts/phase-lint.mjs docs/features/74-post-merge-reconciliation/SPEC.md \| bun scripts/unit-lineage.mjs --unit 74-post-merge-reconciliation | exit 0 \| exit 0 \| exit 0 \| exit 0 \| exit 0 | n/a | n/a | n/a |
| GATE-RAN | HEAD 7d075a8a3c96de87e3481353b4f8d539c75f53e6 | node --test scripts/*.test.mjs \| bun scripts/check-skill-context.mjs \| bun scripts/check-skill-context.mjs --routes \| node scripts/phase-lint.mjs docs/features/74-post-merge-reconciliation/SPEC.md | exit 0 \| PASS (28 skills) \| PASS (14 routes) \| verdict PASS | n/a | n/a | n/a |

## Manual checks (not reproducible here)

- Mutation check on phase-lint.test.mjs / golden-fixture.test.mjs assertions (reviewer forbidden from editing files).
- Weak-model golden-fixture prose run (GOLDEN_FIXTURE.md dated row is a recorded claim).
- F-74-1's fence-scanner repair (owner unit re-opens it).

**Verdict: REVIEW-FAIL (one open fix-now, F-74-1 — routed to its owner; not repairable inside #275's non-goals).** Everything the combination itself breaks is green; F-74-2 (the one defect the combination's own review target carried) is folded at `7d075a8a`.
