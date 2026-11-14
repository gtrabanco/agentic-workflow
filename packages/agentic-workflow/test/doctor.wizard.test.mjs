/**
 * doctor.wizard.test.mjs — the consent-gated setup wizard (issue #537 S6).
 *
 * Every case runs against a throwaway git repository under `mktemp -d`: the
 * project's own installer scripts are stubs that write only inside that fixture,
 * so the wizard's contract — nothing without an explicit yes, one runnable
 * action per repair, a recorded consent line, a re-verify, a second run that is a
 * proven no-op — is exercised end to end without touching the live tree.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const LEDGER = ".agentic-workflow/provision-log.jsonl";

const gitAvailable = spawnSync("git", ["--version"], { encoding: "utf8" }).status === 0;

function run(root, ...args) {
  const result = spawnSync(process.execPath, [BIN, ...args, "--root", root], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const doctorJson = (root) => JSON.parse(run(root, "doctor", "--json").stdout);
const ledgerLines = (root) => {
  const file = path.join(root, LEDGER);
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean);
};

/** A git project whose `.gitattributes` declares one shared-merge driver and
 *  which ships the two installer scripts the doctor delegates to. */
function fixture() {
  const root = mkdtempSync(path.join(tmpdir(), "doctor-wizard-"));
  spawnSync("git", ["init", "-q"], { cwd: root });
  writeFileSync(path.join(root, ".gitattributes"), "docs/ROADMAP.md merge=agentic-shared-roadmap\n");
  mkdirSync(path.join(root, "scripts"), { recursive: true });
  writeFileSync(
    path.join(root, "scripts", "shared-doc-merge.mjs"),
    [
      'import { spawnSync } from "node:child_process";',
      'const out = spawnSync("git", ["config", "--local", "merge.agentic-shared-roadmap.driver", "stub-driver %O %A %B"], { encoding: "utf8" });',
      'process.stdout.write(`shared-doc-merge — roadmap — ${out.status === 0 ? "written" : "failed"}\\n`);',
      "process.exit(out.status === 0 ? 0 : 1);",
      "",
    ].join("\n"),
  );
  writeFileSync(
    path.join(root, "scripts", "local-gate.mjs"),
    [
      'import { mkdirSync, writeFileSync } from "node:fs";',
      'mkdirSync(".git/hooks", { recursive: true });',
      'writeFileSync(".git/hooks/pre-push", "#!/bin/sh\\nexit 0\\n");',
      'process.stdout.write("local-gate — pre-push written\\n");',
      "",
    ].join("\n"),
  );
  for (const script of ["shared-doc-merge.mjs", "local-gate.mjs"]) chmodSync(path.join(root, "scripts", script), 0o755);
  return root;
}

test("the doctor reports the declared-but-un-armed driver and the missing hook", { skip: gitAvailable ? false : "git is not available" }, () => {
  const root = fixture();
  try {
    const envelope = doctorJson(root);
    const drivers = envelope.rows.find((row) => row.id === "merge-drivers");
    const hooks = envelope.rows.find((row) => row.id === "git-hooks");
    assert.equal(drivers.status, "unarmed");
    assert.deepEqual(drivers.evidence.unarmed, ["agentic-shared-roadmap"]);
    assert.equal(drivers.move, "ask-consent-write");
    assert.equal(hooks.status, "unarmed");
    assert.equal(hooks.move, "ask-consent-write");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("without --yes the wizard prints the plan, writes nothing and says so (S6)", { skip: gitAvailable ? false : "git is not available" }, () => {
  const root = fixture();
  try {
    const result = run(root, "setup", "--json");
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(result.stdout);
    assert.deepEqual(receipt.applied, [], "nothing is applied without consent");
    assert.deepEqual(receipt.declined.sort(), ["git-hooks", "merge-drivers"]);
    assert.equal(existsSync(path.join(root, LEDGER)), false, "no ledger line without consent");
    assert.equal(spawnSync("git", ["config", "--local", "--get", "merge.agentic-shared-roadmap.driver"], { cwd: root }).status, 1, "the driver stays un-armed");
    assert.match(receipt.instructions.join("\n"), /local-gate\.mjs --install-hook/u, "the plan carries the exact command");

    const human = run(root, "setup");
    assert.match(human.stdout, /SETUP — /u);
    assert.match(human.stdout, /nothing written/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a consented action runs the project's own installer, records one line and re-verifies (S6)", { skip: gitAvailable ? false : "git is not available" }, () => {
  const root = fixture();
  try {
    const result = run(root, "setup", "--json", "--yes", "git-hooks", "--yes", "merge-drivers");
    assert.equal(result.status, 0, result.stderr);
    const receipt = JSON.parse(result.stdout);
    assert.deepEqual(receipt.applied.sort(), ["git-hooks", "merge-drivers"]);
    assert.equal(
      spawnSync("git", ["config", "--local", "--get", "merge.agentic-shared-roadmap.driver"], { cwd: root }).status,
      0,
      "the delegated installer armed the driver",
    );
    assert.equal(existsSync(path.join(root, ".git", "hooks", "pre-push")), true, "the delegated installer wrote the hook");
    assert.equal(ledgerLines(root).length, 2, "one consent line per applied action");
    assert.ok(ledgerLines(root).every((line) => JSON.parse(line).source === "flag"));

    const after = receipt.after.find((row) => row.id === "merge-drivers");
    assert.equal(after.status, "ok", "the same checker re-verified the repair");
    assert.deepEqual(
      receipt.after.filter((row) => row.move === "ask-consent-write"),
      [],
      "no consented repair is still pending after the re-verify",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the second run is a proven no-op (S6)", { skip: gitAvailable ? false : "git is not available" }, () => {
  const root = fixture();
  try {
    run(root, "setup", "--json", "--yes", "git-hooks,merge-drivers");
    const ledgerAfterFirst = ledgerLines(root);
    const hookBefore = readFileSync(path.join(root, ".git", "hooks", "pre-push"), "utf8");

    const second = JSON.parse(run(root, "setup", "--json", "--yes", "git-hooks,merge-drivers").stdout);
    assert.deepEqual(second.applied, []);
    assert.deepEqual(second.declined, []);
    assert.equal(existsSync(path.join(root, LEDGER)), true);
    assert.deepEqual(ledgerLines(root), ledgerAfterFirst, "no second consent line");
    assert.equal(readFileSync(path.join(root, ".git", "hooks", "pre-push"), "utf8"), hookBefore, "no second write");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an unknown id in --yes is a refusal, exit 2, before any action", { skip: gitAvailable ? false : "git is not available" }, () => {
  const root = fixture();
  try {
    const result = run(root, "setup", "--yes", "nope");
    assert.equal(result.status, 2);
    assert.match(result.stderr, /DOCTOR REFUSAL — /u);
    assert.equal(existsSync(path.join(root, LEDGER)), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("instruct-only rows are printed with their exact command and never applied", { skip: gitAvailable ? false : "git is not available" }, () => {
  const root = fixture();
  try {
    const receipt = JSON.parse(run(root, "setup", "--json").stdout);
    assert.deepEqual(receipt.instructions.length > 0, true, "the plan carries instructions for the rows the wizard cannot repair");
    for (const id of receipt.applied) assert.ok(!id.startsWith("node"), "a package install is never an action");
    assert.ok(receipt.residual.every((row) => typeof row.reason === "string"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
