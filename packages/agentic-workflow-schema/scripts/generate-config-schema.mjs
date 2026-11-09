#!/usr/bin/env node
/**
 * generate-config-schema.mjs — emit the unified config JSON Schema (issue #427 M3).
 *
 * The schema is generated from the same section descriptors the runtime
 * validator uses, so `config.schema.json` cannot disagree with the loader.
 * `--check` is the drift gate: it reports and exits 1 without writing.
 */

import { readFileSync, writeFileSync } from "node:fs";

import { BASE_CONFIG_SECTIONS, composeConfigSchema } from "../dist/index.js";

const target = new URL("../config.schema.json", import.meta.url);
const text = `${JSON.stringify(composeConfigSchema(BASE_CONFIG_SECTIONS), null, 2)}\n`;

if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(target, "utf8");
  } catch {
    process.stderr.write("config.schema.json is missing; run bun run generate:config-schema\n");
    process.exit(1);
  }
  if (current !== text) {
    process.stderr.write("config.schema.json is stale; run bun run generate:config-schema\n");
    process.exit(1);
  }
  process.stdout.write("config.schema.json: current\n");
  process.exit(0);
}

writeFileSync(target, text, "utf8");
process.stdout.write("wrote config.schema.json\n");
