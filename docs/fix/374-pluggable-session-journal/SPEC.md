---
type: feature
scope: large
---

# fix/374-pluggable-session-journal

> Pluggable session-journal storage — canonical structured entry + store-driver
> contract (Markdown stays the default render). Applied inline per the owner's
> governing request (S1–S9 below); the owner's S6 substitutes for the lane's
> review machinery on this unit's own surgery, exactly as fix/405 did.

## Issue

[#374](https://github.com/gtrabanco/agentic-workflow/issues/374) — NEW FEATURE:
pluggable session-journal storage. Roadmap row 115. The PR closes it with
`Closes #374` in the body.

## Specs

The governing request is the owner's command message, quoted verbatim as S1–S9.
S1 names the issue as the requirement source and S2 orders the impact report on
the merged sibling #405 before anything is applied; the owner's answers to the
three cut-time questions are frozen as owner decisions D1–D3 in `## Log`. Each
requirement is quoted unedited.

**S1 — Apply issue #374.**
> Apply to this repository: issue #374

**S2 — Impact report on the merged #405 before applying.**
> Al hacer esta implementación es importante que aprecies que la issue #405 que en principio dependía de esta feature se ha hecho y mergeado primero, así que antes de aplicar quiero un informe de como afecta esto a la feature, si existen partes reaprovechables y que medidas a tomar para poder llevar a cabo la implementación correctamente vas a tomar.

**S3 — Frozen-failure corpus first (RED before anything).**
> If this change repairs known failures, extract each one's reproducer from git history / the findings ledger **as a failing check before implementing** — they are the test corpus; the change is done when every reproducer passes. Nothing else is padded in.

**S4 — Fixtures before the real tree.**
> Any new mechanic (grammar, lint, script, template) is validated on a throwaway copy first: the golden fixture, fixture unit docs, or a toy repo under `mktemp -d /tmp/…`. Scratch lives outside the worktree and is removed after. Only when fixtures pass do the real files change.

**S5 — Freeze the planning ledgers before the first line of code.**
> This command substitutes for the lane's plan step, so it writes the planning
> ledgers in the repo's own shapes — row contracts owned by
> `skills/pre-execution-review/references/LEDGERS.md`, mirrored in
> `docs/fix/_TEMPLATE/SPEC.md`. A change applied without them is a legacy unit
> with no ledgers, and the repo's reviews and audits refuse it until they are
> constructed — so cut them here, never retrofit them later:
>
> - **Home:** the target issue's unit dir `docs/fix/<issue>-<topic>/`. When it
> does not exist, create the unit doc from `docs/fix/_TEMPLATE/SPEC.md` with my
> verbatim `S1..Sn` as the frozen request. XS/S embeds `### Planning evidence` /
> `### Obligations` in the unit doc; M/L freezes `planning-evidence.md` /
> `planning-obligations.md` beside it — never both. No issue # given → ask me
> once where the ledger lives, then continue.
> - **Obligations** — one row per normative behaviour, compatibility invariant,
> affected use case, and required failure state, in the 9-column shape
> (`obligation-id | authority-source | affected-use-case-or-invariant | phase |
> task | implementation-owner | validator | required-evidence | status`). Ids
> `O1, O2, …`; each row's `authority-source` cites its `S#`; exactly one phase
> and one task per row; every validator is a backticked command plus the outcome
> it must produce (`… exits 0`, `… matches <N>`); every row is `planned` at cut
> time. Each §2 frozen-failure reproducer is at least one row's validator. An
> empty ledger is a defect — if the change truly imposes nothing, one
> `n/a: <reason>` row.
> - **Planning evidence** — one row per Engineering claim the change rests on
> (`PE-001, …`; `id | authority-kind | claim | source | freshness |
> affected-decision-or-obligation`). An unsampled assumption about a tool's or
> model's behaviour is `unknown` with an owner, never a silent citation.
> - **Acceptance criteria** — the unit doc's `## Acceptance criteria` section is
> frozen with one observable, testable criterion per `S#`, each naming the check
> that proves it. This is the anchor `review-change`'s per-criterion coverage
> table and SPEC-drift check reads; a unit doc without filled criteria gives the
> review nothing to dismantle per criterion and reports fewer findings than the
> same change developed through `unit-lane` — fewer findings that mean less
> declared surface, not a better change.
>
> The ledgers freeze at cut except `status`. Phase labels are `P1, P2, …`.

**S6 — Work inline — never run this repo's own machinery on its own surgery.**
> No `review-change`, no `audit-pr`, no fold cycle, no self-granted gate exceptions on this change. Direct application: plan briefly, implement, hand the diff to me. The one exception is the repo's deterministic gates (tests, lints) — run those always.

**S7 — Implement test-first, differential, in slices.**
> - One RED test per requested rule; for every existing command sharing changed code, one test proving its previous behavior still holds; nothing else.
> - **Differential check**: run each touched command against a copy of the base commit (in `mktemp -d`, never committed) and against the change; any stdout/stderr/exit difference nobody asked for is a regression — fix and pin it.
> - Work-unit commits of ~400 authored changed lines (additions+deletions), Conventional Commit messages, tests and docs alongside behavior. **Never delete spaces, blank lines, or comments for cosmetic line savings; never omit tests, minify, add gratuitous abstractions, or split artificially** to fit the slice — if the correct solution exceeds it, say why and continue. If a slice boundary nears, ask me once for the delivery strategy (stacked PRs / single PR), then keep going.

**S8 — Verify like a writer, hand off like one.**
> Close the obligations ledger first: every row flips to `verified` only with its
> validator actually run in the foreground and the evidence recorded where its
> `required-evidence` cell says — or an evidenced `n/a` (cite `path:line`, a
> ledger row, or a contract). A `planned`, `in-progress`, blank, or `deferred`
> row blocks the handoff — name the open ids; never defer out of the unit
> (deferral needs my SPEC amendment first, never a follow-up issue). A blocker
> that reopens a behaviour flips its row back before anything else.
>
> Then run the declared verification commands in the foreground and report each as `command: observed result`. Then stop and present: the diff summary, the obligations ledger state (rows × status), the verification block, and every failed/skipped/pending check honestly — **I am the external verifier**. Do not self-approve, do not claim done before my verdict. A checkbox or a passing suite grants nothing by itself.

**S9 — Correction bounds (hard).**
> After my review: one correction batch fixing every reported blocker → one recheck limited to those blockers (re-running the touched obligation rows' validators and flipping their statuses back) → a second pass only if the **same** blocker still fails → then one `Needs your decision` result naming the open blockers. **A new finding never earns another cycle** — it goes to me, and the turn ends.

## Acceptance criteria

One observable criterion per requirement; each names the check that proves it.
AC1–AC9 quote issue #374's "Acceptance criteria" verbatim. The owner's cut-time
answers (D1–D3 in `## Log`) freeze the slice as **full** (every AC below), the
delivery as **one PR**, and the contract as **insert-only**.

- **AC1** — A canonical entry schema exists in `packages/agentic-workflow-schema` with a version constant, and **`metadata` is an open map** validated for shape, not for keys. Check: `bun test packages/agentic-workflow-schema/test/journal-entry.test.mjs` (version-constant + open-map cases: unknown consumer keys accepted, shape violations refused).
- **AC2** — The same entry can be appended and queried through the driver contract by at least **two drivers** exercised in the suite (default Markdown + the reference SQLite driver), with a single shared conformance test suite both must pass. Check: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` (conformance run for both drivers through the one harness).
- **AC3** — `scripts/session-close.mjs` and `/log-session` write **through the driver**, not by editing the log file directly; the append-only guarantee is enforced by the driver contract and proven by the same refusal test that exists today. Check: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` (the publisher routes through the driver) + `bun test packages/agentic-workflow/test/log.publish.test.mjs` exits 0 unmodified + `bun test scripts/session-close.test.mjs` exits 0. Interpretation frozen in `## Log` D11: `session-close.mjs` has never written the log (its own header + `ledger-ownership@1`), so its driver-composition is the insert-only fragment guard #405 landed; the mechanical writer (`publish.mjs`) is the code that moves behind the driver.
- **AC4** — **Byte-identical default**: a repository configured with the default driver produces a `docs/LOGS.md` diff identical to the pre-change behaviour for the same entry, verified by a golden test. Check: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` (golden case: the appended bytes equal `renderEntry(facts)` for the same payload, and the publisher's non-carrier append is byte-identical to the base commit's).
- **AC5** — **Consumer fields survive a round trip**: an entry carrying `metadata.dev_id` and `metadata.commit_hash` is written, read back, and rendered without loss by both shipped drivers, and no core writer ever strips an unknown key. Check: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` (round-trip case for both drivers).
- **AC6** — Query predicates cover at least `{ dateRange, branch, keyword }`, are expressed once (not per driver), and both shipped drivers answer them with the same results. Check: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` (predicate-parity case: both drivers answer the identical predicate set identically).
- **AC7** — The driver-authoring doc states the required guarantees (append-only, monotonic timestamps, no silent data loss, predictable failure), and a **failing-driver fixture** proves the contract catches a driver that violates one of them. Check: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` (violating-driver fixture caught by the conformance harness) + the authoring doc naming the four guarantees (owner: `journal-driver-contract@1`, the crate README).
- **AC8** — No Git-tracked journal format change for this repository: `git diff` on `docs/LOGS.md` after a logged session shows one appended entry, nothing else. Check: `bun test packages/agentic-workflow/test/log.publish.test.mjs` exits 0 unmodified + the golden case (no `Metadata:` line on a metadata-free entry) + the existing `journal.test.mjs` parity cases stay green unmodified.
- **AC9** — Every consumer-facing prose surface names the journal type's canonical schema owner (no second hand-rolled entry grammar — the repository's existing single-owner rule). Check: `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` (owner-citation case for `journal-entry@1`).

## Impact

- **Consumes:** #405's landed carrier (`src/journal/fragment.mjs`,
  `aggregate.mjs`) as the Markdown driver's opted-in transport; feature 394's
  `log render` (`src/log/render.mjs`) as the byte owner of the mechanical
  entry's block; feature 65's SQLite adapter (`src/doc/sqlite.mjs`) as the
  reference driver's runtime adapter; the schema package's hand-rolled
  validator + JSON Schema precedent (`validateEnvelope`,
  `envelope.schema.json`) as the authoring pattern.
- **Consumed by:** the mechanical writer (`createJournalPublisher` in
  `log/publish.mjs`) — the code path the pi extension and the template hook
  reach; the driver-authoring path any consumer implements; the upcoming web
  layer, which can read the canonical entry stream instead of parsing Markdown.
- **Stops being true:** "the journal's storage is the Markdown file" — the
  storage becomes the driver; the Markdown file is the default driver's render
  target. `template/.agentic-workflow/journal.md`'s forward note ("when the
  pluggable store-driver contract lands…") is rewritten in the same PR to name
  the landed owner (docs currency).
- **Differential surface:** every existing command sharing changed code must
  behave byte-identically — `log render`, `createJournalPublisher` (both
  routing modes), `session-close.mjs render|close`, the template hook, and
  every CLI subcommand of the crate. The existing suites must pass unmodified.

## Retirements

Nothing is retired. The direct-append path stays (it is the default driver's
non-carrier transport); the fragment carrier stays (the default driver's
opted-in transport); no surface, token or narrative is replaced. `rg` evidence
at close: the surfaces this unit touches all keep their current names.

## Non-goals

The issue's "Out of scope" list, verbatim:

- **Shipping an enterprise vector driver** (Postgres/pgvector, Qdrant, Chroma, cloud object stores). Those are consumer implementations of the documented contract. Owned by the consumer, documented here as examples only.
- **Replacing Markdown as a *reading* surface for this repository.** `docs/LOGS.md` stays Markdown-in-git for human readers; only its *authoring* moves behind the driver contract.
- **Semantic / embedding-based retrieval of the journal.** That is `doc-toolchain` (feature 65) half B — its `P1 keyword → P2 hybrid` retrieval over a gitignored local SQLite store, with server vector databases explicitly listed as its non-goal (P4). This feature does not build a retrieval index; it changes *where an entry is written* and *who may query it*.
- **The web viewer itself.** Rendering a structured entry stream as a browsable UI belongs to the web layer (`pi-web-workflow-panel`, feature 87) and, for this project's own site, the upcoming web surface. This feature only owes the substrate a viewer can consume.
- **Migrating existing entries** beyond a one-shot import of this repository's own `docs/LOGS.md` into the default driver, if the default turns out to need it — a fixture, not a migration program.
- **Multi-tenant or hosted operation.** Running the store is the consumer's problem; the workflow ships the contract and the default.

## Risk tier

Computed at cut time against the planned path set
(`bun scripts/ceremony.mjs tier classify --paths …`, run 2026-11-07):

- **Tier** — recorded in `## Log` (E-line) once computed · **Task Size** — `understood: true, contained_risk: named, resumable_from_diff: true`
- **Named high-risk item** — none expected (`publish` signal likely from
  `packages/agentic-workflow/src/log/publish.mjs` again — the verdict names it
  if so).

The owner's S6 substitutes inline application with the owner as external
verifier for this unit's own surgery; the tier's verification obligation is
discharged by S8's foreground evidence run.

## Future

- **A driver selection surface in project config** (2026-11-07, `open`): if a
  real consumer needs per-project driver selection, that is a config-surface
  unit of its own — D10 keeps this unit at programmatic selection only.
- **One-shot import of this repository's `docs/LOGS.md`** into the reference
  SQLite store (issue in-scope item 4's "if the default turns out to need it"):
  `open` — the default does not need it today (AC8 keeps the file canonical).

## Future cost

- Every future journal writer must append through a store driver, never by
  editing the journal file — binds new writers; enforced by the conformance
  harness's insert-only check and the existing refusal tests.
- The `journal-entry@1` schema has one owner (the schema package); adding a
  core field is a schema-const + grammar + parity change in one PR — binds
  every consumer of the type.
- A new store driver must pass the shared conformance harness before it ships —
  binds driver authors (AC7's fixture proves the harness catches violations).

## Applicable tests

- `packages/agentic-workflow-schema/test/journal-entry.test.mjs` (new — the
  canonical entry contract: version constant, closed core, open metadata,
  round-trip samples)
- `packages/agentic-workflow/test/journal.driver.test.mjs` (new — the driver
  conformance corpus: both drivers through one harness, metadata round-trip,
  predicate parity, golden byte parity, violating-driver fixture, routing)
- `packages/agentic-workflow/test/journal.surfaces.test.mjs` (extended — the
  AC9 owner-citation case for the new surfaces)
- `packages/agentic-workflow/test/log.publish.test.mjs`,
  `packages/agentic-workflow/test/log.render.test.mjs`,
  `packages/agentic-workflow/test/journal.test.mjs`,
  `scripts/session-close.test.mjs` (unmodified — the differential guarantee)
- `bun run test` in `packages/agentic-workflow-schema/` and
  `packages/pi-agentic-workflow/` (the touched packages' suites)
- `node scripts/run-root-suite.mjs` (the repo gate, always)

## Known pre-existing issues

- **Found during P1 (2026-11-07), repaired in this unit's diff with its own
  commit:** a narrative fragment the #405 merge shipped on `main`
  (`20261106T170132Z-…`) was committed without its trailing newline, so the
  carrier's own aggregator refused the whole pending set — `journal aggregate`
  exits 2 `JOURNAL REFUSAL — fragment … is not a newline-terminated entry
  block` — and the merge wiring never consumed the three fragments the merge
  carried. This is why the S15 surfaces test was red on base `b8e4d15a`
  (observed on a clean checkout of it). Repair: the pending fragment's missing
  terminator was added (content bytes unchanged — the grammar `writeFragment`
  itself enforces), and the aggregation ran once locally on this branch (the
  same command the merge wiring runs): 3 entries appended, carrier empty,
  re-run a no-op. `affects` O11 (the differential suite could not be green
  with it) — the repair is a data fix, never a test edit; S15 stays unmodified.
- `docs/LOGS.md` is not strictly chronological in its existing entries (the
  two newest are swapped, recorded by fix/405) — `does-not-affect` the driver
  contract: D9 defines the monotonic guarantee as arrival-order ids, never
  entry-timestamp order.
- The local gate's `pi-compat-guard` step fails environmentally on this box
  (TS2307 for the workspace crate in the throwaway fixture; identical on base
  `b180892c`, disclosed by fix/405 L14) — `does-not-affect` this unit's
  verdict; the step's failure is disclosed again at close if it recurs.
- The installed pi extension on this checkout predates the branch (the D8
  runbook of fix/405 is pending release + install + daemon restart) —
  `does-not-affect` the landed code; the repo's own writers keep the #405
  fallback behaviour until the runbook completes.

## Tasks

- P1 — Freeze the planning ledgers and the RED corpus: schema-package entry
  contract test + crate driver-conformance test, both observed failing first
  (validator: `bun test packages/agentic-workflow-schema/test/journal-entry.test.mjs` exits 1 before the implementation and 0 after it; same for
  `bun test packages/agentic-workflow/test/journal.driver.test.mjs`)
  (Implements: S3, S4, S5)
  Relevant files: packages/agentic-workflow-schema/test/journal-entry.test.mjs, packages/agentic-workflow/test/journal.driver.test.mjs
- P2 — Publish `journal-entry@1` in the schema package: `src/journal.ts`
  (version constant, validator, types), `journal-entry.schema.json`,
  `src/index.ts` re-export, package `exports`/`files`
  (validator: `bun run test` in `packages/agentic-workflow-schema` exits 0)
  (Implements: AC1, AC9)
  Relevant files: packages/agentic-workflow-schema/src/journal.ts, packages/agentic-workflow-schema/journal-entry.schema.json
- P3 — The crate's driver contract: `src/journal/entry.mjs` (runtime entry
  codec + `factsToEntry`), `src/journal/driver.mjs` (the contract, the shared
  predicate normalizer, `renderEntryBlock`, the conformance harness)
  (validator: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` exits 0 — contract cases)
  (Implements: AC2, AC6, AC7, D3)
  Relevant files: packages/agentic-workflow/src/journal/entry.mjs, packages/agentic-workflow/src/journal/driver.mjs
- P4 — The default Markdown driver: carrier-composed transport (fragment when
  opted in, byte-identical append when not), file-backed `query`, `render`
  (validator: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` exits 0 — markdown cases)
  (Implements: AC2, AC4, AC5, AC8)
  Relevant files: packages/agentic-workflow/src/journal/drivers/markdown.mjs
- P5 — The reference SQLite driver: insert-only table over feature 65's
  adapter, own store path outside the carrier, same predicates
  (validator: `bun test packages/agentic-workflow/test/journal.driver.test.mjs` exits 0 — sqlite cases)
  (Implements: AC2, AC5, AC6)
  Relevant files: packages/agentic-workflow/src/journal/drivers/sqlite.mjs
- P6 — Wire the mechanical writer through the driver: `createJournalPublisher`
  delegates its local delivery to the Markdown driver, options API preserved
  (validator: `bun test packages/agentic-workflow/test/` exits 0 and `bun run test` in `packages/pi-agentic-workflow` exits 0)
  (Implements: AC3, AC4, AC8)
  Relevant files: packages/agentic-workflow/src/log/publish.mjs
- P7 — Docs + single-owner wiring: the crate README's
  `journal-driver-contract@1` block + driver-authoring section, AGENTS.md
  normative-surface rows, the carrier doc's forward note rewritten to the
  landed owner, surfaces-test extension, roadmap row 115, changeset
  (validator: `bun test packages/agentic-workflow/test/journal.surfaces.test.mjs` exits 0 and `node scripts/run-root-suite.mjs` exits 0)
  (Implements: AC7, AC9)
  Relevant files: packages/agentic-workflow/README.md, AGENTS.md, template/.agentic-workflow/journal.md, docs/ROADMAP.md
- P8 — Verification: package suites, root gate, differential runs against the
  base commit, obligations ledger closed
  (validator: `bun scripts/local-gate.mjs` exits 0 — with the known
  environmental `pi-compat-guard` failure disclosed if it recurs)
  (Implements: S8, S7)
  Relevant files: docs/fix/374-pluggable-session-journal/planning-obligations.md

### Planning evidence

The L-size ledger lives beside this doc: [`planning-evidence.md`](planning-evidence.md).

### Obligations

The L-size ledger lives beside this doc: [`planning-obligations.md`](planning-obligations.md).

## Triaged steps

> The owner's S6 substitutes for the lane's plan step; the lane's triage
> command was not run — the task list above is the plan, frozen before the
> first line of code. Recorded here so no later reader mistakes the omission
> for an oversight.

## Findings

OPEN rows only: a row a review persisted as fix-now work and no fold has closed
yet. This unit runs no review pass (S6); the owner is the external verifier.

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — (L) Owner request, verbatim: "Apply to this repository: issue #374" + the #405-impact order (S2) + the eight-step inline-application protocol frozen as S3–S9 above.
- **L2** — (E) S2 discharged before anything was applied: the impact report on the merged #405 (PR #428 → `06a90127`, merged 2026-11-06) was delivered to the owner — reusables (`fragment.mjs`, `aggregate.mjs`, `render.mjs`, `publish.mjs` routing, `session-close` guard, `doc/sqlite.mjs` adapter), the two-mode AC3/AC8 reading, and the transfer-format-not-durable-store finding. The owner then froze the cut-time decisions (D1–D3).
- **L3** — (E) S4 fixture: the SQLite insert-only mechanic + the entry round-trip walked on a toy in `mktemp -d /tmp/j374-toy-XXXX` (in-memory DB over `src/doc/sqlite.mjs`, `bun` and `node` both, metadata round-trip, predicate query) — passed on both runtimes; scratch removed before any real file changed.
- **L4** — (E) S3 verdict: `n/a — this unit repairs no known failure; it is a feature`. The issue carries no reproducer corpus; its required failure states (AC7's violating-driver catch, the refusals) land red-first as obligation rows instead. No test is padded in beyond those.
- **D1** — (D) Owner decision (cut-time question 1): the slice is **full** — every AC ships: schema + contract + both drivers + conformance + authoring doc (the issue's open question 1 deferred the choice to the owner; the owner chose full).
- **D2** — (D) Owner decision (cut-time question 2): the delivery is a **single PR** against `main`, work-unit commits of ~400 authored lines.
- **D3** — (D) Owner decision (cut-time question 3, the issue's open question 3): the contract is **insert-only** — a correction is a new correcting entry, never an update of an existing row ("a wrong past line gets a new correcting line, never an edit"). The conformance harness catches a driver that mutates (AC7's fixture).
- **D4** — (D) The issue names "TypeBox, in `packages/agentic-workflow-schema`". The schema package is **dependency-free** by owner decision (AC21, the vendoring rule's D36 precedent) and its envelope precedent authors hand-rolled validators beside draft-07 JSON Schema documents. The canonical entry is delivered exactly that way: `journal-entry.schema.json` (a TypeBox-flavoured draft-07 document — TypeBox compiles and validates it) + a dependency-free `validateJournalEntry` mirroring `validateEnvelope`. The crate (which already depends on `typebox` 1.4.5) may compile the same document. Recorded here, not silently diverged.
- **D5** — (D) The canonical entry's core field set extends the issue's list by one: `reason` (optional; required when `kind` is `mechanical`). AC4's byte parity needs it — the rendered mechanical heading is `## <ts> — <branch> — auto (<reason>)`, and `renderEntry` is frozen. `summary` is required when `kind` is `narrative` and absent for `mechanical` (a required prose line on machine entries would break the same parity). The top level is closed (unknown keys refused — a consumer field belongs in `metadata`); `metadata` is the open map.
- **D6** — (D) The fragment layout is the **Markdown driver's opted-in transport, not a standalone durable driver**: `aggregateJournal` consumes and deletes fragments, so a "fragment driver" would have nothing to answer `query` with after aggregation. The default driver's `append` writes a fragment when the carrier exists and appends byte-identically when it does not; `query`/`render` answer from the journal. This is the S2 report's main design finding, adopted.
- **D7** — (D) The Markdown transport's metadata line: a metadata-carrying entry renders its block plus one trailing `- **Metadata:** <json>` line — the only way to round-trip consumer fields through a Markdown journal without touching `renderEntry` (whose bytes stay frozen). A metadata-free entry produces no line, so the default path stays byte-identical (AC4/AC8). A metadata-bearing mechanical entry travels as a narrative-kind fragment (the fragment kind records the writer class, and the block's `## `-headed shape is all the fragment grammar checks). The line's grammar is owned by `journal-driver-contract@1`.
- **D8** — (D) The reference SQLite driver reuses feature 65's adapter (`src/doc/sqlite.mjs` — `bun:sqlite` / `node:sqlite`) but owns its own database at `.agentic-workflow/journal-store/entries.db`, **outside the carrier**: the aggregator refuses any carrier file whose name is not a fragment (fix/405 D9), so a store inside `.agentic-workflow/journal/` would block every aggregation. Feature 65's invariant ("nothing but the doc entry point opens the store") is honored — the doc index DB and the journal store never share bytes.
- **D9** — (D) The monotonic guarantee is **arrival-order ids**: a driver's append never reorders and its read-back of earlier entries never changes; entry timestamps are *not* required monotonic (the journal itself is not strictly chronological — fix/405's known pre-existing issue). "Monotonic timestamps" in the issue's AC7 maps to this definition in the authoring doc.
- **D10** — (D) Driver selection is programmatic (a factory per driver) — no project-config key, no second configuration surface (the issue's open question 6 default). A consumer selects a driver in code or ships one via the authoring path.
- **D11** — (D) AC3's "session-close.mjs and /log-session write through the driver": `session-close.mjs` has never written the log (its own header and `ledger-ownership@1` allow it exactly one durable-ledger rewrite that is not this) — its driver composition is the insert-only fragment guard #405 landed, and `/log-session` writes fragments through the carrier routing. The code that moves behind the driver is the mechanical writer (`createJournalPublisher`), which both the extension and the hook reach. Recorded so the AC is read against the post-#405 reality, not the pre-#405 wording.
- **D12** — (D) Timestamps: the canonical entry's `timestamp` accepts UTC minute precision (`YYYY-MM-DDTHH:MMZ`, the mechanical form `log-facts@1` froze) or UTC second precision (`…:SSZ`, the narrative form `docs/LOGS.md` already carries). The driver parses both; the guarantee is parseability, not one format.

## Next

Run P1: freeze the ledgers (done by this commit), then land the RED corpus.

## References

- Issue: https://github.com/gtrabanco/agentic-workflow/issues/374
- Sibling unit (merged first, per S2): `docs/fix/405-journal-fragments/`
- Roadmap row 115; forward note in `template/.agentic-workflow/journal.md`

## Branch

`feat/374-pluggable-session-journal`

## Depends on

`docs/fix/405-journal-fragments` (merged — the carrier this driver composes with, per S2).

## Regression scope

| Scenario | Verified by |
|---|---|
| Non-carrier append stays byte-identical (`createJournalPublisher`, the hook, `log render`) | `bun test packages/agentic-workflow/test/log.publish.test.mjs` + `bun test packages/agentic-workflow/test/log.render.test.mjs` unmodified |
| Carrier routing stays exactly as #405 shipped it | `bun test packages/agentic-workflow/test/journal.test.mjs` unmodified |
| Session close (both modes) unchanged | `bun test scripts/session-close.test.mjs` unmodified |
| The pi extension's auto-log-session parity | `bun run test` in `packages/pi-agentic-workflow` |
| Every crate CLI subcommand | `bun test packages/agentic-workflow/test/` |
