# External verification — fix/505-worktree-prune

Date: 2026-11-10

```text
EXTERNAL VERIFY — base: 15c152a1 · head: d257a867
Blockers: 3 —
  (B1) docs/fix/505-worktree-prune/SPEC.md:194-205 (Tasks) — S7 and S8 resolve to no
  task carrying `(Implements: S7)` / `(Implements: S8)`, and neither has a dated
  disposition. Reproducer: `node scripts/phase-lint.mjs docs/fix/505-worktree-prune/SPEC.md`
  → `spec-unlinked: S7 is implemented by no phase` · `spec-unlinked: S8 is implemented by
  no phase` · `verdict BLOCKED: lint-blocked`, exit 1 (every phase itself PASSes 6/6).
  Base-vs-head: the doc does not exist at 15c152a1 (`git cat-file -e 15c152a1:docs/fix/
  505-worktree-prune/SPEC.md` → fatal). Stability: the same command on
  docs/fix/493-bounded-test-execution/SPEC.md → verdict PASS, exit 0 — the tool is not
  the defect, this doc's coverage is. Smallest action: add the missing `(Implements:)`
  links (or a dated disposition for each) until phase-lint exits 0.
  (B2) docs/fix/505-worktree-prune/SPEC.md:201 (P4 validator) — the task still demands
  `rg -c 'worktree move' AGENTS.md` exits 1 (0 matches); observed exit 0, count 1
  (AGENTS.md:608, the recovery-path `git worktree move` the unit deliberately keeps).
  L2 (SPEC.md:265) narrowed only O1's validator and AC-S2's check — the P4 sibling kept
  the retired demand (F51/F53 class). Reproducer: `rg -c 'worktree move' AGENTS.md` →
  `1`, exit 0 against the declared exit 1. Base-vs-head: same doc-new-at-head evidence
  as B1; the count comes from this change's own AGENTS.md line. Smallest action: align
  P4's validator with L2 (`rg -c 'temp-worktrees' AGENTS.md` exits 1).
  (B3) docs/fix/505-worktree-prune/SPEC.md:177-179 (AC-S5 Check) and SPEC.md:204 (P5
  validator) — both declare `bun scripts/local-gate.mjs --skip-network` exits 0;
  observed exit 1 in every run: the unit's own G1 recorded exit 1, and a clean-head
  scratch clone of d257a867 exits 1 at `root-suite` (12/13 steps green, worktree-guard
  step exit 0) with `scripts/roadmap-settle.test.mjs` red — which reproduces verbatim at
  base 15c152a1 (7 pass / 1 fail at both ends). L3 splits exactly this gate half for O4
  (row status `verified (E7, G1, L3 split)` — accepted here as its evidenced n/a: the
  guard half re-runs green), but AC-S5's Check and P5's validator carry no amendment or
  disposition, so S5's validator never re-runs green here. Smallest action: carry L3's
  disclosed split into AC-S5 and P5 (record the gate half as evidenced n/a naming the
  base reds), or attach a dated disposition for S5's gate half.
Advisories: 5 —
  (A1) docs/features/494-telemetry-by-turn/SPEC.md (roadmap-settle live red
  `row-missing`) — pre-existing: `bun test scripts/roadmap-settle.test.mjs` → 1 fail
  ("the live tree is green") identically at base 15c152a1 and at head; it is the one
  deterministic root-suite red keeping the local gate off exit 0.
  (A2) scripts/prose-gate-inventory.test.mjs (multiple-homes on
  `.worktrees/feat-269-efficient-context-targeting/docs/workflow/GATE_INVENTORY.md`) —
  base-present: with that live layout simulated in scratch, 3 fail at base AND at head;
  clean head without a live worktree → 21 pass / 0 fail. Structural note: the new
  documented recipe puts every worktree inside the tree, so any full-checkout worktree
  re-triggers it; remedy is the unit's declared out-of-scope known issue.
  (A3) live tree `node scripts/docs-generate.mjs --check` → DRIFT
  (`docs/generated/units.md: stale`) — caused by concurrent uncommitted issue-#507 work,
  not this branch: copying the untracked `docs/fix/507-driver-write/` into a clean-head
  scratch clone → DRIFT; with only the uncommitted docs/ROADMAP.md row → PASS; clean
  head → PASS (0 stale). Live-tree state at verification: `M docs/ROADMAP.md` +
  `?? docs/fix/507-driver-write/` (another session's in-flight unit), untouched by this
  verification.
  (A4) environment, disclosed — pool instability in these runs: ceremony-unit-plan,
  diff-guard, differential-baseline, run-root-suite and scope-manifest failed only inside
  the 4-worker gate pool and pass standalone (18/18, 10/10, 9/9, 23/23, 7/7);
  red-first's O4 history-scan test times out at its 5 s budget at BASE and at head in
  this environment (and once on the live tree) — base-reproduced, not change-caused;
  doc-discipline AC25 red in one pool run traced to this verifier's own untracked
  `node_modules` symlink in scratch (`grep: node_modules: Is a directory`) and is green
  with a real directory. Mutation hygiene: `--prune` and every mutating guard mode ran
  only against mktemp fixture repositories in scratch; the live tree was touched by
  read-only commands only (guard audit without --prune, check-only validators, test
  suites whose fixtures live in temp).
  (A5) docs/fix/505-worktree-prune/SPEC.md:212 (PE-001) — freshness `current` still
  asserts the superseded default (`<repo>/.git/worktrees`) after the change landed;
  planning evidence records cut-time state by design and no validator consumes it —
  precision note only.
Sibling sweep: SPEC.md:201 (B2 — the P4 validator is the surviving mention of the
  retired `worktree move` → 0 demand that L2 superseded); otherwise clean —
  `git grep '\.git/worktrees'` over tracked files hits only AGENTS.md's intended
  forbidden/mechanism/recovery lines (507, 509, 513, 516, 518, 606, 616), the updated
  GATE_INVENTORY `worktree-audit` row, the guard's own finding text and its test
  fixtures, the unit's pre-state evidence (PE-001 → A5), and insert-only history
  (frozen unit docs 174/427/443/462/476/108, docs/LOGS.md, journal fragments);
  `temp-worktrees` only in history plus the Retirements evidence; zero matches under
  skills/ template/ packages/ (PE-005 re-confirmed); no live doc still prescribes the
  two-step temp+move recipe or the old default home.
Completeness: S1, S2, S3, S4, S6 resolved (validators re-run green here); open: S5
  (P5/AC-S5 gate check → B3), S7, S8 (no task link → B1). Obligations O1–O7 status:
  O1 green (temp-worktrees → exit 1, `.worktrees/<flat-name>` matches, prune-destruction
  warning present); O2/O3 green (suite exit 0 · 15 pass / 0 fail at head; red corpus
  re-run at 82534304 → exactly the 3 new cases fail, every pre-existing case green;
  green at 4988a475; base suite at 15c152a1 → 12 pass); O4 closed on its L3 split
  (guard exit 0 · `worktree-guard: 0 finding(s)` re-run on the live tree; gate half
  base-attributed → B3 for the unamended AC-S5/P5 texts); O5 green (scratch
  reproducer: `.worktrees/fix-493-x/precious.txt` survives `git worktree prune`,
  exit 0, zero prunable; the old recipe in the same scratch destroys both trees and
  precious.txt, prune exit 0); O6 green (base-vs-head differential on six fresh
  fixtures: only the three declared differences — STALE → ADMIN_NAMESPACE, OUTSIDE
  detail home path, --prune PRUNED → SKIP relocate — everything else byte-identical);
  O7 green (`bun scripts/docs-generate.mjs --check` exit 0 at clean head; journal
  carrier check 57 checked / 0 refusals including the unit's fragment; ROADMAP row,
  projection and GATE_INVENTORY row all shipped).
Spot check: `bun test scripts/worktree-guard.test.mjs` → match (E3 reported exit 0 ·
  15 pass / 0 fail; re-run observed exit 0 · 15 pass / 0 fail). E7
  (`node scripts/worktree-guard.mjs` → exit 0 · `worktree-guard: 0 finding(s)`) and G2
  (docs-generate --check → PASS) were also re-run end-to-end and matched.
Verdict: NEEDS-DECISION (B1 spec-unlinked S7/S8 · B2 P4 validator stale · B3 AC-S5/P5 gate-exit-0 unamended)
```
