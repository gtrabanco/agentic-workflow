# 2026-11-09-declare-docs-site

```text
passive-record@1
id | `2026-11-09-declare-docs-site` | the passive unit's stable id
tier | passive | the verdict as the classifier emitted it
paths | `AGENTS.md` | the readback's own scope
readback | Every changed path read and classified: AGENTS.md is prose-only — a new '## Docs site' section declaring '- format: md' (the emitter's discovery input, exact heading per unit-doc-phases sectionText), no executable content, no code fence outside the declaration block, no rule restated outside its owner. | the structural readback: every changed file read and classified
gate | `bun scripts/docs-generate.mjs --check` · exit 0 | the deterministic gate that ran beside it
```
