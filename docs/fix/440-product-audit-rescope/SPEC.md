---
type: fix
scope: medium
---

# fix/440-product-audit-rescope

> Re-scope `product-audit` to deterministic-first dimensions, measured triggers
> and profile-aware scope, per issue #440 (design note 13 of #307). Applied with
> the owner's local unpublished workflow: ledgers frozen here (§5), RED tests
> before implementation (§2/§6), no lane machinery runs on this surgery (§4).

## Issue

`#440` — [ISSUE: product-audit re-scope — deterministic-first dimensions, measured triggers, profile-aware scope](https://github.com/gtrabanco/agentic-workflow/issues/440). The PR closes it via `Closes #440`.

## Specs

Requirements, each numbered `S#`, quoting the requester's words verbatim. S1 is
the session request; S2–S6 are quoted verbatim from issue #440's `## Expected
behaviour`, which S1 applies to this repository.

**S1 — Apply issue #440 to this repository.**
> Apply to this repository: issue #440

**S2 — Dimension pre-pass (issue §Expected behaviour 1).**
> **Dimension pre-pass**: every audit dimension starts by consuming its deterministic producer's output where one exists (dependency advisories — already in the local gate, per-language dead-code linters — #436 profile slot, pin/posture checks). Receipt-quoted, never re-run by the model; only the non-mechanizable remainder is model-swept (the review-axis pattern of #359).

**S3 — Profile-aware scope (issue §Expected behaviour 2).**
> **Profile-aware scope** (#436): dimensions not declared by the project's ceremony profile are recorded `n/a — <reason>` instead of swept; keeps one-shot/organic repos from paying full-audit ceremony.

**S4 — Measured triggers (issue §Expected behaviour 3).**
> **Measured triggers**: the audit fires on drift signals (`audit-docs` findings above the corpus band — note 12), threshold debt (accumulated orphans / ARW below band — note 11; #437), or explicit owner request. An under-threshold invocation returns the `insufficient-corpus` verdict instead of inventing findings or figures.

**S5 — Findings typed 1:1 with review's vocabulary; route cell is a resolver hand-off (issue §Expected behaviour 4).**
> **Findings stay user-decision-only** (contract unchanged: never fixes or files) but go **typed 1:1 with review's finding vocabulary**, so triage consumes them without a mapping layer; the route cell names resolver hand-offs (the note-7 single-input verbs), never bespoke prose routes.

**S6 — Proposals only, unchanged (issue §Expected behaviour 5).**
> **`--fix`/actionability**: unchanged — proposals only; anything actionable routes to the lane.

Issue assumptions, marked as assumptions (never requirements): (a) `ceremony-profile@1`
(#436) is not in-tree yet — S3 is implemented consumption-side; the grammar
extension itself rides #436 (issue `## Path`: "the profile grammar extension
rides #436"); (b) #437's bands are undefined — thresholds are referenced as
supplied by #437, never invented (issue `## Path`: "thresholds stay undefined
until #437 supplies the measured bands").

## Impact

- **Surfaces changed:** `skills/product-audit/SKILL.md`, `skills/product-audit/references/AUDIT_DIMENSIONS.md`, `skills/product-audit/references/AUDIT_PROCESS.md`, `AGENTS.md` (two new `normative-surfaces@1` rows), `scripts/scaffold-parity.test.mjs` (its route-cell pin moves to the new grammar — the pin changes because S5 changes the surface, recorded in `## Log`, never silently), new `scripts/product-audit-rescope.test.mjs`.
- **Consumers:** `triage-issue` (consumes the finding set — vocabulary unchanged, so no consumer change); `workflow-status` (`scripts/workflow-status.mjs:95` recommends `/product-audit` — invocation surface unchanged); `docs/workflow/SKILLS.md` + `README.md` narrative rows describing the cadence (updated, documentation currency ships with the unit); `next-recommendations.test.mjs` (finding-set pins — unchanged behaviour).
- **Pins that constrain the edit (verified in-tree):** `scripts/review-loop-discipline.test.mjs` IS-2 (closed class set, `audit-docs checks mechanically` citation), `scripts/residue-dimensions.test.mjs` (residue sweep declarations), `scripts/next-recommendations.test.mjs` (complete finding sets), `scripts/scaffold-parity.test.mjs` (route cell, progressive-loading rule stated once, only-mutation guardrails).
- **Nothing live is executed against the repo by the change itself:** the new
  test file is the only new script-shaped artifact and it is pure text
  assertions; the residue fixture generator is untouched.

## Retirements

- The periodic cadence language in `skills/product-audit/SKILL.md` ("Periodically (every few features)…", "periodic" in the relationship diagram) — retired by S4's measured triggers.
- The bespoke prose route cell **of the finding line** (`route: #64 (atomicity/split
  rules)` as the finding-line grammar, with `route: <the next command for this
  finding …>` as its placeholder) — retired by S5's resolver hand-off grammar
  (`finding-route@1`); the `→ Next:` batch hand-off stays (it is a closing
  hand-off, not the route cell), and so do the four **proposal-stream** `route:`
  cells (`route: /triage-issue <id> F<k>` and its siblings), which are proposals
  naming the command that files them — the stream's own shape since #355, never
  the finding-line grammar S5 re-scopes (qualified 2026-11-07 by the external
  verify's advisory 4: the bullet as written read as retiring a literal that was
  never in its scope; the bytes, not the intent, were correct).
- Evidence after the edits land: `rg -n "Periodically|periodic" skills/product-audit/` → only the measured-trigger prose may name the retired cadence as history, and the route cell carries `finding-route@1` verbs.

## Non-goals

- No removal of product-audit's unique surfaces (repo-wide bug hunt, security research, broken-version investigation stay — issue `## Non-goals`).
- No auto-filing, no auto-fixing, no scheduled calendar run (issue `## Non-goals`).
- No verdict vocabulary of its own for findings — review's finding grammar (`review-implementation/references/CLASSIFY.md`) stays the single owner; `insufficient-corpus` is the invocation verdict of the trigger grammar, not a finding class.
- No `ceremony-profile@1` grammar (rides #436) and no threshold bands (ride #437) — this unit consumes, it never defines.
- No changes to the schema package (no envelope/vocabulary change is introduced).

## Risk tier

- **`standard`** · **Task Size** — `understood: yes · contained · resumable-from-diff: yes` (verdict `risk-tier-verdict@1` computed on the empty tree before the diff exists: "the change names no path, so nothing proves it inert — fail closed upward"; recomputed on the finished diff in the Evidence — no escalating signals expected: prose + text-assertion test files only)
- **Named high-risk item** — `none — not a high-tier unit`

## Acceptance criteria

One observable, testable criterion per S#, frozen at cut (§5). These anchor the per-criterion coverage review.

- **AC-S1** — The unit is applied: every S2–S6 criterion below passes its named check, the touched deterministic gates pass, and the diff is handed to the owner — the owner is the external verifier. Check: the `## Log` evidence lines exist for every command in `## Obligations`.
- **AC-S2** — Every audit dimension starts by consuming its deterministic producer's output where one exists, receipt-quoted and never re-run by the model; only the non-mechanizable remainder is model-swept. Check: `bun test scripts/product-audit-rescope.test.mjs` exits 0 and its pre-pass pin matches `AUDIT_DIMENSIONS.md` (producer column + receipt-quoted-only rule).
- **AC-S3** — Dimensions not declared by the project's ceremony profile are recorded `n/a — <reason>` instead of swept (consumption-side; profile grammar itself is #436's). Check: the same suite's profile pin matches.
- **AC-S4** — The audit fires on drift signals, threshold debt, or explicit owner request — never a calendar cadence — and an under-threshold invocation returns the `insufficient-corpus` verdict instead of inventing findings or figures; the trigger grammar is a declared normative surface (`audit-trigger@1`). Check: the suite's cadence + verdict pins match `SKILL.md`, and `bun test scripts/normative-drift.test.mjs` exits 0 with the new row present.
- **AC-S5** — Findings carry review's finding vocabulary 1:1 (no mapping layer) and the route cell names resolver hand-offs (the note-7 single-input verbs) via the `finding-route@1` grammar, never bespoke prose routes. Check: the suite's route pin matches, `bun test scripts/scaffold-parity.test.mjs` exits 0 (its updated pin) and `bun test scripts/review-loop-discipline.test.mjs` exits 0 (closed class set intact).
- **AC-S6** — The proposals-only contract is unchanged: never fixes, never files, report file is the only mutation. Check: `bun test scripts/scaffold-parity.test.mjs` exits 0 (the only-mutation and progressive-loading pins) and `rg -c "Never auto-fixes, never opens issues" skills/product-audit/SKILL.md` matches 1.

## Future

none — nothing was deferred; #436 and #437 carry their own roadmap rows and this unit only consumes their future surfaces.

## Future cost

- The `finding-route@1` and `audit-trigger@1` grammar blocks in `skills/product-audit/SKILL.md` must stay in sync with note-7's verb set and #437's bands: any change to either upstream surface updates the blocks in the same PR (binds the skill's maintainers).

## Applicable tests

`scripts/product-audit-rescope.test.mjs` (new, red-first) + the touched suites named in the obligations: `scaffold-parity`, `review-loop-discipline`, `residue-dimensions`, `next-recommendations`, `normative-drift`, `check-skill-context`.

## Known pre-existing issues

- #436 (ceremony-profile@1) and #437 (bands) are open — affects S3/S4 consumption-side only; this unit never invents their grammar.
- `docs/workflow/SKILLS.md` line 217 and `README.md` line 119 still describe the periodic cadence — affects this unit (they are the surfaces this unit updates).

## Tasks

- P1 — RED: add `scripts/product-audit-rescope.test.mjs` pinning the frozen-failure corpus (FF1 cadence, FF2 pre-pass, FF3 route grammar) plus the profile, residual-states and 1:1-vocabulary pins; observe it fail on the unmodified skill (validator: `bun test scripts/product-audit-rescope.test.mjs` exits 1 at the red commit) (Implements: S2, S3, S4, S5)
- P2 — `SKILL.md`: replace the periodic cadence with the measured triggers + `audit-trigger@1` grammar block + `insufficient-corpus` verdict, turn-contract allowance for the verdict, relationship-diagram cadence fix (validator: `bun test scripts/product-audit-rescope.test.mjs` exits 0 on the cadence/verdict pins) (Implements: S4, S1)
- P3 — `SKILL.md`: route cell becomes `finding-route@1` (note-7 verbs); `AGENTS.md` gains the two `normative-surfaces@1` rows; `scaffold-parity.test.mjs`'s route pin moves to the new grammar (validator: `bun test scripts/normative-drift.test.mjs` exits 0 and `bun test scripts/scaffold-parity.test.mjs` exits 0) (Implements: S5)
- P4 — `AUDIT_DIMENSIONS.md`: deterministic-producer pre-pass rule + producer column, profile-aware `n/a` rule, #438 residual-states reuse pointer (validator: `bun test scripts/product-audit-rescope.test.mjs` exits 0 on the pre-pass/profile pins and `bun test scripts/residue-dimensions.test.mjs` exits 0) (Implements: S2, S3)
- P5 — `AUDIT_PROCESS.md`: pre-pass step inserted before the sweep step; route prose points at `finding-route@1`; deciding-never-executing rule preserved (validator: `bun test scripts/product-audit-rescope.test.mjs` exits 0 and `bun test scripts/scaffold-parity.test.mjs` exits 0) (Implements: S2, S5)
- P6 — Docs and indexes ship with the change: roadmap `## Fixes` row, `docs/workflow/SKILLS.md` + `README.md` cadence currency, changeset via `bun scripts/changeset-create.mjs`, `docs/LOGS.md` session entry (validator: `bun scripts/docs-generate.mjs --check` exits 0) (Implements: S1)
- P7 — Verification: tier recomputed on the finished diff, all declared gates run in the foreground, obligations ledger closed, evidence recorded (validator: `bun scripts/local-gate.mjs` exits 0) (Implements: S1)

### Planning evidence

M-size unit — the ledger lives in `planning-evidence.md` beside this doc.

### Obligations

M-size unit — the ledger lives in `planning-obligations.md` beside this doc.

## Triaged steps

```
TRIAGE — 440-product-audit-rescope (fix)
Steps: plan, implement, tests, evidence, review, docs
Tiers: plan: cheap, implement: cheap, tests: strong, evidence: strong, review: strong, docs: cheap
Skipped: research: trivial scope, design: trivial scope, release: not a feature
Budget: strong
```

Applied with the owner's local workflow: the plan step is substituted by the
frozen ledgers (this doc + `planning-obligations.md` + `planning-evidence.md`);
the review step is the owner's external verification — no lane machinery runs
on this unit (review-change/fold cycles are excluded by the workflow's §4), so
the steps run inline in the `## Tasks` order P1–P7.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-07, the request, verbatim:
  ```
  Apply to this repository: issue #440
  ```
  (S2–S6 quoted verbatim from issue #440 `## Expected behaviour`; see `## Specs`.)
- **P1** — 2026-11-07, ledgers frozen (SPEC + planning-evidence + planning-obligations + roadmap Fixes row) · `8dbc9e76`.
- **E1** — 2026-11-07, `bun test scripts/product-audit-rescope.test.mjs` · exit 1 · 12 fail / 2 pass on the unmodified skill — the frozen-failure corpus (FF1 cadence, FF2 pre-pass, FF3 route grammar) observed red · commit `c7478da0`.
- **E2** — 2026-11-07, `bun test scripts/product-audit-rescope.test.mjs` · exit 0 · 14 pass / 0 fail after implementation.
- **E3** — 2026-11-07, `bun test scripts/scaffold-parity.test.mjs scripts/review-loop-discipline.test.mjs scripts/residue-dimensions.test.mjs scripts/next-recommendations.test.mjs scripts/normative-drift.test.mjs` · exit 0 · 75 pass / 0 fail (the moved route pin and all untouched behavior pins).
- **E4** — 2026-11-07, differential: the same five suites run against a `git archive` of base `e1d94057` in scratch · all PASS at base — every stdout difference at head is a requested one (the moved `route:` pin follows S5).
- **P2** — 2026-11-07, measured triggers + `audit-trigger@1` + `insufficient-corpus` verdict + route grammar + pre-pass/profile/residual-states sections · `e2dacec7`.
- **E5** — 2026-11-07, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 0 file(s), verdict: PASS`.
- **E6** — 2026-11-07, `bun scripts/check-skill-context.mjs --routes` · exit 0 · `PASS route budgets: 14 routes`. `--budgets` initially failed (skill grew past 3192 est / 240 lines; AUDIT_DIMENSIONS past 2200 est); ceilings re-based at the declared formula — ceil(3876 × 1.10) = 4264, ceil(288 × 1.10) = 317, ceil(2493 × 1.10) = 2743 — growth source declared in `SKILL_CONTEXT_BUDGETS.json` · re-run exit 0 · `PASS context budgets: 28 skills`.
- **E7** — 2026-11-07, `bun scripts/check-skill-context.mjs --documents` · initially failed `machine-table lines 111 != declared 109` (the two new normative-surfaces rows); `machineLines` re-pinned to 111 with its source row · re-run exit 0 · `PASS context documents: 4 budgeted documents`.
- **E8** — 2026-11-07, `bun scripts/changeset-create.mjs` · exit 0 · minor (feat) · `lint-changeset.mjs` ok. `bun scripts/docs-generate.mjs` · exit 0 · `1 written` · `--check` · exit 0 · `verdict: PASS` · `e7ed0eb1`.
- **E9** — 2026-11-07, `bun scripts/ceremony.mjs tier classify` · on the finished diff · `tier: standard`, reason `2 path(s) carry executable content` (the two test files), `signals: []` — matches the frozen tier.
- **E10** — 2026-11-07, `bun scripts/test-impact.mjs --base main` · exit 0 · `verdict: targeted`, 2 executable paths, 1 suite; the touched-by-content suites were all run (E3).
- **E11** — 2026-11-07, `bun scripts/local-gate.mjs --skip-network` · exit 0 · `VERDICT: PASS` after the two budget re-pins and the gate-inventory claim (see E14). `workspace-install` / `dependency-pin-gate` / `dependency-advisories` · exit 0 (advisories: report-only, 4 blocking rows classified, never fatal).
- **F1** — 2026-11-07, pre-existing defect found while running the gate (not a review class, recorded here for honesty): the committed journal fragment `20261107T001707Z-direction-review-odd-hybrid-design-notes-manual.md` violates `fragment-name@1` — no `(mechanical|narrative)` kind token — so `parseFragmentName` refuses it and journal.surfaces S15 fails at the merge-base too (reproduced on the base copy). Its content is already rendered into `docs/LOGS.md` (`9b27fab9`); repaired by renaming the committed file to the contract shape (`...-design-notes-narrative-manual.md`), bytes untouched · `a4110a4d`. Owner finding: the writer that produced that fragment bypassed the fragment-name contract — a writer-side validation gap outside this unit's scope.
- **E12** — 2026-11-07, `bun scripts/run-root-suite.mjs --jobs 1` · exit 0 · 88 suites PASS, 0 FAIL at head. (The default parallel pool showed random unrelated failures in this container — red-first, unit-route, ceremony-*, docs-generate, diff-guard — each green standalone and green in the base copy's own pool run; environmental, not caused by this diff.)
- **E13** — 2026-11-07, `bun scripts/local-gate.mjs --only pi-compat-guard` at head · exit 1 · TS2307 (`@gtrabanco/agentic-workflow/src/log/render.mjs` etc. not found — the guard type-checks against the published package, which predates the unpublished journal feature), and the identical failure observed at the base commit — pre-existing, differential-proven, excluded from this unit's verdict.
- **E14** — 2026-11-07, `bun test scripts/prose-gate-inventory.test.mjs` · initially failed `uncited-surface` ×2 (`product-audit-trigger`, `product-audit-finding-route` claimed by no row); both ids added to the `normative-surface-grammar` row's claim list in `docs/workflow/GATE_INVENTORY.md` · re-run exit 0 · 21 pass.
- **P3** — 2026-11-07, budget re-bases + gate-inventory claims + journal rename · `a4110a4d` + the closing docs commit.
- **R1** — 2026-11-07, external verify · `HEAD 9ca435b8` against base `e1d94057` · verdict **NEEDS-DECISION (6 open blockers)** · cycle 1 · gate exit 0 (`local-gate --skip-network` PASS 8/8, root-suite exit 0) — the verbatim receipt is `external-verify.md` beside this doc; all declared validators and the red-first differential reproduced there.
- **L2** — 2026-11-07, the correction, verbatim:
  ```
  Todos los findings parecen legítimos, arreglalos
  ```
  (owner instruction after R1; recorded with its decision rows and path-protection
  records in `decisions.md` — D-440-1…D-440-4.)
- **F2** — 2026-11-07, the six blockers of R1 folded as one correction batch, one
  root cause (the cadence S4 retired kept being asserted by its surviving mentions):
  `skills/product-audit/SKILL.md:261` · `skills/audit-pr/SKILL.md:212` ·
  `skills/review-change/SKILL.md:218` · `docs/workflow/README.md:61` ·
  `docs/workflow/README.md:85` · `docs/workflow/PORTABLE_PROMPT.md:163` — each now
  carries the measured-trigger wording `audit-trigger@1` declares. Red commit
  `73bbc0b5` (the new sweep case observed failing: exit 1 · 15 tests · 14 pass /
  1 fail, the single failure naming exactly those six mentions and nothing else),
  green commit `68549fe0`. O1's frozen outcome ("the periodic prose is retired")
  now reproduces tree-wide, and the class is mechanized so it cannot recur; the
  dated records stay untouched by declaration (D-440-2: `docs/workflow/MIGRATION.md`,
  `docs/design/REDESIGN.md`, `docs/features/09-…/SPEC.md`, and `CHANGELOG.md`'s
  1.0.0 row, which the verify's sweep had not named). No finding row persists in
  `## Findings` — a folded row leaves the table and becomes this line.
- **E15** — 2026-11-07, `bun test scripts/product-audit-rescope.test.mjs` · exit 0 · 15 pass / 0 fail at `68549fe0`.
- **E16** — 2026-11-07, `bun test scripts/scaffold-parity.test.mjs scripts/review-loop-discipline.test.mjs scripts/residue-dimensions.test.mjs scripts/next-recommendations.test.mjs scripts/normative-drift.test.mjs scripts/prose-gate-inventory.test.mjs scripts/red-first.test.mjs` · exit 0 · 105 pass / 0 fail (the sibling-sweep class re-checked where its pins live).
- **E17** — 2026-11-07, `bun scripts/skill-lint.mjs` · exit 0 · `0 finding(s) in 0 file(s), verdict: PASS`; `bun scripts/check-skill-context.mjs --budgets` · exit 0 · `PASS context budgets: 28 skills` (product-audit 3878 est / 288 lines, inside the unchanged 4264 / 317 ceilings — the batch is word-level, no ceiling moved); `--routes` · exit 0; `--documents` · exit 0 · `PASS context documents: 4 budgeted documents`; `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS`.
- **E18** — 2026-11-07, advisory 6's correction (append, never rewrite E10): `bun scripts/test-impact.mjs --base main` at `9ca435b8` · exit 0 · `verdict: targeted`, **3** executable paths, **4** suites (`check-skill-context`, `guide-split`, `product-audit-rescope`, `promise-coherence`) — E10's recorded "2 paths / 1 suite" was captured before the last commits landed; the verdict reproduces and all four suites run green here, so O10's validator holds.
- **E19** — 2026-11-07, advisory 5's differential re-run: `bun scripts/local-gate.mjs --only pi-compat-guard` · exit 1 · 4× TS2307 (`@gtrabanco/agentic-workflow/src/log/render.mjs`, `…/log/publish.mjs`, `…/journal/fragment.mjs`) at head; the guard's inputs are byte-identical at base (`git diff e1d94057..9ca435b8 -- packages/` → empty), so it is pre-existing at `main` and never a defect of this unit — disposition `n/a` here, it rides the owner triage named in `## Next`.
- **E20** — 2026-11-07, the growth this batch caused, disclosed rather than smoothed:
  `bun scripts/check-skill-context.mjs --routes --json` · exit 1 · two failures —
  `audit-pr:feature` and `audit-pr:fix`: declared ceiling 11175 < ceil(10161 × 1.10)
  = 11178, because the batch's own wording fix ("the periodic, product-wide full
  sweep" → "the measured-trigger, product-wide full sweep") grew `audit-pr`'s SKILL.md
  by two rounding units — re-based in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` at the
  declared formula with the growth source named · re-run `--routes --json` · exit 0 ·
  `failures: []`; `--routes` · exit 0 · `PASS route budgets: 14 routes`. E17's `--routes`
  line was captured before the prose fix landed, so it is corrected by this appended
  line, never in place. Root suite after the re-basis: `bun scripts/run-root-suite.mjs
  --jobs 1` · exit 0 · all suites PASS.
- **R2** — 2026-11-07, blockers-only recheck of the batch · `HEAD 078895bb` against base `e1d94057`, delta scope `9ca435b8..078895bb` · verdict **NEEDS-DECISION (1 open blocker)** · cycle 2 · gate exit 0 — the receipt is the second block in `external-verify.md`. Independence disclosed there: this round was run by the session that implemented the batch, so its verdict is evidence-complete but not independence-clean.
- **V1** — 2026-11-07, the six blockers of R1 re-checked and **all closed**: the six lines read the trigger grammar's own wording (`skills/product-audit/SKILL.md:261`, `skills/audit-pr/SKILL.md:212`, `skills/review-change/SKILL.md:218`, `docs/workflow/README.md:61` and `:85`, `docs/workflow/PORTABLE_PROMPT.md:163`); the independent grep (not the sweep) returns no retired-cadence claim on any live surface outside the declared dated records; the advisories' dispositions all reproduce — the historical files show zero diff (`git diff --name-only origin/main...HEAD` names none of them), `packages/` shows zero diff (advisory 5's `n/a` holds), E10 and E17 are byte-identical to before the batch (the append-only rule held: the only removed lines in this doc are the retirement bullet and the `## Next` paragraph, both prose).
- **E21** — 2026-11-07, the new sweep is non-vacuous: a scratch copy (`mktemp -d`, never committed, removed) with `docs/workflow/PORTABLE_PROMPT.md:163` reverted to the retired literal · exit 1 · 14 pass / 1 fail, the failure naming exactly `docs/workflow/PORTABLE_PROMPT.md:163 … (periodic product-wide health check)` — the pin fires on the defect and on nothing else.
- **E22** — 2026-11-07, at `459ee056`: `bun scripts/local-gate.mjs --skip-network` · exit 0 · `PASS — 8 step(s)`, 88 root suites PASS; `bun test scripts/product-audit-rescope.test.mjs` · exit 0 · 15 pass / 0 fail; `bun test scripts/scaffold-parity.test.mjs` · exit 0 · 17 pass / 0 fail; `bun scripts/check-skill-context.mjs --routes --json` · exit 0 · `failures: []` over 14 routes.
- **F3** — 2026-11-07, the one blocker R2 found is folded (`459ee056`): the release intent under-declared the batch's own surface set. The rule is that the intent is derived from the PR's modified files, never hand-written (PE-007); the derivation over `origin/main...HEAD` named three skills (`audit-pr`, `product-audit`, `review-change`) while `.changeset/feat-440-…md` declared one. Verified after: `bun scripts/release.mjs plan` lists `audit-pr=minor`, `product-audit=minor`, `review-change=minor`; `bun scripts/lint-changeset.mjs <file>` · exit 0 · `ok`; `node scripts/version-parity-gate.mjs --content` · `VERDICT: PASS`. No gate caught it — the parity gate is satisfied by any declared entry of the Pi package's content source — which is why it is recorded as a finding of the recheck, not of the tooling.
- **E23** — 2026-11-07, pre-existing defect found while running the intent linter over the whole tree (recorded for honesty, not a class of this unit): `bun scripts/lint-changeset.mjs` · exit 0 with `error: 374-pluggable-session-journal.md: cites a repo path that does not exist: .agentic-workflow/journal-store/entries.db` — reproduced identically on a `git archive` of base `e1d94057` in scratch, so it is not caused by this branch; no gate runs the linter over the committed tree, only over fixtures. Rides the #374 intent file's own owner triage.
- **L3** — 2026-11-07, the second correction, verbatim:
  ```
  Repara los no plegados, los chageset deberían de tener lint propio y determinista
  ```
  (round 3: repair the advisories the recheck left reported, and give the release
  intents a deterministic lint of their own; decisions D-440-5…D-440-7.)
- **E24** — 2026-11-07, the red side of the rider: `bun test scripts/lint-changeset.test.mjs` · exit 1 · `(fail) the shipped repository's own pending intents all lint clean`, the message carrying `error: 374-pluggable-session-journal.md: cites a repo path that does not exist: .agentic-workflow/journal-store/entries.db`; `bun test scripts/version-parity-gate.test.mjs` · exit 1 · `(fail) content: skill entries that miss a changed skill are refused` (the rule did not exist, so the under-declared intent passed); `bun test scripts/product-audit-rescope.test.mjs` · exit 1 · `(fail) the narration states explicit invocation beside the measured triggers`, naming `README.md`. Red commit `6f3a224a`. E23's "exit 0" was read from a pipeline's last command, not from the script: the linter is fail-closed — `bun scripts/lint-changeset.mjs` alone exits 1 over that tree. Corrected by append here; the earlier line stays as recorded.
- **P4** — 2026-11-07, the owner-ordered rider lands (D-440-5…D-440-7): the `changeset-coverage` rule in `scripts/version-parity-gate.mjs`, the tree-level intent-lint case in `scripts/lint-changeset.test.mjs`, #374's dead citation repaired, the explicit-invocation qualifier restored in the two narration rows and pinned, the two budget source rows reworded so the retired literal is no longer quoted · `708b37b0`.
- **E25** — 2026-11-07, the green side: `bun test scripts/lint-changeset.test.mjs scripts/version-parity-gate.test.mjs scripts/product-audit-rescope.test.mjs` · exit 0 · 82 pass / 0 fail; `bun scripts/lint-changeset.mjs` · exit 0 (the whole committed `.changeset/` directory); `node scripts/version-parity-gate.mjs --content` · exit 0 · `VERDICT: PASS`; `bun scripts/check-skill-context.mjs --routes` / `--budgets` / `--documents` · exit 0; `bun scripts/skill-lint.mjs` · exit 0 · PASS; `bun scripts/docs-generate.mjs --check` · exit 0 · PASS.
- **E26** — 2026-11-07, the new rule judged against this PR's own bytes: the gate's pure core called in memory with the real `git diff --name-only origin/main...HEAD` set (no live file mutated) — intent as shipped → `changeset-intent`; the same intent truncated to its round-2 state (one skill entry) → `changeset-coverage`, naming `audit-pr, review-change`. The F3 class is now caught by a gate, not by a recheck.
- **F4** — 2026-11-07, the round-2 advisories are folded; none stays report-only: advisory 1 (the dropped explicit-invocation qualifier) restored in `README.md` and `docs/workflow/SKILLS.md` and pinned against the frontmatter that owns the constraint (D-440-7); advisory 2 (#374's dead path citation) repaired in its intent file with every claim kept (D-440-6); advisory 3 (the budget rows quoting the retired literal) reworded to name the change without re-quoting it. The gates that keep 1 and 2 from drifting again are D-440-5, shipped in the same rider.

## Scope rider (2026-11-07, owner-ordered)

L3 added work this unit did not plan, so it is declared rather than smuggled: two
deterministic gates over the release-intent surface (`changeset-coverage` in the
version-parity content gate; the tree-level changeset lint, now run by the root
suite), the repair of the pre-existing violation the new lint found in #374's pending
intent file, and the invocability-narration pin. None of it changes `product-audit`'s
behaviour, the trigger grammar or any vocabulary — it closes the classes that a
recheck had to catch by hand. Decisions D-440-5…D-440-7 and their path-protection
rows live in `decisions.md`; nothing is left for a later issue — the rider ships
complete or not at all.

## Next

Round 3's rider is complete and gated (`6f3a224a` red → `708b37b0` green, receipts
E24–E26): the six R1 blockers stay closed, the round-2 blocker and all three round-2
advisories are folded (F4), and the two intent classes now fail a gate instead of
waiting for a recheck. The next step is your merge decision on PR #445 at the
rider's head; an independence-clean pass over the delta scope is still recommended
(R2's disclosure), and it costs one command per suite (`product-audit-rescope`,
`lint-changeset`, `version-parity-gate`). Still open, none of them this unit's:
(1) `pi-compat-guard` red at `main` — pre-existing, differential-proven twice (E13,
E19), the guard type-checks a published package that predates the unpublished
journal modules; (2) the journal writer-side fragment-name validation gap (F1);
(3) the advisories kept by declaration — the dated records (D-440-2) and the
proposal-stream route cells (D-440-3); (4) the #374 intent file's dead path citation
(E23) — repaired in this branch's rider (F4), so it no longer rides anywhere; (5) the
narration loss R2 reported as advisory — likewise folded by F4, with a pin behind it.

## References

- Issue #440 (this unit), #307 design note 13 (the re-scope decision; fetched from the issue comment 2026-11-07), notes 7/8 (resolver verbs + outcome contract), note 11 (ARW bands), note 12 (audit-docs corpus band).
- Soft deps: #436 (ceremony-profile@1 grammar — rides its own unit), #437 (bands — rides its own unit), #359 (closed — the prose-gate pattern), #438 (residual states — open; referenced by name, vocabulary owned there).
- `docs/research/papers-sweep-2026-11-02.md`, `docs/research/papers-sweep-2026-11-06-merge-gates.md` (issue's in-repo anchors).

## Branch

`feat/440-product-audit-rescope`

## Depends on

none — the blocking set is empty (issue `## Dependencies`: "The skill re-scope itself needs nothing unfinished"); #436/#437/#438 are soft and consumed consumption-side.

## Regression scope

- The residue sweeps (dimensions, pass-only-if checklists, fixture contract): `bun test scripts/residue-dimensions.test.mjs` exits 0.
- The finding-line shape and progressive-loading rule: `bun test scripts/scaffold-parity.test.mjs` exits 0.
- The closed class set and audit-docs citation: `bun test scripts/review-loop-discipline.test.mjs` exits 0.
- Complete finding sets in hand-offs: `bun test scripts/next-recommendations.test.mjs` exits 0.
- Skill context budgets: `bun scripts/check-skill-context.mjs --routes` exits 0.
- Skill authoring lint: `bun scripts/skill-lint.mjs` exits 0.
- The retired-cadence sweep (the F51/F53 class the external verify reported): `bun test scripts/product-audit-rescope.test.mjs` exits 0 with the live-surface sweep case — no skill, tutorial page or the root README still asserts the periodic cadence.
- The release-intent gates (the round-3 rider): `bun test scripts/lint-changeset.test.mjs` exits 0 — including the case that lints this repository's own committed `.changeset/` directory — and `bun test scripts/version-parity-gate.test.mjs` exits 0 — including the `changeset-coverage` refusals and the package-level-entry exemption.
- The invocability narration pin: `bun test scripts/product-audit-rescope.test.mjs` exits 0 with the case binding `README.md`'s and `docs/workflow/SKILLS.md`'s product-audit rows to `disable-model-invocation: true`.
