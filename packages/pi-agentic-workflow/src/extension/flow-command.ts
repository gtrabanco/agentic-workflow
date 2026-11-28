/**
 * The two lane entries — `/flow` and `/draft` (issue #669).
 *
 * Both are code, not skills: they carry no `SKILL.md`, no `argument-hint` and no
 * context budget, and they add nothing to the portable skill set. Each one runs
 * the crate's deterministic driver (`agentic-workflow flow`) and then does the
 * only thing a model may do with its answer — hand over the one step it named,
 * or stop where the driver said to stop.
 *
 * The split they encode is one program with two doors:
 *
 *   `/flow`  drives a unit from wherever it is; a planned unit implements
 *            directly, and re-planning is `--retriage`'s explicit job.
 *   `/draft` is the same program with `--stop-after plan` always in force and
 *            `--yes` dropped: stopping after the plan is its purpose, so a
 *            resumed draft cannot exist. Continuing is `/flow`.
 *
 * Nothing here decides a step: the step, the command, the stop rule and the
 * session mode all arrive in the driver's block, which is printed when it halts
 * and dispatched when it proceeds.
 */

import { spawnSync } from "node:child_process";

import { installedCandidate, runnerLaunch } from "../runner-bin.js";
import type { RunnerAnswer } from "../runner-bin.js";
import { runtimeBin } from "../runtime.js";
import type { CommandRegistrar } from "./factory.js";
import type { InvocationContext, ModelRef } from "../routing/types.js";

import { DRAFT_COMMAND, FLOW_COMMAND } from "../routing/types.js";

/** Re-exported so a reader of this module finds the names it registers. */
export { DRAFT_COMMAND, FLOW_COMMAND };

/**
 * The steps `/draft` may hand over. A draft exists to produce the plan, so a
 * driver answer naming anything later is printed, never run — the belt to
 * `--stop-after plan`'s braces (a driver that lost its stop rule still cannot
 * make this door proceed past the plan).
 */
const PLANNING_STEPS = new Set(["research", "design", "plan"]);

/** The driver's own block timeout: a sense + decide over local files is a read. */
const DRIVER_TIMEOUT_MS = 60_000;

/** The driver's decision, as the block declares it. */
export interface FlowDecision {
  readonly next: string | null;
  readonly nextStep: string | null;
  readonly stop: string;
  readonly session: string | null;
}

/** One runner invocation, injectable so a suite owns argv, cwd and exit status. */
export interface FlowRunRequest {
  readonly program: string;
  readonly argv: string[];
  readonly cwd: string;
  readonly timeoutMs: number;
}

/** The spawn result, narrowed to what the command reads. */
export interface FlowRunResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error?: Error;
}

export interface FlowCommandDeps<M extends ModelRef = ModelRef> {
  readonly run?: (request: FlowRunRequest) => FlowRunResult;
  /** The composed runner command; defaults to the shared `runnerLaunch`. */
  readonly launch?: (args: string[]) => Promise<RunnerAnswer>;
  /** Hands the driver's one command over; defaults to the router's dispatch. */
  readonly dispatch?: (command: string, ctx: InvocationContext<M>) => void | Promise<void>;
  readonly timeoutMs?: number;
}

/**
 * The operator's own tokens: the entry's forced and dropped flags removed, so
 * a guard can tell "no unit typed" from "flags only" (`/draft --yes` has no
 * unit either — the forced `--stop-after plan` must never mask that).
 */
export function operatorTokens(entry: string, args: string): string[] {
  const tokens = args.split(/\s+/u).filter(Boolean);
  if (entry !== DRAFT_COMMAND) return tokens;
  const kept: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]!;
    if (token === "--yes") continue;
    if (token === "--stop-after") {
      // The draft's stop is not negotiable: its own value replaces any typed one.
      index += 1;
      continue;
    }
    kept.push(token);
  }
  return kept;
}

/**
 * The argv the driver receives for one entry: `--stop-after plan` for the draft
 * (always, and it wins over any `--stop-after` the operator typed), `--yes`
 * dropped there because no flag cancels a draft's stop.
 */
export function driverArgs(entry: string, args: string): string[] {
  const kept = operatorTokens(entry, args);
  if (entry !== DRAFT_COMMAND) return kept;
  return ["--stop-after", "plan", ...kept];
}

/** The driver's `name: value` fields, or `null` when the answer carried none. */
export function parseDecision(stdout: string): FlowDecision | null {
  const fields = new Map<string, string>();
  for (const line of stdout.split("\n")) {
    const match = /^([a-z-]+): (.*)$/u.exec(line);
    if (match !== null) fields.set(match[1]!, match[2]!);
  }
  if (!fields.has("next-step") && !fields.has("next")) return null;
  return {
    next: fields.get("next") ?? null,
    nextStep: fields.get("next-step") ?? null,
    stop: fields.get("stop") ?? "none",
    session: fields.get("session") ?? null,
  };
}

async function defaultLaunch(args: string[]): Promise<RunnerAnswer> {
  return runnerLaunch(args, { installed: installedCandidate(runtimeBin()) });
}

function defaultRun(request: FlowRunRequest): FlowRunResult {
  const result = spawnSync(request.program, request.argv, {
    cwd: request.cwd,
    encoding: "utf8",
    timeout: request.timeoutMs,
    maxBuffer: 4 * 1024 * 1024,
  });
  return {
    status: result.status,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
    ...(result.error ? { error: result.error } : {}),
  };
}

/**
 * Register both entries on the shared registrar. `deps.dispatch` is the router
 * seam: production passes the same dispatch the catalogue commands use, so a
 * handed step is an ordinary command invocation.
 */
export function registerFlowCommands<M extends ModelRef = ModelRef>(
  registrar: CommandRegistrar<M>,
  deps: FlowCommandDeps<M>,
): void {
  const launchFor = deps.launch ?? defaultLaunch;
  const run = deps.run ?? defaultRun;
  const timeoutMs = deps.timeoutMs ?? DRIVER_TIMEOUT_MS;
  const dispatch = deps.dispatch;
  if (dispatch === undefined) throw new Error("registerFlowCommands needs a dispatch seam");

  const handlerFor = (entry: string) => async (args: string, ctx: InvocationContext<M>): Promise<void> => {
    // The guard judges the operator's own tokens (external-verify A2): the
    // draft's forced `--stop-after plan` must never make a unit-less invocation
    // look like an argumented one.
    if (operatorTokens(entry, args).length === 0) {
      ctx.notify(`/${entry} needs a unit: /${entry} <unit> [flags]`, "warning");
      return;
    }
    const driverArgv = driverArgs(entry, args);

    let launch: RunnerAnswer;
    try {
      launch = await launchFor(["flow", ...driverArgv]);
    } catch (error) {
      ctx.notify(
        `/${entry} could not find the runner crate: ${error instanceof Error ? error.message : String(error)}. Nothing ran.`,
        "error",
      );
      return;
    }

    let result: FlowRunResult;
    try {
      result = run({ program: launch.argv[0]!, argv: launch.argv.slice(1), cwd: ctx.cwd, timeoutMs });
    } catch (error) {
      ctx.notify(`/${entry}: the driver could not run — ${error instanceof Error ? error.message : String(error)}`, "error");
      return;
    }
    if (result.error) {
      ctx.notify(`/${entry}: the driver could not run — ${result.error.message}`, "error");
      return;
    }
    if (result.status !== 0) {
      const detail = result.stderr.trim() || result.stdout.trim() || `exited ${result.status}`;
      ctx.notify(`/${entry}: ${detail}`, "error");
      return;
    }

    const decision = parseDecision(result.stdout);
    if (decision === null) {
      ctx.notify(`/${entry}: the driver printed no decision — ${result.stdout.trim().slice(0, 200) || "(empty stdout)"}`, "error");
      return;
    }

    // Two stops, both printed and neither dispatched: the driver's own halt, and
    // (for the draft) any step that lives past the plan.
    const draftProceeds = entry === DRAFT_COMMAND && decision.nextStep !== null && PLANNING_STEPS.has(decision.nextStep);
    if (decision.stop !== "none" || (entry === DRAFT_COMMAND && !draftProceeds)) {
      ctx.notify(result.stdout.trim(), "info");
      return;
    }
    if (decision.next === null) {
      ctx.notify(`/${entry}: the driver named a step but no command — ${result.stdout.trim()}`, "error");
      return;
    }

    await dispatch(decision.next, ctx);
  };

  registrar.registerCommand(FLOW_COMMAND, {
    description:
      "Drive a unit to done deterministically: the closed catalog decides the next step from machine state, the model executes only that step. --yes cancels a post-plan tier stop (recorded in the unit's decisions), --retriage re-plans an already-planned unit.",
    handler: handlerFor(FLOW_COMMAND),
  });
  registrar.registerCommand(DRAFT_COMMAND, {
    description:
      "Plan a unit and always stop after the plan with the approval block: triage, pre-spec, design and plan only. Continuing is /flow.",
    handler: handlerFor(DRAFT_COMMAND),
  });
}
