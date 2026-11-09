#!/usr/bin/env node
/**
 * pi-durable-spike.mjs — issue #284 P2: a conductor lane as durable tasks.
 *
 * The spike asks one question: if every `sensor → decide → invoke` stage is a
 * durable task whose commit is the stage receipt, what survives process death
 * that the P1 supervisor restart does not?
 *
 * What runs here:
 *   - one conversation-backed lane: a stage is created together with the lane
 *     document that records its task id, in ONE commit (so a stage that was
 *     committed is never created twice);
 *   - `harness.resume()` continues the stages a killed process left running;
 *   - a ledger line per phase invocation, so re-executions are countable;
 *   - `--kill-after <n>` SIGKILLs the process after the nth stage commit, which
 *     is the death the spike measures.
 *
 * The durable substrate is `@earendil-works/pi-durable`, which is NOT a
 * dependency of this repository: the spike refuses unless the operator points
 * `PI_DURABLE_DIR` at a scratch install (or a local `node_modules` carries it).
 * A refusal is a first-class result — the package is explicitly experimental.
 *
 * Usage:
 *   bun scripts/pi-durable-spike.mjs --dir <store-dir> --stage <name> [--stage …]
 *        [--kill-after <n>] [--json]
 *
 * stdout: the lane ledger's summary, or the `pi-durable-spike@1` receipt with
 * `--json`. exit: 0 lane completed, 2 refusal (substrate missing or bad usage),
 * 137 when `--kill-after` fired.
 *
 * Read-only over the repository; it writes only inside `--dir`.
 */

import { appendFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

export const SPIKE_CONTRACT_ID = "pi-durable-spike@1";
export const LEDGER_FILE = "ledger.jsonl";

/** Refusal the CLI and the suite both read; a missing substrate is never faked. */
export class SpikeRefusal extends Error {}

/** Parse the spike's argv. Unknown flags are a refusal, never a silent default. */
export function parseSpikeArgs(argv) {
  const args = { dir: null, stages: [], killAfter: null, killDuring: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--json") { args.json = true; continue; }
    if (arg === "--dir" || arg === "--stage" || arg === "--kill-after" || arg === "--kill-during") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        throw new SpikeRefusal(`--${arg.slice(2)} needs a value`);
      }
      if (arg === "--dir") args.dir = resolve(value);
      else if (arg === "--stage") args.stages.push(value);
      else if (arg === "--kill-during") args.killDuring = value;
      else {
        const n = Number.parseInt(value, 10);
        if (!Number.isInteger(n) || n < 0) throw new SpikeRefusal("--kill-after takes a non-negative integer");
        args.killAfter = n;
      }
      continue;
    }
    throw new SpikeRefusal(`unknown argument: ${arg}`);
  }
  if (!args.dir) throw new SpikeRefusal("--dir is required");
  if (args.stages.length === 0) throw new SpikeRefusal("at least one --stage is required");
  return args;
}

/** How many stages are committed, and which one is next (deterministic, pure). */
export function planLane(stages, recorded) {
  const done = recorded.filter((entry) => stages.includes(entry)).length;
  return {
    done,
    next: stages[done] ?? null,
    complete: done === stages.length,
  };
}

/** Count phase invocations per stage from the ledger's JSONL lines. */
export function summarizeLedger(text, stages) {
  const lines = text.split("\n").filter(Boolean);
  const invocations = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (typeof parsed?.stage === "string") invocations.push(parsed);
    } catch {
      // a torn last line is a killed write, not an invocation
    }
  }
  const perStage = Object.fromEntries(stages.map((stage) => [stage, 0]));
  for (const entry of invocations) {
    if (entry.stage in perStage) perStage[entry.stage]++;
  }
  return {
    phases: invocations.length,
    per_stage: perStage,
    reexecuted: Object.entries(perStage).filter(([, n]) => n > 1).map(([stage]) => stage),
    pids: [...new Set(invocations.map((entry) => entry.pid))],
  };
}

/** The fixed receipt shape the spike report carries. */
export function renderReceipt({ stages, ledger, store, substrate }) {
  return {
    contract: SPIKE_CONTRACT_ID,
    substrate,
    store,
    stages,
    phases: ledger.phases,
    per_stage: ledger.per_stage,
    reexecuted: ledger.reexecuted,
    pids: ledger.pids,
  };
}

/**
 * Resolve the experimental substrate. Order: `PI_DURABLE_DIR` (a scratch
 * install), then a local resolution from this repository. Never a silent
 * fallback — an absent substrate is a refusal with the install line in it.
 */
export async function loadPiDurable(env = process.env) {
  const candidates = [];
  if (env.PI_DURABLE_DIR) {
    const dir = resolve(env.PI_DURABLE_DIR);
    candidates.push(pathToFileURL(join(dir, "node_modules", "@earendil-works", "pi-durable", "dist", "index.js")).href);
    candidates.push(join(dir, "dist", "index.js"));
  }
  candidates.push("@earendil-works/pi-durable");
  let lastError = null;
  for (const specifier of candidates) {
    try {
      return await import(specifier);
    } catch (error) {
      lastError = error;
    }
  }
  throw new SpikeRefusal(
    `pi-durable is not resolvable (${lastError?.message ?? "no candidate"}). Install it in a scratch dir and set ` +
      "PI_DURABLE_DIR: `mkdir /tmp/pdspike && cd /tmp/pdspike && bun add @earendil-works/pi-durable@1.5.0`",
  );
}

/** Append one ledger line inside the store dir. */
function appendLedger(dir, entry) {
  mkdirSync(dir, { recursive: true });
  appendFileSync(join(dir, LEDGER_FILE), `${JSON.stringify(entry)}\n`, "utf8");
}

/** The stage task: one phase, one commit, one receipt. */
function defineStageTask(durable, dir, stages, killDuring) {
  return durable.defineTask({
    name: "conductor.stage",
    version: 1,
    initial: (input) => ({ phase: "run", stage: input.stage }),
    phases: {
      run: async (task, runtime, context) => {
        appendLedger(dir, {
          stage: task.input.stage,
          pid: process.pid,
          at: new Date().toISOString(),
          invocation: task.invocation,
        });
        // `--kill-during`: die INSIDE the phase, before its commit. The phase
        // re-runs from its top on resume — the documented at-least-once half.
        const marker = join(dir, `.${task.input.stage}.died`);
        if (killDuring === task.input.stage && !existsSync(marker)) {
          mkdirSync(dir, { recursive: true });
          appendFileSync(marker, "died", "utf8");
          process.kill(process.pid, "SIGKILL");
        }
        await runtime.commit(
          () => ({
            status: "terminal",
            outcome: { status: "completed", result: { stage: task.input.stage, of: stages.length } },
          }),
          context,
        );
      },
    },
    abort: (_task, runtime, context) =>
      runtime.commit(() => ({ status: "terminal", outcome: { status: "aborted" } }), context),
  });
}

/**
 * Run (or resume) the lane. Returns the receipt data; the caller prints it.
 * `killAfter` SIGKILLs the process right after that many committed stages —
 * the death the spike measures, not a simulated one.
 */
export async function runLane(args, env = process.env) {
  const durable = await loadPiDurable(env);
  const context = (await import(resolveChord(env))).BACKGROUND_CONTEXT;
  const models = await import(resolvePiAiModels(env));
  const storageModule = await import(resolvePiDurableSub(env, "storage/jsonl/node.js"));
  const storage = await storageModule.openNodeJsonlStorage(join(args.dir, "store"), context);
  const Stage = defineStageTask(durable, args.dir, args.stages, args.killDuring);
  const registry = durable.createRegistry();
  registry.install({ name: "conductor-spike", tasks: [Stage] });
  const Lane = durable.defineDoc({
    kind: "pi.spike.lane",
    version: 1,
    scope: "conversation",
    history: "latest",
    fork: "initial",
    initial: () => ({ stages: [] }),
    checkpointWhen: () => false,
  });

  const harness = await durable.Harness.open(
    storage,
    { models: models.createModels(), registry },
    context,
  );
  const root = await harness.root(context);
  harness.resume();

  let lane = await harness.snapshot(Lane, root.id, context);
  const resumed = (lane?.stages?.length ?? 0) > 0;

  for (;;) {
    const recorded = (lane?.stages ?? []).map((entry) => entry.name);
    const plan = planLane(args.stages, recorded);
    if (plan.complete) break;
    const stage = plan.next;
    const taskId = await root.commit(async (tx) => {
      const doc = await tx.doc(Lane, root.id);
      const id = await tx.createTask(Stage, { stage }, { ownership: { kind: "conversation" } });
      doc.stages.push({ name: stage, taskId: id });
      return id;
    }, context);
    const settled = await harness.waitForTask(taskId, context);
    const outcome = settled?.state?.status === "terminal" ? settled.state.outcome?.status : null;
    if (outcome !== "completed") {
      await harness.close(context);
      throw new SpikeRefusal(`stage ${stage} did not complete (${outcome ?? settled?.state?.status ?? "unknown"})`);
    }
    lane = await harness.snapshot(Lane, root.id, context);
    if (args.killAfter !== null && lane.stages.length >= args.killAfter && lane.stages.length < args.stages.length) {
      await harness.close(context);
      // The kill lands after the commit and before the next stage: exactly the
      // window the supervisor restart re-opens at a step boundary.
      process.kill(process.pid, "SIGKILL");
    }
  }

  await harness.close(context);
  const ledgerPath = join(args.dir, LEDGER_FILE);
  const ledger = summarizeLedger(existsSync(ledgerPath) ? readFileSync(ledgerPath, "utf8") : "", args.stages);
  const receipt = renderReceipt({
    stages: args.stages,
    ledger,
    store: args.dir,
    substrate: "pi-durable",
  });
  return { receipt, resumed };
}

/** A subpath of the scratch install's pi-durable, resolved without a package manager. */
function resolvePiDurableSub(env, relative) {
  const base = env.PI_DURABLE_DIR ? join(env.PI_DURABLE_DIR, "node_modules") : "node_modules";
  return join(base, "@earendil-works", "pi-durable", "dist", relative);
}

/** chord's context module lives beside pi-durable in the same scratch install. */
function resolveChord(env) {
  const base = env.PI_DURABLE_DIR ? join(env.PI_DURABLE_DIR, "node_modules") : "node_modules";
  return join(base, "@earendil-works", "chord", "dist", "context", "index.js");
}

/** pi-ai's models module, same install. */
function resolvePiAiModels(env) {
  const base = env.PI_DURABLE_DIR ? join(env.PI_DURABLE_DIR, "node_modules") : "node_modules";
  return join(base, "@earendil-works", "pi-ai", "dist", "models.js");
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isMain) {
  try {
    const args = parseSpikeArgs(process.argv.slice(2));
    const { receipt, resumed } = await runLane(args);
    if (args.json) process.stdout.write(`${JSON.stringify({ ...receipt, resumed }, null, 2)}\n`);
    else {
      process.stdout.write(
        `SPIKE LANE — stages ${receipt.stages.length} · phases ${receipt.phases} · re-executed ${receipt.reexecuted.length}\n`,
      );
      for (const [stage, n] of Object.entries(receipt.per_stage)) process.stdout.write(`  ${stage}: ${n} phase invocation(s)\n`);
    }
    process.exit(0);
  } catch (error) {
    if (error instanceof SpikeRefusal) {
      process.stderr.write(`SPIKE REFUSAL — ${error.message}\n`);
      process.exit(2);
    }
    throw error;
  }
}
