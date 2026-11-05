---
"@gtrabanco/agentic-workflow": minor
---

feat(section-locator): locate a Markdown section and splice it without touching another byte

Adds `agentic-workflow section locate|remove|replace`: the document is parsed with
`mdast-util-from-markdown`, section bounds come from node positions — a fenced
`##`-like line is never a heading — and the mutation slices the original string,
so every byte outside the reported range is carried through untouched. Selectors:
heading title, depth-aware heading path, heading regex, and a line-in-scope
exact/regex range; a selector resolving to zero or several sections raises a typed
error and the caller decides the policy.

The parser is exact-pinned in this crate only; the schema package stays
dependency-free and the crate's published description now states the real
inventory.
