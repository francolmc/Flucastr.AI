# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F14 `hecha` (confirmada por Franco, 2026-10-30). F01–F10 y F12–F13 `hecha` y archivadas. Solo queda F11 (informe), en pausa por decisión de Franco: esperar más tareas reales con `Registro:` antes de llamar al `arquitecto`.
Rama: chore/F16-coherencia-sin-carpetas
F16 en curso: task-01 `lista para revisión` (puerta 4).
F15 en curso: task-01 `hecha` (Franco, 2026-10-30); task-02 `hecha` (Franco, 2026-10-30); task-03 `hecha` (Franco, 2026-10-30); task-04 `hecha` (Franco, 2026-10-30). F15 `hecha` en `BACKLOG.md` (confirmada por Franco, 2026-10-30); `→` movido a F11 (en pausa por datos, sin tareas). Solo queda F11 pendiente.

## Espera a Franco

- **Puerta 4 (F16 task-01, `lista para revisión`):** `features/F16-coherencia-sin-carpetas/task-01-aceptar-cero-carpetas.md`. Revisa *Evidencia* y *Notas*, y `git diff pruebas/comprobaciones/coherencia-features.test.mjs`. Commitea en `chore/F16-coherencia-sin-carpetas` y dime si la pasas a `hecha`.

- Puerta 2 aprobada por Franco (2026-10-30): backlog con F16 `aprobado`; el `planificador` descompone F16 (puerta 3 después). La celda «Por qué» de F16 mide ~380 caracteres; se puede acortar más adelante.
- F15 sigue sin archivar a propósito, hasta que F16 esté lista (así `rapida.sh` no falla).

- Feature F15 completa en chore/F15-actualizar-readme: cierra la rama, haz el PR y despliega.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F15 archivable: `node scripts/archivar.mjs --aplicar F15` (lo corre Franco o, si lo pide, tú, después del PR y en su propio commit `chore/`).
- Commitea lo pendiente de F15 en esa rama; mira los Mermaid renderizados en GitHub. El constructor dejó `/tmp/rapida-check.txt`; puedes borrarlo.

- task-01 a task-03 `hecha`; commitea cuando quieras en `chore/F15-actualizar-readme`. Mira el Mermaid de task-03 renderizado en GitHub (no hay `mmdc` aquí).

- task-01 y task-02 `hecha`; commitea cuando quieras en `chore/F15-actualizar-readme`.

- task-01 sigue sin commit (`assets/logo.svg`, la tarea); commitea en `chore/F15-actualizar-readme` cuando quieras.

- Franco aprobó (2026-10-30) las 4 tareas de F15 (`aprobada`) y reordenar el backlog (F15 antes de F11); el `planificador` lo está aplicando. Después se delega task-01 al `constructor` (rama `chore/F15-actualizar-readme`).
- (Resuelto con el reordenamiento) Conflicto de orden: el `→` ya está en F15 (adelantada a tu pedido), pero el validador de formato exige `→` en la primera feature no `hecha` (F11), así que `rapida.sh` falla en `formato-flujo.test.mjs`. Opción recomendada: que el `planificador` reordene el backlog poniendo F15 antes de F11 (F11 sigue pendiente y en pausa). Alternativas: devolver el `→` a F11, o cambiar el validador y la regla (arquitecto).
- Puerta 2 aprobada por Franco (2026-10-30): backlog con F15 `aprobado`.
- **`rapida.sh` falla hoy** (`coherencia-features.test.mjs:134`: «se esperaba al menos una carpeta de feature y hay 0»). Causa: archivé F14 y `features/` quedó solo con `completed/`. No viene de F15. Se resuelve cuando exista una carpeta de feature nueva; si prefieres, abrimos una tarea para que esa prueba acepte `features/` sin carpetas activas.

- **Commit del mantenimiento (tuyo):** puertas 1 y 2 aprobadas por Franco (2026-10-30): `BACKLOG.md` compactado, `WORKFLOW.md` (30.596 caracteres), `REGISTRO.md` y `AGENTS.md`. Quedan sin commit; conviene un commit `chore/` aparte del de F14. `rapida.sh`: 218 pruebas, 13 s.
- **Archivo y registro aplicados (a tu pedido, 2026-10-30):** `registrar.mjs` (78 eventos nuevos, 222 en total; `registro/` ignorado por git) y `archivar.mjs --aplicar F14` (movida a `features/completed/`). El archivo de F14 queda **sin commit**: revísalo con `git status` y commitéalo en un commit `chore/` en su propia rama.
- F14: PR #9 mergeado a `main`. El commit de mantenimiento (`48f4ddd`) se hizo directo en `main`, no en rama aparte (anotado por Franco).
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
