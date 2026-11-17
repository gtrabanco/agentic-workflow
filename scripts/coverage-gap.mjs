#!/usr/bin/env node
/**
 * coverage-gap.mjs — the forward-looking coverage join (issue #590 S2/S6, #437's
 * sibling reader).
 *
 * The retrospective half already exists: `findings-corpus.mjs` attributes a
 * recurring finding class to the phase that should have caught it. The
 * prospective half is this script: it crosses the three already-committed
 * carriers and emits one typed receipt —
 *
 *   criteria   `docs/workflow/VERIFICATION_CRITERIA.md` — the project's declared
 *              acceptance criteria, each naming the check that proves it (shape
 *              owned by `template/docs/workflow/VERIFICATION_CRITERIA.md` and
 *              consumed by `audit-docs` check 16);
 *   detectors  `docs/workflow/GATE_INVENTORY.md` (parsed by its one owner,
 *              `prose-gate-inventory.mjs`) plus the review pack the project
 *              carries (`CEREMONY_REVIEW_SURFACES`, narrowed by the guide's
 *              `ceremony-profile@1` when it declares `review-passes`);
 *   corpus     the unit-doc ledgers, through `findings-corpus.mjs`'s own
 *              `buildCorpus` — never a second parser.
 *
 * Three gap classes, no judgment: `criterion-uncovered` (a criterion whose
 * declared check resolves to nothing), `class-uncovered` (an admitted recurring
 * class whose axis no detector names) and `detector-idle` (a declared gate no
 * criterion names). Whether a gap matters, and where it routes, is
 * product-audit's dimension — the script never decides a severity or a route.
 *
 * Nothing is guessed: an absent carrier is named in the receipt and the edges
 * that needed it read `n/a — <why>`; a project with no input at all is the
 * `insufficient-input` verdict (exit 1), never a vacuous `clean`.
 *
 * Usage
 *   bun scripts/coverage-gap.mjs [<dir> | --repo <dir>]
 *   (node fallback, same argv)
 *
 * Exit: 0 a receipt was produced (with or without gaps); 1 a required input is
 * absent everywhere, a ledger is unparsable, or the gate inventory is malformed;
 * 2 a usage error.
 *
 * Read-only: it reads bytes and the corpus readers' git history, writes nothing,
 * calls no network. Its sibling suite is `scripts/coverage-gap.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildCorpus, makeGitFoldResolver } from "./findings-corpus.mjs";
import { INVENTORY_REL, parseInventory } from "./prose-gate-inventory.mjs";
import {
  CEREMONY_REVIEW_SURFACES,
  charterSectionOf,
  readCeremonyProfile,
} from "../packages/agentic-workflow/src/runner/ceremony-profile.mjs";

export const COVERAGE_GAP_CONTRACT = "coverage-gap@1";
/** The catalogue's one home (template-owned shape, `audit-docs` check 16). */
export const CATALOGUE_REL = "docs/workflow/VERIFICATION_CRITERIA.md";
/** The project guide the ceremony profile is read from. */
export const GUIDE_REL = "AGENTS.md";
/** The closed gap-kind vocabulary — the only rows this receipt can carry. */
export const GAP_KINDS = Object.freeze(["criterion-uncovered", "class-uncovered", "detector-idle"]);
/**
 * The closed provenance set, read from the catalogue's own owner
 * (`template/docs/workflow/VERIFICATION_CRITERIA.md` §Provenance). The dated
 * member is a shape, so it is matched, never enumerated.
 */
export const CRITERION_PROVENANCE_FIXED = Object.freeze(["workflow-generic", "project-declared"]);
export const CRITERION_PROVENANCE_DATED = /^stamped assumption \(\d{4}-\d{2}-\d{2}\)$/;
/**
 * The command heads a criterion may name instead of a path — the runtimes this
 * workflow's projects actually carry. A token whose first word is not here and
 * that is neither a path nor a detector is unresolved, which is the gap.
 */
export const COMMAND_HEADS = Object.freeze([
  "bun",
  "node",
  "npm",
  "npx",
  "pnpm",
  "yarn",
  "deno",
  "make",
  "cargo",
  "go",
  "pytest",
  "python",
  "python3",
  "ruby",
  "bundle",
  "mvn",
  "gradle",
  "dotnet",
  "swift",
  "dart",
  "mix",
  "php",
  "composer",
  "sh",
  "bash",
]);

const BACKTICK = /`([^`]+)`/g;
const SEPARATOR = /^\|[-:| ]+\|$/;

/** A refusal the CLI reports and exits 1 on: a carrier that cannot be read is
 *  never a silently dropped row. */
export class CoverageGapRefusal extends Error {
  constructor(message) {
    super(message);
    this.name = "CoverageGapRefusal";
  }
}

/** The backticked tokens of a cell, in source order, deduplicated. */
function tokensOf(text) {
  const tokens = [];
  for (const match of String(text ?? "").matchAll(BACKTICK)) {
    const token = match[1].trim();
    if (token && !tokens.includes(token)) tokens.push(token);
  }
  return tokens;
}

/**
 * Parse the criteria table. A criterion row is the catalogue's own five-cell
 * shape; every other row (the header, a separator, a prose table with another
 * column count) is skipped, never guessed into a criterion.
 */
export function parseCatalogue(text) {
  const criteria = [];
  String(text).split("\n").forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|") || SEPARATOR.test(trimmed)) return;
    const cells = trimmed.split("|").slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 5) return;
    if (cells[0].toLowerCase() === "criterion") return;
    criteria.push({
      name: cells[0],
      appliesTo: cells[1],
      provenance: cells[2],
      source: cells[3],
      notes: cells[4],
      tokens: tokensOf(`${cells[3]} ${cells[4]}`),
      line: index + 1,
    });
  });
  return { criteria };
}

const provenanceKnown = (value) =>
  CRITERION_PROVENANCE_FIXED.includes(String(value ?? "").trim()) || CRITERION_PROVENANCE_DATED.test(String(value ?? "").trim());

/** A path token resolves when it names a file or a directory in the project. */
function pathResolves(token, root) {
  const cleaned = String(token).replace(/:\d+(-\d+)?$/, "").replace(/\(.*\)$/, "").trim();
  if (cleaned === "" || cleaned.includes(" ")) return false;
  return fs.existsSync(path.join(root, cleaned));
}

/**
 * The review pack the project carries: the workflow's closed surface set,
 * narrowed by the guide's `ceremony-profile@1` when it declares
 * `review-passes`. A pass entry names the axis it consumes.
 */
export function readDetectors(root) {
  const inventoryPath = path.join(root, INVENTORY_REL);
  let gates = [];
  const inventoryPresent = fs.existsSync(inventoryPath);
  if (inventoryPresent) {
    const parsed = parseInventory(fs.readFileSync(inventoryPath, "utf8"));
    if (parsed.errors.length > 0) {
      const first = parsed.errors[0];
      throw new CoverageGapRefusal(
        `${INVENTORY_REL} — ${first.reason} — ${first.detail}${parsed.errors.length > 1 ? ` (+${parsed.errors.length - 1} more)` : ""}`,
      );
    }
    gates = parsed.rows.map((row) => ({ id: row["gate-id"] }));
  }

  const guidePath = path.join(root, GUIDE_REL);
  const guide = fs.existsSync(guidePath) ? fs.readFileSync(guidePath, "utf8") : "";
  const charter = guide === "" ? "" : charterSectionOf(guide);
  const profile = guide === "" ? null : readCeremonyProfile(charter === "" ? guide : charter);
  let surfaces = [...CEREMONY_REVIEW_SURFACES];
  let narrowed = false;
  let profileReason = "no ceremony profile declared";
  if (profile !== null && "refusals" in profile && profile.ok === false) {
    profileReason = `ceremony-profile@1 refused — ${profile.refusals.map((row) => row.reason).join(", ")}`;
  } else if (profile !== null && profile.ok === true && profile.profile.reviewPasses !== null) {
    surfaces = profile.profile.reviewPasses.slice();
    narrowed = true;
    profileReason = "narrowed by the guide's ceremony profile";
  }
  const passes = surfaces.map((axis) => ({ name: axis, axis }));

  return {
    gates,
    passes,
    source: {
      gates: inventoryPresent ? INVENTORY_REL : "absent",
      passes: narrowed ? "ceremony-profile@1" : "workflow review pack",
      narrowed,
      profileReason,
    },
  };
}

/** Resolve one backticked criterion token against the detectors. */
function resolveToken(token, { root, detectors }) {
  if (detectors.gates.some((gate) => gate.id === token)) return { kind: "gate", id: token };
  const pass = detectors.passes.find((entry) => entry.axis === token || entry.name === token || `review-${entry.axis}` === token);
  if (pass) return { kind: "pass", id: pass.axis };
  if (pathResolves(token, root)) return { kind: "path", id: token };
  const head = String(token).trim().split(/\s+/)[0];
  if (COMMAND_HEADS.includes(head)) return { kind: "command", id: head };
  return null;
}

/** The axis tokens the detectors declare (a gate id names its own axis token). */
function detectorAxes(detectors) {
  return new Set([...detectors.gates.map((gate) => gate.id), ...detectors.passes.map((entry) => entry.axis)]);
}

/**
 * The join itself — pure in its inputs so a fixture and the live tree are the
 * same code path. `corpus` is a summary (`present`, `admitted`, `classes`), so
 * this function never reads a ledger.
 */
export function evaluateCoverage({ catalogue, detectors, corpus, root }) {
  const cataloguePresent = catalogue !== null && catalogue !== undefined;
  const criteria = cataloguePresent ? catalogue.criteria : [];
  const rows = [];
  const consumedGates = new Set();

  for (const criterion of criteria) {
    const resolved = [];
    const refused = [];
    for (const token of criterion.tokens) {
      const answer = resolveToken(token, { root, detectors });
      if (answer === null) refused.push(token);
      else resolved.push(answer);
    }
    for (const answer of resolved) if (answer.kind === "gate") consumedGates.add(answer.id);
    const problems = [];
    if (!provenanceKnown(criterion.provenance)) problems.push(`provenance \`${criterion.provenance}\` is outside the closed set`);
    if (criterion.tokens.length === 0) problems.push("names none — no backticked check in Source / authority or Notes");
    if (resolved.length === 0 && refused.length > 0) problems.push(`names ${refused.join(", ")} — no detector resolves it`);
    if (problems.length > 0) {
      rows.push({
        kind: "criterion-uncovered",
        subject: criterion.name,
        detail: problems.join("; "),
        evidence: `${CATALOGUE_REL}:${criterion.line}`,
      });
    }
  }

  const axes = detectorAxes(detectors);
  if (corpus.present) {
    for (const klass of corpus.classes) {
      if (!axes.has(klass.axis)) {
        rows.push({
          kind: "class-uncovered",
          subject: `${klass.axis} × ${klass.klass}`,
          detail: `n ${klass.n} · no detector names the axis`,
          evidence: "scripts/findings-corpus.mjs#classes",
        });
      }
    }
  }

  if (cataloguePresent) {
    for (const gate of detectors.gates) {
      if (!consumedGates.has(gate.id)) {
        rows.push({
          kind: "detector-idle",
          subject: gate.id,
          detail: "consumes no criterion",
          evidence: INVENTORY_REL,
        });
      }
    }
  }

  rows.sort((left, right) => {
    const kindOrder = GAP_KINDS.indexOf(left.kind) - GAP_KINDS.indexOf(right.kind);
    return kindOrder !== 0 ? kindOrder : left.subject.localeCompare(right.subject);
  });

  return {
    contract: COVERAGE_GAP_CONTRACT,
    catalogue: {
      present: cataloguePresent,
      path: CATALOGUE_REL,
      criteria: criteria.length,
    },
    detectors: {
      gates: detectors.gates.length,
      passes: detectors.passes.length,
      consuming: consumedGates.size,
      source: detectors.source,
    },
    corpus: {
      present: Boolean(corpus.present),
      admitted: corpus.present ? corpus.admitted : 0,
      classes: corpus.present ? corpus.classes.length : 0,
    },
    edges: {
      "criterion→detector": cataloguePresent ? "checked" : "n/a — catalogue absent",
      "class→detector": corpus.present ? "checked" : "n/a — corpus absent",
      "detector→criterion": cataloguePresent ? "checked" : "n/a — catalogue absent",
    },
    rows,
    verdict: "clean",
  };
}

/** The verdict, from the three input flags and the gap rows. */
function verdictOf({ catalogue, detectors, corpus, rows }) {
  if (rows.length > 0) return `gaps ${rows.length}`;
  if (!catalogue.present && detectors.source.gates === "absent" && !corpus.present) return "insufficient-input";
  return "clean";
}

/** The fixed receipt block: inputs, edges, one line per gap, the verdict. */
export function renderReceipt(result) {
  const lines = [result.contract];
  lines.push(
    result.catalogue.present
      ? `catalogue | present · ${result.catalogue.path} · criteria ${result.catalogue.criteria}`
      : `catalogue | absent · ${result.catalogue.path}`,
  );
  lines.push(
    result.detectors.source.gates === "absent"
      ? `detectors | absent · ${INVENTORY_REL} · passes ${result.detectors.passes}`
      : `detectors | present · ${INVENTORY_REL} · gates ${result.detectors.gates} · passes ${result.detectors.passes} · consuming ${result.detectors.consuming}`,
  );
  lines.push(
    result.corpus.present
      ? `corpus | present · admitted ${result.corpus.admitted} · classes ${result.corpus.classes}`
      : "corpus | absent · no unit ledger was read",
  );
  for (const [edge, value] of Object.entries(result.edges)) lines.push(`edge | ${edge} · ${value}`);
  for (const row of result.rows) {
    lines.push(
      row.kind === "criterion-uncovered"
        ? `gap — ${row.kind} · ${row.subject} · ${row.detail} · ${row.evidence}`
        : `gap — ${row.kind} · ${row.subject} · ${row.detail}`,
    );
  }
  lines.push(`verdict | ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

/** Read the three carriers and join them. Throws `CoverageGapRefusal` when a
 *  carrier exists but cannot be read. */
export function buildCoverageGap(root) {
  const cataloguePath = path.join(root, CATALOGUE_REL);
  const catalogue = fs.existsSync(cataloguePath) ? parseCatalogue(fs.readFileSync(cataloguePath, "utf8")) : null;
  const detectors = readDetectors(root);

  const corpus = buildCorpus(root, { resolveFold: makeGitFoldResolver(root) });
  if (corpus.unparsable.length > 0) {
    const detail = corpus.unparsable.map((row) => `${row.file}:${row.line} — ${row.reason}`).join("\n");
    throw new CoverageGapRefusal(`unparsable findings rows:\n${detail}`);
  }
  const summary = {
    present: corpus.findings.length > 0,
    admitted: corpus.admitted.length,
    classes: corpus.classes.map((row) => ({ axis: row.axis, klass: row.klass, n: row.n })),
  };

  const result = evaluateCoverage({ catalogue, detectors, corpus: summary, root });
  result.verdict = verdictOf(result);
  return result;
}

const USAGE = "usage: coverage-gap.mjs [<dir> | --repo <dir>]";

function main(argv) {
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let dirGiven = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (!value) {
        process.stderr.write(`coverage-gap: --repo needs a directory\n${USAGE}\n`);
        return 2;
      }
      if (dirGiven) {
        process.stderr.write(`coverage-gap: one directory only, --repo and a path were both given\n${USAGE}\n`);
        return 2;
      }
      root = path.resolve(value);
      dirGiven = true;
      index += 1;
    } else if (!arg.startsWith("-")) {
      // The reference's own spelling — `bun scripts/coverage-gap.mjs <repo>` —
      // is a legal directory argument, equal to --repo (EXTERNAL VERIFY B2).
      if (dirGiven) {
        process.stderr.write(`coverage-gap: one directory only, two were given\n${USAGE}\n`);
        return 2;
      }
      root = path.resolve(arg);
      dirGiven = true;
    } else {
      process.stderr.write(`coverage-gap: unknown argument ${arg}\n${USAGE}\n`);
      return 2;
    }
  }

  let result;
  try {
    result = buildCoverageGap(root);
  } catch (error) {
    if (error instanceof CoverageGapRefusal) {
      process.stderr.write(`coverage-gap: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
  process.stdout.write(renderReceipt(result));
  return result.verdict === "insufficient-input" ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
