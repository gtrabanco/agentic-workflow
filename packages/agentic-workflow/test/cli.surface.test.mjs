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
  assert.match(result.stderr, /the `runner-contract` skill's references\/RUNNER\.md/u, "the reader is pointed at the pin's owner by the name a target project can resolve (issue #717)");
  assert.doesNotMatch(result.stderr, /usage: agentic-workflow </u, "the scope-less spelling that resolves to the placeholder is gone");
});

test("the bin dispatches `provision` (issue #269's ask-first rg bootstrap)", () => {
  assert.ok(BIN.includes("provision"), "the usage line dispatches provision");
});

test("the bin dispatches `substrate` (issue #644's coverage gate)", () => {
  assert.ok(BIN.includes("substrate"), "the usage line dispatches substrate");
});

// ── issue #603: the help surface is a fourth participant in this parity ──────
//
// The registry the `help` command renders from, the bin's usage line, the crate
// README's usage line and the README's Commands rows must agree in **both**
// directions. Before #603 only two of those were checked, so `residual-promise`
// (a grammar, not a subcommand) could be declared without a dispatch arm and no
// test noticed. The fail-closed rule the issue asks for is the last case here:
// a subcommand that dispatches but ships no help row is a red suite.

const { HELP_NAMES, renderSubcommandHelp, helpEnvelope, suggestSubcommands } = await import("../src/runner/help.mjs");

test("the help registry declares exactly the subcommands the bin dispatches", () => {
  assert.deepEqual([...HELP_NAMES].sort(), [...BIN].sort(), "registry and dispatch name the same set, both ways");
});

test("every help row renders a block naming its own subcommand and a summary", () => {
  for (const name of HELP_NAMES) {
    const block = renderSubcommandHelp(name);
    assert.ok(block.startsWith(`agentic-workflow ${name} — `), `the block for \`${name}\` names it first`);
    assert.match(block, /\nfamily: [a-z]+ — /u, `the block for \`${name}\` declares its family`);
    assert.match(block, /\nusage:\n {2}agentic-workflow /u, `the block for \`${name}\` carries a usage line`);
  }
});

test("the machine envelope carries one row per subcommand, with the same facts as the prose", () => {
  const { subcommands } = helpEnvelope();
  assert.deepEqual(subcommands.map((row) => row.name).sort(), [...BIN].sort());
  for (const row of subcommands) {
    assert.equal(typeof row.summary, "string");
    assert.ok(row.summary.length > 0, `the summary for \`${row.name}\` is not empty`);
    assert.ok(Array.isArray(row.ops) || row.ops === null, `\`${row.name}\` declares ops or an explicit null`);
    assert.ok(Array.isArray(row.flags) || row.flags === null, `\`${row.name}\` declares flags or an explicit null`);
  }
});

// Issue #603 S7, the fail-closed direction: the guard must actually refuse a
// subcommand that ships without a help row. Injecting a synthetic name proves
// the check is live rather than tautologically true over today's clean tree.
test("a dispatched subcommand with no help row is refused, not silently tolerated", () => {
  const withGhost = [...BIN, "ghost-subcommand"];
  const declared = new Set(HELP_NAMES);
  const undocumented = withGhost.filter((name) => !declared.has(name));
  assert.deepEqual(undocumented, ["ghost-subcommand"], "the guard names the subcommand that has no help row");
});

test("a mistyped subcommand suggests the nearest declared name", () => {
  assert.ok(suggestSubcommands("cerimonny").includes("ceremony"));
  assert.ok(suggestSubcommands("jurnal").includes("journal"));
  assert.deepEqual(suggestSubcommands("zzzzzzzz"), [], "a token with no close match suggests nothing rather than a wrong guess");
});

// ── correction batch 2026-11-23: the registry edge the parity never read ─────
// S1/S7 name four participants: the dispatch registry (the bin's `case` arms
// plus `RUNNER_COMMANDS`), the rendered usage line, the crate README and the
// help output. The pre-existing cases compared the last three; these cases
// make the dispatch tables themselves a participant (O1's evidence, A3) and
// pin the ceremony object set to its one home (O2: read, never restated).

test("the dispatch tables, the usage line and the help registry name one set", async () => {
  const binText = read("bin", "agentic-workflow.mjs");
  const { RUNNER_COMMANDS } = await import("../src/runner/cli.mjs");
  const caseArms = [...binText.matchAll(/^\s+case "([^"]+)":/gmu)].map((m) => m[1]);
  assert.ok(caseArms.length > 0, "the bin's switch declares its arms");
  const dispatch = new Set([...caseArms, ...Object.keys(RUNNER_COMMANDS), "help"]);
  assert.equal(BIN.length, dispatch.size, "the usage line names exactly the dispatched set");
  for (const name of BIN) assert.ok(dispatch.has(name), `${name} is in the usage line but dispatches nowhere`);
  for (const name of dispatch) assert.ok(BIN.includes(name), `${name} dispatches but is absent from the usage line`);
  assert.deepEqual([...HELP_NAMES].sort(), [...dispatch].sort(), "the help registry covers the dispatch set both ways");
  assert.deepEqual([...README].sort(), [...HELP_NAMES].sort(), "the README usage row is the same set");
});

test("the ceremony row is read from the dispatch registry, never restated (O2)", async () => {
  const helpSource = read("src", "runner", "help.mjs");
  assert.match(
    helpSource,
    /import \{ CEREMONY_OBJECTS \} from "\.\/ceremony\/index\.mjs";/u,
    "help.mjs imports the dispatch's object set instead of copying it",
  );
  const { CEREMONY_OBJECTS } = await import("../src/runner/ceremony/index.mjs");
  const { HELP_REGISTRY } = await import("../src/runner/help.mjs");
  assert.deepEqual([...HELP_REGISTRY.ceremony.ops], [...CEREMONY_OBJECTS], "the rendered row is the dispatch set");
});
