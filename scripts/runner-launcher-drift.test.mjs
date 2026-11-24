#!/usr/bin/env node
// test-obligation: protects=skills/runner-contract/references/RUNNER.md obligations=contract,failure-path,boundary,convention

/**
 * runner-launcher-drift.test.mjs — the launcher-spelling pin (issue #710, S3/S4/S8).
 *
 * The residue #679's verification sketch named and never ran: a skill body that
 * spells the launcher itself (`agentic-workflow <subcommand>`) hands the agent an
 * instruction that resolves to nothing, because the scope-less npm name is a
 * `0.0.0` placeholder with no `bin`. The gate this suite pins reads the shipped
 * prose for that spelling and refuses it by file and line, so the rule stops
 * being a wording convention nobody re-checks.
 *
 * The cases split into the three directions a prose gate must prove, plus the
 * two failure states that keep it honest:
 *
 *   - `L1` — the live tree passes: the frozen-failure corpus of 101 sites is
 *     zero, and the tree still orders the symbolic form (a ban without a
 *     replacement refuses the workflow it serves);
 *   - `L2` — one injected launcher fails by name and line, quoting the command;
 *   - `L3` — a prose noun phrase that happens to carry a subcommand word is not
 *     a command, so the pin is not a word filter;
 *   - `L4` — the ordered set is the CLI's own registry, never a second list;
 *   - `L5` — a contract that stops declaring the symbolic form fails closed;
 *   - `L6` — an exemption with no reason fails, so silence never buys a pass;
 *   - `L7` — the declared roots and every exclusion's reason are stated;
 *   - `L8` — a file outside the declared roots is not this pin's answer;
 *   - `L9` — the exact-version launcher is sanctioned, not punished.
 *
 * `scanLauncherDrift` is pure over a `{files}` model, so the injected cases run
 * the same code the live repository does instead of asserting a copy of it.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXCLUSIONS,
  SCANNED_ROOTS,
  loadTree,
  scanLauncherDrift,
} from "./runner-launcher-drift.mjs";

/** The contract's own declaration of the symbolic form, as the owner states it. */
const RUNNER_CONTRACT_TEXT = [
  "# The runner — one invocation, one pin, one closed set",
  "",
  "## What a skill cites",
  "",
  "A skill that runs a runner command states it with the symbolic form:",
  "",
  "```text",
  "runner <subcommand> [args...]",
  "```",
  "",
  "A skill never spells a launcher.",
  "",
  "## Subcommands",
  "",
  "| Subcommand | What it runs |",
  "|---|---|",
  "| `journal` | the fragment writer |",
].join("\n");

/**
 * A model with the page under test plus the contract that declares the form, so
 * an injected case isolates the rule it is about instead of tripping the
 * sanctioned-form rule too.
 */
function model(text, contract = RUNNER_CONTRACT_TEXT) {
  return new Map([
    ["skills/demo/SKILL.md", text],
    ["skills/runner-contract/references/RUNNER.md", contract],
  ]);
}

const codes = (findings) => findings.map((finding) => finding.code);

test("L1 — the live tree orders the symbolic form and no bare launcher", () => {
  const { findings, checked, sanctioned, ordered, citations } = scanLauncherDrift(loadTree());
  assert.deepEqual(
    findings,
    [],
    `the shipped prose still orders a launcher that resolves to nothing:\n${findings
      .map((finding) => `${finding.code} ${finding.file}:${finding.line} — ${finding.detail}`)
      .join("\n")}`,
  );
  assert.ok(checked > 40, `the scan read the shipped prose, checked ${checked} file(s)`);
  assert.ok(sanctioned.includes("runner"), "the sanctioned head is read from the contract, not restated here");
  assert.ok(ordered.length > 50, `the ordered set is the CLI registry (${ordered.length} subcommands)`);
  assert.ok(citations > 40, `the replacement is reachable: ${citations} symbolic citation(s) ship`);
});

test("L2 — one injected launcher fails the pin by name and by line", () => {
  const text = ["# demo", "", "Write the entry:", "", "```sh", "agentic-workflow journal write --kind narrative", "```"].join("\n");
  const findings = scanLauncherDrift(model(text)).findings;
  assert.deepEqual(
    findings.map((finding) => [finding.code, finding.file, finding.line]),
    [["bare-launcher", "skills/demo/SKILL.md", 6]],
  );
  assert.match(findings[0].detail, /agentic-workflow journal write/u, "the finding quotes the offending command");
  assert.match(findings[0].detail, /runner <subcommand>/u, "and names the replacement");
});

test("L3 — prose that names the product is not a command", () => {
  const text = [
    "An agentic-workflow config is installed at the project root.",
    "Internal security review pass of the agentic-workflow review pack.",
    "This skill is specific to the agentic-workflow repository.",
    "`agentic-workflow.json` holds the cross-tool feature sections.",
  ].join("\n");
  assert.deepEqual(scanLauncherDrift(model(text)).findings, [], "a noun phrase is not an invocation instruction");
});

test("L4 — the ordered set is the CLI registry, never a second list", () => {
  const scan = scanLauncherDrift(model("`runner journal write` is the writer."));
  assert.ok(scan.ordered.includes("unit-doc") && scan.ordered.includes("journal"), "the registry's own names");
  assert.deepEqual(scan.findings, [], "a symbolic citation is what the contract asks for");
  const unknown = scanLauncherDrift(model("```sh\nagentic-workflow review the change\n```")).findings;
  assert.deepEqual(unknown, [], "a word no subcommand claims is prose, not a launcher");
});

test("L5 — a contract that stops declaring the symbolic form fails the pin closed", () => {
  const contract = ["# The runner", "", "## What a skill cites", "", "State the command.", ""].join("\n");
  const findings = scanLauncherDrift(model("nothing to order here", contract)).findings;
  assert.deepEqual(codes(findings), ["sanctioned-form-missing"]);
});

test("L6 — an exemption with no reason fails, and an explained one is honored", () => {
  const files = model("```sh\nagentic-workflow journal write\n```");
  const unexplained = scanLauncherDrift({ files, exemptions: [{ file: "skills/demo/SKILL.md", why: "  " }] }).findings;
  assert.ok(
    unexplained.some((finding) => finding.code === "unexplained-exemption"),
    `an exemption without a reason is a finding: ${JSON.stringify(unexplained)}`,
  );
  const explained = scanLauncherDrift({
    files,
    exemptions: [{ file: "skills/demo/SKILL.md", why: "a frozen receipt quoting the command it ran, never an instruction" }],
  }).findings;
  assert.deepEqual(explained, [], "a declared reason stands");
});

test("L7 — the pin reads the declared roots, and its own exclusions state a reason", () => {
  assert.deepEqual(SCANNED_ROOTS, ["skills", "template", "docs/workflow"]);
  for (const [file, why] of EXCLUSIONS) {
    assert.ok(why.trim().length > 20, `${file}'s exclusion explains itself`);
  }
});

test("L8 — a file outside the declared roots is not this pin's answer", () => {
  const files = new Map([
    ["docs/other/NOTES.md", "```sh\nagentic-workflow journal write\n```"],
    ...model("`runner journal write` is the writer."),
  ]);
  assert.deepEqual(scanLauncherDrift({ files }).findings, [], "the roots are the declaration, not a guess");
});

test("L9 — the exact-version launcher is sanctioned, not punished", () => {
  const text = [
    "```sh",
    "bunx @gtrabanco/agentic-workflow@4.10.1 journal write --kind narrative",
    "npx --yes @gtrabanco/agentic-workflow@4.10.1 help",
    "```",
  ].join("\n");
  assert.deepEqual(scanLauncherDrift(model(text)).findings, [], "S4 sanctions the exact-version form");
});
