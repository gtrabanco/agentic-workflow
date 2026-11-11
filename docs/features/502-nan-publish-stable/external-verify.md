# External verify — feat/502-nan-publish-stable

2026-11-11

```
EXTERNAL VERIFY — base: 27275c94 · head: d9463a0c
Blockers: 1 — docs/LOGS.md:5663 + the 62 deletions under .agentic-workflow/journal/ (all by commit d9463a0c) · reproducer: `node scripts/log-immutability.mjs` → exit 1 · 63 violations · verdict FAIL (`log-hand-appended — docs/LOGS.md: touched by non-aggregator commit d9463a0c` + 62 × `fragment-hand-deleted … deleted by non-aggregator commit d9463a0c`); `bun scripts/local-gate.mjs` → FAILED at log-immutability, and `bun scripts/local-gate.mjs --no-bail` → 17 steps, failed: log-immutability + root-suite, skipped: schema-node-compat · base-vs-head: in a scratch clone at 27275c94 `node scripts/log-immutability.mjs` → `0 violations · base 27275c94 · range 0 commits · verdict: PASS`; every violation detail names only this branch's close commit, so the reproducer is quiet at base and fires only on this branch's 5-commit range (stability holds) · consequence: P5's declared validator (`bun scripts/local-gate.mjs` exits 0 — every step green or an evidenced base-reproduced red disclosed) fails at head, and G1/G2 (recorded at 8f2a8c7b, before the close commit) no longer describe the gate's reds — at head there are two, one change-caused and undisclosed · smallest action: /aw-local-apply — restore the 62 consumed fragment files and drop the hand-appended docs/LOGS.md blocks from the branch (the session entry stays a pending fragment for the merge-to-main aggregator identity, issue #468), then re-run `bun scripts/local-gate.mjs`
Advisories: 4 — (1) scripts/unit-doc-contract.test.mjs:433 and scripts/release.test.mjs:15,140 restate the train count as "three packages" while the train covers all four members (base `node scripts/release.mjs plan --channel stable` at 27275c94 already prints four `→ 5.0.0` lines) — pre-existing at base, untouched by this diff, so not change-caused; (2) docs/CAPABILITIES.md:53 claims "Three published npm packages" while `npm view @gtrabanco/pi-nan-agentic-workflow dist-tags` → `{ latest: '4.10.0' }` — four packages on npm at base and head, pre-existing undercount; (3) SPEC.md P4 (docs/features/502-nan-publish-stable/SPEC.md:214) declares the step "the roadmap row's status move to `done`" which was never executed — docs/ROADMAP.md:153 remains `in-progress` (correct pre-PR per roadmap-settle's done-requires-PR rule; the deferral is recorded only in the session log's Next, not amended in the SPEC); (4) pre-existing root-suite red scripts/roadmap-settle.test.mjs ("494 row-missing") — disclosed in SPEC Known pre-existing issues and base-reproduced here (scratch clone at 27275c94 → 7 pass / 1 fail, same assertion; the 494 SPEC is present at base with no ROADMAP row)
Sibling sweep: list — surviving count narrations, all pre-existing at base and reported as advisories 1–2: scripts/unit-doc-contract.test.mjs:433, scripts/release.test.mjs:15,140, docs/CAPABILITIES.md:53. The four declared surfaces are clean: `rg -n -e "the three packages" -e "three publish" .github/workflows/publish.yml docs/workflow/PACKAGES.md docs/workflow/FEATURE_WORKFLOW.md scripts/npm-version-gate.test.mjs` → exit 1 (0 matches), and PACKAGES.md's chain line ("schema → crate → the pi pair → the nan companion") plus FEATURE_WORKFLOW.md's "the four packages" carry the new truth. History excluded: scripts/npm-version-gate.mjs:5 (dated WHY, 2026-09-27), publish.yml's 2026-11-02 dist-tag-incident comments (enumerated exception, including the copy in the new nan block), scripts/release-workflows.test.mjs:174 (same incident), the SPEC's own issue quotes, frozen audit/CHANGELOG/LOGS rows, other units' SPECs (370/375/443/489/500)
Completeness: S1–S8 resolved — P1 (`bun scripts/docs-generate.mjs --check` exit 0 · 3 checked / 0 stale), P2 (RED first reproduced: `bun test scripts/release-workflows.test.mjs` at b6cdc271 → 18 pass / 7 fail, and on base-27275c94 + new tests in scratch → 18 pass / 7 fail, every failure a new/extended assertion; npm-version-gate 14/0 on the same base), P3 (suite exit 0 · 25 pass; YAML parse of a scratch copy → 7 jobs, nan-publish needs ["pi-publish"], mode-gated if, working-directory packages/pi-nan-agentic-workflow), P4 (rg exit 1; docs-generate exit 0; `bun scripts/check-skill-context.mjs --documents` → PACKAGES.md 101 lines / estimate 2381, PASS); obligations O1–O8 all `verified` with every validator re-run green here (O1 plan prints the companion line `@gtrabanco/pi-nan-agentic-workflow: 4.10.0 → 5.0.0` + suite 25/0; O2 `(cd packages/pi-nan-agentic-workflow && bun run test)` exit 0 · 29 pass; O3/O4/O7 suite exit 0 with dist-tag 4 / gate count 5 / needs chain asserted; O5 rg exit 1; O6 `rg -c "Trusted Publisher"` → publish.yml 14, SPEC 11; O8 `bun scripts/version-parity-gate.mjs --content` → VERDICT: PASS). P5's validator is red at head → blocker 1; P4's roadmap-done sub-step → advisory 3
Spot check: bun test scripts/release-workflows.test.mjs → match (exit 0 · 25 pass / 0 fail — identical to reported E4; E3's red, E5's YAML shape, E7's base differential, E8's plan, E11's budget and E12's projection were also re-run and matched)
Verdict: NEEDS-DECISION (1 open blocker)
```

---

## Correction addendum — 2026-11-11 (local apply batch, correction bounds §9)

Batch head: `30adaf36` (re-cut close commit, supersedes the local-only
`d9463a0c` — recoverable via reflog; `ls-remote origin feat/502-nan-publish-stable`
→ empty, so no published history was rewritten) + `d509ca1f` (advisory folds).

- **B1 folded.** Reproducer re-run (blockers-only recheck): `node
  scripts/log-immutability.mjs` → exit 0 · `0 violations · base 27275c94 ·
  range 6 commits` (63 violations at the receipt's head; 0 at base). The close
  commit no longer touches `docs/LOGS.md` or any pending fragment: the session
  entry is re-landed through the journal writer as a fragment byte-identical
  to the appended block (timestamp pinned to `2026-11-10T23:46:07Z`),
  `journal aggregate --check` → exit 0 (64 fragments), `agentic-workflow
  verify <SPEC>` → exit 0.
- **A1 folded** (unit-doc-contract narration → four packages + companion
  assertion; 21 pass / 0 fail). **A1b withdrawn**: `scripts/release.test.mjs`'s
  "all three packages" describes its three-package *fixture* — fixture-true,
  renaming would falsify the name (context understood before fixing).
- **A2 folded** (CAPABILITIES public-API row → Four published npm packages +
  companion package.json; capabilities suites 31 pass / 0 fail).
- **A3 folded** (P4's roadmap step states the `in-progress` registration and
  the closeout settlement; a `done` row without its PR link reds
  roadmap-settle). **A4 unchanged** (unit 494 row — main's disclosed
  pre-existing red, out of this unit's declared surface).
- Obligations O1–O8 re-run in the foreground: every validator green (O1
  release-workflows 25/0 + plan 4 train lines; O2 + companion 29/0; O3/O4/O7
  suite 25/0 with dist-tag 4 / gate count 5 / needs chain; O5 rg exit 1; O6
  14 ≥ 1 and 11 ≥ 1; O8 parity PASS). docs-generate PASS · context PASS
  (PACKAGES 101 / estimate 2381). Differentials (base export vs change):
  unit-doc-contract 21, release 70, capabilities 16, capability-inventory 15 —
  case lists identical; nothing unrequested moved.
- Gate at batch head: `bun scripts/local-gate.mjs --no-bail` → exit 1 with
  root-suite the only failed step (three runs); standalone `node
  scripts/run-root-suite.mjs` → exit 1 · 100 pass / 1 fail = roadmap-settle
  494 only. The in-gate FAILs of red-first/run-root-suite/scope-manifest carry
  **no test-level failure** — root-suite runs fail-fast on inside the gate and
  the bail kills the suites still in flight behind the disclosed 494 red; the
  base under the same load reproduces the same cascade with different victims
  (ceremony-*, tmp-gc; load average 5–10, 4 users) and `node
  scripts/red-first.mjs` → exit 0 · 0 findings standalone → advisory
  (environment/load class, misattributable, never a blocker).
- **New finding (not folded — §9: a new finding never earns another cycle):**
  SPEC `G1` pins "HEAD `8f2a8c7b` … the run's only red is roadmap-settle", but
  at committed `8f2a8c7b` alone `bun test scripts/check-skill-context.test.mjs`
  is red (`docs/workflow/PACKAGES.md` 103/2419 > 2381 — the over-ceiling draft
  *is* committed there and compressed only in the close commit), so `E11`'s
  "that red never reached a commit" is literally false; G1's run must have
  reflected the close edits in the working tree. Evidence lines left untouched
  (append-only) — the owner's call.

Blockers after batch: 0 (B1 recheck green). Verdict stands for the owner's
delta re-verify on `d509ca1f`.
