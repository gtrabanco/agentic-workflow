/**
 * Argument grammar for the `doc` retrieval entry point (unit 65, D2).
 *
 * One grammar branch: the first token after `doc` starting with `-` selects
 * a retrieval operation (`--sync` / `--query <term>` / `--status` /
 * `--rebuild`); a positional first token is a half-A doc operation — `read`,
 * `edit` or `index` (issue #366). `--json-only` may appear anywhere on the
 * retrieval branch and switches stdout to exactly one JSON document (AC8);
 * the positional branch carries `--json` for the same switch.
 *
 * Exit codes (D3): 0 success including degraded · 1 usage/IO · 2 refusal
 * (the edit services' refusal line for path refusals, `DOC REFUSAL` for a
 * selector that resolves to nothing or to several sections).
 */

export const RETRIEVAL_FLAGS = {
  "--sync": "sync",
  "--query": "query",
  "--status": "status",
  "--rebuild": "rebuild",
};

/** The closed half-A operation set (issue #366). */
export const DOC_OPS = Object.freeze(["read", "edit", "index"]);

function usageError(msg) {
  const e = new Error(
    `usage: agentic-workflow doc (--sync [--quiet] | --query <term> [--since <ISO>] [--until <ISO>] [--file <path>] [--mode keyword|hybrid] | --status | --rebuild) [--json-only] — ${msg}`,
  );
  e.code = "USAGE";
  return e;
}

/**
 * Parse the half-A positional arguments after `doc`. Returns
 * `{branch: "docop", op, file, section, replacement, out, json, dryRun}`.
 * A missing optional `--section` on `read` means the whole document; `edit`
 * requires `--file` (a real path, never stdin), `--section` and
 * `--replacement`; `index` takes only `--out`. A flag that belongs to another
 * operation is a usage error, never a silent no-op (issue #366, S11): the
 * grammar's own option set is closed, so `--out` on `read`/`edit` is refused
 * exactly as `--file` on `index` is.
 */
function parseDocopArgs(argv) {
  const out = {
    branch: "docop",
    op: argv[0],
    file: null,
    section: null,
    replacement: null,
    set: null,
    append: null,
    out: null,
    json: false,
    dryRun: false,
  };
  if (!DOC_OPS.includes(out.op)) {
    throw usageError(`unknown doc op "${out.op ?? ""}" (expected ${DOC_OPS.join(" | ")})`);
  }
  const VALUE_FLAGS = {
    "--file": "file",
    "--section": "section",
    "--replacement": "replacement",
    "--set": "set",
    "--append": "append",
    "--out": "out",
  };
  const seen = new Set();
  let i = 1;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg === "--json") {
      out.json = true;
      i++;
      continue;
    }
    if (arg === "--dry-run") {
      out.dryRun = true;
      i++;
      continue;
    }
    if (arg in VALUE_FLAGS) {
      const value = argv[i + 1];
      if (value === undefined || value === "") throw usageError(`${arg} requires a non-empty value`);
      if (seen.has(arg)) throw usageError(`${arg} given twice`);
      seen.add(arg);
      out[VALUE_FLAGS[arg]] = value;
      i += 2;
      continue;
    }
    throw usageError(`unknown flag "${arg}"`);
  }
  if (out.dryRun && out.op !== "edit") throw usageError("--dry-run belongs to edit");
  const bodySources = [out.replacement, out.set, out.append].filter((value) => value !== null);
  if (out.op === "index") {
    if (out.file !== null) throw usageError("--file belongs to read/edit");
    if (out.section !== null) throw usageError("--section belongs to read/edit");
    if (bodySources.length > 0) throw usageError("--replacement/--set/--append belong to edit");
    return out;
  }
  if (out.out !== null) throw usageError("--out belongs to index");
  if (out.op === "read" && bodySources.length > 0) throw usageError("--replacement/--set/--append belong to edit");
  if (out.file === null) throw usageError("--file is required");
  if (out.op === "edit") {
    if (out.file === "-") throw usageError("--file - cannot be edited in place; name a document path");
    if (out.section === null) throw usageError("--section is required for edit");
    if (bodySources.length > 1) throw usageError("exactly one of --replacement, --set, --append is allowed");
    if (bodySources.length === 0) throw usageError("one of --replacement, --set, --append is required for edit");
  }
  return out;
}

/**
 * Parse the arguments after `doc`. A positional first token selects the
 * half-A branch ({branch: "docop", …}); a `-` first token selects retrieval
 * and returns `{op: …, query, jsonOnly, quiet, …}` as before.
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

  // D2: a positional first token is the half-A branch (issue #366).
  if (!argv[0].startsWith("-")) {
    return parseDocopArgs(argv);
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
  // AC14's structured filters and the mode flag belong to queries only. The
  // mode is deliberately left ABSENT when the flag is not given (issue #443 S2,
  // D2): the query path resolves it at run time (hybrid when the provider is
  // configured and the store is embedded under the pinned model, keyword with
  // the declared cause otherwise), and a grammar default here would make that
  // resolution unreachable.
  if (out.op === "query") {
    out.since = filters.since;
    out.until = filters.until;
    out.file = filters.file;
  } else if (sawFilter || sawMode) {
    throw usageError("--since/--until/--file/--mode are query flags and require --query");
  }
  return out;
}
