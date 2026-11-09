# Decisions — 437 review-findings-corpus

## D1 — review staleness: mechanism + policy, in two layers

The issue relocates this decision from #363 and asks for it at this unit's triage.
Owner answer 2026-11-09: **`composed`**.

- **Mechanism** — freshness is decided by the affecting-path scope digest, the
  one `scripts/scope-manifest.mjs` already publishes (fix/286:
  `isNonAffecting`, `affectedPathsAt`, `scopeDigestOf`). This unit imports it and
  never modifies it.
- **Policy** — what counts as a trivial delta is a declared list owned by
  `scripts/differential-baseline.mjs` (`TRIVIAL_PATH_CLASSES`), one entry per
  class, each with a test and a stated reason. Today: `documentation`
  (`docs/**`), `changeset` (`.changeset/**`), `lockfile` (`bun.lock`,
  `package-lock.json`, `*.lock`), plus the generator set `scope-manifest.mjs`
  already declares non-affecting.
- A `chore(...)` / `docs(...)` commit prefix is **not** trusted: a mislabeled
  commit must not be able to skip a baseline. Rejected option C.
- `formatting-only` hunks are **not** a class: this repository declares no
  formatter (AGENTS.md §Normalizer inventory, `formatter | none declared`), so a
  formatting-only delta cannot be detected deterministically. Recorded, not
  silently dropped.

## D2 — the unit lives in `docs/features/`

Roadmap row 437 is a feature row and the issue carries the `feature` label, so
the unit doc, the planning ledgers and the roadmap registration follow the
feature path. The generic `docs/fix/<issue>-<topic>/` phrasing in the
substituted plan step is not a type declaration.

## D3 — admission: repair-resolution ∧ recurrence

CIVER's two halves become two deterministic gates over bytes that already exist:

1. **targeted-repair-resolution** — the row is folded and carries the
   `· fold <sha>` annotation `scripts/ledger-provenance.mjs` writes; the commit
   resolves, and its own diff touches the path the finding names. A row whose
   fold commit repaired a different path is a misattribution, not evidence.
2. **stability-under-unrelated-changes** — the same `class × axis` pair occurs
   in at least `--min-recurrence` (default 2) **distinct units**. A one-off is an
   anecdote, exactly what "unverified repeats stay annotated data" refuses.

Both gates or nothing: the corpus keeps every row, and only rows passing both
are counted as learning input. The pass rate is reported, never tuned.

## D4 — `nimio` records in `known-issues.md`, not a new token

The disposition needs a dated note with a re-trigger condition, and the repo
already owns that ledger (`docs/<unit>/known-issues.md`, owner
`unit-lane:known-entries`). Adding an `N` token to `log-kind@1` would be a
schema-const + grammar + parity change for a note that is not a receipt, so the
existing ledger is used and no vocabulary moves. `nimio` never becomes a
`fix-now` row and is never counted by the budget.

## D5 — the corpus is read-only; readings are recorded as evidence lines

`findings-corpus.mjs` writes nothing: no `docs/generated/` projection, no state
file. Its block is printed and the unit records the reading as an `## Log` `E`
line (S10 asks for exactly that for the ARW metric). A projection would need a
`docs-generate` seam registration for a document that changes on every fold.

## D6 — budget formula, measured before pinning

`budget = clamp(1, 3, ceil(currentFixNow / batchSize))` where `batchSize` is the
**measured** median number of folded findings per fold commit over the corpus
(denominator: distinct `· fold <sha>` values). Measured at the cut, not chosen;
`correction-budget.mjs --measure` prints the constants and the sample size.

## D7 — ARW code-net: folded findings ÷ distinct code surfaces named

`eliminations` is the count of folded findings in a unit; `touched surfaces` is
the count of distinct code paths (`!docs/`, not a lockfile, not `.md` under
`docs/`) that the unit's own findings name. Both sides come from the same
corpus, so the ratio is reproducible from committed bytes with no git
archaeology. The owner's stated baseline (0.28 historical, 0.18 over 30 days) is
recomputed by the reader and reported beside it; bands stay `insufficient-corpus`
until ≥3 units are measurable.

## D8 — attribution never guesses a phase

An `axis → phase` map is declared for the axes the corpus actually carries
(triage / design / plan / gate). An axis the map does not know is reported as
`unmapped` with its count — never bucketed into the nearest phase, and never
turned into a proposal.

## D9 — exit contract, shared with the scripts it sits beside

Every new script follows the repo's convention: `0` pass, `1` a real verdict or
block, `2` usage error; diagnostics to stderr, the fixed block to stdout.
