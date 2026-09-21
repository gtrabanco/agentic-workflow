/**
 * Runtime resolver — determines what runtime pi itself runs under so
 * spawned children inherit the same choice.
 *
 * The current process is always pi (this module lives inside the package
 * that ships with pi). Whichever runtime launched pi decides what
 * children get:
 *  - pi installed via `bun add -g` → bun
 *  - pi installed via `npm install -g` → node
 *
 * `AGENTIC_WORKFLOW_RUNTIME` env override is the highest priority: it
 * always wins, letting the operator force a specific runtime regardless
 * of how pi was installed.
 *
 * Exported from the package's public entry (compiled from src/ → dist/).
 * Intended call site: wherever the extension spawns a `.mjs` script,
 * use `runtimeBin()` + `runtimeEnv()` instead of a hardcoded `"node"`
 * or `"bun"`.
 */

/**
 * Detect the runtime of the *current process* (which is pi).
 * Returns `"bun"` when `globalThis.Bun` exists, or when
 * `process.execPath` contains the substring `"bun"`; otherwise `"node"`.
 */
export function detectRuntime(): "bun" | "node" {
  if ((globalThis as Record<string, unknown>).Bun !== undefined) {
    return "bun";
  }
  const execPath = process.execPath ?? "";
  if (execPath.includes("bun")) {
    return "bun";
  }
  return "node";
}

/**
 * Return an environment object for spawned children that ensures
 * `AGENTIC_WORKFLOW_RUNTIME` is set.
 *
 * Priority:
 * 1. If the caller passes an explicit value, use it (user override).
 * 2. If `AGENTIC_WORKFLOW_RUNTIME` is already in `process.env`, use it.
 * 3. Fall back to the detected runtime.
 *
 * Returns `{ AGENTIC_WORKFLOW_RUNTIME: "bun" | "node" }`.
 */
export function runtimeEnv(
  overrides?: { AGENTIC_WORKFLOW_RUNTIME?: "bun" | "node" },
): Record<string, string> {
  const value =
    overrides?.AGENTIC_WORKFLOW_RUNTIME ??
    process.env.AGENTIC_WORKFLOW_RUNTIME ??
    detectRuntime();
  return { AGENTIC_WORKFLOW_RUNTIME: value };
}

/**
 * Return the executable name to spawn for running a script.
 * Returns `"bun"` or `"node"` based on the detected runtime,
 * respecting the `AGENTIC_WORKFLOW_RUNTIME` env override.
 */
export function runtimeBin(): "bun" | "node" {
  const env = process.env.AGENTIC_WORKFLOW_RUNTIME;
  if (env === "bun" || env === "node") return env;
  return detectRuntime();
}