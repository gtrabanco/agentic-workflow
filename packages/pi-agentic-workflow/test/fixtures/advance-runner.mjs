// advance-runner.mjs — a real conductor loop the crash fixture can kill.
//
// Used only by `conductor-crash-resume.test.mjs`: the fixture's `fake-pi.sh`
// invokes this file exactly as the supervisor template invokes `pi -p "<args>"`,
// so the SIGKILL lands on a live `runConductorLoop` with the real sensor spawn,
// the real journal writer and the real reconcile gate.

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { runConductorLoop, readJournal, interruptedRun } from "../../dist/conductor/index.js";
import { runSensor } from "../../dist/conductor/sensor.js";

const argv = process.argv.slice(2);
const advanceArgs = argv[0] === "-p" ? (argv[1] ?? "") : argv.join(" ");
const dir = process.env.ADVANCE_DIR;
if (!dir) {
  process.stderr.write("ADVANCE_DIR is required\n");
  process.exit(2);
}

const root = resolve(dir);
const runLogPath = ".agentic-workflow/advance-run.log";
const logPath = join(root, runLogPath);
const receipts = join(root, "receipts");

const readLog = () => {
  try {
    return readFileSync(logPath, "utf8");
  } catch {
    return "";
  }
};
const writeLog = (line) => {
  mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
  appendFileSync(logPath, `${line}\n`, "utf8");
};

const result = await runConductorLoop({
  cwd: root,
  runtimeBin: "bun",
  commandNames: new Set(["/skill:stage-1", "/skill:stage-2", "/skill:stage-3"]),
  attended: false,
  config: { iterationsCap: 12, runLogPath },
  runSensor: (cwd, bin) => runSensor(cwd, bin),
  decide: ({ envelope }) => {
    const recommended = String(envelope.next?.recommended ?? "");
    if (!recommended) {
      return { kind: "stop", intent: "stop", targets: [], reasonCode: "stop-nothing-startable", evidenceRefs: [], detail: "nothing startable" };
    }
    const [verb, ...targets] = recommended.replace(/^\/skill:/u, "").split(" ");
    return { kind: "invoke", intent: verb, targets, reasonCode: "invoke-proven-transition", evidenceRefs: ["envelope"], detail: "" };
  },
  invocation: (decision) => ({
    ok: true,
    invocation: `/skill:${decision.intent}${decision.targets.length > 0 ? ` ${decision.targets.join(" ")}` : ""}`,
  }),
  judgeUrgency: () => ({ verdict: "no-urgent", reason: "fixture" }),
  gitProbe: async () => ({ porcelain: "", ahead: 0 }),
  appendRunLog: writeLog,
  parkInFlight: async () => {},
  sendUserMessage: async (invocation) => {
    appendFileSync(join(root, "invocations.log"), `${invocation}\n`, "utf8");
    const stage = invocation.replace(/^\/skill:/u, "").split(" ")[0];
    mkdirSync(receipts, { recursive: true });
    writeFileSync(join(receipts, `${stage}.done`), "ok", "utf8");
    const marker = join(root, "killed-once");
    if (process.env.KILL_AFTER_RECEIPT === "1" && !existsSync(marker)) {
      writeFileSync(marker, "killed", "utf8");
      process.kill(process.pid, "SIGKILL");
    }
    return { ok: true };
  },
  runMeta: () => ({ id: `r-${process.pid}`, pid: process.pid }),
  resumePreflight: async () => interruptedRun(readJournal(readLog())),
  resume: advanceArgs.includes("--resume"),
});

process.stdout.write(`${JSON.stringify(result)}\n`);
