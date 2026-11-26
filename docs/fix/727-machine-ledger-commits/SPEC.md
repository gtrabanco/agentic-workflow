---
type: fix
scope: medium
roadmap_summary: Issue [#727](https://github.com/gtrabanco/agentic-workflow/issues/727) (M): the machine-owned ledgers commit by machinery outside any session's lifetime (pi teardown, `telemetry commit`/`session-close`/`reconstruct write`, the pre-push prelude), the `.gitattributes` shared classes are exempt from the dirty-tree verdict, one commit policy lives beside the ownership map, and `needs-triage` gains its exit state.
ac-hash: a6819e1c5fb5cce98d4e13010c1a9f20d29f5b4ba0feb1912ecaa01371c0c9dc
---

# fix/727-machine-ledger-commits

> One-line: a ledger whose writer is a process — not a step — gets a mechanical
> commit point, one declared class, one policy, and the same class leaves the
> review's dirty-tree verdict alone; `needs-triage` stops being permanent.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.1
schema: @gtrabanco/agentic-workflow-schema@4.10.1
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

```text
retention-declaration@1
path | disposition
SPEC.md | kept
decisions.md | kept
known-issues.md | kept
planning-obligations.md | kept
planning-evidence.md | kept
review-findings.md | trimmable
```

## Issue

`#727` — tracked issue in the project's forge. This unit's PR closes it via
`Closes #727`. Filed 2026-11-25 from the canary `20261125.1` verification
session, after `TIER_COST.md` refused two reviews in a row for a row no session
could have committed.

## Specs

The requester's words, verbatim. `S1` is the apply directive; `S2`–`S8` are the
issue's own asks, in the issue's order.

**S1 — apply issue 727 to this repository under the local workflow.**
> Apply to this repository: issue #727

**S2 — the pi extension commits the ledger at teardown, mechanically.**
> **a) pi package (full coverage)**: in the extension's `session_shutdown` wiring (the same point where the sink already flushes, telemetry-wiring.ts), after the final flush, best-effort commit of the ledger alone (`git add docs/workflow/TIER_COST.md && git commit` under `chore(telemetry):` — same subject family the repo already uses). Uses `runtimeBin()`/`runtimeEnv()` like every spawned child; serializes with a lock (sessions may overlap); never `git add -A` (the session-close lesson, #182). Because the write and the commit happen in the same teardown sequence, defect 1 dissolves; a commit that races only a foreign session's flush leaves its row to the next cycle, which is acceptable because the class is append-only.

**S3 — the skills-only path gets the same commit, without the extension.**
> **b) crate command (skills-without-extension path)**: extend `runner session-close close` (or add a `runner telemetry commit` subcommand) to commit the tier-cost ledger after the session log, and invoke it from `/log-session`'s close-out so a skills-only install still gets the mechanical commit. Residual gap: only the exact-shutdown timing (a live, never-closed session) — covered by making `telemetry reconstruct write` perform the same ledger-alone commit at the end of its `write` phase.

**S4 — the push carries the ledger committed, before the gate steps run.**
> **c) pre-push hook (push coverage)**: the owner must never ask a session to push the ledger — the pre-push gate (IR2, `local-gate --install-hook`) already runs on every push, so add a step to that hook chain which, before the gate steps, commits the pending machine-ledger rows on the branch being pushed (same shape as the existing `docs-generated-projection` step that runs `docs-generate --check` on every push). Outcome: a session never types the command, and every push carries the ledger committed and clean.

**S5 — the machine-ledger class is exempt from the review dirty-tree verdict.**
> Add the declared class of **machine-owned ledgers** (the same classes already named in `.gitattributes` for merge-driving, issue #498, plus #630's telemetry class) to the review's dirty-tree verdict: check-only/exempt — a review may not block on, "fix", or revert a machine-owed ledger row.

**S6 — one stated commit policy for the class, not per-file agreements.**
> Deliverable: one stated **"machine-owned ledger" commit policy** (single mechanical commit point per document class, review exemption for the class, pre-push pairing), applied to the table above — no per-file ad-hoc agreements. Home: `LEDGERS.md` (the map owns writer/zone semantics; the commit policy belongs beside it) with the `.gitattributes` class list as the second source.

**S7 — `needs-triage` leaves a triaged issue, loudly.**
> define the exit in the label vocabulary (`LABELS.md`, the owner) and the pass's step 4/5 (`ISSUE_PROCESS.md`): after a triage pass reaches a published verdict (or a persisted verified outcome), `triage-issue` removes `needs-triage` with the same loud-on-`gh`-failure rule the urgency labels already state (LABELS.md steps 1–3); `remove` verdicts must clear it too.

**S8 — every new mechanical step lands red first.**
> Red-first suites for every new mechanical step (extension wiring test, crate suite, gate-hook test, review-exemption test, triage-exit test), per IR4.

## Acceptance criteria

Frozen at the cut; `ac-hash:` in the frontmatter is this section's SHA-256
(heading and the next `## ` excluded). One criterion per requirement, each
naming the check that proves it.

1. **S1 — the work is applied inline against the frozen ledgers.** `git log --oneline main..HEAD` carries only this unit's conventional commits, and `rg -n 'review-change|audit-pr|fold-findings' docs/fix/727-machine-ledger-commits/SPEC.md` matches no run record of this repository's own machinery.
2. **S2 — a session teardown commits the ledger with zero model tokens.** `bun test packages/pi-agentic-workflow/test/ledger-commit.test.mjs` exits 0 with the case `the teardown commits the ledger alone through the crate command at the runtime that launched pi`: the wiring spawns `telemetry commit --class telemetry` with `runtimeEnv()`, after the final flush, once per session, never with `-A`, and a spawn failure is reported instead of thrown.
3. **S3 — the skills-only path commits the ledger too.** `bun test packages/agentic-workflow/test/machine-ledger-commit.test.mjs` exits 0 with the cases `session-close close commits the log alone, then the ledger alone` and `reconstruct write commits the ledger it appended to`; each asserts a second commit naming only the class's path, and a clean ledger produces no commit.
4. **S4 — a gate run commits the pending rows before any step is dispatched.** `bun test scripts/local-gate.test.mjs` exits 0 with the case `the machine-ledger prelude commits before any step runs`, in which a fixture checkout holds a modified `docs/workflow/TIER_COST.md`, `--only docs-generated-projection --dry-run` prints the prelude's receipt before the plan, and the fixture ends with one `chore(telemetry)` commit naming that path alone.
5. **S5 — the dirty-tree verdict no longer refuses a machine-ledger row, and still refuses a foreign file.** `bun test packages/agentic-workflow/test/turn-contract.engine.test.mjs` exits 0 with the cases `box5: a pending machine-ledger row is exempt from dirty-tree` (exit 0) and `box5: a human-uncommitted ordinary file still fails dirty-tree` (exit 1, `box5: dirty-tree`).
6. **S6 — one policy, three sources that agree.** `bun test scripts/machine-ledger-policy.test.mjs` exits 0: the `machine-ledger-commit@1` block in `LEDGERS.md`, `MACHINE_LEDGER_CLASSES` in the crate, and the `.gitattributes` shared-merge classes name the same path set in both directions, and an injected fourth class on any one side fails.
7. **S7 — the label's exit is stated in its owner and its step, and pinned.** `bun test scripts/machine-ledger-policy.test.mjs` exits 0 with the case `the triage pass removes needs-triage on every published verdict`, asserting `LABELS.md` carries the removal rule and `ISSUE_PROCESS.md`'s classify step names `--remove-label needs-triage` with the loud-on-failure clause, `remove` included.
8. **S8 — every suite above landed before its implementation.** `git log --oneline --reverse main..HEAD` lists each new suite's file in a commit that precedes the commit introducing the module it judges, and `bun scripts/red-first.mjs` (when the touched scripts are root scripts) exits 0.

## Impact

One mechanic, four call sites, and two surfaces that stop failing:

- **`packages/agentic-workflow/src/machine-ledger/index.mjs`** (new) — the one
  machine owner of the class: paths, zone, subject, the lock, and the
  path-scoped commit. Every call site imports it; none re-implements it.
- **`packages/agentic-workflow/src/telemetry/commit.mjs`** (new) —
  `agentic-workflow telemetry commit`, the command the pi extension spawns and
  the skills-only path cites; dispatched beside `telemetry reconstruct`.
- **`session-close close`** and **`telemetry reconstruct write`** — after the
  write they already own, the sweep commits what the class leaves pending.
- **`packages/pi-agentic-workflow/src/ledger-commit.ts`** (new) — the spawn
  helper (`runtimeBin()`/`runtimeEnv()`), wired into `session_shutdown` after
  the final flush; a missing crate, a non-checkout or a failed spawn is one
  reported line, never a thrown teardown.
- **`scripts/local-gate.mjs`** — a `prelude: true` step, run sequentially
  before the pool (a commit inside the parallel pool would race the suites that
  read the same bytes).
- **`packages/agentic-workflow/src/turn-contract.mjs`** — box 5's dirty-tree
  filters the class out of `git status --porcelain` before judging; `ahead-of-remote`
  is untouched, so a push still needs its commits published.
- **`LEDGERS.md` + `AGENTS.md` + `.gitattributes` + skills prose** — the
  policy's three sources, its normative-surface row and the class's citations.
- **Consumers that stop being true**: `/log-session`'s close-out prose ("commit
  the ledger by hand" was never there; the *absence* of a ledger step was),
  `review-change`'s persist note that an uncommitted append stops the tree,
  `TURN_CONTRACT.md`'s box 5 and `LABELS.md`'s missing triage-state row.

## Surfaces

- `packages/agentic-workflow`
- `packages/pi-agentic-workflow`
- `scripts`
- `skills`
- `docs`

## Retirements

- The implicit "a session commits the ledger it cannot see" convention: no
  surface ever stated it, and `rg -n 'TIER_COST.md' skills/` shows only the
  ownership map citing it as a ledger — the replacement is `S2`–`S4`'s
  mechanical points, cited from `LEDGERS.md`'s new block.
- `needs-triage`'s permanence: the label keeps its meaning, its *absence* after
  a verdict is the new state, so no token is removed — only the missing exit
  rule is added.
- Nothing else is removed: `review-findings.md`'s writers, the
  `ledger-ownership@1` rows and the seven truth classes stay exactly as they are.

## Non-goals

- **No automatic push from teardown** — the issue's own non-goal: it would
  either bypass the mandated pre-push gate or launch it at every session close.
- No new schema vocabulary: the class is a crate constant consumed by code, and
  no skill grammar orders it token by token (the LEDGERS.md block is prose the
  parity suite reads, not a machine vocabulary).
- No change to `ledger-ownership@1`'s writer rows: this unit adds *when* a
  declared writer's bytes are committed, never *who* may write them.
- No review-machinery run on this change (the local workflow's rule), so the
  exemption in `S5` is proved by the engine suite, not by a review pass here.

## Risk tier

- **Tier** — `standard` · **Task Size** — `medium`
- **Named high-risk item** — none — not a high-tier unit. `runner ceremony tier
  classify` reads the diff at verification time; the verdict copied here is the
  classify answer over `packages/`, `scripts/` and `skills/` (P9 re-runs it).

## Future

none

## Future cost

- **A new machine-owned ledger declares itself once** — in
  `MACHINE_LEDGER_CLASSES`, its `LEDGERS.md` row and its `.gitattributes` class;
  the parity suite refuses a one-sided addition. Binds whoever adds one.
- **A new class whose writer is machinery must name its commit point** — the
  `zone` cell decides whether the ledger is swept mechanically or committed by
  its writing step. Binds future ledger authors.

## Applicable tests

- `bun test packages/agentic-workflow/test/machine-ledger-commit.test.mjs`
- `bun test packages/agentic-workflow/test/turn-contract.engine.test.mjs`
- `bun test packages/pi-agentic-workflow/test/ledger-commit.test.mjs`
- `bun test scripts/machine-ledger-policy.test.mjs`
- `bun test scripts/local-gate.test.mjs`

## Known pre-existing issues

- `docs/features/494-telemetry-by-turn/SPEC.md` carries no `## Features` row in
  the roadmap at some base revisions (`roadmap-settle` red). `does-not-affect`
  this unit: the row exists at this base (`| 494 | telemetry-by-turn | done …`),
  and the gate's roadmap step is green at the cut.
- `scripts/findings-corpus.test.mjs` pins the corpus at 1173 rows and the tree
  carries 1178 — `does-not-affect` this unit: reproduced byte-identically at the
  base checkout (`/tmp/base-727`, `main` @ `022769f8b`, 33 pass / 1 fail), so it
  is a stale data receipt on `main`, not this diff's row. Routed to the owner;
  not repaired here because a count pin belongs to the unit that added the rows.
- `scripts/workflow-doctor.test.mjs` fails three battery cases at the base
  checkout too (the `AGENTIC_WORKFLOW_SKILLS_ROOT` defect fix #729 is open on):
  `does-not-affect` this unit.
- `scripts/red-first.test.mjs`, `scripts/ceremony-findings-ledger.test.mjs`,
  `scripts/phase-lint.test.mjs` and `packages/pi-agentic-workflow/test/workflow-tools.test.mjs`
  are wall-clock red under load (a 5s per-test or 120s suite bound): each passes
  alone, both package suites pass in full when the box is quiet (pi 1120/0), and
  each fails identically at the base checkout — `does-not-affect`, environmental.
- `packages/agentic-workflow/test/doc.structure.test.mjs` exceeds its declared
  240s suite bound on this tree (280s standalone, 240s SUITE TIMEOUT under the
  runner) while its allowlist records 163.2s measured 2026-11-21 — the document
  tree grew since; `does-not-affect` this unit's suites, and the bound is a data
  receipt for the tree's owner, not for this diff.
- The `feat-728-gate-receipt-producer` worktree and this unit's own worktree
  directory were removed by an unidentified actor during this session
  (2026-11-26 16:18 UTC). `does-not-affect` this unit's content: the branch was
  at `main` with no commits, so nothing was lost; the worktree was restored with
  `git worktree add` and the incident is recorded in `## Log`.

## Tasks

- P1 — freeze this unit doc, its two ledgers, the fix-index row and the changeset (validator: `bun packages/agentic-workflow/bin/agentic-workflow.mjs verify docs/fix/727-machine-ledger-commits/SPEC.md` exits 0)
  (Implements: S1)
  - Relevant files: docs/fix/727-machine-ledger-commits/SPEC.md, docs/fix/727-machine-ledger-commits/planning-evidence.md, docs/fix/727-machine-ledger-commits/planning-obligations.md, docs/fix/727-machine-ledger-commits/decisions.md, .changeset/727-machine-ledger-commits.md
- P2 — land the five red-first suites before any implementation (validator: `bun test scripts/machine-ledger-policy.test.mjs` exits 1 naming the missing block)
  (Implements: S8)
  - Relevant files: packages/agentic-workflow/test/machine-ledger-commit.test.mjs, scripts/machine-ledger-policy.test.mjs, packages/pi-agentic-workflow/test/ledger-commit.test.mjs
- P3 — the crate's one machine owner and its command (validator: `bun test packages/agentic-workflow/test/machine-ledger-commit.test.mjs` exits 0)
  (Implements: S3, S6)
  - Relevant files: packages/agentic-workflow/src/machine-ledger/index.mjs, packages/agentic-workflow/src/telemetry/commit.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/runner/help.mjs
- P4 — the two writers that append now commit what they appended (validator: `bun test packages/agentic-workflow/test/machine-ledger-commit.test.mjs` exits 0 with the session-close and reconstruct cases)
  (Implements: S3)
  - Relevant files: packages/agentic-workflow/src/session-close/index.mjs, packages/agentic-workflow/src/telemetry/reconstruct.mjs
- P5 — box 5 exempts the class (validator: `bun test packages/agentic-workflow/test/turn-contract.engine.test.mjs` exits 0)
  (Implements: S5)
  - Relevant files: packages/agentic-workflow/src/turn-contract.mjs
- P6 — pi's teardown commits through that command (validator: `bun test packages/pi-agentic-workflow/test/ledger-commit.test.mjs` exits 0)
  (Implements: S2)
  - Relevant files: packages/pi-agentic-workflow/src/ledger-commit.ts, packages/pi-agentic-workflow/src/extension/telemetry-wiring.ts, packages/pi-agentic-workflow/src/extension/index.ts
- P7 — the gate's prelude commits before the pool (validator: `bun test scripts/local-gate.test.mjs` exits 0)
  (Implements: S4)
  - Relevant files: scripts/local-gate.mjs, scripts/local-gate.test.mjs
- P8 — the policy, the label exit and every consumer that cites them (validator: `bun test scripts/machine-ledger-policy.test.mjs` exits 0)
  (Implements: S6, S7)
  - Relevant files: skills/pre-execution-review/references/LEDGERS.md, skills/triage-issue/references/LABELS.md, skills/triage-issue/references/ISSUE_PROCESS.md, skills/review-change/references/PERSIST_AND_DECIDE.md, skills/orchestration-envelope/references/TURN_CONTRACT.md, AGENTS.md, docs/workflow/GATE_INVENTORY.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json, packages/agentic-workflow/README.md, docs/workflow/CLI.md
- P9 — verify: re-run every validator, the differential, the projection and the gate (validator: `bun scripts/check-skill-context.mjs --documents` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8)

The link grammar (`task-spec-link@1`) is owned by the unit-doc template.

## Triaged steps

`standard` tier, fix lane, all four asks in one unit. The machine's step list is
`implement → verify`: the local workflow substitutes the frozen ledgers for the
lane's plan step, and no triage route is re-derived here.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-26, the issue, verbatim:
  ```
  Make every machine-owned ledger write commit without the model and without the
  producing session, and fix the two review-lifecycle defects the same
  investigation surfaced: reviews failing on an uncommitted TIER_COST.md, and
  needs-triage labels never leaving triaged issues.

  Surfaces: telemetry-wiring.ts, session-telemetry.ts, telemetry-sinks.ts,
  session-close/index.mjs and/or the crate's telemetry command family,
  scripts/local-gate.mjs and the pre-push hook contract,
  skills/pre-execution-review/references/LEDGERS.md, review-change (+
  review-verify) dirty-tree verdict wording, skills/triage-issue/references/
  LABELS.md and ISSUE_PROCESS.md, docs/workflow/GATE_INVENTORY.md.
  ```
- **L2** — 2026-11-26, the apply directive, verbatim: `Apply to this repository: issue #727`, with the local workflow's rules (inline application, ledgers frozen before code, test-first, differential, the owner as external verifier).
- **D1** — 2026-11-26, design docket: the binary under `.gitattributes` classes are the class, committed by one module; a ledger's commit happens in a zone, not per file (D2), and the pi extension spawns the crate command rather than re-implementing git. Full rows in `decisions.md`.
- **E1** — 2026-11-26, `git worktree list` · exit 0 — this unit's worktree and `feat-728-gate-receipt-producer` were deleted and de-registered by an unidentified actor at 16:18 UTC; the branch was at `main` (no commits), so nothing was lost. Restored with `git worktree add .worktrees/feat-727-machine-ledger-auto-commit feat-727-machine-ledger-auto-commit` · exit 0 · `HEAD is now at 022769f8b`.
- **D2** — 2026-11-26, the incident disclosure rule applied: the wipe is reported to the owner in the handoff, never silently repaired beyond restoring this unit's own worktree.

- **E2** — 2026-11-26, `bun test packages/agentic-workflow/test/machine-ledger-commit.test.mjs` at `50229f0b` · exit 0 · 10 pass / 0 fail (the class table, the path-scoped commit, the clean and locked no-ops, `session-close close`, both `reconstruct write` cases).
- **E3** — 2026-11-26, `bun test packages/agentic-workflow/test/turn-contract.engine.test.mjs` at `50229f0b` · exit 0 · 37 pass / 0 fail; the four box-5 cases are the exemption, the untracked fragment, the human-uncommitted file and the `ahead-of-remote` guard.
- **E4** — 2026-11-26, `bun test packages/pi-agentic-workflow/test/ledger-commit.test.mjs` at `50229f0b` · exit 0 · 5 pass / 0 fail (teardown argv and runtime, once per session, absent crate, failed spawn, disabled switch).
- **E5** — 2026-11-26, `bun test scripts/local-gate.test.mjs` at `50229f0b` · exit 0 · 65 pass / 0 fail (the prelude commits the ledger alone, `--dry-run` plans it and writes nothing).
- **E6** — 2026-11-26, `bun test scripts/machine-ledger-policy.test.mjs` at `50229f0b` · exit 0 · 8 pass / 0 fail (three-source parity, the injected one-sided class, the prelude declaration, the triage-state exit).
- **E7** — 2026-11-26, `bun test scripts/ledger-ownership.test.mjs` at `50229f0b` · exit 0 · 15 pass / 0 fail — the map's writers are unchanged.
- **E8** — 2026-11-26, red-first proof: `bun test scripts/machine-ledger-policy.test.mjs` and the crate suite exited 1 with `Cannot find module '../packages/agentic-workflow/src/machine-ledger/index.mjs'` at `2dcebf5cb`, the commit that landed the suites alone (engine 4 fail / 33 pass, local-gate 2 fail / 63 pass with the module absent).
- **E9** — 2026-11-26, differential against `/tmp/base-727` (`main` @ `022769f8b`, `bun install --frozen-lockfile`): `telemetry reconstruct stats` and `ledger-provenance --check` byte-identical; `session-close render` differs only by its UTC timestamp; `turn-contract` on a clean tree byte-identical; a `note.txt` modification fails `box5: dirty-tree` identically on both sides, while a `docs/LOGS.md` modification fails at base and passes at head — the change S5 asks for, and nothing else moved.
- **G1** — 2026-11-26, HEAD `50229f0b`, `bun scripts/local-gate.mjs --skip-network --jobs 4` · offline steps 16/17 after the two fixes below; `root-suite` exits 1 on the base-reproduced `findings-corpus` pin (1173 vs 1178) and, under load, on `red-first`/`ceremony-findings-ledger`'s 5s bounds — all reproduced at the base checkout and disclosed under Known pre-existing issues; `crate-suite-bun`, `crate-suite-node`, `schema-build`, `docs-generated-projection`, `skill-context-budgets`, `journal-carrier-check`, `log-immutability`, `push-identity`, `secret-scan`, `temp-hygiene`, `tmp-gc`, `worktree-guard`, `rigidity-review`, `dimension-regression`, `version-parity-content` and the `machine-ledger-commit` prelude exit 0.
- **G2** — 2026-11-26, HEAD `50229f0b`, `bun scripts/check-skill-context.mjs` / `--documents` / `--routes` · exit 0 · 33 skills PASS, 7 documents PASS, 14 routes PASS after the two declared re-bases (the guide's one new machine row; the review-change routes' exemption line).
- **G3** — 2026-11-26, HEAD `50229f0b`, `bun scripts/docs-generate.mjs --check` · exit 0 · 3 files / 0 stale / 0 orphaned, roadmap unchanged.
- **G4** — 2026-11-26, HEAD `50229f0b`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs phase-lint docs/fix/727-machine-ledger-commits/SPEC.md` · exit 0 · all nine phases PASS.
- **G5** — 2026-11-26, HEAD `50229f0b`, `bun packages/agentic-workflow/bin/agentic-workflow.mjs prose-gate-inventory` · exit 0 · `verdict: PASS` (the new surface claimed, the new gate row cited); `test-obligation-tags` · exit 0 · 145 suites / 0 findings.
- **G6** — 2026-11-26, HEAD `50229f0b`, `rg -n 'review-change|audit-pr|fold-findings' docs/fix/727-machine-ledger-commits/` matches only this unit's prohibition and its citations — no review pack, no audit and no fold cycle ran on it (criterion 1).

- **G7** — 2026-11-26, HEAD `027f8ef79`, `bun run test` in `packages/agentic-workflow` · every suite green except `test/doc.structure.test.mjs`, which hits the runner's declared 240s suite bound (280s standalone on this tree; see Known pre-existing issues) — base-affected, not this diff.
- **G8** — 2026-11-26, HEAD `027f8ef79`, `bun run test` in `packages/pi-agentic-workflow` · exit 0 · **1120 pass / 0 fail across 95 files**, the new `ledger-commit` suite included (5/0) and the `log-session-command` fixture extended with the class module `close` now imports.
- **G9** — 2026-11-26, HEAD `027f8ef79`, `bun scripts/run-root-suite.mjs` (no bail) · **four reds, each reproduced byte-identically at the base checkout**: `findings-corpus` (pin 1173 vs tree 1178), `workflow-doctor` (the fix #729 battery defect), `red-first` (5s per-test bound) and `phase-lint` (120s suite bound under load; 45.9s standalone). Every other root suite exits 0.
- **G10** — 2026-11-26, correction: G1's claim that `crate-suite-bun`/`crate-suite-node` exited 0 in that gate run is superseded — the two steps were *skipped* there (root-suite failed first under the dependency graph), and their real results are G7/G8, run directly at the same head.

- **P1** — 2026-11-26, the budget re-pins were re-applied without re-encoding the manifest (the first hand edit escaped every non-ASCII character, 287 lines of churn for 20 of substance) · `f97b09580`.

## Next

P2: land the five suites red, then implement P3.

## References

- Issue [#727](https://github.com/gtrabanco/agentic-workflow/issues/727).
- `skills/pre-execution-review/references/LEDGERS.md` — the ownership map this
  unit's policy sits beside.
- `packages/agentic-workflow/src/session-close/index.mjs` — the established
  mechanical-commit pattern ("commits it alone", #182) this unit generalizes.
- Issue #498, #630 — the `shared-merge` classes and the telemetry class the
  exemption reuses.

## Branch

`feat/727-machine-ledger-auto-commit`

## Depends on

none

## Regression scope

| Scenario | Verifier |
|---|---|
| `session-close close` still refuses a rewritten log, and still commits the log alone | `bun test scripts/session-close.test.mjs` exits 0 |
| `telemetry reconstruct write` still merges only the sessions a store lacks, and its refusal writes nothing | `bun test packages/agentic-workflow/test/telemetry-reconstruct.test.mjs` exits 0 |
| box 5 still fails a foreign dirty file, and still orders `dirty-tree` before `ahead-of-remote` | `bun test packages/agentic-workflow/test/turn-contract.engine.test.mjs` exits 0 |
| the `ledger-ownership@1` map and the fix template still agree in both directions | `bun test scripts/ledger-ownership.test.mjs` exits 0 |
| the gate still runs its steps, its budgets and its projection | `bun scripts/local-gate.mjs --only docs-generated-projection,schema-build,workspace-install` exits 0 |
