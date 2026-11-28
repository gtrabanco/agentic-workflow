// score.mjs — aggregates the review outputs into per-cell recall tables.
//
// Semantics (fixed 2026-11-28, supersedes the session-tmp first draft):
//  - arm = mono (the single whole-branch call) or slices (union of all slice calls of a run).
//  - a finding "hits" a ground-truth item when its target file matches the GT item's
//    cited files (exact / suffix / prefix, path-normalized: a leading "./" is stripped,
//    a leading dot in `.claude/`-style paths is never stripped).
//  - recall per cell = distinct GT ids whose files were hit at least once in that run;
//    the table reports every run, not only the best.
// Usage: bun score.mjs
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const harnessDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.OUT_DIR ?? path.join(harnessDir, "out");
const gt = JSON.parse(readFileSync(new URL("./gt.json", import.meta.url)));
const models = ["qwen3.6", "gemma4", "glm5.3-flash", "deepseek-v4-flash"];

// Path normalization: strip a leading "./" repeatedly; never strip a bare dot
// (`.claude-plugin/...` keeps its dot), never mangle mid-path segments.
function norm(p) {
  let s = String(p ?? "").trim();
  while (s.startsWith("./")) s = s.slice(2);
  return s.toLowerCase();
}
function fileHit(finding, gtFiles) {
  const f = norm(finding.file);
  return gtFiles.some((g) => {
    const g2 = norm(g);
    return f === g2 || f.endsWith(g2) || g2.startsWith(f);
  });
}
function parts(dirEntryId) {
  const p = dirEntryId.split("__");
  if (p[1] === "mono") return { unit: p[0], model: p[2], arm: "mono", run: Number(p[3].slice(1)) };
  return { unit: p[0], model: p[3], arm: "slices", run: Number(p[4].slice(1)) };
}
const files = readdirSync(outDir).filter((f) => f.startsWith("out-") && f.endsWith(".json"));
const rowsByCell = {};
for (const f of files) {
  let rec;
  try { rec = JSON.parse(readFileSync(path.join(outDir, f))); } catch { continue; }
  const { unit, model, arm, run } = parts(rec.id);
  const key = `${unit}|${model}|${arm}|${run}`;
  (rowsByCell[key] ??= []).push(rec);
}
const ceil = Object.fromEntries(["U1", "U2"].map((u) => [u, Object.keys(gt[u]).length]));
console.log(`Effective ground-truth ceilings: U1=${ceil.U1} ids, U2=${ceil.U2} ids (further minus the delta-reader classes noted in VERIFICATION.md)`);
console.log("| unit | model | arm | matched ids (r1/r2) | findings/run median | tokens per run (r1/r2) |");
console.log("|---|---|---|---|---|---|");
for (const unit of ["U1", "U2"]) {
  for (const model of models) {
    for (const arm of ["mono", "slices"]) {
      const per = [];
      for (const run of [1, 2]) {
        const recs = rowsByCell[`${unit}|${model}|${arm}|${run}`] ?? [];
        let findings = [];
        if (arm === "mono") {
          if (recs[0]?.parsed) findings = recs[0].parsed;
        } else {
          for (const r of recs) findings = findings.concat(r.parsed ?? []);
        }
        const matched = gt[unit].filter((g) => findings.some((x) => fileHit(x, g.files))).map((g) => g.id);
        const tokens = recs.reduce((a, r) => a + (r.usage?.total_tokens ?? 0), 0);
        per.push({ findings: findings.length, matched, tokens });
      }
      if (per.every((p) => p.tokens === 0 && p.findings === 0)) continue;
      const mid = per.map((p) => p.matched.length).join(", ");
      const med = per.reduce((a, p) => a + p.findings, 0) / per.length;
      const toks = per.map((p) => p.tokens.toLocaleString("en-US")).join(" / ");
      console.log(`| ${unit} | ${model} | ${arm} | ${mid} | ${med.toFixed(0)} | ${toks} |`);
    }
  }
}
console.log("\nDistinct best-of-run matched ids are listed per run in results/arm-summary.md");
