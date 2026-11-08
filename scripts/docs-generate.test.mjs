#!/usr/bin/env node

/**
 * docs-generate.test.mjs — the generator's frozen corpus (issue #396).
 *
 * The change ships one deterministic command that renders the repository's own
 * artifacts — unit docs, roadmap rows and the shipped code — into the output
 * format the project declared in its `Docs site` block. Every case below is a
 * behaviour the issue orders (`S2`–`S7`), asserted at the CLI boundary the docs
 * step and the gate actually call, over a throwaway tree:
 *
 *   the declared format selects the emitter (md, mdx, html, latex)
 *   no declared format falls back to markdown and reports the degradation
 *   an unrecognised declared format refuses instead of silently downgrading
 *   two consecutive runs are byte-identical (S6's determinism half)
 *   `--check` names every missing, stale and orphaned file (S6's drift half)
 *   a page whose source unit is gone is deleted, and nothing authored is touched
 *   the tree covers both halves: the delivered features and the code surface
 *   the live repository is drift-free, so the root gate can call the check
 *
 * Nothing writes the repository: every fixture lives under `mkdtemp` and is
 * removed in a `finally`. The one live-tree case is a read-only `--check`.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO, "scripts", "docs-generate.mjs");

/** Run the generator against a fixture tree. */
function run(root, ...args) {
  const result = spawnSync(process.execPath, [SCRIPT, "--root", root, ...args], {
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

/** Every file under a directory, keyed by its tree-relative POSIX path. */
function tree(dir) {
  const out = new Map();
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.set(path.relative(dir, full).split(path.sep).join("/"), fs.readFileSync(full, "utf8"));
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

const DOCS_SITE = (slots) => `# Fixture project

## Docs site

\`\`\`
${slots.map((slot) => `- ${slot}`).join("\n")}
\`\`\`
`;

const FEATURE_SPEC = (title, oneLine) => `# ${title}

> One-line: ${oneLine}

## Specs

**S1 — something.**
> the requester's words

## Tasks

- P1 — do it (validator: \`bun test x\` exits 0)
  (Implements: S1)
`;

/** A throwaway project tree shaped like a target project. */
function fixture({ guide = "", units = [], roadmapRows = [], packages = [], skills = [], scripts = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "docs-generate-"));
  fs.writeFileSync(path.join(root, "AGENTS.md"), guide);
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  if (roadmapRows.length > 0) {
    fs.writeFileSync(
      path.join(root, "docs", "ROADMAP.md"),
      [
        "# Roadmap",
        "",
        "## Features",
        "",
        "| NN | slug | status | depends | notes |",
        "|---|---|---|---|---|",
        ...roadmapRows,
        "",
      ].join("\n"),
    );
  }
  for (const unit of units) {
    const dir = path.join(root, "docs", "features", unit.dir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "SPEC.md"), unit.spec ?? FEATURE_SPEC(unit.title, unit.oneLine));
  }
  for (const pkg of packages) {
    const dir = path.join(root, "packages", pkg.dir);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name: pkg.name, version: pkg.version ?? "1.0.0", bin: pkg.bin ?? {} }, null, 2),
    );
  }
  for (const skill of skills) {
    const dir = path.join(root, "skills", skill.name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "SKILL.md"),
      `---\nname: ${skill.name}\ndescription: ${skill.description}\n---\n\n# ${skill.name}\n`,
    );
  }
  if (scripts.length > 0) {
    fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
    for (const name of scripts) fs.writeFileSync(path.join(root, "scripts", name), "#!/usr/bin/env node\n");
  }
  return root;
}

/**
 * A fixture with a declared format and one unit. `contentDir: true` adds the
 * `content-dir` slot (the projection lands under the project's site tree); the
 * default leaves it out, so the projection lands in `docs/generated`.
 */
function declared(format, { contentDir = true } = {}) {
  return fixture({
    guide: DOCS_SITE([
      `format: ${format}`,
      ...(contentDir ? ["content-dir: src/content/docs/", "build: npx astro check"] : []),
      "map: none",
    ]),
    units: [{ dir: "01-shipped", title: "Shipped", oneLine: "one delivered feature" }],
    roadmapRows: ["| 1 | `shipped` | done · [#7](https://example.test/pull/7) | — | one delivered feature |"],
    packages: [{ dir: "runner", name: "@fixture/runner", bin: { runner: "./bin/runner.mjs" } }],
    skills: [{ name: "some-skill", description: "does one thing" }],
    scripts: ["tool.mjs"],
  });
}

const cleanup = (dir) => fs.rmSync(dir, { recursive: true, force: true });

// ── S3 — the declared format selects the emitter ────────────────────────

const EMITTERS = [
  { declared: "markdown", ext: "md", marker: (text) => !text.startsWith("---") && text.startsWith("# ") },
  { declared: "md" , ext: "md", marker: (text) => !text.startsWith("---") && text.startsWith("# ") },
  { declared: "starlight", ext: "mdx", marker: (text) => text.startsWith("---\ntitle:") },
  { declared: "docusaurus", ext: "mdx", marker: (text) => text.startsWith("---\ntitle:") },
  { declared: "mdx", ext: "mdx", marker: (text) => text.startsWith("---\ntitle:") },
  { declared: "html", ext: "html", marker: (text) => text.startsWith("<!doctype html>") },
  { declared: "latex", ext: "tex", marker: (text) => text.includes("\\section*{") },
];

for (const { declared: format, ext, marker } of EMITTERS) {
  test(`emitter: format: ${format} renders .${ext}`, () => {
    const root = declared(format);
    try {
      const result = run(root);
      assert.equal(result.status, 0, result.stderr);
      const files = tree(path.join(root, "src", "content", "docs", "generated"));
      const index = files.get(`index.${ext}`);
      assert.ok(index, `expected index.${ext}, got ${[...files.keys()].join(", ")}`);
      assert.ok(marker(index), `index.${ext} does not carry the ${format} shape:\n${index.slice(0, 200)}`);
      assert.ok(files.has(`units.${ext}`) && files.has(`code.${ext}`), "the projection is missing a page");
    } finally {
      cleanup(root);
    }
  });
}

// ── S4 — fallback and refusal ───────────────────────────────────────────

test("degradation: no Docs site block falls back to markdown and reports it", () => {
  const root = fixture({ units: [{ dir: "01-shipped", title: "Shipped", oneLine: "one delivered feature" }] });
  try {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^Format: md — degraded \(no `Docs site` block in AGENTS\.md\)$/m);
    const files = tree(path.join(root, "docs", "generated"));
    assert.ok(files.has("index.md"), `expected docs/generated/index.md, got ${[...files.keys()].join(", ")}`);
    assert.match(result.stdout, /^verdict: PASS$/m);
  } finally {
    cleanup(root);
  }
});

test("refusal: an unrecognised declared format exits 2 and writes nothing", () => {
  const root = declared("asciidoc");
  try {
    const result = run(root);
    assert.equal(result.status, 2, `expected exit 2, got ${result.status}\n${result.stdout}`);
    assert.match(result.stderr, /^DOCS GENERATE REFUSAL — unrecognised format 'asciidoc'/m);
    assert.deepEqual(tree(path.join(root, "src", "content", "docs", "generated")), new Map());
  } finally {
    cleanup(root);
  }
});

// ── S2/S5 — coverage of both halves ─────────────────────────────────────

test("coverage: the projection names the delivered features and the shipped code", () => {
  const root = declared("markdown", { contentDir: false });
  try {
    assert.equal(run(root).status, 0);
    const generated = path.join(root, "docs", "generated");
    const units = fs.readFileSync(path.join(generated, "units.md"), "utf8");
    assert.match(units, /01-shipped/, "the units page does not name the unit");
    assert.match(units, /done · \[#7\]\(https:\/\/example\.test\/pull\/7\)/, "the units page does not carry the roadmap status");
    const code = fs.readFileSync(path.join(generated, "code.md"), "utf8");
    assert.match(code, /@fixture\/runner/, "the code page does not name the package");
    assert.match(code, /runner/, "the code page does not name the package's bin entry");
    assert.match(code, /some-skill/, "the code page does not name the skill");
    assert.match(code, /tool\.mjs/, "the code page does not name the script");
  } finally {
    cleanup(root);
  }
});

test("units: a legacy spec without a One-line quote falls back to its title, never template boilerplate", () => {
  const root = fixture({
    units: [
      {
        dir: "01-legacy",
        spec: [
          "# 01 — legacy",
          "",
          "> Feature specification. Detailed phase tasks live in `PLAN.md` / `TASKS.md`.",
          "",
          "## Goal",
          "",
          "Ship the thing.",
        ].join("\n"),
      },
    ],
  });
  try {
    assert.equal(run(root).status, 0);
    const units = fs.readFileSync(path.join(root, "docs", "generated", "units.md"), "utf8");
    assert.doesNotMatch(units, /Feature specification/, "template boilerplate leaked into the units page");
    assert.match(units, /\| 01-legacy \| feature \| — \| 01 — legacy \|/, "the cell does not fall back to the unit's title");
  } finally {
    cleanup(root);
  }
});

test("units: a commented frontmatter note is never read as the title (the template's own shape)", () => {
  const root = fixture({
    units: [
      {
        dir: "02-commented",
        spec: [
          "---",
          "# Uncomment and set the keys the unit needs; until type/scope are set, the readers fall back to the folder",
          "# (type) and to the requirement count (scope).",
          "# type: feature | fix | docs | chore",
          "# ac-hash: <sha256 of the ## Acceptance criteria section — the design step writes it>",
          "type: fix",
          "scope: medium",
          "---",
          "",
          "# 02 — commented",
          "",
          "## Goal",
          "",
          "Ship the other thing.",
        ].join("\n"),
      },
    ],
  });
  try {
    assert.equal(run(root).status, 0);
    const units = fs.readFileSync(path.join(root, "docs", "generated", "units.md"), "utf8");
    assert.doesNotMatch(units, /Uncomment and set the keys/, "the commented frontmatter note leaked into the units page");
    assert.doesNotMatch(units, /ac-hash: <sha256/, "a commented frontmatter key leaked into the units page");
    assert.match(units, /\| 02-commented \| feature \| — \| 02 — commented \|/, "the cell does not carry the unit's H1");
  } finally {
    cleanup(root);
  }
});

test("dry-run: reports the plan, writes nothing", () => {
  const root = declared("html", { contentDir: false });
  try {
    const result = run(root, "--dry-run");
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^DOCS DRY-RUN — .*generated$/m);
    assert.match(result.stdout, /^Format: html \(declared\)$/m);
    assert.match(result.stdout, /^Would write: code\.html, index\.html, units\.html$/m);
    assert.deepEqual(tree(path.join(root, "src", "content", "docs", "generated")), new Map());
  } finally {
    cleanup(root);
  }
});

// ── S6 — determinism ────────────────────────────────────────────────────

test("determinism: two consecutive runs are byte-identical, stdout included", () => {
  const root = declared("markdown", { contentDir: false });
  try {
    const first = run(root);
    assert.equal(first.status, 0, first.stderr);
    const firstTree = tree(path.join(root, "docs", "generated"));
    const second = run(root);
    assert.equal(second.status, 0, second.stderr);
    const secondTree = tree(path.join(root, "docs", "generated"));
    assert.deepEqual([...secondTree.keys()], [...firstTree.keys()]);
    for (const [file, body] of firstTree) assert.equal(secondTree.get(file), body, `${file} changed between runs`);
    assert.match(first.stdout, /^Files: 3 written · 0 deleted · 0 unchanged$/m);
    assert.match(second.stdout, /^Files: 0 written · 0 deleted · 3 unchanged$/m);
    assert.equal(
      second.stdout.replace(/^Files: .*$/m, ""),
      first.stdout.replace(/^Files: .*$/m, ""),
      "only the file tally may differ between two runs",
    );
  } finally {
    cleanup(root);
  }
});

// ── S6 — drift detection ────────────────────────────────────────────────

test("check: a clean tree exits 0", () => {
  const root = declared("markdown", { contentDir: false });
  try {
    assert.equal(run(root).status, 0);
    const result = run(root, "--check");
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /^DOCS CHECK — /m);
    assert.match(result.stdout, /^Files: 3 checked · 0 missing · 0 stale · 0 orphaned$/m);
    assert.match(result.stdout, /^verdict: PASS$/m);
  } finally {
    cleanup(root);
  }
});

test("check: a missing page is named and exits 1", () => {
  const root = declared("markdown", { contentDir: false });
  try {
    assert.equal(run(root).status, 0);
    fs.rmSync(path.join(root, "docs", "generated", "code.md"));
    const result = run(root, "--check");
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /^docs\/generated\/code\.md: missing$/m);
    assert.match(result.stdout, /^verdict: DRIFT$/m);
  } finally {
    cleanup(root);
  }
});

test("check: a stale page is named and exits 1", () => {
  const root = declared("markdown", { contentDir: false });
  try {
    assert.equal(run(root).status, 0);
    const page = path.join(root, "docs", "generated", "units.md");
    fs.writeFileSync(page, `${fs.readFileSync(page, "utf8")}\nhand edit\n`);
    const result = run(root, "--check");
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stdout, /^docs\/generated\/units\.md: stale$/m);
  } finally {
    cleanup(root);
  }
});

test("check: an orphaned page is named and exits 1 before the next run deletes it", () => {
  const root = declared("markdown", { contentDir: false });
  try {
    assert.equal(run(root).status, 0);
    const orphan = path.join(root, "docs", "generated", "old.md");
    fs.writeFileSync(orphan, "a page nothing generates\n");
    const check = run(root, "--check");
    assert.equal(check.status, 1, check.stdout);
    assert.match(check.stdout, /^docs\/generated\/old\.md: orphaned$/m);
  } finally {
    cleanup(root);
  }
});

// ── S7 — obsolete surfaces never accumulate ─────────────────────────────

test("removal: a retired page is deleted and the retired unit leaves every page, authored files untouched", () => {
  const root = fixture({
    guide: DOCS_SITE(["format: markdown"]),
    units: [
      { dir: "01-shipped", title: "Shipped", oneLine: "one delivered feature" },
      { dir: "02-retired", title: "Retired", oneLine: "a feature that left" },
    ],
    scripts: ["tool.mjs"],
  });
  try {
    assert.equal(run(root).status, 0);
    const generated = path.join(root, "docs", "generated");
    assert.match(fs.readFileSync(path.join(generated, "units.md"), "utf8"), /02-retired/);
    fs.writeFileSync(path.join(root, "docs", "hand-written.md"), "authored\n");
    // Retire the unit *and* the page set the previous declaration produced: the
    // retired unit leaves every page, and every page the new format does not
    // name is deleted. A format change is the case that renames the whole set.
    fs.rmSync(path.join(root, "docs", "features", "02-retired"), { recursive: true, force: true });
    fs.writeFileSync(
      path.join(root, "AGENTS.md"),
      DOCS_SITE(["format: latex"]),
    );
    const removed = run(root);
    assert.equal(removed.status, 0, removed.stderr);
    assert.match(removed.stdout, /^Files: 3 written · 3 deleted · 0 unchanged$/m);
    assert.deepEqual([...tree(generated).keys()], ["code.tex", "index.tex", "units.tex"]);
    assert.doesNotMatch(fs.readFileSync(path.join(generated, "units.tex"), "utf8"), /02-retired/);
    assert.equal(fs.readFileSync(path.join(root, "docs", "hand-written.md"), "utf8"), "authored\n");
  } finally {
    cleanup(root);
  }
});

// ── the live tree is green (the gate's call) ────────────────────────────

test("live tree: the committed projection matches its sources", () => {
  const result = spawnSync(process.execPath, [SCRIPT, "--check"], { cwd: REPO, encoding: "utf8" });
  assert.equal(result.status, 0, `the committed generated tree is stale — run \`bun scripts/docs-generate.mjs\`\n${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /^verdict: PASS$/m);
});

// ── discovery, at its own boundary ─────────────────────────────────────

test("discovery: the Docs site block's slots are read, an absent block yields none", async () => {
  const { parseDocsSiteBlock } = await import(SCRIPT);
  const block = parseDocsSiteBlock(DOCS_SITE(["format: starlight", "content-dir: docs/site/", "build: none", "map: npm run docs:graph"]));
  assert.deepEqual(block, {
    format: "starlight",
    contentDir: "docs/site/",
    build: "none",
    map: "npm run docs:graph",
  });
  assert.equal(parseDocsSiteBlock("# No block here\n\ntext\n"), null);
});

test("degradation: an unfilled scaffold menu is not a declared format", () => {
  const root = fixture({ guide: DOCS_SITE(["format: starlight | docusaurus | markdown"]) });
  try {
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^Format: md — degraded \(the `Docs site` block still carries the scaffold's format menu/m);
    assert.ok(tree(path.join(root, "docs", "generated")).has("index.md"));
  } finally {
    cleanup(root);
  }
});
