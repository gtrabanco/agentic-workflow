---
type: fix
scope: xs
ac-hash: 60957127ffb6b514d2df8ddc5ec1a8b070a22ff2961017b26cd31300bcc134ad
---

# fix/534-prose-gate-worktree-scan

> The prose-gate inventory's `findHomes()` walk skips only `.git` and
> `node_modules`, so any unit worktree parked at the repository's own
> designated `.worktrees/` location (AGENTS.md → Worktree creation) carries a
> full guide-layer checkout whose `docs/workflow/GATE_INVENTORY.md` copy is
> reported as a second home — `multiple-homes` — and every push from `main`
> dies at `root-suite` while a unit waits on a fix. The walk skips
> `.worktrees/` the same way it skips `.git`, and the suite pins the rule with
> a fixture: a worktree checkout is not a home.

```text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#534` — FIX: prose-gate-inventory scans .worktrees/ — a parked worktree blocks
every push from main. The PR must close it via `Closes #534` in the body (the
commit carries the footer).

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. The
frozen request is L1; every later decision cites its `S#`.

**S1 — The walk skips `.worktrees/` like `.git`.**
> `findHomes()` must skip `.worktrees/` the same way it skips `.git` and `node_modules`, and the suite must pin that behavior with a fixture (a `.worktrees/` copy inside a throwaway tree is not a home).

**S2 — A parked worktree checkout is not a second home.**
> A worktree checkout parked at the repo's designated `.worktrees/` location is not a second home of the inventory.

**S3 — The gate stays usable while a unit worktree waits.**
> `bun scripts/local-gate.mjs` fails at `root-suite` (`scripts/prose-gate-inventory.test.mjs`) while any worktree parked under `.worktrees/` exists — the gate that should verify the push range instead refuses a legitimate repo state the worktree procedure itself produces.

## Impact

- `scripts/prose-gate-inventory.mjs` — `findHomes()`'s skip set and its doc
  comment are the only executable lines that move. The marker grammar, the
  row grammar, `inspect()`'s error vocabulary and every other export are
  untouched; a second copy anywhere **outside** `.worktrees/` is still refused
  as `multiple-homes`.
- `scripts/prose-gate-inventory.test.mjs` — the suite gains one fixture case;
  every pre-existing case keeps its exact assertions, including
  `multiple-homes` for a `docs/features/` copy and the live-head one-home
  check (which is what currently fails on this tree).
- Every unit lane that parks a worktree under `.worktrees/` — the gate stops
  refusing the repository's own documented layout. No skill, package or
  template surface carries the walk; no consumer outside this repo reads
  `findHomes()`.

## Retirements

Nothing is retired — the change is two lines of skip-set and one fixture case.

`rg -c 'findHomes' scripts/prose-gate-inventory.mjs` → unchanged (3 call sites
before, 3 after); no surface, token or narrative is removed.

## Non-goals

- No gitignore-aware walk: `findHomes()` accepts an arbitrary root (the
  fixture trees in the suite are not git repositories), so the skip set stays
  a literal set — general gitignored-path skipping is a different unit with a
  different fixture strategy.
- No relocation of the parked worktrees: the two waiting branches
  (`feat/352-…`, `feat/438-…`) stay exactly where the worktree procedure put
  them.
- No change to the `multiple-homes` semantics for guide-layer, unit-doc or
  template copies — only the checkout location is exempted.

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood · contained · resumable-from-diff`
- **Named high-risk item** — none — not a high-tier unit

`bun scripts/ceremony.mjs tier classify --base main` at cut: `empty-change`
fail-closed to `standard` (no paths changed yet); the verdict is re-run on the
implemented diff at verification (E-line below) and both runs agree on
`standard`.

## Future

- **2026-11-13, open** — "teach the walk to skip gitignored directories"
  generally (the #505 remedy's broader half): a real candidate, but it needs a
  gitignore reader and a non-git fixture strategy — owner decision, never a
  default of this unit.
- **2026-11-13, open** — the path-protection guard's records discovery reads
  only the *hosting* checkout's `docs/{features,fix}/*/decisions.md`
  (`packages/pi-agentic-workflow/src/extension/index.ts`), so a session working
  from a parked worktree cannot have its own unit's records discovered (L3's
  temporary copy was the workaround). A real product gap for the worktree
  workflow #505 shipped — owner decision; touches the extension, not this
  unit's scripts.

## Future cost

- A future change that moves the repository's designated worktree location
  away from `.worktrees/` (AGENTS.md → Worktree creation) must update the
  skip set and the fixture case in the same PR — the two are pinned to each
  other by the live-head one-home check.

## Applicable tests

- `bun test scripts/prose-gate-inventory.test.mjs` — the inventory's sibling
  suite, extended red-first with the `.worktrees`-checkout case (S1, S2).
- `bun scripts/local-gate.mjs` — the whole gate on the implemented diff (S3).

## Known pre-existing issues

- The two parked worktrees `.worktrees/feat-352-new-feature-distributable-ceremony-runner`
  and `.worktrees/feat-438-new-feature-residual-classify` reproduce the defect
  on the base commit — that reproduction **is** this unit's frozen failure, not
  a separate issue; the fix turns their presence into a green state.
- The session that diagnosed this defect initially misread the two parked,
  clean, pushed worktrees as stale and removed them (restored byte-identical
  afterwards from the intact branch refs) — does-not-affect: no commit, ref or
  remote state changed; the episode is recorded in the Log (L1, L2) as the
  context that produced the issue.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

- **AC-S1** — `findHomes()`'s walk skips `.worktrees/` the way it skips
  `.git` and `node_modules`, and the suite pins the rule with a fixture: a
  `.worktrees/<unit>/docs/workflow/GATE_INVENTORY.md` copy inside a throwaway
  tree yields exactly one home and zero errors. Check: the
  `a worktree checkout parked in .worktrees/ is not a second home` case in
  `scripts/prose-gate-inventory.test.mjs` passes.
- **AC-S2** — A worktree checkout parked at the repo's designated location is
  not a second home, while a copy anywhere else still is. Check: the live-head
  `the block has exactly one home in the tree` case passes on this tree
  (two parked worktrees present, `findHomes(root)` returns exactly
  `docs/workflow/GATE_INVENTORY.md`), and the pre-existing
  `a second copy of the block anywhere in the tree fails as multiple-homes`
  fixture case still passes unchanged.
- **AC-S3** — The gate is green with the parked worktrees present. Check:
  `bun scripts/local-gate.mjs` exits 0 on this tree (the two waiting
  worktrees in place), with `prose-gate-inventory` and `test-impact` both
  answering cleanly.

## Tasks

- P1 — RED corpus: extend `scripts/prose-gate-inventory.test.mjs` with the `.worktrees`-checkout fixture case; run at base and observe the new case red (`multiple-homes`) before the implementation commit (validator: `bun test scripts/prose-gate-inventory.test.mjs` exits non-zero with the new case failing before the implementation commit)
  (Implements: S1, S2)
  Relevant files: scripts/prose-gate-inventory.test.mjs
- P2 — walk fix: `findHomes()` skip set gains `.worktrees`, doc comment states the checkout exemption (validator: `bun test scripts/prose-gate-inventory.test.mjs` exits 0)
  (Implements: S1, S2)
  Relevant files: scripts/prose-gate-inventory.mjs
- P3 — registration and verification: ROADMAP `## Fixes` row through the writer, `docs/generated` projection re-rendered by its emitter, session log entry, obligations closed, local gate green (validator: `bun scripts/docs-generate.mjs --check` exits 0; `bun scripts/local-gate.mjs` exits 0)
  (Implements: S3)
  Relevant files: docs/ROADMAP.md, docs/generated/units.md, docs/LOGS.md

### Planning evidence

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | repository | the walk's skip set is exactly `{".git", "node_modules"}` and the doc comment declares the whole-tree scope | `scripts/prose-gate-inventory.mjs` `findHomes()` (`const skip = new Set([".git", "node_modules"])`) | current | O1 |
| PE-002 | issue-forensics, live-reproduced 2026-11-13 | a parked full-checkout worktree under `.worktrees/` carrying `docs/workflow/GATE_INVENTORY.md` produces `multiple-homes` and fails both the suite and `test-impact.mjs` | the gate run recorded as E1 (`prose-gate-inventory: - — multiple-homes — .worktrees/feat-352-…/…, .worktrees/feat-438-…/…, docs/workflow/GATE_INVENTORY.md`) | current | O1, O2 |
| PE-003 | repository, precedent | the remedy was already scoped by #505's verification: "teach the walk to skip gitignored directories, or relocate the open worktree — another unit's decision" | `docs/fix/505-worktree-prune/SPEC.md` § Known pre-existing issues, second bullet | current | S1, Non-goals |
| PE-004 | repository | `findHomes()` accepts an arbitrary root and the suite's fixtures are plain temp directories, not git repositories — a literal skip set is the fixture-compatible shape | the suite's `fixture()` helper (plain `mkdtempSync` trees, no `.git`) | current | O1, Non-goals |
| PE-005 | repository | the designated worktree location is `.worktrees/<flat-name>` by AGENTS.md → Worktree creation (unit #505's own change) and `.worktrees/` is gitignored | `AGENTS.md` § Worktree creation steps 2–4; the repo's `.gitignore` | current | S2, Future cost |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | S1, S2 | the walk skips `.worktrees/` (PE-001, PE-004) and the suite pins the rule with a fixture (PE-002): a `.worktrees/` copy inside a throwaway tree is one home and zero errors, while every other second copy stays `multiple-homes` | P1, P2 | P1, P2 | scripts/prose-gate-inventory.mjs, scripts/prose-gate-inventory.test.mjs | `bun test scripts/prose-gate-inventory.test.mjs` exits 0 with the new fixture case green and every pre-existing case unchanged; the red run at base is recorded before the green commit | the E lines naming the red run and the green run | verified (E3, E4) |
| O2 | S2 | on the live tree with the two parked worktrees present, `findHomes(root)` returns exactly `docs/workflow/GATE_INVENTORY.md` — the one-home invariant holds at the real head, not only in fixtures | P2 | P2 | scripts/prose-gate-inventory.mjs | the live-head `the block has exactly one home in the tree` case passes on this tree | the E line with the suite exit | verified (E4, E6) |
| O3 | S3 | the gate is usable while a unit worktree waits: the local gate is green with the parked worktrees in place, and `test-impact.mjs --base origin/main` answers instead of erroring | P3 | P3 | scripts/prose-gate-inventory.mjs | `bun scripts/local-gate.mjs` exits 0; `bun scripts/test-impact.mjs --base origin/main` exits 0 | the G line with the gate exit and the E line with the test-impact verdict | verified (G1) |
| O4 | S1 | documentation and state ship in the same change: ROADMAP `## Fixes` row through the writer, `docs/generated` projection re-rendered by its emitter (never hand-written), session log entry, and the completed obligations ledger | P3 | P3 | docs/ROADMAP.md, docs/generated/*, docs/LOGS.md | `bun scripts/docs-generate.mjs --check` exits 0 after the emitter run | the E line with the check exit | verified (E2, P3) |

## Path protection

The plan declares the protected set this unit authors (the frozen suite is
edited with `justification` rows, never a quiet relaxation). The records live
in this folder's [`decisions.md`](decisions.md).

```text
path-protection-plan@1
freeze-after: P2
kind | path | justification
not-created | scripts/prose-gate-inventory.test.mjs | the inventory's own sibling suite: P1 extends it with the .worktrees-checkout fixture case — every pre-existing case keeps its exact assertions
not-created | scripts/prose-gate-inventory.mjs | the walk's skip set is the unit's own implementation surface: P2 adds one literal entry and updates the doc comment — no grammar, error vocabulary or other export moves
```

## Triaged steps

> The owner's apply workflow substitutes its ledger freeze for the lane's plan
> step; the Tasks section above is the authoritative step list for this inline
> unit. `bun scripts/unit-route.mjs 534-prose-gate-worktree-scan` resolves this
> unit's route from this ledger (execute — a known unit with no open row).

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-13, the owner's words, verbatim:
  ```
  Where are the worktrees? The two "stale" in your opinion where waiting for a fix to be able to continue.
  ```
- **L2** — 2026-11-13, the owner's route decision, verbatim: "Fix the scanner (recommended)" — branch off `main`, tests first (worktree copy ≠ second home), then the fix in `findHomes()`; one PR.
- **P1** — 2026-11-13, ledger freeze (this document + decisions.md + ROADMAP row) before the first line of code.
- **E1** — 2026-11-13, `bun scripts/ceremony.mjs tier classify --base main` · exit 0 · `tier: standard` · `reason_kind: executable-content` (paths: `docs/fix/534-prose-gate-worktree-scan/` only — the doc itself; re-run on the implemented diff at verification).
- **E2** — 2026-11-13, `bun packages/agentic-workflow/bin/agentic-workflow.mjs roadmap fixrow docs/ROADMAP.md … --expect 7e776990` · exit 0 · `before: 7e776990` → `after: 862e0198`, `ok: true`; `bun scripts/docs-generate.mjs --check` · exit 0 · `Files: 3 checked · 0 missing · 0 stale · 0 orphaned — verdict: PASS`.
- **L3** — 2026-11-13, ledger amendment before the first code commit (self, pre-implementation): the path-protection guard reads the records corpus from the *hosting* checkout's `docs/{features,fix}/*/decisions.md` (`packages/pi-agentic-workflow/src/extension/index.ts` `collectRecordTexts(ctx.cwd)`), so while this branch is checked out at `.worktrees/fix-534-prose-gate-worktree-scan` the records were temporarily copied there, untracked, for the guard to discover; the copy was removed after the protected edits and never committed anywhere. The gap (a worktree session's records are undiscoverable from the session root) is recorded as the unit's Future candidate; the prefixed-spelling escape records in `decisions.md` are the durable half of this note.
- **E3** — 2026-11-13, RED at base, `bun test scripts/prose-gate-inventory.test.mjs` · exit 1 · `(fail) a worktree checkout parked in .worktrees/ is not a second home` — the new fixture case fails exactly as the issue's frozen failure predicts; every pre-existing case still passes at base.
- **E4** — 2026-11-13, GREEN, `bun test scripts/prose-gate-inventory.test.mjs` · exit 0 · `22 pass · 0 fail` (the new case green, every pre-existing case unchanged, including `a second copy … fails as multiple-homes`).
- **E5** — 2026-11-13, `bun scripts/ceremony.mjs tier classify --base main` re-run on the implemented diff · exit 0 · `tier: standard`, unchanged from E1.
- **E6** — 2026-11-13, the branch code against the real head: `PROSE_GATE_REPO=/home/agent/projects/agentic-workflow bun test scripts/prose-gate-inventory.test.mjs` (run from the branch checkout) · exit 0 · `22 pass · 0 fail` — `findHomes()` returns exactly one home on the hosting checkout with 4 worktrees registered (`feat/352-…`, `feat/438-…`, `fix/534-…` parked under `.worktrees/`). O2's live-tree half.
- **G1** — 2026-11-13, `bun scripts/local-gate.mjs` (branch checkout, both parked worktrees in place) · exit 0 · `local-gate: PASS — 17 step(s) in 168s`; `bun scripts/test-impact.mjs --base origin/main` · exit 0 · `verdict: empty`.
- **P3** — 2026-11-13, ROADMAP row 521 settled to `done · #523` through the writer (CAS `862e0198` → `e0c8cca6`) — the settlement gate's own demand, pre-existing red on main (193 unit docs checked · verdict: PASS after); projection re-rendered by its emitter; journal fragment written.
- **P4** — 2026-11-13, branch pushed and PR opened against `main`.

## Next

The PR review and merge — https://github.com/gtrabanco/agentic-workflow/pull/535 — then the owner settles the two parked worktrees' merge order afterwards.

## References

- Issue: [#534](https://github.com/gtrabanco/agentic-workflow/issues/534) (closed by the PR)
- Precedent: `docs/fix/505-worktree-prune/SPEC.md` — the worktree home that created the `.worktrees/` layout and the first record of the remedy
- Owner: `scripts/prose-gate-inventory.test.mjs` + `scripts/prose-gate-inventory.mjs` (the `self-inventory` gate row)

## Branch

`fix/534-prose-gate-worktree-scan`

## Depends on

None — independent.

## Regression scope

- The `multiple-homes` refusal for guide-layer, unit-doc and template copies
  keeps its exact semantics: the pre-existing
  `a second copy of the block anywhere in the tree fails as multiple-homes`
  fixture case must keep passing unchanged (`bun test
  scripts/prose-gate-inventory.test.mjs` exits 0).
- Every other root-suite suite is unaffected: `bun scripts/local-gate.mjs`
  exits 0 on the implemented diff.
