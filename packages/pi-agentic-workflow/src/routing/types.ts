import type { ThinkingLevel } from "../config/types.js";

/**
 * The command-surface vocabulary (SPEC "Command surface (api)").
 *
 * Each type here is a NARROWER view of Pi's own API, declared structurally so
 * the routing layer can be tested with plain objects instead of a live session.
 * The one Pi type the router must never touch is the model: Pi's `Model` carries
 * credentials and capability data the package has no business rebuilding, so the
 * router holds it as an opaque `M` and only ever passes back what it received —
 * which is why `setModel` needs no cast in the adapter.
 */

/** A routed slash command: the friendly name plus the canonical skill it runs. */
export interface WorkflowCommand {
  /** Slash name users type, without the leading slash. Equals the skill `name:`. */
  name: string;
  /** Bundled skill directory whose `SKILL.md` is expanded on dispatch. */
  skill: string;
  /** Frontmatter description, shown in Pi's command list. */
  description?: string;
}

/** The identity of a model — all this package reads off Pi's `Model`. */
export interface ModelRef {
  provider: string;
  id: string;
}

export const modelRefKey = (model: ModelRef): string => `${model.provider}/${model.id}`;

/** Model availability: the two questions AC9 asks before a route is applied. */
export interface ModelLookup<M extends ModelRef = ModelRef> {
  find(provider: string, modelId: string): M | undefined;
  hasConfiguredAuth(model: M): boolean;
}

/** The `ExtensionAPI` members that change or run the session. */
export interface ExtensionSurface<M extends ModelRef = ModelRef> {
  sendUserMessage(content: string, options?: { expandPromptTemplates?: boolean }): void;
  /** Resolve a model reference; false when it cannot be used or selected. */
  setModel(model: M): Promise<boolean>;
  getThinkingLevel(): ThinkingLevel;
  setThinkingLevel(level: ThinkingLevel): void;
}

/** The interactive slice of `ctx.ui` the settings console uses (AC10). */
export interface SettingsUi {
  select(title: string, options: readonly string[]): Promise<string | undefined> | string | undefined;
  input(title: string, placeholder?: string): Promise<string | undefined> | string | undefined;
  confirm(title: string, message: string): Promise<boolean> | boolean;
  notify(message: string, kind?: "info" | "warning" | "error"): void;
}

/**
 * Everything a command handler needs from the invocation, reduced to what we
 * read. `ModelLookup` is part of it because Pi exposes the registry through the
 * context, not through the API object.
 */
export interface InvocationContext<M extends ModelRef = ModelRef> extends ModelLookup<M> {
  readonly cwd: string;
  /** The session's current model, or undefined when none is selected. */
  readonly model: M | undefined;
  isIdle(): boolean;
  isProjectTrusted(): boolean;
  /** Pi's `ctx.ui.notify` — the only channel an extension has to the operator. */
  notify(message: string, kind?: "info" | "warning" | "error"): void;
  /** Pi's `ctx.ui`. Routing only notifies through it; the console also asks. */
  readonly ui: SettingsUi;
  /** Pi's `ctx.modelRegistry.getAll()` — what the console can offer to pick from. */
  availableModels(): readonly M[];
}

export type RefusalReason = "invalid-config" | "busy" | "routed-turn-in-flight" | "unavailable-route";

export type DispatchOutcome =
  | { status: "dispatched"; routed: boolean; hintShown: boolean }
  | { status: "refused"; reason: RefusalReason; message: string };

/** Slash name of the settings console (SPEC S4, AC3, AC10). */
export const SETTINGS_COMMAND = "agentic-workflow-settings";
