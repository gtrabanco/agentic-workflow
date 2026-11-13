/**
 * Persisted approvals for the git identity guard (issue #514 S2, D3).
 *
 * A guard that asks the same question every time trains the operator to answer
 * without reading, and a guard that cannot be answered at all makes the workflow
 * unusable — the two failure modes the discarded generic permission gates hit.
 * So an approval is remembered, per project, keyed by the *scope and key* of the
 * write (`local:user.name`), not by the value: approving "this project may set
 * its own user.name" is the decision; the value is the operator's to keep.
 *
 * The store is a file of its own beside the config, never inside it: writing
 * state must not rewrite configuration, and reading config must not depend on
 * state. Every failure is soft and answers "not approved" — the guard then asks
 * again or blocks, which is the safe direction.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const STORE_KEY = "gitIdentityConsent";
const STORE_FILE = "git-identity-consent.json";

/** The consent file's path, beside the package's config and state. */
export const gitIdentityConsentPath = (agentDir: string): string => join(agentDir, STORE_FILE);

export interface GitIdentityConsentStore {
  /** Whether this project approved this consent key. */
  approved(projectKey: string, consent: string): boolean;
  /** Record an approval. False when the state could not be written. */
  remember(projectKey: string, consent: string): boolean;
}

export interface ConsentStoreOptions {
  path: string;
  now?: () => string;
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

interface StoreDocument {
  [STORE_KEY]?: Record<string, string[]>;
}

function parseDocument(text: string | null): StoreDocument {
  if (text === null || text.trim() === "") return {};
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as StoreDocument;
  } catch {
    // A corrupt state file is "no approvals", never a crash: the guard asks again.
    return {};
  }
}

export function createGitIdentityConsentStore({
  path,
  now = () => new Date().toISOString(),
  readFile = readOrNull,
  writeFile = writeThrough,
}: ConsentStoreOptions): GitIdentityConsentStore {
  return {
    approved(projectKey, consent) {
      const document = parseDocument(readFile(path));
      const project = document[STORE_KEY]?.[projectKey];
      return Array.isArray(project) && project.includes(consent);
    },
    remember(projectKey, consent) {
      const document = parseDocument(readFile(path));
      const byProject = document[STORE_KEY] ?? {};
      const project = Array.isArray(byProject[projectKey]) ? byProject[projectKey] : [];
      if (!project.includes(consent)) project.push(consent);
      byProject[projectKey] = project;
      document[STORE_KEY] = byProject;
      // The stamp makes the file readable by a human auditing what was approved
      // and when; it is state, never configuration (issue #514 S2).
      (document as StoreDocument & { updatedAt?: string }).updatedAt = now();
      try {
        writeFile(path, `${JSON.stringify(document, null, 2)}\n`);
        return true;
      } catch {
        return false;
      }
    },
  };
}
