// test-obligation: protects=scripts/shared-doc-merge.mjs obligations=contract,failure-path

/**
 * shared-doc-merge.test.mjs — issue #498 (layer 2): the file-class git merge
 * driver over the repository's shared documents.
 *
 * Frozen-failure corpus:
 *   FF-3 — two branches each inserting a different roadmap row merge
 *          mechanically into the union (fixture `git merge`, exit 0).
 *   F-630-6…F-630-11 — the telemetry class (issue #630): both destinations
 *          resolve to it, two appended ledger rows and two appended JSONL lines
 *          union through a real `git merge`, a non-append side refuses closed
 *          leaving `%A` untouched, and an unregistered path or a wrong class
 *          still refuses.
 *   FF-4 — two branches flipping the same row's status exit nonzero and leave
 *          a real conflict for the human/agent.
 *   FF-6 — fail closed: a driver that guesses (unknown path, unreadable side,
 *          class mismatch) exits nonzero and leaves the conflict in place.
 *
 * Every scenario runs real `git merge` in a throwaway fixture repository
 * under mktemp; nothing here touches the live checkout (§4 live-tree guard).
 * Bun-first per the repo runtime convention (`node --test` is the fallback).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { SHARED_MERGE_CLASSES, classForPath } from "./shared-doc-merge.mjs";
import { COLUMNS, parseLedger } from "../packages/agentic-workflow/src/telemetry/ledger.mjs";

const SCRIPT = fileURLToPath(new URL("./shared-doc-merge.mjs", import.meta.url));
const RUNTIME = process.env.AGENTIC_WORKFLOW_RUNTIME === "node" ? "node" : "bun";
const run = (args, cwd) => spawnSync(RUNTIME, [SCRIPT, ...args], { cwd, encoding: "utf8" });

const ROADMAP_BASE = [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | slug | status | depends-on | description |",
  "|---|---|---|---|---|",
  "| 1 | first | idea | — | first row |",
  "| 2 | second | idea | — | second row |",
  "",
  "## Fixes",
  "",
  "| Issue | Topic | Status | Notes |",
  "|---|---|---|---|",
  "",
].join("\n");


/** `docs/LOGS.md`'s fixture: the header, intro prose, and two entries — the
 * exact block shape `renderEntryBlock` renders. */
const LOGS_BASE = [
  "# Logs",
  "",
  "Session journal intro.",
  "",
  "## 2026-11-09T15:04:20Z — main — narrative",
  "- **Commits:** 0",
  "- **Files:** —",
  "- **Summary:** the base entry",
  "",
  "## 2026-11-10T10:00:00Z — feat/x — narrative",
  "- **Commits:** 1 (`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)",
  "- **Summary:** another base entry",
  "",
].join("\n");

/** An empty `tier-cost@2` ledger with the published column list. */
function telemetryLedger(rows) {
  return [
    "# Ledger fixture",
    "",
    "```text",
    "tier-cost@2",
    "column | shape | what it holds",
    ...COLUMNS.map((column) => `${column} | <value> | a column`),
    "```",
    "",
    `| ${COLUMNS.join(" | ")} |`,
    `|${COLUMNS.map(() => "---").join("|")}|`,
    ...rows,
    "",
  ].join("\n");
}

/** One ledger row in the published column order. */
function telemetryRow(source) {
  const values = {
    unit: "null", phase: "null", version: "null", model: "m",
    changed_paths: "0", tokens: "10", turns: "1",
    input_tokens: "4", output_tokens: "2", cache_read_tokens: "1", cache_write_tokens: "1", reasoning_tokens: "2",
    model_ms: "5", tool_ms: "0", observed: "2026-11-18", source,
  };
  return `| ${COLUMNS.map((column) => values[column]).join(" | ")} |`;
}

/** One fixture git repository with the shared docs on `main`. */
function fixtureRepo() {
  const dir = mkdtempSync(join(tmpdir(), "aw-shared-merge-"));
  const git = (args) => spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8" });
  git(["init", "-q", "-b", "main"]);
  mkdirSync(join(dir, "docs", "workflow"), { recursive: true });
  writeFileSync(join(dir, "docs", "ROADMAP.md"), ROADMAP_BASE, "utf8");
  writeFileSync(
    join(dir, "docs", "workflow", "SKILL_CONTEXT_BUDGETS.json"),
    JSON.stringify({ schemaVersion: 1, routes: { "a:x": { estimateMax: 100 } } }, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(join(dir, "docs", "workflow", "REPOSITORY_STATE.md"), "# Frozen facts\n\n- fact: one\n", "utf8");
  writeFileSync(join(dir, "docs", "LOGS.md"), LOGS_BASE, "utf8");
  writeFileSync(join(dir, "docs", "workflow", "TIER_COST.md"), telemetryLedger([]), "utf8");
  mkdirSync(join(dir, ".pi", ".telemetry"), { recursive: true });
  writeFileSync(join(dir, ".pi", ".telemetry", "sessions.jsonl"), "", "utf8");
  // The attribute mapping is committed in the real tree; a fixture carries the
  // same lines so `git merge` dispatches to the armed drivers.
  writeFileSync(
    join(dir, ".gitattributes"),
    [
      "docs/ROADMAP.md merge=agentic-shared-roadmap",
      "docs/workflow/SKILL_CONTEXT_BUDGETS.json merge=agentic-shared-budgets",
      "docs/workflow/REPOSITORY_STATE.md merge=agentic-shared-repo-state",
      "docs/LOGS.md merge=agentic-shared-logs",
      "docs/workflow/TIER_COST.md merge=agentic-shared-telemetry",
      ".pi/.telemetry/sessions.jsonl merge=agentic-shared-telemetry",
      "",
    ].join("\n"),
    "utf8",
  );
  git(["add", "."]);
  git(["commit", "-q", "-m", "base"]);
  return { dir, git, release: () => rmSync(dir, { recursive: true, force: true }) };
}

/** Branch off the CURRENT main, change the roadmap, commit, return to main.
 * Called before main advances, so both branches sit on the base commit and
 * merging them in order gives git a true three-way merge with the driver in
 * the middle. All paths are absolute under the repo dir — never relative to
 * this process's cwd, which is the live checkout (the live-tree guard, §4). */
function diverge(repo, name, relPath, transform) {
  const { git, dir } = repo;
  git(["checkout", "-q", "-b", name]);
  const path = join(dir, relPath);
  const before = readFileSync(path, "utf8");
  const current = transform(before);
  if (current === before) throw new Error(`fixture bug: ${name}'s transform is a no-op on ${relPath} — the branch would fast-forward and never reach the driver`);
  writeFileSync(path, current, "utf8");
  git(["add", "."]);
  git(["commit", "-q", "-m", name]);
  git(["checkout", "-q", "main"]);
  return name;
}

function divergeJson(repo, name, transform) {
  return diverge(repo, name, "docs/workflow/SKILL_CONTEXT_BUDGETS.json", transform);
}

// ── arming ───────────────────────────────────────────────────────────────

test("--install arms every declared file class in a fixture checkout, idempotently", () => {
  const repo = fixtureRepo();
  try {
    const first = run(["--install", "--repo", repo.dir], repo.dir);
    assert.equal(first.status, 0, first.stderr);
    assert.ok(first.stdout.includes("verdict: PASS"));
    for (const cls of SHARED_MERGE_CLASSES) {
      const driver = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "config", "--local", "--get", `merge.agentic-shared-${cls}.driver`], { cwd: repo.dir, encoding: "utf8" });
      assert.equal(driver.status, 0, `merge.agentic-shared-${cls}.driver armed`);
      assert.ok(driver.stdout.includes(`shared-doc-merge.mjs ${cls}`));
    }
    // Re-install is a no-op verdict, not a rewrite.
    const second = run(["--install", "--repo", repo.dir], repo.dir);
    assert.equal(second.status, 0);
    assert.ok(second.stdout.includes("unchanged"));
  } finally {
    repo.release();
  }
});

test("--install refuses a directory that is not a git checkout (fail closed)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-shared-merge-nogit-"));
  try {
    const result = run(["--install", "--repo", dir], dir);
    assert.equal(result.status, 2);
    assert.ok(result.stderr.includes("REFUSAL"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── the driver form, through real git merges ─────────────────────────────

test("FF-3 — two branches each inserting a different roadmap row merge into the union (exit 0)", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    const ours = diverge(repo, "ours", "docs/ROADMAP.md", (text) =>
      text.replace("| 2 | second | idea | — | second row |", "| 2 | second | idea | — | second row |\n| 7 | gamma | idea | — | ours row |"),
    );
    const theirs = diverge(repo, "theirs", "docs/ROADMAP.md", (text) =>
      text.replace("| 2 | second | idea | — | second row |", "| 2 | second | idea | — | second row |\n| 8 | delta | idea | — | theirs row |"),
    );
    const advance = repo.git(["merge", "--no-edit", ours]);
    assert.equal(advance.status, 0, advance.stdout + advance.stderr);
    const merge = repo.git(["merge", "--no-edit", theirs]);
    assert.equal(merge.status, 0, merge.stdout + merge.stderr);
    const merged = readFileSync(join(repo.dir, "docs", "ROADMAP.md"), "utf8");
    assert.ok(merged.includes("| 7 | gamma | idea | — | ours row |"));
    assert.ok(merged.includes("| 8 | delta | idea | — | theirs row |"));
    assert.ok(merged.includes("| 1 | first | idea | — | first row |"));
    void ours;
  } finally {
    repo.release();
  }
});

test("FF-4 — two branches flipping the same row's status exit nonzero and leave a real conflict", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    diverge(repo, "ours", "docs/ROADMAP.md", (text) => text.replace("| 1 | first | idea |", "| 1 | first | done |"));
    const theirs = diverge(repo, "theirs", "docs/ROADMAP.md", (text) => text.replace("| 1 | first | idea |", "| 1 | first | in-progress |"));
    const advance = repo.git(["merge", "--no-edit", "ours"]);
    assert.equal(advance.status, 0, advance.stdout + advance.stderr);
    const merge = repo.git(["merge", "--no-edit", theirs]);
    assert.notEqual(merge.status, 0, "the semantic conflict must exit nonzero");
    const merged = readFileSync(join(repo.dir, "docs", "ROADMAP.md"), "utf8");
    assert.ok(merged.includes("<<<<<<<"), "ours marker present");
    assert.ok(merged.includes("======="), "separator present");
    assert.ok(merged.includes(">>>>>>>"), "theirs marker present");
    assert.ok(merged.includes("| 1 | first | done |"), "ours side of the conflict");
    assert.ok(merged.includes("| 1 | first | in-progress |"), "theirs side of the conflict");
    // The conflict is real: git lists the path as unmerged.
    const status = repo.git(["status", "--porcelain"]);
    assert.ok(status.stdout.includes("UU docs/ROADMAP.md"), status.stdout);
  } finally {
    repo.release();
  }
});

test("the budgets class merges structurally: different keys union, same leaf differing conflicts", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    const ours = divergeJson(repo, "ours", (text) => {
      const data = JSON.parse(text);
      data.routes["b:y"] = { estimateMax: 200 };
      return JSON.stringify(data, null, 2) + "\n";
    });
    const theirs = divergeJson(repo, "theirs", (text) => {
      const data = JSON.parse(text);
      data.routes["c:z"] = { estimateMax: 300 };
      return JSON.stringify(data, null, 2) + "\n";
    });
    const advance = repo.git(["merge", "--no-edit", ours]);
    assert.equal(advance.status, 0, advance.stdout + advance.stderr);
    const merge = repo.git(["merge", "--no-edit", theirs]);
    assert.equal(merge.status, 0, merge.stdout + merge.stderr);
    const merged = JSON.parse(readFileSync(join(repo.dir, "docs", "workflow", "SKILL_CONTEXT_BUDGETS.json"), "utf8"));
    assert.ok(merged.routes["b:y"]);
    assert.ok(merged.routes["c:z"]);
    void ours;
  } finally {
    repo.release();
  }
});

test("the repo-state class fails closed: any concurrent change to frozen facts is a conflict", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    diverge(repo, "ours", "docs/workflow/REPOSITORY_STATE.md", (text) => text.replace("- fact: one", "- fact: ours"));
    const theirs = diverge(repo, "theirs", "docs/workflow/REPOSITORY_STATE.md", (text) => text.replace("- fact: one", "- fact: theirs"));
    const advance = repo.git(["merge", "--no-edit", "ours"]);
    assert.equal(advance.status, 0, advance.stdout + advance.stderr);
    const merge = repo.git(["merge", "--no-edit", theirs]);
    assert.notEqual(merge.status, 0, "frozen facts never union silently");
    const merged = readFileSync(join(repo.dir, "docs", "workflow", "REPOSITORY_STATE.md"), "utf8");
    assert.ok(merged.includes("<<<<<<<"), "the conflict is left in place for the resolver");
  } finally {
    repo.release();
  }
});

test("FF-6 — the driver refuses a path outside the declared classes (fail closed)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-shared-merge-path-"));
  try {
    writeFileSync(join(dir, "ours.txt"), "a\n", "utf8");
    writeFileSync(join(dir, "theirs.txt"), "b\n", "utf8");
    const result = run([dir + "/ours.txt", dir + "/ours.txt", dir + "/theirs.txt", "3", "README.md"], dir);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("REFUSAL"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("FF-6 — an unreadable incoming side refuses closed (exit 1, conflict left)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-shared-merge-io-"));
  try {
    writeFileSync(join(dir, "ours.md"), "| 1 | a |\n", "utf8");
    const result = run([dir + "/base.md", dir + "/ours.md", dir + "/absent.md", "3", "docs/ROADMAP.md"], dir);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("REFUSAL"));
    assert.equal(readFileSync(join(dir, "ours.md"), "utf8"), "| 1 | a |\n", "ours untouched on refusal");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a malformed side refuses closed instead of guessing", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-shared-merge-bad-"));
  try {
    writeFileSync(join(dir, "base.md"), ROADMAP_BASE, "utf8");
    writeFileSync(join(dir, "ours.md"), ROADMAP_BASE, "utf8");
    writeFileSync(join(dir, "theirs.md"), "not a roadmap at all", "utf8");
    const result = run([dir + "/base.md", dir + "/ours.md", dir + "/theirs.md", "3", "docs/ROADMAP.md"], dir);
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("REFUSAL"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("usage errors exit 2", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-shared-merge-usage-"));
  try {
    assert.equal(run([], dir).status, 2);
    assert.equal(run(["--bogus"], dir).status, 2);
    assert.equal(run(["only-one"], dir).status, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── the logs class, through real git merges (S17) ─────────────────────────

test("FF-5 — two branches each appending a different LOGS entry merge into the union (exit 0)", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    const appendEntry = (stamp, summary) => (text) => `${text}\n## ${stamp} — fix/y — narrative\n- **Commits:** 2\n- **Summary:** ${summary}\n`;
    const ours = diverge(repo, "ours", "docs/LOGS.md", appendEntry("2026-11-11T08:00:00Z", "ours entry"));
    const theirs = diverge(repo, "theirs", "docs/LOGS.md", appendEntry("2026-11-11T09:00:00Z", "theirs entry"));
    const advance = repo.git(["merge", "--no-edit", ours]);
    assert.equal(advance.status, 0, advance.stdout + advance.stderr);
    const merge = repo.git(["merge", "--no-edit", theirs]);
    assert.equal(merge.status, 0, merge.stdout + merge.stderr);
    const merged = readFileSync(join(repo.dir, "docs", "LOGS.md"), "utf8");
    assert.ok(merged.includes("ours entry"), "ours' entry is in the union");
    assert.ok(merged.includes("theirs entry"), "theirs' entry is in the union");
    assert.ok(
      merged.indexOf("2026-11-11T08:00:00Z") < merged.indexOf("2026-11-11T09:00:00Z"),
      "the union is ordered by stamp",
    );
    assert.ok(merged.includes("the base entry"), "base entries carried through");
  } finally {
    repo.release();
  }
});

test("FF-5 — the same LOGS entry appended with different bodies exits nonzero and leaves a real conflict", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    const appendEntry = (stamp, summary) => (text) => `${text}\n## ${stamp} — fix/y — narrative\n- **Commits:** 2\n- **Summary:** ${summary}\n`;
    diverge(repo, "ours", "docs/LOGS.md", appendEntry("2026-11-11T08:00:00Z", "ours body"));
    const theirs = diverge(repo, "theirs", "docs/LOGS.md", appendEntry("2026-11-11T08:00:00Z", "theirs body"));
    const advance = repo.git(["merge", "--no-edit", "ours"]);
    assert.equal(advance.status, 0, advance.stdout + advance.stderr);
    const merge = repo.git(["merge", "--no-edit", theirs]);
    assert.notEqual(merge.status, 0, "the semantic conflict must exit nonzero");
    const merged = readFileSync(join(repo.dir, "docs", "LOGS.md"), "utf8");
    assert.ok(merged.includes("<<<<<<<"), "ours marker present");
    assert.ok(merged.includes("======="), "separator present");
    assert.ok(merged.includes(">>>>>>>"), "theirs marker present");
    assert.ok(merged.includes("ours body"), "ours side of the conflict");
    assert.ok(merged.includes("theirs body"), "theirs side of the conflict");
    const status = repo.git(["status", "--porcelain"]);
    assert.ok(status.stdout.includes("UU docs/LOGS.md"), status.stdout);
  } finally {
    repo.release();
  }
});

// ── issue #630 — the telemetry class ─────────────────────────────────────

test("F-630-6 — both telemetry destinations resolve to the one `telemetry` class", () => {
  assert.ok(SHARED_MERGE_CLASSES.includes("telemetry"), "the class is in the published vocabulary");
  assert.equal(classForPath("docs/workflow/TIER_COST.md"), "telemetry");
  assert.equal(classForPath(".pi/.telemetry/sessions.jsonl"), "telemetry");
  assert.equal(classForPath("docs/workflow/tier-cost.md"), null, "the map is exact, never a pattern");
});

test("F-630-7 — two branches each appending a ledger row merge into the union (exit 0, still a ledger)", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    diverge(repo, "ours", "docs/workflow/TIER_COST.md", (text) => text + `${telemetryRow("pi:session=ours")}\n`);
    diverge(repo, "theirs", "docs/workflow/TIER_COST.md", (text) => text + `${telemetryRow("pi:session=theirs")}\n`);
    const merged = repo.git(["merge", "ours", "--no-edit"]);
    assert.equal(merged.status, 0, merged.stderr);
    const after = repo.git(["merge", "theirs", "--no-edit"]);
    assert.equal(after.status, 0, after.stderr);
    const text = readFileSync(join(repo.dir, "docs/workflow/TIER_COST.md"), "utf8");
    assert.ok(!text.includes("<<<<<<<"), "no conflict marker survives the union");
    assert.ok(text.includes("pi:session=ours") && text.includes("pi:session=theirs"));
    const parsed = parseLedger(text);
    assert.equal(parsed.error, undefined, parsed.detail);
    assert.deepEqual(parsed.rows.map((row) => row.source).sort(), ["pi:session=ours", "pi:session=theirs"]);
  } finally {
    repo.release();
  }
});

test("F-630-8 — a side that is not an append refuses closed and leaves %A untouched", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    // main carries two rows; ours only appends, theirs rewrites the first row.
    writeFileSync(
      join(repo.dir, "docs/workflow/TIER_COST.md"),
      telemetryLedger([telemetryRow("pi:session=base"), telemetryRow("pi:session=second")]),
      "utf8",
    );
    repo.git(["add", "."]);
    repo.git(["commit", "-q", "-m", "two rows"]);
    diverge(repo, "ours", "docs/workflow/TIER_COST.md", (text) => text + `${telemetryRow("pi:session=ours")}\n`);
    // The incoming side both appends (so the merge really conflicts at EOF and
    // the driver runs) and rewrites a committed row (so it is no longer an
    // append). The second half is the one the class must refuse.
    const theirs = diverge(repo, "theirs", "docs/workflow/TIER_COST.md", (text) =>
      `${text + telemetryRow("pi:session=theirs")}\n`.replace("pi:session=second", "pi:session=EDITED"),
    );
    const oursContent = repo.git(["show", "ours:docs/workflow/TIER_COST.md"]).stdout;
    assert.equal(repo.git(["merge", "ours", "--no-edit"]).status, 0, "ours is a fast-forward");
    const merged = repo.git(["merge", theirs, "--no-edit"]);
    assert.notEqual(merged.status, 0, "a rewrite of a committed row is a real conflict");
    const left = readFileSync(join(repo.dir, "docs/workflow/TIER_COST.md"), "utf8");
    assert.equal(left.trimEnd(), oursContent.trimEnd(), "%A still holds ours — the driver never rewrote it");
    assert.ok(repo.git(["merge", "--abort"]).status === 0);
  } finally {
    repo.release();
  }
});

test("F-630-9 — two branches each appending JSONL lines merge into the union, deduplicated", () => {
  const repo = fixtureRepo();
  try {
    run(["--install", "--repo", repo.dir], repo.dir);
    const shared = '{"source":"pi:session=both","tokens":2}\n';
    writeFileSync(join(repo.dir, ".pi/.telemetry/sessions.jsonl"), shared, "utf8");
    repo.git(["add", "-f", "."]);
    repo.git(["commit", "-q", "-m", "shared line"]);
    diverge(repo, "ours", ".pi/.telemetry/sessions.jsonl", (text) => text + '{"source":"pi:session=ours","tokens":3}\n');
    diverge(repo, "theirs", ".pi/.telemetry/sessions.jsonl", (text) => text + '{"source":"pi:session=theirs","tokens":4}\n');
    assert.equal(repo.git(["merge", "ours", "--no-edit"]).status, 0);
    const merged = repo.git(["merge", "theirs", "--no-edit"]);
    assert.equal(merged.status, 0, merged.stderr);
    const text = readFileSync(join(repo.dir, ".pi/.telemetry/sessions.jsonl"), "utf8");
    assert.ok(!text.includes("<<<<<<<"));
    const sources = text.trim().split("\n").map((line) => JSON.parse(line).source);
    assert.deepEqual(sources.sort(), ["pi:session=both", "pi:session=ours", "pi:session=theirs"]);
  } finally {
    repo.release();
  }
});

test("F-630-10 — an unregistered path still refuses (the class map is exact)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw630-paths-"));
  try {
    const side = (name, text) => {
      const file = join(dir, name);
      writeFileSync(file, text, "utf8");
      return file;
    };
    const base = side("base", "x\n");
    const ours = side("ours", "x\ny\n");
    const theirs = side("theirs", "x\nz\n");
    const refused = run(["telemetry", base, ours, theirs, "7", "docs/workflow/COSTS.md"], dir);
    assert.equal(refused.status, 1);
    assert.ok(refused.stderr.includes("unknown-path"));
    const mismatch = run(["telemetry", base, ours, theirs, "7", "docs/LOGS.md"], dir);
    assert.equal(mismatch.status, 1);
    assert.ok(mismatch.stderr.includes("class-mismatch"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("correction A4 — the plain form (%O %A %B %L %P) infers the class from the named path, and still refuses an unknown one", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw630-plain-"));
  try {
    const side = (name, text) => {
      const file = join(dir, name);
      writeFileSync(file, text, "utf8");
      return file;
    };
    // Git invokes a merge driver armed without the class prefix as `%O %A %B %L %P` —
    // five arguments, the named path at index 4. The module's own contract says the
    // class is then inferred from the named path; the inference must fire and the
    // union must resolve exactly as the class-prefixed form resolves.
    const header = "| id | status | topic |";
    const sep = "|---|---|---|";
    const row = (id, status, topic) => `| ${id} | ${status} | ${topic} |`;
    const baseText = `# Roadmap\n\n${header}\n${sep}\n${row(1, "done · [#1]", "a")}\n`;
    const oursText = `${baseText}${row(2, "open", "b")}\n`;
    const theirsText = `${baseText}${row(3, "open", "c")}\n`;
    const ours = side("plain-ours", oursText);
    const merged = run([side("plain-base", baseText), ours, side("plain-theirs", theirsText), "7", "docs/ROADMAP.md"], dir);
    assert.equal(merged.status, 0, merged.stderr);
    const union = readFileSync(ours, "utf8");
    assert.ok(!union.includes("<<<<<<<"), "no conflict marker survives the union");
    for (const topic of ["a", "b", "c"]) assert.ok(union.includes(`| ${topic} |`), `row ${topic} survives`);

    // A plain-form path no class owns is still a refusal, never a guess — and it
    // names the path the driver was handed, not the base temp file.
    const unknown = run([side("plain-base-2", "x\n"), side("plain-ours-2", "x\ny\n"), side("plain-theirs-2", "x\nz\n"), "7", "docs/workflow/COSTS.md"], dir);
    assert.equal(unknown.status, 1);
    assert.ok(unknown.stderr.includes("unknown-path"));
    assert.ok(unknown.stderr.includes("docs/workflow/COSTS.md"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
