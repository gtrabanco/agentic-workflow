// test-obligation: protects=packages/pi-agentic-workflow/src/extension/workflow-tools.ts,packages/pi-agentic-workflow/src/extension/index.ts obligations=contract,failure-path
// telemetry-attribution.test.mjs — issue #690: the sample cannot exist without a
// unit, and the unit comes from the command that was dispatched.
//
// The wiring's attribution gate had exactly one door in a session whose work
// runs through the deferred tools: `agentic_workflow_run`, the generic runner
// door every `runner <subcommand> [args…]` citation goes through. This suite is
// the issue's reproducer corpus. Before the fix that door called nothing, so
// `unit` stayed `null`, `build()` returned `null` and no accumulator existed to
// receive a single turn — both destinations stayed empty however much work the
// session did.
//
// What it pins: a unit-scoped subcommand dispatched through the door attributes
// the session exactly as the same subcommand dispatched as a slash command does,
// the seam runs before the spawn (so the child inherits the phase), a subcommand
// that names no unit still invents no row, and a seam that throws never costs
// the subcommand its run.

import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { join } from "node:path";

import { createTelemetryWiring } from "../dist/extension/telemetry-wiring.js";

const PKG_ROOT = path.resolve(import.meta.dirname, "..");
const UNIT = "690-telemetry-attr";

/** Every scratch dir this file creates, removed when the file finishes. */
const SCRATCH = [];
function scratchDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  SCRATCH.push(dir);
  return dir;
}
after(() => {
  for (const dir of SCRATCH) fs.rmSync(dir, { recursive: true, force: true });
});

/** A project carrying this unit's directory, so a command's issue number resolves. */
function project() {
  const root = scratchDir("paw-attribution-");
  fs.mkdirSync(join(root, "docs/fix", UNIT), { recursive: true });
  fs.writeFileSync(join(root, "docs/fix", UNIT, "SPEC.md"), `# fix/${UNIT}\n\n## Risk tier\n\n- **Tier** — \`standard\`\n`);
  return root;
}

/** A `pi` double that keeps every handler, the way the wiring registers them. */
function fakePi() {
  const handlers = new Map();
  return {
    pi: { on: (event, handler) => handlers.set(event, handler) },
    fire(event, payload = {}, ctx = {}) {
      const handler = handlers.get(event);
      assert.ok(handler, `no handler registered for ${event}`);
      return handler(payload, ctx);
    },
  };
}

/**
 * The tools exactly as the extension registers them, over the deps this suite
 * injects. `hostTool` is the shipped adapter's own translation and the factory's
 * `toolRegistrar` is what the adapter passes to `pi.registerTool`, so a recorder
 * here observes the objects a host receives.
 */
async function registeredTools(workflowTools) {
  const [{ createExtension }, { hostTool }] = await Promise.all([
    import("../dist/extension/factory.js"),
    import("../dist/extension/index.js"),
  ]);
  const registered = [];
  createExtension({
    registrar: { registerCommand: () => {} },
    toolRegistrar: { registerTool: (tool) => registered.push(tool) },
    surface: () => ({}),
    skillsDir: join(PKG_ROOT, "skills"),
    agentDir: join(os.tmpdir(), "paw-attribution-agentdir"),
    hint: { shouldShow: () => false, markShown: () => {} },
    settings: () => {},
    workflowTools,
    toolShipping: hostTool,
  });
  return registered;
}

const runnerOf = (tools) => tools.find((tool) => tool.name === "agentic_workflow_run");

/** The arguments pi hands a tool, in pi's order. */
function hostCall(args, cwd) {
  const signal = new AbortController().signal;
  const ctx = { cwd, sessionManager: {}, ui: { notify: () => {} } };
  return ["call-01HX", args, signal, () => {}, ctx];
}

/** A spawn seam that succeeds without running anything. */
function okSpawn(record = []) {
  return (request) => {
    record.push(request);
    return Promise.resolve({ code: 0, stdout: "", stderr: "" });
  };
}

/** A wiring over a recording sink, sharing the scratch project. */
function wiring(root, written) {
  return createTelemetryWiring({
    root,
    enabled: true,
    sinks: [{ name: "recording", write: (sample) => written.push(sample) }],
    changedPaths: () => 4,
    sessionStartSha: () => "abc123",
    sessionId: () => "s-690",
    now: () => 1_000,
    date: () => "2026-11-03",
  });
}

// ---------------------------------------------------------------------------
// O1 — the issue's reproducer: the door attributes the session
// ---------------------------------------------------------------------------

test("a unit-scoped subcommand through the runner door attributes the session, and the sample lands", async () => {
  const root = project();
  const written = [];
  const telemetry = wiring(root, written);
  const { pi, fire } = fakePi();
  telemetry.register(pi);
  fire("session_start");

  const tools = await registeredTools({ onRunnerCommand: (sub, args) => telemetry.noteCommand(sub, args), spawnScript: okSpawn() });
  const result = await runnerOf(tools).execute(...hostCall({ subcommand: "execute-phase", args: ["690", "P2"] }, root));
  assert.equal(result.structuredContent.exitCode, 0, "the door ran the subcommand");

  fire("turn_end", { message: { usage: { totalTokens: 700 } } });
  fire("agent_settled");

  assert.equal(written.length, 1, "the door's unit command built the accumulator: one settled run is one sample");
  assert.equal(written[0].unit, UNIT, "the unit comes from the subcommand's own argument");
  assert.equal(written[0].phase, "execute-phase", "the phase is the subcommand's name, from the published vocabulary");
  assert.equal(written[0].source, "pi:session=s-690", "the sample names its session");
});

// ---------------------------------------------------------------------------
// O4 — the seam runs before the spawn, with the arguments verbatim
// ---------------------------------------------------------------------------

test("the seam sees the subcommand and its arguments before the spawn, so the child inherits the phase", async () => {
  const before = process.env.AG_WF_PHASE;
  try {
    delete process.env.AG_WF_PHASE;
    const root = project();
    const written = [];
    const telemetry = wiring(root, written);
    const order = [];
    let phaseAtSpawn;
    const seen = [];
    const requested = [];
    const tools = await registeredTools({
      onRunnerCommand: (sub, args) => {
        order.push("note");
        seen.push([sub, [...args]]);
        telemetry.noteCommand(sub, args);
      },
      spawnScript: (request) => {
        order.push("spawn");
        phaseAtSpawn = process.env.AG_WF_PHASE;
        requested.push(request);
        return Promise.resolve({ code: 0, stdout: "", stderr: "" });
      },
    });

    await runnerOf(tools).execute(...hostCall({ subcommand: "execute-phase", args: ["690", "P2"] }, root));

    assert.deepEqual(seen, [["execute-phase", ["690", "P2"]]], "the seam receives the subcommand and its arguments verbatim");
    assert.deepEqual(order, ["note", "spawn"], "the session learns the unit before the subcommand runs");
    assert.equal(phaseAtSpawn, "execute-phase", "a spawned runner reads the phase in flight from the environment it inherits");
    assert.equal(requested.length, 1, "the subcommand still spawned exactly once");
  } finally {
    if (before === undefined) delete process.env.AG_WF_PHASE;
    else process.env.AG_WF_PHASE = before;
  }
});

// ---------------------------------------------------------------------------
// O3 — a subcommand that names no unit still invents no row
// ---------------------------------------------------------------------------

test("a subcommand outside the unit vocabulary attributes nothing — no invented row", async () => {
  const root = project();
  const written = [];
  const telemetry = wiring(root, written);
  const { pi, fire } = fakePi();
  telemetry.register(pi);
  fire("session_start");
  const seen = [];

  const tools = await registeredTools({
    onRunnerCommand: (sub, args) => {
      seen.push([sub, [...args]]);
      telemetry.noteCommand(sub, args);
    },
    spawnScript: okSpawn(),
  });
  await runnerOf(tools).execute(...hostCall({ subcommand: "roadmap", args: ["read"] }, root));
  fire("turn_end", { message: { usage: { totalTokens: 700 } } });
  fire("agent_settled");

  assert.deepEqual(seen, [["roadmap", ["read"]]], "the door still notes the command it ran");
  assert.deepEqual(written, [], "a command that names no unit produces no sample: a row the ledger cannot attribute is worse than no row");
});

test("a unit command whose argument resolves to no unit directory attributes nothing", async () => {
  const root = project();
  const written = [];
  const telemetry = wiring(root, written);
  const { pi, fire } = fakePi();
  telemetry.register(pi);
  fire("session_start");

  const tools = await registeredTools({ onRunnerCommand: (sub, args) => telemetry.noteCommand(sub, args), spawnScript: okSpawn() });
  await runnerOf(tools).execute(...hostCall({ subcommand: "execute-phase", args: ["999"] }, root));
  fire("turn_end", { message: { usage: { totalTokens: 700 } } });
  fire("agent_settled");

  assert.deepEqual(written, [], "an issue with no unit dir is not a unit");
});

// ---------------------------------------------------------------------------
// failure paths — the door is bookkeeping, the spawn is the work
// ---------------------------------------------------------------------------

test("a seam that throws never costs the subcommand its run", async () => {
  const root = project();
  const requested = [];
  const tools = await registeredTools({
    onRunnerCommand: () => {
      throw new Error("bookkeeping is broken");
    },
    spawnScript: okSpawn(requested),
  });
  const result = await runnerOf(tools).execute(...hostCall({ subcommand: "execute-phase", args: ["690"] }, root));

  assert.equal(requested.length, 1, "the subcommand ran anyway: a diagnostic failure is never the operator's failure");
  assert.equal(result.structuredContent.exitCode, 0);
  assert.equal(result.isError, undefined, "a successful subcommand is not reported as an error because its bookkeeping threw");
});

test("a host that injects no seam still gets a working runner door", async () => {
  const root = project();
  const requested = [];
  const tools = await registeredTools({ spawnScript: okSpawn(requested) });
  const result = await runnerOf(tools).execute(...hostCall({ subcommand: "unit-route", args: [UNIT] }, root));

  assert.equal(requested.length, 1, "the seam is optional: a session with telemetry off loses the sample, never the run");
  assert.deepEqual(
    Object.keys(result.structuredContent).sort(),
    ["exitCode", "stderr", "stdout", "subcommand"],
    "the door's result shape is unchanged by the seam",
  );
});
