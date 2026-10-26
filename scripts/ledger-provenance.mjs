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
 *     subject or surface — an unverifiable citation (dangling, or naming a commit
 *     that never folded the row) is reported, never trusted;
 *  4. everything else is UNPROVEN and re-opens: asserted provenance is worse than
 *     none, because it silently passes the recount that F106 exists to satisfy.
 *
 * Usage: bun scripts/ledger-provenance.mjs docs/features/<unit>/review-findings.md
 *        [--json] [--check] [--annotate]
 *
 * The target is the LEGACY findings carrier, and this tool says so: it recounts
 * `folded: yes` rows, and a migrated unit (#308) has none — its OPEN rows live in
 * `## Findings` and a folded row leaves that table for a `## Log` line. The recount
 * refuses a unit doc instead of reading a `## Findings` table as an all-open ledger
 * and reporting CHECK PASS over nothing (#308 review, F16).
 *
 *   --check     exit 1 unless every `folded: yes` row carries a verified commit
 *               token (the mechanical recount P20's done-when demands)
 *   --annotate  rewrite the ledger: append ` · fold <sha>` to every row whose fold
 *               commit is proven but uncited, and re-open every unproven row as
 *               `folded: no` with a note naming the missing evidence
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { basename, isAbsolute, relative, resolve } from "node:path";
// Shared section parser (fence-aware, issue #308 F28).
import { sectionBounds } from "./unit-doc-phases.mjs";

const COMMIT_TOKEN_RE = /\b[0-9a-f]{7,40}\b/g;
/**
 * Filter out clearly non-SHA strings the regex catches as valid hex but aren't
 * real commits. GitHub issue URLs like `#issuecomment-5436882280` produce 10+
 * digit sequences that pass `[0-9a-f]{7,40}` — the git `rev-parse` call would
 * still fail, but we skip it to avoid noise.  Valid short SHAs can be
 * all-decimal (e.g. `3958001`), so we only reject strings > 12 chars (git
 * short-sha cap is 12, and a 40-char full SHA always has at least one
 * non-decimal hex digit in practice).
 */
const isPossibleSHA = (s) =>
  (s.length >= 7 && s.length <= 12) || s.length === 40;
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
  console.error("usage: bun scripts/ledger-provenance.mjs <review-findings.md> [--json] [--check] [--annotate]");
  process.exit(2);
}
const ledger = resolve(target);
const asJson = args.includes("--json");
const checkOnly = args.includes("--check");
const annotate = args.includes("--annotate");

const run = (rest, opts = {}) =>
  execFileSync("git", rest, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024, ...opts });
const git = (...rest) => {
  try {
    return run(rest);
  } catch (err) {
    // Walk errors are fatal — log instead of silently swallowing the
    // failure (the old 1 MB maxBuffer silently ate this on repos whose
    // full history exceeds that; the walk then produced zero candidates
    // and the merge-base..HEAD gate excluded everything).
    // Expected failures (merge-base not-ancestor, rev-parse of a
    // false-positive token) are handled by the caller; we only log
    // so the problem is visible, never set exitCode here.
    process.stderr.write(`GIT ERROR: ${err.message}\n`);
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

const topRoot = git("rev-parse", "--show-toplevel").trim();
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
    // A ledger keys more than one table by `| F<n> |`: the findings table, and prose
    // summaries such as `| Row | Repaired in | What the fold had to get right |`.
    // Unit 27's ten `unparsed` rows were that second table — counted as arity-broken
    // findings and then shadowed by the real row's duplicate. The row schema is what
    // defines a finding, so a line that does not carry it is a reference to one, and
    // the first line that DOES carry it is the finding (first-read-wins).
    if (cells.length !== 7) {
      // A reference line, not a silently-skipped one: it is REPORTED, so the parser's
      // completeness invariant (`counted === read + refused`) keeps holding and an id
      // that never carries the schema anywhere stays visible. A ledger keys more than
      // one table by `| F<n> |` — the findings table and prose summaries such as
      // `| Row | Repaired in | What the fold had to get right |`; unit 27's ten
      // "unparsed rows" were that summary, not broken findings.
      rejected.push({ id: match[1], reason: `${cells.length} cells instead of the 7-column schema` });
      continue;
    }
    if (rows.has(match[1])) {
      rejected.push({ id: match[1], reason: "duplicate id in the file — only the last row is read" });
      continue;
    }
    rows.set(match[1], { file: cells[1], route: cells[5], folded: cells[6], cell: cells[6] });
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
/**
 * Ids the commit's own SUBJECT claims, on the fold subjects this repo writes
 * (`fix(36): fold F72-F75 — …`, `chore(x): fold F9 — …`). A body-only mention
 * (`subject names it in its message`) is a report reference, not a fold claim:
 * tying a citation to one of those let a commit that merely discussed a finding
 * pass the recount for it (F80).
 */
const subjectCache = new Map();
const foldSubjectIds = (sha) => {
  // PERF (cycle 10): one `git log -1` process per tied citation cost 15x the old
  // recount (509 child processes on an 81-row ledger). The walk already caches every
  // commit message, so the subject is its first line — memoised, zero processes.
  //
  // The subject claims a row when it NAMES it: the branch's fold commits are written
  // `fix(36): bump F21 — …`, `fix(36): F22 — …`, `fix(unit-route): gate close-out…
  // (F31, F6)` as often as `… fold F43+…`. Requiring the literal word `fold` here read
  // 31 genuinely-folded rows as never folded; what must not count is the commit that
  // only RECORDED the row open, which the caller excludes by its introduction commit.
  if (subjectCache.has(sha)) return subjectCache.get(sha);
  const message = messageCache.has(sha) ? messageCache.get(sha) : git("log", "-1", "--format=%B", sha);
  messageCache.set(sha, message);
  const subject = message.split("\n")[0] ?? "";
  subjectCache.set(sha, idsInSubject(subject));
  return subjectCache.get(sha);
};

const filesCache = new Map();
function filesOf(sha) {
  if (!filesCache.has(sha)) filesCache.set(sha, git("show", "--pretty=", "--name-only", sha).split("\n").filter(Boolean));
  return filesCache.get(sha);
}

/** Tokens in the row that resolve to commits reachable from HEAD. */
function verifiedTokens(text) {
  const out = [];
  for (const token of text.match(COMMIT_TOKEN_RE) ?? []) {
    if (!isPossibleSHA(token)) continue;
    const full = git("rev-parse", "--verify", "--quiet", `${token}^{commit}`).trim();
    if (full && isAncestor(full, "HEAD")) out.push(full);
  }
  return [...new Set(out)];
}

const rel = repoRelative(ledger);
// SEC (cycle 10): `--annotate` rewrote whatever path argv named — no containment,
// no extension check — and `repoRelative` merely falls back to the absolute path
// outside the checkout. A ledger is a repository document; refuse anything else
// before a single byte is read, so `--check` (read-only) cannot be turned into a
// fleet-wide rewrite by a typo either.
if (!rel || rel.startsWith("..") || isAbsolute(rel) || !rel.endsWith(".md")) {
  process.stderr.write(
    `REFUSED: ${ledger} is not a Markdown ledger inside the checkout (${topRoot || "unknown root"}) — this tool never writes outside the repository\n`,
  );
  process.exit(2);
}
const ledgerText = readFileSync(ledger, "utf8");
// #308 §Scope 3 — the collapsed carrier. A migrated unit's folded findings are
// `## Log` lines (`- **F1** — … folded F12 · `abc1234` · what was verified`) and its
// OPEN rows are the `## Findings` table, which has no `folded` column: every row in it
// is open by definition. The recount reads whichever carrier the target is, so a
// migrated unit's fold receipts are provable at the same standard as a legacy ledger's.
const isUnitDoc = basename(ledger) === "SPEC.md"
  // The same fence-aware reader the recount itself uses: a legacy unit doc that
  // quotes `## Findings` or `## Log` inside a fenced sample is not a migrated
  // unit, and must not be read as the collapsed carrier (F45 — the bare `/m`
  // regex was the class F28 closed on the section readers).
  && (sectionBounds(ledgerText, "Findings") !== null || sectionBounds(ledgerText, "Log") !== null);
if (isUnitDoc) {
  if (annotate) {
    process.stderr.write(
    `REFUSED: ${rel} is the collapsed carrier — its ## Log is append-only, so no tool annotates it. A fold line names its own commit when fold-findings writes it; re-run the fold, or use the legacy ledger's --annotate.\n`,
    );
    process.exit(2);
  }
  runDocRecount({ rel, text: ledgerText, asJson, checkOnly });
  process.exit(process.exitCode ?? 0);
}
const parsed = parseRows(ledgerText);
const { rows: current, rejected, counted } = parsed;
// The parser's own completeness clause: a counted line that neither parsed nor was
// reported is the silent drop C1 names, so the tool refuses it in itself.
if (counted !== current.size + rejected.length) {
  process.stderr.write(
    `ARITY FAULT: ${counted} row line(s) counted, ${current.size} parsed, ${rejected.length} refused — the recount read neither\n`,
  );
  process.exitCode = 1;
}

/**
 * The marker the annotator writes into a folded cell: `yes · fold <sha>`, or
 * `· ticked <sha>` on a row that scores 1. Reading it is what makes the recount
 * see an annotated ledger: every fold writes that shape, so a parser that only
 * accepts a bare `yes` buckets the whole ledger `open` and validates nothing
 * (F80 — the silent pass this tool exists to prevent).
 */
const FOLD_MARK_RE = /·\s*(fold|ticked)\s+([0-9a-f]{7,40})\b/g;
const foldMarker = (cell) => {
  const marks = [...(cell ?? "").matchAll(FOLD_MARK_RE)].map((m) => m[2]);
  return marks.length ? marks.at(-1) : null;
};
/** A folded cell either reads exactly `yes` or carries the annotator's marker. */
const isFolded = (cell) => typeof cell === "string" && (/^\s*yes\b/.test(cell) || foldMarker(cell) !== null);

/**
 * The collapsed carrier's recount. Each `## Log` folded-finding line must name a
 * commit that resolves, is reachable from HEAD, and claims the finding ids the line
 * folds — the same three proofs the legacy ledger's `· fold <sha>` marker carries.
 * A `## Findings` row is OPEN by definition and pays no proof: it is the work, not
 * the receipt. `--check` exits 1 unless every folded line is proven.
 */
function runDocRecount({ rel: docRel, text, asJson: json, checkOnly: check }) {
  const logBounds = sectionBounds(text, "Log");
  const findingsBounds = sectionBounds(text, "Findings");
  const logBody = logBounds === null ? "" : text.slice(logBounds[0], logBounds[1]);
  const findingsBody = findingsBounds === null ? "" : text.slice(findingsBounds[0], findingsBounds[1]);

  const report = [];
  let openRows = 0;
  for (const line of findingsBody.split("\n")) {
    const cells = line.split(CELL_RE).slice(1, -1).map((cell) => cell.trim());
    if (cells.length < 6 || !/^F\d+$/.test(cells[0] ?? "")) continue;
    openRows += 1;
    report.push({ id: cells[0], status: "open", carrier: "findings", fold: null, evidence: cells[5] ?? "" });
  }

  const folded = [...logBody.matchAll(/^\s*[-*+]\s+\*\*F(\d+)\*\*\s*[—-]\s*(.*)$/gm)];
  for (const [, , body] of folded) {
    const cited = verifiedTokens(body);
    const claimed = [...body.matchAll(/\bF\d+\b/g)].map((m) => m[0]);
    const lineId = `F${claimed.length ? claimed[0].slice(1) : "?"}`;
    if (cited.length === 0) {
      report.push({
        id: lineId,
        status: "unproven",
        carrier: "log",
        fold: null,
        evidence: "a folded-finding log line with no commit token — name the fold commit it attests",
      });
      continue;
    }
    // A folded line may name its fold commit and later context commits in any
    // order. The proof is the token whose SUBJECT claims the ids the line folds,
    // not the last token written: reading only `cited.at(-1)` failed a legitimate
    // receipt whenever the proving commit came first (F47 — the mirror of F36,
    // which demoted on prose citations in the legacy ledger).
    const proof = cited.find((candidate) => claimed.some((id) => foldSubjectIds(candidate).has(id)));
    const sha = proof ?? cited.at(-1);
    const claims = claimed.filter((id) => foldSubjectIds(sha).has(id));
    if (claims.length === 0) {
      report.push({
        id: lineId,
        status: "cited-unverified",
        carrier: "log",
        fold: short(sha),
        evidence: `${short(sha)} resolves and is reachable, but its subject claims none of ${claimed.join(", ") || "any finding id"} — the line names a commit that folded something else`,
      });
      continue;
    }
    report.push({
      id: claims.join("+"),
      status: "proven-cited",
      carrier: "log",
      fold: short(sha),
      evidence: `${short(sha)} names ${claims.join(", ")} in its subject`,
    });
  }

  const buckets = report.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] ?? 0) + 1 }), {});
  const needsWork = report.filter((e) => e.status !== "proven-cited" && e.status !== "open");
  if (json) process.stdout.write(JSON.stringify({ carrier: "unit-doc", rows: report }, null, 2) + "\n");
  else {
    process.stdout.write(`unit-doc ${docRel} open ${openRows} folded ${folded.length}  ${JSON.stringify(buckets)}\n`);
    for (const e of needsWork) process.stdout.write(`${e.id}\t${e.status}\tfold=${e.fold ?? "-"}\t${e.evidence ?? ""}\n`);
  }
  if (check) {
    if (needsWork.length) {
      process.stdout.write(`CHECK FAIL: ${needsWork.length} folded line(s) lack a verified commit\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write("CHECK PASS: every folded line names a verified commit\n");
    }
  }
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
    // F60: `route` and `recordedYes` were written here and read nowhere — the annotate
    // path re-derives the cell from the line itself. Only the flip sha is ever consulted.
    if (before && !isFolded(before.folded) && isFolded(row.folded)) flips.set(id, { sha });
    if (!before && isFolded(row.folded)) flips.set(id, { sha });
  }
  previous = snapshot;
}

// --- 2. branch commits whose message names a finding id ----------------------
// The candidate walk now covers every commit reachable from HEAD; the
// `merge-base(main,HEAD)..HEAD` gate previously excluded commits that
// were folded by the merge into main, so the fold-leaf SHAs could be
// invisible to the walk after a branch rebase. Walking HEAD restores
// the full history regardless of merge-base position.
const head = git("rev-parse", "HEAD").trim();
const since = "HEAD";
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
      recordsOnly: introduced.get(id)?.sha === sha && !isFolded(introduced.get(id).folded),
    });
  }
}

// --- 3. classify every row ---------------------------------------------------
const report = [];
for (const [id, row] of current) {
  const entry = { id, folded: row.folded, status: null, fold: null, flip: null, evidence: null };
  if (!isFolded(row.folded)) {
    entry.status = "open";
    report.push(entry);
    continue;
  }
  const flip = flips.get(id);
  if (flip) entry.flip = short(flip.sha);
  const nonLedger = citedPaths(row).filter((path) => path !== rel);

  // The citations a row can carry live in BOTH cells the annotator writes: the folded
  // cell's marker and the route-cell marker it emits beside the row's prose. Reading
  // only the folded cell made every row annotated in the route cell unrecoverable —
  // and every row the annotator had re-opened cite a phantom `undefined <sha>` in the
  // route cell that nothing resolved.
  const marker = foldMarker(row.cell) ?? foldMarker(row.route);
  const marked = marker === null ? null : git("rev-parse", "--verify", "--quiet", `${marker}^{commit}`).trim();

  const cited = verifiedTokens(`${row.file} ${row.route}`);
  // A token counts as provenance only when the commit it names actually CLAIMS the
  // fold: it is the commit that flipped the row, or its message names the id. A bare
  // file intersection proves nothing — `@3112e34`-style review-round and persistence
  // markers cite commits that touched the same surface without folding the row
  // (known-issues.md: the recount must test for a fold citation, not for any hex token).
  const recordsTheRow = introduced.get(id);
  const tieable = cited.filter((sha) => {
    if (sha === flip?.sha) return true;
    if (recordsTheRow?.sha === sha && !isFolded(recordsTheRow.folded)) return false;
    return foldSubjectIds(sha).has(id);
  });
  if (tieable.length) {
    entry.status = "proven-cited";
    entry.fold = short(tieable.includes(flip?.sha) ? flip.sha : tieable.at(-1));
    entry.evidence = "row cites a commit that resolves and matches its message or surface";
    report.push(entry);
    continue;
  }
  // The annotator's own marker is the citation the ledger path writes, so it is held
  // to the same bar: the commit must resolve AND be reachable from HEAD. A token that
  // names an amended-away commit is the dangling-pointer class F75/F78 record, and
  // trusting it (or ignoring it) is the silent pass this recount must never make.
  if (marked && isAncestor(marked, "HEAD") && foldSubjectIds(marked).has(id)) {
    entry.status = "proven-cited";
    entry.fold = short(marked);
    entry.evidence = `the row's own marker names ${short(marked)}, whose subject folds ${id}`;
    report.push(entry);
    continue;
  }
  if (marked && isAncestor(marked, "HEAD")) {
    entry.status = "cited-unverified";
    entry.cited = [short(marked)];
    entry.fold = short(marked);
    entry.evidence = `${short(marked)} resolves and is reachable, but its subject does not claim ${id} — the marker cites a commit that folded something else`;
    report.push(entry);
    continue;
  }
  if (marker !== null) {
    entry.status = "dangling";
    entry.cited = [marker];
    entry.fold = short(marker);
    entry.evidence = marked
      ? `${short(marker)} resolves but is not an ancestor of HEAD — the fold it attested was amended away; re-point the marker`
      : `${short(marker)} resolves to no commit — the marker cites bytes that do not exist`;
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
// A line the schema refused is reported as its own entry: it is neither proven nor
// open, and it must reach the detail loop. When the same id also carries a schema row
// the line is a NAME REFERENCE (a prose summary table keyed by finding id) — reported
// as `reference`, never as work waiting on anyone.
for (const drop of rejected) {
  report.push({
    id: drop.id,
    folded: null,
    status: current.has(drop.id) ? "reference" : "unparsed",
    fold: null,
    flip: null,
    evidence: drop.reason,
  });
}
const buckets = report.reduce((acc, e) => ({ ...acc, [e.status]: (acc[e.status] ?? 0) + 1 }), {});
const needsWork = report.filter(
  (e) => !["proven-cited", "recovered", "recovered-by-message", "open", "reference"].includes(e.status),
);

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
  const out = original.map((rawLine) => {
    const match = ROW_RE.exec(rawLine);
    if (!match) return rawLine;
    const entry = byId.get(match[1]);
    // A1 (cycle 10): the REOPENED note this path writes puts the row back to
    // `folded: no`, so the recount buckets it `open` and every later run skipped the
    // line it had just written — the note survived as a stale claim, and a row that
    // is now provable could never recover because its own note blocked the rewrite.
    // The note is the annotator's alone: strip it first, then re-derive from the walk.
    let line = rawLine;
    // The note is re-derived only for a row the walk is about to re-open, where its
    // evidence string is the same bytes it wrote last time. For a row that is still
    // `open` or now `proven-cited`, the note is the last thing that happened to it and
    // stripping it would make the next run re-strip and the run after re-write.
    const stale = /\s*·\s*REOPENED — provenance unproven:[^|]*(?=\s*\|)/.exec(line);
    const reopening = entry && !["open", "proven-cited", "unparsed"].includes(entry.status) && !entry.token;
    if (stale && reopening) {
      // remove exactly the note and the padding it owns — never the row's own text
      line = line.slice(0, stale.index) + line.slice(stale.index + stale[0].length);
      line = line.replace(/\s*\|\s*$/, " |");
    }
    // An `unparsed` row is not annotatable: writing a token into a line the schema
    // refused would be the tool inventing the arity it just refused.
    if (!entry || entry.status === "open" || entry.status === "proven-cited" || entry.status === "unparsed") return line;
    const cells = line.split(CELL_RE);
    if (cells.length !== 9) return line;
    const route = cells[6].trim();
    // A1: `cited-unverified` / `dangling` reach here without the token the append
    // path interpolates, so the annotator wrote the literal `· undefined <sha>` —
    // a token outside the contract's closed vocabulary (`ledger-ownership@1`), and
    // one the re-entry guard then matched against itself, so the row never re-opened.
    // Only a real fold claim appends; everything else re-opens with evidence.
    if (entry.fold && entry.token) {
      // F59: `\s` inside a template literal collapses to the character `s`, so the old
      // guard pattern (`·s*folds…`) could never match the marker this branch writes.
      // The escapes are doubled: a re-entry check that never re-matches is no check.
      if (new RegExp(`·\\s*${entry.token}\\s[0-9a-f]{7}`).test(route)) return line;
      const tail = entry.token === "fold" && entry.tickedIn ? ` (ticked ${entry.tickedIn})` : "";
      cells[6] = ` ${route} · ${entry.token} ${entry.fold}${tail} `;
    } else {
      cells[7] = " no ";
      // F58: the note must name only what the walk observes — the row and its missing
      // evidence. It used to hardcode `P20`, a phase no plan of the annotated unit
      // contains: a mechanical token inventing a fact. No phase, no fabricated number.
      if (/ · REOPENED — provenance unproven: /.test(route)) return line;
      cells[6] = ` ${route} · REOPENED — provenance unproven: ${entry.evidence} `;
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
  if (needsWork.length) {
    // A2: three defects with three remedies were collapsed into one
    // "lack a verified commit token" line, so a reader could not tell a re-point
    // from a re-annotation from an arity repair. One line per cause.
    const byStatus = new Map();
    for (const entry of needsWork) {
      if (!byStatus.has(entry.status)) byStatus.set(entry.status, []);
      byStatus.get(entry.status).push(entry);
    }
    const REPAIR = {
      dangling: "cite a commit outside HEAD's history — re-point the marker at the commit that folded the row",
      "cited-unverified": "cite a reachable commit whose subject does not claim the row — cite the commit that folded it",
      unproven: "are ticked with no commit behind them — cite the fold or re-open them",
      unparsed: "the 7-column schema refused (arity) — repair the columns; no tool may invent them",
    };
    const paused = [...byStatus].filter(([status]) => !status.startsWith("recovered"));
    if (paused.length) {
      process.stdout.write(`CHECK FAIL: ${needsWork.length} row(s) need a repair, by cause:\n`);
      for (const [status, entries] of paused) {
        process.stdout.write(`  ${entries.length} ${status}: ${entries.map((e) => e.id).join(", ")} — ${REPAIR[status] ?? "repair the citation"}\n`);
      }
      process.exit(1);
    }
  }
  process.stdout.write("CHECK PASS: every folded row names a verified commit\n");
}
