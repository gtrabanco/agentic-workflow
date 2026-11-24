---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(704): a delivery condition names the carrier the machine re-checks

A condition that gates delivery — "closed as covered by #N", "reopen when #N
lands", "proceeds when #N", "waits for #N", "retire when #N" — now names an issue
the machine re-checks, and two paths do the re-checking. `runner
delivery-conditions --close-check <n>` is the guard a close runs first: a
coverage claim against an issue that is still open is refused as
`covered-by-open`, and the refusal names the route (deliver the cover, or keep
the issue open with a native `blocked-by` link). `runner delivery-conditions
--sweep` is the backstop for prose already written: it reads the issue corpus
(bodies **and** comments — the confirmed stall was a comment) plus the roadmap's
fix rows, extracts the five families in the languages the field record actually
carries, judges each condition against the issues it cites, and fails on a
follow-up that came due. A weekly scheduled workflow runs it, so a met condition
is noticed at worst one sweep later instead of two consumer units.

The four closed sets (`DELIVERY_CONDITION_KINDS`, `…_VERDICTS`, `…_FINDINGS`,
`…_REFUSALS`) are published from the schema package; the phrasings and the rule
each stalled state implements are owned by the issue process. Report-only: the
sweep writes nothing, mutates no forge state and prints no third-party text.
