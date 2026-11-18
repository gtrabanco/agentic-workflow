/**
 * ledger.d.mts — the type projection of `ledger.mjs`.
 *
 * Same rule as `log/render.d.mts`: a projection of what the module exports,
 * compared against the module by its consumer suites, never a second contract.
 */

/** The earlier grammar: still read, and still what a project on it writes. */
export declare const TIER_COST_LEGACY_CONTRACT_ID: string;

/** The current grammar's contract id. */
export declare const TIER_COST_CONTRACT_ID: string;

/** Every grammar the reader accepts, oldest first. */
export declare const TIER_COST_CONTRACT_IDS: readonly string[];

/** The ledger's only carrier, relative to the project root. */
export declare const LEDGER_PATH: string;

/** The `tier-cost@1` row, in order. */
export declare const LEGACY_COLUMNS: readonly string[];

/** The `tier-cost@2` row, in order. */
export declare const COLUMNS: readonly string[];

/** Each grammar's published column list. */
export declare const COLUMNS_BY_CONTRACT: Readonly<Record<string, readonly string[]>>;

/** The columns whose cell is a count. */
export declare const INTEGER_COLUMNS: readonly string[];

/** The columns a sample may leave unnamed. */
export declare const NULLABLE_COLUMNS: readonly string[];

/** One parsed ledger row: every published column, numeric cells coerced. */
export type LedgerRow = Record<string, string | number | null>;

/** The parse answer: the declared contract and rows, or a refusal naming its cause. */
export type LedgerParse =
  | { contract: string; columns: string[]; rows: LedgerRow[] }
  | { error: string; detail?: string; contract?: string };

/** Read the ledger text against the grammar block and header it carries. */
export declare function parseLedger(text: string): LedgerParse;

/** One sample's fields in the published order. */
export declare function orderedSample(sample: Record<string, unknown>): Record<string, unknown>;

/**
 * Validate one ledger write and return the function that performs it: every
 * refusal is raised now, the byte only when the returned plan is applied — it
 * appends the row of a session the ledger does not carry and replaces the row a
 * returning session does.
 */
export declare function prepareLedgerAppend(options: {
  ledgerPath: string;
  sample: object;
}): () => void;

/** Write one sample to the project's ledger, in the order the ledger declares. */
export declare function appendLedgerSample(options: {
  ledgerPath: string;
  sample: object;
}): void;

/** Append one sample to the per-session JSONL store, one JSON object per line. */
export declare function appendJsonlSample(options: {
  path: string;
  sample: object;
}): void;
