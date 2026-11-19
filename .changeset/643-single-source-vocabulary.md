---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": patch
"orchestration-envelope": patch
---

feat(schema): single-source the workflow's closed vocabularies (#643)

Every closed vocabulary a published contract names now has one machine owner,
`@gtrabanco/agentic-workflow-schema`, and its consumers import it instead of
carrying a literal copy.

- **Thirteen sets published.** The feedback tiers, the writer-driver and
  shared-merge vocabularies, the path-guard reasons, the doctor's three sets, the
  skill discovery/consent/extra sets, the node-sanctioned scripts and the
  gate-rejection types move into `src/vocabularies.ts` and are exported from the
  package index.
- **The runner imports.** Forty-one literals in ten crate modules are deleted in
  favour of imports; every name stays exported from its historical module path,
  so no consumer moves (the crate's spelling survives as an alias where it
  differed).
- **`gate-rejection-type` stops being prose-only.** The six types are a published
  const, `POLICY.md`'s `gate-rejection-vocabulary@1` block becomes a rendered
  restatement, and `rendered-facts@1` gains the claim kind that recomputes a
  restated token set in both directions.
- **The residency rule has a home.** `vocabulary-residency@1` is declared in
  `docs/architecture/ARCHITECTURAL_INVARIANTS.md`, bound as a normative surface,
  and enforced by `scripts/vocabulary-parity.test.mjs` — the only suite that may
  pin a copy, and it pins the import instead.

The rule is enforced, not documented: the parity suite refuses a literal copy of
a published name (exported or private), refuses a normative row whose
`schema-export:` const does not live in the schema package, and prints a receipt
classifying every remaining runner const.
