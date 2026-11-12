// log-session-invocation.test.mjs — the invocation becomes a harness fact
// (issue #429, S1/S2/S3/S4; obligations O2, O5, O7, O11, O12, O13).
//
// This is the frozen-failure corpus of the unit: at the cut base the module
// does not exist, so the whole file is the reproducer (O1). What it pins, in the
// order the ledger states it:
//
//  - **The record is written by code.** `/log-session` invoked is a fact on disk
//    before any model turn ran — the failure this unit exists to close was a
//    session that could only *claim* it had run the skill.
//  - **The target is resolved, not derived.** The carrier decides fragment vs
//    append, the fragment name comes from the grammar's owner and equals the
//    crate CLI's own answer for the same second, and the resolver creates
//    nothing.
//  - **Nothing is adopted and nothing is invented.** A record is read only by its
//    own session id; a record that does not parse is not a fact; a project
//    without the writer script is told so, never silently.
//  - **The scratch rule holds.** Every case runs in a `mktemp -d` project and
//    removes it; the live tree is never a fixture (S15).

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  LOG_SESSION_INVOCATION_CONTRACT,
  NO_SESSION_ID,
  WRITER_SCRIPT,
  composeDirective,
  invocationMarkerPath,
  planInvocation,
  readInvocationRecord,
  reconcileInvocation,
  removeInvocationRecord,
  resolveInvocationTarget,
  writeInvocationRecord,
} from "../dist/log-session-invocation.js";

import { sandboxGitEnv } from "./git-sandbox.mjs";
import { JOURNAL_DIR, parseFragmentName } from "@gtrabanco/agentic-workflow/src/journal/fragment.mjs";

const PKG_DIR = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const CLI = path.resolve(PKG_DIR, "..", "agentic-workflow", "bin", "agentic-workflow.mjs");
const SESSION = "429-session";
/** The clock every fixture case pins: a UTC second, so the name is reproducible. */
const NOW = () => Date.parse("2026-11-07T09:00:00Z");

/**
 * A throwaway git project. `journal` writes `docs/LOGS.md`, `carrier` creates the
 * fragment directory — the two opt-ins are independent, exactly as the shipped
 * writers treat them.
 */
function project({ journal = false, carrier = false, commit = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "log-session-invocation-"));
  const git = (args) => execFileSync("git", ["-c", "user.name=suite", "-c", "user.email=suite@example.test", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8", env: sandboxGitEnv() });
  git(["init", "-q", "-b", "test-branch"]);
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  if (journal) fs.writeFileSync(path.join(root, "docs/LOGS.md"), "# Session log\n\nentry bytes\n");
  if (carrier) fs.mkdirSync(path.join(root, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(root, "seed.txt"), "seed\n");
  if (commit) {
    git(["add", "."]);
    git(["commit", "-q", "-m", "seed"]);
  }
  return { root, git };
}

const cleanup = (root) => fs.rmSync(root, { recursive: true, force: true });

/** `YYYYMMDDTHHMMSSZ` (the fragment name's second) → the same instant in ms. */
function secondToMillis(second) {
  return Date.parse(
    `${second.slice(0, 4)}-${second.slice(4, 6)}-${second.slice(6, 8)}T${second.slice(9, 11)}:${second.slice(11, 13)}:${second.slice(13, 15)}Z`,
  );
}

/** The fixture journal's bytes back, or "" when the project has none. */
const journalOf = (root) => {
  try {
    return fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8");
  } catch {
    return "";
  }
};

// ---------------------------------------------------------------------------
// O2 — the record is written by the handler, before any turn runs (S1, S2, AC1)
// ---------------------------------------------------------------------------

test("O2: the record is written by the handler, and every fact it holds came from code", () => {
  const { root } = project({ journal: true });
  try {
    const { record, directive } = planInvocation({ root, sessionId: SESSION, now: NOW });
    const file = invocationMarkerPath(root, SESSION);

    assert.equal(record.contract, LOG_SESSION_INVOCATION_CONTRACT);
    assert.equal(record.session, SESSION);
    assert.equal(record.invokedAt, "2026-11-07T09:00:00Z");
    assert.equal(record.target, "append");
    assert.equal(record.path, "docs/LOGS.md");
    assert.equal(record.baseline.journalBytes, Buffer.byteLength(journalOf(root), "utf8"));
    assert.equal(fs.existsSync(file), true, "the record is on disk, not in a model's account of the turn");
    assert.equal(readInvocationRecord(root, SESSION)?.path, "docs/LOGS.md", "the record reads back as written");
    assert.match(directive, /docs\/LOGS\.md/, "the directive names the resolved target");
    assert.deepEqual(
      fs.readdirSync(path.join(root, ".pi")).sort(),
      [`.session-${SESSION}.log-session`],
      "the record is the only file the handler put down",
    );
  } finally {
    cleanup(root);
  }
});

test("O2: the record lives beside the #394 start marker, in the package's own project directory", () => {
  const { root } = project({ journal: true });
  try {
    fs.mkdirSync(path.join(root, ".pi"), { recursive: true });
    fs.writeFileSync(path.join(root, ".pi", `.session-${SESSION}.start`), "abc1234 1760000000 2026-11-07T09:00Z\n");
    const { record } = planInvocation({ root, sessionId: SESSION, now: NOW });

    assert.equal(
      path.dirname(invocationMarkerPath(root, SESSION)),
      path.dirname(path.join(root, ".pi", `.session-${SESSION}.start`)),
    );
    assert.notEqual(record.path, undefined);
    assert.equal(
      fs.readFileSync(path.join(root, ".pi", `.session-${SESSION}.start`), "utf8"),
      "abc1234 1760000000 2026-11-07T09:00Z\n",
      "the start marker is not this record's to touch",
    );
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// O5 — the carrier routing and the fragment name (S3, AC3)
// ---------------------------------------------------------------------------

test("O5: with the fragment carrier present the target is a conforming fragment name", () => {
  const { root } = project({ journal: true, carrier: true });
  try {
    const target = resolveInvocationTarget({ root, sessionId: SESSION, now: NOW });
    assert.equal(target.target, "fragment");
    assert.match(target.path, new RegExp(`^${JOURNAL_DIR}/`), "the carrier is the directory the grammar names");

    const parsed = parseFragmentName(path.basename(target.path));
    assert.ok(parsed, `${target.path} is not a fragment name`);
    assert.equal(parsed.kind, "narrative");
    assert.equal(parsed.branch, "test-branch");
    assert.equal(parsed.sessionId, SESSION);
  } finally {
    cleanup(root);
  }
});

test("O5: the name the handler resolves is the crate CLI's own answer for the same second", () => {
  const { root } = project({ journal: true, carrier: true });
  try {
    // The oracle first: `journal name` prints `<dir>/<name>` from the grammar's
    // owner. Its clock is its own, so the identity the handler must match is
    // taken from the oracle's answer rather than assumed.
    const answer = spawnSync(process.execPath, [CLI, "journal", "name", "--kind", "narrative", "--dir", root, "--session", SESSION], {
      encoding: "utf8",
      env: sandboxGitEnv(),
    });
    assert.equal(answer.status, 0, `journal name exited ${answer.status}: ${answer.stderr}`);
    const cliPath = answer.stdout.trim();
    const parsed = parseFragmentName(path.basename(cliPath));
    assert.ok(parsed, `${cliPath} is not a fragment name`);

    const handler = resolveInvocationTarget({ root, sessionId: SESSION, now: () => secondToMillis(parsed.timestamp) });

    assert.equal(handler.path, cliPath, "one grammar owner means byte-identical paths, never two shapes that agree in principle");
  } finally {
    cleanup(root);
  }
});

test("O5: without the carrier the target is the docs/LOGS.md append the issue names", () => {
  const { root } = project({ journal: true });
  try {
    const target = resolveInvocationTarget({ root, sessionId: SESSION, now: NOW });
    assert.equal(target.target, "append");
    assert.equal(target.path, "docs/LOGS.md");
    const { directive } = planInvocation({ root, sessionId: SESSION, now: NOW });
    assert.equal(directive.includes(JOURNAL_DIR), false, "no fragment path is named at a project that did not opt in");
    assert.match(directive, /append to the end of docs\/LOGS\.md/);
  } finally {
    cleanup(root);
  }
});

test("O5: the resolver creates nothing — no carrier directory, no journal, no entry", () => {
  const { root } = project({ journal: false, carrier: false });
  try {
    const { record } = planInvocation({ root, sessionId: SESSION, now: NOW });
    assert.equal(record.target, "append");
    assert.equal(record.baseline.journalBytes, null, "an absent journal is a recorded absence, never a zero-byte fiction");
    assert.equal(fs.existsSync(path.join(root, JOURNAL_DIR)), false);
    assert.equal(fs.existsSync(path.join(root, "docs/LOGS.md")), false, "the project creates its journal once; the handler never does it silently");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// O7 — the record is keyed by its own session and never adopted
// ---------------------------------------------------------------------------

test("O7: another session's record is neither read nor removed", () => {
  const { root } = project({ journal: true });
  try {
    const foreign = planInvocation({ root, sessionId: "crashed-session", now: NOW }).record;
    const foreignFile = invocationMarkerPath(root, "crashed-session");
    assert.equal(fs.existsSync(foreignFile), true);

    assert.equal(readInvocationRecord(root, SESSION), null, "a record is read by the invoking session id only");
    const mine = planInvocation({ root, sessionId: SESSION, now: NOW });
    assert.equal(mine.record.path, foreign.path, "two sessions of one project resolve the same append target");

    assert.equal(reconcileInvocation(root, SESSION).status, "missing", "this session is reported, the foreign one is not");
    assert.equal(fs.existsSync(foreignFile), true, "and no reconcile of another session clears or adopts its record");
    assert.equal(reconcileInvocation(root, undefined).status, "none", "and the fallback id is its own key, never a scan of the directory");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// O12 — the host named no session id
// ---------------------------------------------------------------------------

test("O12: with no session id the fallback path is named, not left anonymous", () => {
  const { root } = project({ journal: true });
  try {
    const { record, directive } = planInvocation({ root, sessionId: undefined, now: NOW });
    assert.equal(record.session, NO_SESSION_ID);
    const file = invocationMarkerPath(root, NO_SESSION_ID);
    assert.equal(fs.existsSync(file), true);
    assert.match(directive, /\.pi\/\.session-unknown\.log-session/, "the operator reads the exact path the record fell at");
    assert.equal(readInvocationRecord(root, undefined)?.session, NO_SESSION_ID, "reading it back follows the same rule");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// O11 — a project that ships no writer script
// ---------------------------------------------------------------------------

test("O11: with no writer script the absence is named, never papered over", () => {
  const { root } = project({ journal: true });
  try {
    const { record, directive } = planInvocation({ root, sessionId: SESSION, now: NOW });
    assert.equal(record.writer, "absent");
    assert.equal(record.facts, null, "no facts are claimed for a writer that is not there");
    assert.match(directive, new RegExp(WRITER_SCRIPT.replace(".mjs", "\\.mjs")), "the missing script is named by path");
    assert.match(directive, /Process step 2|Process step 2/, "and the prose door's own step is pointed at");
    assert.match(directive, /not computed/, "never a silent gap in the entry's facts");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// O6 (state half) — did an entry land where the directive pointed?
// ---------------------------------------------------------------------------

test("O6: the miss, the exact entry, another new fragment and the grown journal are four different answers", () => {
  const miss = project({ journal: true });
  const exact = project({ journal: true, carrier: true });
  const other = project({ journal: true, carrier: true });
  const grew = project({ journal: true });
  const created = project({ journal: false });
  try {
    const a = planInvocation({ root: miss.root, sessionId: SESSION, now: NOW });
    assert.equal(reconcileInvocation(miss.root, SESSION).status, "missing", "invoked and nothing written is a named state");
    assert.equal(fs.existsSync(invocationMarkerPath(miss.root, SESSION)), true, "and the record survives the miss");

    const b = planInvocation({ root: exact.root, sessionId: SESSION, now: NOW });
    fs.writeFileSync(path.join(exact.root, b.record.path), `## 2026-11-07T09:00:00Z — test-branch — manual\n- **Summary:** wrote it\n`);
    assert.equal(reconcileInvocation(exact.root, SESSION).status, "landed");
    assert.equal(fs.existsSync(invocationMarkerPath(exact.root, SESSION)), false, "a delivered invocation leaves no record behind");

    const c = planInvocation({ root: other.root, sessionId: SESSION, now: NOW });
    fs.writeFileSync(
      path.join(other.root, JOURNAL_DIR, "20261107T090001Z-test-branch-narrative-other-session.md"),
      "## 2026-11-07T09:00:01Z — test-branch — manual\n- **Summary:** another name\n",
    );
    assert.equal(reconcileInvocation(other.root, SESSION).status, "landed", "an entry under another conforming name is still the entry that was asked for");

    const d = planInvocation({ root: grew.root, sessionId: SESSION, now: NOW });
    fs.appendFileSync(path.join(grew.root, "docs/LOGS.md"), "\n## 2026-11-07T09:00:00Z — test-branch — manual\n- **Summary:** appended\n");
    assert.equal(reconcileInvocation(grew.root, SESSION).status, "landed");
    assert.equal(d.record.baseline.journalBytes, Buffer.byteLength("# Session log\n\nentry bytes\n", "utf8"));

    const e = planInvocation({ root: created.root, sessionId: SESSION, now: NOW });
    assert.equal(reconcileInvocation(created.root, SESSION).status, "missing", "an absent journal is not a delivered entry");
    fs.writeFileSync(path.join(created.root, "docs/LOGS.md"), "# Session log\n\n");
    assert.equal(reconcileInvocation(created.root, SESSION).status, "missing", "creating the journal is step 0, not the entry");
    fs.appendFileSync(path.join(created.root, "docs/LOGS.md"), "## 2026-11-07T09:00:00Z — test-branch — manual\n- **Summary:** first entry\n");
    assert.equal(reconcileInvocation(created.root, SESSION).status, "landed", "the first entry the project creates counts");
  } finally {
    cleanup(miss.root);
    cleanup(exact.root);
    cleanup(other.root);
    cleanup(grew.root);
    cleanup(created.root);
  }
});

test("O6: a record that does not parse is not a fact, and it is not repaired", () => {
  const { root } = project({ journal: true });
  try {
    const file = invocationMarkerPath(root, SESSION);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "{ not the record shape\n");
    assert.equal(readInvocationRecord(root, SESSION), null);

    const other = invocationMarkerPath(root, "second-session");
    fs.writeFileSync(other, JSON.stringify({ contract: "log-session-invocation@9", session: "second-session", path: "docs/LOGS.md", target: "append", baseline: { journalBytes: 0, fragments: 0 } }));
    assert.equal(readInvocationRecord(root, "second-session"), null, "an unknown contract is refused, not guessed at");
  } finally {
    cleanup(root);
  }
});

// ---------------------------------------------------------------------------
// The record's own surface
// ---------------------------------------------------------------------------

test("the record is one JSON line whose every field is code's, and removeInvocationRecord takes only this session's", () => {
  const { root } = project({ journal: true, carrier: true });
  try {
    const { record } = planInvocation({ root, sessionId: SESSION, now: NOW });
    const file = invocationMarkerPath(root, SESSION);
    const raw = fs.readFileSync(file, "utf8");
    assert.equal(raw.endsWith("\n"), true);
    assert.equal(raw.split("\n").length, 2, "one line, one record");
    assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), Object.keys(record).sort());

    removeInvocationRecord(root, SESSION);
    assert.equal(fs.existsSync(file), false);
    assert.equal(fs.readFileSync(writeInvocationRecord(root, record), "utf8"), raw, "the store round-trips its own bytes");

    removeInvocationRecord(root, "another-session");
    assert.equal(fs.existsSync(file), true, "a removal names the session it clears");
    removeInvocationRecord(root, SESSION);
    assert.equal(fs.existsSync(file), false);
  } finally {
    cleanup(root);
  }
});

test("composeDirective names the resolved target, the record path and the writer's answer", () => {
  const { root } = project({ journal: true, carrier: true });
  try {
    const { record, directive } = planInvocation({ root, sessionId: SESSION, now: NOW });
    assert.equal(composeDirective(readInvocationRecord(root, SESSION)), directive, "the directive is a function of the record, not of the call that wrote it");
    assert.match(directive, new RegExp(record.path.replace(/[/.]/g, (c) => `\\${c}`)), "the exact path the entry must land at");
    assert.match(directive, /\.pi\/\.session-429-session\.log-session/);
    assert.match(directive, /Summary/, "the prose cells are the model's, and only those");
    assert.equal(directive.includes("## 2026-11-07T09:00:00Z — test-branch — manual"), false, "the handler renders no narrative bytes of its own (S11)");
  } finally {
    cleanup(root);
  }
});
