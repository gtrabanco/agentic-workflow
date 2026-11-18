#!/usr/bin/env node
/**
 * reconstruct.mjs — rebuild telemetry records from Pi's own session transcripts
 * (issue #624, unit `docs/fix/624-reconstruct-telemetry-from-pi-transcripts`).
 *
 * The wiring flushes a session's sample on `session_shutdown`, and a session kept
 * alive between prompts — pi-web's normal shape — never reaches it. Pi's own
 * transcript store preserves the same usage numbers, so this module reads them
 * back and lets an operator merge the missing sessions into the two telemetry
 * stores by hand.
 *
 * Four rules, each a case in `test/telemetry-reconstruct.test.mjs`:
 *
 *  - **The transcript is the only source.** A record is derived from the files
 *    Pi wrote; the module reads no git history and attributes no unit (S5), so
 *    it can answer by project, session, date and model only.
 *  - **A field the transcript cannot answer is `null`, never a zero.** `unit`,
 *    `phase`, `version`, `changed_paths` and `tool_ms` stay null in the record.
 *    The ledger's integer cells cannot hold a null, so its row is a documented
 *    projection (D2) and is visibly unattributed.
 *  - **The merge is idempotent across both source prefixes.** A session already
 *    recorded live (`pi:session=<id>`) or by a previous run
 *    (`pi:reconstruct=<id>`) is not written again to the destination that holds
 *    it, so a forced reconciliation never double-counts.
 *  - **Manual only.** Nothing here runs from a session lifecycle event (S3a):
 *    the command is the only entry, and a run reads the store the operator asked
 *    it to read.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { TELEMETRY_SAMPLE_FIELDS } from "@gtrabanco/agentic-workflow-schema";

import { LEDGER_PATH, appendJsonlSample, appendLedgerSample, orderedSample, parseLedger } from "./ledger.mjs";

/** The contract id of the answer this command prints. */
export const RECONSTRUCT_CONTRACT_ID = "telemetry-reconstruct@1";

/** The per-session JSONL store the live sink writes, relative to a project root. */
export const DEFAULT_JSONL = ".pi/.telemetry/sessions.jsonl";

/** The provenance prefix a reconstructed record carries. */
export const RECONSTRUCT_SOURCE_PREFIX = "pi:reconstruct=";

/** The provenance prefix the live sink writes. */
export const LIVE_SOURCE_PREFIX = "pi:session=";

/** A refusal: the command answers `RECONSTRUCT REFUSAL — <message>` and exits 2. */
export class ReconstructRefusal extends Error {}

const USAGE = `usage: agentic-workflow telemetry reconstruct <stats|samples|write> [flags]

  stats    [--by-model] [--by-date] [--project <path>]
  samples  [--jsonl <path>] [--project <path>]
  write    [--jsonl <path>] [--ledger <path>]

--project   the project whose Pi transcripts are read (default: cwd)
--jsonl     samples: the dump file; write: the store to merge into
            (default: <project>/${DEFAULT_JSONL})
--ledger    the ledger to merge into (default: <project>/${LEDGER_PATH};
            an absent default is reported as absent, never created)
--by-model  stats: add the per-model breakdown
--by-date   add the per-date breakdown
`;

/** Pi's agent directory: `$PI_CODING_AGENT_DIR`, else `~/.pi/agent`. */
export function piAgentDir(env = process.env, home = os.homedir()) {
  const configured = String(env.PI_CODING_AGENT_DIR ?? "").trim();
  return configured !== "" ? configured : path.join(home, ".pi", "agent");
}

/** Subagent artifacts are files Pi writes beside a session, never a session. */
const SUBAGENT_DIR = /^subagent-artifacts/;
const SUBAGENT_FILE = /_(subagent|worker|reviewer|scout|delegate)_/;

/** The header of a Pi transcript, or null when the file is not one. */
function sessionHeader(transcriptPath) {
  let first;
  try {
    first = fs.readFileSync(transcriptPath, "utf8").split("\n", 1)[0];
  } catch {
    return null;
  }
  let entry;
  try {
    entry = JSON.parse(first);
  } catch {
    return null;
  }
  if (entry?.type !== "session" || typeof entry.cwd !== "string" || entry.cwd === "") return null;
  return { id: typeof entry.id === "string" && entry.id !== "" ? entry.id : null, cwd: entry.cwd, timestamp: entry.timestamp };
}

/**
 * The transcripts Pi keeps for `project` (or for every project when it is null),
 * sorted by path so two runs answer the same order.
 *
 * A missing store is "no transcripts", not a failure: a machine that never ran
 * Pi has nothing to reconstruct. Subagent artifacts are excluded — they are a
 * worker's own file, not a session the operator drove.
 */
export function listTranscripts({ agentDir = piAgentDir(), project = null } = {}) {
  const sessions = path.join(agentDir, "sessions");
  let entries;
  try {
    entries = fs.readdirSync(sessions, { withFileTypes: true });
  } catch {
    return [];
  }
  const found = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || SUBAGENT_DIR.test(entry.name)) continue;
    const dir = path.join(sessions, entry.name);
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith(".jsonl") || SUBAGENT_FILE.test(file)) continue;
      const transcriptPath = path.join(dir, file);
      const header = sessionHeader(transcriptPath);
      if (header === null) continue;
      if (project !== null && path.resolve(header.cwd) !== project) continue;
      found.push({
        path: transcriptPath,
        sessionId: header.id ?? path.basename(file, ".jsonl"),
        cwd: path.resolve(header.cwd),
        timestamp: typeof header.timestamp === "string" ? header.timestamp : null,
      });
    }
  }
  return found.sort((left, right) => left.path.localeCompare(right.path));
}

/** One provider field as a non-negative integer; an absent field is a zero. */
function countOf(value) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

/** The provider's own token count: the total when given, else its parts. */
function tokensOf(usage) {
  if (typeof usage?.totalTokens === "number") return countOf(usage.totalTokens);
  return ["input", "output", "cacheRead", "cacheWrite", "reasoning"].reduce((sum, field) => sum + countOf(usage?.[field]), 0);
}

/** The UTC day of a transcript timestamp, or null when it names no real instant. */
function dayOf(value) {
  const date = typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  if (date === null || Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

/** The model that served the most assistant turns, first seen on a tie. */
function majorityModel(modelTurns) {
  let best = null;
  let bestTurns = 0;
  for (const [model, served] of modelTurns) {
    if (served > bestTurns) {
      best = model;
      bestTurns = served;
    }
  }
  return best;
}

/**
 * One transcript as a record, or the reason it was skipped.
 *
 * Only assistant messages are counted, and `model_ms` sums their `durationMs`:
 * a tool-result message carries its own duration, and charging it to the model
 * would report tool time as generation time (PE-003). The record is built in the
 * published field order, so a JSONL line and a reader agree by construction.
 */
export function reconstructRecord(transcriptPath) {
  let text;
  try {
    text = fs.readFileSync(transcriptPath, "utf8");
  } catch (error) {
    return { skip: `unreadable: ${error.message}` };
  }

  const tokenFields = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, reasoning: 0 };
  let tokens = 0;
  let turns = 0;
  let modelMs = 0;
  let sessionId = null;
  let firstTimestamp = null;
  let lastModelChange = null;
  let malformed = null;
  const modelTurns = new Map();

  for (const line of String(text).split("\n")) {
    if (line.trim() === "") continue;
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      // One unreadable line means the transcript's totals are not provable: the
      // whole transcript is skipped, never a record assembled from the rest.
      malformed ??= line.trim().slice(0, 80);
      continue;
    }
    if (firstTimestamp === null && entry.timestamp !== undefined) firstTimestamp = entry.timestamp;
    if (entry.type === "session") {
      if (sessionId === null && typeof entry.id === "string" && entry.id !== "") sessionId = entry.id;
      continue;
    }
    if (entry.type === "model_change") {
      if (typeof entry.modelId === "string" && entry.modelId !== "") lastModelChange = entry.modelId;
      continue;
    }
    if (entry.type !== "message") continue;
    const message = entry.message ?? {};
    if (message.role !== "assistant") continue;
    turns += 1;
    if (typeof message.durationMs === "number") modelMs += Math.max(0, message.durationMs);
    if (typeof message.model === "string" && message.model !== "") {
      modelTurns.set(message.model, (modelTurns.get(message.model) ?? 0) + 1);
    }
    const usage = message.usage ?? {};
    tokens += tokensOf(usage);
    for (const field of Object.keys(tokenFields)) tokenFields[field] += countOf(usage[field]);
  }

  if (malformed !== null) return { skip: `malformed line: ${malformed}` };
  if (sessionId === null) return { skip: "no session header" };
  if (firstTimestamp === null) return { skip: "no timestamp" };
  const observed = dayOf(firstTimestamp);
  if (observed === null) return { skip: `unreadable timestamp: ${String(firstTimestamp).slice(0, 40)}` };
  if (turns === 0) return { skip: "no assistant messages" };

  const record = {
    unit: null,
    phase: null,
    version: null,
    model: majorityModel(modelTurns) ?? lastModelChange ?? null,
    changed_paths: null,
    tokens,
    turns,
    input_tokens: tokenFields.input,
    output_tokens: tokenFields.output,
    cache_read_tokens: tokenFields.cacheRead,
    cache_write_tokens: tokenFields.cacheWrite,
    reasoning_tokens: tokenFields.reasoning,
    model_ms: Math.round(modelMs),
    tool_ms: null,
    observed,
    source: `${RECONSTRUCT_SOURCE_PREFIX}${sessionId}`,
  };
  return { record, ordered: orderedSample(record) };
}

/** Every transcript the project owns, split into records and named skips. */
export function reconstructProject({ agentDir = piAgentDir(), project = null } = {}) {
  const transcripts = listTranscripts({ agentDir, project });
  const records = [];
  const skipped = [];
  for (const transcript of transcripts) {
    const result = reconstructRecord(transcript.path);
    if (result.record !== undefined) records.push(result.record);
    else skipped.push({ path: transcript.path, reason: result.skip });
  }
  return { transcripts, records, skipped };
}

/** The fields a stats group sums, in the order the envelope prints them. */
const SUM_FIELDS = Object.freeze([
  "tokens",
  "turns",
  "input_tokens",
  "output_tokens",
  "cache_read_tokens",
  "cache_write_tokens",
  "reasoning_tokens",
  "model_ms",
]);

/** One group's sums; an empty group is not a group. */
function summarise(key, records) {
  const group = { key, sessions: records.length };
  for (const field of SUM_FIELDS) group[field] = records.reduce((sum, record) => sum + record[field], 0);
  return group;
}

/** Group the records by one field, most expensive first, ties by key. */
function groupBy(records, field) {
  const groups = new Map();
  for (const record of records) {
    const key = record[field] === null || record[field] === undefined ? "(unnamed)" : String(record[field]);
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.entries()]
    .map(([key, members]) => {
      const group = summarise(key, members);
      group[field] = key;
      return group;
    })
    .sort((left, right) => right.tokens - left.tokens || String(left[field]).localeCompare(String(right[field])));
}

/**
 * The `telemetry-reconstruct@1` stats answer: the totals every run carries, the
 * two breakdowns only when asked, and the transcripts it skipped — never a
 * silent zero for a session it did not read.
 */
export function statsOf({ project, records, skipped = [], byModel = false, byDate = false }) {
  const totals = { sessions: records.length };
  for (const field of SUM_FIELDS) totals[field] = records.reduce((sum, record) => sum + record[field], 0);
  const payload = {
    contract: RECONSTRUCT_CONTRACT_ID,
    project,
    sessions: records.length,
    skipped: skipped.length,
    skipped_transcripts: skipped,
    totals,
  };
  if (byModel) payload.by_model = groupBy(records, "model");
  if (byDate) payload.by_date = groupBy(records, "observed");
  return payload;
}

/** One JSON object per record, in the published field order. */
export function recordsText(records) {
  return records.map((record) => `${JSON.stringify(orderedSample(record))}\n`).join("");
}

/** The session identity a provenance string names, whichever sink wrote it. */
export function sessionKeyOf(source) {
  const text = String(source ?? "");
  for (const prefix of [RECONSTRUCT_SOURCE_PREFIX, LIVE_SOURCE_PREFIX]) {
    if (text.startsWith(prefix)) return text.slice(prefix.length);
  }
  return text;
}

/** The rows of a JSONL store, or a refusal naming the line that is not JSON. */
function readJsonlStore(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    throw new ReconstructRefusal(`cannot read ${file}: ${error.message}`);
  }
  const rows = [];
  const lines = text.split("\n");
  for (let at = 0; at < lines.length; at += 1) {
    if (lines[at].trim() === "") continue;
    try {
      rows.push(JSON.parse(lines[at]));
    } catch {
      throw new ReconstructRefusal(`${file}: line ${at + 1} is not JSON`);
    }
  }
  return rows;
}

/** The record as a `tier-cost@N` row: nulls stay null, integer cells project to 0 (D2). */
function ledgerRowOf(record) {
  const row = orderedSample(record);
  // The grammar's count cells are digits only, and a reconstruction cannot know
  // them: the projection carries 0 and the row's `null` unit marks it as
  // unattributed, so the tier report skips it instead of scoring a zero.
  if (row.changed_paths === null) row.changed_paths = 0;
  if (row.tool_ms === null) row.tool_ms = 0;
  return row;
}

/** Append to the JSONL store only the sessions it does not already carry. */
export function mergeIntoJsonl({ path: file, records }) {
  const known = new Set(readStoreIfPresent(file).map((row) => sessionKeyOf(row.source)));
  const added = records.filter((record) => !known.has(sessionKeyOf(record.source)));
  for (const record of added) appendJsonlSample({ path: file, sample: record });
  return { added: added.length, skipped: records.length - added.length };
}

/** Append to the ledger only the sessions it does not already carry. */
export function mergeIntoLedger({ path: file, records }) {
  const parsed = parseLedger(fs.readFileSync(file, "utf8"));
  if (parsed.error !== undefined) {
    throw new ReconstructRefusal(`${file}: ${parsed.error} (${parsed.detail ?? "no detail"})`);
  }
  const known = new Set(parsed.rows.map((row) => sessionKeyOf(row.source)));
  const added = records.filter((record) => !known.has(sessionKeyOf(record.source)));
  for (const record of added) appendLedgerSample({ ledgerPath: file, sample: ledgerRowOf(record) });
  return { added: added.length, skipped: records.length - added.length };
}

function readStoreIfPresent(file) {
  return fs.existsSync(file) ? readJsonlStore(file) : [];
}

/** The flag grammar each operation accepts; anything else is a refusal. */
const OPERATIONS = Object.freeze({
  stats: { booleans: ["by-model", "by-date", "help"], values: ["project"] },
  samples: { booleans: ["help"], values: ["jsonl", "project"] },
  write: { booleans: ["help"], values: ["jsonl", "ledger"] },
});

/** Parse the closed flag grammar of one operation. */
function parseCommand(argv) {
  const operation = argv[0];
  if (operation === undefined) throw new ReconstructRefusal("expected one of stats, samples, write");
  const grammar = OPERATIONS[operation];
  if (grammar === undefined) throw new ReconstructRefusal(`unknown operation: ${operation} (expected stats, samples, write)`);
  const flags = {};
  for (let index = 1; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) throw new ReconstructRefusal(`unexpected argument: ${arg}`);
    const name = arg.slice(2);
    if (grammar.booleans.includes(name)) {
      flags[name] = true;
      continue;
    }
    if (!grammar.values.includes(name)) throw new ReconstructRefusal(`unknown flag: --${name} (${operation})`);
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new ReconstructRefusal(`--${name} needs a value`);
    flags[name] = value;
    index += 1;
  }
  return { operation, flags };
}

/** A directory the operator named, or the refusal that says it is not one. */
function projectDir(value, cwd) {
  const resolved = path.resolve(cwd, value ?? ".");
  let stat;
  try {
    stat = fs.statSync(resolved);
  } catch {
    throw new ReconstructRefusal(`project not found: ${resolved}`);
  }
  if (!stat.isDirectory()) throw new ReconstructRefusal(`not a directory: ${resolved}`);
  return resolved;
}

/** The write half: plan every append, then apply it — a refusal writes nothing. */
function write(flags, { cwd, env }) {
  const project = projectDir(undefined, cwd);
  const jsonl = path.resolve(cwd, flags.jsonl ?? DEFAULT_JSONL);
  const ledgerDefault = path.resolve(cwd, LEDGER_PATH);
  const ledger = flags.ledger === undefined ? ledgerDefault : path.resolve(cwd, flags.ledger);
  const { records, skipped } = reconstructProject({ agentDir: piAgentDir(env), project });

  // Read every destination first: a malformed store or an explicitly named
  // missing ledger refuses before a single row is appended.
  const jsonlRows = readStoreIfPresent(jsonl);
  const ledgerExists = fs.existsSync(ledger);
  if (!ledgerExists && flags.ledger !== undefined) throw new ReconstructRefusal(`ledger not found: ${ledger}`);
  let ledgerRows = [];
  if (ledgerExists) {
    const parsed = parseLedger(fs.readFileSync(ledger, "utf8"));
    if (parsed.error !== undefined) {
      throw new ReconstructRefusal(`${ledger}: ${parsed.error} (${parsed.detail ?? "no detail"})`);
    }
    ledgerRows = parsed.rows;
  }

  const jsonlKnown = new Set(jsonlRows.map((row) => sessionKeyOf(row.source)));
  const jsonlAdded = records.filter((record) => !jsonlKnown.has(sessionKeyOf(record.source)));
  const ledgerKnown = new Set(ledgerRows.map((row) => sessionKeyOf(row.source)));
  const ledgerAdded = records.filter((record) => !ledgerKnown.has(sessionKeyOf(record.source)));

  for (const record of jsonlAdded) appendJsonlSample({ path: jsonl, sample: record });
  for (const record of ledgerAdded) appendLedgerSample({ ledgerPath: ledger, sample: ledgerRowOf(record) });

  return {
    contract: RECONSTRUCT_CONTRACT_ID,
    project,
    reconstructed: records.length,
    skipped: skipped.length,
    skipped_transcripts: skipped,
    jsonl: { path: jsonl, status: "merged", added: jsonlAdded.length, skipped: records.length - jsonlAdded.length },
    ledger: {
      path: ledger,
      status: ledgerExists ? "merged" : "absent",
      added: ledgerAdded.length,
      skipped: records.length - ledgerAdded.length,
    },
  };
}

/**
 * The CLI entry: `telemetry reconstruct <stats|samples|write> [flags]`.
 *
 * stdout carries the answer (a JSONL dump for `samples` without `--jsonl`, a
 * `telemetry-reconstruct@1` receipt otherwise); stderr carries a refusal and the
 * universal feedback channel's diagnostics. Exit 0 answered · 2 refused.
 */
export function main(argv, { cwd = process.cwd(), env = process.env, stdout = (text) => process.stdout.write(text), stderr = (text) => process.stderr.write(text) } = {}) {
  try {
    if (argv.length === 1 && (argv[0] === "--help" || argv[0] === "-h")) {
      stdout(USAGE);
      return 0;
    }
    if (argv[0] !== "reconstruct") throw new ReconstructRefusal(`expected "reconstruct", got ${JSON.stringify(argv[0] ?? "")}`);
    const { operation, flags } = parseCommand(argv.slice(1));
    if (flags.help === true) {
      stdout(USAGE);
      return 0;
    }

    if (operation === "stats") {
      const project = projectDir(flags.project, cwd);
      const { records, skipped } = reconstructProject({ agentDir: piAgentDir(env), project });
      stdout(`${JSON.stringify(statsOf({ project, records, skipped, byModel: flags["by-model"] === true, byDate: flags["by-date"] === true }), null, 2)}\n`);
      return 0;
    }

    if (operation === "samples") {
      const project = projectDir(flags.project, cwd);
      const { records, skipped } = reconstructProject({ agentDir: piAgentDir(env), project });
      const text = recordsText(records);
      if (flags.jsonl === undefined) {
        stdout(text);
        return 0;
      }
      const file = path.resolve(cwd, flags.jsonl);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
      stdout(`${JSON.stringify({ contract: RECONSTRUCT_CONTRACT_ID, path: file, samples: records.length, skipped: skipped.length })}\n`);
      return 0;
    }

    stdout(`${JSON.stringify(write(flags, { cwd, env }), null, 2)}\n`);
    return 0;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    stderr(`RECONSTRUCT REFUSAL — ${detail}\n`);
    stdout(`${JSON.stringify({ contract: RECONSTRUCT_CONTRACT_ID, error: "refusal", detail })}\n`);
    return 2;
  }
}

// `agentic-workflow telemetry reconstruct` imports this module; running it
// directly is the same command, which keeps a checkout usable without the bin.
if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
