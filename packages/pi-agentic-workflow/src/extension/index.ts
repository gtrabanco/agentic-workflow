import { readFileSync, readdirSync, existsSync, lstatSync, readlinkSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { getAgentDir, isToolCallEventType } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import type { SelectListTheme } from "@earendil-works/pi-tui";

import { loadConfig } from "../config/load.js";
import { evaluateToolCall, isProtectedPath, normalizeTarget } from "../config/path-policy.js";
import { applyGitIdentityGuard, findGitConfigWrites, guardOptions, scratchDirs } from "../guards/git-identity.js";
import { createGitIdentityConsentStore, gitIdentityConsentPath } from "../guards/git-identity-consent.js";
import { THINKING_LEVELS } from "../config/types.js";
import { createExtension } from "./factory.js";
import type { CommandRegistrar } from "./factory.js";
import { readGitStatusBounded } from "./receipt-guard.js";
import type { InvocationContext, SettingsUi } from "../routing/types.js";
import { createPickerComponent, PICKER_MAX_VISIBLE, pagedSelect } from "../settings/picker.js";
import { createHintStore, createSerenaReadinessStore, stateFilePath } from "../routing/state.js";
import { createSerenaReadinessGate, readInitWorkspaceRevision } from "../routing/serena-readiness.js";
import { createTelemetryWiring, type TelemetryWiring } from "./telemetry-wiring.js";
import { createAutoLogSessionWiring, type AutoLogSessionWiring } from "./auto-log-session-wiring.js";
import { createStateFlowLifecycle, type StateFlowBackend, type StateFlowLifecycle } from "../stateflow/lifecycle.js";
import { createHooksWiring } from "./hooks-wiring.js";
import type { HooksContext } from "./hooks-wiring.js";
import { createInvocationWatch } from "./log-session-command.js";
import { provisionEngram, readDeclaredServerNamesFrom, readInstalledPackageSourcesFrom, isNativeEngramPackage, piSettingsPaths, resolveEngramBinary, declaredMcpServerPaths } from "./engram.js";
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
    // Issue #429: the invocation record is keyed by the id the host names, read
    // defensively — a host that names none is the declared fallback the core
    // states, never an id this adapter invents.
    sessionId: sessionIdOf(ctx),
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

/**
 * The session id Pi hands a context, or undefined. Read structurally: the peer
 * floor is a range, and a context without a session manager is a caller that
 * named no id rather than a fault to throw on.
 */
function sessionIdOf(ctx: ExtensionContext): string | undefined {
  const id = (ctx.sessionManager as unknown as { getSessionId?: () => unknown } | undefined)?.getSessionId?.();
  return typeof id === "string" && id !== "" ? id : undefined;
}

/** Issue #174 — the backend's two mode commands, as 0.27.x registers them. */
const STATE_FLOW_START_COMMAND = "state-flow-active";
const STATE_FLOW_STOP_COMMAND = "state-flow-off";

/**
 * The shipped State Flow backend over Pi's documented API (issue #174, PE-002,
 * PE-003). Detection reads the session's command list and fails closed on the
 * mode **pair**: dispatching a mode command the session does not have would
 * fall through `prompt()` to the model as a literal prompt, so half a backend
 * counts as no backend. The mode switches are extension-command dispatches,
 * which Pi executes immediately and without starting a turn.
 */
function createStateFlowBackend(pi: ExtensionAPI): StateFlowBackend {
  const hasCommand = (name: string): boolean => {
    try {
      if (typeof pi.getCommands !== "function") return false;
      return pi.getCommands().some((command) => command.name === name && command.source === "extension");
    } catch {
      // A host that cannot name its commands cannot promise the dispatch lands:
      // fail closed to "backend missing".
      return false;
    }
  };
  return {
    detect: () => hasCommand(STATE_FLOW_START_COMMAND) && hasCommand(STATE_FLOW_STOP_COMMAND),
    start: () => void pi.sendUserMessage(`/${STATE_FLOW_START_COMMAND}`, { expandPromptTemplates: true }),
    stop: () => void pi.sendUserMessage(`/${STATE_FLOW_STOP_COMMAND}`, { expandPromptTemplates: true }),
  };
}

function toRegistrar(pi: ExtensionAPI, noteCommand: (name: string, args: readonly string[]) => void): CommandRegistrar<PiModel> {
  return {
    registerCommand: (name, options) =>
      pi.registerCommand(name, {
        ...(options.description ? { description: options.description } : {}),
        handler: async (args, ctx) => {
          // Issue #383: the session learns which unit it is working on from the
          // command that names it, never from a model's claim.
          noteCommand(name, String(args ?? "").split(/\s+/).filter(Boolean));
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

/**
 * Pi's tool registrar, read structurally like `registerMcpServer` above: the
 * peer floor is a range and a partial host (or a test double) that names no
 * `registerTool` registers no tools — real pi ≥ 0.99 always does (issue #274).
 */
function toolRegistrar(pi: ExtensionAPI): { registerTool(tool: unknown): void } | null {
  const candidate = (pi as unknown as { registerTool?: unknown }).registerTool;
  if (typeof candidate !== "function") return null;
  return {
    registerTool: (tool) => {
      (candidate as (this: ExtensionAPI, t: unknown) => void).call(pi, tool);
    },
  };
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
  // Issue #383 — the session accumulator. Pi builds a fresh extension instance
  // per session (its runtime factory rebuilds the services, and the resource
  // loader re-runs every factory), so one instance owns one session's sample.
  let telemetry: TelemetryWiring | null = null;
  // Issue #394 — the journal writer, a second and independent wiring (S4):
  // turning the log off never stops the measurement, and turning telemetry off
  // never costs the entry. Nothing is registered while the switch says `off`.
  let autoLog: AutoLogSessionWiring | null = null;
  // Issue #429 — the settled turn's memory of this session's `/log-session`
  // invocations. It owes nothing to the two switches above: a session that
  // recorded an invocation and wrote no entry says so once, whatever the config
  // says about telemetry or the mechanical journal.
  const invocations = createInvocationWatch();
  const noteCommand = (name: string, args: readonly string[]): void => telemetry?.noteCommand(name, args);
  // Issue #413 — the seam-hooks dispatcher: consent-gated, opt-in per seam, off
  // by default, so the wiring itself is inert until init-workspace consent and
  // a declared `enabled` group both exist. The narrow context is built per
  // call: the dispatcher never holds a session-bound object.
  const hooksWiring = createHooksWiring({ agentDir });
  // Issue #514 — the git identity guard's persisted approvals: one file of its
  // own beside the config, never inside it (writing state must not rewrite
  // configuration).
  const gitIdentityConsent = createGitIdentityConsentStore({ path: gitIdentityConsentPath(agentDir) });
  const toHooksContext = (ctx: ExtensionContext): HooksContext => ({
    cwd: ctx.cwd,
    isProjectTrusted: () => ctx.isProjectTrusted(),
    ui: { notify: (message, kind) => ctx.ui.notify(message, kind) },
  });

  // Issue #174: one lifecycle per session — its ownership flag must not leak
  // across sessions, so it is built where the session-bound `pi` is in scope.
  const stateFlow: StateFlowLifecycle = createStateFlowLifecycle(createStateFlowBackend(pi));

  const { router, guards } = createExtension<PiModel>({
    registrar: toRegistrar(pi, noteCommand),
    // Issue #274: the deferred workflow tools register alongside the commands,
    // through the one structural read above — absent on a host without the API.
    toolRegistrar: toolRegistrar(pi) ?? undefined,
    // Issue #174: the episode lifecycle, bound to the shipped backend.
    stateFlow,
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

    // Issue #413 — the seam-hooks session:start seam. Inert until consent + an
    // `enabled` group exist; a broken hook config is announced here (latched)
    // and then behaves as the declared no-op.
    void hooksWiring.onSessionStart(toHooksContext(ctx));

    const projectTrusted = ctx.isProjectTrusted();
    const loaded = loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted });
    if (loaded.config.telemetry?.enabled === true && telemetry === null) {
      // The id is read once, here: pi invalidates a captured context after the
      // session is replaced, and one extension instance serves one session.
      const sessionId = ctx.sessionManager.getSessionId();
      telemetry = createTelemetryWiring({ root: ctx.cwd, enabled: true, sessionId: () => sessionId });
      telemetry.register(pi);
    }
    // Issue #394 — the same first chance, a separate switch: `off` registers no
    // listener at all, and an opted-in project gets the journal writer whether
    // or not telemetry is enabled (S1, S4).
    if (loaded.config.logSession.enabled && autoLog === null) {
      autoLog = createAutoLogSessionWiring({
        root: ctx.cwd,
        enabled: loaded.config.logSession.enabled,
        publisher: loaded.config.logSession.publisher,
      });
      autoLog.register(pi);
    }
    const report = provisionEngram({
      consented: loaded.config.memory?.engram === true,
      configInvalid: !loaded.ok,
      binaryPath: resolveEngramBinary(),
      // Issue #531 — the native gentle-engram package already provides the
      // mem_* tools, so the MCP path registers nothing beside it; a set
      // ENGRAM_URL names an externally managed server and is reported as a
      // deliberate choice, not a missing binary. Pi reads the package list from
      // the user settings file and, for a trusted project, `<cwd>/.pi`.
      nativePackagePresent: isNativeEngramPackage(
        readInstalledPackageSourcesFrom(piSettingsPaths({ agentDir, cwd: ctx.cwd, projectTrusted })),
      ),
      engramUrl: process.env.ENGRAM_URL ?? null,
      // Issue #538 S7 — the override is the evidence that separates "absent"
      // from "unresolvable" when the binary does not resolve.
      engramBin: process.env.ENGRAM_BIN ?? null,
      declaredNames: declaredServerNames(pi, agentDir, ctx),
      register: mcpRegistrar(pi),
    });
    // Issue #538 — the report is a consent × runtime-health state machine: a
    // healthy opted-in install says nothing, a broken one says once what failed
    // and how to repair it, and the opt-out says nothing at all. The level is
    // the module's `notice` (it decides the outcome, so it decides how loudly
    // the outcome is delivered); the adapter only renders it.
    if (report.notice !== "silent") ctx.ui.notify(report.message, report.notice);
  });
  pi.on("model_select", (event) => router.noteModelSelect(event.model));
  pi.on("thinking_level_select", (event) => router.noteThinkingLevelSelect(event.level));
  // Issue #413 — the seam-hooks session:end seam, at the session shutdown the
  // host reports (PE-001). A hook's block cannot undo a closing session, so
  // the wiring reports instead of blocking — inside its shutdown budget.
  // The promise is returned: pi awaits every `session_shutdown` handler before
  // teardown completes, so the seam's report lands before the process exits (N3).
  pi.on("session_shutdown", (_event, ctx) => hooksWiring.onSessionShutdown(toHooksContext(ctx)));
  // The inline-receipt path is impossible: a `gh pr comment` carrying a
  // REVIEW-PASS / merge-ready marker is blocked before it runs, and the reason
  // names the script that proves the receipt landed (issue #182). The guard
  // itself filters to `bash`, so every tool call is checked — nesting it under
  // one tool name would make the block unreachable for the calls it exists for.
  pi.on("tool_call", async (event, ctx) => {
    const command = "command" in event.input && typeof event.input.command === "string" ? event.input.command : undefined;
    const receipt = guards.receiptGuard({ toolName: event.toolName, command });
    if (receipt.block) return receipt;
    // Issue #514 — the agent-side git identity guard (Layer 1). Only a command
    // that actually performs a `git config` write pays for the config read; a
    // read-only or `-c` invocation is allowed by the parse alone.
    if (event.toolName === "bash" && typeof command === "string" && findGitConfigWrites(command).length > 0) {
      const loaded = loadConfig({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted() });
      const identity = await applyGitIdentityGuard(
        command,
        guardOptions(loaded.config.gitIdentity, ctx.cwd, scratchDirs()),
        {
          // A session with no UI cannot ask, so it blocks: an unanswered prompt
          // is not consent, and guessing one is how attribution was lost before.
          interactive: ctx.hasUI === true,
          approved: (key) => gitIdentityConsent.approved(ctx.cwd, key),
          remember: (key) => gitIdentityConsent.remember(ctx.cwd, key),
          confirm: (question) => ctx.ui.confirm("git identity guard", question),
          notify: (message, kind) => ctx.ui.notify(message, kind),
        },
      );
      if (identity.block) return identity;
    }
    // Issue #413 — the pre:commit / pre:push seams: a bash `git commit` or
    // `git push` first runs the project's declared, consented, enabled checks,
    // and a failing check blocks the tool call with the requirement quoted.
    // A bash call never reaches the write/edit prevention below, so the seam
    // result is the handler's result.
    if (event.toolName === "bash" && typeof command === "string" && command !== "") {
      return hooksWiring.onToolCall({ toolName: event.toolName, input: { command } }, toHooksContext(ctx));
    }
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
  // Issue #413 — the post:commit seam: a `git commit` that already ran lets
  // its declared post-seam checks report; a failure cannot block retroactively,
  // so it arrives as a warning notice (declared, never silent).
  pi.on("tool_result", (event, ctx) => {
    const command = typeof event.input?.command === "string" ? event.input.command : undefined;
    if (event.toolName !== "bash" || command === undefined) return undefined;
    void hooksWiring.onToolResult({ toolName: event.toolName, input: { command }, isError: event.isError }, toHooksContext(ctx));
    return undefined;
  });
  pi.on("agent_settled", (event, ctx) => {
    // pi 1.1.0+: event may carry { aborted: true }
    const aborted = (event as unknown as Record<string, unknown>)?.aborted === true;
    void router.settle(toInvocationContext(ctx), aborted);
    // Issue #174: the episode lifecycle settles on the same event — the stop
    // is dispatched through `sendUserMessage`, which Pi defers while the
    // settled actions drain, so it lands right after the restore and an abort
    // still clears the package-owned episode.
    void stateFlow.settle(aborted);
    // Terminal hygiene is said out loud once the turn is over; a clean tree
    // stays silent. The probe is time-bounded (2000 ms) and swallows timeout,
    // spawn error and non-zero status, so an unresponsive git can never park
    // the settled turn — best-effort by construction (issue #182 F4).
    // The dirty-worktree warning still fires on abort (an aborted run is exactly
    // when half-applied edits can be left behind).
    const warning = guards.dirtyWorktreeWarning(readGitStatusBounded(ctx.cwd));
    if (warning) ctx.ui.notify(warning, "warning");
    // The second settled-turn notice (issue #429): a session that invoked
    // `/log-session` and left no entry is never allowed to end in silence. The
    // check is a file read of this session's own record — no git, no spawn, no
    // state for another session.
    const missed = invocations.check(ctx.cwd, sessionIdOf(ctx));
    if (missed) ctx.ui.notify(missed, "warning");
  });
}

// Exported so the settings console (P4) names the same command without relisting it.
export { SETTINGS_COMMAND };
void thinkingLevelsInSyncWithPi;
