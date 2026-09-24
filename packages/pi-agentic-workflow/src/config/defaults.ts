import type { EffectiveConfig, Route, RouteDeclaration } from "./types.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy } from "./path-policy.js";
import { DEFAULT_PROFILE_FALLBACK } from "./types.js";

/**
 * The in-package default (SPEC S6, D-P6): a fresh install with no config file
 * anywhere routes every command on the session model, and the fail-closed
 * fallback policy starts at `stop`.
 */
export const DEFAULT_ROUTE: Route = { model: "inherit", thinking: "inherit" };

export const DEFAULT_CONFIG: EffectiveConfig = {
  default: { ...DEFAULT_ROUTE },
  commands: {},
  onUnavailableRoute: "stop",
  onSettle: "keep",
  // Feature 60 added the resolved path-protection policy to the effective
  // config; the shipped floor with no override and no degradation.
  pathProtection: intersectPathPolicy(SHIPPED_PATH_POLICY, {}),
  // Feature 63 — model profiles: recommended built-in profiles, empty
  // named profiles, empty order (default-only), and default demotion policy.
  recommendedModels: true,
  profiles: {},
  profileOrder: [],
  profileFallback: { ...DEFAULT_PROFILE_FALLBACK },
  // Feature 63 — model profiles: declared keys (none, zero-config).
  declared: { default: { model: false, thinking: false } as RouteDeclaration, commands: {} as Record<string, RouteDeclaration> },
};
