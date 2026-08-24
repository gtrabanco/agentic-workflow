import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_STAGES,
  VERIFICATION_COST_CLASSES,
  VERIFICATION_PLAN_SCHEMA_PATH,
  validateVerificationPlanV1,
} from "../dist/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Contract ID and vocabulary tests
// ---------------------------------------------------------------------------

test("exports the plan contract ID", () => {
  assert.equal(VERIFICATION_PLAN_CONTRACT_ID, "agentic-workflow/verification-plan@1");
});

test("exports VERIFICATION_STAGES with fast and full", () => {
  assert.deepStrictEqual(VERIFICATION_STAGES, ["fast", "full"]);
});

test("exports VERIFICATION_COST_CLASSES with cheap, moderate, expensive", () => {
  assert.deepStrictEqual(VERIFICATION_COST_CLASSES, ["cheap", "moderate", "expensive"]);
});

test("exports VERIFICATION_PLAN_SCHEMA_PATH", () => {
  assert.equal(VERIFICATION_PLAN_SCHEMA_PATH, "./verification-plan.schema.json");
});

// ---------------------------------------------------------------------------
// Schema structure (parity with validator — schema checks all the same rules)
// ---------------------------------------------------------------------------

test("schema is valid JSON with expected structure", () => {
  const schemaPath = join(__dirname, "../verification-plan.schema.json");
  const s = JSON.parse(readFileSync(schemaPath, "utf-8"));
  assert.equal(s["$schema"], "http://json-schema.org/draft-07/schema#");
  assert.equal(s.type, "object");
  assert.equal(s.additionalProperties, false);
  assert.ok(s.required.includes("contract"));
  assert.ok(s.required.includes("commands"));
  assert.equal(s.properties.contract.const, "agentic-workflow/verification-plan@1");
  assert.equal(s.properties.commands.minItems, 1);
  assert.ok(s["$defs"]);
  assert.ok(s["$defs"].VerificationCommandV1);
  assert.equal(s["$defs"].VerificationCommandV1.additionalProperties, false);
});

// ---------------------------------------------------------------------------
// Structural validation: undeclared fields
// ---------------------------------------------------------------------------

test("rejects undeclared top-level fields", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [],
    extraField: "should not be here",
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  const hasError = result.errors.some((e) => e.includes("extraField"));
  assert.ok(hasError, "Should reject undeclared top-level field: " + result.errors.join(", "));
});

test("rejects wrong contract id", () => {
  const plan = {
    contract: "wrong/contract@0",
    commands: [],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  const hasError = result.errors.some((e) => e.includes("contract"));
  assert.ok(hasError, "Should reject wrong contract id: " + result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// Command list: non-empty, unique ids
// ---------------------------------------------------------------------------

test("rejects empty command list", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("empty") || e.includes("commands")), result.errors.join(", "));
});

test("rejects duplicate command ids", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: ["hello"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
      { id: "cmd1", stage: "full", executable: "echo", args: ["hello"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate") || e.includes("id")), result.errors.join(", "));
});

test("rejects empty command id", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "", stage: "fast", executable: "echo", args: ["hello"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("id")), result.errors.join(", "));
});

test("accepts unique non-empty ids", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "lint", stage: "fast", executable: "npm", args: ["run", "lint"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 30000, stopOnFailure: false, costClass: "cheap" },
      { id: "test", stage: "full", executable: "npm", args: ["run", "test"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 60000, stopOnFailure: false, costClass: "moderate" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Stage vocabulary
// ---------------------------------------------------------------------------

test("rejects invalid stage value", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "slow", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("stage")), result.errors.join(", "));
});

test("rejects unknown stage in command", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "ultra-fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("stage")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// Cost class vocabulary
// ---------------------------------------------------------------------------

test("rejects invalid costClass value", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "rapid" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("costClass")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// Boolean stopOnFailure
// ---------------------------------------------------------------------------

test("rejects non-boolean stopOnFailure", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: "true", costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("stopOnFailure")), result.errors.join(", "));
});

test("accepts boolean stopOnFailure values", () => {
  const planTrue = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: true, costClass: "cheap" },
    ],
  };
  const result1 = validateVerificationPlanV1(planTrue);
  assert.equal(result1.ok, true);

  const planFalse = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result2 = validateVerificationPlanV1(planFalse);
  assert.equal(result2.ok, true);
});

// ---------------------------------------------------------------------------
// Executable/args rules
// ---------------------------------------------------------------------------

test("rejects empty executable", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("executable")), result.errors.join(", "));
});

test("rejects NUL in executable", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo\0hello", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("executable") && (e.includes("NUL") || e.includes("null"))), result.errors.join(", "));
});

test("rejects NUL in args", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: ["hello\0world"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("args")), result.errors.join(", "));
});

test("accepts valid executable and args", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "npm", args: ["run", "test"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 30000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, true);
});

test("accepts empty args array", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "pwd", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 5000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Working directory rules
// ---------------------------------------------------------------------------

test("workingDirectory must be null for candidate-root", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: "src", timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("workingDirectory")), result.errors.join(", "));
});

test("workingDirectory must be present for relative-path", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "relative-path", workingDirectory: null, timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("workingDirectory")), result.errors.join(", "));
});

test("rejects absolute workingDirectory path", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "relative-path", workingDirectory: "/absolute/path", timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("relative") || e.includes("leading") || e.includes("path")), result.errors.join(", "));
});

test("rejects traversing relative path (..)", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "relative-path", workingDirectory: "../parent", timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("..") || e.includes("travers") || e.includes("segment")), result.errors.join(", "));
});

test("rejects empty workingDirectory for relative-path", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "relative-path", workingDirectory: "", timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("workingDirectory")), result.errors.join(", "));
});

test("rejects NUL in workingDirectory", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "relative-path", workingDirectory: "src\0test", timeoutMs: 1000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("workingDirectory")), result.errors.join(", "));
});

test("accepts valid relative-path workingDirectory", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "npm", args: ["run", "test"], workingDirectoryPolicy: "relative-path", workingDirectory: "packages/server", timeoutMs: 30000, stopOnFailure: false, costClass: "moderate" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// TimeoutMs rules
// ---------------------------------------------------------------------------

test("rejects zero timeoutMs", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 0, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("timeout")), result.errors.join(", "));
});

test("rejects negative timeoutMs", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: -100, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("timeout")), result.errors.join(", "));
});

test("rejects non-integer timeoutMs", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1.5, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("timeout")), result.errors.join(", "));
});

test("rejects string timeoutMs", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: "1000", stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("timeout")), result.errors.join(", "));
});

test("accepts positive integer timeoutMs", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "cmd1", stage: "fast", executable: "echo", args: [], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 1, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Undeclared fields inside commands
// ---------------------------------------------------------------------------

test("rejects undeclared fields inside a command object", () => {
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      {
        id: "cmd1",
        stage: "fast",
        executable: "echo",
        args: [],
        workingDirectoryPolicy: "candidate-root",
        workingDirectory: null,
        timeoutMs: 1000,
        stopOnFailure: false,
        costClass: "cheap",
        extraCommandField: "should fail",
      },
    ],
  };
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extraCommandField")), result.errors.join(", "));
});