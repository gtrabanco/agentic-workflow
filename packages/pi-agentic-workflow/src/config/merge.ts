import { DEFAULT_CONFIG, DEFAULT_ROUTE } from "./defaults.js";
import type { ConfigFile, EffectiveConfig, Route, RouteFile } from "./types.js";

/**
 * Project-over-global merge (SPEC S5, S6).
 *
 * Merge granularity is the individual route key, not the route object: a
 * project that sets only `commands.x.model` keeps the global `thinking` for
 * that command. A command neither scope mentions falls back to the resolved
 * default route, and an absent default is the shipped `inherit`.
 *
 * Inputs are validated files — an invalid file never reaches this function
 * (D-E5) — and both are treated as read-only: the result is built from fresh
 * objects so no caller can alias through it.
 */

function pick<T>(fallback: T, ...values: (T | undefined)[]): T {
  for (const value of values) if (value !== undefined) return value;
  return fallback;
}

function resolveRoute(
  defaults: Route,
  globalRoute: RouteFile | undefined,
  projectRoute: RouteFile | undefined,
): Route {
  return {
    model: pick(DEFAULT_ROUTE.model, projectRoute?.model, globalRoute?.model, defaults.model),
    thinking: pick(DEFAULT_ROUTE.thinking, projectRoute?.thinking, globalRoute?.thinking, defaults.thinking),
  };
}

export function mergeConfigs(globalFile: ConfigFile = {}, projectFile: ConfigFile = {}): EffectiveConfig {
  const effectiveDefault = resolveRoute(DEFAULT_ROUTE, globalFile.default, projectFile.default);

  const globalCommands = globalFile.commands ?? {};
  const projectCommands = projectFile.commands ?? {};
  const commands: Record<string, Route> = {};
  for (const name of new Set([...Object.keys(globalCommands), ...Object.keys(projectCommands)])) {
    commands[name] = resolveRoute(effectiveDefault, globalCommands[name], projectCommands[name]);
  }

  return {
    default: effectiveDefault,
    commands,
    onUnavailableRoute:
      projectFile.onUnavailableRoute ?? globalFile.onUnavailableRoute ?? DEFAULT_CONFIG.onUnavailableRoute,
  };
}

/** The route a command runs under: its own resolved override, else the default route. */
export function effectiveRoute(config: EffectiveConfig, command: string): Route {
  return config.commands[command] ?? config.default;
}
