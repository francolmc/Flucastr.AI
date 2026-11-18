---
status: aprobado
branch: feature/listar-pedidos
base: main
repos: [.]
executor: builder
type: code
---
# Listar pedidos por estado

## Acceptance
- `listarPorEstado(estado, pagina)` devuelve 20 pedidos por página.

## Scope
`src/pedidos/` y `tests/pedidos/`.

## Steps
- [x] Agregar `listarPorEstado` con paginación.
  - evidencia: `src/pedidos/listar.mjs`
