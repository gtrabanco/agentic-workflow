// materialize.mjs — the `config default` engine (issue #600).
//
// The unified config resolves defaults in code, so a fresh file shows only what
// the operator wrote. This service makes the shipped defaults *explicit*: every
// declared key is written with an English comment (description + type + shipped
// default, read from the schema `config list` exposes), an operator's value is
// never overwritten, a key the schema no longer declares is dropped, and an
// existing file is copied to `<file>.bak-<timestamp>` before it is modified.
//
// Three rules keep the operation safe:
//  - value-preserving — a written default resolves exactly like the absent key
//    it replaced, and a defined value is returned untouched;
//  - refuse-before-write — a file that does not parse, and a merge that fails
//    validation, refuse before the run's first write: every file of the run
//    keeps its bytes and no backup is taken, in any scope;
//  - one writer for comments — this renderer is the only one that emits them, so
//    `config set`/`reset`/`validate --sanitize` keep their comment-free output.

import { copyFileSync, existsSync, readFileSync } from "node:fs";

import {
  BASE_CONFIG_SECTIONS,
  effectiveSections,
  parseJsonc,
  validateSectionValue,
} from "@gtrabanco/agentic-workflow-schema";

import { ConfigError, schemaTypeName } from "./api.mjs";
import { discoverConfigExtensions } from "./discovery.mjs";
import { readScopeDocuments, scopeDirectories, sectionFiles, writeConfigText } from "./store.mjs";

/** The receipt's fixed contract id. */
export const MATERIALIZE_CONTRACT_ID = "config-materialize@1";
/** The divergence report's fixed contract id (the doctor's read-only half). */
export const DIVERGENCE_CONTRACT_ID = "config-divergence@1";

const SCOPES = new Set(["global", "project", "both"]);

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** The schema branch that declares an object's keys, or `undefined`. */
function objectBranch(schema) {
  if (schema?.properties !== undefined) return schema;
  return schema?.anyOf?.find((branch) => branch.type === "object" && branch.properties !== undefined);
}

const declaredProperties = (schema) => objectBranch(schema)?.properties;

/**
 * Plan one schema node: every `undefined` value gains its default (recursing over
 * the declared properties, so a nested default is written too), a defined value
 * is returned untouched, and a key the schema does not declare is dropped when
 * the branch refuses extra keys — reported either way.
 */
function planNode(schema, defaultValue, current, path, report) {
  const properties = declaredProperties(schema);
  if (current === undefined) {
    if (defaultValue === undefined) return undefined;
    if (properties !== undefined && isRecord(defaultValue)) {
      const before = report.materialized.length;
      const built = planNode(schema, defaultValue, {}, path, report);
      if (report.materialized.length === before) report.materialized.push(path);
      return built;
    }
    report.materialized.push(path);
    return structuredClone(defaultValue);
  }
  if (properties === undefined || !isRecord(current)) return current;

  const next = {};
  for (const [key, child] of Object.entries(properties)) {
    const value = planNode(child, defaultValue?.[key], current[key], `${path}.${key}`, report);
    if (value !== undefined) next[key] = value;
  }
  const additional = objectBranch(schema).additionalProperties;
  for (const [key, value] of Object.entries(current)) {
    if (properties[key] !== undefined) continue;
    if (additional === false) report.removed.push(`${path}.${key}`);
    else next[key] = value;
  }
  return next;
}

/** Plan a whole file: base sections in registry order, or one extension root. */
function planFile(fileSections, document) {
  const report = { materialized: [], removed: [] };
  const before = isRecord(document) ? document : {};
  if (fileSections.length === 1 && fileSections[0].path.length === 0) {
    const section = fileSections[0];
    return { value: planNode(section.schema, section.defaults, before, section.key, report), ...report };
  }
  const value = {};
  for (const section of fileSections) {
    const planned = planNode(section.schema, section.defaults, before[section.key], section.key, report);
    if (planned !== undefined) value[section.key] = planned;
  }
  for (const key of Object.keys(before)) {
    if (!fileSections.some((section) => section.key === key)) report.removed.push(key);
  }
  return { value, ...report };
}

/** Where a defined value sits inside a planned document (base or extension root). */
function sectionValue(document, section) {
  if (section.path.length === 0) return document;
  return document?.[section.key];
}

/**
 * The read-only divergence report: the same plan, without writing. `missing` is
 * the new options a materialization would add, `removed` the keys the schema no
 * longer declares, and `converged` is the two empty lists.
 */
export function divergenceForFile(fileSections, document) {
  const planned = planFile(fileSections, document);
  return {
    missing: planned.materialized,
    removed: planned.removed,
    converged: planned.materialized.length === 0 && planned.removed.length === 0,
  };
}

function timestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/u, "Z");
}

/** A free backup name beside the file, never overwriting an earlier one. */
function backupPathFor(path, date) {
  const base = `${path}.bak-${timestamp(date)}`;
  if (!existsSync(base)) return base;
  for (let index = 2; ; index += 1) {
    const candidate = `${base}-${index}`;
    if (!existsSync(candidate)) return candidate;
  }
}

const HEADER = [
  "// =========================================================================",
  "// agentic-workflow — explicit defaults (written by `config default`).",
  "//",
  "// Every declared option is written out with its shipped default, so the file",
  "// is the whole surface and nothing is hidden. A value you set is never",
  "// overwritten; a new option gains its default on the next run, and an option",
  "// the schema no longer declares is dropped after `<file>.bak-<timestamp>`.",
  "// Resolution: project over global; shipped defaults fill only UNDEFINED keys.",
  "// =========================================================================",
];

const pad = (width) => " ".repeat(width);

/** `type` + shipped default, the two facts every materialized comment carries. */
function annotation(schema, defaultValue) {
  const type = schema === undefined ? "unknown" : schemaTypeName(schema);
  const shipped = defaultValue === undefined ? "no shipped default — set it only when you use it" : JSON.stringify(defaultValue);
  return `type: ${type} · shipped default: ${shipped}`;
}

function commentBlock(indent, label, schema, defaultValue, fallback) {
  const description = typeof schema?.description === "string" && schema.description !== "" ? schema.description : fallback;
  return [`${pad(indent)}// ${label} — ${description}`, `${pad(indent)}// ${annotation(schema, defaultValue)}`];
}

/** A leaf or free-form value: compact JSON, or a re-indented block when long. */
function renderLeaf(indent, value) {
  const compact = JSON.stringify(value);
  if (compact.length <= 96) return compact;
  return JSON.stringify(value, null, 2).split("\n").join(`\n${pad(indent)}`);
}

/** The declared children of a value that is not an object: documented, not written. */
function commentOnlyChildren(schema, defaultValue, labelBase, indent, fallback) {
  const properties = declaredProperties(schema);
  if (properties === undefined) return [];
  const lines = [];
  for (const [key, child] of Object.entries(properties)) {
    const label = `${labelBase}.${key}`;
    const childDefault = isRecord(defaultValue) ? defaultValue[key] : undefined;
    lines.push(...commentBlock(indent, label, child, childDefault, fallback));
    lines.push(...commentOnlyChildren(child, childDefault, label, indent, fallback));
  }
  return lines;
}

/** One value entry: an object with declared keys nests, anything else is a leaf. */
function renderEntry(indent, label, key, value, schema, defaultValue, fallback) {
  const properties = declaredProperties(schema);
  const lines = commentBlock(indent, label, schema, defaultValue, fallback);
  if (properties === undefined || !isRecord(value)) {
    lines.push(...commentOnlyChildren(schema, defaultValue, label, indent, fallback));
    lines.push(`${pad(indent)}${JSON.stringify(key)}: ${renderLeaf(indent, value)}`);
    return { text: lines.join("\n"), hasValue: true };
  }
  lines.push(`${pad(indent)}${JSON.stringify(key)}: {`);
  lines.push(joinBlocks(renderBody(indent + 2, properties, value, defaultValue, label, fallback)));
  lines.push(`${pad(indent)}}`);
  return { text: lines.join("\n"), hasValue: true };
}

/** A comma after a value block only when a later value block follows it. */
function joinBlocks(blocks) {
  return blocks
    .map((block, index) => block.text + (block.hasValue && blocks.slice(index + 1).some((candidate) => candidate.hasValue) ? "," : ""))
    .join("\n");
}

/**
 * The blocks of one object body, in schema order then any extra key the branch
 * allows. An entry that only documents an option (no shipped default, not set)
 * carries no JSON token and never earns a comma.
 */
function renderBody(indent, properties, value, defaultValue, labelBase, fallback) {
  const extra = Object.keys(value).filter((key) => properties[key] === undefined);
  const blocks = [];
  for (const key of [...Object.keys(properties), ...extra]) {
    const childSchema = properties[key];
    const childDefault = isRecord(defaultValue) ? defaultValue[key] : undefined;
    const childLabel = `${labelBase}.${key}`;
    if (value[key] === undefined) {
      const comments = commentBlock(indent, childLabel, childSchema, childDefault, fallback);
      comments.push(...commentOnlyChildren(childSchema, childDefault, childLabel, indent, fallback));
      blocks.push({ text: comments.join("\n"), hasValue: false });
      continue;
    }
    blocks.push(renderEntry(indent, childLabel, key, value[key], childSchema, childDefault, fallback));
  }
  return blocks;
}

/**
 * The commented file: `sections` are the sections that own one file (the base
 * file's registry sections, or a single extension root).
 */
export function renderConfigFile(sections, document) {
  const blocks = [];
  if (sections.length === 1 && sections[0].path.length === 0) {
    const section = sections[0];
    blocks.push(...renderBody(2, declaredProperties(section.schema) ?? {}, document, section.defaults, section.key, section.description));
  } else {
    for (const section of sections) {
      blocks.push(renderEntry(2, section.key, section.key, sectionValue(document, section), section.schema, section.defaults, section.description));
    }
  }
  return `${[...HEADER, "{", joinBlocks(blocks), "}"].join("\n")}\n`;
}

function resolveSections({ projectDir, globalDir, extensions }) {
  const discovered = extensions === undefined
    ? discoverConfigExtensions({ projectDir, globalDir })
    : { extensions: [], issues: [] };
  const descriptors = extensions ?? discovered.extensions.map((entry) => entry.descriptor ?? entry);
  const selected = effectiveSections(BASE_CONFIG_SECTIONS, descriptors);
  if (selected.issues.length > 0) throw new ConfigError("SCHEMA", "the config schema registry is inconsistent", selected.issues);
  return selected.sections;
}

function validateFile(fileSections, document) {
  for (const section of fileSections) {
    const value = sectionValue(document, section);
    if (value === undefined) continue;
    const issues = validateSectionValue(section, value);
    if (issues.length > 0) {
      throw new ConfigError("INVALID", `the merged ${section.file} would not validate — nothing was written`, issues);
    }
  }
}

/**
 * Materialize every declared default into the files of `scope`.
 *
 * `scope` is `both` by default: this operation reconciles every file the install
 * owns, which is the affordance the issue asks for. Every file is planned and
 * validated before the first write, so a refusal anywhere leaves the whole run
 * untouched. `backup: false` is the CLI's opt-out and skips only the copy,
 * never the write.
 */
export function materializeConfig({
  projectDir = process.cwd(),
  globalDir,
  env = process.env,
  scope = "both",
  backup = true,
  extensions = undefined,
  now = new Date(),
} = {}) {
  if (!SCOPES.has(scope)) throw new ConfigError("SCOPE", `unknown scope "${scope}" (allowed: global, project, both)`);
  const sections = resolveSections({ projectDir, globalDir, extensions });
  const directories = scopeDirectories({ projectDir, globalDir, env });
  const scopes = scope === "both" ? ["global", "project"] : [scope];
  // Two passes: every file of the run is read, planned and validated before
  // the first byte moves, so a refusal in any scope leaves every file intact —
  // the message's `nothing was written` and the README's "before any byte
  // moves" hold across scopes, not merely per file (external-verify B1).
  const planned = [];
  for (const current of scopes) {
    const read = readScopeDocuments(directories[current], sections);
    if (read.issues.length > 0) {
      throw new ConfigError("PARSE", `the ${current} config is not valid — nothing was written`, read.issues);
    }
    for (const file of sectionFiles(sections)) {
      const fileSections = sections.filter((section) => section.file === file);
      const path = read.paths[file];
      const existed = existsSync(path);
      const before = existed ? readFileSync(path, "utf8") : undefined;
      const { value, materialized, removed } = planFile(fileSections, read.documents[file]);
      validateFile(fileSections, value);
      const text = renderConfigFile(fileSections, value);
      planned.push({ scope: current, file, path, existed, before, text, materialized, removed });
    }
  }
  const files = [];
  for (const item of planned) {
    const written = item.text !== item.before;
    let backupPath = null;
    if (written && item.existed && backup) {
      backupPath = backupPathFor(item.path, now);
      copyFileSync(item.path, backupPath);
    }
    if (written) writeConfigText(item.path, item.text);
    files.push({
      scope: item.scope,
      file: item.file,
      path: item.path,
      existed: item.existed,
      written,
      backup: backupPath,
      materialized: item.materialized,
      removed: item.removed,
    });
  }
  return { contract: MATERIALIZE_CONTRACT_ID, scope, files };
}

/**
 * The read-only half the doctor reports: for every file the install owns, the
 * options a materialization would add and the keys it would drop. A file that
 * does not parse is reported as an error, never guessed past.
 */
export function configDivergence({
  projectDir = process.cwd(),
  globalDir,
  env = process.env,
  scope = "project",
  extensions = undefined,
} = {}) {
  if (!SCOPES.has(scope)) throw new ConfigError("SCOPE", `unknown scope "${scope}" (allowed: global, project, both)`);
  const sections = resolveSections({ projectDir, globalDir, extensions });
  const directories = scopeDirectories({ projectDir, globalDir, env });
  const scopes = scope === "both" ? ["global", "project"] : [scope];
  const files = [];
  for (const current of scopes) {
    const read = readScopeDocuments(directories[current], sections);
    for (const file of sectionFiles(sections)) {
      const fileSections = sections.filter((section) => section.file === file);
      const path = read.paths[file];
      const issue = read.issues.find((entry) => entry.path === path);
      if (issue !== undefined) {
        files.push({ scope: current, file, path, exists: true, error: issue.message, missing: [], removed: [], converged: false });
        continue;
      }
      const document = read.documents[file];
      if (document === undefined) {
        files.push({ scope: current, file, path, exists: false, missing: [], removed: [], converged: true });
        continue;
      }
      files.push({ scope: current, file, path, exists: true, ...divergenceForFile(fileSections, document) });
    }
  }
  return { contract: DIVERGENCE_CONTRACT_ID, scope, files };
}

/** The parse + plan pair a host that reads the bytes itself (the doctor) reuses. */
export function divergenceForText(fileSections, text) {
  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    return {
      exists: true,
      error: `line ${parsed.error.line}:${parsed.error.column}: ${parsed.error.message}`,
      missing: [],
      removed: [],
      converged: false,
    };
  }
  return { exists: true, ...divergenceForFile(fileSections, parsed.value) };
}
