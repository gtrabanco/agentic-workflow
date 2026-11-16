---
"@gtrabanco/agentic-workflow": patch
---

fix(deps): bump the typebox pin from 1.4.6 to 1.4.7

The scheduled pin watch's drift (issue #588): the pin was behind the registry's
latest. Upstream publishes no GitHub release notes for this window (its
`releases` endpoint answers an empty array), so the recorded effect is the npm
tarball diff — 1,419 files in both tarballs, 0 added, 0 removed, **3
content-changed**: `build/schema/resolve/resolve.mjs`, `package.json` (the
version number only) and `readme.md`. What it means here is read from the
crate's own usage.

**What changed upstream.** The resolver is the whole release:

- `$dynamicRef` resolution is rewritten. A new `DynamicRefName` extracts the
  anchor name first — a ref with no `#` is a bare name used as-is, otherwise the
  name is the decoded fragment of the resolved URI — and the pointer-vs-anchor
  decision now reads the name's leading `/`. The scoped-anchor search gained one
  step: it looks in `stack.lexicalSchema` before `stack.schema`, so an anchor
  reachable through the lexical scope wins over one only reachable from the
  resource root.
- `$ref` into a remote (or embedded) resource now takes its base from
  `RelativeBase(remoteRoot, new URL(canonical))` instead of the canonical URL,
  so refs nested inside a remote resource resolve relative to that resource.
- The internal `IsPointerFragment` helper is gone (folded into the name
  handling above). It was never exported.
- `readme.md` re-labels the spec-conformance table: `ref` is marked complete
  across every draft, the legacy keywords split into their own rows
  (`ref-legacy`, `id-legacy`, `anchor-legacy`, `infinite-loop-detection-legacy`)
  and the `format-*` rows are enumerated. That table describes the upstream
  test suite's coverage; it changes no behaviour.

**What it means for this crate.** Nothing to adapt: the crate loads `typebox`
lazily from two modules (`src/doc/envelope.mjs`, `src/doc/structure-schema.mjs`)
and uses only the `Type` builders plus `typebox/compile`. It declares no
`$ref`, `$id`, `$dynamicRef`, `$dynamicAnchor`, `$defs` or `definitions` in
`src/` or `test/`, so no schema it compiles reaches the resolver path the
release rewrote — the bump is the pin keeping parity, not a semantic choice.
The crate's own suite stays green on the bumped runtime, which is the evidence
for that verdict. The lockfile rides the same commit, refreshed with
`bun install --lockfile-only` (no lifecycle scripts run).
