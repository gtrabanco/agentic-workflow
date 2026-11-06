#!/usr/bin/env node

/**
 * ceremony-passive.test.mjs — the passive carrier's only writer (issue #384,
 * unit `360c`; owner decisions `D360-5` and this unit's `D3`).
 *
 * The corpus, written BEFORE the module existed. `docs/passive/<id>.md` is a
 * passive unit's whole record (grammar `passive-record@1`, owned by
 * `skills/execute-phase/references/risk-tiers.md`), and the owner's rule is that
 * it is written by the ceremony CLI — never `echo`, `sed -i` or a hand edit —
 * which is what keeps two passive units from colliding:
 *
 *   C1  no writer exists          — `ceremony passive` is an unknown object at
 *                                   the base commit
 *   C2  a passive unit's record   — `add` writes it, `read` parses it back
 *   C3  two units collide         — a second `add` on the same id is a
 *                                   ceremonial block (exit 2) and writes nothing
 *   C4  a false passivity claim   — a scope whose computed tier is not `passive`
 *                                   is refused and routed to the standard
 *                                   ceremony; the tier is never an input
 *   C5  the record's consumers    — `scripts/tier-cost.mjs` reads the same bytes
 *                                   (`#383`), and `list` enumerates what is there
 *   C6  the CLI's contract        — JSON on stdout, exit 0/1/2, a closed registry,
 *                                   repo-relative paths only
 *
 * Fixtures are `mktemp -d` repositories (`./ceremony/testing.mjs`), never this
 * worktree.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { cer, makeRepo } from "./ceremony/testing.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTRACT = "passive-record@1";

/** A fixture repo with two prose files (the passive scope every case reuses). */
function proseRepo() {
  const dir = makeRepo();
  for (const [file, text] of Object.entries({
    "docs/workflow/SETUP.md": "# Setup\n\nHow the toolchain is provisioned.\n",
    "README.md": "# Fixture\n\nProse only.\n",
  })) {
    const abs = path.join(dir, file);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  return dir;
}

const addArgs = (id, extra = []) => [
  "passive", "add",
  "--id", id,
  "--paths", "docs/workflow/SETUP.md,README.md",
  "--readback", "both files read in full: prose only, no code block a runtime executes",
  "--gate", "node scripts/run-root-suite.mjs",
  "--gate-exit", "0",
  ...extra,
];

const recordPath = (dir, id) => path.join(dir, "docs", "passive", `${id}.md`);

/** The record's `name | value | description` rows, in file order. */
function recordFields(text) {
  const block = /```text\npassive-record@1\n([\s\S]*?)```/.exec(text);
  assert.ok(block, "the record carries the declared fenced grammar");
  return block[1].split("\n").filter((line) => line.trim() !== "").map((line) => {
    const cells = line.split("|").map((cell) => cell.trim());
    return { name: cells[0], value: cells[1], description: cells[2] };
  });
}

// ---------------------------------------------------------------------------
// C1 — the frozen failure: no writer existed
// ---------------------------------------------------------------------------

test("C1 the carrier's writer is a registered ceremony object (base: unknown-object)", () => {
  const dir = proseRepo();
  const r = cer(["passive", "list"], dir);
  assert.equal(r.code, 0, r.stderr);
  assert.deepEqual(r.json.records, [], "an empty carrier answers an empty list, not an error");
  assert.equal(r.json.contract, CONTRACT);
});

// ---------------------------------------------------------------------------
// C2 — add writes the record, read parses it back
// ---------------------------------------------------------------------------

test("C2 add writes the five declared fields in order, and read parses them back", () => {
  const dir = proseRepo();
  const added = cer(addArgs("2026-11-06-prose-sweep"), dir);
  assert.equal(added.code, 0, added.stdout + added.stderr);
  assert.equal(added.json.contract, CONTRACT);
  assert.equal(added.json.tier, "passive", "the record's tier is the computed verdict");
  assert.equal(added.json.path, "docs/passive/2026-11-06-prose-sweep.md", "the path is repo-relative");

  const text = fs.readFileSync(recordPath(dir, "2026-11-06-prose-sweep"), "utf8");
  assert.match(text, /^# 2026-11-06-prose-sweep\n/, "the record is titled by its id");
  const fields = recordFields(text);
  assert.deepEqual(fields.map((field) => field.name), ["id", "tier", "paths", "readback", "gate"],
    "exactly the grammar's five fields, in its order");

  const read = cer(["passive", "read", "--id", "2026-11-06-prose-sweep"], dir);
  assert.equal(read.code, 0, read.stdout);
  assert.deepEqual(Object.keys(read.json.record), ["id", "tier", "paths", "readback", "gate"]);
  assert.equal(read.json.record.id, "2026-11-06-prose-sweep");
  assert.equal(read.json.record.tier, "passive");
  assert.deepEqual(read.json.record.paths, ["docs/workflow/SETUP.md", "README.md"], "the scope is the list the writer recorded");
  assert.match(read.json.record.readback, /both files read in full/);
  assert.equal(read.json.record.gate.command, "node scripts/run-root-suite.mjs");
  assert.equal(read.json.record.gate.exit, 0);
});

// ---------------------------------------------------------------------------
// C3 — two passive units cannot collide
// ---------------------------------------------------------------------------

test("C3 a second add on the same id is a ceremonial block and leaves the record untouched", () => {
  const dir = proseRepo();
  assert.equal(cer(addArgs("2026-11-06-prose-sweep"), dir).code, 0);
  const before = fs.readFileSync(recordPath(dir, "2026-11-06-prose-sweep"), "utf8");

  const again = cer(addArgs("2026-11-06-prose-sweep", ["--readback", "a different readback"]), dir);
  assert.equal(again.code, 2, "a collision is a ceremonial block, never a silent overwrite");
  assert.equal(again.json.blocked, true);
  assert.equal(again.json.error, "record-exists");
  assert.equal(fs.readFileSync(recordPath(dir, "2026-11-06-prose-sweep"), "utf8"), before, "the first record stands");
});

// ---------------------------------------------------------------------------
// C4 — the tier is computed, never chosen
// ---------------------------------------------------------------------------

test("C4 a scope the classifier does not call passive is refused and routed to the standard ceremony", () => {
  const dir = proseRepo();
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(path.join(dir, "scripts", "tool.mjs"), "export const value = 1;\n");

  const refused = cer([
    "passive", "add",
    "--id", "2026-11-06-not-passive",
    "--paths", "docs/workflow/SETUP.md,scripts/tool.mjs",
    "--readback", "claimed",
    "--gate", "true",
    "--gate-exit", "0",
  ], dir);
  assert.equal(refused.code, 2, refused.stdout);
  assert.equal(refused.json.error, "not-passive");
  assert.equal(refused.json.tier, "standard", "the computed tier is named");
  assert.equal(refused.json.route, "standard-ceremony", "and where the unit belongs instead");
  assert.equal(fs.existsSync(recordPath(dir, "2026-11-06-not-passive")), false, "nothing is written");
});

test("C4b the tier is not an input: a --tier flag is an unknown flag, not an override", () => {
  const dir = proseRepo();
  const r = cer(addArgs("2026-11-06-forced", ["--tier", "passive"]), dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "unknown-flag");
  assert.equal(fs.existsSync(recordPath(dir, "2026-11-06-forced")), false);
});

// ---------------------------------------------------------------------------
// C5 — the record's other consumer reads the same bytes
// ---------------------------------------------------------------------------

test("C5 the written record is the one #383's cost instrument resolves a tier from", async () => {
  const dir = proseRepo();
  assert.equal(cer(addArgs("222-prose"), dir).code, 0);
  const { resolveTier, ceremonyOf } = await import(path.join(ROOT, "scripts", "tier-cost.mjs"));
  assert.equal(resolveTier(dir, "222-prose"), "passive", "tier-cost reads the record's tier field");
  assert.deepEqual(ceremonyOf(dir, "222-prose"), { recorded: 0, skipped: 4 },
    "and counts the four ceremony steps a passive unit skips");

  const listed = cer(["passive", "list"], dir);
  assert.equal(listed.code, 0);
  assert.deepEqual(listed.json.records.map((record) => record.id), ["222-prose"]);
  assert.deepEqual(listed.json.records[0].paths, ["docs/workflow/SETUP.md", "README.md"]);
});

test("C5b list is sorted by id and reports a malformed record instead of crashing", () => {
  const dir = proseRepo();
  for (const id of ["2026-11-01-b", "2026-10-30-a"]) assert.equal(cer(addArgs(id), dir).code, 0);
  fs.writeFileSync(recordPath(dir, "2026-11-02-broken"), "# 2026-11-02-broken\n\n- not the grammar\n");

  const listed = cer(["passive", "list"], dir);
  assert.equal(listed.code, 0, "a broken record is reported, never a crash");
  assert.deepEqual(listed.json.records.map((record) => record.id), ["2026-10-30-a", "2026-11-01-b"]);
  assert.deepEqual(listed.json.invalid.map((entry) => entry.id), ["2026-11-02-broken"]);

  const read = cer(["passive", "read", "--id", "2026-11-02-broken"], dir);
  assert.equal(read.code, 2, "reading a broken record is a ceremonial block");
  assert.equal(read.json.error, "malformed-record");
});

// ---------------------------------------------------------------------------
// C6 — the CLI's contract: JSON, 0/1/2, closed registry, repo-relative paths
// ---------------------------------------------------------------------------

test("C6 usage errors stay exit 1 with JSON on stdout, and nothing is written", () => {
  const dir = proseRepo();
  const cases = [
    [["passive", "teleport"], "unknown-subcommand"],
    [["passive", "add"], "missing-flag"],
    [["passive", "read"], "missing-flag"],
    [["passive", "read", "--id", "never-written"], "unknown-record"],
    [["passive", "add", "--id", "not-a-date", "--paths", "a.md", "--readback", "x", "--gate", "true", "--gate-exit", "0"], "invalid-id"],
    [["passive", "add", "--id", "2026-11-06-escape", "--paths", "../outside.md", "--readback", "x", "--gate", "true", "--gate-exit", "0"], "invalid-path"],
    [["passive", "add", "--id", "2026-11-06-abs", "--paths", "/etc/passwd", "--readback", "x", "--gate", "true", "--gate-exit", "0"], "invalid-path"],
    [["passive", "add", "--id", "2026-11-06-exit", "--paths", "a.md", "--readback", "x", "--gate", "true", "--gate-exit", "soon"], "invalid-flag-value"],
  ];
  for (const [args, error] of cases) {
    const r = cer(args, dir);
    assert.equal(r.code, 1, `${error}: exit 1`);
    assert.ok(r.json, `${error}: stdout is JSON`);
    assert.equal(r.json.error, error, `${error}: the refusal is named`);
  }
  assert.equal(fs.existsSync(path.join(dir, "docs", "passive")), false, "no refusal writes a record");
});

test("C6b add is deterministic: the same facts write the same bytes, and the record carries no clock", () => {
  const first = proseRepo();
  const second = proseRepo();
  assert.equal(cer(addArgs("2026-11-06-prose-sweep"), first).code, 0);
  assert.equal(cer(addArgs("2026-11-06-prose-sweep"), second).code, 0);
  const a = fs.readFileSync(recordPath(first, "2026-11-06-prose-sweep"), "utf8");
  const b = fs.readFileSync(recordPath(second, "2026-11-06-prose-sweep"), "utf8");
  assert.equal(a, b, "same facts → same bytes");
  assert.doesNotMatch(a, /\d{2}:\d{2}/, "the record carries no wall-clock");
  assert.equal(recordFields(a).find((field) => field.name === "gate").value, "`node scripts/run-root-suite.mjs` · exit 0",
    "the gate field is the command and its exit, as the grammar declares it");
});
