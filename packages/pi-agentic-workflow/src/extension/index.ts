// Extension entry point for @gtrabanco/pi-agentic-workflow.
//
// P1 lands the file so the package manifest resolves to a real module, and
// keeps behavior empty on purpose: an installed package at this phase provides
// the canonical skill bundle and nothing else. P3 replaces this stub with the
// friendly-command registration and the routed-dispatch lifecycle.
//
// The import is type-only so the published extension keeps zero runtime
// dependencies: Pi supplies the module, and `peerDependencies` records it.

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function agenticWorkflowExtension(_pi: ExtensionAPI): void {
  // P1: no commands, no config, no routing. See docs/features/27 (P3, P4).
}
