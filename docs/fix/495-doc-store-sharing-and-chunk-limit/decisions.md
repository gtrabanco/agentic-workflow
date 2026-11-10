# 470 — doc store sharing and chunk limit · decisions

Owner-scoped decisions for this unit. Append-only.

## Decisions

**Decision D1 (recorded at cut).** Chunk size limit: **truncate oversized
chunks automatically** (per the owner's 2026-11-09 follow-up, L2) rather than
skip or split them. A truncated chunk keeps its heading, its id and its line
range, so the FTS5 keyword index still finds it; only the tail of the body is
lost. Splitting an ATX section is non-trivial (where to cut a contiguous block?)
and skipping loses the section entirely. Truncation is the pragmatic middle.

**Decision D2 (recorded at cut).** The repo ID is `git rev-parse
HEAD^{commit}` — the commit object SHA. It is 40 hex chars, stable across
worktrees, renames and clones of the same repo (the commit object is
path-independent), and differs across branches because the HEAD commit
differs — which is the correct behavior: branches at the same point share the
same index; divergent branches build their own. Returns `null` when git is
unavailable and the caller falls back to the local store path.

**Decision D3 (recorded at cut).** The shared store path is
`<base>/agentic-workflow/<repoId>/index.db`, where `<base>` defaults to
`$XDG_DATA_HOME` on Unix, `$HOME/.local/share` as fallback, and the configured
`store.share.base_dir` overrides both. The shared store lives outside the repo
by design.

**Decision D4 (recorded at cut).** The config version stays 1. The new keys
(`store.share`, `provider.chunk_limit`, `index.excludes`) are additive:
existing configs without them behave identically. `containStorePath` skips the
F36/F37 containment check exactly when `store.share.enabled` is true — the
shared store is explicitly placed outside the repo, so containment does not
apply; the skip is config-driven, never silent.

**Decision D5 (recorded at cut).** The degradation vocabulary gains exactly one
value: `chunk-too-large`, emitted when the sync truncated at least one chunk.
`unavailable-embeddings-provider-down` stays reserved for genuine provider
failures. The vocabulary remains closed and unknown values are still refused at
construction.

**Decision D6 (recorded at cut).** File exclusion is prefix-based at the
manifest level: a tracked file whose repo-relative path starts with any
exclusion prefix leaves the corpus. Defaults are `.agentic-workflow/` and
`node_modules/` (the latter for target projects that track markdown inside a
vendored tree). An explicit `index.excludes` array **replaces** the defaults
entirely — the caller re-lists the default prefixes if it wants them — and an
explicit `null` restores the defaults. `CHUNKER_VERSION` is bumped so existing
stores rescan and the removed files' chunks are reaped (AC11).
