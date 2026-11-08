/**
 * resolve-passes.test.mjs — issue #201 AC3/AC4: the crate's `resolve-passes`
 * producer.
 *
 * The resolver is the ONE owner of the fail-closed resolution chain: the
 * operator's `passes` entries, then the `default` escape, then the configured
 * cheap tier (`commands.execute-phase`), then the inline floor — applied in
 * code, never re-derived by a model before each spawn (issue #201 S2). A
 * malformed *selected* route is a refusal, never a silent fallback (owner
 * note 2026-09-13, detail 2). Written red-first: the module did not exist
 * when this landed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { PASS_NAMES } from "../src/passes/names.mjs";
import { resolvePasses, PassesError, PASS_TABLE_CONTRACT_ID } from "../src/passes/resolve.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

// The mirror's parity pin reads the published set from the schema package's
// committed source with a fixed-shape extractor (the normative-drift gate's
// pattern: the machine is read from committed source, never from a build),
// because this crate deliberately does not depend on the schema package.
const schemaVocabSource = readFileSync(
  fileURLToPath(new URL("../../agentic-workflow-schema/src/vocabularies.ts", import.meta.url)),
  "utf8",
);
const publishedPassNames = (
  schemaVocabSource.match(/export const PASS_NAMES = Object\.freeze\(\[([^\]]*)\]\)/u) ??
  (() => {
    throw new Error("the schema package no longer publishes PASS_NAMES in the expected shape");
  })()
)[1]
  .match(/"([^"]+)"/gu)
  .map((token) => token.slice(1, -1));

const GLOBAL_EMPTY = "{}";

const receiptFor = (globalText, projectText, command = "review-change") =>
  resolvePasses({ globalText, projectText, command });

const rowFor = (name, globalText, projectText, command) =>
  receiptFor(globalText, projectText, command).passes[name];

test("the mirrored vocabulary is byte-equal to the published one", () => {
  assert.deepEqual([...PASS_NAMES], publishedPassNames);
});

test("the receipt carries the fixed contract id and covers every published pass", () => {
  const receipt = receiptFor(GLOBAL_EMPTY);
  assert.equal(receipt.schema, "resolve-passes@1");
  assert.equal(PASS_TABLE_CONTRACT_ID, "resolve-passes@1");
  assert.equal(receipt.command, "review-change");
  assert.deepEqual(Object.keys(receipt.passes).sort(), [...PASS_NAMES].sort());
});

test("golden: absent pass, no default, no cheap-tier route → inline at the orchestrator's model, recorded", () => {
  const row = rowFor("review-code", GLOBAL_EMPTY);
  assert.deepEqual(row, {
    model: null,
    thinking: "inherit",
    source: "floor",
    spawn: "inline",
    reason: "no pass entry, no passes.default, and no commands.execute-phase route — runs inline at the orchestrator's model",
  });
});

test("golden: a pinned pass reference resolves with its source", () => {
  const row = rowFor("review-code", '{"passes":{"review-code":{"model":"nan/qwen3.6","thinking":"low"}}}');
  assert.deepEqual(row, {
    model: "nan/qwen3.6",
    thinking: "low",
    source: "passes.review-code",
    spawn: "pinned",
    reason: null,
  });
});

test("golden: auto passes through as auto (the operator's explicit delegation)", () => {
  const row = rowFor("verify", '{"passes":{"verify":{"model":"auto"}}}');
  assert.deepEqual(row, {
    model: "auto",
    thinking: "inherit",
    source: "passes.verify",
    spawn: "auto",
    reason: null,
  });
});

test("golden: inherit resolves against the routed command's model", () => {
  const global = JSON.stringify({
    commands: { "review-change": { model: "nan/glm5.3-flash" } },
    passes: { "review-code": { model: "inherit" } },
  });
  const row = rowFor("review-code", global);
  assert.deepEqual(row, {
    model: "nan/glm5.3-flash",
    thinking: "inherit",
    source: "commands.review-change",
    spawn: "pinned",
    reason: null,
  });
});

test("golden: inherit with no routed command degrades to the inline floor with a reason", () => {
  const row = rowFor("review-code", '{"passes":{"review-code":{"model":"inherit"}}}');
  assert.equal(row.spawn, "inline");
  assert.equal(row.model, null);
  assert.equal(row.source, "floor");
  assert.match(row.reason, /no routed model for commands\.review-change/);
});

test("golden: a chain passes through as a chain — the spawner probes it in order", () => {
  const refs = ["a/m1", "b/m2"];
  const row = rowFor("classify", JSON.stringify({ passes: { classify: { model: refs } } }));
  assert.deepEqual(row.model, refs);
  assert.equal(row.spawn, "pinned");
});

test("golden: an unlisted pass resolves through the passes.default escape", () => {
  const global = JSON.stringify({ passes: { default: { model: "nan/qwen3.6" } } });
  const row = rowFor("review-brand", global);
  assert.deepEqual(row, {
    model: "nan/qwen3.6",
    thinking: "inherit",
    source: "passes.default",
    spawn: "pinned",
    reason: null,
  });
});

test("golden: the default escape's own inherit/auto follow the same semantics", () => {
  const global = JSON.stringify({
    commands: { "execute-phase": { model: "nan/qwen3.6" } },
    passes: { default: { model: "inherit" } },
  });
  const row = rowFor("debt", global);
  assert.equal(row.spawn, "pinned");
  assert.equal(row.model, "nan/qwen3.6");
  assert.equal(row.source, "commands.execute-phase");
});

test("golden: an unlisted pass with no default falls back to the configured cheap tier", () => {
  const global = JSON.stringify({ commands: { "execute-phase": { model: "nan/qwen3.6" } } });
  const row = rowFor("review-security", global);
  assert.deepEqual(row, {
    model: "nan/qwen3.6",
    thinking: "inherit",
    source: "commands.execute-phase",
    spawn: "pinned",
    reason: null,
  });
});

test("project entries override global ones; global entries survive untouched", () => {
  const globalText = JSON.stringify({
    passes: {
      "review-code": { model: "anthropic/claude-opus-4-5", thinking: "high" },
      classify: { model: "nan/qwen3.6" },
    },
  });
  const projectText = JSON.stringify({ passes: { "review-code": { model: "nan/qwen3.6" } } });
  const receipt = receiptFor(globalText, projectText);
  assert.deepEqual(receipt.passes["review-code"], {
    model: "nan/qwen3.6",
    thinking: "high",
    source: "passes.review-code",
    spawn: "pinned",
    reason: null,
  });
  assert.equal(receipt.passes.classify.source, "passes.classify");
});

test("project command routes merge per key — a project thinking override keeps the global model (AC3's loader merge rule)", () => {
  // Correction batch 2026-11-08 (fix/201 external-verify blocker 1): the crate
  // used to replace whole command routes, so a project route that set only
  // `thinking` clobbered the global `model` and the cheap tier silently fell
  // to the floor — pi's loader merges the same two files per key.
  const global = JSON.stringify({
    commands: {
      "execute-phase": { model: "nan/qwen3.6", thinking: "low" },
      "review-change": { model: "nan/glm5.3-flash" },
    },
    passes: { classify: { model: "inherit" } },
  });
  const project = JSON.stringify({
    commands: { "execute-phase": { thinking: "high" }, "review-change": { thinking: "medium" } },
  });
  assert.deepEqual(rowFor("review-security", global, project), {
    model: "nan/qwen3.6",
    thinking: "inherit",
    source: "commands.execute-phase",
    spawn: "pinned",
    reason: null,
  });
  assert.deepEqual(rowFor("classify", global, project, "review-change"), {
    model: "nan/glm5.3-flash",
    thinking: "inherit",
    source: "commands.review-change",
    spawn: "pinned",
    reason: null,
  });
});

test("fail-closed: a malformed commands map is a refusal, never a silent floor", () => {
  // Correction batch 2026-11-08 (triaged beside blocker 1): a non-object
  // `commands` value used to spread into junk keys, so the selected route was
  // simply not found and the pass fell to the floor with exit 0 — the same
  // fail-open the `$.passes` guard already refuses.
  assert.throws(() => receiptFor('{"commands":"not-an-object"}'), (e) => {
    assert.ok(e instanceof PassesError);
    assert.match(e.message, /\$\.commands/);
    return true;
  });
  assert.throws(() => receiptFor(GLOBAL_EMPTY, '{"commands":"not-an-object"}'), PassesError);
});

test("fail-closed: invalid JSON in a present file is a refusal, never a fallback", () => {
  assert.throws(() => receiptFor("{not json"), PassesError);
});

test("fail-closed: an unknown pass name in the passes map is a refusal", () => {
  assert.throws(() => receiptFor('{"passes":{"review-notreal":{"model":"inherit"}}}'), PassesError);
});

test("fail-closed: an invalid reference in a selected pass route is a refusal", () => {
  assert.throws(() => receiptFor('{"passes":{"classify":{"model":"nan no-slash"}}}'), (e) => {
    assert.ok(e instanceof PassesError);
    assert.match(e.message, /\$\.passes\.classify\.model/);
    return true;
  });
});

test("fail-closed: a malformed selected command route (inherit's target) is a refusal", () => {
  const global = JSON.stringify({
    commands: { "review-change": { model: "not-a-reference" } },
    passes: { "review-code": { model: "inherit" } },
  });
  assert.throws(() => receiptFor(global), (e) => {
    assert.match(e.message, /commands\.review-change\.model/);
    return true;
  });
});

test("fail-closed: a chain beyond the cap is a refusal", () => {
  const refs = ["a/m1", "b/m2", "c/m3", "d/m4", "e/m5"];
  assert.throws(() => receiptFor(JSON.stringify({ passes: { verify: { model: refs } } })), PassesError);
});

// ── CLI wiring ───────────────────────────────────────────────────────────

test("the CLI prints the receipt JSON on stdout and exits 0", () => {
  const dir = mkdtempSync(join(tmpdir(), "resolve-passes-"));
  try {
    const globalPath = join(dir, "pi-agentic-workflow.json");
    writeFileSync(globalPath, JSON.stringify({ passes: { "review-code": { model: "nan/qwen3.6" } } }));
    const run = spawnSync(process.execPath, [BIN, "resolve-passes", "--global", globalPath], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    const receipt = JSON.parse(run.stdout);
    assert.equal(receipt.schema, "resolve-passes@1");
    assert.equal(receipt.passes["review-code"].model, "nan/qwen3.6");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the CLI refuses a malformed file with exit 2 and PASSES REFUSAL on stderr", () => {
  const dir = mkdtempSync(join(tmpdir(), "resolve-passes-"));
  try {
    const projectPath = join(dir, "pi-agentic-workflow.json");
    writeFileSync(projectPath, '{"passes":{"review-code":{"model":"no-slash"}}}');
    const run = spawnSync(process.execPath, [BIN, "resolve-passes", "--project", projectPath], { encoding: "utf8" });
    assert.equal(run.status, 2);
    assert.match(run.stderr, /PASSES REFUSAL — /);
    assert.match(run.stderr, /\$\.passes\.review-code\.model/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
