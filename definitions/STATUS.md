# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F14 `hecha` (task-01 y feature confirmadas por Franco, 2026-10-30). Solo queda F11 (informe). F01–F10 y F12–F13 `hecha` y archivadas. F11 (informe) requiere al `arquitecto` y datos de `Registro:`.
Rama: chore/F14-estabilizar-rapida

## Espera a Franco

- F14 `hecha` en `BACKLOG.md` (confirmada por Franco, 2026-10-30). `→` movido a F11.
- **F11 (informe) no se puede descomponer aún:** (1) falta que el `arquitecto` diseñe el informe (métricas, fuente, formato); (2) faltan datos reales: hay 13 líneas `Registro:` en `features/`, pero la mayoría son ejemplos o plantillas de F10/F14; decide cuántas tareas reales quieres como mínimo; (3) falta refinado de alcance. Dime si llamo al `arquitecto` ahora o esperamos más datos.
- Registro de eventos: `node scripts/registrar.mjs` (lo corre Franco o, si lo pide, tú, antes de archivar; no bloquea).
- Feature F14 archivable: `node scripts/archivar.mjs --aplicar F14` (lo corre Franco o, si lo pide, tú, después del PR y en su propio commit `chore/`).
- Feature F14 completa en chore/F14-estabilizar-rapida (con task-01 `hecha`): cierra la rama, haz el PR y despliega.
- Puerta 2 aprobada por Franco (2026-10-30): backlog con F14 `aprobado`; `→` ya en F14.
- Chequeo de contexto: `node scripts/archivar.mjs` (sugerencia, no bloquea).

- **Menciones antiguas en `definitions/REGISTRO.md`** líneas 25 y 55 («no tiene Bash»): no estaban en el encargo del arquitecto. Revisa también el reemplazo por script del arquitecto en `WORKFLOW.md` §3.1, `PROJECT.md` y `ARCHITECTURE.md` (solo se verificó con `grep`).
- Concesión opcional del permiso en Claude Code: tres reglas `allow` en tu `settings.json` (ver `definitions/WORKFLOW.md` §3.1).
- **Registro de eventos:** corre `node scripts/registrar.mjs` cuando quieras (lo corres tú, o yo a tu pedido). `registro/` está ignorado por git.
- **Contexto grande:** F01–F10 ya están archivadas; falta compactar `BACKLOG.md` (planificador, puerta 2; su nota final «Hoy hay N pendientes» puede estar desactualizada) y acortar `WORKFLOW.md` (arquitecto). F12 y F13 ya archivadas.
- **Alinear `definitions/` (arquitecto, sin urgencia):** `REGISTRO.md` §1 (`resultado=confirmar` no se usa; caso `coordinador` en `tarea_estado.por`; comando sin `--reverse` por git 2.54); falta la regla «`registro/` no se lee» en `AGENTS.md`.
- **Riesgo de tiempo:** `rapida.sh` oscila entre 23 y 37 s (tope 30 s); el peso viene de `instalacion.test.mjs` (8–12 s). Conviene una tarea aparte (¿la abrimos?).
- **Antes de publicar el repo (tuyo):** gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar qué son los commits «intrusión». Si aparece algo: rotar la credencial primero. Luego haz público el repo.
- **Comprobación manual de F09 (tuya, con repo público):** comando de una línea en el PC de trabajo, `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`, que tu `modelos.json` quede igual y que la red deje pasar `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`. Guía en el `README.md`.
- **Pendiente sin decidir (tarea aparte):** `instalar.sh --copiar` directo con un `modelos.json` inválido deja roto el personal; `instalar-remoto.sh` ya lo bloquea (R10).
- **Decisión abierta:** tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- **Verificación funcional observable (curl/Playwright):** NO se abre tarea ni se toca `definitions/` por ahora; se resuelve dentro del proyecto real. Solo con fricción repetida se evalúa una regla mínima en `descomponer-feature`. Un `verificador` aparte, solo con datos de `Registro:`.
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- Rama, PR y despliegue de F05: lo haces tú.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
