#!/usr/bin/env node
/**
 * tier.mjs — ceremony `tier` module (issue #360 S7): the risk tier as versioned
 * grammar, emitted by the closed ceremony CLI and never by the model.
 *
 * Three subcommands, one closed world:
 *   classify [--paths a,b | --base <ref>]   the diff in scope → the tier verdict
 *   read --unit <slug>                      the tier a unit recorded for itself
 *   plan                                    a matrix of this run's verdicts for
 *                                           the measured acceptance (S9)
 *
 * `classify` reads repo evidence only — the changed paths, their contents and,
 * for `--base`, `git diff` — and delegates the verdict to `scripts/risk-tiers.mjs`
 * so the rule has one home. A model-supplied tier is not an input anywhere here:
 * an unknown flag is a usage error, and the vocabulary is not accepted as a
 * parameter.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import fs from "node:fs";
import path from "node:path";
import { out, fail, onlyFlags, parseFlags, gitOrFail, resolveUnit, readRepoFile } from "./lib.mjs";
import { classifyTier, RISK_TIER_KINDS, RISK_TIER_SIGNAL_KINDS, RISK_TIERS_CONTRACT_ID } from "../risk-tiers.mjs";

export { RISK_TIER_KINDS, RISK_TIER_SIGNAL_KINDS };

/** Separator the `classify --paths` cell uses; a comma keeps the arg shell-safe. */
const PATH_SEPARATOR = /,/;



/**
 * The diff in scope: `--paths` names the change explicitly, otherwise the merge
 * base against `main` (or the root commit when no `main` ref exists) decides.
 */
function scopePaths(flags, cwd) {
  if (flags.paths !== undefined) {
    if (flags.paths === true) fail("missing-flag", { flag: "--paths" });
    const list = String(flags.paths).split(PATH_SEPARATOR).map((p) => p.trim()).filter(Boolean);
    if (list.length === 0) fail("empty-scope", { flag: "--paths" });
    return list;
  }
  const base = typeof flags.base === "string" ? flags.base : "main";
  const mergeBase = (() => {
    try {
      return gitOrFail(["merge-base", base, "HEAD"], cwd);
    } catch {
      return gitOrFail(["rev-list", "--max-parents=0", "HEAD"], cwd).split("\n").pop();
    }
  })();
  const raw = gitOrFail(["diff", "--name-only", "--no-renames", mergeBase, "HEAD"], cwd);
  const committed = raw.split("\n").filter(Boolean);
  // `-b` first: the porcelain body is read through a helper that trims the whole
  // output, so without a header line the FIRST entry would lose its leading
  // status column and its path would lose a character (issue #384 F1 — a mangled
  // high-risk path is a fail-open tier). The header line is dropped here.
  const dirty = gitOrFail(["status", "--porcelain=v1", "-b"], cwd)
    .split("\n")
    .filter((line) => line !== "" && !line.startsWith("## "))
    .map((line) => line.slice(3).trim());
  return [...new Set([...committed, ...dirty])].filter(Boolean).sort();
}

/**
 * The tier a unit recorded, or `null`. Three shapes, one reader: the `## Risk
 * tier` block the template writes ("Copy the verdict below verbatim"), the
 * classifier's JSON pasted into a `## Log` evidence line, and a plain
 * `tier: <value>` sentence. A unit that copied the verdict into the block its
 * template asks for is recording it, so refusing that shape would refuse the
 * canonical one (#383 S4).
 */
export function recordedTier(specText) {
  const matches = [...specText.matchAll(/\*\*Tier\*\*\s*—\s*`([a-z]+)`|"tier":\s*"([a-z]+)"|tier:\s*`?([a-z]+)`?/g)];
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const token = matches[i][1] ?? matches[i][2] ?? matches[i][3];
    if (RISK_TIER_KINDS.includes(token)) return token;
  }
  return null;
}

/** Every unit in this repo's own ledgers, with the tier it recorded. */
function tierMatrix(cwd) {
  const rows = [];
  for (const root of ["docs/fix", "docs/features"]) {
    const abs = path.join(cwd, root);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs).sort()) {
      if (name === "_TEMPLATE") continue;
      const spec = path.join(abs, name, "SPEC.md");
      if (!fs.existsSync(spec)) continue;
      rows.push({ unit: name, kind: root.split("/").pop(), tier: recordedTier(fs.readFileSync(spec, "utf8")) });
    }
  }
  return rows;
}

export function tier(op, argv, cwd = process.cwd()) {
  switch (op) {
    case "classify": {
      const flags = parseFlags(argv, ["paths", "base"]);
      onlyFlags(flags, ["paths", "base"]);
      const paths = scopePaths(flags, cwd);
      // The resolver is the same repo-rooted reader this module already uses, so
      // a relative import is followed here exactly as the sensor follows it: two
      // callers, one answer for the same scope (issue #384 S3).
      const files = new Map(paths.map((rel) => [rel, readRepoFile(cwd, rel) ?? ""]));
      const verdict = classifyTier(files, { resolve: (rel) => readRepoFile(cwd, rel) });
      out({ contract: RISK_TIERS_CONTRACT_ID, ...verdict, paths: { ...verdict.paths, changed: paths } });
      return;
    }
    case "read": {
      const flags = parseFlags(argv, ["unit"], ["unit"]);
      onlyFlags(flags, ["unit"]);
      const unit = resolveUnit(flags.unit, cwd);
      const recorded = recordedTier(fs.readFileSync(unit.specPath, "utf8"));
      out({ contract: RISK_TIERS_CONTRACT_ID, unit: flags.unit, kind: unit.type, tier: recorded, recorded: recorded !== null });
      return;
    }
    case "plan": {
      const flags = parseFlags(argv, []);
      onlyFlags(flags, []);
      const rows = tierMatrix(cwd);
      const byTier = Object.fromEntries(RISK_TIER_KINDS.map((t) => [t, rows.filter((r) => r.tier === t).length]));
      out({ contract: RISK_TIERS_CONTRACT_ID, totals: rows.length, recorded: rows.filter((r) => r.tier !== null).length, by_tier: byTier, units: rows });
      return;
    }
    default:
      fail("unknown-op", { op, allowed: ["classify", "read", "plan"] });
  }
}
