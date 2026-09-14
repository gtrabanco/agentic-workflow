#!/usr/bin/env node
/**
 * phase-lint.mjs — deterministic checker for the eight phase-lint rules.
 *
 * The rules, the fixed PASS/BLOCKED result, and the normalized phase
 * fingerprint are owned by `skills/phase-contract/SKILL.md`; this script only
 * mechanizes checking them (it never carries a second copy of rule semantics).
 *
 * Usage
 *   bun scripts/phase-lint.mjs <plan.md>      (node fallback, same argv)
 *
 * stdout: one fixed, byte-stable text block — a `Phase-lint:` line per phase,
 * one `<rule-id>: <finding>` line per failing rule, a final verdict line, and a
 * `fingerprint: <sha256>` line over the newline-joined per-phase fingerprints.
 * exit: 0 only when every phase is `PASS (8/8)` and the verdict is `PASS`.
 *
 * Fail-closed reason codes: `missing-plan` (no argument, or a path that does
 * not exist), `no-phases` (readable file with zero phase headings),
 * `unparseable` (unreadable file, missing/out-of-enum `Layer:` line, or a task
 * target the frozen prefix table cannot map), `lint-blocked` (a rule failure).
 *
 * Read-only: never writes, never calls the network, no external dependencies.
 * Passing more than one path is a usage error (stderr + exit 1), never a
 * silent drop of the extra arguments (F43).
 *
 * Deterministic approximations (the script's mechanical realization of the
 * rules the unit's SPEC §Design freezes, pinned by
 * `scripts/phase-lint.test.mjs`): the `→` chain test counts arrows, so one arrow
 * is an outcome annotation and two or more are a chain; "enumerated cases" means
 * numbered/lettered markers or ordinal words, not a bare comma list; the box-2
 * target is the first path-like token outside a backticked command span,
 * recognized by a single-pass segment check (runtime-stable across node and
 * bun) whose edge trim is two bounded scans (a `$`-anchored trim class is
 * quadratic on a punctuation-run token — F64); a URL or a glob carries a
 * scheme separator or a wildcard and is a reference, never a path-like
 * target; every other path-like target the grammar cannot tokenize fails
 * closed as ambiguous, never silently targetless (the emphasis-wrapped shape
 * F56, the `~`-stripped shape F63, and the whole untokenizable class F69);
 * and every JavaScript line terminator is normalized before the grammar sees
 * the text, so no rendered-as-invisible separator can elide a phase (F44).
 */

import fs from "node:fs";
import process from "node:process";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const LAYERS = ["schema/db", "domain", "api", "ui", "config/infra", "docs", "hardening", "close-out"];
const HARDENING_LAYERS = new Set(["hardening", "close-out"]);
const HARDENING_TITLE = "Hardening & PR";
const RUNTIME_WORDS = new Set(["bun", "node", "npm", "npx", "git", "grep", "diff", "test", "gh"]);
const EXTENSIONS = [".md", ".mjs", ".js", ".json", ".yml", ".yaml", ".ts"];
const PATH_SEGMENT = /^[A-Za-z0-9_.-]+$/;
const HAS_LETTER = /[A-Za-z]/;
const EMPHASIS_EDGE = /^[*_~]+|[*_~]+$/g;
const PHASE_HEADING = /^ {0,3}#{2,4}\s+P(\d+)\s*[—-]\s*(\S.*)$/;
const FENCE_OPEN = /^(`{3,}|~{3,})/;
const FENCE_CLOSE = /^(`{3,}|~{3,})$/;
const INLINE_COMMAND = /`([^`]*)`/g;
const CREATION_VERB = /\b(?:create|creates|created|write|writes|written|scaffold|scaffolds|add a new file|new file)\b/i;
const ENUMERATED = /\((?:\d+|[a-z]|[ivxlcdm]{2,4})\)|\b(?:first|second|third|fourth|fifth)\b|(?<!\S)\d+[.)](?!\S)/gi;

/** Strip backticked spans that are quoted commands (a runtime word leads them). */
function stripQuotedCommands(text) {
  return text.replace(INLINE_COMMAND, (whole, inner) => {
    const head = inner.trim().split(/\s+/)[0].replace(/:$/, "");
    return RUNTIME_WORDS.has(head) ? " " : whole;
  });
}

/**
 * A path-like token the grammar can judge: one or more `/`-separated segments
 * of `[A-Za-z0-9_.-]`, with an optional trailing slash. A single-pass split,
 * never an anchored nested-quantifier regex: the equivalent
 * `^[C]+(?:\/[C]+)*\/?$` answers differently per engine (V8 matches, JSC
 * reports no-match past ~3 MB), which flipped the verdict between node and bun
 * and bypassed the box-2 fail-closed gate on the first-class runtime (F57).
 */
function isPathToken(token) {
  const body = token.endsWith("/") ? token.slice(0, -1) : token;
  if (body.length === 0) return false;
  return body.split("/").every((segment) => PATH_SEGMENT.test(segment));
}

/**
 * The frozen target test: a valid token, with a letter, that is a file path
 * (contains `/` or ends in a known extension). A bare numeric ratio (`0/1`, a
 * date) is an assertion, not a target file.
 */
function isTargetToken(token) {
  return (
    isPathToken(token) &&
    HAS_LETTER.test(token) &&
    (token.includes("/") || EXTENSIONS.some((extension) => token.endsWith(extension)))
  );
}

/**
 * A token that reads as a path (used only to pick candidates): a `/` or a
 * known extension once markdown emphasis edges are removed. A link/URL (it
 * carries a scheme separator) and a glob (its core carries a wildcard) are
 * references, never the task's target file, so neither is a path-like
 * candidate — `*docs/x.md*` keeps its wildcards at the edges only, which
 * `EMPHASIS_EDGE` removes before this test. Discriminating here is what lets
 * the box-2 fail-closed branch cover the whole untokenizable class (F69):
 * every candidate that survives this test is a genuine target the grammar
 * must either map or fail closed on, and ordinary prose with no target stays
 * exempt because it never reaches the candidate set.
 */
function looksPathLike(token) {
  const core = token.replace(EMPHASIS_EDGE, "");
  if (core.length === 0) return false;
  if (core.includes("://") || /[*?]/.test(core)) return false;
  return core.includes("/") || EXTENSIONS.some((extension) => core.endsWith(extension));
}

/**
 * The valid target token embedded in an untokenizable candidate, or `null`.
 * A candidate that only reads as a path because a markdown/punctuation edge or
 * an interior residue was removed still names a real target —
 * `docs/other.md—today`, `docs/other.md…`, `“docs/other.md”`, `*docs/x.md*`,
 * `~/notes/x.md` — so a `!valid` candidate carrying one must fail closed like
 * any other unmappable target (F56/F63/F69). A candidate with no embedded
 * target is prose that merely contains a `/` (an inline `--body`/heredoc note,
 * a URL, a glob) and stays exempt.
 */
function embeddedTarget(token) {
  for (const run of token.split(/[^A-Za-z0-9_./-]+/)) {
    const candidate = run.replace(/^\/+|\/+$/g, "");
    if (candidate === "") continue;
    // A repeated separator (`scripts//evil.mjs`) still names a real POSIX
    // target — interchangeable with `scripts/evil.mjs` — but the frozen token
    // grammar accepts only one-or-more `/`-separated segments, so the token is
    // untokenizable and must fail closed instead of dropping to targetless
    // prose and skipping the layer check (F74; the F69 class one segment
    // short of the class boundary).
    const collapsed = candidate.replace(/\/{2,}/g, "/");
    if (isTargetToken(collapsed)) return collapsed;
  }
  return null;
}

/**
 * Strip the grammar's edge characters — whitespace, backticks, sentence
 * punctuation and the `·`/dash line separators — from a declared `Layer:`
 * value in one bounded pass over each end. Used so the value can be matched
 * against the closed layer enum exactly, instead of being narrowed to its
 * first whitespace token (F72).
 */
function stripDeclaredEdges(value) {
  const LEAD = "` \t";
  const TRAIL = "` \t.,;:·—–";
  let start = 0;
  let end = value.length;
  while (start < end && LEAD.includes(value[start])) start += 1;
  while (end > start && TRAIL.includes(value[end - 1])) end -= 1;
  return value.slice(start, end);
}

/**
 * Trim markdown/punctuation edges in one bounded pass over each end. The
 * trailing edge used to be a `$`-anchored `+`-quantified class, which retries
 * at every start position and is therefore O(L²) on a punctuation-run token
 * (`.....name`): a ~244 KB crafted plan — linter input that may originate in a
 * third-party forge issue — exceeded 60 s per run and hung the pre-flight gate
 * (F64). Two bounded scans are O(L) and answer identically on node and bun.
 */
const LEAD_EDGE = "`\"'({[";
const TRAIL_EDGE = "`\"')]}.,;:!?";
function trimTokenEdges(raw) {
  let start = 0;
  while (start < raw.length && LEAD_EDGE.includes(raw[start])) start += 1;
  let end = raw.length;
  while (end > start && TRAIL_EDGE.includes(raw[end - 1])) end -= 1;
  return raw.slice(start, end);
}

/** Whitespace-split path-like candidates in document order, with the grammar's verdict. */
function candidatePathTokens(text) {
  const candidates = [];
  for (const raw of stripQuotedCommands(text).split(/\s+/)) {
    const token = trimTokenEdges(raw);
    if (!looksPathLike(token)) continue;
    candidates.push({ token, valid: isPathToken(token) });
  }
  return candidates;
}

/** Every judgeable path-like token in the text, outside quoted command spans. */
function pathTokens(text) {
  return candidatePathTokens(text)
    .filter(({ token }) => isTargetToken(token))
    .map(({ token }) => token);
}

/** A test file: basename contains `.test.` (frozen mechanical definition). */
function isTestFile(target) {
  return target.split("/").pop().includes(".test.");
}

/**
 * The frozen target-file → layer prefix table (SPEC §Design, box-2), plus the
 * owner-sanctioned test-only shape: in a phase declared `hardening`, a test
 * file maps to `hardening` (the F7 fold — a test-only phase is not blocked on
 * its own tests). `close-out` is deliberately **not** given the mapping (the
 * owner rule names `hardening` only), so it keeps the prefix table.
 */
function layerForTarget(target, phaseLayer) {
  if (phaseLayer === "hardening" && isTestFile(target)) return "hardening";
  if (target.startsWith("skills/") || target.startsWith("docs/") || target.startsWith("template/")) return "docs";
  if (target.startsWith("scripts/") || target.startsWith("packages/") || target.startsWith(".github/") || target.startsWith(".agentic-workflow/")) return "config/infra";
  if (target.endsWith(".md")) return "docs";
  return null;
}

/** Title-deliverable: lowercased, kebab-cased, `&` a separator, articles dropped. */
function titleDeliverable(title) {
  return title
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/\b(?:the|a|an)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The fence a line opens, or null: three-or-more backticks (optional info string) or tildes. */
function openFence(trimmed) {
  const match = FENCE_OPEN.exec(trimmed);
  return match ? { char: match[1][0], length: match[1].length } : null;
}

/** A closing fence: only the same character repeated at equal-or-greater length. */
function closesFence(trimmed, fence) {
  const match = FENCE_CLOSE.exec(trimmed);
  return Boolean(match && match[1][0] === fence.char && match[1].length >= fence.length);
}

/**
 * Normalize every JavaScript line terminator before parsing (F44), plus the
 * UTF-8 BOM (F73). A lone CR, or a U+2028/U+2029 inside a heading or a task
 * line, renders as no line break at all yet terminates `.` and `$` in the
 * grammar regexes — so the line silently failed every match, whole phases
 * vanished from the parse, the task budget went unchecked, and the lint
 * answered a false `PASS`. CR becomes the line ending it is in Markdown;
 * U+2028/U+2029 become a space, because Markdown has no line break there and
 * the content must stay on its line, never vanish. A U+FEFF at the start of
 * the file or of any line is invisible in rendered Markdown, yet it made the
 * `^`-anchored heading regex miss — the same elision, reachable from any plan
 * written by PowerShell's `Out-File` or legacy Notepad, which emit a BOM by
 * default.
 */
function normalizeTerminators(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u2028\u2029]/g, " ")
    .replace(/(^|\n)\uFEFF/g, "$1");
}

/**
 * Parse the phase headings and their bodies out of a Markdown plan.
 *
 * Fenced code blocks are recognized before any other grammar rule and
 * contribute nothing to the parse (F33 re-cut): no phase heading,
 * `Layer:`/`Done-when:` line, or task inside a fence is recognized, and the
 * fence lines themselves are inert. An unclosed fence runs to end of file
 * (GFM semantics), so everything after it is fenced — deterministic, never a
 * guess.
 */
function parsePhases(text) {
  const phases = [];
  let current = null;
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (fence) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened) {
      fence = opened;
      continue;
    }
    const heading = PHASE_HEADING.exec(line);
    if (heading) {
      current = { number: Number(heading[1]), title: heading[2].trim(), body: [] };
      phases.push(current);
      continue;
    }
    if (current) current.body.push(line);
  }
  return phases.map((phase) => {
    const layerIndex = phase.body.findIndex((line) => /Layer:\s*\S/.test(line));
    // The declared value is matched against the closed enum exactly, never
    // narrowed to its first whitespace token: `Layer: docs, ui` (the two-layer
    // shape the rule owner forbids) used to lint clean as `docs`, so a
    // malformed or out-of-enum value silently guessed instead of failing closed
    // (F72, SPEC: a missing, malformed, or out-of-enum `Layer:` line makes the
    // file unparseable — never guess, never partially judge).
    const layerText =
      layerIndex === -1
        ? null
        : stripDeclaredEdges(
            phase.body[layerIndex]
              .replace(/.*?Layer:\s*/, "")
              .split(/Done-when:/)[0]
              // The canonical committed shape is `Layer: <enum> · <prose>` (the
              // tail wraps onto following lines): only the first `·`-segment is
              // the declared value, so a prose tail cannot reject the phase
              // (F80). A genuine second layer (`docs, ui`) has no `·` and stays
              // a whole-value reject (F72).
              .split("·")[0],
          );
    const layer = layerText !== null && LAYERS.includes(layerText) ? layerText : null;
    const doneIndex = phase.body.findIndex((line) => /Done-when:/.test(line));
    let doneWhen = null;
    if (doneIndex !== -1) {
      const block = [phase.body[doneIndex].replace(/.*?Done-when:\s*/, "")];
      for (let i = doneIndex + 1; i < phase.body.length; i += 1) {
        if (phase.body[i].trim() === "" || /^\s*-\s*\[/.test(phase.body[i])) break;
        block.push(phase.body[i].trim());
      }
      doneWhen = block.join(" ").trim();
    }
    const tasks = phase.body
      .map((line) => /^\s*- \[([ x])\] (.+)$/.exec(line))
      .filter(Boolean)
      .map((match) => match[2].trim());
    return { ...phase, layer, doneWhen, tasks };
  });
}

function enumeratedCount(text) {
  const matches = text.match(ENUMERATED);
  return matches ? matches.length : 0;
}

function createdTargets(text) {
  if (!CREATION_VERB.test(text)) return [];
  return [...new Set(pathTokens(text))];
}

/**
 * Neutralize plan-derived text before echoing it into a finding line (F21).
 * A phase title can originate in a third-party forge issue body (`plan-fix`),
 * and a task target is plan text too, so both echo sites go through here: the
 * echo must carry neither instructions nor fake block lines into the stdout
 * block the consumer skills paste: control and format characters become
 * spaces, backticks are dropped, whitespace collapses, verdict-like literals
 * (`Phase-lint:`, `verdict`, `fingerprint`) are broken up so a
 * substring-grepping consumer can never mistake echoed text for a block line
 * (F49), including derived forms such as `Phase-linting`/`fingerprinting`
 * (F55 — the leading word boundary breaks the token at the word start, so no
 * trailing `\b` may be required), and the framework's own finding-line shape
 * `P<n> box-<n>:` together with its leading phase token (F66 — a crafted title
 * could otherwise carry a verbatim fake finding body into the echo), and
 * the length is bounded. Rule decisions read the RAW text; only the echo is
 * sanitized.
 */
function sanitizeEcho(text, limit = 120) {
  const cleaned = String(text)
    // Every character outside printable ASCII is replaced, so no Unicode
    // lookalike (a Greek `Ρ` for `P`, a Cyrillic `а` for `a`) can impersonate
    // a block-line token in the echo. Cc/Cf were already neutered; F71 extends
    // the strip to the whole lookalike class: destroying the glyph is what
    // makes a forged token unreadable rather than merely byte-different.
    .replace(/[^\x20-\x7e]+/g, " ")
    .replace(/`+/g, "")
    // The token families are broken wherever they appear, not only at a word
    // boundary: a junk prefix byte (`xPhase-lint`) defeated the old leading
    // `\b` and carried a byte-exact fake through the echo (F71).
    .replace(/(phase-lint|verdict|fingerprint)/gi, (word) => `${word[0]} ${word.slice(1)}`)
    .replace(/(P\d+)\s+(box)\s*-\s*(\d+)/gi, (_, phase, box, n) => `${phase[0]} ${phase.slice(1)} ${box[0]} ${box.slice(1)}-${n}`)
    .replace(/(box)\s*-\s*(\d+)/gi, (_, box, n) => `${box[0]} ${box.slice(1)}-${n}`)
    .replace(/P(\d+)\b/g, (_, n) => `P ${n}`)
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length > limit ? `${cleaned.slice(0, limit)}…` : cleaned;
}

/** Box 1 — the title names ONE deliverable. */
const SYMBOL_JOINER = /[\p{L}\p{N}_]\s*[+,/&]\s*[\p{L}\p{N}_]/u;
const WORD_JOINER = /(?:^|[^\p{L}\p{N}_])[\p{L}\p{N}_]+\s+(?:and|y)\s+[\p{L}\p{N}_]+(?:$|[^\p{L}\p{N}_])/iu;
function box1(phase) {
  const title = phase.title.trim();
  if (title === HARDENING_TITLE) return [];
  const shown = sanitizeEcho(title);
  if (SYMBOL_JOINER.test(title)) return [`title joins deliverables with “+”, “,”, “/” or “&”: “${shown}”`];
  if (WORD_JOINER.test(title)) return [`title joins deliverables with “and”/“y”: “${shown}”`];
  return [];
}

/** Box 2 — one declared layer; every task target belongs to it. */
function box2(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    for (const { token, valid } of candidatePathTokens(task)) {
      // Every path-like candidate the grammar cannot tokenize but that carries
      // an embedded target is ambiguous, never silently targetless: dropping
      // one let the task be judged exempt and the layer check never ran — a
      // false PASS. That covers the emphasis-wrapped shape (F56), the
      // `~`-stripped shape (F63) and the whole untokenizable class (F69: an
      // em-dash, ellipsis or curly-quote residue). Prose that carries no target
      // (an inline `--body`/heredoc note) stays exempt, and a URL or a glob is
      // never a candidate at all (`looksPathLike` rejects those references).
      if (!valid) {
        if (embeddedTarget(token) !== null) return { findings, ambiguous: token };
        continue;
      }
      if (!isTargetToken(token)) continue;
      const layer = layerForTarget(token, phase.layer);
      if (layer === null) return { findings, ambiguous: token };
      if (layer !== phase.layer) findings.push(`task ${index + 1} target \`${sanitizeEcho(token)}\` belongs to layer ${layer}, not ${phase.layer}`);
      break;
    }
  }
  return { findings };
}

/** Box 3 — task count within the phase budget (the final close-out keeps ≤ 10). */
function box3(phase) {
  if (phase.tasks.length === 0) return [`phase has 0 tasks (minimum 1 for layer ${phase.layer})`];
  const limit = phase.finalCloseOut ? 10 : 8;
  return phase.tasks.length > limit ? [`phase has ${phase.tasks.length} tasks (limit ${limit} for layer ${phase.layer})`] : [];
}

/** Box 4 — one checkbox = one deliverable. */
function box4(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    const arrows = (task.match(/→/g) || []).length;
    if (arrows >= 2) {
      findings.push(`task ${index + 1} is a → chain of ${arrows + 1} steps`);
      continue;
    }
    const enumerated = enumeratedCount(task);
    if (enumerated > 3) {
      findings.push(`task ${index + 1} enumerates ${enumerated} cases`);
      continue;
    }
    const created = createdTargets(task);
    if (created.length > 1) findings.push(`task ${index + 1} creates ${created.length} files of distinct concerns`);
  }
  return findings;
}

/**
 * Standalone alternatives word (box-5, F30 re-cut): a case-insensitive `or`
 * with no word character and no hyphen adjacent on either side. Embedded forms
 * (`editor`) and hyphen-joined compounds (`equal-or-greater`) are one token,
 * never a joiner — the same compound-word rule box-1 uses. This subsumes the
 * previously frozen narrower `either … or` shape.
 */
const STANDALONE_OR = /(?<![\p{L}\p{N}_-])or(?![\p{L}\p{N}_-])/iu;
function hasStandaloneOr(task) {
  return STANDALONE_OR.test(task);
}

/**
 * The SPEC-frozen `If .* then (add|remove|move|split|merge|defer)` scan over
 * the whole task text: the `.*` may cross sentence periods (F38), but the scope
 * verb must sit immediately after a `then` that follows an `if` — the greedy
 * `.*` backtracks onto any qualifying `then`, so a verb later in the tail never
 * satisfies the pattern. Searching the whole tail for the verb (plus the `\w*`
 * derived forms) was a false BLOCK (F54).
 */
function hasIfThenScopeChange(task) {
  const at = task.search(/\bif\b/i);
  if (at === -1) return false;
  return /\bthen\s+(?:add|remove|move|split|merge|defer)\b/i.test(task.slice(at));
}

/** Box 5 — zero decision words. */
function box5(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    if (/\b(?:decide|decides|decided|choose|chooses|choosing)\b/i.test(task)) findings.push(`task ${index + 1} carries a decision word`);
    else if (hasStandaloneOr(task)) findings.push(`task ${index + 1} offers either/or alternatives`);
    else if (hasIfThenScopeChange(task)) findings.push(`task ${index + 1} carries an “If … then” scope change`);
  }
  return findings;
}

/**
 * Single-pass move-target scan over the whole task text: the SPEC-frozen
 * `move(s)? .*(to|into) P\d+` lets the middle span cross sentence periods, so
 * sentence bounding was fail-open (F38). A `to|into P<n>` after the first
 * move/defer verb also follows every later one, so one linear walk is
 * equivalent to the frozen per-verb form.
 */
function movesToPhase(task) {
  const at = task.search(/\b(?:moves?|defers?)\b/i);
  if (at === -1) return false;
  return /\b(?:to|into)\s+P\d+\b/i.test(task.slice(at));
}

/** Box 6 — no conditional scope mutation across phases. */
function box6(phase) {
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    if (movesToPhase(task)) findings.push(`task ${index + 1} moves work to another phase`);
  }
  return findings;
}

/**
 * Box 7 — no external/manual gates inside implementation phases. `manual` and
 * `ask the user` are layer-scoped (allowed anywhere in a hardening/close-out
 * phase); `gh pr` is position-scoped — SPEC §Design box-7 fails it "in a phase
 * other than the final hardening phase" (F39).
 */
function box7(phase) {
  const hardened = HARDENING_LAYERS.has(phase.layer);
  const findings = [];
  for (const [index, task] of phase.tasks.entries()) {
    const manualGate = !hardened && (/manual/i.test(task) || /\bask the users?\b/i.test(task));
    const forgeGate = /\bgh pr\b/i.test(task) && !phase.finalCloseOut;
    if (manualGate || forgeGate) {
      findings.push(`task ${index + 1} carries a manual/external gate outside the hardening phase`);
    }
  }
  return findings;
}

/**
 * Box 8 — machine-checkable done-when. The outcome vocabulary covers the
 * explicit exit forms committed plans actually use — `exits 0`, `exit code 2`
 * and `exits with code 0` (F45/F65) — while a bare arrow or a command with no
 * outcome still fails.
 */
const OUTCOME_ANCHOR = /→\s*\S|->\s*\S|\bexits?(?:\s+with)?(?:\s+code)?\s+(?:\d+|zero)\b|\b(?:empty|matches|zero)\b|\bpass(?:es|ed)?\b/i;
function box8(phase) {
  if (!phase.doneWhen) return ["phase body has no `Done-when:` line"];
  if (!/`[^`]+`/.test(phase.doneWhen)) return ["`Done-when:` carries no backticked command"];
  if (!OUTCOME_ANCHOR.test(phase.doneWhen)) return ["`Done-when:` carries no expected outcome"];
  return [];
}

const BOXES = [box1, box2, box3, box4, box5, box6, box7, box8];

/** Check one phase; returns { findings: [{box, reason}] } or { ambiguous }. */
function lintPhase(phase) {
  const findings = [];
  for (const [index, check] of BOXES.entries()) {
    const result = check(phase);
    if (result && !Array.isArray(result)) {
      if (result.ambiguous) return { ambiguous: result.ambiguous };
      for (const reason of result.findings) findings.push({ box: index + 1, reason });
      continue;
    }
    for (const reason of result) findings.push({ box: index + 1, reason });
  }
  return { findings };
}

/** The full run over one Markdown document. */
export function lintPlan(text) {
  const phases = parsePhases(normalizeTerminators(text));
  if (phases.length === 0) return { verdict: "BLOCKED: no-phases", exitCode: 1, lines: ["verdict BLOCKED: no-phases", `fingerprint: ${digest([])}`] };

  for (const phase of phases) {
    if (!phase.layer || !LAYERS.includes(phase.layer)) {
      return { verdict: "BLOCKED: unparseable", exitCode: 1, lines: ["verdict BLOCKED: unparseable", `fingerprint: ${digest([])}`] };
    }
  }

  // The ≤10 task budget belongs to the plan's FINAL phase when that phase is
  // hardening/close-out (owner rule 3; SPEC §Design box-3) — a hardening phase
  // followed by non-hardening work is mid-plan and keeps 8. Keying this to the
  // last hardening-*layered* phase was fail-open (F37, regression of F3).
  phases.forEach((phase, index) => {
    phase.finalCloseOut = index === phases.length - 1 && HARDENING_LAYERS.has(phase.layer);
  });

  const fingerprints = [];
  const results = [];
  for (const phase of phases) {
    fingerprints.push(`P${phase.number}:${phase.layer}:${phase.tasks.length}:${titleDeliverable(phase.title)}`);
    const result = lintPhase(phase);
    if (result.ambiguous) {
      return { verdict: "BLOCKED: unparseable", exitCode: 1, lines: ["verdict BLOCKED: unparseable", `fingerprint: ${digest([])}`] };
    }
    results.push({ phase, findings: result.findings });
  }

  const lines = [];
  let blocked = false;
  for (const [index, { phase, findings }] of results.entries()) {
    if (findings.length === 0) {
      lines.push(`P${phase.number} Phase-lint: PASS (8/8) · fingerprint ${fingerprints[index]}`);
      continue;
    }
    blocked = true;
    for (const finding of findings) lines.push(`P${phase.number} box-${finding.box}: ${finding.reason}`);
    lines.push(`P${phase.number} Phase-lint: BLOCKED — box ${findings[0].box}: ${findings[0].reason}`);
  }
  lines.push(blocked ? "verdict BLOCKED: lint-blocked" : "verdict PASS");
  lines.push(`fingerprint: ${digest(fingerprints)}`);
  return { verdict: blocked ? "BLOCKED: lint-blocked" : "PASS", exitCode: blocked ? 1 : 0, lines };
}

function digest(fingerprints) {
  return createHash("sha256").update(fingerprints.join("\n")).digest("hex");
}

/** CLI: one explicit path argument, nothing else. */
function main(argv) {
  if (argv.length > 1) {
    // A second path is a usage error, never a silent drop (F43): linting only
    // the first plan hands the caller a verdict for a file it did not choose.
    return { usageError: `expected exactly one plan path, got ${argv.length}` };
  }
  const file = argv[0];
  if (!file) return { verdict: "BLOCKED: missing-plan", exitCode: 1, lines: ["verdict BLOCKED: missing-plan", `fingerprint: ${digest([])}`] };
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    const code = error && error.code === "ENOENT" ? "missing-plan" : "unparseable";
    return { verdict: `BLOCKED: ${code}`, exitCode: 1, lines: [`verdict BLOCKED: ${code}`, `fingerprint: ${digest([])}`] };
  }
  return lintPlan(text);
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  const result = main(process.argv.slice(2));
  // Early-closing pipe consumers (`head -1`, `grep -m1`) close the read end
  // while the block is still being written; without a handler the runtime
  // raises an unhandled EPIPE and flips the intended exit code (F25). The
  // truncated chunk is already lost at that point, so the only correct answer
  // is to swallow EPIPE and keep the verdict's exit code.
  process.stdout.on("error", (error) => {
    if (error && error.code === "EPIPE") return;
    throw error;
  });
  if (result.usageError) {
    // Fail closed on stderr, with no verdict block on stdout: there is no plan
    // to judge, so no block may be pasted as one.
    process.stderr.write(`phase-lint: ${result.usageError}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`${result.lines.join("\n")}\n`);
    // `process.exit()` here would kill the process before an async pipe write
    // drains, truncating the block past the pipe buffer (F22). Setting the code
    // and letting the event loop empty flushes stdout first.
    process.exitCode = result.exitCode;
  }
}
