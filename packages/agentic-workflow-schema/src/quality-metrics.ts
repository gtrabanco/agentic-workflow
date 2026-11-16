/**
 * The project-quality sensor's canonical document (`quality-metrics@1`) —
 * feature 558, issue #565.
 *
 * `workflow-status` measures workflow *state*; this measures workflow *quality*:
 * the DORA four keys plus the reversion ratio, computed from git history and
 * forge data and published as one fixed envelope. The journal-entry and
 * batch-plan precedent applies here — one versioned document, a contract id, a
 * dependency-free validator, closed vocabularies, and a draft-07 JSON Schema
 * (`quality-metrics.schema.json`) the package suite compiles and pins.
 *
 * Three rules the shape enforces rather than documents:
 *
 *   * **Core is closed, wholly.** An unknown key at the top level, inside a
 *     metric row or inside a metric's components is refused. There is no
 *     `metadata` escape: anything a consumer needs beyond the document is a
 *     version bump, never an open map.
 *   * **A confidence label is a claim, not decoration.** `unavailable` requires
 *     `value: null` and a declared `reason`; `measured`/`derived` require a real
 *     value and no reason. A zero can therefore never be presented as a
 *     measurement it is not (issue #565's fail-closed requirement).
 *   * **The metric owns its unit and its components.** A producer cannot report
 *     hours as a ratio or smuggle a component of another metric into a row.
 */

/** The contract id of the quality-metrics document. */
export const QUALITY_METRICS_CONTRACT_ID = "agentic-workflow/quality-metrics";

/** The schema token printed in the document's `schema` field. */
export const QUALITY_METRICS_SCHEMA = "quality-metrics@1";

/** The version constant: adding or changing a core field bumps this. */
export const QUALITY_METRICS_VERSION = 1;

/**
 * The closed metric-name set, in the order the definitions document them.
 *
 * `/reversion_ratio/` is the mapped talk's "% of commits reverted" read as the
 * revert commits themselves (no linkage needed); the reverted-*deploy* view is
 * `change_failure_rate`'s numerator. `escaped_defects` is a slot: it reports the
 * findings corpus' open rows when the corpus exists and `unavailable` otherwise.
 */
export const QUALITY_METRIC_NAMES = [
  "reversion_ratio",
  "change_failure_rate",
  "lead_time_for_change",
  "pr_volume",
  "review_latency",
  "escaped_defects",
] as const;
export type QualityMetricName = (typeof QUALITY_METRIC_NAMES)[number];

/**
 * The closed confidence vocabulary. `measured` — every observation behind the
 * value was read directly; `derived` — the value rests on a documented heuristic
 * or a bounded sample; `unavailable` — the data needed is absent, and the row
 * names why instead of inventing a zero.
 */
export const QUALITY_CONFIDENCES = ["measured", "derived", "unavailable"] as const;
export type QualityConfidence = (typeof QUALITY_CONFIDENCES)[number];

/** The closed unit vocabulary: a ratio (0..1), a duration in hours, or a count. */
export const QUALITY_METRIC_UNITS = ["ratio", "hours", "count"] as const;
export type QualityMetricUnit = (typeof QUALITY_METRIC_UNITS)[number];

/**
 * The components each metric reports beside its value — the evidence a reader
 * audits the number against. Closed per metric: `deploys` belongs to the
 * change-failure rate and nowhere else.
 */
export const QUALITY_METRIC_COMPONENTS = Object.freeze({
  reversion_ratio: ["revert_commits", "total_commits"],
  change_failure_rate: ["reverted_deploys", "deploys"],
  lead_time_for_change: ["merged_pulls", "sampled_pulls"],
  pr_volume: ["opened_pulls", "merged_pulls"],
  review_latency: ["reviewed_pulls", "opened_pulls"],
  escaped_defects: ["open_findings", "unit_docs"],
} as const);

/** The unit each metric reports in — fixed by the metric, never chosen by a producer. */
export const QUALITY_METRIC_UNITS_BY_NAME = Object.freeze({
  reversion_ratio: "ratio",
  change_failure_rate: "ratio",
  lead_time_for_change: "hours",
  pr_volume: "count",
  review_latency: "hours",
  escaped_defects: "count",
} as const);

/** The published bounds the validator enforces. */
export const QUALITY_METRICS_LIMITS = Object.freeze({
  /** One day: a shorter window measures nothing. */
  minWindowDays: 1,
  /** Ten years: past this a "trailing window" is the whole history, which is a different metric. */
  maxWindowDays: 3650,
  /** One readable line per row; the definitions carry the prose. */
  maxDetail: 512,
  /** Source degradations are enumerated by cause, never accumulated. */
  maxDegradations: 16,
});

/** A metric's evidence counts, keyed by the metric's own closed component set. */
export type QualityMetricComponents = Readonly<Record<string, number | null>>;

/** One metric row: the value, the label that says how far to trust it, and its evidence. */
export interface QualityMetricRow {
  confidence: QualityConfidence;
  value: number | null;
  unit: QualityMetricUnit;
  /** The declared cause when `confidence` is `unavailable`; `null` otherwise. */
  reason: string | null;
  detail: string;
  components: QualityMetricComponents;
}

/** The measured window: trailing `days` ending at `until`. */
export interface QualityMetricsWindow {
  days: number;
  since: string;
  until: string;
}

/** The canonical quality-metrics document. */
export interface QualityMetricsDocument {
  contract: string;
  version: number;
  schema: string;
  source_revision: string | null;
  window: QualityMetricsWindow;
  degraded: string[];
  metrics: Record<QualityMetricName, QualityMetricRow>;
}

/** What a validator run answers: `errors` is empty exactly when `ok` is true. */
export interface QualityMetricsValidationResult {
  ok: boolean;
  errors: string[];
}

// ---------------------------------------------------------------------------
// Grammars
// ---------------------------------------------------------------------------

/** `unavailable-<source>-<cause>` — the sensor convention the sibling sensors use. */
const DEGRADATION = /^unavailable-[a-z0-9-]+$/u;
/** A zero-observation reason: the sources answered and the denominator is zero. */
const ZERO_OBSERVATION = /^no-[a-z0-9-]+$/u;
/** A UTC instant at second or millisecond precision — the one form the window compares. */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u;
/** A git revision (abbreviated or full). */
const REVISION = /^[0-9a-f]{7,40}$/u;
const DAY_MS = 86_400_000;

const CONTRACT_KEYS = ["contract", "version", "schema", "source_revision", "window", "degraded", "metrics"] as const;
const ROW_KEYS = ["confidence", "value", "unit", "reason", "detail", "components"] as const;
const WINDOW_KEYS = ["days", "since", "until"] as const;

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnexpectedKeys(
  value: Record<string, unknown>,
  label: string,
  allowed: readonly string[],
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) errors.push(`${label} has an unexpected key "${key}"`);
  }
}

const present = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

/** A non-negative integer, or `null` — the two shapes a component cell may carry. */
function isComponentValue(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isInteger(value) && value >= 0);
}

function checkWindow(value: unknown, errors: string[]): void {
  if (!isObj(value)) {
    errors.push("window must be an object");
    return;
  }
  rejectUnexpectedKeys(value, "window", WINDOW_KEYS, errors);
  for (const key of WINDOW_KEYS) if (!present(value, key)) errors.push(`window.${key} is missing`);
  const { minWindowDays, maxWindowDays } = QUALITY_METRICS_LIMITS;

  const days = value.days;
  const daysValid =
    typeof days === "number" &&
    Number.isInteger(days) &&
    days >= minWindowDays &&
    days <= maxWindowDays;
  if (!daysValid) {
    errors.push(`window.days must be an integer in ${minWindowDays}..${maxWindowDays}`);
  }

  const instants: Array<{ key: "since" | "until"; ms: number }> = [];
  for (const key of ["since", "until"] as const) {
    const text = value[key];
    if (typeof text !== "string" || !INSTANT.test(text)) {
      errors.push(`window.${key} must be a UTC ISO-8601 instant (…Z)`);
      continue;
    }
    const ms = Date.parse(text);
    if (Number.isNaN(ms)) errors.push(`window.${key} is not a parseable instant`);
    else instants.push({ key, ms });
  }

  if (daysValid && instants.length === 2) {
    const since = instants.find((entry) => entry.key === "since")?.ms ?? Number.NaN;
    const until = instants.find((entry) => entry.key === "until")?.ms ?? Number.NaN;
    if (!Number.isNaN(since) && !Number.isNaN(until) && since !== until - days * DAY_MS) {
      errors.push("window.since must be exactly window.days before window.until");
    }
  }
}

function checkDegraded(value: unknown, errors: string[]): Set<string> {
  const codes = new Set<string>();
  if (!Array.isArray(value)) {
    errors.push("degraded must be an array");
    return codes;
  }
  if (value.length > QUALITY_METRICS_LIMITS.maxDegradations) {
    errors.push(`degraded exceeds ${QUALITY_METRICS_LIMITS.maxDegradations} entries`);
  }
  for (const code of value) {
    if (typeof code !== "string" || !DEGRADATION.test(code)) {
      errors.push(`each degraded entry must match unavailable-<source>-<cause> (got ${JSON.stringify(code)})`);
      continue;
    }
    if (codes.has(code)) errors.push(`degraded repeats ${code}`);
    codes.add(code);
  }
  return codes;
}

function checkRow(
  name: QualityMetricName,
  value: unknown,
  degraded: Set<string>,
  errors: string[],
): void {
  const label = `metrics.${name}`;
  if (!isObj(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  rejectUnexpectedKeys(value, label, ROW_KEYS, errors);
  for (const key of ROW_KEYS) if (!present(value, key)) errors.push(`${label}.${key} is missing`);

  const confidence = value.confidence;
  const known = (QUALITY_CONFIDENCES as readonly string[]).includes(String(confidence));
  if (!known) errors.push(`${label}.confidence must be one of ${QUALITY_CONFIDENCES.join(", ")} (got ${JSON.stringify(confidence)})`);

  const unit = value.unit;
  const expectedUnit = QUALITY_METRIC_UNITS_BY_NAME[name];
  if (unit !== expectedUnit) errors.push(`${label}.unit must be ${expectedUnit} (got ${JSON.stringify(unit)})`);

  // Confidence ↔ value ↔ reason: the three move together or the row is refused.
  if (confidence === "unavailable") {
    if (value.value !== null) errors.push(`${label}.value must be null when confidence is unavailable`);
    if (typeof value.reason !== "string" || value.reason === "") {
      errors.push(`${label}.reason must name why the metric is unavailable`);
    }
  } else if (known) {
    if (value.value === null) errors.push(`${label}.value must be a number when confidence is ${String(confidence)}`);
    if (value.reason !== null) errors.push(`${label}.reason must be null unless confidence is unavailable`);
  }

  const number = value.value;
  if (typeof number === "number" && !Number.isFinite(number)) errors.push(`${label}.value must be finite`);
  if (typeof number === "number" && Number.isFinite(number)) {
    if (unit === "ratio" && (number < 0 || number > 1)) errors.push(`${label}.value must be a ratio in 0..1`);
    if (unit === "hours" && number < 0) errors.push(`${label}.value must be a non-negative duration`);
    if (unit === "count" && (!Number.isInteger(number) || number < 0)) errors.push(`${label}.value must be a non-negative integer count`);
  } else if (number !== null) {
    errors.push(`${label}.value must be a number or null`);
  }

  const detail = value.detail;
  if (typeof detail !== "string" || detail.trim() === "") errors.push(`${label}.detail must be a non-empty string`);
  else if (detail.length > QUALITY_METRICS_LIMITS.maxDetail) {
    errors.push(`${label}.detail exceeds ${QUALITY_METRICS_LIMITS.maxDetail} characters`);
  }

  if (typeof value.reason === "string" && value.reason !== "") {
    const reason = value.reason;
    const zeroObservation = ZERO_OBSERVATION.test(reason);
    if (reason.startsWith("unavailable-")) {
      if (!DEGRADATION.test(reason)) errors.push(`${label}.reason must match unavailable-<source>-<cause>`);
      else if (!degraded.has(reason)) {
        errors.push(`${label}.reason ${reason} is a degradation the document does not declare in degraded`);
      }
    } else if (!zeroObservation) {
      errors.push(`${label}.reason must be a declared degradation or a no-<observation> code (got ${JSON.stringify(reason)})`);
    }
  }

  const components = value.components;
  if (!isObj(components)) {
    errors.push(`${label}.components must be an object`);
    return;
  }
  const declared = QUALITY_METRIC_COMPONENTS[name];
  for (const key of Object.keys(components)) {
    if (!(declared as readonly string[]).includes(key)) {
      errors.push(`${label}.components.${key} is not a component of ${name}`);
    }
  }
  for (const key of declared) {
    if (!present(components, key)) {
      errors.push(`${label}.components.${key} is missing`);
      continue;
    }
    if (!isComponentValue(components[key])) {
      errors.push(`${label}.components.${key} must be a non-negative integer or null`);
    }
  }
}

/**
 * Validate one quality-metrics document.
 *
 * Pure, dependency-free and total: it reads the value it is given and answers
 * every rule it can judge, so one run names every defect instead of the first.
 */
export function validateQualityMetrics(value: unknown): QualityMetricsValidationResult {
  const errors: string[] = [];
  if (!isObj(value)) return { ok: false, errors: ["quality metrics is not a JSON object"] };

  rejectUnexpectedKeys(value, "quality metrics", CONTRACT_KEYS, errors);
  for (const key of CONTRACT_KEYS) if (!present(value, key)) errors.push(`${key} is missing`);

  if (value.contract !== QUALITY_METRICS_CONTRACT_ID) errors.push(`contract must be ${QUALITY_METRICS_CONTRACT_ID}`);
  if (value.version !== QUALITY_METRICS_VERSION) errors.push(`version must be ${QUALITY_METRICS_VERSION}`);
  if (value.schema !== QUALITY_METRICS_SCHEMA) errors.push(`schema must be ${QUALITY_METRICS_SCHEMA}`);

  const revision = value.source_revision;
  if (revision !== null && (typeof revision !== "string" || !REVISION.test(revision))) {
    errors.push("source_revision must be a git revision (7-40 lowercase hex) or null");
  }

  checkWindow(value.window, errors);
  const degraded = checkDegraded(value.degraded, errors);

  if (!isObj(value.metrics)) {
    errors.push("metrics must be an object");
    return { ok: false, errors };
  }
  for (const key of Object.keys(value.metrics)) {
    if (!(QUALITY_METRIC_NAMES as readonly string[]).includes(key)) {
      errors.push(`metrics.${key} is not a published metric name`);
    }
  }
  for (const name of QUALITY_METRIC_NAMES) {
    if (!present(value.metrics, name)) {
      errors.push(`metrics.${name} is missing`);
      continue;
    }
    checkRow(name, value.metrics[name], degraded, errors);
  }

  return { ok: errors.length === 0, errors };
}
