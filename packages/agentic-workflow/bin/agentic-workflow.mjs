#!/usr/bin/env node
/**
 * agentic-workflow — CLI router for agentic-workflow typed file services.
 *
 * Usage:
 *   agentic-workflow unit-doc <NN-slug> [--dir <root>] <op> [args...]
 *   agentic-workflow roadmap <op> [args...]
 *   agentic-workflow changelog <op> [args...]
 *   agentic-workflow budgets <op> [args...]
 *   agentic-workflow manifest <op> [args...]
 *   agentic-workflow doc (--sync | --query <term> | --status | --rebuild) [--json-only]
 *   agentic-workflow section <locate|remove|replace> --file <path|-> --selector <json> [--replacement <path|->] [--write] [--json]
 *   agentic-workflow memory probe [--json]
 *   agentic-workflow log render --facts <path|-> [--raw]
 *   agentic-workflow journal aggregate [--dir <root>] [--journal-dir <p>] [--log <p>] [--check] [--json]
 *   agentic-workflow journal write --kind <mechanical|narrative> [fields] [--session <id>]
 *   agentic-workflow journal name --kind <mechanical|narrative> [--dir <root>] [--branch <b>] [--session <id>]
 *   agentic-workflow relay <check|budget|tiers|obligations> <unit> [--repo <dir>] [--packet <dir>]
 *   agentic-workflow resolve-passes [--global <path>] [--project <path>] [--command <name>]
 *   agentic-workflow verify <unit-doc-path>
 *
 * --json prints the operation receipt as JSON.
 * Every operation prints a fixed receipt block to stdout.
 *
 * Refusals exit 2 with "EDIT REFUSAL — <reason>" before writing anything.
 *
 * `memory probe` is a sensor, not an editor: it writes nothing and always
 * exits 0. Its `degraded` verdict is an answer to report, never a failure
 * that blocks the caller (feature 66, AC2).
 *
 * `section` (issue #407) is the AST-based section/range locator over one
 * document: `locate` prints the range receipt, `remove`/`replace` print the
 * transformed document (or persist it with `--write`), and a selector that
 * resolves to nothing or to several sections is a refusal (exit 2).
 *
 * `relay` (unit 82) is the lane's offline half of pi-web's Relay packet
 * contract: `check` validates the packet, `budget` measures the leg handover
 * against the declared ceiling, `tiers` reads each leg's tier from the catalog
 * and `obligations` verifies the unit's obligations ledger is closed. It is the
 * same module `scripts/relay-packet.mjs` runs, so a project that carries only
 * the crate gets the identical block. Read-only: it writes nothing.
 *
 * `verify` (issue #260) is the document verifier — non-negotiable #2's tool,
 * distinct from the `edit` writer CLI: it reads one unit document against the
 * frozen schemas (required sections per accepted shape, evidence columns,
 * progress entries, log kind tokens, the obligations ledger closed) and the
 * receipt marks (`REVIEW-RAN`/`GATE-RAN`/`R`/`G` lines must name a commit that
 * exists in the containing repo — a mark produced as plausible text is a
 * refusal, never a pass). Read-only: it writes nothing. Clean → exit 0 with
 * the `verify@1` receipt; a violation → exit 2 and
 * `VERIFY REFUSAL — <violations>` on stderr.
 *
 * `resolve-passes` (issue #201) is the spawned-pass model resolution: it reads
 * the two routing config files (global, then project — the project file wins
 * per entry and per key) and prints the `resolve-passes@1` JSON table for
 * every published pass name, with the fail-closed chain applied in code —
 * `passes.<name>` → `passes.default` → the configured cheap tier
 * (`commands.execute-phase`) → the inline floor at the orchestrator's model,
 * recorded with a reason. A malformed selected route is a refusal (exit 2,
 * `PASSES REFUSAL — <reason>`), never a silent fallback. Read-only: it writes
 * nothing.
 *
 * `log render` (feature #394) is a pure renderer with no session behind it: it
 * reads a `log-facts@1` payload and prints the journal entry, so a human, a test
 * or a CI job can regenerate an entry and byte-diff it. It writes nothing, prints
 * JSON on stdout (the entry alone with `--raw`), and refuses a malformed payload
 * with exit 2 and "LOG REFUSAL — <reason>".
 *
 * `journal` (issue #405) is the session-log fragment carrier's CLI, forge-free
 * by contract (AC5): `aggregate` appends the pending fragments under
 * `.agentic-workflow/journal/` to `docs/LOGS.md` newest-first (ties: branch,
 * kind, session ascending), deletes the consumed fragments and refuses anything
 * ambiguous with exit 2 and "JOURNAL REFUSAL — <reason>" — re-running on an
 * aggregated set is a no-op. `aggregate --check` is the same validation as a
 * read-only lint: it lists every non-conforming entry and moves no byte (issue
 * #452 S3). `write` is the programmatic writer (issue #452 S1): the caller
 * supplies prose fields or a rendered block on stdin, and the name, timestamp,
 * branch and bytes are computed — a caller never composes a filename. `name`
 * prints the deterministic fragment name for a reader, never writing anything.
 * The example GitHub workflow and the documented `post-receive` hook both call
 * `journal aggregate` unchanged.
 */

import { readFileSync, existsSync, writeFileSync, renameSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, basename, dirname } from "node:path";

// Import SDK modules
import { create, setSection, evidence_addRow, progress_logEntry, validate } from "../src/edit/UnitDoc.mjs";
import { rowUpsert, annotate as roadmapAnnotate, checkUnitDoc, ROADMAP_CHECK_CODES } from "../src/edit/Roadmap.mjs";
import {
  FIX_INDEX_DOCUMENT,
  ROADMAP_DOCUMENT,
  ROADMAP_FIXES_HEADING,
  RoadmapMovedError,
  resolveRoadmapSource,
  roadmapSection,
} from "../src/index-document.mjs";
import { rowAdd } from "../src/edit/Changelog.mjs";
import { ceilingRebase } from "../src/edit/Budgets.mjs";
import { skillAdd, skillRemove } from "../src/edit/Manifest.mjs";
import { parseDocArgs } from "../src/doc/grammar.mjs";
import { runDocOp } from "../src/doc/retrieval.mjs";
import { relativeDocPath, resolveSectionRef } from "../src/doc/docops.mjs";
import { parseSectionArgs } from "../src/doc/section-grammar.mjs";
import {
  SectionLocatorError,
  locate as locateSection,
  remove as removeSection,
  replace as replaceSection,
} from "../src/doc/section-locator.mjs";
import { runProbe } from "../src/memory/probe.mjs";
import { renderReceipt } from "../src/log/render.mjs";
import { JournalAggregateError, aggregateJournal, checkJournal } from "../src/journal/aggregate.mjs";
import { FragmentError, JOURNAL_DIR, fragmentName } from "../src/journal/fragment.mjs";
import { JournalWriteError, WRITE_REFUSALS, parseWriteArgs, writeJournal } from "../src/journal/write.mjs";
import { spawnSync } from "node:child_process";
import { RelayUsageError, parseRelayArgs, runRelayMode } from "../src/relay/Packet.mjs";
import { resolvePasses, PassesError, DEFAULT_REVIEW_COMMAND } from "../src/passes/resolve.mjs";
import { detectHost, ResourcesError, RESOURCES_DETECT_CONTRACT_ID } from "../src/resources/detect.mjs";
import { admitTrial, ADMIT_CONTRACT_ID } from "../src/resources/admit.mjs";
import { verifyUnitDoc, VERIFY_CONTRACT_ID } from "../src/verify/Verify.mjs";

// ── Helpers ──────────────────────────────────────────────────────────────

function printReceipt(receipt) {
  console.log("");
  console.log(`EDIT ${receipt.service}.${receipt.op} — ${receipt.path}`);
  console.log(`Schema: ${receipt.schema} · Receipt: ${receipt.ok ? "pass" : "fail"}`);
  console.log(`Before: ${receipt.before} · After: ${receipt.after}`);
}

function parseArgs(args) {
  const result = {};
  const positions = [];
  let i = 0;
  while (i < args.length) {
    if (args[i] === "--json") {
      result.json = true;
      i++;
    } else if (args[i] === "--raw") {
      result.raw = true;
      i++;
    } else if (args[i] === "--dir") {
      result.dir = args[i + 1];
      i += 2;
    } else if (args[i] === "--facts") {
      result.facts = args[i + 1];
      i += 2;
    } else {
      positions.push(args[i]);
      i++;
    }
  }
  result.args = positions;
  return result;
}

function refuse(reason) {
  process.stderr.write(`EDIT REFUSAL — ${reason}\n`);
  process.exit(2);
}

/** A refusal with a non-EDIT prefix (the read-only sensors refuse with their
 *  own vocabulary, e.g. `PASSES REFUSAL`). */
function sensorRefuse(prefix, reason) {
  process.stderr.write(`${prefix} REFUSAL — ${reason}\n`);
  process.exit(2);
}

/** The 8-hex digest the receipt blocks report. */
function digest(text) {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 8);
}

/**
 * A `log` refusal: the renderer writes nothing, so the line says what it is and
 * the receipt still reaches stdout — a machine caller parses the JSON, not the
 * message. Exit 2, the crate's refusal code.
 */
function logRefuse(reason, receipt) {
  process.stderr.write(`LOG REFUSAL — ${reason}\n`);
  if (receipt) process.stdout.write(`${JSON.stringify(receipt)}\n`);
  process.exit(2);
}

const RELAY_USAGE = `usage: agentic-workflow relay <check|budget|tiers|obligations> <unit> [--repo <dir>] [--packet <dir>]
  check        validate the packet: documents, charter pointer, baton grammar, verdict grammar
  budget       measure the leg handover (charter + baton) against the declared ceiling
  tiers        print each leg's tier from scripts/catalog.json
  obligations  verify the unit's obligations ledger is closed
  <unit>       an NN-slug unit token, or a unit directory path
  --repo       read the workspace from this directory (default: this project)
  --packet     read the packet from this directory instead of .pi-web/relays/<slug>
`;

/**
 * Walk up from a unit doc to the repo root until the default index exists; null
 * when no ancestor carries it.
 */
/** Strip the docs root from a published index path (`docs/X/Y.md` → `X/Y.md`). */
function relativeToDocs(index) {
  return index.replace(/^docs\//, "");
}

/**
 * The index this tree carries, resolved by the shared reader so the documented
 * rollback lever applies here exactly as it does everywhere else: the reader
 * decides which path is readable, and a tree that carries only the pre-move
 * path while the window is closed is refused with its pointer at the new home.
 * Returns `{ direct, index }`: the path a caller passed explicitly (never
 * resolved through the tree) and the walked-up index path.
 *
 * @param {string} docPath — the unit doc the walk starts from
 * @param {string|undefined} direct — `--roadmap`/`--index`, already read
 */
function resolveIndex(docPath, direct) {
  if (direct !== undefined) return { direct: resolve(direct), index: null };
  const source = resolveRoadmapSource({ exists: (relative) => findUpIndex(docPath, relative) !== null });
  return { direct: null, index: source === null ? null : findUpIndex(docPath, source.path) };
}

function findUpIndex(docPath, relativeIndex) {
  let dir = dirname(docPath);
  for (;;) {
    const candidate = join(dir, relativeIndex);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// ── journal — the fragment carrier's forge-free CLI (issue #405) ─────────

function journalRefuse(reason) {
  process.stderr.write(`JOURNAL REFUSAL — ${reason}\n`);
  process.exit(2);
}

/** The journal flags, parsed locally: parseArgs stays untouched for the other commands. */
function parseJournalArgs(args) {
  const flags = {};
  const positions = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--") && i + 1 < args.length && !args[i + 1].startsWith("--")) {
      flags[args[i].slice(2)] = args[i + 1];
      i += 1;
    } else {
      positions.push(args[i]);
    }
  }
  return { flags, positions };
}

// ── Router ───────────────────────────────────────────────────────────────

// ── doc — retrieval + half-A positional entry point (units 65 and #366) ─

/** A typed selector-resolution failure is a refusal: exit 2, stdout empty.
 *  The detail line carries exactly one `doc:` prefix — a message that already
 *  names the tool keeps its own text, it never doubles the prefix (S11). */
function docRefuse(code, message) {
  process.stderr.write(`DOC REFUSAL — ${code}\n`);
  if (message) process.stderr.write(`doc: ${String(message).replace(/^doc:\s*/, "")}\n`);
  process.exit(2);
}

/** The seam an appended block needs at the section's end: a block boundary, so
 *  the text never glues to the previous line nor to the next heading. */
function appendSeam(body) {
  if (body.endsWith("\n\n")) return body;
  if (body.endsWith("\n")) return `${body}\n`;
  return `${body}\n\n`;
}

/** The half-A branch executor. Resolution and replacement reads happen
 *  before any write, so a refusal leaves the file byte-identical. */
async function runDocOpPositional(g) {
  const readSource = () => {
    if (g.file === "-") return readFileSync(0, "utf8");
    try {
      return readFileSync(g.file, "utf8");
    } catch (e) {
      throw new Error(`cannot read the document (${g.file}): ${e.message}`);
    }
  };
  if (g.op === "read") {
    if (g.file === "-" && g.section !== null && g.section.includes("#")) {
      throw new Error(
        "a path-qualified section id needs a real document path — with `--file -` use the heading title or its bare slug",
      );
    }
    const source = readSource();
    const receipt = { ok: true, command: "read", path: g.file, section: null, bytes: 0 };
    let output;
    if (g.section === null) {
      output = source;
      receipt.bytes = Buffer.byteLength(source);
    } else {
      const section = resolveSectionRef(source, relativeDocPath(g.file), g.section);
      output = source.slice(section.start, section.end);
      receipt.section = { id: section.id, title: section.title, depth: section.depth, lines: section.lines };
      receipt.bytes = Buffer.byteLength(output);
    }
    if (g.json) process.stdout.write(JSON.stringify(receipt) + "\n");
    else process.stdout.write(output);
    return;
  }
  if (g.op === "edit") {
    const source = readFileSync(g.file, "utf8");
    const bodySource = g.replacement ?? g.set ?? g.append;
    const bodyMode = g.set !== null ? "set" : g.append !== null ? "append" : "replacement";
    let text;
    try {
      // `--replacement` names a file; `--set`/`--append` carry their text and
      // read stdin only for `-`.
      text =
        bodySource === "-"
          ? readFileSync(0, "utf8")
          : bodyMode === "replacement"
            ? readFileSync(bodySource, "utf8")
            : bodySource;
    } catch (e) {
      throw new Error(`cannot read the body source (${bodySource}): ${e.message}`);
    }
    const section = resolveSectionRef(source, relativeDocPath(g.file), g.section);
    // Both text spellings ride the one splice primitive: `--set` places its text
    // where the section was, `--append` places it after the section's own bytes as
    // its own block (never glued to the next heading).
    const result =
      bodyMode === "append"
        ? source.slice(0, section.start) +
          appendSeam(source.slice(section.start, section.end)) +
          (text.endsWith("\n") ? text : `${text}\n`) +
          source.slice(section.end)
        : source.slice(0, section.start) + text + source.slice(section.end);
    if (!g.dryRun) {
      try {
        writeFileSync(g.file, result);
      } catch (e) {
        docRefuse("WRITE", `cannot write the document (${g.file}): ${e.message}`);
      }
    }
    const receipt = {
      ok: true,
      command: "edit",
      path: g.file,
      section: { id: section.id, title: section.title, depth: section.depth, lines: section.lines },
      bytesBefore: Buffer.byteLength(source),
      bytesAfter: Buffer.byteLength(result),
    };
    if (g.json) process.stdout.write(JSON.stringify(receipt) + "\n");
    else if (g.dryRun) process.stdout.write(result);
    else console.log(`doc edit: ${bodyMode === "append" ? "appended to" : "replaced"} ${g.section} in ${g.file} (lines ${section.lines[0]}-${section.lines[1]})`);
    return;
  }
  if (g.op === "index") {
    const { runDocIndex } = await import("../src/doc/structure.mjs");
    await runDocIndex(g, { rootDir: process.cwd() });
    return;
  }
}

const command = process.argv[2];
if (!command) {
  console.error("usage: agentic-workflow <unit-doc|roadmap|changelog|budgets|manifest|doc|section|relay|memory|log|journal|resolve-passes|verify|resources> ...");
  process.exit(1);
}

const restArgs = process.argv.slice(3);
const parsed = parseArgs(restArgs);
const rawArgs = parsed.args;

switch (command) {
  // ── relay — the lane's offline half of pi-web's packet contract ──────
  case "relay": {
    const rootDir = resolve(process.cwd());
    let argv;
    try {
      argv = parseRelayArgs(restArgs, { defaultWorkspace: rootDir });
    } catch (e) {
      if (!(e instanceof RelayUsageError)) throw e;
      process.stderr.write(`RELAY REFUSAL — ${e.message}\n`);
      process.stderr.write(RELAY_USAGE);
      process.exit(2);
    }
    let result;
    try {
      result = runRelayMode({
        ...argv,
        catalogPath: join(rootDir, "scripts", "catalog.json"),
        catalogLabel: "scripts/catalog.json",
        budgetsPath: join(rootDir, "docs", "workflow", "SKILL_CONTEXT_BUDGETS.json"),
        budgetsLabel: "docs/workflow/SKILL_CONTEXT_BUDGETS.json",
      });
    } catch (e) {
      if (!(e instanceof RelayUsageError)) throw e;
      process.stderr.write(`RELAY REFUSAL — ${e.message}\n`);
      process.exit(2);
    }
    process.stdout.write(`${result.lines.join("\n")}\n`);
    process.exit(result.exit);
    break;
  }

  // ── resolve-passes — the spawned-pass model resolution (issue #201) ──
  case "resolve-passes": {
    // Its own flag parser: the shared parseArgs only knows the receipt
    // flags, and an unknown flag here is a usage refusal, not a positional.
    const flags = {};
    for (let i = 0; i < restArgs.length; i++) {
      const arg = restArgs[i];
      if (arg === "--global" || arg === "--project" || arg === "--command") {
        if (i + 1 >= restArgs.length) {
          sensorRefuse("PASSES", `${arg} requires a value`);
        }
        flags[arg.slice(2)] = restArgs[++i];
      } else {
        sensorRefuse("PASSES", `unknown argument "${arg}" (usage: resolve-passes [--global <path>] [--project <path>] [--command <name>])`);
      }
    }
    const readText = (path, scope) => {
      if (path === undefined) return null;
      let text;
      try {
        text = readFileSync(resolve(path), "utf8");
      } catch (error) {
        sensorRefuse("PASSES", `${scope} config is present but unreadable: ${error instanceof Error ? error.message : String(error)}`);
      }
      return text;
    };
    let receipt;
    try {
      receipt = resolvePasses({
        globalText: readText(flags.global, "global"),
        projectText: readText(flags.project, "project"),
        command: flags.command ?? DEFAULT_REVIEW_COMMAND,
      });
    } catch (e) {
      if (!(e instanceof PassesError)) throw e;
      process.stderr.write(`PASSES REFUSAL — ${e.message}\n`);
      process.exit(2);
    }
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    process.exit(0);
    break;
  }

  // ── verify — the document verifier, distinct from the edit writer (issue #260) ──
  case "verify": {
    const positional = [];
    for (const arg of restArgs) {
      if (arg === "--no-git") continue; // skip the receipt-sha resolution (no repo context)
      else if (arg.startsWith("--")) sensorRefuse("VERIFY", `unknown argument "${arg}" (usage: verify <unit-doc-path> [--no-git])`);
      else positional.push(arg);
    }
    if (positional.length !== 1) {
      sensorRefuse("VERIFY", `expected exactly one unit-doc path (usage: verify <unit-doc-path> [--no-git])`);
    }
    const docPath = resolve(positional[0]);
    let text;
    try {
      text = readFileSync(docPath, "utf8");
    } catch (error) {
      sensorRefuse("VERIFY", `unit doc is present but unreadable: ${error instanceof Error ? error.message : String(error)}`);
    }
    // headExists wires the fabricated-receipt check to the containing repo:
    // a receipt naming a commit the repo does not hold attests nothing.
    const headExists = restArgs.includes("--no-git")
      ? null
      : (sha) =>
          spawnSync("git", ["-C", dirname(docPath), "cat-file", "-e", `${sha}^{commit}`], {
            stdio: "ignore",
          }).status === 0;
    const result = verifyUnitDoc({ text, path: docPath, headExists, now: null });
    if (!result.ok) {
      process.stderr.write(
        `VERIFY REFUSAL — ${result.violations.length} violation(s)\n` +
          result.violations.map((v) => `  ${v.code}: ${v.message}`).join("\n") +
          "\n",
      );
      process.exit(2);
    }
    process.stdout.write(`VERIFY PASS — ${JSON.stringify({ ...result, violations: [] }, null, 2)}\n`);
    process.exit(0);
    break;
  }

  // ── resources — the trial-envelope + admission layer (issue #260) ──
  case "resources": {
    const sub = restArgs[0];
    if (sub !== "detect" && sub !== "admit") {
      sensorRefuse("RESOURCES", `unknown subcommand "${sub ?? ""}" (usage: resources detect [caps…] | resources admit --task <id> --expect <json> [--record-dir <dir>])`);
    }
    const flags = {};
    const positional = [];
    // flag name → the camelCase key the code reads; `--json` is accepted and
    // ignored (the receipt is always JSON, the flag exists for explicitness).
    const VALUE_FLAGS = new Map([
      ["--task", "task"],
      ["--expect", "expect"],
      ["--record-dir", "recordDir"],
      ["--memory-cap", "memoryCap"],
      ["--thread-cap", "threadCap"],
      ["--parallelism", "parallelism"],
    ]);
    for (let i = 1; i < restArgs.length; i++) {
      const arg = restArgs[i];
      if (VALUE_FLAGS.has(arg)) {
        if (i + 1 >= restArgs.length) sensorRefuse("RESOURCES", `${arg} requires a value`);
        flags[VALUE_FLAGS.get(arg)] = restArgs[++i];
      } else if (arg === "--json") {
        // the receipt is always JSON; the flag exists for explicitness
      } else {
        sensorRefuse("RESOURCES", `unknown argument "${arg}"`);
      }
    }
    const caps = {};
    if (flags.memoryCap !== undefined) caps.memoryCap = flags.memoryCap;
    if (flags.threadCap !== undefined) caps.threadCap = flags.threadCap;
    if (flags.parallelism !== undefined) {
      caps.parallelism = flags.parallelism === "serial" || flags.parallelism === "auto"
        ? flags.parallelism
        : Number(flags.parallelism);
    }
    try {
      const envelope = detectHost({ caps: Object.keys(caps).length > 0 ? caps : null });
      if (sub === "detect") {
        process.stdout.write(`${JSON.stringify(envelope, null, 2)}\n`);
        process.exit(0);
      }
      // admit
      if (!flags.task) sensorRefuse("RESOURCES", "admit requires --task <id>");
      if (flags.expect === undefined) sensorRefuse("RESOURCES", "admit requires --expect <json>");
      let expect;
      try {
        expect = JSON.parse(flags.expect);
      } catch (error) {
        sensorRefuse("RESOURCES", `--expect is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      const verdict = admitTrial({
        task: flags.task,
        expect,
        envelope,
        recordDir: flags.recordDir ?? null,
      });
      if (verdict.verdict !== "allow") {
        process.stderr.write(
          `RESOURCES REFUSAL — ${verdict.reason}\n` +
            `  receipt: ${JSON.stringify(verdict.receipt)}\n`,
        );
        process.exit(2);
      }
      process.stdout.write(`${JSON.stringify(verdict, null, 2)}\n`);
      process.exit(0);
    } catch (e) {
      if (!(e instanceof ResourcesError)) throw e;
      sensorRefuse("RESOURCES", e.message);
    }
    break;
  }

  // ── doc — retrieval + half-A entry point (unit 65 D2, issue #366) ────
  case "doc": {
    let grammar;
    try {
      grammar = parseDocArgs(restArgs);
    } catch (e) {
      process.stderr.write(`doc: ${e.message}\n`);
      process.exit(1);
    }
    if (grammar.branch === "docop") {
      try {
        await runDocOpPositional(grammar);
      } catch (e) {
        if (e instanceof SectionLocatorError) docRefuse(e.code, e.message);
        process.stderr.write(`doc: ${e.message}\n`);
        process.exit(1);
      }
      break;
    }
    let envelope;
    try {
      envelope = await runDocOp(grammar, { rootDir: process.cwd() });
    } catch (e) {
      // IO/store failures are usage/IO territory (exit 1, D3); the message
      // goes to stderr and stdout stays empty.
      process.stderr.write(`doc: ${e.message}\n`);
      process.exit(1);
    }
    if (grammar.jsonOnly) {
      // AC8: exactly one JSON document on stdout; diagnostics on stderr.
      process.stdout.write(JSON.stringify(envelope) + "\n");
    } else if (grammar.quiet) {
      // AC23's hook spelling: --sync --quiet writes nothing on success;
      // diagnostics stay on stderr. Exit code still reports failure.
      if (envelope.ok !== true) process.stderr.write(`doc ${envelope.command}: failed\n`);
    } else {
      for (const d of envelope.degradations) process.stderr.write(`doc: degradation: ${d}\n`);
      for (const r of envelope.results) {
        console.log(`${r.path} · ${r.section ?? "-"} · L${r.lines[0]}-${r.lines[1]} · ${r.score}`);
      }
      if (envelope.store?.lastSync) {
        const s = envelope.store.lastSync;
        console.log(`doc sync: files_scanned=${s.files_scanned} files_changed=${s.files_changed} files_deleted=${s.files_deleted} chunks=${envelope.store.chunks}`);
      }
      console.log(`doc ${envelope.command}: ${envelope.results.length} result(s)`);
    }
    break;
  }

  // ── memory — bounded memory-substrate health probe (unit 66, P1) ────
  case "memory": {
    const op = rawArgs[0];
    if (op !== "probe") refuse(`memory requires the \`probe\` operation, got "${op ?? ""}"`);
    const report = await runProbe();
    if (parsed.json) {
      process.stdout.write(JSON.stringify(report) + "\n");
    } else {
      console.log(`MEMORY PROBE — ${report.verdict}`);
      for (const check of report.checks) {
        const mark = check.status === "ok" ? "ok" : `failed:${check.reason}`;
        console.log(`  ${check.id} · ${mark} · ${check.detail}`);
      }
      if (report.degraded.length > 0) {
        console.log(`Degraded: ${report.degraded.join(", ")} — record this in Evidence, keep working`);
      }
    }
    // A sensor that exits non-zero for a healthy machine's degraded layer
    // would block the very units it exists to protect (AC2 non-goal).
    break;
  }

  // ── log — the mechanical journal entry (feature #394) ────────────────
  case "log": {
    const op = rawArgs[0];
    if (op !== "render") logRefuse(`log requires the \`render\` operation, got "${op ?? ""}"`);
    const factsPath = parsed.facts;
    if (typeof factsPath !== "string" || factsPath === "") logRefuse("log render requires --facts <path|->");
    let text;
    try {
      text = factsPath === "-" ? readFileSync(0, "utf8") : readFileSync(resolve(factsPath), "utf8");
    } catch (error) {
      logRefuse(`cannot read the facts payload (${factsPath}): ${error.message}`);
    }
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      logRefuse(`the facts payload is not JSON: ${error.message}`);
    }
    const receipt = renderReceipt(payload);
    if (!receipt.ok) logRefuse(receipt.error, receipt);
    process.stdout.write(parsed.raw ? receipt.entry : `${JSON.stringify(receipt)}\n`);
    break;
  }

  // ── journal — the fragment carrier's forge-free CLI (issues #405, #452) ─
  case "journal": {
    const op = parseJournalArgs(restArgs).positions[0] ?? rawArgs[0];
    const rootDir = parsed.dir ? resolve(parsed.dir) : process.cwd();
    if (op === "aggregate") {
      const { flags } = parseJournalArgs(restArgs);
      const checkOnly = restArgs.includes("--check");
      if (checkOnly) {
        let receipt;
        try {
          receipt = checkJournal({ root: rootDir, journalDir: flags["journal-dir"] });
        } catch (error) {
          if (error instanceof JournalAggregateError) journalRefuse(error.message);
          throw error;
        }
        if (!receipt.ok) {
          // The refusal line leads (the block contract's first line), then the
          // lint's whole job: one line per fault, so a PR author sees all of it.
          process.stderr.write(
            `JOURNAL REFUSAL — ${receipt.refusals.length} non-conforming fragment(s) in ${receipt.journalDir} — a malformed fragment never reaches main\n`,
          );
          for (const refusal of receipt.refusals) process.stderr.write(`  ${refusal.reason}\n`);
          process.exit(2);
        }
        process.stdout.write(`${JSON.stringify(receipt, null, parsed.json ? 2 : 0)}\n`);
        break;
      }
      let receipt;
      try {
        receipt = aggregateJournal({
          root: rootDir,
          journalDir: flags["journal-dir"],
          logPath: flags.log,
        });
      } catch (error) {
        if (error instanceof JournalAggregateError) journalRefuse(error.message);
        throw error;
      }
      process.stdout.write(`${JSON.stringify(receipt, null, parsed.json ? 2 : 0)}\n`);
      break;
    }
    if (op === "write") {
      let flags;
      try {
        flags = parseWriteArgs(restArgs);
      } catch (error) {
        if (error instanceof JournalWriteError) journalRefuse(error.message);
        throw error;
      }
      const readSource = (value, label) => {
        if (value === "-") return readFileSync(0, "utf8");
        try {
          return readFileSync(resolve(rootDir, value), "utf8");
        } catch (error) {
          journalRefuse(`cannot read the ${label} (${value}): ${error.message}`);
        }
      };
      let facts;
      if (flags.facts !== undefined) {
        const text = readSource(flags.facts, "facts payload");
        try {
          facts = JSON.parse(text);
        } catch (error) {
          journalRefuse(`the facts payload is not JSON: ${error.message}`);
        }
      }
      let content;
      // Inline text is the normal spelling; stdin is the escape hatch for long
      // prose, and only `-` is a source — a summary that happens to look like a
      // path is text, never a file read.
      if (flags.content !== undefined) content = flags.content === "-" ? readFileSync(0, "utf8") : flags.content;
      let receipt;
      try {
        receipt = writeJournal({
          root: rootDir,
          kind: flags.kind,
          session: flags.session,
          timestamp: flags.timestamp,
          title: flags.title,
          summary: flags.summary,
          decisions: flags.decisions,
          next: flags.next,
          content,
          facts,
          base: flags.base,
          journalDir: flags["journal-dir"],
        });
      } catch (error) {
        if (WRITE_REFUSALS.some((kindOf) => error instanceof kindOf)) journalRefuse(error.message);
        throw error;
      }
      process.stdout.write(`${JSON.stringify(receipt, null, parsed.json ? 2 : 0)}\n`);
      break;
    }
    if (op === "name") {
      const { flags } = parseJournalArgs(restArgs);
      const kind = flags.kind;
      if (kind !== "mechanical" && kind !== "narrative") {
        journalRefuse(`journal name requires --kind <mechanical|narrative>, got "${kind ?? ""}"`);
      }
      let branch = flags.branch;
      if (typeof branch !== "string" || branch === "") {
        const probe = spawnSync("git", ["-C", rootDir, "branch", "--show-current"], { encoding: "utf8" });
        branch = probe.status === 0 && probe.stdout.trim() !== "" ? probe.stdout.trim() : "detached";
      }
      const timestamp = Date.now();
      let name;
      try {
        name = fragmentName({ timestamp, branch, kind, sessionId: flags.session ?? "local" });
      } catch (error) {
        if (error instanceof FragmentError) journalRefuse(error.message);
        throw error;
      }
      process.stdout.write(`${flags["journal-dir"] ?? JOURNAL_DIR}/${name}\n`);
      break;
    }
    journalRefuse(`journal requires the \`aggregate\`, \`write\` or \`name\` operation, got "${op ?? ""}"`);
    break;
  }

  // ── unit-doc ─────────────────────────────────────────────────────────
  case "unit-doc": {
    const slug = rawArgs[0];
    const op = rawArgs[1];
    if (!slug || !op) refuse("unit-doc requires <slug> <operation> [args...]");

    const rootDir = parsed.dir ? resolve(parsed.dir) : process.cwd();
    const unitDir = join(rootDir, "docs", "features", slug);

    if (op === "create") {
      try {
        const receipt = create(unitDir, slug);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "setSection") {
      if (rawArgs.length < 4) refuse("setSection requires <slug> <section> <body_file|body>");
      const section = rawArgs[2];
      let body;
      try {
        body = readFileSync(rawArgs[3], "utf8");
      } catch {
        body = rawArgs[3];
      }
      try {
        const receipt = setSection(join(unitDir, "SPEC.md"), section, body);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "evidence") {
      try {
        const body = rawArgs[2] ? JSON.parse(rawArgs[2]) : {};
        const receipt = evidence_addRow(join(unitDir, "SPEC.md"), body);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "progress") {
      try {
        const body = rawArgs[2] ? JSON.parse(rawArgs[2]) : {};
        const receipt = progress_logEntry(join(unitDir, "SPEC.md"), body);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "validate") {
      try {
        const content = readFileSync(join(unitDir, "SPEC.md"), "utf8");
        const result = validate(content);
        if (parsed.json) console.log(JSON.stringify(result, null, 2));
        else console.log(JSON.stringify(result, null, 2));
      } catch (e) {
        refuse(e.message);
      }
    } else {
      refuse(`Unknown unit-doc operation: ${op}`);
    }
    break;
  }

  // ── roadmap ──────────────────────────────────────────────────────────
  case "roadmap": {
    // `rowUpsert`/`annotate` take a table path first: a bare first positional is
    // a missing path, never a filename. Resolving the subcommand word would make
    // `roadmap rowUpsert …` open a file literally named `rowUpsert` and refuse
    // with ENOENT, which reads as a missing table instead of a usage error.
    if (rawArgs[0] === "rowUpsert" || rawArgs[0] === "annotate") {
      process.stderr.write(`usage: agentic-workflow roadmap <table-path> ${rawArgs[0]} <json>\n`);
      process.exit(2);
    }
    const filePath = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), "ROADMAP.md");

    if (rawArgs[0] === "rowUpsert" || (rawArgs[0] && rawArgs[1] === "rowUpsert")) {
      // Skip file path if it's the first positional
      const data = rawArgs[1] === "rowUpsert" ? (rawArgs[2] ? JSON.parse(rawArgs[2]) : {}) : JSON.parse(rawArgs[1] || "{}");
      try {
        const receipt = rowUpsert(filePath, data);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (rawArgs[0] === "annotate" || (rawArgs[0] && rawArgs[1] === "annotate")) {
      const nn = rawArgs[1] === "annotate" ? rawArgs[2] : rawArgs[1];
      const note = rawArgs[1] === "annotate" ? rawArgs[3] || "" : (rawArgs[2] || "");
      try {
        const receipt = roadmapAnnotate(filePath, nn, note);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (rawArgs[0] === "check" || (rawArgs[0] && rawArgs[1] === "check")) {
      // roadmap check <unit-doc-path> [--roadmap <file>] [--index <file>] [--json]
      //   Cross-document check (issue #316): the unit doc's own facts (NN,
      //   slug, PR URL) against its index row. Exit contract: 0 consistent,
      //   1 violations (named codes), 2 usage.
      const docArg = rawArgs[1] === "check" ? rawArgs[2] : rawArgs[1];
      if (!docArg) {
        process.stderr.write("usage: agentic-workflow roadmap check <unit-doc-path> [--roadmap <file>] [--index <file>] [--json]\n");
        process.exit(2);
      }
      const flag = (name) => {
        const i = restArgs.indexOf(name);
        return i !== -1 ? restArgs[i + 1] : undefined;
      };
      try {
        const docPath = resolve(docArg);
        const docText = readFileSync(docPath, "utf8");
        // Kind and index defaults follow the doc's own tree position:
        // docs/features → the roadmap, docs/fix → the fix index (its rows are
        // removed once merged, so a missing row there is convention, not
        // contradiction).
        const parts = docPath.split("/");
        const isFix = parts.includes("docs") && parts[parts.indexOf("docs") + 1] === "fix";
        // One index (issue #319): a feature row and a fix row are two tables of
        // the same document, so both kinds default to it and `checkUnitDoc`
        // reads its own table there. A pre-319 tree still has the pre-move
        // roadmap and the standalone fix index under the alias.
        const indexArg = flag("--roadmap") ?? flag("--index");
        // The index is resolved through the shared reader, so the documented
        // rollback lever (`ROADMAP_LEGACY_READ`) governs this consumer too: with
        // the window closed a pre-move-only tree is refused with the pointer at
        // its new home, and with the lever on the same tree reads as before.
        const resolved = resolveIndex(docPath, indexArg);
        const indexPath = resolved.direct ?? resolved.index;
        if (!indexPath) {
          refuse(`index not found for ${docArg} — pass --roadmap <file>`);
        }
        const dirName = basename(dirname(docPath));
        const nn = /^(\d+)/.exec(dirName)?.[1] ?? "";
        const slug = dirName.replace(/^\d+-/, "");
        // A half-migrated tree (issue #319): the consolidated index exists but
        // carries no `## Fixes` table, so the active fix rows are still in the
        // standalone fix index. `MIGRATION.md` and `init-workspace`'s upgrade
        // reference promise that state is readable, so a fix doc falls back to
        // it exactly as the sensor, router, settle validator and ceremony CLI
        // do — never a feature row read as a fix row, never a vacuous pass.
        const indexText = readFileSync(indexPath, "utf8");
        const fixIndexText = isFix && !indexArg && roadmapSection(indexText, ROADMAP_FIXES_HEADING) === null
          ? (() => {
            const standalone = findUpIndex(docPath, relativeToDocs(FIX_INDEX_DOCUMENT));
            return standalone === null ? null : readFileSync(standalone, "utf8");
          })()
          : null;
        const result = checkUnitDoc({
          nn,
          slug,
          kind: isFix ? "fix" : "feature",
          docText,
          indexText: fixIndexText ?? indexText,
        });
        if (parsed.json) {
          console.log(
            JSON.stringify(
              { service: "roadmap", op: "check", path: docPath, schema: "roadmap-table@1", codes: ROADMAP_CHECK_CODES, ok: result.ok, violations: result.violations },
              null,
              2,
            ),
          );
        } else {
          for (const v of result.violations) {
            console.log(`roadmap-check: ${docPath}:${v.line} ${v.code} — ${v.detail}`);
          }
          console.log(`verdict: ${result.ok ? "PASS" : "FAIL"}`);
          console.log(`violations: ${result.violations.length}`);
        }
        process.exit(result.ok ? 0 : 1);
      } catch (e) {
        refuse(e.message);
      }
    } else {
      refuse(`Unknown roadmap operation`);
    }
    break;
  }

  // ── changelog ────────────────────────────────────────────────────────
  case "changelog": {
    const filePath = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), "CHANGELOG.md");
    const data = rawArgs[1] ? JSON.parse(rawArgs[1]) : {};

    try {
      // Format: changelog <data_json> — sectionName inferred from data or first arg
      const sectionName = data.section || data.skill || rawArgs[1] ? "default" : "default";
      const receipt = rowAdd(filePath, sectionName, data);
      if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
      printReceipt(receipt);
    } catch (e) {
      refuse(e.message);
    }
    break;
  }

  // ── budgets ──────────────────────────────────────────────────────────
  case "budgets": {
    const filePath = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), "budgets.json");
    const data = rawArgs[1] ? JSON.parse(rawArgs[1]) : {};
    const { version, date, type, what, section, skill } = {};

    try {
      const receipt = ceilingRebase(filePath, data.route, data.estimateMax, data.linesMax, data.growthSource);
      if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
      printReceipt(receipt);
      if (!receipt.ok) refuse("Ceiling shrinkage without growth source");
    } catch (e) {
      refuse(e.message);
    }
    break;
  }

  // ── manifest ─────────────────────────────────────────────────────────
  case "manifest": {
    const pluginJson = rawArgs[0] ? resolve(rawArgs[0]) : join(process.cwd(), ".claude-plugin", "plugin.json");
    const op = rawArgs[1] || "";

    if (op === "skillAdd") {
      const skillName = rawArgs[2] || "";
      const meta = rawArgs[3] ? JSON.parse(rawArgs[3]) : {};
      try {
        const receipt = skillAdd(pluginJson, skillName, meta);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else if (op === "skillRemove") {
      const skillName = rawArgs[2] || "";
      try {
        const receipt = skillRemove(pluginJson, skillName);
        if (parsed.json) console.log(JSON.stringify(receipt, null, 2));
        else printReceipt(receipt);
      } catch (e) {
        refuse(e.message);
      }
    } else {
      refuse(`Unknown manifest operation: ${op}`);
    }
    break;
  }

  // ── section — AST section/range locator + lossless splice (issue #407) ──
  case "section": {
    let args;
    try {
      args = parseSectionArgs(restArgs);
    } catch (e) {
      process.stderr.write(`section: ${e.message}\n`);
      process.exit(1);
    }
    const readTarget = (target) => (target === "-" ? readFileSync(0, "utf8") : readFileSync(target, "utf8"));
    let markdown;
    let replacement = null;
    try {
      markdown = readTarget(args.file);
      if (args.op === "replace") replacement = readTarget(args.replacement);
    } catch (e) {
      process.stderr.write(`section: ${e.message}\n`);
      process.exit(1);
    }

    let outcome;
    try {
      if (args.op === "locate") outcome = { text: markdown, range: locateSection(markdown, args.selector) };
      else if (args.op === "remove") outcome = removeSection(markdown, args.selector);
      else outcome = replaceSection(markdown, args.selector, replacement);
    } catch (e) {
      if (!(e instanceof SectionLocatorError)) throw e;
      if (e.code === "BAD_SELECTOR") {
        process.stderr.write(`section: ${e.message}\n`);
        process.exit(1);
      }
      process.stderr.write(`SECTION REFUSAL — ${e.code} — ${e.message}\n`);
      if (args.json) {
        process.stdout.write(
          `${JSON.stringify({ ok: false, service: "section", op: args.op, path: args.file, code: e.code, matches: e.matches, selector: e.selector, message: e.message })}\n`,
        );
      }
      process.exit(2);
    }

    const written = args.op !== "locate" && args.write;
    if (written) {
      const target = resolve(args.file);
      const temporary = join(dirname(target), `.${Math.random().toString(36).slice(2)}.tmp`);
      writeFileSync(temporary, outcome.text, "utf8");
      renameSync(temporary, target);
    }

    const range = outcome.range;
    const receipt = {
      ok: true,
      service: "section",
      op: args.op,
      path: args.file,
      schema: "section-splice@1",
      before: digest(markdown),
      after: digest(outcome.text),
      written,
      range,
    };
    if (args.json) {
      process.stdout.write(`${JSON.stringify(receipt)}\n`);
    } else if (args.op === "locate" || written) {
      console.log(`EDIT section.${args.op} — ${args.file}`);
      console.log("Schema: section-splice@1 · Receipt: pass");
      console.log(`Before: ${receipt.before} · After: ${receipt.after}`);
      console.log(`Range: ${range.kind} · offsets ${range.start}-${range.end} · bytes ${range.byteStart}-${range.byteEnd} · lines ${range.lines[0]}-${range.lines[1]}`);
    } else {
      process.stdout.write(outcome.text);
    }
    break;
  }

  default:
    refuse(`Unknown service: ${command}`);
}