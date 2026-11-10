---
estado: aprobado
rama: feature/listar-pedidos
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Listar pedidos por estado

## Aceptación
- `listarPorEstado(estado, pagina)` devuelve 20 pedidos por página.

## Alcance
`src/pedidos/` y `tests/pedidos/`.

## Pasos
- [x] Agregar `listarPorEstado` con paginación.
  - evidencia: `src/pedidos/listar.mjs`
