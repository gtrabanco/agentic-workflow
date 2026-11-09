---
# type: fix | scope: medium | ac-hash: written after the ## Acceptance criteria section is frozen
---

# fix/495-doc-store-sharing-and-chunk-limit

> Fix specification — one single unit document.

```text
doc-provenance@1
written_by: agentic-workflow@4.11.0
schema: @gtrabanco/agentic-workflow-schema@4.11.0
format: unit-doc@2
grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
```

## Issue

`#495` — Two interrelated defects in the `doc` retrieval index (unit 65, P6/P4).

**S1 — Chunks that exceed the embedding model's context window are silently lost.**
> Chunks larger than the model's context window (e.g., `qwen3-embedding` has a 32,768-token limit) cause a 400 `context_length_exceeded` from the provider. The `isRetryable()` function only retries 408/429/5xx, so the 400 is not retried, the exception bubbles up, and the catch in `retrieval.mjs` surfaces `unavailable-embeddings-provider-down`. The result is 0 embedded chunks and a misleading degradation label. Real root cause: no chunk-size guard exists in the chunker, and no 400 context_length_exceeded detection exists in the retry policy.

**S2 — Each worktree rebuilds the entire index because the store lives under a gitignored directory.**
> The store (`index.db`) lives under `.agentic-workflow/index/`, which is gitignored (F37/F38). Every worktree of the same repository creates its own store from scratch — `--sync` chunks everything, then the embeddings pass re-embeds everything if a provider is configured. This wastes API tokens, time, and disk space. The user expects worktrees of the same repository to share the same index, since the index is a derived cache over git.

**S3 — The store path should be configurable, with an opt-in shared mode.**
> A project should be able to declare a shared index path (for worktree sharing) or keep the local default. The shared mode uses the repository's unique identity (git object-level, not directory-name-level) to locate the shared store.

**S4 — `--sync` should truncate oversized chunks automatically and skip irrelevant paths.**
> `doc --sync` should truncate oversized chunks automatically (not skip them — a truncated chunk is still searchable), and should exclude irrelevant paths like `.agentic-workflow/journal` from the index by default. If the user wants to add more exclusions manually, they should be able to via the config file.

## Impact

- **The config surface** (`index.json`): adds optional keys — `provider.chunk_limit` (max chars per chunk, default 0 = unlimited), `store.share` (`{enabled, base_dir?}` for the worktree-shared mode) and `index.excludes` (array of path prefixes, default `.agentic-workflow/` + `node_modules/`).
- **The chunker** (`chunks.mjs`): gains a `maxChunkChars` parameter; chunks exceeding the limit are automatically truncated (never skipped).
- **The manifest** (`manifest.mjs`): gains `repoId()` — the commit-object SHA used for the shared store — and exclusion filtering in `collectManifest` (`DEFAULT_EXCLUSIONS` export).
- **The store path resolver** (`store.mjs`): gains the shared-mode path resolution (`$XDG_DATA_HOME/agentic-workflow/<repoId>/index.db`).
- **Config validation** (`config.mjs`): validates the new keys and rejects invalid shapes (exit 1).
- **The envelope**: the degradation vocabulary gains `chunk-too-large` (closed set, one new value).
- **Tests**: chunk truncation cases, exclusion filtering, config validation.
- **Docs**: README grammar block updated for the new config keys and degradation.

## Retirements

- The `unavailable-embeddings-provider-down` label is never used for context_length_exceeded caused by oversized local chunks: `chunk-too-large` takes that specific cause, while `unavailable-embeddings-provider-down` remains for genuine network/provider failures.

## Non-goals

- No change to the `--query` path (read-only).
- No chunk splitting — truncation is the documented behavior (D1).
- No change to the existing git-hooks behavior.
- No worktree detection (the sharing is purely config-driven).

## Risk tier

- **Tier** — `standard` · **Task Size** — `understood + contained + resumable`
- **Named high-risk item** — `none — not a high-tier unit`

## Future

- The chunk-splitting path could be implemented in a follow-up if truncation is too aggressive for users.

## Future cost

- The `store.share` config adds an opt-in decision surface: projects that enable it share the index across all worktrees and clones of the same repo.
- `index.excludes` is a closed-by-default surface: an explicit array replaces the defaults entirely (the caller must re-list the default patterns if they want them).

## Applicable tests

`cd packages/agentic-workflow && bun test test/doc` (all retrieval suites).

## Known pre-existing issues

- Environment reds in the pi suite (`conductor-sensor.test.mjs`): pre-existing, documented, not affected by this unit.
- The `doc` tests run under bun in this environment (no `node` binary on PATH).

## Acceptance criteria

- **AC-S1** — Chunks exceeding the configured limit are truncated automatically, the sync exits 0, and the degraded chunks remain searchable via FTS5 keyword (the truncated body is indexed). Check: the truncation tests in `doc.chunks.test.mjs` exit 0 and a `chunk-too-large` degradation is emitted when `truncated > 0`.
- **AC-S2** — Worktrees of the same repo share the same index when `store.share.enabled` is true. Check: `storePath(root1) === storePath(root2)` when both worktrees have `store.share.enabled: true` and resolve the same repo ID.
- **AC-S3** — The config accepts the new keys and rejects invalid shapes. Check: `loadConfig` accepts valid `store.share`, `provider.chunk_limit` and `index.excludes`; rejects non-boolean `enabled`, non-string `base_dir`, non-positive `chunk_limit`, and a non-array/non-null `excludes`.
- **AC-S4** — Irrelevant paths (`.agentic-workflow/`, `node_modules/`) are excluded from the index by default, and the user can add more via `index.excludes`. Check: the exclusion tests exit 0; the live repo's `doc --sync` no longer scans `.agentic-workflow/journal` fragments.
- **AC-S5** — All existing retrieval suites pass. Check: `bun test test/doc` exits 0.
- **AC-S6** — The new surfaces are documented in the README's grammar block. Check: `doc-retrieval@1` includes the new config keys and the `chunk-too-large` degradation.

## Tasks

- P1 — Freeze the planning ledgers: this document, the evidence ledger, the obligations ledger and `decisions.md` (validator: `ls docs/fix/495-doc-store-sharing-and-chunk-limit/` lists the four documents)
  (Implements: S1, S2, S3, S4)
  Relevant files: docs/fix/495-doc-store-sharing-and-chunk-limit/, docs/ROADMAP.md
- P2 — Repo ID: implement `repoId()` in manifest.mjs; shared store path resolution in store.mjs; config validation for `store.share` and `provider.chunk_limit` (validator: `cd packages/agentic-workflow && bun test test/doc` exits 0)
  (Implements: S2, S3)
  Relevant files: packages/agentic-workflow/src/doc/manifest.mjs, packages/agentic-workflow/src/doc/store.mjs, packages/agentic-workflow/src/doc/config.mjs
- P3 — Chunk auto-truncation (D20): `scanChunks` truncates oversized bodies to `maxChunkChars` and returns `{chunks, truncated}`; sync/retrieval wire the config's `provider.chunk_limit` through and declare `chunk-too-large` (validator: `cd packages/agentic-workflow && bun test test/doc.chunks.test.mjs` exits 0)
  (Implements: S1, S4)
  Relevant files: packages/agentic-workflow/src/doc/chunks.mjs, packages/agentic-workflow/src/doc/sync.mjs, packages/agentic-workflow/src/doc/retrieval.mjs, packages/agentic-workflow/src/doc/envelope.mjs
- P4 — File exclusion (D21): `collectManifest` filters by prefix exclusions (`DEFAULT_EXCLUSIONS` = `.agentic-workflow/`, `node_modules/`); the config's `index.excludes` overrides; `CHUNKER_VERSION` bumped so stale stores rescan (validator: `cd packages/agentic-workflow && bun test test/doc` exits 0)
  (Implements: S4)
  Relevant files: packages/agentic-workflow/src/doc/manifest.mjs, packages/agentic-workflow/src/doc/sync.mjs, packages/agentic-workflow/src/doc/config.mjs
- P5 — Tests: update `doc.chunks.test.mjs` (truncation cases) and `doc.structure.test.mjs` (new `scanChunks` return shape); config validation covered by `doc.store.test.mjs` (validator: `cd packages/agentic-workflow && bun test test/doc` exits 0)
  (Implements: S1, S3, S4, S5)
  Relevant files: packages/agentic-workflow/test/doc.chunks.test.mjs, packages/agentic-workflow/test/doc.structure.test.mjs
- P6 — Docs and state: README grammar block, changeset intent, roadmap row, unit-doc provenance stamp (validator: `bun test scripts/normative-drift.test.mjs` exits 0)
  (Implements: S6)
  Relevant files: packages/agentic-workflow/README.md, .changeset/, docs/ROADMAP.md

## Path protection

```text
path-protection-plan@1
freeze-after: P5
kind | path | justification
created | packages/agentic-workflow/test/doc.chunks.test.mjs | the chunker's own suite; gains the D20 truncation cases
not-created | packages/agentic-workflow/test/doc.envelope.test.mjs | no envelope shape change — the degradation vocabulary gains one pattern, asserted by the existing construction-time refusal
not-created | packages/agentic-workflow/test/doc.query.test.mjs | read path is unchanged (non-goal)
```

## Triaged steps

n/a — applied inline per the owner's instruction.

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-11-09, the request, verbatim:
  ```
  Reportalo como fix unit, reporta también lo de los worktrees, deberían usar la ruta original ya que .agentic-workflow tiene los archivos de indexación en el .gitignore y por tanto habría que crear un nuevo indice por cada worktree lo cual no es ni rentable, ni práctico, ni lo esperado. Eso o crear el index en $HOME/.agentic-workflow/<project-name>/* o algo así, pero hay que asegurarse que el nombre de proyecto es inferible y siempre igual para un mismo repositorio... El directorio debe ser configurable por cada proyecto en el archivo agentic-workflow.json así un proyecto puede tenerlo con .gitignore en el mismo directorio del proyecto, por ejemplo si no van a trabajar con worktrees...
  ```
- **L2** — 2026-11-09, the follow-up request, verbatim:
  ```
  `bunx @gtrabanco/agentic-workflow@canary doc --sync` debería de truncar automaticamente los ficheros, además hay que agregarle rutas que sean totalmente irrelevantes como .agentic-workflow/journal y si el usuario quiere añadir más manualmente debería poder vía archivo de configuración
  ```
- **E1** — 2026-11-09, measured probe of the live store: chunks of 149,963 chars (`docs/features/37-phase-lint-script/review-findings.md`) and 124,039 chars (`docs/ROADMAP.md`) exceed the `qwen3-embedding` 32,768-token context; the provider answers 400 `context_length_exceeded`; `isRetryable()` does not retry 4xx, so the pass degrades as `unavailable-embeddings-provider-down` with 0 embedded.

## Next

Open the PR and get external verification.

## References

- Issue [#470](https://github.com/gtrabanco/agentic-workflow/issues/470) — the request.
- `docs/fix/443-doc-index-auto-hybrid/` — the resilience work this unit extends.
- `docs/features/65-doc-toolchain/` — the retrieval index.

## Branch

`fix/495-doc-store-sharing-and-chunk-limit`

## Depends on

none — feature 65 and fix #443 are merged.

## Regression scope

- The keyword query core, freshness, incremental sync, deletions, determinism, offline, vector encoding, model mismatch, warm sync, pacing, retry, resume — verified by `cd packages/agentic-workflow && bun test test/doc` exiting 0.