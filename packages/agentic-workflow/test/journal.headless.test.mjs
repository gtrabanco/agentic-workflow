/**
 * journal.headless.test.mjs — the headless journal writer (issue #471).
 *
 * The failure this removes: a CI-driven session (an agent action landing a PR, a
 * scheduled driver, a compiled workflow) produces no journal entry, because
 * `log-session` only covers an interactive session with a live operator, and a
 * hand-composed fragment is exactly the failure class #452 removed (a model
 * typing a filename). The headless writer takes the run's **declaration** and
 * composes the fragment with the crate's own owners — `fragmentName` for the
 * name, `renderEntryBlock` for the bytes, `writeJournal` for the write — so a
 * headless entry is one more consumer of `journal-fragment-grammar@1`, never a
 * second grammar.
 *
 * Three contracts, each a case below:
 *
 *  - **The declaration is the input** (`S14/S17`): issue, summary, decisions,
 *    next step and files in; one conforming narrative fragment out, with the
 *    run's provenance carried in the grammar's own fields (session slug
 *    `gha-<run id>`, heading label naming workflow, run id and actor).
 *  - **Least privilege and no second writer** (`S15/S16`): the action never
 *    touches the journal file, never holds a token and never calls a forge; the
 *    shipped aggregator consumes what it writes.
 *  - **Opt-in stays deliberate** (`S18`): an absent carrier is a refusal and
 *    nothing is created — no directory, no journal, no config key.
 *
 * Every fixture is a throwaway git repository under the OS temp directory,
 * removed by the case that made it: the `journal aggregate` case must never run
 * against this repository's own carrier.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  JournalHeadlessError,
  headlessIdentity,
  writeHeadlessJournal,
} from "../src/journal/headless.mjs";
import { parseFragmentName, readFragment, JOURNAL_DIR } from "../src/journal/fragment.mjs";
import { aggregateJournal } from "../src/journal/aggregate.mjs";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.resolve(PACKAGE_ROOT, "..", "..");
const BIN = path.join(PACKAGE_ROOT, "bin", "agentic-workflow.mjs");
const ACTION_DIR = path.join(REPO_ROOT, "journal");
const ADAPTER = path.join(ACTION_DIR, "headless.mjs");

const CONTEXT = Object.freeze({ workflow: "ci", runId: "42", actor: "bot" });
const DECLARATION = Object.freeze({
  issue: "471",
  summary: "Shipped the headless journal action.",
  decisions: "Write the carrier fragment; the aggregator stays the only journal writer.",
  next: "Verify the pinned tag in a real caller.",
});

/** A throwaway git repository: `main`, one empty commit, optional carrier/journal. */
function makeRepo(t, { carrier = true, journal = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "aw471-"));
  const git = (...args) =>
    spawnSync("git", ["-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", ...args], {
      cwd: root,
      encoding: "utf8",
    });
  git("init", "-b", "main");
  git("commit", "--allow-empty", "-m", "fixture: base");
  if (carrier) fs.mkdirSync(path.join(root, JOURNAL_DIR), { recursive: true });
  if (journal) {
    fs.mkdirSync(path.join(root, "docs"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs", "LOGS.md"), "# Session log\n");
  }
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

const carrierNames = (root) => fs.readdirSync(path.join(root, JOURNAL_DIR)).sort();

const TIMESTAMP = "2026-11-15T10:15:00Z";
const PINNED = { timestamp: TIMESTAMP };

// ── the declaration → one conforming fragment (S13, S14) ──────────────────

test("S13 a headless declaration lands exactly one conforming narrative fragment", (t) => {
  const root = makeRepo(t);
  const receipt = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });

  assert.equal(receipt.ok, true);
  assert.equal(receipt.status, "written");
  assert.equal(receipt.kind, "narrative");
  assert.equal(receipt.name, "20261115T101500Z-main-narrative-gha-42.md");
  assert.deepEqual(carrierNames(root), [receipt.name], "exactly one file lands in the carrier");
  assert.deepEqual(parseFragmentName(receipt.name), {
    timestamp: "20261115T101500Z",
    branch: "main",
    kind: "narrative",
    sessionId: "gha-42",
  });
  assert.equal(fs.readFileSync(path.join(root, JOURNAL_DIR, receipt.name), "utf8").startsWith("## "), true);
});

test("S14 the declaration's cells land in the block", (t) => {
  const root = makeRepo(t);
  const receipt = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  const content = readFragment(path.join(root, JOURNAL_DIR), receipt.name).content;

  assert.match(content, /## 2026-11-15T10:15:00Z — main — headless ci run 42 by bot for #471/u);
  assert.match(content, /- \*\*Commits:\*\* 0/u);
  assert.match(content, /- \*\*Summary:\*\* Shipped the headless journal action\./u);
  assert.match(content, /- \*\*Decisions:\*\* Write the carrier fragment; the aggregator stays the only journal writer\./u);
  assert.match(content, /- \*\*Next:\*\* Verify the pinned tag in a real caller\./u);
  assert.equal(content.endsWith("\n"), true);
  assert.equal(content.includes("\r"), false);
});

test("S14 --files overrides the git-derived cell", (t) => {
  const root = makeRepo(t);
  const receipt = writeHeadlessJournal({
    root,
    declaration: { ...DECLARATION, files: "journal/action.yml, journal/headless.mjs" },
    context: CONTEXT,
    timestamp: TIMESTAMP,
  });
  const content = readFragment(path.join(root, JOURNAL_DIR), receipt.name).content;
  assert.match(content, /- \*\*Files:\*\* journal\/action\.yml, journal\/headless\.mjs/u);
});

test("S14 a rendered block on stdin is validated and lands unchanged", (t) => {
  const root = makeRepo(t);
  const block = [
    "## 2026-11-15T10:15:00Z — main — headless ci run 42 by bot for #471",
    "- **Commits:** 1 (`abcdef12…abcdef12`)",
    "- **Files:** docs/LOGS.md",
    "- **Summary:** a caller supplied its own block.",
    "",
  ].join("\n");
  const receipt = writeHeadlessJournal({
    root,
    declaration: { block },
    context: CONTEXT,
    timestamp: TIMESTAMP,
  });
  assert.equal(fs.readFileSync(path.join(root, JOURNAL_DIR, receipt.name), "utf8"), block);
});

test("S14 prose fields and a rendered block together are refused", (t) => {
  const root = makeRepo(t);
  assert.throws(
    () =>
      writeHeadlessJournal({
        root,
        declaration: { ...DECLARATION, block: "## 2026-11-15T10:15:00Z — main — x\n" },
        context: CONTEXT,
        timestamp: TIMESTAMP,
      }),
    /block or the prose fields, never both/u,
  );
});

// ── provenance in the grammar's own fields (S17) ──────────────────────────

test("S17 provenance lands in the grammar's fields, not in a new one", (t) => {
  const root = makeRepo(t);
  const identity = headlessIdentity({ declaration: DECLARATION, context: CONTEXT });
  assert.equal(identity.session, "gha-42");
  assert.equal(identity.label, "headless ci run 42 by bot for #471");

  const receipt = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  const content = readFragment(path.join(root, JOURNAL_DIR), receipt.name).content;
  const heading = content.slice(0, content.indexOf("\n"));
  assert.match(heading, /headless ci run 42 by bot/u, "workflow, run id and actor are in the heading label");
  assert.equal(heading.split(" — ").length, 3, "the heading keeps its three-cell grammar");
});

test("S17 a multiline declaration cell is flattened, never a second block line", () => {
  const identity = headlessIdentity({
    declaration: { summary: "line one\nline two" },
    context: CONTEXT,
  });
  assert.equal(identity.label, "headless ci run 42 by bot");
  assert.equal(identity.label.includes("\n"), false);
});

// ── refusals: required failure states (S14, S17, S18) ─────────────────────

test("S14 incomplete provenance is refused by name", (t) => {
  const root = makeRepo(t);
  for (const missing of ["workflow", "runId", "actor"]) {
    const context = { ...CONTEXT, [missing]: "" };
    assert.throws(
      () => writeHeadlessJournal({ root, declaration: DECLARATION, context, timestamp: TIMESTAMP }),
      (error) => error instanceof JournalHeadlessError && new RegExp(missing, "u").test(error.message),
      `${missing} must be named in the refusal`,
    );
  }
  assert.deepEqual(carrierNames(root), [], "a refusal writes nothing");
});

test("S17 a run id outside the fragment identity's alphabet is refused", (t) => {
  const root = makeRepo(t);
  assert.throws(
    () =>
      writeHeadlessJournal({
        root,
        declaration: DECLARATION,
        context: { ...CONTEXT, runId: "42/../escape" },
        timestamp: TIMESTAMP,
      }),
    /run id/u,
  );
  assert.deepEqual(carrierNames(root), []);
});

test("S18 an absent carrier is refused and nothing is created", (t) => {
  const root = makeRepo(t, { carrier: false });
  assert.throws(
    () => writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP }),
    /carrier/u,
  );
  assert.equal(fs.existsSync(path.join(root, JOURNAL_DIR)), false, "the writer never opts a project in");
  assert.equal(fs.existsSync(path.join(root, "docs", "LOGS.md")), false, "and never creates a journal");
});

test("S14 a declaration with neither prose nor a block is refused", (t) => {
  const root = makeRepo(t);
  assert.throws(
    () => writeHeadlessJournal({ root, declaration: { issue: "471" }, context: CONTEXT, timestamp: TIMESTAMP }),
    /summary/u,
  );
});

// ── idempotency, one entry per run (S13) ─────────────────────────────────

test("S13 a second invocation for the same run is a no-op, never a duplicate", (t) => {
  const root = makeRepo(t);
  const first = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  const bytes = fs.readFileSync(first.path, "utf8");

  const second = writeHeadlessJournal({
    root,
    declaration: { ...DECLARATION, summary: "a re-run with different prose" },
    context: CONTEXT,
    timestamp: "2026-11-15T11:00:00Z",
  });
  assert.equal(second.status, "already-present");
  assert.equal(second.name, first.name);
  assert.equal(fs.readFileSync(first.path, "utf8"), bytes, "the existing entry is never rewritten");
  assert.deepEqual(carrierNames(root), [first.name]);
});

test("S13 two different runs on one branch are two entries", (t) => {
  const root = makeRepo(t);
  writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  writeHeadlessJournal({
    root,
    declaration: DECLARATION,
    context: { ...CONTEXT, runId: "43" },
    timestamp: TIMESTAMP,
  });
  assert.deepEqual(carrierNames(root), [
    "20261115T101500Z-main-narrative-gha-42.md",
    "20261115T101500Z-main-narrative-gha-43.md",
  ]);
});

// ── the write path has a consumer and no second writer (S15) ─────────────

test("S15 the shipped aggregator consumes a headless fragment", (t) => {
  const root = makeRepo(t, { journal: true });
  const receipt = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  const result = aggregateJournal({ root });
  assert.deepEqual(result.appended, [receipt.name]);
  assert.deepEqual(carrierNames(root), [], "the fragment is consumed, not copied");
  const log = fs.readFileSync(path.join(root, "docs", "LOGS.md"), "utf8");
  assert.match(log, /headless ci run 42 by bot for #471/u);
});

test("S15 the headless writer never touches the journal file", () => {
  for (const file of [path.join(ACTION_DIR, "headless.mjs"), path.join(PACKAGE_ROOT, "src", "journal", "headless.mjs")]) {
    const text = fs.readFileSync(file, "utf8");
    assert.equal(/LOGS\.md|appendFileSync/u.test(text), false, `${path.basename(file)} must not write the journal`);
  }
});

// ── the CLI operation (S13, S14) ─────────────────────────────────────────

const runCli = (cwd, args, env = {}) =>
  spawnSync(process.execPath, [BIN, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });

test("S13 journal headless writes one fragment and prints a JSON receipt", (t) => {
  const root = makeRepo(t);
  const run = runCli(root, [
    "journal", "headless",
    "--workflow", "ci",
    "--run-id", "42",
    "--actor", "bot",
    "--issue", "471",
    "--summary", "Shipped the headless journal action.",
    "--timestamp", TIMESTAMP,
    "--json",
  ]);
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.status, "written");
  assert.ok(fs.existsSync(receipt.path));
});

test("S18 the CLI refuses an absent carrier with exit 2 and names it", (t) => {
  const root = makeRepo(t, { carrier: false });
  const run = runCli(root, [
    "journal", "headless",
    "--workflow", "ci",
    "--run-id", "42",
    "--actor", "bot",
    "--summary", "x",
    "--timestamp", TIMESTAMP,
  ]);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /carrier/u);
  assert.equal(fs.existsSync(path.join(root, JOURNAL_DIR)), false);
});

test("S14 the CLI refuses an incomplete provenance with exit 2 and names the cell", (t) => {
  const root = makeRepo(t);
  const run = runCli(root, ["journal", "headless", "--workflow", "ci", "--summary", "x", "--timestamp", TIMESTAMP]);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /run-id/u);
});

// ── the action's declared contract (S13, S16) ────────────────────────────

const ACTION = path.join(ACTION_DIR, "action.yml");
const action = () => fs.readFileSync(ACTION, "utf8");

test("S13 the action metadata declares the contract", () => {
  const text = action();
  assert.match(text, /^name: /mu);
  assert.match(text, /runs:\n {2}using: composite\n/mu, "a composite action, never a Docker or JS bundle");
  for (const input of ["summary", "decisions", "next", "issue", "files", "base", "block", "root"]) {
    assert.match(text, new RegExp(`^ {2}${input}:`, "mu"), `input ${input} is declared`);
  }
  for (const output of ["fragment", "name", "status"]) {
    assert.match(text, new RegExp(`^ {2}${output}:`, "mu"), `output ${output} is declared`);
  }
  assert.match(text, /\$GITHUB_ACTION_PATH\/headless\.mjs/u, "the step runs this directory's adapter");
  assert.doesNotMatch(text, /@\d+\.\d+\.\d+/u, "no crate version literal: the adapter derives it from its own tree");
});

test("S16 the action declares no forge surface, no token and no permission claim", () => {
  const text = action();
  assert.doesNotMatch(text, /^\s*permissions:/mu, "a composite action cannot set permissions; the caller's job does");
  for (const file of [ACTION, ADAPTER, path.join(PACKAGE_ROOT, "src", "journal", "headless.mjs")]) {
    const body = fs.readFileSync(file, "utf8");
    assert.equal(
      /gh api|api\.github\.com|GITHUB_TOKEN|GH_TOKEN|actions\/github-script/u.test(body),
      false,
      `${path.basename(file)} must not reach a forge`,
    );
  }
});

test("S17 the action passes its inputs through env, as a composite action requires", () => {
  const text = action();
  for (const input of ["SUMMARY", "DECISIONS", "NEXT", "ISSUE", "FILES", "BASE", "BLOCK", "ROOT"]) {
    assert.match(text, new RegExp(`INPUT_${input}: \\$\\{\\{ inputs\\.${input.toLowerCase()} \\}\\}`, "u"));
  }
});

// ── the adapter (S13, S16, S17) ──────────────────────────────────────────

const adapterEnv = (root, extra = {}) => ({
  ...process.env,
  GITHUB_WORKFLOW: "ci",
  GITHUB_RUN_ID: "42",
  GITHUB_ACTOR: "bot",
  INPUT_SUMMARY: "Shipped the headless journal action.",
  INPUT_ISSUE: "471",
  INPUT_ROOT: root,
  INPUT_BASE: "HEAD",
  AGENTIC_WORKFLOW_RUNNER: `${process.execPath} ${BIN}`,
  ...extra,
});

const runAdapter = (cwd, env) =>
  spawnSync(process.execPath, [ADAPTER], { cwd, encoding: "utf8", env });

test("S13 the adapter honours AGENTIC_WORKFLOW_RUNNER and reports its outputs", (t) => {
  const root = makeRepo(t);
  const outputFile = path.join(root, "github-output.txt");
  const run = runAdapter(root, adapterEnv(root, { GITHUB_OUTPUT: outputFile }));
  assert.equal(run.status, 0, run.stderr);

  const outputs = Object.fromEntries(
    fs
      .readFileSync(outputFile, "utf8")
      .split("\n")
      .filter((line) => line.includes("="))
      .map((line) => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]),
  );
  assert.equal(outputs.status, "written");
  assert.match(outputs.name, /^[0-9]{8}T[0-9]{6}Z-main-narrative-gha-42\.md$/u);
  assert.equal(fs.existsSync(outputs.fragment), true);
  assert.deepEqual(carrierNames(root), [outputs.name]);
});

test("S13 the adapter fails closed when no runner resolves", (t) => {
  const root = makeRepo(t);
  const emptyPath = fs.mkdtempSync(path.join(os.tmpdir(), "aw471-path-"));
  t.after(() => fs.rmSync(emptyPath, { recursive: true, force: true }));
  const run = runAdapter(root, adapterEnv(root, { AGENTIC_WORKFLOW_RUNNER: "", PATH: emptyPath }));
  assert.equal(run.status, 2);
  assert.match(run.stderr, /JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /AGENTIC_WORKFLOW_RUNNER|bun|npx/u);
  assert.deepEqual(carrierNames(root), []);
});

test("S17 the adapter refuses an incomplete GitHub context by name", (t) => {
  const root = makeRepo(t);
  const run = runAdapter(root, adapterEnv(root, { GITHUB_RUN_ID: "" }));
  assert.equal(run.status, 2);
  assert.match(run.stderr, /GITHUB_RUN_ID/u);
});

// ── the re-run promise survives aggregation (S13, D6 — verify blocker B1) ──

test("S13 a re-run after aggregation is a no-op the journal already carries", (t) => {
  const root = makeRepo(t, { journal: true });
  const first = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  assert.equal(first.status, "written");

  const consumed = aggregateJournal({ root });
  assert.deepEqual(consumed.appended, [first.name], "the fragment is consumed before the re-run");
  const logPath = path.join(root, "docs", "LOGS.md");
  const logBefore = fs.readFileSync(logPath, "utf8");

  const receipt = writeHeadlessJournal({ root, declaration: DECLARATION, context: CONTEXT, timestamp: TIMESTAMP });
  assert.equal(
    receipt.status,
    "already-present",
    "the run's entry already lives in the journal — a re-run never duplicates it",
  );
  assert.equal(receipt.path, logPath, "the receipt names where the entry lives now");
  assert.equal(receipt.bytes, Buffer.byteLength(logBefore, "utf8"), "bytes describes the file the path names");
  assert.equal(parseFragmentName(receipt.name).sessionId, "gha-42", "the reconstructed identity round-trips");
  assert.deepEqual(carrierNames(root), [], "nothing lands in the carrier");
  assert.equal(fs.readFileSync(logPath, "utf8"), logBefore, "detection is read-only — the log's bytes never move");

  const again = aggregateJournal({ root });
  assert.deepEqual(again.appended, [], "a later aggregation has nothing left to duplicate");
  const headings = fs
    .readFileSync(logPath, "utf8")
    .split("\n")
    .filter((line) => line.startsWith("## ") && line.includes("headless ci run 42"));
  assert.equal(headings.length, 1, "exactly one journal entry for the run");
});

// ── the runner chain honours both engine floors (S13, D8 — verify advisory A2) ──

/**
 * A private PATH home of fake executables: every runner records its argv, the
 * two launchers print a writer receipt, and `node` records if it is ever
 * spawned directly (the adapter must only probe it, never run it).
 */
function fakeRunner(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aw471-run-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const receipt = JSON.stringify({ ok: true, name: "m.md", path: path.join(dir, "m.md"), status: "written" });
  const argvScript = (name) => `printf '%s ' "$@" > "${dir}/${name}-argv.txt"\nprintf '%s\\n' '${receipt}'`;
  const write = (name, body) => fs.writeFileSync(path.join(dir, name), `#!/bin/sh\n${body}\n`, { mode: 0o755 });
  write("bunx", argvScript("bunx"));
  write("npx", argvScript("npx"));
  // `node` is probed for its version (the crate's engines floor) and never
  // launched with the crate: the version branch deliberately records no argv,
  // so `argvOf("node")` still answers "the adapter probes node, never runs it".
  write("node", `if [ "$1" = "--version" ]; then echo "v26.13.0"; exit 0; fi\n${argvScript("node")}`);
  const argvOf = (name) => {
    const file = path.join(dir, `${name}-argv.txt`);
    return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  };
  return { dir, write, argvOf };
}

const crateVersion = () => JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8")).version;

test("S13 the adapter resolves an eligible bun through bunx", (t) => {
  const root = makeRepo(t);
  const fake = fakeRunner(t);
  fake.write("bun", 'echo "1.4.5"');
  const run = runAdapter(root, adapterEnv(root, { AGENTIC_WORKFLOW_RUNNER: "", PATH: fake.dir }));
  assert.equal(run.status, 0, run.stderr);
  const argv = fake.argvOf("bunx");
  assert.ok(argv !== null && argv.includes(`@gtrabanco/agentic-workflow@${crateVersion()}`), "bunx launches the crate at its own version");
  assert.ok(argv.includes("journal headless"), "bunx runs the headless operation");
  assert.equal(fake.argvOf("npx"), null, "npx stays the fallback, never a second launch");
  assert.equal(fake.argvOf("node"), null, "the adapter probes node, never spawns it");
});

test("S13 the adapter never runs the crate on a bun below the engine floor", (t) => {
  const root = makeRepo(t);
  const fake = fakeRunner(t);
  fake.write("bun", 'echo "1.3.0"');
  const run = runAdapter(root, adapterEnv(root, { AGENTIC_WORKFLOW_RUNNER: "", PATH: fake.dir }));
  assert.equal(run.status, 0, run.stderr);
  const argv = fake.argvOf("npx");
  assert.ok(argv !== null && argv.includes(`--yes @gtrabanco/agentic-workflow@${crateVersion()}`), "the old bun falls through to npx at the crate version");
  assert.equal(fake.argvOf("bunx"), null, "bunx never launches under an engine below the manifest's floor");
  assert.equal(fake.argvOf("node"), null, "the adapter probes node, never spawns it");
});
