// src/settings/console.ts
// `/agentic-workflow-settings` (SPEC S4, S11, AC10, D-P8).
//
// The console edits **one file at a time** but always opens on the **merged**
// view, because "what will this command actually run on?" is the only question an
// operator has, and the answer depends on both scopes. Two rules keep it honest:
// a scope whose file does not parse cannot be overwritten (that file is evidence
// the operator must fix, not noise to clobber), and the project scope is refused
// while the project is untrusted — the same gate the loader applies (AC13).

import { loadConfig, configFilePaths } from "../config/load.js";
import type { ConfigProblem } from "../config/types.js";
import { parseConfigFile, parseModelReference } from "../config/schema.js";
import { THINKING_LEVELS, UNAVAILABLE_ROUTE_POLICIES } from "../config/types.js";
import type { ModelRef } from "../routing/types.js";
import type { ConfigFile, ModelSetting, RouteFile, ThinkingSetting, UnavailableRoutePolicy } from "../config/types.js";
import { renderMergedConfig, routePath, DEFAULT_ROUTE } from "./view.js";

/** The slice of `ctx.ui` the console uses. */
export interface SettingsUi {
  select(title: string, options: readonly string[]): Promise<string | undefined> | string | undefined;
  input(title: string, placeholder?: string): Promise<string | undefined> | string | undefined;
  confirm(title: string, message: string): Promise<boolean> | boolean;
  notify(message: string, kind?: "info" | "warning" | "error"): void;
}

export interface SettingsDeps {
  ui: SettingsUi;
  agentDir: string;
  cwd: string;
  projectTrusted: boolean;
  /** Routed command names — what the operator may attach an override to. */
  commands: readonly string[];
  /** `provider/modelId` references from the live registry, when one is reachable. */
  models?: readonly string[];
  readFile(path: string): string | null;
  writeFile(path: string, text: string): void;
}

export type ConsoleOutcome =
  | { status: "saved"; scope: "global" | "project"; path: string; file: ConfigFile }
  | { status: "cancelled"; edited: boolean };

/**
 * The console's questions. `test/settings-console.test.mjs` drives the flow
 * through these strings, so renaming one fails the tests that use it rather than
 * silently re-sequencing them.
 */
export const prompts = {
  scope: "Which file should the console edit?",
  menu: "What do you want to change?",
  command: "Which command?",
  policyChoice: "What should happen when a configured model is unavailable?",
  saveTo: (path: string): string => `Save the draft to ${path}?`,
  discard: "Discard the draft?",
  setDefaultRoute: "Set the default route",
  setOverride: "Set a command override",
  clearOverride: "Clear a command override",
  policy: "Set the unavailable-route policy",
  save: "Save",
  cancel: "Cancel",
  model: (target: string): string => `Model for ${target}?`,
  modelPicked: (target: string): string => `Which model for ${target}?`,
  thinking: (target: string): string => `Thinking level for ${target}?`,
} as const;

const GLOBAL_LABEL = "Global";
const PROJECT_LABEL = "Project";
const TYPED = "Type another reference…";
const INHERIT = "inherit";

export async function runSettingsConsole(deps: SettingsDeps): Promise<ConsoleOutcome> {
  const paths = configFilePaths(deps.agentDir, deps.cwd);
  deps.ui.notify(renderMergedConfig(loadConfig({ agentDir: deps.agentDir, cwd: deps.cwd, projectTrusted: deps.projectTrusted, readFile: deps.readFile }), deps.commands).join("\n"), "info");

  const opened = await openAScope(deps, paths.global, paths.project);
  if (!opened) return { status: "cancelled", edited: false };

  const { scope, path, original } = opened;
  let draft: ConfigFile = original;

  for (;;) {
    const choice = await deps.ui.select(prompts.menu, [
      prompts.setDefaultRoute,
      prompts.setOverride,
      prompts.clearOverride,
      prompts.policy,
      prompts.save,
      prompts.cancel,
    ]);
    if (choice === undefined || choice === prompts.cancel) {
      return { status: "cancelled", edited: dirty(draft, original) ? await discard(deps.ui) : false };
    }

    if (choice === prompts.setDefaultRoute) {
      const edited = await editRoute(deps, DEFAULT_ROUTE);
      if (edited) draft = { ...draft, default: edited };
      continue;
    }
    if (choice === prompts.setOverride) {
      const name = await pickCommand(deps, commandChoices(deps, draft));
      if (name === undefined) continue;
      const route = await editRoute(deps, name);
      if (route) draft = { ...draft, commands: { ...draft.commands, [name]: route } };
      continue;
    }
    if (choice === prompts.clearOverride) {
      const name = await pickCommand(deps, Object.keys(draft.commands ?? {}));
      if (name === undefined) continue;
      const rest = { ...draft.commands };
      delete rest[name];
      draft = { ...draft, commands: rest };
      continue;
    }
    if (choice === prompts.policy) {
      const picked = await deps.ui.select(prompts.policyChoice, [...UNAVAILABLE_ROUTE_POLICIES]);
      if (isPolicy(picked)) draft = { ...draft, onUnavailableRoute: picked };
      continue;
    }
    if (choice === prompts.save) {
      const saved = await saveScope(deps, scope, path, draft);
      if (saved) return { status: "saved", scope, path, file: clean(draft) };
      continue;
    }
    deps.ui.notify(`Unknown choice: ${String(choice)}`, "warning");
  }
}

/**
 * Ask for a scope until one can be edited: an untrusted project is refused
 * without being read, and a scope whose file does not parse is refused so the
 * operator's own file survives (AC10, AC13).
 */
async function openAScope(
  deps: SettingsDeps,
  globalPath: string,
  projectPath: string,
): Promise<{ scope: "global" | "project"; path: string; original: ConfigFile } | undefined> {
  for (;;) {
    const label = await deps.ui.select(prompts.scope, [GLOBAL_LABEL, PROJECT_LABEL]);
    if (!label) return undefined;
    const scope = label === PROJECT_LABEL ? "project" : "global";
    const path = scope === "project" ? projectPath : globalPath;

    if (scope === "project" && !deps.projectTrusted) {
      deps.ui.notify(
        `${path} is not editable while this project is untrusted — trust the project, or edit the global file instead.`,
        "warning",
      );
      continue;
    }
    const text = deps.readFile(path);
    if (text === null) return { scope, path, original: {} };
    const parsed = parseFile(text, scope);
    if (parsed.problems.length > 0) {
      deps.ui.notify(
        [`Nothing can be saved over an invalid ${scope} file (${path}):`, ...describe(parsed.problems)].join("\n"),
        "error",
      );
      continue;
    }
    return { scope, path, original: parsed.file };
  }
}

/** Ask for a model and a thinking level; `undefined` means nothing changed. */
async function editRoute(deps: SettingsDeps, target: string): Promise<RouteFile | undefined> {
  const model = await askModel(deps, target);
  if (model === undefined) return undefined;
  const thinking = await askThinking(deps, target);
  if (thinking === undefined) return undefined;
  return { model, thinking };
}

async function askModel(deps: SettingsDeps, target: string): Promise<ModelSetting | undefined> {
  let answer: string | undefined;
  if (deps.models && deps.models.length > 0) {
    answer = await deps.ui.select(prompts.modelPicked(target), [...deps.models, TYPED]);
    if (answer === TYPED || answer === undefined) answer = await deps.ui.input(prompts.model(target), "provider/modelId or inherit");
  } else {
    answer = await deps.ui.input(prompts.model(target), "provider/modelId or inherit");
  }
  if (answer === undefined) return undefined;

  const value = answer.trim();
  if (value === INHERIT) return INHERIT;
  if (!/^[^/\s]+\/[^/\s]+$/.test(value)) {
    // Rejected in the operator's terms and in the schema's: the value, and the
    // field path the loader would name for the same mistake in a file (AC5).
    deps.ui.notify(
      `Rejected: model must be "provider/modelId" or "inherit" — nothing was changed (${routePath(target)}.model).`,
      "error",
    );
    return undefined;
  }
  const parts = parseModelReference(value);
  return parts ? `${parts.provider}/${parts.id}` : undefined;
}

async function askThinking(deps: SettingsDeps, target: string): Promise<ThinkingSetting | undefined> {
  const answer = await deps.ui.select(prompts.thinking(target), [...THINKING_LEVELS, INHERIT]);
  if (answer === undefined) return undefined;
  if (answer === INHERIT || isThinkingLevel(answer)) return answer;
  deps.ui.notify(`Rejected: thinking must be one of ${THINKING_LEVELS.join(", ")}, or "inherit" (${routePath(target)}.thinking).`, "error");
  return undefined;
}

async function pickCommand(deps: SettingsDeps, options: readonly string[]): Promise<string | undefined> {
  if (options.length === 0) {
    deps.ui.notify("There is no command to pick here.", "warning");
    return undefined;
  }
  return deps.ui.select(prompts.command, [...options].sort((a, b) => a.localeCompare(b)));
}

function commandChoices(deps: SettingsDeps, draft: ConfigFile): string[] {
  return [...new Set([...deps.commands, ...Object.keys(draft.commands ?? {})])];
}

async function saveScope(
  deps: SettingsDeps,
  scope: "global" | "project",
  path: string,
  draft: ConfigFile,
): Promise<boolean> {
  const file = clean(draft);
  const text = `${JSON.stringify(file, null, 2)}\n`;
  const problems = problemsFor(file, scope);
  if (problems.length > 0) {
    deps.ui.notify(["Nothing saved — the draft is invalid:", ...describe(problems)].join("\n"), "error");
    return false;
  }
  if (!(await deps.ui.confirm(prompts.saveTo(path), describeRouting(file)))) {
    deps.ui.notify("Nothing saved.", "info");
    return false;
  }
  deps.writeFile(path, text);
  deps.ui.notify(`${scope === "project" ? "Project" : "Global"} routing saved to ${path}`, "info");
  return true;
}

async function discard(ui: SettingsUi): Promise<boolean> {
  const dropped = await ui.confirm(prompts.discard, "Your edits are not in any config file yet.");
  if (!dropped) ui.notify("Draft kept — nothing was saved.", "info");
  return Boolean(dropped);
}

function problemsFor(file: ConfigFile, scope: "global" | "project"): ConfigProblem[] {
  // The draft is judged exactly as the file it would become — one validator, no
  // second opinion that could disagree with the loader (P2).
  return parseFile(JSON.stringify(file), scope).problems;
}

function withScope(issue: { path: string; message: string }, scope: "global" | "project"): ConfigProblem {
  return { scope, path: issue.path, message: issue.message };
}

/** The line the save confirmation repeats back, so the operator signs what they see. */
function describeRouting(file: ConfigFile): string {
  const routes = [
    file.default ? `default: ${file.default.model ?? "inherit"} / ${file.default.thinking ?? "inherit"}` : "default: inherit / inherit",
    ...Object.entries(file.commands ?? {}).map(([name, route]) => `${name}: ${route.model ?? "inherit"} / ${route.thinking ?? "inherit"}`),
    `unavailable: ${file.onUnavailableRoute ?? "stop"}`,
  ];
  return routes.join(" · ");
}

/** Say only what the operator chose: inherit-only routes are the shipped default. */
function clean(draft: ConfigFile): ConfigFile {
  const file: ConfigFile = {};
  if (draft.default && !isInheritOnly(draft.default)) file.default = { ...draft.default };
  const commands: Record<string, RouteFile> = {};
  for (const [name, route] of Object.entries(draft.commands ?? {})) {
    if (!isInheritOnly(route)) commands[name] = { ...route };
  }
  if (Object.keys(commands).length > 0) file.commands = commands;
  if (draft.onUnavailableRoute && draft.onUnavailableRoute !== "stop") file.onUnavailableRoute = draft.onUnavailableRoute;
  return file;
}

function parseFile(text: string, scope: "global" | "project"): { file: ConfigFile; problems: ConfigProblem[] } {
  const result = parseConfigFile(text);
  return result.ok
    ? { file: result.config, problems: [] }
    : { file: {}, problems: result.issues.map((issue) => withScope(issue, scope)) };
}

function describe(problems: readonly ConfigProblem[]): string[] {
  return problems.map((problem) => `  ${problem.path}: ${problem.message}`);
}

function isInheritOnly(route: RouteFile): boolean {
  return (route.model ?? INHERIT) === INHERIT && (route.thinking ?? INHERIT) === INHERIT;
}

function dirty(a: ConfigFile, b: ConfigFile): boolean {
  return JSON.stringify(clean(a)) !== JSON.stringify(clean(b));
}

function isThinkingLevel(value: string): value is ThinkingSetting {
  return (THINKING_LEVELS as readonly string[]).includes(value);
}

function isPolicy(value: string | undefined): value is UnavailableRoutePolicy {
  return value === "stop" || value === "inherit";
}
