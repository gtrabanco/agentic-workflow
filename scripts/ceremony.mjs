#!/usr/bin/env node
/**
 * ceremony.mjs — the closed deterministic CLI for the workflow's own ceremony
 * (issue #338). One entry, one registry: every ceremony operation is a
 * `<object> <subcommand>` here, with JSON on stdout and the uniform exit
 * contract — 0 success, 1 usage error, 2 ceremonial block.
 *
 * Usage
 *   node scripts/ceremony.mjs <object> <subcommand> [flags...]
 *   objects: workspace | docs | findings | ledger | unit | plan | tier | passive
 *
 * Closed world (S8): an operation that is not in the registry is a JSON usage
 * error — the CLI never falls back to invented shell commands. The P1/P2
 * modules of the issue's priority list answer `deferred-module` until their
 * follow-up PRs land (owner decision D2: this unit ships the P0 set).
 *
 * Read-only, dependency-free (`node:` imports only), deterministic on read
 * operations: same input → same stdout, always.
 */

import process from "node:process";
import { workspace } from "./ceremony/workspace.mjs";
import { docs } from "./ceremony/docs.mjs";
import { findings } from "./ceremony/findings.mjs";
import { ledger } from "./ceremony/ledger.mjs";
import { unit } from "./ceremony/unit.mjs";
import { plan } from "./ceremony/plan.mjs";
import { tier } from "./ceremony/tier.mjs";
import { passive } from "./ceremony/passive.mjs";
import { fail, DEFERRED_MODULES } from "./ceremony/lib.mjs";

const REGISTRY = {
  workspace,
  docs,
  findings,
  ledger,
  unit,
  plan,
  tier,
  passive,
};

const P0_PENDING = [];

const [, , object, op, ...rest] = process.argv;

if (!object) {
  fail("usage", {
    usage: "node scripts/ceremony.mjs <object> <subcommand> [flags...]",
    objects: Object.keys(REGISTRY),
    "p0-pending": P0_PENDING,
    "deferred-modules": DEFERRED_MODULES,
    "exit-codes": { 0: "success", 1: "usage error", 2: "ceremonial block" },
  });
}

if (P0_PENDING.includes(object)) {
  fail("deferred-module", { object, note: `the ${object} module ships in a later phase of fix/338` });
}

if (DEFERRED_MODULES.includes(object)) {
  fail("deferred-module", { object, note: "P1/P2 module — follow-up PR extending the CLI (issue #338 priority list, decision D2)" });
}

const handler = REGISTRY[object];
if (!handler) {
  fail("unknown-object", { object, objects: Object.keys(REGISTRY) });
}

handler(op, rest);
