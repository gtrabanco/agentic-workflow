// ci-guard.test.mjs — creating and triggering CI is owner-gated.
//
// A workflow definition is code the forge runs on the next push, and a
// workflow run consumes the repository's minutes: both are blocked while the
// operator asked for them (`guards.ci`), and both pass on the explicit
// per-command token (`AW_ALLOW=ci`). Reads are never gated.

import { test } from "node:test";
import assert from "node:assert/strict";

import { ciGuard } from "../dist/extension/ci-guard.js";

const bash = (command) => ({ toolName: "bash", command });
const write = (path) => ({ toolName: "write", path });
const edit = (path) => ({ toolName: "edit", path });
const OFF = { create: false, run: false };
const ON = { create: true, run: true };

test("create: a workflow definition under any forge's workflows dir is blocked", () => {
  for (const path of [
    ".github/workflows/ci.yml",
    "/repo/.github/workflows/pin-watch.yml",
    ".gitea/workflows/build.yml",
    ".forgejo/workflows/release.yml",
    ".gitlab-ci.yml",
  ]) {
    assert.equal(ciGuard(write(path), ON).block, true, path);
    assert.equal(ciGuard(edit(path), ON).block, true, path);
  }
});

test("create: other files are never gated", () => {
  for (const path of [".github/ISSUE_TEMPLATE/bug.yml", "docs/workflows.md", "src/ci.ts", "workflows/local.yml"]) {
    assert.equal(ciGuard(write(path), ON).block, false, path);
  }
});

test("create: disabled means no opinion", () => {
  assert.equal(ciGuard(write(".github/workflows/ci.yml"), OFF).block, false);
});

test("run: triggering a workflow is blocked in every direct form", () => {
  for (const command of [
    "gh workflow run ci.yml",
    "gh workflow run ci.yml --ref feat/x",
    "gh run rerun 12345",
    "gh api -X POST repos/gtrabanco/agentic-workflow/actions/workflows/ci.yml/dispatches -f ref=main",
  ]) {
    assert.equal(ciGuard(bash(command), ON).block, true, command);
  }
});

test("run: reads and unrelated commands stay allowed", () => {
  for (const command of ["gh workflow list", "gh run list --limit 5", "gh run view 12345 --log", "bun test test/"]) {
    assert.equal(ciGuard(bash(command), ON).block, false, command);
  }
});

test("run: disabled means no opinion", () => {
  assert.equal(ciGuard(bash("gh workflow run ci.yml"), OFF).block, false);
});

test("AW_ALLOW=ci enables both halves", () => {
  assert.equal(ciGuard(bash("AW_ALLOW=ci gh workflow run ci.yml"), ON).block, false);
  assert.equal(ciGuard({ toolName: "write", path: ".github/workflows/ci.yml", command: "AW_ALLOW=ci" }, ON).block, false);
});
