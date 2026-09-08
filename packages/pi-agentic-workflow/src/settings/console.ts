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
import { effectiveRoute } from "../config/merge.js";
import { parseConfigFile, parseModelReference } from "../config/schema.js";
import { MAX_MODEL_CHAIN, THINKING_LEVELS, UNAVAILABLE_ROUTE_POLICIES } from "../config/types.js";
import type { RoutingControls, SettingsUi } from "../routing/types.js";
import type { ConfigFile, ModelRef, ModelSetting, Route, RouteFile, ThinkingSetting, UnavailableRoutePolicy } from "../config/types.js";
import { renderMergedConfig, routePath, DEFAULT_ROUTE } from "./view.js";

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
  /**
   * The router's live state, when the console was opened from a session that owns
   * one. A routed turn that never settled — Pi starts it inside an action that
   * swallows failures — leaves the latch held with no `agent_settled` coming, and
   * every later command refuses. The operator needs a way out that is not
   * "restart Pi", and the console is the only surface with room to explain it.
   */
  routing?: RoutingControls;
}

export type ConsoleOutcome =
  | { status: "saved"; scope: "global" | "project"; path: string; file: ConfigFile }
  | { status: "cancelled"; edited: boolean };

/** The console's questions. `test/settings-console.test.mjs` drives the flow
 * through these strings, so renaming one fails the tests that use it rather than
 * silently re-sequencing them. */
export const prompts = {
  scope: "Which file should the console edit?",
  menu: "What do you want to change?",
  inFlight: (command: string): string => `a routed /${command} is still held`,
  undoInFlight: "Undo a routing that never started",
  undone: "The routing was undone and the session put back.",
  command: "Which command?",
  policyChoice: "What should happen when a configured model is unavailable?",
  saveTo: (path: string): string => `Save the draft to ${path}?`,
  discard: "Discard the draft?",
  setDefaultRoute: "Set the default route",
  setOverride: "Set a command override",
  clearOverride: "Clear a command override",
  bulkApply: "Apply one route to several commands",
  bulkClear: "Clear several overrides",
  addAnother: "Add another?",
  policy: "Set the unavailable-route policy",
  save: "Save",
  cancel: "Cancel",
  model: (target: string): string => `Model for ${target}?`,
  modelPicked: (target: string): string => `Which model for ${target}?`,
  thinking: (target: string): string => `Thinking level for ${target}?`,
  fields: "Which fields should change?",
  fieldsBoth: "model and thinking",
  fieldsModel: "model only",
  fieldsThinking: "thinking only",
  chainAction: (target: string): string => `Model chain for ${target}?`,
  chainAppend: "Add a fallback",
  chainRemoveLast: "Remove the last",
  chainDone: "Done",
} as const;

const GLOBAL_LABEL = "Global";
const PROJECT_LABEL = "Project";
const TYPED = "Type another reference…";
const INHERIT = "inherit";

export async function runSettingsConsole(deps: SettingsDeps): Promise<ConsoleOutcome> {
  const paths = configFilePaths(deps.agentDir, deps.cwd);
  const merged = loadConfig({ agentDir: deps.agentDir, cwd: deps.cwd, projectTrusted: deps.projectTrusted, readFile: deps.readFile });
  deps.ui.notify(renderMergedConfig(merged, deps.commands).join("\n"), "info");
  /** The value in force for a target (the merged route, or the default when the target is "the default route"). */
  const currentFor = (target: string): Route => effectiveRoute(merged.config, target);

  const opened = await openAScope(deps, paths.global, paths.project);
  if (!opened) return { status: "cancelled", edited: false };

  const { scope, path, original } = opened;
  let draft: ConfigFile = original;

  for (;;) {
    // Only offered while a turn actually holds the latch: an option that does
    // nothing is how a console becomes noise.
    const choice = await deps.ui.select(prompts.menu, [
      prompts.setDefaultRoute,
      prompts.setOverride,
      prompts.clearOverride,
      prompts.bulkApply,
      prompts.bulkClear,
      prompts.policy,
      ...(deps.routing?.inFlight() ? [prompts.undoInFlight] : []),
      prompts.save,
      prompts.cancel,
    ]);
    if (choice === prompts.undoInFlight) {
      const undone = (await deps.routing?.undoInFlight()) ?? false;
      deps.ui.notify(undone ? prompts.undone : "Nothing was in flight.", undone ? "info" : "warning");
      continue;
    }
    if (choice === undefined || choice === prompts.cancel) {
      return { status: "cancelled", edited: dirty(draft, original) ? await discard(deps.ui) : false };
    }

    if (choice === prompts.setDefaultRoute) {
      const edited = await editRoute(deps, DEFAULT_ROUTE, currentFor(DEFAULT_ROUTE));
      if (edited) draft = { ...draft, default: edited };
      continue;
    }
    if (choice === prompts.setOverride) {
      const name = await pickCommand(deps, commandChoices(deps, draft));
      if (name === undefined) continue;
      const route = await editRoute(deps, name, currentFor(name));
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
    if (choice === prompts.bulkApply) {
      // One field pass (model via the chain builder + thinking), applied to every
      // selected command. A reference missing from the live registry warns per
      // command but never blocks the write (OB-4 — dispatch's probe stays the
      // authoritative availability gate).
      const selected = await pickCommandsMulti(deps, commandChoices(deps, draft));
      if (selected === undefined || selected.length === 0) continue;
      const route = await editRoute(deps, selected[0], currentFor(selected[0]));
      if (route === undefined) continue;
      const nextCommands = { ...draft.commands };
      for (const name of selected) {
        nextCommands[name] = route;
        warnMissingModel(deps, name, route.model ?? INHERIT);
      }
      draft = { ...draft, commands: nextCommands };
      continue;
    }
    if (choice === prompts.bulkClear) {
      const names = await pickCommandsMulti(deps, Object.keys(draft.commands ?? {}));
      if (names === undefined || names.length === 0) continue;
      const rest = { ...draft.commands };
      for (const name of names) delete rest[name];
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
async function editRoute(deps: SettingsDeps, target: string, current: Route): Promise<RouteFile | undefined> {
  const fields = await askFields(deps);
  if (fields === undefined) return undefined; // nothing marked — the route is left untouched (OB-3)

  // Start from the value in force so only the marked field is replaced; the other
  // keeps its merged value (AC4: changing only model asks no thinking question).
  const route: RouteFile = {
    ...(current.model !== undefined ? { model: current.model } : {}),
    ...(current.thinking !== undefined ? { thinking: current.thinking } : {}),
  };
  if (fields.model) {
    const model = await askModel(deps, target, current.model);
    if (model === undefined) return undefined;
    route.model = model;
  }
  if (fields.thinking) {
    const thinking = await askThinking(deps, target, current.thinking);
    if (thinking === undefined) return undefined;
    route.thinking = thinking;
  }
  return route;
}

/** Which fields the operator wants to change; `undefined` means none (leave untouched). */
async function askFields(deps: SettingsDeps): Promise<{ model: boolean; thinking: boolean } | undefined> {
  const choice = await deps.ui.select(prompts.fields, [prompts.fieldsBoth, prompts.fieldsModel, prompts.fieldsThinking]);
  if (choice === prompts.fieldsBoth) return { model: true, thinking: true };
  if (choice === prompts.fieldsModel) return { model: true, thinking: false };
  if (choice === prompts.fieldsThinking) return { model: false, thinking: true };
  return undefined;
}

/** Ask for one model entry; `undefined` means cancelled/skipped, `"inherit"` means the whole-route setting. */
async function pickModelEntry(deps: SettingsDeps, target: string, current?: ModelSetting): Promise<"inherit" | ModelRef | undefined> {
  let answer: string | undefined;
  if (typeof deps.ui.pick === "function" && deps.models && deps.models.length > 0) {
    // Rich seam: filterable, windowed, preselected to the value in force (OB-1).
    const picked = await deps.ui.pick(prompts.modelPicked(target), [...deps.models, TYPED], {
      initial: typeof current === "string" ? current : undefined,
    });
    answer = typeof picked === "string" ? picked : undefined;
    if (answer === TYPED || answer === undefined) answer = await deps.ui.input(prompts.model(target), "provider/modelId or inherit");
  } else if (deps.models && deps.models.length > 0) {
    answer = await deps.ui.select(prompts.modelPicked(target), [...deps.models, TYPED]);
    if (answer === TYPED || answer === undefined) answer = await deps.ui.input(prompts.model(target), "provider/modelId or inherit");
  } else {
    answer = await deps.ui.input(prompts.model(target), "provider/modelId or inherit");
  }
  if (answer === undefined) return undefined;

  const value = answer.trim();
  if (value === INHERIT) return INHERIT;
  const parts = parseModelReference(value);
  if (!parts) {
    // Rejected in the operator's terms and in the schema's: the value, and the
    // field path the loader would name for the same mistake in a file (AC5).
    deps.ui.notify(
      `Rejected: model must be "provider/modelId" or "inherit" — nothing was changed (${routePath(target)}.model).`,
      "error",
    );
    return undefined;
  }
  return `${parts.provider}/${parts.id}`;
}

/** Ask for a model; a lone reference is returned as-is, several references are returned as an ordered chain. */
async function askModel(deps: SettingsDeps, target: string, current?: ModelSetting): Promise<ModelSetting | undefined> {
  const first = await pickModelEntry(deps, target, typeof current === "string" ? current : undefined);
  if (first === undefined) return undefined;
  if (first === INHERIT) return INHERIT;

  const chain: ModelRef[] = [first];
  while (chain.length < MAX_MODEL_CHAIN) {
    const action = await deps.ui.select(prompts.chainAction(target), [
      prompts.chainAppend,
      prompts.chainRemoveLast,
      prompts.chainDone,
    ]);
    if (action === prompts.chainAppend) {
      const next = await pickModelEntry(deps, target);
      if (next === undefined) continue;
      if (next === INHERIT) {
        deps.ui.notify(
          `Only "provider/modelId" references can be chain entries; "inherit" is a whole-route setting (${routePath(target)}.model).`,
          "error",
        );
        continue;
      }
      chain.push(next);
    } else if (action === prompts.chainRemoveLast) {
      if (chain.length > 1) chain.pop();
    } else {
      break;
    }
  }
  return chain.length === 1 ? chain[0] : chain;
}

async function askThinking(deps: SettingsDeps, target: string, current?: ThinkingSetting): Promise<ThinkingSetting | undefined> {
  const options = [...THINKING_LEVELS, INHERIT];
  let answer: string | undefined;
  if (typeof deps.ui.pick === "function") {
    const picked = await deps.ui.pick(prompts.thinking(target), options, {
      initial: typeof current === "string" ? current : undefined,
    });
    answer = typeof picked === "string" ? picked : undefined;
  } else {
    answer = await deps.ui.select(prompts.thinking(target), options);
  }
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

/** Multi-select command picker over the seam's `multiple` mode; a non-rich UI falls back to repeated single selects. */
async function pickCommandsMulti(deps: SettingsDeps, options: readonly string[]): Promise<readonly string[] | undefined> {
  if (options.length === 0) {
    deps.ui.notify("There is no command to pick here.", "warning");
    return undefined;
  }
  const sorted = [...options].sort((a, b) => a.localeCompare(b));
  if (typeof deps.ui.pick === "function") {
    const picked = await deps.ui.pick(prompts.command, sorted, { multiple: true });
    if (picked === undefined) return undefined;
    return typeof picked === "string" ? [picked] : picked;
  }
  // Non-rich fallback: repeatedly select one candidate until the operator stops.
  const chosen: string[] = [];
  for (;;) {
    const remaining = sorted.filter((option) => !chosen.includes(option));
    if (remaining.length === 0) break;
    const picked = await deps.ui.select(prompts.command, remaining);
    if (picked === undefined) break;
    chosen.push(picked);
    if (!(await deps.ui.confirm(prompts.addAnother, `Picked ${chosen.join(", ")}.`))) break;
  }
  return chosen.length > 0 ? chosen : undefined;
}

/** Advisory per-command warning when a chosen reference is absent from the live registry (OB-4). */
function warnMissingModel(deps: SettingsDeps, target: string, model: ModelSetting): void {
  if (!deps.models || deps.models.length === 0) return;
  const refs = typeof model === "string" ? [model] : model;
  for (const ref of refs) {
    if (ref !== INHERIT && !deps.models.includes(ref)) {
      deps.ui.notify(
        `/${target}: ${ref} is not in the live model registry — dispatch will decide availability when the route runs.`,
        "warning",
      );
    }
  }
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

/**
 * Keep everything the file held or the operator set; drop only what says nothing
 * (an empty route). Eliding by VALUE — treating an explicit `inherit` or `stop` as
 * absent because a shipped default happens to agree — silently discards the only
 * two moves that matter at project scope: switching a command off under a global
 * route, and re-arming fail-closed over a global `inherit` (F4).
 */
function clean(draft: ConfigFile): ConfigFile {
  const file: ConfigFile = {};
  if (draft.default && Object.keys(draft.default).length > 0) file.default = { ...draft.default };
  const commands: Record<string, RouteFile> = {};
  for (const [name, route] of Object.entries(draft.commands ?? {})) {
    if (Object.keys(route).length > 0) commands[name] = { ...route };
  }
  if (Object.keys(commands).length > 0) file.commands = commands;
  if (draft.onUnavailableRoute) file.onUnavailableRoute = draft.onUnavailableRoute;
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

function dirty(a: ConfigFile, b: ConfigFile): boolean {
  return JSON.stringify(clean(a)) !== JSON.stringify(clean(b));
}

function isThinkingLevel(value: string): value is ThinkingSetting {
  return (THINKING_LEVELS as readonly string[]).includes(value);
}

function isPolicy(value: string | undefined): value is UnavailableRoutePolicy {
  return value === "stop" || value === "inherit";
}
