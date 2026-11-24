/**
 * help.mjs — the CLI's own grammar, declared once (issue #603).
 *
 * The universal CLI carries 72 subcommands across two dispatch tables: the
 * bin's editor-services `switch` and the `RUNNER_COMMANDS` table its `default`
 * arm forwards to. Before this module that grammar lived in exactly one
 * human-facing place — the crate README's Commands table — so a mistyped
 * command answered a bare refusal naming no legal candidate, and every session
 * re-read the README to learn flag sequences it then half-remembered.
 *
 * This file is the one machine home of that grammar. Each entry declares the
 * subcommand's family, its one-line summary and, where the subcommand itself is
 * a closed registry, the ops/flags it accepts. `help` renders from it, the
 * failure path suggests from it, and `cli.surface.test.mjs` pins it against the
 * crate README in both directions — so a new subcommand cannot ship without a
 * help row, and a help row cannot name a subcommand that does not dispatch.
 *
 * What this module deliberately is NOT: a second copy of any op vocabulary the
 * dispatcher already owns. The ceremony op sets are read from the ceremony
 * modules' own tables, never restated, so the two can never disagree.
 *
 * Zero standing token cost: nothing here is loaded by a subcommand that does not
 * answer `help` or refuse a bad argument, and nothing here is model-facing.
 */

import { CEREMONY_OBJECTS } from "./ceremony/index.mjs";

/** The families a subcommand belongs to; `help` groups its index by these. */
export const HELP_FAMILIES = Object.freeze({
  editing: "Typed file services — read and write the project's documents through a schema-checked receipt",
  sensor: "Read-only sensors — compute a state and print a fixed envelope, never write",
  guard: "Guards — decide whether an action is allowed and refuse with an exit contract",
  lane: "Lane ceremony — the workflow's own state machine over a delivery unit",
  forge: "Forge — the one family that reaches outside the process",
  knowledge: "Knowledge and retrieval — the documentation index and its corpus readers",
  tooling: "Tooling — the host, the toolchain and the CLI's own introspection",
});

/**
 * @typedef {object} HelpEntry
 * @property {string} family   one key of HELP_FAMILIES
 * @property {string} summary  one line: what the subcommand solves
 * @property {readonly string[]} [ops]     the closed op set, when it has one
 * @property {readonly string[]} [flags]   the flags it accepts, when closed
 * @property {string} [usage]            the usage tail after the subcommand name
 * @property {boolean} [ownHelp]         the subcommand already ships a richer `--help` of its own; the bin defers to it
 */

/** @type {Readonly<Record<string, HelpEntry>>} */
export const HELP_REGISTRY = Object.freeze({
  // ── lane ceremony ─────────────────────────────────────────────────────
  ceremony: {
    family: "lane",
    summary: "the closed ceremony CLI: one object, one op, JSON on stdout, and the uniform 0/1/2 exit contract",
    ops: [...CEREMONY_OBJECTS],
    usage: "<object> <op> [flags...]",
  },
  "unit-route": {
    ownHelp: true,
    family: "lane",
    summary: "prints the route one delivery unit takes now, from its own ledger",
    usage: "<unit|issue> | --triage <unit> [--json]",
  },
  "phase-lint": {
    family: "lane",
    summary: "lints one unit doc's ## Tasks phases and prints the verdict plus its fingerprint",
    usage: "<plan-path>",
  },
  "unit-doc": {
    family: "editing",
    summary: "the typed unit-document service: create, setSection, evidence, progress, validate, provenance",
    ops: ["create", "setSection", "evidence", "progress", "validate", "provenance"],
    usage: "<NN-slug> <op> [args...]",
  },
  "unit-lineage": {
    family: "lane",
    summary: "re-derives a unit's triage block from the facts instead of pinning substrings",
    flags: ["--unit", "--root", "--json"],
  },
  "roadmap-settle": {
    family: "lane",
    summary: "checks the inverse settle invariant: a unit doc carrying a PR URL must have its index row reading done",
    flags: ["--root", "--json"],
  },
  "roadmap": {
    family: "editing",
    summary: "the roadmap writer: rowUpsert, annotate, read, fixrow and check over the shared-document driver",
    ops: ["rowUpsert", "annotate", "read", "fixrow", "check"],
  },
  "review-receipt": {
    family: "lane",
    summary: "emits, verifies and posts the SHA-bound review receipt a merge gate reads",
    ops: ["emit", "verify", "post"],
    flags: ["--root", "--dry-run"],
  },
  "review-state": {
    family: "lane",
    summary: "the per-unit record of which review axes ran, at which head, with which evidence",
    ops: ["record", "mark", "check", "show"],
    flags: ["--unit", "--path", "--status", "--reason", "--base", "--head", "--reset"],
  },
  "scope-manifest": {
    family: "lane",
    summary: "signs and verifies the digest-bound manifest of the paths a change actually affects",
    ops: ["sign", "verify"],
    flags: ["--base", "--head", "--root"],
  },
  "gate-receipt": {
    family: "lane",
    summary: "runs the project's gate and judges a recorded receipt pass/stale/invalid/missing",
    ops: ["run", "verify"],
    flags: ["--root", "--gate", "--receipt", "--log"],
  },
  "audit-pr-gate": {
    family: "lane",
    summary: "the merge gate: evaluates receipts and hygiene to MERGE-READY or BLOCKED",
    ops: ["evaluate", "hygiene", "comment"],
  },
  "adversarial-verdict": {
    family: "lane",
    summary: "refuses every row of an adversarial pass record that breaks the contract",
    flags: ["--record", "--diff"],
  },
  "findings-corpus": {
    family: "knowledge",
    summary: "joins the unit docs' findings and log marks into one corpus for class attribution",
    flags: ["--repo", "--json", "--min-recurrence", "--threshold"],
  },
  "correction-budget": {
    family: "lane",
    summary: "the review-to-fold loop's stopping condition as a measurement rather than prose",
    flags: ["--unit", "--rounds-spent", "--repo", "--json"],
  },
  "dimension-regression": {
    family: "lane",
    summary: "a change touching a review surface must record its dimension run, or the audit's dimension was skipped",
    flags: ["--base", "--root", "--remote"],
  },
  "coverage-gap": {
    family: "knowledge",
    summary: "crosses declared criteria, gate-inventory detectors and the findings corpus into typed gaps",
  },
  "decision-promotion": {
    family: "lane",
    summary: "a cross-unit decision must name the permanent owner doc it was promoted to",
    flags: ["--root", "--json"],
  },
  "residual-classify": {
    family: "lane",
    summary: "classifies an added surface by what actually consumes it, so a retirement is legitimate only when orphan",
    flags: ["--root", "--receipt", "--date", "--inventory", "--base"],
  },
  "differential-baseline": {
    family: "lane",
    summary: "materializes the base revision and runs the declared validators against it, so a change is measured",
    flags: ["--base", "--repo", "--json"],
  },
  "session-close": {
    family: "lane",
    summary: "the mechanical half of ending a session: render the entry, then close on an append-only log",
    ops: ["render", "close"],
  },

  // ── sensor ────────────────────────────────────────────────────────────
  "workflow-status": {
    ownHelp: true,
    family: "sensor",
    summary: "the workflow sensor: the strict Envelope v2 result every driver consumes",
    flags: ["--compact", "--rag", "--help", "--version"],
  },
  "pre-execution-snapshot": {
    family: "sensor",
    summary: "builds and verifies the content-bound pre-execution snapshot a review freezes against",
    ops: ["build", "verify", "contract"],
  },
  "needs-input": {
    family: "sensor",
    summary: "reads the unit's open-questions ledger and verifies the route each open row claims",
    flags: ["--workspace", "--json"],
  },
  substrate: {
    family: "sensor",
    summary: "the substrate coverage gate: one row per class, present, declined or absent",
    ops: ["check"],
    flags: ["--workspace", "--guide", "--json"],
  },
  "ledger-provenance": {
    family: "sensor",
    summary: "proves every folded finding row cites a reachable commit whose subject claims it",
    flags: ["--json", "--check", "--annotate"],
  },
  "quality-metrics": {
    ownHelp: true,
    family: "sensor",
    summary: "the DORA four keys plus the reversion ratio, each row labelled measured/derived/unavailable",
    flags: ["--window", "--until", "--repo", "--out"],
  },
  "diff-guard": {
    family: "guard",
    summary: "measures a diff against the size ceiling and prints PASS or BREACH",
    flags: ["--base", "--max-lines", "--max-files", "--json"],
  },
  "relevant-files": {
    family: "sensor",
    summary: "resolves a phase's read set and checks a changed set against it",
    flags: ["--phase", "--changed", "--base"],
  },
  "scaffold-contract": {
    family: "sensor",
    summary: "the scaffold contract that travels: exported unit-doc templates against the installed release's contract, and the same check on a staged unit doc",
    ops: ["check", "authoring"],
    usage: "<check|authoring> [<unit-doc>] [--workspace <dir>] [--json]",
    flags: ["--workspace", "--json"],
  },
  "test-impact": {
    family: "sensor",
    summary: "the set of tests a change can affect, unioned from four static sources, never a guess",
    flags: ["--base", "--paths", "--references"],
  },
  "test-route": {
    family: "sensor",
    summary: "answers which suites a path needs from the committed route map, fail-closed to the full suite",
    ops: ["--check", "--list"],
    flags: ["--map", "--root"],
  },
  "skill-context": {
    family: "sensor",
    summary: "measures every skill's text against the ceilings the project's manifest declares",
    flags: ["--manifest-only", "--routes", "--documents", "--json"],
  },
  "test-obligation-tags": {
    family: "sensor",
    summary: "every root suite declares the surface and obligation kinds it protects; an undeclared suite is refused",
    flags: ["--root", "--sweep", "--json"],
  },
  "prose-gate-inventory": {
    family: "sensor",
    summary: "reads the gate inventory and refuses a carrier the tree no longer holds",
    flags: ["--repo"],
  },
  "promise-coherence": {
    family: "sensor",
    summary: "re-measures every 'measured at the head' claim in the prose it reads",
    flags: ["--json"],
  },
  "restatement-sweep": {
    family: "knowledge",
    summary: "reports every place a rule is worded a second time outside its owner",
    flags: ["--repo", "--json"],
  },
  "repository-state": {
    family: "knowledge",
    summary: "reads the frozen Normalized Repository State and answers what a later decision may not move",
    flags: ["--ttl-days", "--today", "--json"],
  },
  "journal-corpus": {
    family: "knowledge",
    summary: "joins the session journal's entries into the corpus the audit's journal dimension reads",
    flags: ["--repo", "--recurrence"],
  },
  "workflow-doctor": {
    family: "knowledge",
    summary: "mines the project's own ceremony failures, anonymizes a fixed-rubric triage and routes it upstream",
    ops: ["mine", "battery", "bundle", "route", "publish"],
    usage: "<mine|battery|bundle|route|publish> [flags]",
    flags: [
      "--root",
      "--json",
      "--fold-budget",
      "--cycle-budget",
      "--unit",
      "--skills-root",
      "--mine",
      "--triage",
      "--battery",
      "--bundle",
      "--candidate",
      "--search",
      "--issue",
      "--new-title",
      "--repo",
      "--forge",
      "--yes",
    ],
  },
  "retention-debt": {
    family: "knowledge",
    summary: "reports every proved-merged unit still carrying its full document carrier past threshold",
    flags: ["--root", "--json"],
  },
  "dependency-advisory-pass": {
    family: "sensor",
    summary: "reports pins that drifted from what the registry publishes, degrading visibly on a fetch failure",
    flags: ["--root", "--json"],
  },
  "batch-scheduler": {
    family: "lane",
    summary: "reads the live work graph and emits order-respecting, collision-free parallel batches",
    flags: ["--root", "--issues-file", "--state", "--no-state", "--remote", "--mark-launched", "--json-only"],
  },

  // ── knowledge and retrieval ───────────────────────────────────────────
  doc: {
    family: "knowledge",
    summary: "the retrieval index and the doc CLI: sync, query, status, rebuild, read, edit, index",
    ops: ["--sync", "--query", "--status", "--rebuild", "read", "edit", "index", "archive", "restore"],
    flags: ["--json-only", "--mode", "--since", "--until", "--file"],
  },
  config: {
    family: "tooling",
    summary: "the unified config CLI: read and write the base config and every discovered extension file",
    ops: ["get", "set", "list", "show", "validate", "init", "reset", "default", "schema"],
    flags: ["--scope", "--project", "--global-dir", "--category", "--sanitize", "--no-warn-unknown", "--no-backup", "--json"],
  },
  relay: {
    family: "lane",
    summary: "the Relay packet's offline half: check, budget, tiers, obligations and closeout",
    ops: ["check", "budget", "tiers", "obligations", "closeout"],
    flags: ["--repo", "--packet"],
  },
  section: {
    family: "editing",
    summary: "the AST section locator: locate, remove and replace over one Markdown document",
    ops: ["locate", "remove", "replace"],
    flags: ["--file", "--selector", "--replacement", "--write", "--json"],
  },
  memory: {
    family: "knowledge",
    summary: "the memory-substrate health sensor; writes nothing and always exits 0",
    ops: ["probe"],
    flags: ["--json"],
  },
  log: {
    family: "knowledge",
    summary: "the pure journal entry renderer: log-facts in, the docs/LOGS.md block out",
    ops: ["render"],
    flags: ["--facts", "--raw"],
  },
  journal: {
    family: "knowledge",
    summary: "the session-log fragment carrier: aggregate, write, headless and name",
    ops: ["aggregate", "write", "headless", "name"],
    flags: ["--dir", "--journal-dir", "--log", "--check", "--json", "--kind", "--session", "--supersedes"],
  },
  skills: {
    family: "tooling",
    summary: "the skill-discovery route's machine half: discover, register, inventory",
    ops: ["discover", "register", "inventory"],
  },

  // ── editing ───────────────────────────────────────────────────────────
  changelog: {
    family: "editing",
    summary: "appends a changelog row through the writer",
    usage: "[file] <json>",
  },
  budgets: {
    family: "editing",
    summary: "re-bases one context-budget ceiling with its growth source; a shrinkage without one is refused",
    usage: "[file] <json>",
  },
  manifest: {
    family: "editing",
    summary: "skillAdd and skillRemove on the plugin manifest, keeping its alphabetical machine surface",
    ops: ["skillAdd", "skillRemove"],
    usage: "[plugin.json] <op>",
  },
  verify: {
    family: "editing",
    summary: "the document verifier: checks one unit doc against the frozen schemas and the tree",
    flags: ["--no-git"],
  },
  charter: {
    family: "editing",
    summary: "the engineering interview's deterministic half: state, land and check over the guide's charter",
    ops: ["state", "land", "check"],
    flags: ["--guide", "--answers", "--bank", "--json"],
  },
  elicitation: {
    family: "editing",
    summary: "the pre-spec's own check: the question bank plus the artifact against it",
    ops: ["check"],
    flags: ["--bank", "--spec", "--json"],
  },
  materialize: {
    family: "editing",
    summary: "materializes the verification decision per declared boundary: plan, check, apply, evidence",
    ops: ["plan", "check", "apply", "evidence"],
    flags: ["--guide", "--record", "--invariants", "--feature-map", "--unit", "--outcomes", "--date", "--root", "--json"],
  },
  resources: {
    family: "tooling",
    summary: "the trial-envelope layer: detect the host, admit a brief, check a trial, bound a run",
    ops: ["detect", "admit", "check", "bound"],
  },
  provision: {
    family: "tooling",
    summary: "ask-first bootstraps: the rg binary and the guard-plugin permission policy",
    ops: ["rg", "permissions"],
  },
  "docs-generate": {
    family: "knowledge",
    summary: "renders the generated documentation projection and syncs the roadmap's two tables",
    flags: ["--root", "--check", "--dry-run"],
  },
  "docs-generated-merge": {
    family: "tooling",
    summary: "the generated-projection merge driver: arms the class or resolves one conflict",
    flags: ["--install", "--repo"],
  },
  "shared-merge": {
    family: "tooling",
    summary: "the shared-document merge driver: one class registry decides union or fail-closed conflict",
    flags: ["--install", "--repo"],
  },

  // ── runner / tooling ──────────────────────────────────────────────────
  runner: {
    family: "tooling",
    summary: "the programmatic runner choice: which launcher runs this package at its own pin",
    ops: ["resolve"],
    flags: ["--json"],
  },
  "resolve-passes": {
    family: "tooling",
    summary: "resolves every published pass name's model and thinking through the fail-closed chain",
    flags: ["--global", "--project", "--command"],
  },
  "setup-env": {
    family: "tooling",
    summary: "checks the authoring toolchain and, with an explicit yes, installs through user-scoped managers",
    flags: ["--check", "--root"],
  },
  doctor: {
    family: "tooling",
    summary: "one read-only check per documented tool surface, printing the doctor@1 envelope",
    flags: ["--check", "--json", "--root"],
  },
  setup: {
    family: "tooling",
    summary: "the consent-gated setup wizard over the same envelope doctor prints",
    flags: ["--yes", "--dry-run", "--json", "--root"],
  },
  help: {
    family: "tooling",
    summary: "this surface: the subcommand index, or one subcommand's usage, ops and flags",
    flags: ["--json"],
  },

  // ── forge ─────────────────────────────────────────────────────────────
  "delivery-conditions": {
    family: "forge",
    summary: "the carrier a delivery condition names: the close-time guard and the scheduled sweep that re-check it",
    flags: ["--close-check", "--sweep", "--issues-file", "--repo", "--root", "--limit", "--json"],
    usage: "--close-check <issue> | --sweep [--issues-file <json>] [--repo <owner/name>] [--json]",
  },
  "forge-read": {
    family: "forge",
    summary: "the one route that may return third-party forge text, fenced and guarded",
    ops: ["issue", "pr"],
    flags: ["--comments", "--reviews", "--json"],
  },
  "fullauto-merge": {
    family: "forge",
    summary: "the audited, forge-agnostic merge that needs every precondition to be the one merge without a human",
    flags: ["--pr", "--run-id", "--method", "--remote", "--forge"],
  },
  "git-identity-check": {
    family: "forge",
    summary: "refuses a commit whose identity is not the project's approved one",
    flags: ["--root"],
  },
  "turn-contract": {
    family: "forge",
    summary: "verifies the turn contract's mechanical boxes and prints ok or the failing box",
    flags: ["--finished", "--remote", "--forge"],
  },
  "guard-command": {
    family: "guard",
    summary: "the safety hooks' one decision over commands, paths, environment disclosure and .env reads",
    flags: ["--command", "--path", "--allowlist", "--payload", "--format"],
  },
  telemetry: {
    family: "sensor",
    summary: "the manual telemetry reconciliation and the merge driver's installation gate",
    ops: ["reconstruct", "merge-install"],
  },
});

/**
 * Whether the bin must let the subcommand answer `--help` itself.
 *
 * Three subcommands shipped a hand-written usage block before this module
 * existed, and those blocks are richer than a registry row can be (the sensor's
 * option descriptions, the router's route explanation). Replacing them with a
 * thinner generic block would be a regression nobody asked for, so the registry
 * records the ownership and the bin defers: one door per subcommand, and the
 * richer door wins.
 *
 * @param {string} name
 * @returns {boolean}
 */
export function ownsItsHelp(name) {
  return HELP_REGISTRY[name]?.ownHelp === true;
}

/** Every declared subcommand name, sorted — the index's own order. */
export const HELP_NAMES = Object.freeze(Object.keys(HELP_REGISTRY).sort());

/**
 * Render one subcommand's help block.
 *
 * The block is the same bytes whichever door it came through — `help <sub>`,
 * `<sub> --help` or `<sub> -h` — because they all call this function. It names
 * the subcommand, its family, its summary, and the closed vocabularies it
 * accepts, which is what turns a refusal's suggestion into a repair.
 *
 * @param {string} name
 * @returns {string}
 */
export function renderSubcommandHelp(name) {
  const entry = HELP_REGISTRY[name];
  if (!entry) return "";
  const lines = [];
  lines.push(`agentic-workflow ${name} — ${entry.summary}`);
  lines.push("");
  lines.push(`family: ${entry.family} — ${HELP_FAMILIES[entry.family]}`);
  lines.push("");
  lines.push("usage:");
  lines.push(`  agentic-workflow ${name}${entry.usage ? ` ${entry.usage}` : ""}`);
  if (entry.ops?.length) {
    lines.push("");
    lines.push("ops:");
    for (const op of entry.ops) lines.push(`  ${op}`);
  }
  if (entry.flags?.length) {
    lines.push("");
    lines.push("flags:");
    for (const flag of entry.flags) lines.push(`  ${flag}`);
  }
  lines.push("");
  lines.push("`--help` and `-h` print this block; `help --json` prints the whole index as machine data.");
  lines.push("");
  return lines.join("\n");
}

/**
 * Render the whole index, grouped by family — the answer to a bare `help`.
 *
 * Each row is the subcommand's name and its one-line summary, so the whole
 * grammar is readable in one screen without opening the crate README.
 *
 * @returns {string}
 */
export function renderHelpIndex() {
  const lines = [];
  lines.push("agentic-workflow — the universal CLI's own grammar");
  lines.push("");
  lines.push("Every subcommand answers `--help` (or `-h`, or `help <sub>`) with its usage,");
  lines.push("its closed ops and its flags. Nothing below is a substitute for that block.");
  lines.push("");
  const width = Math.max(...HELP_NAMES.map((name) => name.length));
  for (const [family, description] of Object.entries(HELP_FAMILIES)) {
    const members = HELP_NAMES.filter((name) => HELP_REGISTRY[name].family === family);
    if (members.length === 0) continue;
    lines.push(`${family} — ${description}`);
    for (const name of members) {
      lines.push(`  ${name.padEnd(width)}  ${HELP_REGISTRY[name].summary}`);
    }
    lines.push("");
  }
  lines.push("`--debug` and `--profile` are accepted by every subcommand.");
  lines.push("");
  return lines.join("\n");
}

/**
 * The machine envelope a `help --json` prints — the whole index, or exactly the
 * row one `help <sub> --json` asks for (receipt B8): the shape is one envelope,
 * filtered, never a second format.
 *
 * One row per subcommand carrying the same facts the rendered block does, so a
 * programmatic consumer (a pi tool, a codemode script) reads the grammar
 * without parsing prose. The shape is additive-only: a later field never
 * renames one of these.
 *
 * @param {string} [name] when given, only that subcommand's row is carried
 * @returns {{ subcommands: Array<{name: string, family: string, summary: string, ops: string[]|null, flags: string[]|null, usage: string|null}> }}
 */
export function helpEnvelope(name) {
  const names = name === undefined ? HELP_NAMES : [name];
  return {
    subcommands: names.map((entryName) => {
      const entry = HELP_REGISTRY[entryName];
      return {
        name: entryName,
        family: entry.family,
        summary: entry.summary,
        ops: entry.ops ? [...entry.ops] : null,
        flags: entry.flags ? [...entry.flags] : null,
        usage: entry.usage ?? null,
      };
    }),
  };
}

/**
 * The nearest declared subcommand names for a mistyped token.
 *
 * A suggestion is a repair, not a scold: `cerimonny` must answer `ceremony`. The
 * measure is the cheap one — shared prefix plus edit distance — because the
 * candidate set is 72 names and every extra point of cleverness is a way to
 * suggest something surprising.
 *
 * @param {string} token
 * @param {number} [limit]
 * @returns {string[]}
 */
export function suggestSubcommands(token, limit = 3) {
  if (!token) return [];
  const scored = HELP_NAMES.map((name) => ({ name, score: similarity(token.toLowerCase(), name.toLowerCase()) }))
    .filter((row) => row.score > 0.4)
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map((row) => row.name);
}

/** 1 − (edit distance ÷ the longer length), the cheap similarity a suggestion needs. */
function similarity(a, b) {
  const distance = editDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

/** Levenshtein distance, two rows of state — the names are short, so this is enough. */
function editDistance(a, b) {
  if (a === b) return 0;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * The one-line pointer every failure prints, naming the subcommand's own help.
 *
 * It is a sentence, not a code, because a model reads it: the repair is one
 * command away and the sentence says which command.
 *
 * @param {string} [name] the subcommand whose help answers; omitted for the index
 * @returns {string}
 */
export function helpPointer(name) {
  return name
    ? `Run \`agentic-workflow help ${name}\` for this command's usage, ops and flags.`
    : "Run `agentic-workflow help` for the subcommand index.";
}
