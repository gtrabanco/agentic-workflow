#!/usr/bin/env node

/**
 * headless.mjs — the action's adapter (issue #471).
 *
 * A composite action receives no `INPUT_*` variables automatically, so
 * `action.yml` passes every input through `env:` and this file maps the run's
 * environment onto the crate's `journal headless` operation. It is deliberately
 * thin: the identity, the bytes and the write are the crate's, and this adapter
 * never composes a filename, never renders a block and never touches the
 * project's journal file.
 *
 * Five rules, each a case in
 * `packages/agentic-workflow/test/journal.headless.test.mjs`:
 *
 *  - **The run's own context is the provenance.** `GITHUB_WORKFLOW`,
 *    `GITHUB_RUN_ID` and `GITHUB_ACTOR` are required; a missing one is a refusal
 *    naming the variable, because an entry with no run context cannot be told
 *    apart from an operator's.
 *  - **One train, one pin.** The crate version is read from the action's own
 *    tagged tree (`../packages/agentic-workflow/package.json`), never restated
 *    here, so the action and the crate it runs cannot drift.
 *  - **The choice is the crate's resolver.** `AGENTIC_WORKFLOW_RUNNER` wins
 *    (the contract's documented override, which is how this repository's suites
 *    run the working tree), and otherwise the crate's own resolver answers the
 *    closed set at the pin its manifest carries — one implementation, shared
 *    with pi and with `runner resolve` (issue #555).
 *  - **Fail closed, never skip.** No runner, a runner that cannot start, a
 *    runner that exits non-zero, or a receipt that does not parse is a
 *    `JOURNAL REFUSAL` with exit 2 — the job fails, and the fragment is either
 *    complete or absent. A runtime below the crate's own `engines` is never
 *    launched: an old bun falls through to the next candidate, and with none
 *    eligible the refusal names what it tried.
 *  - **The receipt is the output.** `fragment`, `name` and `status` go to
 *    `$GITHUB_OUTPUT` when the job provides it, so a later step can commit the
 *    file it names.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { RunnerResolutionError, resolveRunner } from "../packages/agentic-workflow/src/runner/resolve.mjs";

/** The one refusal shape, so a headless job fails with the same line every time. */
function refuse(reason) {
  process.stderr.write(`JOURNAL REFUSAL — ${reason}\n`);
  process.exit(2);
}

const env = (name) => String(process.env[name] ?? "").trim();

/** The run's context, or a refusal naming every variable the job did not set. */
function readContext() {
  const cells = [
    ["workflow", "GITHUB_WORKFLOW"],
    ["runId", "GITHUB_RUN_ID"],
    ["actor", "GITHUB_ACTOR"],
  ];
  const missing = cells.filter(([, variable]) => env(variable) === "");
  if (missing.length > 0) {
    refuse(
      `the run context is incomplete: ${missing.map(([, variable]) => variable).join(", ")} required — a headless entry without it is indistinguishable from an operator's`,
    );
  }
  return { workflow: env("GITHUB_WORKFLOW"), runId: env("GITHUB_RUN_ID"), actor: env("GITHUB_ACTOR") };
}

const context = readContext();
const root = path.resolve(env("INPUT_ROOT") || ".");

const cli = [
  "journal",
  "headless",
  "--workflow",
  context.workflow,
  "--run-id",
  context.runId,
  "--actor",
  context.actor,
  "--json",
];
for (const [variable, flag] of [
  ["INPUT_SUMMARY", "--summary"],
  ["INPUT_DECISIONS", "--decisions"],
  ["INPUT_NEXT", "--next"],
  ["INPUT_ISSUE", "--issue"],
  ["INPUT_FILES", "--files"],
  ["INPUT_BASE", "--base"],
  ["INPUT_BLOCK", "--block"],
]) {
  const value = env(variable);
  if (value !== "") cli.push(flag, value);
}

// One implementation, shared with pi and with `runner resolve` (issue #555):
// the crate's resolver reads the crate's own manifest for the pin and the
// engine floors, honours the documented override, and refuses naming every
// candidate it tried instead of installing or silently skipping.
let runner;
try {
  runner = resolveRunner({ args: cli });
} catch (error) {
  if (error instanceof RunnerResolutionError) refuse(error.message);
  throw error;
}

const run = spawnSync(runner.argv[0], runner.argv.slice(1), {
  cwd: root,
  encoding: "utf8",
  env: process.env,
  maxBuffer: 16 * 1024 * 1024,
});

if (run.error) {
  refuse(`the runner ${runner.argv[0]} did not start: ${run.error.message}`);
}
if (run.status !== 0) {
  const detail = String(run.stderr ?? "").trim();
  if (detail !== "") process.stderr.write(`${detail}\n`);
  refuse(`the writer refused (exit ${run.status})`);
}

const stdout = String(run.stdout ?? "");
const start = stdout.indexOf("{");
const end = stdout.lastIndexOf("}");
let receipt;
try {
  if (start === -1 || end < start) throw new Error("no JSON object on stdout");
  receipt = JSON.parse(stdout.slice(start, end + 1));
} catch {
  const lines = stdout
    .split("\n")
    .filter((line) => line.trim() !== "");
  refuse(`the writer printed no receipt: ${lines.length === 0 ? "stdout was empty" : lines[lines.length - 1]}`);
}
if (typeof receipt?.path !== "string" || typeof receipt?.name !== "string") {
  refuse("the writer's receipt carries no fragment path — refusing to report an output the job cannot commit");
}

const outputFile = env("GITHUB_OUTPUT");
if (outputFile !== "") {
  const outputs = { fragment: receipt.path, name: receipt.name, status: receipt.status };
  const block = Object.entries(outputs).map(([key, value]) => `${key}=${String(value ?? "")}\n`).join("");
  fs.writeFileSync(outputFile, block, { flag: "a" });
}

process.stdout.write(`${JSON.stringify(receipt)}\n`);
