#!/usr/bin/env node
/**
 * docs-generated-merge.test.mjs — the sibling suite of the projection's merge
 * driver (fix #420).
 *
 * The defect: `docs/generated/**` is a generated projection committed to the
 * tree, so two PRs that regenerate it conflict on bytes neither author wrote —
 * the header line every regeneration rewrites is the same line for both sides.
 * A line-level merge of two regenerations is never a real conflict, so the
 * resolution is mechanical; whether the bytes are *right* is the generator's
 * question, answered by the local gate's `docs-generated-projection` step.
 *
 * What this suite pins:
 *   - the resolution answers the incoming side, byte for byte;
 *   - every refusal fails closed: the conflict stays, the local side is intact;
 *   - `--install` arms a checkout, is idempotent, and is relocatable;
 *   - a real `git merge` in a scratch repository loses its conflict with the
 *     driver armed and keeps it unarmed — the arming is what does the work;
 *   - the same holds for `docs/ROADMAP.md` (fix #507): two branches that each
 *     append a roadmap row merge clean once armed, and the regeneration the
 *     driver's note names restores the local side's derived row;
 *   - `.gitattributes` covers exactly the directory the generator writes plus
 *     the roadmap index, so the two can never drift apart.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { parseDocsSiteBlock, projectionDir } from "./docs-generate.mjs";
import { coveredPrefix, driverCommand } from "./docs-generated-merge.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO, "scripts", "docs-generated-merge.mjs");
const DRIVER = "docs-generated";
const PREFIX = "docs/generated";

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "fixture",
  GIT_AUTHOR_EMAIL: "fixture@example.invalid",
  GIT_COMMITTER_NAME: "fixture",
  GIT_COMMITTER_EMAIL: "fixture@example.invalid",
};

/** Run the driver under the runtime running this suite. */
function driver(args, cwd) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** A throwaway repository: `git init`, a writer, a reader and a committing run. */
function scratch(label) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `docs-generated-merge-${label}-`));
  const run = (args) =>
    spawnSync("git", ["-c", "commit.gpgsign=false", "-c", "init.defaultBranch=main", ...args], {
      cwd: dir,
      encoding: "utf8",
      env: GIT_ENV,
    });
  const init = run(["init", "-q"]);
  assert.equal(init.status, 0, `git init: ${init.stderr}`);
  return {
    dir,
    run,
    write(rel, text) {
      const abs = path.join(dir, rel);
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, text);
      return abs;
    },
    read(rel) {
      return fs.readFileSync(path.join(dir, rel), "utf8");
    },
    commit(message) {
      const staged = run(["add", "-A"]);
      assert.equal(staged.status, 0, `git add: ${staged.stderr}`);
      const done = run(["commit", "-qm", message]);
      assert.equal(done.status, 0, `git commit ${message}: ${done.stderr}`);
    },
    cleanup() {
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

/** A repository whose projection is the only file that diverges on both sides. */
function divergentProjection(repo) {
  repo.write(".gitattributes", `${PREFIX}/** merge=${DRIVER}\n`);
  repo.write(`${PREFIX}/index.md`, "Generated from 137 unit docs\n");
  repo.commit("base");
  repo.run(["checkout", "-qb", "incoming"]);
  repo.write(`${PREFIX}/index.md`, "Generated from 141 unit docs\n");
  repo.commit("incoming");
  repo.run(["checkout", "-q", "main"]);
  repo.write(`${PREFIX}/index.md`, "Generated from 139 unit docs\n");
  repo.commit("local");
  return repo.run(["merge", "--no-edit", "incoming"]);
}

/* ------------------------------------------------------------------ usage */

test("no merge targets and no --install is a usage error", () => {
  const result = driver([], REPO);
  assert.equal(result.status, 2, "a driver invoked with nothing forbids a guess");
  assert.match(result.stderr, /DOCS GENERATED MERGE REFUSAL —/);
  assert.match(result.stderr, /--install/, "the refusal says how the driver is armed");
});

test("an unknown argument refuses instead of resolving something", () => {
  const result = driver(["--nope"], REPO);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown argument --nope/);
});

test("too few merge targets refuse", () => {
  const result = driver(["base"], REPO);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /base, ours and theirs/);
});

/* --------------------------------------------------------------- resolve */

test("the driver answers the incoming side, byte for byte", () => {
  const repo = scratch("resolve");
  try {
    const base = repo.write("base.md", "Generated from 137 unit docs\n");
    const ours = repo.write(`${PREFIX}/index.md`, "Generated from 139 unit docs\n");
    const theirs = repo.write("theirs.md", "Generated from 141 unit docs\n");
    const result = driver([base, ours, theirs, "7", `${PREFIX}/index.md`], repo.dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      fs.readFileSync(ours, "utf8"),
      "Generated from 141 unit docs\n",
      "the incoming bytes land on the local side, untouched",
    );
    assert.match(result.stderr, /resolved to the incoming projection/);
    assert.match(result.stderr, /scripts\/docs-generate\.mjs/, "the note names the regeneration command");
  } finally {
    repo.cleanup();
  }
});

test("the path git quotes is still recognized as the projection", () => {
  const repo = scratch("quoted");
  try {
    const base = repo.write("base.md", "Generated from 137 unit docs\n");
    const ours = repo.write(`${PREFIX}/code.md`, "Generated from 139 unit docs\n");
    const theirs = repo.write("theirs.md", "Generated from 141 unit docs\n");
    // Git hands `%P` shell-quoted: the driver must not read the quotes as part
    // of the path and refuse its own file.
    const result = driver([base, ours, theirs, "7", `'${PREFIX}/code.md'`], repo.dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(ours, "utf8"), "Generated from 141 unit docs\n");
  } finally {
    repo.cleanup();
  }
});

test("the roadmap index is a covered surface (fix #507)", () => {
  const repo = scratch("roadmap");
  try {
    const base = repo.write("base.md", "generated\n");
    const ours = repo.write("docs/ROADMAP.md", "| 100 | local | done | — | local row |\n");
    const theirs = repo.write("theirs.md", "| 101 | incoming | done | — | incoming row |\n");
    const result = driver([base, ours, theirs, "7", "docs/ROADMAP.md"], repo.dir);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(ours, "utf8"), "| 101 | incoming | done | — | incoming row |\n");
    assert.match(result.stderr, /docs\/ROADMAP\.md/);
  } finally {
    repo.cleanup();
  }
});

test("a path outside the covered surfaces fails closed and keeps the local bytes", () => {
  const repo = scratch("outside");
  try {
    const base = repo.write("base.md", "a\n");
    const ours = repo.write("README.md", "hand-written\n");
    const theirs = repo.write("theirs.md", "generated\n");
    const result = driver([base, ours, theirs, "7", "README.md"], repo.dir);
    assert.equal(result.status, 1, "a hand-written file is never resolved mechanically");
    assert.match(result.stderr, /outside/);
    assert.equal(fs.readFileSync(ours, "utf8"), "hand-written\n");
  } finally {
    repo.cleanup();
  }
});

test("an unreadable incoming side fails closed and keeps the local bytes", () => {
  const repo = scratch("unreadable");
  try {
    const base = repo.write("base.md", "a\n");
    const ours = repo.write(`${PREFIX}/units.md`, "local\n");
    const result = driver([base, ours, path.join(repo.dir, "missing.md"), "7", `${PREFIX}/units.md`], repo.dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /cannot read the incoming side/);
    assert.equal(fs.readFileSync(ours, "utf8"), "local\n");
  } finally {
    repo.cleanup();
  }
});

/* --------------------------------------------------------------- install */

test("--install arms the driver once and answers the second run as unchanged", () => {
  const repo = scratch("install");
  try {
    repo.write("AGENTS.md", "# AGENTS.md\n");
    const first = driver(["--install", "--repo", repo.dir], REPO);
    assert.equal(first.status, 0, first.stderr);
    const written = repo.run(["config", "--local", "--get", `merge.${DRIVER}.driver`]);
    assert.equal(written.status, 0, "the checkout carries merge.docs-generated.driver");
    assert.match(written.stdout, /docs-generated-merge\.mjs/, "the driver line names this script");
    assert.match(written.stdout, /%O %A %B/, "the driver line passes git's merge placeholders through");
    assert.match(written.stdout, /command -v bun/, "the line resolves bun before falling back to node");

    const second = driver(["--install", "--repo", repo.dir], REPO);
    assert.equal(second.status, 0, second.stderr);
    assert.match(first.stdout, /driver — written:/);
    assert.match(second.stdout, /driver — unchanged:/, "a second install is a no-op, not a rewrite");
    assert.equal(
      repo.run(["config", "--local", "--get", `merge.${DRIVER}.driver`]).stdout,
      written.stdout,
      "the armed line is byte-identical after the second run",
    );
  } finally {
    repo.cleanup();
  }
});

test("--install refuses a directory that is not a git checkout", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "docs-generated-merge-plain-"));
  try {
    const result = driver(["--install", "--repo", dir], REPO);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /is not a git checkout/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the armed line is relocatable inside the checkout it arms", () => {
  assert.match(
    driverCommand(REPO),
    /scripts\/docs-generated-merge\.mjs %O %A %B %L "%P"/,
    "a checkout arms itself with the path it carries, never an absolute one",
  );
  const outside = driverCommand(path.join(REPO, "..", "elsewhere"));
  assert.match(outside, new RegExp(SCRIPT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "outside the checkout the absolute path is the only honest one");
});

/* ------------------------------------------------------------ real merges */

test("a real merge loses its projection conflict once the driver is armed", () => {
  const repo = scratch("merge-armed");
  try {
    const armed = driver(["--install", "--repo", repo.dir], REPO);
    assert.equal(armed.status, 0, armed.stderr);
    const merge = divergentProjection(repo);
    assert.equal(merge.status, 0, `the driver resolves the conflict: ${merge.stderr}`);
    assert.equal(repo.read(`${PREFIX}/index.md`), "Generated from 141 unit docs\n");
    assert.doesNotMatch(repo.read(`${PREFIX}/index.md`), /^<<<<<<<|^=======/m, "no marker survives the merge");
  } finally {
    repo.cleanup();
  }
});

test("without the install the same merge keeps its conflict", () => {
  const repo = scratch("merge-unarmed");
  try {
    const merge = divergentProjection(repo);
    assert.equal(merge.status, 1, "an unarmed checkout is the defect this unit removes, not a silent pass");
    assert.match(repo.read(`${PREFIX}/index.md`), /^<<<<<<<|^=======/m);
  } finally {
    repo.cleanup();
  }
});

/**
 * The #269×#505 collision, reproduced small: two branches each register a unit
 * (folder + roadmap row) on the same base. This is the frozen-failure corpus
 * fix #507 answers — before the driver covered the roadmap index the merge
 * conflicted on rows nobody author wrote against each other.
 */
function divergentRoadmap(repo) {
  const spec = (oneLine) => `# Unit\n\n> One-line: ${oneLine}\n\n## Specs\n\n**S1 — something.**\n> the words\n\n## Tasks\n\n- P1 — do it (validator: \`bun test x\` exits 0)\n  (Implements: S1)\n`;
  const roadmap = (rows) =>
    [
      "# Roadmap",
      "",
      "## Features",
      "",
      "| NN | Slug | Status | Depends on | Summary |",
      "|----|------|--------|------------|---------|",
      ...rows,
      "",
    ].join("\n");
  repo.write("AGENTS.md", "# Fixture project\n");
  repo.write(".gitattributes", `${PREFIX}/** merge=${DRIVER}\ndocs/ROADMAP.md merge=${DRIVER}\n`);
  repo.write("docs/features/100-base/SPEC.md", spec("the base unit"));
  repo.write("docs/ROADMAP.md", roadmap(["| 100 | `base` | defined | — | the base unit |"]));
  repo.commit("base");
  repo.run(["checkout", "-qb", "incoming"]);
  repo.write("docs/features/101-incoming/SPEC.md", spec("the incoming unit"));
  repo.write("docs/ROADMAP.md", roadmap(["| 100 | `base` | defined | — | the base unit |", "| 101 | `incoming` | defined | — | the incoming unit |"]));
  repo.commit("incoming");
  repo.run(["checkout", "-q", "main"]);
  repo.write("docs/features/102-local/SPEC.md", spec("the local unit"));
  repo.write("docs/ROADMAP.md", roadmap(["| 100 | `base` | defined | — | the base unit |", "| 102 | `local` | defined | — | the local unit |"]));
  repo.commit("local");
  return repo.run(["merge", "--no-edit", "incoming"]);
}

test("a real merge loses its roadmap conflict once the driver is armed, and the regeneration restores the local row (fix #507)", () => {
  const repo = scratch("roadmap-merge-armed");
  try {
    const armed = driver(["--install", "--repo", repo.dir], REPO);
    assert.equal(armed.status, 0, armed.stderr);
    const merge = divergentRoadmap(repo);
    assert.equal(merge.status, 0, `the driver resolves the roadmap conflict: ${merge.stderr}`);
    const merged = repo.read("docs/ROADMAP.md");
    assert.doesNotMatch(merged, /^<<<<<<<|^=======/m, "no marker survives the merge");
    assert.match(merged, /\| 101 \| `incoming` /, "the incoming side's row is the resolution");
    // The driver's note names the regeneration: it re-derives the local branch's
    // row from the unit folder the merge already carried.
    const generate = spawnSync(process.execPath, [path.join(REPO, "scripts", "docs-generate.mjs"), "--root", repo.dir], {
      encoding: "utf8",
    });
    assert.equal(generate.status, 0, generate.stderr + generate.stdout);
    const regenerated = repo.read("docs/ROADMAP.md");
    assert.match(regenerated, /\| 101 \| `incoming` /);
    assert.match(regenerated, /\| 102 \| `local` /, "the local unit's row comes back from its folder");
    const check = spawnSync(process.execPath, [path.join(REPO, "scripts", "docs-generate.mjs"), "--check", "--root", repo.dir], {
      encoding: "utf8",
    });
    assert.equal(check.status, 0, "the merged tree is in sync — the gate's docs-generated-projection step passes");
  } finally {
    repo.cleanup();
  }
});

test("without the driver armed the same roadmap merge keeps its conflict", () => {
  const repo = scratch("roadmap-merge-unarmed");
  try {
    const merge = divergentRoadmap(repo);
    assert.equal(merge.status, 1, "the #269×#505 collision is the defect fix #507 removes");
    assert.match(repo.read("docs/ROADMAP.md"), /^<<<<<<<|^=======/m);
  } finally {
    repo.cleanup();
  }
});

/* ------------------------------------------------------------- one home */

test(".gitattributes covers exactly the surfaces the generator writes", () => {
  const prefix = projectionDir(parseDocsSiteBlock(fs.readFileSync(path.join(REPO, "AGENTS.md"), "utf8")));
  assert.equal(coveredPrefix(REPO), prefix, "the driver reads the directory from the generator instead of restating it");
  const entries = fs
    .readFileSync(path.join(REPO, ".gitattributes"), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"));
  // Issue #498 generalizes the pattern by file class: the projection entry keeps
  // its exact pin and the shared-document classes are the closed set the shared
  // driver's own suite pins — a foreign entry in either direction is a defect.
  // The #507 driver's roadmap coverage stays a scratch-fixture capability (see
  // the divergentRoadmap cases above); the ROADMAP attribute itself belongs to
  // the agentic-shared-roadmap class per the 2026-11-11 coordination note.
  assert.deepEqual(
    entries,
    [
      `${prefix}/** merge=${DRIVER}`,
      "docs/ROADMAP.md merge=agentic-shared-roadmap",
      "docs/workflow/SKILL_CONTEXT_BUDGETS.json merge=agentic-shared-budgets",
      "docs/workflow/REPOSITORY_STATE.md merge=agentic-shared-repo-state",
    ],
    "the projection entry plus the three shared-document classes, exactly",
  );
});
