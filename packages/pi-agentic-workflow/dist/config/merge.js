import { DEFAULT_CONFIG, DEFAULT_ROUTE } from "./defaults.js";
/**
 * Project-over-global merge (SPEC S5, S6).
 *
 * Merge granularity is the individual route key, not the route object: a
 * project that sets only `commands.x.model` keeps the global `thinking` for
 * that command. A command neither scope mentions falls back to the resolved
 * default route, and an absent default is the shipped `inherit`.
 *
 * Inputs are validated files — an invalid file never reaches this function
 * (D-E5) — and both are treated as read-only: the result is built from fresh
 * objects so no caller can alias through it.
 */
function pick(fallback, ...values) {
    for (const value of values)
        if (value !== undefined)
            return value;
    return fallback;
}
function resolveRoute(defaults, globalRoute, projectRoute) {
    return {
        model: pick(DEFAULT_ROUTE.model, projectRoute?.model, globalRoute?.model, defaults.model),
        thinking: pick(DEFAULT_ROUTE.thinking, projectRoute?.thinking, globalRoute?.thinking, defaults.thinking),
    };
}
export function mergeConfigs(globalFile = {}, projectFile = {}) {
    const effectiveDefault = resolveRoute(DEFAULT_ROUTE, globalFile.default, projectFile.default);
    const globalCommands = globalFile.commands ?? {};
    const projectCommands = projectFile.commands ?? {};
    const commands = {};
    for (const name of new Set([...Object.keys(globalCommands), ...Object.keys(projectCommands)])) {
        commands[name] = resolveRoute(effectiveDefault, globalCommands[name], projectCommands[name]);
    }
    return {
        default: effectiveDefault,
        commands,
        onUnavailableRoute: projectFile.onUnavailableRoute ?? globalFile.onUnavailableRoute ?? DEFAULT_CONFIG.onUnavailableRoute,
    };
}
/** The route a command runs under: its own resolved override, else the default route. */
export function effectiveRoute(config, command) {
    return config.commands[command] ?? config.default;
}
