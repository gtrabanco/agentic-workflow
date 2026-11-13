#!/usr/bin/env node
/**
 * residual-classify.test.mjs — the red-first sibling suite of
 * `scripts/residual-classify.mjs` (issue #438).
 *
 * One case per requested rule of the issue's expected behaviour:
 *
 *   the four states are decided by the plan, never by a zero match alone
 *   (`C1`–`C6`, `H2`); the receipt names every surface it consulted, in the
 *   order the issue fixes, and an unreadable surface refuses instead of
 *   guessing (`R1`–`R3`); a claim needs a *recorded* named consumer, so prose
 *   never produces one and an unresolvable consumer refuses (`P1`–`P3`); a
 *   strictly additive unit answers `## Retirements` with the computed
 *   inventory, and all four templates teach that answer (`I1`, `I2`, `T1`,
 *   `T2`); a retire leaves the receipt plus the dated decision and is legal
 *   only in `orphan` (`X1`–`X3`).
 *
 * Every fixture is a throwaway tree under `tempRoot` (issue #476's tracked
 * helper), so no case reads or writes this repository's live tree.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { tempRoot } from "./temp-root.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "residual-classify.mjs");

/** Write one throwaway tree; `tempRoot` removes it even when a case fails. */
function tree(files) {
  const root = tempRoot("residual-classify-");
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, body);
  }
  return root;
}

const GUIDE = (plannedWork = "") => `# Project\n\nA guide.\n${plannedWork}`;

const CHARTER = `\n## Project charter\n\n**Identity layer.** kind: library.\n\n### Planned work\n\n| Surface | Consumer | Date |\n|---|---|---|\n| \`charterSurface\` | unit:docs/features/11-planned-unit | 2026-11-11 |\n`;

const ROADMAP = [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Depends on | Summary |",
  "|----|------|--------|------------|---------|",
  "| 41 | `planned-unit` | planned | — | names `andamioSurface` |",
  "| 42 | `done-unit` | done · [#1](https://example.invalid/1) | — | names `doneSurface` |",
  "| 43 | `fixy-unit` | in-progress | — | unrelated |",
  "",
  "## Fixes",
  "",
  "| Issue | Topic | Status | Notes |",
  "|---|---|---|---|",
  "| [#7](https://example.invalid/7) | fixy-unit | in-progress | names `fixRowSurface` |",
  "",
].join("\n");

const UNIT = ({ slug, tasks, extra = "" }) =>
  `# fix/${slug}\n\n## Tasks\n\n${tasks}\n${extra}`;

const SRC = {
  // The definition is a declaration, never a consumer (D2).
  "src/lib.mjs": "export function orphanSurface() { return 1; }\nexport function andamioSurface() { return 2; }\n",
  "src/used.mjs": "export function usedSurface() { return 1; }\n",
  "src/user.mjs": 'import { usedSurface } from "./used.mjs";\n\nexport const use = () => usedSurface();\n',
};

const base = (files = {}) =>
  tree({
    "AGENTS.md": GUIDE(),
    "docs/ROADMAP.md": ROADMAP,
    ...SRC,
    ...files,
  });

const run = (args, cwd) => {
  const result = spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  let json = null;
  try {
    json = JSON.parse(result.stdout);
  } catch {
    // A refused run prints nothing on stdout; the case asserts on stderr.
  }
  return { code: result.status, stdout: result.stdout, stderr: result.stderr, json };
};

// ── F: the declared differential (AC-S10) ───────────────────────────────────

/**
 * The base-vs-change differential of the touched commands. With
 * `RESIDUAL_DIFF_BASE` pointing at a scratch copy of the base commit every
 * command must return the same verdict on both trees **except** the
 * classifier's own presence — the change's one declared delta. Without the
 * variable the case still pins the head side and the recorded run in the unit
 * doc's `## Log` (the env-gated shape `risk-tier-classifier.test.mjs`'s F1
 * uses, so CI pays only for the head-side assertions).
 */
test("F1 — every touched command agrees with base but for the classifier", () => {
  assert.ok(existsSync(CLI), "the classifier exists at head");
  const spec = readRepo("docs/fix/438-residual-classify/SPEC.md");
  assert.match(spec, /differential/i, "the unit doc records the differential run");

  const base = process.env.RESIDUAL_DIFF_BASE ? path.resolve(process.env.RESIDUAL_DIFF_BASE) : null;
  if (base === null) return;

  const runtime = /bun/.test(path.basename(process.execPath)) ? "bun" : "node";
  const child = { ...process.env };
  delete child.RESIDUAL_DIFF_BASE;
  const script = (rel) => (runtime === "bun" ? ["bun", rel] : ["node", rel]);
  const suite = (rel) => (runtime === "bun" ? ["bun", "test", rel] : ["node", "--test", rel]);
  const runIn = (argv, cwd) => spawnSync(argv[0], argv.slice(1), { cwd, encoding: "utf8", env: child });

  for (const rel of [
    "scripts/unit-doc-contract.test.mjs",
    "scripts/scaffold-parity.test.mjs",
    "scripts/normative-drift.test.mjs",
    "scripts/residue-dimensions.test.mjs",
  ]) {
    const onBase = runIn(suite(rel), base).status;
    const onHead = runIn(suite(rel), ROOT).status;
    assert.equal(onHead, onBase, `${rel}: the verdict is unchanged base vs head`);
    assert.equal(onHead, 0, `${rel}: green at head`);
  }
  for (const args of [
    ["scripts/check-skill-context.mjs"],
    ["scripts/docs-generate.mjs", "--check"],
    ["scripts/roadmap-settle.mjs"],
  ]) {
    const onBase = runIn(script(...args), base).status;
    const onHead = runIn(script(...args), ROOT).status;
    assert.equal(onHead, onBase, `${args.join(" ")}: the verdict is unchanged base vs head`);
    assert.equal(onHead, 0, `${args.join(" ")}: green at head`);
  }

  const atBase = runIn(suite("scripts/residual-classify.test.mjs"), base);
  assert.notEqual(atBase.status, 0, "at base the sibling suite must fail — the module is absent");
  const probe = spawnSync(process.execPath, ["-e", "import('./scripts/residual-classify.mjs')"], { cwd: base, encoding: "utf8" });
  assert.notEqual(probe.status, 0, "at base the module does not resolve");
  assert.ok(existsSync(path.join(ROOT, "scripts", "residual-classify.mjs")), "at head it does");
});

// ── C: the four states come from the plan ───────────────────────────────────

test("C1 — a live consumer in executable code classifies used and names the site", () => {
  const root = base();
  const r = run(["usedSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "used");
  assert.equal(r.json.reason, "live-consumer");
  const live = r.json.consulted.find((row) => row.surface === "live-tree");
  assert.equal(live.result, "consumer");
  assert.ok(live.evidence.includes("src/user.mjs:3"), `the consuming line is named: ${live.evidence}`);
  // The declaration line is not a consumer: the two symbols are consumed and
  // not, and the difference is on the wire.
  assert.equal(run(["orphanSurface"], root).json.state, "orphan");
});

test("C2 — a non-terminal roadmap row naming the target classifies andamio", () => {
  const root = base();
  const r = run(["andamioSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "andamio");
  assert.equal(r.json.reason, "recorded-planned-consumer");
  const row = r.json.consulted.find((sit) => sit.surface === "roadmap-rows");
  assert.equal(row.result, "claim");
  assert.equal(row.path, "docs/ROADMAP.md");
  assert.match(row.evidence[0], /^docs\/ROADMAP\.md:7$/, "the row's own line is the receipt");
});

test("C3 — a terminal roadmap row is not a plan claim: delivered-but-unconsumed is orphan", () => {
  const root = base();
  const r = run(["doneSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "orphan");
  assert.equal(r.json.reason, "no-plan-claim");
});

test("C4 — an open unit with an unmet task naming the target classifies half-built", () => {
  const root = base({
    "docs/features/11-planned-unit/SPEC.md": UNIT({
      slug: "11-planned-unit",
      tasks: "- P3 — wire `halfBuiltSurface` into the registry (validator: `true` exits 0)\n",
    }),
  });
  const r = run(["halfBuiltSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "half-built");
  assert.equal(r.json.reason, "unmet-task");
  const units = r.json.consulted.find((sit) => sit.surface === "open-unit-tasks");
  assert.equal(units.result, "unmet");
  assert.ok(units.evidence.includes("docs/features/11-planned-unit/SPEC.md:P3"), `the unmet task is named: ${units.evidence}`);
});

test("C5 — a charter planned-work row claims; an absent charter surface claims nothing", () => {
  const withCharter = base({ "AGENTS.md": GUIDE(CHARTER) });
  const claim = run(["charterSurface"], withCharter);
  assert.equal(claim.json.state, "andamio", "the charter row is a recorded planned consumer");
  const charter = claim.json.consulted.find((sit) => sit.surface === "charter-planned-work");
  assert.equal(charter.result, "claim");
  assert.equal(charter.path, "AGENTS.md");

  const bare = base();
  const absent = run(["charterSurface"], bare);
  assert.equal(absent.json.state, "orphan");
  assert.equal(
    absent.json.consulted.find((sit) => sit.surface === "charter-planned-work").result,
    "absent",
    "a guide with no charter planned-work table is a declared absent surface, never a guess",
  );
});

test("C6 — precedence is used > half-built > andamio: the stronger signal wins", () => {
  const root = base({
    "docs/features/11-planned-unit/SPEC.md": UNIT({
      slug: "11-planned-unit",
      tasks: "- P2 — wire `usedSurface` and `andamioSurface` (validator: `true` exits 0)\n",
    }),
  });
  assert.equal(run(["usedSurface"], root).json.state, "used", "a consumer outranks an unmet task");
  assert.equal(run(["andamioSurface"], root).json.state, "half-built", "an unmet task outranks a roadmap claim");
  assert.equal(run(["fixRowSurface"], root).json.state, "andamio", "a ## Fixes row claims like a feature row");
});

const CLOSED_ROADMAP = [
  "# Roadmap",
  "",
  "## Features",
  "",
  "| NN | Slug | Status | Depends on | Summary |",
  "|----|------|--------|------------|---------|",
  "| 41 | `planned-unit` | planned | — | names `andamioSurface` |",
  "| 42 | `done-unit` | done · [#1](https://example.invalid/1) | — | delivered, nothing consumes it |",
  "",
  "## Fixes",
  "",
  "| Issue | Topic | Status | Notes |",
  "|---|---|---|---|",
  "| [#7](https://example.invalid/7) | fixy-unit | done · merged | delivered |",
  "",
].join("\n");

// ── H: a unit's own roadmap row decides whether it still claims ─────────────

test("H3 — a terminal feature row closes its unit: the unit's unmet task claims nothing", () => {
  const root = tree({
    "AGENTS.md": GUIDE(),
    "docs/ROADMAP.md": CLOSED_ROADMAP,
    "src/closed.mjs": "export function closedFeatureSurface() { return 1; }\n",
    "docs/features/42-done-unit/SPEC.md": UNIT({
      slug: "42-done-unit",
      tasks: "- P2 — wire `closedFeatureSurface` into the registry (validator: `true` exits 0)\n",
    }),
  });
  const r = run(["closedFeatureSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "orphan", "D4: a terminal row means the unit no longer claims");
  const units = r.json.consulted.find((sit) => sit.surface === "open-unit-tasks");
  assert.equal(units.result, "none", `a closed unit is not consulted: ${JSON.stringify(units.evidence)}`);
});

test("H4 — the fix lane closes the same way: a terminal fix row claims nothing", () => {
  const root = tree({
    "AGENTS.md": GUIDE(),
    "docs/ROADMAP.md": CLOSED_ROADMAP,
    "src/closed.mjs": "export function closedFixSurface() { return 1; }\n",
    "docs/fix/7-fixy-unit/SPEC.md": UNIT({
      slug: "7-fixy-unit",
      tasks: "- P2 — wire `closedFixSurface` into the registry (validator: `true` exits 0)\n",
    }),
  });
  const r = run(["closedFixSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "orphan", "the fix lane's own row closes the unit too");
  const units = r.json.consulted.find((sit) => sit.surface === "open-unit-tasks");
  assert.equal(units.result, "none");
});

test("H2 — an open unit whose naming tasks are all ticked is andamio, not half-built", () => {
  const root = base({
    "docs/features/11-planned-unit/SPEC.md": UNIT({
      slug: "11-planned-unit",
      tasks: "- [x] P2 — wire `tickedSurface` (validator: `true` exits 0)\n",
    }),
  });
  const r = run(["tickedSurface"], root);
  assert.equal(r.json.state, "andamio");
  assert.equal(r.json.consulted.find((sit) => sit.surface === "open-unit-tasks").result, "met");
});

// ── R: the receipt and the fail-closed refusal ─────────────────────────────

test("R1 — every classification carries the five consult rows in the issue's order", () => {
  const r = run(["usedSurface"], base());
  assert.deepEqual(
    r.json.consulted.map((sit) => sit.surface),
    ["live-tree", "roadmap-rows", "open-unit-tasks", "forward-promises", "charter-planned-work"],
  );
  for (const sit of r.json.consulted) {
    assert.equal(typeof sit.path, "string", `${sit.surface} names the path it consulted`);
    assert.ok(sit.path.length > 0, `${sit.surface} carries a non-empty path`);
    assert.ok(Array.isArray(sit.evidence), `${sit.surface} carries evidence`);
    assert.ok(["consumer", "claim", "unmet", "met", "none", "absent"].includes(sit.result), `${sit.surface}: ${sit.result}`);
  }
  assert.equal(r.json.contract, "residual-classify@1");
});

test("R2 — an unreadable consult surface refuses as ambiguous instead of guessing", () => {
  const root = base({ "docs/ROADMAP.md": "# Roadmap\n\nNo tables here.\n" });
  const r = run(["andamioSurface"], root);
  assert.equal(r.code, 1, "an ambiguous verdict is a refusal");
  assert.equal(r.json.state, "ambiguous");
  assert.equal(r.json.reason, "unreadable-roadmap-rows");
});

test("R3 — the document is deterministic: identical trees print identical bytes", () => {
  const root = base({
    "docs/features/11-planned-unit/SPEC.md": UNIT({
      slug: "11-planned-unit",
      tasks: "- P1 — any `andamioSurface` use (validator: `true` exits 0)\n",
    }),
    "docs/features/11-planned-unit/decisions.md": "no promises here\n",
  });
  const first = run(["andamioSurface"], root).stdout;
  const second = run(["andamioSurface"], root).stdout;
  assert.equal(first, second, "the same tree yields the same document");
  assert.doesNotMatch(first, /\d{4}-\d{2}-\d{2}T\d{2}:/, "no wall clock in the document");
});

// ── P: a claim needs a recorded named consumer ──────────────────────────────

test("P1 — a recorded residual-promise row with a resolvable consumer claims", () => {
  const root = base({
    "docs/features/11-planned-unit/SPEC.md": UNIT({ slug: "11-planned-unit", tasks: "" }),
    "docs/features/12-promising-unit/decisions.md": [
      "# Decisions",
      "",
      "```text",
      "residual-promise@1",
      "surface | consumer | date | owner",
      "`promisedSurface` | unit:docs/features/11-planned-unit | 2026-11-11 | owner",
      "```",
      "",
    ].join("\n"),
  });
  const r = run(["promisedSurface"], root);
  assert.equal(r.code, 0, r.stderr);
  assert.equal(r.json.state, "andamio");
  const promised = r.json.consulted.find((sit) => sit.surface === "forward-promises");
  assert.equal(promised.result, "claim");
  assert.match(promised.evidence[0], /^docs\/features\/12-promising-unit\/decisions\.md:\d+$/);
});

test("P2 — a promise whose consumer cannot be resolved offline refuses as ambiguous", () => {
  const root = base({
    "docs/features/12-promising-unit/decisions.md": [
      "```text",
      "residual-promise@1",
      "surface | consumer | date | owner",
      "`promisedSurface` | issue:438 | 2026-11-11 | owner",
      "```",
      "",
    ].join("\n"),
  });
  const r = run(["promisedSurface"], root);
  assert.equal(r.code, 1);
  assert.equal(r.json.state, "ambiguous");
  assert.equal(r.json.reason, "unresolved-consumer");
});

test("P3 — a prose sentence naming the target produces no claim", () => {
  const root = base({
    "docs/features/12-promising-unit/decisions.md": "# Decisions\n\nD1 — we will build `proseSurface` later, when a consumer arrives.\n",
  });
  assert.equal(run(["proseSurface"], root).json.state, "orphan");
});

test("P4 — a promise consumer naming a closed unit refuses as ambiguous", () => {
  const root = base({
    "docs/features/42-done-unit/SPEC.md": UNIT({ slug: "42-done-unit", tasks: "" }),
    "docs/features/12-promising-unit/decisions.md": [
      "```text",
      "residual-promise@1",
      "surface | consumer | date | owner",
      "`promisedSurface` | unit:docs/features/42-done-unit | 2026-11-11 | owner",
      "```",
      "",
    ].join("\n"),
  });
  const r = run(["promisedSurface"], root);
  assert.equal(r.code, 1, "D3: a consumer that is not an open unit is not a claim");
  assert.equal(r.json.state, "ambiguous");
  assert.equal(r.json.reason, "unresolved-consumer");
});

// ── I: the computed, diff-derived inventory ────────────────────────────────

test("I1 — --inventory lists the added surface of the change, file and symbol", () => {
  const root = tree({ "README.md": "fixture\n" });
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "fixture");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  const baseRev = git("rev-parse", "HEAD");
  mkdirSync(path.join(root, "src"), { recursive: true });
  writeFileSync(path.join(root, "src", "added.mjs"), "export function inventedApi() { return 1; }\n");
  writeFileSync(path.join(root, "src", "consumed.mjs"), 'import { inventedApi } from "./added.mjs";\nexport const use = () => inventedApi();\n');
  writeFileSync(path.join(root, "docsaddition.md"), "not a code surface\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add");

  const r = run(["--inventory", "--base", baseRev], root);
  assert.equal(r.code, 0, r.stderr);
  const rows = new Map(r.json.rows.map((row) => [row.surface, row]));
  assert.ok(rows.has("src/added.mjs"), `the added file is a row: ${[...rows.keys()]}`);
  assert.ok(rows.has("inventedApi"), `the added export is a row: ${[...rows.keys()]}`);
  assert.equal(rows.get("src/added.mjs").kind, "file");
  assert.equal(rows.get("inventedApi").kind, "symbol");
  assert.equal(rows.get("inventedApi").state, "used", "the same change consumes it");
  assert.ok(Array.isArray(rows.get("inventedApi").evidence), "the row carries the consumer evidence sites");
  assert.ok(rows.get("inventedApi").evidence.length > 0, `a used row names its sites: ${JSON.stringify(rows.get("inventedApi").evidence)}`);
  assert.ok(!rows.has("docsaddition.md"), "a documentation file is not a code surface");
});

test("I2 — the inventory never hides an unclaimed addition", () => {
  const root = tree({ "README.md": "fixture\n" });
  const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q");
  git("config", "user.email", "fixture@example.invalid");
  git("config", "user.name", "fixture");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  const baseRev = git("rev-parse", "HEAD");
  writeFileSync(path.join(root, "speculative.mjs"), "export function speculativeApi() { return 1; }\n");
  git("add", "-A");
  git("commit", "-q", "-m", "add");

  const r = run(["--inventory", "--base", baseRev], root);
  const row = r.json.rows.find((candidate) => candidate.surface === "speculativeApi");
  assert.ok(row, "the unclaimed export is listed");
  assert.equal(row.state, "orphan", "an additive unit's unclaimed surface is visible, not hidden");
});

// ── T: the templates and the registered grammar ────────────────────────────

const TEMPLATES = [
  "docs/features/_TEMPLATE/SPEC.md",
  "docs/fix/_TEMPLATE/SPEC.md",
  "template/docs/features/_TEMPLATE/SPEC.md",
  "template/docs/fix/_TEMPLATE/SPEC.md",
];

const readRepo = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

test("T1 — all four templates teach the additive inventory and the orphan-only rule", () => {
  for (const rel of TEMPLATES) {
    const text = readRepo(rel);
    const start = text.indexOf("## Retirements");
    assert.notEqual(start, -1, `${rel} carries ## Retirements`);
    const body = text.slice(start, text.indexOf("\n## ", start + 1));
    assert.match(body, /strictly additive/, `${rel} names the strictly-additive unit`);
    assert.match(body, /scripts\/residual-classify\.mjs --inventory/, `${rel} names the inventory command`);
    assert.match(body, /orphan/, `${rel} names the only retire-legitimate state`);
    assert.match(body, /why nothing can be removed/, `${rel} keeps the empty-answer reason`);
    assert.doesNotMatch(body, /^## REMOVED/m, `${rel} adds no standing REMOVED section`);
  }
});

test("T3 — the templates teach where a planned consumer is recorded", () => {
  for (const rel of TEMPLATES) {
    const text = readRepo(rel);
    const start = text.indexOf("## Retirements");
    const body = text.slice(start, text.indexOf("\n## ", start + 1));
    assert.match(body, /residual-promise@1/, `${rel} names the promise block`);
    assert.match(body, /decisions\.md/, `${rel} names the ledger that carries it`);
  }
});

test("T2 — the design step names the classifier and the promise grammar is registered", () => {
  const design = readRepo("skills/unit-lane/references/DESIGN.md");
  assert.match(design, /residual-classify/, "the design step names the classifier as the receipt's producer");
  assert.match(design, /why nothing can be removed/, "the empty-answer reason survives");

  const guide = readRepo("AGENTS.md");
  const row = guide.split("\n").find((line) => line.startsWith("residual-promise-grammar |"));
  assert.ok(row, "normative-surfaces@1 carries the promise grammar row");
  assert.match(row, /skills\/unit-lane\/references\/DESIGN\.md/, "the row names the file the grammar lives in");
  assert.match(row, /block:residual-promise@1/, "the row names the versioned block");
  assert.match(design, /```text\nresidual-promise@1\n/, "the block is declared in the file the row names");
});

// ── X: the retire receipt and the exit contract ────────────────────────────

test("X1 — --receipt prints the recorded receipt plus the dated decision for an orphan", () => {
  const r = run(["--receipt", "orphanSurface", "--date", "2026-11-11"], base());
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /state: orphan/);
  assert.match(r.stdout, /reason: no-plan-claim/);
  assert.match(r.stdout, /live-tree/);
  assert.match(r.stdout, /2026-11-11/, "the decision row carries the supplied date");
});

test("X2 — --receipt refuses every non-orphan state", () => {
  const root = base();
  const halfBuilt = tree({
    "AGENTS.md": GUIDE(),
    "docs/ROADMAP.md": ROADMAP,
    "src/half.mjs": "export function halfBuiltSurface() { return 1; }\n",
    "docs/features/11-planned-unit/SPEC.md": UNIT({
      slug: "11-planned-unit",
      tasks: "- P3 — wire `halfBuiltSurface` into the registry (validator: `true` exits 0)\n",
    }),
  });
  const ambiguous = tree({ "AGENTS.md": GUIDE(), "docs/ROADMAP.md": "# Roadmap\n\nNo tables.\n" });
  const cases = [
    [root, "usedSurface"],
    [root, "andamioSurface"],
    [halfBuilt, "halfBuiltSurface"],
    [ambiguous, "ambiguousSurface"],
  ];
  for (const [cwd, target] of cases) {
    const r = run(["--receipt", target, "--date", "2026-11-11"], cwd);
    assert.equal(r.code, 1, `${target} is not retire-legitimate`);
    assert.equal(r.stdout, "", "a refusal prints nothing on stdout");
    assert.match(r.stderr, /retire refused/);
  }
});

test("X3 — the CLI exit contract: 0 classified, 1 ambiguous, 2 usage", () => {
  const root = base();
  assert.equal(run(["orphanSurface"], root).code, 0);
  const ambiguous = tree({ "AGENTS.md": GUIDE(), "docs/ROADMAP.md": "# Roadmap\n\nNo tables.\n" });
  assert.equal(run(["orphanSurface"], ambiguous).code, 1);
  assert.equal(run([], root).code, 2, "no target is a usage error");
  assert.equal(run(["--nope", "orphanSurface"], root).code, 2, "an unknown flag is a usage error");
});
