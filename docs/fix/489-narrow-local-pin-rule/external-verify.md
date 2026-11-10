# 489 — external verify receipt

First (and full) external verification of this unit — no prior `EXTERNAL VERIFY`
block existed for it at bind time, so this is the full verdict, once.

Bound state: unit dir `docs/fix/489-narrow-local-pin-rule/` · base `origin/main`
merge-base `2a28f038a246d35ba159037620ebe337a56e57ed` · head
`ebd49840b8f5203c1559f27dbe1b732f0b5bb06b` · branch
`fix/489-narrow-local-pin-rule` (up to date with its origin counterpart; no PR
open). Mid-run observation: `origin/main` has advanced to
`d7b391b4` (#491, machine-gate-receipts); the advance touches
`scripts/local-gate.mjs` but none of this unit's declared surfaces —
`git diff --stat 2a28f038 d7b391b4 -- scripts/version-parity-gate.mjs
scripts/version-parity-gate.test.mjs scripts/pin-watch.mjs
scripts/pin-watch.test.mjs docs/workflow/PACKAGES.md` → empty — so every
base-side comparison below holds for either base, and a later integration does
not alter the verdict's substance.

Environment disclosures: this worktree had no `node_modules` and no schema
`dist/` — `bun install --frozen-lockfile` (163 packages, `git status` clean
after) and a `bunx tsc` build of `packages/agentic-workflow-schema` (gitignored
build output) were the preconditions for the declared validators. `node` from
fnm put on `PATH` per the unit's own known-issue. The change's mutating-capable
surface (`pin-watch.mjs --file-issues/--file-pr`) was never executed against
the live tree — only its offline suite with injected runners; the two gate
modes run (`--pins`, `--content`) are check-only and `git status --porcelain`
stayed byte-empty throughout.

```text
EXTERNAL VERIFY — base: 2a28f038a246d35ba159037620ebe337a56e57ed · head: ebd49840b8f5203c1559f27dbe1b732f0b5bb06b
Blockers: 1 —
  1. docs/fix/489-narrow-local-pin-rule/SPEC.md:217 (O7) — a `verified` obligation whose stated validator does not reproduce: it asserts "`git diff --stat origin/main...HEAD` names exactly the four declared paths", observed stat names NINE files (the four code/doc surfaces + SPEC.md, ROADMAP.md, docs/generated/units.md, journal fragment, and D1's two watch paths). The unit's own D5 (2026-11-09) falsified the four-path reading and corrected AC6, but the Obligations row was left carrying the superseded claim with status `verified`. The row's substantive invariant — no package bump, no changeset, no wiring — DOES reproduce: `bun scripts/version-parity-gate.mjs --content --base origin/main` → exit 0 · VERDICT: PASS · no-triggered-change on all three packages, no `package.json`/`.changeset` path in the diff, and AC6/E9's wiring check reproduces (no `function runPins|function main|PACKAGE_DIR` line in the gate's diff). Smallest action: amend O7's validator text to the D5/E9 wiring form (one line, doc-only). Route: /aw-local-apply.
Advisories: 2 —
  1. docs/fix/489-narrow-local-pin-rule/SPEC.md:132 (AC5) — the criterion says the diff "shows two replaced `test(` headers plus the additions"; observed three `-test(` and four `+test(` lines. The third rewritten header (`pins: pin ahead of the registry that matches no local version fails…`) is not one of the two retired cases — its contract (ahead ⇒ violation) survives and only its header/message assertion follows the changed violation text. Substantive criterion holds (replaced, not deleted; new cases pass; every other case byte-unchanged — full-suite 53/53 green). Why advisory: doc imprecision in the unit doc, not a behavior defect; disclosed here for the next doc touch.
  2. scripts/pin-watch.test.mjs:761 — the `PR_FINDINGS` fixture comment "Pin behind its local sibling: the bump target is the local version" feeds `planBumps` a synthetic finding the narrowed evaluator can no longer produce (a lagging sibling pin is now a notice, not a finding). Why advisory: the comment describes the bump-target rule, which is still true, and `planBumps` is exercised as a pure function over arbitrary findings — no retired verdict contract is asserted; but the modeled input is unreachable via `collectDrift` at head. Smallest action: relabel the fixture entry to the reachable ahead-direction input the next time this corpus is touched.
Sibling sweep: clean — no surviving mention of the retired truth anywhere outside this unit's own history records: `spec !== localVersion` gone (0 matches), "post-publish red window" gone from the header and PACKAGES.md, both superseded test names gone, the watch's docstring mirror now carries the direction, and every remaining "pin behind" mention (gate header :33/:551/:573/:592, PACKAGES.md, watch tests) states the NEW registry-owns-it/notice truth. The only residue is advisory 2 (a fixture comment, not an assertion).
Completeness: S1–S6 resolved — every S# has `(Implements:)` tasks whose validators re-ran green here (P1 `unit-route --triage` exit 0; P2/P3 evidenced by E1/E2 and re-run green: 53/53; P4 rg counts 1/1; P5 root suite 97/97) and the Obligations table closes O1–O6, O8–O10 with validators re-run green here; O7 is the blocker above.
Spot check: bun scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow → match (exit 0 · VERDICT: PASS · exactly two sibling-pin notices — equals reported E8)
Verdict: NEEDS-DECISION (1 open blocker: SPEC.md:217 O7)
```

## Annex — commands run and observed results (2026-11-09)

| command | observed |
|---|---|
| `bun test scripts/version-parity-gate.test.mjs` | exit 0 · 53 pass / 0 fail (= E2) |
| `bun test scripts/pin-watch.test.mjs` | exit 0 · 55 pass / 0 fail (= E6) |
| `node --test scripts/version-parity-gate.test.mjs scripts/pin-watch.test.mjs` | exit 0 · 108 pass / 0 fail (= E3) |
| `rg -c 'semverGt\(spec, localVersion\)' scripts/version-parity-gate.mjs` / `rg -c 'spec !== localVersion' …` | 1 / 0 (= E4, AC3) |
| `rg -c 'ahead of the local version' scripts/version-parity-gate.mjs docs/workflow/PACKAGES.md` | 1 each (= E4, AC4) |
| `git diff origin/main...HEAD -- scripts/version-parity-gate.mjs \| rg -c 'function runPins\|function main\|PACKAGE_DIR'` | 0 (= E9, AC6) |
| `bun scripts/version-parity-gate.mjs --content --base origin/main` | exit 0 · VERDICT: PASS · no-triggered-change ×3 (= E8, O7) |
| `bun scripts/version-parity-gate.mjs --pins --package packages/pi-agentic-workflow` | exit 0 · VERDICT: PASS · two sibling-pin notices (= E8; the §3 spot check) |
| `bun scripts/unit-route.mjs --triage 489-narrow-local-pin-rule` | exit 0 (= P1) |
| `bun scripts/run-root-suite.mjs` | exit 0 · 97/97 suites PASS (= G1) |
| `git diff origin/main...HEAD --stat` | 9 files, exactly the declared surfaces + the unit's own doc/projection/journal carriers |
| `git status --porcelain` (after every run) | empty — no live-tree mutation, no forge call, no commit, no push, no branch |

Correction bound per the verify contract: findings above are reported only —
reproducers and smallest actions are named for `/aw-local-apply`, which owns
every correction. The blocker is a ledger-text residue, not a code defect: the
implementation itself reproduced green under every declared validator and the
spot check.
