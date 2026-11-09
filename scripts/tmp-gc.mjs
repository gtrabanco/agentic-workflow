#!/usr/bin/env node
/**
 * tmp-gc.mjs — the runtime backstop of the temp-leak defence (issue #476).
 *
 * The static floor (`scripts/temp-hygiene.mjs`) stops new leak-capable files,
 * but directories a killed runner already left behind — and the 3,532 the
 * incident produced — only go away when something sweeps. This gate sweeps
 * the machine's temp roots for entries whose names start with a prefix the
 * repository's own sources declare: the prefix allowlist is discovered from
 * the fixture prefixes the sources pass to `tmpdir()`, so it is
 * self-maintaining — a new fixture prefix is swept the moment its source
 * lands. Only entries older than the age bound are removed, never a fresh
 * directory a running suite may be using; a name no source declared is never
 * touched; the filesystem root and the sources tree itself are refused.
 *
 * Usage
 *   node scripts/tmp-gc.mjs                       (the real sweep, /tmp + /var/tmp)
 *   node scripts/tmp-gc.mjs --dry-run             (report only)
 *   node scripts/tmp-gc.mjs --root <dir> --sources <dir> --max-age <minutes>
 *
 * Defaults: roots TMPDIR, /tmp and /var/tmp (deduplicated, existing ones
 * only), sources this repository, max age 360 minutes. stdout: a `tmp-gc —`
 * header naming roots, prefixes, scanned, candidates and removed, one
 * `REMOVED <name> (<root>)` line per removal, one `GC-ERROR <path>` line per
 * failed removal, a tally, then the verdict. exit: 0 when the sweep
 * completed; 1 when a removal failed; 2 on usage or a safety refusal.
 *
 * Its sibling suite is `scripts/tmp-gc.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const USAGE = `usage: tmp-gc [--root <dir>] [--sources <dir>] [--max-age <minutes>] [--dry-run] [--json]

  --root <dir>         sweep only this directory (default: TMPDIR, /tmp, /var/tmp)
  --sources <dir>      the tree the prefix allowlist is discovered from
                       (default: this repository)
  --max-age <minutes>  remove only entries older than this (default: 360)
  --dry-run            report the candidates, remove nothing
  --json               one JSON object instead of the fixed text block

stdout: one "REMOVED <name>" line per removal, the tally, the verdict.
exit: 0 sweep completed · 1 a removal failed · 2 usage or safety refusal`;

const SKIP_DIRS = new Set(["node_modules", "dist", "build", "coverage", ".git"]);
const PREFIX_LITERAL = /tmpdir\(\)[^"'`\n]*["'`]([A-Za-z0-9][A-Za-z0-9._-]*-)["'`]/g;

function usage(message) {
  process.stderr.write(`tmp-gc: ${message}\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  let root = null;
  let sources = null;
  let maxAge = null;
  let dryRun = false;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined) usage("--root needs a directory");
      root = path.resolve(value);
      index += 1;
    } else if (arg === "--sources") {
      const value = argv[index + 1];
      if (value === undefined) usage("--sources needs a directory");
      sources = path.resolve(value);
      index += 1;
    } else if (arg === "--max-age") {
      const value = argv[index + 1];
      if (value === undefined || !/^[0-9]+$/.test(value) || Number(value) <= 0) {
        usage(`--max-age needs a positive integer (minutes), got ${value ?? "nothing"}`);
      }
      maxAge = Number(value);
      index += 1;
    } else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--json") json = true;
    else usage(`unknown argument ${arg}`);
  }
  return {
    root,
    sources: sources ?? ROOT,
    maxAge: maxAge ?? 360,
    dryRun,
    json,
  };
}

/** Every `.mjs` file under `dir`, skipping the never-scanned directories. */
function collectFiles(dir) {
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
  return out;
}

/** The prefix allowlist: every string literal ending in a dash that a
 *  `tmpdir()` call feeds, deduplicated, sorted. A literal without a trailing
 *  dash is never a fixture prefix and never enters the allowlist. */
export function discoverPrefixes(sourcesDir) {
  const prefixes = new Set();
  const dirs = [path.join(sourcesDir, "scripts")];
  const packages = path.join(sourcesDir, "packages");
  if (fs.existsSync(packages)) {
    for (const dirent of fs.readdirSync(packages, { withFileTypes: true })) {
      if (!dirent.isDirectory()) continue;
      for (const scope of ["test", "src", "scripts"]) dirs.push(path.join(packages, dirent.name, scope));
    }
  }
  for (const full of dirs.flatMap((dir) => collectFiles(dir))) {
    const text = fs.readFileSync(full, "utf8");
    for (const match of text.matchAll(PREFIX_LITERAL)) prefixes.add(match[1]);
  }
  return [...prefixes].sort();
}

/** The default roots: TMPDIR, /tmp and /var/tmp — deduplicated, existing. */
export function defaultRoots() {
  const roots = [...new Set([process.env.TMPDIR, "/tmp", "/var/tmp"].filter(Boolean))];
  return roots.map((root) => path.resolve(root)).filter((root) => fs.existsSync(root));
}

/** Sweep one root: the matching entries older than `maxAgeMs`. With `dry`
 *  the candidates are reported and nothing is written. */
export function sweep(root, prefixes, maxAgeMs, dry) {
  const removed = [];
  const errors = [];
  let candidates = 0;
  if (!fs.existsSync(root)) return { scanned: 0, candidates: 0, removed, errors };
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch (error) {
    return { scanned: 0, candidates: 0, removed, errors: [{ full: root, detail: error.message }] };
  }
  const now = Date.now();
  for (const dirent of entries) {
    if (!prefixes.some((prefix) => dirent.name.startsWith(prefix))) continue;
    const full = path.join(root, dirent.name);
    let mtimeMs;
    try {
      mtimeMs = fs.lstatSync(full).mtimeMs;
    } catch (error) {
      errors.push({ full, detail: error.message });
      continue;
    }
    if (now - mtimeMs < maxAgeMs) continue;
    candidates += 1;
    if (dry) continue;
    try {
      fs.rmSync(full, { recursive: true, force: true });
      removed.push(dirent.name);
    } catch (error) {
      errors.push({ full, detail: error.message });
    }
  }
  return { scanned: entries.length, candidates, removed, errors };
}

function main(argv) {
  const { root, sources, maxAge, dryRun, json } = parseArgs(argv);
  if (!fs.existsSync(sources)) usage(`--sources ${sources} is not a directory`);
  const roots = root ? [root] : defaultRoots();
  for (const sweepRoot of roots) {
    if (sweepRoot === path.parse(sweepRoot).root) {
      usage(`refused: ${sweepRoot} is a filesystem root — name a temp directory`);
    }
    if (path.resolve(sweepRoot) === path.resolve(sources)) {
      usage(`refused: the sweep root equals the sources tree (${sources})`);
    }
    if (!fs.existsSync(sweepRoot)) usage(`--root ${sweepRoot} does not exist`);
  }

  const prefixes = discoverPrefixes(sources);
  const maxAgeMs = maxAge * 60_000;
  const runs = roots.map((sweepRoot) => ({ root: sweepRoot, ...sweep(sweepRoot, prefixes, maxAgeMs, dryRun) }));
  const scanned = runs.reduce((sum, run) => sum + run.scanned, 0);
  const candidates = runs.reduce((sum, run) => sum + run.candidates, 0);
  const removed = runs.flatMap((run) => run.removed.map((name) => ({ root: run.root, name })));
  const errors = runs.flatMap((run) => run.errors.map((error) => ({ ...error, root: run.root })));
  const verdict = errors.length === 0 ? "PASS" : "FAIL";

  if (json) {
    console.log(
      JSON.stringify({
        roots,
        prefixes,
        scanned,
        candidates,
        removed: removed.map((entry) => entry.name),
        errors,
        dryRun,
        verdict,
      }),
    );
  } else {
    console.log(
      `tmp-gc — roots: ${roots.join(", ")} · prefixes: ${prefixes.length} · scanned: ${scanned} · candidates: ${candidates} · removed: ${removed.length}${dryRun ? ` · dry-run: would remove ${candidates}` : ""}`,
    );
    for (const entry of removed) console.log(`REMOVED ${entry.name} (${entry.root})`);
    for (const error of errors) console.log(`GC-ERROR ${error.full} — ${error.detail}`);
    console.log(`tmp-gc: ${candidates} candidate(s), ${removed.length} removed${dryRun ? " (dry-run)" : ""}`);
    console.log(`verdict: ${verdict}`);
  }
  process.exit(verdict === "PASS" ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
