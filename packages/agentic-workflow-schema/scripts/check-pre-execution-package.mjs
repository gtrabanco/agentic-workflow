#!/usr/bin/env node
/**
 * Feature 28 AC7 — package-content gate for the pre-execution contracts.
 *
 * The mirror of `check-verification-package.mjs` for the new family: a projection
 * that exists in the repository but is not packed is invisible to consumers, and an
 * `exports` entry that points at an unpacked file breaks every import at runtime.
 * Naming the two new schemas, the five new runtime modules and the generator here is
 * what turns "the build passed" into "the published artifact is usable".
 *
 * Uses `npm pack --dry-run --json`, so no tarball is ever written.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// `fileURLToPath`, never `URL.pathname`: a checkout under a path with a space or a
// non-ASCII character keeps `%20` in the pathname and hands the packer a cwd that
// does not exist (F112).
const PACKAGE_ROOT = fileURLToPath(new URL("..", import.meta.url));

/** The generated structural projections feature 28 must ship (AC7, AC9). */
const REQUIRED_PROJECTIONS = [
  "pre-execution-artifact-snapshot.schema.json",
  "pre-execution-review-receipt.schema.json",
];

/**
 * Implementation modules the published bundle must carry. `dist/index.js` re-exports
 * the whole surface, but a consumer type error can only be diagnosed when the named
 * declaration files survive the build — a silently dropped module is a broken package.
 */
const REQUIRED_DIST = [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/pre-execution.js",
  "dist/pre-execution.d.ts",
  "dist/pre-execution-contract.js",
  "dist/pre-execution-contract.d.ts",
  "dist/pre-execution-vectors.js",
  "dist/pre-execution-vectors.d.ts",
  "dist/canonical-json.js",
  "dist/sha256.js",
];

/** The gate commands a consumer or maintainer must be able to invoke (AC9). */
const REQUIRED_SCRIPTS = [
  "check:pre-execution-schemas",
  "check:pre-execution-package",
  "test:pre-execution-docs",
  "gate:pre-execution",
];

const DOC_FILES = ["README.md", "README.es.md"];

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

// 1. Both projections ship, are listed in `files`, and are reachable by specifier.
for (const projection of REQUIRED_PROJECTIONS) {
  if (!shipped.has(projection)) failures.push(`${projection} is not in the packed tarball`);
  if (!manifest.files.includes(projection)) failures.push(`${projection} is not listed in package.json "files"`);
  if (!(`./${projection}` in (manifest.exports ?? {}))) {
    failures.push(`./${projection} is not exportable through package.json "exports"`);
  }
}

// 2. Every `exports` target is shipped (or produced by the build).
for (const [specifier, target] of Object.entries(manifest.exports ?? {})) {
  const paths = typeof target === "string" ? [target] : Object.values(target ?? {});
  for (const path of paths) {
    if (typeof path !== "string" || !path.startsWith("./")) continue;
    const relative = path.slice(2);
    if (!shipped.has(relative)) failures.push(`exports["${specifier}"] -> ${relative} is not packed`);
  }
}

// 3. The compiled pre-execution surface and the human documentation ship.
for (const required of [...REQUIRED_DIST, ...DOC_FILES, "LICENSE"]) {
  if (!shipped.has(required)) failures.push(`${required} is not packed`);
}

// 4. The gate commands AC9 names exist, and each one is a real file on disk.
for (const script of REQUIRED_SCRIPTS) {
  if (!manifest.scripts?.[script]) failures.push(`scripts["${script}"] is not declared`);
}
for (const file of [
  "scripts/generate-pre-execution-schemas.mjs",
  "scripts/check-pre-execution-package.mjs",
]) {
  try {
    readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
  } catch {
    failures.push(`${file} is referenced by a script but does not exist`);
  }
  if (shipped.has(file)) failures.push(`${file} is development-only but got packed`);
}

// 5. Nothing repository-only leaks into the tarball.
for (const path of shipped) {
  if (path.startsWith("src/") || path.startsWith("test/") || path.startsWith("scripts/")) {
    failures.push(`${path} is development-only but got packed`);
  }
}

// 6. The runtime surface a consumer imports is really there, by name.
const surface = await import(new URL("../dist/index.js", import.meta.url).href);
for (const name of [
  "validatePreExecutionArtifactSnapshotV1",
  "validatePreExecutionReviewReceiptV1",
  "validatePreExecutionReceiptAgainstSnapshot",
  "buildPreExecutionArtifactSnapshot",
  "selectSpecProduct",
  "canonicalizePreExecutionArtifactSnapshot",
  "canonicalizePreExecutionReviewReceipt",
  "digestPreExecutionArtifactSnapshot",
  "digestPreExecutionReviewReceipt",
  "comparePreExecutionReceiptToSnapshot",
  "PRE_EXECUTION_SNAPSHOT_CONTRACT_ID",
  "PRE_EXECUTION_RECEIPT_CONTRACT_ID",
  "PRE_EXECUTION_LIMITS",
  "PRE_EXECUTION_FRESHNESS_CODES",
  "PRE_EXECUTION_CANONICAL_VECTORS",
  "PRE_EXECUTION_RUNTIME_RULES",
]) {
  if (!(name in surface)) failures.push(`${name} is not exported from dist/index.js`);
}

// 7. The shipped JSON Schema files parse and name their own contract, so a consumer
//    that loads them by specifier is not handed a stale or mismatched document.
for (const projection of REQUIRED_PROJECTIONS) {
  try {
    const schema = JSON.parse(readFileSync(new URL(`../${projection}`, import.meta.url), "utf8"));
    const contract = schema.properties?.contract?.const;
    const expected = projection === REQUIRED_PROJECTIONS[0]
      ? surface.PRE_EXECUTION_SNAPSHOT_CONTRACT_ID
      : surface.PRE_EXECUTION_RECEIPT_CONTRACT_ID;
    if (contract !== expected) {
      failures.push(`${projection} declares ${String(contract)}, the runtime declares ${expected}`);
    }
  } catch (error) {
    failures.push(`${projection} is not parseable JSON: ${error.message}`);
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
console.log(`PASS · ${manifest.name}@${manifest.version} ships both pre-execution projections,`);
console.log("       the compiled surface, the documentation pair, and every exports target");
