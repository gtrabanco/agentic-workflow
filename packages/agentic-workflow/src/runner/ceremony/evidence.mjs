/**
 * evidence.mjs — ceremony `evidence` module (issue #352 P4): the evidence rows a
 * unit's acceptance criteria are proved by.
 *
 * The carrier is the unit doc's `## Evidence` table (legacy shape) or the `E`/`G`
 * lines of its `## Log` (re-cut shape) — the map's "Evidence for each task/ac" is
 * one carrier, never two. `append` writes the shape the document already uses;
 * `verify` re-runs the command and reports whether its exit matches.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { out, fail, onlyFlags, parseFlags, resolveUnit, unitDoc, appendSectionLine } from "../lib.mjs";
import { sectionText } from "../unit-doc-phases.mjs";

/** The shape a document records evidence in. */
function shapeOf(text) {
  return sectionText(text, "Evidence") === null ? "log" : "table";
}

/** Run one declared validator in the project and answer its result. */
function runCommand(command, cwd) {
  try {
    const stdout = execFileSync(process.env.SHELL || "sh", ["-c", command], { cwd, encoding: "utf8", timeout: 120_000, stdio: ["ignore", "pipe", "pipe"] });
    return { exit: 0, output: stdout.trim() };
  } catch (error) {
    return { exit: typeof error.status === "number" ? error.status : 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}`.trim() };
  }
}

export function evidence(op, argv) {
  switch (op) {
    case "append": {
      const flags = parseFlags(argv, ["slug", "ac", "command", "exit", "output", "verified-by"], ["slug", "ac", "command"]);
      onlyFlags(flags, ["ac", "command", "exit", "output", "verified-by"]);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const exit = flags.exit === undefined ? "0" : String(flags.exit);
      const output = flags.output === undefined ? "" : String(flags.output).replace(/\s+/gu, " ").slice(0, 200);
      const who = flags["verified-by"] === undefined ? "human-owner" : String(flags["verified-by"]);
      if (shapeOf(doc.text) === "table") {
        appendSectionLine(doc.path, "Evidence", `| AC${flags.ac} | \`${String(flags.command).replace(/\|/gu, "\\|")}\` | ${exit} | ${output.replace(/\|/gu, "\\|")} | ${who} |`);
      } else {
        const existing = [...doc.text.matchAll(/^\s*-\s*\*\*E(\d+)\*\*/gmu)].map((match) => Number(match[1]));
        const n = existing.length === 0 ? 1 : Math.max(...existing) + 1;
        const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
        appendSectionLine(doc.path, "Log", `- **E${n}** — ${stamp}, \`${flags.command}\` · exit ${exit} · ${output}`);
      }
      out({ appended: true, unit: flags.slug, ac: flags.ac, shape: shapeOf(doc.text) });
    }
    case "read":
    case "list": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const rows = doc.text
        .split("\n")
        .filter((line) => /^\|\s*AC\d+\s*\|/u.test(line))
        .map((line) => line.split("|").slice(1, -1).map((cell) => cell.trim()))
        .map(([ac, command, exit, output, who]) => ({ ac, command, exit: Number(exit), output, "verified-by": who }));
      out({ unit: flags.slug, shape: shapeOf(doc.text), evidences: rows, count: rows.length });
    }
    case "delete": {
      const flags = parseFlags(argv, ["slug", "row"], ["slug", "row"]);
      onlyFlags(flags, ["row"]);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const wanted = Number(flags.row);
      const lines = doc.text.split("\n");
      const indexes = lines.map((line, index) => (/^\|\s*AC\d+\s*\|/u.test(line) ? index : -1)).filter((index) => index !== -1);
      if (!Number.isInteger(wanted) || wanted < 1 || wanted > indexes.length) fail("bad-row", { row: flags.row, rows: indexes.length });
      lines.splice(indexes[wanted - 1], 1);
      writeFileSync(doc.path, lines.join("\n"));
      out({ deleted: true, unit: flags.slug, row: wanted });
    }
    case "verify": {
      const flags = parseFlags(argv, ["slug", "ac", "command"], ["slug", "ac", "command"]);
      onlyFlags(flags, ["ac", "command"]);
      const unit = resolveUnit(flags.slug);
      const result = runCommand(String(flags.command), process.cwd());
      out({ unit: flags.slug, ac: flags.ac, command: flags.command, ...result, match: result.exit === 0 });
    }
    default:
      fail("unknown-op", { object: "evidence", op, ops: ["append", "read", "list", "delete", "verify"] });
  }
}
