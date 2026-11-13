/**
 * The configuration vocabulary shared by every layer of the package (SPEC S5–S8).
 *
 * Two distinct shapes exist on purpose:
 *  - `ConfigFile` is what an operator WRITES: everything optional, exactly the
 *    three keys the SPEC's config schema names, nothing more.
 *  - `EffectiveConfig` is what the extension READS after merge: every route
 *    fully resolved, so no downstream code has to reason about optionality.
 */

import type { ResolvedPathPolicy } from "./path-policy.js";

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
// Spawned-pass routing (issue #201)
// ---------------------------------------------------------------------------

/**
 * A spawned pass's declared model: the route settings plus `"auto"` — the
 * operator's explicit delegation of the model choice to the orchestrating
 * agent. It exists only because the operator wrote it (issue #201 S1).
 */
export type PassModelSetting = "inherit" | "auto" | ModelRef | ModelChain;

/** One pass entry: the same optional route keys a command route carries. */
export interface PassRouteFile {
  model?: PassModelSetting;
  thinking?: ThinkingSetting;
}

/**
 * The `passes` map: each published pass name (`PASS_NAMES`, the schema
 * package's one machine owner) may declare an entry, plus the `default`
 * escape that resolves the cheap tier for unlisted passes (owner decision
 * 2026-10-12). `default` is deliberately not a member of `PASS_NAMES` — it is
 * a config-layer name, not a spawned pass.
 */
export type PassesConfigFile = Record<string, PassRouteFile>;

/** Issue #260 (owner decision 6, 2026-10-28): the subagent layer's optional
 *  resource-limit configuration. `parallelism` is the spawn-overlap policy —
 *  `serial` (one at a time), `auto` (derived from the self-detected host
 *  envelope), or a fixed positive count; the caps are the decision-6 strings
 *  ("12 of 64 GB", "2 of 80 threads") that bound the trial envelope tighter
 *  than the host. All keys optional; validation is strict (no coercion). */
export interface SubagentsConfigFile {
  parallelism?: "serial" | "auto" | number;
  memoryCap?: string;
  threadCap?: string;
}

// ---------------------------------------------------------------------------
// State Flow lifecycle (issue #174)
// ---------------------------------------------------------------------------

/** The backends v1 accepts. v1 ships exactly one: the soft integration target. */
export const STATE_FLOW_BACKENDS = ["pi-state-flow"] as const;
export type StateFlowBackend = (typeof STATE_FLOW_BACKENDS)[number];

/** The stop policies v1 accepts: the episode ends when the command settles —
 *  the same moment model routing restores the session. */
export const STATE_FLOW_STOP_POLICIES = ["command_settled"] as const;
export type StateFlowStopPolicy = (typeof STATE_FLOW_STOP_POLICIES)[number];

/** What a dispatch does when the backend is not installed. */
export const STATE_FLOW_MISSING_POLICIES = ["noop", "refuse"] as const;
export type StateFlowMissingPolicy = (typeof STATE_FLOW_MISSING_POLICIES)[number];

/** The shipped allowlist: the longest procedural loops only. */
export const DEFAULT_STATE_FLOW_COMMANDS = ["execute-phase", "fold-findings"] as const;

/** What an operator WRITES under `stateFlow` (issue #174). Everything optional. */
export interface StateFlowConfigFile {
  /** Master switch; shipped `false` until dogfooded. */
  enabled?: boolean;
  /** v1: `"pi-state-flow"` only. */
  backend?: StateFlowBackend;
  /** Allowlist of friendly command names (no leading slash). */
  commands?: string[];
  /** v1: `"command_settled"` only. */
  stopOn?: StateFlowStopPolicy;
  /** `"noop"` (warn once) or `"refuse"` when the backend is absent. */
  onBackendMissing?: StateFlowMissingPolicy;
}

/** What the extension READS: every `stateFlow` knob resolved (issue #174). */
export interface StateFlowConfig {
  enabled: boolean;
  backend: StateFlowBackend;
  commands: string[];
  stopOn: StateFlowStopPolicy;
  onBackendMissing: StateFlowMissingPolicy;
}

export const DEFAULT_STATE_FLOW: StateFlowConfig = {
  enabled: false,
  backend: "pi-state-flow",
  commands: [...DEFAULT_STATE_FLOW_COMMANDS],
  stopOn: "command_settled",
  onBackendMissing: "noop",
};

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

/**
 * The ladder shape a provider preset contributes (issue #388): an optional
 * default route plus per-command overrides, exactly the file shape a user
 * profile carries. The preset owns how its ladder is derived — tier routing
 * lives in the companion, never here.
 */
export interface RecommendedProfile {
  default?: RouteFile;
  commands: Record<string, RouteFile>;
}

/**
 * Issue #388 amendment 1: the tier-routing opt-out. `enabled: false` is the
 * global off switch; `skills` overrides per command name. Absent keys mean
 * routing on for that command.
 */
export interface TierRoutingConfig {
  enabled?: boolean;
  skills?: Record<string, boolean>;
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
  /** When true (default), the provider profiles contributed by installed
   *  companion preset packages are included in the resolution chain
   *  (feature 63, AC1; issue #388). With no companion installed this is a
   *  documented no-op. */
  recommendedModels?: boolean;
  /** Issue #388 amendment 1: the opt-out for tier-aware presets — a global
   *  flag (`false`) or per-skill overrides ({ enabled, skills }). Absent
   *  means tier routing stays on; the tier policy itself lives in the
   *  preset, never here. */
  tierRouting?: boolean | TierRoutingConfig;
  /** Issue #388 amendment 2: the ordered selection for multi-profile presets —
   *  one profile name or an array (first = most preferred). The names are
   *  companion-defined; absent means each preset resolves its own default
   *  profile. */
  presetProfile?: string | string[];
  /** Issue #201: per-pass model/thinking declarations for spawned review
   *  passes, keyed by the published pass names plus the `default` escape. */
  passes?: PassesConfigFile;
  /** Issue #260 (owner decision 6, 2026-10-28): the optional resource-limit
   *  configuration for the subagent layer — parallelism plus explicit caps in
   *  the "<n> of <m> <unit>" shape. Optional: absent means the automatic
   *  default (self-detected host envelope, conservative defaults). */
  subagents?: SubagentsConfigFile;
  /** Issue #174: the opt-in, command-scoped State Flow episode lifecycle. */
  stateFlow?: StateFlowConfigFile;
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
/** What the extension READS: every `memory` knob resolved (feature 66). */
export interface MemoryConfig {
  engram: boolean;
}

/** What the extension READS: automatic session logging, resolved. */
export interface LogSessionConfig {
  enabled: boolean;
  publisher: { command: string[]; timeoutMs: number } | null;
}

/** What the extension READS: guard switches, resolved. */
export interface GuardsConfig {
  merge: boolean;
  history: boolean;
  ci: boolean;
  cost: { maxTokens: number };
}

/** What the extension READS: the approved identity profile and the agent-side
 *  guard (issue #514). Owned by the guard module, which is the section's only
 *  consumer with rules attached to it. */
export type { GitIdentityConfig, GitIdentityApproved, GitIdentityAgentGuard } from "../guards/git-identity.js";

/** What the extension READS: the telemetry switch, resolved (issue #383). */
export interface TelemetryConfig {
  enabled: boolean;
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
  /** The approved identity profile and the agent config-write guard (issue #514). */
  gitIdentity: import("../guards/git-identity.js").GitIdentityConfig;
  /** The effective advance (conductor) knobs (feature 62). */
  advance: AdvanceConfig;
  /** Whether the provider profiles contributed by installed companion preset
   *  packages are included in the resolution chain (feature 63, AC1; issue
   *  #388). No companion installed → no preset profiles, by design. */
  recommendedModels: boolean;
  /** Issue #388 amendment 1: the tier-routing opt-out, merged project over
   *  global. Absent means routing on. */
  tierRouting?: boolean | TierRoutingConfig;
  /** Issue #388 amendment 2: the presetProfile selection, merged project over
   *  global. Absent means each preset resolves its own default profile. */
  presetProfile?: string | string[];
  /** Named user profiles keyed by profile name (feature 63, AC5). */
  profiles: Record<string, ProfileFile>;
  /** Ordered list of profile names to probe (feature 63, AC6). */
  profileOrder: string[];
  /** The effective profile-fallback demotion policy (feature 63). */
  profileFallback: ProfileFallbackConfig;
  /** Feature 66: the memory-substrate consent surface. */
  memory: MemoryConfig;
  /** Issue #383: the measured acceptance is opt-in, like every other runtime cost. */
  telemetry: TelemetryConfig;
  /** #394: automatic session logging, resolved. */
  logSession: LogSessionConfig;
  /** Guard switches, resolved. */
  guards: GuardsConfig;
  /** Issue #201: the declared pass routes, merged project-over-global; empty
   *  when no scope declares one — the resolver owns the fail-closed chain. */
  passes: Record<string, PassRouteFile>;
  /** Issue #260: the declared subagent resource limits, merged key-wise
   *  project-over-global; empty when no scope declares one — the resource
   *  layer owns the self-detected envelope and the derived parallelism. */
  subagents: SubagentsConfigFile;
  /** Issue #174: the State Flow episode lifecycle, resolved. */
  stateFlow: StateFlowConfig;
  /** Feature 63: declaredness of the implicit `default` profile. */
  declared: { default: RouteDeclaration; commands: Record<string, RouteDeclaration> };
}

export interface ConfigProblem {
  scope: "global" | "project";
  path: string;
  message: string;
}

/** Absolute paths of the dedicated JSON files (never Pi `settings.json`). */
export interface ConfigPaths {
  /** The pi extension file: package-specific config. */
  global: string;
  project: string;
  /** The base feature file every agentic-workflow install shares. */
  globalBase: string;
  projectBase: string;
}

// ---------------------------------------------------------------------------
// Advance (conductor) configuration
// ---------------------------------------------------------------------------

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
