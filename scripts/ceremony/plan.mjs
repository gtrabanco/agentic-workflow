#!/usr/bin/env node
/**
 * plan.mjs — ceremony `plan` module (issue #338 P0): the plan of a unit.
 *
 * In the re-cut unit-doc shape the plan lives in the SPEC's `## Tasks`
 * section (PLAN.md is retired), so every plan operation addresses the unit
 * doc. `plan lint` delegates to `phase-lint.mjs` (PE-002: one phase-lint, no
 * second grammar).
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  gitOrFail, out, fail, block, onlyFlags, parseFlags, resolveUnit, replaceSection, deleteSection,
  parseTasks, setTaskTick,
} from "./lib.mjs";

/** Render the `## Tasks` body: one bullet per task plus its indented spec/files links. */
function renderTasks(tasks) {
  return tasks.map((t) => {
    const lines = [`- ${t.ticked ? "[x] " : ""}P${t.n} — ${t.label}`];
    if (t.spec) lines.push(`  (Implements: ${t.spec})`);
    if (t.files) lines.push(`  Relevant files: ${t.files}`);
    return lines.join("\n");
  }).join("\n");
}

export function plan(op, argv, cwd = process.cwd()) {
  const flags = parseFlags(argv, ["slug", "tasks", "task", "label", "content", "step", "delete", "section"], ["slug"]);
  const u = resolveUnit(flags.slug, cwd);
  const readMd = () => fs.readFileSync(u.specPath, "utf8");
  const writeMd = (md) => fs.writeFileSync(u.specPath, md);

  switch (op) {
    case "create": {
      onlyFlags(flags, ["tasks"]);
      if (!flags.tasks) fail("missing-flag", { flag: "--tasks <json array>" });
      let tasks;
      try { tasks = JSON.parse(flags.tasks); } catch { fail("invalid-json", { flag: "--tasks" }); }
      writeMd(replaceSection(readMd(), "tasks", renderTasks(tasks)));
      out({ created: true, slug: flags.slug, tasks: tasks.length, sha: gitOrFail(["hash-object", u.specPath], cwd) });
    }
    case "read": {
      onlyFlags(flags, []);
      out({ slug: flags.slug, tasks: parseTasks(readMd()) });
    }
    case "update": {
      onlyFlags(flags, ["content", "tasks", "task", "label", "delete"]);
      const md = readMd();
      if (flags.content) {
        writeMd(replaceSection(md, "tasks", flags.content));
        out({ updated: true, slug: flags.slug, mode: "full" });
      } else if (flags.tasks) {
        let incoming;
        try { incoming = JSON.parse(flags.tasks); } catch { fail("invalid-json", { flag: "--tasks" }); }
        if (!Array.isArray(incoming)) fail("invalid-json", { flag: "--tasks", expected: "array of {n, label, spec?, files?, ticked?}" });
        const current = new Map(parseTasks(md).map((t) => [t.n, t]));
        // Partial edit: an incoming task carries only the fields it changes, so
        // an untouched tick or `(Implements: …)` link survives the rewrite.
        const added = incoming.filter((t) => !current.has(t.n)).map((t) => `P${t.n}`);
        for (const t of incoming) current.set(t.n, { ...current.get(t.n), ...t });
        writeMd(replaceSection(md, "tasks", renderTasks([...current.values()].sort((a, b) => a.n - b.n))));
        out({ updated: true, slug: flags.slug, mode: "tasks", "tasks-added": added, "tasks-removed": [] });
      } else if (flags.task) {
        const n = Number(flags.task);
        const tasks = parseTasks(md);
        if (!tasks.some((t) => t.n === n)) fail("unknown-task", { task: `P${n}`, slug: flags.slug });
        let next = md;
        if (flags.label) {
          next = next.replace(new RegExp(`^(- (?:\\[.\\] )?P${n} — ).*$`, "m"), `$1${flags.label}`);
        }
        if ("delete" in flags && flags.delete) {
          next = next.replace(new RegExp(`^\\n?- (?:\\[.\\] )?P${n} — [^\\n]*(\\n  (?!- ).*)*`, "m"), "");
        }
        writeMd(next);
        out({ updated: true, slug: flags.slug, task: `P${n}`, label: flags.label ?? null, deleted: Boolean(flags.delete) });
      } else {
        fail("missing-flag", { flag: "--task <n> [--label <text> | --delete] | --tasks <json> | --content <md>" });
      }
    }
    case "delete": {
      onlyFlags(flags, []);
      writeMd(replaceSection(readMd(), "tasks", "(none)"));
      out({ deleted: true, slug: flags.slug });
    }
    case "delete-section": {
      onlyFlags(flags, ["section"]);
      if (!flags.section) fail("missing-flag", { flag: "--section" });
      writeMd(deleteSection(readMd(), flags.section));
      out({ deleted: true, slug: flags.slug, section: flags.section });
    }
    case "execute": {
      onlyFlags(flags, ["step"]);
      if (!flags.step) fail("missing-flag", { flag: "--step <n>" });
      const next = setTaskTick(readMd(), Number(flags.step), true);
      if (!next) fail("unknown-task", { task: `P${flags.step}`, slug: flags.slug });
      writeMd(next);
      out({ "step-complete": true, slug: flags.slug, step: `P${flags.step}`, sha: gitOrFail(["hash-object", u.specPath], cwd) });
    }
    case "execute-all": {
      onlyFlags(flags, []);
      let md = readMd();
      for (const t of parseTasks(md)) {
        const next = setTaskTick(md, t.n, true);
        if (next) md = next;
      }
      writeMd(md);
      out({ "steps-complete": true, slug: flags.slug, tasks: parseTasks(md).length, sha: gitOrFail(["hash-object", u.specPath], cwd) });
    }
    case "lint": {
      onlyFlags(flags, []);
      const specPath = path.relative(cwd, u.specPath);
      const PHASE_LINT = fileURLToPath(new URL("../phase-lint.mjs", import.meta.url));
      let stdout = "";
      let code = 0;
      try {
        stdout = execFileSync("node", [PHASE_LINT, specPath], { cwd, encoding: "utf8" });
      } catch (err) {
        code = err.status ?? 1;
        stdout = (err.stdout ?? "") + (err.stderr ?? "");
      }
      const verdict = stdout.match(/verdict ([A-Z]+(?::[a-z-]+)?)/)?.[1] ?? `exit-${code}`;
      const fingerprint = stdout.match(/fingerprint: ([0-9a-f]+)/)?.[1] ?? null;
      const result = { slug: flags.slug, lint: specPath, verdict, fingerprint, output: stdout };
      if (code === 0) out(result);
      block({ check: "plan-lint", ...result });
    }
    default:
      fail("unknown-subcommand", { object: "plan", subcommand: op });
  }
}
