#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/content-guard.mjs obligations=contract,convention

/**
 * content-guard-discipline.test.mjs — the content guard's discipline gate
 * (issue #470, S9, the #444 pattern).
 *
 * The layer only holds if the sanitized path is the ONLY path a producer has:
 * one module reads untrusted forge text and hands back a guarded value, and no
 * other producer reads `title`/`body` out of a forge `--json` payload unless it
 * is named here with the reason its input can never become a model instruction.
 *
 * Five rules, each a refusal with a name:
 *   R1 — a declared seam imports the guard module (the sanitized path);
 *   R2 — each declared reader function calls `guardForgeContent`;
 *   R3 — inside a declared reader, every `.title`/`.body` read sits in a
 *        `guardForgeContent(...)` argument — never assigned, compared or
 *        returned raw;
 *   R4 — every file in the repository that reads a forge `--json` field list
 *        carrying `title` or `body` is declared (seam) or exempted with a
 *        reason (machine-marker grammar);
 *   R5 — every file that reads a forge REST payload (issue #612s read route) is
 *        the guard module itself, a declared seam, or an explained exemption —
 *        so a producer cannot take the REST door around the guarded route.
 *
 * `scanContentGuard` is pure over a `{files, texts}` model, so the two injected
 * disagreements run the same code the live repository does instead of asserting
 * a copy of the rule.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const GUARD_MODULE = "content-guard.mjs";

/** The guard's own source: it IS the sanitized path, so R5 never judges it. */
const GUARD_MODULE_FILE = "packages/agentic-workflow/src/content-guard.mjs";

/** A forge REST read: the transport, its host, or its path template. */
const FORGE_REST_READ = /\bgh\s+api\b|api\.github\.com|repos\/\{owner\}\/\{repo\}/u;

/** The same property read R3 uses, without R3's stateful `g` flag. */
const FORGE_FIELD_PROPERTY = /[A-Za-z0-9_$\])]\.(?:title|body)\b/u;

/**
 * The declared ingestion seams: the file, the collection entry a caller drives,
 * and the reader functions that touch a forge field. Every one of them must go
 * through `guardForgeContent`.
 */
const SEAMS = [
  {
    file: "scripts/batch-scheduler.mjs",
    entry: "collectIssues",
    readers: ["normalizeIssues"],
    why: "the planner's forge collection: issue titles and bodies reach the batch-plan envelope",
  },
  {
    file: "packages/agentic-workflow/src/runner/sensors/workflow-status.mjs",
    entry: "readForgeState",
    readers: ["guardForgeTitles"],
    why: "the sensor's forge collection: issue titles reach the workflow-status envelope",
  },
  {
    file: "packages/agentic-workflow/src/forge-read/index.mjs",
    entry: "readForge",
    readers: ["readForge"],
    why: "the guarded forge read (issue #612): issue and PR titles, bodies and threads reach a model through this delivery",
  },
];

/**
 * Producers that read a forge `title`/`body` field and are deliberately outside
 * the layer, each with the reason its input can never be a model instruction.
 * A file that reads forge `title`/`body` and is neither a seam nor here fails R4.
 */
const EXEMPT = [
  {
    file: "scripts/pin-watch.mjs",
    why: "compares a pinned dependency version to a version string; the title never reaches prose, a verdict or a model",
  },
  {
    file: "scripts/release.mjs",
    why: "renders merged PR titles into the CHANGELOG contributor list — a human-read document the model does not follow, so the rendered title is never an instruction the model follows",
  },
  {
    file: "packages/agentic-workflow/src/runner/ceremony/pr.mjs",
    why: "reads its own HTML-comment receipt grammar (HEAD <sha> / verdict:) out of a PR body and its comments — the sanitizer would delete the marker itself (planning evidence PE-009)",
  },
];

const FORGE_CONTENT_FIELD = /"[\w,]*(?:title|body)[\w,]*"/u;
/** A property read of a forge field (`i.title`), never a spread (`...title`). */
const FORGE_FIELD_READ = /[A-Za-z0-9_$\])]\.(?:title|body)\b/gu;

/* ------------------------------------------------------------------ reading */

/** Every non-test `.mjs` file the discipline gate scans, repository-relative. */
function scanTargets(root) {
  const targets = [];
  const scripts = path.join(root, "scripts");
  for (const name of fs.readdirSync(scripts).sort()) {
    if (name.endsWith(".mjs") && !name.endsWith(".test.mjs")) targets.push(`scripts/${name}`);
  }
  const walk = (dir) => {
    for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(rel);
      else if (entry.name.endsWith(".mjs")) targets.push(rel);
    }
  };
  walk("packages/agentic-workflow/src");
  return targets;
}

/* --------------------------------------------------------------- source scan */

/**
 * Balance a span from `start` (the index of an opening bracket) to its matching
 * close, skipping string, template and comment spans so a brace inside prose
 * never shifts the count.
 */
function closeOf(text, start) {
  const open = text[start];
  const close = open === "{" ? "}" : open === "(" ? ")" : "]";
  let depth = 0;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (char === "/" && text[index + 1] === "/") {
      const end = text.indexOf("\n", index);
      index = end === -1 ? text.length : end;
      continue;
    }
    if (char === "/" && text[index + 1] === "*") {
      const end = text.indexOf("*/", index + 2);
      index = end === -1 ? text.length : end + 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      for (index += 1; index < text.length; index += 1) {
        if (text[index] === "\\") {
          index += 1;
          continue;
        }
        if (text[index] === quote) break;
      }
      continue;
    }
    if (char === open) depth += 1;
    else if (char === close) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

/** The `[start, end)` body span of one declared function, or null. */
function functionBody(text, name) {
  const declaration = new RegExp(`(?:^|\\n)\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${name}\\s*\\(`, "u").exec(text);
  if (declaration === null) return null;
  const paren = text.indexOf("(", declaration.index + declaration[0].length - 1);
  const paramsEnd = closeOf(text, paren);
  if (paramsEnd === -1) return null;
  const brace = text.indexOf("{", paramsEnd);
  if (brace === -1) return null;
  const end = closeOf(text, brace);
  return end === -1 ? null : [brace, end];
}

/** The `[start, end)` spans of every `guardForgeContent(...)` call in a body. */
function guardCalls(text, [from, to]) {
  const spans = [];
  const marker = "guardForgeContent(";
  let at = text.indexOf(marker, from);
  while (at !== -1 && at < to) {
    const open = at + marker.length - 1;
    const end = closeOf(text, open);
    if (end === -1) break;
    spans.push([at, end]);
    at = text.indexOf(marker, end);
  }
  return spans;
}

/* -------------------------------------------------------------- the checker */

/**
 * Run the four rules over a model of the tree. Pure: the live case builds the
 * model from disk, the injected cases mutate it.
 *
 * @param {{targets: string[], texts: Map<string, string>, exempt?: Array<{file: string, why: string}>}} model
 * @returns {Array<{code: string, file: string, detail: string}>}
 */
export function scanContentGuard({ targets, texts, exempt: exemptions = EXEMPT }) {
  const findings = [];
  const read = (file) => texts.get(file) ?? "";
  const declared = new Set(SEAMS.map((seam) => seam.file));
  const exempt = new Set(exemptions.map((entry) => entry.file));

  for (const seam of SEAMS) {
    if (!targets.includes(seam.file)) {
      findings.push({ code: "missing-seam", file: seam.file, detail: "the declared seam file does not exist" });
      continue;
    }
    const text = read(seam.file);
    if (!new RegExp(`from\\s+"[^"]*${GUARD_MODULE.replace(".", "\\.")}"`, "u").test(text)) {
      findings.push({ code: "seam-does-not-import-guard", file: seam.file, detail: "R1: the seam must import the guard module" });
    }
    if (!new RegExp(`\\b${seam.entry}\\s*\\(`, "u").test(text)) {
      findings.push({ code: "missing-collection-entry", file: seam.file, detail: `the declared entry ${seam.entry} is gone` });
    }
    for (const reader of seam.readers) {
      const body = functionBody(text, reader);
      if (body === null) {
        findings.push({ code: "missing-reader", file: seam.file, detail: `R2: the declared reader ${reader} is gone` });
        continue;
      }
      const calls = guardCalls(text, body);
      if (calls.length === 0) {
        findings.push({ code: "reader-bypasses-guard", file: seam.file, detail: `R2: ${reader} never calls guardForgeContent` });
        continue;
      }
      // R3 — no forge field is read outside a guard argument.
      const slice = text.slice(body[0], body[1]);
      const relative = calls.map(([from, to]) => [from - body[0], to - body[0]]);
      for (const match of slice.matchAll(FORGE_FIELD_READ)) {
        const at = match.index ?? 0;
        if (relative.some(([from, to]) => at >= from && at < to)) continue;
        findings.push({
          code: "raw-forge-field",
          file: seam.file,
          detail: `R3: ${reader} reads ${match[0]} outside a guardForgeContent argument`,
        });
      }
    }
  }

  for (const entry of exemptions) {
    if (entry.why.trim() === "") {
      findings.push({ code: "unexplained-exemption", file: entry.file, detail: "an exemption needs its reason" });
    }
  }

  for (const file of targets) {
    if (declared.has(file) || exempt.has(file)) continue;
    const text = read(file);
    const line = text
      .split("\n")
      .find((candidate) => candidate.includes("--json") && FORGE_CONTENT_FIELD.test(candidate));
    if (line === undefined) continue;
    findings.push({
      code: "undeclared-forge-content-producer",
      file,
      detail: `R4: reads a forge title/body field list and is neither a declared seam nor an explained exemption: ${line.trim()}`,
    });
  }

  // R5 — the read route (issue #612). A REST payload is the other door to forge
  // text; the guarded read is the only declared reader of it.
  for (const file of targets) {
    if (declared.has(file) || exempt.has(file) || file === GUARD_MODULE_FILE) continue;
    const text = read(file);
    if (!FORGE_REST_READ.test(text) || !FORGE_FIELD_PROPERTY.test(text)) continue;
    const line = text.split("\n").find((candidate) => FORGE_FIELD_PROPERTY.test(candidate));
    findings.push({
      code: "undeclared-forge-read-route",
      file,
      detail: `R5: reads a forge REST payload and is neither the guard, a declared seam nor an explained exemption: ${(line ?? "").trim()}`,
    });
  }

  return findings;
}

/** The live model: every scanned file's text, read once. */
function liveModel() {
  const targets = scanTargets(repoRoot);
  const texts = new Map(targets.map((file) => [file, fs.readFileSync(path.join(repoRoot, file), "utf8")]));
  return { targets, texts };
}

/* ------------------------------------------------------------------- cases */

test("R1–R5: the live repository satisfies the discipline gate", () => {
  const findings = scanContentGuard(liveModel());
  assert.deepEqual(
    findings, [],
    `the content guard's ingestion contract is broken:\n${findings.map((f) => `${f.code} ${f.file}: ${f.detail}`).join("\n")}`,
  );
});

test("the gate is not vacuous: every seam is declared and really calls the guard", () => {
  const model = liveModel();
  assert.equal(SEAMS.length, 3, "three seams carry forge text today: the planner, the sensor and the guarded read");
  for (const seam of SEAMS) {
    assert.ok(model.targets.includes(seam.file), `${seam.file} is scanned`);
    const body = functionBody(model.texts.get(seam.file), seam.readers[0]);
    assert.ok(body !== null, `${seam.readers[0]} is readable`);
    assert.ok(guardCalls(model.texts.get(seam.file), body).length > 0, `${seam.readers[0]} calls the guard`);
  }
});

test("R2/R3 injected disagreement: a reader that stops calling the guard is refused by name", () => {
  const model = liveModel();
  const seam = SEAMS[0];
  const text = model.texts.get(seam.file);
  const body = functionBody(text, seam.readers[0]);
  // The exact regression the rule exists for: the collection step keeps reading
  // title/body, but the guard call is gone.
  const stripped = text.slice(0, body[0]) + text.slice(body[0], body[1]).replaceAll("guardForgeContent(", "identity(") + text.slice(body[1]);
  model.texts.set(seam.file, stripped);
  const findings = scanContentGuard(model);
  assert.ok(
    findings.some((finding) => finding.code === "reader-bypasses-guard" && finding.file === seam.file),
    `a reader that never calls the guard is refused: ${JSON.stringify(findings)}`,
  );
});

test("R3 injected disagreement: a raw field read beside the guard call is refused", () => {
  const model = liveModel();
  const seam = SEAMS[0];
  const text = model.texts.get(seam.file);
  const body = functionBody(text, seam.readers[0]);
  const injected = `${text.slice(0, body[0] + 1)}\n      const raw = i.body;\n${text.slice(body[0] + 1)}`;
  model.texts.set(seam.file, injected);
  const findings = scanContentGuard(model);
  assert.ok(
    findings.some((finding) => finding.code === "raw-forge-field" && finding.file === seam.file),
    `a raw read outside the guard argument is refused: ${JSON.stringify(findings)}`,
  );
});

test("R4 injected disagreement: a new collector that reads forge titles fails the gate", () => {
  const model = liveModel();
  model.targets = [...model.targets, "scripts/new-collector.mjs"];
  model.texts.set(
    "scripts/new-collector.mjs",
    'import { spawnSync } from "node:child_process";\nspawnSync("gh", ["issue", "list", "--json", "number,title,body"]);\n',
  );
  const findings = scanContentGuard(model);
  assert.deepEqual(
    findings.map((finding) => [finding.code, finding.file]),
    [["undeclared-forge-content-producer", "scripts/new-collector.mjs"]],
    "the new producer is named, and nothing else is invented",
  );
});

test("R4 injected disagreement: withdrawing an exemption turns the file into a refusal", () => {
  const model = liveModel();
  const withdrawn = EXEMPT[0];
  const findings = scanContentGuard({
    ...model,
    exempt: EXEMPT.filter((entry) => entry.file !== withdrawn.file),
  });
  assert.deepEqual(
    findings.map((finding) => [finding.code, finding.file]),
    [["undeclared-forge-content-producer", withdrawn.file]],
    "the file that lost its reason is named, and nothing else is invented",
  );
});

test("R5 injected disagreement: a producer that reads a forge REST payload outside the guarded route fails", () => {
  const model = liveModel();
  model.targets = [...model.targets, "scripts/rest-reader.mjs"];
  model.texts.set(
    "scripts/rest-reader.mjs",
    [
      "import { spawnSync } from \"node:child_process\";",
      "const raw = JSON.parse(spawnSync(\"gh\", [\"api\", \"repos/{owner}/{repo}/issues/1\"], { encoding: \"utf8\" }).stdout);",
      "process.stdout.write(raw.body);",
      "",
    ].join("\n"),
  );
  const findings = scanContentGuard(model);
  assert.deepEqual(
    findings.map((finding) => [finding.code, finding.file]),
    [["undeclared-forge-read-route", "scripts/rest-reader.mjs"]],
    "the REST door is named, and nothing else is invented",
  );
});

test("R5: the guard module itself is never judged by its own rule", () => {
  const findings = scanContentGuard(liveModel());
  assert.deepEqual(
    findings.filter((finding) => finding.file === GUARD_MODULE_FILE),
    [],
    "the sanitized path IS the guard; R5 names the doors around it, not the door",
  );
});

test("R4: a declared seam is never also an exemption, and every exemption states its reason", () => {
  const seamFiles = new Set(SEAMS.map((seam) => seam.file));
  for (const entry of EXEMPT) {
    assert.ok(!seamFiles.has(entry.file), `${entry.file} is not both a seam and an exemption`);
    assert.ok(entry.why.trim().length > 20, `${entry.file}'s exemption explains itself`);
  }
});
