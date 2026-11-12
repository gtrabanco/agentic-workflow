#!/usr/bin/env node
/**
 * lib.mjs — shared machinery for the closed ceremony CLI (fix #338).
 *
 * Dependency-free, deterministic, node: imports only. Every ceremony
 * operation resolves its repo relative to process.cwd().
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import process from "node:process";
import { openFence, closesFence } from "./unit-doc-phases.mjs";

/** Run git in the repo (cwd), args array → trimmed stdout. Throws on failure (stderr captured, never echoed). */
export function git(args, cwd = process.cwd()) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Quiet git — stdout suppressed (for writes like hash-object -w). */
export function gitQuiet(args, cwd = process.cwd()) {
  return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

/** Run git; a git failure is a JSON usage error, never a stack trace (S6: stdout is always JSON). */
export function gitOrFail(args, cwd = process.cwd(), code = "git-error") {
  try {
    return git(args, cwd);
  } catch (err) {
    const text = String(err.stderr ?? err.message ?? "").trim().split("\n").filter(Boolean);
    fail(code, { args: args.join(" "), detail: text[0] ?? "git command failed" });
  }
}

/** JSON success → stdout, exit 0. */
export function out(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + "\n");
  process.exit(0);
}

/** Usage error (bad flags, unknown op, missing slug) → JSON on stdout, exit 1 (S6: output is always JSON on stdout). */
export function fail(error, extra = {}) {
  process.stdout.write(JSON.stringify({ error, ...extra }, null, 2) + "\n");
  process.exit(1);
}

/**
 * Read a repo-relative path under `root`, or `null` when it is absent or escapes
 * the root — a repository fact never leaves the project. Two ceremony modules
 * share it (`tier` and `passive`), so it lives here rather than twice.
 */
export function readRepoFile(root, rel) {
  const abs = path.resolve(root, rel);
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!abs.startsWith(prefix)) return null;
  try {
    return fs.readFileSync(abs, "utf8");
  } catch {
    return null;
  }
}

/** Ceremonial block (a discipline check failed) → JSON, exit 2. */
export function block(obj) {
  process.stdout.write(JSON.stringify({ blocked: true, ...obj }, null, 2) + "\n");
  process.exit(2);
}

/** Parse argv: positionals → {_: [...]}; `--k v` → {k: "v"}; `--k` alone → true. Unknown flags → usage error. */
export function parseFlags(argv, allowed, required = []) {
  const flags = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) {
      flags._.push(a);
      continue;
    }
    const key = a.slice(2);
    if (!allowed.includes(key)) fail("unknown-flag", { flag: `--${key}`, allowed });
    if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      flags[key] = argv[++i];
    } else {
      flags[key] = true;
    }
  }
  for (const r of required) {
    if (!(r in flags)) fail("missing-flag", { flag: `--${r}` });
  }
  return flags;
}

/** Reject flags the calling operation does not use (S6/S8: an option is either honoured or an error, never silently swallowed). */
export function onlyFlags(flags, allowed) {
  const extra = Object.keys(flags).filter((k) => k !== "_" && k !== "slug" && !allowed.includes(k));
  if (extra.length) fail("unknown-flag", { flag: `--${extra[0]}`, allowed: ["slug", ...allowed] });
}

/** Known P1/P2 modules — outside the closed set until their follow-up PRs (issue #338 priority). */
export const DEFERRED_MODULES = [
  "review", "acceptance", "refutation", "fusion", "delta",
  "pr", "progress", "evidence", "commit", "roadmap",
];

const UNIT_ROOTS = [
  { root: "docs/fix", type: "fix" },
  { root: "docs/features", type: "feature" },
];

/** Resolve a slug → {dir, type, root, path}. Usage error when missing. */
export function resolveUnit(slug, cwd = process.cwd()) {
  for (const { root, type } of UNIT_ROOTS) {
    const dir = path.join(cwd, root, slug);
    if (fs.existsSync(path.join(dir, "SPEC.md"))) return { dir, type, root, specPath: path.join(dir, "SPEC.md") };
  }
  fail("unknown-slug", { slug, searched: UNIT_ROOTS.map((u) => `${u.root}/<slug>/SPEC.md`) });
}

/** Every unit dir (docs/fix + docs/features, minus _TEMPLATE) → [{nn, slug, type}]. */
export function listUnits(cwd = process.cwd()) {
  const units = [];
  for (const { root, type } of UNIT_ROOTS) {
    const abs = path.join(cwd, root);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      if (name === "_TEMPLATE" || name === "README.md" || name === "ROADMAP.md" || !name.match(/^\d/)) continue;
      if (!fs.statSync(path.join(abs, name)).isDirectory()) continue;
      units.push({ nn: Number(name.match(/^(\d+)/)?.[1] ?? "0"), slug: name, type });
    }
  }
  return units;
}

/** Split markdown into {preamble, sections:[{heading, level, bodyStart, end}]} by ATX headings — fence-aware (a heading inside a ```/~~~ fence, including a longer outer fence around nested shorter ones, is quoted text, never a bound). */
export function splitSections(md) {
  const lines = md.split("\n");
  const sections = [];
  let current = null;
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    const m = lines[i].match(/^(#{1,6}) (.+?)\s*$/);
    if (m) {
      if (current) current.end = i;
      current = { heading: m[2], level: m[1].length, bodyStart: i + 1, end: lines.length };
      sections.push(current);
    }
  }
  return { lines, sections };
}

const SECTION_TOKENS = {
  "issue": ["Issue"],
  "spec": ["Specs"], "specs": ["Specs"],
  "impact": ["Impact"],
  "retirements": ["Retirements"],
  "non-goals": ["Non-goals"],
  "future": ["Future"],
  "future-cost": ["Future cost"],
  "tasks": ["Tasks"],
  "findings": ["Findings"],
  "acceptance": ["Acceptance criteria"],
  "log": ["Log"],
  "next": ["Next"],
  "references": ["References"],
  "branch": ["Branch"],
  "depends-on": ["Depends on"],
  "regression-scope": ["Regression scope"],
  "evidence": ["Evidence"],
  "progress": ["Progress", "Log"],
};

/** End index of one section's body: the next heading of level ≤ `stopLevel`, fence-aware. */
function sectionEnd(lines, sec, stopLevel) {
  let fence = null;
  for (let i = sec.bodyStart; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) { fence = opened; continue; }
    const m = lines[i].match(/^(#{1,6}) /);
    if (m && m[1].length <= stopLevel) return i;
  }
  return sec.end;
}

/** Remove one section entirely — its heading, body and deeper `###` embeds — keeping every other byte. */
export function deleteSection(md, token) {
  const headings = SECTION_TOKENS[token];
  if (!headings) fail("unknown-section", { section: token, allowed: Object.keys(SECTION_TOKENS).concat("full") });
  const { lines, sections } = splitSections(md);
  const sec = sections.find((s) => headings.includes(s.heading) && s.level <= 3);
  if (!sec) fail("missing-section", { section: token, headings });
  const end = sectionEnd(lines, sec, sec.level);
  const head = lines.slice(0, sec.bodyStart - 1);
  const tail = lines.slice(end);
  while (head.length && head[head.length - 1].trim() === "") head.pop();
  while (tail.length && tail[0].trim() === "") tail.shift();
  return [...head, ...(tail.length ? [""] : []), ...tail].join("\n").replace(/\s+$/, "\n");
}

/** Replace one `## <heading>` section's body (content up to the next heading of level ≤ its own; `## Tasks` also ends at its `###` ledger embeds). */
export function replaceSection(md, token, newBody) {
  const headings = SECTION_TOKENS[token];
  if (!headings) fail("unknown-section", { section: token, allowed: Object.keys(SECTION_TOKENS).concat("full") });
  const { lines, sections } = splitSections(md);
  const sec = sections.find((s) => headings.includes(s.heading) && s.level <= 3);
  if (!sec) fail("missing-section", { section: token, headings });
  const stopLevel = sec.heading === "Tasks" ? sec.level + 1 : sec.level;
  const end = sectionEnd(lines, sec, stopLevel);
  const body = newBody.replace(/\s+$/, "");
  const replacement = [...lines.slice(0, sec.bodyStart), "", body, ""];
  return [...replacement, ...lines.slice(end)].join("\n").replace(/\n{4,}/g, "\n\n\n");
}

/** Read one section's body (same rule as replaceSection) or null. */
export function readSection(md, token) {
  const headings = SECTION_TOKENS[token];
  if (!headings) return null;
  const { lines, sections } = splitSections(md);
  const sec = sections.find((s) => headings.includes(s.heading) && s.level <= 3);
  if (!sec) return null;
  const stopLevel = sec.heading === "Tasks" ? sec.level + 1 : sec.level;
  const end = sectionEnd(lines, sec, stopLevel);
  return lines.slice(sec.bodyStart, end).join("\n").replace(/^\n+|\s+$/g, "");
}

/** Parse the `## Findings` seven-column table (findings-table@1) → [{id,target,axis,severity,impact,class,route}]. */
export function parseFindings(md) {
  const body = readSection(md, "findings");
  if (body == null) return [];
  return body.split("\n")
    .filter((l) => /^\| F\d+/.test(l.trim()))
    .map((l) => {
      const c = l.split("|").map((s) => s.trim());
      return { id: c[1], target: c[2], axis: c[3], severity: c[4], impact: c[5], class: c[6], route: c[7] };
    });
}

/** Render the findings table with the given rows (header + separator preserved). */
export function renderFindings(rows) {
  const head = "| id | S# / file:line | axis | severity | impact | class | route |\n|---|---|---|---|---|---|---|";
  const body = rows.map((r) => `| ${r.id} | ${r.target} | ${r.axis} | ${r.severity} | ${r.impact} | ${r.class} | ${r.route} |`).join("\n");
  return rows.length ? `${head}\n${body}` : head;
}

const LOG_KINDS = ["L", "E", "G", "F", "D", "P", "R", "V"];

/** Parse `## Log` lines → [{kind, n, date, body, text}] (log-kind@1: `- **R3** — 2026-…, text`). */
export function parseLog(md) {
  const body = readSection(md, "log") ?? "";
  const marks = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^- \*\*([A-Z])(\d+)([a-z]?)\*\* — (.*)$/);
    if (!m || !LOG_KINDS.includes(m[1])) continue;
    const dated = m[4].match(/^(\d{4}-\d{2}-\d{2}),?\s+([\s\S]*)$/);
    marks.push({
      kind: m[1],
      n: Number(m[2]),
      text: m[4],
      date: dated ? dated[1] : null,
      body: dated ? dated[2] : m[4],
    });
  }
  return marks;
}

/** Append a log line `- **<kind><next>** — <YYYY-MM-DD>, <text>` to `## Log`. Returns the new markdown. */
export function appendLogLine(md, kind, text, today) {
  const marks = parseLog(md);
  const next = marks.filter((m) => m.kind === kind).reduce((a, m) => Math.max(a, m.n), 0) + 1;
  const body = readSection(md, "log");
  if (body == null) fail("missing-section", { section: "log" });
  const line = `- **${kind}${next}** — ${today}, ${text}`;
  return replaceSection(md, "log", `${body.replace(/\s+$/, "")}\n${line}`);
}

/** Parse `## Tasks` bullets → [{n, ticked, label, spec?, files?}] (unit-doc grammar: `- [x] P<n> — label` plus its indented `(Implements: …)` / `Relevant files: …` lines). */
export function parseTasks(md) {
  const body = readSection(md, "tasks") ?? "";
  const tasks = [];
  let current = null;
  for (const line of body.split("\n")) {
    const m = line.match(/^- (?:\[([ xX])\] )?P(\d+) — /);
    if (m) {
      current = { n: Number(m[2]), ticked: Boolean(m[1] && m[1] !== " "), label: line.replace(/^- (?:\[.\] )?P\d+ — /, "") };
      tasks.push(current);
      continue;
    }
    if (!current) continue;
    const spec = line.match(/^ {2}\(Implements: (.+)\)\s*$/);
    const files = line.match(/^ {2}Relevant files: (.+?)\s*$/);
    if (spec) current.spec = spec[1];
    else if (files) current.files = files[1];
  }
  return tasks;
}

/** Flip the tick state of task P<n> in the Tasks section. Returns new markdown or null when missing. */
export function setTaskTick(md, n, ticked) {
  const { lines } = splitSections(md);
  let changed = false;
  const out2 = lines.map((l) => {
    const m = l.match(/^- (?:\[([ xX])\] )?(P\d+ — )/);
    if (m && Number(m[2].match(/\d+/)[0]) === n) {
      changed = true;
      return ticked ? `- [x] ${m[2]}${l.replace(/^- (?:\[.\] )?P\d+ — /, "")}` : `- ${m[2]}${l.replace(/^- (?:\[.\] )?P\d+ — /, "")}`;
    }
    return l;
  });
  return changed ? out2.join("\n") : null;
}

/** Workspace cleanliness → {clean, dirty-files}. */
export function cleanCheck(cwd = process.cwd()) {
  const raw = gitOrFail(["status", "--porcelain=v1"], cwd);
  const dirty = raw.split("\n").filter(Boolean).map((l) => ({ index: l[0], working: l[1], file: l.slice(3) }));
  return { clean: dirty.length === 0, "dirty-files": dirty.map((d) => d.file) };
}

/** Conventional-commit subject regex (the repo's own commit format rule). */
export const CONVENTIONAL_RE = /^(feat|fix|docs|chore|refactor|test|build|ci|perf|style|revert)(\([a-z0-9-]+\))?!?: .+/;

/** Deterministic recursive file walk (sorted; .git/node_modules skipped). */
export function walk(dir, cwd = process.cwd(), acc = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    if (name === ".git" || name === "node_modules") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, cwd, acc);
    else acc.push(path.relative(cwd, p).split(path.sep).join("/"));
  }
  return acc;
}

/** Tiny glob → regex (supports **, *, ?). */
export function globToRe(glob) {
  const src = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${src}$`);
}

/** Today as YYYY-MM-DD (only write ops consume it; read ops stay timestamp-free). */
export function today() {
  return new Date().toISOString().slice(0, 10);
}
