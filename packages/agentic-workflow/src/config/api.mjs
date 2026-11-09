// api.mjs — the config API the CLI and any tool share (issue #427 S6/S7).
//
// The API knows the schema, never a hand-written field list: `get`/`set`/`list`
// resolve a dotted path against the registered sections, validate before every
// write, and never coerce a value. A caller that does not know the format can
// `list` the nodes, read their defaults and descriptions, and set one path.

import {
  BASE_CONFIG_SECTIONS,
  BASE_CONFIG_FILE,
  composeConfigSchema,
  effectiveSections,
  resolveConfigDocuments,
  sanitizeSectionValue,
  validateSectionValue,
} from "@gtrabanco/agentic-workflow-schema";

import { scopeDirectories, readScopeDocuments, writeConfigDocument, writeConfigText } from "./store.mjs";

export class ConfigError extends Error {
  constructor(code, message, issues = []) {
    super(message);
    this.code = code;
    this.issues = issues;
  }
}

const SCOPES = new Set(["global", "project"]);

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone(value) {
  return value === undefined ? undefined : structuredClone(value);
}

function deepGet(value, path) {
  let cursor = value;
  for (const key of path) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

function deepSet(value, path, next) {
  if (path.length === 0) return clone(next);
  const root = isRecord(value) ? clone(value) : {};
  let cursor = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!isRecord(cursor[key])) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = clone(next);
  return root;
}

function deepDelete(value, path) {
  if (!isRecord(value) || path.length === 0) return value;
  const root = clone(value);
  let cursor = root;
  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    if (!isRecord(cursor[key])) return value;
    cursor = cursor[key];
  }
  delete cursor[path[path.length - 1]];
  return root;
}

function typeOf(schema) {
  if (schema.type !== undefined) return Array.isArray(schema.type) ? schema.type.join("|") : schema.type;
  if (schema.anyOf !== undefined) return schema.anyOf.map(typeOf).join("|");
  if (schema.oneOf !== undefined) return schema.oneOf.map(typeOf).join("|");
  return "object";
}

function walkSchema(schema, path, defaultValue, category, out) {
  out.push({
    path,
    type: typeOf(schema),
    writable: true,
    defaultValue: clone(defaultValue),
    description: schema.description ?? "",
    category,
  });
  const objectSchema = schema.properties !== undefined
    ? schema
    : schema.anyOf?.find((branch) => branch.type === "object" && branch.properties !== undefined);
  if (objectSchema?.properties === undefined) return;
  for (const [key, child] of Object.entries(objectSchema.properties)) {
    walkSchema(child, `${path}.${key}`, defaultValue?.[key], category, out);
  }
}

export function createConfigApi({ projectDir = process.cwd(), globalDir, env = process.env, extensions = [] } = {}) {
  const directories = scopeDirectories({ projectDir, globalDir, env });
  const selected = effectiveSections(BASE_CONFIG_SECTIONS, extensions);
  if (selected.issues.length > 0) throw new ConfigError("SCHEMA", "the config schema registry is inconsistent", selected.issues);
  const sections = selected.sections;

  const readScope = (scope) => {
    if (!SCOPES.has(scope)) throw new ConfigError("SCOPE", `unknown scope "${scope}" (allowed: global, project)`);
    return readScopeDocuments(directories[scope], sections);
  };

  const resolveAll = () => {
    const global = readScope("global");
    const project = readScope("project");
    const resolved = resolveConfigDocuments({
      sections: BASE_CONFIG_SECTIONS,
      extensions,
      global: global.documents,
      project: project.documents,
    });
    const issues = [...global.issues, ...project.issues, ...resolved.issues];
    return { resolved, issues, global, project };
  };

  const locate = (path) => {
    if (!Array.isArray(path) || path.length === 0) throw new ConfigError("PATH", "a config path is required");
    const [head, ...rest] = path;
    const byKey = sections.find((section) => section.key === head);
    if (byKey) return { section: byKey, rest };
    const candidates = sections.filter((section) => section.schema.properties?.[head] !== undefined
      || section.schema.anyOf?.some((branch) => branch.properties?.[head] !== undefined));
    if (candidates.length === 1) return { section: candidates[0], rest: path };
    if (candidates.length > 1) {
      throw new ConfigError("AMBIGUOUS", `"${head}" belongs to several sections: ${candidates.map((section) => section.key).join(", ")}; prefix the section key`);
    }
    throw new ConfigError("UNKNOWN", `unknown config path "${path.join(".")}"`);
  };

  const rawSectionValue = (documents, section) => deepGet(documents[section.file], section.path) ?? {};

  const resolveScopeOnly = (scope) => {
    const only = readScope(scope);
    const empty = { documents: {} };
    const resolved = resolveConfigDocuments({
      sections: BASE_CONFIG_SECTIONS,
      extensions,
      global: scope === "global" ? only.documents : empty.documents,
      project: scope === "project" ? only.documents : empty.documents,
    });
    return { resolved, issues: [...only.issues, ...resolved.issues], read: only };
  };

  return {
    paths: directories,
    sections,
    schema({ merged = false } = {}) {
      return merged ? composeConfigSchema(BASE_CONFIG_SECTIONS, extensions) : composeConfigSchema(BASE_CONFIG_SECTIONS);
    },
    get(scope, path) {
      if (scope === "resolved") {
        const { resolved } = resolveAll();
        const { section, rest } = locate(path);
        const value = deepGet(resolved.config[section.key], rest);
        if (value === undefined) throw new ConfigError("NOT_FOUND", `no value at "${path.join(".")}"`);
        return { scope, path, section: section.key, value };
      }
      const { resolved, issues } = resolveScopeOnly(scope);
      if (issues.length > 0) throw new ConfigError("INVALID", "the config file is not valid", issues);
      const { section, rest } = locate(path);
      const value = deepGet(resolved.config[section.key], rest);
      if (value === undefined) throw new ConfigError("NOT_FOUND", `no value at "${path.join(".")}"`);
      return { scope, path, section: section.key, value };
    },
    set(scope, path, value) {
      if (!SCOPES.has(scope)) throw new ConfigError("SCOPE", `unknown scope "${scope}" (allowed: global, project)`);
      const { section, rest } = locate(path);
      const read = readScope(scope);
      const document = clone(read.documents[section.file]) ?? {};
      const current = rawSectionValue({ [section.file]: document }, section);
      const next = rest.length === 0 ? value : deepSet(isRecord(current) ? current : {}, rest, value);
      const issues = validateSectionValue(section, next);
      if (issues.length > 0) throw new ConfigError("INVALID", `"${path.join(".")}" was not written`, issues);
      const updated = section.path.length === 0
        ? (rest.length === 0 ? next : deepSet(document, rest, value))
        : deepSet(document, section.path, next);
      writeConfigDocument(read.paths[section.file], updated);
      return { scope, path, section: section.key, value: next, file: read.paths[section.file] };
    },
    list({ scope = "resolved", category } = {}) {
      const effective = scope === "resolved" ? resolveAll().resolved.config : resolveScopeOnly(scope).resolved.config;
      const nodes = [];
      for (const section of sections) {
        if (category !== undefined && section.category !== category) continue;
        walkSchema(section.schema, section.key, section.defaults, section.category, nodes);
      }
      return nodes.map((node) => ({
        ...node,
        value: clone(deepGet(effective[sectionKeyOf(node.path, sections)], node.path.split(".").slice(1))),
      }));
    },
    showResolved() {
      const { resolved, issues } = resolveAll();
      return { ok: issues.length === 0, config: resolved.config, issues, sources: { global: directories.global, project: directories.project } };
    },
    validate(scope, { sanitize = false, noWarnUnknown = false } = {}) {
      const results = [];
      const scopes = scope === "both" ? ["global", "project"] : [scope];
      for (const current of scopes) {
        const read = readScope(current);
        const issues = [...read.issues];
        let changed = false;
        for (const section of sections) {
          const value = deepGet(read.documents[section.file], section.path);
          if (value === undefined) continue;
          let sectionIssues = validateSectionValue(section, value);
          if (sanitize) {
            const sanitized = sanitizeSectionValue(section, value);
            if (sanitized.removed.length > 0) {
              const document = deepGet(read.documents, [section.file]) ?? {};
              const updated = section.path.length === 0
                ? sanitized.value
                : deepSet(document, section.path, sanitized.value);
              writeConfigDocument(read.paths[section.file], updated);
              read.documents[section.file] = updated;
              changed = true;
              sectionIssues = validateSectionValue(section, sanitized.value);
            }
          }
          issues.push(...sectionIssues);
        }
        const filtered = noWarnUnknown ? issues.filter((issue) => !issue.message.startsWith("unknown key")) : issues;
        results.push({ scope: current, ok: filtered.length === 0, issues: filtered, sanitized: changed });
      }
      return results;
    },
    reset(scope, path) {
      if (!SCOPES.has(scope)) throw new ConfigError("SCOPE", `unknown scope "${scope}" (allowed: global, project)`);
      const { section, rest } = locate(path);
      const read = readScope(scope);
      const document = clone(read.documents[section.file]) ?? {};
      let updated;
      if (rest.length === 0) {
        updated = section.path.length === 0 ? {} : deepDelete(document, section.path);
      } else {
        updated = deepDelete(document, [...section.path, ...rest]);
      }
      writeConfigDocument(read.paths[section.file], updated);
      return { scope, path, section: section.key, file: read.paths[section.file] };
    },
    init(scope) {
      if (!SCOPES.has(scope)) throw new ConfigError("SCOPE", `unknown scope "${scope}" (allowed: global, project)`);
      const path = `${directories[scope]}/${BASE_CONFIG_FILE}`;
      const read = readScopeDocuments(directories[scope], [{ file: BASE_CONFIG_FILE }]);
      if (read.documents[BASE_CONFIG_FILE] !== undefined) {
        throw new ConfigError("EXISTS", `refusing to overwrite ${path}; edit it or remove it first`);
      }
      writeConfigText(path, renderInitTemplate());
      return { scope, path, created: true };
    },
  };
}

function sectionKeyOf(path, sections) {
  const head = path.split(".")[0];
  return sections.some((section) => section.key === head) ? head : head;
}

/** The `init` template: every section documented, nothing enabled by surprise. */
export function renderInitTemplate() {
  const lines = [
    "// =========================================================================",
    "// agentic-workflow config",
    "//",
    "// Project config: .pi/agentic-workflow.json",
    "// Global config:  ~/.pi/agent/agentic-workflow.json",
    "// Resolution: project over global; shipped defaults fill only UNDEFINED keys.",
    "// Every value below is commented out, so this file starts at the defaults.",
    "// =========================================================================",
    "{",
  ];
  for (const section of BASE_CONFIG_SECTIONS) {
    lines.push(`  // ${section.key} — ${section.description}`);
    lines.push(`  // default: ${JSON.stringify(section.defaults)}`);
    lines.push(`  // "${section.key}": ${JSON.stringify(section.defaults)},`);
  }
  lines.push("}");
  return `${lines.join("\n")}\n`;
}
