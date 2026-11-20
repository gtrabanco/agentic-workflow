# The restatement corpus — one rule, one owner, one sweep

The seed set for `runner restatement-sweep`. A rule restated where its owner
already says it is the defect class this repository keeps paying for — a copy
loses nuance silently (the one-PR rule lost its inline-batch exception; the
tests step restated red-first twice inside one file and one copy dropped the
E-lines requirement), and no gate could see either, because prose copies carry no
id.

A row is an argument, not a heuristic: the rule, the **one** surface that owns
it, the phrase that identifies a restatement of it, the scopes where a copy may
appear, the files a copy is legitimate in (declared, never silent), and the file
claiming the rule is only cited. `audit-docs` runs the sweep as one of its checks
and `product-audit`'s duplication dimension composes it, so the corpus is read on
every pass instead of only when someone remembers.

Adding a rule is adding a row — and a rule whose phrase matches nothing is
reported as a dead seed, so a row that stops describing the tree cannot sit here
quietly.

```text
restatement-corpus@1
# claim-scope: skills/**,docs/workflow/**,docs/design/**,docs/*.md
rule | owner | phrase | scope | allow | claim
one-pr-per-unit | AGENTS.md | PR per unit | docs/workflow/**,docs/design/**,docs/*.md,skills/**,template/** | template/AGENTS.md,template/.github/PULL_REQUEST_TEMPLATE.md | -
red-first | AGENTS.md | script+suite pair | skills/** | - | skills/execute-phase/references/TEST_IMPACT.md
weaker-than-author | skills/unit-lane/references/ORCHESTRATE.md | weaker than the author | skills/** | - | -
no-slash-menu | skills/orchestration-envelope/references/PORTABILITY.md | follow it literally | skills/** | - | -
inline-degrade | skills/unit-lane/references/ORCHESTRATE.md | degrade inline | skills/** | - | -
runner-pin | skills/runner-contract/references/RUNNER.md | @gtrabanco/agentic-workflow@ | skills/**,docs/workflow/** | - | skills/runner-contract/SKILL.md
```

## What a copy is allowed to be

A copy in a row's `scope` is legal in exactly three shapes, and the sweep accepts
no fourth:

- **the owner**, which is skipped by construction;
- a **listed** `allow` path — a declared exception, recorded in the row rather than
  left to a reader's judgment (`template/AGENTS.md` is the one today: the
  scaffold's own guide states the branch rule for the target project it serves,
  a different domain from this repository's guide);
- a **pointer** — the copy names its owner by path or basename, which is what
  "cited, never restated" means operationally.

## What a claim costs

Every "never restated" sentence in the claim scope must name a resolvable owner
or be the claimant a row declares; otherwise it asserts something nobody can
check. A row whose `claim` file stops making the claim, or whose scope carries an
unowned restatement, refuses with `stale-claim` — the assertion is measured, not
trusted, which is the generalization `TEST_IMPACT.md` needed.

## Running it

```sh
runner restatement-sweep                 # the repository this file lives in
runner restatement-sweep --repo <dir>    # another tree (fixtures, a checkout)
runner restatement-sweep --json          # the machine document
```

The block is fixed: a header, one `FINDING <code> — <rule>: <file> — <detail>`
line per finding, one `NOTE <rule> — …` per dead seed, a tally and `verdict`.
Exit `0` is `PASS`, `1` is `FAIL` or `REFUSED`, `2` is a usage error, and the
sweep writes nothing.
