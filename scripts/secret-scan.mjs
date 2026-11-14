#!/usr/bin/env node
/**
 * secret-scan.mjs — the deterministic push-range secret scan (issue #487).
 *
 * The defect it exists for: the repository's only barrier against a committed
 * credential was one line of the `review-security` checklist, conducted by a
 * model inside a review pass that can be skipped. The leak path the issue names
 * is cheap — a real token pasted into a fixture, a test, a log line or a
 * session-fragment example under `docs/`, riding a prose-only push that skips
 * every test-bearing gate step.
 *
 * What it reads: the added lines of a push range (`--base`, default: the
 * upstream merge-base, then `origin/main`'s, then the whole tracked tree when
 * neither resolves — a shallow CI clone has no range and a range-less hook must
 * still be judged, so the fallback is *more* scanning, never a skip). Every
 * tracked text path is in scope; no directory is exempt.
 *
 * The rules are shapes, not guesses, and the closed set is `RULES`:
 *
 *   private-key           a PEM private-key header
 *   github-token          `gh[pousr]_…` and `github_pat_…`
 *   gitlab-token          `glpat-…`
 *   openai-key            `sk-…`, `sk-proj-…`, `sk-ant-…`
 *   aws-access-key        `AKIA`/`ASIA`/`ABIA`/`ACCA` + 16 upper-case base32
 *   google-api-key        `AIza` + 35
 *   slack-token           `xox[baposr]-…`
 *   npm-token             `npm_` + 36
 *   sendgrid-key          `SG.` + 22 + `.` + 43
 *   jwt                   three base64url segments behind `eyJ`
 *   credential-assignment `<key name>: "<payload>"` where the payload passes the
 *                         entropy and placeholder floors (the issue's
 *                         "high-entropy payloads" half)
 *   connection-string     `scheme://user:<payload>@host`
 *
 * Fails closed, in the gate's own conventions: one `FINDING <file>:<line> —
 * <rule>: <detail>` line per finding, a tally, then `verdict: PASS|FAIL`.
 * exit 0 only on PASS, 1 on a finding, 2 on a usage error — including an
 * unreadable tree, an unresolvable `--base` and a malformed allowlist, because
 * a scanner that cannot look must never report nothing to see.
 *
 * A match is never echoed: the detail carries a 4-character prefix and the
 * payload's length, so a finding in a CI log does not republish the secret it
 * caught.
 *
 * The allowlist (`scripts/secret-scan-allowlist.json`) is the only way a benign
 * shape stops being a finding: one entry per `path` (+ `*` glob) and `rule`
 * (`*` allowed), each with a reason. An entry that matches nothing in
 * whole-tree mode is itself a finding, so the file cannot rot into silence.
 *
 * Known limit (declared, not silent): a binary container — an archive, a
 * compiled artifact, a compressed chunk — is skipped by extension or by a NUL
 * byte. There is no size ceiling: a ceiling would be a blind spot, and the
 * largest tracked text file in this repository is the journal at 1.6 MB.
 *
 * Read-only: it writes nothing, calls no network, and holds no state between
 * runs. Its sibling suite is `scripts/secret-scan.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALLOWLIST_REL = "scripts/secret-scan-allowlist.json";
const SCHEMA = "secret-scan@1";

/** `git ls-files`/`git diff` over a large tree: the same 64 MiB ceiling the
 *  other push-range gates use, because spawnSync's 1 MiB default kills a range
 *  whose diff is larger than a big commit. */
const GIT_MAX_BUFFER = 64 * 1024 * 1024;

/** The closed rule vocabulary. Adding a provider shape adds a row here, a
 *  pattern below and a positive case in the suite — never a second scan.
 *  Order is report order within one line. */
export const RULES = Object.freeze([
  "private-key",
  "github-token",
  "gitlab-token",
  "openai-key",
  "aws-access-key",
  "google-api-key",
  "slack-token",
  "npm-token",
  "sendgrid-key",
  "jwt",
  "credential-assignment",
  "connection-string",
]);

/**
 * The prefix-anchored provider rules. A prefix is what makes a shape specific
 * enough to judge without a context window; the floors are detection floors
 * (long enough that prose cannot reach them), never a claim about a documented
 * byte count — GitHub's own docs note the installation-token format is being
 * extended, which is why the GitHub floor is not an equality.
 */
const PROVIDER_PATTERNS = Object.freeze([
  ["github-token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["github-token", /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ["gitlab-token", /\bglpat-[A-Za-z0-9_-]{20,}\b/],
  ["openai-key", /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}\b/],
  ["aws-access-key", /\b(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/],
  ["google-api-key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["slack-token", /\bxox[abposr]-[A-Za-z0-9-]{10,}\b/],
  ["npm-token", /\bnpm_[A-Za-z0-9]{36}\b/],
  ["sendgrid-key", /\bSG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}\b/],
  ["jwt", /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/],
]);

const PRIVATE_KEY = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/;

/** `<key name>: "<payload>"` — the key name is the context, the payload decides. */
const ASSIGNMENT = /(?:^|[^A-Za-z0-9_])(api[_-]?key|apikey|api[_-]?token|secret[_-]?key|secret|token|access[_-]?token|auth[_-]?token|password|passwd|pwd|client[_-]?secret|private[_-]?key|credential)["']?\s*[:=]\s*(['"`])([^'"`\s]{8,})\2/gi;

/** `<scheme>://<user>:<payload>@<host>` — no key name, so the shape is the rule. */
const CONNECTION = /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:([^/\s@]{8,})@/gi;

/** The payload floors. A payload must look like a credential, not like a word. */
const PAYLOAD_MIN_LENGTH = 12;
const PAYLOAD_MIN_ENTROPY = 3.0;
const UNMIXED_MIN_ENTROPY = 4.2;
const PLACEHOLDER_WORDS = Object.freeze([
  "placeholder",
  "todo",
  "tbd",
  "fixme",
  "changeme",
  "change-me",
  "change_me",
  "replace",
  "example",
  "sample",
  "dummy",
  "fake",
  "redacted",
  "secret",
  "token",
  "password",
  "string",
  "not-real",
  "notreal",
]);

/** Containers a text pass cannot judge. Extension first, then the NUL byte. */
const BINARY_EXTENSIONS = new Set([
  ".gz", ".tgz", ".zip", ".bz2", ".xz", ".7z", ".tar", ".rar",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff",
  ".pdf", ".psd", ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".so", ".dylib", ".dll", ".node", ".wasm", ".jar", ".class", ".pyc",
  ".p12", ".pfx", ".jks", ".keystore", ".bin", ".dat", ".mp3", ".mp4", ".mov",
]);

const USAGE = `usage: secret-scan [--root <dir>] [--base <rev>] [--all] [--json]

  --root <dir>  the tree to scan (default: this repository)
  --base <rev>  the push range's base (default: merge-base with the upstream,
                then origin/main, then the whole tracked tree)
  --all         scan every tracked file at the head, not a range
  --json        one JSON object instead of the fixed text block

stdout: one "ALLOWLISTED <file>:<line> — <rule>" line per allowlisted hit, one
"FINDING <file>:<line> — <rule>: <detail>" line per finding, the tally, the
verdict. exit: 0 pass · 1 findings · 2 usage`;

function usage(message) {
  process.stderr.write(`secret-scan: ${message}\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

/** Shannon entropy per character, base 2. The issue's "high-entropy payloads". */
export function entropy(value) {
  const text = String(value ?? "");
  if (text.length === 0) return 0;
  const counts = new Map();
  for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
  let total = 0;
  for (const count of counts.values()) {
    const share = count / text.length;
    total -= share * Math.log2(share);
  }
  return total;
}

/** A match is never echoed: a 4-character prefix and the length only. */
export function redact(value) {
  const text = String(value ?? "");
  if (text.length <= 8) return `***(${text.length} chars)`;
  return `${text.slice(0, 4)}…(${text.length} chars)`;
}

/** A value that references something else is not a credential: `${{ … }}`,
 *  `${VAR}`, `<placeholder>`, `%(…)s`. */
export function referenceFault(value) {
  const text = String(value ?? "");
  if (/^\$\{[^}]*\}$/.test(text)) return "an interpolation, not a credential";
  if (/^\$[A-Za-z_][A-Za-z0-9_]*$/.test(text)) return "an interpolation, not a credential";
  if (/^\$\([^)]*\)$/.test(text)) return "a command substitution, not a credential";
  if (/^\{\{.*\}\}$/.test(text)) return "a template expression, not a credential";
  if (/^<[^>]*>$/.test(text)) return "a placeholder, not a credential";
  if (/^%\([^)]*\)s?$/.test(text)) return "a template expression, not a credential";
  if (text.includes("${")) return "a template interpolation, not a credential";
  return null;
}

/** A documented placeholder is not a credential, and neither is filler. */
export function placeholderFault(value) {
  const text = String(value ?? "");
  if (/^(?:x{3,}|\*{3,}|\.{3,}|-{3,}|_+|0+)$/.test(text)) return "a filler run, not a credential";
  const lowered = text.toLowerCase();
  for (const word of PLACEHOLDER_WORDS) {
    if (lowered.includes(word)) return `the placeholder "${word}", not a credential`;
  }
  if (/(?:^|[-_])your[-_]/.test(lowered) || /[-_]here$/.test(lowered)) return "a placeholder, not a credential";
  return null;
}

/**
 * The payload floor: length, reference and placeholder refusals, then the
 * entropy test the issue names. A payload mixing letters and digits is judged on
 * entropy alone; an unmixed one has to clear a higher bar, because a run of
 * digits or a word with a hyphen is not a credential.
 */
export function payloadFault(value) {
  const text = String(value ?? "");
  if (text.length < PAYLOAD_MIN_LENGTH) return `too short: ${text.length} char(s)`;
  const reference = referenceFault(text);
  if (reference) return reference;
  const placeholder = placeholderFault(text);
  if (placeholder) return placeholder;
  const measured = entropy(text);
  const mixed = /[A-Za-z]/.test(text) && /\d/.test(text);
  if (!mixed && measured < UNMIXED_MIN_ENTROPY) {
    return `no credential shape: no letter-and-digit mix and entropy ${measured.toFixed(2)}`;
  }
  if (measured < PAYLOAD_MIN_ENTROPY) return `entropy ${measured.toFixed(2)} is below the credential floor`;
  return null;
}

/** One line, every rule, at most one finding per rule. */
export function scanLine(line) {
  const text = String(line ?? "");
  const hits = [];
  const seen = new Set();
  const add = (rule, detail) => {
    if (seen.has(rule)) return;
    seen.add(rule);
    hits.push({ rule, detail });
  };
  if (PRIVATE_KEY.test(text)) add("private-key", "a private-key header");
  for (const [rule, pattern] of PROVIDER_PATTERNS) {
    const match = pattern.exec(text);
    if (match) add(rule, `value "${redact(match[0])}"`);
  }
  for (const match of text.matchAll(ASSIGNMENT)) {
    const payload = match[3];
    if (payloadFault(payload) === null) add("credential-assignment", `value "${redact(payload)}"`);
  }
  for (const match of text.matchAll(CONNECTION)) {
    const payload = match[1];
    if (payloadFault(payload) === null) add("connection-string", `password "${redact(payload)}"`);
  }
  return hits;
}

/** A whole file's worth of lines, with their new-side line numbers. */
export function scanText(text) {
  const findings = [];
  String(text ?? "")
    .split("\n")
    .forEach((line, at) => {
      for (const hit of scanLine(line)) findings.push({ line: at + 1, rule: hit.rule, detail: hit.detail });
    });
  return findings;
}

/**
 * The added lines of a unified diff, with the new-side file and line number.
 * Only `+` lines count: a range is judged by what it adds, so a secret the range
 * removes is the repair and never a finding.
 */
export function addedLines(diffText) {
  const added = [];
  let file = null;
  let lineNumber = 0;
  let inHunk = false;
  for (const raw of String(diffText ?? "").split("\n")) {
    if (raw.startsWith("diff --git ") || raw.startsWith("Binary files ")) {
      file = null;
      inHunk = false;
      continue;
    }
    if (raw.startsWith("+++ ")) {
      const target = raw.slice(4).trim();
      file = target === "/dev/null" ? null : target.replace(/^b\//, "");
      inHunk = false;
      continue;
    }
    if (raw.startsWith("--- ") || raw.startsWith("index ") || raw.startsWith("new file mode ") || raw.startsWith("deleted file mode ") || raw.startsWith("similarity index ")) continue;
    const hunk = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/.exec(raw);
    if (hunk) {
      lineNumber = Number(hunk[1]);
      inHunk = true;
      continue;
    }
    if (!inHunk || file === null) continue;
    if (raw.startsWith("+")) {
      added.push({ file, line: lineNumber, text: raw.slice(1) });
      lineNumber += 1;
      continue;
    }
    if (raw.startsWith(" ")) {
      lineNumber += 1;
      continue;
    }
  }
  return added;
}

/** The findings of a unified diff, one per finding per line. */
export function scanDiff(diffText) {
  const findings = [];
  for (const entry of addedLines(diffText)) {
    for (const hit of scanLine(entry.text)) {
      findings.push({ file: entry.file, line: entry.line, rule: hit.rule, detail: hit.detail });
    }
  }
  return findings;
}

/** Every tracked path, sorted; `null` when this is not a git checkout. */
export function trackedFiles(root) {
  const result = spawnSync("git", ["-C", root, "ls-files", "-z"], { encoding: "utf8", maxBuffer: GIT_MAX_BUFFER });
  if (result.status !== 0) return null;
  return result.stdout.split("\0").filter(Boolean).sort();
}

/**
 * The whole-tree pass — the fallback when no range resolves, and the mode that
 * makes an allowlist entry provable. A binary container is skipped and counted.
 */
export function scanTree(root) {
  const files = trackedFiles(root);
  if (files === null) return { ok: false, reason: `${root} is not a git checkout, so no tracked file can be read` };
  const findings = [];
  let skipped = 0;
  for (const file of files) {
    if (BINARY_EXTENSIONS.has(path.extname(file).toLowerCase())) {
      skipped += 1;
      continue;
    }
    let bytes;
    try {
      bytes = fs.readFileSync(path.join(root, file));
    } catch {
      skipped += 1;
      continue;
    }
    if (bytes.includes(0)) {
      skipped += 1;
      continue;
    }
    for (const hit of scanText(bytes.toString("utf8"))) findings.push({ file, ...hit });
  }
  return { ok: true, scanned: files.length, skipped, findings };
}

/** `git <args>` in `root`, trimmed, or `null` — injected so the preference order
 *  stays testable without a repository. */
function defaultGitQuery(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

/**
 * Which range to judge: the explicit flag, then the upstream merge-base, then
 * `origin/main`'s, then the whole tracked tree. The last step is deliberate —
 * a shallow CI clone and a hook that cannot prove its refs both land here, and
 * scanning everything is the fail-closed answer, not a skip.
 */
export function resolveRange({ root = ".", explicit, gitQuery = defaultGitQuery } = {}) {
  if (explicit !== undefined) return { ok: true, mode: "range", base: explicit, head: "HEAD", source: "flag" };
  for (const candidate of ["@{upstream}", "origin/main"]) {
    const revision = gitQuery(root, ["rev-parse", "--verify", "--quiet", candidate]);
    if (revision === null) continue;
    const base = gitQuery(root, ["merge-base", "HEAD", candidate]);
    if (base !== null) {
      return { ok: true, mode: "range", base, head: "HEAD", source: candidate === "@{upstream}" ? "upstream" : "origin/main" };
    }
  }
  return { ok: true, mode: "tree", base: null, head: "HEAD", source: "tree" };
}

/** The unified diff of a range, or `null` when git cannot produce one. */
function collectDiff(root, base, head) {
  const result = spawnSync(
    "git",
    ["-C", root, "diff", "--no-color", "--unified=0", "--no-renames", "--no-ext-diff", base, head],
    { encoding: "utf8", maxBuffer: GIT_MAX_BUFFER },
  );
  if (result.status !== 0) return null;
  return result.stdout;
}

/** The allowlist's shape, as a reason or `null`. */
export function allowlistFault(value) {
  if (!Array.isArray(value)) return "is not an array of entries";
  for (const entry of value) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return "carries an entry that is not an object";
    if (typeof entry.path !== "string" || entry.path.trim() === "") return "carries an entry with no path";
    if (typeof entry.rule !== "string" || entry.rule.trim() === "") return "carries an entry with no rule";
    if (entry.rule !== "*" && !RULES.includes(entry.rule)) return `names "${entry.rule}", which is not a shipped rule`;
    if (typeof entry.reason !== "string" || entry.reason.trim() === "") return "carries an entry with no reason";
  }
  return null;
}

/** Read and validate the allowlist. A malformed file is an error, never silence. */
export function loadAllowlist(root) {
  const file = path.join(root, ALLOWLIST_REL);
  if (!fs.existsSync(file)) return { entries: [], errors: [], file: null };
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    return { entries: [], errors: [`${ALLOWLIST_REL} is not valid JSON: ${error.message}`], file };
  }
  const fault = allowlistFault(parsed);
  if (fault !== null) return { entries: [], errors: [`${ALLOWLIST_REL} ${fault}`], file };
  return { entries: parsed, errors: [], file };
}

/** `**` crosses a path separator, `*` alone does not, `?` is one character. */
function globToRegExp(glob) {
  let out = "^";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*") {
      if (glob[index + 1] === "*") {
        out += ".*";
        index += 1;
      } else {
        out += "[^/]*";
      }
    } else if (char === "?") out += "[^/]";
    else out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`${out}$`);
}

const pathMatches = (glob, file) => globToRegExp(String(glob)).test(String(file));

/** Split the findings into what an entry narrows and what stands. */
export function applyAllowlist(findings, entries) {
  const kept = [];
  const allowlisted = [];
  for (const finding of findings) {
    const entry = entries.find(
      (candidate) =>
        (candidate.rule === "*" || candidate.rule === finding.rule) && pathMatches(candidate.path, finding.file),
    );
    if (entry) allowlisted.push({ ...finding, entry });
    else kept.push(finding);
  }
  return { kept, allowlisted };
}

/** An entry that narrows nothing is a finding of its own (whole-tree mode only):
 *  it is the check that keeps the allowlist from rotting into silence. */
export function staleEntries(entries, findings) {
  const stale = [];
  for (const entry of entries) {
    const matched = findings.some(
      (finding) => (entry.rule === "*" || entry.rule === finding.rule) && pathMatches(entry.path, finding.file),
    );
    if (!matched) {
      stale.push({
        file: ALLOWLIST_REL,
        line: null,
        rule: "allowlist-stale",
        detail: `${entry.path} matches no finding${entry.rule === "*" ? "" : ` of rule ${entry.rule}`}`,
      });
    }
  }
  return stale;
}

const label = (finding) => (finding.line === null ? finding.file : `${finding.file}:${finding.line}`);

/** The fixed text block: allowlisted hits (visible, never silent), findings, the
 *  tally, the verdict. */
export function report({ root, mode, base, head, scanned, skipped, allowlisted, findings, entries }) {
  const scope =
    mode === "range"
      ? `range ${String(base).slice(0, 7)}..${String(head).slice(0, 7)}`
      : `whole tree at ${String(head).slice(0, 7)}`;
  const counted = mode === "range" ? `${scanned} added line(s) scanned` : `${scanned} tracked file(s) scanned`;
  const lines = [
    `secret-scan — ${counted} · ${scope}${skipped > 0 ? ` · ${skipped} binary skipped` : ""} · allowlist ${entries.length} entry(ies) · root: ${root}`,
  ];
  for (const hit of allowlisted) lines.push(`ALLOWLISTED ${label(hit)} — ${hit.rule}`);
  for (const finding of findings) lines.push(`FINDING ${label(finding)} — ${finding.rule}: ${finding.detail}`);
  lines.push(`secret-scan: ${findings.length} finding(s) · ${allowlisted.length} allowlisted`);
  lines.push(`verdict: ${findings.length === 0 ? "PASS" : "FAIL"}`);
  return lines.join("\n");
}

function parseArgs(argv) {
  const options = { root: DEFAULT_ROOT, base: null, all: false, json: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root") {
      const value = argv[index + 1];
      if (value === undefined) usage("--root needs a directory");
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === "--base") {
      const value = argv[index + 1];
      if (value === undefined) usage("--base needs a revision");
      options.base = value;
      index += 1;
    } else if (arg === "--all") options.all = true;
    else if (arg === "--json") options.json = true;
    else usage(`unknown argument ${arg}`);
  }
  return options;
}

/** The scan, as data: the caller decides what to print and which exit it earns. */
export function inspect({ root = DEFAULT_ROOT, base = null, all = false } = {}) {
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    return { ok: false, reason: `${root} is not a directory` };
  }
  if (trackedFiles(root) === null) {
    return { ok: false, reason: `${root} is not a git checkout, so no tracked file can be read` };
  }
  const allowlist = loadAllowlist(root);
  if (allowlist.errors.length > 0) return { ok: false, reason: allowlist.errors.join("; ") };

  const range = all ? { mode: "tree", base: null, head: "HEAD" } : resolveRange({ root, explicit: base ?? undefined });
  let raw = [];
  let scanned = 0;
  let skipped = 0;
  if (range.mode === "range") {
    const diff = collectDiff(root, range.base, range.head);
    if (diff === null) return { ok: false, reason: `--base ${range.base} does not resolve to a diff range in ${root}` };
    const lines = addedLines(diff);
    scanned = lines.length;
    raw = scanDiff(diff);
  } else {
    const tree = scanTree(root);
    if (!tree.ok) return { ok: false, reason: tree.reason };
    scanned = tree.scanned;
    skipped = tree.skipped;
    raw = tree.findings;
  }

  const added = range.mode === "tree" ? staleEntries(allowlist.entries, raw) : [];
  const narrowed = applyAllowlist(raw, allowlist.entries);
  return {
    ok: true,
    mode: range.mode,
    base: range.base,
    head: range.head,
    scanned,
    skipped,
    entries: allowlist.entries,
    findings: [...narrowed.kept, ...added],
    allowlisted: narrowed.allowlisted,
  };
}

function main(argv) {
  const options = parseArgs(argv);
  const result = inspect({ root: options.root, base: options.base, all: options.all });
  if (!result.ok) usage(result.reason);

  const verdict = result.findings.length === 0 ? "PASS" : "FAIL";
  if (options.json) {
    process.stdout.write(
      `${JSON.stringify({
        schema: SCHEMA,
        verdict,
        mode: result.mode,
        base: result.base,
        head: result.head,
        scanned: result.scanned,
        skipped: result.skipped,
        allowlist: result.entries.length,
        allowlisted: result.allowlisted.map(({ file, line, rule }) => ({ file, line, rule })),
        findings: result.findings.map(({ file, line, rule, detail }) => ({ file, line, rule, detail })),
      })}\n`,
    );
  } else {
    process.stdout.write(`${report({ root: options.root, ...result })}\n`);
  }
  return verdict === "PASS" ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
