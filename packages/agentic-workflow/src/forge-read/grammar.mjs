/**
 * grammar.mjs — the forge-read route's one classifier (issue #612).
 *
 * A forge read that can carry third-party text is a *content-bearing* read: an
 * issue or PR body, a title, a conversation comment, a review. #470's guard is
 * the only path that may return such text, so every surface that decides
 * "is this read content?" asks this module and nothing else:
 *
 *   - the guarded read (`./index.mjs`) — argv in, a guarded delivery out;
 *   - the ad-hoc read shim (`./shim.mjs`) — the same argv, through the same
 *     decision, so the trampoline can never disagree with the subcommand;
 *   - `scripts/forge-read-drift.mjs` — the pin that bans the raw form from the
 *     shipped prose, scanning Markdown instead of argv.
 *
 * One allowlist, one classifier, no second copy — the #555/#610 pattern
 * transposed from the launcher to the forge read.
 *
 * The three decisions the code carries:
 *
 *   * **`view` is the whole surface.** `gh issue view` / `gh pr view` is what
 *     the workflow's prose orders when it wants a body or a comment thread;
 *     `list`, `search`, `api`, `comment`, `edit`, `create` and the label verbs
 *     are outside this grammar and stay sanctioned (the list forms' title
 *     exposure is a declared residual, unit 612's SPEC §Residual).
 *   * **the field list decides, and an unreadable list fails closed.** A
 *     `--json` list that names `title`, `body`, `comments`, `reviews` or a body
 *     twin is content; a list the scanner cannot read (`--json ...`) is
 *     `elided`, never assumed to be metadata.
 *   * **a bare `view` is content.** Without `--json` the CLI prints the body,
 *     so "no field list" is the largest read on the surface, not the smallest.
 *
 * Everything is pure: no filesystem, no process, no spawn.
 */

/** The contract this module implements, versioned for its consumers. */
export const FORGE_READ_CONTRACT = "forge-read@1";

/**
 * The forge fields that carry third-party text — the closed set a read may never
 * deliver raw. `title` and `body` are the payload's own; `comments` and
 * `reviews` are the threads; the `body*` twins are the REST spellings.
 */
export const FORGE_CONTENT_FIELDS = Object.freeze([
  "title",
  "body",
  "bodyText",
  "bodyHTML",
  "comments",
  "reviews",
  "reviewComments",
]);

/** The `gh` subcommands whose `view` verb this route owns. */
export const FORGE_VIEW_TARGETS = Object.freeze(["issue", "pr"]);

/** What the classifier can answer. `elided` fails closed, `other` passes through. */
export const FORGE_READ_KINDS = Object.freeze(["content", "metadata", "elided", "other"]);

/** Ties a decision to the rule that produced it, so a refusal can name itself. */
export const FORGE_READ_REASONS = Object.freeze([
  "content-field",
  "rendered-view",
  "comments-flag",
  "metadata-fields",
  "elided-field-list",
  "web-open",
  "help",
  "not-a-view-command",
]);

/** Shell words that end a command as prose writes it. */
const PROSE_STOP = /[`|"')\n]/u;
/** The literal `gh <issue|pr> view` occurrence, wherever prose carries it. */
const OCCURRENCE = /\bgh\s+(issue|pr)\s+view\b/gu;
/** A command whose `--json` value wrapped onto the following line. */
const DANGLING_JSON = /(?:^|\s)--json=?$/u;

/**
 * One token's worth of punctuation, trimmed so a field list that ends a sentence
 * still parses: `--json state,` and `--json state.` are the same request.
 */
function trimToken(token) {
  return token.replace(/[,.;:]+$/u, "");
}

/**
 * Split a command line into argv-shaped tokens, dropping the leading `gh`.
 *
 * @param {string} text
 * @returns {string[]} the tokens *after* `gh`, or `[]` when the text is not a gh command
 */
export function forgeArgv(text) {
  const tokens = String(text ?? "")
    .split(/\s+/u)
    .map(trimToken)
    .filter((token) => token !== "");
  if (tokens[0] !== "gh") return [];
  return tokens.slice(1);
}

/** The number a view names: the first positional that is all digits. */
function numberIn(rest) {
  for (const token of rest) {
    if (/^\d+$/u.test(token)) return Number.parseInt(token, 10);
  }
  return null;
}

/** The `--json` value: `--json a,b` or `--json=a,b`. */
function jsonValue(rest) {
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token.startsWith("--json=")) return token.slice("--json=".length);
    if (token === "--json") return rest[index + 1] ?? "";
  }
  return null;
}

/** Whether any requested field can carry third-party text. */
function contentFields(fieldList) {
  const fields = String(fieldList ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter((field) => field !== "");
  return fields.filter((field) => FORGE_CONTENT_FIELDS.includes(field));
}

/**
 * Classify one `gh` command as argv (the shim's input) into the route's one
 * decision.
 *
 * @param {string[]} argv the arguments *after* `gh`
 * @returns {{kind: "content"|"metadata"|"elided"|"other", reason: string, target: string|null, number: number|null, comments: boolean, reviews: boolean, fields: string[]}}
 */
export function classifyForgeArgs(argv) {
  const rest = Array.isArray(argv) ? argv.map((value) => trimToken(String(value))) : [];
  const base = { kind: "other", reason: "not-a-view-command", target: null, number: null, comments: false, reviews: false, fields: [] };
  const target = rest[0];
  if (!FORGE_VIEW_TARGETS.includes(target) || rest[1] !== "view") return base;
  const view = { ...base, target, number: numberIn(rest.slice(2)) };
  const args = rest.slice(2);
  if (args.includes("--web") || args.includes("-w")) return { ...view, kind: "other", reason: "web-open" };
  if (args.includes("--help") || args.includes("-h")) return { ...view, kind: "other", reason: "help" };
  const comments = args.includes("--comments");
  const reviews = args.includes("--reviews");
  const list = jsonValue(args);
  if (list === null) return { ...view, kind: "content", reason: comments ? "comments-flag" : "rendered-view", comments, reviews };
  const fields = contentFields(list);
  // A requested thread field is a thread read, not a body read.
  const thread = {
    comments: comments || fields.includes("comments"),
    reviews: reviews || fields.includes("reviews") || fields.includes("reviewComments"),
  };
  if (fields.length > 0) return { ...view, kind: "content", reason: "content-field", ...thread, fields };
  if (thread.comments || thread.reviews) return { ...view, kind: "content", reason: "comments-flag", ...thread };
  // A list the scanner cannot read is refused, never assumed metadata-only.
  if (list === "" || /^(?:\.{3}|…)$/u.test(list.trim()) || list.includes("…") || list.includes("...")) {
    return { ...view, kind: "elided", reason: "elided-field-list", ...thread };
  }
  return { ...view, kind: "metadata", reason: "metadata-fields", ...thread };
}

/** 1-based line of an offset in a document. */
function lineAt(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

/**
 * Every forge `view` a Markdown document orders, classified. This is the pin's
 * reader: it scans prose, never a sentence's meaning, and stops a command at the
 * punctuation that ends it.
 *
 * @param {string} text
 * @returns {Array<{command: string, line: number, kind: string, reason: string, target: string|null, number: number|null, comments: boolean, reviews: boolean, fields: string[]}>}
 */
export function findForgeReads(text) {
  const source = typeof text === "string" ? text : "";
  const reads = [];
  for (const match of source.matchAll(OCCURRENCE)) {
    const start = match.index ?? 0;
    let end = start;
    while (end < source.length && !PROSE_STOP.test(source[end])) end += 1;
    let command = source.slice(start, end);
    if (DANGLING_JSON.test(command.trimEnd())) {
      // The field list wrapped: the next line's first token is its value.
      let next = end;
      while (next < source.length && source[next] !== "\n") next += 1;
      while (next < source.length && /\s/u.test(source[next])) next += 1;
      let tail = next;
      while (tail < source.length && !PROSE_STOP.test(source[tail])) tail += 1;
      command = `${command.trimEnd()} ${source.slice(next, tail)}`;
      end = tail;
    }
    reads.push({
      command: command.replace(/\s+/gu, " ").trim(),
      line: lineAt(source, start),
      ...classifyForgeArgs(forgeArgv(command)),
    });
  }
  return reads;
}
