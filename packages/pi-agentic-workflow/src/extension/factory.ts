import { loadConfig } from "../config/load.js";
import type { LoadedConfig } from "../config/load.js";
import { readCatalogue } from "../routing/catalogue.js";
import type { Catalogue } from "../routing/catalogue.js";
import { createRouter } from "../routing/dispatch.js";
import type { Router } from "../routing/dispatch.js";
import { dirtyWorktreeWarning, receiptGuard } from "./receipt-guard.js";
import { ADVANCE_COMMAND, SETTINGS_COMMAND, SETTINGS_COMMAND_ALIAS } from "../routing/types.js";
import { registerAdvanceCommand } from "./conductor-command.js";
import type { ExtensionSurface, InvocationContext, ModelRef, RoutingControls } from "../routing/types.js";
import type { HintStore } from "../routing/state.js";
import { createProfileStateStore, stateFilePath } from "../routing/state.js";

/**
 * The Pi-free half of the extension entry (SPEC "Command surface (api)").
 *
 * Given something that can register commands and a surface shaped like
 * `ExtensionAPI`, this wires one command per bundled public skill plus the
 * settings console, and returns the router that owns model lifecycle. Every
 * behaviour in AC3–AC12 is reachable from here, so `index.ts` stays a thin
 * adapter over Pi's real objects and nothing has to be tested against a live
 * session. `M` is the session model type — Pi's `Model` in production, a plain
 * `{provider, id}` in tests.
 */

export interface CommandRegistrar<M extends ModelRef = ModelRef> {
  registerCommand(
    name: string,
    options: {
      description?: string;
      handler: (args: string, ctx: InvocationContext<M>) => void | Promise<void>;
    },
  ): void;
}

/** What the settings command presents (SPEC S4): the console, over the same files. */
export type SettingsHandler<M extends ModelRef = ModelRef> = (input: {
  catalogue: Catalogue;
  ctx: InvocationContext<M>;
  /** Lets the console show and release a latch the operator can otherwise wait on. */
  routing: RoutingControls;
}) => unknown;

export interface ExtensionDeps<M extends ModelRef = ModelRef> {
  registrar: CommandRegistrar<M>;
  /** Pi's API is session-bound, so the router resolves the surface per call. */
  surface: (ctx: InvocationContext<M>) => ExtensionSurface<M>;
  /** Directory holding the bundled `skills/` tree. */
  skillsDir: string;
  /** Global agent directory, from Pi's `getAgentDir()`. */
  agentDir: string;
  hint: HintStore;
  settings: SettingsHandler<M>;
  /** Overridable so a test can hand the router an in-memory configuration. */
  loadConfig?: (ctx: InvocationContext<M>) => LoadedConfig;
  /** P4: profile demotion state store (optional — defaults to file-backed). */
  profileState?: import("../routing/state.js").ProfileStateStore;
}

export interface ExtensionHandle<M extends ModelRef = ModelRef> {
  router: Router<M>;
  catalogue: Catalogue;
  /**
   * The Pi-free predicates the adapter (`index.ts`) binds to Pi's lifecycle
   * events: the inline-receipt block guard and the dirty-worktree notice. They
   * travel with the handle so the entry stays a thin translation layer and the
   * decisions are unit-tested with no session (issue #182).
   */
  guards: {
    receiptGuard: typeof receiptGuard;
    dirtyWorktreeWarning: typeof dirtyWorktreeWarning;
  };
}

export function createExtension<M extends ModelRef = ModelRef>(deps: ExtensionDeps<M>): ExtensionHandle<M> {
  const { registrar, surface, skillsDir, agentDir, hint, settings } = deps;
  const catalogue = readCatalogue(skillsDir);

  const read = (ctx: InvocationContext<M>): LoadedConfig =>
    deps.loadConfig?.(ctx) ?? loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() });

  // A skill that cannot become a command is a packaging fact the operator must
  // see, and Pi exposes notifications only through the invocation context — so
  // the first command run in the session carries the report, once.
  let reported = catalogue.issues.length === 0;
  const reportCatalogueIssues = (ctx: InvocationContext<M>): void => {
    if (reported) return;
    reported = true;
    for (const issue of catalogue.issues) {
      ctx.notify(`pi-agentic-workflow: skills/${issue.dir}: ${issue.message}`, "warning");
    }
  };

  const knownCommands = new Set<string>([
    ...catalogue.commands.map((entry) => entry.name),
    ADVANCE_COMMAND,
    SETTINGS_COMMAND,
    SETTINGS_COMMAND_ALIAS,
  ]);
  // P4: build the profile state store when not provided.
  const profileState = deps.profileState ?? createProfileStateStore({ path: stateFilePath(agentDir) });
  const router = createRouter<M>({ surface, loadConfig: read, hint, settingsCommand: SETTINGS_COMMAND, knownCommands, profileState });

  for (const command of catalogue.commands) {
    registrar.registerCommand(command.name, {
      ...(command.description ? { description: command.description } : {}),
      handler: async (args, ctx) => {
        reportCatalogueIssues(ctx);
        await router.dispatch(command, args, ctx);
      },
    });
  }

  // One handler for both names — `/aw-settings` is a pointer to the same console
  // and the same two config files, never a separate route surface (OB-5, AC6).
  const settingsHandler = async (_args: string, ctx: InvocationContext<M>): Promise<void> => {
    reportCatalogueIssues(ctx);
    // Bound for the console: two verbs and the session they act on, so it cannot
    // reach for `settle` or `dispatch` by accident.
    const routing = { inFlight: () => router.inFlight(), undoInFlight: () => router.undoInFlight(ctx) };
    try {
      await settings({ catalogue, ctx, routing });
    } catch (error) {
      // A console that dies mid-question must say so, not take the session down.
      ctx.notify(`Settings could not be opened: ${(error as Error).message}`, "error");
    }
  };

  // The native conductor command (feature 62): registered in code, not derived
  // from a skill dir, and able to invoke every catalogue command by name.
  registerAdvanceCommand(registrar, { surface, readConfig: read }, knownCommands);

  registrar.registerCommand(SETTINGS_COMMAND, {
    description: "Show and configure per-command model routing",
    handler: settingsHandler,
  });
  registrar.registerCommand(SETTINGS_COMMAND_ALIAS, {
    description: "Show and configure per-command model routing",
    handler: settingsHandler,
  });

  return { router, catalogue, guards: { receiptGuard, dirtyWorktreeWarning } };
}
