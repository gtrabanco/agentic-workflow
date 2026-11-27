/**
 * The package's durable-subagents extension entry (issue #726, defect 2).
 *
 * `pi.extensions` names this file instead of a `node_modules/` path that a
 * hoisted install never creates. pi loads it like any extension; the factory
 * then provisions `pi-extensible-workflows`'s subagents layer through Node's own
 * resolution (hoisted or nested) and reports once at session start when it
 * cannot. Loading lives in `subagents.ts` so the contract is testable without a
 * host; this file is only the manifest target pi can always find.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { provisionSubagents } from "./subagents.js";

export default async function subagentsEntry(pi: ExtensionAPI): Promise<void> {
  // The shim's own location is the resolution start: pi loads this file from
  // the package's `dist/extension/`, which is where Node's walk must begin.
  await provisionSubagents(pi, { from: import.meta.url });
}
