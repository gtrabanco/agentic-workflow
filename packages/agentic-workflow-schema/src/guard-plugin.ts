/**
 * The guard-plugin contract (issue #654): a project declares its own guards as
 * data, and the packages enforce the same declaration wherever a decision is
 * taken.
 *
 * One seam, two carriers. A declaration is a surface plus an ordered rule list;
 * `decideGuardPlugin` turns a (surface, value) request into `allow` / `ask` /
 * `deny`, or `defer` when the declaration has no opinion. Both enforcement
 * points read that one function:
 *
 *   * the permission layer's static policy — `renderGuardPluginPolicy` projects
 *     the deterministic declarations into the surface maps the plugin's own
 *     configuration publishes, where last matching rule wins;
 *   * the authorizer chain — a link registered for the same declaration answers
 *     the asks the static policy leaves open, and maps `ask` back to `defer`
 *     because the chain is only consulted for an ask in the first place.
 *
 * The contract names no model, no vendor and no host: a `model-backed` kind is a
 * declared slot for an adapter that arrives later, and the deterministic kind is
 * the one this package ships. Matching is deliberately small — `*` is the only
 * metacharacter, and it crosses path separators exactly as the permission
 * layer's own patterns do — so a rule means the same thing in both carriers.
 */

import { GUARD_MODES, type GuardMode } from "./config.js";
import {
  GUARD_PLUGIN_KINDS,
  GUARD_PLUGIN_SURFACES,
  type GuardPluginKind,
  type GuardPluginSurface,
} from "./vocabularies.js";

export const GUARD_PLUGIN_CONTRACT = "guard-plugin@1";

/** One rule: what it matches, what it answers, and why. */
export interface GuardPluginRule {
  match: string;
  verdict?: GuardMode;
  reason?: string;
}

/** One declared guard. */
export interface GuardPluginDeclaration {
  kind: GuardPluginKind;
  surface: GuardPluginSurface;
  rules: readonly GuardPluginRule[];
}

/** What a carrier asks the seam: which surface, and the value being decided. */
export interface GuardPluginRequest {
  surface: string;
  value: string;
}

/** `defer` is the seam's "no opinion"; the carriers map it to their own
 *  hand-off (the static policy's omitted rule, the chain's next link). */
export type GuardPluginVerdict = GuardMode | "defer";

export interface GuardPluginDecision {
  verdict: GuardPluginVerdict;
  /** 1-based index of the deciding rule; absent when the seam defers. */
  rule?: number;
  reason?: string;
  /** Filled by the chain: which declared guard decided. */
  guard?: string;
}

export interface GuardPluginIssue {
  path: string;
  message: string;
}

/** The declared guards, keyed by the name the chain registers. */
export type GuardPluginDeclarations = Record<string, GuardPluginDeclaration>;

/**
 * The matcher every carrier shares: `*` matches any run of characters (including
 * a path separator and a newline), every other character is literal, and the
 * pattern is anchored at both ends. No character classes, no braces, no
 * negation — a project that needs more writes a guard, not a regex.
 */
export function matchesGuardPattern(pattern: string, value: string): boolean {
  let source = "";
  for (const char of pattern) {
    source += char === "*" ? "[\\s\\S]*" : char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`, "u").test(value);
}

/**
 * The seam's one decision: the LAST matching rule wins, a rule with no verdict
 * asks, and a request this declaration does not cover defers.
 */
export function decideGuardPlugin(declaration: GuardPluginDeclaration, request: GuardPluginRequest): GuardPluginDecision {
  if (declaration.surface !== request.surface) return { verdict: "defer" };
  let decision: GuardPluginDecision = { verdict: "defer" };
  declaration.rules.forEach((rule, index) => {
    if (!matchesGuardPattern(rule.match, request.value)) return;
    decision = { verdict: rule.verdict ?? "ask", rule: index + 1 };
    if (rule.reason !== undefined) decision.reason = rule.reason;
  });
  return decision;
}

/**
 * The chain carrier: the first declaration (in configuration order) that does
 * not defer decides. Order is the configuration's, never registration order.
 */
export function decideGuardPluginChain(
  chain: readonly { name: string; declaration: GuardPluginDeclaration }[],
  request: GuardPluginRequest,
): GuardPluginDecision {
  for (const entry of chain) {
    const decision = decideGuardPlugin(entry.declaration, request);
    if (decision.verdict !== "defer") return { ...decision, guard: entry.name };
  }
  return { verdict: "defer" };
}

const SLUG = /^[a-z0-9][a-z0-9._-]*$/u;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function describe(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : JSON.stringify(value) ?? String(value);
}

/** Strict validator for one declared guard. Unknown keys are refused at their
 *  own path: a typo that resolved to a shipped default would leave an operator
 *  believing a rule runs. */
export function validateGuardPluginDeclaration(
  value: unknown,
  base = "$.guardPlugins.guards.<name>",
): { ok: true; declaration: GuardPluginDeclaration } | { ok: false; issues: GuardPluginIssue[] } {
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: base, message: `must be a JSON object, got ${describe(value)}` }] };
  }
  const issues: GuardPluginIssue[] = [];
  for (const key of Object.keys(value)) {
    if (key !== "kind" && key !== "surface" && key !== "rules") {
      issues.push({ path: `${base}.${key}`, message: `unknown guard key "${key}" (allowed: kind, surface, rules)` });
    }
  }
  if (!(GUARD_PLUGIN_KINDS as readonly unknown[]).includes(value.kind)) {
    issues.push({ path: `${base}.kind`, message: `must be one of ${GUARD_PLUGIN_KINDS.join(", ")}, got ${describe(value.kind)}` });
  }
  if (!(GUARD_PLUGIN_SURFACES as readonly unknown[]).includes(value.surface)) {
    issues.push({ path: `${base}.surface`, message: `must be one of ${GUARD_PLUGIN_SURFACES.join(", ")}, got ${describe(value.surface)}` });
  }
  const rules: GuardPluginRule[] = [];
  if (!Array.isArray(value.rules) || value.rules.length === 0) {
    issues.push({ path: `${base}.rules`, message: "must be a non-empty array of rules (a guard with no rule decides nothing)" });
  } else {
    value.rules.forEach((raw, index) => {
      const rule = validateRule(raw, `${base}.rules.${index + 1}`, issues);
      if (rule !== undefined) rules.push(rule);
    });
  }
  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, declaration: { kind: value.kind as GuardPluginKind, surface: value.surface as GuardPluginSurface, rules } };
}

function validateRule(value: unknown, path: string, issues: GuardPluginIssue[]): GuardPluginRule | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: `must be a JSON object with match, verdict and an optional reason, got ${describe(value)}` });
    return undefined;
  }
  let refused = false;
  for (const key of Object.keys(value)) {
    if (key !== "match" && key !== "verdict" && key !== "reason") {
      refused = true;
      issues.push({ path: `${path}.${key}`, message: `unknown rule key "${key}" (allowed: match, verdict, reason)` });
    }
  }
  if (typeof value.match !== "string" || value.match === "") {
    refused = true;
    issues.push({ path: `${path}.match`, message: `must be a non-empty pattern, got ${describe(value.match)}` });
  }
  if (value.verdict !== undefined && !(GUARD_MODES as readonly unknown[]).includes(value.verdict)) {
    refused = true;
    issues.push({ path: `${path}.verdict`, message: `must be one of ${GUARD_MODES.join(", ")}, got ${describe(value.verdict)}` });
  }
  if (value.reason !== undefined && (typeof value.reason !== "string" || value.reason === "")) {
    refused = true;
    issues.push({ path: `${path}.reason`, message: `must be a non-empty string, got ${describe(value.reason)}` });
  }
  if (refused) return undefined;
  const rule: GuardPluginRule = { match: value.match as string };
  if (value.verdict !== undefined) rule.verdict = value.verdict as GuardMode;
  if (value.reason !== undefined) rule.reason = value.reason as string;
  return rule;
}

/** Strict validator for the whole section: one optional switch and the guards. */
export function validateGuardPlugins(
  value: unknown,
  base = "$.guardPlugins",
): { ok: true; value: { enabled?: boolean; guards: GuardPluginDeclarations } } | { ok: false; issues: GuardPluginIssue[] } {
  if (!isRecord(value)) {
    return { ok: false, issues: [{ path: base, message: `must be a JSON object, got ${describe(value)}` }] };
  }
  const issues: GuardPluginIssue[] = [];
  for (const key of Object.keys(value)) {
    if (key !== "enabled" && key !== "guards") {
      issues.push({ path: `${base}.${key}`, message: `unknown guard key "${key}" (allowed: enabled, guards)` });
    }
  }
  const enabled = value.enabled;
  if (enabled !== undefined && typeof enabled !== "boolean") {
    issues.push({ path: `${base}.enabled`, message: `must be a boolean, got ${describe(enabled)}` });
  }
  const guards: GuardPluginDeclarations = {};
  if (value.guards !== undefined) {
    if (!isRecord(value.guards)) {
      issues.push({ path: `${base}.guards`, message: "must be an object mapping guard names to declarations" });
    } else {
      for (const [name, declaration] of Object.entries(value.guards)) {
        const path = `${base}.guards.${name}`;
        if (!SLUG.test(name)) {
          issues.push({ path, message: `guard name must be a lowercase slug (a-z, 0-9, . _ -), got "${name}"` });
          continue;
        }
        const result = validateGuardPluginDeclaration(declaration, path);
        if (result.ok) guards[name] = result.declaration;
        else issues.push(...result.issues);
      }
    }
  }
  if (issues.length > 0) return { ok: false, issues };
  const out: { enabled?: boolean; guards: GuardPluginDeclarations } = { guards };
  if (typeof enabled === "boolean") out.enabled = enabled;
  return { ok: true, value: out };
}

export interface GuardPluginProjectionResult {
  ok: boolean;
  permission: Record<string, Record<string, GuardMode>>;
  issues: GuardPluginIssue[];
}

/**
 * Project the deterministic declarations into the surface maps the permission
 * layer's configuration publishes. Declaration order is the order the plugin
 * evaluates, so a declared rule lands after the carrier's catch-alls and wins.
 *
 * Two guards disagreeing on the same rule is a configuration defect, never a
 * silent last-wins: the projection refuses and names both. A `model-backed`
 * guard contributes nothing here — a static policy holds no model.
 */
export function renderGuardPluginPolicy(guards: GuardPluginDeclarations): GuardPluginProjectionResult {
  const permission: Record<string, Record<string, GuardMode>> = {};
  const owners: Record<string, Record<string, string>> = {};
  const issues: GuardPluginIssue[] = [];
  for (const [name, declaration] of Object.entries(guards)) {
    if (declaration.kind !== "deterministic") continue;
    const surface = (permission[declaration.surface] ??= {});
    const surfaceOwners = (owners[declaration.surface] ??= {});
    declaration.rules.forEach((rule, index) => {
      const verdict = rule.verdict ?? "ask";
      const existing = surface[rule.match];
      if (existing !== undefined && existing !== verdict) {
        issues.push({
          path: `$.guardPlugins.guards.${name}.rules.${index + 1}`,
          message: `rule "${rule.match}" on ${declaration.surface} is declared as "${existing}" by ${surfaceOwners[rule.match]} and "${verdict}" by ${name}`,
        });
        return;
      }
      surface[rule.match] = verdict;
      surfaceOwners[rule.match] = name;
    });
  }
  return { ok: issues.length === 0, permission, issues };
}
