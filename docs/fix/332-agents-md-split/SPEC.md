# fix/332-agents-md-split

> Fix specification — one single unit document, cut in the re-cut
> `spec-by-reference` shape from `docs/fix/_TEMPLATE/SPEC.md`. Size: **L** — the
> planning ledgers live beside this doc as `planning-evidence.md` and
> `planning-obligations.md` (never both embedded and separate).

## Issue

`#332` — NEW FEATURE: Split AGENTS.md into a core guide + progressive references.
The PR closes it via `Closes #332`.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. The frozen
request is L1; every later decision cites its `S#`.

**S1 — Goal: a short core plus an indexed deep-reference layer.**
> `AGENTS.md` is 453 lines / 29 KB loaded **in full by every agent session**, including ~155 lines of skill-authoring rules and ~100 lines of machine tables that only matter when touching gates/schemas, plus a Packages section only relevant to `packages/`. This unit turns it into a short core guide (~100–120 lines) plus an indexed "Deep references" layer under `docs/`, so context loads progressively instead of wholesale.

**S2 — The blocks that move are contracts, and their parsers move in the same PR.**
> **Constraint that shapes the design:** three of the big blocks are not prose — they are contracts parsed by tests. `scripts/normative-drift.test.mjs` pins `GUIDE_REL = "AGENTS.md"`, and `scripts/pre-execution-quality.test.mjs:1622-1624` asserts the normalizer inventory "is declared in exactly one file" via a hard-coded list `["AGENTS.md"]` (the test already computes a `homes` list, so relocation is supported by design). About 15 other scripts/skills read `AGENTS.md` (version-parity-gate, golden-fixture, pin-watch, vocabulary-probe, bump-skill, …). Every block that moves must update its parser in the same PR.

**S3 — Minimum-risk variant: the machine tables stay.**
> **Minimum-risk variant (recommended, see open questions):** the three machine-table blocks (normalizer inventory, normative surfaces, rendered facts) **stay** in `AGENTS.md` — they are the normative home of the gates — and only the prose blocks move.

**S4 — Business value: progressive loading.**
> Every session on this repo (and any project adopting the scaffold) pays 29 KB before reading a single file; the authoring rules are dead weight for execution sessions and the packages section is dead weight for skills sessions. Progressive loading keeps the always-needed core while making the deep references one hop away — and makes the check-skill-context discipline apply to the guide layer too.

**S5 — In scope.**
> - `docs/workflow/SKILL_AUTHORING.md`: the "Authoring a skill" block + hand-off/model-tier composition rules (AGENTS.md lines ~82–236).
> - Packages guidance → a reference doc (e.g. `docs/reference/PACKAGES.md` or folded into an existing doc), replaced in AGENTS.md by a pointer.
> - `AGENTS.md` core: intro, layout, working rules, verification, conventions, skills index — plus a new "Deep references" index section linking the extracted docs.
> - Parser updates in the same PR for anything relocated: `scripts/normative-drift.test.mjs` (`GUIDE_REL`) and the `homes` assertion in `scripts/pre-execution-quality.test.mjs` **only if** a machine block moves (default variant: no change needed).
> - `scripts/check-skill-context.mjs` budget coverage extended to the new reference docs.
> - Sweep for the ~15 known `AGENTS.md` readers (grep inventory listed in the unit SPEC) to confirm none assumes relocated prose.
> - Update the rendered-facts/README cells if any count changes (`**N user-facing skills**` style claims are machine-checked).

**S6 — Out of scope.**
> - Setup/update tooling and the setup doc (own unit, opened immediately before this one).
> - Rewriting the content of the rules — this is a relocation, not a re-authoring; wording changes are limited to transition sentences and the new index section.
> - Moving the machine-table blocks (default variant; see open questions).

**S7 — Acceptance criteria.**
> - `AGENTS.md` ≤ ~120 lines and contains an explicit "Deep references" index with working links to every extracted doc.
> - `node --test scripts/*.test.mjs` green — in particular `normative-drift.test.mjs`, `pre-execution-quality.test.mjs` (its single-file declaration assertion holds for whichever file owns each block), `version-parity-gate`, `golden-fixture`.
> - `bun scripts/check-skill-context.mjs` passes with budgets covering the new docs.
> - Every relocated section is reachable from `AGENTS.md` in one hop; no duplicated content between the core and the references (grep-verified in a test or documented as a known-issue).
> - The unit SPEC lists the full inventory of `AGENTS.md` readers with per-reader verdict (affected / not affected).

**S8 — Open questions / risks, and their resolution.**
> - Machine blocks in or out? Default keeps them in `AGENTS.md`; moving them requires touching the two parser pinpoints above and re-auditing the ~15 readers — do it only if review argues the context savings justify it.
> - `docs/reference/` is a new top-level docs folder; alternative is `docs/workflow/` to avoid a new directory. Decide at design time against the documentation map.

Resolved in this unit, citing the requester: **S3/A1** keeps the machine blocks in
`AGENTS.md` (the issue's own default); **S8/A2** places both reference docs under
`docs/workflow/`, whose map row already exists and whose index test makes an
unlisted file fail closed. Both are recorded in `decisions.md`.

**S9 — Revision item P1: recompute the size figures at design time.**
> **P1** Recompute this unit's size figures at design time: 483 lines / 32,481 B today, not the 453 / 29 KB recorded above — the report drifted while the unit waited.

**S10 — Revision item P2: a documentation map in the core guide.**
> **P2** Add a `Documentation map` table (7-9 rows) to the core guide; `docs/workflow/README.md` keeps owning the pages index and gains the inbound link.

**S11 — Revision item P3: instruction precedence.**
> **P3** Add `Instruction precedence`, and pick the order explicitly — candidate A: prompt > nearest `AGENTS.md` > personal `~/AGENTS.md` > docs; candidate B: prompt > personal > project > docs.

Resolved by the requester in this session (D4): **candidate A**.

**S12 — Revision item P4: one home per duplicate, plus a pointer.**
> **P4** Collapse each duplicate in items 1-4 to one home plus a pointer.

**S13 — Revision item P5: complete the layout block.**
> **P5** Complete the layout block (item 11).

**S14 — Revision item P6: state the runtime split as measured.**
> **P6** State the runtime split as measured (item 8) and hand the `node → bun` sweep to #329 with that carve-out written down.

**S15 — Revision item P7: the testing line.**
> **P7** Add the testing line (item 9): sibling `*.test.mjs`, tests never edited to pass.

**S16 — Revision item P8: the session-log hand-off.**
> **P8** Add the `docs/LOGS.md` / `log-session` hand-off line (item 10).

**S17 — Revision item P9: a restatement must name its owner.**
> **P9** Add one authoring rule: *a restatement must name its owner* — before a rule enters the guide, find the owning skill/doc and link it. That is the defect class behind items 2 and 3, and what keeps the file from growing back after the split.

**S18 — Revision item P10: the template tree is not a parity target.**
> **P10** Record the scope boundary above in this unit's SPEC: `template/AGENTS.md` is `init-workspace`'s substrate, never a parity target; a rule of ours reaches it only as an interview question with a default. (Replaces the earlier "scaffold parity" item, which was a wrong framing.)

**S19 — Scaffold defect T1: a mid-document H1 and a hidden block.**
> **T1** `template/AGENTS.md:48` — `# Docs site` is an **H1** in the middle of the document, so every later section nests under it; lines 50-57 hide the optional block inside an HTML comment, invisible in rendered Markdown. Make it an `##` section that is visibly optional.

**S20 — Scaffold defect T2: a tombstone row in the map.**
> **T2** `template/AGENTS.md:46` — the documentation map ships a tombstone row, `Generated developer docs | *(deprecated — generate-docs skill removed)*`. A fresh scaffold should not carry dead rows.

**S21 — Scaffold defect T3: vendor-specific hooks in a neutral scaffold.**
> **T3** `template/AGENTS.md:42,378-380` — the session-log section hard-wires Claude Code hooks (`.claude/`, `.claude/settings.json.example`) in a vendor-neutral scaffold, contradicting this repo's own portability rule. It must declare the adapters (`init-workspace` already detects the platform) or degrade to "manual log".

**S22 — Scaffold defect T4: the scaffold publishes a retired grammar.**
> **T4** **Contradiction inside the scaffold.** `template/AGENTS.md:209-219` declares the `spec-by-reference` shape (issue #308) *"the template's shape"* (11 sections, `S#` + `## Log`), while `template/docs/features/_TEMPLATE/SPEC.md` still ships the legacy 14-section shape (Objective/Why/User outcome/…/Evidence/Progress log) and `template/docs/fix/_TEMPLATE/SPEC.md` the older Goal/Root cause/Scope/Phases shape. A project scaffolded today gets a unit template that the published grammar (`block:spec-requirement@1`, `block:task-spec-link@1`, `block:log-kind@1`, `block:findings-table@1`) does not match.

**S23 — Scaffold defect T5: the skill that writes the scaffold teaches the retired shape.**
> **T5** `skills/init-workspace/SKILL.md:169-176` teaches *"one `SPEC.md` … with 14 sections"* and never mentions `S#`/`## Log` — the skill that writes the scaffold teaches the retired shape, on top of T4.

**S24 — Scaffold defect T6: versioned internals in a copied file.**
> **T6** The scaffold carries versioned internals (`feature 61`, `issue #308`, `D-40-14`) that date in a copied file. Decide explicitly: keep as provenance, or restate generically — silence is the current answer.

**S25 — Scaffold defect T7: nothing scans `template/**`.**
> **T7** **Root cause of T4/T5: nothing scans `template/**`.** The normative-surface table binds the unit-doc grammar to the **root** templates only, so the scaffold can ship a shape no gate reads. Extend the drift gate (or a small sibling test) to the scaffold templates so T4 cannot reappear.

The requester numbers the last ten items `P1`…`P10` and the template defects
`T1`…`T7` in the revision comment; here they are `S9`…`S25`. A phase label in this
unit is a task in `## Tasks` (`P1`, `P2`, …) and never a requirement id.

**S26 — The requester's scope and hold answers for this session (2026-11-01).**
> hold: selected stop … scope: selected body-marked … precedence: selected A

Read with the issue: the frozen request is the issue body **plus** every revision
item the requester marked `[x]` (P1, P2, P4-P10, T1-T7) plus P3 answered as ladder
**A**; the "stop" answer was that turn's disposition, superseded when the requester
removed `human-revision-needed` and re-issued the work order. Both the label
removal and #319's closure are prerequisites this unit verified before starting
(D1).

## Impact

- **Measured at the cut head** (`main` @ `826f9c06`): `AGENTS.md` is **530 lines /
  37,103 bytes**, not the issue's 453 / 29 KB — the report drifted while the unit
  waited (S9). Blocks: header `1-24`, layout `25-46`, working rules `47-112`,
  authoring `113-280`, distribution `281-296`, verification + the three machine
  tables `297-425`, packages `426-500`, conventions `501-512`, skills index
  `513-530`.
- **The `~120`-line criterion cannot hold under the issue's own default.** The
  three machine tables total 101 lines and stay (S3); the issue's in-scope core
  (intro, layout, working rules, verification, conventions, skills index) is 142
  lines today before the new index, map, precedence and rule lines. No variant of
  S5/S6 reaches 120: moving the tables buys 101 lines and still leaves ~180. This
  unit therefore pins the honest form — **prose core ≤ 120 lines, the three
  machine blocks counted separately and pinned** — and reports the arithmetic to
  the owner rather than shrinking rules to fit a number (O1, PE-003, A4).
- **Readers of `AGENTS.md`** (the S7 inventory; full verdicts in
  `planning-evidence.md` PE-005/PE-006): 25 non-Markdown files and 14 skills
  reference it. Two are **affected** beyond comments — `scripts/pin-watch.mjs:337`
  emits "AGENTS.md → Packages" inside a public issue body, and
  `scripts/golden-fixture.test.mjs:249` requires `AGENTS.md` to name
  `GOLDEN_FIXTURE.md` — both are retargeted in this unit. Every other reader is
  a comment, a path constant the layout keeps, or a machine-table assertion the
  default variant leaves in place.
- **Pins that must stay green untouched** (S2): `GUIDE_REL`
  (`scripts/normative-drift.test.mjs:71`), the `homes == ["AGENTS.md"]` scan
  (`scripts/pre-execution-quality.test.mjs:1622-1624`), `block:finding-mark@1`
  (`scripts/review-loop-discipline.test.mjs:154`), the `normative-surfaces@1`
  row for `ask-dont-infer-rule` (`scripts/residue-dimensions.test.mjs:233`), the
  turn-contract receipt row (`scripts/turn-contract-grammar.test.mjs:77`), and
  the compatibility-policy sentences (`scripts/residue-dimensions.test.mjs:154`).
- **Template surface** (S19-S25): `template/AGENTS.md` (map + session log),
  `template/docs/{features,fix}/_TEMPLATE/SPEC.md`,
  `skills/init-workspace/SKILL.md`, and the `normative-surfaces@1` rows that
  currently name only the root templates.
- **Version-parity trigger** (PE-014): the change touches `skills/**`, so it
  satisfies the gate's content half with a `.changeset/*.md` intent instead of a
  manual package bump.

## Retirements

None. This unit moves and adds; the only deletions are the template's tombstone
row (S20) and the paragraphs `AGENTS.md` loses to their new home, both of which
are relocations with a pointer left behind — `rg -c 'Generated developer docs'
template/AGENTS.md` → 0 names the one true removal.

## Non-goals

- Rewriting the rules' content (S6). The extraction is verbatim; the only new
  prose is the index, the map, the precedence ladder and the five rule lines the
  requester asked for.
- Moving the three machine tables (S3/A1).
- Setup/update tooling and `docs/workflow/SETUP.md` (S6, that unit is #331).
- The `node → bun` sweep itself (S14 hands the carve-out to #329).

## Future

`none` — nothing was deferred. The one candidate the requester considered and
discarded outside this unit (a per-folder `AGENTS.md` layout) is recorded in the
revision comment's discarded list, not here.

## Future cost

- **Every new `docs/` reference doc enters the budget manifest in the same PR.**
  Binds whoever adds a guide-layer doc: `scripts/check-skill-context.mjs
  --documents` fails a file the manifest does not declare.
- **A rule may not enter `AGENTS.md` without naming its owner.** Binds every
  guide author (S17): the repo-wide rule-name walk in
  `scripts/residue-dimensions.test.mjs` already refuses a rule name that appears
  outside its owner without a pointer.
- **A template unit doc must keep the re-cut shape.** Binds `init-workspace` and
  anyone editing `template/docs/**`: two gates now read that tree (S25).

## Applicable tests

- `node --test scripts/guide-split.test.mjs` — the new corpus for S1/S4/S7: core
  budget, the Deep-references index and its link resolution, one-hop reachability,
  and the no-restatement check. Its refusal cases are the fixture for the new
  mechanic (a dead link, a duplicated paragraph, an over-budget file).
- `node --test scripts/check-skill-context.test.mjs` — the documents budget
  (S7 AC3, S5).
- `node --test scripts/normative-drift.test.mjs scripts/pre-execution-quality.test.mjs
  scripts/residue-dimensions.test.mjs scripts/review-loop-discipline.test.mjs
  scripts/turn-contract-grammar.test.mjs scripts/golden-fixture.test.mjs` — the
  pins S2 names, unchanged.
- `node --test scripts/unit-doc-contract.test.mjs` — the template unit docs join
  the shape loop (S22/S25).
- `node --test scripts/workflow-docs-index.test.mjs` — the two new reference docs
  need index rows (S10/S25).
- `node scripts/run-root-suite.mjs` — the whole gate, at the end.

## Known pre-existing issues

- **`docs/reference/` does not exist** and would be a new top-level docs folder
  with no map row — does-not-affect: A2 places both docs under `docs/workflow/`.
- **The issue's "~15 readers" is 25 files** — does-not-affect: each is verdicted
  in `planning-evidence.md`.
- **`scripts/bump-skill` no longer exists** (it is `skill-lint` since D-40-14) —
  does-not-affect: no reader of `AGENTS.md` named in S2 is missing.
- **`bun scripts/run-root-suite.mjs` fails by construction** ("Cannot use test
  outside of the test runner") — affects S14: the runtime line states the
  measured split instead of the bun-first rule alone.

## Tasks

- P1 — Freeze this unit doc and its two planning ledgers (validator: `test -f docs/fix/332-agents-md-split/planning-obligations.md` exits 0)
(Implements: S1, S2, S9, S26)
- Relevant files: docs/fix/332-agents-md-split/

- P2 — Red-first: the guide contract and its three refusal cases (validator: `node --test scripts/guide-split.test.mjs` exits 1 before P3)
(Implements: S1, S4, S7)
- Relevant files: scripts/guide-split.test.mjs

- P3 — Extract the authoring and packages prose into `docs/workflow/`, leaving the pointers and the Deep-references index (validator: `node --test scripts/guide-split.test.mjs` exits 0)
(Implements: S1, S2, S3, S5, S6, S8, S12)
- Relevant files: AGENTS.md

- P4 — State the eight core rules: documentation map, instruction precedence, completed layout, measured runtime split, testing line, `docs/LOGS.md` hand-off, restatement-ownership and the `template/` scope boundary (validator: `node --test scripts/guide-split.test.mjs` exits 0)
(Implements: S10, S11, S13, S14, S15, S16, S17, S18)
- Relevant files: AGENTS.md

- P5 — Extend the context gate with the `--documents` mode and declare the guide layer in the manifest (validator: `bun scripts/check-skill-context.mjs --documents` exits 0)
(Implements: S5, S7)
- Relevant files: scripts/check-skill-context.mjs

- P6 — Repair `template/AGENTS.md`: one `## Docs site` section, no tombstone row, a platform-neutral session log, generic versioned internals (validator: `node --test scripts/scaffold-guide.test.mjs` exits 0)
(Implements: S19, S20, S21, S24)
- Relevant files: template/AGENTS.md

- P7 — Bring the two unit templates to the re-cut shape, retarget `init-workspace`, and bind `template/docs/` in both gates (validator: `node --test scripts/unit-doc-contract.test.mjs` exits 0)
(Implements: S22, S23, S25)
- Relevant files: template/docs/

- P8 — Verification and close-out: release intent, root suite, context budgets, version parity and the differential run (validator: `node scripts/run-root-suite.mjs` exits 0)
(Implements: S5, S7)
- Relevant files: .changeset/

### Planning evidence

The ledger is `planning-evidence.md` beside this doc (L unit — never embedded and
separate at once).

### Obligations

The ledger is `planning-obligations.md` beside this doc. Before the unit ships,
every row is `verified` or an evidenced `n/a`.

**Ledger amendments (declared, not silent).** Four validators were mis-specified
at cut and were corrected during P8, each keeping the behaviour it checks:
O4's alternation matched a legitimate pointer line in the guide's layout block, so
it now checks that no `## Packages` section exists while the reference does; O5
diffed against `1c9375a1` (the base of the previous unit) instead of `main`, which
imported an unrelated upstream change; O21 and O24 embedded an unescaped `|`
inside a table cell, which split the row, so each alternation is now two named
commands. No requirement changed and no status was granted without its command.

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; later lines carry one kind token from
the closed set in `log-kind@1`.

- **L1** — 2026-11-01, the requester's work order, verbatim (elided at the step
  list only, marked):
  ```
  Apply to this repository: from issue #332

  This is a **local, unpublished** workflow for changing agentic-workflow itself.
  The failure it prevents: the workflow judging its own surgery (unit fix-258
  burned 12 review→fold cycles that way). Follow this order, every step:

  ## 1. Verbatim intent (never paraphrase) … ## 8. Correction bounds (hard) …

  Close by reporting: what shipped (commits), every failed/skipped/pending check,
  and the next step. Never end with a pending tracked task unless I told you to stop.
  ```

- **P1** — 2026-11-01, the unit doc, both planning ledgers and the decision ledger frozen · 5988179b.
- **E1** — 2026-11-01, `node scripts/check-skill-context.mjs --documents --json` · exit 0 · ok true, `AGENTS.md` prose 274 ≤ 302, machine 83 == 83, lines 357 ≤ 393, estimate 6255 ≤ 6881.
- **P2** — 2026-11-01, the guide-layer contract suite and its three refusal cases · 5ed1ea32.
- **E2** — 2026-11-01, `GUIDE_SPLIT_ROOT=/tmp/base332 node --test scripts/guide-split.test.mjs` (base `main` @ `826f9c06`) · 12 of 14 cases fail · the two that pass are the refusal fixtures and the pre-split-tree case, which is red by design.
- **P3** — 2026-11-01, the authoring and packages prose extracted verbatim, the Deep-references index added, the two semantic readers retargeted · f6a23df2 (P3's extraction, P4's rule lines and P5's budget ship together because they are one file, `AGENTS.md`; splitting them would leave the guide red between commits).
- **E3** — 2026-11-01, `node scripts/phase-lint.mjs docs/fix/332-agents-md-split/SPEC.md` · exit 0 · `verdict PASS`, eight phases, no unlinked requirement.
- **P4** — 2026-11-01, the eight core rules stated (map, precedence, layout, runtime split, testing, session log, ownership, boundary) · f6a23df2.
- **P5** — 2026-11-01, `--documents` mode, the manifest's `documents` section and its five cases · 6f1208b6.
- **E4** — 2026-11-01, `bun scripts/run-root-suite.mjs` · exit 1 · `error: Cannot use test outside of the test runner. Run "bun test" to run tests.` — the measured split the guide now states.
- **P6** — 2026-11-01, the template guide repaired (one H1, visible optional block, no tombstone, platform-neutral session log, no dated ids) · 717fb8b5.
- **P7** — 2026-11-01, both template unit docs re-cut to `spec-by-reference`, `init-workspace` retargeted, and the template tree bound in both gates · bba20fc7.
- **E5** — 2026-11-01, `node scripts/phase-lint.mjs template/docs/{features,fix}/_TEMPLATE/SPEC.md` · `verdict BLOCKED: no-phases` and `verdict BLOCKED: unparseable` at `main` @ `826f9c06`; `verdict PASS` here. The frozen-failure reproducer for S22/S25.
- **P8** — 2026-11-01, every obligation row closed and the release intent shipped.

- **P9** — 2026-11-01, PR #371 opened against `main` after integrating the two `main` moves (a merge commit, never a force push); CI green on the merge head (`root-suite`, `dependency-pin-gate`, `pi-compat-guard`).

- **F1** — 2026-11-02, external verification folded: `BOOTSTRAP_WRITE.md` and
  `UPGRADE.md` still taught the retired 14-section shape as what a new unit gets
  (S23 landed only in `SKILL.md`), so bootstrap verified a correct copy against a
  section list the template no longer carries. Both retargeted to
  `spec-by-reference`, with the legacy shape kept for units already cut in it.
  Commit `95b0c86c` · 2026-11-02.
- **F2** — 2026-11-02, the same drift one level down: the prose promised a
  `ROADMAP` beside `features/_TEMPLATE` and a `README` beside `fix/_TEMPLATE`
  while only the SPEC templates ship, and named one template where the scaffold
  ships two. Prose now names the shipped files; `README.md`'s layout row matches.
  Commit `b3de16f3` · 2026-11-02.
- **E6** — 2026-11-02, `node scripts/run-root-suite.mjs` at `b3de16f3` · exit 0,
  1348 tests, pass 1348, fail 0, skipped 0 — the two `#332` cases in
  `scripts/unit-doc-contract.test.mjs` are the delta over P8's 1331 and the fold's
  own case (`init-workspace never teaches the retired shape`) went red first.
- **E7** — 2026-11-02, `bun scripts/check-skill-context.mjs` · `PASS context
  budgets: 28 skills`; `--documents` · `PASS context documents: 3 budgeted
  documents`. `init-workspace` measures 3701 est / 255 lines inside the 4066 / 281
  ceilings — the fold needed no manifest change, so no ceiling moved for it.
- **F1** — 2026-11-02, sweep of the two fold batches, one line per stale form:
  - swept: /all 14 sections|14-section template used by new units/ → expected 0 in skills/init-workspace/**.md
  - swept: /_TEMPLATE`? \+ `?ROADMAP|_TEMPLATE`? \+ `?README/ → expected 0 in README.md

## Next

PR #371 awaits the owner's merge decision: the deviation in `## Impact` (S7's
literal 120 lines and S10's 7-9-row map, both reported to the owner), the
obligations ledger's 27 verified rows, the verification block and the two fold
batches under `## Log` are the review surface.

## References

- Issue #332 (the frozen request), its 2026-10-28 triage verdict and its
  2026-10-30 drift report + revision checklist.
- #331 (setup unit, closed — the ordering prerequisite), #319 (index
  consolidation, closed — the sequencing partner), #329 (bun/rg sweep, the
  carve-out owner), #353 (the residue policy the working rules cite).

## Branch

`feat/332-agents-md-split`

## Depends on

`331-*` (closed) and `319-location-index-consolidation` (closed) — both
prerequisites, both satisfied before this branch was cut.

## Regression scope

- **Both runtimes run the suite**: `node --test scripts/*.test.mjs` and
  `bun test scripts/<file>` — verified at the cut head (PE-004), pinned by the
  existing suite.
- **The four machine tables' parsers**: `normative-drift`, `pre-execution-quality`,
  `residue-dimensions`, `review-loop-discipline`, `turn-contract-grammar`,
  `golden-fixture` — a moved table would break them, and the default variant keeps
  every one green without a test edit.
- **The template tree's own consumers**: `init-workspace`'s scaffold list,
  `phase-lint`'s `template/` rows and the golden fixture's cross-reference check.
