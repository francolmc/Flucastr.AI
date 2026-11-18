---
status: aprobado
branch: feature/limitar
base: main
repos: [.]
executor: builder
type: code
---
# Agregar `limitar`

## Acceptance
- `limitar(valor, min, max)` devuelve `valor` acotado al rango [min, max].
- Hay una prueba que lo cubre.

## Scope
`src/calc.mjs`, `tests/calc.test.mjs`.

## Steps
- [x] Agregar `limitar` y su prueba.
  - evidencia: `src/calc.mjs`, `tests/calc.test.mjs`
