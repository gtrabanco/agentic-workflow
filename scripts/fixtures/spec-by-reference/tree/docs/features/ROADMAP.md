# Roadmap

Fixture tree for the spec-by-reference migration corpus: one legacy-shape unit
(never migrated, still routed) beside the migrated shapes, the migrated grammar
that must block, and the migrated doc missing a shared section.

| NN | Slug | Status | Depends on | Summary |
|----|------|--------|------------|---------|
| 20 | `legacy-shape` | in-progress | — | the current 14-section shape, untouched |
| 21 | `migrated-shape` | in-progress | — | re-cut shape: `## Specs` / `## Findings` / `## Log` |
| 22 | `migrated-done` | in-progress | — | re-cut shape with every phase in `## Log` |
| 23 | `migrated-broken` | in-progress | — | re-cut shape whose phases must fail the linter |
| 24 | `migrated-open` | in-progress | — | re-cut shape with an OPEN row in `## Findings` |
| 90 | `missing-shared` | planned | — | re-cut shape missing a shared section |
