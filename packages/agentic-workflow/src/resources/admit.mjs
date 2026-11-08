/**
 * admit.mjs — the bounded, observable trial check (issue #260 S6, the
 * 2026-10-27 progress-led refinement).
 *
 * What makes an execution problematic is not duration or consumption — it is
 * being unobserved and un-decidable. So admission requires the brief's
 * expectations (expected_duration + resource requirements), checks them
 * against the envelope and the operator's caps, and records every trial: a
 * bound-kill receipt (the MemoryMax "does not fit" discovery) blocks an
 * identical re-run — re-deciding needs to happen, not retrying — while a
 * changed task spec (split, smaller requirements) is a new decision.
 *
 * The module is pure over its inputs plus the record dir; the runtime's
 * heartbeat/check-in layer (observation) is the caller's duty — this check
 * is the deterministic floor, never the whole design. Read-only except the
 * record dir it is explicitly given.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { parseCap, ResourcesError } from "./detect.mjs";

export const ADMIT_CONTRACT_ID = "resources-admit@1";

const KB = 1024;
const MB = 1024 ** 2;
const GB = 1024 ** 3;

const UNIT_BYTES = { GB, MB, KB };

const isRecord = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

function parseMemoryRequirement(text) {
  if (typeof text !== "string") {
    throw new ResourcesError(`requirements.memory must be a "<n> <unit>" string, got ${JSON.stringify(text)}`);
  }
  const m = text.match(/^(\d+(?:\.\d+)?)\s*(GB|MB|KB)$/u);
  if (!m) throw new ResourcesError(`requirements.memory "${text}" does not match "<n> <unit>" (unit: GB|MB|KB)`);
  return { bytes: Number(m[1]) * UNIT_BYTES[m[2]], text };
}

/** The digest of the task spec — identity for the anti-retry rule. */
function specDigest(task, expect, capsJson) {
  return createHash("sha256").update(JSON.stringify({ task, expect, caps: capsJson ?? null })).digest("hex");
}

function readPriorReceipts(recordDir) {
  const receiptsDir = join(recordDir, "receipts");
  if (!existsSync(receiptsDir)) return [];
  const receipts = [];
  for (const name of readdirSync(receiptsDir)) {
    if (!name.endsWith(".json")) continue;
    try {
      receipts.push(JSON.parse(readFileSync(join(receiptsDir, name), "utf8")));
    } catch {
      // an unreadable receipt is not evidence; skip it
    }
  }
  return receipts;
}

/**
 * admitTrial({ task, expect, envelope, recordDir?, now? }) — the verdict.
 *
 * - `refuse` — no expectations, or a requirement over the cap/envelope, or an
 *   identical re-run after a recorded bound-kill. `reason` names the exact
 *   gap; `receipt` carries the deciding numbers.
 * - `allow` — a bounded, decidable trial; the receipt records the digest the
 *   runtime can later flip to `bound-kill` when MemoryMax discovers "does not
 *   fit".
 *
 * Throws `ResourcesError` on a malformed expect shape — a caller bug, not a
 * host condition, but the CLI boundary turns it into a `RESOURCES REFUSAL`
 * (exit 2) instead of a stack trace: the operator typed the brief.
 */
export function admitTrial({ task, expect, envelope, recordDir = null }) {
  if (typeof task !== "string" || task.trim() === "") throw new ResourcesError("task id is required");
  if (!isRecord(expect)) throw new ResourcesError("expect must be a JSON object (the brief's expectations)");
  if (!isRecord(envelope) || !isRecord(envelope.memory)) throw new ResourcesError("envelope must be a detectHost() result");

  const missing = [];
  if (typeof expect.expected_duration !== "string" || expect.expected_duration.trim() === "") {
    missing.push("expected_duration");
  }
  if (!isRecord(expect.requirements) || Object.keys(expect.requirements).length === 0) {
    missing.push("requirements");
  }
  if (missing.length > 0) {
    return {
      contract: ADMIT_CONTRACT_ID,
      verdict: "refuse",
      reason: `un-decidable trial: the brief declares no ${missing.join(" and ")} — declare expectations, then retry`,
      receipt: { task, missing },
    };
  }
  // The machine-readable expectation (S11): the prose expected_duration travels
  // in the check-in message, expected_seconds is what the check compares.
  if (expect.expected_seconds !== undefined &&
      (typeof expect.expected_seconds !== "number" || !Number.isFinite(expect.expected_seconds) || expect.expected_seconds <= 0)) {
    throw new ResourcesError(`expected_seconds must be a positive number of seconds, got ${JSON.stringify(expect.expected_seconds)}`);
  }

  const reqs = {};
  if (expect.requirements.memory !== undefined) reqs.memory = parseMemoryRequirement(expect.requirements.memory);
  if (expect.requirements.threads !== undefined) {
    if (!Number.isInteger(expect.requirements.threads) || expect.requirements.threads < 1) {
      throw new ResourcesError(`requirements.threads must be a positive integer, got ${JSON.stringify(expect.requirements.threads)}`);
    }
    reqs.threads = expect.requirements.threads;
  }
  const unknownReq = Object.keys(expect.requirements).filter((k) => !["memory", "threads"].includes(k));
  if (unknownReq.length > 0) {
    throw new ResourcesError(`unknown requirements key(s): ${unknownReq.join(", ")} (allowed: memory, threads)`);
  }

  if (reqs.memory && reqs.memory.bytes > envelope.memory.effectiveLimitBytes) {
    return {
      contract: ADMIT_CONTRACT_ID,
      verdict: "refuse",
      reason: `requirement ${reqs.memory.text} exceeds the effective cap (${envelope.memory.effectiveLimitBytes} bytes) — raise the operator's cap or shrink the trial`,
      receipt: { task, requirementBytes: reqs.memory.bytes, capBytes: envelope.memory.effectiveLimitBytes },
    };
  }
  if (reqs.threads && reqs.threads > envelope.threads) {
    return {
      contract: ADMIT_CONTRACT_ID,
      verdict: "refuse",
      reason: `requirement ${reqs.threads} threads exceeds the thread envelope (${envelope.threads})`,
      receipt: { task, requirementThreads: reqs.threads, capThreads: envelope.threads },
    };
  }

  const digest = specDigest(task, expect, envelope.caps ? JSON.stringify(envelope.caps) : null);

  if (recordDir) {
    for (const prior of readPriorReceipts(recordDir)) {
      if (prior.digest === digest && prior.verdict === "bound-kill") {
        return {
          contract: ADMIT_CONTRACT_ID,
          verdict: "refuse",
          reason: `task ${task} is an identical re-run of a bound-killed trial — re-decide with the receipt (split the task, shrink it, or request a bigger host), never re-run unchanged`,
          receipt: { task, digest, priorTask: prior.task, priorPeak: prior.peak ?? null },
        };
      }
    }
  }

  const receipt = {
    contract: ADMIT_CONTRACT_ID,
    task,
    digest,
    verdict: "allow",
    expect: {
      expected_duration: expect.expected_duration,
      ...(expect.expected_seconds !== undefined ? { expected_seconds: expect.expected_seconds } : {}),
      requirements: expect.requirements,
    },
    recordedAt: null,
  };

  if (recordDir) {
    const receiptsDir = join(recordDir, "receipts");
    mkdirSync(receiptsDir, { recursive: true });
    receipt.recordedAt = new Date().toISOString();
    writeFileSync(join(receiptsDir, `${digest.slice(0, 16)}.json`), `${JSON.stringify(receipt, null, 2)}\n`);
  }

  return { contract: ADMIT_CONTRACT_ID, verdict: "allow", reason: null, receipt };
}
