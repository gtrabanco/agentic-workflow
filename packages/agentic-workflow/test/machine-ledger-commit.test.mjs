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
import { readFileSync } from "node:fs";
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
  foreignPorcelainLines,
  foreignPorcelainPaths,
  foreignStatusPaths,
  isMachineLedgerPath,
} from "../src/machine-ledger/index.mjs";
import { main as sessionCloseMain } from "../src/session-close/index.mjs";
import { main as commitMain } from "../src/telemetry/commit.mjs";
import { COLUMNS } from "../src/telemetry/ledger.mjs";
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

test("foreignPorcelain names every non-exempt entry and never the class's (the filter every verdict refuses foreign files through)", () => {
  const porcelain = " M docs/workflow/TIER_COST.md\n M src/app.ts\n?? docs/LOGS.md\n M docs/features/502-nan-publish-stable/review-findings.md\n";
  assert.deepEqual(foreignPorcelainPaths(porcelain), ["src/app.ts"]);
  // The trimmed lines keep the letters: a consumer that printed paths instead
  // would silently drop the staged/modified distinction.
  assert.deepEqual(foreignPorcelainLines(porcelain), ["M src/app.ts"]);
});

test("foreignPorcelain keeps git's rename and quoting shapes", () => {
  const porcelain = 'R  a.txt -> b.txt\n M "weird name.txt"\n';
  assert.deepEqual(foreignPorcelainPaths(porcelain), ["b.txt", "weird name.txt"]);
  assert.deepEqual(foreignPorcelainLines(porcelain), ['R  a.txt -> b.txt'.trim(), 'M "weird name.txt"']);
});

test("foreignPorcelain answers an empty porcelain with an empty list", () => {
  assert.deepEqual(foreignPorcelainLines(""), []);
  assert.deepEqual(foreignPorcelainPaths(""), []);
});

test("foreignPorcelain reads the arrow as a rename only on the rename letters (a ledger-named file is not a carve)", () => {
  // A file whose own path carries ` -> ` is data, never a rename: judged by its
  // tail it would land on an exempt ledger and vanish from every verdict.
  const spoof = '?? "evil -> docs/LOGS.md"\n M "a -> .agentic-workflow/journal/leak.sh"\n';
  assert.deepEqual(foreignPorcelainPaths(spoof), ["evil -> docs/LOGS.md", "a -> .agentic-workflow/journal/leak.sh"]);
  assert.equal(foreignPorcelainLines(spoof).length, 2, "the spoof entries stay foreign");
  // A real rename is exempt only when BOTH sides are: work moved out of an
  // ordinary file into a ledger is still work on that file.
  assert.deepEqual(foreignPorcelainPaths("R  notes.txt -> docs/LOGS.md"), ["docs/LOGS.md"]);
  assert.deepEqual(foreignPorcelainPaths("R  docs/LOGS.md -> notes.txt"), ["notes.txt"]);
  assert.deepEqual(foreignPorcelainLines("R  docs/workflow/TIER_COST.md -> docs/LOGS.md"), []);
});

test("foreignPorcelain resolves git's C-quoted paths to their bytes", () => {
  assert.deepEqual(foreignPorcelainPaths('?? "caf\\303\\251.txt"'), ["café.txt"]);
  assert.deepEqual(foreignPorcelainPaths('?? "tab\\there.txt"'), ["tab\there.txt"]);
});

test("foreignStatusPaths drops the header and returns the paths a sensor reasons about", () => {
  assert.deepEqual(foreignStatusPaths("## feat/727\n M docs/workflow/TIER_COST.md\n?? app.ts\n M src/app.ts\n"), ["app.ts", "src/app.ts"]);
  // A rename into an exempt path is still work on the file it came from.
  assert.deepEqual(foreignStatusPaths("## feat/727\nR  old.txt -> docs/LOGS.md\n"), ["docs/LOGS.md"]);
  assert.deepEqual(foreignStatusPaths("R  docs/workflow/TIER_COST.md -> docs/LOGS.md\n"), []);
});

test("the type projection declares exactly the module's exports", async () => {
  // Same rule as `tool-choice/policy.d.mts` F19: the .d.mts beside the module
  // is a projection, and its names never drift from the module's.
  const source = readFileSync(new URL("../src/machine-ledger/index.d.mts", import.meta.url), "utf8");
  const declared = [...source.matchAll(/export declare (?:const|function|interface) (\w+)/gu)].map((match) => match[1]);
  const module = await import("../src/machine-ledger/index.mjs");
  const runtime = Object.keys(module).filter((key) => key !== "default");
  assert.deepEqual(declared.sort(), runtime.sort(), "index.d.mts and index.mjs export different names");
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

test("a lock whose writer is gone is evicted, and a live holder keeps it however old the file is", () => {
  const dir = sandbox();
  appendRow(dir);
  const gitPath = mustGit(dir, ["rev-parse", "--git-path", "agentic-machine-ledger.lock"]);
  const lock = path.isAbsolute(gitPath) ? gitPath : path.join(dir, gitPath);
  fs.mkdirSync(path.dirname(lock), { recursive: true });

  // A dead writer's lock: the recorded pid exits before the next writer looks.
  const dead = spawnSync(process.execPath, ["-e", "process.exit(0)"], { encoding: "utf8" });
  assert.equal(dead.status, 0);
  fs.writeFileSync(lock, `${dead.pid}\n`);
  const old = new Date(Date.now() - 10 * 60_000);
  fs.utimesSync(lock, old, old);
  const stale = commitMachineLedgers({ root: dir, zone: "auto" });
  assert.equal(stale.status, "committed", "a lock no live pid owns is abandoned");
  assert.equal(fs.existsSync(lock), false, "the release removes our own lock and nothing else");

  // A live holder keeps the lock however old its mtime is: its exclusion is the
  // whole point, and evicting it would let two commits interleave.
  appendRow(dir, "728");
  fs.writeFileSync(lock, `${process.pid}\n`);
  fs.utimesSync(lock, old, old);
  const held = commitMachineLedgers({ root: dir, zone: "auto" });
  assert.equal(held.status, "locked");
  assert.equal(fs.existsSync(lock), true, "a live holder's lock survives a stale mtime");
  fs.rmSync(lock, { force: true });
});

test("a class that names no literal path is answered unsweepable, never a confident clean", () => {
  const dir = sandbox();
  fs.mkdirSync(path.join(dir, "docs", "fix", "900-x"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "fix", "900-x", "decisions.md"), "- a decision\n");
  const result = commitMachineLedgers({ root: dir, classes: ["unit-ledgers"] });
  assert.equal(result.status, "unsweepable");
  assert.equal(result.committed, false);
  assert.match(result.detail, /no literal path/u);
  const byZone = commitMachineLedgers({ root: dir, zone: "writer-step" });
  assert.equal(byZone.status, "unsweepable", "a zone mixing literal and pattern rows is refused, not half-swept");
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

  const [head, previousHead] = mustGit(dir, ["log", "-2", "--format=%s"]).split("\n");
  assert.match(head, /^chore\(telemetry\)/u, "the ledger's own commit follows the log's");
  assert.match(previousHead, /^docs\(log\): second entry/u, "the log commit keeps its own message and range");
  assert.equal(mustGit(dir, ["show", "--name-only", "--format=", "HEAD"]), "docs/workflow/TIER_COST.md");
  assert.equal(mustGit(dir, ["show", "--name-only", "--format=", "HEAD~1"]), "docs/LOGS.md", "the log was committed alone first");
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
  const grammar = ["```text", "tier-cost@2", ...COLUMNS.map((column) => `${column} | \`<cell>\` | fixture`), "```"].join("\n");
  const table = [`| ${COLUMNS.join(" | ")} |`, `| ${COLUMNS.map(() => "---").join(" | ")} |`].join("\n");
  fs.writeFileSync(path.join(dir, "docs", "workflow", "TIER_COST.md"), `# Tier cost\n\n${grammar}\n\n${table}\n`);
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
  assert.match(mustGit(dir, ["show", "HEAD", "--", "docs/workflow/TIER_COST.md"]), /\+\|.*pi:reconstruct=session-727/u, "the commit carries the row it appended");
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

test("the command honours --json by silencing the human line and keeping the envelope", () => {
  const dir = sandbox();
  appendRow(dir);
  const quiet = { out: "", err: "" };
  const code = commitMain(["--repo", dir, "--json"], {
    cwd: dir,
    stdout: (text) => { quiet.out += text; },
    stderr: (text) => { quiet.err += text; },
  });
  assert.equal(code, 0);
  assert.deepEqual(JSON.parse(quiet.out), JSON.parse(quiet.out), "stdout stays the envelope");
  assert.equal(JSON.parse(quiet.out).status, "committed");
  assert.equal(quiet.err, "", "--json silences the human line it documents as suppressed");

  const loud = { out: "", err: "" };
  commitMain(["--repo", dir], { cwd: dir, stdout: (text) => { loud.out += text; }, stderr: (text) => { loud.err += text; } });
  assert.match(loud.err, /machine-ledger-commit: clean/u, "the default still reports on stderr");
});

test("an unsweepable class exits 1 with its refusal on stderr, never 0 as a clean night", () => {
  const dir = sandbox();
  const capture = { out: "", err: "" };
  const code = commitMain(["--repo", dir, "--class", "unit-ledgers"], {
    cwd: dir,
    stdout: (text) => { capture.out += text; },
    stderr: (text) => { capture.err += text; },
  });
  assert.equal(code, 1);
  assert.equal(JSON.parse(capture.out).status, "unsweepable");
  assert.match(capture.err, /unsweepable/u);
});
