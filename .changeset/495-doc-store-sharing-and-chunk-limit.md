---
"@gtrabanco/agentic-workflow": minor
---

feat: doc index — auto-truncating chunk limit, exclusion prefixes, and worktree-shared store (issue #495)

Three interrelated improvements to the `doc` retrieval index:

**Chunk auto-truncation.** `index.json` gains `provider.chunk_limit` (a positive
integer: the maximum body length in characters per chunk). Chunk bodies
exceeding the limit are **automatically truncated** — never skipped — so the
chunk stays in the FTS5 index under its own heading and line range; only the
tail of the body is lost. A sync that shortened at least one chunk declares the
new `chunk-too-large` degradation (the closed vocabulary gains exactly one
value). Default: 0 = unlimited (existing behavior). This fixes the live failure
mode where a 150k-char section (a huge review-findings table) made the provider
answer 400 `context_length_exceeded`, which the retry ladder does not retry,
and the whole pass degraded as a misleading `unavailable-embeddings-provider-down`
with 0 embedded chunks.

**Exclusion prefixes.** `collectManifest` filters tracked files whose
repo-relative path starts with any exclusion prefix. The shipped defaults are
`.agentic-workflow/` (the store, the journal fragments and every runtime
artifact leave the corpus) and `node_modules/`. `index.json` gains
`index.excludes`: an explicit array **replaces** the defaults entirely (the
caller re-lists the default prefixes if it wants them) and `null` restores
them. The chunker version is bumped so existing stores rescan and the excluded
files' chunks are reaped.

**Worktree-shared store.** `index.json` gains `store.share`
(`{enabled: boolean, base_dir?: string}`). When enabled, the store resolves to
a dedicated file under `<base>/agentic-workflow/<repoId>/` — a user-level
directory identified
by the repository's commit-object SHA (`git rev-parse HEAD^{commit}`, stable
across worktrees, renames and clones of the same repo) — so worktrees of the
same repository share one index instead of each building its own from scratch.
`<base>` defaults to the XDG data directory (`$XDG_DATA_HOME`, else
`$HOME/.local/share`); a configured `base_dir` overrides it. The F36/F37
containment check is skipped in this mode only (the shared store is explicitly
placed outside the repo by design).
