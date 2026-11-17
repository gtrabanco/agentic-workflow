/**
 * The content-guard machine contract (issue #470).
 *
 * Third-party forge content — issue and PR titles, bodies, comments, review
 * comments, code comments — is untrusted by construction: anybody who can
 * comment can write it. The guard layer is deterministic code, never model
 * discipline, so the vocabularies a guard decision speaks live here, next to the
 * config section that gates the author policy.
 *
 * Four closed sets, one home each:
 *  - `CONTENT_GUARD_REASONS` — the decision's verdict vocabulary. It is the
 *    sibling of `PATH_GUARD_REASONS` and is declared as `schema-export:` in the
 *    repository's `normative-surfaces@1` inventory with `must-name: yes`.
 *  - `CONTENT_SOURCES` — the ingestion kinds the guard accepts. A kind with no
 *    deterministic collector is still a legal input: the collector gap is
 *    declared by the consuming unit, never silently widened.
 *  - `CONTENT_AUTHOR_ASSOCIATIONS` — GitHub's own author-association enum, the
 *    vocabulary the policy's role sets are drawn from.
 *  - `CONTENT_HIDDEN_KINDS` — what the sanitizer can remove, one code per kind,
 *    so a removal is countable and auditable rather than a silent byte drop.
 */

export const CONTENT_GUARD_CONTRACT = "content-guard@1";

/**
 * The closed decision vocabulary. Adding a reason is a SPEC change, never a code
 * path: `clean`, `trusted-author`, `allow-listed` and
 * `hidden-content-stripped` are allowed verdicts; the rest are exclusions.
 */
export const CONTENT_GUARD_REASONS = Object.freeze([
  "clean",
  "trusted-author",
  "allow-listed",
  "hidden-content-stripped",
  "untrusted-author",
  "deny-listed",
  "unknown-author",
  "malformed-policy",
]);

/** The ingestion kinds the guard accepts, one per piece of forge text. */
export const CONTENT_SOURCES = Object.freeze([
  "issue-title",
  "issue-body",
  "issue-comment",
  "pr-title",
  "pr-body",
  "pr-comment",
  "review-comment",
  "code-comment",
]);

/**
 * GitHub's `CommentAuthorAssociation` values. Sampled from the schema the forge
 * serves (`CommentAuthorAssociation` enum), never recalled: a pinned `gh` has no
 * `authorAssociation` JSON field, so the association is read from the REST issues
 * endpoint.
 */
export const CONTENT_AUTHOR_ASSOCIATIONS = Object.freeze([
  "OWNER",
  "MEMBER",
  "COLLABORATOR",
  "CONTRIBUTOR",
  "FIRST_TIME_CONTRIBUTOR",
  "FIRST_TIMER",
  "MANNEQUIN",
  "NONE",
]);

/** What the hidden-content sanitizer removes, one code per kind. */
export const CONTENT_HIDDEN_KINDS = Object.freeze([
  "html-comment",
  "zero-width",
  "bidi-control",
  "tag-character",
  "variation-selector",
  "control-character",
  "homoglyph-instruction",
]);
