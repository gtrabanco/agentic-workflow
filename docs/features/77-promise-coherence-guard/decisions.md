# 77 — decisions

The unit's conversation, in order. Append-only: a superseded entry gets a new
row naming it.

## Path-protection: plan declaration

The unit rebuilds a validator contract, so it necessarily modifies protected
classes (`**/*.test.*`, `**/fixtures/**`). No acceptance freeze is declared:
this run applies the change inline and hands the diff to the owner.

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | scripts/promise-coherence.mjs | the guard the unit builds (AC1): the root-suite pass that makes an executable promise reproduce at the head
created | scripts/promise-coherence.test.mjs | the guard's suite, written red-first against the frozen-failure corpus (AC2)
created | scripts/fixtures/promise-coherence | the frozen-failure corpus: one fixture per historical defect class named by #305, each carrying its source finding id
created | docs/features/77-promise-coherence-guard | this unit's folder
```

## D-77-1 — `## Impact` becomes a required section (14, not 13)

**Owner input, 2026-10-21:** asked with the measured census, answered "parece
evidente B" after the five survived prose surfaces were named. Implementation:
`UNIT_DOC_REQUIRED_SECTIONS` gains `"Impact"` between `Acceptance criteria` and
`Non-goals`; the second copy in `packages/agentic-workflow/src/edit/schema.mjs`
and the producer `packages/agentic-workflow/src/edit/UnitDoc.mjs` follow in the
same change, because a producer whose output the validator rejects is the same
defect class this unit exists to close.

Rejected: *tolerated extra* (the machine stays looser than five published
promises forever, and the new guard would ship with its first exemption) and
*frozen legacy carve-out* (#285/#286 are both receipts for exactly that pattern).

## D-77-2 — the guard owns no second copy of a rule

`scripts/promise-coherence.mjs` mechanizes five grammars the repo already
publishes, and adds no sixth: the validator cell
(`skills/pre-execution-review/references/LEDGERS.md`), the unit-doc bullet
(`skills/phase-contract/SKILL.md`), the acceptance line and Evidence row
(`skills/verification-contract/SKILL.md`), the Turn-contract box
(`skills/orchestration-envelope/references/TURN_CONTRACT.md`), and the budget
narration (`docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s own `policy.rules`).
Each owner gains the sentence that makes its cell executable (what a declared
outcome is and that a script re-runs it); the script only reads them. No new
skill is added: the union is not a new grammar, exactly as `phase-lint.mjs`
reads two grammars `phase-contract` owns without owning either.

## D-77-3 — allowed commands are readers, and skips are printed

A declared validator is executed only when its command is a reader
(`grep`, `rg`, `wc`, `ls`, `test`, `git grep`) and carries no shell composition.
Anything else is reported as a `skip:` line in the block — visible, counted, and
never a silent pass. Executing `node --test`/`bun …`/`gh` from a document would
make the guard a second, slower copy of the root gate with network and fs writes
in the blast radius; the root gate already runs those.

## Path-protection: escaped modifications

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/pre-execution-canonical.test.mjs | P1 | 2026-10-21 | execute-phase | adds the red-first selector cases for the 14-section contract (missing Impact, Impact out of order, extras tolerated); no existing assertion is weakened
justification | packages/agentic-workflow-schema/test/fixtures/pre-execution-documents.mjs | P1 | 2026-10-21 | execute-phase | toySpec() gains the Impact body so the fixture is a valid 14-section unit doc and a test can express "Impact missing" by dropping it
justification | packages/agentic-workflow/test/edit.test.mjs | P1 | 2026-10-21 | execute-phase | the producer test asserts the new contract: create() emits 14 sections in order including Impact. The old assertion (13) encoded the retired contract, never a weaker version of the new one
justification | scripts/unit-doc-contract.test.mjs | P1 | 2026-10-21 | execute-phase | parity pin across the three copies of the section list (schema constant, SDK duplicate, producer template) so the duplicate cannot drift again
justification | scripts/promise-coherence.test.mjs | P2,P3,P4,P5 | 2026-10-21 | execute-phase | the guard's suite: one red-first case per requested claim kind plus the frozen-failure corpus replayed as failing inputs
justification | scripts/fixtures/promise-coherence | P2,P3,P4,P5 | 2026-10-21 | execute-phase | the frozen-failure corpus files, each quoting its source finding id and the observed output that made it a defect
justification | scripts/pre-execution-sensor.test.mjs | P1 | 2026-10-21 | execute-phase | fixture migration: its hardcoded toy unit doc gains ## Impact so it stays a selectable unit document
justification | scripts/pre-execution-timeline.test.mjs | P1 | 2026-10-21 | execute-phase | same fixture migration as pre-execution-sensor.test.mjs
justification | scripts/pre-execution-wording-only-manifest.test.mjs | P1 | 2026-10-21 | execute-phase | same fixture migration as pre-execution-sensor.test.mjs
justification | scripts/lane-era-lineage.test.mjs | P1 | 2026-10-21 | execute-phase | same fixture migration as pre-execution-sensor.test.mjs
```
