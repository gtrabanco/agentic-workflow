#!/usr/bin/env node
/**
 * promise-coherence.mjs — every executable claim in a document must reproduce.
 *
 * The defect class: a promise written in prose that no longer holds at the
 * bytes. Unit 258 burned 12 review→fold cycles on it — 23 of its 56 findings
 * were regressions of already-folded rows — and the whole gate stayed green
 * through every one of them (727/727 tests, budgets PASS, phase-lint PASS),
 * because the existing guards check syntax, budgets and parity but nothing
 * re-runs what a document claims.
 *
 * Usage
 *   bun scripts/promise-coherence.mjs [<path> …]      (node fallback, same argv)
 *   no path → the in-flight unit docs + the budget manifest + every skill's
 *   Turn-contract box (closed units are append-only evidence and are skipped,
 *   with one printed `skip:` line naming the count).
 *
 * stdout: one fixed, byte-stable block — a `Promise-coherence:` header per
 * failing claim with its `claim:`/`observed:` lines, one `skip:` line per claim
 * this pass deliberately does not execute, then `verdict` and a `claims:` tally.
 * exit: 0 only when the verdict is `PASS`.
 *
 * Claim kinds (closed set — adding one is a SPEC change in the owning reference,
 * never a new branch here):
 *   validator        a unit-doc validator cell: `` `cmd` … matches <N> `` or
 *                    `` `cmd` … exits <N> ``, re-run and compared
 *   formula          a budget narration: `ceil(<A> x 1.10) = <B>` recomputed,
 *                    and the entry's declared ceiling must be a number its own
 *                    narration derives
 *   measure          a budget narration's last `measured <A> est / <B> lines`
 *                    re-measured (`scripts/check-skill-context.mjs` owns the
 *                    metric; this script never carries a second copy of it)
 *   surface          a backticked path in a narration must exist
 *   removed-phrase   a backticked phrase a narration claims is gone must be
 *                    absent from the surface that narration is about
 *   section-length   `<N>–<M> lines` about a named `## Section` in a named file,
 *                    recounted; an unanchored length claim fails closed
 *   prerequisite     a Turn-contract box invoking a script with a placeholder
 *                    whose required artifact the box never names
 *   contradiction    a Non-goals bullet denying scripts while the doc's own
 *                    tasks name one
 *   sweep            a fold's sweep declaration — `swept: /<pattern>/<flags> →
 *                    expected <n> in <glob>` in the unit doc's `## Log` (or
 *                    legacy `## Progress log`) — re-run as a fence-aware grep:
 *                    every matching line outside a fenced block and outside the
 *                    declaring document's own log sections counts, and the
 *                    observed count must equal `<n>` (unit 84, issue #315 S2,
 *                    the F35/F37/F38/F39 class)
 *
 * Fail-closed reason codes: `validator-mismatch`, `formula-mismatch`,
 * `measure-mismatch`, `surface-missing`, `phrase-present`, `claim-mismatch`,
 * `undisclosed-prerequisite`, `contradicts-plan`, `unparseable-claim`,
 * `no-claims`, `missing-document`, `sweep-mismatch`.
 *
 * Grammar ownership (this script mechanizes, it never redefines): the validator
 * cell is `skills/pre-execution-review/references/LEDGERS.md`; the unit-doc task
 * bullet is `skills/phase-contract/SKILL.md`; the acceptance line and Evidence
 * row are `skills/verification-contract/SKILL.md`; the Turn-contract box is
 * `skills/orchestration-envelope/references/TURN_CONTRACT.md`; the budget
 * narration is `docs/workflow/SKILL_CONTEXT_BUDGETS.json`'s own `policy.rules`.
 *
 * Allowed / forbidden: a claim is executed only when its command begins with a
 * reader (`grep`, `rg`, `wc`, `ls`, `cat`, `head`, `tail`, `test`, `git grep`)
 * and carries no shell composition (`;`, `&&`, `||`, `$(`, `>`, `<`), or when it
 * is a `node`/`bun` call of one of the committed report validators in
 * `REPORT_VALIDATORS` — read-only verdict scripts that write nothing, hit no
 * forge and spawn no process, executed argv-style with no shell at all.
 * Anything else is a printed `skip:` line naming why — never a silent pass, and
 * never a pass that checked nothing. Running `node --test`, a package `test`
 * script or `gh …` from a document would still make this pass a second, slower
 * copy of the root gate with the network and the filesystem in its blast
 * radius, so those forms are refused by name.
 *
 * Read-only: it executes reader commands with `cwd` at the repository root and
 * never writes. No external dependencies.
 *
 * Deterministic approximations (pinned by `scripts/promise-coherence.test.mjs`):
 * a `matches <N>` claim compares against the whole integer on stdout when the
 * output is one integer, else against the count of non-empty output lines; the
 * first recognised expectation after a command binds it; a formula is compared
 * with `Math.ceil(A × 10 / 10 × 1.1)`-equivalent float arithmetic on integers
 * below 1e6, so no rounding path differs between node and bun; and a claim whose
 * document-derived text is echoed is sanitized exactly like `phase-lint.mjs`
 * echoes a phase title (backticks dropped, non-ASCII replaced, block tokens
 * broken) so no document can forge a block line.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseUnitDocPhases, sectionBounds } from "./unit-doc-phases.mjs";
import { PREREQUISITES } from "./needs-input.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The closed claim-kind vocabulary. */
export const CLAIM_KINDS = Object.freeze([
  "validator",
  "formula",
  "measure",
  "surface",
  "removed-phrase",
  "section-length",
  "prerequisite",
  "contradiction",
  "sweep",
]);

/** The closed fail-closed reason vocabulary. */
export const REASON_CODES = Object.freeze([
  "validator-mismatch",
  "formula-mismatch",
  "measure-mismatch",
  "surface-missing",
  "phrase-present",
  "claim-mismatch",
  "undisclosed-prerequisite",
  "contradicts-plan",
  "unparseable-claim",
  "no-claims",
  "missing-document",
  "sweep-mismatch",
]);

/** Reader commands this pass may execute. Everything else is skipped. */
const READERS = new Set(["grep", "rg", "wc", "ls", "cat", "head", "tail", "test"]);
/**
 * The committed report validators this pass may also re-run (review F12): a
 * unit doc's `(validator: …)` cells name these forms, and when none of them
 * was executable every claim of the document was skipped and the pass still
 * printed `verdict PASS` — a green that checked nothing. The class is bounded
 * by what makes it safe: head `node` or `bun`, one argument that is a real
 * file under `scripts/` and not a `*.test.mjs` suite, no argument that is a
 * flag the runtime itself consumes (`-e`, `--test`, `--run`), nothing else,
 * and never this gate (its own runner would re-enter it). Unit 77's boundary
 * stands: this pass still never runs the suite, the package runners or `gh`.
 */
/**
 * The committed report validators this pass may also re-run (review F12): a
 * unit doc's `(validator: …)` cells name these forms, and while none of them
 * was executable every claim of the document was skipped and the pass still
 * printed `verdict PASS` — a green that checked nothing.
 *
 * The criterion is stated once and every entry meets it: the script reads the
 * tree, prints a verdict, exits 0/1/2, writes nothing, touches no forge and
 * spawns no process (so it cannot re-enter this gate). A claim naming anything
 * else — a suite runner, a package runner, `gh`, a script that writes — stays a
 * disclosed skip, refused by name. Unit 77's boundary stands: this pass never
 * runs the suite.
 */
const REPORT_VALIDATORS = new Set([
  "scripts/phase-lint.mjs",
  "scripts/check-skill-context.mjs",
  "scripts/roadmap-settle.mjs",
  "scripts/vocabulary-probe.mjs",
  "scripts/structural-sibling-pins.mjs",
]);
const VALIDATOR_SCRIPT = /^scripts\/[A-Za-z0-9._/-]+\.mjs$/;
/** Never a test file: executing the suite from inside the suite recurses. */
const SUITE_SCRIPT = /\.test\.mjs$/;
/** The gate's own file — a claim that runs it would run this claim again. */
const SELF = "scripts/promise-coherence.mjs";
/** Shell composition that turns a reader into something else. */
const COMPOSITION = /(?:;|&&|\|\||\$\(|>|<|\n)/;
/**
 * Any character a shell would interpret, or a human placeholder would use: the
 * runner class refuses a command carrying one, so a document cannot smuggle an
 * argument list into an interpreter. Reader claims keep the existing
 * `COMPOSITION` rule; this is the stricter one for code-executing heads.
 */
const RUNNER_UNSAFE = /["'`$*?(){}|[\]\\]/;
/** A suite/package runner form: refused by name, with the reason disclosed. */
const SUITE_FORM = /^(?:node|bun)\s+--test\b|^(?:bun|npm|pnpm|yarn)\s+(?:run\s+)?test\b/;
/** A backticked span in Markdown source. */
const BACKTICK = /`([^`\n]+)`/g;
/** `matches <N>` / `exactly <N>`. */
const MATCHES = /\bmatches\s+(?:exactly\s+)?(\d+)\b/;
/** `exits <N>` / `exit code <N>`. */
const EXITS = /\bexits?\s+(?:code\s+)?(\d+)\b/;
/** `ceil(<A> x 1.10) = <B>`. */
const FORMULA = /ceil\(\s*(\d+)\s*[x×*]\s*([0-9.]+)\s*\)\s*=\s*(\d+)/g;
/** `measured <A> est / <B> lines`. */
const MEASURE = /measured\s+(\d+)\s+est(?:\s*\/\s*(\d+)\s*lines?)?/g;
/** A path-looking backticked token: at least one separator, a real extension. */
const PATH_TOKEN = /^(?!\/)(?!.*\.\.)[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*\/[A-Za-z0-9_.-]+\.(?:md|mjs|js|json|ts|yml|yaml)$/;
/** A removal verb that makes a backticked phrase a "gone" claim. */
const REMOVAL = /\b(?:gone|removed|deleted|dropped|retired|no longer|replaced)\b/i;
/** `a 3–5 line pointer` and friends. */
const LENGTH_RANGE = /(\d+)\s*[–-]\s*(\d+)\s+lines?\b/;
/** A Non-goals denial of scripts. */
const DENIES_SCRIPTS = /\bno\s+(?:new\s+)?(?:runtime\s+)?(?:script|runtime)\b/i;
/** A created path under `scripts/`. */
const CREATED_SCRIPT = /\bscripts\/[A-Za-z0-9_.-]+\.mjs\b/;
/** A Turn-contract box invoking a script. */
const SCRIPT_INVOCATION = /\b(?:node|bun)\s+scripts\/([A-Za-z0-9_.-]+\.mjs)([^\n`]*)/g;

/* ------------------------------------------------------------------ files */

/**
 * A document read once, with the line index every claim is reported against.
 * `lineOf` finds the 1-based line of the first occurrence at or after `from`
 * (or of any earlier occurrence when the later one is absent), so a wrapped
 * bullet and its joined scan text still report the bullet's own line.
 */
function documentOf(file) {
  const absolute = path.isAbsolute(file) ? file : path.join(ROOT, file);
  let text;
  try {
    text = fs.readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
  const lines = text.split(/\r?\n/);
  return {
    file: path.relative(ROOT, absolute) || file,
    absolute,
    text,
    lines,
    lineOf(needle, from = 0) {
      const at = text.indexOf(needle, from);
      return at === -1 ? from : text.slice(0, at).split("\n").length;
    },
  };
}

/* --------------------------------------------------------------- sanitize */

/**
 * Neutralize document-derived text before echoing it into the block (the same
 * rule `phase-lint.mjs` applies to a phase title: a document may not carry a
 * fake block line into the output a consumer pastes).
 */
function sanitize(input, limit = 160) {
  const cleaned = String(input)
    .replace(/[^\x20-\x7e]+/g, " ")
    .replace(/`+/g, "")
    // A forged block header is the one thing an echoed claim could smuggle: a
    // newline cannot survive the whitespace collapse below, so only the header
    // token itself is broken (a path that merely contains the name stays whole).
    .replace(/promise-coherence:/gi, "promise-coherence :")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > limit ? `${cleaned.slice(0, limit)}…` : cleaned;
}

/* ---------------------------------------------------------------- claims */

/** Every claim this pass found, with the verdict each one reached. */
function blankResult(kind, file, line, claim) {
  return { kind, file, line, claim: sanitize(claim), outcome: null, observed: null, skip: null };
}

/** A runnable command, or null when the claim's command is out of scope. */
function runnableCommand(command) {
  const trimmed = command.trim();
  if (trimmed === "" || COMPOSITION.test(trimmed)) return null;
  const tokens = trimmed.split(/\s+/);
  const head = tokens[0];
  if (head === "git") {
    if (tokens[1] !== "grep") return null;
  } else if (!READERS.has(head)) {
    return null;
  }
  return trimmed;
}

/**
 * The claim's command as a bounded runner invocation, or null.
 * @returns {{argv: string[], why?: string}|null} `why` names the refusal when
 * the command is a runner form this pass will not execute.
 */
/**
 * The claim's command as a bounded report-validator invocation, or null.
 * @returns {{argv: string[]}|{argv: null, why: string}|null} `why` names the
 * refusal when the command is a form this pass declines for a stated reason.
 */
function runnerCommand(command) {
  const trimmed = command.trim();
  const tokens = trimmed.split(/\s+/);
  if (!(tokens[0] === "node" || tokens[0] === "bun")) return null;
  const target = tokens[1] ?? "";
  if (SUITE_FORM.test(trimmed)) {
    return { argv: null, why: "suite runner — this pass never executes the suite that runs it" };
  }
  if (target === SELF) {
    return { argv: null, why: "this gate itself — the claim would re-enter the pass that runs it" };
  }
  // The allowlist is the criterion enforced: a report validator, not any
  // committed file a document happens to name.
  if (!VALIDATOR_SCRIPT.test(target) || SUITE_SCRIPT.test(target) || !REPORT_VALIDATORS.has(target)) {
    return null;
  }
  for (const token of tokens.slice(2)) {
    // A long flag the script itself parses is allowed (`--routes`); anything
    // the *runtime* would consume (`-e`, `--test`, `--experimental`) is not.
    if (token.startsWith("-") && !/^--(?![a-z]*=)[a-z][a-z0-9-]*$/.test(token)) return null;
    if (RUNNER_UNSAFE.test(token)) return null;
  }
  if (!fs.existsSync(path.join(ROOT, target))) {
    return { argv: null, why: `the validator script '${target}' is not in the tree` };
  }
  return { argv: [tokens[0], target, ...tokens.slice(2)] };
}

/**
 * The runner this environment has: `bun` when it is installed, else `node` —
 * the repo's own bun-else-node convention, so a claim written as `bun …` does
 * not fail on a node-only runner. Resolved once per process.
 */
let runnerBin = null;
function resolveRunner(head) {
  if (head !== "bun") return process.execPath;
  if (runnerBin === null) {
    const probe = spawnSync("bun", ["--version"], { encoding: "utf8" });
    runnerBin = probe.status === 0 ? "bun" : process.execPath;
  }
  return runnerBin;
}

/** Execute one bounded runner invocation without a shell. */
function runArgv(argv) {
  const head = argv[0] === "bun" ? resolveRunner("bun") : process.execPath;
  const result = spawnSync(head, argv.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: typeof result.status === "number" ? result.status : 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/** Execute one reader command at the repository root. */
function runCommand(command) {
  const result = spawnSync(command, {
    shell: true,
    cwd: ROOT,
    encoding: "utf8",
    timeout: 20_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  return {
    status: typeof result.status === "number" ? result.status : 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * `ceil(basis × ratio)` with exact decimal arithmetic: `1.10` is 110/100, never
 * the float that makes 3330 × 1.1 = 3663.0000000000005 and ceil to 3664.
 */
function exactCeil(basis, ratio) {
  const [whole, fraction = ""] = String(ratio).split(".");
  const denominator = 10n ** BigInt(fraction.length);
  const numerator = BigInt(`${whole}${fraction}` || "0");
  const product = BigInt(basis) * numerator;
  const ceiling = product / denominator + (product % denominator === 0n ? 0n : 1n);
  return Number(ceiling);
}

/** The observed count of a `matches <N>` claim: one integer, or non-empty lines. */
function observedCount(stdout) {
  const trimmed = stdout.trim();
  if (trimmed !== "" && /^\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed === "" ? 0 : trimmed.split(/\n/).filter((line) => line.trim() !== "").length;
}

/**
 * Parse one validator cell into a claim, or into a skip reason.
 * The first expectation after the first command binds it.
 *
 * The span search prefers a command this pass can actually run (review F12):
 * the old single pass took the *first* lowercase-led span, so a prose span in
 * the same cell — `done · [#N](<pr-url>)` — bound as "the command", the real
 * validator never got examined, and the cell was skipped with a reason that
 * described the prose instead. Runnable first, prose-only as the fallback, so
 * an unexecutable cell is still disclosed rather than dropped.
 */
function validatorClaim(text, file, line) {
  const spans = [...text.matchAll(BACKTICK)];
  const isCommandForm = (span) => runnableCommand(span[1]) !== null || runnerCommand(span[1])?.argv;
  const commandSpan =
    spans.find(isCommandForm) ??
    spans.find((span) => /^[a-z]+\s+/.test(span[1]) || runnableCommand(span[1]) !== null || runnerCommand(span[1]) !== null);
  if (commandSpan === undefined) return null;
  const command = commandSpan[1].trim();
  const rest = text.slice(commandSpan.index + commandSpan[0].length);
  const claim = blankResult("validator", file, line, `${command}${rest === "" ? "" : ` —${rest}`}`);
  let runner = null;
  let runnable = runnableCommand(command);
  if (runnable === null) {
    runner = runnerCommand(command);
    if (runner === null) {
      claim.skip = /^[a-z]+\s+/.test(command)
        ? "command outside the reader allowlist"
        : "not a command";
      return claim;
    }
    if (runner.argv === null) {
      // Named, not generic: refused because running it here would re-enter this
      // pass, or because the artifact the claim names is gone from the tree.
      claim.skip = runner.why;
      return claim;
    }
  }
  const matches = MATCHES.exec(rest);
  const exits = EXITS.exec(rest);
  if (matches === null && exits === null) {
    claim.skip = "no declared outcome (matches <N> / exits <N>)";
    return claim;
  }
  const run = runnable === null ? runArgv(runner.argv) : runCommand(runnable);
  if (matches !== null) {
    const expected = Number(matches[1]);
    const observed = observedCount(run.stdout);
    claim.observed = `${observed}${run.status !== 0 ? ` (exit ${run.status})` : ""}`;
    claim.outcome = observed === expected ? "pass" : "fail";
    claim.reason = "validator-mismatch";
  } else {
    const expected = Number(exits[1]);
    claim.observed = `exit ${run.status}`;
    claim.outcome = run.status === expected ? "pass" : "fail";
    claim.reason = "validator-mismatch";
  }
  return claim;
}

/* ------------------------------------------------------- unit-doc claims */

/** Fence-aware `## `/`### ` section bodies of a Markdown document. */
function sectionsOf(doc) {
  const out = new Map();
  let current = null;
  let fence = null;
  let index = 0;
  for (const line of doc.lines) {
    index += 1;
    const run = /^\s*(`{3,}|~{3,})/.exec(line);
    if (run) {
      if (fence === null) fence = run[1];
      else if (line.trim() !== "" && line.trim()[0] === fence[0] && line.trim().length >= fence.length) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = /^(#{2,3}) (.+)$/.exec(line);
    if (heading !== null) {
      current = { level: heading[1].length, name: heading[2].trim(), line: index, body: [] };
      if (!out.has(current.name)) out.set(current.name, []);
      out.get(current.name).push(current);
      continue;
    }
    if (current !== null) current.body.push({ line: index, text: line });
  }
  return out;
}

/* --------------------------------------------------------- sweep claims */

/** A sweep declaration: `swept: /<pattern>/<flags> → expected <n> in <glob>`. */
const SWEEP_LINE = /^\s*(?:[-*+]\s+)?swept:\s*(.+)$/;
const SWEEP_DECLARATION = /^(\/(?:(?:[^/\\]|\\.)*)\/([a-z]*))\s*→\s*expected\s+(\d+)\s+in\s+(\S+)\s*$/;
/** Directories the sweep never walks. */
const SWEEP_SKIP_DIRS = new Set([".git", "node_modules", "dist"]);
/** A text file the sweep may read; anything else is never a survivor surface. */
const SWEEP_TEXT = /\.(?:md|mjs|js|cjs|json|ts|tsx|yml|yaml|txt|sh)$/;
/** A per-file read ceiling: a survivor surface is a document, not a data set. */
const SWEEP_MAX_FILE_BYTES = 2_000_000;
/** How many files one declaration may walk — a bound, not an estimate. */
const SWEEP_MAX_FILES = 5000;
/**
 * How long a pattern body may be (review F2). The body is authored in a unit
 * doc and compiled with `new RegExp` here, so an unbounded body is unbounded
 * work: the declaration names a stale *form*, never a program.
 */
const SWEEP_MAX_PATTERN_CHARS = 200;
/**
 * A quantified group whose body is itself quantified — the catastrophic
 * backtracking class. Conservative on purpose: the reviewed reproducer
 * `(a+)+$` cost 83 s for five `test()` calls on one 29-character line, and the
 * scan runs the pattern per line over the whole glob corpus. A refused
 * declaration asks the fold to name the literal instead; a compiled one can
 * hang the gate that runs it.
 */
const SWEEP_NESTED_QUANTIFIER = /\((?:[^()\\]|\\.)*[*+][^()\\]*\)[*+{]/;

/**
 * The sweep's bounds on one pattern body, or null when the body is inside them.
 * Deterministic by construction: shape and size, never a clock, so the same
 * declaration answers the same at any head.
 */
function sweepPatternRefusal(pattern) {
  if (pattern.length > SWEEP_MAX_PATTERN_CHARS) {
    return `the pattern body is ${pattern.length} characters, over the sweep bound of ${SWEEP_MAX_PATTERN_CHARS} — name the stale form, not a program`;
  }
  if (SWEEP_NESTED_QUANTIFIER.test(pattern)) {
    return "the pattern is a quantified group whose body is itself quantified (the catastrophic-backtracking class) — the gate refuses to compile it over a whole corpus; name the literal form instead";
  }
  return null;
}

/**
 * Parse one sweep declaration payload, or null when it is outside the fixed
 * grammar. The `in <glob>` scope is required — the cost bound (issue #315) is
 * that a declaration is the cited surface plus its inventory-declared
 * siblings, never a repo-wide regex sweep. A payload inside the grammar but
 * outside the pattern bounds comes back as `{ refused }` so the claim names
 * which bound tripped (review F2).
 */
function parseSweepDeclaration(payload) {
  const match = SWEEP_DECLARATION.exec(payload.trim());
  if (match === null) return null;
  const pattern = match[1].slice(1, match[1].lastIndexOf("/"));
  const flags = match[2].replace(/[gy]/g, "");
  const refused = sweepPatternRefusal(pattern);
  if (refused !== null) return { refused };
  try {
    return { regex: new RegExp(pattern, flags), display: match[1], expected: Number(match[3]), glob: match[4] };
  } catch {
    return null;
  }
}

/** Anchored glob → RegExp: `**` crosses `/`, `*` and `?` do not. */
function sweepGlobToRegExp(glob) {
  let out = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*") {
      if (glob[index + 1] === "*") {
        out += ".*";
        index += 1;
      } else {
        out += "[^/]*";
      }
    } else if (char === "?") {
      out += "[^/]";
    } else {
      out += char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`);
}

/** Files under `root` matching the glob, bounded (skip dirs, size, count).
 *  The declaring document itself stays in the corpus — the F35 class is a
 *  stale copy in another section of the same doc — and the caller exempts its
 *  own log sections only when scanning it.
 *  The `maxFiles` ceiling is enforced as a stop, not an overshoot: the bound is
 *  the contract (review F7 — the old check ran after `push` and `return`ed only
 *  out of the current recursion level, so sibling directories kept appending
 *  past it). Exported so the bound itself is testable without 5000 files.
 */
export function sweepFiles(root, glob, maxFiles = SWEEP_MAX_FILES) {
  const matcher = sweepGlobToRegExp(glob);
  const out = [];
  const walk = (directory) => {
    if (out.length >= maxFiles) return;
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (out.length >= maxFiles) return;
      if (SWEEP_SKIP_DIRS.has(entry.name)) continue;
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(root, absolute).split(path.sep).join("/");
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!matcher.test(relative)) continue;
      if (!SWEEP_TEXT.test(entry.name)) continue;
      let size = 0;
      try {
        size = fs.statSync(absolute).size;
      } catch {
        continue;
      }
      if (size > SWEEP_MAX_FILE_BYTES) continue;
      out.push({ relative, absolute });
    }
  };
  walk(root);
  return out;
}

/**
 * Count the regex-matching lines of one file, fence-aware: fenced blocks are
 * the fold's own evidence quote (decision D1) and never count. `skipRanges`
 * are [start, end) **string-index** ranges — the shape `sectionBounds` returns
 * — so the declaring document's own log sections are exempt in the same unit
 * the scan walks (review F3: a byte cursor here and a string-index range there
 * mis-align the exemption on every document carrying non-ASCII before `## Log`,
 * and a clean fold then fails its own declaration).
 */
function sweepCount(file, regex, skipRanges = []) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const skipped = (offset) => skipRanges.some(([start, end]) => offset >= start && offset < end);
  const hits = [];
  let fence = null;
  let offset = 0;
  let number = 0;
  while (offset <= text.length) {
    number += 1;
    const lineStart = offset;
    const eol = text.indexOf("\n", lineStart);
    const lineEnd = eol === -1 ? text.length : eol;
    const line = text.endsWith("\r", lineEnd) ? text.slice(lineStart, lineEnd - 1) : text.slice(lineStart, lineEnd);
    offset = lineEnd + 1;
    const run = /^\s*(`{3,}|~{3,})/.exec(line);
    if (run !== null) {
      if (fence === null) fence = run[1];
      else if (line.trim() !== "" && line.trim()[0] === fence[0] && line.trim().length >= fence.length) fence = null;
      if (eol === -1) break;
      continue;
    }
    if (fence === null && !skipped(lineStart) && regex.test(line)) hits.push(number);
    if (eol === -1) break;
  }
  return hits;
}

/** The declaring document's own log sections, as `sectionBounds` string-index
 *  ranges for `sweepCount` to exempt. */
function declaringLogRanges(text) {
  const ranges = [];
  for (const name of ["Log", "Progress log"]) {
    const bounds = sectionBounds(text, name);
    if (bounds !== null) ranges.push(bounds);
  }
  return ranges;
}

/** The sweep claims of one unit document. */
function sweepClaims(doc, claims) {
  const sections = [];
  for (const label of ["Log", "Progress log"]) {
    sections.push(...named(sectionsOf(doc), label));
  }
  for (const section of sections) {
    for (const row of section.body) {
      const line = SWEEP_LINE.exec(row.text);
      if (line === null) continue;
      const parsed = parseSweepDeclaration(line[1]);
      const claim = blankResult("sweep", doc.file, row.line, `swept: ${line[1].trim()}`);
      if (parsed !== null && parsed.refused !== undefined) {
        // Inside the grammar, outside the bounds: fail closed naming the bound
        // rather than compiling a pattern the gate cannot finish running.
        claim.outcome = "fail";
        claim.reason = "sweep-mismatch";
        claim.observed = `refused before it ran — ${parsed.refused}`;
        claims.push(claim);
        continue;
      }
      if (parsed === null) {
        claim.outcome = "fail";
        claim.reason = "unparseable-claim";
        claim.observed = "the declaration does not match `swept: /<pattern>/<flags> → expected <n> in <glob>` — the bounded scope is required";
        claims.push(claim);
        continue;
      }
      const files = sweepFiles(ROOT, parsed.glob);
      const hits = [];
      for (const file of files) {
        // The declaring document's own log sections are exempt (D1) — only when
        // scanning the declaring document itself, never a survivor surface.
        const skipRanges = file.relative === doc.file ? declaringLogRanges(doc.text) : [];
        const found = sweepCount(file.absolute, parsed.regex, skipRanges);
        for (const lineNumber of found ?? []) hits.push(`${file.relative}:${lineNumber}`);
      }
      claim.observed = `${hits.length} match${hits.length === 1 ? "" : "es"} (expected ${parsed.expected}) for ${parsed.display}; ${hits.length === 0 ? "no survivor" : `first: ${hits[0]}`}`;
      if (hits.length === parsed.expected) {
        claim.outcome = "pass";
      } else {
        claim.outcome = "fail";
        claim.reason = "sweep-mismatch";
      }
      claims.push(claim);
    }
  }
}

/** Claims from a unit document's Tasks / Obligations / Evidence surfaces. */
function unitDocClaims(doc, claims) {
  const tasks = parseUnitDocPhases(doc.text);
  for (const phase of tasks.phases) {
    const scan = phase.taskScan.join(" ");
    const bullet = new RegExp(`^\\s*[-*+]\\s*P${phase.number}\\s*[—-]`);
    const at = doc.lines.findIndex((text) => bullet.test(text));
    const line = at === -1 ? 0 : at + 1;
    const claim = validatorClaim(scan, doc.file, line);
    if (claim !== null) claims.push(claim);
  }

  const sections = sectionsOf(doc);
  for (const name of ["Obligations", "Evidence"]) {
    for (const section of named(sections, name)) {
      for (const row of section.body) {
        if (!row.text.trimStart().startsWith("|")) continue;
        const cells = row.text.split("|").map((cell) => cell.trim());
        if (cells.length < 3) continue;
        const claim = validatorClaim(row.text, doc.file, row.line);
        if (claim !== null) claims.push(claim);
      }
    }
  }

  // The fold's sweep declarations (unit 84 S2): every declared survivor grep
  // re-runs, fence-aware, and the observed count must reproduce.
  sweepClaims(doc, claims);

  // An `## Impact` that names a path is a claim that the path exists (or that
  // the unit's own plan declares creating it).
  const declared = new Set();
  for (const line of doc.lines) {
    if (!/^\s*-?\s*Relevant files:|^\s*created \|/.test(line)) continue;
    for (const match of line.matchAll(BACKTICK)) declared.add(match[1].trim());
    for (const token of line.split(/[,|\s]+/)) declared.add(token.trim());
  }
  for (const section of named(sections, "Impact")) {
    for (const row of section.body) {
      for (const match of row.text.matchAll(BACKTICK)) {
        const token = match[1].trim();
        if (!PATH_TOKEN.test(token)) continue;
        const claim = blankResult("surface", doc.file, row.line, token);
        const exists = fs.existsSync(path.join(ROOT, token));
        claim.observed = exists ? "present" : "absent";
        if (exists || declared.has(token)) {
          claim.outcome = "pass";
        } else {
          claim.outcome = "fail";
          claim.reason = "surface-missing";
          claims.push(claim);
        }
      }
    }
  }

  // Section-length claims in the acceptance criteria: a range is only a claim
  // when it names the file and the section it is about. An unanchored length
  // promise is the F55 defect and fails closed.
  for (const section of named(sections, "Acceptance criteria")) {
    for (const row of section.body) {
      const range = LENGTH_RANGE.exec(row.text);
      if (range === null) continue;
      const spans = [...row.text.matchAll(BACKTICK)].map((match) => match[1].trim());
      const target = spans.find((token) => PATH_TOKEN.test(token));
      const heading = spans.find((token) => /^#{2,3} .+/.test(token));
      const claim = blankResult("section-length", doc.file, row.line, row.text.trim());
      if (target === undefined || heading === undefined) {
        claim.outcome = "fail";
        claim.reason = "unparseable-claim";
        claim.observed = "the length claim names no file and ## section to measure";
        claims.push(claim);
        continue;
      }
      const measured = measureSection(path.join(ROOT, target), heading.replace(/^#+\s*/, ""));
      claim.observed = measured === null ? "section not found" : `${measured} lines`;
      if (measured !== null && measured >= Number(range[1]) && measured <= Number(range[2])) {
        claims.push(claim);
        claim.outcome = "pass";
        continue;
      }
      claim.outcome = "fail";
      claim.reason = "claim-mismatch";
      claims.push(claim);
    }
  }

  // A Non-goals bullet that denies scripts while the doc's own tasks name one
  // is the F56 contradiction: the plan ships what the boundary forbids.
  const nonGoals = named(sections, "Non-goals").flatMap((section) => section.body);
  const planned = doc.lines.filter((line) => CREATED_SCRIPT.test(line)).join("\n");
  for (const row of nonGoals) {
    if (!DENIES_SCRIPTS.test(row.text)) continue;
    const script = CREATED_SCRIPT.exec(planned);
    if (script === null) continue;
    if (row.text.includes(script[0])) continue;
    const claim = blankResult("contradiction", doc.file, row.line, row.text.trim());
    claim.observed = `the unit's tasks name ${script[0]}`;
    claim.outcome = "fail";
    claim.reason = "contradicts-plan";
    claims.push(claim);
  }
}

/** Sections whose heading opens with `label` (headings carry a subtitle). */
function named(sections, label) {
  const out = [];
  for (const [name, found] of sections) {
    if (name === label || name.startsWith(`${label} `)) out.push(...found);
  }
  return out;
}

/** Non-blank lines of a `## Section` in a file, or null when either is absent. */
function measureSection(absolute, name) {
  let text;
  try {
    text = fs.readFileSync(absolute, "utf8");
  } catch {
    return null;
  }
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${name}` || line.trim() === `### ${name}`);
  if (start === -1) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^## /.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).filter((line) => line.trim() !== "").length;
}

/* --------------------------------------------------------- manifest claims */

/** The per-skill measurements, owned by the context-budget checker. */
function measurements() {
  const run = spawnSync(process.execPath, [path.join(ROOT, "scripts/check-skill-context.mjs"), "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (run.status !== 0) return null;
  try {
    const parsed = JSON.parse(run.stdout);
    return new Map(parsed.skills.map((row) => [row.skill, row]));
  } catch {
    return null;
  }
}

/** Every backticked token in a narration, with the string it came from. */
function narrationSpans(value) {
  const out = [];
  for (const match of value.matchAll(BACKTICK)) out.push(match[1].trim());
  return out;
}

/** Collect the narration strings of one manifest entry, in document order. */
function narrationStrings(entry) {
  const out = [];
  for (const value of Object.values(entry)) {
    if (typeof value === "string") out.push(value);
    else if (value !== null && typeof value === "object") {
      for (const inner of Object.values(value)) if (typeof inner === "string") out.push(inner);
    }
  }
  return out;
}

/** Claims from `docs/workflow/SKILL_CONTEXT_BUDGETS.json`. */
function manifestClaims(doc, claims) {
  let manifest;
  try {
    manifest = JSON.parse(doc.text);
  } catch {
    claims.push({ ...blankResult("formula", doc.file, 1, "the manifest is not readable JSON"), outcome: "fail", reason: "unparseable-claim", observed: "JSON parse failed" });
    return;
  }
  const measured = measurements();
  for (const [skill, entry] of Object.entries(manifest.skills ?? {})) {
    const narrations = narrationStrings(entry);
    const joined = narrations.join("\n");
    const line = 1;

    // formula: arithmetic, and the declared ceiling must be a number the entry's
    // own narration derives.
    const computed = [...joined.matchAll(FORMULA)].map((match) => ({
      basis: Number(match[1]),
      ratio: Number(match[2]),
      value: Number(match[3]),
    }));
    for (const formula of computed) {
      const claim = blankResult("formula", doc.file, line, `ceil(${formula.basis} x ${formula.ratio}) = ${formula.value}`);
      const expected = exactCeil(formula.basis, formula.ratio);
      claim.observed = `${expected}`;
      if (expected !== formula.value) {
        claim.outcome = "fail";
        claim.reason = "formula-mismatch";
        claims.push(claim);
      }
    }
    // A re-basis sentence states the value it derives, so a declared ceiling must
    // be a value its own entry derives: an estimate ceiling from any formula the
    // entry carries, a line ceiling from a paired formula's smaller-basis half (a
    // re-basis always states `ceil(est x 1.10) = E / ceil(lines x 1.10) = L`).
    // The chain above the current value is history and stays derivable — this
    // catches a ceiling nobody derived (the F18/F26 class), not a superseded one.
    const derivedEstimates = new Set(computed.map((formula) => formula.value));
    const derivedLines = new Set();
    for (const narration of narrations) {
      for (const sentence of narration.matchAll(/ceiling[s]?\s*(?:re-?based\s+to\s*)?/g)) {
        const tail = narration.slice(sentence.index, sentence.index + 260);
        const pairs = [...tail.matchAll(/ceil\((\d+)\s*[x×*]\s*([0-9.]+)\s*\)\s*=\s*(\d+)/g)].slice(0, 2);
        if (pairs.length === 2) {
          const halves = pairs.map((match) => ({ basis: Number(match[1]), value: Number(match[3]) }));
          derivedLines.add(halves[0].basis >= halves[1].basis ? halves[1].value : halves[0].value);
        } else if (pairs.length === 1 && /line ceiling/i.test(tail)) {
          derivedLines.add(Number(pairs[0][3]));
        }
      }
    }
    for (const [key, ceiling] of Object.entries(entry)) {
      if (typeof ceiling !== "number") continue;
      let derived = null;
      if (/EstimateMax$/.test(key) && key !== "descriptionEstimateMax") derived = derivedEstimates;
      if (/LinesMax$/.test(key)) derived = derivedLines;
      if (derived === null || derived.size === 0) continue;
      const claim = blankResult("formula", doc.file, line, `${skill}.${key} = ${ceiling}`);
      claim.observed = `derived by the entry: ${derived.size === 0 ? "nothing" : [...derived].sort((a, b) => a - b).join(", ")}`;
      if (derived.has(ceiling)) {
        claims.push(claim);
        claim.outcome = "pass";
        continue;
      }
      claim.outcome = "fail";
      claim.reason = "formula-mismatch";
      claims.push(claim);
    }

    // measure: a `measured … est / … lines` claim is the basis a ceiling rests
    // on. Only one that says *at the head* is checkable — and then it must equal
    // the current measurement (`check-skill-context.mjs` owns the metric). Every
    // other basis is history, never a silent one: each prints a `skip:` line
    // naming the basis and the date it carries, so a stale narration is visible
    // without this pass pretending to re-derive the past (owner decision D1,
    // 2026-10-21: disclosure over strictness).
    for (const match of [...joined.matchAll(MEASURE)]) {
      if (match[2] === undefined) continue;
      const atHead = /at (?:the|this) (?:reviewed |final |shipped )?head/i.test(joined.slice(match.index, match.index + 200));
      const date = /\b(\d{4}-\d{2}-\d{2})\b/.exec(joined.slice(Math.max(0, match.index - 120), match.index + 200));
      const claim = blankResult("measure", doc.file, line, `measured ${match[1]} est / ${match[2]} lines (${skill})`);
      if (!atHead) {
        claim.skip = `historical basis${date ? ` dated ${date[1]}` : ""} — re-checked only when the narration claims it for the head`;
        claims.push(claim);
        continue;
      }
      const row = measured === null ? null : measured.get(skill);
      claim.observed = row === undefined || row === null
        ? "measurement unavailable"
        : `${row.mainEstimate} est / ${row.mainLines} lines`;
      if (row === undefined || row === null) {
        claim.skip = "the context-budget checker could not be read";
        claims.push(claim);
      } else if (row.mainEstimate === Number(match[1]) && row.mainLines === Number(match[2])) {
        claim.outcome = "pass";
        claims.push(claim);
      } else {
        claim.outcome = "fail";
        claim.reason = "measure-mismatch";
        claims.push(claim);
      }
    }

    // surface + removed-phrase, over the skill tree the entry is about.
    for (const narration of narrations) {
      for (const token of narrationSpans(narration)) {
        if (PATH_TOKEN.test(token)) {
          const claim = blankResult("surface", doc.file, line, token);
          const absolute = path.join(ROOT, token);
          if (fs.existsSync(absolute)) {
            claims.push(claim);
            claim.outcome = "pass";
            continue;
          }
          claim.observed = "absent";
          claim.outcome = "fail";
          claim.reason = "surface-missing";
          claims.push(claim);
          continue;
        }
        if (!REMOVAL.test(narration) || token === "" || token.length < 3) continue;
        if (/^[A-Za-z0-9_.-]+\.[a-z]+$/.test(token)) continue;
        const claim = blankResult("removed-phrase", doc.file, line, token);
        if (!fs.existsSync(path.join(ROOT, "skills", skill))) {
          claim.skip = "the narration names no skill tree to search";
          claims.push(claim);
          continue;
        }
        const found = grepTree(path.join(ROOT, "skills", skill), token);
        claim.observed = found === null ? "surface unreadable" : found.length === 0 ? "absent" : `present in ${found[0]}`;
        if (found === null) {
          claim.skip = "the narration's surface is unreadable";
          claims.push(claim);
          continue;
        }
        if (found.length > 0) {
          claim.outcome = "fail";
          claim.reason = "phrase-present";
          claims.push(claim);
        }
      }
    }
  }
}

/** Files under a directory whose text contains `phrase`; null when unreadable. */
function grepTree(directory, phrase, acc = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = grepTree(absolute, phrase, acc);
      if (nested === null) return null;
      continue;
    }
    if (!/\.(md|json|ya?ml)$/.test(entry.name)) continue;
    let text;
    try {
      text = fs.readFileSync(absolute, "utf8");
    } catch {
      return null;
    }
    if (text.includes(phrase)) acc.push(path.relative(ROOT, absolute));
  }
  return acc;
}

/* ------------------------------------------------------ Turn-contract claims */

/** Claims from every skill's Turn-contract fenced box. */
function turnContractClaims(doc, claims) {
  const sections = sectionsOf(doc);
  for (const section of named(sections, "Turn contract")) {
    // The fenced block that follows the heading, if any.
    const start = section.line - 1;
    let inFence = false;
    const box = [];
    for (let index = start + 1; index < doc.lines.length; index += 1) {
      const line = doc.lines[index];
      if (/^\s*(`{3,}|~{3,})/.test(line)) {
        if (!inFence) {
          inFence = true;
          continue;
        }
        break;
      }
      if (inFence) box.push({ line: index + 1, text: line });
    }
    if (box.length === 0) continue;
    const boxText = box.map((row) => row.text).join("\n");
    for (const match of boxText.matchAll(SCRIPT_INVOCATION)) {
      const script = match[1];
      const args = match[2].trim();
      const declared = PREREQUISITES.filter((entry) => entry.script === script);
      const placeholder = /<[A-Za-z0-9_-]+>/.exec(args);
      if (placeholder === null || declared.length === 0) continue;
      const rule = declared.find((entry) => entry.placeholder === placeholder[0]);
      if (rule === undefined) continue;
      const line = box[0].line;
      const claim = blankResult("prerequisite", doc.file, line, `${script} ${placeholder[0]} needs ${rule.artefacts.join(", ")}`);
      const named = rule.artefacts.every((artefact) => doc.text.includes(artefact));
      claim.observed = named ? "the skill names the required artifact" : `the skill never names ${rule.artefacts.join(", ")}`;
      if (named) {
        claims.push(claim);
        claim.outcome = "pass";
        continue;
      }
      claim.outcome = "fail";
      claim.reason = "undisclosed-prerequisite";
      claims.push(claim);
    }
  }
}

/* ------------------------------------------------------------ default set */

/** Unit folder → the doc, for the units the indexes still call in-flight. */
function inFlightUnitDocs() {
  const out = [];
  const roadmap = documentOf("docs/features/ROADMAP.md");
  if (roadmap !== null) {
    for (const line of roadmap.lines) {
      const row = /^\|\s*(\d+)\s*\|\s*`([a-z0-9-]+)`\s*\|\s*([^|]+)\|/.exec(line);
      if (row === null) continue;
      if (/done|discarded|superseded/i.test(row[3])) continue;
      out.push(`docs/features/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  const fixes = documentOf("docs/fix/README.md");
  if (fixes !== null) {
    for (const line of fixes.lines) {
      const row = /^\|\s*\[#(\d+)\]\([^)]*\)\s*\|\s*([a-z0-9-]+)\s*\|\s*`?([a-z-]+)`?/.exec(line);
      if (row === null) continue;
      if (/done/i.test(row[3])) continue;
      out.push(`docs/fix/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  // A plan that was never started is a plan, not a promise: its path list may
  // name a tree the unit has not created yet. In flight = the Progress log
  // carries a dated entry.
  return out.filter((file) => {
    const doc = documentOf(file);
    return doc !== null && /\d{4}-\d{2}-\d{2} \d{2}:\d{2} — /.test(doc.text);
  });
}

/** Every skill whose Turn contract carries a fenced box. */
function turnContractDocs() {
  let entries;
  try {
    entries = fs.readdirSync(path.join(ROOT, "skills"), { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skills/${entry.name}/SKILL.md`)
    .filter((file) => {
      const doc = documentOf(file);
      return doc !== null && /^## Turn contract/m.test(doc.text);
    });
}

/* --------------------------------------------------------------- the pass */

/**
 * Run every claim of every selected document.
 * @returns {{verdict: string, exitCode: number, lines: string[], claims: object[]}}
 */
export function coherence(paths) {
  const claims = [];
  const selected = paths.length === 0
    ? [...inFlightUnitDocs(), "docs/workflow/SKILL_CONTEXT_BUDGETS.json", ...turnContractDocs()]
    : paths;

  for (const file of selected) {
    const doc = documentOf(file);
    if (doc === null) {
      claims.push({ ...blankResult("validator", file, 0, file), outcome: "fail", reason: "missing-document", observed: "unreadable" });
      continue;
    }
    // Dispatch by shape, not by path: an explicit path may be any manifest or
    // any skill document, and a fixture is never named like the shipped file.
    const trimmed = doc.text.trimStart();
    if (/^\{/.test(trimmed)) manifestClaims(doc, claims);
    else if (/^---\n/.test(doc.text) && /^## Turn contract/m.test(doc.text)) turnContractClaims(doc, claims);
    else unitDocClaims(doc, claims);
  }

  const failures = claims.filter((claim) => claim.outcome === "fail");
  const skipped = claims.filter((claim) => claim.skip !== null);
  const passed = claims.filter((claim) => claim.outcome === "pass");

  const lines = [];
  for (const failure of failures) {
    lines.push(`Promise-coherence: ${failure.kind} ${failure.file}:${failure.line}`);
    lines.push(`  claim: ${failure.claim}`);
    lines.push(`  observed: ${sanitize(failure.observed ?? "", 200)}`);
  }
  if (paths.length === 0) {
    lines.push(`skip: closed units are append-only evidence — not scanned (${inFlightUnitDocs().length} in-flight documents checked)`);
  }
  for (const claim of skipped) {
    // The claim text rides every skip line: a disclosed gap that does not name
    // what was not checked is disclosure in form only.
    lines.push(`skip: ${claim.file}:${claim.line} ${claim.kind} ${claim.claim} — ${claim.skip}`);
  }
  // Fail closed on a document nothing was extracted from: "no claim found" is
  // never a pass, or a document could opt out of the pass by having no grammar.
  const reason = failures.length > 0
    ? failures[0].reason
    : claims.length === 0 ? "no-claims" : null;
  lines.push(reason === null ? "verdict PASS" : `verdict BLOCKED: ${reason}`);
  // A document that named claims but had none machine-checked is a green that
  // examined nothing (review F12). The bounded runner class makes that rare;
  // the tally still has to say it out loud when it happens, because a line
  // reading `0 checked` and nothing else is how a vacuous pass hides.
  const checkedTotal = passed.length + failures.length;
  lines.push(
    checkedTotal === 0 && skipped.length > 0
      ? `claims: 0 checked · ${skipped.length} skipped — nothing was machine-checked`
      : `claims: ${checkedTotal} checked · ${skipped.length} skipped`,
  );

  return {
    verdict: reason === null ? "PASS" : `BLOCKED: ${reason}`,
    exitCode: reason === null ? 0 : 1,
    lines,
    claims,
  };
}

/** CLI: zero or more explicit paths. */
function main(argv) {
  return coherence(argv);
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  const result = main(process.argv.slice(2));
  process.stdout.on("error", (error) => {
    if (error && error.code === "EPIPE") return;
    throw error;
  });
  process.stdout.write(`${result.lines.join("\n")}\n`);
  process.exitCode = result.exitCode;
}
