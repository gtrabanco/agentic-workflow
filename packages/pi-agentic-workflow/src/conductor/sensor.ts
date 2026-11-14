/**
 * runSensor — spawn the workflow-status sensor, validate its output.
 *
 * Spawns `<bin> <runner bin> workflow-status --json-only` in `cwd`,
 * collects stdout, parses JSON, validates against the envelope v2 strict
 * schema, and checks for degradations.
 *
 * Any failure path (spawn error, non-JSON, invalid JSON, schema invalid,
 * degradations present) returns `{ ok: false, refusal: "sensor-degraded", detail }`.
 * A run that parsed and validated an envelope but carries degradations also
 * returns that envelope as an additive `envelope` field, so a consumer (issue
 * #274's tool surface) can attach the data to the error instead of losing it;
 * the refusal contract itself is unchanged.
 */

import { spawn } from "node:child_process";
import { accessSync, constants } from "node:fs";
import { validateEnvelope } from "@gtrabanco/agentic-workflow-schema";
import type { Envelope } from "@gtrabanco/agentic-workflow-schema";

import type { EnvelopeLike, SensorResult } from "./types.js";
import { runnerBin } from "../runner-bin.js";

const TIMEOUT_MS = 30_000;

function coerceEnvelope(raw: Envelope): EnvelopeLike {
  return raw as unknown as EnvelopeLike;
}

/**
 * A degraded sensor run that still parsed an envelope: the refusal contract
 * (`ok/refusal/detail`) is unchanged, and the envelope rides along additively
 * so a consumer (issue #274's tool surface) can attach the data to the error
 * instead of losing it.
 */
export type DegradedSensorResult = {
  ok: false;
  refusal: "sensor-degraded";
  detail: string;
  envelope?: EnvelopeLike;
};

function resolveCwd(cwd: string): string {
  try {
    accessSync(cwd, constants.R_OK | constants.X_OK);
    return cwd;
  } catch {
    return process.cwd();
  }
}

export function runSensor(cwd: string, bin: "bun" | "node"): Promise<SensorResult> {
  return new Promise((resolve) => {
    const resolvedCwd = resolveCwd(cwd);
    const child = spawn(
      bin,
      [runnerBin(), "workflow-status", "--json-only"],
      {
        cwd: resolvedCwd,
        stdio: ["ignore", "pipe", "pipe"],
        timeout: TIMEOUT_MS,
      },
    );

    let stdout = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      resolve({
        ok: false,
        refusal: "sensor-degraded",
        detail: "sensor timed out after 30s",
      });
    }, TIMEOUT_MS);

    child.on("error", (_err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        refusal: "sensor-degraded",
        detail: `spawn error: ${_err.message}`,
      });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === null || code >= 128) {
        resolve({
          ok: false,
          refusal: "sensor-degraded",
          detail: `process exited with code ${code ?? "unknown"}`,
        });
        return;
      }
      tryParseAndValidate(stdout, resolve);
    });
  });
}

function tryParseAndValidate(
  raw: string,
  resolve: (r: SensorResult) => void,
): void {
  // Parse contract: the real sensor emits bare JSON on stdout
  // (`--json-only` is an accepted no-op); a fenced ```json block is
  // accepted as a defensive fallback (the schema package's own
  // extraction contract for skill turn output).
  const candidate = parseJsonCandidate(raw);
  if (candidate === null) {
    resolve({
      ok: false,
      refusal: "sensor-degraded",
      detail: "no JSON found in sensor output",
    });
    return;
  }

  // Validate the envelope object. The non-strict validator is the consumer
  // contract here: the real sensor emits the documented additive fields
  // (next.reason, next.candidate_count) that the fenced strict parser
  // (skill-turn-output oriented) rejects.
  const v2Result = validateEnvelope(candidate.parsed);
  if (!v2Result.ok) {
    resolve({
      ok: false,
      refusal: "sensor-degraded",
      detail: `schema invalid: ${v2Result.errors.join("; ")}`,
    });
    return;
  }

  const envelope = candidate.parsed as Envelope;

  // Check for degradations in detail
  const detail = envelope.detail as Record<string, unknown> | undefined;
  if (
    detail?.degradations &&
    Array.isArray(detail.degradations) &&
    detail.degradations.length > 0
  ) {
    resolve({
      ok: false,
      refusal: "sensor-degraded",
      detail: `sensor degraded: ${detail.degradations.join(", ")}`,
      // Issue #274: the parsed envelope rides along on the degraded run so
      // the tool surface can attach it to the error (additive; the refusal
      // contract above is unchanged).
      envelope: coerceEnvelope(envelope),
    });
    return;
  }

  resolve({ ok: true, envelope: coerceEnvelope(envelope) });
}

/**
 * Parse sensor output: bare JSON first (the real `--json-only` contract),
 * then the last fenced ```json block (defensive fallback matching the
 * schema package's extraction contract). Returns null when neither parses.
 */
function parseJsonCandidate(text: string): { parsed: unknown } | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return { parsed: JSON.parse(trimmed) };
    } catch {
      // fall through to the fenced extraction
    }
  }
  const block = extractLastJsonBlock(text);
  if (block === null) return null;
  try {
    return { parsed: JSON.parse(block) };
  } catch {
    return null;
  }
}

/**
 * Extract the last fenced ```json block from raw text.
 * Matches the envelope parse contract used by the schema package.
 */
function extractLastJsonBlock(text: string): string | null {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/g);
  if (!match || match.length === 0) return null;
  // Take the last one
  const last = match[match.length - 1];
  return last
    .replace(/^```json\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
