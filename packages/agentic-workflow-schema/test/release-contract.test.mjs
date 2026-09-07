// release-contract.test.mjs — F4 / AC7 / AC8
//
// Deterministic release evidence for feature unit 23 (P4 — Harden release
// evidence). This suite replaces the brittle reviewer checks that failed F4:
//   - a `grep -c "capabilities"` word count is NOT an inventory validator
//     (the word also appears in the `capabilities` field on the public type,
//     so the count is 14 in src/index.ts, never the 12 built-in profiles);
//   - the AC7 semantics must be proven in BOTH package languages
//     (English authoritative/advisory, Spanish autoritativa/orientativo);
//   - the AC8 pack manifest must require every artifact INDEPENDENTLY,
//     not with an alternation that succeeds when one artifact is present.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PKG_DIR = fileURLToPath(new URL("..", import.meta.url));
const readPkg = (rel) => readFileSync(join(PKG_DIR, rel), "utf8");

test("AC8 read-verified: package version is 4.1.0", () => {
  const pkg = JSON.parse(readPkg("package.json"));
  assert.equal(pkg.version, "4.1.0");
});

// AC7 — language-aware capability semantics. Each language is asserted with
// its own wording for the same two claims: repository evidence is
// authoritative, semantic/episodic context is advisory.
test("AC7: English reference states authoritative repository evidence and advisory context", () => {
  const en = readPkg("README.md");
  assert.match(en, /\*\*Repository evidence is authoritative\.\*\*/);
  assert.match(en, /document the reviewed maximum capabilities from/);
  assert.match(en, /never promise anything about a\s+model or provider runtime/);
  assert.match(en, /\*\*Context is advisory\.\*\*/);
  assert.match(en, /semantic-context.*episodic-memory[\s\S]*never change what a skill may do/);
});

test("AC7 Spanish reference states the equivalent autoritativa/orientativo semantics", () => {
  const es = readPkg("README.es.md");
  assert.match(es, /\*\*La evidencia del repositorio es autoritativa\.\*\*/);
  assert.match(es, /documentan las capacidades m[áa]ximas revisadas de los\s+documentos del propio workflow/);
  assert.match(es, /nunca prometen nada sobre un modelo\s+o un runtime de proveedor/);
  assert.match(es, /\*\*El contexto es orientativo\.\*\*/);
  assert.match(es, /semantic-context[\s\S]*episodic-memory[\s\S]*nunca cambian lo que una skill puede\s+hacer/);
});

// AC8 — commands — `npm pack --dry-run --json` manifest requires the four
// public artifacts individually, via the exact package entry point. The
// manifest here comes from the live pack run, not a hard-coded list.
test("AC8: npm pack manifest independently contains all four required public artifacts", () => {
  const stdout = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: PKG_DIR,
    encoding: "utf8",
  });
  const parsed = JSON.parse(stdout);
  const record = Array.isArray(parsed) ? parsed[0] : Object.values(parsed)[0];
  assert.ok(record && Array.isArray(record.files), "pack manifest exposes a files list");
  const paths = new Set(record.files.map((entry) => entry.path));

  const required = ["dist/index.js", "dist/index.d.ts", "README.md", "README.es.md", "verification-plan.schema.json", "verification-receipt.schema.json"];
  for (const artifact of required) {
    assert.ok(paths.has(artifact), `required packed artifact missing: ${artifact}`);
  }
});

// --- AC2 / F4: the exact-table test, not a word count, is the sole inventory
// validator, and it fails on a missing, duplicate, or mismatched built-in.

const CAPABILITIES_SOURCE = new URL("./capabilities.test.mjs", import.meta.url);
const countAssertion = /assert[^\n]*\b12\b[^\n]*(?:skills|profiles|size|inventory)/i;

// Environment for spawned probe processes: strip runner-inherited markers so
// the child `node --test` executes the file instead of skipping it.
function cleanEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

// Spawn the runner on a probe file. `node --test <file>` and `bun test <file>`
// both start a runner; `bun --test <file>` does NOT — bun only starts a runner
// through the `test` subcommand, so passing `--test` as a flag under bun
// executes the file as a plain script and every `test()` call throws
// "Cannot use test outside of the test runner". The probe inherits whatever
// runner the suite is running under.
const testRunArgs = (file) => (process.versions?.bun ? ["test", file] : ["--test", file]);

// Run the committed exact-table test file with a data-only mutation applied
// and report its exit status. The mutation never touches test logic: it only
// edits EXPECTED fixture data, so a nonzero exit proves the guard itself.
function runProbe(mutate) {
  const dir = mkdtempSync(join(tmpdir(), "ac2-exact-table-probe-"));
  try {
    const source = readFileSync(CAPABILITIES_SOURCE, "utf8").replace(
      '"../dist/index.js"',
      JSON.stringify(pathToFileURL(join(PKG_DIR, "dist", "index.js")).href)
    );
    const probePath = join(dir, "capabilities.test.mjs");
    writeFileSync(probePath, mutate(source));
    const result = spawnSync(process.execPath, testRunArgs(probePath), {
      encoding: "utf8",
      // The parent test-runner marks spawned files with NODE_TEST_CONTEXT;
      // the probe would inherit it and refuse to run (exit 0, no tests).
      env: cleanEnv(),
    });
    return result.status;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("AC2 & F4: the frozen table drives the inventory and the exact-table test is its sole validator", () => {
  const source = readPkg("test/capabilities.test.mjs");

  // 1. The frozen AC2 table holds exactly 13 entries (11 built-ins plus the
  //    feature-28 `review-spec`/`review-plan` reviewers), and the test binds
  //    the exported inventory to the table's length — not to any word count.
  const expectedStart = source.indexOf("const EXPECTED");
  const expectedBlock = source.slice(expectedStart, source.indexOf("];", expectedStart));
  const tableEntries = [...expectedBlock.matchAll(/^\s+skill: "[a-z0-9-]+",\s*$/gm)];
  assert.equal(tableEntries.length, 13, "frozen AC2 table must drive the inventory size");
  assert.match(
    source,
    /assert\.equal\(WORKFLOW_SKILL_PROFILES\.length,\s*EXPECTED\.length,\s*"exact inventory size"\)/,
    "exported inventory size must be bound to the frozen table"
  );
  // 2. Single literal 14 inventory constant — the duplicate guard — lives in
  //    this file and is the only inventory-count assertion in the suite.
  assert.match(source, /assert\.equal\(new Set\(skills\)\.size,\s*13,\s*"no duplicate skills"\)/);
  for (const file of readdirSync(join(PKG_DIR, "test"))) {
    if (!file.endsWith(".test.mjs") || file === "capabilities.test.mjs" || file === "release-contract.test.mjs") continue;
    assert.equal(
      countAssertion.test(readFileSync(join(PKG_DIR, "test", file), "utf8")),
      false,
      `${file} must not hard-code the 14-profile inventory`
    );
  }
  // 3. F4 root cause: a raw `capabilities` word count is NOT a valid proxy —
  //    the word also names the public `capabilities` field, so counting gives
  //    19 in the source today, never the 14 built-in profiles.
  const wordCount = (readPkg("src/index.ts").match(/\bcapabilities\b/g) || []).length;
  assert.notEqual(wordCount, 14, "word counts never equal the profile inventory");
});

test("AC2 & F4: the exact-table test fails on a missing, duplicate, or mismatched built-in", () => {
  const source = readFileSync(CAPABILITIES_SOURCE, "utf8");

  const baseline = runProbe((s) => s);
  assert.equal(baseline, 0, "unmutated exact-table test must pass");

  const probes = [
    ["missing built-in", (s) => s.replace('skill: "init-workspace",', 'skill: "phantom-missing-skill",')],
    ["duplicate built-in", (s) => s.replace('skill: "workflow-status",', 'skill: "init-workspace",')],
    ["mismatched capability", (s) => s.replace('role: "executor",', 'role: "auditor",')],
  ];
  for (const [name, mutate] of probes) {
    const status = runProbe(mutate);
    assert.notEqual(status, 0, `exact-table test must FAIL on ${name}`);
  }
});