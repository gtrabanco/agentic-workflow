#!/usr/bin/env node
/**
 * changeset-create.mjs — creates the PR's changeset intent file by code
 * (D-40-16): the affected packages and skills are derived from the modified
 * files, the semver from the conventional commit title, and the file name is
 * PR-first so names stay unique across branches.
 *
 *   level   --level patch|minor|major overrides; otherwise inferred from the
 *           branch's conventional commits: any `!` or BREAKING CHANGE → major,
 *           any feat → minor, anything else → patch. The derivation prints.
 *   name    `<PR number | branch slug>-<title slug>.md` — pass --pr when the
 *           PR exists; the branch slug leads otherwise. --name overrides.
 *   entries ONE file per PR: every affected package (`"@gtrabanco/<name>"`)
 *           and skill (`"<skill-name>"`) becomes an entry with the change's
 *           intention; the body is the commit title (or --message).
 *
 * The file is never overwritten: a second run on the same branch fails and
 * names the existing file. A change that touches no package or skill is
 * refused — an empty changeset would be silent intent.
 *
 * Dependency-free (node: builtins only). Usage:
 *
 *   node scripts/changeset-create.mjs [--level patch|minor|major]
 *        [--message "..."] [--name <stem>] [--pr <number>] [--base <ref>]
 *        [--root DIR]
 *
 * Exit codes: 0 = created, 1 = failure, 2 = usage error.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEVELS = ["patch", "minor", "major"];

function usage() {
  return [
    "usage: node scripts/changeset-create.mjs [--level patch|minor|major]",
    "                     [--message \"...\"] [--name <stem>] [--pr <number>]",
    "                     [--base <ref>] [--root DIR]",
    "",
    "Creates the PR's changeset intent file: affected packages and skills",
    "derived from the modified files, the semver from the conventional commit",
    "title, one file per PR with as many entries as the change needs.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { level: null, message: null, name: null, pr: null, base: null, root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--level") args.level = argv[++i];
    else if (a === "--message") args.message = argv[++i];
    else if (a === "--name") args.name = argv[++i];
    else if (a === "--pr") args.pr = argv[++i];
    else if (a === "--base") args.base = argv[++i];
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

function git(root, args) {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

function slug(text) {
  const s = String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return s || "changeset";
}

/** The changed paths: committed range vs base unioned with the working tree. */
function changedFiles(root, base) {
  const committed = git(root, ["diff", "--name-only", `${base}...HEAD`]) ?? "";
  const dirty = git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"]) ?? "";
  const files = new Set(committed.split("\n").filter(Boolean));
  for (const entry of dirty.split("\0")) {
    if (entry.length < 4) continue;
    files.add(entry.replace(/^(.{2}) /, "").slice(2));
  }
  return [...files];
}

function inferLevel(root) {
  const message = git(root, ["log", "-1", "--pretty=%s%n%n%b"]) ?? "";
  const subject = message.split("\n")[0] ?? "";
  const breaking = /\bBREAKING[- ]CHANGE\b/.test(message) || /^.\w+(\([\w./-]+\))?!:/.test(subject);
  const feat = /^feat(\(|:|!)/.test(subject);
  const level = breaking ? "major" : feat ? "minor" : "patch";
  const why = breaking
    ? "breaking: the title carries ! or a BREAKING CHANGE footer"
    : feat
      ? "feat: a feature commit leads the branch"
      : "no feat and no breaking marker: patch";
  return { level, why, subject };
}

function readPackages(root) {
  const dir = path.join(root, "packages");
  const names = new Map(); // dirName → package name
  if (!fs.existsSync(dir)) return names;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(dir, entry.name, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    try {
      const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      if (json.name) names.set(entry.name, json.name);
    } catch {
      // an unparsable manifest is not this tool's finding
    }
  }
  return names;
}

function readSkills(root) {
  const dir = path.join(root, "skills");
  const names = new Set();
  if (!fs.existsSync(dir)) return names;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "SKILL.md"))) names.add(entry.name);
  }
  return names;
}

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
  if (args.level !== null && !LEVELS.includes(args.level)) {
    fail(`--level must be one of ${LEVELS.join(", ")}`);
  }

  const base = args.base ?? (["origin/main", "main"].find((ref) => git(args.root, ["rev-parse", "--verify", "--quiet", ref])) ?? "main");
  const files = changedFiles(args.root, base).filter((f) => !f.startsWith(".changeset/"));

  const packages = readPackages(args.root);
  const skills = readSkills(args.root);
  const affectedPackages = new Map(); // package name → dirName
  const affectedSkills = new Set();
  for (const file of files) {
    const pkgMatch = /^packages\/([^/]+)\//.exec(file);
    if (pkgMatch && packages.has(pkgMatch[1])) affectedPackages.set(packages.get(pkgMatch[1]), pkgMatch[1]);
    const skillMatch = /^skills\/([^/]+)\//.exec(file);
    if (skillMatch && skills.has(skillMatch[1])) affectedSkills.add(skillMatch[1]);
  }
  if (affectedPackages.size === 0 && affectedSkills.size === 0) {
    fail(`no package or skill is touched by the ${files.length} changed file(s) vs ${base} — nothing to declare`);
  }

  let level = args.level;
  let derivation = "level overridden (--level)";
  if (level === null) {
    const inferred = inferLevel(args.root);
    level = inferred.level;
    derivation = inferred.why;
  }
  console.log(`level: ${level} (${derivation})`);

  const entryLines = [
    ...[...affectedPackages.keys()].sort().map((name) => `"${name}": ${level}`),
    ...[...affectedSkills].sort().map((name) => `"${name}": ${level}`),
  ];
  const message = args.message ?? inferLevel(args.root).subject;
  const content = ["---", ...entryLines, "---", "", message.trim(), ""].join("\n");

  let stem;
  if (args.name !== null) stem = slug(args.name);
  else {
    const branch = slug(git(args.root, ["rev-parse", "--abbrev-ref", "HEAD"]) ?? "branch");
    const pr = args.pr !== null ? String(args.pr) : branch;
    const title = slug(inferLevel(args.root).subject);
    stem = [pr, title].filter(Boolean).join("-");
  }

  const dir = path.join(args.root, ".changeset");
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${stem}.md`);
  if (fs.existsSync(target)) {
    fail(`${path.relative(args.root, target)} already exists — edit it or pass --name (files are never overwritten)`);
  }
  fs.writeFileSync(target, content);
  console.log(`created: ${path.relative(args.root, target)}`);
  for (const line of entryLines) console.log(`  ${line}`);
  console.log("note: scripts/lint-changeset.mjs validates it; scripts/release.mjs consumes it at cut time");
  process.exit(0);
}

// Only run when executed directly (the tests import nothing, but a stray
// import must not create a changeset in whatever repo the importer lives in).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
