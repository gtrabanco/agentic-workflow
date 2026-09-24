import { MAX_MODEL_CHAIN, SETTLE_POLICIES, THINKING_LEVELS, UNAVAILABLE_ROUTE_POLICIES, PROFILE_FALLBACK_APPLY_TO, PROFILE_FALLBACK_RESUME, } from "./types.js";
import type { ConfigFile, ConfigIssue, ModelRef, RouteFile, SettlePolicy, ThinkingSetting, UnavailableRoutePolicy, ProfileFile, } from "./types.js";
import { OPERATIONS, PATH_GLOB_MAX_LENGTH, PHASE_STATES, REQUIREMENTS } from "./path-policy.js";
import type { PathOperation, PathPhaseState, PathProtectionOverride, PathRequirement } from "./path-policy.js";

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
  "pathProtection",
  "advance",
  "recommendedModels",
  "profiles",
  "profileOrder",
  "profileFallback",
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
const ADVANCE_KEYS = new Set(["iterationsCap", "sensitivePaths", "securityPaths", "runLogPath"]);

function checkAdvance(value: unknown, path: string, issues: ConfigIssue[]): ConfigFile["advance"] | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object" });
    return undefined;
  }
  const out: NonNullable<ConfigFile["advance"]> = {};
  for (const key of Object.keys(value)) {
    if (!ADVANCE_KEYS.has(key)) {
      issues.push({ path: `${path}.${displayKey(key)}`, message: `unknown advance key "${key}" (allowed: iterationsCap, sensitivePaths, securityPaths, runLogPath)` });
      continue;
    }
    const v = value[key];
    if (key === "iterationsCap") {
      if (typeof v !== "number" || !Number.isInteger(v) || v < 1) {
        issues.push({ path: `${path}.iterationsCap`, message: "must be a positive integer" });
        continue;
      }
      out.iterationsCap = v;
    } else if (key === "runLogPath") {
      if (typeof v !== "string" || v.length === 0) {
        issues.push({ path: `${path}.runLogPath`, message: "must be a non-empty string" });
        continue;
      }
      out.runLogPath = v;
    } else {
      if (!Array.isArray(v) || v.some((e) => typeof e !== "string")) {
        issues.push({ path: `${path}.${key}`, message: "must be an array of strings" });
        continue;
      }
      (out as Record<string, unknown>)[key] = v;
    }
  }
  return out;
}

/** Strict validator for the optional `pathProtection` override (feature 60, AC10). */
function checkPathProtection(value: unknown, path: string, issues: ConfigIssue[]): PathProtectionOverride | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: "must be an object with optional protectedGlobs/requirements keys" });
    return undefined;
  }
  const override: PathProtectionOverride = {};
  for (const key of Object.keys(value)) {
    if (key !== "protectedGlobs" && key !== "requirements") {
      issues.push({ path: `${path}.${displayKey(key)}`, message: `unknown pathProtection key "${key}" (allowed: protectedGlobs, requirements)` });
    }
  }
  if (value.protectedGlobs !== undefined) {
    if (!Array.isArray(value.protectedGlobs) || value.protectedGlobs.some((glob) => typeof glob !== "string" || glob.trim() === "")) {
      issues.push({ path: `${path}.protectedGlobs`, message: "must be an array of non-empty glob strings" });
    } else if (value.protectedGlobs.some((glob) => (glob as string).length > PATH_GLOB_MAX_LENGTH)) {
      issues.push({ path: `${path}.protectedGlobs`, message: `a glob must be at most ${PATH_GLOB_MAX_LENGTH} characters` });
    } else {
      override.protectedGlobs = value.protectedGlobs as string[];
    }
  }
  if (value.requirements !== undefined) {
    if (!isRecord(value.requirements)) {
      issues.push({ path: `${path}.requirements`, message: "must be an object keyed by phase state" });
    } else {
      const requirements: PathProtectionOverride["requirements"] = {};
      for (const [state, raw] of Object.entries(value.requirements)) {
        if (!(PHASE_STATES as readonly string[]).includes(state)) {
          issues.push({ path: `${path}.requirements.${displayKey(state)}`, message: `unknown phase state "${state}"` });
          continue;
        }
        if (!isRecord(raw)) {
          issues.push({ path: `${path}.requirements.${displayKey(state)}`, message: "must be an object keyed by operation" });
          continue;
        }
        const row: Partial<Record<PathOperation, PathRequirement>> = {};
        for (const [operation, requirement] of Object.entries(raw)) {
          if (!(OPERATIONS as readonly string[]).includes(operation)) {
            issues.push({ path: `${path}.requirements.${displayKey(state)}.${displayKey(operation)}`, message: `unknown operation "${operation}"` });
            continue;
          }
          if (!(REQUIREMENTS as readonly string[]).includes(requirement as string)) {
            issues.push({ path: `${path}.requirements.${displayKey(state)}.${displayKey(operation)}`, message: `must be one of ${REQUIREMENTS.join(", ")}` });
            continue;
          }
          row[operation as PathOperation] = requirement as PathRequirement;
        }
        requirements[state as PathPhaseState] = row;
      }
      override.requirements = requirements;
    }
  }
  return override;
}

function describe(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : JSON.stringify(value) ?? String(value);
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
        message: `unknown config key "${key}" (allowed: default, commands, onUnavailableRoute, onSettle, pathProtection, advance, recommendedModels, profiles, profileOrder, profileFallback)`,
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

  if (value.advance !== undefined) {
    const advance = checkAdvance(value.advance, "$.advance", issues);
    if (advance) config.advance = advance;
  }
  if (value.pathProtection !== undefined) {
    const override = checkPathProtection(value.pathProtection, "$.pathProtection", issues);
    if (override) config.pathProtection = override;
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

  return issues.length > 0 ? { ok: false, issues } : { ok: true, config };
}

/**
 * Parse and validate one config file's text. A blank file is an empty config so
 * the loader can treat "nothing declared" like "nothing present" without a
 * second read.
 */
export function parseConfigFile(text: string): ParseResult {
  if (text.trim() === "") return { ok: true, config: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, issues: [{ path: "$", message: `invalid JSON: ${reason}` }] };
  }

  return validateConfig(parsed);
}
