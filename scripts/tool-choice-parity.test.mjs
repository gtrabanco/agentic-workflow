// test-obligation: protects=packages/agentic-workflow/src/tool-choice/policy.mjs obligations=convention,contract

// tool-choice-parity.test.mjs — one allowlist, two layers, zero drift (issue #610).
//
// `scripts/invocation-drift.mjs` and the pi extension's command-time carrier are
// the two halves of one rule: the gate refuses a push that *teaches* the fallback
// tool, the carrier refuses the *use* of it. A second allowlist would let one
// half sanction what the other punishes, so the set lives once in the crate's
// policy module and this suite is the pin — issue #555's runner-set pattern
// transposed to the agent's own tool choice.
//
// Three things are checked, in the order they can break:
//
//   1. the gate imports that one map (object identity — not an equal copy),
//   2. every script the gate blesses is a script the carrier lets through, and
//      the carrier's extra sanctioned script is exactly the declared root-suite
//      leg, never an accidental widening,
//   3. neither consumer re-declares the paths as a literal.
//
// This file is cited by the `shell-tool-choice-carrier` row of
// `docs/workflow/GATE_INVENTORY.md`; `scripts/prose-gate-inventory.mjs` refuses a
// `*-parity.test.mjs` suite that no row cites.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BOOTSTRAP_SCRIPTS as SHARED_BOOTSTRAP_SCRIPTS,
  NODE_SANCTIONED_SCRIPTS,
  classifySegment,
} from "../packages/agentic-workflow/src/tool-choice/policy.mjs";
import { BOOTSTRAP_SCRIPTS as GATE_BOOTSTRAP_SCRIPTS, scan } from "./invocation-drift.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE_SOURCE = fs.readFileSync(path.join(ROOT, "scripts/invocation-drift.mjs"), "utf8");

/** The one documented asymmetry: the root suite's CI leg is node by contract. */
const ROOT_SUITE_LEG = "scripts/run-root-suite.mjs";

test("F28 — the drift gate reads the shared allowlist, not a copy of it", () => {
  assert.equal(GATE_BOOTSTRAP_SCRIPTS, SHARED_BOOTSTRAP_SCRIPTS, "identity, not deep equality: one object, two readers");
  assert.ok(SHARED_BOOTSTRAP_SCRIPTS.size > 0, "an empty allowlist would sanction nothing and pin nothing");
});

test("F29 — every form the gate sanctions is a form the carrier lets through, and the widening is exactly the declared leg", () => {
  for (const script of SHARED_BOOTSTRAP_SCRIPTS.keys()) {
    assert.equal(
      classifySegment({ operator: "", text: `node ${script}` }).kind,
      "pass",
      `${script} is blessed by the gate, so the carrier must not punish it`,
    );
  }
  const carrierScripts = NODE_SANCTIONED_SCRIPTS.filter((script) => !SHARED_BOOTSTRAP_SCRIPTS.has(script));
  assert.deepEqual(carrierScripts, [ROOT_SUITE_LEG], "the carrier's only extra sanctioned script is the root suite's node leg");
  assert.equal(classifySegment({ operator: "", text: `node ${ROOT_SUITE_LEG} --jobs 1` }).kind, "pass");
});

test("F30 — the sanctioned forms are pinned in both directions and the gate's prose exemption follows the shared keys", () => {
  assert.equal(classifySegment({ operator: "", text: "node --test scripts/x.test.mjs" }).kind, "pass");
  assert.equal(classifySegment({ operator: "", text: "node scripts/session-close.mjs close" }).kind, "node-default");
  // The bootstrap literal is derived, not listed: a script the allowlist does not
  // carry is not exempt in prose either.
  assert.match(GATE_SOURCE, /bootstrapLiteral\(BOOTSTRAP_SCRIPTS\.keys\(\)\)/, "the exemption derives from the shared keys");
  assert.doesNotMatch(GATE_SOURCE, /new Map\(\[\s*\["scripts\/setup-env\.mjs"/, "no second copy of the pair");
  for (const script of SHARED_BOOTSTRAP_SCRIPTS.keys()) {
    assert.ok(!GATE_SOURCE.includes(`"${script}"`), `the gate does not re-declare ${script}`);
  }
});

test("F31 — the gate's own run still passes with the shared allowlist in place", () => {
  const result = scan(ROOT);
  assert.deepEqual(result.violations, [], "the shipped tree is drift-free");
  // Every blessed script that still lives in `scripts/` and prints a usage
  // string must be reported as allowed. `setup-env` moved into the crate
  // (issue #553) and its shim prints none, so the population is the blessed set
  // intersected with the scripts this tree carries — the invariant, not a count.
  const carrying = [...SHARED_BOOTSTRAP_SCRIPTS.keys()].filter((rel) =>
    fs.existsSync(path.join(ROOT, rel)) && /usage:\s*node/u.test(fs.readFileSync(path.join(ROOT, rel), "utf8")),
  );
  assert.ok(result.allowed.length >= carrying.length, "every blessed usage string is reported as allowed");
});
