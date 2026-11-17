// guard.payload.test.mjs — the hook-payload rule the platform adapters delegate
// (unit 554): one normalization for Claude, Cursor, Copilot and OpenCode, so no
// adapter carries a field precedence of its own.
//
// The cases are the retired adapter's rule (`normalize-hook-payload.sh`): the
// key precedence, the string rule, and what counts as an unusable payload.

import test from "node:test";
import assert from "node:assert/strict";

import { COMMAND_KEYS, PATH_KEYS, normalizeHookPayload } from "../src/guard/payload.mjs";

test("the command keys are read in the documented order", () => {
  assert.deepEqual(COMMAND_KEYS, ["tool_input.command", "input.command", "toolArgs.command", "args.command", "command"]);
});

test("the path keys are read in the documented order", () => {
  assert.deepEqual(PATH_KEYS, [
    "tool_input.file_path",
    "tool_input.path",
    "input.file_path",
    "input.path",
    "toolArgs.file_path",
    "toolArgs.path",
    "args.file_path",
    "args.path",
    "file_path",
    "path",
  ]);
});

test("a Claude Code payload normalizes to its command and path", () => {
  assert.deepEqual(normalizeHookPayload({ tool_input: { command: "gh pr merge 12", file_path: "/srv/app/.env" } }), {
    ok: true,
    command: "gh pr merge 12",
    path: "/srv/app/.env",
  });
});

test("a Cursor payload normalizes", () => {
  assert.deepEqual(normalizeHookPayload({ command: "cat .env" }), { ok: true, command: "cat .env", path: "" });
});

test("a Copilot payload normalizes", () => {
  assert.deepEqual(normalizeHookPayload({ toolArgs: { path: ".env.local" } }), { ok: true, command: "", path: ".env.local" });
});

test("an OpenCode-shaped payload normalizes through its nested args", () => {
  assert.deepEqual(normalizeHookPayload({ args: { filePath: "ignored" } }), {
    ok: false,
    message: "hook payload must contain a recognized command or path",
  });
  assert.deepEqual(normalizeHookPayload({ args: { path: ".env" } }), { ok: true, command: "", path: ".env" });
});

test("the first non-null key wins, and a false value is skipped like jq's //", () => {
  assert.deepEqual(normalizeHookPayload({ tool_input: { command: false, path: null }, input: { command: "printf safe" } }), {
    ok: true,
    command: "printf safe",
    path: "",
  });
});

test("a payload with neither field refuses", () => {
  assert.deepEqual(normalizeHookPayload({}), {
    ok: false,
    message: "hook payload must contain a recognized command or path",
  });
  assert.deepEqual(normalizeHookPayload({ tool_input: { command: "" } }), {
    ok: false,
    message: "hook payload must contain a recognized command or path",
  });
});

test("a non-string field refuses instead of being coerced", () => {
  assert.deepEqual(normalizeHookPayload({ tool_input: { command: 12 } }), {
    ok: false,
    message: "hook payload must contain a recognized command or path",
  });
});

test("a non-object payload refuses", () => {
  for (const payload of [[], "text", 12, null]) {
    assert.deepEqual(normalizeHookPayload(payload), { ok: false, message: "hook payload must be an object" });
  }
});

test("a payload that is not JSON refuses with the same sentence", () => {
  assert.deepEqual(normalizeHookPayload("{not-json"), { ok: false, message: "hook payload must be an object" });
});
