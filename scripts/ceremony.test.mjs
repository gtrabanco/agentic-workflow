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
import { readSection, parseLog, splitSections } from "../packages/agentic-workflow/src/runner/lib.mjs";

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

test("a P1/P2 module answers for real — `deferred-module` is gone (feature 91, S2)", () => {
  const dir = makeRepo();
  const r = cer(["review", "create", "--slug", "x", "--head", "abc1234"], dir);
  // The module is wired: a slug with no unit is the ordinary usage error, not the
  // placeholder answer this registry used to give every later module.
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "unknown-slug");
  assert.equal(r.json["deferred-module"], undefined);
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

test("section readers are fence-aware: a fenced block with ## lines inside never bounds a section (fix/338's own L1 embeds the issue)", () => {
  const md = [
    "# t",
    "",
    "## Log",
    "",
    "- **L1** — 2026-11-24, the issue, verbatim:",
    "",
    "````markdown",
    "## Tasks",
    "",
    "- P1 — embedded, quoted, never a bound",
    "",
    "```bash",
    "## not a heading either",
    "```",
    "````",
    "",
    "- **P1** — 2026-11-24 12:00, after the fence · abc1234.",
    "",
    "## Next",
    "",
    "n/a",
  ].join("\n");
  const log = readSection(md, "log");
  assert.ok(log.includes("- **P1** — 2026-11-24 12:00"), "the P line after the fence belongs to Log");
  assert.ok(log.includes("## Tasks"), "the fenced ## Tasks is quoted text inside Log");
  const headings = splitSections(md).sections.map((s) => s.heading);
  assert.deepEqual(headings, ["t", "Log", "Next"], "fenced ## lines are never section bounds");
  const marks = parseLog(md);
  assert.deepEqual(marks.map((m) => m.kind), ["L", "P"], "the quoted lines inside the fence are never marks");
});
