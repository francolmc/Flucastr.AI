---
segment: 3
---
## Steps

### Segment 3 — Story: Claude Code con margen
As persona usuaria I want que reinstalar regenere lo que el kit generó so that los cambios de ventana lleguen aunque el manifiesto los haya perdido.
Dependencies: Segment 2 — contenido nuevo del lanzador.
Contracts to keep: archivo sin marca se omite; nunca se escribe a través de un enlace; `--dry-run` no escribe; reinstalar sin cambios deja el HOME idéntico.
Paths likely to change: `tools/install/links.sh`, `adapters/claude-code/install-launcher.sh`, `adapters/codex/install-launcher.sh`.
Concrete example of the expected result: un `codex-planner` marcado y sin registrar con 60000 pasa a 200000 y queda registrado.
Scope: los tres archivos de Files y `tests/compaction/orphans.test.mjs`.
Files: tools/install/links.sh, adapters/claude-code/install-launcher.sh, adapters/codex/install-launcher.sh
WHEN se reinstala sobre un archivo marcado y huérfano THEN se regenera y registra (A3).
Acceptance:
- A3: `liberar` devuelve 0 para un archivo regular, no enlace, con una línea que empieza por `# flucastr-ai:generado`; lo borra salvo en simulación e informa que lo regenera. Los lanzadores Claude y Codex omiten solo con `! liberar` y destino existente. Agentes generados huérfanos también se regeneran. Se conservan archivos sin marca y enlaces ajenos.
TODO:
- [x] Ampliar `liberar` en `tools/install/links.sh` (A3). Check: `bash -n tools/install/links.sh`; salida 0.
- [x] Usar `liberar` en `adapters/claude-code/install-launcher.sh` (A3). Check: `bash -n adapters/claude-code/install-launcher.sh`; salida 0.
- [x] Usar `liberar` en `adapters/codex/install-launcher.sh` (A3). Check: `bash -n adapters/codex/install-launcher.sh`; salida 0.
- [x] Crear `tests/compaction/orphans.test.mjs`: quitar líneas `archivo` del manifiesto, cambiar valores, reinstalar; incluir archivo ajeno, enlace externo y simulación (A3). Check: `node --test tests/compaction/orphans.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/orphans.test.mjs` — level 1; exit 0; covers A3.
Handoff: Ejemplo: `if ! liberar "$destino" && { [ -e "$destino" ] || [ -L "$destino" ]; }; then`, ya usado en `adapters/claude-code/install-agent.sh`.

## Evidence

$ bash -n tools/install/links.sh
(sin salida)
exit 0

$ bash -n adapters/claude-code/install-launcher.sh
(sin salida)
exit 0

$ bash -n adapters/codex/install-launcher.sh
(sin salida)
exit 0

$ node --test tests/compaction/orphans.test.mjs
ℹ tests 5
ℹ suites 1
ℹ pass 5
ℹ fail 0
exit 0

## Notes

Tramo 3 (segmento 3) — checkpoint:
- Archivos: `tools/install/links.sh` (`liberar` libera también un archivo regular con una línea que empieza por la marca; los enlaces siguen igual), `adapters/claude-code/install-launcher.sh` y `adapters/codex/install-launcher.sh` (guarda `if ! liberar … && { [ -e … ] || [ -L … ]; }`), `tests/compaction/orphans.test.mjs` (nuevo, 5 pruebas: regeneración Claude, regeneración Codex, archivo sin marca, enlace externo, `--dry-run`).
- Diff: 3 archivos con cambios acotados (`liberar` ampliada; una línea cambiada en cada lanzador) y 1 prueba nueva.
- Decisión: la marca se busca en cualquier línea, no solo en la primera, porque los lanzadores la llevan tras el shebang; A3 dice «una línea».
- Corrección durante la ejecución: la primera corrida falló en el caso `--dry-run` porque `liberar` miraba solo la primera línea. Corregido y repetido: 5/5.
- Check: `node --test tests/compaction/orphans.test.mjs` salida 0, 5 pruebas, unos 11 s (primera corrida dentro de los 120 s). `bash -n` de los tres archivos salida 0.
- Pendiente de este tramo: nada. El contrato «reinstalar sin cambios deja el HOME idéntico» no tiene prueba propia; queda para la verificación del tramo 10.
