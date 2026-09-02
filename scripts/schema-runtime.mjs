#!/usr/bin/env node

/**
 * One guard + loader for the **built** schema runtime, used by root-level tests
 * that assert machine semantics (currently `pre-execution-sensor.test.mjs` and
 * `pre-execution-attribution.test.mjs`).
 *
 * `packages/agentic-workflow-schema/dist/` is a build output and is gitignored
 * (`packages/agentic-workflow-schema/.gitignore`), while `main` in that package
 * points at `./dist/index.js`. A root test that imports it therefore has an
 * unstated precondition: on a fresh clone the module does not exist and
 * `node --test scripts/*.test.mjs` fails with `ERR_MODULE_NOT_FOUND` naming a
 * path — which reads like a broken test file, not like a missing build step.
 *
 * This names the precondition. It deliberately does NOT fall back to an installed
 * `@gtrabanco/agentic-workflow-schema`: a published build can be older than the
 * source under review, and a contract test that silently checks last release's
 * semantics is a false green. `scripts/pre-execution-snapshot.mjs` keeps its own
 * fallback because it must also run inside consumer repositories.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distEntry = path.join(repoRoot, "packages", "agentic-workflow-schema", "dist", "index.js");

/** Absolute specifier of the runtime a root test loads. */
export const schemaRuntimePath = distEntry;

// Checked at module scope, not inside `loadSchemaRuntime()`: a test file imports
// this module *before* the fixture and CLI modules that also need `dist/`, and
// ESM evaluates dependencies in declaration order — so this is the message a
// reader sees, rather than `ERR_MODULE_NOT_FOUND` from a fixture three hops away.
if (!fs.existsSync(distEntry)) {
  throw new Error(
    "schema runtime is not built: "
      + `${path.relative(repoRoot, distEntry)} is missing (dist/ is a gitignored `
      + "build output). Build it first: (cd packages/agentic-workflow-schema && "
      + "`npm run build`) — or run that package's `npm test`, which builds before "
      + "it tests.",
  );
}

/**
 * Import the built schema package.
 * @returns {Promise<typeof import("../packages/agentic-workflow-schema/dist/index.js")>}
 */
export async function loadSchemaRuntime() {
  return import(distEntry);
}
