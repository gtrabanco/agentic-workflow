/**
 * Argument grammar for the `doc` retrieval entry point (unit 65, D2).
 *
 * One grammar branch: the first token after `doc` starting with `-` selects
 * a retrieval operation (`--sync` / `--query <term>` / `--status` /
 * `--rebuild`); a positional first token is a half-A doc operation that ships
 * with unit 71 and is refused here. `--json-only` may appear anywhere and
 * switches stdout to exactly one JSON document (AC8).
 *
 * Exit codes (D3): 0 success including degraded · 1 usage/IO · 2 path
 * refusal (owned by the crate's edit services, not this grammar).
 */

export const RETRIEVAL_FLAGS = {
  "--sync": "sync",
  "--query": "query",
  "--status": "status",
  "--rebuild": "rebuild",
};

function usageError(msg) {
  const e = new Error(
    `usage: agentic-workflow doc (--sync [--quiet] | --query <term> [--since <ISO>] [--until <ISO>] [--file <path>] [--mode keyword|hybrid] | --status | --rebuild) [--json-only] — ${msg}`,
  );
  e.code = "USAGE";
  return e;
}

/**
 * Parse the arguments after `doc`. Returns
 * `{op: "sync"|"query"|"status"|"rebuild", query: string|null, jsonOnly: boolean}`.
 * Throws a usage error (exit 1 territory) on any malformed invocation.
 */
export function parseDocArgs(argv) {
  const out = { op: null, query: null, jsonOnly: false, quiet: false };
  const filters = { since: null, until: null, file: null };
  const FILTER_FLAGS = { "--since": "since", "--until": "until", "--file": "file" };
  const MODES = new Set(["keyword", "hybrid"]);
  let sawFilter = false;
  let sawMode = false;
  if (!Array.isArray(argv) || argv.length === 0) throw usageError("no operation given");

  // D2: a positional first token is the half-A branch — not shipped in this unit.
  if (!argv[0].startsWith("-")) {
    throw usageError(
      `positional doc operations (read/edit/index) ship with unit 71; retrieval ops: ${Object.keys(RETRIEVAL_FLAGS).join(" | ")}`,
    );
  }

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--json-only") {
      out.jsonOnly = true;
      i++;
      continue;
    }
    if (arg === "--quiet") {
      out.quiet = true;
      i++;
      continue;
    }
    if (arg === "--mode") {
      const value = argv[i + 1];
      if (value === undefined || value === "") throw usageError("--mode requires a value (keyword | hybrid)");
      if (!MODES.has(value)) throw usageError(`unknown mode "${value}" (expected keyword | hybrid)`);
      out.mode = value;
      sawMode = true;
      i += 2;
      continue;
    }
    if (arg in FILTER_FLAGS) {
      const value = argv[i + 1];
      if (value === undefined || value === "") {
        throw usageError(`${arg} requires a non-empty value`);
      }
      filters[FILTER_FLAGS[arg]] = value;
      sawFilter = true;
      i += 2;
      continue;
    }
    const op = RETRIEVAL_FLAGS[arg];
    if (!op) throw usageError(`unknown flag "${arg}"`);
    if (out.op) throw usageError("only one retrieval operation allowed");
    out.op = op;
    if (op === "query") {
      const term = argv[i + 1];
      if (term === undefined || term === "" || term.startsWith("-")) {
        throw usageError("--query requires a non-empty term");
      }
      out.query = term;
      i += 2;
      continue;
    }
    i++;
  }

  if (!out.op) throw usageError("no retrieval operation given");
  // AC14's structured filters and the P7 mode flag belong to queries only.
  if (out.op === "query") {
    out.since = filters.since;
    out.until = filters.until;
    out.file = filters.file;
    out.mode = out.mode ?? "keyword";
  } else if (sawFilter || sawMode) {
    throw usageError("--since/--until/--file/--mode are query flags and require --query");
  }
  return out;
}
