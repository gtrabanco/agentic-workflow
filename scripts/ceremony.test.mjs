/**
 * ceremony.test.mjs — the closed CLI's entry contract (fix #338).
 *
 * Pins: usage on no args (exit 1), closed-world dispatch (unknown object,
 * unknown subcommand, unknown flag → JSON usage error, exit 1), P1/P2 modules
 * answering `deferred-module` (owner decision D2), and JSON-only stdout.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { cer, makeRepo } from "./ceremony/testing.mjs";

test("no args → usage JSON, exit 1 (S6)", () => {
  const dir = makeRepo();
  const r = cer([], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "usage");
  assert.ok(r.json.objects.includes("workspace"));
  assert.deepEqual(r.json["exit-codes"], { 0: "success", 1: "usage error", 2: "ceremonial block" });
});

test("unknown object → closed-world JSON error, exit 1 (S8, O1)", () => {
  const dir = makeRepo();
  const r = cer(["nonsense", "x"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "unknown-object");
  assert.equal(r.json.object, "nonsense");
});

test("P1/P2 module (review) → deferred-module, exit 1 (O13)", () => {
  const dir = makeRepo();
  const r = cer(["review", "create", "--slug", "x"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "deferred-module");
  assert.equal(r.json.object, "review");
  assert.match(r.json.note, /follow-up PR/);
});

test("unknown subcommand of a known object → exit 1 (S8)", () => {
  const dir = makeRepo();
  const r = cer(["workspace", "teleport"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "unknown-subcommand");
  assert.equal(r.json.object, "workspace");
});

test("unknown flag → exit 1 (S6: usage error)", () => {
  const dir = makeRepo();
  const r = cer(["workspace", "status", "--bogus"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "unknown-flag");
});

test("success output is parseable JSON on stdout, exit 0 (S6, O6)", () => {
  const dir = makeRepo();
  const r = cer(["workspace", "clean-check"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.clean, true);
});
