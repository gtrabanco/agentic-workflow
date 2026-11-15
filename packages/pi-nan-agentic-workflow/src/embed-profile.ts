// src/embed-profile.ts
// The NaN doc-index embedding profile (issue #541 S3).
//
// The retrieval index reads exactly one thing for its embeddings provider: the
// committed `.agentic-workflow/index.json` `provider` block. What a *provider*
// needs there is provider data, so it lives here — endpoint, model, key
// variable, a chunk limit the model's input window tolerates, and the pace the
// key's request cap tolerates — and nowhere else.
//
// The values derive from the recorded catalog snapshot
// (`catalog/nan-catalog-2026-11.jsonc`, provenance in its header):
//
//   baseUrl           ← `base_url`                      https://api.nan.builders/v1
//   model             ← the `embedding` model's `slug`  qwen3-embedding
//                       (cost 0, dimensions 4096, max_input 32768 tokens)
//   requestsPerMinute ← `rate_limits.requests_per_minute` 60
//
// Two values are measurements, not catalog rows: `chunk_limit` and
// `batchSize`. This repository hand-derived `6000` chars × `6` texts on its own
// 10.9K-chunk corpus (fix #540), and that pair is what the preset ships: one
// request carries at most 36,000 characters ≈ 9,000 tokens, a third of the
// model's 32,768-token window, so even dense prose cannot outgrow a request and
// the crate's 90,000-character request budget never has to truncate.
//
// `maxAttempts` and the two delays are deliberately absent: no provider document
// defines them, and the crate's shipped retry ladder is the honest default.
//
// The object is the *literal* `provider` block — no key mapping, no derivation at
// runtime — and it is typed against the crate's own schema through the main
// package's re-export, so a typo fails this package's build instead of staging an
// unusable config in a user's project.

import type { ProviderConfig } from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";

export const NAN_EMBED_PROFILE = Object.freeze({
  baseUrl: "https://api.nan.builders/v1",
  model: "qwen3-embedding",
  envVar: "NAN_API_KEY",
  chunk_limit: 6000,
  pacing: { batchSize: 6, requestsPerMinute: 60 },
  // `satisfies` (not an annotation) so the literal is checked against the crate's
  // block — an unknown key or a wrong value type fails this package's build.
} satisfies ProviderConfig);
