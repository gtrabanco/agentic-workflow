/**
 * vocabulary.mjs — the ceremony doctor's contract ids and closed sets (issue #703).
 *
 * Five contracts, one command family and four closed value sets. The sets are
 * **runner-internal** on purpose: the `normative-surfaces@1` rows that declare
 * them carry `machine: n/a`, exactly as `journal-corpus-grammar` does, so no
 * published contract names them and `vocabulary-residency@1`'s
 * `runner-internal` case applies (the unit's D7). A future unit that publishes
 * one of them moves it to `@gtrabanco/agentic-workflow-schema` in that change,
 * never as a copy.
 *
 * Two vocabularies are read from their owners instead of restated here: the
 * journal's signal kinds come from `journal-corpus`, and the marker set below is
 * the miner's own — because it is a join of two carriers, not either one's
 * contract.
 */

/** The subcommand name the crate dispatches and the skills cite. */
export const COMMAND = "workflow-doctor";

/** The history miner's receipt. */
export const MINE_CONTRACT = "workflow-doctor-mine@1";
/** The anonymized bundle `bundle` renders and `route`/`publish` consume. */
export const BUNDLE_CONTRACT = "workflow-doctor-bundle@1";
/** The live battery, which carries the tool doctor's `doctor@1` envelope as-is. */
export const BATTERY_CONTRACT = "workflow-doctor-battery@1";

/**
 * The env key a host integration declares the installed skills tree through
 * (the pi package publishes its mounted tree there at session start). The
 * battery reads it; the crate never guesses a host's layout — the #716/#717
 * class rule: a location a consumer cannot satisfy is declared, not assumed.
 */
export const SKILLS_ROOT_ENV = "AGENTIC_WORKFLOW_SKILLS_ROOT";

/** The skills-tree sources the battery's receipt may name, in precedence order. */
export const SKILLS_SOURCES = Object.freeze(["declared", "host", "agents", "claude-code", "source"]);
/** The upstream routing receipt. */
export const ROUTE_CONTRACT = "workflow-doctor-route@1";
/** The consent-gated publication receipt. */
export const PUBLISH_CONTRACT = "workflow-doctor-publish@1";

/**
 * The ceremony events this command can name, in render order. Each one is a
 * shape a machine already owns — a `## Log` line kind, an aggregate of those
 * lines, or a `journal-corpus` row — never a word found in prose (the unit's D3).
 */
export const MARKER_KINDS = Object.freeze([
  "gate-red",
  "evidence-red",
  "review-fail",
  "fold-over-budget",
  "review-cycles-over-budget",
  "correction",
  "refuted-finding",
  "rework",
]);

/** The only two verdicts a triage class may carry (`S6`). */
export const VERDICTS = Object.freeze(["report", "discard"]);

/** The closed discard reasons — the rubric's `discard` column (`S6`). */
export const DISCARD_REASONS = Object.freeze([
  "operator-error",
  "env-specific",
  "covered-upstream",
  "one-off-human",
]);

/** The closed report reasons — the rubric's `report` column (`S6`). */
export const REPORT_REASONS = Object.freeze([
  "reproducible-defect",
  "contract-vs-behavior",
  "cross-project-recurrence",
]);

/** The five ops, in the order the skill runs them. */
export const OPS = Object.freeze(["mine", "battery", "bundle", "route", "publish"]);

/** A unit with more folded findings than this is over the correction budget. */
export const DEFAULT_FOLD_BUDGET = 2;

/** A unit with more review cycles than this is over the correction budget. */
export const DEFAULT_CYCLE_BUDGET = 2;

/**
 * How many tokens a report class and a candidate issue must share before the
 * route calls it a match. One shared word is a coincidence; two is the floor a
 * maintainer can check by hand.
 */
export const MIN_MATCH = 2;

/** At most this many mined rows may be cited as one class's evidence. */
export const MAX_CLASS_EVIDENCE = 5;

/** At most this many candidate issues are read per invocation. */
export const MAX_CANDIDATES = 10;

/** The command's own usage line. */
export const USAGE = `usage: agentic-workflow ${COMMAND} <${OPS.join("|")}> [flags]`;

/**
 * A typed refusal: `refusal` is one of the strings this module's callers publish
 * (the CLI prints it, the tests assert it) and `message` is the sentence a person
 * reads. A refusal never prints a receipt.
 */
export class DoctorRefusal extends Error {
  /**
   * @param {string} refusal the closed refusal token
   * @param {string} message the human sentence
   */
  constructor(refusal, message) {
    super(message);
    this.name = "DoctorRefusal";
    this.refusal = refusal;
  }
}
