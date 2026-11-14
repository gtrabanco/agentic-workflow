/**
 * Embeddings write path for the `doc` retrieval index (unit 65, P6; resilience
 * by issue #443 S3).
 *
 * D10 provider resolution: CLI flag > direct pi-style environment variables
 * > the config-named env var + config file > default (none ⇒ keyword-only,
 * never a hard failure). Vectors are float32-LE blobs behind a format tag
 * (D4) with the producing model pinned per row and in the store meta — a
 * model mismatch fails closed: nothing re-embeds and no cross-model store
 * can form (AC18); `--rebuild` under the new model is the documented path.
 *
 * Incrementalism (AC16): embedding runs only over chunks with no stored
 * vector, so a warm sync makes 0 API calls (AC19's write half) and changing
 * one file re-embeds exactly that file's chunks.
 *
 * Resilience (issue #443 S3/S9, decisions D4/D5): one request carries at most
 * `batchSize` texts, request starts are paced at `requestsPerMinute`, and a
 * retryable failure (429, 5xx, a network error, a named `Retry-After`) is
 * retried with exponential backoff before the pass aborts. Every landed batch
 * commits its rows and — on the first one — pins the store's model, so a run
 * that stops part-way resumes from the store's own pending predicate instead of
 * re-embedding what already landed.
 *
 * Bounded requests and rejection containment (fix #540 S2/S4/S5): a request
 * never carries more characters than the request budget, so a batch cannot
 * outgrow the provider's input window; and a provider that *rejects* a request
 * (a non-rate-limit 4xx: input too large, unknown model, bad credentials) ends
 * that batch's future, never the pass. The rejected chunks stay pending, the
 * rest embed, and the result names every skipped chunk together with the
 * provider's status and body excerpt. The provider being down — a retryable
 * failure whose ladder is exhausted, or a transport error — still stops the
 * pass: that is a different diagnosis and a different degradation.
 */

export const VECTOR_TAG = "awkvec-f32le1";

import { openDatabase } from "./sqlite.mjs";
import { storePath } from "./store.mjs";
import { loadConfig, resolveMaxRequestChars } from "./config.mjs";

const DIRECT_ENV = {
  baseUrl: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL",
  model: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MODEL",
  apiKey: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_API_KEY",
};

/**
 * The pacing/write-policy defaults — the provider's published limits
 * (`32 texts/batch`, `60 requests/min`) plus a bounded retry ladder. Every one
 * of them is overridable (config `provider.pacing`, then the
 * `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_<PARAM>` environment variables), so an
 * operator never edits code to match a provider's real limits (issue #443 S10).
 */
export const DEFAULT_PACING = Object.freeze({
  batchSize: 32,
  requestsPerMinute: 60,
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 60000,
});

const PACING_ENV = Object.freeze({
  batchSize: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BATCH_SIZE",
  requestsPerMinute: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_REQUESTS_PER_MINUTE",
  maxAttempts: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_ATTEMPTS",
  baseDelayMs: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_DELAY_MS",
  maxDelayMs: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_DELAY_MS",
});

/** A pacing parameter, or a named refusal — a zero/NaN pace is never accepted. */
function positiveInteger(value, name) {
  const parsed = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `invalid pacing parameter ${name}: ${JSON.stringify(value)} (expected a positive integer; ` +
        `set it in index.json provider.pacing or ${PACING_ENV[name]})`,
    );
  }
  return parsed;
}

/**
 * Resolve the pacing/write policy once: `cli` > environment > config
 * `provider.pacing` > the shipped defaults (D4). Every value is validated, so
 * no loop downstream can pace on `NaN`.
 */
export function resolvePacing({ config = {}, env = {}, cli = {} } = {}) {
  const own = config.provider?.pacing ?? {};
  const resolved = {};
  for (const name of Object.keys(DEFAULT_PACING)) {
    const envName = PACING_ENV[name];
    const raw = cli[name] ?? (envName ? env[envName] : undefined) ?? own[name] ?? DEFAULT_PACING[name];
    resolved[name] = positiveInteger(raw, name);
  }
  return resolved;
}

/** A failure worth another attempt: a rate limit, a server fault, a timeout, or no status at all (network). */
function isRetryable(error) {
  const status = error?.status;
  if (status === undefined || status === null) return true;
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

/**
 * A request the provider answered with a refusal: a non-rate-limit 4xx (input
 * too large, an unknown model, bad credentials). Retrying cannot help — the same
 * request produces the same refusal — and the pass must skip it rather than
 * report the provider as down (fix #540 S2). A status-less error is *not* a
 * rejection: it is a transport failure, which the retry policy owns.
 */
function isRejected(error) {
  const status = error?.status;
  if (typeof status !== "number") return false;
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

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
 * returns junk vectors — and the error carries the machine-readable pieces
 * the retry policy branches on (`status`, and `retryAfter` when the provider
 * names one), never a message a caller has to parse.
 *
 * The provider's own diagnosis is carried too (fix #540 S4): a failed response's
 * body is read once, bounded, and folded into the error's message. The text is
 * the only place a provider says *why* it refused (`Context length exceeded for
 * model … maximum context length is 32768 tokens`), and discarding it left the
 * operator with a `provider down` label and no way to reach the cause.
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
        const excerpt = await responseBodyExcerpt(response);
        const error = new Error(
          `embeddings provider ${response.status} ${response.statusText ?? ""}${excerpt ? `: ${excerpt}` : ""}`.trim(),
        );
        error.status = response.status;
        if (excerpt) error.body = excerpt;
        const retryAfter = response.headers?.get?.("retry-after");
        const seconds = Number(retryAfter);
        if (retryAfter && Number.isFinite(seconds) && seconds >= 0) error.retryAfter = seconds;
        throw error;
      }
      const data = await response.json();
      return data.data.map((d) => d.embedding);
    },
  };
}

/** The longest provider body excerpt an error message carries — a diagnosis, not a payload. */
const BODY_EXCERPT_LIMIT = 400;

/** A failed response's body, bounded and whitespace-collapsed; "" when it cannot be read. */
async function responseBodyExcerpt(response) {
  if (typeof response.text !== "function") return "";
  try {
    const text = await response.text();
    return String(text).replace(/\s+/g, " ").trim().slice(0, BODY_EXCERPT_LIMIT);
  } catch {
    // A consumed or broken stream is not the diagnosis: the status still is.
    return "";
  }
}

/**
 * Counts the write path and the native report need, over one store: embedded
 * rows, pending rows (no vector), rows embedded under a foreign model, and the
 * store's pinned model. A store without the chunks/meta tables (never synced)
 * answers zeros instead of throwing — the caller is asking a question, not
 * proving a table exists.
 */
export async function embeddingStats(root, model = null) {
  const { db } = await openDatabase(storePath(root));
  try {
    const tables = new Set(
      db.prepare("select name from sqlite_master where type = 'table'").all().map((row) => row.name),
    );
    if (!tables.has("chunks")) return { embedded: 0, pending: 0, foreign: 0, model: null };
    const columns = db.prepare("pragma table_info(chunks)").all().map((row) => row.name);
    if (!columns.includes("embedding")) return { embedded: 0, pending: 0, foreign: 0, model: null };
    const embedded = db.prepare("select count(*) as n from chunks where embedding is not null").get().n;
    const pending = db.prepare("select count(*) as n from chunks where embedding is null").get().n;
    const foreign =
      model === null
        ? 0
        : db
            .prepare(
              "select count(*) as n from chunks where embedding is not null and (emb_model is null or emb_model is not ?)",
            )
            .get(model).n;
    const pinned = tables.has("meta") ? db.prepare("select value from meta where key = 'emb_model'").get() : null;
    return { embedded, pending, foreign, model: pinned ? pinned.value : null };
  } finally {
    db.close();
  }
}

/**
 * Embed every chunk that has no stored vector. The store's pinned model (meta
 * `emb_model`) fails closed on mismatch (AC18): the new provider is never
 * called, the old vectors stay consistent, and the caller degrades —
 * `--rebuild` re-embeds under the new model. Returns
 * `{embedded, calls, model, rejected}` or `{skipped: true, reason}`.
 *
 * `rejected` is one entry per refused request — `{status, message, chunks}`,
 * where `chunks` names every chunk that batch carried by `path`/`section`. Those
 * chunks stay pending (never invented, never partially written); the pass goes
 * on. An empty array means nothing was refused.
 *
 * Resilience (issue #443 S3/S9, D4/D5): `opts` carries the seams a test owns —
 * `pacing` (a partial merged over the resolved policy), `maxRequestChars` (the
 * request budget), `sleep`, `now` and `random`; production resolves the policy
 * and the budget from the config + environment and sleeps for real.
 */
export async function embedPendingChunks(root, provider, opts = {}) {
  const config = loadConfig(root);
  const pacing = { ...resolvePacing({ config, env: process.env }), ...(opts.pacing ?? {}) };
  for (const name of Object.keys(DEFAULT_PACING)) pacing[name] = positiveInteger(pacing[name], name);
  const maxRequestChars =
    opts.maxRequestChars ?? resolveMaxRequestChars({ config, env: process.env });
  const sleep = opts.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const now = opts.now ?? (() => Date.now());
  const random = opts.random ?? Math.random;

  const { db } = await openDatabase(storePath(root));
  try {
    ensureEmbeddingColumns(db);
    const pinned = db.prepare("select value from meta where key = 'emb_model'").get();
    if (pinned && pinned.value !== provider.model) {
      return { skipped: true, reason: "embeddings-model-mismatch", model: provider.model, stored: pinned.value };
    }

    const pin = () =>
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('emb_model', ?)").run(provider.model);

    const pending = db
      .prepare(
        "select rowid, path, section, body from chunks where embedding is null order by path, rowid",
      )
      .all();
    if (pending.length === 0) {
      pin();
      return { embedded: 0, calls: 0, model: provider.model, rejected: [] };
    }

    let calls = 0;
    let embedded = 0;
    let lastStart = null;
    const rejected = [];

    // Pacing: two request starts are never closer than the configured interval.
    const pace = async () => {
      if (lastStart !== null) {
        const interval = 60000 / pacing.requestsPerMinute;
        const elapsed = now() - lastStart;
        if (elapsed < interval) await sleep(interval - elapsed);
      }
      lastStart = now();
    };

    // One request, retried on a retryable failure with bounded exponential
    // backoff (and `Retry-After` when the provider named one).
    const request = async (texts) => {
      for (let attempt = 1; ; attempt += 1) {
        await pace();
        calls += 1;
        try {
          return await provider.embed(texts);
        } catch (error) {
          if (!isRetryable(error) || attempt >= pacing.maxAttempts) throw error;
          const backoff = Math.min(pacing.maxDelayMs, pacing.baseDelayMs * 2 ** (attempt - 1));
          const jitter = Math.floor(random() * backoff * 0.25);
          const named = error?.retryAfter === undefined ? 0 : error.retryAfter * 1000;
          await sleep(Math.max(named, backoff + jitter));
        }
      }
    };

    let batch = [];
    let batchChars = 0;
    const flush = async () => {
      if (batch.length === 0) return;
      const carrying = batch;
      batch = [];
      batchChars = 0;
      let vectors;
      try {
        vectors = await request(carrying.map((c) => c.body));
      } catch (error) {
        // A refusal ends the batch's future, never the pass (fix #540 S2): the
        // chunks stay pending and the caller reports them with the provider's
        // own status and body. Anything else is the provider being down.
        if (!isRejected(error)) throw error;
        rejected.push({
          status: error.status ?? null,
          message: error.message,
          chunks: carrying.map((c) => ({ path: c.path, section: c.section })),
        });
        return;
      }
      if (!Array.isArray(vectors) || vectors.length !== carrying.length) {
        throw new Error(
          `embeddings provider returned ${vectors?.length ?? 0} vectors for ${carrying.length} texts`,
        );
      }
      // D5: the pin names the model that produced the first stored vector, so a
      // pass that stops part-way can never leave an unpinned, mixed store.
      if (embedded === 0) pin();
      for (let i = 0; i < carrying.length; i++) {
        db.prepare("update chunks set embedding = ?, emb_model = ? where rowid = ?").run(
          encodeVector(vectors[i]),
          provider.model,
          carrying[i].rowid,
        );
        embedded += 1;
      }
    };

    let currentPath = null;
    for (const chunk of pending) {
      if (currentPath !== null && chunk.path !== currentPath) await flush();
      currentPath = chunk.path;
      // The provider refuses more text than its input window holds; the budget,
      // the batch cap and the file boundary are all respected, and a chunk that
      // alone crosses the budget gets its own request (so it is dropped alone,
      // never dragging well-sized chunks with it — fix #540 S2a/S5).
      if (batch.length > 0 && batchChars + chunk.body.length > maxRequestChars) await flush();
      batch.push(chunk);
      batchChars += chunk.body.length;
      // The provider refuses more texts than its batch cap; the cap, never the
      // file boundary, is what a request must respect (D4).
      if (batch.length >= pacing.batchSize) await flush();
    }
    await flush();

    pin();
    return { embedded, calls, model: provider.model, rejected };
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
