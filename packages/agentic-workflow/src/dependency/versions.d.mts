/**
 * versions.d.mts — the type projection of `versions.mjs` (issue #610).
 *
 * Compared against the module by the suite (`tool-choice.policy` F19's pattern,
 * extended to `dependency/versions`), never a second contract.
 */

/** A `major.minor.patch[-prerelease]` triple, or `null` when unparsable. */
export declare function parseSemver(version: unknown): {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
} | null;

/** True when `a` is strictly newer than `b`. Non-parsable input sorts lowest. */
export declare function semverGt(a: unknown, b: unknown): boolean;

/** Every workspace member under `<root>/packages`, relative and sorted. */
export declare function packageDirs(root?: string): string[];
