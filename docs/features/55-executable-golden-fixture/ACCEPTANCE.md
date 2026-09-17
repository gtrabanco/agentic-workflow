# Acceptance manifest v1 — 55-executable-golden-fixture

Status: frozen

Frozen finish line for this unit. The implementation and every review read these
same bytes; executors may strengthen coverage but never move, narrow, or rewrite
a validator.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` exits 0, prints per-phase `PASS (8/8)` and final verdict `PASS`, and its stdout block is byte-identical to `scripts/fixtures/golden-fixture/expected/phase-lint-toy-plan.txt` | command: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` then `diff <(node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md) scripts/fixtures/golden-fixture/expected/phase-lint-toy-plan.txt` → exit 0, empty diff |
| AC2 | `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` exits non-zero, prints verdict `BLOCKED`, and emits at least one finding token `box-<n>` | command: `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` → exit 1, stdout matches `verdict BLOCKED` and `box-[0-9]+` |
| AC3 | `node --test scripts/golden-fixture.test.mjs` exits 0 on a clean tree and covers the five declared check groups — (a) the AC1/AC2 phase-lint cases, (b) envelope validity both directions through `scripts/schema-runtime.mjs`, (c) the run-log Result grammar with the 2026-09-18 cutoff and grandfathering, (d) fixture/doc cross-reference existence, (e) audit-target trap invariants | command: `node --test scripts/golden-fixture.test.mjs` → exit 0, every declared check green |
| AC4 | The suite contains a built-in tamper case: it copies a fixture tree to a temp dir, mutates one byte, and asserts the corresponding check fails with a message naming the mutated fixture path and the violated assertion, without editing committed files | command: `node --test scripts/golden-fixture.test.mjs` (the tamper test) → tamper assertion fails as expected, and `git status --porcelain -- scripts/fixtures/golden-fixture/` → empty afterwards |
| AC5 | The doc slim holds: `grep -rn "csv-export-command" docs/ \| grep -vE '^(docs/workflow/GOLDEN_FIXTURE\.md:[0-9]+:\| 20\|docs/features/)'` returns no output; `docs/workflow/GOLDEN_FIXTURE.md` is ≤ 150 lines and points at `scripts/fixtures/golden-fixture/`; `grep -n "Tool-calling smoke test" docs/workflow/GOLDEN_FIXTURE.md` and `grep -n "Fixed pass criteria" docs/workflow/GOLDEN_FIXTURE.md` each return a match, and the retained pass criteria carry the "No invented steps" rule | command: the three greps above plus `wc -l docs/workflow/GOLDEN_FIXTURE.md` → ≤ 150; no live slug hit outside the grandfathered rows |
| AC6 | The audit-target fixture reproduces the four traps as file facts: `audit-target/docs/fix/README.md` shows row `9 — stale-cache` as `in-progress`; `audit-target/docs/adr/` ends at `0047-transport.md`; `audit-target/docs/audits/3-*.md` exists and mentions `F2` | command: `node --test scripts/golden-fixture.test.mjs` (the audit-target check) → three assertions green |
| AC7 | Cross-reference integrity: the `CLAUDE.md` fixture pointer and the `docs/workflow/README.md` index line resolve to the existing doc, and the doc names only fixture paths that exist | command: `node --test scripts/golden-fixture.test.mjs` (the cross-reference check) → pointer present, zero missing paths; `read-verified`: both pointers open the existing doc |
| AC8 | Determinism: `grep -nE "Date\.now\|Math\.random\|fetch\(\|https?://" scripts/golden-fixture.test.mjs` returns no matches; `read-verified`: the suite passes with network access disabled | command: the grep → no matches; `read-verified`: suite run offline → exit 0 |
| AC9 | Registration and wiring: roadmap row 55 ships with the corrected summary and reaches `done · [#<pr>](<pr-url>)`; the `docs/workflow/README.md` index line and the `CLAUDE.md` verification list name the executable suite | command: `grep -n "55" docs/features/ROADMAP.md`, `grep -n "golden-fixture" docs/workflow/README.md CLAUDE.md` → one matching line each naming the suite |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Do not regenerate `expected/phase-lint-toy-plan.txt` to match a changed linter output: a moved snapshot is a reviewed re-pin (fix the cause first), never a silent re-record.
- Do not rewrite, reorder, or prune any existing run-log row: the log is append-only evidence, and the 43 grandfathered rows stay byte-identical.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan.md` (AC1)
- `node scripts/phase-lint.mjs scripts/fixtures/golden-fixture/toy-plan-nonatomic.md` (AC2)
- `node --test scripts/golden-fixture.test.mjs` (AC3, AC4, AC6, AC7)
- `wc -l docs/workflow/GOLDEN_FIXTURE.md` (AC5)
- `grep -n "Tool-calling smoke test" docs/workflow/GOLDEN_FIXTURE.md` (AC5)
- `grep -n "Fixed pass criteria" docs/workflow/GOLDEN_FIXTURE.md` (AC5)
- `grep -nE "Date\.now|Math\.random|fetch\(|https?://" scripts/golden-fixture.test.mjs` (AC8)
- `node scripts/phase-lint.mjs docs/features/55-executable-golden-fixture/SPEC.md` (phase-lint gate for every phase of this unit)
