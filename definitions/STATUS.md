# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F14 `hecha` (confirmada por Franco, 2026-10-30). F01–F10 y F12–F13 `hecha` y archivadas. Solo queda F11 (informe), en pausa por decisión de Franco: esperar más tareas reales con `Registro:` antes de llamar al `arquitecto`.
Rama: chore/F14-estabilizar-rapida

## Espera a Franco

- **Commit del mantenimiento (tuyo):** puertas 1 y 2 aprobadas por Franco (2026-10-30): `BACKLOG.md` compactado, `WORKFLOW.md` (30.596 caracteres), `REGISTRO.md` y `AGENTS.md`. Quedan sin commit; conviene un commit `chore/` aparte del de F14. `rapida.sh`: 218 pruebas, 13 s.
- **Rama F14:** `chore/F14-estabilizar-rapida` (task-01 `hecha`): cierra la rama, haz el PR y despliega.
- **Archivo:** F14 archivable con `node scripts/archivar.mjs --aplicar F14` (tú, o yo a tu pedido, después del PR y en su propio commit `chore/`). Registro de eventos: `node scripts/registrar.mjs` (antes de archivar; no bloquea).
- Concesión opcional del permiso en Claude Code: tres reglas `allow` en tu `settings.json` (`WORKFLOW.md` §3.1).
- **Antes de publicar el repo (tuyo):** gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar los commits «intrusión». Si aparece algo: rotar la credencial primero.
- **Comprobación manual de F09 (tuya, con repo público):** `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`; que `modelos.json` quede igual y que la red deje pasar `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com` (guía en `README.md`).
- **Decisiones abiertas (tareas aparte, sin urgencia):** `instalar.sh --copiar` con `modelos.json` inválido deja roto el personal (`instalar-remoto.sh` ya lo bloquea); ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos); estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo (F03).
- Verificación funcional observable (curl/Playwright): no se abre tarea ni se toca `definitions/` por ahora.
- `rapida.sh` puede dejar `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
