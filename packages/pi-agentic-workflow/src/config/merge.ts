import { DEFAULT_PI_CONFIG, DEFAULT_ROUTE, BASE_EFFECTIVE_DEFAULTS } from "./defaults.js";
import { DEFAULT_PROFILE_FALLBACK, DEFAULT_STATE_FLOW } from "./types.js";
import type {
  ConfigFile,
  EffectiveConfig,
  PassRouteFile,
  ProfileFile,
  ProfileFallbackConfig,
  Route,
  RouteDeclaration,
  RouteFile,
  StateFlowConfig,
  SubagentsConfigFile,
} from "./types.js";

/**
 * Project-over-global merge (SPEC S5, S6) for the pi extension file.
 *
 * Merge granularity is the individual route key, not the route object: a
 * project that sets only `commands.x.model` keeps the global `thinking` for
 * that command. A command neither scope mentions falls back to the resolved
 * default route, and an absent default is the shipped `inherit`.
 *
 * The feature sections are not merged here: they live in the base file and are
 * resolved by the shared schema package before this function runs. `base` is
 * the already-resolved feature half, so the result is one complete
 * `EffectiveConfig` and no consumer reasons about which file a value came from.
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
    if (projectRoute?.model !== undefined) {
      out.model = projectRoute.model;
    } else if (globalRoute?.model !== undefined) {
      out.model = globalRoute.model;
    }
  }
  if (globalRoute?.thinking !== undefined || projectRoute?.thinking !== undefined) {
    out.thinking = projectRoute?.thinking ?? globalRoute?.thinking;
  }
  return out;
}

/** Merge two profile maps: a profile present in either scope resolves per route key. */
function mergeProfiles(
  globalProfiles: Record<string, ProfileFile> | undefined,
  projectProfiles: Record<string, ProfileFile> | undefined,
): Record<string, ProfileFile> {
  const out: Record<string, ProfileFile> = {};
  const names = new Set([...Object.keys(globalProfiles ?? {}), ...Object.keys(projectProfiles ?? {})]);
  for (const name of names) {
    const globalProfile = globalProfiles?.[name];
    const projectProfile = projectProfiles?.[name];
    const profile: ProfileFile = {};
    const defaultRoute = mergeRouteFiles(globalProfile?.default, projectProfile?.default);
    if (defaultRoute !== undefined) profile.default = defaultRoute;
    const commands: Record<string, RouteFile> = {};
    const commandNames = new Set([
      ...Object.keys(globalProfile?.commands ?? {}),
      ...Object.keys(projectProfile?.commands ?? {}),
    ]);
    for (const command of commandNames) {
      const merged = mergeRouteFiles(globalProfile?.commands?.[command], projectProfile?.commands?.[command]);
      if (merged !== undefined) commands[command] = merged;
    }
    if (Object.keys(commands).length > 0) profile.commands = commands;
    out[name] = profile;
  }
  return out;
}

/** Issue #388 amendment 1 — merge for the `tierRouting` opt-out. A boolean
 *  declaration overrides the other scope wholesale (it is the whole policy);
 *  two objects merge key-wise so a project's per-skill override keeps the
 *  global `enabled`. Undefined when neither scope declares one — routing on. */
function mergeTierRouting(
  globalTr: ConfigFile["tierRouting"],
  projectTr: ConfigFile["tierRouting"],
): ConfigFile["tierRouting"] | undefined {
  if (typeof projectTr === "boolean" || typeof globalTr === "boolean") {
    return pick(undefined, typeof projectTr === "boolean" ? projectTr : undefined, typeof globalTr === "boolean" ? globalTr : undefined);
  }
  if (projectTr === undefined && globalTr === undefined) return undefined;
  const skills: Record<string, boolean> = { ...(globalTr?.skills ?? {}) };
  for (const [name, flag] of Object.entries(projectTr?.skills ?? {})) skills[name] = flag;
  const merged: { enabled?: boolean; skills?: Record<string, boolean> } = {};
  const enabled = projectTr?.enabled ?? globalTr?.enabled;
  if (enabled !== undefined) merged.enabled = enabled;
  if (Object.keys(skills).length > 0) merged.skills = skills;
  return merged;
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

export function mergeConfigs(
  globalFile: ConfigFile = {},
  projectFile: ConfigFile = {},
  base: Pick<EffectiveConfig, "logSession" | "memory" | "telemetry" | "guards" | "advance" | "pathProtection"> = BASE_EFFECTIVE_DEFAULTS,
): EffectiveConfig {
  const effectiveDefault = resolveRoute(DEFAULT_ROUTE, globalFile.default, projectFile.default);

  const globalCommands = globalFile.commands ?? {};
  const projectCommands = projectFile.commands ?? {};
  const commands: Record<string, Route> = {};
  for (const name of new Set([...Object.keys(globalCommands), ...Object.keys(projectCommands)])) {
    commands[name] = resolveRoute(effectiveDefault, globalCommands[name], projectCommands[name]);
  }

  // Issue #201 — spawned-pass routes merge at entry and per route-key
  // granularity, the same transaction rule the commands above follow.
  const globalPasses = globalFile.passes ?? {};
  const projectPasses = projectFile.passes ?? {};
  const passes: Record<string, PassRouteFile> = {};
  for (const name of new Set([...Object.keys(globalPasses), ...Object.keys(projectPasses)])) {
    const entry: PassRouteFile = {};
    const model = projectPasses[name]?.model ?? globalPasses[name]?.model;
    if (model !== undefined) entry.model = model;
    const projectThinking = projectPasses[name]?.thinking;
    const globalThinking = globalPasses[name]?.thinking;
    if (projectThinking !== undefined || globalThinking !== undefined) {
      entry.thinking = pick(DEFAULT_ROUTE.thinking, projectThinking, globalThinking);
    }
    passes[name] = entry;
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

  // Issue #388 amendment 1 — the tier-routing opt-out (see the return below).
  const tierRouting = mergeTierRouting(globalFile.tierRouting, projectFile.tierRouting);

  return {
    ...base,
    default: effectiveDefault,
    commands,
    onUnavailableRoute: (projectFile.onUnavailableRoute ?? globalFile.onUnavailableRoute ?? DEFAULT_PI_CONFIG.onUnavailableRoute) as EffectiveConfig["onUnavailableRoute"],
    onSettle: (projectFile.onSettle ?? globalFile.onSettle ?? DEFAULT_PI_CONFIG.onSettle) as EffectiveConfig["onSettle"],
    recommendedModels: pick(true, projectFile.recommendedModels, globalFile.recommendedModels),
    profiles: mergeProfiles(globalFile.profiles, projectFile.profiles),
    profileOrder: pick([], projectFile.profileOrder, globalFile.profileOrder),
    profileFallback: mergeProfileFallback(globalFile.profileFallback, projectFile.profileFallback),
    // Issue #388 amendment 1 — the tier-routing opt-out: a boolean wins
    // wholesale (project, then global); two objects merge key-wise (enabled
    // scalar, skills per command). Absent in both scopes means routing on, and
    // the key stays absent so the resolved shape never carries an undefined.
    ...(tierRouting !== undefined ? { tierRouting } : {}),
    passes,
    subagents: mergeSubagents(globalFile.subagents, projectFile.subagents),
    stateFlow: mergeStateFlow(globalFile.stateFlow, projectFile.stateFlow),
    declared: { default: declaredDefault, commands: declaredCommands },
  };
}

/** Issue #174 — project-over-global merge of the `stateFlow` block. Scalars
 *  per field; the allowlist whole (a half-merged allowlist would silently
 *  widen or narrow the command set the operator believes they chose). */
function mergeStateFlow(globalStateFlow: ConfigFile["stateFlow"], projectStateFlow: ConfigFile["stateFlow"]): StateFlowConfig {
  const commands = pick(undefined, projectStateFlow?.commands, globalStateFlow?.commands);
  return {
    enabled: pick(DEFAULT_STATE_FLOW.enabled, projectStateFlow?.enabled, globalStateFlow?.enabled) === true,
    backend: pick(DEFAULT_STATE_FLOW.backend, projectStateFlow?.backend, globalStateFlow?.backend),
    commands: commands === undefined ? [...DEFAULT_STATE_FLOW.commands] : [...commands],
    stopOn: pick(DEFAULT_STATE_FLOW.stopOn, projectStateFlow?.stopOn, globalStateFlow?.stopOn),
    onBackendMissing: pick(DEFAULT_STATE_FLOW.onBackendMissing, projectStateFlow?.onBackendMissing, globalStateFlow?.onBackendMissing),
  };
}

/** Issue #260 — project-over-global merge of the `subagents` resource limits
 *  (owner decision 6): per-key. An empty record when neither scope declares
 *  any — the resolved shape of configs that predate the key is byte-stable. */
function mergeSubagents(globalSubagents?: SubagentsConfigFile, projectSubagents?: SubagentsConfigFile): SubagentsConfigFile {
  const merged: SubagentsConfigFile = {};
  const keys = new Set([...Object.keys(globalSubagents ?? {}), ...Object.keys(projectSubagents ?? {})]) as Set<keyof SubagentsConfigFile>;
  for (const key of keys) {
    const value = projectSubagents?.[key] ?? globalSubagents?.[key];
    if (value !== undefined) (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}

/** The route a command runs under: its own resolved override, else the default route. */
export function effectiveRoute(config: EffectiveConfig, command: string): Route {
  return config.commands[command] ?? config.default;
}
