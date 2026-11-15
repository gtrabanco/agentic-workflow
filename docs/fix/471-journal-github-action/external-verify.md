# External verify — fix/471-journal-github-action

2026-11-15 · **full verdict** — no prior `EXTERNAL VERIFY` block or review receipt
exists anywhere in this unit dir, so nothing here is a delta. Target bound from
state: unit `docs/fix/471-journal-github-action/` (SPEC + two planning ledgers +
decisions), base `origin/main` `4eedcf61`, head = PR [#562](https://github.com/gtrabanco/agentic-workflow/pull/562)'s
forge head `6fec2087` (the owner's free-text intent #562 selects the target; it
waives no check). Read-only run: no commit, no push, no branch, no forge
mutation, no edit to the change under review. Every mutating path the change
introduced (the headless writer, the adapter) ran only in `mktemp -d` scratch,
removed afterwards (`ls -d /tmp/aw471-*` → exit 2); the live tree stayed
`git status`-clean through the run.

State note: mid-run a concurrent session committed `88495bb0` on this branch
(19:27:31Z — one conforming carrier fragment, unpushed; local ahead 1 of
origin). The forge PR head is unchanged (`6fec2087`, 10 commits). Every
claim-verification command either ran before that commit, ran against explicit
`git archive 6fec2087` / `4eedcf61` scratch exports, or ran at the local head
whose only delta from the PR head is that one fragment (validated green by the
gate's `journal-carrier-check`).

## Command → observed

| command | observed |
|---|---|
| `bun test packages/agentic-workflow/test/journal.headless.test.mjs` (head) | exit 0 · `24 pass / 0 fail` — all 14 obligation case labels green |
| same command in a scratch clone at the red commit `4f512cd2` | **exit 1** · `0 pass / 1 fail / 1 error` — `Cannot find module '../src/journal/headless.mjs'`; matches E1 exactly |
| `bun test …journal.test.mjs journal.write.test.mjs journal.surfaces.test.mjs` | exit 0 · `60 pass` |
| `cd packages/agentic-workflow && bun run test` | exit 0 · `822 pass` / 47 files |
| `cd packages/pi-agentic-workflow && bun run test` | exit 0 · `873 pass` / 77 files |
| `bun scripts/local-gate.mjs --skip-network --jobs 1` (**spot check**) | exit 0 · `local-gate: PASS — 15 step(s) in 404s` (reported 402s) |
| `bun scripts/local-gate.mjs --only workspace-install,pi-compat-guard` | exit 0 · `Checked 172 installs across 188 packages (no changes)` · `pi leg latest: tsc --noEmit clean` |
| `bun scripts/local-gate.mjs --only dependency-pin-gate,dependency-advisories` | exit 0 · PASS — all four pins match the local train `4.10.0` |
| `node scripts/run-root-suite.mjs --jobs 2` | exit 0 · **113 PASS / 0 FAIL** — matches G1 |
| `bun scripts/skill-lint.mjs` | `0 finding(s)` · PASS |
| `bun scripts/check-skill-context.mjs` | `PASS context budgets: 30 skills` |
| `bun scripts/check-skill-context.mjs --documents` | `PASS context documents: 4 budgeted documents` |
| `bun test scripts/normative-drift.test.mjs scripts/prose-gate-inventory.test.mjs` | exit 0 · `43 pass` |
| `bun test …journal.surfaces.test.mjs scripts/capability-inventory.test.mjs scripts/doc-discipline.test.mjs` | exit 0 · `47 pass` |
| `bun scripts/docs-generate.mjs --check` | `PASS` · 3 checked, 0 stale, roadmap unchanged |
| `bun scripts/roadmap-settle.mjs` | `violations: 0` · PASS (204 unit docs) |
| `bun scripts/lint-changeset.mjs .changeset/471-journal-github-action.md` | `ok` |
| `phase-lint docs/fix/471-journal-github-action/SPEC.md` | `verdict PASS` · fingerprint `ec65a89a43fb…` |
| `journal aggregate --check` (live tree) | `ok:true, checked:41` at the local head; at the PR head the carrier holds 40 fragments, so the PR body's `checked:40` reproduces at `6fec2087` (the +1 is the concurrent fragment) |
| `rg -n 'LOGS\.md' journal/ packages/agentic-workflow/src/journal/headless.mjs` | 0 lines (exit 1) — O5/E6 matches |
| `rg -ci 'gh api\|api\.github\.com\|GITHUB_TOKEN\|GH_TOKEN\|permissions:' journal/` | 0 (exit 1) — O6/E6 matches |
| `rg -ci 'github\|gitlab\|forge' packages/agentic-workflow/src/journal/headless.mjs` | 0 (exit 1) — E6 matches |
| `rg -l 'readdirSync\(.*ROOT' scripts/*.test.mjs` | **3 files**: `unit-doc-contract.test.mjs`, `vocabulary-parity.test.mjs`, `git-env.test.mjs` — `pre-execution-quality.test.mjs` never matches → **B2** |
| scratch fixture: `journal headless …` → re-run → `aggregate` | exit 0 `written` → exit 0 `already-present` (1 file) → consumed, carrier empty |
| scratch fixture: same run id **after** aggregation | exit 0 **`written`** — second `…gha-42.md`, then `aggregate` → `docs/LOGS.md` holds **2** `## ` headings both `headless ci run 42` → **B1** |
| scratch refusals: absent carrier / missing provenance / `--name` / prose+block | exit 2 each, `JOURNAL REFUSAL — …` naming the cause; absent carrier creates nothing (AC10) |
| scratch adapter e2e (`AGENTIC_WORKFLOW_RUNNER` override) | exit 0 · receipt on `$GITHUB_OUTPUT` (`fragment`/`name`/`status`); missing `GITHUB_WORKFLOW` → exit 2 naming the variable |
| base scratch `4eedcf61`: `journal headless …` | exit 2 · ``JOURNAL REFUSAL — journal requires the `aggregate`, `write` or `name` operation, got "headless"`` — base-side proof |
| differential harness `4eedcf61` vs `6fec2087` (identical fixtures, clock/path-normalized, 9-command corpus incl. `journal name/write/aggregate/--check`, `log render --raw`, both refusals) | **only the declared delta** (the `journal` refusal now names `headless`); every other line and every exit code byte-identical → `UNDECLARED 0` (E5 reproduced) |

## Blockers

**B1 — idempotency is carrier-scoped; after the aggregator consumes the
fragment, a re-run of the same run id duplicates the run's entry**
`packages/agentic-workflow/src/journal/headless.mjs:178` (`findRunFragment`
reads only `.agentic-workflow/journal/`) vs the shipped claims:
`packages/agentic-workflow/README.md:302` (`journal-headless-grammar@1`,
one-entry-per-run row: "a re-run never duplicates the entry"),
`template/.agentic-workflow/journal.md:130` ("A re-run is a no-op … never
duplicates an entry and never fails on it"), `decisions.md` D6 ("the writer
must not create a second entry").
*Reproducer* (scratch toy repo): `journal headless --run-id 42 …` → `written`;
`journal aggregate` (consumed); same command again → **`status: written`**, a
second `…gha-42.md`; `journal aggregate` again → `docs/LOGS.md` carries two
headings labeled `headless ci run 42`. Deterministic, four commands.
*Base vs head*: at `4eedcf61` the operation does not exist (`journal headless`
→ unknown-operation refusal, exit 2), so the defect cannot reproduce at base;
the reproducer touches only the new operation (stability check: quiet on every
untouched surface — the sibling writers' own carrier-scoped check at
`src/journal/write.mjs` behaves identically before and after).
*Smallest action*: one of — (a) extend the already-present detection to a
consumed entry (the journal already carries the run's label), or (b) narrow the
three claims above to the pending-fragment window. Route to `/aw-local-apply`.

**B2 — the unit doc records a command result that does not reproduce**
`docs/fix/471-journal-github-action/SPEC.md:115-117` (Impact bullet) records
`rg -l 'readdirSync\(.*ROOT' scripts/*.test.mjs` → "only
`pre-execution-quality.test.mjs:607`, scoped to `*.md`".
*Reproducer*: the exact command returns `unit-doc-contract.test.mjs`,
`vocabulary-parity.test.mjs`, `git-env.test.mjs` — `pre-execution-quality.test.mjs`
never matches (its line 607 is `readdirSync(root)`, lowercase), and `-l` prints
no line numbers at all.
*Base vs head*: the three matching scripts are byte-identical at base and head;
the false citation is new bytes that ship with this change. The invariant the
sentence supports **holds** — all three matches are subdir-scoped (`skills/…`,
`skills`, `packages`), nothing enumerates the repo root, so the new `journal/`
directory breaks no verdict.
*Smallest action*: correct the parenthetical to the observed result (three
subdir-scoped files; conclusion unchanged). Route to `/aw-local-apply`.

## Advisories

- **A1** — `journal/action.yml:38`: the `block` input documents "Use `-` for
  stdin", but through the composite step the child's stdin is empty, so
  `--block -` can only ever refuse (`got an empty body`); the option is
  unusable in the action's own context (it works on the CLI, suite-covered).
  Loud refusal, never silent → advisory; reword the description for the action
  surface.
- **A2** — `packages/agentic-workflow/src/journal/headless.mjs` adapter
  `journal/headless.mjs:108`: the `bunx` path has no `bun >= 1.4` engine gate
  while the `npx` path gates node < 24 at line 113; the crate's `engines`
  declares both. Low-realism runner precondition; PE-008/D8's refusal claim is
  node-scoped, so this is a coverage gap, not a false claim.
- **A3** — `docs/ROADMAP.md:155`: the Features-row 471 description still
  carries the issue's pre-triage wording "appending journal fragments to
  `docs/LOGS.md`", which D1 superseded (carrier fragment; the aggregator stays
  the only LOGS.md writer). `rowUpsert` preserves the hand-owned cell
  byte-exact; the Fix row and SPEC state the landed truth, and the net effect
  (entries reach `docs/LOGS.md` via the aggregator) still holds.
- **A4** — `template/AGENTS.md:42`: the doc-map row "(written by `/log-session`
  + the `.claude/` hooks)" doesn't name the headless writer. Byte-identical at
  base and never exhaustive (the pi extension's writer is absent at base too).
- **A5** — `docs/fix/452-journal-fragment-validation/external-verify.md:71`:
  dated receipt describing the router refusal as "now enumerating `aggregate`,
  `write` or `name`" — frozen history, not live narration (dated-receipt
  precedent).

## Sibling sweep

**clean for live surfaces.** The rewritten router refusal survives nowhere live
(no test or prose pins the old three-op enumeration; root suite 113/113);
`journal-headless-grammar` is declared in every surface that must carry it
(README block, AGENTS `normative-surfaces@1` row, both `GATE_INVENTORY` claims,
the budgets `machineLines` pin — normative-drift + prose-gate-inventory 43/43);
the writer table, consent clause, capabilities row and projection were all
updated by the change itself. Three advisory-grade survivors are listed above
(A3, A4, A5) — none is a live surface asserting the removed truth.

## Completeness

**S1–S20 all resolved** — tasks P1–P10 each carry their `(Implements: S#)`
clause and every validator re-ran green here: phase-lint PASS (S1–S4, S8),
RED corpus exit 1 at `4f512cd2` (S5), fixture E-line + `ls -d /tmp/aw471-*`
exit 2 (S6–S7), headless suite 24/24 with all obligation case labels (S9,
S13–S18, S20), normative/prose/documents/budgets gates (S9–S10), surfaces +
capability + doc-discipline 47 (S10, S18–S19), changeset + docs-generate +
roadmap-settle (S10), local-gate 15/15 + four network steps + differential
`UNDECLARED 0` (S2, S9, S11–S12). **Obligations O1–O14 all `verified`** and
every stated outcome re-produced on a foreground run (suite labels, the `rg`
cells, the two grammar suites, the three journal suites, the differential).
**Open ids: none.**

## Spot check

`bun scripts/local-gate.mjs --skip-network --jobs 1` → **match** — observed
`local-gate: PASS — 15 step(s) in 404s` against the reported
`PASS — 15 step(s) in 402s` (timing jitter only). Root suite re-run separately
at `--jobs 2`: 113 PASS / 0 FAIL, matching G1.

## Verdict

2026-11-15

```text
EXTERNAL VERIFY — base: 4eedcf61 · head: 6fec2087
Blockers: 2 — B1 packages/agentic-workflow/src/journal/headless.mjs:178 (findRunFragment reads the carrier only) vs README.md:302 / template/.agentic-workflow/journal.md:130 / decisions.md D6: reproducer (scratch) = headless write → aggregate → same run id again → status "written" + a second …gha-42.md → aggregate → docs/LOGS.md holds two `headless ci run 42` headings; base 4eedcf61 refuses `journal headless` (unknown operation, exit 2) so no base reproduction; stability: the reproducer touches only the new operation · B2 docs/fix/471-journal-github-action/SPEC.md:115: reproducer `rg -l 'readdirSync\(.*ROOT' scripts/*.test.mjs` → observed unit-doc-contract / vocabulary-parity / git-env (pre-execution-quality never matches; `-l` prints no line numbers) while the SPEC records "only pre-execution-quality.test.mjs:607"; the cited scripts are byte-identical at base and head, the false citation ships with this change, and the invariant it supports holds (all three matches are subdir-scoped)
Advisories: 5 — journal/action.yml:38 (`block` documents `-` for stdin, which the composite step can never feed — it can only refuse; CLI path unaffected); journal/headless.mjs:108 (the bunx path has no `bun >=1.4` engine gate while the npx path gates node <24 at :113; PE-008/D8 claims are node-scoped); docs/ROADMAP.md:155 (Features-row description keeps the issue's pre-triage "appending … to docs/LOGS.md" wording D1 superseded; rowUpsert preserves the hand-owned cell, the Fix row states the landed truth); template/AGENTS.md:42 (writer list omits the headless writer — byte-identical at base and never exhaustive); docs/fix/452-journal-fragment-validation/external-verify.md:71 (dated receipt naming the old three-op refusal — frozen history, not live narration)
Sibling sweep: clean for live surfaces — the old refusal text survives nowhere live (root suite 113/113), journal-headless-grammar declared in all four required surfaces (43/43 drift+inventory); three advisory-grade survivors listed above (A3, A4, A5)
Completeness: S1–S20 resolved (P1–P10 validators all re-ran green here), O1–O14 all verified on foreground re-runs — open ids: none
Spot check: bun scripts/local-gate.mjs --skip-network --jobs 1 → match (observed PASS — 15 step(s) in 404s vs reported 402s; root suite re-run 113/113 matching G1)
Verdict: NEEDS-DECISION (2 open blockers)
```

Corrections belong to `/aw-local-apply` under its own correction bounds (one
batch → one blockers-only recheck → a second only if the same blocker persists
→ `Needs your decision`). This receipt is left uncommitted — the run is
read-only; the owner (or the apply session) commits it with the correction
batch.
