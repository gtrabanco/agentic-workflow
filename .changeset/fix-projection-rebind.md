---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(pi-agentic-workflow): re-derive the projection digest the release stamp moves (issue #723)

The release stampers rewrite `@gtrabanco/agentic-workflow@<pin>` inside the span the pi projection's `runner-invocation-not-shipped` rule hash-binds, so every cut moved the exact bytes that digest binds and the next `bundle:skills` failed closed with `hash-mismatch` (a canary cut's re-stage hit this on 2026-11-25, run 45527171331). The projection module gains the exported `reboundContentHashes(sourceText, rules, context)` — the digest each rule binds when applied to the text as it stands, computed in apply order by the same locator and hashing the projection itself runs. `scripts/release.mjs` calls it wherever it stamps the pin — the stable train's committed `apply` and the canary's staged `publish-stage` — and rewrites `projection-manifest.json` beside the bytes it stamped; the canary's restore (`publish.yml` and the restore the stage prints) covers the rebound manifest. A rule whose section the stamped bytes can no longer locate still raises: that stays a human re-verify, never an automatic rebound.
