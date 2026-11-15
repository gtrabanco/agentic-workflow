# External verify — feature/552-template-secret-scan

## 2026-11-15

```text
EXTERNAL VERIFY — base: 6f3bb8a0b8bbffb5827374ba8a1eb1f3f140629c · head: 3cc784a9f0d9b845ea1e489220649670b4e1f3f1
Blockers: 4 —
  (1) scripts/roadmap-settle.test.mjs:77 (live-tree case) vs docs/features/552-template-secret-scan/SPEC.md:406 and docs/ROADMAP.md:169 — SPEC's `## Next` carries the PR #557 URL while row 552's status cell reads `in-progress · [#557]`; the gate's contract (roadmap-settle.test.mjs:5) is "a unit doc that carries a PR URL must have its index row reading `done · [#N](<same url>)`". Reproducer: `node --test scripts/roadmap-settle.test.mjs` → exit 1 (`pr-url-unsettled … expected 'done · [#557](…)'`); full `node scripts/run-root-suite.mjs` → exit 1, 112/113 suites pass, this one red. Base-vs-head: `git archive origin/main` into mktemp scratch (removed after) runs the same suite → exit 0, 8 pass/0 fail (the unit doc is absent at base); the red was introduced by 3cc784a9, after the last recorded full-gate PASS G4 at 469866df. Smallest action: drop the `pull/557` hyperlink from SPEC's `## Next` (plain `#557` keeps the row honestly `in-progress`), or flip the row cell to `done · [#557]` only once the PR has merged — route to /aw-local-apply.
  (2) docs/features/552-template-secret-scan/SPEC.md:87 (AC2 check) and SPEC.md:383 (Log E11) — `rg -n 'local-gate' template/.agentic-workflow/hooks/secret-scan.mjs` → exit 0 with matches at :12 and :14 (the header comment), while AC2's declared check says "finds no match" and E11 records "exit 1 · no match". Reproducer: the command above, run at head. Base-vs-head: the file is absent at base (`git cat-file -e origin/main:template/.agentic-workflow/hooks/secret-scan.mjs` fails → the check was vacuously green at base) and every revision the file has ever had carries the mentions (d0a80671: 3 matches; dbdf6340, c1c9c608, HEAD: 2) — E11 was never true. Smallest action: re-scope AC2's check to the dependency it means (imports only, e.g. `rg -n '^import .*local-gate' …` finds none) and correct E11's recorded outcome — route to /aw-local-apply.
  (3) docs/features/552-template-secret-scan/SPEC.md:103 (AC18 check) and SPEC.md:395 (Log E23) — `rg -n 'DOMAIN_SEPARATION.md' docs/features/552-template-secret-scan/SPEC.md` → 5 matches; AC18's declared check demands "matches 1" and E23 records 4. Reproducer: the command above, run at head. Base-vs-head: the unit doc is absent at base (check vacuously green); ≥2 matches existed already at the P1 freeze (the AC's own line plus the classification section), so the check was never satisfiable as written, and E23's count drifted to 5 with later SPEC edits. The AC's substance (authority page, AGENTS.md rule and issue #435 all cited) verified green. Smallest action: re-scope AC18's check (e.g. `rg -c 'classification test issue #435' …` ≥ 1 alongside the DOMAIN_SEPARATION.md citation) and correct E23's number — route to /aw-local-apply.
  (4) docs/ROADMAP.md:218 — issue #487's row still narrates the live gate in present tense as "One offline gate step (`scripts/secret-scan.mjs` + its sibling suite, red-first) scans…", naming the module this unit removed. Reproducer: `rg -n 'scripts/secret-scan\.mjs' docs/ROADMAP.md` → line 218; `git cat-file -e HEAD:scripts/secret-scan.mjs` → absent. Base-vs-head: the path exists at base (row true) and is gone at head (row false) — change-caused by the move; stability: a path-existence sweep over every concrete path named in ROADMAP rows flags only this one (plus a `<x>` placeholder), so the reproducer stays quiet on untouched rows. The same vanished-path citation class was already repaired in `.changeset/487-deterministic-secret-scanning.md` (Log E9). Smallest action: re-point the row's path at `template/.agentic-workflow/hooks/secret-scan.mjs` (hand-owned cell; `bun scripts/docs-generate.mjs --check` must stay green) — route to /aw-local-apply.
Advisories: 4 —
  (1) docs/features/552-template-secret-scan/SPEC.md:392 (Log E20) — the recorded command `PATH='/nonexistent' bash …/secret-scan.sh --root .` exits 127 in this shell (`bash` cannot resolve under the overridden PATH); the behavior itself verified: `env PATH=/nonexistent /bin/bash template/.agentic-workflow/hooks/secret-scan.sh --root .` → exit 2, "neither bun nor node is on PATH …", no `verdict: PASS` on stdout — O4's outcome reproduces, only the receipt's literal spelling does not.
  (2) docs/features/552-template-secret-scan/SPEC.md:393-394 (Log E21, E22) — recorded counts 15 and 15, observed 19 and 16 after later SPEC edits; both ACs' actual checks (AC16's table naming both surfaces, AC17's `#487` ≥ 2) still pass — stale supporting counts, not failing checks.
  (3) docs/features/552-template-secret-scan/SPEC.md:92 (AC7 parenthetical) vs template/.agentic-workflow/hooks/tests/test-secret-scan.sh:20 — AC7's prose names `set -euo pipefail`, the shipped test uses `set -uo pipefail`, the same guard form as four pre-existing siblings (test-temp-lib, test-forge-adapter, test-git-identity-check, test-turn-contract); AC7's declared check (the test exits 0) passes.
  (4) scripts/batch-scheduler.test.mjs:583, :586, :1596 — fixtures name `scripts/secret-scan.mjs`; illustrative test data that asserts no repository state (the class fix/487's external-verify already logged as an advisory).
Sibling sweep: docs/ROADMAP.md:218 (blocker 4) and scripts/batch-scheduler.test.mjs fixtures (advisory 4); everything else clean — MIGRATION's boundary rewritten with the scanner exception, both changesets re-pointed (E9 reproduced: lint-changeset 17/0), the moved module's header and the hooks README state the project default, GATE_INVENTORY's row names an existing carrier, and journals/unit-doc histories are past-tense or SHA-pinned.
Completeness: S1–S18 resolved (every `(Implements: S#)` validator re-ran green: P1–P7 checks, both suites 35/49 and 84/84 combined, hook tests 15/15 plus all 10 pre-existing 0-exit; obligations O1–O19 all `verified` with re-run-green validators or the evidenced `n/a`) | open ids: none
Spot check: bash template/.agentic-workflow/hooks/tests/test-secret-scan.sh → match (Log E19/E3 reported `exit 0 · 15 case(s), 0 failure(s)`; observed exit 0, `15 case(s), 0 failure(s)`)
Verdict: NEEDS-DECISION (4 open blockers)
```

### Scope notes

- Auth-surface differential (base `origin/main` vs head, both in `mktemp -d`
  scratch, removed after): quoted-assignment leak, bare-assignment leak, clean
  range, removed-secret range → identical text output and identical exits
  (1/1/0/0); failure states (`--nope`, `--base` without a value, unresolvable
  `--base`, `--all --base`, non-git root) → 2 on both sides. Only intended
  diffs: `--allowlist` refused at base / accepted at head.
- Modified-step execution: `bun scripts/local-gate.mjs --only secret-scan …`
  (write-free path confirmed) → PASS, 1,693 added lines, 0 findings. Delta
  steps `version-parity-content, docs-generated-projection,
  journal-carrier-check, log-immutability, temp-hygiene, worktree-guard` →
  PASS — 6 steps. `bun scripts/rigidity-review.mjs` → ok 15 guards/3 rules;
  `bun scripts/check-skill-context.mjs` (+ `--routes`, + `--documents`) → PASS;
  `bun scripts/skill-lint.mjs` → PASS; `node --test scripts/lint-changeset.test.mjs`
  → 17/0.
- Root suite: `node scripts/run-root-suite.mjs` → exit 1 solely on
  `scripts/roadmap-settle.test.mjs` (blocker 1); the other 112 suites passed
  with no host flakes on this run. Crate/schema suites were covered by G4 at
  469866df; the delta since is docs-only (ROADMAP, this unit doc, generated
  projection — all re-checked here).
- This receipt is written uncommitted: external verify is read-only and never
  commits; `/aw-local-apply` or the owner lands it with the corrections.
