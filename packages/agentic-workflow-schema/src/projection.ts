/**
 * The workflow-projection contract (issue #406) — types and validation only.
 *
 * One home for the grammar four planned units consume, so none of them
 * renegotiates it: the pi-bundle stripper (#410), the in-process guards (#412),
 * the seam-hooks dispatcher (#413) and the prereq injection (#414).
 *
 *   - `projection-manifest@1` is a rule list. A rule names an op
 *     (`remove | pointerize | prereq`), a repo-relative source, a selector that
 *     is the JSON object form of the shipped section locator's `SectionSelector`
 *     (`packages/agentic-workflow/src/doc/section-locator.mjs`, issue #407), the
 *     command that enforces the removed prose, and a `sha256:<64 hex>` digest of
 *     the exact UTF-8 bytes the rule removes. A `remove` rule may carry an
 *     `except` keep-list of child heading paths (#410's except-child form).
 *   - `guard-verdict@1` is the fail-closed rejection message contract: a guard
 *     answers `allow | block | degrade`; a rejection carries a reason from the
 *     closed set, the requirement it enforces, the enforcing command and a
 *     teaching message. `degrade` names its declared fallback, so a guard that
 *     cannot run never becomes a silent pass.
 *
 * Structural checks appear here and in the two published Draft-07 projections
 * (`projection-manifest.schema.json`, `guard-verdict.schema.json`); the suite
 * beside this file runs one fixture matrix through both, so the duplication
 * cannot drift. Semantic checks a Draft-07 schema cannot state — a regex that
 * does not compile, and the zero-or-many selector resolution the locator owns —
 * live only here and in the runtime consumer.
 *
 * Deterministic and dependency-free: no clock, no I/O, no imports outside this
 * package.
 */

import {
  GUARD_REJECTION_REASONS,
  GUARD_VERDICTS,
  PROJECTION_HASH_ALGORITHMS,
  PROJECTION_OPS,
  PROJECTION_SEAMS,
  PROJECTION_SELECTOR_KINDS,
  type GuardRejectionReason,
  type GuardVerdictKind,
  type ProjectionOp,
  type ProjectionSeam,
  type ProjectionSelectorKind,
} from "./vocabularies.js";

export const PROJECTION_MANIFEST_CONTRACT_ID = "agentic-workflow/projection-manifest" as const;
export const PROJECTION_MANIFEST_VERSION = 1 as const;
export const GUARD_VERDICT_CONTRACT_ID = "agentic-workflow/guard-verdict" as const;
export const GUARD_VERDICT_VERSION = 1 as const;

/** `sha256:<64 lowercase hex>` — derived from the published algorithm set so a
 *  second algorithm cannot ship without this pattern and the schema moving. */
export const PROJECTION_CONTENT_HASH_PATTERN = new RegExp(
  `^(${PROJECTION_HASH_ALGORITHMS.join("|")}):[0-9a-f]{64}$`,
);

/** A regular expression carried as data (the locator's own JSON form). */
export interface RegexSourceV1 {
  readonly source: string;
  readonly flags?: string;
}

/** One root heading, matched by its exact title. */
export interface ProjectionHeadingSelector {
  readonly heading: string;
}

/** A depth-aware heading path; the section ends at the next heading of depth
 *  lower than or equal to its own (issue #407's path selector). */
export interface ProjectionPathSelector {
  readonly path: readonly string[];
}

/** A root heading matched by a regular expression. */
export interface ProjectionHeadingRegexSelector {
  readonly headingRegex: RegexSourceV1;
}

/** A whole-line match — exact text or a regex — optionally scoped to a section:
 *  the "line-in-scope" form. `within` is never another line selector. */
export interface ProjectionLineSelector {
  readonly line: string | RegexSourceV1;
  readonly within?: ProjectionSelector | null;
}

/** The four selector forms a manifest rule may carry, exactly one per rule. */
export type ProjectionSelector =
  | ProjectionHeadingSelector
  | ProjectionPathSelector
  | ProjectionHeadingRegexSelector
  | ProjectionLineSelector;

/** One projection rule. */
export interface ProjectionRule {
  /** Stable kebab-case identity, unique in the manifest. */
  readonly id: string;
  readonly op: ProjectionOp;
  /** Repo-relative path of the source document the rule reads. */
  readonly source: string;
  readonly selector: ProjectionSelector;
  /** Child heading paths kept when a `remove` takes their parent. `remove` only. */
  readonly except?: readonly (readonly string[])[];
  /** The command the pointer names and, for `prereq`, the command pre-run. */
  readonly enforcingCommand: string;
  /** `sha256:<64 hex>` over the exact UTF-8 bytes the rule removes. */
  readonly contentHash: string;
}

/** The projection manifest, version 1. An empty `rules` list is the legal no-op
 *  the stripper ships first (#410). */
export interface ProjectionManifestV1 {
  readonly contract: typeof PROJECTION_MANIFEST_CONTRACT_ID;
  readonly version: typeof PROJECTION_MANIFEST_VERSION;
  readonly rules: readonly ProjectionRule[];
}

export type ProjectionManifestValidation =
  | { ok: true; manifest: ProjectionManifestV1 }
  | { ok: false; errors: string[] };

/** A guard's allow verdict: nothing to teach, nothing to carry. */
export interface GuardAllowVerdict {
  readonly contract: typeof GUARD_VERDICT_CONTRACT_ID;
  readonly version: typeof GUARD_VERDICT_VERSION;
  readonly guard: string;
  readonly verdict: "allow";
}

/** A guard's rejection: fail-closed, with the requirement and the command that
 *  enforces it, so the message re-teaches the rule at the point of failure. */
export interface GuardBlockVerdict {
  readonly contract: typeof GUARD_VERDICT_CONTRACT_ID;
  readonly version: typeof GUARD_VERDICT_VERSION;
  readonly guard: string;
  readonly verdict: "block";
  readonly reason: GuardRejectionReason;
  readonly requirement: string;
  readonly enforcingCommand: string;
  readonly message: string;
}

/** A declared degradation: the guard could not run and names what to do instead
 *  — never a silent pass. */
export interface GuardDegradeVerdict {
  readonly contract: typeof GUARD_VERDICT_CONTRACT_ID;
  readonly version: typeof GUARD_VERDICT_VERSION;
  readonly guard: string;
  readonly verdict: "degrade";
  readonly reason: GuardRejectionReason;
  readonly message: string;
  readonly requirement?: string;
  readonly enforcingCommand?: string;
}

export type GuardVerdictV1 = GuardAllowVerdict | GuardBlockVerdict | GuardDegradeVerdict;

export type GuardVerdictValidation =
  | { ok: true; verdict: GuardVerdictV1 }
  | { ok: false; errors: string[] };

const RULE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const MANIFEST_KEYS = ["contract", "version", "rules"] as const;
const RULE_KEYS = ["id", "op", "source", "selector", "except", "enforcingCommand", "contentHash"] as const;
const VERDICT_KEYS = ["contract", "version", "guard", "verdict", "reason", "requirement", "enforcingCommand", "message"] as const;
const REJECTION_KEYS = ["reason", "requirement", "enforcingCommand", "message"] as const;

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function unknownKeys(value: Record<string, unknown>, allowed: readonly string[], path: string, errors: string[]): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${path} has an unknown key: ${key}`);
  }
}

function validateRegexSource(value: unknown, path: string, errors: string[]): void {
  if (!isObj(value)) {
    errors.push(`${path} must be a regular expression in its JSON form {source, flags}`);
    return;
  }
  unknownKeys(value, ["source", "flags"], path, errors);
  if (!isNonEmptyString(value.source)) {
    errors.push(`${path}.source must be a non-empty regular expression`);
    return;
  }
  const flags = value.flags ?? "";
  if (typeof flags !== "string") {
    errors.push(`${path}.flags must be a string`);
    return;
  }
  try {
    new RegExp(value.source, flags);
  } catch (error) {
    errors.push(`${path} is not a valid regular expression: ${(error as Error).message}`);
  }
}

function validateSelector(value: unknown, path: string, errors: string[]): void {
  if (!isObj(value)) {
    errors.push(`${path} must be a selector object carrying exactly one of ${PROJECTION_SELECTOR_KINDS.join(", ")}`);
    return;
  }
  unknownKeys(value, [...PROJECTION_SELECTOR_KINDS, "within"], path, errors);
  const forms = PROJECTION_SELECTOR_KINDS.filter((kind) => Object.prototype.hasOwnProperty.call(value, kind));
  if (forms.length !== 1) {
    errors.push(`${path} must carry exactly one of ${PROJECTION_SELECTOR_KINDS.join(", ")} (got: ${forms.length})`);
    return;
  }
  const form = forms[0] as ProjectionSelectorKind;
  if (form !== "line" && Object.prototype.hasOwnProperty.call(value, "within")) {
    errors.push(`${path}: within only scopes a line selector`);
  }
  if (form === "heading") {
    if (!isNonEmptyString(value.heading)) errors.push(`${path}.heading must be a non-empty heading title`);
    return;
  }
  if (form === "path") {
    if (!Array.isArray(value.path) || value.path.length === 0) {
      errors.push(`${path}.path must be a non-empty array of heading titles`);
      return;
    }
    value.path.forEach((title, index) => {
      if (!isNonEmptyString(title)) errors.push(`${path}.path[${index}] must be a non-empty heading title`);
    });
    return;
  }
  if (form === "headingRegex") {
    validateRegexSource(value.headingRegex, `${path}.headingRegex`, errors);
    return;
  }
  if (typeof value.line !== "string") validateRegexSource(value.line, `${path}.line`, errors);
  const within = value.within;
  if (within === undefined || within === null) return;
  if (isObj(within) && Object.prototype.hasOwnProperty.call(within, "line")) {
    errors.push(`${path}.within must scope a line selector to a section, not to another line selector`);
    return;
  }
  validateSelector(within, `${path}.within`, errors);
}

function validateSource(value: unknown, path: string, errors: string[]): void {
  if (!isNonEmptyString(value)) {
    errors.push(`${path} must be a non-empty repo-relative path`);
    return;
  }
  if (value.startsWith("/") || /^[A-Za-z]:[\\/]/.test(value)) {
    errors.push(`${path} must be repo-relative, not absolute`);
    return;
  }
  if (value.split(/[\\/]/).includes("..")) errors.push(`${path} must not escape the repository with ..`);
}

function validateRule(value: unknown, path: string, errors: string[]): void {
  if (!isObj(value)) {
    errors.push(`${path} must be an object`);
    return;
  }
  unknownKeys(value, RULE_KEYS, path, errors);
  if (typeof value.id !== "string" || !RULE_ID_PATTERN.test(value.id)) {
    errors.push(`${path}.id must be kebab-case (got: ${String(value.id)})`);
  }
  if (!PROJECTION_OPS.includes(value.op as ProjectionOp)) {
    errors.push(`${path}.op must be one of ${PROJECTION_OPS.join("|")} (got: ${String(value.op)})`);
  }
  validateSource(value.source, `${path}.source`, errors);
  validateSelector(value.selector, `${path}.selector`, errors);
  if (value.except !== undefined) {
    if (value.op !== "remove") errors.push(`${path}: except is only legal on a remove rule`);
    if (!Array.isArray(value.except) || value.except.length === 0) {
      errors.push(`${path}.except must be a non-empty array of heading paths`);
    } else {
      value.except.forEach((headingPath, index) => {
        if (!Array.isArray(headingPath) || headingPath.length === 0) {
          errors.push(`${path}.except[${index}] must be a non-empty array of heading titles`);
          return;
        }
        headingPath.forEach((title, position) => {
          if (!isNonEmptyString(title)) errors.push(`${path}.except[${index}][${position}] must be a non-empty heading title`);
        });
      });
    }
  }
  if (!isNonEmptyString(value.enforcingCommand)) errors.push(`${path}.enforcingCommand must be a non-empty command`);
  if (typeof value.contentHash !== "string" || !PROJECTION_CONTENT_HASH_PATTERN.test(value.contentHash)) {
    errors.push(
      `${path}.contentHash must be ${PROJECTION_HASH_ALGORITHMS[0]}:<64 lowercase hex> over the removed bytes (got: ${String(value.contentHash)})`,
    );
  }
}

/** Validate a projection manifest. Structural only: whether a selector resolves
 *  to exactly one section is the locator's runtime answer (issue #407), and
 *  whether the digest matches the bytes is the stripper's (#410). */
export function validateProjectionManifestV1(value: unknown): ProjectionManifestValidation {
  const errors: string[] = [];
  if (!isObj(value)) return { ok: false, errors: ["projection manifest is not an object"] };
  unknownKeys(value, MANIFEST_KEYS, "manifest", errors);
  if (value.contract !== PROJECTION_MANIFEST_CONTRACT_ID) {
    errors.push(`contract must be ${PROJECTION_MANIFEST_CONTRACT_ID} (got: ${String(value.contract)})`);
  }
  if (value.version !== PROJECTION_MANIFEST_VERSION) {
    errors.push(`version must be ${PROJECTION_MANIFEST_VERSION} (got: ${String(value.version)})`);
  }
  if (!Array.isArray(value.rules)) {
    errors.push("rules must be an array");
  } else {
    const seen = new Set<string>();
    value.rules.forEach((rule, index) => {
      validateRule(rule, `rules[${index}]`, errors);
      if (!isObj(rule) || typeof rule.id !== "string") return;
      if (seen.has(rule.id)) errors.push(`duplicate rule id: ${rule.id} (rules[${index}])`);
      seen.add(rule.id);
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, manifest: value as unknown as ProjectionManifestV1 };
}

/** Validate a guard verdict against the fail-closed message contract. */
export function validateGuardVerdictV1(value: unknown): GuardVerdictValidation {
  const errors: string[] = [];
  if (!isObj(value)) return { ok: false, errors: ["guard verdict is not an object"] };
  unknownKeys(value, VERDICT_KEYS, "verdict", errors);
  if (value.contract !== GUARD_VERDICT_CONTRACT_ID) {
    errors.push(`contract must be ${GUARD_VERDICT_CONTRACT_ID} (got: ${String(value.contract)})`);
  }
  if (value.version !== GUARD_VERDICT_VERSION) {
    errors.push(`version must be ${GUARD_VERDICT_VERSION} (got: ${String(value.version)})`);
  }
  if (typeof value.guard !== "string" || !RULE_ID_PATTERN.test(value.guard)) {
    errors.push(`guard must be kebab-case (got: ${String(value.guard)})`);
  }
  if (!GUARD_VERDICTS.includes(value.verdict as GuardVerdictKind)) {
    return { ok: false, errors: [...errors, `verdict must be one of ${GUARD_VERDICTS.join("|")} (got: ${String(value.verdict)})`] };
  }
  const verdict = value.verdict as GuardVerdictKind;
  if (verdict === "allow") {
    for (const key of REJECTION_KEYS) {
      if (value[key] !== undefined) errors.push(`an allow verdict carries no rejection field: ${key}`);
    }
  } else {
    if (!GUARD_REJECTION_REASONS.includes(value.reason as GuardRejectionReason)) {
      errors.push(`reason must be one of ${GUARD_REJECTION_REASONS.join("|")} (got: ${String(value.reason)})`);
    }
    if (!isNonEmptyString(value.message)) errors.push("message must be a non-empty teaching message");
    if (verdict === "block") {
      if (!isNonEmptyString(value.requirement)) errors.push("requirement must be a non-empty statement of the rule being enforced");
      if (!isNonEmptyString(value.enforcingCommand)) errors.push("enforcingCommand must be a non-empty command that enforces the rule");
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, verdict: value as unknown as GuardVerdictV1 };
}

/** The closed seam vocabulary's runtime guard, for a consumer holding a seam as
 *  data (the seam-hooks config, #413). */
export function isProjectionSeam(value: unknown): value is ProjectionSeam {
  return typeof value === "string" && (PROJECTION_SEAMS as readonly string[]).includes(value);
}
