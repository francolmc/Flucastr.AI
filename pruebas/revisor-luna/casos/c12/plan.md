---
estado: aprobado
rama: feature/pedido-404
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Responder 404 para pedidos inexistentes

## Aceptación
- `GET /pedidos/:id` responde 404 cuando el pedido no existe.
- Los pedidos existentes siguen respondiendo 200 con el pedido.

## Alcance
`src/pedidos/ruta.mjs`.

## Pasos
- [x] Responder 404 si el pedido no existe.
  - evidencia: `src/pedidos/ruta.mjs` línea 10
