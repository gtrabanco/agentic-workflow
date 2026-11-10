// discovery.mjs — config extension discovery (issue #427).
//
// A package publishes a config section by shipping a descriptor and naming it
// from its package.json (`agenticWorkflow.config`). An operator may also drop a
// descriptor into `config-extensions/` at either scope. Discovery reads data
// only: it never executes code from an extension.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { CONFIG_EXTENSION_CONTRACT, parseJsonc, validateConfigExtension } from "@gtrabanco/agentic-workflow-schema";

export const CONFIG_EXTENSIONS_DIR_NAME = "config-extensions";

function readJsonFile(path) {
  const parsed = parseJsonc(readFileSync(path, "utf8"));
  return parsed.ok ? parsed.value : undefined;
}

function loadDescriptor(path, source, issues) {
  if (!existsSync(path)) {
    issues.push({ path: source, message: `declared config extension does not exist: ${path}` });
    return undefined;
  }
  let value;
  try {
    value = readJsonFile(path);
  } catch (error) {
    issues.push({ path: source, message: `cannot read ${path} (${error.code ?? "read error"})` });
    return undefined;
  }
  if (value === undefined) {
    issues.push({ path: source, message: `${path} is not valid JSONC` });
    return undefined;
  }
  const descriptorIssues = validateConfigExtension(value);
  if (descriptorIssues.length > 0) {
    issues.push(...descriptorIssues.map((issue) => ({ path: `${source}:${issue.path}`, message: issue.message })));
    return undefined;
  }
  return { descriptor: value, source };
}

function packageDirectories(projectDir) {
  const roots = [join(projectDir, "node_modules"), join(projectDir, "node_modules", "@gtrabanco")];
  const directories = [];
  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root)) {
      const candidate = join(root, entry);
      if (!statSync(candidate).isDirectory()) continue;
      if (existsSync(join(candidate, "package.json"))) directories.push(candidate);
    }
  }
  return directories;
}

function dropInDescriptors(root) {
  const dir = join(root, CONFIG_EXTENSIONS_DIR_NAME);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => join(dir, name));
}

export function discoverConfigExtensions({ projectDir, globalDir }) {
  const issues = [];
  const found = [];
  const seen = new Set();
  const accept = (discovered) => {
    if (discovered === undefined) return;
    if (seen.has(discovered.descriptor.key)) {
      issues.push({ path: discovered.source, message: `duplicate config section "${discovered.descriptor.key}"` });
      return;
    }
    seen.add(discovered.descriptor.key);
    found.push(discovered);
  };

  for (const packageDir of packageDirectories(projectDir)) {
    let manifest;
    try {
      manifest = readJsonFile(join(packageDir, "package.json"));
    } catch {
      continue;
    }
    const agentic = manifest?.agenticWorkflow;
    if (typeof agentic !== "object" || agentic === null || Array.isArray(agentic)) continue;
    if (typeof agentic.config !== "string") continue;
    accept(loadDescriptor(resolve(packageDir, agentic.config), join(packageDir, "package.json"), issues));
  }

  for (const path of [...dropInDescriptors(projectDir), ...(globalDir === undefined ? [] : dropInDescriptors(globalDir))]) {
    accept(loadDescriptor(path, path, issues));
  }

  return { extensions: found, issues };
}

export { CONFIG_EXTENSION_CONTRACT };
