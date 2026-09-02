#!/usr/bin/env node
/**
 * P20 / F106 — recover `folded: yes` provenance mechanically.
 *
 * A tick without a commit token is the exact failure mode this unit's whole ledger
 * exists to catch, so the recovery must be a walk over real git state, not a guess:
 *
 *  1. the commit that flipped the row `no → yes` is found by parsing every version
 *     of the ledger in `git log` order;
 *  2. the FIX commit is a commit on the branch whose subject names the finding id
 *     AND that touches a surface the row cites (the flip commit itself counts when
 *     it owns the change);
 *  3. a row that already cites a commit keeps that citation only when the token
 *     resolves to a real commit reachable from HEAD and can be tied to the row's
 *     subject or surface — an unverifiable citation is reported, never trusted;
 *  4. everything else is UNPROVEN and re-opens: asserted provenance is worse than
 *     none, because it silently passes the recount that F106 exists to satisfy.
 *
 * Usage: node scripts/ledger-provenance.mjs docs/features/<unit>/review-findings.md
 *        [--json] [--check] [--annotate]
 *
 *   --check     exit 1 unless every `folded: yes` row carries a verified commit
 *               token (the mechanical recount P20's done-when demands)
 *   --annotate  rewrite the ledger: append ` · fold <sha>` to every row whose fold
 *               commit is proven but uncited, and re-open every unproven row as
 *               `folded: no` with a note naming the missing evidence
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, relative, resolve } from "node:path";

const COMMIT_TOKEN_RE = /\b[0-9a-f]{7,40}\b/g;
const ROW_RE = /^\|\s*(F\d+)\s*\|/;
/**
 * Cell boundaries are UNESCAPED pipes. A markdown table escapes a literal pipe inside
 * a cell as `\|`, and a naive `split("|")` reads such a row as eight columns and drops
 * it — silently, from the recount, from `--check`, and from `--annotate`, so a fix-now
 * row vanishes while looking accounted for (unit 28's own F38 row did exactly this).
 */
const CELL_RE = /(?<!\\)\|/;

const args = process.argv.slice(2);
const target = args.find((arg) => !arg.startsWith("--"));
if (!target) {
  console.error("usage: node scripts/ledger-provenance.mjs <review-findings.md> [--json] [--check] [--annotate]");
  process.exit(2);
}
const ledger = resolve(target);
const asJson = args.includes("--json");
const checkOnly = args.includes("--check");
const annotate = args.includes("--annotate");

const run = (rest, opts = {}) =>
  execFileSync("git", rest, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
const git = (...rest) => {
  try {
    return run(rest);
  } catch {
    return "";
  }
};
/** `git merge-base --is-ancestor` prints nothing: only the exit status answers. */
const isAncestor = (a, b) => {
  if (!a || !b) return false;
  try {
    run(["merge-base", "--is-ancestor", a, b], { stdio: ["ignore", "ignore", "ignore"] });
    return true;
  } catch {
    return false;
  }
};

const topRoot = git("rev-parse", "show-toplevel").trim();
const short = (sha) => sha.slice(0, 7);
// A closed pipe (`| head`) is how a human reads the report, not an error.
for (const stream of [process.stdout, process.stderr])
  stream.on("error", (error) => {
    if (error.code !== "EPIPE") throw error;
  });

/** Repo-relative path: `git show <sha>:<abs>` is invalid, `<sha>:<rel>` is not. */
const repoRelative = (absolute) => {
  const rel = relative(topRoot || process.cwd(), absolute).split("\\").join("/");
  return rel && !rel.startsWith("..") ? rel : absolute;
};

/**
 * finding-id → row cells, from one snapshot of the ledger, plus every line the
 * row schema refused.
 *
 * A row that matched `ROW_RE` but not the 7-column schema used to `continue` past
 * the recount with no signal at all — the silent-drop class `CELL_RE` above exists
 * to close (finding C1, P16 fold): an arity slip, an extra column, or a repeated id
 * removed a fix-now row from `--check` and `--annotate` while it still looked
 * accounted for in the table. Nothing here drops a counted line: `counted` is the
 * number of `^| F<n> |` lines in the file, `rows` the ones the schema read, and
 * `rejected` the difference, each named with its reason. The invariant
 * `counted === rows.size + rejected.length` is asserted by the caller, so a future
 * branch in this parser cannot skip a line without failing the recount.
 */
function parseRows(text) {
  const rows = new Map();
  const rejected = [];
  let counted = 0;
  for (const line of text.split("\n")) {
    const match = ROW_RE.exec(line);
    if (!match) continue;
    counted += 1;
    const cells = line.split(CELL_RE).slice(1, -1).map((cell) => cell.trim());
    if (cells.length !== 7) {
      rejected.push({ id: match[1], reason: `${cells.length} cells instead of the 7-column schema` });
      continue;
    }
    if (rows.has(match[1])) {
      rejected.push({ id: match[1], reason: "duplicate id in the file — only the last row is read" });
    }
    rows.set(match[1], { file: cells[1], route: cells[5], folded: cells[6] });
  }
  return { rows, rejected, counted };
}

/** Paths the row cites, with `:line` ranges and prose stripped. */
function citedPaths(row) {
  const stripped = row.file.replace(/:\d[\d,-]*/g, " ");
  const found = stripped.match(/[\w][\w./-]*\.[A-Za-z]{1,4}(?![\w])/g) ?? [];
  return [...new Set(found.map((path) => path.replace(/\/+$/, "")))];
}

/** A row cites `src/index.ts`; a commit lists `packages/…/src/index.ts`. */
const fileMatches = (file, path) =>
  file === path || file.endsWith(`/${path}`) || basename(file) === path;

const touches = (files, paths) => paths.some((path) => files.some((file) => fileMatches(file, path)));

/**
 * Finding ids a subject names, with `F13-F23` / `F1–F12` ranges expanded (the
 * branch writes folds as `fold F43+F44+F45+F53+F54` and as a range, and one
 * commit uses an en dash).
 */
function idsInSubject(subject) {
  const ids = new Set();
  for (const m of subject.matchAll(/F\d+/g)) ids.add(m[0]);
  for (const m of subject.matchAll(/F(\d+)\s*[-\u2013\u2014]\s*F?(\d+)/g)) {
    const [from, to] = [+m[1], +m[2]];
    if (to > from && to - from <= 500) for (let n = from; n <= to; n++) ids.add(`F${n}`);
  }
  return ids;
}

const messageCache = new Map();
const messageOf = (sha) => {
  if (!messageCache.has(sha)) messageCache.set(sha, git("log", "-1", "--format=%B", sha));
  return messageCache.get(sha);
};
/** Commits name the ids they fold in the subject OR the body (`P15` close-outs). */
const namesId = (sha, id) => idsInSubject(messageOf(sha)).has(id);

const filesCache = new Map();
function filesOf(sha) {
  if (!filesCache.has(sha)) filesCache.set(sha, git("show", "--pretty=", "--name-only", sha).split("\n").filter(Boolean));
  return filesCache.get(sha);
}

/** Tokens in the row that resolve to commits reachable from HEAD. */
function verifiedTokens(text) {
  const out = [];
  for (const token of text.match(COMMIT_TOKEN_RE) ?? []) {
    const full = git("rev-parse", "--verify", "--quiet", `${token}^{commit}`).trim();
    if (full && isAncestor(full, "HEAD")) out.push(full);
  }
  return [...new Set(out)];
}

const rel = repoRelative(ledger);
const parsed = parseRows(readFileSync(ledger, "utf8"));
const { rows: current, rejected, counted } = parsed;
// The parser's own completeness clause: a counted line that neither parsed nor was
// reported is the silent drop C1 names, so the tool refuses it in itself.
if (counted !== current.size + rejected.length) {
  process.stderr.write(
    `ARITY FAULT: ${counted} row line(s) counted, ${current.size} parsed, ${rejected.length} refused — the recount read neither\n`,
  );
  process.exitCode = 1;
}

// --- 1. flip + introduction detection: walk every historical version ---------
const flips = new Map();
const introduced = new Map();
let previous = new Map();
for (const sha of git("log", "--reverse", "--format=%H", "--", rel).split("\n").filter(Boolean)) {
  // Historical snapshots are read for flips only; a malformed row in history is
  // invisible to flip detection, which fails closed (the row reports UNPROVEN), and
  // never to the recount of the file as it stands now.
  const { rows: snapshot } = parseRows(git("show", `${sha}:${rel}`));
  for (const [id, row] of snapshot) {
    if (!introduced.has(id)) introduced.set(id, { sha, folded: row.folded });
    const before = previous.get(id);
    if (before && before.folded === "no" && row.folded === "yes") flips.set(id, { sha, route: row.route });
    if (!before && row.folded === "yes") flips.set(id, { sha, recordedYes: true });
  }
  previous = snapshot;
}

// --- 2. branch commits whose message names a finding id ----------------------
// One `git log` call for the whole walk: NUL separates records, \x1f splits the
// sha from its (multi-line) message. When `main` has not diverged — a fresh clone,
// or a repo whose branch IS main — the range is empty, so walk HEAD itself.
const head = git("rev-parse", "HEAD").trim();
const mergeBase = git("merge-base", "main", "HEAD").trim();
const since = mergeBase && mergeBase !== head ? `${mergeBase}..HEAD` : "HEAD";
const namedById = new Map();
for (const record of git("log", "--reverse", `--format=%x00%H%x1f%B`, since).split("\0")) {
  const [sha, message] = record.split("\x1f");
  if (!/^[0-9a-f]{40}$/.test(sha ?? "") || !message) continue;
  messageCache.set(sha, message);
  for (const id of idsInSubject(message)) {
    if (!current.has(id)) continue;
    if (!namedById.has(id)) namedById.set(id, []);
    namedById.get(id).push({
      sha,
      // A commit that records the row open proves nothing on its own.
      recordsOnly: introduced.get(id)?.sha === sha && introduced.get(id).folded !== "yes",
    });
  }
}

// --- 3. classify every row ---------------------------------------------------
const report = [];
for (const [id, row] of current) {
  const entry = { id, folded: row.folded, status: null, fold: null, flip: null, evidence: null };
  if (row.folded !== "yes") {
    entry.status = "open";
    report.push(entry);
    continue;
  }
  const flip = flips.get(id);
  if (flip) entry.flip = short(flip.sha);
  const nonLedger = citedPaths(row).filter((path) => path !== rel);

  const cited = verifiedTokens(`${row.file} ${row.route}`);
  // A token counts as provenance only when the commit it names actually CLAIMS the
  // fold: it is the commit that flipped the row, or its message names the id. A bare
  // file intersection proves nothing — `@3112e34`-style review-round and persistence
  // markers cite commits that touched the same surface without folding the row
  // (known-issues.md: the recount must test for a fold citation, not for any hex token).
  const recordsTheRow = introduced.get(id);
  const tieable = cited.filter((sha) => {
    if (sha === flip?.sha) return true;
    if (recordsTheRow?.sha === sha && recordsTheRow.folded !== "yes") return false;
    return namesId(sha, id);
  });
  if (tieable.length) {
    entry.status = "proven-cited";
    entry.fold = short(tieable.includes(flip?.sha) ? flip.sha : tieable.at(-1));
    entry.evidence = "row cites a commit that resolves and matches its message or surface";
    report.push(entry);
    continue;
  }

  // No usable citation — or only a review-point sha that never folded anything.
  // Rank the commits that claim the id: one that changes the row's own surface is
  // the strongest, then one that changes anything outside the ledger, then the flip
  // commit itself when the row's surface IS the ledger. A commit that merely
  // recorded the row open never qualifies: it proves the finding existed, not that
  // anyone fixed it.
  const rank = (c) => {
    const files = filesOf(c.sha).filter((file) => file !== rel);
    if (!files.length && c.recordsOnly) return 0; // recorded the row, changed nothing
    if (touches(files, nonLedger)) return 3; // owns a surface the row cites
    if (files.length) return 2; // claims the id beside a real change
    // Only the commit that ticked the row claims it: for a docs or forge-only row
    // — its surface IS the ledger, or a PR body — that commit is the fold record.
    if (c.sha === flip?.sha && namesId(c.sha, id)) return 1;
    return 0;
  };
  const ranked = (namedById.get(id) ?? [])
    .map((c) => ({ ...c, score: rank(c) }))
    // Nothing that landed after the tick can be the fold the tick attested.
    .filter((c) => c.score > 0 && (!flip || isAncestor(c.sha, flip.sha)))
    .sort((a, b) => a.score - b.score);
  const chosen = ranked.at(-1);
  if (chosen) {
    entry.status = cited.length ? "cited-unverified" : chosen.score === 3 ? "recovered" : "recovered-by-message";
    entry.cited = cited.map(short);
    entry.fold = short(chosen.sha);
    // `fold` names a commit that changed the row's own surface; `ticked` names the
    // commit that flipped the row and claims the fold — the honest label when the
    // repair is no longer separable from the bookkeeping that recorded it.
    entry.token = chosen.score === 1 ? "ticked" : "fold";
    entry.evidence = chosen.score === 3
      ? `${entry.fold} names ${id} and changes a surface the row cites`
      : `${entry.fold} names ${id} in its message${chosen.sha === flip?.sha ? " and is the commit that ticked the row" : ""}`;
    if (flip && flip.sha !== chosen.sha) entry.tickedIn = short(flip.sha);
    report.push(entry);
    continue;
  }
  entry.status = "unproven";
  entry.evidence = flip
    ? `ticked in ${entry.flip} by a commit that names neither ${id} nor any cited surface (${nonLedger.join(", ") || "no cited file"})`
    : "no flip and no commit reference anywhere in the ledger history";
  report.push(entry);
}

// --- 4. report and optional mutation ----------------------------------------
// A line the schema refused is reported as its own `unparsed` entry: it is neither
// proven nor open, and it must reach the `--check` refusal and the detail loop.
for (const drop of rejected) {
  report.push({ id: drop.id, folded: null, status: "unparsed", fold: null, flip: null, evidence: drop.reason });
}
const buckets = report.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] ?? 0) + 1 }), {});
const needsWork = report.filter((e) => e.status !== "proven-cited" && e.status !== "open");

if (asJson) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (!asJson) {
  const arity = rejected.length ? ` counted ${counted} unparsed ${rejected.length}` : "";
  process.stdout.write(`rows ${current.size}${arity}  ${JSON.stringify(buckets)}\n`);
}
if (!asJson) {
  for (const e of needsWork)
    process.stdout.write(`${e.id}\t${e.status}\tfold=${e.fold ?? "-"}\t${e.evidence ?? ""}\n`);
}

if (annotate) {
  const byId = new Map(report.map((e) => [e.id, e]));
  const original = readFileSync(ledger, "utf8").split("\n");
  const out = original.map((line) => {
    const match = ROW_RE.exec(line);
    if (!match) return line;
    const entry = byId.get(match[1]);
    // An `unparsed` row is not annotatable: writing a token into a line the schema
    // refused would be the tool inventing the arity it just refused.
    if (!entry || entry.status === "open" || entry.status === "proven-cited" || entry.status === "unparsed") return line;
    const cells = line.split(CELL_RE);
    if (cells.length !== 9) return line;
    const route = cells[6].trim();
    if (entry.fold) {
      if (new RegExp(`·\s*${entry.token}\s[0-9a-f]{7}`).test(route)) return line;
      const tail = entry.token === "fold" && entry.tickedIn ? ` (ticked ${entry.tickedIn})` : "";
      cells[6] = ` ${route} · ${entry.token} ${entry.fold}${tail} `;
    } else {
      cells[7] = " no ";
      cells[6] = /REOPENED/.test(route)
        ? ` ${route} `
        : ` ${route} · REOPENED P20 — provenance unproven: ${entry.evidence} `;
    }
    if (cells.join("|").split(CELL_RE).length !== 9) return line; // never break the 7-column schema
    return cells.join("|");
  });
  const changed = out.filter((line, i) => line !== original[i]).length;
  // `--check` writes nothing, so it must not claim it did (C2): past tense here reads
  // as a mutation the flag explicitly forbids.
  const tense = checkOnly ? "would annotate" : "annotated";
  process.stdout.write(changed ? `${tense} ${changed} row(s)\n` : "nothing to annotate\n");
  if (rejected.length) {
    process.stdout.write(
      `ARITY: ${rejected.length} row(s) matched the id pattern but the schema refused them, so they were not read: ${rejected.map((r) => `${r.id} (${r.reason})`).join(", ")}\n`,
    );
  }
  if (!checkOnly) writeFileSync(ledger, out.join("\n"));
}

if (checkOnly) {
  const unparsed = report.filter((e) => e.status === "unparsed");
  const unticked = needsWork.filter((e) => e.status !== "unparsed");
  if (needsWork.length) {
    const parts = [];
    if (unticked.length) {
      parts.push(`${unticked.length} folded row(s) lack a verified commit token: ${unticked.map((e) => e.id).join(", ")}`);
    }
    if (unparsed.length) {
      parts.push(`${unparsed.length} row(s) the 7-column schema refused were read by nothing: ${unparsed.map((e) => e.id).join(", ")}`);
    }
    process.stdout.write(`CHECK FAIL: ${parts.join("; ")}\n`);
    process.exit(1);
  }
  process.stdout.write("CHECK PASS: every folded row names a verified commit\n");
}
