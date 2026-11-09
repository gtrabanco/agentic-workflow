#!/usr/bin/env node
/**
 * temp-root.mjs — the tracked temp-root helper (issue #476).
 *
 * The incident: test suites created temp dirs and cleaned them only on the
 * happy path — or never — so every red run, killed runner or hung process
 * leaked, until 494k files saturated `/tmp` and blocked the session daemon
 * behind the same disk I/O. This helper makes cleanup process-wide and
 * unconditional: one `tempRoot("prefix-")` call creates the directory and
 * registers it for an exit-hook `rmSync` that runs even when a test fails or
 * the runner tears the process down, and signal handlers dispose first and
 * re-raise, so a SIGTERM kill still cleans before dying.
 *
 * It is the cleanup capability the temp-hygiene floor
 * (`scripts/temp-hygiene.mjs`) names beside `rmSync`: a file that creates
 * temp dirs through `tempRoot` satisfies the floor with no per-file
 * `try/finally` ceremony. Its sibling suite is `scripts/temp-root.test.mjs`.
 */

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";

const tracked = new Set();
let hooksInstalled = false;

/** Create a tracked temp directory (`mkdtempSync` under `base ?? tmpdir()`,
 *  the prefix included) and register it for unconditional cleanup. */
export function tempRoot(prefix, base) {
  const root = mkdtempSync(join(base ?? tmpdir(), prefix));
  tracked.add(root);
  ensureHooks();
  return root;
}

/** The tracked roots, insertion order — read-only copy for tests. */
export function trackedTempRoots() {
  return [...tracked];
}

/** Remove every tracked root now (recursive, force, per-root errors
 *  swallowed — a sweeper never makes teardown worse). Returns the count. */
export function disposeTempRoots() {
  let removed = 0;
  for (const root of tracked) {
    try {
      rmSync(root, { recursive: true, force: true });
      removed += 1;
    } catch {
      /* the directory may already be gone; cleanup is best-effort */
    }
  }
  tracked.clear();
  return removed;
}

/** Install the process hooks exactly once: an exit hook plus SIGINT/SIGTERM
 *  handlers that dispose first and re-raise, so the default termination
 *  still applies after the cleanup ran. */
function ensureHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  process.on("exit", () => {
    disposeTempRoots();
  });
  for (const sig of ["SIGINT", "SIGTERM"]) {
    const handler = () => {
      disposeTempRoots();
      process.removeListener(sig, handler);
      process.kill(process.pid, sig);
    };
    process.on(sig, handler);
  }
}
