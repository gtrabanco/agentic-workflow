#!/usr/bin/env node
/**
 * npm-version-gate.mjs — decide whether this run may `npm publish`.
 *
 * WHY (2026-09-27, run 36355201053): the three publish workflows each compared
 * the local version against `npm view <name> version` — the registry's `latest`
 * dist-tag. A revert walked main's version backwards (0.18.0 → 0.17.0) while
 * 0.17.0 was itself already published, so "local ≠ latest" read as "must
 * publish" and npm refused the run with
 * `EBADVERSION — You cannot publish over the previously published versions: 0.17.0`.
 * The question is not "is local the newest release?" but "does this exact
 * version already exist on the registry?" — a dist-tag can never answer it.
 *
 * Pure decision (`decidePublish`) + a thin CLI. Registry read:
 * `npm view <name> versions --json` (the full list, never `version` alone).
 *
 * stdout — safe to append straight to `$GITHUB_OUTPUT`:
 *   publish=true|false
 *   notice=<one line, only when the decision hides something>   (optional)
 * Diagnostics go to stderr. Exit codes: 0 = decision made, 2 = usage error or
 * unreadable package.json (fail closed — no decision, so nothing publishes).
 *
 *   node scripts/npm-version-gate.mjs [--package <path>] [--published <versions-json>]
 *
 * `--published` injects the registry's version list (tests; no network).
 * Without it the script reads `./package.json` (the workflow's
 * working-directory) for the package name and version.
 *
 * Pure Node ESM, node: builtins only — runs identically under bun and node.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** x.y.z (+ optional prerelease) compared numerically; an unparsable side sorts lowest. */
export function compareSemver(a, b) {
  const parse = (v) => {
    const m = /^(\d+)\.(\d+)\.(\d+)(?:-(\S+))?/.exec(String(v));
    return m ? [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ?? null] : null;
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return pa === pb ? 0 : pa ? 1 : pb ? -1 : 0;
  for (let i = 0; i < 3; i += 1) if (pa[i] !== pb[i]) return pa[i] > pb[i] ? 1 : -1;
  if (pa[3] === pb[3]) return 0;
  if (pa[3] === null) return 1; // 1.0.0 > 1.0.0-rc1
  if (pb[3] === null) return -1;
  return pa[3] > pb[3] ? 1 : -1;
}

/** npm returns a bare string for a single-version package and [] (or nothing) for none. */
const toList = (published) => {
  if (published === null || published === undefined) return [];
  if (Array.isArray(published)) return published.map(String);
  if (typeof published === "string" && published.trim()) return [published];
  if (typeof published === "object" && Array.isArray(published.versions)) return published.versions.map(String);
  return [];
};

/**
 * @param {{local: string, published: string[]|string|null, lookupError?: boolean}} input
 * @returns {{publish: boolean, notice: string|null}}
 */
export function decidePublish({ local, published, lookupError = false }) {
  if (lookupError) {
    return {
      publish: true,
      notice: `the registry version list could not be read — publishing ${local} without a version check`,
    };
  }
  const versions = toList(published);
  if (versions.length === 0) {
    return { publish: true, notice: null }; // not on the registry yet; the first publish is manual
  }
  const latest = versions.reduce((best, v) => (compareSemver(v, best) > 0 ? v : best), versions[0]);

  if (versions.includes(local)) {
    // The incident's branch: already published, so `npm publish` would hard-fail.
    if (compareSemver(local, latest) < 0) {
      return {
        publish: false,
        notice: `local ${local} is already on the registry but ${latest} holds \`latest\` — skipping; moving \`latest\` back needs a forward version bump`,
      };
    }
    return { publish: false, notice: null };
  }
  if (compareSemver(local, latest) < 0) {
    return {
      publish: true,
      notice: `publishing ${local} while ${latest} holds \`latest\` — the \`latest\` tag will move backwards`,
    };
  }
  return { publish: true, notice: null };
}

function parseArgs(argv) {
  const out = { package: null, published: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--package" || flag === "--published") {
      if (i + 1 >= argv.length) return null;
      out[flag.slice(2)] = argv[i + 1];
      i += 1;
    } else {
      return null;
    }
  }
  return out;
}

function lookupRegistry(name) {
  const res = spawnSync("npm", ["view", name, "versions", "--json"], { encoding: "utf8" });
  if (res.status !== 0) return { published: null, lookupError: true };
  try {
    return { published: JSON.parse(res.stdout || "[]"), lookupError: false };
  } catch {
    return { published: null, lookupError: true };
  }
}

function main(argv) {
  const args = parseArgs(argv);
  if (!args) {
    console.error("usage: npm-version-gate.mjs [--package <path>] [--published <versions-json>]");
    return 2;
  }

  const pkgPath = path.resolve(args.package ?? path.join(process.cwd(), "package.json"));
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    console.error(`npm-version-gate: cannot read ${pkgPath}`);
    return 2;
  }
  if (!pkg?.name || !pkg?.version) {
    console.error(`npm-version-gate: ${pkgPath} has no name/version`);
    return 2;
  }

  let published;
  let lookupError = false;
  if (args.published !== undefined) {
    try {
      published = JSON.parse(args.published);
    } catch {
      console.error("npm-version-gate: --published is not valid JSON");
      return 2;
    }
  } else {
    ({ published, lookupError } = lookupRegistry(pkg.name));
  }

  const decision = decidePublish({ local: String(pkg.version), published, lookupError });
  console.error(
    `npm-version-gate: package=${pkg.name} local=${pkg.version} published=${JSON.stringify(toList(published))}` +
      `${lookupError ? " (lookup failed)" : ""} → ${decision.publish ? "publish" : "skip"}`,
  );
  console.log(`publish=${decision.publish}`);
  if (decision.notice) console.log(`notice=${decision.notice}`);
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) process.exit(main(process.argv.slice(2)));
