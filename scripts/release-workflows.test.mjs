#!/usr/bin/env node
/**
 * Workflow contract for the release pipeline (feature 40, issue #180).
 *
 * AC-04/AC-06: every publish workflow exposes a `channel` workflow_dispatch
 * input (default `latest`) and passes `--tag <channel>` to npm publish —
 * dist-tags without renaming any workflow file (the npm Trusted Publisher
 * records bind to the filenames, PE-008).
 * AC-08: a skills-only merge cuts no npm canary — the push triggers' paths
 * name package trees and the workflow file only, never `skills/`.
 * AC-05/AC-09 differential: push-triggered runs keep the current default
 * (`latest` at the repo version), so existing behavior is byte-preserved.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORKFLOWS = [
  ".github/workflows/publish-schema.yml",
  ".github/workflows/publish-pi-package.yml",
  ".github/workflows/publish-agentic-workflow.yml",
];

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

test("every publish workflow exposes a channel dispatch input defaulting to latest (AC-04)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    assert.match(text, /workflow_dispatch:/, `${rel} keeps workflow_dispatch`);
    const inputBlock = text.slice(text.indexOf("workflow_dispatch:"));
    assert.match(
      inputBlock,
      /inputs:\s*\n\s*channel:\s*\n[\s\S]{0,400}?default:\s*latest/,
      `${rel} declares a channel input with default latest`,
    );
  }
});

test("the publish step passes the channel as the npm dist-tag (AC-05/AC-06)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    assert.match(
      text,
      /npm publish --access public --provenance --tag "?\$\{\{[^}]*channel/,
      `${rel} passes --tag from the channel input`,
    );
  }
});

test("push triggers name package paths only — a skills-only merge cuts no npm release (AC-08)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    const on = text.slice(text.indexOf("on:"), text.indexOf("permissions:"));
    const paths = [...on.matchAll(/-\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(paths.length > 0, `${rel} has push paths`);
    for (const p of paths) {
      assert.doesNotMatch(p, /^skills\//, `${rel} push path "${p}" must not be a skills/ path`);
    }
  }
});

test("push-triggered runs publish at the repo version as latest (differential: current behavior)", () => {
  for (const rel of WORKFLOWS) {
    const text = read(rel);
    // the tag falls back to latest when no dispatch input exists (push runs)
    assert.match(text, /inputs\.channel\s*\|\|\s*'latest'|inputs\.channel \|\| 'latest'/, `${rel} falls back to latest`);
  }
});

test("no publish workflow file is renamed (Trusted Publisher binding intact, S4/PE-008)", () => {
  for (const rel of WORKFLOWS) assert.ok(fs.existsSync(path.join(repoRoot, rel)), `${rel} exists`);
});
