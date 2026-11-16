---
"@gtrabanco/agentic-workflow": patch
---

fix(doctor): keep the fixed human block's two-space gutter on UNREACHABLE rows (issue #568)

`renderDoctor` padded the status label with `padEnd(12)`, so the 11-character
`UNREACHABLE` label left a single space before the row id and its line stopped
matching the fixed block's labelled-line separation — every `UNREACHABLE` row
dropped out of the block's per-row count (the publication gate's
`12 !== 14`, twice). The label column keeps its 12 width for the shorter
labels and gains a minimum two-space gutter after the label itself.
