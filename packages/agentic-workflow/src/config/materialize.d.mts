/**
 * The `config default` engine's published shape (issue #600).
 *
 * The crate is plain JavaScript; this declaration is what a TypeScript consumer
 * (the settings console) imports, so the receipt the CLI prints and the one the
 * console reads are one type.
 */

export interface MaterializeFileReceipt {
  scope: string;
  file: string;
  path: string;
  existed: boolean;
  written: boolean;
  backup: string | null;
  materialized: string[];
  removed: string[];
}

export interface MaterializeReceipt {
  contract: string;
  scope: string;
  files: MaterializeFileReceipt[];
}

export interface DivergenceFileReport {
  scope: string;
  file: string;
  path: string;
  exists: boolean;
  missing: string[];
  removed: string[];
  converged: boolean;
  error?: string;
}

export interface DivergenceReport {
  contract: string;
  scope: string;
  files: DivergenceFileReport[];
}

export interface MaterializeOptions {
  projectDir?: string;
  globalDir?: string;
  env?: Record<string, string | undefined>;
  scope?: "global" | "project" | "both";
  backup?: boolean;
  extensions?: unknown[];
  now?: Date;
}

export interface DivergenceOptions {
  projectDir?: string;
  globalDir?: string;
  env?: Record<string, string | undefined>;
  scope?: "global" | "project" | "both";
  extensions?: unknown[];
}

export const MATERIALIZE_CONTRACT_ID: string;
export const DIVERGENCE_CONTRACT_ID: string;

export function divergenceForFile(
  fileSections: readonly unknown[],
  document: unknown,
): { missing: string[]; removed: string[]; converged: boolean };

export function divergenceForText(
  fileSections: readonly unknown[],
  text: string,
): { exists: boolean; error?: string; missing: string[]; removed: string[]; converged: boolean };

export function renderConfigFile(sections: readonly unknown[], document: unknown): string;

export function materializeConfig(options?: MaterializeOptions): MaterializeReceipt;

export function configDivergence(options?: DivergenceOptions): DivergenceReport;
