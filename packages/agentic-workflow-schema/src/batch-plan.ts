/**
 * The canonical batch plan (`batch-plan@3`) — issue #449's machine envelope:
 * the deterministic batch scheduler's document, read as data by the owner and
 * by the #295 panel.
 *
 * The journal-entry precedent: one versioned document, a contract id, a
 * dependency-free validator, closed vocabularies, and a draft-07 JSON Schema
 * document (`batch-plan.schema.json`) the package suite compiles and pins.
 *
 * **Core is closed.** An unknown top-level key is refused, as is an unknown
 * key inside `batches[]`, `lanes[]`, `issues[]`, `blocked[]`, `launched[]`,
 * `findings[]` and `summary`. There is deliberately no `metadata` escape: the
 * document is a computed projection of the live work graph — anything a
 * consumer needs beyond it is a version bump, never an open map.
 *
 * **The document carries facts, never policy.** Size hints are reported; the
 * lane count decision is the consumer's. `worktree` and `command` are reported
 * strings; the planner never launches anything.
 */

/** The contract id of the canonical batch plan. */
export const BATCH_PLAN_CONTRACT_ID = "agentic-workflow/batch-plan";

/** The schema token printed in the document's `schema` field. */
export const BATCH_PLAN_SCHEMA = "batch-plan@3";

/** The version constant: adding or changing a core field bumps this. */
export const BATCH_PLAN_VERSION = 3;

/** The closed reason-kind set — why an issue sits where it sits (S4). */
export const BATCH_REASON_KINDS = ["satisfied-inputs", "surface-conflict", "soft-ordered", "untriaged", "soft-deps-open"] as const;
export type BatchReasonKind = (typeof BATCH_REASON_KINDS)[number];

/**
 * The closed finding-code set — unresolvable spots are findings, never silent (S7).
 *
 * `file-overlap` and `stale-claim` were added by issue #509: two issues of one
 * batch on different lanes whose branches rewrite the same file cannot be
 * merged without conflict, and a persisted claim whose evidence lapsed (or that
 * carries a pre-v3 bare-number key) is a work-graph fact the plan reports
 * instead of honoring. Both extend the vocabulary only — no field is added, so
 * the version stays put (the core-closed rule above bumps it for a field).
 */
export const BATCH_FINDING_CODES = [
  "cycle",
  "orphaned-soft-dep",
  "prose-native-mismatch",
  "file-overlap",
  "stale-claim",
] as const;
export type BatchFindingCode = (typeof BATCH_FINDING_CODES)[number];

/**
 * The labels that make an issue unlaunchable (issue #509, S11): `postponed` and
 * `backlog` as the issue names them, and `human-revision-needed` because the
 * workflow's own guide holds it as "nothing is planned, implemented, committed
 * or merged" — a scheduler that recommends launching it violates that hold.
 * `wontfix` is deliberately absent: its lifecycle is closure, not a hold.
 */
export const BATCH_BLOCKING_LABELS = ["postponed", "backlog", "human-revision-needed"] as const;
export type BatchBlockingLabel = (typeof BATCH_BLOCKING_LABELS)[number];

/** The closed size-hint vocabulary — measured from each issue's declared evidence (S5). */
export const BATCH_SIZE_HINTS = ["light", "mixed", "heavy"] as const;
export type BatchSizeHint = (typeof BATCH_SIZE_HINTS)[number];

/** The closed field-name set the plan grammar block orders (`batch-fields@1`). */
export const BATCH_PLAN_FIELDS = [
  "contract", "version", "schema", "source_revision", "degraded", "batches", "blocked", "launched", "findings", "summary",
  "new_issues", "closed_since", "label_blocked",
  "n", "lanes", "surface", "occupied_by", "issues", "number", "title", "lane", "worktree", "command", "reason", "kind",
  "size_hint", "claimed", "triaged", "blockers", "evidence", "code", "numbers", "detail", "open_issues", "batched",
  "labels",
] as const;

/**
 * Degradations follow the sensor convention `unavailable-<source>-<cause>`
 * (`unavailable-forge-gh-cli`, `unavailable-roadmap-missing`); the prefix is
 * checked, the cause is free.
 */
const DEGRADED = /^unavailable-[a-z0-9-]+$/u;

/** A git revision (abbreviated or full) as the plan's source anchor. */
const REVISION = /^[0-9a-f]{7,40}$/u;

/** A worktree/branch name hint: `<prefix>/<issue>-<slug>`. */
const WORKTREE = /^[a-z][a-z0-9-]*\/\d+-[a-z0-9-]*$/u;

const MAX_TITLE = 512;
const MAX_DETAIL = 1024;
const MAX_PATH = 1024;
const MAX_BATCHES = 100;
const MAX_LANES_PER_BATCH = 100;
const MAX_ISSUES = 1000;
const MAX_ITEMS = 1000;

export interface BatchIssueReason {
  kind: BatchReasonKind;
  detail: string;
}

/** A row of `new_issues[]`: an issue first seen in this run (issue #460). */
export interface BatchNewIssue {
  number: number;
  title: string;
}

/** A row of `closed_since[]`: an issue in the previous plan, closed now, with its last known row. */
export interface BatchClosedIssue {
  number: number;
  title: string;
  /** The last batch the issue sat in, when the previous plan batched it. */
  batch: number | null;
  /** The last lane the issue occupied, when the previous plan batched it. */
  lane: string | null;
  /** The instant the previous run last saw the issue open. */
  last_seen: string;
}

export interface BatchIssue {
  number: number;
  title: string;
  /** The surface key — one lane per surface (S3, S5). */
  lane: string;
  /** Reported, never created by the planner (S9). */
  worktree: string;
  /** The exact launch command form: `/unit-lane --from-issue <N>` (S4). */
  command: string;
  reason: BatchIssueReason;
  size_hint: BatchSizeHint;
  /** Set by a re-run that recognizes the lane in the persisted state (S6). */
  claimed?: boolean;
  /** False when the issue's roadmap row shows no triage yet (issue #460); absent when triaged. */
  triaged?: boolean;
}

export interface BatchLane {
  surface: string;
  /** What already occupies the surface (an in-flight unit dir), or null. */
  occupied_by: string | null;
  size_hint: BatchSizeHint;
  issues: BatchIssue[];
}

export interface Batch {
  n: number;
  lanes: BatchLane[];
}

/** A row of `label_blocked[]`: an issue a hold label keeps out of every batch (issue #509, S11). */
export interface BatchLabelBlocked {
  number: number;
  /** The blocking labels the issue carries, in the published vocabulary's order. */
  labels: string[];
}

export interface BatchBlocked {
  number: number;
  blockers: number[];
  reason: string;
}

export interface BatchFinding {
  code: BatchFindingCode;
  numbers: number[];
  detail: string;
}

export interface BatchPlanSummary {
  open_issues: number;
  batched: number;
  blocked: number;
  launched: number;
  findings: number;
  batches: number;
  label_blocked: number;
}

export interface BatchPlan {
  contract: typeof BATCH_PLAN_CONTRACT_ID;
  version: typeof BATCH_PLAN_VERSION;
  /** Convenience token equal to `batch-plan@<version>` for quick identification. */
  schema: string;
  /** The git revision the plan was computed at. */
  source_revision: string;
  /** Declared degradations, `unavailable-<source>-<cause>` (never a silent empty plan). */
  degraded: string[];
  /** Batch 1 is the runnable-now set; batch N+1 becomes runnable when batch N completes. */
  batches: Batch[];
  /** Hard-blocked issues with the open blockers that gate them (S5). */
  blocked: BatchBlocked[];
  /** Issues already running (unit doc in flight), excluded from batches (S3). */
  launched: { number: number; evidence: string }[];
  /** Issues a hold label keeps unlaunchable, reported as their own category (issue #509, S11). */
  label_blocked: BatchLabelBlocked[];
  /** Unresolvable spots: cyclic waits, orphaned soft deps, prose/native disagreements, cross-lane file overlaps and expired claims (S7). */
  findings: BatchFinding[];
  /** Issues first seen in this run (issue #460) — a fresh issue is reported, never silent. */
  new_issues: BatchNewIssue[];
  /** Issues in the previous plan, closed now, with their last known row (issue #460). */
  closed_since: BatchClosedIssue[];
  summary: BatchPlanSummary;
}

export interface BatchPlanValidationResult {
  ok: boolean;
  errors: string[];
}

function isObj(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnexpectedKeys(value: object, label: string, allowed: string[], errors: string[]): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) errors.push(`${label} has unexpected key: ${key}`);
  }
}

function boundedString(value: unknown, label: string, max: number, errors: string[], required = true): void {
  if (typeof value !== "string") {
    if (!required && value === undefined) return;
    errors.push(`${label} must be a string`);
    return;
  }
  if (required && value.length === 0) errors.push(`${label} must be non-empty`);
  if (value.length > max) errors.push(`${label} exceeds ${max} characters`);
}

function positiveInt(value: unknown, label: string, errors: string[]): boolean {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    errors.push(`${label} must be a non-negative integer`);
    return false;
  }
  return true;
}

function issueNumber(value: unknown, label: string, errors: string[]): boolean {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    errors.push(`${label} must be a positive integer`);
    return false;
  }
  return true;
}

/**
 * Validate one document against `batch-plan@3`. Structural and
 * vocabulary-closed; ordering/semantics stay the producer's tests.
 */
export function validateBatchPlan(value: unknown): BatchPlanValidationResult {
  const errors: string[] = [];
  if (!isObj(value)) return { ok: false, errors: ["batch plan is not a JSON object"] };
  rejectUnexpectedKeys(
    value,
    "batch plan",
    ["contract", "version", "schema", "source_revision", "degraded", "batches", "blocked", "launched", "findings", "summary", "new_issues", "closed_since", "label_blocked"],
    errors,
  );
  if (value.contract !== BATCH_PLAN_CONTRACT_ID) errors.push(`contract must be ${BATCH_PLAN_CONTRACT_ID}`);
  if (value.version !== BATCH_PLAN_VERSION) errors.push(`version must be ${BATCH_PLAN_VERSION}`);
  if (value.schema !== BATCH_PLAN_SCHEMA) errors.push(`schema must be ${BATCH_PLAN_SCHEMA}`);
  if (typeof value.source_revision !== "string" || !REVISION.test(value.source_revision)) {
    errors.push("source_revision must be a git revision (7-40 lowercase hex)");
  }
  if (!Array.isArray(value.degraded)) errors.push("degraded must be an array");
  else {
    if (value.degraded.length > MAX_ITEMS) errors.push(`degraded exceeds ${MAX_ITEMS} entries`);
    for (const d of value.degraded) {
      if (typeof d !== "string" || !DEGRADED.test(d)) errors.push("each degraded entry must match unavailable-<source>-<cause>");
    }
  }

  let issueCount = 0;
  if (!Array.isArray(value.batches)) errors.push("batches must be an array");
  else {
    if (value.batches.length > MAX_BATCHES) errors.push(`batches exceeds ${MAX_BATCHES} entries`);
    let previousN = 0;
    value.batches.forEach((batch, bi) => {
      const label = `batches[${bi}]`;
      if (!isObj(batch)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(batch, label, ["n", "lanes"], errors);
      if (positiveInt(batch.n, `${label}.n`, errors)) {
        if ((batch.n as number) <= previousN) errors.push(`${label}.n must be strictly ascending`);
        previousN = batch.n as number;
      }
      if (!Array.isArray(batch.lanes)) return errors.push(`${label}.lanes must be an array`);
      if (batch.lanes.length > MAX_LANES_PER_BATCH) errors.push(`${label}.lanes exceeds ${MAX_LANES_PER_BATCH} entries`);
      const surfaces = new Set<string>();
      batch.lanes.forEach((lane, li) => {
        const laneLabel = `${label}.lanes[${li}]`;
        if (!isObj(lane)) return errors.push(`${laneLabel} must be an object`);
        rejectUnexpectedKeys(lane, laneLabel, ["surface", "occupied_by", "size_hint", "issues"], errors);
        boundedString(lane.surface, `${laneLabel}.surface`, MAX_PATH, errors);
        if (surfaces.has(lane.surface as string)) errors.push(`${laneLabel}: duplicate surface ${String(lane.surface)} in batch ${String(batch.n)}`);
        surfaces.add(lane.surface as string);
        if (lane.occupied_by !== null && typeof lane.occupied_by !== "string") errors.push(`${laneLabel}.occupied_by must be a string or null`);
        if (typeof lane.occupied_by === "string" && lane.occupied_by.length > MAX_PATH) errors.push(`${laneLabel}.occupied_by exceeds ${MAX_PATH} characters`);
        if (!(BATCH_SIZE_HINTS as readonly string[]).includes(lane.size_hint as BatchSizeHint)) errors.push(`${laneLabel}.size_hint must be light|mixed|heavy`);
        if (!Array.isArray(lane.issues)) return errors.push(`${laneLabel}.issues must be an array`);
        lane.issues.forEach((row, ii) => {
          const rowLabel = `${laneLabel}.issues[${ii}]`;
          issueCount += 1;
          if (!isObj(row)) return errors.push(`${rowLabel} must be an object`);
          rejectUnexpectedKeys(row, rowLabel, ["number", "title", "lane", "worktree", "command", "reason", "size_hint", "claimed", "triaged"], errors);
          issueNumber(row.number, `${rowLabel}.number`, errors);
          boundedString(row.title, `${rowLabel}.title`, MAX_TITLE, errors);
          boundedString(row.lane, `${rowLabel}.lane`, MAX_PATH, errors);
          if (row.lane !== lane.surface) errors.push(`${rowLabel}.lane must equal its lane's surface`);
          if (typeof row.worktree !== "string" || !WORKTREE.test(row.worktree)) errors.push(`${rowLabel}.worktree must be <prefix>/<issue>-<slug>`);
          boundedString(row.command, `${rowLabel}.command`, MAX_PATH, errors);
          if (!isObj(row.reason)) errors.push(`${rowLabel}.reason must be an object`);
          else {
            rejectUnexpectedKeys(row.reason, `${rowLabel}.reason`, ["kind", "detail"], errors);
            if (!(BATCH_REASON_KINDS as readonly string[]).includes(row.reason.kind as BatchReasonKind)) {
              errors.push(`${rowLabel}.reason.kind must be satisfied-inputs|surface-conflict|soft-ordered`);
            }
            boundedString(row.reason.detail, `${rowLabel}.reason.detail`, MAX_DETAIL, errors);
          }
          if (!(BATCH_SIZE_HINTS as readonly string[]).includes(row.size_hint as BatchSizeHint)) errors.push(`${rowLabel}.size_hint must be light|mixed|heavy`);
          if (row.claimed !== undefined && typeof row.claimed !== "boolean") errors.push(`${rowLabel}.claimed must be a boolean when present`);
          if (row.triaged !== undefined && typeof row.triaged !== "boolean") errors.push(`${rowLabel}.triaged must be a boolean when present`);
        });
      });
    });
  }
  if (issueCount > MAX_ISSUES) errors.push(`batched issues exceed ${MAX_ISSUES}`);

  if (!Array.isArray(value.blocked)) errors.push("blocked must be an array");
  else {
    if (value.blocked.length > MAX_ITEMS) errors.push(`blocked exceeds ${MAX_ITEMS} entries`);
    value.blocked.forEach((row, bi) => {
      const label = `blocked[${bi}]`;
      if (!isObj(row)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(row, label, ["number", "blockers", "reason"], errors);
      issueNumber(row.number, `${label}.number`, errors);
      if (!Array.isArray(row.blockers) || row.blockers.length === 0) errors.push(`${label}.blockers must be a non-empty array`);
      else for (const b of row.blockers) issueNumber(b, `${label}.blockers[]`, errors);
      boundedString(row.reason, `${label}.reason`, MAX_DETAIL, errors);
    });
  }

  if (!Array.isArray(value.launched)) errors.push("launched must be an array");
  else {
    if (value.launched.length > MAX_ITEMS) errors.push(`launched exceeds ${MAX_ITEMS} entries`);
    value.launched.forEach((row, li) => {
      const label = `launched[${li}]`;
      if (!isObj(row)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(row, label, ["number", "evidence"], errors);
      issueNumber(row.number, `${label}.number`, errors);
      boundedString(row.evidence, `${label}.evidence`, MAX_PATH, errors);
    });
  }

  if (!Array.isArray(value.label_blocked)) errors.push("label_blocked must be an array");
  else {
    if (value.label_blocked.length > MAX_ITEMS) errors.push(`label_blocked exceeds ${MAX_ITEMS} entries`);
    value.label_blocked.forEach((row, li) => {
      const label = `label_blocked[${li}]`;
      if (!isObj(row)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(row, label, ["number", "labels"], errors);
      issueNumber(row.number, `${label}.number`, errors);
      if (!Array.isArray(row.labels) || row.labels.length === 0) errors.push(`${label}.labels must be a non-empty array`);
      else {
        for (const name of row.labels) {
          if (typeof name !== "string" || name === "") errors.push(`${label}.labels[] must be a non-empty string`);
          else if (!(BATCH_BLOCKING_LABELS as readonly string[]).includes(name)) {
            errors.push(`${label}.labels[] must be one of ${BATCH_BLOCKING_LABELS.join("|")}`);
          }
        }
      }
    });
  }

  if (!Array.isArray(value.findings)) errors.push("findings must be an array");
  else {
    if (value.findings.length > MAX_ITEMS) errors.push(`findings exceeds ${MAX_ITEMS} entries`);
    value.findings.forEach((row, fi) => {
      const label = `findings[${fi}]`;
      if (!isObj(row)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(row, label, ["code", "numbers", "detail"], errors);
      if (!(BATCH_FINDING_CODES as readonly string[]).includes(row.code as BatchFindingCode)) {
        errors.push(`${label}.code must be cycle|orphaned-soft-dep|prose-native-mismatch|file-overlap|stale-claim`);
      }
      if (!Array.isArray(row.numbers) || row.numbers.length === 0) errors.push(`${label}.numbers must be a non-empty array`);
      else for (const n of row.numbers) issueNumber(n, `${label}.numbers[]`, errors);
      boundedString(row.detail, `${label}.detail`, MAX_DETAIL, errors);
    });
  }

  if (!Array.isArray(value.new_issues)) errors.push("new_issues must be an array");
  else {
    if (value.new_issues.length > MAX_ITEMS) errors.push(`new_issues exceeds ${MAX_ITEMS} entries`);
    value.new_issues.forEach((row, ni) => {
      const label = `new_issues[${ni}]`;
      if (!isObj(row)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(row, label, ["number", "title"], errors);
      issueNumber(row.number, `${label}.number`, errors);
      boundedString(row.title, `${label}.title`, MAX_TITLE, errors);
    });
  }

  if (!Array.isArray(value.closed_since)) errors.push("closed_since must be an array");
  else {
    if (value.closed_since.length > MAX_ITEMS) errors.push(`closed_since exceeds ${MAX_ITEMS} entries`);
    value.closed_since.forEach((row, ci) => {
      const label = `closed_since[${ci}]`;
      if (!isObj(row)) return errors.push(`${label} must be an object`);
      rejectUnexpectedKeys(row, label, ["number", "title", "batch", "lane", "last_seen"], errors);
      issueNumber(row.number, `${label}.number`, errors);
      boundedString(row.title, `${label}.title`, MAX_TITLE, errors);
      if (row.batch !== null && (typeof row.batch !== "number" || !Number.isInteger(row.batch) || row.batch < 0)) {
        errors.push(`${label}.batch must be a non-negative integer or null`);
      }
      if (row.lane !== null) boundedString(row.lane, `${label}.lane`, MAX_PATH, errors);
      if (typeof row.last_seen !== "string" || row.last_seen.length === 0 || row.last_seen.length > 64) {
        errors.push(`${label}.last_seen must be a non-empty string of at most 64 characters`);
      }
    });
  }

  if (!isObj(value.summary)) errors.push("summary must be an object");
  else {
    rejectUnexpectedKeys(value.summary, "summary", ["open_issues", "batched", "blocked", "launched", "findings", "batches", "label_blocked"], errors);
    for (const key of ["open_issues", "batched", "blocked", "launched", "findings", "batches", "label_blocked"] as const) {
      positiveInt(value.summary[key], `summary.${key}`, errors);
    }
  }

  return { ok: errors.length === 0, errors };
}
