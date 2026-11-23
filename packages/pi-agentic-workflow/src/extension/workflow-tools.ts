/**
 * workflow-tools — the pi package's deferred tool surface (issue #274).
 *
 * The envelope-emitting deterministic scripts an agent already runs through
 * bash in the middle of the loop register as deferred pi tools: the declared
 * `outputSchema` is the machine contract the repo already publishes, so
 * programmatic consumers (codemode scripts, `tool_search`-loaded sessions)
 * receive typed `structuredContent` instead of re-parsed text, and red gates
 * arrive as `isError: true` carrying data instead of an exit code. The tools
 * are `exposure: "deferred"` — never declared to the model, zero standing token
 * cost, callable by name from codemode — and the skills keep their bash
 * wording: a tool here is a thin wrapper over the same script spawn, never a
 * second source of truth for any receipt.
 *
 * This module is Pi-free: a spec's `execute(params, cwd)` returns a
 * `WorkflowToolRun`, and the adapter (`index.ts`) translates to
 * `pi.registerTool`. That translation is not decoration (issue #678): pi calls
 * a tool as `execute(toolCallId, params, signal, onUpdate, ctx)`, so the adapter
 * turns the host's five arguments into this seam's two — `params` and
 * `ctx.cwd` — and a spec registered raw would read the toolCallId as its
 * params. The scripts run from the **project's own checkout** (the spawn cwd),
 * the same path the conductor sensor takes — the package's pinned copy is never
 * an import shortcut for a receipt about a tree being worked on.
 */

import { spawn } from "node:child_process";
import { installedCandidate, runnerLaunch } from "../runner-bin.js";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import type { Envelope } from "@gtrabanco/agentic-workflow-schema";

import { runSensor } from "../conductor/sensor.js";
import type { EnvelopeLike, SensorResult } from "../conductor/types.js";
import { runtimeBin } from "../runtime.js";

/** The pi namespace every workflow tool registers under (issue #274 P1). */
export const WORKFLOW_TOOLS_NAMESPACE = {
  name: "agentic-workflow",
  description:
    "Deterministic workflow sensors and gates, run through the pinned " +
    "@gtrabanco/agentic-workflow runner (one subcommand each), plus the generic " +
    "runner door for every other subcommand. Results arrive as structured data; " +
    "red gates as errors with data.",
  instructions:
    "Each tool spawns the pinned package's runner bin (agentic-workflow " +
    "<subcommand>) with the session's cwd as the project root — the pin " +
    "decides the behaviour, never the project's checkout; audit-pr-gate " +
    "still runs the project's own scripts/audit-pr-gate.mjs. A skill's " +
    "`runner <subcommand> [args…]` citation runs through `agentic_workflow_run`, " +
    "which composes the command itself (installed bin first, the crate's closed " +
    "runner set only when that dependency is missing) and returns the " +
    "subcommand's own stdout, stderr and exit code. Successful runs resolve to " +
    "the tool's output schema; gate failures (breach, BLOCKED, stale receipt, " +
    "BLOCKED verdict, non-zero subcommand exit) reject or carry isError with the " +
    "structured result attached. The tools are deferred: find them with " +
    "tool_search or call them by name from a codemode script.",
} as const;

/** What one tool run returns to the adapter. */
export interface WorkflowToolRun {
  /** Model-facing text (the same data as JSON, so the model loses nothing). */
  text: string;
  /** The machine result; delivered to codemode scripts instead of the text. */
  structuredContent: unknown;
  /** True when the run answers a red gate or a degraded spawn. */
  isError?: boolean;
}

/**
 * A Pi-free tool spec. `parameters`/`outputSchema` are plain JSON Schema
 * objects — pi treats tool schemas as JSON Schema, and the adapter casts at
 * the single registration site.
 */
export interface WorkflowToolSpec {
  name: string;
  label: string;
  description: string;
  parameters: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  /** Deferred: never declared to the model; findable by `tool_search`, callable from codemode. */
  exposure: "deferred";
  namespace: typeof WORKFLOW_TOOLS_NAMESPACE;
  annotations: { readOnlyHint: true };
  execute(params: Record<string, unknown>, cwd: string): Promise<WorkflowToolRun>;
}

export interface WorkflowToolsDeps {
  /** The runtime bin for spawned scripts; defaults to `runtimeBin()`. */
  bin?: () => "bun" | "node";
  /** The conductor's sensor seam, injectable for tests. */
  runSensor?: (cwd: string, bin: "bun" | "node") => Promise<SensorResult>;
  /**
   * The spawn seam for the gate tools: runs one composed command in cwd and
   * reports its exit code and captured streams. Injectable for tests.
   */
  spawnScript?: SpawnScript;
  /**
   * Issue #690 — the attribution seam: the session hears the subcommand the
   * generic door is about to run, so it can resolve the unit that command names.
   *
   * It exists because this door is the only path a unit-scoped subcommand takes
   * in a session whose work runs through the deferred tools: the slash-command
   * registrar notes the commands a person types, and the work itself is dispatched
   * by the model through `agentic_workflow_run`. Without the seam the session's
   * accumulator is never built, so no telemetry sink ever receives a sample.
   *
   * Injectable for the same reason the spawn is: a suite proves the ordering and
   * the arguments without a live session, and a host with telemetry off simply
   * passes nothing.
   */
  onRunnerCommand?: (subcommand: string, args: readonly string[]) => void;
}

/**
 * One spawn the tools composed: the program and its argv exactly as the
 * resolver answered, never a path this module guessed.
 */
export interface SpawnRequest {
  cwd: string;
  program: string;
  argv: string[];
}

export interface SpawnOutcome {
  code: number | null;
  stdout: string;
  stderr: string;
  spawnError?: string;
}

export type SpawnScript = (request: SpawnRequest) => Promise<SpawnOutcome>;

/** The degradation record a run returns when no structured result exists. */
export interface ToolDegraded {
  contract: "agentic-workflow/tool-degraded";
  version: 1;
  tool: string;
  refusal: string;
  detail: string;
}

const SPAWN_TIMEOUT_MS = 30_000;

function degraded(tool: string, refusal: string, detail: string): ToolDegraded {
  return { contract: "agentic-workflow/tool-degraded", version: 1, tool, refusal, detail };
}

/** JSON-schema object for the degradation record (the failure branch of every oneOf). */
function degradedSchema(toolRefusal: string): Record<string, unknown> {
  return {
    type: "object",
    additionalProperties: false,
    required: ["contract", "version", "tool", "refusal", "detail"],
    properties: {
      contract: { const: "agentic-workflow/tool-degraded" },
      version: { const: 1 },
      tool: { type: "string" },
      refusal: { const: toolRefusal },
      detail: { type: "string" },
    },
  };
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function run(text: string, structuredContent: unknown, isError?: boolean): WorkflowToolRun {
  return isError ? { text, structuredContent, isError: true } : { text, structuredContent };
}

/**
 * The published envelope schema, read from the schema package at runtime —
 * the single source the status tool's `outputSchema` reuses verbatim.
 */
export function readPublishedEnvelopeSchema(): Record<string, unknown> {
  const require = createRequire(import.meta.url);
  const path = require.resolve("@gtrabanco/agentic-workflow-schema/envelope.schema.json");
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

/** Default spawn seam: the real child process, bounded like the sensor. */
function spawnScript(request: SpawnRequest): Promise<SpawnOutcome> {
  return new Promise((resolve) => {
    const child = spawn(request.program, request.argv, {
      cwd: request.cwd,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: SPAWN_TIMEOUT_MS,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      resolve({ code: null, stdout, stderr, spawnError: error.message });
    });
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

/** Parse bare JSON object stdout (the gate scripts' contract); null when absent. */
function parseJsonObject(stdout: string): Record<string, unknown> | null {
  const trimmed = stdout.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function requireString(params: Record<string, unknown>, name: string): string {
  const value = params[name];
  if (typeof value !== "string" || value === "") {
    throw new Error(`${name} is required and must be a non-empty string`);
  }
  return value;
}

function optionalString(params: Record<string, unknown>, name: string): string | undefined {
  const value = params[name];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function optionalNumber(params: Record<string, unknown>, name: string): number | undefined {
  const value = params[name];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Shared failure shape for a gate tool whose script could not answer. */
function gateDegraded(
  tool: string,
  outcome: SpawnOutcome,
  refusal: string,
): WorkflowToolRun {
  const detail = outcome.spawnError ?? `exit code ${outcome.code}${outcome.stderr ? `: ${outcome.stderr.trim()}` : ""}`;
  const record = degraded(tool, refusal, detail);
  return run(textOf(record), record, true);
}

/**
 * Compose one runner spawn through the shared resolver (issue #555): the crate
 * bin this package resolves under the runtime that launched pi, and the crate's
 * closed runner set only when that dependency is missing. `bin` is that runtime.
 */
async function launchRequest(cwd: string, args: string[], bin: "bun" | "node"): Promise<SpawnRequest> {
  const launch = await runnerLaunch(args, { installed: installedCandidate(bin) });
  // The resolver answers a full argv (its `argv[0]` is what a caller spawns);
  // a spawn request carries the program beside the arguments it receives.
  return { cwd, program: launch.argv[0], argv: launch.argv.slice(1) };
}

/** Shared gate-tool body: spawn the script, parse its report with the tool's
 * own parser, and map the exit code onto ok / isError-with-data / degraded. */
async function runGateTool(
  spec: {
    name: string;
    parse: (stdout: string) => Record<string, unknown> | null;
    spawn: (bin: "bun" | "node", params: Record<string, unknown>, cwd: string) => Promise<SpawnRequest>;
  },
  deps: { spawnScript?: SpawnScript; bin?: () => "bun" | "node" },
  params: Record<string, unknown>,
  cwd: string,
): Promise<WorkflowToolRun> {
  const doSpawn = deps.spawnScript ?? spawnScript;
  const bin = (deps.bin ?? runtimeBin)();
  let outcome: SpawnOutcome;
  try {
    outcome = await doSpawn(await spec.spawn(bin, params, cwd));
  } catch (error) {
    const record = degraded(spec.name, "gate-unavailable", error instanceof Error ? error.message : String(error));
    return run(textOf(record), record, true);
  }
  if (outcome.spawnError !== undefined) {
    return gateDegraded(spec.name, outcome, "gate-unavailable");
  }
  const parsed = spec.parse(outcome.stdout);
  if (parsed === null) {
    return gateDegraded(spec.name, outcome, "gate-unavailable");
  }
  return run(textOf(parsed), parsed, outcome.code !== 0);
}

// ---------------------------------------------------------------------------
// The status tool (P1): a thin wrapper over the conductor sensor's spawn path
// ---------------------------------------------------------------------------

const TOOL_COMMON = {
  exposure: "deferred" as const,
  namespace: WORKFLOW_TOOLS_NAMESPACE,
  annotations: { readOnlyHint: true } as const,
};

function statusSpec(deps: WorkflowToolsDeps): WorkflowToolSpec {
  return {
    ...TOOL_COMMON,
    name: "agentic_workflow_status",
    label: "agentic-workflow status",
    description:
      "Run the project's workflow-status sensor (Envelope v2) and return the " +
      "validated envelope as structured data. A run with degradations arrives " +
      "as an error carrying the envelope.",
    parameters: { type: "object", properties: {}, additionalProperties: false },
    outputSchema: {
      oneOf: [readPublishedEnvelopeSchema(), degradedSchema("sensor-degraded")],
    },
    async execute(_params, cwd) {
      const doRunSensor = deps.runSensor ?? runSensor;
      const result = await doRunSensor(cwd, (deps.bin ?? runtimeBin)());
      if (result.ok) {
        return run(textOf(result.envelope), result.envelope);
      }
      // Degraded: the envelope rides along when the sensor parsed one, so a
      // programmatic consumer reads the degradations as data (issue #274 AC).
      const withEnvelope = (result as SensorResult & { envelope?: EnvelopeLike }).envelope;
      if (withEnvelope) {
        return run(result.detail, withEnvelope, true);
      }
      const record = degraded("agentic_workflow_status", result.refusal, result.detail);
      return run(result.detail, record, true);
    },
  };
}

// ---------------------------------------------------------------------------
// The gate tools (P2)
// ---------------------------------------------------------------------------

const DIFF_GUARD_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["lines", "files", "additions", "deletions", "maxLines", "maxFiles", "breach", "base"],
  properties: {
    lines: { type: "integer" },
    files: { type: "integer" },
    additions: { type: "integer" },
    deletions: { type: "integer" },
    maxLines: { type: "integer" },
    maxFiles: { type: "integer" },
    // The script reports a breach as `true`, and an unmeasurable run as the
    // reason string (`breach: error || …`, diff-guard.mjs) — the declared
    // contract states the script's real output, never a normalized copy of it.
    breach: {
      type: ["boolean", "string"],
      description: "true/false on a measured run; the reason string when the run could not measure.",
    },
    base: { type: ["string", "null"], description: "The measured base revision, null when the run failed." },
    error: { type: ["string", "null"], description: "Present only on an unmeasurable run." },
  },
};

const PHASE_FINDING_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["id", "reason"],
  properties: { id: { type: "string" }, reason: { type: "string" } },
};

const PHASE_LINT_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "fingerprint", "phases", "docFindings"],
  properties: {
    verdict: { enum: ["PASS", "BLOCKED"] },
    blockReason: { type: "string" },
    fingerprint: { type: "string" },
    phases: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["phase", "status", "findings"],
        properties: {
          phase: { type: "integer" },
          status: { enum: ["PASS", "BLOCKED"] },
          summary: { type: "string" },
          findings: { type: "array", items: PHASE_FINDING_SCHEMA },
        },
      },
    },
    docFindings: { type: "array", items: PHASE_FINDING_SCHEMA },
  },
};

const AUDIT_PR_GATE_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  required: ["verdict", "head", "action", "actionReason"],
  properties: {
    verdict: { type: "string" },
    reason: { type: ["string", "null"] },
    head: { type: ["string", "null"] },
    pr: { type: ["number", "null"] },
    action: { type: "string" },
    actionReason: { type: ["string", "null"] },
  },
};

const SNAPSHOT_MISSING_RECEIPT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["current", "code", "stage", "unit", "seen"],
  properties: {
    current: { type: "boolean" },
    code: { type: "string", description: "The verifier's reason code (missing-receipt-snapshot)." },
    stage: { type: "string" },
    unit: { type: "string" },
    seen: { type: "array", description: "The receipts the verifier saw for this stage; empty when there are none." },
  },
};

const SNAPSHOT_FRESHNESS_REPORT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["current", "stage", "unit", "receipt", "observedDigest", "digestMatches", "verdictIsPass", "structural"],
  properties: {
    current: { type: "boolean" },
    stage: { type: "string" },
    unit: { type: "string" },
    receipt: { type: "object" },
    observedDigest: { type: "string" },
    digestMatches: { type: "boolean" },
    verdictIsPass: { type: "boolean" },
    structural: { type: "object" },
    seen: { type: "array" },
  },
};

const SNAPSHOT_VERIFY_RESULT_SCHEMA: Record<string, unknown> = {
  // Two report shapes leave the verifier: a snapshot it could bind to a receipt
  // (fresh or stale — `current` tells them apart) and, on exit 3, the bare
  // missing-receipt report that carries no digest at all.
  oneOf: [SNAPSHOT_FRESHNESS_REPORT_SCHEMA, SNAPSHOT_MISSING_RECEIPT_SCHEMA],
};

/** The phase-lint block parser: the byte-stable grammar `phase-lint.mjs` prints. */
export function parsePhaseLintBlock(stdout: string): Record<string, unknown> | null {
  const lines = stdout.trim().split("\n").map((line) => line.trim());
  const verdictLine = lines.find((line) => line.startsWith("verdict "));
  const fingerprintLine = lines.find((line) => line.startsWith("fingerprint: "));
  if (verdictLine === undefined || fingerprintLine === undefined) return null;
  const rawVerdict = verdictLine.slice("verdict ".length).trim();
  const pass = rawVerdict === "PASS";
  const verdict = pass ? "PASS" : "BLOCKED";
  const fingerprint = fingerprintLine.slice("fingerprint: ".length).trim();

  const phases: Record<string, unknown>[] = [];
  const docFindings: Record<string, unknown>[] = [];
  const byPhase = new Map<number, { phase: number; status: "PASS" | "BLOCKED"; summary?: string; findings: Record<string, unknown>[] }>();
  for (const line of lines) {
    const phaseLine = line.match(/^P(\d+) (.+)$/);
    if (phaseLine !== null) {
      const phase = Number(phaseLine[1]);
      const body = phaseLine[2];
      let entry = byPhase.get(phase);
      if (entry === undefined) {
        entry = { phase, status: "PASS", findings: [] };
        byPhase.set(phase, entry);
      }
      const passLine = body.match(/^Phase-lint: PASS \((\d+)\/(\d+)\) · fingerprint (\S+)$/);
      if (passLine !== null) {
        entry.summary = `PASS (${passLine[1]}/${passLine[2]})`;
        continue;
      }
      const blockedLine = body.match(/^Phase-lint: BLOCKED — (.+): (.+)$/);
      if (blockedLine !== null) {
        entry.status = "BLOCKED";
        entry.summary = blockedLine[1];
        continue;
      }
      const finding = body.match(/^([^:]+): (.+)$/);
      if (finding !== null) {
        entry.status = "BLOCKED";
        entry.findings.push({ id: finding[1], reason: finding[2] });
        continue;
      }
      return null;
    }
    const docFinding = line.match(/^([^Pv][^:]*): (.+)$/);
    if (docFinding !== null && !line.startsWith("verdict ") && !line.startsWith("fingerprint: ")) {
      docFindings.push({ id: docFinding[1], reason: docFinding[2] });
    }
  }
  phases.push(...[...byPhase.values()].sort((a, b) => a.phase - b.phase));
  const result: Record<string, unknown> = {
    verdict,
    fingerprint,
    phases,
    docFindings,
  };
  if (!pass) result.blockReason = rawVerdict.slice("BLOCKED: ".length) || "lint-blocked";
  return result;
}

function diffGuardSpec(deps: WorkflowToolsDeps): WorkflowToolSpec {
  return {
    ...TOOL_COMMON,
    name: "agentic_workflow_diff_guard",
    label: "agentic-workflow diff guard",
    description:
      "Measure the authored diff between a base revision and the working tree " +
      "and enforce the phase budget. A breach arrives as an error carrying the " +
      "measured lines and files.",
    parameters: {
      type: "object",
      required: ["base"],
      additionalProperties: false,
      properties: {
        base: { type: "string", description: "The git ref to diff against (required)." },
        unit: { type: "string", description: "The unit label for the breach block." },
        maxLines: { type: "integer", description: "Phase budget override for lines." },
        maxFiles: { type: "integer", description: "Phase budget override for files." },
      },
    },
    outputSchema: { oneOf: [DIFF_GUARD_RESULT_SCHEMA, degradedSchema("gate-unavailable")] },
    async execute(params, cwd) {
      return runGateTool(
        {
          name: "agentic_workflow_diff_guard",
          parse: parseJsonObject,
          spawn: async (bin, p) => {
            const args = ["--base", requireString(p, "base"), "--repo", cwd, "--json"];
            const unit = optionalString(p, "unit");
            if (unit !== undefined) args.push("--unit", unit);
            const maxLines = optionalNumber(p, "maxLines");
            if (maxLines !== undefined) args.push("--max-lines", String(maxLines));
            const maxFiles = optionalNumber(p, "maxFiles");
            if (maxFiles !== undefined) args.push("--max-files", String(maxFiles));
            return launchRequest(cwd, ["diff-guard", ...args], bin);
          },
        },
        deps,
        params,
        cwd,
      );
    },
  };
}

function phaseLintSpec(deps: WorkflowToolsDeps): WorkflowToolSpec {
  return {
    ...TOOL_COMMON,
    name: "agentic_workflow_phase_lint",
    label: "agentic-workflow phase lint",
    description:
      "Lint a plan or unit document against the eight phase-lint rules and " +
      "return the typed verdict with its fingerprint. A BLOCKED verdict " +
      "arrives as an error carrying the findings.",
    parameters: {
      type: "object",
      required: ["path"],
      additionalProperties: false,
      properties: {
        path: { type: "string", description: "The document path, relative to the project root." },
      },
    },
    outputSchema: { oneOf: [PHASE_LINT_RESULT_SCHEMA, degradedSchema("gate-unavailable")] },
    async execute(params, cwd) {
      return runGateTool(
        {
          name: "agentic_workflow_phase_lint",
          parse: parsePhaseLintBlock,
          spawn: (bin, p) => launchRequest(cwd, ["phase-lint", requireString(p, "path")], bin),
        },
        deps,
        params,
        cwd,
      );
    },
  };
}

function auditPrGateSpec(deps: WorkflowToolsDeps): WorkflowToolSpec {
  return {
    ...TOOL_COMMON,
    name: "agentic_workflow_audit_pr_gate",
    label: "agentic-workflow audit-pr gate",
    description:
      "Evaluate the PR merge gate for the project's current branch and return " +
      "the verdict report as structured data. A BLOCKED verdict arrives as an " +
      "error carrying the report.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        pr: { type: "string", description: "The PR number to evaluate; it must belong to the repository at the session's cwd." },
        head: { type: "string", description: "The head SHA to judge, when it cannot be read from the PR." },
      },
    },
    outputSchema: { oneOf: [AUDIT_PR_GATE_RESULT_SCHEMA, degradedSchema("gate-unavailable")] },
    async execute(params, cwd) {
      return runGateTool(
        {
          name: "agentic_workflow_audit_pr_gate",
          parse: parseJsonObject,
          spawn: async (bin, p) => {
            // The spawn cwd *is* the project under work: the script reads git
            // there and `gh` infers the repository from it. Passing that cwd as
            // a forge scope was refused (`gh` wants [HOST/]OWNER/REPO) and turned
            // every run into `gate-unavailable` before the script could answer.
            const args = ["evaluate"];
            const pr = optionalString(p, "pr");
            if (pr !== undefined) args.push("--pr", pr);
            const head = optionalString(p, "head");
            if (head !== undefined) args.push("--head", head);
            return { cwd, program: bin, argv: ["scripts/audit-pr-gate.mjs", ...args] };
          },
        },
        deps,
        params,
        cwd,
      );
    },
  };
}

function snapshotVerifySpec(deps: WorkflowToolsDeps): WorkflowToolSpec {
  return {
    ...TOOL_COMMON,
    name: "agentic_workflow_snapshot_verify",
    label: "agentic-workflow snapshot verify",
    description:
      "Re-derive a planning-ledger snapshot digest from the bytes on disk and " +
      "compare it with the unit's receipt. A stale or missing receipt arrives " +
      "as an error carrying the freshness report.",
    parameters: {
      type: "object",
      required: ["stage", "unit"],
      additionalProperties: false,
      properties: {
        stage: { enum: ["spec", "plan"], description: "The planning stage to verify." },
        unit: { type: "string", description: "The unit id (the docs/…/<dir> name)." },
        dir: { type: "string", description: "The unit artifact dir, when it is not the default." },
        unitKind: { enum: ["feature", "fix"], description: "The unit kind when the default does not apply." },
        receipt: { type: "string", description: "A specific receipt id or snapshot digest to verify." },
        parent: { type: "string", description: "The expected 64-hex parent snapshot digest." },
        policy: { type: "string", description: "The policy version to verify against." },
        artifactRevision: { type: "string", description: "The expected artifact revision id." },
        sourceRevision: { type: "string", description: "The expected source revision (40-hex)." },
      },
    },
    outputSchema: { oneOf: [SNAPSHOT_VERIFY_RESULT_SCHEMA, degradedSchema("gate-unavailable")] },    async execute(params, cwd) {
      return runGateTool(
        {
          name: "agentic_workflow_snapshot_verify",
          parse: parseJsonObject,
          spawn: async (bin, p) => {
            const args = [
              "verify",
              "--stage",
              requireString(p, "stage"),
              "--unit",
              requireString(p, "unit"),
            ];
            const pairs: [string, string | undefined][] = [
              ["--dir", optionalString(p, "dir")],
              ["--unit-kind", optionalString(p, "unitKind")],
              ["--receipt", optionalString(p, "receipt")],
              ["--parent", optionalString(p, "parent")],
              ["--policy", optionalString(p, "policy")],
              ["--artifact-revision", optionalString(p, "artifactRevision")],
              ["--source-revision", optionalString(p, "sourceRevision")],
            ];
            for (const [flag, value] of pairs) {
              if (value !== undefined) args.push(flag, value);
            }
            return launchRequest(cwd, ["pre-execution-snapshot", ...args], bin);
          },
        },
        deps,
        params,
        cwd,
      );
    },
  };
}

// ---------------------------------------------------------------------------
// The runner door (issue #555): any subcommand the skills' symbolic citations name
// ---------------------------------------------------------------------------

const RUNNER_RUN_RESULT_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  required: ["subcommand", "stdout", "stderr", "exitCode"],
  properties: {
    subcommand: { type: "string" },
    stdout: { type: "string" },
    stderr: { type: "string" },
    exitCode: { type: ["integer", "null"], description: "The subcommand's own exit code; null when it never started." },
  },
};

/**
 * The generic door. The packaged skills cite `runner <subcommand> [args…]`
 * (issue #555's symbolic form, owned by `skills/runner-contract/references/
 * RUNNER.md`); five of those subcommands have a typed tool, and this one runs
 * every other — the same spawn path, the same resolver, no new authority. Its
 * text is the command's own output, so the block a skill asks the agent to
 * paste arrives unparaphrased; a non-zero exit is an error carrying it.
 *
 * It is also the session's attribution door (issue #690): `onRunnerCommand`
 * hears the subcommand before anything spawns, because the unit a `runner
 * execute-phase <n>`-shaped call names is what the telemetry sample is
 * attributed to, and because `AG_WF_PHASE` has to be in the environment the
 * child inherits. The seam is bookkeeping — a failure there never costs the
 * operator the command they asked for.
 */
function runnerRunSpec(deps: WorkflowToolsDeps): WorkflowToolSpec {
  return {
    ...TOOL_COMMON,
    name: "agentic_workflow_run",
    label: "agentic-workflow runner",
    description:
      "Run one runner subcommand (`unit-route`, `needs-input`, `ceremony`, " +
      "`pre-execution-snapshot`, …) in the project and return its stdout, " +
      "stderr and exit code. Every `runner <subcommand>` citation in the " +
      "packaged skills means this tool in a pi session; the package composes " +
      "the command. A non-zero exit arrives as an error carrying the output.",
    parameters: {
      type: "object",
      required: ["subcommand"],
      additionalProperties: false,
      properties: {
        subcommand: { type: "string", description: "The runner subcommand, without the symbolic `runner` prefix." },
        args: {
          type: "array",
          items: { type: "string" },
          description: "The subcommand's arguments, forwarded verbatim.",
        },
      },
    },
    outputSchema: { oneOf: [RUNNER_RUN_RESULT_SCHEMA, degradedSchema("runner-unavailable")] },
    async execute(params, cwd) {
      const subcommand = requireString(params, "subcommand");
      const forwarded = Array.isArray(params.args) ? params.args.filter((arg): arg is string => typeof arg === "string") : [];
      // Before the spawn, never after it: the child inherits this environment,
      // so the phase in flight has to be set by now, and an attributed session
      // that then fails to spawn was still working on the unit it named.
      try {
        deps.onRunnerCommand?.(subcommand, forwarded);
      } catch {
        // The seam is diagnostic. A broken reporter costs the session its sample;
        // it never costs the operator the command they asked for.
      }
      const doSpawn = deps.spawnScript ?? spawnScript;
      let outcome: SpawnOutcome;
      try {
        outcome = await doSpawn(await launchRequest(cwd, [subcommand, ...forwarded], (deps.bin ?? runtimeBin)()));
      } catch (error) {
        const record = degraded("agentic_workflow_run", "runner-unavailable", error instanceof Error ? error.message : String(error));
        return run(textOf(record), record, true);
      }
      if (outcome.spawnError !== undefined) {
        return gateDegraded("agentic_workflow_run", outcome, "runner-unavailable");
      }
      const result = { subcommand, stdout: outcome.stdout, stderr: outcome.stderr, exitCode: outcome.code };
      const text = [outcome.stdout.trimEnd(), outcome.stderr.trimEnd()].filter((part) => part !== "").join("\n");
      return run(text === "" ? textOf(result) : text, result, outcome.code !== 0);
    },
  };
}

/**
 * The deferred workflow tools: the contract + `workflow-status` tool first, then
 * the red gates. The generic runner door (issue #555) runs the subcommands
 * without a typed tool, so the skills' symbolic citations stay executable in a
 * pi session. The P3 scripts evaluated with no named programmatic consumer stay
 * absent (unit 70's SPEC §P3 evaluation).
 */
export function createWorkflowTools(deps: WorkflowToolsDeps = {}): WorkflowToolSpec[] {
  return [
    statusSpec(deps),
    diffGuardSpec(deps),
    phaseLintSpec(deps),
    auditPrGateSpec(deps),
    snapshotVerifySpec(deps),
    runnerRunSpec(deps),
  ];
}

/** The envelope type the status tool's happy path resolves to (re-exported for the adapter). */
export type WorkflowEnvelope = Envelope;
