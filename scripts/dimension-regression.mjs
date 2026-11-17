#!/usr/bin/env node
/**
 * dimension-regression.mjs — the evolution-regression gate (issue #590 S4/S9).
 *
 * Unconstrained self-evolution — rewriting workflow rules, replacing skills,
 * updating the substrate — measurably degrades previously acquired capabilities
 * (arXiv 2605.09315). This repository's review surface is exactly that kind of
 * substrate, so a change that adds or alters a review dimension, a review skill
 * or an audit producer re-verifies the dimensions that were already present
 * (the workflow-side analogue of the residue sweeps'
 * features-preserved-without-it check).
 *
 * Two deterministic findings, nothing else:
 *
 *   dimension-dropped                a dimension id present at the base revision is
 *                                    gone at the head without a recorded owner
 *                                    decision (a `## Log` `D` line naming it);
 *   missing-reverification-evidence  the range touches a review surface and no unit
 *                                    doc changed in it records a run of this gate
 *                                    (an `E`/`G` line naming
 *                                    `scripts/dimension-regression.mjs`).
 *
 * A range that touches no review surface is `not-applicable` — never a pass, and
 * never a failure. The step is a push-range gate (`--push-base`), so a full local
 * run without a base is `not-applicable` too: the repository's own frozen set is
 * asserted by the sibling suite on every push.
 *
 * Usage
 *   bun scripts/dimension-regression.mjs [--root <dir>] [--base <rev>]
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — `dimension-regression@1`, the base and head counts,
 * the changed review surfaces, the evidence carrier, one `finding — <code>` line
 * per finding, then `verdict`. Exit: 0 clean / not-applicable; 1 refused;
 * 2 a usage error or an unresolvable base.
 *
 * Read-only: it reads git history and the tree, writes nothing, calls no network.
 * Its sibling suite is `scripts/dimension-regression.test.mjs`.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const EVOLUTION_GUARD = "dimension-regression@1";
export const DIMENSIONS_REL = "skills/product-audit/references/AUDIT_DIMENSIONS.md";
/** The closed surface set: what a "review dimension / review skill / audit
 *  producer" change means, stated once. */
export const DIMENSION_SURFACES = Object.freeze([
  DIMENSIONS_REL,
  "skills/review-",
  "skills/product-audit/",
  "scripts/coverage-gap.mjs",
  "scripts/findings-corpus.mjs",
  "scripts/product-audit-",
  "docs/workflow/GATE_INVENTORY.md",
]);

const LOG_LINE = /^\s*-\s*\*\*([EDG]\d+)\*\*/;

/** Is this changed path a review surface the gate re-verifies? */
export function isDimensionSurface(relPath) {
  const rel = String(relPath ?? "").replaceAll("\\", "/");
  return DIMENSION_SURFACES.some((entry) =>
    entry.endsWith("/") || entry.endsWith("-") ? rel.startsWith(entry) : rel === entry,
  );
}

/** The dimension ids the reference's applicability table publishes, in order. */
export function dimensionsOf(text) {
  const ids = [];
  for (const line of String(text ?? "").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;
    const first = trimmed.split("|")[1]?.trim() ?? "";
    const bold = /^\*\*(.+?)\*\*$/.exec(first);
    if (bold) ids.push(bold[1]);
  }
  return ids;
}

/** The `## Log` lines of a unit doc, as `{ id, body }`. */
function logLines(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => {
      const match = LOG_LINE.exec(line);
      return match === null ? null : { id: match[1], body: line };
    })
    .filter(Boolean);
}

const recordsRun = (text) => logLines(text).some((line) => /^[EG]/.test(line.id) && line.body.includes("scripts/dimension-regression.mjs"));
const decisionNames = (text, id) => logLines(text).some((line) => line.id.startsWith("D") && line.body.includes(id));

/**
 * The rule, pure in its inputs: a fixture and a real push range take the same
 * path. `unitDocs` are `{ path, text }` for the unit docs changed in the range.
 */
export function evaluateEvolution({ baseDimensions, headDimensions, changedPaths, unitDocs }) {
  const surfaces = changedPaths.filter(isDimensionSurface);
  if (surfaces.length === 0) {
    return { applicable: false, verdict: "not-applicable", surfaces, findings: [], evidence: null };
  }
  const findings = [];
  for (const id of baseDimensions) {
    if (headDimensions.includes(id)) continue;
    if (unitDocs.some((doc) => decisionNames(doc.text, id))) continue;
    findings.push({ code: "dimension-dropped", detail: `${id} is gone from ${DIMENSIONS_REL} and no D line names the retirement` });
  }
  const evidence = unitDocs.find((doc) => recordsRun(doc.text)) ?? null;
  if (evidence === null) {
    findings.push({
      code: "missing-reverification-evidence",
      detail: `the range touches ${surfaces.length} review surface(s); record a \`bun scripts/dimension-regression.mjs\` run in a changed unit doc's \`## Log\``,
    });
  }
  return { applicable: true, verdict: findings.length === 0 ? "clean" : "refused", surfaces, findings, evidence: evidence?.path ?? null };
}

/** `<rev>` resolved to a commit, or null. */
function resolveCommit(root, rev) {
  const result = spawnSync("git", ["-C", root, "rev-parse", "--verify", "--quiet", `${rev}^{commit}`], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

const gitOut = (root, args) => {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return result.status === 0 ? result.stdout : "";
};

/** Read a unit doc from the working tree, or `""` when it is gone. */
function readTree(root, rel) {
  const absolute = path.join(root, rel);
  return fs.existsSync(absolute) ? fs.readFileSync(absolute, "utf8") : "";
}

/** The whole run: the range, the two reference revisions, the changed unit docs. */
export function inspectRange(root, rev) {
  const commit = resolveCommit(root, rev);
  if (commit === null) return { error: `${rev} does not resolve to a commit` };

  const changedPaths = gitOut(root, ["diff", "--name-only", `${commit}..HEAD`]).split("\n").map((line) => line.trim()).filter(Boolean);
  const baseText = gitOut(root, ["show", `${commit}:${DIMENSIONS_REL}`]);
  const headText = readTree(root, DIMENSIONS_REL);
  const unitDocs = changedPaths
    .filter((rel) => /^docs\/(features|fix)\/[^/]+\/SPEC\.md$/.test(rel))
    .map((rel) => ({ path: rel, text: readTree(root, rel) }));

  const evaluated = evaluateEvolution({
    baseDimensions: dimensionsOf(baseText),
    headDimensions: dimensionsOf(headText),
    changedPaths,
    unitDocs,
  });
  return {
    ...evaluated,
    commit,
    baseDimensions: dimensionsOf(baseText).length,
    headDimensions: dimensionsOf(headText).length,
  };
}

/** The fixed report block. */
export function renderReport(result, rev) {
  const lines = [EVOLUTION_GUARD];
  lines.push(
    rev === undefined
      ? "base | none — no push range proved, so the frozen set is the suite's job"
      : `base | ${rev.slice(0, 7)} · ${result.baseDimensions} dimensions`,
  );
  if (rev !== undefined) {
    lines.push(`head | ${result.headDimensions} dimensions · changed review surfaces ${result.surfaces.length}`);
    lines.push(`evidence | ${result.evidence ?? "none"}`);
  }
  for (const finding of result.findings) lines.push(`finding — ${finding.code} · ${finding.detail}`);
  lines.push(`verdict | ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: dimension-regression.mjs [--root <dir>] [--base <rev>] [--remote <name>]";

function main(argv) {
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let base = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    // The local gate hands a pushBase step `--root <dir> --base <rev>` and, when
    // the hook knows it, `--remote <name>`. The range is local history, so the
    // remote is accepted and unused: refusing it would redden every push.
    if (arg === "--root" || arg === "--base" || arg === "--remote") {
      const value = argv[index + 1];
      if (!value) {
        process.stderr.write(`dimension-regression: ${arg} needs a value\n${USAGE}\n`);
        return 2;
      }
      if (arg === "--root") root = path.resolve(value);
      else if (arg === "--base") base = value;
      index += 1;
    } else {
      process.stderr.write(`dimension-regression: unknown argument ${arg}\n${USAGE}\n`);
      return 2;
    }
  }

  if (base === null) {
    process.stdout.write(renderReport({ verdict: "not-applicable", findings: [], surfaces: [], evidence: null }, undefined));
    return 0;
  }

  const result = inspectRange(root, base);
  if (result.error) {
    process.stderr.write(`dimension-regression: ${result.error}\n`);
    return 2;
  }
  process.stdout.write(renderReport(result, result.commit));
  return result.verdict === "refused" ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
