/**
 * Store location for the `doc` retrieval index (unit 65, D4).
 *
 * The store is `.agentic-workflow/index/index.db` under the project root —
 * a gitignored, disposable cache over git (AC7: `git status` stays clean
 * after first creation). The canonical manifest export is the sidecar
 * `manifest.json` in the same gitignored directory; AC12's byte-for-byte
 * assertion runs over that export, never over SQLite page bytes.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { openDatabase } from "./sqlite.mjs";
import { loadConfig } from "./config.mjs";

export const MANIFEST_EXPORT_NAME = "manifest.json";

export function storePath(root, config) {
  if (config && config.store?.path) {
    return join(root, config.store.path);
  }
  try {
    const cfg = loadConfig(root);
    if (cfg.store?.path) return join(root, cfg.store.path);
  } catch {
    // config unreadable — fall through to hardcoded default
  }
  return join(root, ".agentic-workflow", "index", "index.db");
}

export function manifestExportPath(root) {
  return join(root, ".agentic-workflow", "index", MANIFEST_EXPORT_NAME);
}

export function storePresent(root) {
  return existsSync(storePath(root));
}

/**
 * Create the store if absent. Idempotent: an existing store is left exactly
 * as it is (P4's sync engine owns its schema migration).
 */
export async function ensureStore(root) {
  if (storePresent(root)) return storePath(root);
  const { db } = await openDatabase(storePath(root));
  db.close();
  return storePath(root);
}
