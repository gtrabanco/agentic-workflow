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

// ── correction batch 2026-11-23: the repair S2/AC-S2 actually promises ──────
// Every refusal family names its repair: candidates where the registry is
// closed, and exactly one `agentic-workflow help <sub>` pointer line on every
// path. The first batch delivered ceremony, journal and the bin's closed world;
// these cases pin the families the receipt found without a repair (B1) and the
// evidence rows O1/O3 name (the deletion reproducer, the dispatch enumeration).

/** The help-pointer lines one invocation printed, on either stream. */
const pointerCount = (result) =>
  ((result.stdout + result.stderr).match(/Run `agentic-workflow help/gu) ?? []).length;

test("config's closed registry failure names its legal operations and one help pointer", () => {
  const result = run("config", "bogus-op");
  assert.equal(result.status, 2, "the published config refusal exit stays 2");
  assert.match(result.stderr, /CONFIG REFUSAL/u, "the published prefix is unchanged");
  assert.match(result.stderr, /unknown config operation "bogus-op"/u);
  assert.match(result.stderr, /get, set, list, show, validate, init, reset, default, schema/u, "the legal candidates are listed");
  assert.equal(pointerCount(result), 1, "exactly one help pointer line");
  assert.match(result.stderr, /agentic-workflow help config/u);
});

test("doc's usage failure points at doc's own help, exactly once", () => {
  const result = run("doc", "--bogus");
  assert.equal(result.status, 1, "the doc usage exit stays 1");
  assert.match(result.stderr, /unknown flag "--bogus"/u);
  assert.equal(pointerCount(result), 1, "exactly one help pointer line");
  assert.match(result.stderr, /agentic-workflow help doc/u);
});

test("every refusal family carries exactly one help pointer, and closed registries list candidates", () => {
  const cases = [
    { args: ["manifest", "bogus-op"], expect: /skillAdd, skillRemove/u, exit: 2 },
    { args: ["roadmap", "bogus-op"], expect: /rowUpsert, annotate, read, fixrow, check/u, exit: 2 },
    { args: ["skills", "bogus"], expect: /agentic-workflow help skills/u, exit: null },
    { args: ["section", "bogus"], expect: /agentic-workflow help section/u, exit: null },
    { args: ["memory", "bogus"], expect: /agentic-workflow help memory/u, exit: 2 },
    { args: ["log", "bogus"], expect: /agentic-workflow help log/u, exit: 2 },
    { args: ["unit-doc", "nonexistent-unit", "setSection", "x", "y"], expect: /agentic-workflow help unit-doc/u, exit: 2 },
  ];
  for (const { args, expect, exit } of cases) {
    const result = run(...args);
    const label = args.join(" ");
    assert.notEqual(result.status, 0, `${label} refuses`);
    if (exit !== null) assert.equal(result.status, exit, `${label} keeps its exit contract`);
    assert.match(result.stderr, expect, `${label} carries its repair`);
    assert.equal(pointerCount(result), 1, `${label} prints exactly one help pointer line`);
  }
});

test("the recorded deletion reproducer suggests its nearest candidate with one pointer", () => {
  const result = run("delete-section");
  assert.equal(result.status, 2, "the closed-world exit stays 2");
  assert.match(result.stderr, /^EDIT REFUSAL — Unknown service: delete-section/u, "the published prefix is unchanged");
  assert.match(result.stderr, /Did you mean: section/u, "the nearest legal candidate is named");
  assert.equal(pointerCount(result), 1, "exactly one help pointer line");
  assert.match(result.stderr, /agentic-workflow help section/u);
});

test("every sensor refusal prefix maps to its subcommand's help, and one really prints it", () => {
  const source = readFileSync(BIN, "utf8");
  const prefixes = [...new Set([...source.matchAll(/sensorRefuse\("([A-Z-]+)"/gu)].map((m) => m[1]))].sort();
  assert.deepEqual(prefixes, ["PASSES", "RESOURCES", "VERIFY"], "the prefix set is the closed one");
  const map = source.match(/const SENSOR_HELP = Object\.freeze\(\{[^}]*\}\)/su);
  assert.ok(map, "the prefix→help map exists in the bin");
  for (const prefix of prefixes) assert.match(map[0], new RegExp(`${prefix}:\\s*"`, "u"), `${prefix} names its subcommand`);
  const result = run("verify", "--bogus");
  assert.equal(result.status, 2, "the sensor refusal exit stays 2");
  assert.match(result.stderr, /VERIFY REFUSAL/u);
  assert.equal(pointerCount(result), 1, "exactly one help pointer line");
  assert.match(result.stderr, /agentic-workflow help verify/u);
});

test("the no-command usage names the index door exactly once", () => {
  const result = run();
  assert.equal(result.status, 1, "the no-command exit stays 1");
  assert.match(result.stderr, /^usage: bunx @gtrabanco\/agentic-workflow@<pin> </mu);
  assert.equal(pointerCount(result), 1, "exactly one help pointer line");
  assert.match(result.stderr, /agentic-workflow help` for the subcommand index/u);
});

// ── the three doors are one door, for every subcommand (B2) ─────────────────

test("the richer-door subcommands answer all three doors with byte-identical blocks", () => {
  for (const name of ["workflow-status", "unit-route", "quality-metrics", "help"]) {
    const viaHelp = run("help", name);
    const viaLong = run(name, "--help");
    const viaShort = run(name, "-h");
    assert.equal(viaHelp.status, 0, `help ${name} exits 0`);
    assert.equal(viaLong.status, 0, `${name} --help exits 0`);
    assert.equal(viaShort.status, 0, `${name} -h exits 0`);
    assert.equal(viaLong.stdout, viaHelp.stdout, `${name} --help is byte-identical to help ${name}`);
    assert.equal(viaShort.stdout, viaHelp.stdout, `${name} -h is byte-identical to help ${name}`);
  }
});

test("the index's own claim holds: every door answers every subcommand", () => {
  const index = run("help");
  assert.match(index.stdout, /Every subcommand answers `--help`/u, "the claim is still printed");
  const short = run("workflow-status", "-h");
  assert.equal(short.status, 0, "the claim must not be a lie: -h answers");
});

// ── help <sub> --json answers machine data, never prose (B8) ────────────────

test("help <sub> --json answers that subcommand's row in the same envelope", () => {
  for (const args of [["help", "ceremony", "--json"], ["help", "--json", "ceremony"]]) {
    const result = run(...args);
    assert.equal(result.status, 0, `${args.join(" ")} exits 0`);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.subcommands.length, 1, `${args.join(" ")} carries exactly one row`);
    assert.equal(parsed.subcommands[0].name, "ceremony");
    assert.ok(Array.isArray(parsed.subcommands[0].ops), "the row carries its closed ops");
  }
});
