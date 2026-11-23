// test-obligation: protects=packages/agentic-workflow/src/runner/sensors/scaffold-contract.mjs obligations=distribution-contract,contract,failure-path,boundary

/**
 * scaffold-contract.test.mjs — issue #701: the scaffold contract that travels.
 *
 * The failure the issue describes is not a bug in one file, it is a gap in the
 * distribution: `scripts/scaffold-parity.test.mjs` compares the export with its
 * repo twin, but it runs *in the vendor repo over the export* and never travels,
 * so nothing re-checks the templates a consumer keeps after drift, upgrade, or a
 * local edit (PE-005). A consumer's fresh relay then writes a unit doc the audit
 * layer rejects for shape, and the defect is found weeks later by a review.
 *
 * Two operations close it, one engine:
 *
 *   `check`      — the traveled comparator: the consumer's exported unit-doc
 *                  templates against the installed release's own section
 *                  contract.
 *   `authoring`  — the write-time check: a staged unit doc against the same
 *                  contract, through the same selector the audit reads, so an
 *                  author learns of the defect at emission.
 *
 * The section contract is READ from the schema package's owner
 * (`UNIT_DOC_SECTION_SHAPES` / `resolveUnitDocShape` / `selectSpecProduct`),
 * never copied here: a second literal list would be the drift class this unit
 * repairs (PE-007). Every case below is a reproducer — the export defect, the
 * authoring defect, the acceptance-hash drift, the export prose the issue asks
 * to ship, and the read-only invariant. Nothing is padded in.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PKG = path.resolve(HERE, "..");
const REPO = path.resolve(PKG, "..", "..");
const BIN = path.join(PKG, "bin", "agentic-workflow.mjs");

const engine = await import("../src/runner/sensors/scaffold-contract.mjs").catch(() => ({}));

/** A scratch tree that never outlives its test. */
function scratch(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "scaffold-contract-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, body);
  }
  return root;
}

/** Every byte under a tree, keyed by relative path — the read-only comparison. */
function digestTree(root) {
  const out = {};
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out[path.relative(root, full)] = createHash("sha256").update(fs.readFileSync(full)).digest("hex");
    }
  };
  walk(root);
  return out;
}

/** A unit doc satisfying the `spec-by-reference` shape, cut from the repo template. */
function referenceUnitDoc() {
  return fs.readFileSync(path.join(REPO, "docs", "fix", "690-telemetry-attr", "SPEC.md"), "utf8");
}

const hasEngine = () => typeof engine.check === "function" && typeof engine.authoring === "function";

// ── check: the comparator travels ────────────────────────────────────────────

test("#701 check reports a drifted template against the installed contract", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({
    "docs/fix/_TEMPLATE/SPEC.md": referenceUnitDoc().replace(/^## Non-goals$/m, "### Non-goals"),
  });
  const result = engine.check({ workspace: root });
  assert.equal(result.ok, false, "a demoted section is a mismatch, never a pass");
  const reasons = result.rows.map((row) => row.detail).join("\n");
  assert.match(reasons, /Non-goals/u, "the mismatch names the section that drifted");
  assert.equal(result.rows.length, 1, "one row per disagreeing surface");
});

test("#701 check passes a template that carries the contract", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/fix/_TEMPLATE/SPEC.md": referenceUnitDoc() });
  const result = engine.check({ workspace: root });
  assert.equal(result.ok, true, "the shipped shape is clean");
  assert.deepEqual(result.rows, [], "a clean surface reports no row");
});

test("#701 check reports an absent template as absent, never as a pass it did not measure", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/ROADMAP.md": "# Roadmap\n" });
  const result = engine.check({ workspace: root });
  const states = result.surfaces.map((surface) => surface.state).join(",");
  assert.match(states, /absent/u, "a workspace with no template is reported absent");
  assert.match(result.verdict, /ABSENT|absent/u, "and the verdict says so instead of SCAFFOLD OK");
});

test("#701 check reads the section list from the schema owner, never a second copy", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const source = fs.readFileSync(path.join(PKG, "src", "runner", "sensors", "scaffold-contract.mjs"), "utf8");
  assert.match(source, /UNIT_DOC_SECTION_SHAPES|resolveUnitDocShape|unitDocSectionsFor/u, "the owner is imported");
  for (const section of ["Objective", "Why", "User outcome"]) {
    assert.ok(!source.includes(`"${section}"`), `the module carries no second copy of "${section}"`);
  }
});

test("#701 check is a refusal, not a silent pass, on a workspace that does not exist", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  assert.throws(() => engine.check({ workspace: path.join(os.tmpdir(), "does-not-exist-701") }), /workspace/u);
});

// ── authoring: the write-time check ──────────────────────────────────────────

test("#701 authoring reports each shape defect through the selector's own vocabulary", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/fix/900-probe/SPEC.md": referenceUnitDoc() });

  const clean = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-probe/SPEC.md" });
  assert.equal(clean.ok, true, "the shipped shape is accepted at emission");

  const missing = referenceUnitDoc().replace(/^## Non-goals$[\s\S]*?(?=^## )/m, "");
  fs.writeFileSync(path.join(root, "docs/fix/900-probe/SPEC.md"), missing);
  const missingResult = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-probe/SPEC.md" });
  assert.equal(missingResult.ok, false, "a missing section is reported");
  assert.match(missingResult.rows.map((r) => r.code).join(","), /heading-missing/u);

  fs.writeFileSync(path.join(root, "docs/fix/900-probe/SPEC.md"), referenceUnitDoc().replace(/^## Non-goals$/m, "### Non-goals"));
  const levelResult = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-probe/SPEC.md" });
  assert.equal(levelResult.ok, false, "a wrong heading level is reported");
});

test("#701 authoring leaves a document from another accepted shape alone", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const legacy = [
    "# fix/900-legacy",
    "## Objective", "x", "## Why", "x", "## User outcome", "x", "## Acceptance criteria", "x",
    "## Impact", "x", "## Non-goals", "x", "## Future cost", "x", "## Applicable tests", "x",
    "## Known pre-existing issues", "x", "## Tasks", "x", "## Evidence", "x", "## Progress log", "x",
    "## Next", "x", "## References", "x", "",
  ].join("\n");
  const root = scratch({ "docs/fix/900-legacy/SPEC.md": legacy });
  const result = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-legacy/SPEC.md" });
  assert.equal(result.ok, true, "the legacy shape is accepted, never refused for not being the re-cut");
});

test("#701 authoring accepts the separate-ledger shape a large unit writes", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/fix/900-probe/SPEC.md": referenceUnitDoc() });
  fs.writeFileSync(path.join(root, "docs/fix/900-probe/planning-obligations.md"), "| obligation-id |\n|---|\n");
  const result = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-probe/SPEC.md" });
  assert.equal(result.ok, true, "a sibling ledger is a tolerated extra, not a shape defect");
});

// Justification (docs/fix/701-init-workspace-scaffold-v2/decisions.md): AC3 names
// a duplicate and an out-of-order section as reported defects, and O3's evidence
// claims both cases in this run — without them those two selector codes would go
// unguarded here. Nothing existing is edited, relaxed or removed.
test("#701 authoring reports a duplicate section and an out-of-order section", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/fix/902-shape/SPEC.md": referenceUnitDoc() });

  const base = referenceUnitDoc();
  fs.writeFileSync(path.join(root, "docs/fix/902-shape/SPEC.md"), `${base}\n## Non-goals\n\na second one\n`);
  const duplicate = engine.authoring({ workspace: root, unitDoc: "docs/fix/902-shape/SPEC.md" });
  assert.equal(duplicate.ok, false, "a duplicated section is reported");
  assert.match(duplicate.rows.map((row) => row.code).join(","), /heading-duplicate/u);

  // Impact before Specs: every section present, only the contract order broken.
  const impact = base.match(/^## Impact$[\s\S]*?(?=^## Non-goals$)/mu)[0];
  const outOfOrder = base.replace(impact, "").replace(/^## Specs$/mu, `${impact.trimEnd()}\n\n## Specs`);
  fs.writeFileSync(path.join(root, "docs/fix/902-shape/SPEC.md"), outOfOrder);
  const order = engine.authoring({ workspace: root, unitDoc: "docs/fix/902-shape/SPEC.md" });
  assert.equal(order.ok, false, "an out-of-order section is reported");
  assert.match(order.rows.map((row) => row.code).join(","), /heading-order/u);
});

test("#701 authoring refuses a unit doc path that is not there", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/ROADMAP.md": "# Roadmap\n" });
  assert.throws(() => engine.authoring({ workspace: root, unitDoc: "docs/fix/900-none/SPEC.md" }), /SPEC\.md|unit doc/u);
});

// ── authoring: the ac-hash promise the template makes ────────────────────────

test("#701 a declared ac-hash whose section is absent is reported", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  // A conforming `spec-by-reference` document that carries no acceptance section:
  // exactly the shape the templates ship, so the promise has nothing to bind.
  const noAcceptance = fs.readFileSync(path.join(REPO, "docs", "features", "91-distributable-ceremony-runner", "SPEC.md"), "utf8");
  const doc = `---\ntype: feature\nac-hash: ${"a".repeat(64)}\n---\n\n${noAcceptance}`;
  const root = scratch({ "docs/fix/900-probe/SPEC.md": doc });
  const result = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-probe/SPEC.md" });
  assert.equal(result.ok, false, "the template promises a section the hash cannot find");
  assert.match(result.rows.map((r) => r.code).join(","), /acceptance-missing/u);
});

test("#701 a declared ac-hash that does not re-derive is reported", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const base = referenceUnitDoc().replace(/^## Acceptance criteria$[\s\S]*?(?=^## )/m, "");
  const withSection = `${base}\n## Acceptance criteria\n\n- AC1 — x\n`;
  // The hash binds the section body exactly as the parser reads it: the heading
  // excluded, the next `## ` heading excluded (`unit-doc-phases.mjs` §sectionText).
  const good = createHash("sha256").update("\n- AC1 — x\n").digest("hex");
  const root = scratch({ "docs/fix/901-hash/SPEC.md": `---\nac-hash: ${good}\n---\n\n${withSection}` });
  const matched = engine.authoring({ workspace: root, unitDoc: "docs/fix/901-hash/SPEC.md" });
  assert.equal(matched.acceptance.state, "match", "the recorded hash re-derives");

  fs.writeFileSync(path.join(root, "docs/fix/901-hash/SPEC.md"), `---\nac-hash: ${"b".repeat(64)}\n---\n\n${withSection}`);
  const stale = engine.authoring({ workspace: root, unitDoc: "docs/fix/901-hash/SPEC.md" });
  assert.equal(stale.ok, false, "a stale hash is a defect, not a warning");
  assert.match(stale.rows.map((r) => r.code).join(","), /acceptance-hash/u);
});

test("#701 a document declaring no ac-hash is not judged on one", () => {
  assert.ok(hasEngine(), "the engine exports both operations");
  const root = scratch({ "docs/fix/900-probe/SPEC.md": referenceUnitDoc() });
  const result = engine.authoring({ workspace: root, unitDoc: "docs/fix/900-probe/SPEC.md" });
  assert.equal(result.acceptance.state, "absent", "no promise, no judgement");
  assert.equal(result.ok, true);
});

// ── the export carries the three texts the issue asks to ship ────────────────

test("#701 the exported guide carries the worktree namespace law and its measured consequence", () => {
  const guide = fs.readFileSync(path.join(REPO, "template", "AGENTS.md"), "utf8");
  assert.match(guide, /\.git\/worktrees\//u, "the forbidden namespace is named");
  assert.match(guide, /worktree prune/u, "the actor that destroys it is named");
  assert.match(guide, /ADMIN_NAMESPACE/u, "the finding that names the illegal layout is named");
  assert.match(guide, /IR8|inviolable/u, "the law is stated as a law, not a suggestion");
});

test("#701 the exported bypass rule enumerates what the gate does not cover", () => {
  const guide = fs.readFileSync(path.join(REPO, "template", "AGENTS.md"), "utf8");
  assert.match(guide, /no-verify/u, "the bypass spelling is named");
  assert.match(guide, /hook/i, "the hook is named as the thing that may run more than the gate");
  assert.match(guide, /named at bypass time|name it at bypass/u, "the naming duty is stated, not implied");
});

test("#701 the exported guide states the gate integrity floor", () => {
  const guide = fs.readFileSync(path.join(REPO, "template", "AGENTS.md"), "utf8");
  assert.match(guide, /truncat/u, "truncation masking is named");
  assert.match(guide, /parity with CI|same runtime|declared equal/u, "runtime/env parity with CI is declared, not assumed");
});

// ── read-only, through the shipped bin ───────────────────────────────────────

test("#701 both operations write nothing, measured through the bin", () => {
  const root = scratch({ "docs/fix/_TEMPLATE/SPEC.md": referenceUnitDoc() });
  const before = digestTree(root);
  for (const args of [["check", "--workspace", root], ["authoring", path.join(root, "docs/fix/_TEMPLATE/SPEC.md"), "--workspace", root]]) {
    execFileSync(process.execPath, [BIN, "scaffold-contract", ...args], { encoding: "utf8", stdio: "pipe" });
  }
  assert.deepEqual(digestTree(root), before, "no byte of the workspace moved");
});

test("#701 the command is dispatched by the bin, not a closed-world refusal", () => {
  const root = scratch({ "docs/fix/_TEMPLATE/SPEC.md": referenceUnitDoc() });
  const stdout = execFileSync(process.execPath, [BIN, "scaffold-contract", "check", "--workspace", root], { encoding: "utf8" });
  assert.match(stdout, /SCAFFOLD (OK|MISMATCH|ABSENT)/u, "the fixed vocabulary reaches stdout");
  // AC1's own quoted observable, pinned where it is proved: the per-surface row
  // and the closing verdict the command actually prints.
  assert.match(stdout, /^SURFACE docs\/fix\/_TEMPLATE\/SPEC\.md — MATCH$/mu, "AC1's per-surface row reaches stdout");
  assert.match(stdout, /^verdict SCAFFOLD OK$/mu, "AC1's closing verdict reaches stdout");
});
