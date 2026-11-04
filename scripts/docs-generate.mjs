#!/usr/bin/env node

/**
 * docs-generate.mjs — the reverse edge of "docs drive the work" (issue #396).
 *
 * The workflow's first principle is that docs order the code, but nothing made
 * the delivered work reach the docs: a unit shipped, its SPEC landed, and the
 * human-facing documentation stayed where it was. This command closes that edge
 * deterministically. It reads the repository's own artifacts — the unit docs,
 * the roadmap rows and the shipped code surface — and renders them into the
 * output format the project declared at initialization, so the projection is a
 * function of the tree instead of a page someone remembered to write.
 *
 * Format discovery reads the guide's `Docs site` block (`AGENTS.md`, the
 * substrate `init-workspace` fills): `format`, `content-dir`, `build`, `map`.
 * The declared format selects the emitter; `md`, `mdx`, `html` and `latex` are
 * the targets. No block degrades to markdown and says so — S4 forbids a silent
 * failure, and an unknown declared value refuses (exit 2) instead of quietly
 * downgrading the format the project asked for.
 *
 * Generated pages are projections, never authored surfaces (feature 65:
 * Markdown stays the single source of truth). They live in their own directory —
 * `<content-dir>/generated/` when the project declares one, else
 * `docs/generated/` — so a hand-written page and a generated one can never
 * collide, and a format change deletes the previous format's pages as orphans.
 *
 * Usage
 *   bun scripts/docs-generate.mjs [--root <dir>]            (node fallback, same argv)
 *   bun scripts/docs-generate.mjs --check [--root <dir>]    drift report, writes nothing
 *   bun scripts/docs-generate.mjs --dry-run [--root <dir>]  the plan, writes nothing
 *
 * stdout: one fixed block. `--check` exits 0 when the tree is clean, 1 when a
 * page is missing, stale or orphaned (each named `<path>: <state>`), and the
 * write mode exits 0. Usage errors and an unrecognised declared format exit 2
 * with a `DOCS GENERATE REFUSAL —` line on stderr and nothing written.
 *
 * Deterministic: every list is sorted by its own key, no timestamp, no absolute
 * path and no locale-dependent formatting enters a page, and two consecutive
 * runs are byte-identical — which is what makes `--check` a drift signal rather
 * than a coin flip.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { readRoadmapIndex, roadmapTableRows } from "../packages/agentic-workflow/src/index-document.mjs";
import { sectionText } from "./unit-doc-phases.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.dirname(SCRIPTS_DIR);
const GUIDE = "AGENTS.md";
const SITE_HEADING = "Docs site";
const GENERATOR = "scripts/docs-generate.mjs";

/** The declared `format` values, mapped onto the emitter each one selects. */
export const FORMAT_ALIASES = Object.freeze({
  markdown: "md",
  md: "md",
  mdx: "mdx",
  starlight: "mdx",
  docusaurus: "mdx",
  html: "html",
  latex: "latex",
  tex: "latex",
});

/** The file extension each emitter writes. */
export const EMITTER_EXTENSIONS = Object.freeze({ md: "md", mdx: "mdx", html: "html", latex: "tex" });

/** The pages the projection always carries, in output order. */
export const PAGES = Object.freeze(["index", "units", "code"]);

// ── discovery ────────────────────────────────────────────────────────────

/**
 * The body of one `## ` section of the guide, fenced blocks included. The
 * reader is the shared fence-aware one (`sectionText`): an inline `^## `
 * scan is the fence-blind defect class (#308 F28) the sibling pins refuse.
 */
function sectionBody(text, heading) {
  return sectionText(text, heading);
}

/** The first fenced code block inside a body, or null. */
function fencedBlock(body) {
  const match = /```[^\n]*\n([\s\S]*?)```/.exec(body ?? "");
  return match ? match[1] : null;
}

/**
 * The `Docs site` slots the project declared, or `null` when it declared none.
 * Accepts the block's own `- <slot>: <value>` lines, drops a trailing `#`
 * comment (the scaffold's `build` line carries one), and treats an empty or
 * absent `format` slot as no declaration at all.
 */
export function parseDocsSiteBlock(guideText) {
  const block = fencedBlock(sectionBody(guideText ?? "", SITE_HEADING));
  if (block === null) return null;
  const slots = {};
  for (const line of block.split("\n")) {
    const match = /^\s*[-*]\s+(format|content-dir|build|map)\s*:\s*(.*)$/.exec(line);
    if (match === null) continue;
    const value = match[2].replace(/\s+#.*$/, "").trim();
    if (value !== "") slots[match[1]] = value;
  }
  if (slots.format === undefined || slots.format === "none") return null;
  return {
    format: slots.format,
    contentDir: slots["content-dir"] ?? null,
    build: slots.build ?? null,
    map: slots.map ?? null,
  };
}

/**
 * The emitter a declaration selects.
 * @returns {{ ok: true, emitter: string, ext: string, declared: string|null, degraded: string|null }
 *          | { ok: false, reason: string }}
 */
export function resolveFormat(site) {
  if (site === null) {
    return {
      ok: true,
      emitter: "md",
      ext: "md",
      declared: null,
      degraded: "no `Docs site` block in AGENTS.md",
    };
  }
  const emitter = FORMAT_ALIASES[site.format];
  if (emitter === undefined) {
    // The scaffold ships a menu of accepted values, never a chosen one. A copy
    // whose slot still carries the menu declared nothing, so it degrades like an
    // absent block instead of refusing — refusing would blame the owner for a
    // placeholder the scaffold wrote. A single unknown value is a declaration
    // this generator cannot honor, and that refuses.
    if (site.format.includes("|")) {
      return {
        ok: true,
        emitter: "md",
        ext: "md",
        declared: null,
        degraded: `the \`Docs site\` block still carries the scaffold's format menu (\`${site.format}\`)`,
      };
    }
    const accepted = Object.keys(FORMAT_ALIASES).join(" | ");
    return { ok: false, reason: `unrecognised format '${site.format}' in ${GUIDE}; expected ${accepted}` };
  }
  return { ok: true, emitter, ext: EMITTER_EXTENSIONS[emitter], declared: site.format, degraded: null };
}

/** The projection directory, relative to the project root. */
export function projectionDir(site) {
  const contentDir = site?.contentDir ?? null;
  if (contentDir === null) return "docs/generated";
  return path.posix.join(contentDir.replace(/\/+$/, "").replace(/^\.\//, ""), "generated");
}

/**
 * The project's name: its root manifest's `name`, else the directory's own name.
 * The guide's H1 is deliberately not a source — this scaffold writes `# AGENTS.md`
 * there, a document title rather than a project name.
 */
function projectTitle(root) {
  const manifest = path.join(root, "package.json");
  if (exists(manifest)) {
    try {
      const parsed = JSON.parse(read(manifest));
      if (typeof parsed.name === "string" && parsed.name.trim() !== "") return parsed.name.trim();
    } catch {
      // a malformed manifest is not a title source, never a crash
    }
  }
  return path.basename(root);
}

// ── sources ──────────────────────────────────────────────────────────────

const read = (file) => fs.readFileSync(file, "utf8");
const exists = (file) => fs.existsSync(file);

/** `NN-slug` directories carrying a SPEC.md, in directory order. */
function unitDirs(dir) {
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => /^\d/.test(name))
    .sort()
    .map((name) => ({ id: name, spec: path.join(dir, name, "SPEC.md") }))
    .filter((entry) => exists(entry.spec));
}

/** The unit's title and one-line, read from its own doc. The one-line is the
 * `> One-line:` quote — the unit-doc grammar's only declared carrier for it. A
 * legacy doc without that quote falls back to its title rather than surfacing
 * whatever template prose sits in its first blockquote. */
function unitFacts(specText) {
  const lines = specText.split("\n");
  const title = lines.find((line) => /^# /.test(line))?.slice(2).trim() ?? "";
  const oneLine =
    lines
      .map((line) => /^> One-line:\s*(.+)$/.exec(line)?.[1]?.trim() ?? "")
      .find((value) => value !== "") ?? "";
  return { title, oneLine };
}

/** The slug a unit directory names: the part after its number. */
const slugOf = (id) => id.replace(/^\d+-/, "");

/** The roadmap's status cell per slug, for one index table. */
function statusBySlug(indexText, kind) {
  const map = new Map();
  if (indexText === null) return map;
  const rows = roadmapTableRows(indexText, kind);
  for (const cells of rows) {
    if (cells.length < 3) continue;
    const slug = (cells[1] ?? "").replace(/`/g, "").trim();
    if (slug === "" || /^-+$/.test(slug)) continue;
    if (!map.has(slug)) map.set(slug, cells[2].trim());
  }
  return map;
}

/** Every artifact the projection reads, sorted so the render is stable. */
export function collectSources(root) {
  const guideText = exists(path.join(root, GUIDE)) ? read(path.join(root, GUIDE)) : "";
  const site = parseDocsSiteBlock(guideText);
  const index = readRoadmapIndex(root);
  const indexText = index === null ? null : index.text;
  const featureStatus = statusBySlug(indexText, "feature");
  const fixStatus = statusBySlug(indexText, "fix");

  const units = [];
  for (const kind of ["feature", "fix"]) {
    const dir = path.join(root, "docs", kind === "feature" ? "features" : "fix");
    for (const entry of unitDirs(dir)) {
      const facts = unitFacts(read(entry.spec));
      const slug = slugOf(entry.id);
      units.push({
        id: entry.id,
        slug,
        kind,
        title: facts.title,
        oneLine: facts.oneLine,
        status: (kind === "feature" ? featureStatus : fixStatus).get(slug) ?? "—",
      });
    }
  }
  units.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const packages = [];
  const packagesDir = path.join(root, "packages");
  if (exists(packagesDir)) {
    for (const name of fs.readdirSync(packagesDir).sort()) {
      const manifest = path.join(packagesDir, name, "package.json");
      if (!exists(manifest)) continue;
      let parsed;
      try {
        parsed = JSON.parse(read(manifest));
      } catch {
        continue;
      }
      packages.push({
        name: parsed.name ?? name,
        version: parsed.version ?? "—",
        commands: Object.keys(parsed.bin ?? {}).sort(),
      });
    }
  }
  packages.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  const skills = [];
  const skillsDir = path.join(root, "skills");
  if (exists(skillsDir)) {
    for (const name of fs.readdirSync(skillsDir).sort()) {
      const file = path.join(skillsDir, name, "SKILL.md");
      if (!exists(file)) continue;
      skills.push({ name, description: skillDescription(read(file)) });
    }
  }

  const scripts = [];
  const scriptsRoot = path.join(root, "scripts");
  if (exists(scriptsRoot)) {
    for (const name of fs.readdirSync(scriptsRoot).sort()) {
      if (name.endsWith(".mjs") && !name.endsWith(".test.mjs")) scripts.push({ name });
    }
  }

  return {
    title: projectTitle(root),
    site,
    units,
    roadmapRows: roadmapRowCount(indexText),
    packages,
    skills,
    scripts,
  };
}

/** The one-line description of a skill, from its frontmatter. */
function skillDescription(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim() === "---");
  if (start === -1) return "";
  const end = lines.findIndex((line, index) => index > start && line.trim() === "---");
  if (end === -1) return "";
  const front = lines.slice(start + 1, end);
  const at = front.findIndex((line) => /^description\s*:/.test(line));
  if (at === -1) return "";
  const inline = front[at].replace(/^description\s*:\s*/, "").trim();
  if (inline !== "" && inline !== ">" && inline !== "|") return inline;
  const folded = [];
  for (const line of front.slice(at + 1)) {
    if (/^[A-Za-z_-]+\s*:/.test(line)) break;
    const value = line.trim();
    if (value === "") continue;
    folded.push(value);
    if (folded.length === 1) break;
  }
  return folded.join(" ");
}

/** Every live data row of the consolidated index, headers excluded. */
function roadmapRowCount(indexText) {
  if (indexText === null) return 0;
  let count = 0;
  for (const kind of ["feature", "fix"]) {
    for (const cells of roadmapTableRows(indexText, kind)) {
      if (cells.length < 3) continue;
      if (/^\d+$/.test((cells[0] ?? "").trim())) count += 1;
    }
  }
  return count;
}

// ── page model ───────────────────────────────────────────────────────────

const provenance = (model) =>
  `Generated from ${model.units.length} unit docs, ${model.roadmapRows} roadmap rows, ` +
  `${model.packages.length} packages, ${model.skills.length} skills and ${model.scripts.length} scripts ` +
  `by \`${GENERATOR}\`; edit the sources, never this page.`;

/** The three pages, as typed blocks every emitter renders the same way. */
export function buildPages(model, ext) {
  const pages = new Map();

  pages.set("index", [
    { type: "p", text: provenance(model) },
    { type: "h2", text: "What this project ships" },
    {
      type: "ul",
      items: [
        `${model.units.length} delivered unit docs (features and fixes)`,
        `${model.roadmapRows} roadmap rows`,
        `${model.packages.length} packages, ${model.skills.length} skills, ${model.scripts.length} scripts`,
      ],
    },
    { type: "h2", text: "Reference" },
    {
      type: "ul",
      items: [`Delivered units — units.${ext}`, `Code surface — code.${ext}`],
    },
  ]);

  pages.set("units", [
    { type: "p", text: provenance(model) },
    { type: "h2", text: "Delivered units" },
    {
      type: "table",
      head: ["Unit", "Kind", "Status", "What it shipped"],
      rows: model.units.map((unit) => [unit.id, unit.kind, unit.status, unit.oneLine || unit.title]),
    },
  ]);

  pages.set("code", [
    { type: "p", text: provenance(model) },
    { type: "h2", text: "Packages" },
    {
      type: "table",
      head: ["Package", "Version", "Commands"],
      rows: model.packages.map((pkg) => [pkg.name, pkg.version, pkg.commands.join(", ") || "—"]),
    },
    { type: "h2", text: "Skills" },
    {
      type: "table",
      head: ["Skill", "What it does"],
      rows: model.skills.map((skill) => [skill.name, skill.description || "—"]),
    },
    { type: "h2", text: "Scripts" },
    {
      type: "table",
      head: ["Script"],
      rows: model.scripts.map((script) => [script.name]),
    },
  ]);

  return pages;
}

// ── emitters ─────────────────────────────────────────────────────────────
//
// One model, four renderings, no second copy of the content. Every emitter is a
// pure function of the title and the block list, which is what keeps the four
// formats from drifting apart.

const mdCell = (value) => String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");

function renderMarkdown(title, blocks) {
  const out = [`# ${title}`, ""];
  for (const block of blocks) out.push(...renderMarkdownBlock(block), "");
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

function renderMarkdownBlock(block) {
  if (block.type === "p") return [block.text];
  if (block.type === "h2") return [`## ${block.text}`];
  if (block.type === "ul") return block.items.map((item) => `- ${item}`);
  if (block.type === "table") {
    if (block.rows.length === 0) return ["none"];
    return [
      `| ${block.head.map(mdCell).join(" | ")} |`,
      `|${block.head.map(() => "---").join("|")}|`,
      ...block.rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`),
    ];
  }
  throw new Error(`unknown block type ${block.type}`);
}

const htmlText = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function renderHtml(title, blocks) {
  const body = [`<h1>${htmlText(title)}</h1>`];
  for (const block of blocks) {
    if (block.type === "p") body.push(`<p>${htmlText(block.text)}</p>`);
    else if (block.type === "h2") body.push(`<h2>${htmlText(block.text)}</h2>`);
    else if (block.type === "ul") body.push(`<ul>`, ...block.items.map((item) => `<li>${htmlText(item)}</li>`), `</ul>`);
    else if (block.type === "table") {
      if (block.rows.length === 0) body.push(`<p>none</p>`);
      else {
        body.push(`<table>`, `<thead><tr>${block.head.map((cell) => `<th>${htmlText(cell)}</th>`).join("")}</tr></thead>`, `<tbody>`);
        for (const row of block.rows) body.push(`<tr>${row.map((cell) => `<td>${htmlText(cell)}</td>`).join("")}</tr>`);
        body.push(`</tbody>`, `</table>`);
      }
    } else throw new Error(`unknown block type ${block.type}`);
  }
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<title>${htmlText(title)}</title>`,
    "</head>",
    "<body>",
    "<main>",
    ...body,
    "</main>",
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

const latexText = (value) =>
  String(value)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([&%$#_{}])/g, "\\$1")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");

function renderLatex(title, blocks) {
  const out = [
    `% Generated by ${GENERATOR} from the repository's own artifacts. Do not edit.`,
    `\\section*{${latexText(title)}}`,
  ];
  for (const block of blocks) {
    if (block.type === "p") out.push(latexText(block.text), "");
    else if (block.type === "h2") out.push(`\\subsection*{${latexText(block.text)}}`);
    else if (block.type === "ul") out.push("\\begin{itemize}", ...block.items.map((item) => `\\item ${latexText(item)}`), "\\end{itemize}", "");
    else if (block.type === "table") {
      if (block.rows.length === 0) out.push("none", "");
      else {
        const columns = block.head.length;
        out.push(`\\begin{tabular}{${"l".repeat(columns)}}`);
        out.push(`${block.head.map(latexText).join(" & ")}\\\\`);
        out.push("\\hline");
        for (const row of block.rows) out.push(`${row.map(latexText).join(" & ")}\\\\`);
        out.push("\\end{tabular}", "");
      }
    } else throw new Error(`unknown block type ${block.type}`);
  }
  return `${out.join("\n").replace(/\n+$/, "")}\n`;
}

/** Render one page in the emitter the declaration selected. */
export function renderPage(emitter, title, blocks) {
  if (emitter === "md") return renderMarkdown(title, blocks);
  if (emitter === "mdx") return `---\ntitle: ${title}\n---\n\n${renderMarkdown(title, blocks)}`;
  if (emitter === "html") return renderHtml(title, blocks);
  if (emitter === "latex") return renderLatex(title, blocks);
  throw new Error(`unknown emitter ${emitter}`);
}

/** The whole projection: tree-relative path → bytes. */
export function planProjection(model, format) {
  const pages = buildPages(model, format.ext);
  const files = new Map();
  for (const page of PAGES) {
    const title = page === "index" ? model.title : `${model.title} — ${page}`;
    files.set(`${page}.${format.ext}`, renderPage(format.emitter, title, pages.get(page)));
  }
  return files;
}

// ── write / check ────────────────────────────────────────────────────────

/** The managed files currently on disk, keyed by their name in the projection dir. */
function existingPages(dir) {
  if (!exists(dir)) return new Map();
  const out = new Map();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    out.set(entry.name, read(path.join(dir, entry.name)));
  }
  return out;
}

/**
 * Bring the projection directory in line with its sources, or report the gap.
 * @returns {{ files: Map<string,string>, written: string[], unchanged: string[],
 *             deleted: string[], missing: string[], stale: string[], orphaned: string[] }}
 */
export function syncProjection(root, files, { write }) {
  const dir = path.join(root, ...files.dir.split("/"));
  const onDisk = existingPages(dir);
  const written = [];
  const unchanged = [];
  const deleted = [];
  const missing = [];
  const stale = [];

  if (write && !exists(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const [name, content] of [...files.pages].sort(([a], [b]) => (a < b ? -1 : 1))) {
    const current = onDisk.get(name);
    if (current === undefined) {
      missing.push(name);
      if (write) {
        fs.writeFileSync(path.join(dir, name), content);
        written.push(name);
      }
      continue;
    }
    if (current === content) {
      unchanged.push(name);
      continue;
    }
    stale.push(name);
    if (write) {
      fs.writeFileSync(path.join(dir, name), content);
      written.push(name);
    }
  }

  for (const name of [...onDisk.keys()].sort()) {
    if (files.pages.has(name)) continue;
    deleted.push(name);
    if (write) fs.rmSync(path.join(dir, name), { force: true });
  }

  return { written, unchanged, deleted, missing, stale, orphaned: write ? [] : [...deleted] };
}

// ── report ───────────────────────────────────────────────────────────────

const formatLine = (format) => {
  if (format.degraded !== null) return `Format: ${format.ext} — degraded (${format.degraded})`;
  if (format.declared === format.emitter) return `Format: ${format.ext} (declared)`;
  return `Format: ${format.ext} (declared: ${format.declared})`;
};

const count = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function sourcesLine(model) {
  return (
    `Sources: ${count(model.units.length, "unit", "units")} · ${count(model.roadmapRows, "roadmap row", "roadmap rows")} · ` +
    `${count(model.packages.length, "package", "packages")} · ${count(model.skills.length, "skill", "skills")} · ` +
    `${count(model.scripts.length, "script", "scripts")}`
  );
}

// ── CLI ──────────────────────────────────────────────────────────────────

const USAGE = "usage: docs-generate.mjs [--root <dir>] [--check | --dry-run]\n";

function parseArgs(argv) {
  const result = { root: REPO, mode: "generate" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined) {
        process.stderr.write(USAGE);
        process.exit(2);
      }
      result.root = path.resolve(value);
      index += 1;
    } else if (arg === "--check" || arg === "--dry-run") {
      if (result.mode !== "generate") {
        process.stderr.write(USAGE);
        process.exit(2);
      }
      result.mode = arg === "--check" ? "check" : "dry-run";
    } else {
      process.stderr.write(USAGE);
      process.exit(2);
    }
  }
  return result;
}

export function run({ root, mode }) {
  const model = collectSources(root);
  const format = resolveFormat(model.site);
  if (!format.ok) return { refusal: format.reason };
  const projection = projectionDir(model.site);
  const pages = planProjection(model, format);
  const files = { dir: projection, pages };

  if (mode === "dry-run") {
    return {
      lines: [
        `DOCS DRY-RUN — ${projection}`,
        formatLine(format),
        `Would write: ${[...pages.keys()].sort().join(", ")}`,
        "verdict: PASS",
      ],
      status: 0,
    };
  }

  const result = syncProjection(root, files, { write: mode === "generate" });
  const rel = (name) => path.posix.join(projection, name);

  if (mode === "check") {
    const issues = [
      ...result.missing.map((name) => `${rel(name)}: missing`),
      ...result.stale.map((name) => `${rel(name)}: stale`),
      ...result.orphaned.map((name) => `${rel(name)}: orphaned`),
    ].sort();
    const drift = issues.length > 0;
    return {
      lines: [
        `DOCS CHECK — ${projection}`,
        formatLine(format),
        `Files: ${count(pages.size, "checked", "checked")} · ${count(result.missing.length, "missing", "missing")} · ` +
          `${count(result.stale.length, "stale", "stale")} · ${count(result.orphaned.length, "orphaned", "orphaned")}`,
        ...issues,
        `verdict: ${drift ? "DRIFT" : "PASS"}`,
      ],
      status: drift ? 1 : 0,
    };
  }

  return {
    lines: [
      `DOCS GENERATE — ${projection}`,
      formatLine(format),
      sourcesLine(model),
      `Files: ${count(result.written.length, "written", "written")} · ${count(result.deleted.length, "deleted", "deleted")} · ` +
        `${count(result.unchanged.length, "unchanged", "unchanged")}`,
      "verdict: PASS",
    ],
    status: 0,
  };
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const result = run(args);
  if (result.refusal !== undefined) {
    process.stderr.write(`DOCS GENERATE REFUSAL — ${result.refusal}\n`);
    process.exit(2);
  }
  for (const line of result.lines) process.stdout.write(`${line}\n`);
  process.exit(result.status);
}
