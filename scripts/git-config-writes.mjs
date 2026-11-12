#!/usr/bin/env node
/**
 * git-config-writes.mjs — the repository's `-c`-only convention for test
 * carriers, made mechanical (issue #514 S7).
 *
 * A fixture repository is disposable, so a suite that configures one has no
 * business writing to a config *file*: the file a write lands in is resolved by
 * git's layering, not by the suite's intent, and a failed fixture resolution
 * (a `GIT_DIR` inherited from `git push`'s own export, a failed `mkdtemp`) sends
 * the write into the shared checkout. That is how `t <t@example.test>` reached
 * 139 commits on `origin/main`, all of them signed and all of them wrong.
 *
 * Passing identity per invocation — `git -c user.name=… -c user.email=…
 * -c commit.gpgsign=false …` — has no second target: the value exists for that
 * one process and nowhere else. `scripts/log-immutability.test.mjs` established
 * the convention; this gate keeps every later suite on it.
 *
 * Scope: the carriers where a test writes git config —
 * `scripts/**\/*.test.mjs`, `packages/*\/test/**\/*.test.mjs` and
 * `template/.agentic-workflow/hooks/tests/*.sh`. Production code that installs a
 * driver or a hook is not a test carrier and is not scanned.
 *
 * Boundary, stated once: the rule is textual. An invocation assembled by
 * variable indirection (`c=config; git $c user.name x`) is out of scope — the
 * same boundary `template/.agentic-workflow/hooks/guard-command.sh` declares.
 * A false positive is repaired by rewording the suite, never by an exemption.
 *
 * Usage
 *   bun scripts/git-config-writes.mjs                # this repository
 *   bun scripts/git-config-writes.mjs --root <dir>   # another checkout
 *   (node fallback, same argv)
 *
 * stdout: one fixed block — a `git-config-writes —` header naming the carrier
 * and finding counts, one `FINDING <path>:<line> — …` line per finding in path
 * then line order, a summary line, then `verdict: PASS|FAIL`.
 * exit: 0 no finding; 1 at least one finding; 2 usage error.
 *
 * Read-only: it writes nothing, calls no network and holds no state. Its sibling
 * suite is `scripts/git-config-writes.test.mjs`, and its corpus lives in
 * `scripts/git-config-writes.cases.txt`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Hard statement separators: a git invocation never spans one. */
const HARD_SEPARATORS = new Set([";", ";;", "&&", "||", "|", "&", "\n"]);

/** Git's own option letters that take a value and may precede the subcommand. */
const GIT_GLOBAL_VALUE_OPTIONS = new Set(["-c", "-C", "--git-dir", "--work-tree", "--namespace", "--exec-path", "--config-env"]);

/** `git config` file/display options: skipped before the verb or key is read. */
const CONFIG_VALUE_OPTIONS = new Set(["--file", "-f", "--blob", "--type", "--default"]);

const CONFIG_FLAG_OPTIONS = new Set([
  "--global",
  "--system",
  "--local",
  "--worktree",
  "--fixed-value",
  "--all",
  "--includes",
  "--show-origin",
  "--show-scope",
  "--null",
  "-z",
]);

/** Read-only subcommands and legacy flags. */
const READ_VERBS = new Set([
  "get",
  "list",
  "--get",
  "--get-all",
  "--get-regexp",
  "--get-color",
  "--get-colorbool",
  "--get-urlmatch",
  "--list",
  "-l",
]);

/**
 * Tokenise source text into words, tracking line numbers and stripping comments.
 *
 * Comments are removed with one rule shared by every consumer of this file (and
 * mirrored by the hook's JSONC reader): `//` and `#` to end of line when they
 * start a word outside a quote, and `/* … *\/` wherever it starts outside a
 * quote. Strings are unquoted, so `["config", "user.email"]` yields the same
 * words a shell command would. `(`, `)`, `[`, `]` and `,` are soft separators:
 * they are dropped, which is what makes the JS array form and the shell form
 * tokenise alike.
 */
export function tokenize(text) {
  const tokens = [];
  let line = 1;
  let word = "";
  let wordLine = 1;
  let quote = null;
  let inBlockComment = false;

  const flush = () => {
    if (word !== "") {
      tokens.push({ value: word, line: wordLine });
      word = "";
    }
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\n") {
      flush();
      // `"` and `'` string literals cannot span a line (ECMAScript StringLiteral
      // grammar — verified against the pinned runtime: node rejects both forms
      // across a newline); only a backtick template may. Line-bounding the two
      // here keeps one unbalanced quote — a `"` inside a regex literal, say —
      // from swallowing every later line of the carrier.
      if (quote !== null && quote !== "`") quote = null;
      tokens.push({ value: "\n", line });
      line += 1;
      // A line comment never survives its newline; a block comment does.
      if (inBlockComment && next === undefined) inBlockComment = false;
      continue;
    }
    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote !== null) {
      if (char === quote) quote = null;
      else word += char;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      if (word === "") wordLine = line;
      quote = char;
      continue;
    }
    if (char === "/" && next === "*") {
      flush();
      inBlockComment = true;
      index += 1;
      continue;
    }
    if (char === "/" && next === "/") {
      flush();
      while (index < text.length && text[index] !== "\n") index += 1;
      index -= 1;
      continue;
    }
    // A regex literal starts where a fresh word starts and the previous
    // significant token opens an expression (`(`, `[`, `,`, `=`, `;`, `:` …);
    // its body is code-shaped and may carry any quote — a `"` or a backtick
    // inside it must not toggle quote state. Skipped to the closing unescaped
    // `/` on the same line; an unterminated form is left to the word rules.
    if (char === "/" && word === "" && regexAllowed(tokens)) {
      let end = index + 1;
      let inClass = false;
      let closed = false;
      while (end < text.length && text[end] !== "\n") {
        const c = text[end];
        if (c === "\\") {
          end += 1;
        } else if (inClass) {
          if (c === "]") inClass = false;
        } else if (c === "[") {
          inClass = true;
        } else if (c === "/") {
          closed = true;
          break;
        }
        end += 1;
      }
      if (closed) {
        index = end;
        continue;
      }
    }
    if (char === "#" && word === "") {
      flush();
      while (index < text.length && text[index] !== "\n") index += 1;
      index -= 1;
      continue;
    }
    if (char === "(" || char === ")" || char === "[" || char === "]" || char === ",") {
      flush();
      tokens.push({ value: char, line, soft: true });
      continue;
    }
    if (char === " " || char === "\t" || char === "\r") {
      flush();
      continue;
    }
    if (char === ";" || char === "|" || char === "&") {
      flush();
      let separator = char;
      while (next !== undefined && ";&|".includes(next) && text[index + 1] === next) {
        separator += next;
        index += 1;
      }
      tokens.push({ value: separator, line });
      continue;
    }
    if (word === "") wordLine = line;
    word += char;
  }
  flush();
  return tokens;
}

/** Tokens after which a fresh `/` opens a regex literal, not a division. */
const REGEX_PRECEDERS = new Set([
  "(", "[", "{", ",", ";", ":", "=", "!", "&", "|", "?", "%", "+", "*", "-", "~", "^", "<", ">", "=>", "\n",
]);

/** Whether a fresh `/` at this token boundary starts a regex literal. */
function regexAllowed(tokens) {
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const value = tokens[i].value;
    if (value === "\n") return true;
    if (tokens[i].soft) return REGEX_PRECEDERS.has(value);
    if (/\s/.test(value)) continue;
    return REGEX_PRECEDERS.has(value);
  }
  return true;
}

/** A dotted config key (`user.email`, `commit.gpgsign`, `merge.x.driver`). */
function isKeyShaped(token) {
  return /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/u.test(token);
}

/**
 * Classify one `git config` invocation from the words that follow `config`.
 *
 * Returns `{ kind: "read" }`, or `{ kind: "write", key, reason }` naming the key
 * the write targets (a section-wide verb such as `remove-section` names the
 * section). A word list that names no verb and no key is not an invocation and
 * answers `{ kind: "none" }` — the caller then ignores it.
 */
export function classifyInvocation(input) {
  const words = input[0] === "config" ? input.slice(1) : input;
  let index = 0;
  let key = null;
  while (index < words.length) {
    const word = String(words[index] ?? "");
    if (CONFIG_VALUE_OPTIONS.has(word)) {
      index += 2;
      continue;
    }
    if (word.startsWith("--type=") || word.startsWith("--file=") || word.startsWith("--blob=")) {
      index += 1;
      continue;
    }
    if (CONFIG_FLAG_OPTIONS.has(word)) {
      index += 1;
      continue;
    }
    if (READ_VERBS.has(word)) return { kind: "read" };
    if (word.startsWith("-")) {
      // `--unset`, `--unset-all`, `--replace-all`, `--add`, `-e`, `--edit`…: a
      // write whose target is the next non-option word (or none, for `edit`).
      return writeResult(words, index, words[index + 1]);
    }
    if (word === "set" || word === "unset" || word === "remove-section" || word === "rename-section" || word === "edit") {
      return writeResult(words, index, word === "edit" ? null : words[index + 1]);
    }
    if (isKeyShaped(word)) {
      return writeResult(words, index, word);
    }
    return { kind: "none" };
  }
  return { kind: "none" };
}

function writeResult(_words, index, key) {
  const target = typeof key === "string" && isKeyShaped(key) ? key : null;
  return {
    kind: "write",
    key: target,
    reason: target === null ? "git config writes configuration" : `git config ${target} writes configuration`,
  };
}

/** Partition tokens into statements on hard separators, soft separators kept. */
function statements(tokens) {
  const out = [];
  let current = [];
  for (const token of tokens) {
    if (HARD_SEPARATORS.has(token.value)) {
      if (current.length > 0) out.push(current);
      current = [];
      continue;
    }
    current.push(token);
  }
  if (current.length > 0) out.push(current);
  return out;
}

/** A statement as words, plus whether each word directly follows a bracket. */
function shape(statement) {
  const words = [];
  const afterBracket = [];
  let pending = false;
  for (const token of statement) {
    if (token.soft) {
      if (token.value === "(" || token.value === "[" || token.value === ",") pending = true;
      continue;
    }
    words.push(token);
    afterBracket.push(pending);
    pending = false;
  }
  return { words, afterBracket };
}

/**
 * Every git-config invocation in a source fragment, in line order.
 *
 * A `config` word counts when it is the git subcommand of the statement — or
 * when it opens an argv array literal (`["config", …]`), which is how a suite
 * spells the same invocation. A `config` word that follows some other
 * subcommand (`git commit -m "config user.email"`) is text, not an invocation.
 */
export function scanSource(text) {
  const findings = [];
  for (const statement of statements(tokenize(text))) {
    const { words, afterBracket } = shape(statement);
    const values = words.map((word) => word.value);
    for (let index = 0; index < values.length; index += 1) {
      if (values[index] !== "config") continue;
      const gitIndex = values.lastIndexOf("git", index - 1);
      const precedesCommand = gitIndex >= 0 && firstNonOption(values, gitIndex + 1) === index;
      if (!precedesCommand && !afterBracket[index]) continue;
      const result = classifyInvocation(values.slice(index + 1));
      if (result.kind !== "write") continue;
      findings.push({ line: words[index].line, kind: "write", key: result.key, reason: result.reason });
    }
  }
  return findings;
}

function firstNonOption(values, start) {
  let index = start;
  while (index < values.length) {
    const value = values[index];
    if (GIT_GLOBAL_VALUE_OPTIONS.has(value)) {
      index += 2;
      continue;
    }
    if (value.startsWith("-")) {
      index += 1;
      continue;
    }
    return index;
  }
  return -1;
}

/** The carriers, by pattern, relative to a project root. */
export function carrierPaths(root) {
  const found = [];
  const walk = (directory, predicate) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        walk(absolute, predicate);
      } else if (entry.isFile() && predicate(entry.name)) {
        found.push(absolute);
      }
    }
  };
  walk(path.join(root, "scripts"), (name) => name.endsWith(".test.mjs"));
  let packages = [];
  try {
    packages = fs.readdirSync(path.join(root, "packages"), { withFileTypes: true });
  } catch {
    packages = [];
  }
  for (const entry of packages) {
    if (!entry.isDirectory()) continue;
    walk(path.join(root, "packages", entry.name, "test"), (name) => name.endsWith(".test.mjs"));
  }
  walk(path.join(root, "template", ".agentic-workflow", "hooks", "tests"), (name) => name.endsWith(".sh"));
  return found.map((absolute) => path.relative(root, absolute).split(path.sep).join("/")).sort();
}

/** Scan a project root: `{ carriers, findings }`, findings in path then line order. */
export function scanTree(root) {
  const carriers = carrierPaths(root);
  const findings = [];
  for (const relative of carriers) {
    const text = fs.readFileSync(path.join(root, relative), "utf8");
    for (const finding of scanSource(text)) {
      findings.push({ path: relative, line: finding.line, key: finding.key, reason: finding.reason });
    }
  }
  return { carriers, findings };
}

export function render(result) {
  const lines = [`git-config-writes — ${result.carriers.length} carriers scanned, ${result.findings.length} findings`];
  for (const finding of result.findings) {
    lines.push(`FINDING ${finding.path}:${finding.line} — ${finding.reason}; pass it per invocation with -c instead`);
  }
  lines.push(`git-config-writes — ${result.findings.length} findings`);
  lines.push(`verdict: ${result.findings.length === 0 ? "PASS" : "FAIL"}`);
  return `${lines.join("\n")}\n`;
}

function usage(message) {
  process.stderr.write(`git-config-writes: ${message}\n`);
  process.stderr.write("usage: bun scripts/git-config-writes.mjs [--root <dir>]  (node fallback, same argv)\n");
  return 2;
}

export function main(argv) {
  let root = null;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--root") {
      const value = argv[index + 1];
      if (value === undefined) return usage("--root needs a directory");
      root = path.resolve(value);
      index += 1;
    } else {
      return usage(`unknown argument ${argv[index]}`);
    }
  }
  root = root ?? DEFAULT_ROOT;
  let stat;
  try {
    stat = fs.statSync(root);
  } catch {
    return usage(`${root} is not a directory`);
  }
  if (!stat.isDirectory()) return usage(`${root} is not a directory`);
  const result = scanTree(root);
  process.stdout.write(render(result));
  return result.findings.length === 0 ? 0 : 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
