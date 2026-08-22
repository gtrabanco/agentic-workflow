/**
 * @gtrabanco/agentic-workflow-schema
 *
 * Types, extraction, and validation for the agentic-workflow machine contracts:
 * Envelope v2, SkillOutcome v1, and WorkflowSnapshot v1.
 *
 * Envelope parse contract:
 *   take the LAST fenced ```json block of the assistant's final message;
 *   exactly one envelope per turn; all top-level keys always present.
 */

// ---------------------------------------------------------------------------
// Types (source of truth: this package; the internal skill carries policy only)
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
    if (typeof findings.untriaged !== "number" || !Number.isInteger(findings.untriaged) || findings.untriaged < 0) {
      errors.push("findings.untriaged must be a non-negative integer");
    }
    if (typeof findings.decisions_recorded !== "number" || !Number.isInteger(findings.decisions_recorded) || findings.decisions_recorded < 0) {
      errors.push("findings.decisions_recorded must be a non-negative integer");
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

// ---------------------------------------------------------------------------
// Machine contracts — strict v2 compatibility, compact outcomes, snapshots
// ---------------------------------------------------------------------------

/** The strict, driver-facing interpretation of the legacy envelope. */
const STRICT_V2_KEYS = [...REQUIRED_KEYS, "detail"] as const;

function rejectUnexpectedKeys(
  value: unknown,
  path: string,
  keys: readonly string[],
  errors: string[],
): void {
  if (!isObj(value)) return;
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`unexpected key: ${path}.${key}`);
  }
}

function rejectUnexpectedEnvelopeKeys(value: Record<string, unknown>, errors: string[]): void {
  rejectUnexpectedKeys(value.unit, "unit", ["type", "id", "issue", "branch"], errors);
  rejectUnexpectedKeys(value.phase, "phase", ["current", "total", "completed"], errors);
  rejectUnexpectedKeys(value.pr, "pr", ["number", "url", "state", "head_sha", "merge_ready", "ci"], errors);
  rejectUnexpectedKeys(value.gates, "gates", ["verification", "review_pending", "audit_pending"], errors);
  rejectUnexpectedKeys(value.findings, "findings", ["fix_now", "issues_filed", "untriaged", "decisions_recorded"], errors);
  if (isObj(value.findings) && Array.isArray(value.findings.fix_now)) {
    value.findings.fix_now.forEach((finding, index) => {
      rejectUnexpectedKeys(
        finding,
        `findings.fix_now[${index}]`,
        ["id", "file", "axis", "severity", "class", "route", "suggested_tier"],
        errors,
      );
    });
  }
  if (Array.isArray(value.blockers)) {
    value.blockers.forEach((blocker, index) => {
      rejectUnexpectedKeys(blocker, `blockers[${index}]`, ["kind", "id", "scope", "detail"], errors);
    });
  }
  rejectUnexpectedKeys(value.dependencies, "dependencies", ["unmet", "build_order"], errors);
  rejectUnexpectedKeys(value.recommendations, "recommendations", ["product_audit", "reason"], errors);
  if (value.needs_input !== null) {
    rejectUnexpectedKeys(value.needs_input, "needs_input", ["question", "options"], errors);
  }
  rejectUnexpectedKeys(value.next, "next", ["recommended", "alternatives", "tier", "suggested"], errors);
  if (isObj(value.next) && Array.isArray(value.next.suggested)) {
    value.next.suggested.forEach((suggestion, index) => {
      rejectUnexpectedKeys(suggestion, `next.suggested[${index}]`, ["command", "trigger", "source_skill"], errors);
    });
  }
}

export type StrictEnvelopeValidationResult =
  | { ok: true; envelope: Envelope }
  | { ok: false; errors: string[] };

/**
 * Validates the documented v2 shape at a driver boundary.
 *
 * `validateEnvelope()` remains intentionally source-compatible for existing
 * package consumers. New drivers use this stricter entry point: `detail` is
 * present and top-level schema extensions are rejected instead of silently
 * becoming a second, undocumented contract.
 */
export function validateEnvelopeV2Strict(value: unknown): StrictEnvelopeValidationResult {
  const base = validateEnvelope(value);
  if (!base.ok) return base;
  if (!isObj(value)) return { ok: false, errors: ["envelope is not a JSON object"] };

  const errors: string[] = [];
  for (const key of STRICT_V2_KEYS) {
    if (!(key in value)) errors.push(`missing required key: ${key}`);
  }
  const allowed = new Set<string>(STRICT_V2_KEYS);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`unexpected top-level key: ${key}`);
  }
  rejectUnexpectedEnvelopeKeys(value, errors);
  return errors.length === 0 ? { ok: true, envelope: base.envelope } : { ok: false, errors };
}

export type StrictEnvelopeParseResult =
  | { ok: true; envelope: Envelope; raw: string }
  | { ok: false; errors: string[]; raw: string | null };

/** Extract, parse, and validate the strict driver-facing v2 envelope. */
export function parseEnvelopeV2Strict(text: string): StrictEnvelopeParseResult {
  const raw = extractLastJsonBlock(text);
  if (raw === null) return { ok: false, errors: ["no fenced ```json block found"], raw: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      ok: false,
      errors: [`invalid JSON in last fenced block: ${(error as Error).message}`],
      raw,
    };
  }
  const result = validateEnvelopeV2Strict(parsed);
  return result.ok
    ? { ok: true, envelope: result.envelope, raw }
    : { ok: false, errors: result.errors, raw };
}

export type WorkflowIntent =
  | "init-workspace"
  | "status"
  | "discover-repository-state"
  | "resolve-repository-state"
  | "design-feature"
  | "plan-feature"
  | "plan-fix"
  | "triage-issue"
  | "execute-phase"
  | "review-change"
  | "loop-review-fold"
  | "audit-pr"
  | "merge"
  | "ask-human"
  | "stop"
  | "none";

export const WORKFLOW_INTENTS: readonly WorkflowIntent[] = [
  "init-workspace",
  "status",
  "discover-repository-state",
  "resolve-repository-state",
  "design-feature",
  "plan-feature",
  "plan-fix",
  "triage-issue",
  "execute-phase",
  "review-change",
  "loop-review-fold",
  "audit-pr",
  "merge",
  "ask-human",
  "stop",
  "none",
] as const;

// ---------------------------------------------------------------------------
// Workflow transition decider — reason codes, decision types, transition table
// ---------------------------------------------------------------------------

/** Sense reason codes: transition cannot proceed without more sensor input. */
export const WORKFLOW_DECISION_SENSE_CODES = Object.freeze([
  "sense-initial",
  "sense-stale-revision",
  "sense-missing-evidence",
  "sense-unknown-state",
  "sense-unlisted-transition",
] as const);
export type WorkflowDecisionSenseReason = (typeof WORKFLOW_DECISION_SENSE_CODES)[number];

/** Stop reason codes: the transition is explicitly blocked or must terminate. */
export const WORKFLOW_DECISION_STOP_CODES = Object.freeze([
  "stop-blocked",
  "stop-needs-input",
  "stop-failed",
  "stop-contradiction",
  "stop-policy-denied",
  "stop-forbidden-transition",
] as const);
export type WorkflowDecisionStopReason = (typeof WORKFLOW_DECISION_STOP_CODES)[number];

/** Invoke reason codes: transition is proven and allowed. */
export const WORKFLOW_DECISION_INVOKE_CODES = Object.freeze([
  "invoke-proven-transition",
] as const);
export type WorkflowDecisionInvokeReason = (typeof WORKFLOW_DECISION_INVOKE_CODES)[number];

export type WorkflowDecisionReasonCode =
  | WorkflowDecisionSenseReason
  | WorkflowDecisionStopReason
  | WorkflowDecisionInvokeReason;

/** Policy a caller provides to control the transition decision. */
export interface WorkflowDecisionPolicy {
  /** Intents the caller is permitted to invoke. */
  readonly allowedIntents: readonly WorkflowIntent[];
  /** Whether the caller has forge-write authorization. */
  readonly forgeWriteAuthorized: boolean;
}

/** Input to the transition decision function. */
export interface WorkflowDecisionInput {
  /** A validated WorkflowSnapshot v1. */
  readonly snapshot: WorkflowSnapshot;
  /** The last validated SkillOutcome v1, or null. */
  readonly lastOutcome: SkillOutcome | null;
  /** The revision at which the last outcome was recorded. */
  readonly lastOutcomeSourceRevision: string | null;
  /** Closed caller policy governing what transitions are permitted. */
  readonly policy: WorkflowDecisionPolicy;
}

/** Intent values that may be directly invoked (excludes non-invocation intents). */
export type WorkflowInvocableIntent = Exclude<WorkflowIntent,
  "status" | "ask-human" | "stop" | "none">;

export type WorkflowActionDecision =
  | { readonly kind: "invoke"; readonly intent: WorkflowInvocableIntent;
      readonly targets: readonly string[]; readonly reasonCode: "invoke-proven-transition";
      readonly evidenceRefs: readonly string[]; readonly detail: string }
  | { readonly kind: "sense"; readonly intent: "status"; readonly targets: readonly [];
      readonly reasonCode: WorkflowDecisionSenseReason;
      readonly evidenceRefs: readonly string[]; readonly detail: string }
  | { readonly kind: "stop"; readonly intent: "ask-human" | "stop";
      readonly targets: readonly string[];
      readonly reasonCode: WorkflowDecisionStopReason;
      readonly evidenceRefs: readonly string[]; readonly detail: string };

/** One row of the direct-invocation transition table. */
export interface WorkflowTransitionTableRow {
  /** The last validated skill / workflow intent. */
  readonly key: WorkflowIntent;
  /** Allowed next intents (may be empty, or contain a single literal "*" for wildcard). */
  readonly allowed: readonly string[];
  /** Description of the row conditions (arity, identity, state constraints). */
  readonly condition: string;
}

/**
 * Frozen, versioned direct-invocation transition table.
 *
 * Maps each last-validated skill to its allowed next intents. Rows whose
 * `allowed` array contains a literal "frozen" permit transitions only when
 * the snapshot repository state is "frozen"; rows with an empty array
 * explicitly forbid any transition (return sense/stop rather than invoke).
 *
 * Derived condition semantics (from the Design):
 *   none        → sense-initial
 *   init-workspace → exactly discover-repository-state
 *   workflow-status → broad set of planning/execution skills
 *   discover-repository-state → row allowed iff snapshot.state === "frozen"
 *   resolve-repository-state  → row allowed iff snapshot.contradictions.length > 0
 *   design-feature, plan-feature → 0..n allowed, each must be a plan/execute skill
 *   plan-fix → exactly 1, must be triage-issue
 *   triage-issue → 1..n allowed, each must be an issue identity string
 *   init-workspace, discover-repository-state → 0 allowed → stop-forbidden-transition
 *   resolve-repository-state → each allowed must match a contradiction field
 *   merge → exactly 1, must be the PR identity from audit-pr
 */
export const WORKFLOW_TRANSITION_TABLE: readonly WorkflowTransitionTableRow[] = Object.freeze([
  // Last skill = none → no transition possible
  {
    key: "none",
    allowed: [],
    condition: "no last validated skill; return sense-initial",
  },
  // init-workspace → discover-repository-state only
  {
    key: "init-workspace",
    allowed: ["discover-repository-state"],
    condition: "exactly 1 target; any other target → stop-forbidden-transition",
  },
  // status → broad planning and execution set
  {
    key: "status",
    allowed: [
      "init-workspace",
      "discover-repository-state",
      "resolve-repository-state",
      "design-feature",
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "all allowed intents after status",
  },
  // discover-repository-state → planning allowed only when repo is frozen
  {
    key: "discover-repository-state",
    allowed: [
      "resolve-repository-state",
      "design-feature",
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "row allowed only when snapshot.repositoryState === 'frozen';"
      + " any target when state is not frozen → sense-missing-evidence",
  },
  // resolve-repository-state → contradiction targets only
  {
    key: "resolve-repository-state",
    allowed: ["resolve-repository-state"],
    condition: "0..n allowed, each === a snapshot contradiction field identity;"
      + " non-contradiction target → stop-forbidden-transition",
  },
  // design-feature → next roadmap unit or the active unit / named dependency
  {
    key: "design-feature",
    allowed: [
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "0..n allowed, each must be the next roadmap unit, the active unit id,"
      + " or the named dependency unit recorded by the last outcome;"
      + " non-allowed target → stop-forbidden-transition",
  },
  // plan-feature → active or dependency unit, max 1
  {
    key: "plan-feature",
    allowed: [
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "0..1 allowed; 0 → next roadmap unit; 1 → active unit id or named dependency;"
      + ">1 → stop-forbidden-transition",
  },
  // plan-fix → triage-issue only, exactly 1
  {
    key: "plan-fix",
    allowed: ["triage-issue"],
    condition: "exactly 1 target (the issue identity); 0 → sense-missing-evidence;"
      + ">1 → stop-forbidden-transition",
  },
  // triage-issue → issue identities, 1..n
  {
    key: "triage-issue",
    allowed: [
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "1..n allowed, each must be an issue identity recorded by the last outcome;"
      + " 0 → sense-missing-evidence",
  },
  // execute-phase → planning and execution, max 1
  {
    key: "execute-phase",
    allowed: [
      "design-feature",
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "0..1 allowed; each must be a plan/execute skill or ask-human/stop;"
      + ">1 → stop-forbidden-transition",
  },
  // review-change → planning and execution
  {
    key: "review-change",
    allowed: [
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "0..n allowed, each must be a plan/execute/review skill or ask-human/stop;"
      + " non-allowed target → stop-forbidden-transition",
  },
  // loop-review-fold → planning and execution
  {
    key: "loop-review-fold",
    allowed: [
      "plan-feature",
      "plan-fix",
      "triage-issue",
      "execute-phase",
      "review-change",
      "loop-review-fold",
      "audit-pr",
      "ask-human",
      "stop",
    ],
    condition: "0..n allowed, each must be a plan/execute/review skill or ask-human/stop;"
      + " non-allowed target → stop-forbidden-transition",
  },
  // audit-pr → merge, execute-phase, or stop
  {
    key: "audit-pr",
    allowed: ["merge", "execute-phase", "ask-human", "stop"],
    condition: "exactly 1 allowed: merge, execute-phase, ask-human, or stop;"
      + ">1 → stop-forbidden-transition",
  },
  // merge → none (end of pipeline)
  {
    key: "merge",
    allowed: [],
    condition: "merge is the terminal action; no allowed transitions;"
      + " any target → stop-forbidden-transition",
  },
] as const);

// ---------------------------------------------------------------------------
// Capability metadata — closed vocabularies, immutable exports (issue #136)
// ---------------------------------------------------------------------------

/** Role a built-in skill plays in the workflow pipeline. */
export const SKILL_ROLES = Object.freeze([
  "sensor",
  "planner",
  "executor",
  "reviewer",
  "auditor",
  "publisher",
] as const);
export type SkillRole = (typeof SKILL_ROLES)[number];

/** Maximum repository/forge effects permitted by a built-in profile. */
export const SKILL_EFFECTS = Object.freeze([
  "repository-read",
  "repository-write",
  "git-write",
  "forge-read",
  "forge-write",
] as const);
export type SkillEffect = (typeof SKILL_EFFECTS)[number];

/** Reasoning class a profile declares for its primary route. */
export const SKILL_REASONING = Object.freeze([
  "mechanical",
  "semantic",
  "critical",
] as const);
export type SkillReasoning = (typeof SKILL_REASONING)[number];

/** Context sources a profile may consult. */
export const SKILL_CONTEXT_SOURCES = Object.freeze([
  "repository",
  "semantic-context",
  "episodic-memory",
  "execution-state",
] as const);
export type SkillContextSource = (typeof SKILL_CONTEXT_SOURCES)[number];

/** Evidence a capability-aware driver should require before trusting results. */
export const SKILL_REQUIRED_EVIDENCE = Object.freeze([
  "workflow-snapshot",
  "current-candidate",
  "verification",
  "independent-review",
  "audit",
  "issue-state",
  "pull-request-state",
] as const);
export type SkillRequiredEvidence = (typeof SKILL_REQUIRED_EVIDENCE)[number];

/**
 * Declarative, closed-vocabulary capability metadata for a built-in profile.
 * Repository evidence is the authoritative limit; semantic and episodic
 * context is advisory and never extends the declared maximum effects.
 */
export interface WorkflowSkillCapabilities {
  readonly role: SkillRole;
  readonly reasoning: SkillReasoning;
  readonly effects: readonly SkillEffect[];
  readonly contextSources: readonly SkillContextSource[];
  readonly requiredEvidence: readonly SkillRequiredEvidence[];
}

/**
 * Public profile boundary — source-compatible for external consumers that
 * construct or mutate profiles. The three legacy fields are writable so
 * third-party code can assign to them without TS2540.
 */
export interface WorkflowSkillProfile {
  skill: string;
  output: "envelope-v2" | "skill-outcome-v1";
  nativeFallback: "none" | "fixed-verdict";
  /**
   * Optional for source compatibility; every built-in populates it and a
   * capability-aware consumer fails closed when it is absent.
   */
  capabilities?: WorkflowSkillCapabilities;
}

/**
 * Deeply readonly boundary for shipped built-in profiles. The immutable type
 * guarantees compile-time immutability without narrowing the public boundary.
 */
export interface BuiltInSkillProfile {
  readonly skill: string;
  readonly output: "envelope-v2" | "skill-outcome-v1";
  readonly nativeFallback: "none" | "fixed-verdict";
  readonly capabilities?: Readonly<WorkflowSkillCapabilities>;
}

/** Recursively freezes exported metadata so runtime widening is impossible. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

/**
 * The portable skill inventory consumed by headless drivers. Profiles are
 * programmatic metadata, not duplicated prompt sections in user-facing skills.
 */
export const WORKFLOW_SKILL_PROFILES: readonly BuiltInSkillProfile[] = deepFreeze([
  {
    skill: "init-workspace",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "executor",
      reasoning: "semantic",
      effects: ["repository-read", "repository-write", "git-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context"],
      requiredEvidence: [],
    },
  },
  {
    skill: "workflow-status",
    output: "envelope-v2",
    nativeFallback: "none",
    capabilities: {
      role: "sensor",
      reasoning: "mechanical",
      effects: ["repository-read", "forge-read"],
      contextSources: ["repository", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "discover-repository-state",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "sensor",
      reasoning: "semantic",
      effects: ["repository-read", "repository-write", "git-write"],
      contextSources: ["repository", "semantic-context"],
      requiredEvidence: [],
    },
  },
  {
    skill: "resolve-repository-state",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write"],
      contextSources: ["repository", "semantic-context", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "design-feature",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "plan-feature",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot"],
    },
  },
  {
    skill: "plan-fix",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "git-write", "forge-read"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot", "issue-state"],
    },
  },
  {
    skill: "triage-issue",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "planner",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot", "issue-state"],
    },
  },
  {
    skill: "execute-phase",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "executor",
      reasoning: "semantic",
      effects: ["repository-read", "repository-write", "git-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["workflow-snapshot", "current-candidate"],
    },
  },
  {
    skill: "review-change",
    output: "skill-outcome-v1",
    nativeFallback: "none",
    capabilities: {
      role: "reviewer",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "execution-state"],
      requiredEvidence: ["current-candidate", "verification"],
    },
  },
  {
    skill: "loop-review-fold",
    output: "skill-outcome-v1",
    nativeFallback: "fixed-verdict",
    capabilities: {
      role: "reviewer",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "git-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "episodic-memory", "execution-state"],
      requiredEvidence: ["current-candidate", "independent-review"],
    },
  },
  {
    skill: "audit-pr",
    output: "skill-outcome-v1",
    nativeFallback: "fixed-verdict",
    capabilities: {
      role: "auditor",
      reasoning: "critical",
      effects: ["repository-read", "repository-write", "forge-read", "forge-write"],
      contextSources: ["repository", "semantic-context", "execution-state"],
      requiredEvidence: ["current-candidate", "verification", "independent-review", "pull-request-state"],
    },
  },
] as const);

// Compile-time invariant: the exported profiles are deeply readonly so the
// type contract matches the deep-frozen runtime surface (AC5/AC9). The
// identical-type discriminator below is true only when an interface is
// already fully readonly; removing any `readonly` modifier from
// WorkflowSkillCapabilities or WorkflowSkillProfile makes the resolution
// `false`, which fails the `extends true` constraint below. Type-level only:
// nothing is emitted to compiled JS or the declarations.
type _IfEquals<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type _AssertTrue<T extends true> = T;
type _CapabilitiesDeeplyReadonly = _AssertTrue<
  _IfEquals<WorkflowSkillCapabilities, Readonly<WorkflowSkillCapabilities>>
>;
type _ProfilesDeeplyReadonly = _AssertTrue<
  _IfEquals<BuiltInSkillProfile, Readonly<BuiltInSkillProfile>>
>;

function workflowSkillProfile(skill: string): WorkflowSkillProfile | undefined {
  return WORKFLOW_SKILL_PROFILES.find((profile) => profile.skill === skill);
}

export type SkillOutcomeStatus = "completed" | "continue" | "blocked" | "needs-input" | "failed";

export interface SkillOutcomeBlocker {
  kind: BlockerKind;
  id: string;
  scope: BlockerScope;
  detail: string;
}

export interface SkillOutcomeQuestion {
  id: string;
  question: string;
  options: string[];
}

export interface SkillOutcomeDiscovery {
  kind: "defect" | "risk" | "opportunity" | "environment" | "scope-gap" | "unknown";
  scope: "current-unit" | "outside-unit" | "run";
  summary: string;
  evidence_refs: string[];
  proposed_intent: WorkflowIntent;
}

export interface SkillOutcome {
  contract: "agentic-workflow/skill-outcome";
  version: 1;
  skill: string;
  status: SkillOutcomeStatus;
  summary: string;
  next: { intent: WorkflowIntent; targets: string[] };
  blockers: SkillOutcomeBlocker[];
  questions: SkillOutcomeQuestion[];
  discoveries: SkillOutcomeDiscovery[];
  evidence_refs: string[];
}

export interface TurnParseContext {
  /** Trusted driver state used only for a checked legacy normalization. */
  unitId?: string;
}

export interface TurnParseDiagnostic {
  code: string;
  detail: string;
}

export type TurnParseSource = "skill-outcome-v1" | "envelope-v2-strict" | "envelope-v2-compat" | "native";

export type TurnParseResult =
  | {
      ok: true;
      source: TurnParseSource;
      outcome: SkillOutcome;
      envelope: Envelope | null;
      diagnostics: TurnParseDiagnostic[];
    }
  | { ok: false; errors: string[]; diagnostics: TurnParseDiagnostic[] };

export interface ParseTurnInput {
  skill: string;
  text: string;
  context?: TurnParseContext;
}

function isWorkflowIntent(value: unknown): value is WorkflowIntent {
  return typeof value === "string" && WORKFLOW_INTENTS.includes(value as WorkflowIntent);
}

function isBlockerKind(value: unknown): value is BlockerKind {
  return typeof value === "string" && BLOCKER_KINDS.includes(value);
}

function isBlockerScope(value: unknown): value is BlockerScope {
  return typeof value === "string" && BLOCKER_SCOPES.includes(value);
}

export type SkillOutcomeValidationResult =
  | { ok: true; outcome: SkillOutcome }
  | { ok: false; errors: string[] };

/** Validates the strict, model-owned SkillOutcome v1 JSON contract. */
export function validateSkillOutcomeV1(value: unknown): SkillOutcomeValidationResult {
  if (!isObj(value)) return { ok: false, errors: ["skill outcome is not a JSON object"] };
  const required = [
    "contract",
    "version",
    "skill",
    "status",
    "summary",
    "next",
    "blockers",
    "questions",
    "discoveries",
    "evidence_refs",
  ];
  const errors: string[] = [];
  for (const key of required) if (!(key in value)) errors.push(`missing required key: ${key}`);
  const allowed = new Set(required);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`unexpected top-level key: ${key}`);
  if (value.contract !== "agentic-workflow/skill-outcome") errors.push("contract must be agentic-workflow/skill-outcome");
  if (value.version !== 1) errors.push("version must be 1");
  if (typeof value.skill !== "string" || value.skill.length === 0) errors.push("skill must be a non-empty string");
  if (!(["completed", "continue", "blocked", "needs-input", "failed"] as const).includes(value.status as SkillOutcomeStatus)) {
    errors.push("status must be completed|continue|blocked|needs-input|failed");
  }
  if (typeof value.summary !== "string") errors.push("summary must be a string");
  if (!isObj(value.next)) {
    errors.push("next must be an object");
  } else {
    rejectUnexpectedKeys(value.next, "next", ["intent", "targets"], errors);
    if (!isWorkflowIntent(value.next.intent)) errors.push("next.intent must be a known workflow intent");
    if (!isStringArray(value.next.targets)) errors.push("next.targets must be an array of strings");
  }
  if (!Array.isArray(value.blockers)) {
    errors.push("blockers must be an array");
  } else {
    value.blockers.forEach((blocker, index) => {
      if (!isObj(blocker)) {
        errors.push(`blockers[${index}] must be an object`);
        return;
      }
      rejectUnexpectedKeys(blocker, `blockers[${index}]`, ["kind", "id", "scope", "detail"], errors);
      if (!isBlockerKind(blocker.kind)) errors.push(`blockers[${index}].kind is invalid`);
      if (typeof blocker.id !== "string") errors.push(`blockers[${index}].id must be a string`);
      if (!isBlockerScope(blocker.scope)) errors.push(`blockers[${index}].scope is invalid`);
      if (typeof blocker.detail !== "string") errors.push(`blockers[${index}].detail must be a string`);
    });
  }
  if (!Array.isArray(value.questions)) {
    errors.push("questions must be an array");
  } else {
    value.questions.forEach((question, index) => {
      if (!isObj(question)) {
        errors.push(`questions[${index}] must be an object`);
        return;
      }
      rejectUnexpectedKeys(question, `questions[${index}]`, ["id", "question", "options"], errors);
      if (typeof question.id !== "string") errors.push(`questions[${index}].id must be a string`);
      if (typeof question.question !== "string") errors.push(`questions[${index}].question must be a string`);
      if (!isStringArray(question.options)) errors.push(`questions[${index}].options must be an array of strings`);
    });
  }
  if (!Array.isArray(value.discoveries)) {
    errors.push("discoveries must be an array");
  } else {
    const discoveryKinds = ["defect", "risk", "opportunity", "environment", "scope-gap", "unknown"];
    const discoveryScopes = ["current-unit", "outside-unit", "run"];
    value.discoveries.forEach((discovery, index) => {
      if (!isObj(discovery)) {
        errors.push(`discoveries[${index}] must be an object`);
        return;
      }
      rejectUnexpectedKeys(
        discovery,
        `discoveries[${index}]`,
        ["kind", "scope", "summary", "evidence_refs", "proposed_intent"],
        errors,
      );
      if (!discoveryKinds.includes(discovery.kind as string)) errors.push(`discoveries[${index}].kind is invalid`);
      if (!discoveryScopes.includes(discovery.scope as string)) errors.push(`discoveries[${index}].scope is invalid`);
      if (typeof discovery.summary !== "string") errors.push(`discoveries[${index}].summary must be a string`);
      if (!isStringArray(discovery.evidence_refs)) errors.push(`discoveries[${index}].evidence_refs must be an array of strings`);
      if (!isWorkflowIntent(discovery.proposed_intent)) errors.push(`discoveries[${index}].proposed_intent is invalid`);
    });
  }
  if (!isStringArray(value.evidence_refs)) errors.push("evidence_refs must be an array of strings");
  return errors.length === 0
    ? { ok: true, outcome: value as unknown as SkillOutcome }
    : { ok: false, errors };
}

function nextIntent(command: string): WorkflowIntent {
  const match = /\/([a-z-]+)/.exec(command);
  switch (match?.[1]) {
    case "workflow-status":
      return "status";
    case "init-workspace":
    case "discover-repository-state":
    case "resolve-repository-state":
    case "design-feature":
    case "plan-feature":
    case "plan-fix":
    case "triage-issue":
    case "review-change":
    case "loop-review-fold":
    case "audit-pr":
      return match[1];
    case "merge":
      return "merge";
    case "execute-phase":
      return "execute-phase";
    default:
      return "none";
  }
}

function outcomeStatus(state: EnvelopeState): SkillOutcomeStatus {
  if (state === "BLOCKED") return "blocked";
  if (state === "NEEDS_INPUT") return "needs-input";
  if (state === "FAILED" || state === "HALT") return "failed";
  if (state === "CONTINUE" || state === "NEEDS_FIXES") return "continue";
  return "completed";
}

function outcomeFromEnvelope(envelope: Envelope): SkillOutcome {
  const intent = nextIntent(envelope.next.recommended);
  const targets = envelope.unit.id === null ? [] : [envelope.unit.id];
  return {
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill: envelope.skill,
    status: outcomeStatus(envelope.state),
    summary: envelope.summary,
    next: { intent, targets },
    blockers: envelope.blockers,
    questions:
      envelope.needs_input === null
        ? []
        : [{ id: "needs-input", question: envelope.needs_input.question, options: envelope.needs_input.options }],
    discoveries: [],
    evidence_refs: [],
  };
}

function parseLastJson(text: string): { ok: true; value: unknown } | { ok: false; error: string } {
  const raw = extractLastJsonBlock(text);
  if (raw === null) return { ok: false, error: "no fenced ```json block found" };
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch (error) {
    return { ok: false, error: `invalid JSON in last fenced block: ${(error as Error).message}` };
  }
}

function normalizeCompatibilityEnvelope(
  value: unknown,
  skill: string,
  context: TurnParseContext | undefined,
): { ok: true; envelope: unknown; diagnostics: TurnParseDiagnostic[] } | { ok: false; errors: string[]; diagnostics: TurnParseDiagnostic[] } {
  if (!isObj(value)) return { ok: false, errors: ["envelope is not a JSON object"], diagnostics: [] };
  const diagnostics: TurnParseDiagnostic[] = [];
  const normalized: Record<string, unknown> = { ...value };

  if (!("detail" in normalized)) {
    normalized.detail = null;
    diagnostics.push({ code: "detail-defaulted", detail: "Missing legacy detail was normalized to null." });
  }
  if ("design_candidates" in normalized) {
    if (normalized.detail !== null && normalized.detail !== undefined && !isObj(normalized.detail)) {
      return {
        ok: false,
        errors: ["legacy design_candidates cannot be moved into a non-object detail"],
        diagnostics,
      };
    }
    const detail = isObj(normalized.detail) ? { ...normalized.detail } : {};
    detail.design_candidates = normalized.design_candidates;
    normalized.detail = detail;
    delete normalized.design_candidates;
    diagnostics.push({ code: "design-candidates-moved", detail: "Legacy root design_candidates moved under detail." });
  }

  if (skill === "audit-pr") {
    if (isObj(normalized.unit) && typeof normalized.unit.id === "number") {
      const unitId = context?.unitId;
      if (unitId !== undefined && unitId.startsWith(`${normalized.unit.id}-`)) {
        normalized.unit = { ...normalized.unit, id: unitId };
        diagnostics.push({ code: "unit-id-from-context", detail: "Numeric legacy unit id matched trusted driver context." });
      }
    }
    if (isObj(normalized.findings) && typeof normalized.findings.issues_filed === "number") {
      if (normalized.findings.issues_filed === 0) {
        normalized.findings = { ...normalized.findings, issues_filed: [] };
        diagnostics.push({ code: "zero-issue-count", detail: "A zero legacy issue count was normalized to an empty identity list." });
      } else {
        return {
          ok: false,
          errors: [`issues_filed count ${normalized.findings.issues_filed} cannot be normalized without issue identities`],
          diagnostics,
        };
      }
    }
    if (Array.isArray(normalized.blockers)) {
      const mapped: unknown[] = [];
      for (const blocker of normalized.blockers) {
        if (
          isObj(blocker) &&
          typeof blocker.gate === "string" &&
          typeof blocker.evidence === "string" &&
          typeof blocker.route === "string"
        ) {
          mapped.push({ kind: "gate", id: blocker.gate, scope: "unit", detail: blocker.evidence });
          diagnostics.push({ code: "audit-pr-blocker-mapped", detail: `Native gate ${blocker.gate} mapped to a canonical blocker.` });
        } else {
          mapped.push(blocker);
        }
      }
      normalized.blockers = mapped;
    }
  }
  return { ok: true, envelope: normalized, diagnostics };
}

function parseNativeTurn(skill: string, text: string): TurnParseResult | null {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;
  const nextIndex = lines.findIndex((line) => /^→\s*Next:/i.test(line.trim()));
  if (nextIndex < 0) return null;
  const command = /^→\s*Next:\s*(\/[-a-z]+(?:\s+[^\n—]+)?)\s+—/i.exec(lines[nextIndex].trim())?.[1]?.trim();
  if (skill === "loop-review-fold") {
    const nextIsFinal = lines.slice(nextIndex + 1).every((line) => /^·/.test(line.trim()));
    if (!nextIsFinal || command === undefined || nextIntent(command) === "none") return null;
    const verdict = /^REVIEW-FOLD LOOP\s+[—-]\s+(PASS|TRIAGE-REQUIRED|BLOCKED)\s*$/i.exec(lines[0])?.[1]?.toUpperCase();
    if (verdict === undefined) return null;
    if (!lines.some((line) => /^Unit:\s*.+\s+·\s+PR:\s*\S+\s+·\s+HEAD:\s*\S+\s*$/i.test(line.trim()))) return null;
    if (!lines.some((line) => /^First action:\s*(PASS|review-change|fold-findings)\s*$/i.test(line.trim()))) return null;
    if (!lines.some((line) => /^Review:\s*(PASS|FAIL|not-run)\s+·\s+Fold:\s*(changed|unchanged|not-run)\s*$/i.test(line.trim()))) return null;
    if (!lines.some((line) => /^Unresolved:\s*(none|F\d+(?:\s*\+\s*F\d+)*)\s*$/i.test(line.trim()))) return null;
    if (!lines.some((line) => /^Evidence:\s*\S+/i.test(line.trim()))) return null;
    const status: SkillOutcomeStatus = verdict === "PASS" ? "completed" : verdict === "BLOCKED" ? "blocked" : "continue";
    return nativeOutcome(skill, status, `loop-review-fold returned ${verdict}.`, command, []);
  }
  if (skill === "audit-pr") {
    const auditBody = lines.slice(0, nextIndex).join("\n");
    const nextLines = lines.slice(nextIndex + 1);
    const nextIsFinal = nextLines.length > 0 && nextLines.every((line) => /^·/.test(line.trim()));
    const nextBulletCommand = nextLines
      .flatMap((line) => [...line.matchAll(/\/[-a-z]+(?:\s+--[-a-z]+(?:\s+\S+)?)?/g)].map((match) => match[0]))
      .find((value): value is string => value !== undefined && nextIntent(value) !== "none");
    if (!nextIsFinal || (command !== undefined && nextIntent(command) === "none") || (command === undefined && nextBulletCommand === undefined)) {
      return null;
    }
    if (!lines.some((line) => /^PR #\d+\s+[—-]\s+\S+/i.test(line.trim()))) return null;
    if (!lines.some((line) => /^URL:\s*https?:\/\/\S+$/i.test(line.trim()))) return null;
    if (!lines.some((line) => /^Base:\s*\S+\s+←\s+Head:\s*\S+\s+@\s+\S+\s+CI:\s*(green|failing|pending)\s*$/i.test(line.trim()))) return null;
    const verdicts = lines
      .slice(0, nextIndex)
      .map((line) => /^VERDICT:\s*(MERGE-READY|BLOCKED\s*\((\d+)\s+blockers?\))\s*$/i.exec(line.trim()))
      .filter((value): value is RegExpExecArray => value !== null);
    if (verdicts.length !== 1) return null;
    const verdict = verdicts[0]?.[1]?.toUpperCase();
    if (verdict === undefined) return null;
    const blockers: SkillOutcomeBlocker[] = [];
    for (const match of auditBody.matchAll(/^\s*\d+\.\s*\[([^\]\n]+)\]\s+([^—\n]+?)\s+[—-]\s+(.+?)(?:\s+→|\s*$)/gim)) {
      const label = match[1]?.trim();
      const reportedKind = label?.toLowerCase();
      const kind = isBlockerKind(reportedKind) ? reportedKind : "gate";
      const id = isBlockerKind(reportedKind) ? match[2]?.trim() : label;
      const detail = isBlockerKind(reportedKind)
        ? match[3]?.trim()
        : `${match[2]?.trim()} — ${match[3]?.trim()}`;
      if (id !== undefined && detail !== undefined) {
        blockers.push({ kind, id, scope: "unit", detail });
      }
    }
    const status: SkillOutcomeStatus = verdict.startsWith("MERGE-READY") ? "completed" : "blocked";
    const expectedBlockers = Number(verdicts[0]?.[2]);
    if (status === "blocked" && (!/^Blockers \(ranked\):$/im.test(auditBody) || blockers.length !== expectedBlockers)) {
      return {
        ok: false,
        errors: ["audit-pr BLOCKED verdict has no complete deterministic blocker rows"],
        diagnostics: [],
      };
    }
    if (status === "completed" && !lines.some((line) => /^Nothing blocks merge\.$/i.test(line.trim()))) return null;
    const rawBlockerRoute = /→\s*fix:?\s*[^\n(]*\((\/[-a-z]+(?:\s+[^\n)]*)?)\)/i.exec(auditBody)?.[1]?.trim();
    const blockerRoute = rawBlockerRoute !== undefined && nextIntent(rawBlockerRoute) !== "none" ? rawBlockerRoute : undefined;
    const nextCommand = status === "blocked" ? blockerRoute ?? command ?? nextBulletCommand : "/merge";
    if (nextCommand === undefined) return null;
    return nativeOutcome(skill, status, `audit-pr returned ${verdict}.`, nextCommand, blockers);
  }
  return null;
}

function nativeOutcome(
  skill: string,
  status: SkillOutcomeStatus,
  summary: string,
  command: string,
  blockers: SkillOutcomeBlocker[],
): TurnParseResult {
  return {
    ok: true,
    source: "native",
    envelope: null,
    diagnostics: [],
    outcome: {
      contract: "agentic-workflow/skill-outcome",
      version: 1,
      skill,
      status,
      summary,
      next: { intent: nextIntent(command), targets: [] },
      blockers,
      questions: [],
      discoveries: [],
      evidence_refs: [],
    },
  };
}

/**
 * Parses a machine result in strict precedence order. Compatibility mappings
 * are intentionally small and named; arbitrary prose is never promoted into
 * a workflow fact.
 */
export function parseTurn(input: ParseTurnInput): TurnParseResult {
  const profile = workflowSkillProfile(input.skill);
  if (profile === undefined) {
    return {
      ok: false,
      errors: [`unknown workflow skill: ${input.skill}`],
      diagnostics: [],
    };
  }
  const parsed = parseLastJson(input.text);
  if (parsed.ok) {
    const outcome = validateSkillOutcomeV1(parsed.value);
    if (outcome.ok) {
      if (profile.output !== "skill-outcome-v1") {
        return {
          ok: false,
          errors: [`${input.skill} requires an envelope-v2 result`],
          diagnostics: [],
        };
      }
      if (outcome.outcome.skill !== input.skill) {
        return { ok: false, errors: [`expected skill ${input.skill}, received ${outcome.outcome.skill}`], diagnostics: [] };
      }
      return { ok: true, source: "skill-outcome-v1", outcome: outcome.outcome, envelope: null, diagnostics: [] };
    }
    const strict = validateEnvelopeV2Strict(parsed.value);
    if (strict.ok) {
      if (strict.envelope.skill !== input.skill) {
        return { ok: false, errors: [`expected skill ${input.skill}, received ${strict.envelope.skill}`], diagnostics: [] };
      }
      return {
        ok: true,
        source: "envelope-v2-strict",
        outcome: outcomeFromEnvelope(strict.envelope),
        envelope: strict.envelope,
        diagnostics: [],
      };
    }
    const compatibility = normalizeCompatibilityEnvelope(parsed.value, input.skill, input.context);
    if (compatibility.ok) {
      const compatible = validateEnvelopeV2Strict(compatibility.envelope);
      if (compatible.ok) {
        if (compatible.envelope.skill !== input.skill) {
          return { ok: false, errors: [`expected skill ${input.skill}, received ${compatible.envelope.skill}`], diagnostics: compatibility.diagnostics };
        }
        return {
          ok: true,
          source: "envelope-v2-compat",
          outcome: outcomeFromEnvelope(compatible.envelope),
          envelope: compatible.envelope,
          diagnostics: compatibility.diagnostics,
        };
      }
      return { ok: false, errors: compatible.errors, diagnostics: compatibility.diagnostics };
    }
    return compatibility;
  }
  const native = parseNativeTurn(input.skill, input.text);
  if (native !== null) return native;
  return { ok: false, errors: ["no deterministic workflow result found"], diagnostics: [] };
}

/** Returns the smallest driver instruction appropriate for the selected skill. */
export function renderOutputInstruction(skill: string): string {
  const profile = workflowSkillProfile(skill);
  if (profile === undefined) throw new Error(`unknown workflow skill: ${skill}`);
  if (profile.output === "envelope-v2") {
    return [
      "Return exactly one final fenced JSON machine envelope matching agentic-workflow/envelope@2.",
      "detail is required; unit.id is a string or null; findings.issues_filed is an array of integers;",
      "blockers[] items are {kind, id, scope, detail}. Emit nothing after it.",
    ].join(" ");
  }
  return [
    "Return exactly one final fenced JSON object matching agentic-workflow/skill-outcome version 1.",
    `Set skill to ${JSON.stringify(skill)}.`,
    "Required keys: contract, version, skill, status, summary, next, blockers, questions, discoveries, evidence_refs.",
    "next is {intent, targets}; blockers[] items are {kind, id, scope, detail};",
    "questions[] items are {id, question, options}; discoveries[] items are {kind, scope, summary, evidence_refs, proposed_intent}.",
    "Use only a known workflow intent. Emit nothing after the JSON object.",
  ].join(" ");
}

export interface WorkflowDocument {
  path: string;
  content: string;
}

export interface WorkflowSnapshotInput {
  sourceRevision: string;
  repository: { branch: string; headSha: string; dirty: boolean };
  documents: WorkflowDocument[];
}

export interface SnapshotProvenance {
  field: string;
  source: string;
  line: number;
}

export interface SnapshotUnknown {
  field: string;
  reason: string;
}

export interface SnapshotContradiction {
  field: string;
  source: string;
  line: number;
  detail: string;
}

export interface WorkflowSnapshot {
  contract: "agentic-workflow/workflow-snapshot";
  version: 1;
  sourceRevision: string;
  repository: { branch: string; headSha: string; dirty: boolean };
  repositoryState: "missing" | "draft" | "frozen" | "contradicted" | "needs-input" | "unknown";
  unit: { kind: "feature" | "fix"; id: string; status: string } | null;
  phase: { current: string | null; total: number | null; completed: number | null; names: string[] };
  provenance: SnapshotProvenance[];
  contradictions: SnapshotContradiction[];
  unknowns: SnapshotUnknown[];
}

export type WorkflowSnapshotResult =
  | { ok: true; snapshot: WorkflowSnapshot }
  | { ok: false; errors: string[] };

function lineNumber(content: string, needle: string): number {
  const index = content.indexOf(needle);
  return index < 0 ? 1 : content.slice(0, index).split("\n").length;
}

function documentFor(documents: readonly WorkflowDocument[], suffix: string): WorkflowDocument | undefined {
  return documents.find((document) => document.path.endsWith(suffix));
}

function repositoryStateFrom(document: WorkflowDocument | undefined): WorkflowSnapshot["repositoryState"] {
  if (document === undefined) return "missing";
  const value = /(?:^|\n)Status:\s*([^\n\r]+)/i.exec(document.content)?.[1]?.trim().toLowerCase();
  if (value === "draft" || value === "frozen" || value === "contradicted" || value === "needs-input") return value;
  return "unknown";
}

function roadmapFeature(document: WorkflowDocument | undefined): { id: string; status: string; row: string } | null {
  if (document === undefined) return null;
  const candidates: Array<{ id: string; status: string; row: string }> = [];
  for (const row of document.content.split("\n")) {
    const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3 || !/^\d{2}$/.test(cells[0] ?? "")) continue;
    const slug = cells[1]?.replace(/^`|`$/g, "");
    if (slug === undefined || slug.length === 0) continue;
    const id = `${cells[0]}-${slug}`;
    candidates.push({ id, status: cells[2] ?? "unknown", row });
  }
  return candidates.find((candidate) => indexStatus(candidate.status) === "in-progress")
    ?? candidates.find((candidate) => indexStatus(candidate.status) !== "done")
    ?? null;
}

function indexStatus(value: string): string {
  return value.split("·", 1)[0]?.trim().toLowerCase() ?? "unknown";
}

function fixUnit(document: WorkflowDocument | undefined): { id: string; status: string; row: string } | null {
  if (document === undefined) return null;
  const candidates: Array<{ id: string; status: string; row: string }> = [];
  for (const row of document.content.split("\n")) {
    const cells = row.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    const id = cells[0]?.replace(/^`|`$/g, "") ?? "";
    if (!/^\d+-[A-Za-z0-9._-]+$/.test(id)) continue;
    candidates.push({ id, status: cells[2] ?? "unknown", row });
  }
  return candidates.find((candidate) => indexStatus(candidate.status) === "in-progress")
    ?? candidates.find((candidate) => indexStatus(candidate.status) !== "done")
    ?? null;
}

function phasesFrom(spec: WorkflowDocument | undefined): Array<{ id: string; name: string; line: string }> {
  if (spec === undefined) return [];
  const phases: Array<{ id: string; name: string; line: string }> = [];
  for (const line of spec.content.split("\n")) {
    const match = /^#{2,4}\s+(P\d+)\s+[—-]\s+(.+?)\s*$/.exec(line);
    if (match?.[1] && match[2]) phases.push({ id: match[1], name: `${match[1]} — ${match[2]}`, line });
  }
  return phases;
}

export type WorkflowSnapshotValidationResult =
  | { ok: true; snapshot: WorkflowSnapshot }
  | { ok: false; errors: string[] };

/** Validates the strict, deterministic WorkflowSnapshot v1 JSON contract. */
export function validateWorkflowSnapshotV1(value: unknown): WorkflowSnapshotValidationResult {
  if (!isObj(value)) return { ok: false, errors: ["workflow snapshot is not a JSON object"] };
  const errors: string[] = [];
  const required = [
    "contract",
    "version",
    "sourceRevision",
    "repository",
    "repositoryState",
    "unit",
    "phase",
    "provenance",
    "contradictions",
    "unknowns",
  ];
  for (const key of required) if (!(key in value)) errors.push(`missing required key: ${key}`);
  const allowed = new Set(required);
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`unexpected top-level key: ${key}`);
  if (value.contract !== "agentic-workflow/workflow-snapshot") {
    errors.push("contract must be agentic-workflow/workflow-snapshot");
  }
  if (value.version !== 1) errors.push("version must be 1");
  if (typeof value.sourceRevision !== "string" || value.sourceRevision.length === 0) {
    errors.push("sourceRevision must be a non-empty string");
  }
  if (!isObj(value.repository)) {
    errors.push("repository must be an object");
  } else {
    rejectUnexpectedKeys(value.repository, "repository", ["branch", "headSha", "dirty"], errors);
    if (typeof value.repository.branch !== "string") errors.push("repository.branch must be a string");
    if (typeof value.repository.headSha !== "string") errors.push("repository.headSha must be a string");
    if (typeof value.repository.dirty !== "boolean") errors.push("repository.dirty must be a boolean");
  }
  const repositoryStates = ["missing", "draft", "frozen", "contradicted", "needs-input", "unknown"];
  if (!repositoryStates.includes(value.repositoryState as string)) errors.push("repositoryState is invalid");
  if (value.unit !== null) {
    if (!isObj(value.unit)) {
      errors.push("unit must be an object or null");
    } else {
      rejectUnexpectedKeys(value.unit, "unit", ["kind", "id", "status"], errors);
      if (value.unit.kind !== "feature" && value.unit.kind !== "fix") errors.push("unit.kind must be feature|fix");
      if (typeof value.unit.id !== "string") errors.push("unit.id must be a string");
      if (typeof value.unit.status !== "string") errors.push("unit.status must be a string");
    }
  }
  if (!isObj(value.phase)) {
    errors.push("phase must be an object");
  } else {
    rejectUnexpectedKeys(value.phase, "phase", ["current", "total", "completed", "names"], errors);
    if (!isStringOrNull(value.phase.current)) errors.push("phase.current must be a string or null");
    if (!isIntOrNull(value.phase.total)) errors.push("phase.total must be an integer or null");
    if (!isIntOrNull(value.phase.completed)) errors.push("phase.completed must be an integer or null");
    if (!isStringArray(value.phase.names)) errors.push("phase.names must be an array of strings");
  }
  const validateEntries = (
    raw: unknown,
    field: "provenance" | "contradictions" | "unknowns",
    keys: readonly string[],
    check: (entry: Record<string, unknown>, index: number) => void,
  ): void => {
    if (!Array.isArray(raw)) {
      errors.push(`${field} must be an array`);
      return;
    }
    raw.forEach((entry, index) => {
      if (!isObj(entry)) {
        errors.push(`${field}[${index}] must be an object`);
        return;
      }
      rejectUnexpectedKeys(entry, `${field}[${index}]`, keys, errors);
      check(entry, index);
    });
  };
  validateEntries(value.provenance, "provenance", ["field", "source", "line"], (entry, index) => {
    if (typeof entry.field !== "string") errors.push(`provenance[${index}].field must be a string`);
    if (typeof entry.source !== "string") errors.push(`provenance[${index}].source must be a string`);
    if (typeof entry.line !== "number" || !Number.isInteger(entry.line) || entry.line < 1) {
      errors.push(`provenance[${index}].line must be a positive integer`);
    }
  });
  validateEntries(value.contradictions, "contradictions", ["field", "source", "line", "detail"], (entry, index) => {
    if (typeof entry.field !== "string") errors.push(`contradictions[${index}].field must be a string`);
    if (typeof entry.source !== "string") errors.push(`contradictions[${index}].source must be a string`);
    if (typeof entry.line !== "number" || !Number.isInteger(entry.line) || entry.line < 1) {
      errors.push(`contradictions[${index}].line must be a positive integer`);
    }
    if (typeof entry.detail !== "string") errors.push(`contradictions[${index}].detail must be a string`);
  });
  validateEntries(value.unknowns, "unknowns", ["field", "reason"], (entry, index) => {
    if (typeof entry.field !== "string") errors.push(`unknowns[${index}].field must be a string`);
    if (typeof entry.reason !== "string") errors.push(`unknowns[${index}].reason must be a string`);
  });
  return errors.length === 0
    ? { ok: true, snapshot: value as unknown as WorkflowSnapshot }
    : { ok: false, errors };
}

/**
 * Compiles only facts represented by the versioned workflow documents passed
 * in by the caller. It performs no filesystem or Git I/O and records source
 * locations for every value it derives.
 */
export function compileWorkflowSnapshot(input: WorkflowSnapshotInput): WorkflowSnapshotResult {
  const repositoryStateDocument = documentFor(input.documents, "docs/workflow/REPOSITORY_STATE.md");
  const roadmapDocument = documentFor(input.documents, "docs/features/ROADMAP.md");
  const feature = roadmapFeature(roadmapDocument);
  const fixIndexDocument = documentFor(input.documents, "docs/fix/README.md");
  const fix = feature === null ? fixUnit(fixIndexDocument) : null;
  const selected = feature ?? fix;
  const selectedKind = feature === null && fix !== null ? "fix" : "feature";
  const provenance: SnapshotProvenance[] = [];
  const contradictions: SnapshotContradiction[] = [];
  const unknowns: SnapshotUnknown[] = [];
  const repositoryState = repositoryStateFrom(repositoryStateDocument);
  if (repositoryStateDocument !== undefined) {
    provenance.push({
      field: "repositoryState",
      source: repositoryStateDocument.path,
      line: lineNumber(repositoryStateDocument.content, "Status:"),
    });
    if (repositoryState === "unknown") {
      unknowns.push({ field: "repositoryState", reason: "REPOSITORY_STATE.md does not declare a recognized status." });
    }
  } else {
    unknowns.push({ field: "repositoryState", reason: "REPOSITORY_STATE.md is absent." });
  }
  if (repositoryState === "contradicted" && repositoryStateDocument !== undefined) {
    contradictions.push({
      field: "repositoryState",
      source: repositoryStateDocument.path,
      line: lineNumber(repositoryStateDocument.content, "Status:"),
      detail: "REPOSITORY_STATE.md declares the repository state contradicted.",
    });
  }
  if (selected === null) {
    unknowns.push({ field: "unit", reason: "No feature row could be read from ROADMAP.md." });
  } else if (selectedKind === "feature" && roadmapDocument !== undefined) {
    provenance.push({ field: "unit", source: roadmapDocument.path, line: lineNumber(roadmapDocument.content, selected.row) });
  } else if (selectedKind === "fix" && fixIndexDocument !== undefined) {
    provenance.push({ field: "unit", source: fixIndexDocument.path, line: lineNumber(fixIndexDocument.content, selected.row) });
  }

  const spec = selected === null
    ? undefined
    : documentFor(
        input.documents,
        selectedKind === "feature"
          ? `docs/features/${selected.id}/SPEC.md`
          : `docs/fix/${selected.id}/SPEC.md`,
      );
  const phases = phasesFrom(spec);
  const hasPhaseDefinitions = spec !== undefined && phases.length > 0;
  const phaseDefinitionReason = spec === undefined
    ? "The active unit SPEC.md is absent."
    : "The active unit SPEC.md has no recognized phase headings.";
  if (selected !== null && !hasPhaseDefinitions) {
    unknowns.push({ field: "phase.names", reason: phaseDefinitionReason });
    unknowns.push({ field: "phase.total", reason: phaseDefinitionReason });
  }
  const progress = selected === null
    ? undefined
    : documentFor(
        input.documents,
        selectedKind === "feature"
          ? `docs/features/${selected.id}/progress.md`
          : `docs/fix/${selected.id}/progress.md`,
      );
  const phaseIds = new Set(phases.map((phase) => phase.id));
  const completedIds = new Set<string>();
  const unknownCompletedIds = new Set<string>();
  const doneReceiptLines: string[] = [];
  if (progress !== undefined) {
    for (const match of progress.content.matchAll(/(?:^|\n)-\s*Done:\s*(P\d+)\b/g)) {
      if (match[1] && phaseIds.has(match[1])) completedIds.add(match[1]);
      if (match[1] && !phaseIds.has(match[1])) unknownCompletedIds.add(match[1]);
      if (match[1]) doneReceiptLines.push(match[1]);
    }
  }
  const remains = progress === undefined ? undefined : /(?:^|\n)-\s*Remains:\s*(P\d+)\b/.exec(progress.content)?.[1];
  const current = remains !== undefined && phaseIds.has(remains) ? remains : null;
  if (selected !== null && !hasPhaseDefinitions) {
    unknowns.push({ field: "phase.current", reason: phaseDefinitionReason });
  } else if (remains !== undefined && !phaseIds.has(remains)) {
    unknowns.push({ field: "phase.current", reason: `Progress names unknown phase ${remains}.` });
  } else if (current !== null && progress !== undefined) {
    provenance.push({ field: "phase.current", source: progress.path, line: lineNumber(progress.content, `Remains: ${current}`) });
  } else if (phases.length > 0) {
    unknowns.push({ field: "phase.current", reason: "No explicit remaining phase receipt was found." });
  }
  if (hasPhaseDefinitions && spec !== undefined) {
    const specLine = lineNumber(spec.content, phases[0]?.line ?? "");
    provenance.push({ field: "phase.names", source: spec.path, line: specLine });
    provenance.push({ field: "phase.total", source: spec.path, line: specLine });
  }
  let completed: number | null = null;
  if (selected !== null && !hasPhaseDefinitions) {
    unknowns.push({ field: "phase.completed", reason: phaseDefinitionReason });
  } else if (progress !== undefined && doneReceiptLines.length > 0 && unknownCompletedIds.size === 0) {
    completed = completedIds.size;
    provenance.push({
      field: "phase.completed",
      source: progress.path,
      line: lineNumber(progress.content, `Done: ${doneReceiptLines[0]}`),
    });
  } else if (phases.length > 0) {
    const reason = unknownCompletedIds.size > 0
      ? `Progress names unknown completed phase(s): ${[...unknownCompletedIds].join(", ")}.`
      : "No explicit completed phase receipt was found.";
    unknowns.push({ field: "phase.completed", reason });
  }

  const snapshot: WorkflowSnapshot = {
    contract: "agentic-workflow/workflow-snapshot",
    version: 1,
    sourceRevision: input.sourceRevision,
    repository: input.repository,
    repositoryState,
    unit: selected === null ? null : { kind: selectedKind, id: selected.id, status: selected.status },
    phase: {
      current,
      total: phases.length === 0 ? null : phases.length,
      completed,
      names: phases.map((phase) => phase.name),
    },
    provenance,
    contradictions,
    unknowns,
  };
  const validation = validateWorkflowSnapshotV1(snapshot);
  return validation.ok
    ? { ok: true, snapshot: validation.snapshot }
    : { ok: false, errors: validation.errors };
}
