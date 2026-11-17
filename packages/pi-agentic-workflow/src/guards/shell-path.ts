// shell-path.ts — the shell write surface of the path-protection guard
// (issue #567, D2's enforcement shape).
//
// Two pure pieces, both dependency-injected so the suite drives them without
// a Pi session (the git-identity guard's shape):
//
//   * `analyzeShellWrite(command, …)` — what the command text *statically
//     exposes*: output-redirect operands, file-command destinations,
//     `writeFile`-style string literals (which covers `node -e`/`bun -e`
//     payloads), tilde expansion, and — for a direct interpreter+script
//     execution — the readable local script's own literals within a byte
//     bound. A computed target (`> $DEST`) is write-shaped with no literal:
//     that is the recorded boundary (D2.7), never a silent pass claim.
//   * `decideShellWrite(command, deps)` — containment mirroring `edit`
//     fail-closed: virtual device sinks (`/dev/null`, `/dev/std*`, …) are
//     skipped before resolution, since their write is discarded or routed to a
//     stream the session already owns; resolution errors block; scratch targets
//     under the OS temp roots pass (the repo's own live-tree guard mandates
//     bash mktemp writes); a durable out-of-root target blocks headless and is
//     offered to the owner interactively; an in-root existing target hands off
//     to the injected Tier 2 decision `edit` uses.

import { isAbsolute, relative, resolve } from "node:path";

/** A write-shaped command's outcome. `block:false` may still carry nothing —
 * the pass IS the verdict (never a bare undefined at this layer). */
export interface ShellVerdict {
  block: boolean;
  reason?: string;
}

export interface ShellAnalysis {
  /** Any write indicator was seen (redirect, file command, write call, script source). */
  writeShaped: boolean;
  /** Literal write targets, tilde-expanded, exactly as written otherwise. */
  targets: string[];
  /** Script files whose source was scanned (absolute paths). */
  scanned: string[];
  /** Write-shaped with no statically visible literal target — the recorded boundary. */
  dynamic: boolean;
}

export interface AnalyzeOptions {
  cwd: string;
  homedir: string;
  /** Reads a script source, or returns null (absent / over the bound). */
  readFile?: (path: string) => string | null;
}

export interface ShellGuardDeps {
  cwd: string;
  /** Canonical project root (the handler's realpath'd cwd). */
  realRoot: string;
  /** Canonical scratch prefixes; a target under one passes untouched. */
  tempRoots: string[];
  homedir: string;
  /** The handler's fail-closed canonicaliser (symlinks, absent tails). */
  resolveTarget: (abs: string) => { ok: true; real: string } | { ok: false; reason: string };
  exists: (path: string) => boolean;
  readFile?: (path: string) => string | null;
  interactive: boolean;
  confirm: (question: string) => unknown;
  /** The injected Tier 2 decision, called only for existing in-root targets. */
  tier2?: (relativePath: string, exists: boolean) => { block: boolean; reason?: string };
}

/** Byte bound for scanning an executed script's source (256 KiB, the crate's policy bound). */
export const SCRIPT_SCAN_MAX_BYTES = 256 * 1024;

const FILE_DEST_COMMANDS = new Set(["cp", "mv", "install"]);
const FILE_ALL_COMMANDS = new Set(["touch", "mkdir", "rmdir", "rm", "ln", "tee"]);
const INTERPRETERS = new Set(["bun", "node", "deno", "tsx", "ts-node", "python", "python3", "bash", "sh", "zsh"]);
const WRITE_CALLS =
  /\b(writeFileSync|writeFile|appendFileSync|appendFile|createWriteStream|createWriteFile|outputFileSync|outputFile|copyFileSync|unlinkSync|rmSync|mkdirSync)\s*\(/g;
const SCRIPT_EXT = /\.(?:[cm]?[jt]s|sh|py)$/;

function expandTilde(raw: string, homedir: string): string {
  if (raw === "~") return homedir;
  if (raw.startsWith("~/")) return homedir + raw.slice(1);
  return raw;
}

/** A literal path candidate: no `$`, no backtick, non-empty. */
function isLiteral(value: string): boolean {
  return value !== "" && !value.includes("$") && !value.includes("`");
}

/**
 * A literal that names a path rather than payload data: `writeFileSync(p, "x")`
 * carries both strings, only the first is a target. Path-likeness keeps the
 * data argument out; a literal without a slash/tilde/dot is never an
 * out-of-root target (those are absolute or `../`-relative), so the filter
 * cannot open the bypass — at worst an in-root nameless create passes, which
 * it did before the guard existed.
 */
function looksLikePath(value: string): boolean {
  return value.includes("/") || value.startsWith("~") || /\.[A-Za-z0-9]+$/.test(value);
}

/** Split at unquoted `;`, `&&`, `||`, `|` — a quoted operator stays inside its argument. */
function splitSegments(command: string): string[] {
  const segments: string[] = [];
  let buffer = "";
  let quote: "'" | '"' | null = null;
  for (let index = 0; index < command.length; index += 1) {
    const char = command[index];
    if (quote !== null) {
      buffer += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      buffer += char;
      continue;
    }
    const next = command[index + 1];
    if (char === ";" || char === "|") {
      if (char === "|" && next === "|") {
        segments.push(buffer);
        buffer = "";
        index += 1;
        continue;
      }
      segments.push(buffer);
      buffer = "";
      continue;
    }
    if (char === "&" && next === "&") {
      segments.push(buffer);
      buffer = "";
      index += 1;
      continue;
    }
    buffer += char;
  }
  segments.push(buffer);
  return segments.map((segment) => segment.trim()).filter((segment) => segment !== "");
}

/** Tokenize a segment outside quotes (flags keep their text). */
function tokenize(segment: string): string[] {
  const tokens: string[] = [];
  let buffer = "";
  let quote: "'" | '"' | null = null;
  const flush = () => {
    if (buffer !== "") tokens.push(buffer);
    buffer = "";
  };
  for (const char of segment) {
    if (quote !== null) {
      buffer += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      buffer += char;
      continue;
    }
    if (/\s/.test(char)) {
      flush();
      continue;
    }
    buffer += char;
  }
  flush();
  return tokens;
}

/** Strip one layer of matching quotes from a token. */
function unquote(token: string): string {
  if (token.length >= 2) {
    const first = token[0];
    const last = token[token.length - 1];
    if ((first === '"' || first === "'") && last === first) return token.slice(1, -1);
  }
  return token;
}

/** String literals inside a call's parentheses (depth-counted). */
function literalsInCall(text: string, openIndex: number): string[] {
  let depth = 1;
  let end = openIndex + 1;
  for (; end < text.length && depth > 0; end += 1) {
    const char = text[end];
    if (char === "(") depth += 1;
    else if (char === ")") depth -= 1;
  }
  const slice = text.slice(openIndex + 1, depth === 0 ? end - 1 : text.length);
  const literals: string[] = [];
  const pattern = /"([^"]*)"|'([^']*)'/g;
  let match;
  while ((match = pattern.exec(slice)) !== null) literals.push(match[1] ?? match[2]);
  return literals;
}

export function analyzeShellWrite(command: string, options: AnalyzeOptions): ShellAnalysis {
  const { cwd, homedir, readFile } = options;
  const targets: string[] = [];
  const scanned: string[] = [];
  let writeShaped = false;

  const push = (raw: string) => {
    const expanded = expandTilde(raw, homedir);
    if (!isLiteral(expanded) || !looksLikePath(expanded)) return;
    if (!targets.includes(expanded)) targets.push(expanded);
  };

  for (const segment of splitSegments(command)) {
    /* output redirects: `>`, `>>`, `&>`, with an optional fd prefix */
    const operator = /(?:^|[\s;])(?:&>>?|\d*>>?)(?=\s|$)/;
    if (operator.test(segment)) writeShaped = true;
    const redirect = /(?:^|[\s;])(?:&>>?|\d*>>?)\s*(?:"([^"]*)"|'([^']*)'|([^\s;&]+))/g;
    let match;
    while ((match = redirect.exec(segment)) !== null) {
      const operand = match[1] ?? match[2] ?? match[3] ?? "";
      if (isLiteral(operand)) push(operand);
      // a non-literal operand (`> $DEST`) already set writeShaped above
    }

    /* file commands */
    const tokens = tokenize(segment);
    const head = tokens.length > 0 ? unquote(tokens[0]).replace(/^.*\//, "") : "";
    if (FILE_DEST_COMMANDS.has(head) || FILE_ALL_COMMANDS.has(head)) {
      const operands = tokens.slice(1).map(unquote).filter((token) => token !== "" && token !== "-" && !token.startsWith("-"));
      if (operands.length > 0) {
        writeShaped = true;
        const picked = FILE_DEST_COMMANDS.has(head) ? operands.slice(-1) : operands;
        for (const operand of picked) push(operand);
      } else if (tokens.length > 1) {
        writeShaped = true; // flags only: `rm -rf` names no path, but the command writes
      }
    }

    /* inline write-call literals (covers node -e / bun -e payloads) */
    WRITE_CALLS.lastIndex = 0;
    let call;
    while ((call = WRITE_CALLS.exec(segment)) !== null) {
      writeShaped = true;
      const openIndex = segment.indexOf("(", call.index + call[1].length);
      if (openIndex === -1) continue;
      for (const literal of literalsInCall(segment, openIndex)) push(literal);
    }

    /* direct interpreter + local script: scan the readable source */
    const script = scriptArgument(tokens, cwd, homedir);
    if (script !== null && readFile !== undefined) {
      const source = readFile(script);
      if (typeof source === "string") {
        writeShaped = true;
        if (!scanned.includes(script)) scanned.push(script);
        WRITE_CALLS.lastIndex = 0;
        let sourceCall;
        while ((sourceCall = WRITE_CALLS.exec(source)) !== null) {
          const openIndex = source.indexOf("(", sourceCall.index + sourceCall[1].length);
          if (openIndex === -1) continue;
          for (const literal of literalsInCall(source, openIndex)) push(literal);
        }
        let sourceRedirect;
        const sourceOps = /(?:^|[\s;])(?:&>>?|\d*>>?)\s*(?:"([^"]*)"|'([^']*)'|([^\s;&]+))/g;
        while ((sourceRedirect = sourceOps.exec(source)) !== null) {
          const operand = sourceRedirect[1] ?? sourceRedirect[2] ?? sourceRedirect[3] ?? "";
          if (isLiteral(operand)) push(operand);
        }
      }
    }
  }

  return {
    writeShaped,
    targets,
    scanned,
    dynamic: writeShaped && targets.length === 0,
  };
}

/** The first non-flag argument after an interpreter, when it looks like a local script. */
function scriptArgument(tokens: string[], cwd: string, homedir: string): string | null {
  if (tokens.length < 2) return null;
  const head = unquote(tokens[0]).replace(/^.*\//, "");
  if (!INTERPRETERS.has(head)) return null;
  for (const token of tokens.slice(1)) {
    const argument = unquote(token);
    if (argument.startsWith("-")) continue;
    if (!SCRIPT_EXT.test(argument)) return null;
    const expanded = expandTilde(argument, homedir);
    return isAbsolute(expanded) ? expanded : resolve(cwd, expanded);
  }
  return null;
}

/** True when the canonical target lives under a canonical scratch root. */
export function isScratchPath(realPath: string, tempRoots: string[]): boolean {
  return tempRoots.some((root) => {
    const prefix = root.endsWith("/") ? root.slice(0, -1) : root;
    return realPath === prefix || realPath.startsWith(`${prefix}/`);
  });
}

/**
 * Virtual device sinks (issue #606): the write is discarded or routed to a
 * stream the session already owns, never to durable storage, so containment has
 * no verdict to give. Matched on the lexically normalized absolute path and
 * never through the filesystem: `/dev/std*` and `/dev/fd/*` are symlinks into
 * `/proc/self/fd/…` that the fail-closed resolver cannot canonicalize for a
 * non-tty caller, which is why the skip runs before resolution.
 */
const DEVICE_SINKS = new Set(["/dev/null", "/dev/zero", "/dev/full", "/dev/stdin", "/dev/stdout", "/dev/stderr", "/dev/tty"]);
const DEVICE_FD_PREFIX = "/dev/fd/";

/** True when the written literal names a device sink rather than durable storage. */
function isDeviceSink(cwd: string, raw: string): boolean {
  const key = resolve(cwd, raw);
  return DEVICE_SINKS.has(key) || key.startsWith(DEVICE_FD_PREFIX);
}

const OUT_OF_ROOT = (raw: string, cwd: string) =>
  `"${raw}" resolves outside the project root (${cwd}); path protection cannot verify it, so the bash write is blocked before execution.`;

export function decideShellWrite(command: string, deps: ShellGuardDeps): ShellVerdict {
  const analysis = analyzeShellWrite(command, {
    cwd: deps.cwd,
    homedir: deps.homedir,
    readFile: deps.readFile,
  });
  if (!analysis.writeShaped) return { block: false };
  // D2.7's recorded boundary: write-shaped with no statically visible literal
  // target passes — the contract states this line, the guard never claims it
  // evaluated what the command text does not expose.
  if (analysis.targets.length === 0) return { block: false };

  for (const raw of analysis.targets) {
    // A device sink is never a durable target (S1/S2): skip it here, before the
    // resolver whose `/proc/self/fd/…` canonicalization is what blocks `/dev/*`.
    if (isDeviceSink(deps.cwd, raw)) continue;
    const absolute = isAbsolute(raw) ? raw : resolve(deps.cwd, raw);
    const resolved = deps.resolveTarget(absolute);
    if (!resolved.ok) {
      return {
        block: true,
        reason: `"${raw}" could not be resolved (${resolved.reason}); path protection cannot verify it, so the bash write is blocked.`,
      };
    }
    // Judgement order (D2): inside the root first — a project may itself live
    // under the OS temp dirs, so containment, not the scratch carve-out,
    // decides its own files — then the carve-out for genuinely out-of-root
    // scratch, then the durable out-of-root verdict.
    const relativeTarget = relative(deps.realRoot, resolved.real);
    const inRoot =
      relativeTarget !== "" &&
      relativeTarget !== ".." &&
      !relativeTarget.startsWith("../") &&
      !isAbsolute(relativeTarget);
    if (inRoot) {
      if (deps.tier2 !== undefined && deps.exists(resolved.real)) {
        const decision = deps.tier2(relativeTarget, true);
        if (decision.block) return { block: true, reason: decision.reason };
      }
      continue;
    }
    if (isScratchPath(resolved.real, deps.tempRoots)) continue;
    if (!deps.interactive) return { block: true, reason: OUT_OF_ROOT(raw, deps.cwd) };
    const question =
      'path protection: "' + raw + '" resolves outside the project root (' + deps.cwd + "). Allow this bash write?";
    if (deps.confirm(question)) continue;
    return { block: true, reason: `${OUT_OF_ROOT(raw, deps.cwd)} The approval prompt was not confirmed.` }
  }
  return { block: false };
}
