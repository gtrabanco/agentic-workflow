/**
 * The package's durable-subagents extension entry (issue #726, defect 2).
 *
 * `pi.extensions` names this file instead of a `node_modules/` path that a
 * hoisted install never creates. pi loads it like any extension; the factory
 * then provisions `pi-extensible-workflows`'s subagents layer through Node's own
 * resolution (hoisted or nested) and reports once at session start when it
 * cannot. Loading lives in `subagents.ts` so the contract is testable without a
 * host; this file is only the manifest target pi can always find.
 *
 * Issue #755: the layer binds the host through a bare specifier, so the copy the
 * sandbox hoists wins over the pi that is actually running. This entry knows the
 * running host — the module pi loaded it from is reachable through the host
 * package directory the caller can name (`PI_PACKAGE_DIR`, or the host's own
 * `getPackageDir()` when the API exposes it) — and hands it to the provision so
 * the warning can say the running host satisfies the range while the copy the
 * dependency binds does not. It never rescues that binding: only the operator's
 * repair (or a fresher copy) changes what the dependency imports.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

import { provisionSubagents } from "./subagents.js";

/**
 * The running host's module file, when it is nameable: the host package
 * directory from `PI_PACKAGE_DIR` (what pi itself honours) or from the host's
 * `getPackageDir()`. `undefined` when neither answers — the shim then falls back
 * to the sandbox's own resolution, never to a guess.
 */
function runningHostModule(api: ExtensionAPI): string | undefined {
  const apiDir = (api as unknown as { getPackageDir?: () => unknown }).getPackageDir?.();
  const declared = process.env.PI_PACKAGE_DIR;
  for (const dir of [declared, typeof apiDir === "string" ? apiDir : undefined]) {
    if (typeof dir !== "string" || dir.trim() === "") continue;
    const entry = join(dir, "dist", "index.js");
    if (existsSync(entry)) return entry;
  }
  return undefined;
}

export default async function subagentsEntry(pi: ExtensionAPI): Promise<void> {
  // The shim's own location is the resolution start: pi loads this file from
  // the package's `dist/extension/`, which is where Node's walk must begin.
  await provisionSubagents(pi, {
    from: import.meta.url,
    hostModule: runningHostModule(pi),
  });
}
