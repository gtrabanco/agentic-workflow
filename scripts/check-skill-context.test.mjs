#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-context-check-"));

try {
  fs.cpSync(path.join(repoRoot, "skills"), path.join(fixture, "skills"), { recursive: true });
  fs.mkdirSync(path.join(fixture, "docs/workflow"), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, "docs/workflow/SKILL_CONTEXT_BUDGETS.json"),
    path.join(fixture, "docs/workflow/SKILL_CONTEXT_BUDGETS.json"),
  );
  fs.mkdirSync(path.join(fixture, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "scripts/check-skill-context.mjs"), path.join(fixture, "scripts/check-skill-context.mjs"));

  const skillFile = path.join(fixture, "skills/review-change/SKILL.md");
  fs.appendFileSync(skillFile, "\nSee [nested](references/subdir/leaf.md).\n");
  fs.mkdirSync(path.join(fixture, "skills/review-change/references/subdir"), { recursive: true });
  fs.writeFileSync(path.join(fixture, "skills/review-change/references/subdir/leaf.md"), "# Nested\n");

  const result = spawnSync(process.execPath, [path.join(fixture, "scripts/check-skill-context.mjs"), "--skill", "review-change"], {
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /nested reference link exceeds depth 1/);
  console.log("PASS context checker: nested reference rejected");
} finally {
  fs.rmSync(fixture, { recursive: true, force: true });
}
