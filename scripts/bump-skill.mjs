#!/usr/bin/env node
/**
 * bump-skill.mjs — the deterministic half of `bump-skill` (issue #180,
 * amendment 2026-09-07): the bump is a script, the skill slims to a wrapper.
 *
 * Applies every mechanically-editable surface atomically for one or more
 * skills:
 *   - the `version:` line in `skills/<name>/SKILL.md` (and nothing else there)
 *   - the per-skill table row in `CHANGELOG.md` (newest row first; creates the
 *     skill's table in the matching User-facing / Internal section when absent)
 *
 * The bump level comes from `--level`, or is inferred from the git diff of the
 * SKILL.md with its derivation printed:
 *   major — the frontmatter `name:` changed (a rename; migration note required)
 *   minor — a new `##` section heading was added
 *   patch — wording-only (no rename, no new sections)
 *
 * Surfaces that need judgment, not editing, are reported on stdout: README
 * skills/model table cells, `argument-hint:` changes, the migration-note
 * requirement for majors, and the `bun run bundle:skills` reminder.
 *
 * Dependency-free (node: builtins only — the node-compat rule). Usage:
 *
 *   node scripts/bump-skill.mjs <skill>... [--level patch|minor|major]
 *        [--date YYYY-MM-DD] [--summary "..."] [--dry-run] [--root DIR]
 *
 * Exit codes: 0 = applied (or dry-run planned), 1 = failure.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = { skills: [], level: null, date: null, summary: null, dryRun: false, root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--level") args.level = argv[++i];
    else if (a === "--date") args.date = argv[++i];
    else if (a === "--summary") args.summary = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--root") args.root = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
    else if (a.startsWith("--")) throw new Error(`unknown flag: ${a}`);
    else args.skills.push(a);
  }
  return args;
}

function usage() {
  return [
    "usage: node scripts/bump-skill.mjs <skill>... [--level patch|minor|major]",
    "                     [--date YYYY-MM-DD] [--summary \"...\"] [--dry-run] [--root DIR]",
    "",
    "Applies the version bump + CHANGELOG rows for the named skills (issue #180).",
    "Without --level the bump is inferred from the git diff of each SKILL.md and",
    "the derivation is printed. --dry-run plans without writing.",
  ].join("\n");
}

const LEVELS = ["major", "minor", "patch"];

function bumpVersion(version, level) {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!m) throw new Error(`not a semver version: ${version}`);
  let [major, minor, patch] = m.slice(1).map(Number);
  if (level === "major") { major += 1; minor = 0; patch = 0; }
  else if (level === "minor") { minor += 1; patch = 0; }
  else patch += 1;
  return `${major}.${minor}.${patch}`;
}

/** Diff of a skill's SKILL.md vs HEAD (worktree + index), or null when unavailable. */
function skillDiff(root, skill) {
  const rel = `skills/${skill}/SKILL.md`;
  const probe = spawnSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], { encoding: "utf8" });
  if (probe.status !== 0 || probe.stdout.trim() !== "true") return null;
  const parts = [];
  for (const extra of [[], ["--cached"]]) {
    const d = spawnSync("git", ["-C", root, "diff", "HEAD", ...extra, "--", rel], { encoding: "utf8" });
    if (d.stdout) parts.push(d.stdout);
  }
  return parts.join("");
}

function inferLevel(diff, skill) {
  const rename = diff.match(/^[-+]name: (\S+)$/gm);
  if (rename && rename.length >= 2) {
    const from = rename.find((l) => l.startsWith("-")).slice(7);
    const to = rename.find((l) => l.startsWith("+")).slice(7);
    return { level: "major", reason: `name: renamed ${from} → ${to}` };
  }
  const newSections = [...diff.matchAll(/^\+## .+$/gm)].map((m) => m[0].slice(1));
  if (newSections.length > 0) {
    return { level: "minor", reason: `new section(s): ${newSections.join(", ")}` };
  }
  return { level: "patch", reason: "no rename, no new sections; wording-only" };
}

/**
 * Insert the bump row into the skill's table in CHANGELOG.md, creating the
 * table in the matching section when the skill has none yet.
 */
function updateChangelog(changelog, { skill, internal, newVersion, date, level, summary }) {
  const row = `| ${newVersion} | ${date} | ${level} | ${summary} |`;
  const anchor = `#### \`${skill}\``;
  const idx = changelog.indexOf(anchor);
  if (idx === -1) {
    const sectionHeader = internal
      ? "### Internal (`user-invocable: false`)"
      : "### User-facing";
    const sIdx = changelog.indexOf(sectionHeader);
    if (sIdx === -1) throw new Error(`CHANGELOG.md has no "${sectionHeader}" section`);
    const table = `${anchor}\n| Version | Date | Type | What changed |\n|---|---|---|---|\n${row}\n`;
    const afterHeader = changelog.indexOf("\n", sIdx) + 1;
    return changelog.slice(0, afterHeader) + "\n" + table + changelog.slice(afterHeader);
  }
  const headerIdx = changelog.indexOf("|---|", idx);
  if (headerIdx === -1) throw new Error(`no version table under ${anchor}`);
  const rowStart = changelog.indexOf("\n", headerIdx) + 1; // newest row first
  return changelog.slice(0, rowStart) + row + "\n" + changelog.slice(rowStart);
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`error: ${e.message}\n${usage()}`);
    process.exit(2);
  }
  if (args.help || args.skills.length === 0) {
    console.log(usage());
    process.exit(args.help ? 0 : 2);
  }
  if (args.level !== null && !LEVELS.includes(args.level)) {
    console.error(`error: --level must be one of ${LEVELS.join(", ")}`);
    process.exit(2);
  }

  const date = args.date ?? new Date().toISOString().slice(0, 10);
  const root = args.root;
  const applied = [];
  const notes = new Set();

  for (const skill of args.skills) {
    const skillPath = path.join(root, "skills", skill, "SKILL.md");
    if (!fs.existsSync(skillPath)) {
      console.error(`error: no such skill: skills/${skill}/SKILL.md (root ${root})`);
      process.exit(1);
    }
    const frontmatter = fs.readFileSync(skillPath, "utf8").split("---")[1] ?? "";
    const internal = /internal:\s*true/.test(frontmatter) || /user-invocable:\s*false/.test(frontmatter);

    let level = args.level;
    let overridden = false;
    const diff = skillDiff(root, skill);
    if (level === null) {
      if (diff === null || diff.trim() === "") {
        console.error(
          `error: cannot infer a bump level for ${skill} (${diff === null ? "not a git repository" : "no git diff"}); pass --level`,
        );
        process.exit(1);
      }
      const inferred = inferLevel(diff, skill);
      level = inferred.level;
      console.log(`inferred level: ${level} (${inferred.reason})`);
    } else {
      overridden = true;
    }

    const versionMatch = /^version: (\d+\.\d+\.\d+)$/m.exec(frontmatter);
    if (!versionMatch) {
      console.error(`error: ${skill} has no frontmatter version:`);
      process.exit(1);
    }
    const oldVersion = versionMatch[1];
    const newVersion = bumpVersion(oldVersion, level);
    const summary = args.summary ?? `${level} bump`;

    console.log(`skill              old → new        bump`);
    console.log(`${skill.padEnd(18)} ${oldVersion} → ${newVersion}   ${level}`);
    if (overridden) console.log(`level overridden to ${level} (--level)`);

    if (args.dryRun) {
      console.log(`dry-run: would set version: ${newVersion} and insert the CHANGELOG row`);
      continue;
    }

    fs.writeFileSync(
      skillPath,
      fs.readFileSync(skillPath, "utf8").replace(
        new RegExp(`^version: ${oldVersion.replace(/\./g, "\\.")}$`, "m"),
        `version: ${newVersion}`,
      ),
    );

    const changelogPath = path.join(root, "CHANGELOG.md");
    fs.writeFileSync(changelogPath, updateChangelog(fs.readFileSync(changelogPath, "utf8"), {
      skill, internal, newVersion, date, level, summary,
    }));

    // Judgment surfaces — reported, never silently skipped.
    if (diff !== null && /^[+-].*argument-hint:/m.test(diff)) {
      notes.add("argument-hint changed in this diff — review the frontmatter hint");
    }
    if (level !== "patch") {
      notes.add(`review the README.md skills-table cell for ${skill} (minor/major)`);
    }
    if (level === "major") {
      notes.add("migration note required: append the migration to docs/workflow/MIGRATION.md and update stale cross-references under docs/ and skills/");
    }
    applied.push({ skill, oldVersion, newVersion, level });
  }

  for (const note of notes) console.log(`note: ${note}`);
  if (!args.dryRun) {
    console.log('note: run `bun run bundle:skills` before publishing (restages the pi package skill bundle)');
  }
  if (args.dryRun) console.log("dry-run: no files written");
  process.exit(0);
}

main();
