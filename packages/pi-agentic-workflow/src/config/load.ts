import { readFileSync } from "node:fs";
import { join } from "node:path";

import { DEFAULT_CONFIG } from "./defaults.js";
import { mergeConfigs } from "./merge.js";
import { parseConfigFile } from "./schema.js";
import type { ConfigFile, ConfigPaths, ConfigProblem, EffectiveConfig } from "./types.js";

/**
 * Load the two dedicated JSON files into one effective configuration
 * (SPEC S5, S11; D-E5, D-P6).
 *
 * The three rules this module owns, and nothing else:
 *  - a MISSING file resolves to the shipped default (`inherit`);
 *  - a PRESENT-but-invalid file is a problem — never a silent `inherit`, so an
 *    operator can't believe a strong model ran when it did not;
 *  - the project file is not even read while the project is untrusted, because
 *    a cloned repository must not be able to steer routing (S11).
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
  };
}

export interface LoadConfigInput {
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
  /** Returns the file text, or null when the path does not exist / cannot be read. */
  readFile?: (path: string) => string | null;
}

export interface LoadedConfig {
  /** False when any present file failed to parse or validate → refuse dispatch. */
  ok: boolean;
  /** The merged configuration; the shipped default whenever `ok` is false. */
  config: EffectiveConfig;
  problems: ConfigProblem[];
}

const readIfExists = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

function loadScope(
  scope: ConfigProblem["scope"],
  path: string,
  readFile: (path: string) => string | null,
  problems: ConfigProblem[],
): ConfigFile {
  const text = readFile(path);
  if (text === null) return {};

  const result = parseConfigFile(text);
  if (!result.ok) {
    for (const issue of result.issues) problems.push({ scope, path: issue.path, message: issue.message });
    return {};
  }
  return result.config;
}

export function loadConfig({ agentDir, cwd, projectTrusted, readFile = readIfExists }: LoadConfigInput): LoadedConfig {
  const paths = configFilePaths(agentDir, cwd);
  const problems: ConfigProblem[] = [];

  const globalFile = loadScope("global", paths.global, readFile, problems);
  const projectFile = projectTrusted ? loadScope("project", paths.project, readFile, problems) : {};

  return {
    ok: problems.length === 0,
    // Fail closed: a broken file hands the caller the unrouted default and the
    // problems that explain why dispatch is refused.
    config: problems.length === 0 ? mergeConfigs(globalFile, projectFile) : DEFAULT_CONFIG,
    problems,
  };
}
