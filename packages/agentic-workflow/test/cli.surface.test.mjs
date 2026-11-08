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
import { fileURLToPath } from "node:url";

const read = (...parts) => readFileSync(fileURLToPath(new URL(`../${parts.join("/")}`, import.meta.url)), "utf8");

/** The subcommands inside the one `usage: agentic-workflow <a|b|…>` line. */
function usageTokens(text, label) {
  const match = text.match(/usage: agentic-workflow <([^>]+)>/u);
  assert.ok(match, `${label} declares its usage line`);
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
