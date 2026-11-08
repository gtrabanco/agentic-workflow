#!/usr/bin/env node

/**
 * guide-split.test.mjs — the guide layer loads progressively, and nothing is said twice.
 *
 * `AGENTS.md` is read in full by every session, so its size is a cost every
 * session pays and its content is a promise the repository keeps. This suite is
 * the contract that keeps both halves honest after the split (issue #332):
 *
 *   the core keeps the always-needed sections, in a reading order;
 *   the `## Deep references` index resolves, and every extracted reference doc
 *   is reachable from it in one hop;
 *   no non-trivial line is stated in both the core and a reference — the defect
 *   class that lets a moved rule grow back where it was just deleted from;
 *   the documentation map, the layout block, the precedence ladder and the four
 *   rule lines the split added are all still there;
 *   the guide layer stays inside the ceilings `--documents` enforces.
 *
 * `GUIDE_SPLIT_ROOT` points the same checks at another checkout, which is how the
 * suite proves it is red on the pre-split tree instead of trusting that it would
 * be. Nothing here writes.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.GUIDE_SPLIT_ROOT
  ? path.resolve(process.env.GUIDE_SPLIT_ROOT)
  : path.resolve(HERE, "..");

const GUIDE = "AGENTS.md";
const MANIFEST = "docs/workflow/SKILL_CONTEXT_BUDGETS.json";

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(ROOT, relative));
const guideText = () => read(GUIDE);
const manifest = () => JSON.parse(read(MANIFEST));

/** The body of one `## ` section, fenced blocks included. */
const section = (text, heading) => {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
};

/** `[label](target)` targets of one markdown section, anchors and URLs excluded. */
const linksOf = (text) => [...text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)]
  .map((match) => match[1].trim())
  .filter((target) => target !== "" && !target.startsWith("http") && !target.startsWith("#"));

/** Lines a restatement check can compare: long enough to carry a rule, not a URL. */
/** A line with its links removed — what is left is the prose a reader keeps. */
const strippedProse = (line) => line
  .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
  .replace(/https?:\/\/\S+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const comparable = (text) => {
  const out = [];
  for (const raw of text.split("\n")) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (line.length < 40) continue;
    if (!/[A-Za-z]/.test(line)) continue;
    // A line whose substance is a link is a reference, not a restatement: two
    // documents may point at the same issue or file without saying the same thing.
    if (strippedProse(line).length < 30) continue;
    out.push(line);
  }
  return out;
};

/** A line stated in both a core and a reference document. */
const restatements = (core, reference) => {
  const referenceLines = new Set(comparable(reference));
  return comparable(core).filter((line) => referenceLines.has(line));
};

/** The reference docs the guide indexes, from its own `## Deep references` table. */
const referencedDocs = () => {
  const body = section(guideText(), "Deep references");
  assert.ok(body !== null, "AGENTS.md declares a `## Deep references` section");
  return linksOf(body);
};

// ---------------------------------------------------------------------------
// 1. The core keeps the always-needed sections, in a reading order
// ---------------------------------------------------------------------------

test("the core declares its sections in reading order (S1, S10, S11)", () => {
  const text = guideText();
  const order = [
    "Repository layout",
    "Documentation map",
    "Deep references",
    "Instruction precedence",
    "Working rules",
    "Verification",
    "Conventions",
  ];
  let cursor = -1;
  for (const heading of order) {
    const at = text.split("\n").findIndex((line) => line.trim() === `## ${heading}`);
    assert.notEqual(at, -1, `AGENTS.md is missing ## ${heading}`);
    assert.ok(at > cursor, `## ${heading} is out of reading order`);
    cursor = at;
  }
});

// ---------------------------------------------------------------------------
// 2. One hop: the index resolves, and nothing extracted is orphaned
// ---------------------------------------------------------------------------

test("the deep-references index resolves and every reference doc is one hop away (S1, S4)", () => {
  const links = referencedDocs();
  assert.ok(links.length >= 5, `the index carries ${links.length} rows — it is the map of what is not loaded`);
  for (const link of links) {
    assert.ok(exists(link), `the index points at ${link}, which does not exist`);
  }
  const extracted = Object.keys(manifest().documents.files).filter((file) => file !== GUIDE);
  for (const file of extracted) {
    assert.ok(links.includes(file), `${file} is budgeted as a reference but the index never sends a reader to it`);
  }
});

test("the moved rules are gone from the core and present in their reference (S3, S12)", () => {
  const core = guideText();
  const authoring = read("docs/workflow/SKILL_AUTHORING.md");
  const packages = read("docs/workflow/PACKAGES.md");
  assert.ok(authoring.includes("Hand off, don't compose across a model/effort boundary"),
    "the authoring reference carries the model-tier hand-off rules");
  assert.ok(packages.includes("bun workspace"),
    "the packages reference carries the workspace rules");
  assert.ok(!core.includes("Hand off, don't compose across a model/effort boundary"),
    "the guide keeps a pointer, not the authoring rules");
  assert.ok(!core.includes("bun-managed islands — see Packages below"),
    "the guide's layout line does not claim a `Packages` section it no longer has");
});

// ---------------------------------------------------------------------------
// 3. No restatement: a rule has exactly one home
// ---------------------------------------------------------------------------

test("no non-trivial line is stated in both the core and a reference (S7)", () => {
  const core = guideText();
  for (const file of Object.keys(manifest().documents.files).filter((name) => name !== GUIDE)) {
    const duplicates = restatements(core, read(file));
    assert.deepEqual(duplicates, [], `${file} restates lines the core already carries: ${duplicates[0] ?? ""}`);
  }
});

test("the restatement check flags a copied line and ignores a shared URL", () => {
  const rule = "- **A rule that is long enough to be worth one home.** It lives here and nowhere else, which is the point of the check.";
  const reference = `# Reference\n\n${rule}\n\nSee [the issue](https://github.com/gtrabanco/agentic-workflow/issues/332) for the reasoning.\n`;
  const core = `# Core\n\nSee [the issue](https://github.com/gtrabanco/agentic-workflow/issues/332) for the reasoning.\n\n${rule}\n`;
  const flagged = restatements(core, reference);
  assert.deepEqual(flagged, [rule], "a copied rule line is the defect");
  const sharedOnly = restatements(
    "See [the issue](https://github.com/gtrabanco/agentic-workflow/issues/332) for the reasoning.",
    "See [the issue](https://github.com/gtrabanco/agentic-workflow/issues/332) for the reasoning.",
  );
  assert.deepEqual(sharedOnly, [], "a shared URL is not a restatement");
});

// ---------------------------------------------------------------------------
// 4. The four rule lines the revision added, and the two completed blocks
// ---------------------------------------------------------------------------

test("the documentation map has 7-9 rows and every doc it names exists (S10)", () => {
  const body = section(guideText(), "Documentation map");
  assert.ok(body !== null, "AGENTS.md declares a `## Documentation map`");
  const rows = body.split("\n").filter((line) => /^\|\s*[A-Z]/.test(line) && !line.includes("Required docs"));
  assert.ok(rows.length >= 7 && rows.length <= 9, `the map carries ${rows.length} rows, not 7-9`);
  const targets = linksOf(body);
  assert.ok(targets.length >= 7, `the map carries ${targets.length} links`);
  for (const target of targets) assert.ok(exists(target), `the documentation map points at ${target}, which does not exist`);
  assert.ok(body.includes("docs/workflow/README.md"), "the pages index is named as its own owner (S10)");
});

test("the layout block names every top-level surface, and each exists (S13)", () => {
  const body = section(guideText(), "Repository layout");
  assert.ok(body !== null, "AGENTS.md declares a `## Repository layout`");
  const fence = /```[a-z]*\n([\s\S]*?)```/.exec(body);
  assert.ok(fence, "the layout is a fenced block");
  const entries = fence[1].split("\n").filter((line) => line.trim() !== "")
    .map((line) => line.trim().split(/\s{2,}/)[0]);
  for (const required of ["skills/", "template/", "packages/", "scripts/", "docs/architecture/",
    "docs/design/", "docs/research/", "docs/CAPABILITIES.md", "docs/LOGS.md", ".changeset/", "skills.sh.json"]) {
    assert.ok(entries.includes(required), `the layout block does not name ${required} (S13)`);
  }
  for (const entry of entries) {
    if (entry.includes("*") || entry.includes("$")) continue;
    assert.ok(exists(entry), `the layout block names ${entry}, which does not exist`);
  }
});

test("instruction precedence states the requester's ladder A, in order (S11)", () => {
  const body = section(guideText(), "Instruction precedence");
  assert.ok(body !== null, "AGENTS.md declares a `## Instruction precedence`");
  const rungs = body.split("\n").filter((line) => /^\d\.\s/.test(line.trim())).map((line) => line.trim());
  assert.equal(rungs.length, 4, "the ladder has four rungs");
  assert.match(rungs[0], /prompt/i);
  assert.match(rungs[1], /nearest `AGENTS\.md`/);
  assert.match(rungs[2], /personal `~\/AGENTS\.md`/);
  assert.match(rungs[3], /documents/i);
});

test("the runtime split is stated as measured, with the sweep that owns the rest (S14)", () => {
  const body = section(guideText(), "Verification");
  assert.match(body, /node --test/, "the suite runner is named");
  assert.match(body, /run-root-suite\.mjs/, "the suite command is named");
  assert.match(body, /Cannot use test outside of the test runner/,
    "the measured bun failure is quoted, not paraphrased");
  assert.match(body, /#329|issue #329/, "the node-to-bun sweep owns the change that would close the gap");
  assert.match(body, /carve-out|exception/i, "the carve-out is declared beside the rule");
});

test("the testing rule states the sibling suite and the never-edit-a-test line (S15)", () => {
  const body = section(guideText(), "Working rules");
  assert.match(body, /scripts\/x\.mjs` arrives with `scripts\/x\.test\.mjs/, "a new script ships its sibling suite");
  assert.match(body, /never by changing the code it judges|never by relaxing, deleting or skipping/,
    "the rule forbids editing a test to pass it");
  assert.ok(exists("scripts/structural-sibling-pins.test.mjs"),
    "the rule names a gate that reads the tree, so it is enforced and not merely stated");
  assert.match(body, /structural-sibling-pins\.test\.mjs/, "the rule cites its own gate");
});

test("the session-log hand-off is stated in the core (S16)", () => {
  const text = guideText();
  assert.match(text, /docs\/LOGS\.md/, "the journal is named");
  assert.match(text, /log-session/, "the skill that writes it is named");
});

test("the ownership rule is stated, with its gate named (S17)", () => {
  const body = section(guideText(), "Working rules");
  assert.match(body, /Every repetition names its owner/, "the rule is stated under its own name");
  assert.match(body, /find the surface that owns it and link it/, "the rule says what to do");
  assert.match(body, /residue-dimensions\.test\.mjs/, "the rule names the gate that reads it");
});

// ---------------------------------------------------------------------------
// 5. The budget the guide layer must stay inside
// ---------------------------------------------------------------------------

test("the branch/PR rule has one statement in the core, never a second copy", () => {
  const guide = guideText();
  assert.match(guide, /never stack PRs/u, "the rule's owner statement is present");
  assert.doesNotMatch(
    guide,
    /short branches off/u,
    "the overlapping second statement is gone — `Every repetition names its owner` allows no second copy inside the guide",
  );
});

test("the guide layer is inside the ceilings the manifest declares (S1, S7)", () => {
  // The ceiling enforcement lives in one owner: `scripts/check-skill-context.test.mjs`
  // asserts `--documents` exits 0, so one budget break is one named red. This case
  // reads the same report for the linkage the owner cannot answer: the manifest
  // budgets the guide, the report splits its machine region from its prose, and the
  // three required documents are the ones declared. A checker crash still fails
  // here, because the JSON it prints is what this case parses.
  const result = spawnSync(process.execPath, [path.join(ROOT, "scripts/check-skill-context.mjs"), "--documents", "--json"], {
    encoding: "utf8",
    cwd: ROOT,
  });
  const report = JSON.parse(result.stdout);
  const guide = report.documents.find((row) => row.file === GUIDE);
  assert.ok(guide, "the report budgets the guide");
  assert.ok(guide.prose > 0 && guide.machine > 0, "the report splits prose from the machine region");
  const declared = manifest().documents;
  assert.deepEqual(declared.requiredFiles.sort(), [GUIDE, "docs/workflow/PACKAGES.md", "docs/workflow/SKILL_AUTHORING.md"].sort(),
    "the guide layer's three documents are the ones the manifest requires");
});

test("the pre-split tree is red, so the contract is not vacuous", () => {
  // The differential: the same checks against the guide as it was before the
  // split. It must fail, and it must fail on the index rather than on a typo.
  const pristine = path.join(HERE, "..", ".git");
  if (!fs.existsSync(pristine)) return; // not a git checkout: the case cannot run, and says so by skipping the branch
  const result = spawnSync("git", ["show", "1c9375a1:AGENTS.md"], { encoding: "utf8", cwd: path.join(HERE, "..") });
  if (result.status !== 0) return; // a shallow or rewritten history: nothing to compare against
  const before = result.stdout;
  const body = (text) => {
    const lines = text.split("\n");
    const start = lines.findIndex((line) => line.trim() === "## Deep references");
    if (start === -1) return null;
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((line) => /^## /.test(line));
    return (end === -1 ? rest : rest.slice(0, end)).join("\n");
  };
  assert.equal(body(before), null, "the pre-split guide carries no Deep-references index, so the index case fails there");
  const duplicates = restatements(before, read("docs/workflow/SKILL_AUTHORING.md"));
  assert.ok(duplicates.length > 0, "the pre-split guide still restates the authoring rules it moved");
});
