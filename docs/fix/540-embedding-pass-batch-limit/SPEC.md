---
type: fix
scope: medium
ac-hash: 25cd83b027fb6628d7a163f2d4caab66f3f38fc9cd2773f93545bc2110581013
roadmap_summary: Issue [#540](https://github.com/gtrabanco/agentic-workflow/issues/540): the `doc --sync` embedding pass aborted the whole backfill on one non-retryable provider 400 and mislabelled it `unavailable-embeddings-provider-down` — a rejected batch is now skipped and reported with its own `embeddings-request-rejected` cause plus the provider's status/body, the request is packed under a character budget with a safe `chunk_limit` default, a limit change re-chunks on the next sync, and `--rebuild` embeds in the same pass.
---

# fix/540-embedding-pass-batch-limit

> Fix specification — one single unit document. Applied through the owner's
> local unpublished workflow (§5 ledger freeze substitutes for the lane's plan
> step); no repo review/fold machinery runs on this change. M sizing: the two
> planning ledgers are sibling files, never embedded here.

## Issue

`#540` — "ISSUE: embedding pass aborts the whole sync on an oversized batch and
mislabels the cause as provider-down". The PR closes it via `Closes #540`.

## Specs

**S1 — Apply the issue through the owner's local workflow.**
> Apply to this repository: issue #540

**S2 — A non-retryable 4xx ends the batch, never the pass.**
> - [ ] A deterministic 400 (or any non-retryable non-rate-limit failure) during `embedPendingChunks` does not abort the pass: the offending chunks are skipped, the rest embed, and the run is diagnosable.

**S2a — The skipped chunks are named, and one oversized chunk cannot block the rest.**
> - The embed pass skips the offending chunks and continues (or fails safe with an actionable message naming the file/chunk), so one oversized chunk cannot prevent the other ~10K chunks from embedding.

**S3 — A dedicated degradation key, distinct from provider-down, with its schema-package surface.**
> - [ ] A dedicated degradation key distinguishes "provider rejected the request (input/shape)" from `unavailable-embeddings-provider-down`; the frozen degradation vocabulary and its schema-package surface are updated in the same change.

**S4 — The real provider status/body reaches the operator.**
> - [ ] The real provider status/body for the failure is visible to the operator (stderr and/or envelope).

**S5 — With a provider configured, the default cannot emit a request the provider must reject.**
> - [ ] With a provider configured and no explicit `chunk_limit`, a sync cannot emit a batch the provider must reject: safe default and/or config validation, documented in the crate README.

**S6 — Changing the limit retro-applies, and `--rebuild` embeds.**
> - [ ] Changing `chunk_limit`/pacing in config either retro-applies to stored oversized chunks or the docs/`/aw-index` report tell the operator `--rebuild` + `--sync` is required; `--rebuild` either embeds in the same pass or its output states it left the store keyword-only.

**S7 — Both suites, the root gate, and red-first sibling tests.**
> - [ ] `packages/agentic-workflow` bun+node suites and the root gate pass; new behaviour is covered by sibling tests (red-first).

## Impact

- `packages/agentic-workflow/src/doc/embeddings.mjs` — the write path. Gains the
  rejection branch (`isRejected`), the character-budget batch packing
  (`maxRequestChars`), the request-budget resolution, and a result that reports
  every skipped chunk; `makeOpenAIProvider` starts capturing the response body a
  failed call discarded.
- `packages/agentic-workflow/src/doc/retrieval.mjs` — the only caller of
  `embedPendingChunks`. Maps the result's rejections into the additive
  `store.rejected` record and the new degradation, prints the rejection line on
  the human path, resolves the effective chunk limit from the resolved provider,
  and makes `--rebuild` embed in the same pass.
- `packages/agentic-workflow/src/doc/config.mjs` — `provider.max_request_chars`
  (positive integer) and the `chunk_limit <= max_request_chars` refusal; the
  effective-chunk-limit helper both `--sync` and `--rebuild` read.
- `packages/agentic-workflow/src/doc/sync.mjs` — persists the effective chunk
  limit in the store's `meta` and folds it into the re-chunk predicate, so a
  configuration change retro-applies to stored chunks.
- `packages/agentic-workflow/src/doc/envelope.mjs` — the frozen degradation
  vocabulary accepts `embeddings-request-rejected`.
- `packages/agentic-workflow-schema/src/doc-envelope.ts` (new) +
  `src/index.ts` — the published `DOC_DEGRADATIONS` surface. The crate's runtime
  close stays in `envelope.mjs` (the `doc` path is the crate's cold path and
  must not require the schema package's `dist`); a sibling suite reads the
  published source and pins parity, the pattern
  `test/resolve-passes.test.mjs` already uses for `vocabularies.ts`.
- `packages/agentic-workflow/bin/agentic-workflow.mjs` — the human `doc` path
  prints the rejection diagnostic (status + body excerpt + the skipped chunks)
  before the degradation line.
- `packages/pi-agentic-workflow/src/extension/aw-index-command.ts` — the report
  renders the rejected set and the pending-remainder hint, from the envelope
  alone.
- `packages/agentic-workflow/README.md`, `packages/pi-agentic-workflow/README.md`
  — the `doc` degradation row, the chunk-limit and request-budget rows, the
  `--rebuild` semantics, the report line.
- Tests: `packages/agentic-workflow/test/doc.embed-rejection.test.mjs` (new),
  `test/doc.degradations.test.mjs` (new), plus the shared suites the change
  touches (`doc.embeddings`, `doc.envelope`, `doc.hybrid`, `doc.sync`,
  `doc.store`) and `packages/pi-agentic-workflow/test/aw-index-command.test.mjs`.

Consumers of the changed surface: `runDocOp` is the sole caller of
`embedPendingChunks` and `resolveEmbedConfig` (`rg -n 'embedPendingChunks'
packages --glob '!*.test.mjs'` reports `retrieval.mjs` only), the `doc` CLI case
is the sole caller of `runDocOp`, and `/aw-index` reads the sync envelope. No
config key is renamed; `provider.chunk_limit` keeps its meaning (a per-chunk
truncation limit) and gains a safe default *only* when a provider is configured.

**Named high-risk item** (tier classifier, verbatim): `destructive` —
`packages/agentic-workflow/bin/agentic-workflow.mjs` (the CLI's `doc --rebuild`
path reaches `rebuildIndex`'s `rmSync` over the store). Every mutating path this
change touches was exercised in `/tmp` fixtures only (§3/§4 live-tree guard); the
live store in `.agentic-workflow/` was never rebuilt, wiped or re-embedded.

## Retirements

- The `retrieval.mjs` catch-all "any thrown error ⇒
  `unavailable-embeddings-provider-down`" retires: a rejection is no longer a
  thrown error at all. Replacement: the result's `rejected` set, mapped to
  `embeddings-request-rejected`. The `unavailable-embeddings-provider-down`
  degradation stays, narrowed to its true cause (a retryable failure whose retry
  ladder is exhausted, or a non-HTTP error). `rg -c
  'unavailable-embeddings-provider-down' packages/agentic-workflow/src` → 1
  (`retrieval.mjs`'s narrowed comment + key), the query path's own use unchanged.
- The comment "Only add if not already present (the chunk-too-large degradation
  can coexist with provider-down)" retires with the catch it explains. Its
  replacement states the two independent causes.
- The `chunk-limit` README row's "default 0 = unlimited" retires: it is the
  default only on the keyword-only path. Replacement: the row names the
  configured-provider default and the reason.
- The `--rebuild` README narrative ("discard the cache and resync from scratch")
  keeps its meaning and gains "and embeds the pending chunks in the same pass".
- Nothing is deleted: no export, script or file is removed; every superseded
  item is a comment, a message, or a prose row. This unit is strictly additive
  on the normative layer except for the vocabulary close, which is why
  `## Retirements` carries no classifier receipt (no surface leaves the tree).

## Non-goals

- **No tokenizer.** The budget is measured in characters, not tokens: the crate
  is dependency-free and a tokenizer per provider model is not this unit's
  surface. `provider.max_request_chars` is the knob when a provider's ratio
  differs from the assumed 4 chars/token.
- **No chunk bisection.** A rejected batch is the unit of rejection: the pass
  does not guess which text inside it was refused. The character budget already
  isolates an oversized chunk into its own request, so the oversized case is
  precise without a bisect; auth/shape rejections are batch-wide by nature.
- **No change to the store format.** Skipped chunks stay `embedding is null`,
  exactly as the issue's rollback strategy states; nothing migrates.
- **No change to the query path's degradation set.** `queryIndex` keeps its own
  causes; this unit only stops `--sync` from reporting a rejection as
  provider-down.
- **No part of #541** (the NaN preset embed profile). The related issue shapes
  the preset-side values and is explicitly soft-ordered after this one.
- **No `chunk_limit` retro-apply by background pass.** The re-chunk happens on
  the next `--sync`/`--rebuild`; a sync is never spawned by a query.

## Risk tier

Computed, never chosen: `bun packages/agentic-workflow/bin/agentic-workflow.mjs
ceremony tier classify --paths "…"` (the change's paths) answered
`risk-tier-verdict@1` · `tier: high` · `reason_kind: named-high-risk` ·
`task_size: {understood: true, contained_risk: "named", resumable_from_diff:
true}` — signal `destructive` on `packages/agentic-workflow/bin/agentic-workflow.mjs`
(the `--rebuild` path). The verdict is copied here verbatim; the review pass it
owes is **not** run because §4 of the owner's apply workflow forbids running this
repository's review machinery on its own surgery — the disclosure is in
`## Log` (D4) and in the handoff.

- **Tier** — `high` · **Task Size** — `medium` (five source modules, one schema
  package surface, two suites, two READMEs)
- **Named high-risk item** — `destructive`: `packages/agentic-workflow/bin/agentic-workflow.mjs`

## Future

- 2026-11-14 — `#541` (NaN preset embed profile) was named by the owner as
  related and explicitly soft-ordered after this unit. Status: `open`. Not
  implemented, specced or tasked here.

## Future cost

- Every future provider-shaped limit (tokens, dimensions, per-request byte caps)
  must ride the same `provider.max_request_chars` family rather than a second
  knob list — binds the crate's `doc` config surface.
- Every new `doc` degradation value must land in
  `packages/agentic-workflow-schema/src/doc-envelope.ts` first and reach the
  runtime close through the parity suite — binds any author touching
  `envelope.mjs`.
- `--sync` and `--rebuild` must keep resolving their chunk limit through
  `effectiveChunkLimit()` — binds any future `doc` op that chunks.

## Applicable tests

- `packages/agentic-workflow/test/doc.embed-rejection.test.mjs` (new) — the
  frozen-failure corpus: a 400 mid-pass, the provider's status/body capture, the
  skipped-and-named chunks, the character budget, and the safe default.
- `packages/agentic-workflow/test/doc.degradations.test.mjs` (new) — the
  published vocabulary parities with the runtime close.
- `packages/agentic-workflow/test/doc.embeddings.test.mjs` — the write path's
  existing contract (pacing, retry, resume, pin, warm sync) stays green; the two
  cases that encoded the superseded "non-retryable throws" contract are re-cut
  to the new one (they assert strictly more: no throw, the rest embedded, the
  offender reported).
- `packages/agentic-workflow/test/doc.hybrid.test.mjs` — the sync envelope, the
  rejected record, the provider-down cause staying provider-down.
- `packages/agentic-workflow/test/doc.sync.test.mjs`,
  `test/doc.store.test.mjs` — the chunk-limit re-chunk predicate and the config
  validation.
- `packages/agentic-workflow/test/doc.envelope.test.mjs` — the closed
  vocabulary accepts the new value and still refuses unknown ones.
- `packages/pi-agentic-workflow/test/aw-index-command.test.mjs` — the report
  renders the rejected set and the hint.
- The root gate: `bun scripts/run-root-suite.mjs` and
  `bun scripts/local-gate.mjs --offline` (offline subset).

## Known pre-existing issues

- `unavailable-embeddings-<cause>` is an **open** family in the runtime close
  (`/^unavailable-embeddings-[a-z0-9]+(?:-[a-z0-9]+)*$/`), and
  `doc.envelope.test.mjs` pins that openness (`unavailable-embeddings-http-401`
  is accepted). Does **not** affect this unit: the new key is a top-level token
  (`embeddings-request-rejected`), so the family's openness neither hides it nor
  is narrowed by it. The published surface enumerates the concrete values.
- **`scripts/residual-classify.mjs` imports a module `main` no longer ships.**
  `edde336c refactor(352): retire the migrated runtimes from scripts/` moved the
  runner library to `packages/agentic-workflow/src/runner/lib.mjs` and deleted
  `scripts/ceremony/lib.mjs`, but `scripts/residual-classify.mjs:72` still reads
  `import { parseTasks } from "./ceremony/lib.mjs"`, so the whole suite dies on
  the module resolution (`20 fail` at `a83b9b38`, identical at HEAD).
  **Does not affect this unit** — nothing here imports the classifier; it blocks
  the root suite's `exits 0`, which is why O12 is reported open.
- **`AGENTS.md` machine-table lines were already off by one at the base commit.**
  `bun scripts/check-skill-context.mjs --documents` measured `135 != the declared
  134` at `a83b9b38`; the row this unit adds makes it 136. The exact re-pin
  absorbs both (+2 to `machineLines`, reason recorded in
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json`), so the pre-existing drift does
  **not** leave a red gate behind.
- **Timing-sensitive root suites on a slow host.** `scripts/red-first.mjs` takes
  ~7.8 s of git history here against the suite's 10 s per-test budget, and under
  the gate's parallel load `red-first`, `phase-lint` and `release` hit the
  budget. Each passes green when run alone; all three also fail in the base
  copy's run, so the flakiness is the host's, not this unit's.
- The `doc` path has no stderr channel inside `runDocOp` (it returns the
  envelope; the CLI prints). Affects this unit's S4: the diagnostic is built in
  the envelope (`store.rejected`) and rendered by the CLI's human path, which is
  the only place a stderr line belongs. No new global logger enters the crate.

## Acceptance criteria

- **AC-S1** — The unit is applied through the owner's local workflow: the
  planning ledgers are frozen in this folder before the implementation landed,
  and the work arrives as conventional commits. Check:
  `ls docs/fix/540-embedding-pass-batch-limit/` lists `SPEC.md`,
  `planning-evidence.md` and `planning-obligations.md`;
  `git log --oneline main..HEAD` shows the unit's own conventional commits.
- **AC-S2** — A non-retryable non-rate-limit failure during `embedPendingChunks`
  neither throws nor aborts the pass: the rejected batch's chunks stay pending,
  every other pending chunk is embedded, and the pass returns normally. Check:
  `cd packages/agentic-workflow && bun test test/doc.embed-rejection.test.mjs`
  exits 0 (the `S2` cases assert no rejection, `embedded` equal to the survivors,
  and the rejected rowids still `embedding is null`).
- **AC-S2a** — The result names every skipped chunk by `path` and `section`, and
  a chunk larger than the request budget is the only one its request drops.
  Check: the same suite's `S2a` cases (the named list equals the pending set of
  the rejected file, and an oversized chunk plus a normal chunk on the same run
  embeds the normal one).
- **AC-S3** — `embeddings-request-rejected` joins the frozen vocabulary, is
  published as `DOC_DEGRADATIONS` in
  `packages/agentic-workflow-schema/src/doc-envelope.ts`, and is the key a
  rejected sync declares — while `unavailable-embeddings-provider-down` keeps
  its own cause. Check: `bun test test/doc.degradations.test.mjs` exits 0 (every
  published value is accepted, an unpublished one is refused, and the two causes
  are distinct) and `cd packages/agentic-workflow-schema && bun run test` exits 0
  (the export is in the package's `index.ts` surface).
- **AC-S4** — The provider's HTTP status and body excerpt reach the operator:
  `store.rejected.failures[]` carries `{status, message}` (message containing the
  body excerpt) in the `--json-only` envelope, and the human `doc` path prints a
  `doc: rejection:` line naming the status and the skipped chunks. Check:
  `bun test test/doc/hybrid`-side cases in `test/doc.hybrid.test.mjs` exit 0 and
  `bun packages/agentic-workflow/bin/agentic-workflow.mjs doc --rebuild` in a
  `/tmp` fixture prints the line to stderr.
- **AC-S5** — With a provider configured and no explicit `chunk_limit`, the
  effective chunk limit is the request budget (`provider.max_request_chars`,
  default 90000) and no request carries more characters than that budget; an
  explicit `chunk_limit` above the budget is refused by name at config load.
  Check: `bun test test/doc.embed-rejection.test.mjs` (budget cases) and
  `bun test test/doc.store.test.mjs` (validation cases) exit 0; the crate README
  documents both keys.
- **AC-S6** — Changing the effective chunk limit re-chunks stored files on the
  next `--sync` (retro-apply, no `--rebuild` needed), and `--rebuild` embeds the
  pending chunks in the same pass, reporting `pending`, `model` and `embedded`.
  Check: `bun test test/doc.sync.test.mjs` (the limit-change re-chunk case) and
  the `--rebuild` cases in `test/doc.hybrid.test.mjs` exit 0.
- **AC-S7** — `packages/agentic-workflow` passes under both runtimes, the schema
  package suite passes, the pi package suite passes, and the root gate passes;
  every new behaviour's test was observed failing before its implementation
  landed (the `## Log` `E` lines carry both runs and both SHAs). Check:
  `cd packages/agentic-workflow && bun run test` exits 0,
  `cd packages/agentic-workflow && bun run test:node` exits 0,
  `cd packages/agentic-workflow-schema && bun run test` exits 0,
  `cd packages/pi-agentic-workflow && bun run test` exits 0,
  `bun scripts/run-root-suite.mjs` exits 0.

## Tasks

- P1 — Cut this unit doc and freeze the two planning ledgers in the repo's own
  shapes (9-column obligations, 6-column evidence), every row `planned` at cut.
  (validator: `rg -c '^\| O[0-9]+ \|' docs/fix/540-embedding-pass-batch-limit/planning-obligations.md` matches ≥8
  and `rg -n '^\| O[0-9]+ \|.*\| (planned|in-progress) \|$' docs/fix/540-embedding-pass-batch-limit/planning-obligations.md` matches every row)
  (Implements: S1)
  - Relevant files: docs/fix/540-embedding-pass-batch-limit/SPEC.md, planning-evidence.md, planning-obligations.md
- P2 — Land the frozen-failure reproducers as failing tests for slice A: the
  400-mid-pass skip, the provider status/body capture, the named rejections, and
  the vocabulary parity; observe them red.
  (validator: `cd packages/agentic-workflow && bun test test/doc.embed-rejection.test.mjs test/doc.degradations.test.mjs` exits 1)
  (Implements: S2, S2a, S3, S4)
  - Relevant files: packages/agentic-workflow/test/doc.embed-rejection.test.mjs, packages/agentic-workflow/test/doc.degradations.test.mjs
- P3 — Implement slice A: `isRejected` + the skip-and-report result in
  `embeddings.mjs`, the response-body capture in `makeOpenAIProvider`, the
  published `DOC_DEGRADATIONS` surface, the runtime close, and the sync
  envelope's `store.rejected` + durably narrowed provider-down comment.
  (validator: `cd packages/agentic-workflow && bun test test/doc.embed-rejection.test.mjs test/doc.degradations.test.mjs` exits 0, and `cd packages/agentic-workflow-schema && bun run test` exits 0)
  (Implements: S2, S2a, S3, S4)
  - Relevant files: packages/agentic-workflow/src/doc/embeddings.mjs, retrieval.mjs, envelope.mjs, packages/agentic-workflow-schema/src/doc-envelope.ts, src/index.ts
- P4 — Land the failing tests for slice B: the request-budget packing, the safe
  configured-provider chunk limit, the config refusal, the retro-applied
  re-chunk and `--rebuild` embedding.
  (validator: `cd packages/agentic-workflow && bun test test/doc.store.test.mjs test/doc.sync.test.mjs` exits 1 on the new cases before the implementation)
  (Implements: S5, S6)
  - Relevant files: packages/agentic-workflow/test/doc.store.test.mjs, packages/agentic-workflow/test/doc.sync.test.mjs, packages/agentic-workflow/test/doc.hybrid.test.mjs
- P5 — Implement slice B: `resolveRequestChars` + budget packing in the write
  path, `provider.max_request_chars` and the `chunk_limit` refusal in
  `config.mjs`, `effectiveChunkLimit()` read by both ops, the chunk-limit meta
  predicate in `syncIndex`, and `--rebuild` embedding in the same pass.
  (validator: `cd packages/agentic-workflow && bun test test/doc` exits 0)
  (Implements: S5, S6)
  - Relevant files: packages/agentic-workflow/src/doc/embeddings.mjs, config.mjs, sync.mjs, retrieval.mjs
- P6 — Ship the documentation surfaces: the crate README (degradation row,
  chunk-limit default, request budget, `--rebuild` embedding), the pi README and
  the `/aw-index` report line, the roadmap fix row, the rendered projection and
  the session journal entry.
  (validator: `bun test packages/pi-agentic-workflow/test/aw-index-command.test.mjs` exits 0 and `bun scripts/docs-generate.mjs --check` exits 0)
  (Implements: S5, S6)
  - Relevant files: packages/agentic-workflow/README.md, packages/pi-agentic-workflow/README.md, packages/pi-agentic-workflow/src/extension/aw-index-command.ts, docs/ROADMAP.md, docs/LOGS.md
- P7 — Verify: both crate runtimes, the schema and pi suites, the root suite and
  the offline local gate in the foreground.
  (validator: `bun scripts/local-gate.mjs --offline` exits 0 and `bun scripts/run-root-suite.mjs` exits 0)
  (Implements: S7)
  - Relevant files: scripts/local-gate.mjs, scripts/run-root-suite.mjs

### Planning evidence

Frozen in [`planning-evidence.md`](planning-evidence.md) — M sizing keeps the
ledger in its sibling file, never embedded here.

### Obligations

Frozen in [`planning-obligations.md`](planning-obligations.md) — M sizing keeps
the ledger in its sibling file, never embedded here.

## Triaged steps

n/a — applied inline per the owner's instruction (§4): the §5 ledger freeze
substitutes for the lane's plan step, and no repo machinery runs on this
surgery. The `## Tasks` list above is the ordered step list this unit executes.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-14, the request, verbatim:
  ```
  Apply to this repository: issue #540
  ```
- **L2** — 2026-11-14, the issue's acceptance criteria and expected behaviour,
  verbatim:
  ```
  ### Expected behaviour

  - A non-retryable input-validation failure (4xx that is not rate limiting) aborts only the offending batch's future, is declared with its own degradation key (e.g. an `embeddings-request-rejected` cause distinct from provider-down), and the underlying status/body is surfaced somewhere the operator can read (stderr line and/or an envelope field).
  - The embed pass skips the offending chunks and continues (or fails safe with an actionable message naming the file/chunk), so one oversized chunk cannot prevent the other ~10K chunks from embedding.
  - With a provider configured, the default `chunk_limit` cannot produce a request the provider must reject (a safe default or a config-validation refusal).

  ### Acceptance criteria

  - [ ] A deterministic 400 (or any non-retryable non-rate-limit failure) during `embedPendingChunks` does not abort the pass: the offending chunks are skipped, the rest embed, and the run is diagnosable.
  - [ ] A dedicated degradation key distinguishes "provider rejected the request (input/shape)" from `unavailable-embeddings-provider-down`; the frozen degradation vocabulary and its schema-package surface are updated in the same change.
  - [ ] The real provider status/body for the failure is visible to the operator (stderr and/or envelope).
  - [ ] With a provider configured and no explicit `chunk_limit`, a sync cannot emit a batch the provider must reject: safe default and/or config validation, documented in the crate README.
  - [ ] Changing `chunk_limit`/pacing in config either retro-applies to stored oversized chunks or the docs/`/aw-index` report tell the operator `--rebuild` + `--sync` is required; `--rebuild` either embeds in the same pass or its output states it left the store keyword-only.
  - [ ] `packages/agentic-workflow` bun+node suites and the root gate pass; new behaviour is covered by sibling tests (red-first).
  ```
- **D1** — 2026-11-14, decision: `embeddings-request-rejected` is a **top-level**
  frozen token, not a member of the `unavailable-embeddings-<cause>` family. The
  `unavailable-` prefix means "the layer is missing or unreachable"
  (`not-configured`, `not-indexed`, `provider-down`); a rejection means the layer
  is up and refused the *request*. Keeping the distinction in the token is what
  makes the envelope self-diagnosing (S3).
- **D2** — 2026-11-14, decision: the published vocabulary surface is
  `packages/agentic-workflow-schema/src/doc-envelope.ts` (`DOC_DEGRADATIONS`),
  consumed by test-time parity, not by a runtime import. The `doc` path is the
  crate's cold path (no build step, lazily loaded typebox); importing
  `@gtrabanco/agentic-workflow-schema`'s `dist` there would make `doc` depend on a
  build, which the crate's README promises it does not have.
- **D3** — 2026-11-14, decision: the request budget is measured in characters
  (`provider.max_request_chars`, default 90000 ≈ 22.5K tokens at 4 chars/token,
  under the provider's 32768-token input cap), and when a provider is configured
  with no explicit `chunk_limit` the effective per-chunk limit **is** that
  budget — so no chunk can exceed a request and the budget bounds the batch. The
  keyword-only path keeps `0 = unlimited` (fix #495 semantics unchanged there).
- **E1** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.embed-rejection.test.mjs test/doc.degradations.test.mjs` · exit 1 · `6 pass · 10 fail` at `a83b9b38` — the write path still aborts on a 400, the provider error still discards the body, the runtime close refuses `embeddings-request-rejected`, and `src/doc-envelope.ts` does not exist yet.
- **E2** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.store.test.mjs` · exit 1 · 1 error: `Export named 'DEFAULT_MAX_REQUEST_CHARS' not found in module 'src/doc/config.mjs'` (S5's surface absent).
- **E3** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.sync.test.mjs` · exit 1 · `10 pass · 1 fail`: a lowered `maxChunkChars` leaves the stored 401-char chunk untouched (S6's retro-apply absent).
- **E4** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.hybrid.test.mjs` · exit 1 · `24 pass · 3 fail`: no `embeddings-request-rejected`, no `store.rejected`, and `--rebuild` embeds nothing and declares nothing.
- **E5** — 2026-11-14, baseline before this unit: `cd packages/agentic-workflow && bun run test` · exit 0 · `697 pass · 0 fail · 39 files · 113.85s` at `a83b9b38` (PE-015).
- **D4** — 2026-11-14, decision: the review pass the computed `high` tier owes is
  not run. §4 of the owner's apply workflow forbids `review-change`/`audit-pr` on
  this repository's own surgery; the deterministic gates run anyway, and the
  owner is the external verifier. Disclosed in the handoff, never silently
  skipped.

- **E6** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.embed-rejection.test.mjs test/doc.degradations.test.mjs test/doc.sync.test.mjs` · exit 0 · `20 pass · 0 fail` (write-path S2/S2a/S4/S5 + the vocabulary parity + the limit retro-apply) after `c59b3374`.
- **E7** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.store.test.mjs test/doc.hybrid.test.mjs` · exit 0 · `54 pass · 0 fail` (config budget/validation, the sync rejection envelope, `--rebuild` embedding and the keyword-only declaration).
- **E8** — 2026-11-14, `cd packages/agentic-workflow && bun test test/doc.embeddings.test.mjs` · exit 0 · `25 pass · 0 fail` — the two re-cut cases (S9 resume on an exhausted retryable ladder; S3 401 never retried and never aborting) plus the unchanged pacing/retry/`Retry-After`/pin cases.
- **E9** — 2026-11-14, differential against a base-commit copy in `mktemp -d` (`git archive a83b9b38`), same toy project, no provider: `doc --sync --json-only`, `--status`, `--query`, and the human `--sync` path are byte-identical in stdout, stderr and exit code; `--rebuild --json-only` differs only by the intended `degradations: ["unavailable-embeddings-not-configured"]` plus `store.{pending, model, embedded}`.
- **E10** — 2026-11-14, the frozen failure end-to-end against a provider double (`400` on the batch carrying a `POISON` file), same toy project: base `degradations: ["unavailable-embeddings-provider-down"] · embedded: 0 · pending: 2`; this change `degradations: ["embeddings-request-rejected"] · embedded: 3 · pending: 1 · store.rejected = {count: 1, failures: [{status: 400, message: "embeddings provider 400 Bad Request: {…context length exceeded…}"}], chunks: ["m.md#M"]}`, and the human path prints `doc: rejection: 400 …` + `doc: skipped: m.md#M`.
- **E11** — 2026-11-14, the same double refusing requests above 100,000 chars with a 200,000-char chunk and **no** `provider.chunk_limit` in the config: base aborts (`unavailable-embeddings-provider-down`, `embedded: 0`); this change chunks to the 90,000-char budget, embeds everything and declares `chunk-too-large` (`embedded: 2 · pending: 0`).
- **G1** — 2026-11-14, `cd packages/agentic-workflow && bun run test` · exit 0 · `726 pass · 0 fail · 41 files`.
- **G2** — 2026-11-14, `cd packages/agentic-workflow && bun run test:node` · exit 0 · `727 pass · 0 fail`.
- **G3** — 2026-11-14, `cd packages/agentic-workflow-schema && bun run test` · exit 0 · `851 pass · 0 fail · 48 files`.
- **G4** — 2026-11-14, `cd packages/pi-agentic-workflow && bun run test` · exit 0 · `866 pass · 0 fail · 77 files` (including the two new report cases).
- **G5** — 2026-11-14, `bun scripts/run-root-suite.mjs` · **exit 1** · `1 fail`: `scripts/residual-classify.test.mjs` (`Cannot find module './ceremony/lib.mjs'`), the pre-existing breakage recorded under `## Known pre-existing issues`. The same command at the base commit exits 1 with that suite **and seven more**; this change adds no failure and fixes six of them (`check-skill-context`, `correction-budget`, `doc-discipline`, `lint-changeset`, `local-gate`, `unit-route` — the base copy's own extract/git context, all green here).
- **G6** — 2026-11-14, `bun scripts/docs-generate.mjs --check` · exit 0 · `verdict: PASS` (projection and roadmap re-rendered by the emitter, never hand-written).
- **G7** — 2026-11-14, `bun scripts/local-gate.mjs --skip-network --no-bail` · **exit 1** · `FAILED root-suite` (the same `residual-classify` import error; `schema-node-compat` skipped as its dependent). Every other offline step passed: `docs-generated-projection`, `version-parity-content`, `journal-carrier-check`, `log-immutability`, `temp-hygiene`, `tmp-gc`, `worktree-guard`, `crate-suite-bun`, `crate-suite-node`.
- **P1** — 2026-11-14, unit doc cut and both planning ledgers frozen (12 obligations, 19 evidence rows) before the first line of code · `a30fd160`'s parent.
- **P2** — 2026-11-14, the frozen reproducers landed and were observed red (E1–E4) · `a30fd160`.
- **P3, P5** — 2026-11-14, the write path, the vocabulary surface, the request budget, the safe chunk-limit default, the retro-applied re-chunk and `--rebuild` embedding landed; E6–E11 green · `c59b3374`.
- **P6** — 2026-11-14, the docs/state surfaces: crate + pi READMEs, the `/aw-index` report, the gate-inventory claim, the budget re-pin, the emitter's roadmap/projection output, the changeset and this entry.
- **D5** — 2026-11-14, decision: the `AGENTS.md` machine-table re-pin lands here at 136 and absorbs the base commit's own `135 != 134` drift, with the reason in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`; the alternative (re-pinning 135 and shipping a red budget check) would have hidden the drift behind a raised ceiling nobody measured.
- **D6** — 2026-11-14, decision: O12 stays **open** rather than flipped. Its validator (`bun scripts/run-root-suite.mjs` exits 0) cannot reproduce because of a pre-existing import error on `main` that is not this unit's to repair; the evidence (G5, G7, base-vs-head FAIL-set diff) is recorded and the owner decides whether the one-line repair belongs here.

## Next

The owner's decision on O12: repair `main`'s one-line stale import
(`scripts/residual-classify.mjs:72` → `import { parseTasks } from
"../packages/agentic-workflow/src/runner/lib.mjs"`) inside this unit, or accept
the pre-existing root-suite red and close O12 as `n/a` with that evidence. Every
other obligation is `verified` on a foreground run.

## References

Issue [#540](https://github.com/gtrabanco/agentic-workflow/issues/540); related
soft: [#541](https://github.com/gtrabanco/agentic-workflow/issues/541) (NaN preset
embed profile, ordered after this one); predecessors
[#443](https://github.com/gtrabanco/agentic-workflow/issues/443) (retry ladder,
`docs/fix/443-doc-index-auto-hybrid/`) and
[#495](https://github.com/gtrabanco/agentic-workflow/issues/495)
(`provider.chunk_limit`, `docs/fix/495-doc-store-sharing-and-chunk-limit/`).
Roadmap row: `## Fixes` in [`docs/ROADMAP.md`](../../ROADMAP.md).

## Branch

`fix/540-embedding-pass-batch-limit`

## Depends on

None — `## Dependencies` on the issue records no blocker; #541 is related and
soft-ordered after this unit.

## Regression scope

| Scenario | Verifier |
|---|---|
| Keyword-only path (no provider configured) still syncs, answers queries offline and declares `unavailable-embeddings-not-configured` — `chunk_limit` stays unlimited there | `cd packages/agentic-workflow && bun test test/doc.query.test.mjs test/doc.hybrid.test.mjs` exits 0 |
| A retryable failure (429/5xx/network) keeps its retry ladder, and an exhausted retryable ladder still aborts the pass with `unavailable-embeddings-provider-down` | `bun test test/doc.embeddings.test.mjs` exits 0 (the `S3` retry, backoff, `Retry-After` and pin cases) |
| A warm store makes 0 API calls, and a changed file re-embeds only that file's chunks | `bun test test/doc.embeddings.test.mjs` exits 0 (`AC19`, `AC16` cases) |
| The model-mismatch fail-closed rule is unchanged (no cross-model store, `--rebuild` is the escape) | `bun test test/doc.embeddings.test.mjs test/doc.hybrid.test.mjs` exits 0 |
| `--rebuild` still wipes the store and re-chunks from scratch, and still reaps deletions | `bun test test/doc.sync.test.mjs` exits 0 |
| The `doc` envelope's key order, the closed degradation vocabulary and the refusal of unknown values are unchanged | `bun test test/doc.envelope.test.mjs` exits 0 |
| `/aw-index` still renders a report for an envelope carrying no rejected set (an older runner) | `bun test packages/pi-agentic-workflow/test/aw-index-command.test.mjs` exits 0 |
