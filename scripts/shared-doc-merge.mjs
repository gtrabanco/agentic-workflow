#!/usr/bin/env node
/**
 * shared-doc-merge.mjs — the file-class git merge drivers for the repository's
 * shared documents (issue #498), generalizing the #420 pattern
 * (`scripts/docs-generated-merge.mjs`) by class:
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
 *
 * `docs/generated/**` stays with the #420 projection driver — this script
 * refuses it with a pointer rather than answering for a surface it does not
 * own. An unknown path refuses closed: a driver that guesses is worse than a
 * marker.
 *
 * Git contract (git-scm.com/docs/gitattributes, verified 2026-11-10): the
 * driver leaves the result of the merge in the file named with `%A` and exits
 * zero if it merged cleanly, non-zero if there were conflicts. A conflict is
 * written as real conflict markers into `%A`; a refusal leaves `%A` untouched
 * (the pre-driver state git staged there) and exits 1 — the path stays
 * conflicted either way.
 *
 * The merge semantics live in the crate (`@gtrabanco/agentic-workflow`
 * `src/writer/merges.mjs`); this script owns the git mechanics: the argv
 * mapping, the class dispatch, the arming. Arming is per-checkout — a git
 * limitation already documented in #420:
 *
 *   bun scripts/shared-doc-merge.mjs --install [--repo <dir>]
 *
 * `.gitattributes` names the paths (`merge=agentic-shared-<class>`); an
 * unarmed clone degrades to git's textual merge — verified behavior — and the
 * armed driver adds the semantic layer on top.
 *
 * exit: 0 the file is resolved; 1 the merge is left conflicted (fail closed);
 * 2 a usage error or a refused install.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { structuralJsonMerge, unionLogEntries, unionTableRows } from "../packages/agentic-workflow/src/writer/merges.mjs";

const SCRIPT = fileURLToPath(import.meta.url);
const REFUSAL = "SHARED MERGE REFUSAL —";

/** The closed class vocabulary. Adding a class is a contract change, by design. */
export const SHARED_MERGE_CLASSES = Object.freeze(["roadmap", "budgets", "repo-state", "logs"]);

/** The closed refusal vocabulary (what stderr names, why it exited nonzero). */
export const SHARED_MERGE_REFUSAL_REASONS = Object.freeze([
  "unknown-path",
  "generated-projection",
  "class-mismatch",
  "unreadable-side",
  "invalid-document",
  "refused-install",
  "usage",
]);

/** The driver name git config arms per class; `.gitattributes` references it. */
export function driverName(cls) {
  return `agentic-shared-${cls}`;
}

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
  "usage: shared-doc-merge.mjs --install [--repo <dir>]",
  "       shared-doc-merge.mjs <class> <base> <ours> <theirs> [marker-size] [path]",
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

/**
 * The driver line git runs for one class. Relative when this script lives
 * inside the checkout it arms, so the checkout stays relocatable; absolute
 * otherwise, the only honest form for arming a tree this script is not part
 * of (a fixture). `bun` first, `node` as the guaranteed fallback.
 */
export function driverCommand(root, cls) {
  const relative = path.relative(root, SCRIPT);
  const script = path.isAbsolute(relative) || relative.startsWith("..") ? SCRIPT : relative;
  const run = (runtime) => `${runtime} ${script} ${cls} %O %A %B %L "%P"`;
  return `if command -v bun >/dev/null 2>&1; then ${run("bun")}; else ${run("node")}; fi`;
}

/** `--install`: arm one `merge.<driver>.driver` key per class, writing only the ones that differ. */
function install(root) {
  if (git(root, ["rev-parse", "--git-dir"]).status !== 0) refuse(`${root} is not a git checkout`, 2);
  const lines = ["shared-doc-merge — " + SHARED_MERGE_CLASSES.map(driverName).join(", ")];
  for (const cls of SHARED_MERGE_CLASSES) {
    const setting = `merge.${driverName(cls)}.driver`;
    const value = driverCommand(root, cls);
    const current = git(root, ["config", "--local", "--get", setting]);
    const armed = current.status === 0 && current.stdout.trim() === value;
    if (!armed) {
      const written = git(root, ["config", "--local", setting, value]);
      if (written.status !== 0) refuse(`git config ${setting} failed — ${written.stderr.trim()}`, 1);
    }
    lines.push(`${driverName(cls)} — ${armed ? "unchanged" : "written"}`);
  }
  lines.push("verdict: PASS");
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(0);
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

/** Write the merged result into `%A` atomically (staging file + rename). */
function writeMerged(ours, content) {
  const staging = `${ours}.shared-doc-merge`;
  fs.writeFileSync(staging, content, "utf8");
  fs.renameSync(staging, ours);
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

function main(argv) {
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
    install(root);
    return;
  }
  if (argv.length === 0) refuse("usage — git supplies %O %A %B %L %P, or pass --install", 2);
  if (argv[0].startsWith("-")) refuse(`usage — unknown argument ${argv[0]}`, 2);
  if (argv.length < 4) refuse(`usage — a merge driver needs class, base, ours and theirs (${argv.length} given)`, 2);
  if (argv.length > 6) refuse(`usage — at most class, base, ours, theirs, marker size and path`, 2);
  resolveMerge(argv);
}

// Run only as a program: the sibling suite imports the class map, the refusal
// vocabulary and the driver line.
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  main(process.argv.slice(2));
}
