// Shared throwaway fixtures for the skill-discovery suites (issue #591).
//
// Every case builds its own tree under `mkdtemp`, so no suite reads or mutates
// the repository's `skills/` and no candidate is screened from the live tree.

import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

/** A candidate skill tree root that is removed by the caller's `finally`. */
export function tempTree(prefix = "skills-591-") {
  return mkdtempSync(path.join(os.tmpdir(), prefix));
}

export function cleanup(dir) {
  rmSync(dir, { recursive: true, force: true });
}

/** One `skills/<name>/SKILL.md` under `root`, with a clean frontmatter by default. */
export function writeSkill(root, name, { description = "A fixture skill that reviews things.", body = "" } = {}) {
  const dir = path.join(root, "skills", name);
  mkdirSync(dir, { recursive: true });
  const text = `---\nname: ${name}\nuser-invocable: false\ndescription: >\n  ${description}\n---\n\n# ${name}\n\n${body}`;
  writeFileSync(path.join(dir, "SKILL.md"), text, "utf8");
  return path.join(dir, "SKILL.md");
}

/** A candidates manifest file under `dir`. */
export function writeCandidates(dir, candidates) {
  const file = path.join(dir, "candidates.json");
  writeFileSync(file, `${JSON.stringify({ candidates }, null, 2)}\n`, "utf8");
  return file;
}

/** A consent answer file (`{ "<name>": "yes" | "no" }`) under `dir`. */
export function writeConsent(dir, answers) {
  const file = path.join(dir, "consent.json");
  writeFileSync(file, `${JSON.stringify({ consent: answers }, null, 2)}\n`, "utf8");
  return file;
}

/**
 * One sha256 over every file path, mode and byte under `root` — the read-only
 * check's whole-tree fingerprint.
 */
export function treeDigest(root) {
  const hash = createHash("sha256");
  const walk = (dir, rel) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      const next = rel === "" ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) walk(full, next);
      else {
        hash.update(`${next}\u0000`);
        hash.update(readFileSync(full));
        hash.update("\u0000");
      }
    }
  };
  walk(root, "");
  return hash.digest("hex");
}

/** A guide text shaped like the scaffold's: one heading, one paragraph. */
export const GUIDE_WITHOUT_NOTE = `# AGENTS.md\n\nGuidance for AI coding agents working in this repository.\n\n## Working rules\n\n- Commit in conventional format.\n`;
