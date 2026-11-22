/**
 * doctor.cli.test.mjs — the `doctor` subcommand's surface (issue #537 S2).
 *
 * Everything asserted here is at the CLI boundary: the fixed block, the JSON
 * envelope, the exit-code mapping and the read-only invariant (a scratch tree is
 * byte-identical after a run). The probes are the real ones — this suite runs
 * against a scratch root so no project file of this repository is read.
 *
 * Every case that spawns the bin carries `{ timeout: 30_000 }` — one spawn
 * costs ~2.7s on this host (the doctor's real probes; `serena --version` alone
 * is seconds on a cold interpreter), so a two-spawn case crosses bun's 5s
 * default under a plain `bun test <file>` run. The package suite already runs
 * with `--timeout=30000`; the per-test budget makes the file's own declared
 * check command exit 0 under any runner (measured 2026-11-15).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { CHECK_PROBES } from "../src/doctor/checks.mjs";
import { DOCTOR_CHECK_STATUSES } from "../src/doctor/vocabulary.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

function run(...args) {
  const result = spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Every file under `root` with its bytes, so a write of any kind shows up. */
function snapshot(root) {
  const out = {};
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const absolute = path.join(dir, entry.name);
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        out[`${relative}/`] = "<dir>";
        walk(absolute, relative);
      } else if (entry.isFile()) {
        out[relative] = readFileSync(absolute, "utf8");
      } else if (entry.isSymbolicLink()) {
        out[relative] = "<link>";
      }
    }
  };
  walk(root, "");
  return out;
}

function scratchProject() {
  const root = mkdtempSync(path.join(tmpdir(), "doctor-cli-"));
  writeFileSync(path.join(root, "README.md"), "# a target project\n");
  mkdirSync(path.join(root, "src"), { recursive: true });
  writeFileSync(path.join(root, "src", "index.js"), "export const x = 1;\n");
  return root;
}

test("`doctor --json` prints the doctor@1 envelope with one row per documented surface", { timeout: 30_000 }, () => {
  const root = scratchProject();
  try {
    const result = run("doctor", "--json", "--root", root);
    assert.ok(result.stdout, `the command prints its envelope (stderr: ${result.stderr})`);
    const envelope = JSON.parse(result.stdout);
    assert.equal(envelope.contract, "doctor@1");
    assert.equal(envelope.rows.length, CHECK_PROBES.length);
    assert.deepEqual(envelope.rows.map((row) => row.id), CHECK_PROBES.map((probe) => probe.id));
    for (const row of envelope.rows) {
      assert.ok(DOCTOR_CHECK_STATUSES.includes(row.status), `${row.id}: ${row.status} is published`);
      assert.equal(Object.hasOwn(row, "__proto__"), false, "no row carries a prototype key of its own");
    }
    assert.equal(typeof envelope.exitCode, "number");
    assert.equal(result.status, envelope.exitCode, "the process exit code is the envelope's");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the exit code is the required-surface rule, recomputed from the rows", { timeout: 30_000 }, () => {
  const root = scratchProject();
  try {
    const envelope = JSON.parse(run("doctor", "--json", "--root", root).stdout);
    const broken = envelope.rows.filter((row) => row.requirement === "required" && !["ok", "not-applicable"].includes(row.status));
    assert.equal(envelope.exitCode, broken.length > 0 ? 1 : 0, `required rows: ${broken.map((row) => row.id).join(", ") || "none broken"}`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("`doctor` writes nothing: the scratch tree is byte-identical after the run", { timeout: 30_000 }, () => {
  const root = scratchProject();
  try {
    const before = snapshot(root);
    run("doctor", "--root", root);
    run("doctor", "--json", "--root", root);
    assert.deepEqual(snapshot(root), before, "the checker never writes");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the human block is the fixed one: header, one labelled line per row, verdict", { timeout: 30_000 }, () => {
  const root = scratchProject();
  try {
    const result = run("doctor", "--root", root);
    const lines = result.stdout.split("\n").filter(Boolean);
    assert.match(lines[0], /^DOCTOR — tool doctor \(doctor@1\) · \d+ surfaces/u);
    const rowLines = lines.filter((line) => /^(ok|MISS|MISMATCH|UNARMED|UNREACHABLE|N\/A)\s{2,}/u.test(line));
    assert.equal(rowLines.length, CHECK_PROBES.length, "one labelled line per surface");
    assert.match(lines.at(-2), /^SUMMARY — ok \d+ · missing \d+ · mismatch \d+ · unarmed \d+ · unreachable \d+ · n\/a \d+ · advisories \d+$/u);
    assert.match(lines.at(-1), /^VERDICT: (PASS|ATTENTION)/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an unknown flag is a refusal naming the usage, exit 2", { timeout: 30_000 }, () => {
  const root = scratchProject();
  try {
    const result = run("doctor", "--root", root, "--nope");
    assert.equal(result.status, 2);
    assert.match(result.stderr, /DOCTOR REFUSAL — /u);
    assert.equal(result.stdout, "", "a refusal prints no envelope");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the bin dispatches both subcommands and the usage line names them", () => {
  const bin = readFileSync(BIN, "utf8");
  const usage = bin.match(/usage: bunx @gtrabanco\/agentic-workflow@<pin> <([^>]+)>/u);
  assert.ok(usage, "the bin declares its usage line");
  const tokens = usage[1].split("|");
  assert.ok(tokens.includes("doctor"), "the usage line dispatches doctor");
  assert.ok(tokens.includes("setup"), "the usage line dispatches setup");
  assert.ok(statSync(BIN).isFile());
});
