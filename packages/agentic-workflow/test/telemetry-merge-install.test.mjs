/**
 * telemetry-merge-install.test.mjs — issue #630 S2–S4: the telemetry merge
 * driver's installation gate.
 *
 * Frozen-failure corpus:
 *   F-630-11 — a project with telemetry but no declaration and no armed driver
 *              is left unguarded: the installer is what closes both halves, and
 *              a second run must not duplicate a line or rewrite a key.
 *   F-630-12 — an npm-only install (no `scripts/` tree) must still get a driver
 *              that runs: the crate's own bin is armed, and a real `git merge`
 *              through it unions the two sides' lines.
 *   F-630-13 — a directory that is not a git checkout is refused, nothing
 *              written (fail closed).
 *   F-630-14 — the reconciliation trigger arms the driver, reports it in the
 *              receipt, and degrades to `unavailable` on a non-checkout instead
 *              of failing the write.
 *
 * Every fixture is a throwaway git repository under `tempRoot`; nothing here
 * touches the live checkout (the live-tree guard).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  MERGE_INSTALL_CONTRACT_ID,
  TELEMETRY_ATTRIBUTE_LINES,
  armTelemetryMerge,
  installTelemetryMerge,
  isDeclared,
  main,
  missingAttributeLines,
  resolveDriverEntry,
} from "../src/telemetry/merge-install.mjs";
import { tempRoot } from "../../../scripts/temp-root.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const CRATE_BIN = fileURLToPath(new URL("../bin/shared-merge.mjs", import.meta.url));

const GIT_IDENTITY = ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false"];

/** A throwaway project; `git: true` makes it a checkout with one commit. */
function project({ git = true, attributes = null, files = {} } = {}) {
  const root = tempRoot("telemetry-merge-install-");
  const run = (args) => spawnSync("git", [...GIT_IDENTITY, ...args], { cwd: root, encoding: "utf8" });
  if (git) run(["init", "-q", "-b", "main"]);
  if (attributes !== null) fs.writeFileSync(path.join(root, ".gitattributes"), attributes, "utf8");
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content, "utf8");
  }
  if (git) {
    run(["add", "-A"]);
    run(["commit", "-q", "-m", "base"]);
  }
  return { root, git: run };
}

/** The armed command a checkout carries for one class. */
function armedDriver(root, cls = "telemetry") {
  const answer = spawnSync("git", [...GIT_IDENTITY, "config", "--local", "--get", `merge.agentic-shared-${cls}.driver`], {
    cwd: root,
    encoding: "utf8",
  });
  return answer.status === 0 ? answer.stdout.trim() : null;
}

test("F-630-11 — a fresh checkout gains both registry lines and the armed driver, idempotently", () => {
  const { root } = project();
  assert.equal(isDeclared(root), false);

  const first = installTelemetryMerge({ root });
  assert.equal(first.contract, MERGE_INSTALL_CONTRACT_ID);
  assert.equal(first.attributes.missing, TELEMETRY_ATTRIBUTE_LINES.length);
  assert.deepEqual(first.attributes.added, [...TELEMETRY_ATTRIBUTE_LINES]);
  assert.equal(first.declared, true);
  assert.equal(first.driver.status, "written");

  const attributes = fs.readFileSync(path.join(root, ".gitattributes"), "utf8");
  for (const line of TELEMETRY_ATTRIBUTE_LINES) assert.equal(attributes.split("\n").filter((row) => row === line).length, 1);
  const command = armedDriver(root);
  assert.ok(command.includes("telemetry %O %A %B %L"), "the armed command keeps git's placeholders");
  assert.ok(command.includes(first.entry), "the armed command names the entry the installer resolved");

  // Second run: nothing appended, nothing rewritten.
  const second = installTelemetryMerge({ root });
  assert.equal(second.attributes.missing, 0);
  assert.deepEqual(second.attributes.added, []);
  assert.equal(second.driver.status, "unchanged");
  assert.equal(fs.readFileSync(path.join(root, ".gitattributes"), "utf8"), attributes);
});

test("F-630-11b — an existing `.gitattributes` is appended to, never rewritten, and no path is claimed twice", () => {
  const existing = ["# a project's own file", "docs/generated/** merge=docs-generated", "docs/ROADMAP.md merge=agentic-shared-roadmap", ""].join("\n");
  const { root } = project({ attributes: existing });
  installTelemetryMerge({ root });
  const after = fs.readFileSync(path.join(root, ".gitattributes"), "utf8");
  assert.ok(after.startsWith(existing), "every pre-existing byte survives");
  for (const line of TELEMETRY_ATTRIBUTE_LINES) assert.ok(after.includes(line));

  // A path another driver already claims is left alone: two claims on one path
  // is the defect the additive rule exists to prevent.
  const claimed = ["docs/workflow/TIER_COST.md merge=project-own-driver", ""].join("\n");
  assert.deepEqual(missingAttributeLines(claimed), [TELEMETRY_ATTRIBUTE_LINES[1]]);
});

test("F-630-12 — an install without a `scripts/` tree arms the crate's own bin, and a real merge runs through it", () => {
  const { root, git } = project();
  const entry = resolveDriverEntry(root);
  assert.equal(entry.path, CRATE_BIN, "no scripts/ tree: the crate bin is the entry");
  assert.equal(entry.present, true);
  installTelemetryMerge({ root });
  assert.ok(armedDriver(root).includes("bin/shared-merge.mjs"));

  // Two branches appending one JSONL line each, merged through the armed crate
  // entry — the shape an npm-only project has.
  fs.mkdirSync(path.join(root, ".pi/.telemetry"), { recursive: true });
  const store = path.join(root, ".pi/.telemetry/sessions.jsonl");
  fs.writeFileSync(store, '{"source":"pi:session=base"}\n', "utf8");
  git(["add", "-A"]);
  git(["commit", "-q", "-m", "store"]);
  const branch = (name, line) => {
    git(["checkout", "-q", "-b", name]);
    fs.appendFileSync(store, line);
    git(["add", "-A"]);
    git(["commit", "-q", "-m", name]);
    git(["checkout", "-q", "main"]);
    return name;
  };
  const ours = branch("ours", '{"source":"pi:session=ours"}\n');
  const theirs = branch("theirs", '{"source":"pi:session=theirs"}\n');
  assert.equal(git(["merge", ours, "--no-edit"]).status, 0, "ours is a fast-forward");
  const merged = git(["merge", theirs, "--no-edit"]);
  assert.equal(merged.status, 0, merged.stderr);
  const sources = fs.readFileSync(store, "utf8").trim().split("\n").map((line) => JSON.parse(line).source);
  assert.deepEqual(sources, ["pi:session=base", "pi:session=ours", "pi:session=theirs"]);
});

test("F-630-13 — a directory that is not a git checkout is refused and nothing is written", () => {
  const { root } = project({ git: false });
  const refusal = spawnSync(process.execPath, [BIN, "telemetry", "merge-install", "--repo", root], { encoding: "utf8" });
  assert.equal(refusal.status, 2);
  assert.match(refusal.stderr, /MERGE-INSTALL REFUSAL — /);
  assert.equal(fs.existsSync(path.join(root, ".gitattributes")), false, "no declaration was created");
  assert.throws(() => installTelemetryMerge({ root }), /not a git checkout/);
});

test("F-630-13b — an entry that cannot run is a refusal, not an armed command", () => {
  const { root } = project();
  const missing = { path: path.join(root, "does-not-exist.mjs"), relative: "does-not-exist.mjs", present: false };
  assert.throws(() => installTelemetryMerge({ root, entry: missing }), /no driver entry to arm/);
  assert.equal(armedDriver(root), null, "nothing was armed");
  const armed = armTelemetryMerge({ root, entry: missing });
  assert.equal(armed.status, "unavailable");
  assert.equal(armed.next, "agentic-workflow telemetry merge-install");
});

test("F-630-14 — the reconciliation trigger arms the driver and reports it; a non-checkout degrades", () => {
  const { root } = project();
  const armed = armTelemetryMerge({ root });
  assert.equal(armed.status, "armed");
  assert.equal(armed.driver, "agentic-shared-telemetry");
  assert.equal(armed.declared, false, "the arming never writes the declaration");
  assert.equal(armed.next, "agentic-workflow telemetry merge-install");
  assert.ok(armedDriver(root) !== null);

  const again = armTelemetryMerge({ root });
  assert.equal(again.status, "unchanged");

  const outside = project({ git: false });
  const unavailable = armTelemetryMerge({ root: outside.root });
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.detail, "not a git checkout");
  assert.equal(fs.existsSync(path.join(outside.root, ".gitattributes")), false);
});

test("bin: `agentic-workflow telemetry merge-install` answers the receipt through the real binary", () => {
  const { root } = project();
  const spawned = spawnSync(process.execPath, [BIN, "telemetry", "merge-install", "--repo", root], { encoding: "utf8" });
  assert.equal(spawned.status, 0, spawned.stderr);
  const receipt = JSON.parse(spawned.stdout);
  assert.equal(receipt.contract, MERGE_INSTALL_CONTRACT_ID);
  assert.equal(receipt.driver.status, "written");
  assert.equal(receipt.attributes.missing, TELEMETRY_ATTRIBUTE_LINES.length);

  const help = spawnSync(process.execPath, [BIN, "telemetry", "merge-install", "--help"], { encoding: "utf8" });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /usage: agentic-workflow telemetry merge-install/);
});

test("main: an unknown flag is a refusal, and the module runs standalone", () => {
  const out = [];
  const err = [];
  const code = main(["--nope"], { cwd: tempRoot("telemetry-merge-install-cli-"), stdout: (text) => out.push(text), stderr: (text) => err.push(text) });
  assert.equal(code, 2);
  assert.match(err.join(""), /unknown argument: --nope/);
  assert.deepEqual(out, []);
});
