---
status: aprobado
branch: feature/dividir
base: main
repos: [.]
executor: builder
type: code
---
# Agregar `dividir` seguro

## Acceptance
- `dividir(a, b)` devuelve `null` si `b` es 0; no lanza ni devuelve `Infinity`.
- Hay una prueba que lo cubre.

## Scope
`src/calc.mjs`, `tests/calc.test.mjs`.

## Steps
- [x] Agregar `dividir` con guarda y su prueba.
  - evidencia: `src/calc.mjs`, `tests/calc.test.mjs`
