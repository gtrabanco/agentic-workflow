---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
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
