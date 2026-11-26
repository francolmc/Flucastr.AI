---
segment: 6
---
## Steps

### Segment 6 — Story: Claude Code con margen
As persona usuaria I want que reinstalar corrija todos mis proyectos registrados so that no deba repetir `--project`.
Dependencies: Segments 2, 3 y 5 — agentes, regeneración y actualización.
Contracts to keep: `--dry-run` no escribe; `--only` sin Claude no toca Claude; un proyecto que falla no aborta la instalación.
Paths likely to change: `install.sh`, `adapters/claude-code/install-compaction.sh`.
Concrete example of the expected result: `bash install.sh` sin `--project` cambia 133000 a 300000 en un proyecto registrado.
Scope: `./install.sh`, el adaptador y `tests/compaction/install.test.mjs`.
Files: ./install.sh, adapters/claude-code/install-compaction.sh
WHEN se reinstala THEN cada proyecto registrado queda con el valor del planner salvo valor propio (A6).
Acceptance:
- A6: antes de desinstalar se recogen proyectos del manifiesto (como `refrescar_reglas_codex_registradas`). Con registro de Claude Code (`compactacion claude:`, `ajuste`, `hook` claude, `deny`, `sandbox-claude`): actualizar `.claude/settings.local.json`, creándolo si falta. Solo con `codex-reglas` o `skills-proyecto`: `--solo-actualizar`. Carpeta ausente o JSON inválido: `AVISO` y continuar. Se omite el `--project` ya tratado. Prueba completa: instalación nueva (300000; lanzadores 300000 y 200000; builder con `autoCompactWindow: 200000`, planner sin él), reinstalación sobre 133000 (actualizado), sobre 150000 (respetado), simulación y desinstalación (quita el del kit, conserva el propio y las demás claves).
TODO:
- [x] Añadir `refrescar_compactacion_claude_registrada` en `adapters/claude-code/install-compaction.sh` (A6). Check: `bash -n adapters/claude-code/install-compaction.sh`; salida 0.
- [x] Recoger proyectos y llamar a la función en `./install.sh` (A6). Check: `bash -n ./install.sh`; salida 0.
- [x] Crear `tests/compaction/install.test.mjs` con los casos de A6 en HOME temporal (A6). Check: `node --test tests/compaction/install.test.mjs`; salida 0.
Segment verification: `node --test tests/compaction/install.test.mjs` — level 1; exit 0; covers A6.
Handoff: Ejemplo de manifiesto: `compactacion<TAB>/tmp/p/.claude/settings.local.json<TAB>claude:133000`. Relevante: `install.sh` ~275-312 y ~385-395. Al terminar la historia, punto de control y revisión.

## Evidence

- `bash -n adapters/claude-code/install-compaction.sh` exit 0; `bash -n install.sh` exit 0.
- `node --test tests/compaction/install.test.mjs` exit 0: 9 pruebas, 0 fallos (salida en `$TMPDIR/tramo6-install.txt`). Cubren: instalación nueva con `--project` (planner 300000, lanzadores 300000 y 200000, `builder.md` con `autoCompactWindow: 200000`, `planner.md` sin él, registro `claude:300000`); reinstalación sobre 133000 (actualizado con aviso); sobre 150000 (respetado); reinstalación sin `--project` que actualiza el proyecto registrado y conserva su registro; carpeta registrada ausente (AVISO, sigue, registro conservado); `--dry-run` sin cambios; uninstall que conserva 150000 y `x`; uninstall que quita el valor del kit y conserva `x`; JSON inválido (AVISO `no se tocó`, el archivo queda igual, la instalación sale 0).
- Regresión de las suites previas de `tests/compaction/` (resolve, agents, settings, orphans, launchers): exit 0, 42 pruebas (salida en `$TMPDIR/tramo6-regresion.txt`).

## Notes

- Diseño: `compactacion_claude_en <ajustes> [--solo-actualizar]` es la versión por ruta; `instalar_compactacion_claude` la llama con el `$PROYECTO`. `refrescar_compactacion_claude_registrada` lee `REFRESCO_COMPACTACION_CLAUDE` (líneas `completo|solo<TAB>raíz`) y se llama solo dentro del bloque de Claude de `install.sh`, así `--only pi|codex` no toca Claude. Se omite el `--project` ya tratado.
- Recogida en `install.sh` antes de `uninstall.sh`: `compactacion`, `ajuste`, `deny`, `sandbox-claude` y `hook claude` con ruta `*/.claude/*` dan `completo`; `codex-reglas` y `skills-proyecto` dan `solo`. Una raíz repetida la trata solo la primera vez (`completo` antes que `solo`).
- Fuera de esta historia: la prueba de A6 de `--only` sin Claude no existe; queda para el tramo 10 junto con el paso 22 de `./verify`.
