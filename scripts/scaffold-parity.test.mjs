#!/usr/bin/env node

/**
 * #355 — the scaffold comparator: `template/` against the mechanics it exports.
 *
 * The scaffold is the one surface nothing in this repository executes: a project
 * bootstrapped by `init-workspace` (or `npx degit …/template`) is born on these
 * files, and until this suite existed no gate compared them with the unit-doc
 * contract the lane writes and `phase-lint`/unit-route` accept. That is S10's
 * benchmark, and the red fixture under `fixtures/scaffold-parity/red/` is it made
 * executable: it reproduces the export the issue describes (pre-#308 sections,
 * `ACCEPTANCE.md`, `## Phases`, `TASKS.md`/`progress.md`, a tombstone row naming a
 * retired skill) so the reader below fails before it can ever pass vacuously.
 *
 * Three rules, one reader:
 *
 *   1. shape — every exported unit-doc template carries the re-cut section
 *      contract, in order, with no foreign section and no misplaced heading level
 *   2. retirement — no scaffold line names an artifact this repository retired,
 *      unless the line marks the token as a legacy/pre-#308 carrier
 *   3. the two product surfaces the issue ordered (#353's S5/S6 wording, shipped
 *      by fix #355) — the audit's route cell and the classifier's replan route
 *
 * The unit-doc section list is READ from its owner
 * (`packages/agentic-workflow-schema/src/pre-execution.ts`), never copied here:
 * a second literal list would be the #305/#308 drift class this repository keeps
 * repairing. The section-order assertion on the repo's own templates stays in
 * `scripts/unit-doc-contract.test.mjs`; this suite owns the *trees* — the export
 * and the fixtures — and adds no second copy of the order pin.
 *
 * `SCAFFOLD_PARITY_ROOT` re-points every tree read at a throwaway copy, so a
 * candidate change can be measured before it lands (`mktemp -d`, removed after).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.SCAFFOLD_PARITY_ROOT ? path.resolve(process.env.SCAFFOLD_PARITY_ROOT) : repoRoot;
const fixtureRoot = path.join(repoRoot, "scripts", "fixtures", "scaffold-parity");

const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const readFixture = (rel) => fs.readFileSync(path.join(fixtureRoot, rel), "utf8");

/** The scaffold tree, exactly the files `init-workspace` copies. */
const SCAFFOLD = "template";
/** The exported unit-doc templates, relative to a tree's root. */
const TEMPLATES = ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"];

/**
 * Artifacts this repository retired, each with the sentence shape that may still
 * name it. A line naming a token is an offender unless it marks the token as the
 * carrier of a pre-#308 (or pre-feature-61) shape — a bootstrapped project that
 * opened a unit before the re-cut still reads one, so the mention stays honest.
 */
const RETIRED = Object.freeze([
  { token: "ACCEPTANCE.md", legacy: /legacy|pre-#308|pre-feature 61|retired/i },
  { token: "## Phases", legacy: /legacy|pre-#308|pre-feature 61|retired/i },
  { token: "generate-docs", legacy: /legacy|retired|removed/i },
  { token: "TASKS.md", legacy: /legacy|pre-#308|retired/i },
  { token: "progress.md", legacy: /legacy|pre-#308|retired/i },
  // A tombstone that says "surface removed" without marking a legacy carrier is
  // the residue S1 forbids: the row documents something that is not there.
]);

/**
 * The sections one unit-doc template must carry, read from its own repo twin —
 * never copied, never a literal list.
 *
 * The published contract (`UNIT_DOC_SPEC_REF_SECTIONS`) is the floor; the repo
 * pair also publishes `## Retirements` and `## Future`, which the lane's design
 * step writes. Comparing an export with *its own* twin (fix↔fix, feature↔feature)
 * is what keeps a fix template's extra sections (`## Issue`, `## Branch`) from
 * being demanded of a feature template, and is what makes the two surfaces drift
 * visibly instead of silently.
 */
function requiredSections(rel) {
  return headings(read(rel)).filter((heading) => heading.level === 2).map((heading) => heading.text);
}

/** The section list the contract publishes, read from its owner — never copied. */
function ownerSpecRefSections() {
  const owner = fs.readFileSync(path.join(repoRoot, "packages/agentic-workflow-schema/src/pre-execution.ts"), "utf8");
  const at = owner.indexOf("UNIT_DOC_SPEC_REF_SECTIONS = Object.freeze(");
  assert.notEqual(at, -1, "the schema package no longer publishes UNIT_DOC_SPEC_REF_SECTIONS");
  const open = owner.indexOf("[", at);
  const close = owner.indexOf("]", open);
  return [...owner.slice(open + 1, close).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/**
 * Every heading in a Markdown document, fence-aware, with its level. Heading
 * level is the whole point: `# Findings` is not `## Findings`, and the contract
 * reads `## ` only, so a wrong level silently removes a section from the shape.
 */
function headings(text) {
  const out = [];
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const run = /^\s*(`{3,}|~{3,})/.exec(line);
    if (run) {
      if (fence === null) fence = run[1];
      else if (line.trim().length === run[1].length && line.trim()[0] === fence[0]) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = /^(#{1,6}) (.+)$/.exec(line);
    if (heading !== null) out.push({ level: heading[1].length, text: heading[2] });
  }
  return out;
}

/**
 * The parity failures of one unit-doc template, as strings. Empty means the
 * template carries the contract. A section is satisfied by a `## ` heading of
 * that exact text; any other level carrying the name is reported, because that
 * is precisely the drift a `^## ` reader cannot see.
 */
function shapeFailures(text, required) {
  const found = headings(text);
  const failures = [];
  const at = (section) => found.findIndex((heading) => heading.level === 2 && heading.text === section);
  let cursor = -1;
  for (const section of required) {
    const index = found.findIndex((heading) => heading.text === section);
    if (index === -1) {
      failures.push(`missing section: ## ${section}`);
      continue;
    }
    const heading = found[index];
    if (heading.level !== 2) {
      failures.push(`wrong heading level: ${"#".repeat(heading.level)} ${section} (the contract reads ## ${section})`);
      continue;
    }
    if (index < cursor) failures.push(`out of contract order: ## ${section}`);
    cursor = index;
  }
  for (const heading of found) {
    if (heading.level === 2 && !required.includes(heading.text)) {
      failures.push(`section outside the contract: ## ${heading.text}`);
    }
  }
  // An H1 that spells a required section is the same drift seen from the other
  // side: the document was edited under a heading the selector never reads.
  for (const heading of found) {
    if (heading.level !== 2 && required.includes(heading.text)) continue;
    if (heading.level !== 2 && required.some((section) => section === heading.text)) continue;
  }
  return failures;
}

/** `path:line — token` for every scaffold line naming a retired artifact. */
function retiredOffenders(tree) {
  const base = path.join(tree);
  const offenders = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.(md|mdx|txt|json|ya?ml|sh|mjs|js)$/.test(entry.name)) continue;
      const rel = path.relative(base, full).split(path.sep).join("/");
      const lines = fs.readFileSync(full, "utf8").split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const { token, legacy } of RETIRED) {
          if (!line.includes(token)) continue;
          if (legacy.test(line)) continue;
          offenders.push(`${rel}:${index + 1} — ${token}`);
        }
      });
    }
  };
  walk(base);
  return offenders;
}

// ── 1. The red corpus: the export the issue describes fails the reader ──────

test("#355 the red fixture reproduces the exported scaffold the issue reports and fails every rule", () => {
  // The fixture is a *feature* export and a *fix* export, so each fails against
  // its own twin's section list — the pre-#308 shape the issue's table records.
  const required = requiredSections(TEMPLATES[0]);

  const featureFailures = shapeFailures(readFixture("red/features/_TEMPLATE/SPEC.md"), required);
  assert.ok(featureFailures.length > 0, "the red feature fixture must fail the shape reader — it reproduces the pre-#308 export");
  for (const section of ["Objective", "Why", "User outcome", "Acceptance criteria", "Evidence", "Progress log"]) {
    assert.ok(
      featureFailures.some((failure) => failure.includes(section)),
      `the red feature fixture must report the legacy section the issue lists: ${section}`,
    );
  }

  const fixFailures = shapeFailures(readFixture("red/fix/_TEMPLATE/SPEC.md"), requiredSections(TEMPLATES[1]));
  assert.ok(fixFailures.some((failure) => failure.includes("Phases")), "the red fix fixture carries `## Phases`, which the contract does not declare");

  // The three the issue names as live in the scaffold's export; `TASKS.md` and
  // `progress.md` ride the same rule but the issue only asks the scaffold to mark
  // them, so their mention is not part of the red corpus.
  const offenders = retiredOffenders(path.join(fixtureRoot, "red"));
  for (const token of ["ACCEPTANCE.md", "## Phases", "generate-docs"]) {
    assert.ok(
      offenders.some((offender) => offender.includes(token)),
      `the red fixture must reproduce the retired-artifact mention the issue reports: ${token}`,
    );
  }
});

// ── 2. The live export carries the contract ────────────────────────────────

test("#355 every exported unit-doc template carries its repo twin's sections, in order", () => {
  for (const rel of TEMPLATES) {
    const failures = shapeFailures(read(path.join(SCAFFOLD, rel)), requiredSections(rel));
    assert.deepEqual(failures, [], `${SCAFFOLD}/${rel} drifts from the repo template it exports: ${failures.join("; ")}`);
  }
});

test("#355 the repo templates still publish every section the contract declares", () => {
  // The published list is the floor; a repo template that dropped one would make
  // the pin pass a document the selector refuses.
  const published = TEMPLATES.flatMap((rel) => requiredSections(rel));
  for (const section of ownerSpecRefSections()) {
    assert.ok(published.includes(section), `the repo templates no longer publish ## ${section}, which UNIT_DOC_SPEC_REF_SECTIONS declares`);
  }
});

test("#355 the export pairs the repo templates one-for-one", () => {
  // Parity is a claim about both pairs: an export that carries the sections in a
  // different order from its own repo twin is drift the sequence check above
  // would forgive the moment both trees drift together.
  for (const rel of TEMPLATES) {
    const exported = headings(read(path.join(SCAFFOLD, rel))).filter((h) => h.level === 2).map((h) => h.text);
    const repo = headings(read(rel)).filter((h) => h.level === 2).map((h) => h.text);
    assert.deepEqual(exported, repo, `${SCAFFOLD}/${rel} and ${rel} publish different section sequences`);
  }
});

test("#355 the scaffold names no retired artifact outside a legacy-marked sentence", () => {
  const offenders = retiredOffenders(path.join(root, SCAFFOLD));
  assert.deepEqual(offenders, [], `retired artifacts named by the scaffold (mark a legacy carrier explicitly or drop the line): ${offenders.join(", ")}`);
});

test("#355 the legacy allowance is pinned: the scaffold still documents a pre-#308 unit's carrier", () => {
  // The mention is allowed, so it must survive: a scaffold that quietly drops it
  // leaves a pre-#308 project's unit unreadable with no record of why.
  const guide = read(`${SCAFFOLD}/AGENTS.md`);
  const lines = guide.split(/\r?\n/).filter((line) => line.includes("review-findings.md"));
  assert.ok(lines.length >= 1, "the scaffold guide must still name a legacy unit's `review-findings.md` carrier");
  // The marking may live on the sentence that opens the carrier clause, so the
  // window is the paragraph — the same window the no-assumption scan uses.
  const all = guide.split(/\r?\n/);
  lines.forEach((line) => {
    const index = all.indexOf(line);
    const window = all.slice(Math.max(0, index - 2), index + 3).join("\n");
    assert.match(window, /legacy/i, `a scaffold paragraph naming \`review-findings.md\` must mark it as the legacy carrier: ${line.trim()}`);
  });
});

// ── 3. The reader refuses drift the contract's `^## ` scan cannot see ──────

test("#355 a renamed section fails closed", () => {
  const failures = shapeFailures(readFixture("drift/renamed/features/_TEMPLATE/SPEC.md"), ownerSpecRefSections());
  assert.ok(failures.some((failure) => failure.includes("missing section: ## Specs")), failures.join("; "));
  assert.ok(failures.some((failure) => failure.includes("section outside the contract: ## Requirements")), failures.join("; "));
});

test("#355 a section written at another heading level fails closed", () => {
  const failures = shapeFailures(readFixture("drift/wrong-level/features/_TEMPLATE/SPEC.md"), ownerSpecRefSections());
  assert.ok(
    failures.some((failure) => failure.includes("wrong heading level: # Findings")),
    `a level-1 heading is invisible to a ^## reader, so it must be reported by name: ${failures.join("; ")}`,
  );
});

test("#355 a reordered section fails closed", () => {
  const failures = shapeFailures(readFixture("drift/reordered/features/_TEMPLATE/SPEC.md"), ownerSpecRefSections());
  assert.ok(failures.some((failure) => failure.includes("out of contract order: ## Impact")), failures.join("; "));
});

test("#355 a section outside the contract fails closed", () => {
  const failures = shapeFailures(readFixture("drift/extra-section/features/_TEMPLATE/SPEC.md"), ownerSpecRefSections());
  assert.ok(failures.some((failure) => failure.includes("section outside the contract: ## Amendments")), failures.join("; "));
});

test("#355 a retired-artifact mention fails closed and names its file and line", () => {
  const offenders = retiredOffenders(path.join(fixtureRoot, "retired"));
  assert.equal(offenders.length, 1, `one mention, one offender: ${offenders.join(", ")}`);
  assert.match(offenders[0], /^features\/_TEMPLATE\/SPEC\.md:\d+ — ACCEPTANCE\.md$/);
});

// ── 4. The two product surfaces: #353 S5/S6, shipped by #355 ───────────────

const auditSkill = () => read("skills/product-audit/SKILL.md");
const classify = () => read("skills/review-implementation/references/CLASSIFY.md");

test("#355 the audit's finding line carries `route:` as the triage taken at flight", () => {
  const skill = auditSkill();
  // The fixed output block's finding line, not a proposal: S7 says every finding.
  assert.match(skill, /^ {2}F1 \[SEV · impact\] <dimension> — <finding> — evidence: .* — class: <[^>]+> — route: /m,
    "product-audit's fixed finding line must carry `route:` on every finding (the grade cell names both published sets, #361)");
  // The route states the next command and, optionally, the one reference it loads.
  assert.match(skill, /route: <the next command for this finding/);
  assert.match(skill, /loads:/);
  // `none` is a real answer and costs no context.
  assert.match(skill, /`none` costs no context/);
});

test("#355 the progressive-loading rule is stated once, and stating a route never executes it", () => {
  const skill = auditSkill();
  const stated = skill.match(/triage taken at flight/gi) ?? [];
  assert.equal(stated.length, 1, `the progressive-loading rule is stated exactly once in the skill: found ${stated.length}`);
  assert.match(skill, /never executes it/);
  // The report file stays the only mutation — the guarantee the rule must not erode.
  assert.match(skill, /Never auto-fixes, never opens issues, never edits the roadmap/);
  assert.match(skill, /the only mutation/i);
});

test("#355 the audit process records the route while numbering findings", () => {
  const process = read("skills/product-audit/references/AUDIT_PROCESS.md");
  assert.match(process, /route:/);
  assert.match(process, /progressive/i);
  // Deciding the route is this run's job; executing it never is.
  assert.match(process, /executing it is never this run's job/);
});

test("#355 the classifier routes a half-planned unit to replan, and a one-line consumer still folds", () => {
  const text = classify();
  const row = text.split(/\r?\n/).find((line) => line.startsWith("| Exported helper of a delivered feature that nothing invokes"));
  assert.ok(row, "CLASSIFY.md keeps the delivered-feature-without-consumer row");
  assert.match(row, /`replan-in-unit` when the missing half is planned work/);
  assert.match(row, /fold into phase` when the missing piece is a one-line consumer/);
  assert.match(row, /never what was never planned/);
  // The class stays a bug finding — the fix is not deletion and not a silent fold.
  assert.match(row, /fix-now/);
});

test("#355 no audit subcommand or scope flag was added with the route (#355 S12)", () => {
  const skill = auditSkill();
  assert.ok(!/--residue/.test(skill), "`--residue` stays rejected: no scope flag on the audit");
  assert.ok(!/^\s*--[a-z]/m.test(skill), "the audit takes no subcommand or scope flag");
});

// ── 5. The comparator cannot pass vacuously ───────────────────────────────

test("#355 the live export is what the reader is pointed at, not a fixture", () => {
  // A guard against the classic false green: the suite asserts the export, so a
  // tree without one is a failure, never a skip.
  for (const rel of TEMPLATES) {
    assert.ok(fs.existsSync(path.join(root, SCAFFOLD, rel)), `${SCAFFOLD}/${rel} is missing — the scaffold exports no unit-doc template`);
  }
  assert.ok(ownerSpecRefSections().length >= 10, "the contract's re-cut list is read from the schema package, not assumed");
});
