// hook-shims.test.mjs — the shim contract, read from the tree (unit 554).
//
// The behavioural corpus lives beside the hooks
// (`template/.agentic-workflow/hooks/tests/test-hook-shims.sh`, which needs bash
// and a PATH stub). This suite is the half the root gate runs on every push: it
// reads the shipped files and fails when a hook grows a rule again, when a shim
// stops resolving the universal CLI, or when the README stops declaring the
// degradation each hook answers with.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..");
const HOOKS = path.join(REPO_ROOT, "template", ".agentic-workflow", "hooks");

/** The shell files a template project installs, `tests/` excluded. */
function hookFiles() {
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "tests") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".sh")) found.push(full);
    }
  };
  walk(HOOKS);
  return found.sort();
}

/** The files the universal-CLI shims replaced: they exec it and carry no rule. */
const CLI_SHIMS = [
  "guard-command.sh",
  "turn-contract.sh",
  "git-identity-check.sh",
  "fullauto-merge.sh",
  "adapters/pre-tool-guard.sh",
  "adapters/copilot-guard.sh",
  "adapters/normalize-hook-payload.sh",
];

const read = (relative) => readFileSync(path.join(HOOKS, relative), "utf8");

test("every template hook is a shell file the inventory can read", () => {
  const files = hookFiles().map((file) => path.relative(HOOKS, file).split(path.sep).join("/"));
  assert.ok(files.length >= 8, `expected the shipped hooks, found ${files.length}`);
  for (const expected of CLI_SHIMS) {
    assert.ok(files.includes(expected), `${expected} ships`);
  }
});

for (const relative of CLI_SHIMS) {
  test(`${relative} resolves the universal CLI and execs it`, () => {
    const text = read(relative);
    assert.match(text, /AGENTIC_WORKFLOW_BIN/u, "it honours the override");
    assert.match(text, /command -v agentic-workflow/u, "it resolves the installed CLI");
    assert.match(text, /exec "\$bin" /u, "it execs the CLI rather than re-implementing it");
  });

  test(`${relative} carries no decision rule`, () => {
    const text = read(relative);
    for (const forbidden of [
      ["jq -", /jq -/u],
      ["a grep -E rule", /grep -E/u],
      ["a private temp fallback", /\$\{TMPDIR/u],
      ["a mktemp call", /\bmktemp\b/u],
      ["the retired shell forge adapter", /forge_detect/u],
      ["the retired shell temp helper", /aw_tmpdir|aw_mktemp_file/u],
      ["a hard-coded mainline ref", /origin\/HEAD|origin\/main/u],
    ]) {
      assert.doesNotMatch(text, forbidden[1], `${relative} must not carry ${forbidden[0]}`);
    }
  });
}

test("the index-refresh hook keeps its own documented contract", () => {
  const text = read("index-sync.sh");
  assert.match(text, /doc --sync --quiet/u, "it still refreshes the index");
  assert.match(text, /exit 0/u, "it never fails a git operation");
});

test("the hooks README declares the degradation and the shim shape", () => {
  const text = read("README.md");
  assert.match(text, /## The CLI is the one implementation/u);
  assert.match(text, /## Degradation/u);
  for (const shim of CLI_SHIMS) {
    assert.ok(
      text.includes(path.basename(shim)),
      `the README names ${path.basename(shim)} in its table`,
    );
  }
  assert.match(text, /never fail a git operation/u, "index-sync's no-op is stated");
});

test("no retired shell library remains in the hooks tree", () => {
  const lib = path.join(HOOKS, "lib");
  let entries = [];
  try {
    entries = readdirSync(lib);
  } catch {
    entries = [];
  }
  assert.deepEqual(entries, [], "lib/ is gone: the rule lives in the crate");
  for (const file of hookFiles()) {
    assert.ok(!readFileSync(file, "utf8").includes("lib/forge.sh"), `${file} sources no deleted library`);
  }
});

test("the tests directory carries no retired suite", () => {
  const tests = readdirSync(path.join(HOOKS, "tests")).sort();
  assert.ok(!tests.includes("test-forge-adapter.sh"), "the forge adapter suite moved to the crate");
  assert.ok(!tests.includes("test-temp-lib.sh"), "the temp library suite moved to the crate");
  assert.ok(tests.includes("test-hook-shims.sh"), "the shim corpus ships");
  for (const file of tests) {
    assert.equal(statSync(path.join(HOOKS, "tests", file)).isFile(), true);
  }
});
