#!/usr/bin/env node

/**
 * test-impact.mjs — which tests can THIS change affect? (issue #356, S4)
 *
 * The rule "do tests before implementation" prescribes a procedure without
 * context: TDD instructions with no impact map measured a *worse* test-level
 * regression rate than no instructions at all, while TDD plus an impact map cut
 * it by 70% (arXiv 2603.17973, SWE-bench Verified). This answers the missing
 * question deterministically, so a phase's test set is derived instead of
 * guessed — and so a change that can affect no test says so instead of running
 * a ceremony it does not need.
 *
 * Four static sources, unioned and sorted:
 *
 *   symbol    the identifiers the change touches, resolved to the committed
 *             test files that reference them (`rg`, falling back to `grep`)
 *   path      a test that names the changed file's own path, which is how a
 *             spawn-based suite refers to what it exercises
 *   sibling   the suite named after the changed file, in its own directory (a
 *             pair belongs to its implementation by construction)
 *   lsp       the caller's own LSP resolution (`find_referencing_symbols`),
 *             handed in as `--references <file>` — this script never boots a
 *             server, so the preferred tier is an input
 *
 * Verdicts: `targeted` (an executable path changed) or `empty` (only prose and
 * assets changed — record the verdict, run no ceremony, invent no test). The
 * tier travels in its own field and a degradation prints its own line, so "how
 * it searched" never masquerades as "what it found".
 *
 * Fail closed, never wide: no path in scope, no matcher installed, an unknown
 * flag, a bare `--base`, a `--paths` entry that exists nowhere and a
 * `--references` entry that does not exist all exit 1. The one thing this never
 * does is answer `empty` because it could not look.
 *
 * Usage
 *   bun scripts/test-impact.mjs --base <rev> [--paths <p>…] [--references <file>]
 *   bun scripts/test-impact.mjs --paths <p>… [--references <file>]
 *
 * Read-only: it writes nothing outside a `mktemp -d` scratch file it removes on
 * exit, calls no network, has no dependency, and holds no state between runs.
 * Exit: 0 a verdict was printed; 1 a refusal.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

/**
 * Extensions with no executable effect. Everything else is `executable` — the
 * fail-closed direction, because a data or config file a test reads can move
 * behaviour, while a rendered document cannot.
 */
const INERT_EXTENSIONS = new Set([
  ".md", ".mdx", ".markdown", ".mdoc", ".txt", ".rst", ".adoc", ".asciidoc",
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".bmp", ".tiff", ".avif",
  ".pdf", ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp4", ".webm", ".mov", ".mp3", ".wav", ".ogg", ".flac",
]);

/**
 * The test-file conventions this hint reads (PE-010 owns the row). A project
 * naming its tests differently gets `no candidate test file matched` and falls
 * back to its own gate — the hint never guesses a wider set.
 */
const TEST_FILE_PATTERNS = [
  /\.(test|spec)\.[A-Za-z0-9]+$/,          // x.test.mjs · x.spec.ts
  /(^|\/)test_[^/]+$/,                     // test_x.py
  /_(test|spec)\.[A-Za-z0-9]+$/,           // x_test.go · x_spec.rb
  /(Test|Tests|IT)\.[A-Za-z0-9]+$/,        // FooTest.java · FooTests.cs
  /(^|\/)(tests?|__tests__|spec)\//,       // tests/x.py
];

/** Directories never scanned for candidate suites: build output and dependencies. */
const SKIP_DIRECTORIES = new Set([
  ".git", "node_modules", "dist", "build", "coverage", "out", "target", "vendor",
  ".venv", "venv", "__pycache__", ".next", ".nuxt", ".cache", "cache", ".serena",
]);

/**
 * The declaration shapes the symbol tier reads. Every pattern is anchored at the
 * beginning of a line — a declaration *starts* a statement — which is what keeps
 * a fixture that writes `export function add()` inside a string from being read
 * as a declaration of the file containing it.
 *
 * Two readings, because a language without a visibility keyword exposes its
 * module surface by position while one with a keyword exposes it by the keyword:
 * `MARKED_PATTERNS` are the declarations another file can reference (the reading
 * a module language gets), `DECLARATION_PATTERNS` additionally read the
 * positional forms (`def`/`fn`/`func`/`class`/`module`) a Python/Ruby/Go-style
 * file exposes without any marker.
 */
const MARKED_PATTERNS = [
  /^\s*export\s+(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
  /^\s*export\s+(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
  /^\s*export\s+(?:const|let|var)\s+([A-Za-z_$][\w$]*)/,
  /^\s*export\s+(?:interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
  /^\s*pub(?:\([^)]*\))?\s+(?:async\s+)?fn\s+([A-Za-z_]\w*)/,
  /^\s*pub(?:\([^)]*\))?\s+(?:struct|enum|trait|mod)\s+([A-Za-z_]\w*)/,
  /^\s*public\s+(?:static\s+)?(?:final\s+)?(?:class|struct|interface|enum|record)\s+([A-Za-z_]\w*)/,
  /^\s*public\s+(?:static\s+)?[\w<>\[\],.\s]+?\s+([A-Za-z_]\w*)\s*\(/,
];

const POSITIONAL_PATTERNS = [
  /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)/,
  /^\s*(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/,
  /^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/,
  /^\s*(?:export\s+)?(?:interface|type|enum)\s+([A-Za-z_$][\w$]*)/,
  /^\s*def\s+(?:self\.)?([A-Za-z_]\w*[?!]?)/,
  /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)/,
  /^\s*func\s+(?:\([^)]*\)\s*)?([A-Za-z_]\w*)/,
  /^\s*(?:public|private|protected|internal)\s+(?:static\s+)?(?:final\s+)?(?:class|struct|interface|enum|record)\s+([A-Za-z_]\w*)/,
  /^\s*module\s+([A-Z]\w*)/,
];

const DECLARATION_PATTERNS = [...MARKED_PATTERNS, ...POSITIONAL_PATTERNS];

/**
 * Extensions whose module surface is the *marked* one. A `.mjs`/`.ts` file
 * exposes what it exports, so an unmarked local declaration is not a symbol any
 * other file can reference — reading it would surface every suite that happens
 * to use a local named `entry` or `value`.
 */
const MARKED_FAMILIES = new Set([
  ".mjs", ".cjs", ".js", ".jsx", ".ts", ".tsx", ".mts", ".cts",
  ".rs", ".java", ".kt", ".kts", ".cs", ".scala", ".swift", ".dart", ".php",
]);

/** The patterns a file of this extension is read with. */
function declarationPatterns(extension) {
  return MARKED_FAMILIES.has(extension) ? MARKED_PATTERNS : DECLARATION_PATTERNS;
}

/** A declaration name shorter than this carries no targeting signal. */
const MIN_SYMBOL_LENGTH = 3;

const MATCHERS = ["rg", "grep"];

/** `TEST IMPACT — error` plus the reason, on stderr; every refusal exits 1. */
function refuse(reason) {
  process.stderr.write(`TEST IMPACT — error\n${reason}\n`);
  process.exit(1);
}

const normalize = (value) => value.replace(/\\/g, "/").replace(/^\.\//, "");

/** The path's classification: `inert` for prose and assets, `executable` otherwise. */
export function classifyPath(relativePath) {
  const extension = path.posix.extname(normalize(relativePath)).toLowerCase();
  return INERT_EXTENSIONS.has(extension) ? "inert" : "executable";
}

/** Whether a path belongs to the test corpus by one of the declared conventions. */
export function isTestFile(relativePath) {
  const normalized = normalize(relativePath);
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

/**
 * Every identifier the given text declares, deduplicated and sorted. The
 * optional `extension` selects the reading: a module language is read for its
 * marked surface (`MARKED_PATTERNS`), a positional one for both.
 */
export function symbolsIn(text, extension = "") {
  const found = new Set();
  const patterns = extension ? declarationPatterns(extension.toLowerCase()) : DECLARATION_PATTERNS;
  for (const line of text.split("\n")) {
    for (const pattern of patterns) {
      const match = pattern.exec(line);
      if (!match) continue;
      const name = match[1];
      if (name && name.length >= MIN_SYMBOL_LENGTH) found.add(name);
    }
  }
  return [...found].sort();
}

/** The first directory on `envPath` carrying an executable named `name`. */
function which(name, envPath) {
  for (const directory of (envPath ?? "").split(path.delimiter).filter(Boolean)) {
    try {
      fs.accessSync(path.join(directory, name), fs.constants.X_OK);
      return path.join(directory, name);
    } catch {
      continue;
    }
  }
  return null;
}

/** The matcher this machine offers, in the declared order of preference. */
function resolveMatcher(envPath) {
  for (const name of MATCHERS) {
    const binary = which(name, envPath);
    if (binary) return { name, binary };
  }
  return null;
}

/** Every candidate test file under `root`, in sorted repo-relative form. */
function candidateTestFiles(root) {
  const found = [];
  const walk = (directory) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRECTORIES.has(entry.name)) walk(absolute);
        continue;
      }
      if (!entry.isFile()) continue;
      const relative = normalize(path.relative(root, absolute));
      if (isTestFile(relative)) found.push(relative);
    }
  };
  walk(root);
  return found.sort();
}

/**
 * The test files that reference any of `symbols`, through one matcher. Returns
 * `null` when the matcher failed for a reason other than "no match" — a refused
 * search is never an empty answer.
 */
function suitesReferencing(matcher, symbols, candidates, root) {
  if (symbols.length === 0 || candidates.length === 0) return [];
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "test-impact-"));
  try {
    const patternsFile = path.join(scratch, "patterns.txt");
    fs.writeFileSync(patternsFile, `${symbols.join("\n")}\n`);
    const found = new Set();
    const CHUNK = 400;
    for (let index = 0; index < candidates.length; index += CHUNK) {
      const chunk = candidates.slice(index, index + CHUNK);
      const result = spawnSync(matcher.binary, ["-l", "-w", "-F", "-f", patternsFile, "--", ...chunk], {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
      if (result.status === 1) continue; // no match in this chunk
      if (result.status !== 0) return null;
      for (const line of (result.stdout ?? "").split("\n")) {
        const trimmed = line.trim();
        if (trimmed) found.add(normalize(trimmed));
      }
    }
    return [...found].sort();
  } finally {
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

/** The `--base` scope: the changed paths and the symbols on the changed lines. */
function diffScope(root, base) {
  const names = spawnSync("git", ["-C", root, "diff", "--name-only", "--no-color", base], { encoding: "utf8" });
  if (names.error || names.status !== 0) return null;
  const paths = names.stdout.split("\n").map((line) => line.trim()).filter(Boolean).map(normalize);

  const diff = spawnSync("git", ["-C", root, "diff", "-U0", "--no-color", base], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (diff.error || diff.status !== 0) return null;

  const symbols = new Map();
  let current = null;
  for (const line of diff.stdout.split("\n")) {
    if (line.startsWith("diff --git ")) {
      const match = /^diff --git a\/.* b\/(.*)$/.exec(line);
      current = match ? normalize(match[1]) : null;
      if (current && !symbols.has(current)) symbols.set(current, new Set());
      continue;
    }
    if (!current) continue;
    if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) continue;
    if (!line.startsWith("+") && !line.startsWith("-")) continue;
    const declared = symbolsIn(line.slice(1), path.posix.extname(current).toLowerCase());
    for (const name of declared) symbols.get(current).add(name);
  }
  return { paths, symbols };
}

/** The suite named after `relativePath`, in its own directory. */
function siblingSuites(relativePath, candidates) {
  const directory = path.posix.dirname(normalize(relativePath));
  const base = path.posix.basename(normalize(relativePath));
  const dot = base.lastIndexOf(".");
  const stem = dot > 0 ? base.slice(0, dot) : base;
  return candidates.filter((candidate) => {
    if (candidate === normalize(relativePath)) return false;
    if (path.posix.dirname(candidate) !== directory) return false;
    return testStem(candidate) === stem;
  });
}

/** The basename of a test file with its test marker and extension removed. */
function testStem(candidate) {
  const base = path.posix.basename(candidate);
  const prefixed = /^test_(.+)\.[A-Za-z0-9]+$/.exec(base);
  if (prefixed) return prefixed[1];
  return base
    .replace(/\.(test|spec)\.[A-Za-z0-9]+$/, "")
    .replace(/_(test|spec)\.[A-Za-z0-9]+$/, "")
    .replace(/(?:Test|Tests|IT)\.[A-Za-z0-9]+$/, "");
}

/**
 * The languages the repository's committed Serena config declares, or `null`
 * when it declares none. Read as a probe only: the config is the shipped
 * convention's file, never a client this script starts.
 */
function declaredLanguages(root) {
  const candidates = [".serena/project.yml", ".serena/project.yaml"];
  const file = candidates.find((candidate) => fs.existsSync(path.join(root, candidate)));
  if (!file) return null;
  let text;
  try {
    text = fs.readFileSync(path.join(root, file), "utf8");
  } catch {
    return null;
  }
  const block = /^\s*language_servers:\s*$([\s\S]*?)(?:^\S|\Z)/m.exec(text);
  if (!block) {
    const inline = /^\s*language_servers:\s*\[([^\]]*)\]/m.exec(text);
    if (!inline) return null;
    const listed = inline[1].split(",").map((entry) => entry.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    return listed.length > 0 ? listed.sort() : null;
  }
  const listed = [...block[1].matchAll(/^\s*-\s*["']?([A-Za-z0-9_]+)["']?\s*$/gm)].map((match) => match[1]);
  return listed.length > 0 ? listed.sort() : null;
}

/** `--paths` accepts `a b` and `a,b`; `--references` takes one file. */
function parseArgs(argv) {
  const options = { paths: [], base: null, references: null, help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help" || argument === "-h") {
      options.help = true;
      continue;
    }
    if (argument === "--base") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) refuse("--base requires a revision");
      options.base = value;
      index += 1;
      continue;
    }
    if (argument === "--references") {
      const value = argv[index + 1];
      if (!value || value.startsWith("-")) refuse("--references requires a file");
      options.references = value;
      index += 1;
      continue;
    }
    if (argument === "--paths") {
      let consumed = 0;
      for (let next = index + 1; next < argv.length && !argv[next].startsWith("-"); next += 1) {
        options.paths.push(...argv[next].split(",").map((entry) => entry.trim()).filter(Boolean));
        consumed += 1;
      }
      if (consumed === 0) refuse("--paths requires at least one path");
      index += consumed;
      continue;
    }
    if (argument.startsWith("-")) refuse(`unknown argument: ${argument}`);
    options.paths.push(...argument.split(",").map((entry) => entry.trim()).filter(Boolean));
  }
  return options;
}

const USAGE = `usage: bun scripts/test-impact.mjs --base <rev> [--paths <p>…] [--references <file>]
       bun scripts/test-impact.mjs --paths <p>… [--references <file>]

Prints the tests a change can affect: the touched symbols resolved to the test
files that reference them, the suite beside each changed file, and any
LSP-resolved references the caller supplies. A prose-only change answers
\`empty\`. An unmatched code change names the project gate as the fallback.
Fail closed: no path in scope, no matcher, or a missing input exits 1.
`;

function printBlock({ verdict, tier, changed, executable, suites, symbols, sources, reason, fallback, lsp }) {
  const lines = [
    `TEST IMPACT — ${verdict}`,
    `verdict: ${verdict}`,
    `tier: ${tier}`,
    `changed: ${changed}`,
    `executable: ${executable}`,
    `suites (${suites.length}):`,
    ...suites.map((suite) => `  ${suite}`),
    `symbols:${symbols.length > 0 ? ` ${symbols.join(", ")}` : ""}`,
    ...(sources.length > 0 ? [`sources: ${sources.join(", ")}`] : []),
    `reason: ${reason}`,
    ...(fallback ? [`fallback: ${fallback}`] : []),
    ...(lsp ? [`lsp: ${lsp}`] : []),
  ];
  process.stdout.write(`${lines.join("\n")}\n`);
}

function main(argv) {
  const options = parseArgs(argv);
  if (options.help) {
    process.stdout.write(USAGE);
    return;
  }

  const root = process.cwd();
  const references = [];
  if (options.references) {
    const file = path.resolve(root, options.references);
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch {
      refuse(`--references is unreadable: ${options.references}`);
    }
    for (const line of text.split("\n")) {
      const entry = normalize(line.trim());
      if (!entry || entry.startsWith("#")) continue;
      if (!fs.existsSync(path.join(root, entry))) refuse(`--references entry does not exist: ${entry}`);
      references.push(entry);
    }
    if (references.length === 0) refuse(`--references names no path: ${options.references}`);
  }

  let paths = [...new Set(options.paths.map(normalize))].sort();
  let hunkSymbols = new Map();
  if (options.base) {
    const scope = diffScope(root, options.base);
    if (!scope) refuse(`--base is not a revision this repository can diff: ${options.base}`);
    hunkSymbols = scope.symbols;
    const requested = paths.length > 0;
    paths = requested ? paths.filter((candidate) => scope.paths.includes(candidate)) : [...scope.paths].sort();
    if (requested && paths.length === 0) refuse(`--base ${options.base} and --paths name no common path`);
  } else {
    for (const candidate of paths) {
      if (!fs.existsSync(path.join(root, candidate))) refuse(`--paths entry does not exist: ${candidate}`);
    }
  }
  if (paths.length === 0) {
    refuse("no path in scope: pass --paths <path…> or --base <rev> with a non-empty diff");
  }

  const executablePaths = paths.filter((candidate) => classifyPath(candidate) === "executable");
  const matcher = resolveMatcher(process.env.PATH);
  const languages = references.length > 0 ? null : declaredLanguages(root);
  const lspNote = languages
    ? `available (${languages.join(", ")}) — pass --references with find_referencing_symbols results`
    : null;

  if (executablePaths.length === 0) {
    printBlock({
      verdict: "empty",
      tier: references.length > 0 ? "lsp" : matcher?.name ?? "none",
      changed: paths.length,
      executable: 0,
      suites: [...new Set(references)].sort(),
      symbols: [],
      sources: references.length > 0 ? ["lsp"] : [],
      reason: "no executable path changed — record this verdict, run no TDD ceremony, invent no test",
      fallback: null,
      lsp: lspNote,
    });
    return;
  }

  if (!matcher) {
    refuse(
      "neither rg nor grep is on PATH — the symbol-to-test hint cannot run. Install one, or resolve the set another way; this never answers an empty impact set.",
    );
  }

  const candidates = candidateTestFiles(root);
  const symbols = new Set();
  const suites = new Set();
  const sources = new Set();

  for (const candidate of executablePaths) {
    const touched = hunkSymbols.has(candidate)
      ? [...hunkSymbols.get(candidate)]
      : (() => {
          try {
            return symbolsIn(fs.readFileSync(path.join(root, candidate), "utf8"), path.posix.extname(candidate).toLowerCase());
          } catch {
            return [];
          }
        })();
    for (const name of touched) symbols.add(name);

    const siblings = siblingSuites(candidate, candidates);
    for (const suite of siblings) {
      suites.add(suite);
      sources.add("sibling");
    }
  }

  const searchFailed = () => refuse(
    `the ${matcher.name} symbol-to-test search failed (non-zero exit that is not "no match") — a refused search is not an empty impact set`,
  );

  const orderedSymbols = [...symbols].sort();
  const bySymbol = suitesReferencing(matcher, orderedSymbols, candidates, root);
  if (bySymbol === null) searchFailed();
  for (const suite of bySymbol) {
    suites.add(suite);
    sources.add("symbol");
  }

  // A suite that names the changed file's own path is affected even when it
  // imports nothing from it — the spawn-based style most suites here use.
  const byPath = suitesReferencing(matcher, executablePaths, candidates, root);
  if (byPath === null) searchFailed();
  for (const suite of byPath) {
    suites.add(suite);
    sources.add("path");
  }
  for (const reference of references) {
    suites.add(reference);
    sources.add("lsp");
  }

  const orderedSuites = [...suites].sort();
  const degraded = matcher.name !== "rg"
    ? `rg absent — the symbol-to-test hint ran under ${matcher.name} (same answer, slower)`
    : null;
  const reason = orderedSuites.length > 0
    ? `${executablePaths.length} executable path(s), ${orderedSymbols.length} symbol(s), ${orderedSuites.length} suite(s) from ${[...sources].sort().join(", ")}`
    : `no suite matched the ${orderedSymbols.length} touched symbol(s) — fall back to the project gate for ${executablePaths.join(", ")}`;

  printBlock({
    verdict: "targeted",
    tier: references.length > 0 ? "lsp" : matcher.name,
    changed: paths.length,
    executable: executablePaths.length,
    suites: orderedSuites,
    symbols: orderedSymbols,
    sources: [...sources].sort(),
    reason,
    fallback: degraded,
    lsp: lspNote,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
