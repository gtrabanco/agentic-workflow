// conductor-supervisor.test.mjs — the operator-side restarter template
//
// S1: an external restarter re-invokes `advance` after process death. S2: a
// killed run completes with zero human interaction. S3: a human-decision stop
// must stay visible. S5: the supervisor is operator-side text, dependency-free
// — nothing here imports a runtime package or installs anything.

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const { renderSupervisorScript } = await import("../dist/conductor/index.js");

const scratch = mkdtempSync(join(tmpdir(), "aw-supervisor-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));

/** A fake `pi`: it records its calls and writes the journal row its MODE says. */
function writeFakePi(dir) {
  const path = join(dir, "fake-pi.sh");
  writeFileSync(path, `#!/bin/sh
n=0
[ -f "$COUNT_FILE" ] && n=$(cat "$COUNT_FILE")
n=$((n + 1))
printf '%s' "$n" > "$COUNT_FILE"
ts=$(date '+%Y-%m-%d %H:%M')
case "$MODE" in
  ok) printf '%s — run/stop — stop-nothing-startable — 1/12\\n' "$ts" >> "$LOG" ;;
  crash-once)
    if [ "$n" -ge 2 ]; then printf '%s — run/stop — stop-nothing-startable — 1/12\\n' "$ts" >> "$LOG"; fi ;;
  crash) : ;;
  human) printf '%s — run/stop — stop-crash-ambiguous — 0/12\\n' "$ts" >> "$LOG" ;;
esac
exit 0
`, "utf8");
  chmodSync(path, 0o755);
  return path;
}

function scenario(mode, spec = {}) {
  const dir = mkdtempSync(join(scratch, `${mode}-`));
  const piBin = writeFakePi(dir);
  const runLogPath = ".agentic-workflow/advance-run.log";
  const script = renderSupervisorScript({ cwd: dir, piBin, advanceArgs: "--resume --continue", runLogPath, restartCap: 3, backoffSeconds: 0, ...spec });
  const scriptPath = join(dir, "supervisor.sh");
  writeFileSync(scriptPath, script, "utf8");
  const logPath = join(dir, runLogPath);
  mkdirSync(join(dir, ".agentic-workflow"), { recursive: true });
  writeFileSync(logPath, "", "utf8");
  const countFile = join(dir, "count");
  const out = spawnSync("sh", [scriptPath], {
    encoding: "utf8",
    env: { ...process.env, MODE: mode, LOG: logPath, COUNT_FILE: countFile },
    timeout: 30_000,
  });
  const log = readFileSync(logPath, "utf8");
  return { dir, out, log, calls: existsSync(countFile) ? Number(readFileSync(countFile, "utf8")) : 0 };
}

const rowKinds = (log) => log.split("\n").filter(Boolean).map((l) => l.split(" — ")[1]);

test("SV1: the template is a self-contained POSIX shell script naming the resume run", () => {
  const script = renderSupervisorScript({ cwd: "/tmp/project", piBin: "pi" });
  assert.ok(script.startsWith("#!/bin/sh"));
  assert.match(script, /advance-supervisor@1/u);
  assert.match(script, /--resume --continue/u);
  assert.match(script, /\.agentic-workflow\/advance-run\.log/u);
  assert.match(script, /run\/stop/u, "the terminal-row probe is the restart condition");
  for (const banned of ["npm", "npx", "node_modules", "curl", "wget"]) {
    assert.ok(!script.includes(banned), `no ${banned} — dependency-free by contract`);
  }
});

test("SV2: a completed run is attempted once and the supervisor exits 0 without restarting", () => {
  const { out, log, calls } = scenario("ok");
  assert.equal(out.status, 0);
  assert.equal(calls, 1);
  assert.ok(!rowKinds(log).includes("supervisor/restart"));
});

test("SV3: a run that dies without a terminal row is restarted, then completes unattended", () => {
  const { out, log, calls } = scenario("crash-once");
  assert.equal(out.status, 0, "the loop finished after one restart");
  assert.equal(calls, 2);
  assert.equal(rowKinds(log).filter((k) => k === "supervisor/restart").length, 1);
  assert.ok(log.split("\n").some((l) => /supervisor\/restart/u.test(l) && /1\/3$/u.test(l)), "restart row carries attempt/cap");
});

test("SV4: restarts are bounded — the cap writes supervisor/exhausted and exits 1", () => {
  const { out, log, calls } = scenario("crash");
  assert.equal(out.status, 1);
  assert.equal(calls, 3);
  assert.equal(rowKinds(log).filter((k) => k === "supervisor/restart").length, 2);
  assert.equal(rowKinds(log).filter((k) => k === "supervisor/exhausted").length, 1);
});

test("SV5: a human-decision terminal stop exits 3 — the operator sees it, the loop stays stopped", () => {
  const { out, log, calls } = scenario("human");
  assert.equal(out.status, 3);
  assert.equal(calls, 1, "never retried — a human owns this stop");
  assert.ok(!rowKinds(log).includes("supervisor/restart"));
});

test("SV6: paths and arguments are shell-quoted — a space and a quote in the cwd survive", () => {
  const dir = mkdtempSync(join(scratch, "quoted-"));
  const weird = join(dir, "a dir with 'quote'");
  mkdirSync(weird, { recursive: true });
  const piBin = writeFakePi(dir);
  const script = renderSupervisorScript({ cwd: weird, piBin, advanceArgs: `--resume --label "o'brien"`, restartCap: 1, backoffSeconds: 0 });
  const scriptPath = join(dir, "quoted.sh");
  writeFileSync(scriptPath, script, "utf8");
  const logPath = join(weird, ".agentic-workflow", "advance-run.log");
  mkdirSync(join(weird, ".agentic-workflow"), { recursive: true });
  const countFile = join(dir, "quoted-count");
  const out = spawnSync("sh", [scriptPath], { encoding: "utf8", env: { ...process.env, MODE: "ok", LOG: logPath, COUNT_FILE: countFile }, timeout: 30_000 });
  assert.equal(out.status, 0, out.stderr);
  assert.equal(Number(readFileSync(countFile, "utf8")), 1, "the fake pi ran inside the quoted cwd");
});
