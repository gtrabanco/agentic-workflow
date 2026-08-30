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

/** Minimal frontmatter reader: `name`, `description`, `user-invocable` only. */
export function readSkillMeta(text: string, dir: string): SkillMeta {
  const lines = text.split(/\r?\n/u);
  const meta: SkillMeta = { dir, name: dir, userInvocable: true };
  if (lines[0]?.trim() !== "---") return meta;

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (line.trim() === "---") break;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/^["']|["']$/gu, "");
    if (key === "name" && value !== "") meta.name = value;
    else if (key === "description" && value !== "") meta.description = value;
    else if (key === "user-invocable") meta.userInvocable = value !== "false";
  }
  return meta;
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

  for (const dir of readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
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
