/**
 * Envelope v2 `next.continuation` — the executable hand-off object (feature 59).
 *
 * One deterministic emitter, many quoters. This module owns the frozen shape,
 * the closed refusal vocabulary, the argv parser, the per-platform rendering
 * derivation, the emitter, the validator, and the receiver-side evidence check.
 * It fabricates nothing and persists nothing: every member it emits comes from
 * an already-resolved command string plus the caller's unit context, and every
 * failure path returns a typed refusal from `CONTINUATION_REFUSALS` instead of
 * a guessed command (SPEC D-59-4/D-59-5/D-59-8, AC1, AC4, AC5).
 *
 * `argv` is the command of record; `rendering` is display-only and derivable
 * from `argv` per platform family, so a caller may re-render for its own shell
 * without ever changing the command. The whole field is optional: an Envelope
 * without it stays valid (additive minor).
 */

import { canonicalJSONValue } from "./canonical-json.js";
import { sha256HexSync } from "./sha256.js";

/** Contract identifier for the continuation object. */
export const CONTINUATION_CONTRACT_ID = "agentic-workflow/continuation@1";

/**
 * The closed refusal vocabulary (≤ 4 codes). A continuation that cannot be
 * checked or rendered becomes one of these; extending the set is a SPEC change
 * (D-59-5), never an emitter extension.
 */
export const CONTINUATION_REFUSALS = Object.freeze([
  "precondition-uncheckable",
  "rendering-failed",
  "no-decision-available",
  "sensor-degraded",
] as const);

export type ContinuationRefusalCode = (typeof CONTINUATION_REFUSALS)[number];

/**
 * Rendering families the derivation understands. v1 *emits* the POSIX-shell
 * rendering (E-59-5); the Windows family is derivable by the same rule and is
 * pinned by the rendering tests, but is not emitted until a SPEC change extends
 * the family set (B-02).
 */
export const CONTINUATION_PLATFORM_FAMILIES = Object.freeze(["posix", "windows"] as const);

export type ContinuationPlatformFamily = (typeof CONTINUATION_PLATFORM_FAMILIES)[number];

/** One emit-time-checked precondition. `satisfied` is the emitter's evaluation. */
export interface ContinuationPrecondition {
  id: string;
  check: string;
  satisfied: boolean;
}

/** Receiver-verifiable evidence token: `digest` is lowercase SHA-256 of `artifact`. */
export interface ContinuationEvidence {
  artifact: string;
  digest: string;
}

/** The frozen `next.continuation` shape (all members required unless marked `?`). */
export interface EnvelopeContinuation {
  argv: string[];
  /** Display-only, derived from `argv`; never alters the command of record. */
  rendering?: string;
  preconditions: ContinuationPrecondition[];
  evidence?: ContinuationEvidence;
  /** The envelope/state field that must measurably advance when the command runs. */
  convergence: string;
}

/** Emitter input: the already-resolved command plus the unit context. */
export interface EmitContinuationInput {
  /** Already-resolved command string (e.g. `next.recommended`). Never re-derived here. */
  command: string;
  /** The field the command advances (per-class, frozen in the SPEC's class table). */
  convergence: string;
  /** At-emit evaluation rows. Absent means "no preconditions declared". */
  preconditions?: readonly ContinuationPrecondition[];
  /** Optional evidence token; its digest is not recomputed here (see the verifier). */
  evidence?: ContinuationEvidence;
  /** Sensor input: `false` when no decision is available → `no-decision-available`. */
  decisionAvailable?: boolean;
  /** Sensor input: `true` when forge/git state is unavailable → `sensor-degraded`. */
  sensorDegraded?: boolean;
  /** Rendering family to emit. Defaults to `posix` (E-59-5). */
  platform?: ContinuationPlatformFamily;
}

export type EmitContinuationResult =
  | { ok: true; continuation: EnvelopeContinuation }
  | { ok: false; refusal: ContinuationRefusalCode };

const DIGEST_RE = /^[0-9a-f]{64}$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse a resolved command string into argv by whitespace splitting, honoring
 * single and double quotes so a quoted argument stays one token. Throws on an
 * unterminated quote; the emitter maps that to `rendering-failed`.
 */
export function parseContinuationArgv(command: string): string[] {
  if (typeof command !== "string") {
    throw new TypeError("continuation command must be a string");
  }
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let started = false;
  for (const ch of command) {
    if (quote !== null) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      started = true;
      continue;
    }
    if (/\s/.test(ch)) {
      if (started) {
        tokens.push(current);
        current = "";
        started = false;
      }
      continue;
    }
    current += ch;
    started = true;
  }
  if (quote !== null) {
    throw new TypeError("continuation command has an unterminated quote");
  }
  if (started) tokens.push(current);
  return tokens;
}

const POSIX_SAFE = /^[A-Za-z0-9_@%+=:,./-]+$/;

function posixQuote(token: string): string {
  if (token.length > 0 && POSIX_SAFE.test(token)) return token;
  return `'${token.replace(/'/g, "'\\''")}'`;
}

function windowsQuote(token: string): string {
  if (token.length > 0 && !/[\s"]/.test(token)) return token;
  return `"${token.replace(/"/g, '""')}"`;
}

/**
 * Derive the display rendering from `argv` for a platform family. Pure: it
 * never mutates `argv`, so re-rendering cannot change the command of record.
 */
export function deriveContinuationRendering(
  argv: readonly string[],
  family: ContinuationPlatformFamily = "posix",
): string {
  if (!Array.isArray(argv) || argv.length === 0 || !argv.every((token) => typeof token === "string")) {
    throw new TypeError("continuation argv must be a non-empty array of strings");
  }
  if (family === "posix") return argv.map(posixQuote).join(" ");
  if (family === "windows") return argv.map(windowsQuote).join(" ");
  throw new TypeError(`unknown continuation platform family: ${String(family)}`);
}

/**
 * The pure, deterministic, fail-closed emitter (AC1/AC2/AC5).
 *
 * Input is the already-resolved command string plus the unit context; this
 * function does NOT re-derive the decision. It parses argv, validates and copies
 * the preconditions, derives the rendering, and returns the continuation. Every
 * failure path returns `{ ok: false, refusal }`:
 *
 * - `sensor-degraded`      — the caller reports forge/git state unavailable;
 * - `no-decision-available`— empty command, empty convergence, or no decision flag;
 * - `rendering-failed`     — the command cannot be parsed to argv or rendered;
 * - `precondition-uncheckable` — a precondition/evidence row is not checkable.
 */
export function emitContinuation(input: EmitContinuationInput): EmitContinuationResult {
  if (!isPlainObject(input)) return { ok: false, refusal: "no-decision-available" };
  if (input.sensorDegraded === true) return { ok: false, refusal: "sensor-degraded" };
  if (input.decisionAvailable === false) return { ok: false, refusal: "no-decision-available" };

  const command = typeof input.command === "string" ? input.command.trim() : "";
  if (command.length === 0) return { ok: false, refusal: "no-decision-available" };

  const convergence = typeof input.convergence === "string" ? input.convergence.trim() : "";
  if (convergence.length === 0) return { ok: false, refusal: "no-decision-available" };

  let argv: string[];
  try {
    argv = parseContinuationArgv(command);
  } catch {
    return { ok: false, refusal: "rendering-failed" };
  }
  if (argv.length === 0 || argv.some((token) => token.length === 0)) {
    return { ok: false, refusal: "no-decision-available" };
  }

  const preconditions: ContinuationPrecondition[] = [];
  const rawPreconditions = input.preconditions ?? [];
  if (!Array.isArray(rawPreconditions)) return { ok: false, refusal: "precondition-uncheckable" };
  for (const row of rawPreconditions) {
    if (
      !isPlainObject(row)
      || typeof row.id !== "string" || row.id.length === 0
      || typeof row.check !== "string" || row.check.length === 0
      || typeof row.satisfied !== "boolean"
    ) {
      return { ok: false, refusal: "precondition-uncheckable" };
    }
    preconditions.push({ id: row.id, check: row.check, satisfied: row.satisfied });
  }

  let evidence: ContinuationEvidence | undefined;
  if (input.evidence !== undefined) {
    if (
      !isPlainObject(input.evidence)
      || typeof input.evidence.artifact !== "string" || input.evidence.artifact.length === 0
      || typeof input.evidence.digest !== "string" || !DIGEST_RE.test(input.evidence.digest)
    ) {
      return { ok: false, refusal: "precondition-uncheckable" };
    }
    evidence = { artifact: input.evidence.artifact, digest: input.evidence.digest };
  }

  let rendering: string;
  try {
    rendering = deriveContinuationRendering(argv, input.platform ?? "posix");
  } catch {
    return { ok: false, refusal: "rendering-failed" };
  }

  const continuation: EnvelopeContinuation = { argv, rendering, preconditions, convergence };
  if (evidence !== undefined) continuation.evidence = evidence;
  return { ok: true, continuation };
}

/**
 * Validate a `next.continuation` value. Returns typed error strings (empty when
 * valid); the envelope validator folds these into its own error list so an
 * invalid shape fails closed instead of validating silently.
 */
export function validateContinuation(value: unknown): string[] {
  if (!isPlainObject(value)) return ["next.continuation must be an object"];

  const errors: string[] = [];
  const allowed = new Set(["argv", "rendering", "preconditions", "evidence", "convergence"]);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`next.continuation has an unexpected key: ${key}`);
  }

  if (
    !Array.isArray(value.argv)
    || value.argv.length === 0
    || !value.argv.every((token) => typeof token === "string" && token.length > 0)
  ) {
    errors.push("next.continuation.argv must be a non-empty array of non-empty strings");
  }

  if (typeof value.convergence !== "string" || value.convergence.trim().length === 0) {
    errors.push("next.continuation.convergence must be a non-empty string");
  }

  if (!Array.isArray(value.preconditions)) {
    errors.push("next.continuation.preconditions must be an array");
  } else {
    value.preconditions.forEach((row, i) => {
      if (!isPlainObject(row)) {
        errors.push(`next.continuation.preconditions[${i}] must be an object`);
        return;
      }
      if (typeof row.id !== "string" || row.id.length === 0) {
        errors.push(`next.continuation.preconditions[${i}].id must be a non-empty string`);
      }
      if (typeof row.check !== "string" || row.check.length === 0) {
        errors.push(`next.continuation.preconditions[${i}].check must be a non-empty string`);
      }
      if (typeof row.satisfied !== "boolean") {
        errors.push(`next.continuation.preconditions[${i}].satisfied must be a boolean`);
      }
    });
  }

  if (value.rendering !== undefined && (typeof value.rendering !== "string" || value.rendering.length === 0)) {
    errors.push("next.continuation.rendering must be a non-empty string when present");
  }

  if (value.evidence !== undefined) {
    if (!isPlainObject(value.evidence)) {
      errors.push("next.continuation.evidence must be an object when present");
    } else {
      if (typeof value.evidence.artifact !== "string" || value.evidence.artifact.length === 0) {
        errors.push("next.continuation.evidence.artifact must be a non-empty string");
      }
      if (typeof value.evidence.digest !== "string" || !DIGEST_RE.test(value.evidence.digest)) {
        errors.push("next.continuation.evidence.digest must be a lowercase 64-hex SHA-256 string");
      }
    }
  }

  return errors;
}

/** Canonical serialization of a continuation value (sorted keys, compact). */
export function canonicalizeContinuation(value: unknown): string {
  return canonicalJSONValue(value);
}

/**
 * Receiver-side evidence check (AC4). Re-derives the SHA-256 of `artifactText`
 * and compares it with the token's digest. Nothing is persisted; a mismatch is a
 * plain `false`, never a repair.
 */
export function verifyContinuationEvidence(
  continuation: EnvelopeContinuation | null | undefined,
  artifactText: string,
): boolean {
  if (!continuation || !isPlainObject(continuation.evidence)) return false;
  const { digest } = continuation.evidence;
  if (typeof digest !== "string" || !DIGEST_RE.test(digest)) return false;
  if (typeof artifactText !== "string") return false;
  return sha256HexSync(artifactText) === digest;
}
