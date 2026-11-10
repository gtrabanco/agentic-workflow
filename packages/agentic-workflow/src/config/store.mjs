// store.mjs — where the unified config files live and how one is read/written.
//
// Two scopes, one file per extension section. The host owns the directories;
// this module never hardcodes a home: the CLI passes them, and the Pi adapter
// passes the directories Pi already resolved.

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

import { BASE_CONFIG_SECTIONS, BASE_CONFIG_FILE, parseJsonc, stringifyJsoncValue } from "@gtrabanco/agentic-workflow-schema";

const PROJECT_CONFIG_DIR = ".pi";

/** The two scope directories, resolved once. */
export function scopeDirectories({ projectDir = process.cwd(), globalDir, env = process.env } = {}) {
  return {
    project: join(projectDir, PROJECT_CONFIG_DIR),
    global: globalDir ?? env.PI_CODING_AGENT_DIR ?? join(homedir(), ".pi", "agent"),
  };
}

export function sectionFiles(sections) {
  return [...new Set(sections.map((section) => section.file))];
}

/** Read one file: absent is an empty document, present-but-broken is an issue. */
export function readConfigDocument(path) {
  if (!existsSync(path)) return { exists: false, value: undefined, issues: [] };
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    return { exists: true, value: undefined, issues: [{ path, message: `cannot read the file (${error.code ?? "read error"})` }] };
  }
  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    return {
      exists: true,
      value: undefined,
      issues: [{ path, message: `line ${parsed.error.line}:${parsed.error.column}: ${parsed.error.message}` }],
    };
  }
  return { exists: true, value: parsed.value, issues: [] };
}

/** Read every file a section set names, keyed by file name. */
export function readScopeDocuments(dir, sections) {
  const documents = {};
  const paths = {};
  const issues = [];
  for (const file of sectionFiles(sections)) {
    const path = join(dir, file);
    paths[file] = path;
    const read = readConfigDocument(path);
    documents[file] = read.value;
    issues.push(...read.issues);
  }
  return { dir, documents, paths, issues };
}

/** Atomic write: a crash never leaves a half-written config an operator must repair. */
export function writeConfigDocument(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  writeFileSync(temporary, stringifyJsoncValue(value), "utf8");
  renameSync(temporary, path);
}

export function writeConfigText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

export { BASE_CONFIG_FILE, BASE_CONFIG_SECTIONS, PROJECT_CONFIG_DIR };
