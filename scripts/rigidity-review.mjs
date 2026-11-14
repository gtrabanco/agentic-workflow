#!/usr/bin/env node
/**
 * rigidity-review.mjs — the gate step that audits the guards themselves
 * (issue #546 S10).
 *
 * The guards this workflow ships lost their flexibility one literal at a time: a
 * forge binary named inline, a `${TMPDIR:-/tmp}` fallback, `origin/HEAD` written
 * as if every clone had one remote. Each was reasonable where it was written and
 * each made the workflow unusable for a fork contributor, a second machine or a
 * non-GitHub forge. Nothing caught the drift, because a guard's rigidity is not a
 * failing test — it is a passing one in an environment nobody has.
 *
 * So the guards are inventoried and audited: every shell file under the hooks
 * tree must be named here (a new guard cannot enter unaudited), and the rules a
 * row declares are the literals that file may not carry. The two facts that are
 * legitimately shared — which binary speaks a forge, which directory is writable —
 * live in `lib/forge.sh` and `lib/temp.sh`, the declared homes the rules exempt.
 *
 * Usage
 *   bun scripts/rigidity-review.mjs [--root <dir>]
 *   (node fallback, same argv)
 *
 * stdout, ok:    `RIGIDITY-REVIEW — ok: <n> guard file(s), <m> rule(s)` then
 *                `homes: lib/forge.sh, lib/temp.sh`
 * stdout, fail:  `RIGIDITY-REVIEW — failed: <k> finding(s) in <n> guard file(s)`
 *                then one `<path>:<line> <rule> — <evidence>` per finding
 *                (`<path> <rule> — …` for the two coverage rules)
 * exit: 0 ok, 1 findings, 2 usage error.
 *
 * Read-only: it reads files and prints. It writes nothing, runs nothing, calls no
 * network, and never repairs — the repair is deleting the literal it names.
 *
 * Its sibling suite is `scripts/rigidity-review.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const HOOKS = path.join("template", ".agentic-workflow", "hooks");

/**
 * The literals each rule refuses, and what the finding says.
 * `forge-cli` matches a forge binary *invoked* as a command, so prose that names
 * one ("`gh`, `glab` or `gt`") and a variable holding one (`"$cli" pr merge`) are
 * never findings — only a hardcoded binary in command position is.
 */
export const RULES = Object.freeze({
  "hardcoded-forge-cli": /\b(?:gh|glab|gt|tea|hub|d2)[ \t]+(?:pr|mr|api|repo|release|issue|merge)\b/u,
  "hardcoded-temp-fallback": /\$\{TMPDIR:-\/tmp\}|\bmktemp\b[^\n]*\/tmp|["']\/tmp\//u,
  "hardcoded-remote": /refs\/remotes\/origin\/|origin\/HEAD|origin\/main/u,
});

/** The declared homes: the one place each shared fact is allowed to live. */
export const HOMES = Object.freeze(["lib/forge.sh", "lib/temp.sh"]);

const RULES_ALL = ["hardcoded-forge-cli", "hardcoded-temp-fallback", "hardcoded-remote"];

/**
 * The guard inventory: every carrier that decides something an agent may do, and
 * the rules it must keep. A file that is not here fails the coverage rule, which
 * is the whole point — the audit reaches a new guard the day it lands.
 */
export const INVENTORY = Object.freeze([
  { path: `${HOOKS}/guard-command.sh`, rules: ["hardcoded-temp-fallback"], note: "its subject is the forge command line, so naming the binaries is the guard's job" },
  { path: `${HOOKS}/fullauto-merge.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/git-identity-check.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/index-sync.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/turn-contract.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/adapters/copilot-guard.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/adapters/normalize-hook-payload.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/adapters/pre-tool-guard.sh`, rules: RULES_ALL },
  { path: `${HOOKS}/lib/forge.sh`, rules: [], note: "the declared home for every forge binary" },
  { path: `${HOOKS}/lib/temp.sh`, rules: [], note: "the declared home for every temp directory candidate" },
  { path: "scripts/published-refs.mjs", rules: [], note: "the declared home for the mainline ref names" },
  { path: "scripts/push-identity-check.mjs", rules: ["hardcoded-temp-fallback"] },
  { path: "scripts/local-gate.mjs", rules: ["hardcoded-temp-fallback", "hardcoded-forge-cli"] },
]);

function usage(message) {
  process.stderr.write(`rigidity-review: ${message}\n`);
  process.stderr.write("usage: bun scripts/rigidity-review.mjs [--root <dir>]  (node fallback, same argv)\n");
  return 2;
}

/** Every shell file under the hooks tree that is not a suite or a library. */
function hookShellFiles(root) {
  const base = path.join(root, HOOKS);
  const found = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "tests" || entry.name === "lib") continue;
        walk(full);
        continue;
      }
      if (entry.name.endsWith(".sh")) found.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  walk(base);
  return found.sort();
}

export function audit({ root = DEFAULT_ROOT, inventory = INVENTORY } = {}) {
  const findings = [];
  for (const entry of inventory) {
    const full = path.join(root, entry.path);
    if (!fs.existsSync(full)) {
      findings.push({ path: entry.path, rule: "missing-guard", detail: "the inventory names a file that is not in the tree" });
      continue;
    }
    if (entry.rules.length === 0) continue;
    const lines = fs.readFileSync(full, "utf8").split("\n");
    for (const [index, line] of lines.entries()) {
      for (const rule of entry.rules) {
        const pattern = RULES[rule];
        if (pattern === undefined) {
          findings.push({ path: entry.path, rule: "unknown-rule", detail: `the inventory names a rule that does not exist: ${rule}` });
          continue;
        }
        if (pattern.test(line)) findings.push({ path: entry.path, rule, line: index + 1, detail: line.trim() });
      }
    }
  }
  const registered = new Set(inventory.map((entry) => entry.path));
  for (const file of hookShellFiles(root)) {
    if (!registered.has(file)) {
      findings.push({ path: file, rule: "unregistered-guard", detail: "a guard file the inventory does not audit — register it, or the audit reaches nothing it decides" });
    }
  }
  return findings;
}

export function renderFindings(findings, { files }) {
  const lines = [`RIGIDITY-REVIEW — failed: ${findings.length} finding(s) in ${files} guard file(s)`];
  for (const finding of findings) {
    const at = finding.line === undefined ? finding.path : `${finding.path}:${finding.line}`;
    lines.push(`  ${at} ${finding.rule} — ${finding.detail}`);
  }
  return `${lines.join("\n")}\n`;
}

export function renderOk({ files, rules }) {
  return [
    `RIGIDITY-REVIEW — ok: ${files} guard file(s), ${rules} rule(s)`,
    `homes: ${HOMES.join(", ")}`,
    "",
  ].join("\n");
}

export function main(argv) {
  let root = DEFAULT_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined || value === "") return usage("--root needs a directory");
      root = path.resolve(value);
      index += 1;
      continue;
    }
    return usage(`unknown argument ${arg}`);
  }
  if (!fs.existsSync(root)) return usage(`${root} is not a directory`);

  const findings = audit({ root });
  const files = INVENTORY.length;
  if (findings.length > 0) {
    process.stdout.write(renderFindings(findings, { files }));
    return 1;
  }
  const rules = new Set(INVENTORY.flatMap((entry) => entry.rules)).size;
  process.stdout.write(renderOk({ files, rules }));
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
