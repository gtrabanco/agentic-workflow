#!/usr/bin/env node
/**
 * docs-generated-merge.mjs — the merge driver `.gitattributes` names for the
 * generated projection, plus the one command that arms it in a checkout (fix
 * #420).
 *
 * Why a driver: `docs/generated/**` is a pure function of the tree
 * (`scripts/docs-generate.mjs`, feature 396), and since fix #507 the roadmap
 * index's tables are too, so a line-level merge of two regenerations is never a
 * real conflict — each side is *some* tree's
 * rendering, and neither is the merged tree's.
 *
 * The **100 % surface is gone at the source**: the pages no longer carry a count
 * that every regeneration rewrites (unit 420 S7), which is what made two
 * concurrent regenerations collide every single time (4 hunks in each measured
 * merge, #418 and #419). What remains is the residual case — two branches that
 * insert a row at the same position in the same sorted table — and this driver
 * is the net for it. It is therefore optional: `docs/generated/` merges cleanly
 * on an unarmed clone, and the gate's `docs-generated-projection` step keeps a
 * mechanically-resolved projection from lying either way.
 *
 * What the driver answers: the incoming side, byte for byte — the same answer
 * `git checkout --theirs` gives for a generated file, said once instead of in
 * every contributor's muscle memory. The branch's own rows come back on the
 * next regeneration, because they are derived from sources that merged on
 * their own — for the roadmap index, the unit folders the merge already carried.
 *
 * Why that cannot lie: the merge is not where the projection's truth is
 * decided. The local gate's `docs-generated-projection` step runs
 * `docs-generate --check` on every push, so a projection that no longer
 * matches its sources refuses before it is published.
 *
 * Fail closed: a path outside the declared projection directory, an unreadable
 * input and a refused install all exit non-zero and leave the conflict in
 * place — a driver that guesses is worse than a marker.
 *
 * Usage
 *   bun scripts/docs-generated-merge.mjs --install [--repo <dir>]
 *   bun scripts/docs-generated-merge.mjs <base> <ours> <theirs> [marker-size] [path]
 *   (node fallback, same argv)
 *
 * `.gitattributes` supplies the second form: git expands `%O %A %B %L %P` into
 * it. The projection directory is never restated here — it is read from the
 * guide's `Docs site` block through `scripts/docs-generate.mjs`, which owns it.
 *
 * exit: 0 the file is resolved; 1 the merge is left conflicted (fail closed);
 * 2 a usage error or a refused install.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { parseDocsSiteBlock, projectionDir } from "./docs-generate.mjs";
import { ROADMAP_DOCUMENT } from "../packages/agentic-workflow/src/index-document.mjs";

const SCRIPT = fileURLToPath(import.meta.url);
const GUIDE = "AGENTS.md";
const REFUSAL = "DOCS GENERATED MERGE REFUSAL —";

/** The driver's key in `.gitattributes` and in the checkout's git config. */
export const DRIVER = "docs-generated";

/** The surfaces the driver answers for: the declared projection plus the roadmap index. */
export function coveredSurfaces(root) {
  return [coveredPrefix(root), ROADMAP_DOCUMENT];
}

const USAGE = [
  "usage: docs-generated-merge.mjs --install [--repo <dir>]",
  "       docs-generated-merge.mjs <base> <ours> <theirs> [marker-size] [path]",
].join("\n");

function refuse(message, code) {
  process.stderr.write(`${REFUSAL} ${message}\n`);
  if (code === 2) process.stderr.write(`${USAGE}\n`);
  process.exit(code);
}

function git(root, args) {
  return spawnSync("git", args, { cwd: root, encoding: "utf8" });
}

/** The projection directory a checkout declares, relative to that root. */
export function coveredPrefix(root) {
  const guide = path.join(root, GUIDE);
  const text = fs.existsSync(guide) ? fs.readFileSync(guide, "utf8") : "";
  return projectionDir(parseDocsSiteBlock(text));
}

/**
 * The driver line git runs. Relative when this script lives inside the
 * checkout it arms, so the checkout stays relocatable; absolute otherwise, the
 * only honest form for arming a tree this script is not part of (a fixture).
 * `bun` first, `node` as the guaranteed fallback — the same rule the gate runs
 * its own children under.
 */
export function driverCommand(root) {
  const relative = path.relative(root, SCRIPT);
  const script = path.isAbsolute(relative) || relative.startsWith("..") ? SCRIPT : relative;
  const run = (runtime) => `${runtime} ${script} %O %A %B %L "%P"`;
  return `if command -v bun >/dev/null 2>&1; then ${run("bun")}; else ${run("node")}; fi`;
}

/** `--install`: write the two config keys, writing only the ones that differ. */
function install(root) {
  if (git(root, ["rev-parse", "--git-dir"]).status !== 0) refuse(`${root} is not a git checkout`, 2);
  const prefix = coveredPrefix(root);
  const wanted = [
    ["name", `the ${prefix} projection (regenerate with scripts/docs-generate.mjs)`],
    ["driver", driverCommand(root)],
  ];
  const lines = [`docs-generated-merge — ${prefix}/** + ${ROADMAP_DOCUMENT}`];
  for (const [key, value] of wanted) {
    const setting = `merge.${DRIVER}.${key}`;
    const current = git(root, ["config", "--local", "--get", setting]);
    const armed = current.status === 0 && current.stdout.trim() === value;
    if (!armed) {
      const written = git(root, ["config", "--local", setting, value]);
      if (written.status !== 0) refuse(`git config ${setting} failed — ${written.stderr.trim()}`, 1);
    }
    lines.push(`${key} — ${armed ? "unchanged" : "written"}: ${value}`);
  }
  lines.push("verdict: PASS");
  process.stdout.write(`${lines.join("\n")}\n`);
  process.exit(0);
}

/**
 * The path git handed this driver, unquoted. `%P` arrives shell-quoted whenever
 * git had to quote it (`'docs/generated/index.md'`), which is the form the
 * merge driver integration actually produces.
 */
function namedPath(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];
  const bare =
    trimmed.length > 1 && (quote === "'" || quote === '"') && trimmed.endsWith(quote)
      ? trimmed.slice(1, -1)
      : trimmed;
  return bare.split(path.sep).join("/").replace(/^\.\//, "");
}

/** The merge-driver form: resolve one conflicted projection path. */
function resolve([base, ours, theirs, marker, relPath]) {
  void base;
  void marker;
  const root = process.cwd();
  const prefix = coveredPrefix(root);
  if (relPath !== undefined) {
    const named = namedPath(relPath);
    const covered = named === ROADMAP_DOCUMENT || named === prefix || named.startsWith(`${prefix}/`);
    if (!covered) {
      refuse(
        `${named} is outside the generated surfaces (${prefix}/**, ${ROADMAP_DOCUMENT}) — this driver never resolves a hand-written file`,
        1,
      );
    }
  }
  let incoming;
  try {
    incoming = fs.readFileSync(theirs);
  } catch (error) {
    refuse(`cannot read the incoming side ${theirs} — ${error.message}`, 1);
  }
  const staging = `${ours}.docs-generated-merge`;
  try {
    fs.writeFileSync(staging, incoming);
    fs.renameSync(staging, ours);
  } catch (error) {
    refuse(`cannot write ${ours} — ${error.message}`, 1);
  }
  process.stderr.write(
    `docs-generated-merge: ${relPath ?? ours} resolved to the incoming projection — run \`bun scripts/docs-generate.mjs\`\n`,
  );
  process.exit(0);
}

function main(argv) {
  if (argv[0] === "--install") {
    let root = process.cwd();
    for (let index = 1; index < argv.length; index += 1) {
      const arg = argv[index];
      if (arg !== "--repo") refuse(`unknown argument ${arg}`, 2);
      const value = argv[index + 1];
      if (value === undefined) refuse("--repo needs a directory", 2);
      root = path.resolve(value);
      index += 1;
    }
    install(root);
    return;
  }
  if (argv.length === 0) refuse("no merge targets — git supplies %O %A %B %L %P, or pass --install", 2);
  if (argv[0].startsWith("-")) refuse(`unknown argument ${argv[0]}`, 2);
  if (argv.length < 3) refuse(`${argv.length} argument(s) — a merge driver needs base, ours and theirs`, 2);
  if (argv.length > 5) refuse(`${argv.length} arguments — at most base, ours, theirs, marker size and path`, 2);
  resolve(argv);
}

// Run only as a program: the sibling suite imports the driver line and the
// covered prefix.
if (process.argv[1] && path.resolve(process.argv[1]) === SCRIPT) {
  main(process.argv.slice(2));
}
