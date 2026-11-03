#!/usr/bin/env node
/**
 * release.mjs — the deterministic release pipeline (feature 40, issue #180).
 *
 * Consumes the accumulated `.changeset/*.md` intent files (changesets FILE
 * FORMAT, not the tool — see scripts/lint-changeset.mjs) and computes one
 * release plan:
 *
 *   stable  — the unified version train: ALL packages carry the train version
 *             (SPEC AC-03 / D-40-2), companion CHANGELOG rows are written, and
 *             the `vX.Y.Z` git tag + `stable` branch push are planned at the
 *             release commit (#156: downstream tools pin a stable ref). The
 *             npm dist-tag stable publishes under stays `latest` — npm's
 *             vocabulary, not a channel of this pipeline.
 *   canary  — a prerelease of the NEXT train: the base is the version the
 *             stable plan computes from the same changesets (last stable + the
 *             highest bump), never below the base of a canary already cut, so
 *             `@canary` never hands a consumer a tree older than `latest`.
 *             Shape: `<base>-canary.<yyyymmdd>.<n>`
 *             (Bun-style, D-40-3), deterministic at the same state (AC-12);
 *             only packages declared in the changesets are listed (AC-08
 *             package filter); never moves `latest` (PE-003) and never
 *             consumes the changesets.
 *
 * Promotion: the stable suggestion is max(changeset-derived version, the
 * base of the highest canary already cut). Once a canary named the next
 * train (e.g. 5.0.0-canary.*), the stable cut lands on that base — a pure
 * promotion when no changesets are pending, the canary plus the newly
 * accumulated changes otherwise — and stable, `latest` and `canary` all
 * point at the same version until the next cut.
 *
 * The channel set is CLOSED (owner decision, post-#180 follow-up): stable +
 * canary, nothing else. The old manual promotion channels (alpha/beta/rc)
 * were removed, and the former `latest` channel name is retired — `--channel
 * latest` fails with a pointer to `stable`.
 *   --version OVERRIDE — force the version (marketing override, D-40-4): the
 *             stable train version, or the canary base (`X.Y.Z` → the
 *             `X.Y.Z-canary.<date>.<n>` prerelease). The stable release body
 *             is marked "Version forced by operator: X.Y.Z" (AC-10) and the
 *             version must not collide with an existing tag.
 *   --base X.Y.Z — pin the base literally (no changeset bump). The tests and
 *             an operator reconstructing a past cut use it; normal cuts omit
 *             it and let the plan compute the next train.
 *
 * Modes: `plan` (default, read-only — `--dry-run` is an accepted alias),
 * `apply` (writes package.json versions + CHANGELOG companion rows for the
 * stable channel, stamps every skill's SKILL.md frontmatter with the
 * train version (D-40-14), then deletes the consumed `.changeset/*.md` files
 * so the next cut carries only new intent), `publish-plan` (read-only TSV for
 * the channel publish job) and `publish-stage` (the same TSV plus the temp
 * channel versions and pins written for publishing — restored by the job;
 * never committed). git/npm/gh
 * commands are always PRINTED, never executed — an operator or workflow runs
 * them, with changeset bodies handed over as a `--notes-file` FILE: bodies
 * are third-party data, never interpolated into a shell command.
 * GitHub Release notes use `--generate-notes` so merged PR authors are
 * credited (AC-15, PE-004).
 *
 * Dependency-free (node: builtins only — the node-compat rule, AC-01).
 *
 * Usage:
 *   node scripts/release.mjs [plan|apply] [--channel stable|canary]
 *        [--version X.Y.Z] [--base X.Y.Z] [--date YYYY-MM-DD] [--summary "..."]
 *        [--root DIR]
 *   node scripts/release.mjs publish-plan|publish-stage --channel canary --date YYYY-MM-DD
 *
 * Exit codes: 0 = plan produced / applied, 1 = failure, 2 = usage error.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseChangeset } from "./lint-changeset.mjs";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// The channel set is closed: the stable train and canary. `latest` is npm's
// dist-tag for the stable train, never a channel name here.
const CHANNELS = ["stable", "canary"];
const LEVELS = ["patch", "minor", "major"];

function usage() {
  return [
    "usage: bun scripts/release.mjs [plan|apply] [--channel stable|canary]",
    "                     [--version X.Y.Z] [--base X.Y.Z] [--date YYYY-MM-DD]",
    "                     [--summary \"...\"] [--root DIR]",
    "       node scripts/release.mjs publish-plan|publish-stage --channel canary --date YYYY-MM-DD",
    "",
    "Deterministic release pipeline for the unified version train (issue #180).",
    "`plan` (default) is read-only; `apply` writes package versions + CHANGELOG",
    "companion rows for the stable channel and consumes the applied changesets.",
    "`publish-stage` writes the temp canary versions + pins for the publish job",
    "(restored after publishing, never committed).",
    "--version forces the stable train version, or the canary base; --base pins",
    "the base literally. The stable suggestion promotes the highest canary base",
    "when it sits above the changeset bump. git/npm/gh commands are printed,",
    "never executed.",
  ].join("\n");
}

function parseArgs(argv) {
  const args = { mode: "plan", channel: "stable", version: null, base: null, date: null, summary: null, root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "plan" || a === "apply" || a === "release-notes" || a === "publish-plan" || a === "publish-stage") args.mode = a;
    else if (a === "--channel") args.channel = argv[++i];
    else if (a === "--version") args.version = argv[++i];
    else if (a === "--base") args.base = argv[++i];
    else if (a === "--date") args.date = argv[++i];
    else if (a === "--summary") args.summary = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--root") args.root = path.resolve(argv[++i]);
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

/**
 * A changeset body (or an operator --summary) is third-party data that lands
 * inside a markdown table cell — a raw pipe would break out of the cell and
 * shift every column after it. Markdown-escape it; never trust it as markup.
 */
function escapeCell(text) {
  return String(text).replaceAll("|", "\\|");
}

// --- semver helpers ---------------------------------------------------------

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function bumpVersion(version, level) {
  const m = SEMVER_RE.exec(version);
  if (!m) fail(`base must be a stable X.Y.Z version, got: ${version}`);
  let [major, minor, patch] = m.slice(1).map(Number);
  if (level === "major") { major += 1; minor = 0; patch = 0; }
  else if (level === "minor") { minor += 1; patch = 0; }
  else patch += 1;
  return `${major}.${minor}.${patch}`;
}

/** Numeric stable-version comparator: > 0 when a is newer than b. */
function compareStable(a, b) {
  const [a1, a2, a3] = a.split(".").map(Number);
  const [b1, b2, b3] = b.split(".").map(Number);
  return a1 - b1 || a2 - b2 || a3 - b3;
}

// --- repo state -------------------------------------------------------------

function git(root, args) {
  const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : null;
}

function isGitRepo(root) {
  return git(root, ["rev-parse", "--is-inside-work-tree"]) === "true";
}

function stableTags(root) {
  const out = git(root, ["tag", "-l", "v*"]) ?? "";
  return out.split("\n").filter((t) => SEMVER_RE.test(t.slice(1)));
}

function channelTagCounter(root, base, stamp, channel) {
  const out = git(root, ["tag", "-l", `v${base}-${channel}.${stamp}.*`]) ?? "";
  const counters = out
    .split("\n")
    .filter(Boolean)
    .map((t) => Number(t.split(".").pop()))
    .filter(Number.isFinite);
  return counters.length > 0 ? Math.max(...counters) : 0;
}

/**
 * Skills carry the train version (D-40-14): every `skills/<name>/SKILL.md`
 * frontmatter is stamped with it at apply time — by code, from the
 * accumulated changesets, never by a per-skill prose bump. A skill without
 * a `version:` line gains one right after the opening fence. Returns the
 * number of files stamped.
 */
function stampSkillVersions(root, version) {
  const dir = path.join(root, "skills");
  if (!fs.existsSync(dir)) return 0;
  let stamped = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillPath = path.join(dir, entry.name, "SKILL.md");
    if (!fs.existsSync(skillPath)) continue;
    const content = fs.readFileSync(skillPath, "utf8");
    const updated = /^version: \d+\.\d+\.\d+$/m.test(content)
      ? content.replace(/^version: \d+\.\d+\.\d+$/m, `version: ${version}`)
      : content.replace(/^---\n/, `---\nversion: ${version}\n`);
    if (updated !== content) {
      fs.writeFileSync(skillPath, updated);
      stamped += 1;
    }
  }
  return stamped;
}

/** Highest stable v-tag, or null when the repo has none / is not a repo. */
function lastStableTag(root) {
  const tags = stableTags(root);
  if (tags.length === 0) return null;
  tags.sort((a, b) => compareStable(b, a));
  return tags[0].slice(1);
}

/**
 * The highest canary BASE recorded in the channel tags (v<X.Y.Z>-canary.*),
 * or null. A canary cut never tags a stable version and never consumes the
 * changesets, so these tags are the only durable record that the next train
 * was already named — the stable suggestion must never land below it, and a
 * later canary stays on that base (a prerelease of an older train would sort
 * BELOW what `@canary` already handed out).
 */
function lastCanaryBase(root) {
  const out = git(root, ["tag", "-l", "v*-canary.*"]) ?? "";
  const bases = out
    .split("\n")
    .map((t) => /^v(\d+\.\d+\.\d+)-canary\./.exec(t)?.[1])
    .filter(Boolean);
  return bases.length > 0 ? bases.sort(compareStable).at(-1) : null;
}

function readPackages(root) {
  const dir = path.join(root, "packages");
  if (!fs.existsSync(dir)) fail(`no packages/ directory under ${root}`);
  const packages = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(dir, entry.name, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    packages.push({ name: json.name, dirName: entry.name, version: json.version, path: pkgPath });
  }
  return packages;
}

function readChangesets(root) {
  const dir = path.join(root, ".changeset");
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort();
  const parsed = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), "utf8");
    const result = parseChangeset(content);
    if (!result.ok) fail(`malformed changeset ${file}: ${result.error}`);
    parsed.push({ file, ...result });
  }
  return parsed;
}

function highestLevel(changesets) {
  const seen = new Set(changesets.flatMap((c) => c.entries.map((e) => e.level)));
  for (const level of [...LEVELS].reverse()) if (seen.has(level)) return level;
  return null;
}

/**
 * The version this cut ships, resolved once for every mode that needs it: the
 * plan prints it, a release-notes render names it, apply writes it. Same
 * inputs (tree + args + date) always give the same answer, so a canary body
 * rendered before the cut names the exact tag that cut will push.
 */
function resolveReleasePlan({ root, args, packages, changesets }) {
  const forced = args.version !== null;
  const gitRepo = isGitRepo(root);
  const canaryFloor = gitRepo ? lastCanaryBase(root) : null;

  // Resolve the base: the last stable v-tag, else the highest package version
  // (the first release — deterministic and printed, never guessed in silence).
  // A forced latest release needs no base to compute from — the operator named
  // the exact version (D-40-4); the base is then display-only.
  let base = args.base ?? lastStableTag(root);
  let baseNote = "";
  // The train never cuts below what is already published: a stale v-tag (or
  // its absence) must not downgrade the train below a package version npm
  // would refuse to walk back.
  const pkgVersions = packages.map((p) => p.version).filter((v) => SEMVER_RE.test(v));
  const newer = (a, b) => compareStable(b, a);
  const highestPkg = [...pkgVersions].sort(newer)[0];
  if (!args.base && highestPkg && (!base || newer(base, highestPkg) > 0)) {
    base = highestPkg;
    baseNote = baseNote || (stableTags(root).length === 0
      ? " (highest package version — no stable v-tag)"
      : " (highest package version — above the stale v-tag)" );
  } else if (!base) {
    if (pkgVersions.length > 0) {
      base = highestPkg;
      baseNote = " (highest package version — no stable v-tag)";
    }
  }
  if (!base && forced && args.channel === "stable") base = args.version;
  if (!base) fail("no --base given and neither a stable v* tag nor a package version provides one");
  if (!SEMVER_RE.test(base)) fail(`base must be a stable X.Y.Z version, got: ${base}`);

  let version;
  const level = highestLevel(changesets);
  // A canary is a prerelease of the NEXT train, not of the last stable: a
  // prerelease built on the published stable sorts BELOW it, so `@canary`
  // would hand a consumer an older tree than `latest`. The default base is the
  // next train this plan computes — the changeset bump, raised to the base of
  // any canary already cut (the operator flow: force 5.0.0 as the canary base
  // and every later canary stays 5.0.0-canary.<date>.<n>). `--version` forces
  // that base (D-40-4) and `--base` pins it literally (the AC-07 replay path).
  const derivedStable = level ? bumpVersion(base, level) : null;
  const nextTrain = [derivedStable, canaryFloor].filter(Boolean).sort(compareStable).at(-1) ?? base;
  const canaryBase = args.channel === "canary"
    ? args.version ?? (args.base !== null ? base : nextTrain)
    : null;
  if (args.channel === "stable") {
    if (forced) {
      version = args.version;
    } else {
      // Promotion: a canary base above the changeset-derived version IS the
      // stable suggestion — the canary was already handed out under that
      // version and the stable cut moves stable, `latest` and `canary` onto
      // it, with the pending changesets folded in (or none — a pure
      // promotion). Without a canary the intent is the changesets, as before.
      const promoted = canaryFloor !== null && (derivedStable === null || compareStable(canaryFloor, derivedStable) > 0);
      if (derivedStable === null && !promoted) {
        fail(`no changeset intent in ${path.join(root, ".changeset")}, no canary to promote and no --version override — no release intent`);
      }
      version = promoted ? canaryFloor : derivedStable;
    }
    if (gitRepo && stableTags(root).includes(`v${version}`)) {
      fail(!forced && canaryFloor !== null && version === canaryFloor
        ? `the canary base ${canaryFloor} is already the stable tag v${canaryFloor} — nothing left to promote; add changesets or pass --version`
        : `version ${version} collides with the existing tag v${version} — versions are immutable`);
    }
  }

  return { forced, gitRepo, canaryFloor, base, baseNote, level, version, canaryBase };
}

// --- release notes ---------------------------------------------------------

// The closed set of release-note sections, in the order they render. A change
// lands in exactly one: breaking first (whatever its type), then its own type,
// and everything without a first-class section under `Maintenance`.
const NOTE_GROUPS = [["feat", "Features"], ["fix", "Fixes"], ["perf", "Performance"], ["docs", "Documentation"]];
const NOTE_REST = "Maintenance";
const LEVEL_RANK = { patch: 0, minor: 1, major: 2 };
const CONVENTIONAL_TITLE_RE = /^([a-zA-Z]+)(\([^)]*\))?(!)?:\s+\S/;
const PI_PACKAGE = "npm:@gtrabanco/pi-agentic-workflow";
const SKILLS_ADD = "npx skills add gtrabanco/agentic-workflow";

/** `<base>-canary.<stamp>.<n>` — the channel version, from the tag counter. */
function canaryVersion(root, canaryBase, stamp, channel, gitRepo) {
  const n = gitRepo ? channelTagCounter(root, canaryBase, stamp, channel) + 1 : 1;
  return `${canaryBase}-canary.${stamp}.${n}`;
}

function parseCanaryTag(tag) {
  const m = /^v(\d+\.\d+\.\d+)-canary\.(\d{8})\.(\d+)$/.exec(tag);
  return m ? { base: m[1], stamp: m[2], n: Number(m[3]) } : null;
}

/** Every canary tag reachable from HEAD, newest first — the cut history. */
function canaryTags(root) {
  const out = git(root, ["tag", "-l", "--merged", "HEAD", "v*-canary.*"]) ?? "";
  return out
    .split("\n")
    .filter(Boolean)
    .map((tag) => ({ tag, parsed: parseCanaryTag(tag) }))
    .filter((entry) => entry.parsed)
    .sort((a, b) =>
      compareStable(b.parsed.base, a.parsed.base) ||
      b.parsed.stamp.localeCompare(a.parsed.stamp) ||
      b.parsed.n - a.parsed.n);
}

/**
 * The canary this cut follows: the highest one below it. Nothing consumes
 * changesets until a stable cut, so every prerelease reprints the whole
 * backlog; this is what separates the news from what an earlier prerelease
 * already handed out. Null on the first cut of a train.
 */
function previousCanaryTag(root, version) {
  const current = parseCanaryTag(`v${version}`);
  if (!current) return null;
  const older = canaryTags(root).filter(({ parsed }) => {
    const byBase = compareStable(current.base, parsed.base);
    if (byBase !== 0) return byBase > 0;
    return parsed.stamp < current.stamp || (parsed.stamp === current.stamp && parsed.n < current.n);
  });
  return older[0]?.tag ?? null;
}

/** The `.changeset/` file names that existed at a tag — the carried backlog. */
function changesetsAtTag(root, tag) {
  const out = git(root, ["ls-tree", "-r", "--name-only", tag, "--", ".changeset"]);
  return out === null ? null : new Set(out.split("\n").filter(Boolean).map((file) => path.basename(file)));
}

/**
 * One changeset as a release-note entry: the conventional commit title it
 * declares becomes the `###` heading and its prose follows. A body written in
 * another shape still renders — its first sentence is the heading — because
 * the changeset linter, not the renderer, is what requires the title.
 */
function splitChange(body = []) {
  const [first = "", ...rest] = body;
  const title = String(first).trim();
  const detail = rest.join("\n").trim();
  const conventional = CONVENTIONAL_TITLE_RE.exec(title);
  if (conventional) {
    return {
      head: title,
      type: conventional[1].toLowerCase(),
      breaking: conventional[3] === "!",
      detail,
    };
  }
  const plain = title.replace(/^\*\*/, "").replace(/\*\*/, "").trim();
  const sentence = /^(.+?[.!?])(\s|$)/.exec(plain)?.[1] ?? plain;
  const head = sentence.length > 120 ? `${sentence.slice(0, 117).trimEnd()}…` : sentence;
  return {
    head,
    type: "other",
    breaking: false,
    detail: [plain.slice(sentence.length).trim(), detail].filter(Boolean).join("\n").trim(),
  };
}

/** One row per declared package or skill, at the highest level it declares. */
function bumpRows(changesets) {
  const rows = new Map();
  for (const changeset of changesets) {
    for (const entry of changeset.entries) {
      const known = rows.get(entry.pkg);
      if (!known || LEVEL_RANK[entry.level] > LEVEL_RANK[known.level]) rows.set(entry.pkg, { ...entry });
    }
  }
  return [...rows.values()].sort((a, b) =>
    a.kind === b.kind
      ? a.pkg.toLowerCase().localeCompare(b.pkg.toLowerCase())
      : a.kind === "package" ? -1 : 1);
}

/**
 * How to install what this release contains, and how to move between the
 * channels. `pi install` replaces the recorded source of the same package
 * instead of adding a second entry (the settings match key is `npm:<name>`,
 * tag included or not), so switching channels is one command and no uninstall.
 */
function installBlock({ channel, tag, bumps }) {
  const libraries = bumps.filter((row) =>
    row.kind === "package" && row.pkg.startsWith("@gtrabanco/") && row.pkg !== "@gtrabanco/pi-agentic-workflow");
  const libraryCommand = (distTag) =>
    libraries.length > 0 ? [`npm install ${libraries.map((row) => `${row.pkg}@${distTag}`).join(" ")}`] : [];
  const lines = ["## Install", ""];
  if (channel === "canary") {
    lines.push("This prerelease:", "", "```sh", `pi install ${PI_PACKAGE}@canary`, `${SKILLS_ADD}#v${tag}`, ...libraryCommand("canary"), "```", "");
    lines.push(
      "Back to the stable channel — no uninstall needed: re-running the install with the other",
      "tag replaces the recorded source.",
      "", "```sh", `pi install ${PI_PACKAGE}@latest`, `${SKILLS_ADD}#stable`, ...libraryCommand("latest"), "```", "",
      "The `@canary` npm tag is repointed at the stable version on every stable cut, so",
      "`pi update --extensions` lands there at the next one; a pinned `#v…` skills install stays on",
      "that tree and follows the branch only after the `#stable` re-add.",
    );
  } else {
    lines.push("```sh", `pi install ${PI_PACKAGE}@latest`, `${SKILLS_ADD}#v${tag}`, ...libraryCommand("latest"), "```", "");
    lines.push(
      `\`#v${tag}\` pins this release; \`#stable\` (and the \`latest\` dist-tag) follow the branch.`,
      `To try the next prerelease instead: \`pi install ${PI_PACKAGE}@canary\`.`,
    );
  }
  return lines;
}

/**
 * The release body for `gh release create --notes-file`. The changeset IS the
 * release note, but a body nobody can read is not a note: every change gets a
 * heading, changes group by kind with breaking first, the cut's own bumps are a
 * table, and the reader is told how to install and how to move channels. A
 * canary also separates the changes it adds from the ones it merely reprints.
 */
function renderReleaseNotes({ root, packages, changesets, plan, channel, stamp, gitRepo }) {
  const tag = channel === "canary"
    ? canaryVersion(root, plan.canaryBase, stamp, channel, gitRepo)
    : plan.version;
  const changes = changesets.map((changeset) => {
    const change = { file: changeset.file, ...splitChange(changeset.body) };
    if (changeset.entries.some((entry) => entry.level === "major")) change.breaking = true;
    if (/^BREAKING[ -]CHANGE:/m.test(change.detail)) change.breaking = true;
    return change;
  });
  const previous = channel === "canary" ? previousCanaryTag(root, tag) : null;
  const carriedFiles = previous ? changesetsAtTag(root, previous) : null;
  const isCarried = (change) => Boolean(carriedFiles?.has(change.file));
  const news = changes.filter((change) => !isCarried(change));
  const earlier = changes.filter(isCarried);

  const out = [];
  out.push(
    channel === "canary"
      ? `Prerelease of the next stable train \`${plan.canaryBase}\`: every change below is pending on`
        + " `main`, the stable cut consumes it, and nothing here is published as `latest`."
      : `Stable release of the unified train — every package and skill carries \`${tag}\`.`,
    "",
  );
  if (plan.forced) {
    out.push(channel === "canary"
      ? `> Canary base forced by operator: \`${plan.canaryBase}\`.`
      : `> Version forced by operator: ${tag}.`, "");
  }
  out.push(...installBlock({ channel, tag, bumps: bumpRows(changesets) }), "");

  out.push("## Package bumps", "", "| What | Bump |", "|---|---|");
  for (const row of bumpRows(changesets)) out.push(`| \`${row.pkg}\` | ${row.level} |`);
  out.push("");

  const section = (title, rows) => {
    if (rows.length === 0) return;
    out.push(`## ${title}`, "");
    for (const row of rows) {
      out.push(`### ${row.head}`, "");
      if (row.detail) out.push(row.detail, "");
    }
  };
  section("Breaking changes", news.filter((change) => change.breaking));
  for (const [type, title] of NOTE_GROUPS) {
    section(title, news.filter((change) => !change.breaking && change.type === type));
  }
  section(NOTE_REST, news.filter((change) =>
    !change.breaking && !NOTE_GROUPS.some(([type]) => type === change.type)));

  if (earlier.length > 0) {
    out.push("## Also in this prerelease", "",
      `Already carried by \`${previous}\` — the same tree, nothing new to read here.`, "",
      "<details>", `<summary>${earlier.length} earlier change${earlier.length === 1 ? "" : "s"}</summary>`, "");
    for (const row of earlier) {
      out.push(`### ${row.head}`, "");
      if (row.detail) out.push(row.detail, "");
    }
    out.push("</details>", "");
  }
  return out.join("\n").trimEnd();
}

// --- apply (stable channel) -------------------------------------------------

function setPackageVersion(pkgPath, version) {
  const json = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  json.version = version;
  fs.writeFileSync(pkgPath, JSON.stringify(json, null, 2) + "\n");
}

/**
 * Dependency closure (owner-directed, feature 40 follow-up): every exact
 * pin a package holds on ANOTHER local package must equal the train version —
 * the parity gate's --pins half fails a pin whose target has published a
 * newer version, and npm refuses to walk a version back. Non-exact ranges
 * (peer/^/~) and foreign packages are never touched.
 */
function rewriteLocalPins(root, packages, version) {
  const local = new Map(packages.map((p) => [p.name, p]));
  const rewrites = [];
  for (const pkg of packages) {
    const json = JSON.parse(fs.readFileSync(pkg.path, "utf8"));
    const deps = json.dependencies ?? {};
    let changed = false;
    for (const [dep, spec] of Object.entries(deps)) {
      if (!local.has(dep) || !SEMVER_RE.test(String(spec)) || spec === version) continue;
      deps[dep] = version;
      changed = true;
      console.log(`pin: ${pkg.name} ${dep} ${spec} → ${version}`);
    }
    if (changed) fs.writeFileSync(pkg.path, JSON.stringify(json, null, 2) + "\n");
    rewrites.push({ pkg: pkg.name, changed });
  }
  return rewrites;
}

/**
 * Stage a channel cut in the worktree: every DECLARED package carries the
 * prerelease version, and an exact pin moves only when its target is declared
 * in the same cut — pinning an undeclared sibling would name a version this
 * canary never publishes. The state is temporary: the publish job restores it
 * with `git checkout -- packages/<member>/package.json` after `npm publish`.
 */
function stageChannelVersions(root, packages, declared, version) {
  let staged = 0;
  for (const pkg of packages) {
    if (!declared.has(pkg.name)) continue;
    const json = JSON.parse(fs.readFileSync(pkg.path, "utf8"));
    json.version = version;
    const deps = json.dependencies ?? {};
    for (const [dep, spec] of Object.entries(deps)) {
      if (!declared.has(dep) || !SEMVER_RE.test(String(spec)) || spec === version) continue;
      deps[dep] = version;
    }
    fs.writeFileSync(pkg.path, JSON.stringify(json, null, 2) + "\n");
    staged += 1;
  }
  return staged;
}

function insertCompanionRow(changelogPath, { name, dirName, version, date, level, summary }) {
  const changelog = fs.readFileSync(changelogPath, "utf8");
  const rowStart = companionRowStart(changelog, { name, dirName });
  const row = `| ${version} | ${date} | ${level} | ${escapeCell(summary)} |`;
  fs.writeFileSync(changelogPath, changelog.slice(0, rowStart) + row + "\n" + changelog.slice(rowStart));
}

/**
 * Locate the insert position for a package's companion row — the first line
 * under the package's own table grid (newest row first). Fails closed: a missing
 * anchor or a grid-less table must never be written into (an indexOf(-1)
 * once landed the row at offset 1, silently corrupting the file).
 *
 * The search is bounded to THIS table's block and the grid must be the line
 * directly under the header row. Reading `"|---|"` anywhere forward let a grid
 * belonging to a later table — or the `|---|` inside a row's prose — satisfy the
 * requirement, and the row landed in the wrong table.
 */
function companionRowStart(changelog, { name, dirName }) {
  const anchor = `#### [\`${name}\`](packages/${dirName}/)`;
  const idx = changelog.indexOf(anchor);
  if (idx === -1) {
    fail(`CHANGELOG.md has no "Companion npm packages" table for ${name} (expected ${anchor})`);
  }
  const blockStart = changelog.indexOf("\n", idx) + 1;
  const rest = changelog.slice(blockStart);
  const blockEnd = rest.search(/^#{2,4} /m);
  const scoped = blockEnd === -1 ? rest : rest.slice(0, blockEnd);
  const lines = scoped.split("\n");
  const headerAt = lines.findIndex((line) => /^\|\s*Version\s*\|/.test(line));
  const grid = /^\|(?:\s*:?-{2,}:?\s*\|)+$/;
  if (headerAt === -1 || !grid.test(lines[headerAt + 1] ?? "")) {
    fail(
      `CHANGELOG.md companion table for ${name} has no "|---|" grid directly under its header row — repair the table before applying`,
    );
  }
  const through = lines.slice(0, headerAt + 2).join("\n").length + 1; // past the grid's newline
  return blockStart + through; // newest row first
}

// --- main ---------------------------------------------------------------------

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    console.error(`error: ${e.message}\n${usage()}`);
    process.exit(2);
  }
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }
  if (!CHANNELS.includes(args.channel)) {
    fail(
      args.channel === "latest"
        ? "--channel must be one of stable, canary — `latest` was renamed `stable` (the npm dist-tag for stable remains latest)"
        : `--channel must be one of ${CHANNELS.join(", ")} — the channel set is closed`,
    );
  }
  if ((args.mode === "publish-plan" || args.mode === "publish-stage") && args.channel === "stable") {
    fail(`${args.mode} is for canary — channel stable cuts the train with apply`);
  }
  if (args.dryRun && args.mode !== "plan") {
    fail("--dry-run plans only — drop it to run apply");
  }
  if (args.mode !== "release-notes" && args.version !== null && !SEMVER_RE.test(args.version)) {
    fail(`--version must be a stable X.Y.Z version, got: ${args.version}`);
  }
  const root = args.root;
  const date = args.date ?? new Date().toISOString().slice(0, 10);
  const stamp = date.replaceAll("-", "");
  const packages = readPackages(root);
  const changesets = readChangesets(root);

  const declared = new Set(changesets.flatMap((c) => c.entries.map((e) => e.pkg)));
  const plan = resolveReleasePlan({ root, args, packages, changesets });
  const { forced, gitRepo, canaryFloor, base, baseNote, level, canaryBase } = plan;
  const version = plan.version;

  // release-notes — the rendered body for `gh release create --notes-file`. It
  // resolves the SAME version the plan does, so a canary body names the exact
  // tag its cut publishes. Renders to stdout only; no writes.
  if (args.mode === "release-notes") {
    console.log(renderReleaseNotes({ root, packages, changesets, plan, channel: args.channel, stamp, gitRepo }));
    process.exit(0);
  }

  const human = args.mode !== "publish-plan" && args.mode !== "publish-stage"; // machine modes print TSV only
  if (human) {
    const baseLine = args.channel === "canary"
      ? `${base}${baseNote} → canary base: ${canaryBase}`
      : `${base}${baseNote}`;
    console.log(`release plan — channel: ${args.channel}, mode: ${args.mode}, base: ${baseLine}, date: ${date}`);
  }
  if (human && forced) {
    console.log(args.channel === "stable"
      ? `Version forced by operator: ${version}`
      : `Canary base forced by operator: ${canaryBase}`);
  }
  if (human && args.channel === "stable" && !forced && canaryFloor !== null && version === canaryFloor) {
    console.log(`note: stable version ${version} is the canary base — this cut promotes the canary train (stable, latest and canary all point at it), with the pending changesets folded in`);
  }

  // Per-channel version + commands.
  const notesBodies = changesets.map((c) => c.body.join("\n"));
  if (changesets.length > 0 && human) {
    console.log(`changesets (${changesets.length}):`);
    for (const c of changesets) {
      for (const e of c.entries) {
        console.log(`  ${c.file}: ${e.pkg}=${e.level} — ${c.body[0] ?? ""}`);
      }
    }
  }
  if (args.channel === "stable") {
    // The changelog row summary IS the release note: the accumulated changeset
    // bodies (first line each, file order), unless the operator names one.
    const SKILLS_CONTENT_PACKAGE = "@gtrabanco/pi-agentic-workflow"; // skills ship only inside the pi bundle (D-40-8/D-40-14)

    // Per-package attribution (D-40-16): the scoped key IS the routing key —
    // each package's companion row carries the changesets that declare it, a
    // skill-declaring changeset rides the skills-content package's row (named
    // from the entries, never from prose), and a train-bumped package with
    // nothing declared says so explicitly. --summary overrides every row.
    const summaryFor = (pkgName) => {
      if (args.summary !== null) return args.summary;
      const parts = [];
      for (const c of changesets) {
        const declares = c.entries.some((e) => e.pkg === pkgName);
        const skillRide = pkgName === SKILLS_CONTENT_PACKAGE && c.entries.some((e) => e.kind === "skill");
        if (!declares && !skillRide) continue;
        const skills = c.entries.filter((e) => e.kind === "skill").map((e) => e.pkg);
        parts.push(c.body[0] + (skills.length && pkgName === SKILLS_CONTENT_PACKAGE ? ` (skills: ${skills.join(", ")})` : ""));
      }
      return parts.length > 0 ? parts.join(" · ") : `Unified train bump — no ${pkgName}-specific change declared`;
    };
    console.log(`train version: ${version} (highest bump: ${level ?? "n/a — forced"}); unified train: all packages carry it`);
    for (const pkg of packages) {
      console.log(`${pkg.name}: ${pkg.version} → ${version} (packages/${pkg.dirName}/)`);
    }
    if (args.mode === "apply") {
      // Pre-flight before ANY write: every package's companion table must
      // carry its anchor + grid — a failed apply leaves zero writes.
      const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
      for (const pkg of packages) companionRowStart(changelog, { name: pkg.name, dirName: pkg.dirName });
      for (const pkg of packages) {
        setPackageVersion(pkg.path, version);
        insertCompanionRow(path.join(root, "CHANGELOG.md"), {
          name: pkg.name, dirName: pkg.dirName, version,
          date, level: level ?? "patch", summary: summaryFor(pkg.name),
        });
      }
      rewriteLocalPins(root, packages, version);
      const stamped = stampSkillVersions(root, version);
      console.log(`skills: ${stamped} SKILL.md frontmatter(s) stamped with the train version (D-40-14 — the skill version IS the ecosystem version)`);
      // Consume the intent that was just applied — the changesets-tool
      // behavior this format adopted. Without the deletion the files ride
      // into the next cut, whose bump level and notes then re-apply stale
      // intent. The release commit (git add -A in the cut job) records it.
      for (const c of changesets) fs.unlinkSync(path.join(root, ".changeset", c.file));
      console.log(`consumed: removed ${changesets.length} applied changeset file(s) from .changeset/`);
      console.log("note: exact pins moved with the train — run `bun install` at the repository root to refresh the workspace lock before committing");
      console.log(`applied: ${packages.length} package.json version(s) + ${packages.length} CHANGELOG companion row(s)`);
    }
    const body = [...notesBodies];
    if (forced) body.push(`Version forced by operator: ${version}`);
    const notes = body.join("\n\n");
    // Third-party bodies are DATA: they ride the release-notes FILE, never a
    // shell command. The old inline `--notes "…"` interpolated operator- or
    // contributor-controlled text into a pastable command — pasting the plan
    // could execute a body, and an agent reading the plan could mistake it
    // for an instruction. `release-notes` writes exactly this `notes` value.
    console.log("commands (run at the release commit):");
    console.log("  node scripts/release.mjs release-notes > release-notes.txt");
    console.log(`  git tag v${version}`);
    console.log(`  git push origin v${version}`);
    console.log(`  git push origin HEAD:refs/heads/stable`);
    console.log(`  gh release create v${version} --generate-notes --title "v${version}" --notes-file release-notes.txt`);
  } else {
    // canary — the only prerelease channel: a prerelease of the base that
    // never touches the latest dist-tag and never consumes the changesets.
    const prerelease = canaryVersion(root, canaryBase, stamp, args.channel, gitRepo);
    const listed = packages.filter((p) => declared.has(p.name));
    // Machine-readable plan for the publish workflow's channel job: one TSV
    // line per declared package (name, dir, version, dist-tag).
    if (args.mode === "publish-plan" || args.mode === "publish-stage") {
      if (args.mode === "publish-stage") {
        const staged = stageChannelVersions(root, packages, declared, prerelease);
        console.error(`staged: ${staged} package.json version(s) + their in-cut pins at ${prerelease} — the publish job restores them, nothing is committed`);
      }
      for (const pkg of listed) {
        console.log(`${pkg.name}\t${pkg.dirName}\t${prerelease}\t${args.channel}`);
      }
      process.exit(0);
    }
    console.log(`version: ${prerelease}`);
    for (const pkg of listed) {
      console.log(`${pkg.name}: ${pkg.version} → ${prerelease} (packages/${pkg.dirName}/)`);
    }
    console.log(`packages: ${listed.length} declared in changesets, ${packages.length - listed.length} skipped (not declared)`);
    console.log("commands (the channel publish job's path):");
    console.log(`  node scripts/release.mjs publish-stage --channel ${args.channel} --date ${date}`);
    for (const pkg of listed) {
      console.log(`  cd packages/${pkg.dirName} && npm publish --tag ${args.channel} --ignore-scripts --provenance`);
    }
    console.log("  git checkout -- packages/*/package.json");
    console.log("note: canary never moves the latest dist-tag; --ignore-scripts is required because `publish-stage` writes the temp versions (the gate ran on the committed tree, and `prepublishOnly` would re-run it against the prerelease)");
  }

  if (args.mode === "plan") console.log("plan only — nothing written");
  process.exit(0);
}

main();
