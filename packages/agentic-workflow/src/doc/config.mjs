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
import { join, resolve, sep } from "node:path";

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
 * Load the config for the project at `root`: defaults merged under the
 * file's overrides. Throws on unparseable JSON (message names the file) and
 * on an unknown `version` (fail closed).
 */
export function loadConfig(root) {
  const path = configPath(root);
  if (!existsSync(path)) return structuredClone(DEFAULT_CONFIG);
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
  // Contain store.path inside the repository root (AC7: gitignored cache must not
  // escape). An absolute path that is outside the root, or a relative path that
  // resolves outside (contains `..`), is rejected — the `rmSync` in --rebuild
  // targets this path, so a misconfigured store path is a destructive-write
  // footgun. Uses realpath to reject in-repo symlinks that escape the root.
  if (parsed.store?.path) {
    const candidate = parsed.store.path;
    const joinedPath = resolve(root, candidate);
    // realpathSync requires the path to exist; if it doesn't, fall back to a
    // simple lex-check. A real realpath call is done later at the store/manifest
    // write site (rebuild/ensureFresh) so symlinks are always caught.
    let resolvedCandidate;
    try {
      resolvedCandidate = realpathSync(joinedPath);
    } catch {
      resolvedCandidate = joinedPath; // path doesn't exist yet — lex check below
    }
    const resolvedRoot = realpathSync(root);
    if (!resolvedCandidate.startsWith(resolvedRoot + sep)) {
      throw new Error(
        `index.json store.path "${candidate}" escapes the repository root (${root})`,
      );
    }
  }
  return { ...structuredClone(DEFAULT_CONFIG), ...parsed };
}
