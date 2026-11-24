# Forge — reading and writing pull requests and issues

The forge is where this crate's re-derivation cost was highest: the same five
workarounds were rediscovered across sessions because nobody wrote them down
where the next session looks. This file is that record.

**Flag spelling is not here.** It is `runner help <subcommand>`. What
*is* here is the shape of the five frictions, because each one is a trap that a
flag list does not warn you about.

## Prefer the crate's own reads

`forge-read` is the one route that may return third-party forge text, and it is
the route to prefer when you need an issue or PR's content: it performs the read
over REST, hands every field that can carry third-party text to the content
guard, and prints a fenced delivery with its stripping declared. An unreachable
forge refuses **by class** and prints no envelope — a read that could not reach
the forge is not an empty answer.

## The five recorded frictions

### 1. `gh pr edit` can die on the Projects-classic GraphQL path

`gh pr edit` has been observed failing against the Projects-classic deprecation
warning rather than editing. **The sanctioned fallback is the REST PATCH through
`gh api`**, not a retry of the failing form. Reach for it deliberately; do not
rediscover it.

### 2. `-f` and `-F` are not interchangeable

`-f` takes a **literal** value; `-F` reads a **file**. Passing a path to `-f`
silently sends the path text as the body. This corruption is invisible until
someone reads the PR. When the body comes from a file, it is `-F`.

### 3. `gh issue edit --add-label` can be a silent no-op

On some repositories the label edit exits 0 and mutates nothing. **Verify the
label landed** by reading the issue back; if it did not, the route is the
`gh api` call, not a second attempt with the same form.

### 4. List output truncates at 30 without `--limit`

A list read returns 30 items by default. A count derived from that read is wrong
in the direction that hides work — the missing items are always the older ones.
Any list you intend to count or iterate gets an explicit limit.

### 5. Blocked-by is declared twice and the two must agree

A blocked-by relationship lives in **prose** (an issue's `## Dependencies`) and
in the **native relationship** (the GraphQL mutation). The relationship is
authoritative. When a blocker is re-scoped or resolved, update the
relationship — updating only the prose leaves a machine-readable lie.

## The rule that covers all five

Every one of these is a case where the command **succeeded at the wrong
thing**. That is why verification is part of the recipe: after a forge write,
read it back. A exit code of 0 is the command agreeing it ran, not the forge
agreeing it changed.

## Merging

`fullauto-merge` is the one path that merges without a human, and it therefore
needs every precondition: a clean synchronized tree, a PR against the forge's
default branch whose head is the audited SHA, a green rollup, the merge-ready
marker, and the head's own recorded `merge: fullauto` decision. It pins the head
at merge time. **Never work around a precondition it refuses** — each one exists
because merging past it shipped something nobody audited.
