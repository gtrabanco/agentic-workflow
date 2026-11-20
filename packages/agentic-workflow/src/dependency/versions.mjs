/**
 * versions — the semver comparison and the package-directory scan (issue #553).
 *
 * Moved out of `scripts/version-parity-gate.mjs` (which stays this repository's
 * own gate) because a shipped command needs the same rule: the dependency
 * advisory pass compares a resolved version with a published one, and two
 * comparisons would drift. One implementation, two consumers — the repo gate
 * imports it here, and `speed` is never restated.
 */

import fs from "node:fs";
import path from "node:path";

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/u;

/** A `major.minor.patch[-prerelease]` triple, or null when unparsable. */
export function parseSemver(version) {
  const m = SEMVER_RE.exec(String(version ?? "").trim());
  if (!m) return null;
  return {
    major: Number(m[1]),
    minor: Number(m[2]),
    patch: Number(m[3]),
    prerelease: m[4] ?? null,
  };
}

/** True when `a` is strictly newer than `b`. Non-parsable input sorts lowest. */
export function semverGt(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return false;
  for (const key of ["major", "minor", "patch"]) {
    if (pa[key] !== pb[key]) return pa[key] > pb[key];
  }
  // Same numeric triple: a release outranks any prerelease; two prereleases
  // compare dot-separated identifier-wise (numeric identifiers numerically).
  if (pa.prerelease === pb.prerelease) return false;
  if (pa.prerelease === null) return true;
  if (pb.prerelease === null) return false;
  const left = pa.prerelease.split(".");
  const right = pb.prerelease.split(".");
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const l = left[i];
    const r = right[i];
    if (l === undefined) return false; // shorter prefix sorts lower
    if (r === undefined) return true;
    const ln = /^\d+$/.test(l);
    const rn = /^\d+$/.test(r);
    if (ln && rn) {
      if (Number(l) !== Number(r)) return Number(l) > Number(r);
    } else if (ln !== rn) {
      return rn; // numeric identifiers sort lower than alphanumeric
    } else if (l !== r) {
      return l > r;
    }
  }
  return false;
}

/** Every workspace member under `<root>/packages`, relative and sorted. */
export function packageDirs(root = process.cwd()) {
  const dir = path.join(root, "packages");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "package.json")))
    .map((entry) => `packages/${entry.name}`)
    .sort();
}
