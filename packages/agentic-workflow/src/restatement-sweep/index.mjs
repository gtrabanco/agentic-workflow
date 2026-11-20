/**
 * restatement-sweep — the durable detector for "a rule restated where its
 * owner already says it" (issue #646 A6/S3b).
 *
 * The class regrows because a copy is cheap and invisible: `TESTS.md` restated
 * the red-first mechanism twice inside one file (one copy dropping the E-lines
 * requirement), six skills worded the review-authority rule six ways, and
 * `TEST_IMPACT.md` asserted it was "never restated" while its own package
 * restated it. `scripts/residue-dimensions.test.mjs` refuses only the rule names
 * it is seeded with, and `scripts/normative-drift.test.mjs` reads versioned
 * grammars — prose copies with no id were invisible to both.
 *
 * The seed set is a declared corpus, not a heuristic: every row names the rule,
 * its ONE owner, the phrase that identifies a restatement, and the scopes where
 * that restatement may appear. Three checks follow, and nothing else:
 *
 *   unowned-restatement  a scope file carries the phrase and does not name the
 *                        owner → the copy is unowned, which is the defect;
 *   stale-claim          a file that claims the rule is "never restated" is
 *                        measured: any unowned restatement in the rule's scope,
 *                        or a claim sentence that no longer exists, refuses it;
 *   uncovered-claim      a "never restated" sentence that names no declared
 *                        owner is an assertion nobody can check.
 *
 * A corpus that cannot be resolved refuses closed (`unresolved-owner`,
 * `malformed-corpus`, `empty-corpus`): an empty seed set is a defect, never a
 * pass, and a rule whose phrase matches nothing is reported as a dead seed.
 *
 * Usage
 *   restatement-sweep [--repo <dir>] [--json]
 *   restatement-sweep --help
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — a `restatement-sweep — ` header, one
 * `FINDING <code> — <rule>: <file> — <detail>` line per finding in file order,
 * one `NOTE <rule> — <detail>` per dead seed, a tally, then `verdict`.
 * Exit: 0 `PASS` · 1 `FAIL` or `REFUSED` · 2 a usage error.
 *
 * Its sibling suite is `scripts/restatement-sweep.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const SCRIPT_ROOT = process.cwd();

/** The corpus block's marker. Its home is the audit-docs reference that owns
 *  the sweep: `skills/audit-docs/references/RESTATEMENT.md`. */
export const CORPUS_MARKER = "restatement-corpus@1";
/** Where the corpus lives, repo-relative. */
export const CORPUS_PATH = "skills/audit-docs/references/RESTATEMENT.md";
/** The closed finding set, in report order. */
export const FINDING_CODES = Object.freeze([
  "unowned-restatement",
  "stale-claim",
  "uncovered-claim",
  "unresolved-owner",
  "malformed-corpus",
  "empty-corpus",
]);
/** The corpus's column order. */
export const CORPUS_COLUMNS = Object.freeze(["rule", "owner", "phrase", "scope", "allow", "claim"]);
/** The sentence that makes a file a claimant. */
export const CLAIM_PHRASE = "never restated";
const STAMP = "F-646-7";

/** Directories a sweep never descends into. */
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "coverage", ".worktrees"]);

/** One corpus row, or the faults the block carries. */
export function corpusRows(text) {
  const lines = String(text).split("\n");
  const at = lines.findIndex((line, index) => line.trim() === "```text" && lines[index + 1]?.trim() === CORPUS_MARKER);
  if (at === -1) return { rows: [], directives: {}, faults: [`${CORPUS_PATH}: no \`\`\`text block carrying ${CORPUS_MARKER}`] };
  const directives = {};
  const rows = [];
  const faults = [];
  let header = null;
  for (const line of lines.slice(at + 2)) {
    if (line.trim() === "```") break;
    const trimmed = line.trim();
    if (trimmed === "") continue;
    if (trimmed.startsWith("#")) {
      const directive = /^#\s*([a-z-]+):\s*(.*)$/.exec(trimmed);
      if (directive) directives[directive[1]] = directive[2].trim();
      continue;
    }
    const cells = trimmed.split("|").map((cell) => cell.trim());
    if (header === null) {
      header = cells;
      if (header.join("|") !== CORPUS_COLUMNS.join("|")) {
        faults.push(`the corpus header is "${header.join(" | ")}", expected "${CORPUS_COLUMNS.join(" | ")}"`);
      }
      continue;
    }
    if (cells.length !== CORPUS_COLUMNS.length) {
      faults.push(`row "${cells[0] ?? "?"}" carries ${cells.length} cells, expected ${CORPUS_COLUMNS.length}`);
      continue;
    }
    const [rule, owner, phrase, scope, allow, claim] = cells;
    rows.push({
      rule,
      owner,
      phrase,
      scope: scope.split(",").map((entry) => entry.trim()).filter(Boolean),
      allow: allow === "-" ? [] : allow.split(",").map((entry) => entry.trim()).filter(Boolean),
      claim: claim === "-" ? null : claim,
    });
  }
  return { rows, directives, faults };
}

/** A scope cell's globs as a predicate. `**` spans directories, `*` stays inside one. */
export function scopeMatcher(globs) {
  const patterns = globs.map((glob) => {
    const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*\/?/g, "\u0001").replace(/\*/g, "[^/]*");
    return new RegExp(`^${escaped.replace(/\u0001/g, ".*")}$`);
  });
  return (rel) => patterns.some((pattern) => pattern.test(rel));
}

/** Every file under `repo`, repo-relative, POSIX separators, sorted. */
function treeFiles(repo) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile()) {
        out.push(path.relative(repo, path.join(dir, entry.name)).split(path.sep).join("/"));
      }
    }
  };
  walk(repo);
  return out.sort();
}

const readIfText = (repo, rel) => {
  try {
    const body = fs.readFileSync(path.join(repo, rel), "utf8");
    return body.includes("\u0000") ? null : body;
  } catch {
    return null;
  }
};

/** Does `body` name `owner` — its path or its basename? */
function namesOwner(body, owner) {
  const basename = path.basename(owner);
  return body.includes(owner) || body.includes(basename);
}

const finding = (code, rule, file, detail) => ({ code, rule, file, detail });

/**
 * Sweep one repository. Read-only: it reads bytes and writes nothing.
 * `verdict` is `PASS`, `FAIL` (a finding) or `REFUSED` (the corpus itself).
 */
export function sweep(repo) {
  const files = treeFiles(repo);
  const corpusText = readIfText(repo, CORPUS_PATH);
  if (corpusText === null) {
    return {
      verdict: "REFUSED",
      findings: [finding("malformed-corpus", "-", CORPUS_PATH, "the corpus file does not exist")],
      unmatchedRules: [],
      matchedFiles: 0,
      rules: 0,
    };
  }
  const { rows, directives, faults } = corpusRows(corpusText);
  const findings = [];
  for (const fault of faults) findings.push(finding("malformed-corpus", "-", CORPUS_PATH, fault));
  if (rows.length === 0) findings.push(finding("empty-corpus", "-", CORPUS_PATH, "the corpus declares no rule, so a restatement cannot be refused"));

  const texts = new Map();
  const textOf = (rel) => {
    if (!texts.has(rel)) texts.set(rel, readIfText(repo, rel));
    return texts.get(rel);
  };

  const matched = new Set();
  const unmatchedRules = [];
  const perRule = new Map();

  for (const row of rows) {
    if (!files.includes(row.owner)) {
      findings.push(finding("unresolved-owner", row.rule, row.owner, `${row.rule}'s owner path does not exist, so a copy cannot be judged`));
      continue;
    }
    if (row.claim !== null && !files.includes(row.claim)) {
      findings.push(finding("stale-claim", row.rule, row.claim, `${row.rule}'s claimant does not exist`));
      continue;
    }
    const inScope = scopeMatcher(row.scope);
    const candidates = files.filter((rel) => inScope(rel) && rel !== row.owner && !row.allow.includes(rel));
    const unowned = [];
    let hits = 0;
    for (const rel of candidates) {
      const body = textOf(rel);
      if (body === null || !body.includes(row.phrase)) continue;
      hits += 1;
      matched.add(rel);
      if (namesOwner(body, row.owner)) continue;
      unowned.push(rel);
      findings.push(finding(
        "unowned-restatement",
        row.rule,
        rel,
        `restates "${row.phrase}" without naming its owner ${row.owner}`,
      ));
    }
    if (hits === 0) unmatchedRules.push(row.rule);
    perRule.set(row.rule, { unowned, hits, row });

    if (row.claim !== null) {
      const body = textOf(row.claim) ?? "";
      if (!body.includes(CLAIM_PHRASE)) {
        findings.push(finding("stale-claim", row.rule, row.claim, `the file claims ${row.rule} is only cited, but the sentence "${CLAIM_PHRASE}" is gone`));
      } else if (unowned.length > 0 || hits === 0) {
        findings.push(finding(
          "stale-claim",
          row.rule,
          row.claim,
          hits === 0
            ? `the claim says ${row.rule} is cited, never restated, and its seed matches nothing — the claim cannot be verified`
            : `${row.claim} claims ${row.rule} is never restated, and ${unowned.join(", ")} restates it`,
        ));
      }
    }
  }

  // Every "never restated" sentence must name a declared owner (or be a claim
  // this sweep already measures), otherwise the assertion is unverifiable.
  const claimScope = scopeMatcher((directives["claim-scope"] ?? "skills/**").split(",").map((entry) => entry.trim()).filter(Boolean));
  const owners = rows.map((row) => row.owner);
  for (const rel of files.filter((entry) => claimScope(entry))) {
    const body = textOf(rel);
    if (body === null || !body.includes(CLAIM_PHRASE)) continue;
    if (directives["claim-scope"] === undefined && !matched.has(rel)) continue;
    if (rows.some((row) => row.claim === rel)) continue;
    if (owners.some((owner) => namesOwner(body, owner))) continue;
    // A claim may also point at its owner by path: any markdown path the file
    // names, that exists in this tree, is a resolvable pointer.
    const pointer = [...body.matchAll(/([\w./-]+\.md)\b/g)].map((match) => match[1]).some((rel) => files.includes(rel));
    if (pointer) continue;
    findings.push(finding(
      "uncovered-claim",
      rows.find((row) => body.includes(row.phrase))?.rule ?? "-",
      rel,
      `asserts "${CLAIM_PHRASE}" without naming the declared owner of the rule it claims`,
    ));
  }

  findings.sort((left, right) => (left.file === right.file ? left.code.localeCompare(right.code) : left.file.localeCompare(right.file)));
  const refused = findings.some((entry) => entry.code === "malformed-corpus" || entry.code === "empty-corpus" || entry.code === "unresolved-owner");
  const verdict = refused ? "REFUSED" : findings.length === 0 ? "PASS" : "FAIL";
  return { verdict, findings, unmatchedRules: unmatchedRules.sort(), matchedFiles: matched.size, rules: rows.length, stamp: STAMP };
}

function usage(message) {
  process.stderr.write(`restatement-sweep: ${message}\n`);
  process.stderr.write("usage: restatement-sweep [--repo <dir>] [--json]  (node fallback, same argv)\n");
  process.exit(2);
}

export function main(argv = process.argv.slice(2), options = {}) {
  let repo = SCRIPT_ROOT;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write("usage: restatement-sweep [--repo <dir>] [--json]\n");
      return 0;
    }
    if (arg === "--json") {
      json = true;
    } else if (arg === "--repo") {
      const value = argv[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      repo = path.resolve(value);
      index += 1;
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  if (!fs.existsSync(repo)) usage(`${repo} does not exist`);
  const result = sweep(repo);
  if (json) {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } else {
    const lines = [
      `restatement-sweep — ${result.rules} rule(s) · ${result.matchedFiles} file(s) matched · ${result.findings.length} finding(s)`,
    ];
    for (const entry of result.findings) lines.push(`FINDING ${entry.code} — ${entry.rule}: ${entry.file} — ${entry.detail}`);
    for (const rule of result.unmatchedRules) lines.push(`NOTE ${rule} — the seed's phrase matches no file in its scope; the seed is dead`);
    lines.push(`verdict: ${result.verdict}`);
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  return result.verdict === "PASS" ? 0 : 1;
}
