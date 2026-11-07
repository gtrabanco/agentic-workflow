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

## Next

Owner's external verification (§8 of the applied workflow): review the diff on `feat/440-product-audit-rescope`, run any validator you distrust, then decide merge. Two owner findings ride along: (1) `pi-compat-guard` red at main (pre-existing — the guard type-checks a published package that predates the unpublished journal modules); (2) the journal writer-side fragment-name validation gap (F1).

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
