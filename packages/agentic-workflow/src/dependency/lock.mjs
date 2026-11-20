/**
 * lock — the committed lockfile as a read-only source of resolved versions
 * (issue #553, moved out of `scripts/pin-watch.mjs`).
 *
 * A target project's pins live in its own lockfile, so the advisory pass reads
 * it here instead of assuming a `scripts/` copy exists. JSONC tolerance is one
 * line: bun's lock carries no comments today, and refusing a comment would cost
 * a dependency this command does not need.
 */

import fs from "node:fs";
import path from "node:path";

/** Parse a lock's JSON (a trailing comma is tolerated). */
export function parseLock(text) {
  return JSON.parse(String(text).replace(/,(\s*[}\]])/g, "$1"));
}

/**
 * The lock that governs `dir`: the workspace root's (one lock for every member)
 * or the package's own in a repository that has no workspace root.
 */
export function lockFileFor({ root = process.cwd(), dir = "" }) {
  for (const candidate of [path.join(root, "bun.lock"), path.join(root, dir, "bun.lock")]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * The version the committed lock resolved for `dependency` in `dir`, or null.
 * A workspace link (`name@workspace:packages/x`) is not a version, and a
 * dependency the lock does not carry is not a silent pass either: the caller
 * reports that it cannot tell whether the pin has moved.
 */
export function resolvedVersion({ root = process.cwd(), dir = "", dependency }) {
  const file = lockFileFor({ root, dir });
  if (!file) return null;
  const entry = parseLock(fs.readFileSync(file, "utf8")).packages?.[dependency];
  const spec = Array.isArray(entry) ? String(entry[0] ?? "") : "";
  const version = spec.slice(spec.lastIndexOf("@") + 1);
  return /^\d/u.test(version) ? version : null;
}
