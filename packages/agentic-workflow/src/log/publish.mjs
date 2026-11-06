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
import path from "node:path";
import { spawnSync } from "node:child_process";

import { factsToEntry, JOURNAL_ENTRY_KINDS } from "../journal/entry.mjs";
import { createMarkdownDriver } from "../journal/drivers/markdown.mjs";

/** The project's journal, relative to the project root (the hook's own default). */
export const DEFAULT_JOURNAL = "docs/LOGS.md";

/** How long a declared command may take before it is abandoned. */
export const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;

/**
 * The local journal strategy: one `O_APPEND` write of the separating newline and
 * the rendered entry.
 *
 * A missing journal is a project that did not opt in — the file is never created
 * (S9), and the result says so instead of pretending a delivery happened. The
 * carrier directory outranks that check: when `fragmentDir` names an existing
 * directory the entry travels as a fragment and needs no journal file at all
 * (fix/405 AC1 — the carrier IS the opt-in).
 *
 * **The write goes through the default store driver (issue #374, AC3).** The
 * publisher is the mechanical writer's seam, not the writer itself: the entry
 * becomes a canonical `journal-entry@1` (`factsToEntry`) and the Markdown
 * driver decides the transport — a fragment when the carrier directory exists
 * (issue #405, AC1), the same byte-for-byte append otherwise. Every path is
 * resolved once, against the caller's cwd, so a relative `fragmentDir` (the
 * shipped `JOURNAL_DIR`) is the same opt-in as an absolute one.
 *
 * `kind` is the writer's own declaration, never a second entry grammar: this
 * publisher renders the mechanical entry from a frozen `log-facts@1` payload,
 * so `undefined` and `"mechanical"` are the only accepted values. Anything
 * else is a declared refusal before a byte moves — silently writing a
 * mechanical fragment for a caller that asked for another kind would be the
 * one failure the contract exists to prevent.
 */
export function createJournalPublisher(options) {
  const journalPathArg = options?.journalPath;
  if (typeof journalPathArg !== "string" || journalPathArg === "") {
    throw new Error("createJournalPublisher: journalPath is required");
  }
  const fragmentDirArg = options?.fragmentDir;
  const now = options?.now ?? (() => Date.now());
  const declaredKind = options?.kind;
  return {
    name: "journal",
    publish(facts) {
      try {
        const kind = declaredKind ?? "mechanical";
        if (!JOURNAL_ENTRY_KINDS.includes(kind)) {
          return { ok: false, error: `kind must be one of ${JOURNAL_ENTRY_KINDS.join(", ")}, got ${JSON.stringify(kind)}` };
        }
        if (kind !== "mechanical") {
          return { ok: false, error: `createJournalPublisher writes the mechanical entry (log-facts@1) — kind ${JSON.stringify(kind)} is another writer's entry` };
        }
        // One resolution, before either transport reads a path.
        const journalPath = path.resolve(journalPathArg);
        const carrier = typeof fragmentDirArg === "string" && fragmentDirArg !== "" ? path.resolve(fragmentDirArg) : null;
        const carrierPresent = carrier !== null && isDirectory(carrier);
        if (!carrierPresent) {
          let present = true;
          try {
            fs.accessSync(journalPath, fs.constants.W_OK);
          } catch {
            present = false;
          }
          if (!present) return { ok: true, written: false, skipped: "no-journal" };
        }
        const driver = createMarkdownDriver({
          root: path.dirname(carrierPresent ? carrier : journalPath),
          journalPath,
          fragmentDir: carrierPresent ? carrier : null,
          sessionId: options?.sessionId,
          now,
        });
        const result = driver.append(factsToEntry(facts));
        if (!result.ok) return { ok: false, error: result.error };
        return result.target === "fragment"
          ? { ok: true, written: true, target: "fragment", fragment: result.name }
          : { ok: true, written: true, target: "journal" };
      } catch (error) {
        // A refusal is a value: the shutdown path has no caller to catch a throw.
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
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

/** `statSync().isDirectory()`, never a throw: a missing carrier is "not opted in". */
function isDirectory(target) {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
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
  const publishers = [
    createJournalPublisher({
      journalPath,
      fragmentDir: context?.fragmentDir,
      kind: context?.kind,
      sessionId: context?.sessionId,
      now: context?.now,
    }),
  ];
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
