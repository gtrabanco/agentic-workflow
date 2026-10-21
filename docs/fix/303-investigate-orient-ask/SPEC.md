# fix/303-investigate-orient-ask

## Issue

`#303` — tracked issue in the project's forge. The PR must close it via
`Closes #303` in the body.

## Objective

Restate the lane's design and plan steps **positively**. Both references now carry the
same four ordered stages — `investigate → orient → ask → decide` — each with a fixed
output, and every claim a step asserts must cite a source (`path:line`, a doc, or a
recorded owner answer) or it is a question, never a default.

## Why

The design/plan contracts prescribed prohibitions ("never assume", "never invent an AC")
and almost no positive procedure. A model left with only the forbidden half has the whole
rest of the space free, and the observed failure is exactly what the prohibition names:
inventing what it does not know. A prohibition list constrains a shrinking space; a
positive checklist (`pass only if:` ✓ items, fixed output block) is what a weak model can
actually execute — the repository's own standard.

Three defects in the working tree made the failure reachable even with good intentions:
the stage headings of the two references disagreed with each other and left
`## Planning ledgers (same step)` outside the plan's stages; the plan step was told to read
"only the ASK-* rows" of `decisions.md`, which for a `fix` unit is empty (design never ran —
`scripts/catalog.json` gates `design` on features, `plan` on features *and* fixes); and the
row shapes the first attempt published (`INV-*`, `OR-*`, `OR-PLAN-*`, `ASK-*`) were read by
no tool at all, while the one ledger with a reader — `open-questions@1` — went untouched.

## User outcome

An owner running the lane can open the unit folder and see, per claim, **where it came
from**: `sources.md` answers "what did you base this on?" for every SPEC and plan claim, and
`decisions.md` answers "what did you ask me, and what did I answer?" for every question the
step raised. A reviewer can check both mechanically, and a resumed session re-reads them
instead of re-asking.

## Acceptance criteria

- AC1 — Both references carry the four ordered stages as `## Stage <n> — <slug>` headings
  in the order investigate → orient → ask → decide, and no slug collides with the receipt
  vocabulary (`spec` / `plan`). Validator: `node --test scripts/knowledge-honesty-contract.test.mjs` exits 0.
- AC2 — The investigate stage opens with a provenance search and journals every claim to
  `sources.md` with a source and a certainty. Validator: the suite's "every claim … cites"
  case exits 0.
- AC3 — The orient stage runs tiers 0 provenance → 1 research → 2 ask (in that order), then
  filters by cost of being wrong. Validator: the suite's "orient runs a provenance search"
  case exits 0 for both references.
- AC4 — The ask stage writes the `open-questions@1` block the dispatcher reads, and the
  decide stage closes it with `decision` rows; both references publish an example that
  parses with the real reader. Validator: the suite's "ledger rows … parse with the real
  ledger reader" case exits 0.
- AC5 — Each fixed output contract carries the questions pane — `Asked | Resolution`, or the
  literal `none — no questions: …`. Validator: the suite's "questions asked and their
  resolutions" case exits 0.
- AC6 — The lane's turn contract ticks the two knowledge-honesty boxes (every claim cited,
  every question recorded with its resolution). Validator: the suite's "turn contract ticks"
  case exits 0.
- AC7 — Prohibition-only wording is gone: neither reference says "never assume" where a
  procedure belongs, and the inference rule is stated once as a rule. Validator: the suite's
  "prohibit-instead-of-prescribe" case exits 0.
- AC8 — `PLAN.md`'s duplicate `OR-PLAN-001` sweep table is removed; the sweep's hits are
  answered through the one ledger. Validator: `grep -c "OR-PLAN" skills/unit-lane/references/PLAN.md` → 0.
- AC9 — Context budgets pass. Validator: `bun scripts/check-skill-context.mjs` exits 0 and
  `bun scripts/check-skill-context.mjs --routes` exits 0.
- AC10 — The whole root suite passes: `node --test scripts/*.test.mjs` exits 0.
- AC11 — Version parity holds: `unit-lane` 2.2.0 and the Pi package 0.24.4, each with its
  CHANGELOG row. Validator: `node scripts/version-parity-gate.mjs --content --base main`
  exits 0.
- AC12 — No execution-topology change and no skill re-creation: `scripts/catalog.json` and
  `scripts/unit-route.mjs` are untouched. Validator: `git diff --stat main -- scripts/catalog.json scripts/unit-route.mjs` → empty.
- AC13 — This unit's own `decisions.md` is a well-formed ledger with no pending question.
  Validator: `node scripts/needs-input.mjs docs/fix/303-investigate-orient-ask` exits 0.

## Impact

- `skills/unit-lane/references/DESIGN.md`, `skills/unit-lane/references/PLAN.md` — rewritten
  around the four stages. Every consumer of the design/plan *outputs* changes with them:
  `execute-phase` reads the unit doc's Tasks (unchanged shape), `pre-execution-review`'s
  `SNAPSHOT.md` binds `decisions.md` in the plan stage (unchanged — the file still carries
  `open-questions@1`), and `unit-route.mjs --triage` reads no reference text.
- `skills/unit-lane/SKILL.md` — two turn-contract boxes; version 2.2.0.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — the `unit-lane` reference ceilings, re-based
  on the measured files.
- `packages/pi-agentic-workflow/package.json` — 0.24.4, because `skills/**` is the package's
  shipped content.
- `sources.md` is a **new** unit-folder pane. Anything that enumerates a unit folder's files
  must tolerate it appearing (`SNAPSHOT.md` binds named rows, never a directory listing).

## Non-goals

- No execution-topology change (row 68 owns it) and no skill re-creation.
- No change to `scripts/needs-input.mjs` — discovery D1 (the reader's ordering rule) is
  recorded in `decisions.md` for the owner, not fixed here.
- No change to `review-change` / `audit-pr`.
- No new gate or stage verdict: the sweep stays advisory, and the provenance search is a
  step instruction, not a check the workflow runs against a project.

## Future

none

## Future cost

- The `sources.md` pane is now expected in every unit folder the lane designs. A unit that
  omits it is a review finding, not a crash — nothing reads the file mechanically yet.

## Applicable tests

`node --test scripts/knowledge-honesty-contract.test.mjs` (this unit's contract),
`node --test scripts/*.test.mjs` (the root suite),
`bun scripts/check-skill-context.mjs` and `--routes` (budget ceilings),
`node scripts/version-parity-gate.mjs --content --base main` (version parity).

## Known pre-existing issues

- **`scripts/needs-input.mjs` skips prose written before the `open-questions@1` block**
  (discovery D1). It *affects* this unit's own `decisions.md` — the block is placed directly
  under the title so the reader finds it — and it does not affect the shipped references,
  whose fenced examples the reader treats as quoted text.
- **The base tree's root suite does not reproduce green from a bare `git archive`** (the
  generated schema `dist/` is gitignored, and `packages/pi-agentic-workflow` resolves it),
  and two suites read git history (`ledger-provenance`). It *does not affect* this unit:
  the differential run rebuilt `dist/` and re-inited git, after which the base agrees with
  the change on every failure.

## Tasks

- P1 — RED: the knowledge-honesty contract suite pins the four stages, the citation box, the
  questions pane, and the published ledger's parseability (validator: `node --test scripts/knowledge-honesty-contract.test.mjs` exits 1 before the references change, 0 after)
  - Relevant files: `scripts/knowledge-honesty-contract.test.mjs`, `scripts/needs-input.mjs`
- P2 — Rewrite `DESIGN.md` around investigate → orient → ask → decide (validator: `grep -c "^## Stage" skills/unit-lane/references/DESIGN.md` prints 4)
- P3 — Rewrite `PLAN.md` around the same four stages and drop the `OR-PLAN-001` table (validator: `grep -c "OR-PLAN" skills/unit-lane/references/PLAN.md` exits 1, i.e. prints 0)
- P4 — Add the two turn-contract boxes and bump `unit-lane` to 2.2.0 (validator: `grep -cE "^✓ Every (claim|question asked)" skills/unit-lane/SKILL.md` prints 2, and `grep -c "^version: 2.2.0$" skills/unit-lane/SKILL.md` prints 1)
- P5 — Re-base the `unit-lane` reference ceilings on the measured files (validator: `bun scripts/check-skill-context.mjs` exits 0)
- P6 — Record the unit's ledgers: `decisions.md` (ledger + discoveries + sweep), `BRIEF.md`, this SPEC (validator: `node scripts/needs-input.mjs docs/fix/303-investigate-orient-ask` exits 0)
- P7 — Bump the Pi package to 0.24.4 with its CHANGELOG row (validator: `node scripts/version-parity-gate.mjs --content --base main` exits 0)
- P8 — Final verification (validator: `node --test scripts/*.test.mjs` exits 0)

### Planning evidence

| id | claim | source | status |
|---|---|---|---|
| PE-001 | The design/plan references prescribed prohibitions with almost no procedure | `skills/unit-lane/references/DESIGN.md` @ `main` — section text | verified |
| PE-002 | The one ledger with a mechanical reader is `open-questions@1` | `scripts/needs-input.mjs:43,65,148` | verified |
| PE-003 | `design` is a feature-only step while `plan` runs for fixes too | `scripts/catalog.json` (`applies_when`) | verified |
| PE-004 | A receipt stage vocabulary is `spec \| plan` | `packages/agentic-workflow-schema/src/pre-execution-contract.ts:45` | verified |
| PE-005 | The reference budget ceiling is per-skill, not per-file | `scripts/check-skill-context.mjs:161-165` | verified |

### Obligations

| obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status |
|---|---|---|---|---|---|---|---|---|
| O1 | `#303` AC1 | the design/plan steps state a positive procedure | P2, P3 | lane author | the four ordered stage headings | suite exits 0 | verified |
| O2 | `#303` AC2 | every spec/plan claim is source-cited | P2, P3 | lane author | the citation checklist box | suite exits 0 | verified |
| O3 | `#303` AC4 | the golden-fixture smoke still holds | P8 | lane author | `scripts/golden-fixture.test.mjs` | root suite exits 0 | verified |
| O4 | `AGENTS.md` (Version every change) | the shipped content's version and CHANGELOG row move together | P4, P7 | lane author | `version-parity-gate.mjs --content` | exit 0 | verified |
| O5 | `#303` §Out of scope | no execution-topology change, no skill re-creation | P8 | lane author | `git diff main -- scripts/catalog.json scripts/unit-route.mjs` | empty | verified |

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| AC1…AC7 | `node --test scripts/knowledge-honesty-contract.test.mjs` | exit 0 | `ℹ tests 9 / ℹ pass 9 / ℹ fail 0` | lane author |
| AC8 | `grep -c "OR-PLAN" skills/unit-lane/references/PLAN.md` | exit 1 (0 matches) | `0` | lane author |
| AC9 | `bun scripts/check-skill-context.mjs` / `--routes` | exit 0 / exit 0 | `PASS context budgets: 28 skills` / `PASS route budgets: 14 routes` | lane author |
| AC10 | `node --test scripts/*.test.mjs` | exit 0 | `ℹ tests 744 / ℹ pass 744 / ℹ fail 0` | lane author |
| AC11 | `node scripts/version-parity-gate.mjs --content --base main` | exit 0 | `version: 0.24.2 → 0.24.4` … `VERDICT: PASS` | lane author |
| AC12 | `git diff --stat main -- scripts/catalog.json scripts/unit-route.mjs` | exit 0 | empty | lane author |
| AC13 | `node scripts/needs-input.mjs docs/fix/303-investigate-orient-ask` | exit 0 | `Open questions: 0` / `Pending: none` | lane author |
| differential | phase-lint, unit-route `--triage`, needs-input run against a rebuilt base copy vs this tree | identical stdout+exit | three `IDENTICAL` diffs | lane author |

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

- 2026-10-22 19:05 — Read issue #303 and the branch head; found the branch already carried a partial attempt (three stages, minted row shapes, a grammar typo at DESIGN.md:24) → evidence: `git show f6e50b56` — next: pin the missing rules as a RED suite
- 2026-10-22 19:20 — Wrote `scripts/knowledge-honesty-contract.test.mjs` and ran it against the unchanged tree: 8 of 9 cases failed → evidence: RED run output — next: validate the ledger shapes on a throwaway fixture
- 2026-10-22 19:35 — Built a toy unit under `mktemp -d`: `needs-input` exits 0 with zero pending; an uncited claim row fails the citation probe; scratch removed → evidence: fixture run — next: rewrite the two references
- 2026-10-22 19:50 — Rewrote `DESIGN.md` and `PLAN.md` around the four stages; added the two turn-contract boxes → evidence: suite 9/9 pass — next: budgets and versions
- 2026-10-22 20:05 — Re-based the `unit-lane` reference ceilings; bumped `unit-lane` 2.2.0 and the Pi package 0.24.4 with CHANGELOG rows → evidence: `check-skill-context` PASS, parity PASS — next: unit ledgers
- 2026-10-22 20:20 — Recorded `decisions.md` (ledger first, then discoveries and the sweep), `BRIEF.md`, and this SPEC → evidence: `needs-input` exit 0 — next: hand the diff to the owner

## Next

Hand the diff to the owner for external verification (this unit is not self-approved).

## References

- Issue: [#303](https://github.com/gtrabanco/agentic-workflow/issues/303)
- ROADMAP row 68 (subagent-first-execution) names this unit as the related knowledge-honesty unit
- Prior unit: [`docs/fix/258-harden-needs-input-contracts/`](../258-harden-needs-input-contracts/) — the needs-input ledger this unit's questions ride on
- Owner directive quoted in the issue: "investigate, orient and ask, never decide the unknown"

## Branch

`issue-303`

## Depends on

none

## Regression scope

The two references are prose; the behavior they change is contractual, not executable.
Every executable consumer was checked differentially against a rebuilt copy of `main`:
`phase-lint` (golden fixture), `unit-route --triage`, and `needs-input` (the new suite's
reader) produced byte-identical stdout and the same exit codes. The root suite's 744 tests
include the retiring-behaviour cases for the skills' envelopes, the turn-contract grammar,
and the golden fixture, so a wording change that broke a contracted token would fail there.
