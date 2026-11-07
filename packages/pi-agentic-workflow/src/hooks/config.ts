import { join } from "node:path";

import {
  PROJECTION_SEAMS,
  type GuardRejectionReason,
  type ProjectionSeam,
} from "@gtrabanco/agentic-workflow-schema";

/**
 * Seam-hooks configuration — discovery, validation and the seam mapping
 * (issue #413, obligations O1/O2/O3/O4/O5/O10).
 *
 * The config form is the Claude Code `hooks.json` shape (PE-005): a top-level
 * `hooks` map keyed by event name, each value a list of matcher groups, each
 * group a list of `{ type: "command", command, timeout }` handlers. Two
 * extensions keep it workflow-native: the group carries the opt-in `enabled`
 * flag (O4 — declaring a hook is not consent), and `phase:end`/`unit:end`
 * groups may carry the explicit `autoCommit`/`autoPush` flags (O11 — never
 * bundled defaults). Event keys are the nine `PROJECTION_SEAMS` names plus the
 * two Claude Code aliases that map 1:1 (`SessionStart` → `session:start`,
 * `SessionEnd` → `session:end`); every other Claude Code event name is refused
 * `config-invalid` — this dispatcher has no seam for it.
 *
 * The rules this module owns, mirroring `../config/load.ts`:
 *  - a MISSING file resolves to a clean no-op (the degradation notice is the
 *    wiring's one-time job, not a problem);
 *  - a PRESENT-but-invalid file is a problem — the dispatcher degrades to a
 *    declared no-op with a notice, never a silent pass (O5);
 *  - the project file is not even read while the project is untrusted, because
 *    a cloned repository must not be able to steer execution (O2);
 *  - reading is injected so tests drive every branch from memory.
 */

export const HOOKS_FILE_NAME = "hooks.json";
export const PROJECT_HOOKS_DIR_NAME = ".pi";
export const SEAM_HOOKS_CONSENT_FILE = "seam-hooks-consent.json";

/** The Claude Code event names that map 1:1 onto workflow seams (PE-005). */
export const EVENT_ALIASES: Readonly<Record<string, ProjectionSeam>> = Object.freeze({
  SessionStart: "session:start",
  SessionEnd: "session:end",
});

/** The seams an explicit auto commit/push flag may attach to (O11). */
export const AUTO_COMMIT_SEAMS: readonly ProjectionSeam[] = Object.freeze(["phase:end", "unit:end"]);

/** The wall-clock cap a declared hook timeout may name (seconds, O7). */
export const MAX_HOOK_TIMEOUT_SECONDS = 600;

/** One command handler, exactly the hooks.json fields this dispatcher runs. */
export interface HookCommandHandler {
  type: "command";
  command: string;
  /** Wall-clock seconds; bounded by the runner's hard cap. */
  timeout?: number;
}

/** One matcher group — the hooks.json group plus the workflow opt-in flags. */
export interface HookGroup {
  matcher?: string;
  /** Opt-in per seam (O4): absent or false → the group never runs. */
  enabled?: boolean;
  /** Explicit auto commit/push (O11): valid only on `AUTO_COMMIT_SEAMS`. */
  autoCommit?: boolean;
  autoPush?: boolean;
  /** Required when `autoCommit` — the deterministic commit message. */
  commitMessage?: string;
  hooks: HookCommandHandler[];
}

/** A resolved entry: the declared event mapped onto its workflow seam. */
export interface ResolvedHookEntry {
  seam: ProjectionSeam;
  declaredEvent: string;
  group: HookGroup;
  source: "global" | "project";
}

export interface HookConfigProblem {
  scope: "global" | "project";
  file: string;
  reason: GuardRejectionReason;
  detail: string;
}

export interface LoadedHooksConfig {
  /** False when any present file failed to parse or validate → declared no-op. */
  ok: boolean;
  problems: HookConfigProblem[];
  /** Every resolved entry in run order (global first, project second). */
  entries: ResolvedHookEntry[];
}

export function hookFilePaths(agentDir: string, cwd: string): { global: string; project: string } {
  return {
    global: join(agentDir, HOOKS_FILE_NAME),
    project: join(cwd, PROJECT_HOOKS_DIR_NAME, HOOKS_FILE_NAME),
  };
}

export function consentFilePath(agentDir: string): string {
  return join(agentDir, SEAM_HOOKS_CONSENT_FILE);
}

export interface LoadHooksConfigInput {
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
  /** Returns the file text, or null when the path does not exist; a throw
   *  becomes a problem — unreadable must not quietly mean unconfigured. */
  readFile?: (path: string) => string | null;
}

const NOT_THERE = new Set(["ENOENT", "ENOTDIR"]);
const readIfExists = (path: string, readFile?: (path: string) => string | null): string | null => {
  if (readFile) return readFile(path);
  // Lazy import is avoided on purpose: the node:fs read mirrors load.ts.
  const { readFileSync } = require("node:fs") as typeof import("node:fs");
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if (NOT_THERE.has((error as NodeJS.ErrnoException).code ?? "")) return null;
    throw error;
  }
};

export function loadHooksConfig(input: LoadHooksConfigInput): LoadedHooksConfig {
  const { agentDir, cwd, projectTrusted, readFile } = input;
  const paths = hookFilePaths(agentDir, cwd);
  const problems: HookConfigProblem[] = [];
  const entries: ResolvedHookEntry[] = [];

  const scopes: Array<{ scope: "global" | "project"; file: string }> = [{ scope: "global", file: paths.global }];
  if (projectTrusted) scopes.push({ scope: "project", file: paths.project });

  for (const { scope, file } of scopes) {
    let text: string | null;
    try {
      text = readIfExists(file, readFile);
    } catch {
      problems.push({ scope, file, reason: "config-invalid", detail: "unreadable" });
      continue;
    }
    if (text === null) continue;
    parseScope(scope, file, text, problems, entries);
  }

  return { ok: problems.length === 0, problems, entries: problems.length === 0 ? entries : [] };
}

function parseScope(
  scope: "global" | "project",
  file: string,
  text: string,
  problems: HookConfigProblem[],
  entries: ResolvedHookEntry[],
): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    problems.push({ scope, file, reason: "config-invalid", detail: `not valid JSON: ${(error as Error).message}` });
    return;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    problems.push({ scope, file, reason: "config-invalid", detail: "top level must be an object" });
    return;
  }
  const record = parsed as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (key === "hooks" || key === "description") continue;
    problems.push({ scope, file, reason: "config-invalid", detail: `unknown top-level key "${key}"` });
  }
  const hooks = record["hooks"];
  if (hooks === undefined) return;
  if (typeof hooks !== "object" || hooks === null || Array.isArray(hooks)) {
    problems.push({ scope, file, reason: "config-invalid", detail: '"hooks" must be an object keyed by event name' });
    return;
  }
  for (const [declaredEvent, groups] of Object.entries(hooks as Record<string, unknown>)) {
    const seam = resolveEventName(declaredEvent);
    if (seam === null) {
      problems.push({
        scope,
        file,
        reason: "config-invalid",
        detail: `unknown event "${declaredEvent}" — no workflow seam maps to it (the accepted set: ${[...PROJECTION_SEAMS].join(", ")}, plus the aliases ${Object.keys(EVENT_ALIASES).join(", ")})`,
      });
      continue;
    }
    if (!Array.isArray(groups)) {
      problems.push({ scope, file, reason: "config-invalid", detail: `"${declaredEvent}" must be an array of matcher groups` });
      continue;
    }
    for (const group of groups) {
      const parsedGroup = parseGroup(scope, file, declaredEvent, group, problems);
      if (parsedGroup) entries.push({ seam, declaredEvent, group: parsedGroup, source: scope });
    }
  }
}

export function resolveEventName(declaredEvent: string): ProjectionSeam | null {
  if ((PROJECTION_SEAMS as readonly string[]).includes(declaredEvent)) return declaredEvent as ProjectionSeam;
  return EVENT_ALIASES[declaredEvent] ?? null;
}

function parseGroup(
  scope: "global" | "project",
  file: string,
  declaredEvent: string,
  value: unknown,
  problems: HookConfigProblem[],
): HookGroup | null {
  const invalid = (detail: string): null => {
    problems.push({ scope, file, reason: "config-invalid", detail: `"${declaredEvent}": ${detail}` });
    return null;
  };
  if (typeof value !== "object" || value === null || Array.isArray(value)) return invalid("each group must be an object");
  const group = value as Record<string, unknown>;
  for (const key of Object.keys(group)) {
    if (!["matcher", "enabled", "autoCommit", "autoPush", "commitMessage", "hooks"].includes(key)) {
      return invalid(`unknown group field "${key}"`);
    }
  }
  if (group["matcher"] !== undefined && typeof group["matcher"] !== "string") return invalid('"matcher" must be a string');
  if (group["enabled"] !== undefined && typeof group["enabled"] !== "boolean") return invalid('"enabled" must be a boolean');
  if (group["autoCommit"] !== undefined && typeof group["autoCommit"] !== "boolean") return invalid('"autoCommit" must be a boolean');
  if (group["autoPush"] !== undefined && typeof group["autoPush"] !== "boolean") return invalid('"autoPush" must be a boolean');
  if (group["commitMessage"] !== undefined && typeof group["commitMessage"] !== "string") return invalid('"commitMessage" must be a string');

  const autoCommit = group["autoCommit"] === true;
  const autoPush = group["autoPush"] === true;
  const autoWanted = autoCommit || autoPush;
  const resolvedSeam = resolveEventName(declaredEvent);
  if (autoWanted && !(resolvedSeam !== null && (AUTO_COMMIT_SEAMS as readonly string[]).includes(resolvedSeam))) {
    return invalid(`"autoCommit"/"autoPush" are only valid on ${AUTO_COMMIT_SEAMS.join(" and ")} (O11 — never bundled defaults)`);
  }
  if (autoWanted && typeof group["commitMessage"] !== "string") {
    return invalid('"commitMessage" is required when "autoCommit" is set');
  }
  if (autoPush && !autoCommit) {
    return invalid('"autoPush" requires "autoCommit"');
  }

  const hooks = group["hooks"];
  if (!Array.isArray(hooks)) return invalid('"hooks" must be an array of command handlers');
  const handlers: HookCommandHandler[] = [];
  for (const handler of hooks) {
    if (typeof handler !== "object" || handler === null) return invalid("each handler must be an object");
    const record = handler as Record<string, unknown>;
    if (record["type"] !== "command") {
      return invalid(`only "command" handlers run — "${String(record["type"])}" is refused (no network, no prompt hooks)`);
    }
    if (typeof record["command"] !== "string" || record["command"].trim() === "") {
      return invalid('"command" must be a non-empty string');
    }
    if (record["timeout"] !== undefined) {
      const timeout = record["timeout"];
      if (typeof timeout !== "number" || !Number.isFinite(timeout) || timeout <= 0) return invalid('"timeout" must be a positive number of seconds');
      if (timeout > MAX_HOOK_TIMEOUT_SECONDS) return invalid(`"timeout" is capped at ${MAX_HOOK_TIMEOUT_SECONDS} seconds`);
    }
    for (const key of Object.keys(record)) {
      if (!["type", "command", "timeout"].includes(key)) return invalid(`unknown handler field "${key}"`);
    }
    handlers.push({
      type: "command",
      command: record["command"],
      ...(record["timeout"] !== undefined ? { timeout: record["timeout"] as number } : {}),
    });
  }
  return {
    ...(group["matcher"] !== undefined ? { matcher: group["matcher"] as string } : {}),
    enabled: group["enabled"] === true,
    ...(autoCommit ? { autoCommit: true } : {}),
    ...(autoPush ? { autoPush: true } : {}),
    ...(group["commitMessage"] !== undefined ? { commitMessage: group["commitMessage"] as string } : {}),
    hooks: handlers,
  };
}

/**
 * O3: consent is the marker init-workspace writes after the operator's explicit
 * yes — a per-project entry in the global store, keyed by absolute path. A
 * missing or broken store fails closed to `false`, never a throw.
 */
export function readSeamHooksConsent(
  agentDir: string,
  cwd: string,
  readFile?: (path: string) => string | null,
): boolean {
  const file = consentFilePath(agentDir);
  let text: string | null;
  try {
    text = readIfExists(file, readFile);
  } catch {
    return false;
  }
  if (text === null) return false;
  try {
    const parsed = JSON.parse(text) as { projects?: Record<string, { consented?: unknown }> };
    return parsed.projects?.[cwd]?.consented === true;
  } catch {
    return false;
  }
}
