/**
 * TypeBox schemas for the derived structure index (issue #366, AC5).
 *
 * The index document is validated at the shape's boundary — the same policy
 * the retrieval envelope follows (`src/doc/envelope.mjs`): one owner per
 * schema, lazily compiled, fail closed on an unknown value. An index that
 * does not validate is refused, never repaired silently.
 */

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

/** The index document's version literal. Bumping it is a new unit, not an edit. */
export const DOC_INDEX_VERSION = 1;

let _IndexSchema = null;

async function ensureIndexSchema() {
  if (_IndexSchema === null) {
    const { Type } = await ensureTypes();
    _IndexSchema = Type.Object({
      version: Type.Literal(DOC_INDEX_VERSION),
      files: Type.Array(
        Type.Object({
          path: Type.String(),
          kind: Type.Union([Type.Literal("skill"), Type.Literal("doc")]),
          frontmatter: Type.Record(Type.String(), Type.Unknown()),
          triggers: Type.Array(Type.String()),
          sections: Type.Array(
            Type.Object({
              id: Type.String(),
              title: Type.String(),
              depth: Type.Integer({ minimum: 1, maximum: 6 }),
              lines: Type.Tuple([Type.Integer({ minimum: 1 }), Type.Integer({ minimum: 1 })]),
            }),
          ),
        }),
      ),
      units: Type.Array(
        Type.Object({
          path: Type.String(),
          type: Type.Union(["feature", "fix", "docs", "chore"].map((t) => Type.Literal(t))),
          phases: Type.Array(
            Type.Object({
              id: Type.String(),
              status: Type.Union([Type.Literal("complete"), Type.Literal("open")]),
            }),
          ),
          previous: Type.Union([Type.String(), Type.Null()]),
          current: Type.Union([Type.String(), Type.Null()]),
          next: Type.Union([Type.String(), Type.Null()]),
          dependencies: Type.Array(Type.String()),
        }),
      ),
    });
  }
  return _IndexSchema;
}

/** TypeBox validation of a full index document. Returns `{ok, errors[]}`. */
export async function validateDocIndex(value) {
  const schema = await ensureIndexSchema();
  const { Compile } = await ensureTypes();
  const compiled = Compile(schema);
  const ok = compiled.Check(value);
  const errors = ok ? [] : [...compiled.Errors(value)].map((e) => `${e.path || "/"}: ${e.message}`);
  return { ok, errors };
}
