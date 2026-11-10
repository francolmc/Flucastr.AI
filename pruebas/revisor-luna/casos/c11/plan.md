---
estado: aprobado
rama: feature/limitar
base: main
repos: [.]
ejecutor: constructor
tipo: codigo
---
# Agregar `limitar`

## Aceptación
- `limitar(valor, min, max)` devuelve `valor` acotado al rango [min, max].
- Hay una prueba que lo cubre.

## Alcance
`src/calc.mjs`, `tests/calc.test.mjs`.

## Pasos
- [x] Agregar `limitar` y su prueba.
  - evidencia: `src/calc.mjs`, `tests/calc.test.mjs`
