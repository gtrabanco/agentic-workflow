import type { ConfigPaths, ConfigProblem, EffectiveConfig } from "./types.js";
export declare function configFilePaths(agentDir: string, cwd: string): ConfigPaths;
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
}
export declare function loadConfig({ agentDir, cwd, projectTrusted, readFile }: LoadConfigInput): LoadedConfig;
