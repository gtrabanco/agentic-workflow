// Build review contexts for the review-on-slices A/B experiment.
// Usage: bun build-contexts.mjs <repoRoot> [--unit U1|U2]
import { execFileSync } from "node:child_process";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const repo = process.argv[2];
const unitArg = process.argv[3] || null;
const cfg = JSON.parse(readFileSync(new URL("./config.json", import.meta.url)));

function git(...args) {
  return execFileSync("git", ["-C", repo, ...args], { maxBuffer: 512 * 1024 * 1024 }).toString();
}
function contentCap(f) {
  if (f.endsWith(".gitkeep")) return 0;
  if (f.startsWith("scripts/fixtures/unit-route/src/")) return 400;
  if (f.startsWith("CHANGELOG")) return 1200;
  if (f.includes("packages/pi-agentic-workflow/skills/") && !f.endsWith("package.json")) return 4000;
  if (f.includes("/references/")) return 9000;
  if (f.endsWith(".md") || f.endsWith(".json")) return 9000;
  return 12000;
}

function renderFile(base, tip, f) {
  let diff = "";
  try {
    diff = git("diff", base, tip, "--", f);
  } catch (e) { return `### FILE: ${f}\n(diff failed)`; }
  if (!diff.trim()) diff = "(no diff for this path — anchor file, unchanged by the unit)\n";
  let content = "";
  const cap = contentCap(f);
  let isNew = false;
  try { execFileSync("git", ["-C", repo, "cat-file", "-e", `${base}:${f}`]); } catch { isNew = true; }
  if (cap > 0 && !isNew) {
    try {
      const c = execFileSync("git", ["-C", repo, "show", `${tip}:${f}`], { maxBuffer: 512 * 1024 * 1024 }).toString();
      content = c.replace(/\r/g, "");
      if (content.length > cap) content = content.slice(0, cap) + `\n[… content truncated at ${cap} bytes of ${c.length} …]`;
    } catch { content = "(file absent at tip)"; }
  }  return `### FILE: ${f}\n--- diff (base..tip) ---\n${diff}\n--- current content at tip ---\n${content || "(content omitted)"}\n`;
}

const p = `${(s) => s}`;
const promptPreamble = (unit, summary, scopeText) =>
`You are one reviewer pass of \`review-change\` inside the agentic-workflow repo's own delivery flow. The unit being reviewed: "${unit}". ${summary}

${scopeText}

Find DEFECTS in the material provided. Judge against these axes:
- code: correctness, error handling, dead/duplicated code, broken behavior
- workflow: the change contradicts the repo's own declared contracts (gate/verdict/ledger vocabularies it itself states elsewhere in this material)
- usage-docs: what the docs claim about behavior does not match what the code in this material does, or a documented invocation fails
- spec-drift: receipts/claims in the unit's own documents contradict each other or the recorded state
- security: unbounded injection/length/escape issues
- perf: budget/ceiling/threshold values that contradict a declared rule visible in this material
- brand: undisclosed limitations, honest-copy violations

Severity: high (breaks a contract or a gate), med (a repair the unit must ship), low (note).
Report ONLY defects you can point at with concrete evidence (quote the bytes or name the two contradicting pieces). No style nits, no rephrasing suggestions, no praise.
Output STRICT JSON — a single array, no markdown fence, no commentary. Keep your hidden reasoning short (at most a few hundred tokens); do not re-derive the whole diff, go straight to candidate defects then output.
[{"file":"path","line":<line number or null>,"title":"<short>","detail":"<what is wrong, with the evidence>","severity":"high|med|low","axis":"code|workflow|usage-docs|spec-drift|security|perf|brand"}]
If you find nothing, output [].
`;

const units = unitArg ? [unitArg] : ["U1", "U2"];
for (const u of units) {
  const U = cfg[u];
  const changed = new Set(execFileSync("bash", ["-c", `git -C ${repo} diff --name-only ${U.base}..${U.tip}`]).toString().trim().split("\n"));
  const outDir = new URL(`./ctx/${u}/`, import.meta.url).pathname;
  mkdirSync(outDir, { recursive: true });

  const jobs = [["mono", [...changed, ...Object.keys(U.anchors || {})]]];
  for (const [name, files] of Object.entries(U.slices)) {
    const anchors = Object.entries(U.anchors || {}).filter(([, s]) => s === name).map(([f]) => f);
    jobs.push([`slice:${name}`, [...files, ...anchors]]);
  }
  let suffix = "";
  for (const [job, files] of jobs) {
    const body = files.map((f) => renderFile(U.base, U.tip, f)).join("\n");
    const scopeText = job === "mono"
      ? `You review the WHOLE accumulated branch diff of the unit at its review boundary: ${files.length} changed files, every one rendered below (diff + current content). You have no further repo access.`
      : `You review ONE pending change slice of the unit at its task boundary ("${job.slice(6)}"): ${files.length} files rendered below (diff + current content). You have no further repo access; the other slices of the unit are being reviewed by identical passes.`;
    const prompt = promptPreamble(U.unit, U.summary, scopeText) + "\n" + body;
    const out = path.join(outDir, job.replace(":", "__") + ".txt");
    writeFileSync(out, prompt);
    suffix += `${u} ${job} ${files.length} files ${prompt.length} bytes\n`;
  }
  process.stdout.write(suffix);
}
