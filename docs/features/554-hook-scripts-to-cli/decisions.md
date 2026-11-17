# Decisions — feature/554-hook-scripts-to-cli

Owner decisions are dated and cited; an engineering decision names the evidence
it rests on and the obligation it binds. Frozen at cut.

## D1 — The face is a subcommand of the one CLI, not a sibling bin per capability

Issue #554's own open question ("new subcommand vs sibling bin vs importable
module only"). A shim has to reach *one* spawned thing; `index-sync.sh`'s
published pattern is `AGENTIC_WORKFLOW_BIN` else `command -v agentic-workflow`,
and a second binary name per capability would make every shim resolve a different
entry point and every installer a different PATH entry. So each capability is
`src/<name>.mjs` (the module) + a subcommand case in `bin/agentic-workflow.mjs`
(the spawnable face). `bin/turn-contract.mjs` survives as the thin wrapper the
skills already cite, delegating to the same module — one code path, two faces.
Binds O1, O2, O8; evidence PE-002, PE-006.

## D2 — Degradation is decided per capability, never uniformly

`index-sync`'s silent no-op is correct for a *best-effort cache refresh* and
wrong for a guard: a safety guard whose decision engine is absent must refuse,
not allow. So `turn-contract`, `guard-command`, `git-identity-check` and
`fullauto-merge` exit non-zero with a message naming the missing entry point and
the repair, while `index-sync` keeps its documented `exit 0`. `S15` is satisfied
by declaring both halves and proving each. Binds O9; evidence PE-001, PE-015.

## D3 — The payload normalizer is not platform-specific, so it moved

`S9` keeps the adapters as "the platform seam", and they are: each one owns a
payload *shape* (Copilot's `{continue, stopReason}`, pre-tool's stderr text,
OpenCode's exception) and that stays. But the rule they all delegated to — which
key carries the command, which carries the path, what counts as an unusable
payload — is identical across platforms and is decision logic, which `S12`
forbids in a hook file. It moved to `src/guard/payload.mjs`; each adapter now
names its stdin source and its output format. The `jq` precondition dies with the
rule. Binds O3; evidence PE-012.

## D4 — The shell libraries are deleted with their shell suites, not kept as compatibility

"No backward-compatibility support" (AGENTS.md). `lib/forge.sh` and `lib/temp.sh`
have no consumer once the four capabilities are JavaScript, and a sourced shell
library with no consumer is a second implementation waiting to happen. Their two
suites (`test-forge-adapter.sh`, `test-temp-lib.sh`) retire with them, every case
ported to `packages/agentic-workflow/test/{forge,temp}.test.mjs` in the same
commit — the coverage is moved, never dropped. Binds O10; evidence PE-014.

## D5 — `jq` is retired from the moved paths

`fullauto-merge.sh` refuses without `jq` and the payload adapter exits 2 without
it. JavaScript parses the same documents natively, so the requirement disappears
instead of moving into the crate's dependency list (which stays: `typebox`,
`mdast-util-from-markdown`, the schema package). Recorded as a behavioural
improvement, and the merge suite proves the verdicts, not the removal. Binds O8;
evidence PE-012, PE-013.

## D6 — The issue's duplication premise is corrected, and the real dedup is done

Issue #554 states `git-identity-check.sh` is "duplicated" by
`packages/pi-agentic-workflow/src/guards/git-identity.ts`. They are not the same
check: the TS file is Layer 1 (it reads a `git config` *command line* and decides
whether a write needs consent) and the shell file is Layer 2 (it reads the
*resolved* author/committer and the signing key at commit time). Both are
documented as separate layers by #514, and collapsing them would delete a guard.

What is genuinely duplicated, and what this unit dedups:
1. the `gitIdentity` **profile rule** (enforce vocabulary, approved fields,
   `signing`/`signingKeys`, `agentGuard` defaults) — carried by the shell awk
   reader, by `scripts/push-identity-check.mjs` and by pi's
   `normalizeGitIdentity`; it now lives in `src/guard/git-identity.mjs`, and pi
   and the push checker import it;
2. Layer 2's **commit evaluation** — carried by the shell hook and by
   `scripts/push-identity-check.mjs`'s `commitViolations`; the hook now calls the
   crate module and the checker reads the same module's evaluator, with
   `scripts/identity-hook-parity.test.mjs` (the frozen 12-row corpus) proving the
   two carriers still answer identically.
Layer 1 keeps its own decision module and gains only the shared profile reader.
Binds O4, O5; evidence PE-003, PE-004.

## D7 — `bin/turn-contract.mjs` gains `--remote` and `--forge`

The shell file resolves the forge from the checked remote (`--remote`, default
`origin`) and accepts `--forge github|gitlab|gitea|bitbucket` plus
`AGENTIC_WORKFLOW_FORGE`; the engine hard-codes `origin` and `gh`. Delegation is
only faithful if the engine absorbs both flags — including the refusal of an
invalid `--forge` as a *usage* error (exit 2), which the shell file already
implements (`issue #546`). Binds O15; evidence PE-002.

## D8 — One JSONC reader: the schema package's

The shell awk stripper, `scripts/push-identity-check.mjs`'s `parseJsonc` and pi's
config loader are three readers of one documented dialect. The schema package
already publishes a tokenizer (`parseJsonc`) that pi reads config files with, and
its accept-language is a superset of both others (comments in any whitespace
position, trailing commas, a JSON-object root, line/column diagnostics), so no
document that parsed before stops parsing. The crate imports it; the awk stripper
and the script's copy are deleted. Binds O4; evidence PE-005.

## D9 — The template suites point at this checkout's crate bin

A delegating shim needs a CLI; the suites set none today. Each suite gains one
resolution block — honour `AGENTIC_WORKFLOW_BIN` when the caller set it, else this
checkout's `packages/agentic-workflow/bin/agentic-workflow.mjs` when it exists,
else leave it unset so the absent-CLI cases still prove the degradation. No
assertion is relaxed, no case removed. Binds O12; evidence PE-011.

## D10 — Test-first per slice, recorded rather than gate-enforced

`scripts/red-first.mjs` binds `scripts/<x>.mjs` pairs only (PE-009), so the crate
slices land as a red commit (suite alone, observed failing on the missing module)
followed by a green one (module + wiring), with both runs recorded in the unit
doc's `## Log`. No repository gate is claimed for a rule it does not enforce.

## D11 — The risk tier is `high`, and the named item is `fullauto-merge`

It is the only path that merges without a human, and its guards are the whole
reason it is allowed to exist. The port is proven against the unmodified
338-line shell corpus; any behaviour difference is a regression, not a
rationalization.

## Path-protection records

The correction batch's one protected-path edit (external-verify B10): the
comment-only header repair of `scripts/identity-hook-parity.test.mjs`. The file
is post-freeze `**/*.test.*`, so the gate needs both rows; the owner's approval
was given in-session (2026-11-17, question "¿Apruebo el fix (solo comentario)
y registro las filas justification + approval (human-owner)?", answered
`approve-and-record`), under the batch authority S1 ("triage and fix those that
deserve to fix").

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | **/scripts/identity-hook-parity.test.mjs | P4 | 2026-11-17 | execute-phase | External-verify B10 (comment-only): the header still asserted the pre-#554 architecture — "two implementations", "they cannot share code … may not shell out to a node CLI" — while the commit hook is now a shim that execs the CLI and both carriers read src/guard/git-identity.mjs; no assertion, no case and no behavior is touched
approval | **/scripts/identity-hook-parity.test.mjs | P4 | 2026-11-17 | human-owner | Owner approval recorded 2026-11-17 in-session (asked verbatim, answered approve-and-record): apply the comment-only header fix using these two rows
```
