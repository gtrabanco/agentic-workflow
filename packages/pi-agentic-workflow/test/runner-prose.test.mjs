// runner-prose.test.mjs — the pi package carries no runner invocation (issue #555).
//
// The owner's requirement, verbatim: the invocation prose lives in the skills,
// the detection is programmatic, and pi stops carrying the prose. This suite is
// that claim's mechanical half:
//
//  - **The packaged skills carry none.** The staged bundle is the declared
//    projection of `skills/`, and the projection pointerises the contract's
//    invocation section; no bundled file may name a launcher for this crate.
//  - **The package's own files carry none.** The README, `src/` and `scripts/`
//    describe what pi does, never how to download the runner.
//  - **What replaces it exists.** The generic runner door is registered (a
//    bundled skill's symbolic `runner <subcommand>` citation stays executable in
//    a pi session) and documented where the tool table lives.
//
// The scan is about the *invocation* — a launcher followed by this package's
// name — never about the bare word: prose that explains where the choice lives
// may name the closed set.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const PKG_DIR = resolve(import.meta.dirname, "..");
const BUNDLE = join(PKG_DIR, "skills");
const INVOCATION = /(?:bunx|npx(?:\s+--yes)?|pnpm\s+dlx)\s+@gtrabanco\/agentic-workflow/u;

/** Every file below `dir`, as absolute paths, skipping the named directories. */
function walk(dir, skip = new Set()) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs, skip));
    else out.push(abs);
  }
  return out;
}

const offenders = (files) =>
  files
    .filter((file) => {
      if (!/\.(?:md|mjs|cjs|ts|json)$/u.test(file)) return false;
      try {
        return INVOCATION.test(readFileSync(file, "utf8"));
      } catch {
        return false;
      }
    })
    .map((file) => relative(PKG_DIR, file));

test("the packaged skills carry no runner invocation", () => {
  // The bundle is staged by `bun run bundle:skills` before this suite runs; its
  // absence would make the claim vacuous, so that is a failure.
  assert.ok(statSync(BUNDLE).isDirectory(), "the staged skill bundle exists");
  assert.deepEqual(offenders(walk(BUNDLE)), [], "no bundled file names a launcher for the runner crate");
});

test("the package's own files carry no runner invocation", () => {
  const files = [
    join(PKG_DIR, "README.md"),
    ...walk(join(PKG_DIR, "src")),
    ...walk(join(PKG_DIR, "scripts")),
  ];
  assert.deepEqual(offenders(files), [], "pi documents what it does, never how to download the crate");
});

test("the projected contract keeps the pi route and drops the invocation", () => {
  const runner = readFileSync(join(BUNDLE, "runner-contract", "references", "RUNNER.md"), "utf8");
  assert.match(runner, /^## In a pi session$/mu, "the pi route stays in the packaged contract");
  assert.match(runner, /`runner <subcommand> \[args…\]`/u, "the symbolic citation pi sessions resolve stays");
  assert.match(runner, /Enforced by `runner resolve`/u, "the invocation section is pointerised, not paraphrased");
  assert.doesNotMatch(runner, /runner-set@1/u, "the closed-set table is the standalone tree's, not the bundle's");
});

test("the generic runner door is registered and documented", async () => {
  const { createWorkflowTools } = await import("../dist/extension/workflow-tools.js");
  const names = createWorkflowTools().map((tool) => tool.name);
  assert.ok(names.includes("agentic_workflow_run"), `the bundled skills' citations need a door: ${names.join(", ")}`);

  const readme = readFileSync(join(PKG_DIR, "README.md"), "utf8");
  assert.match(readme, /`agentic_workflow_run`/u, "the tool table documents the door");
});
