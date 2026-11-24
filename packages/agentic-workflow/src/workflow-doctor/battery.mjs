/**
 * battery.mjs — the live battery (issue #703 S5/S11/S12/S14b).
 *
 * The miner reads what the project *wrote*; this reads what the project *is*,
 * with the same rule: every fact comes from its owner, and nothing is
 * re-derived.
 *
 *   doctor    the tool doctor's `doctor@1` envelope, **as-is** (`S11`). A check
 *             added to the doctor rides this receipt with no change here, and an
 *             unavailable doctor is a refusal — never a fabricated healthy row.
 *   runner    the crate's own version (its manifest) beside the pin the installed
 *             skills cite, classified `match`/`mismatch`/`unknown`.
 *   skills    the installed skill set, located declared-over-discovered: the
 *             `--skills-root` declaration, the host's `AGENTIC_WORKFLOW_SKILLS_ROOT`
 *             (the pi package publishes its mounted tree there at session start),
 *             the documented install dirs `.agents/skills` and `.claude/skills`,
 *             and the authoring/source `skills/` tree last — never a guessed
 *             project-root layout (the #716/#717 defect class).
 *   ceremony  the guide's `ceremony-profile@1` block through its reader and, when
 *             the operator names one, the unit's recorded tier through
 *             `recordedTier` (`S14b` answered: the battery reads the tier).
 *   receipts  `n/a` until the typed receipt carriers land (#698): naming the
 *             absence is the honest cell, not an empty one.
 *
 * Read-only: bytes in, one envelope out, nothing written.
 */

import fs from "node:fs";
import path from "node:path";

import { runDoctor } from "../doctor/doctor.mjs";
import { charterSectionOf, readCeremonyProfile } from "../runner/ceremony-profile.mjs";
import { recordedTier } from "../runner/ceremony/tier.mjs";
import { UNIT_HOMES } from "./mine.mjs";
import { BATTERY_CONTRACT, DoctorRefusal, SKILLS_ROOT_ENV } from "./vocabulary.mjs";

/** The tree-relative pin path — the launcher pin the installed skills cite. */
export const PIN_IN_TREE = "runner-contract/references/RUNNER.md";

/**
 * The convention install roots the battery probes, in precedence order after
 * the two declarations (`--skills-root`, then the host's env): the skills CLI's
 * cross-agent target, Claude Code's project target, and the authoring/source
 * tree last. Every entry is a documented install surface — the single-repo
 * assumption class (#716/#717) is what this list exists to avoid, so a tree
 * that lives somewhere else is *declared*, never guessed.
 */
export const SKILLS_CONVENTIONS = Object.freeze([
  { source: "agents", rel: ".agents/skills" },
  { source: "claude-code", rel: ".claude/skills" },
  { source: "source", rel: "skills" },
]);

/** The guide's project-relative home. */
export const GUIDE_REL = "AGENTS.md";

/** The launcher a pin names, e.g. `@gtrabanco/agentic-workflow@4.10.1`. */
const PIN = /@gtrabanco\/agentic-workflow@([0-9][^\s`]*)/u;

/** The crate's own version — the manifest beside this module tree. */
function crateVersion() {
  try {
    const manifest = JSON.parse(fs.readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
    return typeof manifest.version === "string" ? manifest.version : null;
  } catch {
    return null;
  }
}

/** Read the pin the skills in the given tree cite, or `null`. */
function runnerPin(tree) {
  const file = path.join(tree, PIN_IN_TREE);
  if (!fs.existsSync(file)) return null;
  const match = PIN.exec(fs.readFileSync(file, "utf8"));
  return match === null ? null : match[1];
}

/** Frontmatter `name:`/`user-invocable:` of one SKILL.md, tolerantly. */
function skillMeta(text) {
  const lines = String(text ?? "").split(/\r?\n/u);
  const meta = { name: null, userInvocable: false };
  if (lines[0]?.trim() !== "---") return meta;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "---") break;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim().replace(/^["']|["']$/gu, "");
    if (key === "name" && value !== "") meta.name = value;
    if (key === "user-invocable") meta.userInvocable = value === "true";
  }
  return meta;
}

/** The installed skill set under one skills tree. */
function skillSet(tree) {
  const names = [];
  let userInvocable = 0;
  for (const entry of fs.readdirSync(tree, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    if (!entry.isDirectory()) continue;
    const file = path.join(tree, entry.name, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const meta = skillMeta(fs.readFileSync(file, "utf8"));
    names.push(meta.name ?? entry.name);
    if (meta.userInvocable) userInvocable += 1;
  }
  return { count: names.length, userInvocable, names };
}

/** The tree as the receipt spells it: project-relative when under the root, absolute when the host mounts it elsewhere. */
function receiptPath(root, dir) {
  const relative = path.relative(root, dir);
  return relative === "" || relative.startsWith("..") ? dir : relative;
}

/**
 * Locate the installed skills tree: declared over discovered, never a guessed
 * project-root layout (the #716/#717 defect class). An explicit `--skills-root`
 * wins, then the host's `AGENTIC_WORKFLOW_SKILLS_ROOT` declaration (the pi
 * package publishes its mounted tree there at session start), then the
 * documented convention install dirs, the authoring/source tree last.
 *
 * @param {{root: string, env?: object, skillsRoot?: string|null}} input
 * @returns {{source: string, dir: string}|null} the located tree, or `null`
 */
export function locateSkillsTree({ root, env = process.env, skillsRoot = null } = {}) {
  const declared = String(skillsRoot ?? "").trim();
  const host = String(env?.[SKILLS_ROOT_ENV] ?? "").trim();
  const anchor = (value) => (path.isAbsolute(value) ? value : path.join(root, value));
  const candidates = [
    ...(declared === "" ? [] : [{ source: "declared", dir: anchor(declared) }]),
    ...(host === "" ? [] : [{ source: "host", dir: anchor(host) }]),
    ...SKILLS_CONVENTIONS.map((convention) => ({ source: convention.source, dir: path.join(root, convention.rel) })),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate.dir)) ?? null;
}

/** The guide's declared ceremony profile, or the refusal it carries. */
function ceremonyProfile(root) {
  const file = path.join(root, GUIDE_REL);
  if (!fs.existsSync(file)) return { guide: false, adoption: null, reviewPasses: null, refusals: [] };
  const section = charterSectionOf(fs.readFileSync(file, "utf8"));
  const read = section === null || section === "" ? null : readCeremonyProfile(section);
  if (read === null) return { guide: true, adoption: null, reviewPasses: null, refusals: [] };
  if (read.ok === false) return { guide: true, adoption: null, reviewPasses: null, refusals: read.refusals };
  return {
    guide: true,
    adoption: { ...read.profile.adoption },
    reviewPasses: read.profile.reviewPasses,
    refusals: [],
  };
}

/** The tier a named unit recorded, through the tier module's one reader. */
function unitTier(root, unit) {
  if (unit === null || unit === undefined || String(unit).trim() === "") return null;
  const token = String(unit).trim();
  for (const home of UNIT_HOMES) {
    const file = path.join(root, home, token, "SPEC.md");
    if (fs.existsSync(file)) return recordedTier(fs.readFileSync(file, "utf8"));
  }
  return null;
}

/**
 * Build the battery for one project.
 *
 * @param {string} root the project root
 * @param {{doctor?: () => Promise<object>, unit?: string, env?: object, skillsRoot?: string|null, ops?: object}} [options]
 * @returns {Promise<object>} the `workflow-doctor-battery@1` envelope
 */
export async function buildBattery(root, options = {}) {
  const projectDir = path.resolve(root);
  const degradations = [];

  let doctor;
  try {
    doctor = options.doctor === undefined || options.doctor === null ? await runDoctor({ root: projectDir }) : await options.doctor();
  } catch (error) {
    throw new DoctorRefusal(
      "doctor-unavailable",
      `the tool doctor refused: ${error?.code ?? error?.name ?? "unknown"} — ${error?.message ?? String(error)}`,
    );
  }

  const version = crateVersion();
  const located = locateSkillsTree({ root: projectDir, env: options.env ?? process.env, skillsRoot: options.skillsRoot ?? null });
  const skills = located === null
    ? { present: false, source: null, path: null, count: 0, userInvocable: 0, names: [] }
    : { present: true, source: located.source, path: receiptPath(projectDir, located.dir), ...skillSet(located.dir) };
  const pin = located === null ? null : runnerPin(located.dir);
  const pinMatch = pin === null || version === null ? "unknown" : pin === version ? "match" : "mismatch";
  if (located === null) {
    degradations.push({
      code: "skills-absent",
      detail: `no skills tree found; declare one with --skills-root <dir> or ${SKILLS_ROOT_ENV}; probed ${SKILLS_CONVENTIONS.map((convention) => convention.rel).join(", ")}`,
    });
  } else if (pin === null) {
    degradations.push({ code: "pin-absent", detail: `${PIN_IN_TREE} carries no launcher pin under the located tree` });
  }

  const profile = ceremonyProfile(projectDir);
  if (!profile.guide) degradations.push({ code: "guide-absent", detail: `${GUIDE_REL} is not present` });
  for (const refusal of profile.refusals) {
    degradations.push({ code: `profile-${refusal.reason ?? "refused"}`, detail: String(refusal.detail ?? "") });
  }

  const unit = options.unit === undefined || options.unit === null ? null : String(options.unit).trim() || null;
  const tier = unitTier(projectDir, unit);
  if (unit !== null && tier === null) degradations.push({ code: "tier-absent", detail: `unit ${unit} records no tier` });

  return {
    contract: BATTERY_CONTRACT,
    runner: { version, pin, pinMatch },
    skills,
    doctor,
    ceremony: {
      guide: profile.guide,
      adoption: profile.adoption,
      reviewPasses: profile.reviewPasses,
      unit,
      tier,
    },
    receipts: { state: "n/a", reason: "no typed receipt carrier" },
    degradations,
  };
}

/** The fixed human block: header, four fact lines, the absence cells, the verdict. */
export function renderBattery(receipt) {
  const profile = receipt.ceremony.adoption === null
    ? "none"
    : Object.entries(receipt.ceremony.adoption).map(([piece, value]) => `${piece}:${value}`).join(",");
  const summary = receipt.doctor.summary ?? {};
  const lines = [
    `WORKFLOW DOCTOR BATTERY — runner ${receipt.runner.version ?? "unknown"} · pin ${receipt.runner.pin ?? "unknown"} · ${receipt.runner.pinMatch}`,
    `skills: ${receipt.skills.count} installed (${receipt.skills.userInvocable} invocable)`
      + `${receipt.skills.present ? ` · from ${receipt.skills.source} at ${receipt.skills.path}` : " · no skills tree found"}`,
    `doctor: ${receipt.doctor.verdict ?? "unknown"} · ok ${summary.ok ?? 0} · missing ${summary.missing ?? 0} · mismatch ${summary.mismatch ?? 0} · advisories ${summary.advisories ?? 0}`,
    `ceremony: profile ${profile} · unit ${receipt.ceremony.unit ?? "none"} tier ${receipt.ceremony.tier ?? "none"}`,
    `receipts: ${receipt.receipts.state} — ${receipt.receipts.reason}`,
    `degradations: ${receipt.degradations.length === 0 ? "none" : receipt.degradations.map((item) => item.code).join(", ")}`,
    `contract ${receipt.contract}`,
  ];
  return lines.join("\n");
}
