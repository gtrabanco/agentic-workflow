---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
"init-workspace": patch
---

fix(doc): make the embedding pass observable, bounded and single-owner (#718)

Five defects in one pass, all reported from a live 12.9k-chunk corpus.

The embed stage now reports progress for **both** chunking ops: `--rebuild`
embeds the same pending set as `--sync` and was the one silent half left.

Every provider request carries `AbortSignal.timeout(fetchTimeoutMs)`, a new
`provider.pacing` knob (default 30 s, overridable through
`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_FETCH_TIMEOUT_MS`). A socket that accepts a
request and never answers used to block the pass with no error to retry; the
abort is a status-less error, so the existing ladder retries it, and a query's
single provider call is bounded by the same knob.

One embed pass owns the store's pending set: an advisory `doc_lease` row (owner
++token + heartbeat, TTL derived from the pacing) is taken atomically **before**
the pending rows are read — and, for `--sync`, **before the scan writes a
byte**: a fenced launch performs no scan (it can neither die contending for the
scan lock nor leave a late re-chunk beside the owner's embedded rows) and
declares `unavailable-embeddings-lease-held` instead. Heartbeats ride the
scan's per-file seam on the scanning connection and every provider request.
Concurrent `doc --sync` runs were idempotent on the rows but not on the
provider bill; the fenced run now embeds nothing and still reports the
remainder, and a lease left by a killed pass expires and is taken over.

A `--sync` that had pending chunks and no provider key declares
`unavailable-embeddings-not-configured` instead of leaving a keyword-only corpus
unstated; a warm one stays silent.

`/aw-index` stops killing a legitimate backfill at a fixed 600 s: it reads the
store's pending count (`doc --status --json-only`, now answering `pending`) and
spawns the sync with `max(600 s, pending × 1 s + 120 s)`, capped at six hours so
a corrupt count cannot buy an unbounded window, keeping the floor when the probe
cannot answer.

The freshness hook runs on a host where the crate is not on `PATH`:
`init-workspace` records the answer the crate's own resolver gave
(`runner resolve --json doc --sync --quiet`) in a machine-local, gitignored
`.agentic-workflow/hooks/runner.local`, which `index-sync.sh` executes verbatim
before falling back to `command -v` and its documented silent no-op. No second
runner version literal ships with the template.
