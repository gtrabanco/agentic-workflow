# 644 — external verify

## 2026-11-19 — full verdict (no prior receipt for this unit)

EXTERNAL VERIFY — base: c1ccc1985 · head: 5e8b010ad
Blockers: 2 —
  1. `packages/agentic-workflow/src/elicitation/prespec.mjs:286` — reproducer: `checkSpec()` over a pre-spec whose `open-questions@1` row routes `init-workspace:architecture` → finding `questions-route-unknown` ("which is not one of design/unit-lane/init-workspace"), while the same row is granted by `needs-input` at head (exit 0, `Route back: init-workspace:architecture`); mirror direction: a bare `init-workspace` row passes prespec at head but the dispatcher fails it closed (`unknown-route`, exit 1). Base-vs-head: at c1ccc1985 prespec's `ROUTES = ["design","unit-lane"]` matched the published grammar exactly (no third route was legal anywhere); at head the grammar (`TURN_CONTRACT.md:156`, `template/AGENTS.md:297`) publishes `init-workspace:<class>` and `ROUTES` grew to include bare `init-workspace`, so the linter and the dispatcher now disagree in both directions — a change-caused divergence through the shared const (feature 526's declared no-drift seam). Smallest action: validate the cell with the reader's exported `parseRoute` instead of `ROUTES.includes`, plus one corpus case — /aw-local-apply.
  2. `docs/workflow/LANE_FLOW.md:117-118` (also `:133`, `:271`) — reproducer: `rg -n 'unit-lane` for plan-owned facts\)' docs/workflow/LANE_FLOW.md` still enumerates only the two old route values, and lines 133/271 publish the pre-change usage `runner needs-input <unit-dir> [--json]`. Base-vs-head: byte-identical at both — true at base, stale at head: the change rewrote this same sentence in `skills/unit-lane/SKILL.md:79`, `TURN_CONTRACT.md:160` and `template/AGENTS.md:305`, and the unit's Impact claims the surfaces that state the route vocabulary are edited. Smallest action: extend the parenthetical with `init-workspace:<class>` and add `[--workspace <dir>]` to the two usage lines — /aw-local-apply.
Advisories: 5 —
  1. `docs/fix/258-harden-needs-input-contracts/review-findings.md:937,946,765` + `scripts/fixtures/ceremony-findings-ledger/review-findings.md:937,946` — historical append-only finding rows asserting `ROUTES = design | unit-lane`; frozen evidence of that unit's era (fold receipts) and fixture bytes that must not move; F47 is dispositioned in this unit's Known pre-existing issues.
  2. `docs/features/78-unit-cycle/SPEC.md:187` — frozen R9 row recording `route=design|unit-lane` (historical read record of another unit).
  3. `docs/fix/258-harden-needs-input-contracts/SPEC.md:52` — historical fix-spec prose enumerating the two old routes.
  4. `packages/agentic-workflow/README.md` (`substrate-coverage@1` block, `# produced-by:` line) — missing closing backtick (cosmetic prose).
  5. `docs/features/644-substrate-gap-alarm/SPEC.md:78` — Impact quotes "the lane can only halt and ask" as a sentence that stops being true; that phrasing exists only in issue #644's body, never in the tree at base (doc accuracy, no behavior).
Sibling sweep: `LANE_FLOW.md:117-118/133/271` (blocker 1); the surviving mentions at advisories 1–3 are historical/frozen records; no other live surface asserts the two-value route vocabulary or the old usage line.
Completeness: S1 (via obligation O12), S2 (P1), S3 (P4/P5), S4 (P3/P5), S5 (P6), S6 (P2 — red-first re-observed at 4d603113a: substrate 15 fail/1 pass, needs-input 6 fail, cli.surface 1 fail, all exit 1; green at head) — all resolved, every declared validator re-ran green here; obligations O1–O13 all `verified` and re-ran green | open ids: none
Spot check: `bun scripts/local-gate.mjs` → match (reported G6: PASS — 19 steps in 614s at 39c5a463b; observed at 5e8b010ad: PASS — 19 steps in 503s)
Verdict: NEEDS-DECISION (2 open blockers)

---

**Addendum (implementer, 2026-11-19) — not part of the verdict above.** Both
blockers were corrected on this branch after the receipt: blocker 1 at
`01d3692f0` (red corpus `fae6cf8e9`), blocker 2 at `cf0be4a0d`; the limited
recheck's evidence is the unit doc's `E16`–`E18` and obligation rows `O14`/`O15`
(`verified`). Next run: a delta verdict over `a6d960b6e..HEAD`.
