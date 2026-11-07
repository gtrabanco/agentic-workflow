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
D4 | the structure index corpus is every git-tracked `*.md` (`corpusFiles`), the same corpus retrieval indexes; "phase mapping (previous/current/next)" is parsed from unit docs' `## Tasks` `- [x] P<n>` rows; "dependencies" from the `## Dependencies` (or `## Depends on`) section's bullet lines; `translations` is dropped — bilingualism was removed repo-wide permanently (2026-10-27 owner decision, issue #232) | S5, PE-007, PE-010, PE-011 | the issue's own wording names docs+skills as the corpus; the closed type set and checkbox grammar are the repo's frozen artifacts
D5 | skill triggers are parsed from the frontmatter `description` scalar's `Triggers:` clause (the shipped convention); a future frontmatter `triggers:` key wins when present | S5, PE-010 | one deterministic rule, recorded here rather than guessed per file
```

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/src/doc/grammar.mjs,packages/agentic-workflow/src/doc/structure.mjs,packages/agentic-workflow/src/doc/structure-schema.mjs,packages/agentic-workflow/src/doc/chunks.mjs | P1 | 2026-11-06 | execute-phase | the unit's deliverable is the positional doc branch: grammar dispatch plus the shared id/frontmatter exports and the new index modules; crate paths are the unit's own named surface
justification | packages/agentic-workflow/src/doc/structure.mjs,packages/agentic-workflow/src/doc/structure-schema.mjs | P3 | 2026-11-06 | execute-phase | doc index builder and TypeBox schemas ship here; no other unit owns these new files
justification | packages/agentic-workflow/bin/agentic-workflow.mjs,packages/agentic-workflow/test/**,packages/agentic-workflow/README.md | P2 | 2026-11-06 | execute-phase | router wiring, red-first suites and README currency for the same branch; the bin's usage line names the shipped ops
```
