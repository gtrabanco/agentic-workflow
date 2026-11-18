#!/usr/bin/env node

/**
 * forge-read-drift.test.mjs — the sanctioned-forms pin (issue #612, S4).
 *
 * The bypass #612 closes was prose: the skills told a model to read a forge body
 * with a raw `gh … view --json body`, and no collection layer saw it. A gate that
 * only reads prose has to be literal — it reads the command, never the sentence —
 * and it has to fail on reversion, so this suite proves both directions:
 *
 *   - `F1` — the live tree passes: zero content-bearing raw reads in the shipped
 *     prose (this is the case that was red before the prose re-point);
 *   - `F2` — the metadata-only and write-path forms stay sanctioned and unpunished;
 *   - `F3` — a field list the pin cannot read fails closed;
 *   - `F4` — one injected raw read fails the pin by name, and its line;
 *   - `F12` — an exemption with no reason fails, so silence never buys a pass;
 *   - `F13` — the sanctioned spelling comes from `RUNNER.md`'s subcommand table:
 *     a table that stops naming the subcommand fails the pin closed;
 *   - the transport rule — `gh api` in shipped prose is a `transport-leak` (S2/AC6).
 *
 * `scanForgeReadDrift` is pure over a `{files, texts}` model, so the injected cases
 * run the same code the live repository does instead of asserting a copy of it.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  EXCLUSIONS,
  SCANNED_ROOTS,
  loadTree,
  scanForgeReadDrift,
} from "./forge-read-drift.mjs";

const RUNNER_TABLE = [
  "## Subcommands",
  "",
  "| Subcommand | What it runs |",
  "|---|---|",
  "| `forge-read <issue\\|pr> <number> [--comments] [--reviews] [--json]` | the guarded forge read |",
  "",
  "## Exit codes",
].join("\n");

/**
 * A model with the page under test, one page that orders the sanctioned form (as
 * every real tree must) and the runner contract's table — so an injected case
 * isolates the rule it is about instead of tripping the citation rule too.
 */
function model(text, runner = RUNNER_TABLE) {
  return new Map([
    ["skills/demo/SKILL.md", text],
    ["skills/demo/references/READ.md", "`runner forge-read pr <n> --comments` reads the thread."],
    ["skills/runner-contract/references/RUNNER.md", runner],
  ]);
}

test("F1 — the live repository names no content-bearing raw forge read", () => {
  const { findings, checked, sanctioned } = scanForgeReadDrift(loadTree());
  assert.deepEqual(
    findings,
    [],
    `the shipped prose still teaches a raw forge content read:\n${findings.map((f) => `${f.code} ${f.file}:${f.line} — ${f.detail}`).join("\n")}`,
  );
  assert.ok(checked > 10, `the scan read the shipped prose, checked ${checked} file(s)`);
  assert.ok(sanctioned.includes("forge-read"), "the sanctioned spelling is read from RUNNER.md, not restated here");
});

test("F2 — the metadata-only, write and list forms stay sanctioned", () => {
  const text = [
    "`gh pr view <N> --json state,mergedAt`",
    "`gh issue view <n> --json state`",
    "`gh issue comment <n> --body-file body.md`",
    "`gh pr edit <n> --add-label x`",
    "`gh issue list --state open --json number,title`",
    "`runner forge-read pr <n> --comments`",
  ].join("\n");
  assert.deepEqual(scanForgeReadDrift(model(text)).findings, [], "none of these is a content read of the `view` grammar");
});

test("F3 — a field list the pin cannot read is refused, not assumed metadata-only", () => {
  const findings = scanForgeReadDrift(model("Resolve it with `gh pr view --json ...` first.")).findings;
  assert.deepEqual(
    findings.map((finding) => [finding.code, finding.line]),
    [["elided-field-list", 1]],
    "an unreadable list is a finding, never a silent pass",
  );
});

test("F4 — one injected raw read fails the pin by name and by line", () => {
  const text = ["# demo", "", "Read the body:", "", "```sh", "gh issue view <n> --json body", "```"].join("\n");
  const findings = scanForgeReadDrift(model(text)).findings;
  assert.deepEqual(findings.map((finding) => [finding.code, finding.file, finding.line]), [
    ["raw-content-read", "skills/demo/SKILL.md", 6],
  ]);
  assert.match(findings[0].detail, /gh issue view <n> --json body/u, "the finding quotes the offending command");
});

test("the transport rule: `gh api` in shipped prose is a leak", () => {
  const findings = scanForgeReadDrift(model("Read it with `gh api repos/o/r/issues/1`.")).findings;
  assert.deepEqual(findings.map((finding) => [finding.code, finding.line]), [["transport-leak", 1]]);
});

test("F12 — an exemption with no reason fails, and an explained one is honored", () => {
  const files = model("```sh\ngh pr view <N> --json body\n```");
  const unexplained = scanForgeReadDrift({ files, exemptions: [{ file: "skills/demo/SKILL.md", why: "   " }] }).findings;
  assert.ok(
    unexplained.some((finding) => finding.code === "unexplained-exemption"),
    `an exemption without a reason is a finding: ${JSON.stringify(unexplained)}`,
  );
  const explained = scanForgeReadDrift({
    files,
    exemptions: [{ file: "skills/demo/SKILL.md", why: "a frozen receipt quoting the command it ran, never an instruction" }],
  }).findings;
  assert.deepEqual(explained, [], "a declared reason stands");
});

test("F13 — a runner table that stops naming the subcommand fails the pin closed", () => {
  const runner = ["## Subcommands", "", "| Subcommand | What it runs |", "|---|---|", "| `unit-route` | the router |", "", "## Exit codes"].join("\n");
  const findings = scanForgeReadDrift(model("nothing to read here", runner)).findings;
  assert.deepEqual(findings.map((finding) => finding.code), ["sanctioned-form-missing"]);
});

test("the pin reads the documented roots, and its own exclusions state a reason", () => {
  assert.deepEqual(SCANNED_ROOTS, ["skills", "template", "docs/workflow"]);
  for (const [file, why] of EXCLUSIONS) {
    assert.ok(why.trim().length > 20, `${file}'s exclusion explains itself`);
  }
});

test("the shipped prose cites the sanctioned form — a ban without a replacement refuses the workflow it serves", () => {
  const { citations } = scanForgeReadDrift(loadTree());
  assert.ok(citations > 0, "at least one shipped page orders `runner forge-read`, so the replacement is reachable");
});
