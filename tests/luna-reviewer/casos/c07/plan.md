---
status: aprobado
branch: docs/relanzamiento
base: main
repos: [.]
executor: builder
type: docs
---
# Aclarar el límite de relanzamientos

## Acceptance
- `docs/relanzamiento.md` dice que el contador de relanzamientos es compartido por todas las causas y que su cupo total es 2.

## Scope
`docs/relanzamiento.md`.

## Steps
- [x] Precisar que el cupo es compartido al agotarse.
  - evidencia: `docs/relanzamiento.md` línea 16
