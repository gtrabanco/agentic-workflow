---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(443): auto-hybrid queries, resilient sync embedding and the native `/aw-index` command

The retrieval index paid for vectors the read path never used and could not
survive a rate limit, so this change moves the decision to where the state is:

- `doc --query` without `--mode` resolves the mode at query time — hybrid when a
  provider is configured and the store holds chunks embedded under the pinned
  model, keyword with the exact declared cause otherwise
  (`unavailable-embeddings-not-configured`, `unavailable-embeddings-not-indexed`,
  `embeddings-model-mismatch`, `unavailable-embeddings-provider-down`). An
  explicit `--mode` always wins, and the query path stays read-only: the inline
  freshness sync chunks new files and never calls the provider.
- `doc --sync` embeds pending chunks with pacing and retry: at most
  `batchSize` texts per request, request starts paced at `requestsPerMinute`,
  retryable failures retried with bounded backoff honouring `Retry-After`, and
  the store pinned by the first landed batch. All five parameters resolve from
  `index.json` `provider.pacing` or `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_<PARAM>`
  with the provider's own limits as defaults. A run killed part-way resumes from
  the store's pending set, never re-embedding what landed.
- The sync envelope publishes `store.pending` and `store.model` inside its open
  `store` record (no new top-level key, no new degradation value).
- New native `/aw-index` command in the pi package: a progressive, resumable
  sync with no `SKILL.md` behind it, printing pending chunks, the pinned model,
  the last sync's counts and the declared degradations from that envelope.
