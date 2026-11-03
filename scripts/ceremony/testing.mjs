#!/usr/bin/env node
/**
 * testing.mjs — shared fixture helpers for the ceremony suites.
 *
 * Fixtures live in `mktemp -d` temp repos, never in the worktree (the fix
 * command's §3 rule). Every fixture repo neutralizes the operator's global
 * git config (`commit.gpgsign=false`, explicit user) so fixtures stay
 * hermetic — the pattern the repo's other suites use.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ENTRY = fileURLToPath(new URL("../ceremony.mjs", import.meta.url));

/** Fixture repos created by makeRepo() — removed at process exit so suite
 *  runs never leak `ceremony-*` dirs into the temp directory. */
const LIVE_FIXTURES = [];
process.on("exit", () => {
  for (const dir of LIVE_FIXTURES) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
});

/** Run the ceremony CLI in `cwd` → {code, stdout, json} (json parsed from stdout, stderr kept separate for error text). */
export function cer(args, cwd) {
  let stdout = "";
  let stderr = "";
  let code = 0;
  try {
    stdout = execFileSync("node", [ENTRY, ...args], { cwd, encoding: "utf8" });
  } catch (err) {
    code = err.status ?? 1;
    stdout = err.stdout ?? "";
    stderr = err.stderr ?? "";
  }
  let json = null;
  try {
    json = JSON.parse(stdout);
  } catch {
    /* non-JSON output (only git-backed strings inside JSON are expected) */
  }
  return { code, stdout, stderr, json };
}

/** Create a hermetic temp git repo (branch main, 1 commit) → its path. */
export function makeRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ceremony-"));
  LIVE_FIXTURES.push(dir);
  const g = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  g("init", "-b", "main");
  g("config", "commit.gpgsign", "false");
  g("config", "user.email", "fixture@example.test");
  g("config", "user.name", "fixture");
  fs.writeFileSync(path.join(dir, "README.md"), "# fixture\n");
  g("add", ".");
  g("commit", "-m", "chore: fixture seed");
  return dir;
}

/** Write + commit a file in the fixture repo → {sha}. */
export function commitFile(dir, file, content, message = "chore: fixture change") {
  const p = path.join(dir, file);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  const g = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  g("add", ".");
  g("commit", "-m", message);
  return { sha: g("rev-parse", "HEAD").trim() };
}

/** Minimal single-layer unit doc (fixture) with Tasks + Log + Findings + ACs. */
export function unitDoc({ slug = "1-fixture", tasks = "", log = "", findings = "" } = {}) {
  return `# fix/${slug}

## Issue

\`#1\` — fixture issue.

## Specs

**S1 — fixture.**
> fixture quote

## Acceptance criteria

- **AC-S1** — the fixture behaves. Check: \`true\` exits 0.

## Tasks

${tasks}

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
${findings}

## Log

${log}

## Next

n/a

## References

none

## Branch

fix/${slug}

## Depends on

## Regression scope

n/a
`;
}
