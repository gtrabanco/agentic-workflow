/**
 * Store location for the `doc` retrieval index (unit 65, D4).
 *
 * The store is `.agentic-workflow/index/index.db` under the project root —
 * a gitignored, disposable cache over git (AC7: `git status` stays clean
 * after first creation). The canonical manifest export is the sidecar
 * `manifest.json` in the same gitignored directory; AC12's byte-for-byte
 * assertion runs over that export, never over SQLite page bytes.
 *
 * D20 shared store (issue #470): when `store.share.enabled` is configured,
 * the store resolves to `<base>/agentic-workflow/<repoId>/index.db` — a
 * user-level directory identified by the repo's commit-object SHA — so
 * worktrees of the same repository share one index instead of each building
 * its own from scratch.
 */

import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { openDatabase } from "./sqlite.mjs";
import { loadConfig } from "./config.mjs";
import { repoId } from "./manifest.mjs";

export const MANIFEST_EXPORT_NAME = "manifest.json";

/** Default store location: `.agentic-workflow/index/index.db`. */
const DEFAULT_STORE_DIR = join(".agentic-workflow", "index");

/**
 * The default user-level base directory for shared stores (D3): `$XDG_DATA_HOME`
 * when set, `$HOME/.local/share` as the XDG fallback, and the current directory
 * as the last resort (the caller's own fallback logic decides then).
 */
function defaultSharedBase() {
  const env = process.env || {};
  if (env.XDG_DATA_HOME) return env.XDG_DATA_HOME;
  if (env.HOME) return join(env.HOME, ".local", "share");
  return ".";
}

/**
 * Resolve the shared store path for one repo ID: `<base>/agentic-workflow/<repoId>/index.db`.
 * Returns `null` when the repo ID is unavailable (the caller falls back to the
 * local store path).
 */
function resolveSharedStorePath(baseDir, id) {
  if (!id) return null;
  const base = baseDir ?? defaultSharedBase();
  return join(base, "agentic-workflow", id, "index.db");
}

/**
 * Resolve the store file path, honouring `store.share` in the config (D20).
 *
 * When `store.share.enabled` is true and the repo ID resolves: the store path
 * is under `<base>/agentic-workflow/<repoId>/index.db` (the base defaults to
 * the user-level directory; a configured `store.share.base_dir` overrides it),
 * and the parent directory is created as needed.
 *
 * Otherwise: `config.store.path` when present, else the default
 * (`.agentic-workflow/index/index.db`).
 */
export function storePath(root) {
  const cfg = loadConfig(root);

  if (cfg.store?.share?.enabled === true) {
    const sharedPath = resolveSharedStorePath(cfg.store.share.base_dir, repoId(root));
    if (sharedPath) {
      mkdirSync(dirname(sharedPath), { recursive: true });
      return sharedPath;
    }
    // No repo ID (no git): fall through to the local store path.
  }

  if (cfg.store?.path) return join(root, cfg.store.path);
  return join(root, DEFAULT_STORE_DIR, "index.db");
}

/**
 * Canonical manifest export: the sidecar `manifest.json` beside the resolved
 * store — the configured `store.path`'s directory when set (F18: the sidecar
 * must travel with the store, or a custom store path ENOENTs on sync), else
 * the default gitignored index dir. AC12's byte-for-byte assertion runs over
 * that export, never over SQLite page bytes.
 */
export function manifestExportPath(root) {
  return join(dirname(storePath(root)), MANIFEST_EXPORT_NAME);
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
