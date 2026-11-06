# Decisions — 406-projection-manifest-vocabulary

```text
path-protection-plan@1
freeze-after: none
kind | path | justification
created | packages/agentic-workflow-schema/src/projection.ts | the contract module this unit publishes
created | packages/agentic-workflow-schema/test/projection.test.mjs | the contract suite this unit publishes
created | packages/agentic-workflow-schema/projection-manifest.schema.json | the published Draft-07 projection
created | packages/agentic-workflow-schema/guard-verdict.schema.json | the published Draft-07 projection
created | packages/agentic-workflow-schema/test/fixtures/projection/** | the contract's valid/malformed fixture corpus
created | docs/features/406-projection-manifest-vocabulary/SPEC.md | the unit document
created | docs/features/406-projection-manifest-vocabulary/planning-evidence.md | the frozen evidence ledger
created | docs/features/406-projection-manifest-vocabulary/planning-obligations.md | the frozen obligations ledger
created | docs/features/406-projection-manifest-vocabulary/decisions.md | this record
```

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow-schema/test/projection.test.mjs | P2 | 2026-11-07 | execute-phase | The suite created by this unit gains the README parity case (S10's doc-currency pin) in the phase that publishes the schemas; no existing assertion is relaxed, and every earlier case stays byte-identical.
justification | scripts/vocabulary-parity.test.mjs | P3 | 2026-11-07 | execute-phase | S10 requires the six new sets to be imported by the version-parity suite; the case list gains the six names and every existing assertion stays byte-identical — the suite is extended to cover the new surface, never relaxed to accept it.
justification | scripts/normative-drift.test.mjs | P3 | 2026-11-07 | execute-phase | S6 registers six new must-name vocabularies, so the gate's declared closed set (its header prose and its pinned array) gains exactly those six names; every check, fixture and refusal path is byte-identical, and the assertion still requires every value of every must-name set to be ordered.
```

## Decisions

- **D1** — 2026-11-07, S7's resolution (owner answer): the schema package keeps
  the repository's own pattern — hand-written TS types + validators + published
  Draft-07 projections + `ajv` fixture parity — instead of adding TypeBox as a
  runtime or dev dependency. The package declares no `dependencies` before and
  after this unit.
- **D2** — 2026-11-07, S4's selector grammar: a manifest selector is the JSON
  object form of #407's shipped `SectionSelector` (`heading`, `path`,
  `headingRegex`, `line` with an optional `within`). The locator is the resolver,
  so a second grammar would be a translation layer with nothing to gain. The
  locator's string/array shorthands are not part of the manifest grammar: a
  manifest is data, and the object form is unambiguous.
- **D3** — 2026-11-07, S4/#410's except-child: a `remove` rule carries an
  `except` keep-list of child heading paths. #410 names that form in its scope, and
  omitting it here would make #410 renegotiate the grammar — the outcome S1
  exists to prevent.
- **D4** — 2026-11-07, S4's hash: `contentHash` is `sha256:<64 lowercase hex>`
  over the exact UTF-8 bytes the rule removes (the locator's `byteStart`/
  `byteEnd`, never its UTF-16 offsets). Matching the digest to the bytes is the
  stripper's runtime check (#410), so this unit publishes the shape only.
- **D5** — 2026-11-07, S3/S13's seam set: every member is an existing lifecycle
  point (pi session boundary, lane unit boundary, executor phase boundary, git
  commit/push seams). The set is closed; #413's dispatcher consumes it and a new
  seam is a schema-const change with a `normative-surfaces@1` row, never a prose
  edit.
- **D6** — 2026-11-07, S6's registrations: each new vocabulary is bound by a
  `schema-export:` row (the drift gate treats the published const as the
  declaration home), and the two structural grammars are `block:` rows over the
  package README. The gate's `REFERENCEABLE_VOCABULARIES` registry is untouched:
  no block cell names a new vocabulary as `vocab:token`, so nothing is silently
  unbound. The must-name set and the prose-gate inventory are extended because
  the new sets are agent-facing grammar, not internal constants.
- **D7** — 2026-11-07, duplicate rule ids and uncompilable regexes are
  validator-only checks: Draft-07 cannot compile a pattern, and `uniqueItems`
  compares whole rules rather than one field. The suite asserts that split
  explicitly (schema accepts, validator refuses) so the two authorities are never
  mistaken for each other.
