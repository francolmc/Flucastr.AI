---
status: aprobado
branch: feature/pedido-404
base: main
repos: [.]
executor: builder
type: code
---
# Responder 404 para pedidos inexistentes

## Acceptance
- `GET /pedidos/:id` responde 404 cuando el pedido no existe.
- Los pedidos existentes siguen respondiendo 200 con el pedido.

## Scope
`src/pedidos/ruta.mjs`.

## Steps
- [x] Responder 404 si el pedido no existe.
  - evidencia: `src/pedidos/ruta.mjs` línea 10
