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

// ---------------------------------------------------------------------------
// Model-profiles fields (feature 63)
// ---------------------------------------------------------------------------

export const PROFILE_FALLBACK_APPLY_TO = ["flow", "command"] as const;
export type ProfileFallbackApplyTo = (typeof PROFILE_FALLBACK_APPLY_TO)[number];

export const PROFILE_FALLBACK_RESUME = ["continue", "restart"] as const;
export type ProfileFallbackResume = (typeof PROFILE_FALLBACK_RESUME)[number];

export interface ProfileFile {
  default?: RouteFile;
  commands?: Record<string, RouteFile>;
}

export interface ProfileFallbackConfig {
  applyTo: ProfileFallbackApplyTo;
  resume: ProfileFallbackResume;
  retryAfterSeconds: number;
}

export const DEFAULT_PROFILE_FALLBACK: Readonly<ProfileFallbackConfig> = {
  applyTo: "flow",
  resume: "continue",
  retryAfterSeconds: 86400,
};

export interface ProfileCandidate {
  profile: string;
  builtIn: boolean;
  route: Route;
  declared: { model: boolean; thinking: boolean };
}

export interface Route {
  model: ModelSetting;
  thinking: ThinkingSetting;
}

/** Feature 63: which route keys a scope actually declared (vs. the shipped inherit). */
export interface RouteDeclaration { model: boolean; thinking: boolean; }

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
  /** When true (default), the built-in provider profiles are included in the
   *  resolution chain (feature 63, AC1). */
  recommendedModels?: boolean;
  /** Feature 66 (AC3/D3): the memory-substrate consent surface — Engram's MCP
   *  registration is ask-first, so nothing is provisioned unless this says so. */
  memory?: MemoryConfigFile;
  /** Tool-call guards (owner-gated merges, history, CI, expensive tests).
   *  Everything absent stays off. */
  guards?: GuardsConfigFile;
  /** Named user profiles keyed by profile name (feature 63, AC5). */
  profiles?: Record<string, ProfileFile>;
  /** Ordered list of profile names to probe; empty means ["default"] only
   *  (feature 63, AC6). */
  profileOrder?: string[];
  /** Partial override for the profile-fallback demotion policy (feature 63). */
  profileFallback?: Partial<ProfileFallbackConfig>;
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
/** What an operator WRITES under `memory` (feature 66). */
export interface MemoryConfigFile {
  /** Opt in to the package registering the Engram MCP server when its binary
   *  resolves. Absent or `false` registers nothing. */
  engram?: boolean;
}

/** What the extension READS: every `memory` knob resolved (feature 66). */
export interface MemoryConfig {
  engram: boolean;
}

/**
 * One tool-call guard, as an operator WRITES it (this repository's working
 * rules, made mechanical; every other project gets none of it unless it
 * configures it). Each guard ships disabled — an absent key is OFF.
 *
 *   merge           every direct merge route is owner-only: `git merge`,
 *                   `gh pr merge`, and `git pull`'s merge form.
 *   history         pushes are decided by asking git (`git push --dry-run`):
 *                   a forced update, a ref delete or a push to `main` is
 *                   declined — one mechanism covering every flag spelling and
 *                   git alias.
 *   ci              CI is owner-gated: creating workflow files and triggering
 *                   workflow runs are blocked.
 *   expensiveTests  commands matching a configured pattern are estimated in
 *                   tokens; above `maxTokens` they are blocked. `tokens: 0`
 *                   blocks every match regardless of estimate.
 *
 * The only way through a guard is the explicit per-command token — the
 * command's first word — after an owner authorization in the same turn:
 * `AW_ALLOW=merge`, `AW_ALLOW=force`, `AW_ALLOW=ci`, `AW_ALLOW=cost`.
 */
export interface GuardsConfigFile {
  merge?: boolean;
  history?: boolean;
  ci?: GuardsCiFile;
  expensiveTests?: GuardsExpensiveTestsFile;
}

export interface GuardsCiFile {
  create?: boolean;
  run?: boolean;
}

export interface GuardsExpensiveTestsFile {
  /** Estimated-token ceiling; a match above it is blocked. `0` (default)
   *  blocks every match regardless of estimate. */
  maxTokens?: number;
  /** Command patterns (regex source, `u` flag) and their estimated cost. */
  patterns?: GuardsCostPattern[];
}

export interface GuardsCostPattern {
  match: string;
  tokens: number;
}

/** What the extension READS: every guard knob resolved. */
export interface GuardsConfig {
  merge: boolean;
  history: boolean;
  ci: { create: boolean; run: boolean };
  expensiveTests: { maxTokens: number; patterns: GuardsCostPattern[] };
}

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
  /** Whether the built-in provider profiles (currently only "nan") are
   *  included in the resolution chain (feature 63, AC1). */
  recommendedModels: boolean;
  /** Named user profiles keyed by profile name (feature 63, AC5). */
  profiles: Record<string, ProfileFile>;
  /** Ordered list of profile names to probe (feature 63, AC6). */
  profileOrder: string[];
  /** The effective profile-fallback demotion policy (feature 63). */
  profileFallback: ProfileFallbackConfig;
  /** Feature 66: the memory-substrate consent surface. */
  memory: MemoryConfig;
  /** The effective tool-call guards (all off unless a config file enables them). */
  guards: GuardsConfig;
  /** Feature 63: declaredness of the implicit `default` profile. */
  declared: { default: RouteDeclaration; commands: Record<string, RouteDeclaration> };
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
