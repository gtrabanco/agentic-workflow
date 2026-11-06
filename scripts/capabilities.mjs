#!/usr/bin/env node
/**
 * capabilities.mjs — what a file can DO, not what its lines are spelled like
 * (issue #384, unit `360c`; owner decision `D1` in
 * `docs/fix/384-capability-risk-detection/decisions.md`).
 *
 * The risk classifier's `destructive` signal used to be a list of operation
 * *names* matched against the changed text. It missed the same removal under
 * another spelling (`unlink` from `node:fs/promises`), behind a binding
 * (`import { unlink as drop }`), in a language the list never covered
 * (`shutil.rmtree`, `rm -rf`, `find -delete`), and — the real gap — one module
 * away (a helper that declares the removal the changed file only *calls*).
 *
 * This module answers that question from what a file can do: its **imports**
 * and its **effects**. Per language family (`js`, `py`, `sh`) it extracts the
 * imports a file declares and the invocations it makes, resolves them through a
 * catalogue keyed by **provider** (which module or program can grant which
 * capability, and which members a capability's effects are spelled as), follows
 * a relative import into the declaring module through a caller-supplied
 * resolver, and reports the capabilities the file reaches.
 *
 * Three properties make a bounded analyser safe to ship:
 *
 *   pure        — no clock, no environment, no network, and no filesystem read
 *                 of its own: the caller hands it the bytes, and a resolver when
 *                 it wants a relative import followed.
 *   deterministic — same input, byte-identical output.
 *   fail closed upward — everything it cannot resolve raises a tier elsewhere,
 *                 never lowers one: an unknown language claims nothing, an
 *                 unreadable import is *reported* as unresolved, and a spelling
 *                 inside a string or a comment is not an effect at all. The worst
 *                 outcome of a false positive is the extra ceremony the owner
 *                 accepted; a false `passive` is impossible by construction.
 *
 * It decides a *tier*, never a command: nothing here blocks work. See
 * `skills/execute-phase/references/risk-tiers.md`.
 */

/** The contract id this module's shape is cited by. */
export const CAPABILITY_CONTRACT_ID = "capability-analysis@1";

/**
 * The closed capability vocabulary. Internal evidence (owner decision `D2`): the
 * ids reach the tier verdict only inside its `reason` sentence, so nothing here
 * is a new published field.
 */
export const CAPABILITY_KINDS = Object.freeze([
  "filesystem-read",
  "filesystem-write",
  "filesystem-remove",
  "process-spawn",
  "network",
]);

/** The language families the analyser knows, by extension. */
const FAMILIES = Object.freeze([
  { language: "js", extensions: ["js", "mjs", "cjs", "jsx", "ts", "tsx", "mts", "cts"] },
  { language: "py", extensions: ["py"] },
  { language: "sh", extensions: ["sh", "bash", "zsh"] },
]);

/**
 * The **catalogue**: what each provider can grant, and how a capability's
 * effects are spelled. Two tables, one home each — a provider row never restates
 * a member name, and a member name never appears in the classifier.
 *
 * `PROVIDERS` is keyed by the provider a file *imports* (a module specifier, or
 * a shell program), so the analysis asks "what can this import do?" rather than
 * "does this line look like a removal?".
 */
export const PROVIDERS = Object.freeze({
  // JavaScript / TypeScript — `node:` builtins, with or without the prefix.
  "node:fs": Object.freeze(["filesystem-read", "filesystem-write", "filesystem-remove"]),
  "node:fs/promises": Object.freeze(["filesystem-read", "filesystem-write", "filesystem-remove"]),
  "node:child_process": Object.freeze(["process-spawn"]),
  "node:net": Object.freeze(["network"]),
  "node:http": Object.freeze(["network"]),
  "node:https": Object.freeze(["network"]),
  "node:dgram": Object.freeze(["network"]),
  "node:tls": Object.freeze(["network"]),
  // Python — the modules that reach a capability, including the removing ones.
  shutil: Object.freeze(["filesystem-write", "filesystem-remove"]),
  os: Object.freeze(["filesystem-write", "filesystem-remove", "process-spawn"]),
  pathlib: Object.freeze(["filesystem-read", "filesystem-write", "filesystem-remove"]),
  subprocess: Object.freeze(["process-spawn"]),
  socket: Object.freeze(["network"]),
  http: Object.freeze(["network"]),
  urllib: Object.freeze(["network"]),
  "urllib.request": Object.freeze(["network"]),
  requests: Object.freeze(["network"]),
  httpx: Object.freeze(["network"]),
  aiohttp: Object.freeze(["network"]),
  // Shell — every program a file invokes is its provider.
  rm: Object.freeze(["filesystem-remove"]),
  rmdir: Object.freeze(["filesystem-remove"]),
  shred: Object.freeze(["filesystem-remove"]),
  unlink: Object.freeze(["filesystem-remove"]),
  truncate: Object.freeze(["filesystem-write"]),
  dd: Object.freeze(["filesystem-write"]),
  find: Object.freeze(["filesystem-read"]),
  git: Object.freeze(["filesystem-write"]),
  curl: Object.freeze(["network"]),
  wget: Object.freeze(["network"]),
  ssh: Object.freeze(["network"]),
  nc: Object.freeze(["network"]),
  node: Object.freeze(["process-spawn"]),
  bun: Object.freeze(["process-spawn"]),
  npm: Object.freeze(["process-spawn"]),
  npx: Object.freeze(["process-spawn"]),
  python: Object.freeze(["process-spawn"]),
  python3: Object.freeze(["process-spawn"]),
  bash: Object.freeze(["process-spawn"]),
  sh: Object.freeze(["process-spawn"]),
});

/**
 * How each capability's effects are spelled in each family. `filesystem-remove`
 * is the one that decides the `destructive` signal: it is the capability that
 * takes data a user cannot get back.
 */
export const CAPABILITY_MEMBERS = Object.freeze({
  "filesystem-read": Object.freeze({ js: ["readFile", "createReadStream", "readText"], py: ["read_text", "load", "read"], sh: [] }),
  "filesystem-write": Object.freeze({
    js: ["writeFile", "writeFileSync", "appendFile", "appendFileSync", "createWriteStream", "mkdir", "mkdirSync", "copyFile", "copyFileSync"],
    py: ["write_text", "write_bytes", "dump", "copy", "copy2", "move", "mkdir"],
    sh: [],
  }),
  "filesystem-remove": Object.freeze({
    js: ["rm", "rmSync", "rmdir", "rmdirSync", "unlink", "unlinkSync", "purge", "purgeDir", "rimraf"],
    py: ["rmtree", "remove", "unlink", "rmdir", "removedirs", "unlinkP"],
    sh: [],
  }),
  "process-spawn": Object.freeze({
    js: ["exec", "execSync", "execFile", "execFileSync", "spawn", "spawnSync", "fork"],
    py: ["run", "call", "check_call", "check_output", "Popen", "system", "execv", "spawnv"],
    sh: [],
  }),
  network: Object.freeze({
    js: ["request", "get", "fetch"],
    py: ["urlopen", "get", "post", "request", "connect"],
    sh: [],
  }),
});

/** The one capability that raises a tier on its own. */
const REMOVAL = "filesystem-remove";

/** The removing members, flattened once so the catalogue stays the only home. */
const REMOVAL_MEMBERS = new Set(CAPABILITY_MEMBERS[REMOVAL].js.concat(CAPABILITY_MEMBERS[REMOVAL].py));

/**
 * A shell program's removal is flag-shaped, and no guard makes it safe (a
 * recursive force delete is how a removal is *written*): the program names the
 * capability, the flags confirm the effect.
 */
const SH_REMOVAL_FLAGS = Object.freeze([
  { program: "find", flag: /(?:^|\s)-delete(?:\s|$)/ },
  { program: "git", flag: /^clean\s+-\w*f/u },
  { program: "dd", flag: /\bof=/ },
  { program: "truncate", flag: /\s-s\s+0\b/ },
]);

/**
 * The **embedded-statement layer**: a script that carries a shell command or a
 * SQL statement in its own text is executing something a runtime will run, so
 * the statement is a destructive surface whatever the file's language. This is
 * the residue the operation-name retirement keeps, and its fixtures are the
 * frozen 360 corpus (`F3d`).
 */
const STATEMENTS = Object.freeze([
  { pattern: /\brm\s+(?:-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*|--recursive\s+--force|--force\s+--recursive)\b/, member: "rm" },
  { pattern: /\bdrop\s+(?:table|database)\b/i, member: "drop" },
  { pattern: /\bdelete\s+from\b/i, member: "delete" },
  { pattern: /\bTRUNCATE\s+(?:TABLE\b|[a-z_][a-z0-9_]*\s*;)/i, member: "truncate" },
  { pattern: /\bgit\s+push\s+--force\b/, member: "push" },
  { pattern: /\bfind\s[^\n]*\s-delete\b/, member: "find" },
]);

/** Words that are never an invocation. */
const KEYWORDS = new Set([
  "if", "for", "while", "switch", "catch", "return", "function", "typeof", "await", "async",
  "new", "delete", "void", "case", "do", "else", "with", "yield", "in", "of", "super", "this",
  "elif", "def", "class", "import", "from", "print", "len", "range", "str", "int", "list",
  "dict", "set", "tuple", "open", "super",
]);

/** The JS builtin specifiers that name a capable provider without the `node:` prefix. */
const JS_BUILTINS = new Set(["fs", "fs/promises", "child_process", "net", "http", "https", "dgram", "tls"]);

/** A file's language family, or `null` when the extension is not one it knows. */
export function languageOf(file) {
  const base = String(file).split("/").pop() ?? "";
  const dot = base.lastIndexOf(".");
  const extension = dot <= 0 ? "" : base.slice(dot + 1).toLowerCase();
  for (const family of FAMILIES) if (family.extensions.includes(extension)) return family.language;
  return null;
}

/* --------------------------------------------------------------- masking */

/**
 * Blank a text's comments (and, when asked, its string literals) while keeping
 * every index, every newline and the total length intact. The scan then runs on
 * code only: a removal spelling inside a doc string or a comment is text, and a
 * brace inside a string never moves the depth.
 */
function mask(text, language, { strings = false } = {}) {
  const source = String(text);
  const out = source.split("");
  const blank = (from, to) => {
    for (let index = from; index < to; index += 1) if (out[index] !== "\n") out[index] = " ";
  };
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    const next = source[index + 1];
    // Line comments.
    if ((language !== "py" && char === "/" && next === "/") || (language === "sh" && char === "#" && isLineStart(source, index))) {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      blank(index, stop);
      index = stop;
      continue;
    }
    // Block comments.
    if (language !== "py" && language !== "sh" && char === "/" && next === "*") {
      const end = source.indexOf("*/", index + 2);
      const stop = end === -1 ? source.length : end + 2;
      blank(index, stop);
      index = stop;
      continue;
    }
    // Python comments run to the end of the line.
    if (language === "py" && char === "#") {
      const end = source.indexOf("\n", index);
      const stop = end === -1 ? source.length : end;
      blank(index, stop);
      index = stop;
      continue;
    }
    // String literals.
    if (strings && (char === '"' || char === "'" || char === "`")) {
      let cursor = index + 1;
      while (cursor < source.length) {
        if (source[cursor] === "\\") {
          cursor += 2;
          continue;
        }
        if (source[cursor] === char) break;
        if (source[cursor] === "\n" && char !== "`") break;
        cursor += 1;
      }
      blank(index + 1, Math.min(cursor, source.length));
      index = Math.min(cursor + 1, source.length);
      continue;
    }
    index += 1;
  }
  return out.join("");
}

/** A shell `#` is a comment only at a word start (`${#x}` and `a#b` are not). */
function isLineStart(text, index) {
  const before = text.slice(0, index);
  const lineStart = before.lastIndexOf("\n") + 1;
  return /^\s*$/.test(text.slice(lineStart, index));
}

/** Index → 1-based line number, over a precomputed line-start table. */
function lineTable(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) if (text[index] === "\n") starts.push(index + 1);
  return (position) => {
    let low = 0;
    let high = starts.length - 1;
    while (low < high) {
      const mid = (low + high + 1) >> 1;
      if (starts[mid] <= position) low = mid;
      else high = mid - 1;
    }
    return low + 1;
  };
}

/** The brace depth at every index of an already-masked text. */
function depthTable(masked) {
  const depth = new Int32Array(masked.length + 1);
  let current = 0;
  for (let index = 0; index < masked.length; index += 1) {
    depth[index] = current;
    if (masked[index] === "{") current += 1;
    else if (masked[index] === "}") current = Math.max(0, current - 1);
  }
  depth[masked.length] = current;
  return depth;
}

/* -------------------------------------------------------------- resolution */

/** The canonical provider a specifier names, or `null` when it names none. */
function canonicalProvider(specifier, language) {
  if (language === "js") {
    const bare = specifier.startsWith("node:") ? specifier.slice(5) : specifier;
    const canonical = specifier.startsWith("node:") ? specifier : JS_BUILTINS.has(bare) ? `node:${bare}` : null;
    if (canonical !== null && PROVIDERS[canonical]) return canonical;
    return specifier.startsWith(".") ? null : specifier;
  }
  // Python and shell resolve by the longest declared prefix (`urllib.request`).
  const parts = specifier.split(".");
  for (let size = parts.length; size > 0; size -= 1) {
    const candidate = parts.slice(0, size).join(".");
    if (PROVIDERS[candidate]) return candidate;
  }
  return specifier.startsWith(".") ? null : specifier;
}

/** The capabilities a provider grants, or `[]` for one the catalogue does not know. */
function capabilitiesOf(provider) {
  return provider && PROVIDERS[provider] ? PROVIDERS[provider] : [];
}

/* ---------------------------------------------------------------- imports */

/**
 * A language's imports → `{ provider, specifier, relative, members, namespace,
 * sideEffect }` where `members` is `[{ name, local }]` (the imported member and
 * the local binding it was renamed to).
 */
function importsOf(file, noComments, language) {
  const imports = [];
  const push = (entry) => imports.push({ relative: false, members: [], namespace: null, sideEffect: false, ...entry });

  if (language === "js") {
    const fromRe = /import\s+(?:type\s+)?([^;]*?)\s+from\s+["']([^"'\n]+)["']/g;
    for (const match of noComments.matchAll(fromRe)) {
      const clause = match[1].trim();
      const specifier = match[2];
      const members = [];
      const named = /\{([^}]*)\}/.exec(clause);
      if (named) {
        for (const entry of named[1].split(",").map((part) => part.trim()).filter(Boolean)) {
          const [name, local] = entry.split(/\s+as\s+/).map((part) => part.trim());
          members.push({ name, local: local ?? name });
        }
      }
      const namespace = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(clause);
      const defaultName = /^([A-Za-z_$][\w$]*)\s*(?:,|$)/.exec(clause);
      if (defaultName && !clause.startsWith("{")) members.push({ name: "default", local: defaultName[1] });
      push({
        specifier,
        relative: specifier.startsWith("."),
        members,
        namespace: namespace ? namespace[1] : null,
        sideEffect: clause === "",
      });
    }
    const bareRe = /import\s+["']([^"'\n]+)["']/g;
    for (const match of noComments.matchAll(bareRe)) push({ specifier: match[1], relative: match[1].startsWith("."), sideEffect: true });

    // `const { a, b: c } = require("m")` and `const ns = require("m")`.
    const destructured = /(?:const|let|var)\s*\{([^}]*)\}\s*=\s*require\s*\(\s*["']([^"'\n]+)["']\s*\)/g;
    for (const match of noComments.matchAll(destructured)) {
      const members = match[1].split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
        const [name, local] = part.split(/\s*:\s*/).map((cell) => cell.trim());
        return { name, local: local ?? name };
      });
      push({ specifier: match[2], relative: match[2].startsWith("."), members });
    }
    const namespaced = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\s*\(\s*["']([^"'\n]+)["']\s*\)/g;
    for (const match of noComments.matchAll(namespaced)) {
      push({ specifier: match[2], relative: match[2].startsWith("."), namespace: match[1] });
    }
  }

  if (language === "py") {
    for (const match of noComments.matchAll(/^[ \t]*import[ \t]+([^\n#]+)$/gmu)) {
      for (const entry of match[1].split(",").map((part) => part.trim()).filter(Boolean)) {
        const [specifier, local] = entry.split(/\s+as\s+/).map((part) => part.trim());
        push({ specifier, relative: specifier.startsWith("."), namespace: local ?? specifier.split(".")[0] });
      }
    }
    for (const match of noComments.matchAll(/^[ \t]*from[ \t]+([.\w]+)[ \t]+import[ \t]+([^\n#]+)$/gmu)) {
      const specifier = match[1];
      const members = match[2].replace(/[()]/g, "").split(",").map((part) => part.trim()).filter(Boolean).map((part) => {
        const [name, local] = part.split(/\s+as\s+/).map((cell) => cell.trim());
        return { name, local: local ?? name };
      });
      push({ specifier, relative: specifier.startsWith("."), members });
    }
  }

  return imports.map((entry) => ({
    ...entry,
    provider: entry.relative ? null : canonicalProvider(entry.specifier, language),
  }));
}

/* ----------------------------------------------------------------- effects */

/** A call chain (a namespace, then the members below it) → head and member. */
function chainOf(raw) {
  const segments = raw.split(".").map((part) => part.trim());
  return { head: segments[0], member: segments[segments.length - 1], segments };
}

/** The masked argument text of the call whose `(` sits at `open`. */
function argumentsAt(masked, open) {
  let depth = 0;
  for (let index = open; index < Math.min(masked.length, open + 4000); index += 1) {
    if (masked[index] === "(") depth += 1;
    else if (masked[index] === ")") {
      depth -= 1;
      if (depth === 0) return masked.slice(open + 1, index);
    }
  }
  return masked.slice(open + 1, Math.min(masked.length, open + 4000));
}

/** `true` when a JS removal's arguments carry BOTH guard flags — scratch hygiene. */
function isGuarded(args) {
  return /\brecursive\s*:\s*true\b/.test(args) && /\bforce\s*:\s*true\b/.test(args);
}

/**
 * Every invocation in a masked text → `[{ member, head, chain, line, args }]`,
 * keywords and declaration names excluded.
 */
function invocationsOf(masked, language) {
  const lineOf = lineTable(masked);
  const found = [];
  const callRe = /([A-Za-z_$][\w$]*(?:\s*\.\s*[A-Za-z_$][\w$]*)*)\s*\(/g;
  for (const match of masked.matchAll(callRe)) {
    const chain = match[1].replace(/\s+/g, "");
    const { head, member } = chainOf(chain);
    const before = masked.slice(Math.max(0, match.index - 12), match.index).trimEnd();
    if (/(?:function|class|def|new)$/.test(before)) continue;
    if (KEYWORDS.has(head) && !chain.includes(".")) continue;
    if (language === "sh") continue;
    found.push({
      member,
      head,
      chain,
      line: lineOf(match.index),
      position: match.index,
      args: argumentsAt(masked, match.index + match[0].length - 1),
    });
  }
  return found;
}

/** A shell file's programs → `[{ program, args, line }]`. */
function programsOf(noComments) {
  const lineOf = lineTable(noComments);
  const found = [];
  const segmentRe = /(?:^|[\n;|&()])\s*([^\n;|&()]*)/g;
  for (const match of noComments.matchAll(segmentRe)) {
    const segment = match[1].trim();
    if (segment === "" || segment.startsWith("=")) continue;
    const words = segment.split(/\s+/);
    const program = words[0];
    if (!/^[A-Za-z_][\w.-]*$/.test(program)) continue;
    if (KEYWORDS.has(program) || SHELL_BUILTINS.has(program)) continue;
    if (SHELL_KEYWORDS.has(program)) continue;
    found.push({ program, args: words.slice(1).join(" "), line: lineOf(match.index + match[0].indexOf(segment)) });
  }
  return found;
}

/** Words a shell segment may start with that are not programs. */
const SHELL_KEYWORDS = new Set([
  "if", "then", "else", "elif", "fi", "for", "while", "until", "do", "done", "case", "esac",
  "function", "return", "local", "export", "set", "unset", "trap", "shift", "source", "eval",
]);
const SHELL_BUILTINS = new Set(["echo", "printf", "cd", "true", "false", "test", "read", "wait", "exit", "pwd", "sleep"]);

/* ------------------------------------------------------------ declarations */

/**
 * The declarations a module exposes, with the span each one's body occupies.
 * Bounded by construction: a declaration without a body brace ends at the next
 * `;` or newline, and a body ends where its depth returns.
 */
function declarationsOf(masked, language) {
  const depth = depthTable(masked);
  const lineOf = lineTable(masked);
  const declarations = [];
  const patterns = language === "py"
    ? [/^[ \t]*(?:async[ \t]+)?def[ \t]+([A-Za-z_]\w*)[ \t]*\(/gmu]
    : [
      /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
      /(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^()]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g,
      /(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/g,
    ];
  for (const pattern of patterns) {
    for (const match of masked.matchAll(pattern)) {
      const start = match.index;
      let end;
      if (language === "py") {
        const indent = /^[ \t]*/.exec(masked.slice(start))[0].length;
        const rest = masked.slice(start).split("\n").slice(1);
        let offset = start + (masked.slice(start).indexOf("\n") === -1 ? masked.length - start : masked.slice(start).indexOf("\n") + 1);
        end = masked.length;
        for (const line of rest) {
          if (line.trim() !== "" && /^[ \t]*/.exec(line)[0].length <= indent && !/^[ \t]*(?:elif|else|except|finally)\b/.test(line)) {
            end = offset;
            break;
          }
          offset += line.length + 1;
        }
      } else {
        const open = masked.indexOf("{", start);
        if (open === -1) {
          const stop = masked.indexOf(";", start);
          end = stop === -1 ? masked.length : stop + 1;
        } else {
          const base = depth[open];
          end = masked.length;
          for (let index = open + 1; index < masked.length; index += 1) {
            if (masked[index] === "}" && depth[index] === base + 1) {
              end = index + 1;
              break;
            }
          }
        }
      }
      declarations.push({ name: match[1], start, end, line: lineOf(start), body: masked.slice(start, end) });
    }
  }
  return declarations;
}

/* ------------------------------------------------------------------ source */

/** One file's analysis, before any relative import is resolved. */
function scanSource(file, text, language) {
  const source = String(text ?? "");
  const noComments = mask(source, language, { strings: false });
  const masked = mask(source, language, { strings: true });
  const imports = importsOf(file, noComments, language);
  const declarations = declarationsOf(masked, language);
  const programs = language === "sh" ? programsOf(noComments) : [];
  const invocations = language === "sh" ? [] : invocationsOf(masked, language);

  /** The capability an invocation reaches, through its binding or ambiently. */
  const resolveInvocation = (invocation) => {
    const namespaceBinding = imports.find((entry) => entry.namespace === invocation.head);
    if (namespaceBinding) return { provider: namespaceBinding.provider, member: invocation.member };
    const namedBinding = imports.find((entry) => entry.members.some((member) => member.local === invocation.head));
    if (namedBinding) {
      const member = namedBinding.members.find((entry) => entry.local === invocation.head);
      return { provider: namedBinding.provider, member: member.name };
    }
    const headBinding = imports.find((entry) => entry.namespace === invocation.chain) ?? null;
    return { provider: headBinding ? headBinding.provider : null, member: invocation.member };
  };

  const effects = [];
  for (const invocation of invocations) {
    const { provider, member } = resolveInvocation(invocation);
    // A dotted call on a name no import resolves (`items.remove(x)` mutating a
    // list) names no provider: its member is a value's own method, not the
    // filesystem, and claiming it would be guessing — the one direction the
    // fail-closed rule forbids. A provider binding or a bare call is required.
    if (language === "py" && provider === null && invocation.head !== invocation.chain) continue;
    const granted = capabilitiesOf(provider);
    const capability = CAPABILITY_KINDS.find((kind) => CAPABILITY_MEMBERS[kind]?.[language]?.includes(member))
      ?? (granted.includes(REMOVAL) && REMOVAL_MEMBERS.has(member) ? REMOVAL : null);
    if (capability === null) continue;
    // The declaration whose body holds the invocation owns the effect; an effect
    // no declaration holds is the module's own (it runs on import).
    const owner = declarations.find((entry) => invocation.position >= entry.start && invocation.position < entry.end) ?? null;
    effects.push({
      member,
      provider,
      capability,
      line: invocation.line,
      guarded: capability === REMOVAL && language === "js" && isGuarded(invocation.args),
      via: provider !== null ? "import" : "ambient",
      declaration: owner === null ? null : owner.name,
    });
  }

  const capabilities = new Set();
  for (const entry of imports) for (const kind of capabilitiesOf(entry.provider)) capabilities.add(kind);
  for (const program of programs) for (const kind of capabilitiesOf(program.program)) capabilities.add(kind);
  for (const effect of effects) capabilities.add(effect.capability);

  // The module-level edge: a bare call, made outside every declaration, whose
  // head names a declaration of this same module that performs an unguarded
  // removal — the module runs that removal at import time. Bounded to one file
  // and to names, like the rest of the analysis; a misattribution can only
  // raise a tier, never lower one.
  const removingDeclarations = new Set(
    effects
      .filter((entry) => entry.capability === REMOVAL && !entry.guarded && entry.declaration !== null)
      .map((entry) => entry.declaration),
  );
  const owns = (position) => declarations.find((entry) => position >= entry.start && position < entry.end) ?? null;
  const entryCall = removingDeclarations.size === 0
    ? null
    : invocations.find((invocation) =>
      invocation.head === invocation.member
      && owns(invocation.position) === null
      && removingDeclarations.has(invocation.head));
  const moduleEntry = entryCall === undefined || entryCall === null ? null : { name: entryCall.head, line: entryCall.line };

  return { language, imports, declarations, programs, effects, capabilities, moduleEntry };
}

/**
 * The removal a shell program names. A program that grants removal on its own
 * (`rm`, `shred`) removes whatever its flags say — an unguarded removal is how
 * one is written, so no flag list makes it safe. A program that only removes
 * under a flag (`find -delete`, `git clean -f`, `dd of=`) needs its flag.
 */
function shellRemoval(programs) {
  for (const program of programs) {
    const granted = capabilitiesOf(program.program).includes(REMOVAL);
    const flagRule = SH_REMOVAL_FLAGS.find((rule) => rule.program === program.program);
    const confirmed = flagRule !== undefined && flagRule.flag.test(program.args);
    if (!granted && !confirmed) continue;
    return { member: program.program, provider: program.program, line: program.line, via: "import" };
  }
  return null;
}

/** The embedded statement a text carries, if any. */
function statementRemoval(noComments) {
  for (const statement of STATEMENTS) {
    const match = statement.pattern.exec(noComments);
    if (match) return { member: statement.member, provider: null, line: lineTable(noComments)(match.index), via: "statement" };
  }
  return null;
}

/**
 * Analyse one file: what it can do, what it invokes, and the removal it reaches.
 *
 * @param {string} file repo-relative path (used for the language family).
 * @param {string} text the file's bytes.
 * @param {{ resolve?: (rel: string) => (string | null) }} [options]
 *   `resolve` answers a path relative to `file` with the module's bytes, or
 *   `null` when it cannot. Without it, a relative import is reported as
 *   unresolved and never guessed at.
 */
export function analyseSource(file, text, options = {}) {
  const language = languageOf(file);
  const base = {
    path: file,
    language,
    imports: [],
    effects: [],
    capabilities: [],
    declarations: [],
    unresolved: [],
    destructive: null,
  };
  if (language === null) return base;

  const scan = scanSource(file, text, language);
  const noComments = mask(text, language, { strings: false });
  const directories = file.includes("/") ? file.slice(0, file.lastIndexOf("/")) : "";

  // Only an effect no declaration holds runs at module level; a removal inside a
  // function is that function's capability, which the capability graph follows.
  const moduleRemoval = scan.effects.find(
    (effect) => effect.capability === REMOVAL && !effect.guarded && effect.declaration === null,
  ) ?? null;
  const destructive = moduleRemoval === null
    ? (scan.moduleEntry !== null
        ? { member: scan.moduleEntry.name, provider: null, line: scan.moduleEntry.line, via: "call" }
        : null) ?? shellRemoval(scan.programs) ?? statementRemoval(noComments)
    : {
      member: moduleRemoval.member,
      provider: moduleRemoval.provider ?? importsProviderOf(scan.imports, moduleRemoval.member),
      line: moduleRemoval.line,
      via: moduleRemoval.provider !== null ? "import" : "ambient",
    };

  const result = {
    ...base,
    imports: scan.imports.map((entry) => ({
      specifier: entry.specifier,
      provider: entry.provider,
      relative: entry.relative,
      members: entry.members,
      namespace: entry.namespace,
    })),
    effects: scan.effects.map(({ member, provider, capability, line, guarded, via, declaration }) => ({
      member, provider, capability, line, guarded, via, declaration,
    })),
    capabilities: [...scan.capabilities].sort(),
    declarations: scan.declarations.map(({ name, line }) => ({
      name,
      line,
      destructive: scan.effects.some((effect) => effect.capability === REMOVAL && !effect.guarded && effect.declaration === name),
    })),
    destructive,
  };
  if (destructive !== null) return result;

  // The capability graph: a removal one module away, through a relative import.
  const resolve = typeof options.resolve === "function" ? options.resolve : null;
  const depth = Number.isInteger(options.depth) ? options.depth : 0;
  const visited = new Set(options.visited ?? []);
  if (resolve === null || depth >= 4) {
    for (const entry of scan.imports) if (entry.relative) result.unresolved.push(entry.specifier);
    return result;
  }

  for (const entry of scan.imports) {
    if (!entry.relative) continue;
    const target = relativeTarget(directories, entry.specifier, language);
    if (target === null || visited.has(target)) continue;
    const body = resolve(target);
    if (body === null || body === undefined) {
      result.unresolved.push(entry.specifier);
      continue;
    }
    visited.add(target);
    const analysis = analyseSource(target, body, { ...options, depth: depth + 1, visited });

    // Which of the target's declarations this file actually calls: a named
    // import's local binding, or a namespace member (`purge.purgeAll`).
    const called = [];
    for (const member of entry.members) called.push({ exported: member.name, local: member.local });
    if (entry.namespace !== null) {
      for (const effect of scan.effects) {
        if (effect.head === entry.namespace) called.push({ exported: effect.member, local: `${entry.namespace}.${effect.member}` });
      }
    }
    const removing = called.find((candidate) =>
      analysis.declarations.some((declaration) => declaration.name === candidate.exported && declaration.destructive));
    if (removing) {
      return {
        ...result,
        destructive: {
          member: removing.local,
          provider: entry.specifier,
          line: null,
          via: "import",
          declaredIn: target,
        },
      };
    }
    if (analysis.destructive !== null) {
      return {
        ...result,
        destructive: {
          member: "(module-level)",
          provider: entry.specifier,
          line: null,
          via: "import",
          declaredIn: target,
        },
      };
    }
  }
  return result;
}

/** The provider a resolved member came from, when the binding named none. */
function importsProviderOf(imports, member) {
  const binding = imports.find((entry) => entry.members.some((candidate) => candidate.name === member || candidate.local === member));
  return binding ? binding.provider : null;
}

/** A relative specifier resolved against the importing file's directory. */
function relativeTarget(directory, specifier, language) {
  const join = (parts) => {
    const stack = [];
    for (const part of parts) {
      if (part === "" || part === ".") continue;
      if (part === "..") stack.pop();
      else stack.push(part);
    }
    return stack.join("/");
  };
  if (language === "py") {
    const trimmed = specifier.replace(/^\.+/, "");
    const dots = specifier.length - specifier.replace(/^\./, "").length;
    const anchor = dots > 1 ? directory.split("/").slice(0, Math.max(0, directory.split("/").length - (dots - 1))).join("/") : directory;
    const base = join([anchor, trimmed.split(".").join("/")]);
    return base === "" ? null : `${base}.py`;
  }
  const base = join([directory, specifier]);
  if (base === "") return null;
  return /\.[a-z]+$/i.test(base) ? base : `${base}.mjs`;
}

/** The removal a file reaches, or `null` — the classifier's one question. */
export function destructiveOf(file, text, options = {}) {
  return analyseSource(file, text, options).destructive;
}

/**
 * Analyse a change set (`path → contents`): the same analysis, one map, for a
 * caller that wants the whole picture. Never reads anything it was not handed.
 */
export function analyseChange(files, options = {}) {
  const entries = files instanceof Map ? [...files.entries()] : Object.entries(files ?? {});
  const analyses = new Map();
  for (const [file, text] of entries) analyses.set(file, analyseSource(file, String(text ?? ""), options));
  return analyses;
}
