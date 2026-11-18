/**
 * shared-merge.mjs — the file-class git merge drivers for a project's shared
 * documents (issue #498), generalized from the #420 projection driver, plus the
 * telemetry class (issue #630).
 *
 *   roadmap     docs/ROADMAP.md                              — row union by key
 *               (numeric first cell in the Features table, `[#N]` link in the
 *               Fixes table); both sides changing the same row differently —
 *               e.g. two status flips — is a real conflict, never silently
 *               resolved.
 *   budgets     docs/workflow/SKILL_CONTEXT_BUDGETS.json     — structural JSON
 *               union by key (decision D3): different keys merge, the same
 *               leaf set differently on both sides is a conflict.
 *   repo-state  docs/workflow/REPOSITORY_STATE.md            — fail closed
 *               always (decision D4): frozen facts are resolver-only, so any
 *               concurrent change is a conflict for the resolver, never a
 *               union.
 *   logs        docs/LOGS.md                                 — entry union by
 *               identity (issue #498's scope reinforcement, owner comment
 *               2026-11-10T00:22): the exact `## …` heading line keys the
 *               entry — the real journal carries heterogeneous stamps
 *               (second-precision, minute, date-only), so no grammar is
 *               imposed on it. The journal is append-only
 *               (`scripts/log-immutability.mjs`), and the union holds each
 *               side to that contract: a side that is not an append-only
 *               extension of the base (an entry edited, reordered or dropped)
 *               refuses closed; distinct new entries are all kept, ordered by
 *               their normalized stamp; the same heading appended with
 *               different bodies is a real conflict, never silently resolved.
 *   telemetry   docs/workflow/TIER_COST.md and the JSONL sample store
 *               (`.pi/.telemetry/sessions.jsonl` by default) — issue #630's
 *               append-only class, one driver name for both paths with
 *               per-path dispatch: the ledger unions rows by their `source`
 *               cell (`unionTableRows`), the JSONL store unions lines by their
 *               canonical identity (`unionAppendOnly`). Both destinations grow
 *               by an atomic append, so the class **appends the delta to `%A`
 *               and never rewrites it** (S5, D6): the merge is
 *               `appendFileSync`-compatible by construction, deduplicates a
 *               row/line both branches appended, and refuses closed — the file
 *               left as `ours`, no marker, exit 1 — when a side is not an
 *               append-only extension of the base or when a union would not
 *               extend `ours`. A real conflict inside the table is marked in
 *               place for the human, never silently resolved.
 *
 * `docs/generated/**` stays with the #420 projection driver
 * (`scripts/docs-generated-merge.mjs`) — this module refuses it with a pointer
 * rather than answering for a surface it does not own. An unknown path refuses
 * closed: a driver that guesses is worse than a marker.
 *
 * Git contract (git-scm.com/docs/gitattributes, verified 2026-11-10): the
 * driver leaves the result of the merge in the file named with `%A` and exits
 * zero if it merged cleanly, non-zero if there were conflicts. A conflict is
 * written as real conflict markers into `%A`; a refusal leaves `%A` untouched
 * (the pre-driver state git staged there) and exits 1 — the path stays
 * conflicted either way.
 *
 * The merge semantics live beside this module (`merges.mjs`); this module owns
 * the git mechanics: the argv mapping, the class dispatch, the arming. Arming
 * is per-checkout — a git limitation already documented in #420:
 *
 *   bun scripts/shared-doc-merge.mjs --install [--repo <dir>]
 *   agentic-workflow telemetry merge-install [--repo <dir>]
 *
 * `.gitattributes` names the paths (`merge=agentic-shared-<class>`); an unarmed
 * clone degrades to git's textual merge — verified behavior — and the armed
 * driver adds the semantic layer on top.
 *
 * The mechanics live in the crate — not in the root script — so the universal
 * CLI can arm a working driver in a project that ships no `scripts/` tree
 * (issue #630 D5). `scripts/shared-doc-merge.mjs` and the crate's
 * `bin/shared-merge.mjs` are the two thin entries over this module; a second
 * copy of the dispatch would be the second grammar the writer contract
 * forbids.
 *
 * exit: 0 the file is resolved; 1 the merge is left conflicted (fail closed);
 * 2 a usage error or a refused install.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { structuralJsonMerge, telemetryRowKey, unionAppendOnly, unionLogEntries, unionTableRows } from "./merges.mjs";

const REFUSAL = "SHARED MERGE REFUSAL —";

/** The closed class vocabulary. Adding a class is a contract change, by design. */
export const SHARED_MERGE_CLASSES = Object.freeze(["roadmap", "budgets", "repo-state", "logs", "telemetry"]);

/** The closed refusal vocabulary (what stderr names, why it exited nonzero). */
export const SHARED_MERGE_REFUSAL_REASONS = Object.freeze([
  "unknown-path",
  "generated-projection",
  "class-mismatch",
  "unreadable-side",
  "invalid-document",
  "not-append-only",
  "non-append-union",
  "refused-install",
  "usage",
]);

/** The driver name git config arms per class; `.gitattributes` references it. */
export function driverName(cls) {
  return `agentic-shared-${cls}`;
}

/** The ledger's default JSONL destination — one of the two telemetry paths. */
export const TELEMETRY_LEDGER_PATH = "docs/workflow/TIER_COST.md";
export const TELEMETRY_JSONL_PATH = ".pi/.telemetry/sessions.jsonl";

/** The telemetry destinations, in the order `.gitattributes` declares them. */
export const TELEMETRY_PATHS = Object.freeze([TELEMETRY_LEDGER_PATH, TELEMETRY_JSONL_PATH]);

/**
 * The class a repository-relative path belongs to, or `null` for a path no
 * class owns. The `generated` projection is a named refusal, never a guess.
 */
export function classForPath(relPath) {
  const p = relPath.replace(/^\.\//, "");
  if (p === "docs/ROADMAP.md") return "roadmap";
  if (p === "docs/workflow/SKILL_CONTEXT_BUDGETS.json") return "budgets";
  if (p === "docs/workflow/REPOSITORY_STATE.md") return "repo-state";
  if (p === "docs/LOGS.md") return "logs";
  if (TELEMETRY_PATHS.includes(p)) return "telemetry";
  if (p === "docs/generated" || p.startsWith("docs/generated/")) return "generated";
  return null;
}

/** The roadmap class keys rows in both tables: numeric cells and issue links. */
export function roadmapRowKey(line) {
  const numeric = /^\|\s*(\d+)\s*\|/.exec(line);
  if (numeric) return numeric[1];
  const issue = /^\|\s*\[#(\d+)\]/.exec(line);
  return issue ? issue[1] : null;
}

const USAGE = [
  "usage: shared-merge.mjs --install [--repo <dir>]",
  "       shared-merge.mjs <class> <base> <ours> <theirs> [marker-size] [path]",
  "classes: " + SHARED_MERGE_CLASSES.join(" | "),
].join("\n");

function refuse(message, code) {
  process.stderr.write(`${REFUSAL} ${message}\n`);
  if (code === 2) process.stderr.write(`${USAGE}\n`);
  process.exit(code);
}

function git(root, args) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8" });
}

/** The entry this module is running as: the caller's own file, so the armed
 * command names the script (or the crate bin) a checkout actually carries. */
function currentEntry(explicit) {
  if (explicit) return path.resolve(explicit);
  return process.argv[1] ? path.resolve(process.argv[1]) : fileURLToPath(import.meta.url);
}

/**
 * The driver line git runs for one class. Relative when the entry lives inside
 * the checkout it arms, so the checkout stays relocatable; absolute otherwise,
 * the only honest form for arming a tree the entry is not part of (a fixture).
 * `bun` first, `node` as the guaranteed fallback.
 */
export function driverCommand(root, cls, entry = currentEntry()) {
  const relative = path.relative(root, entry);
  const script = path.isAbsolute(relative) || relative.startsWith("..") ? entry : relative;
  const run = (runtime) => `${runtime} ${script} ${cls} %O %A %B %L "%P"`;
  return `if command -v bun >/dev/null 2>&1; then ${run("bun")}; else ${run("node")}; fi`;
}

/** `--install`: arm one `merge.<driver>.driver` key per class, writing only the ones that differ. */
export function install(root, { entry } = {}) {
  const resolved = currentEntry(entry);
  if (!isGitCheckout(root)) refuse(`${root} is not a git checkout`, 2);
  const lines = ["shared-doc-merge — " + SHARED_MERGE_CLASSES.map(driverName).join(", ")];
  for (const cls of SHARED_MERGE_CLASSES) {
    const armed = armDriver(root, cls, { entry: resolved });
    if (armed.status === "refused") refuse(`git config ${armed.setting} failed — ${armed.detail}`, 1);
    lines.push(`${armed.driver} — ${armed.status}`);
  }
  lines.push("verdict: PASS");
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(0);
}

/** Whether git recognizes `root` as a checkout — the arming precondition. */
export function isGitCheckout(root) {
  return git(root, ["rev-parse", "--git-dir"]).status === 0;
}

/**
 * Arm one class's `merge.<driver>.driver` key, writing only when the value
 * differs — the composable half of `--install`, so a caller that must not exit
 * (the CLI's `telemetry merge-install`, the reconciliation trigger) can arm a
 * class and report an answer instead of a process status.
 *
 * Answers `{ driver, setting, status: "written" | "unchanged" | "refused", command, detail? }`.
 */
export function armDriver(root, cls, { entry } = {}) {
  const setting = `merge.${driverName(cls)}.driver`;
  const value = driverCommand(root, cls, currentEntry(entry));
  const current = git(root, ["config", "--local", "--get", setting]);
  if (current.status === 0 && current.stdout.trim() === value) {
    return { driver: driverName(cls), setting, status: "unchanged", command: value };
  }
  const written = git(root, ["config", "--local", setting, value]);
  if (written.status !== 0) {
    return { driver: driverName(cls), setting, status: "refused", command: value, detail: written.stderr.trim() };
  }
  return { driver: driverName(cls), setting, status: "written", command: value };
}

/** The path git handed this driver, unquoted (`%P` arrives shell-quoted when quoted). */
function namedPath(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];
  const bare =
    trimmed.length > 1 && (quote === "'" || quote === '"') && trimmed.endsWith(quote)
      ? trimmed.slice(1, -1)
      : trimmed;
  return bare.split(path.sep).join("/").replace(/^\.\//, "");
}

function readSide(label, file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch (error) {
    refuse(`unreadable-side — cannot read the ${label} side ${file} — ${error.message}`, 1);
  }
}

/** Write a merged result into `%A` atomically (staging file + rename) — the
 * whole-document classes' contract. The telemetry class never takes this path
 * (issue #630 S5): it appends its delta instead. */
function writeMerged(ours, content) {
  const staging = `${ours}.shared-doc-merge`;
  fs.writeFileSync(staging, content, "utf8");
  fs.renameSync(staging, ours);
}

/** Write a marked conflict into `%A` in place: no staging file, no rename, and
 * only ever on the telemetry class, whose bytes git owns for the merge. */
function writeInPlace(ours, content) {
  fs.writeFileSync(ours, content.endsWith("\n") ? content : `${content}\n`, "utf8");
}

/** A JSONL line's identity: its canonical JSON, so a re-serialized twin dedups. */
function canonicalJsonLine(line) {
  const sort = (value) =>
    Array.isArray(value)
      ? value.map(sort)
      : value !== null && typeof value === "object"
        ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, sort(value[key])]))
        : value;
  return JSON.stringify(sort(JSON.parse(line)));
}

/** The telemetry destination a named path is, or the sniffed shape when git
 * supplied no path: a first non-empty line that opens a JSON object is the
 * JSONL store, anything else is the table ledger. */
function telemetryKind(named, ...sides) {
  if (named === TELEMETRY_JSONL_PATH) return "jsonl";
  if (named === TELEMETRY_LEDGER_PATH) return "table";
  for (const side of sides) {
    const first = side.split("\n").find((line) => line.trim() !== "");
    if (first !== undefined) return first.trim().startsWith("{") ? "jsonl" : "table";
  }
  return "table";
}

/** Every non-empty line must parse as JSON before a union may touch it. */
function refuseUnparsable(side, text) {
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    try {
      JSON.parse(line);
    } catch {
      refuse(`invalid-document — the ${side} side carries a line that is not JSON — a human resolves it`, 1);
    }
  }
}

/**
 * The telemetry merge: compute the union, then **append the delta** to `%A`.
 *
 * The append is the whole point of the class (issue #630 S5): the strategy that
 * was measured losing data is read-modify-write, so this path only ever adds
 * bytes at the end of the file git handed it. A result that would not extend
 * `ours` — and a side that is not an append-only extension of the base — is a
 * refusal, never a rewrite: the file stays exactly as `ours` and the merge
 * stays conflicted for the human.
 */
function resolveTelemetry(named, target, baseText, oursText, theirsText) {
  const kind = telemetryKind(named, oursText, theirsText);
  if (kind === "jsonl") {
    refuseUnparsable("base", baseText);
    refuseUnparsable("ours", oursText);
    refuseUnparsable("theirs", theirsText);
  }
  const merged =
    kind === "jsonl"
      ? unionAppendOnly(baseText, oursText, theirsText, canonicalJsonLine)
      : unionTableRows(baseText, oursText, theirsText, telemetryRowKey);

  if (!merged.ok && merged.reason === "invalid-document") {
    refuse(`invalid-document — ${merged.detail ?? "a side does not parse"} — a human resolves it`, 1);
  }
  if (!merged.ok && merged.reason === "not-append-only") {
    refuse(
      `not-append-only — the ${merged.side} side is not an append-only extension of the base; an append never rewrites a committed ${kind === "jsonl" ? "line" : "row"} — a human resolves it`,
      1,
    );
  }
  if (!merged.ok) {
    // A real conflict inside the document (FF-4): the markers go into %A — the
    // merge stays conflicted for the human/agent.
    writeInPlace(target, merged.content);
    const what = merged.conflicts.map((conflict) => conflict.key ?? conflict).join(", ");
    process.stderr.write(`shared-doc-merge: ${named ?? "telemetry"} — semantic conflict on ${what}; both sides' changes are marked in the file\n`);
    process.exit(1);
  }

  const bareOurs = oursText.endsWith("\n") ? oursText.slice(0, -1) : oursText;
  const delta = merged.content.startsWith(oursText)
    ? merged.content.slice(oursText.length)
    : merged.content.startsWith(bareOurs)
      ? merged.content.slice(bareOurs.length)
      : null;
  if (delta === null) {
    refuse(
      "non-append-union — the union does not extend the ours side; the telemetry class refuses to rewrite a file it can only append to",
      1,
    );
  }
  if (delta !== "") fs.appendFileSync(target, delta);
  process.stderr.write(
    delta === ""
      ? `shared-doc-merge: ${named ?? "telemetry"} — both sides already carry the same ${kind === "jsonl" ? "lines" : "rows"}; nothing to append\n`
      : `shared-doc-merge: ${named ?? "telemetry"} resolved by appending the incoming side's ${kind === "jsonl" ? "lines" : "rows"} to the union\n`,
  );
  process.exit(0);
}

/** The driver form: resolve one conflicted shared-document path. Git invokes
 * the driver either with the armed class prefix (`<class> %O %A %B %L %P`) or
 * in the plain form (`%O %A %B %L %P`) — the class is then inferred from the
 * named path, and an inference failure is a refusal, never a guess. */
function resolveMerge(argv) {
  let [cls, base, ours, theirs, marker, relPath] = argv;
  if (!SHARED_MERGE_CLASSES.includes(cls)) {
    const named = argv[5] !== undefined ? namedPath(argv[5]) : null;
    const inferred = named === null ? null : classForPath(named);
    if (inferred === "generated") {
      refuse(`generated-projection — ${named} is the docs-generated projection; arm scripts/docs-generated-merge.mjs (fix #420) for it`, 1);
    }
    if (inferred === null) {
      refuse(`unknown-path — ${named ?? argv[0]} belongs to no shared-document class; add it to the class map or resolve by hand`, 1);
    }
    [base, ours, theirs, marker, relPath] = argv;
    cls = inferred;
  }

  let named = null;
  if (relPath !== undefined) {
    named = namedPath(relPath);
    const pathClass = classForPath(named);
    if (pathClass === "generated") {
      refuse(`generated-projection — ${named} is the docs-generated projection; arm scripts/docs-generated-merge.mjs (fix #420) for it`, 1);
    }
    if (pathClass === null) {
      refuse(`unknown-path — ${named} belongs to no shared-document class; add it to the class map or resolve by hand`, 1);
    }
    if (pathClass !== cls) {
      refuse(`class-mismatch — ${named} is the ${pathClass} class, invoked as ${cls}`, 1);
    }
  }
  if (!SHARED_MERGE_CLASSES.includes(cls)) {
    refuse(`usage — unknown class ${cls}`, 2);
  }

  void marker;
  const baseText = readSide("base", base);
  const oursText = readSide("ours", ours);
  const theirsText = readSide("theirs", theirs);

  if (cls === "telemetry") resolveTelemetry(named, ours, baseText, oursText, theirsText);

  if (cls === "repo-state") {
    // Decision D4: frozen facts are resolver-only — both sides' change is
    // surfaced as a real conflict for the resolver, never unioned.
    writeMerged(
      ours,
      [`<<<<<<< ours (frozen facts — resolve-repository-state owns the merge)`, oursText.trimEnd(), "=======", theirsText.trimEnd(), ">>>>>>> theirs"].join("\n") + "\n",
    );
    process.stderr.write(`shared-doc-merge: ${named ?? ours} — REPOSITORY_STATE.md is resolver-only; the conflict is left for resolve-repository-state\n`);
    process.exit(1);
  }

  const result =
    cls === "roadmap"
      ? unionTableRows(baseText, oursText, theirsText, roadmapRowKey)
      : cls === "logs"
        ? unionLogEntries(baseText, oursText, theirsText)
        : structuralJsonMerge(baseText, oursText, theirsText);

  if (!result.ok && result.reason === "invalid-document") {
    refuse(`invalid-document — ${result.detail ?? "a side does not parse"} — a human resolves it`, 1);
  }
  if (!result.ok) {
    // A real conflict (FF-4): both sides changed the same row/leaf differently.
    // The markers go into %A — the merge stays conflicted for the human/agent.
    writeMerged(ours, result.content.endsWith("\n") ? result.content : `${result.content}\n`);
    const what = result.conflicts.map((c) => c.key ?? c).join(", ");
    process.stderr.write(`shared-doc-merge: ${named ?? ours} — semantic conflict on ${what}; both sides' changes are marked in the file\n`);
    process.exit(1);
  }

  writeMerged(ours, result.content.endsWith("\n") ? result.content : `${result.content}\n`);
  process.stderr.write(`shared-doc-merge: ${named ?? ours} resolved to the union of both sides' edits\n`);
  process.exit(0);
}

/**
 * The entry: `--install`, or the argv form git invokes. `entry` names the file
 * the caller is (the armed command is built from it), so the two thin entries
 * over this module each arm a command that names themselves.
 */
export function main(argv, { entry } = {}) {
  if (argv[0] === "--install") {
    let root = process.cwd();
    for (let index = 1; index < argv.length; index += 1) {
      const arg = argv[index];
      if (arg !== "--repo") refuse(`usage — unknown argument ${arg}`, 2);
      const value = argv[index + 1];
      if (value === undefined) refuse("usage — --repo needs a directory", 2);
      root = path.resolve(value);
      index += 1;
    }
    install(root, { entry: currentEntry(entry) });
    return;
  }
  if (argv.length === 0) refuse("usage — git supplies %O %A %B %L %P, or pass --install", 2);
  if (argv[0].startsWith("-")) refuse(`usage — unknown argument ${argv[0]}`, 2);
  if (argv.length < 4) refuse(`usage — a merge driver needs class, base, ours and theirs (${argv.length} given)`, 2);
  if (argv.length > 6) refuse(`usage — at most class, base, ours, theirs, marker size and path`, 2);
  resolveMerge(argv);
}
