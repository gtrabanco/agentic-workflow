/**
 * delta.mjs — ceremony `delta` module (issue #352 P4): the delta-mode trigger.
 *
 * A review pass may skip the full re-read only when the change since the last
 * reviewed revision is inside the declared bound: a width bound (files the cited
 * surface does not cover) and a size bound (changed lines). Both are measured
 * from git, never from a model's estimate, and the answer names its trigger.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { createHash } from "node:crypto";
import { out, fail, onlyFlags, parseFlags, resolveUnit, unitDoc, gitOrFail } from "../lib.mjs";
import { manifestOf } from "./acceptance.mjs";

/** The declared bounds: no uncited file, and 400 changed lines. */
export const DELTA_BOUNDS = Object.freeze({ maxUncitedFiles: 0, maxChangedLines: 400 });

/** `git diff --numstat from to` → per-file added/deleted lines. */
function numstat(from, to) {
  return gitOrFail(["diff", "--numstat", from, to])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [added, deleted, file] = line.split("\t");
      return { file, added: Number(added) || 0, deleted: Number(deleted) || 0 };
    });
}

export function delta(op, argv) {
  switch (op) {
    case "check": {
      const flags = parseFlags(argv, ["from", "to", "cited"], ["from", "to"]);
      onlyFlags(flags, ["from", "to", "cited"]);
      const files = numstat(flags.from, flags.to);
      const cited = String(flags.cited ?? "")
        .split(",")
        .map((entry) => entry.trim().split(":")[0])
        .filter(Boolean);
      const uncited = files.map((entry) => entry.file).filter((file) => !cited.some((prefix) => file === prefix || file.startsWith(`${prefix}/`)));
      const changedLines = files.reduce((total, entry) => total + entry.added + entry.deleted, 0);
      const sizeTrigger = changedLines > DELTA_BOUNDS.maxChangedLines;
      const widthTrigger = uncited.length > DELTA_BOUNDS.maxUncitedFiles;
      out({
        "needs-full-pass": sizeTrigger || widthTrigger,
        trigger: sizeTrigger ? "size" : widthTrigger ? "width" : null,
        "width-files": uncited,
        "size-lines": changedLines,
        "size-files": files.length,
        "changed-lines-count": changedLines,
        bounds: DELTA_BOUNDS,
      });
    }
    case "manifest-hash": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const manifest = manifestOf(unitDoc(unit).text);
      out({ unit: flags.slug, "blob-sha": createHash("sha256").update(JSON.stringify(manifest), "utf8").digest("hex") });
    }
    default:
      fail("unknown-op", { object: "delta", op, ops: ["check", "manifest-hash"] });
  }
}
