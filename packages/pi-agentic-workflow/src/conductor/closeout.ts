/**
 * checkCloseout — determine if the working tree is clean enough to merge.
 *
 * A PR is clean iff:
 *  - porcelain is exactly empty (zero length)
 *  - ahead count === 0
 *
 * Otherwise it's partial (and may need parking).
 */

import type { CloseoutStatus } from "./types.js";
import { foreignPorcelainLines } from "@gtrabanco/agentic-workflow/src/machine-ledger/index.mjs";

/**
 * Check if the working tree is clean for closeout/merge.
 *
 * @param porcelain — git status --porcelain output (or mock)
 * @param ahead — number of commits ahead of remote
 * @returns "clean" if both conditions are met, "partial" otherwise
 */
export function checkCloseout(porcelain: string, ahead: number): CloseoutStatus {
  // Issue #727: a pending machine-owned ledger row (`machine-ledger-commit@1`,
  // LEDGERS.md) is not the uncommitted work this check exists to judge — its
  // writer is machinery, and three probes over a row that only the teardown
  // can commit would park the loop. The filter is the crate module's own.
  const hasChanges = foreignPorcelainLines(porcelain).length > 0;
  const isAhead = ahead > 0;

  if (hasChanges || isAhead) {
    return "partial";
  }

  return "clean";
}