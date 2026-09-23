import { DEFAULT_CONFIG, DEFAULT_ROUTE } from "./defaults.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy, mergePathProtectionOverrides } from "./path-policy.js";
import { DEFAULT_ADVANCE_CONFIG } from "./types.js";
import type { AdvanceConfig, ConfigFile, EffectiveConfig, Route, RouteFile } from "./types.js";

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

  const merged: EffectiveConfig = {
    default: effectiveDefault,
    commands,
    onUnavailableRoute:
      projectFile.onUnavailableRoute ?? globalFile.onUnavailableRoute ?? DEFAULT_CONFIG.onUnavailableRoute,
    onSettle: projectFile.onSettle ?? globalFile.onSettle ?? DEFAULT_CONFIG.onSettle,
    pathProtection: intersectPathPolicy(
      SHIPPED_PATH_POLICY,
      mergePathProtectionOverrides(globalFile.pathProtection, projectFile.pathProtection),
    ),
  };
  // Advance knobs appear only when a scope declares them, so configs that
  // predate feature 62 keep their exact resolved shape (no undefined key).
  const advance = mergeAdvance(globalFile.advance, projectFile.advance);
  if (advance !== undefined) merged.advance = advance;
  return merged;
}

/** Project-over-global merge of the advance (conductor) knobs (feature 62).
 *  Absent from the result when neither scope declares any — the resolved
 *  shape of pre-62 configs is byte-stable. */
function mergeAdvance(global: ConfigFile["advance"], project: ConfigFile["advance"]): AdvanceConfig | undefined {
  if (global === undefined && project === undefined) return undefined;
  return {
    iterationsCap: pick(DEFAULT_ADVANCE_CONFIG.iterationsCap, project?.iterationsCap, global?.iterationsCap),
    sensitivePaths: project?.sensitivePaths ?? global?.sensitivePaths ?? [...DEFAULT_ADVANCE_CONFIG.sensitivePaths],
    securityPaths: project?.securityPaths ?? global?.securityPaths ?? [...DEFAULT_ADVANCE_CONFIG.securityPaths],
    runLogPath: pick(DEFAULT_ADVANCE_CONFIG.runLogPath, project?.runLogPath, global?.runLogPath),
  };
}

/** The route a command runs under: its own resolved override, else the default route. */
export function effectiveRoute(config: EffectiveConfig, command: string): Route {
  return config.commands[command] ?? config.default;
}
