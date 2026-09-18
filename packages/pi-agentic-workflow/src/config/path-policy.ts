/**
 * Pi-side path-protection policy: the shipped-default mirror (E-60-1), the
 * tighten-only resolver (E-60-7), the record reader, and the pure Tier 2 tool
 * call decision (E-60-5).
 *
 * The canonical shipped defaults live in the producer crate
 * (`packages/agentic-workflow/src/path-policy.mjs`); this file embeds a copy
 * whose parity is pinned by `test/path-protection.test.mjs`. The guard never
 * weakens the shipped floor: an override may only union globs and raise a
 * requirement, and a removal or a lowering is ignored and reported.
 */

export const PATH_POLICY_SCHEMA = "path-protection-policy@1";
export const RECORDS_SCHEMA = "path-protection-records@1";

export type PathRequirement = "none" | "justification" | "approval";
export type PathOperation = "create" | "modify" | "delete" | "rename";
export type PathPhaseState = "pre-freeze" | "post-freeze" | "always";

export const REQUIREMENTS: readonly PathRequirement[] = ["none", "justification", "approval"];
export const OPERATIONS: readonly PathOperation[] = ["create", "modify", "delete", "rename"];
export const PHASE_STATES: readonly PathPhaseState[] = ["pre-freeze", "post-freeze", "always"];

export interface PathPolicyClass {
  globs: string[];
  freeze: boolean;
}

export type PathPolicyMatrix = Record<PathPhaseState, Record<PathOperation, PathRequirement>>;

export interface PathPolicy {
  schema: string;
  classes: Record<string, PathPolicyClass>;
  matrix: PathPolicyMatrix;
}

export interface PathProtectionOverride {
  protectedGlobs?: string[];
  requirements?: Partial<Record<PathPhaseState, Partial<Record<PathOperation, PathRequirement>>>>;
}

export type DegradationCode = "missing-config" | "malformed-config" | "ignored-removal" | "ignored-lowering";

export interface PathPolicyDegradation {
  code: DegradationCode;
  detail: string;
}

export interface ResolvedPathPolicy extends PathPolicy {
  degradations: PathPolicyDegradation[];
}

/** The shipped-default mirror, byte-for-byte the crate's projection. */
export const SHIPPED_PATH_POLICY: PathPolicy = {
  schema: PATH_POLICY_SCHEMA,
  classes: {
    tests: { globs: ["tests/**"], freeze: true },
    e2e: { globs: ["e2e/**"], freeze: true },
    "test-file": { globs: ["**/*.test.*"], freeze: true },
    fixtures: { globs: ["fixtures/**", "**/fixtures/**"], freeze: true },
    "policy-config": { globs: [".agentic-workflow/path-policy.json"], freeze: false },
  },
  matrix: {
    "pre-freeze": { create: "none", modify: "justification", delete: "justification", rename: "justification" },
    "post-freeze": { create: "justification", modify: "approval", delete: "approval", rename: "approval" },
    always: { create: "approval", modify: "approval", delete: "approval", rename: "approval" },
  },
};

function rank(requirement: PathRequirement): number {
  return REQUIREMENTS.indexOf(requirement);
}

/** Convert a glob to an anchored regexp. `**` crosses `/`, `*`/`?` do not. */
export function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*") {
      if (glob[index + 1] === "*") {
        index += 1;
        if (glob[index + 1] === "/") {
          index += 1;
          out += "(?:.*/)?";
        } else {
          out += ".*";
        }
      } else {
        out += "[^/]*";
      }
    } else if (char === "?") {
      out += "[^/]";
    } else {
      out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`);
}

export function pathMatchesGlob(target: string, glob: string): boolean {
  return globToRegExp(glob).test(target);
}

export function isProtectedPath(policy: PathPolicy, target: string): boolean {
  return Object.values(policy.classes).some((cls) => cls.globs.some((glob) => pathMatchesGlob(target, glob)));
}

/** Merge two owner overrides before intersecting: globs union, requirements max. */
export function mergePathProtectionOverrides(
  base: PathProtectionOverride | undefined,
  next: PathProtectionOverride | undefined,
): PathProtectionOverride {
  const result: PathProtectionOverride = {};
  if (base?.protectedGlobs !== undefined || next?.protectedGlobs !== undefined) {
    result.protectedGlobs = [...new Set([...(base?.protectedGlobs ?? []), ...(next?.protectedGlobs ?? [])])];
  }
  const requirements: PathProtectionOverride["requirements"] = {};
  for (const state of PHASE_STATES) {
    const row: Partial<Record<PathOperation, PathRequirement>> = {};
    for (const operation of OPERATIONS) {
      const a = base?.requirements?.[state]?.[operation];
      const b = next?.requirements?.[state]?.[operation];
      const best = a === undefined ? b : b === undefined ? a : rank(a) >= rank(b) ? a : b;
      if (best !== undefined) row[operation] = best;
    }
    if (Object.keys(row).length > 0) requirements[state] = row;
  }
  if (Object.keys(requirements).length > 0) result.requirements = requirements;
  return result;
}

/**
 * Tighten-only resolution (E-60-7). The shipped floor is always kept: globs
 * union, requirements take the maximum, and a removal or a lowering appends a
 * degradation record. When the override declares `protectedGlobs`, any shipped
 * glob it omits is a rejected removal and is reported too.
 */
export function intersectPathPolicy(shipped: PathPolicy, override: PathProtectionOverride | undefined): ResolvedPathPolicy {
  const degradations: PathPolicyDegradation[] = [];
  const classes: Record<string, PathPolicyClass> = {};
  for (const [name, cls] of Object.entries(shipped.classes)) {
    classes[name] = { globs: [...cls.globs], freeze: cls.freeze };
  }

  if (override?.protectedGlobs !== undefined) {
    for (const glob of override.protectedGlobs) {
      if (!isProtectedGlob(classes, glob)) {
        classes[`override:${glob}`] = { globs: [glob], freeze: true };
      }
    }
    for (const cls of Object.values(shipped.classes)) {
      for (const glob of cls.globs) {
        if (!override.protectedGlobs.includes(glob)) {
          degradations.push({ code: "ignored-removal", detail: `the override omitted the shipped glob "${glob}"; kept` });
        }
      }
    }
  }

  const matrix = {} as PathPolicyMatrix;
  for (const state of PHASE_STATES) {
    const row = {} as Record<PathOperation, PathRequirement>;
    for (const operation of OPERATIONS) {
      const floor = shipped.matrix[state][operation];
      const wanted = override?.requirements?.[state]?.[operation];
      if (wanted === undefined || rank(wanted) >= rank(floor)) {
        row[operation] = wanted ?? floor;
      } else {
        degradations.push({
          code: "ignored-lowering",
          detail: `matrix "${state}.${operation}" lowered to "${wanted}"; kept "${floor}"`,
        });
        row[operation] = floor;
      }
    }
    matrix[state] = row;
  }

  return { schema: PATH_POLICY_SCHEMA, classes, matrix, degradations };
}

function isProtectedGlob(classes: Record<string, PathPolicyClass>, glob: string): boolean {
  return Object.values(classes).some((cls) => cls.globs.includes(glob));
}

/**
 * Read the `path-protection-records@1` fenced block and report whether a
 * `justification` row (authority `execute-phase`) matches `target`. A missing or
 * malformed block permits nothing. A file with no marker is ignored (it simply
 * contributes no records).
 */
export function matchingJustification(target: string, recordsText: string): boolean {
  const block = recordsLines(recordsText);
  if (block === null) return false;
  let headerSeen = false;
  for (const line of block) {
    if (line === "kind | paths | phase | date | authority | justification") {
      headerSeen = true;
      continue;
    }
    if (!headerSeen) continue;
    const cells = line.split("|").map((cell) => cell.trim());
    if (cells.length !== 6) return false;
    const [kind, pathsCell, phase, date, authority, justification] = cells;
    if (kind !== "justification" || authority !== "execute-phase") continue;
    if (!/^P\d+$/.test(phase) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || justification === "") continue;
    const paths = pathsCell.split(",").map((entry) => entry.trim()).filter(Boolean);
    if (paths.some((glob) => pathMatchesGlob(target, glob))) return true;
  }
  return false;
}

/** The marker's following lines up to the closing fence; `null` when absent. */
function recordsLines(text: string): string[] | null {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === RECORDS_SCHEMA);
  if (start === -1) return null;
  const body: string[] = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("```")) break;
    if (trimmed !== "") body.push(trimmed);
  }
  return body;
}

export type ToolCallGuardResult = { block: false } | { block: true; reason: string };

export interface ToolCallGuardInput {
  toolName: string;
  targetPath: string;
  /** A new-file create is authoring, not modification, so it passes (E-60-5). */
  targetExists: boolean;
  policy: PathPolicy;
  recordsText: string;
}

const WRITE_TOOLS = new Set(["write", "edit"]);

/**
 * The pure Tier 2 decision: block a `write` / `edit` call to an existing
 * protected path with no matching justification record; pass reads and
 * new-file creates. The reason names the escape path.
 */
export function evaluateToolCall(input: ToolCallGuardInput): ToolCallGuardResult {
  if (!WRITE_TOOLS.has(input.toolName)) return { block: false };
  if (!input.targetExists) return { block: false };
  if (!isProtectedPath(input.policy, input.targetPath)) return { block: false };
  if (matchingJustification(input.targetPath, input.recordsText)) return { block: false };
  return {
    block: true,
    reason:
      `"${input.targetPath}" is a protected path (path-protection policy) and no matching ` +
      `justification record exists. Record a "${RECORDS_SCHEMA}" row ` +
      `\`justification | ${input.targetPath} | <P<n>> | <YYYY-MM-DD> | execute-phase | <reason>\` in the unit's ` +
      `decisions.md, and for a post-freeze change ask the owner for the recorded approval the checkpoint gate requires.`,
  };
}
