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

// The host-declared skills tree: the crate's sensors (the workflow-doctor
// battery among them) resolve the installed skills through the
// `AGENTIC_WORKFLOW_SKILLS_ROOT` declaration this package publishes — never
// through a guessed project-root layout — so the publication is this package's
// own opinionated fact, and the crate stays host-agnostic.

test("packageSkillsRoot: returns the directory when it exists and null when it does not", async () => {
  const { mkdtempSync, mkdirSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { packageSkillsRoot } = await import("../dist/runtime.js");

  const present = mkdtempSync(join(tmpdir(), "pi-skills-"));
  try {
    assert.strictEqual(packageSkillsRoot(present), present);
    assert.strictEqual(packageSkillsRoot(join(present, "absent", "skills")), null);
  } finally {
    rmSync(present, { recursive: true, force: true });
  }
});

test("publishSkillsRoot: publishes a resolvable tree, keeps the operator's declaration, skips an absent one", async () => {
  const { mkdirSync, mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { AGENTIC_WORKFLOW_SKILLS_ROOT, publishSkillsRoot } = await import("../dist/runtime.js");

  const dir = mkdtempSync(join(tmpdir(), "pi-skills-"));
  try {
    const env = {};
    assert.strictEqual(publishSkillsRoot(env, dir), dir);
    assert.strictEqual(env[AGENTIC_WORKFLOW_SKILLS_ROOT], dir, "a resolvable tree is published");

    const operator = { [AGENTIC_WORKFLOW_SKILLS_ROOT]: "/declared/by-the-operator" };
    assert.strictEqual(publishSkillsRoot(operator, dir), "/declared/by-the-operator", "the operator's value wins");
    assert.strictEqual(operator[AGENTIC_WORKFLOW_SKILLS_ROOT], "/declared/by-the-operator");

    const empty = {};
    assert.strictEqual(publishSkillsRoot(empty, join(dir, "absent")), null);
    assert.strictEqual(AGENTIC_WORKFLOW_SKILLS_ROOT in empty, false, "an unresolvable tree publishes nothing");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
