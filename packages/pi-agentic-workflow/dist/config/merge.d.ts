import type { ConfigFile, EffectiveConfig, Route } from "./types.js";
export declare function mergeConfigs(globalFile?: ConfigFile, projectFile?: ConfigFile): EffectiveConfig;
/** The route a command runs under: its own resolved override, else the default route. */
export declare function effectiveRoute(config: EffectiveConfig, command: string): Route;
