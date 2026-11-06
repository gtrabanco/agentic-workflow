# Session-log fragment carrier

> Opt-in merge-conflict insurance for the session journal. The
> journal `docs/LOGS.md` is the workflow's largest recurring source of merge
> conflicts: every session appends to the same git file from a different
> branch. This carrier removes the conflict **by construction** — each entry
> is one file, and one deterministic step after merge turns the files back
> into journal entries.

## What opting in does

Creating `.agentic-workflow/journal/` **is** the opt-in. From then on:

| Writer | Without the carrier | With the carrier |
|---|---|---|
| The template's SessionEnd hook (`.claude/hooks/log-session-end.sh`) | appends the mechanical entry to `docs/LOGS.md` | writes a **fragment** under `.agentic-workflow/journal/`; never touches `docs/LOGS.md` |
| The pi extension (`autoLogSession: mechanical`) | same append | same fragment behaviour (one crate, one grammar) |
| `/log-session` (narrative entry) | appends to `docs/LOGS.md` | writes one narrative fragment; `session-close close` commits the fragments and **refuses a touched `docs/LOGS.md`** |
| The **aggregator** (this carrier's merge step) | — | the **only** writer of `docs/LOGS.md`: appends the pending fragments newest-first and deletes them |

A repo that opts out keeps today's direct-append behaviour with zero residue.

## Install (consent-gated)

Nothing here is on by default. Install with explicit consent, by hand or by
asking for `init-workspace`:

1. `mkdir -p .agentic-workflow/journal` (and commit it — the content-free
   `.gitkeep` placeholder is what keeps the directory tracked while it is
   empty; the aggregator skips it by name, never consumes it, and refuses any
   other non-fragment file).
2. Keep this document beside the carrier, as `.agentic-workflow/journal.md` —
   **never inside it**: the aggregator refuses any file in the carrier whose
   name is not a fragment, so a `README.md` there blocks every aggregation.
3. Install one merge wiring (below). Without a wiring, fragments accumulate
   unconsumed — the writers never block on it.

## The merge wiring

The aggregator is `agentic-workflow journal aggregate` (shipped with
`@gtrabanco/agentic-workflow`): it appends the pending fragments to
`docs/LOGS.md` newest-first (ties: branch, kind, session ascending), deletes
the consumed fragments, and refuses anything ambiguous with exit 2 before the
first byte moves. It knows no forge: the GitHub workflow and the `post-receive`
hook below call the same command unchanged.

### GitHub Actions example

Shipped as `template/.github/workflows/agentic-workflow-journal.yml.example` —
rename it to `.yml` on consent. It runs on pushes to the default branch when a
fragment changed, under a **concurrency group** so two merges seconds apart
serialize instead of racing. Supported merge strategies: **squash** and
**merge-commit** both deliver the branch's added fragment files into the
default branch's tree, and the aggregator consumes the tip's working tree, so
both work unchanged; a **rebase** merge rewrites the fragment commits but the
files still land, so it works too.

### Self-hosted forges: `post-receive` example

```bash
#!/usr/bin/env bash
# post-receive — aggregate journal fragments after refs/heads/main updates.
# Same command the GitHub example runs; no forge anywhere in the crate.
ref="$1"
if [ "$ref" != "refs/heads/main" ]; then exit 0; fi
GIT_WORK_TREE="$(git rev-parse --show-toplevel)" || exit 0
cd "$GIT_WORK_TREE" || exit 0
# A lock keeps two simultaneous pushes from racing; a lost lock is retried by
# the next push, and an unconsumed fragment is never lost — only delayed.
exec 9>.agentic-workflow/journal/.aggregate.lock
flock -n 9 || { echo "journal aggregate already running; the next push retries" >&2; exit 0; }
agentic-workflow journal aggregate || exit 1   # refusal: fragments stay, nothing is lost
git add .agentic-workflow/journal docs/LOGS.md
git -c user.name="journal-bot" -c user.email="journal-bot@$(hostname)" \
  commit -m "docs(log): aggregate journal fragments" -- .agentic-workflow/journal docs/LOGS.md || exit 0
```

No concurrency group exists on a bare receive hook — the `flock` above is the
retry/lock story: a second simultaneous push declines, and the fragments it
carried are aggregated by its own push's run or the next one.

## Fragment rules (the short version)

The naming grammar and the content rules have **one owner**:
`journal-fragment-grammar@1` in `@gtrabanco/agentic-workflow`
(`packages/agentic-workflow/README.md`, implemented in
`src/journal/fragment.mjs`). Writers compute the name — never hand-roll it:
`agentic-workflow journal name --kind <mechanical|narrative>`. One fragment
per session per kind; an existing target is refused, never overwritten; the
narrative rules (append-only, git-facts, refusal) hold at fragment level.

## Where this slots into the pluggable journal contract

The contract has landed: the journal's storage is pluggable behind the
store-driver contract (`journal-driver-contract@1` in
`@gtrabanco/agentic-workflow`'s README — one owner, no second grammar), and
canonical entries are `journal-entry@1` (owned by
`@gtrabanco/agentic-workflow-schema`). This layout is the default Markdown
driver's opted-in transport, not a driver of its own: `append()` writes one
fragment, `render(range)` is the aggregator's append-in-order step, and
`query()` answers from the aggregated journal — the fragments are consumed and
deleted at merge, so nothing durable is queried here. Nothing here is rework;
a project that wants a database-backed journal implements the three methods
and passes the shared conformance suite (the crate README's driver-authoring
path).
