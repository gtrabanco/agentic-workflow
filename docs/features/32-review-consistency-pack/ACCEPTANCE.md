# Acceptance manifest v1 — 32-review-consistency-pack

Status: frozen

Frozen 2026-09-18 by `plan-feature-scaffold` from the SPEC's acceptance criteria
AC-01…AC-11. One stable ID per SPEC criterion; validators copied from the
criteria. The manifest is the implementation/review finish line, not a second
specification; the executor may strengthen coverage but never move it.

| ID | Required outcome | Validator |
|---|---|---|
| AC-01 | Sole-flipper wording pinned: `PERSIST_AND_DECIDE.md` and `FOLDING.md` attribute the fold-flag flip to `ledger-ownership@1` / `fold-findings:folded-flag` only; the `LEDGERS.md` sentence crediting `triage-issue` is corrected; the tutorial scan over `docs/workflow/` finds no contradicting restatement outside `GOLDEN_FIXTURE.md`'s dated run-log history; ownership unchanged | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the IS-1 pins green; `node --test scripts/ledger-ownership.test.mjs` → exit 0; `grep -rnE "only step that ever flips\|one and only ledger state transition" docs/workflow/ --include=*.md` → no match |
| AC-02 | Canonical severity table: the conversion section exists in `skills/review-implementation/references/CLASSIFY.md` as sole owner, covers all four producer scales (ledger `high\|med\|low`, finder `critical\|major\|minor`, planning `info\|low\|medium\|high\|critical`, `audit-docs` `high\|low`), and unknown scales fail closed; the ad-hoc mapping is gone; `audit-docs` emits `<n>/14` with the `\| # \| Check (1-14) \|` header and no phantom `MEDIUM`; `product-audit` no longer uses `postpone`/`tradeoff` and references the closed class set | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the conversion-table and fail-closed pins green; `grep -n "MEDIUM" skills/audit-docs/SKILL.md` → no match; `grep -nE "postpone\|tradeoff" skills/product-audit/` → no match |
| AC-03 | Derived blocking gate pinned in `CLASSIFY.md`: the four citation categories (a verification criterion that is unverified, an obligation row outside `verified`/`n-a`, a gate red at the reviewed head, an open confirmed `fix-now` row), the no-citation ⇒ `report-note` never-blocking outcome, and D10's verdict rule text unchanged | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the blocking-gate and D10 pins green |
| AC-04 | GATE-RAN pinned: the fixed format `GATE-RAN \| HEAD <sha> \| <cmds> \| exit <code>`, the additive-slots rule, the reserved trailing `manifest <sha>` slot, the identical-head-only reuse rule, and the changed-head ⇒ re-run rule; the `ledger-ownership@1` map's `review-findings` row declares `execute-phase:gate-ran-marks` + `review-change:review-gate-ran-marks`, and both template projections carry the identical owner cell | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the `gate-ran@1` pins green; `node --test scripts/ledger-ownership.test.mjs` → exit 0 with the extended map row and both projections |
| AC-05 | Substrate notice pinned: a missing repository-state ledger yields a non-blocking machine-readable notice and zero missing-ledger blockers; `draft`, `contradicted`, and `resolved` still block | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 with the missing-ledger case and the three regression cases green; `node --test scripts/workflow-status-pre-execution.test.mjs` → exit 0 |
| AC-06 | Triage modes pinned: `review-change`'s relationship text names `triage-issue`'s three modes (proposals, audit findings, `--prioritize-now`) | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the triage-modes pin green |
| AC-07 | Roadmap verify-vs-write pinned: `plan-feature` verifies the roadmap row, `plan-feature-scaffold` remains the sole `defined → planned` writer | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the roadmap pin green; `node --test scripts/bounded-delivery-loops.test.mjs` → exit 0 |
| AC-08 | `audit-pr`'s closure-integrity result scale reads `pass \| blocker \| n-a` and `warning` appears in no verdict scale; the receipt-at-head merge gate is unchanged | `node --test scripts/review-loop-discipline.test.mjs` → exit 0 with the scale pin green; `node --test scripts/audit-pr-receipt.test.mjs` → exit 0 |
| AC-09 | Health gates green: the context-budget gate passes after the minor bumps, the drift gate passes, the schema package suite passes with no package change, and the Pi package suite passes after re-bundling | `node scripts/check-skill-context.mjs` → exit 0; `node --test scripts/normative-drift.test.mjs` → exit 0; `cd packages/agentic-workflow-schema && bun run test` → exit 0; `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` → exit 0 |
| AC-10 | Bibliography: after this feature's PR merges, `README.md` carries the arXiv:2603.00539 entry under a bottom `## References` section, deduped against other features' entries; verified at PR close-out, never before merge | read-verified: the entry and its section are quoted in the P5 phase handoff; the diff shows the append and no other README edit |
| AC-11 | Bumped skills' frontmatter versions are minor-incremented for every touched skill, and no discipline pin was removed or weakened (additions plus the rewordings this SPEC mandates) | `grep -n "^version:" skills/*/SKILL.md` compared against the pre-change revisions shows a minor increment for every touched skill; read-verified: the change is additions plus the mandated AC-01/AC-02 rewordings |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review
  and named manual checks remain required.

## Commands

- `node --test scripts/review-loop-discipline.test.mjs`
- `node --test scripts/ledger-ownership.test.mjs`
- `node --test scripts/workflow-status-sensor.test.mjs`
- `node --test scripts/workflow-status-pre-execution.test.mjs`
- `node --test scripts/bounded-delivery-loops.test.mjs`
- `node --test scripts/audit-pr-receipt.test.mjs`
- `node --test scripts/normative-drift.test.mjs`
- `node scripts/check-skill-context.mjs`
- `cd packages/agentic-workflow-schema && bun run test`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
