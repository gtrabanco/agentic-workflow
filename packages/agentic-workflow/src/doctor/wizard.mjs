/**
 * wizard.mjs — the consent-gated setup wizard (issue #537 S6).
 *
 * The doctor answers "what is the state"; the wizard answers "what may I do
 * about it", and the answer is derived, never invented: a row whose repair is a
 * command the project owns becomes one `ask-consent-write` action, a row whose
 * repair is an operator command becomes text, a curated or session-level row is a
 * `residual`, and a healthy row is `report-only`.
 *
 * Three invariants this module enforces in code rather than prose:
 *   * nothing is applied without an explicit consent id (a non-interactive run
 *     without `--yes` plans and stops);
 *   * the write is the project's own installer, never a second implementation —
 *     the action carries the program and args the doctor already resolved;
 *   * every applied action is recorded once and the same checker re-reads the
 *     envelope, so a repaired row leaves the plan and the second run is a no-op.
 */

import { appendFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { DoctorRefusal } from "./doctor.mjs";

/** The consent ledger the `provision rg` bootstrap already writes. */
export const CONSENT_LEDGER = ".agentic-workflow/provision-log.jsonl";

/** What one wizard run reports: `setup@1`. */
export const SETUP_RECEIPT = "setup@1";

/** The plan, derived from one envelope — no row is planned twice. */
export function planSetup(envelope) {
  const actions = envelope.rows.filter((row) => row.move === "ask-consent-write" && row.action !== null);
  const instructed = envelope.rows.filter((row) => row.move === "instruct-only" && row.instruction !== null);
  const residual = envelope.rows.filter((row) => row.move === "residual").map((row) => ({ id: row.id, reason: row.advisory }));
  const reportOnly = envelope.rows.filter((row) => row.move === "report-only").map((row) => row.id);
  return {
    actions,
    instructions: [...instructed.map((row) => row.instruction), ...actions.map((row) => row.action.display)],
    residual,
    reportOnly,
  };
}

/**
 * Apply the plan. `ops` carries the three effects: `runAction` (spawn the
 * project's installer), `appendConsent` (one ledger line) and `doctor` (re-read
 * the envelope). `consent` is the set of check ids the operator approved; an id
 * that names no documented surface refuses, while an id whose row is already
 * satisfied is a no-op — consent may name a row that needs nothing.
 */
export async function runSetup({ envelope, ops, consent = new Set(), dryRun = false, now = () => new Date().toISOString() }) {
  const plan = planSetup(envelope);
  const known = new Set(envelope.rows.map((row) => row.id));
  const unknown = [...consent].filter((id) => !known.has(id));
  if (unknown.length > 0) {
    throw new DoctorRefusal(
      "unknown-consent",
      `--yes names ${unknown.join(", ")}, which is not a documented check (known: ${[...known].join(", ")})`,
    );
  }

  const applied = [];
  const failed = [];
  const declined = [];
  for (const row of plan.actions) {
    if (!consent.has(row.id)) {
      declined.push(row.id);
      continue;
    }
    if (dryRun) continue;
    const outcome = await ops.runAction(row.action);
    if (outcome.ok) applied.push(row.id);
    else failed.push(row.id);
    ops.appendConsent({
      date: now(),
      tool: row.id,
      action: "install",
      source: "flag",
      command: row.action.display,
      verdict: outcome.ok ? "applied" : "failed",
    });
  }

  const reverify = !dryRun && applied.length + failed.length > 0;
  const after = reverify ? (await ops.doctor()).rows : envelope.rows;
  return {
    receipt: SETUP_RECEIPT,
    applied,
    failed,
    declined,
    dryRun,
    instructions: plan.instructions,
    residual: plan.residual,
    reportOnly: plan.reportOnly,
    ledger: CONSENT_LEDGER,
    after,
  };
}

/** The fixed human block for one wizard run. */
export function renderSetup(receipt) {
  const lines = [`SETUP — doctor move plan · ${receipt.applied.length} applied · ${receipt.declined.length} consent rows pending`];
  for (const id of receipt.reportOnly) lines.push(`report-only  ${id}`);
  for (const command of receipt.instructions) lines.push(`instruction  ${command}`);
  for (const row of receipt.residual) lines.push(`residual     ${row.id} — ${row.reason ?? ""}`);
  if (receipt.applied.length > 0) lines.push(`APPLIED ${receipt.applied.length} — ${receipt.applied.join(", ")} (recorded in ${receipt.ledger})`);
  if (receipt.failed.length > 0) lines.push(`FAILED ${receipt.failed.length} — ${receipt.failed.join(", ")}`);
  if (receipt.applied.length === 0 && receipt.failed.length === 0) {
    lines.push(
      receipt.declined.length > 0
        ? `VERDICT: nothing written — pass --yes <id> (or run in a terminal to be asked) to apply: ${receipt.declined.join(", ")}`
        : "VERDICT: nothing written — every actionable row is already satisfied",
    );
  } else {
    lines.push(`VERDICT: ${receipt.failed.length > 0 ? "ATTENTION — an applied action failed; re-run the doctor" : "PASS — the same checker re-read the envelope"}`);
  }
  return lines.join("\n");
}

/** The real effects, wired for the bin: spawn, one ledger line, the same checker. */
export function realSetupOps({ root, doctor }) {
  return {
    runAction: (action) => {
      const result = spawnSync(action.program, action.args, {
        cwd: action.cwd ?? root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
      return { ok: result.status === 0, detail: `${result.stdout ?? ""}${result.stderr ?? ""}`.trim().split("\n").slice(-1)[0] ?? "" };
    },
    appendConsent: (record) => {
      const file = path.join(root, CONSENT_LEDGER);
      mkdirSync(path.dirname(file), { recursive: true });
      appendFileSync(file, `${JSON.stringify(record)}\n`);
    },
    doctor,
  };
}
