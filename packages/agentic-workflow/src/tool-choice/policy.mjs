/**
 * policy.mjs — the shell-tool-choice policy (issue #610).
 *
 * Two enforcement layers read this file and nothing else: the pi extension's
 * `tool_call` carrier (`packages/pi-agentic-workflow/src/guards/tool-choice.ts`,
 * which blocks or rewrites before a command runs) and
 * `scripts/invocation-drift.mjs` (which fails a push that teaches the fallback
 * tool). One allowlist, one classifier, no second copy — the #555 runner-set
 * pattern transposed from the CLI launcher to the agent's own bash tool choice.
 *
 * The words are not here. `AGENTS.md` §Runtime convention owns the convention
 * and #269 owns the `rg`-first default; every reason this module builds cites
 * that owner instead of restating it, and the reason is what the model reads.
 *
 * Everything is pure: no filesystem, no process, no Pi import. Availability is
 * the caller's input (the doctor's resolver answers it), so a suite drives every
 * posture with no session.
 *
 * The three decisions the code carries:
 *
 *   * **filter vs search** is positional. A `grep` that follows a pipe reads
 *     stdin — `rg` answers it identically — so it passes untouched; a `grep`
 *     that is not pipe-fed and names a path operand (or asks for recursion) is
 *     search and is intercepted. The measured corpus behind this unit is what
 *     makes the distinction necessary, not stylistic (see
 *     `test/fixtures/tool-choice-corpus.json`).
 *   * **sanctioned node forms** are the per-file test runner, the root suite's
 *     documented node leg and the bootstrap pair (which provision the very
 *     runtime it would forward to). Everything else is the default-tool class.
 *   * **forwarding is exact or refused**. rg 15's `-E` is an encoding and `-r`
 *     is a replacement, so a grep flag is translated only when the table knows
 *     the counterpart; an unknown flag keeps its text and marks the segment
 *     *not rewritable*, which forces the blocking posture instead of a silent
 *     rewrite into a different command.
 */

/** The contract this module implements, versioned for the coverage tools. */
export const TOOL_CHOICE_CONTRACT = "shell-tool-choice@1";

/**
 * The sanctioned `node` scripts — one declaration, two readers. Extending it is
 * a reviewed change: the parity suite refuses a consumer that stops reading it.
 */
export const NODE_SANCTIONED_SCRIPTS = Object.freeze([
  "scripts/setup-env.mjs",
  "scripts/update-tools.mjs",
  "scripts/run-root-suite.mjs",
]);

/**
 * The bootstrap pair: the two scripts that must stay node-runnable, each with
 * the reason it cannot be bun-first. `scripts/invocation-drift.mjs` imports this
 * map as its allowlist, so a row added here is sanctioned on both layers.
 */
export const BOOTSTRAP_SCRIPTS = Object.freeze(new Map([
  ["scripts/setup-env.mjs", "provisions bun, so it must run before bun exists (#331 S6/AC8)"],
  ["scripts/update-tools.mjs", "declared node-run beside setup-env (#331 S6/AC8)"],
]));

/** Where the convention lives — cited in every reason, never restated. */
const CONVENTION_OWNER = "AGENTS.md §Runtime convention";

/** Shell operators that start a new command segment. */
const OPERATORS = ["||", "&&", "|", ";", "\n"];

/**
 * Split a bash command into segments, keeping each segment's leading operator so
 * position (and therefore "is this grep pipe-fed?") survives the split, plus its
 * offsets so a rewrite splices the new text in and leaves every other byte where
 * it was. Quoted operators stay inside their argument: `grep -n "^| gate"` is one
 * segment.
 *
 * @param {string} command
 * @returns {{operator: string, text: string, start: number, end: number}[]}
 */
export function splitCommandSegments(command) {
  const text = typeof command === "string" ? command : "";
  const segments = [];
  let buffer = "";
  let bufferStart = -1;
  let quote = null;
  let operator = "";
  const append = (char, at) => {
    if (buffer === "") bufferStart = at;
    buffer += char;
  };
  const push = (next) => {
    const trimmed = buffer.trim();
    if (trimmed !== "") {
      const start = bufferStart + (buffer.length - buffer.trimStart().length);
      segments.push({ operator, text: trimmed, start, end: start + trimmed.length });
    }
    buffer = "";
    bufferStart = -1;
    operator = next;
  };
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote !== null) {
      append(char, index);
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      append(char, index);
      continue;
    }
    const matched = OPERATORS.find((candidate) => text.startsWith(candidate, index));
    if (matched !== undefined) {
      push(matched);
      index += matched.length - 1;
      continue;
    }
    append(char, index);
  }
  push("");
  return segments;
}

/**
 * Whitespace tokenizer that keeps a quoted operand as one token, quotes
 * included (so the forwarded command can be rebuilt without re-quoting a value
 * the shell already quoted).
 *
 * @param {string} segment
 * @returns {string[]}
 */
export function segmentTokens(segment) {
  const tokens = [];
  let buffer = "";
  let quote = null;
  for (const char of segment) {
    if (quote !== null) {
      buffer += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      buffer += char;
      continue;
    }
    if (/\s/.test(char)) {
      if (buffer !== "") tokens.push(buffer);
      buffer = "";
      continue;
    }
    buffer += char;
  }
  if (buffer !== "") tokens.push(buffer);
  return tokens;
}

const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/;

/** Index of the command word in a token list (an `A=b` prefix is not the command). */
function commandIndex(tokens) {
  let index = 0;
  while (index < tokens.length && ASSIGNMENT.test(tokens[index])) index += 1;
  return index;
}

/** The invoked command's name, with any directory prefix removed. */
function headOf(tokens) {
  const index = commandIndex(tokens);
  const word = tokens[index] ?? "";
  return word.replace(/^.*\//, "");
}

const GREP_HEADS = new Set(["grep", "egrep", "fgrep"]);
const NODE_HEADS = new Set(["node", "nodejs"]);

/** `-v`-style flags: a single known letter in a cluster, or an exact long name. */
const KEEP_CLUSTER = new Set(["n", "i", "v", "c", "l", "L", "w", "x", "o", "q", "s", "H", "h", "a", "F", "P", "I"]);
/** Grep-only spellings with no rg counterpart: dropping them is the translation. */
const DROP_CLUSTER = new Set(["E", "G", "r", "R"]);
/** Short flags that carry a value in the next token. */
const VALUE_CLUSTER = new Set(["A", "B", "C", "m", "e"]);

/** Long grep flags whose meaning is the same in rg, as a short spelling. */
const LONG_EQUIVALENT = new Map([
  ["--line-number", "-n"],
  ["--ignore-case", "-i"],
  ["--invert-match", "-v"],
  ["--count", "-c"],
  ["--files-with-matches", "-l"],
  ["--files-without-match", "-L"],
  ["--word-regexp", "-w"],
  ["--line-regexp", "-x"],
  ["--only-matching", "-o"],
  ["--quiet", "-q"],
  ["--silent", "-q"],
  ["--no-messages", "--no-messages"],
  ["--no-filename", "-I"],
  ["--with-filename", "-H"],
  ["--fixed-strings", "-F"],
  ["--perl-regexp", "-P"],
  ["--text", "-a"],
  ["--colour", "--color"],
  ["--colour=never", "--color=never"],
  ["--colour=always", "--color=always"],
  ["--colour=auto", "--color=auto"],
]);

/** Long grep flags that translate by being dropped (rg's default already). */
const LONG_DROPS = new Set([
  "--extended-regexp",
  "--basic-regexp",
  "--recursive",
  "--dereference-recursive",
  "--no-color",
  "--colour=never-not-a-flag",
  "--binary-files=binary",
  "--binary-files=without-match",
  "--directories=recurse",
  "--directories=skip",
]);

/**
 * The glob value as the tool must read it. Two rules, one invariant (the
 * emitted `-g` argument is exactly one shell word that expands to the value the
 * input named):
 *
 *   * the input's own quotes are shell quoting, not part of the value — the
 *     wrapper below owns the quoting, and keeping both pairs emits `''*.ts''`,
 *     which the shell un-quotes back into an unquoted, glob-expanding word (the
 *     external-verify B1 class: a rewrite into a different command);
 *   * an embedded quote is escaped the way `protect()` escapes it, so a value
 *     the input quoted never splits the word in two.
 *
 * Only the three glob mappers de-quote: `--color`/`--colour` pass the value
 * through untouched, because their emitted spelling is already correct as
 * written and nothing outside this class may move.
 */
const dequote = (value) => value.replace(/^(['"])([\s\S]*)\1$/u, "$2");
const shellWord = (raw) => `'${raw.replaceAll("'", `'\\''`)}'`;

/** Long grep flags that carry a value, and the rg spelling of that value. */
const LONG_VALUES = new Map([
  // A translated glob is one shell word: `--include=*.mjs` reached the tool as
  // one literal word, and an unquoted `-g *.mjs` would let the shell expand it
  // before rg sees it.
  ["--include", (value) => ["-g", shellWord(dequote(value))]],
  ["--exclude", (value) => ["-g", shellWord(`!${dequote(value)}`)]],
  ["--exclude-dir", (value) => ["-g", shellWord(`!${dequote(value)}/**`)]],
  ["--binary-files", (value) => (value === "text" ? ["-a"] : [])],
  ["--color", (value) => [`--color=${value}`]],
  ["--colour", (value) => [`--color=${value}`]],
]);

/** The translation result: either a rebuilt token list, or why it was refused. */
function translateGrepTokens(tokens) {
  const headIndex = commandIndex(tokens);
  const translated = tokens.slice(0, headIndex + 1);
  let rewritable = true;
  let refusals = 0;
  for (let index = headIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("-") || token === "-" || token === "--") {
      translated.push(token);
      continue;
    }
    if (token.startsWith("--")) {
      const [name, inlineValue] = token.includes("=") ? [token.slice(0, token.indexOf("=")), token.slice(token.indexOf("=") + 1)] : [token, undefined];
      if (LONG_DROPS.has(token) || LONG_DROPS.has(name)) continue;
      if (LONG_EQUIVALENT.has(token)) {
        translated.push(LONG_EQUIVALENT.get(token));
        continue;
      }
      if (LONG_VALUES.has(name)) {
        const mapper = LONG_VALUES.get(name);
        const value = inlineValue ?? tokens[index + 1];
        if (inlineValue === undefined && value !== undefined) index += 1;
        if (value === undefined) {
          rewritable = false;
          refusals += 1;
          translated.push(token);
          continue;
        }
        translated.push(...mapper(value));
        continue;
      }
      // A long flag with no declared counterpart: keep its text, refuse the rewrite.
      rewritable = false;
      refusals += 1;
      translated.push(token);
      continue;
    }
    // `-A3` and friends: value attached to the letter.
    const attached = /^-([ABCm])(\d+)$/.exec(token);
    if (attached !== null) {
      translated.push(`-${attached[1]}`, attached[2]);
      continue;
    }
    if (token.length === 2 && VALUE_CLUSTER.has(token[1])) {
      translated.push(token);
      if (tokens[index + 1] !== undefined) {
        translated.push(tokens[index + 1]);
        index += 1;
      }
      continue;
    }
    if (token.length === 2 && (KEEP_CLUSTER.has(token[1]) || LONG_EQUIVALENT.has(token))) {
      translated.push(token);
      continue;
    }
    // A cluster: each letter is kept, dropped, value-carrying, or unknown.
    const cluster = token.slice(1).split("");
    let rebuilt = "-";
    let refused = false;
    for (let at = 0; at < cluster.length; at += 1) {
      const letter = cluster[at];
      if (DROP_CLUSTER.has(letter)) continue;
      if (KEEP_CLUSTER.has(letter)) {
        rebuilt += letter;
        continue;
      }
      if (VALUE_CLUSTER.has(letter)) {
        // The rest of the cluster is the value (`-A3`) or the next token is.
        const rest = cluster.slice(at + 1).join("");
        rebuilt += letter;
        if (rebuilt.length > 1) translated.push(rebuilt);
        rebuilt = "-";
        if (rest !== "") translated.push(rest);
        else if (tokens[index + 1] !== undefined) {
          translated.push(tokens[index + 1]);
          index += 1;
        }
        continue;
      }
      refused = true;
      break;
    }
    if (refused) {
      rewritable = false;
      refusals += 1;
      translated.push(token);
      continue;
    }
    if (rebuilt.length > 1) translated.push(rebuilt);
  }
  return { tokens: translated, rewritable, refusals };
}

/**
 * A token that would change meaning when it stops being a separate word: a
 * bare `|`, `;` or whitespace inside a pattern is a shell operator, so the
 * rebuild quotes it. Redirection words (`2>&1`, `>`) are left alone — quoting
 * them would disconnect the redirect.
 */
const NEEDS_QUOTING = /[|;\s]/;

function protect(token) {
  if (!NEEDS_QUOTING.test(token)) return token;
  if (/^(['"]).*\1$/s.test(token)) return token;
  return `'${token.replaceAll("'", `'\\''`)}'`;
}

/** Rebuild a segment from tokens, keeping the command word and prefix as written. */
function rebuild(tokens, headWord) {
  const headIndex = commandIndex(tokens);
  const rebuilt = tokens.slice();
  rebuilt[headIndex] = headWord;
  return rebuilt.map((token, at) => (at === headIndex ? token : protect(token))).join(" ");
}

/**
 * The `rg` equivalent of a grep segment, or `null` when the segment is not grep.
 *
 * @param {string[]} tokens
 * @returns {string | null}
 */
export function forwardGrepSegment(tokens) {
  if (headOf(tokens) === "" || !GREP_HEADS.has(headOf(tokens))) return null;
  const { tokens: translated } = translateGrepTokens(tokens);
  return rebuild(translated, "rg");
}

/** Whether a token list is a sanctioned node invocation (never intercepted). */
function isSanctionedNode(tokens) {
  const headIndex = commandIndex(tokens);
  const head = headOf(tokens);
  const args = tokens.slice(headIndex + 1);
  const [first] = args;
  if (first === undefined) return false;
  if (first === "--version" || first === "-v" || first === "--help" || first === "-h") return true;
  if (first === "--test" || first.startsWith("--test=")) return true;
  const unquoted = first.replace(/^['"]|['"]$/g, "");
  if (NODE_SANCTIONED_SCRIPTS.includes(unquoted)) return true;
  // A path-qualified spelling of a sanctioned script is the same script.
  const normalized = unquoted.replace(/^\.\//, "");
  return NODE_SANCTIONED_SCRIPTS.includes(normalized) || NODE_SANCTIONED_SCRIPTS.includes(head);
}

/**
 * The `bun` equivalent of a node segment, or `null` when the segment is not a
 * node invocation or is a sanctioned one (those have no forwarded twin).
 *
 * @param {string[]} tokens
 * @returns {string | null}
 */
export function forwardNodeSegment(tokens) {
  if (!NODE_HEADS.has(headOf(tokens))) return null;
  if (isSanctionedNode(tokens)) return null;
  return rebuild(tokens, "bun");
}

/**
 * The path operands of a grep segment. The first positional token is the
 * *pattern* (or, with `-e`/`-f`, a flag value), so a bare `grep -v x` — the
 * filter idiom written at the head of a pipeline — names no file and is not
 * search. Only a segment that really points grep at a path is.
 */
function grepPathOperands(tokens) {
  const headIndex = commandIndex(tokens);
  const args = tokens.slice(headIndex + 1);
  const paths = [];
  let patternTaken = false;
  let index = 0;
  while (index < args.length) {
    const token = args[index];
    if (token === "-e" || token === "--regexp" || token === "-f" || token === "--file") {
      patternTaken = true;
      index += 2;
      continue;
    }
    if (token.startsWith("--regexp=") || token.startsWith("--file=")) {
      patternTaken = true;
      index += 1;
      continue;
    }
    if (token.startsWith("-") && token !== "-") {
      index += /^-[ABCm]$/.test(token) ? 2 : 1;
      continue;
    }
    if (!patternTaken) {
      patternTaken = true;
      index += 1;
      continue;
    }
    paths.push(token);
    index += 1;
  }
  return paths;
}

/** Whether a grep segment is search rather than a stdin filter. */
function isGrepSearch(tokens, operator) {
  if (operator === "|") return false;
  const headIndex = commandIndex(tokens);
  const args = tokens.slice(headIndex + 1);
  const recursive = args.some(
    (token) => /^-[A-Za-z]*[rR]/.test(token) || token === "--recursive" || token === "--dereference-recursive",
  );
  return recursive || grepPathOperands(tokens).length > 0;
}

/** The reason the model reads: what to run instead, and who owns the rule. */
function grepReason(suggestion, rewritable) {
  const lines = [
    `\`grep\` as search is not the repo's tool choice (owner: ${CONVENTION_OWNER}; #269 owns the \`rg\`-first default).`,
    `Equivalent: \`${suggestion}\`.`,
  ];
  if (!rewritable) {
    lines.push(
      "This command's flags have no exact `rg` counterpart, so it was not rewritten: `rg` is recursive by default, reads Rust-regex patterns and spells the rest differently — run the equivalent and adjust before running it.",
    );
  }
  return lines.join(" ");
}

function nodeReason(suggestion) {
  return [
    `\`node\` is the fallback runtime (owner: ${CONVENTION_OWNER}).`,
    `Run: \`${suggestion}\`.`,
    "The sanctioned forms — `node --test <paths>`, `node scripts/run-root-suite.mjs`, the bootstrap pair — stay untouched.",
  ].join(" ");
}

/**
 * Classify one command segment.
 *
 * @param {{operator?: string, text?: string}} segment
 * @returns {{kind: "pass" | "grep-search" | "node-default", head: string, segment: string, suggestion: string | null, rewritable: boolean, reason: string | null}}
 */
export function classifySegment(segment) {
  const text = typeof segment?.text === "string" ? segment.text.trim() : "";
  const operator = typeof segment?.operator === "string" ? segment.operator : "";
  const tokens = segmentTokens(text);
  const head = headOf(tokens);
  const pass = { kind: "pass", head, segment: text, suggestion: null, rewritable: false, reason: null };
  if (tokens.length === 0) return pass;
  if (GREP_HEADS.has(head)) {
    if (!isGrepSearch(tokens, operator)) return pass;
    const { rewritable } = translateGrepTokens(tokens);
    const suggestion = forwardGrepSegment(tokens) ?? rebuild(tokens, "rg");
    return {
      kind: "grep-search",
      head,
      segment: text,
      suggestion,
      rewritable,
      reason: grepReason(suggestion, rewritable),
    };
  }
  if (NODE_HEADS.has(head)) {
    if (isSanctionedNode(tokens)) return pass;
    const suggestion = forwardNodeSegment(tokens) ?? rebuild(tokens, "bun");
    return {
      kind: "node-default",
      head,
      segment: text,
      suggestion,
      rewritable: true,
      reason: nodeReason(suggestion),
    };
  }
  return pass;
}

/**
 * Whether the command text is quote-balanced. An unbalanced command cannot run
 * (the shell refuses it), so the policy stands down rather than accusing a
 * command the shell is about to reject.
 */
function isQuotedBalanced(command) {
  let quote = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (quote !== null) {
      if (char === "\\" && quote === '"') {
        index += 1;
        continue;
      }
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'") {
      quote = "'";
      continue;
    }
    if (char === '"') {
      quote = '"';
      continue;
    }
  }
  return quote === null;
}

/**
 * Every tool-choice violation in a bash command, in command order.
 *
 * A command whose quotes never close is `parsed: false` with no violations: the
 * shell rejects it first, and inventing a violation for text that is not a
 * command would be an accusation the tool choice cannot answer.
 *
 * @param {string} command
 * @returns {{parsed: boolean, violations: ReturnType<typeof classifySegment>[], segments: {operator: string, text: string}[]}}
 */
export function analyzeToolChoice(command) {
  const text = typeof command === "string" ? command : "";
  if (!isQuotedBalanced(text)) return { parsed: false, violations: [], segments: [] };
  const segments = splitCommandSegments(text);
  const violations = [];
  for (const segment of segments) {
    const decision = classifySegment(segment);
    if (decision.kind !== "pass") violations.push(decision);
  }
  return { parsed: true, violations, segments };
}

/**
 * The command with the named violation kinds forwarded in place, ready to run.
 *
 * A rewrite is only ever built from segments the classifier already judged, so
 * a filter, a sanctioned form or an unrelated command word keeps its exact text.
 * The separators are re-emitted from the split, which is why a quoted operator
 * survives as a quoting mistake the shell would have rejected anyway.
 *
 * @param {string} command
 * @param {Iterable<string>} kinds the kinds to forward (`grep-search`, `node-default`)
 * @returns {string}
 */
export function forwardCommand(command, kinds) {
  const wanted = new Set(kinds);
  const text = typeof command === "string" ? command : "";
  if (!isQuotedBalanced(text)) return text;
  const spliced = splitCommandSegments(text).filter((segment) => {
    const decision = classifySegment(segment);
    return wanted.has(decision.kind) && decision.suggestion !== null && decision.rewritable;
  });
  let rebuilt = text;
  for (const segment of [...spliced].reverse()) {
    const decision = classifySegment(segment);
    rebuilt = `${rebuilt.slice(0, segment.start)}${decision.suggestion}${rebuilt.slice(segment.end)}`;
  }
  return rebuilt;
}
