# External verify — 2026-11-20 (features/553-universal-cli-coverage)

No prior `EXTERNAL VERIFY` block or review verdict existed for this unit (the
unit dir held only `SPEC.md` and the two planning ledgers; `rg` over the unit
and `docs/LOGS.md` found no verdict for 553; PR #665 carries no review comment),
so this is the full verdict, once. Read-only pass: no commit, no push, no
branch, no forge mutation, no code edit during verification — the only write is
this receipt, left uncommitted for the owner/implementer. Every scaffold and
base-side copy lived in `mktemp -d` under `/tmp` (removed after this file was
written); no unproven mutation path was executed against the live tree — the
one mutating command run in place was `bun scripts/local-gate.mjs`, whose step
table was read first and whose in-tree writes are the declared frozen-lockfile
install, the schema `dist/` build, the suites themselves and the age-bounded
temp sweep.

EXTERNAL VERIFY — base: c5fb2ba58156053e539783c3442fe76c97239c39 · head: b19646015b822c53dc359e8b5beaa2dd19feb742 (PR #665, OPEN)
Bound at run start via `git ls-remote origin main` = `c5fb2ba58`; origin/main
advanced to `e23088466` mid-pass (fix #655's landing — `git log c5fb2ba..e230884`
is #655 only), and every base-side comparison was re-pinned to the bound SHA; a
transient diff taken against the moved ref (phantom "655 deletions") is
withdrawn as a ref-movement artifact — `git diff c5fb2ba..HEAD --name-status`
touches no 655 path.
Blockers: 3 —
(1) **B1** `docs/features/553-universal-cli-coverage/planning-obligations.md:14`
(O4, status `verified`): the row's validator, verbatim
`rg -c "bun scripts/|node scripts/" skills/ --glob '!skill-lint/**'`, is stated
to "finds no file (exit 1)" — observed **exit 0**, printing
`skills/skill-lint/references/CHECKS.md:1` and `skills/skill-lint/SKILL.md:5`
(ripgrep 15.2.0 anchors a glob containing `/` to cwd, so `skill-lint/**`
excludes nothing; `--glob '!**/skill-lint/**'` gives the exit 1 the cell
promises). Base-vs-head: the ledger is new on this branch (c5fb2ba has no unit
dir), so the non-reproducing claim is introduced here; the substantive S7 end
state is independently true in this pass (6 matches, all inside `skill-lint`,
the sole `metadata.internal: true` skill). Stability: exact command-vs-claim,
fires on no adjacent code. Smallest action: `/aw-local-apply` corrects the
cell's glob (or runs it inside `skills/`) and quotes the passing output;
(2) **B2** `docs/features/553-universal-cli-coverage/planning-obligations.md:22`
(O12, status `verified`): the row's second validator conjunct,
`rg -c 'id: "skill-context"' scripts/local-gate.mjs` "prints `1`", observed
**exit 1**, no output — the step id is `id: "skill-context-budgets"`
(`scripts/local-gate.mjs:242`), and `git log -S 'id: "skill-context"'` (exact
string, closing quote) finds no commit where the cell's literal ever existed, so
it never reproduced. The row's first conjunct (`release-workflows.test.mjs`
pinned id list containing the step) re-ran green inside the gate's root-suite
step. Base-vs-head: row new on this branch. Stability: exact
command-vs-claim. Smallest action: `/aw-local-apply` rewords the cell to
`id: "skill-context-budgets"`;
(3) **B3** `docs/workflow/REPOSITORY_STATE.md:31` (F004, `frozen`) — sibling
sweep: the row declares `ls scripts/*.test.mjs | wc -l` → **135**; observed at
head **136** (`scripts/cli-coverage.test.mjs` is this branch's P1 addition; the
bound base measures 135, so the claim was true at base and is falsified by this
change). No disposition was recorded — the unit's R3 covers only AD-008's
citation, and the doc's own C007 precedent shows a count change is amended
through the resolve flow. Stability: the count is a property of the tree this
diff changed. Smallest action: run `resolve-repository-state` (the doc's sole
writer — never a hand edit) to re-measure and amend F004 to 136 at this head.
Advisories: 5 —
(A1) `template/AGENTS.md:159`'s newly cited command, run in the degit-shaped
scaffold (copy of `template/`, no `scripts/`): `runner docs-generate` (and
`--check`) exits 1 with `RoadmapMovedError: roadmap-moved` because the template
ships only legacy `template/docs/features/ROADMAP.md` while
`ROADMAP_LEGACY_READ` defaults closed; with `AGENTIC_WORKFLOW_ROADMAP_LEGACY_READ=1`
the generate→check flow passes exactly as E10 reports, and the
repo-minus-scripts scaffold passes unflagged (E10's receipt reproduced). Why
advisory: the refusal mechanism and the template layout are byte-identical at
the bound base (`git diff c5fb2ba..HEAD -- packages/agentic-workflow/src/index-document.mjs`
is empty; the base command reachable with `--root` hits the same throw), and at
base the template's cited command did not exist at all — the defect class
pre-exists; route the bootstrap/flag question to the owner;
(A2) `docs/features/553-universal-cli-coverage/SPEC.md:115-117` (Impact, "What
must be asked before touching"): "the shim keeps argv, exit code and bytes
identical and every sibling suite runs unmodified" overstates the delivery —
25 `scripts/*.test.mjs` files changed (46 deleted lines, each a recorded
re-point per D12/D16 or an added reproducer; 0 assertions lost — full O26 read),
and the usage-error program name changed base→head
(`scripts/roadmap-settle.mjs:55` `usage: roadmap-settle.mjs …` →
`src/roadmap-settle/index.mjs:46` `usage: agentic-workflow roadmap-settle …`;
suite re-pointed in `b948a5f05`). Why advisory: both doors print byte-identical
output at head (shim-parity case + two independent probes), argv and exit codes
are unchanged, the migration of the command's identity is what S1 asked for,
and no assertion was lost — the prose sentence is what needs amending;
(A3) F12-class citation survivors in live repo docs:
`docs/workflow/RETENTION.md:175` (producer is `bun scripts/retention-debt.mjs`),
`docs/workflow/WORKFLOW_INVARIANTS.md:49` (`bun scripts/repository-state.mjs`
in the freshness step), `docs/workflow/SKILLS.md:43` (sh box
`bun scripts/check-skill-context.mjs`). Why advisory: every command still
exists as a zero-logic shim and re-ran green here (the shim door was the spot
check), so no falsity — but these are the same live-doc cells the F12 batch
re-pointed elsewhere; fold them into the next correction batch;
(A4) `docs/workflow/REPOSITORY_STATE.md:30,37,89` cite script forms as frozen
validators (`bun scripts/check-skill-context.mjs`, `bun scripts/docs-generate.mjs --check`,
`bun scripts/repository-state.mjs`) — all run green via the shims, so the cells
are true; the doc is sole-writer (R3's recorded disposition names AD-008 only),
so the citation-style refresh rides the same `resolve-repository-state` pass as
B3 rather than being an edit here;
(A5) `packages/pi-agentic-workflow/src/extension/receipt-guard.ts:41,45` still
suggest `bun scripts/review-receipt.mjs emit` / `bun scripts/audit-pr-gate.mjs comment`
in its runtime messages (both migrated). Why advisory: identical at the bound
base (pre-existing), works repo-side through the shims, and outside the
declared S-scope (S5 named only the log-session handler).
Sibling sweep: list — `skills/` and `template/` are clean of script citations
outside `skill-lint` (the sole internal exemption, D9), and the four retired
truths (TEST_IMPACT's project-local promise, TURN_CONTRACT's placeholder,
template's script citation, pi's writer-script-only resolution) have zero
survivors; remaining `bun scripts/…` mentions are classified as sanctioned
owner/repo-scoped surfaces (`docs/workflow/MIGRATION.md`'s mapping table,
`SETUP.md`'s D13 bootstrap form, `AGENTS.md:376`'s repo-scoped emitter,
`SKILL_CONTEXT_BUDGETS.json`'s dated growth receipts, historical SPEC/LOGS/CHANGELOG
records, crate header comments, the repo-authoring four) except B3 (falsified
count) and A3–A5 (style/pre-existing, above).
Completeness: S1–S8 resolved — every S# has tasks carrying `(Implements: S#)`
whose validators re-ran green here (coverage suite 8/8; families A–E,
release-workflows, normative-drift, cli/usage suites all green inside the gate;
`verify` VERIFY PASS; `roadmap check` PASS; rg probes for S4/S6/S7 exit 1 as
specified; the pi suite 1024/1024 for S5 with an independent three-route probe);
obligations O1–O3, O5–O11, O13–O26 re-ran `verified` green, O15 is evidenced
`n/a` (D7 + fixture-name rg exit 1), O4 and O12 are the open ids (B1, B2).
Spot check: `bun scripts/check-skill-context.mjs` → match (reported E4: exit 0 ·
`PASS context budgets: 30 skills`; observed identical), with the gate line
`local-gate: PASS — 20 step(s)` matching G3's reported shape as a second tie.
Verdict: NEEDS-DECISION (3 open blockers: planning-obligations.md:14 (O4) ·
planning-obligations.md:22 (O12) · docs/workflow/REPOSITORY_STATE.md:31 (F004))

## Evidence

`command: observed result` — every command run on this checkout at
head `b19646015` unless a base is named; `git status` was clean before this
receipt was written.

| command | observed |
|---|---|
| `bun test scripts/cli-coverage.test.mjs` | exit 0 · 8 pass, 0 fail (P1/P8 validator; O1/O2/O6/O17/O21) |
| `bun scripts/local-gate.mjs` | exit 0 · `local-gate: PASS — 20 step(s) in 535s` (O22; matches G3's reported PASS-20 shape; runs root suite, crate bun+node, schema, docs-generate --check step, skill-context step, pi node leg) |
| `bun scripts/check-skill-context.mjs` | exit 0 · `PASS context budgets: 30 skills` — spot check, matches E4; the CLI door (`bin/… skill-context`) produced byte-identical stdout/stderr, both exit 0 |
| `bun run --cwd packages/pi-agentic-workflow test` | exit 0 · 1024 pass, 0 fail (AC5/O14); gate's `pi-node-compat` (`test:node`) green too (E8) |
| `bun scripts/docs-generate.mjs --check` | exit 0 · `Files: 3 checked · 0 missing · 0 stale`, `Roadmap: unchanged`, `verdict: PASS` (O20/E6) |
| `bun …/bin/agentic-workflow.mjs verify docs/features/553-universal-cli-coverage/SPEC.md` | exit 0 · `VERIFY PASS`, `violations: []` (P2 validator) |
| `bun …/bin/agentic-workflow.mjs roadmap check …/SPEC.md` | exit 0 · `verdict: PASS`, 0 violations (P9 validator) |
| `rg -c 'runner <subcommand>' docs/workflow/CLI.md` | `1` (O3) |
| `rg -c "bun scripts/\|node scripts/" skills/` | 6 matches, all in `skills/skill-lint/**` (S7/O4 substance); `skills/skill-lint/SKILL.md` carries `metadata.internal: true` (only such skill) |
| `rg -c "bun scripts/\|node scripts/" skills/ --glob '!skill-lint/**'` | **exit 0**, two counts — O4's stated exit 1 does not reproduce (B1); control: `--glob '!**/skill-lint/**'` → exit 1 |
| `rg -c 'id: "skill-context"' scripts/local-gate.mjs` | **exit 1**, no output; `id: "skill-context-budgets"` is at local-gate.mjs:242 (B2); `git log -S` finds no commit carrying the cell's literal |
| `ls scripts/*.test.mjs \| wc -l` | head **136** vs REPOSITORY_STATE F004's `→ 135`; bound base `c5fb2ba` measures 135 (B3) |
| `rg -c '@gtrabanco/agentic-workflow@(<version>\|latest)' skills/` / `rg -c 'this repository ships one' skills/` / `rg -c "bun scripts/x" skills/` / `rg -c 'bun scripts/' template/` | each exit 1, no output (O5, O16, O19, O18 first half) |
| scratch scaffold (repo archive minus `scripts/`): `bun bin/agentic-workflow.mjs docs-generate` then `--check` | exit 0, then exit 0 · `Files: 3 checked · 0 missing · 0 stale`, `verdict: PASS` — E10 reproduced |
| degit-shaped scaffold (copy of `template/`): `docs-generate --check` | exit 1 · `RoadmapMovedError` (A1); with `AGENTIC_WORKFLOW_ROADMAP_LEGACY_READ=1`: generate exit 0 (`3 written`) then `--check` exit 0 · `PASS`; base-side: `index-document.mjs` byte-identical c5fb2ba..HEAD, base `docs-generate` accepts `--root`, template layout (legacy present, canonical absent) identical at base |
| S5 probe (imported `readWriterFacts` with a fake spawn, mktemp script) | no-script root + crateBin → `writer:"cli"`, argv `[crateBin, "session-close", "render", "--kind", "auto"]`; repo root (script present) → `writer:"script"` wins; `crateBin:null` → `writer:"absent"` with reason "…runner crate is not resolvable" — never silent (AC5's mechanism, independent of the package's own tests) |
| `bun bin/agentic-workflow.mjs promise-coherence` vs `bun scripts/promise-coherence.mjs` (bare) | both exit 0, stdout 4574 bytes byte-identical, stderr identical — F13's fix and O21 parity, probe of my own (the suite is the writer's) |
| `git diff c5fb2ba..HEAD -- 'scripts/*.test.mjs'` (deletions read line by line, 46 lines) | every deletion a recorded re-point (D12/D16) or fixture restructure keeping its assertions; additions are reproducers (F8/F9/F11 cases, surface-set pins) — O26 satisfied, 0 assertions lost |
| `git diff c5fb2ba..HEAD --name-status \| rg 655` | none (the mid-run origin/main movement to `e230884` was the only source of the transient phantom deletions) |
| `gh pr view 665` | OPEN, 0 reviews, 0 comments → no prior verdict to delta from |

Notes: the harness refused non-sanctioned `node …` shell commands (its
tool-choice guard, environment-level and pre-existing — the same refusal
appears in other sessions' logs from 2026-11-18), so all runs used `bun`, this
repository's preferred tool; no product behavior was implicated. Scratch dirs
(`/tmp/verify553-*`) were removed after this receipt was written.
