import type { EffectiveConfig, Route, RouteDeclaration } from "./types.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy } from "./path-policy.js";
import { DEFAULT_PROFILE_FALLBACK, DEFAULT_STATE_FLOW } from "./types.js";

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
  // Feature 66 — the memory substrate is ask-first: nothing is provisioned
  // until the operator opts in.
  memory: { engram: false },
  // Issue #383 — the measured acceptance is opt-in: a fresh install measures
  // nothing until an operator turns it on.
  telemetry: { enabled: false },
  // #394 — automatic logging is opt-in: off by default, and no publisher named.
  autoLogSession: { mode: "off", publisher: null },
  profiles: {},
  profileOrder: [],
  profileFallback: { ...DEFAULT_PROFILE_FALLBACK },
  // Issue #201 — no shipped pass entries: the resolver owns the fail-closed
  // chain, and an unconfigured install resolves every pass to the documented
  // floor (cheap tier, else inline) rather than a compiled-in model.
  passes: {},
  // Issue #260 — no shipped subagent resource limits: the resource layer owns
  // the self-detected envelope (conservative defaults), and an unconfigured
  // install runs automatic, never compiled-in caps.
  subagents: {},
  // Issue #174 — the State Flow episode lifecycle is opt-in: off by default,
  // the shipped allowlist covers the two longest procedural loops, and a
  // missing backend degrades to a single warning, never a refused command.
  stateFlow: { ...DEFAULT_STATE_FLOW, commands: [...DEFAULT_STATE_FLOW.commands] },
  // Feature 63 — model profiles: declared keys (none, zero-config).
  declared: { default: { model: false, thinking: false } as RouteDeclaration, commands: {} as Record<string, RouteDeclaration> },
};
