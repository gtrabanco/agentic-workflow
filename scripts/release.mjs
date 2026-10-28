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
 * Modes: `plan` (default, read-only — `--dry-run` is an accepted alias) and
 * `apply` (writes package.json versions + CHANGELOG companion rows for the
 * latest channel, then deletes the consumed `.changeset/*.md` files so the
 * next cut carries only new intent). `--version` forces the LATEST train
 * only — prerelease channels compute their own version and reject it. git/npm/gh
 * commands are always PRINTED, never executed —
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
    "companion rows for the latest channel and consumes the applied changesets.",
    "--version forces the latest train only. git/npm/gh commands are printed,",
    "never executed.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { mode: "plan", channel: "latest", version: null, base: null, date: null, summary: null, root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "plan" || a === "apply" || a === "release-notes" || a === "publish-plan") args.mode = a;
    else if (a === "--channel") args.channel = argv[++i];
    else if (a === "--version") args.version = argv[++i];
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--date") args.date = argv[++i];
    else if (a === "--summary") args.summary = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
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

/**
 * Dependency closure (owner-directed, feature 40 follow-up): every exact
 * pin a package holds on ANOTHER local package must equal the train version —
 * the parity gate's --pins half fails a pin whose target has published a
 * newer version, and npm refuses to walk a version back. Non-exact ranges
 * (peer/^/~) and foreign packages are never touched.
 */
function rewriteLocalPins(root, packages, version) {
  const local = new Map(packages.map((p) => [p.name, p]));
  const rewrites = [];
  for (const pkg of packages) {
    const json = JSON.parse(fs.readFileSync(pkg.path, "utf8"));
    const deps = json.dependencies ?? {};
    let changed = false;
    for (const [dep, spec] of Object.entries(deps)) {
      if (!local.has(dep) || !SEMVER_RE.test(String(spec)) || spec === version) continue;
      deps[dep] = version;
      changed = true;
      console.log(`pin: ${pkg.name} ${dep} ${spec} → ${version}`);
    }
    if (changed) fs.writeFileSync(pkg.path, JSON.stringify(json, null, 2) + "\n");
    rewrites.push({ pkg: pkg.name, changed });
  }
  return rewrites;
}

function insertCompanionRow(changelogPath, { name, dirName, version, date, level, summary }) {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const rowStart = companionRowStart(changelog, { name, dirName });
  const row = `| ${version} | ${date} | ${level} | ${summary} |`;
  fs.writeFileSync(changelogPath, changelog.slice(0, rowStart) + row + "\n" + changelog.slice(rowStart));
}

/**
 * Locate the insert position for a package's companion row — the first line
 * under the package's table grid (newest row first). Fails closed: a missing
 * anchor or a grid-less table must never be written into (an indexOf(-1)
 * once landed the row at offset 1, silently corrupting the file).
 */
function companionRowStart(changelog, { name, dirName }) {
  const anchor = `#### [\`${name}\`](packages/${dirName}/)`;
  const idx = changelog.indexOf(anchor);
  if (idx === -1) {
    fail(`CHANGELOG.md has no "Companion npm packages" table for ${name} (expected ${anchor})`);
  }
  const headerIdx = changelog.indexOf("|---|", idx);
  if (headerIdx === -1) {
    fail(`CHANGELOG.md companion table for ${name} has no "|---|" grid under its heading — repair the table before applying`);
  }
  return changelog.indexOf("\n", headerIdx) + 1; // newest row first
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
  if (args.mode === "publish-plan" && args.channel === "latest") {
    fail("publish-plan is for prerelease channels — channel latest cuts the train with apply");
  }
  if (args.dryRun && args.mode !== "plan") {
    fail("--dry-run plans only — drop it to run apply");
  }
  if (args.mode !== "release-notes" && args.version !== null && args.channel !== "latest") {
    // A prerelease channel computes its own version — an operator-supplied
    // --version there must fail loudly, never be silently ignored (the old
    // behavior printed "Version forced by operator: undefined" and succeeded).
    fail(`--version forces the latest train only — channel ${args.channel} computes its own prerelease version`);
  }
  const root = args.root;
  const date = args.date ?? new Date().toISOString().slice(0, 10);
  const stamp = date.replaceAll("-", "");
  const packages = readPackages(root);
  const changesets = readChangesets(root);

  // release-notes — the assembled release body for `gh release create
  // --notes-file`: the accumulated changeset bodies (the changeset IS the
  // release note), plus the forced-version marker when D-40-4 applies. No
  // base, no version computation, no writes.
  if (args.mode === "release-notes") {
    const bodies = changesets.map((c) => c.body.join("\n"));
    if (args.version !== null) {
      if (!SEMVER_RE.test(args.version)) fail(`--version must be a stable X.Y.Z version, got: ${args.version}`);
      bodies.push(`Version forced by operator: ${args.version}`);
    }
    console.log(bodies.join("\n\n"));
    process.exit(0);
  }

  const declared = new Set(changesets.flatMap((c) => c.entries.map((e) => e.pkg)));
  const forced = args.version !== null;
  const gitRepo = isGitRepo(root);

  // Resolve the base: the last stable v-tag, else the highest package version
  // (the first release — deterministic and printed, never guessed in silence).
  // A forced latest release needs no base to compute from — the operator named
  // the exact version (D-40-4); the base is then display-only.
  let base = args.base ?? lastStableTag(root);
  let baseNote = "";
  // The train never cuts below what is already published: a stale v-tag (or
  // its absence) must not downgrade the train below a package version npm
  // would refuse to walk back.
  const pkgVersions = packages.map((p) => p.version).filter((v) => SEMVER_RE.test(v));
  const newer = (a, b) => {
    const [a1, a2, a3] = a.split(".").map(Number);
    const [b1, b2, b3] = b.split(".").map(Number);
    return b1 - a1 || b2 - a2 || b3 - a3;
  };
  const highestPkg = [...pkgVersions].sort(newer)[0];
  if (!args.base && highestPkg && (!base || newer(base, highestPkg) > 0)) {
    base = highestPkg;
    baseNote = baseNote || (stableTags(root).length === 0
      ? " (highest package version — no stable v-tag)"
      : " (highest package version — above the stale v-tag)" );
  } else if (!base) {
    if (pkgVersions.length > 0) {
      base = highestPkg;
      baseNote = " (highest package version — no stable v-tag)";
    }
  }
  if (!base && forced && args.channel === "latest") base = args.version;
  if (!base) fail("no --base given and neither a stable v* tag nor a package version provides one");
  if (!SEMVER_RE.test(base)) fail(`base must be a stable X.Y.Z version, got: ${base}`);

  let version;
  const level = highestLevel(changesets);
  if (args.channel === "latest") {
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
  }

  const human = args.mode !== "publish-plan"; // machine modes print TSV only
  if (human) console.log(`release plan — channel: ${args.channel}, mode: ${args.mode}, base: ${base}${baseNote}, date: ${date}`);
  if (forced) console.log(`Version forced by operator: ${version}`);

  // Per-channel version + commands.
  const notesBodies = changesets.map((c) => c.body.join("\n"));
  if (changesets.length > 0 && human) {
    console.log(`changesets (${changesets.length}):`);
    for (const c of changesets) {
      for (const e of c.entries) {
        console.log(`  ${c.file}: ${e.pkg}=${e.level} — ${c.body[0] ?? ""}`);
      }
    }
  }
  if (args.channel === "latest") {
    // The changelog row summary IS the release note: the accumulated changeset
    // bodies (first line each, file order), unless the operator names one.
    const summary = args.summary ?? (changesets.length > 0
      ? changesets.map((c) => c.body[0]).join(" · ")
      : `Release ${version}`);
    console.log(`train version: ${version} (highest bump: ${level ?? "n/a — forced"}); unified train: all packages carry it`);
    for (const pkg of packages) {
      console.log(`${pkg.name}: ${pkg.version} → ${version} (packages/${pkg.dirName}/)`);
    }
    if (args.mode === "apply") {
      // Pre-flight before ANY write: every package's companion table must
      // carry its anchor + grid — a failed apply leaves zero writes.
      const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
      for (const pkg of packages) companionRowStart(changelog, { name: pkg.name, dirName: pkg.dirName });
      for (const pkg of packages) {
        setPackageVersion(pkg.path, version);
        insertCompanionRow(path.join(root, "CHANGELOG.md"), {
          name: pkg.name, dirName: pkg.dirName, version,
          date, level: level ?? "patch", summary,
        });
      }
      rewriteLocalPins(root, packages, version);
      // Consume the intent that was just applied — the changesets-tool
      // behavior this format adopted. Without the deletion the files ride
      // into the next cut, whose bump level and notes then re-apply stale
      // intent. The release commit (git add -A in the cut job) records it.
      for (const c of changesets) fs.unlinkSync(path.join(root, ".changeset", c.file));
      console.log(`consumed: removed ${changesets.length} applied changeset file(s) from .changeset/`);
      console.log("note: exact pins moved with the train — run `bun install` in each touched package to refresh its lockfile before committing");
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
    const listed = packages.filter((p) => declared.has(p.name));
    // Machine-readable plan for the publish workflow's channel job: one TSV
    // line per declared package (name, dir, version, dist-tag).
    if (args.mode === "publish-plan") {
      for (const pkg of listed) {
        console.log(`${pkg.name}\t${pkg.dirName}\t${prerelease}\t${args.channel}`);
      }
      process.exit(0);
    }
    console.log(`version: ${prerelease}`);
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
