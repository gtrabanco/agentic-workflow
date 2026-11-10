// docs-parity.test.mjs — the companion README is the human-facing source of
// truth for the preset (issue #388: the NaN guidance moved here from the root
// README). Two directions are pinned: every model the preset routes to is
// documented, and every judgment rung the README names is actually routed.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { PUBLISHED_LADDER, STRENGTH_SENSITIVE_SKILLS } from "../dist/preset.js";

const readme = () => readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("parity: every model the preset routes to is documented in the companion README", () => {
  const doc = readme();
  const profiled = new Set(
    [PUBLISHED_LADDER.default, ...Object.values(PUBLISHED_LADDER.commands)]
      .filter(Boolean)
      .flatMap((route) => route.model ?? [])
      .map((ref) => ref.split("/")[1]),
  );
  assert.ok(profiled.size >= 4, `expected the preset to route several models, got: ${[...profiled]}`);
  for (const id of profiled) {
    assert.ok(
      doc.includes(`**${id}**`) || doc.includes(`\`${id}\``),
      `the companion README does not document \`${id}\``,
    );
  }
});

test("parity: the README's judgment ladders and the preset agree on rung 1", () => {
  const doc = readme();
  const rung1 = (task) => {
    const row = new RegExp(`^\\| \\*\\*${task}\\*\\* \\|.*$`, "mu").exec(doc);
    assert.ok(row, `the README has no ladder row for ${task}`);
    const model = /1\. \*\*([^*]+)\*\*/.exec(row[0]);
    assert.ok(model, `the ${task} row declares no rung 1`);
    return model[1];
  };
  const routed = new Set(
    STRENGTH_SENSITIVE_SKILLS.flatMap((skill) => PUBLISHED_LADDER.commands[skill]?.model ?? [])
      .map((ref) => ref.split("/")[1]),
  );
  for (const task of ["Merge gates", "Product definition", "Execution / mechanical"]) {
    assert.ok(
      routed.has(rung1(task)),
      `${task} rung 1 (\`${rung1(task)}\`) is not routed by the strength-sensitive preset ladder`,
    );
  }
});
