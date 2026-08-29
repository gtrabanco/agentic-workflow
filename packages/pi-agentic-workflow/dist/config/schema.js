import { THINKING_LEVELS, UNAVAILABLE_ROUTE_POLICIES } from "./types.js";
/**
 * Strict validator for one config file (SPEC S5-S8, D-E5).
 *
 * Strict means: only the documented keys, only the documented value shapes, and
 * no coercion. A file that is *present but invalid* must produce issues,
 * because silently falling back to `inherit` would let an operator believe a
 * strong model ran when it did not. Only a *missing* file resolves to the
 * default, and that decision belongs to the loader.
 */
const ROOT_KEYS = new Set(["default", "commands", "onUnavailableRoute"]);
const ROUTE_KEYS = new Set(["model", "thinking"]);
const COMMAND_NAME = /^[a-z0-9][a-z0-9._-]*$/u;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
/** Bracket-quoted when a key is not a plain slug, so the path stays parseable. */
function displayKey(key) {
    return COMMAND_NAME.test(key) ? key : JSON.stringify(key);
}
/** An exact `provider/modelId`. The id may contain slashes: Pi splits at the first one. */
function isModelReference(value) {
    return parseModelReference(value) !== undefined;
}
/** Same rule as `isModelReference`, plus the split Pi performs when resolving. */
export function parseModelReference(value) {
    if (typeof value !== "string" || value !== value.trim() || /\s/u.test(value))
        return undefined;
    const slash = value.indexOf("/");
    if (slash <= 0 || slash >= value.length - 1)
        return undefined;
    return { provider: value.slice(0, slash), id: value.slice(slash + 1) };
}
function isThinkingSetting(value) {
    return value === "inherit" || THINKING_LEVELS.includes(value);
}
function isUnavailableRoutePolicy(value) {
    return UNAVAILABLE_ROUTE_POLICIES.includes(value);
}
function describe(value) {
    return typeof value === "string" ? `"${value}"` : JSON.stringify(value) ?? String(value);
}
function checkRoute(value, path, issues) {
    if (!isRecord(value)) {
        issues.push({ path, message: "must be an object with optional model/thinking keys" });
        return undefined;
    }
    const route = {};
    for (const [key, entry] of Object.entries(value)) {
        if (!ROUTE_KEYS.has(key)) {
            issues.push({ path: `${path}.${displayKey(key)}`, message: `unknown route key "${key}" (allowed: model, thinking)` });
            continue;
        }
        if (key === "model") {
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
/** Validate an already-parsed JSON value. */
function validateConfig(value) {
    if (!isRecord(value)) {
        return { ok: false, issues: [{ path: "$", message: "config root must be a JSON object" }] };
    }
    const issues = [];
    const config = {};
    for (const key of Object.keys(value)) {
        if (!ROOT_KEYS.has(key)) {
            issues.push({
                path: `$.${displayKey(key)}`,
                message: `unknown config key "${key}" (allowed: default, commands, onUnavailableRoute)`,
            });
        }
    }
    if (value.default !== undefined) {
        const route = checkRoute(value.default, "$.default", issues);
        if (route)
            config.default = route;
    }
    if (value.commands !== undefined) {
        if (!isRecord(value.commands)) {
            issues.push({ path: "$.commands", message: "must be an object mapping command names to routes" });
        }
        else {
            const commands = {};
            for (const [name, raw] of Object.entries(value.commands)) {
                if (!COMMAND_NAME.test(name)) {
                    issues.push({ path: `$.commands.${displayKey(name)}`, message: "command name must be a single lowercase slug" });
                    continue;
                }
                const route = checkRoute(raw, `$.commands.${displayKey(name)}`, issues);
                if (route)
                    commands[name] = route;
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
        }
        else {
            config.onUnavailableRoute = value.onUnavailableRoute;
        }
    }
    return issues.length > 0 ? { ok: false, issues } : { ok: true, config };
}
/**
 * Parse and validate one config file's text. A blank file is an empty config so
 * the loader can treat "nothing declared" like "nothing present" without a
 * second read.
 */
export function parseConfigFile(text) {
    if (text.trim() === "")
        return { ok: true, config: {} };
    let parsed;
    try {
        parsed = JSON.parse(text);
    }
    catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        return { ok: false, issues: [{ path: "$", message: `invalid JSON: ${reason}` }] };
    }
    return validateConfig(parsed);
}
