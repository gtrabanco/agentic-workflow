/**
 * @gtrabanco/agentic-workflow-schema
 *
 * Types, extraction, and validation for the agentic-workflow **machine
 * envelope** — the fixed JSON block every user-facing skill prints as the
 * absolute last output of its turn.
 *
 * Parse contract (mirrors skills/orchestration-envelope/SKILL.md):
 *   take the LAST fenced ```json block of the assistant's final message;
 *   exactly one envelope per turn; all top-level keys always present.
 */

// ---------------------------------------------------------------------------
// Types (source of truth: skills/orchestration-envelope/SKILL.md)
// ---------------------------------------------------------------------------

export const ENVELOPE_STATES = [
  "OK",
  "CONTINUE",
  "READY_FOR_REVIEW",
  "READY_FOR_AUDIT",
  "MERGE_READY",
  "MERGED",
  "NEEDS_FIXES",
  "BLOCKED",
  "NEEDS_INPUT",
  "FAILED",
  "HALT",
] as const;

export type EnvelopeState = (typeof ENVELOPE_STATES)[number];

/** States after which an orchestrator must stop and involve a human. */
export const TERMINAL_STATES: readonly EnvelopeState[] = [
  "NEEDS_INPUT",
  "FAILED",
  "HALT",
] as const;

export type UnitType = "feature" | "fix" | "docs" | "none";
export type PrState = "open" | "merged" | "none";
export type CiState = "green" | "red" | "pending" | "none";
export type VerificationState = "green" | "red" | "not-run";
export type BlockerKind =
  | "dependency"
  | "issue"
  | "gate"
  | "merge-conflict"
  | "substrate"
  | "input";
export type BlockerScope = "unit" | "run";
export type Tier = "strong" | "cheap";

export interface EnvelopeUnit {
  type: UnitType;
  id: string | null;
  issue: number | null;
  branch: string | null;
}

export interface EnvelopePhase {
  current: string | null;
  total: number | null;
  completed: number | null;
}

export interface EnvelopePr {
  number: number | null;
  url: string | null;
  state: PrState;
  head_sha: string | null;
  merge_ready: boolean | null;
  ci: CiState | null;
}

export interface EnvelopeGates {
  verification: VerificationState | null;
  review_pending: boolean | null;
  audit_pending: boolean | null;
}

export interface EnvelopeFixNowFinding {
  ref: string;
  title: string;
  file?: string | null;
}

export interface EnvelopeFindings {
  fix_now: EnvelopeFixNowFinding[];
  /** Issue numbers created/updated this turn. */
  issues_filed: number[];
  untriaged: number;
  decisions_recorded: number;
}

export interface EnvelopeBlocker {
  kind: BlockerKind;
  id: string;
  scope: BlockerScope;
  detail: string;
}

export interface EnvelopeDependencies {
  unmet: string[];
  /** Deepest-first order to unblock. */
  build_order: string[];
}

export interface EnvelopeRecommendations {
  product_audit: boolean;
  reason: string | null;
}

export interface EnvelopeNeedsInput {
  question: string;
  options: string[];
}

export interface EnvelopeNext {
  recommended: string;
  alternatives: string[];
  tier: Tier;
}

export interface Envelope {
  skill: string;
  state: EnvelopeState;
  summary: string;
  unit: EnvelopeUnit;
  phase: EnvelopePhase;
  pr: EnvelopePr;
  gates: EnvelopeGates;
  findings: EnvelopeFindings;
  blockers: EnvelopeBlocker[];
  dependencies: EnvelopeDependencies;
  recommendations: EnvelopeRecommendations;
  needs_input: EnvelopeNeedsInput | null;
  next: EnvelopeNext;
  /** Skill-specific payload; documented per skill. */
  detail: unknown;
}

// ---------------------------------------------------------------------------
// Extraction — last fenced ```json block
// ---------------------------------------------------------------------------

const FENCE_RE = /```json[ \t]*\r?\n([\s\S]*?)\r?\n[ \t]*```/g;

/**
 * Returns the raw content of the LAST fenced ```json block in `text`,
 * or null when none exists. This is the envelope parse contract.
 */
export function extractLastJsonBlock(text: string): string | null {
  let last: string | null = null;
  for (const match of text.matchAll(FENCE_RE)) {
    last = match[1];
  }
  return last;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; envelope: Envelope }
  | { ok: false; errors: string[] };

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const REQUIRED_KEYS = [
  "skill",
  "state",
  "summary",
  "unit",
  "phase",
  "pr",
  "gates",
  "findings",
  "blockers",
  "dependencies",
  "recommendations",
  "needs_input",
  "next",
] as const;

/**
 * Structural validation of a parsed value against the envelope contract.
 * Checks required keys, the state enum, and the shape of the routing-critical
 * fields (an orchestrator routes on these; `detail` is intentionally opaque).
 */
export function validateEnvelope(value: unknown): ValidationResult {
  const errors: string[] = [];
  if (!isObj(value)) {
    return { ok: false, errors: ["envelope is not a JSON object"] };
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in value)) errors.push(`missing required key: ${key}`);
  }
  if (typeof value.skill !== "string" || value.skill.length === 0) {
    errors.push("skill must be a non-empty string");
  }
  if (!ENVELOPE_STATES.includes(value.state as EnvelopeState)) {
    errors.push(
      `state must be one of ${ENVELOPE_STATES.join("|")} (got: ${String(value.state)})`
    );
  }
  if (typeof value.summary !== "string") {
    errors.push("summary must be a string");
  }
  if (!isObj(value.unit)) errors.push("unit must be an object");
  if (!isObj(value.phase)) errors.push("phase must be an object");
  if (!isObj(value.pr)) errors.push("pr must be an object");
  if (!isObj(value.gates)) errors.push("gates must be an object");
  if (!Array.isArray(value.blockers)) {
    errors.push("blockers must be an array");
  } else {
    value.blockers.forEach((b, i) => {
      if (!isObj(b) || typeof b.kind !== "string" || typeof b.id !== "string") {
        errors.push(`blockers[${i}] must be {kind, id, scope, detail}`);
      }
    });
  }
  if (!isObj(value.dependencies)) {
    errors.push("dependencies must be an object");
  } else {
    if (!Array.isArray(value.dependencies.unmet)) {
      errors.push("dependencies.unmet must be an array");
    }
    if (!Array.isArray(value.dependencies.build_order)) {
      errors.push("dependencies.build_order must be an array");
    }
  }
  if (!isObj(value.findings)) {
    errors.push("findings must be an object");
  } else {
    if (!Array.isArray(value.findings.fix_now)) {
      errors.push("findings.fix_now must be an array");
    }
    if (
      !Array.isArray(value.findings.issues_filed) ||
      !(value.findings.issues_filed as unknown[]).every(
        (n) => typeof n === "number" && Number.isInteger(n)
      )
    ) {
      errors.push("findings.issues_filed must be an array of integers");
    }
  }
  if (!isObj(value.next)) {
    errors.push("next must be an object");
  } else {
    if (typeof value.next.recommended !== "string") {
      errors.push("next.recommended must be a string");
    }
    if (value.next.tier !== "strong" && value.next.tier !== "cheap") {
      errors.push(`next.tier must be strong|cheap (got: ${String(value.next.tier)})`);
    }
  }
  if (value.needs_input !== null && value.needs_input !== undefined) {
    if (!isObj(value.needs_input) || typeof value.needs_input.question !== "string") {
      errors.push("needs_input must be null or {question, options}");
    }
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, envelope: value as unknown as Envelope };
}

// ---------------------------------------------------------------------------
// One-call API
// ---------------------------------------------------------------------------

export type ParseResult =
  | { ok: true; envelope: Envelope; raw: string }
  | { ok: false; errors: string[]; raw: string | null };

/**
 * Extract the last fenced ```json block from a skill's turn output, parse it,
 * and validate it against the envelope contract.
 */
export function parseEnvelope(text: string): ParseResult {
  const raw = extractLastJsonBlock(text);
  if (raw === null) {
    return { ok: false, errors: ["no fenced ```json block found"], raw: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      ok: false,
      errors: [`invalid JSON in last fenced block: ${(e as Error).message}`],
      raw,
    };
  }
  const result = validateEnvelope(parsed);
  if (!result.ok) return { ok: false, errors: result.errors, raw };
  return { ok: true, envelope: result.envelope, raw };
}

/** True when the orchestrator must stop and involve a human. */
export function isTerminal(state: EnvelopeState): boolean {
  return TERMINAL_STATES.includes(state);
}

/** True when every blocker (or any) demands stopping the whole run. */
export function isRunHalt(envelope: Envelope): boolean {
  return (
    envelope.state === "HALT" ||
    envelope.blockers.some((b) => b.scope === "run")
  );
}
