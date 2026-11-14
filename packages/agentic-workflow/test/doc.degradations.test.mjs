/**
 * The `doc` degradation vocabulary, published and closed (fix #540 S3).
 *
 * The runtime close lives in `envelope.mjs` (`degradationIsKnown`, the guard
 * `buildEnvelope` fails on) and the declaration lives in the schema package
 * (`packages/agentic-workflow-schema/src/doc-envelope.ts`). The `doc` path is the
 * crate's cold path and has no build step, so the runtime cannot import the
 * package's `dist`; this suite pins the two together by reading the published
 * source, the pattern `test/resolve-passes.test.mjs` already uses for
 * `vocabularies.ts`.
 *
 * The published set is the *enumerated* tokens. Two families stay open by
 * design — `unavailable-sqlite-<runtime>` and `unavailable-embeddings-<cause>` —
 * and the cases below keep that openness pinned so a future closure is a
 * deliberate change rather than an accident.
 */

import { describe, it } from "node:test";
import { ok, strictEqual, deepStrictEqual } from "node:assert";
import { readFileSync } from "node:fs";

import { degradationIsKnown, buildEnvelope } from "../src/doc/envelope.mjs";

const SCHEMA_FILE = new URL("../../agentic-workflow-schema/src/doc-envelope.ts", import.meta.url);
const SCHEMA_INDEX = new URL("../../agentic-workflow-schema/src/index.ts", import.meta.url);

/** The values of `export const DOC_DEGRADATIONS = [ … ] as const;` in committed source. */
function publishedDegradations() {
  const source = readFileSync(SCHEMA_FILE, "utf8");
  const match = /export const DOC_DEGRADATIONS\s*=\s*(?:Object\.freeze\(\s*)?\[([\s\S]*?)\]\s*(?:as const)?\s*\)?\s*;/.exec(
    source,
  );
  if (!match) throw new Error(`DOC_DEGRADATIONS is not published in ${SCHEMA_FILE.pathname}`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** Tokens the runtime close reserves for a family, never for one enumerated value. */
const OPEN_FAMILY_EMISSIONS = ["unavailable-sqlite-node", "unavailable-sqlite-bun", "unavailable-embeddings-http-401"];

describe("S3 published degradation vocabulary", () => {
  it("S3: the schema package publishes the set and re-exports the module", () => {
    const published = publishedDegradations();
    ok(published.length >= 7, `published ${published.length} values`);
    const index = readFileSync(SCHEMA_INDEX, "utf8");
    ok(/from "\.\/doc-envelope\.js"/.test(index), "src/index.ts must re-export the vocabulary module");
  });

  it("S3: every published value is accepted by the runtime close", () => {
    for (const value of publishedDegradations()) {
      ok(degradationIsKnown(value), `the runtime close refuses the published value ${value}`);
    }
  });

  it("S3: the rejection cause is published and distinct from provider-down", () => {
    const published = publishedDegradations();
    ok(published.includes("embeddings-request-rejected"), JSON.stringify(published));
    ok(published.includes("unavailable-embeddings-provider-down"), JSON.stringify(published));
    strictEqual(
      published.filter((value) => value.startsWith("unavailable-") && value.includes("rejected")).length,
      0,
      "a rejection is not an unavailability",
    );
  });

  it("S3: a token the schema does not publish is refused by the runtime close", () => {
    strictEqual(degradationIsKnown("embeddings-request-failed"), false);
    strictEqual(degradationIsKnown("embeddings-rejected"), false);
    strictEqual(degradationIsKnown("not-a-degradation"), false);
  });

  it("S3: the two open families stay open (no accident closure)", () => {
    for (const value of OPEN_FAMILY_EMISSIONS) ok(degradationIsKnown(value), value);
    strictEqual(degradationIsKnown("unavailable-sqlite-win32"), false, "the runtime family is closed to node|bun");
    strictEqual(degradationIsKnown("unavailable-embeddings-provider-down"), true);
  });

  it("S3: buildEnvelope accepts the rejection key and still fails closed on an unknown value", () => {
    const env = buildEnvelope({ command: "sync", degradations: ["embeddings-request-rejected", "chunk-too-large"] });
    deepStrictEqual(env.degradations, ["embeddings-request-rejected", "chunk-too-large"]);
    let thrown = null;
    try {
      buildEnvelope({ command: "sync", degradations: ["embeddings-request-failed"] });
    } catch (error) {
      thrown = error;
    }
    ok(thrown !== null, "an unknown degradation must throw");
    ok(/vocabulary is closed/.test(thrown.message), thrown.message);
  });
});
