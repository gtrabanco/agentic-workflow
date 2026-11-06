# fix/357-skill-lint-smells-supply-chain

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape from `docs/fix/_TEMPLATE/SPEC.md`. The request is issue #357 plus its two
> binding owner comments (title and body quoted verbatim in `## Specs` and `L1`);
> the planning ledgers are frozen as the sibling `planning-evidence.md` /
> `planning-obligations.md` (M sizing) and this document's sections name them
> instead of embedding them.

## Issue

`#357` — `skill-lint` gains SKILL.md smell checks + skills-supply-chain security
checks (arXiv 2607.01456, 2601.10338). The PR must close it with `Closes #357`.
Roadmap row 94 (`skill-lint-smells-supply-chain`) is this unit's registry entry;
the `## Fixes` row is added by P6.

## Specs

Requirements numbered `S#`, quoting the requester's own words verbatim. The
frozen request is `L1`; every later decision cites its `S#`. Cut one requirement
per distinct ask, in the issue's own order: the seven checkboxes, the
skip-with-reason rule, the non-goals, the three acceptance criteria, and the one
binding owner comment (the attribution ledger).

**S1 — The seven checks extend the existing linter.**
> Extend `skill-lint` with the checks that apply to this repo's conventions:

**S2 — Hidden instructions in HTML comments.**
> - [ ] No HTML comments in SKILL.md bodies (hidden-instruction vector).

**S3 — No XML/HTML tags in the frontmatter description.**
> - [ ] No XML/HTML tags in frontmatter `description:` (injection vector; keep plain text).

**S4 — No invisible or zero-width Unicode.**
> - [ ] No invisible/zero-width Unicode anywhere in the file.

**S5 — External URLs pinned or justified.**
> - [ ] External URLs in instructions pinned or justified (composes with the existing provenance rule for vendored code).

**S6 — No credential-access or exfiltration-shaped instructions.**
> - [ ] No instructions directing credential/secret access or exfiltration-shaped commands ("send to <url>", "upload", "analytics endpoint").

**S7 — Backslash paths are flagged.**
> - [ ] Backslash paths flagged (agents navigate skill directories as POSIX paths).

**S8 — Time-sensitive content is flagged.**
> - [ ] Time-sensitive content flagged (dates/expiries that rot silently).

**S9 — A smell that conflicts with a repo convention is recorded as skipped, with the reason.**
> Smells that conflict with repo conventions (unified train versioning, context budgets, English-only) are **recorded as skipped with the reason**, not adopted blindly.

**S10 — No new skill, no menu entry, no scanner dependency; report-only.**
> - No new skill, no menu entry, no scanner dependency — checks live in the existing linter.
> - No change to the installed-skill trust model beyond lint reporting.
> - skill-lint stays report-only; it repairs nothing.

**S11 — Acceptance: a fixture per pattern fails, clean skills pass.**
> - [ ] Lint flags a fixture carrying each pattern above; clean skills pass.

**S12 — Acceptance: the full repo sweep runs once and its findings are triaged.**
> - [ ] Full repo sweep runs once; findings triaged (repair or recorded decision).

**S13 — Acceptance: budgets re-based only with a declared growth source; a changeset ships.**
> - [ ] `check-skill-context` budgets re-based with declared growth source if needed; changeset per repo rule.

**S14 — The attribution ledger row is confirmed in the same PR.**
> Reference ledger: the papers this unit draws from are now recorded with kind-of-adoption (idea adapted vs evidence only) in `docs/research/ATTRIBUTION.md` — the repo's permanent source-attribution ledger (100% transparency policy, owner decision 2026-11-02). Each adoption row names its issue; a PR adopting any of this unit's mechanisms must append/confirm its ledger row in the same PR.

## Impact

- `skills/skill-lint/SKILL.md` + `skills/skill-lint/references/` — the linter's
  contract: the seven authoring rules it already owns stay prose (its
  `references/DISCOVERY_AND_LINT.md`), and the seven mechanical checks land as a
  new reference plus a runnable scanner, because S11 asks the lint to *flag a
  fixture* and a prose rule cannot be a validator.
- `scripts/skill-lint.mjs` (new) + `scripts/skill-lint.test.mjs` (new) — the
  mechanical half. Every executor of `skill-lint` (a session following the
  SKILL.md, the reviewer running the sweep, CI's root suite) reads the scanner
  instead of re-deriving the patterns. Its sibling suite is mandatory
  (`scripts/structural-sibling-pins.test.mjs`).
- The whole distributed trust surface: every `skills/**/*.md` (88 files today) is
  what `npx skills add` hands to a consumer agent. References ship with the
  skill, so they are inside the rule's scope.
- Existing machine-marker HTML comments (20 lines across 5 files) and the
  five historical dates already in `skills/**` are the sweep's triage surface:
  each is either a declared marker shape or a provenance record, never a silent
  pass (`D1`, `D2`).
- `docs/workflow/SKILLS.md` — the skill's one-line contract in the flow index;
  `docs/ROADMAP.md` — the row 94 status and the new `## Fixes` row;
  `docs/research/ATTRIBUTION.md` — the two #357 landing cells (S14);
  `scripts/test-route-map.json` — the change→suite route for the new files;
  `.changeset/` — the skills release intent.
- Determinism boundary: the scanner is a pure function of the tree it is pointed
  at; it reads, writes nothing, never calls the network, has no dependency, and
  reports the same byte-stable block for the same bytes.

## Retirements

Nothing is retired: the linter's seven authoring rules, its
`references/DISCOVERY_AND_LINT.md` and its "report, never repair" contract all
survive unchanged, and this unit adds surface instead of replacing it. Why
nothing can be removed: the new checks judge SKILL.md *content* (prose, comments,
codepoints) while the existing seven judge *structure and registration*, so no
line of the old rule set is subsumed.

## Non-goals

- No new skill, no slash-command entry, no npm dependency, no external scanner
  binary (S10): the checks live in the existing linter and its own scanner.
- No repair of anything the lint reports (S10): the sweep's findings are repaired
  by hand or recorded as a decision, never rewritten by the linter.
- No change to how skills are installed or trusted — the checks report, the
  install path is untouched (S10).
- No rewrite of the 26-smell taxonomy from arXiv 2607.01456 as a catalogue: only
  the seven checks the issue names are adopted, the rest is the recorded skip
  list (S9).
- No re-statement of the context budgets: the per-skill ceilings stay owned by
  `scripts/check-skill-context.mjs` and `docs/workflow/SKILL_CONTEXT_BUDGETS.json`
  (S13); this unit only proves it stayed inside them.
- The owner comment's **rider** ("template AGENTS.md authoring guidance") is not
  this unit's scope by its own words ("not this unit's core scope") — recorded in
  `## Future`, never implemented here.

## Future

| deferred idea (verbatim) | date | status |
|---|---|---|
| "Agent-guide files: commands and boundaries yes, derivable descriptions no." — the `template/AGENTS.md` guidance rider, which the owner says "may re-home" elsewhere | 2026-11-02 | open |

## Future cost

- A new check is a SPEC change in the owning reference plus a fixture in
  `scripts/skill-lint.test.mjs`, never a new branch invented in the scanner.
  Binds whoever extends the lint.
- The declared marker shape (`<!-- <ns>:<field> … -->`) is the only comment a
  skill may carry. A new machine marker has to fit it or the sweep fails. Binds
  any skill that needs a hidden anchor.
- The shipped tree is pinned clean by the suite: a skill edit that adds an
  unpinned URL, a hidden comment, a backslash path or a dated claim now reddens
  the root gate, not a later audit. Binds every skill author.

## Applicable tests

`node --test scripts/skill-lint.test.mjs` — the scanner's own suite: one fixture
per check (red before the rule exists), the ablation of each pattern, the
declared-marker and placeholder allowances, and the shipped-tree pin.
`node scripts/run-root-suite.mjs` — the root gate, which discovers the new suite
with no registration step.

## Known pre-existing issues

- `#352` / roadmap row 91 — `scripts/` is repo-only and is planned to move into
  the published crate. `does-not-affect` this unit: the scanner is a repo gate
  like `scripts/check-skill-context.mjs`, and it would move with it.
- `#329` / roadmap row 88 — sessions invoke `node` where the bun-first convention
  orders `bun`, and the root suite fails by construction under `bun`. `affects`
  the command spelling only: the suite is documented as `node --test`, the
  scanner is documented bun-first with the node fallback.
- The `.claude-plugin/plugin.json` registration list carries no `skill-lint`
  entry, by design (`metadata.internal: true`, internal skills are not
  plugin-listed). `does-not-affect`: this unit adds no skill.

## Tasks

- [x] P1 — Create this unit doc and its two ledgers; freeze the requirements, the
  acceptance criteria and the failure corpus before any code (validator:
  `bun scripts/phase-lint.mjs docs/fix/357-skill-lint-smells-supply-chain/SPEC.md`
  exits 0 and its verdict line reads `verdict: PASS`)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14)
  Relevant files: docs/fix/357-skill-lint-smells-supply-chain/SPEC.md
- [x] P2 — Tests first: `scripts/skill-lint.test.mjs` with one red fixture per check
  (SL-01…SL-07), the two allowance cases, the ablation cases and the
  shipped-tree pin (validator: `node --test scripts/skill-lint.test.mjs` exits
  non-zero before the scanner exists, every case failing on the missing module)
  (Implements: S11, S2, S3, S4, S5, S6, S7, S8)
  Relevant files: scripts/skill-lint.test.mjs
- [x] P3 — Implement `scripts/skill-lint.mjs`: the seven checks, the declared marker
  shape, the pinned-URL rule, the scan of `skills/**/*.md`, `--skill` subsetting,
  `--json`, the byte-stable report and the PASS/FAIL exit code (validator:
  `node --test scripts/skill-lint.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S10, S11)
  Relevant files: scripts/skill-lint.mjs
- [x] P4 — Wire the linter: the new reference `references/CHECKS.md` (the checks, the
  declared allowances, the recorded skips of S9), and `SKILL.md` runs the scanner
  in its Turn contract and process without losing the seven authoring rules
  (validator: `node scripts/skill-lint.mjs` exits 0 and
  `rg -c 'CHECKS.md' skills/skill-lint/SKILL.md` matches 3)
  (Implements: S1, S9, S10, S13)
  Relevant files: skills/skill-lint/SKILL.md, skills/skill-lint/references/CHECKS.md
- [x] P5 — The sweep, the docs and the release intent: run the full scan, triage what
  it reports (D1/D2), update `docs/workflow/SKILLS.md`, the roadmap rows, the two
  attribution landing cells, the change→suite route and the changeset
  (validator: `bun scripts/check-skill-context.mjs` exits 0 and
  `bun scripts/lint-changeset.mjs` exits 0)
  (Implements: S9, S12, S13, S14)
  Relevant files: docs/workflow/SKILLS.md, docs/ROADMAP.md, docs/research/ATTRIBUTION.md, scripts/test-route-map.json, .changeset
- [x] P6 — Verification on the full diff and the hand-off: every obligation row
  closed, the root gate green, the differential run recorded, and the diff handed
  to the owner for the verdict; the branch was pushed and [PR
  #377](https://github.com/gtrabanco/agentic-workflow/pull/377) opened when the
  owner asked for it (E8), and the owner's verdict stays the merge gate
  (validator: `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S11, S12, S13, S14)
  Relevant files: scripts/, skills/, docs/

### Planning evidence

Frozen as the sibling [`planning-evidence.md`](planning-evidence.md) (M sizing) —
one row per Engineering claim the change rests on (`PE-001`…`PE-012`).

### Obligations

Frozen as the sibling [`planning-obligations.md`](planning-obligations.md) (M
sizing) — one row per normative behaviour, compatibility invariant, affected use
case and required failure state (`O1`…`O14`).

## Acceptance criteria

One observable, testable criterion per requirement; each names the check that
proves it. Frozen at cut.

| S# | criterion | proving check |
|---|---|---|
| S1 | the seven checks run from the existing linter, with no new skill, no dependency and no network | `rg -c 'dependencies' packages/agentic-workflow/package.json` unchanged; `git diff main --stat` names no `skills/<new>/`; `node scripts/skill-lint.mjs` exit 0 |
| S2 | an instruction-bearing HTML comment is a finding; a declared machine marker is not | `node --test scripts/skill-lint.test.mjs` exits 0, its SL-01 hidden-comment and marker cases both pass |
| S3 | an XML/HTML tag inside the frontmatter `description:` is a finding, and the repo's `<placeholder>` argument hints are not | suite exits 0, its SL-02 tag and placeholder cases both pass |
| S4 | an invisible or zero-width codepoint anywhere in a skill file is a finding | suite exits 0, its SL-03 case passes for U+200B, U+FEFF and U+202E |
| S5 | an external URL without a version/tag/commit pin is a finding, a pinned one is not | suite exits 0, its SL-04 unpinned and pinned cases both pass |
| S6 | an instruction that sends data outward or reads a credential is a finding | suite exits 0, its SL-05 exfiltration and credential cases both pass |
| S7 | a Windows-style backslash path is a finding, and a regex escape or a table escape is not | suite exits 0, its SL-06 path and escape cases both pass |
| S8 | a dated currency claim or an expiry is a finding, a provenance date is not | suite exits 0, its SL-07 claim and provenance cases both pass |
| S9 | every smell the repo's conventions exclude is written down with its reason | `rg -c '\\| skipped \\|' skills/skill-lint/references/CHECKS.md` matches 3 and the three reasons are present in its table |
| S10 | the lint repairs nothing and invents no surface | `git status --porcelain` after a full scan is unchanged; the skill stays `user-invocable: false` and absent from `.claude-plugin/plugin.json` |
| S11 | one fixture per pattern fails the lint and a clean skill passes | suite exits 0 with one case per check plus the clean-fixture case |
| S12 | the sweep ran once and every finding is repaired or a recorded decision | `node scripts/skill-lint.mjs` exits 0 with `0 finding(s)`, and D1/D2 name the 20 markers and the 5 dates |
| S13 | the touched skill stays inside its budget and a changeset ships | `bun scripts/check-skill-context.mjs` exits 0; `bun scripts/lint-changeset.mjs` exits 0 |
| S14 | both #357 attribution rows name where the mechanism landed | `rg -n '357' docs/research/ATTRIBUTION.md` shows the two rows naming `scripts/skill-lint.mjs` |

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-02, the issue and its two binding comments, verbatim:
  ```
  ## Summary

  `skill-lint` lints the repo's authoring rules but has no coverage of (a) general SKILL.md quality smells or (b) the skills supply-chain attack surface. Two 2026 studies:

  - **arXiv [2607.01456](https://arxiv.org/abs/2607.01456)** — first systematic characterization of SKILL.md as a software artifact: 13 higher-level / 44 lower-level semantic components, **26 best practices and 26 "skill smells"** (XML tags in frontmatter description, backslash paths, missing examples, time-sensitive content, security-hazard smells). Smells were highly prevalent and *accumulate as skills evolve*.
  - **arXiv [2601.10338](https://arxiv.org/abs/2601.10338)** (+ companion [2604.02837](https://arxiv.org/abs/2604.02837)) — **26.1% of 42,447 scanned skills carry at least one vulnerability**: hidden instructions in HTML comments and invisible Unicode, XML injection via frontmatter, exfiltration-shaped instructions, unpinned external fetches, privilege escalation.

  Why this repo: our skills are distributed via `npx skills add` (supply-chain trust surface — consumers install whatever SKILL.md says), and `review-security` audits code changes but never scans SKILL.md files as a class.

  ## Proposed fix (checklist, report-only per skill-lint's contract)

  Extend `skill-lint` with the checks that apply to this repo's conventions:

  - [ ] No HTML comments in SKILL.md bodies (hidden-instruction vector).
  - [ ] No XML/HTML tags in frontmatter `description:` (injection vector; keep plain text).
  - [ ] No invisible/zero-width Unicode anywhere in the file.
  - [ ] External URLs in instructions pinned or justified (composes with the existing provenance rule for vendored code).
  - [ ] No instructions directing credential/secret access or exfiltration-shaped commands ("send to <url>", "upload", "analytics endpoint").
  - [ ] Backslash paths flagged (agents navigate skill directories as POSIX paths).
  - [ ] Time-sensitive content flagged (dates/expiries that rot silently).

  Smells that conflict with repo conventions (unified train versioning, context budgets, English-only) are **recorded as skipped with the reason**, not adopted blindly.

  ## Non-goals

  - No new skill, no menu entry, no scanner dependency — checks live in the existing linter.
  - No change to the installed-skill trust model beyond lint reporting.
  - skill-lint stays report-only; it repairs nothing.

  ## Acceptance criteria

  - [ ] Lint flags a fixture carrying each pattern above; clean skills pass.
  - [ ] Full repo sweep runs once; findings triaged (repair or recorded decision).
  - [ ] `check-skill-context` budgets re-based with declared growth source if needed; changeset per repo rule.
  ```
  ```text
  Reference ledger: the papers this unit draws from are now recorded with kind-of-adoption (idea adapted vs evidence only) in `docs/research/ATTRIBUTION.md` — the repo's permanent source-attribution ledger (100% transparency policy, owner decision 2026-11-02). Each adoption row names its issue; a PR adopting any of this unit's mechanisms must append/confirm its ledger row in the same PR.
  ```
  ```text
  ## Rider: template AGENTS.md authoring guidance (evidence from the 2026-11 sweep, not this unit's core scope)
  ...
  ```
- **D1** — 2026-11-02, sweep triage of the 20 in-tree HTML comments (S12): all 20
  match the declared marker shape `<!-- <ns>:<field> … -->` — the receipt markers
  (`review-change:pass`, `audit-pr:merge-ready`) that `audit-pr` and
  `review-change` publish, and the four region markers the `unit-lane` document
  templates carry. S2 is therefore mechanized as "a comment is a finding unless
  its body is a marker shape", which flags hidden *prose* — the vector the issue
  names — and keeps the documented receipt contract alive. Banning every comment
  outright would delete a published contract in the same PR that adds the lint.
- **D2** — 2026-11-02, sweep triage of the five ISO dates in `skills/**` (S12):
  each is a provenance record ("verified 2026-09-24", "decision D3, 2026-10-21"),
  never a claim that decays, so S8 is mechanized as "a dated *currency* claim or
  an expiry is a finding" rather than "any date". All five are `no finding`, no
  repair needed.
- **D3** — 2026-11-02, S3 is scoped to the frontmatter `description:` field the
  issue names: every `argument-hint:` in this repo carries `<placeholder>`
  arguments (`<issue-number>`, `<NN-slug>`), so a whole-frontmatter tag scan
  would flag the repo's own declared argument surface on day one.
- **D4** — 2026-11-02, S2's scope is `skills/**/*.md`, not `*/SKILL.md` only:
  references are shipped by `npx skills add` and read by the agent, so a hidden
  instruction in a reference is the same attack on the same trust surface.
- **D5** — 2026-11-02, delivery: one PR against `main` (the repo forbids stacking)
  with every slice below; `diff-guard` is reported honestly rather than split.

- **E1** — 2026-11-02, red first (obligations O2–O11): `node --test scripts/skill-lint.test.mjs` · exit 1 · every case failing on `MODULE_NOT_FOUND` for `scripts/skill-lint.mjs`, which did not exist yet — the fixture corpus was written and run before the scanner.
- **E2** — 2026-11-02, the corpus green after P3: `node --test scripts/skill-lint.test.mjs` · exit 0 · `20 tests, 20 pass, 0 fail` — one fixture per check, the two allowance cases (declared marker, placeholder argument), the two ablation cases (pinned URL, regex escape), the provenance-date case, the `--skill` subset, the byte-stable/JSON/no-write case, the recorded-skip case, the authoring-rule survival case and the shipped-tree pin.
- **E3** — 2026-11-02, the full sweep (S12, O11): `node scripts/skill-lint.mjs` · exit 0 · `89 file(s) · 7 check(s)`, `0 finding(s)`, `verdict: PASS`. The triage of what the sweep *would* have reported without the allowances is D1 (the 20 comments) and D2 (the 5 dates); no repair was needed, and the shipped-tree case in E2 now pins it.
- **E4** — 2026-11-02, report-only (O1): `git status --porcelain` is empty immediately after the sweep — the scan created nothing and rewrote nothing; `node scripts/skill-lint.mjs` exits 0.
- **E5** — 2026-11-02, the attribution rows (S14, O13): `rg -c 'scripts/skill-lint.mjs' docs/research/ATTRIBUTION.md` · exit 0 · `2` — both #357 rows now name the scanner, one for the smell paper and one for the supply-chain paper.
- **E6** — 2026-11-02, the budgets and the release intent (S13, O12): `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 28 skills` (no budget re-based — `skill-lint` stays at the manifest defaults, 98 → 148 lines against a 240 ceiling); `bun scripts/lint-changeset.mjs` · exit 0 · `10` files `ok`, including `.changeset/feat-357-skill-smells-…md`.
- **E7** — 2026-11-02, differential (no pre-existing behaviour changes): the base commit in a `mktemp -d` copy (`6e65d0b3`, built with `bun install --frozen-lockfile` + `bun run build` in the schema package) ran `node scripts/run-root-suite.mjs` → `1381 tests, 2 fail` (`unit 26's fold ledger…`, `unit 36's fold ledger…`), and both of those pass in isolation in **both** trees, so they are load flakes, not a base verdict; at head the same command reports `1401 tests, 0 fail`. `+20` is exactly the new suite, and no other suite's pass count moved.
- **E8** — 2026-11-02, the PR receipt: [PR #377](https://github.com/gtrabanco/agentic-workflow/pull/377) opened against `main` with `Closes #357` (branch `feat-357-skill-smells`); `gh pr checks 377` exits 0 — `root-suite` pass (1m51s), `pi-compat-guard` pass (29s), `dependency-pin-gate` pass (14s). The PR body carries the file-set exception for `diff-guard`, the four interpretive decisions and the fourteen acceptance rows.
- **G1** — 2026-11-02, the root gate: `node scripts/run-root-suite.mjs` · exit 0 · `1401 tests, 1401 pass, 0 fail`.
- **G2** — 2026-11-02, `bun scripts/phase-lint.mjs docs/fix/357-skill-lint-smells-supply-chain/SPEC.md` · exit 0 · `verdict PASS` (6/6 per phase, fingerprint `6ca43a01…`); `node scripts/unit-lineage.mjs --unit 357-skill-lint-smells-supply-chain` · exit 0 · `LINEAGE OK`.
- **G3** — 2026-11-02, `node --test scripts/normative-drift.test.mjs` · exit 0 · `20 tests, 20 pass` — the new reference adds no declared normative surface and the linter's closing block is unchanged; `bun scripts/promise-coherence.mjs` · exit 0 · `verdict PASS · 28 claims checked · 13 skipped`.
- **G4** — 2026-11-02, `node scripts/diff-guard.mjs --base origin/main` · BREACH, both budgets: the line count and the file count are above 400 and 8. The file set is enumerated so the claim does not move with this document: the unit doc, its two ledgers, `scripts/skill-lint.mjs`, its sibling suite, `skills/skill-lint/references/CHECKS.md`, `skills/skill-lint/SKILL.md`, the changeset, the change→suite route, and one line each in the roadmap, the
  attribution ledger, `docs/workflow/SKILLS.md`, `AGENTS.md`,
  `docs/workflow/FEATURE_WORKFLOW.md` and the README's `skill-lint` row.
  **Recorded exception, not a forced number.** The unit doc and its two ledgers are the largest block and are mandatory here (they substitute the lane's plan step); the scanner and its fixture corpus are next; the owning reference and the linter's rewrite are small; the rest is one-line wiring. A split was considered and rejected: stacking is forbidden by `AGENTS.md`, and a docs-only PR would document a scanner that does not exist yet, which is exactly the drift this unit's own subject is about.
- **P1** — 2026-11-02, the unit doc, its two ledgers and the frozen failure corpus cut before any code · `e006b3fb`.
- **P2** — 2026-11-02, the fixture corpus (`scripts/skill-lint.test.mjs`), red on the missing module (E1) · `a305e5b1`.
- **P3** — 2026-11-02, `scripts/skill-lint.mjs`: the seven checks, the marker shape, the pinned-URL rule, `--skill`, `--json`, the byte-stable report · `a305e5b1`.
- **P4** — 2026-11-02, the linter wiring: `references/CHECKS.md` owns the seven rules and the three recorded skips, `SKILL.md` runs the scanner in its turn contract and process · `a305e5b1`.
- **P5** — 2026-11-02, the sweep and its triage (D1/D2), `docs/workflow/SKILLS.md`, the roadmap rows, the two attribution cells, the change→suite route and the changeset · `0ecb1ef7`.
- **P6** — 2026-11-02, verification on the full diff: every obligation row closed with its validator run (E4–E7, G1–G4) and the branch handed off.
- **E9** — 2026-11-02, external verification (base `6e65d0b3` · head `356653bf`,
  fresh eyes): all 15 obligations re-ran green in a clean session — the sweep
  `PASS` (89 files, 0 findings), the suite 20/20, the root gate 1401/1401, the
  budgets and the changeset lint exit 0, `phase-lint` PASS, `LINEAGE OK`,
  `promise-coherence` PASS · 28 checked · 13 skipped. Findings F1–F3 below came
  out of that round; E1's red-first run stays unverifiable from git (P2 and P3
  share commit `a305e5b1`), as the triage block's declared deviation already
  records.
- **F1** — 2026-11-02, folded (external verify) — `README.md`'s `skill-lint` row
  still narrated the pre-#357 contract (trigger "After editing a SKILL.md", no
  content checks), while the same narration was rewritten in `AGENTS.md`,
  `docs/workflow/SKILLS.md` and `docs/workflow/FEATURE_WORKFLOW.md`. The row now
  mirrors the `SKILLS.md` wording: content checks first, then the authoring and
  registration rules, trigger extended to a reference beside one.
- **F2** — 2026-11-02, folded (external verify) — S9's proving check claimed
  `rg -c 'Skipped' …` matches 1; the command matches 0 (the table rows are
  lowercase `skipped`). It now states the command that reproduces:
  `rg -c '\\| skipped \\|' …` matches 3, the same count the suite's
  recorded-skip case pins.
- **F3** — 2026-11-02, folded (external verify) — P4's validator claimed
  `rg -c 'CHECKS.md' skills/skill-lint/SKILL.md` matches 1; it matches 3 (and
  already did at the P4 commit), so the frozen count is corrected to 3. The G4
  exception file set gains the README row this fold adds.

## Triaged steps

```text
TRIAGE — 357-skill-lint-smells-supply-chain (fix)
Steps: implement, evidence
Tiers: implement: cheap, evidence: strong
Skipped: research: trivial scope, design: trivial scope, plan: trivial scope, tests: trivial scope, review: trivial scope, docs: trivial scope, release: not a feature
Budget: strong
```

Run 2026-11-02 via `bun scripts/unit-route.mjs --triage 357-skill-lint-smells-supply-chain`.
This block is authoritative for routing, and the model never re-derives it.
**Declared deviation:** the catalog skips `tests` as trivial scope, but the
process that ordered this change writes a test before the behaviour it judges,
so `P2` exists and is the frozen proof of `O10`.

## Next

The owner's verdict on the diff: the sweep, the suite and the ledger are the
evidence, and the merge closes `#357` and removes the `## Fixes` row.

## References

- `#357` — this fix's tracked issue (rows 94; arXiv 2607.01456 and 2601.10338).
- `docs/research/papers-sweep-2026-11-02.md:167-185` — the sweep's verdicts this
  unit implements.
- `docs/research/ATTRIBUTION.md:33-34` — the two adoption rows S14 confirms.
- `docs/fix/74-bump-skill-discovery-exclusion/` — why `skill-lint` stays internal.

## Branch

`feat-357-skill-smells`

## Depends on

None — independent of every open unit.

## Regression scope

| scenario | verifier |
|---|---|
| the seven existing authoring rules and their reference are unchanged | `git diff main -- skills/skill-lint/references/DISCOVERY_AND_LINT.md` is empty; suite case "the seven authoring rules survive" |
| a clean skill still lints clean | `node scripts/skill-lint.mjs` exits 0 on the shipped tree |
| the linter is still report-only and offline | `git status --porcelain` unchanged after the scan; no `http` request in the scanner (`rg -c 'fetch\\(' scripts/skill-lint.mjs` matches 0) |
| every other skill's budget is untouched | `bun scripts/check-skill-context.mjs` exits 0 |
| the root gate stays green | `node scripts/run-root-suite.mjs` exits 0 |
