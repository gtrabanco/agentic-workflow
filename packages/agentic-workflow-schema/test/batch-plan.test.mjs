/**
 * batch-plan.test.mjs — the canonical batch plan contract (issue #449, unit
 * docs/fix/449-batch-scheduler-sensor/).
 *
 * The corpus was observed RED before `src/batch-plan.ts` existed (the owner's
 * application workflow: one test per requested rule, red first). The contract
 * it pins:
 *
 *  - **One versioned document.** `batch-plan@1` — contract id + version + the
 *    convenience `schema` token, the journal-entry precedent.
 *  - **Core is closed, wholly.** Unlike the journal entry there is no
 *    `metadata` escape: the plan is a computed projection of the live work
 *    graph, so an unknown key anywhere is refused.
 *  - **Closed vocabularies.** Reason kinds, finding codes and size hints are
 *    the published sets; degradation entries carry the
 *    `unavailable-<source>-<cause>` prefix with a free cause.
 *  - **Facts, never policy.** `worktree` and `command` validate as reported
 *    strings; the validator never judges whether the plan should have
 *    launched anything.
 *  - **The JSON Schema and the validator agree.** Every document the
 *    validator accepts must compile and validate under strict Ajv, and a
 *    document it refuses must be refused by the schema too.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import Ajv from "ajv";

import {
  BATCH_PLAN_CONTRACT_ID,
  BATCH_PLAN_VERSION,
  BATCH_PLAN_SCHEMA,
  BATCH_REASON_KINDS,
  BATCH_FINDING_CODES,
  BATCH_SIZE_HINTS,
  validateBatchPlan,
} from "../dist/index.js";

const packageRoot = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(readFileSync(`${packageRoot}/batch-plan.schema.json`, "utf8"));
const ajv = new Ajv({ strict: true });
const schemaValidates = ajv.compile(schema);

/** The canonical vector: a two-batch plan with every vocabulary exercised. */
const CANONICAL = {
  contract: BATCH_PLAN_CONTRACT_ID,
  version: BATCH_PLAN_VERSION,
  schema: BATCH_PLAN_SCHEMA,
  source_revision: "b8b1d8147b1ecb79ef92355a53309c2b82a3c3d2",
  degraded: ["unavailable-forge-gh-cli-missing"],
  batches: [
    {
      n: 1,
      lanes: [
        {
          surface: "skills/alpha",
          occupied_by: null,
          size_hint: "light",
          issues: [
            {
              number: 10,
              title: "Alpha skill change",
              lane: "skills/alpha",
              worktree: "feat/10-alpha-skill-change",
              command: "/unit-lane --from-issue 10",
              reason: { kind: "satisfied-inputs", detail: "no open blockers; surface free" },
              size_hint: "light",
            },
          ],
        },
      ],
    },
    {
      n: 2,
      lanes: [
        {
          surface: "packages/pi-web",
          occupied_by: "docs/fix/444-panel",
          size_hint: "heavy",
          issues: [
            {
              number: 444,
              title: "Panel (L)",
              lane: "packages/pi-web",
              worktree: "feat/444-panel",
              command: "/unit-lane --from-issue 444",
              reason: { kind: "surface-conflict", detail: "shares the pi package lane with an in-flight unit" },
              size_hint: "heavy",
              claimed: true,
            },
          ],
        },
      ],
    },
  ],
  blocked: [{ number: 445, blockers: [444], reason: "blocked-by 444 (open)" }],
  launched: [{ number: 443, evidence: "unit-doc docs/fix/443-doc-index" }],
  findings: [
    { code: "cycle", numbers: [401, 402], detail: "cyclic blocked-by wait" },
    { code: "orphaned-soft-dep", numbers: [406], detail: "soft dep targets a missing issue" },
    { code: "prose-native-mismatch", numbers: [407], detail: "prose row declared hard with no native blocked-by" },
  ],
  summary: { open_issues: 8, batched: 2, blocked: 1, launched: 1, findings: 3, batches: 2 },
};

test("batch-plan: the canonical vector validates", () => {
  const result = validateBatchPlan(CANONICAL);
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("batch-plan: the canonical vector validates under strict Ajv", () => {
  assert.equal(schemaValidates(CANONICAL), true, JSON.stringify(schemaValidates.errors, null, 2));
});

test("batch-plan: contract id, version and schema token agree", () => {
  assert.equal(BATCH_PLAN_CONTRACT_ID, "agentic-workflow/batch-plan");
  assert.equal(BATCH_PLAN_VERSION, 1);
  assert.equal(BATCH_PLAN_SCHEMA, "batch-plan@1");
  assert.equal(`${BATCH_PLAN_CONTRACT_ID.split("/")[1]}@${BATCH_PLAN_VERSION}`, BATCH_PLAN_SCHEMA);
});

test("batch-plan: the closed vocabularies are exactly the published sets", () => {
  assert.deepEqual([...BATCH_REASON_KINDS], ["satisfied-inputs", "surface-conflict", "soft-ordered"]);
  assert.deepEqual([...BATCH_FINDING_CODES], ["cycle", "orphaned-soft-dep", "prose-native-mismatch"]);
  assert.deepEqual([...BATCH_SIZE_HINTS], ["light", "mixed", "heavy"]);
});

test("batch-plan: an unknown top-level key is refused (core closed, no metadata escape)", () => {
  const mutated = { ...CANONICAL, metadata: { consumer_field: 1 } };
  const result = validateBatchPlan(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("unexpected key: metadata")));
  assert.equal(schemaValidates(mutated), false);
});

test("batch-plan: an unknown key inside a lane issue is refused", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.batches[0].lanes[0].issues[0].priority = "high";
  const result = validateBatchPlan(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("unexpected key: priority")));
  assert.equal(schemaValidates(mutated), false);
});

test("batch-plan: an unknown reason kind is refused by validator and schema", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.batches[0].lanes[0].issues[0].reason.kind = "looks-shippable";
  const result = validateBatchPlan(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("reason.kind")));
  assert.equal(schemaValidates(mutated), false);
});

test("batch-plan: an unknown finding code is refused by validator and schema", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.findings[0].code = "vibe";
  assert.equal(validateBatchPlan(mutated).ok, false);
  assert.equal(schemaValidates(mutated), false);
});

test("batch-plan: an unknown size hint is refused by validator and schema", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.batches[0].lanes[0].size_hint = "huge";
  assert.equal(validateBatchPlan(mutated).ok, false);
  assert.equal(schemaValidates(mutated), false);
});

test("batch-plan: a degradation without the unavailable- prefix is refused", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.degraded = ["forge down"];
  assert.equal(validateBatchPlan(mutated).ok, false);
  assert.equal(schemaValidates(mutated), false);
});

test("batch-plan: duplicate surfaces within one batch are refused (single-occupancy is structural)", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.batches[0].lanes.push(structuredClone(mutated.batches[0].lanes[0]));
  const result = validateBatchPlan(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate surface")));
});

test("batch-plan: a worktree outside the <prefix>/<issue>-<slug> shape is refused", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.batches[0].lanes[0].issues[0].worktree = "just-a-branch";
  const result = validateBatchPlan(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("worktree")));
});

test("batch-plan: a non-object is refused with a single named error", () => {
  assert.deepEqual(validateBatchPlan(null), { ok: false, errors: ["batch plan is not a JSON object"] });
  assert.deepEqual(validateBatchPlan("batch-plan@1"), { ok: false, errors: ["batch plan is not a JSON object"] });
  assert.deepEqual(validateBatchPlan([CANONICAL]), { ok: false, errors: ["batch plan is not a JSON object"] });
});

test("batch-plan: batch numbers must be strictly ascending (batch 1 is the runnable-now set)", () => {
  const mutated = structuredClone(CANONICAL);
  const swapped = [mutated.batches[1], mutated.batches[0]];
  mutated.batches = swapped;
  const result = validateBatchPlan(mutated);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("strictly ascending")));
});

test("batch-plan: every validator refusal is a schema refusal (the two surfaces agree)", () => {
  // StructuredClone + single-mutation matrix over the vocabulary and closure
  // rules; each mutated document must fail BOTH surfaces.
  const mutations = [
    (m) => { m.contract = "other/batch-plan"; },
    (m) => { m.version = 2; },
    (m) => { m.schema = "batch-plan@2"; },
    (m) => { m.source_revision = "HEAD"; },
    (m) => { m.degraded = "unavailable-forge"; },
    (m) => { m.batches = {}; },
    (m) => { m.blocked = [{ number: 1 }]; },
    (m) => { m.launched = [{ number: 1 }]; },
    (m) => { m.findings = [{ code: "cycle", numbers: [1] }]; },
    (m) => { m.summary = { ...m.summary, extra: 1 }; },
  ];
  for (const mutate of mutations) {
    const m = structuredClone(CANONICAL);
    mutate(m);
    assert.equal(validateBatchPlan(m).ok, false, JSON.stringify(mutate.toString()));
    assert.equal(schemaValidates(m), false, JSON.stringify(mutate.toString()));
  }
});

test("batch-plan: the committed projection ships with the package (the `files` contract)", () => {
  // External-verify B7: the schema file is committed, read by this suite and
  // named by the producer, but a published consumer only receives what
  // `files` lists — every sibling projection is listed there.
  const manifest = JSON.parse(readFileSync(`${packageRoot}/package.json`, "utf8"));
  assert.ok(manifest.files.includes("batch-plan.schema.json"), "the draft-07 projection is part of the published package");
});
