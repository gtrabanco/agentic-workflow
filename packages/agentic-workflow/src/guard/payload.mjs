/**
 * payload.mjs — the hook payload's one normalization rule (unit 554).
 *
 * Every agent platform hands a hook a different document: Claude Code and Cursor
 * nest the facts under `tool_input`, Copilot under `toolArgs`, a generic adapter
 * under `args`, and an older one at the top level. Which key carries the command,
 * which carries the path, and what counts as an unusable payload is the same
 * question on every platform — so the rule lives here, once, and each adapter
 * names only its stdin source and its output format (its real platform seam).
 *
 * The precedence and the validity rule are the retired
 * `hooks/adapters/normalize-hook-payload.sh` jq program's, value for value:
 * `//` semantics (a `null` or `false` value falls through to the next key), every
 * candidate must be a string, and at least one of the two answers must be
 * non-empty.
 */

/** The keys that may carry the command, in precedence order. */
export const COMMAND_KEYS = Object.freeze([
  "tool_input.command",
  "input.command",
  "toolArgs.command",
  "args.command",
  "command",
]);

/** The keys that may carry the path, in precedence order. */
export const PATH_KEYS = Object.freeze([
  "tool_input.file_path",
  "tool_input.path",
  "input.file_path",
  "input.path",
  "toolArgs.file_path",
  "toolArgs.path",
  "args.file_path",
  "args.path",
  "file_path",
  "path",
]);

export const NOT_AN_OBJECT = "hook payload must be an object";
export const NO_RECOGNIZED_FIELD = "hook payload must contain a recognized command or path";

function readKey(document, dotted) {
  let cursor = document;
  for (const segment of dotted.split(".")) {
    if (typeof cursor !== "object" || cursor === null || Array.isArray(cursor)) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

/** The first candidate that is neither `null` nor `false` (jq's `//` chain). */
function firstPresent(document, keys) {
  for (const key of keys) {
    const value = readKey(document, key);
    if (value === undefined || value === null || value === false) continue;
    return value;
  }
  return "";
}

/**
 * `normalizeHookPayload(value)` — `{ok: true, command, path}` or `{ok: false,
 * message}`. `value` is the parsed document or the raw text a hook received; a
 * string is parsed first, and a document that is not an object is refused.
 */
export function normalizeHookPayload(value) {
  let document = value;
  if (typeof document === "string") {
    try {
      document = JSON.parse(document);
    } catch {
      return { ok: false, message: NOT_AN_OBJECT };
    }
  }
  if (typeof document !== "object" || document === null || Array.isArray(document)) {
    return { ok: false, message: NOT_AN_OBJECT };
  }
  const command = firstPresent(document, COMMAND_KEYS);
  const filePath = firstPresent(document, PATH_KEYS);
  if (typeof command !== "string" || typeof filePath !== "string") {
    return { ok: false, message: NO_RECOGNIZED_FIELD };
  }
  if (command.length === 0 && filePath.length === 0) {
    return { ok: false, message: NO_RECOGNIZED_FIELD };
  }
  return { ok: true, command, path: filePath };
}
