// runtime.test.mjs — runtime resolver unit tests
//
// Tests detectRuntime(), runtimeEnv(), and runtimeBin() across the
// three resolution paths: detection, env override, and explicit override.

import { test } from "node:test";
import assert from "node:assert/strict";

const { detectRuntime, runtimeEnv, runtimeBin } = await import("../dist/runtime.js");

test("detectRuntime: returns a valid runtime ('bun' or 'node')", async () => {
  const result = detectRuntime();
  assert.ok(result === "bun" || result === "node", `detectRuntime returned unexpected value: ${result}`);
  // Under bun, globalThis.Bun is present, so detectRuntime sees it.
  if (typeof globalThis.Bun !== "undefined") {
    assert.strictEqual(result, "bun", "Bun detected when globalThis.Bun is present");
  }
});

test("runtimeBin: returns the runtime from env override", async () => {
  const original = process.env.AGENTIC_WORKFLOW_RUNTIME;
  try {
    process.env.AGENTIC_WORKFLOW_RUNTIME = "bun";
    assert.strictEqual(runtimeBin(), "bun");
    process.env.AGENTIC_WORKFLOW_RUNTIME = "node";
    assert.strictEqual(runtimeBin(), "node");
  } finally {
    if (original === undefined) {
      delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    } else {
      process.env.AGENTIC_WORKFLOW_RUNTIME = original;
    }
  }
});

test("runtimeBin: falls back to detectRuntime when env is unset", async () => {
  const original = process.env.AGENTIC_WORKFLOW_RUNTIME;
  try {
    delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    const detected = detectRuntime();
    assert.strictEqual(runtimeBin(), detected);
  } finally {
    if (original === undefined) {
      delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    } else {
      process.env.AGENTIC_WORKFLOW_RUNTIME = original;
    }
  }
});

test("runtimeEnv: respects explicit override argument", async () => {
  const result = runtimeEnv({ AGENTIC_WORKFLOW_RUNTIME: "bun" });
  assert.deepStrictEqual(result, { AGENTIC_WORKFLOW_RUNTIME: "bun" });
});

test("runtimeEnv: falls back to env when no explicit override", async () => {
  const original = process.env.AGENTIC_WORKFLOW_RUNTIME;
  try {
    delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    const result = runtimeEnv();
    const detected = detectRuntime();
    assert.deepStrictEqual(result, { AGENTIC_WORKFLOW_RUNTIME: detected });
  } finally {
    if (original === undefined) {
      delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    } else {
      process.env.AGENTIC_WORKFLOW_RUNTIME = original;
    }
  }
});

test("runtimeEnv: explicit override wins over env variable", async () => {
  const original = process.env.AGENTIC_WORKFLOW_RUNTIME;
  try {
    process.env.AGENTIC_WORKFLOW_RUNTIME = "node";
    const result = runtimeEnv({ AGENTIC_WORKFLOW_RUNTIME: "bun" });
    assert.deepStrictEqual(result, { AGENTIC_WORKFLOW_RUNTIME: "bun" });
  } finally {
    if (original === undefined) {
      delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    } else {
      process.env.AGENTIC_WORKFLOW_RUNTIME = original;
    }
  }
});

test("runtimeEnv: env variable wins over detectRuntime", async () => {
  const original = process.env.AGENTIC_WORKFLOW_RUNTIME;
  try {
    process.env.AGENTIC_WORKFLOW_RUNTIME = "bun";
    const result = runtimeEnv();
    assert.deepStrictEqual(result, { AGENTIC_WORKFLOW_RUNTIME: "bun" });
  } finally {
    if (original === undefined) {
      delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    } else {
      process.env.AGENTIC_WORKFLOW_RUNTIME = original;
    }
  }
});

test("runtimeEnv: no arguments returns detected runtime", async () => {
  const original = process.env.AGENTIC_WORKFLOW_RUNTIME;
  try {
    delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    const result = runtimeEnv();
    const detected = detectRuntime();
    assert.deepStrictEqual(result, { AGENTIC_WORKFLOW_RUNTIME: detected });
  } finally {
    if (original === undefined) {
      delete process.env.AGENTIC_WORKFLOW_RUNTIME;
    } else {
      process.env.AGENTIC_WORKFLOW_RUNTIME = original;
    }
  }
});
