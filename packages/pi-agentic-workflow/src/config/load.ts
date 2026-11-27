import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BASE_CONFIG_SECTIONS,
  BASE_CONFIG_STEM,
  normalizeGuard,
  normalizeLogSession,
  parseJsonc,
  resolveConfigDocuments,
  resolveConfigFileName,
  sanitizeSectionValue,
  validateSectionValue,
} from "@gtrabanco/agentic-workflow-schema";

import { normalizeGitIdentity } from "../guards/git-identity.js";
import { DEFAULT_CONFIG } from "./defaults.js";
import { mergeConfigs } from "./merge.js";
import { degradeConfig } from "./schema.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy } from "./path-policy.js";
import type { PathPolicyDegradation, PathProtectionOverride } from "./path-policy.js";
import type { ConfigFile, ConfigPaths, ConfigProblem, EffectiveConfig } from "./types.js";

/**
 * Load the dedicated files into one effective configuration (issue #427).
 *
 * Two files, two owners, one resolved result:
 *  - the `agentic-workflow` stem holds the cross-tool feature sections and is
 *    resolved by the shared schema package;
 *  - the `pi-agentic-workflow` stem holds this package's routing/profiles/passes
 *    section and is merged here.
 *
 * The rules this module owns:
 *  - a MISSING file resolves to the shipped default;
 *  - a file is located by stem across `.json`, `.jsonc` and `.json5` (#740 S2);
 *  - a PRESENT-but-unparsable file is a problem — never a silent `inherit`;
 *  - a key the schema no longer declares, or a value that no longer validates,
 *    is dropped silently and the shipped default fills in (#740 S6): only a
 *    parse failure refuses, and `config validate`/the doctor report the drops;
 *  - the project files are not even read while the project is untrusted.
 *
 * Reading is injected so tests drive every branch from memory; the caller
 * supplies the directories (Pi's `getAgentDir()` and `ctx.cwd`), never this
 * module.
 */

const PI_CONFIG_STEM = "pi-agentic-workflow";
const PROJECT_CONFIG_DIR_NAME = ".pi";

/** The candidate that exists in `dir`, or the create name `<stem>.json5`. */
function resolveIn(dir: string, stem: string): string {
  return join(dir, resolveConfigFileName(stem, (fileName) => existsSync(join(dir, fileName))));
}

export function configFilePaths(agentDir: string, cwd: string): ConfigPaths {
  const projectDir = join(cwd, PROJECT_CONFIG_DIR_NAME);
  return {
    global: resolveIn(agentDir, PI_CONFIG_STEM),
    project: resolveIn(projectDir, PI_CONFIG_STEM),
    globalBase: resolveIn(agentDir, BASE_CONFIG_STEM),
    projectBase: resolveIn(projectDir, BASE_CONFIG_STEM),
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
  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    problems.push({ scope, path: "$", message: `invalid JSON: line ${parsed.error.line}:${parsed.error.column}: ${parsed.error.message}` });
    return {};
  }
  // Parse-only refusal (#740 S6): everything the schema no longer accepts is
  // dropped here, and the resolver's defaults fill the hole silently.
  return degradeConfig(parsed.value);
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
    problems.push({ scope, path: "$", message: `invalid JSON: line ${parsed.error.line}:${parsed.error.column}: ${parsed.error.message}` });
    return {};
  }
  // One section at a time (#740 S6): an unknown section and a value that no
  // longer validates are dropped, never a problem, and a valid sibling survives.
  const document: Record<string, unknown> = {};
  for (const section of BASE_CONFIG_SECTIONS) {
    const value = parsed.value[section.key];
    if (value === undefined) continue;
    const salvaged = sanitizeSectionValue(section, value);
    if (salvaged.value === undefined) continue;
    if (validateSectionValue(section, salvaged.value).length > 0) continue;
    document[section.key] = salvaged.value;
  }
  return document;
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
    global: { [BASE_CONFIG_STEM]: globalBase },
    project: { [BASE_CONFIG_STEM]: projectBase },
  });

  const base = {
    logSession: normalizeLogSession(baseResolved.config.logSession),
    memory: baseResolved.config.memory,
    telemetry: baseResolved.config.telemetry,
    guard: normalizeGuard(baseResolved.config.guard),
    advance: baseResolved.config.advance,
    pathProtection: intersectPathPolicy(SHIPPED_PATH_POLICY, baseResolved.config.pathProtection as PathProtectionOverride),
    gitIdentity: normalizeGitIdentity(baseResolved.config.gitIdentity, baseResolved.config.guard),
  } as Pick<EffectiveConfig, "logSession" | "memory" | "telemetry" | "guard" | "advance" | "pathProtection" | "gitIdentity">;

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
