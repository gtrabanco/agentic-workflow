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

/**
 * Check if the working tree is clean for closeout/merge.
 *
 * @param porcelain — git status --porcelain output (or mock)
 * @param ahead — number of commits ahead of remote
 * @returns "clean" if both conditions are met, "partial" otherwise
 */
export function checkCloseout(porcelain: string, ahead: number): CloseoutStatus {
  const hasChanges = porcelain.length > 0;
  const isAhead = ahead > 0;

  if (hasChanges || isAhead) {
    return "partial";
  }

  return "clean";
}