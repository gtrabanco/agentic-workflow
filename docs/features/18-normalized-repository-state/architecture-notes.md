# 18 — normalized-repository-state · architecture-notes

| Concern | Owner | Rule |
|---|---|---|
| Discovery | `discover-repository-state` | writes evidence-backed facts, then freezes |
| Resolution | `resolve-repository-state` | sole writer of revised facts and decisions |
| Other workflow roles | existing skills | consume state and may propose contradictions |
| Repository truth | repository | always authoritative over NRS |

NRS is an evidence ledger, not a cache, database, or replacement for source
inspection. Documentation and inference remain separate categories.
