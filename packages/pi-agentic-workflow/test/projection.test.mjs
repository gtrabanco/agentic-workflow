// projection.test.mjs — the pack-time projection (issue #410, SPEC S4/S6/S12).
//
// `bundle-skills.mjs` stops being byte-copy: a repo-internal manifest declares
// which prose sections the pi bundle drops or pointerizes, the transform
// resolves each rule through the #407 section locator, binds every removed
// range by sha256, and fails closed with a distinct code per failure mode.
// The manifest grammar and validator come from @gtrabanco/agentic-workflow-schema
// (#406); the locator comes from the runner crate (#407).
//
// Red-first: this suite landed before `scripts/projection.mjs` existed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import {
  PROJECTION_ERROR_CODES,
  ProjectionError,
  CRATE_COMMANDS,
  applyProjection,
  loadProjectionManifest,
  rulesFor,
} from "../scripts/projection.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CRATE_BIN = join(PKG_DIR, "..", "agentic-workflow", "bin", "agentic-workflow.mjs");

const sha256 = (text) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;

const TOY_SKILL = `---
name: toy-skill
---

# Toy skill

Intro line.

## Enforced section

Rule prose that deterministic code enforces.
Detail two.

### Kept child

This child stays.

### Dropped child

This child goes.

## Other section

Untouched body.
`;

const ENFORCED_SECTION = `## Enforced section

Rule prose that deterministic code enforces.
Detail two.

### Kept child

This child stays.

### Dropped child

This child goes.

`;

const OTHER_SECTION_BODY = `Untouched body.
`;

/** A remove rule for the toy skill's `Enforced section`, hash-bound for real. */
const removeEnforced = (over = {}) => ({
  id: "remove-enforced",
  op: "remove",
  source: "skills/toy-skill/SKILL.md",
  selector: { path: ["Toy skill", "Enforced section"] },
  enforcingCommand: "doc read",
  contentHash: sha256(ENFORCED_SECTION),
  ...over,
});

/** A pointerize rule for the toy skill's `Other section`, hash-bound for real. */
const pointerizeOther = (over = {}) => ({
  id: "pointerize-other",
  op: "pointerize",
  source: "skills/toy-skill/SKILL.md",
  selector: { path: ["Toy skill", "Other section"] },
  enforcingCommand: "doc read",
  contentHash: sha256(OTHER_SECTION_BODY),
  ...over,
});

const POINTER_LINE = `> Enforced by \`doc read\` — this section's prose is not shipped in the pi bundle; the standalone skills/ tree carries the full text.`;

test("projection: the empty rule list is a byte-identical no-op", () => {
  assert.equal(applyProjection(TOY_SKILL, []), TOY_SKILL);
});

test("projection: remove takes the whole section, untouched bytes identical", () => {
  const out = applyProjection(TOY_SKILL, [removeEnforced()]);
  assert.equal(out, `---
name: toy-skill
---

# Toy skill

Intro line.

## Other section

Untouched body.
`);
});

test("projection: remove with except keeps the declared children byte-identical", () => {
  const rule = removeEnforced({
    id: "remove-except-kept",
    except: [["Kept child"]],
    // The removed bytes are the parent range minus the kept child's range.
    contentHash: sha256(
      `## Enforced section\n\nRule prose that deterministic code enforces.\nDetail two.\n\n` +
        `### Dropped child\n\nThis child goes.\n\n`,
    ),
  });
  const out = applyProjection(TOY_SKILL, [rule]);
  assert.equal(out, `---
name: toy-skill
---

# Toy skill

Intro line.

### Kept child

This child stays.

## Other section

Untouched body.
`);
});

test("projection: remove honors a line-in-scope selector (the matched line only)", () => {
  const rule = removeEnforced({
    id: "remove-line",
    selector: {
      line: "Detail two.",
      within: { path: ["Toy skill", "Enforced section"] },
    },
    contentHash: sha256("Detail two.\n"),
  });
  const out = applyProjection(TOY_SKILL, [rule]);
  assert.equal(out, TOY_SKILL.replace("Detail two.\n", ""));
});

test("projection: pointerize keeps the heading and replaces the body with one pointer line", () => {
  const out = applyProjection(TOY_SKILL, [pointerizeOther()]);
  assert.equal(
    out,
    TOY_SKILL.replace(`## Other section\n\nUntouched body.\n`, `## Other section\n${POINTER_LINE}\n`),
  );
});

test("projection: rules apply sequentially and each hash binds the bytes it removes", () => {
  const out = applyProjection(TOY_SKILL, [removeEnforced(), pointerizeOther()]);
  assert.equal(
    out,
    `---
name: toy-skill
---

# Toy skill

Intro line.

## Other section
${POINTER_LINE}
`,
  );
});

test("projection: a tampered hash fails with hash-mismatch", () => {
  assert.throws(
    () => applyProjection(TOY_SKILL, [removeEnforced({ contentHash: `sha256:${"0".repeat(64)}` })]),
    (error) => error instanceof ProjectionError && error.code === "hash-mismatch",
  );
});

test("projection: zero matches fails stale-rule", () => {
  assert.throws(
    () => applyProjection(TOY_SKILL, [removeEnforced({ selector: { path: ["Toy skill", "Missing section"] } })]),
    (error) => error instanceof ProjectionError && error.code === "stale-rule",
  );
});

test("projection: several matches fail ambiguous-match", () => {
  assert.throws(
    () => applyProjection(TOY_SKILL, [removeEnforced({ selector: { heading: "Kept child" } })]),
    (error) => error instanceof ProjectionError && error.code === "ambiguous-match",
  );
});

test("projection: an unknown enforcing command fails unknown-command", () => {
  assert.throws(
    () => applyProjection(TOY_SKILL, [removeEnforced({ enforcingCommand: "totally-not-a-command" })]),
    (error) => error instanceof ProjectionError && error.code === "unknown-command",
  );
});

test("projection: the prereq op is refused unsupported-op (execution is another issue)", () => {
  assert.throws(
    () => applyProjection(TOY_SKILL, [removeEnforced({ id: "prereq-rule", op: "prereq" })]),
    (error) => error instanceof ProjectionError && error.code === "unsupported-op",
  );
});

test("projection: an except child that does not exist fails stale-rule", () => {
  assert.throws(
    () => applyProjection(TOY_SKILL, [removeEnforced({ except: [["No such child"]] })]),
    (error) => error instanceof ProjectionError && error.code === "stale-rule",
  );
});

test("projection: the failure codes are a distinct, declared set", () => {
  assert.deepEqual([...PROJECTION_ERROR_CODES], [
    "manifest-invalid",
    "stale-rule",
    "ambiguous-match",
    "hash-mismatch",
    "unknown-command",
    "unsupported-op",
  ]);
  assert.equal(new Set(PROJECTION_ERROR_CODES).size, PROJECTION_ERROR_CODES.length);
});

test("projection: enforcing commands are checked against the crate CLI's dispatch", () => {
  const bin = readFileSync(CRATE_BIN, "utf8");
  const dispatched = [...bin.matchAll(/case "([a-z-]+)":/g)].map((match) => match[1]);
  assert.ok(dispatched.length >= 10, `expected the crate CLI to dispatch several commands, found ${dispatched.length}`);
  assert.deepEqual([...CRATE_COMMANDS], [...new Set(dispatched)].sort());
});

test("projection: a manifest that fails schema validation is refused manifest-invalid", () => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-proj-"));
  try {
    const manifestPath = join(root, "projection-manifest.json");
    writeFileSync(manifestPath, JSON.stringify({ contract: "agentic-workflow/projection-manifest", version: 1, rules: [{ id: "bad" }] }));
    assert.throws(
      () => loadProjectionManifest(manifestPath),
      (error) => error instanceof ProjectionError && error.code === "manifest-invalid",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("projection: rulesFor selects only the declared source file", () => {
  const rules = [removeEnforced(), pointerizeOther({ source: "skills/other-skill/SKILL.md" })];
  assert.deepEqual(rulesFor(rules, "skills/toy-skill/SKILL.md").map((rule) => rule.id), ["remove-enforced"]);
  assert.deepEqual(rulesFor(rules, "skills/other-skill/SKILL.md").map((rule) => rule.id), ["pointerize-other"]);
  assert.deepEqual(rulesFor(rules, "skills/toy-skill/references/REF.md"), []);
});

test("projection: golden fixture — the committed stripped copy is byte-exact", () => {
  const fixtureDir = join(PKG_DIR, "test", "fixtures", "projection-golden");
  const manifest = loadProjectionManifest(join(fixtureDir, "projection-manifest.json"));
  const source = readFileSync(join(fixtureDir, "skills-source", "golden-skill", "SKILL.md"), "utf8");
  const expected = readFileSync(join(fixtureDir, "expected", "golden-skill", "SKILL.md"), "utf8");
  const rules = rulesFor(manifest.rules, "skills/golden-skill/SKILL.md");
  assert.equal(applyProjection(source, rules), expected);
});

test("projection: golden fixture — the committed manifest validates against the schema package", () => {
  const fixtureDir = join(PKG_DIR, "test", "fixtures", "projection-golden");
  const manifest = loadProjectionManifest(join(fixtureDir, "projection-manifest.json"));
  assert.equal(manifest.contract, "agentic-workflow/projection-manifest");
  assert.equal(manifest.version, 1);
  assert.ok(manifest.rules.length >= 2, "the golden manifest carries a remove and a pointerize rule");
});
