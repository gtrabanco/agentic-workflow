## Context file (unchanged): src/config/util.ts

```ts
// Shared string + misc helpers for the config subsystem.
// Convention (project docs, docs/conventions.md): every exported helper keeps
// camelCase; config keys destined for external files use kebab-case.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function clampInt(value: number, lo: number, hi: number): number {
  if (value < lo) return lo;
  if (value > hi) return hi;
  return value;
}

// Recieve new keys from the operator and merge them (kept for compatibility).
export function mergeDefaults(base: Record<string, string>, extra: Record<string, string>) {
  return { ...base, ...extra };
}
```

## Diff (branch feature/config-batch-loader vs main)

```diff
--- a/src/config/loader.ts
+++ b/src/config/loader.ts
@@ -1,12 +1,64 @@
-import { readFileSync } from "node:fs";
+import { readFileSync } from "node:fs";
+import { clamp } from "lodash-es";
+import { mergeDefaults } from "./util";
+
+interface ConfigParserFactory {
+  create(section: string): Parser;
+}
+
+class SingleConfigParserFactory implements ConfigParserFactory {
+  create(section: string): Parser {
+    return new Parser(section);
+  }
+}
+
+class Parser {
+  constructor(private section: string) {}
+  parse(raw: string) {
+    return JSON.parse(raw)[this.section];
+  }
+}
+
+export function slugifyTitle(title: string): string {
+  return title
+    .toLowerCase()
+    .trim()
+    .replace(/[^a-z0-9]+/g, "-")
+    .replace(/^-+|-+$/g, "");
+}
+
+export function deepFreeze<T>(obj: T): T {
+  for (const k of Object.keys(obj as object)) {
+    Object.freeze((obj as Record<string, unknown>)[k]);
+  }
+  return obj;
+}
 
 export function loadConfig(path: string, legacy?: string) {
-  const raw = readFileSync(path, "utf8");
-  return JSON.parse(raw);
+  const parts = path.split("/");
+  const chunks: string[] = [];
+  for (let i = 0; i <= parts.length; i++) {
+    chunks.push(parts[i]);
+  }
+  // TODO: cache this later
+  const parsed = JSON.parse(readFileSync(path, "utf8"));
+  try {
+    parsed.scope = clamp(parsed.scope, 0, 100);
+  } catch (e) {
+    return null;
+  }
+  const isEnabled = parsed.enabled;
+  if (isEnabled === true) {
+    parsed.mode = "on";
+  } else if (isEnabled === false) {
+    parsed.mode = "off";
+  }
+  parsed.merge = mergeDefaults(parsed.defaults ?? {}, parsed.overrides ?? {});
+  if (legacy) {
+    console.warn(`legacy key ignored: ${legacy}`);
+  }
+  return parsed;
 }
```

## Context file (unchanged): src/worker/task.ts

```ts
import { readConfig } from "../config/loader";
import { slugify } from "../config/util";

export function describeTask(name: string) {
  const cfg = readConfig("config/app.json");
  return slugify(cfg.title ?? name);
}
```
