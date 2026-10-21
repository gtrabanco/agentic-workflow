# Decisions — unit 303 (investigate-orient-ask)

The question ledger (`open-questions@1`, the grammar `scripts/needs-input.mjs` reads), the
resolutions the decide stage recorded, and the assumptions taken instead of asking:

open-questions@1
id | date | type | question | blocks | search-receipt | options | route

## Investigate — provenance search (2026-10-22)

Search receipt: `grep -rn "never assume" skills/` → two hits (`fold-findings` 19, `audit-pr` 4) and
`skills/execute-phase/references/EXECUTION_CONTRACT.md:77`, none in the design/plan path;
`grep -n "^## " skills/unit-lane/references/{DESIGN,PLAN}.md` → DESIGN had 3 stage headings mixed with
5 non-stage `##` headings, PLAN had 2 stages and left `## Planning ledgers (same step)` outside them;
`grep -rn "INV-0\|OR-0\|ASK-0\|OR-PLAN" --include=*.md` → the row shapes existed **only** in the two
references, published by no tool; `grep -n "PRE_EXECUTION_STAGES" packages/agentic-workflow-schema/src/pre-execution-contract.ts:45`
→ `["spec","plan"]`, the collision that made a stage named `plan` unjournalable; `docs/workflow/LANE_FLOW.md:76-107`
→ the open-question ledger's owner is `template/AGENTS.md:164`, read by `scripts/needs-input.mjs`; prior unit
`docs/fix/258-harden-needs-input-contracts/` → the self-validation loop this unit must not repeat.

| id | claim | source | certainty |
|---|---|---|---|
| INV-001 | the issue's owner directive is "investigate, orient and ask, never decide the unknown" | `#303` body §Summary | confirmed |
| INV-002 | a prohibition-only contract leaves the rest of the space free for a weak model | `#303` body §Why | confirmed |
| INV-003 | the open-question ledger's grammar is owned by the template agent guide, not by a skill | `template/AGENTS.md:164` + `skills/orchestration-envelope/references/TURN_CONTRACT.md:93` | confirmed |
| INV-004 | the dispatcher is `scripts/needs-input.mjs`; it parses `id \| date \| type \| question \| blocks \| search-receipt \| options \| route` | `scripts/needs-input.mjs:65` | confirmed |
| INV-005 | a receipt stage vocabulary is `spec \| plan`; a plan stage token would collide | `packages/agentic-workflow-schema/src/pre-execution-contract.ts:45` | confirmed |
| INV-006 | `design` runs only for features; `plan` runs for features and fixes | `scripts/catalog.json` (`applies_when`) | confirmed |
| INV-007 | git archive of `main` does not carry the generated schema `dist/`, so a differential run needs `bun run build` | observed: base copy suite 496/563 before the build, 699/735 after | confirmed |

## Orient — tiers and cost (2026-10-22)

| tier | claim | how it settled |
|---|---|---|
| 0 provenance | INV-001…INV-006 | cited above; no question needed |
| 0 provenance | a plan step cannot forbid reading the ACs | `scripts/catalog.json` shows `plan` runs for `fix` units where `design` never ran, so "read only the ASK rows" would leave a fix unit's plan with no input (INV-006) |
| 1 research | what to name the stage that cuts and records | `decide`/`record` are outside both closed vocabularies (INV-005); `decide` reads as a verb, so it stays |
| 2 ask | none — the issue's four required behaviours are all cited from the issue body | INV-001/002 |

## After — what was actually built (2026-10-22)

| id | claim | source | certainty |
|---|---|---|---|
| INV-008 | the fenced `open-questions@1` example the references publish parses with the real reader | `knowledge-honesty-contract.test.mjs` (passes) | confirmed |
| INV-009 | both references carry the four stage headings in order | `knowledge-honesty-contract.test.mjs` (passes) | confirmed |

## Discoveries (what the tree taught, after the fact)

| # | discovery | how it was found |
|---|---|---|
| D1 | A `decisions.md` is read only while its `open-questions@1` block is the first non-heading block: the reader skips everything after the *last* heading until it sees a block marker or an entry row, so prose paragraphs and tables written before the block leave the header unseen (`malformed-ledger-header` at line 1). | `node scripts/needs-input.mjs docs/fix/303-investigate-orient-ask` failed until the block moved above the prose. This is a reader-side ordering rule the skill prose does not state; it is recorded here for the owner, not fixed in this unit (out of scope: no dispatcher change). |
| D2 | The `OR-*`/`INV-*`/`ASK-*` row shapes the first attempt minted were published by no tool and read by nothing; the only ledger with a reader is `open-questions@1`. | `grep -rn "INV-0\|OR-0\|ASK-0"` → hits only in the two references. |

## Decisions

| date | decision | why | alternatives considered |
|---|---|---|---|
| 2026-10-22 | The four stage slugs are `investigate / orient / ask / decide`. | `decide` is outside both closed vocabularies (`spec`, `plan`), so a stage may name itself in a receipt without shadowing a receipt stage. | Naming the last stage `record` — rejected: `decide` states the act the issue forbids before the answer arrives; `record` reads as bookkeeping. |
| 2026-10-22 | Claims live in a new unit-folder pane `sources.md`, not inside `decisions.md`. | `decisions.md` has one owner (the template agent guide's open-question ledger) and the dispatcher stops at any block marker; a second claim ledger in the same file risks the dispatcher's span. One file, one grammar. | A claims table inside `decisions.md` — rejected for the span risk above; a claims table inside `SPEC.md` — rejected: the SPEC is the artifact under review, its citations are the review's evidence, not part of the artifact. |
| 2026-10-22 | The questions pane is a present part of both fixed output contracts with a literal `none — no questions: …` line. | The issue asks for "a questions-and-resolutions section (or explicit none)". The unit's first attempt wrote questions to a file no contract named; a pane in the contract cannot be lost that way. | Leaving it as prose encouragement — rejected: that is the prohibition-only shape the issue diagnoses. |
| 2026-10-22 | `PLAN.md`'s own `OR-PLAN-001` sweep table is deleted; the sweep's hits are asked like any unsourced claim. | Two differently-shaped tables published for the same act, neither reading by any tool; the sweep's hits are exactly tier-2 claims and belong in the one ledger. | Keeping the sweep table beside the ledger — rejected: two shapes for one act is the drift this unit removes. |
| 2026-10-22 | The stage headings are `## Stage <n> — <slug>` and the test asserts the slug as the last word. | A stage missing, renamed or nested is not executable; the heading carries the token a receipt names, so the test can check it without parsing prose. | Plain `## <slug>` — kept the level but lost the ordering guarantee the issue's "investigate → orient → ask" names. |

## Prior-decisions contradiction sweep (plan step, 2026-10-22)

Candidate sources swept: this unit's `decisions.md`, unit `docs/fix/258-harden-needs-input-contracts/`,
`docs/fix/286-affecting-path-receipt-binding/`, `AGENTS.md` (Working rules, Authoring a skill),
frozen NRS (`docs/workflow/REPOSITORY_STATE.md`), roadmap row 68.

| claim | prior decision | source path | relation |
|---|---|---|---|
| new stage slugs cannot reuse `spec`/`plan` | pre-execution receipts carry `stage: spec \| plan` | `packages/agentic-workflow-schema/src/pre-execution-contract.ts:45` | compatible |
| the question ledger keeps one grammar | the dispatcher reads its own span and skips sibling blocks | `docs/fix/258-harden-needs-input-contracts/decisions.md` | compatible |
| version bump is minor, not major | no majors until #176 merges | `AGENTS.md` (Version every change) | compatible |
| the change is prose plus one test, no new gate | this unit must not run its own review machinery | `#303` body §Out of scope + the owner's local workflow | compatible |

No `contradicts` row — the plan proceeded without a `NEEDS-DECISION`.

## Questions and resolutions

| Asked | Resolution |
|---|---|
| Q-none | none — no questions: every claim was settled by provenance or research (INV-001…INV-007), and the four behaviours the issue demands are quoted from its body, not inferred |

## Assumptions (correctable by the owner)

| date | assumption | why it is cheap to change |
|---|---|---|
| 2026-10-22 | `sources.md` is a new pane, not a section of `SPEC.md`. | One line in each reference and one test rewrite if the owner prefers it inside the SPEC. |

## Path-protection escape records

Append-only rows the Tier 1 checkpoint gate verifies (the `path-protection-records@1` grammar in the turn contract). Recorded 2026-10-22: the unit predates any declaration block, so no `freeze-after` boundary exists and the gate demands `approval` for a post-freeze-class path; the owner directed this local, unpublished workflow in the session that requested the change, and no `path-protection-plan@1` declaration exists in this unit folder to anchor a `justification` row instead.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/knowledge-honesty-contract.test.mjs | P1 | 2026-10-22 | execute-phase | P1 adds the only test for this unit: it pins the four ordered stages, the citation checklist item, the questions pane, and that the ledger rows the references publish parse with the real `scripts/needs-input.mjs` reader. It is a behavioral test written red-first (8 of 9 cases failing before any reference changed) and touches no existing expectation.
```
