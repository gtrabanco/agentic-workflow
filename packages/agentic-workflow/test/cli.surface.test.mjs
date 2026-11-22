/**
 * cli.surface.test.mjs — issue #260 (external-verify repair): the crate README
 * is the command surface's owner, so its usage line must restate the bin's
 * subcommand list token-for-token and every dispatched subcommand needs a
 * Commands row. Written red-first: `verify|resources` reached the bin before
 * the README, the drift no test caught.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const read = (...parts) => readFileSync(fileURLToPath(new URL(`../${parts.join("/")}`, import.meta.url)), "utf8");

/** The subcommands inside the one scoped, pinned usage line. */
function usageTokens(text, label) {
  const match = text.match(/usage: bunx @gtrabanco\/agentic-workflow@<pin> <([^>]+)>/u);
  assert.ok(match, `${label} declares its scoped usage line`);
  return match[1].split("|");
}

const BIN = usageTokens(read("bin", "agentic-workflow.mjs"), "the bin");
const README = usageTokens(read("README.md"), "the crate README");

test("the crate README's usage line is the bin's, token for token", () => {
  assert.deepEqual(README, BIN, "the README restates the dispatched subcommand list exactly");
});

test("every dispatched subcommand has a Commands row in the crate README", () => {
  const rows = read("README.md")
    .split("\n")
    .filter((line) => line.startsWith("| `"))
    .map((line) => line.split("|")[1].trim().replace(/^`/u, "").split(/[ `]/u)[0]);
  const documented = new Set(rows);
  for (const token of BIN) {
    assert.ok(documented.has(token), `the Commands table documents \`${token}\``);
  }
});

test("the no-command run names the scoped package at its pin, never the scope-less npm name", () => {
  const bin = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
  const result = spawnSync(process.execPath, [bin], { encoding: "utf8" });
  assert.equal(result.status, 1, "no subcommand is a usage error");
  assert.match(result.stderr, /^usage: bunx @gtrabanco\/agentic-workflow@<pin> </mu, "the scoped package and its pin source are named");
  assert.match(result.stderr, /skills\/runner-contract\/references\/RUNNER\.md/u, "the reader is pointed at the pin's owner");
  assert.doesNotMatch(result.stderr, /usage: agentic-workflow </u, "the scope-less spelling that resolves to the placeholder is gone");
});

test("the bin dispatches `provision` (issue #269's ask-first rg bootstrap)", () => {
  assert.ok(BIN.includes("provision"), "the usage line dispatches provision");
});

test("the bin dispatches `substrate` (issue #644's coverage gate)", () => {
  assert.ok(BIN.includes("substrate"), "the usage line dispatches substrate");
});
