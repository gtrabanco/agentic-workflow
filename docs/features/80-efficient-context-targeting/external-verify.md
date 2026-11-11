# External verify — 80-efficient-context-targeting + 269-external-verify-findings (issue #269)

2026-11-11 · **delta verdict** against the prior `EXTERNAL VERIFY` receipt of 2026-11-10
(`.agentic-workflow/journal/20261110T202600Z-feat-269-efficient-context-targeting-narrative-local.md`,
base `15c152a1` · head `e5933aef`, 1 blocker + 4 advisories): corrections landed since
(fix batch `10972b74` plus the feature implementation), so this run re-verifies the prior
blocker and the delta diff (`e5933aef..head`), then the spot check.
Bound: unit `docs/features/80-efficient-context-targeting/` (the branch's unit doc and its
planning ledgers) together with its parallel correction unit
`docs/fix/269-external-verify-findings/`, which rides the same branch and PR #506 and whose
doc names the same prior receipt — one delta run covers both. Base `origin/main` =
`1e50c8221541480d9a444d4b872260afb650c296` (merge-base == tip); head at receipt time
`91ba487633f48d0f291751c41e820567060cc3db`.
Prior-receipt re-verification: **B1 folded** — issue #269's prose now carries
`**Blocked-by (native, hard) — #434, after it**` (count 1), the retired
`Related (soft) — #434` (count 0, exit 1), and the primary section `^- #434 — native blocked-by`
(count 1); GraphQL `blockedBy(269)` → `[{number:434}]`, node `CLOSED` (#434 merged `413aa8c5`,
2026-11-11T10:35Z). Prior A1 folded (row-80 cell carries the blocker), A2 folded (primary
section lists #434), **A3's PR half regressed** (= this run's B1), A3's row/comment halves
hold (dated annotate pin 1 · correcting comment length 1), A4 stays evidenced `n/a`
(worktree-guard REPORT/PASS; `/tmp/differential-baseline-*` still present — 135 dirs at this
run, the concurrent sessions' scratch).
This run was read-only: no commit, push, branch, forge mutation or tracked-file edit;
`git status --porcelain` was empty after every step (the gates' generators wrote only
gitignored build outputs). The only write is this receipt (§4), left uncommitted for the
owner. Live-tree guard: the change's mutating path `agentic-workflow provision rg` was never
executed live — its behavior was verified only through its scratch-isolated suite (13 tests);
`scripts/relevant-files.mjs` live runs used only the read-set/print and git-diff modes.
Mid-run mutation disclosed: two byte-identical session fragments landed from a concurrent
session while this run was in flight (`30daeda5`, `91ba4876` — branch now ahead 2 of origin);
the carrier gates were re-run at the new head (`aggregate --check` ok · `log-immutability`
PASS · `docs-generate --check` PASS), and the tracked tree stayed clean throughout.

```text
EXTERNAL VERIFY — base: 1e50c8221541480d9a444d4b872260afb650c296 · head: 91ba487633f48d0f291751c41e820567060cc3db
Blockers: 2 —
  (B1) docs/fix/269-external-verify-findings/SPEC.md:250 (O5, status `verified`), plus AC-S5, Retirements:92-93 and task P5 — the PR half of the A3 corrections is gone from PR #506. Reproducer: `gh pr view 506 --json body --jq .body | rg -c 'deleted on owner order on 2026-11-10'` → exit 1 · 0 (receipt E8 recorded exit 0 · 1 and "corrections paragraph · exit 0 · 1"), and no comment carries it either (`gh api repos/gtrabanco/agentic-workflow/issues/506/comments … test("owner order|feat/69")` → 0). Base-vs-head: green at the correction head `97683332` (E8), red at head — the delta's own P7 close-out rewrote PR #506's title/body at `fdd83c94` ("PR #506 re-titled to the implementation PR closing #269"). Stability: fires on PR #506 alone, every other surface quiet, and the retired sentence stays retired (`left untouched, as ordered` → 0, the Retirements pin still green). Consequence: O5's stated outcome no longer reproduces and Retirements:92's "superseded by the dated sentence" now asserts a supersession that does not exist anywhere. Smallest action (/aw-local-apply): re-add the dated superseding sentence + corrections paragraph (the E8 fixture text) to PR #506's body, then one blockers-only recheck.
  (B2) docs/fix/269-external-verify-findings/SPEC.md:25 — the standing Issue-section claim "the PR keeps `Refs #269, #434`" is false. Reproducer: `gh pr view 506 --json body --jq .body | rg -n 'Refs'` → exit 1 · 0 while the body opens with `Closes #269.`; the same branch's feature doc asserts the opposite truth (`docs/features/80-efficient-context-targeting/SPEC.md` §Issue: "The PR closes it via `Closes #269` in the body"). Base-vs-head: true at the fix cut (D3 recorded the park-era body; log line 298), false after the delta's P7 rewrite; `rg 'Refs #269'` over the tree hits only this doc (lines 25 and 298) — stability: quiet everywhere else. Sibling-sweep class (F51/F53): the rewrite landed in one surface and this sibling kept the old truth. Smallest action (/aw-local-apply): correct the Issue-section sentence to the park-then-implementation reality (`Closes #269`) and mark D3 at line 298 superseded by the close — one batch with B1.
Advisories: 7 —
  (A1) docs/ROADMAP.md:109 (row 80 depends cell `434 (hard, open) · 65 (soft, merged)`) — the node is CLOSED (merged `413aa8c5`, 2026-11-11T10:35Z) while the cell reads `open`, and this branch's own settle re-emitted the row eight hours after the merge (`fdd83c94`). Why advisory: the staleness came from the external #434 merge, not from a change that rewrote the fact — O3's validator still re-runs green (string present), the forge relation is authoritative for hard blockers (prior receipt A1's own rationale; `scripts/batch-scheduler.mjs` reads the forge), row 80's description still states the blocker, and no gate consumes the state token. Base: origin/main's row 80 has no such cell (`— (soft: 65, merged)`). Smallest action if ordered: one `roadmap rowUpsert` flipping the token to `merged` plus the coupled fix-unit O3/AC-S3 string amendment, same batch.
  (A2) scripts/relevant-files.test.mjs:33 — `freshDir()` (added by `15adee6c`) is never called: `tempRoot` stays null, so the `test.after` cleanup never executes and the suite still leaks its per-case `mkdtemp` dirs. Why advisory: dead code, not a test-to-pass edit — every assertion untouched (10 pass / 0 fail here and per E2; root suite green twice), and the concurrent session's own fragment records the "temp-hygiene flake por mkdtemp sin rmSync" gotcha this helper was meant to fix — the fix is wired to nothing.
  (A3) docs/fix/269-external-verify-findings/SPEC.md AC-S8 + O7 required-evidence — `git diff e5933aef...HEAD -- docs/LOGS.md` → 342 lines, not the recorded "no output". Why advisory (stability): all 334 insertions come from origin/main's own aggregator commits (`57f1023e`, `9a8f5b15`) integrated by three owner-ordered main merges — `git log --no-merges origin/main..HEAD -- docs/LOGS.md` → 0 commits and `git diff origin/main HEAD -- docs/LOGS.md` → 0 lines, so "this change never touched the aggregator's file" still holds; the reproducer fires only on unrelated merged content. O7's validator cells themselves re-run green (row count 1 · `docs-generate --check` PASS). Smallest action: re-anchor the check to `origin/main`.
  (A4) live never-authority run: `bun scripts/relevant-files.mjs docs/features/80-efficient-context-targeting/SPEC.md --base origin/main` → exit 1 · 19 unlogged-changed, including `packages/agentic-workflow/src/provision/rg.mjs` (P5's implementation file, in no phase list and no Log citation), the unit's own planning ledgers and the changeset. Why advisory: no S#/obligation claims this unit's own diff is discipline-clean — O1–O6 bind the tool's mechanics (all green) and the exit-1 naming is AC-S3 item 4 working as specified; the unit ran under the owner's inline workflow (S1), not execute-phase's close step. Note for close: list-or-log the 19 if the discipline is to gate this unit too.
  (A5) docs/fix/269-external-verify-findings/SPEC.md:298 (D3) — dated Log decision "PR #506 keeps `Refs #269, #434`". Why advisory: `## Log` D-lines are dated history (the prior receipt set the precedent that dated history is not a standing claim); the standing half at line 25 is B2 — one batch corrects both.
  (A6) docs/features/80-efficient-context-targeting/SPEC.md E7 (O12's measured delta) — records 11 files / 386,111 bytes; re-run today → 11 files / 386,177 bytes (+66 B after the row-80 settle and merged-main growth). Why advisory: dated measurement receipt; the file count and the ~29.5× ratio claim reproduce.
  (A7) `.agentic-workflow/journal/20261111T200957Z-feat-269-efficient-context-targeting-narrative-01a1c70e-….md` + `20261111T201213Z-…-01a1c672-….md` (commits `30daeda5`, `91ba4876`) — two byte-identical session records landed during this run from a concurrent session (branch now ahead 2 of origin). Why advisory: the carrier accepts them (`journal aggregate --check` → ok · checked 28 · refusals []; `log-immutability` → PASS · 0 violations at head) and they carry no false standing claim ("19 commits empujados", "gates green" reproduce).
Sibling sweep: list — survivors, both fallout of the delta's PR-body rewrite: B2 (SPEC:25 `Refs #269, #434`) and B1's shadows (SPEC:92-93 "superseded by the dated sentence", O5/AC-S5). Checked clean: issue body (0 `Related (soft) — #434`; native wording 1; primary `^- #434` 1); PR body (0 `left untouched, as ordered`; no feat/69 / untouched / stale assertion anywhere — the old truth is gone and so is its positive correction, = B1); issue scope comment (dated history + dated "Branch note superseded" correction present); row 80's withdrawn `feat/69` clause (self-negating under the dated annotate, pin 1); the prior receipt fragment (immutable, untouched); feature SPEC L1's verbatim 2026-11-09 request quote and fix SPEC S2/PE-008/E1–E8 (quoted/dated finding history, not standing); roadmap fix-row:188 (describes B1 historically; "#269 stays OPEN" true today); templates' dash-marker alignment (phase-lint PASS ×2); skill budget JSON (check-skill-context PASS 29 · --routes PASS 14); crate README usage/Commands rows (cli.surface 3/0, package 659/0); docs/generated (docs-generate --check PASS · 0 stale); no other `Refs #269` in the tree.
Completeness: all S#s resolved — feature S1→P1/P7, S2→P7, S3→P2–P6 with validators re-run green here (P1 phase-lint PASS; P2 red reproduced in mktemp scratch at `1638189e` → 0 pass / 10 fail / exit 1, removed after; P3 relevant-files 10/0; P5 provision+surface 13/0 + 3/0; P6 root suite exit 0; P7 settle PASS + verify ok); fix S1→P1, S2/S4→P3/P5, S3→P4/P5, S5→P4/P5, S6/S7→P1, S8→P1/P5 (P1 8 O-rows · P2 4 E-lines · P3/P4 forge+roadmap greps green · P5's local-gate PASS 17 steps — its PR conjunct red = B1). open ids: none. Obligations: feature O1–O13 all re-run green; fix O1–O4, O6 (n/a pin), O7 validator, O8 green — O5 open (B1), O7's LOGS evidence drift (A3). P4's RED (`3afbd4ce`) rests on the recorded E5 plus the green `red-first` gate, not on a fresh scratch reproduction this run.
Spot check: node scripts/run-root-suite.mjs → match (exit 0 · header `root gate: 104 suite(s) · 4 worker(s)` · 104 PASS / 0 FAIL including red-first, golden-fixture, roadmap-settle, relevant-files, structural-sibling-pins — equal to reported G1 "exit 0 · 104 suites, 4 workers"; a second identical run earlier in this session agreed).
Verdict: NEEDS-DECISION (2 open blockers: B1, B2)
```

## Command observations (this run)

| command | observed |
|---|---|
| `gh issue view 269 --json body \| rg -c '\*\*Blocked-by \(native, hard\) — #434, after it\*\*'` | exit 0 · 1 |
| `gh issue view 269 --json body \| rg -c 'Related \(soft\) — #434'` | exit 1 · 0 (prior B1 folded) |
| `gh issue view 269 --json body \| rg -c '^- #434 — native blocked-by'` | exit 0 · 1 |
| `gh api graphql … blockedBy(269)` | `[{number:434, state:CLOSED}]`, issue OPEN |
| `gh pr view 506 --json body \| rg -c 'deleted on owner order on 2026-11-10'` | exit 1 · 0 (E8: exit 0 · 1) — **B1** |
| `gh pr view 506 --json body \| rg -n 'Refs'` | exit 1 · 0 — **B2** |
| `gh issue view 269 --json comments … contains("Branch note superseded")` | 1 |
| `rg -c '434 \(hard, open\) · 65 \(soft, merged\)' docs/ROADMAP.md` / note / fix row / `blocked-by #434` | 1 / 1 / 1 / 1 |
| `git diff e5933aef...HEAD -- docs/LOGS.md` · vs `origin/main` · branch-only commits | 342 lines · 0 lines · 0 commits (A3) |
| `bun test scripts/relevant-files.test.mjs` | exit 0 · 10 pass / 0 fail |
| `bun test scripts/phase-lint.test.mjs` | exit 0 · 162 pass / 0 fail |
| `cd packages/agentic-workflow && bun test test/cli.surface.test.mjs` | exit 0 · 3 pass / 0 fail |
| `cd packages/agentic-workflow && bun test test/provision.cli.test.mjs` | exit 0 · 13 pass / 0 fail |
| `bun run test` (packages/agentic-workflow) | exit 0 · 659 pass / 0 fail (= PR claim) |
| `bun run test` (packages/pi-agentic-workflow) | exit 0 · 805 pass / 0 fail (= PR claim) |
| `node scripts/run-root-suite.mjs` (×2) | exit 0 · `104 suite(s) · 4 worker(s)` · 104 PASS / 0 FAIL (spot check) |
| `bun scripts/skill-lint.mjs` | exit 0 · 99 files · 0 findings · PASS |
| `bun scripts/version-parity-gate.mjs --content --base 41e72230` | exit 0 · VERDICT PASS |
| `bun scripts/docs-generate.mjs --check` (×3, incl. post-mid-run) | exit 0 · 3 checked · 0 stale · PASS |
| `bun scripts/roadmap-settle.mjs` | exit 0 · 185 unit docs · 0 violations · PASS |
| `bun scripts/check-skill-context.mjs` (+ `--routes`) | exit 0 · PASS 29 skills · PASS 14 routes |
| `agentic-workflow verify <feature SPEC>` / `<fix SPEC>` | exit 0 · `ok: true`, violations [] both |
| `bun scripts/phase-lint.mjs` feature / fix SPEC | exit 0 · PASS (fingerprints `5f207a87…` / `462a3188…` = recorded) |
| `agentic-workflow roadmap check docs/fix/269-external-verify-findings/SPEC.md` | exit 0 · PASS · 0 violations |
| `agentic-workflow journal aggregate --check --json` | exit 0 · ok · checked 28 · refusals [] |
| `bun scripts/log-immutability.mjs` + `bun test scripts/log-immutability.test.mjs` | PASS 0 violations (range 2 commits) · 19 pass / 0 fail |
| `bun scripts/local-gate.mjs` | exit 0 · `local-gate: PASS — 17 step(s) in 175s` |
| `bun scripts/relevant-files.mjs <SPEC> --phase all \| sort -u \| xargs du -cb` | 11 files · 386,177 bytes (E7: 386,111) |
| `bun scripts/relevant-files.mjs <SPEC> --base origin/main` | exit 1 · 19 unlogged-changed named (A4) |
| scratch red at `1638189e` (`git archive` → mktemp, removed) | exit 1 · 0 pass / 10 fail = E1 |

Not re-run individually: `test-impact` (its receipt is HEAD-pinned at `97683332`; the full
suites were run twice instead) and `pi-node-compat` outside the local-gate graph.
Disclosed side effects: the local-gate run executed its declared `/tmp` tmp-gc sweep
(`/tmp/differential-baseline-*` recreated by concurrent sessions — 135 present after);
gate generators wrote gitignored build outputs only; the tracked tree was clean at every
checkpoint.

---

**Correction status (2026-11-11, same day):** B1 and B2 folded by this branch's
second correction batch of `docs/fix/269-external-verify-findings/`
(commit `aadce3a4`); advisories A1–A5 folded in the same batch (A5 as B2's
in-place annotation), A6/A7 triaged not-fixed with reasons (unit Log D9). The
batch's evidence (E12–E16, G8–G10) lives in that unit doc; the batch session
record is
`.agentic-workflow/journal/20261111T205204Z-feat-269-efficient-context-targeting-narrative-local.md`.
The next verify runs as a delta against the block above.
