// settings-console-jsonc.test.mjs — a settings save keeps the operator's comments (issue #521 S7).
//
// The console reads JSONC, so the file it edits may carry comments; the old
// writer re-serialized the whole object with `JSON.stringify`, which deleted
// every one of them on the first Save. Owner decision D3: `jsonc-parser`'s
// `modify`/`applyEdits` edit the text in place instead.
//
// What a save guarantees, and what it does not:
//  - every comment outside the edited span survives;
//  - a save with no change writes the original bytes back, byte for byte;
//  - changing a value rewrites only that value's span;
//  - adding or removing a member re-renders the object that holds it (its
//    comments are kept, its layout is normalized to the file's indentation);
//  - a comment attached to a removed member goes with it.

import assert from "node:assert/strict";
import test from "node:test";

import { configFilePaths, loadConfig } from "../dist/config/load.js";
import { prompts, runSettingsConsole } from "../dist/settings/console.js";
import { applyConfigEdits } from "../dist/settings/jsonc-write.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const paths = configFilePaths(agentDir, cwd);
const commands = ["design-feature", "execute-phase"];

const COMMENTED = `{
  // the default route stays on the session model
  "default": { "model": "inherit", "thinking": "inherit" },
  "commands": {
    // the cheap tier for the executor
    "execute-phase": { "model": ["openai/gpt-5.2", "openai/gpt-5.1"], "thinking": "low" },
  },
  "onSettle": "keep",
}
`;

/** The exact prompt strings the flow asks; anything unexpected fails loudly. */
function scriptedUi(answers) {
  const notify = [];
  const asked = [];
  const take = (title) => {
    if (!Object.hasOwn(answers, title)) throw new Error(`no scripted answer for: ${title}`);
    const value = answers[title];
    return Array.isArray(value) ? value.shift() : value;
  };
  return {
    notify,
    asked,
    ui: {
      notify: (message) => notify.push(message),
      // The scope question offers [Global, Project]; every test edits the global file.
      select: async (title, options) => {
        asked.push(title);
        return title === prompts.scope ? options[0] : take(title);
      },
      confirm: async (title) => {
        asked.push(title);
        return take(title);
      },
      pick: async (title) => {
        asked.push(title);
        return take(title);
      },
    },
  };
}

function readFrom(files) {
  return (path) => files[path] ?? null;
}

function collector() {
  const written = new Map();
  return { written, writeFile: (path, text) => written.set(path, text) };
}

async function saveThroughConsole({ text, answers, files = {} }) {
  const sink = collector();
  const scripted = scriptedUi(answers);
  const outcome = await runSettingsConsole({
    ui: scripted.ui,
    agentDir,
    cwd,
    projectTrusted: true,
    commands,
    readFile: readFrom({ [paths.global]: text, ...files }),
    writeFile: sink.writeFile,
  });
  return { outcome, saved: sink.written.get(paths.global), notify: scripted.notify };
}

test("K1: a save keeps every comment and changes only the edited value (S7)", async () => {
  const { outcome, saved } = await saveThroughConsole({
    text: COMMENTED,
    answers: {
      [prompts.menu]: [prompts.settle, prompts.save],
      [prompts.settleChoice]: "restore",
      [prompts.saveTo(paths.global)]: true,
    },
  });
  assert.equal(outcome.status, "saved");
  assert.match(saved, /\/\/ the default route stays on the session model/u, "the first comment survives");
  assert.match(saved, /\/\/ the cheap tier for the executor/u, "the nested comment survives");
  assert.ok(
    saved.includes('"execute-phase": { "model": ["openai/gpt-5.2", "openai/gpt-5.1"], "thinking": "low" },'),
    "an untouched member keeps its bytes",
  );
  assert.ok(saved.includes('"onSettle": "restore"'), "the edit landed");
  assert.ok(!saved.includes('"onSettle": "keep"'), "the old value is gone");
  // The saved bytes are still the config the operator saw.
  const reloaded = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.global]: saved }),
  });
  assert.equal(reloaded.ok, true, JSON.stringify(reloaded.problems));
  assert.equal(reloaded.config.onSettle, "restore");
});

test("K2: a save with no change writes the original bytes back (S7)", async () => {
  const { outcome, saved } = await saveThroughConsole({
    text: COMMENTED,
    answers: {
      [prompts.menu]: [prompts.save],
      [prompts.saveTo(paths.global)]: true,
    },
  });
  assert.equal(outcome.status, "saved");
  assert.equal(saved, COMMENTED, "no change must not re-render the file");
});

test("K3: adding a member re-renders that object with its comments kept, and nothing else (S7)", () => {
  const next = applyConfigEdits(COMMENTED, {
    default: { model: "inherit", thinking: "inherit" },
    commands: {
      "execute-phase": { model: ["openai/gpt-5.2", "openai/gpt-5.1"], thinking: "low" },
      "design-feature": { thinking: "low" },
    },
    onSettle: "keep",
    profileOrder: ["work"],
  });
  assert.match(next, /\/\/ the cheap tier for the executor/u, "the nested comment survives the re-render");
  assert.match(next, /\/\/ the default route stays on the session model/u);
  assert.ok(
    next.includes('"default": { "model": "inherit", "thinking": "inherit" },'),
    "a top-level member outside the edited object keeps its bytes",
  );
  assert.match(next, /"design-feature": \{/u, "the new member is written");
  assert.match(next, /"profileOrder": \[\n\s+"work"\n\s+\],?/u, "a new top-level member is appended");
  assert.ok(next.trimEnd().endsWith("}"), "the document still closes");
});

test("K4: removing a member takes its own comment and nothing else (S7)", () => {
  const next = applyConfigEdits(COMMENTED, {
    default: { model: "inherit", thinking: "inherit" },
    onSettle: "keep",
  });
  assert.ok(!next.includes("the cheap tier for the executor"), "the removed member's comment goes with it");
  assert.match(next, /\/\/ the default route stays on the session model/u, "unrelated comments stay");
  assert.ok(!next.includes('"commands"'), "the member is gone");
});

test("K5: an absent file is written as plain pretty JSON (S7)", () => {
  const text = applyConfigEdits(null, { onSettle: "restore" });
  assert.equal(text, '{\n  "onSettle": "restore"\n}\n');
});

test("K6: an original that no longer parses still writes the draft, never a lossy merge (S7)", () => {
  const text = applyConfigEdits('{ "onSettle": ', { onSettle: "restore" });
  assert.equal(text, '{\n  "onSettle": "restore"\n}\n', "a broken original is replaced, not merged");
});

test("K7: the file's own indentation and line endings are kept when an edit re-renders an object (S7)", () => {
  const fourSpace = '{\n    "commands": {\n        "a": { "thinking": "low" }\n    }\n}\n';
  const next = applyConfigEdits(fourSpace, { commands: { a: { thinking: "low" }, b: { thinking: "high" } } });
  assert.ok(next.includes('\n        "b": {\n            "thinking": "high"\n        }'), `four-space indent kept:\n${next}`);
  const crlf = '{\r\n  "commands": {\r\n    "a": { "thinking": "low" }\r\n  }\r\n}\r\n';
  const nextCrlf = applyConfigEdits(crlf, { commands: { a: { thinking: "low" }, b: { thinking: "high" } } });
  assert.ok(!/[^\r]\n/u.test(nextCrlf), `CRLF kept:\n${JSON.stringify(nextCrlf)}`);
});
