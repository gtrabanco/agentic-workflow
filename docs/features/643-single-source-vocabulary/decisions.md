# 643 — single-source-vocabulary · decisions

Dated owner/executor decisions with the evidence that forced them. Written by the
lane (this turn substitutes for it) and closed by the executor's phase decisions.

## D1 — The named pre-build cold path is empty

**Decision.** No literal copy of a schema-published vocabulary is allowed
anywhere in the runner crate, including `src/doc/**`, `src/edit/**`,
`src/index-document.mjs`, `src/verify/Verify.mjs` and `src/writer/shared-merge.mjs`.
The invariant's "named pre-build entrypoint" list has no members, so no mirror
carries a header guarantee and `scripts/vocabulary-parity.test.mjs` pins no copy.

**Why.** Issue #643 S4 proposed the list and left the owner to confirm it. The
list's premise is that some entry runs before `npm run build` exists. It cannot:
the crate has exactly one entry, `packages/agentic-workflow/bin/agentic-workflow.mjs`,
and it statically imports `src/config/api.mjs` (line 187), which imports
`@gtrabanco/agentic-workflow-schema` at module scope (`src/config/api.mjs:16`).
Every command — including the git-hook and merge-driver entries, which reach the
crate through `bin/shared-merge.mjs` and `src/guard/git-identity.mjs` (that module
imports the schema at line 42) — therefore resolves the built schema today. The
dist precondition is real, and it is already handled by
`scripts/schema-runtime.mjs` and `scripts/run-root-suite.mjs` (PE-001, PE-006).

**Consequence.** The pre-build header-guarantee mechanism ships as a rule with no
current members. The residency case enforces the rule the moment a member exists,
and the invariant states the exception so a future unit can use it with evidence.

## D2 — `src/doc/envelope.mjs` owes no change

**Decision.** The degradation close stays a pattern list; no mirror is deleted
there and the behaviour pin (`packages/agentic-workflow/test/doc.degradations.test.mjs`)
stays.

**Why.** Issue #643's Class 1 row 11 assumed an enumerated copy of
`DOC_DEGRADATIONS` beside the pattern close. There is none: the module carries
six patterns, two of which exist to accept the open `unavailable-embeddings-*`
family the schema deliberately does not enumerate (PE-004). Importing the const
would not remove a byte — it would replace a matcher that accepts more than the
const with one that accepts less, which is a behaviour change nobody asked for.

## D3 — Every moved name keeps its historical export path

**Decision.** The crate's modules `export { NAME } from "@gtrabanco/agentic-workflow-schema"`
rather than re-declaring a local binding, and a name the crate spelled differently
keeps the crate's spelling as an alias (`LOG_KINDS`, `UNIT_DOC_SECTIONS`,
`PROGRESS_ENTRY_REGEX`, `CHANGELOG_SECTION_REGEX`).

**Why.** 53 files import these names (PE-008). The value's origin is the defect
this unit repairs; the consumer's path is not, and changing it would multiply the
diff without changing one behaviour. The alias also keeps the crate's public
vocabulary (`LOG_KINDS`) readable in the crate's own domain language.

## D4 — The requirement set is the issue's own text, quoted

**Decision.** `S1` is the turn's instruction; `S2…S11` quote issue #643 verbatim.
Every obligation cites the `S#` whose words require it.

**Why.** The request is one line that adopts the issue. Quoting the issue's own
normative sentences keeps the authority chain auditable — an obligation that
cannot cite a quoted sentence is an invented requirement.
