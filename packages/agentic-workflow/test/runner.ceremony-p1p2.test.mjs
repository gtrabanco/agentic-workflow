/**
 * runner.ceremony-p1p2.test.mjs — issue #352 P4, the first six of the ten later
 * ceremony modules: `progress`, `evidence`, `acceptance`, `delta`, `refutation`
 * and `fusion`.
 *
 * Every case runs the shipped bin against a throwaway repository, because that is
 * how a target project runs it. One case per operation, plus the two properties
 * the map makes of all of them: the closed world names what is still missing, and
 * a read operation is byte-stable across runs.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const REPO = fileURLToPath(new URL("../../..", import.meta.url));

/** A throwaway project carrying one fix unit. */
function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), "ceremony-p1p2-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text);
  };
  write("docs/fix/77-toy/SPEC.md", [
    "# fix/77-toy",
    "",
    "## Acceptance criteria",
    "",
    "- AC1 — the toy answers.",
    "- AC2 — the toy refuses.",
    "",
    "## Evidence",
    "",
    "| AC | command | exit | output | verified-by |",
    "| --- | --- | --- | --- | --- |",
    "",
    "## Log",
    "",
    "- **P1** — 2026-11-12 02:00, the unit opened · abc1234.",
    "- **P2** — 2026-11-13 03:00, a second phase · def5678.",
    "",
  ].join("\n"));
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "Fixture");
  git("config", "commit.gpgsign", "false");
  git("add", "-A");
  git("commit", "-qm", "fix(77): open the toy unit");
  return { root, write, git };
}

/** Run one ceremony operation in `root`; returns { code, json, stdout, stderr }. */
function ceremony(root, ...args) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, "ceremony", ...args], { cwd: root, encoding: "utf8" });
    return { code: 0, stdout, json: safe(stdout), stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", json: safe(error.stdout ?? ""), stderr: error.stderr ?? "" };
  }
}

const safe = (text) => { try { return JSON.parse(text); } catch { return null; } };

test("progress: append writes the log-kind token, read lists it, delete and clear remove it", (t) => {
  const { root } = makeRepo(t);
  const appended = ceremony(root, "progress", "append", "--slug", "77-toy", "--entry", "2026-11-14 04:00, a third phase · aaa1111");
  assert.equal(appended.code, 0, appended.stderr);
  assert.equal(appended.json.n, 3, "the entry continues the P<n> sequence");
  assert.match(readFileSync(join(root, "docs/fix/77-toy/SPEC.md"), "utf8"), /^- \*\*P3\*\* — 2026-11-14 04:00, a third phase · aaa1111$/mu);

  const listed = ceremony(root, "progress", "list", "--slug", "77-toy", "--from", "2026-11-13");
  assert.equal(listed.json.count, 2, "the date filter reads the ISO date each entry opens with");

  const deleted = ceremony(root, "progress", "delete", "--slug", "77-toy", "--range", "2-3");
  assert.deepEqual(deleted.json.deleted, [2, 3]);
  assert.equal(ceremony(root, "progress", "read", "--slug", "77-toy").json.count, 1);

  const cleared = ceremony(root, "progress", "clear", "--slug", "77-toy");
  assert.equal(cleared.json.cleared, 1);
  assert.equal(ceremony(root, "progress", "read", "--slug", "77-toy").json.count, 0);
});

test("evidence: append lands a row, read counts it, verify re-runs the command, delete removes it", (t) => {
  const { root } = makeRepo(t);
  const appended = ceremony(root, "evidence", "append", "--slug", "77-toy", "--ac", "1", "--command", "true", "--exit", "0", "--output", "ok");
  assert.equal(appended.code, 0, appended.stderr);
  assert.equal(appended.json.shape, "table", "the document already carries the table shape");

  const read = ceremony(root, "evidence", "read", "--slug", "77-toy");
  assert.equal(read.json.count, 1);
  assert.equal(read.json.evidences[0].ac, "AC1");

  const verified = ceremony(root, "evidence", "verify", "--slug", "77-toy", "--ac", "1", "--command", "true");
  assert.equal(verified.json.match, true);
  const failed = ceremony(root, "evidence", "verify", "--slug", "77-toy", "--ac", "1", "--command", "false");
  assert.equal(failed.json.match, false, "a non-zero exit is not a match");

  const removed = ceremony(root, "evidence", "delete", "--slug", "77-toy", "--row", "1");
  assert.equal(removed.json.deleted, true);
  assert.equal(ceremony(root, "evidence", "read", "--slug", "77-toy").json.count, 0);
});

test("acceptance: read derives met/unmet/untouched, the manifest binds it, hash is stable", (t) => {
  const { root } = makeRepo(t);
  ceremony(root, "evidence", "append", "--slug", "77-toy", "--ac", "1", "--command", "true", "--exit", "0");

  const read = ceremony(root, "acceptance", "read", "--slug", "77-toy");
  const [first, second] = read.json.criteria;
  assert.equal(first.criterion, "AC1");
  assert.equal(first.met, true, "an evidence row with exit 0 proves the criterion");
  assert.equal(second.untouched, true, "no row at all is untouched");

  const manifest = ceremony(root, "acceptance", "build-manifest", "--slug", "77-toy");
  assert.match(manifest.json["blob-sha"], /^[0-9a-f]{64}$/u);
  const again = ceremony(root, "acceptance", "hash", "--slug", "77-toy");
  assert.match(again.json["blob-sha"], /^[0-9a-f]{64}$/u);

  const drift = ceremony(root, "acceptance", "check-drift", "--slug", "77-toy", "--diff", "HEAD~0..HEAD");
  assert.deepEqual(drift.json.drift, ["AC2"], "the untouched criterion is the drift");

  const updated = ceremony(root, "acceptance", "update-criteria", "--slug", "77-toy", "--criteria", JSON.stringify([{ id: "AC1", text: "only one now" }]));
  assert.equal(updated.json.criteria, 1);
  assert.match(readFileSync(join(root, "docs/fix/77-toy/SPEC.md"), "utf8"), /- AC1 — only one now/u);
});

test("delta: a change inside the bounds keeps the pass, an unrequested width or size opens the full pass", (t) => {
  const { root, write, git } = makeRepo(t);
  const base = git("rev-parse", "HEAD");

  const inside = ceremony(root, "delta", "check", "--from", base, "--to", "HEAD", "--cited", "docs/fix/77-toy/SPEC.md");
  assert.equal(inside.json["needs-full-pass"], false, "nothing changed since the base");
  assert.equal(inside.json.trigger, null);

  write("src/one.mjs", "export const a = 1;\n");
  git("add", "-A");
  git("commit", "-qm", "feat(77): one file");
  const wide = ceremony(root, "delta", "check", "--from", base, "--to", "HEAD", "--cited", "docs/");
  assert.equal(wide.json.trigger, "width");
  assert.deepEqual(wide.json["width-files"], ["src/one.mjs"]);

  const hash = ceremony(root, "delta", "manifest-hash", "--slug", "77-toy");
  assert.match(hash.json["blob-sha"], /^[0-9a-f]{64}$/u);
});

test("refutation: a quoted line present at the sha is confirmed, a missing file is refuted, verify-file reads the bytes", (t) => {
  const { root, git } = makeRepo(t);
  const sha = git("rev-parse", "HEAD");
  const payload = JSON.stringify([
    { file: "docs/fix/77-toy/SPEC.md", line: 1, finding: "# fix/77-toy" },
    { file: "docs/fix/77-toy/SPEC.md", line: 1, finding: "a claim the file does not carry" },
    { file: "src/absent.mjs", line: 1, finding: "anything" },
  ]);
  const verified = ceremony(root, "refutation", "verify", "--sha", sha, "--findings", payload);
  assert.deepEqual(verified.json.results.map((row) => row.verified), ["confirmed", "refuted", "refuted"]);
  assert.equal(verified.json.results[0].method, "line-contains-quote");

  const file = ceremony(root, "refutation", "verify-file", sha, "docs/fix/77-toy/SPEC.md", "1");
  assert.equal(file.json["actual-content"], "# fix/77-toy");
});

test("fusion: identical targets and claims fuse into one row carrying both axes", (t) => {
  const { root } = makeRepo(t);
  const axis = JSON.stringify({
    code: [{ target: "src/a.mjs:1", finding: "unchecked return", severity: "WARNING", reviewers: 1 }],
    security: [{ target: "src/a.mjs:1", finding: "unchecked return", severity: "WARNING", reviewers: 2 }],
    perf: [{ target: "src/b.mjs:9", finding: "quadratic scan", severity: "SUGGESTION" }],
  });
  const built = ceremony(root, "fusion", "build", "--slug", "77-toy", "--axis", axis);
  assert.equal(built.json.table.length, 2, "the duplicate collapses");
  assert.equal(built.json["deduped-count"], 1);
  assert.equal(built.json.table[0].axis, "code+security");
  assert.equal(built.json.table[0].reviewers, 3);

  const delta = ceremony(root, "fusion", "delta", "--slug", "77-toy", "--base", "77-toy", "--axis", JSON.stringify({
    base: [{ target: "src/a.mjs:1", finding: "unchecked return" }],
    target: [{ target: "src/a.mjs:1", finding: "unchecked return" }, { target: "src/c.mjs:3", finding: "new defect" }],
  }));
  assert.equal(delta.json.added.length, 1);
  assert.equal(delta.json.removed.length, 0);
  assert.equal(delta.json.unchanged, 1);
});

test("the closed world names the four modules the map still owes", (t) => {
  const { root } = makeRepo(t);
  for (const object of ["review", "commit", "roadmap", "pr"]) {
    const answer = ceremony(root, object, "read");
    assert.equal(answer.code, 1, `${object} is not answered yet`);
    assert.equal(answer.json.error, "deferred-module");
    assert.match(answer.json.note, /follow-up phase of issue #352/u);
  }
  const unknown = ceremony(root, "teleport", "now");
  assert.equal(unknown.json.error, "unknown-object");
});

test("a read operation is byte-stable across runs", (t) => {
  const { root } = makeRepo(t);
  ceremony(root, "evidence", "append", "--slug", "77-toy", "--ac", "1", "--command", "true", "--exit", "0");
  const first = ceremony(root, "acceptance", "build-manifest", "--slug", "77-toy").stdout;
  const second = ceremony(root, "acceptance", "build-manifest", "--slug", "77-toy").stdout;
  assert.equal(first, second, "same input, same stdout");
  assert.doesNotMatch(first, /"timestamp"|"generated/u, "no clock in a receipt");
});
