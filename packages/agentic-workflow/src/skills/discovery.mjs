/**
 * discovery.mjs — the skill-discovery route's deterministic half (issue #591).
 *
 * `init-workspace` offers, after the charter round, to search the trusted
 * registries the owner names. The search itself is prose (it is a conversation
 * with a browser or a registry's CLI) and the install is the owner's yes; what
 * must not be prose is the gate between them:
 *
 *   1. every candidate is screened with the eight `skill-lint` checks
 *      (`./screen.mjs`, the same engine this repository's authoring lint runs)
 *      **before** any consent is asked — every skill file in the candidate's
 *      tree wherever it lives, and a tree that yields no skill file is
 *      excluded rather than screened clean;
 *   2. provenance is screened too — a source URL, an author, a version and a
 *      license, or the candidate is out;
 *   3. consent is per candidate, and a `yes` on a candidate that failed the
 *      screen is `blocked`, never installed;
 *   4. the install command is **text**: this module spawns nothing, fetches
 *      nothing and writes nothing.
 *
 * The report is the receipt: one `skill-discovery@1` block with a row per
 * candidate (its screen, its findings, its provenance, its consent record), a
 * summary and a verdict. Offline by contract.
 *
 * Evidence for the shape: Voyager (arXiv 2305.16291) and SAGE (arXiv 2512.17102)
 * — a skill library compounds when entries are filtered by demonstrated value,
 * never by accumulation — and the agent-skills supply-chain studies the screen
 * mechanizes (`skills/skill-lint/references/CHECKS.md`).
 */

import fs from "node:fs";
import path from "node:path";

import {
  SKILL_CONSENT_ANSWERS,
  SKILL_SCREEN_VERDICTS,
} from "@gtrabanco/agentic-workflow-schema";

import { screenCandidateTree } from "./screen.mjs";

/** The block this module prints, and the only contract a consumer binds. */
export const SKILL_DISCOVERY_CONTRACT_ID = "skill-discovery@1";

/** A candidate's screen outcome and its consent record — the schema package's
 *  published consts (owner: `vocabulary-residency@1`). */
export { SKILL_CONSENT_ANSWERS, SKILL_SCREEN_VERDICTS };

/** Where a candidate ends up: installable, skipped, or refused despite a yes. */
export const SKILL_CANDIDATE_DECISIONS = Object.freeze(["install", "skip", "blocked"]);

/** The provenance cells a candidate must declare — the issue's four basics. */
const PROVENANCE_CELLS = Object.freeze(["source", "author", "version", "license"]);

/** A refusal the caller reports as `SKILLS REFUSAL — <message>` (exit 2). */
export class SkillDiscoveryRefusal extends Error {}

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * Parse a candidates manifest (`{ candidates: [...] }`).
 * A candidate needs a `name` and a `tree`; every other cell is optional here and
 * screened as provenance (a missing one excludes the candidate — it is not a
 * malformed manifest).
 *
 * @param {unknown} payload
 * @returns {{ name: string, source: string, author: string, version: string, license: string, tree: string }[]}
 */
export function parseCandidates(payload) {
  if (!isObject(payload)) throw new SkillDiscoveryRefusal("the candidates manifest is not an object");
  if (!Array.isArray(payload.candidates)) throw new SkillDiscoveryRefusal("the candidates manifest carries no `candidates` array");
  return payload.candidates.map((candidate, index) => {
    if (!isObject(candidate)) throw new SkillDiscoveryRefusal(`candidate ${index + 1} is not an object`);
    const name = text(candidate.name);
    const tree = text(candidate.tree);
    if (name === "") throw new SkillDiscoveryRefusal(`candidate ${index + 1} declares no name`);
    if (tree === "") throw new SkillDiscoveryRefusal(`candidate ${name} declares no tree`);
    return {
      name,
      source: text(candidate.source),
      author: text(candidate.author),
      version: text(candidate.version),
      license: text(candidate.license),
      tree,
    };
  });
}

/**
 * Parse a consent file (`{ consent: { "<candidate>": "yes" | "no" } }`).
 * @param {unknown} payload
 * @returns {Record<string, "yes"|"no">}
 */
export function parseConsent(payload) {
  if (payload === undefined || payload === null) return {};
  if (!isObject(payload)) throw new SkillDiscoveryRefusal("the consent file is not an object");
  const consent = payload.consent ?? {};
  if (!isObject(consent)) throw new SkillDiscoveryRefusal("the consent file carries no `consent` object");
  const out = {};
  for (const [name, answer] of Object.entries(consent)) {
    const value = text(answer);
    if (value !== "yes" && value !== "no") throw new SkillDiscoveryRefusal(`consent for ${name} is "${value}": it must be "yes" or "no"`);
    out[name] = value;
  }
  return out;
}

/** The install command, as text — the documented source form, never executed. */
export const installCommandFor = (source) => `npx skills add ${source}`;

/** The candidate's tree, resolved against the project root it was declared in. */
const resolveTree = (root, tree) => (path.isAbsolute(tree) ? tree : path.resolve(root, tree));

/** Whether a path is a readable directory. */
const isDirectory = (target) => {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
};

/**
 * Evaluate one candidate: screen its tree, screen its provenance, apply its
 * consent record, and decide.
 * @param {{ candidate: ReturnType<typeof parseCandidates>[number], consent?: "yes"|"no", root: string }} input
 */
export function evaluateCandidate({ candidate, consent = "pending", root }) {
  const tree = resolveTree(root, candidate.tree);
  const missing = PROVENANCE_CELLS.filter((cell) => candidate[cell] === "");
  const provenance = missing.length === 0 ? "complete" : "incomplete";

  let screen;
  let excludedReason = null;
  if (!isDirectory(tree)) {
    screen = { verdict: "excluded", files: 0, findings: [] };
    excludedReason = "tree-unreadable";
  } else {
    const result = screenCandidateTree({ root: tree });
    if (result.files.length === 0) {
      screen = { verdict: "excluded", files: 0, findings: [] };
      excludedReason = "no-skill-files";
    } else {
      screen = {
        verdict: result.verdict === "PASS" ? "screened" : "excluded",
        files: result.files.length,
        findings: result.findings,
      };
      if (result.verdict !== "PASS") excludedReason = "screen-failed";
    }
  }

  if (provenance === "incomplete") excludedReason = "provenance-incomplete";

  const excluded = screen.verdict === "excluded" || provenance === "incomplete";
  const decision = consent === "yes" ? (excluded ? "blocked" : "install") : "skip";

  return {
    name: candidate.name,
    source: candidate.source,
    pin: candidate.version,
    author: candidate.author,
    license: candidate.license,
    tree: candidate.tree,
    provenance,
    provenanceMissing: missing,
    screen,
    excludedReason,
    consent,
    decision,
    installCommand: decision === "install" ? installCommandFor(candidate.source) : null,
  };
}

/**
 * Build the whole report from a raw manifest, an optional consent map and the
 * project root the candidates' trees resolve against.
 * @param {{ payload: unknown, consent?: unknown, root: string }} input
 */
export function buildDiscoveryReport({ payload, consent, root }) {
  const candidates = parseCandidates(payload);
  const answers = consent === undefined ? {} : parseConsent({ consent });
  const rows = candidates.map((candidate) => evaluateCandidate({ candidate, consent: answers[candidate.name] ?? "pending", root }));
  const count = (predicate) => rows.filter(predicate).length;
  const summary = {
    candidates: rows.length,
    screened: count((row) => row.screen.verdict === "screened"),
    excluded: count((row) => row.screen.verdict === "excluded" || row.provenance === "incomplete"),
    consented: count((row) => row.consent !== "pending"),
    installable: count((row) => row.decision === "install"),
    blocked: count((row) => row.decision === "blocked"),
  };
  const verdict = summary.blocked === 0 ? "pass" : "blocked";
  return { contract: SKILL_DISCOVERY_CONTRACT_ID, root, candidates: rows, summary, verdict, exitCode: verdict === "pass" ? 0 : 1 };
}

/**
 * The fixed text block a caller prints (and a reviewer re-runs).
 * @param {ReturnType<typeof buildDiscoveryReport>} report
 */
export function renderDiscovery(report) {
  const { summary } = report;
  const lines = [
    `${report.contract} — ${summary.candidates} candidate(s) · screened ${summary.screened} · excluded ${summary.excluded} · consented ${summary.consented}`,
  ];
  for (const row of report.candidates) {
    lines.push(`CANDIDATE ${row.name} — ${row.decision} · screen ${row.screen.verdict} · provenance ${row.provenance} · consent ${row.consent}`);
    lines.push(`  source ${row.source} · pin ${row.pin} · author ${row.author} · license ${row.license} · tree ${row.tree}`);
    if (row.provenanceMissing.length > 0) lines.push(`  reason provenance-incomplete — missing ${row.provenanceMissing.join(", ")}`);
    else if (row.excludedReason !== null) lines.push(`  reason ${row.excludedReason}`);
    for (const finding of row.screen.findings) lines.push(`  FINDING ${finding.id} ${finding.name} ${finding.file}:${finding.line} — ${finding.detail}`);
    if (row.installCommand !== null) lines.push(`  install: ${row.installCommand}`);
  }
  lines.push(
    `summary: candidates ${summary.candidates} · screened ${summary.screened} · excluded ${summary.excluded} · consented ${summary.consented} · installable ${summary.installable} · blocked ${summary.blocked}`,
  );
  lines.push(`verdict: ${report.verdict}`);
  return `${lines.join("\n")}\n`;
}
