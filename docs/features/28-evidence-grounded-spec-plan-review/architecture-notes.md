# architecture-notes — 28-evidence-grounded-spec-plan-review

## Authority flow

```text
human product authority
  -> design-feature + evidence grounding
  -> deterministic SPEC readiness (cannot approve)
  -> review-spec (read-only)
  -> plan-feature | plan-fix + evidence grounding
  -> deterministic Plan readiness (cannot approve)
  -> review-plan (read-only)
  -> feature 29 implementation discovery
  -> execute/verify
  -> review-change/fold only source-local findings
  -> audit-pr (sole MERGE-READY authority)
```

Product or Plan root-cause findings travel backward to their owner. They never
become permission for an executor or reviewer to amend authority.

The first review produces one complete unioned findings set, repaired as one
root-caused owner batch before one re-review. A second correction cycle emits a
convergence diagnosis and routes to Product, Plan, source, environment, or
runtime ownership; no retry/cycle budget owns correctness.

## Contract layers

- `packages/agentic-workflow-schema/src/` owns strict DTO normalization,
  canonical definitions, selectors, semantic validators, digests, freshness,
  bounds, diagnostics, test vectors, intents, profiles, evidence vocabulary,
  and transition decisions.
- Generated package-root JSON Schemas are non-authoritative structural
  projections from that definition.
- Skills own human-readable evidence questions, artifact review semantics,
  findings/obligation formats, and handoff language.
- Feature 27's Pi bundle script remains the sole writer of packaged skill
  copies; canonical root changes are rebuilt and byte-parity tested.
- AWL/other runtimes own persistence, authoring-event sequencing, identity
  enforcement, fresh sessions, model routes, retries, budgets, recovery, and
  terminal acknowledgement.

## Snapshot lineage

```text
Product bytes/context/source + artifactRevisionId
  -> SPEC snapshot digest
     -> SPEC review receipt
     -> Plan bytes/context/source + new artifactRevisionId + parent SPEC digest
        -> Plan snapshot digest
           -> Plan review receipt
```

An Engineering-half edit does not erase Product lineage because the SPEC stage
hashes the fixed Product projection. A Product edit creates a new parent digest
and invalidates all descendants. A Plan-only edit creates a new Plan digest.
Any authoring event rotates `artifactRevisionId`, including mutate/revert.

## Ledger ownership

- `planning-findings.md` is stage-aware review/repair evidence.
- `planning-evidence.md` (M/L) or the Engineering SPEC section (XS/S) is the
  compact source-backed argument for plan decisions and phase cuts. It is Plan
  authority; raw exploration history is not.
- The obligation ledger is the completeness map and is frozen with the Plan.
- `review-findings.md` remains candidate-code review evidence.
- `ACCEPTANCE.md` remains the anti-weakening validation authority.
- Git/SPEC/decisions remain authoritative; memory is advisory.

## Digest paths (AC21, F32, D36)

`sha256HexSync` is the synchronous digest behind
`buildPreExecutionArtifactSnapshot`. Since P17 it answers from the host's native
SHA-256 where the host exposes one - `globalThis.process?.getBuiltinModule?.("crypto")`,
looked up on every call, duck-typed locally, never cached - and from this
package's pure-JS FIPS 180-4 core otherwise. Both paths return one identical
lowercase 64-hex digest for identical bytes:
`test/pre-execution-canonical.test.mjs` pins native against pure JS against async
WebCrypto against `node:crypto` over an ASCII, multibyte and oversized corpus, and
`npm run probe:sha256-paths` prints the digests, names the path that answered, and
reports the per-path cost.

### The rejected alternatives, with the cost measured on this host

Every figure below was measured on 2026-09-02 on node v24.19.0 / linux-x64, in
throwaway sandboxes (`/tmp/p17noble`, `/tmp/p17static`) - nothing was installed
into this repository. Timings are medians of 11 runs; `native (routed)` is what
ships, i.e. the binding resolved per call through `getBuiltinModule`.

| shape | native (routed) | native (direct `createHash`) | this package's pure JS | `@noble/hashes@2.4.0` `sha256` |
|---|---|---|---|---|
| 6 KiB | 0.0471 ms | 0.0261 ms | 0.2626 ms (+457%) | 0.0715 ms (+52%) |
| 52 KiB | 0.2361 ms | 0.1850 ms | 2.0639 ms (+774%) | 0.5661 ms (+140%) |
| 4 MiB | 20.2929 ms | 14.3300 ms | 170.7870 ms (+742%) | 42.2933 ms (+108%) |

The routed column pays the UTF-8 encode and one closure allocation that the
direct column skips, not the lookup: the presence check and binding resolution
alone measure **108 ns per call** against 24,580 ns for the whole routed call at
6 KiB - 0.44% of it, which is why the lookup runs per call instead of being
cached into a host assumption. The in-repo probe re-measures the same thing on its
own corpus and prints its own medians per run; the run recorded in `testing.md`
reports a 54-byte ASCII string at 29.7 us natively against 76.9 us in pure JS
(+158%), a 152-byte multibyte string at 9.4 us against 24.2 us (+157%) and a
9,437,148-byte string at 37.7 ms against 382.7 ms (+915%) - one sync pass over
the corpus at 37.8 ms native against 382.8 ms pure JS. An earlier run of the same
probe measured +246% / +117% / +790%: the small-input percentages move with host
noise, the order of magnitude on a document-sized input does not, and the
agreement lines (`identical: YES` on all three shapes) are byte-exact every run.

1. **A static `import { createHash } from "node:crypto"`.** Same API, same
   digests - and it does not compile here: `tsc --noEmit` on a copy that adds the
   specifier exits **2** with `src/sha256.ts(1,28): error TS2591: Cannot find name
   'node:crypto'. Do you need to install type definitions for node?`. The route
   therefore costs a `@types/node` devDependency (measured footprint in the
   sandbox: **2,534,873 bytes across 89 `.d.ts` files**), which AC21 forbids, and
   it turns this phase's `grep -rn "from \"node:" src/` done-when red. `PE-020`
   measured the same binding absent in browsers, where a `node:` specifier is
   unresolvable at bundle time. `createRequire` and dynamic
   `import("node:crypto")` are the same violation wearing a path string, so
   neither was reached for; they are named as rejected here rather than measured.
2. **An `@noble/hashes` dependency.** `@noble/hashes@2.4.0`, MIT,
   `dependencies: {}`: tarball **167,626 bytes / 60 files**, unpacked
   **691,646 bytes** on disk, **17** export subpaths. It is faster than this
   package's core (0.0715 against 0.2626 ms at 6 KiB) and slower than the native
   path at every size measured (+52% to +140%) - a partial fix for the exact cost
   this phase removes outright - and `package.json` declaring no dependencies is
   an AC21 acceptance condition, so the purchase spends the contract. v2 also
   refuses string input, so each call site would need its own `TextEncoder` step.
   Its behaviour inside a browser bundle is **not measured** (no bundler run in
   this environment).
3. **Vendoring its `sha256` closure.** Counted from the installed package:
   **1,419 lines across four modules** - `sha2.js` 446, `_md.js` 209, `_u64.js`
   77, `utils.js` 687 - with `sha2.js` importing 17 named symbols including the
   SHA-512 machinery (`SHA384_IV`, `SHA512_IV`, `Sha512`) and the `_u64` pair a
   SHA-256 never calls, and `utils.js` exporting 31 symbols of which the hash path
   uses a handful. Against a 124-line fallback that is eleven times the code, and
   after this phase the copy would run only on hosts with no native binding -
   browsers, where `crypto.subtle` already answers - so it is the largest
   carrying cost for the smallest benefit. The standing rule now in `CLAUDE.md`
   (source URL, author, version, license name in a header comment) is what makes
   the alternative survivable if a later unit ever chooses it; this unit did not.

What ships instead is the smallest thing that moves the number: the
presence-checked routing above in the file that already owned the digest, the
pure-JS core kept as the fallback it always was, and identical bytes on every
path. No version bump: schema `3.5.0` is still unpublished (registry `3.4.0`),
so this rides the release AC10 already names.

## Preflight

- NRS consumed: `2026-08-30-pre-execution-planning`.
- Architectural invariants: `n/a: no project invariants declared`.
- Preserves AD-002 bilingual human docs, AD-004 one implementation PR against
  `main`, and AD-007 strict package contract authority.
- Satisfied implementation prerequisite: feature 27 / PR #150 is merged and
  its Pi bundle/parity commands are available; revalidate them before P1.
