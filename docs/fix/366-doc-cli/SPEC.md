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

**S11 — Fix the recommended findings (owner correction request, 2026-11-07).**
> arregla los findings recomendados

The referent is the `fix-now` set of this unit's external verification receipt
([`external-verify.md`](external-verify.md), 2026-11-07): **B1** (the index/read
section id drifts from the chunker's), **B2** (the phase grammar contradicts its
owner, so an open phase reads as `current: null`), **B3** (`--out` silently
ignored with exit 0), plus their companions **A2** (double `doc:` prefix, same
function as B3) and **A5** (the `D4`/`PE-011` premise that produced B2).
`A4` (`ignore` in that triage) is not in the set.

**S12 — Fix `A1` too (owner override, 2026-11-07).**
> también A1

`A1` was triaged `report-only` — a 50 ms `F99` bound failing in
`packages/agentic-workflow-schema`, untouched by this unit. The owner overrides
that disposition and folds it in. The repair is in the **refusing code**, never
in the assertion: the test's bar stays 50 ms, it is the capture's own work that
shrinks.

**S13 — Record `A3` as future work (owner request, 2026-11-07).**
> anota A3 en ##Future

`A3` (`doc read --file - --section <full D5 id>` cannot match, because the
relative path is derived from the cwd rather than from the piped document) is
recorded as a dated `## Future` row with its re-trigger, not repaired here.

**S14 — Fix the open findings (owner request, 2026-11-07).**
> arregla los findings

**Assumption A-1 (stated, not inferred silently):** "los findings" is the set the
previous handoff left open and unrepaired — **A6** (the retrieval scanner reads
fenced examples as headings) and the unit document's **three `phase-lint`
reds** (`P2`/`P4` box 4, `P6` box 8, plus the dangling `AC3` link). `A3` stays
parked in `## Future` and `A4` stays `ignore` **because the owner decided both
in the previous turn** (`anota A3 en ##Future`; `A4` was `ignore` in the triage
that turn confirmed). The six rows the previous batch already repaired
(B1, B2, B3, A2, A5, A1) are closed in `## Findings`, not repaired twice.

**S15 — Fix A7 (owner request, 2026-11-07).**
> Arregla A7

`A7` is the remaining scanner disagreement: the chunker and the markdown tree
classify the same document differently. The repair is **one heading scanner for
both halves** — the chunker derives its headings from the same markdown tree the
#407 locator builds (mdast), so a quoted example, an inline code span that wraps
a line, an indented fence inside a list item and a commented `# key:` inside a
leading frontmatter block are each classified once, for retrieval and for
`read`/`edit`/`index` alike. A second hand-rolled fence machine is the drift.

**S16 — Fix `L10` (owner request, 2026-11-07).**
> L10

`L10` recorded that the id-parity case was widened *after* implementation
(three documents pinned by name) instead of asserting the invariant. Once `A7`
lands, the case asserts the full invariant again — zero artifact documents,
zero section the chunker misses, zero id drift — and it is written **red first**.

**S17 — Fix `L9` (owner request, 2026-11-07).**
> L9

`L9` recorded that six repaired findings simply left the `## Findings` table
without the record the ledger's own vocabulary requires: `log-kind@1` has a
`F<n>` kind — "a folded finding — the fold commit and what was verified". Every
finding this unit folded (B1, B2, B3, A2, A5, A1, A6, A7) gets its `F` line
naming the fold commit, so a fold is never a row that silently vanished.

**S18 — Push (owner request, 2026-11-07).**
> luego haz el push

Publish the branch: `origin/feat/366-doc-cli` must carry this unit's head, so PR
#453 shows the delivered commits instead of the stale `ef63162d` anchor.

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
- **2026-11-07 · `doc read --file - --section <full D5 id>` (A3)** — status
  `open`. A full `path#slug` id carries a path, so a piped document has none to
  match: `relativeDocPath("-")` resolves the id against the cwd and the
  selector answers `NO_MATCH` instead of naming the real cause. Not repaired
  here because title and bare-slug selectors already work on stdin (S13).
  Re-trigger: the first consumer that pipes a document and a full id together,
  or the first report of a confusing `NO_MATCH` on stdin — then either refuse a
  path-qualified id by name or resolve it against the supplied `--file`.

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

- [x] P1 — Freeze the positional `-` dispatch so first-token retrieval flags are untouched and `read` / `edit` / `index` parse, with two unit-level refusal pins: unknown op and retrieval-flags-after-op (validator: `bun test test/doc.docops.test.mjs` exits 0)
  (Implements: S1, S2)
  Relevant files: packages/agentic-workflow/src/doc/grammar.mjs, packages/agentic-workflow/test/doc.docops.test.mjs
- [x] P2 — `doc read` and `doc edit` over the #407 primitive: `--section <id|title>` resolves through the shared D5 id scheme with the locator's AST positions, splices are byte-lossless outside the replaced range, refusals (`NO_MATCH` / `AMBIGUOUS_MATCH` / `BAD_SELECTOR`) exit 2 before the file is touched, and the pre-existing retrieval branch keeps its exact base behavior (validator: `bun test test/doc.docops.test.mjs` exits 0)
  (Implements: S2, S3, S4, S8)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/test/doc.docops.test.mjs
- [x] P3 — `structure.mjs` builder + `structure-schema.mjs` TypeBox validation: corpus scan, parsed frontmatter, skill triggers, unit-doc phase mapping (previous/current/next) and dependencies, canonical byte-identical two-run output, and the deliberately invalid fixture rejected (validator: `bun test test/doc.structure.test.mjs` exits 0)
  (Implements: S5)
  Relevant files: packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/src/doc/structure-schema.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- [x] P4 — `doc index` CLI wiring over the builder: `--out` (default off, stdout `--json`), receipt line, and the off-line artifact emitted without touching the retrieval store (validator: `bun test test/doc.structure.test.mjs` exits 0)
  (Implements: S5)
  Relevant files: packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- [x] P5 — Lossless roundtrip golden over `skills/**`: reassembly of located sections plus inter-gaps equals the original bytes; `ALLOWED_NORMALIZATIONS` pinned empty in the test (validator: `bun test test/doc.roundtrip.test.mjs` exits 0)
  (Implements: S6)
  Relevant files: packages/agentic-workflow/test/doc.roundtrip.test.mjs
- [x] P6 — The measured section-load savings demo (AC3 of `docs/features/71-doc-cli/SPEC.md`) recorded in `## Log` as `E` lines (token/byte delta) (validator: `wc -c skills/review-change/SKILL.md` matches 12740 and the two `doc read --section` runs match 2055 + 678)
  (Implements: S6)
  Relevant files: docs/fix/366-doc-cli/SPEC.md
- [x] P7 — Documentation currency in the same change: crate README `doc` row rewritten with the shipped ops and the experimental label; usage line updated; the row-71 status note appended through the deterministic emitter, never hand-edited (validator: `rg -c 'ship with unit 71' packages/agentic-workflow/src packages/agentic-workflow/bin packages/agentic-workflow/README.md` matches 0 and `rg -c 'experimental' packages/agentic-workflow/README.md` matches ≥1)
  (Implements: S2, S7, S9, S10)
  Relevant files: packages/agentic-workflow/README.md, packages/agentic-workflow/bin/agentic-workflow.mjs, docs/ROADMAP.md
- [x] P8 — Final verification: crate suites under both runtimes, touched root suites, the retirement pin, and the diff guard over the whole branch (validator: `cd packages/agentic-workflow && bun run test && node --test` exits 0 and `bun scripts/local-gate.mjs --skip-network` exits 0)
  (Implements: S6, S7, S8)
  Relevant files: —
- [ ] P9 — `--out` grammar: refuse it on `read`/`edit`, honour it with `--json` on `index` (artifact and document both emitted), and print one `doc:` prefix per refusal (validator: `bun test test/doc.docops.test.mjs` exits 0 including the four `--out` cases and the exact-stderr case; red before the fix)
  (Implements: S11)
  Relevant files: packages/agentic-workflow/src/doc/grammar.mjs, packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/bin/agentic-workflow.mjs, packages/agentic-workflow/test/doc.docops.test.mjs
- [ ] P10 — Derive each section id from the **raw heading line**, so `doc read`/`doc index` carry the chunker's id for every heading (markup-bearing headings included), without touching #407's frozen descriptor shape (validator: `bun test test/doc.structure.test.mjs` exits 0 with the corpus parity case reporting 0 mismatches; red before the fix)
  (Implements: S11)
  Relevant files: packages/agentic-workflow/src/doc/docops.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- [ ] P11 — Phase mapping reads the owner's unit-doc grammar: the executed-phase tick is optional, exactly as `scripts/unit-doc-phases.mjs:23` and `skills/phase-contract/SKILL.md` define it, with a fixture parity case against the owner rule; correct the `D4`/`PE-011` premise in the same change (validator: `bun test test/doc.structure.test.mjs` exits 0 with the owner-grammar parity case green; red before the fix)
  (Implements: S11)
  Relevant files: packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/test/doc.structure.test.mjs, docs/fix/366-doc-cli/decisions.md, docs/fix/366-doc-cli/planning-evidence.md
- [ ] P12 — `F99` refusal capture: charge a key's canonical units without `JSON.stringify`, and capture keys by assignment except `__proto__` (which keeps `defineProperty`) — same bytes, less work per property (validator: `cd packages/agentic-workflow-schema && bun run test` exits 0 and `node --test test/verification-preflight.test.mjs` prints ≤ 17 ms for both 200 000-item refusals; the 50 ms assertion is never edited)
  (Implements: S12)
  Relevant files: packages/agentic-workflow-schema/src/verification-contract.ts
- [ ] P13 — `A3` recorded in `## Future` with its re-trigger (validator: `rg -n 'file - --section' docs/fix/366-doc-cli/SPEC.md` matches ≥ 1)
  (Implements: S13)
  Relevant files: docs/fix/366-doc-cli/SPEC.md
- [ ] P14 — The chunker's fence state keeps the fence's **own character and length** (never collapses to three), so a fenced example is never a heading at any nesting depth, and the store's `meta` carries a chunker version that forces a re-scan of a store built by an older scanner (validator: `bun test test/doc.chunks.test.mjs test/doc.sync.test.mjs` exits 0 with the nesting and chunker-version cases, and `bun test test/doc.structure.test.mjs` exits 0 with the id-parity case reporting zero artifact documents)
  (Implements: S14)
  Relevant files: packages/agentic-workflow/src/doc/chunks.mjs, packages/agentic-workflow/src/doc/sync.mjs, packages/agentic-workflow/test/doc.chunks.test.mjs, packages/agentic-workflow/test/doc.sync.test.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- [ ] P15 — Clear this document's three `phase-lint` reds (two box-4 creation-verb wordings, `P6`'s box-8 expected outcome, the dangling `AC3` link) so the unit doc lints PASS (validator: `bun scripts/phase-lint.mjs docs/fix/366-doc-cli/SPEC.md` prints `verdict PASS`)
  (Implements: S14)
  Relevant files: docs/fix/366-doc-cli/SPEC.md
- [ ] P16 — One heading scanner: `scanChunks` derives its headings from the #407 locator's markdown tree instead of a second fence state machine, both halves share one frontmatter bound and one raw-title rule, and the store's chunker version moves to 3 so an old cache re-scans (validator: `bun test test/doc.chunks.test.mjs test/doc.sync.test.mjs` exits 0 and the parity case reports `0/0/0`)
  (Implements: S15)
  Relevant files: packages/agentic-workflow/src/doc/chunks.mjs, packages/agentic-workflow/src/doc/docops.mjs, packages/agentic-workflow/src/doc/structure.mjs, packages/agentic-workflow/src/doc/sync.mjs
- [ ] P17 — The id-parity case asserts the whole invariant — zero artifact documents, zero sections the chunker misses, zero id drift — written red first, with the named exception list deleted (validator: `bun test test/doc.structure.test.mjs` exits 0; the case fails against the cut head)
  (Implements: S16)
  Relevant files: packages/agentic-workflow/test/doc.structure.test.mjs
- [ ] P18 — `F1`–`F8` fold lines: one per folded finding (B1, B2, B3, A2, A5, A1, A6, A7), each naming its fold commit and what was verified (validator: `rg -c '^- \*\*F[0-9]+\*\*' docs/fix/366-doc-cli/SPEC.md` matches 8 and each commit resolves from `HEAD`)
  (Implements: S17)
  Relevant files: docs/fix/366-doc-cli/SPEC.md
- [ ] P19 — Publish the branch (validator: `git rev-parse origin/feat/366-doc-cli` equals `git rev-parse HEAD`)
  (Implements: S18)
  Relevant files: —

## Triaged steps

n/a — the owner's applying order substitutes its own planning-ledger freeze
(`docs/fix/366-doc-cli/` cut inline per the verbatim request, §5) for the
lane's triage step; this unit is never driven through `unit-lane` on its own
surgery.

## Acceptance criteria

One observable, testable criterion per `S#`, each naming the check that proves
it.

| # | Criterion | Proved by |
|---|---|---|
| AC-1 | The issue's scope ships as the positional branch of the one `doc` entry point, and a first token starting with `-` still selects retrieval (S1, S2) | `bun test packages/agentic-workflow/test/doc.docops.test.mjs` exits 0 including both grammar cases |
| AC-2 | `doc read --file <path> [--section <id\|title>]` prints the located section's original bytes, and the whole file when `--section` is absent (S3) | the same suite's `doc read CLI (S3)` block exits 0 |
| AC-3 | `doc edit` splices the replacement over the located section in place, every byte outside the range is the source's own, and a refusal happens before any write (S4) | the same suite's `doc edit CLI (S4)` block exits 0 |
| AC-4 | `doc index` emits the derived structure document — D5 section ids, parsed frontmatter, skill triggers, phase mapping, dependencies — TypeBox-valid and byte-identical over two runs (S5) | `bun test packages/agentic-workflow/test/doc.structure.test.mjs` exits 0 |
| AC-5 | The verification bar holds: lossless roundtrip over `skills/**`, two-run determinism, the deliberately invalid fixture rejected, the measured savings recorded (S6) | `bun test packages/agentic-workflow/test/doc.roundtrip.test.mjs` exits 0 and the `E7` byte counts reproduce |
| AC-6 | The surface is documented experimental and Markdown stays the single source of truth (S7) | `rg -ci 'experimental' packages/agentic-workflow/README.md` matches ≥ 1 |
| AC-7 | Retrieval keeps its base behaviour — flag spellings, envelope and degradation vocabulary unchanged (S8) | `bun test packages/agentic-workflow/test/doc.envelope.test.mjs` exits 0 and the base-vs-head differential shows no retrieval difference |
| AC-8 | The open owner decision is resolved and recorded on the roadmap row (S9) | `rg -c '366-doc-cli' docs/ROADMAP.md` matches 1 and `bun test packages/agentic-workflow/test/roadmap-check.test.mjs` exits 0 |
| AC-9 | The anchor is restored: row 71 carries issue #366 (S10) | the same roadmap match, plus the row's `in-progress · [#366]` cell |
| AC-10 | `--out` is refused where it does not belong (`read`, `edit`) and honoured with `--json` on `doc index` (S11 / B3) | `bun test packages/agentic-workflow/test/doc.docops.test.mjs` exits 0 including the four `--out` cases |
| AC-11 | One section id per heading across both halves: the index/read id equals the chunker's for every tracked `*.md` (S11 / B1) | `bun test packages/agentic-workflow/test/doc.structure.test.mjs` exits 0 with the corpus parity case reporting 0 mismatches |
| AC-12 | Phase mapping reads the owner's unit-doc grammar — the tick is state, never a required shape — so a template-shaped doc maps its phases and pointers (S11 / B2) | the same suite's owner-grammar parity case exits 0 |
| AC-13 | A refusal prints one `doc:` prefix (S11 / A2) | the same suite's refused-selector case asserts the exact stderr |
| AC-14 | The `F99` refusals keep ≥ 3× headroom against the 50 ms bar under the gate's parallel load (S12) | `node --test packages/agentic-workflow-schema/test/verification-preflight.test.mjs` exits 0 and its printed `200k … refusal` lines stay ≤ 17 ms |
| AC-15 | `A3` is recorded with its re-trigger, not repaired (S13) | `rg -n 'file - --section' docs/fix/366-doc-cli/SPEC.md` matches ≥ 1 |
| AC-16 | A fenced line is never a heading at any nesting depth — a fence closes only on its own character with at least its own length — so every tracked `*.md` scans as the locator sees it (S14 / A6) | `bun test packages/agentic-workflow/test/doc.chunks.test.mjs` exits 0 including the nested-fence cases, and the id-parity case reports zero artifact documents |
| AC-17 | A store built by the previous scanner is re-scanned, never served (S14 / A6) | `bun test packages/agentic-workflow/test/doc.sync.test.mjs` exits 0 including the chunker-version case |
| AC-18 | The unit document passes the phase-contract lint (S14) | `bun scripts/phase-lint.mjs docs/fix/366-doc-cli/SPEC.md` prints `verdict PASS` |
| AC-19 | Both halves share one heading scanner: for every tracked `*.md` the chunk set and the section set are the same headings at the same lines, and no section comes from a leading frontmatter block (S15 / A7) | the parity case in `doc.structure.test.mjs` reports `0` drift, `0` chunk headings without a section and `0` sections without a chunk |
| AC-20 | The parity case is red before the fix and asserts the whole invariant afterwards — no named exception list (S16 / L10) | `git show e…`-time red run plus the green run recorded in `E29`/`E30` |
| AC-21 | Every folded finding carries its `F<n>` line with the fold commit and what was verified (S17 / L9) | `rg -c '^- \*\*F[0-9]+\*\*' docs/fix/366-doc-cli/SPEC.md` matches 8 and each names a commit reachable from `HEAD` |
| AC-22 | The branch is published (S18) | `git rev-parse origin/feat/366-doc-cli` equals `git rev-parse HEAD` |

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

- **L3** — 2026-11-06, decisions recorded in `decisions.md` (D1–D5): the
  retired refusal surface (D1); S4's "(remark AST)" delivered as
  locate-through-mdast plus byte-offset splice — no remark dependency (D2,
  under 65's D8 with the golden corpus as its re-trigger); the positional
  branch's own receipts instead of reusing the retrieval envelope's closed
  `DOC_COMMANDS` vocabulary (D3); the index corpus, phase mapping and
  dependencies spellings (D4); the `Triggers:` clause convention (D5).
- **E1** — 2026-11-06, `bun test test/doc.docops.test.mjs` (red, commit
  `5a022a74`) · exit 1 · 23 fail / 5 pass — the only passing cases are the
  retrieval-grammar pins.
- **E2** — 2026-11-06, `bun test test/doc.docops.test.mjs` (green, commit
  `b8e23003`) · exit 0 · 28 pass · 0 fail; `node --test test/doc.docops.test.mjs`
  · exit 0 · 28 pass.
- **E3** — 2026-11-06, `bun test test/doc.structure.test.mjs` (red, commit
  `13d9c7b7`) · exit 1 · `Cannot find module '../src/doc/structure.mjs'`.
- **E4** — 2026-11-06, `bun test test/doc.structure.test.mjs` (green, commit
  `c01c2bfb`) · exit 0 · 14 pass · 0 fail; `node --test` · exit 0 · 14 pass.
- **E5** — 2026-11-06, full crate suites at the P5 head: `bun run test` ·
  434 pass / 1 fail — the one fail is the pre-existing
  `journal.surfaces.test.mjs` S15, reproduced identically on the stashed base
  (it reads the live `.agentic-workflow/journal` carrier state, not this
  unit's code); `node --test` · 434 pass / 1 fail, same case.
- **E6** — 2026-11-06, differential vs base `b8b1d814` (worktree copy in
  `/tmp/aw-366-base`): `doc --sync` identical receipt, `doc --query Objective`
  identical row and score (`doc.md · Guide > Objective · L3-5 · 8.8e-7`, exit
  0 both), bare `agentic-workflow` identical usage (exit 1 both); the one
  output difference is the positional `doc read` refusal whose retirement is
  D1 — `positional doc operations … ship with unit 71 …` replaced by `--file
  is required`, exit 1 both sides.
- **E7** — 2026-11-06, savings demo (AC3): `wc -c
  skills/review-change/SKILL.md` → 12,740 B; `doc read --section "Progressive
  loading — choose one review route"` → 2,055 B + `--section "Reviewer
  anti-invention rule (S10, from #205)"` → 678 B = 2,733 B for a second
  review-change-style pass (≈3,186 → ≈683 tokens at 4 B/token; 10,007 B /
  78.5% saved); unit-doc second pass: `doc read --file
  docs/fix/407-section-locator-core/SPEC.md --section Tasks` → 1,768 B vs
  21,390 B whole (≈4,906 B / 91.7% saved).
- **E8** — 2026-11-06, structure index over the full corpus in scratch
  (live-tree guard respected): `doc index --out` twice over a git-archive copy
  (1,007 files · 9,179 sections · 45 unit docs) · 12.1 s · exit 0 · `cmp` of
  the two artifacts byte-identical, and the artifact identical before/after
  the perf slice.
- **E9** — 2026-11-06, golden roundtrip (commit `bd06b8a8`):
  `bun test test/doc.roundtrip.test.mjs` · exit 0 · 3 pass over 92 skills docs
  / 536 sections, plus the stubborn fixture (frontmatter, setext, fences,
  unicode); `node --test` · exit 0 · 3 pass. `ALLOWED_NORMALIZATIONS` pinned
  empty inside the test.
- **E10** — 2026-11-06, P7 receipts: `rg -c 'ship with unit 71'
  packages/agentic-workflow/src packages/agentic-workflow/bin
  packages/agentic-workflow/README.md` → no match (exit 1 — the retired
  sentence is gone); `rg -ci 'experimental'
  packages/agentic-workflow/README.md` → 2;
  `bun scripts/lint-changeset.mjs .changeset/366-doc-cli.md` · exit 0 · `ok
  366-doc-cli.md`; row 71 flipped `defined → in-progress` through the emitter
  (`roadmap rowUpsert` receipt `before:1dcc7df3 after:0ce717eb`), then
  `scripts/docs-generate.mjs` + `--check` · verdict PASS.
- **E11** — 2026-11-07, touched root suites at head:
  `bun test packages/agentic-workflow/test/roadmap-check.test.mjs` · 24 pass
  `bun test scripts/red-first.test.mjs` · 9 pass (one earlier run showed 8/1
  on the `O4` shipped-history case; two immediate reruns green both runtimes —
  reported, not hidden); `bun test scripts/path-protection.test.mjs` ·
  21 pass; `bun scripts/invocation-drift.mjs` · exit 0.
- **E12** — 2026-11-07, obligations ledger closed: every row in
  `planning-obligations.md` flipped `planned → verified` against the
  foreground runs recorded in E1–E11 (O16's local-gate receipt rides the `G`
  line).
- **L4** — 2026-11-06, the `## Future` row extracted from issue #192's wording
  (`doc edit` set/append spellings) stays `open` — excluded by the frozen
  row-71 scope, offered to the owner at unit close.
- **G1** — 2026-11-07, `bun scripts/local-gate.mjs --skip-network` at the
  unit's head (`b230d2a9`) · **verdict: PASS — 8 step(s) in 186s** · exit 0.
- **E13** — 2026-11-07, the gate caught this change twice and both catches
  were repaired, never excused: (a) the first root-suite run failed AC26's
  lexical discipline check (`receipt|EDIT REFUSAL|verdict` tokens under
  `src/doc`, zero at base) — the four hits were this unit's own comment
  wording, reworded with behavior untouched (commit `b230d2a9`, suite rerun
  66 pass); (b) the crate leg's only red was the pre-existing S15 case, whose
  root cause turned out to be one committed journal fragment whose filename
  contradicts its own header and its committing commit message
  (`c9dd1d88` — body and message say `docs/domain-separation-safeguard —
  narrative`); the file was renamed to the identity its own bytes declare,
  bytes untouched (commit `f96f9ea6`), which is the same repair class the 440
  session disclosed — the writer-side fragment-name gap is the standing owner
  finding, and this was its second occurrence.
- **E14** — 2026-11-07, `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs`
  after the rename · exit 0 (the S15 red is gone at head without touching any
  test).
- **L6** — 2026-11-07, the correction batch applied under the owner's request.
  Commits: `8ea10e05` (ledger freeze), `f068f66e` (red-first cases),
  `7bc11894` (the doc-branch repairs), `767de9da` (the `F99` capture). Scope was
  exactly the `fix-now` set (B1, B2, B3, A2, A5) plus the owner's override (A1)
  and the A3 `## Future` row; `A4` stayed `ignore`.
- **E15** — 2026-11-07, red commit `f068f66e`:
  `bun test test/doc.docops.test.mjs test/doc.structure.test.mjs` · exit 1 ·
  42 pass / 7 fail — the seven new cases (four `--out`, the single-prefix case,
  the corpus id-parity case, the owner-grammar parity case).
- **E16** — 2026-11-07, green commit `7bc11894`: the same two suites ·
  exit 0 · **31 pass** (`doc.docops.test.mjs`) and **18 pass**
  (`doc.structure.test.mjs`), 0 fail.
- **E17** — 2026-11-07, the option grammar at `7bc11894`:
  `doc read --file <doc> --out x.json` → exit 1 `--out belongs to index`, no
  file; `doc edit … --out x.json` → exit 1, document untouched;
  `doc index --out x.json --json` → exit 0, artifact written, 1 826 238 B
  printed, identical to the `--json` bytes; refusals now print
  `DOC REFUSAL — NO_MATCH` + exactly one `doc:` prefix.
- **E18** — 2026-11-07, id parity at `7bc11894` over the tracked corpus:
  1016 files · 9174 chunk sections · **9058 paired sections, 0 drift**; the
  four documents whose chunker scan is corrupted by its own fence rule
  (`chunks.mjs:116` collapses a fence longer than three backticks — A6) are
  pinned by name in the case instead of silently skipped.
- **E19** — 2026-11-07, phase parity at `7bc11894`: 45 in-tree unit docs —
  index maps phases in **39**, the phase-contract owner
  (`parseUnitDocPhases`) in **39**, **0 missed, 0 disagreements** (the cut head
  mapped 12 and missed 27).
- **E20** — 2026-11-07, `F99` at `767de9da`:
  `node --test test/verification-preflight.test.mjs` · exit 0 · 8/8, timings
  `200k plan refusal 9.11 ms` / `200k receipt refusal 9.04 ms` (cut head:
  21.74 / 19.42 ms); under four concurrent busy loops the same suite · exit 0 ·
  8/8 with 12.61 / 8.18 ms against the untouched 50 ms assertion.
- **E21** — 2026-11-07, crate suites at the batch head: `bun run test` ·
  **441 pass / 0 fail**; `node --test` · **442 pass / 0 fail**.
- **E22** — 2026-11-07, schema suites at `767de9da`: `bun run test` · exit 0 ·
  756 pass (both legs); `node --test test/*.test.mjs` · **756 pass / 0 fail**.
- **E23** — 2026-11-07, differential against the pre-correction head
  `946037e0` (worktree in `/tmp`, removed after): `doc index --json` differs
  only in `README.md` and `CHANGELOG.md` (the markup-bearing ids, now identical
  to the chunker's) plus this unit's own four edited docs and the new receipt
  file — no other file moves; `doc read --file` (whole and `--section`),
  `doc edit --dry-run` and the retrieval branch are byte-identical
  (`md5sum` equal on both sides), except the intended single-prefix refusal
  message.
- **L8** — 2026-11-07, disclosed test change, and a red-first inversion for one
  case: the corpus id-parity case first written in `f068f66e` demanded that the
  index reproduce **every** chunker id, which cannot hold while `chunks.mjs`
  mis-scans fences (A6) — it asserted a second unit's defect. It was corrected
  after the implementation instead of before, so its red is `f068f66e`'s and
  its green is the follow-up `test(366): pin the id-parity case…` commit. The
  corrected case keeps the invariant (`0 drift` on every section both scanners
  see) and **names the four artifact documents in a pinned list**, so the
  exclusion can neither grow silently nor disappear unnoticed — the sanctioned
  "a case that genuinely cannot hold is recorded with its reason", not a
  relaxed assertion.
- **L9** — 2026-11-07, second correction batch, scope read from the handoff
  (`S14`): the open findings were **A6** and this document's three `phase-lint`
  reds; `A3` stayed parked (`## Future`) and `A4` `ignore`, both decided by the
  owner in the previous turn (assumption A-1 recorded in `## Specs`). Commits:
  `e04295e0` (red reproducers), `c4addf23` (the fence rule + the store guard),
  `f5a02989` (the residual-disagreement pin). The six rows the previous batch
  repaired (B1, B2, B3, A2, A5, A1) are closed in `## Findings`; A6 is closed by
  this batch.
- **E24** — 2026-11-07, red commit `e04295e0`:
  `bun test test/doc.chunks.test.mjs` · exit 1 · 9 pass / **1 fail** (the
  nested-fence case); `bun test test/doc.sync.test.mjs` · exit 1 ·
  **1 error** (`CHUNKER_VERSION` not exported) / 1 fail; `bun test
  test/doc.structure.test.mjs` · exit 1 · 17 pass / **1 fail** (the id-parity
  case reporting 4 artifact documents).
- **E25** — 2026-11-07, green commit `c4addf23`: the same suites ·
  `doc.chunks.test.mjs` 10 pass, `doc.sync.test.mjs` 8 pass, 0 fail;
  `doc.structure.test.mjs` · 18 pass / 0 fail, the parity case green over the
  corpus.
- **E26** — 2026-11-07, the differential against `18016e35` (clone in `/tmp`,
  removed after): `scanChunks` over the 1016-file corpus changes in **exactly
  one document** — `docs/fix/338-closed-ceremony-cli/SPEC.md`, 28 → 20 chunks:
  the eight fenced pseudo-headings disappear from `## Log`'s quoted example and
  the six real headings (`Next`, `References`, `Branch`, `Depends on`,
  `Regression scope`) get their own ids back; 9269 → 9261 chunks corpus-wide,
  every other file byte-identical. `doc index --json` is **unchanged** (0
  files, 0 units), because the index reads the markdown tree, not the chunker.
  That published-id change is why the store now stamps `CHUNKER_VERSION`.
- **E27** — 2026-11-07, `bun scripts/phase-lint.mjs docs/fix/366-doc-cli/SPEC.md`
  · **verdict PASS** (the cut head printed `verdict BLOCKED` on P2, P4, P6 plus
  the dangling `AC3` link).
- **E28** — 2026-11-07, crate suites at `f5a02989`: `bun run test` ·
  **443 pass / 0 fail**; `node --test` · **444 pass / 0 fail**.
- **F1** — 2026-11-07, **B1** folded at `7bc11894`: the section id comes from the
  heading's own line, not the locator's rendered title — verified by the corpus
  parity case (9058 paired sections, 0 drift) and by `doc read` resolving the
  chunker's id for `README.md`'s markup-bearing heading.
- **F2** — 2026-11-07, **B2** folded at `7bc11894`: the phase grammar is the
  owner's unit-doc shape (tick optional) — verified by the owner-grammar parity
  case over 45 in-tree unit docs (39 mapped, 0 disagreements, 0 missed).
- **F3** — 2026-11-07, **B3** folded at `7bc11894`: `--out` is a closed option set
  — verified by the four `--out` cases (refused on `read`/`edit`, honoured with
  `--json` on `index`, artifact written and document printed).
- **F4** — 2026-11-07, **A2** folded at `7bc11894`: one `doc:` prefix per refusal —
  verified by the exact-stderr case.
- **F5** — 2026-11-07, **A5** folded at `8ea10e05`: `D4`/`PE-011`'s "the checkbox
  grammar is frozen" premise corrected — verified by the decision row and the
  evidence row naming the owner grammar.
- **F6** — 2026-11-07, **A1** folded at `767de9da`: the `F99` capture does half
  the per-property work — verified by the suite under four busy loops
  (12.61 / 8.18 ms) and by the gate step green in 5–7 s against the untouched
  50 ms assertion.
- **F7** — 2026-11-07, **A6** folded at `c4addf23`: the fence keeps its own
  length, and a store stamped by an older scanner re-scans — verified by the
  nested-fence case, the chunker-version case and the one-file differential.
- **F8** — 2026-11-07, **A7** folded at `1734ed10`: one heading scanner for both
  halves — verified by the corpus parity case at **9184 chunks = 9184 sections =
  9184 paired, 0 drift, 0 chunk heading without a section, 0 section without a
  chunk**, and by the red run of the same three cases at `2cc0d17a`.
- **L10** — 2026-11-07, disclosed test adjustment, same class as L8: the parity
  case's artifact pin was written as `[]` on the assumption that the fence
  repair clears every scan corruption. Measurement said otherwise — three
  documents still carry a chunk heading the markdown tree does not have, from a
  *different* cause (A7) — so the pin now names those three documents instead
  of claiming an empty set. The assertion kept its strength (`0` id drift on
  every paired section, a named set for the rest); it was widened after the
  implementation, not before.
- **L11** — 2026-11-07, **A7**, a new finding, routed to the owner and not
  repaired here (§9): the chunker and the markdown tree still disagree on three
  documents (`docs/fix/224-…/progress.md`, `docs/fix/383-measured-acceptance/
  SPEC.md`, `skills/triage-issue/references/ISSUE_PROCESS.md`) in both
  directions — the chunker reports 7 headings the tree does not have, and the
  tree reports 16 headings the chunker never chunks (frontmatter comment lines
  such as `# ac-hash:`, which the index publishes as sections of both
  `_TEMPLATE/SPEC.md` files). Root causes are shared: an indented fence inside a
  list item, and the two scanners' opposite frontmatter/`---` conventions.
  Repairing it means one scanner (65's chunker) and one parser (#407's locator)
  agreeing on CommonMark block structure — a unit of its own.
- **L12** — 2026-11-07, third batch, scope read from the owner's verbatim
  request (`S15`–`S18`): A7, the `L10` debt and the `L9` debt, then the push.
  Commits: `2cc0d17a` (red cases), `1734ed10` (the one-scanner repair),
  `f8ebcc43` (the two corrected fixtures).
- **L13** — 2026-11-07, disclosed fixture correction, same class as L8/L10 **and
  closed differently**: the first version of the two new reproducers was written
  against a guess about CommonMark rather than the real shape. A `## …` line at
  column 0 *is* a heading even after a backtick opens a code span on the previous
  line, and a heading inside a list item is not a root section — so the chunker
  case now reproduces `ISSUE_PROCESS.md`'s real shape (a list continuation) and
  the index case uses the template's real frontmatter. Because the correction
  came after the implementation, the red was **re-proven against the pre-fix
  commit** `2cc0d17a` in a `/tmp` clone: the corrected chunker case fails there
  (10 pass / 1 fail), the index case fails (17 pass / 1 fail) and the parity case
  fails on the same run.
- **E29** — 2026-11-07, red proof at `2cc0d17a` (clone in `/tmp`, removed after,
  carrying the corrected fixtures): `bun test test/doc.chunks.test.mjs` · exit 1 ·
  10 pass / **1 fail** (the list-continuation heading); `bun test
  test/doc.structure.test.mjs` · exit 1 · 17 pass / **2 fail** (the frontmatter
  section and the parity case).
- **E30** — 2026-11-07, green at `1734ed10` + `f8ebcc43`:
  `bun test test/doc.chunks.test.mjs test/doc.structure.test.mjs` · exit 0 ·
  **30 pass / 0 fail**; crate `bun run test` · **445 pass / 0 fail**;
  `node --test` · **446 pass / 0 fail**.
- **E31** — 2026-11-07, the corpus invariant after the repair (measured, not
  asserted): `1016` tracked `*.md` → **9184 chunks = 9184 sections = 9184 paired
  sections**, `0` id drift, `0` chunk heading the markdown tree lacks, `0`
  section the chunker never produced; 45 unit docs still map 39/39 phases with 0
  disagreements. Differential against `78da35e1`: 9262 → 9278 chunks, **0 renamed**
  among the 9231 surviving chunks, 11 bogus chunks gone and 27 real ones restored
  across exactly the four documents A7 named (`224-…/progress.md`,
  `383-measured-acceptance/SPEC.md`, `docs/features/37-…/planning-findings.md`,
  `skills/triage-issue/references/ISSUE_PROCESS.md`) — the other 20 diff lines are
  this unit's own edited documents.
- **G4** — 2026-11-07, `bun scripts/local-gate.mjs --skip-network` at this batch's
  head · **verdict: PASS — 8 step(s) in 130s** · exit 0, `schema-node-compat`
  green in 5s.
- **G3** — 2026-11-07, `bun scripts/local-gate.mjs --skip-network` twice, at
  `799f4b8f` · **PASS — 8 step(s) in 264s** (the earlier run of the same tree,
  before the receipt line, `245s`) · exit 0 both times, `schema-node-compat`
  green in 6–7s with refusal timings `8.79 / 7.07 ms` and `8.57 / 7.36 ms`.
  The commit that carries this line is docs-only; `docs-generate --check` and
  `phase-lint` were re-run green on top of it.
- **G2** — 2026-11-07, `bun scripts/local-gate.mjs --skip-network` twice: at
  `767de9da` · **PASS — 8 step(s) in 133s**, and at the handoff head
  `7b2f152b` · **PASS — 8 step(s) in 128s** · both exit 0, each with
  `schema-node-compat: exit 0 in 5s` (the step that was red twice before `A1`
  was repaired) and refusal timings `9.86 / 7.47 ms` and `8.95 / 7.21 ms`
  against the untouched 50 ms bar.
- **L7** — 2026-11-07, a new finding surfaced while pinning O19 and goes to the
  owner instead of into this batch (§9): **A6** — `chunks.mjs:116` sets
  `fence = f[1][0].repeat(3)`, so a fence longer than three backticks (or a
  three-backtick example inside a four-backtick block) closes early and the
  retrieval scanner reads a fenced example as a heading. Measured on the
  corpus: 4 documents carry a corrupted heading-path chain, 5 real headings
  inherit a fenced example's title, and 46 real sections are never chunked at
  all (so `doc --query` cannot find them). Pre-existing, unit 65's surface, and
  repairing it would change published chunk ids — hence a proposal, not this
  correction.
- **L5** — 2026-11-07, the external verification receipt
  ([`external-verify.md`](external-verify.md)) returned `NEEDS-DECISION` with
  three blockers and five advisories at base `b8b1d814` / head `946037e0`. The
  triage classified B1/B2/B3 (+A2, A5) `fix-now`, A1 `report-only`, A3
  `proposal`, A4 `ignore`. The owner's correction request, verbatim:
  ```
  arregla los findings recomendados y también A1, anota A3 en ##Future
  ```
  Resolution: `proceed` — the state (a `NEEDS-DECISION` receipt on this unit's
  head, ledgers present, P1–P8 delivered) supports one correction batch on the
  `fix-now` set, with `A1` folded in on the owner's explicit override (S12) and
  `A3` recorded as a `## Future` row (S13). The ledgers were extended **before**
  the first line of code: `S11`–`S13`, tasks `P9`–`P13`, obligations `O18`–`O22`
  (`planned`), `O7`/`O9` reopened to `in-progress` because a blocker falsified
  their stated outcome, and `PE-016`–`PE-019` added for the claims the repairs
  rest on.

## Next

Owner external verification of the diff at `feat/366-doc-cli` head (§8 of the
applying order: the diff summary, the obligations ledger state, the
verification block and the documentation state are presented; the PR against
`main` is opened only after the verdict).

## References

- Issue `#366` (anchor restored) · issue `#192` (closed completed; recorded here) · roadmap row 71.
- `docs/features/71-doc-cli/SPEC.md` — the carried ACs (AC1–AC3, AC5–AC6) and the historical rough cut.
- `docs/features/65-doc-toolchain/SPEC.md` — D2 (entry-point shape), D5 (shared stable IDs), D8 (library policy).
- `docs/fix/407-section-locator-core/` — the splice primitive this unit consumes.
- `docs/workflow/PACKAGES.md` — pin rules for the crate.

## Branch

`feat/366-doc-cli`
