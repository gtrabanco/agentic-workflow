#!/usr/bin/env node
/**
 * relevant-files.mjs — issue #269 (remaining P2): the mechanical backstop of
 * the unit doc's per-phase `Relevant files:` read sets (format owner:
 * `skills/phase-contract/SKILL.md`, which also owns the never-authority rule).
 *
 *   relevant-files.mjs <unit-doc> --phase P<k>|all    print the read set
 *   relevant-files.mjs <unit-doc> [--changed a,b | --base <ref>]
 *                                                     run the discipline
 *
 * `--phase` mode prints one path per line (the union for `all`) — the
 * consumption contract execute-phase and review-change read. Default mode
 * checks the changed set against the union of lists plus the unit doc's
 * citations outside `## Tasks`: a listed or logged file passes, a
 * changed-and-unlogged file exits 1 naming it. An unlisted file is never out
 * of scope — only unlogged. A unit doc with no list at all answers
 * `read-set: absent` and passes (the executor's prose owns the fallback).
 *
 * Exit codes: 0 pass / refusal-free, 1 discipline fail (or malformed read
 * set), 2 usage and argument refusals.
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { parseUnitDocPhases, locateTasksSection } from "../packages/agentic-workflow/src/runner/unit-doc-phases.mjs";

const usage = `usage: relevant-files.mjs <unit-doc> [--phase P<k>|all] | [--changed <path,path…> | --base <ref>]`;

function refuse(reason) {
  process.stderr.write(`RELEVANT FILES REFUSAL — ${reason}\n${usage}\n`);
  process.exit(2);
}

/** Split a phase's joined `relevantFiles` cell into entries (comma-separated;
 * wrapped continuation lines are already merged by the phase parser). */
function entries(cell) {
  return cell.split(",").map((entry) => entry.trim()).filter((entry) => entry !== "");
}

function normalize(target) {
  return target.split("\\").join("/").replace(/^\.\//u, "");
}

/** Minimal glob → RegExp: a double-star at segment start spans directories,
 * a bare double-star spans everything, a single star stays within one
 * segment; every other character is literal. */
function globToRegExp(glob) {
  let source = "";
  for (let i = 0; i < glob.length; i += 1) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        if (glob[i + 2] === "/") {
          source += "(?:.*/)?";
          i += 2;
        } else {
          source += ".*";
          i += 1;
        }
      } else {
        source += "[^/]*";
      }
    } else {
      source += "\\^$.|?*+()[]{}".includes(ch) ? "\\" + ch : ch;
    }
  }
  return new RegExp(`^${source}$`, "u");
}

function main() {
  const args = process.argv.slice(2);
  const doc = args[0];
  if (!doc || doc.startsWith("--")) refuse("the unit document path is required");
  let text;
  try {
    text = readFileSync(doc, "utf8");
  } catch {
    refuse(`the unit document is unreadable: ${doc}`);
  }
  const docAliases = new Set([normalize(doc)]);
  const parsed = parseUnitDocPhases(text);
  const withLists = parsed.phases.filter((phase) => typeof phase.relevantFiles === "string");

  // Malformed read sets report fail-closed (they are never silently dropped).
  for (const phase of withLists) {
    const split = (phase.relevantFiles ?? "").split(",").map((entry) => entry.trim());
    if (split.some((entry) => entry === "")) {
      if (args.includes("--phase")) {
        process.stderr.write(`RELEVANT FILES REFUSAL — phase P${phase.number} carries an empty Relevant files entry\n`);
        process.exit(2);
      }
      console.log(`RELEVANT FILES fail — malformed read set: phase P${phase.number} carries an empty Relevant files entry`);
      process.exit(1);
    }
  }

  const phaseArg = flagValue(args, "--phase");
  if (phaseArg !== undefined) return readSetMode(parsed, phaseArg);
  return disciplineMode(parsed, args, text, docAliases);
}

function flagValue(args, flag) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function readSetMode(parsed, phaseArg) {
  const union = phaseArg === "all";
  if (!union && !/^P\d+$/u.test(phaseArg)) refuse(`--phase expects P<k> or all, got "${phaseArg}"`);
  const selected = union ? parsed.phases : parsed.phases.filter((phase) => `P${phase.number}` === phaseArg);
  if (!union && selected.length === 0) {
    process.stderr.write(`RELEVANT FILES REFUSAL — unknown phase ${phaseArg}\n`);
    process.exit(2);
  }
  const seen = new Set();
  const lines = [];
  for (const phase of selected) {
    if (typeof phase.relevantFiles !== "string") continue;
    for (const entry of entries(phase.relevantFiles)) {
      const key = normalize(entry);
      if (seen.has(key)) continue;
      seen.add(key);
      lines.push(key);
    }
  }
  process.stdout.write(lines.length === 0 ? "" : `${lines.join("\n")}\n`);
}

function disciplineMode(parsed, args, text, docAliases) {
  const changed = changedFiles(args);
  // The Tasks section is located by the shared fence-aware reader (pin A): its
  // body is the only place Relevant files may live, so the citations that count
  // as "logged" are read from everything outside that body.
  const tasks = locateTasksSection(text);
  const outsideTasks = tasks ? text.slice(0, tasks.start) + text.slice(tasks.end) : text;
  const lists = parsed.phases
    .filter((phase) => typeof phase.relevantFiles === "string")
    .map((phase) => ({ number: phase.number, list: entries(phase.relevantFiles) }));

  if (lists.length === 0) {
    console.log(`RELEVANT FILES pass — read-set: absent · covered 0, logged 0, unlogged 0 (${changed.length} changed)`);
    return;
  }

  const covered = [];
  const logged = [];
  const unlogged = [];
  for (const file of changed) {
    const key = normalize(file);
    if (docAliases.has(key)) continue; // the unit doc is write surface, never a code target
    const hit = lists.some(({ list }) => list.some((glob) => globToRegExp(glob).test(key)));
    if (hit) {
      covered.push(key);
    } else if (outsideTasks.includes(key)) {
      logged.push(key);
    } else {
      unlogged.push(key);
    }
  }

  if (unlogged.length > 0) {
    console.log(`RELEVANT FILES fail — ${unlogged.length} unlogged-changed (list the file in a phase's Relevant files, or log the discovery in the unit doc's Progress/Log):`);
    for (const file of unlogged) console.log(`- ${file}`);
    process.exit(1);
  }
  console.log(`RELEVANT FILES pass — covered ${covered.length}, logged ${logged.length}, unlogged 0 (${changed.length} changed)`);
}

function changedFiles(args) {
  const changed = flagValue(args, "--changed");
  if (changed !== undefined) {
    return changed.split(",").map((entry) => entry.trim()).filter((entry) => entry !== "");
  }
  const base = flagValue(args, "--base");
  if (base !== undefined) {
    try {
      const out = execFileSync("git", ["diff", "--name-only", base], {
        cwd: process.cwd(),
        encoding: "utf8",
      });
      return out.split("\n").map((entry) => entry.trim()).filter((entry) => entry !== "");
    } catch {
      refuse(`git diff ${base} failed — is the base ref a commit?`);
    }
  }
  refuse("provide --changed <path,path…> or --base <ref>");
}

main();
