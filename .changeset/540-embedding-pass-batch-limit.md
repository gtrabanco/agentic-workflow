---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
"@gtrabanco/pi-agentic-workflow": patch
---

fix(doc): a rejected embed request ends its batch, never the pass (#540)

The `doc --sync` embedding pass aborted the entire backfill on the first
non-retryable provider error and reported it as
`unavailable-embeddings-provider-down`, so a store could never get past the
chunk the provider refused and the operator had no diagnosis to act on.

A non-rate-limit `4xx` is now a **rejection**, not an outage: the offending
batch's chunks stay pending, the rest embed, and the run declares the new
`embeddings-request-rejected` degradation with the provider's status and body
excerpt in the envelope's additive `store.rejected` record (and on stderr in
the human `doc` path). Requests are packed under `provider.max_request_chars`
(default 90000), which is also the chunk limit a configured provider gets when
`chunk_limit` is unset; a `chunk_limit` above that budget is refused at config
load. The chunk limit is recorded in the store, so changing it re-chunks every
stored file on the next sync, and `doc --rebuild` embeds the pending chunks in
the same pass instead of leaving a keyword-only store unstated.

The degradation vocabulary is published by the schema package
(`DOC_DEGRADATIONS`) and pinned to the runner's runtime close by a sibling
suite; `/aw-index` renders the rejected set and the remaining pending work.
