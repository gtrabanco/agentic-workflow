/**
 * unit-cycle.test.mjs — the coded delivery loop's control logic (red-first).
 *
 * Every case pins a decision of `unit-cycle.mjs`'s pure core: the state
 * machine (`decise`), the prompt builder (`renderPrompt`), the sensing helpers
 * that read a unit doc as text, and the generic runner (`runCycle`) with an
 * injected executor. No network, no git, no pi spawn: the loop's control flow
 * must be provable offline, exactly like `pin-watch.test.mjs` proves the
 * watcher's.
 *
 * Terminal outcomes are a closed set (header of unit-cycle.mjs):
 * done · needs-input · budget-exhausted · no-progress · failed.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  decide,
  renderPrompt,
  designedFrom,
  researchDoneFrom,
  parsePrNumber,
  phaseOrder,
  runCycle,
  OUTCOME,
} from "./unit-cycle.mjs";

// ---------------------------------------------------------------------------
// decide() — the state machine, one case per transition
// ---------------------------------------------------------------------------

const BASE = {
  unit: "67-serena-provisioning",
  unitDir: "docs/features/67-serena-provisioning",
  branch: "feat/x",
  dirty: false,
  pendingInput: 0,
  docExists: true,
  designed: true,
  phasesDeclared: [1, 2],
  phasesDone: [1, 2],
  testsOk: true,
  researchDone: true,
  evidenceDone: true,
  docsDone: true,
  releaseDone: true,
  prNumber: 313,
  receipt: "current",
  openFindings: [],
  mergeReady: true,
  prevAction: null,
  foldCycles: 0,
  maxCycles: 2,
  actions: 0,
  maxActions: 40,
};

const at = (patch) => ({ ...BASE, ...patch });

test("decide: the terminal state is done when the audit is merge-ready at the head", () => {
  assert.deepEqual(decide(at({})), { type: "stop", reason: "done" });
});

test("decide: a dirty tree stops before anything else (step never committed)", () => {
  const action = decide(at({ dirty: true, pendingInput: 3, designed: false }));
  assert.deepEqual(action, { type: "stop", reason: "failed", detail: "dirty-tree" });
});

test("decide: working on main stops before anything else", () => {
  assert.deepEqual(decide(at({ branch: "main" })), {
    type: "stop",
    reason: "failed",
    detail: "on-main",
  });
});

test("decide: open questions stop the loop before design runs (manual input)", () => {
  const action = decide(at({ pendingInput: 2, docExists: false }));
  assert.deepEqual(action, { type: "stop", reason: "needs-input" });
});

test("decide: a missing unit doc starts at design (which creates it)", () => {
  assert.deepEqual(decide(at({ docExists: false })), { type: "step", step: "design" });
});

test("decide: a template-guidance AC section is not designed", () => {
  assert.deepEqual(decide(at({ designed: false })), { type: "step", step: "design" });
});

test("decide: a designed doc with no phases runs plan", () => {
  assert.deepEqual(decide(at({ phasesDeclared: [], phasesDone: [] })), {
    type: "step",
    step: "plan",
  });
});

test("decide: research precedes the first phase when the Evidence has no research row", () => {
  const action = decide(at({ researchDone: false, phasesDone: [], phasesDeclared: [1] }));
  assert.deepEqual(action, { type: "step", step: "research" });
});

test("decide: unfinished phases run in P1..Pn order, one at a time", () => {
  const action = decide(at({ phasesDone: [1], phasesDeclared: [1, 2, 3] }));
  assert.deepEqual(action, { type: "phase", n: 2 });
});

test("decide: tests run once after the last phase, before evidence", () => {
  const action = decide(at({ testsOk: null, evidenceDone: false }));
  assert.deepEqual(action, { type: "step", step: "tests" });
});

test("decide: a red suite stops failed — never silenced, never skipped", () => {
  assert.deepEqual(decide(at({ testsOk: false })), {
    type: "stop",
    reason: "failed",
    detail: "gate-red",
  });
});

test("decide: catalog order evidence → docs → release before any review", () => {
  assert.deepEqual(decide(at({ evidenceDone: false, docsDone: false, releaseDone: false })), {
    type: "step",
    step: "evidence",
  });
  assert.deepEqual(decide(at({ docsDone: false, releaseDone: false })), {
    type: "step",
    step: "docs",
  });
  assert.deepEqual(decide(at({ releaseDone: false })), { type: "step", step: "release" });
});

test("decide: no receipt and no findings means review (which emits the receipt)", () => {
  assert.deepEqual(decide(at({ receipt: "absent" })), { type: "step", step: "review" });
});

test("decide: a stale receipt is re-reviewed when the head moved", () => {
  assert.deepEqual(decide(at({ receipt: "stale" })), { type: "step", step: "review" });
});

test("decide: open findings fold before the next review, within the budget", () => {
  const action = decide(at({ receipt: "absent", openFindings: ["F1"] }));
  assert.deepEqual(action, { type: "step", step: "fold" });
});

test("decide: the fold budget is enforced — X reached stops budget-exhausted", () => {
  const action = decide(at({ receipt: "absent", openFindings: ["F1"], foldCycles: 2 }));
  assert.deepEqual(action, { type: "stop", reason: "budget-exhausted" });
});

test("decide: a current receipt with findings still folds (audit found repair work)", () => {
  assert.deepEqual(decide(at({ openFindings: ["F2"] })), { type: "step", step: "fold" });
});

test("decide: current receipt and no findings runs audit when it has not run yet", () => {
  assert.deepEqual(decide(at({ mergeReady: false })), { type: "step", step: "audit" });
});

test("decide: audit that blocked with no findings stops for manual repair — never a second identical audit", () => {
  assert.deepEqual(decide(at({ mergeReady: false, prevAction: "audit" })), {
    type: "stop",
    reason: "needs-input",
    detail: "audit-blocked",
  });
});

test("decide: the action budget bounds every run", () => {
  assert.deepEqual(decide(at({ actions: 40 })), {
    type: "stop",
    reason: "failed",
    detail: "action-budget",
  });
});

// ---------------------------------------------------------------------------
// sensing helpers — a unit doc read as text
// ---------------------------------------------------------------------------

const TEMPLATE_AC = `## Acceptance criteria

Numbered list. Each AC is induced from a concrete user scenario ("I do X and observe Y").
Make each AC command-verified where possible.

## Impact`;

const LANE_DRAFT_AC = `## Acceptance criteria

Induced from the issue. Design step finalises wording and cites each AC in \`sources.md\`.

1. **First criterion.** observable.

## Impact`;

const FINAL_AC = `## Acceptance criteria

Induced from the issue, closed by the owner's answers in \`decisions.md\`.

1. **First criterion.** \`test command\` exits 0.

## Impact`;

test("designedFrom: the fresh template is not designed", () => {
  assert.equal(designedFrom(TEMPLATE_AC), false);
});

test("designedFrom: issue-induced draft ACs awaiting the design step are not designed", () => {
  assert.equal(designedFrom(LANE_DRAFT_AC), false);
});

test("designedFrom: numbered criteria without guidance text are designed", () => {
  assert.equal(designedFrom(FINAL_AC), true);
});

test("researchDoneFrom: needs both an R-row in Evidence and a research-step progress entry", () => {
  assert.equal(researchDoneFrom("| R1 | grep … | 0 |\n", "- 2026-10-21 22:30 — research step: one pass → e — next: design"), true);
  assert.equal(researchDoneFrom("| R1 | grep … | 0 |\n", "- 2026-10-21 22:20 — unit doc created → e — next: triage"), false);
  assert.equal(researchDoneFrom("", "- 2026-10-21 22:30 — research step: one pass → e — next: design"), false);
});

test("parsePrNumber: the PR URL in References is the machine handle", () => {
  assert.equal(
    parsePrNumber("- PR: https://github.com/gtrabanco/agentic-workflow/pull/313\n"),
    313,
  );
  assert.equal(parsePrNumber("- Branch: feat/x\n"), null);
});

test("phaseOrder: the next phase is the lowest declared-but-unrecorded number", () => {
  assert.deepEqual(phaseOrder([3, 1, 2], [1]), [2, 3]);
  assert.deepEqual(phaseOrder([1, 2], [1, 2]), []);
});

// ---------------------------------------------------------------------------
// renderPrompt — the exact command each LLM step receives
// ---------------------------------------------------------------------------

test("renderPrompt: a phase names one phase and its tier, never the whole unit", () => {
  const { prompt } = renderPrompt({ type: "phase", n: 2 }, at({}));
  assert.match(prompt, /\/execute-phase 67-serena-provisioning P2 \(tier: implement\)/);
  assert.doesNotMatch(prompt, /\/execute-phase 67-serena-provisioning(?! P\d)/);
});

test("renderPrompt: review and audit carry the PR handle", () => {
  assert.match(renderPrompt({ type: "step", step: "review" }, at({})).prompt, /pull\/313|#313/);
  assert.match(renderPrompt({ type: "step", step: "audit" }, at({})).prompt, /audit-pr.*313|313.*audit-pr/is);
});

// ---------------------------------------------------------------------------
// runCycle — the generic loop with an injected executor
// ---------------------------------------------------------------------------

const queued = (states) => {
  let i = 0;
  return async () => states[Math.min(i++, states.length - 1)];
};

test("runCycle: walks the chain to done and records every action", async () => {
  const log = [];
  const seen = [];
  const states = [
    at({ designed: false, key: "k1" }),
    at({ phasesDeclared: [], phasesDone: [], key: "k2" }),
    at({ phasesDeclared: [1], phasesDone: [], key: "k3" }),
    at({ phasesDeclared: [1], phasesDone: [1], receipt: "absent", key: "k4" }),
    at({ receipt: "current", mergeReady: false, key: "k5" }),
    at({ receipt: "current", mergeReady: true, key: "k6" }),
  ];
  const result = await runCycle({
    sense: queued(states),
    act: async (action) => {
      seen.push(action.type === "phase" ? `phase${action.n}` : action.step);
    },
    log: (line) => log.push(line),
  });
  assert.equal(result.outcome, OUTCOME.DONE);
  assert.deepEqual(seen, ["design", "plan", "phase1", "review", "audit"]);
});

test("runCycle: needs-input stops before the executor ever runs", async () => {
  let called = 0;
  const result = await runCycle({
    sense: queued([at({ pendingInput: 1, docExists: false, key: "k1" })]),
    act: async () => {
      called += 1;
    },
  });
  assert.equal(result.outcome, OUTCOME.NEEDS_INPUT);
  assert.equal(called, 0);
});

test("runCycle: a fold that changes nothing stops as no-progress (D6)", async () => {
  const states = [
    at({ receipt: "absent", openFindings: ["F1"] }),
    at({ receipt: "absent", openFindings: ["F1"] }),
  ];
  const result = await runCycle({
    sense: queued(states),
    act: async () => {},
  });
  assert.equal(result.outcome, OUTCOME.NO_PROGRESS);
});

test("runCycle: folds consume the budget; exhausted stops at X", async () => {
  const states = [
    at({ receipt: "absent", openFindings: ["F1"], key: "k1" }),
    at({ receipt: "absent", openFindings: ["F1"], key: "k2" }),
    at({ receipt: "absent", openFindings: ["F1"], key: "k3" }),
  ];
  const result = await runCycle({
    sense: queued(states),
    act: async () => {},
  });
  assert.equal(result.outcome, OUTCOME.BUDGET);
});

/** A task list the repo's own parser rejects must stop naming the fix. */
test("decide: a Tasks section whose phase bullets do not parse stops with the grammar named", () => {
  const action = decide(at({ tasksMalformed: 6 }));
  assert.equal(action.type, "stop");
  assert.equal(action.reason, OUTCOME.FAILED);
  assert.match(action.detail, /tasks-grammar/);
});

test("decide: a unit whose triage says n/a demands no catalog step", () => {
  const bare = at({ triageSteps: [], researchDone: false, designed: true, phasesDeclared: [1], phasesDone: [] });
  assert.deepEqual(decide(bare), { type: "phase", n: 1 });
});

test("runCycle: an executor failure stops failed with the step named", async () => {
  const result = await runCycle({
    sense: queued([at({ designed: false })]),
    act: async () => {
      throw new Error("session exited 1");
    },
  });
  assert.equal(result.outcome, OUTCOME.FAILED);
  assert.match(result.detail, /session exited 1/);
});

test("runCycle: review and audit acts are exempt from the commit expectation", async () => {
  const states = [
    at({ receipt: "absent" }),
    at({ receipt: "current", mergeReady: false }),
    at({ receipt: "current", mergeReady: true }),
  ];
  const result = await runCycle({
    sense: queued(states),
    act: async () => {},
  });
  assert.equal(result.outcome, OUTCOME.DONE);
});
