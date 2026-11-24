# External verify — 2026-11-23

Full verdict, once: no prior `EXTERNAL VERIFY` block existed in this unit dir, so
this is the first receipt and the next run over landed corrections is a delta
verdict. Read-only run — no commit, no push, no branch, no forge mutation, no
file edit beyond this receipt. Every invocation of the change's own commands
(`runner scaffold-contract check` / `authoring`, including the read-only and
`--json` probes) ran against `mktemp -d` scratch workspaces only, never against
this worktree's `docs/`; the base-side proofs ran against a `git archive
origin/main` copy under `/tmp` (removed after use). The live tree was clean at
close (`git status --porcelain` empty). The root gate
(`node scripts/run-root-suite.mjs`) ran as the declared project gate — its only
writes are the gitignored schema `dist/` refresh the gate performs by design.

EXTERNAL VERIFY — base: 0c0e2718a59b8311b6dd1bddf7b97a7891bf03f8 · head: 6ea6d2cd37dc8d616361119d52b8bf9d6badf749
Blockers: 3 — (1) `scripts/findings-corpus.test.mjs:186` — the frozen harvest count still reads 1165 while this unit's Findings table (`docs/fix/701-init-workspace-scaffold-v2/SPEC.md:405`) adds F1, so the live tree yields 1166; reproducer: `bun test scripts/findings-corpus.test.mjs` → 14 pass / 1 fail (`1166 !== 1165`); base-vs-head: the same suite in a `git archive origin/main` copy → 15 pass / 0 fail, and the whole diff adds exactly one finding row (`git diff origin/main...HEAD | rg '^\+\| F[0-9]+ \|'` → the F1 row), so the attribution is this change; smallest action: re-freeze the count to 1166 with a dated comment — the same test's `reviewMarks` line already documents this exact pattern ("a unit that records one raises it") — then re-run the suite; route to `/aw-local-apply`. (2) `docs/fix/701-init-workspace-scaffold-v2/planning-obligations.md:12` (O3) — a `verified` row whose stated outcome does not reproduce: the required-evidence names "the missing/duplicate/order/level cases … in the run output", but the suite carries no duplicate case and no out-of-order case (`rg 'heading-duplicate|heading-order' packages/agentic-workflow/test/scaffold-contract.test.mjs` → no match; the run shows missing/level/clean only) — obligations-closure blocker naming O3; the behaviour itself is sound (external probes report `DEFECT heading-duplicate` and `DEFECT heading-order` correctly through the owner selector), so the ledger's claim is the defect; smallest action: add the duplicate and out-of-order cases to `packages/agentic-workflow/test/scaffold-contract.test.mjs` (both are green today), or correct O3's required-evidence to the cases the run actually shows; route to `/aw-local-apply`. (3) `docs/fix/701-init-workspace-scaffold-v2/SPEC.md:294` (AC1) — the claimed OK observable `SCAFFOLD OK — <n> surface(s) match` never prints: reproducer `bun packages/agentic-workflow/bin/agentic-workflow.mjs scaffold-contract check --workspace <scratch-with-matching-templates>` → per-surface `SURFACE … — MATCH` rows plus `verdict SCAFFOLD OK` (`render()`, `packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs:336-343`), and AC1's "one MISMATCH row per disagreeing template" is emitted per disagreement (one row per defect); the shipped test never asserts the quoted string (it matches only `SCAFFOLD (OK|MISMATCH|ABSENT)`), so AC1's stated proof does not prove AC1; base-vs-head: the command does not exist at base (change-caused), and the reproducer fires only on this claim (stable); smallest action: rewrite AC1's quoted observable to the emitted block — `skills/init-workspace/SKILL.md:213-217`, `packages/agentic-workflow/README.md:81` and the suite all pin the actual format, so the SPEC is the sole outlier; route to `/aw-local-apply`.
Advisories: 4 — (1) `scripts/normative-drift.test.mjs` (4 tests) — `AGENTS.md:673` renders the RUNNER.md pin as `bunx @gtrabanco/agentic-workflow@4.10.0` while `package:version` is `4.10.1`, plus the #646/#643 restatement checks finding two drifts instead of the one they inject; why advisory: byte-identical failure at base (20 pass / 4 fail on both sides), none of the cited bytes touched by this diff (train-split/pin-watch owners). (2) `scripts/roadmap-settle.test.mjs:78` — live-tree slug-mismatch `docs/features/98-deterministic-tool-doctor/SPEC.md:1` (doc folder vs row `finding-severity-ladder`); why advisory: identical at base (9 pass / 1 fail on both sides), no violation on row 701. (3) `scripts/unit-doc-contract.test.mjs:442` — #462 `4.10.0 !== 4.10.1` train split; why advisory: declared in the unit's Known pre-existing issues and reproduced at base (20 pass / 1 fail on both sides). (4) `packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs:121` — shape-fall diagnosis: a spec-by-reference doc missing `## Next` reports `DEFECT heading-order — ## Acceptance criteria … (the settled shape)` instead of naming the missing section (the owner selector's verdict under the resolved shape; the output does disclose `shape settled`), and a consumer install resolves published `@gtrabanco/agentic-workflow-schema@4.10.0`, which lacks the `settled` key this workspace's schema@4.10.0 carries (`npm pack` proof), so consumer shape-fall wording differs from this repo's; why advisory: AC3 contracts the owner selector as the single opinion, and the divergence's root cause is the pre-existing D-40-14 train split the unit already declares.
Sibling sweep: 1 hit — `scripts/findings-corpus.test.mjs:186` (frozen 1165 survives as the old truth; it is blocker 1). Otherwise clean: the four usage lines are pure `scaffold-contract|` insertions (base line == head line with the token stripped, 4/4); `runner.dispatch` closed table, `RUNNER.md:160` and `README:27`/`:81` updated together; `ROADMAP.md:213`, `docs/generated/units.md` and the `SKILL_CONTEXT_BUDGETS.json` re-basis are in sync (`docs-generate --check` PASS); no surviving claim that the comparator cannot reach a consumer; no second `SCAFFOLD OK — <n> surface(s) match` outside the SPEC.
Completeness: S1–S8 and S10 resolve to P1–P6 with `(Implements: S#)` and their validators re-ran green here — scaffold-contract 17/0, `cli.surface`+`runner.dispatch`+`runner.distribution` 16/0, `scaffold-parity` 17/0 (= base 17/0), `unit-doc-contract` 20/1 (= base 20/1), `scaffold-guide` 9/0, `promise-coherence` 37/0, `check-skill-context` PASS (30 skills) and `--documents` PASS (7 documents), `docs-generate --check` PASS, `npx skills add . --list` lists every skill, and P1's red corpus is recorded at `4084680f6` (Log L6); S9 carries a recorded disposition (Log L3 and `## Next`: the PR opens after this external verify). Obligations: O1, O2, O4–O11 `verified` and every validator re-ran green (O9 `rg -c '^## Triaged steps$' docs/fix/_TEMPLATE/SPEC.md` → 1; O11 `rg -c 'scaffold-contract' skills/init-workspace/references/UPGRADE.md` → 3; O8 counts match the base); O3 open (blocker 2). Open ids: O3.
Spot check: `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` → match (17 pass · 0 fail, equals the reported O1/O3/O4/O10 evidence).
Verdict: NEEDS-DECISION (3 open blockers)

## Addendum — 2026-11-23 — correction batch (owner order)

Owner instruction, verbatim: "Apply to this repository: triage and fix those
that deserve to fix but understand the context before fix and check you haven't
broke another different thing, if you have done, start the loop again until you
fixed full symbol/related stuff"

Applied against this receipt: 3 blockers fixed, advisory 1 fixed at its single
root, advisories 2–4 triaged (2 reported · 3–4 wontfix). The verdict above
stands until the owner's recheck; this block records the batch, it is not a
verdict.

- **Blocker 1 folded** — `scripts/findings-corpus.test.mjs` re-freezes
  1165 → 1166 (header comment included) with the `decisions.md` justification
  row — the fix/693 precedent; `bun test scripts/findings-corpus.test.mjs` →
  15 pass / 0 fail (= its base count).
- **Blocker 2 folded** — the missing corpus case landed (`#701 authoring
  reports a duplicate section and an out-of-order section`): five authoring
  cases now, the count O3's validator names, and the seven
  `scaffold-contract suite` evidence cells re-frozen 17 → 18;
  `bun test packages/agentic-workflow/test/scaffold-contract.test.mjs` →
  18 pass / 0 fail.
- **Blocker 3 folded** — AC1's quoted observable rewritten to the block the
  command actually prints (`SURFACE … — MATCH` rows, then
  `verdict SCAFFOLD OK` / `verdict SCAFFOLD ABSENT`), and the dispatch case
  now asserts both lines, so AC1's "Proved by" names an assertion that exists.
- **Advisory 1 folded** — the single stale literal behind all four
  `normative-drift` failures (`AGENTS.md` rendered-facts row `@4.10.0` vs the
  crate's `4.10.1`) re-pinned to follow its machine; `bun test
  scripts/normative-drift.test.mjs` → 24 pass / 0 fail.
- **Advisories 2–4 triaged** — 2 **reported, not repaired** (owner decision:
  which registration wins the roadmap 98/99/100 collision; grounds in the
  unit's `decisions.md` D1 — the `roadmap` CLI has no delete/renumber operation
  and AGENTS §7 forbids a hand-edited index); 3 **wontfix** under D-40-14
  (declared in Known pre-existing issues, reproduced at base); 4 **wontfix**
  (owner-selector verdict per AC3; the published-schema `settled` divergence
  recorded under Known pre-existing issues with its `npm pack` evidence).
- **Recheck (S6/S8)** — root suite → exit 1 carrying exactly the two declared
  wontfix reds (`roadmap-settle` 9 pass / 1 fail, `unit-doc-contract` 20 pass /
  1 fail): 139 PASS against this receipt's 137 PASS / 4 FAIL —
  findings-corpus and normative-drift flipped green, no PASS→FAIL movement.
  Crate suite 1441 pass / 0 fail; `cli.surface`+`runner.dispatch`+
  `runner.distribution` 16 pass / 0 fail (O2); `scaffold-parity` 17 / 0;
  `promise-coherence` 37 / 0; `check-skill-context` PASS (30 skills) and
  `--documents` PASS (7 documents); `docs-generate --check` PASS;
  `runner verify <SPEC>` → `ok: true`, no violations (obligations-closure,
  log-kinds, cited-paths all hold); `bun scripts/test-impact.mjs --base
  origin/main` → targeted, 288 suites, covered by the root + crate runs.
- **Commits** — `7d1634811` (blocker 1) · `1a372fb15` (blocker 2) ·
  `cb5260ffa` (blocker 3 + ledger counts + decisions) · `073abe41a`
  (advisory 1) · this receipt.
- **Scratch** — every batch probe ran under `mktemp -d`; the live tree carries
  only these committed changes (`git status --porcelain` clean at handoff).
