import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { WorkflowCommand } from "./types.js";

/**
 * The command catalogue: one entry per bundled `user-invocable: true` skill,
 * named exactly after that skill's frontmatter `name:` (SPEC S3, D-P9).
 *
 * The rule is intentionally the bundler's rule, read from the OTHER side:
 * `scripts/bundle-skills.mjs` decides what ships at build time, this module
 * decides what is callable at runtime. Both scan the same three frontmatter
 * fields, and `test/skill-parity.test.mjs` + `test/alias-coverage.test.mjs`
 * pin the two views against the live tree, so a skill that stops being
 * user-invocable loses its command in the same commit.
 */

const SKILL_FILE = "SKILL.md";

export interface SkillMeta {
  /** Directory name inside the bundle — the fallback when `name:` is absent. */
  dir: string;
  name: string;
  description?: string;
  userInvocable: boolean;
}

/**
 * Minimal frontmatter reader: `name`, `description`, `user-invocable` only.
 *
 * `user-invocable` must say `true` to count: this repository's own rule
 * (CLAUDE.md — the key "REQUIRED for it to appear in the agent's /command menu")
 * makes absence mean internal, and `scripts/bundle-skills.mjs` reads it the same
 * way. The two scanners agree because the rule is stated once per scanner and
 * pinned by `test/alias-coverage.test.mjs`, not because either default is safe.
 */
export function readSkillMeta(text: string, dir: string): SkillMeta {
  const lines = text.split(/\r?\n/u);
  const meta: SkillMeta = { dir, name: dir, userInvocable: false };
  if (lines[0]?.trim() !== "---") return meta;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim() === "---") break;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const rawValue = line.slice(colon + 1).trim();
    const value = rawValue.replace(/^["']|["']$/gu, "");

    // YAML block scalars: `description: >` (folded) / `description: |` (literal)
    // carry their content on the following indented lines, not inline. Collect
    // those continuation lines (they never start a top-level `key: value` line)
    // and advance the loop past them. ">" is not a description, so the old
    // line-oriented reader storing `>` is the bug (#165).
    if (key === "description" && (value === ">" || value === "|")) {
      const folded = value === ">";
      const collected: string[] = [];
      let cursor = index + 1;
      for (; cursor < lines.length; cursor += 1) {
        const next = lines[cursor]!;
        if (next.trim() === "---") break;
        // A non-empty, non-indented line starts the next top-level key.
        if (next !== "" && !/^[ \t]/u.test(next)) break;
        collected.push(next);
      }
      meta.description = buildBlockScalar(collected, folded);
      // Outer loop += 1 moves past the last consumed continuation line.
      index = cursor - 1;
      continue;
    }

    if (key === "name" && value !== "") meta.name = value;
    else if (key === "description" && value !== "") meta.description = value;
    else if (key === "user-invocable") meta.userInvocable = value === "true";
  }
  return meta;
}

/**
 * Assemble a YAML block scalar from its collected, indented continuation lines.
 *
 * Strip the common leading indentation, then: folded (`>`) joins non-blank
 * lines into a single space-separated string (blank lines become page breaks);
 * literal (`|`) preserves the line breaks. Both are trimmed of outer blank
 * whitespace so the value matches the frontmatter's intended text.
 */
function buildBlockScalar(lines: string[], folded: boolean): string {
  const nonEmpty = lines.filter((line) => line.length > 0);
  const indent = nonEmpty.reduce((min, line) => {
    const width = /^[ \t]*/u.exec(line)![0].length;
    return Math.min(min, width);
  }, Number.POSITIVE_INFINITY);
  if (!Number.isFinite(indent)) return "";

  const unindented = lines.map((line) => (line.length === 0 ? "" : line.slice(indent)));
  if (!folded) return unindented.join("\n").trim();

  const parts: string[] = [];
  let pendingBreak = false;
  for (const raw of unindented) {
    const line = raw.trimEnd();
    if (line === "") {
      pendingBreak = true;
      continue;
    }
    if (pendingBreak && parts.length > 0) parts.push("\n");
    pendingBreak = false;
    parts.push(line);
  }
  return parts.join(" ").replace(/ \n/g, "\n").trim();
}

export interface CatalogueIssue {
  dir: string;
  message: string;
}

export interface Catalogue {
  commands: WorkflowCommand[];
  /** Skills present but unusable as commands (missing file, duplicate name). */
  issues: CatalogueIssue[];
  /** Every scanned skill that is callable, used by the alias-coverage assertions. */
  invocable: SkillMeta[];
}

/**
 * Read a bundled skills directory. A duplicate `name:` is reported instead of
 * silently shadowing an alias: two skills claiming one command is a packaging
 * bug the operator must see.
 */
export function readCatalogue(skillsDir: string, readFile: (path: string) => string = (p) => readFileSync(p, "utf8")): Catalogue {
  const commands: WorkflowCommand[] = [];
  const invocable: SkillMeta[] = [];
  const issues: CatalogueIssue[] = [];
  const taken = new Map<string, string>();

  // Iterate directories in a stable order: readdir order is filesystem-dependent
  // (bun and node return different orders for the same directory), and the
  // duplicate-name rule is "first owner claims the command". Sorting makes that
  // owner deterministic across runtimes and platforms.
  const dirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const dir of dirs) {
    let meta: SkillMeta;
    try {
      meta = readSkillMeta(readFile(join(skillsDir, dir.name, SKILL_FILE)), dir.name);
    } catch {
      issues.push({ dir: dir.name, message: "no readable SKILL.md" });
      continue;
    }
    if (!meta.userInvocable) continue;

    const owner = taken.get(meta.name);
    if (owner) {
      issues.push({ dir: dir.name, message: `command name "${meta.name}" already claimed by ${owner}/` });
      continue;
    }
    taken.set(meta.name, dir.name);
    invocable.push(meta);
    commands.push({ name: meta.name, skill: dir.name, ...(meta.description ? { description: meta.description } : {}) });
  }

  commands.sort((left, right) => left.name.localeCompare(right.name));
  return { commands, issues, invocable };
}
