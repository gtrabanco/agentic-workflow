# #595 — Test surplus audit: Tests dimension gains the surplus direction

## Origin

Issue [#595](https://github.com/gtrabanco/agentic-workflow/issues/595).

## What's wrong

product-audit's Tests dimension (`skills/product-audit/references/AUDIT_DIMENSIONS.md`) covers only the **deficit** direction: "Coverage of critical paths, missing/!flaky tests, untested failure modes". The **surplus** direction — tests that should not exist — is not in the dimension inventory, so a full audit pass can complete without ever asking "which tests should not exist". Owner observation 2026-11-16: an audit ran and never reported on surplus tests.

The category problem is literature-backed, recent and pre-agentic alike:

- arXiv 2602.00409 — coding agents over-mock tests and modify tests more than humans; over-mocked tests validate fewer real interactions.
- TestPrism (Nanjing) — best of 14 agent configs reaches 28% Joint Success Function; passing a reference does not mean a test discriminates correct from wrong implementations.
- arXiv 2610.32548 (BlindSpot) — LLM-generated tests are happy-path biased; aggregate coverage hides unchecked obligations.
- Inozemtseva & Holmes, ICSE 2014 (Most Influential Paper) — coverage is not strongly correlated with test suite effectiveness once suite size is controlled; a coverage target does not produce an effective suite.
- Zhang & Mesbah, ESEC/FSE 2015 — **assertions are strongly correlated with test suite effectiveness**: the value unit of a test is the obligation it asserts, not the lines it touches.
- Risk-based testing (ISTQB; Bach) — test intensity must be proportional to complexity/risk, not to surface visibility: verifying a constant `h1` text string is not a justified test; verifying a complex calculation is.

## Expected behaviour

1. **Surplus direction in the Tests dimension.** Three surplus checks, mirroring the owner's deletion-legality rule (2026-11-16):
   - **Dead-surface test**: a test (or suite) whose tagged/claimed protecting surface no longer exists — the test-code analog of the dimension's existing dead-code check (the `prose citation is not evidence of a consumer` rule, same file).
   - **Obligation-level duplicate**: two or more tests asserting the same behavioral obligation on the same surface. Evidence standard: obligation-level (asserted behavior), **not line coverage** — Rothermel et al. 1998/2004 showed coverage-safe minimization still severely compromises fault detection, and Inozemtseva & Holmes 2014 show line coverage does not track effectiveness. Selective mutation kill-rate is the confirmation mechanism for contested clusters, never an exhaustive sweep (cost precedent: gentle-ai issue 5092).
   - **Cost-over-value test**: a test whose execution and maintenance cost exceeds the behavioral risk it covers (risk-based testing; Myers 1979: testing is executing a program with the intent of finding errors — a test that cannot usefully fail is not a test).
2. **The verified evidence row.** Every audit pass that reaches the Tests dimension records `verified: no surplus tests` when clean, or carries findings — the check is "verified", not a reward for deletion.
3. **Deletion route.** A surplus finding classifies `fix-now (delete)` **only** with the evidence standard above (dead-surface proof or obligation-level duplication evidence). Deletion is executed by the owner/fold-findings, never by the audit itself.
4. **Distinct from weakening.** The audit wording states the boundary: deleting a test with evidence is legal; weakening a test to pass is never (AGENTS.md "a test is never edited to pass" — deletion is not an exception to the red-first/no-weakening rules, it is a separate, evidence-gated action).
5. **Normative registration.** The new finding class and the `verified` row enter the repo's normative surface inventory (`docs/workflow/GATE_INVENTORY.md`, the owner table in AGENTS.md) with one owner.

## Where

- `skills/product-audit/references/AUDIT_DIMENSIONS.md` — the Tests dimension row + the surplus checks
- `skills/product-audit/references/AUDIT_PROCESS.md` — the evidence row and the verification wording
- `packages/agentic-workflow-schema/` — only if the finding code needs a schema-export vocabulary
- `docs/workflow/GATE_INVENTORY.md` + the AGENTS.md owner table — one owner per new surface
- `.changeset/`

## Non-goals

- No deletion mechanism inside product-audit (findings only; the skill never edits code).
- No new scripts or gates in this unit — the duplication evidence is produced by the relevance-sweep unit (soft Related below); until then the audit uses the tags/claims a test carries and manual-owner evidence.
- No decision-model dependency — this unit is deterministic prose and audit route only. A future decision-substrate upgrade is recorded in #444, not here.
- No translation artifacts (English-only rule).