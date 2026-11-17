# External verify — feature/554-hook-scripts-to-cli

Run 2026-11-17 by the session's verifier over PR #620 (no prior receipt, no review
verdict → full verdict, once). Read-only run: no edit, commit, branch or forge
mutation was made by the verification itself; every unproven mutating command the
change introduced (`fullauto-merge`, `git-identity-check`, the shell suites) ran
only inside its own `mktemp -d` fixtures with stubbed forge CLIs — none executed
against the live tree.

```
EXTERNAL VERIFY — base: 9de62e1c · head: 0b010f41
Blockers: 9 — each: file:line, reproducer, base-vs-head evidence
Advisories: 6 — each: file:line, why advisory
Sibling sweep: list — 5 survivors (B6, B7, B8, B9, A3), see below
Completeness: S1, S4–S15 resolved with (Implements:) validators green here · open ids: S2, S3, S16
Spot check: bash template/.agentic-workflow/hooks/tests/test-hook-shims.sh → match (reported "23 case(s), 0 failure(s)" == observed)
Verdict: NEEDS-DECISION (9)
```

`base` = merge-base with `origin/main` (`5e123c61` at run time). All 19
obligation validators, all 14 acceptance checks and the declared suites were run
in the foreground; the green half is in the unit doc's `## Log` (E-lines) and
reproduced again by this run: verify exit 0 · root gate `118/118 PASS exit 0` ·
crate `1212/0` · pi `956/0` · hook suites `23/46/31/8+44` cases · rigidity
`ok: 15 guard file(s), 3 rule(s)` · budgets PASS ×2 · docs-generate PASS.

## Blockers (each: file:line · reproducer · base-vs-head)

- **B1** `docs/features/554-hook-scripts-to-cli/SPEC.md:84-87` (criterion 2, S2/S3)
  — the declared check `rg -n '^(turn-contract|guard-command|git-identity-check|fullauto-merge)$' -c packages/agentic-workflow/bin/agentic-workflow.mjs`
  answers **0 matches, exit 1**; the criterion says *matches 4*. The bin's labels
  are `case "x":` lines (`:663 :670 :677 :684`). Base: same command exits 1
  (the subcommands do not exist there); the AC text is new and its check cannot
  pass at head. Fires only on change-owned bytes. Smallest action: re-spell the
  pattern to `case "(…)":` (stays *matches 4*).
- **B2** `SPEC.md:101-103` (criterion 6, S7/S13) — declared check
  `rg … 'from "@gtrabanco/agentic-workflow/src/guard/git-identity.mjs"' …`
  answers **3**; the criterion says *matches 1*. The three are the import (`:43`)
  and both re-exports (`:46 :47`), all added by the change. Base: 0 matches.
  Smallest action: state *matches 3* (import + both re-exports).
- **B3** `SPEC.md:113-115` (criterion 10, S11) **and** `SPEC.md:356` (Log E19)
  — `--glob '!tests/**'` excludes nothing (this unit's own E26 documents that
  rg matches globs against the whole path), so the command answers **2 matches**
  (`tests/test-hook-shims.sh:56,59`), the criterion says *matches 0* and E19
  records *exit 0 with no match* (rg exit 0 means matches found — the recorded
  line is self-contradictory and false as run). The fix landed in O11's cell
  (E26) while these two siblings kept the broken spelling — F51/F53 class.
  Base: the same command matched ~70 lines (never 0). Smallest action: spell
  both as `-g '!**/tests/**'` (answers 0/exit 1 at head); correct E19 by
  appending a superseding F/E line, never by rewriting the frozen evidence line.
- **B4** `docs/features/554-hook-scripts-to-cli/planning-obligations.md` row
  **O17** — validator `rg -n 'base-vs-head differential' docs/features/554-hook-scripts-to-cli/SPEC.md`
  says *matches 1*; observed **2** (E24:363 and E26:367 — E26 re-quoted the token
  while "fixing" the cell). A `verified` row whose stated outcome no longer
  reproduces. Smallest action: anchor the pattern to E24's wording
  (`base-vs-head differential on`) so it answers 1; flip O17 back, re-run, flip.
- **B5** `SPEC.md:250-279` (Tasks) — **S2, S3, S16 are implemented by no phase**.
  Reproducer: `agentic-workflow phase-lint docs/features/554-hook-scripts-to-cli/SPEC.md`
  → `verdict BLOCKED: no-phases`, exit 1 (task bullets are written
  `- **P1** —`, the unit-doc grammar is `- P1 —`); a scratch copy with only the
  bold markers removed then answers `spec-unlinked: S2/S3/S16 is implemented by
  no phase` → `BLOCKED: lint-blocked`. Base: the doc does not exist at base; the
  no-phases class pre-exists at base on two untouched docs (advisory A1).
  Smallest action: unbold the seven task bullets and add the missing
  `(Implements: …)` links (P2/P3/P4/P5 carry S2, P3/P6 carry S3, P7 carries S16).
- **B6** `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md:111` — live
  shipped prose "explain that shell adapters require `jq`" is false at head (the
  adapters carry no `jq`; hooks README, BOOTSTRAP_WRITE and MIGRATION all state
  the retirement). The change updated this file's sibling BOOTSTRAP_WRITE and
  left this one lying — sibling-sweep class. Base: true at base. Smallest action:
  reword to the shim/CLI dependency (no `jq`).
- **B7** `scripts/git-config-writes.mjs:25` and `scripts/git-config-writes.test.mjs:17`
  — "the same boundary `template/.agentic-workflow/hooks/guard-command.sh`
  declares" / "exactly like `guard-command.sh`'s literal-token boundary": the
  shim no longer declares that boundary (base shim did, `:64-66`; the declaration
  now lives in `packages/agentic-workflow/src/guard/command.mjs:20`).
  Surviving attribution to a dead owner — sibling-sweep class. Smallest action:
  retarget both comments to the crate module.
- **B8** `docs/fix/546-review-guards-flexibility-portability/planning-obligations.md`
  rows **O1 (:10), O12 (:21), O19 (:28)** — declared validators name files this
  change deleted or cases it retired: `bash …/test-temp-lib.sh` and
  `bash …/test-forge-adapter.sh` both answer *No such file or directory*, and
  O19's "`jq unavailable` case 30/31" is now the absent-CLI pair; present-tense
  claims ("the one temp resolution lives in `hooks/lib/temp.sh`") are false at
  head, yet all three rows read `verified`. Unit 546 is `in-progress` (PR #549).
  Base: all three validators green. Smallest action: re-scope the three rows to
  the post-#554 homes (`src/forge.mjs`/`src/temp.mjs`, crate suites, absent-CLI
  cases), flip, re-run their validators in the foreground, and log the fold in
  546's `## Log`.
- **B9** `template/.agentic-workflow/hooks/git-identity-check.sh:20-22` — the
  shipped header declares "*2 the CLI is absent* or the argv is unusable" while
  the shim exits **1** with no CLI (README's degradation table and the suites
  pin 1; argv-unusable → the CLI's usage exit 2 is correct). Contract text in a
  shipped template contradicts behavior. Base: no CLI-exit claim existed.
  Smallest action: correct the header's Exit block to 1 (absent CLI) / 2 (usage).

## Advisories (why advisory, not blocker)

- **A1** `phase-lint no-phases` class pre-exists at base: `docs/features/15-injection-safe-urgency/SPEC.md`
  and `docs/features/552-template-secret-scan/SPEC.md` are BLOCKED the same way
  at `9de62e1c` — stability rule (fires on untouched docs) keeps the class an
  advisory; B5 fixes this unit's own instance only.
- **A2** O10's cell/Log E18: `rg --files template/.agentic-workflow/hooks/lib`
  now exits **2** (directory absent) where E18 recorded exit 1; the cell's stated
  outcome "*matches 0*" still holds (zero files). No edit; historical E18 kept.
- **A3** `packages/agentic-workflow/test/turn-contract.parity.test.mjs:3`
  "the drift gate between the two implementations" — stale terminology (one
  implementation, two faces); comment-only, suite green. (Folded in the batch
  below as related text.)
- **A4** `SPEC.md:93-96` (criterion 4, S5) — "every file in `hooks/*.sh` other
  than `tests/` … execs the CLI and forwards the exit" over-scopes: `index-sync.sh`
  never execs or forwards (its contract: always exit 0) and `secret-scan.sh`
  resolves `bun`/`node`; both files are untouched by the change, so the
  reproducer fires on untouched adjacent code → advisory. (Scope wording folded
  in the batch below.)
- **A5** `SPEC.md:126-127` (criterion 14) and O18's `required-evidence` declare
  "(recorded in the unit doc's `## Log`)" but no such E line exists; O18's
  validator itself reproduces (no removed consent row). Evidence pointer to be
  appended (folded in the batch below).
- **A6** `docs/fix/546-review-guards-flexibility-portability/decisions.md` D10
  (2026-11-14) "`hooks/lib/` is where a shared hook fact lives" — dated decision
  record superseded by #554 D4; a dated pointer is added with B8, the history
  itself is left intact.

## Sibling sweep (survivors named)

list — B6 (BOOTSTRAP_DISCOVERY), B7 (git-config-writes ×2), B8 (546's three
ledger rows), B9 (shim header vs README/tests), A3 (parity comment). Swept and
**clean**: `docs/workflow/MIGRATION.md` ("are gone" ✓), `src/temp.mjs` /
`forge.test.mjs` / `hook-shims.test.mjs` headers (historical/absence assertions ✓),
`docs/features/552-…/SPEC.md:328` (verbatim issue quote — correct as a quote),
546's dated PE rows and SPEC design/Log lines (frozen history with freshness
stamps), `skills/init-workspace/SKILL.md` and `GIT_IDENTITY_HARDENING.md`
(still-true hook-path references).

## Disposition

Routed to the owner's local apply order (`/aw-local-apply`): one correction
batch on B1–B9 (+A3/A4/A5/A6 folds) → one recheck limited to these blockers.
No finding here is a conversion target; none was waived.

## Addendum — 2026-11-17, in-batch sibling sweep (S3, before any fix)

- **B10** `scripts/identity-hook-parity.test.mjs:3-8` — the file header asserts
  the pre-#554 architecture as present fact: "one contract, two implementations"
  and "they cannot share code: the commit hook is a bash script … (it may not
  shell out to a node CLI that the project does not have)". At head the commit
  hook is exactly a shim that execs the node CLI, and both carriers read
  `packages/agentic-workflow/src/guard/git-identity.mjs`; the change edited this
  file (the `AGENTIC_WORKFLOW_BIN` entry) and left the paragraph. Base: true at
  base. Reproducer: read the header against
  `template/.agentic-workflow/hooks/git-identity-check.sh`. Blocker count:
  9 → 10; disposition unchanged (one batch → one recheck).

## Correction batch & recheck — 2026-11-17

One batch under the owner's local apply order (S1–S4, §9). B1–B9 fixed and
re-scoped; B10 parked by the path-protection gate. The recheck was limited to
the blockers, every command re-run in the foreground (unit doc `## Log` E29,
F1–F5; 546's fold at its F1/E9):

- **B1** criterion 2 → `4` ✓ (`9fd8d5e7`)
- **B2** criterion 6 → `3` ✓
- **B3** criterion 10 → `0 matches, exit 1` ✓; E19 kept as run, superseded by F1
- **B4** O17 → `1`, row planned → re-run → verified ✓
- **B5** `phase-lint` → `verdict PASS` (P1–P7, 6/6 each); S2/S3/S16 linked; `verify` → exit 0 ✓
- **B6** BOOTSTRAP_DISCOVERY jq claim → `0 matches` ✓ (`c07f7aa4`)
- **B7** git-config-writes attribution → `0 matches`, crate module named ✓
- **B8** 546 O1/O12/O19 re-scoped, five validators green (18/0, 46, 10/0, ok, 31/0), verified at E9 ✓ (`02dd2762`)
- **B9** shim header now matches code and README (absent CLI exits 1, usage 2) ✓
- **B10 OPEN** — `scripts/identity-hook-parity.test.mjs` is a post-freeze
  protected test file: the gate requires a `justification` row *plus* a
  recorded `human-owner` `approval` row in
  `docs/features/554-hook-scripts-to-cli/decisions.md`; one question asked;
  Findings row F6 carries it.

Advisories: A3/A4/A5 folded in the same batch; A1 (pre-existing `no-phases`
class on docs 15 and 552), A2 (E18 exit-1 vs exit-2; "matches 0" still true)
and A6 (dated D10 supersession pointer) recorded — none blocking.

Regression (S3): root `--jobs 1` → **exit 0 · 118/118**; default pool 117/118
with only `unit-route`'s disclosed load flake (standalone 64/64); local-gate
steps 1–17 PASS, step 18/19 `dependency-pin-gate` red on registry drift
(`pi-extensible-workflows` 6.3.0 vs 6.4.0 — pin surface absent from the diff,
identical rejection at base); pi 956/0; budgets PASS ×2; docs-generate PASS;
skill-lint PASS; changeset lint ok; eight template shell suites green.

**Verdict after recheck: NEEDS-DECISION (1 — B10, awaiting the recorded
human-owner approval; no other open blocker).**
