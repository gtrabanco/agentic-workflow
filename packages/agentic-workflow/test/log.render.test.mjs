/**
 * log.render.test.mjs — the frozen `log-facts@1` payload and the entry it
 * renders (feature #394, S2/S5/S8).
 *
 * The renderer is the ONE owner of the journal entry's bytes: the pi extension,
 * the CLI and the parity test against `template/.claude/hooks/log-session-end.sh`
 * all read this module. So the contract this suite pins is deliberately narrow —
 * five keys, four shapes, and a refusal for everything else:
 *
 *  - **The payload is frozen.** An unknown key is refused, not ignored: a caller
 *    that smuggles prompt text, model output or a diff into the facts has to
 *    change this file first, and that change is the review.
 *  - **The entry is bytes, not fields.** The three shapes below are copied from
 *    the hook's own printf calls, including the `(no marker)` suffix and the
 *    space-joined path list.
 *  - **Nothing here imports pi.** The module has no pi in its closure, which is
 *    what makes S2's "testable with zero pi involvement" true rather than
 *    asserted.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import {
  LOG_ENTRY_CONTRACT_ID,
  LOG_FACTS_CONTRACT_ID,
  LOG_FACTS_KEYS,
  LogFactsError,
  isRenderedEntry,
  normalizeFacts,
  renderEntry,
  renderReceipt,
} from "../src/log/render.mjs";

/** A complete, valid payload: the one every other case varies from. */
const FACTS = {
  timestamp: "2026-11-04T15:12Z",
  branch: "feat/394-auto-log-session",
  reason: "quit",
  commits: { count: 2, range: "1a2b3c4d…9e8f7a6b" },
  files: ["docs/LOGS.md", "packages/agentic-workflow/src/log/render.mjs"],
};

const copy = (patch = {}) => ({ ...FACTS, ...patch });

/* ── the frozen payload ────────────────────────────────────────────────── */

test("LOF-01 the frozen payload carries exactly these five keys", () => {
  assert.deepEqual([...LOG_FACTS_KEYS], ["timestamp", "branch", "reason", "commits", "files"]);
  assert.equal(LOG_FACTS_CONTRACT_ID, "log-facts@1");
  assert.equal(LOG_ENTRY_CONTRACT_ID, "log-entry@1");
  const result = normalizeFacts(FACTS);
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result.facts).sort(), [...LOG_FACTS_KEYS].sort());
  assert.deepEqual(Object.keys(result.facts.commits).sort(), ["count", "range"]);
});

test("LOF-02 an unknown key is refused — the payload is not a bag", () => {
  const result = normalizeFacts(copy({ summary: "I fixed things" }));
  assert.equal(result.ok, false);
  assert.match(result.reason, /unknown key "summary"/);
  // The refusal names what is allowed, so a caller can fix it without reading this file.
  assert.match(result.reason, /timestamp, branch, reason, commits, files/);
});

test("LOF-03 every field is validated, and the refusal names the field", () => {
  const cases = [
    [{ timestamp: "2026-11-04T15:12:00Z" }, /timestamp.*YYYY-MM-DDTHH:MMZ/u],
    [{ timestamp: "2026-11-04" }, /timestamp/u],
    [{ branch: "" }, /branch/u],
    [{ branch: "main\nsecond line" }, /branch/u],
    [{ reason: "" }, /reason/u],
    [{ reason: "Quit Now" }, /reason/u],
    [{ commits: { count: -1, range: null } }, /count/u],
    [{ commits: { count: 1.5, range: "1a2b3c4d…9e8f7a6b" } }, /count/u],
    [{ commits: undefined }, /commits/u],
    [{ commits: { count: 3, range: null } }, /range/u],
    [{ commits: { count: 1, range: "not-a-range" } }, /range/u],
    [{ commits: { count: 1, range: "1a2b3c4d…9e8f7a6b", extra: 1 } }, /unknown key "extra"/u],
    [{ files: "docs/LOGS.md" }, /files/u],
    [{ files: [""] }, /files/u],
    [{ files: ["a\nb"] }, /files/u],
    [{ files: [42] }, /files/u],
  ];
  for (const [patch, pattern] of cases) {
    const result = normalizeFacts(copy(patch));
    assert.equal(result.ok, false, `expected a refusal for ${JSON.stringify(patch)}`);
    assert.match(result.reason, pattern, `refusal for ${JSON.stringify(patch)} was: ${result.reason}`);
  }
});

test("LOF-04 a non-object payload is refused instead of coerced", () => {
  for (const value of [null, undefined, "log-facts@1", 42, [], [FACTS]]) {
    const result = normalizeFacts(value);
    assert.equal(result.ok, false);
    assert.match(result.reason, /object/u);
  }
});

/* ── the entry bytes (the hook's own shapes) ───────────────────────────── */

test("LOF-05 the entry is the hook's three lines, in the hook's punctuation", () => {
  const entry = renderEntry(FACTS);
  assert.equal(
    entry,
    "## 2026-11-04T15:12Z — feat/394-auto-log-session — auto (quit)\n" +
      "- **Commits:** 2 `1a2b3c4d…9e8f7a6b`\n" +
      "- **Files:** docs/LOGS.md packages/agentic-workflow/src/log/render.mjs\n",
  );
  assert.equal(isRenderedEntry(entry), true);
});

test("LOF-06 a session with no valid marker renders `(no marker)` and zero commits", () => {
  const entry = renderEntry(copy({ commits: { count: 0, range: null }, files: [] }));
  assert.equal(
    entry,
    "## 2026-11-04T15:12Z — feat/394-auto-log-session — auto (quit)\n" +
      "- **Commits:** 0 (no marker)\n" +
      "- **Files:** —\n",
  );
});

test("LOF-07 a zero-commit session with a marker still carries the range", () => {
  const entry = renderEntry(copy({ commits: { count: 0, range: "1a2b3c4d…1a2b3c4d" } }));
  assert.match(entry, /^- \*\*Commits:\*\* 0 `1a2b3c4d…1a2b3c4d`$/mu);
});

test("LOF-08 rendering is pure: the same payload renders the same bytes, and the payload is not mutated", () => {
  const frozen = JSON.stringify(FACTS);
  const a = renderEntry(FACTS);
  const b = renderEntry(JSON.parse(frozen));
  assert.equal(a, b);
  assert.equal(JSON.stringify(FACTS), frozen);
});

test("LOF-09 the entry carries no continuation line, so one append is one entry", () => {
  const entry = renderEntry(FACTS);
  assert.equal(entry.split("\n").filter((line) => line !== "").length, 3);
  assert.equal(entry.endsWith("\n"), true);
  assert.equal(entry.includes("\n\n"), false);
});

/* ── the CLI receipt ───────────────────────────────────────────────────── */

test("LOF-10 the receipt is JSON-shaped and carries the bytes and their length", () => {
  const receipt = renderReceipt(FACTS);
  assert.equal(receipt.contract, LOG_ENTRY_CONTRACT_ID);
  assert.equal(receipt.facts, LOG_FACTS_CONTRACT_ID);
  assert.equal(receipt.entry, renderEntry(FACTS));
  assert.equal(receipt.bytes, Buffer.byteLength(receipt.entry, "utf8"));
  // Round-trips through JSON exactly: the point of a byte-diffable receipt.
  assert.deepEqual(JSON.parse(JSON.stringify(receipt)).entry, receipt.entry);
});

test("LOF-11 a refused payload throws a named error, never a bare string", () => {
  assert.throws(() => renderEntry(copy({ reason: "" })), LogFactsError);
  assert.throws(() => renderEntry(copy({ reason: "" })), /reason/u);
  const receipt = renderReceipt(copy({ reason: "" }));
  assert.equal(receipt.ok, false);
  assert.match(receipt.error, /reason/u);
});

/* ── the CLI: the same bytes without a session (S2) ────────────────────── */

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;

/** Run the CLI with `args`, feeding `stdin` when given. */
function cli(args, stdin) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", input: stdin });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

test("LOF-12 `log render` prints the JSON receipt and exits 0", () => {
  const run = cli(["log", "render", "--facts", "-"], JSON.stringify(FACTS));
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.contract, LOG_ENTRY_CONTRACT_ID);
  assert.equal(receipt.entry, renderEntry(FACTS));
  assert.equal(receipt.bytes, Buffer.byteLength(renderEntry(FACTS)));
  assert.equal(run.stderr, "");
});

test("LOF-13 `--raw` prints the entry alone, so `diff` needs no JSON parsing", () => {
  const run = cli(["log", "render", "--facts", "-", "--raw"], JSON.stringify(FACTS));
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, renderEntry(FACTS));
});

test("LOF-14 the same payload renders the same bytes on every run", () => {
  const first = cli(["log", "render", "--facts", "-", "--raw"], JSON.stringify(FACTS));
  const second = cli(["log", "render", "--facts", "-", "--raw"], JSON.stringify(FACTS));
  assert.equal(first.stdout, second.stdout);
});

test("LOF-15 a malformed payload is refused with exit 2 and the JSON on stdout", () => {
  const empty = cli(["log", "render", "--facts", "/dev/null"]);
  assert.equal(empty.status, 2);
  assert.match(empty.stderr, /^LOG REFUSAL — the facts payload is not JSON/u);
  const bad = cli(["log", "render", "--facts", "-"], JSON.stringify({ ...FACTS, summary: "smuggled" }));
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /unknown key "summary"/u);
  assert.equal(JSON.parse(bad.stdout).ok, false);
});

test("LOF-16 a missing flag, an unknown operation and an unreadable file are refusals, never silence", () => {
  for (const args of [["log", "render"], ["log", "publish"], ["log"], ["log", "render", "--facts", "/nonexistent/facts.json"]]) {
    const run = cli(args);
    assert.equal(run.status, 2, `${args.join(" ")} should refuse`);
    assert.match(run.stderr, /^LOG REFUSAL — /u);
    assert.equal(run.stdout, "");
  }
});

/* ── the type projection cannot drift from the module ──────────────────── */

test("LOF-17 each type projection declares exactly its module's exports", async () => {
  for (const name of ["render", "publish"]) {
    const module = await import(`../src/log/${name}.mjs`);
    const source = readFileSync(new URL(`../src/log/${name}.d.mts`, import.meta.url), "utf8");
    const declared = [...source.matchAll(/export declare (?:const|function|class) (\w+)/gu)].map((match) => match[1]);
    const runtime = Object.keys(module).filter((key) => key !== "default");
    assert.deepEqual(declared.sort(), runtime.sort(), `${name}.d.mts and ${name}.mjs export different names`);
  }
});
