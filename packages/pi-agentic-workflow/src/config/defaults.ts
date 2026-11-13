import { BASE_CONFIG_SECTIONS, normalizeLogSession, resolveConfigDocuments } from "@gtrabanco/agentic-workflow-schema";

import { normalizeGitIdentity } from "../guards/git-identity.js";
import { SHIPPED_PATH_POLICY, intersectPathPolicy } from "./path-policy.js";
import type { PathProtectionOverride } from "./path-policy.js";
import type { AdvanceConfig, GuardsConfig, LogSessionConfig, MemoryConfig, TelemetryConfig } from "./types.js";
import { DEFAULT_PROFILE_FALLBACK, DEFAULT_STATE_FLOW } from "./types.js";
import type { EffectiveConfig, Route, RouteDeclaration } from "./types.js";

/**
 * The in-package default (SPEC S6, D-P6): a fresh install with no config file
 * anywhere routes every command on the session model, and the fail-closed
 * fallback policy starts at `stop`.
 *
 * The feature half is not written here: it is read from the shared schema
 * package's own shipped defaults (issue #427), so the CLI and the extension can
 * never disagree about what "absent" means.
 */
export const DEFAULT_ROUTE: Route = { model: "inherit", thinking: "inherit" };

/** The pi extension file's shipped defaults (routing, profiles, passes, state flow). */
export const DEFAULT_PI_CONFIG = {
  default: { ...DEFAULT_ROUTE },
  commands: {},
  onUnavailableRoute: "stop" as const,
  onSettle: "keep" as const,
  recommendedModels: true,
  profiles: {},
  profileOrder: [],
  profileFallback: { ...DEFAULT_PROFILE_FALLBACK },
  passes: {},
  subagents: {},
  stateFlow: { ...DEFAULT_STATE_FLOW, commands: [...DEFAULT_STATE_FLOW.commands] },
  declared: { default: { model: false, thinking: false } as RouteDeclaration, commands: {} as Record<string, RouteDeclaration> },
};

const shippedBase = resolveConfigDocuments({ sections: BASE_CONFIG_SECTIONS, global: {}, project: {} }).config;

/** The base feature file's shipped values, in the shapes the extension reads. */
export const BASE_EFFECTIVE_DEFAULTS: {
  logSession: LogSessionConfig;
  memory: MemoryConfig;
  telemetry: TelemetryConfig;
  guards: GuardsConfig;
  advance: AdvanceConfig;
  pathProtection: ReturnType<typeof intersectPathPolicy>;
  gitIdentity: ReturnType<typeof normalizeGitIdentity>;
} = {
  logSession: normalizeLogSession(shippedBase.logSession),
  memory: shippedBase.memory as MemoryConfig,
  telemetry: shippedBase.telemetry as TelemetryConfig,
  guards: shippedBase.guards as GuardsConfig,
  advance: shippedBase.advance as AdvanceConfig,
  pathProtection: intersectPathPolicy(SHIPPED_PATH_POLICY, shippedBase.pathProtection as PathProtectionOverride),
  gitIdentity: normalizeGitIdentity(shippedBase.gitIdentity),
};

export const DEFAULT_CONFIG: EffectiveConfig = {
  ...DEFAULT_PI_CONFIG,
  ...BASE_EFFECTIVE_DEFAULTS,
};
