# Review findings — 52-machine-checked-turn-contract

Fix-now fold ledger for the unit's review cycles. Rows are appended by
`review-change` only; only `fold-findings` flips `folded` to `yes`.

```text
review-findings@1
id | file:line | axis | severity | class | route | folded
F1 | packages/agentic-workflow/bin/turn-contract.mjs:128 + template/.agentic-workflow/hooks/turn-contract.sh:89 | code | high | fix-now | fold | yes
F2 | scripts/turn-contract-grammar.test.mjs:4-6 | code | med | fix-now | fold | yes
F4 | packages/agentic-workflow/bin/turn-contract.mjs:4 | security | med | fix-now | fold | yes
VF-1 | packages/agentic-workflow/bin/turn-contract.mjs:128 · reviewer review-change · HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 · recheck failing reproducer: /tmp fixture repo (feat/x, 1 commit, unit-shaped docs/features/x, dirty untracked file), corrupt `.git/index` → `git status --porcelain` exit 128 while `rev-parse --show-toplevel`/`rev-list --count` exit 0 → engine prints `TURN-CONTRACT ok` exit 0; control with working index → `TURN-CONTRACT fail box5: dirty-tree` exit 1; secondary trigger by code read: execFileSync default maxBuffer 1 MiB → oversize porcelain lands in the same {ok:false} path | code | confirmed | finding-mark | n/a | n/a
VF-2 | scripts/turn-contract-grammar.test.mjs:4 · reviewer review-change · HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 · recheck direct read: header comment "runs the shared fixture matrix through BOTH engines" vs the single test loop (:105-109) whose only call site is `assertConforms("engine", ctx.runEngine(…))` — the shim is never invoked in this file | code | confirmed | finding-mark | n/a | n/a
VF-3 | packages/agentic-workflow/bin/turn-contract.mjs:4 · reviewer review-change · HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 · recheck direct read: header comment "read-only" vs box2 engine-only clause spawnSync of the working tree's `scripts/phase-lint.mjs` (:89-96, cwd=root, runs before box5's clean-tree check); suite no-mutation case (turn-contract.engine.test.mjs:55) runs without phase-lint present | security | confirmed | finding-mark | n/a | n/a
REVIEW-RAN | HEAD 9b6528668c2736a876ec363bfbd926c4c8fb1834 | n/a | n/a | review-mark | n/a | n/a
F5 | packages/agentic-workflow/bin/turn-contract.mjs:89 + template/.agentic-workflow/hooks/turn-contract.sh:57 | code | med | fix-now | fold | yes
F6 | template/.agentic-workflow/hooks/turn-contract.sh:91 | perf | med | fix-now | fold | yes
F7 | skills/orchestration-envelope/references/TURN_CONTRACT.md:23-36 (+ byte-identical pi-package mirror) | brand | med | fix-now | fold | yes
VF-5 | packages/agentic-workflow/bin/turn-contract.mjs:89 + template/.agentic-workflow/hooks/turn-contract.sh:57 · reviewer review-change · HEAD 81ec300f5e940e9cce398095328523c6f065f586 · recheck reproducer: /tmp fixture repo (branch feat/x, 1 commit, clean tree, `docs/features/x` a regular FILE) → engine `TURN-CONTRACT fail box2: acceptance-missing` exit 1 (existsSync true for a file; cat-file HEAD:docs/features/x/ACCEPTANCE.md fails) vs shim `TURN-CONTRACT ok` exit 0 (`[ -d ]` false → box2 skipped); parity matrix has no file-at-path case | code | confirmed | finding-mark | n/a | n/a
VF-6 | template/.agentic-workflow/hooks/turn-contract.sh:91 · reviewer review-change · HEAD 81ec300f5e940e9cce398095328523c6f065f586 · recheck direct read + probe: cmd-substitution `status_out=$(git -C "$repo_root" status --porcelain 2>/dev/null)` captures the full listing unbounded; engine counterpart (turn-contract.mjs:141) caps at the 1 MiB default maxBuffer and fails closed → on a >1 MiB porcelain the engine prints `fail box5: dirty-tree` exit 1 while the shim prints ok exit 0 | perf | confirmed | finding-mark | n/a | n/a
VF-7 | skills/orchestration-envelope/references/TURN_CONTRACT.md:23-36 · reviewer review-change · HEAD 81ec300f5e940e9cce398095328523c6f065f586 · recheck direct read: profile grants the recitation exemption listing shim and engine as interchangeable verifiers; grep -iE "engine-only|phase-lint" on that file → only :7 (gate list) and :44 (codes list), no caveat in the profile section; pointer docs (FEATURE_WORKFLOW.md, ORCHESTRATION.md) zero hits; disclosure exists only at turn-contract.sh:55-56, known-issues.md:24-30, decisions.md ED-52-3 | brand | confirmed | finding-mark | n/a | n/a
REVIEW-RAN | HEAD 81ec300f5e940e9cce398095328523c6f065f586 | n/a | n/a | review-mark | n/a | n/a
F8 | packages/agentic-workflow/bin/turn-contract.mjs:144 + template/.agentic-workflow/hooks/turn-contract.sh:95 | security | med | fix-now | fold | yes
F9 | docs/features/52-machine-checked-turn-contract/SPEC.md:517 | spec-drift | med | fix-now | fold | yes
F10 | packages/agentic-workflow/bin/turn-contract.mjs:144 + template/.agentic-workflow/hooks/turn-contract.sh:95 | code | med | fix-now | fold | yes
F11 | packages/agentic-workflow/bin/turn-contract.mjs:124 + template/.agentic-workflow/hooks/turn-contract.sh:79 | code | med | fix-now | fold | yes
VF-8 | packages/agentic-workflow/bin/turn-contract.mjs:144 + template/.agentic-workflow/hooks/turn-contract.sh:95 · reviewer review-change · HEAD 126ef68ecb632a613d5f471596cbad562ff2d025 · recheck reproducer: /tmp/vf/c1 fixture (feat/x, 1 commit, clean, `git config status.showUntrackedFiles no`, untracked file present) → engine AND shim print `TURN-CONTRACT ok` exit 0; control after `git config --unset status.showUntrackedFiles` → both `TURN-CONTRACT fail box5: dirty-tree` exit 1 | security | confirmed | finding-mark | n/a | n/a
VF-9 | docs/features/52-machine-checked-turn-contract/SPEC.md:517 · reviewer review-change · HEAD 126ef68ecb632a613d5f471596cbad562ff2d025 · recheck direct read + probe: box4 clauses quoted ("no PR or state ≠ OPEN → pr-not-open" vs "any gh error → pr-unreachable"); stub gh exit 1 empty stdout → both engines `fail box4: pr-unreachable` (a missing PR IS a gh error, so the pre-PR case can never reach pr-not-open); grep MERGED\|CLOSED over fixtures.mjs + test-turn-contract.sh → no gh-exit-0 state≠OPEN fixture | spec-drift | confirmed | finding-mark | n/a | n/a
VF-10 | packages/agentic-workflow/bin/turn-contract.mjs:144 + template/.agentic-workflow/hooks/turn-contract.sh:95 · reviewer review-change · HEAD 126ef68ecb632a613d5f471596cbad562ff2d025 · recheck reproducer: /tmp/vf/c5 (tracked file touched to a stale date) → `.git/index` mtime advances across both engines' plain `git status --porcelain` (no `--no-optional-locks`), contradicting engine header :4-5 "mutates nothing of its own" and the ACCEPTANCE read-only quality floor | code | confirmed | finding-mark | n/a | n/a
VF-11 | packages/agentic-workflow/bin/turn-contract.mjs:124 + template/.agentic-workflow/hooks/turn-contract.sh:79 · reviewer review-change · HEAD 126ef68ecb632a613d5f471596cbad562ff2d025 · recheck reproducer: /tmp/vf/c8 argv-capture gh stub on branch `123` with upstream → both engines ran `pr view 123 --json state,headRefOid` (bare all-numeric branch; gh resolves such args as PR numbers, so box4 can check a different PR) | code | confirmed | finding-mark | n/a | n/a
REVIEW-RAN | HEAD 126ef68ecb632a613d5f471596cbad562ff2d025 | n/a | n/a | review-mark | n/a | n/a
```

Fold cycle 3 (`/fold-findings`, user-invoked after the cycle-3 REVIEW-FAIL):
F8/F9/F10/F11 folded as ONE atomic batch — one homogeneous correction class (the
verifier's two external reads trusted ambient state instead of pinning their
inputs: git's repo-local config and optional index locks, gh's argument
heuristics and its single nonzero exit for a missing PR), one validator set
(both suites + the two-engine parity matrix), one rollback boundary (this PR).
Red-first: every new detector was run against the unchanged engines before the
fix, and each failed for its own reason — `box4 no PR for the branch` →
`pr-unreachable`, `box4 numeric branch is not a PR number` → `pr-head-mismatch`
(box4 judging the unrelated PR #123), `box5 ignores status.showUntrackedFiles=no`
→ `ok` exit 0, and the index-bytes assertion → the verifier rewrote
`.git/index`. The `gh` PATH-stub gained its per-verb answer (`pr list` vs
`pr view`, with an independent view exit) because the *real* gh exits nonzero
for a branch that has no PR — that error is the whole of F9. Decisions.md
ED-52-10 (box4) / ED-52-11 (box5); SPEC box4 and gh-drift risk rows updated to
the implemented command with every clause's semantics unchanged.

Cycle 1 (first review; no prior marks or forge receipts). Refuted candidates
are reported in the review's chat report only — they never become rows.

Cycle 2 (fold batch `9b652866..81ec300f`: F1/F2/F4 re-verified repaired at their
cited locations; the delta escalated to a full pass — width trigger: 4 files
outside the cited union and the grammar-test hunk at :110 >50 lines from cited
lines 4–6). New fix-now rows F5–F7; refuted candidates live in the cycle-2 chat
report only.

F6 DISPUTED (fold cycle 2, 2026-09-16) — premise refuted, then hardened on the
user's decision; row flipped `yes` against that hardening, ED-52-9. The row's
stated defect (engine fails / shim passes on a >1 MiB porcelain listing) does
not reproduce: in a fixture whose `git status --porcelain` is 1 147 992 bytes,
BOTH engines print `TURN-CONTRACT fail box5: dirty-tree` and exit 1,
byte-identical — the engine throws on Node's 1 MiB `maxBuffer`, the shim buffers
the listing and then fails on non-empty, so the verdict is the same in every
observable case and the parity invariant (D-52-2) holds. No red-first test can
exist for the residual (the uncapped in-memory capture), and cycle-2's
verification had inferred the shim side instead of running it; the reproducer
above is the measured result. The owner elected to fix the residual anyway,
choosing the fastest/lowest-storage option after measurement (816 ms → 178 ms,
112.7 MB → 3.4 MB peak RSS on an 18 MB listing; zero bytes written by every
variant): the shim now reads the listing to its first byte and clones
`PIPESTATUS` before any other command. Locked by the new `box5 huge listing
fails closed` case (≈1.2 MB, past the engine's cap and the shim's pipe buffer);
the pre-existing F1 corrupt-index case is the detector for a bounded read that
loses git's status (verified against a deliberately mis-ordered implementation:
the suite fails it).

Cycle 3 (fold batch `81ec300f..126ef68e`: F5/F6/F7 re-verified repaired at their
cited locations; the delta escalated to a full pass — width trigger: 4 files
outside the cited union (`decisions.md`, `review-findings.md`, `fixtures.mjs`,
`tests/test-turn-contract.sh`); size did not fire: 149+20 lines / 8 files).
Adversarial N=2 (R1 correctness, R2 security — same model family, single-family
agent), a user-initiated third cycle. All six folded rows pass re-verification,
no regressions. New fix-now rows F8–F11 (F8/F10 share the status invocation
site, distinct axes; F10/F11 are rubric-floor reclasses minor→med by the
classifier: a frozen read-only floor violation and a direction-changing
wrong-PR verdict). Refuted candidate — detached HEAD prints ok — lives in the
cycle-3 chat report only: both engines actually print `fail box3: no-commits`
exit 1 (`main..HEAD` = 0).
