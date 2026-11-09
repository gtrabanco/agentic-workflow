// stateflow-lifecycle.test.mjs — issue #174: the Pi-free episode lifecycle.
//
// The lifecycle owns three rules and nothing else: the allowlist gate (only
// the allowlisted commands ever reach the backend), ownership (the package
// stops only an episode it started, and an abort still clears it), and the
// missing-backend policies (noop warns once and the command still runs;
// refuse stops the command before anything is dispatched). The backend is a
// mock here — the shipped adapter over Pi's real API is wired and verified in
// the factory/adapter tests. Written red-first (issue #174 P2).

import { test } from "node:test";
import assert from "node:assert/strict";

import { createStateFlowLifecycle } from "../dist/stateflow/lifecycle.js";
import { DEFAULT_CONFIG } from "../dist/config/defaults.js";

/** A recording backend double. */
function mockBackend({ present = true } = {}) {
  const calls = { start: 0, stop: 0, detect: 0 };
  return {
    calls,
    detect() {
      calls.detect += 1;
      return present;
    },
    start() {
      calls.start += 1;
    },
    stop() {
      calls.stop += 1;
    },
  };
}

const enabled = { ...DEFAULT_CONFIG.stateFlow, enabled: true };

test("a disabled config never touches the backend, even for an allowlisted command", () => {
  const backend = mockBackend();
  const lifecycle = createStateFlowLifecycle(backend);
  const outcome = lifecycle.start("execute-phase", { ...enabled, enabled: false });
  assert.equal(outcome.status, "none");
  assert.equal(backend.calls.detect, 0);
  assert.equal(backend.calls.start, 0);
  assert.equal(lifecycle.settle(false), false);
  assert.equal(backend.calls.stop, 0);
});

test("a non-allowlisted command never touches the backend, even when enabled", () => {
  const backend = mockBackend();
  const lifecycle = createStateFlowLifecycle(backend);
  for (const command of ["design-feature", "review-change", "audit-pr", "workflow-status", "fold-findings-x"]) {
    const outcome = lifecycle.start(command, enabled);
    assert.equal(outcome.status, "none", command);
  }
  assert.equal(backend.calls.detect, 0);
  assert.equal(backend.calls.start, 0);
  assert.equal(lifecycle.settle(false), false);
  assert.equal(backend.calls.stop, 0);
});

test("an allowlisted enabled command starts an episode, and settle stops it", () => {
  const backend = mockBackend();
  const lifecycle = createStateFlowLifecycle(backend);
  const outcome = lifecycle.start("execute-phase", enabled);
  assert.equal(outcome.status, "started");
  assert.equal(backend.calls.start, 1);
  assert.equal(lifecycle.settle(false), true);
  assert.equal(backend.calls.stop, 1);
  // The episode is closed: a second settle stops nothing.
  assert.equal(lifecycle.settle(false), false);
  assert.equal(backend.calls.stop, 1);
});

test("an aborted settle still clears a package-owned episode", () => {
  const backend = mockBackend();
  const lifecycle = createStateFlowLifecycle(backend);
  lifecycle.start("fold-findings", enabled);
  assert.equal(lifecycle.settle(true), true);
  assert.equal(backend.calls.stop, 1);
  assert.equal(lifecycle.ownsEpisode(), false);
});

test("a second allowlisted dispatch while an episode is open restarts it", () => {
  const backend = mockBackend();
  const lifecycle = createStateFlowLifecycle(backend);
  lifecycle.start("execute-phase", enabled);
  const outcome = lifecycle.start("fold-findings", enabled);
  assert.equal(outcome.status, "restarted");
  assert.equal(backend.calls.stop, 1);
  assert.equal(backend.calls.start, 2);
  assert.equal(lifecycle.ownsEpisode(), true);
});

test("ownership is package-internal: settle with no owned episode never stops the backend", () => {
  const backend = mockBackend();
  const lifecycle = createStateFlowLifecycle(backend);
  // No start ever happened (an operator-started episode is invisible here).
  assert.equal(lifecycle.settle(false), false);
  assert.equal(backend.calls.stop, 0);
});

test("backend missing + noop (default): the command proceeds, the warning fires once per session", () => {
  const backend = mockBackend({ present: false });
  const lifecycle = createStateFlowLifecycle(backend);
  const first = lifecycle.start("execute-phase", enabled);
  assert.equal(first.status, "noop-missing");
  assert.equal(first.warn, true);
  const second = lifecycle.start("fold-findings", enabled);
  assert.equal(second.status, "noop-missing");
  assert.equal(second.warn, false, "the backend-missing warning fires once, not per command");
  assert.equal(backend.calls.start, 0);
  assert.equal(lifecycle.settle(false), false, "nothing was owned, nothing is stopped");
});

test("backend missing + refuse: the dispatch is refused", () => {
  const backend = mockBackend({ present: false });
  const lifecycle = createStateFlowLifecycle(backend);
  const outcome = lifecycle.start("execute-phase", { ...enabled, onBackendMissing: "refuse" });
  assert.equal(outcome.status, "refuse-missing");
  assert.equal(backend.calls.start, 0);
});

test("backend missing + noop for one command does not silence a later refuse policy flip (config is re-read per dispatch)", () => {
  const backend = mockBackend({ present: false });
  const lifecycle = createStateFlowLifecycle(backend);
  const first = lifecycle.start("execute-phase", enabled);
  assert.equal(first.warn, true);
  const second = lifecycle.start("fold-findings", { ...enabled, onBackendMissing: "refuse" });
  assert.equal(second.status, "refuse-missing");
});
