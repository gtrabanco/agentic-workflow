/**
 * resolve-passes — the deterministic pass→model resolution (issue #201 S2).
 *
 * The ONE owner of the fail-closed resolution chain. It reads the routing
 * config — including the `passes` key — and emits the resolved
 * pass→model/thinking table as JSON with the fail-closed rules applied in
 * code, never re-derived by the model before each spawn. The calling skill
 * only launches each pass with the reference it received.
 *
 * Resolution order for one pass (owner decision 2026-10-12):
 *   1. `passes.<name>` — the operator's explicit entry (`inherit` / `auto` /
 *      pinned reference / chain);
 *   2. `passes.default` — the escape that routes every unlisted pass;
 *   3. `commands.execute-phase` — the configured cheap tier;
 *   4. the inline floor — the pass runs inline at the orchestrator's model,
 *      recorded with a reason: never a spontaneous model choice.
 *
 * Fail-closed on malformed *selected* routes (owner note 2026-09-13, detail
 * 2) — deliberately stricter than interactive routing: an invalid JSON file,
 * an unknown pass name, or an invalid reference in a selected route is a
 * `PassesError`, never a silent fallback.
 *
 * Nothing here imports pi, a harness, or the network: the module is pure over
 * the two file texts, which is what makes it testable with zero pi
 * involvement and reusable by any agent.
 */

import { PASS_NAMES, PASS_DEFAULT_NAME } from "./names.mjs";

/** The receipt's fixed contract id (same `<name>@<n>` shape as the other
 *  crate receipts). */
export const PASS_TABLE_CONTRACT_ID = "resolve-passes@1";

/** The routed command a review pass inherits from when its model is `inherit`. */
export const DEFAULT_REVIEW_COMMAND = "review-change";

/** The command route that carries the configured cheap tier (owner decision
 *  2026-10-12: "reuse the `execute-phase` command route"). */
export const CHEAP_TIER_COMMAND = "execute-phase";

const THINKING_LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
const MAX_MODEL_CHAIN = 4;

/** A resolution failure carries the JSON path the operator can fix. */
export class PassesError extends Error {
  constructor(message) {
    super(message);
    this.name = "PassesError";
  }
}

const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

const describe = (v) => (typeof v === "string" ? `"${v}"` : JSON.stringify(v) ?? String(v));

/** An exact `provider/modelId` — the split pi performs at the first slash. */
const isModelReference = (v) =>
  typeof v === "string" && v === v.trim() && !/\s/u.test(v) &&
  v.includes("/") && v.indexOf("/") > 0 && v.indexOf("/") < v.length - 1;

/** Validate one model value at `path`: `inherit`, `auto`, a reference, or a
 *  capped chain of references. Returns the value or throws (fail closed). */
function checkModel(value, path, { allowAuto = false, allowInherit = false } = {}) {
  if (allowAuto && value === "auto") return value;
  if (allowInherit && value === "inherit") return value;
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new PassesError(`${path}: must be a non-empty chain of "provider/modelId" references, got an empty array`);
    }
    if (value.length > MAX_MODEL_CHAIN) {
      throw new PassesError(`${path}: chain holds ${value.length} entries; ${MAX_MODEL_CHAIN} is the maximum`);
    }
    for (let i = 0; i < value.length; i += 1) {
      if (!isModelReference(value[i])) {
        throw new PassesError(`${path}: chain entry ${i + 1} (${describe(value[i])}) must be "provider/modelId"`);
      }
    }
    return value;
  }
  if (!isModelReference(value)) {
    const allowed = [allowInherit ? '"inherit"' : null, allowAuto ? '"auto"' : null, '"provider/modelId", or a chain of references']
      .filter(Boolean)
      .join(", ");
    throw new PassesError(`${path}: must be ${allowed}, got ${describe(value)}`);
  }
  return value;
}

function checkThinking(value, path) {
  if (value === "inherit" || THINKING_LEVELS.includes(value)) return value;
  throw new PassesError(`${path}: must be "inherit" or one of ${THINKING_LEVELS.join(", ")}, got ${describe(value)}`);
}

/** Parse one file text. Absent (null/undefined) is fine — nothing declared;
 *  present-but-unparseable is a refusal, never "unconfigured" (F7's rule). */
function parseConfigText(text, scope) {
  if (text === null || text === undefined) return {};
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new PassesError(`${scope} config is not valid JSON: ${reason}`);
  }
  if (!isRecord(parsed)) {
    throw new PassesError(`${scope} config root must be a JSON object`);
  }
  return parsed;
}

const displayKey = (key) => (/^[a-z0-9][a-z0-9._-]*$/u.test(key) ? key : JSON.stringify(key));

/** Strict validation of the `passes` map the resolver consumes. Unknown pass
 *  names are rejected per the strict-validator rule — a typo'd pass would
 *  otherwise resolve nothing and hide the misspelling. Only this map and the
 *  selected command routes are validated: the pi package owns full-file
 *  validation, and the resolver reads a config an agent of any harness wrote. */
function checkPassesMap(passes) {
  if (passes === undefined) return {};
  if (!isRecord(passes)) {
    throw new PassesError("$.passes: must be an object mapping pass names to pass entries");
  }
  const out = {};
  for (const [name, raw] of Object.entries(passes)) {
    const path = `$.passes.${displayKey(name)}`;
    const display = displayKey(name);
    if (name !== PASS_DEFAULT_NAME && !PASS_NAMES.includes(name)) {
      throw new PassesError(
        `${path}: unknown pass name "${display}" (allowed: ${PASS_DEFAULT_NAME}, ${PASS_NAMES.join(", ")})`,
      );
    }
    if (!isRecord(raw)) {
      throw new PassesError(`${path}: pass entry must be an object with optional model/thinking keys`);
    }
    const entry = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key !== "model" && key !== "thinking") {
        throw new PassesError(`${path}.${key}: unknown pass key "${key}" (allowed: model, thinking)`);
      }
      entry[key] =
        key === "model"
          ? checkModel(value, `${path}.model`, { allowAuto: true, allowInherit: true })
          : checkThinking(value, `${path}.thinking`);
    }
    out[name] = entry;
  }
  return out;
}

/** The selected command route's model, validated lazily (fail closed on a
 *  malformed *selected* route) — `inherit` here means "no concrete model". */
function selectedCommandModel(commands, commandName) {
  const route = commands?.[commandName];
  if (route === undefined) return undefined;
  if (!isRecord(route)) {
    throw new PassesError(`$.commands.${displayKey(commandName)}: must be an object with optional model/thinking keys`);
  }
  if (route.model === undefined || route.model === "inherit") return undefined;
  return checkModel(route.model, `$.commands.${displayKey(commandName)}.model`);
}

/** One resolution step's outcome for a declared model value. An `inherit`
 *  entry resolves against the routed command's model; the `default` escape's
 *  own `inherit` resolves against the cheap-tier route — that escape exists
 *  to route unlisted passes there (owner decision 2026-10-12). */
function resolveDeclaredModel(model, commands, inheritTarget) {
  if (model === "auto") {
    return { model: "auto", spawn: "auto", source: null, reason: null };
  }
  if (model === "inherit") {
    const routed = selectedCommandModel(commands, inheritTarget);
    if (routed === undefined) {
      return {
        model: null,
        spawn: "inline",
        source: "floor",
        reason: `no routed model for commands.${inheritTarget} — runs inline at the orchestrator's model`,
      };
    }
    return { model: routed, spawn: "pinned", source: `commands.${inheritTarget}`, reason: null };
  }
  return { model, spawn: "pinned", source: null, reason: null };
}

const FLOOR_REASON =
  "no pass entry, no passes.default, and no commands.execute-phase route — runs inline at the orchestrator's model";

/**
 * Resolve the pass table. Inputs are the two file texts (global then
 * project; the project file wins per entry and per key) and the routed
 * command whose model an `inherit` entry resolves against.
 *
 * @param {{ globalText?: string | null, projectText?: string | null, command?: string }} input
 * @returns {{ schema: string, command: string, passes: Record<string, {
 *   model: string | string[] | null, thinking: string,
 *   source: string | null, spawn: "pinned" | "auto" | "inline",
 *   reason: string | null,
 * }}>} the `resolve-passes@1` receipt
 * @throws {PassesError} on any malformed selected route (fail closed)
 */
export function resolvePasses({ globalText = null, projectText = null, command = DEFAULT_REVIEW_COMMAND } = {}) {
  if (typeof command !== "string" || !/^[a-z0-9][a-z0-9._-]*$/u.test(command)) {
    throw new PassesError(`--command must be a single lowercase slug, got ${describe(command)}`);
  }

  const globalConfig = parseConfigText(globalText, "global");
  const projectConfig = parseConfigText(projectText, "project");
  const globalPasses = checkPassesMap(globalConfig.passes);
  const projectPasses = checkPassesMap(projectConfig.passes);

  // Merge per entry and per key: the project file wins, everything it does
  // not mention keeps the global value — the same transaction rule the pi
  // package's merge applies to every route scope.
  const names = new Set([...Object.keys(globalPasses), ...Object.keys(projectPasses)]);
  const merged = {};
  for (const name of names) {
    merged[name] = {
      ...(globalPasses[name] ?? {}),
      ...(projectPasses[name] ?? {}),
    };
  }

  const commands = { ...(globalConfig.commands ?? {}), ...(projectConfig.commands ?? {}) };
  const passes = {};
  for (const name of PASS_NAMES) {
    const entry = merged[name] ?? merged[PASS_DEFAULT_NAME];
    let resolved;
    let source;
    if (entry !== undefined && entry.model !== undefined) {
      const isNamedEntry = merged[name] !== undefined && merged[name].model !== undefined;
      // A named pass's `inherit` follows the routed command; the default
      // escape's `inherit` follows the cheap-tier route.
      resolved = resolveDeclaredModel(entry.model, commands, isNamedEntry ? command : CHEAP_TIER_COMMAND);
      source = isNamedEntry ? `passes.${name}` : "passes.default";
      if (resolved.source !== null) source = resolved.source;
    } else {
      const cheap = selectedCommandModel(commands, CHEAP_TIER_COMMAND);
      if (cheap !== undefined) {
        resolved = { model: cheap, spawn: "pinned", reason: null };
        source = `commands.${CHEAP_TIER_COMMAND}`;
      } else {
        resolved = { model: null, spawn: "inline", reason: FLOOR_REASON };
        source = "floor";
      }
    }
    passes[name] = {
      model: resolved.model,
      thinking: entry?.thinking !== undefined ? checkThinking(entry.thinking, `$.passes.${displayKey(name)}.thinking`) : "inherit",
      source,
      spawn: resolved.spawn,
      reason: resolved.reason,
    };
  }

  return { schema: PASS_TABLE_CONTRACT_ID, command, passes };
}
