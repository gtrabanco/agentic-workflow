/**
 * The in-package default (SPEC S6, D-P6): a fresh install with no config file
 * anywhere routes every command on the session model, and the fail-closed
 * fallback policy starts at `stop`.
 */
export const DEFAULT_ROUTE = { model: "inherit", thinking: "inherit" };
export const DEFAULT_CONFIG = {
    default: { ...DEFAULT_ROUTE },
    commands: {},
    onUnavailableRoute: "stop",
};
