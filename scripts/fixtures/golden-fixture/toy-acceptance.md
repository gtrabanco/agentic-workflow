# Acceptance manifest v1 — 99-csv-export-command

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | CSV export writes header and every record | command fixture |
| AC2 | empty input writes a header-only file and exits 0 | command fixture |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
