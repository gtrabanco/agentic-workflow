/**
 * root.mjs — the project root a runner command operates on.
 *
 * The sensor this module tree replaces resolved its project by walking up from
 * its own script directory, because the script always lived inside the project
 * it sensed. A published runner does not: it lives in `node_modules`, so the
 * only reliable anchor is the invoking process's working directory. A
 * sub-directory invocation (`cd docs && agentic-workflow …`) still resolves to
 * the worktree that contains it, which is what every sensor already assumed.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * The git worktree that contains `from` — found by walking up to the nearest
 * ancestor that carries `.git` (a directory in a normal checkout, a file in a
 * linked worktree). Falls back to `from` when no worktree encloses it, so a
 * throwaway directory behaves as itself instead of failing.
 *
 * @param {string} [from] absolute or relative directory to start from
 * @returns {string} absolute path of the containing worktree, or `from`
 */
export function gitRoot(from = process.cwd()) {
  let current = path.resolve(from);
  for (;;) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return path.resolve(from);
    current = parent;
  }
}
