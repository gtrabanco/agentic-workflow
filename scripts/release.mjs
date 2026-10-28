#!/usr/bin/env node
/**
 * release.mjs — the deterministic release pipeline (feature 40, issue #180).
 *
 * Consumes the accumulated `.changeset/*.md` intent files (changesets FILE
 * FORMAT, not the tool — see scripts/lint-changeset.mjs) and computes one
 * release plan:
 *
 *   latest  — the unified version train: ALL packages carry the train version
 *             (SPEC AC-03 / D-40-2), companion CHANGELOG rows are written, and
 *             the `vX.Y.Z` git tag + `stable` branch push are planned at the
 *             release commit (#156: downstream tools pin a stable ref).
 *   canary  — `<base>-canary.<yyyymmdd>.<n>` (Bun-style, D-40-3), deterministic
 *             at the same state (AC-12); only packages declared in the
 *             changesets are listed (AC-08 package filter); never moves
 *             `latest` (PE-003).
 *   alpha|beta|rc — manual promotions, `<base>-<channel>.<n>`, published under
 *             their own dist-tag (AC-06/AC-09).
 *   --version OVERRIDE — force the version (marketing override, D-40-4); the
 *             release body is marked "Version forced by operator: X.Y.Z"
 *             (AC-10) and the version must not collide with an existing tag.
 *
 * Modes: `plan` (default, read-only — also what --dry-run means here) and
 * `apply` (writes package.json versions + CHANGELOG companion rows for the
 * latest channel). git/npm/gh commands are always PRINTED, never executed —
 * an operator or workflow runs them. GitHub Release notes use
 * `--generate-notes` so merged PR authors are credited (AC-15, PE-004).
 *
 * Dependency-free (node: builtins only — the node-compat rule, AC-01).
 *
 * Usage:
 *   node scripts/release.mjs [plan|apply] [--channel latest|canary|alpha|beta|rc]
 *        [--version X.Y.Z] [--base X.Y.Z] [--date YYYY-MM-DD] [--summary "..."]
 *        [--root DIR]
 *
 * Exit codes: 0 = plan produced / applied, 1 = failure, 2 = usage error.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseChangeset } from "./lint-changeset.mjs";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHANNELS = ["latest", "canary", "alpha", "beta", "rc"];
const LEVELS = ["patch", "minor", "major"];

function usage() {
  return [
    "usage: node scripts/release.mjs [plan|apply] [--channel latest|canary|alpha|beta|rc]",
    "                     [--version X.Y.Z] [--base X.Y.Z] [--date YYYY-MM-DD]",
    "                     [--summary \"...\"] [--root DIR]",
    "",
    "Deterministic release pipeline for the unified version train (issue #180).",
    "`plan` (default) is read-only; `apply` writes package versions + CHANGELOG",
    "companion rows for the latest channel. git/npm/gh commands are printed,",
    "never executed.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { mode: "plan", channel: "latest", version: null, base: null, date: null, summary: null, root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "plan" || a === "apply") args.mode = a;
    else if (a === "--channel") args.channel = argv[++i];
    else if (a === "--version") args.version = argv[++i];
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--date") args.date = argv[++i];
    else if (a === "--summary") args.summary = argv[++i];
    else if (a === "--root") args.root = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

// --- semver helpers ---------------------------------------------------------

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function bumpVersion(version, level) {
  const m = SEMVER_RE.exec(version);
  if (!m) fail(`base must be a stable X.Y.Z version, got: ${version}`);
  let [major, minor, patch] = m.slice(1).map(Number);
  if (level === "major") { major += 1; minor = 0; patch = 0; }
  else if (level === "minor") { minor += 1; patch = 0; }
  else patch += 1;
  return `${major}.${minor}.${patch}`;
}

// --- repo state -------------------------------------------------------------

function git(root, args) {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

function isGitRepo(root) {
  return git(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
}

function stableTags(root) {
  const out = git(root, ["tag", "-l", "v*"]) ?? "";
  return out.split("\n").filter((t) => SEMVER_RE.test(t.slice(1)));
}

function channelTagCounter(root, base, stamp, channel) {
  const out = git(root, ["tag", "-l", `v${base}-${channel}.${stamp}.*`]) ?? "";
  const counters = out
    .split("\n")
    .filter(Boolean)
    .map((t) => Number(t.split(".").pop()))
    .filter(Number.isFinite);
  return counters.length > 0 ? Math.max(...counters) : 0;
}

/** Highest stable v-tag, or null when the repo has none / is not a repo. */
function lastStableTag(root) {
  const tags = stableTags(root);
  if (tags.length === 0) return null;
  const key = (t) => t.slice(1).split(".").map(Number);
  tags.sort((a, b) => {
    const [a1, a2, a3] = key(a);
    const [b1, b2, b3] = key(b);
    return b1 - a1 || b2 - a2 || b3 - a3;
  });
  return tags[0].slice(1);
}

function readPackages(root) {
  const dir = path.join(root, "packages");
  if (!fs.existsSync(dir)) fail(`no packages/ directory under ${root}`);
  const packages = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(dir, entry.name, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    packages.push({ name: json.name, dirName: entry.name, version: json.version, path: pkgPath });
  }
  return packages;
}

function readChangesets(root) {
  const dir = path.join(root, ".changeset");
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();
  const parsed = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const result = parseChangeset(content);
    if (!result.ok) fail(`malformed changeset ${file}: ${result.error}`);
    parsed.push({ file, ...result });
  }
  return parsed;
}

function highestLevel(changesets) {
  const seen = new Set(changesets.flatMap((c) => c.entries.map((e) => e.level)));
  for (const level of [...LEVELS].reverse()) if (seen.has(level)) return level;
  return null;
}

// --- apply (latest channel) --------------------------------------------------

function setPackageVersion(pkgPath, version) {
  const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  json.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
}

function insertCompanionRow(changelogPath, { name, dirName, version, date, level, summary }) {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const anchor = `#### [\`${name}\`](packages/${dirName}/)`;
  const idx = changelog.indexOf(anchor);
  if (idx === -1) {
    fail(`CHANGELOG.md has no "Companion npm packages" table for ${name} (expected ${anchor})`);
  }
  const headerIdx = changelog.indexOf("|---|", idx);
  const rowStart = changelog.indexOf("\n", headerIdx) + 1; // newest row first
  const row = `| ${version} | ${date} | ${level} | ${summary} |`;
  fs.writeFileSync(changelogPath, changelog.slice(0, rowStart) + row + "\n" + changelog.slice(rowStart));
}

// --- main ---------------------------------------------------------------------

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`error: ${e.message}\n${usage()}`);
    process.exit(2);
  }
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!CHANNELS.includes(args.channel)) {
    fail(`--channel must be one of ${CHANNELS.join(", ")}`);
  }
  const root = args.root;
  const date = args.date ?? new Date().toISOString().slice(0, 10);
  const stamp = date.replaceAll("-", "");
  const packages = readPackages(root);
  const changesets = readChangesets(root);
  const declared = new Set(changesets.flatMap((c) => c.entries.map((e) => e.pkg)));
  const forced = args.version !== null;
  const gitRepo = isGitRepo(root);

  // Resolve the base (last stable v-tag by default) and the release version.
  // A forced latest release needs no base to compute from — the operator named
  // the exact version (D-40-4); the base is then display-only.
  let base = args.base ?? lastStableTag(root);
  if (!base && forced && args.channel === "latest") base = args.version;
  if (!base) fail("no --base given and the repository has no stable v* tag to compute from");
  if (!SEMVER_RE.test(base)) fail(`base must be a stable X.Y.Z version, got: ${base}`);

  let version;
  let level = highestLevel(changesets);
  if (forced) {
    if (!SEMVER_RE.test(args.version)) fail(`--version must be a stable X.Y.Z version, got: ${args.version}`);
    version = args.version;
    if (gitRepo && stableTags(root).includes(`v${version}`)) {
      fail(`version ${version} collides with the existing tag v${version} — versions are immutable`);
    }
  } else {
    if (changesets.length === 0) {
      fail(`no changeset intent in ${path.join(root, ".changeset")} and no --version override — no release intent`);
    }
    version = bumpVersion(base, level);
  }

  console.log(`release plan — channel: ${args.channel}, mode: ${args.mode}, base: ${base}, date: ${date}`);
  if (forced) console.log(`Version forced by operator: ${version}`);

  // Per-channel version + commands.
  const notesBodies = changesets.map((c) => c.body.join("\n"));
  if (args.channel === "latest") {
    console.log(`train version: ${version} (highest bump: ${level ?? "n/a — forced"}); unified train: all packages carry it`);
    for (const pkg of packages) {
      console.log(`${pkg.name}: ${pkg.version} → ${version} (packages/${pkg.dirName}/)`);
    }
    if (args.mode === "apply") {
      const summary = args.summary ?? `Release ${version}`;
      for (const pkg of packages) {
        setPackageVersion(pkg.path, version);
        insertCompanionRow(path.join(root, "CHANGELOG.md"), {
          name: pkg.name, dirName: pkg.dirName, version,
          date, level: level ?? "patch", summary,
        });
      }
      console.log(`applied: ${packages.length} package.json version(s) + ${packages.length} CHANGELOG companion row(s)`);
    }
    const body = [...notesBodies];
    if (forced) body.push(`Version forced by operator: ${version}`);
    const notes = body.join("\n\n").replaceAll('"', '\\"');
    console.log("commands (run at the release commit):");
    console.log(`  git tag v${version}`);
    console.log(`  git push origin v${version}`);
    console.log(`  git push origin HEAD:refs/heads/stable`);
    console.log(`  gh release create v${version} --generate-notes --notes "${notes}"`);
  } else {
    // canary / alpha / beta / rc — prerelease of the base, never touching latest.
    const n = gitRepo ? channelTagCounter(root, base, stamp, args.channel) + 1 : 1;
    const prerelease = `${base}-${args.channel}.${args.channel === "canary" ? `${stamp}.${n}` : n}`;
    console.log(`version: ${prerelease}`);
    const listed = packages.filter((p) => declared.has(p.name));
    for (const pkg of listed) {
      console.log(`${pkg.name}: ${pkg.version} → ${prerelease} (packages/${pkg.dirName}/)`);
    }
    console.log(`packages: ${listed.length} declared in changesets, ${packages.length - listed.length} skipped (not declared)`);
    console.log("commands (per declared package):");
    for (const pkg of listed) {
      console.log(`  cd packages/${pkg.dirName} && npm version ${prerelease} --no-git-tag-version && npm publish --tag ${args.channel} && git checkout -- package.json`);
    }
    console.log(`note: ${args.channel} never moves the latest dist-tag; publish it with the workflow's channel input or by hand`);
  }

  if (args.mode === "plan") console.log("plan only — nothing written");
  process.exit(0);
}

main();
