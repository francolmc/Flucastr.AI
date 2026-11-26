# Notas: hook de permisos sin falsos positivos

## Next action
Cerrado: la persona aprobó la evidencia. Falta que ella haga el commit en `feature/hook-parser` y abra el PR a `main`. Pendiente de probar por la persona: un heredoc real. No avanzar a otro cambio.

Cierre: `AGENTS.md` actualizado (5262 bytes; pruebas de tamaños 48/48); carpeta movida a `changes/done/hook-parser/` con las rutas de `casos.mjs` y `comparar.mjs` ajustadas (`--hook` 97/97). Tras el cierre no se corrió `./verify` completo.

## Hechos
- Rama `feature/hook-parser` desde `main` (a44cda2, al día). Sin cambios en archivos de producto.
- Solo decide `scripts/permissions-hook.mjs`: `accionProtegida` (l. 119) parte el texto por espacios; `decidir` (l. 244) da `allow`, `deny` o nada. `adapters/claude-code/hook.mjs` instala otro hook (validador) y `deny.mjs` las reglas deny: no se tocan.
- `accionProtegida` también la usa `tools/check/ejecutar.mjs:69`: no cambia.
- `tests/permissions-contract/hook.test.mjs`: 6/6 pasan; `./verify` no la ejecuta.
- `casos.mjs` (97 casos) → `tabla.md`. `comparar.mjs` es el oráculo del builder; hoy falla porque falta el módulo (esperado).
- Durante la exploración el hook bloqueó un comando mío que solo editaba `casos.mjs` (mismo falso positivo); escribí el archivo con la herramienta de edición.
- Respuestas: destinos `.md/.txt/.log`; `rm` como hoy; evaluar el contenido de `bash/sh/zsh -c`; `git -C/-c` con commit, push, merge o alias.
- Parsers descartados (peso, licencia u obsoletos): tokenizador propio. Cifras en `plan.md`.
- `review-plan.mjs`: plan y 4 tramos con exit 0 (`plan.md` muestra la nota de formato anterior).
