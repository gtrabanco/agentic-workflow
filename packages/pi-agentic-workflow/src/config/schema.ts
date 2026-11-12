import {
  MAX_MODEL_CHAIN,
  SETTLE_POLICIES,
  THINKING_LEVELS,
  UNAVAILABLE_ROUTE_POLICIES,
  PROFILE_FALLBACK_APPLY_TO,
  PROFILE_FALLBACK_RESUME,
  STATE_FLOW_BACKENDS,
  STATE_FLOW_MISSING_POLICIES,
  STATE_FLOW_STOP_POLICIES,
} from "./types.js";
import { PASS_NAMES, parseJsonc } from "@gtrabanco/agentic-workflow-schema";
import type {
  ConfigFile,
  ConfigIssue,
  ModelRef,
  RouteFile,
  SettlePolicy,
  ThinkingSetting,
  UnavailableRoutePolicy,
  ProfileFile,
  StateFlowConfigFile,
  PassModelSetting,
  PassRouteFile,
  PassesConfigFile,
  SubagentsConfigFile,
} from "./types.js";

/**
 * Strict validator for one config file (SPEC S5-S8, D-E5).
 *
 * Strict means: only the documented keys, only the documented value shapes, and
 * no coercion. A file that is *present but invalid* must produce issues,
 * because silently falling back to `inherit` would let an operator believe a
 * strong model ran when it did not. Only a *missing* file resolves to the
 * default, and that decision belongs to the loader.
 */

const ROOT_KEYS = new Set([
  "default",
  "commands",
  "onUnavailableRoute",
  "onSettle",
  "recommendedModels",
  "profiles",
  "profileOrder",
  "profileFallback",
  "tierRouting",
  "presetProfile",
  "passes",
  "subagents",
  "stateFlow",
]);
const ROUTE_KEYS = new Set(["model", "thinking"]);
const COMMAND_NAME = /^[a-z0-9][a-z0-9._-]*$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Bracket-quoted when a key is not a plain slug, so the path stays parseable. */
function displayKey(key: string): string {
  return COMMAND_NAME.test(key) ? key : JSON.stringify(key);
}

/** An exact `provider/modelId`. The id may contain slashes: Pi splits at the first one. */
function isModelReference(value: unknown): value is ModelRef {
  return parseModelReference(value) !== undefined;
}

/** The split Pi performs when resolving a reference: provider before the first slash. */
export interface ModelParts {
  provider: string;
  id: string;
}

/** Same rule as `isModelReference`, plus the split Pi performs when resolving. */
export function parseModelReference(value: unknown): ModelParts | undefined {
  if (typeof value !== "string" || value !== value.trim() || /\s/u.test(value)) return undefined;
  const slash = value.indexOf("/");
  if (slash <= 0 || slash >= value.length - 1) return undefined;
  return { provider: value.slice(0, slash), id: value.slice(slash + 1) };
}

function isThinkingSetting(value: unknown): value is ThinkingSetting {
  return value === "inherit" || (THINKING_LEVELS as readonly string[]).includes(value as string);
}

function isUnavailableRoutePolicy(value: unknown): value is UnavailableRoutePolicy {
  return UNAVAILABLE_ROUTE_POLICIES.includes(value as UnavailableRoutePolicy);
}

function isSettlePolicy(value: unknown): value is SettlePolicy {
  return SETTLE_POLICIES.includes(value as SettlePolicy);
}

/** Strict validator for `recommendedModels` (feature 63, AC1). */
function isRecommendedModels(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/** Strict validator for the `tierRouting` opt-out (issue #388 amendment 1):
 *  a boolean shorthand or `{ enabled?, skills? }` with boolean values. */
function checkTierRouting(value: unknown, issues: ConfigIssue[]): NonNullable<ConfigFile["tierRouting"]> | undefined {
  if (typeof value === "boolean") return value;
  if (!isRecord(value)) {
    issues.push({ path: "$.tierRouting", message: `must be a boolean or an object with enabled/skills, got ${describe(value)}` });
    return undefined;
  }
  const out: { enabled?: boolean; skills?: Record<string, boolean> } = {};
  for (const key of Object.keys(value)) {
    if (key !== "enabled" && key !== "skills") {
      issues.push({ path: `$.tierRouting.${displayKey(key)}`, message: `unknown tierRouting key "${key}" (allowed: enabled, skills)` });
    }
  }
  if (value.enabled !== undefined) {
    if (typeof value.enabled !== "boolean") {
      issues.push({ path: "$.tierRouting.enabled", message: `must be a boolean, got ${describe(value.enabled)}` });
    } else {
      out.enabled = value.enabled;
    }
  }
  if (value.skills !== undefined) {
    if (!isRecord(value.skills)) {
      issues.push({ path: "$.tierRouting.skills", message: `must be an object mapping command names to booleans, got ${describe(value.skills)}` });
    } else {
      const skills: Record<string, boolean> = {};
      for (const [name, flag] of Object.entries(value.skills)) {
        if (typeof flag !== "boolean") {
          issues.push({ path: `$.tierRouting.skills.${displayKey(name)}`, message: `must be a boolean, got ${describe(flag)}` });
          continue;
        }
        skills[name] = flag;
      }
      out.skills = skills;
    }
  }
  if (issues.some((issue) => issue.path.startsWith("$.tierRouting"))) return undefined;
  return out;
}

/** Strict validator for the `presetProfile` selection (issue #388 amendment
 *  2): one profile slug or an ordered array of profile slugs. The NAMES are
 *  companion-defined — this validates the shape only; the registry filters
 *  unknown names at chain build. */
function checkPresetProfile(value: unknown, issues: ConfigIssue[]): NonNullable<ConfigFile["presetProfile"]> | undefined {
  const slug = (v: unknown, path: string): string | undefined => {
    if (typeof v !== "string" || !COMMAND_NAME.test(v)) {
      issues.push({ path, message: `must be a lowercase slug, got ${describe(v)}` });
      return undefined;
    }
    return v;
  };
  if (typeof value === "string") {
    return slug(value, "$.presetProfile");
  }
  if (!Array.isArray(value)) {
    issues.push({ path: "$.presetProfile", message: `must be a profile name or an array of profile names, got ${describe(value)}` });
    return undefined;
  }
  if (value.length === 0) {
    issues.push({ path: "$.presetProfile", message: "must name at least one profile (an empty selection selects nothing)" });
    return undefined;
  }
  const names: string[] = [];
  let invalid = false;
  value.forEach((entry, index) => {
    const name = slug(entry, `$.presetProfile.${index}`);
    if (name === undefined) {
      invalid = true;
      return;
    }
    names.push(name);
  });
  return invalid ? undefined : names;
}

/** Strict validator for the `profileOrder` array (feature 63, AC6). */
const PROFILE_ORDER_ENTRY = /^[a-z0-9][a-z0-9._-]*$/u;

function checkProfileOrder(value: unknown, issues: ConfigIssue[]): string[] | undefined {
  if (!Array.isArray(value)) {
    issues.push({ path: "$.profileOrder", message: "must be an array of non-empty strings" });
    return undefined;
  }
  if (value.length === 0) {
    issues.push({ path: "$.profileOrder", message: "must be a non-empty array of non-empty strings" });
    return undefined;
  }
  for (let i = 0; i < value.length; i++) {
    const entry = value[i];
    if (typeof entry !== "string" || !PROFILE_ORDER_ENTRY.test(entry)) {
      issues.push({ path: "$.profileOrder", message: "must be a non-empty array of non-empty strings" });
      return undefined;
    }
  }
  return value;
}

/** Strict validator for the `profileFallback` object (feature 63). */
const PROFILE_FALLBACK_KEYS = new Set(["applyTo", "resume", "retryAfterSeconds"]);;

function checkProfileFallback(value: unknown, issues: ConfigIssue[]): NonNullable<ConfigFile["profileFallback"]> | undefined {
  if (!isRecord(value)) {
    issues.push({ path: "$.profileFallback", message: "must be an object with applyTo, resume, retryAfterSeconds" });
    return undefined;
  }
  const out: NonNullable<ConfigFile["profileFallback"]> = {};
  for (const key of Object.keys(value)) {
    if (!PROFILE_FALLBACK_KEYS.has(key)) {
      issues.push({ path: `$.profileFallback.${key}`, message: `unknown profileFallback key "${key}" (allowed: applyTo, resume, retryAfterSeconds)` });
      continue;
    }
    const v = value[key];
    if (key === "applyTo") {
      if (!PROFILE_FALLBACK_APPLY_TO.includes(v as typeof PROFILE_FALLBACK_APPLY_TO[number])) {
        issues.push({ path: "$.profileFallback.applyTo", message: `must be one of ${PROFILE_FALLBACK_APPLY_TO.join(", ")}` });
      } else {
        out.applyTo = v as typeof PROFILE_FALLBACK_APPLY_TO[number];
      }
    } else if (key === "resume") {
      if (!PROFILE_FALLBACK_RESUME.includes(v as typeof PROFILE_FALLBACK_RESUME[number])) {
        issues.push({ path: "$.profileFallback.resume", message: `must be one of ${PROFILE_FALLBACK_RESUME.join(", ")}` });
      } else {
        out.resume = v as typeof PROFILE_FALLBACK_RESUME[number];
      }
    } else if (key === "retryAfterSeconds") {
      if (typeof v !== "number" || !Number.isInteger(v) || v < 1) {
        issues.push({ path: "$.profileFallback.retryAfterSeconds", message: "must be a positive integer" });
      } else {
        out.retryAfterSeconds = v;
      }
    }
  }
  return out;
}

/** Strict validator for one profile file (feature 63, AC5). */
const PROFILE_FILE_KEYS = new Set(["default", "commands"]);;

function checkProfileFile(value: unknown, path: string, issues: ConfigIssue[]): ProfileFile | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: "profile must be an object with optional default/commands keys" });
    return undefined;
  }
  const out: ProfileFile = {};
  for (const key of Object.keys(value)) {
    if (!PROFILE_FILE_KEYS.has(key)) {
      issues.push({ path: `${path}.${key}`, message: `unknown profile key "${key}" (allowed: default, commands)` });
      continue;
    }
    if (key === "default") {
      const route = checkRoute(value[key], `${path}.default`, issues);
      if (route) out.default = route;
    } else if (key === "commands") {
      if (!isRecord(value[key])) {
        issues.push({ path: `${path}.commands`, message: "commands must be an object mapping command names to routes" });
      } else {
        const commands: Record<string, RouteFile> = {};
        for (const [cmdName, raw] of Object.entries(value[key])) {
          if (!COMMAND_NAME.test(cmdName)) {
            issues.push({ path: `${path}.commands.${displayKey(cmdName)}`, message: "command name must be a single lowercase slug" });
            continue;
          }
          const route = checkRoute(raw, `${path}.commands.${displayKey(cmdName)}`, issues);
          if (route) commands[cmdName] = route;
        }
        out.commands = commands;
      }
    }
  }
  return out;
}

/** Strict validator for the optional `advance` conductor config (feature 62). */

function describe(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : JSON.stringify(value) ?? String(value);
}

/** The one config-layer name that is not a spawned pass: the `default` escape
 *  that resolves the cheap tier for unlisted passes (issue #201, owner
 *  decision 2026-10-12). */
const PASS_DEFAULT_NAME = "default";
const PASS_ENTRY_KEYS = new Set(["model", "thinking"]);

/** Strict validator for a `passes` entry's `model`: the route settings plus
 *  `"auto"`. A chain follows the same rules as a command route's chain
 *  (non-empty, references only, capped at `MAX_MODEL_CHAIN`). */
function checkPassModel(value: unknown, path: string, issues: ConfigIssue[]): PassModelSetting | undefined {
  if (value === "auto") return value;
  if (Array.isArray(value)) {
    if (value.length === 0) {
      issues.push({
        path: `${path}.model`,
        message: `must be "inherit", "auto", "provider/modelId", or a non-empty chain of references, got an empty array`,
      });
      return undefined;
    }
    if (value.length > MAX_MODEL_CHAIN) {
      issues.push({
        path: `${path}.model`,
        message: `chain holds ${value.length} entries; ${MAX_MODEL_CHAIN} is the maximum`,
      });
      return undefined;
    }
    for (let index = 0; index < value.length; index += 1) {
      if (!isModelReference(value[index])) {
        issues.push({
          path: `${path}.model`,
          message: `chain entry ${index + 1} (${describe(value[index])}) must be "provider/modelId"`,
        });
        return undefined;
      }
    }
    return value as ModelRef[];
  }
  if (value !== "inherit" && !isModelReference(value)) {
    issues.push({
      path: `${path}.model`,
      message: `must be "inherit", "auto", "provider/modelId", or a non-empty chain of references, got ${describe(value)}`,
    });
    return undefined;
  }
  return value as PassModelSetting;
}

/** Strict validator for the `passes` map (issue #201): each key is a published
 *  pass name or the `default` escape; each entry carries the same optional
 *  model/thinking keys a route does, with `"auto"` added to the model
 *  settings. Unknown pass names are rejected per the strict-validator rule —
 *  a typo'd pass would otherwise resolve nothing and hide the misspelling. */
function checkPasses(value: unknown, issues: ConfigIssue[]): PassesConfigFile | undefined {
  if (!isRecord(value)) {
    issues.push({ path: "$.passes", message: "must be an object mapping pass names to pass entries" });
    return undefined;
  }
  const passes: PassesConfigFile = {};
  for (const [name, raw] of Object.entries(value)) {
    const path = `$.passes.${displayKey(name)}`;
    if (name !== PASS_DEFAULT_NAME && !(PASS_NAMES as readonly string[]).includes(name)) {
      issues.push({
        path,
        message: `unknown pass name "${displayKey(name)}" (allowed: ${PASS_DEFAULT_NAME}, ${PASS_NAMES.join(", ")})`,
      });
      continue;
    }
    if (!isRecord(raw)) {
      issues.push({ path, message: "pass entry must be an object with optional model/thinking keys" });
      continue;
    }
    const entry: PassRouteFile = {};
    for (const [key, entryValue] of Object.entries(raw)) {
      if (!PASS_ENTRY_KEYS.has(key)) {
        issues.push({ path: `${path}.${displayKey(key)}`, message: `unknown pass key "${key}" (allowed: model, thinking)` });
        continue;
      }
      if (key === "model") {
        const model = checkPassModel(entryValue, path, issues);
        if (model !== undefined) entry.model = model;
        continue;
      }
      if (!isThinkingSetting(entryValue)) {
        issues.push({
          path: `${path}.thinking`,
          message: `must be "inherit" or one of ${THINKING_LEVELS.join(", ")}, got ${describe(entryValue)}`,
        });
        continue;
      }
      entry.thinking = entryValue;
    }
    passes[name] = entry;
  }
  return passes;
}

/** Strict validator for the `subagents` block (issue #260, owner decision 6):
 *  the optional resource-limit configuration. `parallelism` is `serial`,
 *  `auto` or a positive integer; the caps are "<n> of <m> <unit>" strings
 *  with 0 < n <= m (memoryCap: GB|MB|KB; threadCap: threads|cores). Unknown
 *  inner keys are rejected — a silently dropped cap lets a spawn run outside
 *  the envelope the operator believed it bounded. */
const SUBAGENTS_KEYS = new Set(["parallelism", "memoryCap", "threadCap"]);
const SUBAGENTS_CAP = /^(\d+(?:\.\d+)?)\s+of\s+(\d+(?:\.\d+)?)\s+(GB|MB|KB|threads|cores)$/u;

function checkSubagents(value: unknown, issues: ConfigIssue[]): SubagentsConfigFile | undefined {
  if (!isRecord(value)) {
    issues.push({ path: "$.subagents", message: `must be a JSON object, got ${describe(value)}` });
    return undefined;
  }
  const subagents: SubagentsConfigFile = {};
  for (const [key, entry] of Object.entries(value)) {
    const path = `$.subagents.${displayKey(key)}`;
    if (!SUBAGENTS_KEYS.has(key)) {
      issues.push({ path, message: `unknown subagents key "${key}" (allowed: parallelism, memoryCap, threadCap)` });
      continue;
    }
    if (key === "parallelism") {
      const valid =
        entry === "serial" ||
        entry === "auto" ||
        (typeof entry === "number" && Number.isInteger(entry) && entry >= 1);
      if (!valid) {
        issues.push({
          path,
          message: `parallelism must be "serial", "auto" or a positive integer, got ${describe(entry)}`,
        });
        continue;
      }
      subagents.parallelism = entry as "serial" | "auto" | number;
      continue;
    }
    // memoryCap / threadCap — the decision-6 cap strings.
    if (typeof entry !== "string" || !SUBAGENTS_CAP.test(entry)) {
      issues.push({
        path,
        message: `${key} must match "<n> of <m> <unit>" (memoryCap: GB|MB|KB; threadCap: threads|cores), got ${describe(entry)}`,
      });
      continue;
    }
    const m = entry.match(SUBAGENTS_CAP)!;
    const unit = m[3];
    const memoryUnit = unit === "GB" || unit === "MB" || unit === "KB";
    if (key === "memoryCap" && !memoryUnit) {
      issues.push({ path, message: `memoryCap unit must be GB|MB|KB, got "${unit}"` });
      continue;
    }
    if (key === "threadCap" && memoryUnit) {
      issues.push({ path, message: `threadCap unit must be threads|cores, got "${unit}"` });
      continue;
    }
    if (Number(m[1]) > Number(m[2])) {
      issues.push({ path, message: `${key} "${entry}" must carry 0 < n <= m` });
      continue;
    }
    if (key === "memoryCap") subagents.memoryCap = entry;
    else subagents.threadCap = entry;
  }
  return subagents;
}

function checkRoute(value: unknown, path: string, issues: ConfigIssue[]): RouteFile | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object with optional model/thinking keys" });
    return undefined;
  }

  const route: RouteFile = {};
  for (const [key, entry] of Object.entries(value)) {
    if (!ROUTE_KEYS.has(key)) {
      issues.push({ path: `${path}.${displayKey(key)}`, message: `unknown route key "${key}" (allowed: model, thinking)` });
      continue;
    }
    if (key === "model") {
      if (Array.isArray(entry)) {
        // A chain must be non-empty, hold only references, and stay within the cap.
        if (entry.length === 0) {
          issues.push({
            path: `${path}.model`,
            message: `must be "inherit", "provider/modelId", or a non-empty chain of references, got an empty array`,
          });
          continue;
        }
        if (entry.length > MAX_MODEL_CHAIN) {
          issues.push({
            path: `${path}.model`,
            message: `chain holds ${entry.length} entries; ${MAX_MODEL_CHAIN} is the maximum`,
          });
          continue;
        }
        let chainValid = true;
        for (let index = 0; index < entry.length; index += 1) {
          if (!isModelReference(entry[index])) {
            issues.push({
              path: `${path}.model`,
              message: `chain entry ${index + 1} (${describe(entry[index])}) must be "provider/modelId"`,
            });
            chainValid = false;
            break;
          }
        }
        if (chainValid) route.model = entry;
        continue;
      }
      if (entry !== "inherit" && !isModelReference(entry)) {
        issues.push({
          path: `${path}.model`,
          message: `must be "inherit" or "provider/modelId", got ${describe(entry)}`,
        });
        continue;
      }
      route.model = entry;
      continue;
    }
    if (!isThinkingSetting(entry)) {
      issues.push({
        path: `${path}.thinking`,
        message: `must be "inherit" or one of ${THINKING_LEVELS.join(", ")}, got ${describe(entry)}`,
      });
      continue;
    }
    route.thinking = entry;
  }

  return route;
}

export type ParseResult = { ok: true; config: ConfigFile } | { ok: false; issues: ConfigIssue[] };

/** Validate an already-parsed JSON value. */
function validateConfig(value: unknown): ParseResult {
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: "$", message: "config root must be a JSON object" }] };
  }

  const issues: ConfigIssue[] = [];
  const config: ConfigFile = {};

  for (const key of Object.keys(value)) {
    if (!ROOT_KEYS.has(key)) {
      issues.push({
        path: `$.${displayKey(key)}`,
        message: `unknown config key "${key}" (allowed: ${[...ROOT_KEYS].join(", ")})`,
      });
    }
  }

  if (value.default !== undefined) {
    const route = checkRoute(value.default, "$.default", issues);
    if (route) config.default = route;
  }

  if (value.commands !== undefined) {
    if (!isRecord(value.commands)) {
      issues.push({ path: "$.commands", message: "must be an object mapping command names to routes" });
    } else {
      const commands: Record<string, RouteFile> = {};
      for (const [name, raw] of Object.entries(value.commands)) {
        if (!COMMAND_NAME.test(name)) {
          issues.push({ path: `$.commands.${displayKey(name)}`, message: "command name must be a single lowercase slug" });
          continue;
        }
        const route = checkRoute(raw, `$.commands.${displayKey(name)}`, issues);
        if (route) commands[name] = route;
      }
      config.commands = commands;
    }
  }

  if (value.onUnavailableRoute !== undefined) {
    if (!isUnavailableRoutePolicy(value.onUnavailableRoute)) {
      issues.push({
        path: "$.onUnavailableRoute",
        message: `must be "stop" or "inherit", got ${describe(value.onUnavailableRoute)}`,
      });
    } else {
      config.onUnavailableRoute = value.onUnavailableRoute;
    }
  }

  if (value.onSettle !== undefined) {
    if (!isSettlePolicy(value.onSettle)) {
      issues.push({
        path: "$.onSettle",
        message: `must be "keep" or "restore", got ${describe(value.onSettle)}`,
      });
    } else {
      config.onSettle = value.onSettle;
    }
  }

  if (value.recommendedModels !== undefined) {
    if (!isRecommendedModels(value.recommendedModels)) {
      issues.push({
        path: "$.recommendedModels",
        message: `must be a boolean, got ${describe(value.recommendedModels)}`,
      });
    } else {
      config.recommendedModels = value.recommendedModels;
    }
  }

  if (value.profiles !== undefined) {
    if (!isRecord(value.profiles)) {
      issues.push({ path: "$.profiles", message: "must be an object mapping profile names to profile definitions" });
    } else {
      const profiles: Record<string, ProfileFile> = {};
      for (const [profileName, profileDef] of Object.entries(value.profiles)) {
        if (!COMMAND_NAME.test(profileName)) {
          issues.push({ path: `$.profiles.${displayKey(profileName)}`, message: "profile name must be a single lowercase slug" });
          continue;
        }
        const profile = checkProfileFile(profileDef, `$.profiles.${displayKey(profileName)}`, issues);
        if (profile) profiles[profileName] = profile;
      }
      config.profiles = profiles;
    }
  }

  if (value.profileOrder !== undefined) {
    const order = checkProfileOrder(value.profileOrder, issues);
    if (order) config.profileOrder = order;
  }

  if (value.profileFallback !== undefined) {
    const fb = checkProfileFallback(value.profileFallback, issues);
    if (fb) config.profileFallback = fb;
  }

  if (value.tierRouting !== undefined) {
    const tierRouting = checkTierRouting(value.tierRouting, issues);
    if (tierRouting !== undefined) config.tierRouting = tierRouting;
  }

  if (value.presetProfile !== undefined) {
    const presetProfile = checkPresetProfile(value.presetProfile, issues);
    if (presetProfile !== undefined) config.presetProfile = presetProfile;
  }

  if (value.passes !== undefined) {
    const passes = checkPasses(value.passes, issues);
    if (passes) config.passes = passes;
  }

  if (value.subagents !== undefined) {
    const subagents = checkSubagents(value.subagents, issues);
    if (subagents) config.subagents = subagents;
  }

  if (value.stateFlow !== undefined) {
    const stateFlow = checkStateFlow(value.stateFlow, "$.stateFlow", issues);
    if (stateFlow) config.stateFlow = stateFlow;
  }

  return issues.length > 0 ? { ok: false, issues } : { ok: true, config };
}

/**
 * Parse and validate one config file's text. A blank file is an empty config so
 * the loader can treat "nothing declared" like "nothing present" without a
 * second read.
 */
/**
 * Strict validator for the `stateFlow` block (issue #174): the opt-in episode
 * lifecycle switch. An allowlist entry must be a non-empty command name — a
 * typo that reaches the vocabulary in the README (a leading slash, whitespace)
 * would silently match nothing and the operator would believe state-mode is
 * active when it never starts.
 */
function checkStateFlow(value: unknown, path: string, issues: ConfigIssue[]): StateFlowConfigFile | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: `must be a JSON object, got ${describe(value)}` });
    return undefined;
  }
  let unknown = false;
  for (const key of Object.keys(value)) {
    if (key !== "enabled" && key !== "backend" && key !== "commands" && key !== "stopOn" && key !== "onBackendMissing") {
      unknown = true;
      issues.push({
        path: `${path}.${displayKey(key)}`,
        message: `unknown stateFlow key "${key}" (allowed: enabled, backend, commands, stopOn, onBackendMissing)`,
      });
    }
  }
  const out: StateFlowConfigFile = {};
  if (value.enabled !== undefined) {
    if (typeof value.enabled !== "boolean") {
      issues.push({ path: `${path}.enabled`, message: `must be a boolean, got ${describe(value.enabled)}` });
      unknown = true;
    } else {
      out.enabled = value.enabled;
    }
  }
  if (value.backend !== undefined) {
    if (!(STATE_FLOW_BACKENDS as readonly string[]).includes(value.backend as string)) {
      issues.push({
        path: `${path}.backend`,
        message: `must be one of ${STATE_FLOW_BACKENDS.join(", ")}, got ${describe(value.backend)}`,
      });
      unknown = true;
    } else {
      out.backend = value.backend as StateFlowConfigFile["backend"];
    }
  }
  if (value.commands !== undefined) {
    if (
      !Array.isArray(value.commands)
      || value.commands.length === 0
      || value.commands.some((entry) => typeof entry !== "string" || entry.trim() === "")
    ) {
      issues.push({
        path: `${path}.commands`,
        message: "must be a non-empty array of non-empty command names",
      });
      unknown = true;
    } else {
      out.commands = value.commands as string[];
    }
  }
  if (value.stopOn !== undefined) {
    if (!(STATE_FLOW_STOP_POLICIES as readonly string[]).includes(value.stopOn as string)) {
      issues.push({
        path: `${path}.stopOn`,
        message: `must be one of ${STATE_FLOW_STOP_POLICIES.join(", ")}, got ${describe(value.stopOn)}`,
      });
      unknown = true;
    } else {
      out.stopOn = value.stopOn as StateFlowConfigFile["stopOn"];
    }
  }
  if (value.onBackendMissing !== undefined) {
    if (!(STATE_FLOW_MISSING_POLICIES as readonly string[]).includes(value.onBackendMissing as string)) {
      issues.push({
        path: `${path}.onBackendMissing`,
        message: `must be one of ${STATE_FLOW_MISSING_POLICIES.join(", ")}, got ${describe(value.onBackendMissing)}`,
      });
      unknown = true;
    } else {
      out.onBackendMissing = value.onBackendMissing as StateFlowConfigFile["onBackendMissing"];
    }
  }
  return unknown ? undefined : out;
}

/**
 * Parse and validate one config file (issue #521).
 *
 * The file is JSONC — comments and trailing commas are accepted — and it is
 * read by the schema package's `parseJsonc`, the same parser the base
 * `agentic-workflow.json` goes through. One parser is the contract: the two
 * config files cannot disagree about their own format, and a file cannot be
 * valid on one runtime and invalid on the other. The parser reports the line
 * and column of a syntax error, so the failure names where the operator's file
 * broke instead of a generic `Unexpected token`.
 */
export function parseConfigFile(text: string): ParseResult {
  if (text.trim() === "") return { ok: true, config: {} };

  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    return {
      ok: false,
      issues: [
        {
          path: "$",
          message: `invalid JSON: line ${parsed.error.line}:${parsed.error.column}: ${parsed.error.message}`,
        },
      ],
    };
  }

  return validateConfig(parsed.value);
}
