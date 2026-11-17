/**
 * temp.mjs — the one temporary-directory resolution the workflow shares
 * (issue #546 S8, moved into the crate by unit 554).
 *
 * A Windows host sets `TEMP` (and `TMP`), a POSIX host sets `TMPDIR`, and a
 * minimal container sets none of them. `${TMPDIR:-/tmp}` covers the last case on
 * Unix and nothing else, and git-bash does not translate a bare `/tmp` for a
 * native tool. So the candidates are tried in order and a candidate is used only
 * when it is a writable directory: a path that does not resolve is skipped
 * instead of producing a later, more confusing failure.
 *
 * The shell library this replaces (`template/.agentic-workflow/hooks/lib/temp.sh`)
 * was sourced by two hooks; this module is imported by the crate and by the
 * unwrapped merge wrapper, so a project never carries a second copy.
 */

import { closeSync, openSync, statSync, writeSync } from "node:fs";
import { accessSync, constants } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";

/** The candidates, in the order they are tried. The names are the contract. */
export const TMPDIR_CANDIDATES = Object.freeze(["TMPDIR", "TEMP", "TMP", "/tmp"]);

/** The refusal every caller prints verbatim, so the repair is the same sentence. */
export const NO_TEMPDIR_MESSAGE = "agentic-workflow: no writable temporary directory (tried TMPDIR, TEMP, TMP, /tmp)";

/** Default probe: a candidate answers only when it is a writable directory. */
function defaultProbe(candidate) {
  try {
    if (!statSync(candidate).isDirectory()) return false;
    accessSync(candidate, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * The writable temporary directory.
 *
 * `{ok: true, dir}` or `{ok: false, message}`. `probe` is injectable because the
 * writability half of the test is a permission fact a suite cannot stage
 * portably (root ignores the mode bits).
 */
export function tmpdir({ env = process.env, candidates = TMPDIR_CANDIDATES, probe = defaultProbe } = {}) {
  for (const candidate of candidates) {
    // A candidate named by a variable is read from the environment; the literal
    // `/tmp` is its own value.
    const value = candidate === "/tmp" ? candidate : env[candidate];
    if (typeof value !== "string" || value === "") continue;
    if (!probe(value)) continue;
    return { ok: true, dir: value };
  }
  return { ok: false, message: NO_TEMPDIR_MESSAGE };
}

/**
 * A fresh file inside that directory, or the same refusal. The name is
 * `<prefix>.<random>`, created with `O_EXCL` so two callers never share one, and
 * with mode `0600` because the files it carries hold a merge trail or a comment
 * body.
 */
export function mktempFile(prefix = "agentic-workflow", options = {}) {
  const resolved = tmpdir(options);
  if (!resolved.ok) return resolved;
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const file = path.join(resolved.dir, `${prefix}.${randomBytes(6).toString("hex")}`);
    try {
      const fd = openSync(file, "wx", 0o600);
      writeSync(fd, "");
      closeSync(fd);
      return { ok: true, file, dir: resolved.dir };
    } catch (error) {
      // A taken name is retried; anything else is a refusal naming the cause.
      if (error?.code !== "EEXIST") return { ok: false, message: `agentic-workflow: ${error?.message ?? String(error)}` };
    }
  }
  return { ok: false, message: `agentic-workflow: could not create a temporary file in ${resolved.dir}` };
}
