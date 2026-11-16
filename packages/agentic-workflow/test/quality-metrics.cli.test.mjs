/**
 * quality-metrics.cli.test.mjs — the command's surface (feature 558, issue #565,
 * unit docs/features/558-quality-sensor/).
 *
 * Everything here drives the real bin over a throwaway repository and a `gh`
 * PATH-stub, so the assertions cover the readers, the window arithmetic, the
 * refusal contract and the two invariants a sensor is judged on: it writes
 * nothing it was not asked to write, and its diagnostics never touch stdout.
 *
 * The fixture is built rather than found: four commits with one real
 * `git revert`, three `gh` answers, and one unit doc carrying an open findings
 * row — enough to pin every metric at a known value.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateQualityMetrics } from "@gtrabanco/agentic-workflow-schema";
import { GIT_CONFIG, git, sandboxGitEnv } from "./fixtures.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const UNTIL = "2026-11-16T00:00:00.000Z";

const ghStub = (root) => {
  const dir = path.join(root, "bin");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "gh");
  writeFileSync(
    file,
    [
      "#!/usr/bin/env bash",
      "# PATH-stub for gh: three list reads, each answering its own fixture JSON.",
      "# $QM_GH_EXIT forces a failure (the fail-closed matrix).",
      'case "$*" in',
      '  *"--json number,createdAt,mergedAt,mergeCommit"*) printf \'%s\\n\' "${QM_GH_MERGED:-[]}" ;;',
      '  *"--json number,mergedAt,commits"*) printf \'%s\\n\' "${QM_GH_SAMPLES:-[]}" ;;',
      '  *"--json number,createdAt,reviews"*) printf \'%s\\n\' "${QM_GH_CREATED:-[]}" ;;',
      "  *) exit 3 ;;",
      "esac",
      '[ -z "${QM_GH_EXIT:-}" ] || exit "$QM_GH_EXIT"',
      "",
    ].join("\n"),
  );
  chmodSync(file, 0o755);
  return dir;
};

/** The open findings row the corpus fixture carries. */
const FINDINGS_TABLE = [
  "| id | S# / file:line | axis | severity | impact | class | route |",
  "|---|---|---|---|---|---|---|",
  "| F1 | S1 · src/a.mjs:1 | code | WARNING | blocking | source | fold |",
  "",
].join("\n");

function fixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), "qm-cli-"));
  const repo = path.join(root, "repo");
  mkdirSync(repo, { recursive: true });

  // The fixture's instants are pinned, never "now": the window is pinned too, and
  // a wall-clock commit would drift past its end and empty the report.
  const gitAt = (date, ...args) => {
    const result = spawnSync("git", [...GIT_CONFIG, "-C", repo, ...args], {
      encoding: "utf8",
      env: { ...sandboxGitEnv(), GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    });
    if (result.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    return result.stdout.trimEnd();
  };
  const write = (rel, content) => {
    mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
    writeFileSync(path.join(repo, rel), content);
  };
  const commit = (date, message, files) => {
    for (const [rel, content] of Object.entries(files)) write(rel, content);
    gitAt(date, "add", "-A");
    gitAt(date, "commit", "-qm", message);
  };

  gitAt("2026-09-01T00:00:00Z", "init", "-q", "-b", "main");
  commit("2026-09-01T00:00:00Z", "base", { "README.md": "base\n" });
  commit("2026-09-01T01:00:00Z", "feat: one", { "src/feature.mjs": "export const one = 1;\n" });
  const reverted = gitAt("2026-09-01T02:00:00Z", "rev-parse", "HEAD");
  gitAt("2026-09-02T00:00:00Z", "revert", "--no-edit", "HEAD");
  commit("2026-09-03T00:00:00Z", "feat: two", { "src/other.mjs": "export const two = 2;\n" });
  commit("2026-09-04T00:00:00Z", "docs: unit doc", {
    "docs/features/100-fixture/SPEC.md": `# 100 — fixture\n\n## Findings\n\n${FINDINGS_TABLE}\n## Log\n\n`,
  });

  const stubDir = ghStub(root);
  const env = {
    ...sandboxGitEnv(),
    PATH: `${stubDir}:${process.env.PATH}`,
    QM_GH_MERGED: JSON.stringify([
      { number: 1, createdAt: "2026-09-05T00:00:00Z", mergedAt: "2026-09-05T10:00:00Z", mergeCommit: { oid: reverted } },
      { number: 2, createdAt: "2026-09-06T00:00:00Z", mergedAt: "2026-09-06T10:00:00Z", mergeCommit: { oid: "b".repeat(40) } },
    ]),
    QM_GH_SAMPLES: JSON.stringify([
      { number: 1, mergedAt: "2026-09-05T10:00:00Z", commits: [{ committedDate: "2026-09-05T00:00:00Z" }] },
    ]),
    QM_GH_CREATED: JSON.stringify([
      { number: 1, createdAt: "2026-09-05T00:00:00Z", reviews: [{ submittedAt: "2026-09-05T02:00:00Z" }] },
      { number: 2, createdAt: "2026-09-06T00:00:00Z", reviews: [] },
    ]),
  };
  return { root, repo, reverted, env, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const runCli = (cwd, args, env) =>
  spawnSync(process.execPath, [BIN, "quality-metrics", ...args], { cwd, encoding: "utf8", env });

/** Every path under `dir`, so a run's writes are provable by absence. */
function tree(dir) {
  const out = [];
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name === ".git") continue;
      const full = path.join(current, entry.name);
      out.push(path.relative(dir, full));
      if (entry.isDirectory()) walk(full);
    }
  };
  walk(dir);
  return out.sort();
}

const pinned = (fixture_) => ["--until", UNTIL, "--repo", fixture_.repo];

// ---------------------------------------------------------------------------
// The happy path
// ---------------------------------------------------------------------------

test("the command prints one validated document computed from git, forge and the corpus", () => {
  const fx = fixture();
  try {
    const result = runCli(fx.root, pinned(fx), fx.env);
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    const validation = validateQualityMetrics(document);
    assert.equal(validation.ok, true, validation.errors.join(" · "));

    assert.equal(document.source_revision, git(fx.repo, "rev-parse", "HEAD"));
    assert.deepEqual(document.window, { days: 90, since: "2026-08-18T00:00:00.000Z", until: UNTIL });
    assert.deepEqual(document.degraded, []);

    // Five commits with one real `git revert`, two deploys with one of them reverted.
    assert.deepEqual(document.metrics.reversion_ratio.components, { revert_commits: 1, total_commits: 5 });
    assert.equal(document.metrics.reversion_ratio.value, 0.2);
    assert.equal(document.metrics.change_failure_rate.value, 0.5);
    assert.equal(document.metrics.lead_time_for_change.value, 10);
    assert.deepEqual(document.metrics.pr_volume.components, { opened_pulls: 2, merged_pulls: 2 });
    assert.equal(document.metrics.review_latency.value, 2);
    assert.deepEqual(document.metrics.escaped_defects.components, { open_findings: 1, unit_docs: 1 });
  } finally {
    fx.cleanup();
  }
});

test("the command writes nothing: the repository is byte-identical after a run", () => {
  const fx = fixture();
  try {
    const before = tree(fx.repo);
    const statusBefore = git(fx.repo, "status", "--porcelain");
    const result = runCli(fx.root, pinned(fx), fx.env);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(tree(fx.repo), before);
    assert.equal(git(fx.repo, "status", "--porcelain"), statusBefore);
  } finally {
    fx.cleanup();
  }
});

test("--out is the only write, and it lands the bytes stdout carried", () => {
  const fx = fixture();
  const outDir = mkdtempSync(path.join(os.tmpdir(), "qm-out-"));
  try {
    const before = tree(fx.repo);
    const out = path.join(outDir, "envelope.json");
    const result = runCli(fx.root, [...pinned(fx), "--out", out], fx.env);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(tree(fx.repo), before, "the repository gained nothing");
    assert.equal(readFileSync(out, "utf8"), result.stdout);
  } finally {
    rmSync(outDir, { recursive: true, force: true });
    fx.cleanup();
  }
});

// ---------------------------------------------------------------------------
// Feedback and the machine channel (S9)
// ---------------------------------------------------------------------------

test("--debug and --profile change nothing on stdout", () => {
  const fx = fixture();
  try {
    const plain = runCli(fx.root, pinned(fx), fx.env);
    const debug = runCli(fx.root, [...pinned(fx), "--debug"], fx.env);
    const profile = runCli(fx.root, [...pinned(fx), "--profile"], fx.env);
    assert.equal(plain.status, 0, plain.stderr);
    assert.equal(debug.status, 0, debug.stderr);
    assert.equal(profile.status, 0, profile.stderr);
    assert.equal(debug.stdout, plain.stdout);
    assert.equal(profile.stdout, plain.stdout);
    // The diagnostics that rode along are on stderr only.
    assert.match(profile.stderr, /feedback: /u);
  } finally {
    fx.cleanup();
  }
});

// ---------------------------------------------------------------------------
// The window (S6)
// ---------------------------------------------------------------------------

test("--window moves the trailing window and the document carries it", () => {
  const fx = fixture();
  try {
    const result = runCli(fx.root, [...pinned(fx), "--window", "7"], fx.env);
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    assert.equal(document.window.days, 7);
    assert.equal(document.window.since, "2026-11-09T00:00:00.000Z");
  } finally {
    fx.cleanup();
  }
});

test("a bad window or instant is refused before anything is measured", () => {
  const fx = fixture();
  try {
    for (const args of [["--window", "0"], ["--window", "abc"], ["--window", "3651"], ["--until", "yesterday"], ["--nope"]]) {
      const result = runCli(fx.root, args, fx.env);
      assert.equal(result.status, 2, `${args.join(" ")} is refused`);
      assert.match(result.stderr, /^QUALITY REFUSAL — /mu);
      assert.equal(result.stdout, "", `${args.join(" ")} prints no document`);
    }
  } finally {
    fx.cleanup();
  }
});

// ---------------------------------------------------------------------------
// Fail-closed surfaces (S12)
// ---------------------------------------------------------------------------

test("an unreadable forge degrades the forge rows and the exit is still 0", () => {
  const fx = fixture();
  try {
    const result = runCli(fx.root, pinned(fx), { ...fx.env, QM_GH_EXIT: "1" });
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    assert.equal(validateQualityMetrics(document).ok, true);
    assert.deepEqual(document.degraded, ["unavailable-forge-no-network"]);
    for (const name of ["change_failure_rate", "lead_time_for_change", "pr_volume", "review_latency"]) {
      assert.equal(document.metrics[name].confidence, "unavailable");
      assert.equal(document.metrics[name].value, null);
    }
    assert.equal(document.metrics.reversion_ratio.confidence, "derived");
  } finally {
    fx.cleanup();
  }
});

test("a missing gh is its own declared cause, not a network failure", () => {
  const fx = fixture();
  try {
    const result = runCli(fx.root, pinned(fx), { ...fx.env, PATH: "/usr/bin:/bin" });
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    const code = document.degraded[0];
    // `gh` may genuinely be installed on the host: then the read succeeds and
    // nothing is degraded. Either answer is honest; a wrong cause is not.
    assert.ok(["unavailable-forge-missing-cli", "unavailable-forge-no-network", "unavailable-forge-auth"].includes(code), code);
    assert.equal(validateQualityMetrics(document).ok, true);
  } finally {
    fx.cleanup();
  }
});

test("a directory that is not a repository is declared, and the forge rows survive", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "qm-norepo-"));
  try {
    const unitDir = path.join(root, "docs", "fix", "9-fixture");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(path.join(unitDir, "SPEC.md"), `# 9\n\n## Findings\n\n${FINDINGS_TABLE}\n## Log\n\n`);
    const stubDir = ghStub(root);
    const result = runCli(root, ["--until", UNTIL], {
      ...sandboxGitEnv(),
      PATH: `${stubDir}:${process.env.PATH}`,
      QM_GH_MERGED: "[]",
      QM_GH_SAMPLES: "[]",
      QM_GH_CREATED: "[]",
    });
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    assert.equal(document.source_revision, null);
    assert.equal(document.degraded[0], "unavailable-history-not-a-repository");
    assert.equal(document.metrics.reversion_ratio.confidence, "unavailable");
    assert.equal(validateQualityMetrics(document).ok, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Dispatch and the documented surface
// ---------------------------------------------------------------------------

test("--help prints the usage on stdout and exits 0", () => {
  const result = spawnSync(process.execPath, [BIN, "quality-metrics", "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /^Usage: agentic-workflow quality-metrics/u);
  assert.match(result.stdout, /--window <days>/u);
  assert.match(result.stdout, /--out <path>/u);
});

test("--version prints the contract's package version and exits 0", () => {
  const result = spawnSync(process.execPath, [BIN, "quality-metrics", "--version"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+/u);
});

test("the command is listed in the bin's own usage line", () => {
  const bin = readFileSync(BIN, "utf8");
  const usage = /usage: agentic-workflow <([^>]+)>/u.exec(bin);
  assert.ok(usage, "the bin declares its usage line");
  assert.ok(usage[1].split("|").includes("quality-metrics"), usage[1]);
});

test("a run from another working directory measures the repository it was pointed at", () => {
  const fx = fixture();
  const elsewhere = mkdtempSync(path.join(os.tmpdir(), "qm-cwd-"));
  try {
    const result = runCli(elsewhere, pinned(fx), fx.env);
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(result.stdout);
    assert.equal(document.source_revision, git(fx.repo, "rev-parse", "HEAD"));
    assert.ok(existsSync(path.join(fx.repo, "docs")));
    assert.ok(statSync(fx.repo).isDirectory());
  } finally {
    rmSync(elsewhere, { recursive: true, force: true });
    fx.cleanup();
  }
});
