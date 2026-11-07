---
type: feature
scope: medium
---

# fix/366-doc-cli

> One-line: the deterministic `doc` CLI half A — section-level `read`,
> section-splice `edit`, a derived structure `index` with stable section IDs,
> validated against TypeBox — delivered as the positional branch of the one
> `agentic-workflow doc` entry point 65 created.

## Issue

`#366` — tracked issue in the project's forge. The PR must close it via
`Closes #366` in the body. The issue also restores the anchor for feature row
71 (`doc-cli`): issue #192 was closed as completed on 2026-10-05 while half A
was undelivered, so this unit's PR closes #366 and records #192's closure.

Roadmap row: **71 `doc-cli`**. Scope is unchanged from row 71 / 65's D6 split.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim.

**S1 — Apply the issue.**
> Apply to this repository: issue #366

S2–S9 below quote issue #366's body verbatim; S1 names it as the request, so
the issue's own words are the requirement text.

**S2 — Home and branch of the CLI (issue "Scope", head).**
> The deterministic `doc` CLI in the runner crate (`packages/agentic-workflow`), the positional branch of the one `agentic-workflow doc` entry point:

**S3 — Section-level read (issue "Scope", first bullet).**
> - `doc read --file --section <id|title>` — section-level read.

**S4 — Section-splice edit (issue "Scope", second bullet).**
> - `doc edit` — section-splice, in-place, deterministic (remark AST).

**S5 — Derived structure index (issue "Scope", third bullet).**
> - `doc index` — regenerates a derived JSON structure index: stable section IDs from 65's shared D5 function, parsed frontmatter, skill triggers, phase mapping, dependencies — validated against TypeBox schemas.

**S6 — The verification bar (issue "Verification bar").**
> Verification bar: lossless roundtrip golden over `skills/**`, byte-identical two-run determinism diff, a deliberately invalid fixture rejected in CI, and the measured section-load savings demo (token/byte delta in Evidence).

**S7 — Constraints (issue "Constraints", first bullet).**
> - Experimental/alpha labelling until promotion is earned; Markdown stays the single source of truth; skills keep loading with no build step.

**S8 — Retrieval stays 65's (issue "Constraints", second bullet).**
> - Retrieval (`--sync`/`--query`/store/hooks) stays feature 65's — this unit is additive on 65, never a rewrite.

**S9 — The open owner decision (issue "Constraints", third bullet).**
> - **Open owner decision at triage**: build as its own unit, or absorb the CLI half into feature 65's maintenance cadence. The roadmap row stays `defined` until that call.

**S10 — Anchor restoration (issue "Summary", closing sentence).**
> This issue restores the anchor so the defined unit can be planned.

## Impact

- **The runner crate's `bin/agentic-workflow.mjs` router gains its half-A
  branch.** Today `src/doc/grammar.mjs` refuses the positional branch by name
  ("positional doc operations (read/edit/index) ship with unit 71") — that
  refusal sentence disappears and the branch ships. The `--json-only` retrieval
  flag grammar and every retrieval op are untouched (S8).
- **`chunks.mjs`' private `slugify` becomes the shared section-ID function
  (65's D5 says both halves consume one shared id function; until now only
  half B did).** Exporting it is a no-behavior change for the retrieval path;
  the index consumes the same export so the halves cannot drift.
- **The crate README's `doc` row changes**: the sentence "Positional doc ops
  (`read`/`edit`/`index`) ship with unit 71 and are refused by name until
  then" stops being true and is rewritten in the same change (S7 currency).
- **Unit doc `docs/features/71-doc-cli/SPEC.md`** stays the historical
  rough-cut plan doc created at 65's plan step; this unit doc is the working
  unit. Its carried ACs (AC1–AC3, AC5–AC6, verbatim from #192 via row 65's D6)
  are the acceptance source for S3–S6 here.
- **Nothing else opens the retrieval store; nothing generates `SKILL.md`s.**
  `skills/**` keeps loading natively with no build step (S7).

## Retirements

One surface is superseded, exactly and only:

- **The positional-branch refusal** — `parseDocArgs`' sentence "positional doc
  operations (read/edit/index) ship with unit 71; retrieval ops: …" is deleted
  in the change that ships the branch. Negative-capability pin:
  `rg -c 'ship with unit 71' packages/agentic-workflow/src packages/agentic-workflow/bin packages/agentic-workflow/README.md` → 0 after the branch lands
  (recorded as an `E` line in `## Log`). Nothing else is retired: this unit
  only adds surfaces.

## Non-goals

- Everything retrieval (S8): `--sync` / `--query` / `--status` / `--rebuild`,
  the SQLite/FTS5 store, embeddings, the hybrid path, the freshness manifest,
  git hooks, `init-workspace` consent, the discovery allowlist. The store
  config, envelope and degradation vocabulary are not re-touched except where
  the router dispatch reads them.
- No remark/unified adoption (65's D8 stands; see `## Log` D2). "remark AST"
  in S4 is delivered as the two-year-older phrasing of the same contract the
  locator already implements: locate through `mdast-util-from-markdown` node
  positions, splice by offset into the original bytes — no re-serialization.
- No JSON as a source of truth; no migrating or regenerating existing docs
  (additive tooling only); no docs web; no server stores; no memory protocol;
  the index is never a gate or decision authority.
- `doc edit` ships one semantic: whole-section splice (heading + body). The
  issue's `--set|--replace|--append` spellings never entered the frozen row-71
  scope; composing a set/append is the caller's read-then-edit. Recorded as a
  `## Future` row, not silent scope.
- Findings discovered during implementation never expand this unit.

## Risk tier

```text
$ bun scripts/ceremony.mjs tier classify
"tier": "standard"
"reason": "1 path(s) carry executable content: docs/fix/366-doc-cli/"
```

- **Tier** — `standard` · **Task Size** — understood · contained risk · resumable from diff
- **Named high-risk item** — none — not a high-tier unit

## Future

- **2026-11-06 · `doc edit` set/append spellings** (`--set` / `--append` flags
  composing body edits over the same splice primitive) — status `open`. From
  issue #192's in-scope wording; excluded by the frozen row-71 scope this unit
  implements. Offered at unit close.

## Future cost

| Rule | Binds |
|---|---|
| The section-ID function is shared with 65 (D5): one function, both halves — `chunks.mjs`' exports are the only owner; `doc index` imports them and never re-derives a slugger | anyone changing a section-ID rule |
| Roundtrip losslessness is a corpus obligation — every `skills/**` doc must round-trip and `ALLOWED_NORMALIZATIONS` stays empty inside the test as a contract, never silently widened | whoever edits the locator, the index scanner or the golden corpus |
| The structure index stays byte-deterministic: content-derived only, no timestamps, no mtimes, no HEAD linkage | whoever extends the index shape |
| Experimental labelling persists until promotion is earned by measured savings on a real flow | whoever would publish or advertise the CLI |
| Retrieval stays 65's: the positional branch never opens the store, never writes the `.db`, and shares only the entry point and the shared ID function | anyone extending either branch of `doc` |

## Applicable tests

- Crate suites `bun run test` and `bun run test:node` in `packages/agentic-workflow` — must stay green.
- New suites, red-first, house style so they ride the gate:
  `test/doc.docops.test.mjs` (grammar + `read` + `edit` CLI),
  `test/doc.structure.test.mjs` (index shape, determinism, TypeBox validation
  incl. the deliberately invalid fixture), `test/doc.roundtrip.test.mjs`
  (the lossless golden over `skills/**`).
- Differential check per §6 of the applying order: each touched command run
  against a copy of the base commit and against the change; any
  stdout/stderr/exit difference nobody asked for is repaired and pinned.
- Root suites at verification: `bun scripts/local-gate.mjs` where network-free
  steps allow, `node --test scripts/*.test.mjs` for the touched script pins.

## Known pre-existing issues

- **`docs/features/71-doc-cli/SPEC.md` AC1** says "MD → AST → MD is
  byte-identical", wording that predates 65's D8 (remark out). **Affects this
  unit only as a recorded design question** — resolved by `## Log` D2 (splice,
  no re-serialization), never silently. The AC's *bar* (byte-identical output
  for unchanged input, proven over the corpus) is delivered as written; the
  *mechanism* named in the wording is the part D8 rejected two weeks earlier.
- **`UnitDoc.setSection` remains fence-blind** (407's known issue, left open by
  design there). **Does not affect this unit** — `doc edit` rides the AST
  locator, never `UnitDoc.setSection`; the migration stays a possible later
  unit.
- **The derived docs tree was stale at the unit's cut head** (`docs-generate
  --check` on a base-commit copy: pre-existing drift independent of this
  unit's files). **Affects this unit only as a gate obligation** — the
  projection is regenerated before handoff if the unit's own artifacts touch
  it; otherwise the drift is reported, not hidden.
- **Issue #192 closed as completed without half A** — the forge-vs-reality
  mismatch this unit repairs (S10). **Affects this unit definitionally**: the
  PR closes #366 and records #192's closure instead of owing one.

## Tasks

- [ ] P1 — Freeze the positional `-` dispatch so first-token retrieval flags are untouched and `read` / `edit` / `index` parse, with two unit-level refusal pins: unknown op and retrieval-flags-after-op (validator: `bun test test/doc.docops.test.mjs` exits 0)
  (Implements: S2)
  Relevant files: packages/agentic-workflow/src/doc/grammar.mjs, packages/agentic-workflow/test/doc.docops.test.mjs
- [ ] P2 — `doc read` and `doc edit` over the #407 primitive: `--section <id|title>` resolves through the shared D5 id scheme with the locator's AST positions, splices are byte-lossless outside the replaced range, refusals (`NO_MATCH` / `AMBIGUOUS_MATCH` / `BAD_SELECTOR`) exit 2 before any write, and the pre-existing retrieval branch keeps its exact base behavior (validator: `bun test test/doc.docops.test.mjs` exits 0)
  (Implements: S2, S3, S4, S8)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/test/doc.docops.test.mjs
- [ ] P3 — `structure.mjs` builder + `structure-schema.mjs` TypeBox validation: corpus scan, parsed frontmatter, skill triggers, unit-doc phase mapping (previous/current/next) and dependencies, canonical byte-identical two-run output, and the deliberately invalid fixture rejected (validator: `bun test test/doc.structure.test.mjs` exits 0)
  (Implements: S5)
  Relevant files: packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/src/doc/structure-schema.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- [ ] P4 — `doc index` CLI wiring over the builder: `--out` (default off, stdout `--json`), receipt line, and the off-line artifact written without touching the retrieval store (validator: `bun test test/doc.structure.test.mjs` exits 0)
  (Implements: S5)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- [ ] P5 — Lossless roundtrip golden over `skills/**`: reassembly of located sections plus inter-gaps equals the original bytes; `ALLOWED_NORMALIZATIONS` pinned empty in the test (validator: `bun test test/doc.roundtrip.test.mjs` exits 0)
  (Implements: S6)
  Relevant files: packages/agentic-workflow/test/doc.roundtrip.test.mjs
- [ ] P6 — The measured section-load savings demo recorded in `## Log` as `E` lines (token/byte delta) (validator: the `E` line's byte deltas reproduce from the recorded command)
  (Implements: S6, AC3 of `docs/features/71-doc-cli/SPEC.md`)
  Relevant files: docs/fix/366-doc-cli/SPEC.md
- [ ] P7 — Documentation currency in the same change: crate README `doc` row rewritten with the shipped ops and the experimental label; usage line updated; the row-71 status note appended through the deterministic emitter, never hand-edited (validator: `rg -c 'ship with unit 71' packages/agentic-workflow/src packages/agentic-workflow/bin packages/agentic-workflow/README.md` matches 0 and `rg -c 'experimental' packages/agentic-workflow/README.md` matches ≥1)
  (Implements: S2, S7)
  Relevant files: packages/agentic-workflow/README.md, packages/agentic-workflow/bin/agentic-workflow.mjs, docs/ROADMAP.md
- [ ] P8 — Final verification: crate suites under both runtimes, touched root suites, the retirement pin, and the diff guard over the whole branch (validator: `cd packages/agentic-workflow && bun run test && node --test` exits 0 and `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S6, S7, S8)
  Relevant files: —

## Triaged steps

n/a — the owner's applying order substitutes its own planning-ledger freeze
(`docs/fix/366-doc-cli/` cut inline per the verbatim request, §5) for the
lane's triage step; this unit is never driven through `unit-lane` on its own
surgery.

## Findings

OPEN rows only; appended by reviewers.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-06, the request, verbatim:
  ```
  Apply to this repository: issue #366
  ```
- **L2** — 2026-11-06, the issue body, verbatim (`S2`–`S10` quote it; the
  summaries are the requirement text of record):
  ```
  Feature 71 (`doc-cli`, roadmap row `defined`) lost its forge anchor: issue #192 was closed as completed on 2026-10-05, two seconds after feature 65's PR #282 merged, but 65 delivered **half B** (the per-project retrieval index) and re-homed **half A** (the deterministic doc CLI) to feature 71 by its own D6 split. 65's SPEC said the follow-up owned #192's closure; the forge disagrees — feature 71's row records the discrepancy. This issue restores the anchor so the defined unit can be planned.

  ## Scope (unchanged from row 71 / 65's D6)

  The deterministic `doc` CLI in the runner crate (`packages/agentic-workflow`), the positional branch of the one `agentic-workflow doc` entry point:

  - `doc read --file --section <id|title>` — section-level read.
  - `doc edit` — section-splice, in-place, deterministic (remark AST).
  - `doc index` — regenerates a derived JSON structure index: stable section IDs from 65's shared D5 function, parsed frontmatter, skill triggers, phase mapping, dependencies — validated against TypeBox schemas.

  Verification bar: lossless roundtrip golden over `skills/**`, byte-identical two-run determinism diff, a deliberately invalid fixture rejected in CI, and the measured section-load savings demo (token/byte delta in Evidence).

  ## Constraints

  - Experimental/alpha labelling until promotion is earned; Markdown stays the single source of truth; skills keep loading with no build step.
  - Retrieval (`--sync`/`--query`/store/hooks) stays feature 65's — this unit is additive on 65, never a rewrite.
  - **Open owner decision at triage**: build as its own unit, or absorb the CLI half into feature 65's maintenance cadence. The roadmap row stays `defined` until that call.

  ## References

  - Roadmap row 71 · issue #192 (closed completed by 65 — see the closure note) · feature 65 (`doc-toolchain`, PR #282, D6 split).
  ```

## Next

RED: write the P1/P2 suite and observe it fail on the missing branch.

## References

- Issue `#366` (anchor restored) · issue `#192` (closed completed; recorded here) · roadmap row 71.
- `docs/features/71-doc-cli/SPEC.md` — the carried ACs (AC1–AC3, AC5–AC6) and the historical rough cut.
- `docs/features/65-doc-toolchain/SPEC.md` — D2 (entry-point shape), D5 (shared stable IDs), D8 (library policy).
- `docs/fix/407-section-locator-core/` — the splice primitive this unit consumes.
- `docs/workflow/PACKAGES.md` — pin rules for the crate.

## Branch

`feat/366-doc-cli`
