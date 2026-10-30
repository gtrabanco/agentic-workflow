---
"@gtrabanco/agentic-workflow-schema": patch
---

fix(schema): the evidence-row grammar test imports the published dist surface (../dist/index.js), not the TS source — the wrong path broke node --test on every main push since #339
