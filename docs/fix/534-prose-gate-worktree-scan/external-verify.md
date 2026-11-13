# External verify — fix/534-prose-gate-worktree-scan

2026-11-13 · **full verdict** — no prior `EXTERNAL VERIFY` block anywhere in this
unit dir, so nothing is a delta. Read-only run: no commit, no push, no branch, no
forge mutation, no edit to the change under review. Base-side proof ran in
`mktemp -d` scratch (`git archive <sha> | tar -x`), removed afterwards. The only
mutating paths exercised were the change's own fixture writes (self-cleaning
`mkdtemp` dirs) and the pre-existing gate's declared generators —
`git status --porcelain` empty before and after every step.

## Command → observed

| command | observed |
|---|---|
| `bun test scripts/prose-gate-inventory.test.mjs` (branch) | exit 0 · `22 pass · 0 fail` |
| `PROSE_GATE_REPO=/home/agent/projects/agentic-workflow bun test scripts/prose-gate-inventory.test.mjs` (branch vs. the real hosting checkout, 4 worktrees registered) | exit 0 · `22 pass · 0 fail` |
| scratch `git archive afe265c2` (base implementation + the new case) → `bun test scripts/prose-gate-inventory.test.mjs` | exit 1 · `21 pass · 1 fail` — `(fail) a worktree checkout parked in .worktrees/ is not a second home` (E3's red reproduces exactly) |
| scratch `git archive b012b31d` (base) → `PROSE_GATE_REPO=<hosting> bun test scripts/prose-gate-inventory.test.mjs` | exit 1 · `18 pass · 3 fail` — base side of the frozen `multiple-homes` failure |
| `bun scripts/local-gate.mjs` | exit 0 · `local-gate: PASS — 17 step(s) in 175s` |
| `bun scripts/test-impact.mjs --base origin/main` (branch) | exit 0 · `TEST IMPACT — targeted` · changed 9 · executable 2 · suites `scripts/prose-gate-inventory.test.mjs` — **G1 records `verdict: empty`** |
| `bun scripts/test-impact.mjs --base origin/main` (hosting checkout on `main`) | exit 0 · `TEST IMPACT — empty` · changed 2 · executable 0 — the only state where G1's value reproduces |
| `bun scripts/test-impact.mjs --base origin/main` (parked `.worktrees/feat-352-…`, `.worktrees/feat-438-…`) | exit 0 · `targeted` · changed 272 / 134 — PE-002's "fails `test-impact.mjs`" never reproduces |
| `bun scripts/docs-generate.mjs --check` | exit 0 · `Files: 3 checked · 0 missing · 0 stale · 0 orphaned` · `verdict: PASS` |
| `bun scripts/ceremony.mjs tier classify --base main` | exit 0 · `tier: standard` · `reason_kind: executable-content` (E5 reproduces) |
| `rg -c 'findHomes' scripts/prose-gate-inventory.mjs` | `2` at head and `2` at base (the Retirements line states 3) |

## Blockers

**B1 — `docs/fix/534-prose-gate-worktree-scan/SPEC.md:170` (PE-002)**
Claim: a parked full-checkout worktree "produces `multiple-homes` and fails both
the suite **and `test-impact.mjs`**", source cell "the gate run recorded as E1".
Reproducer: `bun scripts/test-impact.mjs --base origin/main` exits **0** in every
worktree-present checkout (table above) — the suite half reproduces at base
(scratch run, 3 fail), the `test-impact` half never does; the empty-diff refusal
the issue's symptom came from fires on any clean checkout with no push range, not
on a parked worktree. Source: `E1` (`SPEC.md:218`) is the tier-classify line, and
no gate run carrying the quoted `multiple-homes — .worktrees/feat-352-…` output
exists anywhere in the tree (`rg -uu "multiple-homes — .worktrees"` hits only
this row) — the quoted block is issue #534's reproducer text.
Base-vs-head: `b012b31d` carries no PE-002; the row is new bytes on this branch.
Smallest action: correct the claim cell (drop or restate the `test-impact` half)
and the source cell (cite issue #534's reproducer block), one text/ledger repair
batch → `/aw-local-apply`.

**B2 — `docs/fix/534-prose-gate-worktree-scan/SPEC.md:225` (G1), obligation
`O3` (`SPEC.md:181`)**
Claim: `bun scripts/test-impact.mjs --base origin/main` · exit 0 · **`verdict:
empty`**, recorded as O3's required evidence ("the E line with the test-impact
verdict"). Observed on the branch the line names: **`verdict: targeted`**
(2 executable paths, 1 suite). `empty` reproduces only in the hosting checkout on
`main` (changed 2, executable 0) — i.e. measured outside this branch. Exit 0 and
O3's prose outcome ("answers instead of erroring") do reproduce; the recorded
verdict value does not. The same wrong value is propagated to the PR body
("answers `empty` instead of erroring").
Base-vs-head: `b012b31d` has no G1 line; the false value is new on this branch.
Smallest action: re-run the command on the branch and replace `verdict: empty`
with the observed `verdict: targeted` (same one text/ledger batch; the PR body
line is the owner's call) → `/aw-local-apply`.

## Advisories

- **A1 — `SPEC.md:169` (PE-001):** freshness `current` on "the walk's skip set
  is exactly `{".git", "node_modules"}`" — superseded by this change
  (`{".git", "node_modules", ".worktrees"}`). Planning evidence by function
  describes the pre-change state that grounds O1; precedent: #505's external
  verify carried the same PE-001 freshness as advisory A5.
- **A2 — `SPEC.md:86-89` vs `SPEC.md:218`:** the cut run is stated as
  `empty-change` in the Risk tier prose and as `executable-content` with
  `paths: docs/fix/534-…/` in E1. Both tuples reproduce — clean tree →
  `standard/empty-change`, untracked unit directory → `standard/executable-
  content` with exactly that directory path — but they cannot be one observation.
- **A3 — `SPEC.md:66`:** `rg -c 'findHomes' …` observed `2` before and `2`
  after, not the stated "3 call sites"; the substantive claim (unchanged) holds.
- **A4 — branch range:** `origin/main..HEAD` also carries two pre-existing local
  `main` log commits (`616443d7`, `0700c60b`) not authored by this unit; they
  ride the PR when it is pushed.

## Sibling sweep

Clean of any current-state surface asserting the old skip set. Surviving
mentions, all dated history or intentional before/after narrative, none a
current-truth claim: `docs/features/96-prose-gate-inventory/SPEC.md:381`
(2026-11-05 Log line), `docs/fix/505-worktree-prune/SPEC.md:141,183` (that
unit's frozen pre-existing-issue/AC), `docs/LOGS.md:5710` (append-only
journal), `docs/research/2026-11-12-input-quality-and-editing/README.md:119`
(dated note), `docs/fix/534-…/SPEC.md:9` + `docs/ROADMAP.md:193` (issue
statement then fix, in the same sentence). The one stale current-label mention
is PE-001's freshness cell → advisory A1.

## Completeness

`S1`, `S2`, `S3` all resolve to tasks carrying `(Implements: S#)` with
validators re-run green here: P1's red reproduced in scratch (exit 1, the named
case), P2 `bun test …` exit 0, P3 `docs-generate --check` exit 0 and
`local-gate` exit 0. Obligations `O1`, `O2`, `O4` verified with outcomes that
reproduce; `O3`'s validators re-run green but its recorded test-impact verdict
does not → blocker B2. Open ids: none beyond B1/B2.

```text
EXTERNAL VERIFY — base: b012b31d · head: 51cfc461
Blockers: 2 — (1) docs/fix/534-prose-gate-worktree-scan/SPEC.md:170, reproducer `bun scripts/test-impact.mjs --base origin/main` exits 0 in every worktree-present checkout and the cited E1 is not a gate run, base b012b31d has no PE-002; (2) docs/fix/534-prose-gate-worktree-scan/SPEC.md:225 (O3, SPEC.md:181), reproducer the same command on the branch answers `targeted`, not the recorded `empty` (the recorded value reproduces only on main), base b012b31d has no G1
Advisories: 4 — SPEC.md:169 PE-001 freshness `current` on the superseded skip set; SPEC.md:86-89 vs SPEC.md:218 one cut run stated with two different `reason_kind`s (both tuples reproduce, not as one observation); SPEC.md:66 `rg -c 'findHomes'` observed 2/2, stated 3/3; origin/main..HEAD carries two pre-existing local-main log commits (616443d7, 0700c60b)
Sibling sweep: clean — dated history only (96 SPEC L2, 505 SPEC known-issue/AC, LOGS.md journal, 2026-11-12 research note, the 534 issue statement and its ROADMAP row); no current-state gate, manifest, skill or doc asserts the old skip set; the one stale current label is PE-001 → advisory A1
Completeness: S1, S2, S3 resolved (P1/P2/P3 validators re-run green; P1's red reproduced in scratch) | open ids: none
Spot check: bun test scripts/prose-gate-inventory.test.mjs → match (reported `22 pass · 0 fail`, observed `22 pass · 0 fail`)
Verdict: NEEDS-DECISION (B1 PE-002 false test-impact claim + dangling E1 source; B2 G1/O3 recorded test-impact verdict does not reproduce)
```
