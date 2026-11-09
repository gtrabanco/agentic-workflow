#!/usr/bin/env node
/**
 * temp-hygiene.mjs — the static floor of the temp-leak defence (issue #476).
 *
 * The incident: 14 test files created temp dirs with zero cleanup capability,
 * so every red run leaked, until 494k files saturated `/tmp` and blocked the
 * session daemon behind the same disk I/O. This gate converts that leak class
 * into a red push: every scanned file that creates temp dirs must carry a
 * cleanup capability in the same file — an `rmSync` call, or the tracked
 * helper `tempRoot` (`scripts/temp-root.mjs`). The floor is fail-closed: no
 * cleanup signal at all is a finding, never a warning.
 *
 * What it scans, over `--root` (default: this repository), every .mjs file
 * recursively:
 *
 *   - the `scripts` directory
 *   - every package under `packages` — its `test`, `src` and `scripts`
 *     directories
 *
 * A file is *creating* when it calls `mkdtemp`/`mkdtempSync`, or when it both
 * calls `mkdir`/`mkdirSync` and reads `tmpdir()`. A file is *cleaning* when
 * its text carries `rmSync(`, `tempRoot(` or `rm(`. The check is a floor,
 * not a proof: a partially-cleaned file passes it, and the runtime backstop
 * (`scripts/tmp-gc.mjs`) sweeps what any run still leaves behind. `dist/`,
 * `node_modules/`, `build/` and `coverage/` are never scanned.
 *
 * stdout: a `temp-hygiene —` header naming the scanned and creating counts,
 * one `FINDING <file> — NO-CLEANUP: …` line per finding in path order, a
 * tally, then the verdict. exit: 0 only when the verdict is `PASS`; 1 on
 * findings; 2 on usage. Read-only: it writes nothing. Its sibling suite is
 * `scripts/temp-hygiene.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const USAGE = `usage: temp-hygiene [--root <dir>] [--json]

  --root <dir>  the tree to scan (default: this repository)
  --json        one JSON object instead of the fixed text block

stdout: one "FINDING <file> — NO-CLEANUP" line per leak-capable file, the
tally, the verdict. exit: 0 pass · 1 findings · 2 usage`;

const SKIP_DIRS = new Set(["node_modules", "dist", "build", "coverage", ".git"]);
const MKDTEMP_CALL = /\bmkdtemp(Sync)?\(/;
const TMPDIR_CALL = /\btmpdir\(\)/;
const MKDIR_CALL = /\bmkdir(Sync)?\(/;
const CLEANUP_SIGNAL = /\brmSync\(|\btempRoot\(|\brm\(/;

function usage(message) {
  process.stderr.write(`temp-hygiene: ${message}\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  let root = null;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined) usage("--root needs a directory");
      root = path.resolve(value);
      index += 1;
    } else if (arg === "--json") json = true;
    else usage(`unknown argument ${arg}`);
  }
  return { root: root ?? ROOT, json };
}

/** Every `.mjs` file under `dir`, skipping the never-scanned directories. */
export function collectFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const dirent of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, dirent.name);
      if (dirent.isDirectory()) {
        if (!SKIP_DIRS.has(dirent.name)) stack.push(full);
      } else if (dirent.isFile() && dirent.name.endsWith(".mjs")) {
        out.push(full);
      }
    }
  }
  return out.sort();
}

/** The scanned scopes of a root: `scripts/` plus every package's `test/`,
 *  `src/` and `scripts/`. */
export function scopes(root) {
  const dirs = [path.join(root, "scripts")];
  const packages = path.join(root, "packages");
  if (fs.existsSync(packages)) {
    for (const dirent of fs.readdirSync(packages, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      for (const scope of ["test", "src", "scripts"]) {
        dirs.push(path.join(packages, dirent.name, scope));
      }
    }
  }
  return dirs;
}

/** The audit itself: one `{ file, code, detail }` per leak-capable file. */
export function audit(root) {
  const files = scopes(root).flatMap((dir) => collectFiles(dir));
  const creating = [];
  const findings = [];
  for (const full of files) {
    const text = fs.readFileSync(full, "utf8");
    if (!MKDTEMP_CALL.test(text) && !(TMPDIR_CALL.test(text) && MKDIR_CALL.test(text))) continue;
    creating.push(full);
    if (CLEANUP_SIGNAL.test(text)) continue;
    findings.push({
      file: path.relative(root, full).split(path.sep).join("/"),
      code: "NO-CLEANUP",
      detail: "creates temp dirs (mkdtemp / mkdir over tmpdir) without rmSync or tempRoot in the same file",
    });
  }
  return { scanned: files.length, creating: creating.length, findings };
}

function main(argv) {
  const { root, json } = parseArgs(argv);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) usage(`--root ${root} is not a directory`);

  const result = audit(root);
  const verdict = result.findings.length === 0 ? "PASS" : "FAIL";
  if (json) {
    console.log(JSON.stringify({ ...result, verdict }));
  } else {
    console.log(`temp-hygiene — ${result.scanned} file(s) scanned · ${result.creating} creating · root: ${root}`);
    for (const finding of result.findings) {
      console.log(`FINDING ${finding.file} — ${finding.code}: ${finding.detail}`);
    }
    console.log(`temp-hygiene: ${result.findings.length} finding(s)`);
    console.log(`verdict: ${verdict}`);
  }
  process.exit(verdict === "PASS" ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
