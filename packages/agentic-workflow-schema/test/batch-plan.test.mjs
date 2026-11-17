/**
 * batch-plan.test.mjs — the canonical batch plan contract (issue #449, unit
 * docs/fix/449-batch-scheduler-sensor/).
 *
 * The corpus was observed RED before `src/batch-plan.ts` existed (the owner's
 * application workflow: one test per requested rule, red first). The contract
 * it pins:
 *
 *  - **One versioned document.** `batch-plan@4` — contract id + version + the
 *    convenience `schema` token, the journal-entry precedent.
 *  - **Core is closed, wholly.** Unlike the journal entry there is no
 *    `metadata` escape: the plan is a computed projection of the live work
 *    graph, so an unknown key anywhere is refused.
 *  - **Closed vocabularies.** Reason kinds, finding codes and size hints are
 *    the published sets; degradation entries carry one of the three declared
 *    grammars — `unavailable-<source>-<cause>`, `surface-unknown-issue-<n>` or
 *    the content guard's `(excluded|stripped)-forge-content-<source>-<id>-<cause>`.
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
  BATCH_BLOCKING_LABELS,
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
  degraded: ["unavailable-forge-gh-cli-missing", "surface-unknown-issue-574"],
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
              triaged: false,
              claimed_surface: ["skills/beta"],
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
  launched: [{ number: 443, evidence: "branch fix/443-doc-index + unit-doc docs/fix/443-doc-index" }],
  label_blocked: [
    { number: 444, labels: ["postponed"] },
    { number: 410, labels: ["backlog", "human-revision-needed"] },
  ],
  new_issues: [{ number: 446, title: "Freshly filed" }],
  closed_since: [{ number: 442, title: "Closed since the last plan", batch: 1, lane: "skills/gamma", last_seen: "2026-11-08T00:00:00Z" }],
  findings: [
    { code: "cycle", numbers: [401, 402], detail: "cyclic blocked-by wait" },
    { code: "orphaned-soft-dep", numbers: [406], detail: "soft dep targets a missing issue" },
    { code: "prose-native-mismatch", numbers: [407], detail: "prose row declared hard with no native blocked-by" },
    { code: "file-overlap", numbers: [405, 408], detail: "both modify: scripts/docs-generate.mjs" },
    { code: "stale-claim", numbers: [409], detail: "claim 409|scripts expired: last seen 2026-11-08 is older than the 48h claim TTL" },
    { code: "blind-spot", numbers: [447, 448], detail: "batch 1 carries two issues that declare no surface — serialise them" },
  ],
  summary: { open_issues: 8, batched: 2, blocked: 1, launched: 1, findings: 6, batches: 2, label_blocked: 2 },
};

test("batch-plan: the canonical vector validates", () => {
  const result = validateBatchPlan(CANONICAL);
  assert.deepEqual(result, { ok: true, errors: [] });
});

test("batch-plan: `claimed_surface` is a non-empty string[] on both surfaces (#621)", () => {
  // The core-closed contract carries one shape and one producer: the sole
  // emitter (`claimedSurfaceMap`) always emitted an array, so the union's
  // `string` arm was dead surface — and the compiled projection never carried
  // the field at all, so strict Ajv refused a document the validator accepted.
  const accepted = structuredClone(CANONICAL);
  assert.deepEqual(validateBatchPlan(accepted), { ok: true, errors: [] });
  assert.equal(schemaValidates(accepted), true, "the projection publishes the field the validator accepts");
  for (const bad of ["skills/beta", [], ["skills/beta", ""], ["skills/beta", 3]]) {
    const mutated = structuredClone(CANONICAL);
    mutated.batches[0].lanes[0].issues[0].claimed_surface = bad;
    assert.equal(validateBatchPlan(mutated).ok, false, `the validator accepts ${JSON.stringify(bad)}`);
    assert.equal(schemaValidates(mutated), false, `the schema accepts ${JSON.stringify(bad)}`);
  }
});

test("batch-plan: the superseded `@3` token is refused after the bump (the closed-core guard, #621)", () => {
  const stale = structuredClone(CANONICAL);
  stale.version = 3;
  stale.schema = "batch-plan@3";
  const result = validateBatchPlan(stale);
  assert.equal(result.ok, false, "a document stamped with the superseded version is refused");
  assert.ok(result.errors.some((e) => e.includes("version must be")));
  assert.equal(schemaValidates(stale), false, "and the projection refuses it too");
});

test("batch-plan: a label_blocked row outside the published labels is refused", () => {
  const mutated = structuredClone(CANONICAL);
  mutated.label_blocked[0].labels = ["wontfix"];
  assert.equal(validateBatchPlan(mutated).ok, false);
  assert.equal(schemaValidates(mutated), false);
  const extra = structuredClone(CANONICAL);
  extra.label_blocked[0].title = "not a field";
  assert.equal(validateBatchPlan(extra).ok, false);
  assert.equal(schemaValidates(extra), false);
});

test("batch-plan: the canonical vector validates under strict Ajv", () => {
  assert.equal(schemaValidates(CANONICAL), true, JSON.stringify(schemaValidates.errors, null, 2));
});

test("batch-plan: contract id, version and schema token agree", () => {
  assert.equal(BATCH_PLAN_CONTRACT_ID, "agentic-workflow/batch-plan");
  assert.equal(BATCH_PLAN_VERSION, 4);
  assert.equal(BATCH_PLAN_SCHEMA, "batch-plan@4");
  assert.equal(`${BATCH_PLAN_CONTRACT_ID.split("/")[1]}@${BATCH_PLAN_VERSION}`, BATCH_PLAN_SCHEMA);
});

test("batch-plan: the closed vocabularies are exactly the published sets", () => {
  assert.deepEqual([...BATCH_REASON_KINDS], ["satisfied-inputs", "surface-conflict", "soft-ordered", "untriaged", "soft-deps-open"]);
  assert.deepEqual([...BATCH_FINDING_CODES], ["cycle", "orphaned-soft-dep", "prose-native-mismatch", "file-overlap", "stale-claim", "blind-spot"]);
  assert.deepEqual([...BATCH_SIZE_HINTS], ["light", "mixed", "heavy"]);
  assert.deepEqual([...BATCH_BLOCKING_LABELS], ["postponed", "backlog", "human-revision-needed"]);
});

test("batch-plan: the surface-unknown degraded family is accepted and a malformed member is refused (#574)", () => {
  const accepted = structuredClone(CANONICAL);
  accepted.degraded = ["surface-unknown-issue-7", "surface-unknown-issue-1234"];
  assert.deepEqual(validateBatchPlan(accepted), { ok: true, errors: [] });
  assert.equal(schemaValidates(accepted), true, "the draft-07 projection publishes the same family");
  // A second degraded family is a grammar, not free text: the issue number is
  // required. (`unavailable-surface-unknown-issue-7` is *not* malformed — the
  // first family's cause is free by contract, so it is a legal member of it.)
  for (const malformed of ["surface-unknown", "surface-unknown-issue-", "surface-unknown-issue-abc"]) {
    const mutated = structuredClone(CANONICAL);
    mutated.degraded = [malformed];
    assert.equal(validateBatchPlan(mutated).ok, false, `the validator accepts ${malformed}`);
    assert.equal(schemaValidates(mutated), false, `the schema accepts ${malformed}`);
  }
});

test("batch-plan: the guard's exclusion and strip families are accepted and a malformed member is refused (#470)", () => {
  const accepted = structuredClone(CANONICAL);
  accepted.degraded = [
    "excluded-forge-content-issue-title-41-untrusted-author",
    "excluded-forge-content-issue-body-50-unknown-author",
    "stripped-forge-content-issue-body-30-html-comment-1",
    "stripped-forge-content-issue-title-7-zero-width-2",
  ];
  assert.deepEqual(validateBatchPlan(accepted), { ok: true, errors: [] });
  assert.equal(schemaValidates(accepted), true, "the draft-07 projection publishes the same family");
  // A third degraded family is a grammar too, never free text: the verdict
  // prefix, the `forge-content` marker and a lowercase cause are fixed.
  for (const malformed of [
    "excluded-forge-content",
    "stripped-forge-content-",
    "excluded-forge-content-issue-41-OWNER",
    "forge-content-issue-41-untrusted-author",
    "excluded-forge-content-issue-41-untrusted author",
  ]) {
    const mutated = structuredClone(CANONICAL);
    mutated.degraded = [malformed];
    assert.equal(validateBatchPlan(mutated).ok, false, `the validator accepts ${malformed}`);
    assert.equal(schemaValidates(mutated), false, `the schema accepts ${malformed}`);
  }
});

test("batch-plan: an excluded title travels empty and a non-string title is still refused (#470)", () => {
  // AC9's other half: the guard's exclusion leaves no text at all, so the row's
  // `title` is empty and its `degraded[]` entry names the issue and the role.
  // The empty string is the declared fact, never a missing field — a non-string
  // title stays a refusal on both surfaces, and so does a missing one.
  const accepted = structuredClone(CANONICAL);
  accepted.batches[0].lanes[0].issues[0].title = "";
  accepted.degraded = ["excluded-forge-content-issue-title-11-untrusted-author"];
  accepted.new_issues = [{ number: 11, title: "" }];
  accepted.closed_since = [{ number: 12, title: "", batch: null, lane: null, last_seen: "2026-11-17T00:00:00Z" }];
  assert.deepEqual(validateBatchPlan(accepted), { ok: true, errors: [] });
  assert.equal(schemaValidates(accepted), true, "the draft-07 projection carries no minLength on `title`");
  for (const mutate of [
    (doc) => { doc.batches[0].lanes[0].issues[0].title = 42; },
    (doc) => { delete doc.batches[0].lanes[0].issues[0].title; },
    (doc) => { doc.batches[0].lanes[0].issues[0].title = "x".repeat(513); },
  ]) {
    const mutated = structuredClone(accepted);
    mutate(mutated);
    assert.equal(validateBatchPlan(mutated).ok, false, "a title that is not a bounded string is refused");
    assert.equal(schemaValidates(mutated), false, "and the schema refuses it too");
  }
});

test("batch-plan: the blind-spot finding code round-trips through validator and schema (#574)", () => {
  const blind = structuredClone(CANONICAL);
  blind.findings = [{ code: "blind-spot", numbers: [7, 8], detail: "batch 2 carries two issues that declare no surface" }];
  blind.summary.findings = 1;
  assert.deepEqual(validateBatchPlan(blind), { ok: true, errors: [] });
  assert.equal(schemaValidates(blind), true);
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
  assert.deepEqual(validateBatchPlan("batch-plan@2"), { ok: false, errors: ["batch plan is not a JSON object"] });
  assert.deepEqual(validateBatchPlan([CANONICAL]), { ok: false, errors: ["batch plan is not a JSON object"] });
});

test("batch-plan: the lifecycle delta fields carry their row shapes (issue #460)", () => {
  // new_issues[] rows are {number, title}; closed_since[] rows carry the last
  // known row (title, batch, lane, last_seen); the triaged flag is boolean.
  const mutated = structuredClone(CANONICAL);
  mutated.new_issues = [{ number: 1, extra: true }];
  assert.equal(validateBatchPlan(mutated).ok, false);
  assert.equal(schemaValidates(mutated), false);
  const mutated2 = structuredClone(CANONICAL);
  mutated2.closed_since = [{ number: 1, title: "t", batch: "one", lane: null, last_seen: "" }];
  assert.equal(validateBatchPlan(mutated2).ok, false);
  assert.equal(schemaValidates(mutated2), false);
  const mutated3 = structuredClone(CANONICAL);
  mutated3.batches[0].lanes[0].issues[0].triaged = "no";
  assert.equal(validateBatchPlan(mutated3).ok, false);
  assert.equal(schemaValidates(mutated3), false);
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
    (m) => { m.version = 1; },
    (m) => { m.schema = "batch-plan@1"; },
    (m) => { m.source_revision = "HEAD"; },
    (m) => { m.degraded = "unavailable-forge"; },
    (m) => { m.batches = {}; },
    (m) => { m.blocked = [{ number: 1 }]; },
    (m) => { m.launched = [{ number: 1 }]; },
    (m) => { m.findings = [{ code: "cycle", numbers: [1] }]; },
    (m) => { m.new_issues = [{ number: 1 }]; },
    (m) => { m.closed_since = [{ number: 1 }]; },
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
