#!/usr/bin/env node

/**
 * spec-by-reference.test.mjs — the migration corpus (issue #308).
 *
 * Two corpora, both committed and both read here:
 *
 *   scripts/fixtures/spec-by-reference/258-harden-needs-input-contracts/
 *       a real unit's documents, converted to the re-cut shape beside the
 *       verbatim `REQUEST.md` they were converted from (the AC5 corpus and the
 *       AC7 owner-review input) — its `SPEC.md` is the signature document the
 *       linter, the router and the section contract are pinned against;
 *   scripts/fixtures/spec-by-reference/tree/
 *       a `UNIT_ROUTE_REPO` fixture tree with one legacy-shape unit (never
 *       migrated, must route and lint exactly as before) beside the migrated
 *       shapes and the migrated-grammar phase that must be refused.
 *
 * The suite is red until the migration lands: the linter reads the re-cut
 * `## Specs` / `## Log` grammar (S#-linked bullets, the closed log-kind
 * vocabulary, verbatim quotes) and the router reads both shapes. Nothing here
 * writes: the corpus is read-only and every tool run is a CLI invocation.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORPUS = path.join(repoRoot, "scripts", "fixtures", "spec-by-reference");
const CONVERTED = path.join(CORPUS, "258-harden-needs-input-contracts");
const TREE = path.join(CORPUS, "tree");
const LINTER = path.join(repoRoot, "scripts", "phase-lint.mjs");
const ROUTER = path.join(repoRoot, "scripts", "unit-route.mjs");

const read = (file) => fs.readFileSync(file, "utf8");
const convertedDoc = () => read(path.join(CONVERTED, "SPEC.md"));

/** Run the linter on one document; `{ status, stdout, stderr }`. */
const lint = (file) => {
  const result = spawnSync(process.execPath, [LINTER, file], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

/** Run the router against the fixture tree; `{ status, stdout, stderr }`. */
const route = (args) => {
  const result = spawnSync(process.execPath, [ROUTER, ...args], {
    encoding: "utf8",
    env: { ...process.env, UNIT_ROUTE_REPO: TREE },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

/** `Phase-lint:` lines of one phase, keyed by phase number. */
const phaseLines = (stdout) => {
  const out = new Map();
  for (const line of stdout.split("\n")) {
    const m = /^(P\d+) Phase-lint: .*$/.exec(line);
    if (m) out.set(Number(m[1].slice(1)), line);
  }
  return out;
};

/** Every `S#` heading a document declares in its `## Specs` section. */
const specIds = (text) => [...text.matchAll(/^\*\*(S\d+[a-z]?) —/gm)].map((m) => m[1]);

/** The `(Implements: S1, S2)` links of a document's `## Tasks` section. */
const taskLinks = (text) => {
  const start = text.indexOf("\n## Tasks");
  const end = text.indexOf("\n## ", start + 1);
  const body = text.slice(start, end === -1 ? undefined : end);
  return [...body.matchAll(/\(Implements: ([^)]+)\)/g)].map((m) => m[1].split(",").map((s) => s.trim()));
};

// ---------------------------------------------------------------------------
// 1. The corpus itself: the converted documents carry the re-cut shape
// ---------------------------------------------------------------------------

test("#308 the converted unit doc carries the re-cut sections in contract order", () => {
  const text = convertedDoc();
  const order = ["Specs", "Impact", "Tasks", "Findings", "Log"];
  let cursor = -1;
  for (const section of order) {
    const at = text.search(new RegExp(`^## ${section}$`, "m"));
    assert.notEqual(at, -1, `the converted corpus is missing ## ${section}`);
    assert.ok(at > cursor, `the converted corpus places ## ${section} out of contract order`);
    cursor = at;
  }
  for (const gone of ["## Evidence", "## Progress log"]) {
    assert.equal(text.search(new RegExp(`^${gone}$`, "m")), -1, `${gone} is folded into ## Log, never kept beside it`);
  }
});

test("#308 every S# quotes the owner verbatim, and corrections sit under their own id", () => {
  const text = convertedDoc();
  const ids = specIds(text);
  assert.ok(ids.includes("S1") && ids.includes("S5"), `the corpus declares S1…S5: ${ids.join(", ")}`);
  for (const [index, line] of text.split("\n").entries()) {
    if (!/^\*\*S\d+[a-z]? —/.test(line)) continue;
    const close = text.indexOf("\n**S", text.indexOf(line) + line.length);
    const block = text.slice(text.indexOf(line) + line.length, close === -1 ? undefined : close);
    assert.match(block, /^> /m, `S${line.match(/S\d+/)[0]} at line ${index + 1} carries no quoted requirement`);
  }
  assert.match(text, /^\*\*S1a —[^\n]*\n> «[^\n]*»/m, "the 2026-10-19 owner correction is quoted verbatim under S1a");
  const original = /^\*\*S1 —[^\n]*\n> ([^\n]*)$/m.exec(text);
  assert.ok(original, "S1 keeps the quote it was created with");
  assert.doesNotMatch(original[1], /«|», /, "a correction appends under S1a; it never rewrites S1's own quote");
});

test("#308 L1 is the original request verbatim and every later log line carries a closed kind", () => {
  const text = convertedDoc();
  const logStart = text.indexOf("\n## Log");
  assert.notEqual(logStart, -1, "the corpus doc carries a ## Log section");
  const log = text.slice(logStart);
  const kinds = [...log.matchAll(/^- \*\*([A-Z]\d+[a-z]?)\*\* —/gm)].map((m) => m[1]);
  assert.equal(kinds[0], "L1", "the first log line is the request itself");
  assert.ok(kinds.length >= 20, `the corpus log carries the unit's history: ${kinds.length} lines`);
  const allowed = /^[LEGFDP]\d+$/;
  const foreign = kinds.filter((kind) => !allowed.test(kind));
  assert.deepEqual(foreign, [], `closed log-kind vocabulary: L*(request), E*(evidence), G*(gate), F*(folded finding), D*(owner decision), P*(phase)`);
  assert.match(log, /^- \*\*L1\*\*[\s\S]*?```[\s\S]*?#258[\s\S]*?```/m, "L1 quotes the request in a fenced verbatim block");
});

test("#308 the corpus keeps the owner-review input beside the conversion", () => {
  const request = read(path.join(CONVERTED, "REQUEST.md"));
  assert.match(request, /## `## Objective`, verbatim/, "the request record names each converted section");
  const objective = /## `## Objective`, verbatim\n\n```\n([\s\S]*?)```/.exec(request)[1].trim();
  const doc = convertedDoc();
  assert.ok(doc.includes(objective.split("\n")[0].trim()), "the converted S# quotes the request's own first line");
});

// ---------------------------------------------------------------------------
// 2. The linter reads the migrated grammar (P4 makes this pass)
// ---------------------------------------------------------------------------

test("#308 the converted corpus lints PASS phase by phase", () => {
  const { status, stdout } = lint(path.join(CONVERTED, "SPEC.md"));
  assert.equal(status, 0, stdout);
  const lines = phaseLines(stdout);
  assert.equal(lines.size, 9, `the corpus declares P1…P9: ${[...lines.keys()].join(", ")}`);
  for (const [number, line] of lines) {
    assert.match(line, /PASS \(6\/6\)/, `P${number} must lint clean: ${line}`);
  }
  assert.match(stdout, /^verdict PASS$/m);
  assert.match(stdout, /^fingerprint: [0-9a-f]{64}$/m);
});

test("#308 a task linking no S# is refused, in the migrated grammar", () => {
  const { status, stdout } = lint(path.join(TREE, "docs/features/23-migrated-broken/SPEC.md"));
  assert.notEqual(status, 0);
  assert.match(stdout, /^verdict BLOCKED/m);
  assert.match(stdout, /^task-link-missing: P3 links no requirement/m, `the unlinked phase is named: ${stdout}`);
});

test("#308 a task linking a missing S# is refused", () => {
  const { stdout } = lint(path.join(TREE, "docs/features/23-migrated-broken/SPEC.md"));
  assert.match(stdout, /P2 .*S9/m, `the dangling link is named with its phase: ${stdout}`);
});

test("#308 an S# with no verbatim quote is refused", () => {
  const { stdout } = lint(path.join(TREE, "docs/features/23-migrated-broken/SPEC.md"));
  assert.match(stdout, /spec-quote-missing.*S2|S2.*spec-quote-missing/, `the unquoted spec is named: ${stdout}`);
});

test("#308 a log kind outside the closed vocabulary is refused", () => {
  const { stdout } = lint(path.join(TREE, "docs/features/23-migrated-broken/SPEC.md"));
  assert.match(stdout, /X1/, `the foreign log kind is named: ${stdout}`);
});

test("#308 the clean migrated tree lints PASS unchanged", () => {
  for (const unit of ["21-migrated-shape", "22-migrated-done"]) {
    const { status, stdout } = lint(path.join(TREE, "docs/features", unit, "SPEC.md"));
    assert.equal(status, 0, `${unit}: ${stdout}`);
    assert.match(stdout, /^verdict PASS$/m, unit);
  }
});

// ---------------------------------------------------------------------------
// 3. The router reads both shapes (P4 makes this pass)
// ---------------------------------------------------------------------------

test("#308 a migrated unit triages from the re-cut section set", () => {
  const { status, stdout, stderr } = route(["--triage", "21-migrated-shape"]);
  assert.equal(status, 0, stderr);
  assert.match(stdout, /^TRIAGE — 21-migrated-shape \(feature\)$/m);
  assert.match(stdout, /^Steps: .*implement/m);
});

test("#308 a migrated unit records done phases from ## Log and routes to the next phase", () => {
  const { status, stdout, stderr } = route(["21-migrated-shape"]);
  assert.equal(status, 0, stderr);
  assert.match(stdout, /^route: execute$/m, stdout);
  // `phase-done:` — `P1` is recorded in this unit's `## Log` and `P2` is not, so
  // the first unfinished phase is `P2` even though a legacy doc would have read
  // an empty `## Progress log` and answered `P1`.
  assert.match(stdout, /^next: \/execute-phase 21-migrated-shape P2 \(tier: /m, stdout);
});

test("#308 a migrated unit whose log records every phase refuses a bare execute route", () => {
  // The router's documented boundary, unchanged by the migration: an in-progress
  // unit with every phase recorded is neither executable nor auditable, so it
  // fails closed and names the status the operator must settle.
  const { status, stderr } = route(["22-migrated-done"]);
  assert.equal(status, 1);
  assert.match(stderr, /all phases recorded but status is 'in-progress'/);
});

test("#308 the legacy unit routes and triages exactly as before the migration", () => {
  const legacy = route(["20-legacy-shape"]);
  assert.equal(legacy.status, 0, legacy.stderr);
  assert.match(legacy.stdout, /^next: \/execute-phase 20-legacy-shape P2 \(tier: /m, legacy.stdout);
  const triage = route(["--triage", "20-legacy-shape"]);
  assert.equal(triage.status, 0, triage.stderr);
  assert.match(triage.stdout, /^Steps: .*evidence/m, "the legacy 14-section doc still triages");
});

test("#308 a migrated unit's OPEN rows are read from ## Findings, not review-findings.md", () => {
  const findings = path.join(TREE, "docs/features/21-migrated-shape/SPEC.md");
  const text = read(findings);
  assert.match(text, /^## Findings$/m, "the migrated shape declares its own findings carrier");
  assert.equal(fs.existsSync(path.join(TREE, "docs/features/21-migrated-shape/review-findings.md")), false,
    "the migrated unit keeps no side ledger: the doc is the carrier");
});

// ---------------------------------------------------------------------------
// 4. The section contract learns both shapes (P2 makes this pass)
// ---------------------------------------------------------------------------

test("#308 the converted corpus is a unit doc both shapes accept", () => {
  const text = convertedDoc();
  // `section-set:` — the re-cut set is the shared tail plus its two replaced
  // sections, and the two replaced sections are the ones it may not keep.
  const reCut = ["Specs", "Impact", "Non-goals", "Future cost", "Applicable tests",
    "Known pre-existing issues", "Tasks", "Findings", "Log", "Next", "References"];
  for (const section of reCut) {
    assert.match(text, new RegExp(`^## ${section}$`, "m"), `the re-cut shape carries ## ${section}`);
  }
  const ids = specIds(text);
  assert.ok(ids.length >= 5, `the requirement ids are part of the shape: ${ids.join(", ")}`);
  const links = taskLinks(text);
  assert.equal(links.length, 9, `every phase links its requirement: ${links.length} links for P1…P9`);
  assert.deepEqual(
    links.flat().filter((id) => !ids.includes(id)),
    [],
    "every task link resolves to a declared S#",
  );
  // `link-coverage:` — a correction id (`S1a`) narrows or widens a requirement
  // already implemented by a phase; a base id with no phase is a requirement
  // nobody works on.
  const base = ids.filter((id) => !/[a-z]$/.test(id));
  assert.deepEqual(
    base.filter((id) => !links.flat().includes(id)),
    [],
    "every base requirement is implemented by some phase — an unlinked S# is a requirement nobody works on",
  );
  assert.ok(
    ids.filter((id) => /[a-z]$/.test(id)).every((id) => base.includes(id.replace(/[a-z]$/, ""))),
    "a correction id always extends a base requirement it names",
  );
});

test("#308 the code's log-kind list is the published block, never a copy that drifts", () => {
  // `scripts/unit-doc-phases.mjs` reads the closed vocabulary from `LOG_KINDS`;
  // `scripts/normative-drift.test.mjs` pins the template block to its own literal
  // list. Nothing compared the two, so a kind added on one side and not the other
  // — the second-copy class #305 gates everywhere else — passed both suites
  // (#308 review, F22).
  return import("./unit-doc-phases.mjs").then(({ LOG_KINDS }) => {
    for (const template of [
      "docs/features/_TEMPLATE/SPEC.md",
      "docs/fix/_TEMPLATE/SPEC.md",
    ]) {
      const block = /```text\nlog-kind@1\n([^\n]+)\n([\s\S]*?)```/.exec(read(path.join(repoRoot, template)));
      assert.ok(block, `${template} publishes no log-kind@1 block`);
      const kinds = block[2]
        .trim()
        .split("\n")
        .map((row) => row.split("|")[0].trim())
        .filter(Boolean);
      assert.deepEqual(
        [...LOG_KINDS],
        kinds,
        `${template}: the closed log-kind vocabulary must equal the reader's LOG_KINDS (${kinds.join(", ")})`,
      );
    }
  });
});
