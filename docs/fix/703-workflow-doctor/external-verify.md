# 703 — workflow-doctor · external verify receipt

Read-only verification of PR #715 (`feat/703-agentic-workflow-doctor`), run
2026-11-24 against `origin/main`. Append-only carrier: the next run is a delta
verdict against this receipt.

```text
EXTERNAL VERIFY — base: fa471cc06 · head: 0ee195ba2
Blockers: 4 —
  B1 docs/fix/703-workflow-doctor/planning-obligations.md:13 (O1) — the `verified` row's stated validator outcome does not reproduce: reproducer `rg -c "review-change" docs/fix/703-workflow-doctor/` → exit 0 with `SPEC.md:3` occurrences at SPEC.md:189 and SPEC.md:193 (the risk-tier receipt and its explanation), plus `planning-obligations.md:13` (the cell's own pattern), while the cell claims "only the occurrences quoted in `## Log` L2" (L2's quote is SPEC.md:329 alone); base side: at fa471cc06 the directory does not exist (rg exit 1, zero occurrences — the predicate holds vacuously), and at the unit's freeze c292b049a the then-worded SPEC-scoped validator held with exactly the L2 quote; the cell was rewritten to directory scope and flipped `verified` in f400d2197, the same commit that added the two extra lines. The underlying intent (no review machinery ran) is separately evidenced: empty `## Findings`, no `R` log lines, 14 conventional commits. Smallest action: reword O1's validator cell to a predicate that holds (e.g. the SPEC-scoped `rg -n` form enumerating the three expected lines) and re-run it.
  B2 skills/agentic-workflow-doctor/SKILL.md:215-216 — the `Done when` identity `report + discard + unclassified = the mine receipt's rows` is false for any rubric-faithful run: reproducer — bundle over this tree's mine receipt (549 rows) with the skill's own example triage (1 report `gate-red`, 1 discard `rework`) → report occurrences 55 + discard occurrences 191 + unclassified 494 = 740 ≠ 549 (header reading 1 + 1 + 494 = 496 ≠ 549); only `report occurrences + unclassified = rows` holds (55 + 494 = 549), because `buildBundle` subtracts report-class occurrences only and leaves discard-kind rows inside `unclassified`; base side: the skill does not exist at fa471cc06. Smallest action: drop `+ discard` from the identity (text only).
  B3 skills/agentic-workflow-doctor/SKILL.md:69-71 — the instruction asserts a machine refusal that does not exist ("a bundle that cites a number the user did not give is refused by the routing stage"): reproducer — bundle whose `defect` cites `issue 424242` (a number no user gave) → `workflow-doctor route --bundle …` exit 0, `gate-red · new-issue`, empty stderr, with and without `--candidate`; `buildRoute` validates only the `classes` array and parses no number from the bundle, and step 5 prescribes no such check either; base side: the skill does not exist at fa471cc06. Smallest action: rewrite the sentence to the real rule (the operator must not invent numbers; `route` performs no such validation).
  B4 docs/fix/703-workflow-doctor/SPEC.md:103 (AC2) — the AC's declared check `bun scripts/cli-coverage.test.mjs` does not "exit 0": reproducer → exit 1, `error: Cannot use test outside of the test runner` (bun-direct on a `node:test` file; the same SPEC spells the check correctly at lines 225, 361, 447, where `bun test scripts/cli-coverage.test.mjs` exits 0 with 8 pass / 0 fail, and direct `node` also exits 0); base side: AC2's text is new in this range. Smallest action: insert `test` in AC2's check command.
Advisories: 5 —
  A1 README.md:132-133 — the inserted `agentic-workflow-doctor` row splits the `audit-docs` row's terminator: the doctor row carries a 4th empty cell against the table's 3-column header (README.md:126) and the `audit-docs` row lost its closing pipe; change-caused but cosmetic — no gate or consumer parses this table's row shape, and renderers that drop excess cells show no visual change; text-only fix (move the stray `| … |` off the doctor row, restore audit-docs' closer).
  A2 docs/fix/703-workflow-doctor/SPEC.md:62 (S5) — of S5's battery bullets, the receipts family carries a recorded disposition (known-issues K1 / `## Non-goals` / `## Future`) and the unit slug ships, but "PR + issue numbers the user names" and "the failing runner commands and stderr tails" have neither a battery cell nor a disposition line; S5 itself closes via P5's green validator and AC4 (the unit's acceptance source), so this is a disposition-record gap, not an acceptance miss; smallest action: one dated disposition line (or the cells).
  A3 docs/fix/703-workflow-doctor/SPEC.md:281 (P6 `Relevant files`) — names `route.mjs` and `publish.mjs`; both live in `packages/agentic-workflow/src/workflow-doctor/upstream.mjs`. Doc-only mismatch; P6's validator re-runs green.
  A4 docs/fix/703-workflow-doctor/SPEC.md:356 (E1) and :366 (E9) — dated receipts vs fresh runs: journal fragments 38 → 39 (a later fragment), red-first `72 pair(s) · 47 after the cutoff` → `73 · 48` (the later test commit 6db674a7f added a pair); every verdict reproduces exactly (mine 549 rows / 243 units with identical group tallies `gate-red 55 · evidence-red 241 · review-fail 4 · fold-over-budget 26 · review-cycles-over-budget 2 · correction 3 · refuted-finding 27 · rework 191`, LOGS 1,279 entries, 277 units / 166 with a Log; red-first `0 finding(s) · verdict PASS`). Dated historical receipts; refresh or leave as history.
  A5 environment (no change file) — `node scripts/setup-env.mjs --check` → `VERDICT: FAIL` on `serena-cache` missing (fresh worktree local state) and `AGENTIC_WORKFLOW_RUNNER` unset; environmental, reproduces on any fresh worktree at base as at head, and every declared gate runs green regardless.
Sibling sweep: clean — every claim the change rewrote is coherent at head: skill counts 14→16 / 31→33 / 30→32 across README.md, docs/workflow/SKILLS.md, REPLICATE.md, PORTABLE_PROMPT.md (re-derived by `normative-drift` 24/0 and the budget pins), the `normative-surfaces@1` claim list and the new `workflow-doctor` gate row (AGENTS.md, GATE_INVENTORY), the telemetry comment and fixture 14→16, the bin/README usage line and `RUNNER.md` row (cli.surface 30/0). Surviving old-count mentions exist only in CHANGELOG.md versioned history and closed units' dated records (the #668 frozen-history boundary), never on a live surface; B2/B3's claims each live on exactly one surface (rg: no sibling asserts them).
Completeness: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S14a, S14b resolved (every S# carries a task with `(Implements: …)` whose validator re-ran green here: P1 `scaffold-contract authoring` → SCAFFOLD OK / ACCEPTANCE MATCH; P2–P7 suites; P8 `local-gate`) | open ids: none
Spot check: bun test scripts/workflow-doctor.test.mjs → match (exit 0 · 19 pass / 0 fail, equal to reported E4)
Verdict: NEEDS-DECISION (B1, B2, B3, B4)
```

## Verification run inventory (command: observed result)

All runs at head `0ee195ba2`, 2026-11-24, read-only against the live tree
(`git status --porcelain` empty before and after; every workflow-doctor receipt
written under `mktemp -d`, removed at the end; `publish` never run with `--yes`
against a forge).

| command | observed |
|---|---|
| `bun packages/agentic-workflow/bin/agentic-workflow.mjs help workflow-doctor` | exit 0, five ops listed (AC1) |
| `bun scripts/workflow-doctor.mjs mine --root . --json` | exit 0, 549 rows, `workflow-doctor-mine@1`, 243 units (AC3; E1 group tallies exact) |
| `bun scripts/workflow-doctor.mjs battery --root . --json` | exit 0, `doctor.contract = doctor@1`, runner 4.10.1 = pin match, 33 skills / 16 invocable (AC4) |
| `bun scripts/workflow-doctor.mjs battery --unit 703-workflow-doctor --json` | exit 0, `tier: high`, no degradations (S14b/O12) |
| battery `doctor` vs `agentic-workflow doctor --json` | deep-equal, both `doctor@1` (S11/O10) |
| `bun scripts/workflow-doctor.mjs publish --issue 1 --bundle /dev/null` (no `--yes`) | exit 2 `consent-required`, 0 stdout bytes (AC8/O15) |
| `bun scripts/workflow-doctor.mjs publish --forge gitlab --yes --bundle <file>` | exit 2 `unsupported-upstream-forge`, 0 stdout bytes (O16) |
| `bun scripts/workflow-doctor.mjs mine --root <empty dir>` | exit 1 `insufficient-input`, carriers named (E12/O4) |
| `agentic-workflow workflow-doctor bogus` | exit 2, op list + candidates (E12/O18) |
| `mine --bogus` / `--root` w/o value / `--fold-budget abc` / `bundle --triage /nope` | exit 2 `unknown-flag` / `missing-flag-value` / `malformed-flag` / `missing-triage` |
| route over mine+triage chain, no candidates; `--candidate 698 --candidate 170` | exit 0 both; `gate-red · new-issue`, consent line (E11/O13; gh reads only) |
| rubric probes: unknown verdict / cross-column reason / discard-with-rows / unknown row id | exit 2 `unknown-verdict` / `reason-verdict-mismatch` / `discard-with-evidence` / `unknown-row` (O5/O6) |
| redaction probes: e-mail + repo path + absolute path + SHA; secret-shaped defect | exit 0 with 3 redactions and SHA kept verbatim; exit 2 `secret-shaped-value`, 0 stdout bytes (O7/O8) |
| bundle twice, same inputs | byte-identical (O9) |
| `bun test scripts/workflow-doctor.test.mjs` | exit 0 · 19 pass / 0 fail (E4; the spot check) |
| `bun test …/cli.surface.test.mjs …/cli.help.test.mjs` | exit 0 · 30 pass / 0 (E5/O18) |
| `bun test scripts/normative-drift.test.mjs` / `prose-gate-inventory` / `cli-coverage` / `structural-sibling-pins` | exit 0 · 24/0, 22/0, 8/0, 8/0 (E6/O19) |
| `bun test scripts/journal-corpus.test.mjs` / `phase-lint.test.mjs` / `skill-lint.test.mjs` | exit 0 · 23/0, 162/0, 20/0 (regression scope, O21) |
| `bun run --cwd packages/pi-agentic-workflow test` | exit 0 · 1075 pass / 0 (E7/O21/AC9) |
| `bun run --cwd packages/agentic-workflow-schema test` | exit 0 · 953 pass / 0 (schema touched) |
| `bun scripts/skill-lint.mjs` (full) and `--skill agentic-workflow-doctor --skill aw-doctor` | PASS 0 findings, 118 files / 3 files (E8) |
| `bun scripts/check-skill-context.mjs` / `--documents` | PASS 33 skills / PASS 7 documents (E8/O20) |
| `bun scripts/red-first.mjs` | PASS · 73 pairs · 0 findings (E9 verdict reproduces) |
| `bun scripts/docs-generate.mjs --check` / `bun scripts/lint-changeset.mjs` | PASS 3 checked 0 stale / exit 0 `ok workflow-doctor.md` (E10/O22) |
| `bun run --cwd packages/pi-agentic-workflow bundle:skills` | exit 0 · 32 skills bundled; tree clean (AC10) |
| `rg -n 'bun scripts/' skills/agentic-workflow-doctor` | exit 1, no match (AC2 second half) |
| `agentic-workflow scaffold-contract authoring docs/fix/703-workflow-doctor` | `ACCEPTANCE MATCH`, `SCAFFOLD OK` (P1; `ac-hash` re-derives) |
| `agentic-workflow phase-lint docs/fix/703-workflow-doctor/SPEC.md` | PASS, P1–P8 all 6/6, exit 0 |
| `agentic-workflow dimension-regression --base fa471cc06` | exit 0 · `clean` · 20 vs 20 dimensions · evidence named (E14) |
| `bun scripts/local-gate.mjs` | exit 0 · `local-gate: PASS — 20 step(s) in 677s` (AC11/O23/G1) |
| `gh issue view 703` quote check | S2–S14b verbatim in the issue body; S1 = the operator's order (`## Log` L1) |
| `gh pr view 715` | OPEN, MERGEABLE, base `main`, head `feat/703-agentic-workflow-doctor` |

Open blockers route to `/aw-local-apply` under its correction bounds: one
batch (B1 cell reword, B2 identity fix, B3 sentence fix, B4 `test` insertion —
plus the five advisories if confirmed), one blockers-only recheck, a second only
if the same blocker persists.

## 2026-11-24 — correction batch addendum (§9)

One batch on this receipt's 4 blockers + 5 advisories, under the owner's
"triage and fix those that deserve to fix" order.

- **Folded — commit `dbf8b8843`:** B1 (O1's validator now reads
  `log-kind@1`'s own run record — 15 commits conventional, 0 `R` lines,
  `## Findings` empty — status flipped back and re-verified in E16), B2
  (Done-when states `report occurrences + unclassified = rows` with the
  discard note), B3 (step 0.3 states the real rule: no command validates
  the numbers), B4 (AC2 declares `bun test scripts/cli-coverage.test.mjs`,
  `ac-hash` re-derived), A1 (README rows repaired), A2 (dated S5
  disposition in Non-goals), A3 (P6 names `upstream.mjs`).
- **Not folded, with reason:** A4 — the E1/E9 dated receipts stay as
  history (the #668 "dated records are not rewritten" boundary; their
  verdicts still reproduce exactly); A5 — environment only (`setup-env`
  misses are worktree-local, present at base as at head).
- **Loop (S2):** one iteration — `check-skill-context` red at first re-run
  (2817 > 2800 flat default) after the two corrected SKILL lines; repaired
  by the recorded per-skill ceiling 3099 / 264 = ceil(measured × 1.10),
  growth source declared in `SKILL_CONTEXT_BUDGETS.json` `mainSources`.
- **Blockers-limited recheck (§9):** frozen corpus RED 0/7 (E15) → GREEN
  7/7 (E16); touched obligation O1 re-verified on foreground runs (E16),
  ledger 23/23 `verified`; targeted set green (E16); full gate
  `local-gate: PASS — 20 step(s) in 446s` at `dbf8b8843` (G2).
- **Open blockers after the batch: 0.** Awaiting the owner's recheck
  verdict — this receipt does not self-approve.
