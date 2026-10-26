#!/usr/bin/env node

/**
 * roadmap-settle.test.mjs — the root-suite gate for issue #316: a unit doc
 * that carries a PR URL must have its index row reading `done · [#N](<same
 * url>)`, and the contradiction fails closed offline with named codes.
 *
 * The frozen-failure corpus lives in `fixtures/roadmap-settle/`: the 77-shaped
 * reproducer (PR #309 merged, row `in-progress` on `main`) and the 79-shaped
 * one (PR open, seven phases logged, row `in-progress` until the audit
 * blocked), both derived verbatim from git history. The live-tree case keeps
 * the real drift red in the suite, the same wiring promise-coherence uses.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(ROOT, "scripts", "roadmap-settle.mjs");
const FIXTURES = path.join(ROOT, "scripts", "fixtures", "roadmap-settle");

const run = (args, cwd = ROOT) => spawnSync(process.execPath, [GATE, ...args], { cwd, encoding: "utf8" });

test("the 77-shaped reproducer fails closed with pr-url-unsettled", () => {
  const r = run(["--root", FIXTURES]);
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stdout, /^Roadmap-settle: .*77-settle-repro\/SPEC\.md:5 pr-url-unsettled/m);
  assert.match(r.stdout, /expected 'done · \[#309\]\(https:\/\/github\.com\/gtrabanco\/agentic-workflow\/pull\/309\)'/);
  assert.match(r.stdout, /verdict: FAIL/);
});

test("the 91-shaped active-fix reproducer fails closed too", () => {
  const r = run(["--root", FIXTURES]);
  assert.match(r.stdout, /^Roadmap-settle: .*91-settle-fix-open\/SPEC\.md:5 pr-url-unsettled/m);
});

test("the settled control, the no-PR unit and the cross-reference pass — and the codes are the closed set", () => {
  const r = run(["--root", FIXTURES]);
  const failing = r.stdout.split("\n").filter((l) => /^Roadmap-settle: .+:\d+ /.test(l));
  assert.equal(failing.length, 2, failing.join("\n")); // the two reproducers only
  assert.match(r.stdout, /units? docs? checked/);
});

test("settling the rows turns the same fixture tree green", () => {
  const tmp = fs.mkdtempSync(path.join(fs.tmpdir?.() ?? "/tmp", "roadmap-settle-"));
  fs.cpSync(FIXTURES, tmp, { recursive: true });
  try {
    const table = path.join(tmp, "docs", "features", "ROADMAP.md");
    fs.writeFileSync(
      table,
      fs
        .readFileSync(table, "utf8")
        .replace("| 77 | `settle-repro` | in-progress |", "| 77 | `settle-repro` | done · [#309](https://github.com/gtrabanco/agentic-workflow/pull/309) |"),
      "utf8",
    );
    const fixIndex = path.join(tmp, "docs", "fix", "README.md");
    fs.writeFileSync(
      fixIndex,
      fs
        .readFileSync(fixIndex, "utf8")
        .replace("| [#91](https://github.com/gtrabanco/agentic-workflow/issues/91) | settle-fix-open | `in-progress` |", "| [#91](https://github.com/gtrabanco/agentic-workflow/issues/91) | settle-fix-open | `done` · [#303](https://github.com/gtrabanco/agentic-workflow/pull/303) |"),
      "utf8",
    );
    const r = run(["--root", tmp]);
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /verdict: PASS/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("the live tree is green — the suite keeps the real drift red, not the fixture's", () => {
  const r = run([]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /verdict: PASS/);
});

test("--json emits the envelope with the same codes", () => {
  const r = run(["--root", FIXTURES, "--json"]);
  assert.equal(r.status, 1);
  const envelope = JSON.parse(r.stdout);
  assert.equal(envelope.gate, "roadmap-settle");
  assert.equal(envelope.ok, false);
  for (const v of envelope.violations) {
    assert.ok(["row-missing", "slug-mismatch", "pr-url-unsettled"].includes(v.code), v.code);
  }
});

test("usage — an unreadable root fails closed with exit 2", () => {
  const r = run(["--root", path.join(FIXTURES, "no-such-dir")]);
  assert.equal(r.status, 2);
});
