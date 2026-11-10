// vendor-neutral.test.mjs — issue #388's measurable lock-in gate.
//
// The main package ships provider-neutral: no `nan` provider id may appear in
// src or README (issue #388 AC1), and `skills/log-session/SKILL.md` names no
// provider or model id (AC4). Enforced by byte scanning, not by prose.
//
// The scanner matches the vendor token as a whole word, case-insensitive; the
// exact token `NaN` (JavaScript's not-a-number literal) is the one allowed
// spelling, because a lowercase or mixed-case `nan`/`Nan` is always the
// provider id. Words that merely contain the letters ("provenance",
// "maintenance") carry no word boundary and never match.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const PKG_ROOT = new URL("..", import.meta.url).pathname;
const REPO_ROOT = new URL("../../..", import.meta.url).pathname;

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "dist" || entry === "node_modules" || entry === "skills") continue;
      yield* walk(full);
    } else if (entry.endsWith(".ts")) {
      yield full;
    }
  }
}

/** Every /nan/i whole-word occurrence that is not the JS literal `NaN`. */
export function vendorLiterals(text) {
  const hits = [];
  for (const match of text.matchAll(/\bnan\b/giu)) {
    if (match[0] === "NaN") continue;
    const line = text.slice(0, match.index).split("\n").length;
    hits.push(line);
  }
  return hits;
}

test("AC1: the main package's src contains no nan provider id", () => {
  const offenders = [];
  for (const file of walk(join(PKG_ROOT, "src"))) {
    const rel = relative(PKG_ROOT, file);
    for (const line of vendorLiterals(readFileSync(file, "utf8"))) {
      offenders.push(`${rel}:${line}`);
    }
  }
  assert.deepEqual(offenders, [], `nan provider literals remain in src:\n  ${offenders.join("\n  ")}`);
});

test("AC1: the main package's README contains no nan provider id", () => {
  const rel = "README.md";
  const hits = vendorLiterals(readFileSync(join(PKG_ROOT, rel), "utf8")).map((line) => `${rel}:${line}`);
  assert.deepEqual(hits, [], `nan provider literals remain in README:\n  ${hits.join("\n  ")}`);
});

test("AC4: skills/log-session/SKILL.md names no provider or model id", () => {
  const skill = readFileSync(join(REPO_ROOT, "skills", "log-session", "SKILL.md"), "utf8");
  const hits = [];
  for (const match of skill.matchAll(/qwen|gemma|glm|deepseek|mimo|\bnan\b/giu)) {
    const line = skill.slice(0, match.index).split("\n").length;
    hits.push(line);
  }
  assert.deepEqual(hits, [], `log-session still names provider/model ids at lines:\n  ${hits.join("\n  ")}`);
});
