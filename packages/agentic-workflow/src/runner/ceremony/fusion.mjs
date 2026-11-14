/**
 * fusion.mjs — ceremony `fusion` module (issue #352 P4): fuse the axis tables
 * into one.
 *
 * One row per distinct finding, with every axis that raised it and the number of
 * reviewers behind it — the dedupe rule the review pack states (identical
 * target + identical claim is one row, never two). `delta` compares two fused
 * tables by that same identity, so an advisory and a blocker can never be
 * counted as the same row.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { out, fail, onlyFlags, parseFlags, resolveUnit } from "../lib.mjs";

/** The identity of a row: its target and its claim, normalized. */
const keyOf = (row) => `${(row.target ?? row.file ?? "").trim()}|${String(row.finding ?? row.claim ?? "").trim().replace(/\s+/gu, " ")}`;

/** Fuse axis rows into one table, preserving first-seen order. */
function fuse(axisRows) {
  const byKey = new Map();
  for (const { axis, rows } of axisRows) {
    for (const row of rows) {
      const key = keyOf(row);
      const existing = byKey.get(key);
      if (existing === undefined) {
        byKey.set(key, {
          target: row.target ?? row.file ?? "",
          finding: row.finding ?? row.claim ?? "",
          axis: [axis],
          severity: row.severity ?? "",
          evidence: row.evidence ?? "",
          "suggested-fix": row["suggested-fix"] ?? row.suggestedFix ?? "",
          reviewers: Number(row.reviewers ?? 1),
        });
        continue;
      }
      if (!existing.axis.includes(axis)) existing.axis.push(axis);
      existing.reviewers += Number(row.reviewers ?? 1);
      if (existing.evidence === "" && (row.evidence ?? "") !== "") existing.evidence = row.evidence;
      if (existing["suggested-fix"] === "" && (row["suggested-fix"] ?? row.suggestedFix ?? "") !== "") {
        existing["suggested-fix"] = row["suggested-fix"] ?? row.suggestedFix;
      }
    }
  }
  return [...byKey.values()].map((row, index) => ({ "#": index + 1, ...row, axis: row.axis.join("+") }));
}

export function fusion(op, argv) {
  switch (op) {
    case "build": {
      const flags = parseFlags(argv, ["slug", "axis"], ["slug", "axis"]);
      onlyFlags(flags, ["slug", "axis"]);
      resolveUnit(flags.slug);
      let axisRows;
      try {
        axisRows = JSON.parse(String(flags.axis));
      } catch {
        fail("bad-json", { flag: "--axis" });
      }
      const normalized = Array.isArray(axisRows)
        ? axisRows.map((entry) => ({ axis: entry.axis, rows: entry.findings ?? entry.rows ?? [] }))
        : Object.entries(axisRows).map(([axis, rows]) => ({ axis, rows }));
      if (normalized.some((entry) => typeof entry.axis !== "string" || !Array.isArray(entry.rows))) {
        fail("bad-axis", { expected: "{ axis: [rows] } or [{ axis, findings }]" });
      }
      const table = fuse(normalized);
      const raw = normalized.reduce((total, entry) => total + entry.rows.length, 0);
      out({ unit: flags.slug, table, "deduped-count": raw - table.length, "raw-count": raw });
    }
    case "delta": {
      const flags = parseFlags(argv, ["slug", "base", "axis"], ["slug", "base", "axis"]);
      onlyFlags(flags, ["base", "axis"]);
      resolveUnit(flags.slug);
      resolveUnit(flags.base);
      let payload;
      try {
        payload = JSON.parse(String(flags.axis));
      } catch {
        fail("bad-json", { flag: "--axis" });
      }
      if (!Array.isArray(payload?.base) || !Array.isArray(payload?.target)) {
        fail("bad-axis", { expected: "{ base: [rows], target: [rows] }" });
      }
      const base = fuse([{ axis: "base", rows: payload.base }]);
      const target = fuse([{ axis: "target", rows: payload.target }]);
      const baseKeys = new Map(base.map((row) => [keyOf(row), row]));
      const targetKeys = new Map(target.map((row) => [keyOf(row), row]));
      const added = [...targetKeys.keys()].filter((key) => !baseKeys.has(key));
      const removed = [...baseKeys.keys()].filter((key) => !targetKeys.has(key));
      const unchanged = [...targetKeys.keys()].filter((key) => baseKeys.has(key));
      out({
        slug: flags.slug,
        base: flags.base,
        added: added.map((key) => targetKeys.get(key)),
        removed: removed.map((key) => baseKeys.get(key)),
        unchanged: unchanged.length,
        modified: added.length + removed.length,
      });
    }
    default:
      fail("unknown-op", { object: "fusion", op, ops: ["build", "delta"] });
  }
}
