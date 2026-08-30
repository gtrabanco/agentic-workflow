// Dev-only evidence runner. `npm run mutation` reproduces the tally in
// docs/features/27-pi-agentic-workflow/testing.md instead of asserting it.
//
// Every mutant is applied to a **copy** of the package under a temp dir: this
// script never writes to `src/`, because an in-place mutation that fails halfway
// through is indistinguishable from a broken build.
//
// A mutant is killed only when a named test fails. "Build failed" is reported
// separately: a rule the compiler enforces is enforced, but not by a test.

import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const PKG = join(import.meta.dirname, "..");

/**
 * Each entry: the file, the exact text to replace, the replacement, the suite that
 * must fail, and the rule the mutation breaks. Kept as data so a surviving mutant
 * is a line in this table, not a paragraph somewhere else.
 */
export const MUTANTS = [
  { file: "src/routing/dispatch.ts", from: "if (!ctx.isIdle()) {", to: "if (false) {", suite: "dispatch-refusals", rule: "AC12 busy guard" },
  { file: "src/routing/dispatch.ts", from: "if (!loaded.ok) {", to: "if (loaded.ok) {", suite: "dispatch-refusals", rule: "AC12 invalid-config refusal" },
  { file: "src/routing/dispatch.ts", from: "if (pending) {", to: "if (false) {", suite: "dispatch-refusals", rule: "AC12 in-flight refusal" },
  { file: "src/routing/dispatch.ts", from: 'if (loaded.config.onUnavailableRoute !== "inherit") {', to: "if (false) {", suite: "unavailable-stop", rule: "AC9 unavailable route stops" },
  { file: "src/routing/dispatch.ts", from: "session.sendUserMessage(invocation, { expandPromptTemplates: true });", to: "session.sendUserMessage(invocation, {});", suite: "argument-forwarding", rule: "Pi expands the template" },
  { file: "src/routing/dispatch.ts", from: "`/skill:${command.name}`", to: "`/skill:${command.skill}`", suite: "alias-coverage", rule: "AC3 dispatch the name Pi expands (F3)" },
  { file: "src/routing/dispatch.ts", from: "applied.thinking = session.getThinkingLevel() ?? route.thinking;", to: "applied.thinking = route.thinking;", suite: "restore-after-settle", rule: "AC8 record the clamped level (N-3)" },
  { file: "src/routing/dispatch.ts", from: "if (!touched) return;", to: "if (!turn.applied.thinking) return;", suite: "restore-after-settle", rule: "AC8 restore the level a model switch moved (F1)" },
  { file: "src/routing/dispatch.ts", from: "if (applied && modelRefKey(applied) === modelRefKey(model)) return;", to: "", suite: "restore-after-settle", rule: "AC7 own switch is not an operator move" },
  { file: "src/routing/dispatch.ts", from: "await restore(turn, surface(ctx), ctx, `undo:", to: "// undo does not restore:", suite: "restore-after-settle", rule: "N-4 undo restores the session" },
  { file: "src/config/load.ts", from: "if (NOT_THERE.has((error as NodeJS.ErrnoException).code ?? \"\")) return null;", to: "if (true) return null;", suite: "dispatch-refusals", rule: "F7 unreadable is not absent" },
  { file: "src/config/load.ts", from: 'const projectFile = projectTrusted ? loadScope("project", paths.project, readFile, problems) : {};', to: 'const projectFile = loadScope("project", paths.project, readFile, problems);', suite: "untrusted-project-config", rule: "AC13 untrusted project never read" },
  { file: "src/routing/catalogue.ts", from: 'meta.userInvocable = value === "true";', to: 'meta.userInvocable = value !== "false";', suite: "alias-coverage", rule: "F8 a command needs an explicit true" },
  { file: "src/extension/index.ts", from: 'pi.on("model_select", (event) => router.noteModelSelect(event.model));', to: "void router;", suite: "shipped-adapter", rule: "N-1 the adapter wires model_select" },
  { file: "src/extension/index.ts", from: 'pi.on("agent_settled", (_event, ctx) => void router.settle(toInvocationContext(ctx)));', to: "void router;", suite: "shipped-adapter", rule: "N-1 the adapter settles" },
  { file: "src/extension/index.ts", from: 'pi.on("thinking_level_select", (event) => router.noteThinkingLevelSelect(event.level));', to: "void router;", suite: "shipped-adapter", rule: "N-1 the adapter wires thinking_level_select" },
  { file: "src/extension/index.ts", from: "isProjectTrusted: () => ctx.isProjectTrusted(),", to: "isProjectTrusted: () => true,", suite: "shipped-adapter", rule: "N-1 trust comes from Pi" },
  { file: "src/extension/index.ts", from: "    cwd: ctx.cwd,", to: "    cwd: process.cwd(),", suite: "shipped-adapter", rule: "N-1 the project file comes from Pi's cwd" },
  { file: "src/settings/console.ts", from: "...(deps.routing?.inFlight() ? [prompts.undoInFlight] : []),", to: "...(false ? [prompts.undoInFlight] : []),", suite: "settings-console", rule: "N-2 the latch is releasable from the console" },
  { file: "src/settings/console.ts", from: "if (draft.onUnavailableRoute) file.onUnavailableRoute = draft.onUnavailableRoute;", to: 'if (draft.onUnavailableRoute && draft.onUnavailableRoute !== "stop") file.onUnavailableRoute = draft.onUnavailableRoute;', suite: "settings-console", rule: "F4 an explicit stop is saved" },
  { file: "src/settings/console.ts", from: "if (Object.keys(route).length > 0) commands[name] = { ...route };", to: 'if (route.model !== "inherit") commands[name] = { ...route };', suite: "settings-console", rule: "F4 an explicit inherit is saved" },
  // Four of the six rules pass 2 parked as "the suite cannot see them"
  // (known-issues.md). Two were already pinned by tests pass 2 itself added (F12,
  // F13 — mutant killed on the pre-fold HEAD); two were real gaps and are pinned by
  // this fold (F14, F15). All four stay in this table so the claim is re-runnable
  // instead of prose. The remaining two parked rules live in
  // `src/routing/dispatch.ts` / `test/restore-after-settle.test.mjs` and are
  // recorded in `review-findings.md` as blocked, not silently dropped.
  { file: "src/routing/catalogue.ts", from: 'issues.push({ dir: dir.name, message: `command name "${meta.name}" already claimed by ${owner}/` });\n      continue;', to: 'issues.push({ dir: dir.name, message: `command name "${meta.name}" already claimed by ${owner}/` });', suite: "alias-coverage", rule: "F12 a duplicate name is reported, never registered" },
  { file: "src/routing/catalogue.ts", from: '    if (line.trim() === "---") break;', to: "    // no frontmatter boundary", suite: "alias-coverage", rule: "F13 the scanner stops at the closing ---" },
  { file: "src/settings/view.ts", from: "`  when a configured model is unavailable: ${config.onUnavailableRoute}`", to: '"  when a configured model is unavailable: stop"', suite: "settings-console", rule: "F14 the summary follows the effective policy" },
  { file: "src/settings/console.ts", from: "  const file = clean(draft);", to: "  const file = draft;", suite: "settings-console", rule: "F15 only a cleaned draft reaches the disk" },
];

const root = mkdtempSync(join("/tmp", "paw-mutation-"));
const work = join(root, "package");
mkdirSync(work, { recursive: true });
for (const entry of readdirSync(PKG)) {
  if (entry === "node_modules") continue;
  cpSync(join(PKG, entry), join(work, entry), { recursive: true });
}
if (existsSync(join(PKG, "node_modules"))) cpSync(join(PKG, "node_modules"), join(work, "node_modules"), { recursive: true });

const run = (command, args) => spawnSync(command, args, { cwd: work, encoding: "utf8" });
const pristine = new Map(MUTANTS.map((mutant) => [mutant.file, readFileSync(join(work, mutant.file), "utf8")]));

const results = [];
for (const mutant of MUTANTS) {
  const original = pristine.get(mutant.file);
  if (!original.includes(mutant.from)) {
    results.push({ ...mutant, status: "stale-needle" });
    continue;
  }
  writeFileSync(join(work, mutant.file), original.replace(mutant.from, mutant.to));
  const built = run("npx", ["tsc", "-p", "tsconfig.json"]);
  if (built.status !== 0) {
    results.push({ ...mutant, status: "compile-error", detail: (built.stdout + built.stderr).split("\n").find((line) => line.includes("error TS")) ?? "build failed" });
  } else {
    const tested = run("node", ["--test", `test/${mutant.suite}.test.mjs`]);
    results.push({ ...mutant, status: tested.status === 0 ? "SURVIVED" : "killed" });
  }
  writeFileSync(join(work, mutant.file), original);
}

rmSync(root, { recursive: true, force: true });

const tally = (status) => results.filter((entry) => entry.status === status).length;
for (const entry of results) {
  console.log(`${entry.status.padEnd(14)} ${entry.rule}${entry.detail ? ` — ${entry.detail.trim()}` : ""}`);
}
console.log(`\n${results.length} mutants · ${tally("killed")} killed · ${tally("SURVIVED")} survived · ${tally("compile-error")} compile-enforced · ${tally("stale-needle")} stale`);
const bad = results.filter((entry) => entry.status === "SURVIVED" || entry.status === "stale-needle");
process.exit(bad.length === 0 ? 0 : 1);
