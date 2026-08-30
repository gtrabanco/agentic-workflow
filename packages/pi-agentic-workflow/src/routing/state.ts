import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { mkdirSync } from "node:fs";

/**
 * Global package state (SPEC S9, D-E7): the first-run hint acknowledgement.
 *
 * Deliberately a file of its own next to the config, never inside it — writing
 * state must not rewrite configuration, and reading config must not depend on
 * state. Every failure here is soft: a hint that cannot be persisted is shown
 * again next session, which is a nuisance, not a broken command.
 */

const STATE_FILE_NAME = "pi-agentic-workflow-state.json";

export const stateFilePath = (agentDir: string): string => join(agentDir, STATE_FILE_NAME);

export interface HintStore {
  /** Whether the hint still needs showing. Cached after the first read. */
  pending(): boolean;
  /** Record that the hint was shown. Returns false when persistence failed. */
  acknowledge(now?: string): boolean;
}

export interface HintStoreOptions {
  path: string;
  readFile?: (path: string) => string | null;
  writeFile?: (path: string, text: string) => void;
}

const readOrNull = (path: string): string | null => {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
};

const writeThrough = (path: string, text: string): void => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
};

export function createHintStore({
  path,
  readFile = readOrNull,
  writeFile = writeThrough,
}: HintStoreOptions): HintStore {
  let acknowledged = false;

  const storedAcknowledged = (): boolean => {
    const text = readFile(path);
    if (text === null || text.trim() === "") return false;
    try {
      const parsed: unknown = JSON.parse(text);
      return typeof parsed === "object" && parsed !== null && typeof (parsed as { firstRunHintShownAt?: unknown }).firstRunHintShownAt === "string";
    } catch {
      // Corrupt state is treated as "never shown", so the operator sees the hint
      // again rather than losing the only pointer to the settings command.
      return false;
    }
  };

  return {
    pending() {
      if (acknowledged) return false;
      if (storedAcknowledged()) {
        acknowledged = true;
        return false;
      }
      return true;
    },
    acknowledge(now = new Date().toISOString()) {
      // Latch in memory first: a failing write must not re-show the hint on the
      // next command in this same session.
      acknowledged = true;
      try {
        writeFile(path, `${JSON.stringify({ firstRunHintShownAt: now }, null, 2)}\n`);
        return true;
      } catch {
        return false;
      }
    },
  };
}
