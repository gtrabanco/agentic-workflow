#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/runner/flow.mjs obligations=contract,failure-path,determinism

/**
 * Issue #669 — the deterministic lane driver: `flow <unit>`.
 *
 * The driver is the sense → decide → hand-off half of `/flow` and `/draft`: it
 * reads machine state only (the unit doc, the router's triage answer and the
 * router's route), decides the one next step from the closed catalog, applies
 * the post-plan stop rule, composes the session mode and prints the receipt the
 * model executes. It never invents: an unknown unit, an unknown step name and an
 * unknown `--stop-after` value each refuse by name, print no `next:` line and
 * exit non-zero.
 *
 * Fixtures are throwaway trees under `os.tmpdir()`: `UNIT_ROUTE_REPO` re-points
 * the router (and therefore the driver) at them, exactly as the router's own
 * suite does. Every tree carries a roadmap row so the route is answered from a
 * real index, and the unit docs carry the re-cut `spec-by-reference` shape the
 * triage reader accepts.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const BIN = path.join(REPO_ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");
const LIFECYCLE = path.join(REPO_ROOT, "docs", "workflow", "LIFECYCLE.md");
const CATALOG = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "packages", "agentic-workflow", "src", "runner", "catalog.json"), "utf8"),
);

/**
 * The environment one driver run reads: the router re-pointed at `root`, and the
 * pi-web session marker cleared so a host that runs this suite inside PI WEB
 * cannot turn the session composition into `relay` by accident.
 */
const envFor = (root) => {
  const env = { ...process.env, UNIT_ROUTE_REPO: root };
  delete env.PI_WEB_SESSION;
  return env;
};

const run = (args, root) => spawnSync(process.execPath, [BIN, "flow", ...args], { cwd: REPO_ROOT, encoding: "utf8", env: envFor(root) });

/** One field of the printed block: the first line whose prefix is `<name>: `. */
const field = (stdout, name) => {
  const match = new RegExp(`^${name}: (.*)$`, "mu").exec(stdout);
  return match === null ? null : match[1];
};

/** The read-set block's entries. */
const readSet = (stdout) => {
  const block = /^read-set \((\d+)\):\n([\s\S]*?)\nfingerprint: /mu.exec(stdout);
  if (block === null) return null;
  return block[2]
    .split("\n")
    .filter((line) => line.startsWith("  "))
    .map((line) => line.trim());
};

const APPROVAL_FIELDS = ["unit", "plan", "tiers", "unlocks", "tier", "session", "continue"];

/** The approval block's fields, or `null` when no block was printed. */
const approval = (stdout) => {
  const at = stdout.indexOf("APPROVAL — ");
  if (at === -1) return null;
  const body = stdout.slice(at).split("\n");
  const fields = {};
  for (const line of body.slice(1)) {
    const match = /^([a-z-]+): (.*)$/u.exec(line);
    if (match !== null) fields[match[1]] = match[2];
  }
  return fields;
};

// ---------------------------------------------------------------------------
// Fixtures — a throwaway repository the driver can sense
// ---------------------------------------------------------------------------

const SECTIONS = (title, { tasks, tier, tests }) => `---
type: feature
scope: medium
---

# ${title}

## Specs

**S1 — the fixture requirement.**
> the fixture requirement

## Acceptance criteria

1. The fixture answers.

## Impact

none

## Non-goals

none

## Risk tier

- **Tier** — \`${tier ?? "standard"}\` · **Task Size** — \`Contained\`
- **Named high-risk item** — \`none\`

## Future cost

none

## Applicable tests

${tests ?? "Fixture cases run under this suite."}

## Known pre-existing issues

none

## Tasks

${tasks ?? "No plan yet — this unit has not been drafted."}

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-12-23, the fixture request.

## Next

${tasks ?? "the lane's design and plan"}

## References

none
`;

const PLANNED_TASKS = `- P1 — first phase (validator: \`true\` exits 0)
  (Implements: S1)
- P2 — second phase (validator: \`true\` exits 0)
  (Implements: S1)`;

/** A throwaway tree: a roadmap row, a feature unit, optionally planned. */
function fixture({ slug = "901-flow-fixture", number = "901", planned = true, tier = "standard", tests } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "flow-driver-"));
  fs.mkdirSync(path.join(root, "docs", "features", slug), { recursive: true });
  fs.mkdirSync(path.join(root, "docs", "fix"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs", "ROADMAP.md"),
    [
      "# Roadmap",
      "",
      "## Features",
      "",
      "| NN | Slug | Status | Depends on | Summary |",
      "|----|------|--------|------------|---------|",
      `| ${number} | ${slug} | planned | — | fixture |`,
      "",
      "## Fixes",
      "",
      "| Issue | Topic | Status | Notes |",
      "|-------|-------|--------|-------|",
      "",
    ].join("\n"),
  );
  fs.writeFileSync(
    path.join(root, "docs", "features", slug, "SPEC.md"),
    SECTIONS(`${number} — ${slug}`, { tasks: planned ? PLANNED_TASKS : null, tier, tests }),
  );
  return root;
}

const cleanup = (root) => fs.rmSync(root, { recursive: true, force: true });

/** A recursive digest of every file under `root` — the read-only case's witness. */
function digest(root) {
  const entries = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      if (fs.statSync(abs).isDirectory()) walk(abs);
      else entries.push(`${path.relative(root, abs)}:${fs.readFileSync(abs, "utf8").length}`);
    }
  };
  walk(root);
  return entries.join("\n");
}

// ---------------------------------------------------------------------------
// AC2 — the step list is the closed catalog's
// ---------------------------------------------------------------------------

test("the block names the closed catalog's steps and the first pending step", () => {
  const root = fixture({ planned: false });
  try {
    const result = run(["901-flow-fixture"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(field(result.stdout, "unit"), "901-flow-fixture");
    assert.equal(field(result.stdout, "unit-type"), "feature");
    assert.equal(field(result.stdout, "planned"), "no");
    const steps = field(result.stdout, "steps").split(", ");
    const triage = spawnSync(process.execPath, [BIN, "unit-route", "--triage", "901-flow-fixture", "--json"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: envFor(root),
    });
    assert.equal(triage.status, 0, triage.stderr);
    assert.deepEqual(steps, JSON.parse(triage.stdout).steps, "the driver's steps are the router's own triage answer");
    assert.equal(field(result.stdout, "next-step"), "research", "the first pending catalog step is handed over");
    assert.ok(field(result.stdout, "next").startsWith("/unit-lane "), "the lane conductor runs the planning steps");
    assert.deepEqual(readSet(result.stdout), ["docs/features/901-flow-fixture/SPEC.md"], "the read set is the unit's own state");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// AC3 — a planned unit implements directly; --retriage is the only way back
// ---------------------------------------------------------------------------

test("a planned unit implements directly and never re-plans", () => {
  const root = fixture({ planned: true });
  try {
    const result = run(["901-flow-fixture"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(field(result.stdout, "planned"), "yes");
    assert.equal(field(result.stdout, "next-step"), "implement");
    assert.match(field(result.stdout, "next"), /^\/execute-phase 901-flow-fixture P1 /u, "the router's per-phase hand-off is the answer");
    assert.equal(field(result.stdout, "retriage"), "no");
  } finally {
    cleanup(root);
  }
});

test("--retriage is the only path back to planning", () => {
  const root = fixture({ planned: true });
  try {
    const result = run(["901-flow-fixture", "--retriage"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(field(result.stdout, "retriage"), "yes");
    assert.equal(field(result.stdout, "next-step"), "research", "re-planning is an explicit act, and it is named in the receipt");
    assert.match(field(result.stdout, "next"), /^\/unit-lane /u);
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// AC4/AC5 — the stop rule is a seam; --yes is the recorded override
// ---------------------------------------------------------------------------

test("tier high stops after the plan with the approval block", () => {
  const root = fixture({ planned: true, tier: "high" });
  try {
    const result = run(["901-flow-fixture"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(field(result.stdout, "tier"), "high");
    assert.equal(field(result.stdout, "stop"), "after-plan (rule: tier-high)");
    assert.equal(field(result.stdout, "next-step"), "halt");
    assert.equal(field(result.stdout, "next"), "/flow 901-flow-fixture");
    assert.notEqual(approval(result.stdout), null, "the stop prints the approval block");
    assert.equal(fs.existsSync(path.join(root, "docs", "features", "901-flow-fixture", "decisions.md")), false, "a rule stop writes nothing");
  } finally {
    cleanup(root);
  }
});

test("tier standard does not stop after the plan", () => {
  const root = fixture({ planned: true, tier: "standard" });
  try {
    const result = run(["901-flow-fixture"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(field(result.stdout, "stop"), "none");
    assert.equal(approval(result.stdout), null);
  } finally {
    cleanup(root);
  }
});

test("--yes cancels the tier rule and records a human-owner D row", () => {
  const root = fixture({ planned: true, tier: "high" });
  try {
    const result = run(["901-flow-fixture", "--yes"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(field(result.stdout, "stop"), "none", "--yes is the owner's override");
    assert.equal(field(result.stdout, "next-step"), "implement");
    assert.equal(approval(result.stdout), null);
    const ledger = path.join(root, "docs", "features", "901-flow-fixture", "decisions.md");
    assert.ok(fs.existsSync(ledger), "the override is auditable: the unit's decisions ledger exists");
    const text = fs.readFileSync(ledger, "utf8");
    assert.match(text, /^\| D1 \| \*\*`--yes` override\*\*/mu, "the row is a human-owner D row");
    assert.match(text, /tier-high/u, "the row names the rule it overrode");
    assert.match(text, /2026-\d\d-\d\d|20\d\d-\d\d-\d\d/u, "the row carries its date");
    assert.match(text, /human-owner/u, "the row names the authority that typed it");
  } finally {
    cleanup(root);
  }
});

test("--stop-after plan always stops, --yes included", () => {
  const root = fixture({ planned: true, tier: "standard" });
  try {
    for (const extra of [[], ["--yes"]]) {
      const result = run(["901-flow-fixture", "--stop-after", "plan", ...extra], root);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(field(result.stdout, "stop"), "after-plan (rule: explicit)", `explicit stop after plan, args ${extra.join(" ") || "(none)"}`);
      assert.equal(field(result.stdout, "next-step"), "halt");
      assert.notEqual(approval(result.stdout), null);
    }
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// AC6 — the approval block and the session composition
// ---------------------------------------------------------------------------

test("the approval block carries unit, plan, unlocks, tier, session and next", () => {
  const root = fixture({ planned: true, tier: "high" });
  try {
    const result = run(["901-flow-fixture"], root);
    const block = approval(result.stdout);
    assert.deepEqual(Object.keys(block).sort(), [...APPROVAL_FIELDS].sort(), "the block is exactly its declared fields");
    assert.equal(block.unit, "901-flow-fixture");
    assert.match(block.plan, /^2 phases — P1, P2$/u, "the plan summary is the phase list");
    assert.match(block.tiers, /^implement: cheap, /u, "the tier line is the catalog's own");
    assert.match(block.unlocks, /^implement, /u, "the unlocked steps are the catalog's steps after plan");
    assert.equal(block.tier, "high");
    assert.equal(block.session, "phase-per-turn", "a high-tier unit runs one phase per turn");
    assert.equal(block.continue, "/flow 901-flow-fixture", "continuing is /flow and nothing else");
  } finally {
    cleanup(root);
  }
});

test("session composition is derived from the recorded tier and size", () => {
  const cases = [
    { scope: "small", tier: "standard", expected: "single-session" },
    { scope: "medium", tier: "standard", expected: "phase-per-turn" },
    { scope: "large", tier: "standard", expected: "orchestrate" },
    { scope: "medium", tier: "high", expected: "phase-per-turn" },
  ];
  for (const entry of cases) {
    const root = fixture({ planned: true, tier: entry.tier });
    try {
      const spec = path.join(root, "docs", "features", "901-flow-fixture", "SPEC.md");
      fs.writeFileSync(spec, fs.readFileSync(spec, "utf8").replace(/^scope: medium$/mu, `scope: ${entry.scope}`));
      const result = run(["901-flow-fixture"], root);
      assert.equal(result.status, 0, result.stderr);
      assert.equal(field(result.stdout, "session"), entry.expected, `scope ${entry.scope} + tier ${entry.tier}`);
    } finally {
      cleanup(root);
    }
  }
});

test("--record writes the composition into the unit doc", () => {
  const root = fixture({ planned: true, tier: "high" });
  try {
    const spec = path.join(root, "docs", "features", "901-flow-fixture", "SPEC.md");
    const before = fs.readFileSync(spec, "utf8");
    const result = run(["901-flow-fixture", "--record"], root);
    assert.equal(result.status, 0, result.stderr);
    const after = fs.readFileSync(spec, "utf8");
    assert.notEqual(after, before, "--record writes");
    assert.match(after, /^- \*\*D\d+\*\* — \d{4}-\d\d-\d\d, session composition: phase-per-turn — /mu, "one D line names the mode and its authority");
    assert.ok(after.startsWith(before.split("## Log")[0]), "every byte before ## Log is untouched");
  } finally {
    cleanup(root);
  }
});

test("a read-only run leaves the tree byte-identical", () => {
  const root = fixture({ planned: true, tier: "high" });
  try {
    const before = digest(root);
    const result = run(["901-flow-fixture"], root);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(digest(root), before, "the driver reads; only --record and --yes write");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// AC8 — the driver never invents
// ---------------------------------------------------------------------------

test("an unknown --stop-after value is refused by name", () => {
  const root = fixture();
  try {
    const result = run(["901-flow-fixture", "--stop-after", "invented"], root);
    assert.equal(result.status, 2, "a refusal is exit 2");
    assert.match(result.stderr, /^FLOW REFUSAL — unknown step 'invented'/mu);
    assert.doesNotMatch(result.stdout, /^next: /mu, "a refusal prints no hand-off");
  } finally {
    cleanup(root);
  }
});

test("an unknown unit is refused and prints no next line", () => {
  const root = fixture();
  try {
    const result = run(["999-nope"], root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /^FLOW REFUSAL — /mu);
    assert.doesNotMatch(result.stdout, /^next: /mu);
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// The declared tables — one row per catalog step, and the grammars exist
// ---------------------------------------------------------------------------

test("the declared step-command table maps every catalog step, and the driver's grammars are declared", () => {
  const text = fs.readFileSync(LIFECYCLE, "utf8");
  const block = /```text\nflow-step-references@1\n([\s\S]*?)```/u.exec(text);
  assert.notEqual(block, null, "docs/workflow/LIFECYCLE.md declares flow-step-references@1");
  const rows = block[1]
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(1)
    .map((line) => line.split("|")[0].trim());
  assert.deepEqual(rows.sort(), [...CATALOG.steps].sort(), "every catalog step has exactly one declared command row");
  for (const marker of ["flow-approval@1", "flow-stop-rules@1", "flow-session-modes@1"]) {
    assert.ok(text.includes(marker), `docs/workflow/LIFECYCLE.md declares ${marker}`);
  }
});
