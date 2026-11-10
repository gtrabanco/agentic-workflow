// src/config/presets.ts
// The provider-preset contribution seam (issue #388).
//
// The package ships provider-neutral: a vendor's model ladder lives in an
// optional companion package, which registers a preset here at extension-load
// time. This module knows the
// *shape* of a preset — provider id + a resolver that turns the merged config
// into a ladder — and never a provider name. With nothing registered,
// `recommendedModels: true` is a documented no-op.
//
// The registry is deliberately process-global and synchronous: profile
// resolution runs inside a routed dispatch and cannot await discovery, and
// companion extensions load before any command dispatch (Pi loads every
// installed package's extension at startup).

import type { EffectiveConfig, RecommendedProfile } from "./types.js";

/** What a preset's resolver receives: the merged, validated config. */
export interface PresetResolutionInput {
  config: EffectiveConfig;
}

/**
 * One provider preset. `resolveProfile` is called per resolution and must be
 * pure — the same config must derive the same ladder — so a companion can
 * honor generic switches (e.g. `tierRouting`) without this package knowing
 * their meaning.
 */
export interface ProviderPreset {
  /** The provider id the preset routes to (`provider/modelId` prefix) and the
   *  profile name it contributes to the chain. */
  provider: string;
  resolveProfile(input: PresetResolutionInput): RecommendedProfile;
}

const registry = new Map<string, ProviderPreset>();

/** Register a preset; a re-registration under the same provider replaces it. */
export function registerProviderPreset(preset: ProviderPreset): void {
  if (!preset || typeof preset.provider !== "string" || preset.provider.length === 0) {
    throw new TypeError("registerProviderPreset: preset.provider must be a non-empty string");
  }
  if (typeof preset.resolveProfile !== "function") {
    throw new TypeError("registerProviderPreset: preset.resolveProfile must be a function");
  }
  registry.set(preset.provider, preset);
}

/** Remove one preset by provider id. */
export function unregisterProviderPreset(provider: string): void {
  registry.delete(provider);
}

/** Remove every preset — test isolation. */
export function clearProviderPresets(): void {
  registry.clear();
}

/** The registered presets, in registration order. */
export function getProviderPresets(): readonly ProviderPreset[] {
  return [...registry.values()];
}

/** Look one preset up by provider id. */
export function findProviderPreset(provider: string): ProviderPreset | undefined {
  return registry.get(provider);
}
