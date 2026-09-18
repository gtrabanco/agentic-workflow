#!/usr/bin/env node

/**
 * The single source of the pre-execution snapshot contract's **shape**: the
 * per-stage artifact tables, the governing context sources, and the
 * `Pre-execution review receipt v1` grammar.
 *
 * Two consumers read it:
 *
 * - `scripts/pre-execution-snapshot.mjs` — the verifier that owns the machine
 *   semantics (snapshot building, freshness attribution, receipts).
 * - `scripts/workflow-status.mjs` — the sensor, which re-derives the same bound
 *   set for review-mark currency and reads the same receipts.
 *
 * Both used to carry their own copy: the sensor re-declared the tables under a
 * "mirrors the two tables" comment and re-implemented the receipt parser. A
 * change to the verifier's bound set would then have made the sensor's currency
 * check silently inspect the wrong paths (F24), and two parsers of one grammar
 * can drift apart (F25). The shape lives here once.
 *
 * Dependency-free on purpose: the sensor's contract is "no external dependency
 * beyond the built schema package" — `scripts/schema-runtime.mjs` owns that
 * loader — so nothing here may import the schema or any other package.
 */

/**
 * Artifact rows per stage — the same lists `review-spec`/`review-plan` publish.
 * A required file that is absent is refused (a silent omission would bind a
 * smaller set than the contract reviewed); an optional one is skipped because an
 * XS/S or fix unit legitimately embeds its ledgers in the SPEC (D20) and a fix
 * unit has no PLAN/architecture notes at all.
 */
export const STAGE_ARTIFACTS = {
  spec: [
    { kind: "spec", file: "SPEC.md", selector: "spec-product-v1", required: true },
  ],
  plan: [
    { kind: "spec", file: "SPEC.md", required: true },
    { kind: "acceptance", file: "ACCEPTANCE.md", required: true },
    { kind: "planning-evidence", file: "planning-evidence.md", required: false },
    { kind: "obligations", file: "planning-obligations.md", required: false },
    { kind: "plan", file: "PLAN.md", required: false },
    { kind: "tasks", file: "TASKS.md", required: false },
    { kind: "testing", file: "testing.md", required: false },
    { kind: "decisions", file: "decisions.md", required: false },
    { kind: "architecture-notes", file: "architecture-notes.md", required: false },
  ],
};

/** The governing authorities every stage binds beside its own artifacts. */
export const CONTEXT_SOURCES = [
  // `docs/features/ROADMAP.md` is deliberately NOT bound (roadmap scoping). It is
  // the shared lifecycle ledger of every unit: rows for other units are appended
  // while a plan is in flight, and the status machine's own sanctioned writes
  // (`planned` → `in-progress` set by execute-phase P1, `done` at PR open) would
  // otherwise invalidate every recorded receipt repo-wide and force pointless
  // re-reviews. Its safety-relevant content is owned by gates that re-read it
  // live: the own-status gate (every invocation) and the dependency gate (its
  // Dependency receipt v1 fingerprints the SPEC `Depends on:` line plus the
  // closure roadmap rows). The unit's own artifacts and the governing
  // authorities below stay fully bound.
  { kind: "project-guide", file: "CLAUDE.md" },
  { kind: "normalized-repository-state", file: "docs/workflow/REPOSITORY_STATE.md" },
  // The *project's* declared invariants only: docs/workflow/WORKFLOW_INVARIANTS.md
  // is the portable evaluation contract, never a project's rule set, so binding it
  // would report presence where the project declared none.
  { kind: "architectural-invariants", file: "docs/architecture/ARCHITECTURAL_INVARIANTS.md" },
];

/**
 * A recorded line's digest shape. The value normalizer below turns the recorded
 * `sha256:<hex>` dress into bare hex, so the shape it tests is the bare one.
 */
export const DIGEST64 = /^[a-f0-9]{64}$/;
const NULL_WORDS = new Set(["null", "none", "n/a", "na", "—", "-", ""]);

/** A recorded line as a comparable value: backticks and a `sha256:` prefix are dress. */
export function recordedValue(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/`/g, "").trim();
  const bare = text.startsWith("sha256:") ? text.slice(7).trim() : text;
  return NULL_WORDS.has(bare.toLowerCase()) ? null : bare;
}

const FIELD_RES = new Map();
const fieldFrom = (chunk, label) => {
  let re = FIELD_RES.get(label);
  if (!re) FIELD_RES.set(label, (re = new RegExp(`${label}:\\s*([^\\n·]+)`)));
  const m = chunk.match(re);
  return m ? m[1].replace(/[`]/g, "").trim() : null;
};

/**
 * The receipt's own recorded `Started/finished:` line (`…/…`), split on the
 * slash. An unparsable or absent value stays `null` (fail-open): the
 * `impossible-timeline` guard never flags a receipt it cannot read.
 */
function timelineField(chunk, index) {
  const line = chunk.split(/\n/).find((l) => l.trim().startsWith("- Started/finished:"));
  if (!line) return null;
  // The timestamps are whitespace-free tokens separated by `/`; the field ends at
  // the ` · Findings:` sentence, so a regex that grabs exactly the two tokens never
  // lets a trailing column into a value that is then handed to a date parser.
  const m = line.match(/Started\/finished:\s*([^\s]+)\/([^\s]+)/);
  if (!m) return null;
  return recordedValue(m[index + 1]);
}

/**
 * Every `Pre-execution review receipt v1` block in a progress ledger, in file
 * order — the one parser of the one grammar. The newest block for a stage is the
 * last entry of the stage's filtered slice, so a consumer never re-implements the
 * split or the field labels.
 *
 * `text === null` (an unreadable ledger) reads as "no receipts", never as an
 * error: absence of a ledger and absence of a receipt are the same answer to
 * every caller.
 */
export function parseReceipts(text) {
  if (text === null || text === undefined) return [];
  return String(text).split(/^## Pre-execution review receipt v1 — /m).slice(1).map((chunk) => ({
    stage: chunk.startsWith("spec") ? "spec" : chunk.startsWith("plan") ? "plan" : "unknown",
    id: fieldFrom(chunk, "Review"),
    snapshot: fieldFrom(chunk, "Snapshot"),
    verdict: fieldFrom(chunk, "Verdict"),
    unit: fieldFrom(chunk, "Unit"),
    unitKind: fieldFrom(chunk, "Unit kind"),
    sourceRevision: fieldFrom(chunk, "Source revision"),
    artifactRevision: fieldFrom(chunk, "Artifact revision"),
    // A SPEC block writes `Parent: null`, a Plan block writes
    // `Parent SPEC snapshot: <64-hex>`; either line is the lineage this receipt states.
    // #221: a fix plan receipt's contract-mandated `Parent SPEC snapshot: null`
    // must parse as the ABSENCE value, not the truthy string `"null"` — the sensor
    // keyed on a truthy parent and spawned `verify --parent null`, which the schema
    // refuses. Route the lineage through the module's own `recordedValue`/NULL_WORDS
    // (PE-007) so a null-word line reads `null` and a `sha256:`-dressed digest reads
    // its bare hex; feature receipts record bare hex (PE-008), so this is their no-op.
    parent: recordedValue(fieldFrom(chunk, "Parent SPEC snapshot") ?? fieldFrom(chunk, "Parent")),
    authorExclusion: fieldFrom(chunk, "Author exclusion"),
    contextClean: fieldFrom(chunk, "Context clean"),
    policy: fieldFrom(chunk, "Policy"),
    startedAt: timelineField(chunk, 0),
    finishedAt: timelineField(chunk, 1),
  }));
}

/**
 * The consecutive-unconverged review→repair→re-review count per stage, derived
 * from the parsed receipts (E-D31-10/D-31-7): the count is the FAIL-verdict
 * receipts for a stage since that stage's last PASS-verdict receipt; a PASS
 * resets it and a stage with no receipt reads `0`. One shared pure helper, so
 * the sensor's projection and the vector suites cannot drift. Non-FAIL,
 * non-PASS verdicts (e.g. `needs-design`) neither increment nor reset.
 */
export function deriveReviewLoopCycles(receipts) {
  const rows = Array.isArray(receipts) ? receipts : [];
  const result = { spec: 0, plan: 0 };
  for (const stage of ["spec", "plan"]) {
    const pass = stage === "spec" ? "spec-review-pass" : "plan-review-pass";
    const fail = stage === "spec" ? "spec-review-fail" : "plan-review-fail";
    const stageRows = rows.filter((row) => row && row.stage === stage);
    let lastPass = -1;
    for (let i = 0; i < stageRows.length; i += 1) {
      if (stageRows[i].verdict === pass) lastPass = i;
    }
    let count = 0;
    for (let i = lastPass + 1; i < stageRows.length; i += 1) {
      if (stageRows[i].verdict === fail) count += 1;
    }
    result[stage] = count;
  }
  return result;
}

/**
 * One `- <label>: <value>` field of a determination block. The determination
 * grammar is NOT the receipt grammar (its labels are read by a distinct block
 * kind), so it carries its own extractor: the receipt parser's label scan must
 * keep proving that every RECEIPT label is emitted by both stage templates.
 * The label may sit mid-line — the frozen SPEC E5 block carries several fields
 * on one ` \u00b7 `-separated line — and the value ends at the next ` \u00b7 ` or the
 * line end, the same termination the receipt scan uses.
 */
function determinationLine(chunk, label) {
  const match = chunk.match(new RegExp(`${label}:[ \\t]*([^\\n\u00b7]+)`));
  return match ? match[1].replace(/`/g, "").trim() : null;
}

/**
 * Every `## Wording-only determination v1 — <stage>` block in a progress ledger,
 * in file order. The machine half of the wording-only route (feature 31): the
 * block records the artifact revision the repair rotated and the acceptance
 * fingerprint the repair left unmoved, plus the author's intent/authority
 * judgment. Read from the unit's unbound `progress.md`, so recording it cannot
 * rotate the revision it names. `text === null` reads as "no determinations".
 */
export function parseWordingOnlyDeterminations(text) {
  if (text === null || text === undefined) return [];
  return String(text).split(/^## Wording-only determination v1 — /m).slice(1).map((chunk) => ({
    stage: chunk.startsWith("spec") ? "spec" : chunk.startsWith("plan") ? "plan" : "unknown",
    id: determinationLine(chunk, "Determination"),
    revision: determinationLine(chunk, "Artifact revision"),
    acceptanceFingerprint: recordedValue(determinationLine(chunk, "Acceptance fingerprint")),
    unchanged: /^(yes|true)$/i.test((determinationLine(chunk, "Intent and authority unchanged") ?? "").trim()),
  }));
}
