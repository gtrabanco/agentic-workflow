// src/settings/view.ts
// The settings console's display half (AC10, SPEC S4): what is in effect right
// now, and which files the values came from.

import type { ConfigProblem, EffectiveConfig, Route } from "../config/types.js";
import { effectiveProfileOrder } from "../config/profiles.js";
import { getProviderPresets } from "../config/presets.js";
import type { LoadedConfig } from "../config/load.js";
/** The label for the unqualified route, so `default` is never mistaken for a command name. */
export const DEFAULT_ROUTE = "the default route";

/**
 * The field path the schema would report for a route target, e.g.
 * `$.commands.plan-feature.model` — the same shape a config problem uses (AC5),
 * so a rejection and a file error read identically to the operator.
 */
export function routePath(target: string): string {
  return target === DEFAULT_ROUTE ? "$.default" : `$.commands.${target}`;
}

/** What the operator reads when the console opens. */
export function renderMergedConfig(
  loaded: LoadedConfig,
  commands: readonly string[],
  opts?: { providerAvailable?: (provider: string) => boolean },
): string[] {
  const order = effectiveProfileOrder(loaded.config, {
    providerAvailable: opts?.providerAvailable ?? (() => false),
  });
  // Issue #388: one hint per registered preset whose provider is actually in
  // the live registry — the hint names the contributed profile, never a
  // hardcoded provider.
  const availablePresets = getProviderPresets().filter(
    (preset) => loaded.config.recommendedModels && opts?.providerAvailable?.(preset.provider),
  );
  const hint = availablePresets.length > 0
    ? ` (${availablePresets.map((p) => `built-in ${p.provider} profile in the chain`).join(", ")})`
    : "";
  return [
    "agentic-workflow routing — what each command runs on right now",
    `  profiles: ${order.join(" → ")}`,
    `  active profile: ${order[0] ?? "default"}`,
    `  recommended models: ${loaded.config.recommendedModels ? "on" : "off"}${hint}`,
    ...configLines(loaded.config, commands),
    ...problems(loaded.problems),
  ];
}

function configLines(config: EffectiveConfig, commands: readonly string[]): string[] {
  const overrides = Object.entries(config.commands).sort(([a], [b]) => a.localeCompare(b));
  const total = Math.max(commands.length, overrides.length);
  return [
    `  default: ${route(config.default)}`,
    ...(overrides.length === 0
      ? ["  no per-command overrides — every command uses the default route"]
      : [
          ...overrides.map(([name, value]) => `  ${name}: ${route(value)}`),
          `  ${overrides.length} of ${total} commands override the default route`,
        ]),
    `  when a configured model is unavailable: ${config.onUnavailableRoute}`,
    `  after a routed command settles: ${config.onSettle}`,
  ];
}

function route(value: Route): string {
  // A chain renders its references in order, with the fallback arrow the spec
  // names (OB-14); a single reference and `inherit` keep their existing render.
  const model = Array.isArray(value.model) ? value.model.join(" → ") : value.model;
  return `${model} / ${value.thinking}`;
}

function problems(list: readonly ConfigProblem[]): string[] {
  if (list.length === 0) return [];
  return [
    "  files with problems — the values above fall back to the shipped defaults:",
    ...list.map((issue) => `    ${issue.scope} config, ${issue.path}: ${issue.message}`),
  ];
}
