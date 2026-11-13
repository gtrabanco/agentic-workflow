/**
 * shared-doc-merge.test.mjs — issue #498 (layer 2): the file-class git merge
 * driver over the repository's shared documents.
 *
 * Frozen-failure corpus:
 *   FF-3 — two branches each inserting a different roadmap row merge
 *          mechanically into the union (fixture `git merge`, exit 0).
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
  // The attribute mapping is committed in the real tree; a fixture carries the
  // same lines so `git merge` dispatches to the armed drivers.
  writeFileSync(
    join(dir, ".gitattributes"),
    [
      "docs/ROADMAP.md merge=agentic-shared-roadmap",
      "docs/workflow/SKILL_CONTEXT_BUDGETS.json merge=agentic-shared-budgets",
      "docs/workflow/REPOSITORY_STATE.md merge=agentic-shared-repo-state",
      "docs/LOGS.md merge=agentic-shared-logs",
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

test("--install arms the four file classes in a fixture checkout, idempotently", () => {
  const repo = fixtureRepo();
  try {
    const first = run(["--install", "--repo", repo.dir], repo.dir);
    assert.equal(first.status, 0, first.stderr);
    assert.ok(first.stdout.includes("verdict: PASS"));
    for (const cls of ["roadmap", "budgets", "repo-state", "logs"]) {
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
