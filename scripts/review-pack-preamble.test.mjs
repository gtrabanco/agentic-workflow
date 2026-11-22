#!/usr/bin/env node
// test-obligation: protects=skills/review-implementation/references/FINDER_CONTRACT.md,skills/review-code/SKILL.md,skills/review-verify/SKILL.md obligations=contract,failure-path,convention

/**
 * review-pack-preamble.test.mjs — the internal review pack's shared preamble has
 * one owner (issue #667).
 *
 * The nine passes used to carry the preamble themselves: a scope body, a
 * materiality bar, a composition clause and a discipline parenthetical, copied
 * per file. This suite pins the shape the extraction landed, so the duplication
 * cannot creep back and the parts that must stay per-file cannot be extracted by
 * accident:
 *
 *   1. `FINDER_CONTRACT.md` owns the whole preamble (scope, materiality,
 *      checklist discipline with its tally protocol, the `review-debt` transform
 *      variant, the pass identity) and names the nine passes it binds.
 *   2. Every pass points at the owner — imperative, fail-closed — instead of
 *      copying the extracted rule, and keeps the checklist discipline **inline**
 *      (a pointer-only protocol is the fabricated-tally failure the 2026-11-21
 *      probe reproduced).
 *   3. The axis checklist items, the `Return exactly` block and the `Done when`
 *      body are byte-identical to their pre-change form: an extraction that
 *      edits a checklist has edited the review, not its preamble.
 *   4. The per-file survivors stay per-file — `review-code`'s ask-don't-infer
 *      sentence, `review-verify`'s RUNNER pointer and its discoverer→auditor
 *      paragraph — and `review-debt` carries no materiality section, because it
 *      transforms a table instead of padding a checklist.
 *
 * The three hashes per pass are the pre-change regions measured at the cut head
 * (`55525abad`); a pass whose item block moves fails here by name.
 *
 * The justification line: this suite guards the observable contract that a
 * review pass's own brief still contains the discipline its tally is judged
 * against — the failure path where a pointer without an inline protocol lets the
 * floor model fabricate an over-count — not the shape of the files it reads.
 */

import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const OWNER = "skills/review-implementation/references/FINDER_CONTRACT.md";
const OWNER_REF = `\`${OWNER}\``;
const STOP = "Missing reference → STOP";

/** The eight axis finders — `review-debt` transforms instead of checking. */
const FINDERS = ["a11y", "brand", "code", "design", "perf", "security", "seo", "verify"];
const PASSES = [...FINDERS, "debt"];

/** A section body: everything after its heading line, up to the next `## `. */
const section = (text, heading) => {
  const lines = text.split("\n");
  const at = lines.findIndex((line) => line === heading);
  if (at === -1) return null;
  let end = at + 1;
  while (end < lines.length && !lines[end].startsWith("## ")) end += 1;
  return lines.slice(at + 1, end).join("\n").replace(/\n+$/, "");
};

/** The checklist item block: from the first `✓` item to the section's end. */
const items = (body) => {
  if (body === null) return null;
  const lines = body.split("\n");
  const at = lines.findIndex((line) => /^\s*(?:-\s+)?✓/.test(line));
  if (at === -1) return null;
  return lines.slice(at).join("\n").replace(/\n+$/, "");
};

const md5 = (value) => crypto.createHash("md5").update(value).digest("hex").slice(0, 12);

/** Pre-change regions at the cut head, per pass. */
const FROZEN = {
  a11y: { items: "2032ab138cf2", ret: "f997a7e7b458", done: "e197643d5611" },
  brand: { items: "04c19c253280", ret: "cd784787909f", done: "e197643d5611" },
  code: { items: "8118956ac394", ret: "1270b307a77a", done: "e197643d5611" },
  debt: { items: "716bb451b5ce", ret: "bde942f2f3dc", done: "e2c2d925404c" },
  design: { items: "df6d98747049", ret: "a486bcd31747", done: "e197643d5611" },
  perf: { items: "33740d07c9c8", ret: "770741e1d93a", done: "e197643d5611" },
  security: { items: "9237d50c3e81", ret: "b63d68341d5c", done: "e197643d5611" },
  seo: { items: "cba01b6fb047", ret: "c62fe4573cf4", done: "e197643d5611" },
  verify: { items: "38e0b8676553", ret: "13300818224c", done: "e197643d5611" },
};

const owner = read(OWNER);

// ── 1. One owner for the whole shared preamble ─────────────────────────────

for (const heading of [
  "## Pass identity",
  "## Scope",
  "## Checklist discipline",
  "## Transform discipline (`review-debt`)",
  "## Materiality bar",
]) {
  assert.ok(section(owner, heading), `${OWNER}: carries ${heading}`);
}

// The checklist-discipline contract states the tally protocol and why it is not
// a pointer: the protocol is evaluated in the pass's own output every run.
const discipline = section(owner, "## Checklist discipline");
assert.match(discipline, /EVERY checklist item — none is optional/, "the discipline states the every-item rule");
assert.match(discipline, /marked `n\/a` with the reason/, "the discipline states the n/a rule");
assert.match(discipline, /evaluated/, "the discipline names the tally's evaluated count");
assert.match(discipline, /fabricated/, "the discipline states the fabricated-count failure");
assert.match(discipline, /by reference/, "the discipline records why it stays inline rather than travelling by reference");

// The bar's operative rule lives here, so a finder's pointer has something to
// apply: the moved `review-loop-discipline` pin asserts the phrases per finder.
const bar = section(owner, "## Materiality bar");
assert.match(bar, /cite the rule it violates beside the evidence/, "the owner carries the cite-the-rule bar");
assert.match(bar, /never pad the table/, "the owner carries the no-padding rule");

// The transform variant is the debt pass's scope contract.
const transform = section(owner, "## Transform discipline (`review-debt`)");
assert.match(transform, /synthesized findings table/, "the transform variant names the debt pass's scope");
assert.match(transform, /never rescans the diff/, "the transform variant keeps the no-rescan rule");

// The owner names the nine passes it binds, so a reader sees the governed set.
for (const pass of PASSES) {
  assert.match(owner, new RegExp(`\`review-${pass}\``), `${OWNER}: names review-${pass}`);
}

// ── 2. Every pass points at the owner and keeps the discipline inline ───────

for (const pass of PASSES) {
  const text = read(`skills/review-${pass}/SKILL.md`);

  // 2a. Identity: the routed step and the findings-only guardrail stay inline,
  //     and the shared identity is owned.
  assert.match(text, /follow this file inline as the routed step/, `review-${pass}: keeps the routed-step imperative`);
  assert.match(text, /findings only/, `review-${pass}: keeps the findings-only guardrail`);
  assert.match(text, /never edits, never refactors/, `review-${pass}: keeps the no-edit guardrail`);
  assert.match(text, /§Pass identity/, `review-${pass}: cites the pass identity's owner`);
  assert.doesNotMatch(
    text,
    /Composed by `review-change` \/ `product-audit` within their conversation/,
    `review-${pass}: the composition clause is owned, never copied`,
  );

  // 2b. Scope: one fail-closed pointer, never the extracted body.
  const scope = section(text, "## Scope");
  assert.ok(scope !== null, `review-${pass}: carries ## Scope`);
  assert.ok(scope.includes(OWNER_REF), `review-${pass}: the scope pointer names the owner`);
  // The transform pass has no checklist to read before: its imperative step is
  // the transform itself, and the requirement binds the same fail-closed shape.
  assert.match(
    scope,
    pass === "debt" ? /before the transform/ : /before the checklist/,
    `review-${pass}: the scope pointer is imperative`,
  );
  assert.ok(scope.includes(STOP), `review-${pass}: the scope pointer stops on a missing reference`);
  assert.doesNotMatch(
    scope,
    /The caller's diff or path\/glob — the shape is the finder contract's/,
    `review-${pass}: the extracted scope body is gone`,
  );
  if (pass === "debt") {
    assert.match(scope, /§Transform discipline/, "review-debt: its scope is the transform variant's");
    assert.doesNotMatch(scope, /State the scope — the change the table was synthesized over/, "review-debt: the old scope body is gone");
  }

  // 2c. The checklist heading loses the parenthetical, and the tally protocol
  //     stays inline, citing the owner as the rule (never a pointer-only pass).
  const heading = pass === "debt" ? "## Transform" : "## Checklist";
  const checklist = section(text, heading);
  assert.ok(checklist !== null, `review-${pass}: carries ${heading} without the discipline parenthetical`);
  assert.ok(checklist.includes(OWNER_REF), `review-${pass}: the inline tally protocol cites the owner`);
  assert.match(checklist, /§Checklist discipline/, `review-${pass}: the inline protocol names the contract's section`);
  assert.match(checklist, /n\/a/, `review-${pass}: the inline protocol keeps the n/a bucket`);
  if (pass === "debt") {
    assert.match(checklist, /every transform item below is evaluated/, "review-debt: the protocol binds its own transform shape");
  } else {
    assert.match(checklist, /item count/, `review-${pass}: the inline protocol states the item-count denominator`);
    assert.match(checklist, /pass \+ findings \+ n\/a/, `review-${pass}: the inline protocol states the tally's buckets`);
  }

  // 2d. The materiality bar is one fail-closed pointer — and the transform pass,
  //     which pads no checklist, carries none.
  const materiality = section(text, "## Materiality bar");
  if (pass === "debt") {
    assert.equal(materiality, null, "review-debt transforms instead of checking: no materiality section");
  } else {
    assert.ok(materiality !== null, `review-${pass}: carries ## Materiality bar`);
    assert.ok(materiality.includes(OWNER_REF), `review-${pass}: the materiality pointer names the owner`);
    assert.match(materiality, /§Materiality bar/, `review-${pass}: the pointer names the bar's section`);
    assert.ok(materiality.includes(STOP), `review-${pass}: the materiality pointer stops on a missing reference`);
    assert.doesNotMatch(
      materiality,
      /Not findings: comment\/punctuation typos/,
      `review-${pass}: the extracted bar body is gone`,
    );
    assert.doesNotMatch(
      materiality,
      /An empty table with `Decision: PASS` is the expected result/,
      `review-${pass}: the extracted bar's closing rule is gone`,
    );
  }
}

// ── 3. The axis content is untouched, byte for byte ────────────────────────

for (const pass of PASSES) {
  const text = read(`skills/review-${pass}/SKILL.md`);
  const heading = pass === "debt" ? "## Transform" : "## Checklist";
  assert.equal(
    md5(items(section(text, heading))),
    FROZEN[pass].items,
    `review-${pass}: the checklist items are byte-identical to the pre-change block`,
  );
  assert.equal(
    md5(section(text, "## Return exactly")),
    FROZEN[pass].ret,
    `review-${pass}: the Return exactly block is byte-identical`,
  );
  assert.equal(
    md5(section(text, "## Done when")),
    FROZEN[pass].done,
    `review-${pass}: the Done when body is byte-identical`,
  );
}

// ── 4. The per-file survivors stay per-file ────────────────────────────────

const code = read("skills/review-code/SKILL.md");
assert.match(code, /ask-don't-infer/, "review-code keeps its ask-don't-infer sentence");
assert.match(code, /`ask-dont-infer@1`/, "review-code keeps the rule's block id");

const verify = read("skills/review-verify/SKILL.md");
assert.match(verify, /\(\.\.\/runner-contract\/references\/RUNNER\.md\)/, "review-verify keeps the RUNNER pointer");
assert.match(verify, /Shift from discoverer to auditor/, "review-verify keeps its S5 discoverer→auditor paragraph");

// ── 5. The preamble cannot creep back ──────────────────────────────────────

for (const pass of PASSES) {
  const text = read(`skills/review-${pass}/SKILL.md`);
  assert.doesNotMatch(
    text,
    /The bar is owned by `skills\/review-implementation\/references\/FINDER_CONTRACT\.md` —\n?\s*apply it as written/,
    `review-${pass}: the old materiality restatement never returns`,
  );
}

console.log("PASS review-pack-preamble: one owner for the shared preamble, discipline inline in all nine passes");
