import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BASE_CONFIG_FILE,
  BASE_CONFIG_SECTIONS,
  normalizeLogSession,
  parseJsonc,
  resolveConfigDocuments,
  validateSectionValue,
} from "@gtrabanco/agentic-workflow-schema";

import { DEFAULT_CONFIG } from "./defaults.js";
import { mergeConfigs } from "./merge.js";
import { parseConfigFile } from "./schema.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy } from "./path-policy.js";
import type { PathPolicyDegradation, PathProtectionOverride } from "./path-policy.js";
import type { ConfigFile, ConfigPaths, ConfigProblem, EffectiveConfig } from "./types.js";

/**
 * Load the dedicated files into one effective configuration (issue #427).
 *
 * Two files, two owners, one resolved result:
 *  - `agentic-workflow.json` holds the cross-tool feature sections and is
 *    resolved by the shared schema package;
 *  - `pi-agentic-workflow.json` holds this package's routing/profiles/passes
 *    section and is merged here.
 *
 * The rules this module owns:
 *  - a MISSING file resolves to the shipped default;
 *  - a PRESENT-but-invalid file is a problem — never a silent `inherit`;
 *  - the project files are not even read while the project is untrusted.
 *
 * Reading is injected so tests drive every branch from memory; the caller
 * supplies the directories (Pi's `getAgentDir()` and `ctx.cwd`), never this
 * module.
 */

const CONFIG_FILE_NAME = "pi-agentic-workflow.json";
const PROJECT_CONFIG_DIR_NAME = ".pi";

export function configFilePaths(agentDir: string, cwd: string): ConfigPaths {
  return {
    global: join(agentDir, CONFIG_FILE_NAME),
    project: join(cwd, PROJECT_CONFIG_DIR_NAME, CONFIG_FILE_NAME),
    globalBase: join(agentDir, BASE_CONFIG_FILE),
    projectBase: join(cwd, PROJECT_CONFIG_DIR_NAME, BASE_CONFIG_FILE),
  };
}

export interface LoadConfigInput {
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
  /** Returns the file text, or null when the path does not exist. A reader that
   *  cannot honour an existing path throws, and the throw becomes a problem:
   *  "unreadable" must not quietly mean "unconfigured" (F7). */
  readFile?: (path: string) => string | null;
}

export interface LoadedConfig {
  /** False when any present file failed to parse or validate → refuse dispatch. */
  ok: boolean;
  /** The merged configuration; the shipped default whenever `ok` is false. */
  config: EffectiveConfig;
  problems: ConfigProblem[];
  /** The effective policy's tighten-only degradations (feature 60); empty when clean. */
  pathProtectionDegradations: PathPolicyDegradation[];
}

const NOT_THERE = new Set(["ENOENT", "ENOTDIR"]);

/** Absent is `null`; present-but-unreadable throws so the caller records it. */
const readIfExists = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (NOT_THERE.has((error as NodeJS.ErrnoException).code ?? "")) return null;
    throw error;
  }
};

function readText(
  scope: ConfigProblem["scope"],
  path: string,
  readFile: (path: string) => string | null,
  problems: ConfigProblem[],
): string | null {
  try {
    return readFile(path);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code ?? "read error";
    problems.push({ scope, path: "$", message: `the file could not be read (${code})` });
    return null;
  }
}

function loadScope(
  scope: ConfigProblem["scope"],
  path: string,
  readFile: (path: string) => string | null,
  problems: ConfigProblem[],
): ConfigFile {
  const text = readText(scope, path, readFile, problems);
  if (text === null) return {};
  const result = parseConfigFile(text);
  if (!result.ok) {
    for (const issue of result.issues) problems.push({ scope, path: issue.path, message: issue.message });
    return {};
  }
  return result.config;
}

/** Read and validate one base feature file; every invalid section is a problem. */
function loadBaseScope(
  scope: ConfigProblem["scope"],
  path: string,
  readFile: (path: string) => string | null,
  problems: ConfigProblem[],
): Record<string, unknown> {
  const text = readText(scope, path, readFile, problems);
  if (text === null) return {};
  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    problems.push({ scope, path: "$", message: `line ${parsed.error.line}:${parsed.error.column}: ${parsed.error.message}` });
    return {};
  }
  const known = new Set(BASE_CONFIG_SECTIONS.map((section) => section.key));
  for (const key of Object.keys(parsed.value)) {
    if (!known.has(key)) problems.push({ scope, path: `$.${key}`, message: `unknown config section "${key}"` });
  }
  for (const section of BASE_CONFIG_SECTIONS) {
    const value = parsed.value[section.key];
    if (value === undefined) continue;
    for (const issue of validateSectionValue(section, value)) problems.push({ scope, path: issue.path, message: issue.message });
  }
  return parsed.value;
}

export function loadConfig({ agentDir, cwd, projectTrusted, readFile = readIfExists }: LoadConfigInput): LoadedConfig {
  const paths = configFilePaths(agentDir, cwd);
  const problems: ConfigProblem[] = [];

  const globalFile = loadScope("global", paths.global, readFile, problems);
  const projectFile = projectTrusted ? loadScope("project", paths.project, readFile, problems) : {};
  const globalBase = loadBaseScope("global", paths.globalBase, readFile, problems);
  const projectBase = projectTrusted ? loadBaseScope("project", paths.projectBase, readFile, problems) : {};

  const baseResolved = resolveConfigDocuments({
    sections: BASE_CONFIG_SECTIONS,
    global: { [BASE_CONFIG_FILE]: globalBase },
    project: { [BASE_CONFIG_FILE]: projectBase },
  });

  const base = {
    logSession: normalizeLogSession(baseResolved.config.logSession),
    memory: baseResolved.config.memory,
    telemetry: baseResolved.config.telemetry,
    guards: baseResolved.config.guards,
    advance: baseResolved.config.advance,
    pathProtection: intersectPathPolicy(SHIPPED_PATH_POLICY, baseResolved.config.pathProtection as PathProtectionOverride),
  } as Pick<EffectiveConfig, "logSession" | "memory" | "telemetry" | "guards" | "advance" | "pathProtection">;

  const config = problems.length === 0 ? mergeConfigs(globalFile, projectFile, base) : DEFAULT_CONFIG;
  return {
    ok: problems.length === 0,
    // Fail closed: a broken file hands the caller the unrouted default and the
    // problems that explain why dispatch is refused.
    config,
    problems,
    pathProtectionDegradations: config.pathProtection.degradations,
  };
}
