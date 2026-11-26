---
segment: 10
---
## Steps

### Segment 10 — Story: Comprobar ventanas
As persona usuaria I want las pruebas nuevas dentro de `./verify` so that una regresión se detecte.
Dependencies: Segments 1–9 — pruebas en verde.
Contracts to keep: pasos 1–21 sin cambios.
Paths likely to change: `verify`.
Concrete example of the expected result: `./verify` ejecuta el paso 22 y termina con `VERIFY OK`.
Scope: `./verify`.
Files: ./verify
WHEN se ejecuta la verificación completa THEN incluye las pruebas de compactación (A10).
Acceptance:
- A10: antes de `VERIFY OK` hay `node --test tests/compaction/*.test.mjs || fallo "22: ..."` y la verificación completa sale 0.
TODO:
- [x] Añadir el paso 22 en `./verify` (A10). Check: `bash -n ./verify`; salida 0.
- [x] Ejecutar `./verify` con salida a un archivo de `$TMPDIR` y leer solo el final (A10; ≈3 min). Check: `./verify`; salida 0.
- [x] Tras las correcciones de tramo-9, repetir `./verify` con salida a un archivo de `$TMPDIR` y leer solo el final (A10; ≈3 min). Check: `./verify`; salida 0.
- [x] Tras las correcciones de la segunda revisión en tramo-9, repetir `./verify` con salida a un archivo de `$TMPDIR` y leer solo el final (A10; ≈3 min). Check: `./verify`; salida 0.
Segment verification: `./verify` — level 3; exit 0; covers A10.
Handoff: Ejemplo: `./verify > "$TMPDIR/verify.log" 2>&1; tail -n 20 "$TMPDIR/verify.log"`. Base: 122 s. No ejecutes la instalación real.

## Evidence

- Paso 22 en `./verify`: `$ bash -n ./verify` → exit 0. Bloque añadido antes de `echo "VERIFY OK"`: `node --test tests/compaction/*.test.mjs || fallo "22: pruebas de compactación no pasaron"`.
- `$ ./verify > "$TMPDIR/verify.log" 2>&1` → exit 0, 148 s. Cola real (`tail -n 20`):
  - `ℹ tests 83`, `ℹ pass 83`, `ℹ fail 0`, `ℹ cancelled 0`, `ℹ skipped 0`, `ℹ todo 0`.
  - `VERIFY OK`
  - `resultado registrado: Fingerprint: 83812daf1d3b`
- Lectura del log completo: no leída; solo la cola y el recuento.
- Repetición tras correcciones de tramo-9 (2026-11-25): `$ bash -n ./verify` → exit 0; `$ ./verify > "$TMPDIR/verify.log" 2>&1` → exit 0. Cola real (`tail -n 20`): `ℹ tests 89`, `ℹ pass 89`, `ℹ fail 0`, `ℹ cancelled 0`, `ℹ skipped 0`, `ℹ todo 0`, `VERIFY OK`, `resultado registrado: Fingerprint: f45251bef1d9`.

## Notes
