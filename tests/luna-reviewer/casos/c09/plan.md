---
status: aprobado
branch: chore/renombrar-pedido
base: main
repos: [.]
executor: builder
type: code
---
# Renombrar variable en la ruta de pedidos

## Acceptance
- La variable `pedido` pasa a llamarse `registro` en `src/pedidos/ruta.mjs`, sin cambiar la respuesta de la ruta.

## Scope
`src/pedidos/ruta.mjs`.

## Steps
- [x] Renombrar la variable.
  - evidencia: `src/pedidos/ruta.mjs` línea 8
