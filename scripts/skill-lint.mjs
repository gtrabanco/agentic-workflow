#!/usr/bin/env node
/**
 * skill-lint.mjs — the mechanical half of `skills/skill-lint` (fix #357).
 *
 * The seven checks it runs — a hidden HTML comment, an XML/HTML tag in the
 * frontmatter description, an invisible codepoint, an unpinned external URL, a
 * credential-access or exfiltration-shaped instruction, a Windows-style
 * backslash path, a dated currency claim — are owned by
 * `skills/skill-lint/references/CHECKS.md`, together with the declared
 * allowances and the smells this repository deliberately does not adopt. This
 * script only mechanizes checking them; it never carries a second copy of a
 * rule's meaning and it repairs nothing.
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

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The closed check set — the reference owns each rule's meaning. */
const CHECKS = [
  { id: "SL-01", name: "html-comment" },
  { id: "SL-02", name: "frontmatter-tag" },
  { id: "SL-03", name: "invisible-codepoint" },
  { id: "SL-04", name: "unpinned-url" },
  { id: "SL-05", name: "credential-or-exfiltration" },
  { id: "SL-06", name: "backslash-path" },
  { id: "SL-07", name: "time-sensitive-claim" },
];

/**
 * A declared machine marker: `<!-- <namespace>:<field>[:<field>] -->`, optionally
 * followed by `key=value` tokens (`<!-- review-change:pass sha=<40-hex> … -->`).
 * A comment carrying prose — the hidden-instruction vector — never matches,
 * because prose is not `:`-separated lowercase tokens or `key=value` pairs.
 */
const COMMENT_MARKER = /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*)+(?:\s+[^\s=]+=\S+)*$/;

/** XML/HTML tags in the frontmatter: opening, closing, self-closing, with props. */
const FRONTMATTER_TAG = /<\/?[A-Za-z][^>\n]*\/?>/g;

/** Codepoints a reader cannot see: soft hyphen, zero-width, bidi controls, tag chars. */
const INVISIBLE = /[\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u{E0000}-\u{E007F}]/gu;

/** An external URL in an instruction. */
const URL = /https?:\/\/[^\s<>()[\]`"']+/g;

/** What makes a URL pinned: a version, a tag, a commit, or a tree/blob ref. */
const PINNED_URL =
  /(?:@|\/)v?\d+\.\d+(?:\.\d+)?(?:[-.][0-9A-Za-z.-]+)?(?:[\/#]|$)|\/(?:tree|blob|commit|tags)\/[^\s/]+|#v?\d+\.\d+|[0-9a-f]{7,40}(?:[\/#]|$)/;

/** `send … to <external sink>`: the exfiltration shape the issue names. */
const EXFILTRATION =
  /\b(?:send|upload|post|transmit|forward|exfiltrate|beacon)\b[^\n]{0,80}\b(?:to|into|at)\b[^\n]{0,60}(?:https?:\/\/|\bendpoint\b|\bwebhook\b|\banalytics\b|\btelemetry\b|\bpastebin\b)/i;

/** `read … <credential>`: an instruction that reaches for a secret. */
const CREDENTIAL_ACCESS =
  /\b(?:read|cat|open|print|echo|dump|copy|attach|include|collect)\b[^\n]{0,60}(?:\.env\b|id_rsa|id_ed25519|\.ssh\b|\.aws\b|credentials|api[ _-]?key|password|keychain)/i;

/** A Windows-style or bare backslash path: `C:\dir` or `dir\file`. */
const BACKSLASH_PATH = /(?:^|[\s`("'[>])(?:[A-Za-z]:\\|[\w.-]+\\[\w.-]+)/;

/** A currency word — the half of a claim that decays. */
const CURRENCY = /\b(?:as of|latest|newest|current(?:ly)?|upcoming|up-to-date)\b/gi;

/** An expiry word, which rots the day after it is written. */
const EXPIRY = /\b(?:expires?|expiry|expiring|valid until|good until|no later than|end[- ]of[- ]life|support ends?|deadline)\b/i;

/** A calendar date: ISO (`2026-11-02`) or a spelled month (`November 2026`). */
const DATED = /\b(?:20\d{2}-\d{2}(?:-\d{2})?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+20\d{2})\b/i;

// ── Helpers ───────────────────────────────────────────────────────────────

/** 1-based line number of a string offset. */
function lineAt(text, offset) {
  let line = 1;
  for (let index = 0; index < offset; index += 1) if (text.charCodeAt(index) === 10) line += 1;
  return line;
}

/** The body of a named top-level frontmatter field, folded lines included. */
function frontmatterField(frontmatter, field) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^${field}:`).test(line));
  if (start === -1) return null;
  const value = [lines[start]];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(lines[index])) break;
    value.push(lines[index]);
  }
  return value.join("\n");
}

/** `U+XXXX`, the label a reader can look up. */
function codepointLabel(character) {
  return `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
}

/** Every `.md` under `<root>/skills`, root-relative and sorted. */
function discover(root, only) {
  const skillsDir = path.join(root, "skills");
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) out.push(path.relative(root, full));
    }
  };
  if (!fs.existsSync(skillsDir)) return { files: [], missing: only };
  if (only.length === 0) {
    walk(skillsDir);
    return { files: out.sort(), missing: [] };
  }
  const missing = only.filter((name) => !fs.existsSync(path.join(skillsDir, name, "SKILL.md")));
  for (const name of only) if (!missing.includes(name)) walk(path.join(skillsDir, name));
  return { files: out.sort(), missing };
}

// ── The checks ────────────────────────────────────────────────────────────

/**
 * Every finding in one file, in line order.
 * @param {string} relative — the file as the report names it
 * @param {string} text — its bytes
 */
function scanFile(relative, text) {
  const findings = [];
  const add = (id, line, detail) => findings.push({ id, name: CHECKS.find((check) => check.id === id).name, file: relative, line, detail });

  for (const match of text.matchAll(/<!--([\s\S]*?)-->/g)) {
    const marker = match[1].trim();
    if (!COMMENT_MARKER.test(marker)) add("SL-01", lineAt(text, match.index), `hidden comment body \`${marker.slice(0, 70)}\``);
  }

  const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text);
  if (frontmatter !== null) {
    const description = frontmatterField(frontmatter[1], "description");
    if (description !== null) {
      for (const tag of description.match(FRONTMATTER_TAG) ?? []) add("SL-02", 1, `tag \`${tag}\` in the frontmatter description`);
    }
  }

  for (const match of text.matchAll(INVISIBLE)) {
    add("SL-03", lineAt(text, match.index), `${codepointLabel(match[0])} in the file body`);
  }

  text.split("\n").forEach((line, index) => {
    const at = index + 1;
    for (const match of line.matchAll(URL)) {
      const url = match[0].replace(/[.,;:]+$/, "");
      if (!PINNED_URL.test(url)) add("SL-04", at, `unpinned URL \`${url}\``);
    }
    if (EXFILTRATION.test(line)) add("SL-05", at, `sends data to an external sink: \`${line.trim().slice(0, 90)}\``);
    else if (CREDENTIAL_ACCESS.test(line)) add("SL-05", at, `reaches for a credential: \`${line.trim().slice(0, 90)}\``);
    const backslash = BACKSLASH_PATH.exec(line);
    if (backslash !== null) add("SL-06", at, `backslash path \`${backslash[0].trim()}\``);
    // A time-sensitive claim needs both halves: the date it will rot past, and
    // the currency/expiry word that makes it a claim. A provenance date carries
    // the date and none of the words, and a vocabulary list carries the words
    // and no date — neither is a claim.
    const date = DATED.exec(line);
    if (date !== null) {
      if (EXPIRY.test(line)) add("SL-07", at, `expiry claim: \`${line.trim().slice(0, 90)}\``);
      else {
        for (const currency of line.matchAll(CURRENCY)) {
          const distance = date.index - (currency.index + currency[0].length);
          if (distance >= 0 && distance <= 60) {
            add("SL-07", at, `dated currency claim: \`${line.trim().slice(0, 90)}\``);
            break;
          }
        }
      }
    }
  });

  return findings;
}

// ── The report ────────────────────────────────────────────────────────────

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

  const { files, missing } = discover(root, [...new Set(only)]);
  if (missing.length > 0) usage(`no such skill in the tree: ${missing.join(", ")}`);

  const findings = files.flatMap((relative) => scanFile(relative, fs.readFileSync(path.join(root, relative), "utf8")));
  const distinctFiles = new Set(findings.map((finding) => finding.file)).size;
  const verdict = findings.length === 0 ? "PASS" : "FAIL";
  const scope = explicit ? root : ".";

  if (json) {
    console.log(
      JSON.stringify(
        {
          root: scope,
          files: files.length,
          checks: CHECKS,
          findings,
          tally: { findings: findings.length, files: distinctFiles },
          verdict,
        },
        null,
        2,
      ),
    );
    process.exit(verdict === "PASS" ? 0 : 1);
  }

  console.log(`skill-lint — ${files.length} file(s) · ${CHECKS.length} check(s) · root ${scope}`);
  for (const finding of findings) console.log(`FINDING ${finding.id} ${finding.name} ${finding.file}:${finding.line} — ${finding.detail}`);
  console.log(`skill-lint: ${findings.length} finding(s) in ${distinctFiles} file(s)`);
  console.log(`verdict: ${verdict}`);
  process.exit(verdict === "PASS" ? 0 : 1);
}

main(process.argv.slice(2));
