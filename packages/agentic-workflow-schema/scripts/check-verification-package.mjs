#!/usr/bin/env node
/**
 * AC7 package-content gate.
 *
 * Proves the shipped tarball carries what the manifest promises, with the two
 * generated verification projections named explicitly: a schema that exists in the
 * repository but is not packed is invisible to consumers, and an entry in the
 * `exports` map that points at an unpacked file breaks every import at runtime.
 *
 * Uses `npm pack --dry-run --json`, so no tarball is ever written.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PACKAGE_ROOT = new URL("..", import.meta.url).pathname;
/** The generated structural projections feature 26 must ship (AC7, AC9). */
const REQUIRED_PROJECTIONS = ["verification-plan.schema.json", "verification-receipt.schema.json"];

function run(...args) {
  return execFileSync(args[0], args.slice(1), { cwd: PACKAGE_ROOT, encoding: "utf8" });
}

const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const packed = JSON.parse(run("npm", "pack", "--dry-run", "--json"));
const entry = packed[manifest.name] ?? Object.values(packed)[0];
if (!entry?.files) {
  console.error("npm pack --json returned no file list");
  process.exit(1);
}
const shipped = new Set(entry.files.map((file) => file.path));
const failures = [];

// 1. Both generated projections must ship, and be listed in `files` so the
//    requirement is visible in the manifest rather than emergent from npm rules.
for (const projection of REQUIRED_PROJECTIONS) {
  if (!shipped.has(projection)) failures.push(`${projection} is not in the packed tarball`);
  if (!manifest.files.includes(projection)) failures.push(`${projection} is not listed in package.json "files"`);
  if (!(`./${projection}` in (manifest.exports ?? {}))) {
    failures.push(`./${projection} is not exportable through package.json "exports"`);
  }
}

// 2. Every `exports` target must actually be shipped (or produced by the build).
for (const [specifier, target] of Object.entries(manifest.exports ?? {})) {
  const paths = typeof target === "string" ? [target] : Object.values(target ?? {});
  for (const path of paths) {
    if (typeof path !== "string" || !path.startsWith("./")) continue;
    const relative = path.slice(2);
    if (!shipped.has(relative)) failures.push(`exports["${specifier}"] -> ${relative} is not packed`);
  }
}

// 3. The build output and the human/ES documentation surface must ship.
for (const required of ["dist/index.js", "dist/index.d.ts", "README.md", "README.es.md", "LICENSE"]) {
  if (!shipped.has(required)) failures.push(`${required} is not packed`);
}

// 4. Nothing that only belongs in the repository may leak into the tarball.
for (const path of shipped) {
  if (path.startsWith("src/") || path.startsWith("test/") || path.startsWith("scripts/")) {
    failures.push(`${path} is development-only but got packed`);
  }
}

console.log(`package   ${manifest.name}@${manifest.version}`);
console.log(`tarball   ${entry.filename} (${entry.size} B packed, ${entry.unpackedSize} B unpacked)`);
console.log(`files     ${shipped.size}, projections ${REQUIRED_PROJECTIONS.length}/${REQUIRED_PROJECTIONS.length}`);

if (failures.length > 0) {
  console.error("\npackage content violations:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}
console.log(`PASS · ${manifest.name}@${manifest.version} ships both verification projections and every exports target`);
