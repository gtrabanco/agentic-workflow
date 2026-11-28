# Portability — the workflow's common preamble

Single owner of the portability preamble and the no-slash-menu fallback. A
skill's Portability section cites this file instead of copying them, and keeps
only its own skill-specific fallbacks.

The workflow is the contract; Claude Code features are conveniences. On an
agent that lacks one, apply the fallback — never skip the step the feature
enables:

- **No slash-command menu** — where a skill says `/<skill>`, open that skill's
  `SKILL.md` (wherever your agent installed the skills) and follow it
  literally, in a fresh conversation: hand-offs assume a clean context.

## Product paths resolve against the product, never the project

Every owner citation a skill or a reference carries — `owner:
skills/<name>/references/…`, `packages/<name>/…`, a gate's `docs/workflow/…` —
is **repo-relative to the installed package**: the file lives in the product's
own tree (the skills tree your agent installed, or the crate's package
directory), and never at `skills/…` under your project root. Read the citation
as a name inside the installed release and resolve it there; a project neither
satisfies nor needs to satisfy a product path.

The same rule binds the product's own code: a shipped command names the
**skill** (`the runner-contract skill`) or the **config key**, never a product
path a consumer cannot resolve — a refusal that says
`packages/agentic-workflow-schema/src/vocabularies.ts is absent` is a defect of
the refusal, not of the project (issue #717, the sweep this rule came from).
