# fix/333-capabilities

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape. The request is issue #333 (title and body quoted verbatim in `## Specs`
> and `L1`); the planning ledgers are frozen as the sibling
> `planning-evidence.md` / `planning-obligations.md` (M sizing) and this
> document's sections name them instead of embedding them.

## Issue

`#333` — `init-workspace` seeds `docs/CAPABILITIES.md` as a raw template; it must
infer from evidence, ask what it cannot prove, and delete what can never apply.
The issue is open; the PR must close it with `Closes #333`. Roadmap row (issue
#333) is this unit's registry entry in `docs/ROADMAP.md` § Fixes.

## Specs

One requirement per distinct ask, in the issue's order: the six outcomes of
**Expected behaviour**, the five bullets of **Proposed fix**, the six **Acceptance
criteria**, and the three **Non-goals**. Each quote is the issue's own words,
unedited.

**S1 — Classify the project first, and delete the row whose surface cannot exist.**
> 1. **Classify the project first.** From Step 0's discovery evidence (manifests, source tree, an existing agent guide, the documentation map, an existing roadmap), record what kind of thing the project is and which surfaces it has. A row whose surface **cannot exist** in that kind of project is **deleted**, without asking — the question "will you have an ACL?" is noise for a repository that ships markdown and has no request path.

**S2 — Infer only with a named path as evidence; never guess.**
> 2. **Infer with evidence or not at all.** A row is written with `yes`/`partial`/`no` **only** when a named repository path proves it (a directory, a package dependency, an entry point, a config key). Each inferred row records that evidence. A row that the evidence does not settle is **never guessed** — it becomes an open question.

**S3 — Ask the remainder once, batched, existence question before state question.**
> 3. **Ask what remains, once, as a batched round.** Rows that could plausibly exist but are unproven are asked together, with the inferred proposal shown beside each so the user confirms or corrects rather than authoring from scratch. The round must include the *existence* question (does this project have/want `<X>`?) before any state question for `<X>` — an absent subsystem is not a `no`.

**S4 — Never self-answer: unknown blocks the row's write.**
> 4. **Never self-answer.** If an answer is not in the repository and not in a user reply, the correct state is *unknown*, and unknown blocks the write for that row — it does not default to `no`, does not default to the template text, and does not get invented from the model's expectation of what a project "usually" has.

**S5 — Fail the write on a raw result.**
> 5. **Fail the write on a raw result.** The bootstrap write step refuses to leave `docs/CAPABILITIES.md` containing template placeholders or unanswered rows; a row that could not be settled is reported as an open question (or, when the user declines to answer, as an explicitly labeled unresolved row), never silently shipped as template text.

**S6 — The same procedure in upgrade mode, additively, on the missing file only.**
> 6. **The same procedure in upgrade mode**, applied additively to only the missing file and not re-litigating a file the project already tailored.

**S7 — Rewrite the `Capability inventory` bullet into a step-shaped procedure with
the evidence table and both rules.**
> - Rewrite the `Capability inventory` bullet in `references/BOOTSTRAP_DISCOVERY.md` into a step-shaped procedure with the six outcomes above: an **evidence table** per row (what proves `yes`/`partial`/`no`), an explicit **delete-without-asking** rule keyed on project type, an explicit **ask** rule keyed on unsettled evidence, and an explicit **forbidden: self-answering** line.

**S8 — Add the post-write check to `references/BOOTSTRAP_WRITE.md`.**
> - Add the post-write check to `references/BOOTSTRAP_WRITE.md`: a concrete verification (no `<…>` placeholders remain; every remaining row carries a state and its evidence or an explicit `unresolved — <question>`) that makes the run report a residual instead of a silent template copy.

**S9 — Mirror the rule in `references/UPGRADE.md` so the two routes cannot diverge.**
> - Mirror the same rule in `references/UPGRADE.md` so the two routes cannot diverge.

**S10 — The template's row list is self-describing as candidates.**
> - Make the template's row list self-describing as **candidates evaluated against the project**, not a floor to trim: `template/docs/CAPABILITIES.md`'s header states the delete-then-ask-then-infer order.

**S11 — Repair this repository's `docs/CAPABILITIES.md` as its own change.**
> - Repair this repo's `docs/CAPABILITIES.md` under the corrected rule (it is currently template-only; the repair is its own committed change, not a side effect of this skill edit).

**S12 — Acceptance: bootstrap on an empty repo leaves zero placeholders and shows
the asked round (or why none was needed).**
> - Running `init-workspace` bootstrap on an empty repo produces a `docs/CAPABILITIES.md` with **zero** `<…>` placeholders, and the run's report shows the asked round (questions, proposals, answers) or states why no round was needed.

**S13 — Acceptance: a row the project's nature excludes is deleted without asking,
and the report names the deletion and its evidence.**
> - Running it on a repo whose nature excludes a template row (e.g. a docs/skills repo and the `Billing / payments` row) deletes that row **without** asking, and the report names the deletion and the project-type evidence that justified it.

**S14 — Acceptance: a detectable subsystem is written with its evidence path; an
undetectable row is asked, never defaulted.**
> - Running it on a repo with a real, detectable subsystem writes that row with its evidence path (`Exists: yes` only alongside a cited path); an undetectable row is asked, never defaulted.

**S15 — Acceptance: declining leaves `unresolved — <question>` in the file and in
the report.**
> - Declining to answer a row leaves it visibly `unresolved — <question>` in the file and in the report; it never reverts to the template placeholder and never becomes an assumed `no`.

**S16 — Acceptance: `BOOTSTRAP_WRITE.md` carries the check that would have failed
this repository's seeded file; upgrade applies it too.**
> - `references/BOOTSTRAP_WRITE.md` contains a verification step that would have failed the seeded file in this repo; upgrading an existing scaffold applies the same rule.

**S17 — Acceptance: this repository's `docs/CAPABILITIES.md` carries no template
placeholder.**
> - This repo's `docs/CAPABILITIES.md` no longer contains template placeholders.

**S18 — Non-goal: the capability-inventory concept, its consumers and its
documentation-map row do not change.**
> - No change to the capability-inventory **concept**, its consumers (`design-feature`'s integration closure, `execute-phase`'s additive extension, `product-audit`'s freshness check), or its documentation-map row.

**S19 — Non-goal: no new script or CI gate validates `docs/CAPABILITIES.md` in
target projects.**
> - No new script or CI gate for `docs/CAPABILITIES.md` validation in target projects — the check lands in the skill's prose contract, matching how the rest of `init-workspace` is enforced.

**S20 — Non-goal: no rename or relocation of `docs/CAPABILITIES.md`.**
> - No rename or relocation of `docs/CAPABILITIES.md`.

The grammar the machine reads (`spec-requirement@1`) — one `**S# — title.**` line
per requirement followed by the requester's `>` words; a correction is its own
line (`S1a`), never a rewrite.

```text
spec-requirement@1
kind | shape | what it orders
requirement | **S<n>[a-z]? — <title>.** | one requirement; the id is what a task links and a finding cites
quote | > <the requester's words, verbatim> | the requirement's own text, unedited apart from a marked elision
correction | **S<n><letter> — <title>.** | an appended amendment to requirement S<n>; never an edit of it
```

## Acceptance criteria

The frozen acceptance source, one criterion per requirement that carries an
observable outcome, each naming the check that proves it. Criteria C7–C12 are
demonstrated on throwaway trees (`mktemp -d`, removed after), never on the live
`docs/` tree, because the seeding run mutates the project it is run in.

- **C1 (S1, S7, S13)** — the discovery reference carries the six ordered moves,
  and the second one deletes a row without asking: `node --test
  scripts/capability-inventory.test.mjs` exits 0 with the `classify` / `delete` /
  `infer` / `ask` / `forbid` / `report` cases passing.
- **C2 (S2, S14)** — every row in this repository's inventory that carries
  `yes` or `partial` cites a repository path that exists, and so does a `no` row's
  probe: `node --test scripts/capability-inventory.test.mjs` exits 0 with the
  evidence-path case passing (A3), which iterates every subsystem and role row.
- **C3 (S3, S15)** — the procedure states the existence question before any state
  question and writes `unresolved — <question>` for a declined row: the same suite
  exits 0 with the `unresolved` case and the ask-order case passing.
- **C4 (S4, S7)** — the forbidden move is present and names the owner of the
  no-assumption rule: the same suite exits 0 with the `forbid` case passing, and
  `rg -n "ask-don't-infer" skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md`
  matches 1 with `DESIGN.md` in the same paragraph.
- **C5 (S5, S8, S16)** — the write reference carries a verification step that
  refuses the raw template: the same suite exits 0 with the write-gate case, and
  its fixture half proves the reader fails the shipped template (`manual:` not
  needed — the fixture is a copy of the template's own cells).
- **C6 (S6, S9)** — upgrade mode names the same owner procedure instead of a
  second copy: the same suite exits 0 with the upgrade case and the single-owner
  case passing, and `rg -l '^\s*capability-inventory@1$'
  skills/init-workspace/references/` matches one file — a pointer may name the id,
  only the owner may state the block.
- **C7 (S10)** — the template's header states the delete-then-ask-then-infer
  order and calls the rows candidates: the same suite exits 0 with the template
  case passing.
- **C8 (S11, S17)** — this repository's `docs/CAPABILITIES.md` contains no
  template placeholder and no template-only row: the same suite exits 0 with its
  placeholder-cell case and its evidence-path case both passing (A2 and A3).
- **C9 (S12)** — on a throwaway empty directory, a copy of the template put
  through the post-write checks is refused (it is the raw seed); a settled copy
  passes. The suite's fixture half runs both directions.
- **C10 (S18, S19, S20)** — nothing is renamed, no consumer changes, and no
  validation script ships to target projects: `git diff --name-only main` lists no
  file under `skills/design-feature/`, no `docs/CAPABILITIES.md` rename, and no
  `template/scripts/`; `scripts/` gains one test suite and no CLI.
- **C11 (S12, S16)** — the skill's own budgets stay green:
  `bun scripts/check-skill-context.mjs` exits 0 printing `PASS context budgets: 28
  skills`.

## Impact

- **`init-workspace`'s bootstrap route is the surface every new project is born
  on.** Its output — `docs/CAPABILITIES.md` — is read by the lane's `design`
  catalog step (integration closure + role matrix), extended additively by
  `execute-phase`, and freshness-checked by `product-audit`; the defect therefore
  propagates into every later unit of every bootstrapped project, not into one run.
- **The two routes must not diverge (S6, S9).** `UPGRADE.md` reuses the same
  seeding rules by reference, so the procedure gets one owner
  (`BOOTSTRAP_DISCOVERY.md`) plus one write gate (`BOOTSTRAP_WRITE.md`) and
  `UPGRADE.md` points at both. A second copy of the procedure would be the
  duplication class this repository refuses.
- **The exported template is the second consumer (S10).** `template/docs/CAPABILITIES.md`
  is copied verbatim by `npx degit gtrabanco/agentic-workflow/template` and by
  `init-workspace`; its header is what a reader sees before any run, so the
  candidate semantics have to live there too.
- **This repository's own inventory is the third** (S11, S17): it ships the raw
  template today, which makes every `design`/`product-audit` read of it wrong in
  both directions (claims billing, names no real subsystem).
- **The no-assumption rule has one normative owner** —
  `ask-don't-infer` in `skills/unit-lane/references/DESIGN.md`, declared in
  `AGENTS.md`'s `normative-surfaces@1` and counted for restatements by
  `scripts/residue-dimensions.test.mjs`. The new procedure therefore *references*
  the owner in-window; it never restates the rule's wording.
- **Budgets:** `init-workspace`'s references are bounded by
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (`referenceEstimateMax: 3412`, 280
  lines per reference). The procedure lands inside the discovery reference, so
  only that file grows; a re-base is not expected and, if the measured growth
  requires one, it is re-based with its source declared.
- **No gate ships to target projects (S19).** The deterministic check added here
  is a *repository* suite (`scripts/capability-inventory.test.mjs`) that reads this
  repository's own inventory and the skill's prose contract; `template/` gains no
  script and no CI job.
- **Nothing live is touched:** `skills/design-feature/`, `skills/execute-phase/`,
  `skills/product-audit/`, the `AGENTS.md` documentation-map row, and the file's
  name and location stay as they are (S18, S20).

## Retirements

| Retired surface | Replacement | Evidence |
|---|---|---|
| the discovery bullet's "propose the roles and the `yes\|no\|partial` state of each template subsystem row … from what the code actually shows" | the six ordered moves of `capability-inventory@1` (classify → delete → infer → ask → forbid → report) plus `capability-evidence@1`'s per-row probes | `rg -n 'from what the code actually shows' skills/init-workspace/` → 0 matches after this change |
| the template's "the fixed set below is the floor, not the ceiling" and "Delete rows that can never apply to this product" | the candidate contract: delete-first by project type, infer with a cited path, ask the remainder, never default; the same sentence shape in `template/docs/CAPABILITIES.md` and `docs/CAPABILITIES.md` | `rg -n 'the floor, not the ceiling' template/ docs/CAPABILITIES.md` → 0 matches |
| this repository's template-only inventory (13 placeholder subsystem rows, 1 placeholder role row, 0 real values) | 12 evidence-cited subsystem rows (9 candidates + 3 project-specific) and 2 role rows under the corrected rule | `rg -c 'yes\\\|no\\\|partial' docs/CAPABILITIES.md` → 0; `node --test scripts/capability-inventory.test.mjs` passes its placeholder-cell case (A2) |

A fix that only adds is the exception; this one retires the defect's own text in
both places it lives (the skill and the exported document), so each row above
carries its no-consumer evidence.

## Non-goals

- **No change to the capability-inventory concept, its consumers or its
  documentation-map row** (S18). `design-feature`'s integration closure,
  `execute-phase`'s additive extension and `product-audit`'s freshness check keep
  reading the same document with the same row meanings.
- **No new script or CI gate in target projects** (S19): `template/` gains no
  `scripts/`, no workflow, no hook. The check is prose in `BOOTSTRAP_WRITE.md` and
  a repository-only suite.
- **No rename or relocation of `docs/CAPABILITIES.md`** (S20).
- No change to the candidate row *set* in the template: the 13 candidate
  subsystems ship unchanged, re-labelled as candidates.

## Future

- `none` — nothing was deferred. The web rendering layer (#295) will eventually
  render the inventory; that is a rendering concern, not an open row here.

## Future cost

- A future `init-workspace` edit that changes a candidate row must update
  `capability-evidence@1` in the same change: the repository suite
  (`scripts/capability-inventory.test.mjs`) fails when the template's candidate set
  and the evidence table diverge. Binds every unit touching
  `template/docs/CAPABILITIES.md` or the discovery reference.
- This repository's own `docs/CAPABILITIES.md` must stay evidence-cited: a row
  added without an existing path fails the suite. Binds every unit that extends a
  subsystem, role or permission (the `execute-phase` additive rule).
- A row nobody settles is legal (`unresolved — <question>`) but never a
  placeholder; the suite fails on the placeholder form only. Binds whoever
  resolves a declined row.

## Applicable tests

- `node --test scripts/capability-inventory.test.mjs` — the new repository suite:
  the placeholder reader (red on the shipped template and on this repository's
  pre-fix file), the evidence-path rule, the forbid/unresolved rules, the
  six-move procedure, the write gate, the upgrade pointer and the template's
  candidate header (C1–C9).
- `node --test scripts/residue-dimensions.test.mjs` — the no-assumption owner
  scan: the new procedure must reference `ask-don't-infer` with `DESIGN.md`
  in-window and restate it nowhere (C4).
- `bun scripts/check-skill-context.mjs` — the `init-workspace` reference budget
  (C11).
- `node scripts/run-root-suite.mjs` — the whole root gate.

## Known pre-existing issues

- **`docs/CAPABILITIES.md` was committed as the raw template at `8b68a18d`**
  (`feat(docs): seed CAPABILITIES.md from template (feature 30 prep)`).
  `affects` this unit: S11/S17 repair it, and the suite's red half reproduces it.
- **`docs/CAPABILITIES.md` drifted from the template's wording** (it still says
  `design-feature` where the template says "the lane's `design` catalog step").
  `does-not-affect` the rule: the repair rewrites the header to the candidate
  contract, which retires both wordings (the retirement table above).
- **`skills/verification-contract/SKILL.md` names a unit doc
  `## Acceptance criteria` section that the re-cut shape does not publish.**
  `does-not-affect` this unit's gates: `phase-lint` has no exact-section rule and
  `scripts/unit-doc-contract.test.mjs` reads only the two templates, so this unit
  can carry the section its instructions freeze. The mismatch is recorded, not
  repaired here — repairing it would change a contract outside #333's scope.
- **`docs/LOGS.md:899`, `:1607` and `:1910`** already recorded the unfilled
  template as a finding. `affects` the unit's provenance: this fix closes those
  observations, it does not add a new one.

## Tasks

- [x] P1 — Freeze the unit: this SPEC, the two planning ledgers, the § Fixes row, the
  release intent. (validator: `node scripts/phase-lint.mjs docs/fix/333-capabilities/SPEC.md` exits 0 printing `PASS`)
  (Implements: S1, S6, S7, S8, S9, S10, S11)
- [x] P2 — The red corpus first: `scripts/capability-inventory.test.mjs` with its pure
  readers and its fixture half (the shipped template as the refused seed, a settled
  copy as the passing one), validated on a throwaway tree before it points at the
  real files. (validator: `node --test scripts/capability-inventory.test.mjs` exits
  1 naming the placeholder cells of `docs/CAPABILITIES.md` before P3, exits 0 after
  P7)
  (Implements: S5, S16, S19)
- [x] P3 — Rewrite the discovery route: the `Capability inventory` bullet plus
  `capability-inventory@1` and `capability-evidence@1`. (validator: `node --test scripts/capability-inventory.test.mjs` exits 0 with the six-move, ask-order and forbid cases passing)
  (Implements: S1, S2, S3, S4, S7, S12, S13, S14)
- P4 — Add the post-write gate to the write route. (validator: `node --test scripts/capability-inventory.test.mjs` exits 0 with the write-gate case passing, and the same case fails when the gate paragraph is removed)
  (Implements: S5, S8, S15, S16)
- P5 — Point upgrade mode at the one owner procedure. (validator: `node --test scripts/capability-inventory.test.mjs` exits 0 with the upgrade case passing)
  (Implements: S6, S9)
- P6 — Re-label the exported template's rows as candidates and state the order.
  (validator: `node --test scripts/capability-inventory.test.mjs` exits 0 with the template case passing)
  (Implements: S10, S18)
- P7 — Repair this repository's inventory under the corrected rule.
  (validator: `node --test scripts/capability-inventory.test.mjs` exits 0 with the placeholder-cell, evidence-path and structural cases passing)
  (Implements: S11, S13, S14, S15, S17, S20)
- [x] P8 — Verification and close-out: every obligation flips with its validator's
  run recorded; the root gate and the context budgets are green.
  (validator: `node scripts/run-root-suite.mjs` exits 0 with `fail 0`)
  (Implements: S12, S16, S17)

The link grammar (`task-spec-link@1`): every task bullet names the requirements
it delivers on its own `(Implements: …)` line, and `phase-lint` refuses a bullet
with no link, a link to an undeclared id, and a base requirement no bullet
implements.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

Frozen as the sibling [`planning-evidence.md`](planning-evidence.md) (M sizing):
one row per Engineering claim, `PE-001`…, with its sampled source. Not embedded
here.

### Obligations

Frozen as the sibling [`planning-obligations.md`](planning-obligations.md) (M
sizing): the 9-column obligation ledger, one row per normative behaviour,
invariant and required failure state. Not embedded here.

## Findings

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-03, the issue, verbatim:

  ```
  Title: ISSUE: init-workspace seeds docs/CAPABILITIES.md as a raw template — it must infer from evidence, ask what it cannot prove, and delete what can never apply

  ### What's broken

  `init-workspace` seeds `docs/CAPABILITIES.md` as a **raw template**, unadapted to the target project. The file ships with `<role>`, `<yes|no|partial>` and `<login page, session middleware, …>` placeholders intact — no row was ever inferred from the repository and no question was ever asked about the rows that could not be inferred. The result is a document that is wrong in both directions at once: it claims a `Billing / payments` subsystem matters for a repository that ships markdown skills, and it names no subsystem that actually exists.

  The same defect is in **this repo**: `docs/CAPABILITIES.md` was committed on 2026-09-07 by `1bab6e60 feat(docs): seed CAPABILITIES.md from template (feature 30 prep)` — 13 template rows, 1 template role row, zero real values — and it has never been adapted since.

  ### Root cause

  `init-workspace`'s `references/BOOTSTRAP_DISCOVERY.md` already **states the right intent** (seed from discovery, propose the state from what the code shows, walk the fixed rows with the user on an empty repo, delete rows that can never apply, *"never leave the file as the raw template"*) — but that intent is prose-only with no procedure behind it:

  1. **No inference algorithm.** "Propose the `yes|no|partial` state … from what the code actually shows" names no evidence to read and no ordering. An executor with no concrete signal to look for does the only mechanical thing it can: copies the template.
  2. **No prohibition on self-answering.** Nothing distinguishes *confirmed from evidence* (safe to write) from *assumed* (unsafe to write). A weaker or rushing model resolves the ambiguity by answering on the user's behalf.
  3. **No applicability test.** The template's row list is presented as a fixed floor a project trims, never as candidates to test against the project's nature. For a skills/docs repository, `Billing / payments` is not a `no` — it is a row that must not exist.
  4. **No post-write gate.** Nothing fails the run when the written file still contains `<…>` placeholders or when every row is unanswered. The template copy passes silently.
  5. **Same gap in upgrade mode.** `references/UPGRADE.md` proposes a missing `docs/CAPABILITIES.md` with "the same" seeding rules — inheriting all four defects above.

  ### Reproduction

  - **Empty/foreign repo:** run `init-workspace` on a directory with no `docs/` and no agent guide, accept the scaffold, and inspect `docs/CAPABILITIES.md`: template placeholders intact, no interview round about roles or subsystems was held.
  - **Existing scaffold:** run `init-workspace` in upgrade mode on a project missing `docs/CAPABILITIES.md` — same outcome.
  - **This repository (observed):** `git show 1bab6e60 -- docs/CAPABILITIES.md` — 47 added lines, every value a placeholder; `grep -c '<' docs/CAPABILITIES.md` returns 26. Multiple later sessions recorded the gap without repairing it (`docs/LOGS.md:899` F19 *"provenance stated for `docs/CAPABILITIES.md` (unfilled `init-workspace` template), seeding proposed (user confirm)"*, `docs/LOGS.md:1607`, `docs/LOGS.md:1910` F2).

  ### Expected behaviour

  The contract should be **infer what the repository proves, ask what it does not, and delete what can never apply** — with the three outcomes kept apart, and asking mandated whenever evidence is absent rather than resolved by assumption.

  Stated generically so it holds for any project type (a skills repo, a CLI, a service, a docs site, a data pipeline — the row names in this issue are examples, never the spec):

  1. **Classify the project first.** From Step 0's discovery evidence (manifests, source tree, an existing agent guide, the documentation map, an existing roadmap), record what kind of thing the project is and which surfaces it has. A row whose surface **cannot exist** in that kind of project is **deleted**, without asking — the question "will you have an ACL?" is noise for a repository that ships markdown and has no request path.
  2. **Infer with evidence or not at all.** A row is written with `yes`/`partial`/`no` **only** when a named repository path proves it (a directory, a package dependency, an entry point, a config key). Each inferred row records that evidence. A row that the evidence does not settle is **never guessed** — it becomes an open question.
  3. **Ask what remains, once, as a batched round.** Rows that could plausibly exist but are unproven are asked together, with the inferred proposal shown beside each so the user confirms or corrects rather than authoring from scratch. The round must include the *existence* question (does this project have/want `<X>`?) before any state question for `<X>` — an absent subsystem is not a `no`.
  4. **Never self-answer.** If an answer is not in the repository and not in a user reply, the correct state is *unknown*, and unknown blocks the write for that row — it does not default to `no`, does not default to the template text, and does not get invented from the model's expectation of what a project "usually" has.
  5. **Fail the write on a raw result.** The bootstrap write step refuses to leave `docs/CAPABILITIES.md` containing template placeholders or unanswered rows; a row that could not be settled is reported as an open question (or, when the user declines to answer, as an explicitly labeled unresolved row), never silently shipped as template text.
  6. **The same procedure in upgrade mode**, applied additively to only the missing file and not re-litigating a file the project already tailored.

  ### Proposed fix (for triage to cut)

  - Rewrite the `Capability inventory` bullet in `references/BOOTSTRAP_DISCOVERY.md` into a step-shaped procedure with the six outcomes above: an **evidence table** per row (what proves `yes`/`partial`/`no`), an explicit **delete-without-asking** rule keyed on project type, an explicit **ask** rule keyed on unsettled evidence, and an explicit **forbidden: self-answering** line.
  - Add the post-write check to `references/BOOTSTRAP_WRITE.md`: a concrete verification (no `<…>` placeholders remain; every remaining row carries a state and its evidence or an explicit `unresolved — <question>`) that makes the run report a residual instead of a silent template copy.
  - Mirror the same rule in `references/UPGRADE.md` so the two routes cannot diverge.
  - Make the template's row list self-describing as **candidates evaluated against the project**, not a floor to trim: `template/docs/CAPABILITIES.md`'s header states the delete-then-ask-then-infer order.
  - Repair this repo's `docs/CAPABILITIES.md` under the corrected rule (it is currently template-only; the repair is its own committed change, not a side effect of this skill edit).

  ### Acceptance criteria

  - Running `init-workspace` bootstrap on an empty repo produces a `docs/CAPABILITIES.md` with **zero** `<…>` placeholders, and the run's report shows the asked round (questions, proposals, answers) or states why no round was needed.
  - Running it on a repo whose nature excludes a template row (e.g. a docs/skills repo and the `Billing / payments` row) deletes that row **without** asking, and the report names the deletion and the project-type evidence that justified it.
  - Running it on a repo with a real, detectable subsystem writes that row with its evidence path (`Exists: yes` only alongside a cited path); an undetectable row is asked, never defaulted.
  - Declining to answer a row leaves it visibly `unresolved — <question>` in the file and in the report; it never reverts to the template placeholder and never becomes an assumed `no`.
  - `references/BOOTSTRAP_WRITE.md` contains a verification step that would have failed the seeded file in this repo; upgrading an existing scaffold applies the same rule.
  - This repo's `docs/CAPABILITIES.md` no longer contains template placeholders.

  ### Severity

  medium — the defect ships a wrong document into every new project rather than breaking a run, but it is the input `design-feature`'s integration closure and `product-audit`'s freshness check both read, so the error propagates into every subsequent unit.

  ### Non-goals

  - No change to the capability-inventory **concept**, its consumers (`design-feature`'s integration closure, `execute-phase`'s additive extension, `product-audit`'s freshness check), or its documentation-map row.
  - No new script or CI gate for `docs/CAPABILITIES.md` validation in target projects — the check lands in the skill's prose contract, matching how the rest of `init-workspace` is enforced.
  - No rename or relocation of `docs/CAPABILITIES.md`.

  ---

  Automated written using an AI.
  ```

- **P1** — 2026-11-03, the unit was cut before any implementation line: this SPEC,
  both planning ledgers, the `docs/ROADMAP.md` § Fixes row and the release intent
  · `36180c67`.
- **P2** — 2026-11-03, the red corpus landed as
  `scripts/capability-inventory.test.mjs` (pure readers over text, so the defect's
  own bytes are the corpus) · `0533f11b`.
- **E8** — 2026-11-03, `node --test scripts/capability-inventory.test.mjs` · exit
  1 · 14 tests, 3 pass, 11 fail (A2, A3, A5, B1–B5, C1, C2, D1) before the
  procedure existed — the red half of the corpus, not a padded assertion.
- **P3** — 2026-11-03, the procedure, its evidence table, the write gate, the
  upgrade pointer and the exported template's candidate header · `f5e60812`;
  the inventory repair is its own change, as S11 requires · `474961ca`.
- **E1** — 2026-11-03, `node --test scripts/capability-inventory.test.mjs` · exit
  0 · 15 tests, 15 pass, 0 fail (the 14 cases cut in P2 plus A6, added by P7 to
  make O10's structural outcomes checkable).
- **E2** — 2026-11-03, `node --test scripts/residue-dimensions.test.mjs` · exit 0
  · 29 tests, 29 pass — the no-assumption owner keeps one statement and the new
  procedure carries its pointer in-window.
- **E3** — 2026-11-03, `bun scripts/check-skill-context.mjs` · exit 0 ·
  `PASS context budgets: 28 skills`; `bun scripts/check-skill-context.mjs
  --routes` · exit 0 · `PASS route budgets: 14 routes` — no ceiling re-based.
- **E4** — 2026-11-03, `rg -l '^\s*capability-inventory@1$'
  skills/init-workspace/references/` · exit 0 · exactly one file
  (`BOOTSTRAP_DISCOVERY.md`), so the two routes cannot diverge.
- **E5** — 2026-11-03, `git diff --name-only main -- skills/design-feature
  skills/execute-phase skills/product-audit docs/workflow/SKILLS.md` · exit 0 ·
  empty output — no consumer of the inventory changed.
- **E6** — 2026-11-03, `git diff --name-status main -- docs/CAPABILITIES.md
  template/` · exit 0 · `M docs/CAPABILITIES.md` and `M
  template/docs/CAPABILITIES.md` — modified in place, nothing renamed and no
  script added to the scaffold.
- **E7** — 2026-11-03, `rg -n '\| *`?<[^>]+>`? *\|' docs/CAPABILITIES.md` · exit
  1 (prints nothing) on the repaired file, and 14 matching rows on the template —
  the gate would have failed this repository's seeded file.
- **E9** — 2026-11-03, the write gate's refusal sentence removed from a
  `git archive HEAD` copy in a temp dir: `CAPABILITY_INVENTORY_ROOT=<copy> node
  --test scripts/capability-inventory.test.mjs` · exit 1 · 14 pass, 1 fail (C1)
  — the case is not vacuous. (First recorded as "13 pass" over the pre-A6
  14-test corpus; re-run at head over the 15-test corpus: 14 pass, 1 fail, C1.)
- **E10** — 2026-11-03, differential against `git archive main` in a temp dir:
  `check-skill-context` (both modes) byte-identical output; `residue-dimensions`
  29/29, `scaffold-parity` 17/17, `unit-doc-contract` 19/19, `normative-drift`
  20/20, `spec-by-reference` 17/17, `ledger-ownership` 12/12 in both trees — no
  unasked stdout, stderr or exit change.
- **G2** — 2026-11-03, `node scripts/phase-lint.mjs
  docs/fix/333-capabilities/SPEC.md` · exit 0 · every phase `PASS (6/6)`, verdict
  `PASS`.
- **G3** — 2026-11-03, `node scripts/lint-changeset.mjs
  .changeset/333-capabilities.md` · exit 0 · `ok`.
- **G1** — 2026-11-03, `node scripts/run-root-suite.mjs` · exit 0 · tests 1396,
  suites 33, pass 1396, fail 0, skipped 0.
- **P8** — 2026-11-03, every obligation flipped with its validator's run recorded
  above; O7's validator cell was corrected to count the procedure **block** (the
  id is mentioned by pointer in `UPGRADE.md`, which is exactly what S9 asks for),
  and A6 was added so O10's three structural outcomes are checkable.
- **P8a** — 2026-11-03, `node scripts/diff-guard.mjs --base main` · `DIFF-GUARD
  BREACH — main..HEAD · Lines: 1176 > 400 · Files: 12 > 8`, recorded as an
  exception rather than gamed: 513 of those lines are the unit doc, the two frozen
  ledgers and the release intent this change's own instructions require; 385 are
  the red corpus (a 15-case suite, of which 11 failed before the fix); the
  remaining ~280 are the three references, the exported template, this
  repository's repaired inventory and the close-out. No split keeps each slice
  green and self-contained: the corpus, the procedure it grades and the repair
  that proves the procedure are one subject, and `scripts/capability-inventory.test.mjs`
  is red without any one of them.

## Next

Hand the diff to the owner as external verifier: the obligation ledger is closed,
every validator ran in the foreground, and the root gate is green at HEAD.

## References

- Issue [#333](https://github.com/gtrabanco/agentic-workflow/issues/333) — the
  request, quoted verbatim in `## Specs` and `L1`. The PR closes it with
  `Closes #333`.
- `docs/ROADMAP.md` § Fixes — this unit's registry row.
- `skills/init-workspace/references/BOOTSTRAP_DISCOVERY.md` — the procedure's
  owner after this change.
- `skills/unit-lane/references/DESIGN.md` — the `ask-dont-infer@1` owner the
  procedure references.
- `docs/LOGS.md:899`, `:1607`, `:1910` — the earlier observations this unit
  closes.

## Branch

`fix/333-capabilities`

## Depends on

None.

## Regression scope

| Scenario | Verifier |
|---|---|
| the no-assumption rule keeps one normative owner and zero restatements across `skills/` | `node --test scripts/residue-dimensions.test.mjs` exits 0 |
| the exported unit-doc templates keep their re-cut shape and name no retired artifact | `node --test scripts/scaffold-parity.test.mjs` exits 0 |
| the `init-workspace` SKILL.md main body stays inside its ceiling | `bun scripts/check-skill-context.mjs` exits 0 printing `PASS context budgets: 28 skills` |
| the whole repository gate still passes | `node scripts/run-root-suite.mjs` exits 0 with `fail 0` |
| no consumer of the inventory changed | `git diff --name-only main -- skills/design-feature skills/execute-phase skills/product-audit docs/workflow/SKILLS.md` prints nothing |
