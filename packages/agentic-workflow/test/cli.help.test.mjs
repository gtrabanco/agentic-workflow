/**
 * cli.help.test.mjs — issue #603: the CLI teaches its own grammar.
 *
 * The universal CLI is the product's deterministic backbone, but its usage
 * grammar lived in exactly one human-facing place — the crate README — and a
 * mistyped command answered a bare refusal that named no legal candidate. This
 * suite is the surface's own contract: `help` answers for every dispatched
 * subcommand, `--help`/`-h` answer the same bytes, a closed registry's failure
 * names its candidates, and no path prints a stack.
 *
 * Written red-first: every case below failed on the tree that carried issue
 * #603's request, where `agentic-workflow help` was itself an unknown service.
 *
 * Obligation tag — surface: the crate's CLI dispatch (`bin/agentic-workflow.mjs`
 * and `src/runner/`); obligations: `cli-help-parity` (every dispatched
 * subcommand answers `help`), `cli-failure-candidates` (a closed registry's
 * failure lists its legal candidates and one `help` pointer), `cli-no-stack` (a
 * mistyped invocation never prints a stack frame).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = (...parts) => fileURLToPath(new URL(`../${parts.join("/")}`, import.meta.url));
const BIN = here("bin", "agentic-workflow.mjs");

/** Run the bin; both streams captured so a case can assert on either. */
function run(...args) {
  return spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
}

/** The subcommand list the crate README's scoped usage line declares. */
function usageTokens() {
  const text = readFileSync(here("README.md"), "utf8");
  const match = text.match(/usage: bunx @gtrabanco\/agentic-workflow@<pin> <([^>]+)>/u);
  assert.ok(match, "the crate README declares its scoped usage line");
  return match[1].split("|");
}

const SUBCOMMANDS = usageTokens();

test("`help` answers, exits 0, and names every dispatched subcommand", () => {
  const result = run("help");
  assert.equal(result.status, 0, "help is not a failure");
  assert.match(result.stderr, /^(?!.*\bat .+:\d+:\d+)/u, "help never prints a stack");
  for (const name of SUBCOMMANDS) {
    assert.ok(
      result.stdout.includes(name),
      `\`help\` lists the dispatched subcommand \`${name}\``,
    );
  }
});

test("`help <sub>` answers for every dispatched subcommand", async () => {
  const { renderSubcommandHelp } = await import("../src/runner/help.mjs");
  for (const name of SUBCOMMANDS) {
    const block = renderSubcommandHelp(name);
    assert.ok(block.length > 0, `the registry renders a block for \`${name}\``);
    assert.match(block, new RegExp(`agentic-workflow ${name.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}`, "u"), `the block for \`${name}\` names the subcommand`);
  }
  // The registry renders every block; two real spawns prove the bin actually
  // serves that block (one editor-service arm, one runner-table arm) without
  // paying 73 process launches inside a single test's budget.
  for (const name of ["ceremony", "journal"]) {
    const result = run("help", name);
    assert.equal(result.status, 0, `\`help ${name}\` exits 0`);
    assert.equal(result.stdout, renderSubcommandHelp(name), `\`help ${name}\` serves the registry's own block`);
  }
});

test("`--help` and `-h` print the same block `help <sub>` prints", () => {
  for (const name of ["ceremony", "journal", "config"]) {
    const viaHelp = run("help", name);
    const viaLong = run(name, "--help");
    const viaShort = run(name, "-h");
    assert.equal(viaLong.status, 0, `\`${name} --help\` exits 0`);
    assert.equal(viaShort.status, 0, `\`${name} -h\` exits 0`);
    assert.equal(viaLong.stdout, viaHelp.stdout, `\`${name} --help\` is byte-identical to \`help ${name}\``);
    assert.equal(viaShort.stdout, viaHelp.stdout, `\`${name} -h\` is byte-identical to \`help ${name}\``);
  }
});

test("`help --json` answers a machine envelope with one row per subcommand", () => {
  const result = run("help", "--json");
  assert.equal(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.ok(Array.isArray(parsed.subcommands), "the envelope carries a subcommands array");
  const named = new Set(parsed.subcommands.map((row) => row.name));
  for (const name of SUBCOMMANDS) {
    assert.ok(named.has(name), `the envelope carries a row for \`${name}\``);
  }
  for (const row of parsed.subcommands) {
    assert.equal(typeof row.summary, "string", `the row for \`${row.name}\` carries a summary`);
    assert.ok(row.summary.length > 0, `the summary for \`${row.name}\` is not empty`);
  }
});

test("a mistyped subcommand names a candidate and one help pointer, never a stack", () => {
  const result = run("cerimonny");
  assert.notEqual(result.status, 0, "a mistyped subcommand is a failure");
  assert.match(result.stderr, /ceremon/u, "the nearest legal candidate is named");
  assert.match(result.stderr, /agentic-workflow help/u, "one line points at help");
  assert.doesNotMatch(result.stderr, /^\s+at /mu, "no stack frame is printed");
});

test("a closed ceremony registry's failure lists its legal objects and the help pointer", () => {
  const result = run("ceremony", "bogus-object", "x");
  assert.notEqual(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.error, "unknown-object");
  assert.ok(Array.isArray(parsed.objects) && parsed.objects.length > 0, "the legal objects are listed");
  assert.match(parsed.help, /agentic-workflow help ceremony/u, "the pointer names the subcommand's own help");
});

test("a closed ceremony operation's failure lists its legal ops and the help pointer", () => {
  const result = run("ceremony", "review", "bogus-op", "--slug", "x");
  assert.notEqual(result.status, 0);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.error, "unknown-op");
  assert.ok(Array.isArray(parsed.ops) && parsed.ops.length > 0, "the legal ops are listed");
  assert.match(parsed.help, /agentic-workflow help ceremony/u);
});

test("the journal's refusal names its legal operations and the help pointer", () => {
  const result = run("journal", "bogus");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /agentic-workflow help journal/u, "the pointer names the subcommand's own help");
});

test("a `help` for an unknown subcommand is a usage error with candidates, never a stack", () => {
  const result = run("help", "cerimonny");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr + result.stdout, /ceremony/u, "the nearest candidate is named");
  assert.doesNotMatch(result.stderr, /^\s+at /mu, "no stack frame is printed");
});
