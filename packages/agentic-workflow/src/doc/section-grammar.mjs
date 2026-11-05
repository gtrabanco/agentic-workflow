/**
 * Argument grammar for the `section` subcommand (issue #407, S5).
 *
 * One operation per invocation — `locate`, `remove` or `replace` — over one
 * document and one selector. `--file -` reads the document from stdin and
 * `--replacement -` reads the replacement text from stdin; the two cannot both
 * read it. `--write` persists the splice (and only makes sense for
 * `remove`/`replace` over a real path), while the default is a read-only run
 * that prints the transformed document to stdout.
 *
 * The selector is JSON because it is the primitive's own data form: a heading
 * title string, a path array, or an object carrying `heading` / `path` /
 * `headingRegex` / `line` (with an optional `within` scope). It is parsed here
 * and validated by the locator, so one owner decides what a selector is.
 *
 * Exit-code territory (owned by the CLI, not this parser): a thrown error here
 * is a usage error (exit 1); a typed selector-resolution failure is a refusal
 * (exit 2) unless its code is `BAD_SELECTOR`, which is a malformed selector and
 * therefore usage.
 */

/** The closed operation set. */
export const SECTION_OPS = Object.freeze(["locate", "remove", "replace"]);

function usageError(message) {
  const error = new Error(
    `usage: agentic-workflow section <locate|remove|replace> --file <path|-> --selector <json> [--replacement <path|->] [--write] [--json] — ${message}`,
  );
  error.code = "USAGE";
  return error;
}

function parseSelectorJson(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw usageError(`--selector is not valid JSON: ${error.message}`);
  }
}

/**
 * Parse the arguments after `section`. Returns
 * `{op, file, selector, replacement, write, json}`; throws a usage error on any
 * malformed invocation.
 */
export function parseSectionArgs(argv) {
  if (!Array.isArray(argv) || argv.length === 0) throw usageError("no operation given");
  const op = argv[0];
  if (!SECTION_OPS.includes(op)) throw usageError(`unknown operation "${op}"`);
  const parsed = { op, file: null, selector: null, replacement: null, write: false, json: false };
  const positionals = [];
  let sawSelector = false;
  let index = 1;
  while (index < argv.length) {
    const arg = argv[index];
    if (arg === "--write") {
      parsed.write = true;
      index += 1;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
      index += 1;
      continue;
    }
    if (arg === "--file" || arg === "--selector" || arg === "--replacement") {
      const value = argv[index + 1];
      if (value === undefined || value === "") throw usageError(`${arg} requires a value`);
      if (arg === "--file") {
        if (parsed.file !== null) throw usageError("--file given twice");
        parsed.file = value;
      } else if (arg === "--selector") {
        if (sawSelector) throw usageError("--selector given twice");
        sawSelector = true;
        parsed.selector = parseSelectorJson(value);
      } else {
        if (parsed.replacement !== null) throw usageError("--replacement given twice");
        parsed.replacement = value;
      }
      index += 2;
      continue;
    }
    if (arg !== "-" && arg.startsWith("-")) throw usageError(`unknown flag "${arg}"`);
    positionals.push(arg);
    index += 1;
  }
  if (positionals.length > 0) throw usageError(`unexpected argument "${positionals[0]}"`);
  if (parsed.file === null) throw usageError("--file is required");
  if (!sawSelector) throw usageError("--selector is required");
  if (parsed.write && parsed.file === "-") throw usageError("--write needs a file path, not stdin");
  if (op === "locate" && parsed.write) throw usageError("--write belongs to remove/replace");
  if (op !== "replace" && parsed.replacement !== null) throw usageError("--replacement belongs to replace");
  if (op === "replace" && parsed.replacement === null) throw usageError("replace requires --replacement");
  if (parsed.file === "-" && parsed.replacement === "-") throw usageError("--file - and --replacement - cannot both read stdin");
  return parsed;
}
