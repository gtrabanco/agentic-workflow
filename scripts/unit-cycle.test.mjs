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
  parsePrUrl,
  settleCommitArgs,
  settleRoadmapRow,
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
  roadmapSettled: true,
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
// the roadmap settle (issue #316): the loop writes the row itself, it never
// asks the model to
// ---------------------------------------------------------------------------

test("decide: a released unit whose roadmap row is not settled runs the deterministic settle act", () => {
  const action = decide(at({ roadmapSettled: false }));
  assert.equal(action.type, "settle-roadmap");
});

test("decide: the settle act precedes the receipt chain — an unsettled row is never reviewed around", () => {
  const action = decide(at({ roadmapSettled: false, receipt: "absent" }));
  assert.equal(action.type, "settle-roadmap");
});

test("decide: a settled row changes no transition (previous behavior holds)", () => {
  assert.deepEqual(decide(at({ roadmapSettled: true })), { type: "stop", reason: OUTCOME.DONE });
  const fold = decide(at({ roadmapSettled: true, receipt: "absent", openFindings: ["F1"] }));
  assert.equal(fold.type, "step");
  assert.equal(fold.step, "fold");
});

test("decide: a fix unit's row is settled by the fix index's own convention — no settle act", () => {
  // The fix index removes merged rows; the crate's rowUpsert grammar is the
  // roadmap's five-column table and fails closed on the fix index's header,
  // so the deterministic settle writes roadmap rows only.
  assert.equal(decide(at({ roadmapSettled: null, kind: "fix" })).type, "stop");
});

test("renderPrompt: the release step no longer instructs the row write — the loop owns it", () => {
  const { prompt } = renderPrompt({ type: "step", step: "release" }, at({}));
  assert.match(prompt, /push the branch/);
  assert.doesNotMatch(prompt, /set the roadmap row/);
});

test("parsePrUrl: the References PR URL is captured whole, for the settle link", () => {
  assert.equal(
    parsePrUrl("- PR: https://github.com/gtrabanco/agentic-workflow/pull/313\n- Branch: feat/x"),
    "https://github.com/gtrabanco/agentic-workflow/pull/313",
  );
  assert.equal(parsePrUrl("- PR: #313"), null);
  assert.equal(parsePrUrl("no references"), null);
});

test("settleRoadmapRow: writes done · [#N](url) preserving every other cell, via the crate's rowUpsert", async () => {
  const { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const tmp = mkdtempSync(join(tmpdir(), "unit-cycle-settle-"));
  try {
    mkdirSync(join(tmp, "docs", "features", "77-settle-me"), { recursive: true });
    const table = join(tmp, "docs", "features", "ROADMAP.md");
    writeFileSync(
      table,
      [
        "# Roadmap",
        "",
        "## Features",
        "",
        "| NN | Slug | Status | Depends on | Summary |",
        "|----|------|--------|------------|---------|",
        "| 77 | `settle-me` | in-progress | 78 | Issue [#305](…) (M): the long summary must survive the settle |",
        "",
      ].join("\n"),
      "utf8",
    );
    const result = settleRoadmapRow({ nn: "77", pr: 309, prUrl: "https://github.com/gtrabanco/agentic-workflow/pull/309" }, { cwd: tmp });
    assert.equal(result.ok, true, result.detail ?? "");
    const row = readFileSync(table, "utf8").split("\n").find((l) => l.startsWith("| 77 |"));
    assert.match(row, /\| 77 \| `settle-me` \| done · \[#309\]\(https:\/\/github\.com\/gtrabanco\/agentic-workflow\/pull\/309\) \| 78 \| Issue \[#305\]/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
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

test("settleCommitArgs: the -m option precedes the -- separator (F1: after -- every token is a pathspec, so the settle commit failed unconditionally)", () => {
  const argv = settleCommitArgs({ unit: "80-example", prNumber: 323, prUrl: "https://github.com/gtrabanco/agentic-workflow/pull/323" });
  assert.equal(argv[0], "commit");
  const separator = argv.indexOf("--");
  assert.ok(separator > 0, "argv carries a -- separator");
  // Everything after -- is a pathspec: the -m flag and its message must sit before it.
  assert.ok(argv.indexOf("-m") > 0 && argv.indexOf("-m") < separator, "-m precedes --");
  assert.equal(argv[separator + 1], "docs/features/ROADMAP.md");
  const message = argv[argv.indexOf("-m") + 1];
  assert.match(message, /settle 80-example — done · \[#323\]\(https:\/\/github\.com\/gtrabanco\/agentic-workflow\/pull\/323\)/);
});

test("settleCommitArgs: the only pathspec is the roadmap table (no stray option lands after --)", () => {
  const argv = settleCommitArgs({ unit: "316-roadmap-settle", prNumber: 1, prUrl: "https://example.test/pr/1" });
  const separator = argv.indexOf("--");
  assert.deepEqual(argv.slice(separator + 1), ["docs/features/ROADMAP.md"]);
});
