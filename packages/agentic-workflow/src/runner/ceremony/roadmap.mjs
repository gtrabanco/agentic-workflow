/**
 * roadmap.mjs — ceremony `roadmap` module (issue #352 P4): the work list as a
 * checked surface.
 *
 * The writer is the crate's `Roadmap` service — this module never re-implements
 * a row. It adds what the service does not know: which table a unit belongs to
 * (a `###` feature row or a `## Fixes` row), the closed status vocabulary, and a
 * `settle` that promotes only what the row itself already evidences as merged.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gitRoot } from "../root.mjs";
import { out, fail, block, onlyFlags, parseFlags, resolveUnit, listUnits, git } from "../lib.mjs";
import { rowUpsert, fixRowUpsert } from "../../edit/Roadmap.mjs";
import { ROADMAP_DOCUMENT, ROADMAP_FEATURES_HEADING, ROADMAP_FIXES_HEADING, roadmapSection, roadmapTableRows } from "../../index-document.mjs";

/** The closed status vocabulary a row's cell opens with. */
export const ROADMAP_STATUSES = Object.freeze(["idea", "defined", "planned", "in-progress", "done", "declined"]);

/** The project's index: the worktree enclosing the caller, never the crate's own. */
const roadmapPath = () => join(gitRoot(process.cwd()), ROADMAP_DOCUMENT);

const table = () => {
  const text = readFileSync(roadmapPath(), "utf8");
  return { text, features: roadmapTableRows(roadmapSection(text, ROADMAP_FEATURES_HEADING)), fixes: roadmapTableRows(roadmapSection(text, ROADMAP_FIXES_HEADING)) };
};

/** Write the roadmap back, leaving every byte the caller did not change. */
const write = (text) => writeFileSync(roadmapPath(), text);

export function roadmap(op, argv) {
  switch (op) {
    case "read": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const { features, fixes } = table();
      out({ features, fixes });
    }
    case "list": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const { features, fixes } = table();
      const byStatus = Object.fromEntries(ROADMAP_STATUSES.map((status) => [status, []]));
      for (const row of [...features, ...fixes]) {
        const cell = String(row.status ?? row[3] ?? "").trim();
        const status = ROADMAP_STATUSES.find((value) => cell.startsWith(value)) ?? "idea";
        byStatus[status].push(row.slug ?? row[2]);
      }
      out({ "by-status": byStatus });
    }
    case "row-upsert": {
      const flags = parseFlags(argv, ["slug", "status", "depends-on", "summary", "issue"], ["slug", "status"]);
      onlyFlags(flags, ["status", "depends-on", "summary", "issue"]);
      if (!ROADMAP_STATUSES.includes(String(flags.status))) fail("bad-status", { status: flags.status, allowed: ROADMAP_STATUSES });
      const unit = resolveUnit(flags.slug);
      const nn = /^(\d+)/u.exec(flags.slug)?.[1];
      if (nn === undefined) fail("bad-slug", { slug: flags.slug, expected: "<nn>-<topic>" });
      const text = readFileSync(roadmapPath(), "utf8");
      const next = unit.type === "fix"
        ? fixRowUpsert(text, {
          issue: flags.issue ?? nn,
          url: `https://github.com/gtrabanco/agentic-workflow/issues/${flags.issue ?? nn}`,
          topic: flags.slug.replace(/^\d+-/u, ""),
          status: String(flags.status),
          notes: flags.summary ?? "",
        })
        : rowUpsert(text, {
          nn,
          slug: flags.slug.replace(/^\d+-/u, ""),
          status: String(flags.status),
          dependsOn: flags["depends-on"] ?? "—",
          description: flags.summary ?? "",
        });
      const written = typeof next === "string" ? next : next.text;
      write(written);
      out({ upserted: true, slug: flags.slug, status: flags.status, sha: git(["hash-object", roadmapPath()]) });
    }
    case "settle": {
      const flags = parseFlags(argv, [], []);
      onlyFlags(flags, []);
      const { features, fixes } = table();
      const settled = [];
      let next = readFileSync(roadmapPath(), "utf8");
      for (const row of [...features, ...fixes]) {
        const cell = String(row.status ?? row[3] ?? "");
        const url = /https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/(\d+)/u.exec(String(row.summary ?? row[4] ?? ""));
        if (url === null || !cell.startsWith("in-progress")) continue;
        const nn = row.nn ?? row[1];
        const slug = String(row.slug ?? row[2]);
        next = rowUpsert(next, { nn, slug, status: `done · [#${url[1]}](${url[0]})`, dependsOn: String(row.dependsOn ?? row[5] ?? "—"), description: String(row.summary ?? row[4] ?? "") });
        settled.push({ nn, slug, pr: url[0] });
      }
      if (settled.length > 0) write(typeof next === "string" ? next : next.text);
      out({ settled: settled.length, rows: settled });
    }
    case "check": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const nn = /^(\d+)/u.exec(flags.slug)?.[1];
      const { features, fixes } = table();
      const rows = unit.type === "fix" ? fixes : features;
      const row = rows.find((entry) => String(entry.nn ?? entry[1]) === nn);
      if (row === undefined) block({ check: "row-missing", slug: flags.slug, nn });
      out({ slug: flags.slug, nn, row });
    }
    default:
      fail("unknown-op", { object: "roadmap", op, ops: ["read", "list", "row-upsert", "settle", "check"] });
  }
}
