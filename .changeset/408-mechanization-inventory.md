---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/pi-agentic-workflow": patch
"audit-docs": patch
---

fix(log): accept the aggregator's blank-line separator, and repair `audit-docs` check 13

The journal aggregator writes `\n` plus the fragment block, so the appended
range suffix begins with the structural separator. `log-immutability` tested the
raw suffix for the `## ` entry heading and therefore reddened on the aggregator's
own output, which is why the journal push path could not be green: the gate now
strips the separator newlines before the heading test, pinned by a red-first
case that appends the aggregator's exact byte shape (18 pass / 1 fail before the
fix, 19 pass after).

`audit-docs` check 13 lost two spans when the `generate-docs` skill was retired
and read "for orphan pages each:" and "propose )". The check is repaired against
what ships: it looks for the renderer's own header, states that the
`source-unit`/`updated` criteria apply only to pages that carry those fields,
answers `n/a — no provenance fields` otherwise, and points the refresh at
`bun scripts/docs-generate.mjs` instead of the retired command. Check 13 is
recorded as step `AD20` in the mechanization inventory (issue #408).
