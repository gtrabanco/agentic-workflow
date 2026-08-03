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
const requestedRoutes = [];
let manifestOnly = false;
let routeMode = false;
let jsonOutput = false;

for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--manifest-only") {
    manifestOnly = true;
  } else if (args[index] === "--skill") {
    const value = args[index + 1];
    if (!value) throw new Error("--skill requires a name");
    requested.push(value);
    index += 1;
  } else if (args[index] === "--routes") {
    routeMode = true;
  } else if (args[index] === "--json") {
    jsonOutput = true;
  } else if (args[index] === "--route") {
    const value = args[index + 1];
    if (!value) throw new Error("--route requires a name");
    requestedRoutes.push(value);
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

const resolveRouteFiles = (routeSkills) => {
  const files = [];
  const seen = new Set();
  for (const skill of routeSkills) {
    const skillDir = path.join(repoRoot, "skills", skill);
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!seen.has(skillFile)) {
      files.push(skillFile);
      seen.add(skillFile);
    }
    const body = fs.readFileSync(skillFile, "utf8");
    const linked = new Set([...body.matchAll(/\(references\/([^)]+\.md)\)/g)].map((match) => match[1]));
    const referencesDir = path.join(skillDir, "references");
    if (fs.existsSync(referencesDir)) {
      for (const name of fs.readdirSync(referencesDir).filter((n) => n.endsWith(".md")).sort()) {
        const refPath = path.join(referencesDir, name);
        if (!seen.has(refPath)) {
          files.push(refPath);
          seen.add(refPath);
        }
      }
    }
    for (const name of linked) {
      const refPath = path.join(referencesDir, name);
      if (!seen.has(refPath)) {
        files.push(refPath);
        seen.add(refPath);
      }
    }
  }
  return files;
};

const computeRouteMetrics = (files) => {
  let totalEstimate = 0;
  let totalLines = 0;
  const fileResults = [];
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) {
      return { error: `Missing file in route: ${filePath}`, totalEstimate: 0, totalLines: 0, files: [] };
    }
    const body = fs.readFileSync(filePath, "utf8");
    const est = estimate(body);
    const lines = lineCount(body);
    totalEstimate += est;
    totalLines += lines;
    fileResults.push({ path: path.relative(repoRoot, filePath), estimate: est, lines });
  }
  return { error: null, totalEstimate, totalLines, files: fileResults };
};

// Route mode
if (routeMode) {
  if (!manifest.routes) {
    throw new Error("No routes declared in manifest");
  }

  const routeNames = requestedRoutes.length > 0 ? requestedRoutes : Object.keys(manifest.routes);
  const routeFailures = [];
  const routeRows = [];

  for (const routeName of routeNames) {
    const routeDef = manifest.routes[routeName];
    if (!routeDef) {
      routeFailures.push(`Route not declared in manifest: ${routeName}`);
      continue;
    }

    let hasUnknown = false;
    for (const skill of routeDef.skills) {
      if (!discoveredSet.has(skill)) {
        routeFailures.push(`${routeName}: route references unknown skill: ${skill}`);
        hasUnknown = true;
      }
    }
    if (hasUnknown) continue;

    const resolvedFiles = resolveRouteFiles(routeDef.skills);
    const metrics = computeRouteMetrics(resolvedFiles);
    if (metrics.error) {
      routeFailures.push(`${routeName}: ${metrics.error}`);
      continue;
    }

    if (routeDef.routeEstimateMax !== null && metrics.totalEstimate > routeDef.routeEstimateMax) {
      routeFailures.push(`${routeName}: route estimate ${metrics.totalEstimate} > ${routeDef.routeEstimateMax}`);
    }
    if (routeDef.routeLinesMax !== null && metrics.totalLines > routeDef.routeLinesMax) {
      routeFailures.push(`${routeName}: route lines ${metrics.totalLines} > ${routeDef.routeLinesMax}`);
    }

    routeRows.push({
      route: routeName,
      skills: routeDef.skills.join(", "),
      fileCount: metrics.files.length,
      totalEstimate: metrics.totalEstimate,
      totalLines: metrics.totalLines,
      files: jsonOutput ? metrics.files : undefined,
    });
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ routes: routeRows, failures: routeFailures }, null, 2));
    if (routeFailures.length > 0) process.exit(1);
    process.exit(0);
  }

  console.log("route                        skills         files  est  lines");
  for (const row of routeRows) {
    console.log(
      `${row.route.padEnd(28)} ${row.skills.padEnd(14)} ${String(row.fileCount).padStart(5)} ${String(row.totalEstimate).padStart(5)} ${String(row.totalLines).padStart(6)}`,
    );
  }

  if (routeFailures.length > 0) {
    console.error("\nRoute budget failures:");
    for (const failure of routeFailures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`PASS route budgets: ${routeRows.length} routes`);
  process.exit(0);
}

// Per-file budget mode
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