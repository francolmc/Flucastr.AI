# Tramo 8

## Steps

### Segment 8 — Story: el hook se puede poner y quitar sin tocar lo ajeno
As user I want an idempotent hook editor so that my own hooks survive.
Dependencies: Segment 7 — script al que apunta el hook.
Contracts to keep: hooks y ajustes ajenos intactos, incluido el hook de permisos; JSON inválido no se escribe.
Paths likely to change: `adapters/shared/compact-hook.mjs`.
Concrete example of the expected result: `instalar claude <p>` dos veces responde `fijado` y luego `ya-estaba`, con una sola entrada `SessionStart`.
Scope: editor del hook y su prueba.
Files: adapters/shared/compact-hook.mjs, tests/after-compact/install.test.mjs
WHEN se instala o quita para Claude Code o Codex THEN cambia solo la entrada del kit (A8)
Acceptance:
- A8: instalar, comprobar, quitar y simular en ambas herramientas; check with `node --test tests/after-compact/install.test.mjs`; expect pass.
TODO:
- [x] Crear `tests/after-compact/install.test.mjs` con los casos del Handoff en proyectos temporales (A8). Check: `node --test tests/after-compact/install.test.mjs`; expect rojo porque falta el módulo.
- [x] Crear `adapters/shared/compact-hook.mjs` según el Handoff (A8). Check: `node --test tests/after-compact/install.test.mjs`; expect pass.
- [x] Corrección (a): en `tests/after-compact/install.test.mjs`, añadir dos casos: grupo `compact` con el hook del kit y un hook propio (quitar deja el propio); hook propio `node tools/my-after-compact.mjs` (instalar responde `fijado`, `comprobar` sin el del kit dice `ausente`, quitar lo conserva) (A8). Check: `node --test tests/after-compact/install.test.mjs`; expect rojo en los casos nuevos.
- [x] Corrección (b): en `adapters/shared/compact-hook.mjs`, la marca es el comando que contiene a la vez `.flucastr-ai/raiz` y `/scripts/after-compact.mjs`; quitar elimina solo ese hook dentro del grupo y borra el grupo solo si queda sin hooks (A8). Check: `node --test tests/after-compact/install.test.mjs`; expect pass.
Segment verification: `node --test tests/after-compact/install.test.mjs` — level 1; exit 0; covers A8.
Handoff: uso `<instalar|quitar|comprobar> <claude|codex> <proyecto> [--dry-run]`. Archivo: claude `.claude/settings.local.json`; codex `.codex/hooks.json`. Entrada en `hooks.SessionStart`: `{"matcher":"compact","hooks":[{"type":"command","command":"node \"$(cat \"$HOME/.flucastr-ai/raiz\")/scripts/after-compact.mjs\"","timeout":10}]}`. Marca (corregida 2026-11-25): el comando contiene `.flucastr-ai/raiz` y `/scripts/after-compact.mjs`; un hook ajeno nunca cuenta como del kit ni se borra. Salidas: `fijado`, `ya-estaba`, `quitado`, `omitido`; `comprobar` dice `instalado` o `ausente`. JSON inválido: exit 1 sin escribir. Al quitar en Codex, borrar el archivo solo si queda vacío. Casos: archivo inexistente, hooks ajenos, doble instalación, quitar, `--dry-run` sin escribir, JSON inválido.
