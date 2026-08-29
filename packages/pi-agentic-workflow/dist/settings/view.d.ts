import type { LoadedConfig } from "../config/load.js";
/** The label for the unqualified route, so `default` is never mistaken for a command name. */
export declare const DEFAULT_ROUTE = "the default route";
/**
 * The field path the schema would report for a route target, e.g.
 * `$.commands.plan-feature.model` — the same shape a config problem uses (AC5),
 * so a rejection and a file error read identically to the operator.
 */
export declare function routePath(target: string): string;
/** What the operator reads when the console opens. */
export declare function renderMergedConfig(loaded: LoadedConfig, commands: readonly string[]): string[];
