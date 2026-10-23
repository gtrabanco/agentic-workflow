/**
 * Bounded memory-substrate health probe (feature 66, P1 — AC2).
 *
 * Answers one question before a session's first memory read: is the Engram
 * memory layer healthy enough to trust, and if not, exactly which layer is
 * degraded? Five checks, one verdict:
 *
 *   http-health        GET :7437/health — the HTTP server pi talks to.
 *   mcp-runner         one `initialize` round-trip to a spawned
 *                      `engram mcp --tools=agent` — the stdio transport.
 *   binary-version     `engram --version` — the CLI both transports ride on.
 *   sync-staleness     `engram sync --status` — pending import work.
 *   session-ambiguity  `engram doctor --json --check` on the two findings
 *                      that make a session id unreliable or a sync target
 *                      unreachable.
 *
 * Two design rules ride on measured failure modes, not guesses:
 *
 * - **Exit code is not a health signal.** `engram doctor` exits 0 while its
 *   JSON says `status: "error"`, so every check parses the answer it gets and
 *   never trusts a zero exit.
 * - **A responding server that has not synced is not `ok`** (AC2's staleness
 *   signal), which is why `sync-staleness` is a check and not a footnote.
 * - **One answer never hides another.** The session check asks both scoped
 *   `doctor --check` ids and reports every non-`ok` finding: the first is
 *   non-`ok` permanently on a machine with session-attribution ambiguity, so
 *   stopping at it would silence the sync signal there forever.
 *
 * The five checks are independent, so they are launched together and each keeps
 * its own bound: the worst case is the slowest bound, never the sum of five
 * (4+4+4+10+10 = 32 s, which the 30 s ceiling could not fit). The probe never
 * issues an MCP *tool* call — only `initialize` — so running it can never mutate
 * the memory layer. Bounds: 4 s for the HTTP/runner/version calls, 10 s for the
 * two CLI-backed calls, and a 30 s ceiling over the whole probe, which stops any
 * dependency that ignored its own bound. A bound hit fails that check and the
 * verdict becomes `degraded` — never a hang, never a blocked unit (D1).
 *
 * `runProbe` takes its side effects by injection (`fetchImpl`, `runImpl`,
 * `timeoutMs`, `totalTimeoutMs`) — the crate's existing shape
 * (`src/doc/embeddings.mjs`'s `fetchImpl ?? fetch`) — so the suite drives
 * every degraded path with fakes and millisecond bounds: no network, no PATH,
 * no real engram process.
 */

import { spawn } from "node:child_process";

export const PROBE_SCHEMA = "memory-probe@1";

/** Per-check timeout bounds (ms), and the ceiling over the whole probe. */
export const PROBE_TIMEOUTS = Object.freeze({
  httpHealth: 4_000,
  mcpRunner: 4_000,
  binaryVersion: 4_000,
  syncStaleness: 10_000,
  sessionAmbiguity: 10_000,
  total: 30_000,
});

const HEALTH_URL = "http://127.0.0.1:7437/health";
const ENGRAM_BIN = "engram";
const RUNNER_ARGS = ["mcp", "--tools=agent"];
const INITIALIZE = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "agentic-workflow-memory-probe", version: "1" },
  },
};

const CHECK_IDS = Object.freeze([
  "http-health",
  "mcp-runner",
  "binary-version",
  "sync-staleness",
  "session-ambiguity",
]);

function pass(id, detail) {
  return { id, status: "ok", detail };
}

function fail(id, reason, detail) {
  return { id, status: "failed", reason, detail };
}

/**
 * Run one child process under a bound. Resolves to
 * `{code, stdout, stderr, timedOut, spawnError}` — it never rejects, because
 * every failure mode here is an answer, not an exception.
 *
 * `stdin` is written and the stream closed immediately: the MCP runner would
 * otherwise wait forever for its client, which is the hang this probe exists
 * to avoid.
 */
function runBounded(command, args, { timeoutMs, stdin = null } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    let child;
    const done = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      if (child) {
        try {
          child.kill("SIGKILL");
        } catch {
          // the process already exited — the settle below is what matters
        }
      }
      done({ code: null, stdout: "", stderr: "", timedOut: true, spawnError: null });
    }, timeoutMs);

    try {
      child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    } catch (error) {
      done({ code: null, stdout: "", stderr: "", timedOut: false, spawnError: error });
      return;
    }

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    child.on("error", (error) => done({ code: null, stdout, stderr, timedOut: false, spawnError: error }));
    child.on("close", (code) => done({ code, stdout, stderr, timedOut: false, spawnError: null }));

    if (child.stdin) {
      child.stdin.on("error", () => {
        // the runner died before reading — reported by close/error
      });
      child.stdin.end(stdin ?? "");
    }
  });
}

/** First JSON object found in a text stream (doctor/mcp may pad with noise). */
function firstJsonObject(text) {
  const start = text.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** `engram sync --status` reports pending work as a fixed text block. */
export function parseSyncStatus(text) {
  const match = text.match(/Pending import:\s*(\d+)/i);
  if (!match) return { parsed: false, pending: null };
  return { parsed: true, pending: Number(match[1]) };
}

async function checkHttpHealth(fetchImpl, timeoutMs) {
  const id = "http-health";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(HEALTH_URL, { signal: controller.signal });
    if (!response.ok) return fail(id, "http-status", `HTTP ${response.status}`);
    let body = null;
    try {
      body = JSON.parse(await response.text());
    } catch {
      return fail(id, "http-unparseable", "health body is not JSON");
    }
    if (body?.status !== "ok") return fail(id, "http-unhealthy", `status ${body?.status ?? "missing"}`);
    return pass(id, `engram ${body?.version ?? "unknown"} answering`);
  } catch (error) {
    if (error?.name === "AbortError") return fail(id, "timeout", `no HTTP answer within ${timeoutMs} ms`);
    return fail(id, "http-unreachable", error?.message ?? String(error));
  } finally {
    clearTimeout(timer);
  }
}

async function checkMcpRunner(runImpl, timeoutMs) {
  const id = "mcp-runner";
  const result = await runImpl(ENGRAM_BIN, RUNNER_ARGS, {
    timeoutMs,
    stdin: JSON.stringify(INITIALIZE) + "\n",
  });
  if (result.spawnError) return fail(id, "runner-missing", result.spawnError.message);
  if (result.timedOut) return fail(id, "timeout", `no initialize answer within ${timeoutMs} ms`);
  const reply = firstJsonObject(result.stdout ?? "");
  if (!reply) return fail(id, "runner-silent", `exit ${result.code}, no JSON-RPC reply`);
  if (reply.error) return fail(id, "runner-error", reply.error.message ?? "JSON-RPC error");
  const info = reply.result?.serverInfo;
  if (!info?.name) return fail(id, "runner-silent", "initialize reply carries no serverInfo");
  return pass(id, `${info.name} ${info.version ?? "unknown"} initialized`);
}

async function checkBinaryVersion(runImpl, timeoutMs) {
  const id = "binary-version";
  const result = await runImpl(ENGRAM_BIN, ["--version"], { timeoutMs });
  if (result.spawnError) return fail(id, "binary-missing", result.spawnError.message);
  if (result.timedOut) return fail(id, "timeout", `no version answer within ${timeoutMs} ms`);
  const match = (result.stdout ?? "").match(/\d+\.\d+\.\d+\S*/);
  if (!match) return fail(id, "binary-unreadable", `exit ${result.code}, no version string`);
  if (result.code !== 0) return fail(id, "binary-unreadable", `exit ${result.code}`);
  return pass(id, `engram ${match[0]}`);
}

async function checkSyncStaleness(runImpl, timeoutMs) {
  const id = "sync-staleness";
  const result = await runImpl(ENGRAM_BIN, ["sync", "--status"], { timeoutMs });
  if (result.spawnError) return fail(id, "binary-missing", result.spawnError.message);
  if (result.timedOut) return fail(id, "timeout", `no sync answer within ${timeoutMs} ms`);
  // A non-zero exit here is usually "ambiguous project" — the status is
  // unreadable, which is a degradation, not a pass.
  if (result.code !== 0) {
    const detail = (result.stderr ?? "").trim().split("\n").pop() || `exit ${result.code}`;
    return fail(id, "sync-unreadable", detail);
  }
  const parsed = parseSyncStatus(`${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  if (!parsed.parsed) return fail(id, "sync-unreadable", "no pending-import line in the status block");
  if (parsed.pending > 0) return fail(id, "sync-pending", `${parsed.pending} pending import(s)`);
  return pass(id, "no pending import work");
}

/** One check-scoped `engram doctor --json --check <id>` answer, classified. */
async function askDoctor(runImpl, checkId, timeoutMs) {
  const result = await runImpl(ENGRAM_BIN, ["doctor", "--json", "--check", checkId], { timeoutMs });
  if (result.spawnError) return { checkId, reason: "binary-missing", detail: result.spawnError.message, structural: true };
  if (result.timedOut) return { checkId, reason: "timeout", detail: `no answer within ${timeoutMs} ms`, structural: true };
  const report = firstJsonObject(result.stdout ?? "");
  if (!report) return { checkId, reason: "doctor-unreadable", detail: "no JSON report", structural: true };
  const entry = (report.checks ?? []).find((c) => c.check_id === checkId) ?? report.checks?.[0];
  if (!entry) return { checkId, reason: "doctor-unreadable", detail: "report carries no check", structural: true };
  if (entry.result !== "ok") {
    return { checkId, reason: `doctor-${entry.result}`, detail: entry.message ?? entry.result, structural: false };
  }
  return { checkId, ok: true };
}

/**
 * Which finding leads the reason code when more than one answer is not `ok`.
 * An `error` outranks a `blocked` target, which outranks a `warning`; a check
 * that could not be answered at all outranks any finding (see the caller).
 */
const RESULT_RANK = { error: 3, blocked: 2, warning: 1 };

async function checkSessionAmbiguity(runImpl, timeoutMs) {
  const id = "session-ambiguity";
  // Both scoped checks are asked, every time, and in parallel: each is bounded
  // on its own, so pairing them costs no extra wall time, and an answer is
  // never dropped because an earlier finding was already enough to degrade.
  const answers = await Promise.all(DOCTOR_CHECKS.map((checkId) => askDoctor(runImpl, checkId, timeoutMs)));
  const failures = answers.filter((answer) => answer.ok !== true);
  if (failures.length === 0) return pass(id, "no session or sync-target findings");
  // A check that could not be answered at all says more about the layer than a
  // finding does, so a structural failure leads the reason code; otherwise the
  // most severe finding leads, and every finding is listed in the detail.
  const severity = (failure) => (failure.structural ? 4 : RESULT_RANK[failure.reason.replace("doctor-", "")] ?? 0);
  const leading = failures.reduce((best, current) => (severity(current) > severity(best) ? current : best));
  const detail = failures.map((failure) => `${failure.checkId}: ${failure.detail}`).join(" · ");
  return fail(id, leading.reason, detail);
}

/**
 * The two scoped `doctor --json --check <id>` ids the session check asks, named
 * by the plan (P1) and never the full sweep: the first makes a write's session
 * attribution unreliable, the second says a sync target cannot be reached.
 */
const DOCTOR_CHECKS = Object.freeze(["ambiguous_active_runtime_sessions", "sync_target_closed_space"]);

/** The detail a check carries when the ceiling, not its own bound, stopped it. */
const CEILING_DETAIL = "probe ceiling reached before this check answered";

const CHECKS = [
  { id: "http-health", timeout: PROBE_TIMEOUTS.httpHealth, run: (deps, ms) => checkHttpHealth(deps.fetchImpl, ms) },
  { id: "mcp-runner", timeout: PROBE_TIMEOUTS.mcpRunner, run: (deps, ms) => checkMcpRunner(deps.runImpl, ms) },
  { id: "binary-version", timeout: PROBE_TIMEOUTS.binaryVersion, run: (deps, ms) => checkBinaryVersion(deps.runImpl, ms) },
  { id: "sync-staleness", timeout: PROBE_TIMEOUTS.syncStaleness, run: (deps, ms) => checkSyncStaleness(deps.runImpl, ms) },
  { id: "session-ambiguity", timeout: PROBE_TIMEOUTS.sessionAmbiguity, run: (deps, ms) => checkSessionAmbiguity(deps.runImpl, ms) },
];

/**
 * Run the five checks and return the verdict:
 *
 *   {schema, verdict: "ok" | "degraded", checks: [{id, status, reason?, detail}],
 *    degraded: [check ids], ceilingHit: boolean}
 *
 * `ok` only when every check passes. The checks are independent, so they run
 * together, each under its own bound; the ceiling is the hard stop over the
 * whole probe and answers for any check whose dependency ignored its bound, so a
 * slow machine can never masquerade as healthy and never hangs.
 *
 * `timeoutMs` overrides every per-check bound (tests use milliseconds);
 * `totalTimeoutMs` overrides the ceiling.
 */
export async function runProbe({ fetchImpl, runImpl, timeoutMs, totalTimeoutMs } = {}) {
  const deps = {
    fetchImpl: fetchImpl ?? ((url, init) => fetch(url, init)),
    runImpl: runImpl ?? ((command, args, opts) => runBounded(command, args, opts)),
  };
  const perCheck = timeoutMs ?? null;
  const ceiling = totalTimeoutMs ?? PROBE_TIMEOUTS.total;
  const startedAt = Date.now();
  const remaining = () => ceiling - (Date.now() - startedAt);

  const answers = new Array(CHECKS.length).fill(null);
  let stopped = false;
  // Set when the ceiling — not a check's own bound — is what ran out. Tracked
  // directly instead of read back out of a detail string, so the wording of a
  // failure can never change what `ceilingHit` reports.
  let ceilingConstrained = false;
  const launched = CHECKS.map(async (check, index) => {
    const budget = perCheck ?? check.timeout;
    const left = remaining();
    if (left <= 0) {
      ceilingConstrained = true;
      answers[index] = fail(check.id, "timeout", CEILING_DETAIL);
      return;
    }
    // The ceiling clamps the bound a check runs under; a timeout that is really
    // the ceiling running out is reported as the ceiling, not as a hung check.
    const bound = Math.min(budget, left);
    const clamped = bound < budget;
    let entry;
    try {
      entry = await check.run(deps, bound);
    } catch (error) {
      entry = fail(check.id, "probe-error", error?.message ?? String(error));
    }
    if (stopped) return;
    if (clamped && entry.status === "failed" && entry.reason === "timeout") {
      ceilingConstrained = true;
      entry = { ...entry, detail: `${CEILING_DETAIL} (bound cut from ${budget} ms to ${bound} ms)` };
    }
    answers[index] = entry;
  });

  const left = Math.max(remaining(), 0);
  let timer = null;
  const ceilingFired = await new Promise((resolve) => {
    timer = setTimeout(() => {
      stopped = true;
      resolve(true);
    }, left);
    Promise.allSettled(launched).then(() => resolve(false));
  });
  if (timer) clearTimeout(timer);

  const results = CHECKS.map((check, index) => {
    if (answers[index] !== null) return answers[index];
    // The ceiling fired while this check was still outstanding: its dependency
    // ignored the bound it was given, and the probe answers for it.
    ceilingConstrained = true;
    return fail(check.id, "timeout", CEILING_DETAIL);
  });
  const degraded = results.filter((r) => r.status !== "ok").map((r) => r.id);
  return {
    schema: PROBE_SCHEMA,
    verdict: degraded.length === 0 ? "ok" : "degraded",
    checks: results,
    degraded,
    ceilingHit: ceilingFired === true || ceilingConstrained === true,
  };
}

export { CHECK_IDS, HEALTH_URL, RUNNER_ARGS, ENGRAM_BIN };
