// temp.test.mjs — the one temporary-directory resolution (issue #546 S8),
// carried by the crate so the hooks, the merge wrapper and any later consumer
// ask one implementation (unit 554).
//
// The cases are the retired shell suite's (test-temp-lib.sh): the candidate
// order, the writability test, the fallback, the refusal naming what it tried,
// and the file a caller gets.

import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { TMPDIR_CANDIDATES, mktempFile, tmpdir } from "../src/temp.mjs";

const scratch = mkdtempSync(path.join(os.tmpdir(), "aw-temp-suite-"));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

test("the candidate order is TMPDIR, TEMP, TMP, /tmp", () => {
  assert.deepEqual(TMPDIR_CANDIDATES, ["TMPDIR", "TEMP", "TMP", "/tmp"]);
});

test("TMPDIR wins when it is a writable directory", () => {
  const first = mkdtempSync(path.join(scratch, "one-"));
  const second = mkdtempSync(path.join(scratch, "two-"));
  const result = tmpdir({ env: { TMPDIR: first, TEMP: second } });
  assert.deepEqual(result, { ok: true, dir: first });
});

test("a Windows host's TEMP answers when TMPDIR is unset", () => {
  const windows = mkdtempSync(path.join(scratch, "win-"));
  const result = tmpdir({ env: { TEMP: windows } });
  assert.deepEqual(result, { ok: true, dir: windows });
});

test("TMP answers when neither TMPDIR nor TEMP is set", () => {
  const only = mkdtempSync(path.join(scratch, "tmp-"));
  const result = tmpdir({ env: { TMP: only } });
  assert.deepEqual(result, { ok: true, dir: only });
});

test("a minimal container with no variable falls back to /tmp", () => {
  const result = tmpdir({ env: {} });
  assert.equal(result.ok, true);
  assert.equal(result.dir, "/tmp");
});

test("a candidate that is not a directory is skipped, not used", () => {
  const fallback = mkdtempSync(path.join(scratch, "fallback-"));
  const file = path.join(scratch, "not-a-dir");
  writeFileSync(file, "x");
  const result = tmpdir({ env: { TMPDIR: file, TEMP: "/does/not/exist", TMP: fallback } });
  assert.deepEqual(result, { ok: true, dir: fallback });
});

// The writability half of the probe is a permission fact a test cannot stage
// portably (root ignores the mode bits), so it is exercised through the injected
// probe: a declared candidate the probe rejects is skipped, never used.
test("a declared-but-unwritable candidate is skipped", () => {
  const locked = mkdtempSync(path.join(scratch, "locked-"));
  const fallback = mkdtempSync(path.join(scratch, "open-"));
  const result = tmpdir({
    env: { TMPDIR: locked, TEMP: fallback },
    probe: (candidate) => candidate !== locked,
  });
  assert.deepEqual(result, { ok: true, dir: fallback });
});

test("no usable candidate refuses, naming every one it tried", () => {
  const result = tmpdir({ env: { TMPDIR: "/nope", TEMP: "/nope2" }, probe: () => false });
  assert.equal(result.ok, false);
  assert.match(result.message, /no writable temporary directory/u);
  assert.match(result.message, /TMPDIR, TEMP, TMP, \/tmp/u);
});

test("mktempFile creates a fresh, uniquely named file in the resolved directory", () => {
  const home = mkdtempSync(path.join(scratch, "mktemp-"));
  const first = mktempFile("agentic-workflow-automerge", { env: { TMPDIR: home } });
  const second = mktempFile("agentic-workflow-automerge", { env: { TMPDIR: home } });
  assert.equal(first.ok, true, first.message);
  assert.equal(second.ok, true, second.message);
  assert.notEqual(first.file, second.file, "two calls never collide");
  for (const file of [first.file, second.file]) {
    assert.equal(path.dirname(file), home);
    assert.match(path.basename(file), /^agentic-workflow-automerge\.[A-Za-z0-9]+$/u);
    assert.equal(existsSync(file), true);
    assert.equal(statSync(file).isFile(), true);
  }
  assert.equal(readdirSync(home).filter((entry) => entry.startsWith("agentic-workflow-automerge.")).length, 2);
});

test("mktempFile propagates the refusal instead of writing outside the directory", () => {
  const result = mktempFile("x", { env: {}, probe: () => false });
  assert.equal(result.ok, false);
  assert.match(result.message, /no writable temporary directory/u);
});
