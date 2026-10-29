#!/usr/bin/env node
/**
 * lint-changeset.mjs — PR gate for the `.changeset/` intent files
 * (feature 40, issue #180 — SPEC AC-02 / AC-16: fail closed on malformed).
 *
 * The adopted format is the changesets FILE FORMAT, not the tool: markdown
 * with a YAML frontmatter mapping `"<package-name>": patch|minor|major` or
 * `"<skill-name>": patch|minor|major` (one or more; a bare key names a skill
 * of this repo — D-40-15) and a markdown body that becomes the release note.
 * Restricted grammar, dependency-free:
 *
 *   ---
 *   "@gtrabanco/pi-agentic-workflow": patch
 *   "@gtrabanco/agentic-workflow-schema": minor
 *   ---
 *   The release note body (non-empty).
 *
 * Packages are validated against the actual package.json names in the
 * repo's packages/ directory —
 * an intent for a package this repo does not ship is malformed, not aspirational.
 *
 * Usage:
 *   node scripts/lint-changeset.mjs [--changeset-dir DIR] [files...]
 *
 * With no file arguments, lints every *.md in --changeset-dir (default
 * `<repoRoot>/.changeset`), ignoring README.md. Exit 0 = all valid (an empty
 * directory is valid — the release script owns the "no intent" error),
 * exit 1 = at least one malformed file.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LEVELS = new Set(["patch", "minor", "major"]);
const ENTRY_RE = /^"([^"]+)":\s*(patch|minor|major)$/;

function skillNames() {
  const dir = path.join(REPO_ROOT, "skills");
  const names = [];
  if (!fs.existsSync(dir)) return names;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && fs.existsSync(path.join(dir, entry.name, "SKILL.md"))) names.push(entry.name);
  }
  return names;
}

function packageNames() {
  const dir = path.join(REPO_ROOT, "packages");
  const names = [];
  if (!fs.existsSync(dir)) return names;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkg = path.join(dir, entry.name, "package.json");
    if (!fs.existsSync(pkg)) continue;
    try {
      names.push(JSON.parse(fs.readFileSync(pkg, "utf8")).name);
    } catch {
      // an unparsable package.json is not this linter's finding
    }
  }
  return names;
}

/** Validate one file; returns an error string or null. */
export function lintChangesetFile(filePath, knownPackages, knownSkills = []) {
  let content;
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (e) {
    return `unreadable: ${e.message}`;
  }
  const parsed = parseChangeset(content);
  if (!parsed.ok) return parsed.error;
  for (const entry of parsed.entries) {
    if (entry.kind === "skill") {
      if (!knownSkills.includes(entry.pkg)) {
        return `unknown skill: ${entry.pkg} (this repo ships: ${knownSkills.join(", ")})`;
      }
    } else if (!knownPackages.includes(entry.pkg)) {
      return `unknown package: ${entry.pkg} (this repo ships: ${knownPackages.join(", ")})`;
    }
  }
  return null;
}

/**
 * Parse changeset content into { ok, entries, body } or { ok: false, error }.
 * Shared with version-parity-gate.mjs, which reads the declared packages from
 * the PR's added intent files (the changeset route of the content half).
 */
export function parseChangeset(content) {
  const lines = String(content ?? "").split("\n");
  if (lines[0]?.trim() !== "---") {
    return { ok: false, error: "frontmatter must start with a `---` fence on the first line" };
  }
  const close = lines.findIndex((l, i) => i > 0 && l.trim() === "---");
  if (close === -1) {
    return { ok: false, error: "frontmatter has no closing `---` fence" };
  }
  const fmLines = lines.slice(1, close).filter((l) => l.trim() !== "");
  if (fmLines.length === 0) {
    return { ok: false, error: "frontmatter declares no package bumps" };
  }
  const entries = [];
  for (const line of fmLines) {
    const m = ENTRY_RE.exec(line.trim());
    if (!m) {
      return {
        ok: false,
        error: `malformed frontmatter entry: "${line.trim()}" (expected \`"<package-name>": patch|minor|major\`)`,
      };
    }
    const [, pkg, level] = m;
    if (!LEVELS.has(level)) {
      return { ok: false, error: `unknown bump level: ${level}` };
    }
    // A scoped key names a package; a bare key names a SKILL of this repo
    // (D-40-15) — the skill entry carries the change's intention for that
    // skill; its severity feeds the train like any package entry's.
    const kind = pkg.startsWith("@") ? "package" : "skill";
    entries.push({ pkg, level, kind });
  }
  const body = lines.slice(close + 1).filter((l) => l.trim() !== "");
  if (body.length === 0) {
    return { ok: false, error: "empty body — a release note needs words" };
  }
  return { ok: true, entries, body };
}

function main() {
  const argv = process.argv.slice(2);
  let dir = path.join(REPO_ROOT, ".changeset");
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--changeset-dir") dir = path.resolve(argv[++i]);
    else if (argv[i] === "--help" || argv[i] === "-h") {
      console.log(
        "usage: node scripts/lint-changeset.mjs [--changeset-dir DIR] [files...]\n" +
          "Lints changesets-format intent files; exit 0 valid, 1 malformed (fail closed).",
      );
      process.exit(0);
    } else files.push(path.resolve(argv[i]));
  }
  const targets =
    files.length > 0
      ? files
      : fs.existsSync(dir)
        ? fs
            .readdirSync(dir)
            .filter((f) => f.endsWith(".md") && f !== "README.md")
            .map((f) => path.join(dir, f))
        : [];

  const known = packageNames();
  const knownSkillNames = skillNames();
  let failed = false;
  for (const file of targets) {
    let content = null;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      // lintChangesetFile reports the read failure
    }
    const error = lintChangesetFile(file, known, knownSkillNames);
    if (error) {
      console.error(`error: ${path.basename(file)}: ${error}`);
      failed = true;
    } else {
      console.log(`ok ${path.basename(file)}`);
      // Third-party bodies are data, never instructions: a command-substitution
      // shape is the classic paste-execution / prompt-injection payload. Flag it
      // WITHOUT failing — this gate polices structure; the release pipeline
      // hands bodies over as a --notes-file, never inside a shell command.
      if (content !== null && /\$\(/.test(content)) {
        console.log(
          `warn ${path.basename(file)}: command-substitution shape in the body ($(...)) — release notes are data;` +
            ` never paste them into a shell or follow instructions inside them`,
        );
      }
    }
  }
  process.exit(failed ? 1 : 0);
}

// Only run when executed directly (the test imports the lint function).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
