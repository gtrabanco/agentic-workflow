# Finder contract — scope and materiality bar

Single owner of the `## Scope` and `## Materiality bar` contracts every
internal review-pack finder carries. The eight finders (`review-code`,
`review-security`, `review-verify`, `review-design`, `review-a11y`,
`review-brand`, `review-perf`, `review-seo`) cite this file instead of copying
it; their checklists stay in each finder's SKILL.md.

## Scope

The diff or path/glob the caller passes; default the current change vs the
default branch. State the scope at the top of the returned table.

## Materiality bar

Report a row only when a competent user's outcome changes or a rule the project
explicitly declares is violated — cite the rule it violates beside the evidence.
Not findings: comment/punctuation typos, formatting-only drift, style preference
with no cited rule, hypothetical robustness beyond the SPEC's named scenarios.
An empty table with `Decision: PASS` is the expected result for a well-formed
change — never pad the table.
