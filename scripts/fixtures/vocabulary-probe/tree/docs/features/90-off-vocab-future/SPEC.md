# 90 — off-vocab-future

> Fixture: reintroduces the F40 defect class verbatim — a Future row whose
> status token is outside the published vocabulary — and carries the three
> findings rows `#361` must refuse: the retired `medium` severity, a `BLOCKER`
> whose impact says it blocks nothing, and an empty impact cell. This file is
> read by `scripts/vocabulary-probe.test.mjs` and must keep failing the probe.

## Future

- `kept deferred 2026-10-26` — "No change to the review machinery here — the
  owner's D5 deferral." (the F40 token, byte-for-byte from
  `docs/features/79-spec-by-reference/SPEC.md:161`)

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S1 · docs/features/90-off-vocab-future/SPEC.md:18 | code | medium | docs-only | source | fold |
| F2 | S2 · docs/features/90-off-vocab-future/SPEC.md:19 | code | BLOCKER | report-only | source | fold |
| F3 | S3 · docs/features/90-off-vocab-future/SPEC.md:20 | code | WARNING |  | source | fold |

## Progress log

- 2026-10-27 09:00 — fixture seeded — next: probe must refuse the tokens above
