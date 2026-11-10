---
"@gtrabanco/agentic-workflow": patch
---

fix(deps): bump the typebox pin from 1.4.5 to 1.4.6

The scheduled pin watch's drift (issue #484): the pin was behind the registry's
latest. Upstream publishes no GitHub release notes for this window (its
`releases` endpoint answers empty), so the recorded effect is the npm tarball
diff — 24 files differ, 2 removed, none added, `fileCount` 1421 → 1419 — and
what it means here is read from the crate's own usage.

**What changed upstream.** `Schema.Pointer` and `Schema.Resolve` are no longer
flattened into `Schema`: they are re-exported as namespaces, so their members
stop arriving as bare names. `Pointer.Indices` is renamed `Pointer.Fragments`
and two helpers join it (`EncodeFragment`, `DecodeFragment`). The `_pathing`
module is gone, and the engine's `ref` / `dynamicRef` / `recursiveRef` /
`additionalProperties` / `dependentSchemas` / `dependencies` /
`patternProperties` / `properties` / `propertyNames` / `intern` modules move
from named to namespace imports — an evaluation-order hardening inside the
validator, not a semantics change.

**What it means for this crate.** Nothing to adapt: the crate loads `typebox`
lazily from one place (`packages/agentic-workflow/src/doc/envelope.mjs`) and
uses only the `Type` builders plus `typebox/compile`; no pointer, resolve or
intern helper is reached, and no exported name the crate touches was renamed.
The crate's own suite stays green on the bumped runtime, which is the evidence
for the regression verdict. The lockfile rides the same commit, refreshed with
`bun install --lockfile-only` (no lifecycle scripts run).
