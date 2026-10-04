/**
 * Embeddings write path for the `doc` retrieval index (unit 65, P6).
 *
 * D10 provider resolution: CLI flag > direct pi-style environment variables
 * > the config-named env var + config file > default (none ⇒ keyword-only,
 * never a hard failure). Vectors are float32-LE blobs behind a format tag
 * (D4) with the producing model pinned per row and in the store meta — a
 * model mismatch fails closed: nothing re-embeds and no cross-model store
 * can form (AC18); `--rebuild` under the new model is the documented path.
 *
 * Incrementalism (AC16): embedding runs only over chunks with no stored
 * vector, batched per file, so a warm sync makes 0 API calls (AC19's write
 * half) and changing one file re-embeds exactly that file's chunks.
 */

export const VECTOR_TAG = "awkvec-f32le1";

import { openDatabase } from "./sqlite.mjs";
import { storePath } from "./store.mjs";

const DIRECT_ENV = {
  baseUrl: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL",
  model: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MODEL",
  apiKey: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_API_KEY",
};

/** Encode a float vector as the tagged little-endian float32 blob. */
export function encodeVector(vector) {
  const header = Buffer.from(VECTOR_TAG, "binary");
  const payload = Buffer.alloc(vector.length * 4);
  for (let i = 0; i < vector.length; i++) payload.writeFloatLE(vector[i], i * 4);
  return Buffer.concat([header, payload]);
}

/** Decode a tagged float32-LE blob; refuses blobs without the format tag. */
export function decodeVector(blob) {
  const bytes = Buffer.isBuffer(blob) ? blob : Buffer.from(blob);
  if (bytes.length < VECTOR_TAG.length || bytes.subarray(0, VECTOR_TAG.length).toString("binary") !== VECTOR_TAG) {
    throw new Error("embedding blob is missing the format tag — refusing to guess the layout");
  }
  const payload = bytes.subarray(VECTOR_TAG.length);
  const out = new Array(payload.length / 4);
  for (let i = 0; i < out.length; i++) out[i] = payload.readFloatLE(i * 4);
  return out;
}

/**
 * Resolve the embedding provider config (D10):
 * `cli` > direct pi-style env vars > the config file (with the key read
 * from the config-named env var) > default (none). Returns
 * `{configured: true, baseUrl, model, apiKey}` or `{configured: false}`.
 */
export function resolveEmbedConfig({ config = {}, env = {}, cli = {} } = {}) {
  const provider = config.provider ?? {};
  const pick = (cliValue, envName, configValue) =>
    cliValue ?? (envName ? env[envName] : undefined) ?? configValue ?? null;
  const baseUrl = pick(cli.baseUrl, DIRECT_ENV.baseUrl, provider.baseUrl);
  const model = pick(cli.model, DIRECT_ENV.model, provider.model);
  const apiKey = pick(cli.apiKey, DIRECT_ENV.apiKey, provider.envVar ? env[provider.envVar] : undefined);
  if (!baseUrl || !model || !apiKey) return { configured: false };
  return { configured: true, baseUrl, model, apiKey };
}

/**
 * OpenAI-compatible embeddings provider. One POST per batch; `fetchImpl`
 * is injectable for tests. A failed call throws — it never silently
 * returns junk vectors.
 */
export function makeOpenAIProvider({ baseUrl, apiKey, model, fetchImpl } = {}) {
  const doFetch = fetchImpl ?? ((url, init) => fetch(url, init));
  return {
    model,
    async embed(texts) {
      const response = await doFetch(`${baseUrl.replace(/\/$/, "")}/embeddings`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input: texts }),
      });
      if (!response.ok) {
        throw new Error(`embeddings provider ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.data.map((d) => d.embedding);
    },
  };
}

/**
 * Embed every chunk that has no stored vector, batched per file. The
 * store's pinned model (meta `emb_model`) fails closed on mismatch (AC18):
 * the new provider is never called, the old vectors stay consistent, and
 * the caller degrades — `--rebuild` re-embeds under the new model.
 * Returns `{embedded, calls, model}` or `{skipped: true, reason}`.
 */
export async function embedPendingChunks(root, provider) {
  const { db } = await openDatabase(storePath(root));
  try {
    ensureEmbeddingColumns(db);
    const pinned = db.prepare("select value from meta where key = 'emb_model'").get();
    if (pinned && pinned.value !== provider.model) {
      return { skipped: true, reason: "embeddings-model-mismatch", model: provider.model, stored: pinned.value };
    }

    const pending = db
      .prepare(
        "select rowid, path, body from chunks where embedding is null order by path, rowid",
      )
      .all();
    if (pending.length === 0) {
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('emb_model', ?)").run(provider.model);
      return { embedded: 0, calls: 0, model: provider.model };
    }

    let calls = 0;
    let embedded = 0;
    let batch = [];
    const flush = async () => {
      if (batch.length === 0) return;
      const vectors = await provider.embed(batch.map((c) => c.body));
      calls += 1;
      for (let i = 0; i < batch.length; i++) {
        db.prepare("update chunks set embedding = ?, emb_model = ? where rowid = ?").run(
          encodeVector(vectors[i]),
          provider.model,
          batch[i].rowid,
        );
        embedded += 1;
      }
      batch = [];
    };

    let currentPath = null;
    for (const chunk of pending) {
      if (currentPath !== null && chunk.path !== currentPath) await flush();
      currentPath = chunk.path;
      batch.push(chunk);
    }
    await flush();

    db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('emb_model', ?)").run(provider.model);
    return { embedded, calls, model: provider.model };
  } finally {
    db.close();
  }
}

/** The store's pinned embedding model (null before the first embed). */
export async function storedEmbeddingModel(root) {
  const { db } = await openDatabase(storePath(root));
  try {
    const row = db.prepare("select value from meta where key = 'emb_model'").get();
    return row ? row.value : null;
  } finally {
    db.close();
  }
}

function ensureEmbeddingColumns(db) {
  const cols = db.prepare("pragma table_info(chunks)").all().map((c) => c.name);
  if (!cols.includes("embedding")) db.exec("ALTER TABLE chunks ADD COLUMN embedding BLOB");
  if (!cols.includes("emb_model")) db.exec("ALTER TABLE chunks ADD COLUMN emb_model TEXT");
}
