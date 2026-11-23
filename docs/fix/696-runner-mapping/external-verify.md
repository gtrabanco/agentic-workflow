# External verify — fix/696-runner-mapping

Full verdict, once (2026-11-23): no prior `EXTERNAL VERIFY` block existed in
this unit dir and none is recorded for #696 in `docs/LOGS.md`, so this run
verifies the whole change, not a delta. Read-only run: no commit, no push, no
branch, no forge mutation, no repo-file edit — the only writes were this
receipt and gitignored build output (the package's own `bun run bundle:skills`
staging `packages/pi-agentic-workflow/skills/`, and the schema package's
`dist/` rebuilt by `tsc`, both declared lifecycle output). The change-modified
writer `bundle-skills.mjs` was first exercised in `mktemp -d` scratch with the
canonical `skills/` tree hash-identical before and after
(`bundled 29 skills (105 files) · projected: 22 files · excluded: skill-lint`,
injection present after frontmatter in a citing skill, absent in a non-citing
one).

## Declared commands — command: observed result

| command | observed |
|---|---|
| `bun test packages/pi-agentic-workflow/test/runner-mapping-injection.test.mjs` | exit 0 · 7 pass / 0 fail (M1–M7, names verbatim) |
| `bun test packages/pi-agentic-workflow/test/runner-citation.test.mjs` | exit 0 · 4 pass / 0 fail (C1–C4) |
| `bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs` | exit 0 · 8 pass / 0 fail |
| `bun test packages/pi-agentic-workflow/test/runner-prose.test.mjs` + `projection.test.mjs` | exit 0 · 4 + 19 pass |
| `bun test packages/pi-agentic-workflow/test/tool-choice-guard.test.mjs` | exit 0 · 14 pass / 0 fail (F30, F31) |
| `bun test packages/pi-agentic-workflow/test/workflow-tools-wiring.test.mjs` | exit 0 · 7 pass / 0 fail |
| `bun test packages/agentic-workflow/test/tool-choice.policy.test.mjs` | exit 0 · 24 pass / 0 fail (F22 present) |
| `bun test scripts/normative-drift.test.mjs` | exit 0 · 24 pass (runner-mapping row resolved) |
| `bun test scripts/tool-choice-parity.test.mjs` / `invocation-drift.test.mjs` | exit 0 · 4 pass / 13 pass |
| `bun scripts/invocation-drift.mjs` | exit 0 · `verdict: PASS` |
| `bun scripts/check-skill-context.mjs --documents` | exit 0 · `PASS context documents: 7` · AGENTS.md 681 / 222 / 459 / 14,421 |
| `bun scripts/check-skill-context.mjs` | exit 0 · `PASS context budgets: 30 skills` |
| `bun packages/agentic-workflow/bin/agentic-workflow.mjs docs-generate --check` | exit 0 · `3 checked · 0 missing · 0 stale · 0 orphaned` · `verdict: PASS` |
| `bun scripts/test-impact.mjs --base fe4003e96` | exit 0 · `verdict: targeted` · 13 paths / 15 symbols (E7 verbatim) |
| `bun scripts/test-impact.mjs --base origin/main` | exit 0 · `verdict: targeted` (P6's validator) |
| `bun scripts/local-gate.mjs --jobs 4 --no-bail` | **exit 1** · 20 steps, sole red `root-suite → scripts/roadmap-settle.test.mjs` (`violations: 1`), 5 dependants skipped — B1 |
| `node scripts/run-root-suite.mjs` (full, no bail) | exit 1 · 139 pass / 1 fail — only `roadmap-settle` (A1) |
| skipped dependants by hand | `crate-suite-bun` exit 0 · `crate-suite-node` exit 0 · `schema-node-compat` exit 0 · `pi-node-compat` exit 0 · `pi-compat-guard` exit 0 (`--only pi-compat-guard`) |
| `bun run test` in `packages/pi-agentic-workflow` | exit 0 · 1070 pass / 0 fail / 93 files (E12 verbatim) |
| `git diff --name-only $(merge-base)..HEAD -- skills` | exactly `skills/runner-contract/references/RUNNER.md` (AC4 ✓) |
| `… -- packages/agentic-workflow/src/runner` | 0 lines (AC4 ✓) |
| `git log --format=%s $(merge-base)..HEAD` | docs/fix/test subjects only, no review/fold/audit commit (O11 ✓); red commit `273c5a306` stat = 5 test files only (O13 ✓) |

## Verifier-derived probes (not the writer's tests)

- **S2 byte-equality, own extraction:** sha256 of the block extracted from
  `RUNNER.md` == the block extracted from the staged
  `batch-scheduler/SKILL.md` (`4416dc6554cbd3e6…`), offset after the closing
  `---`, ceiling 120 ≤ 132.
- **S3 wording:** block names `agentic_workflow_run`, `tool_search`, the
  outside-pi pointer; names no launcher, no codemode search global.
- **S7 classifier, 9 inputs** (`runner workflow-status`, `cd x && runner y`,
  `FOO=1 runner lint` → refused; `./runner x`, `/usr/local/bin/runner x`,
  `echo runner later`, `rg runner skills`, `git status` → untouched): 9/9
  as-worded; refusal names the subcommand, the tool, the path escape.
- **S8 two-sided + differential:** head with `exists: () => false` →
  unrewritable, pathless reason naming `agentic_workflow_run`; with `true` →
  `bun scripts/batch-scheduler.mjs` rewrite stands; **no probe vs base
  `fe4003e96` over a 12-command corpus → 0 differences**; sanctioned
  `node --test …` untouched by the probe; shipped handler same three ways.
- **S6/O9:** `bun packages/agentic-workflow/bin/agentic-workflow.mjs
  batch-scheduler --root <mktemp>` → exit 0, `schema: batch-plan@4`.
- **S9/E10 re-read:** pinned `pi-coding-agent@1.6.0`
  `dist/extensions/tool-search/tool.js` publishes
  `TOOL_SEARCH_TOOL_NAME = "tool_search"` and `isSearchable` accepts
  `codemode`/`deferred`; `workflow-tools.ts` registers `exposure: "deferred"`
  under the `agentic-workflow` namespace.
- **Base attribution for A1:** `docs/ROADMAP.md` rows 127 and 130 both claim
  `98` at merge-base `fe4003e96` — the gate red's cause is byte-present at
  base.

## Blockers (4)

**B1 — `docs/fix/696-runner-mapping/planning-obligations.md:24` (O14) and
`docs/fix/696-runner-mapping/SPEC.md:320` (P6's validator).**
Claim: `bun scripts/local-gate.mjs --jobs 4` exits 0 with every step's
verdict. Reproducer: `bun scripts/local-gate.mjs --jobs 4 --no-bail` →
**exit 1**, `local-gate: FAILED root-suite` (full root suite: 139 pass /
1 fail — `roadmap-settle`). Base-vs-head: the red's cause (the duplicate #98
rows) is byte-present at `fe4003e96`, so the underlying defect is advisory
(A1) — but the `verified` cell and P6 state an outcome that never reproduced
at head, and contradicts the unit's own G1 line (`SPEC.md:368`, which records
the FAILED run). Smallest action: restate O14's validator cell and P6's
validator span to the outcome that reproduces (gate runs with every step's
verdict, root-suite red named as the base-present feature-98 violation, five
dependants run by hand green) and re-run the cell → `/aw-local-apply`.

**B2 — `docs/fix/696-runner-mapping/SPEC.md:103` (AC1).**
The frozen check `git diff --name-only $(git merge-base origin/main HEAD)..HEAD`
lists only paths `## Impact` names — observed 10 unnamed paths: the
`.agentic-workflow/journal/20261122*.md` deletions (commit `bdcb80bb9`).
Base-vs-head: all 10 files exist at `fe4003e96`, deleted at head —
change-caused by this branch's own commit; every other path in the diff is
named by `## Impact`; the unnamed set is exactly the aggregation commit
(stability: quiet on anything else). Smallest action: one `## Impact` bullet
naming the journal-fragment aggregation into `docs/LOGS.md` → `/aw-local-apply`.

**B3 — `docs/fix/696-runner-mapping/SPEC.md:107` (AC5).**
The quoted witness `every bundled file equals its declared projection —
byte-identical when no rule names it` never appears:
`bun test packages/pi-agentic-workflow/test/skill-parity.test.mjs` exits 0
but prints `…byte-identical when nothing applies to it`. Base-vs-head: the
quoted string is the case name at `fe4003e96`; this branch renamed it
(`273c5a306`), so the frozen AC names a string no commit on the branch
prints. Smallest action: re-spell AC5's quote to the landed case name and
refresh `ac-hash` → `/aw-local-apply`.

**B4 — `docs/fix/696-runner-mapping/SPEC.md:109` (AC7).**
The quoted witness `non-runner commands are untouched` never appears:
`bun test packages/pi-agentic-workflow/test/runner-citation.test.mjs` exits 0
printing `C3 — non-runner and path-qualified commands are untouched`
(name as landed at `273c5a306`; the AC was frozen at `fa6f3e070` with the
shorter quote — neither phrase occurs anywhere in the suite). Smallest
action: re-spell AC7's quote to the landed case name and refresh `ac-hash`
→ `/aw-local-apply`.

## Advisories (3)

- **A1 — `scripts/roadmap-settle.test.mjs:80` / `docs/ROADMAP.md:127,130`:**
  the sole root-suite/gate red — the duplicate #98 rows are byte-present at
  base `fe4003e96`, disclosed in the unit's Known pre-existing issues;
  base-present defect, never change-caused.
- **A2 — `docs/fix/410-projection-pipeline/SPEC.md:103`,
  `.changeset/410-projection-pipeline.md:15`, `docs/LOGS.md:5378`:** still
  assert "the manifest ships EMPTY" — false at base and head alike
  (`projection-manifest.json` carries `runner-invocation-not-shipped` at both
  ends; this change removed the same claim from `bundle-skills.mjs`'s
  header). Frozen #410 carriers, pre-existing.
- **A3 — `skills/runner-contract/references/RUNNER.md:114-140`
  (contract-text qualifier check):** the rewritten `## In a pi session` prose
  drops the old sentence's detail "runs any subcommand with its arguments in
  the session's project, returning stdout, stderr and the exit code"; no
  qualifier on the mapping itself is lost (typed-twin, deferral,
  discovery, outside-pi all survive in the block) and the dropped detail
  survives in `packages/pi-agentic-workflow/README.md` (tool table +
  #678 section) → prose, advisory.

## Completeness and obligations

- Tasks P1–P7 each carry `(Implements: S#)` and a validator that re-runs
  green here (P6's gate half is B1); S1–S9 all resolve to at least one such
  task; no `postponed/wontfix/decision-required` rows needed.
- `planning-obligations.md`: 15/15 rows `verified`; every stated outcome
  re-runs green here **except O14** (B1). No `planned`/`in-progress`/blank
  rows.

## Spot check

`bun scripts/check-skill-context.mjs --documents` → **match** — reproduced
E11 verbatim: `PASS context documents: 7`, `AGENTS.md 681 222 459 14421`.

```text
EXTERNAL VERIFY — base: fe4003e96a7c2c1b544b5c5ed47165c59db9eea1 · head: 8ce62fa965f9bbcac8ce2746561ed9d9cfe4b69e
Blockers: 4 — B1 planning-obligations.md:24 + SPEC.md:320 (O14/P6 claim local-gate exits 0; observed exit 1, cause base-present = A1); B2 SPEC.md:103 (AC1: 10 .agentic-workflow/journal/* deletions unnamed in ## Impact, caused by bdcb80bb9, exist at base); B3 SPEC.md:107 (AC5 quote "byte-identical when no rule names it" absent — renamed at 273c5a306, base carried the quoted name); B4 SPEC.md:109 (AC7 quote "non-runner commands are untouched" absent — landed name differs since 273c5a306, AC frozen at fa6f3e070)
Advisories: 3 — A1 scripts/roadmap-settle.test.mjs:80 (duplicate #98 rows byte-present at base, disclosed); A2 docs/fix/410-projection-pipeline/SPEC.md:103 + .changeset/410-projection-pipeline.md:15 + docs/LOGS.md:5378 ("manifest ships EMPTY" false at base and head alike); A3 skills/runner-contract/references/RUNNER.md:114-140 (dropped prose detail "in the session's project / returning stdout, stderr and the exit code" survives in the package README, mapping intact)
Sibling sweep: list — the three A2 "manifest ships EMPTY" survivors; otherwise clean (journal index carries no dangling fragment, no stale pass-through claim after the P7 result translation, tool-choice/README/CONFIG siblings agree, RUNNER.md's removed sentences leave no contradicting mention)
Completeness: S1–S9 resolved | open ids: none
Spot check: bun scripts/check-skill-context.mjs --documents → match
Verdict: NEEDS-DECISION (B1, B2, B3, B4)
```
