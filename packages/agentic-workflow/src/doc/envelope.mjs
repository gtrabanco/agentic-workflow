/**
 * Canonical envelope for the `doc` retrieval entry point (unit 65, D3).
 *
 * Under `--json-only` stdout carries exactly one JSON document:
 *   {ok, command, results[], degradations[], store}
 * with the frozen key order above and result rows
 *   {path, section, lines, score, meta}
 * in that order. `lines` is a 1-based inclusive [start, end] pair (D5).
 * No timestamps anywhere (AC2/AC12): the envelope is byte-stable for an
 * unchanged corpus and answer.
 *
 * `degradations[]` is a CLOSED vocabulary frozen here and asserted by test:
 *   unavailable-sqlite-<runtime>        (runtime ∈ {node, bun})
 *   unavailable-embeddings-not-configured
 *   unavailable-embeddings-<cause>      (kebab-case cause)
 *   embeddings-model-mismatch           (AC18 fails closed)
 * An unknown value is rejected at construction time — it fails, never ships.
 *
 * Exit codes (D3): 0 success including degraded · 1 usage/IO · 2 path
 * refusal (edit services only).
 */

// Lazy TypeBox import — typebox is only loaded when validateEnvelope is called.
// The bin/hook path that builds envelopes (buildEnvelope, buildResultRow)
// never calls validateEnvelope, so the cold path stays typebox-free.

let _Type = null;
let _Compile = null;

async function ensureTypes() {
  if (_Type === null) {
    const mod = await import("typebox");
    _Type = mod.Type;
    const compileMod = await import("typebox/compile");
    _Compile = compileMod.Compile;
  }
  return { Type: _Type, Compile: _Compile };
}

let _ResultRowSchema = null;
let _EnvelopeSchema = null;

async function ensureSchemas() {
  if (_ResultRowSchema === null) {
    const { Type, Compile } = await ensureTypes();
    _ResultRowSchema = Type.Object({
      path: Type.String(),
      section: Type.Union([Type.String(), Type.Null()]),
      lines: Type.Tuple([Type.Integer({ minimum: 1 }), Type.Integer({ minimum: 1 })]),
      score: Type.Number(),
      meta: Type.Record(Type.String(), Type.Unknown()),
    });
    _EnvelopeSchema = Type.Object({
      ok: Type.Boolean(),
      command: Type.Union(DOC_COMMANDS.map((c) => Type.Literal(c))),
      results: Type.Array(_ResultRowSchema),
      degradations: Type.Array(Type.String()),
      store: Type.Union([Type.Null(), Type.Record(Type.String(), Type.Unknown())]),
    });
  }
  return { _ResultRowSchema, _EnvelopeSchema };
}

export const DOC_COMMANDS = ["sync", "query", "status", "rebuild"];

const DEGRADATION_PATTERNS = [
  /^unavailable-sqlite-(node|bun)$/,
  /^unavailable-embeddings-not-configured$/,
  /^unavailable-embeddings-[a-z0-9]+(?:-[a-z0-9]+)*$/,
  /^embeddings-model-mismatch$/,
];

/** True only for values in the closed degradation vocabulary (D3). */
export function degradationIsKnown(degradation) {
  return DEGRADATION_PATTERNS.some((re) => re.test(degradation));
}


let _compiled = null;

async function getCompiled() {
  if (_compiled === null) {
    const { _EnvelopeSchema: EnvelopeSchema } = await ensureSchemas();
    const { Compile } = await ensureTypes();
    _compiled = Compile(EnvelopeSchema);
  }
  return _compiled;
}

/** TypeBox validation of a full envelope. Returns `{ok, errors[]}`. */
export async function validateEnvelope(value) {
  const Compiled = await getCompiled();
  const ok = Compiled.Check(value);
  const errors = ok
    ? []
    : [...Compiled.Errors(value)].map((e) => `${e.path || "/"}: ${e.message}`);
  return { ok, errors };
}

/**
 * Build the canonical envelope. Key order is the contract — constructed as a
 * literal in the frozen order. Unknown commands and unknown degradations
 * throw (fail closed, D3).
 */
export function buildEnvelope({ command, results = [], degradations = [], store = null, ok = true }) {
  if (!DOC_COMMANDS.includes(command)) {
    throw new Error(`usage: unknown doc command "${command}" (expected one of ${DOC_COMMANDS.join("|")})`);
  }
  for (const d of degradations) {
    if (!degradationIsKnown(d)) {
      throw new Error(`unknown degradation "${d}" — the vocabulary is closed (D3)`);
    }
  }
  return { ok, command, results, degradations: [...degradations], store };
}

/** Build one result row in the frozen key order. */
export function buildResultRow({ path, section = null, lines, score, meta = {} }) {
  return { path, section, lines: [lines[0], lines[1]], score, meta };
}