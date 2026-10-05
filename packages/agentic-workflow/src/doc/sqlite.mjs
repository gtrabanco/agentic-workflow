/**
 * Runtime SQLite adapter for the `doc` retrieval index (unit 65, D7).
 *
 * bun is the primary runtime (`bun:sqlite`); node ≥ 24 is the supported floor
 * (`node:sqlite`). Both ship FTS5 here (P1 verified). The adapter returns the
 * raw database plus the runtime name so callers can paper over the few API
 * differences; a runtime without a usable SQLite module surfaces the closed
 * `unavailable-sqlite-<runtime>` degradation (D3) — it never crashes.
 */

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function runtimeName() {
  return typeof Bun !== "undefined" ? "bun" : "node";
}

/**
 * Open (creating if needed) the SQLite database at `path`. For `:memory:`
 * no directory creation happens. Returns `{ db, kind }` where `kind` is
 * `"bun" | "node"` and `db` is the raw runtime database handle.
 */
export async function openDatabase(path) {
  const kind = runtimeName();
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  if (kind === "bun") {
    const { Database } = await import("bun:sqlite");
    return { db: new Database(path), kind };
  }
  const { DatabaseSync } = await import("node:sqlite");
  return { db: new DatabaseSync(path), kind };
}
