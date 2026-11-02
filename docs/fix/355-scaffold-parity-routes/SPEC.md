# fix/355-scaffold-parity-routes

> Fix specification — one single unit document, cut in the `spec-by-reference`
> shape. The request is issue #355 (title and body quoted verbatim in `## Specs`
> and `L1`); the planning ledgers are frozen as the sibling
> `planning-evidence.md` / `planning-obligations.md` (M sizing) and this document's
> sections name them instead of embedding them.

## Issue

`#355` — scaffold templates and skill outputs drift from the re-cut unit doc —
parity test, audit route at flight, planning-cause route. The issue is open; the
PR must close it with `Closes #355`. Roadmap row 92 (`scaffold-parity-routes`) is
this unit's registry entry.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.
The scope below is the issue's own **Expected behaviour** and **Acceptance
criteria**, cut one requirement per distinct ask, in the issue's order. The
diff patch attached to the issue as a comment is **patch material, not a
requirement**: its `docs/fix/353-*` hunks belong to unit #353 and are named in
`## Non-goals` so they are never carried here.

**S1 — Scaffold parity: the exported templates carry the accepted shape, and no
scaffold file names a retired artifact.**
> 1. **Scaffold parity.** `template/docs/**/_TEMPLATE/` matches the shape `phase-lint`/`unit-route` accept — or a recorded decision says the legacy shape is intentional. Zero mentions of retired artifacts (`ACCEPTANCE.md`, `## Phases`, `generate-docs`, `TASKS.md`/`progress.md` outside a line that marks them legacy).

**S2 — A shape test in code, red-first on today's divergence.**
> 2. **A shape test, in code.** A deterministic check fails when the scaffold's template sections drift from the accepted grammar, and when any scaffold file names an artifact the repo has retired. It must reproduce today's divergence as a red fixture first.

**S3 — The audit's route is the progressive-loading decision, stated never executed.**
> 3. **The audit's route is the progressive-loading decision.** Each finding in `product-audit`'s report carries `route:` — the next command for that finding plus, optionally, the one reference that command loads. `none` costs no context. The audit states routes and never executes one; the report file stays the only mutation. (The owner asked for this explicitly: the route exists so the next run loads only what it needs — triage at flight — never as a schema to fill.)

**S4 — A half-planned unit routes to replan; a one-line consumer folds.**
> 4. **A half-planned unit routes to replan.** `review-implementation/CLASSIFY.md` currently routes *"Exported helper of a delivered feature that nothing invokes"* to `fold into phase` always. When the missing half is **planned work**, the route is `replan-in-unit`, so the plan step learns the unit was cut short; a one-line consumer still folds. A fold repairs what exists, never what was never planned.

**S5 — Acceptance: the two exported templates carry the repo template's section
shape and name no retired artifact.**
> - `template/docs/features/_TEMPLATE/SPEC.md` and `template/docs/fix/_TEMPLATE/SPEC.md` carry the section shape the repo's own templates carry, and no line names `ACCEPTANCE.md`, `## Phases` or `generate-docs`.

**S6 — Acceptance: the shape test is red on a fixture reproducing today's two
templates, green on the aligned ones, and runs in the root suite.**
> - The shape test fails on a fixture reproducing today's two templates and passes on the aligned ones; it runs in the root suite.

**S7 — Acceptance: every audit finding line carries `route:`, the
progressive-loading rule is stated once, and "never executes a route" survives.**
> - `product-audit`'s fixed output block carries `route:` on every finding line, with the progressive-loading rule stated once and the "never executes a route" guarantee preserved.

**S8 — Acceptance: the classifier's residue row distinguishes the two routes.**
> - `CLASSIFY.md`'s residue row distinguishes `replan-in-unit` (planned work missing) from `fold into phase` (one-line consumer).

**S9 — Acceptance: context budgets stay green, any growth is re-based with its
source declared, and no existing pin is weakened.**
> - `check-skill-context` stays green (any growth is re-based with its source declared), and no existing pin is weakened.

**S10 — The benchmark the route is measured against.**
> The cost is not one stale file: **nothing compares the scaffold with the mechanics**. A project bootstrapped today is born on a shape the lane no longer writes, and no gate notices.

**S11 — Non-goals: no new skill, menu entry or audit dimension.**
> - No new skill, no new menu entry, no new audit dimension.

**S12 — Non-goals: no subcommand or scope flag for the audit.**
> - No subcommand or scope flag for the audit (`--residue` was considered and rejected): the residue sweep stays inside the full audit.

**S13 — Non-goals: the distributable runner and the open PR #354 are untouched.**
> - The distributable runner (`#352`) is untouched.
> - The open PR `#354` is untouched; its scope is residue coverage and it stays reviewable as is.

**S14 — Provenance: this is a new unit, not an amendment to #354.**
> - Owner decision in session (2026-11-02): the work is a new unit, not an amendment to `#354` ("B"), because appending scope to a PR already in review burns a full re-review and mixes two subjects.

**S15 — Provenance: the prepared patch's product surfaces transfer, its
`docs/fix/353-*` hunks do not.**
> Only the product surfaces transfer: `skills/product-audit/SKILL.md`, `skills/product-audit/references/AUDIT_PROCESS.md`, `skills/review-implementation/references/CLASSIFY.md` and the two pins. The `docs/fix/353-.../SPEC.md` and `decisions.md` hunks belong to unit #353 and must **not** be carried over.

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

## Impact

- **The scaffold is the distribution surface.** `template/` is copied by
  `init-workspace` and by `npx degit gtrabanco/agentic-workflow/template`; its
  two `_TEMPLATE/SPEC.md` files are the shape every bootstrapped project's units
  are cut in, so they are read by `phase-lint`, `unit-route` and the schema
  package's selector on the other side of the copy.
- **The doc closure `template/docs/**/_TEMPLATE/` is the drift boundary now**
  (`docs/fix/332-agents-md-split`, committed at `27981233`), so the parity pin is
  the missing comparator, not a rewrite: both exported templates already mirror
  the repo's own pair (186/212 lines, one divergence: the `#308 §Scope 3` source
  citation).
- **Pins that read these files are reused, never duplicated:** the re-cut
  section order is already asserted by `scripts/unit-doc-contract.test.mjs` for a
  literal list of two paths, and the retirement sentences by
  `docs/fix/_TEMPLATE/SPEC.md`'s own anti-deferral prose. Extending the existing
  list is the binding; a second section-order assertion would be a shadow copy.
- **`product-audit`'s output block** is echoed by `skills/audit-pr` (which cites
  the report as its finding source), so the `route:` cell is added to the
  finding-line contract only — never to the persisted-file format, whose sections
  stay unchanged.
- **`CLASSIFY.md`'s residue row** feeds the router's `route` column
  (`replan | fold | decision-required | product owner`), so the row's new branch
  names a vocabulary value the router already reads.
- **Budget drift:** `template/AGENTS.md` is not a budgeted document, but the two
  audited skills (`product-audit` 235 lines, `review-implementation` 117 lines)
  are. The route wording is cut to fit within the declared ceiling
  (`2,978` main-est / `235` lines for `product-audit`); no ceiling is re-based
  unless the measured growth requires it, and then with its source declared.
- **Nothing live is touched:** the distributable runner (`#352`), PR `#354`,
  and unit #353's own documents are out of scope.

## Retirements

| Retired surface | Replacement | Evidence |
|---|---|---|
| the unproven claim "the exported templates carry the re-cut shape" | `scripts/scaffold-parity.test.mjs`, which fails when an exported template drifts from the contract or a scaffold file names a retired artifact | `node --test scripts/unit-doc-contract.test.mjs` (extended list) and `node --test scripts/scaffold-parity.test.mjs` |
| `ACCEPTANCE.md`, `## Phases`, `generate-docs`, `TASKS.md`, `progress.md` as scaffold vocabulary | the `spec-by-reference` sections (`## Specs`, `## Tasks`, `## Findings`, `## Log`, the embedded ledgers) plus the legacy-marked sentences that keep a pre-#308 shape readable | `grep -rFin '<token>' template/` → only lines that mark the token legacy |

A fix that only adds is the exception; this one retires nothing that still has a
consumer (the scaffold has no consumer inside this repository — it is exported),
so its negative-capability evidence is the grep count per token, kept in the
retirement rows above.

## Non-goals

- **No `docs/fix/353-*` hunk transfers.** The prepared patch's `SPEC.md` and
  `decisions.md` hunks belong to unit #353 (S15).
- **No re-cut of unit #353's ledgers, no pin for S3/S4 inside
  `scripts/residue-dimensions.test.mjs`.** That suite re-derives its
  `ask-don't-infer` restatement scan over `skills/`; two sentences that quote the
  rule's name without its owner pointer would turn #353's green suite red on a
  change outside its scope. The two product surfaces get their own suite instead
  (`scripts/scaffold-parity.test.mjs`), which pins the #353 wording as regression
  pins (S9).
- No new skill, no new menu entry, no new audit dimension (S11).
- No subcommand or scope flag on the audit; `--residue` stays rejected (S12).
- No change to `scripts/unit-doc-contract.test.mjs`'s assertions — the two
  exported paths are appended to its existing list, never a new assertion.
- No rewrite of either repo template's body text beyond keeping the two pairs
  byte-identical where the contract already requires it.

## Future

- `none` — nothing was deferred to a later unit. The route/patch machinery #361
  and #363 own is adjacent, not a deferral of this unit's scope.

## Future cost

- The exported scaffold is now pinned by a root suite: a future unit that adds a
  section to the repo templates must extend `template/docs/**/_TEMPLATE/` in the
  same change or `scripts/scaffold-parity.test.mjs` fails. That is the intended
  coupling (S10) and binds every unit touching `docs/{features,fix}/_TEMPLATE/`.
- The retired-artifact list in `scripts/scaffold-parity.test.mjs` is a standing
  list: a newly retired artifact is added there in the change that retires it
  (the same rule `normalizer-inventory@1` states for normalizers).

## Applicable tests

- `node --test scripts/scaffold-parity.test.mjs` — the new suite: the red fixture
  that reproduces today's two templates, the green fixture that carries the
  aligned ones, the exotic-heading refusal, the retired-artifact gate over
  `template/`, and the two product-surface pins (S3 wording, S4 route).
- `node --test scripts/unit-doc-contract.test.mjs` — the extended template list
  (S5, S6).
- `node scripts/run-root-suite.mjs` — the whole root gate (S6, S9).

## Known pre-existing issues

- **`template/AGENTS.md` names `review-findings.md` twice** (`:355`, `:375`) as a
  *legacy* unit's carrier, and `template/docs/fix/_TEMPLATE/SPEC.md` names it once
  in the same legacy sense. `does-not-affect` this unit: S1 scopes the retirement
  to the artifacts the issue names (`ACCEPTANCE.md`, `## Phases`, `generate-docs`,
  `TASKS.md`/`progress.md`), and a line that marks its token legacy is exactly
  what the issue allows. The parity suite pins that allowance explicitly so a
  later unit cannot quietly tighten it.
- **`template/docs/features/_TEMPLATE/SPEC.md` carries no `#308 §Scope 3`
  citation** on its two `review-findings.md` sentences while the repo counterpart
  does. `does-not-affect`: the sections are identical, and the divergence is a
  source citation, not a shape; the parity suite pins section sequence, not body
  bytes, so it neither hides nor manufactures a drift.
- **`template/AGENTS.md` is 464 lines and unbudgeted.** `does-not-affect`: no
  budgeted document changes in this unit; the two budgeted skills are measured
  and reported in `O9`.

## Tasks

- P1 — Write the red corpus: a fixture reproducing today's two exported
  templates' pre-#308 shape plus a retired-artifact seed, and a green fixture with
  the aligned pair, so `scripts/scaffold-parity.test.mjs` is red before any
  scaffold or prose file changes (validator: `node --test scripts/scaffold-parity.test.mjs` exits 1 naming the red fixture before P2 and exits 0 after P3)
  (Implements: S2, S6)
  Relevant files: scripts/scaffold-parity.test.mjs, scripts/fixtures/scaffold-parity/

- P2 — Audit the scaffold's residue: sweep `template/` for the four artifacts
  the issue names, confirm each surviving mention marks its own token legacy, and
  keep the legacy sentences so a pre-#308 project stays readable (validator:
  `rg -c -e 'ACCEPTANCE\.md' -e 'generate-docs' -e '^## Phases' template/` matches
  0 while `rg -c 'review-findings\.md' template/"AGENTS.md"` matches 2)
  (Implements: S1, S5)
  Relevant files: template/AGENTS.md, template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md

- P3 — Bind the scaffold to the contract: append the two exported template paths
  to `scripts/unit-doc-contract.test.mjs`'s re-cut list and ship the parity suite
  green over the aligned scaffold (validator: `node --test
  scripts/unit-doc-contract.test.mjs` exits 0 and `node --test
  scripts/scaffold-parity.test.mjs` exits 0)
  (Implements: S1, S2, S5, S6)
  Relevant files: scripts/unit-doc-contract.test.mjs, scripts/scaffold-parity.test.mjs

- P4 — Carry `route:` at flight in the audit: the finding-line contract gains the
  cell, the progressive-loading rule is stated once, the "never executes it"
  guarantee and the report-file-only mutation stay (validator: `node --test
  scripts/scaffold-parity.test.mjs` exits 0 and its `route:` case passes)
  (Implements: S3, S7, S11, S12)
  Relevant files: skills/product-audit/SKILL.md, skills/product-audit/references/AUDIT_PROCESS.md

- P5 — Route a half-planned unit to replan: the classifier's residue row
  distinguishes `replan-in-unit` from `fold into phase` (validator: `node --test
  scripts/scaffold-parity.test.mjs` exits 0 and its classifier case passes)
  (Implements: S4, S8, S11)
  Relevant files: skills/review-implementation/references/CLASSIFY.md

- P6 — Register the unit, close the ledgers and run the whole gate (validator: `bun
  scripts/check-skill-context.mjs` exits 0, `node scripts/unit-route.mjs 355`
  prints `route: close-out`, and `node scripts/run-root-suite.mjs` exits 0)
  (Implements: S9, S10, S11, S13, S14, S15)
  Relevant files: docs/ROADMAP.md, docs/fix/355-scaffold-parity-routes/SPEC.md, docs/fix/355-scaffold-parity-routes/planning-obligations.md, .changeset/

The link grammar (`task-spec-link@1`) — every bullet names the requirements it
delivers on its own `(Implements: …)` line.

```text
task-spec-link@1
kind | shape | what it orders
link | (Implements: S<n>, S<m>, …) | the requirements this task delivers; metadata, never task text
```

### Planning evidence

The ledger is frozen as [`planning-evidence.md`](planning-evidence.md) beside
this document (M sizing) — the unit doc names it and never embeds a second copy.

### Obligations

The ledger is frozen as [`planning-obligations.md`](planning-obligations.md)
beside this document (M sizing). Before the unit ships every row is `verified`
(or an evidenced `n/a`).

## Acceptance criteria

One observable criterion per `S#`, each naming the check that proves it. This
section is the anchor a review's per-criterion coverage table reads.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 | Both exported templates carry the repo templates' re-cut section sequence and order (S1, S5) | `node --test scripts/unit-doc-contract.test.mjs` — the case for `template/docs/features/_TEMPLATE/SPEC.md` and `template/docs/fix/_TEMPLATE/SPEC.md` passes against `UNIT_DOC_SPEC_REF_SECTIONS` |
| AC-2 | No line under `template/` names `ACCEPTANCE.md`, `generate-docs` or a `## Phases` heading (S1, S5) | `node --test scripts/scaffold-parity.test.mjs` — the retired-artifact case lists zero offenders |
| AC-3 | The parity suite reproduces today's divergence as its own fixture before the fix and passes on the aligned one (S2, S6, S10) | `node --test scripts/scaffold-parity.test.mjs` — the red/green fixture pair passes; `E` row records the pre-fix red run |
| AC-4 | The parity suite runs in the root suite (S6) | `node scripts/run-root-suite.mjs` — the suite list carries `scripts/scaffold-parity.test.mjs` and exits 0 |
| AC-5 | Every finding line in `product-audit`'s fixed output block carries `route:`, the progressive-loading rule is stated once, and "never executes it" survives (S3, S7) | `node --test scripts/scaffold-parity.test.mjs` — the audit-route case asserts the block line, the single statement and the guarantee |
| AC-6 | `CLASSIFY.md`'s residue row routes planned-missing work to `replan-in-unit` and a one-line consumer to `fold into phase` (S4, S8) | `node --test scripts/scaffold-parity.test.mjs` — the classifier case asserts both branches in one row |
| AC-7 | `check-skill-context` stays green and no existing pin is weakened (S9) | `bun scripts/check-skill-context.mjs` exits 0; `git diff --name-only main` lists no pre-existing test file |
| AC-8 | No new skill, menu entry, audit dimension, audit subcommand or scope flag is introduced; #352, #354 and unit #353's documents are untouched (S11, S12, S13, S14) | `rg -n '\-\-residue|new dimension' skills/product-audit` matches 0; `git status --porcelain docs/fix/353-residue-shadow-copies` shows only the two-line ledger correction |

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. Nothing has been reviewed yet — the table starts empty.

```text
findings-table@1
column | shape | what it holds
id | F<n> | the stable finding id a fold and a log line cite
target | S<n> · <file>:<line> | the requirement or the location the finding names
axis | <axis> | the review axis that found it
severity | high \| med \| low | the ledger severity (the canonical scale)
class | product \| plan \| source \| environment \| runtime | the owner that repairs it
route | fold \| replan-in-unit \| decision-required \| product owner — … \| <free prose> | where the row goes; the router reads this column's head first (`scripts/unit-route.mjs`), and `class` names the owner that repairs it
```

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

Append-only. `L1` is the request verbatim; every later line carries one kind
token from `log-kind@1` — a request or correction, an evidence run, a gate run, a
folded finding, an owner decision, a phase's progress, a review run, a finding's
verification.

```text
log-kind@1
kind | token | what the line records
L | L<n> | the request or a correction, quoting the requester verbatim
E | E<n> | an evidence run — the command, its exit code and its output
G | G<n> | a gate run — the command and its exit code
F | F<n> | a folded finding — the fold commit and what was verified
D | D<n> | an owner decision — the authority and what was decided
P | P<n> | a phase's progress — what was done and the commit
R | R<n> | a review run — `HEAD <sha>`, the verdict, the cycle and the gate exit
V | V<n> | a finding's verification — the row it signs, the recheck and its result
```

- **L1** — 2026-11-02, the issue, verbatim:
  ```
  # ISSUE: scaffold templates and skill outputs drift from the re-cut unit doc — parity test, audit route at flight, planning-cause route

  ## What's wrong

  The unit document was re-cut to `spec-by-reference` (issue #308, feature 79), and the repo's own templates followed. **The scaffold that `init-workspace` copies into target projects did not**: `template/docs/**/_TEMPLATE/SPEC.md` still asks for the pre-#308 shape, and one of them still names an artifact retired by feature 61.

  | Surface | State | Evidence |
  |---|---|---|
  | `template/docs/features/_TEMPLATE/SPEC.md` | pre-#308 (14 flat sections) | 83 lines carrying `Objective/Why/User outcome/Acceptance criteria/Evidence/Progress log` vs 186 lines in `docs/features/_TEMPLATE/SPEC.md` carrying `Specs/Impact/Retirements/Tasks/Findings/Log` |
  | `template/docs/fix/_TEMPLATE/SPEC.md` | pre-#308 **and** names a retired artifact | line 6: *"the SPEC and sibling `ACCEPTANCE.md` are the source of truth, and its `## Phases` section is the execution ledger"* — `ACCEPTANCE.md` was retired by feature 61; 154 vs 212 lines |
  | Feature 79 (`spec-by-reference`) | `template/` never in scope | `grep 'template/' docs/features/79-*/SPEC.md` → 0 hits, and no `non-goal` declares the exclusion |
  | `template/AGENTS.md:46` | residue naming a removed surface | `\| Generated developer docs \| *(deprecated — generate-docs skill removed)* \|` |
  | `skills/workflow-status/SKILL.md:71` | old mechanics, not marked legacy | *"every in-flight feature folder's `TASKS.md` + `progress.md`"* — a migrated unit carries `## Tasks` + `## Progress log` |

  The cost is not one stale file: **nothing compares the scaffold with the mechanics**. A project bootstrapped today is born on a shape the lane no longer writes, and no gate notices.

  ## Expected behaviour

  1. **Scaffold parity.** `template/docs/**/_TEMPLATE/` matches the shape `phase-lint`/`unit-route` accept — or a recorded decision says the legacy shape is intentional. Zero mentions of retired artifacts (`ACCEPTANCE.md`, `## Phases`, `generate-docs`, `TASKS.md`/`progress.md` outside a line that marks them legacy).
  2. **A shape test, in code.** A deterministic check fails when the scaffold's template sections drift from the accepted grammar, and when any scaffold file names an artifact the repo has retired. It must reproduce today's divergence as a red fixture first.
  3. **The audit's route is the progressive-loading decision.** Each finding in `product-audit`'s report carries `route:` — the next command for that finding plus, optionally, the one reference that command loads. `none` costs no context. The audit states routes and never executes one; the report file stays the only mutation. (The owner asked for this explicitly: the route exists so the next run loads only what it needs — triage at flight — never as a schema to fill.)
  4. **A half-planned unit routes to replan.** `review-implementation/CLASSIFY.md` currently routes *"Exported helper of a delivered feature that nothing invokes"* to `fold into phase` always. When the missing half is **planned work**, the route is `replan-in-unit`, so the plan step learns the unit was cut short; a one-line consumer still folds. A fold repairs what exists, never what was never planned.

  ## Non-goals

  - No new skill, no new menu entry, no new audit dimension.
  - No subcommand or scope flag for the audit (`--residue` was considered and rejected): the residue sweep stays inside the full audit.
  - The distributable runner (`#352`) is untouched.
  - The open PR `#354` is untouched; its scope is residue coverage and it stays reviewable as is.

  ## Acceptance criteria

  - `template/docs/features/_TEMPLATE/SPEC.md` and `template/docs/fix/_TEMPLATE/SPEC.md` carry the section shape the repo's own templates carry, and no line names `ACCEPTANCE.md`, `## Phases` or `generate-docs`.
  - The shape test fails on a fixture reproducing today's two templates and passes on the aligned ones; it runs in the root suite.
  - `product-audit`'s fixed output block carries `route:` on every finding line, with the progressive-loading rule stated once and the "never executes a route" guarantee preserved.
  - `CLASSIFY.md`'s residue row distinguishes `replan-in-unit` (planned work missing) from `fold into phase` (one-line consumer).
  - `check-skill-context` stays green (any growth is re-based with its source declared), and no existing pin is weakened.

  ## Evidence / provenance

  - Owner decision in session (2026-11-02): the work is a new unit, not an amendment to `#354` ("B"), because appending scope to a PR already in review burns a full re-review and mixes two subjects.
  - The prepared wording for points 3 and 4 exists as a patch and will be attached to this issue as a comment; it was written red-first against `scripts/residue-dimensions.test.mjs`.
  - Checked: `grep 'template/' docs/features/79-*/SPEC.md` → 0; `wc -l` on both template pairs; `grep -rn 'ship-roadmap\|generate-docs\|ACCEPTANCE\.md\|review-findings\.md' template/` → 6 hits, 4 of them explanatory and 2 stale.
  ```
- **L2** — 2026-11-02, owner instruction, verbatim: the local, unpublished procedure — verbatim intent `S1..Sn`, frozen-failure corpus first, fixtures before the real tree, work inline (no `review-change`/`audit-pr`/fold cycle), freeze the planning ledgers before the first line of code, test-first slices, close the obligations ledger and hand the diff over for external verification.
- **D1** — 2026-11-02, owner instruction (L2 §4/§6): this repo's own review machinery does not judge this change. No `review-change`, no `audit-pr`, no fold cycle, no self-granted exception; the deterministic gates run always.
- **E0** — 2026-11-02, `node scripts/unit-route.mjs 355` · exit 0 · `route: plan-from-issue`, `ledger-size: 0 bytes` before this cut.
- **E1** — 2026-11-02, `wc -l template/docs/features/_TEMPLATE/SPEC.md template/docs/fix/_TEMPLATE/SPEC.md docs/features/_TEMPLATE/SPEC.md docs/fix/_TEMPLATE/SPEC.md` · exit 0 · `186 212 186 212` — the issue's 83/154 figures are stale; `27981233` already shipped the re-cut shape in the scaffold, leaving one `#308 §Scope 3` citation divergent.
- **E2a** — 2026-11-02, `rg -n -F 'ACCEPTANCE.md' template/ · rg -n -F 'generate-docs' template/ · rg -n -F '## Phases' template/` · exit 1 · zero hits for all three: the retired-artifact half of S1 is already true in the scaffold.
- **E2b** — 2026-11-02, `node --test scripts/scaffold-parity.test.mjs` · exit 1 · red first: 5 of 17 cases fail — the retirement case (`turn-contract.sh:56 — ACCEPTANCE.md`), the audit block/`never executes it`/process cases and the classifier case — while the 12 reader cases pass on their fixtures.
- **E3** — 2026-11-02, the same suite after the product prose landed · exit 1 · 1 failing case left (`the scaffold names no retired artifact…`), naming `template/.agentic-workflow/hooks/turn-contract.sh:56 — ACCEPTANCE.md`.
- **E4** — 2026-11-02, the same case after the hook comment was marked legacy · exit 0 · offenders `[]`; the drift-refusal case reports `features/_TEMPLATE/SPEC.md:19 — ACCEPTANCE.md`, and the legacy-allowance case passes on both `template/AGENTS.md` carrier paragraphs.
- **E5** — 2026-11-02, `node --test scripts/scaffold-parity.test.mjs` · exit 0 · 16/17 then 17/17 — the audit `route:` cell, the single progressive-loading statement, the `never executes it` guarantee and the classifier's two-branch row all match.
- **E6** — 2026-11-02, `node --test scripts/unit-doc-contract.test.mjs` · exit 0 · 19 tests (17 before), with `template/docs/features/_TEMPLATE/SPEC.md` and `template/docs/fix/_TEMPLATE/SPEC.md` now listed; `git diff main` on the file is the two added paths and their comment.
- **P1** — 2026-11-02, the red corpus and its reader landed: `scripts/scaffold-parity.test.mjs` plus six fixtures (red export, four drift cases, one retired-artifact case) · `bf8977a1`
- **P2** — 2026-11-02, the turn-contract hook's comment marks `ACCEPTANCE.md` as the legacy shape the hook tolerates; the scaffold's other mentions stay legacy-marked · `68d5f803`
- **P3** — 2026-11-02, the two exported templates joined the re-cut pin and the parity suite went green · `68d5f803`
- **P4** — 2026-11-02, the audit's finding line carries `route:` and the progressive-loading rule is stated once · `8b76cc59`
- **P5** — 2026-11-02, the classifier's residue row routes planned-missing work to `replan-in-unit` · `8b76cc59`
- **P6** — 2026-11-02, the unit registered in the roadmap, the ledgers closed and the whole gate run · `bf8977a1` + `68d5f803`
- **E7** — 2026-11-02, `node scripts/unit-route.mjs 355` · exit 0 · the unit resolves with its row registered; `git status --porcelain packages/` prints nothing.
- **G2** — 2026-11-02, `bun scripts/check-skill-context.mjs` · exit 0 · `PASS context budgets: 28 skills` (`product-audit` 3,081 est / 240 lines under its 3,192 ceiling).
- **G3** — 2026-11-02, `bun scripts/check-skill-context.mjs --routes` · exit 0 · `PASS route budgets: 14 routes` after the four `review-change:*` ceilings were re-based to `ceil(measured × 1.10)` with the growth source declared (the classifier row).
- **G4** — 2026-11-02, `node scripts/run-root-suite.mjs` · exit 0 · 1,367 tests, 1,367 pass, `fail 0`, `skipped 0`.

## Next

`/review-change 355-scaffold-parity-routes` — execution is complete and every obligation is `verified`; the SHA-bound review receipt is the PR's precondition for `/audit-pr`.

## References

- Issue [#355](https://github.com/gtrabanco/agentic-workflow/issues/355) — the request (`L1`).
- Roadmap row 92 `scaffold-parity-routes` (`docs/ROADMAP.md` § Features).
- Unit `docs/fix/353-residue-shadow-copies/SPEC.md` — its P6/S5/S6 claim names this work; P2 corrects that claim (S15).
- `scripts/unit-doc-contract.test.mjs` (the re-cut section pin), `scripts/residue-dimensions.test.mjs` (the residue wording pins), `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (the ceilings).

## Branch

`fix/355-scaffold-parity-routes`

## Depends on

None — independent. Unit #353 is adjacent (its residue suite is touched only to
keep its own claim true), never a merge prerequisite.

## Regression scope

| Scenario | Verifies it |
|---|---|
| `scripts/residue-dimensions.test.mjs` stays green after unit #353's S3/S4 claim and pins are removed | `node --test scripts/residue-dimensions.test.mjs` exits 0 |
| Every existing `unit-doc-contract` assertion keeps passing — the list is extended, never edited | `node --test scripts/unit-doc-contract.test.mjs` exits 0 and its pre-existing cases are byte-identical (the suite file's diff is two added paths) |
| The audit's persisted-report format, guardrails and `<id>` addressing are unchanged | `git diff main -- skills/product-audit/SKILL.md` touches only the finding block line and the rule paragraph |
| The classifier's severity table, decision table and step ordering are unchanged | `node --test scripts/residue-dimensions.test.mjs` exits 0 (its regression pins) |
| The scaffold still documents a legacy unit's carrier (`review-findings.md`) — a pre-#308 project stays readable | `rg -n 'review-findings.md' template/AGENTS.md` still matches |
