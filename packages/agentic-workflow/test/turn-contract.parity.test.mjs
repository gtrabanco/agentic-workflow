// Two-engine parity suite: the same fixture-repo matrix through the crate
// engine and the scaffold shim must produce byte-identical stdout and exit
// codes (AC7). This is the drift gate between the two implementations.

import test from "node:test";
import assert from "node:assert/strict";

import { makeContext, receiptCases } from "./fixtures.mjs";

const ctx = makeContext();
test.after(() => ctx.cleanup());

for (const c of receiptCases(ctx)) {
  test(`parity: ${c.name}`, () => {
    const engine = ctx.runEngine(c.dir, c.args ?? [], c.env ?? {});
    const shim = ctx.runShim(c.dir, c.args ?? [], c.env ?? {});
    assert.equal(engine.code, shim.code, `exit parity for "${c.name}"`);
    assert.equal(engine.stdout, shim.stdout, `stdout parity for "${c.name}"`);
  });
}
