/**
 * Tests for the bounded memory-substrate probe (feature 66, P1 — AC2, O1/O2).
 *
 * The five fixtures the plan names, plus the parse and ceiling contracts:
 *
 *   fixture-healthy         all five checks pass → verdict `ok` (keeps `ok`
 *                           reachable, so the suite is not always-degraded)
 *   fixture-timeout         the transport accepts the connection and never
 *                           answers → `degraded` on `http-health`
 *   fixture-missing-binary  `runImpl` reports ENOENT → `degraded` on
 *                           `binary-version`
 *   fixture-missing-runner  spawn failure + refused connection → `degraded`
 *                           on `mcp-runner` and `http-health`
 *   fixture-stale           pending sync work → `degraded` on `sync-staleness`
 *
 * Every case injects fakes with millisecond bounds: no network, no PATH, no
 * real engram process, so the suite is deterministic on any host.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";

import { runProbe, parseSyncStatus, PROBE_SCHEMA, PROBE_TIMEOUTS, CHECK_IDS } from "../src/memory/probe.mjs";

/* ── fake side effects ─────────────────────────────────────────────────── */

const healthyFetch = async () => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify({ status: "ok", service: "engram", version: "3.4.0" }),
});

const timeoutFetch = async (_url, init) =>
  new Promise((_resolve, reject) => {
    // Accepts, then never answers: the failure mode the probe exists for.
    init?.signal?.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    });
  });

const refusedFetch = async () => {
  throw new Error("connect ECONNREFUSED 127.0.0.1:7437");
};

const INIT_OK = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  result: {
    protocolVersion: "2024-11-05",
    capabilities: { tools: { listChanged: true } },
    serverInfo: { name: "engram", version: "3.4.0" },
  },
});

function enoent(command) {
  const error = new Error(`spawn ${command} ENOENT`);
  error.code = "ENOENT";
  return error;
}

/** A `runImpl` answering every CLI call the healthy way. */
const healthyRun = async (command, args) => {
  const joined = args.join(" ");
  if (joined === "--version") return { code: 0, stdout: "engram 3.4.0\n", stderr: "", timedOut: false, spawnError: null };
  if (joined === "mcp --tools=agent") return { code: 0, stdout: INIT_OK, stderr: "", timedOut: false, spawnError: null };
  if (joined === "sync --status") {
    return {
      code: 0,
      stdout: "Sync status:\n  Local chunks:    15\n  Remote chunks:   8\n  Pending import:  0\n",
      stderr: "",
      timedOut: false,
      spawnError: null,
    };
  }
  if (joined.startsWith("doctor --json --check")) {
    const checkId = args[args.length - 1];
    const report =
      checkId === "sync_target_closed_space"
        ? { status: "ok", checks: [{ check_id: checkId, result: "ok", message: "No issues detected." }] }
        : { status: "ok", checks: [{ check_id: checkId, result: "ok", message: "No issues detected." }] };
    return { code: 0, stdout: JSON.stringify(report), stderr: "", timedOut: false, spawnError: null };
  }
  throw new Error(`unexpected call: ${command} ${args.join(" ")}`);
};

const byId = (report) => Object.fromEntries(report.checks.map((c) => [c.id, c]));

/* ── verdict contract ──────────────────────────────────────────────────── */

describe("memory probe — verdict contract (AC2)", () => {
  it("fixture-healthy: all five checks pass and the verdict is ok", async () => {
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: healthyRun });
    strictEqual(report.schema, PROBE_SCHEMA);
    strictEqual(report.verdict, "ok");
    deepStrictEqual(report.degraded, []);
    deepStrictEqual(report.checks.map((c) => c.id), CHECK_IDS);
    for (const check of report.checks) strictEqual(check.status, "ok", `${check.id}: ${check.detail}`);
  });

  it("reports every check the plan names, in a fixed order", async () => {
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: healthyRun });
    deepStrictEqual(report.checks.map((c) => c.id), [
      "http-health",
      "mcp-runner",
      "binary-version",
      "sync-staleness",
      "session-ambiguity",
    ]);
  });

  it("the declared per-check bounds and ceiling are the planned ones", () => {
    deepStrictEqual(PROBE_TIMEOUTS, {
      httpHealth: 4_000,
      mcpRunner: 4_000,
      binaryVersion: 4_000,
      syncStaleness: 10_000,
      sessionAmbiguity: 10_000,
      total: 30_000,
    });
  });
});

/* ── fixture-timeout ───────────────────────────────────────────────────── */

describe("memory probe — fixture-timeout (bounded, never hangs)", () => {
  it("a transport that accepts but never answers degrades http-health", async () => {
    const report = await runProbe({ fetchImpl: timeoutFetch, runImpl: healthyRun, timeoutMs: 20 });
    const http = byId(report)["http-health"];
    strictEqual(http.status, "failed");
    strictEqual(http.reason, "timeout");
    strictEqual(report.verdict, "degraded");
    ok(report.degraded.includes("http-health"));
  });

  it("an unanswered runner initialize degrades mcp-runner, not the probe", async () => {
    const run = async (command, args, opts) => {
      if (args.join(" ") === "mcp --tools=agent") {
        return { code: null, stdout: "", stderr: "", timedOut: true, spawnError: null };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["mcp-runner"].reason, "timeout");
    strictEqual(byId(report)["http-health"].status, "ok");
    strictEqual(report.verdict, "degraded");
  });

  it("a whole-probe ceiling marks every unrun check as failed", async () => {
    const report = await runProbe({
      fetchImpl: timeoutFetch,
      runImpl: healthyRun,
      timeoutMs: 30,
      totalTimeoutMs: 1,
    });
    strictEqual(report.verdict, "degraded");
    strictEqual(report.ceilingHit, true);
    ok(report.checks.every((c) => c.status === "failed"));
  });
});

/* ── fixture-missing-binary ────────────────────────────────────────────── */

describe("memory probe — fixture-missing-binary (DEGRADED when absent)", () => {
  it("ENOENT for engram degrades binary-version and says why", async () => {
    const run = async (command) => ({
      code: null,
      stdout: "",
      stderr: "",
      timedOut: false,
      spawnError: enoent(command),
    });
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    const version = byId(report)["binary-version"];
    strictEqual(version.status, "failed");
    strictEqual(version.reason, "binary-missing");
    strictEqual(report.verdict, "degraded");
    ok(report.degraded.includes("binary-version"));
  });

  it("an unreadable version string is not accepted as health", async () => {
    const run = async (command, args) => {
      if (args.join(" ") === "--version") return { code: 0, stdout: "not a version\n", stderr: "", timedOut: false, spawnError: null };
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["binary-version"].reason, "binary-unreadable");
  });
});

/* ── fixture-missing-runner ────────────────────────────────────────────── */

describe("memory probe — fixture-missing-runner (both transports down)", () => {
  it("spawn failure + refused connection degrades mcp-runner and http-health", async () => {
    const run = async (command, args) => {
      if (args.join(" ") === "mcp --tools=agent") {
        return { code: null, stdout: "", stderr: "", timedOut: false, spawnError: enoent(command) };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: refusedFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["mcp-runner"].reason, "runner-missing");
    strictEqual(byId(report)["http-health"].reason, "http-unreachable");
    strictEqual(report.verdict, "degraded");
    ok(report.degraded.includes("mcp-runner"));
    ok(report.degraded.includes("http-health"));
  });

  it("a runner that answers without JSON-RPC is silent, not healthy", async () => {
    const run = async (command, args) => {
      if (args.join(" ") === "mcp --tools=agent") {
        return { code: 0, stdout: "starting...\n", stderr: "", timedOut: false, spawnError: null };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["mcp-runner"].reason, "runner-silent");
  });
});

/* ── fixture-stale (O2) ────────────────────────────────────────────────── */

describe("memory probe — fixture-stale (a responding server that has not synced is not ok)", () => {
  it("pending sync work degrades sync-staleness even with every other check green", async () => {
    const run = async (command, args) => {
      if (args.join(" ") === "sync --status") {
        return {
          code: 0,
          stdout: "Sync status:\n  Local chunks:    15\n  Remote chunks:   8\n  Pending import:  42\n",
          stderr: "",
          timedOut: false,
          spawnError: null,
        };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    const stale = byId(report)["sync-staleness"];
    strictEqual(stale.status, "failed");
    strictEqual(stale.reason, "sync-pending");
    strictEqual(report.verdict, "degraded");
    deepStrictEqual(report.degraded, ["sync-staleness"]);
  });

  it("an unreadable sync status is a degradation, never a pass", async () => {
    const run = async (command, args) => {
      if (args.join(" ") === "sync --status") {
        return { code: 3, stdout: "", stderr: "engram: ambiguous project: multiple git repos found in cwd\n", timedOut: false, spawnError: null };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["sync-staleness"].reason, "sync-unreadable");
    strictEqual(report.verdict, "degraded");
  });

  it("parseSyncStatus reads the fixed status block and refuses unknown text", () => {
    deepStrictEqual(parseSyncStatus("  Pending import:  0\n"), { parsed: true, pending: 0 });
    deepStrictEqual(parseSyncStatus("  Pending import:  7\n"), { parsed: true, pending: 7 });
    deepStrictEqual(parseSyncStatus("something else\n"), { parsed: false, pending: null });
  });
});

/* ── session ambiguity ─────────────────────────────────────────────────── */

describe("memory probe — session-ambiguity (AC5's machine signal)", () => {
  it("a non-ok doctor finding degrades the check despite exit code 0", async () => {
    const run = async (command, args) => {
      if (args.join(" ").startsWith("doctor --json --check")) {
        const checkId = args[args.length - 1];
        const report =
          checkId === "ambiguous_active_runtime_sessions"
            ? {
                status: "warning",
                checks: [{ check_id: checkId, result: "warning", message: "ambiguous active runtime sessions" }],
              }
            : { status: "ok", checks: [{ check_id: checkId, result: "ok", message: "No issues detected." }] };
        return { code: 0, stdout: JSON.stringify(report), stderr: "", timedOut: false, spawnError: null };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    const session = byId(report)["session-ambiguity"];
    strictEqual(session.status, "failed");
    strictEqual(session.reason, "doctor-warning");
    strictEqual(report.verdict, "degraded");
  });

  it("a closed-space sync target finding degrades the check", async () => {
    const run = async (command, args) => {
      if (args.join(" ").startsWith("doctor --json --check")) {
        const checkId = args[args.length - 1];
        const report =
          checkId === "sync_target_closed_space"
            ? {
                status: "error",
                checks: [{ check_id: checkId, result: "error", message: "20 finding(s) detected." }],
              }
            : { status: "ok", checks: [{ check_id: checkId, result: "ok", message: "No issues detected." }] };
        return { code: 0, stdout: JSON.stringify(report), stderr: "", timedOut: false, spawnError: null };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["session-ambiguity"].reason, "doctor-error");
  });

  it("an unparseable doctor report is unreadable, not healthy", async () => {
    const run = async (command, args) => {
      if (args.join(" ").startsWith("doctor --json --check")) {
        return { code: 0, stdout: "not json\n", stderr: "", timedOut: false, spawnError: null };
      }
      return healthyRun(command, args);
    };
    const report = await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    strictEqual(byId(report)["session-ambiguity"].reason, "doctor-unreadable");
  });
});

/* ── no mutation ───────────────────────────────────────────────────────── */

describe("memory probe — read-only contract", () => {
  it("never issues an MCP tool call: only initialize reaches the runner", async () => {
    const seen = [];
    const run = async (command, args, opts) => {
      seen.push({ command, args, stdin: opts?.stdin });
      return healthyRun(command, args);
    };
    await runProbe({ fetchImpl: healthyFetch, runImpl: run, timeoutMs: 20 });
    const runner = seen.find((c) => c.args.join(" ") === "mcp --tools=agent");
    ok(runner, "the runner was spawned");
    const message = JSON.parse(runner.stdin.trim());
    strictEqual(message.method, "initialize");
    ok(seen.every((c) => c.command === "engram"));
  });
});
