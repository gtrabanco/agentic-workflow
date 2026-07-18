/**
 * @gtrabanco/agentic-workflow-schema
 *
 * Types, extraction, and validation for the agentic-workflow **machine
 * envelope** — the fixed JSON block a driven agent turn ends with (emitted by
 * workflow-status always, and by any other skill when the driver injects the
 * canonical system-prompt snippet).
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

export type FixNowSeverity = "high" | "med" | "low";

export interface EnvelopeFixNowFinding {
  id: string;
  file: string;
  axis: string;
  severity: FixNowSeverity;
  class: string;
  route: string;
  suggested_tier: Tier;
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

export interface EnvelopeSuggestion {
  command: string;
  trigger: string;
  source_skill: string;
}

export interface EnvelopeNext {
  recommended: string;
  alternatives: string[];
  tier: Tier;
  /** Optional trigger-attributed suggestions (workflow-status only). */
  suggested?: EnvelopeSuggestion[];
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

function isIntOrNull(v: unknown): boolean {
  return v === null || (typeof v === "number" && Number.isInteger(v));
}

function isStringOrNull(v: unknown): boolean {
  return v === null || typeof v === "string";
}

function isStringArray(v: unknown): boolean {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

const UNIT_TYPES = ["feature", "fix", "docs", "none"];
const PR_STATES = ["open", "merged", "none"];
const CI_STATES = ["green", "red", "pending", "none"];
const VERIFICATION_STATES = ["green", "red", "not-run"];
const BLOCKER_KINDS = [
  "dependency",
  "issue",
  "gate",
  "merge-conflict",
  "substrate",
  "input",
];
const BLOCKER_SCOPES = ["unit", "run"];
const FIX_NOW_SEVERITIES = ["high", "med", "low"];

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

  if (!isObj(value.unit)) {
    errors.push("unit must be an object");
  } else {
    const unit = value.unit;
    if (!UNIT_TYPES.includes(unit.type as string)) {
      errors.push(`unit.type must be one of ${UNIT_TYPES.join("|")} (got: ${String(unit.type)})`);
    }
    if (!isStringOrNull(unit.id)) errors.push("unit.id must be a string or null");
    if (!isIntOrNull(unit.issue)) errors.push("unit.issue must be an integer or null");
    if (!isStringOrNull(unit.branch)) errors.push("unit.branch must be a string or null");
  }

  if (!isObj(value.phase)) {
    errors.push("phase must be an object");
  } else {
    const phase = value.phase;
    if (!isStringOrNull(phase.current)) errors.push("phase.current must be a string or null");
    if (!isIntOrNull(phase.total)) errors.push("phase.total must be an integer or null");
    if (!isIntOrNull(phase.completed)) errors.push("phase.completed must be an integer or null");
  }

  if (!isObj(value.pr)) {
    errors.push("pr must be an object");
  } else {
    const pr = value.pr;
    if (!isIntOrNull(pr.number)) errors.push("pr.number must be an integer or null");
    if (!isStringOrNull(pr.url)) errors.push("pr.url must be a string or null");
    if (!PR_STATES.includes(pr.state as string)) {
      errors.push(`pr.state must be one of ${PR_STATES.join("|")} (got: ${String(pr.state)})`);
    }
    if (!isStringOrNull(pr.head_sha)) errors.push("pr.head_sha must be a string or null");
    if (pr.merge_ready !== null && typeof pr.merge_ready !== "boolean") {
      errors.push("pr.merge_ready must be a boolean or null");
    }
    if (pr.ci !== null && !CI_STATES.includes(pr.ci as string)) {
      errors.push(`pr.ci must be one of ${CI_STATES.join("|")} or null (got: ${String(pr.ci)})`);
    }
  }

  if (!isObj(value.gates)) {
    errors.push("gates must be an object");
  } else {
    const gates = value.gates;
    if (gates.verification !== null && !VERIFICATION_STATES.includes(gates.verification as string)) {
      errors.push(
        `gates.verification must be one of ${VERIFICATION_STATES.join("|")} or null (got: ${String(gates.verification)})`
      );
    }
    if (gates.review_pending !== null && typeof gates.review_pending !== "boolean") {
      errors.push("gates.review_pending must be a boolean or null");
    }
    if (gates.audit_pending !== null && typeof gates.audit_pending !== "boolean") {
      errors.push("gates.audit_pending must be a boolean or null");
    }
  }

  if (!Array.isArray(value.blockers)) {
    errors.push("blockers must be an array");
  } else {
    value.blockers.forEach((b, i) => {
      if (!isObj(b)) {
        errors.push(`blockers[${i}] must be an object`);
        return;
      }
      if (!BLOCKER_KINDS.includes(b.kind as string)) {
        errors.push(`blockers[${i}].kind must be one of ${BLOCKER_KINDS.join("|")} (got: ${String(b.kind)})`);
      }
      if (typeof b.id !== "string") errors.push(`blockers[${i}].id must be a string`);
      if (!BLOCKER_SCOPES.includes(b.scope as string)) {
        errors.push(`blockers[${i}].scope must be one of ${BLOCKER_SCOPES.join("|")} (got: ${String(b.scope)})`);
      }
      if (typeof b.detail !== "string") errors.push(`blockers[${i}].detail must be a string`);
    });
  }

  if (!isObj(value.dependencies)) {
    errors.push("dependencies must be an object");
  } else {
    if (!isStringArray(value.dependencies.unmet)) {
      errors.push("dependencies.unmet must be an array of strings");
    }
    if (!isStringArray(value.dependencies.build_order)) {
      errors.push("dependencies.build_order must be an array of strings");
    }
  }

  if (!isObj(value.recommendations)) {
    errors.push("recommendations must be an object");
  } else {
    if (typeof value.recommendations.product_audit !== "boolean") {
      errors.push("recommendations.product_audit must be a boolean");
    }
    if (!isStringOrNull(value.recommendations.reason)) {
      errors.push("recommendations.reason must be a string or null");
    }
  }

  if (!isObj(value.findings)) {
    errors.push("findings must be an object");
  } else {
    const findings = value.findings;
    if (!Array.isArray(findings.fix_now)) {
      errors.push("findings.fix_now must be an array");
    } else {
      findings.fix_now.forEach((f, i) => {
        if (!isObj(f)) {
          errors.push(`findings.fix_now[${i}] must be an object`);
          return;
        }
        if (typeof f.id !== "string") errors.push(`findings.fix_now[${i}].id must be a string`);
        if (typeof f.file !== "string") errors.push(`findings.fix_now[${i}].file must be a string`);
        if (typeof f.axis !== "string") errors.push(`findings.fix_now[${i}].axis must be a string`);
        if (!FIX_NOW_SEVERITIES.includes(f.severity as string)) {
          errors.push(
            `findings.fix_now[${i}].severity must be one of ${FIX_NOW_SEVERITIES.join("|")} (got: ${String(f.severity)})`
          );
        }
        if (typeof f.class !== "string") errors.push(`findings.fix_now[${i}].class must be a string`);
        if (typeof f.route !== "string") errors.push(`findings.fix_now[${i}].route must be a string`);
        if (f.suggested_tier !== "strong" && f.suggested_tier !== "cheap") {
          errors.push(
            `findings.fix_now[${i}].suggested_tier must be strong|cheap (got: ${String(f.suggested_tier)})`
          );
        }
      });
    }
    if (
      !Array.isArray(findings.issues_filed) ||
      !(findings.issues_filed as unknown[]).every(
        (n) => typeof n === "number" && Number.isInteger(n)
      )
    ) {
      errors.push("findings.issues_filed must be an array of integers");
    }
    if (typeof findings.untriaged !== "number" || !Number.isInteger(findings.untriaged)) {
      errors.push("findings.untriaged must be an integer");
    }
    if (typeof findings.decisions_recorded !== "number" || !Number.isInteger(findings.decisions_recorded)) {
      errors.push("findings.decisions_recorded must be an integer");
    }
  }

  if (!isObj(value.next)) {
    errors.push("next must be an object");
  } else {
    if (typeof value.next.recommended !== "string") {
      errors.push("next.recommended must be a string");
    }
    if (!isStringArray(value.next.alternatives)) {
      errors.push("next.alternatives must be an array of strings");
    }
    if (value.next.tier !== "strong" && value.next.tier !== "cheap") {
      errors.push(`next.tier must be strong|cheap (got: ${String(value.next.tier)})`);
    }
    if (value.next.suggested !== undefined) {
      if (!Array.isArray(value.next.suggested)) {
        errors.push("next.suggested must be an array when present");
      } else {
        value.next.suggested.forEach((s, i) => {
          if (!isObj(s)) {
            errors.push(`next.suggested[${i}] must be an object`);
            return;
          }
          if (typeof s.command !== "string") errors.push(`next.suggested[${i}].command must be a string`);
          if (typeof s.trigger !== "string") errors.push(`next.suggested[${i}].trigger must be a string`);
          if (typeof s.source_skill !== "string") errors.push(`next.suggested[${i}].source_skill must be a string`);
        });
      }
    }
  }

  if (value.needs_input !== null && value.needs_input !== undefined) {
    if (
      !isObj(value.needs_input) ||
      typeof value.needs_input.question !== "string" ||
      !isStringArray(value.needs_input.options)
    ) {
      errors.push("needs_input must be null or {question: string, options: string[]}");
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
