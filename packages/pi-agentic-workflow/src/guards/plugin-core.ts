/**
 * The guard-plugin seam as the runtime uses it (issue #654).
 *
 * A project's guards are declared in `pi-agentic-workflow.json`; this module
 * turns each deterministic declaration into an authorizer link the permission
 * layer consults when its static policy leaves a request to `ask`. Two facts keep
 * the seam honest:
 *
 *   * the chain is consulted ONLY for an ask, so a link answers `allow`, `deny`
 *     or `defer` — a declared `ask` rule defers to the interactive prompt, which
 *     is the same observable outcome;
 *   * the seam names no model and no vendor. A `model-backed` declaration is a
 *     slot a kind handler fills later (a case-by-case reviewer, #444); without a
 *     handler it registers nothing and says so, rather than pretending.
 *
 * The permission package is an operator-level Pi package, never a dependency of
 * this one: the service arrives through an injected loader, absence is a
 * declared skip, and nothing here imports a vendor module statically.
 */

import {
  decideGuardPlugin,
  type GuardPluginDeclaration,
  type GuardPluginDeclarations,
  type GuardPluginRequest,
  type GuardPluginVerdict,
} from "@gtrabanco/agentic-workflow-schema";

import type { GuardPluginsConfig } from "../config/types.js";

/** The operator-level package that owns the permission surfaces. */
export const PERMISSION_PACKAGE = "@gotgenes/pi-permission-system";

/** What a link may answer. `defer` hands the ask to the next link or the prompt. */
export interface GuardPluginLinkAnswer {
  verdict: "allow" | "deny" | "defer";
  reason?: string;
}

/** What a kind handler answers: a verdict and, when it has one, the reason. */
export interface GuardPluginKindAnswer {
  verdict: GuardPluginVerdict;
  reason?: string;
}

/**
 * A kind's implementation. `deterministic` is the one shipped here; a
 * model-backed adapter supplies its own without touching the declaration, the
 * configuration or the chain.
 */
export type GuardPluginKindHandler = (
  declaration: GuardPluginDeclaration,
  request: GuardPluginRequest,
) => GuardPluginKindAnswer | Promise<GuardPluginKindAnswer>;

/** The one kind this package implements: the published decision function. */
export const DETERMINISTIC_KIND_HANDLER: GuardPluginKindHandler = decideGuardPlugin;

export const DEFAULT_GUARD_PLUGIN_KINDS: Readonly<Record<string, GuardPluginKindHandler>> = Object.freeze({
  deterministic: DETERMINISTIC_KIND_HANDLER,
});

/** The authorizer a permission service exposes, read structurally. */
export interface GuardPluginAuthorizer {
  registerAuthorizer(name: string, authorize: (ask: unknown, query?: unknown) => Promise<GuardPluginLinkAnswer>): (() => void) | void;
}

/** The service accessor the permission package publishes, read structurally. */
export interface GuardPluginService {
  getPermissionsService(sessionId: string): GuardPluginAuthorizer | undefined;
}

export interface GuardPluginLink {
  name: string;
  authorize: (ask: unknown) => Promise<GuardPluginLinkAnswer>;
}

export interface GuardPluginSkip {
  name: string;
  reason: "model-backed-unavailable" | "guard-unavailable" | "session-unavailable";
}

/**
 * Read a permission layer's ask as the seam's own request — the one joint this
 * package does not own. `accessIntent` is the published field that carries the
 * gate's surface; the value rides beside it or on the ask itself. A payload this
 * reader cannot resolve returns `null`, and the link defers: a shape this package
 * does not know is never guessed into a decision.
 */
export function normalizeAuthorizerAsk(ask: unknown): GuardPluginRequest | null {
  if (typeof ask !== "object" || ask === null) return null;
  const envelope = ask as Record<string, unknown>;
  const intent = envelope.accessIntent;
  if (typeof intent !== "object" || intent === null) return null;
  const surface = (intent as Record<string, unknown>).surface;
  if (typeof surface !== "string" || surface === "") return null;
  const candidates = [
    (intent as Record<string, unknown>).value,
    (intent as Record<string, unknown>).pattern,
    (intent as Record<string, unknown>).path,
    (intent as Record<string, unknown>).command,
    envelope.value,
    envelope.path,
    envelope.command,
  ];
  const value = candidates.find((candidate) => typeof candidate === "string" && candidate !== "");
  if (typeof value !== "string") return null;
  return { surface, value };
}

/** Map a decision to what a chain link may answer. */
function toLinkAnswer(verdict: GuardPluginVerdict, reason?: string): GuardPluginLinkAnswer {
  if (verdict === "allow" || verdict === "deny") {
    return reason === undefined ? { verdict } : { verdict, reason };
  }
  // `ask` defers on purpose: the chain is only consulted for an ask, so leaving
  // the decision to the terminal prompt keeps the observable outcome identical.
  return { verdict: "defer" };
}

/**
 * Build one link per declared guard whose kind has a handler. A declaration
 * whose kind has none is reported, never silently dropped.
 */
export function buildGuardPluginLinks(input: {
  guards: GuardPluginDeclarations;
  kinds?: Readonly<Record<string, GuardPluginKindHandler>>;
}): { links: GuardPluginLink[]; skipped: GuardPluginSkip[] } {
  const kinds = input.kinds ?? DEFAULT_GUARD_PLUGIN_KINDS;
  const links: GuardPluginLink[] = [];
  const skipped: GuardPluginSkip[] = [];
  for (const [name, declaration] of Object.entries(input.guards)) {
    const handler = kinds[declaration.kind];
    if (handler === undefined) {
      skipped.push({ name, reason: "model-backed-unavailable" });
      continue;
    }
    links.push({
      name,
      authorize: async (ask: unknown): Promise<GuardPluginLinkAnswer> => {
        const request = normalizeAuthorizerAsk(ask);
        if (request === null) return { verdict: "defer" };
        const answer = await handler(declaration, request);
        return toLinkAnswer(answer.verdict, answer.reason);
      },
    });
  }
  return { links, skipped };
}

/**
 * Register the links on a permission service. Declaration order fixes the order
 * the links are registered in, and the disposers come back so a caller can undo
 * them when the session ends.
 */
export function registerGuardPluginLinks(input: {
  guards: GuardPluginDeclarations;
  authorizer: GuardPluginAuthorizer;
  kinds?: Readonly<Record<string, GuardPluginKindHandler>>;
}): { registered: string[]; skipped: GuardPluginSkip[]; disposers: (() => void)[] } {
  const { links, skipped } = buildGuardPluginLinks({ guards: input.guards, kinds: input.kinds });
  const registered: string[] = [];
  const disposers: (() => void)[] = [];
  for (const link of links) {
    const disposer = input.authorizer.registerAuthorizer(link.name, link.authorize);
    registered.push(link.name);
    if (typeof disposer === "function") disposers.push(disposer);
  }
  return { registered, skipped, disposers };
}

/**
 * Load the permission package's service accessor. The package is optional by
 * design: an absent module, a module with no accessor, or a loader that throws
 * all answer `null`, and the caller reports a declared skip instead of failing.
 */
export async function loadPermissionService(specifier: string = PERMISSION_PACKAGE): Promise<GuardPluginService | null> {
  try {
    const loaded: unknown = await import(specifier);
    if (typeof loaded !== "object" || loaded === null) return null;
    const accessor = (loaded as Record<string, unknown>).getPermissionsService;
    if (typeof accessor !== "function") return null;
    return { getPermissionsService: (sessionId: string) => (accessor as (id: string) => GuardPluginAuthorizer | undefined)(sessionId) };
  } catch {
    return null;
  }
}

export interface GuardPluginStartResult {
  registered: string[];
  skipped: GuardPluginSkip[];
}

export interface GuardPluginStartDeps {
  config: GuardPluginsConfig;
  sessionId: string | undefined;
  loadService?: () => Promise<GuardPluginService | null>;
  notify?: (message: string, kind: "warning") => void;
  kinds?: Readonly<Record<string, GuardPluginKindHandler>>;
}

/**
 * Start the declared guards for one session. The declared degradation is the
 * point: a project that declared guards and a machine that cannot enforce them is
 * told once, with the install command — never a silent no-op, and never a
 * behaviour change to a call this layer did not decide.
 */
export async function startGuardPlugins(deps: GuardPluginStartDeps): Promise<GuardPluginStartResult> {
  const names = Object.keys(deps.config.guards ?? {});
  if (deps.config.enabled !== true || names.length === 0) return { registered: [], skipped: [] };

  const service = await (deps.loadService ?? (() => loadPermissionService()))();
  if (service === null) {
    const skipped = names.map((name) => ({ name, reason: "guard-unavailable" as const }));
    deps.notify?.(
      `pi-agentic-workflow: ${names.length} declared guard(s) are not enforced because ${PERMISSION_PACKAGE} is not installed; install it with \`pi install npm:${PERMISSION_PACKAGE}\`.`,
      "warning",
    );
    return { registered: [], skipped };
  }
  if (deps.sessionId === undefined) {
    const skipped = names.map((name) => ({ name, reason: "session-unavailable" as const }));
    deps.notify?.(
      `pi-agentic-workflow: the session has no id, so ${names.length} declared guard(s) are not registered with ${PERMISSION_PACKAGE}.`,
      "warning",
    );
    return { registered: [], skipped };
  }

  const authorizer = service.getPermissionsService(deps.sessionId);
  if (authorizer === undefined) {
    const skipped = names.map((name) => ({ name, reason: "guard-unavailable" as const }));
    deps.notify?.(`pi-agentic-workflow: ${PERMISSION_PACKAGE} reported no permission service for this session.`, "warning");
    return { registered: [], skipped };
  }

  const { registered, skipped } = registerGuardPluginLinks({ guards: deps.config.guards, authorizer, kinds: deps.kinds });
  if (skipped.length > 0) {
    deps.notify?.(
      `pi-agentic-workflow: ${skipped.map((entry) => entry.name).join(", ")} declared a guard kind with no adapter yet, so it is not enforced.`,
      "warning",
    );
  }
  return { registered, skipped };
}
