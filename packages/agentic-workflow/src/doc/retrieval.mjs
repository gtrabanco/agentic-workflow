/**
 * Retrieval operations for `agentic-workflow doc` (unit 65).
 *
 * P2 seam: grammar + envelope contract only. Each operation grows its real
 * behavior without changing the envelope contract:
 *   P3 — store, config, canonical manifest (store value becomes concrete)
 *   P4 — incremental sync engine (files_scanned/files_changed, freshness)
 *   P5 — FTS5 query core + status reporting (results become real rows)
 * Degradations are emitted per-op as those engines land, from D3's closed
 * vocabulary only.
 */

import { buildEnvelope } from "./envelope.mjs";

/**
 * Run one retrieval operation. `grammar` is parseDocArgs' output;
 * `ctx.rootDir` is the project root the store and config resolve against.
 */
export function runDocOp(grammar, ctx = {}) {
  const results = [];
  const degradations = [];
  return buildEnvelope({ command: grammar.op, results, degradations, store: null });
}
