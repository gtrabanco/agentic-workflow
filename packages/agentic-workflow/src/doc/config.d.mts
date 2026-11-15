/**
 * Types for `config.mjs` — the committed `index.json` surface (issue #541 S3).
 *
 * A TypeScript consumer (the pi package's provider-preset materializer) gets the
 * *shape* here and the *judgment* from the module itself: the crate owns the
 * schema, so no outside package may restate these keys.
 */

/** The `provider.pacing` knobs (names owned by `DEFAULT_PACING` in `config.mjs`). */
export interface PacingConfig {
  batchSize?: number;
  requestsPerMinute?: number;
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/** The `provider` block: an OpenAI-compatible endpoint, or `null` for keyword-only. */
export interface ProviderConfig {
  baseUrl?: string;
  model?: string;
  envVar?: string;
  chunk_limit?: number;
  max_request_chars?: number;
  pacing?: PacingConfig;
}

/** The `store.share` block (D20): one user-level store shared by a repo's worktrees. */
export interface StoreShareConfig {
  enabled?: boolean;
  base_dir?: string;
}

/** The whole committed config: `.agentic-workflow/index.json`. */
export interface IndexConfig {
  version?: number;
  store?: { path?: string; share?: StoreShareConfig };
  provider?: ProviderConfig | null;
  index?: { excludes?: string[] | null };
}

export const CONFIG_VERSION: number;
export const DEFAULT_MAX_REQUEST_CHARS: number;
export const MAX_REQUEST_CHARS_ENV: string;
export const DEFAULT_PACING: Readonly<Required<PacingConfig>>;
export const DEFAULT_CONFIG: Readonly<IndexConfig>;

export function configPath(root: string): string;
export function resolveMaxRequestChars(input?: {
  config?: IndexConfig;
  env?: Record<string, string | undefined>;
  cli?: { maxRequestChars?: number | string };
}): number;
export function effectiveChunkLimit(input?: {
  config?: IndexConfig;
  providerConfigured?: boolean;
  env?: Record<string, string | undefined>;
  cli?: { maxRequestChars?: number | string };
}): number;
export function validateProviderConfig(provider?: ProviderConfig | null): void;
export function validateIndexConfigObject(root: string, parsed: unknown): IndexConfig;
export function loadConfig(root: string): IndexConfig;
