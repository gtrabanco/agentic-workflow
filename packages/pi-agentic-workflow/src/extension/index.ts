import { readFileSync, readdirSync, existsSync, lstatSync, readlinkSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getAgentDir, isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { SelectListTheme } from "@earendil-works/pi-tui";

import { loadConfig } from "../config/load.js";
import { evaluateToolCall, isProtectedPath, normalizeTarget } from "../config/path-policy.js";
import { THINKING_LEVELS } from "../config/types.js";
import { createExtension } from "./factory.js";
import type { CommandRegistrar } from "./factory.js";
import { readGitStatusBounded } from "./receipt-guard.js";
import type { InvocationContext, SettingsUi } from "../routing/types.js";
import { createPickerComponent, PICKER_MAX_VISIBLE, pagedSelect } from "../settings/picker.js";
import { createHintStore, createSerenaReadinessStore, stateFilePath } from "../routing/state.js";
import { createSerenaReadinessGate, readInitWorkspaceRevision } from "../routing/serena-readiness.js";
import { provisionEngram, readDeclaredServerNamesFrom, resolveEngramBinary, declaredMcpServerPaths } from "./engram.js";
import type { EngramServerConfig } from "./engram.js";
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

/**
 * Canonicalise an absolute target even when it does not exist yet. `realpathSync`
 * refuses a path whose final component is absent, so the longest existing prefix
 * is canonicalised and the missing tail re-appended; a symlink at the final
 * component is followed explicitly, because a write follows it even when its
 * destination is absent (F28). Resolution errors fail closed.
 */
function resolveRealTarget(target: string): { ok: true; real: string } | { ok: false; reason: string } {
  let current = target;
  for (let hops = 0; hops < 40; hops += 1) {
    let link: string | null = null;
    try {
      if (lstatSync(current).isSymbolicLink()) link = readlinkSync(current);
    } catch {
      // The path does not exist: canonicalise its longest existing prefix.
      return { ok: true, real: resolveExistingPrefix(current) };
    }
    if (link === null) {
      try {
        return { ok: true, real: realpathSync(current) };
      } catch (error) {
        return { ok: false, reason: error instanceof Error ? error.message : String(error) };
      }
    }
    current = isAbsolute(link) ? link : resolve(dirname(current), link);
  }
  return { ok: false, reason: "too many symbolic links" };
}

/** Canonicalise the longest existing prefix of `target` and re-append the missing tail. */
function resolveExistingPrefix(target: string): string {
  const tail: string[] = [];
  let current = target;
  for (;;) {
    try {
      const real = realpathSync(current);
      return tail.length === 0 ? real : join(real, ...tail.reverse());
    } catch {
      const parent = dirname(current);
      if (parent === current) return target;
      tail.push(basename(current));
      current = parent;
    }
  }
}

/**
 * Pi's MCP registrar, read structurally rather than imported: the package's
 * peer floor is a range, and a host older than `registerMcpServer` must degrade
 * (the provisioning module reports `unsupported-host`) instead of throwing at
 * load.
 */
function mcpRegistrar(pi: ExtensionAPI): ((name: string, config: EngramServerConfig) => void) | null {
  const candidate = (pi as unknown as { registerMcpServer?: unknown }).registerMcpServer;
  if (typeof candidate !== "function") return null;
  return (name, config) => {
    (candidate as (this: ExtensionAPI, n: string, c: EngramServerConfig) => void).call(pi, name, config);
  };
}

/**
 * The server names the operator already has declared — the set the anti-shadow
 * guard is judged against. Both surfaces are unioned: Pi's own `getMcpServers()`
 * (read structurally for the same peer-floor reason as the registrar; it is the
 * merged view the host applies), and the `mcp.json` files Pi reads for this
 * session, user file and trusted project file alike. Either one answering is
 * enough to refuse; reading only the user file was the F6 defect, which
 * registered over a project declaration and then reported precedence over a
 * file it had never opened.
 */
function declaredServerNames(pi: ExtensionAPI, agentDir: string, ctx: ExtensionContext): string[] {
  const names = new Set(readDeclaredServerNamesFrom(declaredMcpServerPaths({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() })));
  const candidate = (pi as unknown as { getMcpServers?: unknown }).getMcpServers;
  if (typeof candidate === "function") {
    try {
      const listed = (candidate as () => { name?: unknown }[]).call(pi);
      if (Array.isArray(listed)) {
        for (const server of listed) if (typeof server?.name === "string") names.add(server.name);
      }
    } catch {
      // A host that cannot answer is not a declaration: the file reads stand.
    }
  }
  return [...names];
}

export default function extension(pi: ExtensionAPI): void {
  const agentDir = getAgentDir();
  const hint = createHintStore({ path: stateFilePath(agentDir) });
  // One gate for both entry points (AC9): session start says it first, and a
  // session that begins by running a command says it there instead. The
  // revision is the bundled init-workspace's own, so an upgrade that ships a
  // newer provisioning contract can tell the operator the project predates it.
  const serenaReadiness = createSerenaReadinessGate({
    store: createSerenaReadinessStore({ path: stateFilePath(agentDir) }),
    revision: readInitWorkspaceRevision(skillsDir),
  });
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
    serenaReadiness,
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

  // One `session_start` listener carries both first chances, in this order.
  //
  // The readiness nudge (AC9) hears the session here, and the gate latches so
  // the command path never repeats it — soft by construction, because the gate
  // swallows a broken read and a failed latch.
  //
  // Memory substrate (feature 66, AC3) comes second: ask-first,
  // registrable-not-persisted. Registration runs on the session rather than at
  // load so an older Pi host is reported instead of throwing, and so the
  // operator reads back exactly what was written. Nothing is provisioned
  // without the `memory.engram` opt-in, and a config file that does not parse
  // is never read as one: its consent is unknown, and the refusal says so
  // instead of telling an opted-in operator to opt in.
  pi.on("session_start", (_event, ctx) => {
    const message = serenaReadiness.check(ctx.cwd);
    if (message) ctx.ui.notify(message, "warning");

    const projectTrusted = ctx.isProjectTrusted();
    const loaded = loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted });
    const report = provisionEngram({
      consented: loaded.config.memory?.engram === true,
      configInvalid: !loaded.ok,
      binaryPath: resolveEngramBinary(),
      declaredNames: declaredServerNames(pi, agentDir, ctx),
      register: mcpRegistrar(pi),
    });
    // The opt-out stays silent; every other outcome is stated once, in the
    // module's own words (it already says what was written, or why not).
    if (report.status !== "not-consented") {
      ctx.ui.notify(report.message, report.status === "registered" ? "info" : "warning");
    }
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
    let realRoot = ctx.cwd;
    try {
      realRoot = realpathSync(ctx.cwd);
    } catch {
      // ctx.cwd always exists; fall back to the lexical root.
    }
    // Canonicalise the target even when it does not exist yet, so the
    // containment check and the protected-glob match run on the same basis as
    // `realpathSync(ctx.cwd)` (F27) and a dangling symlink cannot route a write
    // outside the project root (F28).
    const resolvedTarget = resolveRealTarget(absolute);
    if (!resolvedTarget.ok) {
      return {
        block: true,
        reason:
          `"${targetPath}" could not be resolved (${resolvedTarget.reason}); ` +
          `path protection cannot verify it, so the write is blocked.`,
      };
    }
    const relativeTarget = normalizeTarget(relative(realRoot, resolvedTarget.real));
    // Fail closed on a target that escapes the project root: the policy is
    // repo-relative, so an out-of-root path cannot be verified (F7).
    if (relativeTarget === "" || relativeTarget === ".." || relativeTarget.startsWith("../") || isAbsolute(relativeTarget)) {
      return {
        block: true,
        reason:
          `"${targetPath}" resolves outside the project root (${ctx.cwd}); ` +
          `path protection cannot verify it, so the write is blocked.`,
      };
    }
    // Lazy: read the records corpus (every unit's decisions.md) only once the
    // target is a known existing protected path, never on every write/edit (F13).
    if (!existsSync(absolute)) return undefined;
    if (!isProtectedPath(loaded.config.pathProtection, relativeTarget)) return undefined;
    const decision = evaluateToolCall({
      toolName: event.toolName,
      targetPath: relativeTarget,
      targetExists: true,
      policy: loaded.config.pathProtection,
      recordsText: collectRecordTexts(ctx.cwd),
    });
    return decision.block ? { block: true, reason: decision.reason } : undefined;
  });
  pi.on("agent_settled", (event, ctx) => {
    // pi 1.1.0+: event may carry { aborted: true }
    const aborted = (event as unknown as Record<string, unknown>)?.aborted === true;
    void router.settle(toInvocationContext(ctx), aborted);
    // Terminal hygiene is said out loud once the turn is over; a clean tree
    // stays silent. The probe is time-bounded (2000 ms) and swallows timeout,
    // spawn error and non-zero status, so an unresponsive git can never park
    // the settled turn — best-effort by construction (issue #182 F4).
    // The dirty-worktree warning still fires on abort (an aborted run is exactly
    // when half-applied edits can be left behind).
    const warning = guards.dirtyWorktreeWarning(readGitStatusBounded(ctx.cwd));
    if (warning) ctx.ui.notify(warning, "warning");
  });
}

// Exported so the settings console (P4) names the same command without relisting it.
export { SETTINGS_COMMAND };
void thinkingLevelsInSyncWithPi;
