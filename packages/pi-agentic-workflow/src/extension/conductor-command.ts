/**
 * The native `advance` command wiring (feature 62).
 *
 * Bridges the pi-free conductor loop to a live session: real sensor spawn,
 * real git probes, real run-log writes, real WIP-commit parking. One stage
 * per invocation by default — the invoked skill must settle before the next
 * sensor run can observe its effect — with `--continue` running the bounded
 * full loop. `--fullauto`/`--unattended` switch the unattended adversarial
 * floor on. The conductor never merges (feature 20 merge authority).
 */

import { execFile } from "node:child_process";
import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { DEFAULT_ADVANCE_CONFIG } from "../config/types.js";
import type { LoadedConfig } from "../config/load.js";
import { runtimeBin } from "../runtime.js";
import { runConductorLoop } from "../conductor/loop.js";
import { decideFromEnvelope } from "../conductor/decide.js";
import { invocationFromDecision } from "../conductor/invoke.js";
import { judgeUrgency } from "../conductor/urgency.js";
import { interruptedRun, readJournal } from "../conductor/journal.js";
import { parseAdvanceFlags } from "../conductor/resume.js";
import { renderSupervisorScript } from "../conductor/supervisor.js";
import type { ConductorConfig, LoopResult } from "../conductor/types.js";
import type { CommandRegistrar } from "./factory.js";
import type { InvocationContext, ModelRef } from "../routing/types.js";
import { ADVANCE_COMMAND } from "../routing/types.js";
import type { Router } from "../routing/dispatch.js";

function git(args: string[], cwd: string): Promise<{ ok: boolean; stdout: string }> {
  return new Promise((res) => {
    execFile("git", args, { cwd, timeout: 5_000 }, (err, stdout) => {
      res({ ok: !err, stdout: typeof stdout === "string" ? stdout : "" });
    });
  });
}

async function gitProbe(cwd: string): Promise<{ porcelain: string; ahead: number }> {
  const status = await git(["status", "--porcelain"], cwd);
  const ahead = await git(["rev-list", "--count", "@{upstream}..HEAD"], cwd);
  // No upstream (or probe failure) reads as unpushed work: fail closed to partial.
  return { porcelain: status.stdout, ahead: ahead.ok ? Number.parseInt(ahead.stdout.trim(), 10) || 0 : 1 };
}

function appendRunLog(config: ConductorConfig, cwd: string, line: string): void {
  const path = resolve(cwd, config.runLogPath ?? ".agentic-workflow/advance-run.log");
  try {
    mkdirSync(dirname(path), { recursive: true });
    appendFileSync(path, `${line}\n`, "utf8");
  } catch {
    // A run log that cannot be written never blocks the stage itself.
  }
}

/**
 * The journal's interrupted-run finding, read before the first sensor run
 * (issue #284). An unreadable log reads as "no interruption": `--resume` still
 * reconciles, and the reconcile itself fails closed on a verdict it cannot
 * verify.
 */
function readPreflight(config: ConductorConfig, cwd: string): ReturnType<typeof interruptedRun> {
  const path = resolve(cwd, config.runLogPath ?? ".agentic-workflow/advance-run.log");
  try {
    return interruptedRun(readJournal(readFileSync(path, "utf8")));
  } catch {
    return null;
  }
}

async function parkInFlight(cwd: string): Promise<void> {
  await git(["add", "-A"], cwd);
  await git(["commit", "-m", "wip: parked by advance (urgent interrupt)"], cwd);
}

/** Register the native `advance` command on the shared registrar. */
export function registerAdvanceCommand<M extends ModelRef = ModelRef>(
  registrar: CommandRegistrar<M>,
  deps: {
    router: Router<M>;
    /** The same bound config reader the router uses (factory's `read`). */
    readConfig: (ctx: InvocationContext<M>) => LoadedConfig;
  },
  commandNames: Set<string>,
): void {
  registrar.registerCommand(ADVANCE_COMMAND, {
    description:
      "Deterministic conductor: sensor → decide → invoke the next stage; stops on needs_input/stop. Never merges. --resume reconciles a crashed run; --print-supervisor prints the operator restarter.",
    handler: async (_args: string, ctx: InvocationContext<M>): Promise<void> => {
      const flags = parseAdvanceFlags(_args);
      const attended = flags.attended;
      const continueLoop = flags.continueLoop;

      // The effective advance knobs: the merged config when it carries the
      // key, the shipped defaults otherwise.
      let config: ConductorConfig = { ...DEFAULT_ADVANCE_CONFIG };
      let resume: "continue" | "restart" = "continue";
      try {
        const loaded = deps.readConfig(ctx);
        if (loaded.ok) {
          if (loaded.config.advance) config = loaded.config.advance;
          resume = (loaded.config.profileFallback?.resume as "continue" | "restart") ?? "continue";
        }
      } catch {
        // Config trouble falls back to the shipped advance defaults; the loop
        // itself is fail-closed on the sensor side anyway.
        // `resume` stays "continue".
      }

      // Issue #284: print the operator restarter and stop — printing never runs
      // the loop, never writes a file and never installs anything (ask-first).
      if (flags.printSupervisor) {
        ctx.notify(
          renderSupervisorScript({
            cwd: ctx.cwd,
            piBin: process.env.PI_BIN ?? "pi",
            advanceArgs: "--resume --continue",
            runLogPath: config.runLogPath,
          }),
          "info",
        );
        return;
      }

      const result: LoopResult = await runConductorLoop({
        cwd: ctx.cwd,
        runtimeBin: runtimeBin(),
        commandNames,
        maxInvokes: continueLoop ? undefined : 1,
        attended,
        config,
        resume: flags.resume,
        runMeta: () => ({ id: `r-${process.pid}-${Date.now()}`, pid: process.pid }),
        resumePreflight: async () => readPreflight(config, ctx.cwd),
        runSensor: (cwd, bin) =>
          import("../conductor/sensor.js").then(({ runSensor }) => runSensor(cwd, bin as "bun" | "node")),
        decide: decideFromEnvelope,
        invocation: invocationFromDecision,
        judgeUrgency,
        sendUserMessage: async (invocation: string) => {
          const match = /^\/skill:(\S+)(?:\s+([\s\S]*))?$/u.exec(invocation);
          const verb = match?.[1] ?? invocation.replace(/^\/skill:/u, "").split(" ")[0];
          const args = match?.[2] ?? "";
          const dispatchResult = await deps.router.dispatch({ name: verb, skill: verb }, args, ctx, { onProfileSwitch: resume });
          return {
            ok: dispatchResult.status === "dispatched",
            ...(dispatchResult.status === "dispatched" && dispatchResult.profileSwitched ? { profileSwitched: dispatchResult.profileSwitched } : {}),
            ...(dispatchResult.status === "dispatched" && dispatchResult.deferred ? { deferred: true } : {}),
          };
        },
        profileResume: resume,
        gitProbe: () => gitProbe(ctx.cwd),
        appendRunLog: (line: string) => appendRunLog(config, ctx.cwd, line),
        parkInFlight: () => {
          return parkInFlight(ctx.cwd);
        },
      });

      ctx.notify(`${result.banner} — ${result.detail ?? ""} (iterations: ${result.iterations})`, "info");
    },
  });
}
