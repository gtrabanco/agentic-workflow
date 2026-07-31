#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(repoRoot, "docs/workflow/SKILL_CONTEXT_BUDGETS.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const skillsRoot = path.join(repoRoot, "skills");
const discovered = fs.readdirSync(skillsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(skillsRoot, entry.name, "SKILL.md")))
  .map((entry) => entry.name)
  .sort();
const args = process.argv.slice(2);
const requested = [];
let manifestOnly = false;

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--manifest-only") {
    manifestOnly = true;
  } else if (args[index] === "--skill") {
    const value = args[index + 1];
    if (!value) throw new Error("--skill requires a name");
    requested.push(value);
    index += 1;
  } else {
    throw new Error(`Unknown argument: ${args[index]}`);
  }
}

if (manifest.schemaVersion !== 1 || manifest.referenceDepth !== 1) {
  throw new Error("Unsupported context-budget manifest");
}

const budgeted = discovered;
const selected = requested.length > 0 ? [...new Set(requested)] : budgeted;
const discoveredSet = new Set(discovered);
for (const skill of selected) {
  if (!discoveredSet.has(skill)) throw new Error(`Skill entrypoint was not discovered: ${skill}`);
  const skillFile = path.join(repoRoot, "skills", skill, "SKILL.md");
  if (!fs.existsSync(skillFile)) throw new Error(`Missing skill entrypoint: ${skillFile}`);
}
for (const skill of Object.keys(manifest.skills)) {
  if (!discoveredSet.has(skill)) throw new Error(`Budget override has no skill entrypoint: ${skill}`);
}

if (manifestOnly) {
  console.log(`PASS context manifest: ${budgeted.length} discovered skills; ${Object.keys(manifest.skills).length} explicit overrides; reference depth 1`);
  process.exit(0);
}

const estimate = (text) => Math.ceil(Buffer.byteLength(text, "utf8") / 4);
const lineCount = (text) => text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
const nestedEntries = (directory, relative = "") => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryRelative = path.join(relative, entry.name);
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return [entryRelative, ...nestedEntries(entryPath, entryRelative)];
    return [entryRelative];
  });
};
const failures = [];
const rows = [];

for (const skill of selected) {
  const budget = { ...manifest.defaults, ...(manifest.skills[skill] ?? {}) };
  const skillDir = path.join(repoRoot, "skills", skill);
  const skillFile = path.join(skillDir, "SKILL.md");
  const body = fs.readFileSync(skillFile, "utf8");
  const mainEstimate = estimate(body);
  const mainLines = lineCount(body);
  const frontmatter = body.match(/^---\n([\s\S]*?)\n---/);
  const description = frontmatter?.[1].match(/^description:\s*>\n((?:[ \t]+.*\n?)*)/m)?.[1] ?? "";
  const descriptionEstimate = estimate(description);

  if (mainEstimate > budget.mainEstimateMax) {
    failures.push(`${skill}: main estimate ${mainEstimate} > ${budget.mainEstimateMax}`);
  }
  if (mainLines > budget.mainLinesMax) {
    failures.push(`${skill}: main lines ${mainLines} > ${budget.mainLinesMax}`);
  }
  if (descriptionEstimate > budget.descriptionEstimateMax) {
    failures.push(`${skill}: description estimate ${descriptionEstimate} > ${budget.descriptionEstimateMax}`);
  }

  const linked = new Set([...body.matchAll(/\(references\/([^)]+\.md)\)/g)].map((match) => match[1]));
  const referencesDir = path.join(skillDir, "references");
  const existing = fs.existsSync(referencesDir)
    ? fs.readdirSync(referencesDir).filter((name) => name.endsWith(".md")).sort()
    : [];
  for (const name of nestedEntries(referencesDir)) {
    if (name.includes(path.sep)) failures.push(`${skill}: nested reference path exceeds depth 1: ${name}`);
  }

  for (const name of linked) {
    if (name.includes("/") || name.includes("\\") || name.includes("..")) {
      failures.push(`${skill}: nested reference link exceeds depth 1: ${name}`);
      continue;
    }
    const referenceFile = path.join(referencesDir, name);
    if (!fs.existsSync(referenceFile)) {
      failures.push(`${skill}: linked reference is missing: ${name}`);
    }
  }
  for (const name of existing) {
    if (!linked.has(name)) failures.push(`${skill}: unreachable reference: ${name}`);
    const referenceBody = fs.readFileSync(path.join(referencesDir, name), "utf8");
    const referenceEstimate = estimate(referenceBody);
    const referenceLines = lineCount(referenceBody);
    const firstContentLine = referenceBody.split("\n").find((line) => line.trim() !== "") ?? "";
    if (referenceEstimate > budget.referenceEstimateMax) {
      failures.push(`${skill}/${name}: estimate ${referenceEstimate} > ${budget.referenceEstimateMax}`);
    }
    if (referenceLines > budget.referenceLinesMax) {
      failures.push(`${skill}/${name}: lines ${referenceLines} > ${budget.referenceLinesMax}`);
    }
    if (!/^#{1,3} /.test(firstContentLine)) {
      failures.push(`${skill}/${name}: first content line must be a heading`);
    }
    if (/\]\((?:\.\.\/)?references\//.test(referenceBody)) {
      failures.push(`${skill}/${name}: nested reference link exceeds depth 1`);
    }
  }

  rows.push({ skill, mainEstimate, mainLines, references: existing.length, descriptionEstimate });
}

console.log("skill              main-est  lines  refs  desc-est");
for (const row of rows) {
  console.log(
    `${row.skill.padEnd(18)} ${String(row.mainEstimate).padStart(8)} ${String(row.mainLines).padStart(6)} ${String(row.references).padStart(5)} ${String(row.descriptionEstimate).padStart(9)}`,
  );
}

if (failures.length > 0) {
  console.error("\nContext budget failures:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`PASS context budgets: ${rows.length} skills`);
