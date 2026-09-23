/**
 * The configuration vocabulary shared by every layer of the package (SPEC S5–S8).
 *
 * Two distinct shapes exist on purpose:
 *  - `ConfigFile` is what an operator WRITES: everything optional, exactly the
 *    three keys the SPEC's config schema names, nothing more.
 *  - `EffectiveConfig` is what the extension READS after merge: every route
 *    fully resolved, so no downstream code has to reason about optionality.
 */

import type { PathProtectionOverride, ResolvedPathPolicy } from "./path-policy.js";

/** Pi's thinking levels, mirrored here so the domain layer stays Pi-free. */
export const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"] as const;

export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

/** A thinking level, or `inherit` = "whatever the session already uses". */
export type ThinkingSetting = ThinkingLevel | "inherit";

/** `"inherit"` or an exact `provider/modelId` reference (split at the first slash). */
export type ModelRef = `${string}/${string}`;
/** An ordered fallback chain of references; the first resolvable + configured entry wins (issue #154, root cause E). */
export type ModelChain = readonly ModelRef[];
/**
 * `"inherit"`, one reference, or an ordered fallback chain of 1–4 references.
 * A chain is probed by order, and the first entry that resolves AND has
 * configured auth is applied (OB-6, OB-8, OB-9).
 */
export type ModelSetting = "inherit" | ModelRef | ModelChain;

/** Cap on chain length (issue deliberation: 8 was "almost certainly a mistake"; 4 keeps the view readable). */
export const MAX_MODEL_CHAIN = 4;

export interface Route {
  model: ModelSetting;
  thinking: ThinkingSetting;
}

/** What one config file may declare (SPEC "Config schema"). */
export interface RouteFile {
  model?: ModelSetting;
  thinking?: ThinkingSetting;
}

export interface ConfigFile {
  default?: RouteFile;
  commands?: Record<string, RouteFile>;
  onUnavailableRoute?: UnavailableRoutePolicy;
  /** What happens to the routed model and thinking level after the command settles. */
  onSettle?: SettlePolicy;
  /** The tighten-only path-protection override (feature 60, AC10). */
  pathProtection?: PathProtectionOverride;
  /** Conductor (advance) knobs (feature 62). */
  advance?: AdvanceConfigFile;
}

export type UnavailableRoutePolicy = "stop" | "inherit";

/**
 * What the session holds after a routed command settles.
 *  - `"keep"` — the routed model and thinking level stay in the open chat window,
 *    so a follow-up edit or question keeps running on the model that planned it.
 *  - `"restore"` — the pre-dispatch model and thinking level come back (AC8).
 */
export type SettlePolicy = "keep" | "restore";

/** One rejected field inside one config file, addressed by a JSON-path-ish string. */
export interface ConfigIssue {
  path: string;
  message: string;
}

export const UNAVAILABLE_ROUTE_POLICIES: readonly UnavailableRoutePolicy[] = ["stop", "inherit"];

export const SETTLE_POLICIES: readonly SettlePolicy[] = ["keep", "restore"];

export interface EffectiveConfig {
  default: Route;
  commands: Record<string, Route>;
  onUnavailableRoute: UnavailableRoutePolicy;
  onSettle: SettlePolicy;
  /** The effective path-protection policy: the shipped floor tightened by any override. */
  pathProtection: ResolvedPathPolicy;
  /** The effective advance (conductor) knobs (feature 62). Resolved by
   *  mergeConfigs; the shipped DEFAULT_CONFIG predates it and leaves it
   *  absent — consumers fall back to DEFAULT_ADVANCE_CONFIG. */
  advance?: AdvanceConfig;
}

export interface ConfigProblem {
  scope: "global" | "project";
  path: string;
  message: string;
}

/** Absolute paths of the two dedicated JSON files (never Pi `settings.json`). */
export interface ConfigPaths {
  global: string;
  project: string;
}

// ---------------------------------------------------------------------------
// Advance (conductor) configuration
// ---------------------------------------------------------------------------

/** Per-iteration control knobs for the conductor loop. */
export interface AdvanceConfigFile {
  iterationsCap?: number;
  sensitivePaths?: string[];
  securityPaths?: string[];
  runLogPath?: string;
}

/** Effective advance configuration with all fields resolved. */
export interface AdvanceConfig {
  iterationsCap: number;
  sensitivePaths: string[];
  securityPaths: string[];
  runLogPath: string;
}

/** The shipped advance defaults (mirrors conductor DEFAULT_CONDUCTOR_CONFIG). */
export const DEFAULT_ADVANCE_CONFIG: Readonly<AdvanceConfig> = {
  iterationsCap: 12,
  sensitivePaths: [] as string[],
  securityPaths: [] as string[],
  runLogPath: ".agentic-workflow/advance-run.log",
};
