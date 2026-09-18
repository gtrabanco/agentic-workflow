// Path-protection policy model, parsers, evaluator, and closed vocabularies.
//
// Single source of truth for the shipped default protected-path policy, the
// plan-declaration grammar, the escape-record grammar, and the deterministic
// evaluation the Tier 1 gate (`bin/path-guard.mjs`) consumes. Node standard
// library only, zero dependencies, read-only: nothing here writes.
//
// The three surfaces of the same policy are the crate module (canonical, this
// file), the template install seed (`template/.agentic-workflow/path-policy.json`,
// parity-pinned by the P2 done-when command) and the pi package mirror
// (parity-pinned by the pi suite). E-60-1.

export const PATH_POLICY_SCHEMA = "path-protection-policy@1";
export const PLAN_DECLARATION_SCHEMA = "path-protection-plan@1";
export const RECORDS_SCHEMA = "path-protection-records@1";

/** Requirement order: `none < justification < approval`. */
export const REQUIREMENTS = Object.freeze(["none", "justification", "approval"]);
export const OPERATIONS = Object.freeze(["create", "modify", "delete", "rename"]);
export const PHASE_STATES = Object.freeze(["pre-freeze", "post-freeze", "always"]);
export const DECLARATION_KINDS = Object.freeze(["created", "not-created", "ignored"]);
export const RECORD_KINDS = Object.freeze(["justification", "approval"]);

/** A project policy over this bound is `malformed-config` with the defaults in force. */
export const PATH_POLICY_MAX_BYTES = 256 * 1024;
/** A changed-path list over this bound is a usage error (exit 2), never a silent truncation. */
export const CHANGED_PATH_LIMIT = 10000;

/**
 * The closed reason vocabulary. Adding a reason is a SPEC change, never a code
 * path. Exported as a frozen literal array so the drift gate can read it via
 * its `schema-export:` surface (published by the `path-protection-reasons`
 * normative row).
 */
export const PATH_GUARD_REASONS = Object.freeze([
  "clean",
  "justified",
  "approved",
  "protected-modification",
  "approval-required",
  "undeclared-test",
  "unmatched-record",
  "malformed-declaration",
  "missing-config",
  "malformed-config",
]);

/** The published degradation codes a gate run may report. */
export const DEGRADATION_CODES = Object.freeze([
  "missing-config",
  "malformed-config",
  "ignored-removal",
  "ignored-lowering",
]);

const DECLARATION_HEADER = ["kind", "path", "justification"];
const RECORDS_HEADER = ["kind", "paths", "phase", "date", "authority", "justification"];

const CLASS_NAMES = Object.freeze(["tests", "e2e", "test-file", "fixtures", "policy-config"]);

function defaultClasses() {
  return {
    tests: { globs: ["tests/**"], freeze: true },
    e2e: { globs: ["e2e/**"], freeze: true },
    "test-file": { globs: ["**/*.test.*"], freeze: true },
    fixtures: { globs: ["fixtures/**", "**/fixtures/**"], freeze: true },
    "policy-config": { globs: [".agentic-workflow/path-policy.json"], freeze: false },
  };
}

/** The shipped-default policy: five classes, the three-row matrix (D4, AC-01). */
export const SHIPPED_PATH_POLICY = Object.freeze({
  schema: PATH_POLICY_SCHEMA,
  classes: Object.freeze(
    Object.fromEntries(
      Object.entries(defaultClasses()).map(([name, def]) => [
        name,
        Object.freeze({ globs: Object.freeze([...def.globs]), freeze: def.freeze }),
      ]),
    ),
  ),
  matrix: Object.freeze({
    "pre-freeze": Object.freeze({
      create: "none",
      modify: "justification",
      delete: "justification",
      rename: "justification",
    }),
    "post-freeze": Object.freeze({
      create: "justification",
      modify: "approval",
      delete: "approval",
      rename: "approval",
    }),
    always: Object.freeze({
      create: "approval",
      modify: "approval",
      delete: "approval",
      rename: "approval",
    }),
  }),
});

/** Canonical seed serialization; P2 diffs the template seed against this byte-for-byte. */
export function serializeShippedPolicy() {
  return `${JSON.stringify(SHIPPED_PATH_POLICY, null, 2)}\n`;
}

/* ------------------------------------------------------------------ helpers */

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rank(requirement) {
  return REQUIREMENTS.indexOf(requirement);
}

/** Convert a glob to an anchored regexp. `**` crosses `/`, `*`/`?` do not. */
export function globToRegExp(glob) {
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

/**
 * Linear-time glob match with the same semantics as `globToRegExp` (`**` crosses
 * `/`; `*` and `?` do not). Memoised so a star-chain glob cannot trigger the
 * catastrophic backtracking the RegExp form suffers (F20).
 */
export function matchGlob(glob, target) {
  const glen = glob.length;
  const plen = target.length;
  const memo = new Int8Array((glen + 1) * (plen + 1)).fill(-1);
  const at = (gi, pi) => {
    if (gi === glen) return pi === plen;
    const key = gi * (plen + 1) + pi;
    const cached = memo[key];
    if (cached !== -1) return cached === 1;
    let result = false;
    const char = glob[gi];
    if (char === "?") {
      result = pi < plen && target[pi] !== "/" && at(gi + 1, pi + 1);
    } else if (char === "*") {
      if (glob[gi + 1] === "*") {
        const after = gi + 2;
        if (glob[after] === "/") {
          // `**/` matches zero or more characters ending in `/`.
          result = at(after + 1, pi);
          for (let index = pi; index < plen && !result; index += 1) {
            if (target[index] === "/") result = at(after + 1, index + 1);
          }
        } else {
          // `**` matches any sequence, crossing `/`.
          result = at(after, pi);
          for (let index = pi; index < plen && !result; index += 1) {
            result = at(after, index + 1);
          }
        }
      } else {
        // `*` matches any sequence within a path segment.
        result = at(gi + 1, pi);
        for (let index = pi; index < plen && !result && target[index] !== "/"; index += 1) {
          result = at(gi + 1, index + 1);
        }
      }
    } else {
      result = pi < plen && target[pi] === char && at(gi + 1, pi + 1);
    }
    memo[key] = result ? 1 : 0;
    return result;
  };
  return at(0, 0);
}

export function pathMatchesGlob(path, glob) {
  return matchGlob(glob, path);
}

export function pathMatchesAny(path, globs) {
  return globs.some((glob) => pathMatchesGlob(path, glob));
}

function failPolicy(message) {
  return { ok: false, code: "malformed-config", message };
}

function failDeclaration(message) {
  return { ok: false, code: "malformed-declaration", message };
}

const PHASE_RE = /^P(\d+)$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ------------------------------------------------------------- policy parse */

/**
 * Validate one `path-protection-policy@1` JSON document. The reader fails
 * closed: unknown keys, a wrong schema, a missing class/state/operation, an
 * invalid glob, or an out-of-vocabulary requirement is a refusal.
 */
export function parsePathPolicy(text) {
  if (typeof text !== "string") return failPolicy("policy text must be a string");
  if (text.length > PATH_POLICY_MAX_BYTES) return failPolicy(`policy exceeds the ${PATH_POLICY_MAX_BYTES}-byte bound`);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    return failPolicy(`invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validatePathPolicy(value);
}

function validatePathPolicy(value) {
  if (!isRecord(value)) return failPolicy("policy root must be a JSON object");
  for (const key of Object.keys(value)) {
    if (key !== "schema" && key !== "classes" && key !== "matrix") {
      return failPolicy(`unknown policy key "${key}"`);
    }
  }
  if (value.schema !== PATH_POLICY_SCHEMA) return failPolicy(`schema must be "${PATH_POLICY_SCHEMA}"`);
  if (!isRecord(value.classes)) return failPolicy("classes must be an object");
  if (!isRecord(value.matrix)) return failPolicy("matrix must be an object");

  const classNames = Object.keys(value.classes);
  for (const name of CLASS_NAMES) {
    if (!classNames.includes(name)) return failPolicy(`classes is missing "${name}"`);
  }
  for (const name of classNames) {
    if (!CLASS_NAMES.includes(name)) return failPolicy(`unknown class "${name}"`);
  }
  const classes = {};
  for (const name of CLASS_NAMES) {
    const raw = value.classes[name];
    if (!isRecord(raw)) return failPolicy(`class "${name}" must be an object`);
    if (!Array.isArray(raw.globs)) return failPolicy(`class "${name}" globs must be an array`);
    for (const glob of raw.globs) {
      if (typeof glob !== "string" || glob.trim() === "") return failPolicy(`class "${name}" has an invalid glob`);
    }
    if (typeof raw.freeze !== "boolean") return failPolicy(`class "${name}" freeze must be a boolean`);
    classes[name] = { globs: [...raw.globs], freeze: raw.freeze };
  }

  const states = Object.keys(value.matrix);
  for (const state of PHASE_STATES) {
    if (!states.includes(state)) return failPolicy(`matrix is missing "${state}"`);
  }
  for (const state of states) {
    if (!PHASE_STATES.includes(state)) return failPolicy(`unknown matrix state "${state}"`);
  }
  const matrix = {};
  for (const state of PHASE_STATES) {
    const row = value.matrix[state];
    if (!isRecord(row)) return failPolicy(`matrix "${state}" must be an object`);
    const ops = Object.keys(row);
    for (const op of OPERATIONS) {
      if (!ops.includes(op)) return failPolicy(`matrix "${state}" is missing "${op}"`);
    }
    for (const op of ops) {
      if (!OPERATIONS.includes(op)) return failPolicy(`matrix "${state}" has unknown operation "${op}"`);
    }
    matrix[state] = {};
    for (const op of OPERATIONS) {
      const requirement = row[op];
      if (!REQUIREMENTS.includes(requirement)) {
        return failPolicy(`matrix "${state}.${op}" must be one of ${REQUIREMENTS.join(", ")}`);
      }
      matrix[state][op] = requirement;
    }
  }

  return { ok: true, policy: { schema: PATH_POLICY_SCHEMA, classes, matrix } };
}

/**
 * Tighten-only resolution: globs union, requirements maximum, freeze never
 * lowered. Every ignored removal/lowering appends one degradation record; the
 * shipped protection always stays in force.
 */
export function resolvePathPolicy(shipped = SHIPPED_PATH_POLICY, override = null) {
  const degradations = [];
  const classes = {};

  const names = [...new Set([...Object.keys(shipped.classes), ...Object.keys(override?.classes ?? {})])];
  for (const name of names) {
    const base = shipped.classes[name];
    const own = override?.classes?.[name];
    if (base === undefined) {
      classes[name] = { globs: [...own.globs], freeze: own.freeze };
      continue;
    }
    if (own === undefined) {
      classes[name] = { globs: [...base.globs], freeze: base.freeze };
      continue;
    }
    const globs = [...base.globs];
    for (const glob of own.globs) if (!globs.includes(glob)) globs.push(glob);
    for (const glob of base.globs) {
      if (!own.globs.includes(glob)) {
        degradations.push({ code: "ignored-removal", detail: `class "${name}" omitted the shipped glob "${glob}"; kept` });
      }
    }
    let freeze = base.freeze;
    if (base.freeze === true && own.freeze === false) {
      degradations.push({ code: "ignored-lowering", detail: `class "${name}" lowered freeze; kept true` });
      freeze = true;
    } else if (base.freeze === false && own.freeze === true) {
      freeze = true;
    }
    classes[name] = { globs, freeze };
  }

  const matrix = {};
  for (const state of PHASE_STATES) {
    matrix[state] = {};
    for (const op of OPERATIONS) {
      const base = shipped.matrix?.[state]?.[op] ?? "none";
      const own = override?.matrix?.[state]?.[op];
      if (own === undefined) {
        matrix[state][op] = base;
      } else if (rank(own) < rank(base)) {
        degradations.push({
          code: "ignored-lowering",
          detail: `matrix "${state}.${op}" lowered to "${own}"; kept "${base}"`,
        });
        matrix[state][op] = base;
      } else {
        matrix[state][op] = own;
      }
    }
  }

  return { schema: PATH_POLICY_SCHEMA, classes, matrix, degradations };
}

/* -------------------------------------------------------- block extraction */

/**
 * The lines of the first fenced block carrying `marker`, without the marker
 * line and without blank lines. `null` when the marker is absent.
 */
export function extractFencedBlock(text, marker) {
  const lines = String(text).split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === marker);
  if (start === -1) return null;
  const body = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("```")) break;
    if (trimmed !== "") body.push(trimmed);
  }
  return body;
}

function splitRow(line) {
  return line.split("|").map((cell) => cell.trim());
}

/* --------------------------------------------------------- plan declaration */

/**
 * Parse the `path-protection-plan@1` block: the `freeze-after` line plus
 * `created` / `not-created` / `ignored` rows, each with a non-empty
 * justification. Anything malformed fails closed with `malformed-declaration`.
 */
export function parsePlanDeclaration(text) {
  const body = extractFencedBlock(text, PLAN_DECLARATION_SCHEMA);
  if (body === null) return failDeclaration("the plan declaration block is missing");

  let freezeAfter;
  let headerSeen = false;
  const rows = [];
  for (const line of body) {
    if (line.startsWith("freeze-after:")) {
      const value = line.slice("freeze-after:".length).trim();
      if (value !== "none" && !PHASE_RE.test(value)) {
        return failDeclaration(`freeze-after must be "none" or P<n>, got "${value}"`);
      }
      freezeAfter = value === "none" ? null : value;
      continue;
    }
    if (line === DECLARATION_HEADER.join(" | ")) {
      headerSeen = true;
      continue;
    }
    if (!headerSeen) continue;
    const cells = splitRow(line);
    if (cells.length !== 3) return failDeclaration(`declaration row needs 3 cells, got ${cells.length}`);
    const [kind, path, justification] = cells;
    if (!DECLARATION_KINDS.includes(kind)) return failDeclaration(`unknown declaration kind "${kind}"`);
    if (path === "") return failDeclaration("declaration row has an empty path");
    if (justification === "") return failDeclaration("declaration row has an empty justification");
    rows.push({ kind, path, justification });
  }

  if (freezeAfter === undefined) return failDeclaration("the plan declaration is missing the freeze-after line");
  if (!headerSeen) return failDeclaration("the plan declaration is missing its kind | path | justification header");
  return { ok: true, declaration: { freezeAfter, rows } };
}

/* ----------------------------------------------------------- escape records */

/**
 * Parse the `path-protection-records@1` block: append-only `justification` /
 * `approval` rows. Authority is validated against the kind, so no auto-approval
 * authority can be written.
 */
export function parseRecords(text) {
  const body = extractFencedBlock(text, RECORDS_SCHEMA);
  if (body === null) return { ok: true, records: [] };

  let headerSeen = false;
  const records = [];
  for (const line of body) {
    if (line === RECORDS_HEADER.join(" | ")) {
      headerSeen = true;
      continue;
    }
    if (!headerSeen) continue;
    const cells = splitRow(line);
    if (cells.length !== 6) return failDeclaration(`record row needs 6 cells, got ${cells.length}`);
    const [kind, pathsCell, phase, date, authority, justification] = cells;
    if (!RECORD_KINDS.includes(kind)) return failDeclaration(`unknown record kind "${kind}"`);
    const paths = pathsCell.split(",").map((entry) => entry.trim()).filter((entry) => entry !== "");
    if (paths.length === 0) return failDeclaration("record row has no paths");
    if (!PHASE_RE.test(phase)) return failDeclaration(`record phase must be P<n>, got "${phase}"`);
    if (!DATE_RE.test(date)) return failDeclaration(`record date must be YYYY-MM-DD, got "${date}"`);
    const expected = kind === "justification" ? "execute-phase" : "human-owner";
    if (authority !== expected) return failDeclaration(`a "${kind}" row must have authority "${expected}", got "${authority}"`);
    if (justification === "") return failDeclaration("record row has an empty justification");
    records.push({ kind, paths, phase, date, authority, justification });
  }

  if (!headerSeen) return failDeclaration("the record block is missing its header row");
  return { ok: true, records };
}

/* --------------------------------------------------------------- evaluation */

function phaseOrdinal(phase) {
  const match = PHASE_RE.exec(phase ?? "");
  return match === null ? null : Number.parseInt(match[1], 10);
}

/** `pre-freeze` up to and including `freeze-after`; `post-freeze` after it. */
export function freezeStateFor(phase, freezeAfter) {
  if (freezeAfter === null || freezeAfter === undefined) return "pre-freeze";
  const current = phaseOrdinal(phase);
  const boundary = phaseOrdinal(freezeAfter);
  if (current === null || boundary === null) return "pre-freeze";
  return current <= boundary ? "pre-freeze" : "post-freeze";
}

function declaredCreated(declaration, path) {
  return declaration.rows.some((row) => row.kind === "created" && pathMatchesGlob(path, row.path));
}

function recordMatches(record, path) {
  return record.paths.some((glob) => pathMatchesGlob(path, glob));
}

const FAIL_PRECEDENCE = ["malformed-declaration", "unmatched-record", "undeclared-test", "approval-required", "protected-modification"];

function pickReason(offenders) {
  let best = FAIL_PRECEDENCE.length - 1;
  for (const offender of offenders) {
    const at = FAIL_PRECEDENCE.indexOf(offender.reason);
    if (at !== -1 && at < best) best = at;
  }
  return FAIL_PRECEDENCE[best];
}

/**
 * Evaluate every `(path, operation)` pair against the effective policy. Returns
 * `{ verdict, reason, offenders }` with `reason` always from `PATH_GUARD_REASONS`.
 */
export function evaluatePathGuard({ changes = [], policy = null, declaration = null, records = [], phase = "" }) {
  const effective = policy ?? resolvePathPolicy(SHIPPED_PATH_POLICY, null);
  if (declaration === null || declaration === undefined) {
    return { verdict: "fail", reason: "malformed-declaration", offenders: [] };
  }

  const state = freezeStateFor(phase, declaration.freezeAfter ?? null);
  const phaseRecords = records.filter((record) => record.phase === phase);
  const offenders = [];

  let sawProtected = false;
  let maxRequirement = "none";

  for (const change of changes) {
    const { path, operation } = change;
    const requirements = [];
    let freezeEligible = false;
    for (const name of Object.keys(effective.classes)) {
      const cls = effective.classes[name];
      if (!pathMatchesAny(path, cls.globs)) continue;
      const classState = cls.freeze ? state : "always";
      requirements.push(effective.matrix[classState]?.[operation] ?? "none");
      if (cls.freeze) freezeEligible = true;
    }
    if (requirements.length === 0) continue;

    sawProtected = true;
    const requirement = requirements.reduce((best, current) => (rank(current) > rank(best) ? current : best));
    if (rank(requirement) > rank(maxRequirement)) maxRequirement = requirement;

    if (freezeEligible && operation === "create" && !declaredCreated(declaration, path)) {
      offenders.push({ path, operation, reason: "undeclared-test" });
      continue;
    }
    if (requirement === "none") continue;

    const hasJustification = phaseRecords.some(
      (record) => record.kind === "justification" && recordMatches(record, path),
    );
    const hasApproval = phaseRecords.some((record) => record.kind === "approval" && recordMatches(record, path));

    if (requirement === "justification") {
      if (!hasJustification) offenders.push({ path, operation, reason: "protected-modification" });
    } else if (requirement === "approval") {
      if (!hasJustification) offenders.push({ path, operation, reason: "protected-modification" });
      else if (!hasApproval) offenders.push({ path, operation, reason: "approval-required" });
    }
  }

  for (const record of phaseRecords) {
    const matched = changes.some((change) => recordMatches(record, change.path));
    if (!matched) {
      offenders.push({ path: record.paths.join(","), operation: "record", reason: "unmatched-record" });
    }
  }

  if (offenders.length > 0) {
    return { verdict: "fail", reason: pickReason(offenders), offenders };
  }

  let reason = "clean";
  if (sawProtected && maxRequirement === "approval") reason = "approved";
  else if (sawProtected && maxRequirement === "justification") reason = "justified";
  return { verdict: "pass", reason, offenders: [] };
}
