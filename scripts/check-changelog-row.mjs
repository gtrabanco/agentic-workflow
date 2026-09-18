#!/usr/bin/env node
/**
 * check-changelog-row.mjs <table-heading> <version> [file]
 *
 * Prints how many `CHANGELOG.md` rows state <version> inside the table whose
 * `##`-level heading contains <table-heading>, and exits 0 only when that count
 * is exactly 1. It exists because an unscoped `grep -c "^| <version> |"` over
 * the whole file counts every table that happens to share the version — six on
 * this repository's head — so it can never assert "this one table has the row".
 *
 * Portable by design: plain Node ESM with node: builtins only (runs identically
 * under bun and node), no dependencies, no shell features, no git. Usage:
 *   bun scripts/check-changelog-row.mjs fold-findings 1.5.1
 *
 * Exit codes: 0 = exactly one row, 1 = not exactly one (fail closed), 2 = usage
 * or unreadable file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [heading, version, file] = process.argv.slice(2);
if (!heading || !version) {
  console.error("usage: check-changelog-row.mjs <table-heading> <version> [file]");
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const changelogPath = file ? path.resolve(file) : path.join(root, "CHANGELOG.md");

let text;
try {
  text = fs.readFileSync(changelogPath, "utf8");
} catch {
  console.error(`check-changelog-row: cannot read ${changelogPath}`);
  process.exit(2);
}

// Walk the file once, tracking the innermost heading. A heading owns every line
// below it until the next heading of any level, so the count is scoped to the
// named table instead of the whole file.
const rowPrefix = `| ${version} |`;
let inSection = false;
let count = 0;
for (const line of text.split("\n")) {
  if (/^#{2,6} /.test(line)) {
    inSection = line.includes(heading);
    continue;
  }
  if (inSection && line.startsWith(rowPrefix)) count += 1;
}

console.log(count);
process.exit(count === 1 ? 0 : 1);
