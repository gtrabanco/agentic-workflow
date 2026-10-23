// serena-activation.test.mjs — AC1 (feature 67, issue #219, decision D1)
//
// The pi path must deliver Serena's language-server tools by default. pi
// installs a package's `dependencies` but activates only the package's own
// `pi.extensions` entries (pi docs/packages.md §Declare dependencies), so a
// dependency alone ships a no-op. Two declarations therefore have to hold
// together, and each is pinned here so neither can be dropped silently:
//
//   1. the exact pin that makes the dependency install at all, and
//   2. the manifest entry that loads it as an extension.
//
// The behavioural half — that a packed tarball really registers `serena_*`
// tools under a scratch pi install — is `scripts/serena-activation-check.mjs`
// (P2), because it needs a real install and must not run on every unit test.
//
// Written red-first: both cases fail before the declaration exists.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PKG_DIR = resolve(new URL(".", import.meta.url).pathname, "..");
const manifest = JSON.parse(readFileSync(join(PKG_DIR, "package.json"), "utf8"));

const SERENA = "@bacnh85/pi-serena";
/** The extension entry pi loads from the installed dependency. */
const SERENA_EXTENSION = "./node_modules/@bacnh85/pi-serena/extensions/index.ts";

test("AC1: @bacnh85/pi-serena is an exact pin in dependencies", () => {
  const spec = manifest.dependencies?.[SERENA];
  assert.ok(spec, `${SERENA} is not a dependency — installing this package would not install Serena's tools`);
  assert.match(
    spec,
    /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u,
    `the pin must be an exact registry version (got "${spec}"): a range makes the shipped toolset drift between installs`,
  );
});

test("AC1: the manifest loads the dependency's extension entry", () => {
  const entries = manifest.pi?.extensions ?? [];
  assert.ok(
    entries.includes(SERENA_EXTENSION),
    `pi.extensions must declare ${SERENA_EXTENSION} — a dependency is installed but never activated, ` +
      `so the serena_* tools would not exist (declared: ${JSON.stringify(entries)})`,
  );
});

test("AC1: the shipped entry points still load this package's own extension", () => {
  const entries = manifest.pi?.extensions ?? [];
  assert.ok(
    entries.includes("./dist/extension/index.js"),
    "adding the dependency entry must not displace the package's own compiled extension",
  );
  assert.equal(entries.length, 2, "the manifest declares exactly the two extension entries (own + Serena)");
});
