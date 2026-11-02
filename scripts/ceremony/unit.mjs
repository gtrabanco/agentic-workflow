#!/usr/bin/env node
/**
 * unit.mjs — ceremony `unit` module (issue #338 P0): CRUD of units.
 *
 * A unit is `docs/fix/<slug>` or `docs/features/<slug>` with a SPEC.md copied
 * from the repo's own template. triage/route delegate to the repo's existing
 * `unit-route.mjs` (PE-001: one router, no second derivation of the routes).
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  gitOrFail, out, fail, block, onlyFlags, parseFlags, resolveUnit, listUnits, replaceSection,
  deleteSection, readSection, splitSections, parseFindings, parseLog, parseTasks, today,
} from "./lib.mjs";
import {
  FIX_INDEX_DOCUMENT,
  ROADMAP_FEATURES_HEADING,
  ROADMAP_FIXES_HEADING,
  readRoadmapIndex,
  roadmapSection,
} from "../../packages/agentic-workflow/src/index-document.mjs";

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TEMPLATES = { fix: "docs/fix/_TEMPLATE/SPEC.md", feature: "docs/features/_TEMPLATE/SPEC.md" };
const UNIT_ROUTE = fileURLToPath(new URL("../unit-route.mjs", import.meta.url));

/** The first token of a status cell (`done · [#12](…)` → `done`, `` `planned` `` → `planned`). */
function statusToken(cell) {
  const token = cell.replace(/`/g, "").split(" · ")[0].trim();
  return token === "" ? "unregistered" : token;
}

/**
 * Unit slug → status, from the one index that owns both tables (issue #319):
 * its `## Fixes` table and its `## Features` table. A pre-319 tree keeps them in
 * two files, and the alias reads whichever layout the repository has.
 */
function statusIndex(cwd) {
  const statuses = new Map();
  let index;
  try {
    index = readRoadmapIndex(cwd);
  } catch (error) {
    // Exit 2 is the ceremony's "blocked, fix the workspace" class: the index
    // moved, so no unit status can be derived and nothing is guessed.
    block({ error: "roadmap-moved", detail: error.message });
  }
  const features = index === null ? "" : roadmapSection(index.text, ROADMAP_FEATURES_HEADING) ?? index.text;
  for (const line of features.split("\n")) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*`?([^`|]+?)`?\s*\|\s*([^|]+?)\s*\|/);
    if (m) statuses.set(`${m[1].padStart(2, "0")}-${m[2].trim()}`, statusToken(m[3]));
  }
  const fixes = index === null ? null : roadmapSection(index.text, ROADMAP_FIXES_HEADING);
  const fixLines = fixes !== null
    ? fixes.split("\n")
    : (() => {
        try {
          return fs.readFileSync(path.join(cwd, FIX_INDEX_DOCUMENT), "utf8").split("\n");
        } catch {
          return [];
        }
      })();
  for (const line of fixLines) {
    const m = line.match(/^\| \[#(\d+)\]\([^)]*\) \| ([^|]+) \| ([^|]+) \|/);
    if (m) statuses.set(`${m[1]}-${m[2].trim()}`, statusToken(m[3]));
  }
  return statuses;
}

function runUnitRoute(args, cwd) {
  let stdout = "";
  let code = 0;
  try {
    stdout = execFileSync("node", [UNIT_ROUTE, ...args], { cwd, encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: cwd } });
  } catch (err) {
    code = err.status ?? 1;
    stdout = (err.stdout ?? "") + (err.stderr ?? "");
  }
  let json = null;
  try { json = JSON.parse(stdout); } catch { /* text output → wrapped below */ }
  return { code, json, stdout };
}

export function unit(op, argv, cwd = process.cwd()) {
  switch (op) {
    case "create": {
      const flags = parseFlags(argv, ["slug", "type", "issue", "template"], ["slug", "type"]);
      if (!SLUG_RE.test(flags.slug)) fail("invalid-slug", { slug: flags.slug, expected: "kebab-case" });
      if (!TEMPLATES[flags.type]) fail("invalid-type", { type: flags.type, allowed: Object.keys(TEMPLATES) });
      const relative = flags.template ?? TEMPLATES[flags.type];
      const template = path.join(cwd, relative);
      if (!fs.existsSync(template)) fail("missing-template", { path: relative });
      const dir = path.join(cwd, flags.type === "fix" ? "docs/fix" : "docs/features", flags.slug);
      if (fs.existsSync(dir)) fail("unit-exists", { slug: flags.slug, path: dir });
      fs.mkdirSync(dir, { recursive: true });
      let md = fs.readFileSync(template, "utf8");
      md = md.replace(/^# fix\/<issue-number>-<topic>/m, `# ${flags.type}/${flags.slug}`);
      if (flags.issue) md = md.replace(/`#<n>`/, `\`#${flags.issue}\``);
      const specPath = path.join(dir, "SPEC.md");
      fs.writeFileSync(specPath, md);
      out({ created: true, slug: flags.slug, type: flags.type, template: relative, path: flags.type === "fix" ? `docs/fix/${flags.slug}` : `docs/features/${flags.slug}`, sha: gitOrFail(["hash-object", specPath], cwd) });
    }
    case "read": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const u = resolveUnit(flags.slug, cwd);
      const md = fs.readFileSync(u.specPath, "utf8");
      out({
        slug: flags.slug,
        type: u.type,
        path: u.specPath.slice(cwd.length + 1),
        sha: gitOrFail(["hash-object", u.specPath], cwd),
        sections: splitSections(md).sections.filter((s) => s.level <= 2).map((s) => s.heading),
        counts: { findings: parseFindings(md).length, tasks: parseTasks(md).length, log: parseLog(md).length },
        raw: md,
      });
    }
    case "update": {
      const flags = parseFlags(argv, ["slug", "section", "content"], ["slug", "content"]);
      onlyFlags(flags, ["section", "content"]);
      const section = flags.section ?? "full";
      const u = resolveUnit(flags.slug, cwd);
      const md = fs.readFileSync(u.specPath, "utf8");
      const next = section === "full" ? flags.content : replaceSection(md, section, flags.content);
      fs.writeFileSync(u.specPath, next);
      out({ updated: true, slug: flags.slug, section, sha: gitOrFail(["hash-object", u.specPath], cwd) });
    }
    case "delete-section": {
      const flags = parseFlags(argv, ["slug", "section"], ["slug", "section"]);
      const u = resolveUnit(flags.slug, cwd);
      fs.writeFileSync(u.specPath, deleteSection(fs.readFileSync(u.specPath, "utf8"), flags.section));
      out({ deleted: true, slug: flags.slug, section: flags.section, sha: gitOrFail(["hash-object", u.specPath], cwd) });
    }
    case "delete": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const u = resolveUnit(flags.slug, cwd);
      fs.rmSync(u.dir, { recursive: true, force: true });
      out({ deleted: true, slug: flags.slug, path: u.dir.slice(cwd.length + 1) });
    }
    case "list": {
      const listFlags = parseFlags(argv, []);
      onlyFlags(listFlags, []);
      const statuses = statusIndex(cwd);
      const units = listUnits(cwd).map((u) => ({ ...u, status: statuses.get(u.slug) ?? "unregistered" }));
      out({ units });
    }
    case "triage": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      resolveUnit(flags.slug, cwd);
      const r = runUnitRoute(["--triage", flags.slug, "--json"], cwd);
      if (r.json) {
        if (r.code === 0) out(r.json);
        if (r.code === 2) block({ check: "unit-triage", ...r.json });
        fail("triage-failed", { slug: flags.slug, ...r.json });
      }
      if (r.code === 2) block({ check: "unit-triage", output: r.stdout });
      fail("triage-failed", { slug: flags.slug, output: r.stdout.slice(0, 400) });
    }
    case "route": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      resolveUnit(flags.slug, cwd);
      // Route mode of unit-route.mjs takes one positional argument and has no
      // `--json` (PE-001, corrected): only `--triage <unit> [--json]` accepts
      // the flag. The issue defines route as "same as triage but read-only",
      // and triage mode is read-only — so route delegates to the same closed
      // catalog call as `unit triage` and inherits its JSON + exit codes.
      const r = runUnitRoute(["--triage", flags.slug, "--json"], cwd);
      if (r.json && r.code === 0) out(r.json);
      if (r.code === 2) block({ check: "unit-route", output: r.stdout });
      fail("route-failed", { slug: flags.slug, code: r.code, output: r.stdout.slice(0, 400) });
    }
    case "select-next": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const u = resolveUnit(flags.slug, cwd);
      const md = fs.readFileSync(u.specPath, "utf8");
      const logged = new Set(parseLog(md).filter((m) => m.kind === "P").map((m) => m.n));
      const next = parseTasks(md).find((t) => !logged.has(t.n));
      out({ slug: flags.slug, "next-step": next ? `P${next.n}` : null });
    }
    case "descope": {
      const flags = parseFlags(argv, ["slug", "criterion", "approved-by"], ["slug", "criterion", "approved-by"]);
      onlyFlags(flags, ["criterion", "approved-by"]);
      const u = resolveUnit(flags.slug, cwd);
      const md = fs.readFileSync(u.specPath, "utf8");
      const body = readSection(md, "acceptance");
      if (body == null) fail("missing-section", { section: "acceptance" });
      const line = `- **AC-S${flags.criterion} descope** — approved-by ${flags["approved-by"]} · ${today()} · descope-recorded`;
      fs.writeFileSync(u.specPath, replaceSection(md, "acceptance", `${body.replace(/\s+$/, "")}\n${line}`));
      out({ "descope-recorded": true, slug: flags.slug, criterion: `AC-S${flags.criterion}`, "approved-by": flags["approved-by"] });
    }
    default:
      fail("unknown-subcommand", { object: "unit", subcommand: op });
  }
}
