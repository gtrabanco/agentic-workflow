import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import * as pkg from "../dist/index.js";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  digestVerificationPlan,
  digestVerificationReceipt,
  canonicalizeVerificationPlan,
} from "../dist/index.js";
import {
  VERIFICATION_CONTRACT,
} from "../dist/verification-contract.js";
import {
  PROJECTION_FILES,
  renderProjection,
  checkProjections,
} from "../scripts/generate-verification-schemas.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Fixtures — plain literals only (the authority surface must not need classes)
// ---------------------------------------------------------------------------

function makePlan(overrides = {}) {
  return {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      {
        id: "lint",
        stage: "full",
        executable: "npm",
        args: ["run", "lint"],
        workingDirectoryPolicy: "candidate-root",
        workingDirectory: null,
        timeoutMs: 30000,
        stopOnFailure: false,
        costClass: "moderate",
      },
    ],
    ...overrides,
  };
}

const PLAN_DIGEST = await digestVerificationPlan(makePlan());

function makeReceipt(overrides = {}) {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: PLAN_DIGEST,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      {
        commandId: "lint",
        status: "passed",
        exitCode: 0,
        signal: null,
        startedAt: "2025-01-01T00:00:00Z",
        endedAt: "2025-01-01T00:00:01Z",
        stdout: null,
        stderr: null,
        skipReason: null,
      },
    ],
    verdict: "pass",
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// AC2 / D12 — exactly two public runtime validation entries
// ---------------------------------------------------------------------------

test("P7: exactly two feature-26 runtime validation entries are exported", () => {
  const entries = Object.keys(pkg)
    .filter((name) => /^validate[A-Za-z]*Verification/.test(name))
    .sort();
  assert.deepEqual(entries, [
    "validateVerificationPlanV1",
    "validateVerificationReceiptAgainstPlan",
  ]);
});

test("P7: no standalone structural receipt validator is exported", () => {
  assert.equal(pkg.validateVerificationReceiptV1, undefined);
  assert.equal(pkg.verifyReceiptAgainstPlan, undefined);
  assert.equal(pkg.validateVerificationReceipt, undefined);
  const dts = readFileSync(join(PACKAGE_ROOT, "dist", "index.d.ts"), "utf-8");
  assert.ok(
    !/export declare function validateVerificationReceiptV1/.test(dts),
    "dist/index.d.ts must not declare a public structural receipt validator",
  );
});

test("P7: both entries accept unknown input and report through one result shape", async () => {
  const planResult = validateVerificationPlanV1(makePlan());
  assert.equal(planResult.ok, true);
  assert.deepEqual(Object.keys(planResult).sort(), ["ok", "plan"]);

  const receiptResult = await validateVerificationReceiptAgainstPlan(
    JSON.parse(JSON.stringify(makeReceipt())),
    JSON.parse(JSON.stringify(makePlan())),
  );
  assert.equal(receiptResult.ok, true);
  assert.deepEqual(Object.keys(receiptResult).sort(), ["ok", "receipt"]);

  const planFailure = validateVerificationPlanV1(null);
  assert.equal(planFailure.ok, false);
  assert.deepEqual(Object.keys(planFailure).sort(), ["errors", "ok"]);
});

// ---------------------------------------------------------------------------
// F69 — one public verification constant surface
// ---------------------------------------------------------------------------

test("P7: the public verification constant surface is exactly the planned one", () => {
  assert.deepEqual(
    Object.keys(pkg)
      .filter((name) => /^VERIFICATION_/.test(name))
      .sort(),
    [
      "VERIFICATION_CANONICAL_VECTORS",
      "VERIFICATION_COMMAND_STATUSES",
      "VERIFICATION_COST_CLASSES",
      "VERIFICATION_FRESHNESS_CODES",
      "VERIFICATION_PLAN_CONTRACT_ID",
      "VERIFICATION_RECEIPT_CONTRACT_ID",
      "VERIFICATION_STAGES",
      "VERIFICATION_VERDICTS",
    ],
  );
});

test("P7: duplicate and unplanned verification constants are not exported", () => {
  for (const retired of [
    "VERIFICATION_STAGE_REQUESTS",
    "VERIFICATION_WORKING_DIRECTORY_POLICIES",
    "VERIFICATION_PLAN_SCHEMA_PATH",
    "VERIFICATION_RECEIPT_SCHEMA_PATH",
  ]) {
    assert.equal(pkg[retired], undefined, `${retired} must not be public`);
  }
  const dts = readFileSync(join(PACKAGE_ROOT, "dist", "index.d.ts"), "utf-8");
  for (const retired of ["VERIFICATION_STAGE_REQUESTS", "VERIFICATION_WORKING_DIRECTORY_POLICIES"]) {
    assert.ok(!dts.includes(retired), `${retired} must not be declared in dist/index.d.ts`);
  }
});

// ---------------------------------------------------------------------------
// F64 — own/plain property requirement + normalized DTOs
// ---------------------------------------------------------------------------

test("P7: plan input with an inherited prototype is rejected", () => {
  const base = makePlan();
  const withInherited = Object.create(base);
  const result = validateVerificationPlanV1(withInherited);
  assert.equal(result.ok, false);
  assert.ok(result.errors.length > 0);

  class Plan {
    constructor() {
      this.contract = VERIFICATION_PLAN_CONTRACT_ID;
      this.commands = base.commands;
    }
    get extra() {
      return "shadow";
    }
  }
  assert.equal(validateVerificationPlanV1(new Plan()).ok, false);
});

test("P7: receipt input with an inherited prototype is rejected", async () => {
  const withInherited = Object.create(makeReceipt());
  const result = await validateVerificationReceiptAgainstPlan(withInherited, makePlan());
  assert.equal(result.ok, false);
});

test("P7: non-object and array plan inputs are rejected", () => {
  for (const bad of [null, undefined, 42, "plan", [], [makePlan()], true]) {
    assert.equal(validateVerificationPlanV1(bad).ok, false, `rejects ${JSON.stringify(bad) ?? String(bad)}`);
  }
});

test("P7: an own __proto__ key is rejected as an undeclared field", () => {
  const polluted = JSON.parse(
    '{"contract":"agentic-workflow/verification-plan@1","__proto__":{"evil":true},"commands":[]}',
  );
  assert.ok(Object.prototype.hasOwnProperty.call(polluted, "__proto__"));
  const result = validateVerificationPlanV1(polluted);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("__proto__")), result.errors.join(", "));
});

test("P7: a successful plan result is a normalized own-property DTO", () => {
  const input = makePlan();
  const result = validateVerificationPlanV1(input);
  assert.equal(result.ok, true);
  const plan = result.plan;

  assert.notEqual(plan, input, "returns a fresh object, not the submitted reference");
  assert.notEqual(plan.commands, input.commands, "commands array is copied");
  assert.notEqual(plan.commands[0], input.commands[0], "command objects are copied");
  assert.equal(Object.getPrototypeOf(plan), Object.prototype);
  assert.deepEqual(Object.keys(plan).sort(), ["commands", "contract"]);
  assert.deepEqual(Object.keys(plan.commands[0]).sort(), [
    "args",
    "costClass",
    "executable",
    "id",
    "stage",
    "stopOnFailure",
    "timeoutMs",
    "workingDirectory",
    "workingDirectoryPolicy",
  ]);
  assert.ok(Array.isArray(plan.commands[0].args));
  assert.deepEqual(plan, input, "content is preserved by normalization");
  assert.ok(Object.isFrozen(plan) === false, "normalization does not silently freeze consumer data");
});

test("P7: normalization snapshots own accessor values (later mutation cannot change the DTO)", () => {
  let id = "lint";
  const command = {
    get id() {
      return id;
    },
    stage: "full",
    executable: "npm",
    args: ["run", "lint"],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    timeoutMs: 30000,
    stopOnFailure: false,
    costClass: "moderate",
  };
  const result = validateVerificationPlanV1({ contract: VERIFICATION_PLAN_CONTRACT_ID, commands: [command] });
  assert.equal(result.ok, true);
  id = "renamed-after-validation";
  assert.equal(result.plan.commands[0].id, "lint", "the DTO holds the value read at validation time");
});

test("P7: a successful receipt result is a normalized own-property DTO", async () => {
  const input = makeReceipt();
  const result = await validateVerificationReceiptAgainstPlan(input, makePlan());
  assert.equal(result.ok, true);
  const receipt = result.receipt;

  assert.notEqual(receipt, input);
  assert.notEqual(receipt.results, input.results);
  assert.notEqual(receipt.results[0], input.results[0]);
  assert.deepEqual(Object.keys(receipt).sort(), [
    "acceptanceFingerprint",
    "candidateSnapshotDigest",
    "contract",
    "planDigest",
    "results",
    "stageRequested",
    "verdict",
  ]);
  assert.deepEqual(receipt, input);
});

test("P7: digests are computed over normalized DTOs, not submitted objects", async () => {
  const input = makePlan();
  const result = validateVerificationPlanV1(input);
  assert.equal(result.ok, true);

  assert.equal(
    await digestVerificationPlan(result.plan),
    await digestVerificationPlan(input),
    "normalized DTO and the equivalent plain literal digest identically",
  );
  assert.equal(
    canonicalizeVerificationPlan(result.plan),
    canonicalizeVerificationPlan(input),
  );

  const receipt = makeReceipt();
  const receiptResult = await validateVerificationReceiptAgainstPlan(receipt, input);
  assert.equal(receiptResult.ok, true);
  assert.equal(
    await digestVerificationReceipt(receiptResult.receipt),
    await digestVerificationReceipt(receipt),
  );
});

// ---------------------------------------------------------------------------
// D12/D13 — one canonical definition feeds runtime validation
// ---------------------------------------------------------------------------

test("P7: the canonical definition owns the closed field lists used by validation", () => {
  const planSpec = VERIFICATION_CONTRACT.plan;
  const receiptSpec = VERIFICATION_CONTRACT.receipt;

  assert.deepEqual(
    planSpec.root.fields.map((f) => f.key),
    ["contract", "commands"],
  );
  assert.deepEqual(
    planSpec.objects.VerificationCommandV1.fields.map((f) => f.key),
    [
      "id",
      "stage",
      "executable",
      "args",
      "workingDirectoryPolicy",
      "workingDirectory",
      "timeoutMs",
      "stopOnFailure",
      "costClass",
    ],
  );
  assert.deepEqual(
    receiptSpec.root.fields.map((f) => f.key),
    [
      "contract",
      "planDigest",
      "candidateSnapshotDigest",
      "acceptanceFingerprint",
      "stageRequested",
      "results",
      "verdict",
    ],
  );
  assert.deepEqual(
    receiptSpec.objects.VerificationResultV1.fields.map((f) => f.key),
    [
      "commandId",
      "status",
      "exitCode",
      "signal",
      "startedAt",
      "endedAt",
      "stdout",
      "stderr",
      "skipReason",
    ],
  );
  assert.deepEqual(
    receiptSpec.objects.EvidenceReferenceV1.fields.map((f) => f.key),
    ["ref", "bytes", "sha256"],
  );
});

test("P7: undeclared fields are rejected from the canonical field lists", () => {
  const plan = validateVerificationPlanV1({ ...makePlan(), extra: true });
  assert.equal(plan.ok, false);
  assert.ok(plan.errors.some((e) => e.includes("extra")), plan.errors.join(", "));

  const cmd = makePlan().commands[0];
  cmd.extraCommandField = 1;
  const nested = validateVerificationPlanV1(makePlan({ commands: [cmd] }));
  assert.equal(nested.ok, false);
  assert.ok(nested.errors.some((e) => e.includes("extraCommandField")), nested.errors.join(", "));
});

test("P7: every canonical bound is enforced by validation, not hard-coded twice", async () => {
  const idMax = VERIFICATION_CONTRACT.plan.objects.VerificationCommandV1.fields.find((f) => f.key === "id").maxLength;
  const over = makePlan();
  over.commands[0].id = "x".repeat(idMax + 1);
  assert.equal(validateVerificationPlanV1(over).ok, false);
  const at = makePlan();
  at.commands[0].id = "x".repeat(idMax);
  assert.equal(validateVerificationPlanV1(at).ok, true);

  const refMax = VERIFICATION_CONTRACT.receipt.objects.EvidenceReferenceV1.fields.find((f) => f.key === "ref").maxLength;
  const receipt = makeReceipt();
  receipt.results[0].stdout = { ref: "r".repeat(refMax + 1), bytes: 0, sha256: "a".repeat(64) };
  const result = await validateVerificationReceiptAgainstPlan(receipt, makePlan());
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("ref")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// D13 — generated non-authoritative structural projections
// ---------------------------------------------------------------------------

test("P7: the projection generator renders both files deterministically", () => {
  assert.deepEqual(PROJECTION_FILES, [
    "verification-plan.schema.json",
    "verification-receipt.schema.json",
  ]);
  for (const file of PROJECTION_FILES) {
    assert.equal(renderProjection(file), renderProjection(file), `${file} renders byte-stable`);
  }
});

test("P7: committed projections equal the generated output (no hand-edits)", () => {
  for (const file of PROJECTION_FILES) {
    const committed = readFileSync(join(PACKAGE_ROOT, file), "utf-8");
    assert.equal(committed, renderProjection(file), `${file} is generated, not hand-edited`);
  }
});

test("P7: the drift check passes on the package and fails on a mutated projection", () => {
  assert.equal(checkProjections({ packageRoot: PACKAGE_ROOT }).ok, true);

  const scratch = mkdtempSync(join(tmpdir(), "projection-drift-"));
  for (const file of PROJECTION_FILES) {
    writeFileSync(join(scratch, file), renderProjection(file));
  }
  writeFileSync(join(scratch, PROJECTION_FILES[0]), '{"$schema":"draft-07"}\n');
  const drift = checkProjections({ packageRoot: scratch });
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.drifted, [PROJECTION_FILES[0]]);
});

test("P7: each projection marks itself a non-authoritative structural projection", () => {
  const authorities = {
    "verification-plan.schema.json": "validateVerificationPlanV1",
    "verification-receipt.schema.json": "validateVerificationReceiptAgainstPlan",
  };
  for (const [file, authority] of Object.entries(authorities)) {
    const text = renderProjection(file);
    const schema = JSON.parse(text);
    assert.equal(schema.$schema, "http://json-schema.org/draft-07/schema#");
    assert.match(schema.$comment, /authoritative: false/);
    assert.match(schema.$comment, new RegExp(`authority: ${authority}\\b`));
    assert.match(schema.$comment, /projection: structural-only/);
    assert.match(schema.description, /not a semantic authority|no semantic validity/i);
    // Machine-readable metadata stays Draft-07 legal: a strict Ajv compiles it.
    const ajv = new Ajv({ strict: true });
    assert.doesNotThrow(() => ajv.compile(structuredClone(schema)), `${file} compiles under strict Ajv`);
  }
});

test("P7: every projectable structural fact of the definition is in the projection", () => {
  const projectionOf = {
    plan: JSON.parse(renderProjection("verification-plan.schema.json")),
    receipt: JSON.parse(renderProjection("verification-receipt.schema.json")),
  };
  const plan = projectionOf.plan;
  const receipt = projectionOf.receipt;

  assert.equal(plan.additionalProperties, false);
  assert.equal(receipt.additionalProperties, false);
  assert.equal(plan.properties.contract.const, VERIFICATION_PLAN_CONTRACT_ID);
  assert.equal(receipt.properties.contract.const, VERIFICATION_RECEIPT_CONTRACT_ID);
  assert.equal(plan.properties.commands.minItems, 1);

  const command = plan.$defs.VerificationCommandV1;
  const stageField = VERIFICATION_CONTRACT.plan.objects.VerificationCommandV1.fields.find((f) => f.key === "stage");
  assert.ok(stageField);
  assert.deepEqual(command.properties.stage.enum, [...stageField.enum]);
  const costField = VERIFICATION_CONTRACT.plan.objects.VerificationCommandV1.fields.find((f) => f.key === "costClass");
  assert.deepEqual(command.properties.costClass.enum, [...costField.enum]);
  const idField = VERIFICATION_CONTRACT.plan.objects.VerificationCommandV1.fields.find((f) => f.key === "id");
  assert.equal(command.properties.id.maxLength, idField.maxLength);
  assert.equal(command.properties.id.minLength, 1);
  assert.equal(command.properties.timeoutMs.exclusiveMinimum, 0);
  assert.equal(command.properties.timeoutMs.type, "integer");
  assert.equal(command.properties.stopOnFailure.type, "boolean");

  const result = receipt.$defs.VerificationResultV1;
  const statusField = VERIFICATION_CONTRACT.receipt.objects.VerificationResultV1.fields.find((f) => f.key === "status");
  assert.deepEqual(result.properties.status.enum, [...statusField.enum]);
  assert.deepEqual(
    result.required,
    VERIFICATION_CONTRACT.receipt.objects.VerificationResultV1.fields.map((f) => f.key),
  );
  const evidence = receipt.$defs.EvidenceReferenceV1;
  const shaField = VERIFICATION_CONTRACT.receipt.objects.EvidenceReferenceV1.fields.find((f) => f.key === "sha256");
  assert.equal(evidence.properties.sha256.pattern, shaField.pattern);
  assert.equal(evidence.properties.bytes.minimum, 0);

  // Draft-07-expressible cross-field rules are projected; runtime-only ones are named.
  const allRules = [
    ...VERIFICATION_CONTRACT.plan.root.rules,
    ...VERIFICATION_CONTRACT.receipt.root.rules,
    ...Object.values(VERIFICATION_CONTRACT.plan.objects).flatMap((spec) => spec.rules),
    ...Object.values(VERIFICATION_CONTRACT.receipt.objects).flatMap((spec) => spec.rules),
  ];
  const rendered = JSON.stringify([plan, receipt]);
  for (const rule of allRules.filter((rule) => rule.projectable)) {
    assert.ok(rendered.includes(`[${rule.id}]`), `projection carries rule ${rule.id}`);
  }
  const runtimeOnly = allRules.filter((rule) => !rule.projectable);
  assert.ok(runtimeOnly.length > 0, "the definition declares runtime-only semantic rules");
  const topComment = [plan.$comment, receipt.$comment].join(" ");
  for (const rule of runtimeOnly) {
    assert.ok(
      topComment.includes(rule.id),
      `runtime-only rule ${rule.id} is disclosed in the projection comment`,
    );
  }
});

test("P7: the structural projection agrees with the authoritative validator on fixtures", () => {
  const ajv = new Ajv({ strict: true });
  const planSchema = ajv.compile(JSON.parse(renderProjection("verification-plan.schema.json")));

  const cases = [
    makePlan(),
    makePlan({ commands: [] }),
    { ...makePlan(), extra: true },
    makePlan({ commands: [{ ...makePlan().commands[0], stage: "sometimes" }] }),
    makePlan({ commands: [{ ...makePlan().commands[0], timeoutMs: 0 }] }),
    makePlan({ commands: [{ ...makePlan().commands[0], workingDirectoryPolicy: "candidate-root", workingDirectory: "src" }] }),
    makePlan({ commands: [{ ...makePlan().commands[0], workingDirectoryPolicy: "relative-path", workingDirectory: "../out" }] }),
    makePlan({ commands: [{ ...makePlan().commands[0], workingDirectoryPolicy: "relative-path", workingDirectory: "/abs" }] }),
    makePlan({ commands: [{ ...makePlan().commands[0], args: ["ok", "bad\0arg"] }] }),
  ];
  for (const value of cases) {
    const authoritative = validateVerificationPlanV1(structuredClone(value)).ok;
    const projected = planSchema(structuredClone(value));
    assert.equal(
      projected,
      authoritative,
      `projection and validator agree on ${JSON.stringify(value).slice(0, 120)}`,
    );
  }
});

test("P7: the two public entries are the only path to a verification PASS", async () => {
  const planResult = validateVerificationPlanV1(makePlan());
  assert.equal(planResult.ok, true);
  const receiptResult = await validateVerificationReceiptAgainstPlan(makeReceipt(), planResult.plan);
  assert.equal(receiptResult.ok, true);
  assert.equal(typeof pkg.validateVerificationReceiptV1, "undefined");
  assert.equal(
    Object.keys(pkg).filter((name) => /^(validate|verify)[A-Za-z]*Verification|Verification[A-Za-z]*Validate/.test(name)).length,
    2,
  );
});
