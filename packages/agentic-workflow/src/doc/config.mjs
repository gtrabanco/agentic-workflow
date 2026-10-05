/**
 * Committed config for the `doc` retrieval index (unit 65, D4/D10).
 *
 * `.agentic-workflow/index.json` is the committed decision surface (shipped
 * by init-workspace in target projects). It defaults when absent — a missing
 * config is never a hard failure; the index answers keyword-only until a
 * provider is configured (AC17's `unavailable-embeddings-not-configured`).
 * A present but unparseable config is a usage/IO error (exit 1 territory);
 * an unknown version fails closed — the reader never guesses.
 */

import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";

export const CONFIG_VERSION = 1;

export const DEFAULT_CONFIG = Object.freeze({
  version: CONFIG_VERSION,
  store: Object.freeze({ path: ".agentic-workflow/index/index.db" }),
  // D10 provider surface: null ⇒ keyword-only. When configured: an
  // OpenAI-compatible {baseUrl, model, envVar} — the env var is read at
  // runtime in pi's precedence (CLI flag > environment > config > default).
  provider: null,
});

export function configPath(root) {
  return join(root, ".agentic-workflow", "index.json");
}

/**
 * Realpath of the deepest EXISTING ancestor of `p`, with the not-yet-existing
 * tail re-joined lexically (F36): the configured store leaf usually does not
 * exist yet, but its intermediate directories do — and an intermediate
 * symlink escaping the repository must be caught before any write.
 */
function realpathDeepest(p) {
  const tail = [];
  let cur = p;
  while (!existsSync(cur)) {
    const parent = dirname(cur);
    if (parent === cur) return cur; // filesystem root — nothing to resolve
    tail.unshift(cur.slice(parent.length + 1));
    cur = parent;
  }
  return join(realpathSync(cur), ...tail);
}

/**
 * Contain a configured `store.path` inside the repository's gitignored
 * `.agentic-workflow/` directory (F36/F37, decision D12):
 *   - F37: a store outside `.agentic-workflow/` leaves `git status` dirty
 *     after `--sync` (AC7) — the configured store must stay inside the only
 *     directory the committed ignore rules cover;
 *   - F36: containment is anchored at `realpath(root)` and the candidate is
 *     resolved through the realpath of its deepest existing ancestor, so a
 *     symlinked intermediate directory (or a symlinked `.agentic-workflow`
 *     itself) fails closed — `--rebuild`'s `rmSync` targets this path, so a
 *     misconfigured store path is a destructive-write footgun.
 */
function containStorePath(root, candidate) {
  const anchoredRoot = realpathDeepest(resolve(root));
  const workflowRoot = join(anchoredRoot, ".agentic-workflow");
  const resolvedCandidate = realpathDeepest(resolve(root, candidate));
  if (!resolvedCandidate.startsWith(workflowRoot + sep)) {
    throw new Error(
      `index.json store.path "${candidate}" must stay inside .agentic-workflow/ (got "${resolvedCandidate}")`,
    );
  }
}

/**
 * Load the config for the project at `root`: defaults merged under the
 * file's overrides. Throws on unparseable JSON (message names the file),
 * on an unknown `version` (fail closed), and on a `store.path` outside the
 * gitignored `.agentic-workflow/` directory (F36/F37 containment).
 */
export function loadConfig(root) {
  const path = configPath(root);
  if (!existsSync(path)) {
    // F50: the absent-config branch is NOT a containment bypass — the merged
    // default store path runs through the same check, so a symlinked
    // `.agentic-workflow` fails closed even with no index.json on disk.
    const merged = structuredClone(DEFAULT_CONFIG);
    containStorePath(root, merged.store.path);
    return merged;
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`index.json is not valid JSON (${path}): ${error.message}`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`index.json must be a JSON object (${path})`);
  }
  if (parsed.version !== undefined && parsed.version !== CONFIG_VERSION) {
    throw new Error(`index.json version ${parsed.version} is not supported (expected ${CONFIG_VERSION})`);
  }
  // Contain the MERGED store path inside the repository's gitignored
  // `.agentic-workflow/` directory (F36/F37/F50, decision D12) — see
  // containStorePath. Runs on every branch: an explicit `store.path`, a
  // config without a `store` key, and the absent-config default alike.
  const merged = { ...structuredClone(DEFAULT_CONFIG), ...parsed };
  // storePath() falls back to the default when `store.path` is falsy —
  // contain exactly the path that will be used.
  containStorePath(root, merged.store?.path || DEFAULT_CONFIG.store.path);
  return merged;
}
