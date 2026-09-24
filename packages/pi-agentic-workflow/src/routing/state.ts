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
        // Read-merge-write: preserve any other keys already in the state file.
        const existing = readFile(path);
        let merged: Record<string, unknown> = {};
        if (existing && existing.trim() !== "") {
          try {
            const parsed = JSON.parse(existing);
            if (typeof parsed === "object" && parsed !== null) merged = parsed as Record<string, unknown>;
          } catch {
            // Corrupt state: discard and start fresh.
          }
        }
        merged.firstRunHintShownAt = now;
        writeFile(path, `${JSON.stringify(merged, null, 2)}\n`);
        return true;
      } catch {
        return false;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// Profile demotion state (P4, feature 63)
// ---------------------------------------------------------------------------

/** A profile that was demoted because its model was unusable. */
export interface ProfileDemotion {
  profile: string;
  /** ISO-8601 timestamp of when the demotion was recorded. */
  at: string;
}

export interface ProfileStateStore {
  /** Returns the current demotion, or undefined if no demotion is active. */
  demotion(): ProfileDemotion | undefined;
  /**
   * Record that the given profile was chosen (demoting it for a retry window).
   * Returns false if the write failed.
   */
  record(profile: string, now?: Date): boolean;
  /**
   * Clear any demotion record without touching other keys in the state file.
   * Returns false if the write failed.
   */
  clear(): boolean;
}

export interface ProfileStateStoreOptions {
  path: string;
  readFile?: (path: string) => string | null;
  writeFile?: (path: string, text: string) => void;
}

export function createProfileStateStore({
  path,
  readFile = readOrNull,
  writeFile = writeThrough,
}: ProfileStateStoreOptions): ProfileStateStore {
  const readState = (): Record<string, unknown> => {
    const text = readFile(path);
    if (text === null || text.trim() === "") return {};
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, unknown>;
    } catch {
      // Corrupt state: treat as empty.
    }
    return {};
  };

  return {
    demotion(): ProfileDemotion | undefined {
      const state = readState();
      const pd = state.profileDemotion;
      if (pd && typeof pd === "object" && "profile" in pd && "at" in pd) {
        const profile = (pd as Record<string, unknown>).profile;
        const at = (pd as Record<string, unknown>).at;
        if (typeof profile === "string" && typeof at === "string") {
          return { profile, at };
        }
      }
      return undefined;
    },
    record(profile: string, now = new Date()) {
      const state = readState();
      state.profileDemotion = { profile, at: now.toISOString() };
      try {
        writeFile(path, `${JSON.stringify(state, null, 2)}\n`);
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      const state = readState();
      delete (state as Record<string, unknown>).profileDemotion;
      try {
        writeFile(path, `${JSON.stringify(state, null, 2)}\n`);
        return true;
      } catch {
        return false;
      }
    },
  };
}
