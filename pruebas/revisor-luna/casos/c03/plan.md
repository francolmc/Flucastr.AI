---
estado: aprobado
rama: feature/dividir
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Agregar `dividir` seguro

## Aceptación
- `dividir(a, b)` devuelve `null` si `b` es 0; no lanza ni devuelve `Infinity`.
- Hay una prueba que lo cubre.

## Alcance
`src/calc.mjs`, `tests/calc.test.mjs`.

## Pasos
- [x] Agregar `dividir` y su prueba.
  - evidencia: `src/calc.mjs`, `tests/calc.test.mjs`
