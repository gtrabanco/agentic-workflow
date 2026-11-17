/**
 * Types and signatures for `git-identity.mjs` — the profile rule and Layer 2's
 * commit half (issue #514, moved into the crate by unit 554).
 *
 * The pi package imports this module so the guard's `gitIdentity` vocabulary, its
 * defaults and its normalizer have one owner; the JS module stays the
 * implementation and this file is its declaration.
 */

export type GitIdentityEnforce =
  | "off"
  | "commit"
  | "push"
  | "push-upstream"
  | "commit-and-push"
  | "commit-and-push-upstream";

export type GitIdentityAgentMode = "ask" | "block";

export type GitIdentitySigning = "required" | "allowed" | "off";

export interface GitIdentityApproved {
  name?: string;
  email?: string;
  fullName?: string;
  format?: "openpgp" | "ssh";
  signingKey?: string;
  /** The per-machine keys: a resolved key matching any of these is approved. */
  signingKeys?: string[];
  /** What a signature means here: required, allowed (default), or off (sign-off). */
  signing?: GitIdentitySigning;
}

export interface GitIdentityAgentGuard {
  mode: GitIdentityAgentMode;
  allow: string[];
}

export interface GitIdentityConfig {
  enforce: GitIdentityEnforce;
  approved: GitIdentityApproved;
  agentGuard: GitIdentityAgentGuard;
}

export interface IdentitySources {
  global: string;
  project: string;
  profile: "global" | "project" | "none";
}

export interface ResolvedIdentityProfile {
  enforce: string;
  enforceDeclared: boolean;
  approved: GitIdentityApproved;
  named: boolean;
  present: boolean;
  sources: IdentitySources;
}

export interface IdentityResolution {
  ok: boolean;
  code?: string;
  lines?: string[];
}

export declare const BASE_CONFIG_FILE: string;
export declare const ENFORCE_VALUES: readonly GitIdentityEnforce[];
export declare const COMMIT_ENFORCING: readonly GitIdentityEnforce[];
export declare const PUSH_ENFORCING: readonly GitIdentityEnforce[];
export declare const SIGNING_POLICIES: readonly GitIdentitySigning[];
export declare const DEFAULT_AGENT_MODE: GitIdentityAgentMode;
export declare const REPAIR_LINES: readonly string[];

export declare function globalAgentDir(env?: NodeJS.ProcessEnv): string;
export declare function normalizeGitIdentity(value: unknown): GitIdentityConfig;
export declare function resolveIdentityProfile(options?: {
  root?: string;
  env?: NodeJS.ProcessEnv;
}): ResolvedIdentityProfile;
export declare function identityMatches(
  ident: { name?: string; email?: string } | undefined,
  approved?: GitIdentityApproved,
): boolean;
export declare function commitViolations(
  commit: { author?: { name?: string; email?: string }; committer?: { name?: string; email?: string } },
  approved?: GitIdentityApproved,
): { role: "author" | "committer"; actual: { name?: string; email?: string } }[];
export declare function describeApproved(approved?: GitIdentityApproved): string;
export declare function describeViolation(violation: {
  role: "author" | "committer";
  actual: { name?: string; email?: string };
}): string;
export declare function parseIdent(line: string): { name: string; email: string };
export declare function evaluateCommitIdentity(options?: {
  root?: string;
  env?: NodeJS.ProcessEnv;
}): IdentityResolution;
export declare function main(
  argv: string[],
  io?: {
    env?: NodeJS.ProcessEnv;
    stderr?: (text: string) => void;
    stdout?: (text: string) => void;
  },
): number;
