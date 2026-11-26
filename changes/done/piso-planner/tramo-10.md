# Tramo 10

## Steps

### Segment 10 — Story: desinstalar retira solo el hook del kit
As user I want uninstall to remove the hook so that nothing dangling remains.
Dependencies: Segment 9 — líneas `hook-compact` registradas.
Contracts to keep: `--keep-settings` conserva; hooks ajenos y otros proyectos intactos.
Paths likely to change: `tools/uninstall/project.sh`, `tools/uninstall/global.sh`.
Concrete example of the expected result: tras desinstalar el proyecto no queda `after-compact.mjs` y el hook propio sigue.
Scope: dos desinstaladores y su prueba.
Files: tools/uninstall/project.sh, tools/uninstall/global.sh, tests/after-compact/wiring-uninstall.test.mjs
WHEN se desinstala un proyecto o todo el kit THEN desaparece solo la entrada del kit (A10)
Acceptance:
- A10: desinstalación por proyecto, global, con `--keep-settings` y simulada; check with the segment verification; expect pass.
TODO:
- [x] Crear `tests/after-compact/wiring-uninstall.test.mjs` con los cuatro casos de A10 (A10). Check: `node --test tests/after-compact/wiring-uninstall.test.mjs`; expect rojo.
- [x] Añadir el caso `hook-compact` en `tools/uninstall/project.sh` para ambos archivos del proyecto (A10). Check: `bash -n tools/uninstall/project.sh`; expect exit 0.
- [x] Añadir el caso `hook-compact` en `tools/uninstall/global.sh`, respetando conservar ajustes y simulación (A10). Check: `node --test tests/after-compact/wiring-uninstall.test.mjs`; expect pass.
Segment verification: `node --test tests/after-compact/wiring-uninstall.test.mjs && node --test tests/after-compact/wiring-install.test.mjs` — level 1; exit 0; covers A10.
Handoff: copiar la forma de los casos `hook)` y `codex-reglas)` de cada script; ejecutar `node "$RAIZ/adapters/shared/compact-hook.mjs" quitar <claude|codex> <proyecto>` y quitar carpetas solo si quedan vacías. El proyecto sale de la ruta registrada (`<p>/.claude/…` o `<p>/.codex/hooks.json`). Revisar cómo se invoca la desinstalación por proyecto en `uninstall.sh`.
