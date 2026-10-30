# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F10 `hecha` (confirmada por Franco, 2026-10-30): las 3 tareas `hecha`. Queda F11 (informe de resultados), que requiere al `arquitecto` y los datos de ~10 tareas con `Registro:`.
Rama: feature/F10-registro-de-eventos

## Espera a Franco

- F10: PR hecho por Franco (2026-10-30).
- Puerta 1 del permiso del coordinador para archivar: aprobada por Franco (2026-10-30), opción B en Pi (bash completo, riesgo aceptado y escrito en `WORKFLOW.md` §3.1.1).
- Backlog con F12: aprobado por Franco (2026-10-30).
- **PUERTA 3 (F12, 7 tareas en `borrador`, una por una)** en `features/F12-coordinador-ejecuta-scripts/`: `task-01-validar-argumentos-scripts.md`, `task-02-coordinador-comandos-claude.md` (depende de 01), `task-03-generacion-pi-claude-instalacion.md` (02), `task-04-fixture-y-comprobador-coordinador.md` (01), `task-05-prueba-modelo-claude-code.md` (02, 04), `task-06-prueba-modelo-pi.md` (03, 04), `task-07-documentar-permisos-y-cierre.md` (05, 06). Decisiones a mirar: task-02, si `tools:` no restringe `Bash` queda `bloqueada` con `BLOQUEO: rol=arquitecto` (no se usa `permissions.allow/deny` global); task-03, en Pi `Bash` sin patrones (inferido, sin verificar); task-01 endurece el CLI y reescribe 2 pruebas de `archivar.test.mjs`; task-05/06 hacen 8 llamadas de modelo cada una. `WORKFLOW.md` §3.1 sigue diciendo «comprobación pendiente»: lo actualiza el arquitecto o Franco tras task-02.
- **Ahora, archivar F01–F10 (tuyo):** desde `main` actualizado: `git switch -c chore/archivar-F01-F10`; `node scripts/registrar.mjs`; `node scripts/archivar.mjs` (chequeo, revisa la lista); `node scripts/archivar.mjs --aplicar`; revisa `git status` y haz el commit. Después avísame para pedir al planificador compactar `BACKLOG.md` (puerta 2).
- **Registro de eventos:** corre `node scripts/registrar.mjs` (lo corres tú, antes de archivar; no bloquea). `registro/` está ignorado por git. Los datos útiles llegan con las próximas tareas: la línea `Registro:` del constructor solo existe desde task-02 de F10.
- **Archivar (tuyo, en su propio commit `chore/`, tras el PR):** `node scripts/archivar.mjs` (chequeo) y luego `--aplicar` con los IDs que correspondan. Candidatas: F01–F10 (F10 tras su PR). Corre antes `registrar.mjs`.
- **Alinear `definitions/` (arquitecto, sin urgencia):** `REGISTRO.md` §1 (`resultado=confirmar` no se usa; caso `coordinador` en `tarea_estado.por`; comando sin `--reverse` por git 2.54); falta la regla «`registro/` no se lee» en `AGENTS.md`.
- **Riesgo de tiempo:** `rapida.sh` oscila entre 23 y 37 s (tope 30 s); el peso viene de `instalacion.test.mjs` (8–12 s). Conviene una tarea aparte (¿la abrimos?). `remoto.test.mjs` y `registrar.test.mjs` ya van fuera de la suite rápida.
- **Antes de publicar el repo (tuyo):** correr gitleaks/trufflehog sobre todo el historial y ramas; revisar `pruebas/resultados/`, correos de autor y nombres de productos o clientes (Don Financio, Andes), `.gitignore`; activar 2FA y proteger `main`; aclarar qué son los commits «intrusión». Si aparece algo: rotar la credencial primero. Luego haz público el repo.
- **Comprobación manual de F09 (tuya, con repo público):** comando de una línea en el PC de trabajo, `claude --agent arquitecto` / `pi-arquitecto`, `--estado` y `--actualizar`, que tu `modelos.json` quede igual y que la red deje pasar `raw.githubusercontent.com`, `api.github.com` y `codeload.github.com`. Guía en el `README.md`.
- **Pendiente sin decidir (tarea aparte):** `instalar.sh --copiar` directo con un `modelos.json` inválido deja roto el personal; `instalar-remoto.sh` ya lo bloquea (R10).
- **Contexto grande:** `BACKLOG.md` y `WORKFLOW.md` superan el umbral de aviso; compactar `BACKLOG.md` es del planificador (puerta 2, tras archivar; su nota final «Hoy hay 3 pendientes» está desactualizada); acortar `WORKFLOW.md`, del arquitecto.
- Como el coordinador es un agente instalado, tras los commits conviene `bash instalar.sh` para actualizar tu copia.
- Rama, PR y despliegue de F05: lo haces tú.
- Decisión abierta: tarea aparte para ajustar `descomponer-feature` (bajar «~5 archivos» a «~3»; que «Completa» no fije conteos ni estados de otros documentos).
- **Pedido por Franco (2026-10-30): verificación funcional observable** (curl o Playwright contra la app levantada). Franco teme sobreconstruir (ya costó mucho montar el kit): NO se abre ninguna tarea ni se toca `definitions/` ahora. Se usa el kit en un proyecto real y la verificación observable se resuelve dentro de ese proyecto (una tarea suya crea su propio comando de prueba si hace falta). Solo si el uso real muestra fricción repetida, se evalúa una regla mínima en `descomponer-feature`. Un `verificador` aparte, solo con datos de `Registro:`.
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
