/**
 * log.publish.test.mjs — the publisher Strategy (feature #394, S3/S10).
 *
 * Two strategies ship here and the interface is the third thing:
 *
 *  - **journal** — appends the rendered entry to the project's `docs/LOGS.md`.
 *    A missing journal means the project did not opt in, so nothing is created
 *    (S9), and the append is one `O_APPEND` write of `\n` + the entry.
 *  - **command** — the config-declared backend: the operator names an argv and
 *    the publisher hands the frozen payload to it on stdin. That is how an HTTP
 *    endpoint, a queue or a path outside the repo is reached without one line of
 *    network code in this package (S3).
 *  - **the fan-out** — `publishAll` runs them in order, never throws, and never
 *    lets one failure cost another its delivery (S10). There is no retry and no
 *    queue: both would be incidental semantics, so they are declared absent.
 *
 * Every case below asserts on bytes or on a child process's exit, never on a
 * promise about intent: the payload a publisher receives is the *frozen* facts,
 * not prose it would have to re-parse.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { renderEntry } from "../src/log/render.mjs";
import {
  DEFAULT_JOURNAL,
  DEFAULT_PUBLISH_TIMEOUT_MS,
  createCommandPublisher,
  createJournalPublisher,
  createPublisherFromConfig,
  publishAll,
} from "../src/log/publish.mjs";

const FACTS = {
  timestamp: "2026-11-04T15:12Z",
  branch: "feat/394-auto-log-session",
  reason: "quit",
  commits: { count: 2, range: "1a2b3c4d…9e8f7a6b" },
  files: ["docs/LOGS.md"],
};

/** A throwaway project with an optional journal, cleaned by the caller. */
function project({ journal = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "log-publish-"));
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  if (journal) fs.writeFileSync(path.join(root, DEFAULT_JOURNAL), "# Session log\n\n");
  return root;
}

/* ── the journal strategy ──────────────────────────────────────────────── */

test("LPB-01 the journal strategy appends one leading newline plus the rendered entry", () => {
  const root = project();
  const journalPath = path.join(root, DEFAULT_JOURNAL);
  const before = fs.readFileSync(journalPath, "utf8");
  const publisher = createJournalPublisher({ journalPath });
  const result = publisher.publish(FACTS);
  assert.equal(result.written, true);
  assert.equal(publisher.name, "journal");
  assert.equal(fs.readFileSync(journalPath, "utf8"), `${before}\n${renderEntry(FACTS)}`);
  fs.rmSync(root, { recursive: true, force: true });
});

test("LPB-02 a missing journal is a project that did not opt in: nothing is created", () => {
  const root = project({ journal: false });
  const journalPath = path.join(root, DEFAULT_JOURNAL);
  const result = createJournalPublisher({ journalPath }).publish(FACTS);
  assert.equal(result.written, false);
  assert.equal(result.skipped, "no-journal");
  assert.equal(fs.existsSync(journalPath), false, "publishing must never create the journal");
  fs.rmSync(root, { recursive: true, force: true });
});

/* ── the config-declared command strategy ──────────────────────────────── */

/** A script that records its stdin to `<out>` and exits with `code`. */
function recorder(dir, { code = 0, delayMs = 0 } = {}) {
  const out = path.join(dir, "stdin.json");
  const script = path.join(dir, "recorder.mjs");
  const body =
    `import fs from "node:fs";\n` +
    `let data = "";\n` +
    `process.stdin.setEncoding("utf8");\n` +
    `for await (const chunk of process.stdin) data += chunk;\n` +
    (delayMs > 0 ? `await new Promise((r) => setTimeout(r, ${delayMs}));\n` : "") +
    `fs.writeFileSync(${JSON.stringify(out)}, data);\n` +
    `process.exit(${code});\n`;
  fs.writeFileSync(script, body);
  return { command: [process.execPath, script], out };
}

test("LPB-03 the command strategy hands the frozen payload to the declared argv on stdin", () => {
  const root = project();
  const { command, out } = recorder(root);
  const result = createCommandPublisher({ command, cwd: root }).publish(FACTS);
  assert.equal(result.ok, true);
  assert.equal(fs.readFileSync(out, "utf8"), `${JSON.stringify(FACTS)}\n`);
  fs.rmSync(root, { recursive: true, force: true });
});

test("LPB-04 both strategies receive the same payload bytes — no prose, one shape", () => {
  const root = project();
  const { command, out } = recorder(root);
  const journalPath = path.join(root, DEFAULT_JOURNAL);
  createJournalPublisher({ journalPath }).publish(FACTS);
  createCommandPublisher({ command, cwd: root }).publish(FACTS);
  const payload = fs.readFileSync(out, "utf8");
  assert.equal(payload.includes("## "), false, "a publisher must never receive the rendered entry");
  assert.deepEqual(JSON.parse(payload), FACTS);
  // The journal's entry is a rendering OF that payload, not a second payload.
  assert.equal(fs.readFileSync(journalPath, "utf8"), `# Session log\n\n\n${renderEntry(FACTS)}`);
  fs.rmSync(root, { recursive: true, force: true });
});

test("LPB-05 an empty or malformed command is refused at construction, not at shutdown", () => {
  for (const command of [[], [""], undefined, "curl https://example.test", [42]]) {
    assert.throws(() => createCommandPublisher({ command, cwd: "/tmp" }), /command/u);
  }
  assert.equal(DEFAULT_PUBLISH_TIMEOUT_MS, 5000);
});

test("LPB-06 a non-zero exit is a reported failure — never a throw, never a retry", () => {
  const root = project();
  const { command } = recorder(root, { code: 3 });
  const publisher = createCommandPublisher({ command, cwd: root });
  const result = publisher.publish(FACTS);
  assert.equal(result.ok, false);
  assert.match(result.error, /exited 3/u);
  fs.rmSync(root, { recursive: true, force: true });
});

test("LPB-07 a command that cannot be spawned is a reported failure, not an exception", () => {
  const root = project();
  const result = createCommandPublisher({ command: [path.join(root, "nope"), "x"], cwd: root }).publish(FACTS);
  assert.equal(result.ok, false);
  assert.match(result.error, /nope|ENOENT/u);
  fs.rmSync(root, { recursive: true, force: true });
});

test("LPB-08 the declared timeout bounds the child, and a timed-out command fails without throwing", () => {
  const root = project();
  const { command } = recorder(root, { delayMs: 1500 });
  const result = createCommandPublisher({ command, cwd: root, timeoutMs: 200 }).publish(FACTS);
  assert.equal(result.ok, false);
  assert.match(result.error, /timed out after 200 ms/u);
  // No retry: the semantics are declared absent, so the payload is attempted once.
  assert.equal(createCommandPublisher({ command, cwd: root, timeoutMs: 10 }).publish(FACTS).ok, false);
  fs.rmSync(root, { recursive: true, force: true });
});

/* ── the fan-out ───────────────────────────────────────────────────────── */

test("LPB-09 publishAll runs journal-first and one failure costs no sibling its delivery", () => {
  const root = project();
  const journalPath = path.join(root, DEFAULT_JOURNAL);
  const seen = [];
  const journal = createJournalPublisher({ journalPath });
  const boom = {
    name: "boom",
    publish() {
      seen.push("boom");
      throw new Error("backend down");
    },
  };
  const after = {
    name: "after",
    publish(facts) {
      seen.push(`after:${facts.commits.count}`);
      return { ok: true };
    },
  };
  const result = publishAll([journal, boom, after], FACTS);
  assert.equal(result.ok, false);
  assert.deepEqual(seen, ["boom", "after:2"], "a throw ends that publisher only");
  assert.deepEqual(result.results.map((entry) => entry.name), ["journal", "boom", "after"]);
  assert.deepEqual(result.results.map((entry) => entry.ok), [true, false, true]);
  assert.match(result.results[1].error, /backend down/u);
  // The local entry survived the failure (S10).
  assert.equal(fs.readFileSync(journalPath, "utf8"), `# Session log\n\n\n${renderEntry(FACTS)}`);
  fs.rmSync(root, { recursive: true, force: true });
});

test("LPB-10 publishAll never throws, whatever a publisher does", () => {
  const throwing = {
    name: "throws",
    publish() {
      throw new Error("nope");
    },
  };
  const broken = { name: "not-a-function", publish: 42 };
  const result = publishAll([throwing, broken], FACTS);
  assert.equal(result.ok, false);
  assert.equal(result.results.length, 2);
  assert.match(result.results[0].error, /nope/u);
  assert.match(result.results[1].error, /publish/u);
});

/* ── config → strategies (Q3: the interface, not the backend) ──────────── */

test("LPB-11 the config declares a second strategy; absent, the journal is alone", () => {
  const root = project();
  const journalPath = path.join(root, DEFAULT_JOURNAL);
  const solo = createPublisherFromConfig({ publisher: null }, { journalPath, cwd: root });
  assert.deepEqual(solo.map((publisher) => publisher.name), ["journal"]);
  const { command } = recorder(root);
  const both = createPublisherFromConfig({ publisher: { command, timeoutMs: 1234 } }, { journalPath, cwd: root });
  assert.deepEqual(both.map((publisher) => publisher.name), ["journal", "command"]);
  fs.rmSync(root, { recursive: true, force: true });
});
