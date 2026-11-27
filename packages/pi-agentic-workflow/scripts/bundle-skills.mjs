// bundle-skills.mjs — build the package's skill bundle from the canonical
// repository `skills/` tree. `skills/` at the repo root is the single source of
// truth: it is the only skills tree in git, and the copy this script stages
// under the package is pack-time build output, gitignored and removed again by
// `--clean` once the tarball exists.
//
// Projection contract (issue #410 — deliberately rewritten from "nothing here
// edits skill prose"): the staged copy is a *projection* of the canonical tree.
// Three declared transforms write into it: the manifest's own rules
// (`projection-manifest.json` at the package root), each of which removes or
// pointerizes one declared prose section, resolved through the #407 section
// locator and hash-bound to the exact bytes it removes
// (`scripts/projection.mjs`); the argument-hint normalisation (issue #726,
// below), which makes every `argument-hint:` line `yaml@2.9.0` would not read as
// a string a quoted YAML string pi's own frontmatter reader accepts — and
// leaves block-scalar headers and multi-line raw values alone, since their
// content already parses (or is the source's own defect); and the runner
// mapping (issue #696, below). A file
// none of them reaches is byte-identical to its source — always. The standalone
// `skills/` tree is never edited: all transforms read it and write only into the
// staged copy.
//
// Lifecycle (package.json): `prepare` stages it for local work, `test` stages it
// before asserting, `prepublishOnly` stages it before the gate, and `postpack`
// removes it. Keeping the staged copy out of git is the point: a second tree on
// disk is a tree an agent can edit by mistake — and that edit would be silently
// thrown away by the next rebuild.
//
// Inclusion rule (SPEC S2): bundle every skill EXCEPT the ones whose frontmatter
// declares `metadata.internal: true` — repo-maintenance skills such as
// `bump-skill` must not ship to target projects. Skills with
// `user-invocable: false` ARE bundled: they are composed internals that
// user-facing skills load in-turn, so the bundle must stay self-contained.
//
// Runner mapping (issue #696): a bundled `SKILL.md` that cites the symbolic
// `runner <subcommand>` form carries the pi mapping AT THE POINT OF EXECUTION —
// otherwise a session that follows the skill literally runs `runner …` in bash and
// gets exit 127, because no such executable exists. The wording is not composed
// here: `runnerMappingText()` reads the `runner-mapping@1` block out of its one
// owner (`skills/runner-contract/references/RUNNER.md`), so there is no second
// hand-maintained copy (`IR11`) and no drift between owner and injection. The
// block is spliced after the frontmatter — never before it, because a `SKILL.md`
// whose first bytes are not `---` stops being a skill for every reader.
//
// The frontmatter reader below is a tolerant scanner for the three fields this
// rule needs (`name`, `user-invocable`, `metadata.internal`), not a YAML parser:
// folded scalars (`description: >`) are skipped because every continuation line
// is indented, so no nested line can be mistaken for a top-level key.

import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { ProjectionError, applyProjection, loadProjectionManifest, rulesFor } from "./projection.mjs";

const SKILL_FILE = "SKILL.md";

/** The id the runner mapping's one owner publishes (issue #696). */
export const RUNNER_MAPPING_MARKER = "runner-mapping@1";

/**
 * The injected block's ceiling in the repository's own measure (`ceil(UTF-8
 * bytes / 4)`), fixed AFTER the block was written — AC1's rule — with the
 * manifest's arithmetic: `ceil(measured x 1.10)`. Measured 120 est at the cut.
 * A longer block is a contract change, not a wording tweak: it rides in every
 * packaged skill that cites a runner command.
 */
export const RUNNER_MAPPING_ESTIMATE_MAX = 132;

/** Where the mapping's owner lives inside a skills tree. */
const RUNNER_MAPPING_OWNER = join("runner-contract", "references", "RUNNER.md");

/**
 * A `runner <subcommand>` citation: a backticked span carrying the symbolic form
 * (the subcommand is a name or a `<placeholder>`), or a line whose first word is
 * `runner` inside a fenced block. Prose that mentions a runner ("a narrower
 * runner later") is not a citation, and neither is the `runner-set@1` table,
 * whose rows start with a launcher. The closing backtick is optional because a
 * skill may open a long span and close it lines later.
 */
const RUNNER_CITATION = /`runner (?:<[a-z][a-z0-9-]*>|[a-z][a-z0-9-]*)(?: [^`\n]*)?`?|^runner [a-z<]/mu;


/**
 * Read the runner mapping from its one owner inside a skills tree.
 *
 * `null` when the tree carries no runner contract at all (a fixture); a
 * `stale-rule` failure when the contract exists but publishes no block — a
 * projection whose owner text vanished must never silently deliver nothing.
 *
 * @param {string} skillsRoot
 * @returns {string | null} the fenced block, byte for byte
 */
export function runnerMappingText(skillsRoot) {
  const owner = join(resolve(skillsRoot), RUNNER_MAPPING_OWNER);
  if (!existsSync(owner)) return null;
  const text = readFileSync(owner, "utf8");
  const opening = `\`\`\`text\n${RUNNER_MAPPING_MARKER}\n`;
  const at = text.indexOf(opening);
  if (at === -1) {
    throw new ProjectionError("stale-rule", `${owner} publishes no ${RUNNER_MAPPING_MARKER} block; a staged skill would ship its citation unmapped`);
  }
  const end = text.indexOf("\n```", at + opening.length);
  if (end === -1) {
    throw new ProjectionError("stale-rule", `${owner}: the ${RUNNER_MAPPING_MARKER} block is unterminated`);
  }
  return text.slice(at, end + 4);
}

/**
 * Whether a `SKILL.md` cites the symbolic `runner <subcommand>` form.
 * @param {string} text
 * @returns {boolean}
 */
export function citesRunnerCitation(text) {
  return RUNNER_CITATION.test(typeof text === "string" ? text : "");
}

/** The offset just after a leading `---` frontmatter block's closing line, or null. */
const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---[ \t]*(?:\r?\n|$)/;
function frontmatterEndOffset(text) {
  const bom = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const match = FRONTMATTER.exec(bom === 1 ? text.slice(1) : text);
  return match === null ? null : bom + match[0].length;
}

/** One frontmatter `argument-hint:` line: its prefix and its raw value. */
const ARGUMENT_HINT_LINE = /^(argument-hint:[ \t]*)(.*)$/gmu;

/**
 * A YAML block-scalar header — `>`, `>-`, `|2`, `>-2`, `>2-`, `> #c` … yaml@2.9.0
 * reads the indented content that follows as one string, and it accepts the
 * chomping indicator and the indentation digits in either order, so both are
 * admitted: quoting the header line orphans its content and breaks the whole
 * frontmatter (decision D5, PE-018; cycle-1 finding F4).
 */
const BLOCK_HEADER = /^[|>](?:[+-][0-9]*|[0-9]+[+-]?)?(?:[ \t]+#.*)?$/u;

/**
 * YAML 1.2 core's non-string plain scalars — `null`/`~`, the booleans and the
 * numeric forms — enumerated from measured `yaml@2.9.0` behaviour (PE-018). A
 * hint YAML types as one of these is not the string the host renders, so it is
 * quoted like any other shape the reader cannot read as a string.
 */
const CORE_NON_STRING =
  /^(?:~|null|Null|NULL|true|True|TRUE|false|False|FALSE|[+-]?(?:0b[01_]+|0o[0-7_]+|0x[0-9a-fA-F_]+|[0-9][0-9_]*)(?:\.[0-9_]*)?(?:[eE][+-]?[0-9]+)?|[+-]?\.[0-9_]+(?:[eE][+-]?[0-9]+)?|[+-]?(?:\.inf|\.Inf|\.INF)|\.nan|\.NaN|\.NAN)$/u;

/**
 * Whether a value is already a complete single- or double-quoted YAML scalar.
 * @param {string} value
 * @returns {boolean}
 */
function isQuotedScalar(value) {
  return /^"(?:[^"\\]|\\.)*"$/u.test(value) || /^'(?:[^']|'')*'$/u.test(value);
}

/**
 * Whether a flow collection opened on this line is left open — a value such as
 * `[--a,` whose continuation sits on the following indented lines. Quoting the
 * first line would orphan that continuation, so the line is left alone (cycle-1
 * finding F5). Brackets inside a quoted section do not count.
 * @param {string} value
 * @returns {boolean}
 */
function continuesBelow(value) {
  let depth = 0;
  let quote = null;
  for (const character of value) {
    if (quote !== null) {
      if (character === "\\" && quote === '"') continue;
      if (character === quote) quote = null;
      continue;
    }
    if (character === '"' || character === "'") quote = character;
    else if (character === "[" || character === "{") depth += 1;
    else if (character === "]" || character === "}") depth -= 1;
  }
  return depth > 0;
}

/**
 * Whether YAML reads a raw value as a plain string. A block-scalar header is
 * one (its content follows); a comment-led value and YAML core's non-string
 * scalars are not. Conservative by design: a shape this reader is not sure
 * about is quoted, never left to the parser.
 * @param {string} value
 * @returns {boolean}
 */
function isPlainScalar(value) {
  if (value === "") return false;
  if (BLOCK_HEADER.test(value)) return true;
  if (continuesBelow(value)) return true;
  if (/^[\[{&*!|>'"%@`,#]/u.test(value)) return false;
  if (/^[-?:](?:[ \t]|$)/u.test(value)) return false;
  if (/: | #/u.test(value)) return false;
  if (CORE_NON_STRING.test(value)) return false;
  return !value.endsWith(":");
}

/**
 * Quote a raw value as a YAML double-quoted scalar, escaping the two characters
 * that have meaning inside one.
 * @param {string} value
 * @returns {string}
 */
function quoteScalar(value) {
  return `"${value.replace(/\\/gu, "\\\\").replace(/"/gu, '\\"')}"`;
}

/**
 * Make every `argument-hint:` line in a SKILL.md's frontmatter a YAML string
 * without changing its text (issue #726, defect 1; cycle-1 findings F4-F6).
 * pi reads frontmatter with a YAML parser, so a raw value starting with `[` is
 * a flow sequence and rejects the whole file — the skill silently loses its
 * `skill:*` command. An already-quoted value is left byte-identical; so is a
 * block-scalar header, a value YAML reads as a plain string, and a value that
 * continues on the following indented lines (a multi-line flow collection:
 * quoting its first line would orphan the rest). Every `argument-hint:`
 * occurrence is rewritten, not just the first: YAML's last key wins, so a
 * duplicate left raw would be the value that ships.
 * @param {string} text
 * @returns {string}
 */
export function normalizeArgumentHint(text) {
  const at = frontmatterEndOffset(text);
  if (at === null) return text;
  const head = text.slice(0, at).replace(ARGUMENT_HINT_LINE, (line, prefix, raw) => {
    const value = raw.trim();
    if (isQuotedScalar(value) || isPlainScalar(value)) return line;
    return `${prefix}${quoteScalar(value)}`;
  });
  return head + text.slice(at);
}

/**
 * The declared projection of one staged skill file: the manifest rules that name
 * it, the argument-hint normalisation a `SKILL.md` always receives (issue #726),
 * then — for a `SKILL.md` whose source cites the symbolic runner form — the
 * mapping block spliced in after the frontmatter. Both the bundler and the parity
 * suite call this, so the expectation and the build cannot disagree.
 *
 * @param {{ source: string, rel: string, rules?: readonly object[], mapping?: string | null, context?: string }} options
 * @returns {string}
 */
export function projectSkillFile({ source, rel, rules = [], mapping = null, context = "source" }) {
  const projected = rules.length > 0 ? applyProjection(source, rules, context) : source;
  const hinted = rel === SKILL_FILE ? normalizeArgumentHint(projected) : projected;
  if (rel !== SKILL_FILE || mapping === null || !citesRunnerCitation(source)) return hinted;
  const at = frontmatterEndOffset(hinted);
  if (at === null) return `${mapping}\n\n${hinted}`;
  return `${hinted.slice(0, at)}\n${mapping}\n${hinted.slice(at)}`;
}

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
 * Stage one skill directory into the bundle, then apply its declared projection:
 * for every file a manifest rule names the rule is applied to the *source* bytes,
 * and a `SKILL.md` that cites a runner command carries the mapping block. Any
 * projection failure aborts the build — fail-closed, never a partial bundle.
 * @param {{ dir: string, slug: string }} skill the source skill
 * @param {string} stagedDir the copied skill directory in the bundle
 * @param {readonly object[]} rules the whole validated manifest rule list
 * @param {string | null} mapping the runner mapping, read once per build
 * @returns {number} how many files were projected
 */
function projectSkill(skill, stagedDir, rules, mapping) {
  let projected = 0;
  for (const rel of listFiles(stagedDir)) {
    const fileRules = rulesFor(rules, `skills/${skill.slug}/${rel}`);
    const source = readFileSync(join(skill.dir, rel), "utf8");
    // Every SKILL.md is projected: the argument-hint normalisation is a
    // per-file transform a manifest rule does not have to name.
    const replaced = fileRules.length > 0 || rel === SKILL_FILE;
    if (!replaced) continue;
    const out = projectSkillFile({ source, rel, rules: fileRules, mapping, context: `skills/${skill.slug}/${rel}` });
    if (out === source) continue;
    writeFileSync(join(stagedDir, rel), out);
    projected += 1;
  }
  return projected;
}

/**
 * Rebuild the bundle from a skills source tree: the target is wiped and
 * re-copied, so a deleted source skill can never survive as a stale copy.
 * With a projection manifest, the copy becomes the declared projection of the
 * source (issue #410); without one, it is the plain byte-copy.
 * @param {{ sourceDir: string, targetDir: string, manifestPath?: string }} options
 * @returns {{ included: string[], excluded: string[], files: number, projected: number }}
 */
export function bundleSkills({ sourceDir, targetDir, manifestPath }) {
  const source = resolve(sourceDir);
  const target = resolve(targetDir);
  const skills = listSkills(source);
  const included = [];
  const excluded = [];

  const rules = manifestPath !== undefined && existsSync(manifestPath)
    ? loadProjectionManifest(manifestPath).rules
    : [];
  // Read once per build, from its one owner: a skills tree without a runner
  // contract stages nothing (a fixture), and an owner without its block fails
  // closed instead of shipping an unmapped citation.
  const mapping = runnerMappingText(source);
  let projected = 0;

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
    projected += projectSkill(skill, join(target, skill.slug), rules, mapping);
    included.push(skill.slug);
  }

  const files = included.reduce((total, slug) => total + listFiles(join(target, slug)).length, 0);
  return { included, excluded, files, projected };
}

/**
 * Remove the staged bundle. The package's `postpack` hook runs this so the
 * copy cannot outlive the tarball it was built for.
 * @param {{ targetDir: string }} options
 */
export function cleanBundle({ targetDir }) {
  rmSync(resolve(targetDir), { recursive: true, force: true });
}

const invokedDirectly = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
  const dirs = {
    sourceDir: join(packageDir, "..", "..", "skills"),
    targetDir: join(packageDir, "skills"),
    // The repo-internal manifest: committed at the package root, outside the
    // `files:` whitelist — it drives the projection, never ships in the tarball.
    manifestPath: join(packageDir, "projection-manifest.json"),
  };

  if (process.argv.includes("--clean")) {
    cleanBundle(dirs);
    console.log("removed the staged skill bundle (git holds the canonical skills/ tree)");
  } else {
    const result = bundleSkills(dirs);
    console.log(
      `bundled ${result.included.length} skills (${result.files} files) · projected: ${result.projected} files · excluded: ${result.excluded.join(", ") || "none"}`,
    );
  }
}
