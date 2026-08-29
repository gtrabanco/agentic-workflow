/**
 * The configuration vocabulary shared by every layer of the package (SPEC S5–S8).
 *
 * Two distinct shapes exist on purpose:
 *  - `ConfigFile` is what an operator WRITES: everything optional, exactly the
 *    three keys the SPEC's config schema names, nothing more.
 *  - `EffectiveConfig` is what the extension READS after merge: every route
 *    fully resolved, so no downstream code has to reason about optionality.
 */
/** Pi's thinking levels, mirrored here so the domain layer stays Pi-free. */
export declare const THINKING_LEVELS: readonly ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];
/** A thinking level, or `inherit` = "whatever the session already uses". */
export type ThinkingSetting = ThinkingLevel | "inherit";
/** `"inherit"` or an exact `provider/modelId` reference (split at the first slash). */
export type ModelRef = `${string}/${string}`;
export type ModelSetting = "inherit" | ModelRef;
export interface Route {
    model: ModelSetting;
    thinking: ThinkingSetting;
}
/** What one config file may declare (SPEC "Config schema"). */
export interface RouteFile {
    model?: ModelSetting;
    thinking?: ThinkingSetting;
}
export interface ConfigFile {
    default?: RouteFile;
    commands?: Record<string, RouteFile>;
    onUnavailableRoute?: UnavailableRoutePolicy;
}
export type UnavailableRoutePolicy = "stop" | "inherit";
/** One rejected field inside one config file, addressed by a JSON-path-ish string. */
export interface ConfigIssue {
    path: string;
    message: string;
}
export declare const UNAVAILABLE_ROUTE_POLICIES: readonly UnavailableRoutePolicy[];
export interface EffectiveConfig {
    default: Route;
    commands: Record<string, Route>;
    onUnavailableRoute: UnavailableRoutePolicy;
}
export interface ConfigProblem {
    scope: "global" | "project";
    path: string;
    message: string;
}
/** Absolute paths of the two dedicated JSON files (never Pi `settings.json`). */
export interface ConfigPaths {
    global: string;
    project: string;
}
