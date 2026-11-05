---
"@gtrabanco/pi-agentic-workflow": patch
"unit-lane": patch
---

fix(unit-lane): record the AC-section hash where a surface actually writes it

The relay coherence checklist's item (d) and the review checklist both required
comparing the acceptance-criteria section's hash against "the value recorded at
triage" — a value no surface ever wrote, so the check could not pass or fail on
evidence. The design step now freezes the section at record time: `ac-hash:` in
the unit doc's frontmatter, computed with the section parser's own semantics
(`sectionText` — heading excluded, next `## ` excluded). The command lives once,
in `DESIGN.md` §Fixed output contract; `REVIEW.md` and `RELAY.md` name that owner
instead of restating it, and the four SPEC templates carry the frontmatter
comment. An AC change after the freeze is a plan repair that recomputes and
rewrites the line — review never edits either side.
