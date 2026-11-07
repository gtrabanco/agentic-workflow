# Domain separation — product vs dogfooding

> Project-only reference. This safeguard belongs to **this repository's own
> working practice** (the project that builds agentic-workflow) and must never
> ship in `skills/` or `template/` — it protects the product *from* this repo's
> decisions, so it cannot travel with the product. The one-line rule lives in
> the agent guide (`AGENTS.md`, working rules); this page carries the detail the
> guide's context budget cannot.

## The two domains

| Domain | What lives there | Examples from this repo |
|---|---|---|
| **agentic-workflow (the product)** | Everything the product can build deterministically with its own code and prose: the substrate (unit docs, work-state vocabulary, roadmap-as-worklist, phases, gates, findings, ceremony profiles, plan-time surface declarations, dependency relations). A product default is pushable exactly when the workflow can produce/verify it without knowing the host project. | unit doc shapes, `workflow-status` sensor pattern, `open-questions@1`, finding severity ladder |
| **This project (dogfooding)** | Decisions this repo made about itself: where it publishes, what it labels, how it schedules its own work. | GitHub issues/labels/native `blocked-by` publication, papers sweeps + `ATTRIBUTION.md`, the batch plan of 2026-11-07, `aw-local-*` prompts, AW deletion-ratio measurements |

## The classification test

> *Can the workflow execute/declare/verify this with its own code and prose,
> knowing nothing about this repository?*
>
> **Yes → product domain** (pushable as a default by `init-workspace`/`template/`).
> **No → project domain** (this owner's decision — captured in this repo's
> config/docs if adopted; never shipped).

## The drifts the sweep catches (both directions)

1. **Dogfooding → product**: a decision of this repo entering `skills/`,
   `template/` or a package as an unrequested default. Symptoms: a skill prose
   rule naming GitHub/GraphQL, a template carrying this repo's labels or
   research artifacts, an init-workspace step assuming a forge.
2. **Product → project**: a product rule quietly landing in this repo's own
   guides or scripts as if this repo had decided it. Symptoms: a guide bullet
   that only restates skill prose without a pointer, a script enforcing a
   contract the skills never declared here.

## Legitimate exceptions (not drifts)

- **Owner-requested dual landing** — the owner explicitly asks for a decision to
  land in both domains at once (precedent: the fragment journal, #405).
- **The safeguard itself** — this page and the guide's rule are project-domain
  by construction; they are the one permitted self-reference.

## The product-audit dimension (this repo only)

When `product-audit` runs **inside this repository**, its pass adds one
project-only dimension: the **domain-drift sweep**.

- **Input**: the changed surfaces of the period (product: `skills/`, `template/`,
  `packages/`; project: `AGENTS.md`, `docs/` outside the product trees,
  `.github/`, local tooling).
- **Method**: the classification test above is the classifier. Every new or
  changed rule/claim/artifact in a product surface is asked test-question 1
  (is this buildable without this repo?); every new rule in a project surface
  is checked it did not originate as skill/template prose (test-question 2),
  and that it links its owner when it restates one ("every repetition names its
  owner").
- **Output**: findings, never edits. A finding names the surface, the claim,
  the domain it should belong to, and the repair (move, pointerize, or
  owner-decision record). The pass's proposes-only contract is unchanged.
- **Never shipped**: this dimension must not appear in
  `skills/product-audit/SKILL.md` or its references. It is owned by this guide
  and applies only when product-audit runs here. If product-audit's prose ever
  names this dimension, that is itself a domain-drift finding.

## Applied example (the case that created this page, 2026-11-07)

Designing the batch scheduler sensor (#449): the sensor reading the repo's own
deterministic state (roadmap, unit docs, surface declarations) is **product
domain** — every target project has those. A `--verify-forge` mode checking
against GitHub is **project domain** — this repo publishes there by owner
decision (#442); the product ships nothing forge-specific. The first draft
conflated them; the correction is recorded on #449 and #435.
