# Tramo 9

## Steps

### Segment 9 — Story: instalar un proyecto deja el hook puesto
As user I want `--project` to install the hook so that I do not edit settings by hand.
Dependencies: Segment 8 — editor del hook.
Contracts to keep: el resto de la instalación; reinstalar sin `--project` conserva ajustes y registro de proyectos.
Paths likely to change: `tools/install/compact-hook.sh`, `install.sh`.
Concrete example of the expected result: tras `bash install.sh --copy --project <p>` existe la entrada `compact` y una línea `hook-compact` por archivo en el manifiesto.
Scope: función de instalación, instalador y prueba.
Files: tools/install/compact-hook.sh, install.sh, tests/after-compact/wiring-install.test.mjs
WHEN se instala o reinstala con proyecto THEN el hook queda una vez y registrado (A9)
Acceptance:
- A9: Claude Code y Codex reciben el hook, doble instalación no duplica, `--dry-run` no escribe y reinstalar sin proyecto conserva; check with the segment verification; expect pass.
TODO:
- [x] Crear `tests/after-compact/wiring-install.test.mjs` con HOME y proyecto temporales (A9). Check: `node --test tests/after-compact/wiring-install.test.mjs`; expect rojo.
- [x] Crear `tools/install/compact-hook.sh` con `instalar_hook_compact <claude|codex>`, que avisa y sigue si falla (A9). Check: `bash -n tools/install/compact-hook.sh`; expect exit 0.
- [x] En `install.sh`, cargarlo, llamarlo en ambos bloques con proyecto y conservar líneas `hook-compact` al reinstalar (A9). Check: `node --test tests/after-compact/wiring-install.test.mjs`; expect pass.
Segment verification: `node --test tests/after-compact/wiring-install.test.mjs && node --test tests/compaction/install.test.mjs` — level 1; exit 0; covers A9.
Handoff: seguir `adapters/codex/install-rules.sh` (simulación, `registrar hook-compact <archivo> <claude|codex>` sin duplicar). En `install.sh`: junto a `instalar_hook_permisos_claude`, junto a `instalar_deny_codex` y junto a los `grep` que copian líneas al registro nuevo. La prueba toma como modelo `instalarEn` de `tests/compaction/install.test.mjs`, con `CODEX_HOME` temporal; si Claude Code o Codex no se detectan, usar el mismo recurso de esa suite. Avisar en Codex que el hook requiere aprobación.
