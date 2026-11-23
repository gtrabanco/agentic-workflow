# 603 — known pre-existing issues and the gh knowledge-route verdict

## Pre-existing issues affecting this unit

| issue | affects |
|---|---|
| `gh 2.46.0` on this host — `gh skill` needs ≥ 2.90.0 | **affects S5 only.** Recorded uncovered below. Does not affect S1–S4, S6–S8. |
| `gh issue edit --add-label <l> --add-label <m>` is a silent no-op on this repository (the run mutates nothing and exits 0) | does **not** affect this unit — the unit adds no label. Recorded because it is one of the five frictions S5's corpus names. |
| `gh pr edit` fails on the Projects-classic REST fallback and needs `gh api` PATCH | does **not** affect this unit's code; the unit's PR is created once and not edited. |
| `packages/pi-agentic-workflow/projection-manifest.json` pins `runner-invocation-not-shipped` at a `contentHash` that no longer matches `skills/runner-contract/references/RUNNER.md` — commit `0e07ca804` bumped the RUNNER.md pin to 4.10.1 without rebinding it, so `bun run test` in that package fails at `bundle:skills` **on `main`, before this unit** | **blocks P7's validator only.** The namespace-instruction change (S4) is independent of the projection, but the package's suite cannot run green until that hash is rebound — recorded rather than repaired here, because rebinding another unit's projection is not this unit's authority |
| `packages/pi-agentic-workflow` pins `@gtrabanco/agentic-workflow` at the **published** `4.10.0` while the workspace crate is `4.10.1`, so a fresh `bun install` materializes the registry copy rather than the workspace link — that copy lacks `validateProviderConfig`, and `test/workflow-tools.test.mjs` fails 13 cases on `main` before this unit | **affects P7's suite only.** The S4 change is verified independently (the tool's `description` carries all seven families and the `help` pointer, and the tool set stays at six deferred tools); the suite cannot go green until the pin train and the registry copy agree — recorded rather than repaired here |
| `node_modules` in a fresh worktree does not link `@gtrabanco/*` workspace members under bun's default isolated linker | does **not** affect the delivered change; resolved with `bun install --linker=hoisted` (an environment fact, not a code change). |

## The gh knowledge-route verdict (S5)

**Verdict: uncovered — no route applied in this change.** Recorded rather than
guessed (`IR10`, decision `D3`).

The issue named three routes and asked the unit to evaluate and pick one. Each
was evaluated against this host and this repository:

| route | verdict | evidence |
|---|---|---|
| `gh skill install github/awesome-copilot github-issues` | **unreachable here** | `gh --version` → `gh version 2.46.0`; `gh skill` shipped in 2.90.0, so the subcommand does not exist on this host |
| `npx skills add github/awesome-copilot` | **unverifiable artifact** | it writes into the operator's skill directory, not the repository, so its result cannot be re-derived from the tree — the issue itself scopes this as "recorded in the unit doc", which is not an acceptance criterion an external verifier can run |
| vendoring with the mandatory provenance header | **not taken by this change** | it is a real option that would satisfy the provenance rule, but it needs the owner's call on which upstream rows to vendor and at which pinned version — refusing to guess a third-party version is the `IR10` rule |

### The five forge frictions, each covered or declared uncovered

| friction | covered by | status |
|---|---|---|
| `gh pr edit` loses to the GraphQL Projects-classic REST fallback | the usage skill's `references/forge.md` recipe points at `gh api … PATCH` as the sanctioned form | covered by this change (P6) |
| `-f` vs `-F` corrupts the body | the same recipe states the rule (`-F` reads a file, `-f` takes a literal) | covered by this change (P6) |
| `gh issue edit --add-label` is a no-op on this repository | the same recipe names the `gh api` label route and the observation | covered by this change (P6) |
| list truncation at 30 without `--limit` | the same recipe names `--limit` | covered by this change (P6) |
| blocked-by GraphQL ↔ prose sync | the recipe names `addBlockedBy` and the double declaration rule, pointing at the guide's own rule as the owner | covered by this change (P6) |

The five frictions are therefore covered **by this unit's own usage skill**, not
by the upstream `github-issues` layer. What stays uncovered is the issue's
*route choice* (adopting the third-party skill at project level), and that is a
decision for the owner, not an implementation gap this change can close without
inventing an upstream pin.
