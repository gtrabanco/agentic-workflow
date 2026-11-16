/**
 * runner.resolve.test.mjs — the programmatic runner resolver (issue #555).
 *
 * The failure this removes: the runner was chosen in prose ("`bunx` first,
 * `npx` when bun is not installed"), so nothing that runs in code could answer
 * the question, no third candidate existed, and each consumer spelled its own
 * rule. This suite pins the one resolver every consumer imports — the closed
 * set and its order, the eligibility floors taken from the crate's own
 * `engines`, the documented override, the installed-package route, and the
 * fail-closed refusal that names every candidate it tried.
 *
 * Two properties make the set a contract rather than a list:
 *
 *  - **One home each.** The candidates are data (`RUNNER_CANDIDATES`), and
 *    `skills/runner-contract/references/RUNNER.md` declares the same set in its
 *    `runner-set@1` block. A candidate added to one side alone is a red suite.
 *  - **Fail closed upward.** Nothing here guesses: an unreadable manifest floor,
 *    a probe that cannot run, or an environment with none of the set is a
 *    refusal naming what was tried, never a silent fallback to a runner nobody
 *    installed.
 *
 * Every fixture is a throwaway directory holding fake executables that print
 * the pinned versions, so the suite is offline and deterministic by
 * construction.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  RUNNER_CANDIDATES,
  RunnerResolutionError,
  renderInvocation,
  resolveRunner,
} from "../src/runner/resolve.mjs";

const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));
const MANIFEST = JSON.parse(readFileSync(join(PACKAGE_ROOT, "package.json"), "utf8"));
const BIN = join(PACKAGE_ROOT, "bin", "agentic-workflow.mjs");
const RUNNER_CONTRACT = resolve(PACKAGE_ROOT, "..", "..", "skills", "runner-contract", "references", "RUNNER.md");
const PIN = `<pin>`;

/**
 * A PATH holding only the programs the case declares, each printing the exact
 * version the case pins. `bunx`/`npx` are never in the fixture: the resolver
 * chooses a launcher, it never assumes the launcher's own prefix exists.
 */
function fixturePath(t, programs) {
  const dir = mkdtempSync(join(tmpdir(), "aw555-path-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [name, version] of Object.entries(programs)) {
    const file = join(dir, name);
    writeFileSync(file, `#!/bin/sh\nprintf '%s\\n' '${version}'\n`);
    chmodSync(file, 0o755);
  }
  return dir;
}

const resolveWith = (dir, over = {}) =>
  resolveRunner({
    args: ["workflow-status", "--json-only"],
    env: { PATH: dir, AGENTIC_WORKFLOW_RUNNER: "" },
    manifest: MANIFEST,
    ...over,
  });

// ── the closed set ─────────────────────────────────────────────────────────

test("the closed set is bunx → npx --yes → pnpm dlx, in that order", () => {
  assert.deepEqual(
    RUNNER_CANDIDATES.map((candidate) => candidate.id),
    ["bunx", "npx", "pnpm dlx"],
    "the order is the contract: it decides which launcher wins when several are installed",
  );
  for (const candidate of RUNNER_CANDIDATES) {
    assert.match(
      renderInvocation(candidate, PIN, ["<subcommand>", "[args...]"]),
      /^[a-z][a-z ]* [^\n]*@gtrabanco\/agentic-workflow@<pin> <subcommand> \[args\.\.\.\]$/u,
      `${candidate.id} is one exact invocation, never a shell fallback`,
    );
  }
});

test("an eligible bun answers through bunx at the crate's own version", (t) => {
  const dir = fixturePath(t, { bun: MANIFEST.engines.bun.replace(/^>=/u, "") });
  const answer = resolveWith(dir);
  assert.equal(answer.source, "bunx");
  assert.deepEqual(answer.argv, ["bunx", `@gtrabanco/agentic-workflow@${MANIFEST.version}`, "workflow-status", "--json-only"]);
});

test("a bun below the manifest floor falls through to npx --yes", (t) => {
  const dir = fixturePath(t, { bun: "1.3.0", node: MANIFEST.engines.node.replace(/^>=/u, "") });
  const answer = resolveWith(dir);
  assert.equal(answer.source, "npx");
  assert.deepEqual(answer.argv, ["npx", "--yes", `@gtrabanco/agentic-workflow@${MANIFEST.version}`, "workflow-status", "--json-only"]);
});

test("pnpm dlx answers when pnpm is the only launcher installed", (t) => {
  const dir = fixturePath(t, { pnpm: "10.0.0" });
  const answer = resolveWith(dir);
  assert.equal(answer.source, "pnpm dlx");
  assert.deepEqual(answer.argv, ["pnpm", "dlx", `@gtrabanco/agentic-workflow@${MANIFEST.version}`, "workflow-status", "--json-only"]);
});

test("pnpm dlx is refused when a present node is below the crate's floor", (t) => {
  const dir = fixturePath(t, { pnpm: "10.0.0", node: "20.0.0" });
  assert.throws(
    () => resolveWith(dir),
    (error) =>
      error instanceof RunnerResolutionError &&
      /pnpm dlx/u.test(error.message) &&
      /node 20\.0\.0/u.test(error.message),
    "a candidate whose runtime is too old is named with the version it found, never launched",
  );
});

test("the floors are read from the manifest the caller passes, never restated", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5", node: "26.13.0", pnpm: "10.0.0" });
  const raised = { ...MANIFEST, engines: { ...MANIFEST.engines, bun: ">=9.0" } };
  const answer = resolveWith(dir, { manifest: raised });
  assert.equal(answer.source, "npx", "a raised bun floor makes the installed bun ineligible");
});

// ── the two escape hatches ────────────────────────────────────────────────

test("AGENTIC_WORKFLOW_RUNNER wins and is tokenised, including the documented spaced form", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5" });
  const answer = resolveWith(dir, { env: { PATH: dir, AGENTIC_WORKFLOW_RUNNER: "bun /tmp/checkout/bin/agentic-workflow.mjs" } });
  assert.equal(answer.source, "AGENTIC_WORKFLOW_RUNNER");
  assert.deepEqual(answer.argv, ["bun", "/tmp/checkout/bin/agentic-workflow.mjs", "workflow-status", "--json-only"]);
});

test("an empty override is unset, never a refusal", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5" });
  const answer = resolveWith(dir, { env: { PATH: dir, AGENTIC_WORKFLOW_RUNNER: "   " } });
  assert.equal(answer.source, "bunx", "whitespace is the unset spelling the action's S13 corpus relies on");
});

test("a caller's installed bin is the first candidate after the override", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5" });
  const script = join(dir, "agentic-workflow.mjs");
  writeFileSync(script, "#!/usr/bin/env node\n");
  const answer = resolveWith(dir, { installed: { program: "node", script } });
  assert.equal(answer.source, "installed");
  assert.deepEqual(answer.argv, ["node", script, "workflow-status", "--json-only"]);
});

test("a missing installed bin falls through to the closed set instead of failing", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5" });
  const answer = resolveWith(dir, { installed: { program: "node", script: join(dir, "absent.mjs") } });
  assert.equal(answer.source, "bunx", "a caller that offers a path the resolver cannot read is repaired, not broken");
});

// ── the required failure state ────────────────────────────────────────────

test("with none of the set the resolver fails closed, naming every candidate it tried", (t) => {
  const dir = fixturePath(t, {});
  assert.throws(
    () => resolveWith(dir),
    (error) => {
      assert.ok(error instanceof RunnerResolutionError, "the refusal is typed");
      for (const needle of ["bunx", "npx", "pnpm dlx", "AGENTIC_WORKFLOW_RUNNER", "no runner resolved"]) {
        assert.ok(error.message.includes(needle), `the refusal names ${needle}`);
      }
      return true;
    },
  );
});

test("an unreadable manifest floor is a refusal, never a guess", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5" });
  assert.throws(
    () => resolveWith(dir, { manifest: { ...MANIFEST, engines: { ...MANIFEST.engines, bun: "latest" } } }),
    /engines\.bun/u,
  );
});

// ── the one-home parity (S5, S9) ──────────────────────────────────────────

/** Read one `id@1` block's rows, split on ` | ` and trimmed. */
function blockRows(text, id) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === id);
  assert.notEqual(start, -1, `RUNNER.md declares ${id}`);
  const rows = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") break;
    if (line.trim().startsWith("```")) break;
    if (!line.includes(" | ")) continue;
    rows.push(line.split(" | ").map((cell) => cell.trim()));
  }
  return rows;
}

test("RUNNER.md's runner-set@1 and RUNNER_CANDIDATES are one value", () => {
  const text = readFileSync(RUNNER_CONTRACT, "utf8");
  const rows = blockRows(text, "runner-set@1");
  assert.deepEqual(rows[0], ["candidate", "requires", "invocation"], "the set block declares its three columns");

  const declared = rows.slice(1).map((row) => row[0]);
  assert.deepEqual(declared, RUNNER_CANDIDATES.map((candidate) => candidate.id), "the ids and their order are the same list");

  for (const row of rows.slice(1)) {
    const candidate = RUNNER_CANDIDATES.find((entry) => entry.id === row[0]);
    assert.equal(
      row[2],
      renderInvocation(candidate, PIN, ["<subcommand>", "[args...]"]),
      `${row[0]}'s invocation is rendered from code, never paraphrased`,
    );
  }
});

test("the pin the rendered-facts row recomputes is still in the contract", () => {
  const text = readFileSync(RUNNER_CONTRACT, "utf8");
  assert.ok(
    text.includes(`bunx @gtrabanco/agentic-workflow@${MANIFEST.version}`),
    "the drift gate recomputes the literal against the crate's manifest — it cannot move",
  );
});

// ── the command surface (`runner resolve`) ────────────────────────────────

const runCli = (dir, ...args) =>
  spawnSync(process.execPath, [BIN, "runner", "resolve", ...args], {
    encoding: "utf8",
    env: { PATH: dir, AGENTIC_WORKFLOW_RUNNER: "" },
  });

test("`runner resolve --json` answers the argv a caller can spawn", (t) => {
  const dir = fixturePath(t, { bun: "1.4.5" });
  const run = runCli(dir, "--json", "workflow-status", "--json-only");
  assert.equal(run.status, 0, run.stderr);
  const answer = JSON.parse(run.stdout);
  assert.equal(answer.source, "bunx");
  assert.equal(answer.program, "bunx");
  assert.deepEqual(answer.argv, ["bunx", `@gtrabanco/agentic-workflow@${MANIFEST.version}`, "workflow-status", "--json-only"]);
});

test("`runner resolve` fails closed with exit 2 and the RUNNER REFUSAL block", (t) => {
  const dir = fixturePath(t, {});
  const run = runCli(dir, "workflow-status");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^RUNNER REFUSAL — /mu);
  assert.match(run.stderr, /bunx/u);
  assert.match(run.stderr, /pnpm dlx/u);
});

test("`runner resolve` with an unknown operation is a usage error, never a fallback", (t) => {
  const dir = fixturePath(t, {});
  const run = spawnSync(process.execPath, [BIN, "runner", "nonsense"], { encoding: "utf8", env: { PATH: dir } });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /^usage: agentic-workflow runner /mu);
});
