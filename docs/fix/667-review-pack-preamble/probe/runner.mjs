#!/usr/bin/env node
// Issue #667 probe runner — one cell, N reps, raw responses stored beside the
// exact prompt that produced them.
//
//   NAN_API_KEY=… bun probe/runner.mjs --cell A --reps 3 --out probe/runs/p1
//
// Cells (owner: CELLS.md in this folder):
//   A   the live skills/review-code/SKILL.md, verbatim
//   A+  A with the live FINDER_CONTRACT.md spliced before `## Checklist`
//   B+  the live post-change pass file with FINDER_CONTRACT.md spliced the same way
//   B-  the live post-change pass file, no splice (the citation-only failure mode)
//
// The pass file is read from disk at run time, so the same command measures the
// pre-change tree (P1) and the post-change tree (P3). Each rep stores the raw
// JSON response and the byte-exact prompt, so a later reader can re-run the cell
// instead of trusting this report.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const PROBE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(PROBE, "../../../..");
const PASS = "skills/review-code/SKILL.md";
const OWNER = "skills/review-implementation/references/FINDER_CONTRACT.md";
const FIXTURE = path.join(PROBE, "fixture.md");
const MODEL = "qwen3.6";
const MAX_TOKENS = 16000;
const ENDPOINT = "https://api.nan.builders/v1/chat/completions";

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

const args = { cell: null, reps: 3, out: null };
for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (arg === "--cell") args.cell = process.argv[++i];
  else if (arg === "--reps") args.reps = Number(process.argv[++i]);
  else if (arg === "--out") args.out = process.argv[++i];
  else throw new Error(`unknown argument: ${arg}`);
}
if (!args.cell || !args.out) {
  throw new Error("usage: runner.mjs --cell <A|A+|B+|B-> [--reps 3] --out <dir>");
}

const splice = (text, content, file) =>
  text.replace(
    "## Checklist",
    `--- BEGIN read: ${file} ---\n${content.trimEnd()}\n--- END read ---\n\n## Checklist`,
  );

const buildPassFile = (cell) => {
  const pass = read(PASS);
  const owner = read(OWNER);
  switch (cell) {
    case "A":
      return { pass, injected: [] };
    case "A+":
      return { pass: splice(pass, owner, OWNER), injected: [OWNER] };
    case "B+":
      return { pass: splice(pass, owner, OWNER), injected: [OWNER] };
    case "B-":
      return { pass, injected: [] };
    default:
      throw new Error(`unknown cell: ${cell}`);
  }
};

const composePrompt = (passFile) => `You are the review-code review pass of an internal review pack, running isolated and context-clean.
SCOPE: the branch diff of a TypeScript config-loader change vs main (provided below at REVIEWED CHANGE).
Follow the pass file below inline as the routed step, then return ONLY the pass's fixed-format output block.

===== PASS FILE =====
${passFile}
===== REVIEWED CHANGE =====
${fs.readFileSync(FIXTURE, "utf8")}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const call = async (prompt) => {
  const body = JSON.stringify({
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    max_tokens: MAX_TOKENS,
  });
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const started = Date.now();
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NAN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body,
    });
    const text = await response.text();
    if (response.ok) return { elapsedMs: Date.now() - started, attempts: attempt, json: JSON.parse(text) };
    last = { status: response.status, body: text.slice(0, 500) };
    if (response.status !== 429 && response.status < 500) break;
    await sleep(10_000 * attempt);
  }
  throw new Error(`request failed: ${JSON.stringify(last)}`);
};

const outDir = path.isAbsolute(args.out) ? args.out : path.join(ROOT, args.out);
fs.mkdirSync(outDir, { recursive: true });

for (let rep = 1; rep <= args.reps; rep += 1) {
  const { pass, injected } = buildPassFile(args.cell);
  const prompt = composePrompt(pass);
  const stamp = `${args.cell}-${rep}`;
  process.stderr.write(`${stamp}: ${prompt.length} prompt chars, model ${MODEL}, max_tokens ${MAX_TOKENS}\n`);
  const result = await call(prompt);
  const message = result.json.choices?.[0]?.message ?? {};
  fs.writeFileSync(path.join(outDir, `${stamp}.prompt.txt`), prompt);
  fs.writeFileSync(
    path.join(outDir, `${stamp}.json`),
    `${JSON.stringify({ cell: args.cell, rep, injected, elapsedMs: result.elapsedMs, attempts: result.attempts, response: result.json }, null, 2)}\n`,
  );
  process.stderr.write(
    `${stamp}: finish=${result.json.choices?.[0]?.finish_reason} content=${(message.content ?? "").length}B ` +
      `reasoning=${(message.reasoning_content ?? "").length}B ${(result.elapsedMs / 1000).toFixed(1)}s\n`,
  );
}
