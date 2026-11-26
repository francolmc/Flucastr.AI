---
segment: 5
---
## Steps

### Segment 5 — Story: Claude Code con margen
As persona usuaria I want que el kit actualice solo su propio valor so that mis ajustes se respeten.
Dependencies: Segment 1 — `compactarEn`.
Contracts to keep: solo se toca `autoCompactWindow`; las demás claves quedan iguales; `quitar-compactacion` igual; deny y sandbox sin cambios.
Paths likely to change: `adapters/claude-code/compaction.mjs`, `adapters/claude-code/install-compaction.sh`, `scripts/resolver.mjs`.
Concrete example of the expected result: ajustes con 133000 → `actualizado:300000:133000` y mensaje «compactación actualizada: 133000 → 300000».
Scope: los tres archivos de Files y `tests/compaction/settings.test.mjs`.
Files: adapters/claude-code/compaction.mjs, adapters/claude-code/install-compaction.sh, scripts/resolver.mjs
WHEN el valor instalado lo escribió el kit THEN se actualiza; si no, se respeta (A5).
Acceptance:
- A5: `fijar-compactacion claude <ajustes> [--registrado <v>]… [--solo-actualizar] [--dry-run]`, con el valor de planner. Sin valor: `omitido-umbral` u `omitido-rango:N`. Campo ausente: `fijado:N`, o `sin-campo` sin escribir con `--solo-actualizar`. Campo igual: `ya-estaba`. Campo en `--registrado` o igual a 133000: `actualizado:N:antes`. Otro: `omitido-usuario`. En el instalador, los registrados salen de las líneas `compactacion<TAB>ruta<TAB>claude:v` de `$NUEVO` y `$MANIFIESTO`; con `fijado` o `actualizado` queda una sola línea nueva por ruta en `$NUEVO`; `ya-estaba` registrado conserva una (sin registro no se añade); `omitido-usuario` quita las obsoletas; umbral y rango las conservan. `sin-campo` no avisa ni agrega registro.
TODO:
- [x] Implementar los resultados en `adapters/claude-code/compaction.mjs` usando `compactarEn` (A5). Check: `node --check adapters/claude-code/compaction.mjs`; salida 0.
- [x] Aceptar las banderas en `scripts/resolver.mjs` y su cabecera (A5). Check: `node --check scripts/resolver.mjs`; salida 0.
- [x] Mantener el registro en `adapters/claude-code/install-compaction.sh` (A5). Check: `bash -n adapters/claude-code/install-compaction.sh`; salida 0.
- [x] Crear `tests/compaction/settings.test.mjs`: cada resultado, simulación, claves ajenas y líneas duplicadas; cargar `tools/install/manifest.sh` para el registro (A5). Check: `node --test tests/compaction/settings.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/settings.test.mjs` — level 1; exit 0; covers A5.
Handoff: Ejemplo: `{"autoCompactWindow":150000,"x":1}` queda intacto y responde `omitido-usuario`. El instalador devuelve siempre 0, como hoy.

## Evidence

- `node --check adapters/claude-code/compaction.mjs` exit 0; `node --check scripts/resolver.mjs` exit 0; `bash -n adapters/claude-code/install-compaction.sh` exit 0.
- `node --test tests/compaction/settings.test.mjs` exit 0: 18 pruebas, 0 fallos (salida en `$TMPDIR/tramo5-settings.txt`).
  - Resultados A5 del resolver: fijado, ya-estaba, omitido-usuario (`{"autoCompactWindow":150000,"x":1}` queda intacto), actualizado (133000 sin registrar; valor pasado con `--registrado`), sin-campo con `--solo-actualizar` (no crea el archivo), `--dry-run` (no escribe), omitido-rango:1032000, omitido-umbral (sin `compact_at` del planner) y quitar-compactacion.
  - Instalador (driver bash con `tools/install/manifest.sh`): fijado y actualizado dejan una sola línea `claude:<valor>` por ruta; ya-estaba deduplica; omitido-usuario quita el registro; las líneas de otras rutas se conservan; simulación no toca el registro; `--solo-actualizar` sin campo no imprime ni registra; con el resolver ausente avisa `AVISO: no se tocó` y sale 0.

## Notes

- Pendiente de comprobar en tramo 10: la combinación con el refresco de `install.sh` (tramo 6).
- Cosmético sin cambiar: `primera` sin uso en `liberar` (`tools/install/links.sh`), heredado del tramo 3.
