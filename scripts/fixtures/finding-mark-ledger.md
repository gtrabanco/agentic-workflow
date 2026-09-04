# Seeded fixture — finding-mark@1 exclusion (fix #161, O7)

Seeds the property `scripts/ledger-provenance.mjs` must keep: the annotator's
row pattern matches `| F<n> |` ids only, so a `finding-mark@1` row (a `VF-` id)
is invisible to the recount, to `--check`, and to `--annotate`. The `F90x` ids
are deliberately outside the ranges real ledgers use, so no branch commit can
name them and the fixture stays self-contained.

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F901 | scripts/fixtures/finding-mark-ledger.md:9 | code | med | fix-now | fold into phase | no |
| F902 | scripts/fixtures/finding-mark-ledger.md:10 | tests | high | fix-now | fold into phase | no |
| VF-1 | scripts/fixtures/finding-mark-ledger.md:9 · reviewer review-change · HEAD 0f99dbfb3ad9e3efa0202bf3d4cf1a5f837a7a2a · recheck: failing reproducer (red-first pin run) | code | confirmed | finding-mark | n/a | n/a |
