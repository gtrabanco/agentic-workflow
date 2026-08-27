#!/usr/bin/env node
/**
 * AC10 / D14 performance gate — 128-command plan+receipt validation and digest.
 *
 * Measures a WARM process: `--warm` discarded samples first, then `--samples`
 * measured ones, each sample being the full authoritative cycle a delivery gate
 * actually performs — validate the plan, canonicalize and digest it, validate the
 * bound receipt against it, then canonicalize and digest the receipt.
 *
 * The ceiling is the declared number, not a suggestion: p95 must stay at or below
 * 100 ms. Raising it requires a user-approved SPEC amendment and a replacement
 * ACCEPTANCE manifest (quality floor, ACCEPTANCE v2), so this program takes no
 * ceiling argument. Exit code 1 means the candidate is too slow.
 */
import { argv } from "node:process";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_LIMITS,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  canonicalizeVerificationPlan,
  canonicalizeVerificationReceipt,
  digestVerificationPlan,
  digestVerificationReceipt,
} from "../dist/index.js";

const P95_CEILING_MS = 100;

function arg(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  if (index === -1 || index + 1 >= argv.length) return fallback;
  const value = Number(argv[index + 1]);
  // F94 — a malformed flag is a USAGE failure: exit 2 with an echoed message.
  // Throwing here died as an uncaught exception (exit 1) and letting a NaN
  // through degraded it into an invalid-plan rejection — neither tells the
  // operator "you passed garbage".
  if (!Number.isFinite(value)) {
    console.error(`--${name} expects a finite positive integer, got ${argv[index + 1]}`);
    process.exit(2);
  }
  return value;
}

const commands = arg("commands", VERIFICATION_LIMITS.commands);
const samples = arg("samples", 60);
const warm = arg("warm", 15);

if (!Number.isInteger(commands) || commands < 1 || commands > VERIFICATION_LIMITS.commands) {
  console.error(
    `--commands must be an integer between 1 and ${VERIFICATION_LIMITS.commands} (D14 ceiling); ${commands} would not be a valid plan`,
  );
  process.exit(2);
}
if (!Number.isInteger(samples) || samples < 5) {
  console.error(`--samples must be an integer >= 5 to place a p95, got ${samples}`);
  process.exit(2);
}

// A maximum-command-count plan must also satisfy the time and byte ceilings:
// declared fast-stage timeouts are sized so 128 commands fit the 15-minute
// budget, and each command carries a few short arguments.
// F94 — the stage-budget division alone is unsound at low command counts:
// --commands 1 yields the whole 15-minute stage budget per command, above the
// 600000 ms per-fast-command ceiling, so the bench used to self-reject its own
// plan. The per-command ceiling clamps the split (at >= 2 commands the floor is
// already 450000 ms or less, so the clamp is a no-op for the AC4 default).
const timeoutMs = Math.min(
  Math.floor(VERIFICATION_LIMITS.fastStageTimeoutMs / commands),
  VERIFICATION_LIMITS.fastCommandTimeoutMs,
);
const plan = {
  contract: VERIFICATION_PLAN_CONTRACT_ID,
  commands: Array.from({ length: commands }, (_, i) => ({
    id: `cmd-${String(i).padStart(4, "0")}`,
    stage: i % 2 === 0 ? "fast" : "full",
    executable: "npm",
    args: ["--silent", "run", `verify:${i}`],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    // Half the commands are full-stage, so both the 10-minute and the 60-minute
    // per-command ceilings are exercised by one payload.
    timeoutMs: i % 2 === 0 ? timeoutMs : Math.min(timeoutMs * 8, VERIFICATION_LIMITS.fullCommandTimeoutMs),
    stopOnFailure: i % 2 === 0,
    costClass: i % 2 === 0 ? "cheap" : "moderate",
  })),
};

const planResult = validateVerificationPlanV1(plan);
if (!planResult.ok) {
  console.error("benchmark plan must be valid:", JSON.stringify(planResult.diagnostics));
  process.exit(2);
}
const planDigest = await digestVerificationPlan(planResult.plan);
const receiptPayload = {
  contract: VERIFICATION_RECEIPT_CONTRACT_ID,
  planDigest,
  candidateSnapshotDigest: "e".repeat(64),
  acceptanceFingerprint: "f".repeat(64),
  stageRequested: "full",
  results: planResult.plan.commands.map((command) => ({
    commandId: command.id,
    status: "passed",
    exitCode: 0,
    signal: null,
    startedAt: "2025-01-01T00:00:00Z",
    endedAt: "2025-01-01T00:00:01Z",
    stdout: { ref: `evidence/${command.id}/stdout`, bytes: 128, sha256: "a".repeat(64) },
    stderr: { ref: `evidence/${command.id}/stderr`, bytes: 0, sha256: "b".repeat(64) },
    skipReason: null,
  })),
  verdict: "pass",
};
const receiptResult = await validateVerificationReceiptAgainstPlan(receiptPayload, plan);
if (!receiptResult.ok) {
  console.error("benchmark receipt must be valid:", JSON.stringify(receiptResult.diagnostics));
  process.exit(2);
}

const planBytes = Buffer.byteLength(canonicalizeVerificationPlan(planResult.plan), "utf8");
const receiptBytes = Buffer.byteLength(canonicalizeVerificationReceipt(receiptResult.receipt), "utf8");

/** One measured unit: exactly what a delivery gate does with a plan and its receipt. */
async function cycle() {
  const validatedPlan = validateVerificationPlanV1(plan);
  if (!validatedPlan.ok) throw new Error("benchmark plan became invalid");
  await digestVerificationPlan(validatedPlan.plan);
  canonicalizeVerificationPlan(validatedPlan.plan);
  const validatedReceipt = await validateVerificationReceiptAgainstPlan(receiptPayload, plan);
  if (!validatedReceipt.ok) throw new Error("benchmark receipt became invalid");
  await digestVerificationReceipt(validatedReceipt.receipt);
  canonicalizeVerificationReceipt(validatedReceipt.receipt);
}

for (let i = 0; i < warm; i++) await cycle();

const timings = [];
for (let i = 0; i < samples; i++) {
  const started = performance.now();
  await cycle();
  timings.push(performance.now() - started);
}
timings.sort((a, b) => a - b);
// Nearest-rank p95: the smallest sample at or above the 95th percentile position.
const rank = Math.max(0, Math.ceil(0.95 * timings.length) - 1);
const p95 = timings[rank];
const median = timings[Math.floor(timings.length / 2)];

console.log(
  [
    `commands            ${commands}`,
    `sample              plan+receipt validate → canonicalize → digest`,
    `warm-up / measured  ${warm} / ${samples}`,
    `canonical sizes     plan ${planBytes} B · receipt ${receiptBytes} B`,
    `min / median        ${timings[0].toFixed(2)} ms / ${median.toFixed(2)} ms`,
    `p95 (rank ${rank + 1})     ${p95.toFixed(2)} ms`,
    `max                 ${timings[timings.length - 1].toFixed(2)} ms`,
    `ceiling             ${P95_CEILING_MS} ms (D14 / AC10)`,
  ].join("\n"),
);

if (p95 > P95_CEILING_MS) {
  console.error(`p95 ${p95.toFixed(2)} ms exceeds the declared ${P95_CEILING_MS} ms ceiling`);
  process.exit(1);
}
console.log(`PASS · p95 ${p95.toFixed(2)} ms ≤ ${P95_CEILING_MS} ms`);
