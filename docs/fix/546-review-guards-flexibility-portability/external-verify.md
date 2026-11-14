# External verify — fix/546-review-guards-flexibility-portability

Date: 2026-11-14 · base `95af0547` (`origin/main`) · head `269a6e48` · first receipt
for this unit (no prior `EXTERNAL VERIFY` block → full verdict, once). Every declared
verification command was re-run in this checkout; base-side proofs and the differential
ran only in `mktemp -d` scratch copies (a `git archive` tree plus one detached clone of
`95af0547`), network left on but no probe made a network or forge call. No `git commit`,
`git push`, branch creation, forge mutation or code edit was made — the live tree was
byte-clean (`git status --short` empty) after the runs; this file is the receipt, written
uncommitted.

```
EXTERNAL VERIFY — base: 95af0547 · head: 269a6e48
Blockers: 2 —
  1. docs/ROADMAP.md:192 (status cell `in-progress`) vs docs/fix/546-review-guards-flexibility-portability/SPEC.md:527
     (P13 Log carries the PR #549 URL) — the root suite's roadmap-settle step goes red, change-caused.
     Reproducer: `bun test scripts/roadmap-settle.test.mjs` → exit 1:
     `Roadmap-settle: docs/fix/546-review-guards-flexibility-portability/SPEC.md:527 pr-url-unsettled — doc carries
     its PR URL (Log); row status is 'in-progress' — expected 'done · [#549](https://github.com/gtrabanco/agentic-workflow/pull/549)'`
     (rule: scripts/roadmap-settle.mjs:31-33). Whole-suite view: `node scripts/run-root-suite.mjs` → exit 1,
     110 PASS · 2 FAIL, against the reported G1 `111 PASS · 1 FAIL` — the reported gate evidence no longer
     reproduces at final head, so it is untrusted at head (the spot check below matched; this line did not).
     Base-vs-head: exit 0 at base — a real detached clone of `95af0547` runs the same suite 8 pass / 0 fail,
     and a `git archive` copy of base passes while the identical archive of head fails, so the defect is in
     the committed bytes added by this branch (SPEC.md:527 and the roadmap row), not the environment.
     Stability: fires only on this unit's row/doc; the other 110 suites are unchanged.
     Smallest action: make the pair checker-consistent — either drop the PR URL from SPEC.md:527's P13 line
     until the row flips, or set docs/ROADMAP.md:192's status cell to `done · [#549](<same url>)` in the same
     change that keeps the URL — route to `/aw-local-apply`.
  2. skills/orchestration-envelope/references/TURN_CONTRACT.md:9 (`gh pr create`), :41 and :61 (`git/gh evidence`)
     — sibling sweep: the fix landed in one sentence of a P9-declared surface and the sibling mentions kept
     the old GitHub-only truth.
     Reproducer: `rg -n 'git/gh|gh pr create' skills/orchestration-envelope/references/TURN_CONTRACT.md` →
     3 hits; the file's own :35-36 (edited by this change) now says the CLI is `gh`, `glab` or `gt`, so the
     same file contradicts itself: box 4's prose still tells the agent to run `gh pr create` (wrong for the
     GitLab/Gitea rows of the issue's scenario table, where init-workspace maps the URL to `glab`/`gt`), and
     the receipt grammar still calls the transcript evidence `git/gh`.
     Base-vs-head: at base the shim was GitHub-only (`git show 95af0547:template/.agentic-workflow/hooks/turn-contract.sh`
     → `gh pr list`), so the mentions were true; at head the shim resolves the forge through lib/forge.sh, so
     the mentions assert the exact truth this change removed. The edit hunk (diff lines 33-40) left :41 as
     unchanged context.
     Stability: quiet on every untouched file — the reproducer is this file's gh-only phrasing alone.
     Smallest action: one prose edit aligning :9, :41 and :61 with the forge matrix already at :36 — route to `/aw-local-apply`.
Advisories: 4 —
  1. scripts/doc-discipline.test.mjs red (AC25: the fix-489 journal fragment opens the store path) — disclosed
     by the unit as pre-existing; reproduced at base (same AC25 failure in the detached `95af0547` clone).
     That clone also showed 3 AC24 failures absent at head: an environment artifact of a fresh clone lacking
     gitignored build outputs, not a defect of either revision.
  2. SPEC.md Retirements declare two receipts that do not reproduce as written: line 115
     `rg -c 'commit-and-push' packages/agentic-workflow-schema/src/config.ts` → claimed 1, observed 2 (also 2
     at base; the substance "no value is removed" holds — enum at config.ts:159 keeps every old value); line 118
     `rg -c 'TMPDIR' template/.agentic-workflow/hooks/*.sh` → claimed 0, observed 1 (also 1 at base; the match
     is fullauto-merge.sh:112's diagnostic naming the helper's variable order, not a fallback). The substantive
     retirement holds: the `${TMPDIR:-/tmp}` literal exists only in lib/temp.sh outside tests, enforced by the
     rigidity rule `hardcoded-temp-fallback`.
  3. docs/features/52-machine-checked-turn-contract/{SPEC,PLAN,ACCEPTANCE}.md — 5 surviving `bash + git + gh`
     mentions of the shim's tool contract. Advisory rather than blocker: these are the frozen records of a
     completed unit (their machine validators, e.g. ACCEPTANCE AC12's grep, still pass) and no live surface
     asserts the old truth; the live surfaces (TURN_CONTRACT.md:35-36, the shim header, hooks README) were
     updated. Owner may want a temporal qualifier.
  4. The network gate steps (G3: dependency-pin-gate, dependency-advisories, pi-compat-guard) were not re-run —
     network was cut at my discretion for this read-only verification; every offline step and suite was re-run.
Sibling sweep: list — blocker 2 (TURN_CONTRACT.md:9/41/61) plus advisory 2 (the two SPEC receipt lines) and
advisory 3 (feature-52's five historical mentions); every other swept surface is clean: annex enum comments,
CONFIG.md's table row, the fullauto "Requires gh" header, bare `gh (pr|api|repo)` in the hooks, `TMPDIR`
fallbacks outside lib/temp.sh, GATE_INVENTORY's new row, both annexes' flexibility sections.
Completeness: S1–S10 all resolve to tasks carrying `(Implements: S#)`; phase-lint `verdict PASS` (6/6 × 13);
all task validators re-run green except P13's `node scripts/run-root-suite.mjs` (exit 1 — the disclosed
pre-existing doc-discipline red plus blocker 1). Obligations O1–O20: every row `verified`, every validator
re-run green here; O20's harness was never persisted, so it was reconstructed in `mktemp -d` over base/head
copies — 9 added lines, every one in a declared category (`rigidity-review` in `--list`, the `--remote` usage
lines of push-identity-check/turn-contract, and the newly-blocked `gt pr merge`/`hub merge` with their exit
changes), controls (`gh pr merge`, `git merge`, `.env`, fullauto's usage errors) byte-identical.
Spot check: `bash template/.agentic-workflow/hooks/tests/test-turn-contract.sh` → match (exit 0,
`PASS turn contract: 46 cases` — identical to reported E3).
Verdict: NEEDS-DECISION (2 open blockers)
```
