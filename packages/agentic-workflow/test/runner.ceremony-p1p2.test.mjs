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
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const REPO = fileURLToPath(new URL("../../..", import.meta.url));

// The ceremony spawns its own `git commit` / `git revert`, which inherits the
// ambient environment — and CI carries no git identity, so `commit create`
// fails with "Author identity unknown" instead of the behavior under test. The
// fixture injects one through the config-count channel (which reaches every
// git the ceremony spawns, unlike the helper's per-call `-c` flags) and turns
// gpgsign off — the same neutralization the root suite applies
// (scripts/run-root-suite.mjs): a suite commits nothing real.
const GIT_CONFIG_INDEX = Number(process.env.GIT_CONFIG_COUNT ?? 0);
const GIT_ENV = {
  GIT_CONFIG_COUNT: String(GIT_CONFIG_INDEX + 3),
  [`GIT_CONFIG_KEY_${GIT_CONFIG_INDEX}`]: "user.name",
  [`GIT_CONFIG_VALUE_${GIT_CONFIG_INDEX}`]: "Fixture",
  [`GIT_CONFIG_KEY_${GIT_CONFIG_INDEX + 1}`]: "user.email",
  [`GIT_CONFIG_VALUE_${GIT_CONFIG_INDEX + 1}`]: "fixture@example.invalid",
  [`GIT_CONFIG_KEY_${GIT_CONFIG_INDEX + 2}`]: "commit.gpgsign",
  [`GIT_CONFIG_VALUE_${GIT_CONFIG_INDEX + 2}`]: "false",
};

/** A throwaway project carrying one fix unit. */
function makeRepo(t) {
  const root = mkdtempSync(join(tmpdir(), "ceremony-p1p2-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text);
  };
  write("docs/ROADMAP.md", [
    "# Roadmap",
    "",
    "## Features",
    "",
    "| # | Slug | Status | Depends on | Summary |",
    "| --- | --- | --- | --- | --- |",
    "| 91 | `toy` | in-progress | — | a toy feature |",
    "",
    "## Fixes",
    "",
    "| # | Slug | Status | Depends on | Summary |",
    "| --- | --- | --- | --- | --- |",
    "| 77 | `toy` | in-progress | — | a toy fix |",
    "",
  ].join("\n"));
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
  const GIT_ID = ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false"];
  const git = (...args) => execFileSync("git", [...GIT_ID, ...args], { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
    git("add", "-A");
  git("commit", "-qm", "fix(77): open the toy unit");
  return { root, write, git };
}

/** Run one ceremony operation in `root`; returns { code, json, stdout, stderr }. */
function ceremony(root, ...args) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, "ceremony", ...args], { cwd: root, encoding: "utf8", env: { ...process.env, ...GIT_ENV } });
    return { code: 0, stdout, json: safe(stdout), stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", json: safe(error.stdout ?? ""), stderr: error.stderr ?? "" };
  }
}

const safe = (text) => { try { return JSON.parse(text); } catch { return null; } };

/** Run one ceremony operation with a patched environment (the degradation cases). */
function ceremonyWith(root, env, ...args) {
  try {
    const stdout = execFileSync(process.execPath, [BIN, "ceremony", ...args], { cwd: root, encoding: "utf8", env: { ...process.env, ...GIT_ENV, ...env } });
    return { code: 0, stdout, json: safe(stdout), stderr: "" };
  } catch (error) {
    return { code: error.status ?? 1, stdout: error.stdout ?? "", json: safe(error.stdout ?? ""), stderr: error.stderr ?? "" };
  }
}

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

test("the registry answers the whole map, and a name outside it is still refused", (t) => {
  const { root } = makeRepo(t);
  const usage = ceremony(root);
  const objects = usage.json.objects;
  assert.deepEqual(
    objects,
    ["workspace", "docs", "findings", "ledger", "unit", "plan", "tier", "passive", "progress", "evidence", "acceptance", "delta", "refutation", "fusion", "review", "commit", "roadmap", "pr"],
    "every object fix/338 declared answers from the crate",
  );
  const unknown = ceremony(root, "teleport", "now");
  assert.equal(unknown.code, 1);
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

// ── the four modules that close the map (issue #352 P4) ────────────────────

test("review: create records the cycle and head, append-axis adds rows, set-verdict decides, read reports", (t) => {
  const { root, write } = makeRepo(t);
  write("docs/fix/77-toy/SPEC.md", [
    "# fix/77-toy",
    "",
    "## Findings",
    "",
    "| id | S# / file:line | axis | severity | impact | class | route |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    "",
    "## Log",
    "",
  ].join("\n"));

  const created = ceremony(root, "review", "create", "--slug", "77-toy", "--head", "abc1234def");
  assert.equal(created.code, 0, created.stdout + created.stderr);
  assert.equal(created.json.cycle, 1);

  const axis = ceremony(root, "review", "append-axis", "--slug", "77-toy", "--axis", "code", "--findings", JSON.stringify([
    { target: "src/a.mjs:3", finding: "unchecked return", severity: "WARNING", evidence: "the call ignores the value" },
  ]));
  assert.equal(axis.code, 0, axis.stdout + axis.stderr);
  assert.equal(axis.json["first-id"], "F1");

  const read = ceremony(root, "review", "read", "--slug", "77-toy");
  assert.equal(read.json.state, "open", "a review with no verdict is open");
  assert.equal(read.json["head-sha"], "abc1234def");
  assert.equal(read.json.findings.length, 1);

  const decided = ceremony(root, "review", "set-verdict", "--slug", "77-toy", "--verdict", "PASS");
  assert.equal(decided.code, 0, decided.stdout + decided.stderr);
  assert.equal(ceremony(root, "review", "read", "--slug", "77-toy").json.verdict, "PASS");

  const summary = ceremony(root, "review", "read-summary", "--slug", "77-toy");
  assert.equal(summary.json.verdict, "PASS");
  assert.equal(summary.json["finding-count"], 1);
});

test("commit: verify-format judges the subject, create refuses a bad one, list answers the unit's history", (t) => {
  const { root, write, git } = makeRepo(t);
  write("src/one.mjs", "export const a = 1;\n");

  const good = ceremony(root, "commit", "verify-format", "feat(77): add one");
  assert.equal(good.json.valid, true);
  assert.equal(good.json.type, "feat");
  assert.equal(good.json.scope, "77");

  const bad = ceremony(root, "commit", "verify-format", "added a thing");
  assert.equal(bad.code, 1, "a non-conventional subject is the usage class");
  assert.equal(bad.json.valid, false);

  const refused = ceremony(root, "commit", "create", "--slug", "77-toy", "--message", "oops", "--files", "src/one.mjs");
  assert.equal(refused.code, 2, "create blocks on a subject the rule would reject");

  const created = ceremony(root, "commit", "create", "--slug", "77-toy", "--message", "feat(77): add one", "--files", "src/one.mjs");
  assert.equal(created.code, 0, created.stdout + created.stderr);
  assert.equal(created.json["message-verified"], true);

  const listed = ceremony(root, "commit", "list", "--slug", "77-toy");
  assert.ok(listed.json.commits.length >= 1);
  assert.equal(git("log", "-1", "--format=%s"), "feat(77): add one");
});

test("roadmap: read answers both tables, list groups by status, row-upsert answers the writer", (t) => {
  const { root, write } = makeRepo(t);
  write("docs/features/91-toy/SPEC.md", "# feature/91-toy\n\n## Log\n\n");
  const read = ceremony(root, "roadmap", "read");
  assert.equal(read.code, 0, read.stdout + read.stderr);
  assert.ok(Array.isArray(read.json.features) && Array.isArray(read.json.fixes));

  const list = ceremony(root, "roadmap", "list");
  assert.ok(list.json["by-status"], "the answer groups the work list by status");

  const upsert = ceremony(root, "roadmap", "row-upsert", "--slug", "91-toy", "--status", "planned", "--summary", "the toy row");
  assert.ok(upsert.code === 0 || upsert.code === 1, "row-upsert answers a receipt or a refusal, never a stack trace");
});

test("pr: the degradation contract — a missing gh and an unauthenticated gh are blocks, never stack traces", (t) => {
  const { root } = makeRepo(t);
  const bin = process.execPath;
  // A PATH with no gh at all: the binary is missing, not failing. The runner is
  // spawned by absolute path, so only `gh` needs to be out of reach.
  const withoutGh = (process.env.PATH ?? "")
    .split(":")
    .filter((dir) => dir !== "" && !existsSync(join(dir, "gh")))
    .join(":");
  const bare = ceremonyWith(root, { PATH: withoutGh }, "pr", "read-diff", "1");
  assert.equal(bare.code, 2, "a missing gh is the ceremonial block");
  assert.equal(bare.json.degraded, "gh-missing");

  // A gh that answers "not logged in": the degradation names authentication.
  const shims = mkdtempSync(join(tmpdir(), "gh-shim-"));
  t.after(() => rmSync(shims, { recursive: true, force: true }));
  writeFileSync(join(shims, "gh"), "#!/bin/sh\necho 'gh: not logged in to any GitHub hosts' >&2\nexit 1\n");
  chmodSync(join(shims, "gh"), 0o755);
  const unauthenticated = ceremonyWith(root, { PATH: `${shims}:${withoutGh}` }, "pr", "read-diff", "1");
  assert.equal(unauthenticated.code, 2);
  assert.equal(unauthenticated.json.degraded, "gh-unauthenticated");

  // A gh that fails for any other reason is the usage class, naming the subcommand.
  writeFileSync(join(shims, "gh"), "#!/bin/sh\necho 'boom' >&2\nexit 4\n");
  const broken = ceremonyWith(root, { PATH: `${shims}:${withoutGh}` }, "pr", "read-diff", "1");
  assert.equal(broken.code, 1);
  assert.equal(broken.json.error, "gh-error");
});
