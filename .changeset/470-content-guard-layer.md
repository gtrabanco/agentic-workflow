---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
"batch-scheduler": patch
"unit-lane": patch
---

feat(guard): a content guard layer in the deterministic collection path (issue #470)

Third-party forge text is sanitized, gated by author provenance and fenced before
any model sees it, and the guards are deterministic code in the collection layer —
never model discipline.

The schema package publishes the decision reasons, the ingestion kinds, GitHub's
author-association enum and the hidden-content kinds, plus the `contentGuard`
config section (strictest default, tighten-only merge, no bypass). The crate's
`src/content-guard.mjs` owns enforcement: one `guardForgeContent` ingestion path
that strips hidden material and counts every removal by kind, excludes an
untrusted or unknown author with a declared reason, and delivers admitted content
inside a fence content cannot close. The planner's `collectIssues()` and the
workflow-status sensor's forge collection both route through it, so a payload in
an issue title or body is gone before it reaches an envelope, and a discipline
suite fails any producer that reads a forge `title`/`body` field list without
being either a declared seam or an explained exemption.

Those two decisions travel as declared degradations, so `batch-plan@3`'s
degradation grammar gains the guard's two families —
`excluded-forge-content-<source>-<id>-<reason>` and
`stripped-forge-content-<source>-<id>-<kind>-<count>` — beside
`unavailable-<source>-<cause>` and `surface-unknown-issue-<n>`. A plan over a
repository with hidden material or an untrusted author therefore prints and says
what it could not use, instead of being refused by its own envelope.

A `contentGuard` list that is not the declared shape is refused whole instead of
being narrowed: the tighten-only merge runs before validation, so filtering
`[123]` or `"everyone"` into an empty list handed the validator a legal,
intentional-looking lockdown and the policy narrowed in silence. The unreadable
side now passes through untouched, validation refuses the section, and the caller
gets the shipped strictest policy with a declared `malformed-config`.
