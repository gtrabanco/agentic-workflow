/**
 * index.d.mts — the type projection of `machine-ledger/index.mjs`.
 *
 * Same rule as `tool-choice/policy.d.mts`: a projection of what the module
 * exports, compared against the module by its consumer suite, never a second
 * contract.
 */

/** The closed zones a class row may live in. */
export declare const MACHINE_LEDGER_ZONES: readonly string[];

/** One row of the declared class: what it owns and how its bytes are committed. */
export interface MachineLedgerClass {
  /** The closed class id (the policy block's first column). */
  readonly class: string;
  /** The zone: `auto`, `writer-step` or `out-of-scope`. */
  readonly zone: string;
  /** The literal paths the row owns, when it declares literals. */
  readonly paths?: readonly string[];
  /** The row's displayed pattern, when it matches (the unit-ledger row). */
  readonly pattern?: string;
  /** The matcher a path is tested against, when the row has no literals. */
  readonly matches?: RegExp;
  /** The `.gitattributes` merge class the same path is declared under. */
  readonly merge: string | null;
  /** The conventional subject the class's commit carries. */
  readonly subject: string;
}

/** The class, in the order the policy lists it. */
export declare const MACHINE_LEDGER_CLASSES: readonly MachineLedgerClass[];

/** The class row a path belongs to, or `null`. */
export declare function machineLedgerClassOf(relative: string): MachineLedgerClass | null;

/** Whether a path is a machine-owned ledger at all. */
export declare function isMachineLedgerPath(relative: string): boolean;

/** Whether a pending change to this path is exempt from a dirty-tree verdict. */
export declare function isMachineLedgerExempt(relative: string): boolean;

/** The literal paths the `auto` zone sweeps, in table order. */
export declare function autoLedgerPaths(): string[];

/** The subject the commit carries: one family per changed class, joined when mixed. */
export declare function machineLedgerSubject(rows: readonly MachineLedgerClass[]): string;

/** One machine-owned ledger commit's answer. */
export interface MachineLedgerOutcome {
  status: "not-a-repository" | "clean" | "locked" | "committed" | "would-commit" | "failed";
  committed: boolean;
  root: string;
  classes: string[];
  paths: string[];
  sha: string | null;
  subject: string | null;
  detail?: string;
}

/** The commit options: a class id list or a zone, an optional subject, a dry run. */
export interface MachineLedgerCommitOptions {
  root?: string;
  classes?: readonly string[];
  zone?: string;
  subject?: string;
  dryRun?: boolean;
}

/** Commit the pending bytes of the selected class rows, alone and behind a lock. */
export declare function commitMachineLedgers(options?: MachineLedgerCommitOptions): MachineLedgerOutcome;

/** The porcelain-v1 lines whose path the exemption does not cover, trimmed with the letters. */
export declare function foreignPorcelainLines(porcelain: string): string[];

/** The paths of the foreign porcelain lines, in porcelain order. */
export declare function foreignPorcelainPaths(porcelain: string): string[];
