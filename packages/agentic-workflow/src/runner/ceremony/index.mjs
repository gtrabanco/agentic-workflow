/**
 * index.mjs — the ceremony CLI's closed registry (issues #338, #352).
 *
 * One entry, one registry: every ceremony operation is `<object> <subcommand>`
 * under `agentic-workflow ceremony`, with JSON on stdout and the uniform exit
 * contract — 0 success, 1 usage error, 2 ceremonial block.
 *
 * Closed world: an object or operation that is not in the registry is a JSON
 * usage error. The CLI never falls back to an invented shell command, which is
 * the property that makes it a ceremony rather than a suggestion.
 *
 * The modules are the same code the repository ran as `scripts/ceremony/*`;
 * they now import their primitives from `../lib.mjs` and their shared parsers
 * from `src/runner/`, and the writer half of `unit`/`plan` still delegates to
 * the router and the linter through the shipped bin — one entry point, never a
 * second derivation.
 */

import { workspace } from "./workspace.mjs";
import { docs } from "./docs.mjs";
import { findings } from "./findings.mjs";
import { ledger } from "./ledger.mjs";
import { unit } from "./unit.mjs";
import { plan } from "./plan.mjs";
import { tier } from "./tier.mjs";
import { passive } from "./passive.mjs";
import { fail, DEFERRED_MODULES } from "../lib.mjs";

/** The closed object set: one handler per object. */
export const REGISTRY = Object.freeze({
  workspace,
  docs,
  findings,
  ledger,
  unit,
  plan,
  tier,
  passive,
});

/** The objects a caller may name, in registry order. */
export const CEREMONY_OBJECTS = Object.keys(REGISTRY);

const EXIT_CODES = { 0: "success", 1: "usage error", 2: "ceremonial block" };

/**
 * CLI entry: the arguments after `agentic-workflow ceremony`.
 * `<object> <subcommand> [flags...]`.
 *
 * @param {string[]} args
 */
export function run(args) {
  const [object, op, ...rest] = args;

  if (!object) {
    fail("usage", {
      usage: "agentic-workflow ceremony <object> <subcommand> [flags...]",
      objects: CEREMONY_OBJECTS,
      "deferred-modules": DEFERRED_MODULES,
      "exit-codes": EXIT_CODES,
    });
  }

  if (DEFERRED_MODULES.includes(object)) {
    fail("deferred-module", {
      object,
      note: "P1/P2 module — the follow-up phase of issue #352 that extends the registry",
    });
  }

  const handler = REGISTRY[object];
  if (!handler) fail("unknown-object", { object, objects: CEREMONY_OBJECTS });

  handler(op, rest);
}
