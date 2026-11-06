#!/usr/bin/env node

/**
 * capabilities.test.mjs — the capability analysis (issue #384, unit 360c).
 *
 * The frozen failure corpus, written BEFORE the analyser existed. Every case in
 * `F2`…`F8` is a removal the base classifier missed because it matched a list of
 * operation *names*: `scripts/risk-tiers.mjs` at `91a7f39` answers
 * `standard` / no signal for eight of the nine reproducers below (only a literal
 * `rm -rf` is caught). The change is done when every reproducer answers
 * `destructive` and no fixture in the 360 corpus changes its verdict.
 *
 *   F1  no capability analysis exists   — `import('./scripts/capabilities.mjs')`
 *                                        fails at the base commit, and the base
 *                                        classifier misses the whole corpus
 *   F2  a removal not on the name list  — `unlink` from `node:fs/promises`
 *   F3  a removal hidden by an alias    — `import { unlink as drop }`
 *   F4  a removal behind a namespace    — `import * as fsp` + `fsp.rm(p)`
 *   F5  a removal behind a destructured `require`
 *   F6  a language the table never had  — `shutil.rmtree`, `os.remove` (py)
 *   F7  a program the table never had   — `rm -rf`, `find -delete`, `git clean` (sh)
 *   F8  a removal reached through a relative import (the capability graph)
 *   F9  hygiene stays hygiene           — a guarded scratch cleanup is not a
 *                                         destructive surface
 *  F10  a capability that is not removal — reading, writing and spawning are
 *                                         reported, and none of them is destructive
 *  F11  everything unresolved fails upward — an unknown language or an
 *                                         unreadable import never lowers a tier
 *  F12  the analysis is deterministic and pure — no clock, no environment, no
 *                                         network, no filesystem read of its own
 *  F13  the catalogue is keyed by provider, not by call name
 *  F14  a spelling inside a string or a comment is not an operation
 *
 * `CAPABILITY_BASE` re-points the base half of F1 at a base-commit tree, so the
 * red side is reproducible without editing this file:
 *   rm -rf /tmp/base-384 && git worktree add /tmp/base-384 91a7f39
 *   CAPABILITY_BASE=/tmp/base-384 node --test scripts/capabilities.test.mjs
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODULE = path.join(ROOT, "scripts", "capabilities.mjs");

/** The analyser under test, loaded once; F1 owns the case where it is absent. */
const load = async () => import(pathToFileURL(MODULE).href);
const {
  analyseSource,
  destructiveOf,
  languageOf,
  CAPABILITY_CONTRACT_ID = null,
  CAPABILITY_KINDS = [],
  PROVIDERS = {},
  CAPABILITY_MEMBERS = {},
} = await load().catch(() => ({}));

/**
 * The tier the classifier derives for a change. `scripts/risk-tiers.mjs` is the
 * one consumer of the analysis inside the verdict, and the frozen 360 suite is
 * the one that pins its shape, so the integration cases live here — beside the
 * fixtures they are about — and never edit that frozen corpus.
 */
const { classifyTier = () => null } = await import(
  pathToFileURL(path.join(ROOT, "scripts", "risk-tiers.mjs")).href,
).catch(() => ({}));

const analyze = (file, text, options) => analyseSource(file, text, options);

/**
 * The frozen reproducers: `file → contents`, and the capability the analysis
 * must reach. `provider` and `member` are asserted where the corpus's point is
 * *which* capability was resolved; everything else only needs `destructive`
 * to be non-null.
 */
const CORPUS = [
  {
    id: "unlink from node:fs/promises (the list carried unlinkSync only)",
    files: { "scripts/maintenance.mjs": 'import { unlink } from "node:fs/promises";\nawait unlink(target);\n' },
    provider: "node:fs/promises",
    member: "unlink",
  },
  {
    id: "an aliased removal (import { unlink as drop })",
    files: { "scripts/maintenance.mjs": 'import { unlink as drop } from "node:fs/promises";\ndrop(target);\n' },
    provider: "node:fs/promises",
    member: "unlink",
  },
  {
    id: "a namespaced removal (import * as fsp; fsp.rm)",
    files: { "scripts/maintenance.mjs": 'import * as fsp from "node:fs/promises";\nfsp.rm(target);\n' },
    provider: "node:fs/promises",
    member: "rm",
  },
  {
    id: "a destructured require (const { rm } = require(node:fs))",
    files: { "scripts/maintenance.mjs": 'const { rm } = require("node:fs");\nrm(target);\n' },
    provider: "node:fs",
    member: "rm",
  },
  {
    id: "shutil.rmtree (a language the name list never covered)",
    files: { "scripts/clean.py": "import shutil\n\nshutil.rmtree(build)\n" },
    provider: "shutil",
    member: "rmtree",
  },
  {
    id: "os.remove (python)",
    files: { "scripts/clean.py": "import os\n\nos.remove(target)\n" },
    provider: "os",
    member: "remove",
  },
  {
    id: "rm -rf (a shell program)",
    files: { "scripts/clean.sh": "#!/bin/sh\nrm -rf build\n" },
    provider: "rm",
  },
  {
    id: "find -delete (a shell program the table never had)",
    files: { "scripts/clean.sh": "#!/bin/sh\nfind . -name '*.tmp' -delete\n" },
    provider: "find",
  },
  {
    id: "git clean -fdx (a shell program)",
    files: { "scripts/clean.sh": "#!/bin/sh\ngit clean -fdx\n" },
    provider: "git",
  },
];

/** A throwaway tree the transitive case resolves through (never in the worktree). */
function tree(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capabilities-"));
  for (const [rel, text] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  }
  return dir;
}

const resolverFor = (dir) => (rel) => {
  try {
    return fs.readFileSync(path.join(dir, rel), "utf8");
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// F1 — the frozen failure: no capability analysis at the base commit
// ---------------------------------------------------------------------------

test("F1 the analyser exists and loads (base commit: absent; the base classifier misses the corpus)", async () => {
  assert.equal(typeof analyseSource, "function", "analyseSource is exported");
  assert.equal(typeof destructiveOf, "function", "destructiveOf is exported");
  assert.equal(CAPABILITY_CONTRACT_ID, "capability-analysis@1", "the contract id is published by the module");

  const base = process.env.CAPABILITY_BASE ? path.resolve(process.env.CAPABILITY_BASE) : null;
  if (base === null) return;

  const probe = spawnSync(process.execPath, ["-e", "import('./scripts/capabilities.mjs').then(() => console.log('present'))"], {
    cwd: base,
    encoding: "utf8",
  });
  assert.notEqual(probe.status, 0, "at the base commit the analyser must be absent");
  assert.match(probe.stderr, /ERR_MODULE_NOT_FOUND/, "the base refusal is the issue's own reproducer");

  // The base classifier really did miss these: that is what made the corpus red.
  // Exactly one reproducer is already caught — the literal `rm -rf`, which is the
  // spelling the operation-name list did carry (and why it survived as long as it
  // did). The other eight are the miss this unit closes.
  const baseTiers = await import(pathToFileURL(path.join(base, "scripts", "risk-tiers.mjs")).href);
  const missed = CORPUS.filter(({ files }) => {
    const verdict = baseTiers.classifyTier(new Map(Object.entries(files)));
    return !verdict.signals.some((s) => s.signal === "destructive");
  });
  assert.equal(missed.length, CORPUS.length - 1,
    `every reproducer but the one spelling the old list carried is missed at the base commit (missed ${missed.length}/${CORPUS.length})`);
  assert.ok(!missed.some(({ id }) => id === "rm -rf (a shell program)"),
    "the one the base caught by name is the literal rm -rf");
});

// ---------------------------------------------------------------------------
// F2…F7 — one reproducer per removed mechanism
// ---------------------------------------------------------------------------

test("F2 a removal the operation-name list never carried is caught by its capability", () => {
  const [first] = CORPUS;
  const [file, text] = Object.entries(first.files)[0];
  const result = analyze(file, text);
  assert.equal(result.language, "js");
  assert.ok(result.destructive, "unlink from node:fs/promises is a removal");
  assert.equal(result.destructive.via, "import", "the capability arrives through the import");
});

test("F3 an alias, a namespace and a destructured require all resolve to the same capability", () => {
  for (const { id, files, provider, member } of CORPUS.slice(1, 4)) {
    const [file, text] = Object.entries(files)[0];
    const { destructive } = analyze(file, text);
    assert.ok(destructive, `${id} is destructive`);
    assert.equal(destructive.member, member, `${id} resolves the member behind the binding`);
    assert.equal(destructive.provider, provider, `${id} names the provider, not the local spelling`);
  }
});

test("F6 the python family is covered: shutil.rmtree and os.remove are removals", () => {
  for (const { files, provider, member } of CORPUS.slice(4, 6)) {
    const [file, text] = Object.entries(files)[0];
    const result = analyze(file, text);
    assert.equal(result.language, "py", "the python family is recognized");
    assert.ok(result.destructive, `${provider}.${member} is a removal`);
    assert.equal(result.destructive.member, member);
  }
  const read = analyze("scripts/read.py", "import json\n\ndata = json.load(open(p))\n");
  assert.equal(read.destructive, null, "a non-removing module is not destructive");
});

test("F7 the shell family is covered: rm -rf, find -delete and git clean", () => {
  for (const { files, provider } of CORPUS.slice(6)) {
    const [file, text] = Object.entries(files)[0];
    const result = analyze(file, text);
    assert.equal(result.language, "sh", "the shell family is recognized");
    assert.ok(result.destructive, `${provider} with its removal flags is destructive`);
  }
  const list = analyze("scripts/list.sh", "#!/bin/sh\nls -la build\n");
  assert.equal(list.destructive, null, "a listing program removes nothing");
});

// ---------------------------------------------------------------------------
// F8 — the capability graph: a relative import, resolved
// ---------------------------------------------------------------------------

test("F8 a removal reached through a relative import is caught, and the declaring module is named", () => {
  const dir = tree({
    "scripts/purge.mjs": 'import { rmSync } from "node:fs";\n\nexport function purgeAll(dir) {\n  rmSync(dir, { recursive: true });\n}\n\nexport function describe() {\n  return "no effect";\n}\n',
  });
  try {
    const importer = 'import { purgeAll } from "./purge.mjs";\n\npurgeAll(buildDir);\n';
    const result = analyze("scripts/maintenance.mjs", importer, { resolve: resolverFor(dir) });
    assert.ok(result.destructive, "the importer reaches a removal through the declaration it calls");
    assert.equal(result.destructive.via, "import");
    assert.equal(result.destructive.member, "purgeAll", "the called binding is named");
    assert.match(result.destructive.declaredIn, /purge\.mjs$/, "the declaring module is named as evidence");

    const harmless = analyze("scripts/maintenance.mjs", 'import { describe } from "./purge.mjs";\n\ndescribe();\n', {
      resolve: resolverFor(dir),
    });
    assert.equal(harmless.destructive, null, "a non-removing declaration stays harmless");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// F9 / F10 — hygiene stays hygiene, and a non-removal capability is reported
// ---------------------------------------------------------------------------

test("F9 a guarded scratch cleanup is hygiene, not a destructive surface", () => {
  const guarded = [
    'import { rmSync } from "node:fs";\nrmSync(scratch, { recursive: true, force: true });\n',
    'import { rmSync } from "node:fs";\nrmSync(scratch, { force: true, recursive: true });\n',
  ];
  for (const text of guarded) {
    assert.equal(destructiveOf("scripts/cleanup.mjs", text), null, "a both-flags cleanup raises nothing");
  }
  const unguarded = 'import { rmSync } from "node:fs";\nrmSync(buildDir);\n';
  assert.ok(destructiveOf("scripts/maintenance.mjs", unguarded), "an unguarded removal is destructive");
  const recursiveOnly = 'import { rmdirSync } from "node:fs";\nrmdirSync(cache, { recursive: true });\n';
  assert.ok(destructiveOf("scripts/maintenance.mjs", recursiveOnly), "force alone or recursive alone is not the guard");
});

test("F10 reading, writing and spawning are capabilities that are not removal", () => {
  const read = analyze("scripts/report.mjs", 'import { readFile } from "node:fs/promises";\nawait readFile(target, "utf8");\n');
  assert.ok(read.capabilities.includes("filesystem-read"), "reading is reported as a capability");
  assert.equal(read.destructive, null);

  const write = analyze("scripts/report.mjs", 'import { writeFile } from "node:fs/promises";\nawait writeFile(target, "x");\n');
  assert.ok(write.capabilities.includes("filesystem-write"), "writing is reported as a capability");
  assert.equal(write.destructive, null, "writing is not a removal");

  const spawn = analyze("scripts/report.mjs", 'import { execFileSync } from "node:child_process";\nexecFileSync("ls", ["-la"]);\n');
  assert.ok(spawn.capabilities.includes("process-spawn"), "spawning is reported as a capability");
  assert.equal(spawn.destructive, null);
  for (const kind of read.capabilities) assert.ok(CAPABILITY_KINDS.includes(kind), `${kind} is a published capability kind`);
});

// ---------------------------------------------------------------------------
// F11 — fail closed upward
// ---------------------------------------------------------------------------

test("F11 an unresolvable construct never lowers a tier: unknown language, unreadable import", () => {
  const unknown = analyze("scripts/mystery.xyz", "do something opaque\n");
  assert.equal(unknown.language, null, "an unknown extension has no family");
  assert.equal(unknown.destructive, null, "and no removal is claimed");
  assert.equal(unknown.effects.length, 0, "nothing is invented about it");

  const unresolved = analyze("scripts/maintenance.mjs", 'import { purgeAll } from "./missing.mjs";\npurgeAll(dir);\n');
  assert.equal(unresolved.destructive, null, "an unreadable target raises nothing");
  assert.deepEqual(unresolved.unresolved, ["./missing.mjs"], "and the unresolved import is reported, never hidden");

  assert.equal(languageOf("a.mjs"), "js");
  assert.equal(languageOf("a.mts"), "js");
  assert.equal(languageOf("a.tsx"), "js");
  assert.equal(languageOf("a.py"), "py");
  assert.equal(languageOf("a.zsh"), "sh");
  assert.equal(languageOf("a.md"), null);
});

// ---------------------------------------------------------------------------
// F12 — determinism and purity
// ---------------------------------------------------------------------------

test("F12 the analysis is deterministic, and reads no clock, environment, network or filesystem", () => {
  const source = fs.readFileSync(MODULE, "utf8");
  assert.doesNotMatch(source, /Date\.now|new Date\(|process\.env|fetch\(|readFileSync|fs\./,
    "the analyser takes its own input: no clock, environment, network or filesystem read");
  const [file, text] = Object.entries(CORPUS[0].files)[0];
  const a = JSON.stringify(analyze(file, text));
  const b = JSON.stringify(analyze(file, text));
  assert.equal(a, b, "same input → same output");
});

// ---------------------------------------------------------------------------
// F13 / F14 — the mechanism's shape, and what is not an operation
// ---------------------------------------------------------------------------

test("F13 the catalogue is keyed by provider; the classifier carries no operation-name list", () => {
  assert.ok(Object.keys(PROVIDERS).includes("node:fs/promises"), "a provider grants the capability");
  assert.ok(Object.keys(PROVIDERS).includes("shutil"), "and so does a python module");
  assert.ok(Object.keys(CAPABILITY_MEMBERS).includes("filesystem-remove"),
    "the effect names live under the capability they implement — one home, not a regex per call site");
  const classifier = fs.readFileSync(path.join(ROOT, "scripts", "risk-tiers.mjs"), "utf8");
  assert.doesNotMatch(classifier, /rmSync\|rmdirSync|unlinkSync/,
    "the operation-name spellings leave the classifier once the catalogue owns them");
});

test("F14 a spelling inside a string or a comment is not an operation", () => {
  const inString = 'const message = "rmSync(target) removes a directory";\n';
  assert.equal(destructiveOf("scripts/explain.mjs", inString), null, "a string is text, not an effect");
  const inComment = '// rmSync(target) would remove it\nconst x = 1;\n';
  assert.equal(destructiveOf("scripts/explain.mjs", inComment), null, "a comment is text, not an effect");
  const executed = 'const message = "removing";\nrmSync(target);\n';
  assert.ok(destructiveOf("scripts/explain.mjs", executed), "a real call beside the string is still caught");
});

// ---------------------------------------------------------------------------
// F15 / F16 — the tier reads the capability (the classifier's integration half)
// ---------------------------------------------------------------------------

test("F15 the tier rises through the capability, never through the spelling", () => {
  const listed = classifyTier(new Map(Object.entries(CORPUS[0].files)));
  assert.equal(listed.tier, "high", "a removal the old list never carried is still high");
  assert.deepEqual(listed.signals.map((s) => s.signal), ["destructive"], "and it carries the named signal");
  assert.match(listed.reason, /unlink/, "the reason names the capability that raised it");

  const hygienic = classifyTier(new Map([[
    "scripts/cleanup.mjs",
    'import { rmSync } from "node:fs";\nrmSync(scratch, { recursive: true, force: true });\n',
  ]]));
  assert.deepEqual(hygienic.signals, [], "a guarded scratch cleanup raises nothing");
  assert.equal(hygienic.tier, "standard", "and the change stays at the standard ceremony");
});

test("F16 the classifier follows a relative import only through the resolver it is given", () => {
  const dir = tree({
    "scripts/purge.mjs": 'import { rmSync } from "node:fs";\n\nexport function purgeAll(dir) {\n  rmSync(dir, { recursive: true });\n}\n',
  });
  const files = new Map([[
    "scripts/maintenance.mjs",
    'import { purgeAll } from "./purge.mjs";\n\npurgeAll(buildDir);\n',
  ]]);
  try {
    const withResolver = classifyTier(files, { resolve: resolverFor(dir) });
    assert.equal(withResolver.tier, "high", "the resolver reaches the declaring module");
    assert.deepEqual(withResolver.signals.map((s) => s.signal), ["destructive"]);

    // The documented bound (D1, `## Future`): a caller that supplies no resolver
    // analyses the change set's own files only — it never guesses a capability.
    const bare = classifyTier(files);
    assert.equal(bare.tier, "standard", "without a resolver the verdict stays at the standard ceremony");
    assert.deepEqual(bare.signals, [], "and no signal is invented");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
