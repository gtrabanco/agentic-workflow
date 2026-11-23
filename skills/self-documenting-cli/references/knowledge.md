# Knowledge — the documentation index and the corpora

Two different stores answer two different questions: `doc` indexes the project's
**documents** for retrieval, and the corpus readers derive **findings and
patterns** from what the workflow already wrote down.

**Flag spelling is not here.** It is `agentic-workflow help <subcommand>`.

## The retrieval index (`doc`)

The index is a derived SQLite store, gitignored, freshness-checked on every
query. The one behaviour worth knowing before you touch it:

- **The query mode resolves itself.** An absent `--mode` resolves at query time
  to hybrid when a provider is configured and the store carries chunks embedded
  under the pinned model, and to keyword with a declared cause otherwise. An
  explicit mode always wins. **Do not set `--mode hybrid` "to be safe"** — that
  was the workaround this behaviour replaced.

Degradations are declared, never silent: `unavailable-embeddings-not-configured`,
`unavailable-embeddings-not-indexed`, `embeddings-model-mismatch`,
`unavailable-embeddings-provider-down`, and `embeddings-request-rejected` when
the provider refuses a request rather than being unreachable. A degradation means
the answer is keyword-based; it does not mean the query failed.

`doc --sync` is incremental; `--rebuild` re-chunks from scratch. Discovery only —
**no gate reads the index**, so a stale index never blocks a delivery.

## Reading one document section

`doc read` prints a located section's original bytes; `doc edit` splices one body
source over it. Both go through the same locator as `section`, so a selector that
resolves to nothing or to several sections is refused rather than guessed. The
reference is a D5 id, a bare slug, or the exact heading title — a path-qualified
id needs a real path.

## The corpora

- **`findings-corpus`** — the unit docs' findings and log marks joined into one
  corpus, so a recurring class can be attributed to the phase that should have
  caught it. It is the reader the coverage and regression gates build on.
- **`journal-corpus`** — the session journal's entries joined into the corpus the
  audit's journal dimension reads.
- **`repository-state`** — the frozen state document. It answers what is frozen
  and which facts a later decision may not silently move. **Only the resolver
  may replace it**; everything else reads it through this command.

## The pattern

These commands read what the workflow already wrote down. When you are about to
claim "this class keeps recurring" or "nothing covers this", the claim is a
corpus read — run it, quote the receipt. An impression of recurrence is not the
same thing as a corpus row.
