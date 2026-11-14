#!/usr/bin/env node
/**
 * relay-packet.mjs — the read-only checker for a lane unit's Relay packet.
 *
 * The contract, the grammar and the block shapes are owned by
 * `packages/agentic-workflow/src/relay/Packet.mjs` — the same module the crate's
 * `agentic-workflow relay` command runs, so a project that carries the workflow's
 * scripts and one that carries only the crate print the identical block. This
 * file owns argv, the usage text and the two manifest paths a workspace declares.
 *
 * Usage
 *   bun scripts/relay-packet.mjs check <unit> [--packet <dir>]
 *   bun scripts/relay-packet.mjs budget <unit> [--packet <dir>]
 *   bun scripts/relay-packet.mjs tiers <unit>
 *   bun scripts/relay-packet.mjs obligations <unit>
 *   (node fallback, same argv)
 *
 * stdout: one fixed block per mode, ending with `verdict: PASS|FAIL`.
 * exit: 0 PASS; 1 FAIL (a fault the packet or ledger carries); 2 a usage error,
 * an unknown/ambiguous unit, or a missing manifest the check needs.
 *
 * `RELAY_PACKET_REPO` re-points the workspace; `RELAY_PACKET_CATALOG` and
 * `RELAY_PACKET_BUDGETS` re-point the two manifests, so a validation test
 * mutates its own copies instead of the tracked files.
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { RelayUsageError, parseRelayArgs, runRelayMode } from "../packages/agentic-workflow/src/relay/Packet.mjs";

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_WORKSPACE = process.env.RELAY_PACKET_REPO ? path.resolve(process.env.RELAY_PACKET_REPO) : MODULE_ROOT;
const CATALOG_PATH = process.env.RELAY_PACKET_CATALOG
  ? path.resolve(process.env.RELAY_PACKET_CATALOG)
  : path.join(MODULE_ROOT, "packages/agentic-workflow/src/runner", "catalog.json");
const BUDGETS_PATH = process.env.RELAY_PACKET_BUDGETS
  ? path.resolve(process.env.RELAY_PACKET_BUDGETS)
  : path.join(MODULE_ROOT, "docs", "workflow", "SKILL_CONTEXT_BUDGETS.json");

/** The catalog is this repository's own manifest: the block names it the way the docs do. */
const CATALOG_LABEL = "packages/agentic-workflow/src/runner/catalog.json";

const USAGE = `usage: bun scripts/relay-packet.mjs <check|budget|tiers|obligations> <unit> [--repo <dir>] [--packet <dir>]
  check        validate the packet: documents, charter pointer, baton grammar, verdict grammar
  budget       measure the leg handover (charter + baton) against the declared ceiling
  tiers        print each leg's tier from packages/agentic-workflow/src/runner/catalog.json
  obligations  verify the unit's obligations ledger is closed
  <unit>       an NN-slug unit token, or a unit directory path
  --repo       read the workspace from this directory (default: this repository)
  --packet     read the packet from this directory instead of .pi-web/relays/<slug>
`;

function main(argv) {
  const args = argv.slice(2).filter((arg) => arg !== "");
  if (args[0] === "--help" || args[0] === "-h") {
    process.stdout.write(USAGE);
    return;
  }
  let parsed;
  try {
    parsed = parseRelayArgs(args, { defaultWorkspace: DEFAULT_WORKSPACE });
  } catch (error) {
    if (!(error instanceof RelayUsageError)) throw error;
    process.stderr.write(`relay-packet: ${error.message}\n`);
    process.stderr.write(USAGE);
    process.exit(2);
  }

  let result;
  try {
    result = runRelayMode({
      ...parsed,
      catalogPath: CATALOG_PATH,
      catalogLabel: CATALOG_LABEL,
      budgetsPath: BUDGETS_PATH,
      budgetsLabel: path.relative(MODULE_ROOT, BUDGETS_PATH),
    });
  } catch (error) {
    if (!(error instanceof RelayUsageError)) throw error;
    process.stderr.write(`RELAY ERROR — ${error.message}\n`);
    process.exit(2);
  }
  process.stdout.write(`${result.lines.join("\n")}\n`);
  process.exit(result.exit);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv);
}
