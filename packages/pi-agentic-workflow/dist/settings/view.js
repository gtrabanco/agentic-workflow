// src/settings/view.ts
// The settings console's display half (AC10, SPEC S4): what is in effect right
// now, and which files the values came from.
/** The label for the unqualified route, so `default` is never mistaken for a command name. */
export const DEFAULT_ROUTE = "the default route";
/**
 * The field path the schema would report for a route target, e.g.
 * `$.commands.plan-feature.model` — the same shape a config problem uses (AC5),
 * so a rejection and a file error read identically to the operator.
 */
export function routePath(target) {
    return target === DEFAULT_ROUTE ? "$.default" : `$.commands.${target}`;
}
/** What the operator reads when the console opens. */
export function renderMergedConfig(loaded, commands) {
    return [
        "agentic-workflow routing — what each command runs on right now",
        ...configLines(loaded.config, commands),
        ...problems(loaded.problems),
    ];
}
function configLines(config, commands) {
    const overrides = Object.entries(config.commands).sort(([a], [b]) => a.localeCompare(b));
    const total = Math.max(commands.length, overrides.length);
    return [
        `  default: ${route(config.default)}`,
        ...(overrides.length === 0
            ? ["  no per-command overrides — every command uses the default route"]
            : [
                ...overrides.map(([name, value]) => `  ${name}: ${route(value)}`),
                `  ${overrides.length} of ${commands.length} commands override the default route`,
            ]),
        `  when a configured model is unavailable: ${config.onUnavailableRoute}`,
    ];
}
function route(value) {
    return `${value.model} / ${value.thinking}`;
}
function problems(list) {
    if (list.length === 0)
        return [];
    return [
        "  files with problems — the values above fall back to the shipped defaults:",
        ...list.map((issue) => `    ${issue.scope} config, ${issue.path}: ${issue.message}`),
    ];
}
