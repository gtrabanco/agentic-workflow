// bundle-skills.mjs — rebuild the package's skill bundle from the canonical
// repository `skills/` tree. `skills/` at the repo root stays the single source
// of truth (SPEC D-E3): this script is the only writer of the bundle, and
// `test/skill-parity.test.mjs` fails the build on any byte drift in either
// direction. Nothing here edits skill prose.
//
// `--check` re-bundles into a scratch directory and compares it against the
// committed bundle WITHOUT writing anything, then exits non-zero listing every
// missing / drifted / hand-added path. That is what makes the CI order safe:
// the check runs first and still catches committed-bundle drift, and the write
// mode runs after it so the artifact that gets packed is always regenerated
// from the canonical tree rather than trusted from git.
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

import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
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

/**
 * Compare the committed bundle against a fresh bundling of the source tree,
 * writing nothing. Distinguishes the three ways a bundle goes stale so the
 * report names the repair instead of just saying "drift".
 * @param {{ sourceDir: string, targetDir: string }} options
 * @returns {{ ok: boolean, missing: string[], drifted: string[], extra: string[], skills: number, files: number }}
 */
export function checkBundle({ sourceDir, targetDir }) {
  const source = resolve(sourceDir);
  const target = resolve(targetDir);
  const scratch = mkdtempSync(join(tmpdir(), "pi-aw-bundle-check-"));
  const missing = [];
  const drifted = [];
  const extra = [];

  try {
    const expected = bundleSkills({ sourceDir: source, targetDir: scratch });
    for (const slug of expected.included) {
      const fromSource = listFiles(join(scratch, slug));
      const committedDir = join(target, slug);
      if (!existsSync(committedDir)) {
        missing.push(`${slug}/`);
        continue;
      }
      const fromBundle = listFiles(committedDir);
      for (const rel of fromSource) {
        if (!fromBundle.includes(rel)) {
          missing.push(`${slug}/${rel}`);
        } else if (!readFileSync(join(committedDir, rel)).equals(readFileSync(join(scratch, slug, rel)))) {
          drifted.push(`${slug}/${rel}`);
        }
      }
      for (const rel of fromBundle) {
        if (!fromSource.includes(rel)) extra.push(`${slug}/${rel}`);
      }
    }

    // A directory the source never produced: a stale skill, or one the
    // inclusion rule excludes (an internal skill committed by mistake).
    if (existsSync(target)) {
      const included = new Set(expected.included);
      for (const entry of readdirSync(target, { withFileTypes: true })) {
        if (entry.isDirectory() && !included.has(entry.name)) extra.push(`${entry.name}/`);
      }
    }

    return {
      ok: missing.length === 0 && drifted.length === 0 && extra.length === 0,
      missing,
      drifted,
      extra,
      skills: expected.included.length,
      files: expected.files,
    };
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
  const dirs = {
    sourceDir: join(packageDir, "..", "..", "skills"),
    targetDir: join(packageDir, "skills"),
  };

  if (process.argv.includes("--check")) {
    const report = checkBundle(dirs);
    if (report.ok) {
      console.log(`bundle in sync with skills/ (${report.skills} skills, ${report.files} files)`);
    } else {
      const sections = [
        ["missing", report.missing],
        ["drifted", report.drifted],
        ["not in skills/", report.extra],
      ].filter(([, list]) => list.length > 0);
      console.error(
        `bundle is stale — run \`bun run bundle:skills\` and commit the result\n${sections
          .map(([label, list]) => `  ${label}: ${list.join(", ")}`)
          .join("\n")}`,
      );
      process.exitCode = 1;
    }
  } else {
    const result = bundleSkills(dirs);
    console.log(
      `bundled ${result.included.length} skills (${result.files} files) · excluded: ${result.excluded.join(", ") || "none"}`,
    );
  }
}
