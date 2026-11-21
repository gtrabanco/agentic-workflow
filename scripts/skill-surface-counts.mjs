#!/usr/bin/env node

/**
 * skill-surface-counts.mjs — the skill surface, counted from the tree (issue #668).
 *
 * The class this counter closes: issue #663 was written with three stale skill
 * counts, and they drifted within a day — "13 user-facing skills" (14 carry
 * `user-invocable: true`), "29 `SKILL.md` files" (30) and "14 reference
 * directories" (17). Prose cannot keep a count honest; a machine can. Every
 * committed sentence that renders one of these numbers is a `rendered-facts@1`
 * row in `AGENTS.md`, and this module is the machine those rows resolve: one
 * derivation over `skills/` and the frontmatter each `SKILL.md` carries.
 *
 * The vocabularies (`SKILL_SURFACE_COUNT_MACHINES`) are the names a row cites;
 * `deriveSkillSurfaceCounts` is the only implementation of them, so the drift
 * gate imports this module instead of keeping a second copy of any count.
 *
 * Classification is filled in, never guessed — `user-invocable` is the only
 * source of the user-facing split, `metadata.internal: true` the only reason a
 * skill leaves the discoverable set. A tree this cannot classify refuses with a
 * code and the path, because a count that silently reclassifies a skill is worse
 * than no count.
 *
 * Usage
 *   bun scripts/skill-surface-counts.mjs [--json] [--root <dir>]   (node fallback, same argv)
 *
 * stdout: one `<machine> <value>` line per count, or the same pairs as a JSON
 *   object with `--json`; nothing is printed on a refusal.
 * exit: 0 when every count derives; 1 when the tree cannot be classified (a
 *   `skills/` entry with no `SKILL.md`, a `SKILL.md` with no `user-invocable:`
 *   line, a value other than `true|false`, or `metadata.internal: true` beside
 *   `user-invocable: true`); 2 on a usage error.
 *
 * Read-only: it reads the tree and writes nothing. Its sibling suite is
 * `scripts/skill-surface-counts.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The machine names a `rendered-facts@1` row may cite, in print order. Adding a
 * count means adding its name here and its derivation in
 * `deriveSkillSurfaceCounts` — never a lambda anywhere else.
 */
export const SKILL_SURFACE_COUNT_MACHINES = Object.freeze([
  "count:skill-files",
  "count:user-facing",
  "count:workflow-internals",
  "count:metadata-internal",
  "count:discoverable",
  "count:skill-references",
]);

/** A tree the counter refuses to classify: the code, the path and the detail. */
export class SkillSurfaceRefusal extends Error {
  constructor(code, target, detail) {
    super(`${code} ${target}: ${detail}`);
    this.name = "SkillSurfaceRefusal";
    this.code = code;
    this.target = target;
    this.detail = detail;
  }
}

/** The frontmatter block of a `SKILL.md`, or `null` when the file carries none. */
function frontmatterOf(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---", 3);
  if (end < 0) return null;
  return text.slice(4, end);
}

/** A top-level `key: value` line of the frontmatter. */
function topLevel(front, key) {
  const match = new RegExp(`^${key}:[ \\t]*(.*)$`, "m").exec(front);
  return match === null ? null : match[1].trim();
}

/** The keys of the frontmatter's indented `metadata:` block (one level deep). */
function metadataBlock(front) {
  const lines = front.split("\n");
  const at = lines.findIndex((line) => /^metadata:[ \t]*$/.test(line));
  if (at < 0) return new Map();
  const entries = new Map();
  for (const line of lines.slice(at + 1)) {
    const child = /^[ \t]+([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (child) entries.set(child[1], child[2].trim());
    else if (line.trim() !== "") break;
  }
  return entries;
}

function classifySkill(skillsRoot, name) {
  const target = `skills/${name}/SKILL.md`;
  const abs = path.join(skillsRoot, name, "SKILL.md");
  if (!fs.existsSync(abs)) {
    throw new SkillSurfaceRefusal("missing-skill-file", `skills/${name}`, "a directory under skills/ carries no SKILL.md, so the surface cannot be counted");
  }
  const front = frontmatterOf(fs.readFileSync(abs, "utf8"));
  if (front === null) {
    throw new SkillSurfaceRefusal("missing-user-invocable", target, "the file carries no frontmatter block, so `user-invocable` cannot be read");
  }
  const raw = topLevel(front, "user-invocable");
  if (raw === null) {
    throw new SkillSurfaceRefusal("missing-user-invocable", target, "the frontmatter carries no `user-invocable:` line");
  }
  if (raw !== "true" && raw !== "false") {
    throw new SkillSurfaceRefusal("unknown-user-invocable", target, `\`user-invocable: ${raw}\` is neither true nor false`);
  }
  const userInvocable = raw === "true";
  const internal = metadataBlock(front).get("internal");
  if (internal !== undefined && internal !== "true" && internal !== "false") {
    throw new SkillSurfaceRefusal("unknown-metadata-internal", target, `\`metadata.internal: ${internal}\` is neither true nor false`);
  }
  const metadataInternal = internal === "true";
  if (metadataInternal && userInvocable) {
    throw new SkillSurfaceRefusal("contradictory-internal", target, "`metadata.internal: true` hides a skill the same file marks `user-invocable: true`");
  }
  return {
    name,
    userInvocable,
    metadataInternal,
    hasReferences: fs.existsSync(path.join(skillsRoot, name, "references")),
  };
}

/**
 * Derive every published count from one repository tree. Throws
 * `SkillSurfaceRefusal` on a tree it cannot classify — the caller decides
 * whether that is a red gate or a refusal receipt, and neither invents a value.
 */
export function deriveSkillSurfaceCounts(root) {
  const skillsRoot = path.join(root, "skills");
  if (!fs.existsSync(skillsRoot)) {
    throw new SkillSurfaceRefusal("missing-skills-root", "skills/", "the tree carries no skills/ directory");
  }
  const names = fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (names.length === 0) {
    throw new SkillSurfaceRefusal("missing-skills-root", "skills/", "the tree carries no skill directory");
  }
  const skills = names.map((name) => classifySkill(skillsRoot, name));
  const skillFiles = skills.length;
  const userFacing = skills.filter((skill) => skill.userInvocable).length;
  const metadataInternal = skills.filter((skill) => skill.metadataInternal).length;
  return {
    "count:skill-files": skillFiles,
    "count:user-facing": userFacing,
    "count:workflow-internals": skillFiles - userFacing - metadataInternal,
    "count:metadata-internal": metadataInternal,
    "count:discoverable": skillFiles - metadataInternal,
    "count:skill-references": skills.filter((skill) => skill.hasReferences).length,
  };
}

function usage(stream, message) {
  stream.write(`skill-surface-counts: ${message}\n`);
  stream.write("usage: bun scripts/skill-surface-counts.mjs [--json] [--root <dir>]  (node fallback, same argv)\n");
  process.exit(2);
}

export function main(argv) {
  let json = false;
  let root = DEFAULT_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") json = true;
    else if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined) usage(process.stderr, "--root needs a directory");
      root = path.resolve(value);
      index += 1;
    } else usage(process.stderr, `unknown argument ${arg}`);
  }

  let counts;
  try {
    counts = deriveSkillSurfaceCounts(root);
  } catch (error) {
    if (!(error instanceof SkillSurfaceRefusal)) throw error;
    process.stderr.write(`SKILL SURFACE REFUSAL — ${error.message}\n`);
    return 1;
  }
  if (json) {
    process.stdout.write(`${JSON.stringify(counts, null, 2)}\n`);
    return 0;
  }
  const width = Math.max(...SKILL_SURFACE_COUNT_MACHINES.map((name) => name.length));
  for (const name of SKILL_SURFACE_COUNT_MACHINES) {
    process.stdout.write(`${name.padEnd(width)}  ${counts[name]}\n`);
  }
  return 0;
}

// Run only as a program: the drift gate and the sibling suite import the module,
// and an import must never print a table.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)) ?? process.exitCode ?? 0);
}
