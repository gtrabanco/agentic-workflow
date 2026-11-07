# fix/366-doc-cli · decisions

Owner decisions and path-protection records for this unit. The unit is applied
inline under the owner's applying order (§4: the ledger freeze is the plan), so
the `execute-phase` authority below names the inline implementation acting in
its place — never a second writer class.

## Decisions

```text
decisions@1
id | decision | authority | basis
D1 | the positional `doc` branch ships in this unit; the grammar's by-name refusal sentence ("ship with unit 71") is deleted by the same change | S1, S2 | PE-001; the refusal is the superseded surface this unit retires (§Retirements)
D2 | S4's "(remark AST)" wording is delivered as locate-through-mdast + byte-offset splice of the original string; no remark/unified dependency is adopted | S4, PE-008 (65's D8), PE-002 | the splice is lossless by construction and never re-serializes; AC1's bar (byte-identical output for unchanged input over the corpus) is delivered as written; the re-trigger stays the golden corpus itself
D3 | the positional branch does not reuse 65's retrieval envelope: `DOC_COMMANDS` stays closed to the retrieval four (S8), and the docop branch emits its own receipts (`--json` prints one operation JSON document) | S8, PE-006 | extending the closed vocabulary would reopen 65's frozen contract for no consumer
D4 | the structure index corpus is every git-tracked `*.md` (`corpusFiles`), the same corpus retrieval indexes; "phase mapping (previous/current/next)" is parsed from unit docs' `## Tasks` rows through the grammar's **owner** (`skills/phase-contract/SKILL.md` §"The two grammars", mechanized at `scripts/unit-doc-phases.mjs:23` — bullet, executed-phase `[x]` tick **optional**); "dependencies" from the `## Dependencies` (or `## Depends on`) section's bullet lines; `translations` is dropped — bilingualism was removed repo-wide permanently (2026-10-27 owner decision, issue #232) | S5, PE-007, PE-010, PE-011, PE-017 | the issue's own wording names docs+skills as the corpus. **Superseded 2026-11-07 (S11/B2):** the cut text read "the checkbox grammar is the repo's frozen artifact" — a sampling error: the tick is state, both `_TEMPLATE/SPEC.md` files write `- P1 — <task>` and 27 of 45 in-tree unit docs never used the checkbox form, so the index reported `phases: []`/`current: null` on documents with open phases. The grammar now follows its owner and a parity case pins the agreement
D5 | skill triggers are parsed from the frontmatter `description` scalar's `Triggers:` clause (the shipped convention); a future frontmatter `triggers:` key wins when present | S5, PE-010 | one deterministic rule, recorded here rather than guessed per file
D6 | `A1` (the `F99` 50 ms retreat in `@gtrabanco/agentic-workflow-schema`) is folded into this unit on the owner's explicit request (S12), overriding the external verifier's `report-only` triage | S12 | the owner owns the disposition, and the repair is a measured reduction of the refusing code's own work — the 50 ms assertion is never edited, so the bar stays where `F99` put it
D7 | a section id is derived from the **raw heading line**; the locator's rendered `title` stays what it is (a title, markup stripped) and is never the id source | S11, PE-016 | #407's own contract says "markup is never part of a title" (`section-locator.mjs:68`), while `chunks.mjs` slugs the raw heading — importing one slugger is not importing one id source. Deriving the id from the heading's own bytes makes both halves agree instead of forcing either to change
```

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/src/doc/grammar.mjs,packages/agentic-workflow/src/doc/structure.mjs,packages/agentic-workflow/src/doc/structure-schema.mjs,packages/agentic-workflow/src/doc/chunks.mjs | P1 | 2026-11-06 | execute-phase | the unit's deliverable is the positional doc branch: grammar dispatch plus the shared id/frontmatter exports and the new index modules; crate paths are the unit's own named surface
justification | packages/agentic-workflow/src/doc/structure.mjs,packages/agentic-workflow/src/doc/structure-schema.mjs | P3 | 2026-11-06 | execute-phase | doc index builder and TypeBox schemas ship here; no other unit owns these new files
justification | packages/agentic-workflow/bin/agentic-workflow.mjs,packages/agentic-workflow/test/**,packages/agentic-workflow/README.md | P2 | 2026-11-06 | execute-phase | router wiring, red-first suites and README currency for the same branch; the bin's usage line names the shipped ops
justification | packages/agentic-workflow-schema/src/verification-contract.ts | P12 | 2026-11-07 | owner override (S12) | the `F99` refusal capture: measured hot-spot removal only (canonical key units without `JSON.stringify`, assignment instead of `defineProperty` except `__proto__`); no contract bytes, vocabulary or assertion change
```
