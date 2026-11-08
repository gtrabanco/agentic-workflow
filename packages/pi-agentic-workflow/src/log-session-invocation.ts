/**
 * log-session-invocation.ts — the `/log-session` invocation as a fact the
 * harness holds (issue #429, S1/S2/S3/S4; obligations O2, O5, O6, O7, O11, O12).
 *
 * A skill invocation in pi is a context injection: nothing behind the slash
 * executes, so a model can read `/log-session` and *narrate* it. The mechanical
 * half of that skill was already code (`session-close.mjs`, the crate's
 * `journal name`, `autoLogSession`); this module anchors the remaining three
 * things a claim used to cover:
 *
 *  - **that the command ran** — `.pi/.session-<id>.log-session`, written by the
 *    handler, keyed by the session that invoked it, and never found by scanning
 *    the directory (the rule #394 states for its own start marker);
 *  - **where the entry must land** — the fragment carrier's own grammar decides
 *    the name, the journal is the fallback, and the resolver creates nothing;
 *  - **whether anything landed at all** — `reconcileInvocation` answers `landed`
 *    / `missing` / `unreadable` / `none` from the record's own baseline.
 *
 * **What it deliberately does not own.** The entry's bytes. `scripts/session-close.mjs`
 * renders them and `skills/log-session/SKILL.md` states the procedure; feature
 * 66's two-writer split and the ownership map's one-writer rule both hold, so
 * the handler runs the writer, records its answer verbatim and asks for the
 * prose cells — it never re-formats a line and never writes the journal. Where
 * the project ships no writer script, the absence is stated rather than
 * improvised around (O11).
 *
 * Pi-free on purpose, like `auto-log-session.ts`: git, the filesystem and an
 * injected spawn are the only inputs, so every branch here is a unit test with
 * no session.
 */

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { fragmentName, JOURNAL_DIR } from "@gtrabanco/agentic-workflow/src/journal/fragment.mjs";

import { FRAGMENT_DIR, JOURNAL_PATH, MARKER_DIR, sandboxGitEnv } from "./auto-log-session.js";
import { runtimeBin, runtimeEnv } from "./runtime.js";
import type { GitReader } from "./auto-log-session.js";

/** The contract id of the record this module writes and reads. */
export const LOG_SESSION_INVOCATION_CONTRACT = "log-session-invocation@1";

/** The script the prose door already names, relative to the project root. */
export const WRITER_SCRIPT = "scripts/session-close.mjs";

/** The key the record falls back to when the host named no session id (O12). */
export const NO_SESSION_ID = "unknown";

/** How long the writer's facts run may take before the answer is "absent". */
export const WRITER_TIMEOUT_MS = 5000;

/** The record's own suffix, beside #394's `.start` marker in the same directory. */
const RECORD_SUFFIX = ".log-session";

/** The shape the writer answered with. */
export type WriterAnswer =
  | { writer: "script"; facts: string }
  | { writer: "absent"; facts: null; reason: string };

/** The transport the carrier decided, and the exact file the entry must land at. */
export interface InvocationTarget {
  readonly target: "fragment" | "append";
  /** Project-relative path of the entry's destination. */
  readonly path: string;
  /** The fragment name's basename, absent in append mode. */
  readonly name?: string;
  /** The journal this project's entries belong to, relative to the root. */
  readonly journal: string;
}

/** The record: the invocation as the harness holds it. */
export interface InvocationRecord extends InvocationTarget {
  readonly contract: typeof LOG_SESSION_INVOCATION_CONTRACT;
  readonly session: string;
  /** UTC second of the invocation (`YYYY-MM-DDTHH:MM:SSZ`). */
  readonly invokedAt: string;
  readonly writer: "script" | "absent";
  /** The writer's own stdout, byte for byte — `null` when it is not there. */
  readonly facts: string | null;
  readonly reason?: string;
  readonly baseline: { readonly journalBytes: number | null; readonly fragments: number };
}

/** A settled turn's four answers about one invocation. */
export type InvocationReconciliation =
  | { status: "none" }
  | { status: "landed"; path: string }
  | { status: "missing"; notice: string }
  | { status: "unreadable"; notice: string };

/** The spawn the writer run uses, injected so a suite can own argv, env and exit. */
export type WriterSpawn = (
  bin: string,
  args: readonly string[],
  options: { cwd: string; encoding: "utf8"; timeout: number; env: NodeJS.ProcessEnv },
) => { status: number | null; stdout: string; stderr: string; error?: Error };

/** The session id the record is keyed by, or the declared fallback (O12). */
export function sessionIdOf(sessionId: string | undefined): string {
  const trimmed = typeof sessionId === "string" ? sessionId.trim() : "";
  return trimmed === "" ? NO_SESSION_ID : trimmed;
}

/**
 * The record's path: beside the `.start` marker, in the package's own
 * project-scoped directory, and namespaced by one session id.
 */
export function invocationMarkerPath(root: string, sessionId: string | undefined): string {
  return path.join(root, MARKER_DIR, `.session-${sessionIdOf(sessionId)}${RECORD_SUFFIX}`);
}

/** `YYYY-MM-DDTHH:MM:SSZ` — the narrative entry's own second precision. */
function utcSecond(epochMs: number): string {
  return new Date(epochMs).toISOString().replace(/\.\d{3}Z$/u, "Z");
}

/** The branch a human would name, or `detached` — the writer's rule, not a new one. */
function currentBranch(git: GitReader): string {
  const branch = (git(["branch", "--show-current"]) ?? "").trim();
  return branch !== "" ? branch : "detached";
}

/** The project's git, with no ambient location variables inherited (the #394 rule). */
function gitReader(root: string): GitReader {
  return (args) => readGit(root, args);
}

/** `git` in the project, with no ambient location variables inherited. */
function readGit(root: string, args: readonly string[]): string | null {
  try {
    const result = spawnSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      env: sandboxGitEnv(),
      timeout: 5000,
    });
    if (result.error || result.status !== 0) return null;
    return result.stdout ?? null;
  } catch {
    return null;
  }
}

/** Whether the project opted into the fragment carrier — its presence is the opt-in. */
function carrierPresent(root: string): boolean {
  try {
    return fs.statSync(path.join(root, FRAGMENT_DIR)).isDirectory();
  } catch {
    return false;
  }
}

/** The carrier's current file count — the baseline a later fragment is measured against. */
function fragmentCount(root: string): number {
  try {
    return fs.readdirSync(path.join(root, FRAGMENT_DIR)).filter((name) => {
      try {
        return fs.statSync(path.join(root, FRAGMENT_DIR, name)).isFile();
      } catch {
        return false;
      }
    }).length;
  } catch {
    return 0;
  }
}

function journalBytes(root: string, journal: string): number | null {
  try {
    return fs.statSync(path.join(root, journal)).size;
  } catch {
    return null;
  }
}

/**
 * Where this session's entry must go (S3, AC3). The carrier outranks the
 * journal, exactly as `#394`'s publisher and `session-close.mjs close` treat
 * it, and the name comes from the grammar's one owner — `fragmentName`, the
 * same function the crate's `journal name` CLI prints. Nothing here is created:
 * a resolver that made the carrier real would be an opt-in nobody consented to.
 */
export function resolveInvocationTarget(options: {
  root: string;
  sessionId?: string;
  now?: () => number;
  git?: GitReader;
}): InvocationTarget {
  const root = options.root;
  const now = (options.now ?? Date.now)();
  const git = options.git ?? gitReader(root);
  const journal = JOURNAL_PATH;
  if (!carrierPresent(root)) {
    return { target: "append", path: journal, journal };
  }
  const name = fragmentName({
    timestamp: now,
    branch: currentBranch(git),
    kind: "narrative",
    sessionId: sessionIdOf(options.sessionId),
  });
  return { target: "fragment", path: `${JOURNAL_DIR}/${name}`, name, journal };
}

/**
 * The writer's own answer for this session (S3, AC2): run
 * `session-close.mjs render --kind auto`, which prints the heading and the
 * `Commits`/`Files` lines and requires no prose. The bytes are returned
 * untouched — the handler is a caller of the writer, never a second renderer,
 * and an absence is reported with the reason that produced it.
 */
export function readWriterFacts(options: {
  root: string;
  bin?: string;
  run?: WriterSpawn;
  timeoutMs?: number;
}): WriterAnswer {
  const root = options.root;
  const script = path.join(root, WRITER_SCRIPT);
  if (!fs.existsSync(script)) {
    return { writer: "absent", facts: null, reason: `no writer script at ${WRITER_SCRIPT}` };
  }
  const run = options.run ?? defaultSpawn;
  const bin = options.bin ?? runtimeBin();
  const timeoutMs = options.timeoutMs ?? WRITER_TIMEOUT_MS;
  const result = run(bin, [script, "render", "--kind", "auto"], {
    cwd: root,
    encoding: "utf8",
    timeout: timeoutMs,
    env: { ...sandboxGitEnv(), ...runtimeEnv() },
  });
  if (result?.error) {
    return { writer: "absent", facts: null, reason: `${WRITER_SCRIPT} could not run: ${result.error.message}` };
  }
  if (result.status !== 0) {
    const detail = String(result.stderr ?? "").trim() || String(result.stdout ?? "").trim();
    return { writer: "absent", facts: null, reason: `${WRITER_SCRIPT} exited ${result.status}${detail ? `: ${detail}` : ""}` };
  }
  return { writer: "script", facts: String(result.stdout ?? "") };
}

function defaultSpawn(
  bin: string,
  args: readonly string[],
  options: { cwd: string; encoding: "utf8"; timeout: number; env: NodeJS.ProcessEnv },
) {
  return spawnSync(bin, [...args], options) as unknown as {
    status: number | null;
    stdout: string;
    stderr: string;
    error?: Error;
  };
}

/**
 * Did an entry land where the record pointed? (S4, AC4's other half.)
 *
 *  - fragment mode: the exact resolved file, or a new fragment in the carrier —
 *    an entry under another conforming name is still the entry that was asked
 *    for, and refusing it would report a delivered session as a miss;
 *  - append mode: the journal grew, or a project that had no journal grew an
 *    actual `## ` entry block (creating the file alone is step 0, not an entry).
 */
export function entryWritten(root: string, record: InvocationRecord): boolean {
  if (record.target === "fragment") {
    if (fs.existsSync(path.join(root, record.path))) return true;
    return fragmentCount(root) > record.baseline.fragments;
  }
  const size = journalBytes(root, record.journal);
  if (record.baseline.journalBytes === null) {
    if (size === null) return false;
    try {
      return /^## /m.test(fs.readFileSync(path.join(root, record.journal), "utf8"));
    } catch {
      return false;
    }
  }
  return size !== null && size > record.baseline.journalBytes;
}

/** Write the record. Returns the path it landed at; a failure is the caller's to report. */
export function writeInvocationRecord(root: string, record: InvocationRecord): string {
  const file = invocationMarkerPath(root, record.session);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(record)}\n`);
  return file;
}

/** The record back, or `null` when it is absent, unreadable or of another contract. */
export function readInvocationRecord(root: string, sessionId?: string): InvocationRecord | null {
  let text: string;
  try {
    text = fs.readFileSync(invocationMarkerPath(root, sessionId), "utf8");
  } catch {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  const record = parsed as Partial<InvocationRecord>;
  if (record?.contract !== LOG_SESSION_INVOCATION_CONTRACT) return null;
  if (typeof record.session !== "string" || typeof record.path !== "string") return null;
  if (record.target !== "fragment" && record.target !== "append") return null;
  if (typeof record.baseline?.journalBytes !== "number" && record.baseline?.journalBytes !== null) return null;
  if (typeof record.baseline?.fragments !== "number") return null;
  return record as InvocationRecord;
}

/** Remove one session's record. Never another's, never by scanning. */
export function removeInvocationRecord(root: string, sessionId?: string): void {
  try {
    fs.rmSync(invocationMarkerPath(root, sessionId), { force: true });
  } catch {
    // A record that cannot be removed is inert: it names itself when read.
  }
}

/**
 * The directive the model receives (S3): the resolved values and the writer's
 * answer, so the only thing left to supply is prose. Procedure stays the skill's
 * — this names targets and steps by number, never restates their rules.
 */
export function composeDirective(record: InvocationRecord): string {
  const fragment = record.target === "fragment";
  const lines = [
    "/log-session — the extension command ran: the invocation is recorded and the mechanical work is done. The prose is the only part left to you.",
    "",
    `Record: .pi/.session-${record.session}${RECORD_SUFFIX} (${record.contract}, invoked ${record.invokedAt})`,
  ];
  if (fragment) {
    // The one writer both doors name (issue #452 S1): the carrier's CLI takes
    // the prose fields, computes the name, the timestamp and the bytes, and
    // refuses a fragment the aggregator could not read. The resolved path is
    // still stated because it is what the settled turn reconciles against.
    lines.push(
      `Entry target — the fragment carrier is opted in: hand the entry to its writer, which computes the name and bytes, and never touch ${record.journal}:`,
    );
    lines.push(
      `agentic-workflow journal write --kind narrative --session ${record.session} --summary "<your Summary>" [--decisions "<…>"] [--next "<…>"]`,
    );
    lines.push(`Run at this second it lands at ${record.path}; the CLI never overwrites a collision.`);
  } else {
    lines.push(`Entry target — append to the end of ${record.journal} (never a past entry):`);
    lines.push(record.path);
  }
  lines.push("");
  if (record.writer === "script" && record.facts !== null) {
    lines.push("Session facts, from the project's own writer at invocation (`" + WRITER_SCRIPT + " render --kind auto`):");
    lines.push(record.facts.trimEnd());
    lines.push("");
    lines.push(
      fragment
        ? `Run the skill's Process steps 3 and 5 with these values: write the entry with your Summary, Decisions and Next through the command above, then run \`${WRITER_SCRIPT} close\`.`
        : `Run the skill's Process steps 3–5 with these values: render the entry with your Summary, Decisions and Next, save it at the exact target path above, then run \`${WRITER_SCRIPT} close\`.`,
    );
  } else {
    lines.push(
      `Writer: \`${WRITER_SCRIPT}\` is absent from this project${record.reason ? ` (${record.reason})` : ""}, so its facts were not computed here.`,
    );
    lines.push(
      fragment
        ? "Gather the mechanical facts yourself per the skill's Process step 2 (git), then write the Summary, Decisions and Next through the command above."
        : "Gather the mechanical facts yourself per the skill's Process step 2 (git), then follow its steps 4–5 to write the Summary, Decisions and Next at the target above.",
    );
  }
  lines.push("");
  lines.push("Do not describe this skill. Run it, and end the turn with its closing block.");
  return `${lines.join("\n")}\n`;
}

/**
 * One call, one invocation: resolve, ask the writer, record, and hand back the
 * directive the model receives. Purity by construction — nothing in the project
 * changes except the record file itself (O13).
 */
export function planInvocation(options: {
  root: string;
  sessionId?: string;
  now?: () => number;
  git?: GitReader;
  bin?: string;
  run?: WriterSpawn;
}): { record: InvocationRecord; directive: string } {
  const session = sessionIdOf(options.sessionId);
  const nowFn = options.now ?? Date.now;
  const instant = nowFn();
  const target = resolveInvocationTarget({ root: options.root, sessionId: session, now: nowFn, git: options.git });
  const answer = readWriterFacts({ root: options.root, bin: options.bin, run: options.run });
  const record: InvocationRecord = {
    contract: LOG_SESSION_INVOCATION_CONTRACT,
    session,
    invokedAt: utcSecond(instant),
    target: target.target,
    path: target.path,
    ...(target.name !== undefined ? { name: target.name } : {}),
    journal: target.journal,
    writer: answer.writer,
    facts: answer.facts,
    ...("reason" in answer && answer.reason !== undefined ? { reason: answer.reason } : {}),
    baseline: {
      journalBytes: journalBytes(options.root, target.journal),
      fragments: fragmentCount(options.root),
    },
  };
  writeInvocationRecord(options.root, record);
  return { record, directive: composeDirective(record) };
}

/**
 * The settled turn's answer about this session's invocation (S4, AC4): silence
 * is the one outcome this function is not allowed to produce for a session that
 * asked to be logged. A delivered entry clears the record; a missing one names
 * the path it waited for; a record that does not parse is named and left alone,
 * because a guess about it would be the claim this unit removed.
 */
export function reconcileInvocation(root: string, sessionId?: string): InvocationReconciliation {
  const file = invocationMarkerPath(root, sessionId);
  if (!fs.existsSync(file)) return { status: "none" };
  const record = readInvocationRecord(root, sessionId);
  if (record === null) {
    return {
      status: "unreadable",
      notice:
        `/log-session recorded an invocation this session, but its record at .pi/.session-${sessionIdOf(sessionId)}${RECORD_SUFFIX} does not parse — it cannot be verified, so nothing was cleared. Write the entry, or remove that file if this session is not being logged.`,
    };
  }
  if (entryWritten(root, record)) {
    removeInvocationRecord(root, record.session);
    return { status: "landed", path: record.path };
  }
  return {
    status: "missing",
    notice:
      `/log-session was invoked at ${record.invokedAt} and no entry was written — the target it resolved was ${record.path}${record.writer === "absent" ? " (the writer script was absent, so its facts were never computed)" : ""}. Run /log-session again or write the entry before this session closes.`,
  };
}
