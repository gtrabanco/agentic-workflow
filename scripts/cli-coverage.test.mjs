#!/usr/bin/env node
// test-obligation: protects=skills,template,packages/agentic-workflow/bin/agentic-workflow.mjs,packages/agentic-workflow/README.md,skills/runner-contract/references/RUNNER.md obligations=distribution-contract,convention

/**
 * cli-coverage.test.mjs — the unit that makes "no shipped skill cites a script"
 * a fact instead of a promise (issue #553 S1/S2/S3/S6/S7).
 *
 * The workflow ships `skills/` and a documentation scaffold; it does not ship a
 * `scripts/` tree. A skill that tells a target agent to run
 * `bun scripts/<name>.mjs` therefore names a file that does not exist in the
 * project it is running in — the failure #424 deferred and this unit closes.
 *
 * The scan is the unit's own corpus, in both directions:
 *
 *   script-citation       a **shipped** skill cites `bun scripts/…`/`node
 *                         scripts/…`; the finding names the command the citation
 *                         should carry, or says the script is not migrated yet
 *   launcher-in-skill     a skill spells a launcher (`bunx`/`npx`/`pnpm dlx`)
 *                         instead of the symbolic `runner` form (RUNNER.md
 *                         §What a skill cites owns the rule)
 *   pin-in-skill          a skill restates the package version; the pin lives in
 *                         RUNNER.md's `runner-pin@1` and nowhere else
 *   repo-authoring        a shipped skill names one of the four scripts that are
 *                         this repository's own authoring tools (S6)
 *   template-citation     the scaffold cites a script tree it does not ship (S3)
 *   undocumented-command  a migrated shim's module has no router case, no
 *                         RUNNER.md row or no README row — the three surfaces a
 *                         reader (and #603's registry) must find
 *
 * The exemption is declared, not inferred from a path: a skill whose frontmatter
 * carries `metadata.internal: true` is this repository's own maintenance skill
 * and may cite a script (PE-013: exactly one such skill exists at cut).
 *
 * Usage
 *   bun test scripts/cli-coverage.test.mjs
 *   node --test scripts/cli-coverage.test.mjs        (the documented fallback)
 *
 * Read-only: it reads bytes and spawns the two entry points for the parity case,
 * which writes nothing.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS = path.join(ROOT, "skills");
const SCRIPTS = path.join(ROOT, "scripts");
const TEMPLATE = path.join(ROOT, "template");
const BIN = path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs");
const README = path.join(ROOT, "packages", "agentic-workflow", "README.md");
const RUNNER_DOC = path.join(ROOT, "skills", "runner-contract", "references", "RUNNER.md");
const RUNNER_TABLE = path.join(ROOT, "packages", "agentic-workflow", "src", "runner", "cli.mjs");

/** The symbol a skill cites instead of a path: RUNNER.md §What a skill cites. */
export const SYMBOLIC_FORM = "runner";
/** The four scripts that are this repository's own authoring tools (S6). */
export const REPO_AUTHORING = Object.freeze(["skill-lint", "release", "version-parity-gate", "lint-changeset"]);

const CITATION = /\b(bun|node)\s+scripts\/([a-z0-9-]+)\.mjs/g;
const LAUNCHER = /\b(bunx|npx|pnpm\s+dlx)\s+(?:--?\S+\s+)*@?[\w@/.-]*agentic-workflow/g;
const PIN = /@gtrabanco\/agentic-workflow@(\d+\.\d+\.\d+|latest)/g;

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

/** One row per skill directory: its name, whether it declares itself internal, and its markdown files. */
export function readSkills() {
  return fs
    .readdirSync(SKILLS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dir = path.join(SKILLS, entry.name);
      const head = path.join(dir, "SKILL.md");
      const frontmatter = fs.existsSync(head) ? read(head).split("\n---")[0] : "";
      return {
        name: entry.name,
        dir,
        internal: /^\s*internal:\s*true\s*$/mu.test(frontmatter),
        files: walk(dir),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The prose lines of a markdown file. A fenced block is a value or grammar
 * carrier — the same convention the document verifier applies to cited paths
 * ("fenced verbatim quotes are not claims") — so a published `runner-pin@1`
 * value or a candidate table inside one is never read as a skill's citation.
 */
export function proseLines(file) {
  const lines = [];
  let fenced = false;
  for (const [index, line] of read(file).split("\n").entries()) {
    if (/^\s*```/u.test(line)) {
      fenced = !fenced;
      continue;
    }
    if (!fenced) lines.push([index + 1, line]);
  }
  return lines;
}

/** Every `scripts/<stem>.mjs` a markdown file cites, with its file and line. */
export function citations(file) {
  const found = [];
  for (const [index, line] of proseLines(file)) {
    for (const match of line.matchAll(CITATION)) {
      found.push({ script: match[2], runner: match[1], file, line: index, text: line.trim() });
    }
  }
  return found;
}

/**
 * The shims: `scripts/<stem>.mjs` that declares the command it forwards to, as
 * `// cli-command: <name>` in its head. The marker is explicit because a crate
 * import alone proves nothing — most scripts import `src/runner/…` helpers and
 * would be misread as forwarding to `runner`.
 */
export function shims() {
  const out = new Map();
  for (const entry of fs.readdirSync(SCRIPTS, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".mjs") || entry.name.endsWith(".test.mjs")) continue;
    const file = path.join(SCRIPTS, entry.name);
    const match = read(file).split("\n").slice(0, 8).join("\n").match(/^\/\/ cli-command: ([a-z0-9-]+)$/mu);
    if (match) out.set(entry.name.replace(/\.mjs$/u, ""), match[1]);
  }
  return out;
}

/**
 * The router's closed set of first tokens: the bin's own `case` arms plus the
 * runner dispatch table, which is where the runtime commands live (issue #352 —
 * one bin, two halves, one closed set).
 */
export function routerCommands() {
  const commands = new Set([...read(BIN).matchAll(/^\s*case "([a-z0-9-]+)":\s*\{/gmu)].map((m) => m[1]));
  for (const row of read(RUNNER_TABLE).matchAll(/^\s*(?:"([a-z0-9-]+)"|([a-z0-9-]+)):\s*[A-Za-z_$][\w$]*,\s*$/gmu)) {
    commands.add(row[1] ?? row[2]);
  }
  return commands;
}

/** The RUNNER.md `## Subcommands` rows: the first backticked token of each row. */
export function runnerRows() {
  const text = read(RUNNER_DOC);
  const start = text.indexOf("## Subcommands");
  assert.ok(start !== -1, "RUNNER.md carries no `## Subcommands` section");
  const rows = new Set();
  for (const line of text.slice(start).split("\n")) {
    if (!line.startsWith("| `")) continue;
    for (const token of line.matchAll(/`([a-z0-9-]+)/gu)) rows.add(token[1]);
  }
  return rows;
}

/** The README `## Commands` rows plus the usage line: every documented first token. */
export function readmeCommands() {
  const text = read(README);
  const start = text.indexOf("## Commands");
  assert.ok(start !== -1, "the crate README carries no `## Commands` section");
  const rows = new Set();
  for (const token of text.slice(start).matchAll(/^\| `([a-z0-9-]+)/gmu)) rows.add(token[1]);
  for (const token of text.slice(start).matchAll(/^usage: agentic-workflow <([^>]+)>/gmu)) {
    for (const name of token[1].split("|")) rows.add(name);
  }
  return rows;
}

/** The three undocumented-command surfaces a migrated shim must reach. */
export function undocumented() {
  const known = { router: routerCommands(), runner: runnerRows(), readme: readmeCommands() };
  const findings = [];
  for (const [script, command] of shims()) {
    for (const [surface, set] of Object.entries(known)) {
      if (!set.has(command)) findings.push({ script, command, surface });
    }
  }
  return findings;
}

/** Every shipped-skill finding the two citation rules produce. */
export function shippedFindings() {
  const migrated = shims();
  const findings = [];
  for (const skill of readSkills()) {
    if (skill.internal) continue;
    for (const file of skill.files) {
      for (const citation of citations(file)) {
        const command = migrated.get(citation.script);
        findings.push({
          code: "script-citation",
          skill: skill.name,
          ...citation,
          fix: command ? `${SYMBOLIC_FORM} ${command}` : `the script is not migrated yet — migrate it, or drop the citation if it is repo-only`,
        });
      }
      for (const [index, line] of proseLines(file)) {
        for (const match of line.matchAll(LAUNCHER)) {
          findings.push({ code: "launcher-in-skill", skill: skill.name, file, line: index, text: match[0] });
        }
        for (const match of line.matchAll(PIN)) {
          findings.push({ code: "pin-in-skill", skill: skill.name, file, line: index, text: match[0] });
        }
        for (const name of REPO_AUTHORING) {
          if (new RegExp(`scripts/${name}\\.mjs|\\b${name}\\.mjs\\b`, "u").test(line)) {
            findings.push({ code: "repo-authoring", skill: skill.name, file, line: index, text: line.trim() });
          }
        }
      }
    }
  }
  return findings;
}

/** The scaffold's own citations: `template/` ships no `scripts/` tree. */
export function templateFindings() {
  const findings = [];
  for (const file of walk(TEMPLATE)) {
    for (const citation of citations(file)) findings.push({ citation, file });
  }
  return findings;
}

function describe(findings) {
  return findings
    .map((finding) => {
      if (finding.citation) {
        return `${path.relative(ROOT, finding.file)}:${finding.citation.line} cites scripts/${finding.citation.script}.mjs — the scaffold ships no scripts/ tree`;
      }
      const where = `${path.relative(ROOT, finding.file)}:${finding.line}`;
      if (finding.code === "script-citation") return `${where} [${finding.skill}] cites scripts/${finding.script}.mjs — cite \`${finding.fix}\``;
      return `${where} [${finding.skill}] ${finding.code}: ${finding.text}`;
    })
    .join("\n");
}

test("a shipped skill never cites a script tree it does not ship", () => {
  const findings = shippedFindings();
  assert.deepEqual(
    findings.map((finding) => `${finding.code} ${path.relative(ROOT, finding.file)}:${finding.line}`),
    [],
    `shipped skills must cite the symbolic runner form, never a script path:\n${describe(findings)}`,
  );
});

test("the scaffold cites no script tree", () => {
  const findings = templateFindings();
  assert.deepEqual(
    findings.map((finding) => `${path.relative(ROOT, finding.file)}:${finding.citation.line}`),
    [],
    `template/ ships no scripts/ tree:\n${describe(findings)}`,
  );
});

test("every migrated shim reaches the router and both documentation tables", () => {
  const findings = undocumented();
  assert.deepEqual(
    findings.map((finding) => `${finding.script} → ${finding.command} missing from ${finding.surface}`),
    [],
    "a migrated command is one router case, one RUNNER.md row and one README row",
  );
});

test("every migrated shim imports a module the package actually ships", () => {
  const missing = [];
  for (const [script] of shims()) {
    const file = path.join(SCRIPTS, `${script}.mjs`);
    // The shim names the crate module it forwards to; that file must exist and
    // live under the package's `src/`, which is what `files` publishes.
    const match = read(file).match(/import \{[^}]*\} from "(\.\.\/packages\/agentic-workflow\/src\/[^"]+)"/u);
    if (!match) {
      missing.push(`${script}: no crate import`);
      continue;
    }
    const target = path.resolve(path.dirname(file), match[1]);
    const inside = path.join(ROOT, "packages", "agentic-workflow", "src") + path.sep;
    if (!fs.existsSync(target) || !target.startsWith(inside)) missing.push(`${script} → ${match[1]}`);
  }
  assert.deepEqual(missing, [], "a shim forwards to a real module under the package's src/");
});

test("the symbolic form is legal in a shipped skill and the launcher forms are not", () => {
  // The rule is asserted by its own counter-example: the detector must catch the
  // three shapes, so a green run above means something (never a vacuous scan).
  const corpus = [
    ["bunx @gtrabanco/agentic-workflow@4.10.0 phase-lint x", true],
    ["npx --yes @gtrabanco/agentic-workflow@latest phase-lint x", true],
    ["pnpm dlx @gtrabanco/agentic-workflow phase-lint x", false],
  ];
  for (const [line, pinned] of corpus) {
    assert.ok([...line.matchAll(LAUNCHER)].length > 0, `the launcher detector misses: ${line}`);
    assert.equal([...line.matchAll(PIN)].length > 0, pinned, `the pin detector misses: ${line}`);
  }
  assert.deepEqual([...`Use the \`runner phase-lint <plan>\` form.`.matchAll(LAUNCHER)], []);
  assert.deepEqual([...`Use the \`runner phase-lint <plan>\` form.`.matchAll(PIN)], []);
});

test("the documented fallback and the crate entry point print identical bytes for the same argv", () => {
  const migrated = [...shims()].sort(([a], [b]) => a.localeCompare(b));
  assert.ok(migrated.length >= 2, `expected at least two migrated shims, found ${migrated.length}`);
  // No arguments: every command answers a deterministic usage or verdict block
  // and touches nothing, which is what makes the two entries comparable.
  for (const [script, command] of migrated.slice(0, 2)) {
    const shim = run([path.join(SCRIPTS, `${script}.mjs`)]);
    const cli = run([BIN, command]);
    assert.deepEqual(cli, shim, `\`runner ${command}\` and \`scripts/${script}.mjs\` must answer identically`);
  }
});

function run(argv) {
  try {
    const stdout = execFileSync(process.execPath, argv, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { stdout, stderr: "", status: 0 };
  } catch (error) {
    return { stdout: String(error.stdout ?? ""), stderr: String(error.stderr ?? ""), status: error.status ?? -1 };
  }
}
