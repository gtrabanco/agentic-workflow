/**
 * quality-metrics.test.mjs — the `quality-metrics@1` contract (feature 558,
 * issue #565, unit docs/features/558-quality-sensor/).
 *
 * The corpus was observed RED before `src/quality-metrics.ts` existed: it
 * exports none of the consts this suite imports, so the suite cannot load. The
 * contract it pins:
 *
 *  - **One versioned document**, the batch-plan/journal-entry precedent:
 *    contract id + version + the convenience `schema` token.
 *  - **Core is closed, wholly.** No `metadata` escape: an unknown key anywhere —
 *    top level, a metric row, a component — is refused.
 *  - **Six metrics, three confidences, three units**: the closed vocabularies a
 *    consumer switches on, published as const arrays.
 *  - **A confidence label is not decoration.** `unavailable` requires
 *    `value: null` and a declared `reason`; anything else requires a real value
 *    and no reason. A zero presented as a measurement cannot be expressed.
 *  - **The JSON Schema and the validator agree.** Every document the validator
 *    accepts must compile and validate under strict Ajv, and every document it
 *    refuses must be refused by the schema too.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import Ajv from "ajv";

import {
  QUALITY_METRICS_CONTRACT_ID,
  QUALITY_METRICS_LIMITS,
  QUALITY_METRICS_SCHEMA,
  QUALITY_METRICS_VERSION,
  QUALITY_METRIC_COMPONENTS,
  QUALITY_METRIC_NAMES,
  QUALITY_CONFIDENCES,
  QUALITY_METRIC_UNITS,
  validateQualityMetrics,
} from "../dist/index.js";

const packageRoot = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(readFileSync(`${packageRoot}/quality-metrics.schema.json`, "utf8"));
const ajv = new Ajv({ strict: true });
const schemaValidates = ajv.compile(schema);

/** The canonical vector: every metric, every confidence, every unit exercised. */
const CANONICAL = {
  contract: QUALITY_METRICS_CONTRACT_ID,
  version: QUALITY_METRICS_VERSION,
  schema: QUALITY_METRICS_SCHEMA,
  source_revision: "d1287c3d0a0f0f4a8b0c1d2e3f405162738495a6",
  window: { days: 90, since: "2026-08-18T00:00:00.000Z", until: "2026-11-16T00:00:00.000Z" },
  degraded: ["unavailable-forge-missing-cli", "unavailable-findings-corpus"],
  metrics: {
    reversion_ratio: {
      confidence: "derived",
      value: 0.25,
      unit: "ratio",
      reason: null,
      detail: "1 revert commit of 4 commits in the window",
      components: { revert_commits: 1, total_commits: 4 },
    },
    change_failure_rate: {
      confidence: "derived",
      value: 0.5,
      unit: "ratio",
      reason: null,
      detail: "1 of 2 deploys merged in the window was reverted",
      components: { reverted_deploys: 1, deploys: 2 },
    },
    lead_time_for_change: {
      confidence: "measured",
      value: 10.5,
      unit: "hours",
      reason: null,
      detail: "median of 2 merged pulls inside the window",
      components: { merged_pulls: 2, sampled_pulls: 2 },
    },
    pr_volume: {
      confidence: "measured",
      value: 3,
      unit: "count",
      reason: null,
      detail: "3 pulls opened and 2 merged in the window",
      components: { opened_pulls: 3, merged_pulls: 2 },
    },
    review_latency: {
      confidence: "measured",
      value: 3,
      unit: "hours",
      reason: null,
      detail: "median first-review delay over 2 reviewed pulls",
      components: { reviewed_pulls: 2, opened_pulls: 3 },
    },
    escaped_defects: {
      confidence: "unavailable",
      value: null,
      unit: "count",
      reason: "unavailable-findings-corpus",
      detail: "no unit-doc corpus in this project",
      components: { open_findings: null, unit_docs: 0 },
    },
  },
};

/** A deep copy with `mutate` applied — every refusal case starts from the canonical. */
function variant(mutate) {
  const copy = structuredClone(CANONICAL);
  mutate(copy);
  return copy;
}

const refused = (doc, needle) => {
  const result = validateQualityMetrics(doc);
  assert.equal(result.ok, false, `refused: ${needle}`);
  assert.ok(
    result.errors.some((error) => error.includes(needle)),
    `the refusal names "${needle}"; got: ${result.errors.join(" · ")}`,
  );
};

// ---------------------------------------------------------------------------
// Published vocabularies
// ---------------------------------------------------------------------------

test("the contract, its version and its schema token are published", () => {
  assert.equal(QUALITY_METRICS_CONTRACT_ID, "agentic-workflow/quality-metrics");
  assert.equal(QUALITY_METRICS_VERSION, 1);
  assert.equal(QUALITY_METRICS_SCHEMA, "quality-metrics@1");
  assert.equal(`${QUALITY_METRICS_SCHEMA.split("@")[0]}@${QUALITY_METRICS_VERSION}`, QUALITY_METRICS_SCHEMA);
});

test("the six metric names are the closed, ordered vocabulary", () => {
  assert.deepEqual(QUALITY_METRIC_NAMES, [
    "reversion_ratio",
    "change_failure_rate",
    "lead_time_for_change",
    "pr_volume",
    "review_latency",
    "escaped_defects",
  ]);
});

test("the three confidence labels and three units are the closed vocabularies", () => {
  assert.deepEqual(QUALITY_CONFIDENCES, ["measured", "derived", "unavailable"]);
  assert.deepEqual(QUALITY_METRIC_UNITS, ["ratio", "hours", "count"]);
});

test("every metric declares its own closed component set", () => {
  assert.deepEqual(Object.keys(QUALITY_METRIC_COMPONENTS), QUALITY_METRIC_NAMES);
  assert.deepEqual(QUALITY_METRIC_COMPONENTS.reversion_ratio, ["revert_commits", "total_commits"]);
  assert.deepEqual(QUALITY_METRIC_COMPONENTS.change_failure_rate, ["reverted_deploys", "deploys"]);
  assert.deepEqual(QUALITY_METRIC_COMPONENTS.lead_time_for_change, ["merged_pulls", "sampled_pulls"]);
  assert.deepEqual(QUALITY_METRIC_COMPONENTS.pr_volume, ["opened_pulls", "merged_pulls"]);
  assert.deepEqual(QUALITY_METRIC_COMPONENTS.review_latency, ["reviewed_pulls", "opened_pulls"]);
  assert.deepEqual(QUALITY_METRIC_COMPONENTS.escaped_defects, ["open_findings", "unit_docs"]);
});

test("the bounds are published, not scattered through the validator", () => {
  assert.equal(QUALITY_METRICS_LIMITS.minWindowDays, 1);
  assert.equal(QUALITY_METRICS_LIMITS.maxWindowDays, 3650);
  assert.ok(QUALITY_METRICS_LIMITS.maxDetail > 0 && QUALITY_METRICS_LIMITS.maxDetail <= 4096);
  assert.ok(QUALITY_METRICS_LIMITS.maxDegradations > 0);
});

// ---------------------------------------------------------------------------
// The closed core
// ---------------------------------------------------------------------------

test("the canonical document is accepted", () => {
  const result = validateQualityMetrics(CANONICAL);
  assert.equal(result.ok, true, result.errors.join(" · "));
  assert.deepEqual(result.errors, []);
});

test("an unknown top-level key is refused — there is no metadata escape", () => {
  refused(variant((doc) => { doc.metadata = { note: "x" }; }), "metadata");
});

test("a missing metric is refused, and so is an unknown one", () => {
  refused(variant((doc) => { delete doc.metrics.pr_volume; }), "pr_volume");
  refused(variant((doc) => {
    doc.metrics.code_churn = { confidence: "measured", value: 1, unit: "count", reason: null, detail: "x", components: { opened_pulls: 1, merged_pulls: 0 } };
  }), "code_churn");
});

test("an unknown key inside a metric row is refused", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.sample = 3; }), "sample");
});

test("a component outside the metric's own set is refused", () => {
  refused(variant((doc) => { doc.metrics.reversion_ratio.components.total_commits_x = 1; }), "total_commits_x");
});

test("a component of the wrong metric is refused (the sets are per-metric, not a union)", () => {
  refused(variant((doc) => { doc.metrics.reversion_ratio.components.deploys = 2; }), "deploys");
});

test("every declared component must be present", () => {
  refused(variant((doc) => { delete doc.metrics.escaped_defects.components.unit_docs; }), "unit_docs");
});

// ---------------------------------------------------------------------------
// Confidence ↔ value pairing (S7, S12)
// ---------------------------------------------------------------------------

test("an unavailable row requires a null value", () => {
  refused(variant((doc) => { doc.metrics.escaped_defects.value = 0; }), "escaped_defects.value");
});

test("an unavailable row requires a declared reason", () => {
  refused(variant((doc) => { doc.metrics.escaped_defects.reason = null; }), "escaped_defects.reason");
});

test("a measured or derived row cannot carry a null value", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.value = null; }), "pr_volume.value");
});

test("a measured or derived row cannot carry a reason", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.reason = "no-pulls-in-window"; }), "pr_volume.reason");
});

test("an unknown confidence label is refused", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.confidence = "estimated"; }), "estimated");
});

test("a reason is either a declared degradation or a no-observations code", () => {
  // A code the document does not declare in `degraded` is not a source failure.
  refused(variant((doc) => {
    doc.metrics.escaped_defects.reason = "unavailable-forge-timeout";
    doc.metrics.escaped_defects.confidence = "unavailable";
    doc.metrics.escaped_defects.value = null;
  }), "degraded");
  // `no-<observation>` is the declared zero-observation reason and needs no degradation.
  const accepted = variant((doc) => {
    doc.metrics.review_latency = { confidence: "unavailable", value: null, unit: "hours", reason: "no-reviews-in-window", detail: "no pull in the window carries a review", components: { reviewed_pulls: 0, opened_pulls: 3 } };
  });
  assert.equal(validateQualityMetrics(accepted).ok, true, validateQualityMetrics(accepted).errors.join(" · "));
});

// ---------------------------------------------------------------------------
// Unit ↔ value agreement
// ---------------------------------------------------------------------------

test("a ratio stays inside 0..1", () => {
  refused(variant((doc) => { doc.metrics.reversion_ratio.value = 1.5; }), "reversion_ratio.value");
  refused(variant((doc) => { doc.metrics.reversion_ratio.value = -0.1; }), "reversion_ratio.value");
});

test("hours are non-negative numbers", () => {
  refused(variant((doc) => { doc.metrics.lead_time_for_change.value = -2; }), "lead_time_for_change.value");
  refused(variant((doc) => { doc.metrics.lead_time_for_change.value = "10.5"; }), "lead_time_for_change.value");
});

test("a count row carries an integer and a non-count row does not", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.value = 2.5; }), "pr_volume.value");
});

test("the unit of a metric is fixed by the metric, not chosen by the producer", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.unit = "hours"; }), "pr_volume.unit");
});

test("a component value is a non-negative integer or null", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.components.opened_pulls = -1; }), "opened_pulls");
  refused(variant((doc) => { doc.metrics.pr_volume.components.opened_pulls = 1.5; }), "opened_pulls");
});

test("a detail line is required and bounded", () => {
  refused(variant((doc) => { doc.metrics.pr_volume.detail = ""; }), "pr_volume.detail");
  refused(variant((doc) => { doc.metrics.pr_volume.detail = "x".repeat(QUALITY_METRICS_LIMITS.maxDetail + 1); }), "pr_volume.detail");
});

// ---------------------------------------------------------------------------
// Window, degradations and provenance
// ---------------------------------------------------------------------------

test("the window is an integer day count inside the published bounds", () => {
  refused(variant((doc) => { doc.window.days = 0; }), "window.days");
  refused(variant((doc) => { doc.window.days = 3651; }), "window.days");
  refused(variant((doc) => { doc.window.days = 90.5; }), "window.days");
});

test("since and until are ISO instants and since is days before until", () => {
  refused(variant((doc) => { doc.window.since = "yesterday"; }), "window.since");
  refused(variant((doc) => { doc.window.until = "2026-11-16"; }), "window.until");
  refused(variant((doc) => { doc.window.since = "2026-11-10T00:00:00.000Z"; }), "window.since");
});

test("a degradation follows unavailable-<source>-<cause> and is unique", () => {
  refused(variant((doc) => { doc.degraded = ["forge down"]; }), "degraded");
  refused(variant((doc) => { doc.degraded = ["unavailable-forge-missing-cli", "unavailable-forge-missing-cli"]; }), "degraded");
});

test("the source revision is a git revision or null, and nothing else", () => {
  refused(variant((doc) => { doc.source_revision = "main"; }), "source_revision");
  const noRepo = variant((doc) => { doc.source_revision = null; });
  assert.equal(validateQualityMetrics(noRepo).ok, true, validateQualityMetrics(noRepo).errors.join(" · "));
});

// ---------------------------------------------------------------------------
// Validator ↔ JSON Schema agreement (S13)
// ---------------------------------------------------------------------------

test("the published JSON Schema accepts the canonical document", () => {
  assert.equal(schemaValidates(CANONICAL), true, JSON.stringify(schemaValidates.errors));
});

test("the JSON Schema refuses every document the validator refuses", () => {
  const vectors = [
    variant((doc) => { doc.metadata = { note: "x" }; }),
    variant((doc) => { delete doc.metrics.pr_volume; }),
    variant((doc) => { doc.metrics.pr_volume.sample = 3; }),
    variant((doc) => { doc.metrics.reversion_ratio.components.deploys = 2; }),
    variant((doc) => { doc.metrics.escaped_defects.value = 0; }),
    variant((doc) => { doc.metrics.escaped_defects.reason = null; }),
    variant((doc) => { doc.metrics.pr_volume.value = null; }),
    variant((doc) => { doc.metrics.pr_volume.confidence = "estimated"; }),
    variant((doc) => { doc.metrics.reversion_ratio.value = 1.5; }),
    variant((doc) => { doc.metrics.pr_volume.value = 2.5; }),
    variant((doc) => { doc.metrics.pr_volume.unit = "hours"; }),
    variant((doc) => { doc.window.days = 0; }),
    variant((doc) => { doc.window.since = "yesterday"; }),
    variant((doc) => { doc.degraded = ["forge down"]; }),
    variant((doc) => { doc.source_revision = "main"; }),
  ];
  for (const vector of vectors) {
    assert.equal(validateQualityMetrics(vector).ok, false, `the validator refuses ${JSON.stringify(vector).slice(0, 80)}`);
    assert.equal(schemaValidates(vector), false, `the schema refuses ${JSON.stringify(vector).slice(0, 80)}`);
  }
});

test("the schema names the contract id, the version and the schema token", () => {
  assert.equal(schema.$id.includes("quality-metrics.schema.json"), true);
  assert.equal(schema.properties.contract.const, QUALITY_METRICS_CONTRACT_ID);
  assert.equal(schema.properties.version.const, QUALITY_METRICS_VERSION);
  assert.equal(schema.properties.schema.const, QUALITY_METRICS_SCHEMA);
});

test("the package ships the schema artifact it documents", () => {
  const manifest = JSON.parse(readFileSync(`${packageRoot}/package.json`, "utf8"));
  assert.equal(manifest.exports["./quality-metrics.schema.json"], "./quality-metrics.schema.json");
  assert.equal(manifest.files.includes("quality-metrics.schema.json"), true);
});
