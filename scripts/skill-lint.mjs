#!/usr/bin/env node
/**
 * skill-lint.mjs — the mechanical half of `skills/skill-lint` (fix #357).
 *
 * The eight checks it runs — a hidden HTML comment, an XML/HTML tag in the
 * frontmatter description, an invisible codepoint, an unpinned external URL, a
 * credential-access or exfiltration-shaped instruction, a Windows-style
 * backslash path, a dated currency claim, a frontmatter flow scalar — are owned
 * by `skills/skill-lint/references/CHECKS.md`, together with the declared
 * allowances and the smells this repository deliberately does not adopt.
 *
 * Since issue #591 the checks themselves live in the crate
 * (`packages/agentic-workflow/src/skills/screen.mjs`), because the discovery route
 * screens a candidate's tree with the very same code a target project installs.
 * This file is the repository's CLI over that engine: it owns the argv, the
 * block and the exit codes, and the engine owns what a finding is.
 *
 * Usage
 *   bun scripts/skill-lint.mjs                     (node fallback, same argv)
 *   bun scripts/skill-lint.mjs --root <dir>        scan another tree's skills/
 *   bun scripts/skill-lint.mjs --skill <name> …    report the named skill(s) only
 *   bun scripts/skill-lint.mjs --json              the same verdict, machine shape
 *
 * Scope: every `*.md` under `<root>/skills/` — the `SKILL.md` and its
 * `references/`, because `npx skills add` ships the folder and an installing
 * agent reads both.
 *
 * stdout: one fixed, byte-stable block — a `skill-lint —` header naming the
 * scope and the check count, one `FINDING <id> <name> <path>:<line> — <detail>`
 * line per finding in path and line order, a tally, then `verdict`.
 * exit: 0 only when the verdict is `PASS`; 1 when it is `FAIL`; 2 on a usage
 * error (an unknown flag, or a `--skill` that is not in the tree).
 *
 * Read-only: it writes nothing, calls no network, has no external dependency,
 * and holds no state between runs — the same bytes always print the same block.
 * Its sibling suite is `scripts/skill-lint.test.mjs` (one fixture per check,
 * the ablation of each, and the shipped tree's clean pin).
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { SKILL_SCREEN_CHECKS, discoverSkillFiles, screenSkillTree } from "../packages/agentic-workflow/src/skills/screen.mjs";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function usage(message) {
  process.stderr.write(`skill-lint: ${message}\n`);
  process.stderr.write("usage: bun scripts/skill-lint.mjs [--root <dir>] [--skill <name> ...] [--json]\n");
  process.exit(2);
}

function main(argv) {
  let root = null;
  let json = false;
  const only = [];
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json") json = true;
    else if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined) usage("--root needs a directory");
      root = path.resolve(value);
      index += 1;
    } else if (arg === "--skill") {
      const value = argv[index + 1];
      if (value === undefined) usage("--skill needs a skill name");
      only.push(value);
      index += 1;
    } else usage(`unknown argument ${arg}`);
  }

  const explicit = root !== null;
  root = root ?? DEFAULT_ROOT;
  if (!fs.existsSync(root)) usage(`root ${root} does not exist`);

  const { missing } = discoverSkillFiles({ root, only: [...new Set(only)] });
  if (missing.length > 0) usage(`no such skill in the tree: ${missing.join(", ")}`);

  const { files, findings, tally, verdict } = screenSkillTree({ root, only: [...new Set(only)] });
  const scope = explicit ? root : ".";

  if (json) {
    console.log(
      JSON.stringify(
        {
          root: scope,
          files: files.length,
          checks: SKILL_SCREEN_CHECKS,
          findings,
          tally,
          verdict,
        },
        null,
        2,
      ),
    );
    process.exit(verdict === "PASS" ? 0 : 1);
  }

  console.log(`skill-lint — ${files.length} file(s) · ${SKILL_SCREEN_CHECKS.length} check(s) · root ${scope}`);
  for (const finding of findings) console.log(`FINDING ${finding.id} ${finding.name} ${finding.file}:${finding.line} — ${finding.detail}`);
  console.log(`skill-lint: ${findings.length} finding(s) in ${tally.files} file(s)`);
  console.log(`verdict: ${verdict}`);
  process.exit(verdict === "PASS" ? 0 : 1);
}

main(process.argv.slice(2));
