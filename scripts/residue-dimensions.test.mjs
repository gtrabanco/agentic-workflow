#!/usr/bin/env node

/**
 * #340 — deletion & reuse as obligations: pins every new normative surface.
 *
 *   1. product-audit's dimension table declares the residue sweeps (duplicate
 *      content including skill/docs prose, unused code, obsolete + missing
 *      docs) with pass-only-if checklists, composing audit-docs (S1, S2, S4)
 *   2. the classifier routes unused code two ways, never conflated (S3)
 *   3. review-code carries deletion candidates, features-preserved, and the
 *      removal-feature cascade (S4, S8, S9)
 *   4. the plan reference carries reuse-first and replace-implies-delete as
 *      pass-only-if checklist items (S5, S6)
 *   5. the design reference carries third-party-before-homemade (S7)
 *   6. the no-assumption rule has exactly one normative owner
 *      (`ask-dont-infer@1` in the design reference), declared in AGENTS.md's
 *      normative-surfaces@1, referenced by every stage skill, restated
 *      nowhere (S10) — plus the seeded residue fixture generator (issue AC1)
 *
 * `RESIDUE_DIMENSIONS_REPO` re-points the reader at a throwaway tree (the
 * `NORMATIVE_DRIFT_REPO` pattern) so the suite is validated red-first against
 * the live tree and green against a fixture copy before the prose lands.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.RESIDUE_DIMENSIONS_REPO ? path.resolve(process.env.RESIDUE_DIMENSIONS_REPO) : repoRoot;
const isChildRun = Boolean(process.env.RESIDUE_DIMENSIONS_REPO);
const thisFile = fileURLToPath(import.meta.url);
const generatorFile = path.join(repoRoot, "scripts", "product-audit-residue-fixture.mjs");

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const safeRead = (rel) => {
  try {
    return fs.readFileSync(path.join(root, rel), "utf8");
  } catch {
    return null;
  }
};

const dimensions = read("skills/product-audit/references/AUDIT_DIMENSIONS.md");
const auditProcess = read("skills/product-audit/references/AUDIT_PROCESS.md");
const classify = read("skills/review-implementation/references/CLASSIFY.md");
const reviewCode = read("skills/review-code/SKILL.md");
const plan = read("skills/unit-lane/references/PLAN.md");
const design = read("skills/unit-lane/references/DESIGN.md");

// ── 1. The residue dimension sweeps (S1, S2, S4) ────────────────────────────

test("dimension table declares the duplicate-content sweep, prose included (S1)", () => {
  assert.match(dimensions, /\*\*Residue — duplication\*\*/);
  assert.match(dimensions, /skill\/docs prose/);
  assert.match(dimensions, /pass only if/);
  // The checks today diff-scoped in review-code are re-swept product-wide.
  assert.match(dimensions, /review-code/);
  assert.match(dimensions, /dead code|dead-code/);
});

test("dimension table declares obsolete + missing docs, scoped to consumer-facing, composing audit-docs (S2)", () => {
  assert.match(dimensions, /\*\*Residue — documentation\*\*/);
  assert.match(dimensions, /no longer exist/);
  assert.match(dimensions, /consumer-facing/);
  // Composes audit-docs; never restates its axes.
  assert.match(dimensions, /audit-docs/);
  assert.match(auditProcess, /Residue sweeps/);
});

test("the residue sweeps section carries pass-only-if checklists and features-preserved (S4)", () => {
  assert.match(dimensions, /## Residue sweeps \(pass-only-if\)/);
  assert.match(dimensions, /features-preserved-without-it/i);
  assert.match(dimensions, /product-audit-residue-fixture\.mjs/);
});

// ── 2. Two-way unused-code classification, pinned in the classifier (S3) ────

test("classifier routes delivered-feature-without-consumer to a bug finding (S3)", () => {
  assert.match(classify, /no functionality invokes/);
  assert.match(classify, /bug finding/i);
  assert.match(classify, /not\s+implemented\s+completely/i);
  // Deletion is not the fix for this class.
  assert.match(classify, /deletion is not the fix/i);
});

test("classifier routes orphaned-by-replacement/removal to fix-now (delete) (S3)", () => {
  assert.match(classify, /orphaned/i);
  assert.match(classify, /fix-now \(delete\)/);
  assert.match(classify, /never conflated/i);
});

test("classifier keeps the severity table and decision table intact (regression pin)", () => {
  assert.match(classify, /### Severity conversion \(canonical table\)/);
  assert.match(classify, /### Decision table/);
  assert.match(classify, /### Step 1 — `ignore` first/);
});

// ── 3. review-code: deletion candidates, features-preserved, cascade (S4, S8, S9) ──

test("review-code carries unused-code deletion candidates routed through the classifier (S8)", () => {
  assert.match(reviewCode, /deletion candidates?/i);
  assert.match(reviewCode, /CLASSIFY\.md/);
});

test("review-code carries the features-preserved-without-it check (S4)", () => {
  assert.match(reviewCode, /[Ff]eatures-preserved-without-it/);
  assert.match(reviewCode, /"code" includes (skill )?prose|code or skill prose|includes prose/i);
});

test("review-code carries the removal-feature cascade with one sweep declaration per deleted truth (S9)", () => {
  assert.match(reviewCode, /[Rr]emoval-feature cascade|[Rr]emoval cascade/);
  assert.match(reviewCode, /sibling\s+mention/);
  assert.match(reviewCode, /sweep declaration/);
  // Unclear extent is researched, understood and contrasted — never guessed.
  assert.match(reviewCode, /does not guess/i);
});

test("review-code keeps the S8 deletion mandate and sweep declaration items (regression pin)", () => {
  assert.match(reviewCode, /Is deleting the surface the complete fix\? \(S8\)/);
  assert.match(reviewCode, /Sweep declaration present/);
});

// ── 4. Plan reference: reuse-first + replace-implies-delete (S5, S6) ────────

test("plan reference carries reuse-first as a pass-only-if checklist item (S5)", () => {
  assert.match(plan, /## Checklist \(pass only if\)/);
  assert.match(plan, /[Rr]euse-first/);
  assert.match(plan, /why reuse is not possible/);
  assert.match(plan, /does not pass/);
});

test("plan reference carries replace-implies-delete as a pass-only-if checklist item (S6)", () => {
  assert.match(plan, /[Rr]eplace-implies-delete/);
  assert.match(plan, /supersedes|superseded/i);
  assert.match(plan, /deletion .* its own planned task|deletion task/);
  // The obligation exists when the case exists — never a ritual.
  assert.match(plan, /when the case exists|not a ritual/);
});

test("plan reference keeps the retirement machinery intact (regression pin)", () => {
  assert.match(plan, /negative-capability pin/);
  assert.match(plan, /none — the design states why nothing can be removed/);
});

// ── 5. Design reference: third-party before homemade (S7) ───────────────────

test("design reference prefers community-supported libraries and requires recorded justification (S7)", () => {
  assert.match(design, /[Tt]hird-party before homemade/);
  assert.match(design, /widely\s+community-supported librar/i);
  assert.match(design, /recorded justification/i);
});

test("design reference cites the owner-supplied precedent pi-extensible-workflows (S7)", () => {
  assert.match(design, /pi-extensible-workflows/);
});

// ── 6. The single normative no-assumption owner (S10) ───────────────────────

const OWNER_REL = "skills/unit-lane/references/DESIGN.md";
const OWNER_MARKER = "ask-dont-infer@1";
/** Stage skills that must reference the owner (never restate it). */
const STAGE_REFS = [
  "skills/unit-lane/SKILL.md",
  "skills/unit-lane/references/PLAN.md",
  "skills/review-change/SKILL.md",
  "skills/review-code/SKILL.md",
  "skills/product-audit/SKILL.md",
  "skills/execute-phase/SKILL.md",
  "skills/triage-issue/SKILL.md",
  "skills/fold-findings/SKILL.md",
];
/** Paragraphs of ≤ this many lines count as the reference's context window. */
const REFERENCE_WINDOW = 4;

function ownerVersionedBlock(text) {
  const fence = /```[a-zA-Z]*\n([\s\S]*?)```/g;
  for (const m of text.matchAll(fence)) {
    const lines = m[1].replace(/\n$/, "").split("\n");
    if (lines[0].trim() === OWNER_MARKER) return lines;
  }
  return null;
}

test("the owner block exists in the design reference and states the all-stages rule (S10)", () => {
  const lines = ownerVersionedBlock(design);
  assert.ok(lines, `no ${OWNER_MARKER} block in ${OWNER_REL}`);
  const body = lines.join("\n");
  // The rule's own vocabulary, from S10 verbatim anchors.
  assert.match(body, /not evidenced by the tree, the docs, or a prior owner decision/);
  assert.match(body, /without leaking data, secrets or project details/);
  assert.match(body, /the user decides/i);
  assert.match(body, /never answers on the user's behalf/i);
  assert.match(design, /single normative owner/i);
  assert.match(design, /never restate/i);
});

test("AGENTS.md declares the owner block as a normative surface", () => {
  const guide = read("AGENTS.md");
  const row = guide
    .split("\n")
    .find((l) => l.includes("ask-dont-infer-rule"));
  assert.ok(row, "normative-surfaces@1 has no ask-dont-infer-rule row");
  assert.match(row, /block:ask-dont-infer@1/);
  assert.match(row, /skills\/unit-lane\/references\/DESIGN\.md/);
});

test("every stage skill references the owner, never restates it (S10)", () => {
  for (const rel of STAGE_REFS) {
    const text = safeRead(rel);
    assert.ok(text, `missing stage skill: ${rel}`);
    assert.ok(
      text.includes("ask-don't-infer") || text.includes(OWNER_MARKER),
      `${rel} does not reference the no-assumption rule`,
    );
    assert.ok(
      text.includes("DESIGN.md"),
      `${rel} references the rule without pointing at its owner (DESIGN.md)`,
    );
  }
});

test("zero restatements: no rule-name occurrence outside the owner lacks an owner pointer (S10)", () => {
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) {
        const rel = path.relative(root, full).split(path.sep).join("/");
        if (rel === OWNER_REL) continue;
        const text = safeRead(rel);
        if (!text || !text.includes("ask-don't-infer")) continue;
        // A reference carries the owner pointer within its paragraph window;
        // an occurrence without one is a restatement (the defect AC6 forbids).
        const lines = text.split("\n");
        lines.forEach((line, index) => {
          if (!line.includes("ask-don't-infer")) return;
          const window = lines
            .slice(Math.max(0, index - REFERENCE_WINDOW), index + REFERENCE_WINDOW + 1)
            .join("\n");
          if (!window.includes("DESIGN.md")) offenders.push(`${rel}:${index + 1}`);
        });
      }
    }
  };
  walk(path.join(root, "skills"));
  assert.deepEqual(offenders, [], `restatements of the no-assumption rule (must reference ${OWNER_REL}): ${offenders.join(", ")}`);
});

test("the owner keeps the document-or-don't-coin gate beside the rule (regression pin)", () => {
  assert.match(design, /document-or-don't-coin/);
  assert.match(design, /Retirements/);
});

// ── 7. The seeded residue fixture (issue AC1) ───────────────────────────────

test("fixture generator yields the four seeds and a clean twin, deterministically", () => {
  const dir1 = fs.mkdtempSync(path.join(os.tmpdir(), "residue-fixture-1-"));
  const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), "residue-fixture-2-"));
  try {
    const run = (dir) =>
      spawnSync(process.execPath, [generatorFile, dir], { encoding: "utf8" });
    const r1 = run(dir1);
    assert.equal(r1.status, 0, r1.stderr);
    const r2 = run(dir2);
    assert.equal(r2.status, 0, r2.stderr);

    const seeded = path.join(dir1, "seeded");
    const clean = path.join(dir1, "clean");

    // (a) duplicated grammar copy — the grammar block, byte-identical, in two places.
    const blockOf = (text) => {
      const start = text.indexOf("demo-grammar@1");
      assert.notEqual(start, -1, "grammar block missing");
      return text.slice(start, text.indexOf("\n\n", start) === -1 ? undefined : text.indexOf("\n\n", start));
    };
    const grammar = blockOf(fs.readFileSync(path.join(seeded, "lib", "grammar.md"), "utf8"));
    const grammarCopy = blockOf(fs.readFileSync(path.join(seeded, "docs", "grammar-copy.md"), "utf8"));
    assert.equal(grammar, grammarCopy);
    assert.match(grammar, /farewell \| goodbye/);

    // (b) exported-but-unconsumed function.
    const orphan = fs.readFileSync(path.join(seeded, "lib", "orphan.js"), "utf8");
    assert.match(orphan, /export function orphanResidueFormatter/);
    for (const entry of fs.readdirSync(seeded, { recursive: true, encoding: "utf8" })) {
      if (entry.endsWith("orphan.js")) continue;
      const full = path.join(seeded, entry);
      if (fs.statSync(full).isFile()) {
        assert.ok(!fs.readFileSync(full, "utf8").includes("orphanResidueFormatter"), `seed (b) is consumed by ${entry}`);
      }
    }

    // (c) a doc naming a removed surface.
    const legacy = fs.readFileSync(path.join(seeded, "docs", "legacy-surface.md"), "utf8");
    assert.match(legacy, /--legacy-residue-flag/);
    let legacySurfaceExists = false;
    for (const entry of fs.readdirSync(seeded, { recursive: true, encoding: "utf8" })) {
      const full = path.join(seeded, entry);
      if (fs.statSync(full).isFile() && !entry.includes("legacy-surface") && fs.readFileSync(full, "utf8").includes("--legacy-residue-flag")) {
        legacySurfaceExists = true;
      }
    }
    assert.equal(legacySurfaceExists, false, "seed (c)'s surface exists in the tree");

    // (d) a live consumer-facing surface with no doc.
    assert.ok(fs.existsSync(path.join(seeded, "lib", "api.js")));
    assert.ok(fs.existsSync(path.join(seeded, "lib", "main.js")));
    for (const entry of fs.readdirSync(seeded, { recursive: true, encoding: "utf8" })) {
      const full = path.join(seeded, entry);
      if (fs.statSync(full).isFile() && entry !== path.join("lib", "api.js") && entry !== path.join("lib", "main.js")) {
        assert.ok(!fs.readFileSync(full, "utf8").includes("residueApi"), `seed (d) is documented by ${entry}`);
      }
    }

    // The clean twin repairs all four without changing the shape.
    assert.ok(fs.existsSync(path.join(clean, "lib", "grammar.md")));
    assert.ok(!fs.existsSync(path.join(clean, "lib", "orphan.js")));
    assert.ok(fs.existsSync(path.join(clean, "docs", "api.md")));

    // Determinism: two runs produce byte-identical trees.
    const snapshot = (base) =>
      fs
        .readdirSync(base, { recursive: true, encoding: "utf8" })
        .sort()
        .map((entry) => `${entry}:${fs.statSync(path.join(base, entry)).isFile() ? fs.readFileSync(path.join(base, entry), "utf8") : "dir"}`)
        .join("\n");
    assert.equal(snapshot(path.join(dir1, "seeded")), snapshot(path.join(dir2, "seeded")));
    assert.equal(snapshot(path.join(dir1, "clean")), snapshot(path.join(dir2, "clean")));
  } finally {
    fs.rmSync(dir1, { recursive: true, force: true });
    fs.rmSync(dir2, { recursive: true, force: true });
  }
});

test("the generator refuses to run without a target", () => {
  const r = spawnSync(process.execPath, [generatorFile], { encoding: "utf8" });
  assert.notEqual(r.status, 0);
  assert.match(`${r.stdout}\n${r.stderr}`, /usage:/);
});

// Smoke: the suite itself runs under the test runner in a child repo too.
if (!isChildRun) {
  test("self-check: this file is the declared validator of the unit's obligations", () => {
    const obligations = read("docs/fix/340-deletion-reuse-obligations/planning-obligations.md");
    assert.match(obligations, new RegExp(`residue-dimensions\\.test\\.mjs`));
    assert.ok(fs.existsSync(thisFile));
  });
}
