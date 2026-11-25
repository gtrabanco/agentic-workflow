---
"@gtrabanco/pi-agentic-workflow": minor
"@gtrabanco/pi-nan-agentic-workflow": minor
---

feat(pi): resolve a preset's doc-index embedding profile by default, and expose the index as a tool

Two additive surfaces behind issue #719, neither of which changes a crate:

- **Default-on resolution.** When an installed preset ships an embed profile and
  its key variable (`NAN_API_KEY` for NaN) is present, a project whose
  `index.json` carries no `provider` block now resolves that profile at
  extension load: the crate's own
  `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL/MODEL/API_KEY` are exported into the
  session process, so every runner child inherits the provider env-only. The
  activation ceremony (find the preset, materialize it, run `/aw-index`) is
  gone. An explicit block — complete or partial — withholds the default
  wholesale and the committed file is never rewritten; without the key nothing
  changes and the shipped keyword-only degradation stands. The profile's
  measured 6000 × 6 pair rides along as the crate's request budget
  (`AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_REQUEST_CHARS=36000`), which is the
  chunk limit the crate adopts when none is configured.
- **`doc_search`.** The doc index becomes a deferred, read-only pi tool in the
  `agentic-workflow` namespace, taking `{ query, mode?: "hybrid" | "keyword" }`
  and returning the crate's own query envelope typed (`path`, `section`, the
  1-based inclusive `lines` pair, `score`, `meta`). It spawns the pinned runner's
  `doc --query … --json-only`, so there is no second retrieval implementation and
  no write; an absent `mode` is absent so the crate's own auto resolution runs.

`rg` stays the tool for exact strings and regex in code, LSP for symbols:
embeddings win prose retrieval only.

### The companion also moves

`@gtrabanco/pi-nan-agentic-workflow` gains the default-on trigger itself: its
extension module applies the NaN doc-index profile right after registering it, in
the same module graph, so a session resolves the provider whatever order pi loads
its packages in — and it says so once, on stderr, instead of leaving the operator
guessing why the index embedded nothing. That is a new user-visible behaviour in
this package, so it carries its own minor alongside the pi package's.
