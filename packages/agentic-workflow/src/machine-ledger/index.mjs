/**
 * machine-ledger — the class of documents whose writer is machinery, and the one
 * commit that carries its pending bytes (issue #727).
 *
 * The defect this module answers cannot be fixed by assignment. A ledger whose
 * writer is an out-of-band *process* — the pi extension's telemetry sink, the
 * journal aggregator, the gate's own annotators — produces its last row when no
 * session can commit it: the row describing session S exists only once S settles
 * or shuts down, so a session told to commit the ledger commits without its own
 * row and re-dirties the file on the way out. Several live sessions appending to
 * one file with `O_APPEND` make it worse: a model-driven commit races them and
 * drags foreign rows in depending on timing.
 *
 * So the commit is mechanical, outside any session's lifetime, and spends zero
 * model tokens. Three rules, each a case in `test/machine-ledger-commit.test.mjs`:
 *
 *  - **The class is declared once.** `MACHINE_LEDGER_CLASSES` owns the rows —
 *    path, zone, subject and the merge class `.gitattributes` declares — and the
 *    ownership map's `machine-ledger-commit@1` block is its prose projection,
 *    pinned against this constant by `scripts/machine-ledger-policy.test.mjs`.
 *    A fourth list cannot appear: one is added and the parity suite refuses it.
 *  - **A commit happens in a zone, never per file.** `auto` means the machinery
 *    that writes the byte also commits it; `writer-step` means the step that
 *    writes the row commits it, and machinery only annotates; `out-of-scope`
 *    names a store the repository does not track. The zone *is* the single commit
 *    point the policy states per class.
 *  - **The commit is path-scoped and serialised.** `git add -- <paths>` then
 *    `git commit -- <paths>` stages and commits the class alone, leaving a
 *    concurrent conversation's staged file in the index — the #182 lesson behind
 *    `session-close`'s "commits it alone". A lock file beside the index
 *    serialises overlapping teardowns; a held lock is a typed `locked` answer,
 *    because the class is append-only and the next cycle carries the row.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** The zones a class row may live in (closed). */
export const MACHINE_LEDGER_ZONES = Object.freeze(["auto", "writer-step", "out-of-scope"]);

/** The unit-doc ledgers the review machinery annotates. */
const UNIT_LEDGER_MATCH = /^docs\/(?:features|fix)\/[^/]+\/(?:review-findings|known-issues|decisions|planning-findings)\.md$/u;

/**
 * The class, in the order the policy lists it. `merge` names the
 * `.gitattributes` class the same path is declared under (`null` when the
 * document has no merge driver), so this table and that file can be compared
 * rather than trusted.
 */
export const MACHINE_LEDGER_CLASSES = Object.freeze([
  {
    class: "telemetry",
    zone: "auto",
    paths: Object.freeze(["docs/workflow/TIER_COST.md"]),
    merge: "agentic-shared-telemetry",
    subject: "chore(telemetry)",
  },
  {
    class: "session-log",
    zone: "auto",
    paths: Object.freeze(["docs/LOGS.md"]),
    merge: "agentic-shared-logs",
    subject: "docs(log)",
  },
  {
    class: "journal-corpus",
    zone: "auto",
    paths: Object.freeze([".agentic-workflow/journal"]),
    merge: null,
    subject: "docs(log)",
  },
  {
    class: "roadmap",
    zone: "writer-step",
    paths: Object.freeze(["docs/ROADMAP.md"]),
    merge: "agentic-shared-roadmap",
    subject: "docs(roadmap)",
  },
  {
    class: "budgets",
    zone: "writer-step",
    paths: Object.freeze(["docs/workflow/SKILL_CONTEXT_BUDGETS.json"]),
    merge: "agentic-shared-budgets",
    subject: "docs(budgets)",
  },
  {
    class: "repo-state",
    zone: "writer-step",
    paths: Object.freeze(["docs/workflow/REPOSITORY_STATE.md"]),
    merge: "agentic-shared-repo-state",
    subject: "docs(state)",
  },
  {
    class: "unit-ledgers",
    zone: "writer-step",
    pattern: "docs/{features,fix}/<unit>/{review-findings,known-issues,decisions,planning-findings}.md",
    matches: UNIT_LEDGER_MATCH,
    merge: null,
    subject: "docs(ledger)",
  },
  {
    class: "session-store",
    zone: "out-of-scope",
    paths: Object.freeze([".pi/.telemetry/sessions.jsonl"]),
    merge: "agentic-shared-telemetry",
    subject: "chore(telemetry)",
  },
]);

/** One path, normalised the way git reports it. */
function normalise(relative) {
  return String(relative ?? "")
    .replace(/\\/gu, "/")
    .replace(/^\.\//u, "")
    .trim();
}

/** A declared literal is a directory when its last segment carries no extension. */
function isDirectoryLiteral(literal) {
  return !path.posix.basename(literal).includes(".");
}

/** The class rows an id or zone selects; an unknown id is refused, never ignored. */
function selectClasses({ classes, zone } = {}) {
  if (Array.isArray(classes) && classes.length > 0) {
    const byId = new Map(MACHINE_LEDGER_CLASSES.map((row) => [row.class, row]));
    return classes.map((id) => {
      const row = byId.get(id);
      if (row === undefined) throw new Error(`unknown machine-ledger class: ${id}`);
      return row;
    });
  }
  const wanted = zone ?? "auto";
  if (!MACHINE_LEDGER_ZONES.includes(wanted)) throw new Error(`unknown machine-ledger zone: ${wanted}`);
  return MACHINE_LEDGER_CLASSES.filter((row) => row.zone === wanted);
}

/** The class row a path belongs to, or `null` — the one path-to-class reader. */
export function machineLedgerClassOf(relative) {
  const clean = normalise(relative);
  for (const row of MACHINE_LEDGER_CLASSES) {
    for (const literal of row.paths ?? []) {
      if (clean === literal) return row;
      if (isDirectoryLiteral(literal) && clean.startsWith(`${literal}/`)) return row;
    }
    if (row.matches !== undefined && row.matches.test(clean)) return row;
  }
  return null;
}

/** Whether a path is a machine-owned ledger at all. */
export function isMachineLedgerPath(relative) {
  return machineLedgerClassOf(relative) !== null;
}

/**
 * Whether a pending change to this path is exempt from the review's dirty-tree
 * verdict. Every class row is exempt except the untracked store: a document whose
 * writer is machinery is not the dirty tree the verdict exists to refuse, and its
 * residue is exactly what refused two reviews in a row (#727 S2). The exemption
 * set is the policy block's declared directive, never a caller's opinion.
 */
export function isMachineLedgerExempt(relative) {
  const row = machineLedgerClassOf(relative);
  return row !== null && row.zone !== "out-of-scope";
}

/** The literal paths the `auto` zone sweeps, in table order. */
export function autoLedgerPaths() {
  return MACHINE_LEDGER_CLASSES.filter((row) => row.zone === "auto").flatMap((row) => [...row.paths]);
}

/** The lock every commit takes, in git's own directory for this checkout. */
const LOCK_NAME = "agentic-machine-ledger.lock";
/** A lock older than this is a dead writer, not a live one (a commit is <1s). */
const LOCK_STALE_MS = 60_000;

function git(root, args) {
  // The log this class commits only grows, and a ledger read by `git show` can
  // outgrow spawnSync's 1 MB default — the `session-close` lesson (#182).
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error) return { ok: false, out: "", err: `git not runnable: ${result.error.message}` };
  return { ok: result.status === 0, out: (result.stdout ?? "").trim(), err: (result.stderr ?? "").trim() };
}

/** `git status --porcelain` over the selected paths, as normalised paths. */
function changedPaths(root, paths) {
  if (paths.length === 0) return [];
  // Untrimmed: in porcelain v1 the status letters occupy columns 0-1 and the
  // path starts at column 3, so a leading space is data, not noise.
  const result = spawnSync("git", ["-C", root, "status", "--porcelain", "--untracked-files=all", "--", ...paths], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) return [];
  const seen = new Set();
  for (const line of String(result.stdout ?? "").split("\n")) {
    if (line.trim() === "") continue;
    // A rename prints `R  a -> b`; the destination is what the working tree holds.
    const raw = line.slice(3).trim();
    const target = raw.includes(" -> ") ? raw.split(" -> ")[1] : raw;
    const clean = normalise(target.replace(/^"|"$/gu, ""));
    if (clean !== "") seen.add(clean);
  }
  return [...seen].sort();
}

/** The subject the commit carries: one family per changed class, joined when mixed. */
export function machineLedgerSubject(rows) {
  const subjects = [...new Set(rows.map((row) => row.subject))].sort();
  if (subjects.length === 0) return "chore(machine-ledger): machine ledger rows";
  if (subjects.length === 1) return `${subjects[0]}: machine ledger rows`;
  return "chore(machine-ledger): machine ledger rows";
}

/** Take the lock, or answer why it could not be taken. */
function takeLock(lockPath) {
  try {
    fs.writeFileSync(lockPath, `${process.pid}\n`, { flag: "wx" });
    return { ok: true };
  } catch (error) {
    if (error?.code !== "EEXIST") return { ok: false, reason: `unwritable: ${error?.message ?? String(error)}` };
  }
  // A lock left by a dead writer must not stop every later cycle: a commit takes
  // milliseconds, so a lock past the stale bound is abandoned, and the takeover
  // is retried exactly once.
  try {
    const stat = fs.statSync(lockPath);
    if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
      fs.rmSync(lockPath, { force: true });
      fs.writeFileSync(lockPath, `${process.pid}\n`, { flag: "wx" });
      return { ok: true, tookOver: true };
    }
  } catch {
    // The holder released between the two reads: the next attempt finds it free.
    try {
      fs.writeFileSync(lockPath, `${process.pid}\n`, { flag: "wx" });
      return { ok: true };
    } catch {
      // Still held; answer locked below.
    }
  }
  return { ok: false, reason: "another writer holds the lock" };
}

/**
 * Commit the pending bytes of the selected class rows, alone and behind a lock.
 *
 * Answers, never throws for a tree condition: `not-a-repository`, `clean`,
 * `locked`, `committed`, `would-commit` (dry run) or `failed` with the git
 * refusal's own text. An unknown class id or zone is a caller defect and throws.
 */
export function commitMachineLedgers(options = {}) {
  const root = path.resolve(options.root ?? process.cwd());
  const selected = selectClasses(options);
  const classIds = selected.map((row) => row.class);
  const top = git(root, ["rev-parse", "--show-toplevel"]);
  if (!top.ok || top.out === "") {
    return { status: "not-a-repository", committed: false, root, classes: classIds, paths: [], sha: null, subject: null };
  }
  const tree = top.out;
  const literals = selected.flatMap((row) => [...(row.paths ?? [])]);
  const pending = literals.length === 0 ? [] : changedPaths(tree, literals);

  if (pending.length === 0) {
    return { status: "clean", committed: false, root: tree, classes: classIds, paths: [], sha: null, subject: null };
  }
  const rows = [...new Set(pending.map((file) => machineLedgerClassOf(file)).filter(Boolean))];
  const subject = options.subject ?? machineLedgerSubject(rows);
  if (options.dryRun === true) {
    return { status: "would-commit", committed: false, root: tree, classes: classIds, paths: pending, sha: null, subject };
  }

  const gitPath = git(tree, ["rev-parse", "--git-path", LOCK_NAME]);
  const lockPath = gitPath.ok && gitPath.out !== "" ? (path.isAbsolute(gitPath.out) ? gitPath.out : path.join(tree, gitPath.out)) : path.join(tree, ".git", LOCK_NAME);
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  const lock = takeLock(lockPath);
  if (!lock.ok) {
    return { status: "locked", committed: false, root: tree, classes: classIds, paths: pending, sha: null, subject, detail: lock.reason };
  }

  try {
    const added = git(tree, ["add", "--", ...pending]);
    if (!added.ok) {
      return { status: "failed", committed: false, root: tree, classes: classIds, paths: pending, sha: null, subject, detail: added.err };
    }
    const committed = git(tree, ["commit", "-m", subject, "--", ...pending]);
    if (!committed.ok) {
      return { status: "failed", committed: false, root: tree, classes: classIds, paths: pending, sha: null, subject, detail: committed.err };
    }
    const head = git(tree, ["rev-parse", "HEAD"]);
    return {
      status: "committed",
      committed: true,
      root: tree,
      classes: classIds,
      paths: pending,
      sha: head.ok ? head.out.slice(0, 8) : null,
      subject,
    };
  } finally {
    fs.rmSync(lockPath, { force: true });
  }
}
