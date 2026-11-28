// Runner: post every (unit, job, model, run) review call against the NaN chat API.
// Usage: bun run-reviews.mjs [--only <unit>:<job>] [--probe]
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const ctxDir = new URL("./ctx/", import.meta.url).pathname;
const outDir = new URL("./out/", import.meta.url).pathname;
mkdirSync(outDir, { recursive: true });

const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const probe = process.argv.includes("--probe");

const MODELS = ["qwen3.6", "gemma4", "glm5.3-flash", "deepseek-v4-flash"];
const STRONG = new Set(["glm5.3-flash", "deepseek-v4-flash"]);
const RUNS = probe ? [7] : [1, 2];
const MODEL_MAXTOK = { "qwen3.6": 16000, "gemma4": 8000, "glm5.3-flash": 12000, "deepseek-v4-flash": 12000 };
const MAXTOK = (j) => probe ? 16 : MODEL_MAXTOK[j.model] ?? 8000;
const KEY = process.env.NAN_API_KEY;

const jobs = [];
for (const u of readdirSync(ctxDir, { withFileTypes: true })) {
  if (!u.isDirectory()) continue;
  const base = u.name;
  for (const f of readdirSync(path.join(ctxDir, base))) {
    if (!f.endsWith(".txt")) continue;
    const job = f.slice(0, -4);
    for (const m of MODELS) {
      if (STRONG.has(m) && base !== "U2") continue;
      for (const r of RUNS) {
      const id = `${base}__${jj(job)}__${m}__r${r}`;
      jobs.push({ id, unit: base, job, model: m, run: r, file: path.join(ctxDir, base, f) });
      }
    }
  }
}
function jj(s) { return s.replace(/:/g, "__"); }

const todo = jobs.filter((j) => !only || `${j.id}`.toLowerCase().includes(only.toLowerCase())).filter((j) => !existsSync(path.join(outDir, j.id + ".json")));
console.log(`jobs: ${todo.length} of ${jobs.length} (skipping existing)`);

const concurrency = parseInt(process.env.C || "3", 10);
let done = 0;
async function one(j) {
  const t0 = Date.now();
  const body = readFileSync(j.file, "utf8");
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.nan.builders/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: j.model,
          messages: [{ role: "user", content: body }],
          max_tokens: MAXTOK(j),
          temperature: 0, enable_thinking: false,
          seed: j.run * 1000 + 7,
        }),
        signal: AbortSignal.timeout(600_000),
      });
      const txt = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${txt.slice(0, 300)}`);
      const data = JSON.parse(txt);
      const msg = data.choices?.[0]?.message ?? {};
      const raw = (msg.content ?? "").trim() || JSON.stringify({ _reasonOnly: (msg.reasoning_content ?? "").slice(-400) });
      let parsed = null, perr = null;
      try { parsed = parseJsonArray(raw); } catch (e) { perr = String(e).slice(0, 200); }
      const rec = { id: j.id, unit: j.unit, job: j.job, model: j.model, run: j.run, ms: Date.now() - t0, usage: data.usage, finish: data.choices?.[0]?.finish_reason, perr, parsed, raw };
      writeFileSync(path.join(outDir, j.id + ".json"), JSON.stringify(rec, null, 1));
      done++;
      console.log(`[${done}/${todo.length}] ${j.id} ok findings=${parsed ? parsed.length : "ERR"} tt=${Math.round((Date.now() - t0) / 1000)}s`);
      return;
    } catch (e) {
      if (attempt === 3) {
        writeFileSync(path.join(outDir, j.id + ".json"), JSON.stringify({ id: j.id, unit: j.unit, job: j.job, model: j.model, run: j.run, error: String(e).slice(0, 500) }));
        done++;
        console.log(`[${done}/${todo.length}] ${j.id} FAILED ${String(e).slice(0, 200)}`);
      } else {
        await new Promise((r) => setTimeout(r, 4000 * attempt));
      }
    }
  }
}

function parseJsonArray(raw) {
  let s = raw;
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) s = fence[1];
  s = s.trim();
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("no JSON array found");
  return JSON.parse(s.slice(start, end + 1));
}

const queue = [...todo];
await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
  while (queue.length) {
    const j = queue.shift();
    await one(j);
  }
}));
console.log("ALL DONE");
