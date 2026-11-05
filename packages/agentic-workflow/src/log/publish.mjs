/**
 * publish.mjs — where a rendered journal entry goes (feature #394, S3/S10).
 *
 * A publisher is a Strategy over the *frozen* facts, never over prose: every
 * backend renders through `render.mjs`, so two backends cannot format the same
 * session two ways, and a backend that is not shipped here (an HTTP endpoint, a
 * queue, a path outside the repo) is reached by declaring an argv rather than by
 * adding a client to this package.
 *
 * The ordering and the failure policy are the two decisions worth knowing:
 *
 *  - **Mirror, not replace.** The journal entry is written first and every other
 *    publisher is a copy. S10 says a publisher failure never loses the local
 *    entry; a replace contract would lose it by construction.
 *  - **Declared absences.** No retry, no queue, no backoff: a failed delivery is
 *    reported and forgotten, and the next session's entry is a new entry. A
 *    queue whose semantics nobody declared is worse than a lost copy of a file
 *    that already has its authoritative row.
 *
 * `publishAll` never throws. Every failure is a `{ ok: false, error }` row in its
 * result, because the one caller runs inside a session shutdown.
 */

import fs from "node:fs";
import { spawnSync } from "node:child_process";

import { renderEntry } from "./render.mjs";

/** The project's journal, relative to the project root (the hook's own default). */
export const DEFAULT_JOURNAL = "docs/LOGS.md";

/** How long a declared command may take before it is abandoned. */
export const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;

/**
 * The local journal strategy: one `O_APPEND` write of the separating newline and
 * the rendered entry.
 *
 * A missing journal is a project that did not opt in — the file is never created
 * (S9), and the result says so instead of pretending a delivery happened.
 */
export function createJournalPublisher(options) {
  const journalPath = options?.journalPath;
  if (typeof journalPath !== "string" || journalPath === "") {
    throw new Error("createJournalPublisher: journalPath is required");
  }
  return {
    name: "journal",
    publish(facts) {
      let present = true;
      try {
        fs.accessSync(journalPath, fs.constants.W_OK);
      } catch {
        present = false;
      }
      if (!present) return { ok: true, written: false, skipped: "no-journal" };
      fs.appendFileSync(journalPath, `\n${renderEntry(facts)}`);
      return { ok: true, written: true };
    },
  };
}

/** The declared argv must be an array of non-empty strings with a non-empty head. */
function commandOf(command) {
  if (!Array.isArray(command) || command.length === 0) {
    throw new Error('createCommandPublisher: command must be a non-empty array of strings, e.g. ["curl", "-sS", "…"]');
  }
  for (const part of command) {
    if (typeof part !== "string" || part.trim() === "") {
      throw new Error("createCommandPublisher: every command element must be a non-empty string");
    }
  }
  return [...command];
}

/**
 * The config-declared strategy: run `command` with the frozen payload as JSON on
 * stdin, in the project root.
 *
 * The payload is the only channel — no arguments are appended and no environment
 * is injected, so a backend cannot come to depend on a second, undocumented
 * input. A timeout, a non-zero exit and a spawn error are all `{ ok: false }`
 * with the reason; none of them throws.
 */
export function createCommandPublisher(options) {
  const command = commandOf(options?.command);
  const cwd = options?.cwd;
  if (typeof cwd !== "string" || cwd === "") throw new Error("createCommandPublisher: cwd is required");
  const timeoutMs = options?.timeoutMs ?? DEFAULT_PUBLISH_TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) {
    throw new Error(`createCommandPublisher: timeoutMs must be a positive integer, got ${JSON.stringify(options?.timeoutMs)}`);
  }
  const spawn = options?.spawn ?? spawnSync;
  return {
    name: "command",
    publish(facts) {
      const input = `${JSON.stringify(facts)}\n`;
      const result = spawn(command[0], command.slice(1), { cwd, input, encoding: "utf8", timeout: timeoutMs, maxBuffer: 1024 * 1024 });
      if (result?.error?.code === "ETIMEDOUT") {
        return { ok: false, error: `command ${command[0]} timed out after ${timeoutMs} ms` };
      }
      if (result?.error) {
        return { ok: false, error: `command ${command[0]} failed: ${result.error.message}` };
      }
      if (result?.status !== 0) {
        return { ok: false, error: `command ${command[0]} exited ${result.status}${result.signal ? ` (${result.signal})` : ""}` };
      }
      return { ok: true };
    },
  };
}

/**
 * The shipped strategies for one resolved `autoLogSession` config: the journal
 * first, the declared command second when one is declared.
 *
 * `publisher: null` = the local journal alone (Q3: the interface ships, not the
 * backend).
 */
export function createPublisherFromConfig(config, context) {
  const journalPath = context?.journalPath;
  const cwd = context?.cwd;
  const publishers = [createJournalPublisher({ journalPath })];
  const declared = config?.publisher;
  if (declared && declared.command !== undefined) {
    publishers.push(createCommandPublisher({ command: declared.command, cwd, timeoutMs: declared.timeoutMs }));
  }
  return publishers;
}

/**
 * Run every publisher in order. Never throws: a strategy that throws or returns
 * `ok: false` is one failed row, and the others still deliver (S10).
 */
export function publishAll(publishers, facts) {
  const results = [];
  for (const publisher of publishers) {
    const name = typeof publisher?.name === "string" ? publisher.name : "unnamed";
    try {
      const value = publisher.publish(facts);
      if (value !== undefined && value !== null && value.ok === false) {
        results.push({ name, ok: false, error: value.error ?? "refused" });
      } else {
        results.push({ name, ok: true });
      }
    } catch (error) {
      results.push({ name, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return { ok: results.every((entry) => entry.ok), results };
}
