import type { EffectiveConfig, ProfileCandidate, Route, RouteFile, RouteDeclaration } from "./types.js";
import { findProviderPreset, getProviderPresets, presetChainName, resolvePresetEntry } from "./presets.js";

/** Options for recommended-profile resolution. */
export interface RecommendedOptions {
  providerAvailable: (provider: string) => boolean;
}

/** The `presetProfile` selection as the chain consumes it: an ordered list of
 *  profile names, one entry per requested profile (string → one-element
 *  list). Absent → undefined. */
export function normalizePresetProfile(config: EffectiveConfig): string[] | undefined {
  const value = config.presetProfile;
  if (value === undefined) return undefined;
  return Array.isArray(value) ? [...value] : [value];
}

/** The chain names one preset contributes given the merged selection:
 *  legacy presets always contribute their bare provider name; catalog presets
 *  contribute one `provider.profile` entry per requested catalog member, in
 *  request order, falling back to the preset's default entry when the
 *  selection is empty or names nothing the catalog carries (a typo must not
 *  silently drop the provider out of the chain). */
function presetEntries(config: EffectiveConfig, preset: NonNullable<ReturnType<typeof findProviderPreset>>): string[] {
  const catalog = preset.profiles;
  if (catalog === undefined) return [preset.provider];
  const selection = normalizePresetProfile(config);
  const names = (selection ?? [])
    .filter((name) => catalog.includes(name))
    .map((name) => presetChainName(preset, name));
  if (names.length === 0) {
    names.push(presetChainName(preset, preset.defaultProfile ?? catalog[0]));
  }
  return names;
}

/**
 * Compute the ordered list of profile names to probe for a command.
 *
 * Rules:
 *  - Start from `config.profileOrder` if non-empty, else `["default"]`.
 *  - If `config.recommendedModels` is true, append every registered provider
 *    preset whose provider is available (issue #388) — unless it is already
 *    present in the order. No preset registered → nothing appended.
 *  - Returns a fresh array so callers may mutate without side effects.
 */
export function effectiveProfileOrder(
  config: EffectiveConfig,
  opts: RecommendedOptions,
): string[] {
  const base: string[] =
    config.profileOrder.length > 0 ? config.profileOrder : ["default"];
  const result = [...base];
  if (config.recommendedModels) {
    for (const preset of getProviderPresets()) {
      if (!opts.providerAvailable(preset.provider)) continue;
      for (const entry of presetEntries(config, preset)) {
        if (!result.includes(entry)) result.push(entry);
      }
    }
  }
  return result;
}

/**
 * Resolve a profile chain for one command.
 *
 * Iterates the ordered profile names from `effectiveProfileOrder`. For each name:
 *  - a registered preset's provider → the preset's derived ladder
 *    (`resolveProfile({ config })`), unless the user overrode the profile in
 *    `config.profiles[name]` (issue #388).
 *  - `default` → the implicit profile made from `config.default` and
 *    `config.commands` (top-level, already-merged).
 *  - Any other name → `config.profiles[name]` (user-defined profile).
 *
 * Skip names with no profile definition.
 * For each candidate, compute the route file from the command's explicit
 * command route or the profile's default route. Skip if neither is defined.
 *
 * A preset-backed profile the user did not override always reports
 * `declared = { model: true, thinking: true }`.
 *
 * Returns candidates in order, each with its route and per-key declaration
 * status.
 */
export function resolveProfileChain(
  config: EffectiveConfig,
  command: string,
  opts: RecommendedOptions,
): ProfileCandidate[] {
  const profileNames = effectiveProfileOrder(config, opts);
  const candidates: ProfileCandidate[] = [];

  for (const name of profileNames) {
    const entry = resolvePresetEntry(name);
    let def: { default?: RouteFile; commands?: Record<string, RouteFile> } | undefined;

    if (entry) {
      const { preset, profile } = entry;
      def = config.profiles[name] ?? preset.resolveProfile({ config, profile });
    } else if (name === "default") {
      def = { default: config.default, commands: config.commands };
    } else {
      def = config.profiles[name];
    }

    if (!def) {
      continue;
    }

    const routeFile: RouteFile | undefined =
      def.commands?.[command] ?? def.default;
    if (routeFile === undefined) {
      continue;
    }

    // Determine per-key declaredness from the raw file presence (not value).
    // For the "default" profile the declared info comes from the merged
    // EffectiveConfig.declared surface; for named profiles we check raw
    // presence; a preset-backed profile the user did not override always
    // declares both.
    let declared: RouteDeclaration;
    if (entry && config.profiles[name] === undefined) {
      // Preset-contributed profile: the companion declares both keys.
      declared = { model: true, thinking: true };
    } else if (name === "default") {
      // Use the merged declared surface (carries raw-file presence).
      declared = config.declared.commands[command] ?? config.declared.default;
    } else {
      // User-defined named profile (including one shadowing a preset): check raw presence.
      const routeFileDef = config.profiles[name];
      const rFile = routeFileDef?.commands?.[command] ?? routeFileDef?.default;
      declared = {
        model: rFile?.model !== undefined,
        thinking: rFile?.thinking !== undefined,
      };
    }

    // Skip candidates that declare nothing (covers both: truly empty
    // routeFile, and the shipped inherit/inherit default).
    if (!declared.model && !declared.thinking) {
      continue;
    }

    const route: Route = {
      model: routeFile.model ?? "inherit",
      thinking: routeFile.thinking ?? "inherit",
    };

    const builtIn = entry !== undefined && config.profiles[name] === undefined;

    candidates.push({
      profile: name,
      builtIn,
      route,
      declared,
    });
  }

  return candidates;
}