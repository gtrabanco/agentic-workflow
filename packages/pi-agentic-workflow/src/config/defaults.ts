import type { EffectiveConfig, Route } from "./types.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy } from "./path-policy.js";

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
  pathProtection: intersectPathPolicy(SHIPPED_PATH_POLICY, {}),
};
