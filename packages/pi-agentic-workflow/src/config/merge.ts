import { DEFAULT_CONFIG, DEFAULT_ROUTE } from "./defaults.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy, mergePathProtectionOverrides } from "./path-policy.js";
import { DEFAULT_ADVANCE_CONFIG, DEFAULT_PROFILE_FALLBACK } from "./types.js";
import type { AdvanceConfig, ConfigFile, EffectiveConfig, ProfileFile, ProfileFallbackConfig, Route, RouteDeclaration, RouteFile } from "./types.js";

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

/** Merge two RouteFiles key-by-key (used for profile routes). */
function mergeRouteFiles(
  globalRoute: RouteFile | undefined,
  projectRoute: RouteFile | undefined,
): RouteFile | undefined {
  if (globalRoute === undefined && projectRoute === undefined) return undefined;
  const out: RouteFile = {};
  if (globalRoute?.model !== undefined || projectRoute?.model !== undefined) {
    // A chain declared only at global scope survives.
    // Per-key: project chain wins, or global chain, or inherited string.
    if (projectRoute?.model !== undefined) {
      out.model = projectRoute.model;
    } else if (globalRoute?.model !== undefined) {
      out.model = globalRoute.model;
    }
  }
  if (globalRoute?.thinking !== undefined || projectRoute?.thinking !== undefined) {
    out.thinking = pick(DEFAULT_ROUTE.thinking, projectRoute?.thinking, globalRoute?.thinking);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Per-profile merge: each profile's default and commands merge key-by-key.
 *  A profile name may exist in one scope but not the other; the missing
 *  scope simply contributes nothing. */
function mergeProfiles(
  globalProfiles: Record<string, ProfileFile> | undefined,
  projectProfiles: Record<string, ProfileFile> | undefined,
): Record<string, ProfileFile> {
  const allNames = new Set([
    ...Object.keys(globalProfiles ?? {}),
    ...Object.keys(projectProfiles ?? {}),
  ]);
  const result: Record<string, ProfileFile> = {};
  for (const name of allNames) {
    const gDef = globalProfiles?.[name];
    const pDef = projectProfiles?.[name];
    const mergedDef: ProfileFile = {};

    // Merge default routes key-by-key.
    if (gDef?.default !== undefined || pDef?.default !== undefined) {
      const mergedDefault: RouteFile = {};
      if (pDef?.default !== undefined && pDef.default.model !== undefined) {
        mergedDefault.model = pDef.default.model;
      } else if (gDef?.default !== undefined && gDef.default.model !== undefined) {
        mergedDefault.model = gDef!.default.model;
      }
      if (gDef?.default?.thinking !== undefined || pDef?.default?.thinking !== undefined) {
        mergedDefault.thinking = pick(DEFAULT_ROUTE.thinking, pDef?.default?.thinking, gDef?.default?.thinking);
      }
      mergedDef.default = mergedDefault;
    }

    // Merge commands key-by-key.
    const gCmds = gDef?.commands ?? {};
    const pCmds = pDef?.commands ?? {};
    const allCmdNames = new Set([...Object.keys(gCmds), ...Object.keys(pCmds)]);
    if (allCmdNames.size > 0) {
      mergedDef.commands = {};
      for (const cmd of allCmdNames) {
        const mergedCmd = mergeRouteFiles(gCmds[cmd], pCmds[cmd]);
        if (mergedCmd) mergedDef.commands[cmd] = mergedCmd;
      }
    }

    if (Object.keys(mergedDef).length > 0) {
      result[name] = mergedDef;
    }
  }
  return result;
}

/** Per-key merge for profileFallback: each field independently
 *  takes project value, then global value, then the shipped default. */
function mergeProfileFallback(
  globalFb: Partial<ProfileFallbackConfig> | undefined,
  projectFb: Partial<ProfileFallbackConfig> | undefined,
): ProfileFallbackConfig {
  return {
    applyTo: pick(DEFAULT_PROFILE_FALLBACK.applyTo, projectFb?.applyTo, globalFb?.applyTo),
    resume: pick(DEFAULT_PROFILE_FALLBACK.resume, projectFb?.resume, globalFb?.resume),
    retryAfterSeconds: pick(DEFAULT_PROFILE_FALLBACK.retryAfterSeconds, projectFb?.retryAfterSeconds, globalFb?.retryAfterSeconds),
  };
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

  // Feature 63 — model profiles: computed declaredness from raw files.
  const declaredDefault: RouteDeclaration = {
    model: globalFile.default?.model !== undefined || projectFile.default?.model !== undefined,
    thinking: globalFile.default?.thinking !== undefined || projectFile.default?.thinking !== undefined,
  };
  const declaredCommands: Record<string, RouteDeclaration> = {};
  for (const name of new Set([...Object.keys(globalCommands), ...Object.keys(projectCommands)])) {
    declaredCommands[name] = {
      model: declaredDefault.model || globalCommands[name]?.model !== undefined || projectCommands[name]?.model !== undefined,
      thinking: declaredDefault.thinking || globalCommands[name]?.thinking !== undefined || projectCommands[name]?.thinking !== undefined,
    };
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
    // Feature 63 — model profiles.
    recommendedModels: pick(true, projectFile.recommendedModels, globalFile.recommendedModels),
    profiles: mergeProfiles(globalFile.profiles, projectFile.profiles),
    profileOrder: pick([], projectFile.profileOrder, globalFile.profileOrder),
    profileFallback: mergeProfileFallback(globalFile.profileFallback, projectFile.profileFallback),
    declared: { default: declaredDefault, commands: declaredCommands },
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
