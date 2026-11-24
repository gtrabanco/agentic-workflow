// jsonc.mjs — the one JSONC reader this package's data files need.
//
// `catalog/nan-catalog-2026-11.jsonc` is a recorded third-party document: it
// carries comments (provenance notes) and bare `base_url:`-style keys exactly as
// the provider's panel and docs publish them, so it is read as JSONC and never
// rewritten into JSON. Two consumers read it — the parity suite and the
// capability-record derivation — and this module is the single implementation
// (a second one would parse the same file into a different object).

/**
 * Parse JSONC text: comments removed, `//` inside string values (URLs) kept, and
 * bare object keys quoted.
 *
 * @param {string} text
 * @returns {unknown}
 */
export function parseJsoncText(text) {
  let out = "";
  let inString = false;
  let escaped = false;
  let token = "";
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      token += ch;
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      token += ch;
      continue;
    }
    if (ch === "/" && text[i + 1] === "/") {
      const end = text.indexOf("\n", i);
      i = end === -1 ? text.length : end - 1;
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end === -1 ? text.length : end + 1;
      continue;
    }
    token += ch;
  }
  out = token.replace(
    /(^|[,{\n])(\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):/gu,
    (m, lead, space, key, tail) => `${lead}${space}"${key}"${tail}:`,
  );
  return JSON.parse(out);
}
