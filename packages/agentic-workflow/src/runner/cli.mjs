/**
 * cli.mjs — the distributable runner's closed dispatch table (issue #352).
 *
 * The crate publishes one bin, `agentic-workflow`. Its editor services live in
 * `bin/agentic-workflow.mjs`; the runtime half — the sensors and the ceremony
 * CLI — is this table. Both halves are the same process and the same bin, so a
 * target project installs one package and gets every command the skills cite.
 *
 * The table is the whole surface: a name that is not a key here reaches the
 * bin's closed-world usage error, never an invented shell fallback. Each entry
 * keeps its own exit contract (`(args) => void | number`): it prints its own
 * block and exits with its own code, or returns the code for the bin to set.
 */

import { run as runUnitRoute } from "./unit-route.mjs";
import { run as runPhaseLint } from "./sensors/phase-lint.mjs";
import { run as runDiffGuard } from "./sensors/diff-guard.mjs";
import { run as runWorkflowStatus } from "./sensors/workflow-status.mjs";
import { run as runPreExecutionSnapshot } from "./sensors/pre-execution-snapshot.mjs";
import { run as runNeedsInput } from "./sensors/needs-input.mjs";
import { run as runSubstrate } from "./sensors/substrate.mjs";
import { run as runLedgerProvenance } from "./sensors/ledger-provenance.mjs";
import { run as runQualityMetrics } from "./sensors/quality-metrics.mjs";
import { run as runForgeRead } from "../forge-read/index.mjs";
import { run as runCeremony } from "./ceremony/index.mjs";
import { run as runSkills } from "./skills.mjs";
import { main as runAdversarialVerdict } from "../adversarial-verdict/index.mjs";
import { main as runGateReceipt } from "../gate-receipt/index.mjs";
import { main as runReviewReceipt } from "../review-receipt/index.mjs";
import { main as runScopeManifest } from "../scope-manifest/index.mjs";
import { main as runReviewState } from "../review-state/index.mjs";
import { main as runDifferentialBaseline } from "../differential-baseline/index.mjs";
import { main as runCorrectionBudget } from "../correction-budget/index.mjs";
import { main as runFindingsCorpus } from "../findings-corpus/index.mjs";
import { main as runSessionClose } from "../session-close/index.mjs";
import { main as runTestImpact } from "../test-impact/index.mjs";
import { main as runSharedMerge } from "../shared-merge/index.mjs";
import { main as runDocsGeneratedMerge } from "../docs-generated-merge/index.mjs";
import { main as runDocsGenerate } from "../docs-generate/index.mjs";
import { main as runRoadmapSettle } from "../roadmap-settle/index.mjs";
import { main as runRelevantFiles } from "../relevant-files/index.mjs";

/**
 * @typedef {(args: string[]) => void | number} RunnerCommand
 * @type {Readonly<Record<string, RunnerCommand>>}
 */
export const RUNNER_COMMANDS = Object.freeze({
  "unit-route": runUnitRoute,
  "phase-lint": runPhaseLint,
  "diff-guard": runDiffGuard,
  "workflow-status": runWorkflowStatus,
  "pre-execution-snapshot": runPreExecutionSnapshot,
  "needs-input": runNeedsInput,
  substrate: runSubstrate,
  "ledger-provenance": runLedgerProvenance,
  "quality-metrics": runQualityMetrics,
  "forge-read": runForgeRead,
  ceremony: runCeremony,
  skills: runSkills,
  "adversarial-verdict": runAdversarialVerdict,
  "gate-receipt": runGateReceipt,
  "review-receipt": runReviewReceipt,
  "scope-manifest": runScopeManifest,
  "review-state": runReviewState,
  "differential-baseline": runDifferentialBaseline,
  "correction-budget": runCorrectionBudget,
  "findings-corpus": runFindingsCorpus,
  "session-close": runSessionClose,
  "test-impact": runTestImpact,
  "shared-merge": runSharedMerge,
  "docs-generated-merge": runDocsGeneratedMerge,
  "docs-generate": runDocsGenerate,
  "roadmap-settle": runRoadmapSettle,
  "relevant-files": runRelevantFiles,
});

/**
 * Whether `name` is a runner subcommand.
 * @param {string} name
 * @returns {boolean}
 */
export const isRunnerCommand = (name) => Object.hasOwn(RUNNER_COMMANDS, name);

/**
 * Dispatch one runner subcommand. A returned number is the exit code to set; a
 * `undefined` return means the command already printed and set (or left) its
 * own code.
 *
 * `context` is the process the bin already owns — the feedback channel, so far.
 * It rides as an explicit argument rather than a module-level singleton: a
 * command that knows it is long-running (`quality-metrics` spends seconds in
 * bounded subprocesses that block the loop) flushes its start line through the
 * same channel every other command uses, instead of a second convention.
 *
 * @param {string} name
 * @param {string[]} args
 * @param {{ feedback?: object }} [context]
 * @returns {number | void | Promise<number | void>}
 */
export function runRunnerCommand(name, args, context = {}) {
  const handler = RUNNER_COMMANDS[name];
  if (!handler) return undefined;
  return handler(args, context);
}
