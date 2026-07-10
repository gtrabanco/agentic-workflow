# @gtrabanco/agentic-workflow-schema

Types, JSON Schema, and parser/validator for the
[agentic-workflow](https://github.com/gtrabanco/agentic-workflow) **machine
envelope** — the fixed JSON block a driven agent turn ends with (emitted by
`workflow-status` always, and by any other skill when the driver injects the
canonical system-prompt snippet — see the driver protocol below), so external
orchestrators can route the workflow programmatically (which command next, on
which model tier).

Zero runtime dependencies. Source of truth for the contract:
[`skills/orchestration-envelope/SKILL.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/skills/orchestration-envelope/SKILL.md);
driver protocol:
[`docs/workflow/ORCHESTRATION.md`](https://github.com/gtrabanco/agentic-workflow/blob/main/docs/workflow/ORCHESTRATION.md).

## Install

```sh
npm install @gtrabanco/agentic-workflow-schema
```

## Use

```ts
import {
  parseEnvelope,
  isTerminal,
  isRunHalt,
} from "@gtrabanco/agentic-workflow-schema";

const output = await runAgentHeadless("Follow the installed SKILL.md for: /workflow-status --json-only");

const result = parseEnvelope(output); // extracts the LAST fenced ```json block
if (!result.ok) throw new Error(result.errors.join("; "));

const env = result.envelope; // fully typed
if (isRunHalt(env)) stopEverythingAndPage(env.blockers);
else if (isTerminal(env.state)) askHuman(env);
else invokeNext(env.next.recommended, env.next.tier); // "strong" | "cheap"
```

The parse contract is exactly what the skills promise: **the last fenced
```` ```json ````…```` ``` ```` block of the final message is the envelope**,
one per turn, all top-level keys always present.

Also exported: `extractLastJsonBlock(text)`, `validateEnvelope(value)`,
`ENVELOPE_STATES` (the 11-state enum), `TERMINAL_STATES`, and every field
type. A language-agnostic **JSON Schema** ships too — works on the
`engines.node` minimum (>=18):

```ts
import { createRequire } from "node:module";
const schema = createRequire(import.meta.url)("@gtrabanco/agentic-workflow-schema/envelope.schema.json");
```

On Node 20.10+/22, the newer import-attributes form also works:

```ts
import schema from "@gtrabanco/agentic-workflow-schema/envelope.schema.json" with { type: "json" };
```

## Versioning

This package's semver tracks the **envelope contract**, not the repo:
breaking schema change (key removed/renamed, state removed) → major;
additive (new optional key, new state) → minor; fixes/docs → patch. When the
`orchestration-envelope` skill changes, this package changes in the same PR.
