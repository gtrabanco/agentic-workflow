// provision.permissions.test.mjs — the plugin policy projection (issue #654,
// S6 bullet 3 / S9 / S11 bullet 2).
//
// "One claim per path": the project's guards are authored in
// `pi-agentic-workflow` config and the permission package's own `config.json` is a
// projection of them. This suite pins the projection — the documented baseline,
// the declarations appended after it so last-match-wins does what the author
// meant, the collision refusal, and the one rule that keeps an operator's file
// theirs: it is created when absent and never overwritten.
//
// Red-first against the missing module, per the repo rule.

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

import {
  BASELINE_PERMISSION,
  permissionConfigPath,
  provisionPermissions,
  renderPermissionPolicy,
} from "../src/provision/permissions.mjs";

const CLI = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;

const DENY_ENV = {
  kind: "deterministic",
  surface: "path",
  rules: [{ match: "**/.env", verdict: "deny", reason: "secrets never enter the agent's reach" }],
};

function freshRoot() {
  const root = mkdtempSync(join(tmpdir(), "aw-permissions-"));
  return root;
}

/** Every CLI spawn pins the agent dir: the global `pi-agentic-workflow` config is
 *  read by the resolved merge, and an operator machine whose own agent file
 *  declares guards must not flip a suite that is about the project scope. */
const cliEnv = (root) => ({ ...process.env, PI_CODING_AGENT_DIR: join(root, "empty-agent-dir") });

/* ---------------------------------------------------------------- baseline */

test("the projection carries the documented baseline: fail closed on bash, allow scratch outside the root", () => {
  const result = renderPermissionPolicy({ guards: {} });
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.equal(result.permission["*"], "allow");
  assert.deepEqual(result.permission.external_directory, BASELINE_PERMISSION.external_directory);
  assert.equal(result.permission.external_directory["*"], "ask", "outside the cwd asks by default");
  assert.equal(result.permission.external_directory["/tmp/*"], "allow", "the scratch carve-out the retired guard had");
  assert.equal(result.permission.bash["*"], "ask", "bash floors to ask");
  assert.equal(result.permission.bash["rm -rf *"], "deny");
  assert.match(result.text, /pi-permission-system\/config\.json/u, "the target path is in the header");
  assert.match(result.text, /pi-agentic-workflow/u, "the header names the authoring surface, so the copy is not mistaken for it");
});

/* ------------------------------------------------------------ declarations */

test("a declared guard lands after the baseline, so its rule wins", () => {
  const result = renderPermissionPolicy({ guards: { "no-dotenv": DENY_ENV } });
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  const keys = Object.keys(result.permission.path);
  assert.equal(keys.includes("**/.env"), true);
  assert.equal(result.permission.path["**/.env"], "deny");
  assert.equal(keys.at(-1), "**/.env", "declarations are appended after the catch-alls");
  assert.match(result.text, /secrets never enter/u, "the reason travels into the projection as a comment");
});

test("two guards disagreeing on one rule are refused instead of silently picking one", () => {
  const result = renderPermissionPolicy({
    guards: {
      a: { kind: "deterministic", surface: "path", rules: [{ match: "**/.env", verdict: "deny" }] },
      b: { kind: "deterministic", surface: "path", rules: [{ match: "**/.env", verdict: "allow" }] },
    },
  });
  assert.equal(result.ok, false);
  assert.ok(JSON.stringify(result.issues).includes("**/.env"));
});

test("a model-backed guard contributes no rule: a static policy holds no model", () => {
  const result = renderPermissionPolicy({ guards: { judge: { kind: "model-backed", surface: "bash", rules: [{ match: "*", verdict: "deny" }] } } });
  assert.equal(result.ok, true, JSON.stringify(result.issues));
  assert.equal(result.permission.bash["*"], "ask", "the baseline posture stands");
});

/* -------------------------------------------------------------- write rules */

test("without --write nothing is written and the block is returned", () => {
  const root = freshRoot();
  try {
    const result = provisionPermissions({ root, guards: { "no-dotenv": DENY_ENV } });
    assert.equal(result.ok, true);
    assert.equal(result.verdict, "rendered");
    assert.equal(result.exitCode, 0);
    assert.equal(existsSync(result.target), false, "printing a projection never creates a file");
    assert.match(result.text, /"permission"/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("--write creates the file only when it is absent", () => {
  const root = freshRoot();
  try {
    const result = provisionPermissions({ root, write: true, guards: { "no-dotenv": DENY_ENV } });
    assert.equal(result.ok, true);
    assert.equal(result.verdict, "written");
    assert.equal(result.exitCode, 0);
    assert.equal(existsSync(result.target), true);
    assert.equal(result.target, permissionConfigPath({ root, scope: "project" }));
    assert.match(readFileSync(result.target, "utf8"), /"\*\*\/\.env": "deny"/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an existing policy file is never overwritten: the run refuses and prints the block to merge", () => {
  const root = freshRoot();
  try {
    const target = permissionConfigPath({ root, scope: "project" });
    mkdirSync(join(root, ".pi", "extensions", "pi-permission-system"), { recursive: true });
    const mine = '{\n  "permission": { "*": "deny" }\n}\n';
    writeFileSync(target, mine);
    const result = provisionPermissions({ root, write: true, guards: { "no-dotenv": DENY_ENV } });
    assert.equal(result.ok, false);
    assert.equal(result.verdict, "refused");
    assert.equal(result.exitCode, 2);
    assert.equal(readFileSync(target, "utf8"), mine, "the operator's bytes are untouched");
    assert.match(result.text, /"permission"/u, "the block still comes back, for a hand merge");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a global-scope projection lands under the agent directory, not the project", () => {
  const root = freshRoot();
  const home = freshRoot();
  try {
    const result = provisionPermissions({ root, home, scope: "global", write: true, guards: {} });
    assert.equal(result.verdict, "written");
    assert.equal(result.target, join(home, ".pi", "agent", "extensions", "pi-permission-system", "config.json"));
    assert.equal(existsSync(result.target), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(home, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------------- CLI */

test("the CLI prints the projection with --json and creates it with --write", () => {
  const root = freshRoot();
  try {
    const printed = spawnSync(process.execPath, [CLI, "provision", "permissions", "--dir", root, "--json"], { encoding: "utf8", env: cliEnv(root) });
    assert.equal(printed.status, 0, printed.stderr);
    const document = JSON.parse(printed.stdout);
    assert.equal(document.ok, true);
    assert.equal(document.verdict, "rendered");
    assert.match(document.text, /"permission"/u);

    const written = spawnSync(process.execPath, [CLI, "provision", "permissions", "--dir", root, "--write", "--json"], { encoding: "utf8", env: cliEnv(root) });
    assert.equal(written.status, 0, written.stderr);
    assert.equal(JSON.parse(written.stdout).verdict, "written");

    const again = spawnSync(process.execPath, [CLI, "provision", "permissions", "--dir", root, "--write", "--json"], { encoding: "utf8", env: cliEnv(root) });
    assert.equal(again.status, 2, "a second write refuses instead of clobbering");
    assert.equal(JSON.parse(again.stdout).verdict, "refused");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

/* --------------------------- external-verify B1 (2026-11-20): loud over silent */

test("the CLI refuses a project file that declares guardPlugins the config system cannot resolve", () => {
  const root = freshRoot();
  try {
    mkdirSync(join(root, ".pi"), { recursive: true });
    writeFileSync(
      join(root, ".pi", "pi-agentic-workflow.json"),
      JSON.stringify({ guardPlugins: { guards: { "no-dotenv": DENY_ENV } } }),
    );
    const refused = spawnSync(process.execPath, [CLI, "provision", "permissions", "--dir", root], { encoding: "utf8", env: cliEnv(root) });
    assert.equal(refused.status, 2, `silent baseline is the defect: ${refused.stdout}`);
    assert.match(refused.stderr, /PROVISION permissions — refused:/u, "the refusal names the command");
    assert.match(refused.stderr, /guardPlugins/u, "the refusal names what could not be read");
    assert.match(refused.stderr, /not registered/u, "the reason is the unresolved section, not a generic failure");
    assert.equal(/verdict: rendered/u.test(refused.stdout), false, "nothing renders when the declarations cannot be read");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an authoring file without a guardPlugins key keeps the baseline — absence, not mere existence, is the silence", () => {
  const root = freshRoot();
  try {
    mkdirSync(join(root, ".pi"), { recursive: true });
    writeFileSync(join(root, ".pi", "pi-agentic-workflow.json"), JSON.stringify({ default: { model: "inherit" } }));
    const rendered = spawnSync(process.execPath, [CLI, "provision", "permissions", "--dir", root, "--json"], { encoding: "utf8", env: cliEnv(root) });
    assert.equal(rendered.status, 0, rendered.stderr);
    assert.equal(JSON.parse(rendered.stdout).verdict, "rendered", "routing-only config is not a declaration to drop");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CLI refuses an authoring file that fails validation instead of projecting the defaults over it", () => {
  const root = freshRoot();
  try {
    mkdirSync(join(root, ".pi"), { recursive: true });
    mkdirSync(join(root, "config-extensions"), { recursive: true });
    writeFileSync(
      join(root, "config-extensions", "pi.json"),
      readFileSync(new URL("../../pi-agentic-workflow/agentic-workflow.config.json", import.meta.url)),
    );
    writeFileSync(
      join(root, ".pi", "pi-agentic-workflow.json"),
      JSON.stringify({ guardPlugins: { guards: { g: { kind: "deterministic", surface: "path", rules: [{ match: "*", verdict: "maybe" }] } } } }),
    );
    const refused = spawnSync(process.execPath, [CLI, "provision", "permissions", "--dir", root, "--json"], { encoding: "utf8", env: cliEnv(root) });
    assert.equal(refused.status, 2, `an invalid declaration must not project as defaults: ${refused.stdout}`);
    const document = JSON.parse(refused.stdout);
    assert.equal(document.ok, false);
    assert.equal(document.verdict, "refused");
    assert.match(JSON.stringify(document.issues), /verdict/u, "the refusal carries the failing path");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
