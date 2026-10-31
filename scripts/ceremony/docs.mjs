#!/usr/bin/env node
/**
 * docs.mjs — ceremony `docs` module (issue #338 P0): discipline verification.
 *
 * check-commit-format, check-phase-labels, check-tasks-ticks,
 * check-docs-language, check-progress-entry, check-all. A failing check is a
 * ceremonial block: JSON with `valid: false`, exit 2 (S6).
 */

import fs from "node:fs";
import path from "node:path";
import {
  git, out, block, fail, parseFlags, resolveUnit, readSection, parseTasks,
  parseLog, walk, CONVENTIONAL_RE,
} from "./lib.mjs";

/** Lines of the unit doc's `## Tasks` section with their 1-based line numbers. */
function taskLines(specPath) {
  const md = fs.readFileSync(specPath, "utf8");
  const lines = md.split("\n");
  const start = lines.findIndex((l) => /^## Tasks\s*$/.test(l));
  if (start === -1) fail("missing-section", { section: "tasks", path: specPath });
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^#{1,2} /.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).map((l, i) => ({ line: start + i + 1, text: l }));
}

function checkPhaseLabels(specPath) {
  const invalid = taskLines(specPath)
    .filter((l) => /^- (?:\[.\] )?(?:Step \d+|S\d+\b)/.test(l.text.trim()))
    .map((l) => ({ file: specPath, line: l.line, content: l.text.trim() }));
  return { valid: invalid.length === 0, invalid };
}

function checkTasksTicks(specPath) {
  const md = fs.readFileSync(specPath, "utf8");
  const logged = new Set(parseLog(md).filter((m) => m.kind === "P").map((m) => m.n));
  const mismatched = parseTasks(md)
    .filter((t) => t.ticked !== logged.has(t.n))
    .map((t) => ({ task: `P${t.n}`, ticked: t.ticked, logged: logged.has(t.n) }));
  return { valid: mismatched.length === 0, mismatched };
}

function checkProgressEntry(specPath) {
  const md = fs.readFileSync(specPath, "utf8");
  const logged = new Set(parseLog(md).filter((m) => m.kind === "P").map((m) => m.n));
  const missing = parseTasks(md).filter((t) => !logged.has(t.n)).map((t) => `P${t.n}`);
  return { valid: missing.length === 0, missing };
}

function checkDocsLanguage(cwd) {
  const esFiles = ["docs", "skills"]
    .filter((d) => fs.existsSync(path.join(cwd, d)))
    .flatMap((d) => walk(path.join(cwd, d), cwd))
    .filter((f) => f.endsWith(".es.md"));
  return { valid: esFiles.length === 0, "es-files": esFiles };
}

function checkCommitFormat(range, cwd) {
  const rows = git(["log", "--format=%H %s", range], cwd).split("\n").filter(Boolean);
  const invalid = rows
    .map((l) => ({ sha: l.slice(0, 40), message: l.slice(41) }))
    .filter((c) => !CONVENTIONAL_RE.test(c.message))
    .map((c) => ({ ...c, reason: "not a conventional-commit subject" }));
  return { valid: invalid.length === 0, invalid };
}

export function docs(op, argv, cwd = process.cwd()) {
  switch (op) {
    case "check-commit-format": {
      const flags = parseFlags(argv, []);
      if (!flags._?.length || !flags._[0].includes("..")) fail("missing-flag", { flag: "<from>..<to>" });
      const result = checkCommitFormat(flags._[0], cwd);
      if (!result.valid) block({ check: "check-commit-format", ...result });
      out(result);
    }
    case "check-phase-labels": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      const result = checkPhaseLabels(resolveUnit(flags.slug, cwd).specPath);
      if (!result.valid) block({ check: "check-phase-labels", ...result });
      out(result);
    }
    case "check-tasks-ticks": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      const result = checkTasksTicks(resolveUnit(flags.slug, cwd).specPath);
      if (!result.valid) block({ check: "check-tasks-ticks", ...result });
      out(result);
    }
    case "check-docs-language": {
      parseFlags(argv, []);
      const result = checkDocsLanguage(cwd);
      if (!result.valid) block({ check: "check-docs-language", ...result });
      out(result);
    }
    case "check-progress-entry": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      const result = checkProgressEntry(resolveUnit(flags.slug, cwd).specPath);
      if (!result.valid) block({ check: "check-progress-entry", ...result });
      out(result);
    }
    case "check-all": {
      const flags = parseFlags(argv, ["slug", "from"], ["slug"]);
      const unit = resolveUnit(flags.slug, cwd);
      const from = flags.from ?? "main";
      const commitFormat = checkCommitFormat(`${from}..HEAD`, cwd);
      const phaseLabels = checkPhaseLabels(unit.specPath);
      const tasksTicks = checkTasksTicks(unit.specPath);
      const docsLanguage = checkDocsLanguage(cwd);
      const progress = checkProgressEntry(unit.specPath);
      const results = { "commit-format": commitFormat, "phase-labels": phaseLabels, "tasks-ticks": tasksTicks, "docs-language": docsLanguage, progress };
      const overall = Object.values(results).every((r) => r.valid) ? "PASS" : "FAIL";
      if (overall === "FAIL") block({ check: "check-all", ...results, overall });
      out({ ...results, overall });
    }
    default:
      fail("unknown-subcommand", { object: "docs", subcommand: op });
  }
}
