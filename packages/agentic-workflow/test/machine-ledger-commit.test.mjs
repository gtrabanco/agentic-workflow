#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/machine-ledger/index.mjs obligations=contract,failure-path,convention

/**
 * machine-ledger-commit.test.mjs — the machine-owned ledger class and its one
 * commit (issue #727 S1a/S1b).
 *
 * The class exists because a ledger whose writer is a *process* can never be
 * committed by the session that paid for it: the row lands after the session's
 * last chance to commit, and asking a model to commit it re-dirties the file
 * with its own row. The commit is therefore mechanical, path-scoped and
 * lock-serialised — never `git add -A` (the #182 lesson), never a rewrite, and
 * never a silent failure the caller cannot see.
 *
 * Every case runs against a throwaway checkout: nothing here touches the
 * repository that holds it.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  MACHINE_LEDGER_CLASSES,
  MACHINE_LEDGER_ZONES,
  autoLedgerPaths,
  commitMachineLedgers,
  isMachineLedgerPath,
} from "../src/machine-ledger/index.mjs";
import { main as sessionCloseMain } from "../src/session-close/index.mjs";
import { main as reconstructMain } from "../src/telemetry/reconstruct.mjs";

const IDENTITY = ["-c", "user.name=Fixture Human", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false"];

function git(dir, args) {
  const result = spawnSync("git", [...IDENTITY, ...args], { cwd: dir, encoding: "utf8" });
  return { status: result.status, out: (result.stdout ?? "").trim(), err: (result.stderr ?? "").trim() };
}

function mustGit(dir, args) {
  const result = git(dir, args);
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.err}`);
  return result.out;
}

/** A throwaway checkout with one commit and the ledger the class declares. */
function sandbox({ ledger = "| unit | tokens |\n| --- | --- |\n| 1 | 10 |\n" } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "machine-ledger-"));
  mustGit(dir, ["init", "-q", "-b", "feat/727-fixture"]);
  fs.mkdirSync(path.join(dir, "docs", "workflow"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "workflow", "TIER_COST.md"), ledger);
  fs.writeFileSync(path.join(dir, "app.ts"), "export const one = 1;\n");
  mustGit(dir, ["add", "."]);
  mustGit(dir, ["commit", "-q", "-m", "chore: base"]);
  return dir;
}

/** One appended row, the way the telemetry sink writes it. */
function appendRow(dir, unit = "727") {
  const file = path.join(dir, "docs", "workflow", "TIER_COST.md");
  fs.appendFileSync(file, `| ${unit} | 42 |\n`);
  return file;
}

const subjects = (dir) => mustGit(dir, ["log", "--format=%s"]);
const commits = (dir) => mustGit(dir, ["rev-list", "--count", "HEAD"]);

test("the class declares a zone and a subject for every row, from a closed vocabulary", () => {
  assert.ok(MACHINE_LEDGER_CLASSES.length >= 6, "the .gitattributes classes and the carrier are all declared");
  for (const row of MACHINE_LEDGER_CLASSES) {
    assert.match(row.class, /^[a-z][a-z-]*$/u, `class id ${row.class}`);
    assert.ok(MACHINE_LEDGER_ZONES.includes(row.zone), `zone ${row.zone} of ${row.class}`);
    assert.match(row.subject, /^[a-z]+\([a-z-]+\)$/u, `subject ${row.subject} of ${row.class}`);
    assert.ok(Array.isArray(row.paths) || typeof row.pattern === "string", `${row.class} declares where it lives`);
    if (row.zone === "auto") assert.ok(Array.isArray(row.paths), `${row.class} is swept by literal paths`);
  }
  const auto = MACHINE_LEDGER_CLASSES.filter((row) => row.zone === "auto").map((row) => row.class);
  assert.deepEqual(auto, ["telemetry", "session-log", "journal-corpus"], "the machinery-owned zone is exactly the three ledgers no step writes");
  assert.deepEqual(autoLedgerPaths(), [
    "docs/workflow/TIER_COST.md",
    "docs/LOGS.md",
    ".agentic-workflow/journal",
  ]);
});

test("the class recognises its own paths and nothing else", () => {
  for (const row of MACHINE_LEDGER_CLASSES) {
    for (const literal of row.paths ?? []) {
      assert.equal(isMachineLedgerPath(literal), true, literal);
      assert.equal(isMachineLedgerPath(`${literal}/nested.md`), row.class === "journal-corpus", `${literal} is a file unless it is a directory`);
    }
  }
  assert.equal(isMachineLedgerPath("docs/fix/727-machine-ledger-commits/review-findings.md"), true);
  assert.equal(isMachineLedgerPath("docs/features/61-x/decisions.md"), true);
  assert.equal(isMachineLedgerPath("docs/fix/727-machine-ledger-commits/SPEC.md"), false);
  assert.equal(isMachineLedgerPath("app.ts"), false);
});

test("commits the named paths alone under the class subject and leaves a foreign staged file behind", () => {
  const dir = sandbox();
  appendRow(dir);
  fs.writeFileSync(path.join(dir, "app.ts"), "export const one = 1;\nexport const two = 2;\n");
  mustGit(dir, ["add", "app.ts"]);

  const result = commitMachineLedgers({ root: dir, zone: "auto", subject: "chore(telemetry): machine ledger rows" });

  assert.equal(result.status, "committed");
  assert.equal(result.paths.length, 1);
  assert.equal(result.paths[0], "docs/workflow/TIER_COST.md");
  assert.match(mustGit(dir, ["log", "-1", "--format=%s"]), /^chore\(telemetry\): machine ledger rows$/u);
  assert.equal(mustGit(dir, ["show", "--name-only", "--format=", "HEAD"]), "docs/workflow/TIER_COST.md", "the commit names the ledger alone");
  assert.match(mustGit(dir, ["status", "--porcelain"]), /^M  app\.ts$/mu, "the foreign staged file is still staged, not committed");
  assert.match(mustGit(dir, ["status", "--porcelain"]), /^M app\.ts$|^M  app\.ts$/mu);
});

test("a clean class commits nothing", () => {
  const dir = sandbox();
  const before = commits(dir);
  const result = commitMachineLedgers({ root: dir, zone: "auto" });
  assert.equal(result.status, "clean");
  assert.equal(result.committed, false);
  assert.equal(commits(dir), before, "no empty commit is invented");
});

test("a held lock answers locked instead of committing twice", () => {
  const dir = sandbox();
  appendRow(dir);
  const gitPath = mustGit(dir, ["rev-parse", "--git-path", "agentic-machine-ledger.lock"]);
  const lock = path.isAbsolute(gitPath) ? gitPath : path.join(dir, gitPath);
  fs.mkdirSync(path.dirname(lock), { recursive: true });
  fs.writeFileSync(lock, `${process.pid}\n`);
  const before = commits(dir);
  try {
    const result = commitMachineLedgers({ root: dir, zone: "auto" });
    assert.equal(result.status, "locked");
    assert.equal(result.committed, false);
    assert.equal(commits(dir), before, "a foreign lock wins: rows wait for the next cycle");
  } finally {
    fs.rmSync(lock, { force: true });
  }
  // The lock is released, so the next cycle commits the row it left behind.
  const after = commitMachineLedgers({ root: dir, zone: "auto" });
  assert.equal(after.status, "committed");
});

test("a directory outside a checkout answers not-a-repository", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "machine-ledger-plain-"));
  const result = commitMachineLedgers({ root: dir, zone: "auto" });
  assert.equal(result.status, "not-a-repository");
  assert.equal(result.committed, false);
});

test("an unknown class id is refused instead of silently committing nothing", () => {
  const dir = sandbox();
  appendRow(dir);
  assert.throws(() => commitMachineLedgers({ root: dir, classes: ["nope"] }), /unknown machine-ledger class/u);
});

test("session-close close commits the log alone, then the ledger alone", () => {
  const dir = sandbox();
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "LOGS.md"), "# Logs\n\n## Session 1\n\n- **Summary:** fixture entry\n");
  mustGit(dir, ["add", "."]);
  mustGit(dir, ["commit", "-q", "-m", "docs: log base"]);
  fs.appendFileSync(path.join(dir, "docs", "LOGS.md"), "\n## Session 2\n\n- **Summary:** second entry\n");
  appendRow(dir, "SESSION-2");

  const previous = process.cwd();
  process.chdir(dir);
  try {
    sessionCloseMain(["close"]);
  } finally {
    process.chdir(previous);
  }

  assert.match(subjects(dir), /^chore\(telemetry\)/mu, "the ledger's own commit follows the log's");
  const [subject, files] = mustGit(dir, ["log", "-2", "--format=%s", "--name-only"]).split("\n\n");
  assert.match(subject, /^docs\(log\): second entry/u, "the log commit keeps its own message and range");
  assert.match(files, /docs\/LOGS\.md/u);
  assert.equal(mustGit(dir, ["show", "--name-only", "--format=", "HEAD"]), "docs/workflow/TIER_COST.md");
  assert.equal(mustGit(dir, ["status", "--porcelain"]), "", "the tree the session leaves is clean");
});

test("reconstruct write commits the ledger it appended to", () => {
  const dir = sandbox();
  const agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "machine-ledger-pi-"));
  const sessionDir = path.join(agentDir, "sessions", "s1");
  fs.mkdirSync(sessionDir, { recursive: true });
  const header = { type: "session", id: "session-727", cwd: dir, timestamp: "2026-11-26T10:00:00.000Z" };
  const message = {
    type: "message",
    message: { role: "assistant", model: "fixture/model", usage: { totalTokens: 120, input: 100, output: 20 }, durationMs: 1000 },
  };
  fs.writeFileSync(path.join(sessionDir, "transcript.jsonl"), `${JSON.stringify(header)}\n${JSON.stringify(message)}\n`);
  const ledgerHeader = fs.readFileSync(path.join(dir, "docs", "workflow", "TIER_COST.md"), "utf8");
  fs.writeFileSync(
    path.join(dir, "docs", "workflow", "TIER_COST.md"),
    [
      "# Tier cost",
      "",
      "```text",
      "tier-cost@2",
      "unit | phase | version | model | changed_paths | tokens | turns | input_tokens | output_tokens | cache_read_tokens | cache_write_tokens | reasoning_tokens | model_ms | tool_ms | observed | source",
      "```",
      "",
      ledgerHeader.split("\n").slice(2).join("\n"),
    ].join("\n"),
  );
  mustGit(dir, ["add", "."]);
  mustGit(dir, ["commit", "-q", "-m", "docs: ledger grammar"]);

  const previous = { cwd: process.cwd(), env: process.env.PI_CODING_AGENT_DIR };
  process.chdir(dir);
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    reconstructMain(["reconstruct", "write"]);
  } finally {
    process.chdir(previous.cwd);
    if (previous.env === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous.env;
  }

  assert.match(subjects(dir), /^chore\(telemetry\)/mu, "the reconstruction commits the rows it appended");
  assert.equal(mustGit(dir, ["show", "--name-only", "--format=", "HEAD"]), "docs/workflow/TIER_COST.md");
  assert.match(mustGit(dir, ["log", "-1", "--format=%B"]), /pi:reconstruct=session-727/u);
});

test("reconstruct write leaves a project without a ledger alone", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "machine-ledger-noledger-"));
  mustGit(dir, ["init", "-q", "-b", "main"]);
  fs.writeFileSync(path.join(dir, "README.md"), "no ledger here\n");
  mustGit(dir, ["add", "."]);
  mustGit(dir, ["commit", "-q", "-m", "chore: base"]);
  const agentDir = fs.mkdtempSync(path.join(os.tmpdir(), "machine-ledger-pi-none-"));
  const before = commits(dir);
  const previous = { cwd: process.cwd(), env: process.env.PI_CODING_AGENT_DIR };
  process.chdir(dir);
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    reconstructMain(["reconstruct", "write"]);
  } finally {
    process.chdir(previous.cwd);
    if (previous.env === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous.env;
  }
  assert.equal(commits(dir), before, "an absent ledger commits nothing at all");
});
