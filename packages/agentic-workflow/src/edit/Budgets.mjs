/**
 * Budgets — ceiling rebase for budget tables.
 *
 * Refuses to shrink without a declared growth source.
 * Operations validate post-state and emit receipts.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

// ── Helpers ──────────────────────────────────────────────────────────────

function sha256(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function shaPrefix(hex) {
  return hex.slice(0, 8);
}

function makeReceipt(service, op, path, schema, before, after, ok) {
  return { service, op, path, schema, before, after, ok };
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * ceilingRebase(budgetFile, route, estimateMax, linesMax, growthSource)
 *
 * Rebases the ceiling values for a budget route.  If either value would
 * shrink (i.e., the new value is less than the existing value in the file),
 * a non-empty growthSource string is required and must be written into the
 * route's `sources` object.
 *
 * budgetFile is the absolute path to the budget JSON file.
 * route is the route name (e.g. "execute-phase").
 * estimateMax is the new estimate-max value (number).
 * linesMax is the new lines-max value (number).
 * growthSource is the declared reason for shrinkage (required if shrinking).
 *
 * The budget file is a JSON file with a structure like:
 * { "routes": { "<route>": { "estimateMax": N, "linesMax": N, "sources": {} } } }
 *
 * Returns a receipt with ok: false if shrinking without a growth source
 * (refusal — nothing is written).  ok: true on success.
 *
 * For SDK callers that want throw semantics on shrink: check receipt.ok === false.
 */
export function ceilingRebase(budgetFile, route, estimateMax, linesMax, growthSource) {
  const content = readFileSync(budgetFile, "utf8");
  const beforeHash = sha256(content);

  const data = JSON.parse(content);
  const routeData = data.routes?.[route];

  if (!routeData) {
    throw new Error(`Budget route "${route}" not found`);
  }

  const estimateRef = routeData.estimateMax ?? Infinity;
  const linesRef = routeData.linesMax ?? Infinity;

  // Check for shrinkage
  const estimateShrinks = estimateMax !== undefined && estimateMax < estimateRef;
  const linesShrinks = linesMax !== undefined && linesMax < linesRef;

  if ((estimateShrinks || linesShrinks) && (!growthSource || growthSource.trim() === "")) {
    // Refuse shrinkage without a growth source — return fail receipt
    return makeReceipt(
      "budgets",
      "ceilingRebase",
      budgetFile,
      "budgets-table@1",
      shaPrefix(beforeHash),
      shaPrefix(beforeHash),
      false,
    );
  }

  // Apply the rebase
  if (estimateMax !== undefined) routeData.estimateMax = estimateMax;
  if (linesMax !== undefined) routeData.linesMax = linesMax;

  // Record the growth source if provided
  if (growthSource) {
    routeData.sources = routeData.sources || {};
    routeData.sources.ceilingRebase = growthSource;
  }

  const newContent = JSON.stringify(data, null, 2);
  writeFileSync(budgetFile, newContent, "utf8");
  const afterHash = sha256(newContent);

  return makeReceipt(
    "budgets",
    "ceilingRebase",
    budgetFile,
    "budgets-table@1",
    shaPrefix(beforeHash),
    shaPrefix(afterHash),
    true,
  );
}