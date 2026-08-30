import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
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
/**
 * Minimal frontmatter reader: `name`, `description`, `user-invocable` only.
 *
 * `user-invocable` must say `true` to count: this repository's own rule
 * (CLAUDE.md — the key "REQUIRED for it to appear in the agent's /command menu")
 * makes absence mean internal, and `scripts/bundle-skills.mjs` reads it the same
 * way. The two scanners agree because the rule is stated once per scanner and
 * pinned by `test/alias-coverage.test.mjs`, not because either default is safe.
 */
export function readSkillMeta(text, dir) {
    const lines = text.split(/\r?\n/u);
    const meta = { dir, name: dir, userInvocable: false };
    if (lines[0]?.trim() !== "---")
        return meta;
    for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index];
        if (line.trim() === "---")
            break;
        const colon = line.indexOf(":");
        if (colon === -1)
            continue;
        const key = line.slice(0, colon).trim();
        const value = line.slice(colon + 1).trim().replace(/^["']|["']$/gu, "");
        if (key === "name" && value !== "")
            meta.name = value;
        else if (key === "description" && value !== "")
            meta.description = value;
        else if (key === "user-invocable")
            meta.userInvocable = value === "true";
    }
    return meta;
}
/**
 * Read a bundled skills directory. A duplicate `name:` is reported instead of
 * silently shadowing an alias: two skills claiming one command is a packaging
 * bug the operator must see.
 */
export function readCatalogue(skillsDir, readFile = (p) => readFileSync(p, "utf8")) {
    const commands = [];
    const invocable = [];
    const issues = [];
    const taken = new Map();
    for (const dir of readdirSync(skillsDir, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
        let meta;
        try {
            meta = readSkillMeta(readFile(join(skillsDir, dir.name, SKILL_FILE)), dir.name);
        }
        catch {
            issues.push({ dir: dir.name, message: "no readable SKILL.md" });
            continue;
        }
        if (!meta.userInvocable)
            continue;
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
