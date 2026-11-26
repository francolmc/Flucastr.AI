---
segment: 4
---
## Steps

### Segment 4 — Story: Claude Code con margen
As persona usuaria I want el resto de lanzadores regenerables so that ninguno quede obsoleto.
Dependencies: Segment 3 — `liberar`.
Contracts to keep: archivo sin marca se omite; contenido actual de ambos lanzadores sin cambios.
Paths likely to change: `adapters/pi/install-launcher.sh`, `tools/install/kit-run-launcher.sh`.
Concrete example of the expected result: un `kit-run` marcado con otra raíz se regenera con la raíz actual.
Scope: los dos archivos de Files y `tests/compaction/launchers.test.mjs`.
Files: adapters/pi/install-launcher.sh, tools/install/kit-run-launcher.sh
WHEN hay un lanzador Pi o kit-run marcado y huérfano THEN se regenera (A4).
Acceptance:
- A4: ambos generadores usan `liberar`; el archivo marcado se regenera y registra, el ajeno se conserva.
TODO:
- [x] Usar `liberar` en `adapters/pi/install-launcher.sh` (A4). Check: `bash -n adapters/pi/install-launcher.sh`; salida 0.
- [x] Usar `liberar` en `tools/install/kit-run-launcher.sh` (A4). Check: `bash -n tools/install/kit-run-launcher.sh`; salida 0.
- [x] Crear `tests/compaction/launchers.test.mjs` con caso marcado y caso ajeno (A4). Check: `node --test tests/compaction/launchers.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/launchers.test.mjs` — level 1; exit 0; covers A4.
Handoff: Ejemplo: sembrar `$HOME/.local/bin/pi-planner` con la marca en la línea 2 y comprobar que cambia.

## Evidence

$ bash -n adapters/pi/install-launcher.sh
(sin salida)
exit 0

$ bash -n tools/install/kit-run-launcher.sh
(sin salida)
exit 0

$ node --test tests/compaction/launchers.test.mjs
ℹ tests 4
ℹ pass 4
ℹ fail 0
exit 0

## Notes

Tramo 4 (segmento 4) — checkpoint:
- Archivos: `adapters/pi/install-launcher.sh` y `tools/install/kit-run-launcher.sh` (guarda `if ! liberar … && { [ -e … ] || [ -L … ]; }`), `tests/compaction/launchers.test.mjs` (nuevo, 4 pruebas: pi-planner marcado regenerado, kit-run marcado regenerado, pi-builder ajeno conservado, kit-run ajeno conservado).
- Diff: 2 líneas de guarda cambiadas y 1 prueba nueva.
- Corrección durante la ejecución: la primera corrida falló porque el lanzador Pi incluye la ruta temporal de `FLUCASTR_MODELOS` (modo descarga), que cambia entre instalaciones. La prueba ahora compara la raíz (`RAIZ="<raíz actual>"`) y que `/otra/raiz` ya no aparezca, en vez de comparar el archivo completo. El código del lanzador no cambió.
- Check: `node --test tests/compaction/launchers.test.mjs` salida 0 (4 pruebas); `bash -n` de los dos archivos salida 0. El contenido de los lanzadores queda igual salvo la guarda.
