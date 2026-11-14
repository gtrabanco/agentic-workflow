/**
 * The `doc` retrieval envelope's closed vocabularies (feature 65, D3; published
 * by fix #540 S3).
 *
 * `agentic-workflow doc` declares a degraded run with a value from one closed
 * set, and an unknown value fails the envelope's construction rather than
 * shipping. That set was published only in the runner crate
 * (`src/doc/envelope.mjs`), which left the schema package with no surface a
 * consumer or a document could cite. This module is that surface.
 *
 * Two ownership rules keep it honest:
 *
 * - **The enumerated values are declared here** and nowhere else. The crate's
 *   runtime close reads them through a parity suite (the `doc` path is the
 *   crate's cold path and carries no build step, so it cannot import `dist`);
 *   adding a value is this const plus the runtime pattern plus that pin, in one
 *   change.
 * - **Two families stay open by design**: `unavailable-sqlite-<runtime>`
 *   (`node` or `bun` — the adapter that could not load) and
 *   `unavailable-embeddings-<cause>` (a cause the provider layer reports). They
 *   are families, not values, so they are documented here and asserted in the
 *   runtime close, never enumerated.
 *
 * The meanings are the emission sites' and are restated only so a reader knows
 * which layer speaks: `unavailable-` means the layer is missing or unreachable;
 * a token without that prefix means the layer answered and the answer is the
 * degradation.
 */

/** The enumerated `doc` degradations — one per declared cause. */
export const DOC_DEGRADATIONS = Object.freeze([
  /** The SQLite adapter could not load on this runtime (`node`). */
  "unavailable-sqlite-node",
  /** The SQLite adapter could not load on this runtime (`bun`). */
  "unavailable-sqlite-bun",
  /** No embedding provider is configured: the store answers keyword-only. */
  "unavailable-embeddings-not-configured",
  /** The store holds no vectors yet: the query degraded to keyword. */
  "unavailable-embeddings-not-indexed",
  /** The provider is unreachable or refused to answer after its retry ladder. */
  "unavailable-embeddings-provider-down",
  /**
   * The provider **rejected the request** (a non-rate-limit 4xx: input too
   * large, an unknown model, bad credentials). The provider is up; the chunks in
   * that batch were skipped and stay pending, and the status/body is carried in
   * the envelope's `store.rejected`. Distinct from provider-down on purpose.
   */
  "embeddings-request-rejected",
  /** The configured model differs from the store's pin: nothing re-embeds. */
  "embeddings-model-mismatch",
  /** A chunk body exceeded `provider.chunk_limit` and was truncated to fit. */
  "chunk-too-large",
] as const);

export type DocDegradation = (typeof DOC_DEGRADATIONS)[number];
