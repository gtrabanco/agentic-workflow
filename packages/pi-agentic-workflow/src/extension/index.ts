import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getAgentDir, isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { SelectListTheme } from "@earendil-works/pi-tui";

import { loadConfig } from "../config/load.js";
import { evaluateToolCall } from "../config/path-policy.js";
import { THINKING_LEVELS } from "../config/types.js";
import { createExtension } from "./factory.js";
import type { CommandRegistrar } from "./factory.js";
import { readGitStatusBounded } from "./receipt-guard.js";
import type { InvocationContext, SettingsUi } from "../routing/types.js";
import { createPickerComponent, PICKER_MAX_VISIBLE, pagedSelect } from "../settings/picker.js";
import { createHintStore, stateFilePath } from "../routing/state.js";
import { runSettingsConsole } from "../settings/console.js";
import { readConfigFile, writeConfigFile } from "../settings/store.js";
import { SETTINGS_COMMAND } from "../routing/types.js";

/**
 * Pi adapter — the only file in the package that imports Pi values (SPEC
 * "Package layout": `dist/extension/index.js`).
 *
 * Its whole job is translation between Pi's context and the narrow view the
 * router understands, with no casts: `M` is bound to Pi's own `Model`, so every
 * model reference the router stores and hands back is the exact object
 * `ctx.modelRegistry` produced. Routing, configuration, and lifecycle live in
 * the Pi-free modules this wires — which is what lets AC3–AC12 be tested
 * without a session.
 */

const skillsDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "skills");

type PiModel = NonNullable<ExtensionContext["model"]>;
type PiThinkingLevel = Parameters<ExtensionAPI["setThinkingLevel"]>[0];

/**
 * Compile-time drift guard (SPEC "Risks": Pi can add thinking levels). The
 * mirrored union in `config/types.ts` must stay equal to Pi's; when it changes,
 * this stops compiling instead of rejecting a valid level at runtime.
 */
type ThinkingLevelsMirrorMatchesPi = [PiThinkingLevel] extends [(typeof THINKING_LEVELS)[number]]
  ? [(typeof THINKING_LEVELS)[number]] extends [PiThinkingLevel]
    ? true
    : false
  : false;
const thinkingLevelsInSyncWithPi: ThinkingLevelsMirrorMatchesPi = true;

/**
 * The interactive slice the settings console sees: Pi's own `ui` plus the rich
 * picker (P4). The picker is terminal-only, so a non-TUI mode (headless/RPC)
 * gets the plain `select` path — the console never dead-ends (OB-12, PE-004).
 * Exported as a test seam: the fallback's bounded paging (AC8) is exercised
 * directly, without standing up the whole extension.
 */
export function richUi(ctx: ExtensionContext): SettingsUi {
  const base = ctx.ui;
  return {
    select: (title, options) => base.select(title, [...options]),
    input: (title, placeholder) => base.input(title, placeholder),
    confirm: (title, message) => base.confirm(title, message),
    notify: (message, kind) => base.notify(message, kind),
    pick: async (title, options, opts = {}) => {
      if (ctx.mode !== "tui") {
        // Non-TUI: the host's `select` dialog carries the same 24-option cap, so
        // an over-cap list pages instead of crashing `pick` (AC8, PE-002). A
        // list within the cap is one call with the same options, in order.
        const picked = await pagedSelect(
          (selectTitle, selectOptions) => base.select(selectTitle, [...selectOptions]),
          title,
          [...options],
        );
        if (opts.multiple) return picked ? [picked] : undefined;
        return picked;
      }
      const items = options.map((value) => ({ value, label: value }));
      const result = await base.custom<string | undefined>(
        (_tui, theme, _keybindings, done) => {
          const selectListTheme: SelectListTheme = {
            selectedPrefix: (text) => theme.bold(`› ${text}`),
            selectedText: (text) => theme.inverse(text),
            description: (text) => `  ${text}`,
            scrollInfo: (text) => theme.bold(text),
            noMatch: (text) => theme.italic(text),
          };
          return createPickerComponent({
            items,
            maxVisible: PICKER_MAX_VISIBLE,
            theme: selectListTheme,
            initial: opts.initial,
            onSelect: (value) => done(value),
            onCancel: () => done(undefined),
          });
        },
        { overlay: true },
      );
      if (opts.multiple) return result === undefined ? undefined : [result];
      return result;
    },
  };
}

function toInvocationContext(ctx: ExtensionContext): InvocationContext<PiModel> {
  return {
    cwd: ctx.cwd,
    get model() {
      return ctx.model;
    },
    isIdle: () => ctx.isIdle(),
    isProjectTrusted: () => ctx.isProjectTrusted(),
    notify: (message, kind) => ctx.ui.notify(message, kind),
    ui: richUi(ctx),
    availableModels: () => ctx.modelRegistry.getAll(),
    find: (provider, modelId) => ctx.modelRegistry.find(provider, modelId),
    hasConfiguredAuth: (model) => ctx.modelRegistry.hasConfiguredAuth(model),
  };
}

function toRegistrar(pi: ExtensionAPI): CommandRegistrar<PiModel> {
  return {
    registerCommand: (name, options) =>
      pi.registerCommand(name, {
        ...(options.description ? { description: options.description } : {}),
        handler: async (args, ctx) => {
          await options.handler(args, toInvocationContext(ctx));
        },
      }),
  };
}

/** Every unit decision ledger's `path-protection-records@1` block, concatenated. */
function collectRecordTexts(root: string): string {
  const texts: string[] = [];
  for (const parent of ["docs/features", "docs/fix"]) {
    const base = join(root, parent);
    let entries: import("node:fs").Dirent[];
    try {
      entries = readdirSync(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        texts.push(readFileSync(join(base, entry.name, "decisions.md"), "utf8"));
      } catch {
        // A unit without a decisions ledger contributes no records.
      }
    }
  }
  return texts.join("\n");
}

export default function extension(pi: ExtensionAPI): void {
  const agentDir = getAgentDir();
  const hint = createHintStore({ path: stateFilePath(agentDir) });
  // Said once per session: an override that was ignored (or a malformed file)
  // is reported the first time the guard runs, never on every tool call.
  let reportedDegradations = false;

  const { router, guards } = createExtension<PiModel>({
    registrar: toRegistrar(pi),
    // Resolved per call: the router must never hold a session-bound object
    // between turns, because Pi can hand a new session to the same extension.
    surface: () => ({
      sendUserMessage: (content, options) => pi.sendUserMessage(content, options),
      setModel: (model) => pi.setModel(model),
      getThinkingLevel: () => pi.getThinkingLevel(),
      setThinkingLevel: (level) => pi.setThinkingLevel(level),
    }),
    skillsDir,
    agentDir,
    hint,
    loadConfig: (ctx) => loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() }),
    // The console edits the same files the dispatcher reads (SPEC S4, AC10).
    settings: ({ ctx, catalogue: routed, routing }) =>
      runSettingsConsole({
        routing,
        ui: ctx.ui,
        agentDir,
        cwd: ctx.cwd,
        projectTrusted: ctx.isProjectTrusted(),
        commands: routed.commands.map((command) => command.name),
        models: ctx.availableModels().map((model) => `${model.provider}/${model.id}`),
        readFile: readConfigFile,
        writeFile: writeConfigFile,
      }),
  });

  pi.on("model_select", (event) => router.noteModelSelect(event.model));
  pi.on("thinking_level_select", (event) => router.noteThinkingLevelSelect(event.level));
  // The inline-receipt path is impossible: a `gh pr comment` carrying a
  // REVIEW-PASS / merge-ready marker is blocked before it runs, and the reason
  // names the script that proves the receipt landed (issue #182). The guard
  // itself filters to `bash`, so every tool call is checked — nesting it under
  // one tool name would make the block unreachable for the calls it exists for.
  pi.on("tool_call", (event, ctx) => {
    const command = "command" in event.input && typeof event.input.command === "string" ? event.input.command : undefined;
    const receipt = guards.receiptGuard({ toolName: event.toolName, command });
    if (receipt.block) return receipt;
    // Tier 2 path prevention (feature 60): block a write/edit to an existing
    // protected path with no matching justification record; reads and new-file
    // creates pass. Reads the same effective policy the Tier 1 gate reads.
    if (!isToolCallEventType("write", event) && !isToolCallEventType("edit", event)) return undefined;
    const targetPath = event.input.path;
    if (typeof targetPath !== "string" || targetPath === "") return undefined;
    const loaded = loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() });
    if (!reportedDegradations && loaded.pathProtectionDegradations.length > 0) {
      reportedDegradations = true;
      for (const degradation of loaded.pathProtectionDegradations) {
        ctx.ui.notify(`pi-agentic-workflow: path protection — ${degradation.code}: ${degradation.detail}`, "warning");
      }
    }
    const absolute = isAbsolute(targetPath) ? targetPath : resolve(ctx.cwd, targetPath);
    const relativeTarget = isAbsolute(targetPath) ? relative(ctx.cwd, absolute) : targetPath;
    const decision = evaluateToolCall({
      toolName: event.toolName,
      targetPath: relativeTarget,
      targetExists: existsSync(absolute),
      policy: loaded.config.pathProtection,
      recordsText: collectRecordTexts(ctx.cwd),
    });
    return decision.block ? { block: true, reason: decision.reason } : undefined;
  });
  pi.on("agent_settled", (_event, ctx) => {
    void router.settle(toInvocationContext(ctx));
    // Terminal hygiene is said out loud once the turn is over; a clean tree
    // stays silent. The probe is time-bounded (2000 ms) and swallows timeout,
    // spawn error and non-zero status, so an unresponsive git can never park
    // the settled turn — best-effort by construction (issue #182 F4).
    const warning = guards.dirtyWorktreeWarning(readGitStatusBounded(ctx.cwd));
    if (warning) ctx.ui.notify(warning, "warning");
  });
}

// Exported so the settings console (P4) names the same command without relisting it.
export { SETTINGS_COMMAND };
void thinkingLevelsInSyncWithPi;
