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
import { sectionText } from "../unit-doc-phases.mjs";
import {
  git, out, block, fail, parseFlags, resolveUnit, parseTasks,
  parseLog,
  readSection, walk, CONVENTIONAL_RE,
} from "./lib.mjs";

/** Lines of the unit doc's `## Tasks` section with their 1-based line numbers.
 *  The section boundary comes from the shared fence-aware reader
 *  (scripts/unit-doc-phases.mjs — the structural-sibling pin A owns this rule). */
function taskLines(specPath, displayPath) {
  const md = fs.readFileSync(specPath, "utf8");
  const body = sectionText(md, "Tasks");
  if (body == null) fail("missing-section", { section: "tasks", path: displayPath });
  const startLine = md.slice(0, md.indexOf(body)).split("\n").length;
  return body.split("\n").map((text, i) => ({ line: startLine + i, text }));
}

/** The legacy-carrier answer (#398 S6): a doc with no `## Tasks` has nothing
 *  for a Tasks-keyed check to judge, and a silent `valid: true` would claim a
 *  judgement nobody made. `n/a: <reason>` is the repository's passing row. */
const NO_TASKS = "no ## Tasks section — legacy carrier";

/** The n/a envelope, or null when the doc carries a `## Tasks` section. */
function noTasksAnswer(md) {
  return readSection(md, "tasks") === null ? { "n/a": NO_TASKS } : null;
}

function checkPhaseLabels(specPath, displayPath) {
  const na = noTasksAnswer(fs.readFileSync(specPath, "utf8"));
  if (na !== null) return na;
  const invalid = taskLines(specPath, displayPath)
    .filter((l) => /^- (?:\[.\] )?(?:Step \d+|S\d+\b)/.test(l.text.trim()))
    .map((l) => ({ file: displayPath, line: l.line, content: l.text.trim() }));
  return { valid: invalid.length === 0, invalid };
}

/** The unit slug this branch works on (`fix/<n>-<slug>`, `feat/…`, `feature/…`), for the no-argument form of `check-all`. */
function branchSlug(cwd) {
  let branch = "";
  try {
    branch = git(["rev-parse", "--abbrev-ref", "HEAD"], cwd);
  } catch {
    fail("missing-flag", { flag: "--slug", note: "not a git checkout — name the unit explicitly" });
  }
  const match = branch.match(/^(?:fix|feat|feature)\/(.+)$/);
  if (!match) fail("missing-flag", { flag: "--slug", branch, note: "this branch names no unit — pass --slug" });
  return match[1];
}
function checkTasksTicks(specPath) {
  const md = fs.readFileSync(specPath, "utf8");
  const na = noTasksAnswer(md);
  if (na !== null) return na;
  const logged = new Set(parseLog(md).filter((m) => m.kind === "P").map((m) => m.n));
  const mismatched = parseTasks(md)
    .filter((t) => t.ticked !== logged.has(t.n))
    .map((t) => ({ task: `P${t.n}`, ticked: t.ticked, logged: logged.has(t.n) }));
  return { valid: mismatched.length === 0, mismatched };
}

function checkProgressEntry(specPath) {
  const md = fs.readFileSync(specPath, "utf8");
  const na = noTasksAnswer(md);
  if (na !== null) return na;
  const logged = new Set(parseLog(md).filter((m) => m.kind === "P").map((m) => m.n));
  const missing = parseTasks(md).filter((t) => !logged.has(t.n)).map((t) => `P${t.n}`);
  return { valid: missing.length === 0, missing };
}

export function checkDocsLanguage(cwd) {
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
      const unit = resolveUnit(flags.slug, cwd);
      const result = checkPhaseLabels(unit.specPath, path.relative(cwd, unit.specPath));
      if (result.valid === false) block({ check: "check-phase-labels", ...result });
      out(result);
    }
    case "check-tasks-ticks": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      const result = checkTasksTicks(resolveUnit(flags.slug, cwd).specPath);
      if (result.valid === false) block({ check: "check-tasks-ticks", ...result });
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
      if (result.valid === false) block({ check: "check-progress-entry", ...result });
      out(result);
    }
    case "check-all": {
      const flags = parseFlags(argv, ["slug", "from"]);
      const unit = resolveUnit(flags.slug ?? branchSlug(cwd), cwd);
      const displayPath = path.relative(cwd, unit.specPath);
      const from = flags.from ?? "main";
      const commitFormat = checkCommitFormat(`${from}..HEAD`, cwd);
      const phaseLabels = checkPhaseLabels(unit.specPath, displayPath);
      const tasksTicks = checkTasksTicks(unit.specPath);
      const docsLanguage = checkDocsLanguage(cwd);
      const progress = checkProgressEntry(unit.specPath);
      const results = { "commit-format": commitFormat, "phase-labels": phaseLabels, "tasks-ticks": tasksTicks, "docs-language": docsLanguage, progress };
      // #398 S6/D1: an `n/a: <reason>` row is a passing row (skills/audit-pr
      // §closure gates), so a legacy unit's aggregate tells the same story as
      // its own sub-checks instead of erroring `missing-section`.
      const passes = (r) => r.valid === true || typeof r["n/a"] === "string";
      const overall = Object.values(results).every(passes) ? "PASS" : "FAIL";
      if (overall === "FAIL") block({ check: "check-all", ...results, overall });
      out({ ...results, overall });
    }
    default:
      fail("unknown-subcommand", { object: "docs", subcommand: op });
  }
}
