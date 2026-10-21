# 77 — promise-coherence-guard

> One-line: a promise whose text is executable must reproduce at the head — one
> guard that re-runs the claims a unit doc, a budget manifest, an acceptance
> line and a Turn-contract box make, and fails closed naming `file:line`.

## Issue

`#305` — tracked issue. The PR closes it via `Closes #305`.

## Objective

Build the single guard the issue asks for: `scripts/promise-coherence.mjs`, wired
into the root suite, which extracts the executable claims from the surfaces that
order work — a unit doc's Tasks/Obligations/Evidence validator cells, the
`SKILL_CONTEXT_BUDGETS.json` narrations, acceptance-criteria lines, and
Turn-contract boxes — runs each one, and fails closed with `file:line`, the claim,
and the observed output.

## Why

Unit `258-harden-needs-input-contracts` burned **12 review→fold cycles** and at
least **23 of its 56 findings were regressions of already-folded rows**. The gate
stayed green through all of them (727/727 tests, budgets PASS, phase-lint PASS)
because every existing guard checks *syntax*, *budgets* or *parity* — nothing
checks that a promise written in prose still reproduces against the bytes. Every
defect of that class was found by review and by no gate:

- an Obligation row declaring `grep -cE "requires [a-z ]*input"` `matches 4` and
  status `verified`, returning 0 at the head (F16, F50, VF-61);
- declared validators that returned 7 and then 12 against a declared `matches 4`
  (F38, F48);
- a Turn-contract box instructing an invocation its own §Consent had just
  amended, reproducing `missing-unit-doc` (F45, F53, VF-64);
- a budgets manifest narrating a basis and a citation the same branch had
  deleted (F18, F26, F27);
- an acceptance criterion promising "a 3–5 line pointer" while the shipped
  sections measured 19/20/15 lines (F55);
- Non-goals denying "any new runtime script" while the diff shipped the 391-line
  `scripts/needs-input.mjs` its own AC8 required (F56, VF-67).

Two of those still reproduce on `main` today, which is why this unit's corpus is
not archaeology: `docs/fix/258-harden-needs-input-contracts/SPEC.md:204` and
`:356` declare `matches 12` for commands that return **17**.

## User outcome

A reviewer stops spending cycles on the same class of defect. Running one
command answers "do the promises in this unit's documents still hold at this
byte state?", and the root suite answers it for the whole repository on every
push — with the failing claim, its `file:line`, and the output that refutes it.

## Acceptance criteria

1. **`## Impact` is a required unit-doc section.** `UNIT_DOC_REQUIRED_SECTIONS`
   carries 14 headings, `Impact` between `Acceptance criteria` and `Non-goals`,
   and the selector rejects a document without it and one that places it out of
   order, while still tolerating untracked extras. Verified by
   `bun run test` in `packages/agentic-workflow-schema` (exit 0).
2. **The three copies of the section list cannot drift.** The schema constant,
   the runner's duplicated list and the producer's skeleton agree, and both
   templates carry the 14 headings in contract order. Verified by
   `node --test scripts/unit-doc-contract.test.mjs` (exit 0).
3. **A declared validator reproduces.** A unit-doc validator cell that declares
   `matches <N>` or `exits <N>` is re-run and compared: the three historical
   count failures (declared 4, observed 0; declared 4, observed 7; declared 4,
   observed 12) are rejected fixtures. Verified by
   `node --test scripts/promise-coherence.test.mjs` (exit 0).
4. **A budgets narration reproduces.** `ceil(<A> x 1.10) = <B>` is re-computed
   in exact decimal arithmetic, every declared estimate ceiling must be a value
   its own entry derives, every backticked path must exist, and a phrase claimed
   removed must be absent from the surface that names it. A `measured … est …
   lines` claim is checked only when it says *at the head* — an earlier basis is
   history, and `check-skill-context.mjs` already refuses a ceiling the head
   measurement exceeds. Verified by the same suite (exit 0).
5. **An acceptance claim reproduces.** A count claim (`matches <N>`, `exactly
   <N>`) and a section-length claim (`<N>–<M> line <section>`) are recounted, and
   an `## Impact` that names a path or a phrase is resolved. Verified by the same
   suite (exit 0).
6. **A Turn-contract box discloses what its invocation needs.** A box that
   invokes a script with a placeholder whose required artifact the box never
   names fails closed, with the historical `missing-unit-doc` case as a rejected
   fixture; a ledger the template publishes side by side stays parseable by the
   dispatcher (the F54 case). Verified by the same suite (exit 0).
7. **The repository's own head passes.** `bun scripts/promise-coherence.mjs`
   exits 0 with `verdict PASS`, and its block prints one `skip:` line per claim
   it deliberately does not execute (no silent cap). Verified by
   `node --test scripts/promise-coherence.test.mjs` (exit 0) and by the
   Evidence rows below.
8. **Fold/fix scope is stated in the positive, everywhere.** `execute-phase`'s
   embedded fold checklist and the lane's implement step say the batch is the
   change *plus its dependents*, survivors swept in the same batch — the phrasing
   `fold-findings` 1.9.0 already ships — with no "only the diff" wording left.
   Verified by `node --test scripts/promise-coherence.test.mjs` (the
   `fold-scope` case) and by the skill diff.
9. **The gate stays green overall.** `node --test scripts/*.test.mjs` exits 0,
   `bun scripts/check-skill-context.mjs` and `--routes` exit 0, and
   `bun scripts/phase-lint.mjs docs/features/77-promise-coherence-guard/SPEC.md`
   exits 0.

## Impact

What the change touches beyond its own files, cut at plan time:

- **Consumers of `UNIT_DOC_REQUIRED_SECTIONS`:** the `spec-product-v1` selector
  (`packages/agentic-workflow-schema/src/pre-execution.ts`) and every surface
  that reads it — `scripts/pre-execution-snapshot.mjs`, the pre-execution sensor
  and the review stages. They now refuse a 13-section document; a lane-era unit
  doc missing `## Impact` fails with `selector-heading-missing`.
- **The runner crate's duplicate list:** `packages/agentic-workflow/src/edit/schema.mjs`
  says 13 in its own words and `packages/agentic-workflow/src/edit/UnitDoc.mjs`
  writes the skeleton. Both
  follow, or the producer ships documents its validator rejects.
- **Producers:** the two unit-doc templates, the `UnitDoc` skeleton, and every
  fixture document that stands in for a unit doc in the root suite
  (`pre-execution-sensor`, `-timeline`, `-wording-only-manifest`,
  `lane-era-lineage`, the schema package's `toySpec` and README example).
- **Mentions that stop being true:** `MIGRATION.md` ("the 13 required sections;
  `## Impact` rides beside them"), `LANE_FLOW.md` ("the 13
  `UNIT_DOC_REQUIRED_SECTIONS` plus `## Impact`" and a table with no Impact row),
  `template/AGENTS.md` and `init-workspace` (both listing `Impact` before the
  acceptance criteria, which the selector's ordering rule forbids).
- **The npm packages:** the schema package (published vocabulary), the runner
  (its `edit` output) and the pi package (its `skills/**` content trigger and its
  pins).
- **Ask before touching:** the archived two-half SPECs (36 of them carry an
  `Impact` section of a *different* template; they are append-only evidence and
  this unit never rewrites them).

## Non-goals

- Rewriting any historical unit doc, review-findings ledger or Progress log
  (append-only evidence, per the issue).
- Adding a prose prohibition. Every check the guard performs is a runnable
  command with a fixed output and a fixed fail-closed code.
- Executing `node --test`, `bun …`, `gh …` or any writing command from a
  document. Those are reported as `skip:` lines and the root gate already runs
  them; a document must not be able to launch a second, slower gate.
- Replacing `phase-lint`, the pre-execution gate, `review-change` or
  `audit-pr`. The guard reads the grammars those owners publish and adds no
  sixth grammar.
- Making the guard a merge gate (`audit-pr`) or a review step. It is a
  root-suite pass plus one CLI a reviewer can run.
- Touching the 36 archived two-half SPECs that already carry a legacy `Impact`
  section.

## Future

- **Golden-fixture runner configuration.** The fixture's model must be
  configurable in the project config (unlimited-tier model preferred), and the
  run must be automatable toward reviews with a closed three-mode policy:
  unlimited (`-1`/`Infinity`), off (`0`), or N attempts per PR. Config schema +
  runner + corpus of its own — planned as its own unit, owner decision D-77-4
  (2026-10-21, `planned`).
- **`## Impact` as a checked closure.** A later unit could assert that every path
  an `## Impact` names appears in some phase's `Relevant files:` — cut here
  because it needs the read-set consumers, not just the guard (owner, 2026-10-21,
  `open`).

## Future cost

| Rule | Binds |
|---|---|
| A declared outcome in a document is a promise the guard re-runs; a prose claim with no runnable form is a review finding, and a claim written in a grammar the guard reads is a gate | every author of a unit doc, budget narration, AC line or Turn-contract box |
| The guard's claim kinds are a closed set; adding one is a SPEC change in the owning reference, never a new branch in the script | whoever extends `scripts/promise-coherence.mjs` |
| A `skip:` line is a disclosed gap, not a pass — a claim the guard cannot execute must be visible in its block | reviewers reading the block |
| The three copies of the section list stay pinned by `scripts/unit-doc-contract.test.mjs`; a fourth copy is a drift defect | whoever adds a producer of unit documents |

## Applicable tests

`node --test scripts/unit-doc-contract.test.mjs`,
`node --test scripts/promise-coherence.test.mjs`,
`bun run test` in `packages/agentic-workflow-schema`,
`bun run test` in `packages/agentic-workflow`, and the root suite
`node --test scripts/*.test.mjs`.

## Known pre-existing issues

- `docs/fix/258-harden-needs-input-contracts/SPEC.md:204,:356` declare
  `matches 12` for `grep -cE "^(\\|.*258|.*harden-needs-input)" CHANGELOG.md` and
  `grep -cE "258" CHANGELOG.md`, both of which return **17** at this head —
  `does not affect` this unit's gate (the guard reads unit docs of in-flight
  units, not closed ones) and `affects` the guard's design: it is the reason the
  corpus is replayed as fixtures instead of scanned repo-wide.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` narrates `init-workspace` as
  `measured 3330 est / 229 lines` while the head measures 3219/229, and
  `workflow-status` as `2512 est / 150 lines` against 1639/132 — `does not
  affect` this unit's gate: both are historical bases (neither says "at the
  head"), and the guard checks a basis only when a narration claims it for the
  head. They are stale narrations, not false promises, and re-basing them is a
  budget change this unit does not make.
- `docs/fix/179-declared-ledger-delta-receipts/SPEC.md:189-195` names
  `docs/features/_TEMPLATE/LEDGERS.md`, `docs/fix/_TEMPLATE/LEDGERS.md` and
  `references/02_CLOSURE_AND_SCOPE_GATES.md`, all of which no longer exist. The
  guard reports it when that doc is passed explicitly; the default set skips it
  because the unit was never started (a plan's path list may name a tree the unit
  creates). **Handed to the owner** — it is a `triage-issue` disposition, not a
  change this unit may make to another unit's doc.
- The 36 archived two-half SPECs carry a legacy `## Impact` section with a
  different meaning — `does not affect` this unit; the selector never accepted
  those documents and they are not rewritten.

## Tasks

- P1 — Make `## Impact` a required section: the schema constant gains it between Acceptance criteria and Non-goals, the runner's duplicated list and its `UnitDoc` skeleton follow, the four fixture documents and the package README example migrate, and the five prose surfaces that named the order are corrected (validator: `node --test scripts/unit-doc-contract.test.mjs` exits 0 and `bun run test` inside `packages/agentic-workflow-schema` exits 0)
  - Relevant files: packages/agentic-workflow-schema/src/pre-execution.ts, packages/agentic-workflow/src/edit/schema.mjs, packages/agentic-workflow/src/edit/UnitDoc.mjs, docs/workflow/MIGRATION.md, docs/workflow/LANE_FLOW.md, template/AGENTS.md, skills/init-workspace/SKILL.md

- P2 — Build the guard's unit-doc validator pass: extract a validator cell from `## Tasks`, `### Obligations` and `## Evidence`, run a reader command, compare `matches <N>` / `exits <N>`, print the fixed fail-closed block, and replay the three count regressions as rejected fixtures (validator: `node --test scripts/promise-coherence.test.mjs` exits 0)
  - Relevant files: scripts/promise-coherence.mjs, scripts/promise-coherence.test.mjs, scripts/fixtures/promise-coherence

- P3 — Add the budget-narration pass: recompute `ceil(<A> x 1.10) = <B>`, require the declared ceiling to equal the re-based value, require a `measured <est> est / <lines> lines` claim to equal the current measurement, resolve every backticked path, and reject a phrase claimed removed that is still present; replay the manifest regressions and repair the live one (validator: `node --test scripts/promise-coherence.test.mjs` exits 0)
  - Relevant files: scripts/promise-coherence.mjs, docs/workflow/SKILL_CONTEXT_BUDGETS.json

- P4 — Add the acceptance-line and Impact pass: recount `matches <N>` / `exactly <N>` claims, recount a `<N>–<M> line <section>` claim against the named section, resolve every path an `## Impact` names, and reject the historical 3–5-line and no-new-runtime-script contradictions (validator: `node --test scripts/promise-coherence.test.mjs` exits 0)
  - Relevant files: scripts/promise-coherence.mjs, scripts/promise-coherence.test.mjs

- P5 — Add the Turn-contract box pass: run a box's script invocation, read the typed refusal the script declares, and fail closed when the box never names the artifact that refusal requires; pin the template-published side-by-side ledger as parseable by the dispatcher (validator: `node --test scripts/promise-coherence.test.mjs` exits 0)
  - Relevant files: scripts/promise-coherence.mjs, scripts/needs-input.mjs

- P6 — Wire the guard into the root suite, state the claim grammar in the references that already own each cell, and sweep the fold-scope phrasing in `execute-phase` and `unit-lane` to the positive (change plus dependents, survivors swept in the same batch) (validator: `node --test scripts/*.test.mjs` exits 0 and `bun scripts/check-skill-context.mjs --routes` exits 0)
  - Relevant files: skills/pre-execution-review/references/LEDGERS.md, skills/verification-contract/SKILL.md, skills/orchestration-envelope/references/TURN_CONTRACT.md, skills/execute-phase/SKILL.md, skills/unit-lane/references/IMPLEMENT.md

- P7 — Verification sweep at the head: root suite, context budgets, route budgets, phase-lint on this document and the guard on the repository's own surfaces, with every Evidence row re-run (validator: `node --test scripts/*.test.mjs` exits 0)
  - Relevant files: docs/features/77-promise-coherence-guard/SPEC.md

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1 | `cd packages/agentic-workflow-schema && bun run test` | exit 0 | 721 pass, 0 fail | P1 |
| AC1 | `cd packages/agentic-workflow && bun run test` | exit 0 | 216 pass, 0 fail (producer emits 14 sections) | P1 |
| AC2 | `node --test scripts/unit-doc-contract.test.mjs` | exit 0 | 7 pass, 0 fail | P1 |
| AC3 | `node --test scripts/promise-coherence.test.mjs` | exit 0 | 24 pass, 0 fail — F16/F50, F38/F48 fixtures rejected | P2 |
| AC4 | `node --test scripts/promise-coherence.test.mjs` | exit 0 | exact arithmetic: `ceil(3330 x 1.10) = 3664` refused as 3663 | P3 |
| AC5 | `node --test scripts/promise-coherence.test.mjs` | exit 0 | 15-line section against a `3–5 line` promise refused | P4 |
| AC6 | `node --test scripts/promise-coherence.test.mjs` | exit 0 | undisclosed `<unit-dir>` prerequisite refused; F54 pinned in `needs-input.test.mjs` | P5 |
| AC7 | `bun scripts/promise-coherence.mjs` | exit 0 | `verdict PASS` · `claims: 34 checked · 70 skipped` | P6 |
| AC8 | `node --test scripts/promise-coherence.test.mjs` | exit 0 | the fold/implement scope test passes with the guard in both checklists | P6 |
| AC9 | `node --test scripts/*.test.mjs` | exit 0 | 775 pass, 0 fail | P7 |
| AC9 | `bun scripts/check-skill-context.mjs` | exit 0 | PASS context budgets: 28 skills | P6 |
| AC9 | `bun scripts/check-skill-context.mjs --routes` | exit 0 | PASS route budgets: 14 routes | P6 |
| AC9 | `bun scripts/phase-lint.mjs docs/features/77-promise-coherence-guard/SPEC.md` | exit 0 | 7/7 phases PASS | P7 |
| AC9 | golden fixture, `execute-phase` 6.1.0 + `FOLDING.md` (owner-authorized single run, `nan/qwen3.6` spawn override) | `exact 4/4 · invented none · shape ok` | run-log row 2026-10-21; child model identity flagged to the owner (D-77-4) | P7 |

## Progress log

2026-10-21 14:00 — open — unit doc written, owner decision D-77-1 recorded (`## Impact` becomes required), path-protection plan declared pre-freeze → none — next: P1

2026-10-21 16:40 — P1 — `## Impact` required: schema constant, runner duplicate, producer skeleton, four fixtures and the README example migrate; five prose surfaces re-ordered; parity test added → 1ec88964 — next: P2

2026-10-21 18:20 — P2 — the guard's unit-doc validator pass + the frozen corpus (F16/F38/F48/F50), with the live 258 reproducer as a case → 59d07458 — next: P3

2026-10-21 18:20 — P3 — budget-narration pass: exact decimal arithmetic, derived-ceiling membership, named surfaces and removal claims; three live manifest defects repaired (3004 off-by-one, a re-basis stating no value, the `--json` measurement output) → 59d07458 — next: P4

2026-10-21 18:20 — P4 — acceptance-line and `## Impact` pass: count recount, anchored section-length recount, unanchored length fails closed, F56 contradiction → 59d07458 — next: P5

2026-10-21 18:20 — P5 — Turn-contract box pass with `PREREQUISITES` declared by the dispatcher; F53's fixture refused, the three shipped skills pass → 59d07458 — next: P6

2026-10-21 19:10 — P6 — grammar sentences published in their owners, fold/implement scope swept positive with the guard in both checklists, five skills and the pi package bumped, 17 route ceilings re-based → da95ff5b — next: P7

2026-10-21 21:05 — delivery round — owner decisions D-77-4 recorded: D1 disclosure shipped (74e729b0), D2 accepted as a pin, D4a the golden fixture ran once (PASS, model identity flagged), D4b the fixture-runner config is a planned future unit, D5 single PR → HEAD — next: PR

2026-10-21 19:40 — P7 — verification sweep at the head: root suite 755/755, budgets PASS, routes PASS, phase-lint PASS, guard PASS, both package suites green, differential against main shows only the requested growth → HEAD — next: owner review of the diff


2026-10-21 20:30 — rebase — the branch rebased onto `origin/main` (6e4d4e65), so the unit-36 fold it predated is now the base. Conflict resolution restored three files the merge truncated (`verification-contract/SKILL.md`, `pre-execution-review/SKILL.md`, `LEDGERS.md` 242 lines) and re-applied P6 on top; 16 route ceilings re-based, `policy.declared` re-basis #8 → 3f189d0f — next: repair

2026-10-21 21:00 — repair — the rebase had also dropped `b440e8ee`'s D1 disclosure, three guard tests and the `manifest-measure.json` fixture; all restored. Evidence re-run at this head: root 766/766, schema 721/721, runner 216/216, AC2 7, guard suite 24, guard `30 checked · 50 skipped`, budgets + routes PASS, phase-lint 7/7 → HEAD — next: PR re-review

2026-10-21 22:30 — rebase 2 — rebased onto `origin/main` 161713ea (fix #303 / PR #310). `unit-lane` merges to 2.3.0, carrying both #303's investigate→orient→ask stages and this unit's fold/implement scope plus the guard in the resume checklist; `CHANGELOG` keeps main's 0.24.3/0.24.4 rows alongside this unit's 0.25.0/0.26.0, and the 0.26.0 row restates `unit-lane` 2.3.0. Evidence re-run at this head: root 775/775, schema 721/721, runner 216/216, pi 432/432, guard suite 24, guard `34 checked · 70 skipped`, budgets + routes PASS, phase-lint 7/7 → HEAD — next: push and PR re-review

## Next

Owner review of PR #309 (`https://github.com/gtrabanco/agentic-workflow/pull/309`); the
external verifier decides, and no self-approval follows from a green suite.

## References

Issue `#305`; owner decision 2026-10-21 (D-77-1, `## Impact` required);
`docs/fix/258-harden-needs-input-contracts/review-findings.md` (the corpus:
F16, F18, F26, F38, F48, F50, F53, F54, F55, F56, VF-61, VF-64, VF-65, VF-67);
`skills/phase-contract/SKILL.md` (the fail-closed block shape this guard copies);
`packages/agentic-workflow-schema/src/pre-execution.ts`
(`UNIT_DOC_REQUIRED_SECTIONS`). The PR closes the tracked issue via `Closes #305`.
