/**
 * telemetry.ts — the session sample's published vocabulary (issue #504, unit
 * `docs/features/494-telemetry-by-turn/`).
 *
 * The accumulator in `@gtrabanco/pi-agentic-workflow` measures a session; this
 * module is the one home for *what a sample is*, so the three projections that
 * read it — the `tier-cost@2` ledger columns, the per-session JSONL line and the
 * committed JSON Schema — cannot drift from each other. A field added to one of
 * them and not the others is the defect that made this module exist.
 *
 * Three rules:
 *
 *  - **The phase vocabulary is closed in both directions.** A label that names
 *    no command is dead and a command with no label is unmeasurable; the
 *    coverage test (`scripts/telemetry-coverage.test.mjs`) crosses this list
 *    against the repository's real command surface, and the invariant is
 *    "new command → register telemetry; delete command → remove telemetry;
 *    rename command → update telemetry".
 *  - **The field list is the ledger's column order.** `TELEMETRY_SAMPLE_FIELDS`
 *    is what the `@2` grammar declares and what a sample object carries, in the
 *    same order, so a reader that trusts one and a writer that trusts the other
 *    agree by construction.
 *  - **Data, never prose.** The schema carries types and required fields. No
 *    `description`, no `$comment`: an explanation belongs in the ledger's
 *    documentation, never in the telemetry output.
 */

/**
 * Every command that can name a telemetry phase, in workflow order.
 *
 * Sixteen user-invocable skills (`skills/<name>/SKILL.md` with
 * `user-invocable: true`) plus the four native command names the Pi package
 * registers in code. A label is a command's own name, because a sample names
 * what the operator dispatched.
 */
export const PHASE_LABELS = Object.freeze([
  // Setup.
  "init-workspace",
  // Design, plan and route.
  "unit-lane",
  "triage-issue",
  "batch-scheduler",
  "discover-repository-state",
  "resolve-repository-state",
  // Execute.
  "execute-phase",
  "fold-findings",
  // Review and audit.
  "review-change",
  "audit-pr",
  "audit-docs",
  "product-audit",
  "agentic-workflow-doctor",
  "aw-doctor",
  // Document.
  "log-session",
  // Session and autopilot.
  "advance",
  "workflow-status",
  // Native commands registered by the package in code.
  "aw-index",
  "agentic-workflow-settings",
  "aw-settings",
] as const);

/** The five provider usage fields the sample breaks `tokens` down into. */
export const TELEMETRY_TOKEN_FIELDS = Object.freeze([
  "input_tokens",
  "output_tokens",
  "cache_read_tokens",
  "cache_write_tokens",
  "reasoning_tokens",
] as const);

/**
 * The sample's sixteen fields, in the order the `tier-cost@2` ledger declares
 * them: the identity of the work, then the provider's counts, then the
 * runtime's, then the provenance. The `tier-cost@1` eight are all still here —
 * the widening is additive at the row level, which is what lets a `@1` ledger
 * keep being written without a sample that lost anything.
 */
export const TELEMETRY_SAMPLE_FIELDS = Object.freeze([
  "unit",
  "phase",
  "version",
  "model",
  "changed_paths",
  "tokens",
  "turns",
  ...TELEMETRY_TOKEN_FIELDS,
  "model_ms",
  "tool_ms",
  "observed",
  "source",
] as const);

/** The fields whose value is a count: a non-negative integer, never a float. */
const INTEGER_FIELDS = new Set<string>([
  "changed_paths",
  "tokens",
  "turns",
  ...TELEMETRY_TOKEN_FIELDS,
  "model_ms",
  "tool_ms",
]);

/** The fields a sample may leave unnamed — the interface declares them nullable. */
const NULLABLE_FIELDS = new Set<string>(["phase", "version", "model"]);

/** One property's schema, derived from the field's own name and kind. */
function propertyFor(field: string): Record<string, unknown> {
  if (INTEGER_FIELDS.has(field)) return { type: "integer", minimum: 0 };
  const type: string | string[] = NULLABLE_FIELDS.has(field) ? ["string", "null"] : "string";
  if (field === "observed") return { type, pattern: "^\\d{4}-\\d{2}-\\d{2}$" };
  return { type };
}

/** The shape `telemetrySampleJsonSchema()` answers; plain data, never a class. */
export interface TelemetrySampleJsonSchema {
  $schema: string;
  $id: string;
  type: "object";
  additionalProperties: false;
  required: string[];
  properties: Record<string, Record<string, unknown>>;
}

/**
 * The JSON Schema of one sample — the document `docs/telemetry/schema.json`
 * carries and the per-session JSONL line satisfies.
 *
 * It is *derived* from `TELEMETRY_SAMPLE_FIELDS` on every call, so the committed
 * projection can only be this object and a field added to the list can never
 * land in one place only.
 */
export function telemetrySampleJsonSchema(): TelemetrySampleJsonSchema {
  const properties: Record<string, Record<string, unknown>> = {};
  for (const field of TELEMETRY_SAMPLE_FIELDS) properties[field] = propertyFor(field);
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "telemetry-sample@1",
    type: "object",
    additionalProperties: false,
    required: [...TELEMETRY_SAMPLE_FIELDS],
    properties,
  };
}
