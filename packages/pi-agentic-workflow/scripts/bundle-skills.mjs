// bundle-skills.mjs — rebuild the package's skill bundle from the canonical
// repository `skills/` tree. `skills/` at the repo root stays the single source
// of truth (SPEC D-E3): this script is the only writer of the bundle, and
// `test/skill-parity.test.mjs` fails the build on any byte drift in either
// direction. Nothing here edits skill prose.
//
// Inclusion rule (SPEC S2): bundle every skill EXCEPT the ones whose frontmatter
// declares `metadata.internal: true` — repo-maintenance skills such as
// `bump-skill` must not ship to target projects. Skills with
// `user-invocable: false` ARE bundled: they are composed internals that
// user-facing skills load in-turn, so the bundle must stay self-contained.
//
// The frontmatter reader below is a tolerant scanner for the three fields this
// rule needs (`name`, `user-invocable`, `metadata.internal`), not a YAML parser:
// folded scalars (`description: >`) are skipped because every continuation line
// is indented, so no nested line can be mistaken for a top-level key.

import { cpSync, existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_FILE = "SKILL.md";

/**
 * Return the leading `---` frontmatter block of a SKILL.md, or null if absent.
 * @param {string} text
 * @returns {string | null}
 */
function frontmatterBlock(text) {
  const lines = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === "---") return lines.slice(1, i).join("\n");
  }
  return null;
}

/**
 * Read the bundling-relevant fields of one SKILL.md.
 * @param {string} text full SKILL.md contents
 * @returns {{ name: string | null, userInvocable: boolean, internal: boolean }}
 */
export function parseSkillFrontmatter(text) {
  const block = frontmatterBlock(text);
  if (block === null) return { name: null, userInvocable: false, internal: false };

  let name = null;
  let userInvocable = false;
  let internal = false;
  let inMetadataBlock = false;

  for (const line of block.split("\n")) {
    if (line.trim() === "") continue;
    if (!/^[ \t]/.test(line)) {
      inMetadataBlock = /^metadata:\s*$/.test(line);
      const field = /^([^:\s]+):\s*(.*)$/.exec(line);
      if (!field) continue;
      const value = field[2].trim().replace(/^["']|["']$/g, "");
      if (field[1] === "name" && value) name = value;
      if (field[1] === "user-invocable") userInvocable = value === "true";
      // Inline form: `metadata: { internal: true }`
      if (field[1] === "metadata" && value && /internal:\s*true/.test(value)) internal = true;
      continue;
    }
    if (inMetadataBlock && /^\s+internal:\s*true\s*$/.test(line)) internal = true;
  }

  return { name, userInvocable, internal };
}

/**
 * Inventory the skills in a skills root, sorted by directory name.
 * @param {string} skillsRoot
 * @returns {Array<{ slug: string, dir: string, name: string, userInvocable: boolean, internal: boolean }>}
 */
export function listSkills(skillsRoot) {
  const root = resolve(skillsRoot);
  if (!existsSync(root)) throw new Error(`skills root not found: ${root}`);
  const found = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dir = join(root, entry.name);
    const skillFile = join(dir, SKILL_FILE);
    if (!existsSync(skillFile)) continue;
    const parsed = parseSkillFrontmatter(readFileSync(skillFile, "utf8"));
    found.push({
      slug: entry.name,
      dir,
      name: parsed.name ?? entry.name,
      userInvocable: parsed.userInvocable,
      internal: parsed.internal,
    });
  }
  return found.sort((a, b) => a.slug.localeCompare(b.slug));
}

/**
 * List every file below a directory, as `/`-separated paths relative to it.
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]}
 */
export function listFiles(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync(join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listFiles(dir, rel));
    else out.push(rel);
  }
  return out.sort();
}

/**
 * Rebuild the bundle from a skills source tree: the target is wiped and
 * re-copied, so a deleted source skill can never survive as a stale copy.
 * @param {{ sourceDir: string, targetDir: string }} options
 * @returns {{ included: string[], excluded: string[], files: number }}
 */
export function bundleSkills({ sourceDir, targetDir }) {
  const source = resolve(sourceDir);
  const target = resolve(targetDir);
  const skills = listSkills(source);
  const included = [];
  const excluded = [];

  // Wipe first: a rebuild must never merge over a stale copy.
  rmSync(target, { recursive: true, force: true });

  for (const skill of skills) {
    if (skill.internal) {
      excluded.push(skill.slug);
      continue;
    }
    cpSync(skill.dir, join(target, skill.slug), {
      recursive: true,
      force: true,
      // Drop VCS/editor noise and anything hidden; the bundle is prose only.
      filter: (src) => {
        const rel = src.slice(skill.dir.length + 1).split(/[\\/]/).filter(Boolean);
        return !rel.some((part) => part.startsWith(".") || part === "node_modules");
      },
    });
    included.push(skill.slug);
  }

  const files = included.reduce((total, slug) => total + listFiles(join(target, slug)).length, 0);
  return { included, excluded, files };
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
  const result = bundleSkills({
    sourceDir: join(packageDir, "..", "..", "skills"),
    targetDir: join(packageDir, "skills"),
  });
  console.log(
    `bundled ${result.included.length} skills (${result.files} files) · excluded: ${result.excluded.join(", ") || "none"}`,
  );
}
