# Estado del flujo

## Escalación

## Paso actual

Rol: ninguno (esperando a Franco). F10 `hecha` (confirmada por Franco, 2026-10-30): las 3 tareas `hecha`. Queda F11 (informe de resultados), que requiere al `arquitecto` y los datos de ~10 tareas con `Registro:`.
Rama: feature/F10-registro-de-eventos

## Espera a Franco

- Feature F10 completa en feature/F10-registro-de-eventos: cierra la rama, haz el PR y despliega.
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
- Decisiones abiertas de F03: estado del constructor ante una escalación, comandos compuestos en la allowlist y rol del bloqueo.
- `rapida.sh` dejó `pruebas/.temporales/capa1-*`; puedes borrarlo.

## Bloqueos abiertos

Ninguno.

## Última actualización

2026-10-30
